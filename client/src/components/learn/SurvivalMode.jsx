import React, { useState } from "react";
import { DEFAULT_SURVIVAL_ROUNDS } from "../../data/academyData";

export default function SurvivalMode({ api, navigate, audioLang }) {
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
      if (res.data && Array.isArray(res.data.rounds) && res.data.rounds.length === 5) {
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

  return (
    <div className="card space-y-6 relative overflow-hidden border-red-500/10 bg-slate-950 rounded-3xl p-6 shadow-xl border">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full filter blur-2xl" />

      {survivalStep === 0 ? (
        <div className="space-y-4 relative z-10 text-center py-8">
          <span className="text-5xl animate-bounce block">💥</span>
          <h3 className="font-black text-xl text-white">Market Crash Survival Game</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            You start with <strong className="text-white">₹1,00,000</strong> virtual portfolio.
            Survive 5 rounds of high-pressure market volatility. Make the right calls or go bankrupt!
          </p>
          <button
            disabled={loadingSurvival}
            onClick={handleStartSurvival}
            className="btn-primary w-auto px-8 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 cursor-pointer flex items-center justify-center gap-2 mx-auto"
            style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)" }}
          >
            {loadingSurvival ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Dynamic AI Scenarios...</span>
              </>
            ) : (
              <span>🚀 Start Dynamic AI Survival Mode</span>
            )}
          </button>
        </div>
      ) : survivalStep <= 5 ? (() => {
        const currentRound = survivalRounds[survivalStep - 1] || DEFAULT_SURVIVAL_ROUNDS[survivalStep - 1];

        return (
          <div className="space-y-4 relative z-10 font-mono text-xs text-left">
            <div className="flex justify-between items-center text-slate-400">
              <span>Round {survivalStep} of 5</span>
              <span>Portfolio Value: <strong className="text-emerald-400">₹{survivalPortfolio.toLocaleString("en-IN")}</strong></span>
            </div>

            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(survivalStep / 5) * 100}%` }}
              />
            </div>

            <h4 className="font-extrabold text-sm text-white pt-2 leading-relaxed">
              {currentRound.title}
            </h4>
            <p className="text-slate-300 font-sans leading-relaxed">
              {currentRound.desc}
            </p>

            <div key={survivalStep} className="grid grid-cols-1 gap-2 pt-2">
              {currentRound.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const newPortfolio = Math.round(survivalPortfolio * (1 + opt.delta));
                    const logEntry = `Round ${survivalStep}: ${opt.log} (Balance: ₹${newPortfolio.toLocaleString("en-IN")})`;
                    setSurvivalPortfolio(newPortfolio);
                    setSurvivalLog([...survivalLog, logEntry]);
                    setSurvivalStep((prev) => prev + 1);
                  }}
                  className={`p-3 bg-white/5 border border-white/5 hover:border-red-500/30 text-left text-xs text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition duration-200 cursor-pointer lesson-panel-enter lesson-panel-enter-d${(idx % 4) + 1} opacity-0`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        );
      })() : (
        <div className="text-center py-6 space-y-4 animate-fade-in relative z-10 font-mono text-xs">
          <span className="text-5xl block">🎮</span>
          <h3 className="font-black text-2xl text-white">Survival Mode Ended</h3>
          <p className="text-slate-400">
            Final Portfolio Balance: <strong className="text-emerald-400 text-sm">₹{survivalPortfolio.toLocaleString("en-IN")}</strong>
          </p>

          <div className="bg-black/45 border border-white/5 p-4 rounded-2xl max-w-md mx-auto text-left space-y-1.5 max-h-[160px] overflow-y-auto">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block border-b border-white/5 pb-1">SURVIVAL LOGS:</span>
            {survivalLog.map((log, idx) => (
              <p key={idx} className="text-[10px] text-slate-300 leading-normal">
                {log}
              </p>
            ))}
          </div>

          <div className="pt-2">
            {survivalPortfolio >= 120000 ? (
              <p className="text-emerald-400 font-black text-sm">
                🎉 Grade A: Elite Wealth Builder! SIP Master Badge unlocked! 📜
              </p>
            ) : survivalPortfolio >= 95000 ? (
              <p className="text-yellow-400 font-black text-sm">
                🛡️ Grade B: Balanced Risk Manager! Risk Expert Badge unlocked! 🛡️
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 font-black text-sm">
                  💥 Grade F: Liquidated! You went bankrupt or suffered heavy losses.
                </p>
                <p className="text-slate-400 text-[10px]">
                  Recommendation: Revisit <span className="text-violet-400 font-bold underline cursor-pointer" onClick={() => { navigate(`/learn/lab?lessonId=l44&lang=${audioLang}`); }}>Lesson 44 (Leverage Risks)</span> and <span className="text-violet-400 font-bold underline cursor-pointer" onClick={() => { navigate(`/learn/lab?lessonId=l10&lang=${audioLang}`); }}>Lesson 10 (Diversification)</span> to master safety buffer rules.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSurvivalStep(0)}
            className="btn-secondary w-auto px-6 uppercase font-bold text-[10px] cursor-pointer"
          >
            Play Again 🔄
          </button>
        </div>
      )}
    </div>
  );
}
