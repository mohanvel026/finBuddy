import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SectionGuide from "../components/common/SectionGuide";
/* import Sidebar removed */
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./LabAnimations.css";
import { useAnimatedValue, useLessonEntrance, useGoalFlash, useParticles } from "../hooks/useLabAnimation";
import {
  ACADEMY_LESSONS,
  getMicroscopeConfig,
  multilingualAcademy,
} from "./LearnHub";
import {
  ChevronLeft,
  Sliders,
  Terminal,
  Send,
  MessageSquare,
  Sparkles,
  Volume2,
  BookOpen,
  LayoutDashboard,
  Cpu
} from "lucide-react";

// Copy of getDynamicLessonContent to keep LabPage self-contained
// Copy of getDynamicLessonContent to keep LabPage self-contained, but integrated with multilingualAcademy
const getDynamicLessonContent = (lesson, lang) => {
  const lessonId = lesson?.id || "l1";
  const langKey = lang || "en";

  // Attempt to resolve lesson data using the global multilingualAcademy registry
  if (
    multilingualAcademy &&
    multilingualAcademy[langKey] &&
    multilingualAcademy[langKey][lessonId]
  ) {
    const data = multilingualAcademy[langKey][lessonId];
    return {
      concept: data.concept || "Advanced financial concept.",
      whyMatters: data.whyMatters || "Ensures long-term capital optimization.",
      analogy: data.analogy || "Pillars of security in a dynamic economy.",
      actionGoal: data.actionGoal || "Adjust indicators to optimize target outcome.",
    };
  }

  const title = lesson.title || "Specialized Topic";
  const t = title.toLowerCase();

  // English default fallback templates
  let concept = "Advanced financial concept concerning resource optimization and asset allocation.";
  let whyMatters = "Ensures protection against structural decay of savings and improves compounding efficiency.";
  let analogy = "Imagine a reservoir. If you do not manage inflow and outflow, the water levels will decay due to evaporation.";
  let actionGoal = "Increase the simulation variable to reach the target threshold and optimize the model.";

  if (t.includes("defi") || t.includes("blockchain")) {
    concept = "Decentralized Finance (DeFi) replaces traditional banking intermediaries with open-source smart contracts on public blockchains.";
    whyMatters = "It eliminates intermediary fees, cuts transaction delay times, and provides global permissionless accessibility.";
    analogy = "Like a self-service vending machine instead of a manned grocery store stall—pure code handles the swap without a cashier.";
    actionGoal = "Increase blockchain network nodes to 70+ to secure consensus and validate the smart contract transaction.";
  } else if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
    concept = "Inflation measures the rate at which the general level of prices for goods and services rises, eroding purchasing power.";
    whyMatters = "WPI measures wholesale transaction prices, while CPI measures direct retail consumer price baskets used to calculate real interest rates.";
    analogy = "Like a slow leak in a bicycle tire—if you do not pump it up (earn returns), you will eventually be riding on flat rims.";
    actionGoal = "Slide years of inflation to 15+ years and observe the compounding purchasing power loss of idle cash.";
  } else if (t.includes("sgb") || t.includes("gold bond")) {
    concept = "Sovereign Gold Bonds (SGBs) are government securities denominated in grams of gold, offering a safe alternative to physical gold.";
    whyMatters = "They offer a 2.5% annual interest yield, zero storage costs, and complete capital gains tax exemption if held until maturity.";
    analogy = "Like owning a digital gold mine that pays you rent every six months, without needing a safe deposit vault.";
    actionGoal = "Slide the holding duration to 8 years to unlock tax-free maturity status and claim maximum yield.";
  } else if (t.includes("epf") || t.includes("ppf") || t.includes("provident")) {
    concept = "EPF (Employees' Provident Fund) is a mandatory salary-deducted savings scheme, while PPF is a voluntary tax-free savings account.";
    whyMatters = "Both offer safe, government-backed compounding with EEE (Exempt-Exempt-Exempt) tax status to secure long-term retirement safety.";
    analogy = "Like planting a Banyan tree in a protected national park—it grows slowly but is immune to market storms and axes.";
    actionGoal = "Optimize the compounding horizon to 15+ years to see the exponential growth of tax-shielded retirement funds.";
  } else if (t.includes("beta") || t.includes("alpha")) {
    concept = "Alpha measures a fund's excess return relative to a benchmark, while Beta measures its sensitivity to market volatility.";
    whyMatters = "High Alpha indicates active manager outperformance, while Beta tells you if the fund will swing more or less than the index.";
    analogy = "Beta is how much a boat swings with the waves; Alpha is how fast the motor pushes it ahead of other boats.";
    actionGoal = "Adjust spot price drift to achieve positive Alpha while keeping Beta below 1.2 for risk control.";
  } else if (t.includes("reit") || t.includes("invit")) {
    concept = "REITs (Real Estate Investment Trusts) and InvITs (Infrastructure Investment Trusts) pool capital to buy income-generating property assets.";
    whyMatters = "They allow retail investors to own shares in commercial tech parks or toll roads, yielding 90%+ of net cash flows as dividends.";
    analogy = "Like buying one brick of a massive shopping mall and receiving a tiny share of the parking and rent receipts every month.";
    actionGoal = "Increase the dividend payout rate to 90% to trigger mandatory distribution and maximize cash flow yields.";
  } else if (t.includes("dupont") || t.includes("efficiency")) {
    concept = "DuPont analysis breaks down Return on Equity (ROE) into three components: Profit Margin, Asset Turnover, and Financial Leverage.";
    whyMatters = "It isolates whether a company's profitability is driven by high prices, fast inventory sales, or dangerous debt leverage.";
    analogy = "Like diagnostic tests on an engine—revealing if speed comes from lightweight tuning, supercharged fuel, or nitro boost.";
    actionGoal = "Increase profit margin and asset turnover to boost ROE without raising debt leverage past safe limits.";
  } else if (t.includes("greeks") || t.includes("delta") || t.includes("theta")) {
    concept = "Option Greeks measure the sensitivity of option prices to changes in underlying price (Delta), time decay (Theta), and volatility (Vega).";
    whyMatters = "Option buyers face severe time decay risk (Theta), while sellers manage delta exposure to hedge directional market swings.";
    analogy = "Like a melting ice cream cone (Theta decay)—the longer you hold it, the less it is worth unless the temperature drops (Delta shift).";
    actionGoal = "Slide days to expiration down to observe accelerated Theta decay on the options premium valuation curve.";
  } else if (t.includes("option spread") || t.includes("iron butterfly") || t.includes("hedging")) {
    concept = "Option spreads involve buying and selling multiple options simultaneously to define maximum risk and capital requirement.";
    whyMatters = "It allows traders to profit from market stagnation (neutral spreads) or limit losses compared to naked option buying.";
    analogy = "Like building a cage around a wild animal—you limit how far it can jump in either direction, keeping your budget safe.";
    actionGoal = "Adjust volatility spike rate to test iron butterfly tolerance and verify maximum potential net credit yield.";
  } else if (t.includes("corporate red flag") || t.includes("auditing")) {
    concept = "Corporate red flags include forensic discrepancies like high promoter pledges, receivables growth outpacing sales, or frequent auditor changes.";
    whyMatters = "Detecting these warning signs early saves investors from catastrophic capital wipes (e.g. Satyam, Satavahana instances).";
    analogy = "Like checking a car's exhaust smoke and oil leaks before buying—it prevents purchasing a polished engine that is ready to blow.";
    actionGoal = "Increase promoter pledged shares past 50% to trigger corporate governance margin call alerts.";
  }

  // Tamil Templates
  if (lang === "ta") {
    concept = "வளங்களை மேம்படுத்துதல் மற்றும் சொத்து ஒதுக்கீடு தொடர்பான மேம்பட்ட நிதி கருத்து.";
    whyMatters = "சேமிப்பின் சிதைவுக்கு எதிரான பாதுகாப்பை உறுதி செய்கிறது மற்றும் கூட்டு வட்டி செயல்திறனை மேம்படுத்துகிறது.";
    analogy = "ஒரு நீர் தேக்கத்தை கற்பனை செய்து பாருங்கள். வரத்தையும் செலவையும் நிர்வகிக்காவிட்டால், ஆவியாதல் காரணமாக நீர் மட்டம் குறையும்.";
    actionGoal = "அளவுகோலை இலக்கு வரம்பை எட்டச் செய்து மாதிரியை மேம்படுத்தவும்.";
  }

  // Tanglish Templates
  if (lang === "tanglish") {
    concept = "Advanced compound growth mechanism path regarding asset selection and risk control rules.";
    whyMatters = "It protects savings from inflation decay and boosts net compounding velocity.";
    analogy = "Oru asset target-ah hit panna continuous compounding support pannanum, low yield-la slow-a irukum.";
    actionGoal = "Slide settings to match the target threshold level for optimization.";
  }

  return { concept, whyMatters, analogy, actionGoal };
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
              className="hover:text-white cursor-pointer transition text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded border border-white/5 font-bold"
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

// Web Audio API Synthesizers for premium sound effects
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const playCrisisAlarm = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    
    // Low-frequency siren sweep
    osc1.frequency.setValueAtTime(120, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.4);
    osc1.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.8);
    
    osc2.frequency.setValueAtTime(124, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(184, ctx.currentTime + 0.4);
    osc2.frequency.linearRampToValueAtTime(124, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn("Audio Context blocked or failed:", err);
  }
};

const playGoalSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    // Play a major-triad chime (C4, E4, G4, C5) sequentially
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.6);
    });
  } catch (err) {
    console.warn("Audio Context blocked or failed:", err);
  }
};

const getOptionName = (lessonId, value) => {
  if (lessonId === 'l26') {
    if (value === 1) return "Annual";
    if (value === 2) return "Semi-Annual";
    if (value === 3) return "Quarterly";
    if (value === 4) return "Monthly";
  }
  if (lessonId === 'l30') {
    if (value === 1) return "Yearly";
    if (value === 2) return "Monthly";
    if (value === 3) return "Weekly";
    if (value === 4) return "Daily";
  }
  return null;
};

const LabPage = () => {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const lessonId = searchParams.get("lessonId") || "l1";
  
  const activeLesson = useMemo(() => {
    return ACADEMY_LESSONS.find(l => l.id === lessonId) || ACADEMY_LESSONS[0];
  }, [lessonId]);

  const config = useMemo(() => {
    return getMicroscopeConfig(activeLesson.id);
  }, [activeLesson]);

  const [microscopeValue, setMicroscopeValue] = useState(config?.default || 30);
  const [microscopeSecondaryValue, setMicroscopeSecondaryValue] = useState(
    config?.secondaryDefault !== undefined ? config.secondaryDefault : 50
  );

  // ── Spring-physics animated values for silky-smooth SVG interpolation ──
  const animValue    = useAnimatedValue(microscopeValue,          { stiffness: 110, damping: 16 });
  const animSecValue = useAnimatedValue(microscopeSecondaryValue, { stiffness: 110, damping: 16 });

  // ── Lesson entrance animation ──
  const lessonEntranceClass = useLessonEntrance(activeLesson.id);

  // ── Goal-achieved glow flash ──
  const isGoalFlashing = useGoalFlash(
    config?.goalCheck(microscopeValue, config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined)
  );

  const [compoundAnimYear, setCompoundAnimYear] = useState(0);
  const [compoundAnimOpacity, setCompoundAnimOpacity] = useState(1);
  const [chartHoveredYear, setChartHoveredYear] = useState(null);
  
  const [lessonActionCompleted, setLessonActionCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [historyBuffer, setHistoryBuffer] = useState([]);
  const [isSweeping, setIsSweeping] = useState(false);
  const queryLang = searchParams.get("lang") || "en";
  const [audioLang, setAudioLang] = useState(queryLang);

  useEffect(() => {
    const urlLang = searchParams.get("lang");
    if (urlLang && urlLang !== audioLang) {
      setAudioLang(urlLang);
    }
  }, [searchParams]);

  // New Interactive Mechanics States
  const [hudActive, setHudActive] = useState(false);
  const [activeMarketEvent, setActiveMarketEvent] = useState(null);
  const [eventCountdown, setEventCountdown] = useState(0);
  const [stabilizeTicks, setStabilizeTicks] = useState(0);
  const [eventSuccess, setEventSuccess] = useState(false);
  const [hoveredControl, setHoveredControl] = useState("");
  const [showGuidePanel, setShowGuidePanel] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [debateScore, setDebateScore] = useState(null);
  const [debateFeedback, setDebateFeedback] = useState("");
  const [voiceDebateEnabled, setVoiceDebateEnabled] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("simulation");


  // hacker-style Telemetry Logs and Oscilloscope States
  const [consoleLogs, setConsoleLogs] = useState([
    `[SYSTEM] Initializing Simulation Lab...`,
    `[SYSTEM] Ready. Adjust variables to calibrate system state.`
  ]);
  const [terminalTab, setTerminalTab] = useState("verdict"); // "verdict" or "logs"
  const consoleEndRef = useRef(null);
  const consoleContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const addConsoleLog = (text) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLogs((prev) => {
      const updated = [...prev, `[${timeStr}] ${text}`];
      return updated.slice(-25);
    });
  };

  useEffect(() => {
    if (config) {
      setConsoleLogs([
        `[SYSTEM] Initializing Simulation Lab for "${activeLesson.title}"...`,
        `[SYSTEM] Ready. Adjust variables to calibrate system state.`
      ]);
    }
  }, [activeLesson.id]);

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTo({
        top: consoleContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [consoleLogs]);

  // HTML5 Canvas Voice Waveform Oscilloscope Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let phase = 0;
    
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid backing
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 10; i < canvas.height; i += 10) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Draw sine wave
      ctx.strokeStyle = isListening ? '#ef4444' : '#8b5cf6';
      ctx.shadowColor = isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(139, 92, 246, 0.3)';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      const amplitude = isListening ? 14 + Math.sin(phase * 2.5) * 6 : 3;
      const frequency = isListening ? 0.12 : 0.04;
      
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * frequency - phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
      
      phase += isListening ? 0.22 : 0.04;
      animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isListening]);

  // AI Chat Tutor states
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: `Welcome to the Laboratory Sandbox! I am FinGuru AI. Today we are experimenting with "${activeLesson.title}". Adjust the sliders to simulate live market dynamics. Ask me anything about this topic!`
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (config) {
      setMicroscopeValue(config.default);
      setMicroscopeSecondaryValue(config.secondaryDefault !== undefined ? config.secondaryDefault : 50);
      setLessonActionCompleted(false);
      setHistoryBuffer([]);
      setIsSweeping(false);
      setActiveMarketEvent(null);
      setEventCountdown(0);
      setDebateScore(null);
      setDebateFeedback("");
    }
  }, [activeLesson.id, config]);

  // Compounding Frequency Animation Loop
  useEffect(() => {
    if (activeLesson.id === 'l26') {
      let animId;
      let startTime = performance.now();
      const duration = 9000; // 9 seconds for a full loop
      const animate = (time) => {
        const elapsed = (time - startTime) % duration;
        
        let yearVal = 0;
        let opacityVal = 1;
        
        if (elapsed < 500) {
          yearVal = 0;
          opacityVal = elapsed / 500;
        } else if (elapsed < 6500) {
          yearVal = ((elapsed - 500) / 6000) * 30;
          opacityVal = 1;
        } else if (elapsed < 8000) {
          yearVal = 30;
          opacityVal = 1;
        } else if (elapsed < 8500) {
          yearVal = 30;
          opacityVal = 1 - (elapsed - 8000) / 500;
        } else {
          yearVal = 0;
          opacityVal = 0;
        }
        
        setCompoundAnimYear(yearVal);
        setCompoundAnimOpacity(opacityVal);
        animId = requestAnimationFrame(animate);
      };
      animId = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(animId);
      };
    } else {
      setCompoundAnimYear(0);
      setCompoundAnimOpacity(1);
    }
  }, [activeLesson.id]);

  const updateHistoryBuffer = (v1, v2) => {
    setHistoryBuffer((prev) => {
      const updated = [...prev, { val1: v1, val2: v2 }];
      if (updated.length > 25) {
        return updated.slice(updated.length - 25);
      }
      return updated;
    });
  };

  const getHistoryPath = () => {
    if (!config || historyBuffer.length < 2) return "";
    const points = historyBuffer.map((pt, idx) => {
      const x = 20 + (idx / (historyBuffer.length - 1)) * 200;
      const valPct = (pt.val1 - config.min) / (config.max - config.min || 1);
      const y = 100 - valPct * 80;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  const checkGoal = (v1, v2) => {
    if (!config) return;
    const secVal = config.secondaryKnobLabel !== undefined ? v2 : undefined;
    const goalMet = config.goalCheck(v1, secVal);
    if (goalMet) {
      if (!lessonActionCompleted) {
        setLessonActionCompleted(true);
        playGoalSuccessSound();
        addConsoleLog(`SUCCESS: Target goal parameters satisfied. Calibration verified.`);
        toast.success("Practice target achieved! Click 'Complete & Claim' to collect your rewards!", {
          id: "goal-success-toast",
          icon: "🏆",
          duration: 4000
        });
      }
    } else {
      setLessonActionCompleted(false);
    }
  };

  const handleMicroscopeChange = (val) => {
    setMicroscopeValue(val);
    updateHistoryBuffer(val, microscopeSecondaryValue);
    checkGoal(val, microscopeSecondaryValue);
    addConsoleLog(`Telemetry update: ${config?.knobLabel} set to ${val} ${config?.units}`);
  };

  const handleMicroscopeSecondaryChange = (val) => {
    setMicroscopeSecondaryValue(val);
    updateHistoryBuffer(microscopeValue, val);
    checkGoal(microscopeValue, val);
    addConsoleLog(`Telemetry update: ${config?.secondaryKnobLabel} set to ${val} ${config?.secondaryUnits}`);
  };

  // Auto Sweep Simulation Interval
  useEffect(() => {
    let interval = null;
    if (isSweeping && config) {
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
          updateHistoryBuffer(next, microscopeSecondaryValue);
          checkGoal(next, microscopeSecondaryValue);
          return next;
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSweeping, config, microscopeSecondaryValue]);

  // TTS Speech Output for Audio
  const handleTTS = () => {
    if (!activeLessonContent) return;
    const textToSpeak = `${activeLesson.title}. Concept: ${activeLessonContent.concept}. Analogy: ${activeLessonContent.analogy}. Target Goal: ${activeLessonContent.actionGoal}`;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = audioLang === "ta" ? "ta-IN" : "en-US";
      
      utterance.onstart = () => {
        addConsoleLog(`Audio output initiated in lang "${audioLang}".`);
        toast.success("Audio playback started 🔊");
      };
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Text-to-speech not supported on this browser.");
    }
  };

  // Completion Claim Action
  const handleClaim = async () => {
    try {
      const claimToast = toast.loading("Recording lesson completion...");
      const currentCompleted = user?.lessonsCompleted || [];
      
      if (!currentCompleted.includes(activeLesson.id)) {
        const nextCoins = (user?.virtualCoins || 0) + activeLesson.coins;
        const res = await api.post("/mentor/lesson-complete", {
          lessonId: activeLesson.id,
          coinsReward: activeLesson.coins,
        });

        if (res.data.success) {
          if (updateUser && user) {
            updateUser({
              lessonsCompleted: [...currentCompleted, activeLesson.id],
              virtualCoins: nextCoins,
            });
          }
          toast.dismiss(claimToast);
          setShowCelebration(true);
        } else {
          toast.error("Failed to sync profile. Try again.", { id: claimToast });
        }
      } else {
        toast.dismiss(claimToast);
        setShowCelebration(true);
      }
    } catch (e) {
      toast.error("Failed to complete lesson. Server error.");
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    const from = searchParams.get("from");
    if (from === "playground") {
      navigate("/playground");
    } else {
      navigate("/learn");
    }
  };

  // Speech Synthesis helper
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = audioLang === "ta" ? "ta-IN" : "en-US";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Browser Speech-To-Text Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome/Edge!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = audioLang === "ta" ? "ta-IN" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening... Speak your debate point! 🎙️");
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setChatInput(speechToText);
      toast.success("Voice captured successfully!");
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event);
      toast.error("Voice recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // AI Tutor debate response evaluation scoring
  const evaluateDebateInput = (text) => {
    const keywords = ["compounding", "interest", "alpha", "beta", "inflation", "cpi", "wpi", "risk", "bond", "yield", "reit", "dividend", "leverage", "audit", "receivables", "pledge", "theta", "decay", "contract", "consensus", "node"];
    let score = 5;
    const lower = text.toLowerCase();
    keywords.forEach(kw => {
      if (lower.includes(kw)) score += 1;
    });
    if (text.length > 55) score += 1;
    if (text.length > 110) score += 1;
    score = Math.min(score, 10);
    
    let feedback = "Basic response. Mention specific simulation parameters or benchmark ratios to score higher.";
    if (score >= 9) {
      feedback = "Masterful analysis! Outstanding logic connecting volatility parameters with macroeconomic yields.";
    } else if (score >= 7) {
      feedback = "Solid reasoning. You correctly identified the primary model sensitivities and risk factors.";
    }
    
    return { score, feedback };
  };

  // Trigger market crisis event and start stabilization countdown
  const injectMarketCrisis = () => {
    if (!config) return;
    let name = "Global Liquidity Squeeze";
    let desc = "Liquidity drops worldwide. Stabilize asset ratios!";
    let driftDir = 1;
    let targetKnob = "1";
    
    // Choose target knob based on lesson configurations dynamically
    const t = activeLesson.title.toLowerCase();
    if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
      targetKnob = config.secondaryKnobLabel ? "2" : "1";
    } else if (t.includes("alpha") || t.includes("beta")) {
      targetKnob = "1";
    } else if (t.includes("defi") || t.includes("blockchain")) {
      targetKnob = "1";
    } else if (t.includes("greeks") || t.includes("theta")) {
      targetKnob = "1";
    } else {
      targetKnob = config.secondaryKnobLabel ? "2" : "1";
    }

    // Determine target range limits dynamically based on the targeted knob's min and max bounds
    let targetMin, targetMax;
    const targetLabel = targetKnob === "1" 
      ? config.knobLabel 
      : (config.secondaryKnobLabel || "Variable");
    const targetUnits = targetKnob === "1"
      ? (config.units || "")
      : (config.secondaryUnits || "");

    const kMin = targetKnob === "1" ? config.min : (config.secondaryMin !== undefined ? config.secondaryMin : 0);
    const kMax = targetKnob === "1" ? config.max : (config.secondaryMax !== undefined ? config.secondaryMax : 100);

    if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
      name = "🔥 Oil Supply Shock";
      driftDir = 1;
      if (activeLesson.id === "l11") {
        targetMin = 3.5;
        targetMax = 6.5;
      } else if (activeLesson.id === "l74") {
        targetMin = 15;
        targetMax = 35;
      } else {
        targetMin = Number((kMin + (kMax - kMin) * 0.15).toFixed(1));
        targetMax = Number((kMin + (kMax - kMin) * 0.45).toFixed(1));
      }
      desc = `Energy prices spike. Drag ${targetLabel.toLowerCase()} down to keep it stabilized between ${targetMin}${targetUnits} and ${targetMax}${targetUnits}!`;
    } else if (t.includes("alpha") || t.includes("beta")) {
      name = "🌪️ Volatility Selloff";
      driftDir = 1;
      if (activeLesson.id === "l53" || activeLesson.id === "l81") {
        targetMin = 0.8;
        targetMax = 1.2;
      } else if (activeLesson.id === "l82") {
        targetMin = 1.0;
        targetMax = 3.0;
      } else {
        targetMin = Number((kMin + (kMax - kMin) * 0.35).toFixed(1));
        targetMax = Number((kMin + (kMax - kMin) * 0.65).toFixed(1));
      }
      desc = `Broad market panic. Adjust ${targetLabel.toLowerCase()} to keep it stabilized between ${targetMin}${targetUnits} and ${targetMax}${targetUnits}!`;
    } else if (t.includes("defi") || t.includes("blockchain")) {
      name = "🛡️ Smart Contract Consensus Attack";
      driftDir = -1;
      if (activeLesson.id === "l7") {
        targetMin = 6;
        targetMax = 9;
      } else if (activeLesson.id === "l73") {
        targetMin = 60;
        targetMax = 80;
      } else {
        targetMin = Number((kMin + (kMax - kMin) * 0.55).toFixed(1));
        targetMax = Number((kMin + (kMax - kMin) * 0.85).toFixed(1));
      }
      desc = `Nodes drop due to consensus threat. Boost ${targetLabel.toLowerCase()} between ${targetMin}${targetUnits} and ${targetMax}${targetUnits} to defend!`;
    } else if (t.includes("greeks") || t.includes("theta")) {
      name = "⏳ Accelerated Expiry Drift";
      driftDir = -1;
      if (activeLesson.id === "l20") {
        targetMin = 12;
        targetMax = 18;
      } else {
        targetMin = Number((kMin + (kMax - kMin) * 0.4).toFixed(1));
        targetMax = Number((kMin + (kMax - kMin) * 0.6).toFixed(1));
      }
      desc = `Heavy options volume. Stabilize ${targetLabel.toLowerCase()} between ${targetMin}${targetUnits} and ${targetMax}${targetUnits} to hedge Greeks!`;
    } else if (t.includes("allocat") || t.includes("diversif") || t.includes("rebalanc")) {
      name = "📉 Black Swan Equity Crash";
      driftDir = -1;
      if (activeLesson.id === "l10" || activeLesson.id === "l12" || activeLesson.id === "l13") {
        targetMin = 70;
        targetMax = 90;
      } else {
        targetMin = 45;
        targetMax = 55;
      }
      desc = `Equities plummet due to macroeconomic panic! Adjust ${targetLabel.toLowerCase()} back up between ${targetMin}${targetUnits} and ${targetMax}${targetUnits} to buy the dip and stabilize the compounding ledger!`;
    } else if (t.includes("saving") || t.includes("vault") || t.includes("emergency")) {
      name = "💸 Sudden Cash Drain Shock";
      driftDir = -1;
      targetMin = 5;
      targetMax = 6;
      desc = `Emergency expenses drain your savings! Adjust your emergency reserves back up between ${targetMin}${targetUnits} and ${targetMax}${targetUnits} to redeploy your storm shield!`;
    } else {
      targetMin = Number((kMin + (kMax - kMin) * 0.35).toFixed(1));
      targetMax = Number((kMin + (kMax - kMin) * 0.65).toFixed(1));
      driftDir = 1;
      desc = `System calibration anomaly. Adjust ${targetLabel.toLowerCase()} between ${targetMin}${targetUnits} and ${targetMax}${targetUnits} to restore balance!`;
    }

    setActiveMarketEvent({
      name,
      desc,
      targetMin,
      targetMax,
      driftDir,
      targetKnob
    });
    setEventCountdown(15);
    setStabilizeTicks(0);
    setEventSuccess(false);
    toast(`🚨 CRISIS EVENT INJECTED: ${name}!`, {
      id: "crisis-toast",
      duration: 4000,
      icon: "⚠️",
      style: {
        background: "#0f172a",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        color: "#f59e0b",
        fontSize: "12px",
        fontWeight: "bold",
        fontFamily: "monospace",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)"
      }
    });
  };

  // Refs for tracking values inside crisis interval without triggering effect restarts
  const microscopeValueRef = useRef(microscopeValue);
  const microscopeSecondaryValueRef = useRef(microscopeSecondaryValue);
  const configRef = useRef(config);
  const activeMarketEventRef = useRef(activeMarketEvent);

  useEffect(() => {
    microscopeValueRef.current = microscopeValue;
  }, [microscopeValue]);

  useEffect(() => {
    microscopeSecondaryValueRef.current = microscopeSecondaryValue;
  }, [microscopeSecondaryValue]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    activeMarketEventRef.current = activeMarketEvent;
  }, [activeMarketEvent]);

  // Crisis drift loop
  useEffect(() => {
    let interval = null;
    if (activeMarketEvent) {
      interval = setInterval(() => {
        const currentEvent = activeMarketEventRef.current;
        const currentConfig = configRef.current;
        if (!currentEvent || !currentConfig) return;

        // 1. Drift the targeted slider
        if (currentEvent.targetKnob === "1") {
          setMicroscopeValue((prev) => {
            const shift = currentEvent.driftDir * (currentConfig.step * 2.5);
            let next = prev + shift;
            if (next > currentConfig.max) next = currentConfig.max;
            if (next < currentConfig.min) next = currentConfig.min;
            return next;
          });
        } else {
          setMicroscopeSecondaryValue((prev) => {
            const stepVal = currentConfig.secondaryStep || 1;
            const shift = currentEvent.driftDir * (stepVal * 2.5);
            let next = prev + shift;
            const sMax = currentConfig.secondaryMax !== undefined ? currentConfig.secondaryMax : 100;
            const sMin = currentConfig.secondaryMin !== undefined ? currentConfig.secondaryMin : 0;
            if (next > sMax) next = sMax;
            if (next < sMin) next = sMin;
            return next;
          });
        }

        // 2. Check range alignment using latest ref value (represents current slider state)
        const currentVal = currentEvent.targetKnob === "1" 
          ? microscopeValueRef.current 
          : microscopeSecondaryValueRef.current;
        const inRange = currentVal >= currentEvent.targetMin && currentVal <= currentEvent.targetMax;
        if (inRange) {
          setStabilizeTicks((prev) => prev + 1);
        }

        // 3. Decrement countdown
        setEventCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMarketEvent]);

  // Handle Crisis Event Outcome Completion
  useEffect(() => {
    if (activeMarketEvent && eventCountdown === 0) {
      // Must hold in target range for at least 8 seconds out of 15
      if (stabilizeTicks >= 8) {
        setEventSuccess(true);
        if (updateUser && user) {
          updateUser({
            virtualCoins: (user.virtualCoins || 0) + 100
          });
        }
        addConsoleLog(`STABLE: Crisis successfully mitigated. System integrity recovered.`);
        toast.success("🏆 Crisis successfully stabilized! +100 Coins claimed!", { id: "crisis-toast" });
      } else {
        addConsoleLog(`FAILURE: System destabilized. Telemetry limits exceeded.`);
        toast(`❌ Crisis drift went out of limits. System destabilized!`, {
          id: "crisis-toast",
          duration: 4000,
          icon: "💥",
          style: {
            background: "#0f172a",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: "bold",
            fontFamily: "monospace",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)"
          }
        });
      }
      const timer = setTimeout(() => {
        setActiveMarketEvent(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [eventCountdown]);

  // Helper to generate dynamic, lesson-specific preset values and explanations
  const getPresetTelemetry = (type, lesson, currentConfig) => {
    const t = lesson?.title?.toLowerCase() || "";
    const id = lesson?.id || "";
    
    let v1 = currentConfig.default;
    let v2 = currentConfig.secondaryDefault !== undefined ? currentConfig.secondaryDefault : 50;
    let explanation = "";

    if (type === "crisis") {
      // Crash '08
      if (t.includes("rule of 72") || id === "l23") {
        v1 = 4; // minimum rate
        explanation = "Fed cuts rates: Yields plummet to 4%, expanding your doubling period to a stagnant 18 years under the Rule of 72.";
      } else if (id === "l24" || t.includes("mutual fund") || t.includes("pool")) {
        v1 = 50; // low pool size
        explanation = "Market Panic Selloff: Panic spreads, causing retail investor redemptions. The pool shrinks to 50 people, collapsing the fund's asset purchasing power.";
      } else if (t.includes("compound") || t.includes("sip") || id === "l2" || id === "l26") {
        v1 = 1; // minimum years
        v2 = 5; // minimum yield
        explanation = "Market collapse: Portfolio annual yields drop to a low 5% under recession panic.";
      } else if (t.includes("inflation") || id === "l11" || id === "l74") {
        v1 = 1; // low inflation
        explanation = "Deflationary freeze: Consumer demand collapses, pushing price inflation down to a stagnant 1%.";
      } else if (t.includes("allocat") || t.includes("diversif") || t.includes("rebalanc")) {
        v1 = 30; // low equity
        explanation = "Black Swan Selloff: Stock values crash, forcing your equity exposure down to an unsafe 30%.";
      } else {
        v1 = currentConfig.min;
        v2 = currentConfig.secondaryMin !== undefined ? currentConfig.secondaryMin : 0;
        explanation = "Crisis Preset: System inputs adjusted to represent extreme recessionary and low-liquidity parameters.";
      }
    } else if (type === "stagflation") {
      // Stagflation '70
      if (t.includes("rule of 72") || id === "l23") {
        v1 = 16; // high rate
        explanation = "Nominal rate spike: Yields rise to 16% (4.5 years double), but real purchasing power is severely eroded by high inflation.";
      } else if (id === "l24" || t.includes("mutual fund") || t.includes("pool")) {
        v1 = 300; // stalled pool size
        explanation = "High Inflation Stagnation: Stagnant returns discourage new investors. The pool hovers at 300 people, limiting the fund's diversification capacity.";
      } else if (t.includes("compound") || t.includes("sip") || id === "l2" || id === "l26") {
        v1 = 10;
        v2 = 18; // high rates
        explanation = "High inflation yields: Yields spike to 18% p.a., but cash flows must be optimized against high CPI indexes.";
      } else if (t.includes("inflation") || id === "l11" || id === "l74") {
        v1 = 15; // sky high inflation
        explanation = "Oil supply shock: Core inflation spikes to 15%, causing severe wealth decay for uninvested cash.";
      } else if (t.includes("allocat") || t.includes("diversif") || t.includes("rebalanc")) {
        v1 = 50; // balanced but drifting
        explanation = "Structural imbalance: Inflation drifts assets, requiring a strict 50/50 rebalancing check.";
      } else {
        v1 = currentConfig.max * 0.85;
        v2 = (currentConfig.secondaryMax !== undefined ? currentConfig.secondaryMax : 100) * 0.8;
        explanation = "Stagflation Preset: Simulates stagnant economic output coupled with high price index inflation.";
      }
    } else if (type === "easy") {
      // Easy Money '20
      if (t.includes("rule of 72") || id === "l23") {
        v1 = 12; // target rate
        explanation = "Easy money bubble: Returns optimize at 12%, achieving an aggressive 6-year doubling cycle.";
      } else if (id === "l24" || t.includes("mutual fund") || t.includes("pool")) {
        v1 = 1500; // high pool size
        explanation = "Bull Market FOMO: Low interest rates drive massive retail deposits. The pool expands to 1500 people, unlocking optimal bluechip fractional diversification.";
      } else if (t.includes("compound") || t.includes("sip") || id === "l2" || id === "l26") {
        v1 = 15;
        v2 = 12;
        explanation = "Easy liquidity: Interest rates stabilize at a healthy 12% over a 15-year growth horizon.";
      } else if (t.includes("inflation") || id === "l11" || id === "l74") {
        v1 = 4; // moderate target inflation
        explanation = "Controlled expansion: Inflation remains in the sweet spot of 4%, supporting corporate growth.";
      } else if (t.includes("allocat") || t.includes("diversif") || t.includes("rebalanc")) {
        v1 = 70; // aggressive optimal equity
        explanation = "Bull market expansion: Loose cash encourages an aggressive, high-growth 70%+ equity allocation.";
      } else {
        v1 = currentConfig.default;
        v2 = currentConfig.secondaryDefault !== undefined ? currentConfig.secondaryDefault : 50;
        explanation = "Easy Money Preset: Simulates cheap monetary expansion and target market growth rates.";
      }
    }

    // Ensure bounds
    v1 = Math.max(currentConfig.min, Math.min(currentConfig.max, v1));
    if (currentConfig.secondaryMin !== undefined) {
      v2 = Math.max(currentConfig.secondaryMin, Math.min(currentConfig.secondaryMax, v2));
    }

    return { v1, v2, explanation };
  };

  // Historical simulator presets relative to current lesson boundaries
  const handleApplyPreset = (type) => {
    if (!config) return;
    const { v1, v2, explanation } = getPresetTelemetry(type, activeLesson, config);

    setMicroscopeValue(v1);
    setMicroscopeSecondaryValue(v2);
    updateHistoryBuffer(v1, v2);
    checkGoal(v1, v2);
    
    if (type === "crisis") {
      toast.warning(`Preset: 2008 Market Crash - ${explanation}`, { id: "preset-toast" });
    } else if (type === "stagflation") {
      toast.warning(`Preset: 1970s Stagflation - ${explanation}`, { id: "preset-toast" });
    } else if (type === "easy") {
      toast.success(`Preset: 2020 Easy Money - ${explanation}`, { id: "preset-toast" });
    }

    addConsoleLog(`PRESET: Loaded "${type.toUpperCase()}" macroeconomic stress factors. ${explanation}`);
  };

  // Reactive bottom ticker news text generator
  const getNewsTickerText = () => {
    if (!config) return "MARKET REPORT: NIFTY index trades volatile; gold maintains key resistance; RBI monitors yield curve.";
    const v1 = microscopeValue;
    const v2 = microscopeSecondaryValue;
    const t = activeLesson.title.toLowerCase();

    if (t.includes("defi") || t.includes("blockchain")) {
      return v1 < 60
        ? `🚨 DeFi consensus alarm: Node count drops to ${v1}. Vulnerability rate spikes on smart contracts.`
        : `⚡ DeFi Network secure: Consensus verified across ${v1} independent validators. Gas rates down 20%.`;
    }
    if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
      return v1 > 9
        ? `🔥 CPI spike: Consumer basket inflation clocks ${v1}%. Financial savings yield turns negative.`
        : `📈 Macro update: Core retail CPI drops to safe ${v1}%. Fixed income instruments gain popularity.`;
    }
    if (t.includes("gold") || t.includes("sgb")) {
      return v1 >= 8
        ? `🏆 SGB Tax Exemption: Gold bond hits ${v1}-year maturity status. Capital gains tax waived for redemption.`
        : `⏳ SGB update: Duration adjusted to ${v1} years. 8 years required for full tax shelter exemption.`;
    }
    if (t.includes("alpha") || t.includes("beta")) {
      return v2 > 1.3
        ? `⚠️ Volatility alert: Portfolio beta climbs to ${v2}. Mutual funds vulnerable to index corrections.`
        : `📊 Alpha report: active fund records positive ${v1}% alpha outperformance against the index.`;
    }
    if (t.includes("greeks") || t.includes("theta")) {
      return v1 < 10
        ? `📉 Options Expiry Alert: theta decay accelerating rapidly with only ${v1} days remaining.`
        : `⏳ Time decay buffer: Option premium decay stable at ${v1} days until contract settlement.`;
    }
    return `MARKET RADAR: Variable 1 = ${v1} ${config.units || ""}, Variable 2 = ${v2} ${config.secondaryUnits || ""}.`;
  };

  // Dynamic SVG simulator paths generator
  const getSvgCurvePath = () => {
    if (!config) return "";
    const points = [];
    const steps = 30;
    const t = activeLesson.title.toLowerCase();

    if (t.includes("defi") || t.includes("blockchain")) {
      // Blockchain network wave
      for (let i = 0; i <= steps; i++) {
        const x = 20 + (i / steps) * 200;
        const y = 60 + Math.sin(i * 0.5 + (microscopeValue / 8)) * (25 * (microscopeValue / 80));
        points.push(`${x},${y}`);
      }
      return `M ${points.join(" L ")}`;
    }
    if (t.includes("wpi") || t.includes("cpi") || t.includes("inflation")) {
      // Inflation purchasing power decay
      for (let i = 0; i <= steps; i++) {
        const x = 20 + (i / steps) * 200;
        const decay = Math.pow(1 - (microscopeValue / 180), i / 1.5);
        const y = 20 + 80 * (1 - decay);
        points.push(`${x},${y}`);
      }
      return `M ${points.join(" L ")}`;
    }
    if (t.includes("alpha") || t.includes("beta")) {
      // Risk return coordinate line
      const alphaVal = microscopeValue;
      const betaVal = microscopeSecondaryValue;
      const offset = (alphaVal / 10) * 12;
      const slope = betaVal / 1.6;
      for (let i = 0; i <= steps; i++) {
        const x = 20 + (i / steps) * 200;
        const y = 60 - offset + (i - steps / 2) * 2 * slope;
        points.push(`${x},${Math.max(15, Math.min(105, y))}`);
      }
      return `M ${points.join(" L ")}`;
    }
    if (t.includes("option spread") || t.includes("iron butterfly") || t.includes("hedging")) {
      // Classic profit/loss butterfly wings
      const center = 120;
      const width = 45 + microscopeSecondaryValue * 0.45;
      const peak = 35 + microscopeValue * 0.25;
      return `M 20 95 L ${center - width} 95 L ${center} ${peak} L ${center + width} 95 L 220 95`;
    }
    if (t.includes("greeks") || t.includes("theta")) {
      // Greeks theta decay curve
      for (let i = 0; i <= steps; i++) {
        const x = 20 + (i / steps) * 200;
        const days = Math.max(1, microscopeValue);
        const y = 30 + 75 * Math.pow(i / steps, days / 8);
        points.push(`${x},${y}`);
      }
      return `M ${points.join(" L ")}`;
    }
    // Compounding growth curve default
    for (let i = 0; i <= steps; i++) {
      const x = 20 + (i / steps) * 200;
      const rate = 1 + (microscopeValue / 110);
      const y = 100 - 12 * Math.pow(rate, (i / steps) * 7.5);
      points.push(`${x},${Math.max(15, y)}`);
    }
    return `M ${points.join(" L ")}`;
  };

  // AI Tutor submit question
  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsSendingChat(true);

    // Evaluate debate input for scoring
    const evalResult = evaluateDebateInput(userMsg);
    setDebateScore(evalResult.score);
    setDebateFeedback(evalResult.feedback);
    addConsoleLog(`Debated AI Tutor. Response Score: ${evalResult.score}/10`);

    try {
      const res = await api.post("/learn/chat", {
        message: `Topic: "${activeLesson.title}". Context: ${getDynamicLessonContent(activeLesson, audioLang).concept}. Question: ${userMsg}`,
        lang: audioLang,
        history: chatMessages.slice(-6)
      });
      if (res.data && res.data.reply) {
        setChatMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
        if (voiceDebateEnabled) {
          speakText(res.data.reply);
        }
      }
    } catch (err) {
      const fallbackMsg = "Apologies, I encountered a connection delay. Let me explain: this concept revolves around optimizing interest compounding and risk control structures.";
      setChatMessages(prev => [...prev, { role: "assistant", content: fallbackMsg }]);
      if (voiceDebateEnabled) {
        speakText(fallbackMsg);
      }
    }
    setIsSendingChat(false);
  };

  // Auto-scroll chat window
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Check if user is already near the bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 150;
    const lastMsg = chatMessages[chatMessages.length - 1];

    // Auto-scroll only if user just sent a message (unconditional), or is near the bottom
    if (lastMsg?.role === "user" || isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages]);

  const [activeLessonContent, setActiveLessonContent] = useState(() => getDynamicLessonContent(activeLesson, audioLang));

  useEffect(() => {
    let active = true;
    setActiveLessonContent(getDynamicLessonContent(activeLesson, audioLang));

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

  const isGoalSatisfied = config?.goalCheck(microscopeValue, config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined);
  const stageStyles = config?.getStageStyles(microscopeValue, config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined) || [];
  const verdictText = config?.getVerdict(microscopeValue, config.secondaryKnobLabel !== undefined ? microscopeSecondaryValue : undefined, audioLang);

  // helper helper for string template escape issues
  const vecStyle = (x) => x;

  const renderCompoundingEngine = (params, value, secValue) => {
    const { variant = 'sip', accentColor = '#10b981', label = 'Compounding' } = params;
    const rate = secValue !== undefined ? secValue : 12;
    const years = value;

    if (variant === 'sip' || variant === 'compound') {
      const isCompound = variant === 'compound';

      // Compounding frequency mapping
      const getFrequencyDetails = (val) => {
        if (val === 1) return { n: 1, name: 'Annual' };
        if (val === 2) return { n: 2, name: 'Semi-Annual' };
        if (val === 3) return { n: 4, name: 'Quarterly' };
        if (val === 4) return { n: 12, name: 'Monthly' };
        return { n: 1, name: 'Annual' };
      };

      const freq = getFrequencyDetails(value);
      const n = isCompound ? freq.n : 1;

      // Define active year: prioritizes hover over auto-animation or slider
      const activeYear = chartHoveredYear !== null 
        ? chartHoveredYear 
        : (isCompound ? compoundAnimYear : years);

      const activeOpacity = chartHoveredYear !== null ? 1 : (isCompound ? compoundAnimOpacity : 1);

      const maxVal = isCompound 
        ? 10000 * Math.pow(1 + rate / 1200, 12 * 30) // max compounded value at monthly compounding over 30 years
        : 10000 * Math.pow(1 + rate / 100, 30);       // max compounded value for SIP/Lump sum compounding over 30 years

      const currentCompoundVal = isCompound
        ? 10000 * Math.pow(1 + rate / (100 * n), n * activeYear)
        : 10000 * Math.pow(1 + rate / 100, activeYear);

      const currentSimpleVal = 10000 * (1 + (rate / 100) * activeYear);

      const currentX = 35 + (activeYear / 30) * 150; // X ranges from 35 to 185
      const currentCompoundY = 105 - (currentCompoundVal / maxVal) * 80; // Y baseline is 105, max height Y=25
      const currentSimpleY = 105 - (currentSimpleVal / maxVal) * 80;

      // Calculate simple interest curve points
      const simplePoints = [];
      for (let i = 0; i <= 10; i++) {
        const yearVal = (i / 10) * 30;
        const x = 35 + (yearVal / 30) * 150;
        const simpleVal = 10000 * (1 + (rate/100) * yearVal);
        const y = 105 - (simpleVal / maxVal) * 80;
        simplePoints.push(`${x},${y}`);
      }
      const simplePath = `M 35 ${105 - (10000 / maxVal) * 80} L ${simplePoints.join(' L ')}`;

      // Calculate compound growth curve points
      const compoundPoints = [];
      for (let i = 0; i <= 15; i++) {
        const yearVal = (i / 15) * 30;
        const x = 35 + (yearVal / 30) * 150;
        const compVal = isCompound
          ? 10000 * Math.pow(1 + rate / (100 * n), n * yearVal)
          : 10000 * Math.pow(1 + rate / 100, yearVal);
        const y = 105 - (compVal / maxVal) * 80;
        compoundPoints.push(`${x},${y}`);
      }
      const curvePath = `M 35 ${105 - (10000 / maxVal) * 80} L ${compoundPoints.join(' L ')}`;
      const fillPath = `${curvePath} L 185 105 Z`;

      // Helper for background curves (for frequency comparison)
      const getCompoundCurvePath = (nFreq) => {
        const pts = [];
        for (let i = 0; i <= 15; i++) {
          const yearVal = (i / 15) * 30;
          const x = 35 + (yearVal / 30) * 150;
          const compVal = 10000 * Math.pow(1 + rate / (100 * nFreq), nFreq * yearVal);
          const y = 105 - (compVal / maxVal) * 80;
          pts.push(`${x},${y}`);
        }
        return `M 35 ${105 - (10000 / maxVal) * 80} L ${pts.join(' L ')}`;
      };

      // Particle trail behind the climbing Orb
      const trailCount = 3;
      const trailElements = [];
      for (let i = 1; i <= trailCount; i++) {
        const trailYear = activeYear - i * 0.8;
        if (trailYear >= 0) {
          const tx = 35 + (trailYear / 30) * 150;
          const tVal = isCompound
            ? 10000 * Math.pow(1 + rate / (100 * n), n * trailYear)
            : 10000 * Math.pow(1 + rate / 100, trailYear);
          const ty = 105 - (tVal / maxVal) * 80;
          trailElements.push(
            <circle 
              key={`trail-${i}`}
              cx={tx} 
              cy={ty} 
              r={2.2 - i * 0.5} 
              fill={accentColor} 
              opacity={(0.6 - i * 0.15) * activeOpacity} 
              filter="url(#neonGlow)"
              className="pointer-events-none"
              style={{ transition: 'opacity 0.2s ease' }}
            />
          );
        }
      }

      // HUD Tooltip coordinates
      const gainPct = Math.round((currentCompoundVal - 10000) / 10000 * 100);
      const tooltipWidth = 84;
      const tooltipHeight = 32;
      const tooltipX = currentX < 110 ? currentX + 12 : currentX - tooltipWidth - 12;
      const tooltipY = Math.min(80, Math.max(10, currentCompoundY - tooltipHeight / 2));

      // Overlap prevention for compounding bonus text
      const bonusTextX = currentX < 110 ? currentX - 6 : currentX + 6;
      const bonusTextAnchor = currentX < 110 ? "end" : "start";

      const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const pct = clientX / rect.width;
        const viewX = pct * 220;
        let year = ((viewX - 35) / 150) * 30;
        if (year < 0) year = 0;
        if (year > 30) year = 30;
        setChartHoveredYear(year);
      };

      const handleMouseLeave = () => {
        setChartHoveredYear(null);
      };

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          {/* root-pulse is now defined in LabAnimations.css */}
          
          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Compounding Ecosystem Lab • {label}
          </div>

          {/* Unified Compounding Interactive SVG */}
          <div className="relative self-center flex items-center justify-center h-48 w-full z-10 mt-2">
            <svg 
              className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] cursor-crosshair" 
              viewBox="0 0 220 120"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 1. Background Grid (Low Opacity) */}
              <g opacity="0.15" className="pointer-events-none">
                <line x1="35" y1="25" x2="185" y2="25" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="35" y1="45" x2="185" y2="45" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="35" y1="65" x2="185" y2="65" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="35" y1="85" x2="185" y2="85" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="35" y1="105" x2="185" y2="105" stroke="#ffffff" strokeWidth="0.75" />
                
                <line x1="35" y1="25" x2="35" y2="105" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="85" y1="25" x2="85" y2="105" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="135" y1="25" x2="135" y2="105" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="185" y1="25" x2="185" y2="105" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2,2" />
              </g>

              {/* 2. Grid Labels */}
              <g opacity="0.4" className="font-mono text-[4.5px] fill-slate-400 select-none pointer-events-none">
                <text x="35" y="113" textAnchor="middle">0Y</text>
                <text x="85" y="113" textAnchor="middle">10Y</text>
                <text x="135" y="113" textAnchor="middle">20Y</text>
                <text x="185" y="113" textAnchor="middle">30Y</text>

                <text x="31" y="106" textAnchor="end">₹10k</text>
                <text x="31" y="27" textAnchor="end">Max</text>
              </g>

              {/* 3. Background Reference Curves (only for Compounding Frequency page to show options stack) */}
              {isCompound && (
                <g opacity="0.08" strokeWidth="0.5" fill="none" className="pointer-events-none">
                  <path d={getCompoundCurvePath(1)} stroke={accentColor} strokeDasharray="2,2" />
                  <path d={getCompoundCurvePath(2)} stroke={accentColor} strokeDasharray="2,2" />
                  <path d={getCompoundCurvePath(4)} stroke={accentColor} strokeDasharray="2,2" />
                  <path d={getCompoundCurvePath(12)} stroke={accentColor} strokeDasharray="2,2" />
                </g>
              )}

              {/* 4. Simple Interest Path (Flat growth line) */}
              <path d={simplePath} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" className="transition-all duration-300 pointer-events-none" />
              <text x="188" y={105 - ( (10000 * (1 + (rate/100) * 30)) / maxVal ) * 80 + 2} className="font-mono text-[4px] fill-rose-400/80 font-bold pointer-events-none" opacity="0.7">Simple Interest</text>

              {/* 5. Active Compound Interest Curve (Exponential growth curve) */}
              <path d={fillPath} fill="url(#compGrad)" className="transition-all duration-300 pointer-events-none" />
              <path d={curvePath} fill="none" stroke={accentColor} strokeWidth="2" className="transition-all duration-300 pointer-events-none" filter="url(#neonGlow)" />
              <text x="188" y="27" className="font-mono text-[4px] fill-emerald-400 font-bold pointer-events-none" opacity="0.8">Compounded</text>

              {/* 6. Projection guidelines for active years value */}
              <g opacity={0.3 * activeOpacity} className="pointer-events-none" style={{ transition: 'opacity 0.2s ease' }}>
                <line x1={currentX} y1={currentCompoundY} x2={currentX} y2="105" stroke={accentColor} strokeWidth="0.5" strokeDasharray="1,1" />
                <line x1={currentX} y1={currentCompoundY} x2="35" y2={currentCompoundY} stroke={accentColor} strokeWidth="0.5" strokeDasharray="1,1" />
              </g>

              {/* 7. Compounding Bonus bracket indicator */}
              {activeYear >= 1 && (
                <g className="pointer-events-none" opacity={activeOpacity} style={{ transition: 'opacity 0.2s ease' }}>
                  <line x1={currentX} y1={currentSimpleY} x2={currentX} y2={currentCompoundY} stroke="#f43f5e" strokeWidth="1.2" />
                  <circle cx={currentX} cy={currentSimpleY} r="1.5" fill="#f43f5e" />
                  <circle cx={currentX} cy={currentCompoundY} r="1.5" fill="#10b981" />
                  <text 
                    x={bonusTextX} 
                    y={(currentSimpleY + currentCompoundY)/2 + 1.5} 
                    textAnchor={bonusTextAnchor} 
                    className="font-mono text-[4.5px] fill-rose-400 font-extrabold select-none"
                  >
                    Bonus: +₹{Math.round(currentCompoundVal - currentSimpleVal).toLocaleString()}
                  </text>
                </g>
              )}

              {/* 8. Particle Trail */}
              {trailElements}

              {/* 9. Active Portfolio Orb */}
              <g className="transition-all duration-300 pointer-events-none" opacity={activeOpacity} style={{ transition: 'opacity 0.2s ease' }}>
                <circle cx={currentX} cy={currentCompoundY} r={5 + (activeYear/30)*4} fill={accentColor} opacity="0.25" filter="url(#neonGlow)" style={{ transformOrigin: `${currentX}px ${currentCompoundY}px`, animation: 'root-pulse 2s infinite ease-in-out' }} />
                <circle cx={currentX} cy={currentCompoundY} r="2.5" fill="#ffffff" stroke={accentColor} strokeWidth="1.5" />
              </g>

              {/* 10. Connection line between Orb and Tooltip */}
              <line 
                x1={currentX} 
                y1={currentCompoundY} 
                x2={currentX < 110 ? currentX + 12 : currentX - 12} 
                y2={tooltipY + tooltipHeight / 2} 
                stroke={accentColor} 
                strokeWidth="0.5" 
                strokeDasharray="1,1" 
                opacity={0.4 * activeOpacity} 
                className="pointer-events-none"
                style={{ transition: 'opacity 0.2s ease' }}
              />

              {/* 11. Dynamic floating HUD telemetry tooltip */}
              <g transform={`translate(${tooltipX}, ${tooltipY})`} className="pointer-events-none" opacity={activeOpacity} style={{ transition: 'opacity 0.2s ease' }}>
                {/* Tooltip Background Card */}
                <rect width={tooltipWidth} height={tooltipHeight} rx="5" fill="#020617" stroke={accentColor} strokeWidth="0.75" opacity="0.95" />
                {/* Tech corner accents */}
                <line x1="0" y1="3" x2="3" y2="0" stroke={accentColor} strokeWidth="1" />
                <line x1={tooltipWidth} y1={tooltipHeight - 3} x2={tooltipWidth - 3} y2={tooltipHeight} stroke={accentColor} strokeWidth="1" />
                
                {/* Title */}
                <text x="5" y="7" className="font-mono text-[3.5px] font-black uppercase tracking-wider" style={{ fill: accentColor }}>
                  {isCompound ? "Compounding Telemetry" : "SIP Compound Engine"}
                </text>
                
                {/* Formula/Frequency descriptor */}
                <text x={tooltipWidth - 5} y="7" textAnchor="end" className="font-mono text-[3px] fill-slate-500 font-bold">
                  {isCompound ? `n=${n} (Freq)` : "Lump Sum"}
                </text>
                
                {/* Large Value */}
                <text x="5" y="18" className="font-mono text-[7px] fill-white font-extrabold">
                  ₹{Math.round(currentCompoundVal).toLocaleString()}
                </text>
                
                {/* Math Params */}
                <text x="5" y="24" className="font-mono text-[3.5px] fill-slate-400">
                  Yr: {activeYear.toFixed(1)} | Yield: {rate}%
                </text>
                
                {/* Gain Pill */}
                <text x="5" y="29" className="font-mono text-[3.5px] fill-cyan-400 font-bold">
                  Growth: +{gainPct}% (Ref: +{Math.round((currentSimpleVal - 10000)/10000 * 100)}% Simple)
                </text>
              </g>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 px-1 select-none">
            {isCompound ? (
              <>
                <span>Horizon: <strong style={{ color: accentColor }}>30 Years</strong></span>
                <span>Yield: <strong className="text-cyan-400">{rate}% CAGR</strong></span>
                <span>Freq: <strong className="text-violet-400">{freq.name}</strong></span>
              </>
            ) : (
              <>
                <span>Horizon: <strong style={{ color: accentColor }}>{years} Years</strong></span>
                <span>Yield: <strong className="text-cyan-400">{rate}% CAGR</strong></span>
                <span>Type: <strong className="text-violet-400">Lump Sum</strong></span>
              </>
            )}
          </div>
        </div>
      );
    }

    if (variant === 'fd_rd') {
      const fdInvested = 10000;
      const rdMonthly = 10000 / (years * 12 || 12);
      const fdFV = fdInvested * Math.pow(1 + rate/100, years);
      let rdFV = 0;
      for(let m=0; m < years * 12; m++) {
        rdFV += rdMonthly * Math.pow(1 + rate/1200, (years * 12 - m));
      }
      const maxVal = Math.max(fdFV, rdFV, 15000);
      const fdFill = Math.max(4, (fdFV / maxVal) * 100);
      const rdFill = Math.max(4, (rdFV / maxVal) * 100);
      const fdWins = fdFV >= rdFV;

      // Bubble config (3 bubbles per cylinder, staggered)
      const bubblesFD = [{ d: '0.3s', l: '25%' }, { d: '0.9s', l: '55%' }, { d: '1.5s', l: '70%' }];
      const bubblesRD = [{ d: '0.1s', l: '30%' }, { d: '0.7s', l: '60%' }, { d: '1.2s', l: '45%' }];

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            FD vs RD Liquid Cylinders • {label}
          </div>

          <div className="flex-1 flex justify-around items-end pb-2 pt-6 gap-4">
            {/* FD Cylinder */}
            <div className="flex flex-col items-center flex-1">
              <div className="relative w-16 h-32 rounded-2xl overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.07)] bg-slate-950">
                {/* Glass highlight */}
                <div className="absolute inset-0 pointer-events-none z-20" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)' }} />

                {/* Liquid fill with animated wave surface */}
                <div
                  className="absolute bottom-0 w-full transition-all duration-700 ease-out"
                  style={{ height: `${fdFill}%` }}
                >
                  {/* Wave meniscus on top */}
                  <div
                    className="absolute -top-1 left-0 right-0 h-3"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.5) 0%, transparent 70%)',
                      animation: 'lab-meniscus 2.2s ease-in-out infinite'
                    }}
                  />
                  {/* Main liquid body */}
                  <div className="w-full h-full bg-gradient-to-t from-emerald-700 via-teal-500/90 to-cyan-400/80" />
                  {/* Bubble particles */}
                  {bubblesFD.map((b, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white/30"
                      style={{
                        width: '4px', height: '4px',
                        left: b.l, bottom: '8px',
                        animation: `lab-bubble-rise 1.8s ease-out ${b.d} infinite`
                      }}
                    />
                  ))}
                </div>

                {/* Label overlay */}
                <div className="absolute inset-0 flex items-center justify-center flex-col text-white font-mono z-10 select-none">
                  <span className="text-[7px] text-slate-300 uppercase font-black tracking-wider drop-shadow">LUMP FD</span>
                  <span className="text-[11px] font-black mt-0.5 drop-shadow-lg">₹{Math.round(fdFV/1000)}k</span>
                  {fdWins && <span className="text-[6px] text-emerald-300 font-bold mt-0.5">WINNER ↑</span>}
                </div>

                {/* Winning glow border */}
                {fdWins && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: '0 0 14px rgba(52,211,153,0.5), inset 0 0 8px rgba(52,211,153,0.15)' }} />
                )}
              </div>
              <span className="text-[8.5px] font-mono text-slate-400 mt-2 font-bold">Fixed Deposit</span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1 pb-8 select-none">
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              <span className="text-[8px] text-slate-600 font-black font-mono">VS</span>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>

            {/* RD Cylinder */}
            <div className="flex flex-col items-center flex-1">
              <div className="relative w-16 h-32 rounded-2xl overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.6),0_0_0_2px_rgba(255,255,255,0.07)] bg-slate-950">
                {/* Glass highlight */}
                <div className="absolute inset-0 pointer-events-none z-20" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)' }} />

                {/* Liquid fill */}
                <div
                  className="absolute bottom-0 w-full transition-all duration-700 ease-out"
                  style={{ height: `${rdFill}%` }}
                >
                  {/* Wave meniscus */}
                  <div
                    className="absolute -top-1 left-0 right-0 h-3"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.5) 0%, transparent 70%)',
                      animation: 'lab-meniscus 2.7s ease-in-out 0.5s infinite'
                    }}
                  />
                  {/* Main liquid body */}
                  <div className="w-full h-full bg-gradient-to-t from-amber-700 via-orange-500/90 to-yellow-400/80" />
                  {/* Bubble particles */}
                  {bubblesRD.map((b, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white/30"
                      style={{
                        width: '3px', height: '3px',
                        left: b.l, bottom: '6px',
                        animation: `lab-bubble-rise 2s ease-out ${b.d} infinite`
                      }}
                    />
                  ))}
                </div>

                {/* Label overlay */}
                <div className="absolute inset-0 flex items-center justify-center flex-col text-white font-mono z-10 select-none">
                  <span className="text-[7px] text-slate-300 uppercase font-black tracking-wider drop-shadow">REC RD</span>
                  <span className="text-[11px] font-black mt-0.5 drop-shadow-lg">₹{Math.round(rdFV/1000)}k</span>
                  {!fdWins && <span className="text-[6px] text-amber-300 font-bold mt-0.5">WINNER ↑</span>}
                </div>

                {/* Winning glow border */}
                {!fdWins && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: '0 0 14px rgba(251,191,36,0.5), inset 0 0 8px rgba(251,191,36,0.15)' }} />
                )}
              </div>
              <span className="text-[8.5px] font-mono text-slate-400 mt-2 font-bold">Recurring RD</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Years: <strong className="text-white">{years}</strong></span>
            <span>Rate: <strong style={{ color: accentColor }}>{rate}%</strong></span>
            <span>Δ Edge: <strong className="text-cyan-300">₹{Math.abs(Math.round(fdFV - rdFV)).toLocaleString()}</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'mf') {
      const AUM = value * 5000;
      const AUMText = AUM >= 10000000 ? '₹' + (AUM / 10000000).toFixed(2) + 'Cr' : AUM >= 100000 ? '₹' + (AUM / 100000).toFixed(1) + 'L' : '₹' + (AUM / 1000).toFixed(0) + 'k';
      const coreSpeed = Math.max(2, 20 - value / 100);

      return (
        <div className="relative w-full max-w-sm min-h-[360px] h-auto bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* spin-orbit defined in LabAnimations.css */}
          <div className="absolute top-2.5 left-3.5 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Mutual Fund Pooling • {label}
          </div>
          
          <div className="flex-1 flex items-center justify-center relative mt-2 min-h-[150px]">
            <svg className="w-full h-36" viewBox="0 0 220 150">
              <defs>
                <radialGradient id="aumGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Orbit 1 (Inner) */}
              <circle cx="110" cy="75" r="35" className="fill-none stroke-cyan-500/10 stroke-1" strokeDasharray="3,3" />
              {/* Orbit 2 (Middle) */}
              {value >= 400 && (
                <circle cx="110" cy="75" r="52" className="fill-none stroke-violet-500/10 stroke-1" strokeDasharray="3,3" />
              )}
              {/* Orbit 3 (Outer) */}
              {value >= 1000 && (
                <circle cx="110" cy="75" r="70" className="fill-none stroke-emerald-500/10 stroke-1" strokeDasharray="3,3" />
              )}

              {/* Glowing AUM Core Backplate */}
              <circle cx="110" cy="75" r={22 + Math.min(8, value / 250)} fill="url(#aumGlow)" className="animate-pulse" />
              
              {/* AUM Core Node */}
              <circle cx="110" cy="75" r={18 + Math.min(6, value / 300)} className="fill-slate-950 stroke-2" style={{ stroke: accentColor, filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))' }} />
              <text x="110" y="71" fontSize="6.5" className="font-mono font-black fill-cyan-400" textAnchor="middle">AUM</text>
              <text x="110" y="81" fontSize="8" className="font-mono font-black fill-white" textAnchor="middle">{AUMText}</text>

              {/* Group 1: Inner Orbit (Core bluechips, always active) */}
              <g style={{ animation: `spin-orbit ${coreSpeed}s linear infinite`, transformOrigin: '110px 75px' }}>
                {/* Node 1: REL */}
                <circle cx="145" cy="75" r="4" className="fill-cyan-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #22d3ee)' }} />
                <text x="145" y="68" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">REL</text>

                {/* Node 2: HDF */}
                <circle cx="75" cy="75" r="4" className="fill-cyan-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #22d3ee)' }} />
                <text x="75" y="85" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">HDF</text>

                {/* Node 3: ITC */}
                <circle cx="110" cy="110" r="4" className="fill-cyan-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #22d3ee)' }} />
                <text x="110" y="118" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">ITC</text>

                {/* Node 4: SBI */}
                <circle cx="110" cy="40" r="4" className="fill-cyan-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #22d3ee)' }} />
                <text x="110" y="34" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">SBI</text>
              </g>

              {/* Group 2: Middle Orbit (Midcaps, unlocked at 400+ investors) */}
              {value >= 400 && (
                <g style={{ animation: `spin-orbit ${coreSpeed * 1.5}s linear infinite reverse`, transformOrigin: '110px 75px' }}>
                  {/* Node 5: TCS */}
                  <circle cx="147" cy="112" r="3.5" className="fill-violet-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #a78bfa)' }} />
                  <text x="156" y="115" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">TCS</text>

                  {/* Node 6: INF */}
                  <circle cx="73" cy="112" r="3.5" className="fill-violet-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #a78bfa)' }} />
                  <text x="64" y="115" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">INF</text>

                  {/* Node 7: TAT */}
                  <circle cx="73" cy="38" r="3.5" className="fill-violet-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #a78bfa)' }} />
                  <text x="64" y="34" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">TAT</text>

                  {/* Node 8: LNT */}
                  <circle cx="147" cy="38" r="3.5" className="fill-violet-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #a78bfa)' }} />
                  <text x="156" y="34" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">LNT</text>
                </g>
              )}

              {/* Group 3: Outer Orbit (Index outliers, unlocked at 1000+ investors) */}
              {value >= 1000 && (
                <g style={{ animation: `spin-orbit ${coreSpeed * 2.2}s linear infinite`, transformOrigin: '110px 75px' }}>
                  {/* Node 9: MRF */}
                  <circle cx="171" cy="110" r="3" className="fill-emerald-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #34d399)' }} />
                  <text x="180" y="113" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">MRF</text>

                  {/* Node 10: HL */}
                  <circle cx="75" cy="136" r="3" className="fill-emerald-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #34d399)' }} />
                  <text x="75" y="144" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">HL</text>

                  {/* Node 11: NIP */}
                  <circle cx="49" cy="40" r="3" className="fill-emerald-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #34d399)' }} />
                  <text x="40" y="42" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">NIP</text>

                  {/* Node 12: ICI */}
                  <circle cx="145" cy="14" r="3" className="fill-emerald-400 stroke-slate-950 stroke-[0.5]" style={{ filter: 'drop-shadow(0 0 3px #34d399)' }} />
                  <text x="145" y="8" fontSize="5.5" className="fill-slate-400 font-mono font-bold" textAnchor="middle">ICI</text>
                </g>
              )}
            </svg>
          </div>

          {/* Real-Time Glassmorphic Pooling Telemetry Ledger */}
          <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-2.5 space-y-1.5 shadow-xl text-left mt-2">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">📊 POOLING TELEMETRY LEDGER</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              {/* Left Column: Fund Metrics */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-1.5 space-y-1 shadow-inner">
                <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">Fund Metrics</div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Pool:</span>
                  <span className="text-white font-bold">{value} People</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total AUM:</span>
                  <span className="text-cyan-400 font-bold">{AUMText}</span>
                </div>
              </div>
              
              {/* Right Column: Diversification */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-1.5 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">Diversification</div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-slate-400">Assets:</span>
                    <span className="text-emerald-400 font-bold">{value >= 1000 ? "12 Stocks" : value >= 400 ? "8 Stocks" : "4 Stocks"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-1 mt-1">
                  <span className="text-slate-400 font-medium">Risk Level:</span>
                  <span className={value >= 1000 ? "text-emerald-400 font-extrabold" : value >= 400 ? "text-amber-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                    {value >= 1000 ? "Low (5%)" : value >= 400 ? "Medium (45%)" : "High (90%)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Explanation Alert */}
          <div className="w-full bg-cyan-500/5 border border-cyan-500/10 px-2.5 py-1.5 rounded-xl text-[8.5px] text-cyan-300/95 leading-normal mt-2 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)] flex items-start gap-1.5">
            <span className="shrink-0 text-cyan-400">💡</span>
            <p className="font-sans">
              {value >= 1000 ? (
                <span><strong>optimal diversification unlocked!</strong> With 1000+ investors pooling capital, the fund has sufficient AUM (<strong>{AUMText}</strong>) to purchase fractional shares across all 12 bluechip index stocks, reducing single-asset collapse risks to near zero.</span>
              ) : value >= 400 ? (
                <span><strong>Moderate diversification.</strong> With {value} investors, the fund manager can only buy 8 index stocks. Expense ratios are moderate but high-yield outliers are missed.</span>
              ) : (
                <span><strong>High Concentration Risk!</strong> With only {value} investors, the fund's capital is too small to buy expensive bluechip shares fractionally. Portfolio is concentrated in just 4 stocks, leaving you vulnerable to individual company failures.</span>
              )}
            </p>
          </div>
          
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 mt-2">
            <span>Pool Size: <strong className="text-white">{value} People</strong></span>
            <span>AUM: <strong style={{ color: accentColor }}>{AUMText}</strong></span>
            <span>Status: <strong className="text-cyan-400">{value >= 1000 ? "Optimal Basket" : "Sourcing Pool"}</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'rule72' || variant === 'rule114' || variant === 'rule144') {
      const divisor = variant === 'rule72' ? 72 : variant === 'rule114' ? 114 : 144;
      const targetMultiple = variant === 'rule72' ? 2 : variant === 'rule114' ? 3 : 4;
      const factorName = variant === 'rule72' ? 'Double' : variant === 'rule114' ? 'Triple' : 'Quadruple';
      const returnRate = Math.max(1, value);
      const yearsToTarget = parseFloat((divisor / returnRate).toFixed(1));
      const rotation = Math.max(0, Math.min(270, ((returnRate - 1) / 23) * 270));

      // Educational: Show the money-doubling timeline as expanding coin piles
      // Each pile represents the money at 0, yearsToTarget, 2×yearsToTarget intervals
      const pile0 = 10000;
      const pile1 = pile0 * targetMultiple;
      const pile2 = pile0 * targetMultiple * targetMultiple;
      const maxPile = pile2;
      const bar0H = Math.max(6, (pile0 / maxPile) * 52);
      const bar1H = Math.max(10, (pile1 / maxPile) * 52);
      const bar2H = 52;

      // Coin stack count (visual)
      const coins0 = 1;
      const coins1 = targetMultiple;
      const coins2 = targetMultiple * targetMultiple;

      // Speed: faster rate → faster orbit
      const orbitSpeed = Math.max(0.5, 8 / returnRate);

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[260px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 30%, ${accentColor}12 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Money {factorName}ing Timeline • Rule of {divisor}
          </div>

          {/* EDUCATIONAL CORE: Three stages of money growth */}
          <div className="flex-1 flex flex-col mt-5">
            {/* Stage timeline bar chart */}
            <div className="flex items-end justify-center gap-3 mt-2" style={{ height: '80px' }}>
              {[{
                label: 'Now', val: pile0, coins: coins0, h: bar0H,
                color: '#64748b', labelColor: '#94a3b8', yr: '0 yrs'
              }, {
                label: `${yearsToTarget}y`, val: pile1, coins: coins1, h: bar1H,
                color: accentColor, labelColor: accentColor, yr: `${yearsToTarget} yrs`
              }, {
                label: `${(yearsToTarget*2).toFixed(0)}y`, val: pile2, coins: coins2, h: bar2H,
                color: '#10b981', labelColor: '#34d399', yr: `${(yearsToTarget*2).toFixed(0)} yrs`
              }].map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  {/* Coin stack visual */}
                  <div className="flex flex-col-reverse items-center gap-0.5">
                    {Array.from({ length: Math.min(stage.coins, 4) }).map((_, ci) => (
                      <div
                        key={ci}
                        className="rounded-full border"
                        style={{
                          width: `${16 + idx * 3}px`,
                          height: '5px',
                          background: `linear-gradient(90deg, ${stage.color}90, ${stage.color}, ${stage.color}80)`,
                          borderColor: `${stage.color}50`,
                          boxShadow: `0 0 4px ${stage.color}40`,
                          animation: `lab-float ${1.5 + ci * 0.3}s ease-in-out ${ci * 0.15}s infinite`
                        }}
                      />
                    ))}
                    {stage.coins > 4 && (
                      <span className="text-[7px] font-black" style={{ color: stage.color }}>×{stage.coins}</span>
                    )}
                  </div>
                  {/* Bar */}
                  <div
                    className="rounded-t-lg transition-all duration-500"
                    style={{
                      width: `${20 + idx * 5}px`,
                      height: `${stage.h}px`,
                      background: `linear-gradient(to top, ${stage.color}40, ${stage.color}90)`,
                      border: `1px solid ${stage.color}30`,
                      boxShadow: `0 0 8px ${stage.color}25`
                    }}
                  />
                  {/* Label */}
                  <span className="text-[7.5px] font-mono font-black" style={{ color: stage.labelColor }}>{stage.yr}</span>
                  <span className="text-[6.5px] font-mono text-slate-500">₹{(stage.val/1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>

            {/* Formula display */}
            <div className="mt-3 flex items-center justify-center gap-2 bg-slate-900/50 border border-white/5 rounded-2xl px-3 py-2">
              <div className="text-center">
                <div className="text-[8px] text-slate-500 font-mono">Formula</div>
                <div className="text-[10px] font-black font-mono" style={{ color: accentColor }}>
                  {divisor} ÷ {returnRate}% = {yearsToTarget} yrs
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              {/* Speed dial mini */}
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 40 40" className="w-12 h-12">
                  <circle cx="20" cy="20" r="16" fill="#020617" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                  <circle cx="20" cy="20" r="13" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3"
                    strokeDasharray="61 100" strokeLinecap="round" transform="rotate(-212 20 20)" />
                  <circle cx="20" cy="20" r="13" fill="none" stroke={accentColor} strokeWidth="3"
                    strokeDasharray={`${(rotation/270)*61} 100`} strokeLinecap="round" transform="rotate(-212 20 20)"
                    className="transition-all duration-500"
                    style={{ filter: `drop-shadow(0 0 3px ${accentColor}80)` }} />
                  {/* Orbiting particle */}
                  <g style={{ animation: `spin-orbit ${orbitSpeed}s linear infinite`, transformOrigin: '20px 20px' }}>
                    <circle cx="20" cy="4" r="1.5" fill={accentColor}
                      style={{ filter: `drop-shadow(0 0 3px ${accentColor})` }} />
                  </g>
                  <text x="20" y="22" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="black" fontFamily="monospace">{returnRate}%</text>
                </svg>
              </div>
            </div>

            {/* Insight message */}
            <div className="mt-2 text-center px-2">
              <p className="text-[8px] text-slate-400 leading-tight">
                At <strong style={{ color: accentColor }}>{returnRate}%</strong> return, ₹10,000 becomes
                <strong className="text-emerald-400"> ₹{(pile1/1000).toFixed(0)}k</strong> in {yearsToTarget} years,
                then <strong className="text-cyan-400">₹{(pile2/1000).toFixed(0)}k</strong> in {(yearsToTarget*2).toFixed(0)} years.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Rate: <strong style={{ color: accentColor }}>{returnRate}%</strong></span>
            <span>Rule {divisor}: <strong className="text-white">{factorName} in {yearsToTarget}y</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'active_passive') {
      const initialAmt = 10000;
      const activeGrowth = initialAmt * Math.pow(1 + (rate - 2)/100, years);
      const passiveGrowth = initialAmt * Math.pow(1 + (rate - 0.2)/100, years);
      const feeDrag = Math.max(0, passiveGrowth - activeGrowth);

      // Generate points for the chart
      const pointsCount = 10;
      const activePoints = [];
      const passivePoints = [];
      
      const maxVal = Math.max(passiveGrowth, 10500);
      const minVal = 10000;
      const valRange = Math.max(500, maxVal - minVal);

      for (let i = 0; i <= pointsCount; i++) {
        const t = (i / pointsCount) * years;
        const actVal = initialAmt * Math.pow(1 + (rate - 2)/100, t);
        const pasVal = initialAmt * Math.pow(1 + (rate - 0.2)/100, t);

        const x = 25 + (i / pointsCount) * 105;
        const yAct = 70 - ((actVal - minVal) / valRange) * 50;
        const yPas = 70 - ((pasVal - minVal) / valRange) * 50;

        activePoints.push({ x, y: yAct });
        passivePoints.push({ x, y: yPas });
      }

      const passivePathD = `M ${passivePoints.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`;
      const activePathD = `M ${activePoints.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`;

      const reversedActivePoints = [...activePoints].reverse();
      const gapPathD = `
        M ${passivePoints[0].x.toFixed(1)} ${passivePoints[0].y.toFixed(1)}
        ${passivePoints.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
        ${reversedActivePoints.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
        Z
      `;

      const lastPassiveY = passivePoints[pointsCount].y;
      const lastActiveY = activePoints[pointsCount].y;

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[280px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          {/* Ambient drag glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 80% 50%, rgba(239,68,68,${Math.min(0.12, feeDrag / passiveGrowth * 0.5)}) 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Active vs Passive Fee Race • {label}
          </div>

          {/* EDUCATIONAL: Side-by-side fund jars showing coins draining */}
          <div className="flex gap-3 mt-6">
            {/* Active Fund - leaking jar */}
            <div className="flex-1 flex flex-col items-center">
              <div className="text-[7px] font-black text-rose-400 uppercase tracking-widest mb-1.5 text-center">Active Fund</div>
              <div className="relative w-full h-28 bg-slate-950 rounded-2xl overflow-hidden border border-rose-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                {/* Glass sheen */}
                <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />

                {/* Fund value fill */}
                <div
                  className="absolute bottom-0 w-full transition-all duration-700"
                  style={{ height: `${Math.max(5, (activeGrowth / Math.max(passiveGrowth, activeGrowth)) * 90)}%` }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-rose-800 via-rose-600/90 to-rose-400/80" />
                  {/* Animated drip / fee leaking out */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full">
                    {[{ l: '25%', d: '0s' }, { l: '60%', d: '0.6s' }, { l: '40%', d: '1.2s' }].map((drop, i) => (
                      <div key={i} className="absolute rounded-full bg-rose-300/50" style={{
                        width: '3px', height: '5px',
                        left: drop.l, bottom: '-2px',
                        animation: `lab-drip-down 1.4s ease-in ${drop.d} infinite`
                      }} />
                    ))}
                  </div>
                </div>

                {/* 2% Fee label hovering */}
                <div className="absolute top-1 left-0 right-0 flex justify-center">
                  <div className="bg-rose-500/20 border border-rose-500/30 rounded-full px-1.5 py-0.5 text-[6px] font-black text-rose-400 font-mono">
                    2.0% p.a. fee
                  </div>
                </div>

                {/* Value overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-[10px] font-black text-white drop-shadow-lg">₹{(activeGrowth/1000).toFixed(1)}k</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" style={{ animation: 'lab-orb-pulse 1s infinite' }} />
                <span className="text-[7px] font-mono text-rose-400">Fee draining</span>
              </div>
            </div>

            {/* VS indicator with drag delta */}
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              <div className="text-center">
                <div className="text-[6.5px] text-slate-600 font-mono">FEE</div>
                <div className="text-[6.5px] text-slate-600 font-mono">DRAG</div>
              </div>
              <div className="bg-rose-950/60 border border-rose-500/20 rounded-xl px-1 py-0.5 text-center">
                <div className="text-[8px] font-black text-rose-400">-₹{Math.round(feeDrag/1000) > 0 ? `${Math.round(feeDrag/1000)}k` : Math.round(feeDrag)}</div>
              </div>
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>

            {/* Passive Fund - sealed jar */}
            <div className="flex-1 flex flex-col items-center">
              <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 text-center">Index Fund</div>
              <div className="relative w-full h-28 bg-slate-950 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                {/* Glass sheen */}
                <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />

                {/* Fund value fill */}
                <div
                  className="absolute bottom-0 w-full transition-all duration-700"
                  style={{ height: '90%' }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-emerald-800 via-emerald-600/90 to-emerald-400/80" />
                  {/* Rising bubbles = healthy growth */}
                  {[{ l: '30%', d: '0.2s' }, { l: '60%', d: '0.9s' }, { l: '48%', d: '1.5s' }].map((b, i) => (
                    <div key={i} className="absolute rounded-full bg-white/25" style={{
                      width: '3px', height: '3px', left: b.l, bottom: '6px',
                      animation: `lab-bubble-rise 1.8s ease-out ${b.d} infinite`
                    }} />
                  ))}
                </div>

                {/* Sealed cap at top */}
                <div className="absolute top-1 left-0 right-0 flex justify-center">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-1.5 py-0.5 text-[6px] font-black text-emerald-400 font-mono">
                    0.2% p.a. fee
                  </div>
                </div>

                {/* Value overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-[10px] font-black text-white drop-shadow-lg">₹{(passiveGrowth/1000).toFixed(1)}k</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ animation: 'lab-orb-pulse 1.2s 0.2s infinite' }} />
                <span className="text-[7px] font-mono text-emerald-400">Compounding</span>
              </div>
            </div>
          </div>

          {/* Fee drag percentage bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[7.5px] font-mono text-slate-500 mb-1">
              <span>Cumulative Fee Drag after {years} years</span>
              <span className="text-rose-400 font-bold">{((feeDrag / passiveGrowth) * 100).toFixed(1)}% lost</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(95, (feeDrag / passiveGrowth) * 100)}%`,
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)'
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Drag: <strong className="text-rose-400">₹{Math.round(feeDrag).toLocaleString()}</strong></span>
            <span>Horizon: <strong className="text-white">{years} Yrs</strong></span>
            <span>Rate: <strong style={{ color: accentColor }}>{rate}%</strong></span>
          </div>
        </div>
      );
    }


    if (variant === 'sgb') {
      const goldValue = 100 * Math.pow(1 + rate/100, years);
      const rotationSpeed = Math.max(1.2, 10 - rate/3);
      const taxFree = years >= 8;
      const progress = Math.min(1, years / 8);

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* Ambient gold glow background */}
          <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(245,158,11,${0.04 + progress * 0.14}) 0%, transparent 70%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Gold Sovereign Bond Engine • {label}
          </div>

          <div className="flex-1 flex items-center justify-center relative mt-2">
            {/* Orbit ring with spinning coin */}
            <div
              className="absolute w-44 h-44 rounded-full border border-amber-500/15"
              style={{ animation: `lab-spin ${rotationSpeed}s linear infinite` }}
            >
              {/* 3D shimmering SGB coin on orbit */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="relative w-8 h-8">
                  {/* Coin body */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border-2 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)] flex items-center justify-center">
                    <span className="text-[10px] font-black text-amber-900">₹</span>
                  </div>
                  {/* 3D shimmer highlight overlay */}
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 45%, transparent 55%, rgba(255,255,200,0.15) 100%)' }}
                  />
                </div>
              </div>
            </div>

            {/* Second orbit ring (reverse, slower) */}
            <div
              className="absolute w-32 h-32 rounded-full border border-amber-400/10"
              style={{ animation: `lab-spin-reverse ${rotationSpeed * 1.8}s linear infinite` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 to-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              </div>
            </div>

            {/* Central SGB coin — 3D face with shimmer */}
            <div className="relative z-10">
              <div
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold text-amber-100 border-[3px] border-amber-300 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #fde68a 0%, #f59e0b 35%, #d97706 65%, #b45309 100%)',
                  boxShadow: `0 0 ${taxFree ? 40 : 18}px rgba(245,158,11,${taxFree ? 0.75 : 0.45}), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`,
                  transform: 'rotate(-8deg)',
                  transition: 'box-shadow 0.5s ease'
                }}
              >
                {/* Shimmer highlight sweep */}
                <div className="lab-gold-shimmer absolute inset-0 rounded-full" />
                {/* Embossed ring detail */}
                <div className="absolute inset-2 rounded-full border border-amber-200/40 pointer-events-none" />
                <span className="text-[15px] font-black tracking-widest z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">SGB</span>
                <span className="text-[7px] text-amber-100/90 font-bold font-mono mt-0.5 z-10">+2.5% p.a.</span>
                {taxFree && (
                  <span className="text-[6.5px] text-emerald-300 font-black uppercase tracking-wider z-10 mt-0.5">TAX FREE ✓</span>
                )}
              </div>
              {/* Coin edge 3D effect */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.25) 0%, transparent 55%)',
                  transform: 'rotate(-8deg)'
                }}
              />
            </div>
          </div>

          {/* Progress bar: years to maturity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-mono text-slate-500">
              <span>Holding Period Progress</span>
              <span className={taxFree ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{years} / 8 Years {taxFree ? '✓ Tax Exempt' : ''}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress * 100}%`,
                  background: taxFree
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : 'linear-gradient(90deg, #f59e0b, #d97706)',
                  boxShadow: taxFree ? '0 0 8px #10b981' : '0 0 6px #f59e0b'
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Gold Index: <strong className="text-amber-400">{goldValue.toFixed(0)}</strong></span>
            <span>Yield: <strong className="text-white">{rate}% + 2.5%</strong></span>
            <span>Status: <strong className={taxFree ? 'text-emerald-400' : 'text-amber-400'}>{taxFree ? 'Matured' : 'Holding'}</strong></span>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderInflationEngine = (params, value, secValue) => {
    const { variant = 'core', accentColor = '#f97316', label = 'Inflation' } = params;
    const rate = value;
    const years = secValue !== undefined ? secValue : 10;
    const decay = Math.pow(1 - rate / 100, years);
    const cartScale = 0.35 + decay * 0.65;
    const redGlow = rate >= 8 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.05)';

    if (variant === 'core') {
      // ── Educational: SPLIT-SCREEN purchasing power destroyer ──
      // LEFT = what ₹100 used to buy | RIGHT = what it buys NOW after inflation
      const goods = [
        { emoji: '🍞', name: 'Bread', price: 25 },
        { emoji: '🥛', name: 'Milk', price: 20 },
        { emoji: '🍎', name: 'Apple', price: 15 },
        { emoji: '🥚', name: 'Eggs', price: 18 },
        { emoji: '🧅', name: 'Onion', price: 12 },
        { emoji: '🍌', name: 'Banana', price: 10 },
      ];
      const totalBasketCost = goods.reduce((s, g) => s + g.price, 0); // 100
      const inflatedCost = goods.map(g => ({ ...g, inflatedPrice: g.price * Math.pow(1 + rate/100, years) }));
      const budget = 100;
      // How many items can ₹100 afford now
      let remaining = budget;
      const affordCount = inflatedCost.filter(g => { if (remaining >= g.inflatedPrice) { remaining -= g.inflatedPrice; return true; } return false; }).length;
      const cantAffordCount = goods.length - affordCount;
      const realValue = (100 / Math.pow(1 + rate/100, years));
      const priceMult = Math.pow(1 + rate/100, years);

      return (
        <div className="relative w-full max-w-sm min-h-[310px] h-auto bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(239,68,68,${Math.min(0.2, rate * 0.015)}) 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Inflation Purchasing Power Decay • {label}
          </div>

          {/* SPLIT SCREEN: THEN vs NOW */}
          <div className="flex gap-2 mt-6">
            {/* THEN side */}
            <div className="flex-1 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-2">
              <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 text-center">₹100 Then (Yr 0)</div>
              <div className="grid grid-cols-3 gap-1 justify-items-center">
                {goods.map((g, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="text-[6px] font-mono text-slate-500">₹{g.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[8px] font-black text-emerald-400">6 items ✓</span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center justify-center gap-1 px-0.5">
              <div className="text-[8px] font-black text-rose-400 font-mono">{years}Y</div>
              <div className="text-rose-400 text-lg" style={{ animation: 'lab-float 1.5s ease-in-out infinite' }}>→</div>
              <div className="text-[7px] text-rose-500 font-mono font-bold">+{rate}%</div>
              <div className="text-[7px] text-rose-500 font-mono font-bold">p.a.</div>
            </div>

            {/* NOW side */}
            <div className="flex-1 bg-rose-950/30 border border-rose-500/20 rounded-2xl p-2">
              <div className="text-[7px] font-black text-rose-400 uppercase tracking-widest mb-1.5 text-center">₹100 Now (Yr {years})</div>
              <div className="grid grid-cols-3 gap-1 justify-items-center">
                {inflatedCost.map((g, i) => {
                  const canAfford = i < affordCount;
                  return (
                    <div key={i} className="flex flex-col items-center relative">
                      <span
                        className="text-lg transition-all duration-500"
                        style={{
                          opacity: canAfford ? 1 : 0.15,
                          filter: canAfford ? 'none' : 'grayscale(1)',
                          transform: canAfford ? 'scale(1)' : 'scale(0.7)'
                        }}
                      >{g.emoji}</span>
                      <span className="text-[6px] font-mono" style={{ color: canAfford ? '#94a3b8' : '#ef4444' }}>
                        ₹{g.inflatedPrice.toFixed(0)}
                      </span>
                      {!canAfford && (
                        <span className="absolute -top-0.5 -right-0.5 text-[8px]">🚫</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 text-center">
                <span className="text-[8px] font-black" style={{ color: affordCount > 0 ? '#f97316' : '#ef4444' }}>
                  {affordCount} of 6 items
                </span>
              </div>
            </div>
          </div>

          {/* Live decay bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[7.5px] font-mono text-slate-500 mb-1">
              <span>Purchasing Power of ₹100</span>
              <span className="text-rose-400 font-bold">₹{realValue.toFixed(1)} real value</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
              <div
                className="h-full rounded-full transition-all duration-500 relative"
                style={{
                  width: `${Math.max(4, (realValue / 100) * 100)}%`,
                  background: `linear-gradient(90deg, #ef4444, #f97316 ${(realValue/100)*100}%, #fbbf24)`,
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)'
                }}
              >
                <div className="absolute right-0 top-0 h-full w-1 bg-white/40 rounded-full" />
              </div>
            </div>
            <div className="flex justify-between text-[7px] font-mono mt-0.5">
              <span className="text-slate-600">₹0</span>
              <span className="text-rose-400 font-bold">{(realValue).toFixed(1)}% remains</span>
              <span className="text-slate-600">₹100</span>
            </div>
          </div>

          {/* Price multiplier insight */}
          <div className="mt-2 flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-3 py-1.5">
            <div className="text-center">
              <div className="text-[7px] text-slate-500 font-mono uppercase">Prices are now</div>
              <div className="text-[13px] font-black text-rose-400">{priceMult.toFixed(2)}×</div>
              <div className="text-[6.5px] text-slate-500 font-mono">of original</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-[7px] text-slate-500 font-mono uppercase">Value Eroded</div>
              <div className="text-[13px] font-black text-emerald-400">₹{(100 - realValue).toFixed(1)}</div>
              <div className="text-[6.5px] text-slate-500 font-mono">out of ₹100</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-[7px] text-slate-500 font-mono uppercase">Beat it with</div>
              <div className="text-[11px] font-black text-cyan-400">{(rate + 3).toFixed(0)}%+</div>
              <div className="text-[6.5px] text-slate-500 font-mono">returns needed</div>
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'wpi_cpi') {
      const cpiRate = rate;
      const wpiRate = Math.min(15, Math.max(1, rate * 1.25 - 1));
      const maxRate = Math.max(cpiRate, wpiRate, 1);
      const cpiBarPct = (cpiRate / Math.max(maxRate, 15)) * 100;
      const wpiBarPct = (wpiRate / Math.max(maxRate, 15)) * 100;
      const spread = Math.abs(cpiRate - wpiRate).toFixed(1);
      const diverging = cpiRate > wpiRate;

      // Animated price index values — simulate year-by-year cost
      const cpiDecade = (100 * Math.pow(1 + cpiRate/100, 10)).toFixed(0);
      const wpiDecade = (100 * Math.pow(1 + wpiRate/100, 10)).toFixed(0);

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[260px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            CPI vs WPI Index Race • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-3">
            {/* Animated racing bars */}
            {[{ label: 'CPI (Retail)', emoji: '🛒', pct: cpiBarPct, rate: cpiRate, final: cpiDecade, color: '#f97316', hint: 'What YOU pay in shops' },
              { label: 'WPI (Wholesale)', emoji: '🏭', pct: wpiBarPct, rate: wpiRate.toFixed(1), final: wpiDecade, color: '#22d3ee', hint: 'What FACTORIES pay' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span>{item.emoji}</span>
                    <span className="text-slate-400">{item.label}</span>
                  </span>
                  <span className="font-black" style={{ color: item.color }}>{item.rate}% p.a.</span>
                </div>
                {/* Race bar */}
                <div className="w-full h-5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-600"
                    style={{
                      width: `${item.pct}%`,
                      background: `linear-gradient(90deg, ${item.color}40, ${item.color})`,
                      boxShadow: `0 0 8px ${item.color}50`,
                      minWidth: '30px'
                    }}
                  >
                    <span className="text-[6.5px] font-black text-white">{item.rate}%</span>
                  </div>
                  {/* Animated leading particle */}
                  <div
                    className="absolute top-1 rounded-full"
                    style={{
                      width: '6px', height: '6px',
                      left: `${item.pct}%`,
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                      transform: 'translateX(-50%)',
                      animation: `lab-orb-pulse 1.2s ease-in-out infinite`
                    }}
                  />
                </div>
                <div className="text-[7px] text-slate-500 font-mono pl-1">{item.hint} → ₹100 becomes ₹{item.final} in 10 yrs</div>
              </div>
            ))}

            {/* Spread insight */}
            <div className="bg-slate-900/60 border rounded-2xl px-3 py-2 flex items-center justify-between"
              style={{ borderColor: diverging ? 'rgba(249,115,22,0.3)' : 'rgba(34,211,238,0.3)' }}>
              <div className="text-center">
                <div className="text-[7px] text-slate-500 font-mono uppercase">Spread</div>
                <div className="text-[14px] font-black" style={{ color: diverging ? '#f97316' : '#22d3ee' }}>+{spread}%</div>
                <div className="text-[6.5px] text-slate-500 font-mono">{diverging ? 'CPI leads' : 'WPI leads'}</div>
              </div>
              <div className="text-[8px] text-slate-400 font-mono max-w-[120px] leading-tight">
                When <strong className="text-orange-400">CPI &gt; WPI</strong>, costs reach you before factories feel it — margin squeeze ahead.
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>CPI: <strong className="text-orange-400">{cpiRate}%</strong></span>
            <span>Spread: <strong className="text-amber-400">+{spread}%</strong></span>
            <span>WPI: <strong className="text-cyan-400">{wpiRate.toFixed(1)}%</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'fiat') {
      const tiltY = (1 - decay) * 15;
      const noteCount = Math.min(10, Math.floor((1 - decay) * 9) + 1);

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Trust-to-Goods Scale • {label}
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative mt-3">
            <svg className="w-52 h-28 overflow-visible" viewBox="0 0 160 90">
              <defs>
                <linearGradient id="miniNoteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
                <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>

              {/* Base ambient glow */}
              <ellipse cx="80" cy="76" rx="45" ry="12" fill="url(#baseGlow)" />

              {/* Scale Base Platform */}
              <rect x="42" y="75" width="76" height="5" rx="2.5" fill="#0f172a" />
              <rect x="44" y="73" width="72" height="4" rx="2" fill="#334155" stroke="#64748b" strokeWidth="0.8" />
              <rect x="48" y="77" width="8" height="2" fill="#1e293b" />
              <rect x="104" y="77" width="8" height="2" fill="#1e293b" />
              
              {/* Stand Column with 3D details */}
              <line x1="81" y1="73" x2="81" y2="35" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="80" y1="73" x2="80" y2="35" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="79.5" y1="72" x2="79.5" y2="36" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

              {/* Dial Gauge background ticks */}
              <path d="M 70 24 A 12 12 0 0 1 90 24" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="1,1.5" />

              {/* Central Pivot point */}
              <circle cx="80" cy="35" r="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="80" cy="35" r="2" fill="#fff" />

              {/* Central pointer dial */}
              <line 
                x1="80" 
                y1="35" 
                x2={80 - tiltY * 0.7} 
                y2={21} 
                stroke="#ef4444" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                className="transition-all duration-500 ease-out" 
              />

              {/* The Beam (Balance arm) */}
              <line 
                x1="35" 
                y1={35.5 + tiltY} 
                x2="125" 
                y2={35.5 - tiltY} 
                stroke="#475569" 
                strokeWidth="4" 
                strokeLinecap="round" 
                className="transition-all duration-500 ease-out" 
              />
              <line 
                x1="35" 
                y1={35 + tiltY} 
                x2="125" 
                y2={35 - tiltY} 
                stroke="#e2e8f0" 
                strokeWidth="2" 
                strokeLinecap="round" 
                className="transition-all duration-500 ease-out" 
              />

              {/* Hanger Rings */}
              <circle cx="35" cy={35 + tiltY} r="2" fill="none" stroke="#f59e0b" strokeWidth="1" className="transition-all duration-500 ease-out" />
              <circle cx="125" cy={35 - tiltY} r="2" fill="none" stroke="#f59e0b" strokeWidth="1" className="transition-all duration-500 ease-out" />

              {/* Left Hanger Wires */}
              <line 
                x1="35" 
                y1={37 + tiltY} 
                x2="20" 
                y2={62 + tiltY} 
                stroke="rgba(148, 163, 184, 0.5)" 
                strokeWidth="1" 
                className="transition-all duration-500 ease-out" 
              />
              <line 
                x1="35" 
                y1={37 + tiltY} 
                x2="50" 
                y2={62 + tiltY} 
                stroke="rgba(148, 163, 184, 0.5)" 
                strokeWidth="1" 
                className="transition-all duration-500 ease-out" 
              />

              {/* Left Pan (Plate) */}
              <path 
                d={`M 18 ${62 + tiltY} A 17 5 0 0 0 52 ${62 + tiltY} Z`} 
                fill="#1e293b" 
                stroke="#475569" 
                strokeWidth="1.5" 
                className="transition-all duration-500 ease-out" 
              />

              {/* Left Pan Contents: Stack of Banknotes */}
              {Array.from({ length: noteCount }).map((_, idx) => {
                const yOffset = idx * 2.2;
                const xOffset = (idx % 2 === 0 ? 1 : -1) * (idx * 0.4);
                const rotateDeg = (idx % 2 === 0 ? 1 : -1) * (idx * 1.5);
                const baseNoteY = 61.5 + tiltY;
                return (
                  <g 
                    key={idx} 
                    transform={`translate(${xOffset}, ${-yOffset}) rotate(${rotateDeg}, 35, ${baseNoteY + 2.75})`}
                    className="transition-all duration-500 ease-out"
                  >
                    <rect 
                      x="24" 
                      y={baseNoteY} 
                      width="22" 
                      height="5.5" 
                      rx="0.8" 
                      fill="url(#miniNoteGrad)" 
                      stroke="#34d399" 
                      strokeWidth="0.5" 
                      className="shadow-md"
                    />
                    <text 
                      x="35" 
                      y={baseNoteY + 4.2} 
                      fontSize="4.5" 
                      fill="#e6fffa" 
                      textAnchor="middle" 
                      fontFamily="monospace" 
                      fontWeight="black"
                    >
                      ₹
                    </text>
                  </g>
                );
              })}

              {/* Hyperinflation Caution overlay stamp (perfectly tracked to top of banknotes) */}
              {decay < 0.25 && (
                <g 
                  transform={`translate(0, ${- (noteCount * 2.2)}) rotate(-8, 35, ${61.5 + tiltY - noteCount * 2.2})`} 
                  className="animate-pulse transition-all duration-500 ease-out"
                >
                  <rect x="18" y={52.5 + tiltY} width="34" height="7" rx="1.5" fill="#ef4444" opacity="0.95" stroke="#fecaca" strokeWidth="0.5" />
                  <text 
                    x="35" 
                    y={57.5 + tiltY} 
                    fontSize="3.8" 
                    fill="#ffffff" 
                    textAnchor="middle" 
                    fontWeight="black" 
                    fontFamily="monospace" 
                    letterSpacing="0.2"
                  >
                    TRASH CASH
                  </text>
                </g>
              )}

              {/* Right Hanger Wires */}
              <line 
                x1="125" 
                y1={37 - tiltY} 
                x2="110" 
                y2={62 - tiltY} 
                stroke="rgba(148, 163, 184, 0.5)" 
                strokeWidth="1" 
                className="transition-all duration-500 ease-out" 
              />
              <line 
                x1="125" 
                y1={37 - tiltY} 
                x2="140" 
                y2={62 - tiltY} 
                stroke="rgba(148, 163, 184, 0.5)" 
                strokeWidth="1" 
                className="transition-all duration-500 ease-out" 
              />

              {/* Right Pan (Plate) */}
              <path 
                d={`M 108 ${62 - tiltY} A 17 5 0 0 0 142 ${62 - tiltY} Z`} 
                fill="#1e293b" 
                stroke="#475569" 
                strokeWidth="1.5" 
                className="transition-all duration-500 ease-out" 
              />

              {/* Right Pan Contents: Vanishing Groceries */}
              {decay > 0.7 ? (
                <g className="transition-all duration-500 ease-out">
                  {/* Apple */}
                  <text x="114" y={63 - tiltY} fontSize="11" className="select-none">🍎</text>
                  {/* Milk */}
                  <text x="124" y={62 - tiltY} fontSize="12" className="select-none">🥛</text>
                  {/* Bread */}
                  <text x="133" y={63.5 - tiltY} fontSize="11" className="select-none">🍞</text>
                </g>
              ) : decay >= 0.3 ? (
                <g className="transition-all duration-500 ease-out">
                  {/* Just one single Bread loaf sitting inside */}
                  <text x="125" y={63 - tiltY} fontSize="11" className="select-none">🍞</text>
                </g>
              ) : (
                <g className="transition-all duration-500 ease-out">
                  {/* Tiny bread crumb pile + warning badge */}
                  <circle cx="121" cy={65 - tiltY} r="1" fill="#f59e0b" className="animate-pulse" />
                  <circle cx="125" cy={65.5 - tiltY} r="0.7" fill="#d97706" className="animate-pulse" />
                  <circle cx="128" cy={64.8 - tiltY} r="1.2" fill="#b45309" className="animate-pulse" />
                  <rect x="113" y={47 - tiltY} width="24" height="6.5" rx="1.5" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeWidth="0.5" className="animate-pulse" />
                  <text x="125" y={51.5 - tiltY} fontSize="3.8" fill="#fda4af" textAnchor="middle" fontWeight="bold" fontFamily="monospace" className="animate-pulse">
                    CRUMB
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Dynamic Market Exchange Rate Card */}
          <div className="text-center bg-white/[0.03] border border-white/5 rounded-2xl p-2.5 my-1.5 shadow-inner">
            <span className="text-[7.5px] text-slate-500 uppercase tracking-widest block font-mono">Market Exchange Rate</span>
            <span className="text-[11px] font-black text-white mt-1 block tracking-wide">
              {decay > 0.7 ? (
                <span className="text-emerald-400">₹100 = Full Grocery Basket (3 Items)</span>
              ) : decay >= 0.3 ? (
                <span className="text-amber-400">₹300 = 1 Loaf of Bread (Eroded)</span>
              ) : (
                <span className="text-rose-400 font-extrabold animate-pulse">₹10,000+ = 1 Single Crumb (COLLAPSE)</span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Erosion: <strong className="text-rose-400">{rate}% per year</strong></span>
            <span>Real Value: <strong className="text-white">₹{Math.round(decay * 100)}</strong> / ₹100</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBalanceSheetJenga = (params, value, secValue) => {
    const { variant = 'balance_sheet', accentColor = '#60a5fa', label = 'Valuation Tower' } = params;
    const val = value;
    const isHighRisk = variant === 'balance_sheet' ? val > 60 : variant === 'debt_equity' ? val > 1.5 : val > 50;
    const wobble = isHighRisk ? 'animate-[shake_0.4s_infinite]' : '';
    const tilt = variant === 'balance_sheet' && val > 50 ? (val - 50) * 0.45 : 0;

    return (
      <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
        {/* Title */}
        <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Forensics Tower • {label}
        </div>
        
        <div className="flex-1 flex items-center justify-center pb-2 relative mt-4">
          <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${wobble}`}>
            
            {variant === 'balance_sheet' && (() => {
              const debtH = 5 + (val / 100) * 40;
              const assetXOffset = val > 55 ? -(val - 55) * 0.7 : 0;
              const debtColor = val > 60 ? '#f43f5e' : val > 30 ? '#fb923c' : '#10b981';
              const debtSideColor = val > 60 ? '#e11d48' : val > 30 ? '#d97706' : '#059669';
              const debtRightColor = val > 60 ? '#be123c' : val > 30 ? '#b45309' : '#047857';

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  <defs>
                    <radialGradient id="bsGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={debtColor} stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Ambient Glow under the tower */}
                  <ellipse cx="100" cy="98" rx="55" ry="12" fill="url(#bsGlow)" />
                  <ellipse cx="100" cy="98" rx="48" ry="8" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />

                  {/* 1. EQUITY BLOCK (Bottom Right) */}
                  <g>
                    {/* Top face */}
                    <polygon points="60,90 100,80 140,90 100,100" fill="#10b981" />
                    {/* Left face */}
                    <polygon points="60,90 100,100 100,108 60,98" fill="#059669" />
                    {/* Right face */}
                    <polygon points="140,90 100,100 100,108 140,98" fill="#047857" />
                    <text x="100" y="93" fontSize="5" fill="#e6fffa" textAnchor="middle" fontWeight="black" fontFamily="monospace">EQUITY</text>
                  </g>

                  {/* 2. DEBT BLOCK (Stacked on top of Equity) */}
                  <g transform={`translate(0, -10)`}>
                    {/* Top face */}
                    <polygon points={`60,${90 - debtH} 100,${80 - debtH} 140,${90 - debtH} 100,${100 - debtH}`} fill={debtColor} />
                    {/* Left face */}
                    <polygon points={`60,${90 - debtH} 100,${100 - debtH} 100,90 60,90`} fill={debtSideColor} />
                    {/* Right face */}
                    <polygon points={`140,${90 - debtH} 100,${100 - debtH} 100,90 140,90`} fill={debtRightColor} />
                    <text x="100" y={95 - debtH/2} fontSize="5.5" fill="#fff" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                      DEBT ({val}%)
                    </text>
                  </g>

                  {/* 3. ASSETS BLOCK (Floating/Balancing on top with dynamic slide offset) */}
                  <g transform={`translate(${assetXOffset}, ${-18 - debtH})`}>
                    {/* Top face */}
                    <polygon points="60,75 100,65 140,75 100,85" fill="#6366f1" />
                    {/* Left face */}
                    <polygon points="60,75 100,85 100,90 60,80" fill="#4f46e5" />
                    {/* Right face */}
                    <polygon points="140,75 100,85 100,90 140,80" fill="#4338ca" />
                    <text x="100" y="78" fontSize="5" fill="#e0e7ff" textAnchor="middle" fontWeight="black" fontFamily="monospace">ASSETS</text>
                  </g>

                  {/* Leverage unstable warnings */}
                  {val > 60 && (
                    <g transform="translate(100, 30)" className="animate-pulse">
                      <rect x="-35" y="-6" width="70" height="12" rx="2" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="0.6" />
                      <text x="0" y="2" fontSize="4.2" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace" letterSpacing="0.2">
                        ⚠️ UNSTABLE LEVERAGE
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}

            {(variant === 'pe' || variant === 'pb') && (() => {
              const scaleTilt = variant === 'pe' ? (val - 35) * 0.45 : (val - 2.5) * 8;
              const clampedTilt = Math.max(-20, Math.min(20, scaleTilt));
              
              const isPE = variant === 'pe';
              const priceName = isPE ? `${val}x P/E` : `${val}x P/B`;
              const baseName = isPE ? "EARNINGS BASE" : "BOOK VALUE";
              
              const coinColor = isPE ? '#fbbf24' : '#06b6d4';
              const coinStroke = isPE ? '#d97706' : '#0891b2';
              
              // Coins to stack on left pan
              const coinCount = isPE ? Math.min(5, Math.floor(val / 20) + 1) : Math.min(5, Math.floor(val * 1.2) + 1);

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  <defs>
                    <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={isHighRisk ? '#f43f5e' : '#10b981'} stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Stand Column */}
                  <line x1="100" y1="85" x2="100" y2="40" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  <line x1="100" y1="85" x2="100" y2="40" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 85 85 L 115 85 L 110 89 L 90 89 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                  
                  {/* Dial Gauge background ticks */}
                  <path d="M 90 31 A 10 10 0 0 1 110 31" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="1,1" />
                  
                  {/* Pivot Pin */}
                  <circle cx="100" cy="40" r="3" fill="#64748b" />

                  {/* Dynamic Tilting Beam Group */}
                  <g transform={`rotate(${clampedTilt}, 100, 40)`} className="transition-transform duration-500 ease-out">
                    {/* Main balance beam */}
                    <line x1="45" y1="40" x2="155" y2="40" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="45" y1="40" x2="155" y2="40" stroke="#94a3b8" strokeWidth="0.8" strokeLinecap="round" />
                    
                    {/* Left Hanger Wires */}
                    <line x1="50" y1="40" x2="35" y2="72" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />
                    <line x1="50" y1="40" x2="65" y2="72" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />
                    {/* Left Plate */}
                    <path d="M 31 72 A 19 4 0 0 0 69 72 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />

                    {/* Price Coins Stack inside Left Plate */}
                    {Array.from({ length: coinCount }).map((_, i) => {
                      const coinY = 70.5 - i * 3.2;
                      return (
                        <g key={i}>
                          <ellipse cx="50" cy={coinY} rx="12" ry="3.5" fill={coinColor} stroke={coinStroke} strokeWidth="0.6" />
                          <ellipse cx="50" cy={coinY - 0.6} rx="12" ry="3.5" fill={isPE ? '#fde68a' : '#22d3ee'} stroke={coinStroke} strokeWidth="0.4" />
                          <text x="50" y={coinY + 0.8} fontSize="4" fill={isPE ? '#78350f' : '#0891b2'} textAnchor="middle" fontWeight="black" fontFamily="monospace">₹</text>
                        </g>
                      );
                    })}
                    <text x="50" y={71.5 - coinCount * 3.2 - 2} fontSize="5" fill="#fff" textAnchor="middle" fontWeight="bold" fontFamily="monospace" transform="rotate(0)">
                      {priceName}
                    </text>

                    {/* Right Hanger Wires */}
                    <line x1="150" y1="40" x2="135" y2="72" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />
                    <line x1="150" y1="40" x2="165" y2="72" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="0.8" />
                    {/* Right Plate */}
                    <path d="M 131 72 A 19 4 0 0 0 169 72 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />

                    {/* Earnings / Book Base Block on Right Plate */}
                    <g transform="translate(138, 55)">
                      <rect x="0" y="0" width="24" height="15" rx="1.5" fill="#10b981" stroke="#047857" strokeWidth="1" />
                      <rect x="1.5" y="1.5" width="21" height="12" rx="1" fill="#34d399" stroke="none" />
                      <text x="12" y="9" fontSize="3.8" fill="#047857" textAnchor="middle" fontWeight="black" fontFamily="monospace">BASE</text>
                    </g>
                    <text x="150" y="52" fontSize="5" fill="#34d399" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                      {baseName}
                    </text>
                  </g>

                  {/* Indicator Needle */}
                  <g transform="translate(100, 40)">
                    <line x1="0" y1="0" x2={clampedTilt * 0.45} y2="-12" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" className="transition-all duration-500 ease-out" />
                    <circle cx={clampedTilt * 0.45} cy="-12" r="1" fill="#ef4444" />
                  </g>

                  {/* Bubble hazard stamp */}
                  {isHighRisk && (
                    <g transform="translate(100, 15)" className="animate-pulse">
                      <rect x="-30" y="-5" width="60" height="10" rx="1.5" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="0.6" />
                      <text x="0" y="1.5" fontSize="4" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                        ⚠️ HIGH RISK BUBBLE
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}

            {(variant === 'roe' || variant === 'roce') && (() => {
              const slabs = Math.min(6, Math.floor(val / 6) + 1);
              const maxSlabIndex = slabs - 1;

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  <defs>
                    <linearGradient id="cashSlabGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  
                  {/* Platform Base */}
                  <ellipse cx="100" cy="100" rx="45" ry="9" fill="#1e293b" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                  
                  {/* Slabs Stacked upwards */}
                  {Array.from({ length: slabs }).map((_, idx) => {
                    const yOffset = idx * 9;
                    const scale = 1 - idx * 0.04;
                    const slabY = 92 - yOffset;
                    
                    return (
                      <g key={idx} transform={`scale(${scale}) translate(${(100*(1-scale))/scale}, ${(slabY*(1-scale))/scale})`} className="transition-all duration-500">
                        {/* 3D Isometric slab */}
                        {/* Top Face */}
                        <polygon points="65,92 100,83 135,92 100,101" fill="url(#cashSlabGrad)" stroke="#6ee7b7" strokeWidth="0.4" />
                        {/* Left Face */}
                        <polygon points="65,92 100,101 100,107 65,98" fill="#047857" />
                        {/* Right Face */}
                        <polygon points="135,92 100,101 100,107 135,98" fill="#065f46" />
                        
                        <text x="100" y="95" fontSize="4.8" fill="#ffffff" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="drop-shadow">
                          +{val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Spark particles floating up from top slab */}
                  {val >= 15 && (
                    <g className="animate-bounce" style={{ transformOrigin: '100px 40px' }}>
                      <circle cx="90" cy={92 - maxSlabIndex * 9 - 10} r="1.5" fill="#34d399" className="animate-pulse" />
                      <circle cx="110" cy={92 - maxSlabIndex * 9 - 18} r="1.2" fill="#10b981" className="animate-pulse" />
                      <circle cx="102" cy={92 - maxSlabIndex * 9 - 6} r="2" fill="#6ee7b7" className="animate-pulse" />
                      <text x="100" y={92 - maxSlabIndex * 9 - 22} fontSize="5" fill="#10b981" fontWeight="black" textAnchor="middle" fontFamily="monospace" className="animate-pulse">
                        GROWTH
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}

            {(variant === 'opm' || variant === 'ebitda') && (() => {
              const flowSpeed = Math.max(0.6, 2.5 - (val / 20));
              const expRate = 100 - val;

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  <defs>
                    <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>

                  {/* Top Funnel (Revenue Input) */}
                  <path d="M 80 15 L 120 15 L 108 30 L 92 30 Z" fill="url(#pipeGrad)" stroke="#475569" strokeWidth="1" />
                  <text x="100" y="11" fontSize="5" fill="#cbd5e1" textAnchor="middle" fontWeight="black" fontFamily="monospace">REVENUE (100%)</text>

                  {/* Core Pipe */}
                  <rect x="94" y="30" width="12" height="15" fill="url(#pipeGrad)" stroke="#475569" strokeWidth="0.8" />
                  
                  {/* Left branch (Siphoned Expenses) */}
                  <path d="M 94 40 L 60 40 L 60 75" fill="none" stroke="url(#pipeGrad)" strokeWidth="8" strokeLinecap="square" />
                  
                  {/* Bottom branch (Retained Margin) */}
                  <path d="M 106 40 L 140 40 L 140 75" fill="none" stroke="url(#pipeGrad)" strokeWidth="8" strokeLinecap="square" />

                  {/* Animated Flows */}
                  {/* Revenue Inlet Flow */}
                  <line x1="100" y1="16" x2="100" y2="40" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" 
                        style={{ animation: 'flow 1s linear infinite' }} />

                  {/* Expenses siphoned left */}
                  {expRate > 0 && (
                    <path d="M 100 40 L 60 40 L 60 75" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4,4"
                          style={{ animation: `flow ${flowSpeed * 1.3}s linear infinite` }} />
                  )}

                  {/* Net margin dripping down right */}
                  {val > 0 && (
                    <path d="M 100 40 L 140 40 L 140 75" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,4"
                          style={{ animation: `flow ${flowSpeed}s linear infinite` }} />
                  )}

                  {/* Left Outlet: Expense Drain */}
                  <rect x="48" y="75" width="24" height="15" rx="3" fill="#1e1b1b" stroke="#ef4444" strokeWidth="1" />
                  <text x="60" y="84" fontSize="4.2" fill="#fca5a5" textAnchor="middle" fontWeight="black" fontFamily="monospace">EXPENSES</text>
                  <text x="60" y="89" fontSize="4.5" fill="#f43f5e" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{expRate}%</text>

                  {/* Right Outlet: Net Profit Bucket */}
                  <rect x="128" y="75" width="24" height="15" rx="3" fill="#1b2e25" stroke="#10b981" strokeWidth="1" />
                  <text x="140" y="84" fontSize="4.2" fill="#a7f3d0" textAnchor="middle" fontWeight="black" fontFamily="monospace">OPM PROFIT</text>
                  <text x="140" y="89" fontSize="4.5" fill="#10b981" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{val}%</text>

                  {/* Balance Check indicators */}
                  <circle cx="100" cy="40" r="2.5" fill="#f59e0b" />
                </svg>
              );
            })()}

            {variant === 'goodwill' && (() => {
              const gwRadius = 8 + (val / 100) * 18;
              const isUnstable = val > 65;
              const bubbleGlow = isUnstable ? 'rgba(244, 63, 94, 0.6)' : 'rgba(99, 102, 241, 0.4)';
              const bubbleBorder = isUnstable ? '#f43f5e' : '#818cf8';

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  {/* Tangible Asset Circle (Stable Ground) */}
                  <circle cx="65" cy="60" r="24" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
                  <circle cx="65" cy="60" r="18" fill="#090d16" />
                  <text x="65" y="59" fontSize="4.5" fill="#10b981" textAnchor="middle" fontWeight="black" fontFamily="monospace">TANGIBLES</text>
                  <text x="65" y="65" fontSize="4.5" fill="#cbd5e1" textAnchor="middle" fontFamily="monospace">Book Assets</text>

                  {/* Connector Link */}
                  <line x1="65" y1="60" x2="120" y2="60" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="2,2" />

                  {/* Goodwill bubble (Inflating premium, wobbling if high) */}
                  <g className={isUnstable ? 'animate-[shake_0.6s_infinite]' : ''} style={{ transformOrigin: '120px 60px' }}>
                    <circle cx="120" cy="60" r={gwRadius} fill="rgba(99, 102, 241, 0.08)" stroke={bubbleBorder} strokeWidth="1.5" 
                            style={{ 
                              boxShadow: `0 0 15px ${bubbleGlow}`,
                              animation: 'lab-float 2s ease-in-out infinite',
                              transition: 'r 0.3s ease, stroke 0.3s ease'
                            }} />
                    {/* Highlight glare on the goodwill bubble to look transparent */}
                    <path d={`M ${120 - gwRadius*0.6} ${60 - gwRadius*0.5} A ${gwRadius*0.8} ${gwRadius*0.8} 0 0 1 ${120 + gwRadius*0.2} ${60 - gwRadius*0.8}`}
                          fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
                    <text x="120" y="59" fontSize="4.8" fill="#a5b4fc" textAnchor="middle" fontWeight="black" fontFamily="monospace">GOODWILL</text>
                    <text x="120" y="65" fontSize="4.2" fill="#818cf8" textAnchor="middle" fontFamily="monospace">+{val}% Premium</text>
                  </g>

                  {/* Impairment Warning stamp */}
                  {isUnstable && (
                    <g transform="translate(120, 20)" className="animate-pulse">
                      <rect x="-26" y="-5" width="52" height="10" rx="1.5" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="0.6" />
                      <text x="0" y="1.5" fontSize="3.8" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                        IMPAIRMENT RISK
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}

            {variant === 'dupont' && (() => {
              const speed = Math.max(1, val * 0.15);
              const spinRight = `lab-spin ${20/speed}s linear infinite`;
              const spinLeft = `lab-spin-reverse ${24/speed}s linear infinite`;
              const isOverLev = val > 45;

              return (
                <svg className={`w-48 h-36 overflow-visible ${isOverLev ? 'animate-[shake_0.8s_infinite]' : ''}`} viewBox="0 0 200 120" style={{ transformOrigin: '100px 60px' }}>
                  {/* Gear 1: Net Margin (Left, Green) */}
                  <g transform="translate(62, 50)" style={{ animation: spinRight, transformOrigin: '62px 50px' }}>
                    <circle cx="62" cy="50" r="16" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="3,3" />
                    <circle cx="62" cy="50" r="12" fill="#0b1319" stroke="#047857" strokeWidth="1" />
                    <text x="62" y="52" fontSize="3.5" fill="#34d399" textAnchor="middle" fontWeight="black" fontFamily="monospace">MARGIN</text>
                  </g>

                  {/* Gear 2: Asset Turnover (Middle, Cyan) */}
                  <g transform="translate(100, 70)" style={{ animation: spinLeft, transformOrigin: '100px 70px' }}>
                    <circle cx="100" cy="70" r="18" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeDasharray="4,4" />
                    <circle cx="100" cy="70" r="14" fill="#091419" stroke="#0891b2" strokeWidth="1" />
                    <text x="100" y="72" fontSize="3.5" fill="#22d3ee" textAnchor="middle" fontWeight="black" fontFamily="monospace">TURNOVER</text>
                  </g>

                  {/* Gear 3: Leverage (Right, Purple, swells based on val) */}
                  <g transform="translate(138, 50)" style={{ animation: spinRight, transformOrigin: '138px 50px' }}>
                    <circle cx="138" cy="50" r={10 + (val/100)*15} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="2,3" />
                    <circle cx="138" cy="50" r={7 + (val/100)*10} fill="#0d111c" stroke="#6d28d9" strokeWidth="1" />
                    <text x="138" y="52" fontSize="3.5" fill="#a78bfa" textAnchor="middle" fontWeight="black" fontFamily="monospace">LEVERAGE</text>
                  </g>

                  {/* Center Output Hub readout */}
                  <g transform="translate(100, 32)">
                    <rect x="-35" y="-7" width="70" height="14" rx="2.5" fill="#030712" stroke="#64748b" strokeWidth="1" />
                    <text x="0" y="-1" fontSize="4.2" fill="#94a3b8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">ROE DUPONT RESULT</text>
                    <text x="0" y="5" fontSize="5.5" fill="#10b981" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                      {val}% ROE
                    </text>
                  </g>
                </svg>
              );
            })()}

            {variant === 'debt_equity' && (() => {
              const debtH = Math.min(65, 10 + val * 24);
              const isCritical = val > 1.5;
              const beamTilt = Math.max(-20, Math.min(20, (val - 1.0) * 12));

              return (
                <svg className="w-48 h-36 overflow-visible" viewBox="0 0 200 120">
                  {/* Central Pivot Column */}
                  <line x1="100" y1="85" x2="100" y2="50" stroke="#334155" strokeWidth="3" />
                  <circle cx="100" cy="50" r="3.5" fill={isCritical ? '#ef4444' : '#f59e0b'} />

                  {/* Balance Beam */}
                  <g transform={`rotate(${beamTilt}, 100, 50)`} className="transition-transform duration-500 ease-out">
                    <line x1="40" y1="50" x2="160" y2="50" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="40" y1="50" x2="160" y2="50" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />

                    {/* Left Hanger & Equity Block */}
                    <line x1="50" y1="50" x2="50" y2="75" stroke="#475569" strokeWidth="0.8" />
                    <rect x="38" y="75" width="24" height="20" rx="2" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                    <text x="50" y="84" fontSize="4.8" fill="#e6fffa" textAnchor="middle" fontWeight="black" fontFamily="monospace">EQUITY</text>
                    <text x="50" y="91" fontSize="4" fill="#a7f3d0" textAnchor="middle" fontFamily="monospace">1.0x Base</text>

                    {/* Right Hanger & Debt Block */}
                    <line x1="150" y1="50" x2="150" y2={95 - debtH} stroke="#475569" strokeWidth="0.8" />
                    <rect x="138" y={95 - debtH} width="24" height={debtH} rx="2" 
                          fill={isCritical ? '#7f1d1d' : '#92400e'} 
                          stroke={isCritical ? '#ef4444' : '#fb923c'} 
                          strokeWidth="1.2" 
                          className="transition-all duration-500" />
                    <text x="150" y={95 - debtH + 8} fontSize="4.8" fill="#ffffff" textAnchor="middle" fontWeight="black" fontFamily="monospace">DEBT</text>
                    <text x="150" y={95 - debtH + 14} fontSize="4.5" fill={isCritical ? '#fca5a5' : '#fcd34d'} textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                      {val}x D/E
                    </text>
                  </g>

                  {/* Spark alerts for solvency hazards */}
                  {isCritical && (
                    <g transform="translate(100, 22)" className="animate-pulse">
                      <rect x="-32" y="-5" width="64" height="10" rx="1.5" fill="#7f1d1d" stroke="#ef4444" strokeWidth="0.6" />
                      <text x="0" y="1.5" fontSize="3.8" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                        🚨 LEVERAGE HAZARD
                      </text>
                    </g>
                  )}
                </svg>
              );
            })()}

          </div>
        </div>

        {/* Bottom Details */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 select-none">
          <span>Metric: <strong style={{ color: accentColor }}>{val}</strong></span>
          <span>Verdict: <strong className={isHighRisk ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>{isHighRisk ? 'Risk Warning' : 'Safe Threshold'}</strong></span>
        </div>
      </div>
    );
  };

  const renderOrderBookEngine = (params, value, secValue) => {
    const { variant = 'equity', accentColor = '#06b6d4', label = 'Order Book' } = params;
    const buyVolume = value;
    const sellVolume = 100 - value;
    const priceOffset = (value - 50) * 1.5;
    const glowColor = value >= 80 ? 'rgba(34, 211, 238, 0.3)' : 'rgba(124, 58, 237, 0.1)';

    if (variant === 'equity') {
      // Educational: LIVE ORDER BOOK — shows bids stacking up vs asks being hit
      // Slider = buy pressure (0=heavy selling, 100=heavy buying)
      const bidRows = [
        { qty: Math.round(200 + buyVolume * 8), price: (15000 + priceOffset * 90 - 3).toFixed(0), depth: Math.min(95, 30 + buyVolume * 0.7) },
        { qty: Math.round(350 + buyVolume * 6), price: (15000 + priceOffset * 90 - 6).toFixed(0), depth: Math.min(95, 50 + buyVolume * 0.5) },
        { qty: Math.round(500 + buyVolume * 4), price: (15000 + priceOffset * 90 - 9).toFixed(0), depth: Math.min(95, 70 + buyVolume * 0.3) },
        { qty: Math.round(800 + buyVolume * 3), price: (15000 + priceOffset * 90 - 12).toFixed(0), depth: Math.min(95, 90) },
      ];
      const askRows = [
        { qty: Math.round(200 + sellVolume * 8), price: (15000 + priceOffset * 90 + 3).toFixed(0), depth: Math.min(95, 30 + sellVolume * 0.7) },
        { qty: Math.round(350 + sellVolume * 6), price: (15000 + priceOffset * 90 + 6).toFixed(0), depth: Math.min(95, 50 + sellVolume * 0.5) },
        { qty: Math.round(500 + sellVolume * 4), price: (15000 + priceOffset * 90 + 9).toFixed(0), depth: Math.min(95, 70 + sellVolume * 0.3) },
        { qty: Math.round(800 + sellVolume * 3), price: (15000 + priceOffset * 90 + 12).toFixed(0), depth: Math.min(95, 90) },
      ];
      const midPrice = (15000 + priceOffset * 90).toFixed(0);
      const spread = 3;
      const sentiment = buyVolume > 65 ? 'Bullish' : buyVolume < 35 ? 'Bearish' : 'Neutral';
      const sentimentColor = buyVolume > 65 ? '#10b981' : buyVolume < 35 ? '#ef4444' : '#f59e0b';

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[280px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{ background: `radial-gradient(ellipse at 50% 0%, ${sentimentColor}08 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Live Order Book • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-1">
            {/* Header */}
            <div className="flex items-center justify-between text-[7px] font-mono text-slate-500 px-1 mb-0.5">
              <span className="w-12 text-right">QTY</span>
              <span className="flex-1 text-center">PRICE</span>
              <span className="w-12">DEPTH</span>
            </div>

            {/* Ask orders (sells) — show in reverse so lowest ask is nearest to mid */}
            {[...askRows].reverse().map((row, i) => (
              <div key={`ask-${i}`} className="flex items-center gap-1 relative">
                <span className="text-[7.5px] font-mono text-slate-500 w-12 text-right">{row.qty}</span>
                <div className="flex-1 relative h-4 rounded overflow-hidden">
                  <div className="absolute right-0 top-0 h-full rounded transition-all duration-500"
                    style={{ width: `${row.depth}%`, background: 'rgba(239,68,68,0.15)' }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black text-rose-400 font-mono">₹{row.price}</span>
                </div>
                <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/70 rounded-full transition-all duration-500" style={{ width: `${row.depth}%` }} />
                </div>
              </div>
            ))}

            {/* Spread line */}
            <div className="flex items-center gap-1 py-0.5">
              <span className="text-[6.5px] font-mono text-cyan-400 w-12 text-right">MID</span>
              <div className="flex-1 border-t border-cyan-500/30 border-dashed relative">
                <div className="absolute left-1/2 -top-2 -translate-x-1/2 bg-cyan-500/10 border border-cyan-500/30 rounded px-1 py-0.5">
                  <span className="text-[7px] font-black text-cyan-400 font-mono">₹{midPrice}</span>
                </div>
              </div>
              <span className="text-[6.5px] font-mono text-cyan-400 w-12">Spread: {spread}</span>
            </div>

            {/* Bid orders (buys) */}
            {bidRows.map((row, i) => (
              <div key={`bid-${i}`} className="flex items-center gap-1 relative">
                <span className="text-[7.5px] font-mono text-slate-500 w-12 text-right">{row.qty}</span>
                <div className="flex-1 relative h-4 rounded overflow-hidden">
                  <div className="absolute left-0 top-0 h-full rounded transition-all duration-500"
                    style={{ width: `${row.depth}%`, background: 'rgba(16,185,129,0.15)' }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black text-emerald-400 font-mono">₹{row.price}</span>
                </div>
                <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-500" style={{ width: `${row.depth}%` }} />
                </div>
              </div>
            ))}

            {/* Market sentiment bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[7px] font-mono">
                <span className="text-rose-400">Sellers {sellVolume}%</span>
                <span className="font-black" style={{ color: sentimentColor }}>{sentiment}</span>
                <span className="text-emerald-400">Buyers {buyVolume}%</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500/60 transition-all duration-500" style={{ width: `${sellVolume}%` }} />
                <div className="bg-emerald-500/60 transition-all duration-500" style={{ width: `${buyVolume}%` }} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Bids: <strong className="text-emerald-400">{buyVolume}%</strong></span>
            <span>Mid: <strong className="text-cyan-300">₹{midPrice}</strong></span>
            <span>Asks: <strong className="text-rose-400">{sellVolume}%</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'index') {
      // Educational: multi-stock portfolio showing diversification benefit
      // Slider = number of stocks in portfolio (1 to 20)
      const numStocks = Math.max(1, Math.round(value / 5));
      const stocks = [
        { name: 'HDFC', sector: 'Bank', color: '#06b6d4', return: 14.2 },
        { name: 'REL', sector: 'Energy', color: '#8b5cf6', return: 16.8 },
        { name: 'TCS', sector: 'Tech', color: '#10b981', return: 18.4 },
        { name: 'ITC', sector: 'FMCG', color: '#f59e0b', return: 11.2 },
        { name: 'INFY', sector: 'Tech', color: '#3b82f6', return: 17.1 },
        { name: 'SBI', sector: 'Bank', color: '#22d3ee', return: 13.6 },
        { name: 'LNT', sector: 'Infra', color: '#a78bfa', return: 15.3 },
        { name: 'MRF', sector: 'Auto', color: '#fb923c', return: 12.8 },
        { name: 'WIPRO', sector: 'Tech', color: '#34d399', return: 15.9 },
        { name: 'ONGC', sector: 'Energy', color: '#fbbf24', return: 10.4 },
        { name: 'BAJAJ', sector: 'Finance', color: '#f472b6', return: 19.2 },
        { name: 'ASIANP', sector: 'FMCG', color: '#60a5fa', return: 13.1 },
        { name: 'HUL', sector: 'FMCG', color: '#c084fc', return: 12.3 },
        { name: 'TATA', sector: 'Steel', color: '#4ade80', return: 11.8 },
        { name: 'KOTAK', sector: 'Bank', color: '#38bdf8', return: 16.1 },
        { name: 'AXIS', sector: 'Bank', color: '#fb7185', return: 14.7 },
        { name: 'DRRD', sector: 'Pharma', color: '#a3e635', return: 13.9 },
        { name: 'SUNPH', sector: 'Pharma', color: '#fdba74', return: 15.5 },
        { name: 'TITAN', sector: 'Consum', color: '#d946ef', return: 21.3 },
        { name: 'NIFTY', sector: 'Index', color: '#06b6d4', return: 14.5 },
      ];
      const active = stocks.slice(0, numStocks);
      const avgReturn = active.reduce((s, s2) => s + s2.return, 0) / numStocks;
      // Portfolio volatility decreases with more stocks (diversification)
      const volatility = Math.max(8, 28 - numStocks * 0.9);
      const sharpe = (avgReturn / volatility).toFixed(2);

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[270px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Diversification Engine • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-2">
            {/* Stock chips */}
            <div className="flex flex-wrap gap-1">
              {active.map((s, i) => (
                <div key={i}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[6.5px] font-mono font-black transition-all duration-300"
                  style={{
                    background: `${s.color}18`,
                    borderColor: `${s.color}40`,
                    color: s.color,
                    animation: `lab-entrance-fast 0.3s ease ${i * 0.04}s both`
                  }}
                >
                  <span>{s.name}</span>
                  <span style={{ color: s.color }} className="opacity-60">{s.return}%</span>
                </div>
              ))}
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 text-center">
                <div className="text-[7px] text-slate-500 font-mono uppercase">Stocks</div>
                <div className="text-[14px] font-black" style={{ color: accentColor }}>{numStocks}</div>
                <div className="text-[6px] text-slate-600 font-mono">in portfolio</div>
              </div>
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 text-center">
                <div className="text-[7px] text-slate-500 font-mono uppercase">Volatility</div>
                <div className="text-[14px] font-black" style={{ color: volatility > 20 ? '#ef4444' : volatility > 15 ? '#f59e0b' : '#10b981' }}>{volatility.toFixed(0)}%</div>
                <div className="text-[6px] text-slate-600 font-mono">{volatility > 20 ? 'High Risk' : volatility > 15 ? 'Medium' : 'Low Risk'}</div>
              </div>
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 text-center">
                <div className="text-[7px] text-slate-500 font-mono uppercase">Avg Return</div>
                <div className="text-[14px] font-black text-emerald-400">{avgReturn.toFixed(1)}%</div>
                <div className="text-[6px] text-slate-600 font-mono">CAGR</div>
              </div>
            </div>

            {/* Volatility bar — drops as more stocks added */}
            <div>
              <div className="flex justify-between text-[7px] font-mono text-slate-500 mb-1">
                <span>Portfolio Risk (Volatility)</span>
                <span style={{ color: volatility > 20 ? '#ef4444' : '#10b981' }}>{volatility.toFixed(0)}% ↓ as stocks ↑</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(95, (volatility / 30) * 100)}%`,
                    background: `linear-gradient(90deg, ${volatility > 20 ? '#ef4444' : volatility > 15 ? '#f59e0b' : '#10b981'}, ${volatility > 20 ? '#fca5a5' : volatility > 15 ? '#fcd34d' : '#6ee7b7'})`,
                    boxShadow: `0 0 6px ${volatility > 20 ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.4)'}`
                  }}
                />
              </div>
              <div className="text-[6.5px] text-slate-600 font-mono mt-0.5 text-center">
                {numStocks < 5 ? '⚠️ Single-stock risk: one crash wipes portfolio' :
                 numStocks < 12 ? '🟡 Partial diversification: sector events still hurt' :
                 '✅ Well-diversified: unsystematic risk nearly eliminated'}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Portfolio: <strong style={{ color: accentColor }}>{numStocks} stocks</strong></span>
            <span>Sharpe: <strong className="text-cyan-400">{sharpe}</strong></span>
            <span>Return: <strong className="text-emerald-400">{avgReturn.toFixed(1)}%</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'dca') {
      // Educational: Show cost averaging — volatile market but DCA keeps avg price lower
      // Slider = number of SIP months
      const months = Math.max(1, Math.min(12, Math.floor(value / 8) + 1));
      // Simulated volatile price series
      const priceSeries = [100, 85, 120, 70, 110, 95, 130, 80, 115, 105, 90, 125];
      const activePrices = priceSeries.slice(0, months);
      const avgCost = activePrices.reduce((s, p) => s + p, 0) / activePrices.length;
      const currentPrice = activePrices[activePrices.length - 1];
      const investedAmount = months * 1000;
      const units = activePrices.reduce((s, p) => s + (1000 / p), 0);
      const currentValue = units * currentPrice;
      const gainPct = ((currentValue - investedAmount) / investedAmount * 100);

      const chartW = 200, chartH = 70;
      const maxP = 140, minP = 60;
      const toX = (i) => 10 + (i / 11) * 180;
      const toY = (p) => chartH - ((p - minP) / (maxP - minP)) * (chartH - 8) - 4;
      const avgY = toY(avgCost);

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[270px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.05) 0%, transparent 60%)' }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            SIP Cost Averaging • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-2">
            {/* Price chart */}
            <svg className="w-full" viewBox={`0 0 ${chartW} ${chartH}`} style={{ height: '70px' }}>
              <defs>
                <linearGradient id="dcaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.2)" />
                  <stop offset="100%" stopColor="rgba(6,182,212,0)" />
                </linearGradient>
              </defs>

              {/* Full price line (grey = future) */}
              {priceSeries.map((p, i) => {
                if (i === 0) return null;
                const isPast = i < months;
                return (
                  <line key={i}
                    x1={toX(i-1)} y1={toY(priceSeries[i-1])}
                    x2={toX(i)} y2={toY(p)}
                    stroke={isPast ? '#06b6d4' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isPast ? 1.5 : 1}
                    strokeDasharray={isPast ? 'none' : '2,2'}
                  />
                );
              })}

              {/* DCA average line */}
              <line x1={toX(0)} y1={avgY} x2={toX(months - 1)} y2={avgY}
                stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,2"
                className="transition-all duration-500" />
              <text x={toX(months - 1) + 2} y={avgY - 2}
                fontSize="4.5" fill="#f59e0b" fontFamily="monospace" fontWeight="bold">AVG ₹{avgCost.toFixed(0)}</text>

              {/* Buy dots — one per SIP month */}
              {activePrices.map((p, i) => (
                <g key={i}>
                  <circle cx={toX(i)} cy={toY(p)} r="3.5"
                    fill={accentColor} stroke="#020617" strokeWidth="1"
                    style={{ filter: `drop-shadow(0 0 3px ${accentColor})`, animation: `lab-entrance-fast 0.3s ease ${i * 0.08}s both` }} />
                  <text x={toX(i)} y={toY(p) - 5}
                    fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">₹{p}</text>
                </g>
              ))}
            </svg>

            {/* SIP stats */}
            <div className="grid grid-cols-3 gap-1.5">
              {[{ label: 'Invested', val: `₹${investedAmount.toLocaleString()}`, color: '#94a3b8' },
                { label: 'Avg Cost', val: `₹${avgCost.toFixed(0)}`, color: '#f59e0b' },
                { label: 'Value Now', val: `₹${Math.round(currentValue).toLocaleString()}`, color: gainPct >= 0 ? '#10b981' : '#ef4444' }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-1.5 text-center">
                  <div className="text-[6.5px] text-slate-500 font-mono uppercase">{item.label}</div>
                  <div className="text-[10px] font-black font-mono" style={{ color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Gain/loss */}
            <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-[7.5px] font-mono text-slate-400">SIP Profit/Loss after {months} months</span>
              <span className={`text-[11px] font-black font-mono ${gainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
              </span>
            </div>

            <div className="text-[7px] text-slate-500 font-mono text-center">
              DCA smooths out volatility — buy more when cheap, less when expensive
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>SIPs: <strong style={{ color: accentColor }}>{months} months</strong></span>
            <span>Avg: <strong className="text-amber-400">₹{avgCost.toFixed(0)}</strong></span>
            <span>P&amp;L: <strong className={gainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'futures' || variant === 'leverage' || variant === 'margin_call') {
      const percent = value;
      const isDanger = percent >= 75;
      const isWarning = percent >= 45 && !isDanger;
      const liquidColor = isDanger
        ? 'linear-gradient(to top, #be123c, #ef4444 60%, #fca5a5)'
        : isWarning
        ? 'linear-gradient(to top, #92400e, #d97706 60%, #fcd34d)'
        : 'linear-gradient(to top, #064e3b, #10b981 60%, #6ee7b7)';
      const glowColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';

      // Bubble configs for the liquid fill
      const liquidBubbles = [
        { delay: '0s',   left: '20%', size: '3px' },
        { delay: '0.6s', left: '55%', size: '4px' },
        { delay: '1.2s', left: '75%', size: '3px' },
      ];

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* Ambient danger glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500"
            style={{ background: `radial-gradient(ellipse at 50% 80%, ${glowColor}18 0%, transparent 65%)` }}
          />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Leverage Danger Valve • {label}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mt-2 relative gap-3">
            {/* Pressure gauge label */}
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <span className="text-slate-500 uppercase">Margin Pressure</span>
              <span className="font-black" style={{ color: glowColor }}>{percent}%</span>
            </div>

            {/* Valve tube with liquid physics */}
            <div
              className="relative flex items-end overflow-hidden rounded-2xl shadow-[inset_0_3px_10px_rgba(0,0,0,0.7),0_0_0_2px_rgba(255,255,255,0.06)]"
              style={{ width: '52px', height: '120px', background: '#020617' }}
            >
              {/* Glass sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, transparent 40%)' }}
              />

              {/* Liquid level */}
              <div
                className="absolute bottom-0 w-full transition-all duration-600 ease-out"
                style={{ height: `${percent}%` }}
              >
                {/* Morphing liquid surface */}
                <div
                  className="absolute -top-2 left-0 right-0 h-4"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${glowColor}60 0%, transparent 70%)`,
                    animation: `lab-liquid-wave ${isDanger ? '0.8s' : '2s'} ease-in-out infinite`
                  }}
                />
                {/* Liquid body */}
                <div className="w-full h-full" style={{ background: liquidColor }} />
                {/* Rising bubbles */}
                {liquidBubbles.map((b, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/25"
                    style={{
                      width: b.size, height: b.size,
                      left: b.left, bottom: '6px',
                      animation: `lab-bubble-rise 1.6s ease-out ${b.delay} infinite`
                    }}
                  />
                ))}
              </div>

              {/* Tick marks on side */}
              {[25, 50, 75].map(tick => (
                <div
                  key={tick}
                  className="absolute right-0 w-2 h-px bg-white/20"
                  style={{ bottom: `${tick}%` }}
                />
              ))}

              {/* Danger zone stripe above 75% */}
              <div
                className="absolute w-full pointer-events-none"
                style={{
                  bottom: '75%',
                  top: 0,
                  background: 'repeating-linear-gradient(-45deg, rgba(239,68,68,0.06) 0px, rgba(239,68,68,0.06) 4px, transparent 4px, transparent 10px)'
                }}
              />

              {/* Glow on valve */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
                style={{ boxShadow: `inset 0 0 12px ${glowColor}30, 0 0 ${isDanger ? 20 : 8}px ${glowColor}50` }}
              />
            </div>

            {/* Margin collapse overlay */}
            {isDanger && (
              <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-3 rounded-3xl" style={{ animation: 'lab-ambient-breathe 0.6s ease-in-out infinite' }}>
                <span className="text-3xl">🚨</span>
                <span className="text-xs font-black text-red-400 font-mono tracking-wider uppercase mt-1">MARGIN COLLAPSE</span>
                <span className="text-[8px] text-slate-300 font-mono mt-0.5">Leverage exceeded safe threshold</span>
                <div className="mt-2 w-24 h-1 bg-red-900 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: '100%', animation: 'lab-shimmer 1s linear infinite' }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Leverage: <strong className="text-white">{Math.round(percent / 10)}x</strong></span>
            <span>Margin Used: <strong style={{ color: glowColor }}>{percent}%</strong></span>
            <span>Risk: <strong style={{ color: glowColor }}>{isDanger ? 'CRITICAL' : isWarning ? 'HIGH' : 'SAFE'}</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'short_sell') {
      // Educational: Price chart with shaded profit zone
      const entryPrice = 60;
      const currentPrice = Math.round(100 - value); // slider down = price drops = profit for short
      const profit = entryPrice - currentPrice;
      const isProfit = profit >= 0;
      const profitPct = ((profit / entryPrice) * 100).toFixed(1);

      // Chart coords
      const chartH = 60, chartW = 180;
      const prices = [60, 58, 62, 55, 50, currentPrice];
      const maxP = 70, minP = 30;
      const toX2 = (i) => 10 + (i / (prices.length - 1)) * (chartW - 20);
      const toY2 = (p) => chartH - ((p - minP) / (maxP - minP)) * (chartH - 10) - 5;
      const entryY = toY2(entryPrice);
      const currentY = toY2(currentPrice);
      const pathD = prices.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX2(i)} ${toY2(p)}`).join(' ');
      const fillD = pathD + ` L ${toX2(prices.length-1)} ${chartH} L ${toX2(0)} ${chartH} Z`;

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[260px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, ${isProfit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'} 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Short Selling Simulator • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-2">
            {/* Price chart with profit/loss zone */}
            <svg className="w-full" viewBox={`0 0 ${chartW} ${chartH}`} style={{ height: '70px' }}>
              <defs>
                <linearGradient id="shortAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isProfit ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              {isProfit ? (
                <rect x={toX2(0)} y={currentY} width={chartW - 20} height={Math.max(0, entryY - currentY)}
                  fill="rgba(16,185,129,0.08)" className="transition-all duration-500" />
              ) : (
                <rect x={toX2(0)} y={entryY} width={chartW - 20} height={Math.max(0, currentY - entryY)}
                  fill="rgba(239,68,68,0.08)" className="transition-all duration-500" />
              )}
              <path d={fillD} fill="url(#shortAreaGrad)" className="transition-all duration-300" />
              <path d={pathD} fill="none" stroke={isProfit ? '#10b981' : '#ef4444'} strokeWidth="2" className="transition-all duration-300" />
              <line x1={toX2(0)} y1={entryY} x2={chartW - 10} y2={entryY}
                stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
              <text x={chartW - 8} y={entryY - 2} fontSize="4" fill="#f59e0b" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                SHORT @₹{entryPrice}
              </text>
              <circle cx={toX2(prices.length-1)} cy={currentY} r="3.5"
                fill={isProfit ? '#10b981' : '#ef4444'}
                style={{ filter: `drop-shadow(0 0 4px ${isProfit ? '#10b981' : '#ef4444'})`, animation: 'lab-orb-pulse 1.5s infinite' }} />
              <text x={toX2(prices.length-1)} y={currentY - 6} fontSize="4" fill={isProfit ? '#10b981' : '#ef4444'} textAnchor="middle" fontFamily="monospace">₹{currentPrice}</text>
            </svg>

            {/* P&L summary */}
            <div className="flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-500"
              style={{ background: isProfit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderColor: isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <div>
                <div className="text-[7px] text-slate-500 font-mono uppercase">Short P&amp;L</div>
                <div className="text-[18px] font-black font-mono" style={{ color: isProfit ? '#10b981' : '#ef4444' }}>
                  {isProfit ? '+' : '-'}₹{Math.abs(profit)}
                </div>
                <div className="text-[7px] font-mono" style={{ color: isProfit ? '#34d399' : '#fca5a5' }}>
                  {isProfit ? '+' : ''}{profitPct}% return
                </div>
              </div>
              <div className="text-right">
                <div className="text-[7px] text-slate-500 font-mono uppercase">How short works</div>
                <div className="text-[7px] text-slate-400 font-mono leading-tight max-w-[90px] text-right mt-0.5">
                  Borrow &amp; sell @₹{entryPrice}<br/>
                  {isProfit ? `Buy back @₹${currentPrice} ✓ Keep diff` : `Must buy @₹${currentPrice} ✗ Pay diff`}
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between text-[6.5px] font-mono text-slate-500">
              {['Borrow\nShares', '→ Sell\nHigh', isProfit ? '→ Buy\nLow ✓' : '→ Buy\nHigh ✗', 'Return\nShares'].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black mb-0.5 ${i === 2 ? (isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400') : 'bg-slate-800 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="text-center whitespace-pre-line leading-tight" style={{ color: i === 2 ? (isProfit ? '#10b981' : '#ef4444') : '#64748b' }}>{step}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Entry: <strong className="text-amber-400">₹{entryPrice}</strong></span>
            <span>Spot: <strong className="text-white">₹{currentPrice}</strong></span>
            <span>P&amp;L: <strong style={{ color: isProfit ? '#10b981' : '#ef4444' }}>{isProfit ? '+' : ''}₹{profit}</strong></span>
          </div>
        </div>
      );
    }



    if (variant === 'arbitrage') {
      // Educational: Show live price gap closing — arbitrageur buys low, sells high, gap narrows
      const priceNSE = 1500;
      const priceBSE = 1500 + (value / 5);
      const spread = (priceBSE - priceNSE).toFixed(1);
      const profit = ((value / 5) * 100).toFixed(0); // per 100 shares
      const gapClosing = value > 15; // above 15 slider = gap too large = arb kicks in
      const opportunity = value > 0 ? 'Active' : 'No Gap';
      const opportunityColor = value > 15 ? '#10b981' : value > 5 ? '#f59e0b' : '#64748b';

      return (
        <div className="relative w-full max-w-sm h-auto min-h-[260px] bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, ${value > 5 ? 'rgba(16,185,129,0.06)' : 'transparent'} 0%, transparent 60%)` }} />

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Arbitrage Gap Scanner • {label}
          </div>

          <div className="flex-1 flex flex-col mt-5 gap-2">
            {/* Two exchange price cards */}
            <div className="flex gap-2 items-stretch">
              <div className="flex-1 bg-blue-950/30 border border-blue-500/20 rounded-2xl p-3 flex flex-col items-center">
                <div className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">NSE</div>
                <div className="text-[20px] font-black text-white">₹{priceNSE}</div>
                <div className="text-[6.5px] text-blue-400 font-mono mt-1">National Exchange</div>
                <div className="mt-2 w-full">
                  <div className="text-[6px] text-slate-500 font-mono text-center mb-0.5">Buy here</div>
                  <div className="w-full h-1.5 bg-blue-900/50 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Gap arrow */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="text-[6.5px] text-slate-500 font-mono">SPREAD</div>
                <div className="font-black text-[14px] transition-all duration-300" style={{ color: opportunityColor }}>
                  ₹{spread}
                </div>
                <div
                  className="text-emerald-400 text-base transition-all duration-300"
                  style={{ animation: value > 5 ? 'lab-float 0.8s ease-in-out infinite' : 'none' }}
                >
                  {value > 5 ? '⇒' : '↔'}
                </div>
                <div className="text-[6px] font-mono" style={{ color: opportunityColor }}>{opportunity}</div>
              </div>

              <div className="flex-1 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3 flex flex-col items-center">
                <div className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1">BSE</div>
                <div className="text-[20px] font-black text-white transition-all duration-300">₹{priceBSE.toFixed(0)}</div>
                <div className="text-[6.5px] text-emerald-400 font-mono mt-1">Bombay Exchange</div>
                <div className="mt-2 w-full">
                  <div className="text-[6px] text-slate-500 font-mono text-center mb-0.5">Sell here</div>
                  <div className="w-full h-1.5 bg-emerald-900/50 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (priceBSE / 1520) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Profit display */}
            {value > 0 && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl px-3 py-2 flex items-center justify-between">
                <div>
                  <div className="text-[7px] text-slate-500 font-mono uppercase">Arb Profit (100 shares)</div>
                  <div className="text-[14px] font-black text-emerald-400">₹{profit}</div>
                </div>
                <div className="text-[7.5px] text-slate-400 font-mono max-w-[110px] text-right leading-tight">
                  Buy {100} @ NSE ₹{priceNSE}<br/>
                  Sell {100} @ BSE ₹{priceBSE.toFixed(0)}<br/>
                  <span className="text-emerald-400">Profit = ₹{spread}/share</span>
                </div>
              </div>
            )}

            {/* Gap closing insight */}
            <div className="text-[7px] text-slate-500 font-mono text-center bg-slate-900/40 rounded-xl px-2 py-1.5">
              {value === 0 ? 'No price gap — market is perfectly efficient' :
               value < 8 ? '⚠️ Small gap — transaction costs may eat the profit' :
               '✅ Arb traders will buy NSE + sell BSE until prices equalise'}
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>NSE: <strong className="text-blue-400">₹{priceNSE}</strong></span>
            <span>Gap: <strong style={{ color: opportunityColor }}>₹{spread}</strong></span>
            <span>BSE: <strong className="text-emerald-400">₹{priceBSE.toFixed(0)}</strong></span>
          </div>
        </div>
      );
    }

    if (variant === 'barter') {
      const val = value;
      
      let exchangeLabel = "Double Coincidence";
      let efficiencyLabel = "Stable";
      let exchangeColor = "#10b981";
      let efficiencyColor = "#10b981";
      
      if (val >= 4 && val < 8) {
        exchangeLabel = `Indirect Loop (${val} Trades)`;
        efficiencyLabel = "Low / Frictional";
        exchangeColor = "#fb923c";
        efficiencyColor = "#fb923c";
      } else if (val >= 8) {
        exchangeLabel = "Coincidence Breakdown";
        efficiencyLabel = "System Collapse (0%)";
        exchangeColor = "#f43f5e";
        efficiencyColor = "#f43f5e";
      }

      return (
        <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          {/* flow-barter, bounce-subtle, spin-slow, pulse-error defined in LabAnimations.css */}

          <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            Barter Ledger Exchange • {label}
          </div>

          <div className="flex-1 flex items-center justify-center relative mt-4">
            {val < 4 && (
              <svg className="w-full h-36" viewBox="0 0 120 80">
                <defs>
                  <linearGradient id="nodeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Swap Lines */}
                <path d="M 32 35 Q 60 22 88 35" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.1" />
                <path d="M 32 35 Q 60 22 88 35" fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4,6" 
                      style={{ animation: 'flow-barter 1.2s linear infinite' }} />
                
                <path d="M 88 45 Q 60 58 32 45" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.1" />
                <path d="M 88 45 Q 60 58 32 45" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4,6" 
                      style={{ animation: 'flow-barter 1.2s linear infinite reverse' }} />

                {/* Left Node */}
                <g transform="translate(15, 25)">
                  <g style={{ animation: 'bounce-subtle 3s infinite ease-in-out' }}>
                    <circle cx="10" cy="15" r="14" fill="url(#nodeGlow)" stroke="#3b82f6" strokeWidth="1" />
                    <text x="10" y="19" fontSize="11" textAnchor="middle" className="select-none">🌾</text>
                    <text x="10" y="36" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">FARMER A</text>
                    <text x="10" y="42" fontSize="3.5" fill="#f43f5e" textAnchor="middle" fontFamily="monospace">Wants: 🍎</text>
                  </g>
                </g>

                {/* Swap Center Icon */}
                <g transform="translate(60, 40)">
                  <circle cx="0" cy="0" r="8" fill="#0f172a" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                  <text x="0" y="2.5" fontSize="7" textAnchor="middle" style={{ display: 'inline-block', transformOrigin: '0px 0px', animation: 'spin-slow 6s linear infinite' }}>🔄</text>
                </g>

                {/* Right Node */}
                <g transform="translate(81, 25)">
                  <g style={{ animation: 'bounce-subtle 3s infinite ease-in-out 1.5s' }}>
                    <circle cx="10" cy="15" r="14" fill="url(#nodeGlow)" stroke="#10b981" strokeWidth="1" />
                    <text x="10" y="19" fontSize="11" textAnchor="middle" className="select-none">🍎</text>
                    <text x="10" y="36" fontSize="4.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">FARMER B</text>
                    <text x="10" y="42" fontSize="3.5" fill="#fbbf24" textAnchor="middle" fontFamily="monospace">Wants: 🌾</text>
                  </g>
                </g>
              </svg>
            )}

            {val >= 4 && val < 8 && (
              <svg className="w-full h-36" viewBox="0 0 120 80">
                <defs>
                  <linearGradient id="nodeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Triangle Flow Lines */}
                {/* A -> C */}
                <path d="M 52 28 Q 40 40 32 50" fill="none" stroke="#fcd34d" strokeWidth="1.2" strokeDasharray="3,4" 
                      style={{ animation: 'flow-barter 1.5s linear infinite' }} />
                {/* C -> B */}
                <path d="M 38 60 Q 60 68 82 60" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3,4" 
                      style={{ animation: 'flow-barter 1.5s linear infinite' }} />
                {/* B -> A */}
                <path d="M 88 50 Q 80 40 68 28" fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3,4" 
                      style={{ animation: 'flow-barter 1.5s linear infinite' }} />

                {/* Node A (Top) */}
                <g transform="translate(50, 6)">
                  <g style={{ animation: 'bounce-subtle 4s infinite ease-in-out' }}>
                    <circle cx="10" cy="11" r="11" fill="url(#nodeGlow)" stroke="#fcd34d" strokeWidth="0.8" />
                    <text x="10" y="14" fontSize="8" textAnchor="middle" className="select-none">🌾</text>
                    <text x="10" y="27" fontSize="4" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">A (Has 🌾)</text>
                    <text x="10" y="32" fontSize="3" fill="#f43f5e" textAnchor="middle" fontFamily="monospace">Needs: 🍎</text>
                  </g>
                </g>

                {/* Node B (Right) */}
                <g transform="translate(80, 42)">
                  <g style={{ animation: 'bounce-subtle 4s infinite ease-in-out 1s' }}>
                    <circle cx="10" cy="11" r="11" fill="url(#nodeGlow)" stroke="#f43f5e" strokeWidth="0.8" />
                    <text x="10" y="14" fontSize="8" textAnchor="middle" className="select-none">🍎</text>
                    <text x="10" y="27" fontSize="4" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">B (Has 🍎)</text>
                    <text x="10" y="32" fontSize="3" fill="#38bdf8" textAnchor="middle" fontFamily="monospace">Needs: 🐟</text>
                  </g>
                </g>

                {/* Node C (Left) */}
                <g transform="translate(20, 42)">
                  <g style={{ animation: 'bounce-subtle 4s infinite ease-in-out 2s' }}>
                    <circle cx="10" cy="11" r="11" fill="url(#nodeGlow)" stroke="#38bdf8" strokeWidth="0.8" />
                    <text x="10" y="14" fontSize="8" textAnchor="middle" className="select-none">🐟</text>
                    <text x="10" y="27" fontSize="4" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">C (Has 🐟)</text>
                    <text x="10" y="32" fontSize="3" fill="#fcd34d" textAnchor="middle" fontFamily="monospace">Needs: 🌾</text>
                  </g>
                </g>

                {/* Central Status readout */}
                <g transform="translate(60, 46)">
                  <rect x="-18" y="-5" width="36" height="10" rx="1.5" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                  <text x="0" y="1" fontSize="3.5" fill="#fb923c" textAnchor="middle" fontFamily="monospace" fontWeight="bold" className="animate-pulse">
                    Frictional Loop
                  </text>
                </g>
              </svg>
            )}

            {val >= 8 && (
              <svg className="w-full h-36" viewBox="0 0 120 80">
                <defs>
                  <linearGradient id="nodeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Broken, crossed, flashing red coordination paths */}
                <line x1="60" y1="20" x2="90" y2="38" stroke="#ef4444" strokeWidth="1" strokeDasharray="1,2" className="pulse-error" style={{ animation: 'pulse-error 1s infinite' }} />
                <line x1="90" y1="38" x2="80" y2="65" stroke="#ef4444" strokeWidth="1" strokeDasharray="1,2" className="pulse-error" style={{ animation: 'pulse-error 1s infinite' }} />
                <line x1="80" y1="65" x2="40" y2="65" stroke="#ef4444" strokeWidth="1" strokeDasharray="1,2" className="pulse-error" style={{ animation: 'pulse-error 1s infinite' }} />
                <line x1="40" y1="65" x2="30" y2="38" stroke="#ef4444" strokeWidth="1" strokeDasharray="1,2" className="pulse-error" style={{ animation: 'pulse-error 1s infinite' }} />
                <line x1="30" y1="38" x2="60" y2="20" stroke="#ef4444" strokeWidth="1" strokeDasharray="1,2" className="pulse-error" style={{ animation: 'pulse-error 1s infinite' }} />

                <line x1="60" y1="20" x2="80" y2="65" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="1,1" opacity="0.3" />
                <line x1="30" y1="38" x2="90" y2="38" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="1,1" opacity="0.3" />

                {/* Node 1 */}
                <circle cx="60" cy="20" r="7.5" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="0.6" />
                <text x="60" y="22.5" fontSize="6.2" textAnchor="middle" className="select-none">🌾</text>
                
                {/* Node 2 */}
                <circle cx="90" cy="38" r="7.5" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="0.6" />
                <text x="90" y="40.5" fontSize="6.2" textAnchor="middle" className="select-none">🍎</text>

                {/* Node 3 */}
                <circle cx="80" cy="65" r="7.5" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="0.6" />
                <text x="80" y="67.5" fontSize="6.2" textAnchor="middle" className="select-none">🐟</text>

                {/* Node 4 */}
                <circle cx="40" cy="65" r="7.5" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="0.6" />
                <text x="40" y="67.5" fontSize="6.2" textAnchor="middle" className="select-none">🍌</text>

                {/* Node 5 */}
                <circle cx="30" cy="38" r="7.5" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="0.6" />
                <text x="30" y="40.5" fontSize="6.2" textAnchor="middle" className="select-none">🥛</text>

                {/* Central Breakdown Banner */}
                <g transform="translate(60, 44)">
                  <rect x="-24" y="-6" width="48" height="12" rx="2" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="0.6" />
                  <text x="0" y="1.5" fontSize="3.8" fill="#fecdd3" textAnchor="middle" fontFamily="monospace" fontWeight="black" className="animate-pulse">
                    ⚠️ COINCIDENCE GAP
                  </text>
                </g>
              </svg>
            )}
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Exchange: <strong style={{ color: exchangeColor }}>{exchangeLabel}</strong></span>
            <span>Efficiency: <strong style={{ color: efficiencyColor }}>{efficiencyLabel}</strong></span>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPlumbingEngine = (params, value, secValue) => {
    const { variant = 'fcf', accentColor = '#38bdf8', label = 'Cashflow Plumbing' } = params;
    const val = value;
    const rate = secValue !== undefined ? secValue : 50;
    const duration = Math.max(0.6, 2.5 - (val / 50));

    return (
      <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
        {/* Title */}
        <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Plumbing Lab • {label}
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative mt-2 w-full">
          
          {variant === 'fcf' && (() => {
            const fcfPct = val;
            const capexPct = 100 - val;
            
            const flowCFO = 'flow 1.2s linear infinite';
            const flowCapEx = capexPct > 5 ? `flow ${Math.max(0.4, 2.0 - (capexPct/50))}s linear infinite` : 'none';
            const flowFCF = fcfPct > 5 ? `flow ${Math.max(0.4, 2.0 - (fcfPct/50))}s linear infinite` : 'none';

            return (
              <svg className="w-48 h-36 overflow-visible" viewBox="0 0 120 90">
                <defs>
                  <linearGradient id="pipeGradFCF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>

                {/* Main pipes network */}
                {/* CFO pipe */}
                <path d="M 10 25 L 55 25" fill="none" stroke="url(#pipeGradFCF)" strokeWidth="6" strokeLinecap="round" />
                {/* CapEx diversion (Downwards) */}
                <path d="M 55 25 L 55 65" fill="none" stroke="url(#pipeGradFCF)" strokeWidth="6" strokeLinecap="round" />
                {/* FCF outflow (Rightward + Downward) */}
                <path d="M 55 25 L 105 25 L 105 55" fill="none" stroke="url(#pipeGradFCF)" strokeWidth="6" strokeLinecap="round" />

                {/* Animated dash flows */}
                <path d="M 10 25 L 55 25" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="5,4" style={{ animation: flowCFO }} />
                {capexPct > 5 && (
                  <path d="M 55 25 L 55 65" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5,4" style={{ animation: flowCapEx }} />
                )}
                {fcfPct > 5 && (
                  <path d="M 55 25 L 105 25 L 105 55" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5,4" style={{ animation: flowFCF }} />
                )}

                {/* Left Source text */}
                <text x="12" y="15" fontSize="4.5" fill="#60a5fa" fontWeight="black" fontFamily="monospace">CFO (100%)</text>

                {/* CapEx Drain box */}
                <g transform="translate(43, 65)">
                  <rect x="0" y="0" width="24" height="15" rx="2" fill="#1a0f0f" stroke="#ef4444" strokeWidth="1" />
                  <text x="12" y="6" fontSize="3.8" fill="#fca5a5" textAnchor="middle" fontWeight="bold" fontFamily="monospace">CAPEX</text>
                  <text x="12" y="11" fontSize="4.5" fill="#f43f5e" textAnchor="middle" fontWeight="black" fontFamily="monospace">{capexPct}%</text>
                </g>

                {/* FCF Storage canister */}
                <g transform="translate(93, 55)">
                  <rect x="0" y="0" width="24" height="25" rx="3" fill="#0d1b15" stroke="#10b981" strokeWidth="1.5" />
                  {/* FCF Cash fill level */}
                  <rect x="1.5" y={23.5 - 22 * (fcfPct/100)} width="21" height={22 * (fcfPct/100)} fill="#059669" opacity="0.85" className="transition-all duration-500" />
                  <text x="12" y="12" fontSize="4.2" fill="#fff" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="drop-shadow">FCF</text>
                  <text x="12" y="19" fontSize="4.8" fill="#34d399" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="drop-shadow">{fcfPct}%</text>
                </g>
              </svg>
            );
          })()}

          {variant === 'working_cap' && (() => {
            const days = val;
            const cycleSpeed = Math.max(0.3, 3.2 - (days / 40));
            const isTrapped = days > 65;
            
            // Diameters based on asset/cash locking
            // In high WC cycle: inventory & receives expand, cash shrinks
            const invR = days > 65 ? 12 + (days - 65)*0.1 : 12;
            const recR = days > 65 ? 12 + (days - 65)*0.12 : 12;
            const cashR = days > 65 ? Math.max(7, 12 - (days - 65)*0.08) : 12;

            const loopFlow = `flow ${cycleSpeed}s linear infinite`;

            return (
              <svg className="w-48 h-36 overflow-visible" viewBox="0 0 120 90">
                <defs>
                  <linearGradient id="nodeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Cyclic Loop Paths */}
                {/* Inventory -> Receivables */}
                <path d="M 30 25 H 90" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 30 25 H 90" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,4" style={{ animation: loopFlow }} />

                {/* Receivables -> Cash */}
                <path d="M 90 25 V 65" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 90 25 V 65" fill="none" stroke="#fb923c" strokeWidth="1.2" strokeDasharray="4,4" style={{ animation: loopFlow }} />

                {/* Cash -> Payables */}
                <path d="M 90 65 H 30" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 90 65 H 30" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="4,4" style={{ animation: `${loopFlow} reverse` }} />

                {/* Payables -> Inventory */}
                <path d="M 30 65 V 25" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />
                <path d="M 30 65 V 25" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,4" style={{ animation: `${loopFlow} reverse` }} />

                {/* Inventory Node (Top Left) */}
                <g transform="translate(30, 25)">
                  <circle cx="0" cy="0" r={invR} fill="url(#nodeGlow)" stroke="#38bdf8" strokeWidth="1" className="transition-all duration-300" />
                  <text x="0" y="-1" fontSize="4.5" fill="#38bdf8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">INV</text>
                  <text x="0" y="3.5" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">Stock</text>
                </g>

                {/* Receivables Node (Top Right) */}
                <g transform="translate(90, 25)">
                  <circle cx="0" cy="0" r={recR} fill="url(#nodeGlow)" stroke="#fb923c" strokeWidth="1" className="transition-all duration-300" />
                  <text x="0" y="-1" fontSize="4.5" fill="#fb923c" textAnchor="middle" fontWeight="bold" fontFamily="monospace">REC</text>
                  <text x="0" y="3.5" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">Bills</text>
                </g>

                {/* Cash Node (Bottom Right) */}
                <g transform="translate(90, 65)">
                  <circle cx="0" cy="0" r={cashR} fill={isTrapped ? '#0c1a16' : '#14532d'} stroke="#10b981" strokeWidth={isTrapped ? 0.8 : 1.5} className="transition-all duration-300" />
                  <text x="0" y="-1" fontSize="4.5" fill="#10b981" textAnchor="middle" fontWeight="bold" fontFamily="monospace">CASH</text>
                  <text x="0" y="3.5" fontSize="3.5" fill="#e6fffa" textAnchor="middle" fontFamily="monospace">Ready</text>
                </g>

                {/* Payables Node (Bottom Left) */}
                <g transform="translate(30, 65)">
                  <circle cx="0" cy="0" r="11" fill="url(#nodeGlow)" stroke="#ef4444" strokeWidth="1" />
                  <text x="0" y="-1" fontSize="4.5" fill="#ef4444" textAnchor="middle" fontWeight="bold" fontFamily="monospace">PAY</text>
                  <text x="0" y="3.5" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">Owed</text>
                </g>

                {/* Loop Center days readout */}
                <g transform="translate(60, 45)">
                  <circle cx="0" cy="0" r="11" fill="#030712" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                  <text x="0" y="-2" fontSize="4" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">CYCLE</text>
                  <text x="0" y="3" fontSize="5" fill="#fcd34d" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="animate-pulse">
                    {days}D
                  </text>
                </g>

                {/* Alert banner if trapped */}
                {isTrapped && (
                  <g transform="translate(60, 10)" className="animate-pulse">
                    <rect x="-30" y="-5" width="60" height="9" rx="1" fill="#7f1d1d" stroke="#f43f5e" strokeWidth="0.5" />
                    <text x="0" y="1.2" fontSize="3.5" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                      ⚠️ CASH TRAPPED
                    </text>
                  </g>
                )}
              </svg>
            );
          })()}

          {variant === 'current_ratio' && (() => {
            const isDanger = val < 1.0;
            const isOptimal = val >= 2.0 && val < 2.5;
            
            // Assets fluid height based on current ratio
            const assetsH = Math.min(60, 15 + (val / 2) * 22);

            return (
              <svg className="w-48 h-36 overflow-visible" viewBox="0 0 120 90">
                <defs>
                  <linearGradient id="assetFluid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="liabFluid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#9f1239" />
                  </linearGradient>
                </defs>

                {/* Current Assets Cylinder (Left) */}
                <g>
                  <rect x="25" y="15" width="22" height="60" rx="4" fill="#090d16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
                  {/* Fluid Fill */}
                  <rect x="26.5" y={73.5 - assetsH} width="19" height={assetsH} rx="2" fill="url(#assetFluid)" opacity="0.8" className="transition-all duration-500" />
                  
                  <text x="36" y="10" fontSize="4.5" fill="#34d399" textAnchor="middle" fontWeight="bold" fontFamily="monospace">ASSETS</text>
                  <text x="36" y="70" fontSize="5.5" fill="#fff" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="drop-shadow">
                    ₹{Math.round(val * 100)}k
                  </text>
                </g>

                {/* Current Liabilities Cylinder (Right, Fixed at 100k equivalent) */}
                <g>
                  <rect x="73" y="15" width="22" height="60" rx="4" fill="#090d16" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
                  {/* Fluid Fill (Fixed height = 30) */}
                  <rect x="74.5" y="43.5" width="19" height="30" rx="2" fill="url(#liabFluid)" opacity="0.8" />
                  
                  <text x="84" y="10" fontSize="4.5" fill="#f43f5e" textAnchor="middle" fontWeight="bold" fontFamily="monospace">LIABS</text>
                  <text x="84" y="70" fontSize="5.5" fill="#fff" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="drop-shadow">
                    ₹100k
                  </text>
                </g>

                {/* central ratio dial */}
                <g transform="translate(60, 42)">
                  <circle cx="0" cy="0" r="8.5" fill="#020617" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                  <text x="0" y="2.5" fontSize="5" fill={isDanger ? '#f43f5e' : isOptimal ? '#10b981' : '#38bdf8'} textAnchor="middle" fontWeight="black" fontFamily="monospace" className="animate-pulse">
                    {val}x
                  </text>
                </g>

                {/* Alert banners */}
                {isDanger && (
                  <g transform="translate(60, 83)" className="animate-pulse">
                    <rect x="-28" y="-4" width="56" height="8" rx="1" fill="#7f1d1d" stroke="#ef4444" strokeWidth="0.5" />
                    <text x="0" y="1.5" fontSize="3.5" fill="#fecdd3" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                      🚨 LIQUIDITY CRISIS
                    </text>
                  </g>
                )}

                {isOptimal && (
                  <g transform="translate(60, 83)">
                    <rect x="-28" y="-4" width="56" height="8" rx="1" fill="#064e3b" stroke="#10b981" strokeWidth="0.5" />
                    <text x="0" y="1.5" fontSize="3.5" fill="#a7f3d0" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                      ✓ GOLD STANDARD
                    </text>
                  </g>
                )}
              </svg>
            );
          })()}

          {variant === 'expense_ratio' && (() => {
            const feeRate = val;
            const finalWealth = 100000 * Math.pow(1 + (8 - feeRate)/100, 30);
            const totalFees = 100000 * Math.pow(1.08, 30) - finalWealth;
            const lossPct = (totalFees / (100000 * Math.pow(1.08, 30)) * 100).toFixed(0);

            // Faucet drip speed based on fee rate
            const dripDuration = feeRate === 0 ? '0s' : `${Math.max(0.3, 1.8 - feeRate*0.5)}s`;

            return (
              <div className="w-full flex items-center justify-between gap-3 px-1">
                {/* Left side: leaking MF pool */}
                <div className="w-[100px] h-[120px] relative flex flex-col items-center shrink-0">
                  <div className="relative w-18 h-24 rounded-2xl border border-cyan-500/20 bg-slate-950 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                    {/* Glass sheen */}
                    <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />
                    
                    {/* Pool asset liquid */}
                    <div className="absolute bottom-0 w-full h-[75%] bg-gradient-to-t from-cyan-900 via-cyan-600/90 to-cyan-400/80" />

                    {/* Telemetry info inside pool */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono z-10">
                      <span className="text-[6.5px] text-cyan-200 font-black tracking-wider uppercase">Asset Pool</span>
                      <span className="text-[10px] font-black text-white mt-0.5">₹1.0L</span>
                    </div>

                    {/* Leaky fee faucet */}
                    <path d="M 36 84 L 36 94" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" className="absolute bottom-0 left-1/2 -translate-x-1/2" />
                    
                    {/* Leaking fee coins */}
                    {feeRate > 0 && (
                      <>
                        <circle cx="36" cy="94" r="1.5" fill="#f59e0b" style={{ animation: `drip ${dripDuration} infinite linear`, animationDelay: '0s' }} className="absolute bottom-0 left-1/2 -translate-x-1/2" />
                        <circle cx="36" cy="94" r="1.5" fill="#f59e0b" style={{ animation: `drip ${dripDuration} infinite linear`, animationDelay: `${parseFloat(dripDuration)/2}s` }} className="absolute bottom-0 left-1/2 -translate-x-1/2" />
                      </>
                    )}
                  </div>
                  <span className="text-[7.5px] text-slate-500 font-mono mt-1 font-bold">ER: {feeRate}% p.a.</span>
                </div>

                {/* Right side: 30-year outcome bars */}
                <div className="flex-1 flex flex-col gap-1.5 font-mono">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black text-center mb-0.5">30-Yr Wealth Outcome</span>
                  
                  {/* Your Wealth Bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px]">
                      <span className="text-emerald-400">Final Wealth:</span>
                      <span className="text-white font-bold">₹{Math.round(finalWealth/1000)}k</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 border border-white/5 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded transition-all duration-500" style={{ width: `${(finalWealth / 1006265) * 100}%` }} />
                    </div>
                  </div>

                  {/* Siphoned Fees Bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[7.5px]">
                      <span className="text-rose-400">Fees Siphoned:</span>
                      <span className="text-rose-300 font-bold">₹{Math.round(totalFees/1000)}k</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 border border-white/5 rounded overflow-hidden">
                      <div className="h-full bg-rose-500 rounded transition-all duration-500" style={{ width: `${(totalFees / 1006265) * 100}%` }} />
                    </div>
                  </div>

                  {/* Alert panel */}
                  <div className="mt-1 text-[7px] bg-rose-500/10 border border-rose-500/20 rounded-xl p-1.5 text-center text-rose-300 animate-pulse">
                    <strong>{lossPct}% of potential returns lost</strong> to fees over 30 yrs!
                  </div>
                </div>
              </div>
            );
          })()}

          {variant === 'dividend' && (() => {
            const payout = val;
            const reinv = 100 - val;
            
            // Vault size increases if reinvestment is high
            const vaultScale = 0.75 + (reinv / 100) * 0.45;
            const vaultGlow = `drop-shadow(0 0 ${reinv/5}px rgba(16,185,129,0.35))`;

            // Coin drip interval speeds
            const dripDuration = payout === 0 ? '0s' : `${Math.max(0.4, 2.0 - payout*0.016)}s`;

            return (
              <div className="w-full flex items-center justify-between gap-3 px-1">
                {/* Left side: Corporate reinvestment vault */}
                <div className="w-[110px] h-[120px] flex flex-col items-center justify-center shrink-0">
                  <div className="relative flex items-center justify-center transition-all duration-500"
                       style={{ 
                         transform: `scale(${vaultScale})`,
                         filter: reinv > 20 ? vaultGlow : 'none'
                       }}>
                    {/* SVG 3D Corporate Vault */}
                    <svg className="w-18 h-18 overflow-visible" viewBox="0 0 40 40">
                      <rect x="2" y="2" width="36" height="36" rx="4" fill="#334155" stroke="#475569" strokeWidth="1.5" />
                      <rect x="4" y="4" width="32" height="32" rx="3" fill="#0f172a" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                      
                      {/* Vault lock dial */}
                      <circle cx="20" cy="20" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                      <line x1="20" y1="12" x2="20" y2="28" stroke="#64748b" strokeWidth="0.8" />
                      <line x1="12" y1="20" x2="28" y2="20" stroke="#64748b" strokeWidth="0.8" />
                      
                      {/* Reinvestment label inside vault */}
                      <text x="20" y="32" fontSize="4.2" fill="#10b981" textAnchor="middle" fontWeight="black" fontFamily="monospace">
                        {reinv}% GROW
                      </text>
                    </svg>
                  </div>
                  <span className="text-[7.5px] text-slate-500 font-mono mt-1.5 font-bold">Retained: {reinv}%</span>
                </div>

                {/* Center pipeline / drips siphoner */}
                <div className="w-6 h-20 relative flex items-center justify-center shrink-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 10 40">
                    <line x1="0" y1="20" x2="10" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="2,2" />
                    {payout > 0 && (
                      <>
                        <circle cx="5" cy="20" r="1.5" fill="#f59e0b" style={{ animation: `drip ${dripDuration} infinite linear` }} />
                        <text x="5" y="10" fontSize="7" fill="#fbbf24" textAnchor="middle" className="animate-bounce">🪙</text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Right side: Investor wallets nodes */}
                <div className="flex-1 flex flex-col justify-center gap-2 font-mono text-left">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black text-center mb-0.5">Shareholders</span>
                  
                  {[1, 2, 3].map((node) => (
                    <div key={node} className="bg-slate-900/60 border border-white/5 rounded-xl p-1.5 px-2.5 flex items-center justify-between text-[8.5px]">
                      <span className="text-slate-400">Wallet #{node}</span>
                      <span className={payout > 0 ? "text-amber-400 font-extrabold" : "text-slate-600"}>
                        {payout > 0 ? `+₹${Math.round(payout * 8)}/yr` : "Zero Div"}
                      </span>
                    </div>
                  ))}
                  <span className="text-[6.5px] text-slate-500 text-center font-mono">Payout Rate: {payout}%</span>
                </div>
              </div>
            );
          })()}

          {variant === 'digital' && (
            <svg className="w-full h-38" viewBox="0 0 100 80">
              <defs>
                <linearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </linearGradient>
                <linearGradient id="gatewayGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#5b21b6" />
                </linearGradient>
                <linearGradient id="merchantGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
                <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Connecting Conduits (Background Dark Paths) */}
              <path d="M 21 45 Q 32 32 43 25" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <path d="M 57 25 Q 68 32 78 45" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              <path d="M 78 52 Q 50 66 22 52" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

              {/* Dynamic Flow Dashes */}
              <path d="M 21 45 Q 32 32 43 25" fill="none" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="3,4" 
                    style={{ animation: 'flow 1.5s linear infinite', animationDuration: `${duration}s` }} />
              <path d="M 57 25 Q 68 32 78 45" fill="none" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="3,4" 
                    style={{ animation: 'flow 1.5s linear infinite', animationDuration: `${duration}s` }} />
              <path d="M 78 52 Q 50 66 22 52" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="3,4" 
                    style={{ animation: 'flow 1.5s linear infinite reverse', animationDuration: `${duration}s` }} />

              {/* Payer Phone Node (Left) */}
              <g>
                <rect x="9" y="32" width="12" height="22" rx="2" fill="url(#phoneGrad)" stroke="#3b82f6" strokeWidth="0.8" />
                <rect x="10.5" y="34" width="9" height="15" rx="1" fill="#030712" />
                <line x1="14" y1="51.5" x2="16" y2="51.5" stroke="#3b82f6" strokeWidth="0.5" strokeLinecap="round" />
                <line x1="11" y1="41" x2="19" y2="41" stroke="#60a5fa" strokeWidth="0.5" opacity="0.7" className="animate-pulse" />
                <text x="15" y="60" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">PAYER APP</text>
              </g>

              {/* UPI Gateway Node (Center) */}
              <g>
                <circle cx="50" cy="25" r="7.5" fill="#0b0f19" stroke="#8b5cf6" strokeWidth="1" />
                <circle cx="50" cy="25" r="4.5" fill="url(#gatewayGrad)" className="animate-pulse" />
                <circle cx="50" cy="25" r="11" fill="none" stroke="#c084fc" strokeWidth="0.3" opacity="0.3" 
                        style={{ animation: 'pulse-ring 2s infinite', transformOrigin: '50px 25px' }} />
                <text x="50" y="37" fontSize="3.5" fill="#c084fc" textAnchor="middle" fontWeight="bold" fontFamily="monospace">UPI SWITCH</text>
              </g>

              {/* Merchant Node (Right) */}
              <g>
                <rect x="79" y="34" width="12" height="18" rx="1.5" fill="url(#merchantGrad)" stroke="#10b981" strokeWidth="0.8" />
                <rect x="83.5" y="44" width="3" height="8" fill="#030712" />
                <path d="M 77.5 34 L 92.5 34 L 91 38 L 79 38 Z" fill="#10b981" />
                <circle cx="85" cy="43" r="10" fill="none" stroke="#10b981" strokeWidth="1" opacity="0"
                        style={{ animation: `success-glow ${duration}s infinite linear`, transformOrigin: '85px 43px' }} />
                <text x="85" y="58" fontSize="3.5" fill="#94a3b8" textAnchor="middle" fontWeight="bold" fontFamily="monospace">MERCHANT</text>
              </g>

              {/* Traveling Token Particles */}
              <circle r="2" fill="url(#coinGrad)" className="coin-p2s" filter="drop-shadow(0 0 3px #fbbf24)"
                      style={{ animationDuration: `${duration}s` }} />
              <circle r="2" fill="url(#coinGrad)" className="coin-s2m" filter="drop-shadow(0 0 3px #fbbf24)"
                      style={{ animationDuration: `${duration}s` }} />
              <circle r="2" fill="#10b981" className="confirm-m2p" filter="drop-shadow(0 0 3px #10b981)"
                      style={{ animationDuration: `${duration}s` }} />

              {/* Status Overlay */}
              <g>
                <rect x="18" y="66" width="64" height="7" rx="1.5" fill="rgba(15,23,42,0.9)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <text id="txt-init" x="50" y="71" fontSize="3.5" fill="#60a5fa" textAnchor="middle" fontFamily="monospace" fontWeight="bold"
                      style={{ animation: `text-init ${duration}s infinite linear` }}>
                  1. Scan QR & Authorize (₹{val})
                </text>
                <text id="txt-route" x="50" y="71" fontSize="3.5" fill="#c084fc" textAnchor="middle" fontFamily="monospace" fontWeight="bold"
                      style={{ animation: `text-route ${duration}s infinite linear`, opacity: 0 }}>
                  2. UPI Switch Debiting Bank...
                </text>
                <text id="txt-settle" x="50" y="71" fontSize="3.5" fill="#34d399" textAnchor="middle" fontFamily="monospace" fontWeight="bold"
                      style={{ animation: `text-settle ${duration}s infinite linear`, opacity: 0 }}>
                  3. Crediting Merchant Instantly
                </text>
                <text id="txt-success" x="50" y="71" fontSize="3.5" fill="#fbbf24" textAnchor="middle" fontFamily="monospace" fontWeight="bold"
                      style={{ animation: `text-success ${duration}s infinite linear`, opacity: 0 }}>
                  ✓ Settlement Settled (Zero Fee)
                </text>
              </g>
            </svg>
          )}

          {variant === 'debt_snowball' && (() => {
            const cleared1 = val >= 1;
            const cleared2 = val >= 3;
            const cleared3 = val >= 5;
            const cleared4 = val >= 7;
            const cleared5 = val >= 9;

            const activeIdx = !cleared1 ? 1 : !cleared2 ? 2 : !cleared3 ? 3 : !cleared4 ? 4 : !cleared5 ? 5 : 6;
            const snowballX = 15 + val * 21;
            const snowballY = 20 + val * 1;
            const snowballSize = 5 + val * 1.3;

            const debts = [
              { id: 1, label: "CC", bal: "₹5K", min: 500, x: 36, bottomY: 135, height: 32, cleared: cleared1, active: activeIdx === 1, pending: activeIdx < 1 },
              { id: 2, label: "Med", bal: "₹15K", min: 1000, x: 78, bottomY: 135, height: 37, cleared: cleared2, active: activeIdx === 2, pending: activeIdx < 2 },
              { id: 3, label: "Pers", bal: "₹40K", min: 2000, x: 120, bottomY: 135, height: 42, cleared: cleared3, active: activeIdx === 3, pending: activeIdx < 3 },
              { id: 4, label: "Car", bal: "₹100K", min: 4000, x: 162, bottomY: 135, height: 47, cleared: cleared4, active: activeIdx === 4, pending: activeIdx < 4 },
              { id: 5, label: "Stud", bal: "₹250K", min: 7000, x: 204, bottomY: 135, height: 52, cleared: cleared5, active: activeIdx === 5, pending: activeIdx < 5 }
            ];

            const totalSnowball = 1000 + 
              (cleared1 ? 500 : 0) + 
              (cleared2 ? 1000 : 0) + 
              (cleared3 ? 2000 : 0) + 
              (cleared4 ? 4000 : 0);
            
            const multiplier = 1 + 
              (cleared1 ? 0.5 : 0) + 
              (cleared2 ? 1.0 : 0) + 
              (cleared3 ? 2.0 : 0) + 
              (cleared4 ? 4.0 : 0);

            return (
              <div className="flex flex-col items-center w-full">
                <svg className="w-full max-h-[155px]" viewBox="0 0 240 150">
                  <defs>
                    <linearGradient id="snowballGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="30%" stopColor="#e0f2fe" />
                      <stop offset="100%" stopColor="#7dd3fc" />
                    </linearGradient>
                    <linearGradient id="clearedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.25)" />
                      <stop offset="100%" stopColor="rgba(4, 120, 87, 0.03)" />
                    </linearGradient>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(249, 115, 22, 0.3)" />
                      <stop offset="100%" stopColor="rgba(194, 65, 12, 0.03)" />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(71, 85, 105, 0.12)" />
                      <stop offset="100%" stopColor="rgba(15, 23, 42, 0.02)" />
                    </linearGradient>
                  </defs>

                  <line x1="10" y1="20" x2="230" y2="30" stroke="#334155" strokeWidth="2" strokeDasharray="3,3" />
                  <path d="M 15 60 L 225 60" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                  {val > 0 && (
                    <path d={`M 15 60 L ${Math.min(225, debts.find(d => d.active)?.x || 225)} 60`} 
                          fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,4" 
                          style={{ animation: `flow-fast ${Math.max(0.4, 1.5 - val*0.15)}s linear infinite` }} />
                  )}
                  <path d="M 15 30 L 15 60" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" style={{ animation: 'flow 1.5s linear infinite' }} />

                  {debts.map((d) => {
                    const topY = d.bottomY - d.height;
                    let strokeColor = "#475569";
                    let fillGrad = "url(#pendingGrad)";
                    let containerClass = "";

                    if (d.cleared) {
                      strokeColor = "#10b981";
                      fillGrad = "url(#clearedGrad)";
                    } else if (d.active) {
                      strokeColor = "#f97316";
                      fillGrad = "url(#activeGrad)";
                      containerClass = "active-canister";
                    }

                    return (
                      <g key={d.id}>
                        {d.cleared && (
                          <path d={`M ${d.x} ${topY} L ${d.x} 60`} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" style={{ animation: 'flow 1s linear infinite reverse' }} />
                        )}
                        {d.active && (
                          <path d={`M ${d.x} 60 L ${d.x} ${topY}`} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4,3" style={{ animation: 'flow-fast 0.6s linear infinite' }} />
                        )}
                        {d.pending && (
                          <path d={`M ${d.x} 60 L ${d.x} ${topY}`} fill="none" stroke="#475569" strokeWidth="0.8" strokeDasharray="2,5" style={{ animation: 'flow 3s linear infinite' }} />
                        )}
                        <rect x={d.x - 12} y={topY} width="24" height={d.height} rx="4" fill={fillGrad} stroke={strokeColor} strokeWidth={d.active ? 2 : 1} className={`transition-all duration-300 ${containerClass}`} />
                        <ellipse cx={d.x} cy={topY} rx="12" ry="2.5" fill="#0f172a" stroke={strokeColor} strokeWidth="1" />
                        <text x={d.x} y={topY + 12} fontSize="5" fill="#e2e8f0" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{d.label}</text>
                        <text x={d.x} y={topY + 20} fontSize="4" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">{d.bal}</text>
                        <text x={d.x} y={d.bottomY - 4} fontSize="3.5" fill={d.cleared ? "#10b981" : "#cbd5e1"} textAnchor="middle" fontFamily="monospace" fontWeight="bold">{d.cleared ? "FREE" : `₹${d.min}`}</text>
                        {d.cleared && (
                          <g transform={`translate(${d.x - 5}, ${topY + d.height/2 - 4})`}>
                            <circle cx="5" cy="5" r="5" fill="#10b981" />
                            <path d="M 3 5 L 4.5 6.5 L 7 3.5" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                        )}
                        {d.active && <text x={d.x} y={topY + d.height/2 + 6} fontSize="6" className="animate-pulse" textAnchor="middle">💥</text>}
                      </g>
                    );
                  })}

                  <g transform={`translate(${snowballX}, ${snowballY}) rotate(${val * 72})`}>
                    <circle r={snowballSize} fill="url(#snowballGrad)" stroke="#cbd5e1" strokeWidth="0.8" filter="drop-shadow(0 0 5px rgba(255,255,255,0.8))" />
                    <path d={`M -${snowballSize * 0.7} 0 A ${snowballSize} ${snowballSize * 0.6} 0 0 0 ${snowballSize * 0.7} 0`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.8" />
                    <path d={`M 0 -${snowballSize * 0.7} A ${snowballSize * 0.6} ${snowballSize} 0 0 0 0 ${snowballSize * 0.7}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.8" />
                    <circle cx={snowballSize * 0.3} cy={-snowballSize * 0.2} r={snowballSize * 0.15} fill="#cbd5e1" opacity="0.5" />
                  </g>
                </svg>

                <div className="grid grid-cols-3 gap-2 w-full mt-2 pt-2 border-t border-white/5 text-[9px] font-mono text-slate-400">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center">
                    <span className="text-[7.5px] text-slate-500 uppercase block">Snowball Flow</span>
                    <strong className="text-emerald-400 text-xs">₹{totalSnowball}</strong>
                    <span className="text-[7.5px] text-slate-500 block">/month</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center">
                    <span className="text-[7.5px] text-slate-500 uppercase block">Payoff Speed</span>
                    <strong className="text-cyan-400 text-xs">{multiplier.toFixed(1)}x</strong>
                    <span className="text-[7.5px] text-slate-500 block">Acceleration</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center flex flex-col justify-center">
                    <span className="text-[7.5px] text-slate-500 uppercase block">Status</span>
                    <strong className={`text-[8.5px] truncate font-bold ${activeIdx > 5 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {activeIdx > 5 ? "DEBT FREE!" : `CRUSHING ${debts[activeIdx - 1].label}`}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}

          {variant === 'liquid_fd' && (() => {
            const dripDuration = val === 0 ? '0s' : `${Math.max(0.4, 2 - (val / 50))}s`;
            
            return (
              <svg 
                className="w-full max-h-[155px] overflow-visible" 
                viewBox="0 0 240 140"
                onMouseEnter={() => setHoveredControl("[LIQ.COMP] Liquidity Comparison: Left tank is Liquid funds (instantly accessible, valve open). Right tank is Fixed Deposit (locked, higher yield, chain-locked). Slide to reallocate.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                <g>
                  <rect x="35" y="25" width="50" height="65" rx="6" fill="rgba(15,23,42,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <line x1="38" y1="40" x2="44" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="38" y1="56" x2="44" y2="56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="38" y1="72" x2="44" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  {val > 0 && (
                    <rect x="37" y={26 + 63 * (1 - val/100)} width="46" height={63 * (val/100)} rx="4" fill="url(#liquidGrad)" opacity="0.75" className="transition-all duration-500" />
                  )}
                  <path d="M 60 90 L 60 102" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                  <circle cx="60" cy="96" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" 
                          style={{ animation: val > 0 ? 'lab-spin 3s linear infinite' : 'none', transformOrigin: '60px 96px' }} />
                  <line x1="57" y1="96" x2="63" y2="96" stroke="#0f172a" strokeWidth="1" 
                        style={{ animation: val > 0 ? 'lab-spin 3s linear infinite' : 'none', transformOrigin: '60px 96px' }} />
                  {val > 0 && (
                    <>
                      <circle cx="60" cy="104" r="2" fill="#38bdf8" style={{ animation: `drip ${dripDuration} infinite linear`, animationDelay: '0s' }} />
                      <circle cx="60" cy="104" r="2" fill="#38bdf8" style={{ animation: `drip ${dripDuration} infinite linear`, animationDelay: `${parseFloat(dripDuration)/3}s` }} />
                      <circle cx="60" cy="104" r="2" fill="#38bdf8" style={{ animation: `drip ${dripDuration} infinite linear`, animationDelay: `${(parseFloat(dripDuration)*2)/3}s` }} />
                    </>
                  )}
                  <rect x="47" y="116" width="26" height="16" rx="3.5" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="60" y="127" fontSize="8.5" fill="#38bdf8" fontWeight="bold" textAnchor="middle">👛</text>
                  <text x="60" y="18" fontSize="7" fill="#38bdf8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">LIQUID: {val}%</text>
                </g>
                <g>
                  <rect x="155" y="25" width="50" height="65" rx="6" fill="rgba(15,23,42,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <line x1="196" y1="40" x2="202" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="196" y1="56" x2="202" y2="56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="196" y1="72" x2="202" y2="72" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  {val < 100 && (
                    <rect x="156" y={26 + 63 * (val/100)} width="46" height={63 * ((100-val)/100)} rx="4" fill="url(#fdGrad)" opacity="0.75" className="transition-all duration-500" />
                  )}
                  <line x1="155" y1="35" x2="205" y2="80" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="155" y1="80" x2="205" y2="35" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="1" strokeDasharray="3,3" />
                  <path d="M 180 90 L 180 102" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                  <path d="M 176 93 A 4 4 0 0 1 184 93" fill="none" stroke="#ef4444" strokeWidth="1.2" />
                  <rect x="174" y="93" width="12" height="9" rx="1" fill="#ef4444" />
                  <circle cx="180" cy="97" r="1" fill="#0f172a" />
                  <rect x="167" y="116" width="26" height="16" rx="3.5" fill="rgba(59, 130, 246, 0.1)" stroke="#475569" strokeWidth="1" />
                  <text x="180" y="127" fontSize="8" fill="#64748b" fontWeight="bold" textAnchor="middle">🔒</text>
                  <text x="180" y="18" fontSize="7" fill="#3b82f6" fontWeight="bold" fontFamily="monospace" textAnchor="middle">LOCKED: {(100-val).toFixed(0)}%</text>
                </g>
                <defs>
                  <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                  <linearGradient id="fdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            );
          })()}

          {variant === 'inventory' && (() => {
            const beltSpeed = val <= 30 ? '0.8s' : val <= 70 ? '2.5s' : '8s';

            return (
              <div className="flex flex-col items-center w-full select-none -mt-2">
                <svg 
                  className="w-full max-h-[145px] overflow-visible" 
                  viewBox="0 0 240 120"
                  onMouseEnter={() => setHoveredControl("[CONVEYOR.INVENTORY] Days Inventory Outstanding: Measures average duration stock sits in warehouse. Fast speed represents quick cash cycles. Heavy piles represent working capital choked by unsold goods.")}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  <rect x="25" y="70" width="190" height="6" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                  <line 
                    x1="26" y1="71.5" x2="214" y2="71.5" 
                    stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,4" 
                    style={{ animation: `conveyor-run ${beltSpeed} linear infinite` }} 
                  />
                  <g>
                    <circle cx="45" cy="84" r="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <line x1="42" y1="84" x2="48" y2="84" stroke="#475569" strokeWidth="1" 
                          style={{ animation: `lab-spin ${beltSpeed} linear infinite`, transformOrigin: '45px 84px' }} />
                    <circle cx="120" cy="84" r="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <line x1="117" y1="84" x2="123" y2="84" stroke="#475569" strokeWidth="1" 
                          style={{ animation: `lab-spin ${beltSpeed} linear infinite`, transformOrigin: '120px 84px' }} />
                    <circle cx="195" cy="84" r="5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                    <line x1="192" y1="84" x2="198" y2="84" stroke="#475569" strokeWidth="1" 
                          style={{ animation: `lab-spin ${beltSpeed} linear infinite`, transformOrigin: '195px 84px' }} />
                  </g>
                  {val <= 30 && (
                    <g>
                      <g transform="translate(45, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(110, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(175, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <rect x="70" y="15" width="100" height="12" rx="4" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.8" />
                      <text x="120" y="23.5" fontSize="6.5" fill="#34d399" fontWeight="bold" fontFamily="monospace" textAnchor="middle">✓ OPTIMAL CYCLE: {val} DAYS</text>
                    </g>
                  )}
                  {val > 30 && val <= 70 && (
                    <g>
                      <g transform="translate(75, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(135, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(180, 50)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(180, 31)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <rect x="65" y="15" width="110" height="12" rx="4" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.8" />
                      <text x="120" y="23.5" fontSize="6.5" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" textAnchor="middle">⚠️ WORKING CAPITAL TIED: {val} DAYS</text>
                    </g>
                  )}
                  {val > 70 && (
                    <g>
                      <g transform="translate(50, 50)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(110, 50)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(170, 50)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" opacity="0.9" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(110, 31)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(170, 31)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(170, 12)">
                        <rect width="18" height="18" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#78350f" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <g transform="translate(141, 22) rotate(15)">
                        <rect width="18" height="18" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                        <line x1="0" y1="9" x2="18" y2="9" stroke="#b45309" strokeWidth="1.5" strokeDasharray="2,2" />
                      </g>
                      <rect x="55" y="1" width="130" height="12" rx="4" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.8" className="animate-pulse" />
                      <text x="120" y="9.5" fontSize="6.5" fill="#f87171" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="animate-pulse">🚨 CRITICAL OVERSTOCK: {val} DAYS</text>
                    </g>
                  )}
                </svg>
              </div>
            );
          })()}

          {variant === 'buybacks' && (() => {
            const buybackPct = val * 0.4; // max 40% share reduction
            const activePct = 100 - buybackPct;
            const sliceSize = activePct / 5;
            const circ = 100.53; // 2 * Math.PI * 16

            // Alternating premium colors for individual shareholders
            const colors = ["#10b981", "#059669", "#047857", "#065f46", "#0f766e"];

            return (
              <div 
                className="flex flex-col items-center w-full select-none -mt-2"
                onMouseEnter={() => setHoveredControl("[VALVE.BUYBACKS] Share Buybacks vs Dividends: Buying back shares reduces outstanding equity. As outstanding shares shrink, each remaining slice expands, automatically boosting your proportional ownership.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                <div className="w-full flex items-center justify-between gap-4 mt-2">
                  {/* Left: Interactive Pie Chart SVG */}
                  <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] overflow-visible" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="#020617" />
                      
                      {/* Treasury / Cancelled Shares Slice */}
                      <circle 
                        cx="20" 
                        cy="20" 
                        r="16" 
                        fill="none" 
                        stroke="#1e293b" 
                        strokeWidth="5" 
                        strokeDasharray={`${(buybackPct / 100) * circ} ${circ - (buybackPct / 100) * circ}`}
                        transform="rotate(-90 20 20)"
                        className="transition-all duration-500"
                        strokeDashoffset="0"
                      />
                      {/* Treasury pattern overlay */}
                      <circle 
                        cx="20" 
                        cy="20" 
                        r="16" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="5" 
                        strokeDasharray="1,2"
                        transform="rotate(-90 20 20)"
                        className="transition-all duration-500"
                        opacity={buybackPct > 0 ? 0.6 : 0}
                      />

                      {/* Remaining active shareholder slices */}
                      {Array.from({ length: 5 }).map((_, i) => {
                        const startPct = buybackPct + i * sliceSize;
                        const offset = - (startPct / 100) * circ;
                        return (
                          <circle 
                            key={i}
                            cx="20" 
                            cy="20" 
                            r="16" 
                            fill="none" 
                            stroke={colors[i]} 
                            strokeWidth="5" 
                            strokeDasharray={`${(sliceSize / 100) * circ} ${circ - (sliceSize / 100) * circ}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 20 20)"
                            className="transition-all duration-500"
                            style={{ filter: `drop-shadow(0 0 1px ${colors[i]}44)` }}
                          />
                        );
                      })}

                      {/* Inner Cap */}
                      <circle cx="20" cy="20" r="11.5" fill="#020617" />
                      
                      {/* Ownership Label inside Pie */}
                      <text x="20" y="19" fontSize="3" fill="#94a3b8" textAnchor="middle" fontFamily="monospace">OWNERSHIP</text>
                      <text x="20" y="24" fontSize="4.5" fill="#ffffff" fontWeight="black" fontFamily="monospace" textAnchor="middle">
                        {((20 / activePct) * 100).toFixed(1)}%
                      </text>
                    </svg>
                  </div>

                  {/* Right: Informational Panel */}
                  <div className="flex-1 space-y-1.5 text-left text-[9.5px]">
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 font-mono space-y-1">
                      <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">Equity Allocation</div>
                      <div className="flex justify-between items-center text-white">
                        <span>Retired Shares:</span>
                        <span className="text-red-400 font-bold">-{buybackPct.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center text-white">
                        <span>Active Float:</span>
                        <span className="text-emerald-400 font-bold">{activePct.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-1 mt-1 text-white">
                        <span>EPS Boost:</span>
                        <span className="text-cyan-400 font-extrabold">+{((100 / (1 - buybackPct / 100)) - 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 text-[8px] text-emerald-300 leading-normal">
                      📈 <strong>Buyback Leverage:</strong> Reducing outstanding float from 100% to {activePct.toFixed(0)}% concentrates corporate earnings. Every remaining share now claims a larger piece of the company's net profit!
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bottom Details */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 select-none">
          {variant === 'buybacks' ? (
            <>
              <span>Buyback Allocation: <strong className="text-emerald-400">{val}%</strong></span>
              <span>EPS Boost: <strong className="text-cyan-400">+{((100 / (1 - (val * 0.4) / 100)) - 100).toFixed(0)}%</strong></span>
            </>
          ) : variant === 'liquid_fd' ? (
            <>
              <span>Alloc: <strong className="text-emerald-400">{val}% Liquid</strong></span>
              <span>Withdrawal Penalty: <strong className="text-cyan-400">{val >= 70 ? '0%' : `${((100 - val) * 0.05).toFixed(1)}%`}</strong></span>
            </>
          ) : variant === 'inventory' ? (
            <>
              <span>Turnover Period: <strong className="text-amber-400">{val} Days</strong></span>
              <span>Efficiency Status: <strong className={val <= 30 ? 'text-emerald-400 font-bold' : val <= 70 ? 'text-amber-400' : 'text-red-400 font-black animate-pulse'}>{val <= 30 ? 'Excellent' : val <= 70 ? 'Standard' : 'Warning'}</strong></span>
            </>
          ) : variant === 'fcf' ? (
            <>
              <span>FCF: <strong className="text-emerald-400">{val}%</strong></span>
              <span>CapEx: <strong className="text-rose-400">{100 - val}%</strong></span>
            </>
          ) : variant === 'working_cap' ? (
            <>
              <span>Cycle Time: <strong className="text-amber-400">{val} Days</strong></span>
              <span>Efficiency: <strong className={val <= 30 ? 'text-emerald-400 font-bold' : val <= 65 ? 'text-amber-400' : 'text-red-400 font-black animate-pulse'}>{val <= 30 ? 'High' : val <= 65 ? 'Moderate' : 'Low (Stuck)'}</strong></span>
            </>
          ) : variant === 'current_ratio' ? (
            <>
              <span>Current Ratio: <strong className="text-cyan-400">{val}x</strong></span>
              <span>Requirement: <strong className="text-white">Min 1.2x (2.0x Gold)</strong></span>
            </>
          ) : variant === 'expense_ratio' ? (
            <>
              <span>ER Charge: <strong className="text-amber-400">{val}% p.a.</strong></span>
              <span>Impact: <strong className="text-rose-400">-{lossPct}% Wealth Loss</strong></span>
            </>
          ) : (
            <>
              <span>Payout Rate: <strong className="text-cyan-400">{val}%</strong></span>
              <span>Retained/Reinvest: <strong className="text-emerald-400">{100 - val}%</strong></span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderGreeksEngine = (params, value, secValue) => {
    const { variant = 'call_put', accentColor = '#06b6d4', label = 'Greek Dashboard' } = params;
    const val = value;

    let activeSpot = 100;
    let days = 15;
    let iv = 40;

    if (variant === 'call_put') {
      activeSpot = 100 + (value - 50) * 0.8;
    } else if (variant === 'delta') {
      activeSpot = 100 + value * 40;
      days = 15;
      iv = 40;
    } else if (variant === 'theta') {
      activeSpot = 100;
      days = value;
      iv = 40;
    } else if (variant === 'gamma') {
      activeSpot = 100 + value * 8;
      days = 15;
      iv = 40;
    } else if (variant === 'vega') {
      activeSpot = 100;
      days = 15;
      iv = value;
    } else if (variant === 'iv') {
      activeSpot = 100;
      days = 15;
      iv = value;
    } else if (variant === 'iv_crush') {
      activeSpot = 100;
      days = 15;
      iv = 80 - value;
    } else if (variant === 'bull_call' || variant === 'bear_put' || variant === 'bull_put' || variant === 'bear_call') {
      activeSpot = 100 + value * 1.33;
    } else if (variant === 'iron_condor' || variant === 'butterfly') {
      activeSpot = 100 + value * 1.33;
    } else if (variant === 'covered_call') {
      activeSpot = 100 + (value - 20) * 1.2;
    } else if (variant === 'hedge') {
      activeSpot = 100 - value;
    } else if (variant === 'short_write') {
      activeSpot = 100 + (value - 50) * 0.8;
    } else {
      activeSpot = 100 + (value - 50) * 0.8;
    }

    const toX = (spot) => 20 + ((spot - 50) / 100) * 200;
    const toY = (pnl) => 60 - pnl * 1.2;

    const makePath = (points) => `M ${points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`;

    let payoffPath = '';
    let curvedPath = '';
    let tangentPath = '';
    let hoverDot = null;
    let extraPath = '';
    let extraPath2 = '';
    let payoffName = 'Payoff';
    let curvedName = 'Premium Curve';

    if (variant === 'call_put') {
      payoffName = 'Long Call Payoff';
      curvedName = 'Long Put Payoff';
      const callPts = [];
      const putPts = [];
      for (let s = 50; s <= 150; s += 2) {
        const callPnL = s >= 100 ? (s - 100) - 15 : -15;
        const putPnL = s <= 100 ? (100 - s) - 15 : -15;
        callPts.push({ x: toX(s), y: toY(callPnL) });
        putPts.push({ x: toX(s), y: toY(putPnL) });
      }
      payoffPath = makePath(callPts);
      curvedPath = makePath(putPts);

      const activeCallPnL = activeSpot >= 100 ? (activeSpot - 100) - 15 : -15;
      const activePutPnL = activeSpot <= 100 ? (100 - activeSpot) - 15 : -15;
      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activeCallPnL)} r="4" fill="#10b981" filter="drop-shadow(0 0 4px #10b981)" />
          <circle cx={toX(activeSpot)} cy={toY(activePutPnL)} r="4" fill="#22d3ee" filter="drop-shadow(0 0 4px #22d3ee)" />
          <text x={toX(activeSpot) + 5} y={toY(activeCallPnL) - 5} fontSize="6" fill="#10b981" fontFamily="monospace" fontWeight="bold">Call: ₹{Math.round(activeCallPnL * 100)}</text>
          <text x={toX(activeSpot) + 5} y={toY(activePutPnL) + 8} fontSize="6" fill="#22d3ee" fontFamily="monospace" fontWeight="bold">Put: ₹{Math.round(activePutPnL * 100)}</text>
        </>
      );
    }
    else if (['delta', 'theta', 'gamma', 'vega', 'greeks_all', 'iv', 'iv_crush'].includes(variant)) {
      payoffName = 'Call Payoff at Expiry';
      curvedName = 'Call Premium (Pre-Expiry)';

      const payoffPts = [];
      const curvedPts = [];

      for (let s = 50; s <= 150; s += 2) {
        const intrinsic = Math.max(0, s - 100);
        const dist = Math.abs(s - 100);
        const tVal = (iv * 0.45) * Math.sqrt(Math.max(0, days) / 30) * Math.exp(-Math.pow(dist / (22 + iv * 0.25), 2));
        const callPnL = intrinsic - 15;
        const premPnL = callPnL + tVal;

        payoffPts.push({ x: toX(s), y: toY(callPnL) });
        curvedPts.push({ x: toX(s), y: toY(premPnL) });
      }
      payoffPath = makePath(payoffPts);
      curvedPath = makePath(curvedPts);

      const activeIntrinsic = Math.max(0, activeSpot - 100) - 15;
      const activeDist = Math.abs(activeSpot - 100);
      const activeTVal = (iv * 0.45) * Math.sqrt(Math.max(0, days) / 30) * Math.exp(-Math.pow(activeDist / (22 + iv * 0.25), 2));
      const activePremPnL = activeIntrinsic + activeTVal;

      if (variant === 'delta' || variant === 'greeks_all') {
        const delta = 1 / (1 + Math.exp(-(activeSpot - 100) / 12));
        const tangentPts = [];
        for (let s = activeSpot - 20; s <= activeSpot + 20; s += 2) {
          if (s >= 50 && s <= 150) {
            const tanPnL = activePremPnL + delta * (s - activeSpot);
            tangentPts.push({ x: toX(s), y: toY(tanPnL) });
          }
        }
        tangentPath = makePath(tangentPts);
      }

      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePremPnL)} r="4" fill={accentColor} filter="drop-shadow(0 0 5px currentColor)" style={{ color: accentColor }} />
          <text x={toX(activeSpot) + 6} y={toY(activePremPnL) - 4} fontSize="6.5" fill="#fff" fontFamily="monospace" fontWeight="black">
            ₹{Math.round(activePremPnL * 100)}
          </text>
        </>
      );
    }
    else if (['bull_call', 'bull_put'].includes(variant)) {
      payoffName = variant === 'bull_call' ? 'Bull Call Spread' : 'Bull Put Spread';
      const pts = [];
      for (let s = 50; s <= 150; s += 2) {
        let pnl = -12;
        if (s >= 110) pnl = 18;
        else if (s > 90) pnl = -12 + ((s - 90) / 20) * 30;
        pts.push({ x: toX(s), y: toY(pnl) });
      }
      payoffPath = makePath(pts);

      const activePnL = activeSpot <= 90 ? -12 : activeSpot >= 110 ? 18 : -12 + ((activeSpot - 90) / 20) * 30;
      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePnL)} r="4" fill={activePnL >= 0 ? '#10b981' : '#ef4444'} filter="drop-shadow(0 0 4px currentColor)" />
          <text x={toX(activeSpot) + 5} y={toY(activePnL) - 5} fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">
            {activePnL >= 0 ? '+' : ''}₹{Math.round(activePnL * 100)}
          </text>
        </>
      );
    }
    else if (['bear_put', 'bear_call'].includes(variant)) {
      payoffName = variant === 'bear_put' ? 'Bear Put Spread' : 'Bear Call Spread';
      const pts = [];
      for (let s = 50; s <= 150; s += 2) {
        let pnl = 18;
        if (s >= 110) pnl = -12;
        else if (s > 90) pnl = 18 - ((s - 90) / 20) * 30;
        pts.push({ x: toX(s), y: toY(pnl) });
      }
      payoffPath = makePath(pts);

      const activePnL = activeSpot <= 90 ? 18 : activeSpot >= 110 ? -12 : 18 - ((activeSpot - 90) / 20) * 30;
      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePnL)} r="4" fill={activePnL >= 0 ? '#10b981' : '#ef4444'} filter="drop-shadow(0 0 4px currentColor)" />
          <text x={toX(activeSpot) + 5} y={toY(activePnL) - 5} fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">
            {activePnL >= 0 ? '+' : ''}₹{Math.round(activePnL * 100)}
          </text>
        </>
      );
    }
    else if (variant === 'butterfly' || variant === 'iron_condor') {
      payoffName = variant === 'butterfly' ? 'Iron Butterfly Payoff' : 'Iron Condor Payoff';
      const pts = [];
      for (let s = 50; s <= 150; s += 2) {
        let pnl = -8;
        if (variant === 'butterfly') {
          if (s >= 90 && s <= 100) pnl = -8 + ((s - 90) / 10) * 30;
          else if (s > 100 && s <= 110) pnl = 22 - ((s - 100) / 10) * 30;
        } else {
          if (s >= 90 && s <= 95) pnl = -8 + ((s - 90) / 5) * 23;
          else if (s > 95 && s <= 105) pnl = 15;
          else if (s > 105 && s <= 110) pnl = 15 - ((s - 105) / 5) * 23;
        }
        pts.push({ x: toX(s), y: toY(pnl) });
      }
      payoffPath = makePath(pts);

      let activePnL = -8;
      if (variant === 'butterfly') {
        if (activeSpot >= 90 && activeSpot <= 100) activePnL = -8 + ((activeSpot - 90) / 10) * 30;
        else if (activeSpot > 100 && activeSpot <= 110) activePnL = 22 - ((activeSpot - 100) / 10) * 30;
      } else {
        if (activeSpot >= 90 && activeSpot <= 95) activePnL = -8 + ((activeSpot - 90) / 5) * 23;
        else if (activeSpot > 95 && activeSpot <= 105) activePnL = 15;
        else if (activeSpot > 105 && activeSpot <= 110) activePnL = 15 - ((activeSpot - 105) / 5) * 23;
      }

      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePnL)} r="4" fill={activePnL >= 0 ? '#10b981' : '#ef4444'} filter="drop-shadow(0 0 4px currentColor)" />
          <text x={toX(activeSpot) + 5} y={toY(activePnL) - 5} fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">
            {activePnL >= 0 ? '+' : ''}₹{Math.round(activePnL * 100)}
          </text>
        </>
      );
    }
    else if (variant === 'covered_call') {
      payoffName = 'Covered Call Combined';
      const pts = [];
      for (let s = 50; s <= 150; s += 2) {
        const stockPnL = s - 100;
        const shortCallPnL = s >= 105 ? -(s - 105) + 6 : 6;
        const pnl = stockPnL + shortCallPnL;
        pts.push({ x: toX(s), y: toY(pnl) });
      }
      payoffPath = makePath(pts);

      const activeStockPnL = activeSpot - 100;
      const activeCallPnL = activeSpot >= 105 ? -(activeSpot - 105) + 6 : 6;
      const activePnL = activeStockPnL + activeCallPnL;

      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePnL)} r="4" fill={activePnL >= 0 ? '#10b981' : '#ef4444'} filter="drop-shadow(0 0 4px currentColor)" />
          <text x={toX(activeSpot) + 5} y={toY(activePnL) - 5} fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">
            ₹{Math.round(activePnL * 100)}
          </text>
        </>
      );
    }
    else if (variant === 'hedge') {
      payoffName = 'Hedged Portfolio (Flat 0)';
      const pts = [];
      const stockPts = [];
      const futPts = [];
      for (let s = 50; s <= 150; s += 2) {
        const stockPnL = s - 100;
        const futPnL = -(s - 100);
        const combined = stockPnL + futPnL;
        pts.push({ x: toX(s), y: toY(combined) });
        stockPts.push({ x: toX(s), y: toY(stockPnL) });
        futPts.push({ x: toX(s), y: toY(futPnL) });
      }
      payoffPath = makePath(pts);
      extraPath = makePath(stockPts);
      extraPath2 = makePath(futPts);

      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(0)} r="4" fill="#10b981" filter="drop-shadow(0 0 4px #10b981)" />
          <text x={toX(activeSpot) + 5} y={toY(0) - 5} fontSize="7.5" fill="#10b981" fontFamily="monospace" fontWeight="bold">Hedged Net: ₹0</text>
        </>
      );
    }
    else if (variant === 'short_write') {
      payoffName = 'Short Call Payoff (Option Writer)';
      curvedName = 'Call Premium (Pre-Expiry)';
      const isStopLossOn = val >= 50;
      const pts = [];
      const curvedPts = [];
      
      for (let s = 50; s <= 150; s += 2) {
        // Collects ₹1000 credit upfront
        let pnl = 10;
        if (s > 100) {
          pnl = 10 - (s - 100) * 1.5;
        }
        if (isStopLossOn && s > 115) {
          pnl = 10 - (115 - 100) * 1.5; // risk capped at -12.5 units
        }
        pts.push({ x: toX(s), y: toY(pnl) });

        // Pre-expiry curve expands with volatility (losses expand for seller)
        const intrinsic = Math.max(0, s - 100);
        const dist = Math.abs(s - 100);
        const tVal = (val * 0.38) * Math.exp(-Math.pow(dist / 22, 2));
        const callPnL = 10 - (intrinsic + tVal);
        curvedPts.push({ x: toX(s), y: toY(callPnL) });
      }
      payoffPath = makePath(pts);
      curvedPath = makePath(curvedPts);

      const activePnL = activeSpot <= 100 ? 10 : (isStopLossOn && activeSpot > 115 ? -12.5 : 10 - (activeSpot - 100) * 1.5);
      hoverDot = (
        <>
          <circle cx={toX(activeSpot)} cy={toY(activePnL)} r="4" fill={activePnL >= 0 ? '#10b981' : '#ef4444'} filter="drop-shadow(0 0 4px currentColor)" />
          <text x={toX(activeSpot) + 5} y={toY(activePnL) - 5} fontSize="7" fill="#fff" fontFamily="monospace" fontWeight="bold">
            ₹{Math.round(activePnL * 100)}
          </text>
        </>
      );
    }

    return (
      <div className="relative w-full max-w-sm h-64 bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
        <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={{ background: `radial-gradient(ellipse at 50% 10%, ${accentColor}08 0%, transparent 65%)` }} />

        <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Options Payoff Laboratory • {label}
        </div>

        <div className="flex-1 flex items-center justify-center relative mt-3.5">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 240 120">
            <defs>
              <filter id="glow-greeks" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render PCR sentiments or Contango curves or standard grids */}
            {variant !== 'pcr' && variant !== 'contango' && (
              <>
                {/* Grid Coordinates */}
                <g opacity="0.06" stroke="#ffffff" strokeWidth="0.5" className="pointer-events-none">
                  <line x1="20" y1="12" x2="220" y2="12" />
                  <line x1="20" y1="36" x2="220" y2="36" />
                  <line x1="20" y1="60" x2="220" y2="60" strokeWidth="1" opacity="2" />
                  <line x1="20" y1="84" x2="220" y2="84" />
                  <line x1="20" y1="108" x2="220" y2="108" />

                  <line x1="20" y1="12" x2="20" y2="108" strokeWidth="1" opacity="2" />
                  <line x1="70" y1="12" x2="70" y2="108" strokeDasharray="2,2" />
                  <line x1="120" y1="12" x2="120" y2="108" strokeDasharray="3,3" strokeWidth="0.75" />
                  <line x1="170" y1="12" x2="170" y2="108" strokeDasharray="2,2" />
                  <line x1="220" y1="12" x2="220" y2="108" />
                </g>

                {/* Axis Labels */}
                <g opacity="0.35" className="font-mono text-[4.5px] fill-slate-400 pointer-events-none select-none">
                  <text x="20" y="115" textAnchor="middle">₹50</text>
                  <text x="70" y="115" textAnchor="middle">₹75</text>
                  <text x="120" y="115" textAnchor="middle">₹100 (ATM)</text>
                  <text x="170" y="115" textAnchor="middle">₹125</text>
                  <text x="220" y="115" textAnchor="middle">₹150</text>

                  <text x="16" y="62.2" textAnchor="end" fontWeight="bold">₹0</text>
                  <text x="16" y="15" textAnchor="end" fill="#34d399">+₹4k</text>
                  <text x="16" y="110" textAnchor="end" fill="#f43f5e">-₹4k</text>
                </g>

                {/* Stop Loss Shield / Danger elements for Short Write */}
                {variant === 'short_write' && val >= 50 && (
                  <g>
                    <line x1={toX(115)} y1="12" x2={toX(115)} y2="108" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,1" filter="url(#glow-greeks)" />
                    <rect x={toX(115) - 32} y="15" width="30" height="9" rx="1.5" fill="rgba(15,23,42,0.85)" stroke="#10b981" strokeWidth="0.5" />
                    <text x={toX(115) - 17} y="21.5" fontSize="4.5" fill="#10b981" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SHIELD</text>
                  </g>
                )}

                {/* Danger volcano fire zone if short writing and no stop loss */}
                {variant === 'short_write' && val < 50 && (
                  <g className="animate-pulse">
                    <rect x={toX(100)} y="12" width={toX(150) - toX(100)} height="96" fill="rgba(239,68,68,0.06)" />
                    <text x="175" y="32" fontSize="5" fill="#ef4444" fontWeight="black" fontFamily="monospace" textAnchor="middle">⚠️ UNLIMITED DANGER</text>
                  </g>
                )}

                {/* Drawing Secondary reference lines if Hedging */}
                {variant === 'hedge' && (
                  <>
                    <path d={extraPath} fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                    <path d={extraPath2} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
                    <text x="180" y="30" fontSize="4.5" fill="#22d3ee" opacity="0.5" fontFamily="monospace">Stock Asset</text>
                    <text x="180" y="90" fontSize="4.5" fill="#f43f5e" opacity="0.5" fontFamily="monospace">Short Future</text>
                  </>
                )}

                {/* Payoff line at expiry */}
                {payoffPath && (
                  <path d={payoffPath} fill="none" stroke={variant === 'call_put' ? '#10b981' : accentColor} strokeWidth={variant === 'call_put' ? 1.5 : 2.2} className="transition-all duration-300" filter="url(#glow-greeks)" />
                )}

                {/* Premium curve before expiry */}
                {curvedPath && (
                  <path d={curvedPath} fill="none" stroke={variant === 'call_put' ? '#22d3ee' : '#cbd5e1'} strokeWidth={variant === 'call_put' ? 1.5 : 2} strokeDasharray={variant === 'call_put' ? 'none' : '2,1'} className="transition-all duration-300" opacity={0.8} />
                )}

                {/* Tangent line representing Delta */}
                {tangentPath && (
                  <path d={tangentPath} fill="none" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-300" filter="url(#glow-greeks)" />
                )}

                {/* Active spot price cursor line */}
                <g className="transition-all duration-300 pointer-events-none" style={{ transition: 'all 0.2s ease' }}>
                  <line x1={toX(activeSpot)} y1="12" x2={toX(activeSpot)} y2="108" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeDasharray="2,2" />
                  {hoverDot}
                </g>
              </>
            )}

            {/* PUT-CALL RATIO SENTIMENT METER */}
            {variant === 'pcr' && (() => {
              const pct = (val - 0.5) / 2.5; // val goes 0.5 to 3.0
              const angleDeg = -180 + pct * 180;
              const angleRad = (angleDeg * Math.PI) / 180;
              const needleX = 120 + Math.cos(angleRad) * 45;
              const needleY = 85 + Math.sin(angleRad) * 45;
              
              return (
                <g onMouseEnter={() => setHoveredControl("[METER.PCR] Put-Call Ratio Sentiment Meter: PCR = Put Open Interest / Call Open Interest. High PCR (>=1.5) means excessive fear (bearish extremes), signaling a contrarian rally. Low PCR (<=0.7) means complacency (greed), signaling market tops.")} onMouseLeave={() => setHoveredControl("")}>
                  {/* Gauge background track with gradient */}
                  <defs>
                    <linearGradient id="pcrGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="75%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  
                  {/* Outer ticks */}
                  <circle cx="120" cy="85" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Gauge Arc */}
                  <path d="M 65 85 A 55 55 0 0 1 175 85" fill="none" stroke="url(#pcrGrad)" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Sector dividing lines */}
                  <line x1="120" y1="85" x2={120 + Math.cos(-Math.PI * 0.76) * 58} y2={85 + Math.sin(-Math.PI * 0.76) * 58} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                  <line x1="120" y1="85" x2={120 + Math.cos(-Math.PI * 0.44) * 58} y2={85 + Math.sin(-Math.PI * 0.44) * 58} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                  
                  {/* Gauge ticks texts */}
                  <text x="56" y="90" fontSize="5" fill="#f87171" fontFamily="monospace" textAnchor="end">0.5 Complacency</text>
                  <text x="120" y="24" fontSize="5.5" fill="#94a3b8" fontFamily="monospace" textAnchor="middle">1.0 Neutral</text>
                  <text x="184" y="90" fontSize="5" fill="#34d399" fontFamily="monospace" textAnchor="start">3.0 Panic</text>

                  {/* Needle */}
                  <line x1="120" y1="85" x2={needleX} y2={needleY} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-greeks)" />
                  <circle cx="120" cy="85" r="4.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
                  
                  {/* Value display */}
                  <text x="120" y="70" fontSize="12" fill="#ffffff" fontWeight="black" fontFamily="monospace" textAnchor="middle">{val.toFixed(1)} PCR</text>
                  
                  {/* Dynamic sentiment badge */}
                  <g transform="translate(120, 102)">
                    <rect x="-45" y="-7" width="90" height="11" rx="2" fill="rgba(15,23,42,0.9)" stroke={val >= 1.5 ? "#10b981" : val <= 0.7 ? "#ef4444" : "#4b5563"} strokeWidth="0.75" />
                    <text x="0" y="0.5" fontSize="5.5" fill={val >= 1.5 ? "#34d399" : val <= 0.7 ? "#f87171" : "#e2e8f0"} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {val >= 1.5 ? "🔥 CONTRARIAN BUY" : val <= 0.7 ? "💀 GREED WARNING" : "NEUTRAL RANGE"}
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* FUTURES CONTANGO CURVE */}
            {variant === 'contango' && (() => {
              const ySpot = 70;
              const y1 = 70 - val * 5;
              const y2 = 70 - val * 9;
              const y3 = 70 - val * 13;

              const pathD = `M 40 ${ySpot} L 95 ${y1} L 150 ${y2} L 205 ${y3}`;
              const shadowPoints = `40,${ySpot} 95,${y1} 150,${y2} 205,${y3} 205,${ySpot} 40,${ySpot}`;

              return (
                <g onMouseEnter={() => setHoveredControl("[CURVE.CONTANGO] Futures Term Structure Curve: Contango = Futures price trades at a premium to Spot (upward curve, roll costs drag returns). Backwardation = Futures price trades at a discount to Spot (downward curve, supply squeeze roll profits).")} onMouseLeave={() => setHoveredControl("")}>
                  {/* Horizontal Spot Reference */}
                  <line x1="30" y1={ySpot} x2="220" y2={ySpot} stroke="#475569" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
                  <text x="25" y={ySpot + 1.5} fontSize="5.2" fill="#94a3b8" fontFamily="monospace" textAnchor="end">Spot (₹100)</text>

                  {/* Shading fill representing Basis spread cost / yield */}
                  <polygon 
                    points={shadowPoints} 
                    fill={val >= 0 ? "#ef4444" : "#10b981"} 
                    opacity="0.08" 
                    className="transition-all duration-300"
                  />

                  {/* Curve Path */}
                  <path d={pathD} fill="none" stroke={val >= 0 ? "#f97316" : "#22d3ee"} strokeWidth="2.2" filter="url(#glow-greeks)" className="transition-all duration-300" />

                  {/* Dots at contracts */}
                  <circle cx="40" cy={ySpot} r="3" fill="#64748b" />
                  <circle cx="95" cy={y1} r="3" fill={val >= 0 ? "#f97316" : "#22d3ee"} className="transition-all duration-300" />
                  <circle cx="150" cy={y2} r="3" fill={val >= 0 ? "#f97316" : "#22d3ee"} className="transition-all duration-300" />
                  <circle cx="205" cy={y3} r="3" fill={val >= 0 ? "#f97316" : "#22d3ee"} className="transition-all duration-300" />

                  {/* Labels above/below points */}
                  <text x="40" y="81" fontSize="5" fill="#64748b" fontFamily="monospace" textAnchor="middle">Spot (0M)</text>
                  <text x="95" y="81" fontSize="5" fill="#64748b" fontFamily="monospace" textAnchor="middle">1M Contract</text>
                  <text x="150" y="81" fontSize="5" fill="#64748b" fontFamily="monospace" textAnchor="middle">2M Contract</text>
                  <text x="205" y="81" fontSize="5" fill="#64748b" fontFamily="monospace" textAnchor="middle">3M Contract</text>

                  {/* Price display above curve */}
                  <text x="95" y={y1 - 6} fontSize="5" fill="#ffffff" fontFamily="monospace" textAnchor="middle">₹{(100 + val * 1).toFixed(1)}</text>
                  <text x="150" y={y2 - 6} fontSize="5" fill="#ffffff" fontFamily="monospace" textAnchor="middle">₹{(100 + val * 2).toFixed(1)}</text>
                  <text x="205" y={y3 - 6} fontSize="5.5" fill="#ffffff" fontWeight="black" fontFamily="monospace" textAnchor="middle">₹{(100 + val * 3).toFixed(1)}</text>

                  {/* Dynamic structure banner */}
                  <text x="120" y="24" fontSize="7.5" fill={val >= 2.0 ? "#f97316" : val <= -0.5 ? "#22d3ee" : "#94a3b8"} fontWeight="black" fontFamily="monospace" textAnchor="middle">
                    {val >= 2.0 ? "🔄 STEEP CONTANGO (ROLL COST DRAG)" : val <= -0.5 ? "⚡ BACKWARDATION (ROLL YIELD GAIN)" : "NORMAL CONTANGO STATE"}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Legend / Info readout */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 px-1 select-none">
          {variant === 'pcr' ? (
            <>
              <span>Sentiment: <strong className={val >= 1.5 ? 'text-emerald-400 font-bold' : val <= 0.7 ? 'text-red-400 font-black animate-pulse' : 'text-blue-400'}>{val >= 1.5 ? 'Fearful (Bullish Contra)' : val <= 0.7 ? 'Greedy (Complacency Risk)' : 'Balanced'}</strong></span>
              <span>Value: <strong className="text-white">{val.toFixed(1)} PCR</strong></span>
            </>
          ) : variant === 'contango' ? (
            <>
              <span>Structure: <strong className={val > 0 ? 'text-orange-400' : val < 0 ? 'text-cyan-400' : 'text-slate-400'}>{val > 0 ? 'Contango' : val < 0 ? 'Backwardation' : 'Flat Basis'}</strong></span>
              <span>3M Basis: <strong className={val >= 0 ? 'text-orange-400' : 'text-cyan-400'}>{val >= 0 ? '+' : ''}{(val * 3).toFixed(1)}%</strong></span>
            </>
          ) : variant === 'short_write' ? (
            <>
              <span>Stop-Loss Shield: <strong className={val >= 50 ? 'text-emerald-400' : 'text-red-400 font-black animate-pulse'}>{val >= 50 ? 'ON (Risk Capped)' : 'OFF (Uncapped Loss!)'}</strong></span>
              <span>Max Risk: <strong className={val >= 50 ? 'text-emerald-400' : 'text-red-400 font-bold'}>{val >= 50 ? '₹1,250' : '₹6,000 (Margin Call!)'}</strong></span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: variant === 'call_put' ? '#10b981' : accentColor }} />
                <span>{payoffName}</span>
              </div>
              {curvedPath && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: variant === 'call_put' ? '#22d3ee' : '#94a3b8' }} />
                  <span>{curvedName}</span>
                </div>
              )}
              <span>Spot: <strong className="text-white">₹{activeSpot.toFixed(0)}</strong></span>
            </>
          )}
        </div>
      </div>
    );
  };  const renderBlockchainEngine = (params, value, secValue) => {
    const { variant = 'crypto', accentColor = '#c084fc', label = 'Blockchain Ledger' } = params;
    const val = value;
    const activeNodes = val;
    const isConsensusReached = val >= 6;

    return (
      <div className="relative w-full max-w-sm min-h-[350px] h-auto bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        {/* pulse-node, laser-pulse, shield-pulse, vote-travel defined in LabAnimations.css */}
        <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Ledger Consensus Network • {label}
        </div>
        
        <div className="flex-1 flex items-center justify-center relative mt-2">
          {variant === 'crypto' && (() => {
            const numNodes = val;
            const isSecure = numNodes >= 6;
            
            const cx = 120;
            const cy = 70;
            const radius = 32;

            // Generate circular node positions
            const nodes = [];
            for (let i = 0; i < numNodes; i++) {
              const angle = (i * 2 * Math.PI) / numNodes - Math.PI / 2;
              const x = cx + radius * Math.cos(angle);
              const y = cy + radius * Math.sin(angle);
              nodes.push({ id: i, x, y, isHacker: i === 0 });
            }

            // Connection mesh links
            const links = [];
            for (let i = 0; i < numNodes; i++) {
              if (numNodes > 1) {
                links.push({
                  x1: nodes[i].x,
                  y1: nodes[i].y,
                  x2: nodes[(i + 1) % numNodes].x,
                  y2: nodes[(i + 1) % numNodes].y,
                  type: 'adjacent'
                });
              }
              if (numNodes > 4) {
                const skip = Math.floor(numNodes / 2);
                const target = (i + skip) % numNodes;
                if (i < target) {
                  links.push({
                    x1: nodes[i].x,
                    y1: nodes[i].y,
                    x2: nodes[target].x,
                    y2: nodes[target].y,
                    type: 'cross'
                  });
                }
              }
            }

            // Continuous glitching hashes for visual feedback of mutability
            const timeIdx = Math.floor(Date.now() / 250) % 10;
            const glitchHashes = ["a7d2b1", "f4e9c8", "08b5cf", "c91a3b", "e1a89c", "d43f05", "b72e18", "9c8b7a", "3d2e1f", "8c7b6a"];
            const hash1 = isSecure ? "0000a7" : glitchHashes[(timeIdx + 1) % 10];
            const hash2 = isSecure ? "0000f4" : glitchHashes[(timeIdx + 3) % 10];
            const hash3 = isSecure ? "000008" : glitchHashes[(timeIdx + 5) % 10];
            const hashes = [hash3, hash2, hash1];
            
            const tempAmt = 100 + (timeIdx * 85);

            return (
              <div className="flex flex-col items-center w-full gap-1.5 px-1 select-none">
                {/* Visual P2P Ledger Network SVG */}
                <svg 
                  className="w-full max-h-[145px] overflow-visible cursor-help" 
                  viewBox="0 0 240 135"
                  onMouseEnter={() => setHoveredControl("[NET.MESH] Consensus Ledger Network: Drag the node count slider to add servers. Honest nodes validate blocks (YES). Hacker nodes broadcast malicious packets (HACK). >=6 nodes required to lock consensus.")}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  <defs>
                    <linearGradient id="shieldSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="shieldPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Network Mesh Connection Lines */}
                  {links.map((l, idx) => (
                    <g key={`link-${idx}`}>
                      <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} 
                            stroke={isSecure ? "rgba(56, 189, 248, 0.4)" : "rgba(71, 85, 105, 0.3)"} 
                            strokeWidth={l.type === 'adjacent' ? 1.5 : 1} />
                      {isSecure && (
                        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} 
                              stroke="#06b6d4" 
                              strokeWidth={l.type === 'adjacent' ? 1.5 : 1}
                              strokeDasharray="4,6"
                              style={{ animation: 'flow 1.2s linear infinite' }} />
                      )}
                    </g>
                  ))}

                  {/* Laser Streams from nodes to center */}
                  {nodes.map((n) => {
                    if (n.isHacker) {
                      const targetY = isSecure ? cy - 18 : cy;
                      return (
                        <line key={`laser-${n.id}`}
                              x1={n.x} y1={n.y} x2={cx} y2={targetY}
                              stroke="#f43f5e"
                              strokeWidth="2.5"
                              filter="url(#laserGlow)"
                              style={{ animation: 'laser-pulse 1.2s infinite' }} />
                      );
                    } else {
                      return (
                        <line key={`consensus-link-${n.id}`} 
                              x1={n.x} y1={n.y} x2={cx} y2={cy} 
                              stroke={isSecure ? "#10b981" : "rgba(71, 85, 105, 0.25)"} 
                              strokeWidth={isSecure ? "1.5" : "0.8"} 
                              strokeDasharray={isSecure ? "3,3" : "none"}
                              style={isSecure ? { animation: 'flow-fast 0.6s linear infinite reverse' } : {}} />
                      );
                    }
                  })}

                  {/* Malicious Leak stream passing center lock when vulnerable */}
                  {!isSecure && (
                    <line x1={cx} y1={cy} x2={cx} y2={cy + 42}
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="3,3"
                          filter="url(#laserGlow)"
                          style={{ animation: 'laser-pulse 0.8s infinite' }} />
                  )}

                  {/* Consensus Shield (Deployed when nodes >= 6) */}
                  {isSecure && (
                    <circle cx={cx} cy={cy} r="18" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="2" 
                            strokeDasharray="4,4" 
                            style={{ 
                              animation: 'shield-pulse 2s infinite',
                              transformOrigin: `${cx}px ${cy}px`
                            }} />
                  )}

                  {/* Dynamic Vote Particles YES / HACK traveling to center */}
                  {nodes.map((n) => {
                    const delay = (n.id * 0.25).toFixed(2);
                    return (
                      <g key={`vote-${n.id}`} transform={`translate(${n.x}, ${n.y})`}>
                        <text x="0" y="2" fontSize="5" 
                              fill={n.isHacker ? "#ef4444" : "#10b981"} 
                              fontWeight="black" 
                              fontFamily="monospace"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{
                                '--dx': `${(cx - n.x) * 0.76}px`,
                                '--dy': `${(cy - n.y) * 0.76}px`,
                                animation: 'vote-travel 1.6s infinite linear',
                                animationDelay: `${delay}s`
                              }}>
                          {n.isHacker ? "HACK" : "YES"}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw Nodes (Server Symbols) */}
                  {nodes.map((n) => {
                    const delay = (n.id * 0.2).toFixed(2);
                    return (
                      <g 
                        key={n.id}
                        className="cursor-help"
                        onMouseEnter={() => {
                          if (n.isHacker) {
                            setHoveredControl("[ANOMALY.NODE] Malicious Validator Node 0: Simulates a hostile machine continuously broadcasting corrupted hashes to hijack block consensus.");
                          } else {
                            setHoveredControl(`[VALIDATOR.NODE] Active Server Node #${n.id}: Validating machine on the P2P network. It votes YES to seal block headers and participate in Byzantine agreement.`);
                          }
                        }}
                        onMouseLeave={() => setHoveredControl("")}
                      >
                        {/* Server Case Chassis */}
                        <rect x={n.x - 7} y={n.y - 7} width="14" height="14" rx="2"
                              fill="#0f172a" 
                              stroke={n.isHacker ? "#ef4444" : isSecure ? "#10b981" : "#475569"} 
                              strokeWidth={n.isHacker ? 1.5 : 1}
                              className={n.isHacker ? "animate-pulse" : ""} />
                        
                        {/* Server chassis internal rack lines */}
                        <line x1={n.x - 4} y1={n.y - 3} x2={n.x + 4} y2={n.y - 3} stroke={n.isHacker ? "#ef4444" : "#475569"} strokeWidth="1" opacity="0.6" />
                        <line x1={n.x - 4} y1={n.y + 1} x2={n.x + 4} y2={n.y + 1} stroke={n.isHacker ? "#ef4444" : "#475569"} strokeWidth="1" opacity="0.6" />

                        {/* Status Lights */}
                        <circle cx={n.x - 3} cy={n.y + 4} r="1" fill={n.isHacker ? "#f43f5e" : isSecure ? "#34d399" : "#38bdf8"} />
                        <circle cx={n.x + 3} cy={n.y + 4} r="1" 
                                fill={n.isHacker ? "#f43f5e" : isSecure ? "#10b981" : "#475569"} 
                                className="animate-ping" 
                                style={{ animationDuration: '1.5s', animationDelay: `${delay}s` }} />

                        {/* Emojis to label Hacker vs Honest */}
                        {n.isHacker ? (
                          <text x={n.x} y={n.y - 9} fontSize="7" textAnchor="middle">💀</text>
                        ) : (
                          n.id === 1 && (
                            <text x={n.x + (n.x > cx ? 9 : -9)} 
                                  y={n.y + 2} 
                                  fontSize="5" 
                                  fill="#64748b" 
                                  fontFamily="monospace" 
                                  fontWeight="bold" 
                                  textAnchor={n.x > cx ? "start" : "end"}>
                              HONEST
                            </text>
                          )
                        )}
                      </g>
                    );
                  })}

                  {/* Center Consensus Lock */}
                  <g 
                    transform={`translate(${cx - 11}, ${cy - 12})`}
                    className="cursor-help"
                    onMouseEnter={() => {
                      if (isSecure) {
                        setHoveredControl("[STATE.SECURE] Consensus Lock Anchored: Byzantine agreement active (>=50% voting power). Cryptographic state frozen; ledger block payload is immutable.");
                      } else {
                        setHoveredControl("[STATE.VULNERABLE] Consensus Compromised: Voting power collapsed (<50%). Sybil threat active; hacker has hijacked transaction validators, rendering ledger mutable.");
                      }
                    }}
                    onMouseLeave={() => setHoveredControl("")}
                  >
                    <rect x="0" y="0" width="22" height="24" rx="6" 
                          fill={isSecure ? "url(#shieldSuccess)" : "url(#shieldPending)"} 
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                          className={isSecure ? "" : "animate-pulse"} />
                    <text x="11" y="15.5" fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
                      {isSecure ? '🔒' : '🔓'}
                    </text>
                  </g>

                  {/* Educational Label/Banner Overlay */}
                  <g 
                    transform={`translate(${cx}, 10)`}
                    className="cursor-help"
                    onMouseEnter={() => {
                      if (isSecure) {
                        setHoveredControl("[SHIELD.ACTIVE] Decentralized Guard: Honest voting power exceeds 80%. A 51% hijacking vector is mathematically impossible. Ledger state is bulletproof.");
                      } else {
                        setHoveredControl("[SHIELD.VOID] High Attack Vulnerability: Low node count allows Hacker Node 0 to execute a 51% consensus takeover, permitting double-spending anomalies.");
                      }
                    }}
                    onMouseLeave={() => setHoveredControl("")}
                  >
                    <rect x="-65" y="-7" width="130" height="11" rx="4.5" 
                          fill={isSecure ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)"} 
                          stroke={isSecure ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"} 
                          strokeWidth="0.8" />
                    <text x="0" y="1" fontSize="5.5" textAnchor="middle" fontWeight="black" fontFamily="monospace"
                          fill={isSecure ? "#34d399" : "#fda4af"} className={isSecure ? "" : "animate-pulse"}>
                      {isSecure ? "🛡️ IMMUTABLE DECENTRALIZED SHIELD" : "⚠️ CENTRALIZED: 51% ATTACK RISK"}
                    </text>
                  </g>
                </svg>

                {/* High-Fidelity Ledger Detail Block */}
                <div 
                  className={`w-full max-w-[220px] rounded-xl border p-2 -mt-1 transition-all duration-300 text-left cursor-help ${isSecure ? 'bg-emerald-950/20 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.06)]' : 'bg-red-950/10 border-red-500/15 shadow-[0_0_12px_rgba(239,68,68,0.06)] animate-pulse'}`}
                  onMouseEnter={() => setHoveredControl("[EXPLORER] Live Ledger Explorer: Inspects transaction logs in Block #1048. Observe real-time transaction drift during active Byzantine failures.")}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5 text-[7px] font-mono text-slate-500">
                    <span>📦 BLOCK EXPLORER (#1048)</span>
                    <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${isSecure ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                      {isSecure ? '✓ Immutable Ledger' : '⚠️ Mutable (Under Attack)'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[7.5px]">
                    {/* Transaction 1 */}
                    <div 
                      className="flex justify-between items-center text-slate-300 cursor-help"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl(isSecure ? "[PAYLOAD.TX] Ledger Transaction Log: Mohan to Raj securely settled at ₹500. Modifications blocked by validator agreement." : "[ANOMALY.TX] Tampered Transaction Packet: Dynamic transaction manipulation active. Values are shifting in real-time due to lack of network consensus.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                    >
                      <span>1. Mohan ➔ Raj</span>
                      <span className={isSecure ? 'text-emerald-400 font-bold' : 'text-red-400 font-black animate-pulse'}>
                        ₹{isSecure ? '500' : tempAmt}
                      </span>
                    </div>
                    {/* Transaction 2 */}
                    <div 
                      className="flex justify-between items-center text-slate-300 cursor-help"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl(isSecure ? "[HASH.POINTER] Block Cryptographic Signature: Block hash sealed with '0000' proof-of-work prefix, linking to previous block headers." : "[HASH.COLLISION] Mutating Hash Pointer: Cryptographic hash glitters constantly due to shifting transaction payload variables.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                    >
                      <span>2. Ledger Hash</span>
                      <span className={isSecure ? 'text-emerald-500' : 'text-red-400'}>
                        [{hashes[0]}]
                      </span>
                    </div>
                    {/* Consensus metric detail */}
                    <div 
                      className="flex justify-between items-center text-slate-500 border-t border-white/5 pt-1 mt-1 text-[7px] cursor-help"
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl("[POWER.SHARE] Byzantine Resiliency Weight: Honest node count relative to overall validator network. Must remain >50% to prevent block double-spending.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                    >
                      <span>Honest voting power:</span>
                      <span className={isSecure ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                        {numNodes > 1 ? (((numNodes - 1) / numNodes) * 100).toFixed(0) : '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}



          {variant === 'defi' && (() => {
            const Rx = 40 + val * 1.6;
            const Ry = Rx;
            const k = Rx * Ry;
            const deltaX = 30;
            const RxNew = Rx + deltaX;
            const RyNew = k / RxNew;
            const deltaY = Ry - RyNew;
            const priceImpact = (1 - (deltaY / deltaX)) * 100;
            
            const Rmax = 260;
            const getSvgX = (r) => 35 + 170 * (r / Rmax);
            const getSvgY = (r) => 115 - 100 * (r / Rmax);

            const cxStart = getSvgX(Rx);
            const cyStart = getSvgY(Ry);
            const cxEnd = getSvgX(RxNew);
            const cyEnd = getSvgY(RyNew);

            const curvePoints = [];
            for (let r = 20; r <= 250; r += 5) {
              const rB = k / r;
              const sx = getSvgX(r);
              const sy = getSvgY(rB);
              if (sy >= 15 && sy <= 118) {
                curvePoints.push(`${sx},${sy}`);
              }
            }
            const curvePath = curvePoints.length > 0 ? `M ${curvePoints.join(' L ')}` : '';

            return (
              <div className="flex flex-col items-center w-full select-none -mt-2">
                <svg 
                  className="w-full max-h-[145px] overflow-visible cursor-help" 
                  viewBox="0 0 240 135"
                  onMouseEnter={() => setHoveredControl("[AMM.CURVE] Constant Product AMM Curve (x * y = k): Drag the liquidity pool slider. High liquidity flattens the curve, reducing price impact and transaction slippage during swaps. Low liquidity creates sharp curves with massive slippage.")}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  <defs>
                    <linearGradient id="curveGlow" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="35" y1="15" x2="35" y2="115" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="35" y1="115" x2="205" y2="115" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="120" y1="15" x2="120" y2="115" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="2,2" />
                  <line x1="35" y1="65" x2="205" y2="65" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="2,2" />

                  {/* Bonding Curve */}
                  <path d={curvePath} fill="none" stroke="#a78bfa" strokeWidth="2.5" filter="drop-shadow(0 0 4px rgba(167,139,250,0.6))" />

                  {/* Swap Step Lines */}
                  {/* Horizontal deltaX (Token A Reserve Inflow) */}
                  <line x1={cxStart} y1={cyStart} x2={cxEnd} y2={cyStart} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
                  {/* Vertical deltaY (Token B Reserve Outflow) */}
                  <line x1={cxEnd} y1={cyStart} x2={cxEnd} y2={cyEnd} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Start State Dot */}
                  <circle cx={cxStart} cy={cyStart} r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1" filter="drop-shadow(0 0 3px #38bdf8)" />
                  {/* End State Dot */}
                  <circle cx={cxEnd} cy={cyEnd} r="4" fill="#fbbf24" stroke="#fff" strokeWidth="1" filter="drop-shadow(0 0 3px #fbbf24)" />

                  {/* Axes labels */}
                  <text x="205" y="123" fontSize="5" fill="#64748b" textAnchor="end" fontFamily="monospace">TOKEN A (x)</text>
                  <text x="30" y="18" fontSize="5" fill="#64748b" textAnchor="start" fontFamily="monospace" transform="rotate(-90 30 18)">TOKEN B (y)</text>

                  {/* Labels on dots */}
                  <text x={cxStart - 6} y={cyStart - 4} fontSize="4.5" fill="#38bdf8" fontWeight="bold" fontFamily="monospace" textAnchor="end">START</text>
                  <text x={cxEnd + 6} y={cyEnd - 4} fontSize="4.5" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" textAnchor="start">SWAP</text>
                </svg>

                {/* Micro Telemetry Board */}
                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[220px] -mt-1 text-[8px] font-mono">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center">
                    <span className="text-[6.5px] text-slate-500 block">SWAP INPUT</span>
                    <strong className="text-emerald-400 font-bold">+30 Token A</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center">
                    <span className="text-[6.5px] text-slate-500 block">SWAP OUTPUT</span>
                    <strong className="text-cyan-400 font-bold">+{deltaY.toFixed(1)} B</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-center">
                    <span className="text-[6.5px] text-slate-500 block">PRICE IMPACT</span>
                    <strong className={`font-bold ${priceImpact >= 20 ? 'text-red-400' : priceImpact >= 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {priceImpact.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
          {variant === 'crypto' ? (
            <>
              <span>Nodes: <strong className="text-cyan-400">{activeNodes}/12 Active</strong></span>
              <span>Consensus: <strong className={isConsensusReached ? "text-emerald-400" : "text-amber-400"}>{isConsensusReached ? 'REACHED' : 'PENDING'}</strong></span>
            </>
          ) : (
            <>
              <span>Pool Size: <strong className="text-indigo-400">{(40 + val * 1.6).toFixed(0)} Tokens</strong></span>
              <span>AMM Model: <strong className="text-cyan-400">Constant Product (x*y=k)</strong></span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAllocationEngine = (params, value, secValue) => {
    const { variant = 'portfolio', accentColor = '#a78bfa', label = 'Portfolio Balance' } = params;
    const val = value;
    const leftWeight = val;
    const rightWeight = 100 - val;
    const tilt = (val - 50) * 0.4;
    const isOptimal = variant === 'portfolio' ? val >= 70 : variant === 'diversify' ? val >= 5 : Math.abs(val - 50) <= 5;

    return (
      <div className={`relative w-full max-w-sm ${['portfolio', 'debt_equity_mf'].includes(variant) ? 'min-h-[350px] h-auto pt-8 pb-4 px-4' : 'h-64'} bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`}>
        <div className="absolute top-2.5 left-3.5 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Asset Balance Physics • {label}
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-start relative mt-1 w-full">
          {variant === 'portfolio' && (
            <div className="w-full flex flex-col items-center gap-2.5">
              <svg className="w-44 h-24" viewBox="0 0 120 90">
                <path d="M 60 70 L 60 25 M 40 70 L 80 70" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '60px 25px', transition: 'all 0.3s ease' }}>
                  <line x1="25" y1="25" x2="95" y2="25" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="25" y1="25" x2="25" y2="45" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="95" y1="25" x2="95" y2="45" stroke="#94a3b8" strokeWidth="1" />
                  <path d="M 15 45 L 35 45 Q 25 52 15 45" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                  <path d="M 85 45 L 105 45 Q 95 52 85 45" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                  <text x="25" y="42" fontSize="10" textAnchor="middle" className="select-none">💵</text>
                  <text x="95" y="42" fontSize="10" textAnchor="middle" className="select-none">📈</text>
                </g>
                <circle cx="60" cy="25" r="4.5" fill={isOptimal ? "#10b981" : "#f59e0b"} stroke="#fff" strokeWidth="1" />
              </svg>

              {/* Real-Time Glassmorphic Allocation Ledger Card */}
              <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 shadow-xl text-left mt-2">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📊 ALLOCATION TELEMETRY LEDGER</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  {/* Left Column: Asset Split */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Asset Split</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">📈 Equity:</span>
                      <span className="text-emerald-400 font-bold">{leftWeight}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">💵 Debt/Cash:</span>
                      <span className="text-cyan-400 font-bold">{rightWeight}%</span>
                    </div>
                  </div>
                  
                  {/* Right Column: Risk & Yield */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Est. Return & Risk</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400">Est. Yield:</span>
                        <span className="text-emerald-400 font-bold">{((leftWeight * 12 + rightWeight * 6) / 100).toFixed(1)}% p.a.</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                      <span className="text-slate-400">Risk Level:</span>
                      <span className={leftWeight >= 70 ? "text-rose-400 font-extrabold" : leftWeight >= 40 ? "text-cyan-400 font-extrabold" : "text-amber-400 font-extrabold"}>
                        {leftWeight >= 70 ? "High Growth (Aggressive)" : leftWeight >= 40 ? "Balanced (Moderate)" : "Conservative (Low Risk)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="space-y-1.5 pt-1">
                  {leftWeight >= 70 ? (
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">🟢 Optimization Status:</span>
                      <span className="text-emerald-400 font-black text-xs uppercase tracking-wide">High Growth Config Deployed</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                      <span className="text-amber-300 font-semibold flex items-center gap-1">🟡 Optimization Status:</span>
                      <span className="text-amber-400 font-black text-xs uppercase tracking-wide">Growth Goal Pending (&lt; 70% Equity)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Explanation Alert */}
              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-2.5 text-[8.5px] text-slate-300 leading-normal flex items-start gap-2 shadow-sm text-left mt-2">
                <span className="text-sm select-none">💡</span>
                <div>
                  <span className="text-sky-400 font-bold mr-1">Allocation Rule:</span>
                  Asset allocation is the process of splitting your investment portfolio among different asset categories like <strong className="text-white font-semibold">Equity</strong> (for high-growth compounding) and <strong className="text-white font-semibold">Debt/Cash</strong> (for safety and stability). Setting equity to <strong className="text-white font-semibold">70% or more</strong> optimizes your portfolio for aggressive growth, ideal for long-term goals.
                </div>
              </div>
            </div>
          )}

          {variant === 'diversify' && (() => {
            const isConcentrated = val < 5;
            const shakeClass = isConcentrated ? 'animate-shake' : '';
            const count = val;
            const baskets = [];
            const n = Math.min(10, count);

            if (count < 5) {
              const sizes = [25, 21, 17, 15];
              const size = sizes[count - 1] || 15;
              for (let i = 0; i < count; i++) {
                let x = 80;
                if (count === 2) x = i === 0 ? 48 : 112;
                else if (count === 3) x = 38 + i * 42;
                else if (count === 4) x = 28 + i * 34.6;
                baskets.push({ x, y: 52, r: size, eggs: Math.floor(10 / count) + (i < (10 % count) ? 1 : 0) });
              }
            } else {
              const size = 11;
              if (n <= 5) {
                const startX = 80 - ((n - 1) * 26) / 2;
                for (let i = 0; i < n; i++) {
                  baskets.push({ x: startX + i * 26, y: 52, r: size, eggs: Math.floor(10 / n) + (i < (10 % n) ? 1 : 0) });
                }
              } else {
                const row1Count = Math.ceil(n / 2);
                const row2Count = n - row1Count;
                
                const startX1 = 80 - ((row1Count - 1) * 25) / 2;
                for (let i = 0; i < row1Count; i++) {
                  baskets.push({ x: startX1 + i * 25, y: 38, r: size, eggs: Math.floor(10 / n) + (i < (10 % n) ? 1 : 0) });
                }
                
                const startX2 = 80 - ((row2Count - 1) * 25) / 2;
                for (let i = 0; i < row2Count; i++) {
                  baskets.push({ x: startX2 + i * 25, y: 62, r: size, eggs: Math.floor(10 / n) + ((row1Count + i) < (10 % n) ? 1 : 0) });
                }
              }
            }

            const getEggOffsets = (numEggs, r) => {
              const offsets = [];
              if (numEggs === 1) {
                offsets.push({ dx: 0, dy: -r * 0.1, rotate: 5 });
              } else if (numEggs === 2) {
                offsets.push({ dx: -r * 0.25, dy: r * 0.05, rotate: -15 });
                offsets.push({ dx: r * 0.25, dy: r * 0.05, rotate: 15 });
              } else if (numEggs === 3) {
                offsets.push({ dx: -r * 0.3, dy: r * 0.1, rotate: -20 });
                offsets.push({ dx: r * 0.3, dy: r * 0.1, rotate: 20 });
                offsets.push({ dx: 0, dy: -r * 0.1, rotate: 0 });
              } else {
                offsets.push({ dx: -r * 0.4, dy: r * 0.15, rotate: -30 });
                offsets.push({ dx: 0, dy: r * 0.2, rotate: 5 });
                offsets.push({ dx: r * 0.4, dy: r * 0.15, rotate: 30 });
                if (numEggs >= 4) offsets.push({ dx: -r * 0.2, dy: -r * 0.05, rotate: -10 });
                if (numEggs >= 5) offsets.push({ dx: r * 0.2, dy: -r * 0.05, rotate: 10 });
                if (numEggs >= 6) offsets.push({ dx: 0, dy: -r * 0.25, rotate: 0 });
                if (numEggs >= 7) offsets.push({ dx: -r * 0.3, dy: -r * 0.3, rotate: -45 });
                if (numEggs >= 8) offsets.push({ dx: r * 0.3, dy: -r * 0.3, rotate: 45 });
                if (numEggs >= 9) offsets.push({ dx: -r * 0.1, dy: -r * 0.45, rotate: -15 });
                if (numEggs >= 10) offsets.push({ dx: r * 0.1, dy: -r * 0.45, rotate: 15 });
              }
              return offsets;
            };

            return (
              <div className="flex flex-col items-center w-full gap-2 px-1">


                <svg className="w-full max-h-[145px]" viewBox="0 0 160 90">
                  <defs>
                    <linearGradient id="basketGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="eggGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#fff7ed" />
                      <stop offset="100%" stopColor="#fed7aa" />
                    </linearGradient>
                    <radialGradient id="shadowGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </radialGradient>
                  </defs>

                  {/* Draw shadows under baskets */}
                  {baskets.map((b, idx) => (
                    <ellipse key={`shadow-${idx}`} 
                             cx={b.x} cy={b.y + b.r * 0.7} 
                             rx={b.r * 1.1} ry={b.r * 0.3} 
                             fill="url(#shadowGlow)" />
                  ))}

                  {/* Draw baskets + eggs */}
                  {baskets.map((b, idx) => {
                    const eggOffsets = getEggOffsets(b.eggs, b.r);
                    return (
                      <g key={`basket-group-${idx}`} className={shakeClass}>
                        {/* Basket Handle (behind eggs) */}
                        <path d={`M ${b.x - b.r} ${b.y} A ${b.r} ${b.r} 0 0 1 ${b.x + b.r} ${b.y}`} 
                              fill="none" stroke="#d97706" strokeWidth={b.r * 0.12} strokeLinecap="round" />
                        <path d={`M ${b.x - b.r} ${b.y} A ${b.r} ${b.r} 0 0 1 ${b.x + b.r} ${b.y}`} 
                              fill="none" stroke="#f59e0b" strokeWidth={b.r * 0.04} strokeLinecap="round" strokeDasharray="1,1" />

                        {/* Eggs piled in basket */}
                        {eggOffsets.map((offset, eggIdx) => (
                          <g key={`egg-${eggIdx}`} 
                             transform={`translate(${b.x + offset.dx}, ${b.y + offset.dy}) rotate(${offset.rotate})`}>
                            <ellipse cx="0" cy="0" rx={b.r * 0.26} ry={b.r * 0.37} 
                                     fill="url(#eggGrad)" stroke="#fdba74" strokeWidth="0.4" />
                            
                            {/* Crack lines on eggs if concentration is too high */}
                            {isConcentrated && eggIdx >= b.eggs - 2 && (
                              <path d={`M ${-b.r * 0.05} ${-b.r * 0.12} L ${b.r * 0.08} ${-b.r * 0.02} L ${-b.r * 0.08} ${b.r * 0.08} L ${b.r * 0.06} ${b.r * 0.16}`} 
                                    fill="none" stroke="#ef4444" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                          </g>
                        ))}

                        {/* Basket Body (foreground) */}
                        <path d={`M ${b.x - b.r} ${b.y} L ${b.x - b.r * 0.8} ${b.y + b.r * 0.75} Q ${b.x} ${b.y + b.r * 0.9} ${b.x + b.r * 0.8} ${b.y + b.r * 0.75} L ${b.x + b.r} ${b.y} Z`} 
                              fill="url(#basketGrad)" stroke="#78350f" strokeWidth="0.8" />

                        {/* Woven details on basket body */}
                        <path d={`M ${b.x - b.r * 0.9} ${b.y + b.r * 0.3} Q ${b.x} ${b.y + b.r * 0.4} ${b.x + b.r * 0.9} ${b.y + b.r * 0.3}`} 
                              fill="none" stroke="#b45309" strokeWidth="0.6" opacity="0.8" />
                        <path d={`M ${b.x - b.r * 0.85} ${b.y + b.r * 0.55} Q ${b.x} ${b.y + b.r * 0.65} ${b.x + b.r * 0.85} ${b.y + b.r * 0.55}`} 
                              fill="none" stroke="#b45309" strokeWidth="0.6" opacity="0.8" />
                        
                        <line x1={b.x - b.r * 0.5} y1={b.y} x2={b.x - b.r * 0.4} y2={b.y + b.r * 0.8} stroke="#78350f" strokeWidth="0.5" opacity="0.6" />
                        <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + b.r * 0.85} stroke="#78350f" strokeWidth="0.5" opacity="0.6" />
                        <line x1={b.x + b.r * 0.5} y1={b.y} x2={b.x + b.r * 0.4} y2={b.y + b.r * 0.8} stroke="#78350f" strokeWidth="0.5" opacity="0.6" />
                      </g>
                    );
                  })}
                </svg>

                {/* Live Risk Status Indicator Card */}
                {isConcentrated ? (
                  <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl py-1.5 px-3 -mt-2 text-center animate-pulse">
                    <span className="text-[7px] text-rose-400 font-mono uppercase tracking-widest block">Allocation Risk</span>
                    <span className="text-[10px] font-black text-rose-400 block mt-0.5">
                      ⚠️ CONCENTRATED: {count} {count === 1 ? 'Basket' : 'Baskets'} (High Risk of Breakage)
                    </span>
                  </div>
                ) : (
                  <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl py-1.5 px-3 -mt-2 text-center">
                    <span className="text-[7px] text-emerald-400 font-mono uppercase tracking-widest block">Allocation Risk</span>
                    <span className="text-[10px] font-black text-emerald-400 block mt-0.5">
                      🛡️ DIVERSIFIED: {count} Baskets (Risk Dispersed Successfully)
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {variant === 'debt_equity_mf' && (() => {
            const cx = 120;
            const cy = 65;
            const d = 48; // half beam length

            let classification = "BALANCED HYBRID (60/40)";
            let classColor = "#38bdf8";
            if (val < 6) { classification = "QUIET MARKET (STABLE)"; classColor = "#34d399"; }
            else if (val < 12) { classification = "ACTIVE CYCLE (MODERATE)"; classColor = "#fb923c"; }
            else { classification = "MARKET CORRECTION (RISKY)"; classColor = "#f43f5e"; }

            // Dynamic spread calculations
            const baseMin = 9.6;
            const baseMax = 12.2;
            const spread = (val / 20) * 4.8;
            const currentMin = baseMin - spread;
            const currentMax = baseMax + spread;

            const isRiskActive = val >= 10;

            return (
              <div className="flex flex-col items-center w-full gap-2.5 select-none">
                {/* Visual Physics Balance Scale SVG */}
                <svg className="w-full max-h-[145px] overflow-visible" viewBox="0 0 240 135">
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                    <linearGradient id="dtGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Central Pillar Stand */}
                  <line x1="120" y1="65" x2="120" y2="115" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                  <line x1="90" y1="115" x2="150" y2="115" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="120" cy="65" r="4.5" fill="#475569" stroke="#64748b" strokeWidth="1" />
                  
                  {/* Tilting Beam and Trays animated via CSS variables and keyframes */}
                  <g style={{
                    '--swing': `${(val / 20) * 12}deg`,
                    animation: val > 0 ? 'beam-swing 1.6s ease-in-out infinite' : 'none',
                    transformOrigin: `${cx}px ${cy}px`
                  }}>
                    {/* Beam Line */}
                    <line x1={cx - d} y1={cy} x2={cx + d} y2={cy} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                    <circle cx={cx - d} cy={cy} r="2" fill="#22d3ee" />
                    <circle cx={cx + d} cy={cy} r="2" fill="#f43f5e" />

                    {/* Hanging Left (Equity) Tray */}
                    <g style={{
                      animation: val > 0 ? 'tray-swing-left 1.6s ease-in-out infinite' : 'none',
                      transformOrigin: `${cx - d}px ${cy}px`
                    }}>
                      <line x1={cx - d} y1={cy} x2={cx - d - 9} y2={cy + 25} stroke="#475569" strokeWidth="0.8" />
                      <line x1={cx - d} y1={cy} x2={cx - d + 9} y2={cy + 25} stroke="#475569" strokeWidth="0.8" />
                      <line x1={cx - d} y1={cy} x2={cx - d} y2={cy + 25} stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
                      <rect x={cx - d - 14} y={cy + 25} width="28" height="4" rx="1.5" fill="#0891b2" />
                      
                      {/* Equity weight block (shaking if volatility is high) */}
                      <g style={{
                        animation: val >= 10 ? 'eq-shake 0.25s infinite' : 'none',
                        transformOrigin: `${cx - d}px ${cy + 17}px`
                      }}>
                        <rect x={cx - d - 9} y={cy + 25 - 15} width="18" height="15" rx="2" fill="url(#eqGrad)" opacity="0.85" filter="url(#glow)" />
                        <text x={cx - d} y={cy + 20 - 15} fontSize="4.5" fill="#22d3ee" textAnchor="middle" fontWeight="bold" fontFamily="monospace">60% EQ</text>
                      </g>
                    </g>

                    {/* Hanging Right (Debt) Tray (Remains stable / no shake) */}
                    <g style={{
                      animation: val > 0 ? 'tray-swing-right 1.6s ease-in-out infinite' : 'none',
                      transformOrigin: `${cx + d}px ${cy}px`
                    }}>
                      <line x1={cx + d} y1={cy} x2={cx + d - 9} y2={cy + 25} stroke="#475569" strokeWidth="0.8" />
                      <line x1={cx + d} y1={cy} x2={cx + d + 9} y2={cy + 25} stroke="#475569" strokeWidth="0.8" />
                      <line x1={cx + d} y1={cy} x2={cx + d} y2={cy + 25} stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
                      <rect x={cx + d - 14} y={cy + 25} width="28" height="4" rx="1.5" fill="#be123c" />
                      
                      {/* Debt weight block (steady, no shake) */}
                      <rect x={cx + d - 9} y={cy + 25 - 10} width="18" height="10" rx="2" fill="url(#dtGrad)" opacity="0.85" filter="url(#glow)" />
                      <text x={cx + d} y={cy + 20 - 10} fontSize="4.5" fill="#f43f5e" textAnchor="middle" fontWeight="bold" fontFamily="monospace">40% DT</text>
                    </g>
                  </g>

                  {/* Dynamic Portfolio Badge */}
                  <g transform={`translate(120, 24)`}>
                    <rect x="-65" y="-7" width="130" height="12" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={classColor} strokeWidth="0.8" />
                    <text x="0" y="1.5" fontSize="5.5" textAnchor="middle" fill={classColor} fontWeight="black" fontFamily="monospace">
                      {classification}
                    </text>
                  </g>
                </svg>

                {/* Telemetry Risk Card */}
                <div className={`w-full max-w-[220px] rounded-xl border p-2 -mt-1 transition-all duration-300 text-left ${isRiskActive ? 'bg-rose-500/10 border-rose-500/15 shadow-[0_0_12px_rgba(239,68,68,0.06)]' : 'bg-emerald-950/20 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.06)]'}`}>
                  <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5 text-[7px] font-mono text-slate-500">
                    <span>📊 VOLATILITY HUD ANALYSIS</span>
                    <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${isRiskActive ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {isRiskActive ? '⚠️ Volatility High' : '✓ Capital Safe'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[7.5px]">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Expected Yield Range:</span>
                      <span className="text-emerald-400 font-bold">
                        {currentMin.toFixed(1)}% - {currentMax.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Market Swing Index:</span>
                      <span className={isRiskActive ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-300'}>
                        {val}% Volatility
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 border-t border-white/5 pt-1 mt-1 text-[7px]">
                      <span>Risk volatility index:</span>
                      <span className={val >= 12 ? 'text-rose-400 font-bold' : val >= 6 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {val >= 12 ? 'RISKY SWINGS' : val >= 6 ? 'MODERATE' : 'STABLE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}


          {variant === 'rebalancing' && (() => {
            // Educational: Portfolio drift over time, shows why rebalancing matters
            const drift = Math.abs(val - 50);
            const currentEquity = val; // slider = equity %
            const currentDebt = 100 - val;
            const targetEquity = 60;
            const targetDebt = 40;
            const eqDrift = currentEquity - targetEquity;
            const needsRebalance = Math.abs(eqDrift) > 5;
            return (
              <div className="w-full flex flex-col gap-2">
                {/* Current vs Target allocation */}
                <div className="text-[7px] font-mono text-slate-500 text-center uppercase tracking-wider mb-0.5">Target: 60% Equity / 40% Debt</div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Equity', current: currentEquity, target: targetEquity, color: '#06b6d4' },
                    { label: 'Debt', current: currentDebt, target: targetDebt, color: '#8b5cf6' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[7px] font-mono mb-0.5">
                        <span style={{ color: item.color }}>{item.label}</span>
                        <span className="text-slate-400">Current: <strong style={{ color: item.color }}>{item.current}%</strong> | Target: {item.target}%</span>
                      </div>
                      <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.current}%`, background: item.color, opacity: 0.7 }} />
                        {/* Target marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: `${item.target}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Drift alert */}
                <div className={`rounded-2xl border px-3 py-2 flex items-center justify-between transition-all duration-500 ${needsRebalance ? 'bg-rose-950/40 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/20'}`}>
                  <div>
                    <div className="text-[6.5px] font-mono text-slate-500 uppercase">Portfolio Drift</div>
                    <div className="text-[14px] font-black font-mono" style={{ color: needsRebalance ? '#ef4444' : '#10b981' }}>
                      {eqDrift > 0 ? '+' : ''}{eqDrift}% Equity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] font-mono" style={{ color: needsRebalance ? '#fca5a5' : '#6ee7b7' }}>
                      {needsRebalance ? '⚠️ Sell equity, buy debt' : '✅ On target'}
                    </div>
                    <div className="text-[6px] font-mono text-slate-500 mt-0.5">
                      {needsRebalance ? 'Risk exceeded threshold' : 'No action needed'}
                    </div>
                  </div>
                </div>
                <div className="text-[6.5px] font-mono text-slate-500 text-center">
                  Rebalance when drift {'>'} 5% to lock in gains & manage risk
                </div>
              </div>
            );
          })()}

          {variant === 'growth_value' && (() => {
            // Educational: Growth vs Value — P/E ratio spectrum
            const pe = val; // slider = P/E ratio 5-50
            const isGrowth = pe > 25;
            const isValue = pe < 15;
            const growthStocks = ['TCS', 'INFY', 'BAJFINANCE', 'TITAN'];
            const valueStocks = ['ITC', 'COAL', 'ONGC', 'SBI'];
            const peColor = isGrowth ? '#8b5cf6' : isValue ? '#10b981' : '#f59e0b';
            return (
              <div className="w-full flex flex-col gap-2">
                {/* P/E Spectrum bar */}
                <div>
                  <div className="flex justify-between text-[6.5px] font-mono mb-1">
                    <span className="text-emerald-400">Value (P/E &lt;15)</span>
                    <span className="text-amber-400">Blend (15-25)</span>
                    <span className="text-purple-400">Growth (P/E &gt;25)</span>
                  </div>
                  <div className="relative w-full h-4 bg-gradient-to-r from-emerald-900/50 via-amber-900/50 to-purple-900/50 rounded-full overflow-hidden border border-white/5">
                    <div className="absolute top-0 h-full w-0.5 bg-white rounded-full transition-all duration-300" style={{ left: `${((pe - 5) / 45) * 100}%` }} />
                  </div>
                  <div className="text-center text-[7px] font-mono mt-0.5" style={{ color: peColor }}>P/E Ratio: {pe}x</div>
                </div>
                {/* Stock examples */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2">
                    <div className="text-[6.5px] font-black text-emerald-400 uppercase mb-1">💎 Value Stocks</div>
                    {valueStocks.map(s => <div key={s} className="text-[6px] font-mono text-slate-400">{s}</div>)}
                    <div className="text-[6px] font-mono text-emerald-400 mt-1">Low P/E, high dividend</div>
                  </div>
                  <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-2">
                    <div className="text-[6.5px] font-black text-purple-400 uppercase mb-1">🚀 Growth Stocks</div>
                    {growthStocks.map(s => <div key={s} className="text-[6px] font-mono text-slate-400">{s}</div>)}
                    <div className="text-[6px] font-mono text-purple-400 mt-1">High P/E, reinvest all</div>
                  </div>
                </div>
                <div className="text-center rounded-xl border px-2 py-1 text-[7px] font-mono transition-all duration-300" style={{ borderColor: `${peColor}40`, background: `${peColor}08`, color: peColor }}>
                  {isGrowth ? '🚀 Growth: paying premium for future earnings' : isValue ? '💎 Value: buying below intrinsic worth' : '⚖️ Blend: balanced risk/reward'}
                </div>
              </div>
            );
          })()}

          {(variant === 'reit' || variant === 'invit') && (
            <div className="flex gap-6 items-center">
              <div className="flex flex-col items-center bg-slate-900 p-3 rounded-2xl border border-white/10">
                <span className="text-4xl">{variant === 'reit' ? '🏢' : '🛣️'}</span>
                <span className="text-[6.5px] text-slate-400 font-mono mt-2 font-bold uppercase">{variant} Asset</span>
              </div>
              <span className="text-xl">➔</span>
              <div className="flex flex-col items-center bg-slate-900 p-3 rounded-2xl border border-white/10">
                <span className="text-4xl">💵</span>
                <span className="text-[6.5px] text-emerald-400 font-mono mt-2 font-bold uppercase">Rent yield: {val}%</span>
              </div>
            </div>
          )}

          {variant === 'beta' && (() => {
            // Educational: Beta — how much a stock moves vs Nifty
            const beta = val; // slider 0–3 mapped via parent config
            const mktMove = 5; // Nifty goes up 5%
            const stockMove = (beta * mktMove).toFixed(1);
            const betaColor = beta > 1.5 ? '#ef4444' : beta < 0.5 ? '#06b6d4' : '#f59e0b';
            const betaLabel = beta > 1.5 ? 'Aggressive' : beta < 0.5 ? 'Defensive' : 'Market-rate';
            return (
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-end gap-2 h-20">
                  {/* Nifty bar */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="text-[6.5px] font-mono text-slate-400 mb-1">+{mktMove}% (Nifty)</div>
                    <div className="w-full rounded-t bg-slate-500/50 transition-all duration-300" style={{ height: `${mktMove * 5}px` }} />
                    <div className="text-[6px] font-mono text-slate-500 mt-0.5">β=1 (Market)</div>
                  </div>
                  {/* Stock bar */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="text-[6.5px] font-mono mb-1" style={{ color: betaColor }}>+{stockMove}% (Stock)</div>
                    <div className="w-full rounded-t transition-all duration-500" style={{ height: `${Math.min(75, Math.abs(Number(stockMove)) * 5)}px`, background: betaColor, opacity: 0.8 }} />
                    <div className="text-[6px] font-mono mt-0.5" style={{ color: betaColor }}>β={beta.toFixed(1)}</div>
                  </div>
                </div>
                <div className="rounded-2xl border px-3 py-2 flex items-center justify-between transition-all duration-500"
                  style={{ background: `${betaColor}08`, borderColor: `${betaColor}30` }}>
                  <div>
                    <div className="text-[6.5px] font-mono text-slate-500 uppercase">Beta = {beta.toFixed(1)} → {betaLabel}</div>
                    <div className="text-[11px] font-black font-mono" style={{ color: betaColor }}>
                      Nifty +5% → Stock {Number(stockMove) >= 0 ? '+' : ''}{stockMove}%
                    </div>
                  </div>
                  <div className="text-[7px] font-mono text-right text-slate-400">
                    {beta > 1 ? 'Amplifies market' : beta < 1 ? 'Cushions swings' : 'Tracks market'}
                  </div>
                </div>
                <div className="text-[6.5px] font-mono text-slate-500 text-center">
                  Beta measures sensitivity: β{'<'}1 = defensive, β{'='}1 = market, β{'>'} 1 = aggressive
                </div>
              </div>
            );
          })()}

          {variant === 'alpha' && (() => {
            // Educational: Alpha — excess return vs benchmark
            const alpha = val; // % excess return
            const benchmarkRet = 12;
            const fundRet = benchmarkRet + alpha;
            const alphaColor = alpha > 0 ? '#10b981' : alpha < 0 ? '#ef4444' : '#64748b';
            return (
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-end gap-4 h-20 px-4">
                  {[
                    { label: 'Nifty 50', ret: benchmarkRet, color: '#475569' },
                    { label: 'Your Fund', ret: fundRet, color: alphaColor },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className="text-[6.5px] font-mono mb-1" style={{ color: item.color }}>{item.ret > 0 ? '+' : ''}{item.ret}%</div>
                      <div className="w-full rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(4, item.ret * 4)}px`, background: item.color, opacity: 0.8 }} />
                      <div className="text-[6px] font-mono text-slate-500 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border px-3 py-2 flex items-center justify-between"
                  style={{ background: `${alphaColor}08`, borderColor: `${alphaColor}30` }}>
                  <div>
                    <div className="text-[6.5px] font-mono text-slate-500 uppercase">Alpha Generated</div>
                    <div className="text-[16px] font-black font-mono" style={{ color: alphaColor }}>
                      {alpha > 0 ? '+' : ''}{alpha}%
                    </div>
                  </div>
                  <div className="text-right text-[7px] font-mono" style={{ color: alphaColor }}>
                    {alpha > 3 ? '🏆 Exceptional manager skill' : alpha > 0 ? '✅ Beating market' : alpha < 0 ? '⚠️ Underperforming' : '➡️ Neutral'}
                  </div>
                </div>
                <div className="text-[6.5px] font-mono text-slate-500 text-center">
                  Alpha = Fund return − Benchmark return. Positive alpha = manager adds value
                </div>
              </div>
            );
          })()}

          {variant === 'correlation' && (() => {
            // Educational: Correlation — diversification impact
            const corr = val; // 0 to 1
            const corrColor = corr > 0.7 ? '#ef4444' : corr < 0.3 ? '#10b981' : '#f59e0b';
            const overlap = Math.round(corr * 60);
            const portfolioRisk = Math.round(10 + corr * 15);
            return (
              <div className="w-full flex flex-col gap-2">
                {/* Venn diagram */}
                <div className="flex items-center justify-center h-16 relative">
                  <div className="w-14 h-14 rounded-full border-2 border-cyan-400 bg-cyan-500/10 absolute transition-all duration-500"
                    style={{ left: `${25 - overlap/3}%` }} />
                  <div className="w-14 h-14 rounded-full border-2 border-violet-400 bg-violet-500/10 absolute transition-all duration-500"
                    style={{ right: `${25 - overlap/3}%` }} />
                  <div className="absolute text-[7.5px] font-black font-mono" style={{ color: corrColor }}>r={corr.toFixed(2)}</div>
                </div>
                {/* Impact */}
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'Correlation', val: corr.toFixed(2), color: corrColor },
                    { label: 'Port Risk', val: `${portfolioRisk}%`, color: corrColor },
                    { label: 'Diversif.', val: corr < 0.5 ? 'High' : 'Low', color: corr < 0.5 ? '#10b981' : '#ef4444' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-1.5 text-center">
                      <div className="text-[5.5px] font-mono text-slate-500 uppercase">{item.label}</div>
                      <div className="text-[10px] font-black" style={{ color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[6.5px] font-mono text-center rounded-xl px-2 py-1 border transition-all duration-300"
                  style={{ color: corrColor, borderColor: `${corrColor}30`, background: `${corrColor}08` }}>
                  {corr > 0.7 ? '⚠️ High correlation — stocks move together, poor diversification' :
                   corr < 0.3 ? '✅ Low correlation — great diversification, reduces portfolio risk' :
                   '⚖️ Moderate correlation — some diversification benefit'}
                </div>
              </div>
            );
          })()}

          {variant === 'gold_etf' && (() => {
            // Educational: Gold ETF vs Physical Gold — storage cost vs liquidity
            const years = Math.max(1, val);
            const investAmt = 100000;
            const goldReturn = 0.10;
            const goldEtfCost = 0.005; // 0.5% expense ratio
            const physicalCost = 0.03; // 3% making + storage
            const goldEtfCorpus = investAmt * Math.pow(1 + goldReturn - goldEtfCost, years);
            const physicalCorpus = investAmt * Math.pow(1 + goldReturn - physicalCost, years);
            const advantage = goldEtfCorpus - physicalCorpus;
            return (
              <div className="w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Gold ETF', icon: '📈', corpus: goldEtfCorpus, cost: '0.5% p.a.', pros: ['Demat', 'No storage', 'Liquid'], color: '#f59e0b' },
                    { label: 'Physical', icon: '🥇', corpus: physicalCorpus, cost: '3% charges', pros: ['Tangible', 'No broker', 'Gift-able'], color: '#b45309' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-2xl border p-2.5 flex flex-col gap-1" style={{ background: `${item.color}08`, borderColor: `${item.color}30` }}>
                      <div className="flex items-center gap-1">
                        <span>{item.icon}</span>
                        <span className="text-[7.5px] font-black uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                      </div>
                      <div className="text-[12px] font-black font-mono" style={{ color: item.color }}>₹{Math.round(item.corpus/1000)}K</div>
                      <div className="text-[6px] font-mono text-slate-400">Cost: {item.cost}</div>
                      {item.pros.map(p => <div key={p} className="text-[6px] font-mono" style={{ color: item.color }}>✓ {p}</div>)}
                    </div>
                  ))}
                </div>
                <div className="text-[7px] font-mono text-amber-400 text-center bg-amber-950/30 border border-amber-500/20 rounded-xl px-2 py-1.5">
                  📈 Gold ETF beats physical by ₹{Math.round(advantage/1000)}K over {years} years!
                </div>
              </div>
            );
          })()}

          {variant === 'multi_asset' && (() => {
            // Educational: Multi-asset allocation — donut + live returns
            const equity = val;
            const debt = 30;
            const gold = Math.max(0, 70 - val);
            const circ = 251.3;
            const eqLen = (equity / 100) * circ;
            const dtLen = (debt / 100) * circ;
            const gdLen = (gold / 100) * circ;
            const eqReturn = equity * 0.14;
            const dtReturn = debt * 0.072;
            const gdReturn = gold * 0.10;
            const totalReturn = ((eqReturn + dtReturn + gdReturn) / 100).toFixed(2);
            return (
              <div className="w-full flex gap-3 items-center">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" strokeWidth="10"
                      strokeDasharray={`${eqLen} ${circ}`} strokeDashoffset={0} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="10"
                      strokeDasharray={`${dtLen} ${circ}`} strokeDashoffset={-eqLen} />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="10"
                      strokeDasharray={`${gdLen} ${circ}`} strokeDashoffset={-(eqLen + dtLen)} />
                    <circle cx="50" cy="50" r="32" fill="#090d16" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-black text-white">{totalReturn}%</div>
                    <div className="text-[5.5px] font-mono text-slate-500">CAGR</div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  {[
                    { label: 'Equity', pct: equity, color: '#06b6d4', ret: '14%' },
                    { label: 'Debt', pct: debt, color: '#8b5cf6', ret: '7.2%' },
                    { label: 'Gold', pct: gold, color: '#f59e0b', ret: '10%' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[6.5px] font-mono mb-0.5">
                        <span style={{ color: item.color }}>{item.label} {item.ret}</span>
                        <span className="text-slate-400">{item.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {variant === 'smallcase' && (() => {
            // Educational: Smallcase — thematic basket investing
            const themes = [
              { name: 'EV Future', stocks: ['Tata Motors', 'KPIT', 'Exide'], returns: 28.4, color: '#10b981' },
              { name: 'Bank Nifty', stocks: ['HDFC', 'ICICI', 'Kotak'], returns: 18.2, color: '#06b6d4' },
              { name: 'Green Energy', stocks: ['NTPC', 'Adani Green', 'SJVN'], returns: 22.1, color: '#34d399' },
              { name: 'IT Giants', stocks: ['TCS', 'Infosys', 'Wipro'], returns: 16.8, color: '#8b5cf6' },
            ];
            const selectedIdx = Math.min(3, Math.floor(val / 25));
            const theme = themes[selectedIdx];
            return (
              <div className="w-full flex flex-col gap-2">
                <div className="flex gap-1 flex-wrap">
                  {themes.map((t, i) => (
                    <div key={i} className="flex-1 min-w-[40%] rounded-xl border px-2 py-1.5 text-center cursor-pointer transition-all duration-300"
                      style={{
                        background: i === selectedIdx ? `${t.color}18` : 'transparent',
                        borderColor: i === selectedIdx ? `${t.color}60` : 'rgba(255,255,255,0.05)',
                      }}>
                      <div className="text-[7px] font-black" style={{ color: i === selectedIdx ? t.color : '#475569' }}>{t.name}</div>
                      <div className="text-[8px] font-black" style={{ color: i === selectedIdx ? t.color : '#334155' }}>{t.returns}%</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border p-2.5 space-y-1" style={{ background: `${theme.color}08`, borderColor: `${theme.color}30` }}>
                  <div className="text-[7.5px] font-black uppercase tracking-wider" style={{ color: theme.color }}>💼 {theme.name} Smallcase</div>
                  {theme.stocks.map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.color }} />
                      <span className="text-[7px] font-mono text-slate-300">{s}</span>
                    </div>
                  ))}
                  <div className="text-[8px] font-black font-mono pt-1 border-t border-white/5" style={{ color: theme.color }}>CAGR: {theme.returns}%</div>
                </div>
              </div>
            );
          })()}
        </div>

        {variant !== 'portfolio' && (
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>Balance: <strong className="text-cyan-400">{leftWeight}%</strong> / <strong className="text-violet-400">{rightWeight}%</strong></span>
            <span>Status: <strong className={isOptimal ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{isOptimal ? 'Balanced' : 'Drifting'}</strong></span>
          </div>
        )}
      </div>
    );
  };

  const renderVaultEngine = (params, value, secValue) => {
    const { variant = 'emergency', accentColor = '#ef4444', label = 'Savings Vault' } = params;
    const val = value;
    const isTax80c = variant === 'tax_80c';

    // Set proper thresholds and states per variant for bottom indicators
    let isProtected = false;
    let limitLabel = val.toLocaleString();
    let statusLabel = "Low";

    if (variant === 'tax_80c') {
      isProtected = val >= 150000;
      limitLabel = `₹${val.toLocaleString()}`;
      statusLabel = isProtected ? "Fully Protected" : `${Math.round((val / 150000) * 100)}% Protected`;
    } else if (variant === 'emergency') {
      isProtected = val >= 5;
      limitLabel = `${val} Months`;
      statusLabel = isProtected ? "Secure Buffer" : "Vulnerable";
    } else if (variant === 'emergency_alloc') {
      isProtected = val >= 80;
      limitLabel = `${val}% Shock`;
      statusLabel = isProtected ? "Insulated" : "Testing Buffer";
    } else if (variant === 'budget') {
      isProtected = val <= 30; // Wants <= 30% means Savings >= 20%
      const savingsRate = 50 - val;
      limitLabel = `${savingsRate}%`;
      statusLabel = isProtected ? "Optimal Savings" : savingsRate >= 0 ? "Low Savings" : "Budget Deficit";
    } else if (variant === 'checking') {
      isProtected = val < 80;
      limitLabel = `${val} Txns`;
      statusLabel = isProtected ? "Safe Buffer" : "Overdraft Risk";
    } else if (variant === 'tax_87a') {
      isProtected = val <= 700000; // Tax rebate up to 7L
      limitLabel = `₹${val.toLocaleString()}`;
      statusLabel = isProtected ? "Tax Rebatable" : "Taxable Income";
    } else if (variant === 'elss') {
      isProtected = val >= 150000;
      limitLabel = `₹${val.toLocaleString()}`;
      statusLabel = isProtected ? "Tax Deducted" : `${Math.round((val / 150000) * 100)}% Deductible`;
    } else if (variant === 'savings_rate') {
      isProtected = val >= 30; // 30% savings rate is gold standard
      limitLabel = `${val}%`;
      statusLabel = isProtected ? "Gold Standard" : "Increase Savings";
    } else {
      isProtected = val >= 50;
      limitLabel = val.toLocaleString();
      statusLabel = isProtected ? "Protected" : "Low";
    }

    const isEmergency = variant === 'emergency';

    return (
      <div className={`relative w-full max-w-sm ${isTax80c || isEmergency || variant === 'emergency_alloc' || variant === 'savings_rate' ? 'min-h-[350px] h-auto py-3' : 'h-64'} bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`}>
        <div className="absolute top-2 left-3 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Savings Vault Shield • {label}
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative mt-2 w-full">
          {variant === 'emergency' && (
            <div className="w-full flex flex-col items-center gap-2.5">
              {/* Sci-Fi Liquid Plasma Capsule */}
              <div className="relative w-24 h-32 flex items-center justify-center overflow-visible">
                {/* CSS styles inside React for keyframe animations */}


                {/* Storm Shield forcefield (visible when val >= 5, representing fully protected emergency buffer) */}
                {val >= 5 && (
                  <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 80 120">
                    <rect 
                      x="10" 
                      y="5" 
                      width="60" 
                      height="110" 
                      rx="30" 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeDasharray="4,3"
                      filter="url(#glow-cyan)"
                      style={{ 
                        animation: 'storm-shield-pulse 2.5s ease-in-out infinite',
                        transformOrigin: '40px 60px' 
                      }} 
                    />
                    {val >= 6 && (
                      <rect 
                        x="6" 
                        y="1" 
                        width="68" 
                        height="118" 
                        rx="34" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="0.8"
                        opacity="0.25"
                      />
                    )}
                  </svg>
                )}

                {/* Main Glass Flask SVG */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 80 120">
                  <defs>
                    <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={val >= 5 ? '#34d399' : val >= 3 ? '#fbbf24' : '#f43f5e'} />
                      <stop offset="100%" stopColor={val >= 5 ? '#047857' : val >= 3 ? '#b45309' : '#9f1239'} />
                    </linearGradient>
                    
                    <linearGradient id="wave2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={val >= 5 ? '#10b981' : val >= 3 ? '#f59e0b' : '#ef4444'} stopOpacity="0.6" />
                      <stop offset="100%" stopColor={val >= 5 ? '#065f46' : val >= 3 ? '#78350f' : '#7f1d1d'} stopOpacity="0.9" />
                    </linearGradient>

                    {/* Clip path representing the inside of the capsule (so liquid wave fits perfectly) */}
                    <clipPath id="flaskInside">
                      <rect x="21" y="11" width="38" height="98" rx="19" />
                    </clipPath>
                  </defs>

                  {/* Measurement tick marks on left side */}
                  <g stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="none">
                    {[1, 2, 3, 4, 5, 6].map((m) => {
                      const y = 109 - (m / 6) * 98;
                      return (
                        <g key={m}>
                          <line x1="14" y1={y} x2="18" y2={y} />
                          <text x="10" y={y + 1.5} fontSize="3.5" fill="#64748b" textAnchor="end" fontFamily="monospace" stroke="none">{m}M</text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Flask Outer casing & border */}
                  <rect 
                    x="20" 
                    y="10" 
                    width="40" 
                    height="100" 
                    rx="20" 
                    fill="#0f172a" 
                    stroke="rgba(255,255,255,0.08)" 
                    strokeWidth="1.5" 
                  />

                  {/* Inside Content (Clipped to Flask dimensions) */}
                  <g clipPath="url(#flaskInside)">
                    {/* Background shading */}
                    <rect x="21" y="11" width="38" height="98" fill="#090d1a" />

                    {/* Liquid fill group */}
                    {val > 0 && (
                      <g style={{ transform: `translateY(${98 - (val / 6) * 98}px)` }}>
                        {/* Wave 2 (Behind) */}
                        <path 
                          d="M -40 10 Q -20 13 0 10 T 40 10 T 80 10 T 120 10 L 120 110 L -40 110 Z" 
                          fill="url(#wave2Grad)" 
                          style={{ 
                            animation: 'wave-slide-1 2s linear infinite',
                            transformOrigin: '50% 10px'
                          }} 
                        />
                        {/* Wave 1 (Front) */}
                        <path 
                          d="M -40 10 Q -20 6 0 10 T 40 10 T 80 10 T 120 10 L 120 110 L -40 110 Z" 
                          fill="url(#liquidGrad)" 
                          style={{ 
                            animation: 'wave-slide-2 1.4s linear infinite',
                            transformOrigin: '50% 10px'
                          }} 
                        />

                        {/* Sparkles / Bubbles (rendered only when liquid is active) */}
                        <circle cx="28" cy="40" r="1.2" fill="#fff" style={{ animation: 'bubble-rise-1 3s infinite linear' }} />
                        <circle cx="38" cy="65" r="0.8" fill="#fff" style={{ animation: 'bubble-rise-2 2s infinite linear 0.5s' }} />
                        <circle cx="48" cy="25" r="1.5" fill="#fff" style={{ animation: 'bubble-rise-1 4s infinite linear 1s' }} />
                        <circle cx="33" cy="80" r="1" fill="#fff" style={{ animation: 'bubble-rise-2 2.5s infinite linear 1.2s' }} />
                      </g>
                    )}
                  </g>

                  {/* Highlight Glass reflection overlay */}
                  <path 
                    d="M 23 20 A 17 17 0 0 1 35 12" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.18)" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                  />
                  <line x1="56" y1="25" x2="56" y2="95" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeLinecap="round" />

                  {/* Top LED Indicator Core */}
                  <circle cx="40" cy="14" r="2" fill={val >= 5 ? '#10b981' : val >= 3 ? '#fbbf24' : '#f43f5e'} style={{ animation: 'core-glow 1s ease-in-out infinite' }} />

                  {/* Central Text HUD label inside the Flask */}
                  <text 
                    x="40" 
                    y="63" 
                    fontSize="9.5" 
                    fill="#fff" 
                    fontWeight="black" 
                    fontFamily="monospace" 
                    textAnchor="middle" 
                    className="select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    {val}M
                  </text>
                </svg>

                {/* Mini telemetry badge inside visual viewport */}
                <div className="absolute -bottom-1 text-[7.5px] font-mono font-bold px-2 py-0.5 rounded border bg-slate-950/80 tracking-wide text-center"
                     style={{
                       borderColor: val >= 5 ? 'rgba(16,185,129,0.3)' : val >= 3 ? 'rgba(245,158,11,0.3)' : 'rgba(244,63,94,0.3)',
                       color: val >= 5 ? '#34d399' : val >= 3 ? '#fbbf24' : '#f43f5e'
                     }}>
                  {val >= 5 ? 'SHIELD READY' : 'RECHARGE REQUIRED'}
                </div>
              </div>
              
              <span className="text-[9.5px] text-slate-400 font-mono font-bold">Emergency Cushion (Months)</span>

              {/* Real-Time Glassmorphic Safety Ledger Card */}
              <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 shadow-xl text-left">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📊 SAFETY CORNER LEDGER</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  {/* Left Column: Metrics */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Parameters</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Monthly Expense:</span>
                      <span className="text-white font-bold">₹50,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Safety Fund:</span>
                      <span className="text-cyan-400 font-bold">₹{(val * 50000).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Right Column: Status */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Buffer Benchmark</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400">Target cover:</span>
                        <span className="text-emerald-400 font-bold">6 Months</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                      <span className="text-slate-400">Shortfall:</span>
                      <span className={val >= 6 ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                        {val >= 6 ? "₹0 (Fully Covered)" : `₹${(300000 - val * 50000).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="space-y-1.5 pt-1">
                  {val < 5 ? (
                    <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                      <span className="text-rose-300 font-semibold flex items-center gap-1">🔴 Safety Status:</span>
                      <span className="text-rose-400 font-black text-xs uppercase tracking-wide">High Risk (Vulnerable)</span>
                    </div>
                  ) : val < 6 ? (
                    <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                      <span className="text-amber-300 font-semibold flex items-center gap-1">🟡 Safety Status:</span>
                      <span className="text-amber-400 font-black text-xs uppercase tracking-wide">Moderate Protection</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">🟢 Safety Status:</span>
                      <span className="text-emerald-400 font-black text-xs uppercase tracking-wide">Secure (Shield Fully Deployed)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actionable Explanation Alert */}
              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-2.5 text-[8.5px] text-slate-300 leading-normal flex items-start gap-2 shadow-sm text-left">
                <span className="text-sm select-none">💡</span>
                <div>
                  <span className="text-sky-400 font-bold mr-1">Emergency Rule:</span>
                  An emergency fund acts as a financial shock absorber. Experts recommend holding <strong className="text-white font-semibold">6 months</strong> of living expenses in highly liquid bank accounts. If a sudden crisis occurs (like job loss or medical emergency), you don't have to break your long-term investments or take high-interest loans.
                </div>
              </div>
            </div>
          )}

          {variant === 'emergency_alloc' && (() => {
            const liquidLevel = Math.max(0, 100 - val);
            const isShieldActive = val >= 80;

            return (
              <div 
                className="w-full flex flex-col gap-3.5 select-none"
                onMouseEnter={() => setHoveredControl("[SHIELD.ALLOCATION] Emergency Asset Insulation: Splitting assets between liquid cash and equity. When a personal/economic crisis strikes, expenses drain cash from the Liquid bucket, shielding your compounding Equity from forced liquidation.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* 3 Canisters Container */}
                <div className="flex justify-between items-end h-[150px] w-full bg-slate-950/40 border border-white/5 rounded-2xl p-3 relative overflow-hidden">
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                  {/* Shield Dome overlay spanning Equity and Debt */}
                  <div className="absolute left-[36%] right-[2%] top-[10%] bottom-[5%] rounded-t-full border-2 border-t-emerald-500 border-x-emerald-500/30 border-b-transparent pointer-events-none transition-all duration-500"
                       style={{
                         background: isShieldActive ? 'radial-gradient(circle at 50% 20%, rgba(16,185,129,0.08) 0%, transparent 80%)' : 'none',
                         filter: isShieldActive ? 'drop-shadow(0 0 10px rgba(16,185,129,0.3))' : 'none',
                         animation: isShieldActive ? 'pulse 2s infinite' : 'none'
                       }} />

                  {/* Canister 1: Liquid Cash */}
                  <div className="flex flex-col items-center w-[28%] relative z-10">
                    <div className="text-[6.5px] text-sky-400 font-mono font-bold uppercase tracking-wider mb-1">Liquid Cash</div>
                    <div className="relative w-full h-[95px] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex items-end">
                      {/* Fluid fill level */}
                      <div 
                        className="w-full bg-gradient-to-t from-sky-600 to-sky-400 transition-all duration-300 relative"
                        style={{ height: `${liquidLevel}%` }}
                      >
                        {/* Bubbles / Wave effect inside liquid */}
                        {liquidLevel > 0 && (
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/30 animate-pulse" />
                        )}
                      </div>
                      {/* Empty indicator */}
                      {liquidLevel === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[7px] text-red-400 font-mono font-black animate-pulse">DEPLETED</div>
                      )}
                    </div>
                    <div className="text-[9px] font-black font-mono text-white mt-1">₹${Math.max(0, 300 - val * 3)}K</div>
                  </div>

                  {/* Canister 2: Equity Portfolio */}
                  <div className="flex flex-col items-center w-[28%] relative z-10">
                    <div className="text-[6.5px] text-emerald-400 font-mono font-bold uppercase tracking-wider mb-1">Equity</div>
                    <div className="relative w-full h-[95px] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex items-end">
                      {/* Fluid fill level - 100% constant */}
                      <div className="w-full h-full bg-gradient-to-t from-emerald-700 to-emerald-400 relative">
                        <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      </div>
                    </div>
                    <div className="text-[9px] font-black font-mono text-white mt-1">₹1,000K</div>
                  </div>

                  {/* Canister 3: Debt Portfolio */}
                  <div className="flex flex-col items-center w-[28%] relative z-10">
                    <div className="text-[6.5px] text-violet-400 font-mono font-bold uppercase tracking-wider mb-1">Debt Assets</div>
                    <div className="relative w-full h-[95px] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex items-end">
                      {/* Fluid fill level - 100% constant */}
                      <div className="w-full h-full bg-gradient-to-t from-violet-700 to-violet-400 relative">
                        <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                      </div>
                    </div>
                    <div className="text-[9px] font-black font-mono text-white mt-1">₹500K</div>
                  </div>
                </div>

                {/* Storm Cloud and Lightning display if Crisis >= 10 */}
                {val >= 10 && (
                  <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-xl animate-bounce">⚡</span>
                      <div className="flex flex-col">
                        <span className="text-[7.5px] text-slate-400 font-bold uppercase">Crisis Status</span>
                        <span className="text-[10px] text-white font-extrabold font-mono">SHOCK FORCE: ${val}%</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[10px] text-rose-400 font-extrabold font-mono">Drained ₹${val * 3}K</span>
                      <span className="text-[6.5px] text-slate-500 font-mono uppercase">absorbed from liquid</span>
                    </div>
                  </div>
                )}

                {/* Shield Dome Status Advice */}
                <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 text-left space-y-1">
                  <div className="text-[9px] text-emerald-400 font-black flex items-center gap-1">
                    <span>🛡️</span>
                    <span>Emergency Dome Insulation: ${isShieldActive ? "ACTIVE (100% SAFE)" : "MONITORING SHOCK"}</span>
                  </div>
                  <p className="text-[7.5px] text-emerald-300 leading-normal">
                    ${isShieldActive 
                      ? "A severe crisis struck, but your liquid cash fully absorbed the shock. Your high-growth Equity compounding remains undisturbed under the safety dome, avoiding forced sales at market bottoms!" 
                      : "Increase crisis magnitude to see how the Liquid Cash buffer keeps the Equity Portfolio completely isolated and protected."}
                  </p>
                </div>
              </div>
            );
          })()}

          {variant === 'tax_80c' && (
            <div className="w-full flex flex-col items-center gap-2.5">
              {/* Interactive SVG Coin Pipeline */}
              <svg className="w-full h-28 overflow-visible" viewBox="0 0 120 70">
                <defs>
                  {/* Glow Filters */}
                  <filter id="glow-red-80c" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-green-80c" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>



                {/* Backplate grid lines */}
                <rect x="2" y="2" width="116" height="66" rx="4" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" strokeDasharray="2,3" />

                {/* Left Source Box: Exposed Income */}
                <g transform="translate(8, 23)">
                  <rect x="0" y="0" width="24" height="20" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                  <rect x="0" y="0" width="24" height="20" rx="4" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.8" />
                  <text x="12" y="7" fontSize="4.2" fill="#94a3b8" textAnchor="middle" fontWeight="black" fontFamily="sans-serif" letterSpacing="0.1">INCOME</text>
                  <text x="12" y="14" fontSize="5.2" fill="#fff" textAnchor="middle" fontWeight="bold" fontFamily="monospace">₹1.5L</text>
                </g>

                {/* Intersection Split Point (The 80C Shield Valve / Futuristic Dial Needle) */}
                <g transform="translate(48, 33)">
                  {/* Concentric rings */}
                  <circle cx="0" cy="0" r="7.5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                  <circle cx="0" cy="0" r="5" fill="#1e293b" stroke={val >= 150000 ? '#10b981' : val >= 50000 ? '#06b6d4' : '#ef4444'} strokeWidth="1" style={{ transition: 'stroke 0.3s ease' }} />
                  
                  {/* Indicator Needle */}
                  <g style={{ 
                    transform: `rotate(${(val/150000) * 180 - 90}deg)`,
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}>
                    <line x1="0" y1="0" x2="0" y2="-5.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="0" cy="-5.5" r="0.8" fill={val >= 150000 ? '#10b981' : val >= 50000 ? '#06b6d4' : '#ef4444'} style={{ transition: 'fill 0.3s ease' }} />
                  </g>
                </g>

                {/* Pipelines */}
                {/* 1. Main pipe from Income to Valve (Dual-Layer) */}
                <path d="M 32 33 L 40.5 33" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 32 33 L 40.5 33" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />

                {/* 2. Tax Leak Pipeline (Leads up to Govt Tax box - Dual-Layer) */}
                <path d="M 48 26.5 Q 48 14 74 14" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" strokeLinecap="round" />
                <path 
                  d="M 48 26.5 Q 48 14 74 14" 
                  fill="none" 
                  stroke={val >= 150000 ? 'rgba(239, 68, 68, 0.1)' : '#f43f5e'} 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                  strokeDasharray="4,4"
                  style={{ 
                    animation: val < 150000 ? 'flow-tax 0.8s linear infinite' : 'none',
                    transition: 'stroke 0.4s ease'
                  }}
                  filter={val < 150000 ? 'url(#glow-red-80c)' : 'none'}
                />

                {/* 3. Wealth Saved Pipeline (Leads down to Savings box - Dual-Layer) */}
                <path d="M 48 39.5 Q 48 52 74 52" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" strokeLinecap="round" />
                <path 
                  d="M 48 39.5 Q 48 52 74 52" 
                  fill="none" 
                  stroke={val > 0 ? '#34d399' : 'rgba(16, 185, 129, 0.1)'} 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                  strokeDasharray="4,4"
                  style={{ 
                    animation: val > 0 ? 'flow-save 0.8s linear infinite' : 'none',
                    transition: 'stroke 0.4s ease'
                  }}
                  filter={val > 0 ? 'url(#glow-green-80c)' : 'none'}
                />

                {/* Top Target Box: Govt Tax Treasury (Glow Glassmorphic) */}
                <g transform="translate(74, 6)">
                  <rect x="0" y="0" width="38" height="16" rx="4" fill="#0f0c15" stroke={val >= 150000 ? 'rgba(255,255,255,0.08)' : '#ef4444'} strokeWidth="1" style={{ transition: 'stroke 0.4s ease' }} />
                  {val < 150000 && <rect x="0" y="0" width="38" height="16" rx="4" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.35" filter="url(#glow-red-80c)" />}
                  <text x="19" y="6" fontSize="3.8" fill={val >= 150000 ? '#475569' : '#f43f5e'} textAnchor="middle" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.1">GOVT TAX</text>
                  <text x="19" y="12.5" fontSize="5.2" fill={val >= 150000 ? '#475569' : '#fff'} textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                    ₹{Math.round((150000 - val) * 0.3).toLocaleString()}
                  </text>
                </g>

                {/* Bottom Target Box: Your Wealth Savings (Glow Glassmorphic) */}
                <g transform="translate(74, 44)">
                  <rect x="0" y="0" width="38" height="16" rx="4" fill="#0c1110" stroke={val > 0 ? '#10b981' : 'rgba(255,255,255,0.08)'} strokeWidth="1" style={{ transition: 'stroke 0.4s ease' }} />
                  {val > 0 && <rect x="0" y="0" width="38" height="16" rx="4" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.35" filter="url(#glow-green-80c)" />}
                  <text x="19" y="6" fontSize="3.8" fill={val > 0 ? '#10b981' : '#475569'} textAnchor="middle" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.1">YOUR SAVINGS</text>
                  <text x="19" y="12.5" fontSize="5.2" fill={val > 0 ? '#fff' : '#475569'} textAnchor="middle" fontWeight="bold" fontFamily="monospace">
                    ₹{Math.round(val * 0.3).toLocaleString()}
                  </text>
                </g>
              </svg>

              {/* Real-Time Glassmorphic Ledger Card */}
              <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📊 LIVE TELEMETRY LEDGER</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  {/* Left Column: Parameters */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Parameters</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">💼 80C Limit:</span>
                      <span className="text-white font-bold">₹1,50,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">💰 Outlay:</span>
                      <span className="text-amber-400 font-bold">₹{val.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Right Column: Remainder */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Exposure</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 flex items-center gap-1">⚖️ Taxable Rest:</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                      <span className="text-slate-400">Exposed:</span>
                      <span className="text-rose-400 font-extrabold">₹{(150000 - val).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Outcomes */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                    <span className="text-rose-300 font-semibold flex items-center gap-1">🔴 Tax Paid (30% Slab) — Cash Lost:</span>
                    <span className="text-rose-400 font-black text-xs">₹{Math.round((150000 - val) * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">🟢 Tax Saved — Cash Retained:</span>
                    <span className="text-emerald-400 font-black text-xs">₹{Math.round(val * 0.3).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actionable Explanation Alert (Formatted with clean bold text) */}
              <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5 text-[8.5px] text-slate-300 leading-normal flex items-start gap-2 shadow-sm">
                <span className="text-sm select-none">💡</span>
                <div>
                  <span className="text-emerald-400 font-bold mr-1">Practical Rule:</span>
                  Under Section 80C, investing in tax-saving options like <strong className="text-white font-semibold">ELSS</strong> or <strong className="text-white font-semibold">PPF</strong> directly reduces your taxable income. Dragging the slider to the full <strong className="text-emerald-400 font-semibold">₹1.5 Lakhs</strong> shuts off the Govt Tax pipe completely, keeping <strong className="text-emerald-400 font-semibold">₹45,000</strong> in your pocket instead of paying it to the government!
                </div>
              </div>
            </div>
          )}

          {variant === 'budget' && (() => {
            const needs = 50;
            const wants = val;
            const savings = 50 - val;
            const hasDeficit = savings < 0;
            const absSavings = Math.abs(savings);

            // Donut math (radius = 38, circ = 238.76)
            const circ = 238.76;
            
            // Needs segment (always 50% = 119.38 length)
            const needsLen = 119.38;
            
            // Wants segment (val%)
            const wantsLen = (wants / 100) * circ;
            const wantsOffset = -needsLen; // starts right after Needs
            
            // Savings segment (if surplus)
            const savingsLen = savings > 0 ? (savings / 100) * circ : 0;
            const savingsOffset = -(needsLen + wantsLen);
            
            // Deficit segment overlay (if wants > 50%)
            const deficitLen = hasDeficit ? (Math.min(wants - 50, 50) / 100) * circ : 0;

            return (
              <div className="w-full flex items-center justify-between gap-4 px-1">

                {/* Left Column: Interactive Donut Chart */}
                <div className="w-[105px] h-[105px] relative flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#111827" strokeWidth="9" />
                    
                    {/* Needs Segment (Green) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="9"
                            strokeDasharray={`${needsLen} ${circ}`} strokeDashoffset={0} strokeLinecap="round" />
                    
                    {/* Wants Segment (Amber) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke={hasDeficit ? "#f59e0b" : "#fb923c"} strokeWidth="9"
                            strokeDasharray={`${wantsLen} ${circ}`} strokeDashoffset={wantsOffset} 
                            strokeLinecap={savings > 0 ? "round" : "butt"} />
                    
                    {/* Savings Segment (Cyan, if positive) */}
                    {savings > 0 && (
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="9"
                              strokeDasharray={`${savingsLen} ${circ}`} strokeDashoffset={savingsOffset} strokeLinecap="round" />
                    )}

                    {/* Deficit Segment Overlay (Red, if negative) */}
                    {hasDeficit && (
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="10"
                              className="deficit-glow"
                              strokeDasharray={`${deficitLen} ${circ}`} strokeDashoffset={0} strokeLinecap="round" />
                    )}

                    {/* Inner Core Shading */}
                    <circle cx="50" cy="50" r="33" fill="#090d16" />
                  </svg>

                  {/* Centered Telemetry readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[7px] text-slate-500 font-mono tracking-wider uppercase">
                      {hasDeficit ? "DEFICIT" : "SAVINGS"}
                    </span>
                    <span className={`text-[12px] font-black font-mono leading-none mt-0.5 ${hasDeficit ? "text-rose-400" : savings >= 20 ? "text-emerald-400" : "text-cyan-400"}`}>
                      {hasDeficit ? `-${absSavings}%` : `+${savings}%`}
                    </span>
                  </div>
                </div>

                {/* Right Column: Glassmorphic Status Panels */}
                <div className="flex-1 flex flex-col gap-2 font-mono">
                  {/* Needs Panel */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-xl p-1.5 px-2.5 flex items-center justify-between text-[9px] relative overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🏡</span>
                      <span className="text-slate-400 font-bold">Needs</span>
                    </div>
                    <span className="text-emerald-400 font-black">50%</span>
                    <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/30" style={{ width: '50%' }} />
                  </div>

                  {/* Wants Panel */}
                  <div className={`bg-slate-900/40 border rounded-xl p-1.5 px-2.5 flex items-center justify-between text-[9px] relative overflow-hidden transition-all ${hasDeficit ? "border-rose-500/20" : "border-white/5"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🍔</span>
                      <span className="text-slate-400 font-bold">Wants</span>
                    </div>
                    <span className={`font-black ${hasDeficit ? "text-rose-400" : wants > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                      {wants}%
                    </span>
                    <div className={`absolute bottom-0 left-0 h-0.5 ${hasDeficit ? "bg-rose-500/60" : "bg-amber-500/40"}`} style={{ width: `${Math.min(wants, 100)}%` }} />
                  </div>

                  {/* Savings Panel */}
                  <div className={`bg-slate-900/40 border rounded-xl p-1.5 px-2.5 flex items-center justify-between text-[9px] relative overflow-hidden transition-all ${hasDeficit ? "border-rose-500/30 bg-rose-500/5" : "border-white/5"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{hasDeficit ? "⚠️" : "🏦"}</span>
                      <span className="text-slate-400 font-bold">{hasDeficit ? "Deficit" : "Savings"}</span>
                    </div>
                    <span className={`font-black ${hasDeficit ? "text-rose-400 animate-pulse" : savings >= 20 ? "text-emerald-400" : "text-cyan-400"}`}>
                      {hasDeficit ? `-${absSavings}%` : `${savings}%`}
                    </span>
                    {!hasDeficit && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-500/40" style={{ width: `${Math.max(0, savings)}%` }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {variant === 'checking' && (() => {
            const txCount = val;
            const isOverdrawn = txCount >= 80;
            const balance = Math.max(-2500, 20000 - txCount * 250);
            const isNegative = balance < 0;

            return (
              <div className="flex flex-col items-center w-full gap-3 px-1">
                {/* Visualizer Canvas: Checking Card vs Savings Card */}
                <div className="flex items-center justify-between w-full gap-3 mt-1">
                  
                  {/* Checking Account (Active Spending) */}
                  <div className={`flex-1 bg-slate-900/80 border ${isNegative ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/5'} rounded-2xl p-2.5 flex flex-col justify-between h-[125px] relative transition-all duration-300`}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col text-left">
                        <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Checking Account</span>
                        <span className="text-[6.5px] text-slate-500 font-mono">Daily Transactions</span>
                      </div>
                      <span className="text-sm">💳</span>
                    </div>

                    <div className="my-2 text-left">
                      <span className="text-[8px] text-slate-500 block">Available Balance</span>
                      <strong className={`text-sm font-mono ${isNegative ? 'text-red-400 font-black animate-pulse' : 'text-cyan-400'}`}>
                        {balance < 0 ? `-₹${Math.abs(balance)}` : `₹${balance}`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                      <span>Txns: <strong>{txCount}/mo</strong></span>
                      <span className={`px-1 rounded-sm ${isNegative ? 'bg-red-500/20 text-red-400 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        {isNegative ? 'OVERDRAFT' : 'ACTIVE'}
                      </span>
                    </div>
                    {isNegative && (
                      <div className="absolute inset-0 bg-red-950/10 border border-red-500/30 rounded-2xl pointer-events-none animate-pulse" />
                    )}
                  </div>

                  {/* Transaction Flow Animation Conduit */}
                  <div className="flex flex-col items-center justify-center w-8 shrink-0">
                    <svg className="w-8 h-16 overflow-visible" viewBox="0 0 32 64">
                      {/* Flow arrow/path from Checking (outwards) */}
                      <path d="M 0 32 L 32 32" fill="none" stroke={isOverdrawn ? "#ef4444" : "#10b981"} strokeWidth="2" strokeDasharray="3,3"
                            style={{ animation: `flow ${isOverdrawn ? '0.4s' : '1.2s'} linear infinite` }} />
                      
                      {/* Floating Transaction Particles */}
                      {txCount > 0 && (
                        <circle r="2" fill={isOverdrawn ? "#f43f5e" : "#34d399"} filter="drop-shadow(0 0 2px #34d399)"
                                style={{
                                  animation: 'flow 1s linear infinite',
                                  offsetPath: "path('M 0 32 L 32 32')",
                                  offsetRotate: '0deg'
                                }} />
                      )}

                      {/* Small text indicating cash outflow */}
                      <text x="16" y="22" fontSize="5" fill="#94a3b8" textAnchor="middle" fontFamily="monospace" fontWeight="bold" className="animate-pulse">
                        {isOverdrawn ? "DRAIN" : "PAY"}
                      </text>
                    </svg>
                  </div>

                  {/* Savings Account (Compounding Shield) */}
                  <div className="flex-1 bg-slate-900/80 border border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.08)] rounded-2xl p-2.5 flex flex-col justify-between h-[125px] relative">
                    {/* Glowing shield overlay */}
                    <div className="absolute inset-0 border border-emerald-500/15 rounded-2xl pointer-events-none" 
                         style={{ boxShadow: 'inset 0 0 12px rgba(16,185,129,0.05)' }} />

                    <div className="flex justify-between items-start">
                      <div className="flex flex-col text-left">
                        <span className="text-[7.5px] text-emerald-400 font-bold uppercase tracking-wider">High-Yield Savings</span>
                        <span className="text-[6.5px] text-slate-500 font-mono">Interest Compounding</span>
                      </div>
                      <span className="text-sm">🏦</span>
                    </div>

                    <div className="my-2 text-left">
                      <span className="text-[8px] text-slate-500 block">Protected Balance</span>
                      <strong className="text-sm text-emerald-400 font-mono">₹1,00,000</strong>
                    </div>

                    <div className="flex justify-between items-center text-[7.5px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                      <span>Rate: <strong className="text-emerald-400">7.5% APY</strong></span>
                      <span className="px-1 rounded-sm bg-emerald-500/20 text-emerald-400 font-bold">
                        SECURE
                      </span>
                    </div>
                  </div>

                </div>

                {/* Overdraft warning alert box */}
                {isOverdrawn && (
                  <div className="w-full bg-red-500/10 border border-red-500/25 rounded-xl p-2 text-[8px] text-red-300 flex items-start gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.05)] animate-bounce text-left">
                    <span className="text-xs">⚠️</span>
                    <div>
                      <strong className="text-red-400 font-bold">Overdraft Fee Triggered!</strong> Daily transactions exceeded buffer threshold. <span className="text-white font-semibold">₹1,500 penalty</span> assessed. Transfer funds from High-Yield Savings to cover the deficit.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {variant === 'tax_87a' && (() => {
            // Educational: Tax 87A rebate — income under 7L = ZERO tax
            const income = val * 100000; // slider 1-12 = ₹1L-₹12L
            const isRebatable = val <= 7;
            const taxSlab = val <= 3 ? 0 : val <= 6 ? (income - 300000) * 0.05 : val <= 9 ? (300000 * 0.05 + (income - 600000) * 0.10) : (300000 * 0.05 + 300000 * 0.10 + (income - 900000) * 0.15);
            const finalTax = isRebatable ? 0 : Math.round(taxSlab);
            const rebate = isRebatable ? Math.min(25000, Math.round(taxSlab)) : 0;
            const slabs = [
              { label: '0–3L', rate: '0%', color: '#10b981', active: val >= 1 },
              { label: '3–6L', rate: '5%', color: '#34d399', active: val >= 4 },
              { label: '6–9L', rate: '10%', color: '#f59e0b', active: val >= 7 },
              { label: '9–12L', rate: '15%', color: '#ef4444', active: val >= 10 },
            ];
            return (
              <div className="w-full flex flex-col gap-2">
                {/* Tax slab ladder */}
                <div className="flex items-end gap-1 h-16">
                  {slabs.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="text-[6px] font-mono font-black" style={{ color: s.active ? s.color : '#334155' }}>{s.rate}</div>
                      <div className="w-full rounded-t transition-all duration-500"
                        style={{ height: `${(i + 1) * 12}px`, background: s.active ? s.color : '#1e293b', opacity: s.active ? 1 : 0.3 }} />
                      <div className="text-[5.5px] font-mono text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Tax outcome */}
                <div className={`rounded-2xl border px-3 py-2 flex items-center justify-between transition-all duration-500 ${isRebatable ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/40 border-rose-500/30'}`}>
                  <div>
                    <div className="text-[7px] text-slate-500 font-mono uppercase">Income: ₹{val}L | Tax Outcome</div>
                    <div className="text-[16px] font-black font-mono" style={{ color: isRebatable ? '#10b981' : '#ef4444' }}>
                      ₹{finalTax.toLocaleString()}
                    </div>
                    <div className="text-[7px] font-mono" style={{ color: isRebatable ? '#34d399' : '#fca5a5' }}>
                      {isRebatable ? `87A Rebate Applied → ₹0 Tax!` : `No rebate — taxable above ₹7L`}
                    </div>
                  </div>
                  <div className="text-3xl">{isRebatable ? '🎉' : '💸'}</div>
                </div>
                <div className="text-[7px] text-slate-500 font-mono text-center bg-slate-900/40 rounded-xl px-2 py-1">
                  Section 87A: ₹0 tax if total income ≤ ₹7 Lakhs under new regime
                </div>
              </div>
            );
          })()}

          {variant === 'epf_ppf' && (() => {
            // Educational: EPF vs PPF growth comparison over years
            const years = Math.max(1, val);
            const monthly = 5000;
            const epfRate = 8.15 / 100;
            const ppfRate = 7.10 / 100;
            const epfCorpus = monthly * 12 * ((Math.pow(1 + epfRate, years) - 1) / epfRate);
            const ppfCorpus = monthly * 12 * ((Math.pow(1 + ppfRate, years) - 1) / ppfRate);
            const invested = monthly * 12 * years;
            const epfGain = epfCorpus - invested;
            const ppfGain = ppfCorpus - invested;
            return (
              <div className="w-full flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'EPF', rate: '8.15%', corpus: epfCorpus, gain: epfGain, color: '#10b981', lock: 'Till retirement', tax: 'Tax-free' },
                    { label: 'PPF', rate: '7.10%', corpus: ppfCorpus, gain: ppfGain, color: '#06b6d4', lock: '15 years', tax: 'Tax-free' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 rounded-2xl border p-2.5 transition-all duration-300"
                      style={{ background: `${item.color}08`, borderColor: `${item.color}30` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                        <span className="text-[8px] font-black text-white">{item.rate}</span>
                      </div>
                      <div className="text-[13px] font-black font-mono" style={{ color: item.color }}>₹{Math.round(item.corpus / 1000)}K</div>
                      <div className="text-[6.5px] font-mono text-slate-400">Gain: ₹{Math.round(item.gain / 1000)}K</div>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        <span className="text-[5.5px] font-mono px-1 py-0.5 rounded" style={{ background: `${item.color}20`, color: item.color }}>🔒 {item.lock}</span>
                        <span className="text-[5.5px] font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{item.tax}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[7.5px] font-mono bg-slate-900/40 border border-white/5 rounded-xl px-3 py-2">
                  <span className="text-slate-400">After {years} yrs, ₹{(monthly/1000).toFixed(0)}K/mo</span>
                  <span className="text-emerald-400 font-black">EPF wins by ₹{Math.round((epfCorpus - ppfCorpus)/1000)}K</span>
                </div>
              </div>
            );
          })()}

          {variant === 'elss' && (() => {
            // Educational: ELSS 3-year lock-in vs FD — show wealth difference
            const invested = Math.max(10000, val);
            const elssReturn = 0.14; // 14% CAGR typical
            const fdReturn = 0.065; // 6.5% FD
            const elssCorpus = invested * Math.pow(1 + elssReturn, 3);
            const fdCorpus = invested * Math.pow(1 + fdReturn, 3);
            const taxSaved = Math.min(invested, 150000) * 0.30;
            const elssGain = elssCorpus - invested;
            const fdGain = fdCorpus - invested;
            const isLocked = invested > 0;
            const lockPct = Math.min(100, (invested / 150000) * 100);
            return (
              <div className="w-full flex flex-col gap-2">
                {/* Lock progress bar */}
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">🔒</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[6.5px] font-mono mb-0.5">
                      <span className="text-slate-500">80C Used</span>
                      <span className="text-amber-400">₹{Math.min(invested, 150000).toLocaleString()} / ₹1.5L</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${lockPct}%` }} />
                    </div>
                  </div>
                </div>
                {/* Comparison bars */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'ELSS', sub: '14% CAGR + Tax save', corpus: elssCorpus, gain: elssGain, color: '#10b981' },
                    { label: 'FD', sub: '6.5% (Taxable)', corpus: fdCorpus, gain: fdGain, color: '#64748b' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-2xl border p-2.5" style={{ background: `${item.color}08`, borderColor: `${item.color}30` }}>
                      <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: item.color }}>{item.label}</div>
                      <div className="text-[12px] font-black font-mono" style={{ color: item.color }}>₹{Math.round(item.corpus).toLocaleString()}</div>
                      <div className="text-[6px] font-mono text-slate-400">{item.sub}</div>
                      <div className="text-[6px] font-mono" style={{ color: item.color }}>+₹{Math.round(item.gain).toLocaleString()} gain</div>
                    </div>
                  ))}
                </div>
                <div className="text-[7px] font-mono text-center text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-2 py-1.5">
                  🎯 ELSS beats FD by ₹{Math.round(elssCorpus - fdCorpus).toLocaleString()} + saves ₹{Math.round(taxSaved).toLocaleString()} in tax!
                </div>
              </div>
            );
          })()}

          {variant === 'savings_rate' && (
            <div className="w-full flex flex-col items-center gap-2.5">
              <div className="relative w-28 h-28 flex items-center justify-center overflow-visible">

                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="savingsRateGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <filter id="glow-teal-sr" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Concentric Cyber Rings & Tech Ticks */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="1,5" />
                  
                  {/* Underlay Dial (Spent / Outflow Ring) */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(244,63,94,0.12)" strokeWidth="6" />
                  
                  {/* Active Savings Progress Ring */}
                  {val > 0 && (
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="38" 
                      fill="none" 
                      stroke="url(#savingsRateGrad)" 
                      strokeWidth="6" 
                      strokeDasharray={`${(val/100) * 238.7} 238.7`} 
                      strokeLinecap="round" 
                      transform="rotate(-90 50 50)" 
                      filter="url(#glow-teal-sr)"
                    />
                  )}

                  {/* Inner Concentric Rings */}
                  <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="29" fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="1" strokeDasharray="3,12" style={{ animation: 'dial-pulse-sr 2s infinite ease-in-out' }} />

                  {/* Text labels */}
                  <text 
                    x="50" 
                    y="47" 
                    fontSize="11.5" 
                    fill="#fff" 
                    fontWeight="black" 
                    fontFamily="monospace" 
                    textAnchor="middle" 
                    className="select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    {val}%
                  </text>
                  <text 
                    x="50" 
                    y="55" 
                    fontSize="4" 
                    fill="#64748b" 
                    fontWeight="black" 
                    fontFamily="monospace" 
                    textAnchor="middle" 
                    letterSpacing="0.6"
                    className="select-none"
                  >
                    SAVINGS RATE
                  </text>
                </svg>

                {/* Orbiting Particle Dot */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 100">
                  <g style={{
                    animation: val > 0 ? 'orbit-sr 5s linear infinite' : 'none',
                    transformOrigin: '50px 50px'
                  }}>
                    <circle cx="50" cy="5" r="1.5" fill="#34d399" filter="url(#glow-teal-sr)" />
                  </g>
                </svg>

                {/* Inner Level Badge */}
                <div className="absolute bottom-5 px-2.5 py-0.5 rounded-full border text-[7px] font-mono font-bold tracking-wider"
                     style={{
                       backgroundColor: val >= 30 ? 'rgba(16,185,129,0.1)' : val >= 15 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
                       borderColor: val >= 30 ? 'rgba(16,185,129,0.25)' : val >= 15 ? 'rgba(245,158,11,0.25)' : 'rgba(244,63,94,0.25)',
                       color: val >= 30 ? '#34d399' : val >= 15 ? '#fbbf24' : '#f43f5e'
                     }}>
                  {val >= 30 ? 'GOLD STANDARD' : val >= 15 ? 'MODERATE' : 'CRITICAL'}
                </div>
              </div>

              {/* Real-Time Glassmorphic Ledger Card */}
              <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-3.5 space-y-2.5 shadow-xl text-left">
                <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📊 WEALTH ACCUMULATION LEDGER</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                  {/* Left Column: Cash Saved */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Monthly Cash Flow</div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Assumed Salary:</span>
                      <span className="text-white font-bold">₹1,00,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cash Saved:</span>
                      <span className="text-emerald-400 font-bold">₹{Math.round(100000 * val / 100).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Right Column: Outflow */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex flex-col justify-between shadow-inner">
                    <div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Spent / Invested</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400">Outflow Rate:</span>
                        <span className="text-rose-400 font-bold">{100 - val}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                      <span className="text-slate-400">Amount spent:</span>
                      <span className="text-rose-400 font-extrabold">₹{Math.round(100000 * (100 - val) / 100).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 10-Yr Compound Projection */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-3 py-2 text-[9.5px] transition-all">
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">⚡ 10-Yr Corpus Projection (12%):</span>
                    <span className="text-cyan-400 font-black text-xs">₹{Math.round((100000 * val / 100) * 230.0386).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actionable Explanation Alert */}
              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl p-2.5 text-[8.5px] text-slate-300 leading-normal flex items-start gap-2 shadow-sm text-left">
                <span className="text-sm select-none">💡</span>
                <div>
                  <span className="text-sky-400 font-bold mr-1">Savings Rule:</span>
                  A high savings rate is the single most important variable in personal finance. Experts recommend saving at least <strong className="text-white font-semibold">30%</strong> of your income. By automatically routing this cash into compounding assets like mutual funds or ELSS instead of consuming it, your money compounds aggressively over time.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2">
          <span>Shield Limit: <strong className="text-emerald-400">{limitLabel}</strong></span>
          <span>Shield: <strong className={isProtected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{statusLabel}</strong></span>
        </div>
      </div>
    );
  };

  const renderForensicEngine = (params, value, secValue) => {
    const { variant = 'red_flags', accentColor = '#ef4444', label = 'Forensics' } = params;
    const val = value;

    const getRiskStatus = (type, v) => {
      if (type === 'red_flags') return { isHigh: v >= 3, label: v >= 3 ? 'High Risk' : 'Low Risk' };
      if (type === 'auditor') return { isHigh: v >= 2, label: v >= 2 ? 'Audit Qualification' : 'Clear Opinion' };
      if (type === 'earnings_qual') return { isHigh: v < 0.8, label: v < 0.8 ? 'Poor Accruals' : 'High Quality' };
      if (type === 'credit_score') {
        const score = v <= 24 ? Math.round(300 + v * 18.75) : Math.round(750 + (v - 24) * 12.5);
        return { isHigh: score < 650, label: score < 550 ? 'Poor Credit' : score < 650 ? 'Fair Credit' : score < 750 ? 'Good Credit' : 'Prime Credit' };
      }
      if (type === 'tracking') return { isHigh: v >= 0.5, label: v >= 0.5 ? 'High Deviation' : 'Optimal Tracking' };
      if (type === 'credit_risk') return { isHigh: v >= 3, label: v >= 3 ? 'High Default Risk' : 'Low Default Risk' };
      if (type === 'pledging') return { isHigh: v >= 25, label: v >= 25 ? 'High Pledging Risk' : 'Safe' };
      if (type === 'rpt') return { isHigh: v >= 15, label: v >= 15 ? 'High Conflict RPT' : 'Optimal RPT' };
      if (type === 'auditor_resign') return { isHigh: v >= 1, label: v >= 1 ? 'High Risk Exit' : 'Nominal' };
      return { isHigh: v > 45, label: v > 45 ? 'Warning Alert' : 'Healthy' };
    };

    const risk = getRiskStatus(variant, val);
    const isTallLayout = variant === 'credit_score' || variant === 'red_flags' || variant === 'pledging';

    if (variant === 'credit_score') {
      const score = val <= 24 ? Math.round(300 + val * 18.75) : Math.round(750 + (val - 24) * 12.5);
      const scoreColor = score < 550 ? '#ef4444' : score < 650 ? '#f97316' : score < 750 ? '#eab308' : '#10b981';
      const scoreLabel = score < 550 ? 'POOR' : score < 650 ? 'FAIR' : score < 750 ? 'GOOD' : 'EXCELLENT';
      const scorePct = (score - 300) / 600;
      const needleAngle = -90 + scorePct * 180;

      return (
        <div className="relative w-full max-w-sm min-h-[360px] h-auto bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between p-4 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none">
          <div className="absolute top-2.5 left-3.5 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
            CIBIL Score Dashboard • {label}
          </div>

          {/* Speedometer Dial */}
          <div className="flex-1 flex flex-col items-center justify-center relative mt-3 min-h-[125px]">
            <svg className="w-40 h-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" viewBox="0 0 100 75">
              <defs>
                <linearGradient id="creditGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="35%" stopColor="#fb923c" />
                  <stop offset="70%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <radialGradient id="dialGlow" cx="50%" cy="62%" r="50%">
                  <stop offset="0%" stopColor={scoreColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Glowing Background Core */}
              <circle cx="50" cy="62" r="30" fill="url(#dialGlow)" className="animate-pulse" />

              {/* Outer Gauge Track Background */}
              <path d="M 18 62 A 32 32 0 0 1 82 62" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" strokeLinecap="round" />
              
              {/* Active Filled Gauge Track */}
              <path 
                d="M 18 62 A 32 32 0 0 1 82 62" 
                fill="none" 
                stroke="url(#creditGaugeGrad)" 
                strokeWidth="6" 
                strokeLinecap="round"
                strokeDasharray="100.5" 
                strokeDashoffset={100.5 - scorePct * 100.5}
                className="transition-all duration-500"
                style={{ filter: `drop-shadow(0 0 2px ${scoreColor}88)` }}
              />

              {/* Needle Line */}
              <line 
                x1="50" 
                y1="62" 
                x2="50" 
                y2="32" 
                stroke="#ffffff" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                style={{ 
                  transform: `rotate(${needleAngle}deg)`, 
                  transformOrigin: '50px 62px',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                }} 
              />
              
              {/* Center Cap */}
              <circle cx="50" cy="62" r="4.5" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="50" cy="62" r="1.5" fill="#0f172a" />

              {/* Digital Score Output */}
              <text x="50" y="52" fontSize="13" fill="#ffffff" textAnchor="middle" fontWeight="black" fontFamily="monospace" className="select-none tracking-tight">
                {score}
              </text>
              
              {/* Qualitative Status Label */}
              <text x="50" y="60" fontSize="5" fill={scoreColor} textAnchor="middle" fontWeight="black" fontFamily="monospace" letterSpacing="0.8" className="select-none font-bold">
                {scoreLabel}
              </text>
            </svg>
          </div>

          {/* CRT Credit Log Terminal with Scanline */}
          <div className="w-full bg-slate-900/60 border border-white/5 backdrop-blur-md rounded-2xl p-2.5 space-y-1.5 shadow-xl text-left mt-2 overflow-hidden relative">
            {/* Cyber Scanline laser sweeping down */}
            <div 
              className="absolute left-0 w-full h-0.5 bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.7)] pointer-events-none" 
              style={{ animation: 'scanline 3.2s linear infinite' }} 
            />

            <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">📊 CRT CREDIT SCANNER REPORT</span>
            </div>
            
            <div className="space-y-1 text-[8.5px] font-mono leading-none">
              {/* Payment history */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-lg px-2 py-1">
                <span className="text-slate-400">📅 Payment History:</span>
                <span className="font-bold" style={{ color: scoreColor }}>
                  {val >= 24 ? "24M+ Streak [OK]" : `${val}M Streak [LOW_STREAK]`}
                </span>
              </div>

              {/* Credit Utilization */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-lg px-2 py-1">
                <span className="text-slate-400">💳 Utilization Ratio:</span>
                <span className="text-emerald-400 font-bold">28% [HEALTHY]</span>
              </div>

              {/* Inquiry count */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-lg px-2 py-1">
                <span className="text-slate-400">🔍 Inquiry Activity:</span>
                <span className="text-emerald-400 font-bold">0 in 6M [LOW_RISK]</span>
              </div>

              {/* Verification status */}
              <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-lg px-2 py-1">
                <span className="text-slate-400">🔒 System Status:</span>
                <span className="font-bold" style={{ color: scoreColor }}>
                  {score >= 750 ? "VERIFICATION_PASSED" : score >= 550 ? "TRAJECTORY_BUILDING" : "HIGH_DEFAULT_HAZARD"}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Advice Banner */}
          <div className="w-full bg-cyan-500/5 border border-cyan-500/10 px-2.5 py-1.5 rounded-xl text-[8.5px] text-cyan-300/95 leading-normal mt-2 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)] flex items-start gap-1.5">
            <span className="shrink-0 text-cyan-400">💡</span>
            <p className="font-sans">
              {score >= 750 ? (
                <span><strong>Prime credit score achieved!</strong> With 24+ months of continuous on-time payments, banks classify you as prime low-risk, unlocking <strong>lowest loan rates (saving ₹Lakhs)</strong> and instant credit card approvals.</span>
              ) : score >= 550 ? (
                <span><strong>Building phase.</strong> Your score is moderate. Banks may approve credit but with <strong>higher interest penalties</strong>. Keep making on-time payments to cross the 750 threshold.</span>
              ) : (
                <span><strong>High Default Alert!</strong> Missing streaks leaves your score at <strong>{score}</strong>. Lenders will reject auto/home loan applications or charge predatory interest rates.</span>
              )}
            </p>
          </div>

          {/* Bottom Telemetry readout */}
          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 mt-2">
            <span>On-Time Streak: <strong style={{ color: scoreColor }}>{val} Months</strong></span>
            <span>CIBIL Status: <strong style={{ color: scoreColor }}>{scoreLabel}</strong></span>
          </div>
        </div>
      );
    }

    const flagPositions = [
      { x: 45, y: 30 },
      { x: 75, y: 25 },
      { x: 35, y: 55 },
      { x: 80, y: 60 },
      { x: 60, y: 20 },
      { x: 50, y: 65 },
      { x: 70, y: 40 },
      { x: 40, y: 45 },
      { x: 85, y: 45 },
      { x: 60, y: 70 }
    ];

    const radarColor = risk.isHigh ? '#ef4444' : '#10b981';

    return (
      <div className={`relative w-full max-w-sm ${isTallLayout ? 'min-h-[360px] h-auto pt-8 pb-4 px-4' : 'h-64 p-4'} bg-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col justify-between overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] select-none`}>

        <div className="absolute top-2.5 left-3.5 text-[8px] font-mono tracking-widest uppercase" style={{ color: accentColor }}>
          Forensic Scanline Sweep • {label}
        </div>
        
        <div className="flex-1 flex items-center justify-center relative mt-2">
          {variant === 'red_flags' && (() => {
            const pledgeLED = val <= 10 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : val <= 50 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse';
            const cfoLED = val <= 30 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : val <= 65 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse';
            const rptLED = val <= 40 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : val <= 70 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse';
            const auditLED = val <= 50 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : val <= 80 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse';

            return (
              <div 
                className="w-full flex flex-col gap-3 mt-1.5"
                onMouseEnter={() => setHoveredControl("[BOARD.RED_FLAGS] Corporate Governance Scrutiny: Tracks key warning metrics. As pledge % rises, multiple indicators trigger warning alerts. High promoter pledging combined with earnings mismatch signals financial manipulation.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* 2x2 Indicator Grid */}
                <div className="grid grid-cols-2 gap-2 text-left">
                  {/* Card 1: Pledge */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[60px] relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Promoter Pledge</span>
                      <div className={`w-2 h-2 rounded-full ${pledgeLED}`} />
                    </div>
                    <div className="text-[11px] font-black font-mono text-white mt-1">
                      {val}% Shares
                    </div>
                    <div className="text-[6.5px] text-slate-500 font-mono">
                      {val > 50 ? "⚠️ Snapping Hazard" : val > 10 ? "⚠️ Watch Margin Calls" : "✓ Safe Zone"}
                    </div>
                  </div>

                  {/* Card 2: CFO Mismatch */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[60px] relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">CFO vs PAT</span>
                      <div className={`w-2 h-2 rounded-full ${cfoLED}`} />
                    </div>
                    <div className="text-[11px] font-black font-mono text-white mt-1">
                      {val > 30 ? `Divergence: ${Math.round(val * 0.8)}%` : "Aligned"}
                    </div>
                    <div className="text-[6.5px] text-slate-500 font-mono">
                      {val > 65 ? "🚨 Accruals Inflated" : val > 30 ? "⚠️ Accruals Rising" : "✓ Cash Flow Clean"}
                    </div>
                  </div>

                  {/* Card 3: RPT Conflict */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[60px] relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">RPT Volume</span>
                      <div className={`w-2 h-2 rounded-full ${rptLED}`} />
                    </div>
                    <div className="text-[11px] font-black font-mono text-white mt-1">
                      ₹{Math.round(val * 1.8)} Cr
                    </div>
                    <div className="text-[6.5px] text-slate-500 font-mono">
                      {val > 70 ? "🚨 Shell Co Tunneling" : val > 40 ? "⚠️ Elevated Transfers" : "✓ Clean Dealings"}
                    </div>
                  </div>

                  {/* Card 4: Audit Opinion */}
                  <div className="bg-slate-900/60 border border-white/5 rounded-xl p-2 flex flex-col justify-between h-[60px] relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">Audit Report</span>
                      <div className={`w-2 h-2 rounded-full ${auditLED}`} />
                    </div>
                    <div className="text-[11px] font-black font-mono text-white mt-1">
                      {val > 80 ? "ADVERSE OPINION" : val > 50 ? "QUALIFIED" : "UNQUALIFIED"}
                    </div>
                    <div className="text-[6.5px] text-slate-500 font-mono">
                      {val > 80 ? "🚨 Auditor Dispute" : val > 50 ? "⚠️ Explanatory Notes" : "✓ Clean Audit"}
                    </div>
                  </div>
                </div>

                {/* Central Radar Sweep Screen */}
                <div className="w-full bg-slate-900/40 border border-white/5 rounded-2xl p-2 flex items-center justify-between h-20 overflow-hidden relative">
                  {/* Cyber grid backdrop */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                  
                  {/* Sweep scan bar */}
                  <div className="absolute left-0 w-full h-0.5 bg-red-500/50 shadow-[0_0_8px_#ef4444]" style={{ animation: 'scanline 2s linear infinite' }} />

                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-3xl filter drop-shadow">🏢</span>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Corporate Entity</span>
                      <span className="text-[11px] text-white font-extrabold font-mono">PLEDGING: {val}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end relative z-10">
                    <span className={`text-[12px] font-mono font-black ${val > 50 ? "text-rose-400 animate-pulse" : val > 10 ? "text-amber-400" : "text-emerald-400"}`}>
                      {val > 50 ? "🚨 DANGER" : val > 10 ? "⚠️ WARNING" : "🟢 SAFE"}
                    </span>
                    <span className="text-[6.5px] text-slate-500 font-mono uppercase">System Risk Rating</span>
                  </div>
                </div>

                {/* Alarm Banner */}
                {val > 50 && (
                  <div className="w-full bg-red-500/10 border border-red-500/25 rounded-xl p-2 text-[8px] text-red-300 flex items-start gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.05)] animate-bounce text-left relative overflow-hidden">
                    <span className="text-xs shrink-0">🚩</span>
                    <div>
                      <strong className="text-red-400 font-bold">Severe Governance Mismatch!</strong> High promoter pledging creates systemic margin call hazard. A sudden stock dip will force lenders to dump shares, collapsing the asset valuation.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        
        <div className="flex-1 flex items-center justify-center relative mt-2">
          

          {variant === 'auditor' && (
            <svg 
              className="w-full max-h-[150px] overflow-visible" 
              viewBox="0 0 240 135"
              onMouseEnter={() => setHoveredControl("[SCANNER.AUDITOR] Forensic Footnote Inspection: Magnifies annual report footnotes. As audit scrutiny increases, off-balance sheet liabilities and pending SEBI litigation tax penalties are uncovered.")}
              onMouseLeave={() => setHoveredControl("")}
            >
              {/* Ledger Box */}
              <rect x="30" y="20" width="180" height="85" rx="6" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              {/* Header */}
              <rect x="30" y="20" width="180" height="15" fill="rgba(30,41,59,0.5)" rx="3" />
              <text x="40" y="30" fontSize="5.5" fill="#64748b" fontFamily="monospace" fontWeight="bold">[LEDGER.DOC] AUDITOR NOTES REVIEW</text>
              <text x="200" y="30" fontSize="5.5" fill={val >= 80 ? "#ef4444" : val >= 40 ? "#fb923c" : "#10b981"} textAnchor="end" fontFamily="monospace" fontWeight="bold">SCRUTINY: {val}%</text>

              {/* Rows */}
              {/* Row 1 */}
              <text x="40" y="48" fontSize="6" fill="#94a3b8" fontFamily="monospace">1. Revenues Reported: ₹1,500 Cr</text>
              <text x="200" y="48" fontSize="6" fill="#10b981" fontWeight="bold" fontFamily="monospace" textAnchor="end">✓ VERIFIED</text>
              
              {/* Row 2 */}
              <text x="40" y="62" fontSize="6" fill="#f43f5e" fontFamily="monospace">2. Receivables (due from Shell Co): ₹800 Cr</text>
              <text x="200" y="62" fontSize="6" fill="#ef4444" fontWeight="bold" fontFamily="monospace" textAnchor="end">⚠️ DUBIOUS</text>
              
              {/* Row 3 */}
              {val >= 40 ? (
                <g className="animate-pulse">
                  <text x="40" y="76" fontSize="6" fill="#fb923c" fontFamily="monospace">3. Off-Balance Debt Guarantee: ₹450 Cr</text>
                  <text x="200" y="76" fontSize="6" fill="#fb923c" fontWeight="bold" fontFamily="monospace" textAnchor="end">⚠️ EXPOSED</text>
                </g>
              ) : (
                <g opacity="0.4">
                  <text x="40" y="76" fontSize="6" fill="#475569" fontFamily="monospace">3. [Footnote 24]: Locked / Unscanned</text>
                  <text x="200" y="76" fontSize="6" fill="#475569" fontFamily="monospace" textAnchor="end">🔒 LOCK</text>
                </g>
              )}

              {/* Row 4 */}
              {val >= 80 ? (
                <g className="animate-pulse">
                  <text x="40" y="90" fontSize="6" fill="#ef4444" fontFamily="monospace" fontWeight="bold">4. Pending SEBI Tax Dispute: ₹210 Cr</text>
                  <text x="200" y="90" fontSize="6" fill="#ef4444" fontWeight="bold" fontFamily="monospace" textAnchor="end">🚨 HAZARD</text>
                </g>
              ) : (
                <g opacity="0.4">
                  <text x="40" y="90" fontSize="6" fill="#475569" fontFamily="monospace">4. [Footnote 25]: Locked / Unscanned</text>
                  <text x="200" y="90" fontSize="6" fill="#475569" fontFamily="monospace" textAnchor="end">🔒 LOCK</text>
                </g>
              )}

              {/* Laser Scanner Bar */}
              <line x1="32" y1="60" x2="208" y2="60" stroke="#06b6d4" strokeWidth="2.5" opacity="0.85" 
                    style={{ animation: 'scan-line-auditor 3s ease-in-out infinite' }} />
            </svg>
          )}

          {variant === 'earnings_qual' && (() => {
            const tilt = Math.max(-5, Math.min(30, (val - 30) * 0.35));
            const theta = (tilt * Math.PI) / 180;
            const cx = 120;
            const cy = 50;
            const L = 60;

            const xLeft = cx - L * Math.cos(theta);
            const yLeft = cy - L * Math.sin(theta);
            const xRight = cx + L * Math.cos(theta);
            const yRight = cy + L * Math.sin(theta);

            return (
              <svg 
                className="w-full max-h-[150px] overflow-visible" 
                viewBox="0 0 240 135"
                onMouseEnter={() => setHoveredControl("[SCALE.EARNINGS] CFO vs PAT Balance: Cash Flow from Operations (CFO) must back Profit After Tax (PAT). High collection delay tilts the scale to PAT (accrual-heavy paper profits), raising fraud alerts.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Stand */}
                <rect x="116" y="50" width="8" height="55" fill="#475569" />
                <path d="M 80 105 L 160 105" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
                <circle cx="120" cy="50" r="3.5" fill="#f59e0b" />

                {/* Beam */}
                <line x1={xLeft} y1={yLeft} x2={xRight} y2={yRight} stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />

                {/* Left Pan: CFO */}
                <g>
                  <path d={`M ${xLeft} ${yLeft} L ${xLeft - 18} ${yLeft + 35} L ${xLeft + 18} ${yLeft + 35} Z`} fill="none" stroke="#475569" strokeWidth="0.8" />
                  <ellipse cx={xLeft} cy={yLeft + 35} rx="18" ry="3.5" fill="#0f172a" stroke={val <= 30 ? "#10b981" : "#64748b"} strokeWidth="1.5" />
                  <text x={xLeft} y={yLeft + 30} fontSize="11" textAnchor="middle">💵</text>
                  <text x={xLeft} y={yLeft + 46} fontSize="5.5" fill="#10b981" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CFO (CASH)</text>
                </g>

                {/* Right Pan: PAT */}
                <g>
                  <path d={`M ${xRight} ${yRight} L ${xRight - 18} ${yRight + 35} L ${xRight + 18} ${yRight + 35} Z`} fill="none" stroke="#475569" strokeWidth="0.8" />
                  <ellipse cx={xRight} cy={yRight + 35} rx="18" ry="3.5" fill="#0f172a" stroke={val > 30 ? "#ef4444" : "#64748b"} strokeWidth="1.5" />
                  <text x={xRight} y={yRight + 30} fontSize="11" textAnchor="middle">📈</text>
                  <text x={xRight} y={yRight + 46} fontSize="5.5" fill="#ef4444" fontWeight="bold" textAnchor="middle" fontFamily="monospace">PAT (BOOK)</text>
                </g>

                {/* Warning Light */}
                {val > 90 && (
                  <g className="animate-pulse" transform="translate(185, 15)">
                    <circle cx="10" cy="10" r="8" fill="#ef4444" opacity="0.3" />
                    <circle cx="10" cy="10" r="4" fill="#ef4444" />
                    <text x="10" y="24" fontSize="5" fill="#ef4444" fontWeight="black" textAnchor="middle" fontFamily="monospace">🚨 ACCRUAL ABUSE</text>
                  </g>
                )}
              </svg>
            );
          })()}

          {variant === 'tracking' && (() => {
            const xCoords = [25, 48, 71, 94, 117, 140, 163, 186, 209];
            const yBench = [90, 75, 80, 55, 65, 45, 50, 25, 35];
            const drift = [0, 2.5, -3.5, 4.0, -2.5, 5.0, -4.0, 6.0, -5.0];

            const pointsBench = xCoords.map((x, i) => `${x},${yBench[i]}`);
            const pathBenchD = `M ${pointsBench.join(' L ')}`;

            // Compute fund path based on tracking error (val)
            const yFund = yBench.map((y, i) => y + drift[i] * val);
            const pointsFund = xCoords.map((x, i) => `${x},${yFund[i]}`);
            const pathFundD = `M ${pointsFund.join(' L ')}`;

            return (
              <svg 
                className="w-full max-h-[150px] overflow-visible" 
                viewBox="0 0 240 135"
                onMouseEnter={() => setHoveredControl("[CHART.TRACKING] Benchmark vs Fund Divergence: Grey line shows index returns. Red line shows ETF performance. As tracking error grows, the ETF deviates due to transaction fees, cash drag, and replication delays.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Grid Lines */}
                <line x1="25" y1="15" x2="25" y2="105" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="25" y1="105" x2="215" y2="105" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Benchmark Index Path */}
                <path d={pathBenchD} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />
                
                {/* Fund Path */}
                <path d={pathFundD} fill="none" stroke="#ef4444" strokeWidth="2.5" filter="drop-shadow(0 0 3px rgba(239,68,68,0.4))" className="transition-all duration-300" />

                {/* Labels */}
                <text x="212" y="32" fontSize="5" fill="#94a3b8" fontFamily="monospace" textAnchor="end">INDEX (BENCHMARK)</text>
                <text x="212" y={yFund[8] - 5} fontSize="5" fill="#f87171" fontFamily="monospace" textAnchor="end" fontWeight="bold">ETF FUND</text>

                {/* Vertical Error Brackets */}
                {[3, 5, 7].map((idx) => {
                  const x = xCoords[idx];
                  const y1 = yBench[idx];
                  const y2 = yFund[idx];
                  const midY = (y1 + y2) / 2;
                  return (
                    <g key={idx} opacity={val > 0.5 ? 1 : 0} className="transition-all duration-300">
                      {/* Error line */}
                      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#fb923c" strokeWidth="1" strokeDasharray="2,2" />
                      {/* Top bar */}
                      <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} stroke="#fb923c" strokeWidth="1" />
                      {/* Bottom bar */}
                      <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} stroke="#fb923c" strokeWidth="1" />
                      
                      {/* Error Value overlay box */}
                      {val > 1.2 && (
                        <g>
                          <rect x={x + 4} y={midY - 4} width="16" height="8" rx="1.5" fill="rgba(15,23,42,0.85)" stroke="rgba(251,146,60,0.4)" strokeWidth="0.5" />
                          <text x={x + 12} y={midY + 2} fontSize="4.5" fill="#fb923c" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                            {((val * 0.45) * (idx === 3 ? 0.8 : idx === 5 ? 1.2 : 1.0)).toFixed(1)}%
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })()}

          {variant === 'credit_risk' && (() => {
            const ratingText = val === 10 ? 'AAA' : val === 9 ? 'AA+' : val === 8 ? 'AA' : val === 7 ? 'A' : val === 6 ? 'BBB+' : val === 5 ? 'BBB' : val === 4 ? 'BB' : val === 3 ? 'B' : val === 2 ? 'C' : 'D';
            const bridgeColor = val >= 8 ? '#10b981' : val >= 5 ? '#f59e0b' : '#ef4444';
            const isBroken = val <= 2;

            return (
              <svg 
                className="w-full max-h-[150px] overflow-visible" 
                viewBox="0 0 240 135"
                onMouseEnter={() => setHoveredControl("[STRESS.BRIDGE] Debt Portfolio Default Stress-Test: Bridge capacity represents portfolio credit rating. AAA/AA rated papers support heavy debt loads easily. High junk paper rating drop to C/D cracks and collapses the bridge under credit defaults.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Gorge/River Background */}
                <path d="M 10 120 L 50 120 Q 70 115 80 100 Q 90 85 100 85 L 140 85 Q 150 85 160 100 Q 170 115 190 120 L 230 120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M 70 135 C 100 135, 140 130, 170 135" fill="none" stroke="#1d4ed8" strokeWidth="6" opacity="0.3" />

                {/* Left Abutment */}
                <rect x="15" y="80" width="20" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                {/* Right Abutment */}
                <rect x="205" y="80" width="20" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                {/* Left Bridge half */}
                <g style={{ 
                  transform: isBroken ? 'rotate(25deg)' : 'rotate(0deg)', 
                  transformOrigin: '35px 80px', 
                  transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)' 
                }}>
                  {/* Bridge girder */}
                  <line x1="35" y1="80" x2="120" y2="80" stroke={bridgeColor} strokeWidth="4" />
                  {/* Under truss arches */}
                  <path d="M 35 80 Q 77.5 95 120 80" fill="none" stroke={bridgeColor} strokeWidth="1.5" opacity="0.6" />
                  {/* Truss vertical supports */}
                  <line x1="60" y1="80" x2="60" y2="87" stroke={bridgeColor} strokeWidth="1" opacity="0.6" />
                  <line x1="95" y1="80" x2="95" y2="85" stroke={bridgeColor} strokeWidth="1" opacity="0.6" />

                  {/* Cracks forming if rating moderate/low */}
                  {!isBroken && val <= 7 && (
                    <path d="M 100 78 L 104 82 L 102 85" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                  )}
                  {!isBroken && val <= 4 && (
                    <path d="M 60 78 L 64 82 L 62 85" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                  )}
                </g>

                {/* Right Bridge half */}
                <g style={{ 
                  transform: isBroken ? 'rotate(-25deg)' : 'rotate(0deg)', 
                  transformOrigin: '205px 80px', 
                  transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)' 
                }}>
                  {/* Bridge girder */}
                  <line x1="120" y1="80" x2="205" y2="80" stroke={bridgeColor} strokeWidth="4" />
                  {/* Under truss arches */}
                  <path d="M 120 80 Q 162.5 95 205 80" fill="none" stroke={bridgeColor} strokeWidth="1.5" opacity="0.6" />
                  {/* Truss vertical supports */}
                  <line x1="145" y1="80" x2="145" y2="85" stroke={bridgeColor} strokeWidth="1" opacity="0.6" />
                  <line x1="180" y1="80" x2="180" y2="87" stroke={bridgeColor} strokeWidth="1" opacity="0.6" />

                  {/* Cracks forming if rating moderate/low */}
                  {!isBroken && val <= 7 && (
                    <path d="M 140 78 L 136 82 L 138 85" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                  )}
                </g>

                {/* Heavy Debt Load Block */}
                <g style={{ 
                  transform: isBroken ? 'translateY(40px)' : 'translateY(0px)', 
                  transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  transformOrigin: '120px 65px'
                }}>
                  <rect x="105" y="55" width="30" height="22" rx="3" fill="#1e293b" stroke={isBroken ? "#ef4444" : "#475569"} strokeWidth="2" />
                  <text x="120" y="65" fontSize="5" fill="#cbd5e1" fontWeight="bold" fontFamily="monospace" textAnchor="middle">DEBT</text>
                  <text x="120" y="73" fontSize="5.5" fill="#f87171" fontWeight="black" fontFamily="monospace" textAnchor="middle">LOAD</text>
                </g>

                {/* HUD Overlay Rating Info */}
                <rect x="80" y="12" width="80" height="13" rx="4.5" fill="rgba(15,23,42,0.85)" stroke={bridgeColor} strokeWidth="1" />
                <text x="120" y="21.5" fontSize="7" fill={bridgeColor} fontWeight="black" fontFamily="monospace" textAnchor="middle">
                  RATING: {ratingText} {isBroken ? '• DEFAULTED' : '• SAFE'}
                </text>

                {isBroken && (
                  <g className="animate-pulse">
                    <text x="120" y="115" fontSize="7" fill="#ef4444" fontWeight="black" fontFamily="monospace" textAnchor="middle">💥 DEFAULT COLLAPSE!</text>
                  </g>
                )}
              </svg>
            );
          })()}

          {variant === 'pledging' && (() => {
            const hasSnapped = val >= 90;
            const isWarning = val >= 75 && val < 90;
            const blockColor = hasSnapped ? "#7f1d1d" : isWarning ? "#b45309" : "#1e293b";
            const blockStroke = hasSnapped ? "#ef4444" : isWarning ? "#fb923c" : "#475569";

            return (
              <div className="flex flex-col items-center w-full select-none -mt-2">
                <svg 
                  className="w-full max-h-[145px] overflow-visible" 
                  viewBox="0 0 240 125"
                  onMouseEnter={() => setHoveredControl("[CRANE.PLEDGE] Share Pledging Liquidation Risk: Promoters pledge stock as loan collateral. High pledging (>=75%) is a ticking time bomb. A margin call forces brokers to snap the collateral chain and dump shares on the open market, causing an asset price crash.")}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  {/* Crane Base */}
                  <rect x="25" y="95" width="40" height="10" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  
                  {/* Crane Vertical Tower */}
                  <line x1="45" y1="95" x2="45" y2="25" stroke="#475569" strokeWidth="4" />
                  {/* Crane diagonal brace */}
                  <line x1="45" y1="65" x2="70" y2="25" stroke="#475569" strokeWidth="2" />
                  {/* Crane horizontal boom arm */}
                  <line x1="30" y1="25" x2="160" y2="25" stroke="#475569" strokeWidth="3.5" />
                  {/* Pulley Wheel */}
                  <circle cx="150" cy="25" r="4.5" fill="#64748b" />

                  {/* Supporting chains holding shares block */}
                  {!hasSnapped ? (
                    <g>
                      {/* Left support cable */}
                      <line x1="150" y1="25" x2="140" y2="60" stroke="#f59e0b" strokeWidth="1.5" />
                      {/* Right support cable */}
                      <line x1="150" y1="25" x2="160" y2="60" stroke="#f59e0b" strokeWidth="1.5" />
                      {/* Additional chains wrapped around depending on pledged value */}
                      {val > 25 && (
                        <path d="M 137 68 L 163 72" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="2,2" />
                      )}
                      {val > 50 && (
                        <path d="M 137 72 L 163 68" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="2,2" />
                      )}
                    </g>
                  ) : (
                    <g>
                      {/* Snapped cables flying away */}
                      <line x1="150" y1="25" x2="135" y2="40" stroke="#ef4444" strokeWidth="1.5" style={{ animation: 'chains-break-left 0.6s forwards' }} />
                      <line x1="150" y1="25" x2="165" y2="40" stroke="#ef4444" strokeWidth="1.5" style={{ animation: 'chains-break-right 0.6s forwards' }} />
                    </g>
                  )}

                  {/* Shares Block */}
                  <g style={{ 
                    transform: hasSnapped ? 'translateY(40px)' : 'translateY(0px)', 
                    transition: 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transformOrigin: '150px 70px'
                  }}>
                    <rect x="135" y="60" width="30" height="20" rx="3.5" fill={blockColor} stroke={blockStroke} strokeWidth="2" />
                    <text x="150" y="72" fontSize="5.5" fill="#e2e8f0" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PROMOTER</text>
                    <text x="150" y="78.5" fontSize="6.5" fill={hasSnapped ? "#ef4444" : "#94a3b8"} fontWeight="black" fontFamily="monospace" textAnchor="middle">SHARES</text>
                  </g>

                  {/* Danger sign or text overlay */}
                  {hasSnapped ? (
                    <g className="animate-pulse">
                      <rect x="80" y="45" width="80" height="12" rx="4" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8" />
                      <text x="120" y="53" fontSize="5.5" fill="#f87171" fontWeight="bold" fontFamily="monospace" textAnchor="middle">🚨 BROKER FORCED LIQUIDATION</text>
                    </g>
                  ) : isWarning ? (
                    <g className="animate-pulse">
                      <rect x="80" y="45" width="80" height="12" rx="4" fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.4)" strokeWidth="0.8" />
                      <text x="120" y="53" fontSize="5.5" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" textAnchor="middle">⚠️ MARGIN CALL WARNING</text>
                    </g>
                  ) : null}

                  <text x="150" y="15" fontSize="6" fill="#94a3b8" fontFamily="monospace" textAnchor="middle">{val}% PLEDGED</text>
                </svg>
              </div>
            );
          })()}

          {variant === 'rpt' && (() => {
            const flowSpeed = val === 0 ? '0s' : `${Math.max(0.4, 2 - val * 0.04)}s`;
            const hasConflict = val >= 20;

            return (
              <svg 
                className="w-full max-h-[150px] overflow-visible" 
                viewBox="0 0 240 135"
                onMouseEnter={() => setHoveredControl("[NETWORK.RPT] Related Party Cash Tunneling: Map of transaction paths. Healthy capital flows to OP CO. High RPT percentage (>=20%) siphons revenues away from the public listed parent entity into unlisted promoter shell structures.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Node parent */}
                <g>
                  <circle cx="50" cy="50" r="18" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                  <text x="50" y="48" fontSize="5.5" fill="#94a3b8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">PARENT CO</text>
                  <text x="50" y="55" fontSize="4.5" fill="#cbd5e1" fontFamily="monospace" textAnchor="middle">(LISTED)</text>
                </g>

                {/* Node OP CO (subsidiary) */}
                <g>
                  <circle cx="120" cy="95" r="18" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                  <text x="120" y="93" fontSize="5.5" fill="#94a3b8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OP CO</text>
                  <text x="120" y="100" fontSize="4.5" fill="#cbd5e1" fontFamily="monospace" textAnchor="middle">(BUSINESS)</text>
                </g>

                {/* Node Promoter Shell Co */}
                <g>
                  <circle cx="190" cy="50" r="18" fill="#0f172a" stroke={hasConflict ? "#ef4444" : "#475569"} strokeWidth="2" className={hasConflict ? "animate-pulse" : ""} />
                  <text x="190" y="48" fontSize="5.5" fill={hasConflict ? "#f87171" : "#64748b"} fontFamily="monospace" textAnchor="middle" fontWeight="bold">SHELL CO</text>
                  <text x="190" y="55" fontSize="4.5" fill="#64748b" fontFamily="monospace" textAnchor="middle">(PROMOTER)</text>
                </g>

                {/* Paths */}
                {/* Parent -> OP CO (Legitimate funding) */}
                <path d="M 64 62 Q 88 85 106 85" fill="none" stroke="#10b981" strokeWidth={Math.max(1, 3.5 - val * 0.06)} strokeDasharray="4,4" 
                      style={{ animation: 'flow 1.5s linear infinite' }} />

                {/* OP CO -> Shell Co (Tunneling siphon flow) */}
                <path d="M 134 85 Q 152 85 176 62" fill="none" stroke={hasConflict ? "#ef4444" : "#fb923c"} strokeWidth={Math.max(0.5, val * 0.1)} strokeDasharray="5,4" 
                      style={{ animation: val > 0 ? `rpt-cash-flow ${flowSpeed} linear infinite` : 'none' }} />

                {/* Overlay details */}
                <text x="150" y="78" fontSize="5.5" fill={hasConflict ? "#ef4444" : "#fb923c"} fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {val > 0 ? `RPT SIPHON: ${val}%` : 'NO SIPHON'}
                </text>
              </svg>
            );
          })()}

          {variant === 'auditor_resign' && (() => {
            const isEscaped = val >= 70;
            const isCaution = val >= 30 && val < 70;

            return (
              <svg 
                className="w-full max-h-[150px] overflow-visible" 
                viewBox="0 0 240 135"
                onMouseEnter={() => setHoveredControl("[STATE.RESIGN] Sudden Auditor Departure: Boardroom escape simulator. Low risk shows auditor calm. Mid risk shows audits qualified. High risk (>=70%) triggers sudden resignation, leaving the company without certified records.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Boardroom Table */}
                <ellipse cx="90" cy="85" rx="55" ry="18" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="90" y="88" fontSize="6" fill="#64748b" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BOARDROOM TABLE</text>
                
                {/* Boardroom chairs around table */}
                <rect x="45" y="80" width="8" height="6" rx="1" fill="#334155" />
                <rect x="75" y="98" width="8" height="6" rx="1" fill="#334155" />
                <rect x="105" y="98" width="8" height="6" rx="1" fill="#334155" />

                {/* Boardroom door on the right */}
                <g>
                  {/* Exit sign */}
                  <rect x="190" y="22" width="22" height="9" rx="1.5" fill={isEscaped ? "#ef4444" : "#1e293b"} />
                  <text x="201" y="29" fontSize="6.5" fill="#fff" fontFamily="monospace" textAnchor="middle" fontWeight="bold">EXIT</text>
                  
                  {/* Door frame */}
                  <rect x="188" y="32" width="26" height="65" fill="none" stroke="#475569" strokeWidth="2" />
                  
                  {/* Opened door leaf */}
                  <rect 
                    x="202" y="32" width="22" height="65" fill="#0f172a" stroke="#475569" strokeWidth="1" 
                    style={{ 
                      transform: isEscaped ? 'skewY(8deg) scaleX(0.7)' : 'none',
                      transformOrigin: '202px 32px',
                      transition: 'all 0.5s ease'
                    }} 
                  />
                </g>

                {/* Auditor position state */}
                {!isEscaped && !isCaution && (
                  <g transform="translate(60, 68)">
                    {/* Calm auditor sitting */}
                    <text x="0" y="0" fontSize="15" textAnchor="middle">🧑‍💼</text>
                    <text x="0" y="10" fontSize="5" fill="#10b981" fontWeight="bold" fontFamily="monospace" textAnchor="middle">AUDITOR CALM</text>
                  </g>
                )}

                {!isEscaped && isCaution && (
                  <g transform="translate(90, 58)">
                    {/* Auditor standing and qualified remarks */}
                    <text x="0" y="0" fontSize="15" textAnchor="middle">🧑‍💼</text>
                    <text x="0" y="10" fontSize="5.5" fill="#fb923c" fontWeight="bold" fontFamily="monospace" textAnchor="middle">⚠️ SCRUTINIZING</text>
                    <rect x="-30" y="-22" width="60" height="9" rx="2" fill="rgba(15,23,42,0.9)" stroke="#fb923c" strokeWidth="0.5" />
                    <text x="0" y="-16" fontSize="4.5" fill="#fb923c" fontFamily="monospace" textAnchor="middle">Qualified opinion pending?</text>
                  </g>
                )}

                {isEscaped && (
                  <g>
                    {/* Escape auditor running */}
                    <g transform="translate(182, 60)">
                      <text x="0" y="0" fontSize="16" textAnchor="middle" className="animate-bounce">🏃‍♂️💨</text>
                      <text x="-12" y="15" fontSize="5" fill="#ef4444" fontWeight="black" fontFamily="monospace" textAnchor="middle">AUDITOR EXIT</text>
                    </g>
                    {/* Blowing papers */}
                    <rect x="135" y="45" width="4" height="6" rx="0.5" fill="#ffffff" style={{ animation: 'paper-flutter-1 1s infinite linear' }} />
                    <rect x="150" y="60" width="4" height="6" rx="0.5" fill="#ffffff" style={{ animation: 'paper-flutter-2 1.2s infinite linear' }} />
                    <rect x="165" y="40" width="4" height="6" rx="0.5" fill="#ffffff" style={{ animation: 'paper-flutter-1 1.4s infinite linear', animationDelay: '0.2s' }} />

                    <rect x="55" y="10" width="90" height="12" rx="4.5" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8" className="animate-pulse" />
                    <text x="100" y="18" fontSize="5.5" fill="#f87171" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="animate-pulse">🚨 ABRUPT AUDITOR RESIGNATION</text>
                  </g>
                )}
              </svg>
            );
          })()}
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/10 pt-2 select-none">
          {variant === 'credit_score' ? (
            <>
              <span>Streak: <strong className={risk.isHigh ? 'text-red-400' : 'text-emerald-400'}>{val} Months</strong></span>
              <span>CIBIL Status: <strong className={risk.isHigh ? 'text-red-400 font-bold' : 'text-emerald-400'}>{risk.label}</strong></span>
            </>
          ) : variant === 'auditor' ? (
            <>
              <span>Footnotes Checked: <strong className="text-cyan-400">{val}% Scanned</strong></span>
              <span>Report Verdict: <strong className={val >= 80 ? 'text-red-400 font-black animate-pulse' : val >= 40 ? 'text-amber-400' : 'text-emerald-400'}>{val >= 80 ? 'Liabilities Exposed!' : val >= 40 ? 'Qualified Opinion' : 'Unqualified Clean'}</strong></span>
            </>
          ) : variant === 'earnings_qual' ? (
            <>
              <span>Collections Delay: <strong className="text-cyan-400">{val} Days</strong></span>
              <span>Quality: <strong className={val <= 30 ? 'text-emerald-400 font-bold' : val <= 90 ? 'text-amber-400' : 'text-red-400 font-black animate-pulse'}>{val <= 30 ? 'Cash Backed (High)' : val <= 90 ? 'Standard Accrual' : 'Accrual Abuse (Junk)'}</strong></span>
            </>
          ) : variant === 'tracking' ? (
            <>
              <span>Tracking Deviation: <strong className="text-rose-400">{val}% Error</strong></span>
              <span>Fund Efficiency: <strong className={val <= 0.1 ? 'text-emerald-400 font-bold' : val <= 1.0 ? 'text-amber-400' : 'text-red-400 font-black animate-pulse'}>{val <= 0.1 ? 'Perfect Index Hug' : val <= 1.0 ? 'Moderate Slippage' : 'Extreme Decay'}</strong></span>
            </>
          ) : variant === 'credit_risk' ? (
            <>
              <span>Portfolio Quality: <strong className={val >= 8 ? 'text-emerald-400' : val >= 5 ? 'text-amber-400' : 'text-red-400'}>{val >= 8 ? 'AA/AAA Safe' : val >= 5 ? 'A/BBB Moderate' : 'Junk Default'}</strong></span>
              <span>Loss Vector: <strong className={val <= 2 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-500'}>{val <= 2 ? '100% Default Writeoff' : 'Nominal'}</strong></span>
            </>
          ) : variant === 'pledging' ? (
            <>
              <span>Promoter Leveraged: <strong className="text-rose-400">{val}% Pledged</strong></span>
              <span>Margin Call Vulnerability: <strong className={val >= 90 ? 'text-red-400 font-black animate-pulse' : val >= 75 ? 'text-amber-400' : 'text-emerald-400'}>{val >= 90 ? 'Liquidation Active' : val >= 75 ? 'Critical Risk' : 'Safe'}</strong></span>
            </>
          ) : variant === 'rpt' ? (
            <>
              <span>Self-Dealing Rate: <strong className="text-rose-400">{val}% RPT</strong></span>
              <span>Siphoning Alert: <strong className={val >= 20 ? 'text-red-400 font-bold animate-pulse' : 'text-emerald-400'}>{val >= 20 ? 'Active Profit Tunneling' : 'Optimal'}</strong></span>
            </>
          ) : variant === 'auditor_resign' ? (
            <>
              <span>Governance Score: <strong className="text-rose-400">{val}% Risk</strong></span>
              <span>Audit Status: <strong className={val >= 70 ? 'text-red-400 font-black animate-pulse' : val >= 30 ? 'text-amber-400' : 'text-emerald-400'}>{val >= 70 ? 'Auditor Resigned!' : val >= 30 ? 'Under Suspicion' : 'Active Oversight'}</strong></span>
            </>
          ) : (
            <>
              <span>Telemetry Metric: <strong className={risk.isHigh ? 'text-red-400' : 'text-emerald-400'}>{val} {config?.units || ""}</strong></span>
              <span>Status: <strong className={risk.isHigh ? 'text-red-400 font-bold' : 'text-emerald-400'}>{risk.label}</strong></span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderVisualSimulation = () => {
    if (!config) return null;
    const simType = activeLesson.simulationType;
    const params = activeLesson.simParams || {};
    const value = animValue;
    const secValue = config.secondaryKnobLabel !== undefined ? animSecValue : undefined;
    const titleLower = activeLesson.title.toLowerCase();

    // Route by simulationType first, fallback to title/id matching
    if (simType === 'compounding') {
      return renderCompoundingEngine(params, value, secValue);
    }
    if (simType === 'inflation') {
      return renderInflationEngine(params, value, secValue);
    }
    if (simType === 'forensic_balance') {
      return renderBalanceSheetJenga(params, value, secValue);
    }
    if (simType === 'order_book') {
      return renderOrderBookEngine(params, value, secValue);
    }
    if (simType === 'cashflow') {
      return renderPlumbingEngine(params, value, secValue);
    }
    if (simType === 'options_greeks') {
      return renderGreeksEngine(params, value, secValue);
    }
    if (simType === 'blockchain') {
      return renderBlockchainEngine(params, value, secValue);
    }
    if (simType === 'asset_allocation') {
      return renderAllocationEngine(params, value, secValue);
    }
    if (simType === 'savings_vault') {
      return renderVaultEngine(params, value, secValue);
    }
    if (simType === 'forensic_corp') {
      return renderForensicEngine(params, value, secValue);
    }

    // Title / Id fallbacks
    if (titleLower.includes('compound') || titleLower.includes('sip') || activeLesson.id === 'l2' || activeLesson.id === 'l26') {
      return renderCompoundingEngine({ variant: 'sip', accentColor: '#10b981', label: 'SIP Tree Growth' }, value, secValue);
    }
    if (titleLower.includes('inflation') || activeLesson.id === 'l11' || activeLesson.id === 'l74') {
      return renderInflationEngine({ variant: 'core', accentColor: '#f97316', label: 'Inflation Erosion' }, value, secValue);
    }
    if (titleLower.includes('debt') || titleLower.includes('leverage') || activeLesson.id === 'l5' || activeLesson.id === 'l48' || activeLesson.id === 'l30') {
      return renderBalanceSheetJenga({ variant: 'balance_sheet', accentColor: '#60a5fa', label: 'Balance Sheet Jenga' }, value, secValue);
    }
    if (titleLower.includes('nifty') || titleLower.includes('sensex') || titleLower.includes('stock') || titleLower.includes('market') || titleLower.includes('liquidity') || titleLower.includes('order book') || activeLesson.id === 'l1' || activeLesson.id === 'l4') {
      return renderOrderBookEngine({ variant: 'equity', accentColor: '#06b6d4', label: 'Stock Price Depth' }, value, secValue);
    }
    if (titleLower.includes('emergency') || titleLower.includes('cash flow') || titleLower.includes('tax shelter') || titleLower.includes('rebate') || titleLower.includes('budget') || titleLower.includes('spend') || activeLesson.id === 'l8' || activeLesson.id === 'l6' || activeLesson.id === 'l75') {
      return renderPlumbingEngine({ variant: 'fcf', accentColor: '#38bdf8', label: 'Free Cash Flow' }, value, secValue);
    }
    if (titleLower.includes('option') || titleLower.includes('call') || titleLower.includes('put') || titleLower.includes('greek') || titleLower.includes('theta') || titleLower.includes('delta')) {
      return renderGreeksEngine({ variant: 'call_put', accentColor: '#8b5cf6', label: 'Call/Put Payoff' }, value, secValue);
    }
    if (titleLower.includes('crypto') || titleLower.includes('blockchain') || titleLower.includes('defi') || titleLower.includes('node') || titleLower.includes('consensus') || activeLesson.id === 'l7' || activeLesson.id === 'l73') {
      return renderBlockchainEngine({ variant: 'crypto', accentColor: '#f59e0b', label: 'Crypto Ledger' }, value, secValue);
    }
    if (titleLower.includes('diversif') || titleLower.includes('allocat') || titleLower.includes('rebalanc') || titleLower.includes('correlation') || titleLower.includes('passive') || titleLower.includes('active') || titleLower.includes('basket') || titleLower.includes('theme') || titleLower.includes('smallcase') || titleLower.includes('reit') || titleLower.includes('invit') || ['l10', 'l12', 'l13', 'l14', 'l15', 'l16', 'l24', 'l28', 'l31', 'l54', 'l55', 'l56', 'l78', 'l83', 'l84', 'l85', 'l87', 'l88'].includes(activeLesson.id)) {
      return renderAllocationEngine({ variant: 'portfolio', accentColor: '#a78bfa', label: 'Portfolio Balance' }, value, secValue);
    }
    if (titleLower.includes('saving') || titleLower.includes('investing') || titleLower.includes('needs') || titleLower.includes('wants') || titleLower.includes('barter') || titleLower.includes('fiat') || titleLower.includes('currency') || titleLower.includes('wallet') || titleLower.includes('upi') || ['l25', 'l45', 'l46', 'l49', 'l50', 'l51'].includes(activeLesson.id)) {
      return renderVaultEngine({ variant: 'emergency', accentColor: '#ef4444', label: 'Emergency Buffer' }, value, secValue);
    }
    if (titleLower.includes('audit') || titleLower.includes('red flag') || titleLower.includes('pledge') || titleLower.includes('related party') || titleLower.includes('resign') || titleLower.includes('governance') || titleLower.includes('goodwill') || ['l19', 'l34', 'l37', 'l62', 'l63', 'l64', 'l93', 'l94', 'l95'].includes(activeLesson.id)) {
      return renderForensicEngine({ variant: 'red_flags', accentColor: '#ef4444', label: 'Red Flag Detector' }, value, secValue);
    }

    // Default premium fallback
    return (
      <div className="relative w-full max-w-sm h-64 bg-slate-950/80 rounded-3xl border border-white/5 flex flex-col justify-between p-4 overflow-hidden shadow-2xl">
        {/* circuit-pulse uses lab-flow keyframe from centralized CSS */}
        <div className="absolute top-2 left-3 text-[8px] font-mono text-cyan-400 tracking-wider">Holographic Lab Circuit</div>
        <div className="flex-1 flex items-center justify-center relative mt-2">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="45" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="2" />
            <path d="M 30 75 Q 75 30 120 75 Q 75 120 30 75 Z" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1" strokeDasharray="6,4"
                  style={{ animation: 'lab-flow 2s linear infinite' }} />
          </svg>
          <div className="flex items-center justify-center gap-6 relative z-10">
            {config?.stageEmojis.map((emoji, idx) => (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  ...stageStyles[idx]
                }}
                className="text-5xl select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] hover:scale-110 active:scale-95 duration-200 transition-all cursor-pointer"
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-white/5 pt-2">
          <span>Variables: <strong className="text-violet-400">{value} {config?.units}</strong></span>
          <span>Simulation: <strong className="text-cyan-400">Stable</strong></span>
        </div>
      </div>
    );
  };


                  return (
    <div className="contents">
      {/* Sidebar layout */}

      {/* Immersive Main Container */}
      <div className="lg:pl-72 flex-1 flex flex-col h-full relative pt-16 lg:pt-0 bg-[#02040a] text-white"
           style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 60%)' }}>
        
      {/* ────────── TOP HEADER BAR ────────── */}
        <div className="bg-[#020409] border-b border-white/[0.07] px-4 py-3 flex flex-wrap justify-between items-center gap-3 sticky top-0 z-20 backdrop-blur-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                const from = searchParams.get("from");
                if (from === "playground") {
                  navigate("/playground");
                } else {
                  navigate("/learn");
                }
              }}
              onMouseEnter={() => setHoveredControl("[NAV.PORT] Exit Laboratory Viewstage: Terminate current simulation instance and route back to central curriculum index.")}
              onMouseLeave={() => setHoveredControl("")}
              className="shrink-0 bg-white/[0.05] hover:bg-white/10 p-2 rounded-xl transition border border-white/[0.08] flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Breadcrumb label */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
              <span>SANDBOX</span>
              <span className="text-slate-700">/</span>
              <span className="text-violet-400 font-bold uppercase tracking-wider">LABORATORY</span>
            </div>

            <div className="w-px h-5 bg-white/10 hidden sm:block shrink-0" />

            <div
              className="cursor-help min-w-0"
              onMouseEnter={() => setHoveredControl(`[STAGE.CORE] Macroeconomic Sandbox Laboratory: Real-time math-driven visualizer computing variable matrices and simulating structural asset dynamics for "${activeLesson.title}".`)}
              onMouseLeave={() => setHoveredControl("")}
            >
              <h1 className="text-sm font-black text-white flex items-center gap-2 truncate">
                <span className="text-base shrink-0">{activeLesson.emoji}</span>
                <span className="truncate">{activeLesson.title} Simulation</span>
              </h1>
            </div>

            {/* Simulating badge */}
            <span className="hidden md:flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              SIMULATING
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Lang Select */}
            <select
              value={audioLang}
              onChange={(e) => setAudioLang(e.target.value)}
              onMouseEnter={() => setHoveredControl("[LOCALE.SET] Audio-Lingual Translation: Modifies local dictionary configurations to synthesize speech and subtitles in selected language settings.")}
              onMouseLeave={() => setHoveredControl("")}
              className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-violet-500/40 transition-colors"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="tanglish">Tanglish</option>
            </select>

            {/* TTS Audio */}
            <button
              onClick={handleTTS}
              onMouseEnter={() => setHoveredControl("[AUDIO.SYNTH] Text-to-Speech Core: Triggers high-fidelity audio synthesis engine to vocalize current lesson concepts and academic explanations.")}
              onMouseLeave={() => setHoveredControl("")}
              className="bg-slate-900/60 hover:bg-slate-800 p-2 rounded-xl border border-white/10 hover:border-white/20 flex items-center justify-center cursor-pointer text-slate-300 hover:text-white transition-all active:scale-95"
              title="Speak Lesson Concept"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Guide Toggle Button */}
            <button
              onClick={() => setShowGuidePanel(prev => !prev)}
              onMouseEnter={() => setHoveredControl("[GUIDE.SYS] Section Onboarding Manual: Toggles overlay guides detailing visual node connections, slider limits, and objective triggers.")}
              onMouseLeave={() => setHoveredControl("")}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 gap-1.5 px-3 text-xs font-bold ${
                showGuidePanel
                  ? "bg-violet-600/30 border-violet-500/50 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "bg-slate-900/60 border-white/10 hover:border-violet-500/40 text-slate-400 hover:text-violet-300"
              }`}
              title="Toggle Lab Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            {/* Claim Reward Completion Button */}
            <button
              onClick={handleClaim}
              disabled={!isGoalSatisfied}
              onMouseEnter={() => setHoveredControl(`[SYNC.PUSH] State Synchronization & Ledger Write: Validates goal triggers, serializes simulator telemetry, and distributes reward credits (+${activeLesson.coins} Coins).`)}
              onMouseLeave={() => setHoveredControl("")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer shadow-lg ${
                isGoalSatisfied
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:scale-105 active:scale-95 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse"
                  : "bg-slate-950/30 text-slate-500 border border-white/10 cursor-not-allowed"
              }`}
            >
              🏆 Complete & Claim (+{activeLesson.coins} Coins)
            </button>
          </div>
        </div>

        {/* ── GUIDE SLIDE-IN PANEL ── */}
        {showGuidePanel && (
          <div className="mx-4 mb-0 mt-0 animate-in slide-in-from-top duration-200">
            <SectionGuide sectionId="/learn/lab" />
          </div>
        )}

        {/* ── MOBILE VIEW SELECTOR TABS ── */}
        <div className="lg:hidden mx-4 my-2.5 p-1 bg-slate-950/80 border border-white/[0.08] rounded-xl flex gap-1 backdrop-blur-md shrink-0">
          <button
            onClick={() => setActiveMobileTab("simulation")}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "simulation"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-black"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Simulation</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("controls")}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "controls"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-black"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Controls</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("chat")}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMobileTab === "chat"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-black"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Tutor</span>
          </button>
        </div>

        {/* ────────── THREE-COLUMN SIMULATION DASHBOARD ────────── */}
        {/*  LEFT: Controls | CENTER: Visualization | RIGHT: AI Chat  */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] xl:grid-cols-[320px_1fr_340px] gap-0 overflow-hidden">

          {/* ━━━ CENTER PANEL: Visualization Viewport ━━━ */}
          <div className={`flex-col bg-[#020409] border-r border-white/[0.06] overflow-y-auto lab-panel-scroll flex-1 ${activeMobileTab === "simulation" ? "flex" : "hidden"} lg:flex`}>


            {/* CENTER Panel Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Simulation Viewport</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-violet-400 font-mono font-bold">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="p-4 flex flex-col gap-4 flex-1">
            {/* Viewfinder Center Stage Card */}
            <div className={`bg-slate-950/40 backdrop-blur-xl border rounded-3xl p-6 flex flex-col items-center justify-center flex-1 min-h-[300px] lg:min-h-[360px] relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ${
              activeMarketEvent 
                ? "border-red-500/35 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-[pulse_3s_ease-in-out_infinite]"
                : "border-white/10 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            }`}>
              {/* Scanline Hazard Overlay if crisis is active */}
              {activeMarketEvent && (
                <>

                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500/25 blur-[1px] pointer-events-none z-10 animate-[scanline_3s_linear_infinite]" />
                  <div className="absolute inset-0 bg-red-500/[0.015] pointer-events-none z-0" />
                </>
              )}
              {/* Outer HUD decorations */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-white/5 border-dashed pointer-events-none" />
              <div className="absolute left-1/2 top-6 bottom-6 w-[1px] bg-white/5 border-dashed pointer-events-none" />

              {/* Viewport Control Mode Toggle */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                  onClick={() => setHudActive(!hudActive)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider transition cursor-pointer border ${
                    hudActive
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  📡 {hudActive ? "HUD X-Ray ON" : "HUD X-Ray OFF"}
                </button>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10 font-mono">
                {activeMarketEvent ? (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                    ⚠️ {activeMarketEvent.name}
                  </span>
                ) : isGoalSatisfied ? (
                  <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Target Satisfied
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    Simulating...
                  </span>
                )}
              </div>

              {/* Viewport Content */}
              {hudActive ? (
                /* Dynamic SVG Graphing HUD Rendering Engine */
                <div className="w-full max-w-lg h-60 bg-black/40 border border-cyan-500/10 rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]">
                  {/* Grid Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <line x1="20" y1="30" x2="220" y2="30" stroke="#06b6d4" strokeDasharray="3,3" />
                    <line x1="20" y1="60" x2="220" y2="60" stroke="#06b6d4" strokeDasharray="3,3" />
                    <line x1="20" y1="90" x2="220" y2="90" stroke="#06b6d4" strokeDasharray="3,3" />
                    <line x1="75" y1="10" x2="75" y2="110" stroke="#06b6d4" strokeDasharray="3,3" />
                    <line x1="130" y1="10" x2="130" y2="110" stroke="#06b6d4" strokeDasharray="3,3" />
                    <line x1="185" y1="10" x2="185" y2="110" stroke="#06b6d4" strokeDasharray="3,3" />
                  </svg>

                  {/* Crisis target stabilization zone highlighted */}
                  {activeMarketEvent && (
                    <div
                      className="absolute left-[20px] right-[20px] bg-emerald-500/5 border-t border-b border-emerald-500/20 flex items-center justify-center"
                      style={{
                        top: `${Math.max(10, 110 - (activeMarketEvent.targetMax * (100 / (config.max || 100))))}px`,
                        height: `${Math.max(15, (activeMarketEvent.targetMax - activeMarketEvent.targetMin) * (100 / (config.max || 100)))}px`
                      }}
                    >
                      <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                        STABILIZATION WINDOW ({activeMarketEvent.targetMin}-{activeMarketEvent.targetMax})
                      </span>
                    </div>
                  )}

                  {/* SVG Chart paths */}
                  <svg className="w-full h-full" viewBox="0 0 240 120">
                    <defs>
                      <linearGradient id="labGlowGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <filter id="labGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    
                    {/* Main Compound/Sim Curve path */}
                    <path
                      d={getSvgCurvePath()}
                      fill="none"
                      stroke="url(#labGlowGrad)"
                      strokeWidth="3.5"
                      filter="url(#labGlow)"
                      className="transition-all duration-300"
                    />

                    {/* Telemetry Oscilloscope Trajectory Path */}
                    {historyBuffer.length >= 2 && (
                      <path
                        d={getHistoryPath()}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="2,3"
                        opacity="0.85"
                        filter="url(#labGlow)"
                        className="transition-all duration-300"
                      />
                    )}

                    {/* Secondary benchmark path if alpha/beta */}
                    {activeLesson.title.toLowerCase().includes("alpha") && (
                      <line x1="20" y1="60" x2="220" y2="60" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5,5" opacity="0.3" />
                    )}
                  </svg>

                  {/* Live HUD Readouts overlay */}
                  <div className="flex justify-between items-center text-[8px] text-cyan-400 font-mono tracking-wider border-t border-cyan-500/10 pt-1.5 z-10 bg-slate-950/60 px-2 rounded-lg">
                    <span>INDEX: NIFTY50_SIM</span>
                    <span>LIVE_X1: {microscopeValue} {config?.units}</span>
                    {config?.secondaryKnobLabel && (
                      <span>LIVE_X2: {microscopeSecondaryValue} {config?.secondaryUnits}</span>
                    )}
                  </div>
                </div>
              ) : (
                /* Dynamic Interactive Visual Scene Render — with entrance animation + goal flash */
                <div
                  key={activeLesson.id}
                  className={`${lessonEntranceClass} w-full flex justify-center transition-all duration-300 relative`}
                  style={{
                    filter: isGoalFlashing ? 'drop-shadow(0 0 20px rgba(16,185,129,0.6))' : 'none',
                    transition: 'filter 0.4s ease-out'
                  }}
                >
                  {/* Ambient background scanline overlay for premium feel */}
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-10 opacity-40"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 0%, rgba(139,92,246,0.025) 50%, transparent 100%)',
                      backgroundSize: '100% 30%',
                      animation: 'lab-scan-line 5s linear infinite'
                    }}
                  />
                  {renderVisualSimulation()}
                </div>
              )}

              {/* Crisis active counter indicator */}
              {activeMarketEvent && (
                <div className="mt-4 w-full max-w-lg bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center space-y-1.5 animate-pulse">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    🚨 SYSTEM DRIFT INSTABILITY ACTIVE
                  </p>
                  <p className="text-xs text-slate-300 leading-normal">
                    {activeMarketEvent.desc}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono pt-1 text-slate-400">
                    <span>Countdown: <strong className="text-red-400">{eventCountdown}s</strong></span>
                    <span>Stability Gauge: <strong className="text-green-400">{Math.round((stabilizeTicks / 8) * 100)}%</strong></span>
                  </div>
                </div>
              )}

              {/* Lens HUD label */}
              <div className="absolute bottom-4 right-4 text-[8px] text-slate-500 font-mono tracking-widest uppercase">
                Lens Target: {config?.knobLabel} ({microscopeValue} {config?.units})
              </div>
            </div>

            </div> {/* close inner p-4 wrapper */}
          </div> {/* ━━━ close CENTER PANEL ━━━ */}

          {/* ━━━ LEFT PANEL: Controls (sliders + goal + presets) ━━━ */}
          <div className={`flex-col bg-[#020409] border-r border-white/[0.06] overflow-y-auto order-first lab-panel-scroll w-full lg:w-auto ${activeMobileTab === "controls" ? "flex" : "hidden"} lg:flex`}>

            {/* LEFT Panel Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Controls</span>
              {activeMarketEvent && (
                <span className="ml-auto flex items-center gap-1 text-[9px] text-red-400 font-mono font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  CRISIS ACTIVE
                </span>
              )}
              {!activeMarketEvent && (
                <span className="ml-auto flex items-center gap-1 text-[9px] text-slate-600 font-mono">
                  {isGoalSatisfied ? (
                    <span className="text-emerald-400 font-bold">✓ GOAL MET</span>
                  ) : (
                    <span>ADJUSTING</span>
                  )}
                </span>
              )}
            </div>

            {/* Simulation Goal + Crisis Injections + Presets Section */}
            <div className="p-4 flex flex-col gap-4 text-left">
              
              {/* Task Target */}
              <div 
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-md flex flex-col gap-3.5 cursor-help group hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.05)] ${
                  isGoalSatisfied
                    ? "bg-green-500/10 border-green-500/30 text-green-300 shadow-emerald-500/5"
                    : "bg-slate-950/40 backdrop-blur-xl border-white/10 text-slate-300"
                }`}
                onMouseEnter={() => {
                  const content = getDynamicLessonContent(activeLesson, audioLang);
                  setHoveredControl(`[TASK.OBJ] Simulation Goal Parameters: Achieve specific variable thresholds to satisfy the mathematical objective. | Concept: ${content?.concept || "Analysis"} | Why it matters: ${content?.whyMatters || "Crucial"}`);
                }}
                onMouseLeave={() => setHoveredControl("")}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-all duration-300 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">
                      Simulation Target Task
                    </span>
                  </div>
                  {isGoalSatisfied ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Goal Met
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pending Goal
                    </span>
                  )}
                </div>

                {/* Body Column */}
                <div className="space-y-1.5 text-left">
                  <p className="text-xs font-semibold leading-relaxed text-white">
                    {config?.goalLabel}
                  </p>
                  {/* Hover Hint Indicator */}
                  <div className="flex items-center gap-1.5 text-[9px] text-violet-400/80 font-semibold mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400/50 animate-pulse shrink-0" />
                    <span>💡 Hover to view details in Telemetry HUD</span>
                  </div>
                </div>
              </div>

              {/* Algorithmic Stress-Testing Console */}
              <div 
                className="bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between h-[265px] shadow-xl transition-all duration-300 hover:border-violet-500/20 w-full"
                onMouseEnter={() => setHoveredControl("[STRESS.EXEC] Shock Engine Console: Injects external volatility shocks and structural market crises (Crash of '08, stagflation, black swans) to run resiliency diagnostics.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono tracking-wider block">
                    Stress-Testing Console
                  </span>
                </div>

                {/* Sleek Terminal Diagnostics HUD */}
                <div className="bg-black/85 border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-slate-300 space-y-1 shadow-inner select-none h-[106px] flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-cyan-400 font-black tracking-wider text-[8px]">SYS DIAGNOSTICS</span>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${activeMarketEvent ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      <span className="text-[7px] font-bold text-slate-400 uppercase font-mono tracking-tight">
                        {activeMarketEvent ? 'SYS ANOMALY' : 'SYS NOMINAL'}
                      </span>
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-1">
                    {activeMarketEvent ? (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-red-400 font-bold shrink-0">STRESS:</span>
                          <span className="text-white font-extrabold truncate max-w-[140px]" title={activeMarketEvent.name}>{activeMarketEvent.name}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-amber-400 font-bold shrink-0">DRIFT:</span>
                          <span className="text-white font-bold">{activeMarketEvent.driftDir > 0 ? "📈 RISE" : "📉 CRASH"}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400 font-bold shrink-0">TARGET:</span>
                          <span className="text-emerald-400 font-bold">{activeMarketEvent.targetMin} - {activeMarketEvent.targetMax}{config.units || ""}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1 text-[9px] text-slate-500 font-mono py-1 select-none">
                        <div className="flex justify-between">
                          <span>[SYS.STATUS]</span>
                          <span className="text-emerald-500/80 font-bold">READY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>[SHOCK.ENGINE]</span>
                          <span>IDLE</span>
                        </div>
                        <div className="text-[8px] text-slate-600 mt-1.5 border-t border-white/5 pt-1">
                          &gt; Awaiting historical preset trigger...
                        </div>
                      </div>
                    )}
                  </div>

                  {activeMarketEvent && (
                    <div className="border-t border-white/5 pt-1 flex justify-between text-[8px] font-bold">
                      <span className="text-rose-400">SEC REMAINING: {eventCountdown}s</span>
                      <span className="text-cyan-400">STABILITY INDEX: {Math.round((stabilizeTicks / 8) * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Preset Scenarios selector */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[7.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Historical Presets</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleApplyPreset("crisis")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        const data = getPresetTelemetry("crisis", activeLesson, config);
                        setHoveredControl(`[PRESET.CRISIS] Crash '08 Preset: ${data.explanation}`);
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] tracking-tighter py-1 rounded-xl cursor-pointer transition font-mono font-bold flex items-center justify-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      Crash '08
                    </button>
                    <button
                      onClick={() => handleApplyPreset("stagflation")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        const data = getPresetTelemetry("stagflation", activeLesson, config);
                        setHoveredControl(`[PRESET.STAGFLATION] Stagflation Preset: ${data.explanation}`);
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className="bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] tracking-tighter py-1 rounded-xl cursor-pointer transition font-mono font-bold flex items-center justify-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                      Stagflation
                    </button>
                    <button
                      onClick={() => handleApplyPreset("easy")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        const data = getPresetTelemetry("easy", activeLesson, config);
                        setHoveredControl(`[PRESET.EASE] Easy '20 Preset: ${data.explanation}`);
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] tracking-tighter py-1 rounded-xl cursor-pointer transition font-mono font-bold flex items-center justify-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                      Easy '20
                    </button>
                  </div>
                </div>

                {/* Challenge trigger */}
                <button
                  disabled={activeMarketEvent !== null}
                  onClick={injectMarketCrisis}
                  onMouseEnter={() => setHoveredControl("[SHOCK.DRIFT] Algorithmic Challenge Mode: Injects real-time variable drift. Stabilize values inside target boundaries within 15 seconds to claim coin bounties.")}
                  onMouseLeave={() => setHoveredControl("")}
                  className={`w-full py-2 rounded-xl font-black text-xs cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg border ${
                    activeMarketEvent 
                      ? "bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse" 
                      : eventSuccess 
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30" 
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-violet-500/30"
                  }`}
                >
                  {activeMarketEvent ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      STABILIZING ({eventCountdown}s)
                    </>
                  ) : eventSuccess ? (
                    "🏆 PASSED! +100 COINS"
                  ) : (
                    "⚡ RUN CHALLENGE"
                  )}
                </button>
              </div>

            </div>

            {/* Controller Sliders Card */}
            <div 
              className="bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-4 shadow-xl text-left relative transition-all duration-300 hover:border-violet-500/30"
              onMouseEnter={() => setHoveredControl("[KNOB.CTL] Input Control Panel: Adjust slider parameters to dynamically re-evaluate equations and redraw interactive canvas physics nodes.")}
              onMouseLeave={() => setHoveredControl("")}
            >
              {/* Highlight target zone boundary indicator overlay on slider track if crisis is active */}
              {activeMarketEvent && activeMarketEvent.targetKnob === "1" && (
                <div className="absolute top-[85px] left-[15%] right-[25%] bg-emerald-500/10 border-l border-r border-emerald-500/40 h-2 pointer-events-none" />
              )}
              {activeMarketEvent && activeMarketEvent.targetKnob === "2" && (
                <div className="absolute top-[165px] left-[15%] right-[25%] bg-emerald-500/10 border-l border-r border-emerald-500/40 h-2 pointer-events-none" />
              )}

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-xs text-white font-extrabold uppercase font-mono tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" /> Adjust Variables
                </span>

                {/* Sweep toggle */}
                <button
                  onClick={() => setIsSweeping(!isSweeping)}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredControl("[SWEEP.SYS] Oscillating Sweep Loop: Automatically sweeps input variables back and forth to plot continuous function responses.");
                  }}
                  onMouseLeave={() => setHoveredControl("")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase font-mono tracking-wider transition cursor-pointer border ${
                    isSweeping
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                  title="Auto Cycle: Automatically oscillates the primary variable slider back and forth"
                >
                  🔄 {isSweeping ? "Stop Loop" : "Auto Cycle"}
                </button>
              </div>

              {/* Slider 1 */}
              <div 
                className="space-y-3"
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  const optNameMin = getOptionName(activeLesson.id, config?.min);
                  const optNameMax = getOptionName(activeLesson.id, config?.max);
                  const minStr = optNameMin ? `${optNameMin}` : `${config?.min} ${config?.units}`;
                  const maxStr = optNameMax ? `${optNameMax}` : `${config?.max} ${config?.units}`;
                  setHoveredControl(`[KNOB.PRI] Primary Variable Slider: Adjust ${config?.knobLabel} dynamically from a minimum of ${minStr} to a maximum of ${maxStr}.`);
                }}
                onMouseLeave={() => setHoveredControl("")}
              >
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold">
                    1. Adjust {config?.knobLabel}:
                  </span>
                  <span className="text-xs font-black text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
                    {getOptionName(activeLesson.id, microscopeValue) || `${microscopeValue} ${config?.units}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={config?.min}
                  max={config?.max}
                  step={config?.step}
                  value={microscopeValue}
                  onChange={(e) => handleMicroscopeChange(Number(e.target.value))}
                  className="w-full accent-violet-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  title={`Adjust ${config?.knobLabel} from a minimum of ${config?.min} to a maximum of ${config?.max} ${config?.units}`}
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Min: {getOptionName(activeLesson.id, config?.min) || `${config?.min} ${config?.units}`}</span>
                  <span>Max: {getOptionName(activeLesson.id, config?.max) || `${config?.max} ${config?.units}`}</span>
                </div>
              </div>

              {/* Slider 2 (Secondary Dial) */}
              {config?.secondaryKnobLabel && (
                <div 
                  className="space-y-3 border-t border-white/5 pt-4"
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredControl(`[KNOB.SEC] Secondary Variable Slider: Adjust ${config?.secondaryKnobLabel} dynamically from a minimum of ${config?.secondaryMin} to a maximum of ${config?.secondaryMax} ${config?.secondaryUnits}.`);
                  }}
                  onMouseLeave={() => setHoveredControl("")}
                >
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold">
                      2. Adjust {config?.secondaryKnobLabel}:
                    </span>
                    <span className="text-xs font-black text-violet-400 bg-violet-500/15 border border-violet-500/20 px-2.5 py-0.5 rounded-lg">
                      {microscopeSecondaryValue} {config?.secondaryUnits}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={config?.secondaryMin}
                    max={config?.secondaryMax}
                    step={config?.secondaryStep}
                    value={microscopeSecondaryValue}
                    onChange={(e) => handleMicroscopeSecondaryChange(Number(e.target.value))}
                    className="w-full accent-violet-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    title={`Adjust ${config?.secondaryKnobLabel} from a minimum of ${config?.secondaryMin} to a maximum of ${config?.secondaryMax} ${config?.secondaryUnits}`}
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>Min: {config?.secondaryMin} {config?.secondaryUnits}</span>
                    <span>Max: {config?.secondaryMax} {config?.secondaryUnits}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Double Column sublayout: Analysis terminal & Voice Debate Panel stacked vertically */}
            <div className="flex flex-col gap-4 mb-4">
              
              {/* Microscope Analysis / Telemetry Logs Terminal */}
              <div 
                className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3 font-mono shadow-xl text-left flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:border-violet-500/25"
                onMouseEnter={() => setHoveredControl("[TELEMETRY] Real-time Verdict Engine: Performs dynamic calculus, yields, and math equations, outputting live text verdicts.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest border-b border-white/5 pb-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTerminalTab("verdict")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl("[MATH.EVAL] Dynamic Mathematical Verdicts: Evaluates active variables against formula matrices and logs academic performance verdicts.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${
                        terminalTab === "verdict" ? "text-cyan-400 font-black" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" /> Telemetry Analyzer
                    </button>
                    <button
                      onClick={() => setTerminalTab("logs")}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl("[LOGGER] System Execution Audit: Logs chronologically structured tick executions and slider delta values.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className={`flex items-center gap-1.5 cursor-pointer transition ${
                        terminalTab === "logs" ? "text-emerald-400 font-black" : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <span>💾</span> System Logs
                    </button>
                  </div>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
                
                {terminalTab === "verdict" ? (
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed font-sans font-medium flex-1">
                    {verdictText}
                  </p>
                ) : (
                  <div ref={consoleContainerRef} className="flex-1 overflow-y-auto max-h-[110px] space-y-1 mt-1 text-[10px] font-mono text-emerald-400/90 leading-tight pr-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
                    {consoleLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                )}

                <div className="flex gap-4 text-[9px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-2">
                  <span>Format: Sandbox/JSON</span>
                  <span>Buffer: {historyBuffer.length}/25</span>
                  <span>Logs: {consoleLogs.length}</span>
                </div>
              </div>

              {/* 🎙️ Voice-Driven AI Debate Panel */}
              <div 
                className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3 shadow-xl text-left flex flex-col justify-between min-h-[190px] transition-all duration-300 hover:border-violet-500/25"
                onMouseEnter={() => setHoveredControl("[DEBATE.SYS] Speech Analysis Arena: Record verbal arguments to test strategy reasoning. Core AI evaluates logic structure, awarding scores out of 10.")}
                onMouseLeave={() => setHoveredControl("")}
              >
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase font-mono tracking-widest flex items-center gap-1.5">
                    🎙️ Voice-Driven AI Debate
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono">Speak Reply:</span>
                    <button
                      onClick={() => setVoiceDebateEnabled(!voiceDebateEnabled)}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredControl("[SPEECH.SYNTH] Tutor Speech Out: Toggles text-to-speech audio synthesis for the AI Tutor's replies.");
                      }}
                      onMouseLeave={() => setHoveredControl("")}
                      className={`w-8 h-4 rounded-full transition-all relative ${
                        voiceDebateEnabled ? "bg-violet-600" : "bg-slate-800"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-all ${
                        voiceDebateEnabled ? "right-0.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Voice Oscilloscope Canvas Visualizer */}
                <canvas ref={canvasRef} width="240" height="35" className="w-full h-8 bg-slate-950/45 rounded-xl border border-white/5 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] select-none pointer-events-none" />

                {/* Score indicators */}
                {debateScore !== null ? (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-3 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono font-black text-violet-400">
                      <span>TUTOR DEBATE EVALUATION:</span>
                      <span className="bg-violet-500/20 px-2 py-0.5 rounded border border-violet-500/30">
                        SCORE: {debateScore}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium font-sans">
                      {debateFeedback}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic flex-1 flex items-center justify-center text-center font-sans">
                    Debate points with AI Mentor! Enable "Speak Reply" and hit the microphone to argue your thesis.
                  </p>
                )}

                {/* Speech Control Button */}
                <div className="flex gap-2 border-t border-white/5 pt-2">
                  <button
                    onClick={startSpeechRecognition}
                    disabled={isListening}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredControl("[MIC.CAPTURE] Microphone Input Capture: Initializes local browser web-speech engine to transcribe your verbal arguments into text.");
                    }}
                    onMouseLeave={() => setHoveredControl("")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition-all flex items-center justify-center gap-2 ${
                      isListening
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5 hover:text-white"
                    }`}
                  >
                    {isListening ? (
                      <div className="flex items-center gap-1 py-0.5 justify-center">

                        <span className="text-[10px] mr-1.5 font-bold uppercase tracking-widest text-red-400">LISTENING</span>
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-400 rounded-full"
                            style={{
                              animation: 'wave-pulse 1s ease-in-out infinite',
                              animationDelay: `${i * 0.12}s`,
                              height: '8px'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <span>🎙️</span>
                        <span>Speak Question</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Sticky Industry-Grade System Telemetry HUD Readout */}
            {(() => {
              const parseHoverText = (text) => {
                if (!text) return null;
                let tag = "";
                let remaining = text;
                const tagMatch = text.match(/^\[([A-Z0-9_\.]+)\]\s*/);
                if (tagMatch) {
                  tag = tagMatch[1];
                  remaining = text.substring(tagMatch[0].length);
                }
                const parts = remaining.split(/\s*\|\s*/);
                const mainPart = parts[0] || "";
                let title = "";
                let description = mainPart;
                const colonIndex = mainPart.indexOf(":");
                if (colonIndex !== -1) {
                  title = mainPart.substring(0, colonIndex).trim();
                  description = mainPart.substring(colonIndex + 1).trim();
                }
                const details = [];
                for (let i = 1; i < parts.length; i++) {
                  const part = parts[i];
                  const cIdx = part.indexOf(":");
                  if (cIdx !== -1) {
                    details.push({
                      label: part.substring(0, cIdx).trim(),
                      value: part.substring(cIdx + 1).trim()
                    });
                  } else {
                    details.push({
                      label: "Info",
                      value: part.trim()
                    });
                  }
                }
                return { tag, title, description, details };
              };

              const parsed = parseHoverText(hoveredControl);

              const getTagColor = (tag) => {
                if (!tag) return "bg-slate-500/10 text-slate-400 border-slate-500/20";
                const t = tag.toUpperCase();
                if (t.includes("KNOB") || t.includes("SWEEP")) return "bg-violet-500/10 text-violet-400 border-violet-500/20";
                if (t.includes("TASK") || t.includes("OBJ") || t.includes("GOAL")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                if (t.includes("STRESS") || t.includes("SHOCK")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
                if (t.includes("PRESET")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
                if (t.includes("TELEMETRY") || t.includes("MATH") || t.includes("LOGGER")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                if (t.includes("DEBATE") || t.includes("MIC") || t.includes("SPEECH")) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
                if (t.includes("STATE") || t.includes("EXPLORER") || t.includes("HASH") || t.includes("PAYLOAD") || t.includes("SHIELD")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";
              };

              const getHUDIcon = () => {
                if (!hoveredControl) return "💡";
                const text = hoveredControl.toLowerCase();
                if (text.includes("slider") || text.includes("variable") || text.includes("knob") || text.includes("sweep") || text.includes("sweep.sys")) return "🎛️";
                if (text.includes("debate") || text.includes("speak") || text.includes("microphone") || text.includes("speech") || text.includes("mic")) return "🎙️";
                if (text.includes("telemetry") || text.includes("analyzer") || text.includes("logs") || text.includes("logger")) return "💻";
                if (text.includes("claim") || text.includes("complete") || text.includes("reward") || text.includes("sync")) return "🏆";
                if (text.includes("target") || text.includes("task") || text.includes("objective") || text.includes("goal")) return "🎯";
                if (text.includes("preset") || text.includes("lehman") || text.includes("crisis") || text.includes("ease") || text.includes("stagflation")) return "💾";
                return "💡";
              };

              return (
                <div 
                  className={`sticky bottom-0 z-30 mt-4 bg-slate-950/95 backdrop-blur-md border rounded-2xl p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] text-left min-h-[120px] flex flex-col justify-between transition-all duration-300 ${
                    hoveredControl ? "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-white/5"
                  }`}
                >
                  {/* HUD Top bar */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 select-none shrink-0">
                    <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest text-slate-500 uppercase font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${hoveredControl ? "bg-violet-400 animate-pulse" : "bg-emerald-500"}`} />
                      {hoveredControl ? "SYSTEM TELEMETRY HUD" : "SYSTEM READY"}
                    </span>
                    <span className="font-mono text-[8px] text-slate-600">BAUD: 115200 // ADDR: 0x4F8B</span>
                  </div>

                  {parsed ? (
                    <div className="flex flex-col flex-1 gap-1.5 mt-2">
                      {/* Tag, Icon, and Title */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0 select-none">{getHUDIcon()}</span>
                        {parsed.tag && (
                          <span className={`text-[7.5px] font-black font-mono px-1.5 py-0.5 rounded border ${getTagColor(parsed.tag)}`}>
                            {parsed.tag}
                          </span>
                        )}
                        {parsed.title && (
                          <span className="text-[10px] font-black text-white font-mono tracking-wide">
                            {parsed.title}
                          </span>
                        )}
                      </div>

                      {/* Main explanation paragraph */}
                      <p className="text-[10px] leading-relaxed text-slate-300 font-sans font-medium flex-1">
                        {parsed.description}
                      </p>

                      {/* Dynamic parsed details (e.g. Concept: Savings Rate) */}
                      {parsed.details.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-white/[0.04] pt-1.5 mt-0.5">
                          {parsed.details.map((d, i) => (
                            <div key={i} className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded text-[8px] font-mono leading-none">
                              <span className="text-violet-400 font-bold uppercase">{d.label}:</span>
                              <span className="text-slate-300 font-semibold">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default state when nothing hovered */
                    <div className="flex items-start gap-2.5 mt-2 flex-1">
                      <span className="text-base shrink-0 select-none mt-0.5">💡</span>
                      <div className="text-[10px] leading-normal text-slate-400 font-sans font-medium">
                        <span className="text-slate-500 italic block mb-1">SYSTEM IDLE // SCANNING FOR MOUSE FEEDBACK</span>
                        Hover over any active control element (presets, sliders, auto-cycle toggles, telemetry tabs, debate microphone, or stage headers) to stream real-time mathematical diagnostics and concept tutorials.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Section Guide at bottom of left column */}
            <SectionGuide sectionId="/learn/lab" />

          </div> {/* ━━━ close LEFT PANEL ━━━ */}

          {/* ━━━ RIGHT PANEL: AI Tutor Chat ━━━ */}
          <div className={`flex flex-col bg-[#020409] overflow-hidden lab-panel-scroll flex-1 ${activeMobileTab === "chat" ? "flex" : "hidden"} lg:flex`}>

            {/* Right Panel Header */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">AI Tutor</span>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                ONLINE
              </span>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">

            {/* Chat message history log */}
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed text-left flex flex-col shadow-lg transition-all ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white self-end rounded-br-none shadow-violet-950/20"
                      : "bg-slate-950/40 backdrop-blur-xl text-slate-200 self-start rounded-bl-none border border-white/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="font-medium">{msg.content}</span>
                  ) : (
                    <div className="w-full text-slate-200 space-y-1">{renderMarkdown(msg.content)}</div>
                  )}
                </div>
              ))}
              {isSendingChat && (
                <div className="bg-slate-800 text-slate-400 self-start rounded-2xl rounded-bl-none p-3 text-xs border border-white/5 animate-pulse text-left">
                  FinGuru is formulating explanation...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat suggestion prompts */}
            <div className="px-4 py-2 bg-slate-900/20 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none flex-nowrap shrink-0">
              <button
                onClick={() => setChatInput(`How does ${config?.knobLabel || "this variable"} impact ${activeLesson.title}?`)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 text-[10px] px-2.5 py-1 rounded-xl whitespace-nowrap cursor-pointer transition hover:text-white"
              >
                💡 Variable Impact
              </button>
              <button
                onClick={() => setChatInput(`What is a real-world Indian example of ${activeLesson.title}?`)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 text-[10px] px-2.5 py-1 rounded-xl whitespace-nowrap cursor-pointer transition hover:text-white"
              >
                🇮🇳 Indian Example
              </button>
              <button
                onClick={() => setChatInput(`How do I optimize the target goal: "${config?.goalLabel}"?`)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 text-[10px] px-2.5 py-1 rounded-xl whitespace-nowrap cursor-pointer transition hover:text-white"
              >
                🎯 Goal Optimization
              </button>
            </div>

            {/* Chat submit input form */}
            <form onSubmit={handleSendQuestion} className="px-3 py-3 bg-[#020409] border-t border-white/[0.07] flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask FinGuru a question..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/60 focus:bg-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all duration-200"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.4)] active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            </div> {/* close AI chat inner div */}
          </div> {/* close RIGHT panel */}

        </div> {/* close 3-col grid */}

        {/* 📰 Reactive Market News Ticker bottom banner */}
        <div className="bg-slate-950 border-t border-white/5 px-6 py-2.5 flex items-center gap-3 relative overflow-hidden shrink-0">
          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 px-2 py-0.5 rounded font-black uppercase font-mono tracking-widest z-10 shrink-0">
            LIVE TICKER
          </span>
          <div className="flex-1 overflow-hidden relative w-full">
            <p className="text-[10px] font-mono text-slate-400 whitespace-nowrap animate-[marquee_25s_linear_infinite] inline-block font-semibold">
              {getNewsTickerText()}
            </p>
          </div>
        </div>

      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">

          
          <div className="bg-slate-900/95 border border-amber-500/25 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden">
            {/* Top gold glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
            
            {/* 3D-styled Spinning Gold Coin */}
            <div className="flex justify-center py-2">
              <div 
                className="w-20 h-20 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center border-4 border-yellow-300"
                style={{
                  animation: 'spin-coin 3s linear infinite',
                  transformStyle: 'preserve-3d'
                }}
              >
                <span className="text-4xl text-yellow-100 select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">🪙</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase font-mono tracking-widest block">
                Module Mastered!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {activeLesson.title} Complete
              </h2>
              <p className="text-xs text-slate-400 px-4 leading-relaxed">
                You have successfully calibrated the simulation parameters, balanced key macroeconomic drivers, and secured system state controls.
              </p>
            </div>

            {/* Reward Box */}
            <div className="bg-slate-950/65 border border-white/5 rounded-2xl p-4 flex items-center justify-between mx-4">
              <div className="text-left">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Reward Claimed</span>
                <span className="text-lg font-black text-white">+{activeLesson.coins} Coins</span>
              </div>
              <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-xl text-xs font-black font-mono">
                CLAIMED
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleCelebrationClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-2xl cursor-pointer shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-98"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    
    </div>
  );
};

export default LabPage;
