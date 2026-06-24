// client/src/pages/smart/DebtOptimizer.jsx — Premium Unified Debt Paydown Optimizer
import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Trash2, Plus, ArrowRight, Info, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const DebtOptimizer = () => {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extraPayment, setExtraPayment] = useState(5000);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [emiForm, setEmiForm] = useState({ name: '', principal: '', annualRate: '', tenureMonths: '' });
  const [emiResult, setEmiResult] = useState(null);

  useEffect(() => {
    loadEmis();
  }, []);

  const loadEmis = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/wealth/emi');
      setEmis(data.emis || []);
    } catch (e) {
      toast.error('Failed to load tracked loans');
    }
    setLoading(false);
  };

  const calculateEMI = async () => {
    if (!emiForm.principal || !emiForm.annualRate || !emiForm.tenureMonths) return;
    try {
      const { data } = await api.post('/wealth/emi/calculate', {
        ...emiForm,
        extraMonthly: 0
      });
      setEmiResult(data);
    } catch (e) {
      toast.error('Calculation failed');
    }
  };

  const addEMI = async () => {
    if (!emiForm.name || !emiForm.principal || !emiForm.annualRate || !emiForm.tenureMonths) return;
    try {
      await api.post('/wealth/emi', { ...emiForm, startDate: new Date() });
      toast.success('Loan added successfully!');
      setShowAddModal(false);
      setEmiForm({ name: '', principal: '', annualRate: '', tenureMonths: '' });
      setEmiResult(null);
      loadEmis();
    } catch (e) {
      toast.error('Failed to save loan');
    }
  };

  const deleteEMI = async (id) => {
    try {
      await api.delete(`/wealth/emi/${id}`);
      toast.success('Loan removed');
      loadEmis();
    } catch (e) {
      toast.error('Failed to delete loan');
    }
  };

  const simulateDebtPaydown = useMemo(() => {
    if (emis.length === 0) return null;
    const extraVal = parseFloat(extraPayment) || 0;

    const runSimulation = (sortFn) => {
      let activeLoans = emis.map(e => ({
        id: e.id,
        name: e.name,
        principal: parseFloat(e.principal),
        rate: (parseFloat(e.annualRate) || 8.5) / 12 / 100,
        emi: parseFloat(e.emi),
        balance: parseFloat(e.principal),
      }));

      activeLoans = activeLoans.sort(sortFn);

      let month = 0;
      let totalInterestPaid = 0;
      let history = [{ month: 0, balance: activeLoans.reduce((s, l) => s + l.balance, 0), interest: 0 }];
      const MAX_MONTHS = 360;

      while (activeLoans.some(l => l.balance > 0) && month < MAX_MONTHS) {
        month++;
        let monthlyInterest = 0;
        let minimumRequiredEmi = 0;

        activeLoans.forEach(l => {
          if (l.balance > 0) {
            const interest = l.balance * l.rate;
            monthlyInterest += interest;
            l.balance += interest;
            minimumRequiredEmi += Math.min(l.emi, l.balance);
          }
        });

        totalInterestPaid += monthlyInterest;

        activeLoans.forEach(l => {
          if (l.balance > 0) {
            const payment = Math.min(l.emi, l.balance);
            l.balance -= payment;
          }
        });

        const totalBudget = emis.reduce((s, l) => s + parseFloat(l.emi), 0) + extraVal;
        let leftoverPay = totalBudget - minimumRequiredEmi;

        for (let l of activeLoans) {
          if (l.balance > 0 && leftoverPay > 0) {
            const addPayment = Math.min(leftoverPay, l.balance);
            l.balance -= addPayment;
            leftoverPay -= addPayment;
          }
        }

        const currentTotalBalance = activeLoans.reduce((s, l) => s + l.balance, 0);
        history.push({
          month,
          balance: currentTotalBalance,
          interest: totalInterestPaid
        });
      }

      return {
        months: month,
        totalInterest: totalInterestPaid,
        history
      };
    };

    const snowballResult = runSimulation((a, b) => a.balance - b.balance);
    const avalancheResult = runSimulation((a, b) => b.rate - a.rate);
    
    const maxLen = Math.max(snowballResult.months, avalancheResult.months);
    const chartData = [];
    const sampleStep = Math.max(1, Math.floor(maxLen / 12));
    
    for (let m = 0; m <= maxLen; m += sampleStep) {
      const sbItem = snowballResult.history.find(h => h.month === m) || { interest: snowballResult.totalInterest };
      const avItem = avalancheResult.history.find(h => h.month === m) || { interest: avalancheResult.totalInterest };
      chartData.push({
        month: `Month ${m}`,
        'Snowball Interest': Math.round(sbItem.interest),
        'Avalanche Interest': Math.round(avItem.interest),
      });
    }
    // ensure last month is included
    if (maxLen % sampleStep !== 0) {
      chartData.push({
        month: `Month ${maxLen}`,
        'Snowball Interest': Math.round(snowballResult.totalInterest),
        'Avalanche Interest': Math.round(avalancheResult.totalInterest),
      });
    }

    return {
      snowball: {
        months: snowballResult.months,
        interest: snowballResult.totalInterest
      },
      avalanche: {
        months: avalancheResult.months,
        interest: avalancheResult.totalInterest
      },
      chartData
    };
  }, [emis, extraPayment]);

  const interestSaved = simulateDebtPaydown ? (simulateDebtPaydown.snowball.interest - simulateDebtPaydown.avalanche.interest) : 0;
  const monthsSaved = simulateDebtPaydown ? (simulateDebtPaydown.snowball.months - simulateDebtPaydown.avalanche.months) : 0;

  return (
    <div className="space-y-6 text-slate-100 font-medium">
      {/* Overview Card */}
      <div className="card bg-slate-900/60 border border-white/5 p-5 text-left relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="flex items-center gap-2">
          <Calculator className="text-cyan-400 h-5 w-5 animate-pulse" />
          <div>
            <h4 className="font-black text-sm text-white">Debt Paydown Optimizer (Snowball vs. Avalanche)</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Simulate multi-loan payoffs and compare interest savings side-by-side.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        {/* Left column: Parameters & Active Loans list */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
            <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center justify-between">
              <span>⚙️ Budget & Loans</span>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-[10px] font-black px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Plus size={10} /> Add Loan
              </button>
            </h4>

            {/* Extra Monthly Payment Budget Input */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Extra Monthly Payment Budget</span>
                <span className="text-white font-mono font-bold">₹{extraPayment.toLocaleString('en-IN')}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="50000"
                step="1000"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={extraPayment}
                onChange={e => setExtraPayment(parseInt(e.target.value))}
              />
              <span className="text-[9px] text-slate-500 block leading-tight">This extra amount will be layered on top of minimum EMIs to speed up payoff.</span>
            </div>

            {/* Tracked Loans List */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Tracked Loans ({emis.length})</span>
              
              {loading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-white/5 animate-pulse rounded-xl" />
                  <div className="h-12 bg-white/5 animate-pulse rounded-xl" />
                </div>
              ) : emis.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 bg-white/2 border border-white/5 rounded-2xl italic">
                  No active loans found. Click "Add Loan" to track and optimize your debt paydown.
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {emis.map((emi) => (
                    <div key={emi.id} className="bg-white/5 border border-white/10 px-3 py-2.5 rounded-2xl flex justify-between items-center hover:border-cyan-500/20 transition-all duration-300">
                      <div>
                        <span className="font-bold text-xs text-white block">{emi.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          ₹{parseInt(emi.principal).toLocaleString('en-IN')} @ {emi.annualRate}% · {emi.tenureMonths}m
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-cyan-400 font-mono">₹{emi.emi?.toLocaleString('en-IN')}/m</span>
                        <button 
                          onClick={() => deleteEMI(emi.id)} 
                          className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Comparison Projections */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card bg-white/3 border border-white/5 p-6 space-y-5">
            <div>
              <h4 className="font-bold text-white text-base tracking-tight">❄️ Snowball vs 🌋 Avalanche Strategy Comparison</h4>
              <p className="text-xs text-slate-400 mt-0.5">Identify the mathematically and psychologically optimal approach to clear your liabilities.</p>
            </div>

            {!simulateDebtPaydown ? (
              <div className="text-center py-16 text-xs text-slate-500 italic">
                Add at least two active loans to evaluate strategy payoffs.
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Side-by-side Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Snowball card */}
                  <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-2.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">❄️ Debt Snowball (Lowest Balance First)</span>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] text-slate-500">Debt-Free in:</span>
                      <span className="font-mono font-bold text-white text-xs">{simulateDebtPaydown.snowball.months} months</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-500">Total Interest Paid:</span>
                      <span className="font-mono font-bold text-red-450 text-xs">₹{Math.round(simulateDebtPaydown.snowball.interest).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[8px] text-slate-500 leading-normal italic pt-1 border-t border-white/5">
                      Targeting lowest principals provides immediate psychological wins, freeing up cash flow.
                    </p>
                  </div>

                  {/* Avalanche card */}
                  <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-2.5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wide block">🌋 Debt Avalanche (Highest Interest First)</span>
                      <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0">Optimal</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] text-slate-500">Debt-Free in:</span>
                      <span className="font-mono font-bold text-cyan-400 text-xs">{simulateDebtPaydown.avalanche.months} months</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-slate-500">Total Interest Paid:</span>
                      <span className="font-mono font-bold text-green-400 text-xs">₹{Math.round(simulateDebtPaydown.avalanche.interest).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[8px] text-slate-500 leading-normal italic pt-1 border-t border-white/5">
                      Minimizes cumulative interest cost. Mathematically superior strategy to clear high rates first.
                    </p>
                  </div>
                </div>

                {/* Savings Callout Banner */}
                {interestSaved > 0 ? (
                  <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-2xl flex gap-3 items-center text-[10.5px] leading-relaxed text-slate-350">
                    <Info size={16} className="text-green-400 shrink-0" />
                    <p>
                      <strong>Debt Avalanche</strong> strategy saves you <strong className="text-green-400">₹{Math.round(interestSaved).toLocaleString('en-IN')}</strong> in total interest payments and clears your debts <strong className="text-green-400">{monthsSaved} months earlier</strong> compared to Snowball!
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex gap-3 items-center text-[10.5px] leading-relaxed text-slate-350">
                    <Info size={16} className="text-cyan-400 shrink-0" />
                    <p>
                      Both strategies yield similar payoff times due to your loan structure. <strong>Avalanche</strong> remains the optimal choice to minimize immediate rate compounding.
                    </p>
                  </div>
                )}

                {/* Area Chart Comparison */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">📈 Cumulative Interest Cost Over Time</span>
                  <div className="h-56 w-full text-[10px] pr-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simulateDebtPaydown.chartData} margin={{ left: 15, right: 5, top: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="sbGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F87171" stopOpacity="0.15"/>
                            <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="avGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34D399" stopOpacity="0.15"/>
                            <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                        <YAxis 
                          stroke="#64748b" 
                          tickLine={false} 
                          tickFormatter={(val) => {
                            if (val === 0) return '0';
                            if (val >= 100000) return `₹${(val / 100000).toFixed(0)} L`;
                            return `₹${(val / 1000).toFixed(0)} K`;
                          }} 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                          }}
                          itemStyle={{ color: '#fff', fontSize: '10px' }}
                          cursor={{ stroke: 'rgba(34, 211, 238, 0.15)', strokeWidth: 1.5, strokeDasharray: '3 3' }} 
                        />
                        <Area type="monotone" dataKey="Snowball Interest" stroke="#F87171" fillOpacity={1} fill="url(#sbGrad)" name="Snowball Method" strokeWidth={2} />
                        <Area type="monotone" dataKey="Avalanche Interest" stroke="#34D399" fillOpacity={1} fill="url(#avGrad)" name="Avalanche Method" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md bg-[#0b0f19] border border-white/10 p-5 rounded-2xl animate-fade-in text-left space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Add tracked EMI / Loan</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Loan Name</label>
                <input className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500" placeholder="Education Loan, Home Loan..." value={emiForm.name} onChange={e => setEmiForm({ ...emiForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Amount (₹)</label>
                  <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500" placeholder="500000" value={emiForm.principal} onChange={e => setEmiForm({ ...emiForm, principal: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Rate % p.a.</label>
                  <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500" placeholder="8.5" value={emiForm.annualRate} onChange={e => setEmiForm({ ...emiForm, annualRate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Months</label>
                  <input type="number" className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-cyan-500" placeholder="60" value={emiForm.tenureMonths} onChange={e => setEmiForm({ ...emiForm, tenureMonths: e.target.value })} />
                </div>
              </div>

              {emiResult?.result && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
                  <p className="text-cyan-400 font-bold text-sm">Monthly EMI: ₹{emiResult.result.emi?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-400">Total Interest Payable: ₹{emiResult.result.totalInterest?.toLocaleString('en-IN')}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={calculateEMI} className="w-1/2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all">Calculate</button>
                <button onClick={addEMI} className="w-1/2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-all" disabled={!emiForm.name}>Save Loan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
