// client/src/pages/smart/SpendAnomalyDetector.jsx — Institutional Grade Anomaly Engine
import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, DollarSign, ArrowRight, RefreshCw, Layers, Check, Ban } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

const INITIAL_EXPENSES = [
  { id: 1, date: '2026-03-05', category: 'Food & Dining', merchant: 'Gourmet Restaurant', amount: 1200 },
  { id: 2, date: '2026-03-10', category: 'Shopping', merchant: 'Brand Store', amount: 3500 },
  { id: 3, date: '2026-03-15', category: 'Travel', merchant: 'Ride Share', amount: 450 },
  { id: 4, date: '2026-03-20', category: 'Food & Dining', merchant: 'Food Delivery', amount: 800 },
  { id: 5, date: '2026-03-28', category: 'Entertainment', merchant: 'Streaming Sub', amount: 699 },
  { id: 6, date: '2026-04-02', category: 'Food & Dining', merchant: 'Weekly Groceries', amount: 1500 },
  { id: 7, date: '2026-04-08', category: 'Shopping', merchant: 'Online Apparel', amount: 2800 },
  { id: 8, date: '2026-04-12', category: 'Travel', merchant: 'Fuel Station', amount: 2500 },
  { id: 9, date: '2026-04-20', category: 'Food & Dining', merchant: 'Office Lunch', amount: 350 },
  { id: 10, date: '2026-04-25', category: 'Entertainment', merchant: 'Concert Ticket', amount: 4500 }, // Anomaly
  { id: 11, date: '2026-05-01', category: 'Food & Dining', merchant: 'Weekly Groceries', amount: 1700 },
  { id: 12, date: '2026-05-06', category: 'Shopping', merchant: 'Electronics Hub', amount: 24500 }, // Anomaly (One-off Capital Outlier)
  { id: 13, date: '2026-05-15', category: 'Travel', merchant: 'Airlines Booking', amount: 12000 }, // Anomaly (Travel outlier)
  { id: 14, date: '2026-05-22', category: 'Food & Dining', merchant: 'Food Delivery', amount: 600 },
  { id: 15, date: '2026-05-28', category: 'Bills', merchant: 'Electricity Corp', amount: 3200 },
  { id: 16, date: '2026-06-01', category: 'Food & Dining', merchant: 'Fine Dining Bistro', amount: 7800 }, // Anomaly
  { id: 17, date: '2026-06-03', category: 'Shopping', merchant: 'Convenience Store', amount: 1200 },
  { id: 18, date: '2026-06-05', category: 'Travel', merchant: 'Ride Share', amount: 600 },
];

const CATEGORY_PROFILES = {
  'Food & Dining': { mean: 1200, stdDev: 450, icon: '🍔', color: '#06b6d4' },
  'Shopping': { mean: 2500, stdDev: 900, icon: '🛍️', color: '#8b5cf6' },
  'Travel': { mean: 1500, stdDev: 600, icon: '🚗', color: '#ec4899' },
  'Entertainment': { mean: 1000, stdDev: 400, icon: '🎬', color: '#eab308' },
  'Bills': { mean: 2800, stdDev: 700, icon: '⚡', color: '#10b981' },
};

