// client/src/pages/LearnHub.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";

import GlossaryTab from "../components/learn/GlossaryTab";
import SurvivalMode from "../components/learn/SurvivalMode";
import QuizArena from "../components/learn/QuizArena";

import { defaultGlossary, GLOSSARY_FORMULAS, glossaryEnrichments } from "../data/glossaryData";
import { useLocation, useNavigate } from "react-router-dom";
import SectionGuide from "../components/common/SectionGuide";
/* import Sidebar removed */
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  Shield,
  HelpCircle,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Play,
  Award,
  Volume2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Info,
  Zap,
  Download,
  Target,
  Smile,
  Compass,
  Heart,
} from "lucide-react";

const multilingualUi = {
  en: {
    conceptHeader: "💡 The Concept Made Simple:",
    whyHeader: "📈 Why it protects your wealth:",
    analogyHeader: "🎓 AI Guru Story Analogy:",
    goalHeader: "🎯 Your Practical Practice Goal:",
    simulatorBadge: "⚡ Use Simulator Tools Below",
  },
  ta: {
    conceptHeader: "💡 எளிய விளக்கம் (Concept):",
    whyHeader: "📈 செல்வப் பாதுகாப்பு (Why it matters):",
    analogyHeader: "🎓 குருவின் உதாரணம் (Analogy):",
    goalHeader: "🎯 உங்களுக்கான பயிற்சி இலக்கு (Goal):",
    simulatorBadge: "⚡ கீழே உள்ள சிமுலேட்டரைப் பயன்படுத்தவும்",
  },
  tanglish: {
    conceptHeader: "💡 Concept Simple-a Chonna:",
    whyHeader: "📈 Wealth dynamic-a protect panna:",
    analogyHeader: "🎓 AI Guru Easy Story Analogy:",
    goalHeader: "🎯 Ungaloda Practice Goal Target:",
    simulatorBadge: "⚡ Use Simulator Tools Below",
  },
};


import {
  multilingualAcademy,
  lessonGlossaryMapping,
  MICROSCOPE_CONFIGS,
  getMicroscopeConfig,
  ACADEMY_LESSONS,
  DEFAULT_SURVIVAL_ROUNDS,
  isDerivative
} from "../data/academyData";

export {
  multilingualAcademy,
  lessonGlossaryMapping,
  MICROSCOPE_CONFIGS,
  getMicroscopeConfig,
  ACADEMY_LESSONS,
  DEFAULT_SURVIVAL_ROUNDS,
  isDerivative
};


const RpgRadarChart = ({ completedIds = [] }) => {
  const categories = [
    { name: "Foundations", icon: "🏛️", color: "#34D399" },
    { name: "Mutual Funds", icon: "💼", color: "#60A5FA" },
    { name: "Analysis", icon: "🔍", color: "#F87171" },
    { name: "Risk & Planning", icon: "⚖️", color: "#F59E0B" },
    { name: "Derivatives", icon: "⚡", color: "#A78BFA" }
  ];

  const getProgress = (catIdx) => {
    let catLessons = [];
    if (catIdx === 0) catLessons = ACADEMY_LESSONS.filter(l => l.stationId === 1);
    else if (catIdx === 1) catLessons = ACADEMY_LESSONS.filter(l => l.stationId === 2);
    else if (catIdx === 2) catLessons = ACADEMY_LESSONS.filter(l => l.stationId === 3);
    else if (catIdx === 3) catLessons = ACADEMY_LESSONS.filter(l => l.stationId === 4 && !isDerivative(l.title));
    else if (catIdx === 4) catLessons = ACADEMY_LESSONS.filter(l => l.stationId === 4 && isDerivative(l.title));

    if (catLessons.length === 0) return 0;
    const completedCount = catLessons.filter(l => completedIds.includes(l.id)).length;
    return completedCount / catLessons.length;
  };

  const getPoint = (i, factor = 1.0) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const x = 100 + 60 * factor * Math.cos(angle);
    const y = 100 + 60 * factor * Math.sin(angle);
    return { x, y };
  };

  const pentagons = [0.25, 0.5, 0.75, 1.0].map((factor, fIdx) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      const pt = getPoint(i, factor);
      points.push(`${pt.x},${pt.y}`);
    }
    return (
      <polygon
        key={`pent-${fIdx}`}
        points={points.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeDasharray={fIdx < 3 ? "2 2" : "none"}
      />
    );
  });

  const axes = [];
  for (let i = 0; i < 5; i++) {
    const pt = getPoint(i, 1.0);
    axes.push(
      <line
        key={`axis-${i}`}
        x1={100}
        y1={100}
        x2={pt.x}
        y2={pt.y}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    );
  }

  const userProgressPoints = [];
  for (let i = 0; i < 5; i++) {
    const p = Math.max(0.12, getProgress(i));
    const pt = getPoint(i, p);
    userProgressPoints.push(`${pt.x},${pt.y}`);
  }

  const dots = [];
  for (let i = 0; i < 5; i++) {
    const p = Math.max(0.12, getProgress(i));
    const pt = getPoint(i, p);
    const color = categories[i].color;
    dots.push(
      <g key={`dot-${i}`}>
        <circle cx={pt.x} cy={pt.y} r="3" fill={color} />
        <circle cx={pt.x} cy={pt.y} r="6" fill="none" stroke={color} strokeWidth="1" opacity="0.4" className="animate-pulse" />
      </g>
    );
  }

  const labelPositions = [
    { x: 100, y: 18, anchor: "middle", label: "Foundations 🏛️" },
    { x: 168, y: 76, anchor: "start", label: "M.Funds 💼" },
    { x: 148, y: 164, anchor: "start", label: "Analysis 🔍" },
    { x: 52, y: 164, anchor: "end", label: "Risk ⚖️" },
    { x: 32, y: 76, anchor: "end", label: "Derivs ⚡" }
  ];

  const textLabels = labelPositions.map((pos, i) => {
    const pct = Math.round(getProgress(i) * 100);
    return (
      <g key={`lbl-${i}`}>
        <text
          x={pos.x}
          y={pos.y}
          textAnchor={pos.anchor}
          fontSize="7.5"
          fontWeight="bold"
          fill="#94A3B8"
          className="select-none"
        >
          {pos.label}
        </text>
        <text
          x={pos.x}
          y={pos.y + 8}
          textAnchor={pos.anchor}
          fontSize="7"
          fontWeight="black"
          fill="#34D399"
          className="select-none"
        >
          {pct}%
        </text>
      </g>
    );
  });

  return (
    <svg width={200} height={200} viewBox="0 0 200 200" className="overflow-visible select-none">
      <defs>
        <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      {pentagons}
      {axes}
      <polygon
        points={userProgressPoints.join(" ")}
        fill="url(#radarGlow)"
        stroke="#A78BFA"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {dots}
      {textLabels}
    </svg>
  );
};

