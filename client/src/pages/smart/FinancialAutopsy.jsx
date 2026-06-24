// client/src/pages/smart/FinancialAutopsy.jsx — Premium AI Opportunity Cost Autopsy
import React, { useState } from 'react';
import { HelpCircle, Brain, Target, AlertTriangle, TrendingDown, DollarSign, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BENCHMARKS = [
  { id: 'nifty', name: 'Nifty 50 (Indian Equities)', cagr: 14, icon: '🇮🇳' },
  { id: 'sp500', name: 'S&P 500 (US Equities)', cagr: 11, icon: '🇺🇸' },
  { id: 'gold', name: 'Gold (Safe Haven)', cagr: 9.5, icon: '🪙' },
  { id: 'btc', name: 'Bitcoin (High Volatility)', cagr: 35, icon: '₿' },
];

export const FinancialAutopsy = () => {
  const [decisionName, setDecisionName] = useState('Holding excessive cash savings');
  const [principal, setPrincipal] = useState(500000); // 5 Lakhs
  const [actualFinal, setActualFinal] = useState(550000); // 5.5 Lakhs
  const [years, setYears] = useState(3);
  const [rationale, setRationale] = useState('I was too scared of the stock market crash in 2021, so I decided to keep my money in liquid savings, waiting for a major dip that never came.');
  const [benchmarkId, setBenchmarkId] = useState('nifty');

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Compute opportunity cost calculations
  const analysis = React.useMemo(() => {
    const p = parseFloat(principal) || 0;
    const f = parseFloat(actualFinal) || 0;
    const y = parseFloat(years) || 1;

    const actualCagr = p > 0 ? (Math.pow(f / p, 1 / y) - 1) * 100 : 0;
    const bench = BENCHMARKS.find(b => b.id === benchmarkId) || BENCHMARKS[0];
    const benchCagr = bench.cagr;

    // Calculate benchmark ending balance
    const benchFinal = p * Math.pow(1 + benchCagr / 100, y);
    const opportunityCost = Math.max(0, benchFinal - f);

    // Dead Capital Score (0 to 100)
    const totalPotentialAppreciation = benchFinal - p;
    const deadCapitalScore = totalPotentialAppreciation > 0 
      ? Math.min(100, Math.round((opportunityCost / totalPotentialAppreciation) * 100))
      : 0;

    // Generate timeline data for the chart
    const chartData = [];
    for (let i = 0; i <= y; i++) {
      const actVal = p * Math.pow(1 + actualCagr / 100, i);
      const benchVal = p * Math.pow(1 + benchCagr / 100, i);
      chartData.push({
        name: `Year ${i}`,
        'Your Actual Path': Math.round(actVal),
        'Alternative Benchmark': Math.round(benchVal)
      });
    }

    // Future growth projections of the opportunity cost at 12% p.a.
    const growthRate = 0.12;
    const projection5Y = opportunityCost * Math.pow(1 + growthRate, 5);
    const projection10Y = opportunityCost * Math.pow(1 + growthRate, 10);
    const projection15Y = opportunityCost * Math.pow(1 + growthRate, 15);

    return {
      actualCagr: actualCagr.toFixed(2),
      benchCagr: benchCagr.toFixed(2),
      benchFinal: Math.round(benchFinal),
      opportunityCost: Math.round(opportunityCost),
      deadCapitalScore,
      chartData,
      projections: {
        y5: Math.round(projection5Y),
        y10: Math.round(projection10Y),
        y15: Math.round(projection15Y)
      }
    };
  }, [principal, actualFinal, years, benchmarkId]);

  const { actualCagr, benchCagr, benchFinal, opportunityCost, deadCapitalScore, chartData, projections } = analysis;

  const handleForensicAutopsy = async () => {
    setLoading(true);
    setAiAnalysis(null);
    try {
      const { data } = await api.post('/smart/autopsy', {
        decisionName,
        principal,
        actualFinal,
        years,
        rationale,
        benchmarkName: BENCHMARKS.find(b => b.id === benchmarkId)?.name || 'Benchmark',
        opportunityCost,
        deadCapitalScore
      });

      if (data.success) {
        setAiAnalysis(data.result);
      } else {
        toast.error('Forensic analysis failed.');
      }
    } catch {
      toast.error('Failed to run autopsy. Make sure server is active.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-medium">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Pane */}
        <div className="lg:col-span-5 card bg-slate-900/60 border border-white/5 p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            🧠 Log Financial Decision
          </h4>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Decision Title</label>
              <input 
                type="text" 
                value={decisionName}
                onChange={e => setDecisionName(e.target.value)}
                placeholder="e.g. Buying a second house/Holding cash..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Capital Investment (₹)</label>
                <input 
                  type="number" 
                  value={principal}
                  onChange={e => setPrincipal(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Actual Final Value (₹)</label>
                <input 
                  type="number" 
                  value={actualFinal}
                  onChange={e => setActualFinal(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Duration (Years)</label>
                <input 
                  type="number" 
                  min="1"
                  max="10"
                  value={years}
                  onChange={e => setYears(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Missed Benchmark</label>
                <select 
                  value={benchmarkId}
                  onChange={e => setBenchmarkId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {BENCHMARKS.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900">{b.name} ({b.cagr}%)</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Your Emotional Rationale / Motivation</label>
              <textarea 
                rows="3"
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                placeholder="Explain the mental model or feeling behind this choice..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium resize-none"
              />
            </div>

            <button 
              onClick={handleForensicAutopsy}
              disabled={loading || !rationale}
              className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Performing Forensic Audit...' : '🧠 Run Forensic Autopsy'}
            </button>
          </div>
        </div>

        {/* Right Output Pane */}
        <div className="lg:col-span-7 space-y-6">
          {/* Opportunity Cost Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card bg-white/3 border border-white/5 p-4 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Your CAGR</span>
              <p className="text-xl font-black text-rose-400">{actualCagr}%</p>
            </div>
            <div className="card bg-white/3 border border-white/5 p-4 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Opportunity Cost</span>
              <p className="text-xl font-black text-red-500">₹{opportunityCost.toLocaleString('en-IN')}</p>
            </div>
            <div className="card bg-white/3 border border-white/5 p-4 text-center relative overflow-hidden">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Dead Capital index</span>
              <p className="text-xl font-black text-yellow-400">{deadCapitalScore}%</p>
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-500/10" style={{ width: `${deadCapitalScore}%` }} />
            </div>
          </div>

          {/* Chart Comparison */}
          <div className="card bg-white/3 border border-white/5 p-4 space-y-3">
            <div>
              <h5 className="font-bold text-xs text-white">Compound Path Divergence Analysis</h5>
              <p className="text-[10px] text-slate-400">Compares actual capital accumulation against benchmark compound return.</p>
            </div>
            <div className="h-44 w-full text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={24} iconType="circle" />
                  <Line type="monotone" dataKey="Your Actual Path" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Alternative Benchmark" stroke="#06b6d4" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Premium upgrades: Future Compounding Re-investment Plan & Bias Radar */}
          {aiAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bias radar progress bars */}
              <div className="card bg-slate-900/40 border border-white/5 p-4 space-y-3 font-semibold text-xs">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">🧠 Cognitive Bias Intensity</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span>Loss Aversion</span>
                      <span>{aiAnalysis.lossAversionScore || 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${aiAnalysis.lossAversionScore || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span>Fear of Missing Out (FOMO)</span>
                      <span>{aiAnalysis.fomoScore || 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${aiAnalysis.fomoScore || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span>Status Quo / Inertia</span>
                      <span>{aiAnalysis.statusQuoScore || 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${aiAnalysis.statusQuoScore || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5 text-[10px]">
                      <span>Recency Bias</span>
                      <span>{aiAnalysis.recencyScore || 0}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${aiAnalysis.recencyScore || 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Future compounding project */}
              <div className="card bg-slate-900/40 border border-white/5 p-4 space-y-2.5">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                  <ArrowUpRight size={13} /> Recovery Compounding projection
                </span>
                <p className="text-[10px] text-slate-400 leading-snug">
                  If you deploy the opportunity cost of <strong>₹{opportunityCost.toLocaleString('en-IN')}</strong> today into a 12% p.a. index portfolio:
                </p>
                <div className="space-y-1.5 text-[11px] font-bold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">In 5 Years:</span>
                    <span className="text-emerald-400">₹{projections.y5.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">In 10 Years:</span>
                    <span className="text-cyan-400">₹{projections.y10.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">In 15 Years:</span>
                    <span className="text-purple-400">₹{projections.y15.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Behavioral Audit Response */}
          {aiAnalysis ? (
            <div className="card bg-gradient-to-br from-violet-950/20 to-purple-950/20 border border-violet-500/30 p-5 space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <Brain className="text-purple-400 h-6 w-6" />
                <div>
                  <h5 className="font-black text-sm text-white">PSYCHOLOGICAL FORENSIC REPORT</h5>
                  <p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold font-black">Primary Cognitive Bias: {aiAnalysis.cognitiveBias}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div>
                  <strong className="text-white block mb-1">🔍 Forensic Breakdown:</strong>
                  <p>{aiAnalysis.diagnosis}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-red-400 block mb-1">Emotional Pitfall Triggered</span>
                    <span className="font-bold text-white text-xs">{aiAnalysis.emotionalTrigger}</span>
                  </div>
                  <div className="p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-xl">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-cyan-400 block mb-1">Long-term Opportunity Cost</span>
                    <span className="font-bold text-cyan-300 text-xs">₹{opportunityCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <strong className="text-emerald-400 block mb-1.5">✅ Actionable Debiasing Strategy:</strong>
                  <p className="italic">"{aiAnalysis.debiasAction}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-white/2 border border-white/5 p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2 min-h-36">
              <Brain size={24} className="opacity-40 animate-pulse text-purple-400" />
              <span>Fill in your emotional reason and trigger the Autopsy to generate your AI Behavioral Forensic Report.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
