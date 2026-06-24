// client/src/pages/TripPhotoVault.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { connectSocket, getSocket } from '../services/socket';

// ─── Quality badge ────────────────────────────────────────
const QualityBadge = ({ label, score }) => {
  if (!label) return null;
  const config = {
    excellent: { color: 'bg-green-500/20 text-green-400 border-green-500/30',  icon: '⭐' },
    good:      { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',     icon: '✅' },
    average:   { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '👍' },
    poor:      { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '⚠️' },
    blurry:    { color: 'bg-red-500/20 text-red-400 border-red-500/30',        icon: '🌫️' },
  }[label] || { color: 'bg-white/10 text-slate-400', icon: '📷' };

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.icon} {label} {score ? `(${score})` : ''}
    </span>
  );
};

// ─── Single Photo Card ────────────────────────────────────
// ─── Single Photo Card ────────────────────────────────────
const PhotoCard = ({ photo, onVote, onReact, onDelete, currentUserId, hasDrive }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState(photo.caption || '');

  const hasVoted = photo.votes?.some(v => (v.user?._id || v.user) === currentUserId);
  const isOwner = (photo.uploadedBy?._id || photo.uploadedBy) === currentUserId;

  const reactionCounts = {
    '❤️': photo.reactions?.filter(r => r.emoji === '❤️').length || 0,
    '😂': photo.reactions?.filter(r => r.emoji === '😂').length || 0,
    '🔥': photo.reactions?.filter(r => r.emoji === '🔥').length || 0
  };

  const myReactions = photo.reactions?.filter(r => (r.user?._id || r.user) === currentUserId).map(r => r.emoji) || [];

  return (
    <div className={`relative group rounded-2xl overflow-hidden border transition-all ${
      photo.isBestPhoto
        ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/10'
        : 'border-white/5 hover:border-white/15'
    }`}>
      {/* Image */}
      <div className="aspect-square bg-white/5 relative">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={photo.cloudinaryUrl}
          alt={photo.caption || photo.aiDescription || photo.fileName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
        />

        {/* Best photo crown */}
        {photo.isBestPhoto && (
          <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-full">
            ⭐ Best
          </div>
        )}

        {/* Blurry warning */}
        {photo.isBlurry && (
          <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-full">
            🌫️ Blurry
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {photo.aiTags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs bg-black/40 text-white px-1.5 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Vote button */}
              <button
                onClick={() => onVote(photo._id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition ${
                  hasVoted
                    ? 'bg-red-500/80 text-white'
                    : 'bg-white/20 text-white hover:bg-red-500/60'
                }`}
              >
                ❤️ {photo.voteCount || 0}
              </button>

              {/* Drive link */}
              {photo.driveFileLink && (
                <a href={photo.driveFileLink} target="_blank" rel="noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-full text-xs transition">
                  📁
                </a>
              )}
            </div>

            {/* Delete (own photos only) */}
            {isOwner && (
              <button
                onClick={() => onDelete(photo._id)}
                className="bg-red-500/60 hover:bg-red-500 text-white px-2 py-1 rounded-full text-xs transition"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="p-2 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            {photo.uploadedBy?.avatar
              ? <img src={photo.uploadedBy.avatar} alt="" className="w-full h-full object-cover" />
              : (photo.uploadedBy?.name?.[0] || photo.uploadedByName?.[0] || 'G')}
          </div>
          <span className="text-xs text-slate-400 truncate">
            {photo.uploadedBy?.name || photo.uploadedByName || 'Guest'}
          </span>
          {hasDrive && (
            photo.driveSynced ? (
              <span className="ml-auto text-xs text-green-400 font-semibold" title="Synced to Google Drive! ✅">
                📁 Drive
              </span>
            ) : (
              <span className="ml-auto text-xs text-yellow-500 animate-pulse font-medium" title="Uploading to Google Drive... ⏳">
                📁 Saving...
              </span>
            )
          )}
        </div>

        {/* Emoji Reactions Row */}
        <div className="flex items-center gap-1 mb-2 mt-1.5">
          {['❤️', '😂', '🔥'].map(emoji => {
            const count = reactionCounts[emoji];
            const active = myReactions.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); onReact(photo._id, emoji); }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition border ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold'
                    : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Caption */}
        {editingCaption ? (
          <div className="mt-1 flex gap-1 items-center">
            <input
              type="text"
              value={captionText}
              onChange={e => setCaptionText(e.target.value)}
              className="input-dark text-xs py-1 px-2 rounded-lg flex-1"
              placeholder="Add caption..."
              autoFocus
            />
            <button
              onClick={() => {
                api.put(`/photos/${photo._id}/caption`, { caption: captionText })
                  .then(() => {
                    photo.caption = captionText; // Local update
                    setEditingCaption(false);
                    toast.success('Caption updated!');
                  })
                  .catch(() => toast.error('Failed to update caption'));
              }}
              className="bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/30 rounded-lg p-1 text-xs"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setCaptionText(photo.caption || '');
                setEditingCaption(false);
              }}
              className="bg-white/10 hover:bg-white/20 text-slate-400 rounded-lg p-1 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-1 group/cap mt-1">
            <p className="text-xs text-slate-300 italic flex-1 truncate">
              {photo.caption || photo.aiDescription || 'No description'}
            </p>
            {isOwner && (
              <button
                onClick={() => setEditingCaption(true)}
                className="opacity-0 group-hover/cap:opacity-100 text-xs text-cyan-400 hover:text-cyan-300 shrink-0"
              >
                ✏️
              </button>
            )}
          </div>
        )}

        {photo.caption && photo.aiDescription && (
          <p className="text-[9px] text-slate-500 mt-1 italic truncate" title={photo.aiDescription}>
            AI: {photo.aiDescription}
          </p>
        )}

        {photo.aiQualityLabel && (
          <div className="mt-1.5">
            <QualityBadge label={photo.aiQualityLabel} score={photo.aiQualityScore} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Uploader Component ───────────────────────────────────
const PhotoUploader = ({ groupId, onUploadDone }) => {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef();

  const handleFiles = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('Please select image files only'); return; }
    if (imageFiles.length > 20) { toast.error('Max 20 photos at once'); return; }
    setFiles(imageFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('photos', f));

      const { data } = await api.post(`/photos/upload/${groupId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded / e.total) * 100)),
      });

      toast.success(data.message);
      if (data.driveLink) {
        toast(`📁 Also syncing to your Google Drive!`, { icon: '✅' });
      }
      setFiles([]);
      onUploadDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
    setProgress(0);
  };

  const previews = files.map(f => URL.createObjectURL(f));

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <div className="text-5xl mb-3">{dragging ? '📂' : '📸'}</div>
        <p className="font-bold text-lg">Drop photos here or click to select</p>
        <p className="text-slate-400 text-sm mt-1">Up to 20 photos • JPG, PNG, HEIC • Max 30MB each</p>
        <p className="text-slate-500 text-xs mt-2">Original quality preserved • AI analyzes after upload</p>
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">{files.length} photo(s) selected</p>
            <button onClick={() => setFiles([])} className="text-xs text-red-400 hover:underline">Clear</button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
            {previews.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Uploading to vault...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="bg-cyan-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            onClick={upload}
            disabled={uploading}
            className="btn-primary w-full mt-3"
          >
            {uploading ? `Uploading... ${progress}%` : `📤 Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Trivia Confetti Particles ────────────────────────────
const TriviaConfetti = () => {
  return (
    <>
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
        {Array(40).fill(0).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 3;
          const duration = 2 + Math.random() * 2;
          const size = 6 + Math.random() * 6;
          const color = ['#A78BFA', '#22D3EE', '#F472B6', '#FBBF24', '#34D399'][Math.floor(Math.random() * 5)];
          return (
            <div
              key={i}
              className="absolute animate-fall rounded-sm"
              style={{
                left: `${left}%`,
                top: `-15px`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                backgroundColor: color,
                opacity: 0.8
              }}
            />
          );
        })}
      </div>
    </>
  );
};

// ─── Main TripPhotoVault Page ─────────────────────────────
const TripPhotoVault = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');          // all | best | mine
  const [sortBy, setSortBy] = useState('latest'); // latest | quality | votes
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [initLoading, setInitLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [group, setGroup] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Advanced AI Features States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [aiCurationProgress, setAiCurationProgress] = useState({ active: false, count: 0, completed: 0 });
  const [diaryText, setDiaryText] = useState('');
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);

  // Postcard & Trivia States
  const [postcardImage, setPostcardImage] = useState(null);
  const [generatingPostcard, setGeneratingPostcard] = useState(false);
  const [postcardTheme, setPostcardTheme] = useState('space');
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [triviaFinished, setTriviaFinished] = useState(false);

  useEffect(() => {
    loadPhotos();
    loadStats();
    loadGroup();
  }, [groupId, tab, sortBy, page]);

  useEffect(() => {
    let socket = getSocket();
    if (!socket) {
      const token = localStorage.getItem('finbuddy_token');
      socket = connectSocket(token);
    }
    
    if (socket) {
      socket.emit('group:join', { groupId });
      
      socket.on('photo:new', (newPhoto) => {
        setPhotos(prev => {
          if (prev.some(p => p._id === newPhoto._id)) return prev;
          return [newPhoto, ...prev];
        });
        loadStats();
      });

      socket.on('photo:drive-synced', ({ photoId, driveFileLink, driveSynced }) => {
        setPhotos(prev => prev.map(p => 
          p._id === photoId ? { ...p, driveSynced, driveFileLink } : p
        ));
      });

      socket.on('photo:vote', ({ photoId, voteCount }) => {
        setPhotos(prev => prev.map(p => 
          p._id === photoId ? { ...p, voteCount } : p
        ));
      });

      socket.on('photo:react', ({ photoId, reactions }) => {
        setPhotos(prev => prev.map(p => 
          p._id === photoId ? { ...p, reactions } : p
        ));
      });

      socket.on('photo:comment', ({ photoId, comments }) => {
        setPhotos(prev => prev.map(p => 
          p._id === photoId ? { ...p, comments } : p
        ));
      });

      // AI Curation listeners
      socket.on('photo:ai-curation-start', ({ count }) => {
        setAiCurationProgress({ active: true, count, completed: 0 });
        toast(`🤖 AI Curation started for ${count} photo(s)!`, { icon: '🤖' });
      });

      socket.on('photo:ai-curated', (curatedData) => {
        setPhotos(prev => prev.map(p => 
          p._id === curatedData.photoId 
            ? { 
                ...p, 
                aiQualityScore: curatedData.aiQualityScore,
                aiQualityLabel: curatedData.aiQualityLabel,
                aiTags: curatedData.aiTags,
                aiDescription: curatedData.aiDescription,
                isBlurry: curatedData.isBlurry,
                isBestPhoto: curatedData.isBestPhoto
              } 
            : p
        ));
        setAiCurationProgress(prev => {
          if (!prev.active) return prev;
          const nextCompleted = prev.completed + 1;
          if (nextCompleted >= prev.count) {
            return { active: false, count: 0, completed: 0 };
          }
          return { ...prev, completed: nextCompleted };
        });
        loadStats();
      });

      socket.on('photo:ai-curation-end', () => {
        setAiCurationProgress({ active: false, count: 0, completed: 0 });
        toast.success('🤖 AI Curation complete!');
        loadStats();
        loadPhotos();
      });
    }

    return () => {
      if (socket) {
        socket.emit('group:leave', { groupId });
        socket.off('photo:new');
        socket.off('photo:drive-synced');
        socket.off('photo:vote');
        socket.off('photo:react');
        socket.off('photo:comment');
        socket.off('photo:ai-curation-start');
        socket.off('photo:ai-curated');
        socket.off('photo:ai-curation-end');
      }
    };
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data.group);
    } catch (e) {}
  };

  const handleConnectDrive = () => {
    const token = localStorage.getItem('finbuddy_token');
    const authUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/drive/auth/${groupId}?token=${token}`;
    window.location.href = authUrl;
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 30, sortBy,
        ...(tab === 'best' ? { bestOnly: 'true' } : {}),
        ...(tab === 'mine' ? { uploadedBy: user._id } : {}),
      });
      const { data } = await api.get(`/photos/${groupId}?${params}`);
      setPhotos(data.photos || []);
      setVaultInfo(data.driveFolder);
      setTotalPages(data.pagination?.pages || 1);
    } catch (e) { toast.error('Failed to load photos'); }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get(`/photos/${groupId}/stats`);
      setStats(data.stats);
    } catch (e) {}
  };

  const initVault = async () => {
    setInitLoading(true);
    try {
      const { data } = await api.post(`/photos/init/${groupId}`);
      toast.success(data.message);
      loadStats();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to initialize vault'); }
    setInitLoading(false);
  };

  const triggerAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/photos/${groupId}/analyze`);
      toast.success('AI is analyzing photos in the background...');
      setTimeout(() => { loadPhotos(); loadStats(); }, 5000);
    } catch (e) { toast.error('Analysis failed'); }
    setAnalyzing(false);
  };

  const fetchDiary = async () => {
    setDiaryLoading(true);
    setShowDiaryModal(true);
    try {
      const { data } = await api.get(`/photos/${groupId}/ai-recap`);
      if (data.success) {
        setDiaryText(data.recap);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate travel diary. Try analyzing more photos first.');
      setShowDiaryModal(false);
    }
    setDiaryLoading(false);
  };

  const fetchTrivia = async () => {
    setTriviaLoading(true);
    setShowTriviaModal(true);
    try {
      const { data } = await api.get(`/photos/${groupId}/trivia`);
      if (data.success) {
        setTriviaQuestions(data.quiz || []);
        setCurrentQuestionIdx(0);
        setSelectedOption('');
        setAnswered(false);
        setScore(0);
        setXpEarned(0);
        setTriviaFinished(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load trivia. Make sure there are at least 3 photos first!');
      setShowTriviaModal(false);
    }
    setTriviaLoading(false);
  };

  const drawPostcard = (theme = postcardTheme) => {
    const bestPhotos = photos.filter(p => p.isBestPhoto).slice(0, 3);
    if (bestPhotos.length === 0) {
      toast.error('AI needs to pick at least 1 Best Photo highlight to create a postcard! Click "Analyze" to run AI Curation.');
      return;
    }
    setGeneratingPostcard(true);
    setPostcardImage(null);

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    // 1. Draw Gradient Background based on selected theme
    const grad = ctx.createLinearGradient(0, 0, 600, 850);
    let borderColor = 'rgba(139, 92, 246, 0.4)';
    let titleColor = '#C084FC';

    if (theme === 'sunset') {
      grad.addColorStop(0, '#311042');
      grad.addColorStop(0.5, '#db2777');
      grad.addColorStop(1, '#7c2d12');
      borderColor = 'rgba(219, 39, 119, 0.4)';
      titleColor = '#F472B6';
    } else if (theme === 'aurora') {
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f766e');
      grad.addColorStop(1, '#1e293b');
      borderColor = 'rgba(20, 184, 166, 0.4)';
      titleColor = '#2DD4BF';
    } else if (theme === 'vintage') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#78350f');
      grad.addColorStop(1, '#451a03');
      borderColor = 'rgba(245, 158, 11, 0.4)';
      titleColor = '#FBBF24';
    } else { // default 'space'
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.5, '#1E1B4B');
      grad.addColorStop(1, '#311042');
      borderColor = 'rgba(139, 92, 246, 0.4)';
      titleColor = '#C084FC';
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 850);

    // 2. Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 570, 820);

    // 3. Title & Header
    ctx.fillStyle = titleColor;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINBUDDY AI TRAVEL RECAP', 300, 50);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText((group?.name || 'Trip').toUpperCase(), 300, 100);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '15px sans-serif';
    ctx.fillText(`📍 ${group?.tripDetails?.destination || 'Destination'}  |  📅 ${photos.length} photos synced`, 300, 135);

    // 4. Load & Render Collage Images
    const imgPromises = bestPhotos.map((photo, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ img, index });
        img.onerror = () => resolve(null);
        img.src = photo.cloudinaryUrl;
      });
    });

    Promise.all(imgPromises).then((loadedImages) => {
      const validImgs = loadedImages.filter(Boolean);
      
      try {
        if (validImgs.length === 1) {
          // Draw single big highlight image
          ctx.drawImage(validImgs[0].img, 100, 170, 400, 300);
        } else if (validImgs.length === 2) {
          // Draw side by side
          ctx.drawImage(validImgs[0].img, 40, 170, 250, 250);
          ctx.drawImage(validImgs[1].img, 310, 170, 250, 250);
        } else if (validImgs.length >= 3) {
          // 1 big image on top, 2 smaller images below
          ctx.drawImage(validImgs[0].img, 150, 170, 300, 220);
          ctx.drawImage(validImgs[1].img, 40, 405, 250, 180);
          ctx.drawImage(validImgs[2].img, 310, 405, 250, 180);
        }

        // 5. Draw Travel Diary Text Box
        const textBoxY = validImgs.length >= 3 ? 610 : 490;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(40, textBoxY, 520, 170, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, textBoxY, 520, 170);

        // Draw text wrapping helper
        ctx.fillStyle = '#E2E8F0';
        ctx.font = 'italic 14px sans-serif';
        ctx.textAlign = 'left';
        const diaryParagraph = diaryText || 'An unforgettable adventure loaded with beautiful memories, scenic highlights, and shared group vibes.';
        
        const words = diaryParagraph.split(' ');
        let line = '';
        let y = textBoxY + 30;
        const lineheight = 20;
        const maxwidth = 480;

        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxwidth && n > 0) {
            ctx.fillText(line, 60, y);
            line = words[n] + ' ';
            y += lineheight;
          } else {
            line = testLine;
          }
          if (y > textBoxY + 140) break;
        }
        ctx.fillText(line, 60, y);

        // 6. Draw branding footer
        ctx.fillStyle = '#EC4899';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ Crafted via FinBuddy AI PhotoVault', 300, textBoxY + 205);

        setPostcardImage(canvas.toDataURL('image/png'));
      } catch (cErr) {
        console.error('Canvas compilation error:', cErr.message);
        toast.error('Failed to compile postcard canvas due to image settings.');
      }
      setGeneratingPostcard(false);
    });
  };

  const getCategoryForPhoto = (photo) => {
    const tags = photo.aiTags || [];
    if (tags.some(t => ['group', 'selfie', 'portrait'].includes(t))) return 'people';
    if (tags.some(t => ['mountain', 'landscape', 'nature', 'beach', 'outdoor'].includes(t))) return 'landscapes';
    if (tags.some(t => ['food'].includes(t))) return 'food';
    if (tags.some(t => ['action', 'party', 'celebration'].includes(t))) return 'activities';
    return 'other';
  };

  const filteredPhotos = photos.filter(photo => {
    // 1. Category filter
    if (selectedCategory !== 'all') {
      const cat = getCategoryForPhoto(photo);
      if (cat !== selectedCategory) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (photo.uploadedBy?.name || photo.uploadedByName || 'Guest').toLowerCase();
      const tags = (photo.aiTags || []).join(' ').toLowerCase();
      const caption = (photo.caption || '').toLowerCase();
      const aiDesc = (photo.aiDescription || '').toLowerCase();
      const filename = (photo.fileName || '').toLowerCase();

      return name.includes(q) || tags.includes(q) || caption.includes(q) || aiDesc.includes(q) || filename.includes(q);
    }

    return true;
  });

  const handleVote = async (photoId) => {
    try {
      const { data } = await api.post(`/photos/${photoId}/vote`);
      setPhotos(prev => prev.map(p =>
        p._id === photoId
          ? { ...p, voteCount: data.voteCount, votes: data.hasVoted ? [...(p.votes || []), { user: user._id }] : (p.votes || []).filter(v => v.user !== user._id) }
          : p
      ));
    } catch (e) { toast.error('Vote failed'); }
  };

  const handleReact = async (photoId, emoji) => {
    try {
      const { data } = await api.post(`/photos/${photoId}/react`, { emoji });
      setPhotos(prev => prev.map(p =>
        p._id === photoId
          ? { ...p, reactions: data.reactions }
          : p
      ));
    } catch (e) { toast.error('Reaction failed'); }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await api.delete(`/photos/${photoId}`);
      toast.success('Photo deleted');
      setPhotos(prev => prev.filter(p => p._id !== photoId));
      loadStats();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const downloadPhotos = (bestOnly = false) => {
    const token = localStorage.getItem('finbuddy_token');
    const url = `${import.meta.env.VITE_API_URL}/photos/${groupId}/download${bestOnly ? '?bestOnly=true' : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');

    // Fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
        toast.success('Download started! 📦');
      })
      .catch(() => toast.error('Download failed'));
  };

  const tabs = [
    { id: 'all',  label: `All (${stats?.total || 0})` },
    { id: 'best', label: `⭐ Best (${stats?.bestCount || 0})` },
    { id: 'mine', label: 'My Photos' },
  ];

  const sortOptions = [
    { value: 'latest',  label: '🕐 Latest' },
    { value: 'quality', label: '🤖 AI Quality' },
    { value: 'votes',   label: '❤️ Most Liked' },
    { value: 'oldest',  label: '📅 Oldest' },
  ];

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={`/split/group/${groupId}`} className="text-slate-400 hover:text-white">← Back</Link>
            <div>
              <h1 className="text-3xl font-bold">📸 Trip Photo Vault</h1>
              <p className="text-slate-400 text-sm mt-1">
                Upload once • AI picks the best • Syncs to Google Drive
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {group?.tripDetails?.googleDriveFolderId ? (
              <a href={group.tripDetails.googleDriveFolderLink} target="_blank" rel="noreferrer">
                <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                  📁 Open in Drive
                </button>
              </a>
            ) : (
              <button onClick={handleConnectDrive} className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                🔌 Link Google Drive
              </button>
            )}
            {group?.inviteCode && (
              <button onClick={() => setShowShareModal(true)} className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                🔗 Share on WhatsApp
              </button>
            )}
            {stats?.analyzed >= 3 && (
              <button onClick={fetchDiary} className="btn-secondary" style={{ width: 'auto', padding: '10px 16px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#C084FC' }}>
                📝 AI Travel Diary
              </button>
            )}
            {stats?.total >= 3 && (
              <button onClick={fetchTrivia} className="btn-secondary font-bold" style={{ width: 'auto', padding: '10px 16px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22D3EE' }}>
                🎮 Play Trivia
              </button>
            )}
            <button onClick={() => setShowUploader(!showUploader)} className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
              {showUploader ? '✕ Close' : '📤 Upload Photos'}
            </button>
          </div>
        </div>


        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total',     value: stats.total,             color: 'text-white' },
              { label: '⭐ Best',   value: stats.bestCount,         color: 'text-yellow-400' },
              { label: '🌫️ Blurry', value: stats.blurCount,         color: 'text-red-400' },
              { label: '🤖 Analyzed', value: stats.analyzed,        color: 'text-cyan-400' },
              { label: '⏳ Pending', value: stats.pendingAnalysis,   color: 'text-slate-400' },
            ].map((s, i) => (
              <div key={i} className="card text-center py-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Curation Progress */}
        {aiCurationProgress.active && (
          <div className="card border-cyan-500/20 bg-cyan-500/5 mb-6 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🤖</span>
              <div>
                <p className="font-medium text-cyan-400">AI Curation in Progress...</p>
                <p className="text-xs text-slate-400">
                  Analyzing {aiCurationProgress.count} photo(s)... ({aiCurationProgress.completed}/{aiCurationProgress.count} complete)
                </p>
              </div>
            </div>
            <div className="w-40 bg-white/10 rounded-full h-2 overflow-hidden shrink-0">
              <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${(aiCurationProgress.completed / aiCurationProgress.count) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Drive info banner */}
        {stats?.driveFolder?.isSetup && (
          <div className="card border-green-500/20 bg-green-500/5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="font-medium text-green-400">Google Drive folder active</p>
                <p className="text-xs text-slate-400">{stats.driveFolder.name} — photos auto-sync after upload</p>
              </div>
            </div>
            <a href={stats.driveFolder.link} target="_blank" rel="noreferrer"
              className="text-sm text-cyan-400 hover:underline">Open Drive →</a>
          </div>
        )}

        {/* Uploader */}
        {showUploader && (
          <div className="card mb-6 border-cyan-500/20">
            <h3 className="font-bold mb-4">📤 Upload Photos</h3>
            <PhotoUploader
              groupId={groupId}
              onUploadDone={() => { setShowUploader(false); loadPhotos(); loadStats(); }}
            />
          </div>
        )}

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-[var(--bg-secondary)] border border-white/5 p-3 rounded-2xl">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="🔍 Search photos by tag, description, uploader..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-dark text-xs w-full py-2 px-3 rounded-xl border-white/10"
              style={{ padding: '8px 12px' }}
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: '🏷️ All' },
              { id: 'people', label: '👥 People' },
              { id: 'landscapes', label: '🏞️ Landscapes' },
              { id: 'food', label: '🍔 Food' },
              { id: 'activities', label: '⚡ Activities' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider shrink-0 transition border ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === t.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >{t.label}</button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select className="input-dark py-2 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px' }}>
              {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {/* AI Analyze button */}
            {stats?.pendingAnalysis > 0 && (
              <button onClick={triggerAIAnalysis} disabled={analyzing}
                className="btn-secondary text-sm" style={{ width: 'auto', padding: '8px 14px' }}>
                {analyzing ? '🤖 Analyzing...' : `🤖 Analyze ${stats.pendingAnalysis} photos`}
              </button>
            )}

            {/* Download buttons */}
            <button onClick={() => downloadPhotos(false)}
              className="btn-secondary text-sm" style={{ width: 'auto', padding: '8px 14px' }}>
              📦 Download All
            </button>
            {stats?.bestCount > 0 && (
              <button onClick={() => downloadPhotos(true)}
                className="btn-primary text-sm" style={{ width: 'auto', padding: '8px 14px' }}>
                ⭐ Best ZIP
              </button>
            )}
          </div>
        </div>

        {/* Photo Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array(15).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-bold mb-2">
              {tab === 'best' ? 'No best photos yet' :
               tab === 'mine' ? "You haven't uploaded any photos" :
               'No photos in this trip vault'}
            </h3>
            <p className="text-slate-400 mb-6">
              {tab === 'best'
                ? 'AI will mark the best ones after upload and analysis'
                : 'Upload your trip photos to get started!'}
            </p>
            {tab !== 'best' && (
              <button onClick={() => setShowUploader(true)} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
                📤 Upload Photos
              </button>
            )}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No matching photos found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search query or category filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredPhotos.map(photo => (
                <PhotoCard
                  key={photo._id}
                  photo={photo}
                  onVote={handleVote}
                  onReact={handleReact}
                  onDelete={handleDelete}
                  currentUserId={user?._id}
                  hasDrive={!!group?.tripDetails?.googleDriveFolderId}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary" style={{ width: 'auto', padding: '8px 16px' }}>← Prev</button>
                <span className="flex items-center text-slate-400 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="btn-secondary" style={{ width: 'auto', padding: '8px 16px' }}>Next →</button>
              </div>
            )}
          </>
        )}

        {/* Who uploaded the most */}
        {stats?.byMember?.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bold mb-3">📊 Photo Contributions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.byMember.map((m, i) => (
                <div key={i} className="card text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-sm font-bold overflow-hidden mx-auto mb-2">
                    {m.user?.avatar
                      ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />
                      : m.user?.name?.[0]}
                  </div>
                  <p className="text-sm font-medium truncate">{m.user?.name}</p>
                  <p className="text-xl font-bold text-cyan-400">{m.photoCount}</p>
                  <p className="text-xs text-slate-400">photos</p>
                  {m.bestCount > 0 && (
                    <p className="text-xs text-yellow-400 mt-1">⭐ {m.bestCount} best</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WhatsApp Share Modal ─────────────────────────── */}
        {showShareModal && group && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="card max-w-md w-full border-cyan-500/20 glow-violet max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">🔗 WhatsApp Public Share</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 text-center">
                <p className="text-slate-400 text-sm">
                  Send this link or card to your WhatsApp group chat. Anyone with the link can view, download, and upload photos in original resolution!
                </p>

                {/* QR Code Container */}
                <div className="bg-white p-5 rounded-3xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg shadow-black/40">
                  <QRCode
                    id="share-qr-code"
                    value={`${window.location.origin}/public/photos/${group.inviteCode}`}
                    size={160}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>

                {/* Link inputs */}
                <div className="space-y-2 text-left">
                  <label className="text-xs text-slate-400 uppercase font-semibold">Shared Drive Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/public/photos/${group.inviteCode}`}
                      className="input-dark text-xs flex-1 truncate py-2 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/public/photos/${group.inviteCode}`);
                        toast.success('Public shared drive link copied!');
                      }}
                      className="btn-secondary text-xs"
                      style={{ padding: '8px 14px', width: 'auto' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/public/photos/${group.inviteCode}`;
                      const msg = `Hey! I created a shared uncompressed photo drive for our trip *${group.name}*! \n\nClick this link to view all photos, download original high-res quality, and upload yours without WhatsApp compression! 📸👇\n\n${shareUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    💬 WhatsApp Share
                  </button>
                  <button
                    onClick={() => {
                      const canvas = document.createElement('canvas');
                      canvas.width = 600;
                      canvas.height = 800;
                      const ctx = canvas.getContext('2d');

                      // Background gradient
                      const grad = ctx.createLinearGradient(0, 0, 600, 800);
                      grad.addColorStop(0, '#08080F');
                      grad.addColorStop(0.5, '#0E0D18');
                      grad.addColorStop(1, '#1A0B2E');
                      ctx.fillStyle = grad;
                      ctx.fillRect(0, 0, 600, 800);

                      // Card borders
                      ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';
                      ctx.lineWidth = 3;
                      ctx.strokeRect(20, 20, 560, 760);

                      // Title
                      ctx.fillStyle = '#F8FAFC';
                      ctx.font = 'bold 32px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText('📸 TRIP PHOTO DRIVE', 300, 100);

                      // Group Name
                      ctx.fillStyle = '#A78BFA';
                      ctx.font = 'bold 38px sans-serif';
                      ctx.fillText(group.name.toUpperCase(), 300, 175);

                      // Sub-message
                      ctx.fillStyle = '#6366F1';
                      ctx.font = '18px sans-serif';
                      ctx.fillText('Scan QR Code with your phone to upload photos', 300, 240);

                      // Draw QR code image from SVG
                      const svgEl = document.getElementById('share-qr-code');
                      if (svgEl) {
                        const svgString = new XMLSerializer().serializeToString(svgEl);
                        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                        const DOMURL = window.URL || window.webkitURL || window;
                        const url = DOMURL.createObjectURL(svgBlob);
                        const img = new Image();
                        img.onload = () => {
                          // Background card for QR
                          ctx.fillStyle = '#FFFFFF';
                          ctx.beginPath();
                          ctx.roundRect(175, 290, 250, 250, 24);
                          ctx.fill();

                          ctx.drawImage(img, 200, 315, 200, 200);

                          // Branding
                          ctx.fillStyle = '#EC4899';
                          ctx.font = 'bold 22px sans-serif';
                          ctx.fillText('⚡ FinBuddy PhotoVault', 300, 610);

                          ctx.fillStyle = '#94A3B8';
                          ctx.font = '15px sans-serif';
                          ctx.fillText('No Registration Required • High Resolution Preserved', 300, 655);

                          ctx.fillStyle = '#F8FAFC';
                          ctx.font = 'bold 20px monospace';
                          ctx.fillText(`INVITE CODE: ${group.inviteCode}`, 300, 715);

                          const dataURL = canvas.toDataURL('image/png');
                          const downloadLink = document.createElement('a');
                          downloadLink.download = `finbuddy_invite_${group.inviteCode}.png`;
                          downloadLink.href = dataURL;
                          downloadLink.click();
                          DOMURL.revokeObjectURL(url);
                        };
                        img.src = url;
                      } else {
                        toast.error('Failed to capture QR code element');
                      }
                    }}
                    className="btn-secondary flex items-center justify-center gap-2 py-3"
                  >
                    💾 Download Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Travel Diary Modal ─────────────────────────── */}
        {showDiaryModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowDiaryModal(false)}>
            <div className="card max-w-4xl w-full border-violet-500/30 glow-violet max-h-[90vh] overflow-y-auto bg-slate-955 p-6 relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-violet-400 flex items-center gap-2">
                  <span>📝</span> AI Travel Diary & Postcard Creator
                </h3>
                <button
                  onClick={() => setShowDiaryModal(false)}
                  className="text-slate-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {diaryLoading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 text-sm animate-pulse font-medium">AI is crafting your trip narrative diary from your photos...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Diary Text */}
                    <div className="space-y-4 text-left">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">📖 Diary Narrative</h4>
                      <div className="prose prose-invert text-slate-300 leading-relaxed text-xs whitespace-pre-wrap font-serif bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner h-96 overflow-y-auto">
                        {diaryText || "No memories compiled yet. AI needs at least 3 analyzed photos to generate a travel diary."}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(diaryText);
                          toast.success('Travel diary copied to clipboard!');
                        }}
                        className="btn-secondary text-xs w-full"
                        style={{ padding: '8px 14px' }}
                      >
                        📋 Copy Narrative
                      </button>
                    </div>

                    {/* Right: Postcard Canvas Grid */}
                    <div className="space-y-4 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">🎴 Dynamic Postcard Collage</h4>
                        <p className="text-[11px] text-slate-500 mb-3">Compose a stunning postcard combining your top highlights, diary entry, and trip stats!</p>
                        
                        {/* Theme Selector Pill Buttons */}
                        <div className="flex gap-1 mb-3 bg-white/5 p-1 rounded-xl border border-white/5">
                          {[
                            { id: 'space', name: '🌌 Space', activeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/35' },
                            { id: 'sunset', name: '🌅 Sunset', activeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/35' },
                            { id: 'aurora', name: '🧪 Aurora', activeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/35' },
                            { id: 'vintage', name: '📜 Vintage', activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/35' }
                          ].map(theme => (
                            <button
                              key={theme.id}
                              onClick={() => {
                                setPostcardTheme(theme.id);
                                drawPostcard(theme.id);
                              }}
                              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition border ${
                                postcardTheme === theme.id
                                  ? theme.activeColor
                                  : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {theme.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {generatingPostcard ? (
                        <div className="border border-dashed border-white/15 rounded-2xl flex-1 flex flex-col items-center justify-center p-6 bg-white/[0.01] min-h-[300px]">
                          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-xs text-slate-500 animate-pulse">Drawing dynamic layout...</p>
                        </div>
                      ) : postcardImage ? (
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                          <div className="border border-white/10 rounded-2xl overflow-hidden shadow-lg bg-black/20 flex-1 flex items-center justify-center p-2 min-h-[280px]">
                            <img src={postcardImage} alt="Postcard Preview" className="max-h-72 rounded-lg object-contain shadow-inner" />
                          </div>
                          <a href={postcardImage} download={`postcard_${groupId}.png`} className="w-full">
                            <button className="btn-primary text-xs w-full font-bold" style={{ padding: '8px 16px' }}>
                              💾 Download Postcard PNG
                            </button>
                          </a>
                        </div>
                      ) : (
                        <div className="border border-dashed border-white/10 hover:border-violet-500/50 rounded-2xl flex-1 flex flex-col items-center justify-center p-6 bg-white/[0.02] transition min-h-[300px]">
                          <span className="text-4xl mb-3">🎴</span>
                          <p className="text-xs text-slate-400 text-center mb-4">Postcard not generated yet</p>
                          <button onClick={drawPostcard} className="btn-secondary text-xs" style={{ width: 'auto', padding: '8px 14px' }}>
                            🎨 Generate Postcard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                    <button
                      onClick={() => setShowDiaryModal(false)}
                      className="btn-primary text-xs"
                      style={{ padding: '8px 16px', width: 'auto' }}
                    >
                      Close Modal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AI Memory Trivia Modal ─────────────────────────── */}
        {showTriviaModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowTriviaModal(false)}>
            <div className="card max-w-lg w-full border-cyan-500/30 glow-violet max-h-[90vh] overflow-y-auto bg-slate-955 p-6 relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <span>🎮</span> Trip Memory Trivia
                </h3>
                <button
                  onClick={() => setShowTriviaModal(false)}
                  className="text-slate-400 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {triviaLoading ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 text-sm animate-pulse">Assembling memory trivia from your photos...</p>
                </div>
              ) : triviaQuestions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400">Could not compile trivia. Check back shortly!</p>
                </div>
              ) : triviaFinished ? (
                <div className="space-y-6 text-center py-6 relative">
                  {score >= 2 && <TriviaConfetti />}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 p-1 mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">{score}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white">
                      {score === 3 ? "🏆 Perfect Memory!" : score === 2 ? "🎉 Great Job!" : "👍 Nice Try!"}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      You answered {score} out of {triviaQuestions.length} questions correctly about your trip photos.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-xs mx-auto">
                    <p className="text-xs text-slate-400">Total Virtual Rewards</p>
                    <p className="text-2xl font-black text-cyan-400 mt-1">+{score * 10} XP</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Credited to FinScore</p>
                  </div>

                  <div className="flex gap-3 justify-center pt-4 border-t border-white/5 z-10 relative">
                    <button
                      onClick={fetchTrivia}
                      className="btn-secondary text-xs"
                      style={{ width: 'auto', padding: '10px 20px' }}
                    >
                      🔄 Play Again
                    </button>
                    <button
                      onClick={() => setShowTriviaModal(false)}
                      className="btn-primary text-xs"
                      style={{ width: 'auto', padding: '10px 20px' }}
                    >
                      Close 🏁
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {/* Progress Indicator */}
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Question {currentQuestionIdx + 1} of {triviaQuestions.length}</span>
                    <span>Score: {score}/{triviaQuestions.length}</span>
                  </div>

                  {/* Question Block */}
                  <div className="space-y-4">
                    <p className="font-semibold text-white text-sm">{triviaQuestions[currentQuestionIdx].question}</p>

                    {triviaQuestions[currentQuestionIdx].imageUrl && (
                      <div className="w-full max-h-48 overflow-hidden rounded-xl bg-black/20 flex items-center justify-center p-1 border border-white/5">
                        <img
                          src={triviaQuestions[currentQuestionIdx].imageUrl}
                          alt="Trivia Clue"
                          className="max-h-44 object-contain rounded-lg shadow-inner"
                        />
                      </div>
                    )}

                    {/* Options list */}
                    <div className="grid grid-cols-1 gap-2 mt-4">
                      {triviaQuestions[currentQuestionIdx].options.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        const isCorrect = option === triviaQuestions[currentQuestionIdx].answer;
                        let btnStyle = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
                        
                        if (answered) {
                          if (isCorrect) {
                            btnStyle = "bg-green-500/20 border-green-500 text-green-400 font-bold";
                          } else if (isSelected) {
                            btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                          } else {
                            btnStyle = "bg-white/5 border-transparent text-slate-500 opacity-40";
                          }
                        } else if (isSelected) {
                          btnStyle = "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold";
                        }

                        return (
                          <button
                            key={idx}
                            disabled={answered}
                            onClick={() => setSelectedOption(option)}
                            className={`border text-xs rounded-xl p-3 text-left transition-all ${btnStyle}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    {answered ? (
                      <>
                        <div className="text-xs">
                          {selectedOption === triviaQuestions[currentQuestionIdx].answer ? (
                            <span className="text-green-400 font-bold">✨ Correct! +10 virtual XP</span>
                          ) : (
                            <span className="text-red-400 font-medium">❌ Incorrect! Correct: {triviaQuestions[currentQuestionIdx].answer}</span>
                          )}
                        </div>

                        {currentQuestionIdx < triviaQuestions.length - 1 ? (
                          <button
                            onClick={() => {
                              setCurrentQuestionIdx(p => p + 1);
                              setSelectedOption('');
                              setAnswered(false);
                            }}
                            className="btn-primary text-xs w-auto px-4 py-2"
                          >
                            Next Question →
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const finalScore = score + (selectedOption === triviaQuestions[currentQuestionIdx].answer ? 1 : 0);
                              setScore(finalScore);
                              setTriviaFinished(true);
                            }}
                            className="btn-primary text-xs w-auto px-4 py-2"
                          >
                            Finish Game 🏁
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500">Select an option to answer</span>
                        <button
                          disabled={!selectedOption}
                          onClick={() => {
                            setAnswered(true);
                            if (selectedOption === triviaQuestions[currentQuestionIdx].answer) {
                              setScore(p => p + 1);
                              setXpEarned(p => p + 10);
                            }
                          }}
                          className="btn-primary text-xs w-auto px-6 py-2"
                        >
                          Submit Answer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <SectionGuide sectionId="/split/photos/:groupId" />
      </main>
    
    </div>
  );
};

export default TripPhotoVault;
