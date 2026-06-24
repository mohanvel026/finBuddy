// server/routes/photo.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadPhotoMedia } = require('../config/cloudinary');
const {
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
} = require('../controllers/photo.controller');

// ─── Public Album Routes (No authentication required) ───
router.get('/public/album/:inviteCode', getPublicTripPhotos);
router.post('/public/upload/:inviteCode', uploadPhotoMedia.array('photos', 20), uploadPublicPhotos);
router.post('/public/:photoId/vote', votePublicPhoto);
router.post('/public/:photoId/react', reactPublicPhoto);
router.post('/public/:photoId/comment', addPublicComment);
router.get('/public/download/:inviteCode', downloadPublicPhotosZip);
router.get('/public/:inviteCode/ai-recap', getPublicGroupAIRecap);
router.get('/public/:inviteCode/trivia', getPublicGroupTrivia);

// ─── Google OAuth Callbacks (No token needed - triggered by Google redirect) ───
router.get('/drive/callback', handleDriveCallback);
router.get('/drive/mock-callback', handleDriveMockCallback);

// ─── Protected Routes (Requires authentication token) ───
router.use(protect);

router.post('/upload/:groupId', uploadPhotoMedia.array('photos', 20), uploadPhotos);
router.get('/:groupId', getTripPhotos);
router.get('/:groupId/stats', getTripPhotoStats);
router.post('/init/:groupId', initDriveVault);
router.post('/:groupId/analyze', triggerBatchAnalysis);
router.post('/:photoId/vote', votePhoto);
router.post('/:photoId/react', reactPhoto);
router.put('/:photoId/caption', updatePhotoCaption);
router.delete('/:photoId', deletePhoto);
router.get('/:groupId/download', downloadPhotosZip);
router.get('/:groupId/ai-recap', getGroupAIRecap);
router.get('/:groupId/trivia', getGroupTrivia);

// Initiate Google OAuth for Drive
router.get('/drive/auth/:groupId', initiateDriveAuth);

module.exports = router;
