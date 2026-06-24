// client/src/components/common/Sidebar.jsx — Responsive Industry-Grade Navigation Shell
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Menu, X, Settings, LogOut, Search, Plus, Trash2, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getSocket } from '../../services/socket';


const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard', desc: 'Financial Overview' },
  { path: '/smart', icon: '🧠', label: 'Smart Lab', desc: '14+ AI Decision Tools' },
  { path: '/wealth', icon: '📊', label: 'Wealth Hub', desc: 'Portfolio, RE, Screener' },
  { path: '/trade', icon: '📈', label: 'Trading Arena', desc: 'Stock Trading & Options' },
  { path: '/split', icon: '💸', label: 'Social & Split', desc: 'Groups, Vaults, Battles' },
  { path: '/playground', icon: '🎮', label: 'Playground', desc: 'Gamified Winding Path' },
  { path: '/learn', icon: '🎓', label: 'Academy', desc: 'Courses & Quizzes' },
  { path: '/mentor', icon: '🤖', label: 'AI Mentor', desc: 'Personal FinGuru Advisor' },
  { path: '/guide', icon: '📖', label: 'App Guide', desc: 'Interactive Feature Directory' },
];



const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
const shortcutText = isMac ? '⌘K' : 'Ctrl+K';

// Helper for Levenshtein Distance (typo tolerance)
const levenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Advanced Fuzzy Matching & Scoring algorithm
const fuzzyScore = (item, query) => {
  if (!query) return 1;
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return 1;

  const label = item.label.toLowerCase();
  const desc = item.desc.toLowerCase();
  
  let score = 0;

  // 1. Exact matches (Highest priority)
  if (label === cleanQuery) return 1000;
  if (desc === cleanQuery) return 500;

  // 2. Starts-with / prefix matches on word boundaries
  if (label.startsWith(cleanQuery)) {
    score += 800;
  } else if (label.includes(" " + cleanQuery)) {
    score += 700;
  }
  
  if (desc.startsWith(cleanQuery)) {
    score += 400;
  } else if (desc.includes(" " + cleanQuery)) {
    score += 300;
  }

  // 3. Contiguous substring matches
  if (label.includes(cleanQuery)) {
    score += 500;
  }
  if (desc.includes(cleanQuery)) {
    score += 200;
  }

  // 4. Keyword Tag Matches
  if (item.tags) {
    for (const tag of item.tags) {
      const cleanTag = tag.toLowerCase();
      if (cleanTag === cleanQuery) {
        score += 600;
      } else if (cleanTag.startsWith(cleanQuery)) {
        score += 450;
      } else if (cleanTag.includes(cleanQuery)) {
        score += 300;
      }
    }
  }

  // 5. Word-by-word matches (Handling multiple keywords in any order)
  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    let matchedAllWords = true;
    let wordScore = 0;
    for (const word of queryWords) {
      let wordMatched = false;
      if (label.includes(word)) {
        wordScore += 100;
        wordMatched = true;
        if (label.startsWith(word) || label.includes(" " + word)) {
          wordScore += 50;
        }
      }
      if (desc.includes(word)) {
        wordScore += 50;
        wordMatched = true;
        if (desc.startsWith(word) || desc.includes(" " + word)) {
          wordScore += 25;
        }
      }
      if (item.tags) {
        for (const tag of item.tags) {
          if (tag.toLowerCase().includes(word)) {
            wordScore += 40;
            wordMatched = true;
          }
        }
      }
      if (!wordMatched) {
        matchedAllWords = false;
      }
    }
    if (matchedAllWords) {
      score += wordScore * 2;
    }
  }

  // 6. Typo Tolerance via Levenshtein Distance for short typos (only for queries length >= 4)
  if (score === 0 && cleanQuery.length >= 4) {
    const labelWords = label.split(/[\s,.-]+/).filter(Boolean);
    let minDistance = 999;
    for (const lw of labelWords) {
      const dist = levenshteinDistance(cleanQuery, lw);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }
    if (minDistance <= 1) {
      score += (100 - minDistance * 40);
    }
  }

  return score;
};

