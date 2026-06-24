import React, { useState, useMemo, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { defaultGlossary, GLOSSARY_FORMULAS, glossaryEnrichments } from "../../data/glossaryData";
import { ACADEMY_LESSONS, lessonGlossaryMapping } from "../../data/academyData";

export default function GlossaryTab({
  api,
  navigate,
  audioLang,
  activeLesson,
  user,
  xpPoints,
  streakCount,
  glossary,
  setGlossary,
  bookmarkedTerms,
  setBookmarkedTerms,
  masteredTerms,
  setMasteredTerms,
  inlineTerm,
  setInlineTerm,
  speakTerm,
  setComparisonModalTermA,
  setComparisonModalTermB,
  setShowComparisonModal,
  toggleBookmark,
  updateUser
}) {
  // Local Glossary States
  const [searchTerm, setSearchTerm] = useState("");
  const [glossaryCategoryFilter, setGlossaryCategoryFilter] = useState("All");
  const [glossaryLetterFilter, setGlossaryLetterFilter] = useState("All");
  const [glossaryDifficultyFilter, setGlossaryDifficultyFilter] = useState("All");
  const [glossaryMode, setGlossaryMode] = useState("grid"); // "grid", "flashcards", "compare", "notebook", "challenge"
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [studyProgressIndex, setStudyProgressIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const val = localStorage.getItem("finbuddy_saved_notes");
      return val ? JSON.parse(val) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [studyLog, setStudyLog] = useState(() => {
    try {
      const saved = localStorage.getItem("finbuddy_study_log");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [editingNoteTerm, setEditingNoteTerm] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [deepDiveFollowUp, setDeepDiveFollowUp] = useState("");
  const [deepDiveChatHistory, setDeepDiveChatHistory] = useState({});
  const [deepDiveChatLoading, setDeepDiveChatLoading] = useState(false);
  const [comparisonTermA, setComparisonTermA] = useState("");
  const [comparisonTermB, setComparisonTermB] = useState("");

  const [dailyChallengeQuestions, setDailyChallengeQuestions] = useState([]);
  const [dailyChallengeStep, setDailyChallengeStep] = useState(0);
  const [dailyChallengeAnswers, setDailyChallengeAnswers] = useState([]);
  const [showDailyChallengeResults, setShowDailyChallengeResults] = useState(false);
  const [dailyChallengeCoinsRewarded, setDailyChallengeCoinsRewarded] = useState(false);

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Hello! Click any term in the glossary or ask me any question about finance. I'm here to help you learn!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef(null);
  const deepDiveChatEndRef = useRef(null);

  // Auto-scroll AI chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    deepDiveChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [deepDiveChatHistory]);

  // Sync studyLog changes to localStorage
  useEffect(() => {
    localStorage.setItem("finbuddy_study_log", JSON.stringify(studyLog));
  }, [studyLog]);

  // Glossary Helpers
  const getGlossaryEnrichment = (term) => {
    return glossaryEnrichments[term] || {
      usedIn: "Playground & Study Lessons",
      fieldUsed: "General financial understanding",
      example: "Understanding this term helps in general financial decisions.",
      likes: 15
    };
  };

  // Extracted function definitions:
    const getTermDifficulty = (item) => {
    const advancedCats = ["Derivatives", "Valuation", "Crypto", "Global"];
    const intermediateCats = ["Stocks", "Trading", "Forex", "Commodity", "Macro"];
    const advancedTerms = ["Options", "Option Greeks", "Beta", "Short Squeeze", "Swaps", "Payoff", "Arbitrage"];
    const intermediateTerms = ["P/E Ratio", "ETF", "Repo Rate", "Lumpsum", "IPO", "Market Cap"];

    if (advancedCats.includes(item.category) || advancedTerms.includes(item.term)) return "Advanced";
    if (intermediateCats.includes(item.category) || intermediateTerms.includes(item.term)) return "Intermediate";
    return "Beginner";
  };

    const nextLessonTerms = useMemo(() => {
    const completedIds = user?.lessonsCompleted || [];
    const unfinished = ACADEMY_LESSONS.filter(l => !completedIds.includes(l.id)).slice(0, 3);
    const terms = unfinished.flatMap(l => lessonGlossaryMapping[l.id] || []);
    return [...new Set(terms)];
  }, [user?.lessonsCompleted]);

      // Filtered glossary list based on search term AND category filter AND alphabet AND difficulty AND bookmarks
  const filteredGlossary = glossary.filter(
    (item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.short.toLowerCase().includes(searchTerm.toLowerCase());
      const todayStr = new Date().toISOString().split('T')[0];
      const matchesCategory =
        glossaryCategoryFilter === "All" ||
        (glossaryCategoryFilter === "Review Due"
          ? (masteredTerms.includes(item.term) && srsSchedule[item.term]?.nextReviewDate <= todayStr)
          : item.category === glossaryCategoryFilter);
      
      const firstChar = item.term.trim().charAt(0).toUpperCase();
      const isLetter = /^[A-Z]$/.test(firstChar);
      const matchesAlphabet =
        glossaryLetterFilter === "All" ||
        (glossaryLetterFilter === "#" ? !isLetter : firstChar === glossaryLetterFilter);

      const matchesDifficulty =
        glossaryDifficultyFilter === "All" ||
        getTermDifficulty(item) === glossaryDifficultyFilter;

      const matchesBookmark =
        glossaryMode !== "grid" || 
        !showBookmarksOnly || 
        bookmarkedTerms.includes(item.term);

      const matchesVocabMode =
        glossaryMode !== "vocab" ||
        nextLessonTerms.includes(item.term);

      return matchesSearch && matchesCategory && matchesAlphabet && matchesDifficulty && matchesBookmark && matchesVocabMode;
    }
  );

    const dueTerms = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return glossary.filter(
      (item) => masteredTerms.includes(item.term) && srsSchedule[item.term]?.nextReviewDate <= todayStr
    );
  }, [glossary, masteredTerms, srsSchedule]);

  // Helper Functions
  const toggleMastered = async (termName) => {
    let newlyMastered = false;
    setMasteredTerms((prev) => {
      const next = prev.includes(termName)
        ? prev.filter((t) => t !== termName)
        : [...prev, termName];
      localStorage.setItem("finbuddy_mastered_terms", JSON.stringify(next));
      if (next.includes(termName)) {
        newlyMastered = true;
      }
      return next;
    });

    if (newlyMastered) {
      try {
        const res = await api.post("/mentor/lesson-complete", {
          lessonId: `glossary_master_${termName.replace(/\s+/g, "_").toLowerCase()}`,
          coinsReward: 5,
        });
        if (res.data?.success) {
          toast(`Mastered "${termName}"! Earned +5 Coins! 🪙`, { icon: "🪙", duration: 3000 });
          if (updateUser && user) {
            updateUser({
              virtualCoins: (user.virtualCoins || 0) + 5
            });
          }
        }
      } catch (e) {
        console.error("Error rewarding coins for glossary:", e);
        toast(`Mastered "${termName}"! 🎓`, { icon: "🎓" });
      }
    }
  };

  const handleSaveToNotes = (term, defaultDesc) => {
    setSavedNotes((prev) => {
      if (prev.some((n) => n.term === term)) {
        toast(`"${term}" is already in your notebook! 📓`, { icon: "📓" });
        return prev;
      }
      const newNote = {
        term,
        date: new Date().toLocaleDateString(),
        content: defaultDesc,
        userNotes: ""
      };
      const next = [...prev, newNote];
      localStorage.setItem("finbuddy_saved_notes", JSON.stringify(next));
      toast(`Saved "${term}" to your study notebook! 📓`, { icon: "📓" });
      return next;
    });
  };

  const handleDeleteNote = (term) => {
    setSavedNotes((prev) => {
      const next = prev.filter((n) => n.term !== term);
      localStorage.setItem("finbuddy_saved_notes", JSON.stringify(next));
      toast(`Removed "${term}" from notebook`, { icon: "🗑️" });
      return next;
    });
  };

  const exportNotes = () => {
    if (savedNotes.length === 0) {
      toast("Notebook is empty. Add some definitions first!", { icon: "⚠️" });
      return;
    }
    let text = "=========================================\n";
    text += "        FINBUDDY GLOSSARY NOTEBOOK       \n";
    text += "=========================================\n\n";
    savedNotes.forEach((n, idx) => {
      text += `${idx + 1}. [${n.term}] - Saved on ${n.date}\n`;
      text += `-----------------------------------------\n`;
      text += `Definition: ${n.content}\n`;
      if (n.userNotes) {
        text += `My Notes: ${n.userNotes}\n`;
      }
      text += `\n=========================================\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "FinBuddy_Glossary_Notebook.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast("Notebook exported successfully! 📂", { icon: "📂" });
  };

    const handleSaveNoteCommentary = (term, text) => {
    setSavedNotes((prev) => {
      const next = prev.map((n) => (n.term === term ? { ...n, userNotes: text } : n));
      localStorage.setItem("finbuddy_saved_notes", JSON.stringify(next));
      setEditingNoteTerm(null);
      toast(`Saved notes update for "${term}"`, { icon: "✅" });
      return next;
    });
  };

    const handleDailyChallengeAnswerSelect = (optionIdx) => {
    setDailyChallengeAnswers((prev) => {
      const next = [...prev];
      next[dailyChallengeStep] = optionIdx;
      return next;
    });
  };

    const handleNextChallengeStep = async () => {
    if (dailyChallengeStep < 2) {
      setDailyChallengeStep((prev) => prev + 1);
    } else {
      setShowDailyChallengeResults(true);
      const score = dailyChallengeAnswers.reduce((acc, ans, idx) => {
        return ans === dailyChallengeQuestions[idx].correctIndex ? acc + 1 : acc;
      }, 0);
      if (score === 3 && !dailyChallengeCoinsRewarded) {
        setDailyChallengeCoinsRewarded(true);
        try {
          const res = await api.post("/mentor/lesson-complete", {
            lessonId: `daily_glossary_challenge_${Date.now()}`,
            coinsReward: 50,
          });
          if (res.data?.success) {
            toast("Perfect Score! You won +50 Coins! 🪙🏆", { icon: "🏆", duration: 4000 });
            if (updateUser && user) {
              updateUser({
                virtualCoins: (user.virtualCoins || 0) + 50
              });
            }
          }
        } catch (e) {
          console.error("Error rewarding quiz coins:", e);
          toast("Perfect Score! 3/3 Correct! 🌟", { icon: "🌟" });
        }
      } else {
        toast(`Challenge completed! Score: ${score}/3`, { icon: "📊" });
      }
    }
  };

    const handleGlossaryFollowUp = async () => {
    if (!deepDiveFollowUp.trim() || !selectedTerm) return;
    const query = deepDiveFollowUp.trim();
    setDeepDiveFollowUp("");
    setDeepDiveChatLoading(true);

    const termObj = glossary.find(g => g.term === selectedTerm) || {};
    const contextPrompt = `Regarding the financial term "${selectedTerm}" (defined as: ${termObj.short || ''}). A user is asking this follow-up question: "${query}". Please explain it in simple terms with an Indian/fintech analogy where appropriate. Keep it concise.`;

    const currentThread = deepDiveChatHistory[selectedTerm] || [];
    const updatedUserThread = [...currentThread, { role: "user", content: query }];
    
    setDeepDiveChatHistory(prev => ({
      ...prev,
      [selectedTerm]: updatedUserThread
    }));

    try {
      const apiHistory = currentThread.map(h => ({ role: h.role, content: h.content }));
      const res = await api.post("/learn/chat", {
        message: contextPrompt,
        history: apiHistory,
        lang: audioLang
      });

      if (res.data?.success) {
        setDeepDiveChatHistory(prev => ({
          ...prev,
          [selectedTerm]: [...updatedUserThread, { role: "assistant", content: res.data.reply }]
        }));
      } else {
        setDeepDiveChatHistory(prev => ({
          ...prev,
          [selectedTerm]: [...updatedUserThread, { role: "assistant", content: "FinGuru is temporarily offline. Please try again!" }]
        }));
      }
    } catch (e) {
      console.error("Error in glossary follow-up:", e);
      const offlineReply = `Regarding "${selectedTerm}": ${query}\n\n* **Response**: Great question! In financial practice, this concept helps you leverage assets and balance risks. For example, it operates like a safety reserve or growth booster depending on how you allocate your funds.`;
      setDeepDiveChatHistory(prev => ({
        ...prev,
        [selectedTerm]: [...updatedUserThread, { role: "assistant", content: offlineReply }]
      }));
    } finally {
      setDeepDiveChatLoading(false);
    }
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
        setExplanation(
          `Unable to load AI definition for "${term}". Please try again!`
        );
      }
    } catch (e) {
      console.error("Error fetching term explanation:", e);
      const termObj = glossary.find(
        (g) => g.term.toLowerCase() === term.toLowerCase()
      );
      if (termObj) {
        setExplanation(
          `### 💡 ${termObj.term} (${termObj.category})\n\n${termObj.desc}\n\n* **Easy Analog**: Storing gold laddoos in a secured digital container instead of paying a heavy safety bank locker price!`
        );
      } else {
        setExplanation(
          `### 💡 ${term}\n\nThis represents a key asset class or financial concept. Investing in it builds compound interest over time!\n\n* **Key Advantage**: Helps diversify risk and tap growth metrics.`
        );
      }
    } finally {
      setExplaining(false);
    }
  };

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

  // Active flashcards helper
  const activeCard = useMemo(() => {
    return filteredGlossary[studyProgressIndex] || filteredGlossary[0] || null;
  }, [filteredGlossary, studyProgressIndex]);

  return (
                  <div className="space-y-4">
                

                {/* Glossary Header Stats */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-sm">📖</div>
                    <div>
                      <h3 className="text-sm font-black text-white">Financial Glossary</h3>
                      <p className="text-[9px] text-slate-400 font-mono">
                        <span className="text-cyan-400 font-black">{filteredGlossary.length}</span> of <span className="text-slate-300 font-bold">{glossary.length}</span> terms
                        {glossaryCategoryFilter !== "All" && <span className="text-amber-400 ml-1">• Filtered: {glossaryCategoryFilter}</span>}
                      </p>
                    </div>
                  </div>
                  {glossaryCategoryFilter !== "All" && (
                    <button
                      onClick={() => setGlossaryCategoryFilter("All")}
                      className="text-[9px] font-bold text-slate-400 hover:text-white border border-white/10 px-2.5 py-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                    >
                      ✕ Clear Category Filter
                    </button>
                  )}
                </div>

                {/* SRS Quick-Study Swipe Deck */}
                {dueTerms.length > 0 && (
                  <div className="p-5 bg-gradient-to-br from-[#1a1c24] to-[#12141a] rounded-3xl border border-amber-500/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-left relative overflow-hidden group">
                    {/* Background glows */}
                    <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/15 transition-all"></div>
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <h4 className="text-xs font-black text-amber-400 uppercase font-mono tracking-wider">
                          SRS Quick-Study Queue ({dueTerms.length} due today)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Spaced Repetition Active
                      </span>
                    </div>

                    {/* Card container */}
                    {(() => {
                      const activeReviewTerm = dueTerms[0];
                      const enrichment = getGlossaryEnrichment(activeReviewTerm.term);
                      
                      return (
                        <div className="min-h-36 flex flex-col justify-between">
                          {/* Inner Card */}
                          {/* Interactive 3D Flip Card Container */}
                          <div 
                            className="perspective-1000 w-full h-60 cursor-pointer"
                            onClick={() => setSrsCardFlipped(!srsCardFlipped)}
                          >
                            <div 
                              className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform ${
                                srsCardFlipped ? "rotate-y-180" : ""
                              }`}
                            >
                              {/* Card Front */}
                              <div className="absolute w-full h-full backface-hidden bg-black/20 hover:bg-black/30 border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center text-center shadow-2xl">
                                <div className="space-y-3">
                                  <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-slate-400 uppercase font-mono font-bold tracking-wider">
                                    Category: {activeReviewTerm.category}
                                  </span>
                                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                                    {activeReviewTerm.term}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); speakTerm(activeReviewTerm.term, activeReviewTerm.short); }}
                                      className="text-xs p-1 hover:bg-white/10 rounded transition text-slate-400 hover:text-white cursor-pointer"
                                      title="Speak Pronunciation"
                                    >
                                      🔊
                                    </button>
                                  </h3>
                                  <p className="text-[10px] text-amber-400/80 font-mono animate-pulse">
                                    Click card to flip 🔄
                                  </p>
                                </div>
                              </div>

                              {/* Card Back */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-black/35 border border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-2xl text-left overflow-y-auto">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[8px] text-cyan-400 font-extrabold uppercase font-mono tracking-wider block">
                                      Definition
                                    </span>
                                    <p className="text-slate-200 text-xs font-bold leading-relaxed">
                                      {activeReviewTerm.short}
                                    </p>
                                  </div>
                                  
                                  {enrichment?.memoryHook && (
                                    <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[11px] text-amber-250 font-medium font-serif leading-relaxed italic relative">
                                      <span className="text-[8px] text-amber-400 font-extrabold uppercase font-mono tracking-wider block not-italic mb-1">
                                        💡 Tanglish Mnemonic
                                      </span>
                                      "{enrichment.memoryHook}"
                                    </div>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-500 text-center font-mono mt-2">
                                  Click card to flip back 🔄
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => handleSRSCardAction(activeReviewTerm.term, false)}
                              className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-mono font-bold text-xs tracking-wider transition cursor-pointer"
                            >
                              ✕ Forgot It
                            </button>
                            <button
                              onClick={() => handleSRSCardAction(activeReviewTerm.term, true)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono font-black text-xs tracking-wider transition shadow-md shadow-emerald-500/10 cursor-pointer"
                            >
                              ✓ Got It
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Retentive Mastery Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
                  {/* Donut Chart */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={glossaryStats.chartData}
                            innerRadius={28}
                            outerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {glossaryStats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-black text-white">{glossaryStats.mastered}</span>
                        <span className="text-[7px] text-slate-400 font-mono uppercase">Mastered</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-left text-[9px] font-mono">
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"/><span>Fresh: {glossaryStats.fresh}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"/><span>Due: {glossaryStats.due}</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"/><span>In Progress</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#334155]"/><span>Not Started</span></div>
                    </div>
                  </div>

                  {/* Streak Heatmap */}
                  <div className="flex flex-col gap-1.5 border border-white/5 bg-slate-900/20 p-3 rounded-2xl text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-mono text-slate-400 font-black">🔥 Study Heatmap</span>
                      <span className="text-[9px] text-cyan-400 font-mono font-black animate-pulse">🔥 {currentStreak} Days</span>
                    </div>
                    <div className="grid grid-flow-col grid-cols-12 grid-rows-7 gap-1 w-fit mx-auto pt-0.5">
                      {heatmapDays.map((day, idx) => {
                        let intensityColor = "bg-slate-800";
                        if (day.count > 0) {
                          if (day.count === 1) intensityColor = "bg-emerald-950 border border-emerald-900/30 text-emerald-400";
                          else if (day.count === 2) intensityColor = "bg-emerald-700/60";
                          else intensityColor = "bg-emerald-450 text-black";
                        }
                        return (
                          <div
                            key={idx}
                            title={`${day.label}: ${day.count} activities`}
                            className={`w-2 h-2 rounded-[1.5px] transition ${intensityColor}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[7px] text-slate-500 font-mono mt-0.5">
                      <span>84 Days Ago</span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Categories & Weak Areas */}
                  <div className="space-y-2.5 text-left flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-mono text-slate-400 font-black block font-bold">Weak Categories (&lt;30%)</span>
                      {glossaryStats.weakAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {glossaryStats.weakAreas.map(wa => (
                            <span key={wa.category} className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] rounded font-black uppercase font-mono">
                              ⚠️ {wa.category} ({wa.percentage}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[8px] text-emerald-400 font-black font-mono mt-1">🎉 No Weak Areas! All categories &gt;30%</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase">Top Categories</span>
                      {glossaryStats.categoryBreakdown.slice(0, 2).map(cb => (
                        <div key={cb.category} className="space-y-0.5">
                          <div className="flex justify-between text-[8px] font-mono text-slate-400 font-bold">
                            <span>{cb.category}</span>
                            <span>{cb.mastered}/{cb.total} ({cb.percentage}%)</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                            <div className="h-full bg-cyan-400" style={{ width: `${cb.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toolbar Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-black/30 p-2.5 rounded-2xl border border-white/5">
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {[
                      { id: "grid", label: "Glossary Grid", icon: "📖" },
                      { id: "vocab", label: "Vocab Builder", icon: "🔓" },
                      { id: "flashcards", label: "Study Flashcards", icon: "🔄" },
                      { id: "compare", label: "Side-by-Side Compare", icon: "⚖️" },
                      { id: "notebook", label: "Saved Notebook", icon: "📓" },
                      { id: "challenge", label: "Daily Challenge", icon: "🏆" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setGlossaryMode(m.id);
                          if (m.id === "challenge" && dailyChallengeQuestions.length === 0) {
                            generateDailyChallenge();
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          glossaryMode === m.id
                            ? "bg-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Favorites Toggle */}
                    {["grid", "vocab"].includes(glossaryMode) && (
                      <button
                        onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                          showBookmarksOnly
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>⭐</span>
                        <span>Bookmarks Only</span>
                      </button>
                    )}

                    {/* Difficulty Dropdown */}
                    {["grid", "vocab", "flashcards"].includes(glossaryMode) && (
                      <select
                        value={glossaryDifficultyFilter}
                        onChange={(e) => setGlossaryDifficultyFilter(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 font-bold outline-none focus:border-cyan-500"
                      >
                        <option value="All">All Levels</option>
                        <option value="Beginner">Beginner 🟢</option>
                        <option value="Intermediate">Intermediate 🟡</option>
                        <option value="Advanced">Advanced 🔴</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Active Lesson Recommendations (Visible only in Grid View) */}
                {["grid", "vocab"].includes(glossaryMode) && activeLesson && lessonGlossaryMapping[activeLesson.id] && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-2xl border border-cyan-500/20 space-y-2 text-left">
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>📌 Recommended for Active Lesson:</span>
                      <span className="text-white font-extrabold bg-cyan-500/20 px-2 py-0.5 rounded-full text-[9px] uppercase">
                        {activeLesson.title}
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {glossary
                        .filter((item) =>
                          lessonGlossaryMapping[activeLesson.id].includes(
                            item.term,
                          )
                        )
                        .map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleExplainTerm(item.term)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                              selectedTerm === item.term
                                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                                : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="truncate">{item.term}</span>
                              <span className="text-[8px] text-cyan-400 shrink-0">
                                💡
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-normal mt-1 truncate">
                              {item.short}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Category Filter Pills (Visible in Grid and Flashcard modes) */}
                {["grid", "vocab", "flashcards"].includes(glossaryMode) && (
                  <div className="flex gap-1.5 flex-wrap">
                    {["All", "Review Due", "Banking", "Stocks", "Trading", "Derivatives", "Crypto", "Macro", "Forex", "Insurance", "Valuation", "Investing", "Planning", "Mutual Fund", "Income", "Debt", "Commodity", "Global"].map((cat) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const count = cat === "All"
                        ? glossary.length
                        : cat === "Review Due"
                          ? glossary.filter(g => masteredTerms.includes(g.term) && srsSchedule[g.term]?.nextReviewDate <= todayStr).length
                          : glossary.filter(g => g.category === cat).length;
                      if (count === 0) return null;
                      const catColors = {
                        "All": "from-white/10 to-white/5 border-white/10 text-white",
                        "Review Due": "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse",
                        "Banking": "from-blue-500/15 to-blue-600/5 border-blue-500/20 text-blue-300",
                        "Stocks": "from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-300",
                        "Trading": "from-amber-500/15 to-amber-600/5 border-amber-500/20 text-amber-300",
                        "Derivatives": "from-purple-500/15 to-purple-600/5 border-purple-500/20 text-purple-300",
                        "Crypto": "from-orange-500/15 to-orange-600/5 border-orange-500/20 text-orange-300",
                        "Macro": "from-red-500/15 to-red-600/5 border-red-500/20 text-red-300",
                        "Forex": "from-teal-500/15 to-teal-600/5 border-teal-500/20 text-teal-300",
                        "Insurance": "from-pink-500/15 to-pink-600/5 border-pink-500/20 text-pink-300",
                        "Valuation": "from-violet-500/15 to-violet-600/5 border-violet-500/20 text-violet-300",
                        "Investing": "from-cyan-500/15 to-cyan-600/5 border-cyan-500/20 text-cyan-300",
                        "Planning": "from-lime-500/15 to-lime-600/5 border-lime-500/20 text-lime-300",
                        "Mutual Fund": "from-indigo-500/15 to-indigo-600/5 border-indigo-500/20 text-indigo-300",
                        "Income": "from-yellow-500/15 to-yellow-600/5 border-yellow-500/20 text-yellow-300",
                        "Debt": "from-slate-500/15 to-slate-600/5 border-slate-500/20 text-slate-300",
                        "Commodity": "from-rose-500/15 to-rose-600/5 border-rose-500/20 text-rose-300",
                        "Global": "from-sky-500/15 to-sky-600/5 border-sky-500/20 text-sky-300",
                      };
                      const isActive = glossaryCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => { setGlossaryCategoryFilter(cat); setSearchTerm(""); }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all duration-200 bg-gradient-to-r ${catColors[cat] || catColors["All"]} ${
                            isActive
                              ? "opacity-100 shadow-[0_0_12px_rgba(6,182,212,0.2)] scale-105"
                              : "opacity-60 hover:opacity-90"
                          }`}
                        >
                          {cat}
                          <span className="bg-black/20 px-1 py-0.5 rounded text-[8px] font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Alphabetical Jump A-Z Bar (Visible in Grid and Flashcard modes) */}
                {["grid", "vocab", "flashcards"].includes(glossaryMode) && (
                  <div className="bg-black/20 p-2 rounded-2xl border border-white/5 space-y-1.5 text-left">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono px-1">Alphabetical Jump Filter</p>
                    <div className="flex gap-1 overflow-x-auto pr-1 pb-1 scrollbar-thin">
                      {["All", ...("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")), "#"].map((letter) => {
                        const count = glossary.filter((g) => {
                          const matchesCategory = glossaryCategoryFilter === "All" || g.category === glossaryCategoryFilter;
                          const firstChar = g.term.trim().charAt(0).toUpperCase();
                          const isLetter = /^[A-Z]$/.test(firstChar);
                          const matchesLetter = letter === "All" || (letter === "#" ? !isLetter : firstChar === letter);
                          const matchesDifficulty = glossaryDifficultyFilter === "All" || getTermDifficulty(g) === glossaryDifficultyFilter;
                          const matchesBookmark = glossaryMode !== "grid" || !showBookmarksOnly || bookmarkedTerms.includes(g.term);
                          return matchesCategory && matchesLetter && matchesDifficulty && matchesBookmark;
                        }).length;

                        const isActive = glossaryLetterFilter === letter;
                        const isDisabled = count === 0;

                        return (
                          <button
                            key={letter}
                            disabled={isDisabled && !isActive}
                            onClick={() => setGlossaryLetterFilter(letter)}
                            className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-tight shrink-0 transition-all ${
                              isActive
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                                : isDisabled
                                ? "text-slate-750 cursor-not-allowed opacity-30 border border-transparent"
                                : "text-slate-400 hover:text-white border border-white/5 hover:bg-white/5"
                            }`}
                          >
                            {letter}
                            {!isDisabled && <span className="text-[7px] text-slate-500 font-normal ml-0.5 font-mono">({count})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid Mode Rendering */}
                {["grid", "vocab"].includes(glossaryMode) && (
                  <div className="space-y-4">
                    {/* Vocab Mode Header Card */}
                    {glossaryMode === "vocab" && (() => {
                      const completedIds = user?.lessonsCompleted || [];
                      const unfinished = ACADEMY_LESSONS.filter(l => !completedIds.includes(l.id)).slice(0, 3);
                      if (unfinished.length === 0) {
                        return (
                          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-left animate-fade-in">
                            <h4 className="text-emerald-400 font-extrabold text-sm">🎓 Academy Fully Completed!</h4>
                            <p className="text-xs text-slate-300 mt-1">You have mastered all modules! Review any term from the glossary below.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="bg-gradient-to-r from-violet-500/15 to-cyan-500/10 p-4 rounded-2xl border border-violet-500/20 text-left space-y-2 animate-fade-in">
                          <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono">
                            ⚡ Vocabulary Builder (Next 3 Lessons)
                          </p>
                          <p className="text-xs text-slate-350">
                            Preview the terms for your upcoming lessons to unlock full comprehension:
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {unfinished.map((l, idx) => (
                              <span key={l.id} className="text-[10px] bg-black/45 px-2.5 py-1 rounded-xl border border-white/5 text-slate-300 font-bold">
                                {idx + 1}. {l.emoji} {l.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={`Search ${glossaryCategoryFilter === "All" ? "all terms" : glossaryCategoryFilter + " terms"}... e.g. P/E, NAV, repo rate, option`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-dark py-3 text-xs"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        🔍
                      </span>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Terms Grid */}
                    <div key={`${glossaryCategoryFilter}-${glossaryLetterFilter}-${searchTerm}`} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                      {filteredGlossary.length === 0 ? (
                        <div className="col-span-2 text-center py-10 text-slate-500 text-sm bg-white/2 rounded-2xl border border-white/5">
                          <div className="text-3xl mb-2">🔎</div>
                          <p className="font-bold">No terms found for "<span className="text-white">{searchTerm}</span>"</p>
                          <p className="text-xs mt-1">Try a different keyword or clear the active letters/filters</p>
                        </div>
                      ) : filteredGlossary.map((item, idx) => {
                        const diff = getTermDifficulty(item);
                        const catBadgeColor = {
                          "Banking": "bg-blue-500/15 text-blue-300 border-blue-500/20",
                          "Stocks": "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
                          "Trading": "bg-amber-500/15 text-amber-300 border-amber-500/20",
                          "Derivatives": "bg-purple-500/15 text-purple-300 border-purple-500/20",
                          "Crypto": "bg-orange-500/15 text-orange-300 border-orange-500/20",
                          "Macro": "bg-red-500/15 text-red-300 border-red-500/20",
                          "Forex": "bg-teal-500/15 text-teal-300 border-teal-500/20",
                          "Insurance": "bg-pink-500/15 text-pink-300 border-pink-500/20",
                          "Valuation": "bg-violet-500/15 text-violet-300 border-violet-500/20",
                          "Investing": "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
                          "Planning": "bg-lime-500/15 text-lime-300 border-lime-500/20",
                          "Mutual Fund": "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
                          "Income": "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
                          "Debt": "bg-slate-500/15 text-slate-300 border-slate-500/20",
                          "Commodity": "bg-rose-500/15 text-rose-300 border-rose-500/20",
                          "Global": "bg-sky-500/15 text-sky-300 border-sky-500/20",
                        }[item.category] || "bg-white/5 text-slate-400 border-white/5";

                        const difficultyColors = {
                          "Beginner": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          "Intermediate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          "Advanced": "bg-rose-500/10 text-rose-400 border-rose-500/20",
                        }[diff] || "bg-white/5 text-slate-300 border-white/5";

                        const isStarred = bookmarkedTerms.includes(item.term);
                        const isMastered = masteredTerms.includes(item.term);
                        const accentShadow = catAccents[item.category] || "rgba(255,255,255,0.05)";

                        const enrichment = getGlossaryEnrichment(item.term);
                        const isLiked = likedTerms.includes(item.term);
                        const finalLikesCount = enrichment.likes + (isLiked ? 1 : 0);

                        return (
                          <div
                            key={idx}
                            onClick={() => handleExplainTerm(item.term)}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group animate-fadeInUp ${
                              selectedTerm === item.term
                                ? "border-cyan-400 bg-cyan-400/5"
                                : "border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5"
                            }`}
                            style={{
                              animationDelay: `${Math.min(idx * 0.015, 0.4)}s`,
                              boxShadow: selectedTerm === item.term ? `0 0 15px ${accentShadow}` : "none"
                            }}
                            onMouseEnter={(e) => {
                              if (selectedTerm !== item.term) {
                                e.currentTarget.style.boxShadow = `0 0 12px ${accentShadow}`;
                                const regex = new RegExp("[\\d\\.]+\\)$");
                                e.currentTarget.style.borderColor = accentShadow.replace(regex, '0.4)');
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedTerm !== item.term) {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold text-sm text-white leading-tight flex items-center gap-1.5">
                                {item.term}
                                {isMastered && <span className="text-[10px] text-emerald-400 font-bold" title="Mastered">✓</span>}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isMastered && (() => {
                                  const todayStr = new Date().toISOString().split('T')[0];
                                  const sched = srsSchedule[item.term];
                                  if (!sched) return <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-black">🟢 Mastered</span>;
                                  if (sched.nextReviewDate < todayStr) {
                                    return <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-black animate-pulse" title="Overdue review">🔴 Overdue</span>;
                                  } else if (sched.nextReviewDate === todayStr) {
                                    return <span className="text-[8px] bg-amber-500/10 text-amber-450 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-black animate-pulse" title="Review due today">🟡 Due</span>;
                                  } else {
                                    const t1 = new Date(todayStr);
                                    const t2 = new Date(sched.nextReviewDate);
                                    const diffDays = Math.ceil((t2 - t1) / (1000 * 60 * 60 * 24));
                                    return <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-semibold" title={`Next review in ${diffDays} days`}>🟢 Fresh (${diffDays}d)</span>;
                                  }
                                })()}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(item.term);
                                  }}
                                  className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-[10px] text-slate-400 hover:text-amber-400 transition cursor-pointer"
                                >
                                  {isStarred ? "⭐" : "☆"}
                                </button>
                                <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded border ${catBadgeColor}`}>
                                  {item.category}
                                </span>
                                <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded border ${difficultyColors}`}>
                                  {diff}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                              {item.short}
                            </p>
                            <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap justify-between items-center gap-2">
                              <span className="text-[9px] text-slate-500 font-medium">
                                📍 <span className="font-bold text-slate-400">Used in:</span> {enrichment.usedIn}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLikeTerm(item.term);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                                  isLiked
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold"
                                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                                }`}
                              >
                                <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                                <span>{finalLikesCount}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Study Flashcards Mode Rendering */}
                {glossaryMode === "flashcards" && (
                  <div className="space-y-4 max-w-xl mx-auto py-2">
                    {filteredGlossary.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm bg-white/2 rounded-2xl border border-white/5">
                        <div className="text-3xl mb-2">📇</div>
                        <p className="font-bold text-white">No terms match your current filters</p>
                        <p className="text-xs mt-1">Try switching categories or levels to load flashcards</p>
                      </div>
                    ) : (() => {
                      const validIndex = Math.min(studyProgressIndex, filteredGlossary.length - 1);
                      const activeCard = filteredGlossary[validIndex] || filteredGlossary[0];
                      if (!activeCard) return null;
                      
                      const totalCount = filteredGlossary.length;
                      const isMastered = masteredTerms.includes(activeCard.term);
                      const diff = getTermDifficulty(activeCard);
                      const difficultyColors = {
                        "Beginner": "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                        "Intermediate": "bg-amber-500/10 text-amber-300 border-amber-500/20",
                        "Advanced": "bg-rose-500/10 text-rose-300 border-rose-500/20"
                      }[diff] || "bg-white/5 text-slate-300 border-white/5";

                      const masteredCount = filteredGlossary.filter(item => masteredTerms.includes(item.term)).length;
                      const masteryPct = Math.round((masteredCount / totalCount) * 100);

                      return (
                        <div className="space-y-4">
                          {/* Stats Bar */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Card {validIndex + 1} of {totalCount}</span>
                            <span>Mastery: {masteredCount}/{totalCount} ({masteryPct}%)</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${((validIndex + 1) / totalCount) * 100}%` }}
                            />
                          </div>

                          {/* Interactive 3D Flip Card Container */}
                          <div 
                            className="perspective-1000 w-full h-64 cursor-pointer"
                            onClick={() => setIsCardFlipped(!isCardFlipped)}
                          >
                            <div 
                              className={`relative w-full h-full duration-500 transform-style-preserve-3d transition-transform ${
                                isCardFlipped ? "rotate-y-180" : ""
                              }`}
                            >
                              {/* Card Front */}
                              <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] uppercase font-black tracking-wider bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                                    {activeCard.category}
                                  </span>
                                  <span className={`text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded border ${difficultyColors}`}>
                                    {diff}
                                  </span>
                                </div>
                                
                                <div className="text-center py-6">
                                  <h3 className="text-2xl font-black text-white tracking-tight leading-none">
                                    {activeCard.term}
                                  </h3>
                                  <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest animate-pulse">
                                    Click card to flip 🔄
                                  </p>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                  <span>⭐ Bookmarked: {bookmarkedTerms.includes(activeCard.term) ? "Yes" : "No"}</span>
                                  <span>🎓 Mastered: {isMastered ? "Yes ✅" : "No"}</span>
                                </div>
                              </div>

                              {/* Card Back */}
                              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-slate-950 to-black border border-cyan-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl text-left">
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] text-slate-500 font-mono uppercase">Definition</span>
                                  <div className="flex gap-1.5">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); speakTerm(activeCard.term, activeCard.short); }}
                                      className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-xs transition"
                                      title="Audio Pronunciation"
                                    >
                                      🔊
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); toggleBookmark(activeCard.term); }}
                                      className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-xs transition"
                                    >
                                      {bookmarkedTerms.includes(activeCard.term) ? "⭐" : "☆"}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 py-2 overflow-y-auto max-h-[120px] scrollbar-thin">
                                  <p className="text-xs text-white font-extrabold">{activeCard.short}</p>
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{activeCard.desc}</p>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExplainTerm(activeCard.term);
                                    }}
                                    className="text-[10px] font-bold text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-xl bg-cyan-950/15 hover:bg-cyan-950/30 transition-all"
                                  >
                                    AI Deep Dive 💡
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Deck Controllers */}
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                              onClick={() => {
                                setIsCardFlipped(false);
                                setStudyProgressIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
                              }}
                              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold py-2.5 rounded-xl transition"
                            >
                              ⏮️ Previous
                            </button>
                            <button
                              onClick={() => setIsCardFlipped(!isCardFlipped)}
                              className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-black px-5 py-2.5 rounded-xl transition"
                            >
                              🔄 Flip
                            </button>
                            <button
                              onClick={() => {
                                setIsCardFlipped(false);
                                setStudyProgressIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
                              }}
                              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold py-2.5 rounded-xl transition"
                            >
                              Next ⏭️
                            </button>
                          </div>

                          {/* Study Status Card Actions */}
                          <div className="flex items-center justify-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
                            <button
                              onClick={() => toggleMastered(activeCard.term)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                isMastered
                                  ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                  : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                              }`}
                            >
                              <span>{isMastered ? "✅ Mastered" : "📖 Mark Mastered (+5 🪙)"}</span>
                            </button>
                            <button
                              onClick={() => {
                                setGlossary((prev) => {
                                  const shuffled = [...prev];
                                  for (let i = shuffled.length - 1; i > 0; i--) {
                                    const j = Math.floor(Math.random() * (i + 1));
                                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                                  }
                                  toast("Glossary deck shuffled! 🔀", { icon: "🔀" });
                                  return shuffled;
                                });
                                setStudyProgressIndex(0);
                                setIsCardFlipped(false);
                              }}
                              className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 px-4 py-2 rounded-xl text-xs font-bold transition"
                            >
                              🔀 Shuffle Deck
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Comparison Mode Rendering */}
                {glossaryMode === "compare" && (
                  <div className="space-y-5 py-2">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-5 rounded-3xl border border-white/10 space-y-4">
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>⚖️ Side-by-Side Financial Compare</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Contrast Metrics</span>
                      </h3>
                      
                      {/* Dropdown selectors */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Select Term A:</label>
                          <select
                            value={comparisonTermA}
                            onChange={(e) => setComparisonTermA(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                          >
                            <option value="">-- Choose first term --</option>
                            {glossary.map((g) => (
                              <option key={g.term} value={g.term}>{g.term} ({g.category})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Select Term B:</label>
                          <select
                            value={comparisonTermB}
                            onChange={(e) => setComparisonTermB(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                          >
                            <option value="">-- Choose second term --</option>
                            {glossary.map((g) => (
                              <option key={g.term} value={g.term}>{g.term} ({g.category})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Preset Common Pairs */}
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Popular Comparisons:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { a: "Mutual Fund", b: "Gold ETF", label: "Mutual Fund vs Gold ETF" },
                            { a: "P/E Ratio", b: "NAV (Net Asset Value)", label: "P/E vs NAV" },
                            { a: "Govt Bonds", b: "SGB Gold", label: "Govt Bonds vs SGB Gold" },
                            { a: "Foreign Stocks", b: "Gold ETF", label: "Foreign Stocks vs Gold ETF" }
                          ].map((pair, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setComparisonTermA(pair.a);
                                setComparisonTermB(pair.b);
                              }}
                              className="text-[10px] bg-white/5 border border-white/5 text-slate-300 px-2.5 py-1 rounded-lg hover:bg-white/10 hover:border-white/10 transition"
                            >
                              {pair.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Side-by-side rendering */}
                    {comparisonTermA && comparisonTermB ? (() => {
                      const itemA = glossary.find(g => g.term === comparisonTermA);
                      const itemB = glossary.find(g => g.term === comparisonTermB);
                      if (!itemA || !itemB) return null;

                      const diffA = getTermDifficulty(itemA);
                      const diffB = getTermDifficulty(itemB);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          {/* Card A */}
                          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full filter blur-xl" />
                            <div className="flex justify-between items-center relative z-10">
                              <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                                {itemA.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Difficulty: {diffA}</span>
                            </div>
                            <h4 className="text-lg font-black text-white relative z-10 leading-none">{itemA.term}</h4>
                            <p className="text-xs text-white font-extrabold pt-1 relative z-10">{itemA.short}</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed relative z-10">{itemA.desc}</p>
                            <button
                              onClick={() => handleExplainTerm(itemA.term)}
                              className="text-[10px] text-cyan-400 font-bold hover:underline"
                            >
                              Ask Mentor for Detailed Explanation 💡
                            </button>
                          </div>

                          {/* Card B */}
                          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden text-left">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full filter blur-xl" />
                            <div className="flex justify-between items-center relative z-10">
                              <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
                                {itemB.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Difficulty: {diffB}</span>
                            </div>
                            <h4 className="text-lg font-black text-white relative z-10 leading-none">{itemB.term}</h4>
                            <p className="text-xs text-white font-extrabold pt-1 relative z-10">{itemB.short}</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed relative z-10">{itemB.desc}</p>
                            <button
                              onClick={() => handleExplainTerm(itemB.term)}
                              className="text-[10px] text-cyan-400 font-bold hover:underline"
                            >
                              Ask Mentor for Detailed Explanation 💡
                            </button>
                          </div>

                          {/* Summary Contrast Block */}
                          <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-cyan-950/10 to-indigo-950/10 p-5 rounded-2xl border border-cyan-500/20 text-center space-y-2">
                            <h5 className="text-xs font-black text-cyan-300 uppercase tracking-widest font-mono">Key Takeaway Contrast</h5>
                            <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                              While <strong className="text-white">{itemA.term}</strong> deals primarily with <span className="text-cyan-400 font-semibold">{itemA.category}</span> concepts ({itemA.short.toLowerCase()}), <strong className="text-white">{itemB.term}</strong> focuses on <span className="text-indigo-400 font-semibold">{itemB.category}</span> issues ({itemB.short.toLowerCase()}). 
                              {itemA.category === itemB.category 
                                ? " Since both are in the same asset class, they represent different instruments or valuation metrics that you should use in tandem to optimize your portfolio allocation." 
                                : " Because they represent entirely different asset domains, diversifying your capital across both can reduce overall correlation and protect your downside risk."}
                            </p>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="text-center py-12 text-slate-500 text-sm bg-white/2 rounded-2xl border border-white/5">
                        <div className="text-3xl mb-2.5">⚖️</div>
                        <p className="font-bold text-white">Select two terms to begin comparison</p>
                        <p className="text-xs mt-1">Choose terms from the dropdown selectors or click popular pairs above</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Saved Notebook Mode Rendering */}
                {glossaryMode === "notebook" && (
                  <div className="space-y-4 py-2 text-left">
                    <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                          <span>📓 My Financial Study Notebook</span>
                          <span className="bg-cyan-500/20 text-cyan-400 text-[9px] px-2 py-0.5 rounded-full font-mono">
                            {savedNotes.length} Saved Items
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Edit, add custom notes, and export your personal workbook offline.</p>
                      </div>
                      <button
                        onClick={exportNotes}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      >
                        <span>📂 Export Notes (.TXT)</span>
                      </button>
                    </div>

                    {savedNotes.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 text-sm bg-white/2 rounded-2xl border border-white/5">
                        <div className="text-3xl mb-2">📓</div>
                        <p className="font-bold text-white">Your study notebook is currently empty</p>
                        <p className="text-xs mt-1">To add notes, deep dive into any glossary term and click "Add to Notes"</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {savedNotes.map((note) => (
                          <div key={note.term} className="bg-slate-950 border border-white/5 p-5 rounded-2xl relative overflow-hidden space-y-3 text-left">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full filter blur-xl" />
                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <h4 className="text-sm font-black text-white leading-tight">{note.term}</h4>
                                <p className="text-[9px] text-slate-500 font-mono">Saved on {note.date}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteNote(note.term)}
                                className="w-6 h-6 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 text-[10px] transition"
                                title="Delete note"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 relative z-10">
                              <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
                            </div>

                            {/* Custom Notes Section */}
                            <div className="space-y-1.5 relative z-10">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">My Custom Notes & Observations:</span>
                              {editingNoteTerm === note.term ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    className="w-full bg-black/60 border border-cyan-500/40 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 placeholder-slate-600 font-sans"
                                    rows="3"
                                    placeholder="Type custom commentaries, real-life examples, or personal reminders about this term..."
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => setEditingNoteTerm(null)}
                                      className="text-[10px] text-slate-400 hover:text-white px-2.5 py-1 rounded"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveNoteCommentary(note.term, editingNoteText)}
                                      className="text-[10px] bg-cyan-500 text-black font-extrabold px-3 py-1 rounded-lg"
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 flex justify-between items-center gap-3">
                                  <p className="text-xs text-slate-300 italic">
                                    {note.userNotes ? note.userNotes : "No custom notes added yet. Add observations to help you memorize."}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setEditingNoteTerm(note.term);
                                      setEditingNoteText(note.userNotes || "");
                                    }}
                                    className="text-[10px] text-cyan-400 font-bold hover:underline shrink-0"
                                  >
                                    📝 Edit Notes
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Daily Challenge Quiz Mode Rendering */}
                {glossaryMode === "challenge" && (
                  <div className="space-y-4 max-w-xl mx-auto py-2 text-left">
                    {dailyChallengeQuestions.length === 0 ? (
                      <div className="text-center py-12 bg-white/2 rounded-2xl border border-white/5 space-y-4">
                        <div className="text-4xl">🏆</div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-white">Daily 3-Question Glossary Challenge</h3>
                          <p className="text-xs text-slate-400">Test your finance vocabulary knowledge and win up to +50 coins!</p>
                        </div>
                        <button
                          onClick={generateDailyChallenge}
                          className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black px-5 py-2.5 rounded-xl transition shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        >
                          Start Challenge 🚀
                        </button>
                      </div>
                    ) : (() => {
                      const totalSteps = dailyChallengeQuestions.length;
                      
                      if (showDailyChallengeResults) {
                        const score = dailyChallengeAnswers.reduce((acc, ans, idx) => {
                          return ans === dailyChallengeQuestions[idx].correctIndex ? acc + 1 : acc;
                        }, 0);

                        return (
                          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-white/10 text-center space-y-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl animate-pulse" />
                            <div className="text-5xl">🏆</div>
                            <div className="space-y-1 relative z-10">
                              <h3 className="text-lg font-black text-white">Daily Challenge Completed!</h3>
                              <p className="text-xs text-slate-400 font-mono">Results & Performance Breakdown</p>
                            </div>

                            <div className="inline-block bg-black/40 border border-white/5 px-6 py-4 rounded-3xl relative z-10">
                              <div className="text-3xl font-black text-cyan-400">{score} / {totalSteps}</div>
                              <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 font-bold">Questions Correct</p>
                            </div>

                            {score === 3 ? (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl max-w-sm mx-auto text-emerald-400 text-xs font-extrabold relative z-10">
                                🎉 Perfect Score! You unlocked the maximum rewards of +50 Demat Coins!
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                Get all 3 questions correct to earn the bonus +50 Demat Coins. You can retry the challenge anytime!
                              </p>
                            )}

                            {/* Answer details */}
                            <div className="space-y-2.5 text-left relative z-10 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                              {dailyChallengeQuestions.map((q, idx) => {
                                const userAns = dailyChallengeAnswers[idx];
                                const isCorrect = userAns === q.correctIndex;
                                return (
                                  <div key={idx} className="bg-black/30 border border-white/5 p-3.5 rounded-xl space-y-1 text-left">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-extrabold text-white">{idx + 1}. Term: {q.term}</span>
                                      <span className={isCorrect ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                        {isCorrect ? "✓ Correct" : "✕ Incorrect"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                      <strong>Correct Definition:</strong> {q.options[q.correctIndex]}
                                    </p>
                                    {!isCorrect && (
                                      <p className="text-[10px] text-red-400/80 leading-normal">
                                        <strong>Your Answer:</strong> {q.options[userAns] || "Unanswered"}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-center gap-3 relative z-10">
                              <button
                                onClick={generateDailyChallenge}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-black px-4 py-2.5 rounded-xl transition"
                              >
                                🔄 Try Another Quiz
                              </button>
                              <button
                                onClick={() => setGlossaryMode("grid")}
                                className="bg-cyan-500 text-black text-xs font-black px-5 py-2.5 rounded-xl transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              >
                                Back to Glossary Grid
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const activeQ = dailyChallengeQuestions[dailyChallengeStep];
                      const selectedOption = dailyChallengeAnswers[dailyChallengeStep];
                      const isAnswered = selectedOption !== null;

                      return (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-white/10 space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                            <span>Question {dailyChallengeStep + 1} of {totalSteps}</span>
                            <span>Target Reward: +50 Coins 🪙</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-cyan-400 transition-all duration-300"
                              style={{ width: `${((dailyChallengeStep + 1) / totalSteps) * 100}%` }}
                            />
                          </div>

                          <div className="space-y-3.5 py-2 text-left">
                            <h4 className="text-sm font-black text-white tracking-tight">{activeQ.question}</h4>
                            
                            {/* Options grid */}
                            <div key={dailyChallengeStep} className="grid grid-cols-1 gap-2.5">
                              {activeQ.options.map((option, idx) => {
                                let btnStyle = "bg-white/2 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10";
                                
                                if (isAnswered) {
                                  if (idx === activeQ.correctIndex) {
                                    btnStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                                  } else if (idx === selectedOption) {
                                    btnStyle = "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]";
                                  } else {
                                    btnStyle = "bg-white/2 border-white/5 text-slate-600 opacity-40";
                                  }
                                }

                                return (
                                  <button
                                    key={idx}
                                    disabled={isAnswered}
                                    onClick={() => handleDailyChallengeAnswerSelect(idx)}
                                    className={`p-3.5 rounded-xl border text-left text-xs leading-normal transition-all duration-200 ${btnStyle}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Action Footer */}
                          {isAnswered && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={handleNextChallengeStep}
                                className="bg-cyan-500 text-black text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              >
                                {dailyChallengeStep < 2 ? "Next Question →" : "View Final Results 📊"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Deep Dive Explanation Panel Upgrade */}
                {selectedTerm && glossaryMode !== "challenge" && (() => {
                  const termObj = glossary.find((g) => g.term === selectedTerm);
                  if (!termObj) return null;

                  const diff = getTermDifficulty(termObj);
                  const diffBadgeColor = {
                    "Beginner": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    "Intermediate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    "Advanced": "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  }[diff] || "bg-white/5 text-slate-300 border-white/5";

                  const isStarred = bookmarkedTerms.includes(selectedTerm);
                  const isSavedInNotes = savedNotes.some(n => n.term === selectedTerm);

                  const relatedTerms = glossary
                    .filter((g) => g.category === termObj.category && g.term !== selectedTerm)
                    .slice(0, 3);

                  const termLower = selectedTerm.toLowerCase();
                  const showSipCalc = termLower.includes("sip") || termLower.includes("mutual fund") || termLower.includes("investing");
                  const showInflationCalc = termLower.includes("inflation") || termLower.includes("purchasing power");
                  const showRule72Calc = termLower.includes("72") || termLower.includes("double");
                  const showCagrCalc = termLower.includes("cagr") || termLower.includes("compound annual");
                  const showCiCalc = termLower.includes("compound interest") || termLower.includes("interest rate") || termLower.includes("bonds");

                  const localChatHistory = deepDiveChatHistory[selectedTerm] || [];

                  return (
                    <div className="card border-cyan-500/30 bg-cyan-950/10 p-5 rounded-2xl animate-fade-in relative overflow-hidden text-left space-y-4">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl" />
                      
                      {/* Header Info */}
                      <div className="border-b border-white/5 pb-3 flex flex-wrap justify-between items-center gap-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-cyan-400 text-sm">
                            💡 Deep Dive: {selectedTerm}
                          </h4>
                          <span className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded border ${diffBadgeColor}`}>
                            {diff}
                          </span>
                          <span className="text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                            {termObj.category}
                          </span>
                        </div>

                        {/* Action controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => speakTerm(termObj.term, termObj.short)}
                            className="text-[9px] font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg transition-all"
                            title="Listen Pronunciation"
                          >
                            🔊 Pronounce
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Term: ${termObj.term}\nCategory: ${termObj.category} (${diff})\nDefinition: ${termObj.short}\n\nAI Explanation:\n${explanation}`
                              );
                              toast("Copied glossary details to clipboard! 📋", { icon: "📋" });
                            }}
                            className="text-[9px] font-bold text-slate-400 hover:text-white bg-white/5 border border-white/5 px-2 py-1 rounded-lg transition-all"
                          >
                            📋 Copy
                          </button>

                          <button
                            onClick={() => handleSaveToNotes(termObj.term, termObj.desc || termObj.short)}
                            className={`text-[9px] font-bold px-2 py-1 rounded-lg transition-all border ${
                              isSavedInNotes 
                                ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            {isSavedInNotes ? "📓 Saved in Notes" : "📓 Add to Notes"}
                          </button>

                          <button
                            onClick={() => toggleBookmark(termObj.term)}
                            className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 text-[10px] text-slate-400 hover:text-amber-400 flex items-center justify-center transition"
                          >
                            {isStarred ? "⭐" : "☆"}
                          </button>
                        </div>
                      </div>

                      {/* Basic definition */}
                      <div className="space-y-1 relative z-10 text-xs">
                        <p className="text-white font-extrabold">{termObj.short}</p>
                        <p className="text-slate-400 leading-relaxed font-normal">{termObj.desc}</p>
                      </div>

                      {GLOSSARY_FORMULAS[selectedTerm] && (
                        <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 relative z-10 text-xs space-y-2 text-left">
                          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block font-mono">🧮 Mathematical Formula / Mechanism</span>
                          <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-white flex flex-col items-center justify-center gap-1.5 overflow-x-auto text-center py-4">
                            <div className="text-sm font-extrabold tracking-wide text-cyan-300">
                              {GLOSSARY_FORMULAS[selectedTerm].notation}
                            </div>
                            <div className="text-[10px] text-slate-400 italic font-sans max-w-md mt-1 text-center">
                              {GLOSSARY_FORMULAS[selectedTerm].explanation}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enriched properties */}
                      {(() => {
                        const enrichment = getGlossaryEnrichment(selectedTerm);
                        const isLiked = likedTerms.includes(selectedTerm);
                        const finalLikesCount = enrichment.likes + (isLiked ? 1 : 0);
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10 text-xs mt-2">
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">📍 Used In</span>
                                <p className="text-white font-semibold">{enrichment.usedIn}</p>
                              </div>
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">📊 Connected Field</span>
                                <p className="text-white font-semibold">{enrichment.fieldUsed}</p>
                              </div>
                              <div className="bg-black/20 p-3 border border-white/5 rounded-xl flex justify-between items-center text-left">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">❤️ Likes</span>
                                  <p className="text-white font-semibold">{finalLikesCount} likes</p>
                                </div>
                                <button
                                  onClick={() => toggleLikeTerm(termObj.term)}
                                  className={`flex items-center justify-center p-2 rounded-xl transition-all border cursor-pointer ${
                                    isLiked
                                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current animate-pulse" : ""}`} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 relative z-10 text-xs space-y-1 text-left">
                              <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block font-mono">💡 Concrete Example</span>
                              <p className="text-amber-200/90 leading-relaxed font-medium">{enrichment.example}</p>
                            </div>

                            {enrichment.memoryHook && (
                              <div className="bg-pink-500/5 p-3 rounded-xl border border-pink-500/20 relative z-10 text-xs space-y-1 text-left">
                                <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider block font-mono">🧠 Memory Mnemonic</span>
                                <p className="text-pink-200/95 leading-relaxed font-medium">{enrichment.memoryHook}</p>
                              </div>
                            )}

                            {enrichment.confusedWith && (
                              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 relative z-10 text-xs space-y-2 text-left">
                                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider block font-mono">⚠️ Confusion Buster</span>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <p className="text-rose-250 leading-relaxed font-medium">Often confused with: <strong className="text-white">{enrichment.confusedWith}</strong></p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setComparisonModalTermA(selectedTerm);
                                      setComparisonModalTermB(enrichment.confusedWith);
                                      setShowComparisonModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer"
                                  >
                                    Compare Side-by-Side ⚔️
                                  </button>
                                </div>
                              </div>
                            )}

                            {enrichment.relatedTerms && enrichment.relatedTerms.length > 0 && (
                              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 relative z-10 text-xs space-y-2 text-left">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block font-mono">🕸️ Related Terms Relationship</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {enrichment.relatedTerms.map(rt => (
                                    <button
                                      key={rt}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExplainTerm(rt);
                                      }}
                                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 text-[9px] text-slate-300 rounded-lg font-bold transition-all hover:scale-105 cursor-pointer"
                                    >
                                      {rt} →
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Feature 4: Lesson-Linked Glossary Reverse Navigation */}
                            {(() => {
                              const coveredLessons = ACADEMY_LESSONS.filter(l => {
                                const terms = lessonGlossaryMapping[l.id] || [];
                                return terms.includes(selectedTerm);
                              });
                              if (coveredLessons.length === 0) return null;
                              return (
                                <div className="bg-violet-500/10 p-3 rounded-xl border border-violet-500/20 relative z-10 text-xs space-y-2 text-left animate-fade-in">
                                  <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wider block font-mono">📚 Covered in Academy Lessons</span>
                                  <div className="flex flex-wrap gap-2">
                                    {coveredLessons.map(lesson => (
                                      <button
                                        key={lesson.id}
                                        onClick={() => {
                                          if (lesson.subTab === "architect") {
                                            setActiveSubTab("architect");
                                            setActiveLesson(lesson);
                                            toast(`Loaded Lesson: ${lesson.title}! 📚`, { icon: "🎓" });
                                          } else {
                                            navigate(`/learn/lab?lessonId=${lesson.id}&lang=${audioLang}`);
                                          }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 transition-all hover:scale-105 cursor-pointer"
                                      >
                                        <span>{lesson.emoji}</span>
                                        <span>{lesson.title}</span>
                                        <span className="text-[8px] bg-violet-500/30 text-white px-1.5 py-0.5 rounded-full font-bold">Study →</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}

                      {/* AI Explanation block */}
                      <div className="space-y-2 relative z-10">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">FinGuru AI Explanation</p>
                        {explaining ? (
                          <div className="flex items-center gap-3 text-slate-400 text-xs py-2 bg-black/25 p-4 rounded-xl border border-white/5">
                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            FinGuru is tailoring a friendly explanation for you...
                          </div>
                        ) : (
                          <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-line bg-black/25 p-4 rounded-2xl border border-white/5 relative z-10 text-left">
                            {explanation}
                          </div>
                        )}
                      </div>

                      {/* Math Simulators */}
                      {(showSipCalc || showInflationCalc || showRule72Calc || showCagrCalc || showCiCalc) && (
                        <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-4 rounded-2xl border border-white/5 space-y-3 relative z-10 text-left">
                          <h5 className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <span>🧮 Interactive Concept Simulator:</span>
                            <span className="text-white font-bold bg-cyan-500/20 px-2 py-0.5 rounded-full text-[8px]">ACTIVE</span>
                          </h5>

                          {/* SIP */}
                          {showSipCalc && (() => {
                            const monthlyRate = sipRate / 12 / 100;
                            const months = sipYears * 12;
                            const invested = sipMonthly * months;
                            const maturity = monthlyRate > 0 
                              ? Math.round(sipMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
                              : invested;
                            const gains = maturity - invested;

                            return (
                              <div className="space-y-3 text-xs">
                                <p className="text-[10px] text-slate-400 font-medium">See how compounding builds wealth in a regular Mutual Fund via SIP:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Monthly Contribution:</span>
                                    <span className="text-white font-bold">₹{sipMonthly.toLocaleString()}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="500"
                                    max="50000"
                                    step="500"
                                    value={sipMonthly}
                                    onChange={(e) => setSipMonthly(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Expected Annual Return %:</span>
                                    <span className="text-white font-bold">{sipRate}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="5"
                                    max="25"
                                    step="1"
                                    value={sipRate}
                                    onChange={(e) => setSipRate(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Time Horizon (Years):</span>
                                    <span className="text-white font-bold">{sipYears} years</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={sipYears}
                                    onChange={(e) => setSipYears(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 text-center mt-1">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Total Saved</span>
                                    <span className="text-[10px] text-slate-300 font-extrabold">₹{invested.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Estimated Gains</span>
                                    <span className="text-[10px] text-emerald-400 font-extrabold">₹{gains.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Maturity Value</span>
                                    <span className="text-[10px] text-cyan-400 font-extrabold">₹{maturity.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Inflation */}
                          {showInflationCalc && (() => {
                            const futureCost = Math.round(infAmount * Math.pow(1 + infRate / 100, infYears));
                            const purchasingPower = Math.round(infAmount / Math.pow(1 + infRate / 100, infYears));

                            return (
                              <div className="space-y-3 text-xs">
                                <p className="text-[10px] text-slate-400 font-medium">See how inflation eats away your currency purchasing power over time:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Initial Amount:</span>
                                    <span className="text-white font-bold">₹{infAmount.toLocaleString()}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1000"
                                    max="100000"
                                    step="1000"
                                    value={infAmount}
                                    onChange={(e) => setInfAmount(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Inflation Rate % p.a.:</span>
                                    <span className="text-white font-bold">{infRate}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="15"
                                    step="0.5"
                                    value={infRate}
                                    onChange={(e) => setInfRate(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Years:</span>
                                    <span className="text-white font-bold">{infYears} years</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={infYears}
                                    onChange={(e) => setInfYears(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 text-center mt-1">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Future Cost of Same Goods</span>
                                    <span className="text-[10px] text-rose-400 font-extrabold">₹{futureCost.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Equivalent Value in {infYears}y</span>
                                    <span className="text-[10px] text-amber-400 font-extrabold">₹{purchasingPower.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Rule of 72 */}
                          {showRule72Calc && (() => {
                            const doubleYears = r72Rate > 0 ? (72 / r72Rate).toFixed(1) : 0;

                            return (
                              <div className="space-y-3 text-xs">
                                <p className="text-[10px] text-slate-400 font-medium">Calculate how fast your money will double at a given annual interest return:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Annual Return / Interest %:</span>
                                    <span className="text-white font-bold">{r72Rate}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="2"
                                    max="36"
                                    step="0.5"
                                    value={r72Rate}
                                    onChange={(e) => setR72Rate(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center mt-1">
                                  <p className="text-[11px] text-slate-350">
                                    At <strong className="text-white">{r72Rate}%</strong> interest, your investments will double in approximately <strong className="text-cyan-400 text-sm ml-1">{doubleYears} years</strong>!
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* CAGR */}
                          {showCagrCalc && (() => {
                            const cagr = cagrInitial > 0 && cagrFinal > 0 && cagrYears > 0
                              ? ((Math.pow(cagrFinal / cagrInitial, 1 / cagrYears) - 1) * 100).toFixed(2)
                              : 0;

                            return (
                              <div className="space-y-3 text-xs">
                                <p className="text-[10px] text-slate-400 font-medium">Calculate the Compounded Annual Growth Rate of your investment values:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Initial Investment:</span>
                                    <span className="text-white font-bold">₹{cagrInitial.toLocaleString()}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1000"
                                    max="100000"
                                    step="1000"
                                    value={cagrInitial}
                                    onChange={(e) => setCagrInitial(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Final Portfolio Value:</span>
                                    <span className="text-white font-bold">₹{cagrFinal.toLocaleString()}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="5000"
                                    max="500000"
                                    step="5000"
                                    value={cagrFinal}
                                    onChange={(e) => setCagrFinal(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Investment Duration (Years):</span>
                                    <span className="text-white font-bold">{cagrYears} years</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="15"
                                    step="1"
                                    value={cagrYears}
                                    onChange={(e) => setCagrYears(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center mt-1">
                                  <span className="text-[8px] text-slate-500 uppercase font-mono block">Compound Annual Growth Rate (CAGR)</span>
                                  <span className="text-lg font-black text-cyan-400">{cagr}%</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Compound Interest */}
                          {showCiCalc && (() => {
                            const compoundTotal = Math.round(ciPrincipal * Math.pow(1 + ciRate / 100, ciYears));
                            const compoundInterestGained = compoundTotal - ciPrincipal;

                            return (
                              <div className="space-y-3 text-xs">
                                <p className="text-[10px] text-slate-400 font-medium">Observe how compound interest gains grow exponentially over time:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Principal Deposit:</span>
                                    <span className="text-white font-bold">₹{ciPrincipal.toLocaleString()}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1000"
                                    max="200000"
                                    step="5000"
                                    value={ciPrincipal}
                                    onChange={(e) => setCiPrincipal(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Annual Return / Interest %:</span>
                                    <span className="text-white font-bold">{ciRate}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    step="0.5"
                                    value={ciRate}
                                    onChange={(e) => setCiRate(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />

                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Compounding Period (Years):</span>
                                    <span className="text-white font-bold">{ciYears} years</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={ciYears}
                                    onChange={(e) => setCiYears(parseInt(e.target.value))}
                                    className="w-full accent-cyan-400"
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5 text-center mt-1">
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Principal</span>
                                    <span className="text-[10px] text-slate-300 font-extrabold">₹{ciPrincipal.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Interest Gained</span>
                                    <span className="text-[10px] text-emerald-400 font-extrabold">₹{compoundInterestGained.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-500 uppercase font-mono block">Future Value</span>
                                    <span className="text-[10px] text-cyan-400 font-extrabold">₹{compoundTotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Direct AI Follow-up */}
                      <div className="bg-black/25 p-4 rounded-2xl border border-white/5 space-y-3 relative z-10 text-xs">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Ask Follow-up Questions</p>
                        
                        {localChatHistory.length > 0 && (
                          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin border-b border-white/5 pb-2 mb-2">
                            {localChatHistory.map((chat, idx) => (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                                  chat.role === "user" 
                                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 ml-6 text-right" 
                                    : "bg-white/5 border border-white/5 text-slate-300 mr-6 text-left"
                                }`}
                              >
                                <strong>{chat.role === "user" ? "You: " : "FinGuru: "}</strong>
                                <span className="whitespace-pre-line">{chat.content}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={deepDiveFollowUp}
                            onChange={(e) => setDeepDiveFollowUp(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !deepDiveChatLoading) {
                                handleGlossaryFollowUp();
                              }
                            }}
                            placeholder={`Ask follow-up e.g. "What is an Indian analogy for this?"`}
                            className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white outline-none focus:border-cyan-500"
                            disabled={deepDiveChatLoading}
                          />
                          <button
                            onClick={handleGlossaryFollowUp}
                            disabled={deepDiveChatLoading || !deepDiveFollowUp.trim()}
                            className="bg-cyan-400 hover:bg-cyan-300 text-black text-[11px] font-black px-4 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deepDiveChatLoading ? "Asking..." : "Send"}
                          </button>
                        </div>
                      </div>

                      {/* Related Terms chips */}
                      {relatedTerms.length > 0 && (
                        <div className="space-y-1.5 relative z-10">
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono">Related Concepts</p>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedTerms.map((termItem) => (
                              <button
                                key={termItem.term}
                                onClick={() => handleExplainTerm(termItem.term)}
                                className="text-[9px] bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-xl transition"
                              >
                                {termItem.term} ↗
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
  );
}
