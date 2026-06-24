// client/src/pages/smart/FIREAutopilot.jsx — Premium FIRE Engine
import React, { useState, useMemo } from 'react';
import { Target, AlertTriangle, ShieldCheck, Flame, Compass, Landmark, Settings } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'lean', name: 'Lean FIRE', desc: 'Minimalist post-retirement lifestyle (75% expenses).', multiplier: 0.75, icon: '⛺' },
  { id: 'fat', name: 'Fat FIRE', desc: 'Abundant / luxury retirement lifestyle (150% expenses).', multiplier: 1.5, icon: '🏰' },
  { id: 'coast', name: 'Coast FIRE', desc: 'Stop saving now. Let current capital compound till retirement.', multiplier: 1.0, icon: '🏄' },
  { id: 'barista', name: 'Barista FIRE', desc: 'Retire but do part-time/consulting work to offset expenses.', multiplier: 1.0, icon: '☕' },
];

export const FIREAutopilot = () => {
  const [currentAge, setCurrentAge] = useState(30);
  const [targetAge, setTargetAge] = useState(45);
  const [currentNestEgg, setCurrentNestEgg] = useState(1500000); // 15 Lakhs
  const [monthlySavings, setMonthlySavings] = useState(40000); // 40k/mo
  const [postExpenses, setPostExpenses] = useState(50000); // 50k/mo current value
  const [fireMode, setFireMode] = useState('lean');
  const [swrPercent, setSwrPercent] = useState(4); // 4% SWR
  
  const [activePolicy, setActivePolicy] = useState('constant_real'); // constant_real | fixed_pct | guardrail

  // Box-Muller random shock generator
  const nextRandomNormal = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  // Simulation engine function
  const runPolicySim = (policy) => {
    const numTrials = 100;
    const accumulationYears = targetAge - currentAge;
    const retirementYears = 40; 
    const totalYears = accumulationYears + retirementYears;
    
    const inflation = 0.06; 
    const expectedReturn = 0.10; 
    const volatility = 0.12; 
    
    const activeModeObj = MODES.find(m => m.id === fireMode) || MODES[0];
    let adjustedExpenses = postExpenses * activeModeObj.multiplier;
    const baristaOffset = fireMode === 'barista' ? 20000 : 0;
    const activeSavings = fireMode === 'coast' ? 0 : monthlySavings;

    const paths = Array.from({ length: numTrials }, () => new Array(totalYears + 1));
    
    for (let t = 0; t < numTrials; t++) {
      paths[t][0] = currentNestEgg;
    }

    for (let y = 1; y <= totalYears; y++) {
      for (let t = 0; t < numTrials; t++) {
        const prevBal = paths[t][y - 1];
        if (prevBal <= 0) {
          paths[t][y] = 0;
          continue;
        }

        const shock = volatility * nextRandomNormal();
        const annualReturn = expectedReturn + shock;
        let nextBal = prevBal;

        if (y <= accumulationYears) {
          // Accumulation
          const annualSavingsInjected = activeSavings * 12;
          nextBal = (prevBal + annualSavingsInjected) * (1 + annualReturn);
        } else {
          // Withdrawal Phase
          const yearsInRetirement = y - accumulationYears;
          const nominalBaseExpenses = adjustedExpenses * 12 * Math.pow(1 + inflation, yearsInRetirement - 1);
          let withdrawAmount = nominalBaseExpenses;

          if (policy === 'fixed_pct') {
            // Fixed % of remaining assets (e.g. 4% of current balance)
            withdrawAmount = prevBal * (swrPercent / 100);
          } else if (policy === 'guardrail') {
            // Guyton-Klinger simple rules: adjust down if withdrawal rate hits +20% target
            const currentWr = nominalBaseExpenses / prevBal;
            const targetWr = swrPercent / 100;
            if (currentWr > targetWr * 1.2) {
              withdrawAmount = nominalBaseExpenses * 0.9;
            } else if (currentWr < targetWr * 0.8) {
              withdrawAmount = nominalBaseExpenses * 1.1;
            }
          }

          const offsetExpenses = Math.max(0, withdrawAmount - (baristaOffset * 12 * Math.pow(1 + inflation, yearsInRetirement - 1)));
          nextBal = prevBal * (1 + annualReturn) - offsetExpenses;
        }
        paths[t][y] = Math.max(0, Math.round(nextBal));
      }
    }

    const finalYearBalances = paths.map(path => path[totalYears]);
    const solventTrials = finalYearBalances.filter(bal => bal > 0).length;
    const successRate = Math.round((solventTrials / numTrials) * 100);
    const medianEndBalance = finalYearBalances.sort((a, b) => a - b)[Math.floor(numTrials * 0.5)];
    const medianRetirementNestEgg = paths.map(p => p[accumulationYears]).sort((a, b) => a - b)[Math.floor(numTrials * 0.5)];

    return {
      paths,
      successRate,
      medianEndBalance,
      medianRetirementNestEgg,
      targetFIREGoal: (adjustedExpenses * 12) / (swrPercent / 100),
      accumulationYears
    };
  };

  const simulation = useMemo(() => {
    // Run active policy simulation
    const activeResults = runPolicySim(activePolicy);

    // Run others for comparison metrics
    const crResults = runPolicySim('constant_real');
    const fpResults = runPolicySim('fixed_pct');
    const grResults = runPolicySim('guardrail');

    // Generate chart data percentiles for active policy
    const chartData = [];
    const totalYears = (targetAge - currentAge) + 40;
    for (let y = 0; y <= totalYears; y++) {
      const yearBalances = activeResults.paths.map(path => path[y]).sort((a, b) => a - b);
      const p10 = yearBalances[Math.floor(100 * 0.1)];
      const p50 = yearBalances[Math.floor(100 * 0.5)];
      const p90 = yearBalances[Math.floor(100 * 0.9)];

      chartData.push({
        year: y,
        label: `Age ${currentAge + y}`,
        'Conservative (10th %)': p10,
        'Expected (50th %)': p50,
        'Optimistic (90th %)': p90
      });
    }

    return {
      chartData,
      successRate: activeResults.successRate,
      medianRetirementNestEgg: activeResults.medianRetirementNestEgg,
      targetFIREGoal: activeResults.targetFIREGoal,
      accumulationYears: activeResults.accumulationYears,
      comparisons: [
        { name: 'Constant Real Dollar (Inflation-Adj)', success: crResults.successRate, balance: crResults.medianEndBalance, id: 'constant_real' },
        { name: 'Fixed % of Portfolio (Safe No-deplete)', success: fpResults.successRate, balance: fpResults.medianEndBalance, id: 'fixed_pct' },
        { name: 'Guyton-Klinger Guardrails (Adaptive)', success: grResults.successRate, balance: grResults.medianEndBalance, id: 'guardrail' },
      ]
    };
  }, [currentAge, targetAge, currentNestEgg, monthlySavings, postExpenses, fireMode, swrPercent, activePolicy]);

  const { chartData, successRate, medianRetirementNestEgg, targetFIREGoal, accumulationYears, comparisons } = simulation;

  const getStatusColor = () => {
    if (successRate >= 85) return { text: 'SECURE FIRE PATHWAY', color: 'text-green-400', bg: 'bg-green-500/5', border: 'border-green-500/20' };
    if (successRate >= 50) return { text: 'VULNERABLE RUNWAY', color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' };
    return { text: 'HIGH RISK OF RUNNING OUT', color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' };
  };

  const status = getStatusColor();

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-medium">
      {/* Mode Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setFireMode(m.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group relative ${
              fireMode === m.id
                ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_4px_20px_rgba(249,115,22,0.15)] scale-102'
                : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xl">{m.icon}</span>
              {fireMode === m.id && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
            </div>
            <div className="mt-3">
              <h5 className="font-extrabold text-xs text-white group-hover:text-orange-300 transition-colors">{m.name}</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Retirement Success Rate</span>
          <p className={`text-2xl font-black ${status.color}`}>{successRate}%</p>
          <span className="text-[9px] text-slate-500 block mt-1">Solvent till retirement year 40</span>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target FIRE Number</span>
          <p className="text-2xl font-black text-orange-400">₹{targetFIREGoal.toLocaleString('en-IN')}</p>
          <span className="text-[9px] text-slate-500 block mt-1">Based on {swrPercent}% withdrawal rate</span>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Projected Nest Egg</span>
          <p className="text-2xl font-black text-cyan-400">₹{medianRetirementNestEgg.toLocaleString('en-IN')}</p>
          <span className="text-[9px] text-slate-500 block mt-1">Median expected at age {targetAge}</span>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Accumulation Horizon</span>
          <p className="text-2xl font-black text-purple-400">{accumulationYears} Years</p>
          <span className="text-[9px] text-slate-500 block mt-1">Years left to build capital</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders Input Control */}
        <div className="lg:col-span-4 card bg-slate-900/60 border border-white/5 p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-orange-400 uppercase tracking-widest flex items-center gap-2">
            🔥 FIRE Parameters
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Current Age</span>
                  <span className="text-white font-bold">{currentAge}</span>
                </div>
                <input 
                  type="range"
                  min="18"
                  max="55"
                  step="1"
                  className="w-full accent-orange-400 cursor-pointer h-1 bg-white/10 rounded-full"
                  value={currentAge}
                  onChange={e => setCurrentAge(parseInt(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Target Age</span>
                  <span className="text-white font-bold">{targetAge}</span>
                </div>
                <input 
                  type="range"
                  min={currentAge + 1}
                  max="70"
                  step="1"
                  className="w-full accent-orange-400 cursor-pointer h-1 bg-white/10 rounded-full"
                  value={targetAge}
                  onChange={e => setTargetAge(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Current Nest Egg (₹)</span>
                <span className="text-white font-bold">₹{currentNestEgg.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="10000000"
                step="250000"
                className="w-full accent-orange-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={currentNestEgg}
                onChange={e => setCurrentNestEgg(parseInt(e.target.value))}
              />
            </div>

            {fireMode !== 'coast' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Monthly Savings (₹)</span>
                  <span className="text-white font-bold">₹{monthlySavings.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="250000"
                  step="5000"
                  className="w-full accent-orange-400 cursor-pointer h-1 bg-white/10 rounded-full"
                  value={monthlySavings}
                  onChange={e => setMonthlySavings(parseInt(e.target.value))}
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Post-Retirement Expenses (₹/mo)</span>
                <span className="text-white font-bold">₹{postExpenses.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="10000"
                max="200000"
                step="5000"
                className="w-full accent-orange-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={postExpenses}
                onChange={e => setPostExpenses(parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Safe Withdrawal Rate (SWR %)</label>
              <select 
                value={swrPercent} 
                onChange={e => setSwrPercent(parseFloat(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="3" className="bg-slate-900">3% (Ultra-Conservative)</option>
                <option value="3.5" className="bg-slate-900">3.5% (Conservative)</option>
                <option value="4" className="bg-slate-900">4% (Bengen's Rule Standard)</option>
                <option value="5" className="bg-slate-900">5% (Aggressive)</option>
              </select>
            </div>
            
            {/* Active Policy Selector */}
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Active SWR Policy for Chart</label>
              <select 
                value={activePolicy} 
                onChange={e => setActivePolicy(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="constant_real" className="bg-slate-900">Constant Real (Inflation-adjusted)</option>
                <option value="fixed_pct" className="bg-slate-900">Fixed Percentage of Balance</option>
                <option value="guardrail" className="bg-slate-900">Guyton-Klinger Guardrails</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projections Area Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-base">FIRE Wealth Stochastic Projections</h4>
              <p className="text-xs text-slate-400 mt-0.5">Runs 100 trials using 12% equity-linked volatility to stress-test accumulation and decumulation.</p>
            </div>

            <div className="h-64 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* Retirement Age Reference Line */}
                  <ReferenceLine x={`Age ${targetAge}`} stroke="#f97316" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Retirement Trigger', position: 'insideTopLeft', fill: '#fb923c', fontSize: 10, fontWeight: 'bold' }} />
                  
                  {/* Percentile Bands */}
                  <Area 
                    type="monotone" 
                    dataKey="Optimistic (90th %)" 
                    stroke="none"
                    fill="rgba(16, 185, 129, 0.05)" 
                    name="Optimistic case"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Expected (50th %)" 
                    stroke="#f97316" 
                    fill="rgba(249, 115, 22, 0.1)" 
                    strokeWidth={2.5}
                    name="Median Expected Path"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Conservative (10th %)" 
                    stroke="#ef4444" 
                    fill="rgba(239, 68, 68, 0.05)" 
                    strokeWidth={1.5}
                    name="Conservative Case"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Premium upgrades: Policy Comparison Table */}
          <div className="card bg-white/3 border border-white/5 p-4 overflow-hidden">
            <h5 className="font-bold text-xs text-white mb-3 flex items-center gap-1.5"><Settings size={14} /> Safe Withdrawal Policies Comparison</h5>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-bold">
                    <th className="pb-2">Withdrawal Policy</th>
                    <th className="pb-2 text-center">Success Rate (%)</th>
                    <th className="pb-2 text-right">Median Year 40 Balance</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {comparisons.map((c, idx) => (
                    <tr key={idx} className={`hover:bg-white/2 cursor-pointer ${activePolicy === c.id ? 'bg-orange-500/5' : ''}`} onClick={() => setActivePolicy(c.id)}>
                      <td className="py-2.5 text-white font-bold flex items-center gap-1.5">
                        {activePolicy === c.id && <span className="text-orange-400 text-xs">●</span>}
                        {c.name}
                      </td>
                      <td className={`py-2.5 text-center font-black ${c.success >= 85 ? 'text-green-400' : c.success >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{c.success}%</td>
                      <td className="py-2.5 text-right text-slate-300">₹{c.balance.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.success >= 85 ? 'bg-green-500/15 text-green-400' : c.success >= 50 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                          {c.success >= 85 ? 'Highly Safe' : c.success >= 50 ? 'Moderate' : 'Risky'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className={`card border p-5 flex items-start gap-4 ${status.bg} ${status.border}`}>
            <div className="text-3xl shrink-0 mt-0.5">
              {successRate >= 85 ? '🟢' : successRate >= 50 ? '⚠️' : '🚨'}
            </div>
            <div className="flex-1">
              <h5 className="font-extrabold text-sm text-white flex items-center gap-2">
                FIRE AUTO-PILOT VERDICT: <span className={status.color}>{status.text}</span>
              </h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your portfolio longevity survival rate is <strong>{successRate}%</strong> under the active <strong>{comparisons.find(c => c.id === activePolicy)?.name}</strong> policy. 
                {successRate < 85 ? ' The current savings rate is insufficient to sustain the withdrawal phase safely. Try extending target age or ramping up monthly investments.' : ' Your early retirement path is statistically highly secure.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