export const SpendAnomalyDetector = () => {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  
  // ── Sliding Window States ──
  const [windowSize, setWindowSize] = useState(7);
  const [budgetLimit, setBudgetLimit] = useState(12000);

  const slidingWindowResults = useMemo(() => {
    if (expenses.length === 0) return null;
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dailySpend = {};
    sorted.forEach(e => {
      dailySpend[e.date] = (dailySpend[e.date] || 0) + e.amount;
    });

    const dates = [];
    const minTime = new Date(sorted[0].date);
    const maxTime = new Date(sorted[sorted.length - 1].date);
    let curr = new Date(minTime);
    while (curr <= maxTime) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    let maxSpend = 0;
    let maxWindowStart = '';
    let maxWindowEnd = '';
    const timelineData = [];
    let currentWindowSum = 0;
    let left = 0;

    for (let right = 0; right < dates.length; right++) {
      const rightDate = dates[right];
      currentWindowSum += (dailySpend[rightDate] || 0);

      while (right - left + 1 > windowSize) {
        const leftDate = dates[left];
        currentWindowSum -= (dailySpend[leftDate] || 0);
        left++;
      }

      if (currentWindowSum > maxSpend) {
        maxSpend = currentWindowSum;
        maxWindowStart = dates[left];
        maxWindowEnd = rightDate;
      }

      timelineData.push({
        date: rightDate,
        windowSum: currentWindowSum,
        dailySpend: dailySpend[rightDate] || 0,
        limit: budgetLimit,
        isOverLimit: currentWindowSum > budgetLimit
      });
    }

    let totalStreaksCount = 0;
    let isStreakActive = false;
    timelineData.forEach(d => {
      if (d.windowSum > budgetLimit) {
        if (!isStreakActive) {
          totalStreaksCount++;
          isStreakActive = true;
        }
      } else {
        isStreakActive = false;
      }
    });

    return {
      maxSpend,
      maxWindowStart,
      maxWindowEnd,
      timelineData,
      totalStreaksCount
    };
  }, [expenses, windowSize, budgetLimit]);
  const [sensitivity, setSensitivity] = useState(1.96);
  const [selectedCategory, setSelectedCategory] = useState('Food & Dining');
  const [excludedIds, setExcludedIds] = useState([]); // IDs of items excluded from baseline
  const [customExpense, setCustomExpense] = useState({ merchant: '', amount: '', category: 'Food & Dining' });

  // Dynamically compute baseline averages and standard deviations based only on non-excluded items
  const computedAverages = useMemo(() => {
    const profiles = {};
    Object.keys(CATEGORY_PROFILES).forEach(cat => {
      const catExps = expenses.filter(e => e.category === cat && !excludedIds.includes(e.id));
      if (catExps.length <= 1) {
        profiles[cat] = { ...CATEGORY_PROFILES[cat] };
      } else {
        const mean = catExps.reduce((sum, e) => sum + e.amount, 0) / catExps.length;
        const variance = catExps.reduce((sum, e) => sum + Math.pow(e.amount - mean, 2), 0) / catExps.length;
        const stdDev = Math.max(100, Math.sqrt(variance)); // Floor SD to avoid zero dev division
        profiles[cat] = {
          ...CATEGORY_PROFILES[cat],
          mean: Math.round(mean),
          stdDev: Math.round(stdDev)
        };
      }
    });
    return profiles;
  }, [expenses, excludedIds]);

  // Compute anomalies using dynamic baselines
  const anomalies = useMemo(() => {
    return expenses.map(exp => {
      const isExcluded = excludedIds.includes(exp.id);
      const profile = computedAverages[exp.category];
      if (!profile) return { ...exp, zScore: 0, isAnomaly: false, isExcluded };
      
      const zScore = (exp.amount - profile.mean) / profile.stdDev;
      return {
        ...exp,
        zScore: +zScore.toFixed(2),
        isAnomaly: zScore > sensitivity && !isExcluded,
        isExcluded,
        profile
      };
    }).filter(exp => exp.isAnomaly || exp.isExcluded).sort((a, b) => b.zScore - a.zScore);
  }, [expenses, sensitivity, computedAverages, excludedIds]);

  const activeAnomalies = useMemo(() => {
    return anomalies.filter(a => !a.isExcluded);
  }, [anomalies]);

  // Spending diagnostic cause tags
  const diagnostics = useMemo(() => {
    const active = anomalies.filter(a => !a.isExcluded);
    const results = [];

    // Find runaway categories (categories with multiple spikes)
    const categorySpikeCounts = {};
    active.forEach(a => {
      categorySpikeCounts[a.category] = (categorySpikeCounts[a.category] || 0) + 1;
    });

    Object.entries(categorySpikeCounts).forEach(([cat, count]) => {
      if (count >= 2) {
        results.push({
          type: 'danger',
          title: `Runaway ${cat} Spend`,
          desc: `Detected ${count} distinct anomalies in ${cat} recently. This signals systematic budget leakage rather than a one-off outlier.`
        });
      }
    });

    // Check for extreme capital outliers (Z-score > 4)
    active.forEach(a => {
      if (a.zScore > 4.0) {
        results.push({
          type: 'warning',
          title: `Capital Outlier: ${a.merchant}`,
          desc: `₹${a.amount.toLocaleString('en-IN')} transaction is ${a.zScore} standard deviations above normal. Recommend excluding this one-off capital asset purchase to stabilize your baseline.`
        });
      }
    });

    return results;
  }, [anomalies]);

  const chartData = useMemo(() => {
    const profile = computedAverages[selectedCategory];
    const mean = profile.mean;
    const sd = profile.stdDev;
    
    // Chart all items in the category, displaying exclusions differently
    const catExpenses = expenses
      .filter(e => e.category === selectedCategory)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return catExpenses.map(e => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      Spend: e.amount,
      Average: mean,
      'Normal Limit (+1σ)': Math.round(mean + sd),
      'Anomaly Limit (+2σ)': Math.round(mean + 2 * sd),
      merchant: e.merchant,
      isExcluded: excludedIds.includes(e.id),
      zScore: +((e.amount - mean) / sd).toFixed(2)
    }));
  }, [expenses, selectedCategory, computedAverages, excludedIds]);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!customExpense.merchant || !customExpense.amount) return;

    const newExp = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      category: customExpense.category,
      merchant: customExpense.merchant,
      amount: parseFloat(customExpense.amount)
    };

    setExpenses(prev => [newExp, ...prev]);
    setCustomExpense({ merchant: '', amount: '', category: selectedCategory });
    toast.success('Simulated expense registered!');
  };

  const toggleExclude = (id) => {
    setExcludedIds(prev => {
      if (prev.includes(id)) {
        toast.success('Transaction restored into baseline calculations.');
        return prev.filter(x => x !== id);
      } else {
        toast.success('Outlier excluded from statistical baseline averages.');
        return [...prev, id];
      }
    });
  };

  const getSeverityBadge = (z, isExcluded) => {
    if (isExcluded) return 'bg-slate-500/20 text-slate-400 border-slate-500/30 font-medium';
    if (z > 3.0) return 'bg-red-500/20 text-red-400 border-red-500/30 font-black';
    if (z > 2.0) return 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold';
    return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-semibold';
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Monitored Categories</span>
          <p className="text-xl font-black text-white">{Object.keys(CATEGORY_PROFILES).length}</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Active Spikes</span>
          <p className="text-xl font-black text-rose-400">{activeAnomalies.length}</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Muted Outliers</span>
          <p className="text-xl font-black text-slate-400">{excludedIds.length}</p>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sensitivity threshold</span>
          <p className="text-xl font-black text-cyan-400">{sensitivity} σ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* Simulator Form */}
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              🧪 Expense Simulator
            </h4>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Category</label>
                <select 
                  className="input-dark text-xs py-2 bg-black/40"
                  value={customExpense.category}
                  onChange={e => setCustomExpense(prev => ({ ...prev, category: e.target.value }))}
                >
                  {Object.keys(CATEGORY_PROFILES).map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_PROFILES[cat].icon} {cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Merchant / Shop</label>
                <input 
                  className="input-dark text-xs py-2 bg-black/40"
                  placeholder="e.g., Starbucks, Apple Store, Airlines" 
                  value={customExpense.merchant} 
                  onChange={e => setCustomExpense(prev => ({ ...prev, merchant: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Amount (₹)</label>
                <input 
                  type="number"
                  className="input-dark text-xs py-2 bg-black/40"
                  placeholder="e.g., 500, 15000" 
                  value={customExpense.amount} 
                  onChange={e => setCustomExpense(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-600">
                Log Sim Transaction
              </button>
            </form>
          </div>

          {/* Engine Parameters */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest">Engine Parameters</h4>
              <span className="text-[10px] font-bold text-slate-500 font-mono">Dynamic Baseline</span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-400">Trigger Sensitivity (σ)</span>
                <span className="text-cyan-400 font-bold">{sensitivity} σ</span>
              </div>
              <input 
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={sensitivity}
                onChange={e => setSensitivity(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Diagnostics Section */}
          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest px-1">Behavioral Insights</h4>
              {diagnostics.map((diag, i) => (
                <div key={i} className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  diag.type === 'danger' ? 'bg-red-950/10 border-red-500/20 text-red-300' : 'bg-yellow-950/10 border-yellow-500/20 text-yellow-300'
                }`}>
                  <h5 className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider mb-1">
                    {diag.type === 'danger' ? '🚨' : '⚠️'} {diag.title}
                  </h5>
                  <p className="text-slate-300 font-medium">{diag.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Charts & Anomaly Log */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Display */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-white text-base">Category Timeline & Statistical Bands</h4>
                <p className="text-xs text-slate-400 mt-0.5">Calculated using recalculated averages and deviations.</p>
              </div>
              <select 
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {Object.keys(CATEGORY_PROFILES).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_PROFILES[cat].icon} {cat}</option>
                ))}
              </select>
            </div>

            <div className="h-64 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    labelFormatter={(label, payload) => `${label} - ${payload[0]?.payload?.merchant || ''} ${payload[0]?.payload?.isExcluded ? '(Muted Outlier)' : ''}`}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  {/* Confidence Bands */}
                  <Area type="monotone" dataKey="Anomaly Limit (+2σ)" stroke="none" fill="rgba(239, 68, 68, 0.04)" name="Anomaly Zone" />
                  <Area type="monotone" dataKey="Normal Limit (+1σ)" stroke="none" fill="rgba(6, 182, 212, 0.06)" name="Normal Deviation" />
                  
                  <ReferenceLine y={computedAverages[selectedCategory].mean} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" label={{ value: 'Mean Spend', position: 'right', fill: '#475569', fontSize: 9 }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="Spend" 
                    stroke={computedAverages[selectedCategory].color} 
                    fill={`rgba(${parseInt(computedAverages[selectedCategory].color.slice(1,3),16)}, ${parseInt(computedAverages[selectedCategory].color.slice(3,5),16)}, ${parseInt(computedAverages[selectedCategory].color.slice(5,7),16)}, 0.1)`}
                    strokeWidth={2.5}
                    name="Actual Spending"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Alerts Log */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest">
                🚨 Real-time Anomaly Diagnostics
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Found {anomalies.length} items</span>
            </div>

            {anomalies.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                🟢 Clean slate! No spending anomalies detected at the current {sensitivity}σ threshold.
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {anomalies.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 rounded-2xl transition flex items-center justify-between gap-4 border ${
                      item.isExcluded 
                        ? 'bg-slate-950/20 border-white/5 opacity-60' 
                        : 'bg-red-950/5 border-red-500/10 hover:bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        item.isExcluded ? 'bg-slate-800/20' : 'bg-red-500/10'
                      }`}>
                        {item.profile?.icon || '💰'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-xs truncate ${item.isExcluded ? 'text-slate-400 line-through' : 'text-white'}`}>{item.merchant}</span>
                          <span className="text-[9px] text-slate-400">{item.category}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                          {item.isExcluded ? (
                            <span className="text-emerald-400 font-medium">✓ Excluded from baseline (mean & deviation recalculated)</span>
                          ) : (
                            <>
                              📊 Spiked by <strong className="text-red-400">₹{Math.round(item.amount - item.profile.mean)}</strong> above average. Z-Score: <strong className="text-rose-300">{item.zScore}σ</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className={`font-black text-sm ${item.isExcluded ? 'text-slate-500 line-through' : 'text-red-400'}`}>₹{item.amount.toLocaleString('en-IN')}</p>
                        <p className="text-[9px] text-slate-500">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-[8px] border shrink-0 ${getSeverityBadge(item.zScore, item.isExcluded)}`}>
                          {item.isExcluded ? 'EXCLUDED' : item.zScore > 3.0 ? '🚨 CRITICAL' : item.zScore > 2.0 ? '⚠️ WARNING' : 'INFO'}
                        </span>
                        
                        {/* Exclude / Mute toggle button */}
                        <button
                          onClick={() => toggleExclude(item.id)}
                          title={item.isExcluded ? "Re-include in average" : "Exclude one-off outlier"}
                          className={`p-1.5 rounded-lg border transition ${
                            item.isExcluded 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-white/3 text-slate-400 border-white/5 hover:text-white hover:bg-white/7'
                          }`}
                        >
                          {item.isExcluded ? <Check size={12} /> : <Ban size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      {/* 7-Day Sliding Window spending Analytics (Full Width) */}
      <div className="border-t border-white/5 pt-8 mt-6 space-y-6">
        <div>
          <h3 className="font-bold text-lg text-white">🔍 7-Day Sliding Window Spending Analytics</h3>
          <p className="text-xs text-slate-400">
            A sliding window algorithm evaluates cumulative expenses over consecutive days. 
            This identifies maximum spending velocity and streaks exceeding budget limits in $O(n)$ time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-white/3 border border-white/5 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Peak Spending Window</span>
            {slidingWindowResults && (
              <div>
                <p className="text-lg font-black text-rose-400">₹{slidingWindowResults.maxSpend.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(slidingWindowResults.maxWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                  {' — '} 
                  {new Date(slidingWindowResults.maxWindowEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          <div className="card bg-white/3 border border-white/5 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Budget Threshold Limit</span>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Threshold:</span>
                <span className="text-cyan-400 font-bold">₹{budgetLimit.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="5000"
                max="25000"
                step="1000"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={budgetLimit}
                onChange={e => setBudgetLimit(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="card bg-white/3 border border-white/5 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Exceeded Streaks</span>
            {slidingWindowResults && (
              <div>
                <p className="text-lg font-black text-amber-400">{slidingWindowResults.totalStreaksCount} Streaks</p>
                <p className="text-[10px] text-slate-400 mt-1">Windows exceeding your budget limit</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Timeline Chart */}
          <div className="lg:col-span-8 card bg-white/3 border border-white/5 p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h4 className="font-bold text-white text-sm">Sliding Cumulative Spending Path</h4>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Window:</span>
                <select 
                  className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-400"
                  value={windowSize}
                  onChange={e => setWindowSize(Number(e.target.value))}
                >
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>

            <div className="h-64 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={slidingWindowResults?.timelineData || []} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                    }}
                    tickLine={false} 
                  />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    labelFormatter={(val) => `Date: ${new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    formatter={(val, name) => [
                      name === 'windowSum' ? `₹${val.toLocaleString('en-IN')}` : `₹${val.toLocaleString('en-IN')}`, 
                      name === 'windowSum' ? `${windowSize}-Day Sum` : 'Daily Spend'
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  <defs>
                    <linearGradient id="colorSliding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  <ReferenceLine y={budgetLimit} stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="3 3" label={{ value: 'Budget Limit', position: 'right', fill: '#ef4444', fontSize: 9 }} />
                  
                  <Area type="monotone" dataKey="windowSum" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorSliding)" name="Cumulative Window Sum" />
                  <Area type="monotone" dataKey="dailySpend" stroke="rgba(255,255,255,0.2)" strokeWidth={1} fill="none" name="Single Day Spend" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Log / Details */}
          <div className="lg:col-span-4 card bg-white/3 border border-white/5 p-5 space-y-4 max-h-[340px] overflow-y-auto">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Streak Trigger History
            </h4>
            
            <div className="space-y-2.5">
              {slidingWindowResults?.timelineData
                .filter(d => d.isOverLimit)
                .slice(-10) // show last 10 entries
                .reverse()
                .map((d, i) => (
                  <div key={i} className="p-3 bg-red-950/15 border border-red-500/10 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-red-300">Budget Violation</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-white">₹{d.windowSum.toLocaleString('en-IN')}</p>
                      <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded uppercase font-extrabold font-mono">
                        +{Math.round(((d.windowSum - budgetLimit) / budgetLimit) * 100)}% Over
                      </span>
                    </div>
                  </div>
                ))}
              {slidingWindowResults?.timelineData.filter(d => d.isOverLimit).length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-8">No budget violations detected! Good job. 👍</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};
