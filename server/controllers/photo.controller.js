// server/controllers/photo.controller.js
const TripPhoto = require('../models/TripPhoto');
const Group = require('../models/Group');
const User = require('../models/User');
const { google } = require('googleapis');
const archiver = require('archiver');
const axios = require('axios');
const { analyzePhotoQuality, analyzeBatchPhotos, quickBlurHeuristic, getAITextCompletion } = require('../algorithms/photoQuality');

// Dynamic Google OAuth2 Client helper
const getOAuth2Client = (groupId = '') => {
  const isMock = !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('dummy');
  
  // Dynamically extract backend base URL from GOOGLE_CALLBACK_URL config
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const idx = callbackUrl.indexOf('/api/auth/google/callback');
  const backendUrl = idx !== -1 ? callbackUrl.substring(0, idx) : 'http://localhost:5000';

  const redirectUri = isMock
    ? `${backendUrl}/api/photos/drive/mock-callback`
    : `${backendUrl}/api/photos/drive/callback`;

  return new google.auth.OAuth2(
    isMock ? 'mock_client_id' : process.env.GOOGLE_CLIENT_ID,
    isMock ? 'mock_client_secret' : process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

// @desc    Redirect to Google Consent Screen for Drive Access
// @route   GET /api/photos/drive/auth/:groupId
const initiateDriveAuth = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Trip group not found' });

    const isMock = !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('dummy');

    if (isMock) {
      // Simulate Google redirection straight to our mock-callback
      return res.redirect(`/api/photos/drive/mock-callback?state=${groupId}&code=mock_code_sandbox`);
    }

    const oauth2Client = getOAuth2Client(groupId);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      prompt: 'consent',     // Forces Google to send refresh token
      scope: ['https://www.googleapis.com/auth/drive.file', 'email'],
      state: groupId
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send(`OAuth initiation failed: ${error.message}`);
  }
};

// @desc    OAuth2 callback for Google Drive permissions
// @route   GET /api/photos/drive/callback
const handleDriveCallback = async (req, res) => {
  try {
    const { code, state: groupId } = req.query;
    if (!code || !groupId) {
      return res.status(400).send('Missing authorization code or group state');
    }

    const group = await Group.findById(groupId).populate('members.user', 'email name');
    if (!group) return res.status(404).send('Trip group not found');

    const oauth2Client = getOAuth2Client(groupId);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store credentials on Group
    group.googleDriveCredentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || group.googleDriveCredentials?.refreshToken,
      expiryDate: tokens.expiry_date,
      ownerEmail: ''
    };

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // 1. Create the dedicated main folder
    const folderMetadata = {
      name: `FinBuddy - ${group.name}`,
      mimeType: 'application/vnd.google-apps.folder'
    };
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, webViewLink'
    });

    // 2. Create the nested AI Highlights folder inside the main folder
    const highlightsMetadata = {
      name: '🌟 AI Best Moments highlights',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [folder.data.id]
    };
    const highlightsFolder = await drive.files.create({
      resource: highlightsMetadata,
      fields: 'id, webViewLink'
    });

    // Make folders visible to anyone with the link & share with all group members
    try {
      await drive.permissions.create({
        fileId: folder.data.id,
        resource: { role: 'reader', type: 'anyone' }
      });
      await drive.permissions.create({
        fileId: highlightsFolder.data.id,
        resource: { role: 'reader', type: 'anyone' }
      });

      // Share folders automatically with all group members (Writer permission)
      for (const member of group.members) {
        if (member.user && member.user.email) {
          try {
            await drive.permissions.create({
              fileId: folder.data.id,
              resource: {
                type: 'user',
                role: 'writer',
                emailAddress: member.user.email
              },
              sendNotificationEmail: false
            });
            await drive.permissions.create({
              fileId: highlightsFolder.data.id,
              resource: {
                type: 'user',
                role: 'writer',
                emailAddress: member.user.email
              },
              sendNotificationEmail: false
            });
            console.log(`Shared Google Drive folder & highlights with member: ${member.user.email}`);
          } catch (mErr) {
            console.error(`Failed to share Drive folder with ${member.user.email}:`, mErr.message);
          }
        }
      }
    } catch (shareErr) {
      console.error('Failed to set permissions on Drive folders:', shareErr.message);
    }

    group.tripDetails = {
      ...group.tripDetails,
      googleDriveFolderId: folder.data.id,
      googleDriveFolderLink: folder.data.webViewLink,
      googleDriveHighlightsFolderId: highlightsFolder.data.id,
      googleDriveHighlightsFolderLink: highlightsFolder.data.webViewLink
    };

    await group.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/split/photos/${groupId}?drive_success=true`);
  } catch (error) {
    console.error('Drive OAuth Callback Error:', error.message);
    res.status(500).send(`Drive OAuth Authentication Failed: ${error.message}`);
  }
};

// @desc    Mock OAuth2 callback (Sandbox Mode)
// @route   GET /api/photos/drive/mock-callback
const handleDriveMockCallback = async (req, res) => {
  try {
    const groupId = req.query.state || req.query.groupId;
    if (!groupId) return res.status(400).send('Missing group context in sandbox');

    const group = await Group.findById(groupId).populate('members.user', 'email name');
    if (!group) return res.status(404).send('Group not found');

    group.googleDriveCredentials = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: 'mock_refresh_token_xyz',
      expiryDate: Date.now() + 3600 * 1000,
      ownerEmail: 'sandbox_user@finbuddy.dev'
    };

    group.tripDetails = {
      ...group.tripDetails,
      googleDriveFolderId: `mock_folder_id_${groupId}`,
      googleDriveFolderLink: `https://drive.google.com/drive/folders/mock_${groupId}`,
      googleDriveHighlightsFolderId: `mock_highlights_folder_${groupId}`,
      googleDriveHighlightsFolderLink: `https://drive.google.com/drive/folders/mock_highlights_${groupId}`
    };

    await group.save();

    // Simulating folder sharing console logs in sandbox
    group.members.forEach(member => {
      if (member.user && member.user.email) {
        console.log(`[SANDBOX] Simulating folder & highlights sharing with member: ${member.user.email}`);
      }
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/split/photos/${groupId}?drive_success=true`);
  } catch (error) {
    res.status(500).send(`Sandbox Auth Failed: ${error.message}`);
  }
};

// Get authenticated Google Drive service instance for a group
const getGroupDriveService = async (group) => {
  if (!group || !group.googleDriveCredentials || !group.googleDriveCredentials.accessToken) {
    return null;
  }

  const isMock = group.googleDriveCredentials.accessToken.startsWith('mock_');
  if (isMock) return 'mock';

  try {
    const oauth2Client = getOAuth2Client(group._id);
    oauth2Client.setCredentials({
      access_token: group.googleDriveCredentials.accessToken,
      refresh_token: group.googleDriveCredentials.refreshToken,
      expiry_date: group.googleDriveCredentials.expiryDate
    });

    // Auto-refresh token if within 5 minutes of expiration
    if (group.googleDriveCredentials.expiryDate && Date.now() > group.googleDriveCredentials.expiryDate - 5 * 60 * 1000) {
      try {
        console.log('🔄 Refreshing Google Drive Access Token...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        group.googleDriveCredentials.accessToken = credentials.access_token;
        if (credentials.refresh_token) group.googleDriveCredentials.refreshToken = credentials.refresh_token;
        group.googleDriveCredentials.expiryDate = credentials.expiry_date;
        await group.save();
      } catch (refreshErr) {
        console.error('Failed to auto-refresh Google Drive token:', refreshErr.message);
        return null;
      }
    }

    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (err) {
    console.error('Failed to construct Google Drive service client:', err.message);
    return null;
  }
};

// Helper to dynamically get or create a nested Google Drive subfolder
const getOrCreateSubfolder = async (drive, parentFolderId, subfolderName) => {
  try {
    const query = `'${parentFolderId}' in parents and name = '${subfolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await drive.files.list({ q: query, fields: 'files(id)' });
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // Create if missing
    const folderMetadata = {
      name: subfolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });
    return folder.data.id;
  } catch (err) {
    console.error(`⚠️ Subfolder fetch error for ${subfolderName}:`, err.message);
    return parentFolderId; // fallback to parent if error
  }
};

