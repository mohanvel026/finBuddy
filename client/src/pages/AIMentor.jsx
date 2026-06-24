import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
/* import Sidebar removed */
import api from "../services/api";
import toast from "react-hot-toast";
import SectionGuide from "../components/common/SectionGuide";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-extrabold text-cyan-400 mb-2 tracking-wider uppercase">
          {label} Metrics
        </p>
        <div className="space-y-2 text-xs">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-8"
            >
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-extrabold text-slate-200">
                {entry.name === "Score"
                  ? entry.value
                  : "₹" + entry.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Parse inline bold, italic, code, links
const parseInlineMarkdown = (text) => {
  if (!text) return "";
  const regex = /(\*\*.*?\*\*|`.*?`|https?:\/\/[^\s]+)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-extrabold text-white">{part.substring(2, part.length - 2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-black/35 text-cyan-400 font-mono text-[11px] px-1.5 py-0.5 rounded border border-white/5 mx-0.5">{part.substring(1, part.length - 1)}</code>;
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline hover:text-cyan-300 font-bold">{part}</a>;
    }
    return part;
  });
};

// Markdown block parser (headers, lists, code blocks, tables)
const renderMarkdown = (text) => {
  if (!text) return "";
  const parts = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let lastIndex = 0;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const before = text.substring(lastIndex, match.index);
    if (before) parts.push({ type: 'text', content: before });
    parts.push({ type: 'codeBlock', lang: match[1], content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  const after = text.substring(lastIndex);
  if (after) parts.push({ type: 'text', content: after });
  if (parts.length === 0) parts.push({ type: 'text', content: text });

  return parts.map((part, idx) => {
    if (part.type === 'codeBlock') {
      return (
        <pre key={idx} className="bg-black/60 border border-white/5 rounded-2xl p-4 my-3 overflow-x-auto font-mono text-xs text-cyan-300 shadow-inner">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest border-b border-white/5 pb-2 mb-2 select-none">
            <span>💻 {part.lang || 'code'}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(part.content);
                toast.success("Code copied! 📋");
              }}
              className="hover:text-white cursor-pointer transition"
            >
              Copy
            </button>
          </div>
          <code>{part.content.trim()}</code>
        </pre>
      );
    }

    const lines = part.content.split('\n');
    let inList = false;
    let listItems = [];
    const formattedElements = [];

    const flushList = (keyPrefix) => {
      if (listItems.length > 0) {
        formattedElements.push(
          <ul key={`list-${keyPrefix}`} className="list-disc pl-5 my-2 space-y-1 text-slate-300">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        inList = true;
        listItems.push(
          <li key={`li-${lineIdx}`} className="leading-relaxed">
            {parseInlineMarkdown(trimmed.substring(2))}
          </li>
        );
        return;
      }
      if (inList) flushList(lineIdx);

      if (trimmed.startsWith('### ')) {
        formattedElements.push(
          <h4 key={lineIdx} className="text-sm font-black text-white mt-4 mb-2 tracking-wide border-b border-white/5 pb-1">
            {parseInlineMarkdown(trimmed.substring(4))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        formattedElements.push(
          <h3 key={lineIdx} className="text-base font-black text-white mt-5 mb-2.5 tracking-wide border-b border-white/5 pb-1.5">
            {parseInlineMarkdown(trimmed.substring(3))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        formattedElements.push(
          <h2 key={lineIdx} className="text-lg font-black text-white mt-6 mb-3 tracking-wide border-b border-white/10 pb-2">
            {parseInlineMarkdown(trimmed.substring(2))}
          </h2>
        );
        return;
      }
      if (trimmed === '') {
        formattedElements.push(<div key={`br-${lineIdx}`} className="h-2" />);
        return;
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        formattedElements.push(
          <p key={lineIdx} className="my-1 font-mono text-[11px] bg-black/10 px-2 py-1 rounded border border-white/5 max-w-full overflow-x-auto">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
        return;
      }

      formattedElements.push(
        <p key={lineIdx} className="leading-relaxed my-1.5 text-slate-300">
          {parseInlineMarkdown(line)}
        </p>
      );
    });

    flushList(idx);
    return <div key={idx}>{formattedElements}</div>;
  });
};

const AIMentor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  // Chat Sessions history states
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => localStorage.getItem('finbuddy_mentor_session_id') || null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [audioLang, setAudioLang] = useState("en");
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.05);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState("");

  const localizedWelcomes = {
    en: "Hey! I'm your FinBuddy AI Mentor 🤖💰 Ask me anything about stocks, investing, budgeting, or your portfolio. I'm here to help you grow!",
    ta: "வணக்கம்! நான் உங்கள் FinBuddy AI வழிகாட்டி 🤖💰 பங்குகள், முதலீடு, வரவு செலவுத் திட்டம் அல்லது உங்கள் போர்ட்ஃபோலியோ பற்றி என்னிடம் எது வேண்டுமானாலும் கேளுங்கள். உங்களுக்கு உதவ நான் இங்கு இருக்கிறேன்!",
    tanglish: "Hey buddy! Naan dhan unga FinBuddy AI Mentor 🤖💰 Stocks, investing, budgeting, ila unga portfolio pathi edhunaalum kelunga, clear-a explain panren!"
  };

  const [bookmarks, setBookmarks] = useState(() => JSON.parse(localStorage.getItem('finbuddy_mentor_bookmarks') || '[]'));

  useEffect(() => {
    localStorage.setItem('finbuddy_mentor_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get('/mentor/chat-sessions');
      if (data.success) {
        setSessions(data.sessions || []);
        
        const savedId = localStorage.getItem('finbuddy_mentor_session_id');
        const found = data.sessions.find(s => s._id === savedId);
        if (found) {
          setActiveSessionId(savedId);
          setMessages(found.messages.length > 0 ? found.messages : [
            { role: "assistant", content: localizedWelcomes[audioLang] }
          ]);
        } else if (data.sessions.length > 0) {
          const latestId = data.sessions[0]._id;
          setActiveSessionId(latestId);
          localStorage.setItem('finbuddy_mentor_session_id', latestId);
          setMessages(data.sessions[0].messages.length > 0 ? data.sessions[0].messages : [
            { role: "assistant", content: localizedWelcomes[audioLang] }
          ]);
        } else {
          createNewSession();
        }
      }
    } catch (e) {
      toast.error('Failed to load chat history');
    }
    setLoadingSessions(false);
  };

  const createNewSession = async () => {
    try {
      const { data } = await api.post('/mentor/chat-sessions', { title: 'New Chat' });
      if (data.success) {
        setSessions(prev => [data.session, ...prev]);
        setActiveSessionId(data.session._id);
        localStorage.setItem('finbuddy_mentor_session_id', data.session._id);
        setMessages([
          { role: "assistant", content: localizedWelcomes[audioLang] }
        ]);
        return data.session._id;
      }
    } catch (e) {
      toast.error('Failed to create new chat session');
    }
    return null;
  };

  const selectSession = (session) => {
    setActiveSessionId(session._id);
    localStorage.setItem('finbuddy_mentor_session_id', session._id);
    setMessages(session.messages.length > 0 ? session.messages : [
      { role: "assistant", content: localizedWelcomes[audioLang] }
    ]);
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this chat history?')) return;
    try {
      const { data } = await api.delete(`/mentor/chat-sessions/${sessionId}`);
      if (data.success) {
        toast.success('Chat deleted');
        const nextSessions = sessions.filter(s => s._id !== sessionId);
        setSessions(nextSessions);
        
        if (activeSessionId === sessionId) {
          if (nextSessions.length > 0) {
            selectSession(nextSessions[0]);
          } else {
            createNewSession();
          }
        }
      }
    } catch (e) {
      toast.error('Failed to delete chat');
    }
  };

  const toggleBookmark = (content) => {
    if (bookmarks.includes(content)) {
      setBookmarks(prev => prev.filter(b => b !== content));
      toast.success('Bookmark removed');
    } else {
      setBookmarks(prev => [...prev, content]);
      toast.success('Bookmark saved! 🔖');
    }
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
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([
        {
          role: "assistant",
          content: localizedWelcomes[audioLang]
        }
      ]);
    }
  }, [audioLang]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [financialTwin, setFinancialTwin] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [whatIfForm, setWhatIfForm] = useState({
    scenario: "",
    amount: "",
    duration: "12",
  });
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [taxForm, setTaxForm] = useState({
    income: "",
    regime: "new",
    section80C: "",
    section80D: "",
  });
  const [taxResult, setTaxResult] = useState(null);
  const [loadingTab, setLoadingTab] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  useEffect(() => {
    if (activeTab === "report" && !weeklyReport) loadWeeklyReport();
    if (activeTab === "twin" && !financialTwin) loadFinancialTwin();
    if (activeTab === "learn" && lessons.length === 0) loadLessons();
  }, [activeTab]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = await createNewSession();
      if (!currentSessionId) return;
    }

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/mentor/ask", { 
        question: input, 
        lang: audioLang,
        sessionId: currentSessionId
      });
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);

      setSessions(prev => prev.map(s => {
        if (s._id === currentSessionId) {
          return {
            ...s,
            title: data.session?.title || s.title,
            messages: data.session?.messages || [...s.messages, userMsg, { role: "assistant", content: data.answer }]
          };
        }
        return s;
      }));
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again! 🙏",
        },
      ]);
    }
    setLoading(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      toast("Listening... Speak now! 🎙️", {
        id: "voice-listening",
        icon: "🎙️",
        duration: 4000,
      });
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      toast.error(`Voice error: ${event.error}`, { id: "voice-listening" });
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      if (spokenText.trim()) {
        setInput((prev) => (prev ? prev + " " + spokenText : spokenText));
        toast.success("Voice captured! 🎙️", { id: "voice-listening" });
      }
    };
    recognition.start();
  };

  const quickQuestions = [
    "Should I start investing now or wait?",
    "What is a good PE ratio for Indian stocks?",
    "Explain SIP vs lumpsum investment",
    "How much emergency fund should I have?",
    "What is the difference between NIFTY and SENSEX?",
    "How does Section 80C save tax?",
  ];

  const loadWeeklyReport = async () => {
    setLoadingTab(true);
    try {
      const { data } = await api.get("/mentor/weekly-report");
      setWeeklyReport(data.report);
    } catch {
      toast.error("Failed to load report");
    }
    setLoadingTab(false);
  };

  const loadFinancialTwin = async () => {
    setLoadingTab(true);
    try {
      const { data } = await api.get("/mentor/financial-twin");
      setFinancialTwin(data.twin);
    } catch {
      toast.error("Failed to load twin");
    }
    setLoadingTab(false);
  };

  const loadLessons = async () => {
    setLoadingTab(true);
    try {
      const { data } = await api.get("/mentor/lessons");
      setLessons(data.lessons || []);
    } catch {}
    setLoadingTab(false);
  };

  const completeLesson = async (lesson) => {
    if (lesson.completed) return;
    try {
      const { data } = await api.post("/mentor/lesson-complete", {
        lessonId: lesson.id,
        coinsReward: lesson.coins,
      });
      toast.success(data.message);
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, completed: true } : l)),
      );
    } catch {}
  };

  const handleStartLesson = (lesson) => {
    if (lesson.completed) {
      toast("You have already completed this lesson!", { icon: "✅" });
      return;
    }

    let subTab = "lessons";
    let stationId = 1;

    switch (lesson.id) {
      case "l1":
        subTab = "lessons";
        stationId = 1;
        break;
      case "l2":
        subTab = "architect";
        break;
      case "l3":
        subTab = "lessons";
        stationId = 3;
        break;
      case "l4":
        subTab = "lessons";
        stationId = 1;
        break;
      case "l5":
        subTab = "lessons";
        stationId = 3;
        break;
      case "l6":
        subTab = "architect";
        break;
      case "l7":
        subTab = "glossary";
        break;
      case "l8":
        subTab = "architect";
        break;
      case "l9":
        subTab = "lessons";
        stationId = 4;
        break;
      case "l10":
        subTab = "lessons";
        stationId = 2;
        break;
      case "l11":
        subTab = "architect";
        break;
      case "l12":
        subTab = "lessons";
        stationId = 2;
        break;
      case "l13":
        subTab = "architect";
        break;
      default:
        subTab = "lessons";
        stationId = 1;
    }

    navigate("/learn", {
      state: {
        activeLesson: {
          id: lesson.id,
          title: lesson.title,
          coins: lesson.coins,
          emoji: lesson.emoji,
          category: lesson.category,
        },
        subTab,
        stationId,
      },
    });
  };

  const getProjectionData = () => {
    const amt = parseFloat(whatIfForm.amount) || 0;
    const dur = parseInt(whatIfForm.duration) || 12;
    const scenarioLower = (whatIfForm.scenario || "").toLowerCase();

    let rate = 0.12;
    if (
      scenarioLower.includes("fd") ||
      scenarioLower.includes("fixed") ||
      scenarioLower.includes("saving")
    ) {
      rate = 0.07;
    } else if (
      scenarioLower.includes("gold") ||
      scenarioLower.includes("sgb")
    ) {
      rate = 0.09;
    } else if (
      scenarioLower.includes("mid-cap") ||
      scenarioLower.includes("small-cap") ||
      scenarioLower.includes("equity") ||
      scenarioLower.includes("nifty") ||
      scenarioLower.includes("sip") ||
      scenarioLower.includes("mutual")
    ) {
      rate = 0.15;
    } else if (scenarioLower.includes("ppf")) {
      rate = 0.071;
    }

    const baselineRate = 0.07;
    const data = [];
    const monthlyRate = rate / 12;
    const monthlyBaseline = baselineRate / 12;

    for (let m = 0; m <= dur; m++) {
      const invested = amt * m;
      let wealth = 0;
      let baselineWealth = 0;
      if (m > 0) {
        if (monthlyRate === 0) {
          wealth = invested;
        } else {
          wealth =
            amt *
            ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) *
            (1 + monthlyRate);
        }
        if (monthlyBaseline === 0) {
          baselineWealth = invested;
        } else {
          baselineWealth =
            amt *
            ((Math.pow(1 + monthlyBaseline, m) - 1) / monthlyBaseline) *
            (1 + monthlyBaseline);
        }
      }
      data.push({
        month: `${m}m`,
        Invested: Math.round(invested),
        Wealth: Math.round(wealth),
        Baseline: Math.round(baselineWealth),
      });
    }
    const finalInvested = amt * dur;
    const finalWealth = Math.round(data[data.length - 1]?.Wealth || 0);
    const finalBaseline = Math.round(data[data.length - 1]?.Baseline || 0);
    const gains = Math.max(0, finalWealth - finalInvested);
    const wealthGap = Math.max(0, finalWealth - finalBaseline);

    return {
      data,
      rate: Math.round(rate * 100),
      baselineRate: Math.round(baselineRate * 100),
      finalInvested,
      finalWealth,
      finalBaseline,
      gains,
      wealthGap,
    };
  };

  const runWhatIf = async () => {
    if (!whatIfForm.scenario || !whatIfForm.amount) {
      toast.error("Please enter both a scenario name and deposit amount!");
      return;
    }
    setLoadingTab(true);
    try {
      const { data } = await api.post("/mentor/whatif", whatIfForm);
      setWhatIfResult(data.projection);
    } catch {
      toast.error("Failed to generate AI strategy projection.");
    }
    setLoadingTab(false);
  };

  const calcTax = async () => {
    let incomeVal = taxForm.income;
    if (!incomeVal || !incomeVal.trim()) {
      incomeVal = "600000";
      setTaxForm((prev) => ({ ...prev, income: "600000" }));
      toast.success(
        "Calculated using standard placeholder income ₹6,00,000 📊",
        { icon: "🧾" },
      );
    }
    setLoadingTab(true);
    try {
      const { data } = await api.get("/mentor/tax-estimate", {
        params: {
          income: incomeVal,
          regime: taxForm.regime,
          section80C: taxForm.section80C || 0,
          section80D: taxForm.section80D || 0,
        },
      });
      setTaxResult(data);
    } catch (e) {
      console.error(e);
      toast.error(
        "Failed to calculate tax. Please check your network connection.",
      );
    }
    setLoadingTab(false);
  };

  const tabs = ["chat", "voice", "report", "twin", "learn", "whatif", "tax"];

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 flex flex-col h-screen pt-16 lg:pt-0">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">🤖 AI Mentor</h1>
            <p className="text-slate-400 text-sm mt-1">
              Your personal AI financial coach
            </p>
          </div>
          
          <div className="flex bg-black/45 border border-white/10 p-0.5 rounded-xl gap-0.5 shrink-0 shadow-lg">
            <button
              onClick={() => setAudioLang("en")}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                audioLang === "en"
                  ? "bg-cyan-500 text-black font-extrabold shadow-md scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => setAudioLang("ta")}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                audioLang === "ta"
                  ? "bg-cyan-500 text-black font-extrabold shadow-md scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇮🇳 தமிழ் (TA)
            </button>
            <button
              onClick={() => setAudioLang("tanglish")}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                audioLang === "tanglish"
                  ? "bg-cyan-500 text-black font-extrabold shadow-md scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💬 Tanglish
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
        </div>

        {/* Mobile: Styled Dropdown */}
        <div className="block md:hidden px-6 pt-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-slate-300 focus:outline-none focus:border-cyan-400"
          >
            <option value="chat">💬 AI Chat Assistant</option>
            <option value="voice">🎙️ Voice Companion</option>
            <option value="report">📊 AI Health Report</option>
            <option value="twin">👥 Financial Twin</option>
            <option value="learn">📚 Interactive Roadmap</option>
            <option value="whatif">🔮 What-If Simulator</option>
            <option value="tax">💸 Tax Optimizer</option>
          </select>
        </div>

        {/* Desktop: Wrapped Tab List */}
        <div className="hidden md:flex md:flex-wrap gap-1 px-6 pt-4 border-b border-white/5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 capitalize text-sm font-medium border-b-2 transition ${
                activeTab === t
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t === "whatif" ? "What-If" : t === "twin" ? "Financial Twin" : t}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
            {/* Left Sidebar: Sessions */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-slate-950/20 p-4 flex flex-col overflow-hidden shrink-0">
              <button
                onClick={createNewSession}
                className="btn-primary mb-4 w-full flex items-center justify-center gap-2"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                ➕ New Chat
              </button>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loadingSessions ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Loading history...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs italic">
                    No active chats.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => selectSession(session)}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition text-xs ${
                        activeSessionId === session._id
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold'
                          : 'bg-white/3 text-slate-300 border border-transparent hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">
                        💬 {session.title || 'New Chat'}
                      </span>
                      <button
                        onClick={(e) => deleteSession(session._id, e)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300 transition shrink-0 pl-1"
                        title="Delete chat history"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Left: Chat Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-sm shrink-0">
                        🤖
                      </div>
                    )}
                    <div className="flex flex-col gap-1 items-start">
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-cyan-500/20 border border-cyan-500/30 text-white"
                            : "bg-[var(--bg-secondary)] border border-white/5 text-slate-200"
                        }`}
                      >
                        {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                      </div>
                      {msg.role === "assistant" && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => speakText(msg.content, audioLang === "ta" ? "ta" : "en")}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition ${
                              activeSpeechText === msg.content && isSpeaking
                                ? "animate-pulse border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                                : ""
                            }`}
                          >
                            {activeSpeechText === msg.content && isSpeaking ? "⏹️ Stop" : "🔊 Listen"}
                          </button>
                          <button
                            onClick={() => toggleBookmark(msg.content)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
                              bookmarks.includes(msg.content)
                                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/5"
                            }`}
                          >
                            <span>{bookmarks.includes(msg.content) ? "Saved 🔖" : "Bookmark 🔖"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-sm">
                      🤖
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-white/5 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick questions */}
              <div className="px-6 py-3 border-t border-white/5">
                <div className="flex flex-wrap gap-2 pb-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="whitespace-nowrap text-xs px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-cyan-500/30 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={sendMessage} className="p-6 pt-0">
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <input
                      className="input-dark w-full pr-12"
                      placeholder="Ask me anything about finance, stocks, tax..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={startVoiceInput}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg transition ${
                        isListening
                          ? "text-red-400 animate-pulse"
                          : "text-slate-400 hover:text-cyan-400"
                      }`}
                      title="Speak message"
                    >
                      🎙️
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="btn-primary"
                    style={{ width: "auto", padding: "0 20px" }}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Bookmarked Coaching Insights Panel */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-slate-950/20 p-5 flex flex-col overflow-hidden shrink-0">
              <div className="mb-4">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>🔖 Saved Insights</span>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">
                    {bookmarks.length}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Your bookmarks from the coach</p>
              </div>

              {bookmarks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                  <div className="text-3xl mb-2">🔖</div>
                  <p>No bookmarked answers yet</p>
                  <p className="text-[10px] text-slate-600 mt-1">Click the bookmark icon under any reply to save it</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {bookmarks.map((bm, idx) => (
                    <div key={idx} className="p-3 bg-white/3 border border-white/5 rounded-2xl space-y-2 text-xs hover:border-white/10 transition">
                      <p className="text-slate-300 leading-relaxed line-clamp-4 italic">
                        "{bm}"
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bm);
                            toast.success('Copied to clipboard! 📋');
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                          Copy Text
                        </button>
                        <button
                          onClick={() => toggleBookmark(bm)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === "voice" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[var(--bg-primary)] to-[#12122b]">
            <div className="max-w-md w-full text-center space-y-8">
              {/* Animated Visualizer Circle */}
              <div className="relative mx-auto flex items-center justify-center w-48 h-48 rounded-full bg-white/5 border border-cyan-500/20 shadow-[0_0_50px_rgba(0,212,255,0.05)]">
                {/* Pulsing waves depending on state */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-700 ${
                    loading
                      ? "border-2 border-cyan-400 animate-spin border-t-transparent"
                      : messages[messages.length - 1]?.role === "assistant" &&
                          window.speechSynthesis?.speaking
                        ? "bg-cyan-500/10 scale-110 animate-ping opacity-25"
                        : "bg-cyan-500/5 scale-100 opacity-0"
                  }`}
                />

                <button
                  onClick={() => {
                    const SpeechRecognition =
                      window.SpeechRecognition ||
                      window.webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                      toast.error(
                        "Voice recognition is not supported in this browser.",
                      );
                      return;
                    }
                    const recognition = new SpeechRecognition();
                    recognition.lang = audioLang === "ta" ? "ta-IN" : "en-IN";
                    recognition.interimResults = false;
                    recognition.maxAlternatives = 1;
                    recognition.onstart = () => {
                      toast("Listening... Speak now! 🎙️", { icon: "🎙️" });
                    };
                    recognition.onerror = (event) => {
                      toast.error(`Voice recognition error: ${event.error}`);
                    };
                    recognition.onresult = async (event) => {
                      const spokenText = event.results[0][0].transcript;
                      if (!spokenText.trim()) return;
                      // Add to messages
                      const userMsg = { role: "user", content: spokenText };
                      setMessages((prev) => [...prev, userMsg]);
                      setLoading(true);
                      try {
                        const { data } = await api.post("/mentor/ask", {
                          question: spokenText,
                          lang: audioLang,
                        });
                        setMessages((prev) => [
                          ...prev,
                          { role: "assistant", content: data.answer },
                        ]);

                        // Speak out the reply
                        if ("speechSynthesis" in window) {
                          window.speechSynthesis.cancel(); // Stop current speech
                          speakText(data.answer, audioLang);
                        }
                      } catch {
                        toast.error("Failed to speak with mentor");
                      }
                      setLoading(false);
                    };
                    recognition.start();
                  }}
                  disabled={loading}
                  className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 hover:from-cyan-300 hover:to-blue-400 flex items-center justify-center text-white text-4xl shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] transition duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "🤖" : "🎙️"}
                </button>
              </div>

              {/* Speech Text / Dialogue */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-200">
                  {loading
                    ? "AI Mentor is processing..."
                    : "Tap Mic & Ask Anything"}
                </h2>

                {/* Last Dialogue Pair */}
                <div className="card max-w-sm mx-auto border-cyan-500/20 bg-cyan-500/5 min-h-[90px] flex flex-col justify-center px-4 py-3 rounded-2xl">
                  {messages.length > 1 ? (
                    <div>
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">
                        {messages[messages.length - 1].role === "user"
                          ? "You said:"
                          : "AI Mentor:"}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed italic">
                        "{messages[messages.length - 1].content}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      "Should I start SIP now or wait for market dip?"
                    </p>
                  )}
                </div>
              </div>

              {/* Stop Speaking / Settings */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      toast.success("Muted mentor audio");
                    }
                  }}
                  className="btn-secondary text-xs px-4 py-2"
                  style={{ width: "auto" }}
                >
                  📇 Mute Voice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Report Tab */}
        {activeTab === "report" && (
          <div className="flex-1 overflow-y-auto p-6">
            {loadingTab ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : weeklyReport ? (
              <div className="w-full space-y-6">
                <div className="card border-cyan-500/20 bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-5xl font-extrabold ${
                        weeklyReport.overallGrade === "A"
                          ? "text-green-400"
                          : weeklyReport.overallGrade === "B"
                            ? "text-cyan-400"
                            : weeklyReport.overallGrade === "C"
                              ? "text-yellow-400"
                              : "text-red-400"
                      }`}
                    >
                      {weeklyReport.overallGrade}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        Weekly Performance Report
                      </h2>
                      <p className="text-slate-400 text-xs mt-1">
                        {weeklyReport.greeting}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card border-green-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-green-400 mb-3 text-sm">
                      ✅ Highlights & Wins
                    </h3>
                    <ul className="space-y-2">
                      {weeklyReport.highlights?.map((h, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-xs text-slate-300"
                        >
                          <span className="text-green-400">•</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {weeklyReport.warnings?.length > 0 && (
                    <div className="card border-yellow-500/20 bg-[var(--bg-secondary)]">
                      <h3 className="font-bold text-yellow-400 mb-3 text-sm">
                        ⚠️ Attention Areas
                      </h3>
                      <ul className="space-y-2">
                        {weeklyReport.warnings?.map((w, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-xs text-slate-300"
                          >
                            <span className="text-yellow-400">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card border-cyan-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-cyan-400 mb-2 text-sm">
                      💡 Tactical Tip
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {weeklyReport.tip}
                    </p>
                  </div>
                  <div className="card border-purple-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-purple-400 mb-2 text-sm">
                      🎯 Strategic Goal
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {weeklyReport.nextWeekGoal}
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadWeeklyReport}
                  className="btn-secondary w-full py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Refresh Weekly Analysis
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Financial Twin Tab */}
        {activeTab === "twin" && (
          <div className="flex-1 overflow-y-auto p-6">
            {loadingTab ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : financialTwin ? (
              <div className="w-full space-y-6">
                <div className="card border-cyan-500/20 text-center py-8 bg-[var(--bg-secondary)]">
                  <div className="text-7xl mb-4 animate-bounce">
                    {financialTwin.archetypeEmoji}
                  </div>
                  <h2 className="text-2xl font-bold gradient-text">
                    {financialTwin.archetypeName}
                  </h2>
                  <p className="text-slate-400 text-xs mt-2 max-w-xl mx-auto leading-relaxed">
                    {financialTwin.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card border-green-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-green-400 mb-3 text-sm">
                      💪 Core Financial Strengths
                    </h3>
                    {financialTwin.strengths?.map((s, i) => (
                      <p
                        key={i}
                        className="text-xs text-slate-300 mb-2 flex items-center gap-2"
                      >
                        <span>✅</span> {s}
                      </p>
                    ))}
                  </div>
                  <div className="card border-yellow-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-yellow-400 mb-3 text-sm">
                      🎯 Vulnerability & Blind Spots
                    </h3>
                    {financialTwin.blindspots?.map((b, i) => (
                      <p
                        key={i}
                        className="text-xs text-slate-300 mb-2 flex items-center gap-2"
                      >
                        <span>⚠️</span> {b}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card border-purple-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-purple-400 mb-2 text-sm">
                      🔮 1-Year Financial Outlook
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {financialTwin.prediction}
                    </p>
                  </div>
                  <div className="card border-cyan-500/20 bg-[var(--bg-secondary)]">
                    <h3 className="font-bold text-cyan-400 mb-2 text-sm">
                      ⚡ Core Recommendation
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {financialTwin.recommendation}
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadFinancialTwin}
                  className="btn-secondary w-full py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Re-Analyze Financial Profile
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Learn Tab */}
        {activeTab === "learn" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full space-y-6">
              <div className="card border-cyan-500/20 bg-[var(--bg-secondary)] mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-xs">
                      Curricular Progress
                    </p>
                    <p className="font-bold text-slate-200 text-sm mt-0.5">
                      {lessons.filter((l) => l.completed).length} /{" "}
                      {lessons.length} Lessons Completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Reward Balance</p>
                    <p className="font-bold text-yellow-400 text-sm mt-0.5">
                      🪙{" "}
                      {lessons
                        .filter((l) => l.completed)
                        .reduce((s, l) => s + l.coins, 0)}{" "}
                      Coins
                    </p>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                  <div
                    className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${lessons.length > 0 ? (lessons.filter((l) => l.completed).length / lessons.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleStartLesson(lesson)}
                    className={`card flex items-center justify-between cursor-pointer transition bg-[var(--bg-secondary)] ${
                      lesson.completed
                        ? "border-green-500/20 opacity-70"
                        : "hover:border-cyan-500/20 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{lesson.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {lesson.duration} • {lesson.category} •{" "}
                          {lesson.difficulty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-yellow-400 font-bold">
                        🪙 +{lesson.coins}
                      </span>
                      {lesson.completed ? (
                        <span className="text-green-400 text-lg">✅</span>
                      ) : (
                        <button
                          className="btn-primary text-xs"
                          style={{ padding: "6px 14px", width: "auto" }}
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* What-If Tab */}
        {activeTab === "whatif" &&
          (() => {
            const {
              data,
              rate,
              finalInvested,
              finalWealth,
              finalBaseline,
              gains,
              wealthGap,
            } = getProjectionData();
            return (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full space-y-5">
                  {/* Tab Header */}
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-200">
                        🔮 What-If Investment Simulator
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Model compound wealth growth trajectories and unlock
                        strategic AI portfolio advice
                      </p>
                    </div>
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-bold">
                      Interactive Mode active ⚡
                    </span>
                  </div>

                  {/* Horizontal Quick Scenarios Chips */}
                  <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-white/5">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider shrink-0">
                      Quick Scenarios:
                    </span>
                    {[
                      {
                        label: "🚀 Nifty Index SIP (₹2k @ 15%)",
                        scenario: "invest in Nifty 50 index fund via SIP",
                        amount: "2000",
                        duration: "24",
                      },
                      {
                        label: "🏦 Safe Bank FD (₹10k @ 7%)",
                        scenario: "save in FD at 7% interest rate",
                        amount: "10000",
                        duration: "12",
                      },
                      {
                        label: "📈 Growth Midcap (₹3k @ 15%)",
                        scenario: "invest in mid-cap mutual fund",
                        amount: "3000",
                        duration: "36",
                      },
                      {
                        label: "🟡 Digital Gold (₹5k @ 9%)",
                        scenario: "buy gold via digital gold",
                        amount: "5000",
                        duration: "18",
                      },
                    ].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setWhatIfForm(s)}
                        className="whitespace-nowrap px-3.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 text-xs rounded-full text-slate-300 transition-all font-semibold"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
                    {/* Left Column: Form and Sliders */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="card bg-[var(--bg-secondary)] border-white/5 p-6 rounded-2xl space-y-5 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-200 text-sm">
                            Simulator Settings
                          </h3>
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md font-semibold">
                            ~{rate}% p.a. Est.
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                              Proposed Scenario
                            </label>
                            <input
                              className="input-dark w-full text-sm"
                              placeholder="e.g. invest in Nifty 50 Index SIP"
                              value={whatIfForm.scenario}
                              onChange={(e) =>
                                setWhatIfForm({
                                  ...whatIfForm,
                                  scenario: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Interactive Sliders */}
                          <div className="space-y-4 pt-2">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-400 font-medium">
                                  Monthly Amount
                                </label>
                                <span className="text-xs font-bold text-cyan-400">
                                  ₹
                                  {parseFloat(
                                    whatIfForm.amount || 0,
                                  ).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="500"
                                max="100000"
                                step="500"
                                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                                value={whatIfForm.amount || 1000}
                                onChange={(e) =>
                                  setWhatIfForm({
                                    ...whatIfForm,
                                    amount: e.target.value,
                                  })
                                }
                              />
                              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                                <span>₹500</span>
                                <span>₹1,00,000</span>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-slate-400 font-medium">
                                  Simulation Tenure
                                </label>
                                <span className="text-xs font-bold text-purple-400">
                                  {whatIfForm.duration || 12} Months
                                </span>
                              </div>
                              <input
                                type="range"
                                min="3"
                                max="120"
                                step="1"
                                className="w-full accent-purple-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                                value={whatIfForm.duration || 12}
                                onChange={(e) =>
                                  setWhatIfForm({
                                    ...whatIfForm,
                                    duration: e.target.value,
                                  })
                                }
                              />
                              <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                                <span>3 months</span>
                                <span>10 years (120m)</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={runWhatIf}
                            className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all"
                            disabled={loadingTab}
                          >
                            {loadingTab ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing Strategy...
                              </span>
                            ) : (
                              "Simulate Future Returns ↑"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Dynamic Compound Dashboard & Recharts AreaChart */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Glowing Metric Highlight Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="card bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-white/20 transition">
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <span>🏦</span> Safe FD Value (7%)
                          </p>
                          <h4 className="text-lg sm:text-2xl font-bold mt-1 text-slate-300">
                            ₹{finalBaseline.toLocaleString("en-IN")}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Standard bank compounding baseline
                          </p>
                        </div>

                        <div className="card bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 p-4 rounded-2xl hover:border-cyan-500/30 transition shadow-lg">
                          <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                            <span>✨</span> Strategy Value
                          </p>
                          <h4 className="text-lg sm:text-2xl font-extrabold mt-1 text-white">
                            ₹{finalWealth.toLocaleString("en-IN")}
                          </h4>
                          <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full inline-block mt-1.5 font-bold">
                            {rate}% yield growth
                          </span>
                        </div>

                        <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-4 rounded-2xl hover:border-green-500/30 transition">
                          <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                            <span>📈</span> Net Yield Gap
                          </p>
                          <h4 className="text-lg sm:text-2xl font-bold mt-1 text-green-400">
                            +₹{wealthGap.toLocaleString("en-IN")}
                          </h4>
                          <span className="text-[9px] text-green-400 font-bold block mt-1">
                            Extra profit generated over FD
                          </span>
                        </div>
                      </div>

                      {/* Glowing Line/Area Chart */}
                      <div className="card bg-[var(--bg-secondary)] border-white/5 p-6 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="font-bold text-slate-200 text-sm">
                              Compounding Curve Trajectory
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Visualizing monthly deposits compounding over time
                            </p>
                          </div>
                          <div className="flex gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80" />
                              <span className="text-slate-400">
                                Safe FD Baseline
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span className="text-cyan-400">
                                Proposed Strategy
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="h-64 w-full">
                          {finalWealth > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={data}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  left: -20,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="colorWealth"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#22D3EE"
                                      stopOpacity={0.25}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#22D3EE"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="colorInvested"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#6366F1"
                                      stopOpacity={0.15}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#6366F1"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(255,255,255,0.03)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="month"
                                  stroke="#64748B"
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis
                                  stroke="#64748B"
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(val) =>
                                    `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`
                                  }
                                />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const wealthVal =
                                        payload.find(
                                          (p) => p.dataKey === "Wealth",
                                        )?.value || 0;
                                      const investVal =
                                        payload.find(
                                          (p) => p.dataKey === "Invested",
                                        )?.value || 0;
                                      const baselineVal =
                                        payload.find(
                                          (p) => p.dataKey === "Baseline",
                                        )?.value || 0;
                                      const gapVal = Math.max(
                                        0,
                                        wealthVal - baselineVal,
                                      );
                                      return (
                                        <div className="bg-[#0F172A]/95 border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
                                          <p className="text-[10px] font-extrabold text-cyan-400 mb-2 tracking-wider uppercase">
                                            {label}
                                          </p>
                                          <div className="space-y-1.5 text-[11px]">
                                            <div className="flex justify-between gap-6">
                                              <span className="text-slate-400">
                                                Total Invested:
                                              </span>
                                              <span className="font-bold text-slate-100">
                                                ₹
                                                {investVal.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                              <span className="text-indigo-400">
                                                Safe FD (7%):
                                              </span>
                                              <span className="font-bold text-indigo-300">
                                                ₹
                                                {baselineVal.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex justify-between gap-6 border-b border-white/5 pb-1.5 mb-1.5">
                                              <span className="text-cyan-400 font-semibold">
                                                Strategy Value:
                                              </span>
                                              <span className="font-extrabold text-cyan-300">
                                                ₹
                                                {wealthVal.toLocaleString(
                                                  "en-IN",
                                                )}
                                              </span>
                                            </div>
                                            {gapVal > 0 && (
                                              <div className="flex justify-between gap-6">
                                                <span className="text-green-400 font-medium">
                                                  Opportunity Yield Gain:
                                                </span>
                                                <span className="font-extrabold text-green-400">
                                                  +₹
                                                  {gapVal.toLocaleString(
                                                    "en-IN",
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                 cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                <Area
                                  type="monotone"
                                  dataKey="Wealth"
                                  name="Strategy Yield"
                                  stroke="#22D3EE"
                                  strokeWidth={2.5}
                                  fillOpacity={1}
                                  fill="url(#colorWealth)"
                                />
                                <Area
                                  type="monotone"
                                  dataKey="Baseline"
                                  name="Safe FD Baseline"
                                  stroke="#818CF8"
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4"
                                  fillOpacity={1}
                                  fill="url(#colorInvested)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">
                              Move sliders above or type amount to visualize
                              compounding
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Mentorship strategy analysis */}
                      {whatIfResult ? (
                        (() => {
                          const isJson =
                            typeof whatIfResult === "object" &&
                            whatIfResult !== null;
                          const inflation = isJson
                            ? whatIfResult.inflationRealValue
                            : "";
                          const tax = isJson ? whatIfResult.taxAnalysis : "";
                          const risk = isJson ? whatIfResult.riskMetrics : "";
                          const alt = isJson
                            ? whatIfResult.strategicAlternative
                            : "";
                          const text = !isJson ? whatIfResult : "";

                          return (
                            <div className="card bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 border border-cyan-500/20 p-6 rounded-2xl space-y-5 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg shadow-md shadow-cyan-500/10 shrink-0">
                                    🤖
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-100 text-sm">
                                      AI Financial Strategist
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Union Budget FY 2025-26 active policy
                                      audit
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                                  Premium Advisory active 📊
                                </span>
                              </div>

                              {isJson ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  <div className="p-4 bg-black/25 border border-white/5 rounded-xl hover:border-purple-500/30 transition duration-300">
                                    <h5 className="text-xs font-bold text-purple-400 flex items-center gap-1.5 mb-1.5">
                                      <span>💸</span> Real Purchasing Power
                                    </h5>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                      {inflation}
                                    </p>
                                  </div>

                                  <div className="p-4 bg-black/25 border border-white/5 rounded-xl hover:border-cyan-500/30 transition duration-300">
                                    <h5 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                                      <span>🏛️</span> Tax Shield & Slabs
                                    </h5>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                      {tax}
                                    </p>
                                  </div>

                                  <div className="p-4 bg-black/25 border border-white/5 rounded-xl hover:border-red-500/30 transition duration-300">
                                    <h5 className="text-xs font-bold text-red-400 flex items-center gap-1.5 mb-1.5">
                                      <span>⚠️</span> Volatility & Drawdown
                                    </h5>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                      {risk}
                                    </p>
                                  </div>

                                  <div className="p-4 bg-black/25 border border-white/5 rounded-xl hover:border-emerald-500/30 transition duration-300">
                                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                                      <span>🚀</span> Portfolio Alternative
                                    </h5>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                      {alt}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {text}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="card bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-5 rounded-2xl space-y-3 flex items-start gap-4">
                          <div className="text-3xl shrink-0">🔮</div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-purple-300 text-sm">
                              Ready to enhance this projection with generative
                              AI strategy?
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              We have computed the baseline reactive compound
                              curves for your scenario. Click the{" "}
                              <span className="text-cyan-400 font-bold">
                                Simulate Future Returns ↑
                              </span>{" "}
                              button to run our deep AI model to analyze
                              systemic market risks, taxation consequences (LTCG
                              vs STCG rules), and asset suitability details.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Tax Tab */}
        {activeTab === "tax" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="w-full space-y-6">
              {/* Header block with Dynamic FY */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-slate-200">
                    📋 Interactive Tax Estimator
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Comparing Old & New Tax Regimes side-by-side with dynamic AI
                    discovery rules
                  </p>
                </div>
                <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-bold">
                  {taxResult?.financialYear
                    ? `FY ${taxResult.financialYear}`
                    : "FY 2025-26"}{" "}
                  Engine active 🔮
                </span>
              </div>

              {/* Dynamic Metrics Grid - Appears only when calculated */}
              {taxResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-cyan-500/30 transition">
                    <p className="text-xs text-slate-400 font-medium">
                      Effective Tax Rate
                    </p>
                    <h4 className="text-2xl font-bold mt-1 text-cyan-400">
                      {taxResult.result?.effectiveRate || "0.00"}%
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-2 font-medium ${
                        parseFloat(taxResult.result?.effectiveRate) === 0
                          ? "bg-green-500/20 text-green-400"
                          : parseFloat(taxResult.result?.effectiveRate) <= 10
                            ? "bg-blue-500/20 text-blue-400"
                            : parseFloat(taxResult.result?.effectiveRate) <= 20
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {parseFloat(taxResult.result?.effectiveRate) === 0
                        ? "Tax-Free 🟢"
                        : parseFloat(taxResult.result?.effectiveRate) <= 10
                          ? "Low Rate 🟡"
                          : parseFloat(taxResult.result?.effectiveRate) <= 20
                            ? "Moderate 🟠"
                            : "High Tax 🔴"}
                    </span>
                  </div>

                  <div className="card bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-red-500/30 transition">
                    <p className="text-xs text-slate-400 font-medium">
                      Total Tax Payable
                    </p>
                    <h4 className="text-2xl font-bold mt-1 text-red-400">
                      ₹
                      {(taxResult.result?.totalTax || 0).toLocaleString(
                        "en-IN",
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Includes 4% Health & Ed Cess
                    </p>
                  </div>

                  <div className="card bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-green-500/30 transition">
                    <p className="text-xs text-slate-400 font-medium">
                      Net Take-Home Pay
                    </p>
                    <h4 className="text-2xl font-bold mt-1 text-green-400">
                      ₹
                      {Math.max(
                        0,
                        (parseInt(taxForm.income) || 0) -
                          (taxResult.result?.totalTax || 0),
                      ).toLocaleString("en-IN")}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-2">
                      ₹
                      {Math.round(
                        Math.max(
                          0,
                          (parseInt(taxForm.income) || 0) -
                            (taxResult.result?.totalTax || 0),
                        ) / 12,
                      ).toLocaleString("en-IN")}
                      /month
                    </p>
                  </div>

                  <div className="card bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-white/20 transition">
                    <p className="text-xs text-slate-400 font-medium">
                      Taxable Income
                    </p>
                    <h4 className="text-2xl font-bold mt-1 text-slate-200">
                      ₹
                      {(taxResult.result?.taxableIncome || 0).toLocaleString(
                        "en-IN",
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Deductions: ₹
                      {(
                        (parseInt(taxForm.income) || 0) -
                        (taxResult.result?.taxableIncome || 0)
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-start">
                {/* Left Column: Form & Progressive slabs (Grid col span 5) */}
                <div className="md:col-span-5 space-y-6">
                  {/* Estimator Input Form */}
                  <div className="card bg-[var(--bg-secondary)] border-white/5 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <span>📋</span> Tax Calculator Inputs
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">
                          Annual Gross Income (₹)
                        </label>
                        <input
                          type="number"
                          className="input-dark w-full"
                          placeholder="e.g. 1200000"
                          value={taxForm.income}
                          onChange={(e) =>
                            setTaxForm({ ...taxForm, income: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 mb-2 block">
                          Active Regime Selection
                        </label>
                        <div className="flex gap-2">
                          {["new", "old"].map((r) => (
                            <button
                              key={r}
                              onClick={() =>
                                setTaxForm({ ...taxForm, regime: r })
                              }
                              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition ${taxForm.regime === r ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : "bg-white/5 border border-transparent text-slate-400 hover:bg-white/10"}`}
                            >
                              {r} Regime
                            </button>
                          ))}
                        </div>
                      </div>

                      {taxForm.regime === "old" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                          <div>
                            <label className="text-[11px] text-slate-400 mb-1 block">
                              80C Deductions (₹)
                            </label>
                            <input
                              type="number"
                              className="input-dark w-full text-sm"
                              placeholder="Max 1.5 Lakhs"
                              value={taxForm.section80C}
                              onChange={(e) =>
                                setTaxForm({
                                  ...taxForm,
                                  section80C: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 mb-1 block">
                              80D Health Premiums (₹)
                            </label>
                            <input
                              type="number"
                              className="input-dark w-full text-sm"
                              placeholder="Max 25k/50k"
                              value={taxForm.section80D}
                              onChange={(e) =>
                                setTaxForm({
                                  ...taxForm,
                                  section80D: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={calcTax}
                        className="btn-primary w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition"
                        disabled={loadingTab}
                      >
                        {loadingTab ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          "Calculate Tax Liability →"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Slabs visualizer card (Shown only after calculation to keep UI clean) */}
                  {taxResult && (
                    <div className="card border-white/5 p-6 rounded-2xl bg-[var(--bg-secondary)] space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-200 text-sm">
                          📊 Progressive Tax Slabs
                        </h3>
                        <span className="text-[10px] text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                          {taxForm.regime === "new"
                            ? "New Regime"
                            : "Old Regime"}{" "}
                          Slabs
                        </span>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {(
                          (taxForm.regime === "new"
                            ? taxResult.slabs
                            : taxResult.oldSlabs) || []
                        ).map((slab, idx) => {
                          const incomeVal = parseInt(taxForm.income) || 0;
                          const stdDeduction =
                            taxForm.regime === "new" ? 75000 : 50000;
                          const taxableIncome = Math.max(
                            0,
                            incomeVal - stdDeduction,
                          );
                          const slabMin = parseFloat(slab.min) || 0;
                          const isActive = taxableIncome > slabMin;

                          const maxRebateThreshold =
                            taxForm.regime === "new" ? 1200000 : 500000;
                          const isRebateApplied =
                            slab.hasRebate &&
                            taxableIncome <= maxRebateThreshold;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl transition flex justify-between items-center ${
                                isActive
                                  ? "bg-cyan-500/10 border border-cyan-500/20 text-slate-200"
                                  : "bg-white/5 border border-transparent text-slate-500"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`}
                                />
                                <span className="text-xs font-medium">
                                  {slab.range}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isRebateApplied && (
                                  <span className="text-[9px] bg-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    Section 87A Rebate 💰
                                  </span>
                                )}
                                <span
                                  className={`text-xs font-bold ${isActive ? "text-cyan-400" : ""}`}
                                >
                                  {slab.rate}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Comparative Chart, Side-by-side Analysis & Advisor (Grid col span 7) */}
                <div className="md:col-span-7 space-y-6">
                  {!taxResult ? (
                    /* Elegant placeholder explanation */
                    <div className="card bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 p-6 rounded-2xl space-y-4">
                      <h3 className="font-bold text-cyan-300 flex items-center gap-2">
                        <span>💡</span> Indian Union Budget AI Tax Discovery
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        FinBuddy's AI Tax Discovery Engine dynamically monitors
                        and extracts the latest Indian Income Tax regulations.
                        Unlike static tools, this calculator updates
                        automatically to newly enacted tax slabs, rebate models,
                        and announcements in real-time.
                      </p>

                      <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-200">
                              Dynamic Section 87A Rebate
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Automatically calculates tax-free thresholds (e.g.
                              ₹12 Lakhs income under new regime) and handles
                              rebate clawbacks.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-200">
                              Regime Comparison Model
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Compare Old vs New Tax Regimes side-by-side with
                              complete visual bar-charts based on your
                              deductions (Section 80C, 80D).
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-200">
                              AI Tax Savings Advice
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Receives customized optimization guidelines on
                              ELSS, health insurance premiums, and secure RBI
                              gold/retail bonds.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Interactive Visuals & Savings Reports */
                    <>
                      {/* Premium 4-Metric Regime Comparison Chart */}
                      <div className="card border-white/5 p-6 rounded-2xl bg-[var(--bg-secondary)] space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-200 text-sm">
                            📊 Regime Breakdown Analysis
                          </h3>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                              <span className="text-slate-400">Old Regime</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              <span className="text-slate-400">New Regime</span>
                            </span>
                          </div>
                        </div>

                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(() => {
                                const inc = parseInt(taxForm.income) || 0;
                                const oldTax =
                                  taxResult.comparison?.oldRegime?.totalTax ||
                                  0;
                                const newTax =
                                  taxResult.comparison?.newRegime?.totalTax ||
                                  0;
                                const oldBasic =
                                  taxResult.comparison?.oldRegime?.basicTax ||
                                  0;
                                const newBasic =
                                  taxResult.comparison?.newRegime?.basicTax ||
                                  0;
                                const oldCess =
                                  taxResult.comparison?.oldRegime?.cess || 0;
                                const newCess =
                                  taxResult.comparison?.newRegime?.cess || 0;
                                const oldTaxable =
                                  taxResult.comparison?.oldRegime
                                    ?.taxableIncome || 0;
                                const newTaxable =
                                  taxResult.comparison?.newRegime
                                    ?.taxableIncome || 0;
                                return [
                                  {
                                    name: "Basic Tax",
                                    "Old Regime": oldBasic,
                                    "New Regime": newBasic,
                                  },
                                  {
                                    name: "Cess (4%)",
                                    "Old Regime": oldCess,
                                    "New Regime": newCess,
                                  },
                                  {
                                    name: "Total Tax",
                                    "Old Regime": oldTax,
                                    "New Regime": newTax,
                                  },
                                  {
                                    name: "Take-Home",
                                    "Old Regime": Math.max(0, inc - oldTax),
                                    "New Regime": Math.max(0, inc - newTax),
                                  },
                                  {
                                    name: "Deductions",
                                    "Old Regime": Math.max(0, inc - oldTaxable),
                                    "New Regime": Math.max(0, inc - newTaxable),
                                  },
                                ];
                              })()}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 5,
                                bottom: 5,
                              }}
                              barGap={4}
                              barCategoryGap="30%"
                            >
                              <defs>
                                <linearGradient
                                  id="gradOld"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#22D3EE"
                                    stopOpacity={0.95}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#0891B2"
                                    stopOpacity={0.5}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="gradNew"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#34D399"
                                    stopOpacity={0.95}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#059669"
                                    stopOpacity={0.5}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(255,255,255,0.04)"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="name"
                                stroke="#64748B"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#94A3B8" }}
                              />
                              <YAxis
                                stroke="#64748B"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#94A3B8" }}
                                tickFormatter={(v) => {
                                  if (v >= 100000)
                                    return `₹${(v / 100000).toFixed(1)}L`;
                                  if (v >= 1000)
                                    return `₹${(v / 1000).toFixed(0)}k`;
                                  return `₹${v}`;
                                }}
                                domain={[0, "dataMax + 80000"]}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                              />
                              <Bar
                                dataKey="Old Regime"
                                fill="url(#gradOld)"
                                radius={[5, 5, 0, 0]}
                                maxBarSize={32}
                              />
                              <Bar
                                dataKey="New Regime"
                                fill="url(#gradNew)"
                                radius={[5, 5, 0, 0]}
                                maxBarSize={32}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Mini stat row below chart */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
                          {[
                            {
                              label: "Old Tax",
                              val:
                                taxResult.comparison?.oldRegime?.totalTax || 0,
                              color: "text-cyan-400",
                            },
                            {
                              label: "New Tax",
                              val:
                                taxResult.comparison?.newRegime?.totalTax || 0,
                              color: "text-emerald-400",
                            },
                            {
                              label: "You Save",
                              val: taxResult.comparison?.savings || 0,
                              color: "text-yellow-400",
                            },
                          ].map((s, i) => (
                            <div key={i} className="text-center">
                              <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                                {s.label}
                              </p>
                              <p
                                className={`text-sm font-bold ${s.color} mt-0.5`}
                              >
                                ₹{s.val.toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Side-by-side Regime Comparison Desk */}
                      {taxResult.comparison && (
                        <div
                          className={`card ${taxResult.comparison.betterRegime === "new" ? "border-emerald-500/20" : "border-cyan-500/20"} p-6 rounded-2xl bg-[var(--bg-secondary)] space-y-4`}
                        >
                          <h3 className="font-bold text-slate-200 text-sm">
                            🔄 Comparative Analysis Summary
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                              className={`p-4 rounded-xl border transition ${
                                taxResult.comparison.betterRegime === "old"
                                  ? "bg-cyan-500/10 border-cyan-500/30"
                                  : "bg-white/5 border-white/5"
                              }`}
                            >
                              <p className="text-xs text-slate-400 font-medium">
                                Old Regime Model
                              </p>
                              <h4 className="text-xl font-bold mt-1 text-slate-200">
                                ₹
                                {taxResult.comparison.oldRegime?.totalTax?.toLocaleString(
                                  "en-IN",
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Deductions Applied
                              </p>
                              {taxResult.comparison.betterRegime === "old" && (
                                <span className="text-[10px] text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full inline-block mt-2 font-bold animate-pulse">
                                  ✅ Optimal Choice
                                </span>
                              )}
                            </div>

                            <div
                              className={`p-4 rounded-xl border transition ${
                                taxResult.comparison.betterRegime === "new"
                                  ? "bg-green-500/10 border-green-500/30"
                                  : "bg-white/5 border-white/5"
                              }`}
                            >
                              <p className="text-xs text-slate-400 font-medium">
                                New Regime Model
                              </p>
                              <h4 className="text-xl font-bold mt-1 text-slate-200">
                                ₹
                                {taxResult.comparison.newRegime?.totalTax?.toLocaleString(
                                  "en-IN",
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1">
                                High Standard Deduction
                              </p>
                              {taxResult.comparison.betterRegime === "new" && (
                                <span className="text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full inline-block mt-2 font-bold animate-pulse">
                                  ✅ Optimal Choice
                                </span>
                              )}
                            </div>
                          </div>

                          {taxResult.comparison.savings > 0 ? (
                            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                              <p className="text-xs text-green-400 leading-relaxed">
                                <span className="font-extrabold mr-1">
                                  💰 Savings Advantage:
                                </span>
                                <span>
                                  You save{" "}
                                  <span className="font-extrabold text-sm mx-0.5">
                                    ₹
                                    {taxResult.comparison.savings?.toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>{" "}
                                  by staying with the{" "}
                                  <span className="font-extrabold capitalize">
                                    {taxResult.comparison.betterRegime === "new"
                                      ? "New"
                                      : "Old"}{" "}
                                    Tax Regime
                                  </span>
                                  !
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-2 text-center">
                              Both regimes result in the exact same tax
                              liability for this income bracket.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* AI Investment Roadmap — Full Width */}
              {taxResult && (
                <div className="card bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/20 p-6 rounded-2xl space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-indigo-300 flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <span>AI Investment Roadmap to Reduce Tax</span>
                    </h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                      Personalised
                    </span>
                  </div>

                  {(() => {
                    const inc = parseInt(taxForm.income) || 0;
                    const isOld = taxForm.regime === "old";
                    const fmt = (n) => Math.round(n).toLocaleString("en-IN");

                    // Real marginal rate from actual FY2025-26 slabs (mirrors taxEngine.js)
                    const stdDed = isOld ? 50000 : 75000;
                    const taxable = Math.max(0, inc - stdDed);
                    const isTaxFree = isOld
                      ? taxable <= 250000 || inc <= 500000
                      : taxable <= 1200000;

                    const getMarginalRate = (ti) => {
                      if (isOld) {
                        if (ti <= 250000) return 0;
                        if (ti <= 500000) return 0.05;
                        if (ti <= 1000000) return 0.2;
                        return 0.3;
                      } else {
                        if (ti <= 400000) return 0;
                        if (ti <= 800000) return 0.05;
                        if (ti <= 1200000) return 0.1;
                        if (ti <= 1600000) return 0.15;
                        if (ti <= 2000000) return 0.2;
                        if (ti <= 2400000) return 0.25;
                        return 0.3;
                      }
                    };

                    const rate = isTaxFree ? 0 : getMarginalRate(taxable);
                    // Tier: low = effectively zero tax, mid = moderate, high = top slab
                    const tier = isTaxFree
                      ? "low"
                      : inc <= 2000000
                        ? "mid"
                        : "high";

                    const BANNERS = {
                      low: {
                        icon: "🌱",
                        label: "Wealth Foundation Strategy",
                        color: "text-emerald-400",
                        desc: "Your income is under the tax-free rebate threshold (₹0 tax). Build a financial base first — no need to lock money in 80C instruments yet.",
                      },
                      mid: {
                        icon: "⚖️",
                        label: "Tax-Optimised Growth Strategy",
                        color: "text-cyan-400",
                        desc: "You are in a moderate tax bracket. A smart mix of 80C, 80D and NPS deductions can significantly cut your liability while growing wealth.",
                      },
                      high: {
                        icon: "🔥",
                        label: "HNW Tax-Shield Strategy",
                        color: "text-amber-400",
                        desc: "At the 20–30% slab, every rupee in the right instrument saves significantly. Maximise all shields before surplus wealth compounds.",
                      },
                    };
                    const b = BANNERS[tier];

                    const LOW_CARDS = [
                      {
                        icon: "🛡️",
                        title: "Emergency Fund (Liquid FD / Savings)",
                        sub: "Foundation before investing",
                        riskCls: "bg-green-500/20 text-green-400",
                        risk: "No Risk",
                        invest: "₹" + fmt(Math.max(10000, inc * 0.1)) + "/year",
                        saved: "₹0 — but protects all other investments",
                        ret: "6–7% p.a.",
                        know: "Build 6 months of living expenses in a liquid account. Prevents breaking other investments during emergencies.",
                        riskInfo:
                          "Zero capital risk. Bank FDs insured up to ₹5L by DICGC. Liquid Mutual Funds carry negligible market risk.",
                        where:
                          "IDFC First / IndusInd (6–7% savings rate), or Liquid Funds via Groww / Paytm Money",
                      },
                      {
                        icon: "🏥",
                        title: "Health + Term Insurance",
                        sub: "Section 80D deduction available",
                        riskCls: "bg-green-500/20 text-green-400",
                        risk: "No Risk",
                        invest: "₹12,000–₹25,000/year",
                        saved: "Benefit applies when income rises",
                        ret: "Risk protection",
                        know: "A ₹1Cr term cover costs only ₹8k–12k/year. Health insurance protects savings from medical bills. Both deductible under Section 80D.",
                        riskInfo:
                          "Pure protection — no maturity value. Choose IRDAI-registered insurers with high claim settlement ratios.",
                        where:
                          "HDFC Ergo, Star Health, Max Life — compare on PolicyBazaar or Coverfox",
                      },
                      {
                        icon: "🚀",
                        title: "Nifty 50 Index SIP (No Lock-In)",
                        sub: "Long-term wealth compounding",
                        riskCls: "bg-yellow-500/20 text-yellow-400",
                        risk: "Medium Risk",
                        invest:
                          "₹" +
                          fmt(Math.max(1000, (inc * 0.1) / 12)) +
                          "/month SIP",
                        saved: "LTCG above ₹1.25L taxed at only 12.5%",
                        ret: "12–15% CAGR",
                        know: "Since your tax is ₹0, avoid locking money in 80C. Index Funds are fully liquid, no lock-in, and return 12–15% historically over 10+ years.",
                        riskInfo:
                          "Market-linked. NAV falls during bear markets. Not suitable for goals < 5 years. SIP reduces timing risk.",
                        where:
                          "UTI Nifty 50 Index Fund, Parag Parikh Flexi Cap — via Groww, Zerodha Coin, Kuvera",
                      },
                      {
                        icon: "🥇",
                        title: "Sovereign Gold Bonds (SGB)",
                        sub: "100% tax-free maturity gains",
                        riskCls: "bg-blue-500/20 text-blue-400",
                        risk: "Low Risk",
                        invest: "₹" + fmt(Math.max(5000, inc * 0.05)) + "/year",
                        saved: "Maturity capital gains: 100% tax-free",
                        ret: "2.5% interest + gold gains",
                        know: "Government bonds backed by gold. Earn 2.5% annual interest + gold price appreciation. All maturity gains (8 years) are completely exempt from tax.",
                        riskInfo:
                          "Gold prices volatile short-term. 8-year lock-in (exchange exit after 5 years). The 2.5% interest is taxable annually.",
                        where:
                          "RBI Retail Direct (rbiretaildirect.org.in), Zerodha Coin, Groww",
                      },
                    ];

                    const MID_CARDS = isOld
                      ? [
                          {
                            icon: "📈",
                            title: "ELSS Mutual Funds (Section 80C)",
                            sub: "Highest-return 80C instrument",
                            riskCls: "bg-yellow-500/20 text-yellow-400",
                            risk: "Medium Risk",
                            invest:
                              "₹" + fmt(Math.min(150000, inc * 0.12)) + "/year",
                            saved:
                              "₹" +
                              fmt(Math.min(150000, inc * 0.12) * rate) +
                              " saved",
                            ret: "12–15% CAGR",
                            know: "ELSS gives 80C deduction AND market-linked returns. Shortest lock-in (3 years) among all 80C options. Best to fill the ₹1.5L 80C bucket.",
                            riskInfo:
                              "Equity-linked — NAV can fall in bear markets. 3-year lock-in is strictly enforced. Returns not guaranteed.",
                            where:
                              "Mirae Asset Tax Saver, Quant Tax Plan, Axis ELSS — via Groww, Zerodha",
                          },
                          {
                            icon: "🏦",
                            title: "Public Provident Fund (PPF)",
                            sub: "Section 80C — Zero Risk",
                            riskCls: "bg-green-500/20 text-green-400",
                            risk: "No Risk",
                            invest:
                              "₹" + fmt(Math.min(150000, inc * 0.1)) + "/year",
                            saved:
                              "₹" +
                              fmt(Math.min(150000, inc * 0.1) * rate) +
                              " saved",
                            ret: "7.1% tax-free",
                            know: "Safest 80C option. Government-guaranteed returns, tax-free interest (EEE status). Ideal for the debt portion of your portfolio.",
                            riskInfo:
                              "No market risk. But 15-year lock-in (partial withdrawal after 7 years). Rate revised quarterly by government.",
                            where: "SBI, PNB, or any Post Office PPF account",
                          },
                          {
                            icon: "🏛️",
                            title: "NPS — 80CCD(1B) Extra ₹50k",
                            sub: "Retirement-linked tax shield",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low–Med Risk",
                            invest: "₹50,000/year (separate from 80C)",
                            saved: "₹" + fmt(50000 * rate) + " saved",
                            ret: "10–12% avg (equity NPS)",
                            know: "NPS gives extra ₹50k deduction OVER the 80C limit — a separate savings bucket. At 20% slab this saves ₹10,400 extra.",
                            riskInfo:
                              "Locked until retirement (age 60). 40% of corpus must buy annuity (taxable). 60% lump sum withdrawal is tax-free.",
                            where:
                              "eNPS Portal (enps.nsdl.com), HDFC Pension Fund, SBI Pension Funds",
                          },
                          {
                            icon: "🛡️",
                            title: "Health Insurance (Section 80D)",
                            sub: "Self ₹25k + Senior Parents ₹50k",
                            riskCls: "bg-green-500/20 text-green-400",
                            risk: "No Risk",
                            invest: "₹25,000–₹75,000/year",
                            saved:
                              "₹" +
                              fmt(25000 * rate) +
                              "–₹" +
                              fmt(75000 * rate) +
                              " saved",
                            ret: "Medical cost protection",
                            know: "Health premiums deductible separately from 80C — ₹25k for self/family and ₹50k for senior citizen parents. Independent tax benefit.",
                            riskInfo:
                              "Pure insurance, no returns. Claim settlement ratio is critical. Premiums increase with age. Choose cashless hospital networks.",
                            where:
                              "Star Health, Niva Bupa, HDFC ERGO — compare on PolicyBazaar",
                          },
                        ]
                      : [
                          {
                            icon: "🛡️",
                            title: "Emergency Fund (Liquid FD / Savings)",
                            sub: "Foundation before investing",
                            riskCls: "bg-green-500/20 text-green-400",
                            risk: "No Risk",
                            invest:
                              "₹" + fmt(Math.max(15000, inc * 0.08)) + "/year",
                            saved: "₹0 — but protects all other investments",
                            ret: "6–7% p.a.",
                            know: "Build 6 months of living expenses in a liquid account. Prevents breaking other investments during emergencies.",
                            riskInfo:
                              "Zero capital risk. Bank FDs insured up to ₹5L by DICGC. Liquid Mutual Funds carry negligible market risk.",
                            where:
                              "IDFC First / IndusInd (6–7% savings rate), or Liquid Funds via Groww / Paytm Money",
                          },
                          {
                            icon: "🏥",
                            title: "Health + Term Insurance",
                            sub: "Core security layer",
                            riskCls: "bg-green-500/20 text-green-400",
                            risk: "No Risk",
                            invest: "₹15,000–₹30,000/year",
                            saved: "Protects family dependencies & savings",
                            ret: "Risk protection",
                            know: "A ₹1Cr term cover protects your wealth foundation. Medical emergencies won't wipe out your compounding portfolio.",
                            riskInfo:
                              "Pure protection — no maturity value. Choose IRDAI-registered insurers with high claim settlement ratios.",
                            where:
                              "HDFC Ergo, Max Life, Star Health — compare on PolicyBazaar or Coverfox",
                          },
                          {
                            icon: "🏛️",
                            title: "NPS — Employer 14% of Basic",
                            sub: "Retirement-linked tax shield",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low–Med Risk",
                            invest: "Up to 14% of basic salary via employer",
                            saved:
                              "₹" +
                              fmt(inc * 0.4 * 0.14 * rate) +
                              " approx saved",
                            ret: "10–12% avg (equity NPS)",
                            know: "Ask employer to contribute up to 14% of basic salary into NPS. Deducted from taxable income directly under Section 80CCD(2).",
                            riskInfo:
                              "Locked until retirement (age 60). 40% of corpus must buy annuity (taxable). 60% lump sum withdrawal is tax-free.",
                            where:
                              "eNPS Portal (enps.nsdl.com), HDFC Pension Fund, SBI Pension Funds",
                          },
                          {
                            icon: "🚀",
                            title: "Flexi Cap / Index Fund SIP",
                            sub: "Invest freed-up income for compounding",
                            riskCls: "bg-yellow-500/20 text-yellow-400",
                            risk: "Medium Risk",
                            invest:
                              "₹" +
                              fmt(Math.max(3000, (inc * 0.12) / 12)) +
                              "/month SIP",
                            saved: "LTCG > ₹1.25L taxed at 12.5% only",
                            ret: "12–18% CAGR",
                            know: "New Regime has no 80C deductions but full flexibility. Invest the difference into high-growth equity funds — no lock-in, better long-term wealth.",
                            riskInfo:
                              "Market-linked. Best for 7+ year horizon. SIP reduces timing risk through rupee cost averaging.",
                            where:
                              "Parag Parikh Flexi Cap, UTI Nifty 50 Index — via Groww, Zerodha, Kuvera",
                          },
                        ];

                    const HIGH_CARDS = isOld
                      ? [
                          {
                            icon: "🏛️",
                            title: "NPS Max-Shield (Corp 14% + Self ₹50k)",
                            sub: "Most powerful deduction at 30% slab",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low–Med Risk",
                            invest:
                              "₹" +
                              fmt(inc * 0.4 * 0.14) +
                              "/yr (employer) + ₹50,000 (self)",
                            saved:
                              "₹" +
                              fmt((inc * 0.4 * 0.14 + 50000) * 0.3) +
                              " saved",
                            ret: "10–13% avg (equity NPS)",
                            know: "At 30% slab NPS is the most powerful tool. Employer NPS up to 14% of basic is pre-tax. Self ₹50k gives 80CCD(1B) benefit above the 80C limit.",
                            riskInfo:
                              "Locked until age 60. 40% annuity mandatory and taxable. Up to 75% equity exposure allowed in auto-choice NPS.",
                            where:
                              "eNPS Portal, HDFC Pension Fund, SBI Pension Fund",
                          },
                          {
                            icon: "🥇",
                            title: "Sovereign Gold Bonds (SGB)",
                            sub: "100% tax-free capital gains at maturity",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low Risk",
                            invest:
                              "₹" + fmt(inc * 0.08) + "/year (8% of income)",
                            saved:
                              "Capital gains: 100% exempt (saves 30% vs FD)",
                            ret: "2.5% interest + gold gains",
                            know: "For 30% bracket earners, SGBs are extremely powerful — all maturity gains are 0% taxable. Converts 30% taxable gains into tax-free gains.",
                            riskInfo:
                              "Gold prices volatile short-term. 8-year maturity (exchange exit after 5 years). The 2.5% interest is taxable annually.",
                            where:
                              "RBI Retail Direct (rbiretaildirect.org.in), NSE/BSE, Zerodha Coin",
                          },
                          {
                            icon: "🏠",
                            title: "Home Loan Interest Shield (Section 24b)",
                            sub: "Up to ₹2L deductible per year",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low Risk",
                            invest: "Via home loan EMI (interest portion)",
                            saved:
                              "Up to ₹" + fmt(200000 * 0.3) + " saved/year",
                            ret: "Asset appreciation + rental yield",
                            know: "If you have a home loan, interest paid up to ₹2,00,000/year is directly deductible under Section 24b. At 30% slab this saves ₹62,400/year.",
                            riskInfo:
                              "Real estate is illiquid. Property market risk on the underlying asset. Only for self-occupied property.",
                            where:
                              "HDFC Bank, SBI Home Loans, ICICI, LIC Housing Finance",
                          },
                          {
                            icon: "📈",
                            title: "ELSS + Full 80C Maximisation",
                            sub: "Saturate the ₹1.5L deduction bucket",
                            riskCls: "bg-yellow-500/20 text-yellow-400",
                            risk: "Medium Risk",
                            invest: "₹1,50,000/year",
                            saved: "₹" + fmt(150000 * 0.3) + " saved",
                            ret: "12–15% CAGR",
                            know: "At 30% slab, maxing 80C ₹1.5L saves ₹46,800 in tax. ELSS gives best returns with shortest 3-year lock-in vs 15 years for PPF.",
                            riskInfo:
                              "ELSS is market-linked. NAV can fall. 3-year lock-in strictly enforced.",
                            where:
                              "Quant Tax Plan, Mirae Asset Tax Saver — via Groww, Zerodha",
                          },
                        ]
                      : [
                          {
                            icon: "🏛️",
                            title: "NPS Max-Shield (Corp 14% of Basic)",
                            sub: "Powerful pre-tax employer shield",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low–Med Risk",
                            invest:
                              "₹" + fmt(inc * 0.4 * 0.14) + "/yr (employer)",
                            saved:
                              "₹" + fmt(inc * 0.4 * 0.14 * rate) + " saved",
                            ret: "10–13% avg (equity NPS)",
                            know: "Under New Regime, corporate contribution up to 14% of basic salary is still 100% tax-free under Section 80CCD(2). Direct pre-tax savings at the 30% slab.",
                            riskInfo:
                              "Locked until age 60. 40% annuity mandatory and taxable. Up to 75% equity exposure allowed in auto-choice NPS.",
                            where:
                              "eNPS Portal, HDFC Pension Fund, SBI Pension Fund",
                          },
                          {
                            icon: "🥇",
                            title: "Sovereign Gold Bonds (SGB)",
                            sub: "100% tax-free capital gains at maturity",
                            riskCls: "bg-blue-500/20 text-blue-400",
                            risk: "Low Risk",
                            invest:
                              "₹" + fmt(inc * 0.08) + "/year (8% of income)",
                            saved:
                              "Capital gains: 100% exempt (saves 30% vs gold FDs)",
                            ret: "2.5% interest + gold gains",
                            know: "For 30% bracket earners, SGBs are extremely powerful — all maturity gains are 0% taxable. Converts 30% taxable gains into tax-free gains.",
                            riskInfo:
                              "Gold prices volatile short-term. 8-year maturity (exchange exit after 5 years). The 2.5% interest is taxable annually.",
                            where:
                              "RBI Retail Direct (rbiretaildirect.org.in), NSE/BSE, Zerodha Coin",
                          },
                          {
                            icon: "🚀",
                            title: "Equity Mutual Funds — LTCG Harvesting",
                            sub: "Tax-efficient compounding at scale",
                            riskCls: "bg-yellow-500/20 text-yellow-400",
                            risk: "Medium Risk",
                            invest: "₹" + fmt((inc * 0.15) / 12) + "/month SIP",
                            saved:
                              "Pay 12.5% LTCG vs 30% income tax — saves ~₹" +
                              fmt(inc * 0.15 * (0.3 - 0.125)) +
                              "/yr on returns",
                            ret: "13–18% CAGR",
                            know: "Equity fund gains above ₹1.25L/year are taxed at only 12.5% LTCG — far below 30% slab. Ensure annual gains harvesting to stay under ₹1.25L tax-free limit.",
                            riskInfo:
                              "Market-linked. Needs 7+ year horizon. Short-term gains (< 1 year) taxed at 20% STCG.",
                            where:
                              "Parag Parikh Flexi Cap, Mirae Asset Large & Midcap, UTI Nifty 50 — via Zerodha, Groww",
                          },
                          {
                            icon: "🛡️",
                            title: "High-Coverage Term & Health Protection",
                            sub: "Asset & dependants shield",
                            riskCls: "bg-green-500/20 text-green-400",
                            risk: "No Risk",
                            invest: "₹25,000–₹50,000/year",
                            saved: "Shields entire investment corpus",
                            ret: "Risk protection",
                            know: "High earner wealth requires high protection. Ensure a term plan cover of at least ₹2Cr+ and comprehensive health floater to prevent catastrophic medical bills from liquidating assets.",
                            riskInfo:
                              "Pure protection — no maturity value. Choose IRDAI-registered insurers with high claim settlement ratios.",
                            where:
                              "HDFC Ergo, Max Life, Star Health — compare on PolicyBazaar",
                          },
                        ];

                    const cards =
                      tier === "low"
                        ? LOW_CARDS
                        : tier === "mid"
                          ? MID_CARDS
                          : HIGH_CARDS;
                    const riskDot = {
                      "No Risk": "🟢",
                      "Low Risk": "🔵",
                      "Low–Med Risk": "🔵",
                      "Medium Risk": "🟡",
                      "High Risk": "🔴",
                    };

                    return (
                      <>
                        <div className="p-3.5 rounded-xl border border-white/5 bg-white/3 text-xs text-slate-300 leading-relaxed animate-fadeIn">
                          <span className="font-bold text-base mr-1">
                            {b.icon}
                          </span>
                          <span className={"font-bold mr-1 " + b.color}>
                            {b.label}:
                          </span>
                          {b.desc}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[580px] overflow-y-auto pr-1">
                          {cards.map((c, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-white/10 bg-white/3 hover:border-white/25 overflow-hidden transition-all group animate-fadeIn"
                              style={{ animationDelay: `${i * 0.08}s` }}
                            >
                              <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/10">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition">
                                    {c.icon}
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs text-slate-200">
                                      {c.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      {c.sub}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={
                                    "text-[9px] px-2 py-1 rounded-full font-bold shrink-0 ml-2 " +
                                    c.riskCls
                                  }
                                >
                                  {riskDot[c.risk] || "🟡"} {c.risk}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 divide-x divide-white/5 bg-black/15">
                                <div className="p-2.5 text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">
                                    💰 Invest
                                  </p>
                                  <p className="text-[10px] font-bold text-white leading-tight">
                                    {c.invest}
                                  </p>
                                </div>
                                <div className="p-2.5 text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">
                                    🧾 Tax Saved
                                  </p>
                                  <p className="text-[10px] font-bold text-green-400 leading-tight">
                                    {c.saved}
                                  </p>
                                </div>
                                <div className="p-2.5 text-center">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">
                                    📈 Returns
                                  </p>
                                  <p className="text-[10px] font-bold text-cyan-400 leading-tight">
                                    {c.ret}
                                  </p>
                                </div>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-[11px] shrink-0">
                                    💡
                                  </span>
                                  <p className="text-[10px] text-slate-300 leading-relaxed">
                                    <span className="font-semibold text-slate-200">
                                      Know:{" "}
                                    </span>
                                    {c.know}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[11px] shrink-0">
                                    ⚠️
                                  </span>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">
                                    <span className="font-semibold text-yellow-400">
                                      Risk:{" "}
                                    </span>
                                    {c.riskInfo}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-[11px] shrink-0">
                                    🏦
                                  </span>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">
                                    <span className="font-semibold text-slate-300">
                                      Where:{" "}
                                    </span>
                                    {c.where}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 animate-fadeIn">
                          <a
                            href="https://groww.in/mutual-funds/category/elss"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-[10px] flex items-center gap-1.5 hover:scale-[1.02] transition"
                            style={{ padding: "6px 14px", width: "auto" }}
                          >
                            📈 Invest via Groww ↗
                          </a>
                          <a
                            href="https://enps.nsdl.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/20 text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition"
                          >
                            🏛️ Open NPS Account ↗
                          </a>
                          <a
                            href="https://www.rbiretaildirect.org.in/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition"
                          >
                            🥇 Buy SGB via RBI ↗
                          </a>
                          <a
                            href="https://www.incometax.gov.in/iec/foportal/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition"
                          >
                            🧾 e-File Tax Return ↗
                          </a>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
        <SectionGuide sectionId="/mentor" />
      </main>
    
    </div>
  );
};

export default AIMentor;
