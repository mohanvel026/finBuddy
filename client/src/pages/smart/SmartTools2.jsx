import { NEWS_CANCELER_SCENARIOS, EMI_TRAP_SCENARIOS, PURCHASE_ORACLE_SCENARIOS, IMPULSE_THERAPIST_SCENARIOS } from '../../data/smartTestScenarios';
import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Skeleton } from './SmartTools';

export const PurchaseOracle = () => {
  const [form, setForm] = useState({ product: '', currentPrice: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!form.product) return toast.error('Enter a product');
    setLoading(true);
    try {
      const { data } = await api.post('/smart/purchase-oracle', form);
      setResult(data.result);
    } catch { toast.error('Failed to query oracle'); }
    setLoading(false);
  };

  const heatColors = {
    'Overpriced': 'text-red-400',
    'Fair': 'text-yellow-400',
    'Good Deal': 'text-green-400',
    'Excellent Deal': 'text-emerald-400'
  };

  const verdictStyles = {
    'Buy Now': 'bg-green-500 text-black',
    'Wait': 'bg-yellow-500 text-black',
    'Strong Buy': 'bg-emerald-500 text-black',
    'Avoid': 'bg-red-500 text-white'
  };

  const trendData = result?.priceHistory?.map(h => ({
    name: h.month,
    discount: parseFloat(h.discount.replace('%', ''))
  })) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">⏰ Purchase Timing Oracle</h3>
        <p className="text-sm text-slate-400">Avoid buying right before a sale. Our oracle evaluates seasonal discounts and retail cycles to advise you.</p>
        <input className="input-dark bg-black/20" placeholder="Product name (e.g. iPad Pro, Sony Headset)" value={form.product} onChange={e=>setForm({...form,product:e.target.value})} />
        <input type="number" className="input-dark bg-black/20" placeholder="Current Retail Price (₹)" value={form.currentPrice} onChange={e=>setForm({...form,currentPrice:e.target.value})} />

        {/* 1-Click Test Scenarios */}
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💡 1-Click Test Scenarios</span>
          <div className="flex flex-wrap gap-2">
            {PURCHASE_ORACLE_SCENARIOS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setForm({ ...form, ...item.data })}
                className="text-[9px] bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition duration-200 cursor-pointer font-bold"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={ask} disabled={loading} className="btn-primary w-full shadow-orange-500/20 shadow-lg">{loading ? 'Consulting Market Data…' : 'Query Timing Oracle'}</button>
      </div>

      {loading && <div className="card"><Skeleton /></div>}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">
          <div className="space-y-4">
            <div className="card text-center p-6 bg-gradient-to-br from-amber-900/10 to-orange-900/15 border-orange-500/30">
              <div className={`inline-block px-5 py-1.5 rounded-full font-black text-xs uppercase tracking-wider mb-4 ${verdictStyles[result.verdict] || 'bg-cyan-500 text-black'}`}>{result.verdict}</div>
              <p className="text-slate-300 text-sm font-medium px-4">{result.verdictReason}</p>
              <div className="grid grid-cols-3 gap-3 mt-6 border-t border-white/5 pt-4">
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Market State</span><span className={`font-black text-sm ${heatColors[result.currentHeat] || 'text-slate-300'}`}>{result.currentHeat}</span></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Wait Duration</span><span className="font-black text-sm text-orange-400">{result.daysToWait ? `${result.daysToWait} days` : '0 days'}</span></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Est. Discount</span><span className="font-black text-sm text-green-400">{result.estimatedDiscount}</span></div>
              </div>
            </div>

            <div className="card bg-white/3 border border-white/5">
              <h4 className="font-bold mb-2 text-white text-sm">📅 Optimal Purchase Schedule</h4>
              <p className="text-lg font-bold text-cyan-400">{result.bestMonthToBuy} — during the {result.bestSaleEvent}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{result.pricePrediction}</p>
            </div>
          </div>

          <div className="space-y-4">
            {trendData.length > 0 && (
              <div className="card bg-white/3 border border-white/5">
                <h4 className="font-bold mb-4 text-white text-sm tracking-wider uppercase">📈 Discount Trajectory & Sale History</h4>
                <div className="h-44 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                      <YAxis stroke="#475569" tickLine={false} />
                      <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                       cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                     />
                      <Area type="monotone" dataKey="discount" stroke="#f97316" fill="rgba(249, 115, 22, 0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {result.alternativeProducts?.length > 0 && (
              <div className="card border-white/5">
                <h4 className="font-bold mb-3 text-white text-sm tracking-wider uppercase">💡 Smart Alternative Options</h4>
                <div className="space-y-2">
                  {result.alternativeProducts.map((a,i)=>(
                    <div key={i} className="p-3 bg-white/3 border border-white/5 rounded-xl text-sm flex justify-between items-start gap-4">
                      <div>
                        <span className="font-bold text-white block">{a.name}</span>
                        <span className="text-slate-400 text-xs mt-1 block">{a.reason}</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold shrink-0">{a.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const EMITrap = () => {
  const [mode, setMode] = useState('text');
  const [offerText, setOfferText] = useState('');
  const [calc, setCalc] = useState({ principal: '50000', emiAmount: '4500', months: '12', processingFee: '1500', extraPayment: '1000' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const payload = mode === 'text'
        ? { offerText, extraPayment: calc.extraPayment }
        : { ...calc };
      const { data } = await api.post('/smart/emi-trap', payload);
      setResult(data);
    } catch { toast.error('Analysis failed'); }
    setLoading(false);
  };

  const trapColors = {
    'Safe': 'text-green-400',
    'Mild Trap': 'text-yellow-400',
    'Moderate Trap': 'text-orange-400',
    'Severe Trap': 'text-red-400'
  };

  const borderColors = {
    'Safe': 'border-green-500/20 bg-green-500/5',
    'Mild Trap': 'border-yellow-500/20 bg-yellow-500/5',
    'Moderate Trap': 'border-orange-500/20 bg-orange-500/5',
    'Severe Trap': 'border-red-500/20 bg-red-500/5'
  };

  const chartData = result?.result ? [
    { name: 'Advertised Rate', rate: parseFloat(result.result.advertisedRate) || 0 },
    { name: 'True Effective Rate (APR)', rate: parseFloat(result.calculatedAPR || result.result.trueAPR) || 0 }
  ] : [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">💸 EMI & Loan Trap Detector</h3>
        <p className="text-sm text-slate-400">Enter loan terms or paste the exact bank promotion offer. We verify the True APR, factoring processing fees and GST.</p>
        
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
          <button onClick={()=>setMode('text')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${mode==='text'?'bg-red-500/20 text-red-400 border border-red-500/20 shadow-md':'text-slate-400 hover:text-slate-200'}`}>Parse Ad Copy / SMS</button>
          <button onClick={()=>setMode('calc')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${mode==='calc'?'bg-red-500/20 text-red-400 border border-red-500/20 shadow-md':'text-slate-400 hover:text-slate-200'}`}>Interactive Sliders</button>
        </div>

        {mode === 'text' ? (
          <div className="space-y-3">
            <textarea className="input-dark w-full h-32 text-sm bg-black/20" placeholder='e.g., "Buy Apple Macbook today at zero downpayment and 0% interest EMI! Monthly payments of only ₹9,990 for 12 months. Mandatory file processing charges apply of ₹2,999 + tax."' value={offerText} onChange={e=>setOfferText(e.target.value)} />
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400"><span>Optional Extra Monthly Prepayment</span><span className="text-white font-mono font-bold">₹{parseFloat(calc.extraPayment || '0').toLocaleString('en-IN')}</span></div>
              <input type="range" min="0" max="25000" step="500" value={calc.extraPayment || '0'} onChange={e=>setCalc({...calc,extraPayment:e.target.value})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400"><span>Loan Principal Amount</span><span className="text-white font-mono font-bold">₹{parseFloat(calc.principal).toLocaleString('en-IN')}</span></div>
              <input type="range" min="5000" max="500000" step="5000" value={calc.principal} onChange={e=>setCalc({...calc,principal:e.target.value})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400"><span>Proposed Monthly EMI</span><span className="text-white font-mono font-bold">₹{parseFloat(calc.emiAmount).toLocaleString('en-IN')}</span></div>
              <input type="range" min="500" max="50000" step="500" value={calc.emiAmount} onChange={e=>setCalc({...calc,emiAmount:e.target.value})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400"><span>Optional Extra Monthly Prepayment</span><span className="text-white font-mono font-bold">₹{parseFloat(calc.extraPayment || '0').toLocaleString('en-IN')}</span></div>
              <input type="range" min="0" max="25000" step="500" value={calc.extraPayment || '0'} onChange={e=>setCalc({...calc,extraPayment:e.target.value})} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tenure (Months)</label>
                <input type="number" className="input-dark bg-black/20" value={calc.months} onChange={e=>setCalc({...calc,months:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Processing Charges (₹)</label>
                <input type="number" className="input-dark bg-black/20" value={calc.processingFee} onChange={e=>setCalc({...calc,processingFee:e.target.value})} />
              </div>
            </div>
          </div>
        )}
        <button onClick={analyze} disabled={loading} className="btn-primary w-full shadow-red-500/20 shadow-lg">{loading ? 'Deconstruct Loan Offer…' : 'Expose Loan APR'}</button>
      </div>

      {loading && <div className="card"><Skeleton /></div>}

      {result?.result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">
          <div className="space-y-4">
            <div className={`card border ${borderColors[result.result.trapLevel] || 'border-white/5'} p-5`}>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Lending Integrity Status</span>
                  <h4 className={`text-2xl font-black ${trapColors[result.result.trapLevel] || 'text-slate-300'}`}>{result.result.trapLevel}</h4>
                  <p className="text-sm text-slate-300 mt-2 font-medium">{result.result.verdict}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Trap Score</span>
                  <span className={`text-4xl font-black ${trapColors[result.result.trapLevel] || 'text-slate-300'}`}>{result.result.trapScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 border-t border-white/5 pt-4 text-center">
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5"><span className="text-[9px] text-slate-400 font-bold block mb-1">True APR</span><span className="font-mono text-red-400 font-black text-sm">{result.calculatedAPR ? `${result.calculatedAPR}%` : result.result.trueAPR}</span></div>
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5"><span className="text-[9px] text-slate-400 font-bold block mb-1">Hidden Charge</span><span className="font-mono text-orange-400 font-black text-sm">{result.result.totalExtraCost}</span></div>
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5"><span className="text-[9px] text-slate-400 font-bold block mb-1">Safe to Proceed</span><span className={`font-black text-sm ${result.result.shouldAccept ? 'text-green-400' : 'text-red-400'}`}>{result.result.shouldAccept ? 'YES' : 'NO'}</span></div>
              </div>
            </div>

            {result?.prepaymentSavings && (
              <div className="card bg-gradient-to-r from-green-950/20 to-emerald-950/25 border border-green-500/30 p-5">
                <h4 className="font-bold text-green-400 text-sm tracking-wider uppercase mb-2">🚀 Prepayment Accelerator Impact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Months Saved</span>
                    <span className="text-xl font-black text-white">{result.prepaymentSavings.monthsSaved} Months</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Interest Saved</span>
                    <span className="text-xl font-black text-green-400">₹{result.prepaymentSavings.interestSaved?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                  Paying an extra ₹{parseFloat(calc.extraPayment || 0).toLocaleString('en-IN')} per month reduces the loan tenure from {calc.months} to {parseInt(calc.months) - result.prepaymentSavings.monthsSaved} months, saving you significant interest outflow.
                </p>
              </div>
            )}

            <div className="card bg-white/3 border border-white/5">
              <h4 className="font-bold mb-4 text-white text-sm tracking-wider uppercase">📊 Effective Rate Comparison</h4>
              <div className="h-52 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" stroke="#475569" tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#475569" tickLine={false} width={120} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                       cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                     />
                    <Bar dataKey="rate" fill="#f87171" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {result?.amortizationSchedule?.length > 0 && (
              <div className="card bg-white/3 border border-white/5 p-5">
                <h4 className="font-bold text-white text-sm tracking-wider uppercase mb-3">📋 Amortization Schedule (First 6 Months)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2">Month</th>
                        <th className="py-2 text-right">Principal Paid</th>
                        <th className="py-2 text-right">Interest Paid</th>
                        <th className="py-2 text-right">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.amortizationSchedule.slice(0, 6).map((s, i) => (
                        <tr key={i} className="border-b border-white/5 text-slate-300">
                          <td className="py-2 font-bold">{s.month}</td>
                          <td className="py-2 text-right font-mono">₹{s.principalPaid?.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right font-mono text-red-400">₹{s.interestPaid?.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right font-mono">₹{s.balance?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.result.hiddenCosts?.length > 0 && (
              <div className="card border-white/5">
                <h4 className="font-bold mb-3 text-red-400 text-sm tracking-wider uppercase">💀 Deconstructed Fees & Levies</h4>
                <div className="space-y-2">
                  {result.result.hiddenCosts.map((c,i)=>(
                    <div key={i} className="flex justify-between items-center text-sm p-3 bg-red-950/10 border border-red-500/10 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-200">{c.name}</span>
                        <p className="text-slate-400 text-xs mt-1">{c.impact}</p>
                      </div>
                      <span className="font-mono text-red-400 font-bold">{c.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.result.betterAlternatives?.length > 0 && (
              <div className="card border-white/5">
                <h4 className="font-bold mb-3 text-white text-sm tracking-wider uppercase">✅ Better Financing Options</h4>
                <div className="space-y-2">
                  {result.result.betterAlternatives.map((a,i)=>(
                    <div key={i} className="p-3 bg-green-950/10 border border-green-500/10 rounded-xl text-sm flex justify-between items-start gap-4">
                      <div>
                        <span className="font-bold text-slate-200">{a.option}</span>
                        <p className="text-slate-400 text-xs mt-1">Cost benchmark: {a.rate || 'None'}</p>
                      </div>
                      <span className="font-mono text-green-400 font-bold shrink-0">Save {a.saving}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ImpulseTherapist = () => {
  const [form, setForm] = useState({ item: '', price: '', reason: '', monthlyIncome: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState(parseInt(localStorage.getItem('willpowerCoins') || '0'));

  const analyze = async () => {
    if (!form.item || !form.price) return toast.error('Enter item and price');
    setLoading(true);
    try {
      const { data } = await api.post('/smart/impulse', form);
      setResult(data.result);
    } catch { toast.error('CBT strategy generation failed'); }
    setLoading(false);
  };

  const resist = () => {
    const earned = result?.coinsEarned || 50;
    const newCoins = coins + earned;
    setCoins(newCoins);
    localStorage.setItem('willpowerCoins', String(newCoins));
    toast.success(`💪 Willpower verified! +${earned} Coins Earned!`);
    setResult(null);
    setForm({ item: '', price: '', reason: '', monthlyIncome: '' });
  };

  const verdictStyles = {
    'BUY': 'bg-green-500/10 border-green-500/30 text-green-400',
    'WAIT 72 HOURS': 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    "DON'T BUY": 'bg-red-500/10 border-red-500/30 text-red-400'
  };

  const triggerColors = {
    'FOMO': 'text-purple-400',
    'Boredom': 'text-blue-400',
    'Status Anxiety': 'text-orange-400',
    'Reward Seeking': 'text-yellow-400',
    'Social Pressure': 'text-pink-400',
    'Genuine Need': 'text-green-400'
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="font-bold text-xl text-white">🧠 Impulse Buy Therapist</h3>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">WILLPOWER BENCHMARK</span>
            <span className="text-yellow-400 font-black text-sm">🏆 {coins} Coins</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 font-medium">Use Cognitive Behavioral Therapy to verify whether you need a purchase, or if you're answering an emotional trigger.</p>
        <input className="input-dark bg-black/20" placeholder="Product (e.g. Designer Sneakers)" value={form.item} onChange={e=>setForm({...form,item:e.target.value})} />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" className="input-dark bg-black/20" placeholder="Retail Cost (₹)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} />
          <input type="number" className="input-dark bg-black/20" placeholder="Your Monthly Income (₹)" value={form.monthlyIncome} onChange={e=>setForm({...form,monthlyIncome:e.target.value})} />
        </div>
        <input className="input-dark bg-black/20" placeholder="Why do you want to purchase it right now?" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} />

        {/* 1-Click Test Scenarios */}
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💡 1-Click Test Scenarios</span>
          <div className="flex flex-wrap gap-2">
            {IMPULSE_THERAPIST_SCENARIOS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setForm({ ...form, ...item.data })}
                className="text-[9px] bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition duration-200 cursor-pointer font-bold"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary w-full shadow-purple-500/20 shadow-lg">{loading ? 'Reframing urges…' : 'Consult Cognitive Therapist'}</button>
      </div>

      {loading && <div className="card"><Skeleton /></div>}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">
          <div className="space-y-4">
            <div className={`card border text-center p-6 ${verdictStyles[result.finalVerdict] || 'border-white/5'}`}>
              <div className="text-5xl mb-2">{result.verdictEmoji}</div>
              <h2 className="text-2xl font-black mb-2 tracking-wide uppercase">{result.finalVerdict}</h2>
              <p className="text-slate-300 text-sm font-medium px-4 leading-relaxed">{result.verdictReason}</p>
            </div>

            {(result.finalVerdict === "DON'T BUY" || result.finalVerdict === 'WAIT 72 HOURS') && (
              <button onClick={resist} className="btn-primary w-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30 shadow-lg py-3">
                💪 Commit to Resist & Earn +{result.coinsEarned} Willpower Coins
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-white/3 border border-white/5 p-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Behavioral Trigger</span>
                <div className={`font-black ${triggerColors[result.emotionalTrigger] || 'text-slate-200'}`}>{result.emotionalTrigger}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{result.triggerExplanation}</p>
              </div>
              <div className="card bg-white/3 border border-white/5 p-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Urge Score</span>
                <div className="font-black text-slate-200">{result.needVsWant}</div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mt-2"><div className="h-1.5 bg-purple-500 rounded-full" style={{width:`${result.needScore}%`}} /></div>
                <p className="text-[10px] text-slate-400 mt-1">{result.needScore}% need rating</p>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-purple-950/15 to-indigo-950/15 border border-purple-500/20 p-5">
              <h4 className="font-bold text-purple-400 text-sm tracking-wider uppercase mb-2">💰 Investment Compound Horizon</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{result.savingsOpportunity}</p>
            </div>

            <div className="card bg-white/3 border border-white/5">
              <h4 className="font-bold text-white text-sm tracking-wider uppercase mb-2">🎯 Cognitive Substitution Rule</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{result.alternativeAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderMarkdown = (text) => {

  const lines = text.split('\n');
  const elements = [];
  let currentTable = null;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let currentList = null;

  const flushList = (key) => {
    if (currentList) {
      elements.push(
        <ul key={key} className="list-disc pl-5 space-y-1 mb-4 text-slate-300">
          {currentList.map((item, i) => (
            <li key={i} className="text-xs leading-relaxed">{item}</li>
          ))}
        </ul>
      );
      currentList = null;
    }
  };

  const flushTable = (key) => {
    if (currentTable) {
      elements.push(
        <div key={key} className="overflow-x-auto my-4 rounded-lg border border-white/5 bg-black/10">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/3">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTable.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/3 transition duration-150">
                  {row.map((val, i) => (
                    <td key={i} className="px-4 py-2 text-xs text-slate-300 font-mono">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const parseInline = (str) => {
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(str)) !== null) {
      const plainText = str.substring(lastIndex, match.index);
      if (plainText) parts.push(plainText);
      parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    const leftOver = str.substring(lastIndex);
    if (leftOver) parts.push(leftOver);

    return parts.length > 0 ? parts : str;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <div key={`code-${i}`} className="bg-black/30 border border-white/5 rounded-lg p-4 font-mono text-xs text-slate-300 my-4 whitespace-pre-wrap leading-relaxed">
            {codeBlockLines.join('\n')}
          </div>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(lines[i]);
      continue;
    }

    if (line.startsWith('|')) {
      const parts = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = parts.every(p => p.startsWith('-'));
      if (isSeparator) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: parts, rows: [] };
      } else {
        currentTable.rows.push(parts);
      }
      continue;
    } else {
      flushTable(`table-${i}`);
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      if (!currentList) currentList = [];
      currentList.push(parseInline(content));
      continue;
    } else {
      flushList(`list-${i}`);
    }

    if (line.startsWith('>')) {
      const content = line.substring(1).trim();
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-green-500 bg-green-500/5 px-4 py-2.5 my-3 rounded-r-lg text-xs text-slate-300 italic leading-relaxed">
          {parseInline(content)}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith('###')) {
      const content = line.substring(3).trim();
      elements.push(
        <h4 key={`h-${i}`} className="text-sm font-extrabold text-white tracking-wider mt-6 mb-3 border-b border-white/5 pb-1 uppercase">
          {parseInline(content)}
        </h4>
      );
      continue;
    } else if (line.startsWith('##')) {
      const content = line.substring(2).trim();
      elements.push(
        <h3 key={`h-${i}`} className="text-base font-black text-white tracking-wide mt-8 mb-4 border-b border-white/10 pb-1.5 uppercase">
          {parseInline(content)}
        </h3>
      );
      continue;
    } else if (line.startsWith('#')) {
      const content = line.substring(1).trim();
      elements.push(
        <h2 key={`h-${i}`} className="text-lg font-black text-white tracking-wide mt-10 mb-6">
          {parseInline(content)}
        </h2>
      );
      continue;
    }

    if (line === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-white/5" />);
      continue;
    }

    if (line) {
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed mb-4">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushTable('table-end');
  flushList('list-end');

  return elements;
};

export const NewsCanceler = () => {
  const [form, setForm] = useState({ headline: '', portfolio: 'Long-term SIP investor' });
  const [stream, setStream] = useState('');
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!form.headline) return toast.error('Paste a headline');
    setLoading(true);
    setStream('');
    setMeta(null);
    try {
      const token = localStorage.getItem('finbuddy_token');
      const res = await fetch('/api/smart/news-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.replace('data: ', '');
          if (d === '[DONE]') break;
          try {
            const p = JSON.parse(d);
            if (p.chunk) { fullText += p.chunk; setStream(s => s + p.chunk); }
          } catch {}
        }
      }
      const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) { try { setMeta(JSON.parse(jsonMatch[0])); } catch {} }
    } catch { toast.error('Failed to cancel media noise'); }
    setLoading(false);
  };

  const portfolioTypes = ['Long-term SIP investor','Short-term trader','FD/Debt investor','Equity+MF mixed','Retired / Conservative'];
  const verdictColors = { 'IGNORE': 'text-green-400', 'MONITOR': 'text-yellow-400', 'ACT': 'text-red-400' };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">📡 Financial News Noise Canceler</h3>
        <p className="text-sm text-slate-400">Neutralize media panic. Our AI extracts core economic data and details the realistic, calm action strategy for your portfolio.</p>
        <textarea className="input-dark w-full h-24 text-sm bg-black/20" placeholder='e.g., "SENSEX CRASHES 2000 POINTS: Global bank runs trigger historic selloff in emerging markets!"' value={form.headline} onChange={e=>setForm({...form,headline:e.target.value})} />
        <select className="input-dark bg-black/20 w-full" value={form.portfolio} onChange={e=>setForm({...form,portfolio:e.target.value})}>
          {portfolioTypes.map(t=><option key={t}>{t}</option>)}
        </select>

        {/* 1-Click Test Scenarios */}
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💡 1-Click Test Scenarios</span>
          <div className="flex flex-wrap gap-2">
            {NEWS_CANCELER_SCENARIOS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setForm({ ...form, headline: item.headline })}
                className="text-[9px] bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition duration-200 cursor-pointer font-bold"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary w-full shadow-blue-500/20 shadow-lg">{loading ? 'Neutralizing Sensationalism…' : 'Cancel News Noise'}</button>
      </div>

      {meta && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center bg-white/3 border border-white/5 p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Panic Multiplier</span>
            <p className="font-black text-2xl text-red-400">{meta.panicScore}/10</p>
          </div>
          <div className="card text-center bg-white/3 border border-white/5 p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">AI Recommendation</span>
            <p className={`font-black text-lg ${verdictColors[meta.verdict] || 'text-slate-200'}`}>{meta.verdict}</p>
          </div>
          <div className="card text-center bg-white/3 border border-white/5 p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Realistic Vector</span>
            <p className="font-bold text-xs text-white leading-tight mt-1">{meta.actualMove}</p>
          </div>
        </div>
      )}

      {stream && (
        <div className="card border-blue-500/20 bg-blue-950/5 p-6">
          <h4 className="font-bold text-blue-400 text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
            🎯 Calm Forensic Assessment
            {loading && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />}
          </h4>
          <div className="font-sans space-y-1">
            {renderMarkdown(stream.replace(/```json|```/g, '').replace(/\{[\s\S]*?\}/, '').trim())}
          </div>
        </div>
      )}
    </div>
  );
};

