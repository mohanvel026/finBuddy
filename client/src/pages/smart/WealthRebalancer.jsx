// client/src/pages/smart/WealthRebalancer.jsx — Institutional Grade Rebalancer Engine
import React, { useState, useMemo } from 'react';
import { RefreshCw, Scale, AlertTriangle, ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const ASSET_CLASSES = [
  { key: 'equity', label: 'Equity / Stocks', color: '#06b6d4' },
  { key: 'debt', label: 'Debt / Fixed Income', color: '#10b981' },
  { key: 'commodities', label: 'Gold & Commodities', color: '#eab308' },
  { key: 'crypto', label: 'Cryptocurrency', color: '#8b5cf6' },
];

const PRESETS = [
  { name: 'Aggressive Growth', equity: 75, debt: 10, commodities: 5, crypto: 10 },
  { name: 'Balanced Compounding', equity: 50, debt: 30, commodities: 15, crypto: 5 },
  { name: 'Conservative Wealth', equity: 25, debt: 60, commodities: 15, crypto: 0 },
  { name: 'All-Weather Portfolio', equity: 30, debt: 40, commodities: 25, crypto: 5 },
];

export const WealthRebalancer = () => {
  const [targets, setTargets] = useState({ equity: 50, debt: 30, commodities: 15, crypto: 5 });
  const [currentVals, setCurrentVals] = useState({ equity: 650000, debt: 180000, commodities: 110000, crypto: 110000 });
  const [rebalanceMode, setRebalanceMode] = useState('sell_buy'); // 'sell_buy' | 'cash_infusion'

  const handleTargetChange = (key, value) => {
    const val = Math.max(0, Math.min(100, Number(value) || 0));
    setTargets(prev => ({ ...prev, [key]: val }));
  };

  const handleValueChange = (key, value) => {
    const val = Math.max(0, Number(value) || 0);
    setCurrentVals(prev => ({ ...prev, [key]: val }));
  };

  const applyPreset = (preset) => {
    setTargets({
      equity: preset.equity,
      debt: preset.debt,
      commodities: preset.commodities,
      crypto: preset.crypto
    });
    toast.success(`Preset "${preset.name}" applied!`);
  };

  const portfolioSummary = useMemo(() => {
    const totalValue = Object.values(currentVals).reduce((a, b) => a + b, 0);
    const targetSum = Object.values(targets).reduce((a, b) => a + b, 0);

    // Standard Sell/Buy calculations
    const baseData = ASSET_CLASSES.map(asset => {
      const currentVal = currentVals[asset.key];
      const currentPct = totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
      const targetPct = targets[asset.key];
      const targetVal = totalValue * (targetPct / 100);
      const driftPct = currentPct - targetPct;
      const tradeRequired = targetVal - currentVal;

      return {
        key: asset.key,
        name: asset.label,
        color: asset.color,
        CurrentValue: currentVal,
        CurrentPct: +currentPct.toFixed(1),
        TargetPct: targetPct,
        TargetValue: Math.round(targetVal),
        DriftPct: +driftPct.toFixed(1),
        TradeRequired: Math.round(tradeRequired)
      };
    });

    const totalDrift = baseData.reduce((sum, item) => sum + Math.abs(item.DriftPct), 0) / 2;

    // Two-Pointer Greedy Transaction Matcher
    const surpluses = baseData
      .filter(item => item.TradeRequired < -1000)
      .map(item => ({ key: item.key, name: item.name, color: item.color, amount: Math.abs(item.TradeRequired) }))
      .sort((a, b) => b.amount - a.amount);

    const deficits = baseData
      .filter(item => item.TradeRequired > 1000)
      .map(item => ({ key: item.key, name: item.name, color: item.color, amount: item.TradeRequired }))
      .sort((a, b) => b.amount - a.amount);

    const twoPointerTrades = [];
    let pIdx = 0; // surplus pointer
    let rIdx = 0; // deficit pointer

    const sList = surpluses.map(s => ({ ...s }));
    const dList = deficits.map(d => ({ ...d }));

    while (pIdx < sList.length && rIdx < dList.length) {
      const sellAsset = sList[pIdx];
      const buyAsset = dList[rIdx];
      const transferAmount = Math.min(sellAsset.amount, buyAsset.amount);

      twoPointerTrades.push({
        from: sellAsset.name,
        fromKey: sellAsset.key,
        fromColor: sellAsset.color,
        to: buyAsset.name,
        toKey: buyAsset.key,
        toColor: buyAsset.color,
        amount: Math.round(transferAmount)
      });

      sellAsset.amount -= transferAmount;
      buyAsset.amount -= transferAmount;

      if (sellAsset.amount <= 10) pIdx++;
      if (buyAsset.amount <= 10) rIdx++;
    }

    const sellBuyTrades = twoPointerTrades;

    // Cash-Infusion calculations: Find the most overweight asset class relative to targets
    // Required total portfolio size = Max(CurrentValue_i / TargetWeight_i)
    let maxRatio = 0;
    ASSET_CLASSES.forEach(asset => {
      const tWeight = targets[asset.key] / 100;
      if (tWeight > 0) {
        const ratio = currentVals[asset.key] / tWeight;
        if (ratio > maxRatio) maxRatio = ratio;
      }
    });

    const cashInfusionData = ASSET_CLASSES.map(asset => {
      const currentVal = currentVals[asset.key];
      const tWeight = targets[asset.key] / 100;
      const requiredVal = maxRatio * tWeight;
      const cashNeeded = requiredVal - currentVal;

      return {
        key: asset.key,
        name: asset.label,
        color: asset.color,
        amount: Math.round(Math.max(0, cashNeeded))
      };
    });

    const totalCashNeeded = cashInfusionData.reduce((sum, item) => sum + item.amount, 0);

    return {
      data: baseData,
      totalValue,
      targetSum,
      totalDrift: +totalDrift.toFixed(1),
      sellBuyTrades,
      cashInfusionTrades: cashInfusionData.filter(item => item.amount >= 1000),
      totalCashNeeded
    };
  }, [targets, currentVals]);

  const { data, totalValue, targetSum, totalDrift, sellBuyTrades, cashInfusionTrades, totalCashNeeded } = portfolioSummary;

  const isSumValid = targetSum === 100;

  const comparisonChartData = data.map(item => ({
    name: item.name,
    'Current %': item.CurrentPct,
    'Target %': item.TargetPct
  }));

  const pieChartData = data.map(item => ({
    name: item.name,
    value: item.CurrentValue,
    color: item.color
  }));

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Target Warning */}
      {!isSumValid && (
        <div className="card bg-red-950/10 border border-red-500/25 p-4 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-semibold animate-pulse">
          <span>⚠️</span>
          <div>
            <p className="font-bold text-white text-sm">Allocation Mismatch</p>
            <p className="text-red-400 font-normal mt-0.5">Your target percentages sum up to {targetSum}%. Adjust them to sum up to exactly 100% for proper rebalancing recommendations.</p>
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white/3 border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Assets Monitored</span>
            <p className="text-2xl font-black text-white">₹{totalValue.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-lg">
            ₹
          </div>
        </div>

        <div className="card bg-white/3 border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Total Portfolio Drift</span>
            <p className={`text-2xl font-black ${totalDrift > 10 ? 'text-red-400' : totalDrift > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {totalDrift}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Scale size={20} />
          </div>
        </div>

        <div className="card bg-white/3 border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Drift Status</span>
            <p className={`text-sm font-black mt-1 ${totalDrift > 10 ? 'text-red-400' : totalDrift > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {totalDrift > 10 ? '🔴 CRITICAL REBALANCE REQ.' : totalDrift > 5 ? '🟡 MODERATE DRIFT' : '🟢 STABLE ALLOCATION'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Allocations & Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Allocation Presets */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-3">
            <h4 className="font-extrabold text-xs text-cyan-400 uppercase tracking-widest">Target Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(preset)}
                  className="p-3 bg-white/3 hover:bg-white/7 border border-white/5 hover:border-white/10 rounded-xl text-left text-xs font-semibold transition"
                >
                  <p className="text-white">{preset.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {preset.equity}/{preset.debt}/{preset.commodities}/{preset.crypto}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Inputs */}
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              ✏️ Adjust Allocations
            </h4>
            <div className="space-y-4">
              {ASSET_CLASSES.map(asset => (
                <div key={asset.key} className="space-y-2 pb-3 border-b border-white/[0.03] last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: asset.color }} />
                      {asset.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Current Val: ₹{currentVals[asset.key].toLocaleString('en-IN')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Target Weight %</label>
                      <input 
                        type="number"
                        className="input-dark text-xs py-1.5 bg-black/40 text-center font-bold"
                        value={targets[asset.key]}
                        onChange={e => handleTargetChange(asset.key, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1">Current Balance (₹)</label>
                      <input 
                        type="number"
                        className="input-dark text-xs py-1.5 bg-black/40 text-center font-bold"
                        value={currentVals[asset.key]}
                        onChange={e => handleValueChange(asset.key, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Allocation Chart */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <h4 className="font-bold text-white text-base">Current vs. Target Asset Allocation</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-7 h-44 text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                    <YAxis stroke="#475569" tickLine={false} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                       cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                     />
                    <Legend verticalAlign="top" iconType="circle" height={24} />
                    <Bar dataKey="Current %" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Target %" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Rebalance Advice */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest">
                🩺 AI Rebalancing Recommendations
              </h4>
              
              {/* Mode Toggle Selector */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setRebalanceMode('sell_buy')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    rebalanceMode === 'sell_buy' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Sell / Buy
                </button>
                <button
                  onClick={() => setRebalanceMode('cash_infusion')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    rebalanceMode === 'cash_infusion' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Cash Infusion
                </button>
              </div>
            </div>

            {totalDrift <= 5 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic bg-white/[0.01] rounded-xl border border-dashed border-white/5">
                🟢 Your portfolio is perfectly balanced! No adjustments are needed as your total drift is only {totalDrift}%.
              </div>
            ) : !isSumValid ? (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                Waiting for target allocation adjustments...
              </div>
            ) : rebalanceMode === 'sell_buy' ? (
              <div className="space-y-4 animate-fade-in">
                {/* AI Explanation */}
                <div className="p-4 bg-purple-950/15 border border-purple-500/20 rounded-2xl text-xs leading-relaxed text-slate-300">
                  <span className="font-extrabold text-purple-400 block mb-1">💡 AI Portfolio Insights</span>
                  Your portfolio has drifted by <strong className="text-purple-300">{totalDrift}%</strong>. 
                  We recommend executing the following buy and sell orders. 
                  Note: Selling assets will trigger capital gains tax drag. Toggle **"Cash Infusion"** mode to rebalance with new savings instead.
                </div>

                {/* SVG Matchmaking Map */}
                {sellBuyTrades.length > 0 && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        🔗 Two-Pointer Matchmaking Topology
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/20">
                        O(N) Greedy Settlement
                      </span>
                    </div>

                    <div className="relative flex justify-center bg-black/30 rounded-xl overflow-hidden py-4 border border-white/5">
                      <svg width="460" height="180" viewBox="0 0 460 180" className="w-full max-w-[460px]">
                        <defs>
                          <linearGradient id="tradeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                          </linearGradient>
                          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 2 L 8 5 L 0 8 z" fill="#10b981" />
                          </marker>
                        </defs>

                        {/* Connection Paths */}
                        {sellBuyTrades.map((trade, i) => {
                          const sIdx = surpluses.findIndex(s => s.key === trade.fromKey);
                          const dIdx = deficits.findIndex(d => d.key === trade.toKey);
                          
                          const y1 = surpluses.length === 1 ? 90 : 35 + sIdx * (110 / (surpluses.length - 1 || 1));
                          const y2 = deficits.length === 1 ? 90 : 35 + dIdx * (110 / (deficits.length - 1 || 1));

                          return (
                            <g key={i} className="hover:opacity-100 opacity-70 transition-opacity duration-200">
                              <path
                                d={`M 130 ${y1} C 230 ${y1}, 230 ${y2}, 330 ${y2}`}
                                fill="none"
                                stroke="url(#tradeGrad)"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                                markerEnd="url(#arrow)"
                              />
                              <rect 
                                x="200" 
                                y={(y1 + y2) / 2 - 8} 
                                width="60" 
                                height="16" 
                                rx="4" 
                                fill="#0f172a" 
                                stroke="rgba(255,255,255,0.1)" 
                                strokeWidth="1"
                              />
                              <text
                                x="230"
                                y={(y1 + y2) / 2 + 4}
                                fill="#06b6d4"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                ₹{trade.amount >= 1000 ? `${(trade.amount / 1000).toFixed(0)}k` : trade.amount}
                              </text>
                            </g>
                          );
                        })}

                        {/* Surplus Nodes (Left) */}
                        {surpluses.map((s, idx) => {
                          const y = surpluses.length === 1 ? 90 : 35 + idx * (110 / (surpluses.length - 1 || 1));
                          return (
                            <g key={s.key} transform={`translate(20, ${y})`}>
                              <circle cx="10" cy="0" r="6" fill="#ef4444" className="animate-pulse" />
                              <rect x="25" y="-14" width="85" height="28" rx="6" fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="1" />
                              <text x="32" y="-1" fill="#f8fafc" fontSize="9" fontWeight="bold">{s.name.split(' ')[0]}</text>
                              <text x="32" y="9" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                +₹{Math.round(Math.abs(s.TradeRequired)).toLocaleString('en-IN')}
                              </text>
                            </g>
                          );
                        })}

                        {/* Deficit Nodes (Right) */}
                        {deficits.map((d, idx) => {
                          const y = deficits.length === 1 ? 90 : 35 + idx * (110 / (deficits.length - 1 || 1));
                          return (
                            <g key={d.key} transform={`translate(340, ${y})`}>
                              <circle cx="100" cy="0" r="6" fill="#10b981" />
                              <rect x="5" y="-14" width="85" height="28" rx="6" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
                              <text x="12" y="-1" fill="#f8fafc" fontSize="9" fontWeight="bold">{d.name.split(' ')[0]}</text>
                              <text x="12" y="9" fill="#10b981" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                -₹{Math.round(Math.abs(d.TradeRequired)).toLocaleString('en-IN')}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-2">
                  {sellBuyTrades.map((trade, i) => (
                    <div key={i} className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-red-500/20 text-red-400 border border-red-500/20">
                          SELL
                        </span>
                        <span className="text-xs font-bold text-slate-200" style={{ color: trade.fromColor }}>{trade.from.split(' ')[0]}</span>
                        <ArrowRight size={14} className="text-slate-500" />
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-green-500/20 text-green-400 border border-green-500/20">
                          BUY
                        </span>
                        <span className="text-xs font-bold text-slate-200" style={{ color: trade.toColor }}>{trade.to.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-mono text-cyan-400">₹{trade.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {/* AI Explanation */}
                <div className="p-4 bg-emerald-950/15 border border-emerald-500/20 rounded-2xl text-xs leading-relaxed text-slate-300">
                  <span className="font-extrabold text-emerald-400 block mb-1">🛡️ Cash-Infusion Rebalance Strategy</span>
                  To avoid triggering tax liability on sales, you can rebalance your portfolio by injecting a total of <strong className="text-emerald-300">₹{totalCashNeeded.toLocaleString('en-IN')}</strong> in new capital. 
                  Allocate this cash to the underweight asset classes below to perfectly align your portfolio weights.
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {cashInfusionTrades.map((trade, i) => (
                    <div key={i} className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-[9px] font-black rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                          DEPOSIT / BUY
                        </span>
                        <span className="text-xs font-bold text-slate-200">{trade.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">Inject:</span>
                        <span className="font-mono text-emerald-400">₹{trade.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
