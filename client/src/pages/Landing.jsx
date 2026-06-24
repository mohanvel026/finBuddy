// client/src/pages/Landing.jsx — Redesigned Premium FinBuddy Landing Page styled after Stonkzz
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, Sun, Moon, Zap, Award, TrendingUp, Coins, BarChart2, 
  ShieldCheck, AlertTriangle, HelpCircle, Users, Brain, ChevronDown, 
  Check, Activity, FileText, RefreshCw, Trophy, Flame, Play, Clock, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// Custom Hooks for Industry-Level Animations
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);
};

const useCardTilt = () => {
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    
    // Rotate max 6 degrees on x/y
    const rotateX = ((centerY - y) / centerY) * 5;
    const rotateY = ((x - centerX) / centerX) * 5;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
    card.style.transition = 'none'; // Instant response on mouse move
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'; // Smooth return
  };

  return { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
};

// Dynamic Metric Count-up Component
const CountUpValue = ({ end, suffix = "" }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    // Extract numbers from strings like "₹1,00,000" or "50+"
    const endVal = typeof end === 'number' ? end : parseInt(end.replace(/[^0-9]/g, "")) || 0;
    if (endVal === 0) {
      setVal(end);
      return;
    }
    const duration = 1200;
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = Math.ceil(endVal / steps);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= endVal) {
        clearInterval(timer);
        setVal(endVal);
      } else {
        setVal(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [end]);

  const formatVal = () => {
    if (typeof val === 'string') return val;
    let prefix = "";
    let formatted = val.toLocaleString('en-IN');
    if (typeof end === 'string') {
      if (end.startsWith("₹")) prefix = "₹";
      const isPercent = end.endsWith("%");
      const isPlus = end.endsWith("+");
      return `${prefix}${formatted}${isPercent ? "%" : ""}${isPlus ? "+" : ""}${suffix}`;
    }
    return `${formatted}${suffix}`;
  };

  return <span>{formatVal()}</span>;
};