// Async non-blocking background worker to stream files to custom folders on Google Drive
const syncPhotoToDriveBackground = async (photoId, groupId, userName, originalName, mimeType, cloudinaryUrl, isHighlightFolder = false) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    const driveFolderId = isHighlightFolder
      ? group.tripDetails?.googleDriveHighlightsFolderId
      : group.tripDetails?.googleDriveFolderId;
    if (!driveFolderId) return;

    const drive = await getGroupDriveService(group);
    if (!drive) return;

    // Get Socket.io instance
    const { getIO } = require('../sockets/index');

    if (drive === 'mock') {
      // Sandbox Mode: Delay and simulate direct-to-Google Drive upload
      setTimeout(async () => {
        try {
          const mockDriveLink = `https://drive.google.com/open?id=mock_file_${photoId}`;
          
          let updatedPhoto;
          if (isHighlightFolder) {
            // Highlights folder mock complete (just log success)
            updatedPhoto = await TripPhoto.findById(photoId);
            console.log(`📁 [SANDBOX Highlights] Sync successful for photo [${originalName}]`);
          } else {
            updatedPhoto = await TripPhoto.findByIdAndUpdate(photoId, {
              $set: {
                driveFileId: `mock_file_${photoId}`,
                driveFileLink: mockDriveLink,
                driveSynced: true
              }
            }, { new: true });

            // Broadcast direct to client room
            try {
              const io = getIO();
              io.to(`group-${groupId}`).emit('photo:drive-synced', {
                photoId: updatedPhoto._id,
                driveFileLink: updatedPhoto.driveFileLink,
                driveSynced: true
              });
            } catch (sErr) {}
            
            console.log(`📁 [SANDBOX Main] Sync successful for photo [${originalName}]`);
          }
        } catch (e) {
          console.error('[SANDBOX] Mock sync update failed:', e.message);
        }
      }, 3000);
      return;
    }

    // Real Google Drive Upload Flow
    // Create or retrieve subfolder specifically for this user (skip user folder grouping if it is the highlight folder)
    const targetFolderId = isHighlightFolder
      ? driveFolderId
      : await getOrCreateSubfolder(drive, driveFolderId, `Uploads - ${userName}`);

    // Stream from Cloudinary directly to Google Drive
    const fileStream = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream'
    });

    const fileMetadata = {
      name: originalName,
      parents: [targetFolderId]
    };

    const driveFile = await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: mimeType || 'image/jpeg',
        body: fileStream.data
      },
      fields: 'id, webViewLink'
    });

    let updatedPhoto;
    if (isHighlightFolder) {
      updatedPhoto = await TripPhoto.findById(photoId);
      console.log(`📁 Google Drive Sync Highlights Successful: [${originalName}] synced to Highlights folder`);
    } else {
      updatedPhoto = await TripPhoto.findByIdAndUpdate(photoId, {
        $set: {
          driveFileId: driveFile.data.id,
          driveFileLink: driveFile.data.webViewLink,
          driveSynced: true
        }
      }, { new: true });

      // Emit live socket event to notify frontend that Google Drive sync is complete!
      try {
        const io = getIO();
        io.to(`group-${groupId}`).emit('photo:drive-synced', {
          photoId: updatedPhoto._id,
          driveFileLink: updatedPhoto.driveFileLink,
          driveSynced: true
        });
      } catch (sErr) {}

      console.log(`📁 Background Google Drive Sync Successful: [${originalName}] synced to main folder`);
    }
  } catch (err) {
    console.error(`❌ Background Google Drive Sync Failed for [${originalName}]:`, err.message);
  }
};

