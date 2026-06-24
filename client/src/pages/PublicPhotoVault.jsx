// client/src/pages/PublicPhotoVault.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { connectSocket, getSocket } from '../services/socket';

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

// ─── Main PublicPhotoVault Page ─────────────────────────────
const PublicPhotoVault = () => {
  const { inviteCode } = useParams();
  const [group, setGroup] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, bestCount: 0, byMember: [] });
  
  // Guest states
  const [guestName, setGuestName] = useState(localStorage.getItem('guest_name') || '');
  const [editingName, setEditingName] = useState(!localStorage.getItem('guest_name'));
  const [clientUuid, setClientUuid] = useState('');

  // UI States
  const [tab, setTab] = useState('all'); // all | best
  const [sortBy, setSortBy] = useState('latest');
  const [selectedTag, setSelectedTag] = useState('all');
  const [activePhoto, setActivePhoto] = useState(null); // Lightbox
  const [activePhotoIdx, setActivePhotoIdx] = useState(-1);
  const [newComment, setNewComment] = useState('');
  
  // Stories / Highlights State
  const [showStories, setShowStories] = useState(false);
  const [storyIdx, setStoryIdx] = useState(0);
  const storyTimeoutRef = useRef(null);

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

  // Uploader States
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Generate or retrieve guest UUID on mount
  useEffect(() => {
    let uuid = localStorage.getItem('guest_user_uuid');
    if (!uuid) {
      const chars = '0123456789abcdef';
      uuid = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * 16)]).join('');
      localStorage.setItem('guest_user_uuid', uuid);
    }
    setClientUuid(uuid);
  }, []);

  // Fetch Public Album details and connect socket
  useEffect(() => {
    loadAlbum();
  }, [inviteCode, tab, sortBy]);

  useEffect(() => {
    if (!group?.id) return;
    
    // Connect Socket as Guest
    let socket = getSocket();
    if (!socket) {
      socket = connectSocket(null, inviteCode);
    }

    if (socket) {
      socket.emit('group:join', { groupId: group.id });

      socket.on('photo:new', (newPhoto) => {
        setPhotos(prev => {
          if (prev.some(p => p._id === newPhoto._id)) return prev;
          return [newPhoto, ...prev];
        });
        updateStatsCount(1);
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
        // Update active photo in lightbox if open
        setActivePhoto(prev => prev?._id === photoId ? { ...prev, comments } : prev);
      });

      // AI Curation listeners
      socket.on('photo:ai-curation-start', ({ count }) => {
        setAiCurationProgress({ active: true, count, completed: 0 });
        toast(`🤖 AI Curation started for ${count} photo(s)!`, { icon: '🤖' });
      });

      socket.on('photo:ai-curated', (curatedData) => {
        setPhotos(prev => {
          const nextPhotos = prev.map(p => 
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
          );

          // Update stats locally based on the updated photos array
          const total = nextPhotos.length;
          const bestCount = nextPhotos.filter(p => p.isBestPhoto).length;
          const contribs = {};
          nextPhotos.forEach(p => {
            const name = p.uploadedBy?.name || p.uploadedByName || 'Guest';
            contribs[name] = (contribs[name] || 0) + 1;
          });
          const byMember = Object.entries(contribs).map(([name, count]) => ({ name, photoCount: count }));
          setStats({ total, bestCount, byMember });

          return nextPhotos;
        });

        setAiCurationProgress(prev => {
          if (!prev.active) return prev;
          const nextCompleted = prev.completed + 1;
          if (nextCompleted >= prev.count) {
            return { active: false, count: 0, completed: 0 };
          }
          return { ...prev, completed: nextCompleted };
        });
      });

      socket.on('photo:ai-curation-end', () => {
        setAiCurationProgress({ active: false, count: 0, completed: 0 });
        toast.success('🤖 AI Curation complete!');
        loadAlbum();
      });
    }

    return () => {
      if (socket) {
        socket.emit('group:leave', { groupId: group.id });
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
  }, [group?.id]);

  const loadAlbum = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/album/${inviteCode}?sortBy=${sortBy}${tab === 'best' ? '&bestOnly=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setGroup(data.group);
        setPhotos(data.photos || []);
        
        // Calculate basic stats locally
        const total = data.pagination?.total || data.photos?.length || 0;
        const bestCount = data.photos?.filter(p => p.isBestPhoto).length || 0;
        
        // Contributions
        const contribs = {};
        data.photos?.forEach(p => {
          const name = p.uploadedBy?.name || p.uploadedByName || 'Guest';
          contribs[name] = (contribs[name] || 0) + 1;
        });
        const byMember = Object.entries(contribs).map(([name, count]) => ({ name, photoCount: count }));

        setStats({ total, bestCount, byMember });
      } else {
        toast.error(data.message || 'Album not found');
      }
    } catch (e) {
      toast.error('Failed to load shared album');
    }
    setLoading(false);
  };

  const updateStatsCount = (delta) => {
    setStats(prev => ({
      ...prev,
      total: prev.total + delta
    }));
  };

  // Uploader Handlers
  const handleFiles = (selectedFiles) => {
    const images = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    if (images.length === 0) {
      toast.error('Images only, please!');
      return;
    }
    setFiles(images);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name first!');
      setEditingName(true);
      return;
    }
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    formData.append('uploadedByName', guestName.trim());

    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/upload/${inviteCode}`;
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status === 201) {
          toast.success(response.message || 'Photos uploaded successfully! 📸');
          setFiles([]);
          loadAlbum();
        } else {
          toast.error(response.message || 'Upload failed');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        toast.error('Connection error during upload');
        setUploading(false);
      });

      xhr.open('POST', url);
      xhr.send(formData);
    } catch (err) {
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  // Interaction Handlers
  const fetchDiary = async () => {
    setDiaryLoading(true);
    setShowDiaryModal(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/${inviteCode}/ai-recap`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDiaryText(data.recap);
      } else {
        toast.error(data.message || 'Failed to generate travel diary.');
        setShowDiaryModal(false);
      }
    } catch (e) {
      toast.error('Failed to generate travel diary. Try analyzing more photos first.');
      setShowDiaryModal(false);
    }
    setDiaryLoading(false);
  };

  const fetchTrivia = async () => {
    setTriviaLoading(true);
    setShowTriviaModal(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/${inviteCode}/trivia`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTriviaQuestions(data.quiz || []);
        setCurrentQuestionIdx(0);
        setSelectedOption('');
        setAnswered(false);
        setScore(0);
        setXpEarned(0);
        setTriviaFinished(false);
      } else {
        toast.error(data.message || 'Failed to load trivia.');
        setShowTriviaModal(false);
      }
    } catch (e) {
      toast.error('Failed to load trivia. Make sure there are at least 3 photos first!');
      setShowTriviaModal(false);
    }
    setTriviaLoading(false);
  };

  const drawPostcard = (theme = postcardTheme) => {
    const bestPhotos = photos.filter(p => p.isBestPhoto).slice(0, 3);
    if (bestPhotos.length === 0) {
      toast.error('AI needs to pick at least 1 Best Photo highlight to create a postcard!');
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
    ctx.fillText(`📍 ${group?.destination || 'Destination'}  |  📅 ${photos.length} photos synced`, 300, 135);

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
          ctx.drawImage(validImgs[0].img, 100, 170, 400, 300);
        } else if (validImgs.length === 2) {
          ctx.drawImage(validImgs[0].img, 40, 170, 250, 250);
          ctx.drawImage(validImgs[1].img, 310, 170, 250, 250);
        } else if (validImgs.length >= 3) {
          ctx.drawImage(validImgs[0].img, 150, 170, 300, 220);
          ctx.drawImage(validImgs[1].img, 40, 405, 250, 180);
          ctx.drawImage(validImgs[2].img, 310, 405, 250, 180);
        }

        const textBoxY = validImgs.length >= 3 ? 610 : 490;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(40, textBoxY, 520, 170, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, textBoxY, 520, 170);

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

        ctx.fillStyle = '#EC4899';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ Crafted via FinBuddy AI PhotoVault', 300, textBoxY + 205);

        setPostcardImage(canvas.toDataURL('image/png'));
      } catch (cErr) {
        console.error('Canvas compilation error:', cErr.message);
        toast.error('Failed to compile postcard canvas.');
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
    // 1. Category Filter
    if (selectedCategory !== 'all') {
      const cat = getCategoryForPhoto(photo);
      if (cat !== selectedCategory) return false;
    }

    // 2. Search Query Filter
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

  const handleVote = async (photoId, e) => {
    e?.stopPropagation();
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/${photoId}/vote`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUuid })
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(prev => prev.map(p =>
          p._id === photoId
            ? { ...p, voteCount: data.voteCount, votes: data.hasVoted ? [...(p.votes || []), { user: clientUuid }] : (p.votes || []).filter(v => v.user !== clientUuid) }
            : p
        ));
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleReact = async (photoId, emoji, e) => {
    e?.stopPropagation();
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/${photoId}/react`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, clientUuid })
      });
      const data = await res.json();
      if (data.success) {
        setPhotos(prev => prev.map(p =>
          p._id === photoId ? { ...p, reactions: data.reactions } : p
        ));
      }
    } catch (err) {
      toast.error('Reaction failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activePhoto) return;
    if (!guestName.trim()) {
      toast.error('Please set your nickname before commenting!');
      return;
    }

    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/${activePhoto._id}/comment`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: guestName.trim(), text: newComment.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNewComment('');
        setActivePhoto(prev => ({ ...prev, comments: data.comments }));
        setPhotos(prev => prev.map(p =>
          p._id === activePhoto._id ? { ...p, comments: data.comments } : p
        ));
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const saveGuestName = () => {
    if (!guestName.trim()) {
      toast.error('Name cannot be empty!');
      return;
    }
    localStorage.setItem('guest_name', guestName.trim());
    setEditingName(false);
    toast.success(`Welcome, ${guestName}! 👋`);
  };

  // ZIP Downloader
  const downloadAllZip = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/photos/public/download/${inviteCode}${tab === 'best' ? '?bestOnly=true' : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `trip_${inviteCode}_photos.zip`);
    a.click();
    toast.success('Building ZIP archive... download will start shortly! 📦');
  };

  // Stories Controller
  const bestPhotos = photos.filter(p => p.isBestPhoto);

  useEffect(() => {
    if (showStories && bestPhotos.length > 0) {
      storyTimeoutRef.current = setTimeout(() => {
        handleNextStory();
      }, 4000);
    }
    return () => clearTimeout(storyTimeoutRef.current);
  }, [showStories, storyIdx, bestPhotos.length]);

  const handleNextStory = () => {
    if (storyIdx < bestPhotos.length - 1) {
      setStoryIdx(prev => prev + 1);
    } else {
      setShowStories(false);
      setStoryIdx(0);
    }
  };

  const handlePrevStory = () => {
    if (storyIdx > 0) {
      setStoryIdx(prev => prev - 1);
    }
  };

  // Lightbox Navigation
  const openLightbox = (photo) => {
    const idx = photos.findIndex(p => p._id === photo._id);
    setActivePhoto(photo);
    setActivePhotoIdx(idx);
  };

  const handleNextPhoto = () => {
    if (activePhotoIdx < photos.length - 1) {
      const nextIdx = activePhotoIdx + 1;
      setActivePhoto(photos[nextIdx]);
      setActivePhotoIdx(nextIdx);
    }
  };

  const handlePrevPhoto = () => {
    if (activePhotoIdx > 0) {
      const prevIdx = activePhotoIdx - 1;
      setActivePhoto(photos[prevIdx]);
      setActivePhotoIdx(prevIdx);
    }
  };

  // AI filtering and tags compiled in helper actions above

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6 pb-20 flex flex-col">
      {/* Top Banner / Glass Header */}
      {group && (
        <header className="card border-cyan-500/10 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 px-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{group.emoji || '📸'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <span className="tag-gold text-[10px]">Public Shared Drive</span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                📍 {group.destination || 'Trip Vault'} • {group.description || 'Shared photo gallery'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Nickname Setter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-full md:w-auto">
              {editingName ? (
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    placeholder="Enter nickname..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input-dark py-1 px-2 text-xs border-transparent bg-transparent w-full md:w-32 focus:ring-0 focus:border-transparent"
                    style={{ padding: '4px 8px' }}
                    autoFocus
                  />
                  <button onClick={saveGuestName} className="text-cyan-400 hover:text-cyan-300 font-bold text-xs">Save</button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full md:gap-3">
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    Uploader: <strong className="text-white">{guestName}</strong>
                  </span>
                  <button onClick={() => setEditingName(true)} className="text-[10px] text-cyan-400 hover:underline">Edit</button>
                </div>
              )}
            </div>

            {/* Google Drive Status Banner */}
            {group.hasDrive && (
              <a href={group.driveLink} target="_blank" rel="noreferrer" className="w-full md:w-auto">
                <button className="btn-secondary text-xs flex items-center justify-center gap-2 w-full" style={{ padding: '8px 16px' }}>
                  📁 Open Google Drive Folder
                </button>
              </a>
            )}

            {/* Bulk Download */}
            <button onClick={downloadAllZip} className="btn-primary text-xs flex items-center justify-center gap-2 w-full md:w-auto" style={{ padding: '8px 16px' }}>
              📦 Download ZIP ({stats.total})
            </button>
            {stats.total >= 3 && (
              <>
                <button onClick={fetchDiary} className="btn-secondary text-xs flex items-center justify-center gap-2 w-full md:w-auto font-bold" style={{ padding: '8px 16px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#C084FC' }}>
                  📝 AI Travel Diary
                </button>
                <button onClick={fetchTrivia} className="btn-secondary text-xs flex items-center justify-center gap-2 w-full md:w-auto font-bold" style={{ padding: '8px 16px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22D3EE' }}>
                  🎮 Play Trivia
                </button>
              </>
            )}
          </div>
        </header>
      )}


      {/* AI Curation Progress */}
      {aiCurationProgress.active && (
        <div className="card border-cyan-500/20 bg-cyan-500/5 mb-6 flex items-center justify-between animate-pulse py-3 px-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">🤖</span>
            <div>
              <p className="font-medium text-cyan-400 text-sm">AI Curation in Progress...</p>
              <p className="text-xs text-slate-400">
                Analyzing {aiCurationProgress.count} photo(s)... ({aiCurationProgress.completed}/{aiCurationProgress.count} complete)
              </p>
            </div>
          </div>
          <div className="w-40 bg-white/10 rounded-full h-1.5 overflow-hidden shrink-0">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${(aiCurationProgress.completed / aiCurationProgress.count) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Stories / Highlights Banner */}
      {bestPhotos.length > 0 && (
        <div className="mb-6 card border-yellow-500/10 flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-500/10 text-xl animate-pulse cursor-pointer shrink-0" onClick={() => setShowStories(true)}>
              🎬
            </div>
            <div>
              <p className="font-bold text-sm text-yellow-400">Play Trip Highlights</p>
              <p className="text-xs text-slate-400">{bestPhotos.length} AI-curated moments in a fullscreen slideshow</p>
            </div>
          </div>
          <button onClick={() => setShowStories(true)} className="btn-secondary text-xs" style={{ padding: '6px 12px', width: 'auto' }}>
            Watch Stories
          </button>
        </div>
      )}

      {/* Grid Layout: Left Content, Right Upload and stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Photo Timeline Gallery */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar */}
          <div className="space-y-3 bg-[var(--bg-secondary)] border border-white/5 p-3 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex gap-1">
                {[
                  { id: 'all', label: `All Photos (${stats.total})` },
                  { id: 'best', label: `⭐ AI Highlights (${stats.bestCount})` }
                ].map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      tab === t.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="🔍 Search photos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-dark text-xs w-full py-1.5 px-3 rounded-xl border-white/10"
                  style={{ padding: '6px 12px' }}
                />
              </div>

              {/* Sort Selector */}
              <select className="input-dark py-1 text-xs" value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ width: 'auto', padding: '6px 12px' }}>
                <option value="latest">🕐 Newest</option>
                <option value="votes">❤️ Most Liked</option>
                <option value="quality">🤖 AI Curation</option>
                <option value="oldest">📅 Oldest</option>
              </select>
            </div>

            {/* Smart Category Filters */}
            <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
              {[
                { id: 'all', label: '🏷️ All Categories' },
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

          {/* Photo Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="card text-center py-20 border-white/5 bg-white/[0.01]">
              <span className="text-5xl mb-4 block">📸</span>
              <h4 className="text-lg font-bold">No photos found</h4>
              <p className="text-slate-400 text-sm mt-1">Be the first to share trip photos in high quality!</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="card text-center py-20 border-white/5 bg-white/[0.01]">
              <span className="text-5xl mb-4 block">🔍</span>
              <h4 className="text-lg font-bold">No matching photos found</h4>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search query or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredPhotos.map(photo => {
                const hasVoted = photo.votes?.some(v => v.user?.toString() === clientUuid);
                const reactionCounts = {
                  '❤️': photo.reactions?.filter(r => r.emoji === '❤️').length || 0,
                  '😂': photo.reactions?.filter(r => r.emoji === '😂').length || 0,
                  '🔥': photo.reactions?.filter(r => r.emoji === '🔥').length || 0
                };
                const myReactions = photo.reactions?.filter(r => r.user?.toString() === clientUuid).map(r => r.emoji) || [];

                return (
                  <div key={photo._id} onClick={() => openLightbox(photo)}
                    className={`relative group rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                      photo.isBestPhoto ? 'border-yellow-500/30 shadow-lg' : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-square bg-white/5 relative">
                      <img src={photo.cloudinaryUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      
                      {/* Curation Badges */}
                      {photo.isBestPhoto && (
                        <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">⭐ Highlights</div>
                      )}

                      {/* Info overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {photo.aiTags?.slice(0, 2).map((t, i) => (
                            <span key={i} className="text-[9px] bg-black/50 text-white px-1 py-0.5 rounded-md">#{t}</span>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
                          <button onClick={e => handleVote(photo._id, e)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                              hasVoted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-red-500/60'
                            }`}
                          >
                            ❤️ {photo.voteCount || 0}
                          </button>

                          <span className="text-[10px] text-slate-400">💬 {photo.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer / Nickname */}
                    <div className="p-2 bg-[var(--bg-secondary)] flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate max-w-[80px]">
                        👤 {photo.uploadedBy?.name || photo.uploadedByName || 'Guest'}
                      </span>
                      {group.hasDrive && (
                        photo.driveSynced ? (
                          <span className="text-[10px] text-green-400 font-semibold" title="Saved to Google Drive! ✅">📁 Drive</span>
                        ) : (
                          <span className="text-[10px] text-yellow-500 animate-pulse" title="Syncing to Google Drive... ⏳">📁 Saving...</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Uploader Widget & Contribution board */}
        <div className="space-y-6">
          {/* Uploader Card */}
          <div className="card border-cyan-500/15">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>📤 Upload Photos</span>
              <span className="tag-gold text-[9px]">Original Quality</span>
            </h3>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
                disabled={uploading}
              />
              <span className="text-4xl block mb-2">{dragActive ? '📂' : '📸'}</span>
              <p className="text-sm font-bold">Drop files here or click to select</p>
              <p className="text-[10px] text-slate-400 mt-1">High-resolution retained • No compression</p>
            </div>

            {/* File Previews / Progress */}
            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{files.length} file(s) selected</span>
                  <button onClick={() => setFiles([])} className="text-red-400 hover:underline" disabled={uploading}>Clear</button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {files.map((file, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/5">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Uploading to shared drive...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full py-2.5 text-xs font-bold">
                  {uploading ? `Uploading... ${uploadProgress}%` : `📤 Start Uploading`}
                </button>
              </div>
            )}
          </div>

          {/* Contributions Scoreboard */}
          {stats.byMember?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-sm mb-3">📊 Photo Contributors</h3>
              <div className="space-y-2.5">
                {stats.byMember.sort((a,b) => b.photoCount - a.photoCount).map((m, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-medium">#{i + 1}</span>
                      <span className="text-xs font-bold">{m.name}</span>
                    </div>
                    <span className="text-xs text-cyan-400 font-bold">{m.photoCount} photos</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FinBuddy App Referral CTA */}
          <div className="card border-pink-500/20 bg-pink-500/5 p-4 text-center">
            <h4 className="font-bold text-xs text-pink-400 mb-1">⚡ Power up with FinBuddy</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Want to split budgets, manage expenses, and plan trip logistics together?
            </p>
            <Link to="/register">
              <button className="btn-rose text-[10px] py-1.5 px-3 rounded-lg w-full font-bold">
                Create Free Account
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Instagram-Style Stories Viewer ── */}
      {showStories && bestPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex flex-col justify-between z-50 p-4 animate-fade-in">
          {/* Progress Indicators */}
          <div className="w-full flex gap-1.5 px-2 mt-2">
            {bestPhotos.map((_, idx) => (
              <div key={idx} className="flex-1 bg-white/20 h-1 rounded-full overflow-hidden">
                <div className={`h-full bg-yellow-400 transition-all ${
                  idx < storyIdx ? 'w-full' :
                  idx === storyIdx ? 'w-full duration-[4000ms] ease-linear' : 'w-0'
                }`} style={{
                  transitionProperty: idx === storyIdx ? 'width' : 'none'
                }} />
              </div>
            ))}
          </div>

          {/* Story Header */}
          <div className="flex justify-between items-center text-white px-2 mt-4 z-10">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center font-bold text-black text-xs">⭐</span>
              <div>
                <p className="text-xs font-bold">Best Moments</p>
                <p className="text-[10px] text-slate-400">
                  {bestPhotos[storyIdx]?.uploadedBy?.name || bestPhotos[storyIdx]?.uploadedByName || 'Guest'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowStories(false)} className="text-white hover:text-slate-300 text-lg">✕</button>
          </div>

          {/* Image & Navigation area */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            <button onClick={handlePrevStory} className="absolute left-2 text-white/50 hover:text-white text-3xl z-10">‹</button>
            <img src={bestPhotos[storyIdx]?.cloudinaryUrl} alt="" className="max-w-full max-h-[70vh] object-contain rounded-2xl border border-white/10" />
            <button onClick={handleNextStory} className="absolute right-2 text-white/50 hover:text-white text-3xl z-10">›</button>
          </div>

          {/* Story Footer */}
          <div className="text-center text-slate-300 text-xs px-4 pb-6 min-h-[50px] flex items-center justify-center">
            <p className="italic">
              {bestPhotos[storyIdx]?.caption || bestPhotos[storyIdx]?.aiDescription || 'Highlights moment'}
            </p>
          </div>
        </div>
      )}

      {/* ── Photo Lightbox & Comments Drawer ── */}
      {activePhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4 animate-fade-in" onClick={() => setActivePhoto(null)}>
          <div className="w-full max-w-5xl bg-[var(--bg-secondary)] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] glow-violet shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Left Column: Image viewer */}
            <div className="flex-1 bg-black/40 flex items-center justify-center relative min-h-[40vh] md:min-h-0">
              <button onClick={handlePrevPhoto} disabled={activePhotoIdx === 0}
                className="absolute left-3 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center text-2xl disabled:opacity-20 hover:bg-black/80 z-10"
              >
                ‹
              </button>
              
              <img src={activePhoto.cloudinaryUrl} alt="" className="max-w-full max-h-[50vh] md:max-h-[80vh] object-contain" />
              
              <button onClick={handleNextPhoto} disabled={activePhotoIdx === photos.length - 1}
                className="absolute right-3 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center text-2xl disabled:opacity-20 hover:bg-black/80 z-10"
              >
                ›
              </button>
            </div>

            {/* Right Column: Interaction & Comments */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-6 flex flex-col justify-between bg-[var(--bg-secondary)] max-h-[50vh] md:max-h-[85vh]">
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm truncate">{activePhoto.fileName || 'Photo'}</h4>
                    <p className="text-[11px] text-slate-400">
                      Uploaded by {activePhoto.uploadedBy?.name || activePhoto.uploadedByName || 'Guest'}
                    </p>
                  </div>
                  <button onClick={() => setActivePhoto(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
                </div>

                {/* Caption / AI Description */}
                <p className="text-xs text-slate-300 italic mb-4 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  {activePhoto.caption || activePhoto.aiDescription || 'No description'}
                </p>

                {/* Reactions */}
                <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
                  {['❤️', '😂', '🔥'].map(emoji => {
                    const count = activePhoto.reactions?.filter(r => r.emoji === emoji).length || 0;
                    const active = activePhoto.reactions?.some(r => r.user?.toString() === clientUuid && r.emoji === emoji);
                    
                    return (
                      <button key={emoji} onClick={() => handleReact(activePhoto._id, emoji)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition border ${
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

                {/* Memory Board Comments */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider">💬 Memories Wall</h5>
                  <div className="space-y-2 max-h-40 md:max-h-64 overflow-y-auto no-scrollbar pr-1">
                    {!activePhoto.comments || activePhoto.comments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2">No guest comments yet. Leave a memory below!</p>
                    ) : (
                      activePhoto.comments.map((comment, i) => (
                        <div key={i} className="bg-white/5 p-2 rounded-xl border border-white/5 text-xs text-left">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="font-bold text-slate-300">{comment.userName}</span>
                            <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-200">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Add comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="input-dark py-1.5 px-3 text-xs flex-1"
                />
                <button type="submit" disabled={!newComment.trim()} className="btn-primary text-xs w-auto px-4 py-1.5">
                  Send
                </button>
              </form>

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
                        <a href={postcardImage} download={`postcard_${inviteCode}.png`} className="w-full">
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
    <SectionGuide sectionId="/public/photos/:inviteCode" />
    </div>
  );
};

export default PublicPhotoVault;
