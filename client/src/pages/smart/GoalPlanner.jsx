// client/src/pages/smart/GoalPlanner.jsx — Institutional Grade Monte Carlo Engine
import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, HelpCircle, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';

const boxMullerRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const SCENARIOS = [
  { id: 'normal', name: 'Normal Compounding', desc: 'Standard historical averages (14% Equity, 7.5% Debt).', icon: '📈' },
  { id: 'covid', name: 'COVID-19 Crash Run', desc: 'Simulates a sudden -30% market correction in Month 12, followed by a post-crash recovery.', icon: '📉' },
  { id: 'inflation', name: 'High Inflation Era', desc: 'Applies 7% p.a. compounding target lift. Focuses on real, inflation-adjusted wealth.', icon: '💸' },
  { id: 'bull', name: 'Extended Bull Run', desc: 'Optimistic high-growth macro regime (22% Equity, 12% Volatility).', icon: '🚀' },
];

export const GoalPlanner = () => {
  const [plannerTab, setPlannerTab] = useState('monte_carlo'); // 'monte_carlo' | 'dp_allocator'
  
  // ── DP Allocator States ──
  const [dpMonthlyBudget, setDpMonthlyBudget] = useState(6000);

  const DP_GOALS = [
    { name: '🎓 Higher Education', target: 300000, deadline: 36, priority: 10 },
    { name: '🚗 Emergency Fund', target: 50000, deadline: 12, priority: 8 },
    { name: '✈️ Vacation Trip', target: 60000, deadline: 24, priority: 4 },
    { name: '💻 Laptop Purchase', target: 40000, deadline: 10, priority: 5 },
  ];

  const calculateDPAllocation = useMemo(() => {
    const step = 500;
    const maxWeight = Math.floor(dpMonthlyBudget / step);
    const n = DP_GOALS.length;
    
    const items = DP_GOALS.map((g, idx) => {
      const requiredMonthly = Math.round(g.target / g.deadline);
      const weight = Math.ceil(requiredMonthly / step);
      return {
        id: idx,
        name: g.name,
        target: g.target,
        deadline: g.deadline,
        requiredMonthly,
        weight,
        value: g.priority
      };
    });

    const dp = Array.from({ length: n + 1 }, () => new Array(maxWeight + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      for (let w = 0; w <= maxWeight; w++) {
        if (item.weight <= w) {
          dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - item.weight] + item.value);
        } else {
          dp[i][w] = dp[i - 1][w];
        }
      }
    }

    const selectedIds = [];
    let w = maxWeight;
    for (let i = n; i > 0; i--) {
      const item = items[i - 1];
      if (dp[i][w] !== dp[i - 1][w]) {
        selectedIds.push(item.id);
        w -= item.weight;
      }
    }

    return {
      items,
      dpTable: dp,
      selectedIds,
      maxWeight,
      step
    };
  }, [dpMonthlyBudget]);

  const [targetAmount, setTargetAmount] = useState(1000000); // Default 10 Lakhs
  const [years, setYears] = useState(3);
  const [lumpsum, setLumpsum] = useState(100000); // 1 Lakh initial
  const [sip, setSip] = useState(15000); // 15k SIP
  const [equityAllocation, setEquityAllocation] = useState(70); // 70% Equity
  const [scenario, setScenario] = useState('normal'); // 'normal' | 'covid' | 'inflation' | 'bull'

  const runSimulation = useMemo(() => {
    const numSimulations = 1000;
    const months = years * 12;
    const dt = 1 / 12;

    // Calibrate assets base returns based on active scenario
    let eqMean = 0.14;
    let eqVol = 0.16;
    let debtMean = 0.075;
    let debtVol = 0.035;
    const correlation = 0.15;

    if (scenario === 'bull') {
      eqMean = 0.22;
      eqVol = 0.12;
      debtMean = 0.065;
    }

    const wEq = equityAllocation / 100;
    const wDebt = 1 - wEq;

    const portMean = wEq * eqMean + wDebt * debtMean;
    const portVol = Math.sqrt(
      Math.pow(wEq * eqVol, 2) +
      Math.pow(wDebt * debtVol, 2) +
      2 * wEq * wDebt * eqVol * debtVol * correlation
    );

    const monthlyReturn = portMean / 12;
    const monthlyVol = portVol / Math.sqrt(12);

    const paths = Array.from({ length: numSimulations }, () => new Array(months + 1));

    for (let sim = 0; sim < numSimulations; sim++) {
      paths[sim][0] = lumpsum;
    }

    for (let m = 1; m <= months; m++) {
      for (let sim = 0; sim < numSimulations; sim++) {
        const prevBal = paths[sim][m - 1];
        let drift = (monthlyReturn - 0.5 * Math.pow(monthlyVol, 2)) * 1;
        const randomShock = monthlyVol * boxMullerRandom();
        
        let crashMultiplier = 1;
        let recoveryAlpha = 0;

        // Apply crash/recovery shock in Covid scenario
        if (scenario === 'covid') {
          if (m === 12) {
            crashMultiplier = 0.70; // -30% Shock
          } else if (m > 12 && m <= 24) {
            recoveryAlpha = 0.08 / 12; // Extra +8% recovery CAGR
          }
        }

        const endBal = (prevBal + sip) * Math.exp(drift + recoveryAlpha + randomShock) * crashMultiplier;
        paths[sim][m] = Math.round(Math.max(0, endBal));
      }
    }

    // Set inflation adjusted goal path
    const getTargetForMonth = (mVal) => {
      if (scenario === 'inflation') {
        return Math.round(targetAmount * Math.pow(1.07, mVal / 12));
      }
      return targetAmount;
    };

    const finalTarget = getTargetForMonth(months);

    const chartData = [];
    for (let m = 0; m <= months; m++) {
      const monthBalances = paths.map(path => path[m]).sort((a, b) => a - b);
      
      const p10 = monthBalances[Math.floor(numSimulations * 0.1)];
      const p50 = monthBalances[Math.floor(numSimulations * 0.5)];
      const p90 = monthBalances[Math.floor(numSimulations * 0.9)];

      const date = new Date();
      date.setMonth(date.getMonth() + m);

      chartData.push({
        month: m,
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        'Worst Case (10th %)': p10,
        'Expected Case (50th %)': p50,
        'Best Case (90th %)': p90,
        'Inflation Goal Line': getTargetForMonth(m)
      });
    }

    const finalBalances = paths.map(path => path[months]);
    const successfulRuns = finalBalances.filter(bal => bal >= finalTarget).length;
    const successProbability = Math.round((successfulRuns / numSimulations) * 100);

    const medianBalance = finalBalances.sort((a, b) => a - b)[Math.floor(numSimulations * 0.5)];
    const worstBalance = finalBalances.sort((a, b) => a - b)[Math.floor(numSimulations * 0.1)];
    const bestBalance = finalBalances.sort((a, b) => a - b)[Math.floor(numSimulations * 0.9)];

    let recommendedSip = sip;
    if (successProbability < 85) {
      const requiredDiff = finalTarget - medianBalance;
      if (requiredDiff > 0) {
        const compoundingFactor = ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn);
        const sipDelta = Math.ceil(requiredDiff / compoundingFactor);
        recommendedSip = sip + Math.max(500, Math.round(sipDelta / 500) * 500);
      }
    }

    return {
      chartData,
      successProbability,
      worstBalance,
      medianBalance,
      bestBalance,
      portMean,
      portVol,
      recommendedSip,
      finalTarget
    };
  }, [targetAmount, years, lumpsum, sip, equityAllocation, scenario]);

  const {
    chartData,
    successProbability,
    worstBalance,
    medianBalance,
    bestBalance,
    portMean,
    portVol,
    recommendedSip,
    finalTarget
  } = runSimulation;

  const getSuccessStatus = () => {
    if (successProbability >= 85) return { text: 'EXCELLENT', color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-500/5', desc: 'Highly likely to reach goal under this macro scenario.' };
    if (successProbability >= 60) return { text: 'MODERATE', color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', desc: 'Acceptable success rate, but subject to market cycles.' };
    return { text: 'INSUFFICIENT', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5', desc: 'High probability of shortfall. Corrective action recommended.' };
  };

  const status = getSuccessStatus();

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Segmented Tab Control */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 max-w-md gap-1">
        <button
          onClick={() => setPlannerTab('monte_carlo')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            plannerTab === 'monte_carlo'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📈 Monte Carlo Simulator
        </button>
        <button
          onClick={() => setPlannerTab('dp_allocator')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            plannerTab === 'dp_allocator'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🧮 Multi-Goal Allocator (DP)
        </button>
      </div>

      {plannerTab === 'monte_carlo' && (
        <div className="space-y-6">
          {/* Macro Scenario Selectors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SCENARIOS.map(sc => (
          <button
            key={sc.id}
            onClick={() => setScenario(sc.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group relative ${
              scenario === sc.id
                ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_4px_20px_rgba(6,182,212,0.15)] scale-102'
                : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xl">{sc.icon}</span>
              {scenario === sc.id && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
            </div>
            <div className="mt-3">
              <h5 className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition-colors">{sc.name}</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{sc.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Success Probability</span>
          <p className={`text-2xl font-black ${status.color}`}>{successProbability}%</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Worst Case (10th %)</span>
          <p className="text-2xl font-black text-red-400">₹{worstBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Expected Case (50th %)</span>
          <p className="text-2xl font-black text-cyan-400">₹{medianBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Best Case (90th %)</span>
          <p className="text-2xl font-black text-green-400">₹{bestBalance.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders Input Control */}
        <div className="lg:col-span-4 card bg-slate-900/60 border border-white/5 p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            ⚙️ Simulator Parameters
          </h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Target Goal Amount</span>
                <span className="text-white font-bold">₹{targetAmount.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="100000"
                max="5000000"
                step="50000"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={targetAmount}
                onChange={e => setTargetAmount(parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Time Horizon</span>
                <span className="text-white font-bold">{years} Years</span>
              </div>
              <input 
                type="range"
                min="1"
                max="10"
                step="1"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={years}
                onChange={e => setYears(parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Initial Lumpsum</span>
                <span className="text-white font-bold">₹{lumpsum.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1000000"
                step="10000"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={lumpsum}
                onChange={e => setLumpsum(parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Monthly SIP</span>
                <span className="text-white font-bold">₹{sip.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="1000"
                max="100000"
                step="1000"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={sip}
                onChange={e => setSip(parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-400">Equity vs. Debt Split</span>
                <span className="text-cyan-400 font-bold">{equityAllocation}% Equity</span>
              </div>
              <input 
                type="range"
                min="10"
                max="90"
                step="5"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={equityAllocation}
                onChange={e => setEquityAllocation(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-semibold">
                <span>10% Equity (Conservative)</span>
                <span>50% Split</span>
                <span>90% Equity (Aggressive)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 space-y-1.5 text-[10px] text-slate-400 font-semibold">
            <div className="flex justify-between"><span>Portfolio Exp. Return (CAGR)</span><span className="text-emerald-400 font-bold">{(portMean * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>Portfolio Expected Volatility</span><span className="text-cyan-400 font-bold">{(portVol * 100).toFixed(1)}%</span></div>
            {scenario === 'inflation' && (
              <div className="flex justify-between text-red-400 font-bold">
                <span>Inflation Target Lift</span>
                <span>+7.0% p.a.</span>
              </div>
            )}
          </div>
        </div>

        {/* Projections & Diagnostics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Projections */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-base">Monte Carlo Probabilistic Projections (1000 Paths)</h4>
              <p className="text-xs text-slate-400 mt-0.5">Adjusted Target Goal final value: <strong className="text-cyan-400">₹{finalTarget.toLocaleString('en-IN')}</strong>.</p>
            </div>

            <div className="h-64 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* Goal Reference Line */}
                  {scenario === 'inflation' ? (
                    <Area 
                      type="monotone" 
                      dataKey="Inflation Goal Line" 
                      stroke="#ef4444" 
                      fill="none" 
                      strokeWidth={2}
                      strokeDasharray="4 4" 
                      name="Inflation Goal Target"
                    />
                  ) : (
                    <ReferenceLine y={targetAmount} stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: `Goal: ₹${targetAmount/100000}L`, position: 'insideTopLeft', fill: '#fb7185', fontSize: 10, fontWeight: 'bold' }} />
                  )}
                  
                  {/* Percentile Bands */}
                  <Area 
                    type="monotone" 
                    dataKey="Best Case (90th %)" 
                    stroke="none"
                    fill="rgba(16, 185, 129, 0.05)" 
                    name="Optimistic Case"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Expected Case (50th %)" 
                    stroke="#06b6d4" 
                    fill="rgba(6, 182, 212, 0.1)" 
                    strokeWidth={2}
                    name="Median Expected Pathway"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Worst Case (10th %)" 
                    stroke="#ef4444" 
                    fill="rgba(239, 68, 68, 0.05)" 
                    strokeWidth={1.5}
                    name="Conservative Case"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Advisory Panel */}
          <div className={`card border p-5 flex items-start gap-4 ${status.bg} ${status.border}`}>
            <div className="text-3xl shrink-0 mt-0.5">
              {successProbability >= 85 ? '🟢' : successProbability >= 60 ? '⚠️' : '🚨'}
            </div>
            <div className="flex-1">
              <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                FINGURU MONTE CARLO DIAGNOSTIC VERDICT: <span className={status.color}>{status.text}</span>
              </h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{status.desc}</p>
              
              {successProbability < 85 && (
                <div className="mt-4 p-3.5 bg-black/30 border border-white/5 rounded-xl space-y-2 animate-fade-in">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">🧠 AI Recommendations to Reach 85%+ Probability:</span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                    <li>
                      Increase your monthly SIP to <strong className="text-cyan-400">₹{recommendedSip.toLocaleString('en-IN')}</strong> (+₹{recommendedSip - sip}/mo) to bridge the compounding gap.
                    </li>
                    <li>
                      Extend your goal timeline by <strong className="text-white">6 to 12 months</strong> to allow volatility to smooth out and give assets more time to compound.
                    </li>
                    {equityAllocation < 80 && (
                      <li>
                        Increase your Equity allocation to <strong className="text-cyan-400">80%</strong>. This raises expected long-term portfolio growth to beat inflation, though it introduces near-term volatility.
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {successProbability >= 85 && (
                <div className="mt-3 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Your financial plan is robust. We recommend keeping this portfolio split and continuing automatic monthly debits.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      )}

      {plannerTab === 'dp_allocator' && (
        <div className="space-y-6 animate-fade-in text-slate-100">
          {/* Explanation Header */}
          <div className="card bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border border-cyan-500/20 p-5 rounded-2xl">
            <h3 className="text-lg font-bold text-cyan-400 mb-1 flex items-center gap-2">
              🧮 Multi-Goal Savings Allocation (DP-Knapsack Engine)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When saving for multiple financial goals, you have finite monthly cash. 
              Instead of dividing money blindly, the <strong>0/1 Knapsack Dynamic Programming</strong> algorithm determines the 
              optimal subset of goals to prioritize and fund fully to minimize missed deadlines and maximize overall goal priority utility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
                <h4 className="font-extrabold text-xs text-cyan-400 uppercase tracking-widest">
                  ⚙️ Budget Allocation
                </h4>
                
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400">Monthly Savings Budget</span>
                    <span className="text-cyan-400 font-bold">₹{dpMonthlyBudget.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <input 
                    type="range"
                    min="2000"
                    max="15000"
                    step="500"
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={dpMonthlyBudget}
                    onChange={e => setDpMonthlyBudget(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                    <span>Min: ₹2,000</span>
                    <span>Max: ₹15,000</span>
                  </div>
                </div>
              </div>

              {/* Goal List Card */}
              <div className="card bg-white/3 border border-white/5 p-5 space-y-3">
                <h4 className="font-bold text-xs text-white uppercase tracking-widest border-b border-white/5 pb-2">
                  Target Financial Goals
                </h4>
                <div className="space-y-3">
                  {calculateDPAllocation.items.map(item => {
                    const isSelected = calculateDPAllocation.selectedIds.includes(item.id);
                    return (
                      <div key={item.id} className={`p-3 rounded-xl border transition ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500/30' 
                          : 'bg-white/3 border-white/5 opacity-60'
                      }`}>
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white">{item.name}</p>
                          <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-300 font-bold">
                            Priority: {item.value}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-slate-400 font-mono">
                          <span>Target: ₹{(item.target/100000).toFixed(1)}L</span>
                          <span>Term: {item.deadline} mos</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Req. Savings:</span>
                          <span className={`font-bold font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                            ₹{item.requiredMonthly.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Results column */}
            <div className="lg:col-span-8 space-y-6">
              {/* DP Allocation Results Card */}
              <div className="card bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                <span className="text-3xl shrink-0">💡</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">AI DP Goal Allocation Verdict</h4>
                  <p className="text-xs text-slate-300">
                    With a budget of <strong>₹{dpMonthlyBudget.toLocaleString('en-IN')}/mo</strong>, the dynamic programming engine fully funds 
                    <strong className="text-cyan-300"> {calculateDPAllocation.selectedIds.length} out of {calculateDPAllocation.items.length} goals</strong>, 
                    maximizing utility score to <strong className="text-cyan-300">{calculateDPAllocation.selectedIds.reduce((sum, id) => sum + calculateDPAllocation.items[id].value, 0)} points</strong>.
                  </p>
                </div>
              </div>

              {/* Dynamic Programming Table Visualizer */}
              <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">Interactive DP Matrix (Goal vs. Budget Increments)</h4>
                  <span className="text-[10px] text-slate-500 font-mono">Steps of ₹500</span>
                </div>

                <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/25">
                  <table className="w-full border-collapse text-left font-mono text-[10px]">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 border-b border-white/5 font-semibold">
                        <th className="p-2.5">Goal (Item)</th>
                        {Array.from({ length: calculateDPAllocation.maxWeight + 1 }).map((_, w) => (
                          <th key={w} className="p-2 text-center min-w-[50px] border-r border-white/5">
                            ₹{w * calculateDPAllocation.step}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {calculateDPAllocation.dpTable.map((row, i) => {
                        const item = i > 0 ? calculateDPAllocation.items[i - 1] : null;
                        return (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                            <td className="p-2.5 font-bold text-slate-300 border-r border-white/5 truncate max-w-[120px]" title={item ? item.name : 'No Goals'}>
                              {item ? item.name.split(' ').slice(1).join(' ') || item.name : '— (Base)'}
                            </td>
                            {row.map((val, w) => {
                              let isPathCell = false;
                              let wt = calculateDPAllocation.maxWeight;
                              for (let k = calculateDPAllocation.items.length; k >= i; k--) {
                                const kItem = k > 0 ? calculateDPAllocation.items[k - 1] : null;
                                if (k === i && wt === w) {
                                  isPathCell = true;
                                }
                                if (k > 0 && calculateDPAllocation.dpTable[k][wt] !== calculateDPAllocation.dpTable[k-1][wt]) {
                                  if (kItem) wt -= kItem.weight;
                                }
                              }

                              return (
                                <td 
                                  key={w} 
                                  className={`p-2 text-center border-r border-white/5 transition-all ${
                                    isPathCell 
                                      ? 'bg-cyan-500/20 text-cyan-300 font-black border-cyan-500/30' 
                                      : 'text-slate-400'
                                  }`}
                                  title={item ? `dp[${i}][₹${w * 500}] = max(dp[${i-1}][₹${w * 500}], dp[${i-1}][₹${(w - item.weight) * 500}] + ${item.value})` : 'Base Case: value is 0'}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4 items-center text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-500/40" />
                    <span>Backtracking path cell (optimal choice trace)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