const LearnHub = () => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonActionCompleted, setLessonActionCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLang, setAudioLang] = useState("en");
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.05);
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [showAcademyPopover, setShowAcademyPopover] = useState(false);
  const [activeStation, setActiveStation] = useState(1);
  const [explain5yo, setExplain5yo] = useState(false);
  const [roadmapView, setRoadmapView] = useState("road");
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [selectedRoadLesson, setSelectedRoadLesson] = useState(null);
  const [devUnlockAll, setDevUnlockAll] = useState(true);
  const [termNews, setTermNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [srsCardFlipped, setSrsCardFlipped] = useState(false);
  const [newsPredictions, setNewsPredictions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("finbuddy_news_predictions")) || {};
    } catch (e) {
      return {};
    }
  });

  const getNewsImpactInfo = (term) => {
    const t = (term || '').toLowerCase();
    let correctAnswer = 'bullish';
    let explanation = "Understanding this term helps you capitalize on market opportunities and build wealth.";

    if (t.includes('cibil') || t.includes('credit score')) {
      correctAnswer = 'bullish';
      explanation = "Maintaining a high CIBIL score lowers your borrowing interest rates, keeping more cash in your portfolio for investments!";
    } else if (t.includes('inflation') || t.includes('cpi') || t.includes('wpi')) {
      correctAnswer = 'bearish';
      explanation = "Rising inflation erodes your cash purchasing power and forces the central bank to hike rates, cooling stock valuations.";
    } else if (t.includes('repo rate')) {
      correctAnswer = 'bearish';
      explanation = "A hike in the RBI repo rate increases borrowing costs for corporations and home loans, slowing down economic growth and equity markets.";
    } else if (t.includes('ipo')) {
      correctAnswer = 'bullish';
      explanation = "Strong IPO subscriptions signal robust investor sentiment and retail liquidity entering the capital market system.";
    } else if (t.includes('options') || t.includes('futures') || t.includes('derivative')) {
      correctAnswer = 'bearish';
      explanation = "High retail derivative volumes indicate excessive speculation. SEBI warns that unhedged trading leads to capital wipeouts.";
    } else if (t.includes('mutual fund') || t.includes('sip')) {
      correctAnswer = 'bullish';
      explanation = "Steady monthly SIP inflows act as a defensive cushion for domestic markets against foreign institutional selling.";
    } else if (t.includes('gold') || t.includes('sgb')) {
      correctAnswer = 'bullish';
      explanation = "Gold acts as a safe-haven hedge. During high inflation or market crashes, gold prices traditionally rise.";
    } else if (t.includes('pe ratio') || t.includes('valuation')) {
      correctAnswer = 'bearish';
      explanation = "Excessive P/E multiples suggest high growth expectations. If earnings do not catch up, it triggers valuation corrections.";
    } else if (t.includes('dividend') || t.includes('yield')) {
      correctAnswer = 'bullish';
      explanation = "Dividends supply direct cash flows to shareholders, validating real company profitability and bolstering safe compound returns.";
    } else if (t.includes('demat')) {
      correctAnswer = 'bullish';
      explanation = "A surge in new Demat accounts reflects rising financial inclusion and capital market adoption across India.";
    }

    return { correctAnswer, explanation };
  };

  const handlePredictImpact = (term, choice, correctOption) => {
    const isCorrect = choice === correctOption;
    const updated = {
      ...newsPredictions,
      [term]: { selected: choice, isCorrect }
    };
    setNewsPredictions(updated);
    localStorage.setItem("finbuddy_news_predictions", JSON.stringify(updated));

    if (isCorrect) {
      if (updateUser && user) {
        const newCoins = (user.virtualCoins || 0) + 5;
        updateUser({ virtualCoins: newCoins });
        api.put('/users/me', { virtualCoins: newCoins }).catch(() => {});
      }
      toast.success("Spot on! +5 Coins awarded. 🎯", { icon: "📈" });
    } else {
      toast.error("Incorrect prediction. Review the economics explanation! 💡", { icon: "📉" });
    }
  };

  const handleSRSCardAction = (term, gotIt) => {
    setSrsCardFlipped(false);
    updateSRSSchedule(term, gotIt);
    logStudyActivity("reviewed_term", term);
    toast.success(gotIt ? `Reviewed: ${term}! 🚀` : `Reset review for ${term}. 🔄`, { icon: gotIt ? "🟢" : "🔄" });
  };

  const getFrontendFallbackNews = (term) => {
    const t = (term || '').toLowerCase();
    let headline = `Dalal Street Buzzes as ${term} Becomes Hot Topic Among Retail Investors`;
    let source = "Dalal Street Chronicle";
    let summary = `Market experts note that understanding ${term} is crucial in the current volatile market cycle. Retail investors are advised to study its impact before making trading decisions.`;

    if (t.includes('cibil') || t.includes('credit score')) {
      headline = "SBI Alerts Borrowers: Keep CIBIL Score Above 750 or Pay Extra EMI on Loans!";
      source = "Mumbai Financial Express";
      summary = "State Bank of India announced that interest rates on home and car loans will now be directly linked to CIBIL scores. If your score is low, get ready to pay extra interest on your next EMI!";
    } else if (t.includes('inflation') || t.includes('cpi')) {
      headline = "RBI Governor Warns of Inflation Spikes Due to Onion & Tomato Price Surge!";
      source = "Namma Market Daily";
      summary = "As retail inflation (CPI) climbs, RBI might keep repo rates high. Retail investors should look at inflation-hedged assets like gold or index funds to protect their purchasing power.";
    } else if (t.includes('repo rate')) {
      headline = "RBI Holds Repo Rate Steady at 6.5%: EMIs Unchanged for Now!";
      source = "The Mint India";
      summary = "The Monetary Policy Committee decided to keep repo rates unchanged to balance growth and inflation. Safe investors are locking in higher yields on fixed deposits before bank rates drop.";
    } else if (t.includes('ipo')) {
      headline = "New Tech Startup IPO Subscribed 150x: Retail Frenzy Grips Dalal Street!";
      source = "Dalal Street Bulletin";
      summary = "A trending tech company's IPO saw massive retail interest, but analysts warn of high valuations. Remember to check if it's a multi-bagger or a speculative trap before subscribing.";
    } else if (t.includes('options') || t.includes('futures') || t.includes('derivative')) {
      headline = "SEBI Issues Red Flag: 9 out of 10 Retail Option Traders Lose Money on Expiry Day!";
      source = "Namma Bazaar News";
      summary = "The market regulator warns that option buying without hedging is a recipe for wealth loss. Retail traders are urged to study Option Greeks (Theta decay, Delta) before writing puts.";
    } else if (t.includes('mutual fund') || t.includes('sip')) {
      headline = "Indian Retail Investors Flow ₹20,000 Crore into SIPs in a Single Month!";
      source = "Bazaars of India";
      summary = "Despite stock market volatility, long-term investors are compounding their wealth through disciplined monthly mutual fund investments. Consistent SIPs help average out market swings.";
    } else if (t.includes('gold') || t.includes('sgb')) {
      headline = "RBI Announces New Sovereign Gold Bond (SGB) Series with 2.5% Annual Interest!";
      source = "Gold Rate Express";
      summary = "Investors are rushing to buy digital gold via SGBs to lock in interest payouts and tax-free capital gains. A perfect hedge against inflation and equity market corrections!";
    } else if (t.includes('pe ratio') || t.includes('valuation')) {
      headline = "Nifty 50 P/E Ratio Crosses 24: Are Indian Markets Getting Too Expensive?";
      source = "Dalal Street Analysis";
      summary = "High valuation multiples have made investors cautious about large-cap stocks. Analysts suggest comparing enterprise values and DuPont metrics before buying the dip.";
    } else if (t.includes('dividend') || t.includes('yield')) {
      headline = "ITC Announces Special Dividend: Retail Shareholders Rejoice Over 'Cigarette & Ashirvaad Atta' Cash Flow!";
      source = "Kolkata Market Chronicle";
      summary = "ITC continues its high dividend payout streak, offering attractive dividend yields. Safe income investors are reinvesting their cash payouts to compound holdings.";
    } else if (t.includes('demat')) {
      headline = "Zerodha & Groww Cross 15 Million Demat Accounts as Young India Rushes to Invest!";
      source = "FinTech Dispatch";
      summary = "Creating digital accounts is now instant via e-KYC. However, new account holders are advised to avoid penny stocks and leverage traps, and focus on solid Blue Chip shares.";
    }

    return {
      headline,
      source,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      summary,
      cachedAt: new Date().toDateString()
    };
  };

  const fetchTermNews = async (term) => {
    if (!term) return;
    setNewsLoading(true);
    setTermNews(null);
    const cacheKey = "finbuddy_news_cache";
    try {
      const cachedData = JSON.parse(localStorage.getItem(cacheKey)) || {};
      const todayStr = new Date().toDateString();
      if (cachedData[term] && cachedData[term].cachedAt === todayStr) {
        setTermNews(cachedData[term]);
        setNewsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Error reading news cache:", e);
    }
    try {
      const res = await api.post('/learn/term-news', { term });
      if (res.data && res.data.success) {
        const newsItem = {
          headline: res.data.headline,
          source: res.data.source,
          date: res.data.date,
          summary: res.data.summary,
          cachedAt: new Date().toDateString()
        };
        setTermNews(newsItem);
        const cachedData = JSON.parse(localStorage.getItem(cacheKey)) || {};
        cachedData[term] = newsItem;
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      }
    } catch (err) {
      console.error("Failed to fetch term news, using local generator:", err);
      const fallback = getFrontendFallbackNews(term);
      setTermNews(fallback);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeLesson) {
      const lessonTerms = lessonGlossaryMapping[activeLesson.id] || [];
      if (lessonTerms.length > 0) {
        fetchTermNews(lessonTerms[0]);
      } else {
        fetchTermNews(activeLesson.title);
      }
    } else {
      setTermNews(null);
    }
  }, [activeLesson]);

  // ── DB-Backed Progress Sync ──────────────────────────────
  const progressRestoredRef = useRef(false);

  // Restore lesson progress from DB on mount (cross-device resume)
  useEffect(() => {
    if (progressRestoredRef.current) return;
    progressRestoredRef.current = true;
    const restoreProgress = async () => {
      try {
        const { data } = await api.get('/mentor/learn-progress');
        if (data.success) {
          // Restore station
          if (data.lastActiveStation && data.lastActiveStation !== 1) {
            setActiveStation(data.lastActiveStation);
          }
          // Restore active lesson (find the full lesson object from ACADEMY_LESSONS)
          if (data.lastActiveLessonId) {
            const lessonObj = ACADEMY_LESSONS.find(l => l.id === data.lastActiveLessonId);
            if (lessonObj) {
              setActiveLesson(lessonObj);
              toast(`📚 Resuming: "${lessonObj.title}" — pick up where you left off!`, {
                icon: '🔖', duration: 3500
              });
            }
          }
          // Sync completions & chests from server (authoritative)
          if (updateUser && user) {
            const updates = {};
            if (data.lessonsCompleted?.length) updates.lessonsCompleted = data.lessonsCompleted;
            if (data.claimedChests?.length) updates.claimedChests = data.claimedChests;
            if (Object.keys(updates).length) updateUser(updates);
          }
        }
      } catch (e) {
        // Silently fail — no progress to restore
      }
    };
    restoreProgress();
  }, []);

  // Auto-save active lesson to DB when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      api.post('/mentor/learn-progress', {
        lessonId: activeLesson?.id || null
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeLesson?.id]);

  // Auto-save active station to DB when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      api.post('/mentor/learn-progress', {
        stationId: activeStation
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeStation]);

  const [activeLessonContent, setActiveLessonContent] = useState(null);

  useEffect(() => {
    if (!activeLesson) {
      setActiveLessonContent(null);
      return;
    }

    let active = true;
    const fromDict = multilingualAcademy[audioLang]?.[activeLesson.id];
    const initial = fromDict || getDynamicLessonContent(activeLesson, audioLang);
    setActiveLessonContent(initial);

    const fetchContent = async () => {
      try {
        const res = await api.post("/learn/lesson-content", {
          lessonId: activeLesson.id,
          title: activeLesson.title,
          lang: audioLang
        });
        if (active && res.data && res.data.concept) {
          setActiveLessonContent({
            concept: res.data.concept,
            whyMatters: res.data.whyMatters,
            analogy: res.data.analogy,
            actionGoal: res.data.actionGoal
          });
        }
      } catch (e) {
        // Fallback already set
      }
    };
    fetchContent();
    return () => {
      active = false;
    };
  }, [activeLesson, audioLang]);
  const [claimedChests, setClaimedChests] = useState(() => {
    try {
      const saved = localStorage.getItem("finbuddy_claimed_chests");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeStoryNode, setActiveStoryNode] = useState(null);
  const [selectedStoryOption, setSelectedStoryOption] = useState(null);
  const [storySuccess, setStorySuccess] = useState(false);
  const [activeSideQuestNode, setActiveSideQuestNode] = useState(null);
  const [sideQuestStep, setSideQuestStep] = useState(0);
  const [sideQuestAnswers, setSideQuestAnswers] = useState([]);
  const [sideQuestSuccess, setSideQuestSuccess] = useState(false);

  const [storyLoading, setStoryLoading] = useState(false);
  const [storyData, setStoryData] = useState(null);
  const [sideQuestLoading, setSideQuestLoading] = useState(false);
  const [sideQuestQuestions, setSideQuestQuestions] = useState([]);

  useEffect(() => {
    if (!activeStoryNode) {
      setStoryData(null);
      return;
    }
    const fetchStory = async () => {
      setStoryLoading(true);
      try {
        const { data } = await api.post("/learn/lesson-story", {
          lessonId: activeStoryNode.id,
          title: activeStoryNode.title,
          lang: audioLang || "en"
        });
        if (data.success) {
          setStoryData(data);
        } else {
          toast.error("Failed to generate custom story. Using local fallback.");
        }
      } catch (err) {
        console.error("Story fetch error", err);
      } finally {
        setStoryLoading(false);
      }
    };
    fetchStory();
  }, [activeStoryNode, audioLang]);

  useEffect(() => {
    if (!activeSideQuestNode) {
      setSideQuestQuestions([]);
      return;
    }
    const fetchSideQuest = async () => {
      setSideQuestLoading(true);
      try {
        const { data } = await api.post("/learn/sidequest", {
          stationId: activeSideQuestNode.stationId,
          lang: audioLang || "en"
        });
        if (data.success && data.questions) {
          setSideQuestQuestions(data.questions);
        } else {
          toast.error("Failed to generate side quest. Using fallback.");
        }
      } catch (err) {
        console.error("Sidequest fetch error", err);
      } finally {
        setSideQuestLoading(false);
      }
    };
    fetchSideQuest();
  }, [activeSideQuestNode, audioLang]);
  
  // Wealth Loss Clock States
  const [savingsAmount, setSavingsAmount] = useState(100000);
  const [lostWealth, setLostWealth] = useState(0);

  // Financial DNA Onboarding States
  const [financialDna, setFinancialDna] = useState(localStorage.getItem("financialDna") || null);
  const [showDnaModal, setShowDnaModal] = useState(!localStorage.getItem("financialDna"));
  const [dnaStep, setDnaStep] = useState(1);
  const [dnaAnswers, setDnaAnswers] = useState([]);

  useEffect(() => {
    if (user) {
      if (user.financialDna) {
        setFinancialDna(user.financialDna);
        setShowDnaModal(false);
      } else {
        const localDna = localStorage.getItem("financialDna");
        if (localDna) {
          setFinancialDna(localDna);
          setShowDnaModal(false);
          api.put('/users/me', { financialDna: localDna }).catch(e => {});
        } else {
          setShowDnaModal(true);
        }
      }
      
      if (user.claimedChests && user.claimedChests.length > 0) {
        setClaimedChests(user.claimedChests);
      } else {
        const localChests = localStorage.getItem("finbuddy_claimed_chests");
        if (localChests) {
          try {
            const parsed = JSON.parse(localChests);
            if (parsed && parsed.length > 0) {
              setClaimedChests(parsed);
              api.put('/users/me', { claimedChests: parsed }).catch(e => {});
            }
          } catch(e) {}
        }
      }
    }
  }, [user]);



































  // Certificate & Ticker States
  const [certName, setCertName] = useState("");
  const [tickerData, setTickerData] = useState([
    { symbol: "NIFTY 50", price: 22345.50, change: 0.45, isUp: true },
    { symbol: "SENSEX", price: 73560.10, change: 0.38, isUp: true },
    { symbol: "GOLD (24K)", price: 72400.00, change: -0.12, isUp: false },
    { symbol: "RELIANCE", price: 2920.45, change: 1.15, isUp: true },
    { symbol: "HDFC BANK", price: 1510.20, change: -0.42, isUp: false }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.5) * 0.15;
          const newPrice = item.price * (1 + delta / 100);
          const newChange = item.change + delta;
          return {
            ...item,
            price: Number(newPrice.toFixed(2)),
            change: Number(newChange.toFixed(2)),
            isUp: delta >= 0
          };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const downloadCertificate = (userName, certTitle) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // 2. Borders & Corner Ornaments
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 560);
    
    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 540);

    // 3. Ornaments
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(20, 20, 30, 6);
    ctx.fillRect(20, 20, 6, 30);
    ctx.fillRect(750, 20, 30, 6);
    ctx.fillRect(774, 20, 6, 30);
    ctx.fillRect(20, 574, 30, 6);
    ctx.fillRect(20, 550, 6, 30);
    ctx.fillRect(750, 574, 30, 6);
    ctx.fillRect(774, 550, 6, 30);

    // 4. Certificate Text
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "900 32px sans-serif";
    ctx.fillText("CERTIFICATE OF MASTERY", 400, 120);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "italic 16px sans-serif";
    ctx.fillText("This is proudly presented to", 400, 180);

    ctx.fillStyle = "#38bdf8"; // cyan-400
    ctx.font = "900 36px sans-serif";
    ctx.fillText(userName.toUpperCase() || "FINBUDDY SCHOLAR", 400, 240);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "16px sans-serif";
    ctx.fillText(`for successfully completing the Advanced curriculum in`, 400, 300);

    ctx.fillStyle = "#fbbf24"; // gold
    ctx.font = "900 24px sans-serif";
    ctx.fillText(certTitle.toUpperCase(), 400, 350);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "13px sans-serif";
    ctx.fillText("Under the instruction of FinGuru AI Advisor & Mentor", 400, 400);

    // 5. Seal
    ctx.beginPath();
    ctx.arc(400, 480, 35, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("VERIFIED", 400, 475);
    ctx.fillText("CREDENTIAL", 400, 488);

    // Date
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 150, 500);

    // Signature
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(600, 490);
    ctx.lineTo(700, 490);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "11px monospace";
    ctx.fillText("SIGNATURE (FINGURU)", 650, 510);
    ctx.font = "italic 16px cursive";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("FinGuru AI", 650, 480);

    // Download trigger
    const link = document.createElement("a");
    link.download = `certificate_${certTitle.toLowerCase().replace(/ /g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Certificate downloaded successfully! 🎓📜");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // 3% net loss rate (6% inflation - 3% bank interest)
      // loss per second = savings * 0.03 / (365 * 24 * 3600)
      const lossPerSecond = (savingsAmount * 0.03) / (365 * 24 * 3600);
      setLostWealth((prev) => prev + (lossPerSecond * 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, [savingsAmount]);

  const dnaQuestions = [
    {
      q: "If the stock market crashes 20% tomorrow, what would you do?",
      options: [
        { text: "A) Panic-sell everything to save my cash", type: "conservative" },
        { text: "B) Hold steady and wait for it to recover", type: "moderate" },
        { text: "C) Buy more stocks at a huge discount!", type: "aggressive" }
      ]
    },
    {
      q: "What is your primary goal for your savings?",
      options: [
        { text: "A) Keep it 100% safe and protect my principal capital", type: "conservative" },
        { text: "B) Balance growth and safety with a diversified mix", type: "moderate" },
        { text: "C) Grow it aggressively and beat inflation by a mile", type: "aggressive" }
      ]
    },
    {
      q: "How long can you lock away your money without needing it?",
      options: [
        { text: "A) Less than 2 years (highly liquid)", type: "conservative" },
        { text: "B) 3 to 5 years (moderate timeframe)", type: "moderate" },
        { text: "C) 10+ years (long-term wealth-building)", type: "aggressive" }
      ]
    },
    {
      q: "If your portfolio loses 10% in a week, how would you feel?",
      options: [
        { text: "A) Stressed out, checking prices every hour", type: "conservative" },
        { text: "B) Calm, knowing volatility is normal in investing", type: "moderate" },
        { text: "C) Excited because assets are cheaper to acquire", type: "aggressive" }
      ]
    },
    {
      q: "Which of these concepts appeals to you most?",
      options: [
        { text: "A) Sovereign Government Guarantee", type: "conservative" },
        { text: "B) Diversified Mutual Funds", type: "moderate" },
        { text: "C) Exponential Options & Crypto Compounding", type: "aggressive" }
      ]
    }
  ];

  const handleSelectDnaAnswer = (type) => {
    const newAnswers = [...dnaAnswers, type];
    setDnaAnswers(newAnswers);
    if (dnaStep < 5) {
      setDnaStep((prev) => prev + 1);
    } else {
      const counts = newAnswers.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      
      let archetype = "⚖️ The Balanced Builder";
      if ((counts.conservative || 0) > (counts.moderate || 0) && (counts.conservative || 0) > (counts.aggressive || 0)) {
        archetype = "🛡️ The Safe Saver";
      } else if ((counts.aggressive || 0) > (counts.moderate || 0) && (counts.aggressive || 0) > (counts.conservative || 0)) {
        archetype = "🚀 The Risk Taker";
      }
      
      localStorage.setItem("financialDna", archetype);
      setFinancialDna(archetype);
      setShowDnaModal(false);
      toast.success(`DNA Match: You are ${archetype}! 🧠`, { duration: 5000 });
      api.put('/users/me', { financialDna: archetype })
        .then(res => {
          if (updateUser) updateUser({ financialDna: archetype });
        })
        .catch(e => {});
      
      if (archetype === "🛡️ The Safe Saver") {
        setRiskTolerance("conservative");
        setExpectedReturn(8);
      } else if (archetype === "🚀 The Risk Taker") {
        setRiskTolerance("aggressive");
        setExpectedReturn(18);
      } else {
        setRiskTolerance("moderate");
        setExpectedReturn(12);
      }
    }
  };

  const renderWithGlossaryLinks = (text, onTermClick) => {
    if (!text || !glossary.length) return text;
    const sortedTerms = [...glossary].map(g => g.term).sort((a, b) => b.length - a.length);
    const escapedTerms = sortedTerms.map(t => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      const matchedTerm = glossary.find(g => g.term.toLowerCase() === part.toLowerCase());
      if (matchedTerm) {
        return (
          <span
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onTermClick(matchedTerm.term);
            }}
            className="cursor-pointer border-b border-dashed border-cyan-400 text-cyan-300 hover:text-cyan-200 transition-colors font-extrabold"
            style={{ textShadow: "0 0 8px rgba(34, 211, 238, 0.4)" }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

    const getDynamicLessonContent = (lesson, lang) => {
    const title = lesson.title || "Specialized Topic";
    const t = title.toLowerCase();

    // Default English Templates
    let enConcept = `Learn the core mechanics, functions, and key drivers of ${title} in the modern financial ecosystem.`;
    let enWhy = `Understanding ${title} is crucial for optimizing your wealth allocation, mitigating unnecessary risks, and maximizing long-term compound interest.`;
    let enAnalogy = `Think of ${title} as a specialized tool in your financial toolbox—using it correctly helps you build your wealth tower faster and safer.`;
    let enGoal = `Complete the interactive lesson modules and track how ${title} impacts your overall FinScore.`;

    // Dynamic customization based on keywords
    if (t.includes("de-fi")) {
      enConcept = "Decentralized Finance (DeFi) replaces traditional banks with automated smart contracts on a blockchain.";
      enWhy = "Enables borrowing, lending, and yield earning globally without middlemen or bank approvals.";
      enAnalogy = "Automated Bank: Like a smart vending machine that lends you cash or pays you interest automatically without any bank manager.";
      enGoal = "Audit decentralized protocol yields and understand smart contract liquidation thresholds.";
    } else if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
      enConcept = "WPI measures price changes at the wholesale level (factory gate), while CPI tracks what retail consumers actually pay.";
      enWhy = "Directly impacts interest rate policies set by the RBI and determines real purchasing power erosion.";
      enAnalogy = "Two Thermometers: WPI is like measuring the temperature in the bakery's oven; CPI is measuring how hot the bread is when you buy it.";
      enGoal = "Compare historical CPI trends and adjust your portfolio to maintain positive real rate of return.";
    } else if (t.includes("87a") || t.includes("tax")) {
      enConcept = "Tax laws like Section 87A offer complete tax rebates for individuals with income below specified thresholds (e.g. ₹7 Lakhs).";
      enWhy = "Allows young professionals and students to legally reduce their net income tax liability to zero.";
      enAnalogy = "Free Pass: Like a special coupon that waives your entire bill at the checkout counter if your cart value is under the limit.";
      enGoal = "Calculate tax slabs and check eligibility for the New Tax Regime rebate limits.";
    } else if (t.includes("114") || t.includes("144")) {
      enConcept = "The Rule of 114 shows how long it takes to triple your money, and the Rule of 144 calculates how long it takes to quadruple it.";
      enWhy = "Provides rapid mental math to evaluate investment speeds without complex Excel log formulas.";
      enAnalogy = "Speedometer: If you earn a 12% annual return, dividing 114 by 12 shows your money triples in just 9.5 years!";
      enGoal = "Compare compounding speeds of assets using rules 72, 114, and 144.";
    } else if (t.includes("gold bonds") || t.includes("sgb") || t.includes("etfs")) {
      enConcept = "Sovereign Gold Bonds (SGBs) pay 2.5% fixed interest p.a. with tax-free gains, while Gold ETFs offer high liquidity on exchanges.";
      enWhy = "Helps build a portfolio hedge against inflation without paying storage or making charges.";
      enAnalogy = "Paper Gold: Like owning a certificate of ownership for a gold bar in a bank vault, instead of hiding heavy jewelry under your mattress.";
      enGoal = "Simulate gold price movements and allocate gold assets to buffer stock market corrections.";
    } else if (t.includes("epf") || t.includes("ppf")) {
      enConcept = "EPF is a salary-deducted retirement fund with employer matching, whereas PPF is a voluntary tax-free savings scheme open to all.";
      enWhy = "Provides high, tax-exempt risk-free debt yields backed by the government of India.";
      enAnalogy = "Safe Vault: Like a locked treasure box that guarantees safety and grows steadily, completely immune to stock market storms.";
      enGoal = "Model long-term PPF compounding schedules and calculate annual tax savings under Section 80C.";
    } else if (t.includes("liquid") || t.includes("fd")) {
      enConcept = "Liquid Funds invest in short-term debt instruments (under 91 days) providing instant redemption, unlike locked FDs.";
      enWhy = "Ensures your emergency cash yields more than a standard savings account while remaining fully accessible.";
      enAnalogy = "Tap Water vs Ice: FDs are like locked blocks of ice; Liquid Funds are like tap water that you can drink instantly whenever you are thirsty.";
      enGoal = "Optimize cash drag by allocating idle wallet balances into instant-redemption liquid funds.";
    } else if (t.includes("beta")) {
      enConcept = "Beta measures a stock's volatility relative to the broader market index (Nifty 50). A Beta of 1.5 moves 50% more than the index.";
      enWhy = "Crucial for controlling portfolio risk; high-beta stocks rally faster in bull markets but crash harder during corrections.";
      enAnalogy = "Rollercoaster: High-beta is like riding the tallest rollercoaster with massive loops; low-beta is like a calm train ride.";
      enGoal = "Scan stock volatility parameters and balance high-beta equity with low-beta defensive allocations.";
    } else if (t.includes("alpha")) {
      enConcept = "Alpha measures the excess return of an investment relative to the return of a benchmark index.";
      enWhy = "Indicates whether an active fund manager is actually delivering value or charging high fees for index performance.";
      enAnalogy = "Star Player: Like a striker who scores extra goals beyond the team average—representing true outperformance.";
      enGoal = "Analyze mutual fund returns and identify active schemes that consistently generate positive Alpha.";
    } else if (t.includes("growth vs value")) {
      enConcept = "Growth style focuses on high-revenue expanding companies, while Value style targets undervalued bargain companies.";
      enWhy = "Allows style diversification to balance portfolio performance across different macroeconomic cycles.";
      enAnalogy = "Tesla vs Utility: Growth is like buying a futuristic tech start-up; Value is like buying a steady power company at a discount.";
      enGoal = "Construct a diversified portfolio split between growth stocks and value opportunities.";
    } else if (t.includes("reit") || t.includes("invit")) {
      enConcept = "REITs pool investor money to own rent-yielding commercial properties, while InvITs own infrastructure projects like toll roads.";
      enWhy = "Enables fractional real estate investing with small ticket sizes, yielding regular quarterly distributions.";
      enAnalogy = "Landlord Share: Like buying one brick of a prime office building and receiving a tiny slice of the monthly rent check.";
      enGoal = "Calculate rental yield distribution models and add high-yield REITs to your assets table.";
    } else if (t.includes("arbitrage")) {
      enConcept = "Arbitrage exploits temporary price differences of the same stock across different markets (like BSE and NSE).";
      enWhy = "Generates low-risk, tax-efficient returns by locking in risk-free price spreads.";
      enAnalogy = "Market Gap: Buying apples at a village market for ₹10 and instantly selling them to a town merchant for ₹12.";
      enGoal = "Detect pricing spreads between cash and futures markets to lock in spreads.";
    } else if (t.includes("smallcase") || t.includes("multi-asset")) {
      enConcept = "Smallcases are pre-packaged thematic stock portfolios, while Multi-Asset allocations spread capital across equity, debt, and gold.";
      enWhy = "Simplifies portfolio building by tracking expert-curated trends (e.g. green energy, digital India) in one click.";
      enAnalogy = "Ready-made Meal: Instead of buying raw ingredients and cooking (stock picking), you buy a curated recipe box from a chef.";
      enGoal = "Invest virtual capital into diversified multi-asset models to withstand sector rotations.";
    } else if (t.includes("debt to equity") || t.includes("debt-to-equity")) {
      enConcept = "The Debt-to-Equity ratio measures a company's financial leverage by dividing its total liabilities by shareholder equity.";
      enWhy = "Exposes company solvency risk; high ratio companies are highly vulnerable to interest rate spikes and bankruptcy.";
      enAnalogy = "Borrowed Car: If you buy a ₹10 Lakh car with ₹9 Lakh loan, your leverage is high. A small crash can ruin your equity!";
      enGoal = "Perform stress-tests on high-debt companies to assess bankruptcy risks.";
    } else if (t.includes("return on equity") || t.includes("roe") || t.includes("roce")) {
      enConcept = "ROE measures profitability relative to shareholder equity, while ROCE evaluates returns on both equity and debt capital employed.";
      enWhy = "Reveals how efficiently a company's management is allocating capital to generate net profits.";
      enAnalogy = "Engine Efficiency: Like measuring how many miles a car runs per liter of fuel—higher ROE/ROCE means a superior machine.";
      enGoal = "Compare capital efficiency metrics across competing companies in the NSE database.";
    } else if (t.includes("free cash flow") || t.includes("fcf")) {
      enConcept = "Free Cash Flow is the cash left over after a company pays for operating expenses and capital expenditures (CapEx).";
      enWhy = "Represents true, unmanipulated cash available to pay dividends, pay down debt, or buy back shares.";
      enAnalogy = "Pocket Money: Net profit is what you boast on paper; Free Cash Flow is the actual cash left in your pocket after paying all bills.";
      enGoal = "Verify whether a company's accounting earnings are backed by positive operational cash flows.";
    } else if (t.includes("pledging") || t.includes("related party") || t.includes("resignations")) {
      enConcept = "Corporate red flags include promoters pledging shares for loans, related party cash transfers, and sudden auditor resignations.";
      enWhy = "Provides early warning indicators of potential balance sheet accounting frauds and promoter default risks.";
      enAnalogy = "Smoke Alarm: An auditor resigning is like a fire alarm going off in a building—don't wait to see the fire, exit immediately!";
      enGoal = "Scan corporate governance logs and audit promoters' pledged shares percentage.";
    } else if (t.includes("dupont")) {
      enConcept = "DuPont Analysis decomposes Return on Equity (ROE) into Profit Margin, Asset Turnover, and Financial Leverage.";
      enWhy = "Helps investors determine if a high ROE is driven by high profitability, efficient sales, or high-risk debt.";
      enAnalogy = "Engine Diagnostic: Breaking down a car's speed into aerodynamics, fuel quality, and gear ratio to spot where the power comes from.";
      enGoal = "Deconstruct ROE into its three components to audit company earnings drivers.";
    } else if (t.includes("delta") || t.includes("gamma") || t.includes("theta") || t.includes("vega") || t.includes("greek")) {
      enConcept = "Option Greeks measure option price sensitivities to stock price shifts (Delta), acceleration (Gamma), time decay (Theta), and volatility (Vega).";
      enWhy = "Essential for options traders to manage risk exposure, hedge portfolios, and predict price changes.";
      enAnalogy = "Dashboard Gauges: Like the speed, RPM, battery charge, and engine temperature dials on a sports car dashboard.";
      enGoal = "Analyze option sensitivity metrics before executing high-leverage option spreads.";
    } else if (t.includes("spread") || t.includes("butterfly") || t.includes("condor")) {
      enConcept = "Option spreads combine buying and writing options to define max losses and income ranges upfront.";
      enWhy = "Mitigates the extreme volatility risks of options trading and generates steady weekly cash flows.";
      enAnalogy = "Fenced Playpen: Instead of wandering in the open wild (unlimited risk), you build fences to define your exact play area.";
      enGoal = "Execute defined-risk credit spreads to collect option premiums safely.";
    } else if (t.includes("iv crush") || t.includes("volatility")) {
      enConcept = "Implied Volatility (IV) Crush is the rapid drop in option premiums immediately following a major event (e.g. corporate earnings).";
      enWhy = "Prevents buying overpriced options right before events, when premium values are inflated.";
      enAnalogy = "Balloon Pop: Volatility inflates options like a balloon; once the event passes, the balloon pops and options lose value instantly.";
      enGoal = "Simulate IV drops on options pricing and learn volatility writing strategies.";
    }

    // Dynamic Tamil Translations
    if (lang === "ta") {
      return {
        concept: `${title} என்பது முதலீட்டு மற்றும் நிதி மேலாண்மையில் ஒரு முக்கியமான கோட்பாடாகும். இது உங்கள் நிதி முடிவுகளை மேம்படுத்தும்.`,
        whyMatters: `உங்கள் சேமிப்பை அதிகரிக்கவும், தேவையற்ற நஷ்டங்களைத் தவிர்க்கவும் ${title} பற்றிய புரிதல் மிகவும் அவசியம்.`,
        analogy: `இது உங்கள் பணத்தை பாதுகாப்பாக வளர்க்க உதவும் ஒரு ஸ்மார்ட் டூல் போன்றது.`,
        actionGoal: `கீழே உள்ள சிமுலேட்டரை இயக்கி ${title}-ன் தாக்கத்தை ஆராய்ந்து உங்கள் அறிவை சோதிக்கவும்.`
      };
    }

    // Dynamic Tanglish Translations
    if (lang === "tanglish") {
      return {
        concept: `${title} romba important personal finance mechanism. Ithu namma portfolio value build panna help pannum.`,
        whyMatters: `Taxes optimize panna and losses reduce panna ithu helpful-ah irukum.`,
        analogy: `Ithu namma wealth journey-la oru smart accelerator mathiri. Correct-ah use panna steady returns kidaikkum.`,
        actionGoal: `Simulator run panni ${title} evaluate pannunga to increase your FinScore.`
      };
    }

    // English Fallback
    return {
      concept: enConcept,
      whyMatters: enWhy,
      analogy: enAnalogy,
      actionGoal: enGoal
    };
  };

  const getSimpleExplanation = (lessonId, lang) => {
    const tanglishSimples = {
      l1: "Oru periya pizza-la oru slice vangura mathiri. Pizza shop famous aana unga slice value perusagum!",
      l2: "Compounding na oru seed podradhu. Seed maram aagi, maram neriya seeds tharum. Konja naal la oru periya forest-e valarum!",
      l3: "P/E ratio na oru bommai price tag pakuradhu. Bommai cost ₹100 but fun value ₹1 na, expensive!",
      l4: "Index na oru basket-la 50 nalla fruits vangaradhu, single apple-ku badhila. Oru apple azhugi ponaalum 49 safe!",
      l5: "Balance sheet na unga toys (assets) vs unga friends kitta borrow panni return panna vendiya toys (liabilities).",
      l6: "Section 80C na oru tax discount coupon. Government ungakitta irundhu ₹45,000 varusham full-a edukama safe pannum!",
      l7: "Crypto na digital stickers swap panra mathiri. Yaarum copy/steal panna mudiyathu complex global math system valiya.",
      l8: "Emergency fund na backup kudai. Rain (job loss or medical bill) vantha nanaiyama protect pannum.",
      l9: "Options na oru toy car-a daily rent panni buy panna promise panradhu. Car price yerina super profit!",
      l10: "Diversification na ella muttai-um ore basket-la vekkatha. Basket vilundha breakfast complete loss aayidum!",
      l11: "Inflation na daily night unga cheese-a saapdura chinna mouse. Mouse-a vida unga cheese fast-a grow pannanum!",
      l45: "UPI na magic portal. Cash tharama, phone scan panni oru second-la toy box coins-a mathavangaluku zap panradhu!",
      l46: "Needs na thanni, saapadu (must to survive). Wants na chocolate cookies, double cheese toppings (nice to have, but not mandatory).",
      l47: "Credit score na toys share panel school report card. Correct time-la return panna ellarum happy-ah next time-um lend pannuvaanga!",
      l48: "Debt snowball na chinna size snowball-a hill-la roll panradhu. First chinna debts clear panni momentum build pannuvom.",
      l73: "DeFi na manager illatha bank computer code. 24/7 automatic lending and borrowing run aagum!",
      l74: "WPI na factory temperature, CPI na dinner plate heat. WPI first hot aagum, CPI konjam late-ah follow pannum.",
    };
    const englishSimples = {
      l1: "Imagine buying one slice of a giant pizza (a company). If the pizza shop gets super famous, your slice is worth way more!",
      l2: "Compounding is like planting a seed that grows a tree. The tree drops seeds, growing more trees. Soon you have a whole forest!",
      l3: "P/E ratio is like checking a toy's price tag. If a toy costs ₹100 but only gives you ₹1 fun, it's too expensive!",
      l4: "Index is like buying a fruit basket of 50 top fruits instead of one apple. If one apple is rotten, you still have 49 good fruits!",
      l5: "A balance sheet is like a list of your toys (assets) vs the toys you borrowed from friends that you must give back (liabilities).",
      l6: "Section 80C is like a coupon code for your taxes. It saves you up to ₹45,000 every year from being taken by the government!",
      l7: "Crypto is like trading rare digital sticker cards. Nobody can copy or steal them because of a secure global math system.",
      l8: "Emergency fund is like a backup umbrella. If it rains (job loss or medical bill), you don't get wet or have to sell your toys.",
      l9: "Options are like renting a toy car for a day with a promise to buy it. If the car gets popular, you win!",
      l10: "Diversification is never putting all your eggs in one basket. If the basket drops, you don't lose all your breakfast!",
      l11: "Inflation is a sneaky mouse that eats a tiny bite of your cheese (money) every night. You must grow your cheese faster than the mouse eats!",
      l45: "UPI is like a magic portal. Instead of handing cash, you instantly zap coins directly from your toy box to theirs using a phone scan!",
      l46: "Needs are like water and food (must-haves to survive). Wants are like double-chocolate cookies or shiny toy cars (nice to have, but you can live without them!).",
      l47: "A credit score is like a school report card for how well you borrow and return toys. If you return toys on time, everyone happily lends you more!",
      l48: "Snowballing debt is like rolling a tiny snowball down a hill. You crush your smallest debts first, building momentum to wipe out the big ones!",
      l49: "Imagine trading 3 apples for 1 fish because there is no paper money. It gets super annoying if the fish seller only wants bananas!",
      l50: "Fiat is paper cash that has value just because the government says it does, and everyone agrees to trust it!",
      l51: "Savings accounts are like vaults to store your gold. Checking accounts are like active pouches on your belt for quick daily trades.",
      l52: "Expense ratio is like a tiny hole in your money bucket — a 1.5% hole leaks ₹15,000 from every ₹10 lakh per year. Choose index funds with tiny 0.05% holes!",
      l53: "Beta is your stock's excitement dial. Set it to 2x and every market party is twice as loud — but every market crash is twice as bad!",
      l54: "Correlation is like pairing a raincoat with sunscreen in your bag. When one is useful (raining), the other isn't — but together you're covered for all weather!",
      l55: "Gold ETF is like owning a golden membership card instead of carrying actual gold bars. Same value, way easier to carry, sell, and store!",
      l56: "Tracking error is how precisely your ETF copies the market. A 0.05% error means your fund is a near-perfect photocopy of the Nifty!",
      l57: "Credit rating is like a company's trustworthy-borrower score. AAA is a billionaire friend who always repays — D is a broke uncle who never does!",
      l58: "ELSS is a 3-year locked piggy bank that gives you a tax coupon upfront AND grows like the stock market inside!",
      l59: "Current Ratio is checking if a company can pay all its bills this month. If money owed > money available, that's like spending more than your pocket money — bad!",
      l60: "ROCE tells you how hard the factory works for every rupee you invest. 25% ROCE = the factory prints ₹25 for every ₹100 you put in!",
      l61: "Working capital cycle is how fast a shop turns ₹10 of stocked candy into ₹12 of sales cash. Faster = healthier cash flow!",
      l62: "Goodwill is paying extra for a famous toy brand — the brand name magic. But if the magic disappears, that extra price evaporates too!",
      l63: "Related party transactions are like a school canteen buying snacks from the principal's family shop at double the market price — unfair to students!",
      l64: "Buybacks are like a pizza shop with 10 partners buying out 2 partners — the remaining 8 partners each own a bigger slice of the same pizza!",
      l65: "EBITDA margin shows how much profit is left from every pizza sold after paying for dough, toppings, and delivery — before paying rent and taxes!",
      l66: "Margin call is when your broker says 'pay more money or I sell your stocks at the worst possible price right now!' — like a debt collector at midnight!",
      l67: "Short selling is borrowing a toy, selling it, then buying the same toy cheaper later and returning it — pocketing the difference!",
      l68: "Arbitrage is spotting the same chocolate bar selling for ₹30 in one shop and ₹50 next door — buying low and selling high instantly, risk-free!",
      l69: "Put-Call Ratio is counting how scared vs excited the market is. Very scared (high PCR) often means a bounce is coming — smart money thinks opposite!",
      l70: "Contango is like a hotel that charges more for future bookings than today. Backwardation is the opposite — today costs more because everyone needs rooms NOW!",
      l71: "Gamma is why options near their expiry date become like fireworks — a tiny spark causes a massive explosion of gains or losses in minutes!",
      l72: "Vega is the hot air in an options balloon. Before big events, everyone pumps air in (prices spike). After the event — whoosh — all air rushes out instantly!",
      l73: "DeFi is a bank run entirely by computer code on the internet — no managers, no paperwork, just automatic lending, borrowing, and earning 24/7!",
      l74: "WPI is the thermometer at the factory gate. CPI is the thermometer at your dinner plate. Factory gets hot first, your food heats up 6 months later!",
      l75: "Section 87A is a magic coupon: earn below ₹7 lakh and the government stamps your tax bill ZERO. Earn even ₹1 more and the magic vanishes!",
      l76: "Rule of 114 is a wealth speedometer — divide 114 by your return rate and you know exactly how many years to triple your money. No calculator needed!",
      l77: "Rule of 144 is like Rule of 72 but for quadrupling! Divide 144 by your interest rate and see when your money grows 4x in size!",
      l78: "SGB is a golden goose that lays 2.5% interest eggs every year AND grows bigger as gold prices rise — AND you pay zero tax when it hatches at maturity!",
      l79: "EPF is like having a government buddy match every coin you save for retirement — your company adds the same amount you save, doubling your retirement fund!",
      l80: "Liquid Fund is a hotel room (flexible checkout anytime). Fixed Deposit is a 1-year lease (locked in, better deal, can't leave early without penalty)!",
      l81: "Beta is your stock's volume knob. Low beta stocks are quiet in storms. High beta stocks blast loud in bull markets but crash loudest in bear ones!",
      l82: "Alpha is the bonus points a fund manager scores above what the market gave for free. Most managers score zero or negative — only stars score above!",
      l83: "Growth vs Value investing is like summer vs winter clothes shopping. Buy summer clothes in winter (cheap prices), wear them profitably all summer!",
      l84: "REIT is owning a tiny piece of a giant IT park — you get your share of the monthly rent from all the tech company tenants deposited to your account!",
      l85: "InvIT is co-owning a toll highway — every truck that passes drops ₹150 in your pocket automatically, 24/7, whether you're asleep or awake!",
      l86: "Arbitrage fund is like a robot that buys mangoes cheap in one market and sells them expensive in another — automatically, instantly, risk-free, every day!",
      l87: "Multi-asset portfolio is a farm with wheat, cows, fruit trees, and a rental house — if one fails, the others feed you. No single crop failure ruins everything!",
      l88: "Smallcase is a curated stock playlist for a theme (like EV cars). Amazing when the theme is trending — dangerous if you bet everything on one song!",
      l89: "Debt-to-equity is like a seesaw with borrowed money on one side and your own money on the other. Too much debt makes the seesaw tip dangerously!",
      l90: "ROE tells you how good a company is at turning your ₹1 investment into profit. 25% ROE = company earns ₹25 profit from your ₹100 investment every year!",
      l91: "ROCE vs WACC is checking if the factory earns MORE than it costs to run. If borrowing at 12% to earn only 8% — every rupee works at a loss!",
      l92: "FCF Yield is counting the actual cash eggs a business golden goose lays. Unlike reported profits, you can't fake physical cash — it's the realest number!",
      l93: "Promoter pledging shares is like the restaurant owner mortgaging the restaurant building. If revenue drops, the banker takes the building — big danger!",
      l94: "RPT audit is forensic accounting detective work — finding if the company is secretly sending profits to the promoter's personal businesses at fake prices!",
      l95: "Auditor resignation is the most terrifying corporate signal — like a building safety inspector refusing to sign and walking out because the building is unsafe!",
      l96: "DuPont analysis is an X-ray machine for company profits — revealing if high returns come from genuine efficiency or dangerous debt leverage tricks!",
      l97: "Delta is an option's reaction meter. Delta 0.9 means for every ₹1 the stock moves, your option moves ₹0.90 — almost like owning the stock directly!",
      l98: "Gamma is delta's accelerator. Near expiry, even a tiny stock move causes your option's delta — and price — to explode wildly up or crash to zero!",
      l99: "Theta is an ice cube melting in your hand. Your option premium melts a little daily — then melts really fast in the final 7 days before it disappears!",
      l100: "Vega trading is umbrella timing: buy cheap when it's sunny (low IV), sell expensively when everyone panics about storms (high IV before events)!",
      l101: "Bull Put Spread is selling insurance on a stock not crashing. Collect premium upfront. If stock stays up, keep all the money — defined risk profit!",
      l102: "Bear Call Spread is selling insurance on a stock not rising. Collect credit upfront. If stock falls or stays flat, keep all the premium — defined risk!",
      l103: "Iron Butterfly is like collecting 4 parking spot rents at once. As long as nobody crashes the fence (stock stays in range), you pocket all 4 rents!",
      l104: "IV Crush is the balloon pop moment after big news. Option buyers buy inflated balloons pre-event, then the event pops all the air out — premium gone!",

      s_2_1: "Cash flow is like a water slide. Inflow is water pumping in (earnings). Outflow is water leaking out (spending). Keep the inflow stronger!",
      s_3_1: "Cash flow is like a water slide. Inflow is water pumping in (earnings). Outflow is water leaking out (spending). Keep the inflow stronger!",
      s_4_1: "Cash flow is like a water slide. Inflow is water pumping in (earnings). Outflow is water leaking out (spending). Keep the inflow stronger!",
      s_1_2: "Taxes are like a small entry fee everyone pays to build and repair the public playground slides, swings, and pools.",
      s_2_2: "Taxes are like a small entry fee everyone pays to build and repair the public playground slides, swings, and pools.",
      s_3_2: "Taxes are like a small entry fee everyone pays to build and repair the public playground slides, swings, and pools.",
      s_4_2: "Taxes are like a small entry fee everyone pays to build and repair the public playground slides, swings, and pools.",
      s_1_3: "Risk vs reward is like climbing a taller tree. The higher you climb, the sweeter the fruit, but the harder the fall if you slip!",
      s_2_3: "Risk vs reward is like climbing a taller tree. The higher you climb, the sweeter the fruit, but the harder the fall if you slip!",
      s_3_3: "Risk vs reward is like climbing a taller tree. The higher you climb, the sweeter the fruit, but the harder the fall if you slip!",
      s_4_3: "Risk vs reward is like climbing a taller tree. The higher you climb, the sweeter the fruit, but the harder the fall if you slip!",
      s_1_4: "Global markets are like a massive marketplace where merchants from India, America, and Japan all trade together!",
      s_2_4: "Global markets are like a massive marketplace where merchants from India, America, and Japan all trade together!",
      s_3_4: "Global markets are like a massive marketplace where merchants from India, America, and Japan all trade together!",
      s_4_4: "Global markets are like a massive marketplace where merchants from India, America, and Japan all trade together!",
    };
    if (lang === "tanglish") {
      return tanglishSimples[lessonId] || (englishSimples[lessonId] ? englishSimples[lessonId] : "This is a specialized topic in Tanglish!");
    }
    if (lang === "ta") {
      return englishSimples[lessonId] || "சிறப்பு நிதி கோட்பாடு.";
    }
    return englishSimples[lessonId] || "This is a specialized topic. It is like optimizing your toy box strategy to get maximum returns with minimum risk!";
  };

  const speakText = (text, langCode = "en") => {
    if (window.speechSynthesis) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setActiveSpeechText("");
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;

      // Scan system voices for the best match
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (langCode === "ta") {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().includes("ta"));
        utterance.lang = "ta-IN";
      } else {
        selectedVoice =
          voices.find(
            (v) =>
              v.name.includes("Google") && v.lang.toLowerCase().includes("en"),
          ) || voices.find((v) => v.lang.toLowerCase().includes("en"));
        utterance.lang = "en-US";
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setActiveSpeechText(text);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveSpeechText("");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveSpeechText("");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-Speech not supported in this browser");
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Navigation & States
  const [activeSubTab, setActiveSubTab] = useState("architect"); // Default to portfolio architect
  
  // ─── Duolingo Snake Pathway Calculations ───
  const ORDERED_LESSONS = useMemo(() => {
    const s1 = ACADEMY_LESSONS.filter((l) => l.stationId === 1);
    const s2 = ACADEMY_LESSONS.filter((l) => l.stationId === 2);
    const s3 = ACADEMY_LESSONS.filter((l) => l.stationId === 3);
    const s4 = ACADEMY_LESSONS.filter((l) => l.stationId === 4);
    return [...s1, ...s2, ...s3, ...s4];
  }, []);

  const CHAPTER_NODES = useMemo(() => {
    const nodes = {};
    for (let sId = 1; sId <= 4; sId++) {
      const sLessons = ACADEMY_LESSONS.filter(l => l.stationId === sId);
      
      let sStories = [];
      if (sId === 1) {
        sStories = [
          { id: `s_1_1`, type: "story", title: "What is Cash Flow?", emoji: "📖", glossaryId: "g1" },
          { id: `s_1_2`, type: "story", title: "Taxes Decoded", emoji: "📖", glossaryId: "g2" },
          { id: `s_1_3`, type: "story", title: "Risk vs Reward", emoji: "📖", glossaryId: "g3" },
          { id: `s_1_4`, type: "story", title: "Global Markets", emoji: "📖", glossaryId: "g4" },
        ];
      } else if (sId === 2) {
        sStories = [
          { id: `s_2_1`, type: "story", title: "Compound Interest", emoji: "📖", glossaryId: "g5" },
          { id: `s_2_2`, type: "story", title: "Diversification", emoji: "📖", glossaryId: "g6" },
          { id: `s_2_3`, type: "story", title: "Inflation", emoji: "📖", glossaryId: "g7" },
          { id: `s_2_4`, type: "story", title: "Mutual Funds", emoji: "📖", glossaryId: "g8" },
        ];
      } else if (sId === 3) {
        sStories = [
          { id: `s_3_1`, type: "story", title: "Shares", emoji: "📖", glossaryId: "g9" },
          { id: `s_3_2`, type: "story", title: "P/E Ratio", emoji: "📖", glossaryId: "g10" },
          { id: `s_3_3`, type: "story", title: "Mr. Market", emoji: "📖", glossaryId: "g11" },
          { id: `s_3_4`, type: "story", title: "Corporate Auditing", emoji: "📖", glossaryId: "g12" },
        ];
      } else if (sId === 4) {
        sStories = [
          { id: `s_4_1`, type: "story", title: "Option Contracts", emoji: "📖", glossaryId: "g13" },
          { id: `s_4_2`, type: "story", title: "Hedging", emoji: "📖", glossaryId: "g14" },
          { id: `s_4_3`, type: "story", title: "Short Selling", emoji: "📖", glossaryId: "g15" },
          { id: `s_4_4`, type: "story", title: "Leverage", emoji: "📖", glossaryId: "g16" },
        ];
      }
      const sChests = [
        { id: `c_${sId}_1`, type: "chest", reward: 100, title: "Mini Chapter Reward" },
        { id: `c_${sId}_2`, type: "chest", reward: 150, title: "Halfway Mastery Chest" },
        { id: `c_${sId}_3`, type: "chest", reward: 250, title: "Grand Chapter Completion Chest" },
      ];
      
      const chapterList = [];
      let lessonPointer = 0;
      let storyPointer = 0;
      
      for (let i = 0; i < 25; i++) {
        if (i === 7) {
          chapterList.push({ ...sChests[0], id: `c_${sId}_1`, localIdx: i });
        } else if (i === 15) {
          chapterList.push({ ...sChests[1], id: `c_${sId}_2`, localIdx: i });
        } else if (i === 24) {
          chapterList.push({ ...sChests[2], id: `c_${sId}_3`, localIdx: i });
        } else if (i === 3 || i === 11 || i === 18 || i === 22) {
          chapterList.push({ ...sStories[storyPointer++], localIdx: i });
        } else {
          const lesson = sLessons[lessonPointer++];
          let sideQuest = null;
          if (i === 5) {
            sideQuest = { id: `sq_${sId}_1`, title: "Timed Compounding", emoji: "⚡", coins: 300 };
          } else if (i === 13) {
            sideQuest = { id: `sq_${sId}_2`, title: "Asset Allocator", emoji: "👑", coins: 400 };
          } else if (i === 20) {
            sideQuest = { id: `sq_${sId}_3`, title: "Tax Escape Game", emoji: "🏆", coins: 500 };
          }
          chapterList.push({ type: "lesson", data: lesson, localIdx: i, sideQuest });
        }
      }
      nodes[sId] = chapterList;
    }
    return nodes;
  }, []);

  const ALL_ROAD_NODES = useMemo(() => {
    const list = [];
    for (let sId = 1; sId <= 4; sId++) {
      list.push(...(CHAPTER_NODES[sId] || []));
    }
    return list;
  }, [CHAPTER_NODES]);

  const activeNodeIdx = useMemo(() => {
    if (devUnlockAll) return 0;
    const firstUncompleted = ALL_ROAD_NODES.findIndex((node) => {
      const id = node.type === "lesson" ? node.data?.id : node.id;
      return !user?.lessonsCompleted?.includes(id);
    });
    return firstUncompleted === -1 ? ALL_ROAD_NODES.length - 1 : firstUncompleted;
  }, [ALL_ROAD_NODES, user?.lessonsCompleted, devUnlockAll]);

  const isNodeUnlocked = (node, globalIdx) => {
    if (devUnlockAll) return true;
    if (globalIdx === 0) return true;
    const prevNode = ALL_ROAD_NODES[globalIdx - 1];
    const prevId = prevNode.type === "lesson" ? prevNode.data?.id : prevNode.id;























  // Glossary filters & modes
  const [glossaryLetterFilter, setGlossaryLetterFilter] = useState("All");
  const [glossaryDifficultyFilter, setGlossaryDifficultyFilter] = useState("All");
  const [glossaryMode, setGlossaryMode] = useState("grid"); // "grid", "flashcards", "compare", "notebook", "challenge"
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  // Bookmarks & Mastery (Study mode)
  const [bookmarkedTerms, setBookmarkedTerms] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_bookmarked_terms");
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [masteredTerms, setMasteredTerms] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_mastered_terms");
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });

  // --- SRS & Streak Helpers ---
  const [srsSchedule, setSrsSchedule] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_srs_schedule");
      return val ? JSON.parse(val) : {};
    } catch (e) {
      return {};
    }









  });

  const [quizMode, setQuizMode] = useState("mcq"); // "flashcard" | "mcq" | "fillblank"
  const [quizWrongTerms, setQuizWrongTerms] = useState([]);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState(null);
  const [quizTextAnswer, setQuizTextAnswer] = useState("");
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);
  const [quizIsFirstTryCorrect, setQuizIsFirstTryCorrect] = useState(true);
  
  const [comparisonModalTermA, setComparisonModalTermA] = useState("");
  const [comparisonModalTermB, setComparisonModalTermB] = useState("");
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const logStudyActivity = (activityType, details) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const log = { ...studyLog };
    if (!log[todayStr]) log[todayStr] = [];
    const entry = `${activityType}:${details}`;
    if (!log[todayStr].includes(entry)) {
      log[todayStr].push(entry);
      localStorage.setItem("finbuddy_study_log", JSON.stringify(log));
      setStudyLog(log);
    }
  };

  const calculateStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dates = Object.keys(studyLog).sort().reverse();
    if (dates.length === 0) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    
    // check if studied today or yesterday
    const todayFormatted = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayFormatted = checkDate.toISOString().split('T')[0];
    
    let hasStudiedRecent = studyLog[todayFormatted] || studyLog[yesterdayFormatted];
    if (!hasStudiedRecent) return 0;
    
    checkDate = new Date(); // reset to today
    while (true) {
      const currentStr = checkDate.toISOString().split('T')[0];
      if (studyLog[currentStr] && studyLog[currentStr].length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = useMemo(() => {
    return calculateStreak();
  }, [studyLog]);

  const glossaryStats = useMemo(() => {
    const total = glossary.length || 1;
    const todayStr = new Date().toISOString().split('T')[0];
    
    let due = 0;
    let fresh = 0;
    masteredTerms.forEach(term => {
      const sched = srsSchedule[term];
      if (sched && sched.nextReviewDate <= todayStr) {
        due++;
      } else {
        fresh++;
      }
    });
    
    const mastered = masteredTerms.length;
    const inProgress = glossary.filter(g => !masteredTerms.includes(g.term) && (studyLog[todayStr]?.some(entry => entry.includes(g.term)) || false)).length;
    const notStarted = Math.max(0, total - mastered - inProgress);
    
    const chartData = [
      { name: "Fresh Mastery", value: fresh, color: "#10B981" },
      { name: "Due for Review", value: due, color: "#F59E0B" },
      { name: "In Progress", value: inProgress, color: "#06B6D4" },
      { name: "Not Started", value: notStarted, color: "#334155" }
    ];
    
    const categories = [...new Set(glossary.map(g => g.category))];
    const categoryBreakdown = categories.map(cat => {
      const catTerms = glossary.filter(g => g.category === cat);
      const catMastered = catTerms.filter(g => masteredTerms.includes(g.term)).length;
      const pct = catTerms.length ? Math.round((catMastered / catTerms.length) * 100) : 0;
      return { category: cat, mastered: catMastered, total: catTerms.length, percentage: pct };
    }).sort((a, b) => b.percentage - a.percentage);
    
    const weakAreas = categoryBreakdown.filter(c => c.percentage < 30).slice(0, 3);
    
    return {
      chartData,
      categoryBreakdown,
      weakAreas,
      total,
      due,
      fresh,
      mastered
    };
  }, [glossary, masteredTerms, srsSchedule, studyLog]);

  const heatmapDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 83); // 84 days total
    
    for (let i = 0; i < 84; i++) {
      const temp = new Date(startDate);
      temp.setDate(startDate.getDate() + i);
      const dateStr = temp.toISOString().split('T')[0];
      const activities = studyLog[dateStr] || [];
      days.push({
        date: dateStr,
        count: activities.length,
        dayOfWeek: temp.getDay(),
        label: temp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    }
    return days;
  }, [studyLog]);

  const updateSRSSchedule = (termName, isCorrect) => {
    const today = new Date();
    const schedule = { ...srsSchedule };
    const current = schedule[termName] || { interval: 1, easeFactor: 2.5 };
    
    let newInterval = 1;
    let newEaseFactor = current.easeFactor;
    
    if (isCorrect) {
      newInterval = Math.ceil(current.interval * current.easeFactor);
      if (newInterval > 60) newInterval = 60; // capped at 60 days
    } else {
      newInterval = 1; // reset to 1 day
      newEaseFactor = Math.max(1.3, current.easeFactor - 0.2);
    }
    
    const nextReview = new Date();
    nextReview.setDate(today.getDate() + newInterval);
    const nextReviewStr = nextReview.toISOString().split('T')[0];
    
    schedule[termName] = {
      interval: newInterval,
      easeFactor: Number(newEaseFactor.toFixed(2)),
      nextReviewDate: nextReviewStr
    };
    
    localStorage.setItem("finbuddy_srs_schedule", JSON.stringify(schedule));
    setSrsSchedule(schedule);
    
    // Also log study activity
    logStudyActivity("srs_review", `${termName}:${isCorrect ? 'correct' : 'wrong'}`);
  };

  const [inlineTerm, setInlineTerm] = useState(null);
  const [lessonQuizActive, setLessonQuizActive] = useState(false);
  const [quizCardIndex, setQuizCardIndex] = useState(0);
  const [quizFlipped, setQuizFlipped] = useState(false);

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Hello! Click any term in the glossary or ask me any question about finance. I'm here to help you learn!" }
  ]);

  const [deepDiveChatLoading, setDeepDiveChatLoading] = useState(false);

  // Comparison
  const [comparisonTermA, setComparisonTermA] = useState("");
  const [comparisonTermB, setComparisonTermB] = useState("");
  const [likedTerms, setLikedTerms] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_liked_terms");
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleLikeTerm = (termName) => {
    setLikedTerms((prev) => {
      const next = prev.includes(termName)
        ? prev.filter((t) => t !== termName)
        : [...prev, termName];
      localStorage.setItem("finbuddy_liked_terms", JSON.stringify(next));
      toast(next.includes(termName) ? `Liked "${termName}"! ❤️` : `Unliked "${termName}"`, {
        icon: next.includes(termName) ? "❤️" : "💔",
      });
      return next;
    });
  };

  const getGlossaryEnrichment = (term) => {
    return glossaryEnrichments[term] || {
      usedIn: "Playground & Study Lessons",
      fieldUsed: "General financial understanding",
      example: "Understanding this term helps in general financial decisions.",
      likes: 15
    };
  };

  const toggleBookmark = (termName) => {
    setBookmarkedTerms((prev) => {
      const next = prev.includes(termName)
        ? prev.filter((t) => t !== termName)
        : [...prev, termName];
      localStorage.setItem("finbuddy_bookmarked_terms", JSON.stringify(next));
      toast(next.includes(termName) ? `Bookmarked "${termName}"! ⭐` : `Removed "${termName}" from bookmarks`, {
        icon: next.includes(termName) ? "⭐" : "🗑️"
      });
      return next;
    });
  };

  const speakTerm = (term, shortDesc) => {
    if (!window.speechSynthesis) {
      toast("Audio speech not supported on your browser.", { icon: "⚠️" });
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `${term}. ${shortDesc}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("en-GB"));
    if (premiumVoice) utterance.voice = premiumVoice;
    window.speechSynthesis.speak(utterance);
    toast(`Playing audio pronunciation... 🔊`, { icon: "🔊" });
  };

  const handleExplainTerm = async (term) => {
    setSelectedTerm(term);
    setExplaining(true);
    setActiveSubTab("glossary");
    try {
      const res = await api.post("/learn/explain", { term, lang: audioLang });
      if (res.data?.success) {
        setExplanation(res.data.explanation);
      } else {
        setExplanation(`Unable to load AI definition for "${term}". Please try again!`);
      }
    } catch (e) {
      console.error("Error fetching term explanation:", e);
      const termObj = glossary.find((g) => g.term.toLowerCase() === term.toLowerCase());
      if (termObj) {
        setExplanation(`### 💡 ${termObj.term} (${termObj.category})\n\n${termObj.desc}\n\n* **Easy Analog**: Storing gold laddoos in a secured digital container instead of paying a heavy safety bank locker price!`);
      } else {
        setExplanation(`### 💡 ${term}\n\nThis represents a key asset class or financial concept. Investing in it builds compound interest over time!\n\n* **Key Advantage**: Helps diversify risk and tap growth metrics.`);
      }
    } finally {
      setExplaining(false);
    }
  };
  useEffect(() => {
    if (location.state) {
      if (location.state.activeLesson) {
        setActiveLesson(location.state.activeLesson);
        toast(`Activated Lesson: ${location.state.activeLesson.title}! 📚`, {
          icon: "🎓",
          duration: 4000,
        });
      }
      if (location.state.subTab) {
        setActiveSubTab(location.state.subTab);
      }
      if (location.state.stationId) {
        setActiveStation(location.state.stationId);
      }
      if (location.state.selectedTerm) {
        handleExplainTerm(location.state.selectedTerm);
      }
    }
  }, [location.state]);

  const handleCompleteActiveLesson = async () => {
    if (!activeLesson) return;
    try {
      const res = await api.post("/mentor/lesson-complete", {
        lessonId: activeLesson.id,
        coinsReward: activeLesson.coins,
      });
      if (res.data?.success) {
        toast.success(
          `🎉 Completed! +${activeLesson.coins} Coins added to Demat!`,
        );
        // Sync progress with local auth context immediately
        if (updateUser && user) {
          const currentCompleted = user.lessonsCompleted || [];
          if (!currentCompleted.includes(activeLesson.id)) {
            updateUser({
              lessonsCompleted: [...currentCompleted, activeLesson.id],
              virtualCoins: (user.virtualCoins || 0) + (activeLesson.coins || 20)
            });
          }
        }
        // Clear last active lesson in DB — this lesson is done!
        api.post('/mentor/learn-progress', { lessonId: null }).catch(() => {});
        setXpPoints((prev) => prev + 100);
        
        // Trigger vocabulary quiz if terms exist
        const lessonTerms = lessonGlossaryMapping[activeLesson.id] || [];
        if (lessonTerms.length > 0) {
          setLessonQuizActive(true);
          setQuizCardIndex(0);
          setQuizFlipped(false);
        } else {
          setActiveLesson(null);
          setLessonActionCompleted(false);
        }
      }
    } catch (e) {
      toast.error("Failed to complete lesson");
    }
  };

  const handleSelectAcademyTopic = (topic) => {
    navigate(`/learn/lab?lessonId=${topic.id}&lang=${audioLang}`);
  };

  const handleClaimMilestone = (stationId, rewardCoins) => {
    if (updateUser && user) {
      const updated = [...claimedChests, stationId];
      setClaimedChests(updated);
      localStorage.setItem("finbuddy_claimed_chests", JSON.stringify(updated));
      toast.success(`🎁 Chest Unlocked! +${rewardCoins} Coins added to Demat!`);
      api.put('/users/me', {
        claimedChests: updated,
        virtualCoins: (user.virtualCoins || 0) + rewardCoins
      })
        .then(res => {
          updateUser({
            virtualCoins: (user.virtualCoins || 0) + rewardCoins,
            claimedChests: updated
          });
        })
        .catch(e => {
          updateUser({
            virtualCoins: (user.virtualCoins || 0) + rewardCoins
          });
        });
    }
  };

  // ─── Portfolio Architect & User Profile States ───
  const [userAge, setUserAge] = useState(25);
  const [monthlySavings, setMonthlySavings] = useState(10000);
  const [riskTolerance, setRiskTolerance] = useState("moderate"); // conservative | moderate | aggressive | tactical
  const [expectedReturn, setExpectedReturn] = useState(12); // Expected returns % (6% to 28%)
  const [investmentDuration, setInvestmentDuration] = useState(10); // 5 to 30 years
  const [sipCalculatedValue, setSipCalculatedValue] = useState({
    invested: 1200000,
    gained: 1123391,
    total: 2323391,
  });

  const [portfolioSplit, setPortfolioSplit] = useState({
    bonds: 30,
    gold: 15,
    mutualFunds: 40,
    foreignStocks: 15,
  });

  const pieData = [
    { name: "Mutual Funds", value: portfolioSplit.mutualFunds, color: "#a78bfa" },
    { name: "Bonds", value: portfolioSplit.bonds, color: "#34d399" },
    { name: "Gold", value: portfolioSplit.gold, color: "#fbbf24" },
    { name: "Foreign Stocks", value: portfolioSplit.foreignStocks, color: "#60a5fa" }
  ];

  // ─── Unified Microscope Simulator Engine States ───
  const [microscopeValue, setMicroscopeValue] = useState(50);
  const [microscopeSecondaryValue, setMicroscopeSecondaryValue] = useState(50);
  const [historyBuffer, setHistoryBuffer] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [sweepSpeed, setSweepSpeed] = useState(150); // 150 = 1x, 75 = 2x, 35 = 4x
  const [isSweeping, setIsSweeping] = useState(false);
  const [lensFilter, setLensFilter] = useState("normal");

  const updateHistoryBuffer = (v1, v2) => {
    setHistoryBuffer((prev) => {
      const updated = [...prev, { val1: v1, val2: v2 }];
      if (updated.length > 25) {
        return updated.slice(updated.length - 25);
      }
      return updated;
    });
  };

  useEffect(() => {
    if (activeLesson) {
      const config = getMicroscopeConfig(activeLesson.id);
      if (config) {
        setMicroscopeValue(config.default);
        setMicroscopeSecondaryValue(config.secondaryDefault !== undefined ? config.secondaryDefault : 50);
        setLessonActionCompleted(false);
        setHistoryBuffer([]);
        setIsScanning(false);
        setScanResult(null);
        setIsSweeping(false);
      }
    }
  }, [activeLesson?.id]);

  const handleMicroscopeChange = (val) => {
    setMicroscopeValue(val);
    updateHistoryBuffer(val, microscopeSecondaryValue);
    if (activeLesson) {
      const config = getMicroscopeConfig(activeLesson.id);
      if (config) {
        const secVal = config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined;
        const goalMet = config.goalCheck(val, secVal);
        if (goalMet) {
          if (!lessonActionCompleted) {
            setLessonActionCompleted(true);
            toast.success("🎯 Practice target achieved! Click 'Complete & Claim' above!", {
              icon: "🏆",
              duration: 3000
            });
          }
        } else {
          setLessonActionCompleted(false);
        }
      }
    }
  };

  const handleMicroscopeSecondaryChange = (val) => {
    setMicroscopeSecondaryValue(val);
    updateHistoryBuffer(microscopeValue, val);
    if (activeLesson) {
      const config = getMicroscopeConfig(activeLesson.id);
      if (config) {
        const goalMet = config.goalCheck(microscopeValue, val);
        if (goalMet) {
          if (!lessonActionCompleted) {
            setLessonActionCompleted(true);
            toast.success("🎯 Practice target achieved! Click 'Complete & Claim' above!", {
              icon: "🏆",
              duration: 3000
            });
          }
        } else {
          setLessonActionCompleted(false);
        }
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isSweeping && activeLesson) {
      const config = getMicroscopeConfig(activeLesson.id);
      if (config) {
        let direction = 1;
        interval = setInterval(() => {
          setMicroscopeValue((prev) => {
            let next = prev + direction * config.step;
            if (next >= config.max) {
              next = config.max;
              direction = -1;
            } else if (next <= config.min) {
              next = config.min;
              direction = 1;
            }
            const secVal = config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined;
            const goalMet = config.goalCheck(next, secVal);
            if (goalMet) {
              setLessonActionCompleted(true);
            }
            updateHistoryBuffer(next, microscopeSecondaryValue);
            return next;
          });
        }, sweepSpeed);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSweeping, sweepSpeed, activeLesson?.id, microscopeSecondaryValue]);

  const handleAnomalyScan = () => {
    if (!activeLesson) return;
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      const config = getMicroscopeConfig(activeLesson.id);
      if (config) {
        const secVal = config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined;
        const isGoalMet = config.goalCheck(microscopeValue, secVal);
        let report = "";
        
        if (activeLesson.id === "l2") {
          report = isGoalMet 
            ? `💡 Audit: Compounding optimization active! Investment horizon of ${microscopeValue} years combined with a high ${microscopeSecondaryValue}% yield generates massive compound interest relative to principal.`
            : `⚠️ Warning: Sub-optimal yield or time horizon. A short period (${microscopeValue} yrs) or low yield (${microscopeSecondaryValue}%) minimizes compound interest compounding multipliers. Hold for 15+ years at 15%+ yield for safety.`;
        } else if (activeLesson.id === "l11") {
          report = isGoalMet
            ? `💡 Audit: High inflation impact audited! Over ${microscopeValue} years with ${microscopeSecondaryValue}% inflation, cash purchasing power decays significantly. Equities are highly recommended.`
            : `💡 Audit: Low-to-moderate inflation risk. Cash value remains stable, but long-term investment shelter is still advised.`;
        } else if (activeLesson.id === "l44") {
          const loss = microscopeValue * microscopeSecondaryValue;
          report = loss > 50 
            ? `🚨 CRITICAL RISK DETECTED: High leverage (${microscopeValue}x) with a ${microscopeSecondaryValue}% market drop causes a total capital loss of ${loss}%. Margins will trigger forced broker liquidation!`
            : `💡 Audit: Margin leverage managed. Ensure adequate cash buffers are maintained to defend against flash crash liquidations.`;
        } else {
          report = isGoalMet
            ? `💡 Audit scan complete: Simulation target goals met. All values satisfy fundamental safety levels.`
            : `⚠️ Audit scan complete: Target values have not been optimized. Drag slider to adjust inputs and test safety scenarios.`;
        }
        setScanResult(report);
      }
    }, 2000);
  };

  // ─── Quiz state ───
  const [quizTopic, setQuizTopic] = useState("Stocks 101");
  const [quizDifficulty, setQuizDifficulty] = useState("easy");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [xpPoints, setXpPoints] = useState(120);
  const [streakCount, setStreakCount] = useState(3);

  // Sync user profile progress metrics
  useEffect(() => {
    if (user) {
      setStreakCount(user.currentStreak || 0);
      setXpPoints((user.lessonsCompleted?.length || 0) * 100 + (user.totalQuizScore || 0));
    }
  }, [user]);

  // ─── Compounding and Dynamic Allocation Engine ───
  useEffect(() => {
    // FV = P * [ ((1 + r)^n - 1) / r ] * (1 + r)
    const monthlyRate = expectedReturn / 12 / 100;
    const months = investmentDuration * 12;
    const invested = monthlySavings * months;

    let total = 0;
    if (monthlyRate > 0) {
      total =
        monthlySavings *
        ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
        (1 + monthlyRate);
    } else {
      total = invested;
    }

    setSipCalculatedValue({
      invested: Math.round(invested),
      gained: Math.round(Math.max(0, total - invested)),
      total: Math.round(total),
    });

    // Dynamic Asset Allocation based on risk profile and age
    let baseEquity = Math.max(20, Math.min(90, 100 - userAge));

    if (riskTolerance === "conservative") {
      baseEquity = Math.max(15, baseEquity - 20);
    } else if (riskTolerance === "aggressive") {
      baseEquity = Math.min(90, baseEquity + 15);
    } else if (riskTolerance === "tactical") {
      baseEquity = Math.min(95, baseEquity + 25);
    }

    const bondsShare = Math.round(100 - baseEquity);
    const foreignShare = Math.round(baseEquity * 0.3);
    const mutualFundsShare = Math.round(baseEquity * 0.55);
    const goldShare = Math.round(baseEquity * 0.15);

    setPortfolioSplit({
      bonds: Math.max(5, bondsShare),
      gold: Math.max(5, goldShare),
      mutualFunds: Math.max(10, mutualFundsShare),
      foreignStocks: Math.max(0, foreignShare),
    });
  }, [
    expectedReturn,
    userAge,
    monthlySavings,
    riskTolerance,
    investmentDuration,
  ]);

  // Seed Glossary on mount
  useEffect(() => {

    setGlossary(defaultGlossary);
    setLoading(false);
  }, []);
  // Screened verified directory assets
  const getScreenedAssets = () => {
    const assets = [
      {
        name: "RBI Floating Rate Savings Bonds (FRSB)",
        type: "🏛️ Government Bonds",
        yield: "8.05% p.a. Payout",
        risk: "Zero Sovereign Risk",
        volatility: "None",
        lockin: "7 Years (Option for senior citizens)",
        desc: "100% secured sovereign bonds issued directly by the Reserve Bank of India. Perfect capital preservation.",
        learnTerm: "Govt Bonds",
        link: "https://rbiretaildirect.org.in",
        platform: "RBI Retail Direct",
        regulator: "✓ RBI Governed",
        expectedCategory: [6, 7, 8, 9, 10],
      },
      {
        name: "NHAI Tax-Free Infrastructure Bonds",
        type: "🏛️ Corporate Bonds",
        yield: "5.75% Tax-Free Yield",
        risk: "Extremely Low",
        volatility: "Very Low",
        lockin: "10 Years",
        desc: "Secured AAA-rated bonds issued by National Highways Authority of India. 100% tax-free coupon interest payments.",
        learnTerm: "Corporate Bonds",
        link: "https://goldenpi.com",
        platform: "GoldenPi Platform",
        regulator: "✓ SEBI Registered",
        expectedCategory: [6, 7, 8],
      },
      {
        name: "Sovereign Gold Bond (SGB Scheme)",
        type: "🪙 Sovereign Gold",
        yield: "2.5% p.a. Interest + Gold Growth",
        risk: "Low Risk",
        volatility: "Low-Moderate",
        lockin: "8 Years",
        desc: "Official government scheme issued by RBI matching physical gold price with extra tax-free bonus interest.",
        learnTerm: "SGB Gold",
        link: "https://rbiretaildirect.org.in",
        platform: "RBI Sovereign Direct",
        regulator: "✓ RBI & Govt Approved",
        expectedCategory: [8, 9, 10, 11, 12],
      },
      {
        name: "Nippon India Gold BeES ETF",
        type: "🪙 Gold ETF",
        yield: "8.4% p.a. (5-Yr Avg)",
        risk: "Low Risk",
        volatility: "Moderate",
        lockin: "None (Liquid)",
        desc: "Exchange-traded fund tracking live spot gold price on NSE. Highly liquid gold alternative.",
        learnTerm: "Gold ETF",
        link: "https://groww.in/etfs/nippon-india-gold-bees-etf",
        platform: "Groww Brokerage",
        regulator: "✓ SEBI & NSE Regulated",
        expectedCategory: [8, 9, 10, 11, 12],
      },
      {
        name: "UTI Nifty 50 Index Mutual Fund",
        type: "💼 Index Mutual Fund",
        yield: "12.4% p.a. (5-Yr CAGR)",
        risk: "Moderate Risk",
        volatility: "Moderate-High",
        lockin: "None",
        desc: "Diversified index pool allocating directly into the top 50 behemoth Indian companies like HDFC, Reliance, Tata.",
        learnTerm: "Mutual Fund",
        link: "https://groww.in/mutual-funds/uti-nifty-index-fund-direct-growth",
        platform: "Groww Mutual Funds",
        regulator: "✓ SEBI & AMFI Registered",
        expectedCategory: [11, 12, 13, 14, 15],
      },
      {
        name: "Parag Parikh Flexi Cap Fund",
        type: "💼 Flexi-Cap Mutual Fund",
        yield: "17.8% p.a. (5-Yr CAGR)",
        risk: "High Growth Risk",
        volatility: "High",
        lockin: "None",
        desc: "Top-performing active mutual fund investing in Indian blue-chips mixed with leading US tech giants.",
        learnTerm: "Mutual Fund",
        link: "https://groww.in/mutual-funds/parag-parikh-long-term-value-fund-direct-g",
        platform: "Groww Mutual Funds",
        regulator: "✓ SEBI & AMFI Registered",
        expectedCategory: [13, 14, 15, 16, 17, 18, 19, 20],
      },
      {
        name: "Motilal Oswal Nasdaq 100 ETF",
        type: "🌍 International ETF",
        yield: "20.8% p.a. (5-Yr CAGR)",
        risk: "Very High Volatility",
        volatility: "Very High",
        lockin: "None",
        desc: "Direct exposure to top 100 US tech giants (Nvidia, Tesla, Apple, Google, Microsoft) from India.",
        learnTerm: "Foreign Stocks",
        link: "https://groww.in/etfs/motilal-oswal-nasdaq-100-etf",
        platform: "Groww ETF Gateway",
        regulator: "✓ SEBI Compliant",
        expectedCategory: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
      },
    ];

    return assets.filter(
      (asset) =>
        asset.expectedCategory.includes(Math.round(expectedReturn)) ||
        (expectedReturn > 20 && asset.expectedCategory.includes(20))
    );
  };
  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-6 lg:p-8 pt-24 lg:pt-12 space-y-8">
        {/* LIVE MARKET TICKER STRIP */}
        <div className="bg-black/45 border border-white/5 p-2 rounded-2xl overflow-hidden relative z-10 flex gap-6 items-center select-none font-mono text-[10px]">
          <span className="text-cyan-400 font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Live Pulse:
          </span>
          <div className="flex gap-6 overflow-x-auto scrollbar-none py-0.5">
            {tickerData.map((item, idx) => (
              <span key={idx} className="flex items-center gap-2 shrink-0">
                <span className="text-slate-300 font-bold">{item.symbol}</span>
                <span className="text-white font-black">₹{item.price.toLocaleString("en-IN")}</span>
                <span className={`px-1.5 py-0.5 rounded font-black text-[9px] ${
                  item.change >= 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                }`}>
                  {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* DNA ONBOARDING MODAL */}
        {showDnaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="card max-w-lg w-full bg-slate-900 border border-violet-500/30 p-6 rounded-3xl space-y-6 shadow-2xl relative animate-scale-in">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="text-center">
                <span className="text-4xl">🧠</span>
                <h2 className="text-xl font-black text-white mt-2">AI Financial DNA Quiz</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Answer 5 quick scenarios to unlock your personalized learning path.
                </p>
              </div>

              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${(dnaStep / 5) * 100}%` }}
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-white leading-relaxed">
                  Question ${dnaStep} of 5: ${dnaQuestions[dnaStep - 1]?.q}
                </p>

                <div className="flex flex-col gap-2.5">
                  {dnaQuestions[dnaStep - 1]?.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectDnaAnswer(opt.type)}
                      className="p-3 bg-white/5 border border-white/5 hover:border-violet-500/30 text-left text-xs font-bold text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition duration-200 cursor-pointer"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-center text-[9px] text-slate-500 font-mono">
                Safe Saver • Balanced Builder • Risk Taker
              </div>
            </div>
          </div>
        )}

        {/* LearnHub Page Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              LearnHub <span className="text-xs bg-violet-500/25 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full font-mono font-bold">44 Modules</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Master financial concepts step-by-step with interactive simulations.</p>
          </div>
          {financialDna && (
            <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3.5 py-1.5 rounded-2xl animate-fade-in">
              <span className="text-xs text-slate-400">🧠 DNA Match:</span>
              <span className="text-xs font-black text-violet-400">{financialDna}</span>
              <button 
                onClick={() => {
                  setDnaStep(1);
                  setDnaAnswers([]);
                  setShowDnaModal(true);
                }} 
                className="text-[9px] underline text-slate-400 hover:text-white font-bold ml-1.5 cursor-pointer"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>

        {/* WEALTH LOSS CLOCK HERO */}
        <div className="bg-gradient-to-r from-red-500/10 via-slate-900/90 to-amber-500/10 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 animate-pulse">⏰</span>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Real-Time Wealth Loss Clock</span>
                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">INFLATION ALERT</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Storing money in a regular savings account (earning 3% p.a.) loses purchase value due to inflation (6% p.a. default).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 bg-black/45 p-4 rounded-2xl border border-white/5 font-mono text-xs">
            <div className="flex flex-col items-center">
              <label className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Your Savings</label>
              <input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-white/5 border border-white/10 focus:border-red-500/40 text-white font-black w-28 px-3 py-1.5 rounded-xl text-center outline-none transition focus:ring-1 focus:ring-red-500/30 font-mono mt-1.5"
              />
            </div>
            <div className="border-l border-white/5 pl-6 text-left">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Lost Since Page Opened</span>
              <span className="text-base font-black text-red-400 font-mono block mt-2">
                ₹{lostWealth.toFixed(5)}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveSubTab("architect");
                setExpectedReturn(12);
                toast.success("Let's project how index mutual funds beat this loss! 📈");
              }}
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              Protect My Cash 🛡️
            </button>
          </div>
        </div>

        {activeLesson && (
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-cyan-500/10 border border-amber-500/30 p-5 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Blurry glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full filter blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 mb-2 animate-fade-in shadow-lg" style={{paddingBottom: "12px"}}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
                    {activeLesson.emoji || "🎓"}
                  </div>
                  <div>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
                      Active Graded Lesson
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {activeLesson.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-black/45 border border-white/10 p-0.5 rounded-xl gap-0.5 shrink-0">
                    <button
                      onClick={() => setAudioLang("en")}
                      className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${
                        audioLang === "en"
                          ? "bg-violet-600 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                    <button
                      onClick={() => setAudioLang("ta")}
                      className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${
                        audioLang === "ta"
                          ? "bg-violet-600 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🇮🇳 தமிழ் (TA)
                    </button>
                    <button
                      onClick={() => setAudioLang("tanglish")}
                      className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all ${
                        audioLang === "tanglish"
                          ? "bg-violet-600 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      💬 Tanglish
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const text = multilingualAcademy[audioLang]?.[activeLesson.id]?.concept || "";
                      const speechText = text + ". " + (multilingualAcademy[audioLang]?.[activeLesson.id]?.analogy || "");
                      speakTerm(activeLesson.title, speechText);
                    }}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all ${
                      isSpeaking
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                        : "bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {isSpeaking ? "⏹️ Stop" : "🔊 Audio Guide"}
                  </button>
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="px-3.5 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setExplain5yo(!explain5yo)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      explain5yo
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    👶 5-Yo Mode
                  </button>
                  <button
                    onClick={handleCompleteActiveLesson}
                    className={`px-4.5 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all transform hover:scale-[1.02] ${
                      lessonActionCompleted
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-black shadow-[0_4px_20px_rgba(16,185,129,0.35)] animate-bounce"
                        : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-[0_4px_15px_rgba(245,158,11,0.25)]"
                    }`}
                  >
                    {lessonActionCompleted
                      ? "🎉 Goal Met! Claim +"
                      : "Complete & Claim +"}{" "}
                    {activeLesson.coins}🪙
                  </button>
                </div>
              </div>

              {/* Interactive Audio Controls & Live Subtitles Bar */}
              {isSpeaking && (
                <div className="bg-black/60 border border-violet-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-lg">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                    </span>
                    <div className="text-[10px] text-slate-300 font-mono text-left leading-relaxed">
                      <strong className="text-violet-400 uppercase font-black tracking-wider block mb-0.5">
                        💬 Live Audio Guide Captions:
                      </strong>
                      <span className="italic">"${activeSpeechText}"</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 bg-white/5 p-2 rounded-xl border border-white/5 self-end md:self-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 font-mono uppercase">
                        Speed: ${speechRate.toFixed(2)}x
                      </span>
                      <input
                        type="range"
                        min="0.7"
                        max="1.5"
                        step="0.1"
                        value={speechRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSpeechRate(val);
                          if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            speakTerm(activeLesson.title, activeSpeechText);
                          }
                        }}
                        className="w-20 accent-violet-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 font-mono uppercase">
                        Pitch: ${speechPitch.toFixed(2)}x
                      </span>
                      <input
                        type="range"
                        min="0.8"
                        max="1.2"
                        step="0.1"
                        value={speechPitch}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSpeechPitch(val);
                          if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            speakTerm(activeLesson.title, activeSpeechText);
                          }
                        }}
                        className="w-20 accent-violet-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Glossary Card Popover */}
              {inlineTerm && (() => {
                const termObj = glossary.find(g => g.term === inlineTerm);
                if (!termObj) return null;
                const enrichment = getGlossaryEnrichment(inlineTerm);
                const isStarred = bookmarkedTerms.includes(inlineTerm);
                const isMastered = masteredTerms.includes(inlineTerm);
                return (
                  <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-2xl shadow-xl space-y-3 relative z-30 animate-scale-in text-left text-xs backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-cyan-300 text-sm">{termObj.term}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); speakTerm(termObj.term, termObj.short); }}
                          className="text-[10px] p-1 hover:bg-cyan-500/10 rounded transition text-cyan-400 hover:text-cyan-300 cursor-pointer"
                          title="Speak Pronunciation"
                        >
                          🔊
                        </button>
                        <span className="text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase font-black">{termObj.category}</span>
                      </div>
                      <button
                        onClick={() => setInlineTerm(null)}
                        className="text-slate-400 hover:text-white w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-white font-extrabold leading-normal">{termObj.short}</p>
                    <p className="text-slate-400 leading-relaxed font-normal">{termObj.desc}</p>
                    {enrichment.example && (
                      <div className="bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20 text-amber-200">
                        <strong className="text-[9px] uppercase tracking-wider block font-mono text-amber-400 mb-0.5">💡 Concrete Example</strong>
                        <span className="leading-relaxed font-medium">{enrichment.example}</span>
                      </div>
                    )}
                    {enrichment.memoryHook && (
                      <div className="bg-pink-500/5 p-2.5 rounded-xl border border-pink-500/20 text-pink-300">
                        <strong className="text-[9px] uppercase tracking-wider block font-mono text-pink-400 mb-0.5">🧠 Mnemonic Anchor</strong>
                        <span className="leading-relaxed font-medium">{enrichment.memoryHook}</span>
                      </div>
                    )}
                    {enrichment.confusedWith && (
                      <div className="bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/20 text-rose-300">
                        <strong className="text-[9px] uppercase tracking-wider block font-mono text-rose-400 mb-0.5">⚠️ Confusion Alert</strong>
                        <span className="leading-relaxed font-medium">
                          Often confused with{" "}
                          <span
                            className="font-extrabold underline cursor-pointer hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setComparisonModalTermA(inlineTerm);
                              setComparisonModalTermB(enrichment.confusedWith);
                              setShowComparisonModal(true);
                            }}
                          >
                            {enrichment.confusedWith}
                          </span>. Click to compare.
                        </span>
                      </div>
                    )}
                    {enrichment.relatedTerms && enrichment.relatedTerms.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-[8px] uppercase tracking-wider block font-mono text-slate-500">🕸️ Related Terms</strong>
                        <div className="flex flex-wrap gap-1.5">
                          {enrichment.relatedTerms.map(rt => (
                            <button
                              key={rt}
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlineTerm(rt);
                              }}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 text-[9px] text-slate-350 rounded-lg font-bold transition cursor-pointer"
                            >
                              {rt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => toggleBookmark(inlineTerm)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        {isStarred ? "⭐ Bookmarked" : "☆ Bookmark"}
                      </button>
                      <button
                        onClick={() => {
                          const next = isMastered ? masteredTerms.filter(t => t !== inlineTerm) : [...masteredTerms, inlineTerm];
                          setMasteredTerms(next);
                          localStorage.setItem("finbuddy_mastered_terms", JSON.stringify(next));
                          toast.success(isMastered ? `Removed "${inlineTerm}" from mastered!` : `Mastered "${inlineTerm}"! 🎓`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                          isMastered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-cyan-500 text-black font-black"
                        }`}
                      >
                        {isMastered ? "✓ Mastered" : "🎓 Mark as Mastered"}
                      </button>
                      <button
                        onClick={() => {
                          handleExplainTerm(inlineTerm);
                          setInlineTerm(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black transition cursor-pointer"
                      >
                        🧠 AI Deep Dive →
                      </button>
                    </div>
                  </div>
                );
              })()}

                            {/* Comprehensive 3-Column Interactive Academy Textbook or Quiz */}
              {lessonQuizActive ? (() => {
                const lessonTerms = lessonGlossaryMapping[activeLesson.id] || [];
                const activeTerm = lessonTerms[quizCardIndex];
                const termObj = glossary.find(g => g.term === activeTerm) || { term: activeTerm, short: "Definition placeholder", desc: "" };
                const enrichment = getGlossaryEnrichment(activeTerm);

                // MCQ choice memoization
                const mcqChoices = (() => {
                  const correct = activeTerm;
                  const category = termObj.category;
                  let others = glossary.filter(g => g.term !== correct && g.category === category).map(g => g.term);
                  if (others.length < 3) {
                    others = [...others, ...glossary.filter(g => g.term !== correct).map(g => g.term)];
                  }
                  const confused = enrichment?.confusedWith;
                  if (confused && others.includes(confused)) {
                    others = [confused, ...others.filter(t => t !== confused)];
                  }
                  const uniqueOthers = [...new Set(others)].slice(0, 3);
                  const allRaw = [correct, ...uniqueOthers];
                  const seed = correct.charCodeAt(0) || 1;
                  return allRaw.sort((a, b) => {
                    const hashA = (a.charCodeAt(0) * seed) % 7;
                    const hashB = (b.charCodeAt(0) * seed) % 7;
                    return hashA - hashB;
                  });
                })();

                const blankedDesc = (() => {
                  const correct = activeTerm;
                  const descText = termObj.short || "This term represents...";
                  const regex = new RegExp(`\\b(${correct.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})\\b`, 'gi');
                  let res = descText.replace(regex, "______");
                  if (!res.includes("______")) {
                    res = "______ is defined as: " + descText;
                  }
                  return res;
                })();

                return (
                  <div className="max-w-md mx-auto py-4 animate-scale-in text-center space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-cyan-500/25 text-cyan-300 px-3 py-1 rounded-full font-black uppercase tracking-wider font-mono">
                        🎓 Lesson Vocab Mastery Quiz (${quizCardIndex + 1}/${lessonTerms.length})
                      </span>
                      <h4 className="text-sm font-black text-white mt-2">Test your memory of key terms!</h4>
                    </div>

                    {/* Quiz Mode Selector */}
                    <div className="flex justify-center gap-1.5 p-1 bg-slate-900/60 border border-white/5 rounded-xl max-w-xs mx-auto mb-1">
                      {[
                        { id: "flashcard", label: "🃏 Flash" },
                        { id: "mcq", label: "🔘 MCQ" },
                        { id: "fillblank", label: "✏️ Blank" }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setQuizMode(m.id);
                            setQuizIsAnswered(false);
                            setQuizSelectedAnswer(null);
                            setQuizTextAnswer("");
                            setQuizIsCorrect(false);
                            setQuizIsFirstTryCorrect(true);
                          }}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                            quizMode === m.id
                              ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/10"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Content Box */}
                    {quizMode === "flashcard" && (
                      <div
                        onClick={() => setQuizFlipped(!quizFlipped)}
                        className="perspective-1000 w-full h-56 cursor-pointer relative"
                      >
                        <div className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform ${quizFlipped ? "rotate-y-180" : ""}`}>
                          {/* Front */}
                          <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-cyan-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
                            <span className="text-[9px] font-mono text-cyan-400 block tracking-widest uppercase text-left">Term Card</span>
                            <div className="my-auto">
                              <span className="text-xs text-slate-400 block font-bold">What is the meaning of:</span>
                              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{termObj.term}</h3>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 block uppercase animate-pulse">Click to Reveal Answer 🔄</span>
                          </div>

                          {/* Back */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border-2 border-emerald-500/30 rounded-3xl p-5 flex flex-col justify-between shadow-2xl text-left">
                            <div className="flex justify-between items-center border-b border-white/5 pb-1">
                              <span className="text-[9px] font-mono text-emerald-400 block uppercase">Explanation</span>
                              <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-bold">{termObj.category}</span>
                            </div>
                            <div className="my-auto space-y-2 overflow-y-auto max-h-36 pr-1 scrollbar-thin">
                              <p className="text-xs text-white font-extrabold leading-normal">{termObj.short}</p>
                              {audioLang === "tanglish" && (() => {
                                const tanglishExplain = getSimpleExplanation(activeLesson?.id, "tanglish");
                                if (!tanglishExplain) return null;
                                return (
                                  <p className="text-xs text-cyan-300 italic font-semibold leading-relaxed bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10">
                                    🗣️ Tanglish: {tanglishExplain}
                                  </p>
                                );
                              })()}
                              {enrichment.memoryHook && (
                                <div className="bg-pink-500/5 p-2.5 rounded-lg border border-pink-500/10 text-[10px] text-pink-300 font-medium">
                                  <strong className="text-pink-450 font-bold">🧠 Mnemonic:</strong> {enrichment.memoryHook}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 block uppercase text-center mt-1">Click to Flip Back 🔄</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {quizMode === "mcq" && (
                      <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 shadow-2xl text-left space-y-3 min-h-[14rem] flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider block">Question</span>
                          <h4 className="text-xs text-white font-bold leading-relaxed mt-1">
                            Which term matches this description?<br/>
                            <span className="text-cyan-200 font-extrabold">"${termObj.short}"</span>
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {mcqChoices.map((choice, cIdx) => {
                            const isSelected = quizSelectedAnswer === choice;
                            const isCorrect = choice === activeTerm;
                            
                            let choiceStyle = "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 text-white";
                            if (quizIsAnswered) {
                              if (isCorrect) {
                                choiceStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-350 font-bold";
                              } else if (isSelected) {
                                choiceStyle = "border-rose-500 bg-rose-500/15 text-rose-350";
                              } else {
                                choiceStyle = "border-white/5 bg-white/1 opacity-40 text-slate-400";
                              }
                            }

                            return (
                              <button
                                key={cIdx}
                                disabled={quizIsAnswered}
                                onClick={() => {
                                  setQuizSelectedAnswer(choice);
                                  setQuizIsAnswered(true);
                                  if (choice === activeTerm) {
                                    setQuizIsCorrect(true);
                                    if (quizIsFirstTryCorrect) {
                                      if (updateUser && user) {
                                        const newCoins = (user.virtualCoins || 0) + 5;
                                        updateUser({ virtualCoins: newCoins });
                                        api.put('/users/me', { virtualCoins: newCoins }).catch(() => {});
                                      }
                                      toast.success("Correct first try! +5 Coins! 🪙");
                                    } else {
                                      toast.success("Correct! 🎓");
                                    }
                                  } else {
                                    setQuizIsCorrect(false);
                                    setQuizIsFirstTryCorrect(false);
                                    setQuizWrongTerms(prev => [...new Set([...prev, activeTerm])]);
                                    toast.error("Incorrect! Study details and try again.");
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all duration-200 ${choiceStyle}`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {quizMode === "fillblank" && (
                      <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 shadow-2xl text-left space-y-3 min-h-[14rem] flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider block">Fill in the Blank</span>
                          <p className="text-xs text-white font-extrabold leading-relaxed">
                            "${blankedDesc}"
                          </p>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            disabled={quizIsAnswered && quizIsCorrect}
                            value={quizTextAnswer}
                            onChange={(e) => setQuizTextAnswer(e.target.value)}
                            placeholder="Type the exact financial term..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                          />

                          {!quizIsCorrect ? (
                            <button
                              onClick={() => {
                                const cleanInput = quizTextAnswer.trim().toLowerCase();
                                const cleanCorrect = activeTerm.toLowerCase();
                                const isMatch = cleanInput === cleanCorrect;
                                setQuizIsAnswered(true);
                                if (isMatch) {
                                  setQuizIsCorrect(true);
                                  if (quizIsFirstTryCorrect) {
                                    if (updateUser && user) {
                                      const newCoins = (user.virtualCoins || 0) + 5;
                                      updateUser({ virtualCoins: newCoins });
                                      api.put('/users/me', { virtualCoins: newCoins }).catch(() => {});
                                    }
                                    toast.success("Correct first try! +5 Coins! 🪙");
                                  } else {
                                    toast.success("Correct! 🎓");
                                  }
                                } else {
                                  setQuizIsCorrect(false);
                                  setQuizIsFirstTryCorrect(false);
                                  setQuizWrongTerms(prev => [...new Set([...prev, activeTerm])]);
                                  toast.error("Not quite match! Check details and try again.");
                                }
                              }}
                              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-xl transition cursor-pointer"
                            >
                              Check Answer
                            </button>
                          ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl text-center text-xs font-bold font-mono">
                              ✓ Correct Answer!
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Explainer / Mnemonic Reveal if Answered */}
                    {((quizMode === "mcq" || quizMode === "fillblank") && quizIsAnswered) && (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-left text-xs animate-fade-in space-y-2">
                        <div>
                          <strong className="text-[10px] uppercase font-mono text-cyan-400">💡 Term Details</strong>
                          <h5 className="text-white font-extrabold mt-0.5">{termObj.term}</h5>
                          <p className="text-slate-300 font-normal leading-relaxed mt-0.5">{termObj.desc || termObj.short}</p>
                        </div>
                        {enrichment.memoryHook && (
                          <div className="bg-pink-500/5 border border-pink-500/10 p-2 rounded-xl text-pink-300 font-medium leading-relaxed">
                            <strong className="text-pink-400 font-mono text-[9px] uppercase tracking-wider block">🧠 Mnemonic Hook</strong>
                            {enrichment.memoryHook}
                          </div>
                        )}
                        {enrichment.confusedWith && (
                          <div className="bg-red-500/5 border border-red-500/15 p-2 rounded-xl text-red-300 font-medium leading-relaxed">
                            <strong className="text-red-400 font-mono text-[9px] uppercase tracking-wider block">⚠️ Confusion Alert</strong>
                            Often confused with: <span className="font-bold underline cursor-pointer hover:text-white" onClick={() => {
                              setComparisonModalTermA(activeTerm);
                              setComparisonModalTermB(enrichment.confusedWith);
                              setShowComparisonModal(true);
                            }}>{enrichment.confusedWith}</span>. (Click to compare side-by-side)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between items-center max-w-xs mx-auto gap-3 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuizFlipped(!quizFlipped);
                          setQuizIsAnswered(false);
                          setQuizSelectedAnswer(null);
                          setQuizTextAnswer("");
                          setQuizIsCorrect(false);
                          setQuizIsFirstTryCorrect(true);
                        }}
                        className="flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-[10px] text-slate-350 font-bold transition cursor-pointer"
                      >
                        Reset Question
                      </button>
                      <button
                        disabled={quizMode !== "flashcard" && !quizIsCorrect}
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          if (quizCardIndex < lessonTerms.length - 1) {
                            setQuizCardIndex(prev => prev + 1);
                            setQuizFlipped(false);
                            setQuizIsAnswered(false);
                            setQuizSelectedAnswer(null);
                            setQuizTextAnswer("");
                            setQuizIsCorrect(false);
                            setQuizIsFirstTryCorrect(true);
                          } else {
                            // Finish Quiz
                            const newMastered = [...new Set([...masteredTerms, ...lessonTerms])];
                            setMasteredTerms(newMastered);
                            localStorage.setItem("finbuddy_mastered_terms", JSON.stringify(newMastered));
                            
                            // Log study activity & update SRS schedules
                            lessonTerms.forEach(term => {
                              const gotWrong = quizWrongTerms.includes(term);
                              updateSRSSchedule(term, !gotWrong);
                              logStudyActivity("mastered_term", term);
                            });
                            logStudyActivity("quiz_passed", activeLesson.id);

                            if (updateUser && user) {
                              const newCoins = (user.virtualCoins || 0) + 15;
                              updateUser({ virtualCoins: newCoins });
                              api.put('/users/me', { virtualCoins: newCoins }).catch(() => {});
                            }
                            
                            toast.success("Vocabulary Quiz Passed! +15 Coins & Terms Mastered! 🏆", { icon: "🎓" });
                            
                            setLessonQuizActive(false);
                            setActiveLesson(null);
                            setLessonActionCompleted(false);
                            setQuizWrongTerms([]);
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          (quizMode === "flashcard" ? quizFlipped : quizIsCorrect)
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/15"
                            : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        {quizCardIndex < lessonTerms.length - 1 ? "Next Term →" : "Finish & Claim 🏆"}
                      </button>
                    </div>
                  </div>
                );
              })() : (<>
              {/* ═══════════════════════════════════════════════════════════
                  ANIMATED LESSON PANEL — Industry-Level Learning UI
                  Staggered entrance · Glow bars · Story cards · Goal reveal
                  ═══════════════════════════════════════════════════════════ */}
              <div className="space-y-3">

                {/* ── Row 1: Concept (full width) ── */}
                <div
                  key={activeLesson?.id + "-concept"}
                  className="lesson-panel-enter lesson-panel-enter-d1 relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-cyan-950/20 p-4 lesson-container-glow"
                >
                  {/* Floating ambient orb */}
                  <div className="lesson-orb-float absolute -top-8 -right-8 w-28 h-28 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

                  {/* Header row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center lesson-icon-enter lesson-icon-enter-d1 shrink-0">
                      <span className="text-base">💡</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono block lesson-neon-sweep">
                        {multilingualUi[audioLang]?.conceptHeader}
                      </span>
                    </div>
                    {/* Importance bar */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider hidden sm:block">Importance</span>
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden lesson-importance-glow">
                        <div
                          className="h-full rounded-full lesson-bar-fill bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ "--bar-target": "88%" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Concept text */}
                  <div className="lesson-step-enter" style={{ animationDelay: "0.2s" }}>
                    {explain5yo ? (
                      <p className="text-amber-200 leading-relaxed font-bold text-[12px]">
                        {renderWithGlossaryLinks(getSimpleExplanation(activeLesson.id, audioLang), setInlineTerm)}
                      </p>
                    ) : (
                      <p className="text-slate-100 leading-relaxed font-semibold text-[12px]">
                        {renderWithGlossaryLinks(multilingualAcademy[audioLang]?.[activeLesson.id]?.concept, setInlineTerm)}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Row 2: Two-column — Analogy + Why it Matters ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Analogy Story Card */}
                  <div
                    key={activeLesson?.id + "-analogy"}
                    className="lesson-panel-enter lesson-panel-enter-d2 relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/25 via-amber-950/10 to-slate-900/60 p-4"
                  >
                    {/* Decorative grain */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="lesson-orb-float absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-amber-500/6 blur-2xl pointer-events-none" style={{ animationDelay: "1.2s" }} />

                    {/* Story header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center lesson-icon-enter lesson-icon-enter-d2 shrink-0">
                        <span className="text-sm">🎓</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono">
                        {multilingualUi[audioLang]?.analogyHeader}
                      </span>
                    </div>

                    {/* Story text with left border accent */}
                    <div className="lesson-step-enter pl-3 border-l-2 border-amber-500/40" style={{ animationDelay: "0.32s" }}>
                      <p className="text-amber-200/95 leading-relaxed font-medium text-[11px]">
                        {renderWithGlossaryLinks(multilingualAcademy[audioLang]?.[activeLesson.id]?.analogy, setInlineTerm)}
                      </p>
                    </div>

                    {/* Story type badge */}
                    <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/8 border border-amber-500/15">
                      <span className="text-[8px] text-amber-500 font-mono font-black uppercase tracking-wider">📖 Story Analogy</span>
                    </div>
                  </div>

                  {/* Why It Matters Card */}
                  <div
                    key={activeLesson?.id + "-why"}
                    className="lesson-panel-enter lesson-panel-enter-d3 relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-slate-900/70 to-slate-900/60 p-4"
                  >
                    <div className="lesson-orb-float absolute -top-6 -right-6 w-20 h-20 rounded-full bg-emerald-500/6 blur-2xl pointer-events-none" style={{ animationDelay: "0.7s" }} />

                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center lesson-icon-enter shrink-0" style={{ animationDelay: "0.38s" }}>
                        <span className="text-sm">📈</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                        {multilingualUi[audioLang]?.whyHeader}
                      </span>
                    </div>

                    {/* Why text */}
                    <div className="lesson-step-enter" style={{ animationDelay: "0.38s" }}>
                      <p className="text-slate-200 leading-relaxed text-[11px] font-medium">
                        {renderWithGlossaryLinks(multilingualAcademy[audioLang]?.[activeLesson.id]?.whyMatters, setInlineTerm)}
                      </p>
                    </div>

                    {/* Impact meter */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Wealth Impact</span>
                        <span className="text-[8px] text-emerald-400 font-mono font-bold">HIGH</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full lesson-bar-fill bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{ "--bar-target": "75%", animationDelay: "0.7s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Row 3: Goal Action Card (full width) ── */}
                <div
                  key={activeLesson?.id + "-goal"}
                  className="lesson-panel-enter lesson-panel-enter-d4 relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-slate-900/70 to-slate-900/60 p-4"
                >
                  <div className="lesson-orb-float absolute -bottom-8 right-16 w-24 h-24 rounded-full bg-violet-500/6 blur-2xl pointer-events-none" style={{ animationDelay: "2s" }} />

                  <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                    {/* Left: Icon + label */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center lesson-icon-enter shrink-0" style={{ animationDelay: "0.45s" }}>
                        <span className="text-lg">🎯</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 font-mono block">
                          {multilingualUi[audioLang]?.goalHeader}
                        </span>
                        <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">Practice Target</span>
                      </div>
                    </div>

                    {/* Goal text */}
                    <div className="lesson-step-enter flex-1 min-w-0" style={{ animationDelay: "0.5s" }}>
                      <p className="text-violet-100 leading-relaxed font-bold text-[12px]">
                        {renderWithGlossaryLinks(multilingualAcademy[audioLang]?.[activeLesson.id]?.actionGoal, setInlineTerm)}
                      </p>
                    </div>

                    {/* Simulator badge */}
                    <div className="lesson-goal-ripple shrink-0 self-center">
                      <div className="bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/35 px-3 py-2 rounded-xl text-[9px] text-violet-300 font-black uppercase font-mono tracking-wider text-center whitespace-nowrap shadow-[0_0_16px_rgba(139,92,246,0.15)]">
                        ⚡ {multilingualUi[audioLang]?.simulatorBadge}
                      </div>
                    </div>
                  </div>

                  {/* Progress track bar (decorative, matches lesson station) */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full lesson-bar-fill bg-gradient-to-r from-violet-500 to-indigo-400"
                        style={{ "--bar-target": "60%", animationDelay: "0.8s" }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono shrink-0 uppercase tracking-wider">Use simulator to complete →</span>
                  </div>
                </div>

              </div>

              {/* Shimmer loading for news */}
              {newsLoading && (
                <div className="mt-5 p-5 bg-gradient-to-br from-[#1a1813] to-[#110f0b] rounded-2xl border border-amber-500/5 animate-pulse">
                  <div className="flex justify-between items-center border-b border-amber-500/10 pb-2.5 mb-3">
                    <div className="h-4 w-32 bg-amber-500/10 rounded"></div>
                    <div className="h-3 w-16 bg-amber-500/5 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-5 bg-amber-500/10 rounded w-5/6"></div>
                    <div className="h-3 bg-amber-500/5 rounded w-full"></div>
                    <div className="h-3 bg-amber-500/5 rounded w-4/5"></div>
                  </div>
                </div>
              )}

              {/* Vintage Newspaper Snippet */}
              {termNews && !newsLoading && (
                <div className="mt-5 p-5 bg-gradient-to-br from-[#1e1b15] to-[#14120e] rounded-2xl border border-amber-500/15 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group transition-all duration-300 hover:border-amber-500/30">
                  {/* Subtle paper grain texture pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  
                  {/* Newspaper Header */}
                  <div className="flex justify-between items-center border-b border-amber-500/20 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono font-black uppercase px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                        📰 {termNews.source || "FINANCIAL EXPRESS"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakTerm(termNews.headline, termNews.summary); }}
                        className="text-[10px] px-2 py-0.5 hover:bg-amber-500/10 rounded transition-colors text-amber-500 hover:text-amber-400 font-mono font-bold flex items-center gap-1 cursor-pointer"
                        title="Speak News"
                      >
                        🔊 Listen
                      </button>
                    </div>
                    <span className="text-[9px] font-mono text-amber-500/60 font-bold">
                      {termNews.date}
                    </span>
                  </div>

                  {/* Newspaper Body */}
                  <div className="space-y-2.5">
                    {/* Headline */}
                    <h4 className="text-sm md:text-base text-amber-100 font-serif font-black tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                      "{termNews.headline}"
                    </h4>
                    
                    {/* Snippet / Description */}
                    <p className="text-xs text-amber-200/80 leading-relaxed font-mono italic pl-3 border-l border-amber-500/30">
                      {termNews.summary}
                    </p>
                  </div>

                  {/* Market Impact Prediction Mini-Game */}
                  <div className="mt-4 pt-3 border-t border-amber-500/10 text-xs">
                    <p className="text-amber-300/95 font-mono font-black mb-2 flex items-center gap-1.5">
                      🎮 Market Impact Challenge: How does this news affect the market?
                    </p>
                    
                    {(() => {
                      const termKey = (termNews.term || activeLesson.title || '');
                      const prediction = newsPredictions[termKey];
                      const { correctAnswer, explanation } = getNewsImpactInfo(termKey);
                      
                      if (prediction) {
                        const isCorrect = prediction.selected === correctAnswer;
                        return (
                          <div className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all duration-300 ${
                            isCorrect 
                              ? "bg-emerald-950/20 border-emerald-500/25 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                              : "bg-red-950/20 border-red-500/25 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                          }`}>
                            <div className="flex justify-between items-center mb-1.5 font-black font-mono uppercase tracking-wider text-[9px]">
                              <span>{isCorrect ? "✅ Correct Prediction! (+5 Coins)" : "❌ Incorrect Prediction"}</span>
                              <span className="opacity-75">Your Choice: {prediction.selected.toUpperCase()}</span>
                            </div>
                            <p className="font-mono text-slate-350">{explanation}</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={() => handlePredictImpact(termKey, 'bullish', correctAnswer)}
                            className="py-2 px-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 font-mono font-black text-[10px] tracking-wider uppercase active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            📈 Bullish
                          </button>
                          <button
                            onClick={() => handlePredictImpact(termKey, 'bearish', correctAnswer)}
                            className="py-2 px-3 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/15 text-red-400 font-mono font-black text-[10px] tracking-wider uppercase active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            📉 Bearish
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Watermark/stamp */}
                  <div className="absolute -right-3 -bottom-3 text-[50px] font-serif font-black text-amber-500/[0.04] pointer-events-none select-none uppercase tracking-widest rotate-12">
                    TRENDING
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        )}

        {/* Quick Utility Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 gap-1.5 overflow-x-auto scrollbar-none flex-nowrap">
          {[
            {
              id: "architect",
              label: "Portfolio Architect",
              color: "border-emerald-500 text-emerald-400",
              icon: Layers,
            },
            {
              id: "glossary",
              label: "AI Glossary",
              color: "border-cyan-500 text-cyan-400",
              icon: BookOpen,
            },
            {
              id: "quiz",
              label: "Quiz Arena",
              color: "border-amber-500 text-amber-400",
              icon: Award,
            },
            {
              id: "survival",
              label: "Survival Mode",
              color: "border-red-500 text-red-400",
              icon: ShieldAlert,
            },
            {
              id: "badges",
              label: "Certificates",
              color: "border-cyan-500 text-cyan-400",
              icon: GraduationCap,
            },
          ].map((tab) => {
            const recommendedTab = activeLesson
              ? ACADEMY_LESSONS.find((l) => l.id === activeLesson.id)?.subTab
              : null;
            const isRecommended = recommendedTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 py-2.5 px-4 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 border min-w-max shrink-0 md:min-w-0 ${
                  activeSubTab === tab.id
                    ? "bg-white/8 text-white border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
                    : isRecommended
                    ? "text-amber-400 bg-amber-500/5 animate-pulse border-dashed border-amber-500/20"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/2"
                }`}
              >
                <span className={`w-1 h-1 rounded-full shrink-0 ${
                  activeSubTab === tab.id
                    ? tab.id === "architect"
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : tab.id === "glossary"
                      ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                      : tab.id === "quiz"
                      ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                      : tab.id === "survival"
                      ? "bg-red-400 shadow-[0_0_8px_#f87171]"
                      : "bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                    : "bg-transparent"
                }`} />
                {tab.icon && React.createElement(tab.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                <span>{tab.label}</span>
                {isRecommended && (
                  <span className="ml-1 text-[8px] bg-amber-500/25 text-amber-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                    ⚡ PRACTICE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents Wrapper */}
        <div className="space-y-6">

          {/* A. PORTFOLIO ARCHITECT */}
          {activeSubTab === "architect" && (
            <div className="space-y-6 animate-fade-in">
              {/* Custom User Demographics Form */}
              <div className="card border-emerald-500/10 bg-white/2 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" /> Step 1: Input Your Financial Details
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold font-mono">
                    Personalized Allocation Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      Your Age
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="75"
                      value={userAge}
                      onChange={(e) => setUserAge(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                      <span>18</span>
                      <span className="text-emerald-400 font-mono">
                        {userAge} Years Old
                      </span>
                      <span>75</span>
                    </div>
                  </div>

                  <div className="space-y-1 col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      Monthly Savings Plan
                    </label>
                    <input
                      type="number"
                      value={monthlySavings}
                      onChange={(e) => setMonthlySavings(parseInt(e.target.value) || 0)}
                      className="input-dark py-1.5 px-3 text-xs text-white font-mono"
                      placeholder="e.g. ₹5,000"
                    />
                    <span className="text-[8px] text-slate-500">
                      Savings you invest monthly
                    </span>
                  </div>

                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      Your Risk Appetite Profile
                    </label>
                    <div className="flex bg-black/35 border border-white/5 p-1 rounded-xl gap-1">
                      {[
                        { id: "conservative", label: "🛡️ Safe" },
                        { id: "moderate", label: "⚖️ Balanced" },
                        { id: "aggressive", label: "🚀 Growth" },
                        { id: "tactical", label: "🔥 Wild" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setRiskTolerance(item.id)}
                          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
                            riskTolerance === item.id
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5 font-extrabold"
                              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* expectedReturn slider and future projection */}
              <div className="card space-y-4 border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">
                      AI Return Screener & SIP Projections
                    </span>
                    <h3 className="font-black text-xl text-white mt-2">
                      Goal-Based Expected Returns Screener
                    </h3>
                    <p className="text-xs text-slate-400">
                      Slide expected returns. Observe calculated compound growth and matching assets list below.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Expected Returns
                    </p>
                    <p className="text-3xl font-black text-emerald-400 font-mono">
                      {expectedReturn}% <span className="text-xs font-normal">p.a.</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-3">
                    <div>
                      <input
                        type="range"
                        min="6"
                        max="20"
                        value={expectedReturn}
                        onChange={(e) => setExpectedReturn(parseInt(e.target.value))}
                        className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>6% (Govt Bonds)</span>
                        <span>12% (Index Mutual Funds)</span>
                        <span>20% (Nasdaq/Growth)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>
                          SIP Duration:{" "}
                          <strong className="text-cyan-400 font-mono">
                            {investmentDuration} Years
                          </strong>
                        </span>
                        <span>Compound Freq: Monthly</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={investmentDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setInvestmentDuration(val);
                          if (activeLesson?.id === "l2" && val >= 15) {
                            setLessonActionCompleted(true);
                            toast.success("🎯 Compound Goal met! Click 'Claim' above! 🏆");
                          }
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="bg-black/45 border border-white/5 p-5 rounded-2xl space-y-3 font-mono text-xs shadow-inner">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Invested Principal:</span>
                      <span className="font-bold text-slate-200">
                        ₹{sipCalculatedValue.invested.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Wealth Gained:</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        +₹{sipCalculatedValue.gained.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold text-sm text-white">
                      <span className="text-cyan-400">Future Value:</span>
                      <span className="text-cyan-400 text-base font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                        ₹{sipCalculatedValue.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie Chart Representation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white/2 p-6 rounded-3xl border border-white/5">
                <div className="flex flex-col justify-center items-center space-y-2 bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Optimized Asset Portfolio Pie
                  </p>
                  <div className="w-full h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={62}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px" }}
                          itemStyle={{ color: "#fff", fontSize: "10px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center pt-2">
                    {pieData.map((entry, index) => (
                      <span
                        key={index}
                        className="text-[8px] font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                        style={{
                          color: entry.color,
                          backgroundColor: `${entry.color}15`,
                          borderColor: `${entry.color}30`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: {entry.value}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> FinGuru Allocation Rationale
                    </p>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {riskTolerance === "conservative"
                        ? `Based on your age of ${userAge} and safe wealth profile, we heavily favor stable fixed income bonds (${portfolioSplit.bonds}%). This ensures your principal capital stays 100% protected, cushioning against standard stock market drawdowns.`
                        : riskTolerance === "aggressive" || riskTolerance === "tactical"
                        ? `At age ${userAge} with high risk appetite, we aggressive-tilt ${portfolioSplit.mutualFunds + portfolioSplit.foreignStocks}% into equities (Domestic Mutual Funds & US Tech Stocks). This triggers maximum compound growth to build long-term generational wealth.`
                        : `Since you are a balanced ${userAge}-year-old investor, our portfolio builder divides assets evenly: ${portfolioSplit.mutualFunds}% in growth-seeking Mutual Funds, ${portfolioSplit.bonds}% in stable, high-yield Government bonds, and ${portfolioSplit.gold}% in Sovereign Gold to serve as a safety inflation hedge.`}
                    </p>
                  </div>
                  <div className="border-t border-white/5 pt-3 mt-3 flex justify-between items-center gap-2 font-mono">
                    <span className="text-[9px] text-slate-500 font-black">Asset Category:</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                      {expectedReturn <= 9
                        ? "🛡️ Conservative Debt"
                        : expectedReturn <= 15
                        ? "⚖️ Balanced Growth"
                        : "🔥 Aggressive Equity"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment directory */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-white flex justify-between items-center">
                  <span>🔍 Screened Verified Investment Directory</span>
                  <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    Govt Regulated & Verified
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getScreenedAssets().map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/2 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 bg-green-500/10 border-l border-b border-green-500/20 text-[8px] text-green-400 font-black px-2.5 py-0.5 rounded-bl-lg">
                        {item.regulator}
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {item.type}
                        </span>
                        <h4 className="font-black text-sm text-white mt-2 group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                        <div className="grid grid-cols-2 gap-2 bg-black/15 p-2.5 rounded-xl border border-white/5 my-2.5 text-[9px] text-slate-300 font-mono">
                          <div>
                            📈 Expected: <strong className="text-white">{item.yield}</strong>
                          </div>
                          <div>
                            🛡️ Risk: <strong className="text-white">{item.risk}</strong>
                          </div>
                          <div>
                            ⚡ Volatility: <strong className="text-white">{item.volatility}</strong>
                          </div>
                          <div>
                            🔑 Lock-in: <strong className="text-white">{item.lockin}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between items-center gap-2">
                        <button
                          onClick={() => handleExplainTerm(item.learnTerm)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                        >
                          ❓ Teach Me (AI Coach)
                        </button>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded hover:bg-white/10 flex items-center gap-1.5"
                        >
                          🔗 Invest on {item.platform}
                        </a>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
            {activeSubTab === "glossary" && (
              <GlossaryTab
                api={api}
                navigate={navigate}
                audioLang={audioLang}
                activeLesson={activeLesson}
                user={user}
                updateUser={updateUser}
                xpPoints={xpPoints}
                streakCount={streakCount}
                glossary={glossary}
                setGlossary={setGlossary}
                bookmarkedTerms={bookmarkedTerms}
                setBookmarkedTerms={setBookmarkedTerms}
                masteredTerms={masteredTerms}
                setMasteredTerms={setMasteredTerms}
                inlineTerm={inlineTerm}
                setInlineTerm={setInlineTerm}
                speakTerm={speakTerm}
                setComparisonModalTermA={setComparisonModalTermA}
                setComparisonModalTermB={setComparisonModalTermB}
                setShowComparisonModal={setShowComparisonModal}
                toggleBookmark={toggleBookmark}
              />
            )}


            {activeSubTab === "survival" && (
              <SurvivalMode
                api={api}
                navigate={navigate}
                audioLang={audioLang}
              />
            )}


            {activeSubTab === "quiz" && (
              <QuizArena
                api={api}
                activeLesson={activeLesson}
                audioLang={audioLang}
              />
            )}

                                                {/* F. CERTIFICATE & BADGES WALL */}
            {activeSubTab === "badges" && (
              <div className="card space-y-6 relative overflow-hidden border-cyan-500/10 bg-slate-950 rounded-3xl p-6 shadow-xl border text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl" />

                <div className="space-y-2 relative z-10">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-bold uppercase font-mono border border-cyan-500/20">
                    Certification Portal
                  </span>
                  <h3 className="font-black text-xl text-white">Academy Certificate Wall</h3>
                  <p className="text-xs text-slate-400">
                    Verify and download high-resolution verified credentials for completing specific modules.
                  </p>
                </div>

                {/* Input Name field */}
                <div className="bg-white/2 p-4 border border-white/5 rounded-2xl space-y-2 max-w-md">
                  <label className="text-[10px] text-slate-400 block font-mono uppercase font-bold">
                    Enter Name for Credentials:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    className="input-dark py-2.5 px-3 text-xs text-white"
                  />
                </div>

                {/* Credentials grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "sip", title: "SIP Compounding Master", desc: "For mastering early leverage, time value of money, and exponential compounding interest metrics.", icon: "📜" },
                    { id: "asset", title: "Asset Allocation Specialist", desc: "For mastering multi-asset diversification models, SGB gold buffers, and sovereign risk management.", icon: "🛡️" },
                    { id: "options", title: "Derivatives Expert", desc: "For mastering advanced call/put options writing, volatility hedging strategies, and leverage controls.", icon: "🔮" }
                  ].map((cert) => (
                    <div key={cert.id} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col justify-between h-48 transition-all hover:border-cyan-500/30 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-cyan-500/10 border-l border-b border-cyan-500/25 text-[8px] text-cyan-300 font-mono font-bold px-2 py-0.5 rounded-bl-lg">
                        VERIFIED
                      </div>
                      <div>
                        <span className="text-2xl">{cert.icon}</span>
                        <h4 className="font-extrabold text-sm text-white mt-2 group-hover:text-cyan-400 transition-colors">
                          {cert.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          {cert.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!certName.trim()) {
                            toast.error("Please enter a name for the certificate first!");
                            return;
                          }
                          downloadCertificate(certName.trim(), cert.title);
                        }}
                        className="btn-primary mt-3 text-[10px] py-2 w-full uppercase font-bold bg-cyan-500 hover:bg-cyan-600 cursor-pointer"
                      >
                        Download Certificate 🎓
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        <SectionGuide sectionId="/learn" />
      </main>

      {/* Confusion Buster Comparison Modal */}
      {showComparisonModal && (() => {
        const itemAObj = glossary.find(g => g.term === comparisonModalTermA);
        const itemBObj = glossary.find(g => g.term === comparisonModalTermB) || glossary.find(g => g.term === (getGlossaryEnrichment(comparisonModalTermA)?.confusedWith));
        
        if (!itemAObj) return null;
        
        const enrichA = getGlossaryEnrichment(itemAObj.term);
        const enrichB = itemBObj ? getGlossaryEnrichment(itemBObj.term) : null;
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-slate-950 border border-cyan-500/30 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative animate-scale-in text-left overflow-y-auto max-h-[90vh] space-y-4">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <span className="text-2xl">⚔️</span>
                <div>
                  <h3 className="text-base font-black text-white">Confusion Buster: Side-by-Side Comparison</h3>
                  <p className="text-[10px] text-slate-400">Clear up the mix-up between these similar concepts.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column A */}
                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-extrabold text-cyan-300 text-sm">{itemAObj.term}</span>
                    <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-mono uppercase font-black">{itemAObj.category}</span>
                  </div>
                  <p className="text-xs text-white font-extrabold leading-normal">{itemAObj.short}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{itemAObj.desc}</p>
                  
                  {enrichA.memoryHook && (
                    <div className="bg-pink-500/5 border border-pink-500/20 p-2.5 rounded-xl text-pink-300 text-[10px] font-medium leading-relaxed">
                      <strong className="block text-pink-400 font-mono text-[9px] uppercase tracking-wider mb-0.5">🧠 Memory Mnemonic</strong>
                      {enrichA.memoryHook}
                    </div>
                  )}
                  
                  {enrichA.example && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-amber-250 text-[10px] font-medium leading-relaxed">
                      <strong className="block text-amber-400 font-mono text-[9px] uppercase tracking-wider mb-0.5">💡 Concrete Example</strong>
                      {enrichA.example}
                    </div>
                  )}
                </div>

                {/* Column B */}
                {itemBObj ? (
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="font-extrabold text-cyan-300 text-sm">{itemBObj.term}</span>
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-mono uppercase font-black">{itemBObj.category}</span>
                    </div>
                    <p className="text-xs text-white font-extrabold leading-normal">{itemBObj.short}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{itemBObj.desc}</p>
                    
                    {enrichB && enrichB.memoryHook && (
                      <div className="bg-pink-500/5 border border-pink-500/20 p-2.5 rounded-xl text-pink-300 text-[10px] font-medium leading-relaxed">
                        <strong className="block text-pink-400 font-mono text-[9px] uppercase tracking-wider mb-0.5">🧠 Memory Mnemonic</strong>
                        {enrichB.memoryHook}
                      </div>
                    )}
                    
                    {enrichB && enrichB.example && (
                      <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-amber-250 text-[10px] font-medium leading-relaxed">
                        <strong className="block text-amber-400 font-mono text-[9px] uppercase tracking-wider mb-0.5">💡 Concrete Example</strong>
                        {enrichB.example}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-center text-slate-400 text-xs italic">
                    No comparison item mapped.
                  </div>
                )}
              </div>
              
              <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="px-5 py-2 text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition cursor-pointer"
                >
                  Got It, Thanks!
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    
    </div>
  );
};
};

export default LearnHub;