export const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [faqOpenIdx, setFaqOpenIdx] = useState(null);

  // Active preview state managers
  const [sentimentScore, setSentimentScore] = useState(55);
  const [isSplitSmartOptimized, setIsSplitSmartOptimized] = useState(true);
  const [activeDemoAsset, setActiveDemoAsset] = useState('nifty');
  const [refinanceEMIApplied, setRefinanceEMIApplied] = useState(false);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);

  // Simulated live wallet & leaderboard standings
  const [demoWallet, setDemoWallet] = useState(100000);
  const [tradeToast, setTradeToast] = useState(null);
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Rohan Mehta', balance: 104200, isYou: false, avatar: 'RM', color: 'text-cyan-400 bg-cyan-500/20' },
    { name: 'You (Simulated)', balance: 100000, isYou: true, avatar: 'YS', color: 'text-amber-400 bg-amber-500/20' },
    { name: 'Kirti Deshmukh', balance: 98150, isYou: false, avatar: 'KD', color: 'text-rose-400 bg-rose-500/20' },
    { name: 'Amit Sharma', balance: 95400, isYou: false, avatar: 'AS', color: 'text-indigo-400 bg-indigo-500/20' },
  ]);
  const [activeBottomTab, setActiveBottomTab] = useState('leaderboard'); // 'leaderboard' or 'news'

  // Initialize hooks
  useScrollReveal();
  const cardTilt = useCardTilt();

  const executeDemoTrade = (type) => {
    const isWin = type === 'call' ? Math.random() > 0.35 : Math.random() > 0.40;
    const percentChange = Math.random() * 0.04 + 0.015;
    const amount = Math.round(demoWallet * percentChange * (isWin ? 1 : -0.7));
    const nextWallet = Math.max(1000, demoWallet + amount);
    setDemoWallet(nextWallet);
    
    const toastId = Date.now();
    setTradeToast({
      amount: amount,
      profit: amount > 0,
      id: toastId
    });

    // Automatically hide toast after 2.5 seconds
    setTimeout(() => {
      setTradeToast(prev => prev && prev.id === toastId ? null : prev);
    }, 2500);

    // Update leaderboard balance for 'You'
    setLeaderboard(prev => {
      const next = prev.map(item => {
        if (item.isYou) {
          return { ...item, balance: nextWallet };
        }
        return item;
      });
      return next.sort((a, b) => b.balance - a.balance);
    });
  };

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
  };

  // Simulated live prices for index strip and key markets
  const [tickerPrices, setTickerPrices] = useState({
    nifty: 23450.50,
    sensex: 76950.20,
    reliance: 2450.75,
    tcs: 3820.40,
    btc: 67250.00,
    gold: 72400.00,
    banknifty: 48200.00,
  });

  const [tickerDirections, setTickerDirections] = useState({
    nifty: true,
    sensex: true,
    reliance: true,
    tcs: false,
    btc: true,
    gold: false,
    banknifty: true,
  });

  const [flashTriggers, setFlashTriggers] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerPrices(prev => {
        const next = { ...prev };
        const dirs = { ...tickerDirections };
        const triggers = { ...flashTriggers };
        Object.keys(next).forEach(key => {
          const change = (Math.random() - 0.49) * 0.08;
          const isUp = change >= 0;
          next[key] = Math.max(1, next[key] * (1 + change / 100));
          dirs[key] = isUp;
          triggers[key] = isUp ? 'up-' + Date.now() : 'down-' + Date.now();
        });
        setTickerDirections(dirs);
        setFlashTriggers(triggers);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [tickerDirections, flashTriggers]);

  const renderFlashClass = (key) => {
    const trigger = flashTriggers[key];
    if (!trigger) return '';
    return trigger.startsWith('up') ? 'animate-flash-green' : 'animate-flash-red';
  };

  const demoChartData = {
    nifty: [
      { day: 'Mon', price: 23200 },
      { day: 'Tue', price: 23280 },
      { day: 'Wed', price: 23150 },
      { day: 'Thu', price: 23310 },
      { day: 'Fri', price: 23400 },
      { day: 'Sat', price: 23380 },
      { day: 'Sun', price: Math.round(tickerPrices.nifty) }
    ],
    sensex: [
      { day: 'Mon', price: 76200 },
      { day: 'Tue', price: 76400 },
      { day: 'Wed', price: 76100 },
      { day: 'Thu', price: 76650 },
      { day: 'Fri', price: 76800 },
      { day: 'Sat', price: 76700 },
      { day: 'Sun', price: Math.round(tickerPrices.sensex) }
    ],
    gold: [
      { day: 'Mon', price: 71500 },
      { day: 'Tue', price: 71800 },
      { day: 'Wed', price: 72000 },
      { day: 'Thu', price: 71700 },
      { day: 'Fri', price: 72200 },
      { day: 'Sat', price: 72100 },
      { day: 'Sun', price: Math.round(tickerPrices.gold) }
    ],
    reliance: [
      { day: 'Mon', price: 2410 },
      { day: 'Tue', price: 2432 },
      { day: 'Wed', price: 2420 },
      { day: 'Thu', price: 2445 },
      { day: 'Fri', price: 2460 },
      { day: 'Sat', price: 2455 },
      { day: 'Sun', price: Math.round(tickerPrices.reliance) }
    ],
    tcs: [
      { day: 'Mon', price: 3850 },
      { day: 'Tue', price: 3830 },
      { day: 'Wed', price: 3810 },
      { day: 'Thu', price: 3845 },
      { day: 'Fri', price: 3835 },
      { day: 'Sat', price: 3815 },
      { day: 'Sun', price: Math.round(tickerPrices.tcs) }
    ],
    btc: [
      { day: 'Mon', price: 65800 },
      { day: 'Tue', price: 66100 },
      { day: 'Wed', price: 65400 },
      { day: 'Thu', price: 67100 },
      { day: 'Fri', price: 66900 },
      { day: 'Sat', price: 67300 },
      { day: 'Sun', price: Math.round(tickerPrices.btc) }
    ]
  };

  // News bulletin stories
  const NEWS_STORIES = [
    { title: "🚀 SplitSmart Goa Settlement", text: "Simplified 5 debt circular loops automatically with Rohan Mehta's cohort." },
    { title: "📈 TradeArena Live Option Test", text: "Mock options traders test 0DTE iron condor strategies using simulated feed." },
    { title: "🛡️ AI Wealth Auditor Alert", text: "AI Mentor flags a 11.5% home loan APR as a major interest trapping risk." },
    { title: "🔥 Prepayment Presets Applied", text: "Decimator presets simulated: saved ₹24.8L in lifetime interest." },
    { title: "🏆 Battle League #104 Open", text: "Free registration starts tomorrow. Virtual cash pool is set to ₹1,00,000." }
  ];

  useEffect(() => {
    const newsInterval = setInterval(() => {
      setCurrentNewsIdx(prev => (prev + 1) % NEWS_STORIES.length);
    }, 4500);
    return () => clearInterval(newsInterval);
  }, []);

  const getSentimentLabel = (score) => {
    if (score < 25) return "Strongly Bearish 🔴";
    if (score < 45) return "Bearish 🟠";
    if (score < 65) return "Neutral 🟡";
    if (score < 85) return "Bullish 🟢";
    return "Strongly Bullish 🚀";
  };

  const getSentimentColor = (score) => {
    if (score < 25) return "text-rose-500 from-rose-500/20 to-red-500/20";
    if (score < 45) return "text-amber-500 from-amber-500/20 to-orange-500/20";
    if (score < 65) return "text-amber-400 from-yellow-500/20 to-amber-500/20";
    if (score < 85) return "text-green-400 from-green-500/20 to-emerald-500/20";
    return "text-cyan-400 from-cyan-500/20 to-blue-500/20";
  };

  const FAQS = [
    {
      q: "What is FinBuddy and how does it help college students?",
      a: "FinBuddy is India's cleanest daily simulated wealth arena. It provides college students and retail traders with ₹1,00,000 in virtual cash to learn trading, graph algorithms to optimize group expense splitting, and AI tools to audit hidden EMI traps."
    },
    {
      q: "Is any real money required to trade in the TradeArena?",
      a: "No, TradeArena is 100% simulated. You receive ₹1,00,000 in virtual trading capital to backtest option strategies, trade stocks, and compete on friend leaderboards with zero financial risk."
    },
    {
      q: "How does the SplitSmart minimize debt transactions?",
      a: "SplitSmart utilizes graph simplification algorithms (similar to flow networks) to analyze balances in group trips. It matches debits against credits to settle multiple transactions in the minimum possible steps."
    },
    {
      q: "Are the AI Mentor budgets SEBI regulated?",
      a: "No, AI Mentor provides educational financial diagnostics. Projections, risk scoring, and tax insights are built on baseline calculations. Always seek registered financial planners for SEBI-approved investment advice."
    }
  ];

  const handleNavScroll = (id) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 overflow-x-hidden flex flex-col font-sans relative">
      
      {/* ── DRiFTING Ambient BACKGROUND ORBS ── */}
      <div className="absolute top-[15%] left-[10%] w-[380px] h-[380px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none animate-drift-orb" />
      <div className="absolute top-[45%] right-[5%] w-[450px] h-[450px] bg-blue-500/3 rounded-full blur-[130px] pointer-events-none animate-drift-orb" style={{ animationDelay: '-6s' }} />
      <div className="absolute top-[75%] left-[8%] w-[400px] h-[400px] bg-indigo-500/4 rounded-full blur-[120px] pointer-events-none animate-drift-orb" style={{ animationDelay: '-12s' }} />

      {/* 1. HORIZONTAL LIVE MARKET TICKER STRIP */}
      <div className="w-full bg-[#0a0f1d] border-b border-white/5 py-2.5 overflow-hidden z-50 text-[11px] font-mono font-bold select-none h-10 flex items-center shrink-0">
        <div className="animate-marquee-hoverable flex whitespace-nowrap gap-12">
          {[1, 2].map(loopIdx => (
            <div key={loopIdx} className="flex gap-12 items-center">
              <span className="flex items-center gap-1.5 border-r border-white/5 pr-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">Feed Active</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">NIFTY 50:</span>
                <span key={`nifty-${loopIdx}`} className={`text-white transition-colors duration-200 ${renderFlashClass('nifty')}`}>
                  ₹{tickerPrices.nifty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={tickerDirections.nifty ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                  {tickerDirections.nifty ? '▲' : '▼'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">BANK NIFTY:</span>
                <span key={`bank-${loopIdx}`} className={`text-white transition-colors duration-200 ${renderFlashClass('banknifty')}`}>
                  ₹{tickerPrices.banknifty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={tickerDirections.banknifty ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                  {tickerDirections.banknifty ? '▲' : '▼'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">SENSEX:</span>
                <span key={`sensex-${loopIdx}`} className={`text-white transition-colors duration-200 ${renderFlashClass('sensex')}`}>
                  ₹{tickerPrices.sensex.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={tickerDirections.sensex ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                  {tickerDirections.sensex ? '▲' : '▼'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">GOLD (10g):</span>
                <span key={`gold-${loopIdx}`} className={`text-white transition-colors duration-200 ${renderFlashClass('gold')}`}>
                  ₹{tickerPrices.gold.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={tickerDirections.gold ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                  {tickerDirections.gold ? '▲' : '▼'}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-extrabold">BTC/USD:</span>
                <span key={`btc-${loopIdx}`} className={`text-white transition-colors duration-200 ${renderFlashClass('btc')}`}>
                  ${tickerPrices.btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={tickerDirections.btc ? 'text-green-400 font-extrabold' : 'text-red-400 font-extrabold'}>
                  {tickerDirections.btc ? '▲' : '▼'}
                </span>
              </span>
              <span className="flex items-center gap-1.5 border-l border-white/5 pl-6 pr-2">
                <span className="text-cyan-400 font-extrabold uppercase text-[9px] tracking-widest animate-pulse">SplitSmart: O(V+E) active</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. STONKZZ STYLED HEADER NAVBAR */}
      <nav className="sticky top-0 z-45 w-full bg-[#070b15]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="text-2xl animate-float-medium">💰</span>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              FinBuddy <span className="text-cyan-400 font-bold text-[10px] uppercase border border-cyan-400/20 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.15)] bg-cyan-950/20">Arena</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-400">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition cursor-pointer font-extrabold">Home</button>
            <button onClick={() => handleNavScroll('#preview')} className="hover:text-white transition cursor-pointer font-extrabold">Live Preview</button>
            <button onClick={() => handleNavScroll('#how-it-works')} className="hover:text-white transition cursor-pointer font-extrabold">How It Works</button>
            <button onClick={() => handleNavScroll('#laboratories')} className="hover:text-white transition cursor-pointer font-extrabold">Sandbox Labs</button>
            <button onClick={() => handleNavScroll('#faq')} className="hover:text-white transition cursor-pointer font-extrabold">FAQ</button>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition duration-200 shadow-md flex items-center gap-1 cursor-pointer">
                  Dashboard <ArrowRight size={14} />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-400 hover:text-white font-bold text-xs">
                  Login
                </Link>
                <Link to="/register">
                  <button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-105 active:scale-95 cursor-pointer btn-shimmer-trigger">
                    Get Started Free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 3. HERO VALUE PROPOSITION (Above the fold) */}
      <header className="relative w-full max-w-6xl mx-auto px-6 py-16 md:py-28 text-center flex flex-col items-center overflow-hidden">
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-4 py-2 rounded-full tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-6 animate-hero-subtext bg-cyan-950/20">
          🚀 India's Cleanest Daily Simulated Wealth Arena
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.08] max-w-4xl text-center animate-hero-headline">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">Master Your Money</span>
          <br />
          <span>Together with Your Friends</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl text-center mb-12 leading-relaxed px-2 animate-hero-subtext font-medium">
          Split group expenses smarter with flow graph algorithms, practice stock & options trading with simulated capital, compete in local battles, and score compound interest risks with SEBI-safe AI audits.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md px-4 mb-20">
          <Link to="/register" className="w-full sm:w-auto animate-hero-button-left">
            <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs py-4 px-8 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 transition-all duration-300 btn-shimmer-trigger">
              Start Free — Get ₹1,00,000 💰
            </button>
          </Link>
          <button 
            onClick={() => handleNavScroll('#preview')} 
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 py-4 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 animate-hero-button-right font-extrabold"
          >
            How It Works
          </button>
        </div>

        {/* Hero Metrics Grid Card - Glassmorphism */}
        <div className="w-full max-w-4xl mt-4 animate-hero-subtext">
          <div {...cardTilt} className="glass-card rounded-3xl p-8 border border-white/5 bg-[#090d16]/40 backdrop-blur-xl shadow-2xl hover:border-white/10 transition-all duration-300 cursor-pointer">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">
                  <CountUpValue end="₹1,00,000" />
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Virtual Cash</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
                  O(V+E)
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Settling Algorithm</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-1">
                  24/7
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">AI EMI Trap Scan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-indigo-400 mb-1">
                  <CountUpValue end="100+" />
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Active Leagues</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 4. INTERACTIVE WIDGET PREVIEW SECTION (The Stonkzz Core Integration) */}
      <section id="preview" className="w-full max-w-6xl mx-auto px-6 py-12 border-t border-white/5 space-y-12 text-left">
        <div className="text-center space-y-3 reveal-on-scroll">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest">
            ⚡ Interactive Sandbox
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Live Preview Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-normal">
            Interact with our active fintech modules directly before signing up. See how we make math and markets simple.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT WIDGET COLUMN (Sentiment + SplitSmart) - span 5 */}
          <div className="lg:col-span-5 space-y-8 reveal-on-scroll">
            
            {/* Widget 1: Sentiment Index Gauge (Stonkzz Score Clone) */}
            <div {...cardTilt} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#090d16]/50 hover:border-white/10 transition-all duration-300 shadow-xl group cursor-pointer">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg animate-float-medium">🔥</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">FinBuddy Sentiment Index</span>
                </div>
                <span className="text-[9px] uppercase font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md">Live feed</span>
              </div>

              <div className="text-center space-y-4">
                {/* SVG Gauge Speedometer Dial */}
                <div className="relative w-48 h-28 mx-auto flex items-center justify-center select-none pt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <defs>
                      <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="35%" stopColor="#F59E0B" />
                        <stop offset="65%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    {/* Background Track Arc */}
                    <path 
                      d="M20,90 A80,80 0 0,1 180,90" 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth="10" 
                      strokeLinecap="round" 
                      opacity="0.3"
                    />
                    {/* Active Gradient Arc */}
                    <path 
                      d="M20,90 A80,80 0 0,1 180,90" 
                      fill="none" 
                      stroke="url(#gauge-grad)" 
                      strokeWidth="10" 
                      strokeLinecap="round" 
                    />
                    {/* Center Pivot */}
                    <circle cx="100" cy="90" r="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                    <circle cx="100" cy="90" r="3" fill="#22D3EE" />
                    
                    {/* Needle */}
                    <line 
                      x1="100" y1="90" 
                      x2="100" y2="22" 
                      stroke="#22D3EE" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                      style={{
                        transform: `rotate(${(sentimentScore / 100) * 180 - 90}deg)`,
                        transformOrigin: '100px 90px',
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                    />
                  </svg>
                </div>

                <div className="py-2">
                  <span className={`text-2xl font-black bg-gradient-to-r ${getSentimentColor(sentimentScore)} bg-clip-text text-transparent transition-all duration-500`}>
                    {sentimentScore}% {getSentimentLabel(sentimentScore)}
                  </span>
                </div>

                <div className="flex justify-between text-[8px] text-slate-500 font-extrabold uppercase tracking-wider max-w-[200px] mx-auto">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
                </div>

                {/* Interactive Slider Input */}
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-405 font-bold">Simulate Index Score:</span>
                  <input 
                    type="range" 
                    min="5" 
                    max="95" 
                    value={sentimentScore}
                    onChange={(e) => setSentimentScore(parseInt(e.target.value))}
                    className="w-32 accent-cyan-400 cursor-pointer h-1 rounded-full bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Widget 2: SplitSmart Ledger (FII/DII Clone) */}
            <div {...cardTilt} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#090d16]/50 hover:border-white/10 transition-all duration-300 shadow-xl group cursor-pointer">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌴</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">SplitSmart Goa Settlement</span>
                </div>
                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                  <button 
                    onClick={() => setIsSplitSmartOptimized(false)}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${!isSplitSmartOptimized ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    Raw
                  </button>
                  <button 
                    onClick={() => setIsSplitSmartOptimized(true)}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${isSplitSmartOptimized ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                  >
                    Optimized
                  </button>
                </div>
              </div>

              {/* Settle cards transaction loops */}
              <div className="space-y-4 font-mono text-xs">
                {/* SVG Visual Flow Network Graph */}
                <div className="w-full h-40 bg-slate-950/40 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center p-2 select-none">
                  <svg className="w-full h-full" viewBox="0 0 300 150">
                    <defs>
                      <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L6,3 Z" fill="#EF4444" />
                      </marker>
                      <marker id="arrow-emerald" markerWidth="8" markerHeight="8" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L6,3 Z" fill="#10B981" />
                      </marker>
                      <marker id="arrow-faded" markerWidth="8" markerHeight="8" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L6,3 Z" fill="#334155" />
                      </marker>
                    </defs>

                    {/* Connection Edges */}
                    <line 
                      x1="150" y1="25" 
                      x2="240" y2="105" 
                      stroke={isSplitSmartOptimized ? "#10B981" : "#EF4444"} 
                      strokeWidth="2" 
                      markerEnd={isSplitSmartOptimized ? "url(#arrow-emerald)" : "url(#arrow-red)"}
                      strokeDasharray={isSplitSmartOptimized ? "6, 4" : "none"}
                      className={`transition-all duration-500 ${isSplitSmartOptimized ? "animate-flow-dash" : ""}`}
                    />
                    
                    <line 
                      x1="240" y1="105" 
                      x2="60" y2="105" 
                      stroke={isSplitSmartOptimized ? "#334155" : "#EF4444"} 
                      strokeWidth="2" 
                      markerEnd={isSplitSmartOptimized ? "url(#arrow-faded)" : "url(#arrow-red)"}
                      className="transition-all duration-500"
                      opacity={isSplitSmartOptimized ? 0.15 : 1}
                    />
                    
                    <line 
                      x1="60" y1="105" 
                      x2="150" y2="25" 
                      stroke={isSplitSmartOptimized ? "#334155" : "#EF4444"} 
                      strokeWidth="2" 
                      markerEnd={isSplitSmartOptimized ? "url(#arrow-faded)" : "url(#arrow-red)"}
                      className="transition-all duration-500"
                      opacity={isSplitSmartOptimized ? 0.15 : 1}
                    />

                    {/* Flowing Coins / Pulses */}
                    <circle r="4.5" fill="#10B981" className="transition-all duration-300">
                      <animateMotion 
                        dur="2s" 
                        repeatCount="indefinite" 
                        path="M 150 25 L 240 105" 
                      />
                    </circle>

                    {!isSplitSmartOptimized && (
                      <>
                        <circle r="4.5" fill="#EF4444">
                          <animateMotion 
                            dur="2s" 
                            repeatCount="indefinite" 
                            path="M 240 105 L 60 105" 
                          />
                        </circle>
                        <circle r="4.5" fill="#EF4444">
                          <animateMotion 
                            dur="2s" 
                            repeatCount="indefinite" 
                            path="M 60 105 L 150 25" 
                          />
                        </circle>
                      </>
                    )}

                    {/* Edge Labels */}
                    <text x="210" y="55" fill={isSplitSmartOptimized ? "#34D399" : "#F87171"} fontSize="8" fontWeight="bold" textAnchor="middle" className="transition-all duration-500">
                      {isSplitSmartOptimized ? "pays ₹300" : "owes ₹500"}
                    </text>
                    
                    <text x="150" y="120" fill="#F87171" fontSize="8" fontWeight="bold" textAnchor="middle" className="transition-all duration-500" opacity={isSplitSmartOptimized ? 0.15 : 1}>
                      owes ₹300
                    </text>
                    
                    <text x="90" y="55" fill="#F87171" fontSize="8" fontWeight="bold" textAnchor="middle" className="transition-all duration-500" opacity={isSplitSmartOptimized ? 0.15 : 1}>
                      owes ₹200
                    </text>

                    {/* Node Circles & Initials */}
                    <g className="transition-all duration-500">
                      <circle cx="150" cy="25" r="14" fill="#0F172A" stroke="#22D3EE" strokeWidth="2" />
                      <text x="150" y="28" fill="#F8FAFC" fontSize="10" fontWeight="extrabold" textAnchor="middle">R</text>
                      <text x="150" y="48" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle">Rohan</text>
                    </g>
                    
                    <g className="transition-all duration-500">
                      <circle cx="240" cy="105" r="14" fill="#0F172A" stroke="#A78BFA" strokeWidth="2" />
                      <text x="240" y="108" fill="#F8FAFC" fontSize="10" fontWeight="extrabold" textAnchor="middle">K</text>
                      <text x="240" y="128" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle">Kirti</text>
                    </g>

                    <g className="transition-all duration-500" opacity={isSplitSmartOptimized ? 0.15 : 1}>
                      <circle cx="60" cy="105" r="14" fill="#0F172A" stroke="#F472B6" strokeWidth="2" />
                      <text x="60" y="108" fill="#F8FAFC" fontSize="10" fontWeight="extrabold" textAnchor="middle">A</text>
                      <text x="60" y="128" fill="#94A3B8" fontSize="8" fontWeight="bold" textAnchor="middle">Amit</text>
                    </g>
                  </svg>
                </div>

                {!isSplitSmartOptimized ? (
                  <div className="space-y-2.5 animate-fade-in">
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center text-red-300">
                      <span>Rohan owes Kirti</span>
                      <span className="font-extrabold text-sm">₹500</span>
                    </div>
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center text-red-300">
                      <span>Kirti owes Amit</span>
                      <span className="font-extrabold text-sm">₹300</span>
                    </div>
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center text-red-300">
                      <span>Amit owes Rohan</span>
                      <span className="font-extrabold text-sm">₹200</span>
                    </div>
                    <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider pt-2">
                      ⚠️ 3 separate cash transfers required.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 animate-fade-in">
                    <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl flex justify-between items-center text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.08)]">
                      <span>Rohan pays Kirti</span>
                      <span className="font-extrabold text-sm">₹300</span>
                    </div>
                    <div className="p-3.5 bg-white/5 border border-white/5 opacity-45 rounded-xl flex justify-between items-center text-slate-400 line-through">
                      <span>Rohan pays Amit</span>
                      <span className="font-extrabold text-sm">₹0</span>
                    </div>
                    <div className="p-3.5 bg-white/5 border border-white/5 opacity-45 rounded-xl flex justify-between items-center text-slate-400 line-through">
                      <span>Kirti pays Amit</span>
                      <span className="font-extrabold text-sm">₹0</span>
                    </div>
                    <div className="text-center text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider pt-2 flex items-center justify-center gap-1.5">
                      <Check size={12} /> 66% transfers eliminated. Settled!
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* MIDDLE WIDGET COLUMN (Simulated Market Tickers + Chart) - span 7 */}
          <div className="lg:col-span-7 space-y-8 reveal-on-scroll">
            <div {...cardTilt} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#090d16]/50 hover:border-white/10 transition-all duration-300 shadow-xl text-left cursor-pointer">
              
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 flex-wrap gap-4">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Simulated Market Trends</h4>
                  <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Click rows to update sparkline</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Live Price</span>
                  <span key={flashTriggers[activeDemoAsset]} className={`text-xl font-black text-white font-mono transition-all duration-300 ${renderFlashClass(activeDemoAsset)}`}>
                    {activeDemoAsset === 'btc' ? '$' : '₹'}{tickerPrices[activeDemoAsset].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs ml-1.5 font-bold ${tickerDirections[activeDemoAsset] ? 'text-green-400' : 'text-red-400'}`}>
                    {tickerDirections[activeDemoAsset] ? '▲' : '▼'} {(Math.random() * 0.12 + 0.04).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Table of Simulated Markets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'nifty', name: 'Nifty 50' },
                  { id: 'sensex', name: 'Sensex' },
                  { id: 'reliance', name: 'Reliance' },
                  { id: 'tcs', name: 'TCS' },
                  { id: 'btc', name: 'BTC/USD' },
                  { id: 'gold', name: 'Gold (10g)' },
                ].map((asset) => {
                  const isSelected = activeDemoAsset === asset.id;
                  const isUp = tickerDirections[asset.id];
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setActiveDemoAsset(asset.id)}
                      className={`p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                          : 'bg-white/3 text-slate-300 border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5">{asset.name}</span>
                      <div className="flex items-baseline justify-between w-full">
                        <span className="text-xs font-black font-mono">
                          {asset.id === 'btc' ? '$' : '₹'}{Math.round(tickerPrices[asset.id]).toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-extrabold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                          {isUp ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sparkline AreaChart */}
              <div className="h-40 w-full relative filter drop-shadow-[0_0_12px_rgba(6,182,212,0.05)] border border-white/5 rounded-2xl bg-white/2 p-2.5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demoChartData[activeDemoAsset]}>
                    <defs>
                      <linearGradient id="premiumChartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin - 150', 'dataMax + 150']} hide />
                    <Tooltip 
                      contentStyle={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', fontSize: '10px' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                      itemStyle={{ color: 'white', fontWeight: 'bold' }}
                     cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#22D3EE" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#premiumChartGlow)" 
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Demo Wallet & Scalp Option Simulator */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-4 select-none relative">
                {tradeToast && (
                  <div key={tradeToast.id} className={`absolute -top-20 right-4 px-4.5 py-2 rounded-2xl font-mono text-[10px] font-black border shadow-2xl animate-bounce z-30 flex items-center gap-2 ${
                    tradeToast.profit 
                      ? 'bg-green-500/10 border-green-500/25 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.3)]' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
                  }`}>
                    <span>{tradeToast.profit ? '🎉 scalp profit:' : '🐻 scalp loss:'}</span>
                    <span className="font-extrabold text-[12px]">{tradeToast.amount > 0 ? '+' : ''}₹{tradeToast.amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Demo Wallet:</span>
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.08)]">
                    ₹{demoWallet.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => executeDemoTrade('call')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-slate-950 font-black text-[10px] uppercase rounded-xl transition duration-200 cursor-pointer shadow-[0_0_12px_rgba(34,197,94,0.18)] hover:scale-105 active:scale-95 btn-shimmer-trigger"
                  >
                    🚀 Scalp Call
                  </button>
                  <button 
                    onClick={() => executeDemoTrade('put')}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-650 text-slate-950 font-black text-[10px] uppercase rounded-xl transition duration-200 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.18)] hover:scale-105 active:scale-95 btn-shimmer-trigger"
                  >
                    🐻 Scalp Put
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM WIDGET ROW (AI Refinance Audit + News Bulletin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 reveal-on-scroll">
          
          {/* Widget 4: AI Prepayment trap checker */}
          <div {...cardTilt} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#090d16]/50 hover:border-white/10 transition-all duration-300 shadow-xl text-left cursor-pointer">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg text-amber-400">🛡️</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">AI Debt Refinance Auditor</span>
              </div>
              <span className="text-[9px] uppercase font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">Audit Alert</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Home Loan Amount</span>
                  <span>Interest rate</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white">
                  <span>₹75,00,000</span>
                  <span className="text-red-400">11.5% APR</span>
                </div>
              </div>

              {/* Warning/Action audits */}
              {!refinanceEMIApplied ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-[10.5px] text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span><strong>High APR Alert:</strong> 11.5% interest rate detected. Average bank balance transfer offers are at 8.5%.</span>
                  </div>
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-[10.5px] text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                    <span><strong>Interest Trap:</strong> You pay ₹1.17 Crore in interest for ₹75L loan. Interest exceeds principal by 1.5x.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 bg-green-500/10 border border-green-500/25 rounded-2xl text-[10.5px] text-green-300 flex items-start gap-2.5 shadow-[0_0_12px_rgba(34,197,94,0.05)]">
                    <Check size={15} className="shrink-0 mt-0.5 text-green-400" />
                    <span><strong>Audit Cleared:</strong> Simulated refinancing to 8.5%. Saved ₹14,767 per month instantly.</span>
                  </div>
                  <div className="p-3.5 bg-green-500/10 border border-green-500/25 rounded-2xl text-[10.5px] text-green-300 flex items-start gap-2.5 shadow-[0_0_12px_rgba(34,197,94,0.05)]">
                    <Check size={15} className="shrink-0 mt-0.5 text-green-400" />
                    <span><strong>Prepayments Added:</strong> Adding 1 extra EMI per year reduces tenure by 4.5 years and saves ₹24.8L in interest.</span>
                  </div>
                </div>
              )}

              {/* Comparative Mini Bar Chart representing interest paid */}
              <div className="w-full bg-slate-950/40 rounded-2xl border border-white/5 p-5 flex flex-col gap-4 transition-all duration-300 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wider select-none z-10">
                  <span>Interest Comparison Chart</span>
                  <span className="text-cyan-400 font-bold">
                    {refinanceEMIApplied ? "⚡ SAVINGS DETECTED" : "📊 AUDIT SIMULATION"}
                  </span>
                </div>
                
                <div className="h-32 flex items-end justify-around gap-8 pt-4 relative border-b border-white/5 pb-2">
                  {/* Grid Lines and Y-Axis Labels */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[7px] font-mono text-slate-500 select-none pb-2">
                    <div className="w-full border-t border-dashed border-white/10 flex justify-between"><span>₹1.2 Cr</span><span className="w-full border-t border-dashed border-white/10 ml-2" /></div>
                    <div className="w-full border-t border-dashed border-white/10 flex justify-between"><span>₹80L</span><span className="w-full border-t border-dashed border-white/10 ml-2" /></div>
                    <div className="w-full border-t border-dashed border-white/10 flex justify-between"><span>₹40L</span><span className="w-full border-t border-dashed border-white/10 ml-2" /></div>
                    <div className="w-full flex justify-between"><span>₹0</span><span className="w-full ml-2" /></div>
                  </div>

                  {/* Original Bar */}
                  <div className="flex flex-col items-center gap-2 z-10 w-24">
                    <div 
                      className={`w-12 rounded-t-lg transition-all duration-700 ease-out ${
                        refinanceEMIApplied 
                          ? "bg-gradient-to-t from-red-950/80 to-red-500/20 opacity-30 h-24" 
                          : "bg-gradient-to-t from-red-600 to-rose-400 h-24 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                      }`}
                    />
                    <span className={`text-[10px] font-black transition-all duration-500 ${refinanceEMIApplied ? 'text-slate-500' : 'text-slate-350'}`}>
                      ₹1.17 Cr
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Original</span>
                  </div>

                  {/* Savings Connecting Line overlay */}
                  {refinanceEMIApplied && (
                    <div className="absolute inset-x-12 top-6 bottom-14 border-t border-r border-dashed border-cyan-400/40 rounded-tr-xl pointer-events-none animate-pulse z-20">
                      <span className="absolute -top-3.5 right-6 bg-cyan-950/90 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[8px] font-black text-cyan-400 uppercase tracking-widest font-mono shadow-md">
                        -51.8% Saved
                      </span>
                    </div>
                  )}

                  {/* Refinanced Bar */}
                  <div className="flex flex-col items-center gap-2 z-10 w-24">
                    <div 
                      className={`w-12 rounded-t-lg transition-all duration-700 ease-out border ${
                        refinanceEMIApplied 
                          ? "bg-gradient-to-t from-emerald-600 to-cyan-450 border-emerald-500/30 h-12 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                          : "bg-slate-900/40 border-dashed border-white/10 h-6 opacity-30"
                      }`}
                    />
                    <span className={`text-[10px] font-black transition-all duration-500 ${refinanceEMIApplied ? "text-emerald-400" : "text-slate-500"}`}>
                      {refinanceEMIApplied ? "₹56.4L" : "—"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Refinanced</span>
                  </div>
                </div>
              </div>

              {/* Refinance CTA slider triggers */}
              <button
                onClick={() => setRefinanceEMIApplied(!refinanceEMIApplied)}
                className={`w-full py-3 rounded-2xl font-black text-xs transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                  refinanceEMIApplied 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                <RefreshCw size={13} className={refinanceEMIApplied ? 'animate-spin' : ''} />
                {refinanceEMIApplied ? "Restore Standard Loan" : "Simulate Refinance + Extra EMI"}
              </button>
            </div>
          </div>

          {/* Widget 5: FinBuddy Arena Live Hub (Leaderboard & News Tabs) */}
          <div {...cardTilt} className="glass-card p-6 rounded-3xl border border-white/5 bg-[#090d16]/50 hover:border-white/10 transition-all duration-300 shadow-xl text-left flex flex-col justify-between cursor-pointer min-h-[360px]">
            <div>
              {/* Tab Selector Header */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveBottomTab('leaderboard')}
                    className={`text-xs font-black uppercase tracking-wider pb-2 relative transition-all cursor-pointer ${
                      activeBottomTab === 'leaderboard' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    🏆 Battle League
                    {activeBottomTab === 'leaderboard' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-full animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveBottomTab('news')}
                    className={`text-xs font-black uppercase tracking-wider pb-2 relative transition-all cursor-pointer ${
                      activeBottomTab === 'news' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    📰 FinTech News
                    {activeBottomTab === 'news' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-full animate-pulse" />
                    )}
                  </button>
                </div>
                
                <span className="text-[9px] uppercase font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock size={10} className="animate-spin-slow" /> Arena Feed
                </span>
              </div>

              {/* Tab Content */}
              {activeBottomTab === 'leaderboard' ? (
                <div className="space-y-2.5 animate-fade-in text-slate-350">
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                    Cohort Rank Standings (simulated league)
                  </div>
                  
                  {leaderboard.map((player, idx) => {
                    const isTop1 = idx === 0;
                    return (
                      <div 
                        key={player.name} 
                        className={`p-2.5 rounded-2xl flex items-center justify-between transition-all duration-500 border ${
                          player.isYou 
                            ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)] font-bold' 
                            : 'bg-white/2 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-extrabold font-mono w-4 ${isTop1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                            #{idx + 1}
                          </span>
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black ${player.color}`}>
                            {player.avatar}
                          </div>
                          <span className={`text-xs font-extrabold ${player.isYou ? 'text-amber-400' : 'text-slate-300'}`}>
                            {player.name}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-white">
                          ₹{player.balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                  
                  {leaderboard[0].isYou && (
                    <div className="text-center text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider pt-2 animate-pulse">
                      🏆 Congratulations! You are currently Rank #1 in your cohort!
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in text-slate-350">
                  {/* Live Platform Action Feed */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      Live Platform Activity Log
                    </div>
                    
                    <div className="p-2.5 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="text-xs bg-cyan-500/10 text-cyan-400 p-1.5 rounded-lg border border-cyan-500/20">🌴</span>
                        <div>
                          <span className="font-extrabold text-slate-300">Rohan Mehta</span> settled Goa bills
                          <span className="text-cyan-400 font-bold block text-[9px]">O(V+E) cancelled 2 circular loops</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">2m ago</span>
                    </div>

                    <div className="p-2.5 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20">📈</span>
                        <div>
                          <span className="font-extrabold text-slate-300">You</span> scalped Nifty Call options
                          <span className="text-emerald-400 font-bold block text-[9px]">+₹2,450 virtual scalp profit!</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">5m ago</span>
                    </div>

                    <div className="p-2.5 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="text-xs bg-amber-500/10 text-amber-400 p-1.5 rounded-lg border border-amber-500/20">🛡️</span>
                        <div>
                          <span className="font-extrabold text-slate-300">Kirti Deshmukh</span> audited housing loan
                          <span className="text-amber-400 font-bold block text-[9px]">refinanced 11.5% APR trap to 8.5%</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">12m ago</span>
                    </div>
                  </div>

                  {/* News Story Slide container */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      Latest Fintech Bulletin
                    </div>
                    <div className="min-h-[80px] flex items-center bg-slate-950/20 rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                      <div key={currentNewsIdx} className="w-full text-[11px] font-medium leading-relaxed text-slate-350 animate-fade-in flex items-start gap-3">
                        <Flame size={15} className="text-orange-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-extrabold text-white text-xs mb-0.5">{NEWS_STORIES[currentNewsIdx].title}</h5>
                          <p className="text-[10px] text-slate-400 leading-normal">{NEWS_STORIES[currentNewsIdx].text}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicator dots */}
                    <div className="flex justify-center gap-1.5 pt-1.5">
                      {NEWS_STORIES.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentNewsIdx(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentNewsIdx === idx ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 5. PROCESS TRANSPARENCY: HOW FINBUDDY WORKS */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5 space-y-12 text-left">
        <div className="text-center space-y-2 reveal-on-scroll">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest bg-cyan-950/20">
            ⚙️ Daily Platform Mechanics
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            How FinBuddy Works
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-normal">
            A three-step gamified workflow designed for students and retail financial beginners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div {...cardTilt} className="reveal-on-scroll stagger-delay-1 bg-slate-900/30 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-cyan-400/20 transition-all duration-350 relative group cursor-pointer glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <span className="text-xs font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3.5 py-1.5 rounded-xl block w-fit">Step 01</span>
            <h4 className="font-extrabold text-base text-white flex items-center gap-1.5">
              Practice TradeArena <ArrowUpRight size={14} className="text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Every student gets ₹1,00,000 in simulated sandbox funds. Practice backtesting options chains and trading stocks on real-time simulated feeds without risk.
            </p>
          </div>

          <div {...cardTilt} className="reveal-on-scroll stagger-delay-2 bg-slate-900/30 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-emerald-400/20 transition-all duration-350 relative group cursor-pointer glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3.5 py-1.5 rounded-xl block w-fit">Step 02</span>
            <h4 className="font-extrabold text-base text-white flex items-center gap-1.5">
              Simplify Group Expenses <ArrowUpRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Log hostel travel, sharing flats, or weekend trips. SplitSmart's flow network graph calculations settle complex balances in the minimum transactions.
            </p>
          </div>

          <div {...cardTilt} className="reveal-on-scroll stagger-delay-3 bg-slate-900/30 border border-white/5 p-8 rounded-3xl space-y-4 hover:border-amber-400/20 transition-all duration-350 relative group cursor-pointer glass-card">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3.5 py-1.5 rounded-xl block w-fit">Step 03</span>
            <h4 className="font-extrabold text-base text-white flex items-center gap-1.5">
              Audit Lending Traps <ArrowUpRight size={14} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Audit high bank APR Traps, schedule multiple prepayments, simulate refinancing, and compare different loan payoff tracks on dynamic interactive timelines.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SANDBOX CORE LABORATORIES SECTION */}
      <section id="laboratories" className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5 text-left space-y-12">
        <div className="text-center space-y-2 reveal-on-scroll">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest bg-cyan-950/20">
            💼 Sandbox Labs
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Explore Our Core Laboratories
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-normal text-center">
            Start learning, splitting, and auditing. All our simulated tools are 100% free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          
          {/* Lab 1: TradeArena */}
          <div {...cardTilt} className="reveal-on-scroll stagger-delay-1 card bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:border-cyan-400/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group glass-card cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            
            <div className="space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 w-fit block font-sans">
                📊 TradeArena
              </span>
              <div className="space-y-1">
                <span className="text-3xl font-black text-white font-sans">Simulated</span>
                <span className="text-[10px] text-slate-500 block font-bold">Options & Equities Arena</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Practice trading stocks and options with simulated capital. Compete in group battles with zero real financial risk.
              </p>
              
              <ul className="space-y-3.5 border-t border-white/5 pt-6 text-slate-400 text-xs font-semibold">
                <li className="flex items-center gap-2.5"><Check size={13} className="text-cyan-400 shrink-0" /> ₹1 Lakh virtual sandbox funds</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-cyan-400 shrink-0" /> Real-time option chains backtests</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-cyan-400 shrink-0" /> Local cohort friend leaderboards</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-cyan-400 shrink-0" /> Advanced technical charts analysis</li>
              </ul>
            </div>

            <Link to={isAuthenticated ? "/trade" : "/register"} className="mt-8 relative z-10">
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center gap-1.5 btn-shimmer-trigger">
                Enter TradeArena <ArrowRight size={13} />
              </button>
            </Link>
          </div>

          {/* Lab 2: SplitSmart */}
          <div {...cardTilt} className="reveal-on-scroll stagger-delay-2 card bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:border-emerald-400/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group glass-card cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            
            <div className="space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-400/20 w-fit block font-sans">
                ⚙️ SplitSmart
              </span>
              <div className="space-y-1">
                <span className="text-3xl font-black text-white font-sans">Graph Settle</span>
                <span className="text-[10px] text-slate-500 block font-bold">Expense Minimization</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Log shared travel, flat bills, or group expenses. Collapses transaction loops to settle balances in minimum steps.
              </p>
              
              <ul className="space-y-3.5 border-t border-white/5 pt-6 text-slate-400 text-xs font-semibold">
                <li className="flex items-center gap-2.5"><Check size={13} className="text-emerald-400 shrink-0" /> Multi-friend split ledgers</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-emerald-400 shrink-0" /> Automated circular debt collapse</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-emerald-400 shrink-0" /> Net settlement calculations</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-emerald-400 shrink-0" /> Integrated group chat settlement</li>
              </ul>
            </div>

            <Link to={isAuthenticated ? "/split" : "/register"} className="mt-8 relative z-10">
              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5 btn-shimmer-trigger">
                Open SplitSmart <ArrowRight size={13} />
              </button>
            </Link>
          </div>

          {/* Lab 3: Smart Tools (Debt Engine & SWP) */}
          <div {...cardTilt} className="reveal-on-scroll stagger-delay-3 card bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col justify-between hover:border-amber-400/30 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group glass-card cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            
            <div className="space-y-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit block font-sans">
                🧠 Wealth & Debt Lab
              </span>
              <div className="space-y-1">
                <span className="text-3xl font-black text-white font-sans">Algorithms</span>
                <span className="text-[10px] text-slate-500 block font-bold">Interest Traps & Retirement</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Audit loan APR rates, balance transfers, and prepayments on the FinBuddy Debt Engine. Map out retirement SWP withdrawals.
              </p>
              
              <ul className="space-y-3.5 border-t border-white/5 pt-6 text-slate-400 text-xs font-semibold">
                <li className="flex items-center gap-2.5"><Check size={13} className="text-amber-400 shrink-0" /> AI Debt refinance auditor</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-amber-400 shrink-0" /> Prepayment preset cheat codes</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-amber-400 shrink-0" /> Systematic Withdrawal Plan timeline</li>
                <li className="flex items-center gap-2.5"><Check size={13} className="text-amber-400 shrink-0" /> PDF reports generator & resetters</li>
              </ul>
            </div>

            <Link to={isAuthenticated ? "/smart" : "/register"} className="mt-8 relative z-10">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center gap-1.5 btn-shimmer-trigger">
                Launch Wealth Lab <ArrowRight size={13} />
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* 7. REAL INVESTOR TESTIMONIALS */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 border-t border-white/5 text-left space-y-12">
        <div className="text-center space-y-2 reveal-on-scroll">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest bg-cyan-950/20">
            💬 Reviews
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Young Retail Reviews
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-normal">
            Hear how college students level up their personal finance using FinBuddy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div {...cardTilt} className="reveal-on-scroll stagger-delay-1 card bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl space-y-6 shadow-lg hover:border-white/10 transition-all duration-300 glass-card cursor-pointer">
            <p className="text-xs sm:text-sm text-slate-350 italic leading-relaxed">
              "In just 2 weeks, I've made smarter virtual trades thanks to AI Mentor's risk evaluation. Their NIFTY50 trends are extremely intuitive. Setting up private TradeArena battles with my college roommates kept us hooked on reading finance news daily!"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs animate-float-medium">
                RM
              </div>
              <div>
                <h5 className="text-xs font-black text-white">Rahul Mehta</h5>
                <span className="text-[10px] text-slate-500 font-bold">Student, IIT Madras</span>
              </div>
            </div>
          </div>

          <div {...cardTilt} className="reveal-on-scroll stagger-delay-2 card bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl space-y-6 shadow-lg hover:border-white/10 transition-all duration-300 glass-card cursor-pointer">
            <p className="text-xs sm:text-sm text-slate-350 italic leading-relaxed">
              "I finally understand compound interest and market velocity. The way FinBuddy visualizes the Debt Payoff Engine with original vs accelerated timeline charts is just brilliant. SplitSmart also resolved all our flat group bills hassle-free."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-xs animate-float-fast">
                KD
              </div>
              <div>
                <h5 className="text-xs font-black text-white">Kirti Deshmukh</h5>
                <span className="text-[10px] text-slate-500 font-bold">Business Analyst, Pune</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-6 py-16 border-t border-white/5 text-left space-y-12">
        <div className="text-center space-y-2 reveal-on-scroll">
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] uppercase font-black px-3.5 py-1.5 rounded-full tracking-widest bg-cyan-950/20">
            ❓ FAQ
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
            FAQs & Platform Info
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-normal text-center">
            Got queries about simulated markets, graph settling, or AI mentors? Find responses here.
          </p>
        </div>

        <div className="space-y-4 pt-4 reveal-on-scroll font-medium">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpenIdx === idx;
            return (
              <div 
                key={idx}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left text-xs sm:text-sm font-black text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={15} className={`text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-white/5 pt-4 animate-fade-in font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. SEBI ADVISORY COMPLIANCE FOOTER */}
      <footer className="border-t border-white/5 pt-16 pb-12 px-6 text-center text-[10px] text-slate-500 max-w-4xl mx-auto leading-relaxed font-sans space-y-6">
        <div className="flex justify-center flex-wrap gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-cyan-400" /> Non-SEBI educational tool</span>
          <span className="flex items-center gap-1.5"><Award size={13} className="text-cyan-400" /> Simulated virtual capital</span>
          <span className="flex items-center gap-1.5"><Users size={13} className="text-cyan-400" /> Made for retail education</span>
        </div>
        <p className="pt-2 font-medium">
          Disclaimer: FinBuddy is a simulated learning and educational dashboard. All index prices, stock quotes, and option backtest metrics are generated using simulated live feeds for educational purposes and do not represent real-time exchange transactions or SEBI-registered financial advisory operations. SplitSmart debt settlements are graph mathematical solutions and require manual payments outside the platform. Real investments carry market risks. Always refer to SEBI-licensed brokers and financial planners before executing real market investments.
        </p>
        <p className="text-slate-650 font-bold uppercase tracking-widest pt-2 font-sans">
          © {new Date().getFullYear()} FinBuddy Lab. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
};
export default Landing;