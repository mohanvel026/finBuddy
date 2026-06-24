// client/src/pages/LearnHub.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { defaultGlossary, GLOSSARY_FORMULAS, glossaryEnrichments } from "../data/glossaryData";
import "./LabAnimations.css";


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

const Playground = () => {
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
  const [selectedRoadLesson, setSelectedRoadLesson] = useState(null);
  const [devUnlockAll, setDevUnlockAll] = useState(true);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [showGlossaryDrawer, setShowGlossaryDrawer] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategoryFilter, setGlossaryCategoryFilter] = useState("All");
  const [glossaryLetterFilter, setGlossaryLetterFilter] = useState("All");
  
  const [compareTermA, setCompareTermA] = useState(null);
  const [compareTermB, setCompareTermB] = useState(null);
  const [showComparisonPanel, setShowComparisonPanel] = useState(false);
  const [activeSpokenTerm, setActiveSpokenTerm] = useState(null);
  const [bookmarkedTerms, setBookmarkedTerms] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_bookmarked_terms");
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const toggleBookmark = (termName) => {
    setBookmarkedTerms((prev) => {
      const next = prev.includes(termName)
        ? prev.filter((t) => t !== termName)
        : [...prev, termName];
      localStorage.setItem("finbuddy_bookmarked_terms", JSON.stringify(next));
      toast(next.includes(termName) ? `Bookmarked "${termName}"! ⭐` : `Removed "${termName}" from bookmarks`, { icon: next.includes(termName) ? "⭐" : "🗑️" });
      return next;
    });
  };

  const handleToggleCompare = (termName) => {
    if (compareTermA === termName) {
      setCompareTermA(null);
    } else if (compareTermB === termName) {
      setCompareTermB(null);
    } else if (!compareTermA) {
      setCompareTermA(termName);
    } else if (!compareTermB) {
      setCompareTermB(termName);
    } else {
      setCompareTermB(termName);
    }
  };

  const speakTerm = (termName, definition) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    if (activeSpokenTerm === termName) {
      window.speechSynthesis.cancel();
      setActiveSpokenTerm(null);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `${termName}. ${definition}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase().includes("en")) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setActiveSpokenTerm(termName);
    utterance.onend = () => setActiveSpokenTerm(null);
    utterance.onerror = () => setActiveSpokenTerm(null);
    window.speechSynthesis.speak(utterance);
  };

  const renderLinkedText = (text) => {
    if (!text) return "";
    const terms = defaultGlossary.map(g => g.term);
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    const escapedTerms = sortedTerms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
    const parts = [];
    let lastIndex = 0;
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      if (matchIndex > lastIndex) {
        parts.push(text.slice(lastIndex, matchIndex));
      }
      const canonicalTerm = defaultGlossary.find(g => g.term.toLowerCase() === matchedText.toLowerCase())?.term || matchedText;
      parts.push(
        <span
          key={matchIndex}
          onClick={(e) => {
            e.stopPropagation();
            setGlossarySearch(canonicalTerm);
            setShowGlossaryDrawer(true);
            setShowComparisonPanel(false);
          }}
          className="underline decoration-cyan-400 decoration-2 underline-offset-2 hover:bg-cyan-500/20 text-cyan-300 font-extrabold cursor-pointer transition px-0.5 rounded"
          title={`Click to view "${canonicalTerm}" in Glossary`}
        >
          {matchedText}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };
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
  const [masteredTerms, setMasteredTerms] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_mastered_terms");
      return val ? JSON.parse(val) : [];
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

  // Survival Game States
  const [survivalStep, setSurvivalStep] = useState(0);
  const [survivalPortfolio, setSurvivalPortfolio] = useState(100000);
  const [survivalLog, setSurvivalLog] = useState([]);
  const [survivalRounds, setSurvivalRounds] = useState(DEFAULT_SURVIVAL_ROUNDS);
  const [loadingSurvival, setLoadingSurvival] = useState(false);

  const handleStartSurvival = async () => {
    setLoadingSurvival(true);
    setSurvivalLog([]);
    try {
      const res = await api.post("/learn/survival");
      if (res.data?.success && res.data?.rounds?.length === 5) {
        setSurvivalRounds(res.data.rounds);
        setSurvivalStep(1);
        setSurvivalPortfolio(100000);
        setSurvivalLog([`Round 1: AI Scenario active. (Balance: ₹1,00,000)`]);
      } else {
        throw new Error("Invalid survival rounds length");
      }
    } catch (e) {
      console.warn("AI Survival generation failed, using local simulation:", e);
      setSurvivalRounds(DEFAULT_SURVIVAL_ROUNDS);
      setSurvivalStep(1);
      setSurvivalPortfolio(100000);
      setSurvivalLog([`Round 1: Technical correction active. (Balance: ₹1,00,000)`]);
    } finally {
      setLoadingSurvival(false);
    }
  };

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

      s_1_1: "Cash flow na oru water slide mathiri. Inflow na water pump aaguradhu (earnings). Outflow na water leak aaguradhu (spending). Inflow-a eppovum strong-a vechuko!",
      s_1_2: "Taxes na oru chinna entry fee mathiri. Public playground slides and pools build panna government-ku pay panra fee.",
      s_1_3: "Risk vs reward na oru periya marathula yeruradhu mathiri. Romba high-la yerna sweet fruit kidaikum, aana slip aana adiyum perusa vilum!",
      s_1_4: "Global markets na oru periya sandhai (marketplace) mathiri, anga India, America, Japan merchants ellarum serndhu trade pannuvaanga!",
      s_2_1: "Compounding na oru seed podradhu mathiri. Seed maram aagi, maram neriya seeds tharum. Konja naal-la automatic-ah oru periya wealth forest-e valarum!",
      s_2_2: "Diversification na oru bag-la sun glasses-um rain coat-um sethu vechukuradhu mathiri. Ella weather-kum ready-ah irundha market change aanaalum safe!",
      s_2_3: "Inflation na unga cheese (purchasing power)-a daily night saapudra chinna mouse. Mouse saapudratha vida unga cheese-a namma fast-a valarkanum!",
      s_2_4: "Mutual Fund na oru bus-la ellarum ticket eduthu traveling panra mathiri. Ellar kittayum irundhu small money collect panni, expert driver safe-ah drive pannuvaru.",
      s_3_1: "Imagine oru periya pizza-la oru slice vangaradhu mathiri. Pizza shop romba famous aana, unga slice value perusagum, demand yerum!",
      s_3_2: "P/E ratio na toy price vs toy thara fun value. Toy price ₹100, aana actual valuation ₹1 na, idhu expensive!",
      s_3_3: "Mr. Market na mood swing partner. Sila naal super happy-ah irundhu high price solluvaru, sila naal dull-ah low price-ku sell pannuvaru. Avanga mood-a follow panna vendiyadhu illai!",
      s_3_4: "Audit na teacher paper correction panra mathiri. Company books-la correct figures kaatragla, illai cheat panragla nu check panra independent inspection.",
      s_4_1: "Options na oru house lock panna advance pay panra mathiri. House price double aana, namma pathi price-ku buy pannalaam. Price drop aana advance mattum loss aagum.",
      s_4_2: "Hedging na storm varadhuku munnaadi kudai vangaradhu mathiri. Small cost-la potential heavy loss varama protect panra risk management strategy.",
      s_4_3: "Short selling na friend kitta toy borrow panni ₹100-ku sell panradhu. Toy price ₹30-a korayum bodhu buy panni return panradhu. Balance ₹70 net profit!",
      s_4_4: "Leverage na heavy weight look-a lift panna lever use panra mathiri. Borrowed money vechhu periya positions trade panradhu. Win aana extra profit, loss aana heavy wipeout!",
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

      s_1_1: "Cash flow is like a water slide. Inflow is water pumping in (earnings). Outflow is water leaking out (spending). Keep the inflow stronger!",
      s_1_2: "Taxes are like a small entry fee everyone pays to build and repair the public playground slides, swings, and pools.",
      s_1_3: "Risk vs reward is like climbing a taller tree. The higher you climb, the sweeter the fruit, but the harder the fall if you slip!",
      s_1_4: "Global markets are like a massive marketplace where merchants from India, America, and Japan all trade together!",
      s_2_1: "Compounding is like planting a seed that grows a tree. The tree drops seeds, growing more trees. Soon you have a whole forest of wealth growing on its own!",
      s_2_2: "Diversification is like packing a rain jacket, sunglasses, and an umbrella in your bag. By spreading your choices, you are prepared for whatever weather the market brings!",
      s_2_3: "Inflation is like a sneaky little mouse that eats a tiny bite of your cheese (purchasing power) every night. Your money needs to grow faster than the mouse eats!",
      s_2_4: "A Mutual Fund is like renting a bus together with other passengers. Everyone chips in a small amount, and a professional driver steers the bus to the financial destination.",
      s_3_1: "Imagine buying a single slice of a giant, delicious pizza. If the pizza shop gets super popular and sells more, your slice becomes highly valuable to others.",
      s_3_2: "Price-to-Earnings (P/E) ratio is like a toy's price tag relative to how much fun it gives. If a toy costs ₹100 but only gives ₹1 of fun, it is overpriced!",
      s_3_3: "Mr. Market is a moody partner who offers to buy or sell businesses every day. Some days he is wildly optimistic and quotes high prices; other days he is depressed and quotes low prices. You don't have to follow his mood!",
      s_3_4: "An audit is like a school teacher grading a student's project. The auditor checks if the company's financial books are reporting the truth or just hiding bad grades.",
      s_4_1: "Options are like paying a small, non-refundable deposit to lock in the price of a house for 30 days. If house prices double, you buy cheap; if they crash, you walk away losing only the deposit.",
      s_4_2: "Hedging is like buying travel insurance before a flight. You pay a small fee so that if something goes wrong, you don't lose the value of your entire trip.",
      s_4_3: "Short selling is borrowing a toy from a friend, selling it immediately for ₹100, waiting for its price to drop to ₹30, buying it back cheap to return it, and keeping the ₹70 profit.",
      s_4_4: "Leverage is like using a lever to lift a heavy rock. Using borrowed money helps you trade bigger positions. It multiplies your gains if you are right, but wipes you out completely if you are wrong!",
    };

    if (lang === "tanglish") {
      return tanglishSimples[lessonId] || (englishSimples[lessonId] ? englishSimples[lessonId] : "This is a specialized topic in Tanglish!");
    }
    if (lang === "ta") {
      return englishSimples[lessonId] || "சிறப்பு நிதி கோட்பாடு.";
    }
    return englishSimples[lessonId] || "This is a specialized topic. It is like optimizing your toy box strategy to get maximum returns with minimum risk!";
  };

  const getStoryDetails = (nodeId, lang = "en") => {
    const storyText = getSimpleExplanation(nodeId, lang);
    
    // Parse chapter and story index from nodeId format "s_CHAPTER_INDEX"
    const match = nodeId.match(/^s_(\d+)_(\d+)$/);
    if (!match) {
      // Default fallback
      return {
        story: storyText,
        question: "What is the core concept here?",
        options: [
          { text: "The correct concept explanation", correct: true },
          { text: "An unrelated random distracter", correct: false },
          { text: "A secondary incorrect option", correct: false }
        ]
      };
    }
    
    const chapter = parseInt(match[1], 10);
    const index = parseInt(match[2], 10);

    // Chapter 1: Onboarding Basics
    if (chapter === 1) {
      if (index === 1) { // Cash Flow
        return {
          story: storyText,
          question: lang === "tanglish" 
            ? "Cash Flow oda core meaning enna?" 
            : "What is the core meaning of Cash Flow?",
          options: lang === "tanglish" ? [
            { text: "Pocket-kulla money in and out aaguradhu", correct: true },
            { text: "Credit card checks panra hidden bank fee", correct: false },
            { text: "Physical land-ku badhila gold trade panradhu", correct: false }
          ] : [
            { text: "Money going in & out of your pocket", correct: true },
            { text: "A hidden bank fee on credits", correct: false },
            { text: "Trading gold for physical land", correct: false }
          ]
        };
      }
      if (index === 2) { // Taxes
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Government-ku namma yen taxes pay pannrom?"
            : "Why do we pay taxes to the government?",
          options: lang === "tanglish" ? [
            { text: "Public roads, schools, and parks build panna", correct: true },
            { text: "Politicians personal gifts vangaradhuku", correct: false },
            { text: "Private electricity bills pay panna", correct: false }
          ] : [
            { text: "To fund public roads, schools, and parks", correct: true },
            { text: "To buy private gifts for politicians", correct: false },
            { text: "To pay for private electricity bills", correct: false }
          ]
        };
      }
      if (index === 3) { // Risk vs Reward
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Risk and Reward kulla enna relation iruku?"
            : "What is the relationship between Risk and Reward?",
          options: lang === "tanglish" ? [
            { text: "Adhiga potential reward venumna, risk-um high-a thaan irukum", correct: true },
            { text: "Low risk eppovum high returns guaranteed tharum", correct: false },
            { text: "Risk-um reward-um unrelated things", correct: false }
          ] : [
            { text: "Higher potential rewards come with higher risk", correct: true },
            { text: "Low risk guarantees the highest returns", correct: false },
            { text: "Risk and reward are completely unrelated", correct: false }
          ]
        };
      }
      if (index === 4) { // Global Markets
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Global markets epdi operate aaguthu?"
            : "How do global markets operate?",
          options: lang === "tanglish" ? [
            { text: "Vera vera countries merchants trade panni impact pannuvaanga", correct: true },
            { text: "Every country world-la irundhu full-a isolate-ah irukum", correct: false },
            { text: "International trade-la gold mattum thaan trade panna mudiyum", correct: false }
          ] : [
            { text: "Merchants from different countries trade globally, affecting each other", correct: true },
            { text: "Each country is completely isolated from the rest of the world", correct: false },
            { text: "Only gold is allowed to be traded internationally", correct: false }
          ]
        };
      }
    }

    // Chapter 2: Allocation & Growth
    if (chapter === 2) {
      if (index === 1) { // Compound Interest
        return {
          story: storyText,
          question: lang === "tanglish" 
            ? "Compound Interest yen long-term-la romba powerful?" 
            : "What makes Compound Interest so powerful over time?",
          options: lang === "tanglish" ? [
            { text: "Initial money kooda earned interest-kum sethu interest kidaikum", correct: true },
            { text: "Government tax full-ah thavirkka udhavum", correct: false },
            { text: "Share price eppovumee korayathu nu guarantee tharum", correct: false }
          ] : [
            { text: "You earn interest on both your initial money and your accumulated interest", correct: true },
            { text: "It allows you to skip paying any taxes on your gains", correct: false },
            { text: "It guarantees that stock prices will never fall", correct: false }
          ]
        };
      }
      if (index === 2) { // Diversification
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Investor yen portfolios-a diversify pannanum?"
            : "Why should an investor diversify their portfolio?",
          options: lang === "tanglish" ? [
            { text: "Ore oru loss-ala moththa panamum collapse aagame thaduka", correct: true },
            { text: "Daily double-digit profits guaranteed ah vara", correct: false },
            { text: "Broker charge panra fee-a zero aakka", correct: false }
          ] : [
            { text: "To reduce the risk of a single bad investment ruining the portfolio", correct: true },
            { text: "To guarantee double-digit profits every single day", correct: false },
            { text: "To reduce the transaction fees charged by brokerages", correct: false }
          ]
        };
      }
      if (index === 3) { // Inflation
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Inflation oda mukkiya effect enna?"
            : "What is the primary effect of Inflation?",
          options: lang === "tanglish" ? [
            { text: "Namma kitta irukura cash oda purchasing power-a kurachudum", correct: true },
            { text: "Bank account-la irukura cash-a automatic-ah increase pannum", correct: false },
            { text: "Market-la goods and services-a free-ah maathidum", correct: false }
          ] : [
            { text: "It reduces the purchasing power of your cash over time", correct: true },
            { text: "It increases the total cash balance in your bank account", correct: false },
            { text: "It makes all goods and services completely free", correct: false }
          ]
        };
      }
      if (index === 4) { // Mutual Funds
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Mutual Fund-la pool pannina panatha yaar manage pannuva?"
            : "Who manages the money pooled in a Mutual Fund?",
          options: lang === "tanglish" ? [
            { text: "Oru professional fund manager", correct: true },
            { text: "Depositors voting system valiya", correct: false },
            { text: "Oru automated lottery system machine", correct: false }
          ] : [
            { text: "A professional fund manager", correct: true },
            { text: "The depositors themselves by taking votes", correct: false },
            { text: "An automated lottery drawing machine", correct: false }
          ]
        };
      }
    }

    // Chapter 3: Markets & Valuation
    if (chapter === 3) {
      if (index === 1) { // Shares
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Oru company-oda Share-a vangaradhu enna represent pannuthu?"
            : "What does owning a share of a company represent?",
          options: lang === "tanglish" ? [
            { text: "Company assets and profits-la ungaluku oru fractional ownership", correct: true },
            { text: "Unga job application-a security-ah confirm panradhu", correct: false },
            { text: "Company products lifetime-ku free-ah use panra pass", correct: false }
          ] : [
            { text: "A fractional ownership stake in the company", correct: true },
            { text: "A promise that the company will hire you as an employee", correct: false },
            { text: "A free pass to use any of the company's products", correct: false }
          ]
        };
      }
      if (index === 2) { // P/E Ratio
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Peers-a compare pannum bodhu high P/E ratio enna kaatudhu?"
            : "What does a high P/E ratio relative to peers usually indicate?",
          options: lang === "tanglish" ? [
            { text: "Stock overvalued-ah iruku or heavy growth expect panraanga", correct: true },
            { text: "Company adutha maasame guarantee-ah close aaga podhu", correct: false },
            { text: "Share market-la yaarume buy/sell panna mudiyathu", correct: false }
          ] : [
            { text: "The stock is potentially overvalued or has high growth expectations", correct: true },
            { text: "The company is guaranteed to go bankrupt next month", correct: false },
            { text: "The stock has no trading volume and cannot be sold", correct: false }
          ]
        };
      }
      if (index === 3) { // Mr. Market
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Mr. Market soldra price variations-a investor epdi paakanum?"
            : "How should an investor view Mr. Market's daily price quotes?",
          options: lang === "tanglish" ? [
            { text: "Buy low/sell high panna oru opportunity, adhu command kedaiyadhu", correct: true },
            { text: "Business-oda final, permanently correct price adhudhan", correct: false },
            { text: "Kandippa udane ellathaayum trade panniye aaganum ngra order", correct: false }
          ] : [
            { text: "As an opportunity to buy cheap or sell high, not as a command", correct: true },
            { text: "As the absolute, correct, and permanent value of the business", correct: false },
            { text: "As a direct order to immediately trade all their assets", correct: false }
          ]
        };
      }
      if (index === 4) { // Corporate Auditing
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Corporate auditor oda mukkiya role enna?"
            : "What is the primary role of a corporate auditor?",
          options: lang === "tanglish" ? [
            { text: "Financial statement unmaiyaana status-a thaan kaatudha nu check panradhu", correct: true },
            { text: "Company sales and advertising campaigns-a run panradhu", correct: false },
            { text: "Stock price-a target panni increase panna support panradhu", correct: false }
          ] : [
            { text: "To independently verify that the financial statements represent the truth", correct: true },
            { text: "To run the company's daily sales and advertising campaigns", correct: false },
            { text: "To increase the stock price of the company by any means", correct: false }
          ]
        };
      }
    }

    // Chapter 4: Advanced Finance
    if (chapter === 4) {
      if (index === 1) { // Option Contracts
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Option contract buy panra key benefit enna?"
            : "What is the key benefit of buying an Option contract?",
          options: lang === "tanglish" ? [
            { text: "Set price-la trade panna right kidaikum, compulsory obligation illai", correct: true },
            { text: "Yentha situation-layum profit guaranteed tharum", correct: false },
            { text: "Physical asset full-a automatically free-ah transfer aayidum", correct: false }
          ] : [
            { text: "It gives you the right, but not the obligation, to trade at a set price", correct: true },
            { text: "It guarantees that you will make a profit under any market conditions", correct: false },
            { text: "It automatically gives you ownership of physical assets for free", correct: false }
          ]
        };
      }
      if (index === 2) { // Hedging
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Financial markets-la Hedging panradhoda target enna?"
            : "What is the primary purpose of Hedging in financial markets?",
          options: lang === "tanglish" ? [
            { text: "Unga portfolio risk level and heavy drop-a offset/reduce panradhu", correct: true },
            { text: "Adhiga risk eduthu speculation valiya overnight rich aagaradhu", correct: false },
            { text: "Stock trade panra brokerage commission fee-a skip panradhu", correct: false }
          ] : [
            { text: "To reduce or offset the risk of adverse price movements in an asset", correct: true },
            { text: "To maximize speculative profits through day-trading activities", correct: false },
            { text: "To avoid paying brokerage commissions on stock trades", correct: false }
          ]
        };
      }
      if (index === 3) { // Short Selling
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Short seller eppo profit earn pannuvaaru?"
            : "When does a short seller make a profit?",
          options: lang === "tanglish" ? [
            { text: "Asset value buyback pandradhuku munnadi drop aagum bodhu", correct: true },
            { text: "Company quarterly dividend thara bodhu", correct: false },
            { text: "Market-la share-oda value high-a yerum bodhu", correct: false }
          ] : [
            { text: "When the price of the borrowed asset declines before they buy it back", correct: true },
            { text: "When the company increases its quarterly dividend payout", correct: false },
            { text: "When the market value of the asset rises exponentially", correct: false }
          ]
        };
      }
      if (index === 4) { // Leverage
        return {
          story: storyText,
          question: lang === "tanglish"
            ? "Leverage use panradhula irukura major risk enna?"
            : "What is the main risk associated with financial Leverage?",
          options: lang === "tanglish" ? [
            { text: "Profit boost aagura mathiri, potential loss-um heavily multiply aagum", correct: true },
            { text: "Loss value-a automatic-ah fixed small amount-la lock pannidum", correct: false },
            { text: "Market order instant execute aaga mudiyadha complications tharum", correct: false }
          ] : [
            { text: "It amplifies both potential profits and potential losses", correct: true },
            { text: "It automatically limits your max loss to a fixed small amount", correct: false },
            { text: "It prevents you from executing any fast market buy/sell orders", correct: false }
          ]
        };
      }
    }

    // Default fallback
    return {
      story: storyText,
      question: "What is the core concept here?",
      options: [
        { text: "The correct concept explanation", correct: true },
        { text: "An unrelated random distracter", correct: false },
        { text: "A secondary incorrect option", correct: false }
      ]
    };
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
  const [activeSubTab, setActiveSubTab] = useState("lessons");
  
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
    return user?.lessonsCompleted?.includes(prevId) || false;
  };

  const [glossary, setGlossary] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Auto-scroll to current active node where the user left off
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        const activeNode = document.getElementById("active-playground-node");
        if (activeNode) {
          activeNode.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Filtered glossary list based on search term
  const filteredGlossary = glossary.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        setXpPoints((prev) => prev + 100);
        setActiveLesson(null);
        setLessonActionCompleted(false);
      }
    } catch (e) {
      toast.error("Failed to complete lesson");
    }
  };

  const handleSelectAcademyTopic = (topic) => {
    navigate(`/learn/lab?lessonId=${topic.id}&from=playground&lang=${audioLang}`);
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

  // Term explanation state
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");

  // AI Chat Tutor state
  const [chatInput, setChatInput] = useState("");
  const localizedTutorWelcomes = {
    en: "Namaste! I am FinGuru 🤖, your friendly personal AI tutor. Let's build your portfolio under the \"Portfolio Architect\" tab, explore price mechanics in the \"Playground\", or challenge me with a question on bonds or stocks!",
    ta: "வணக்கம்! நான் உங்கள் FinGuru 🤖, உங்கள் நட்பு தனிப்பட்ட AI ஆசிரியர். போர்ட்ஃபோலியோவை உருவாக்குங்கள், விளையாடுங்கள், அல்லது பங்குகள் மற்றும் பத்திரங்கள் பற்றிய உங்கள் சந்தேகங்களை என்னிடம் கேளுங்கள்!",
    tanglish: "Namaste buddy! Naan dhan unga FinGuru 🤖, unga friendly personal AI tutor. Namma 'Portfolio Architect' tab-la super portfolio build pannalam, ila 'Playground'-la price change analyze pannalaam. Ennadi kelunga, spot-la pathil choldren!"
  };
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content:
        'Namaste! I am FinGuru 🤖, your friendly personal AI tutor. Let\'s build your portfolio under the "Portfolio Architect" tab, explore price mechanics in the "Playground", or challenge me with a question on bonds or stocks!',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatHistory.length === 1 && chatHistory[0].role === "assistant") {
      setChatHistory([
        {
          role: "assistant",
          content: localizedTutorWelcomes[audioLang]
        }
      ]);
    }
  }, [audioLang]);

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
  const calculateLogStreak = () => {
    try {
      const logVal = localStorage.getItem("finbuddy_study_log");
      if (!logVal) return 0;
      const log = JSON.parse(logVal);
      const todayStr = new Date().toISOString().split('T')[0];
      
      let streak = 0;
      let checkDate = new Date();
      
      const todayFormatted = checkDate.toISOString().split('T')[0];
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayFormatted = checkDate.toISOString().split('T')[0];
      
      let hasStudiedRecent = log[todayFormatted] || log[yesterdayFormatted];
      if (!hasStudiedRecent) return 0;
      
      checkDate = new Date(); // reset to today
      while (true) {
        const currentStr = checkDate.toISOString().split('T')[0];
        if (log[currentStr] && log[currentStr].length > 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    } catch (e) {
      return 0;
    }
  };

  useEffect(() => {
    const logStreak = calculateLogStreak();
    if (logStreak > 0) {
      setStreakCount(logStreak);
    } else if (user) {
      setStreakCount(user.currentStreak || 0);
    }
    if (user) {
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
        (expectedReturn > 20 && asset.expectedCategory.includes(20)),
    );
  };

  // Explain term using AI Advisor (navigates to LearnHub glossary)
  const handleExplainTerm = (term) => {
    navigate("/learn", {
      state: {
        subTab: "glossary",
        activeLesson: null,
        stationId: activeStation,
        selectedTerm: term
      }
    });
  };

  // Send message to AI FinGuru Mentor
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput.trim() };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const apiHistory = chatHistory.map((h) => ({
        role: h.role,
        content: h.content,
      }));
      const res = await api.post("/learn/chat", {
        message: userMessage.content,
        history: apiHistory,
        lang: audioLang,
      });
      if (res.data?.success) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: res.data.reply },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Oops! FinGuru is taking a quick break to count laddoos. Try again!",
          },
        ]);
      }
    } catch (e) {
      console.error("Error sending message to FinGuru:", e);
      const reply = `Great question! When we analyze financial planning, we always seek high-yield opportunities (like Flexi-Cap Mutual funds) while shielding our downside with safe sovereign bonds. Early compounding is key! 🌟\n\nWhat other terms (like P/E Ratio or Sovereign Gold) can I break down for you?`;
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Start Graded AI Quiz
  const handleStartQuiz = async () => {
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);

    try {
      const topicToFetch = activeLesson ? activeLesson.title : quizTopic;
      const res = await api.post("/learn/quiz", {
        topic: topicToFetch,
        difficulty: quizDifficulty,
      });
      if (res.data?.success && res.data?.questions?.length) {
        setQuizQuestions(res.data.questions);
      } else {
        throw new Error("Invalid quiz response structure");
      }
    } catch (e) {
      console.error("Error fetching quiz:", e);
      const fallbackQuestions = [
        {
          q: `What is the safest investment instrument in India?`,
          options: [
            `A) Small-Cap Tech stock`,
            `B) RBI Government Savings Bond`,
            `C) Crypto currency`,
            `D) Penny Stock`,
          ],
          answer: "B",
          explanation: "RBI Government Savings Bonds are 100% sovereign-backed with zero default risk.",
        },
        {
          q: `What does a high Price-to-Earnings (P/E) ratio indicate?`,
          options: [
            `A) Stock is undervalued`,
            `B) High earnings per share`,
            `C) Investors are paying a premium over profits`,
            `D) The company has zero debt`,
          ],
          answer: "C",
          explanation: "A high P/E ratio means investors are paying more per rupee of profit generated.",
        },
        {
          q: `Why do mutual funds offer built-in safety for beginners?`,
          options: [
            `A) They guarantee 20% returns`,
            `B) They pool cash to diversify risk`,
            `C) They never fall in price`,
            `D) They are interest-free`,
          ],
          answer: "B",
          explanation: "Mutual funds pool savings to distribute investments across multiple blue-chips, limiting single-stock downside.",
        },
      ];
      setQuizQuestions(fallbackQuestions);
    } finally {
      setLoadingQuiz(false);
    }
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
                  Question ${dnaStep} of 5: ${dnaQuestions[dnaStep - 1].q}
                </p>

                <div className="flex flex-col gap-2.5">
                  {dnaQuestions[dnaStep - 1].options.map((opt, idx) => (
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

        {/* Playground Page Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              Playground <span className="text-xs bg-violet-500/25 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full font-mono font-bold">Winding Roadmap</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Master financial concepts step-by-step with our interactive visual path.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowGlossaryDrawer(true)}
              className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 hover:text-white px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition duration-200 shadow-lg cursor-pointer select-none"
            >
              <BookOpen className="w-4 h-4" />
              <span>📖 Glossary Lookup</span>
            </button>
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
                navigate("/learn", { state: { subTab: "architect" } });
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
                      const text =
                        multilingualAcademy[audioLang]?.[activeLesson.id]
                          ?.concept +
                        ". " +
                        multilingualAcademy[audioLang]?.[activeLesson.id]
                          ?.analogy;
                      speakText(text, audioLang === "ta" ? "ta" : "en");
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
                      <span className="italic">"{activeSpeechText}"</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto shrink-0 bg-white/5 p-2 rounded-xl border border-white/5 self-end md:self-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 font-mono uppercase">
                        Speed: {speechRate.toFixed(2)}x
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
                            speakText(
                              activeSpeechText,
                              audioLang === "ta" ? "ta" : "en",
                            );
                          }
                        }}
                        className="w-20 accent-violet-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 font-mono uppercase">
                        Pitch: {speechPitch.toFixed(2)}x
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
                            speakText(
                              activeSpeechText,
                              audioLang === "ta" ? "ta" : "en",
                            );
                          }
                        }}
                        className="w-20 accent-violet-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                        {renderLinkedText(getSimpleExplanation(activeLesson.id, audioLang))}
                      </p>
                    ) : (
                      <p className="text-slate-100 leading-relaxed font-semibold text-[12px]">
                        {renderLinkedText(activeLessonContent?.concept)}
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
                        {renderLinkedText(activeLessonContent?.analogy)}
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
                        {renderLinkedText(activeLessonContent?.whyMatters)}
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
                        {renderLinkedText(activeLessonContent?.actionGoal)}
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
                onClick={() => navigate("/learn", { state: { subTab: tab.id } })}
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
                    ? tab.id === 'architect' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                      tab.id === 'lessons' ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]' :
                      tab.id === 'glossary' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' :
                      tab.id === 'quiz' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' :
                      tab.id === 'survival' ? 'bg-red-400 shadow-[0_0_8px_#f87171]' :
                      'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                    : 'bg-transparent'
                }`} />
                {tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  {tab.label}
                  {isRecommended && (
                    <span className="ml-1 text-[8px] bg-amber-500/25 text-amber-300 px-1 py-0.5 rounded font-mono font-bold shrink-0">
                      ⚡ PRACTICE
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        
        {/* Main Content Area - Playground Winding Road */}
        <div className="space-y-6">
                            <div className="space-y-8 animate-fade-in pb-24">
                    {/* DUOLINGO-STYLE HEADER PANEL */}
                    <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent pointer-events-none" />
                      
                      <div className="space-y-1 relative z-10">
                        <span className="text-[10px] tracking-widest uppercase font-black text-emerald-200">
                          Section {activeStation}, Unit {Math.floor((activeNodeIdx % 25) / 2) + 1}
                        </span>
                        <h3 className="text-xl font-black">
                          {
                            {
                              1: "Describe your basic saving habits & compounding magic",
                              2: "Build your diversified portfolio of mutual funds & gold",
                              3: "Analyze corporate balance sheets & detect red flags",
                              4: "Master options & futures strategies in the derivatives arena"
                            }[activeStation]
                          }
                        </h3>
                        <p className="text-xs text-emerald-100/80">
                          Current Node: {activeNodeIdx % 25 + 1} / 25 in Chapter {activeStation}
                        </p>
                      </div>

                      {/* Notebook Button */}
                      <button
                        onClick={() => {
                          toast.info("💡 Quick Reference: Opened Wealth Glossary terms!", { icon: "📖" });
                          navigate("/learn", { state: { subTab: "glossary" } });
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/30 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer relative z-10 text-xl"
                        title="View Concept Glossary"
                      >
                        📓
                      </button>
                    </div>

                    {/* ROADMAP DASHBOARD CARD */}
                    <div className="card bg-white/2 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        {/* Title & Info */}
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                            <Target className="w-5 h-5 text-violet-400" /> Winding Learning Roadway
                          </h3>
                          <p className="text-xs text-slate-400">
                            100 Sequential Modules (Lessons, Glossary Stories, and Milestone Chests)
                          </p>
                        </div>
                        
                        {/* Stats Dashboard */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                            <span className="text-sm">🔥</span>
                            <div className="text-left">
                              <span className="text-[10px] text-slate-400 block font-bold">Streak</span>
                              <span className="text-xs font-black text-white font-mono">{streakCount} Days</span>
                            </div>
                          </div>
                          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                            <span className="text-sm">🪙</span>
                            <div className="text-left">
                              <span className="text-[10px] text-slate-400 block font-bold">Coins Balance</span>
                              <span className="text-xs font-black text-amber-400 font-mono">{user?.virtualCoins || 0}</span>
                            </div>
                          </div>
                          <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                            <span className="text-sm">🏆</span>
                            <div className="text-left">
                              <span className="text-[10px] text-slate-400 block font-bold">Completed</span>
                              <span className="text-xs font-black text-violet-400 font-mono">
                                {user?.lessonsCompleted?.filter(id => id.startsWith("l") || id.startsWith("s") || id.startsWith("c") || id.startsWith("sq")).length || 0} / 100
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

{/* Term of the Day Banner */}
                      {(() => {
                        const dayIdx = new Date().getDate() % defaultGlossary.length;
                        const termOfDay = defaultGlossary[dayIdx];
                        if (!termOfDay) return null;
                        const enrichment = glossaryEnrichments[termOfDay.term] || {};
                        return (
                          <div className="card bg-gradient-to-r from-violet-600/10 via-slate-900/90 to-cyan-600/10 border border-violet-500/25 p-5 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg mt-4">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full filter blur-xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                              <div className="text-3xl bg-violet-500/20 p-2 rounded-2xl border border-violet-500/30">💡</div>
                              <div>
                                <span className="text-[9px] bg-violet-500/20 text-violet-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
                                  Term of the Day
                                </span>
                                <h3 className="text-base font-black text-white mt-1 flex flex-wrap items-center gap-2">
                                  {termOfDay.term}
                                  <span className="text-[8px] uppercase font-mono font-black px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                                    {termOfDay.category}
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl font-semibold">
                                  {audioLang === "tanglish"
                                    ? `🗣️ ${termOfDay.term} na — ${termOfDay.short}`
                                    : audioLang === "ta"
                                      ? termOfDay.short
                                      : termOfDay.short}
                                </p>
                                {enrichment.example && (
                                  <p className="text-[10px] text-slate-400 mt-1 italic">
                                    Example: {enrichment.example}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigate("/learn", {
                                  state: {
                                    subTab: "glossary",
                                    activeLesson: null,
                                    stationId: activeStation,
                                    selectedTerm: termOfDay.term
                                  }
                                });
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-[10px] font-black rounded-xl transition cursor-pointer shadow-md shadow-violet-500/10 shrink-0 whitespace-nowrap self-end sm:self-center"
                            >
                              Study Term 📖
                            </button>
                          </div>
                        );
                      })()}

                                            {/* Controls Row */}
                      <div className="flex flex-wrap items-center justify-between border-t border-white/5 pt-4 mt-4 gap-4 relative z-10">
                        {/* Bypass Switch */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={devUnlockAll}
                            onChange={(e) => setDevUnlockAll(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 relative"></div>
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-white transition-colors">
                            🔓 Developer Bypass Lock
                          </span>
                        </label>

                        {/* View Switcher buttons */}
                        <div className="flex bg-black/45 p-0.5 border border-white/5 rounded-xl gap-0.5">
                          <button
                            onClick={() => setRoadmapView("road")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                              roadmapView === "road" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            🛣️ Road View
                          </button>
                          <button
                            onClick={() => setRoadmapView("station")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                              roadmapView === "station" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            🗺️ Station Grid
                          </button>
                          <button
                            onClick={() => setRoadmapView("web")}
                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                              roadmapView === "web" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            🔗 Concept Web
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ROADMAP VIEW */}
                    {roadmapView === "road" && (
                      <div key="road" className="space-y-12 lesson-panel-enter lesson-panel-enter-d1 opacity-0">


                        {[1, 2, 3, 4].map((stationId) => {
                          const nodesList = CHAPTER_NODES[stationId] || [];
                          const totalNodes = nodesList.length;
                          
                          // Chapter Config
                          const config = {
                            1: {
                              title: "Chapter 1: Financial Foundations",
                              subtitle: "Master the basics of saving, compounding, and digital money",
                              gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20",
                              accent: "text-emerald-400",
                              btnBg: "from-emerald-500 to-teal-600",
                              glow: "rgba(16, 185, 129, 0.4)",
                              nodeColor: "bg-emerald-600 border-emerald-500 hover:bg-emerald-500 shadow-[0_6px_0_#047857]",
                              nodeActiveGlow: "shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse",
                            },
                            2: {
                              title: "Chapter 2: Portfolio Builder",
                              subtitle: "Learn mutual funds, asset allocation, and global diversification",
                              gradient: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
                              accent: "text-amber-400",
                              btnBg: "from-amber-500 to-yellow-600",
                              glow: "rgba(245, 158, 11, 0.4)",
                              nodeColor: "bg-amber-600 border-amber-500 hover:bg-amber-500 shadow-[0_6px_0_#b45309]",
                              nodeActiveGlow: "shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse",
                            },
                            3: {
                              title: "Chapter 3: Corporate Forensics",
                              subtitle: "Analyse company statements, DuPont ratios, and audits",
                              gradient: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20",
                              accent: "text-blue-400",
                              btnBg: "from-blue-500 to-indigo-600",
                              glow: "rgba(59, 130, 246, 0.4)",
                              nodeColor: "bg-blue-600 border-blue-500 hover:bg-blue-500 shadow-[0_6px_0_#1d4ed8]",
                              nodeActiveGlow: "shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse",
                            },
                            4: {
                              title: "Chapter 4: Derivatives Arena",
                              subtitle: "Navigate option spreads, hedging, contango, and Greek risks",
                              gradient: "from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20",
                              accent: "text-violet-400",
                              btnBg: "from-violet-500 to-purple-600",
                              glow: "rgba(139, 92, 246, 0.4)",
                              nodeColor: "bg-violet-600 border-violet-500 hover:bg-violet-500 shadow-[0_6px_0_#6d28d9]",
                              nodeActiveGlow: "shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-pulse",
                            },
                          }[stationId];

                          // Local coordinates math
                          // Height of road = (totalNodes * 105) + 180 px
                          const roadHeight = totalNodes * 105 + 180;

                          // Continuous SVG winding path connecting nodes
                          let lastX = 50;
                          let lastY = 115;
                          let pathStr = "M 50 115";
                          nodesList.forEach((node, idx) => {
                            const x = node.type === "chest" ? 50 : 50 + 22 * Math.sin((idx * Math.PI) / 2);
                            const y = idx * 105 + 115;
                            if (idx > 0) {
                              const cp1y = lastY + 35;
                              const cp2y = y - 35;
                              pathStr += ` C ${lastX} ${cp1y}, ${x} ${cp2y}, ${x} ${y}`;
                            }
                            lastX = x;
                            lastY = y;
                          });

                          return (
                            <div key={stationId} className="card bg-white/2 border border-white/5 rounded-3xl p-6 space-y-6 overflow-hidden relative">
                              {/* Glowing Background gradient */}
                              <div className={`absolute top-0 inset-x-0 h-48 bg-gradient-to-b ${config.gradient} pointer-events-none`} />
                              
                              {/* Chapter Header Area */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 relative z-10">
                                <div>
                                  <span className={`text-[10px] tracking-widest uppercase font-black ${config.accent}`}>
                                    Chapter {stationId}
                                  </span>
                                  <h4 className="text-lg font-black text-white">{config.title}</h4>
                                  <p className="text-xs text-slate-400">{config.subtitle}</p>
                                </div>
                                <div className="bg-black/35 px-4 py-2 rounded-2xl border border-white/5 text-right whitespace-nowrap">
                                  <span className="text-[10px] text-slate-400 font-bold block">Progression</span>
                                  <span className={`text-xs font-black ${config.accent}`}>
                                    {nodesList.filter(node => {
                                      const id = node.type === "lesson" ? node.data?.id : node.id;
                                      return user?.lessonsCompleted?.includes(id);
                                    }).length} / 25 Completed
                                  </span>
                                </div>
                              </div>

                              {/* Road Pathway Winding Area */}
                              <div className="relative w-full overflow-hidden" style={{ height: `${roadHeight}px` }}>
                                {/* SVG Background Connections */}
                                <svg 
                                  className="absolute inset-0 w-full h-full pointer-events-none" 
                                  viewBox={`0 0 100 ${roadHeight}`}
                                  preserveAspectRatio="none"
                                >
                                  {/* Shadow Glow Path */}
                                  <path
                                    d={pathStr}
                                    fill="none"
                                    stroke={config.glow}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                  />
                                  {/* Inner Flowing Gradient Path */}
                                  <path
                                    d={pathStr}
                                    fill="none"
                                    stroke={stationId === 1 ? "#10b981" : stationId === 2 ? "#f59e0b" : stationId === 3 ? "#3b82f6" : "#8b5cf6"}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    className="road-path-flow text-opacity-80"
                                  />
                                </svg>

                                {/* Render winding nodes */}
                                {nodesList.map((node, idx) => {
                                  const globalIdx = (stationId - 1) * 25 + idx;
                                  const unlocked = isNodeUnlocked(node, globalIdx);
                                  
                                  const id = node.type === "lesson" ? node.data?.id : node.id;
                                  const completed = user?.lessonsCompleted?.includes(id) || false;
                                  const isActive = globalIdx === activeNodeIdx;
                                  
                                  // Node position coordinates
                                  const xPos = node.type === "chest" ? 50 : 50 + 22 * Math.sin((idx * Math.PI) / 2);
                                  const yPos = idx * 105 + 80;

                                  // Check if this node has a branched sideQuest
                                  const sideQuest = node.sideQuest;
                                  const sideXPos = xPos >= 50 ? xPos - 24 : xPos + 24;

                                  return (
                                    <React.Fragment key={node.id || (node.data && node.data.id) || idx}>
                                      {/* Render Side-Quest Branch if present */}
                                      {sideQuest && (
                                        <div className={`absolute z-10 flex flex-col items-center lesson-panel-enter lesson-panel-enter-d${(idx % 4) + 1} opacity-0`} style={{ left: `${sideXPos}%`, top: `${yPos}px` }}>
                                          {/* Horizontal bridge line (styled double border like ==) */}
                                          <div className="absolute h-1 bg-white/10 z-0" style={{
                                            left: `${sideXPos > xPos ? -80 : 40}px`,
                                            width: "48px",
                                            top: "24px",
                                            height: "6px",
                                            borderTop: "1.5px solid rgba(255,255,255,0.2)",
                                            borderBottom: "1.5px solid rgba(255,255,255,0.2)",
                                          }} />

                                          {/* Side Quest Circular Button */}
                                          <button
                                            onClick={() => {
                                              if (!unlocked) {
                                                toast.error("🔒 Unlock this pathway node first to attempt the bonus challenge!");
                                                return;
                                              }
                                              setSideQuestStep(1);
                                              setSideQuestAnswers([]);
                                              setSideQuestSuccess(false);
                                              setActiveSideQuestNode({ ...sideQuest, parentNodeId: id });
                                            }}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 text-white transition-all cursor-pointer relative ${
                                              user?.lessonsCompleted?.includes(sideQuest.id)
                                                ? "bg-yellow-600 border-yellow-400 shadow-[0_4px_0_#854d0e]"
                                                : unlocked
                                                  ? "bg-slate-800 border-yellow-500 hover:bg-slate-700 shadow-[0_4px_0_#713f12] animate-pulse"
                                                  : "bg-slate-950 border-white/5 text-slate-600 cursor-not-allowed filter grayscale"
                                            }`}
                                          >
                                            <span className="text-lg">{user?.lessonsCompleted?.includes(sideQuest.id) ? "🏆" : sideQuest.emoji}</span>
                                          </button>
                                          <span className="text-[8px] font-bold text-yellow-400 mt-1 uppercase tracking-wider">
                                            Bonus Challenge
                                          </span>
                                        </div>
                                      )}

                                      {/* Standard Main Winding Node */}
                                      <div
                                        id={isActive ? "active-playground-node" : undefined}
                                        className={`absolute -translate-x-1/2 z-10 flex flex-col items-center lesson-panel-enter lesson-panel-enter-d${(idx % 4) + 1} opacity-0`}
                                        style={{ left: `${xPos}%`, top: `${yPos}px` }}
                                      >
                                        {/* Bouncing Active Node Sparkles Indicator */}
                                        {isActive && (
                                          <div className="absolute -top-20 flex flex-col items-center animate-bounce z-25 pointer-events-none select-none">
                                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-violet-400/30 shadow-[0_0_12px_rgba(139,92,246,0.5)] whitespace-nowrap mb-1 uppercase tracking-wider">
                                              Study Here!
                                            </div>
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 border border-violet-400/40 shadow-[0_0_15px_rgba(139,92,246,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center relative overflow-hidden">
                                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                                              <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                            </div>
                                          </div>
                                        )}

                                        {/* Render Chest Node */}
                                        {node.type === "chest" ? (
                                          completed ? (
                                            <div className="flex flex-col items-center">
                                              <div className="w-14 h-14 rounded-full bg-slate-800/80 border-2 border-white/5 flex items-center justify-center text-slate-500 filter grayscale text-2xl shadow">
                                                📦
                                              </div>
                                              <span className="text-[8px] font-bold text-slate-500 mt-1">
                                                ✅ CLAIMED
                                              </span>
                                            </div>
                                          ) : unlocked ? (
                                            <button
                                              onClick={() => handleClaimMilestone(stationId, node.reward)}
                                              className="flex flex-col items-center group cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                            >
                                              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 border-2 border-yellow-300 flex items-center justify-center text-2xl shadow-xl shadow-yellow-500/20 animate-bounce relative ring-4 ring-yellow-400/20">
                                                🎁
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black">
                                                  !
                                                </span>
                                              </div>
                                              <span className="text-[8px] font-black text-yellow-400 mt-1 tracking-widest uppercase">
                                                CLAIM +{node.reward} 🪙
                                              </span>
                                            </button>
                                          ) : (
                                            <div className="flex flex-col items-center text-slate-600">
                                              <div className="w-14 h-14 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-2xl relative">
                                                🎁
                                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-[10px]">
                                                  🔒
                                                </div>
                                              </div>
                                              <span className="text-[8px] font-black text-slate-500 mt-1 tracking-wider">
                                                +{node.reward} COINS
                                              </span>
                                            </div>
                                          )
                                        ) : node.type === "story" ? (
                                          /* Story Book Node */
                                          <button
                                            onClick={() => {
                                              if (!unlocked) {
                                                toast.error("🔒 Complete preceding lessons first to unlock this story book!");
                                                return;
                                              }
                                              setActiveStoryNode(node);
                                              setSelectedStoryOption(null);
                                              setStorySuccess(false);
                                            }}
                                            className={`node-3d w-14 h-14 rounded-full flex items-center justify-center border-2 text-white transition-all cursor-pointer relative ${
                                              completed
                                                ? "bg-teal-600 border-teal-500 shadow-[0_6px_0_#064e3b] text-opacity-100 hover:scale-105"
                                                : isActive
                                                  ? "bg-teal-500 border-teal-400 shadow-[0_6px_0_#0d9488] ring-4 ring-white/10 hover:scale-105"
                                                  : unlocked
                                                    ? "bg-teal-700 border-teal-600 shadow-[0_6px_0_#0f766e] hover:scale-105"
                                                    : "bg-slate-900 border-white/5 text-slate-500 shadow-[0_6px_0_#0f172a] cursor-not-allowed filter grayscale"
                                            }`}
                                          >
                                            <span className="text-xl relative z-10 select-none">
                                              {completed ? "✅" : "📖"}
                                            </span>
                                          </button>
                                        ) : (
                                          /* Regular Lesson Node */
                                          (() => {
                                            const lessonId = node.data?.id;
                                            const lessonTerms = lessonGlossaryMapping[lessonId] || [];
                                            const allTermsMastered = lessonTerms.length > 0 && lessonTerms.every(term => masteredTerms.includes(term));
                                            return (
                                              <button
                                                onClick={() => {
                                                  setSelectedRoadLesson(node.data);
                                                }}
                                                className={`node-3d w-14 h-14 rounded-full flex items-center justify-center border-2 text-white transition-all cursor-pointer relative ${
                                                  completed
                                                    ? allTermsMastered
                                                      ? "bg-gradient-to-br from-amber-500 to-yellow-600 border-yellow-300 shadow-[0_6px_0_#92400e] text-opacity-100 hover:scale-105"
                                                      : `${config.nodeColor} text-opacity-100 hover:scale-105`
                                                    : isActive
                                                      ? `${config.nodeColor} ${config.nodeActiveGlow} hover:scale-105 ring-4 ring-white/10`
                                                      : unlocked
                                                        ? `${config.nodeColor} hover:scale-105`
                                                        : "bg-slate-900 border-white/5 text-slate-500 shadow-[0_6px_0_#0f172a] cursor-not-allowed filter grayscale"
                                                }`}
                                              >
                                                <span className="text-xl relative z-10 select-none">
                                                  {completed
                                                    ? allTermsMastered
                                                      ? "🌟"
                                                      : "✅"
                                                    : node.data?.emoji || "🎓"}
                                                </span>
                                              </button>
                                            );
                                          })()
                                        )}

                                        {/* Label Overlay */}
                                        <span className={`text-[9px] font-black tracking-wider uppercase mt-2 max-w-[90px] text-center truncate ${
                                          isActive ? "text-white font-black scale-105" : "text-slate-400"
                                        }`}>
                                          {node.type === "lesson" ? node.data?.title : node.title}
                                        </span>
                                        {node.type === "lesson" && (() => {
                                          const lessonId = node.data?.id;
                                          const lessonTerms = lessonGlossaryMapping[lessonId] || [];
                                          if (lessonTerms.length === 0) return null;
                                          return (
                                            <div className="flex gap-0.5 mt-1 items-center justify-center bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                                              {lessonTerms.map((term) => {
                                                const isTermMastered = masteredTerms.includes(term);
                                                return (
                                                  <span
                                                    key={term}
                                                    className={`w-1.5 h-1.5 rounded-full ${isTermMastered ? "bg-emerald-400" : "bg-slate-650"}`}
                                                    title={`${term}: ${isTermMastered ? "Mastered" : "Unmastered"}`}
                                                  />
                                                );
                                              })}
                                              {lessonTerms.every(term => masteredTerms.includes(term)) && (
                                                <span className="text-[8px] ml-0.5" title="All Mapped Terms Mastered! 🌟">🌟</span>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* STATION GRID VIEW */}
                    {roadmapView === "station" && (
                      <div key="station" className="space-y-6 lesson-panel-enter lesson-panel-enter-d1 opacity-0">
                        {/* Station Selector Bar */}
                        <div className="flex bg-black/45 p-1 border border-white/5 rounded-2xl gap-1 max-w-2xl mb-8 flex-wrap">
                          {[
                            { id: 1, label: "🟢 Foundations", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" },
                            { id: 2, label: "🟡 Portfolio Builder", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10" },
                            { id: 3, label: "🔵 Corporate Forensics", color: "text-blue-400 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10" },
                            { id: 4, label: "🟣 Derivatives Arena", color: "text-violet-400 border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10" },
                          ].map((station, sIdx) => (
                            <button
                              key={station.id}
                              onClick={() => setActiveStation(station.id)}
                              className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer min-w-[130px] lesson-panel-enter lesson-panel-enter-d${(sIdx % 4) + 1} ${
                                activeStation === station.id
                                  ? `${station.color} font-black scale-[1.02] shadow`
                                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2"
                              }`}
                            >
                              {station.label}
                            </button>
                          ))}
                        </div>

                        {/* Lessons Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {ACADEMY_LESSONS.filter(l => l.stationId === activeStation).map((lesson) => {
                            const isDnaFit = (
                              (financialDna?.includes("Safe Saver") && ["l2", "l6", "l8", "l11", "l13", "l15", "l23", "l24", "l25", "l26", "l29"].includes(lesson.id)) ||
                              (financialDna?.includes("Risk Taker") && ["l7", "l9", "l20", "l21", "l22", "l38", "l39", "l40", "l41", "l42", "l43", "l44"].includes(lesson.id)) ||
                              (financialDna?.includes("Balanced Builder") && ["l1", "l3", "l4", "l5", "l10", "l12", "l14", "l16", "l17", "l18", "l19", "l27", "l28", "l30", "l31", "l32", "l33", "l34", "l35", "l36", "l37"].includes(lesson.id))
                            );

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleSelectAcademyTopic(lesson)}
                                className="p-4 bg-white/2 border border-white/5 hover:border-violet-500/30 rounded-2xl text-left hover:bg-white/5 transition group flex flex-col justify-between min-h-[120px] relative overflow-hidden cursor-pointer"
                              >
                                {isDnaFit && (
                                  <span className="absolute top-0 right-0 bg-violet-500/20 text-violet-300 text-[8px] font-black px-2 py-0.5 rounded-bl-lg tracking-wider">
                                    🎯 DNA MATCH
                                  </span>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{lesson.emoji || "🎓"}</span>
                                    <h4 className="font-extrabold text-sm text-white truncate max-w-[130px] group-hover:text-violet-400 transition-colors">
                                      {lesson.title}
                                    </h4>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                                    Station {lesson.stationId} • {lesson.subTab === "architect" ? "💼 Architect" : "🎮 Playground"}
                                  </p>
                                  {(() => {
                                    const lessonTerms = lessonGlossaryMapping[lesson.id] || [];
                                    if (lessonTerms.length === 0) return null;
                                    const masteredCount = lessonTerms.filter(t => masteredTerms.includes(t)).length;
                                    return (
                                      <div className="flex items-center gap-1.5 mt-2 bg-black/30 px-2 py-1 rounded-xl border border-white/5 w-fit">
                                        <span className="text-[8px] text-slate-400 font-mono">Vocab: {masteredCount}/{lessonTerms.length}</span>
                                        <div className="flex gap-0.5">
                                          {lessonTerms.map(term => (
                                            <span key={term} className={`w-1.5 h-1.5 rounded-full ${masteredTerms.includes(term) ? "bg-emerald-400" : "bg-slate-650"}`} />
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="flex justify-between items-center w-full border-t border-white/5 pt-2 mt-2">
                                  <span className="text-[9px] font-mono text-yellow-400 font-black">
                                    🪙 {lesson.coins}
                                  </span>
                                  <span className="text-[9px] font-bold text-violet-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                    Start Lesson →
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CONCEPT WEB VIEW */}
                    {roadmapView === "web" && (
                      <div key="web" className="bg-black/35 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden group lesson-panel-enter lesson-panel-enter-d1 opacity-0">
                        {/* Inner glowing web */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)] pointer-events-none" />
                        <svg className="w-full max-w-xl h-[300px]" viewBox="0 0 500 300">
                          {/* Connection Lines */}
                          <line className="lesson-panel-enter lesson-panel-enter-d1 opacity-0" x1="250" y1="150" x2="130" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="3 3" />
                          <line className="lesson-panel-enter lesson-panel-enter-d1 opacity-0" x1="250" y1="150" x2="370" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="3 3" />
                          <line className="lesson-panel-enter lesson-panel-enter-d1 opacity-0" x1="250" y1="150" x2="130" y2="220" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="3 3" />
                          <line className="lesson-panel-enter lesson-panel-enter-d1 opacity-0" x1="250" y1="150" x2="370" y2="220" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="3 3" />
                          
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="130" y1="80" x2="60" y2="50" stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" />
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="130" y1="80" x2="70" y2="110" stroke="rgba(52,211,153,0.3)" strokeWidth="1.5" />
                          
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="370" y1="80" x2="440" y2="50" stroke="rgba(251,191,36,0.3)" strokeWidth="1.5" />
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="370" y1="80" x2="430" y2="110" stroke="rgba(251,191,36,0.3)" strokeWidth="1.5" />
                          
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="130" y1="220" x2="60" y2="200" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="130" y1="220" x2="70" y2="260" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
                          
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="370" y1="220" x2="440" y2="200" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" />
                          <line className="lesson-panel-enter lesson-panel-enter-d2 opacity-0" x1="370" y1="220" x2="430" y2="260" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" />

                          {/* Node Circles & Text */}
                          <circle cx="250" cy="150" r="24" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2.5" className="animate-pulse lesson-panel-enter lesson-panel-enter-d1 opacity-0" />
                          <text x="250" y="153" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="black" className="select-none font-mono lesson-panel-enter lesson-panel-enter-d1 opacity-0">WEALTH Hub</text>

                          {/* Station 1 */}
                          <circle cx="130" cy="80" r="16" fill="#065f46" stroke="#34d399" strokeWidth="2" className="cursor-pointer hover:scale-115 transition-transform lesson-panel-enter lesson-panel-enter-d2 opacity-0" onClick={() => setActiveStation(1)} />
                          <text x="130" y="83" textAnchor="middle" fill="#34d399" fontSize="6" fontWeight="bold" className="select-none pointer-events-none lesson-panel-enter lesson-panel-enter-d2 opacity-0">Foundations</text>
                          
                          <circle cx="60" cy="50" r="10" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" className="cursor-pointer hover:fill-emerald-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l1', title: 'Stock Basics', emoji: '📈', coins: 150, stationId: 1, subTab: 'lessons'})} />
                          <text x="60" y="35" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">Stock Basics 📈</text>
                          
                          <circle cx="70" cy="110" r="10" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" className="cursor-pointer hover:fill-emerald-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l2', title: 'SIP Compounding', emoji: '⏳', coins: 200, stationId: 1, subTab: 'architect'})} />
                          <text x="70" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">SIP Compound ⏳</text>

                          {/* Station 2 */}
                          <circle cx="370" cy="80" r="16" fill="#78350f" stroke="#fbbf24" strokeWidth="2" className="cursor-pointer hover:scale-115 transition-transform lesson-panel-enter lesson-panel-enter-d2 opacity-0" onClick={() => setActiveStation(2)} />
                          <text x="370" y="83" textAnchor="middle" fill="#fbbf24" fontSize="6" fontWeight="bold" className="select-none pointer-events-none lesson-panel-enter lesson-panel-enter-d2 opacity-0">Portfolio</text>
                          
                          <circle cx="440" cy="50" r="10" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" className="cursor-pointer hover:fill-amber-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l12', title: 'Active vs Passive MFs', emoji: '⚖️', coins: 200, stationId: 2, subTab: 'lessons'})} />
                          <text x="440" y="35" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">Active vs Pass ⚖️</text>

                          <circle cx="430" cy="110" r="10" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" className="cursor-pointer hover:fill-amber-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l15', title: 'Sovereign Gold Bonds', emoji: '🥇', coins: 240, stationId: 2, subTab: 'architect'})} />
                          <text x="430" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">SGB Gold 🥇</text>

                          {/* Station 3 */}
                          <circle cx="130" cy="220" r="16" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" className="cursor-pointer hover:scale-115 transition-transform lesson-panel-enter lesson-panel-enter-d2 opacity-0" onClick={() => setActiveStation(3)} />
                          <text x="130" y="223" textAnchor="middle" fill="#60a5fa" fontSize="6" fontWeight="bold" className="select-none pointer-events-none lesson-panel-enter lesson-panel-enter-d2 opacity-0">Forensics</text>
                          
                          <circle cx="60" cy="200" r="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" className="cursor-pointer hover:fill-blue-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l3', title: 'P/E Ratios', emoji: '📊', coins: 250, stationId: 3, subTab: 'lessons'})} />
                          <text x="60" y="185" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">P/E Ratios 📊</text>

                          <circle cx="70" cy="260" r="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" className="cursor-pointer hover:fill-blue-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l5', title: 'Balance Sheets', emoji: '📋', coins: 300, stationId: 3, subTab: 'lessons'})} />
                          <text x="70" y="275" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">Balance Sheet 📋</text>

                          {/* Station 4 */}
                          <circle cx="370" cy="220" r="16" fill="#4c1d95" stroke="#a78bfa" strokeWidth="2" className="cursor-pointer hover:scale-115 transition-transform lesson-panel-enter lesson-panel-enter-d2 opacity-0" onClick={() => setActiveStation(4)} />
                          <text x="370" y="223" textAnchor="middle" fill="#c084fc" fontSize="6" fontWeight="bold" className="select-none pointer-events-none lesson-panel-enter lesson-panel-enter-d2 opacity-0">Derivatives</text>
                          
                          <circle cx="440" cy="200" r="10" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" className="cursor-pointer hover:fill-violet-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l9', title: 'Calls & Puts Options', emoji: '🎭', coins: 400, stationId: 4, subTab: 'lessons'})} />
                          <text x="440" y="185" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">Calls & Puts 🎭</text>

                          <circle cx="430" cy="260" r="10" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" className="cursor-pointer hover:fill-violet-500/20 lesson-panel-enter lesson-panel-enter-d3 opacity-0" onClick={() => handleSelectAcademyTopic({id: 'l44', title: 'Leverage & Margin Risks', emoji: '⚠️', coins: 400, stationId: 4, subTab: 'lessons'})} />
                          <text x="430" y="275" textAnchor="middle" fill="#cbd5e1" fontSize="6" className="select-none lesson-panel-enter lesson-panel-enter-d3 opacity-0">Leverage Risks ⚠️</text>
                        </svg>
                        <div className="absolute bottom-2 text-[8px] text-slate-500 font-mono tracking-wider">
                          Interactive Nodes: Click category to switch station, click lesson to study
                        </div>
                      </div>
                    )}


                  </div>
        </div>
                    {/* Floating Duolingo Lesson Detail Popover */}
                    {selectedRoadLesson && (() => {
                      const lesson = selectedRoadLesson;
                      const stationId = lesson.stationId;
                      const overallIdx = ALL_ROAD_NODES.findIndex(n => n.type === "lesson" && n.data?.id === lesson.id);
                      const unlocked = isNodeUnlocked({ type: "lesson", data: lesson }, overallIdx);
                      const completed = user?.lessonsCompleted?.includes(lesson.id) || false;
                      const isDnaFit = (
                        (financialDna?.includes("Safe Saver") && ["l2", "l6", "l8", "l11", "l13", "l15", "l23", "l24", "l25", "l26", "l29"].includes(lesson.id)) ||
                        (financialDna?.includes("Risk Taker") && ["l7", "l9", "l20", "l21", "l22", "l38", "l39", "l40", "l41", "l42", "l43", "l44"].includes(lesson.id)) ||
                        (financialDna?.includes("Balanced Builder") && ["l1", "l3", "l4", "l5", "l10", "l12", "l14", "l16", "l17", "l18", "l19", "l27", "l28", "l30", "l31", "l32", "l33", "l34", "l35", "l36", "l37"].includes(lesson.id))
                      );
                      
                      const chapterName = {
                        1: "Financial Foundations",
                        2: "Portfolio Builder",
                        3: "Corporate Forensics",
                        4: "Derivatives Arena"
                      }[stationId];

                      return (
                        <div 
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setSelectedRoadLesson(null);
                            }
                          }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in cursor-default"
                        >
                          <div 
                            className="relative w-full max-w-md bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-md max-h-[90vh] flex flex-col"
                          >
                            {/* Accent Glow decoration */}
                            <div className="absolute -top-12 -left-12 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

                            {/* Close Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoadLesson(null);
                              }}
                              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110 active:scale-95 z-50 shadow-md text-lg"
                            >
                              ✕
                            </button>

                            {/* Scrollable Container */}
                            <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar space-y-6 pr-1">
                              {/* Lesson Header */}
                              <div className="text-center space-y-2">
                                <span className="text-5xl block animate-bounce my-2">{lesson.emoji || "🎓"}</span>
                                <span className="bg-violet-500/10 text-violet-300 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-violet-500/20 inline-block">
                                  Station {stationId} • {chapterName}
                                </span>
                                <h3 className="text-xl font-black text-white">{lesson.title}</h3>
                                <p className="text-xs text-slate-400">
                                  Mode: {lesson.subTab === "architect" ? "💼 Portfolio Architect Simulator" : "🎮 Academy Concept Playground"}
                                </p>
                              </div>

                              {/* Rewards Summary */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
                                <div className="text-center py-2">
                                  <span className="text-xs text-slate-400 block font-bold">Reward Coins</span>
                                  <span className="text-sm font-black text-yellow-400 font-mono">🪙 +{lesson.coins}</span>
                                </div>
                                <div className="text-center py-2">
                                  <span className="text-xs text-slate-400 block font-bold">XP Points</span>
                                  <span className="text-sm font-black text-violet-400 font-mono">⚡ +100 XP</span>
                                </div>
                              </div>

                              {/* Simple Analogy block */}
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 relative">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm">🤖</span>
                                  <span className="text-[10px] uppercase tracking-wider font-black text-violet-400">
                                    AI Guru Analogy
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                  "{getSimpleExplanation(lesson.id, audioLang)}"
                                </p>
                              </div>

                              {/* DNA Match banner if applicable */}
                              {isDnaFit && (
                                <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 p-3 rounded-2xl flex items-center gap-3">
                                  <span className="text-2xl animate-wiggle">🎯</span>
                                  <div>
                                    <span className="text-[9px] font-black text-violet-300 uppercase block tracking-wider">
                                      Archetype DNA Match
                                    </span>
                                    <p className="text-[10px] text-slate-300">
                                      Matches your financial personality! Earns full retention points.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="space-y-2 pt-2">
                                {unlocked ? (
                                  <button
                                    onClick={() => {
                                      handleSelectAcademyTopic(lesson);
                                      setSelectedRoadLesson(null);
                                    }}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
                                  >
                                    🚀 Start Simulation Lesson
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <button
                                      disabled
                                      className="w-full py-3.5 bg-white/5 text-slate-500 border border-white/5 font-black text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      🔒 Locked Module
                                    </button>
                                    <p className="text-[9px] text-slate-500 text-center">
                                      Complete the preceding module in order to unlock this lesson.
                                    </p>
                                  </div>
                                )}
                                <button
                                  onClick={() => setSelectedRoadLesson(null)}
                                  className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white border border-white/5 font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                  Go Back
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Floating Duolingo Glossary Story Popover */}
                    {activeStoryNode && (() => {
                      const node = activeStoryNode;
                      const completed = user?.lessonsCompleted?.includes(node.id) || false;
                      const storyDetails = getStoryDetails(node.id, audioLang);
                      const options = storyDetails.options;

                      return (
                        <div 
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setActiveStoryNode(null);
                            }
                          }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in cursor-default"
                        >
                          <div 
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStoryNode(null);
                              }}
                              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110 active:scale-95 z-50 shadow-md text-lg"
                            >
                              ✕
                            </button>

                            <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar space-y-6 pr-1">
                              <div className="text-center space-y-2">
                                <span className="text-5xl block animate-bounce">📖</span>
                                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-teal-500/30">
                                  Glossary Micro-Story
                                </span>
                                <h3 className="text-lg font-black text-white">{node.title}</h3>
                              </div>

                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 relative">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm">🤖</span>
                                  <span className="text-[10px] uppercase tracking-wider font-black text-teal-400">AI Guru Storyteller</span>
                                </div>
                                <p className="text-xs text-slate-300 italic leading-relaxed">
                                  "{storyDetails.story}"
                                </p>
                              </div>

                              {!completed && !storySuccess ? (
                                <div className="space-y-3">
                                  <span className="text-[10px] font-black text-slate-400 block uppercase">Multiple Choice Question:</span>
                                  <p className="text-xs text-white font-bold">{storyDetails.question}</p>
                                  <div className="space-y-2">
                                    {options.map((opt, oIdx) => (
                                      <button
                                        key={oIdx}
                                        onClick={() => setSelectedStoryOption(oIdx)}
                                        className={`w-full p-3 text-left text-xs rounded-xl border transition cursor-pointer font-bold ${
                                          selectedStoryOption === oIdx
                                            ? "bg-teal-600/30 border-teal-400 text-white"
                                            : "bg-black/30 border-white/5 text-slate-300 hover:bg-white/2"
                                        }`}
                                      >
                                        {opt.text}
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    disabled={selectedStoryOption === null}
                                    onClick={() => {
                                      const opt = options[selectedStoryOption];
                                      if (opt.correct) {
                                        setStorySuccess(true);
                                        if (updateUser && user) {
                                          updateUser({
                                            virtualCoins: (user.virtualCoins || 0) + 50,
                                            lessonsCompleted: [...(user.lessonsCompleted || []), node.id]
                                          });
                                        }
                                        toast.success("🎯 Correct Answer! +50 Coins claimed!");
                                      } else {
                                        toast.error("❌ Oops, that is not correct. Try reading the Guru story again!");
                                      }
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-sm rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Submit Answer
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center space-y-4 py-2">
                                  <span className="text-3xl block">🎉</span>
                                  <p className="text-sm font-black text-teal-400">Story completed successfully!</p>
                                  <p className="text-xs text-slate-400">You earned +50 Coins. The next node is unlocked.</p>
                                  <button
                                    onClick={() => setActiveStoryNode(null)}
                                    className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-slate-300 font-bold text-xs rounded-xl border border-white/5 cursor-pointer"
                                  >
                                    Close Story
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Floating Timed Side-Quest Popover */}
                    {activeSideQuestNode && (() => {
                      const node = activeSideQuestNode;
                      const qList = [
                        { q: "UPI money transfers happen...", options: ["Instantly from bank to bank", "After 2 business days", "Only on weekdays"], correct: 0 },
                        { q: "CIBIL Score is...", options: ["Your credit card bill amount", "Your borrowing history score", "Your overall asset count"], correct: 1 },
                        { q: "Compounding growth curve is...", options: ["Linear", "Exponential", "Negative"], correct: 1 }
                      ];

                      return (
                        <div 
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setActiveSideQuestNode(null);
                            }
                          }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in cursor-default"
                        >
                          <div 
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSideQuestNode(null);
                              }}
                              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110 active:scale-95 z-50 shadow-md text-lg"
                            >
                              ✕
                            </button>

                            <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar space-y-6 pr-1">
                              <div className="text-center space-y-2">
                                <span className="text-5xl block animate-bounce">👑</span>
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-yellow-500/30">
                                  Bonus Side-Quest Game
                                </span>
                                <h3 className="text-lg font-black text-white">{node.title}</h3>
                              </div>

                              {sideQuestStep <= qList.length ? (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>QUESTION {sideQuestStep} OF {qList.length}</span>
                                    <span className="text-yellow-400">Reward: +{node.coins} Coins</span>
                                  </div>
                                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full transition-all duration-300" style={{ width: `${(sideQuestStep / qList.length) * 100}%` }} />
                                  </div>

                                  {(() => {
                                    const currentQ = qList[sideQuestStep - 1];
                                    return (
                                      <div className="space-y-3 pt-2">
                                        <p className="text-xs text-white font-bold">{currentQ.q}</p>
                                        <div className="space-y-2">
                                          {currentQ.options.map((opt, oIdx) => (
                                            <button
                                              key={oIdx}
                                              onClick={() => {
                                                if (oIdx === currentQ.correct) {
                                                  toast.success("Correct! Next question...");
                                                  if (sideQuestStep === qList.length) {
                                                    setSideQuestSuccess(true);
                                                    if (updateUser && user) {
                                                      updateUser({
                                                        virtualCoins: (user.virtualCoins || 0) + node.coins,
                                                        lessonsCompleted: [...(user.lessonsCompleted || []), node.id]
                                                      });
                                                    }
                                                    setSideQuestStep(sideQuestStep + 1);
                                                  } else {
                                                    setSideQuestStep(sideQuestStep + 1);
                                                  }
                                                } else {
                                                  toast.error("❌ Wrong answer! Side-quest failed. Try again!");
                                                  setActiveSideQuestNode(null);
                                                }
                                              }}
                                              className="w-full p-3 text-left text-xs rounded-xl border border-white/5 bg-black/30 text-slate-300 hover:bg-white/2 transition cursor-pointer font-bold"
                                            >
                                              {opt}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="text-center space-y-4 py-2 animate-fade-in">
                                  <span className="text-4xl block">🏆</span>
                                  <p className="text-sm font-black text-yellow-400">Side-Quest Challenge Cleared!</p>
                                  <p className="text-xs text-slate-400">You earned +{node.coins} Coins and unlocked the badge!</p>
                                  <button
                                    onClick={() => setActiveSideQuestNode(null)}
                                    className="w-full py-2.5 bg-black/40 hover:bg-black/60 text-slate-300 font-bold text-xs rounded-xl border border-white/5 cursor-pointer"
                                  >
                                    Claim Rewards
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

        
        {/* GLOSSARY DRAWER SLIDE-OUT PANEL */}
        {showGlossaryDrawer && (
          <div 
            className="fixed inset-0 z-45 bg-black/70 backdrop-blur-md transition-opacity duration-300"
            onClick={() => {
              setShowGlossaryDrawer(false);
              setShowComparisonPanel(false);
            }}
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 w-[450px] bg-slate-950/85 backdrop-blur-2xl border-l border-white/10 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-350 ease-in-out flex flex-col ${
            showGlossaryDrawer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-sm shadow-md animate-pulse">📖</div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Glossary Lookup</span>
                  {showComparisonPanel && (
                    <span className="text-[8px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded border border-violet-500/30 uppercase tracking-widest font-mono">Compare Mode</span>
                  )}
                </h3>
                <p className="text-[9px] text-slate-500 font-mono">Interact & explore financial concepts</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowGlossaryDrawer(false);
                setShowComparisonPanel(false);
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white border border-white/5 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Render Comparison View */}
          {showComparisonPanel && compareTermA && compareTermB ? (() => {
            const itemA = defaultGlossary.find(g => g.term === compareTermA) || { term: compareTermA, category: "General", short: "No description" };
            const itemB = defaultGlossary.find(g => g.term === compareTermB) || { term: compareTermB, category: "General", short: "No description" };
            const enrichmentA = getGlossaryEnrichment(compareTermA);
            const enrichmentB = getGlossaryEnrichment(compareTermB);

            return (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 bg-black/20 border-b border-white/5 flex justify-between items-center">
                  <button
                    onClick={() => setShowComparisonPanel(false)}
                    className="text-[10px] text-cyan-400 hover:text-white font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    ← Back to Search
                  </button>
                  <button
                    onClick={() => {
                      setCompareTermA(null);
                      setCompareTermB(null);
                      setShowComparisonPanel(false);
                    }}
                    className="text-[9px] text-rose-400 hover:text-rose-300 font-extrabold cursor-pointer"
                  >
                    Clear Both
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {/* Cards side-by-side or stacked grid */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {/* Term A */}
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2 relative">
                      <span className="absolute top-2 right-2 text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        {itemA.category}
                      </span>
                      <h4 className="font-extrabold text-xs text-white leading-tight mt-1">{itemA.term}</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed">{itemA.short}</p>
                    </div>

                    {/* Term B */}
                    <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-2 relative">
                      <span className="absolute top-2 right-2 text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        {itemB.category}
                      </span>
                      <h4 className="font-extrabold text-xs text-white leading-tight mt-1">{itemB.term}</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed">{itemB.short}</p>
                    </div>
                  </div>

                  {/* Contrast comparison properties */}
                  <div className="border border-white/5 rounded-2xl bg-black/40 overflow-hidden text-xs text-left">
                    {/* Row 1: Used In */}
                    <div className="p-3 border-b border-white/5 space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">📍 Used In</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-[10px] text-cyan-300 font-bold">{enrichmentA.usedIn}</div>
                        <div className="text-[10px] text-violet-300 font-bold">{enrichmentB.usedIn}</div>
                      </div>
                    </div>

                    {/* Row 2: Connected Field */}
                    <div className="p-3 border-b border-white/5 space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">📊 Connected Field</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-[10px] text-slate-300 font-mono">{enrichmentA.fieldUsed}</div>
                        <div className="text-[10px] text-slate-300 font-mono">{enrichmentB.fieldUsed}</div>
                      </div>
                    </div>

                    {/* Row 3: Example Usage */}
                    <div className="p-3 border-b border-white/5 space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">💡 Example Usage</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-[9px] text-slate-400 italic leading-relaxed">"{enrichmentA.example}"</div>
                        <div className="text-[9px] text-slate-400 italic leading-relaxed">"{enrichmentB.example}"</div>
                      </div>
                    </div>

                    {/* Row 4: Formula / Equation */}
                    {(GLOSSARY_FORMULAS[itemA.term] || GLOSSARY_FORMULAS[itemB.term]) && (
                      <div className="p-3 space-y-1 bg-cyan-950/10">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">🧮 Formula / Equation</span>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-[10px] text-cyan-200 font-mono">
                            {GLOSSARY_FORMULAS[itemA.term]?.notation || "N/A (Conceptual)"}
                          </div>
                          <div className="text-[10px] text-violet-200 font-mono">
                            {GLOSSARY_FORMULAS[itemB.term]?.notation || "N/A (Conceptual)"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (
            <>
              {/* Search & Filters */}
              <div className="p-4 border-b border-white/5 space-y-3 bg-black/20">
                {/* Search Input with Bookmarks Toggle */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search terms... e.g. P/E, SIP"
                      value={glossarySearch}
                      onChange={(e) => setGlossarySearch(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl py-2 pl-9 pr-8 text-xs text-white outline-none transition font-mono"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
                    {glossarySearch && (
                      <button
                        onClick={() => setGlossarySearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowBookmarksOnly(prev => !prev)}
                    className={`px-3 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      showBookmarksOnly
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                    title={showBookmarksOnly ? "Show All Terms" : "Show Bookmarked Terms Only"}
                  >
                    <span>⭐</span>
                  </button>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {["All", "Banking", "Stocks", "Trading", "Derivatives", "Crypto", "Macro", "Forex", "Insurance", "Valuation", "Investing", "Planning", "Mutual Fund", "Income", "Debt", "Commodity", "Global"].map((cat) => {
                    const isActive = glossaryCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setGlossaryCategoryFilter(cat);
                          setGlossarySearch("");
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* A-Z Jumping bar */}
                <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[8px] border-t border-white/5 pt-2">
                  {["All", ...("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""))].map((letter) => {
                    const isActive = glossaryLetterFilter === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => setGlossaryLetterFilter(letter)}
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/30"
                            : "text-slate-500 hover:text-white"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List Section */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {(() => {
                  const filtered = defaultGlossary.filter((g) => {
                    const matchesSearch =
                      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
                      g.short.toLowerCase().includes(glossarySearch.toLowerCase());
                    const matchesCategory =
                      glossaryCategoryFilter === "All" || g.category === glossaryCategoryFilter;
                    const matchesLetter =
                      glossaryLetterFilter === "All" ||
                      g.term.trim().charAt(0).toUpperCase() === glossaryLetterFilter;
                    const matchesBookmark = !showBookmarksOnly || bookmarkedTerms.includes(g.term);
                    return matchesSearch && matchesCategory && matchesLetter && matchesBookmark;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 text-xs bg-white/2 rounded-2xl border border-white/5">
                        <div className="text-2xl mb-1">🔍</div>
                        <p className="font-bold text-white">No glossary terms found</p>
                        <p className="text-[10px] mt-0.5">Try resetting filters or search query</p>
                      </div>
                    );
                  }

                  return filtered.map((item, idx) => {
                    const enrichment = getGlossaryEnrichment(item.term);
                    const isLiked = likedTerms.includes(item.term);
                    const finalLikesCount = enrichment.likes + (isLiked ? 1 : 0);
                    const isSpoken = activeSpokenTerm === item.term;
                    const isCompareSelected = compareTermA === item.term || compareTermB === item.term;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all duration-300 text-left relative group ${
                          glossarySearch === item.term
                            ? "border-cyan-400 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-[1.01]"
                            : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/4 hover:scale-[1.005]"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-xs text-white tracking-tight flex items-center gap-1">
                            {item.term}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Narrator TTS */}
                            <button
                              onClick={() => speakTerm(item.term, item.short)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition cursor-pointer ${
                                isSpoken
                                  ? "bg-cyan-500/20 text-cyan-400 animate-pulse border border-cyan-500/30"
                                  : "bg-white/5 text-slate-400 hover:text-white"
                              }`}
                              title="Read definition aloud"
                            >
                              {isSpoken ? "🔊" : "🔈"}
                            </button>

                            {/* Compare Checkbox */}
                            <button
                              onClick={() => handleToggleCompare(item.term)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[9px] transition cursor-pointer border ${
                                isCompareSelected
                                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30 font-bold"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                              }`}
                              title="Select to compare side-by-side"
                            >
                              ⚖️
                            </button>

                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(item.term);
                              }}
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition cursor-pointer ${
                                bookmarkedTerms.includes(item.term)
                                  ? "text-amber-400"
                                  : "text-slate-500 hover:text-amber-400"
                              }`}
                              title={bookmarkedTerms.includes(item.term) ? "Remove Bookmark" : "Add Bookmark"}
                            >
                              {bookmarkedTerms.includes(item.term) ? "★" : "☆"}
                            </button>

                            <span className="text-[7.5px] uppercase font-mono font-black px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              {item.category}
                            </span>
                            <button
                              onClick={() => toggleLikeTerm(item.term)}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black border transition cursor-pointer ${
                                isLiked
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                              }`}
                            >
                              <Heart className={`w-2 h-2 ${isLiked ? "fill-current" : ""}`} />
                              <span>{finalLikesCount}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-300 leading-relaxed font-semibold mt-1.5">
                          {item.short}
                        </p>

                        {GLOSSARY_FORMULAS[item.term] && (
                          <div className="bg-cyan-500/5 p-2.5 rounded-xl border border-cyan-500/15 font-mono text-[9.5px] text-cyan-300 text-center mt-2.5">
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider block font-mono text-left mb-1">🧮 Formula:</span>
                            <div className="font-extrabold text-cyan-200">{GLOSSARY_FORMULAS[item.term].notation}</div>
                          </div>
                        )}

                        <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 space-y-1.5 text-[9px] font-mono text-slate-400 mt-2.5">
                          <div>
                            📍 <span className="font-bold text-slate-300">Used in:</span> {enrichment.usedIn}
                          </div>
                          <div>
                            📊 <span className="font-bold text-slate-300">Connected to:</span> {enrichment.fieldUsed}
                          </div>
                          <div className="border-t border-white/5 pt-1.5 text-[9px] text-slate-400 font-sans italic">
                            💡 <span className="font-bold text-slate-300 font-mono not-italic">Example:</span> {enrichment.example}
                          </div>
                        </div>
                        {enrichment.memoryHook && (
                          <div className="bg-pink-500/5 border border-pink-500/15 p-2.5 rounded-xl text-[9px] text-pink-300 font-sans mt-2.5 text-left">
                            <strong className="text-pink-400 font-mono block text-[8px] uppercase tracking-wider mb-0.5">🧠 Mnemonic Anchor</strong>
                            {enrichment.memoryHook}
                          </div>
                        )}
                        {enrichment.confusedWith && (
                          <div className="bg-rose-500/5 border border-rose-500/15 p-2.5 rounded-xl text-[9px] text-rose-350 font-sans mt-2.5 text-left">
                            <strong className="text-rose-400 font-mono block text-[8px] uppercase tracking-wider mb-0.5">⚠️ Confusion Alert</strong>
                            Often confused with{" "}
                            <span
                              className="font-extrabold underline cursor-pointer hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCompare(enrichment.confusedWith);
                              }}
                            >
                              {enrichment.confusedWith}
                            </span>. Click to compare.
                          </div>
                        )}
                        {enrichment.relatedTerms && enrichment.relatedTerms.length > 0 && (
                          <div className="bg-slate-950/40 border border-white/5 rounded-xl p-2.5 mt-2.5 text-[9px] font-sans text-left">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block font-mono mb-1">🕸️ Related Terms</span>
                            <div className="flex flex-wrap gap-1">
                              {enrichment.relatedTerms.map(rt => (
                                <button
                                  key={rt}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGlossarySearch(rt);
                                  }}
                                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 text-[9px] text-slate-350 rounded transition cursor-pointer"
                                >
                                  {rt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Sticky comparison floating action banner */}
              {compareTermA && compareTermB && (
                <div className="p-3 border-t border-white/10 bg-black/80 flex justify-between items-center shadow-inner relative z-10">
                  <div className="text-[9px] text-white font-extrabold text-left leading-snug">
                    ⚖️ Selected: <span className="text-cyan-400 font-mono">{compareTermA}</span> & <span className="text-violet-400 font-mono">{compareTermB}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCompareTermA(null);
                        setCompareTermB(null);
                      }}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-white/5 transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowComparisonPanel(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-[9px] font-black px-3.5 py-1.5 rounded-lg shadow-md transition cursor-pointer animate-pulse"
                    >
                      Compare Side-by-Side
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

<SectionGuide sectionId="/playground" />
      </main>
    
    </div>
  );
};

export default Playground;
