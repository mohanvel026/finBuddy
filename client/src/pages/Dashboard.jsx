// client/src/pages/Dashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import SectionGuide from '../components/common/SectionGuide';


// ─── Sector color helper (used for live data from /market/sectors API) ─────────
const DEFAULT_SECTORS = [
  { name: 'IT', pct: 0 }, { name: 'BANK', pct: 0 }, { name: 'AUTO', pct: 0 },
  { name: 'FMCG', pct: 0 }, { name: 'PHARMA', pct: 0 }, { name: 'ENERGY', pct: 0 },
  { name: 'METAL', pct: 0 }, { name: 'REALTY', pct: 0 }, { name: 'MEDIA', pct: 0 }, { name: 'PSU', pct: 0 },
];

const getSectorColor = (pct) => {
  if (pct >= 2)   return { bg: 'rgba(52,211,153,0.30)', border: 'rgba(52,211,153,0.5)',  text: '#34D399' };
  if (pct >= 0.5) return { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)',  text: '#6EE7B7' };
  if (pct >= -0.5)return { bg: 'rgba(100,100,130,0.15)', border: 'rgba(148,163,184,0.2)', text: '#94A3B8' };
  if (pct >= -2)  return { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', text: '#FCA5A5' };
  return              { bg: 'rgba(248,113,113,0.30)', border: 'rgba(248,113,113,0.5)',  text: '#F87171' };
};

const getRsiColor = (rsi) => {
  if (rsi >= 70) return { color: '#F87171', label: 'Overbought', cls: 'animate-radar-ping' };
  if (rsi <= 30) return { color: '#A78BFA', label: 'Oversold',   cls: 'animate-radar-ping' };
  return              { color: '#34D399', label: 'Neutral',     cls: '' };
};

const StatCard = ({ icon, label, value, sub, color = 'cyan' }) => (
  <div className="card hover:border-white/10 transition">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        color === 'green' ? 'bg-green-500/10 text-green-400' :
        color === 'red' ? 'bg-red-500/10 text-red-400' :
        'bg-cyan-500/10 text-cyan-400'
      }`}>{sub}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-slate-400 text-sm mt-1">{label}</p>
  </div>
);

const QuickAction = ({ icon, label, path }) => (
  <Link to={path}>
    <div className="card text-center hover:border-white/15 transition cursor-pointer group p-4">
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <p className="text-sm font-medium text-slate-300">{label}</p>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechVoice, setSpeechVoice] = useState('female'); // 'female' (Sophia) | 'male' (Arthur)
  const [sipPaid, setSipPaid] = useState(false);
  const [dashboardGoals, setDashboardGoals] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [timeframe, setTimeframe] = useState('1W');
  const [portfolioDayChange, setPortfolioDayChange] = useState(null);
  const [liveNavs, setLiveNavs] = useState({});
  const [nextSip, setNextSip] = useState(null);
  const [sentimentData, setSentimentData] = useState({ score: 50, label: 'Neutral', vix: '--', sentiment: 'Stable' });
  const [portfolioHistory, setPortfolioHistory] = useState([]);

  // Live fluctuating holdings with RSI
  const [holdings, setHoldings] = useState([]);
  const [holdingsFlash, setHoldingsFlash] = useState({});

  const [usdToInr, setUsdToInr] = useState(83.50);
  const getHoldingValueINR = (hold) => {
    const val = hold.price * hold.qty;
    if (hold.symbol === 'BTC' || hold.assetClass === 'CRYPTO' || hold.assetClass === 'US_STOCK' || hold.type === 'US Stock') {
      if (hold.symbol === 'BTC' && hold.price > 10000) {
        return val;
      }
      if (hold.price < 10000) {
        return val * usdToInr;
      }
    }
    return val;
  };

  const getChartDataForTimeframe = () => {
    // If we have real portfolio history from the API, use it
    if (portfolioHistory && portfolioHistory.length > 1) {
      const limit = timeframe === '1D' ? 12 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 12;
      const sliced = portfolioHistory.slice(-limit);
      return sliced.map(h => ({
        name: new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        value: h.value
      }));
    }

    // No real data — return empty array; chart will render an empty state
    return [];
  };

  // Sector heatmap — initialise with zeros, real data loaded from API in loadData()
  const [sectors, setSectors] = useState(DEFAULT_SECTORS);

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadData();
    loadBriefing();
    loadSentiment();
    loadGoals();
    
    // Fluctuating holdings ticks with RSI drift — only runs when real holdings are loaded
    const interval = setInterval(() => {
      setHoldings(prev => {
        if (!prev || prev.length === 0) return prev;
        const triggers = { ...holdingsFlash };
        const next = prev.map(item => {
          const change = (Math.random() - 0.49) * 0.12;
          const isUp = change >= 0;
          const nextPrice = Math.max(1, item.price * (1 + change / 100));
          const rsiDrift = (Math.random() - 0.5) * 3;
          const nextRsi = Math.max(15, Math.min(85, item.rsi + rsiDrift));
          triggers[item.symbol] = isUp ? 'up-' + Date.now() : 'down-' + Date.now();
          return { ...item, price: nextPrice, change, isUp, rsi: nextRsi };
        });
        setHoldingsFlash(triggers);
        return next;
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      window.speechSynthesis.cancel();
    };
  }, []);

  const loadGoals = async () => {
    try {
      const res = await api.get('/wealth/goals');
      if (res.data?.success && res.data.goals) {
        const mapped = res.data.goals.map(g => ({
          id: g._id,
          name: g.name,
          target: g.targetAmount,
          current: g.currentAmount,
          deadlineYear: g.deadline ? new Date(g.deadline).getFullYear() : new Date().getFullYear() + 5,
          category: g.category
        }));
        setDashboardGoals(mapped);
      }
    } catch (e) { console.error(e); }
  };

  const loadSentiment = async () => {
    try {
      const res = await api.get('/market/sentiment');
      if (res.data?.success) {
        setSentimentData({
          score: res.data.fearGreedIndex || 50,
          label: res.data.label || 'Neutral',
          vix: res.data.indiaVix || '--',
          sentiment: res.data.sentiment || 'Stable'
        });
      }
    } catch (e) {}
  };

  const loadBriefing = async () => {
    try {
      const res = await api.get('/market/briefing');
      if (res.data.success) {
        setBriefing(res.data.briefing);
      }
    } catch (e) {}
    setBriefingLoading(false);
  };

  const parseMfDate = (dStr) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dStr);
  };

  const calculateSipUnitsSimpl = (sip, chartData) => {
    if (!chartData || chartData.length === 0) return { units: 0, invested: 0, currentNav: 0, avgNav: 0, currentVal: 0 };
    
    const navHistory = chartData
      .map(d => ({ date: parseMfDate(d.date), nav: parseFloat(d.NAV || d.nav || 0) }))
      .sort((a, b) => a.date - b.date);

    if (navHistory.length === 0) return { units: 0, invested: 0, currentNav: 0, avgNav: 0, currentVal: 0 };

    const start = new Date(sip.startDate);
    const end = sip.endDate ? new Date(sip.endDate) : new Date();

    const findNavOnOrAfter = (targetDate) => {
      const entry = navHistory.find(h => h.date >= targetDate);
      if (!entry) return navHistory[navHistory.length - 1];
      return entry;
    };

    let runningUnits = 0;
    let runningInvested = 0;

    let currentDate = new Date(start.getFullYear(), start.getMonth(), parseInt(sip.sipDay));
    if (currentDate < start) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    while (currentDate <= end && currentDate <= new Date()) {
      const navEntry = findNavOnOrAfter(currentDate);
      if (navEntry) {
        const amount = sip.sipAmount;
        runningUnits += amount / navEntry.nav;
        runningInvested += amount;
      }
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, parseInt(sip.sipDay));
    }

    if (sip.lumpsums && sip.lumpsums.length > 0) {
      sip.lumpsums.forEach(l => {
        const navEntry = findNavOnOrAfter(new Date(l.date));
        if (navEntry) {
          runningUnits += l.amount / navEntry.nav;
          runningInvested += l.amount;
        }
      });
    }

    if (sip.redemptions && sip.redemptions.length > 0) {
      sip.redemptions.forEach(r => {
        const navEntry = findNavOnOrAfter(new Date(r.date));
        const rNav = r.nav || (navEntry ? navEntry.nav : 0);
        runningUnits -= r.units;
        runningInvested -= r.units * (runningUnits > 0 ? (runningInvested / (runningUnits + r.units)) : 0);
      });
    }

    if (runningUnits < 0) runningUnits = 0;
    if (runningInvested < 0) runningInvested = 0;

    const currentNav = navHistory[navHistory.length - 1].nav;
    return {
      units: Math.round(runningUnits * 1000) / 1000,
      invested: Math.round(runningInvested),
      currentNav,
      avgNav: runningUnits > 0 ? Math.round((runningInvested / runningUnits) * 100) / 100 : 0,
      currentVal: Math.round(runningUnits * currentNav)
    };
  };

  const loadData = async () => {
    try {
      const [groupsRes, trendingRes, netWorthRes, sipPortfolioRes] = await Promise.allSettled([
        api.get('/groups'),
        api.get('/market/trending'),
        api.get('/wealth/networth'),
        api.get('/sip-portfolio')
      ]);

      if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.data.groups || []);
      if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data.stocks || []);

      const compiled = new Map();

      // Helper to generate a stable mock RSI based on symbol
      const getDeterministicRsi = (sym) => {
        let hash = 0;
        for (let i = 0; i < sym.length; i++) {
          hash = sym.charCodeAt(i) + ((hash << 5) - hash);
        }
        return 35 + (Math.abs(hash) % 35);
      };

      // 1. Process paper trading portfolio from networth endpoint
      if (netWorthRes.status === 'fulfilled' && netWorthRes.value.data?.success) {
        const nwData = netWorthRes.value.data;
        setPortfolioHistory(nwData.portfolio?.valueHistory || []);
        const paperHoldings = nwData.portfolio?.holdings || [];
        paperHoldings.forEach(h => {
          const sym = h.symbol.toUpperCase();
          compiled.set(sym, {
            name: h.companyName || h.symbol,
            symbol: h.symbol,
            type: 'Stock (Paper)',
            price: h.currentPrice || h.avgBuyPrice,
            qty: h.quantity,
            change: h.dayChange || 0,
            isUp: (h.dayChange || 0) >= 0,
            rsi: getDeterministicRsi(sym),
            assetClass: 'EQUITY'
          });
        });

        const paperCryptos = nwData.portfolio?.crypto || [];
        paperCryptos.forEach(c => {
          const sym = c.symbol.toUpperCase();
          compiled.set(sym, {
            name: c.name || c.symbol,
            symbol: c.symbol,
            type: 'Crypto (Paper)',
            price: c.currentPrice || c.avgBuyPrice,
            qty: c.quantity,
            change: 0,
            isUp: true,
            rsi: getDeterministicRsi(sym),
            assetClass: 'CRYPTO'
          });
        });

        const paperMFs = nwData.portfolio?.mutualFunds || [];
        paperMFs.forEach(mf => {
          const sym = mf.schemeCode;
          compiled.set(sym, {
            name: mf.fundName || mf.schemeCode,
            symbol: mf.schemeCode,
            type: 'Mutual Fund (Paper)',
            price: mf.currentNAV || mf.avgNAV,
            qty: mf.units,
            change: 0,
            isUp: true,
            rsi: getDeterministicRsi(sym),
            assetClass: 'MUTUAL_FUND'
          });
        });
      }

      // 2. Process real tracked portfolio from sip-portfolio endpoint
      if (sipPortfolioRes.status === 'fulfilled' && sipPortfolioRes.value.data?.success && sipPortfolioRes.value.data.data) {
        const sipData = sipPortfolioRes.value.data.data;
        
        const realStocks = sipData.zerodhaHoldings || [];
        realStocks.forEach(s => {
          const sym = s.symbol.toUpperCase();
          if (compiled.has(sym)) {
            const existing = compiled.get(sym);
            existing.qty += s.qty;
          } else {
            compiled.set(sym, {
              name: s.name || s.symbol,
              symbol: s.symbol,
              type: 'Stock',
              price: s.currentPrice || s.avgPrice,
              qty: s.qty,
              change: 0,
              isUp: true,
              rsi: getDeterministicRsi(sym),
              assetClass: 'EQUITY'
            });
          }
        });

        const realUsStocks = sipData.indmoneyUS || [];
        realUsStocks.forEach(s => {
          const sym = s.symbol.toUpperCase();
          if (compiled.has(sym)) {
            const existing = compiled.get(sym);
            existing.qty += s.qty;
          } else {
            compiled.set(sym, {
              name: s.name || s.symbol,
              symbol: s.symbol,
              type: 'US Stock',
              price: s.currentPriceUsd || s.avgPriceUsd,
              qty: s.qty,
              change: 0,
              isUp: true,
              rsi: getDeterministicRsi(sym),
              assetClass: 'US_STOCK'
            });
          }
        });

        const realCryptos = sipData.cryptos || [];
        realCryptos.forEach(c => {
          const sym = c.symbol.toUpperCase();
          if (compiled.has(sym)) {
            const existing = compiled.get(sym);
            existing.qty += c.qty;
          } else {
            compiled.set(sym, {
              name: c.name || c.symbol,
              symbol: c.symbol,
              type: 'Crypto',
              price: c.currentPrice || c.avgPrice,
              qty: c.qty,
              change: 0,
              isUp: true,
              rsi: getDeterministicRsi(sym),
              assetClass: 'CRYPTO'
            });
          }
        });

        const goldHoldings = sipData.goldHoldings || [];
        goldHoldings.forEach(g => {
          const key = `GOLD_${g.platform.toUpperCase()}_${g.metalType.toUpperCase()}`;
          compiled.set(key, {
            name: `${g.platform} ${g.metalType}`,
            symbol: g.metalType === 'Gold' ? 'GOLD' : 'SILVER',
            type: 'Commodity',
            price: g.avgBuyPrice || (g.metalType === 'Gold' ? 6500 : 80),
            qty: g.grams,
            change: 0,
            isUp: true,
            rsi: getDeterministicRsi(g.metalType === 'Gold' ? 'GOLD' : 'SILVER'),
            assetClass: 'COMMODITY'
          });
        });

        // Fetch live quotes for stock/US stock/commodity symbols concurrently
        const stockHoldings = Array.from(compiled.values()).filter(h => h.assetClass === 'EQUITY' || h.assetClass === 'US_STOCK' || h.assetClass === 'COMMODITY');
        if (stockHoldings.length > 0) {
          try {
            const symsList = stockHoldings.map(h => h.symbol).join(',');
            const quotesRes = await api.get(`/market/quotes?symbols=${encodeURIComponent(symsList)}`);
            if (quotesRes.data?.success && quotesRes.data.quotes) {
              quotesRes.data.quotes.forEach(quote => {
                const matches = Array.from(compiled.values()).filter(h => h.symbol.toUpperCase() === quote.symbol.toUpperCase());
                matches.forEach(matched => {
                  matched.price = quote.price;
                  matched.change = quote.changePercent || 0;
                  matched.isUp = quote.isUp;
                });
              });
            }
          } catch (e) {
            console.warn('Failed to resolve stock quotes for dashboard:', e);
          }
        }

        // Fetch NAVs for real tracked mutual fund SIPs concurrently using local offline-safe route
        const realSIPs = sipData.sips || [];
        if (realSIPs.length > 0) {
          await Promise.allSettled(realSIPs.map(async (sip) => {
            try {
              const res = await api.get(`/mf/${sip.schemeCode}/nav?limit=730`);
              if (res.data?.success && res.data.chartData) {
                const calc = calculateSipUnitsSimpl(sip, res.data.chartData);
                if (calc && calc.units > 0) {
                  const newestNav = res.data.chartData[0]?.NAV || res.data.chartData[0]?.nav || 0;
                  const previousNav = res.data.chartData[1]?.NAV || res.data.chartData[1]?.nav || newestNav;
                  const mfChange = previousNav > 0 ? ((newestNav - previousNav) / previousNav) * 100 : 0;
                  compiled.set(sip.schemeCode, {
                    name: sip.schemeName,
                    symbol: sip.schemeCode,
                    type: 'Mutual Fund',
                    price: calc.currentNav,
                    qty: calc.units,
                    change: parseFloat(mfChange.toFixed(2)),
                    isUp: mfChange >= 0,
                    rsi: getDeterministicRsi(sip.schemeCode),
                    assetClass: 'MUTUAL_FUND'
                  });
                }
              }
            } catch (e) {
              console.warn(`Failed to resolve NAV for scheme ${sip.schemeCode}:`, e);
            }
          }));
        }

        // Compute next upcoming SIP
        const sips = sipData.sips || [];
        const today = new Date();
        const upcoming = sips
          .filter(s => s.isActive !== false && s.sipDay)
          .map(s => {
            const sipDay = parseInt(s.sipDay) || 1;
            const nextDate = new Date(today.getFullYear(), today.getMonth(), sipDay);
            if (nextDate <= today) nextDate.setMonth(nextDate.getMonth() + 1);
            const daysUntil = Math.ceil((nextDate - today) / 86400000);
            return { ...s, nextDate, daysUntil };
          })
          .sort((a, b) => a.daysUntil - b.daysUntil)[0];
        if (upcoming) setNextSip(upcoming);
      }

      setHoldings(Array.from(compiled.values()));

      // Compute real portfolio day change from compiled holdings
      const holdingsArr = Array.from(compiled.values());
      if (holdingsArr.length > 0) {
        const totalValue = holdingsArr.reduce((s, h) => s + (h.price || 0) * (h.qty || 0), 0);
        const totalPrevValue = holdingsArr.reduce((s, h) => {
          const prev = (h.price || 0) / (1 + ((h.change || 0) / 100));
          return s + prev * (h.qty || 0);
        }, 0);
        const pct = totalPrevValue > 0 ? ((totalValue - totalPrevValue) / totalPrevValue) * 100 : 0;
        setPortfolioDayChange(parseFloat(pct.toFixed(2)));
      }

      // Fetch live NAVs for Quick SIP launcher
      try {
        const sipCodes = ['120465', '125497', '120843'];
        const navRes = await Promise.allSettled(sipCodes.map(code => api.get(`/mf/${code}/nav?limit=1`)));
        const navMap = {};
        navRes.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const d = r.value.data;
            const nav = d?.chartData?.[0]?.NAV || d?.chartData?.[0]?.nav;
            if (nav) navMap[sipCodes[i]] = parseFloat(nav);
          }
        });
        setLiveNavs(navMap);
      } catch (e) {}

      // Fetch activity feed
      try {
        const actRes = await api.get('/activity');
        if (actRes.data?.success) setActivities(actRes.data.activities || []);
      } catch (e) { /* activity feed silently empty */ }

      // Fetch sector performance heatmap
      try {
        const sectorRes = await api.get('/market/sectors');
        if (sectorRes.data?.success && sectorRes.data.sectors) setSectors(sectorRes.data.sectors);
      } catch (e) {}

      // Fetch dynamic USD to INR conversion rate
      try {
        const curRes = await api.get('/trips/currencies/list');
        if (curRes.data?.success && curRes.data.currencies) {
          const usdCur = curRes.data.currencies.find(c => c.code === 'USD');
          if (usdCur && usdCur.rateToINR) {
            setUsdToInr(usdCur.rateToINR);
          }
        }
      } catch (e) {}

    } catch (e) {
      console.error('Dashboard loadData failed:', e);
    }
    setLoading(false);
  };

  const toggleSpeech = () => {
    if (!briefing?.briefing) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(briefing.briefing);
      // Sophia (Female: higher pitch/normal rate) vs Arthur (Male: lower pitch/slower rate)
      if (speechVoice === 'female') {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 0.85;
        utterance.rate = 0.92;
      }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePaySip = async () => {
    if (!nextSip) return;
    try {
      let nav = 0;
      const matchedHolding = holdings.find(h => h.symbol === nextSip.schemeCode);
      if (matchedHolding) {
        nav = matchedHolding.price;
      } else {
        const navRes = await api.get(`/mf/${nextSip.schemeCode}/nav?limit=1`);
        const chartData = navRes.data?.chartData || [];
        nav = chartData[0]?.NAV || chartData[0]?.nav || 100;
      }

      await api.post('/trades/buy-mutual-fund', {
        schemeCode: nextSip.schemeCode,
        schemeName: nextSip.schemeName,
        amount: nextSip.sipAmount,
        investmentType: 'SIP',
        nav: nav
      });

      setSipPaid(true);
      toast.success(`SIP installment of ₹${nextSip.sipAmount?.toLocaleString('en-IN')} for ${nextSip.schemeName} processed successfully! 💰`);
      if (user) {
        updateUser({ virtualWallet: user.virtualWallet - nextSip.sipAmount });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'SIP payment failed');
    }
  };

  const handleQuickSip = async (fund) => {
    try {
      const { data } = await api.post('/trades/buy-mutual-fund', {
        schemeCode: fund.code,
        schemeName: fund.name,
        amount: fund.amount,
        investmentType: 'SIP',
        nav: fund.nav
      });
      toast.success(data.message || `Invested ₹${fund.amount} in ${fund.name}! 📈`);
      if (user) {
        updateUser({ virtualWallet: user.virtualWallet - fund.amount });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Quick SIP failed');
    }
  };

  const totalOwed = groups.reduce((sum, g) => g.myBalance > 0 ? sum + g.myBalance : sum, 0);
  const totalOwe = groups.reduce((sum, g) => g.myBalance < 0 ? sum + Math.abs(g.myBalance) : sum, 0);

  const quickActions = [
    { icon: '💸', label: 'Split a Bill',  path: '/split' },
    { icon: '📈', label: 'Trade Stocks',  path: '/trade' },
    { icon: '⏰', label: 'StrategyLab',    path: '/trade/strategy' },
    { icon: '🤖', label: 'Ask AI Mentor', path: '/mentor' },
    { icon: '⚔️', label: 'Start Battle',  path: '/battle' },
    { icon: '📊', label: 'Net Worth',     path: '/wealth' },
  ];



  const renderFlashClass = (symbol) => {
    const trigger = holdingsFlash[symbol];
    if (!trigger) return '';
    return trigger.startsWith('up') ? 'animate-flash-green' : 'animate-flash-red';
  };

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your financial overview today</p>
        </div>

        {/* Inline Section Guide */}


        {/* Upcoming SIP Alert Banner */}
        {!sipPaid && nextSip && (
          <div className="card mb-6 border border-amber-500/25 bg-amber-500/[0.03] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-extrabold text-sm text-white">Upcoming SIP Payment Due</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {nextSip
                    ? <span>₹{nextSip.sipAmount?.toLocaleString('en-IN')} due in {nextSip.daysUntil} day{nextSip.daysUntil !== 1 ? 's' : ''} for {nextSip.schemeName}</span>
                    : <span>No upcoming SIPs scheduled</span>
                  }
                </p>
              </div>
            </div>
            <button 
              onClick={handlePaySip}
              className="py-1.5 px-4 text-xs font-black rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition cursor-pointer shrink-0"
            >
              Pay/Top-Up Now
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="💰"
            label="Virtual Wallet"
            value={`₹${(user?.virtualWallet ?? 0).toLocaleString('en-IN')}`}
            sub="Available"
            color="cyan"
          />
          <StatCard
            icon="📊"
            label="FinScore"
            value={user?.finScore || 500}
            sub={user?.finScore >= 700 ? '🔥 Great' : user?.finScore >= 500 ? '👍 Good' : '📈 Building'}
            color={user?.finScore >= 700 ? 'green' : 'cyan'}
          />
          <StatCard
            icon="✅"
            label="Friends owe you"
            value={`₹${totalOwed.toLocaleString('en-IN')}`}
            sub={`${groups.filter(g => g.myBalance > 0).length} groups`}
            color="green"
          />
          <StatCard
            icon="⏳"
            label="You owe"
            value={`₹${totalOwe.toLocaleString('en-IN')}`}
            sub={`${groups.filter(g => g.myBalance < 0).length} groups`}
            color={totalOwe > 0 ? 'red' : 'cyan'}
          />
        </div>

        {/* Quick Actions (Full-Width Row) */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {quickActions.map((a, i) => (
              <QuickAction key={i} {...a} />
            ))}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Column 1 & 2: Core Insights, Portfolio, Heatmap, Activity (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Daily Briefing Card */}
            {(!briefingLoading && briefing) && (
              <div className="card border border-cyan-500/25 bg-gradient-to-r from-cyan-950/20 via-[var(--bg-secondary)] to-purple-950/20 shadow-[0_8px_32px_0_rgba(124,58,237,0.08)] relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-white">FinBuddy AI Daily Digest</span>
                  </div>
                  <div className="flex items-center gap-3">
                    
                    {/* Voice selector */}
                    <div className="flex bg-black/40 border border-white/10 rounded-full p-0.5 text-[9px] font-bold">
                      <button 
                        onClick={() => { setSpeechVoice('female'); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition ${speechVoice === 'female' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}
                      >
                        Sophia (♀)
                      </button>
                      <button 
                        onClick={() => { setSpeechVoice('male'); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                        className={`px-2 py-0.5 rounded-full cursor-pointer transition ${speechVoice === 'male' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}
                      >
                        Arthur (♂)
                      </button>
                    </div>

                    {/* Equalizer animation */}
                    {isSpeaking && (
                      <div className="flex items-end gap-0.5 h-4 px-1 shrink-0">
                        <div className="w-0.5 bg-cyan-400 rounded-full animate-eq-bar" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 bg-cyan-400 rounded-full animate-eq-bar" style={{ animationDelay: '0.25s' }} />
                        <div className="w-0.5 bg-cyan-400 rounded-full animate-eq-bar" style={{ animationDelay: '0.4s' }} />
                        <div className="w-0.5 bg-cyan-400 rounded-full animate-eq-bar" style={{ animationDelay: '0.15s' }} />
                        <div className="w-0.5 bg-cyan-400 rounded-full animate-eq-bar" style={{ animationDelay: '0.3s' }} />
                      </div>
                    )}

                    <button 
                      onClick={toggleSpeech} 
                      className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 rounded-full text-xs font-bold transition cursor-pointer"
                    >
                      {isSpeaking ? '⏸️ Stop' : '🔊 Listen'}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-medium mb-5">
                  "{briefing.briefing}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">📰 Market Sentiment</span>
                    <p className="text-xs font-bold text-white leading-tight">{briefing.marketSummary}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">💡 Tactical Action</span>
                    <p className="text-xs font-medium text-slate-300 leading-tight">{briefing.tip}</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">🎯 FinScore Pulse</span>
                    <p className="text-xs font-medium text-purple-400 leading-tight">{briefing.finscoreFact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Combined Portfolio Performance Widget */}
            <div className="card border border-white/5 bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Multi-Asset</span>
                    <h3 className="font-extrabold text-sm text-white">Net Value Progression</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Real-time consolidated equity, crypto, and mutual fund valuation</p>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-lg font-black text-white font-mono">
                      ₹{holdings.reduce((sum, h) => sum + getHoldingValueINR(h), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    {portfolioDayChange !== null ? (
                      <span className={`text-xs font-bold ml-2 ${portfolioDayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {portfolioDayChange >= 0 ? '▲' : '▼'} {Math.abs(portfolioDayChange).toFixed(2)}% Today
                      </span>
                    ) : null}
                  </div>
                  
                  {/* Timeframe Selector tabs */}
                  <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5 text-[10px] font-bold">
                    {['1D', '1W', '1M', '1Y'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                          timeframe === tf ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Historical Recharts AreaChart */}
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartDataForTimeframe()}>
                    <defs>
                      <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px', color: 'white' }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Portfolio Net Value']}
                      cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#portGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Holdings list with RSI Monitor */}
              <div className="mt-6 border-t border-white/5 pt-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Assets & RSI Thresholds</p>
                  <span className="text-[9px] text-slate-500 font-mono">Thresholds: &gt;70 Overbought (Alert) | &lt;30 Oversold (Opportunity)</span>
                </div>
                {holdings.length === 0 ? (
                  <div className="col-span-full py-8 px-4 text-center rounded-2xl bg-white/[0.01] border border-white/5 relative overflow-hidden flex flex-col items-center">
                    <span className="text-3xl mb-2">📊</span>
                    <p className="text-xs font-bold text-slate-300">No assets in your portfolio yet</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mt-1 mb-4 leading-relaxed">
                      Track your stocks, cryptos, and mutual funds in Wealth Map, or start paper trading in Trade Arena.
                    </p>
                    <div className="flex gap-2">
                      <Link to="/wealth">
                        <button className="btn-primary py-1.5 px-3 text-[10px] font-bold cursor-pointer">
                          📈 Track Real Assets
                        </button>
                      </Link>
                      <Link to="/trade">
                        <button className="btn-secondary py-1.5 px-3 text-[10px] font-bold cursor-pointer">
                          🎮 Virtual Paper Trade
                        </button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {holdings.map((hold) => {
                      const rsiData = getRsiColor(hold.rsi);
                      const holdingValue = getHoldingValueINR(hold);
                      const isOverbought = hold.rsi >= 70;
                      const isOversold = hold.rsi <= 30;

                      return (
                        <div 
                          key={hold.symbol} 
                          className={`bg-white/[0.01] border p-3 rounded-xl text-left hover:bg-white/[0.03] transition duration-300 relative group ${
                            isOverbought ? 'border-red-500/20 hover:border-red-500/40' :
                            isOversold ? 'border-purple-500/20 hover:border-purple-500/40' :
                            'border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-white">{hold.symbol}</span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{hold.assetClass?.replace('_', ' ') || hold.type}</span>
                            </div>
                            <span 
                              className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                isOverbought ? 'bg-red-500/10 text-red-400' :
                                isOversold ? 'bg-purple-500/10 text-purple-400' :
                                'bg-green-500/10 text-green-400'
                              }`}
                            >
                              {rsiData.label}
                            </span>
                          </div>

                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400">Holding Val:</span>
                              <span className="font-extrabold text-white font-mono">
                                ₹{holdingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-400">Position Qty:</span>
                              <span className="font-bold text-slate-200">{hold.qty} {hold.symbol === 'BTC' ? 'BTC' : hold.symbol === 'GOLD' || hold.symbol === 'SILVER' ? 'Grams' : 'Units'}</span>
                            </div>
                            <div className="flex justify-between text-[10px] items-baseline">
                              <span className="text-slate-400">Price:</span>
                              <span key={holdingsFlash[hold.symbol]} className={`font-bold font-mono transition-colors duration-200 ${renderFlashClass(hold.symbol)}`}>
                                {hold.symbol === 'BTC' ? '$' : '₹'}{hold.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* RSI Indicator slide bar */}
                          <div className="mt-3">
                            <div className="w-full bg-white/10 rounded-full h-1">
                              <div 
                                className="h-1 rounded-full transition-all duration-700" 
                                style={{ width: `${hold.rsi}%`, backgroundColor: rsiData.color }} 
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[8px] font-semibold">
                              <span style={{ color: rsiData.color }}>RSI {hold.rsi.toFixed(0)}</span>
                              <span className={`text-[8px] font-bold ${hold.isUp ? 'text-green-400' : 'text-red-400'}`}>
                                {hold.isUp ? '▲' : '▼'}{Math.abs(hold.change).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Goal Progress Widget — Enhanced with projected completion */}
            <div className="card border border-white/5 animate-neon-pulse">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <div>
                  <h3 className="font-extrabold text-sm text-white">🎯 Savings Goals Progress</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Milestones synced from WealthMap · AI projected completion</p>
                </div>
                <Link to="/wealth" className="text-xs font-bold text-cyan-400 hover:underline">Manage →</Link>
              </div>
              <div className="space-y-5">
                {dashboardGoals.slice(0, 3).map((g) => {
                  const progress = Math.min(100, Math.round((g.current / g.target) * 100));
                  const remaining = g.target - g.current;
                  const currentYear = new Date().getFullYear();
                  const monthlySave = Math.max(1000, remaining / (Math.max(1, (g.deadlineYear - currentYear) * 12)));
                  return (
                    <div key={g.id} className="space-y-1.5 group">
                      <div className="flex justify-between items-baseline text-xs font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200">{g.name}</span>
                          <span className="text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded">{g.category}</span>
                        </div>
                        <span className="text-[10px] font-black" style={{ color: progress >= 80 ? '#34D399' : progress >= 50 ? '#A78BFA' : '#F59E0B' }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 animate-xp-shimmer" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>₹{g.current.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}</span>
                        <span className="text-violet-400 font-bold">≈ ₹{Math.round(monthlySave).toLocaleString('en-IN')}/mo needed</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Market Sector Heatmap Widget */}
            <div className="card border border-white/5">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                <h3 className="font-extrabold text-sm text-white">🌡️ Sector Heatmap</h3>
                <Link to="/trade" className="text-xs font-bold text-cyan-400 hover:underline">Trade →</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {sectors.map((s) => {
                  const clr = getSectorColor(s.pct);
                  const isHot = s.pct > 0;
                  return (
                    <div
                      key={s.name}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                        isHot ? 'animate-heatmap-hot' : 'animate-heatmap-cold'
                      }`}
                      style={{ background: clr.bg, border: `1px solid ${clr.border}` }}
                    >
                      <p className="text-[8px] font-black tracking-wide" style={{ color: clr.text }}>{s.name}</p>
                      <p className="text-[9px] font-bold mt-0.5" style={{ color: clr.text }}>
                        {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-600 mt-2 text-center font-mono">NSE Sector Performance</p>
            </div>

            {/* Recent Activity Feed with Modal details & Clear feed */}
            <div className="card border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-sm text-white">⏳ Recent Activity</h3>
                {activities.length > 0 && (
                  <button 
                    onClick={() => { setActivities([]); toast.success('Activity feed cleared'); }}
                    className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {activities.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedActivity(act)}
                      className="flex gap-3 text-xs cursor-pointer hover:bg-white/[0.02] p-1.5 rounded-lg border border-transparent hover:border-white/5 transition"
                      title="Click to view details"
                    >
                      <span className="text-lg shrink-0 mt-0.5">{act.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 leading-tight font-medium truncate">{act.text}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Stats, Streak, Sentiment, SIP, Live Market, Groups (1/3 width) */}
          <div className="space-y-6">

            {/* Daily Streak Motivational Widget */}
            <div className="card border border-orange-500/20 bg-gradient-to-br from-orange-950/20 to-amber-950/10 relative overflow-hidden">
              <div className="absolute right-3 top-3 text-4xl opacity-10 select-none">🔥</div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl animate-streak-fire">🔥</span>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-orange-400">Daily Streak</p>
                  <p className="text-2xl font-black text-white">{user?.currentStreak || 0} Days</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[9px] text-slate-500">Personal Best</p>
                  <p className="text-sm font-bold text-orange-300">{user?.longestStreak || user?.currentStreak || 0} days</p>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      i < (user?.currentStreak || 0) % 7 || (user?.currentStreak || 0) >= 7 
                        ? 'bg-orange-400' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-[9px] text-slate-500 mt-2">Keep going! Login daily to maintain your streak & earn bonus FinCoins 🪙</p>
            </div>

            {/* Wealth Loss Clock Widget */}
            <WealthLossClock />

            {/* Quick SIP Actions Widget */}
            <div className="card border border-violet-500/20 bg-gradient-to-br from-violet-950/10 to-slate-950/20">
              <h3 className="font-extrabold text-sm text-white mb-2 flex items-center gap-1.5">
                ⚡ Quick SIP Launcher
              </h3>
              <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                One-click allocate virtual cash directly into top mutual fund schemes.
              </p>
              <div className="space-y-2">
                {[
                  { name: 'Axis Bluechip Fund', code: '120465', amount: 1000 },
                  { name: 'SBI Small Cap Fund', code: '125497', amount: 2500 },
                  { name: 'Quant Active Fund', code: '120843', amount: 5000 }
                ].map((fund, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuickSip({ ...fund, nav: liveNavs[fund.code] || 0 })}
                    className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-violet-500/30 rounded-xl transition cursor-pointer text-left group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{fund.name}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Code: {fund.code} • NAV: {liveNavs[fund.code] ? `₹${liveNavs[fund.code].toFixed(2)}` : 'Loading...'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-cyan-400">₹{fund.amount.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Invest →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Sentiment Gauge Dial */}
            <div className="card border border-white/5">
              <h3 className="font-extrabold text-sm text-white mb-4">📈 Market Sentiment Gauge</h3>
              <div className="relative flex flex-col items-center">
                <svg viewBox="0 0 200 120" className="w-full max-h-36 mx-auto select-none">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#sentimentGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * sentimentData.score) / 100} />
                  <defs>
                    <linearGradient id="sentimentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F87171" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="5" fill="#FFF" />
                  <line 
                    x1="100" 
                    y1="100" 
                    x2="100" 
                    y2="28" 
                    stroke="#FFF" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    style={{
                      transform: `rotate(${(sentimentData.score / 100) * 180 - 90}deg)`,
                      transformOrigin: '100px 100px',
                      transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                  <text x="100" y="85" textAnchor="middle" className="fill-white text-base font-black font-sans">{sentimentData.score}</text>
                  <text x="100" y="98" textAnchor="middle" className="fill-emerald-400 text-[9px] font-black uppercase tracking-wider">{sentimentData.label}</text>
                  <text x="25" y="115" textAnchor="middle" className="fill-slate-500 text-[8px] font-bold">FEAR</text>
                  <text x="175" y="115" textAnchor="middle" className="fill-slate-500 text-[8px] font-bold">GREED</text>
                </svg>
                <div className="w-full flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl mt-3 text-[10px] font-bold font-mono">
                  <span className="text-slate-500">MARKET VIX: <span className="text-cyan-400">{sentimentData.vix}</span></span>
                  <span className="text-slate-500">SENTIMENT: <span className="text-green-400">{sentimentData.sentiment}</span></span>
                </div>
              </div>
            </div>

            {/* Live market ticker (Trending) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Live Market</h2>
                <Link to="/trade" className="text-cyan-400 text-sm hover:underline">View all →</Link>
              </div>
              <div className="card">
                {trending.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-3xl mb-2">📈</div>
                    <p>Loading market data...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trending.slice(0, 4).map((stock, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-medium text-sm text-white">{stock.name || stock.symbol}</p>
                          <p className="text-xs text-slate-400 font-mono">{stock.symbol}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white font-mono">₹{stock.price?.toFixed(2)}</p>
                          <p className={`text-xs ${stock.isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.isUp ? '▲' : '▼'} {Math.abs(stock.changePercent)?.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Your Groups */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Groups</h2>
                <Link to="/split" className="text-cyan-400 text-sm hover:underline">View all →</Link>
              </div>
              {groups.length === 0 ? (
                <div className="card text-center py-10">
                  <div className="text-4xl mb-3">💸</div>
                  <p className="text-slate-400 mb-4">No groups yet. Create one to start splitting!</p>
                  <Link to="/split">
                    <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                      Create Group
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {groups.slice(0, 3).map((group) => (
                    <Link key={group._id} to={`/split/group/${group._id}`}>
                      <div className="card hover:border-white/15 transition cursor-pointer">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{group.emoji || '👥'}</span>
                          <div>
                            <p className="font-bold">{group.name}</p>
                            <p className="text-xs text-slate-400">{group.members?.length} members</p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          group.myBalance > 0 ? 'text-green-400' :
                          group.myBalance < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {group.myBalance > 0 ? `+₹${group.myBalance.toFixed(0)} owed to you` :
                           group.myBalance < 0 ? `-₹${Math.abs(group.myBalance).toFixed(0)} you owe` :
                           '✅ All settled'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Badges */}
            {user?.badges?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Your Badges</h2>
                <div className="flex gap-2 flex-wrap">
                  {user.badges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                      <span>{badge.icon}</span>
                      <span className="text-xs font-semibold text-slate-300">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        <SectionGuide sectionId="/dashboard" />
      </main>

      {/* Activity Details Modal Popup */}
      {selectedActivity && (
        <div className="fixed inset-0 z-55 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="card w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedActivity.icon}</span>
                <h3 className="font-extrabold text-sm text-white">Activity Log Details</h3>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)} 
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-white font-extrabold">{selectedActivity.text}</p>
              <p className="text-slate-500 font-mono">Occurred: {selectedActivity.time}</p>
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-slate-300 font-medium leading-relaxed mt-2.5">
                {selectedActivity.details}
              </div>
            </div>
            <button 
              onClick={() => setSelectedActivity(null)} 
              className="btn-primary w-full py-2 font-bold cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    
    </div>
  );
};

export default Dashboard;

const WealthLossClock = () => {
  const [savingsAmount, setSavingsAmount] = useState(100000);
  const [inflationRate, setInflationRate] = useState(6.0);
  const [lostAmount, setLostAmount] = useState(0);

  useEffect(() => {
    setLostAmount(0);
    const lossPerSecond = (savingsAmount * (inflationRate / 100)) / (365 * 24 * 3600);
    const intervalMs = 50;
    const lossPerTick = lossPerSecond * (intervalMs / 1000);

    const timer = setInterval(() => {
      setLostAmount(prev => prev + lossPerTick);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [savingsAmount, inflationRate]);

  return (
    <div className="card border border-rose-500/20 bg-gradient-to-br from-rose-950/10 to-slate-950/20 relative overflow-hidden">
      <div className="absolute right-3 top-3 text-4xl opacity-10 select-none">⏰</div>
      <h3 className="font-extrabold text-sm text-white mb-1 flex items-center gap-1.5">
        📉 Wealth Loss Clock
      </h3>
      <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
        See how much your idle cash is losing to inflation (6% p.a.) in real-time.
      </p>
      
      {/* Animated Loss Ticker */}
      <div className="bg-black/35 border border-white/5 rounded-2xl p-3 text-center my-3">
        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Purchasing Power Lost</span>
        <div className="text-xl font-mono font-black text-rose-400 tracking-wider">
          ₹{lostAmount.toFixed(6)}
        </div>
        <span className="text-[8px] text-slate-500 block mt-1">Based on ₹{savingsAmount.toLocaleString('en-IN')} idle savings</span>
      </div>

      {/* Toggles and customization */}
      <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3 mt-2">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-500">Idle Cash</span>
          <input
            type="number"
            value={savingsAmount}
            onChange={(e) => setSavingsAmount(Math.max(0, parseInt(e.target.value) || 0))}
            className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] w-20 outline-none text-white focus:border-rose-500/50"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-500">Inflation</span>
          <select
            value={inflationRate}
            onChange={(e) => setInflationRate(parseFloat(e.target.value))}
            className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] w-14 outline-none text-white focus:border-rose-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="4.0">4%</option>
            <option value="6.0">6%</option>
            <option value="8.0">8%</option>
            <option value="10.0">10%</option>
          </select>
        </div>
        <Link to="/learn" className="shrink-0">
          <button className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-350 hover:text-rose-200 transition font-bold text-[9px] cursor-pointer">
            Beat Inflation 🛡️
          </button>
        </Link>
      </div>
    </div>
  );
};