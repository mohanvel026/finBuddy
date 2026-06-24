import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, BookOpen, ChevronRight, Layers, Cpu, CheckCircle, 
  ChevronDown, ChevronUp, CheckSquare, Square, Lightbulb, 
  Award, Compass, Sparkles, Check, RefreshCw, Star, Info, HelpCircle,
  Eye, EyeOff, LayoutGrid, CheckCircle2, AlertCircle, Share2, Network
} from 'lucide-react';
import { featureGuides, guideCategories } from '../data/featureGuideData';
import SectionGuide from '../components/common/SectionGuide';

const FeatureGuide = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'completed' | 'pending'
  const [showSitemap, setShowSitemap] = useState(true);
  const [flashCardId, setFlashCardId] = useState(null);
  const [scrollTargetId, setScrollTargetId] = useState(null);

  const cardRefs = useRef({});

  // Load checklist progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finbuddy_guide_progress');
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Toggle checks (synced to localStorage)
  const handleToggleCheck = (guideId, idx) => {
    const key = `${guideId}-${idx}`;
    const updated = {
      ...checkedItems,
      [key]: !checkedItems[key]
    };
    setCheckedItems(updated);
    localStorage.setItem('finbuddy_guide_progress', JSON.stringify(updated));
  };

  // Reset progress logic
  const handleResetProgress = () => {
    localStorage.removeItem('finbuddy_guide_progress');
    setCheckedItems({});
    setShowConfirmReset(false);
  };

  // Get total checklist items & completed items across all guides
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  Object.values(featureGuides).forEach(guide => {
    const tasks = guide.checklist || [];
    tasks.forEach((_, idx) => {
      totalTasksCount++;
      if (checkedItems[`${guide.id}-${idx}`]) {
        completedTasksCount++;
      }
    });
  });

  const overallPercent = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Toggle card expansion
  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand all / Collapse all helper
  const handleExpandAll = (mustExpand) => {
    if (mustExpand) {
      const allExpanded = {};
      filteredGuides.forEach(g => {
        allExpanded[g.id] = true;
      });
      setExpandedItems(allExpanded);
    } else {
      setExpandedItems({});
    }
  };

  // Category counts dictionary
  const categoryCounts = {
    all: Object.keys(featureGuides).length
  };
  Object.values(featureGuides).forEach(guide => {
    categoryCounts[guide.category] = (categoryCounts[guide.category] || 0) + 1;
  });

  // Filter guides list
  const filteredGuides = Object.values(featureGuides).filter(guide => {
    const matchesCategory = activeCategory === 'all' || guide.category === activeCategory;
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      guide.title.toLowerCase().includes(term) ||
      guide.tag.toLowerCase().includes(term) ||
      guide.desc.toLowerCase().includes(term) ||
      (guide.benefits && guide.benefits.some(b => b.toLowerCase().includes(term))) ||
      (guide.features && guide.features.some(f => f.name.toLowerCase().includes(term) || f.desc.toLowerCase().includes(term))) ||
      (guide.checklist && guide.checklist.some(c => c.toLowerCase().includes(term)));
      
    if (!matchesCategory || !matchesSearch) return false;

    // Check progress filter
    const tasks = guide.checklist || [];
    let isCompleted = false;
    if (tasks.length > 0) {
      let done = 0;
      tasks.forEach((_, idx) => {
        if (checkedItems[`${guide.id}-${idx}`]) done++;
      });
      isCompleted = done === tasks.length;
    }

    if (filterStatus === 'completed') return isCompleted;
    if (filterStatus === 'pending') return !isCompleted;
    return true;
  });

  // Get category theme colors & gradient borders
  const getThemeClass = (category) => {
    switch (category) {
      case 'finance':
        return {
          glow: 'border-emerald-500/20 hover:border-emerald-500/40 shadow-emerald-500/2 bg-gradient-to-br from-emerald-500/[0.02] via-slate-900/40 to-slate-950/90',
          badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          accent: 'text-emerald-400',
          dot: 'bg-emerald-400',
          hex: '#10b981'
        };
      case 'trading':
        return {
          glow: 'border-cyan-500/20 hover:border-cyan-500/40 shadow-cyan-500/2 bg-gradient-to-br from-cyan-500/[0.02] via-slate-900/40 to-slate-950/90',
          badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
          accent: 'text-cyan-400',
          dot: 'bg-cyan-400',
          hex: '#06b6d4'
        };
      case 'trips':
        return {
          glow: 'border-amber-500/20 hover:border-amber-500/40 shadow-amber-500/2 bg-gradient-to-br from-amber-500/[0.02] via-slate-900/40 to-slate-950/90',
          badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          accent: 'text-amber-400',
          dot: 'bg-amber-400',
          hex: '#f59e0b'
        };
      case 'ai':
        return {
          glow: 'border-pink-500/20 hover:border-pink-500/40 shadow-pink-500/2 bg-gradient-to-br from-pink-500/[0.02] via-slate-900/40 to-slate-950/90',
          badge: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
          accent: 'text-pink-400',
          dot: 'bg-pink-400',
          hex: '#ec4899'
        };
      case 'system':
        return {
          glow: 'border-violet-500/20 hover:border-violet-500/40 shadow-violet-500/2 bg-gradient-to-br from-violet-500/[0.02] via-slate-900/40 to-slate-950/90',
          badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
          accent: 'text-violet-400',
          dot: 'bg-violet-400',
          hex: '#8b5cf6'
        };
      default:
        return {
          glow: 'border-white/5 hover:border-white/10 shadow-white/1 bg-slate-950/20',
          badge: 'bg-white/5 border-white/10 text-slate-400',
          accent: 'text-slate-300',
          dot: 'bg-slate-400',
          hex: '#94a3b8'
        };
    }
  };

  const getProgressLevel = () => {
    if (overallPercent === 0) return { title: 'NOVICE', color: 'text-slate-400 border-slate-500/20 bg-slate-500/5' };
    if (overallPercent < 25) return { title: 'EXPLORER', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' };
    if (overallPercent < 60) return { title: 'FINANCIAL BUILDER', color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' };
    if (overallPercent < 90) return { title: 'STRATEGIST', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5' };
    if (overallPercent < 100) return { title: 'GURU CONTENDER', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' };
    return { title: 'MASTER ADVISOR', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse' };
  };

  const currentLevel = getProgressLevel();

  const milestones = [
    { value: 25, label: 'Explorer' },
    { value: 50, label: 'Builder' },
    { value: 75, label: 'Strategist' },
    { value: 100, label: 'Master' }
  ];

  // Sitemap node clicking triggers card scroll + expand + temporary border highlight
  const handleNodeClick = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: true }));
    setActiveCategory('all');
    setFilterStatus('all');
    setScrollTargetId(id);
  };

  // Scroll to targeted element after state updates and DOM paints
  useEffect(() => {
    if (!scrollTargetId) return;

    const timeoutId = setTimeout(() => {
      const element = cardRefs.current[scrollTargetId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setFlashCardId(scrollTargetId);
        setTimeout(() => setFlashCardId(null), 1500);
      }
      setScrollTargetId(null);
    }, 150); // Settle delay for state update and layout calculation

    return () => clearTimeout(timeoutId);
  }, [scrollTargetId]);

  const getCategoryMeta = (catId) => {
    return guideCategories.find(c => c.id === catId) || { name: 'Other', icon: '📁' };
  };

  const getProgressMessage = () => {
    if (overallPercent === 0) return "Welcome! Check off onboarding exercises inside cards below to track platform mastery.";
    if (overallPercent < 25) return "Great start! Navigate through pages, read tutorials, and mark tasks to expand your skills.";
    if (overallPercent < 60) return "You are building structural stability! Compound and backtest strategies to increase score.";
    if (overallPercent < 90) return "Outstanding strategist skills! You are checking off calculations at high rates.";
    if (overallPercent < 100) return "So close to complete platform mastery! Complete the remaining exercises.";
    return "🏆 Absolute Mastery! You have completed all onboarding exercises across the platform!";
  };

  // Sitemap Tree Nodes & Layout
  const sitemapNodes = [
    // Center Root
    { id: 'root', x: 400, y: 160, label: 'FinBuddy Hub', isRoot: true },
    
    // Level 1 Categories
    { id: 'cat-finance', pid: 'root', x: 250, y: 80, label: 'Personal Finance', color: '#10b981', isCat: true },
    { id: 'cat-trading', pid: 'root', x: 250, y: 160, label: 'Trading & Markets', color: '#06b6d4', isCat: true },
    { id: 'cat-trips', pid: 'root', x: 250, y: 240, label: 'Social & Trips', color: '#f59e0b', isCat: true },
    { id: 'cat-ai', pid: 'root', x: 550, y: 110, label: 'AI Assistants', color: '#ec4899', isCat: true },
    { id: 'cat-system', pid: 'root', x: 550, y: 210, label: 'System & Admin', color: '#8b5cf6', isCat: true },

    // Level 2 Pages (Finance)
    { id: '/dashboard', pid: 'cat-finance', x: 100, y: 35, label: 'Dashboard', ref: '/dashboard' },
    { id: '/wealth', pid: 'cat-finance', x: 100, y: 70, label: 'Wealth Vault', ref: '/wealth' },
    { id: '/mf', pid: 'cat-finance', x: 100, y: 105, label: 'Mutual Funds', ref: '/mf' },
    
    // Level 2 Pages (Trading)
    { id: '/trade', pid: 'cat-trading', x: 100, y: 145, label: 'Trade Arena', ref: '/trade' },
    { id: '/trade/strategy', pid: 'cat-trading', x: 100, y: 175, label: 'Strategy Lab', ref: '/trade/strategy' },
    { id: '/trade/backtest', pid: 'cat-trading', x: 100, y: 205, label: 'Backtests', ref: '/trade/backtest' },
    
    // Level 2 Pages (Trips)
    { id: '/split', pid: 'cat-trips', x: 100, y: 245, label: 'SplitSmart', ref: '/split' },
    { id: '/split/trip/:groupId', pid: 'cat-trips', x: 100, y: 275, label: 'Trip Vault', ref: '/split/trip/:groupId' },
    { id: '/split/photos/:groupId', pid: 'cat-trips', x: 100, y: 305, label: 'Photo Vault', ref: '/split/photos/:groupId' },

    // Level 2 Pages (AI & Sandbox)
    { id: '/mentor', pid: 'cat-ai', x: 700, y: 55, label: 'AI Mentor', ref: '/mentor' },
    { id: '/learn', pid: 'cat-ai', x: 700, y: 90, label: 'Academy', ref: '/learn' },
    { id: '/learn/lab', pid: 'cat-ai', x: 700, y: 125, label: 'Sandbox Lab', ref: '/learn/lab' },
    { id: '/playground', pid: 'cat-ai', x: 700, y: 160, label: 'Playground', ref: '/playground' },

    // Level 2 Pages (System & Admin)
    { id: '/profile', pid: 'cat-system', x: 700, y: 200, label: 'Profile Settings', ref: '/profile' },
    { id: '/admin', pid: 'cat-system', x: 700, y: 235, label: 'Admin Metrics', ref: '/admin' },
    { id: '/guide', pid: 'cat-system', x: 700, y: 270, label: 'Mastery Guide', ref: '/guide' }
  ];

  return (
    <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10 min-h-screen bg-[var(--bg-primary)] space-y-6 relative overflow-hidden">
      
      {/* Background Decorative Neon Glow Bubbles */}
      <div className="absolute top-[-100px] left-[20%] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-50px] right-[10%] w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5 relative z-10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            📖 FinBuddy Mastery Hub & Guide
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            An interactive dashboard tracking your financial literacy progress, onboarding exercises, and tool guides.
          </p>
        </div>
        
        {/* Reset progress controls */}
        {totalTasksCount > 0 && (
          <div className="relative shrink-0">
            {showConfirmReset ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-red-500/30 p-2 rounded-xl text-xs shadow-2xl">
                <span className="text-red-400 font-bold">Clear progress?</span>
                <button 
                  onClick={handleResetProgress}
                  className="px-2.5 py-1 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
                >
                  Yes
                </button>
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2.5 py-1 bg-white/5 text-slate-300 font-bold rounded-lg hover:bg-white/10 transition"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold border border-white/5 bg-white/3 hover:bg-white/8 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Reset Onboarding Checklist</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mastery Progress Tracker Card */}
      <div className="card glass p-6 border border-white/5 rounded-3xl relative overflow-hidden bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-slate-900/50 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left Block: Level & Status */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl animate-bounce">🏆</span>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Platform Mastery Progress
              </h2>
              <span className={`text-[9px] font-extrabold font-mono tracking-widest px-3 py-1 rounded-full border ${currentLevel.color}`}>
                {currentLevel.title}
              </span>
              <span className="text-[10px] font-black font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                {completedTasksCount} / {totalTasksCount} Tasks Completed
              </span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-semibold pr-4">
              {getProgressMessage()}
            </p>

            {/* Milestones Track */}
            <div className="relative pt-4 hidden sm:block">
              <div className="h-1 bg-white/5 rounded-full w-full absolute top-6" />
              <div 
                className="h-1 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full absolute top-6 transition-all duration-700 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                style={{ width: `${overallPercent}%` }}
              />
              
              <div className="flex justify-between items-center relative">
                {milestones.map((m, i) => {
                  const isReached = overallPercent >= m.value;
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black z-20 transition duration-500 ${
                        isReached 
                          ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]' 
                          : 'bg-slate-950 border-white/10 text-slate-500'
                      }`}>
                        {isReached ? '✓' : i + 1}
                      </div>
                      <span className={`text-[9px] font-extrabold mt-1.5 uppercase tracking-wider transition ${isReached ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {m.label} ({m.value}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Right Block: Circular Gauge */}
          <div className="flex items-center justify-center shrink-0 lg:pl-6">
            <div className="relative w-28 h-28 flex items-center justify-center bg-white/[0.01] rounded-full p-2 border border-white/5">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="42" 
                  className="stroke-white/5 fill-transparent" 
                  strokeWidth="6"
                />
                <circle 
                  cx="50" cy="50" r="42" 
                  className="stroke-cyan-400 fill-transparent transition-all duration-700" 
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-mono leading-none">{overallPercent}%</span>
                <span className="text-[8px] font-extrabold text-slate-500 tracking-wider uppercase mt-1">Mastery</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Visual Interactive Sitemap Tree */}
      <div className="card glass border border-white/5 rounded-3xl overflow-hidden bg-slate-950/45 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-10 relative">
        <div 
          onClick={() => setShowSitemap(!showSitemap)}
          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-white/[0.02] transition border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🕸️</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                  Interactive Sitemap Network Graph
                </span>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-md animate-pulse">
                  Interactive Node Map
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Click any node below to instantly navigate, expand, and highlight its detailed card specifications
              </p>
            </div>
          </div>
          <button className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 transition">
            {showSitemap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showSitemap && (
          <div className="p-4 sm:p-6 overflow-x-auto bg-slate-950/20">
            <div className="min-w-[800px] w-full max-w-[900px] mx-auto relative">
              <svg viewBox="0 0 800 340" className="w-full h-auto select-none">
                <defs>
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Connection Lines (Curved Bezier Paths) */}
                {sitemapNodes.map((node, i) => {
                  if (node.isRoot) return null;
                  const parent = sitemapNodes.find(n => n.id === node.pid);
                  if (!parent) return null;

                  // Compute control points for a smooth S-curve
                  const cp1x = (parent.x + node.x) / 2;
                  const cp1y = parent.y;
                  const cp2x = (parent.x + node.x) / 2;
                  const cp2y = node.y;

                  return (
                    <path
                      key={`link-${i}`}
                      d={`M ${parent.x} ${parent.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${node.x} ${node.y}`}
                      fill="none"
                      stroke={node.color || '#334155'}
                      strokeWidth={node.isCat ? 1.5 : 1}
                      strokeDasharray={node.isCat ? 'none' : '3,3'}
                      className="opacity-40"
                    />
                  );
                })}

                {/* Nodes Render */}
                {sitemapNodes.map((node) => {
                  const isInteractive = !node.isRoot && !node.isCat;
                  const labelColor = node.isRoot ? '#ffffff' : node.isCat ? '#f8fafc' : '#94a3b8';
                  const radius = node.isRoot ? 12 : node.isCat ? 8 : 5;

                  return (
                    <g 
                      key={node.id} 
                      className={isInteractive ? 'cursor-pointer group' : ''}
                      onClick={() => isInteractive && handleNodeClick(node.id)}
                    >
                      {/* Hover ring (for pages) */}
                      {isInteractive && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 5}
                          fill="none"
                          stroke="rgba(6,182,212,0.4)"
                          strokeWidth="1.5"
                          className="opacity-0 group-hover:opacity-100 transition duration-300"
                          style={{ filter: 'url(#neon-glow)' }}
                        />
                      )}

                      {/* Main Node Point */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={node.isRoot ? '#ffffff' : node.color || '#1e293b'}
                        stroke={node.isRoot ? 'rgba(255,255,255,0.4)' : node.color || '#475569'}
                        strokeWidth={node.isRoot ? 4 : 1.5}
                        className="transition duration-300 group-hover:scale-125"
                      />

                      {/* Label Text */}
                      <text
                        x={node.x}
                        y={node.y - (radius + 6)}
                        textAnchor="middle"
                        fill={labelColor}
                        fontSize={node.isRoot ? 11 : node.isCat ? 9 : 8}
                        fontWeight={node.isRoot || node.isCat ? 'black' : 'bold'}
                        className="font-sans transition duration-300 group-hover:fill-cyan-400"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>


      {/* Controllers: Search & filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between border-b border-white/5 pb-4 z-10 relative">
        
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search tools, checklists, descriptions or tips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/5 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400/50 transition duration-200"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Progress Filters */}
          <div className="flex bg-white/3 p-0.5 rounded-xl border border-white/5 text-[10px] font-black uppercase">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'completed', label: 'Done' },
              { id: 'pending', label: 'Pending' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterStatus === f.id 
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Expand/Collapse Actions */}
          <button 
            onClick={() => handleExpandAll(true)}
            className="px-3.5 py-1.5 bg-white/3 hover:bg-white/8 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold border border-white/5 transition cursor-pointer"
          >
            Expand All
          </button>
          <button 
            onClick={() => handleExpandAll(false)}
            className="px-3.5 py-1.5 bg-white/3 hover:bg-white/8 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold border border-white/5 transition cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Dynamic Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold z-10 relative">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer border ${
            activeCategory === 'all'
              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-white bg-white/3 border-white/5 hover:border-white/10'
          }`}
        >
          <Layers size={13} />
          <span>All Modules</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
            {categoryCounts.all}
          </span>
        </button>

        {guideCategories.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white bg-white/3 border-white/5 hover:border-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Guides Grid */}
      <div key={`${activeCategory}-${searchTerm}-${filterStatus}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">
        {filteredGuides.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-500 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3">
            <HelpCircle size={32} className="text-slate-600 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-white">No guide modules match your search filter</p>
              <p className="text-xs mt-1 text-slate-500">Try changing your category tab filters or checking off pending exercises.</p>
            </div>
            <button
              onClick={() => { setSearchTerm(''); setActiveCategory('all'); setFilterStatus('all'); }}
              className="mt-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 font-extrabold rounded-xl text-xs transition cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          filteredGuides.map((guide, gIdx) => {
            const isExpanded = !!expandedItems[guide.id];
            const isFlashed = flashCardId === guide.id;
            
            // Calculate progress for this card
            const tasks = guide.checklist || [];
            let completedCount = 0;
            tasks.forEach((_, idx) => {
              if (checkedItems[`${guide.id}-${idx}`]) completedCount++;
            });
            const cardPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
            const isCardCompleted = cardPercent === 100 && tasks.length > 0;

            const catMeta = getCategoryMeta(guide.category);
            const theme = getThemeClass(guide.category);

            return (
              <div
                key={guide.id}
                ref={el => cardRefs.current[guide.id] = el}
                id={`card-${guide.id}`}
                className={`card glass p-5 flex flex-col justify-between border relative lesson-panel-enter lesson-panel-enter-d${(gIdx % 4) + 1} opacity-0 ${
                  isExpanded ? 'bg-slate-900/60 shadow-[0_0_25px_rgba(0,0,0,0.6)]' : 'shadow-[0_4px_15px_rgba(0,0,0,0.2)]'
                } ${isFlashed 
                  ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-cyan-500/[0.04]' 
                  : theme.glow
                }`}
                style={{
                  transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s, box-shadow 0.5s, background-color 0.5s',
                  willChange: 'transform, border-color, box-shadow, background-color',
                  transform: isFlashed ? 'scale(1.02) translate3d(0,0,0)' : 'scale(1) translate3d(0,0,0)',
                  transitionDelay: isFlashed ? '0s' : '0.1s'
                }}
              >
                
                {/* Visual completion overlay glow */}
                {isCardCompleted && (
                  <div className="absolute top-3 right-3 flex items-center justify-center text-green-400 drop-shadow shadow-green-500 animate-pulse">
                    <CheckCircle2 size={16} />
                  </div>
                )}

                <div className="space-y-4">
                  {/* Top Bar: Icon, Title, Tags */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-white/5 rounded-2xl border border-white/5 shrink-0 select-none">
                        {guide.icon || catMeta.icon}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-sm text-white leading-snug group-hover:text-cyan-400 transition-colors">
                          {guide.title}
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 font-mono ${theme.accent}`}>
                          {guide.tag}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md border font-mono shrink-0 select-none ${
                      guide.id.startsWith('smart-') 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    }`}>
                      {guide.id.startsWith('smart-') ? 'engine' : 'page'}
                    </span>
                  </div>

                  {/* Summary Description */}
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {guide.desc}
                  </p>

                  {/* Card specific checklist progress indicator */}
                  {tasks.length > 0 && (
                    <div className="space-y-1 bg-white/[0.01] border border-white/5 p-2.5 rounded-2xl">
                      <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wide">
                        <span className="text-slate-500">Exercise Completion</span>
                        <span className={isCardCompleted ? 'text-green-400' : 'text-cyan-400'}>
                          {completedCount}/{tasks.length} Done ({cardPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCardCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${cardPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Primary Advantages / Core Benefits */}
                  {guide.benefits && guide.benefits.length > 0 && (
                    <div className="p-3 bg-white/2 border border-white/5 rounded-2xl text-[11px] leading-relaxed text-slate-300">
                      <strong className="text-[8px] uppercase tracking-widest text-slate-500 block mb-1.5 font-mono">
                        Key Value Proposition
                      </strong>
                      <ul className="space-y-1.5 list-none pl-0">
                        {guide.benefits.map((benefit, i) => (
                          <li key={i} className="flex gap-1.5 items-start">
                            <span className="text-emerald-400 select-none font-bold">✓</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Expanded Accordion Area */}
                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t border-white/5 animate-in fade-in duration-300 text-xs">
                      
                      {/* Capabilities list */}
                      {guide.features && guide.features.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-mono">
                            Capabilities & Features
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {guide.features.map((f, i) => (
                              <div key={i} className="bg-white/2 border border-white/5 p-2.5 rounded-2xl space-y-0.5 hover:bg-white/3 transition">
                                <h5 className={`font-extrabold flex items-center gap-1.5 text-[11px] ${theme.accent}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                                  {f.name}
                                </h5>
                                <p className="text-[11px] text-slate-400 pl-3 leading-relaxed font-medium">
                                  {f.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Onboarding steps (Vertical Timeline) */}
                      {guide.howToUse && guide.howToUse.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-mono">
                            How to Get Started
                          </span>
                          <div className="relative pl-1.5 space-y-3">
                            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 border-l border-white/5 border-dashed" />
                            {guide.howToUse.map((step, i) => (
                              <div key={i} className="flex gap-3 items-start relative z-10">
                                <span className={`w-5 h-5 shrink-0 rounded-full text-[9px] font-black flex items-center justify-center font-mono transition duration-300 ${
                                  overallPercent >= (100 / guide.howToUse.length) * i
                                    ? 'bg-slate-900 border border-cyan-500/40 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                                    : 'bg-slate-950 border border-white/10 text-slate-500'
                                }`}>
                                  {i + 1}
                                </span>
                                <p className="text-[11px] text-slate-300 leading-relaxed font-medium pt-0.5">
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive exercises */}
                      {tasks.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase tracking-widest text-slate-500 block font-mono">
                            Interactive Onboarding Exercises
                          </span>
                          <div className="space-y-2">
                            {tasks.map((task, idx) => {
                              const isChecked = !!checkedItems[`${guide.id}-${idx}`];
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleToggleCheck(guide.id, idx)}
                                  className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border text-left transition duration-200 cursor-pointer ${
                                    isChecked
                                      ? 'bg-green-500/5 border-green-500/10 text-slate-500'
                                      : 'bg-white/[0.01] border-white/5 text-slate-200 hover:border-white/10'
                                  }`}
                                >
                                  <span className={`shrink-0 transition-transform active:scale-90 ${isChecked ? 'text-green-400' : 'text-slate-500'}`}>
                                    {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                                  </span>
                                  <span className={`text-[11px] font-bold leading-normal ${isChecked ? 'line-through text-slate-500 font-medium' : ''}`}>
                                    {task}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pro tip card */}
                      {guide.proTip && (
                        <div className="p-3.5 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex gap-2.5 items-start">
                          <span className="text-cyan-400 shrink-0 mt-0.5"><Lightbulb size={16} /></span>
                          <div className="space-y-0.5">
                            <h5 className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">Pro Advice</h5>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{guide.proTip}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Card Controls */}
                <div className="flex gap-2.5 mt-5 pt-4 border-t border-white/5 shrink-0 z-10 relative">
                  <button
                    onClick={() => toggleExpand(guide.id)}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold text-center border border-white/5 bg-white/3 hover:bg-white/8 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{isExpanded ? 'Hide Specifications' : 'View Specifications'}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <Link
                    to={guide.path}
                    className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Go to Page</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    
      <SectionGuide sectionId="/guide" />
    </main>
  );
};

export default FeatureGuide;