// Premium visual highlight renderer for matching text segments
const highlightText = (text, query) => {
  if (!query) return <span>{text}</span>;
  
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return <span>{text}</span>;

  // 1. Try contiguous match first (cleanest)
  const index = text.toLowerCase().indexOf(cleanQuery);
  if (index !== -1) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + cleanQuery.length);
    const after = text.substring(index + cleanQuery.length);
    return (
      <span>
        {before}
        <span className="text-cyan-400 bg-cyan-500/15 px-1 py-0.5 rounded font-black border border-cyan-400/20">{match}</span>
        {after}
      </span>
    );
  }

  // 2. Try word-by-word matching
  const words = cleanQuery.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    // Sort words by length descending to match longer words first
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const escapedWords = sortedWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="text-cyan-400 bg-cyan-500/15 px-1 py-0.5 rounded font-black border border-cyan-400/20">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  return <span>{text}</span>;
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    } else {
      const interval = setInterval(() => {
        const sock = getSocket();
        if (sock) {
          setSocketConnected(sock.connected);
          const onConnect = () => setSocketConnected(true);
          const onDisconnect = () => setSocketConnected(false);
          sock.on('connect', onConnect);
          sock.on('disconnect', onDisconnect);
          clearInterval(interval);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Sync theme to document root
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    toast.success(`${theme === 'light' ? 'Dark Mode' : 'Light Mode'} activated! 🌓`);
  };

  // Command Palette states
  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [paletteTool, setPaletteTool] = useState(null); // null | 'sip' | 'sentiment' | 'bookmarks'
  
  // SIP calculator states inside palette
  const [sipAmount, setSipAmount] = useState('5000');
  const [sipRate, setSipRate] = useState('12');
  const [sipYears, setSipYears] = useState('10');
  const [sipResult, setSipResult] = useState(null);

  // Bookmarks database states inside palette
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmarkText, setNewBookmarkText] = useState('');

  const toggleSidebar = () => setIsOpen(!isOpen);

  const [activeCommandIdx, setActiveCommandIdx] = useState(0);

  // Reset selected command index on search change
  useEffect(() => {
    setActiveCommandIdx(0);
  }, [paletteSearch]);

  // Global listener for Cmd+K / Ctrl+K and Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
        setPaletteSearch('');
        setPaletteTool(null);
        setActiveCommandIdx(0);
      }
      if (e.key === 'Escape') {
        setShowPalette(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);



  // Load bookmarks on mount
  useEffect(() => {
    const saved = localStorage.getItem('finbuddy_bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Compute SIP inside palette
  const handleCalculateSip = () => {
    const p = parseFloat(sipAmount);
    const r = parseFloat(sipRate) / 12 / 100;
    const n = parseFloat(sipYears) * 12;
    if (isNaN(p) || isNaN(r) || isNaN(n) || r === 0) {
      toast.error("Please enter valid SIP parameters");
      return;
    }
    const total = r > 0 ? p * (((Math.pow(1 + r, n) - 1) / r) * (1 + r)) : p * n;
    const invested = p * n;
    const gain = total - invested;
    setSipResult({
      invested: Math.round(invested),
      gain: Math.round(gain),
      total: Math.round(total)
    });
  };

  // Auto-calculate SIP on amount/tenure slider changes
  useEffect(() => {
    if (paletteTool === 'sip') {
      handleCalculateSip();
    }
  }, [sipAmount, sipRate, sipYears, paletteTool]);

  // Bookmarks handlers
  const handleAddBookmark = () => {
    if (!newBookmarkText.trim()) return;
    const updated = [
      ...bookmarks,
      { id: Date.now(), text: newBookmarkText.trim(), date: new Date().toLocaleDateString() }
    ];
    setBookmarks(updated);
    localStorage.setItem('finbuddy_bookmarks', JSON.stringify(updated));
    setNewBookmarkText('');
    toast.success('Bookmark added to palette notes! 📝');
  };

  const handleDeleteBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('finbuddy_bookmarks', JSON.stringify(updated));
    toast.success('Bookmark deleted');
  };

  const paletteCommands = [
    { label: 'Go to Dashboard', desc: 'View financial overview & portfolio', path: '/dashboard', type: 'page', icon: '🏠', tags: ['home', 'overview', 'portfolio', 'index'] },
    { label: 'Go to Smart Decision Lab', desc: '16+ AI Decision & Health tools overview', path: '/smart', type: 'page', icon: '🧠', tags: ['tools', 'decision', 'calculator', 'engines', 'lab'] },

    { label: 'Go to Wealth Map Hub', desc: 'Consolidated asset registry & goals overview', path: '/wealth', type: 'page', icon: '📊', tags: ['map', 'net worth', 'portfolio', 'assets', 'investment', 'locker', 'gold', 'rebalance'] },

    { label: 'Go to Trade Arena', desc: 'Practice virtual stock paper trading overview', path: '/trade', type: 'page', icon: '📈', tags: ['trade', 'stock', 'paper', 'market', 'screener', 'nifty', 'journal'] },
    { label: 'Go to Social Circles & Splits', desc: 'Create group splits & start battles', path: '/split', type: 'page', icon: '💸', tags: ['split', 'group', 'friend', 'bill', 'vault', 'battle'] },
    { label: 'Go to Academy & LearnHub', desc: 'Financial quizzes & courses', path: '/learn', type: 'page', icon: '🎓', tags: ['academy', 'quiz', 'course', 'learn', 'education', 'tanglish'] },
    { label: 'Go to Playground Winding Path', desc: 'Gamified interactive pathway lessons', path: '/playground', type: 'page', icon: '🎮', tags: ['playground', 'game', 'lessons', 'path', 'streak', 'levels'] },
    { label: 'Go to AI Mentor Advisor', desc: 'Ask financial queries to chatbot', path: '/mentor', type: 'page', icon: '🤖', tags: ['chat', 'bot', 'advisor', 'guru', 'help', 'recommend'] },
    { label: 'Go to Mutual Fund Analyzer', desc: 'Analyze fund metrics & compare', path: '/mf', type: 'page', icon: '🧠', tags: ['mutual fund', 'analyzer', 'compare', 'metrics', 'sip', 'nav'] },
    { label: 'Go to Account Profile Settings', desc: 'Manage streaks & badge showcases', path: '/profile', type: 'page', icon: '👤', tags: ['profile', 'settings', 'user', 'streak', 'badges', 'account'] },
    { label: 'Go to Interactive Feature Guide', desc: 'Read guides and walkthroughs for all 24 pages & 10 smart engines', path: '/guide', type: 'page', icon: '📖', tags: ['guide', 'help', 'walkthrough', 'documentation', 'info'] },

    // Smart Features - Pillar 1: Shield
    { label: 'UPI Fraud Shield Scanner', desc: 'AI forensic scam messaging analyzer', path: '/smart?category=shield&tool=fraud', type: 'tool', icon: '🛡️', tags: ['fraud', 'scam', 'spam', 'sms', 'message', 'shield', 'security'] },
    { label: 'AI Anomaly Shield / Tracker', desc: 'Outlier transaction spike alerts', path: '/smart?category=shield&tool=anomaly', type: 'tool', icon: '🚨', tags: ['anomaly', 'outlier', 'spend', 'tracker', 'alerts', 'shield'] },
    { label: 'News Panic headline Scrubber', desc: 'Noise-canceling clickbait news filter', path: '/smart?category=shield&tool=news', type: 'tool', icon: '📰', tags: ['news', 'panic', 'scrub', 'clickbait', 'filter', 'sentiment'] },
    { label: 'AI Bill Negotiator helper', desc: 'AI call & email negotiation scripts helper', path: '/smart?category=shield&tool=bill', type: 'tool', icon: '🧾', tags: ['bill', 'negotiator', 'scripts', 'email', 'save money'] },
    { label: 'Macro Shock Lab stress tester', desc: 'Fed & RBI interest rate stress test', path: '/smart?category=shield&tool=macro', type: 'tool', icon: '🌐', tags: ['rbi', 'fed', 'interest', 'inflation', 'stress test', 'macro', 'economy'] },

    // Smart Features - Pillar 2: Planning & Projections
    { label: 'Goal Monte Carlo Simulator / Lumpsum', desc: 'Drift & shock portfolio compounder', path: '/smart?category=planning&tool=goals', type: 'tool', icon: '🎯', tags: ['goal', 'monte carlo', 'lumpsum', 'simulator', 'compound', 'planning'] },
    { label: 'FIRE Autopilot retirement planner', desc: 'Stochastic early retirement runway', path: '/smart?category=planning&tool=fire', type: 'tool', icon: '🔥', tags: ['fire', 'retirement', 'stochastic', 'pension', 'autopilot', 'planning'] },
    { label: 'SWP Tax Optimizer calculator', desc: 'Periodic withdrawals tax waterfall tool', path: '/smart?category=planning&tool=swp', type: 'tool', icon: '📈', tags: ['swp', 'tax', 'withdraw', 'calculator', 'waterfall', 'planning'] },
    { label: 'Debt Payoff Optimizer calculator', desc: 'Snowball vs. Avalanche optimization', path: '/smart?category=planning&tool=debt', type: 'tool', icon: '💸', tags: ['debt', 'payoff', 'snowball', 'avalanche', 'optimizer', 'calculator', 'planning'] },
    { label: 'EMI Trap Auditor check', desc: 'Exposes hidden APR lending traps', path: '/smart?category=planning&tool=emi', type: 'tool', icon: '💸', tags: ['emi', 'loan', 'apr', 'trap', 'hidden cost', 'planning'] },

    // Smart Features - Pillar 3: Habits & Diagnostics
    { label: 'Spending DNA quiz diagnostic', desc: 'Quiz-based behavioral diagnostics', path: '/smart?category=habits&tool=dna', type: 'tool', icon: '🧬', tags: ['spending', 'dna', 'quiz', 'diagnostic', 'behavior', 'personality'] },
    { label: 'AI Financial Autopsy diagnostic', desc: 'Opportunity cost bias analyzer', path: '/smart?category=habits&tool=autopsy', type: 'tool', icon: '🧠', tags: ['autopsy', 'bias', 'leak', 'opportunity cost', 'diagnostic'] },
    { label: 'Impulse Therapy buy checker chatbot', desc: 'CBT buying therapist chatbot helper', path: '/smart?category=habits&tool=impulse', type: 'tool', icon: '🧠', tags: ['impulse', 'buy', 'therapy', 'chat', 'cbt', 'shopping'] },
    { label: 'City Radar Cost living index', desc: 'Living indices & relocation rates', path: '/smart?category=habits&tool=radar', type: 'tool', icon: '📡', tags: ['city', 'radar', 'cost of living', 'relocate', 'index', 'rent'] },
    { label: 'Stealth Fuel Router / Better Route planner', desc: 'Toll, patrol, and fuel cost routing', path: '/smart?category=habits&tool=route', type: 'tool', icon: '🗺️', tags: ['map', 'route', 'fuel', 'toll', 'gps', 'travel', 'better route planner'] },
    { label: 'Purchase Oracle deal timer', desc: 'Pricing seasonality deal timing predictions', path: '/smart?category=habits&tool=oracle', type: 'tool', icon: '⏰', tags: ['oracle', 'deal', 'shopping', 'price', 'seasonality', 'timer'] },

    // Wealth Map Subsections
    { label: 'Wealth Vault / Asset Registry', desc: 'Consolidated asset registry & biometric locker', path: '/wealth?tab=consolidated', type: 'tool', icon: '🔐', tags: ['vault', 'assets', 'registry', 'locker', 'biometric', 'wealth'] },
    { label: 'AI Portfolio Rebalancer', desc: 'Optimal asset class ratio adjustments', path: '/wealth?tab=rebalancer', type: 'tool', icon: '⚖️', tags: ['rebalancer', 'portfolio', 'asset class', 'ratio', 'wealth'] },
    { label: 'EMI Tracker liabilities tracker', desc: 'Liabilities, loans and debt tracking', path: '/wealth?tab=emi', type: 'tool', icon: '📉', tags: ['emi', 'loans', 'debt', 'tracker', 'wealth'] },

    // Trade Arena Subsections
    { label: 'Live Stock Market Feed', desc: 'Realtime quotes, index trackers & heatmaps', path: '/trade?tab=market', type: 'tool', icon: '📈', tags: ['market', 'feed', 'live', 'quotes', 'heatmaps', 'trade'] },
    { label: 'Trading Watchlist & Screener', desc: 'Save and filter active target stocks', path: '/trade?tab=watchlist', type: 'tool', icon: '👁️', tags: ['watchlist', 'screener', 'filter', 'stocks', 'trade'] },
    { label: 'Trading Journal & Note Keeper', desc: 'Practice logging trades & psych stats', path: '/trade?tab=journal', type: 'tool', icon: '📓', tags: ['journal', 'note', 'stats', 'psychology', 'trade'] },
    { label: 'What-If Time Machine Game', desc: 'Travel back in time to practice trading crises', path: '/trade/backtest', type: 'page', icon: '⏳', tags: ['whatif', 'time machine', 'crisis', 'history', 'game', 'trade'] },

    // Tools & Bookmarks
    { label: 'Inline SIP Calculator', desc: 'Compute SIP returns & view breakdown chart', tool: 'sip', type: 'tool', icon: '🧮', tags: ['sip', 'calculator', 'invest', 'lumpsum', 'wealth'] },
    { label: 'Personal Bookmarks & Notes', desc: 'Manage quick financial reminders list', tool: 'bookmarks', type: 'tool', icon: '📝', tags: ['note', 'bookmark', 'todo', 'reminder'] },
    { label: 'Live Market Sentiment Indicator', desc: 'Show Fear & Greed index gauge', tool: 'sentiment', type: 'tool', icon: '📈', tags: ['fear', 'greed', 'sentiment', 'vix', 'nifty', 'market'] },
    { label: 'Split a Bill Instantly', desc: 'Settle and share group bills', path: '/split', type: 'action', icon: '💸', tags: ['split', 'bill', 'share', 'group', 'friend'] }
  ];

  // Reset active item index whenever search query changes to prevent index out of bounds
  useEffect(() => {
    setActiveCommandIdx(0);
  }, [paletteSearch]);

  // Filter and rank command list using advanced fuzzy scoring
  const filteredCommands = React.useMemo(() => {
    if (!paletteSearch.trim()) {
      return paletteCommands;
    }
    return paletteCommands
      .map(cmd => ({ cmd, score: fuzzyScore(cmd, paletteSearch) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.cmd);
  }, [paletteSearch]);

  // Handle keyboard navigation for open palette
  useEffect(() => {
    if (!showPalette) return;

    const handleKeyDown = (e) => {
      if (paletteTool !== null) {
        if (e.key === 'Escape') {
          setPaletteTool(null);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCommandIdx((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCommandIdx((prev) => (filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands.length > 0 && filteredCommands[activeCommandIdx]) {
          const cmd = filteredCommands[activeCommandIdx];
          if (cmd.tool) {
            setPaletteTool(cmd.tool);
          } else {
            setShowPalette(false);
            navigate(cmd.path);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPalette, paletteTool, filteredCommands, activeCommandIdx, navigate]);

  // Common Nav Links component
  const NavLinks = ({ onClick }) => (
    <div className="space-y-1.5 px-3">
      {navItems.map(item => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        const isLocked = false;
        
        return (
          <Link 
            key={item.path} 
            to={isLocked ? '#' : item.path}
            onClick={(e) => {
              if (isLocked) {
                e.preventDefault();
                toast.error(`🔒 ${item.label} is an Elite Feature! Upgrade to unlock.`, {
                  id: 'nav-locked-toast',
                  duration: 4000,
                  icon: '👑'
                });
                navigate('/profile?tab=billing');
              }
              if (onClick) onClick();
            }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group relative border ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_4px_12px_rgba(6,182,212,0.08)]'
                : 'text-slate-400 border-transparent hover:bg-white/3 hover:text-slate-200'
            }`}
          >
            <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold text-sm block leading-tight">{item.label}</span>
              <span className="text-[10px] text-slate-500 block font-bold group-hover:text-slate-400 mt-0.5">{item.desc}</span>
            </div>
            {isLocked && (
              <span className="text-[9px] font-black text-violet-400 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-widest">
                PRO 🔒
              </span>
            )}
            {isActive && !isLocked && (
              <div className="w-1.5 h-6 bg-cyan-400 rounded-full absolute -right-0.5 top-1/2 -translate-y-1/2" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* SLEEK CONNECTIVITY BANNER */}
      {(!isOnline || !socketConnected) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-full max-w-sm px-4">
          <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_8px_32px_rgba(239,68,68,0.15)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wider">
                {!isOnline ? 'Connection Offline' : 'Live Feed Disconnected'}
              </p>
              <p className="text-[10px] font-bold text-red-300/80 mt-0.5">
                {!isOnline 
                  ? 'Please check your internet connection' 
                  : 'Reconnecting to real-time server...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. MOBILE TOP HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-b border-white/5 flex items-center justify-between px-4 z-40 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={toggleSidebar} 
            className="p-2 -ml-2 text-slate-300 hover:text-white focus:outline-none cursor-pointer"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-black gradient-text">FinBuddy</span>
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => { setShowPalette(true); setPaletteSearch(''); setPaletteTool(null); }}
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 cursor-pointer"
            title="Search Commands"
          >
            <Search size={16} />
          </button>
          <NotificationBell />
          <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center text-white font-bold overflow-hidden text-sm">
            {user?.avatar 
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> 
              : user?.name?.[0]?.toUpperCase()}
          </Link>
        </div>
      </header>

      {/* 2. MOBILE OVERLAY DRAWER SIDEBAR */}
      <div className={`fixed inset-0 z-48 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={toggleSidebar} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-[var(--bg-secondary)] border-r border-white/5 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-6 h-16 border-b border-white/5 flex items-center justify-between shrink-0">
            <Link to="/dashboard" onClick={toggleSidebar} className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-lg font-black gradient-text">FinBuddy</span>
            </Link>
            <button onClick={toggleSidebar} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
          </div>

          <div className="px-5 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-400 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                {user?.avatar 
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> 
                  : user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-sm text-white">{user?.name}</p>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${socketConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'}`} title={socketConnected ? 'Connected to live feed' : 'Disconnected from live feed'} />
                </div>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5">FinScore: {user?.finScore || 500}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-black/30 rounded-2xl border border-white/5 text-[10px] font-bold">
              <div>
                <span className="text-slate-500 uppercase tracking-wider block">Wallet Balance</span>
                <span className="text-white text-xs font-black block mt-0.5">₹{(user?.virtualWallet ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right border-l border-white/5 pl-2">
                <span className="text-slate-500 uppercase tracking-wider block">Coins Balance</span>
                <span className="text-yellow-400 text-xs font-black block mt-0.5">🪙 {user?.virtualCoins || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
            <NavLinks onClick={toggleSidebar} />
          </div>

          <div className="p-3 border-t border-white/5 space-y-1 bg-black/10 shrink-0 text-xs font-bold text-slate-400">
            <Link to="/profile" onClick={toggleSidebar} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 hover:text-slate-200 transition">
              <Settings size={16} /><span>Account Settings</span>
            </Link>
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition cursor-pointer text-left">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <button onClick={() => { toggleSidebar(); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer">
              <LogOut size={16} /><span>Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      {/* 3. DESKTOP SIDEBAR */}
      <aside className="fixed left-0 top-0 bottom-0 h-screen w-64 bg-[var(--bg-secondary)] border-r border-white/5 flex flex-col z-40 hidden lg:flex">
        <div className="px-6 py-5 border-b border-white/5 shrink-0 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="text-2xl">💰</span>
            <span className="text-xl font-black gradient-text">FinBuddy</span>
          </Link>
        </div>

        <div className="px-5 py-5 border-b border-white/5 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-white/3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
              {user?.avatar 
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> 
                : user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-sm truncate text-white group-hover:text-cyan-300 transition-colors">{user?.name}</p>
                <span className={`w-2 h-2 rounded-full shrink-0 ${socketConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'}`} title={socketConnected ? 'Connected to live feed' : 'Disconnected from live feed'} />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                FinScore: <span className="text-cyan-400 font-extrabold">{user?.finScore || 500}</span>
              </p>
            </div>
          </Link>

          <div className="mt-4 p-3 bg-black/30 rounded-2xl border border-white/5 text-[10px] font-bold">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-slate-500 uppercase tracking-wider">Wallet Balance</span>
              <span className="text-white text-xs font-black">₹{(user?.virtualWallet ?? 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-500 uppercase tracking-wider">Virtual Coins</span>
              <span className="text-yellow-400 text-xs font-black">🪙 {user?.virtualCoins || 0}</span>
            </div>
          </div>

          {/* Premium Search Trigger Pill */}
          <div className="mt-4">
            <button
              onClick={() => { setShowPalette(true); setPaletteSearch(''); setPaletteTool(null); }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/10 rounded-2xl text-[11px] font-bold text-slate-400 hover:text-slate-200 transition duration-200 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-slate-400" />
                <span>Search tools & pages...</span>
              </div>
              <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5 font-mono text-slate-500">{shortcutText}</span>
            </button>
          </div>
        </div>

        <nav className="flex-1 py-5 overflow-y-auto no-scrollbar">
          <NavLinks />
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1 bg-black/10 shrink-0 text-xs font-bold text-slate-400">
          {user?.currentStreak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-orange-400 font-black">
              🔥 {user.currentStreak} day streak
            </div>
          )}
          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/3 hover:text-slate-200 transition">
            <Settings size={16} /><span>Account Settings</span>
          </Link>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-white/3 hover:text-slate-200 transition cursor-pointer text-left">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer">
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-white/5 flex items-center justify-around z-45 lg:hidden px-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
        {[
          { path: '/dashboard', icon: '🏠', label: 'Home' },
          { path: '/smart', icon: '🧠', label: 'Smart' },
          { path: '/wealth', icon: '📊', label: 'Wealth' },
          { path: '/trade', icon: '📈', label: 'Trade' },
        ].map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex flex-col items-center justify-center flex-1 h-full select-none relative transition-all duration-150 ${
                isActive ? 'text-cyan-400 font-black scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] mt-0.5 tracking-wider font-extrabold">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22D3EE]" />
              )}
            </Link>
          );
        })}
        <button 
          onClick={toggleSidebar} 
          className="flex flex-col items-center justify-center flex-1 h-full text-slate-500 hover:text-slate-300 select-none cursor-pointer"
        >
          <span className="text-xl">☰</span>
          <span className="text-[10px] mt-0.5 tracking-wider font-extrabold">More</span>
        </button>
      </div>

      {/* 5. GLOBAL COMMAND PALETTE MODAL OVERLAY */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4">
          <div onClick={() => setShowPalette(false)} className="absolute inset-0 cursor-default" />

          <div className="bg-[var(--bg-secondary)] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.25)] flex flex-col max-h-[70vh] z-50 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header search bar */}
            {paletteTool === null ? (
              <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                <Search className="text-slate-400 shrink-0" size={18} />
                <input 
                  type="text"
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  placeholder="Type a page, tool command, or action..."
                  className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm font-medium text-white placeholder-slate-500 py-1"
                  autoFocus
                />
                <button 
                  onClick={() => setShowPalette(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold px-2 py-1 border border-white/5 rounded-lg bg-white/5 cursor-pointer"
                >
                  ESC
                </button>
              </div>
            ) : (
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {paletteTool === 'sip' ? '🧮' : paletteTool === 'sentiment' ? '📈' : '📝'}
                  </span>
                  <span className="text-sm font-black text-white">
                    {paletteTool === 'sip' ? 'Inline SIP Projections' : paletteTool === 'sentiment' ? 'Market Sentiment Gauge' : 'Palette Reminder Notes'}
                  </span>
                </div>
                <button 
                  onClick={() => setPaletteTool(null)}
                  className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
                >
                  ← Back to Search
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-3 min-h-[180px]">
              
              {/* Tool 1: SIP Calculator with Recharts Pie Chart & Sliders */}
              {paletteTool === 'sip' && (
                <div className="p-1 space-y-4 text-xs">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-slate-400 font-extrabold uppercase mb-1 font-sans">
                        <span>Monthly Investment</span>
                        <span className="text-cyan-400 font-sans font-bold">₹{parseFloat(sipAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <input 
                        type="range" 
                        min="500" 
                        max="50000" 
                        step="500"
                        value={sipAmount} 
                        onChange={(e) => setSipAmount(e.target.value)}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 font-extrabold uppercase block mb-1">Expected Return (%)</span>
                        <input 
                          type="number" 
                          value={sipRate} 
                          onChange={(e) => setSipRate(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500/30"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-slate-500 font-extrabold uppercase mb-1">
                          <span>Tenure</span>
                          <span className="text-white font-sans font-bold">{sipYears} Yrs</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="35" 
                          step="1"
                          value={sipYears} 
                          onChange={(e) => setSipYears(e.target.value)}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  {sipResult && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/30 border border-white/5 p-4 rounded-2xl">
                      {/* Left: Recharts Pie Chart breakdown */}
                      <div className="w-24 h-24 shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Invested', value: sipResult.invested },
                                { name: 'Gains', value: sipResult.gain }
                              ]}
                              innerRadius={28}
                              outerRadius={40}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              <Cell fill="#6D28D9" /> {/* Violet for invested */}
                              <Cell fill="#22D3EE" /> {/* Cyan for gains */}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-black">Yield</span>
                          <span className="text-[10px] font-black text-green-400 font-sans">+{Math.round((sipResult.gain / sipResult.invested) * 100)}%</span>
                        </div>
                      </div>

                      {/* Right: Numbers breakdown */}
                      <div className="flex-1 space-y-2 font-sans w-full">
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-[10px] text-slate-500 font-sans">Invested Amount:</span>
                          <span className="text-white font-bold">₹{sipResult.invested.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1">
                          <span className="text-[10px] text-slate-500 font-sans">Estimated Gains:</span>
                          <span className="text-cyan-400 font-bold">₹{sipResult.gain.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-black">
                          <span className="text-[10px] text-slate-400 font-sans">Total Wealth:</span>
                          <span className="text-green-400">₹{sipResult.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tool 2: Sentiment Gauge */}
              {paletteTool === 'sentiment' && (
                <div className="p-4 text-center">
                  <svg viewBox="0 0 200 120" className="w-full max-h-36 mx-auto select-none">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#paletteSentimentGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * 64) / 100} />
                    <defs>
                      <linearGradient id="paletteSentimentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F87171" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="5" fill="#FFF" />
                    <line x1="100" y1="100" x2={100 + 72 * Math.cos((Math.PI * (180 - (64 / 100 * 180))) / 180)} y2={100 - 72 * Math.sin((Math.PI * (180 - (64 / 100 * 180))) / 180)} stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" />
                    <text x="100" y="85" textAnchor="middle" className="fill-white text-base font-black">64</text>
                    <text x="100" y="98" textAnchor="middle" className="fill-emerald-400 text-[9px] font-black uppercase tracking-wider">Greed</text>
                  </svg>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Nifty VIX is at 13.40 (Low Fear). Stable bullish trends predicted.
                  </p>
                </div>
              )}

              {/* Tool 3: Personal Bookmarks Database */}
              {paletteTool === 'bookmarks' && (
                <div className="p-1 space-y-4 text-xs">
                  {/* Add Bookmark input */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newBookmarkText}
                      onChange={(e) => setNewBookmarkText(e.target.value)}
                      placeholder="Add a quick financial reminder or note..."
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30 font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                    />
                    <button 
                      onClick={handleAddBookmark}
                      className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-xl cursor-pointer transition shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Bookmarks List */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {bookmarks.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p className="mb-1">No reminders saved yet</p>
                        <p className="text-[10px] text-slate-600">Type a note above and click + to save</p>
                      </div>
                    ) : (
                      bookmarks.map((b) => (
                        <div key={b.id} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/5 rounded-xl gap-2 group">
                          <div>
                            <p className="text-white font-bold leading-normal">{b.text}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-1">Saved: {b.date}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteBookmark(b.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Delete reminder"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Standard Commands list */}
              {paletteTool === null && (
                <div className="space-y-1">
                  {filteredCommands.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-8">No matching commands found.</p>
                  ) : (
                    filteredCommands.map((cmd, idx) => {
                      const isSelected = idx === activeCommandIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (cmd.tool) {
                              setPaletteTool(cmd.tool);
                            } else {
                              setShowPalette(false);
                              navigate(cmd.path);
                            }
                          }}
                          onMouseEnter={() => setActiveCommandIdx(idx)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition text-left cursor-pointer group ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                              : 'bg-transparent border-transparent hover:bg-white/3 hover:border-white/5 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg shrink-0">{cmd.icon}</span>
                            <div>
                              <p className={`text-xs font-black transition-colors ${isSelected ? 'text-cyan-400' : 'text-white group-hover:text-cyan-400'}`}>
                                {highlightText(cmd.label, paletteSearch)}
                              </p>
                              <p className={`text-[10px] font-bold mt-0.5 transition-colors ${isSelected ? 'text-cyan-200/60' : 'text-slate-500'}`}>
                                {highlightText(cmd.desc, paletteSearch)}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md border font-mono transition-colors ${
                            isSelected 
                              ? 'bg-cyan-400/20 border-cyan-400/25 text-cyan-300' 
                              : 'bg-white/5 border-white/5 text-slate-400'
                          }`}>
                            {cmd.type}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer tips */}
            <div className="p-3 bg-black/20 border-t border-white/5 text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">
              ⌨️ ESC to close • ↑↓ Navigate • Enter to Select
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;