// Background helper to analyze uploaded photos and update database + sync highlights
const runAutoAICuration = async (photosList, groupId) => {
  try {
    if (!photosList || photosList.length === 0) return;

    const group = await Group.findById(groupId);
    if (!group) return;

    const hasDrive = !!group.tripDetails?.googleDriveFolderId;
    const { getIO } = require('../sockets/index');
    let io;
    try {
      io = getIO();
    } catch (sInitErr) {
      console.warn('Socket.io not yet initialized, skipping progress broadcasts');
    }

    // 1. Broadcast AI Curation Start
    if (io) {
      try {
        io.to(`group-${groupId}`).emit('photo:ai-curation-start', {
          count: photosList.length
        });
      } catch (sErr) {}
    }

    console.log(`🤖 [AI Curation] Started background analysis of ${photosList.length} photos for group ${groupId}...`);

    // 2. Call batch analysis
    const { analyzed } = await analyzeBatchPhotos(photosList);

    // 3. Save each result and broadcast
    for (const item of analyzed) {
      if (!item) continue;

      const updatedPhoto = await TripPhoto.findByIdAndUpdate(item.photoId, {
        $set: {
          aiQualityScore: item.qualityScore,
          aiQualityLabel: item.qualityLabel,
          aiTags: item.tags,
          aiDescription: item.description,
          isBlurry: item.isBlurry,
          isBestPhoto: item.isBestPhoto
        }
      }, { new: true });

      if (updatedPhoto) {
        // Broadcast curated photo updates to group in real-time
        if (io) {
          try {
            io.to(`group-${groupId}`).emit('photo:ai-curated', {
              photoId: updatedPhoto._id,
              aiQualityScore: updatedPhoto.aiQualityScore,
              aiQualityLabel: updatedPhoto.aiQualityLabel,
              aiTags: updatedPhoto.aiTags,
              aiDescription: updatedPhoto.aiDescription,
              isBlurry: updatedPhoto.isBlurry,
              isBestPhoto: updatedPhoto.isBestPhoto
            });
          } catch (sErr) {}
        }

        // If it's a best photo, copy it to the Highlights Google Drive folder
        if (updatedPhoto.isBestPhoto && hasDrive) {
          console.log(`🌟 [AI Highlights] Syncing Best Photo [${updatedPhoto.fileName}] to Highlights Drive folder`);
          syncPhotoToDriveBackground(
            updatedPhoto._id,
            groupId,
            updatedPhoto.uploadedByName || 'Friend',
            updatedPhoto.fileName || 'highlight.jpg',
            updatedPhoto.mimeType || 'image/jpeg',
            updatedPhoto.cloudinaryUrl,
            true // isHighlightFolder = true
          );
        }
      }
    }

    // 4. Broadcast AI Curation End
    if (io) {
      try {
        io.to(`group-${groupId}`).emit('photo:ai-curation-end', {
          success: true
        });
      } catch (sErr) {}
    }

    console.log(`🤖 [AI Curation] Completed successfully for group ${groupId}`);
  } catch (err) {
    console.error(`❌ [AI Curation] Background job failed:`, err.message);
  }
};

// @desc    Upload multiple photos to vault with Drive sync and heuristic pre-filter
// @route   POST /api/photos/upload/:groupId
const uploadPhotos = async (req, res) => {
  try {
    const { groupId } = req.params;
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photo files provided' });
    }

    const group = await Group.findById(groupId).populate('members.user', 'email name');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip group not found' });
    }

    const isMember = group.members.some(
      m => (m.user._id || m.user).toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can upload photos' });
    }

    const hasDrive = !!group.tripDetails?.googleDriveFolderId;
    const uploadedPhotos = [];

    // Process each uploaded file
    for (const file of files) {
      const url = file.path || file.url;
      const publicId = file.filename || file.public_id || `trip_${groupId}_${Date.now()}`;
      const originalName = file.originalname || 'photo.jpg';
      const size = file.size || 0;

      // Blur heuristic pre-filter
      const isLikelyBlurry = quickBlurHeuristic({ size, filename: originalName });

      // Build initial document (analysis is marked null for manual / background analysis)
      const photo = await TripPhoto.create({
        group: groupId,
        uploadedBy: req.user._id,
        uploadedByName: req.user.name,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        fileName: originalName,
        originalName: originalName,
        fileSize: size,
        mimeType: file.mimetype || 'image/jpeg',
        isBlurry: isLikelyBlurry
      });

      // Broadcast photo addition immediately to group channel
      try {
        const { getIO } = require('../sockets/index');
        const io = getIO();
        io.to(`group-${groupId}`).emit('photo:new', {
          ...photo.toJSON(),
          uploadedBy: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
        });
      } catch (sErr) {}

      // Non-blocking background Drive Sync task if Google Drive is linked
      if (hasDrive) {
        syncPhotoToDriveBackground(
          photo._id,
          groupId,
          req.user.name || 'Friend',
          originalName,
          file.mimetype,
          url
        );
      }

      uploadedPhotos.push(photo);
    }

    // Trigger non-blocking background AI curation
    runAutoAICuration(uploadedPhotos, groupId).catch(err => {
      console.error('Error triggering auto AI curation:', err.message);
    });

    res.status(201).json({
      success: true,
      message: hasDrive
        ? `${files.length} photo(s) uploaded! 📸 AI curation & Google Drive sync are running in the background.`
        : `${files.length} photo(s) uploaded successfully! 📸 (Link Google Drive to auto-backup)`,
      photos: uploadedPhotos,
      driveLink: group.tripDetails?.googleDriveFolderLink || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trip photos (handles sorting, filters, pagination)
// @route   GET /api/photos/:groupId
const getTripPhotos = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 30, sortBy = 'latest', bestOnly, uploadedBy } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can view these photos' });
    }

    const query = { group: groupId, isDeleted: false };
    if (bestOnly === 'true') query.isBestPhoto = true;
    if (uploadedBy) query.uploadedBy = uploadedBy;

    let sort = { createdAt: -1 };
    if (sortBy === 'quality') sort = { aiQualityScore: -1 };
    if (sortBy === 'votes') sort = { voteCount: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };

    const totalPhotos = await TripPhoto.countDocuments(query);
    const photos = await TripPhoto.find(query)
      .populate('uploadedBy', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      photos,
      driveFolder: {
        isSetup: !!group?.tripDetails?.googleDriveFolderId,
        link: group?.tripDetails?.googleDriveFolderLink || null
      },
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(totalPhotos / limit),
        total: totalPhotos
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get stats for trip photos
// @route   GET /api/photos/:groupId/stats
const getTripPhotoStats = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can access stats' });
    }

    const photos = await TripPhoto.find({ group: groupId, isDeleted: false }).populate('uploadedBy', 'name avatar');

    const total = photos.length;
    const bestCount = photos.filter(p => p.isBestPhoto).length;
    const blurCount = photos.filter(p => p.isBlurry).length;
    const analyzed = photos.filter(p => p.aiQualityScore !== null).length;
    const pendingAnalysis = photos.filter(p => p.aiQualityScore === null).length;

    // Contributions by member
    const memberCounts = {};
    photos.forEach(p => {
      const uId = p.uploadedBy?._id?.toString() || 'unknown';
      if (!memberCounts[uId]) {
        memberCounts[uId] = {
          user: p.uploadedBy,
          photoCount: 0,
          bestCount: 0
        };
      }
      memberCounts[uId].photoCount++;
      if (p.isBestPhoto) memberCounts[uId].bestCount++;
    });

    const byMember = Object.values(memberCounts);

    res.json({
      success: true,
      stats: {
        total,
        bestCount,
        blurCount,
        analyzed,
        pendingAnalysis,
        byMember,
        driveFolder: {
          isSetup: !!group.tripDetails?.googleDriveFolderId,
          name: `FinBuddy - ${group.name}`,
          link: group.tripDetails?.googleDriveFolderLink || `https://drive.google.com/drive/folders/${group.tripDetails?.googleDriveFolderId}`
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initialize Google Drive Folder manually
// @route   POST /api/photos/init/:groupId
const initDriveVault = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members.user', 'email name');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    let driveFolderId = group.tripDetails?.googleDriveFolderId;
    const drive = getGoogleDriveService();
    if (!drive) {
      return res.status(400).json({ success: false, message: 'Google Drive integration is not configured on server' });
    }

    if (!driveFolderId) {
      const folderMetadata = {
        name: `FinBuddy - ${group.name}`,
        mimeType: 'application/vnd.google-apps.folder'
      };
      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id, webViewLink'
      });
      driveFolderId = folder.data.id;

      // Update group
      await Group.findByIdAndUpdate(groupId, {
        $set: {
          'tripDetails.googleDriveFolderId': driveFolderId,
          'tripDetails.googleDriveFolderLink': folder.data.webViewLink
        }
      });

      // Share folder
      for (const m of group.members) {
        if (m.user?.email) {
          try {
            await drive.permissions.create({
              fileId: driveFolderId,
              resource: {
                type: 'user',
                role: 'writer',
                emailAddress: m.user.email
              },
              sendNotificationEmail: false
            });
          } catch (e) {
            console.error('Failed to share drive folder with', m.user.email, e.message);
          }
        }
      }
    }

    res.json({ success: true, message: 'Google Drive vault initialized successfully! 📁' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger batch OpenAI curation analysis
// @route   POST /api/photos/:groupId/analyze
const triggerBatchAnalysis = async (req, res) => {
  try {
    const { groupId } = req.params;
    const pendingPhotos = await TripPhoto.find({
      group: groupId,
      aiQualityScore: null,
      isDeleted: false
    });

    if (pendingPhotos.length === 0) {
      return res.json({ success: true, message: 'All photos are already analyzed!' });
    }

    // Run batch analysis asynchronously
    analyzeBatchPhotos(pendingPhotos)
      .then(async ({ analyzed }) => {
        for (const item of analyzed) {
          if (!item) continue;
          await TripPhoto.findByIdAndUpdate(item.photoId, {
            $set: {
              aiQualityScore: item.qualityScore,
              aiQualityLabel: item.qualityLabel,
              aiTags: item.tags,
              aiDescription: item.description,
              isBlurry: item.isBlurry,
              isBestPhoto: item.isBestPhoto
            }
          });
        }
        console.log(`🤖 Curation complete! Analyzed ${analyzed.length} photos for group ${groupId}`);
      })
      .catch(err => {
        console.error('Background batch analysis failed:', err.message);
      });

    res.json({
      success: true,
      message: 'Curation queued! AI analysis has started in the background.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle vote on photo
// @route   POST /api/photos/:photoId/vote
const votePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user._id;

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const hasVoted = photo.votes.some(v => v.user.toString() === userId.toString());

    if (hasVoted) {
      photo.votes = photo.votes.filter(v => v.user.toString() !== userId.toString());
    } else {
      photo.votes.push({ user: userId });
    }

    photo.voteCount = photo.votes.length;
    await photo.save();

    res.json({
      success: true,
      voteCount: photo.voteCount,
      hasVoted: !hasVoted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete photo from vault
// @route   DELETE /api/photos/:photoId
const deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    // Validate ownership
    if (photo.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorised delete request' });
    }

    photo.isDeleted = true;
    await photo.save();

    // Delete from Drive if possible
    if (photo.driveFileId) {
      const drive = getGoogleDriveService();
      if (drive) {
        try {
          await drive.files.delete({ fileId: photo.driveFileId });
        } catch (e) {
          console.error('Failed to delete file from Google Drive:', e.message);
        }
      }
    }

    res.json({ success: true, message: 'Photo deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download photos as ZIP archive
// @route   GET /api/photos/:groupId/download
const downloadPhotosZip = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { bestOnly } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip group not found' });
    }
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can download these photos' });
    }

    const query = { group: groupId, isDeleted: false };
    if (bestOnly === 'true') query.isBestPhoto = true;

    const photos = await TripPhoto.find(query);
    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'No photos to download' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=trip_${groupId}_photos.zip`);

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const photo of photos) {
      try {
        const response = await axios({
          method: 'get',
          url: photo.cloudinaryUrl,
          responseType: 'stream'
        });
        archive.append(response.data, { name: photo.fileName || 'photo.jpg' });
      } catch (err) {
        console.error(`Skipping download for photo ${photo._id}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle emoji reaction on photo
// @route   POST /api/photos/:photoId/react
const reactPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!['❤️', '😂', '🔥'].includes(emoji)) {
      return res.status(400).json({ success: false, message: 'Invalid emoji reaction' });
    }

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const group = await Group.findById(photo.group);
    const isMember = group?.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can react to photos' });
    }

    const existingIndex = photo.reactions.findIndex(r => r.user.toString() === userId.toString());
    let hasReacted = false;

    if (existingIndex !== -1) {
      if (photo.reactions[existingIndex].emoji === emoji) {
        photo.reactions.splice(existingIndex, 1);
      } else {
        photo.reactions[existingIndex].emoji = emoji;
        photo.reactions[existingIndex].reactedAt = new Date();
        hasReacted = true;
      }
    } else {
      photo.reactions.push({ user: userId, emoji });
      hasReacted = true;
    }

    await photo.save();

    res.json({
      success: true,
      reactions: photo.reactions,
      hasReacted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update caption of a photo
// @route   PUT /api/photos/:photoId/caption
const updatePhotoCaption = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { caption } = req.body;
    const userId = req.user._id;

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    if (photo.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the uploader can edit the caption' });
    }

    photo.caption = caption;
    await photo.save();

    res.json({
      success: true,
      message: 'Caption updated successfully!',
      photo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public trip photos using inviteCode
// @route   GET /api/photos/public/album/:inviteCode
const getPublicTripPhotos = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { page = 1, limit = 50, sortBy = 'latest', bestOnly } = req.query;

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip album not found. Invalid link!' });
    }

    const query = { group: group._id, isDeleted: false };
    if (bestOnly === 'true') query.isBestPhoto = true;

    let sort = { createdAt: -1 };
    if (sortBy === 'quality') sort = { aiQualityScore: -1 };
    if (sortBy === 'votes') sort = { voteCount: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };

    const totalPhotos = await TripPhoto.countDocuments(query);
    const photos = await TripPhoto.find(query)
      .populate('uploadedBy', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        emoji: group.emoji,
        destination: group.tripDetails?.destination || '',
        startDate: group.tripDetails?.startDate || null,
        endDate: group.tripDetails?.endDate || null,
        inviteCode: group.inviteCode,
        driveLink: group.tripDetails?.googleDriveFolderLink || null,
        hasDrive: !!group.tripDetails?.googleDriveFolderId
      },
      photos,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(totalPhotos / limit),
        total: totalPhotos
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload photos to public album using inviteCode
// @route   POST /api/photos/public/upload/:inviteCode
const uploadPublicPhotos = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { uploadedByName = 'Guest' } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photo files provided' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip group not found' });
    }

    const hasDrive = !!group.tripDetails?.googleDriveFolderId;
    const uploadedPhotos = [];

    // Process each uploaded file
    for (const file of files) {
      const url = file.path || file.url;
      const publicId = file.filename || file.public_id || `trip_public_${group._id}_${Date.now()}`;
      const originalName = file.originalname || 'photo.jpg';
      const size = file.size || 0;

      // Blur heuristic pre-filter
      const isLikelyBlurry = quickBlurHeuristic({ size, filename: originalName });

      // Build initial document (analysis is marked null for manual / background analysis)
      const photo = await TripPhoto.create({
        group: group._id,
        uploadedBy: null, // guest
        uploadedByName: uploadedByName,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        fileName: originalName,
        originalName: originalName,
        fileSize: size,
        mimeType: file.mimetype || 'image/jpeg',
        isBlurry: isLikelyBlurry
      });

      // Broadcast photo addition immediately to group channel
      try {
        const { getIO } = require('../sockets/index');
        const io = getIO();
        io.to(`group-${group._id}`).emit('photo:new', {
          ...photo.toJSON(),
          uploadedBy: null,
          uploadedByName
        });
      } catch (sErr) {}

      // Non-blocking background Drive Sync task if Google Drive is linked
      if (hasDrive) {
        syncPhotoToDriveBackground(
          photo._id,
          group._id,
          uploadedByName,
          originalName,
          file.mimetype,
          url
        );
      }

      uploadedPhotos.push(photo);
    }

    // Trigger non-blocking background AI curation
    runAutoAICuration(uploadedPhotos, group._id).catch(err => {
      console.error('Error triggering auto AI curation for guest upload:', err.message);
    });

    res.status(201).json({
      success: true,
      message: hasDrive
        ? `${files.length} photo(s) uploaded! 📸 AI curation & Google Drive sync are running in the background.`
        : `${files.length} photo(s) uploaded successfully! 📸`,
      photos: uploadedPhotos
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle public vote on photo
// @route   POST /api/photos/public/:photoId/vote
const votePublicPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { clientUuid } = req.body; // Guest identifier

    if (!clientUuid) {
      return res.status(400).json({ success: false, message: 'Client identifier is required' });
    }

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const hasVoted = photo.votes.some(v => v.user && v.user.toString() === clientUuid);

    if (hasVoted) {
      photo.votes = photo.votes.filter(v => v.user && v.user.toString() !== clientUuid);
    } else {
      photo.votes.push({ user: clientUuid });
    }

    photo.voteCount = photo.votes.length;
    await photo.save();

    // Broadcast vote update
    try {
      const { getIO } = require('../sockets/index');
      const io = getIO();
      io.to(`group-${photo.group}`).emit('photo:vote', {
        photoId: photo._id,
        voteCount: photo.voteCount,
        hasVoted: !hasVoted,
        userId: clientUuid
      });
    } catch (sErr) {}

    res.json({
      success: true,
      voteCount: photo.voteCount,
      hasVoted: !hasVoted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle emoji reaction on public photo
// @route   POST /api/photos/public/:photoId/react
const reactPublicPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { emoji, clientUuid } = req.body;

    if (!clientUuid) {
      return res.status(400).json({ success: false, message: 'Client identifier is required' });
    }
    if (!['❤️', '😂', '🔥'].includes(emoji)) {
      return res.status(400).json({ success: false, message: 'Invalid emoji reaction' });
    }

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const existingIndex = photo.reactions.findIndex(r => r.user && r.user.toString() === clientUuid);
    let hasReacted = false;

    if (existingIndex !== -1) {
      if (photo.reactions[existingIndex].emoji === emoji) {
        photo.reactions.splice(existingIndex, 1);
      } else {
        photo.reactions[existingIndex].emoji = emoji;
        photo.reactions[existingIndex].reactedAt = new Date();
        hasReacted = true;
      }
    } else {
      photo.reactions.push({ user: clientUuid, emoji });
      hasReacted = true;
    }

    await photo.save();

    // Broadcast reaction update
    try {
      const { getIO } = require('../sockets/index');
      const io = getIO();
      io.to(`group-${photo.group}`).emit('photo:react', {
        photoId: photo._id,
        reactions: photo.reactions
      });
    } catch (sErr) {}

    res.json({
      success: true,
      reactions: photo.reactions,
      hasReacted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to photo (public or member)
// @route   POST /api/photos/public/:photoId/comment
const addPublicComment = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { userName = 'Guest', text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const photo = await TripPhoto.findById(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const comment = {
      userName: req.user ? req.user.name : userName,
      text: text.trim(),
      createdAt: new Date()
    };

    photo.comments.push(comment);
    await photo.save();

    // Broadcast comment update
    try {
      const { getIO } = require('../sockets/index');
      const io = getIO();
      io.to(`group-${photo.group}`).emit('photo:comment', {
        photoId: photo._id,
        comment,
        comments: photo.comments
      });
    } catch (sErr) {}

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      comment,
      comments: photo.comments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download photos as ZIP archive via public link
// @route   GET /api/photos/public/download/:inviteCode
const downloadPublicPhotosZip = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { bestOnly } = req.query;

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Trip group not found' });
    }

    const query = { group: group._id, isDeleted: false };
    if (bestOnly === 'true') query.isBestPhoto = true;

    const photos = await TripPhoto.find(query);
    if (photos.length === 0) {
      return res.status(404).json({ success: false, message: 'No photos to download' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=trip_${group.name.replace(/\s+/g, '_')}_photos.zip`);

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const photo of photos) {
      try {
        const response = await axios({
          method: 'get',
          url: photo.cloudinaryUrl,
          responseType: 'stream'
        });
        archive.append(response.data, { name: photo.fileName || 'photo.jpg' });
      } catch (err) {
        console.error(`Skipping public download for photo ${photo._id}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate AI Travel Diary / Recap for the trip group
// @route   GET /api/photos/:groupId/ai-recap
const getGroupAIRecap = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Ensure user is member
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can generate AI recaps' });
    }

    // Fetch all analyzed photos for this group
    const photos = await TripPhoto.find({
      group: groupId,
      aiDescription: { $ne: null, $ne: '' },
      isDeleted: false
    }).sort({ createdAt: 1 });

    if (photos.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 3 analyzed photos to generate a travel diary! Upload some photos and let AI analyze them.'
      });
    }

    // Compile descriptions
    const list = photos
      .map((p, idx) => `Photo ${idx + 1} (Uploaded by ${p.uploadedByName || p.uploadedBy?.name || 'Member'}): ${p.aiDescription}`)
      .join('\n');

    const prompt = `You are a creative travel blogger and AI memories writer. Write a fun, nostalgic, and highly engaging travel diary recap of the trip "${group.name}".
Based on these photo descriptions in chronological order:
${list}

Write exactly 2-3 paragraphs. Focus on the highlights, the collective vibe, and frame it as a beautiful trip journal memory. Do not mention photo numbers (e.g. don't write "In Photo 1..."), just write a seamless travel story. Include a few matching emojis!`;

    const recap = await getAITextCompletion(prompt);

    res.json({
      success: true,
      recap: recap.trim()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate public AI Travel Diary / Recap for the guest vault
// @route   GET /api/photos/public/:inviteCode/ai-recap
const getPublicGroupAIRecap = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ success: false, message: 'Trip group not found' });

    // Fetch all analyzed photos for this group
    const photos = await TripPhoto.find({
      group: group._id,
      aiDescription: { $ne: null, $ne: '' },
      isDeleted: false
    }).sort({ createdAt: 1 });

    if (photos.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 3 analyzed photos to generate a travel diary!'
      });
    }

    // Compile descriptions
    const list = photos
      .map((p, idx) => `Photo ${idx + 1} (Uploaded by ${p.uploadedByName || 'Guest'}): ${p.aiDescription}`)
      .join('\n');

    const prompt = `You are a creative travel blogger and AI memories writer. Write a fun, nostalgic, and highly engaging travel diary recap of the trip "${group.name}".
Based on these photo descriptions in chronological order:
${list}

Write exactly 2-3 paragraphs. Focus on the highlights, the collective vibe, and frame it as a beautiful trip journal memory. Do not mention photo numbers (e.g. don't write "In Photo 1..."), just write a seamless travel story. Include a few matching emojis!`;

    const recap = await getAITextCompletion(prompt);

    res.json({
      success: true,
      recap: recap.trim()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a memory trivia quiz based on trip photos
// @route   GET /api/photos/:groupId/trivia
const getGroupTrivia = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Ensure user is member
    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only trip group members can access trivia' });
    }

    const photos = await TripPhoto.find({ group: groupId, isDeleted: false }).populate('uploadedBy', 'name');
    if (photos.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 3 photos in the vault to generate a trivia game! Please upload more photos first.'
      });
    }

    const quiz = [];

    // Question 1: Who uploaded a specific photo?
    const targetPhoto = photos[Math.floor(Math.random() * photos.length)];
    const uploaderName = targetPhoto.uploadedByName || targetPhoto.uploadedBy?.name || 'Guest';
    const otherUploaders = Array.from(new Set(photos.map(p => p.uploadedByName || p.uploadedBy?.name || 'Guest'))).filter(name => name !== uploaderName);
    
    const options1 = [uploaderName];
    while (options1.length < 4 && otherUploaders.length > 0) {
      const opt = otherUploaders.pop();
      if (!options1.includes(opt)) options1.push(opt);
    }
    const backupNames = ['Alex', 'Sam', 'Taylor', 'Jordan'];
    while (options1.length < 4) {
      const opt = backupNames.pop();
      if (!options1.includes(opt)) options1.push(opt);
    }
    options1.sort(() => Math.random() - 0.5);

    quiz.push({
      id: 'q1',
      question: `Who uploaded this photo: "${targetPhoto.caption || targetPhoto.aiDescription || targetPhoto.fileName}"?`,
      options: options1,
      answer: uploaderName,
      imageUrl: targetPhoto.cloudinaryUrl
    });

    // Question 2: What tag did AI give this photo?
    const taggedPhotos = photos.filter(p => p.aiTags && p.aiTags.length > 0);
    if (taggedPhotos.length > 0) {
      const tagPhoto = taggedPhotos[Math.floor(Math.random() * taggedPhotos.length)];
      const correctTag = tagPhoto.aiTags[0];
      const allPossibleTags = ['food', 'landscape', 'portrait', 'party', 'mountain', 'beach', 'indoor', 'action', 'nature', 'city'];
      const wrongTags = allPossibleTags.filter(t => !tagPhoto.aiTags.includes(t));
      
      const options2 = [correctTag];
      while (options2.length < 4 && wrongTags.length > 0) {
        const opt = wrongTags.pop();
        if (!options2.includes(opt)) options2.push(opt);
      }
      options2.sort(() => Math.random() - 0.5);

      quiz.push({
        id: 'q2',
        question: `Which tag did the AI analyzer assign to this picture?`,
        options: options2.map(t => `#${t}`),
        answer: `#${correctTag}`,
        imageUrl: tagPhoto.cloudinaryUrl
      });
    }

    // Question 3: How many best photos did AI select as highlights?
    const bestCount = photos.filter(p => p.isBestPhoto).length;
    const options3 = [bestCount, bestCount + 2, Math.max(0, bestCount - 1), bestCount + 4];
    const uniqueOptions3 = Array.from(new Set(options3)).slice(0, 4);
    while (uniqueOptions3.length < 4) {
      uniqueOptions3.push(uniqueOptions3.length + 10);
    }
    uniqueOptions3.sort((a, b) => a - b);

    quiz.push({
      id: 'q3',
      question: `How many photos in this album have been selected as "🌟 AI Best Moments highlights" so far?`,
      options: uniqueOptions3.map(String),
      answer: String(bestCount)
    });

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a public memory trivia quiz based on trip photos
// @route   GET /api/photos/public/:inviteCode/trivia
const getPublicGroupTrivia = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const photos = await TripPhoto.find({ group: group._id, isDeleted: false }).populate('uploadedBy', 'name');
    if (photos.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 3 photos in the vault to generate a trivia game!'
      });
    }

    const quiz = [];

    // Question 1: Who uploaded a specific photo?
    const targetPhoto = photos[Math.floor(Math.random() * photos.length)];
    const uploaderName = targetPhoto.uploadedByName || targetPhoto.uploadedBy?.name || 'Guest';
    const otherUploaders = Array.from(new Set(photos.map(p => p.uploadedByName || p.uploadedBy?.name || 'Guest'))).filter(name => name !== uploaderName);
    
    const options1 = [uploaderName];
    while (options1.length < 4 && otherUploaders.length > 0) {
      const opt = otherUploaders.pop();
      if (!options1.includes(opt)) options1.push(opt);
    }
    const backupNames = ['Alex', 'Sam', 'Taylor', 'Jordan'];
    while (options1.length < 4) {
      const opt = backupNames.pop();
      if (!options1.includes(opt)) options1.push(opt);
    }
    options1.sort(() => Math.random() - 0.5);

    quiz.push({
      id: 'q1',
      question: `Who uploaded this photo: "${targetPhoto.caption || targetPhoto.aiDescription || targetPhoto.fileName}"?`,
      options: options1,
      answer: uploaderName,
      imageUrl: targetPhoto.cloudinaryUrl
    });

    // Question 2: What tag did AI give this photo?
    const taggedPhotos = photos.filter(p => p.aiTags && p.aiTags.length > 0);
    if (taggedPhotos.length > 0) {
      const tagPhoto = taggedPhotos[Math.floor(Math.random() * taggedPhotos.length)];
      const correctTag = tagPhoto.aiTags[0];
      const allPossibleTags = ['food', 'landscape', 'portrait', 'party', 'mountain', 'beach', 'indoor', 'action', 'nature', 'city'];
      const wrongTags = allPossibleTags.filter(t => !tagPhoto.aiTags.includes(t));
      
      const options2 = [correctTag];
      while (options2.length < 4 && wrongTags.length > 0) {
        const opt = wrongTags.pop();
        if (!options2.includes(opt)) options2.push(opt);
      }
      options2.sort(() => Math.random() - 0.5);

      quiz.push({
        id: 'q2',
        question: `Which tag did the AI analyzer assign to this picture?`,
        options: options2.map(t => `#${t}`),
        answer: `#${correctTag}`,
        imageUrl: tagPhoto.cloudinaryUrl
      });
    }

    // Question 3: How many best photos did AI select as highlights?
    const bestCount = photos.filter(p => p.isBestPhoto).length;
    const options3 = [bestCount, bestCount + 2, Math.max(0, bestCount - 1), bestCount + 4];
    const uniqueOptions3 = Array.from(new Set(options3)).slice(0, 4);
    while (uniqueOptions3.length < 4) {
      uniqueOptions3.push(uniqueOptions3.length + 10);
    }
    uniqueOptions3.sort((a, b) => a - b);

    quiz.push({
      id: 'q3',
      question: `How many photos in this album have been selected as "🌟 AI Best Moments highlights" so far?`,
      options: uniqueOptions3.map(String),
      answer: String(bestCount)
    });

    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadPhotos,
  getTripPhotos,
  getTripPhotoStats,
  initDriveVault,
  triggerBatchAnalysis,
  votePhoto,
  deletePhoto,
  downloadPhotosZip,
  reactPhoto,
  updatePhotoCaption,
  initiateDriveAuth,
  handleDriveCallback,
  handleDriveMockCallback,
  getPublicTripPhotos,
  uploadPublicPhotos,
  votePublicPhoto,
  reactPublicPhoto,
  addPublicComment,
  downloadPublicPhotosZip,
  getGroupAIRecap,
  getPublicGroupAIRecap,
  getGroupTrivia,
  getPublicGroupTrivia
};
