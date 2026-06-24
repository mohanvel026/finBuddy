import { FRAUD_SHIELD_SCENARIOS, BILL_NEGOTIATOR_SCENARIOS, COST_RADAR_SCENARIOS } from '../../data/smartTestScenarios';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Skeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-white/10 rounded w-3/4"></div>
    <div className="h-4 bg-white/10 rounded w-5/6"></div>
    <div className="h-4 bg-white/10 rounded w-2/3"></div>
  </div>
);

const DNA_QUESTIONS = [
  { q: 'When you see "Limited Time Offer", what do you feel?', opts: ['I must buy NOW', 'I check if I need it', 'I ignore it', 'I feel anxious'] },
  { q: 'After a stressful day, you tend to...', opts: ['Shop online', 'Order food delivery', 'Save more aggressively', 'Treat myself a little'] },
  { q: 'Your friends buy a new gadget. You...', opts: ['Buy the same immediately', 'Research if I need one', 'Feel jealous but resist', 'Feel nothing'] },
  { q: 'How do you feel when you check your bank balance?', opts: ['Anxious', 'Satisfied', 'Indifferent', 'Motivated to earn more'] },
  { q: 'When buying clothes, you typically...', opts: ['Buy what catches my eye', 'Only replace worn-out items', 'Buy on sale even if not needed', 'Plan and budget in advance'] },
  { q: 'A friend recommends an investment. You...', opts: ['Invest immediately out of FOMO', 'Research for weeks', 'Ask multiple people first', 'Ignore it'] },
  { q: 'Your monthly savings rate is...', opts: ['I don\'t track it', 'Less than 10%', '10-30%', 'More than 30%'] },
];

export const SpendingDNA = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (opt) => {
    const newAnswers = [...answers, { question: DNA_QUESTIONS[step].q, answer: opt }];
    setAnswers(newAnswers);
    if (step < DNA_QUESTIONS.length - 1) { setStep(step + 1); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/smart/spending-dna', { answers: newAnswers });
      setResult(data.result);
    } catch { toast.error('Analysis failed'); }
    setLoading(false);
  };

  const reset = () => { setStep(0); setAnswers([]); setResult(null); };

  if (loading) return <div className="card"><Skeleton /></div>;

  if (result) return (
    <div className="space-y-4 animate-fade-in">
      <div className="card bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30 text-center p-8 relative overflow-hidden">
        <div className="text-6xl mb-3">{result.personalityEmoji}</div>
        <h2 className="text-3xl font-black text-purple-300">{result.personalityType}</h2>
        <p className="text-slate-300 italic mt-2">"{result.tagline}"</p>
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Risk profile</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : result.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{result.riskLevel}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Est. Leakage</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">{result.financialImpactEstimate}</span>
          </div>
        </div>
      </div>
      <div className="card bg-white/5 border border-white/5">
        <h4 className="font-bold text-lg text-purple-400 mb-2">⚡ Core Emotional Trigger</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{result.coreTrigger}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-green-500/5 border-green-500/20">
          <h5 className="font-bold text-green-400 text-sm mb-3">✅ Strengths</h5>
          {result.strengths?.map((s,i)=><p key={i} className="text-xs text-slate-300 mb-2">• {s}</p>)}
        </div>
        <div className="card bg-red-500/5 border-red-500/20">
          <h5 className="font-bold text-red-400 text-sm mb-3">⚠️ Watch Outs</h5>
          {result.watchOuts?.map((w,i)=><p key={i} className="text-xs text-slate-300 mb-2">• {w}</p>)}
        </div>
      </div>
      <div className="card bg-white/5 border border-white/5">
        <h4 className="font-bold text-lg text-cyan-400 mb-4">🔧 Actionable Debiasing Plan</h4>
        <div className="space-y-3">
          {result.debiasSteps?.map((s,i)=>(
            <div key={i} className="p-4 bg-white/3 rounded-xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">{i+1}</span>
                <span className="font-bold text-sm text-white">{s.step}</span>
              </div>
              <p className="text-xs text-slate-300 ml-10 leading-relaxed">{s.action}</p>
              <p className="text-[10px] text-slate-500 ml-10 mt-2 italic">🧠 Psychological rationale: {s.science}</p>
            </div>
          ))}
        </div>
      </div>
      <button onClick={reset} className="btn-secondary w-full">Retake Analysis</button>
    </div>
  );

  const q = DNA_QUESTIONS[step];
  const progress = Math.round((step / DNA_QUESTIONS.length) * 100);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card bg-white/5 border border-white/5 p-6">
        <div className="flex justify-between text-xs text-slate-400 mb-3">
          <span>Question {step+1} of {DNA_QUESTIONS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2"><div className="h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full transition-all duration-300" style={{width:`${progress}%`}} /></div>
        <h3 className="font-bold text-xl mt-8 mb-6 text-white leading-snug">{q.q}</h3>
        <div className="space-y-3">
          {q.opts.map((opt,i)=>(
            <button key={i} onClick={()=>handleAnswer(opt)} className="w-full text-left p-4 bg-white/3 hover:bg-purple-500/10 hover:border-purple-500/40 border border-white/5 rounded-2xl text-sm transition-all duration-200 hover:scale-102 hover:shadow-lg">{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FraudShield = () => {
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    'Parsing message metadata…',
    'Analyzing linguistic urgency and fear variables…',
    'Cross-referencing phone numbers and URL signatures…',
    'Calculating payload scam probability scores…',
    'Forensics complete!'
  ];

  const analyze = async () => {
    if (!msg.trim()) return toast.error('Paste a suspicious message');
    setLoading(true);
    setResult(null);
    setScanStep(0);

    const stepInterval = setInterval(() => {
      setScanStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 800);

    try {
      const { data } = await api.post('/smart/fraud-shield', { message: msg });
      setResult(data.result);
    } catch {
      toast.error('Forensics failed');
      clearInterval(stepInterval);
    } finally {
      setLoading(false);
    }
  };

  const verdictStyles = {
    SAFE: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    SUSPICIOUS: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    DANGER: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
  };

  const currentStyle = verdictStyles[result?.verdict] || { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">🛡️ Scam & UPI Fraud Shield</h3>
        <p className="text-sm text-slate-400">Instantly perform forensics on suspicious SMS alerts, cash offers, UPI demands, or KYC updates.</p>
        <textarea className="input-dark w-full h-32 text-sm bg-black/30 border border-white/5 rounded-xl p-3 focus:border-red-500/40" placeholder='e.g., "ALERT: Your HDFC netbanking will be suspended today. Click here to update your PAN now: http://hdfc-kyc.net/in"' value={msg} onChange={e=>setMsg(e.target.value)} />

        {/* 1-Click Test Scenarios */}
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💡 1-Click Test Scenarios</span>
          <div className="flex flex-wrap gap-2">
            {FRAUD_SHIELD_SCENARIOS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setMsg(item.text)}
                className="text-[9px] bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition duration-200 cursor-pointer font-bold"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary w-full shadow-red-500/20 shadow-lg">{loading ? 'Initiating Forensics…' : 'Scan Message for Scam'}</button>
      </div>

      {loading && (
        <div className="card bg-black/60 border border-red-500/20 font-mono text-xs text-red-400 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>CRITICAL FRAUD SHIELD FORENSICS ACTIVE…</span>
          </div>
          <div className="space-y-1">
            {steps.slice(0, scanStep + 1).map((s, i) => (
              <p key={i} className={i === scanStep ? 'text-red-300 animate-pulse' : 'text-red-500'}>
                {i === scanStep ? '> ' : '✔ '} {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className={`card ${currentStyle.bg} ${currentStyle.border} flex items-center gap-5 p-6`}>
            <div className="text-5xl">{result.verdictEmoji}</div>
            <div>
              <div className={`text-3xl font-black ${currentStyle.text}`}>{result.verdict}</div>
              <div className="text-sm text-slate-300 mt-1">Classification: <span className="font-bold text-white">{result.scamArchetype}</span></div>
              <div className="text-xs text-slate-400 mt-1">Forensic Scam Probability: <span className="font-bold text-red-400">{result.fraudProbability}%</span></div>
            </div>
          </div>

          {result.redFlags?.length > 0 && (
            <div className="card border-red-500/20 bg-red-950/5">
              <h4 className="font-bold text-red-400 mb-3 text-sm tracking-wider uppercase">🚩 Forensic Red Flags Detected</h4>
              <div className="space-y-2">
                {result.redFlags.map((f,i)=>(
                  <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-sm">
                    <span className="font-mono font-bold text-red-300 block">"{f.flag}"</span>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.actionChecklist?.length > 0 && (
            <div className="card border-white/5">
              <h4 className="font-bold text-white mb-3 text-sm tracking-wider uppercase">✅ Immediate Safety Steps</h4>
              <div className="space-y-2">
                {result.actionChecklist.map((a,i)=>(
                  <div key={i} className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${a.priority === 'IMMEDIATE' ? 'bg-red-500/5 border-red-500/10' : 'bg-white/3 border-white/5'}`}>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-wider shrink-0 ${a.priority === 'IMMEDIATE' ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-300'}`}>{a.priority}</span>
                    <span className="text-slate-300 font-medium">{a.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card bg-white/3 border border-white/5 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-xs text-slate-400">Scammer tactics detected:</span>
            <div className="flex gap-2">
              {result.psychologicalTactics?.map((t,i)=><span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full font-bold">{t}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CostRadar = () => {
  const [form, setForm] = useState({ city1: 'Bangalore', city2: 'Chennai', salary: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!form.city1 || !form.city2) return toast.error('Enter both cities');
    setLoading(true);
    try {
      const { data } = await api.post('/smart/cost-of-living', form);
      setResult(data.result);
    } catch { toast.error('Comparison failed'); }
    setLoading(false);
  };

  const chartData = result?.categories?.map(c => ({
    name: c.name,
    [result.city1.name]: c.city1Value,
    [result.city2.name]: c.city2Value
  })) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">📡 Hyper-Local Cost of Living Radar</h3>
        <div className="grid grid-cols-2 gap-3">
          <input className="input-dark bg-black/20" placeholder="City/Area 1 (e.g. Bangalore)" value={form.city1} onChange={e=>setForm({...form,city1:e.target.value})} />
          <input className="input-dark bg-black/20" placeholder="City/Area 2 (e.g. Pune)" value={form.city2} onChange={e=>setForm({...form,city2:e.target.value})} />
        </div>
        <input type="number" className="input-dark bg-black/20" placeholder="Your monthly income (₹)" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} />

        {/* 1-Click Test Scenarios */}
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">💡 1-Click Test Scenarios</span>
          <div className="flex flex-wrap gap-2">
            {COST_RADAR_SCENARIOS.map((item, idx) => (
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
        <button onClick={compare} disabled={loading} className="btn-primary w-full">{loading ? 'Modeling city economics…' : 'Compare Cities'}</button>
      </div>

      {loading && <div className="card"><Skeleton /></div>}

      {result && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">Financial Verdict</span>
              <p className="font-black text-2xl text-white">{result.verdict?.cheaperCity} is Cheaper</p>
              <p className="text-green-400 font-bold mt-1">Saves ₹{result.verdict?.monthlySavings?.toLocaleString('en-IN')}/mo (₹{result.verdict?.annualSavings?.toLocaleString('en-IN')}/yr)</p>
            </div>
            <div className="max-w-md bg-black/20 px-4 py-3 rounded-xl border border-white/5 text-sm text-slate-300">
              {result.verdict?.recommendation}
            </div>
          </div>

          <div className="card bg-white/3 border border-white/5">
            <h4 className="font-bold mb-4 text-white text-sm tracking-wider uppercase">📊 Side-by-Side Expense Comparison</h4>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Bar dataKey={result.city1.name} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={result.city2.name} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500 rounded-sm" /><span>{result.city1.name}</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm" /><span>{result.city2.name}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[result.city1, result.city2].map((c,i)=>(
              <div key={i} className="card bg-white/3 border border-white/5 p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-bold text-white text-lg">{c.name}</span>
                  <span className="tag-platinum">Score: {c.livabilityScore}</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between"><span>🏠 Avg Rent (1BHK)</span><span className="font-mono text-white font-bold">₹{c.avgRent1BHK?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>🚌 Trans. Cost / mo</span><span className="font-mono text-white font-bold">₹{c.transportMonthly?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span>⏱️ Avg Commute</span><span className="font-mono text-white font-bold">{c.avgCommuteMinutes} mins</span></div>
                  <div className="flex justify-between"><span>🌬️ Air Quality</span><span className="font-mono text-white font-bold">{c.airQualityIndex}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const renderMarkdown = (text) => {
  if (!text) return null;

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

export const BillNegotiator = () => {
  const [form, setForm] = useState({ billType: 'Mobile Plan', provider: '', currentPlan: '', monthlyAmount: '' });
  const [stream, setStream] = useState('');
  const [loading, setLoading] = useState(false);

  const negotiate = async () => {
    if (!form.monthlyAmount) return toast.error('Enter your bill amount');
    setLoading(true);
    setStream('');
    try {
      const token = localStorage.getItem('finbuddy_token');
      const res = await fetch('/api/smart/bill-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
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
            if (p.chunk) setStream(s => s + p.chunk);
          } catch {}
        }
      }
    } catch { toast.error('Failed to stream strategy'); }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Strategy copied to clipboard! 📋');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card space-y-4 bg-white/5 border border-white/5">
        <h3 className="font-bold text-xl text-white">🧾 Smart Bill Negotiator</h3>
        <p className="text-sm text-slate-400">Save money on fixed subscriptions. We generate scripts, emails, and competitor comparison data to bring your bills down.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Bill Class</label>
            <select className="input-dark bg-black/20" value={form.billType} onChange={e=>setForm({...form,billType:e.target.value})}>
              {['Mobile Plan','Broadband','Credit Card Annual Fee','Insurance Premium','OTT Subscription','DTH/Cable'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Provider</label>
            <input className="input-dark bg-black/20" placeholder="e.g. Jio, Airtel, ICICI" value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Monthly Cost (₹)</label>
            <input type="number" className="input-dark bg-black/20" placeholder="₹" value={form.monthlyAmount} onChange={e=>setForm({...form,monthlyAmount:e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Current Bundle/Plan Details</label>
            <input className="input-dark bg-black/20" placeholder="e.g. 100Mbps plan, gold membership" value={form.currentPlan} onChange={e=>setForm({...form,currentPlan:e.target.value})} />
          </div>
        </div>
        <button onClick={negotiate} disabled={loading} className="btn-primary w-full shadow-green-500/20 shadow-lg">{loading ? 'Formulating Negotiation Playbook…' : 'Generate Negotiation Playbook'}</button>
      </div>

      {stream && (
        <div className="card border-green-500/20 bg-green-950/5 relative p-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
            <h4 className="font-bold text-green-400 text-sm tracking-wider uppercase flex items-center gap-2">
              💬 Negotiation Playbook
              {loading && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />}
            </h4>
            <button onClick={() => copyToClipboard(stream)} className="btn-secondary text-[10px] px-3 py-1.5 rounded-lg border border-green-500/20">Copy Entire Playbook</button>
          </div>
          <div className="space-y-1 font-sans">{renderMarkdown(stream)}</div>
        </div>
      )}
    </div>
  );
};

const playTelemetrySound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'alert') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + 0.1);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.27);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.1);
        g.gain.setValueAtTime(0.08, now + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
        o.start(now + idx * 0.1);
        o.stop(now + idx * 0.1 + 0.35);
      });
    } else if (type === 'jam') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'refuel') {
      const now = ctx.currentTime;
      const notes = [587.33, 659.25, 880.00];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.08, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'penalty') {
      const now = ctx.currentTime;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g1 = ctx.createGain();
      const g2 = ctx.createGain();
      o1.connect(g1); g1.connect(ctx.destination);
      o2.connect(g2); g2.connect(ctx.destination);
      o1.type = 'sawtooth';
      o1.frequency.setValueAtTime(120, now);
      g1.gain.setValueAtTime(0.12, now);
      g1.gain.linearRampToValueAtTime(0.001, now + 0.4);
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(125, now);
      g2.gain.setValueAtTime(0.12, now);
      g2.gain.linearRampToValueAtTime(0.001, now + 0.4);
      o1.start(); o1.stop(now + 0.4);
      o2.start(); o2.stop(now + 0.4);
    }
  } catch (err) {
    console.warn("Web Audio API blocked by browser policy:", err);
  }
};

export const RoutePlanner = () => {
  const [form, setForm] = useState({ origin: '', destination: '', avoidPolice: false, vehicleType: 'car', fuelPrice: 106 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  // Focus tracking for recent searches/min-char warnings
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);

  // Recent searches saved to localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('finbuddy_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // WFH Cost Optimizer states
  const [wfhDays, setWfhDays] = useState(2);

  // Route Emulator states
  const [emulating, setEmulating] = useState(false);
  const [emuProgress, setEmuProgress] = useState(0);
  const [emuLog, setEmuLog] = useState('');
  const [emuRouteIdx, setEmuRouteIdx] = useState(null);

  // Industry-level autocomplete enhancements
  const [originActiveIndex, setOriginActiveIndex] = useState(-1);
  const [destActiveIndex, setDestActiveIndex] = useState(-1);
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  const [activeRouteIdx, setActiveRouteIdx] = useState(0);
  const isSelectedForEmu = emuRouteIdx === activeRouteIdx;

  const originTimeoutRef = useRef(null);
  const destTimeoutRef = useRef(null);
  const originWrapperRef = useRef(null);
  const destWrapperRef = useRef(null);
  const searchCacheRef = useRef({}); // { query: { data, timestamp } }

  // New Advanced Route State Hooks
  const [userCoords, setUserCoords] = useState(null);
  const [listeningField, setListeningField] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      const saved = localStorage.getItem('finbuddy_saved_routes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recognitionRef = useRef(null);

  const [decoyDeployed, setDecoyDeployed] = useState(false);
  const [jammerActive, setJammerActive] = useState(false);
  const [activeXP, setActiveXP] = useState(0);

  // Ultra-Premium States & Refs
  const [emuSpeed, setEmuSpeed] = useState(0);
  const [emuFuel, setEmuFuel] = useState(100);
  const [emuEta, setEmuEta] = useState(0);
  const originInputRef = useRef(null);
  const destInputRef = useRef(null);

  // Waypoint & Advanced Emulator States & Refs
  const [showWaypoint, setShowWaypoint] = useState(false);
  const [waypointQuery, setWaypointQuery] = useState('');
  const [waypointSuggestions, setWaypointSuggestions] = useState([]);
  const [waypointActiveIndex, setWaypointActiveIndex] = useState(-1);
  const [waypointLoading, setWaypointLoading] = useState(false);
  const [waypointFocused, setWaypointFocused] = useState(false);
  const waypointInputRef = useRef(null);
  const waypointWrapperRef = useRef(null);
  const waypointTimeoutRef = useRef(null);

  const [emuPaused, setEmuPaused] = useState(false);
  const emuStepRef = useRef(0);
  const emuInitialDurationRef = useRef(0);
  const emulatorIntervalRef = useRef(null);

  // Enhanced Route Emulator Game States
  const [emuCoins, setEmuCoins] = useState(100);
  const [emuEvent, setEmuEvent] = useState(null); // null, 'speed_trap', 'toll_plaza', 'fuel_refill'
  const [emuActiveStepIdx, setEmuActiveStepIdx] = useState(0);
  const [emuRefuelsCount, setEmuRefuelsCount] = useState(0);
  const [emuTrapsEvaded, setEmuTrapsEvaded] = useState(0);
  const [emuThrottle, setEmuThrottle] = useState(60); // manual velocity target (40-120 km/h)
  const [emuSavingTrip, setEmuSavingTrip] = useState(false);
  const [emuCompleted, setEmuCompleted] = useState(false);
  const [emuFailed, setEmuFailed] = useState(false);

  // refs to bypass setInterval stale closure bugs
  const emuCoinsRef = useRef(100);
  const emuEventRef = useRef(null);
  const emuActiveStepIdxRef = useRef(0);
  const emuRefuelsCountRef = useRef(0);
  const emuTrapsEvadedRef = useRef(0);
  const emuThrottleRef = useRef(60);
  const emuSpeedRef = useRef(60);
  const emuFuelRef = useRef(100);
  const jammerActiveRef = useRef(false);
  const decoyDeployedRef = useRef(false);

  // sync effects to ensure refs are always fresh
  useEffect(() => { emuThrottleRef.current = emuThrottle; }, [emuThrottle]);
  useEffect(() => { jammerActiveRef.current = jammerActive; }, [jammerActive]);
  useEffect(() => { decoyDeployedRef.current = decoyDeployed; }, [decoyDeployed]);
  useEffect(() => { emuEventRef.current = emuEvent; }, [emuEvent]);
  useEffect(() => { emuCoinsRef.current = emuCoins; }, [emuCoins]);
  useEffect(() => { emuFuelRef.current = emuFuel; }, [emuFuel]);

  // Silent GPS pre-fetch on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          // silent fallback
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originWrapperRef.current && !originWrapperRef.current.contains(event.target)) {
        setOriginSuggestions([]);
        setOriginActiveIndex(-1);
        setOriginFocused(false);
      }
      if (destWrapperRef.current && !destWrapperRef.current.contains(event.target)) {
        setDestSuggestions([]);
        setDestActiveIndex(-1);
        setDestFocused(false);
      }
      if (waypointWrapperRef.current && !waypointWrapperRef.current.contains(event.target)) {
        setWaypointSuggestions([]);
        setWaypointActiveIndex(-1);
        setWaypointFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (originTimeoutRef.current) clearTimeout(originTimeoutRef.current);
      if (destTimeoutRef.current) clearTimeout(destTimeoutRef.current);
      if (waypointTimeoutRef.current) clearTimeout(waypointTimeoutRef.current);
      if (emulatorIntervalRef.current) clearInterval(emulatorIntervalRef.current);
    };
  }, []);

  const resetAll = () => {
    setOriginQuery('');
    setDestQuery('');
    setWaypointQuery('');
    setShowWaypoint(false);
    setForm({ origin: '', destination: '', waypoint: '', avoidPolice: false, vehicleType: 'car', fuelPrice: 106 });
    setResult(null);
    setEmuRouteIdx(null);
    setEmuProgress(0);
    setEmulating(false);
    setOriginSuggestions([]);
    setDestSuggestions([]);
    setWaypointSuggestions([]);
    toast.success('All fields and routes reset! 🧹');
  };

  // Keyboard Accessibility Hotkeys (Alt+O, Alt+D, Alt+S, Alt+Enter, Alt+R)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const active = document.activeElement?.tagName?.toLowerCase();
      if (active === 'input' && document.activeElement !== originInputRef.current && document.activeElement !== destInputRef.current && document.activeElement !== waypointInputRef.current) {
        return;
      }
      if (e.altKey && e.key?.toLowerCase() === 'o') {
        e.preventDefault();
        originInputRef.current?.focus();
      } else if (e.altKey && e.key?.toLowerCase() === 'd') {
        e.preventDefault();
        destInputRef.current?.focus();
      } else if (e.altKey && e.key?.toLowerCase() === 's') {
        e.preventDefault();
        swapRoutes();
      } else if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        plan();
      } else if (e.altKey && e.key?.toLowerCase() === 'r') {
        e.preventDefault();
        resetAll();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [originQuery, destQuery, waypointQuery, form, savedRoutes]);

  const saveRecentSearch = (item) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.full !== item.full);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('finbuddy_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const selectOrigin = (selected) => {
    setForm(f => ({ ...f, origin: selected.full, originCoords: { lat: selected.lat, lon: selected.lon } }));
    setOriginQuery(selected.display);
    setOriginSuggestions([]);
    setOriginActiveIndex(-1);
    setOriginFocused(false);
    saveRecentSearch(selected);
  };

  const selectDest = (selected) => {
    setForm(f => ({ ...f, destination: selected.full, destCoords: { lat: selected.lat, lon: selected.lon } }));
    setDestQuery(selected.display);
    setDestSuggestions([]);
    setDestActiveIndex(-1);
    setDestFocused(false);
    saveRecentSearch(selected);
  };

  const selectWaypoint = (selected) => {
    setForm(f => ({ ...f, waypoint: selected.full, waypointCoords: { lat: selected.lat, lon: selected.lon } }));
    setWaypointQuery(selected.display);
    setWaypointSuggestions([]);
    setWaypointActiveIndex(-1);
    setWaypointFocused(false);
    saveRecentSearch(selected);
  };

  // Score-based subsequence fuzzy match and relevance ranking
  const getFuzzyScore = (text, query) => {
    if (!query) return 0;
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase();
    let score = 0;
    let qIdx = 0;
    let consecutive = 0;
    
    for (let tIdx = 0; tIdx < cleanText.length; tIdx++) {
      if (cleanText[tIdx] === cleanQuery[qIdx]) {
        score += (10 - Math.min(tIdx, 8)); 
        consecutive++;
        score += consecutive * 5;
        qIdx++;
        if (qIdx === cleanQuery.length) {
          if (cleanText.startsWith(cleanQuery)) {
            score += 100;
          }
          return score;
        }
      } else {
        consecutive = 0;
      }
    }
    return -1; // No match
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getSortedSuggestions = (suggestions, query) => {
    if (!suggestions || suggestions.length === 0) return [];
    
    // Deduplicate by display name (normalized)
    const seen = new Set();
    const unique = [];
    for (const s of suggestions) {
      const norm = s.display.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        unique.push(s);
      }
    }

    return unique
      .map(s => {
        let score = getFuzzyScore(s.display, query);
        if (score >= 0 && userCoords && userCoords.lat && userCoords.lon && s.lat && s.lon) {
          const dist = getDistanceKm(userCoords.lat, userCoords.lon, parseFloat(s.lat), parseFloat(s.lon));
          if (dist !== null) {
            if (dist <= 15) {
              score += 100; // Local match boost
            } else if (dist <= 50) {
              score += 50; // Regional match boost
            }
          }
        }
        return { ...s, score };
      })
      .filter(s => s.score >= 0)
      .sort((a, b) => b.score - a.score);
  };

  const groupSuggestions = (suggestions) => {
    const groups = { nearby: [], cities: [], other: [] };
    if (!suggestions) return groups;

    suggestions.forEach(s => {
      let distance = null;
      if (userCoords && userCoords.lat && userCoords.lon && s.lat && s.lon) {
        distance = getDistanceKm(userCoords.lat, userCoords.lon, parseFloat(s.lat), parseFloat(s.lon));
      }

      if (distance !== null && distance <= 30) {
        groups.nearby.push({ ...s, distance });
      } else {
        const isCityOrBroad = 
          s.display.toLowerCase().includes('city') || 
          s.display.toLowerCase().includes('district') || 
          s.display.toLowerCase().includes('municipality') ||
          s.display.toLowerCase().includes('state') ||
          s.display.split(',').length < 3;
        
        if (isCityOrBroad) {
          groups.cities.push(s);
        } else {
          groups.other.push(s);
        }
      }
    });

    return groups;
  };

  const renderSuggestionRow = (s, globalIdx, isActive, field) => {
    const primary = s.primary || s.display.split(', ')[0] || '';
    const secondary = s.secondary || s.display.split(', ').slice(1).join(', ') || '';
    const clickHandler = field === 'origin' ? () => selectOrigin(s) : field === 'destination' ? () => selectDest(s) : () => selectWaypoint(s);
    const activeIndexId = `${field}-option-${globalIdx}`;

    return (
      <button 
        key={globalIdx}
        id={activeIndexId}
        type="button" 
        role="option"
        aria-selected={isActive}
        onClick={clickHandler} 
        className={`w-full text-left px-4 py-2 text-xs transition-all duration-150 border-b border-white/5 last:border-0 flex items-center gap-2.5 ${
          isActive 
            ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 pl-3 font-semibold' 
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        <span className="shrink-0 text-xs">{s.distance !== undefined ? '📍' : '🗺️'}</span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-white font-semibold">
            {renderHighlightedText(primary, field === 'origin' ? originQuery : field === 'destination' ? destQuery : waypointQuery)}
          </span>
          {secondary && (
            <span className="truncate text-[10px] text-slate-500 mt-0.5">
              {secondary} {s.distance !== undefined ? `(${s.distance.toFixed(1)} km)` : ''}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderHighlightedText = (text, query) => {
    if (!query) return text;
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase();
    
    // Fast path: exact contiguous substring match
    const index = cleanText.indexOf(cleanQuery);
    if (index !== -1) {
      return (
        <span>
          {text.substring(0, index)}
          <span className="text-cyan-400 font-black bg-cyan-500/20 px-1 py-0.5 rounded">
            {text.substring(index, index + query.length)}
          </span>
          {text.substring(index + query.length)}
        </span>
      );
    }

    // Fallback: group contiguous matched characters for fuzzy runs
    const matchedIndices = new Set();
    let qIdx = 0;
    for (let tIdx = 0; tIdx < cleanText.length; tIdx++) {
      if (qIdx < cleanQuery.length && cleanText[tIdx] === cleanQuery[qIdx]) {
        matchedIndices.add(tIdx);
        qIdx++;
      }
    }

    const elements = [];
    let currentRun = "";
    let isMatchingRun = false;

    for (let i = 0; i < text.length; i++) {
      const isMatch = matchedIndices.has(i);
      if (isMatch !== isMatchingRun) {
        if (currentRun) {
          if (isMatchingRun) {
            elements.push(
              <span key={`m-${i}`} className="text-cyan-400 font-black bg-cyan-500/20 px-1 py-0.5 rounded">
                {currentRun}
              </span>
            );
          } else {
            elements.push(currentRun);
          }
        }
        currentRun = text[i];
        isMatchingRun = isMatch;
      } else {
        currentRun += text[i];
      }
    }

    if (currentRun) {
      if (isMatchingRun) {
        elements.push(
          <span key="m-end" className="text-cyan-400 font-black bg-cyan-500/20 px-1 py-0.5 rounded">
            {currentRun}
          </span>
        );
      } else {
        elements.push(currentRun);
      }
    }

    return <span>{elements}</span>;
  };

  const fetchSuggestions = async (val, setSuggestions, setLoadingState) => {
    if (val.length < 3) {
      setSuggestions([]);
      return;
    }

    const cachedEntry = searchCacheRef.current[val];
    const now = Date.now();
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    const performFetch = async (isBackground = false) => {
      if (!isBackground) {
        setLoadingState(true);
      }
      try {
        let url = `/smart/search-address?q=${encodeURIComponent(val)}`;
        if (userCoords && userCoords.lat && userCoords.lon) {
          url += `&lat=${userCoords.lat}&lon=${userCoords.lon}`;
        }
        const { data } = await api.get(url);
        if (Array.isArray(data)) {
          const results = data.map(item => {
            const parts = item.display_name
              .split(',')
              .map(part => part.trim())
              .filter(part => part && part !== 'India')
              .slice(0, 3);
            
            const primary = parts[0] || '';
            const secondary = parts.slice(1).join(', ');
            const display = parts.join(', ');

            return {
              primary,
              secondary,
              display,
              full: item.display_name,
              lat: item.lat,
              lon: item.lon
            };
          });
          searchCacheRef.current[val] = { data: results, timestamp: Date.now() };
          setSuggestions(results);
        }
      } catch (err) {
        if (!isBackground) {
          setSuggestions([]);
        }
      } finally {
        if (!isBackground) {
          setLoadingState(false);
        }
      }
    };

    if (cachedEntry) {
      const isExpired = now - cachedEntry.timestamp > CACHE_TTL;
      if (!isExpired) {
        setSuggestions(cachedEntry.data);
        return;
      } else {
        // Expired: stale-while-revalidate
        setSuggestions(cachedEntry.data);
        performFetch(true);
        return;
      }
    }

    await performFetch(false);
  };

  const handleOriginChange = (val) => {
    setOriginQuery(val);
    setForm(prev => ({ ...prev, origin: val, originCoords: null }));
    setOriginActiveIndex(-1);
    if (originTimeoutRef.current) clearTimeout(originTimeoutRef.current);
    
    const cachedEntry = searchCacheRef.current[val];
    if (cachedEntry) {
      const isExpired = Date.now() - cachedEntry.timestamp > 10 * 60 * 1000;
      if (!isExpired) {
        setOriginSuggestions(cachedEntry.data);
      } else {
        setOriginSuggestions(cachedEntry.data);
        fetchSuggestions(val, setOriginSuggestions, setOriginLoading);
      }
    } else {
      originTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(val, setOriginSuggestions, setOriginLoading);
      }, 250);
    }
  };

  const handleDestChange = (val) => {
    setDestQuery(val);
    setForm(prev => ({ ...prev, destination: val, destCoords: null }));
    setDestActiveIndex(-1);
    if (destTimeoutRef.current) clearTimeout(destTimeoutRef.current);

    const cachedEntry = searchCacheRef.current[val];
    if (cachedEntry) {
      const isExpired = Date.now() - cachedEntry.timestamp > 10 * 60 * 1000;
      if (!isExpired) {
        setDestSuggestions(cachedEntry.data);
      } else {
        setDestSuggestions(cachedEntry.data);
        fetchSuggestions(val, setDestSuggestions, setDestLoading);
      }
    } else {
      destTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(val, setDestSuggestions, setDestLoading);
      }, 250);
    }
  };

  const handleWaypointChange = (val) => {
    setWaypointQuery(val);
    setForm(prev => ({ ...prev, waypoint: val, waypointCoords: null }));
    setWaypointActiveIndex(-1);
    if (waypointTimeoutRef.current) clearTimeout(waypointTimeoutRef.current);

    const cachedEntry = searchCacheRef.current[val];
    if (cachedEntry) {
      const isExpired = Date.now() - cachedEntry.timestamp > 10 * 60 * 1000;
      if (!isExpired) {
        setWaypointSuggestions(cachedEntry.data);
      } else {
        setWaypointSuggestions(cachedEntry.data);
        fetchSuggestions(val, setWaypointSuggestions, setWaypointLoading);
      }
    } else {
      waypointTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(val, setWaypointSuggestions, setWaypointLoading);
      }, 250);
    }
  };

  const filteredOriginSuggestions = getSortedSuggestions(originSuggestions, originQuery);
  const filteredDestSuggestions = getSortedSuggestions(destSuggestions, destQuery);
  const filteredWaypointSuggestions = getSortedSuggestions(waypointSuggestions, waypointQuery);

  const originListToRender = originQuery.trim() === '' ? recentSearches : filteredOriginSuggestions;
  const destListToRender = destQuery.trim() === '' ? recentSearches : filteredDestSuggestions;
  const waypointListToRender = waypointQuery.trim() === '' ? recentSearches : filteredWaypointSuggestions;

  const handleOriginKeyDown = (e) => {
    if (originListToRender.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOriginActiveIndex(prev => (prev + 1) % originListToRender.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOriginActiveIndex(prev => (prev - 1 + originListToRender.length) % originListToRender.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (originActiveIndex >= 0 && originActiveIndex < originListToRender.length) {
        selectOrigin(originListToRender[originActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      setOriginSuggestions([]);
      setOriginActiveIndex(-1);
      setOriginFocused(false);
    }
  };

  const handleDestKeyDown = (e) => {
    if (destListToRender.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestActiveIndex(prev => (prev + 1) % destListToRender.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestActiveIndex(prev => (prev - 1 + destListToRender.length) % destListToRender.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (destActiveIndex >= 0 && destActiveIndex < destListToRender.length) {
        selectDest(destListToRender[destActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      setDestSuggestions([]);
      setDestActiveIndex(-1);
      setDestFocused(false);
    }
  };

  const handleWaypointKeyDown = (e) => {
    if (waypointListToRender.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setWaypointActiveIndex(prev => (prev + 1) % waypointListToRender.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setWaypointActiveIndex(prev => (prev - 1 + waypointListToRender.length) % waypointListToRender.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (waypointActiveIndex >= 0 && waypointActiveIndex < waypointListToRender.length) {
        selectWaypoint(waypointListToRender[waypointActiveIndex]);
      }
    } else if (e.key === 'Escape') {
      setWaypointSuggestions([]);
      setWaypointActiveIndex(-1);
      setWaypointFocused(false);
    }
  };

  const swapRoutes = () => {
    setForm(prev => {
      const newOrigin = prev.destination;
      const newDest = prev.origin;
      const newOriginCoords = prev.destCoords;
      const newDestCoords = prev.originCoords;
      return {
        ...prev,
        origin: newOrigin,
        destination: newDest,
        originCoords: newOriginCoords,
        destCoords: newDestCoords
      };
    });
    setOriginQuery(destQuery);
    setDestQuery(originQuery);
    toast.success('Route endpoints swapped! ⇅');
  };

  const handlePresetClick = (preset) => {
    setOriginQuery(preset.originShort || preset.origin.split(',')[0]);
    setDestQuery(preset.destShort || preset.dest.split(',')[0]);
    setForm(prev => ({
      ...prev,
      origin: preset.origin,
      destination: preset.dest,
      originCoords: preset.coords?.o || preset.originCoords,
      destCoords: preset.coords?.d || preset.destCoords
    }));
    toast.success(`Loaded preset: ${preset.label}!`);
  };

  const useGPSForField = (field) => {
    if (!navigator.geolocation) return toast.error('GPS not supported on this browser');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lon: longitude });

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
          headers: { 'User-Agent': 'FinBuddy/1.0' }
        });
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',')
            .map(part => part.trim())
            .filter(part => part && part !== 'India')
            .slice(0, 3);
          const short = parts.join(', ');
          const formattedItem = {
            primary: parts[0] || '',
            secondary: parts.slice(1).join(', '),
            display: short,
            full: data.display_name,
            lat: latitude,
            lon: longitude
          };

          if (field === 'origin') {
            setForm(f => ({ ...f, origin: data.display_name, originCoords: { lat: latitude, lon: longitude } }));
            setOriginQuery(short);
            saveRecentSearch(formattedItem);
          } else if (field === 'waypoint') {
            setForm(f => ({ ...f, waypoint: data.display_name, waypointCoords: { lat: latitude, lon: longitude } }));
            setWaypointQuery(short);
            saveRecentSearch(formattedItem);
          } else {
            setForm(f => ({ ...f, destination: data.display_name, destCoords: { lat: latitude, lon: longitude } }));
            setDestQuery(short);
            saveRecentSearch(formattedItem);
          }
          toast.success(`Live GPS coordinates set for ${field}!`);
        }
      } catch {
        toast.error('Could not translate coordinates');
      }
      setGpsLoading(false);
    }, () => {
      toast.error('GPS permission denied');
      setGpsLoading(false);
    });
  };

  const startVoiceInput = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (listeningField === field) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListeningField(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setListeningField(field);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (field === 'origin') {
            handleOriginChange(transcript);
          } else if (field === 'waypoint') {
            handleWaypointChange(transcript);
          } else {
            handleDestChange(transcript);
          }
          toast.success(`Voice input: "${transcript}"`);
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'aborted') {
          toast.error('Voice recognition error');
        }
        setListeningField(null);
      };

      recognition.onend = () => {
        setListeningField(null);
      };

      recognition.start();
    } catch (err) {
      toast.error('Speech service failed to start');
      setListeningField(null);
    }
  };

  const toggleFavoriteRoute = () => {
    if (!result) return;
    
    const isFavorite = savedRoutes.some(
      fav => fav.origin === form.origin && fav.destination === form.destination
    );

    if (isFavorite) {
      const updated = savedRoutes.filter(
        fav => !(fav.origin === form.origin && fav.destination === form.destination)
      );
      setSavedRoutes(updated);
      localStorage.setItem('finbuddy_saved_routes', JSON.stringify(updated));
      toast.success('Removed from favorites! ☆');
    } else {
      const newFavorite = {
        label: `${originQuery.split(',')[0]} ➔ ${destQuery.split(',')[0]}`,
        origin: form.origin,
        destination: form.destination,
        originShort: originQuery,
        destShort: destQuery,
        originCoords: form.originCoords,
        destCoords: form.destCoords,
        vehicleType: form.vehicleType,
        fuelPrice: form.fuelPrice,
        avoidPolice: form.avoidPolice
      };
      const updated = [...savedRoutes, newFavorite].slice(0, 10);
      setSavedRoutes(updated);
      localStorage.setItem('finbuddy_saved_routes', JSON.stringify(updated));
      toast.success('Saved to favorites! ⭐');
    }
  };

  const shareRoute = (r) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(form.origin)}&destination=${encodeURIComponent(form.destination)}&travelmode=driving`;
    const shareText = `Stealth Fuel Route: ${originQuery.split(',')[0]} to ${destQuery.split(',')[0]}\nDistance: ${r.distance}\nDuration: ${r.duration}\nEst. Fuel Cost: ${r.fuelCost}\nCheck it out:`;

    if (navigator.share) {
      navigator.share({
        title: 'FinBuddy Route',
        text: shareText,
        url: googleMapsUrl
      })
      .then(() => toast.success('Route shared! 📤'))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          toast.error('Sharing failed');
        }
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${googleMapsUrl}`)
        .then(() => toast.success('Route details & link copied to clipboard! 📋'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  const plan = async () => {
    const trimmedOrigin = form.origin?.trim();
    const trimmedDest = form.destination?.trim();
    const trimmedWaypoint = showWaypoint ? form.waypoint?.trim() : undefined;
    if (!trimmedOrigin || !trimmedDest) return toast.error('Enter origin & destination');
    setLoading(true);
    setResult(null);
    setEmuRouteIdx(null);
    setEmuProgress(0);
    setEmulating(false);
    setActiveRouteIdx(0);
    try {
      const { data } = await api.post('/smart/route', {
        ...form,
        origin: trimmedOrigin,
        destination: trimmedDest,
        waypoint: trimmedWaypoint
      });
      setResult(data);
      setActiveRouteIdx(data.recommended !== undefined ? data.recommended : 0);
      setTimeout(() => {
        const resultsEl = document.getElementById('route-results-grid');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } catch { toast.error('Route calculation failed'); }
    setLoading(false);
  };

  const emuEventTimerRef = useRef(null);

  const pauseEmulator = () => {
    if (emulatorIntervalRef.current) clearInterval(emulatorIntervalRef.current);
    if (emuEventTimerRef.current) {
      clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = null;
    }
    setEmuPaused(true);
    setEmuSpeed(0);
    setEmuLog('Simulation paused. Vehicle idling... 🛑');
  };

  const resumeEmulator = () => {
    if (!emulating || !emuPaused) return;
    setEmuPaused(false);
    setEmuLog('Resuming simulation drive... 🚗');
    // If an event was active when paused, re-start its timeout reaction window
    if (emuEvent) {
      if (emuEventTimerRef.current) clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = setTimeout(() => {
        handleEventTimeout(emuEvent);
      }, 4000);
    }
    startEmulatorLoop(emuRouteIdx, emuInitialDurationRef.current);
  };

  const stopEmulator = () => {
    if (emulatorIntervalRef.current) clearInterval(emulatorIntervalRef.current);
    if (emuEventTimerRef.current) {
      clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = null;
    }
    setEmulating(false);
    setEmuPaused(false);
    setEmuRouteIdx(null);
    setEmuProgress(0);
    setEmuSpeed(0);
    setEmuFuel(100);
    setEmuEta(0);
    setDecoyDeployed(false);
    setJammerActive(false);
    setActiveXP(0);
    setEmuCoins(100);
    setEmuEvent(null);
    setEmuActiveStepIdx(0);
    setEmuRefuelsCount(0);
    setEmuTrapsEvaded(0);
    setEmuThrottle(60);
    setEmuSavingTrip(false);

    emuCoinsRef.current = 100;
    emuEventRef.current = null;
    emuActiveStepIdxRef.current = 0;
    emuRefuelsCountRef.current = 0;
    emuTrapsEvadedRef.current = 0;
    emuThrottleRef.current = 60;
    emuSpeedRef.current = 60;
    emuFuelRef.current = 100;
    jammerActiveRef.current = false;
    decoyDeployedRef.current = false;

    setEmuLog('Simulation terminated. System reset. 🛑');
    toast.info('Emulator stopped and reset.');
  };

  const handleEventTimeout = (type) => {
    const isJammed = jammerActiveRef.current;
    const currentSpeed = emuSpeedRef.current;
    
    if (type === 'speed_trap') {
      if (isJammed) {
        setEmuEvent(null);
        emuEventRef.current = null;
        setEmuTrapsEvaded(t => {
          const nextVal = t + 1;
          emuTrapsEvadedRef.current = nextVal;
          return nextVal;
        });
        setEmuLog('⚡ [JAMMER SUCCESS] Speed radar jammed successfully! Passed patrol zone.');
      } else if (currentSpeed <= 45) {
        setEmuEvent(null);
        emuEventRef.current = null;
        setEmuLog(`✅ [COMPLIANCE] Bypassed speed camera zone at safe speed (${currentSpeed} km/h). No ticket issued.`);
        setActiveXP(xp => xp + 10);
        toast.success('Safe Speed Compliance! +10 XP');
      } else {
        setEmuEvent(null);
        emuEventRef.current = null;
        setEmuCoins(c => {
          const nextCoins = Math.max(0, c - 15);
          emuCoinsRef.current = nextCoins;
          return nextCoins;
        });
        playTelemetrySound('penalty');
        setEmuLog(`❌ [SPEEDING CITATION] Caught driving at ${currentSpeed} km/h in radar zone! -15 FinCoins penalty.`);
        toast.error('Speeding Citation Issued! -15 FinCoins');
      }
    } else if (type === 'toll_plaza') {
      setEmuEvent(null);
      emuEventRef.current = null;
      setEmuCoins(c => {
        const nextCoins = Math.max(0, c - 15);
        emuCoinsRef.current = nextCoins;
        return nextCoins;
      });
      playTelemetrySound('warning');
      setEmuLog('⚠️ [AUTO-DEBIT] FASTag payment timed out. Auto-debited 15 FinCoins (includes 5 coin penalty fee).');
      toast.info('Toll Auto-Debited: -15 FinCoins');
    }
  };

  const handlePayToll = () => {
    if (emuCoins < 10) {
      toast.error('Insufficient FinCoins for toll!');
      return;
    }
    if (emuEventTimerRef.current) {
      clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = null;
    }
    setEmuCoins(c => {
      const nextCoins = c - 10;
      emuCoinsRef.current = nextCoins;
      return nextCoins;
    });
    setEmuEvent(null);
    emuEventRef.current = null;
    playTelemetrySound('success');
    setEmuLog('🎫 FASTag Gate Cleared. Toll payment of 10 FinCoins processed.');
    toast.success('Toll Paid! -10 FinCoins');
  };

  const handleRefuel = () => {
    if (emuCoins < 15) {
      toast.error('Insufficient FinCoins for refuel!');
      return;
    }
    setEmuCoins(c => {
      const nextCoins = c - 15;
      emuCoinsRef.current = nextCoins;
      return nextCoins;
    });
    setEmuFuel(100);
    emuFuelRef.current = 100;
    setEmuRefuelsCount(r => {
      const nextCount = r + 1;
      emuRefuelsCountRef.current = nextCount;
      return nextCount;
    });
    setEmuEvent(null);
    emuEventRef.current = null;
    playTelemetrySound('refuel');
    setEmuLog('⛽ Refueling complete. Fuel tank replenished to 100%. -15 FinCoins.');
    toast.success('Refueled! -15 FinCoins');
  };

  const startEmulatorLoop = (routeIdx, initialDuration) => {
    const r = result.routes[routeIdx];
    const stepsCount = r.steps?.length || 0;
    let lastStepIdx = -1;

    emulatorIntervalRef.current = setInterval(() => {
      const throttle = emuThrottleRef.current;
      const isJammed = jammerActiveRef.current;
      const currentEvent = emuEventRef.current;

      let speed = throttle;
      if (currentEvent === 'speed_trap' && !isJammed) {
        speed = 20;
      } else if (currentEvent === 'toll_plaza') {
        speed = 5;
      } else if (currentEvent === 'fuel_refill') {
        speed = 40;
      }
      emuSpeedRef.current = speed;
      setEmuSpeed(speed);

      setEmuProgress(p => {
        const isEventActive = emuEventRef.current !== null;
        const speedFactor = speed / 80;
        const progressInc = isEventActive ? 1 : Math.max(2, Math.round(5 * speedFactor));
        const nextProgress = p + progressInc;

        if (nextProgress >= 100) {
          clearInterval(emulatorIntervalRef.current);
          setEmulating(false);
          setEmuPaused(false);
          setEmuSpeed(0);
          setEmuEvent(null);
          emuEventRef.current = null;
          
          if (emuEventTimerRef.current) {
            clearTimeout(emuEventTimerRef.current);
            emuEventTimerRef.current = null;
          }
          setEmuEta(0);
          setEmuCoins(c => {
            const nextCoins = c + 50;
            emuCoinsRef.current = nextCoins;
            return nextCoins;
          });
          setEmuCompleted(true);
          setEmuLog(`Arrived at destination: ${form.destination.split(',')[0]}! +50 FinCoins earned! 🏆`);
          toast.success('Stealth Drive Completed! +50 FinCoins earned! 🪙');
          playTelemetrySound('success');
          return 100;
        }

        const stepIdx = Math.min(stepsCount - 1, Math.floor((nextProgress / 100) * stepsCount));
        const currentStep = r.steps && r.steps[stepIdx];

        if (stepIdx !== lastStepIdx && currentStep) {
          lastStepIdx = stepIdx;
          setEmuActiveStepIdx(stepIdx);
          emuActiveStepIdxRef.current = stepIdx;

          const stepEl = document.getElementById(`emu-step-${stepIdx}`);
          if (stepEl) {
            stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          const instLower = currentStep.instruction.toLowerCase();

          if (emuEventRef.current === null) {
            if (instLower.includes('police') || instLower.includes('checkpoint') || instLower.includes('naka')) {
              setEmuEvent('speed_trap');
              emuEventRef.current = 'speed_trap';
              playTelemetrySound('alert');
              setEmuLog(`🚨 SPEED TRAP ahead near ${currentStep.instruction}! Scramble radar (15 FinCoins) or slow throttle <45 km/h!`);
              if (emuEventTimerRef.current) clearTimeout(emuEventTimerRef.current);
              emuEventTimerRef.current = setTimeout(() => {
                handleEventTimeout('speed_trap');
              }, 4000);
            } else if (instLower.includes('toll') || instLower.includes('gate') || instLower.includes('plaza')) {
              setEmuEvent('toll_plaza');
              emuEventRef.current = 'toll_plaza';
              playTelemetrySound('alert');
              setEmuLog(`🎫 FASTag Toll Plaza ahead. Authorize payment (10 FinCoins) or pay extra auto-debit penalty.`);
              if (emuEventTimerRef.current) clearTimeout(emuEventTimerRef.current);
              emuEventTimerRef.current = setTimeout(() => {
                handleEventTimeout('toll_plaza');
              }, 4000);
            }
          }
        }

        if (emuEventRef.current === null && Math.random() < 0.04 && nextProgress > 10 && nextProgress < 90 && nextProgress % 15 === 0) {
          setEmuEvent('speed_trap');
          emuEventRef.current = 'speed_trap';
          playTelemetrySound('alert');
          setEmuLog('🚨 SATELLITE WARNING: Mobile speed radar checkpoint detected ahead! Scramble radar or slow down!');
          if (emuEventTimerRef.current) clearTimeout(emuEventTimerRef.current);
          emuEventTimerRef.current = setTimeout(() => {
            handleEventTimeout('speed_trap');
          }, 4000);
        }

        if (emuEventRef.current === null) {
          if (p === 0) {
            setEmuLog(`Departing origin: ${form.origin.split(',')[0]}. GPS link established. 🚗`);
          } else if (currentStep) {
            setEmuLog(`Cruising route vector: ${currentStep.instruction} (${currentStep.distance}). 🛣️`);
          } else {
            setEmuLog('Telemetry sync stable. Drive path clear. 🛰️');
          }
        }

        const speedFuelMultiplier = speed > 95 ? 1.6 : (speed < 50 ? 0.75 : 1.0);
        const distanceStep = parseDistanceKm(r.distance) / stepsCount;
        const fuelConsumption = (distanceStep / 400) * 100 * speedFuelMultiplier;

        setEmuFuel(f => {
          const nextFuel = Math.max(0, f - fuelConsumption);
          emuFuelRef.current = nextFuel;

          if (nextFuel < 20 && nextFuel > 0 && emuEventRef.current === null) {
            setEmuEvent('fuel_refill');
            emuEventRef.current = 'fuel_refill';
            playTelemetrySound('warning');
            setEmuLog(`⛽ FUEL RESERVES LOW (${Math.round(nextFuel)}%)! Click "Refuel at Station" (costs 15 FinCoins) to avoid stalling!`);
          }

          if (nextFuel <= 0) {
            clearInterval(emulatorIntervalRef.current);
            setEmulating(false);
            setEmuPaused(false);
            setEmuSpeed(0);
            setEmuEvent(null);
            emuEventRef.current = null;
            if (emuEventTimerRef.current) {
              clearTimeout(emuEventTimerRef.current);
              emuEventTimerRef.current = null;
            }
            setEmuFailed(true);
            setEmuLog('❌ VEHICLE OUT OF FUEL! Stalled on highway. Telemetry disconnected. 🛑');
            toast.error('Simulation Failed: Fuel Cell Empty!');
            playTelemetrySound('penalty');
          }
          return nextFuel;
        });

        setEmuEta(Math.round(initialDuration * (1 - nextProgress / 100)));

        return nextProgress;
      });
    }, 1200);
  };

  const runEmulator = (routeIdx) => {
    if (!result) return;
    const r = result.routes[routeIdx];
    const initialDuration = parseInt(r.duration) || 30;

    if (emulatorIntervalRef.current) clearInterval(emulatorIntervalRef.current);
    if (emuEventTimerRef.current) {
      clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = null;
    }

    setEmuRouteIdx(routeIdx);
    setEmulating(true);
    setEmuPaused(false);
    setEmuProgress(0);
    setEmuSpeed(60);
    setEmuFuel(100);
    setEmuEta(initialDuration);
    setDecoyDeployed(false);
    setJammerActive(false);
    setActiveXP(0);
    setEmuCoins(100);
    setEmuEvent(null);
    setEmuActiveStepIdx(0);
    setEmuRefuelsCount(0);
    setEmuTrapsEvaded(0);
    setEmuThrottle(60);
    setEmuSavingTrip(false);
    setEmuCompleted(false);
    setEmuFailed(false);

    emuCoinsRef.current = 100;
    emuEventRef.current = null;
    emuActiveStepIdxRef.current = 0;
    emuRefuelsCountRef.current = 0;
    emuTrapsEvadedRef.current = 0;
    emuThrottleRef.current = 60;
    emuSpeedRef.current = 60;
    emuFuelRef.current = 100;
    jammerActiveRef.current = false;
    decoyDeployedRef.current = false;

    setEmuLog('Connecting to GPS satellite mesh... 🗺️');
    playTelemetrySound('start');

    emuStepRef.current = 0;
    emuInitialDurationRef.current = initialDuration;

    startEmulatorLoop(routeIdx, initialDuration);
  };

  const handleJamRadar = () => {
    if (jammerActive) return;
    if (emuCoins < 15) {
      toast.error('Insufficient FinCoins for Jammer!');
      return;
    }
    if (emuEventTimerRef.current && emuEventRef.current === 'speed_trap') {
      clearTimeout(emuEventTimerRef.current);
      emuEventTimerRef.current = null;
    }
    setEmuCoins(c => {
      const nextCoins = c - 15;
      emuCoinsRef.current = nextCoins;
      return nextCoins;
    });
    setJammerActive(true);
    jammerActiveRef.current = true;
    playTelemetrySound('jam');
    setEmuLog('⚡ [JAMMER ACTIVE] Scrambling active speed radar frequencies. Bypassing traps...');
    setActiveXP(xp => xp + 15);
    toast.success('Speed Radar Jammed! +15 XP ⚡');
    
    if (emuEventRef.current === 'speed_trap') {
      setEmuEvent(null);
      emuEventRef.current = null;
      setEmuTrapsEvaded(t => {
        const nextVal = t + 1;
        emuTrapsEvadedRef.current = nextVal;
        return nextVal;
      });
    }

    setTimeout(() => {
      setJammerActive(false);
      jammerActiveRef.current = false;
    }, 4500);
  };

  const handleDeployDecoy = () => {
    if (decoyDeployed) return;
    if (emuCoins < 25) {
      toast.error('Insufficient FinCoins for Decoy!');
      return;
    }
    setEmuCoins(c => {
      const nextCoins = c - 25;
      emuCoinsRef.current = nextCoins;
      return nextCoins;
    });
    setDecoyDeployed(true);
    decoyDeployedRef.current = true;
    playTelemetrySound('alert');
    setEmuLog('🕵️ [DECOY DEPLOYED] Decoy beacon redirected patrol cruisers. Safety rating enhanced (+10%).');
    setActiveXP(xp => xp + 25);
    toast.success('Decoy deployed! +25 XP 🕵️');
    if (result) {
      setResult(prev => ({
        ...prev,
        routes: prev.routes.map((rt, idx) => idx === activeRouteIdx ? { ...rt, safetyScore: Math.min(100, rt.safetyScore + 10) } : rt)
      }));
    }
  };

  const handleSaveToTripVault = () => {
    setEmuSavingTrip(true);
    playTelemetrySound('alert');
    setTimeout(() => {
      setEmuSavingTrip(false);
      playTelemetrySound('success');
      toast.success('Stealth trip profile successfully exported to Trip Vault!');
    }, 1500);
  };

  const parseDistanceKm = (distStr) => {
    return parseFloat(distStr?.replace(' km', '')) || 0;
  };

  const showOriginDropdown = originFocused && (
    originLoading ||
    originQuery.trim() === '' ||
    originListToRender.length > 0 ||
    (originQuery.trim().length > 0 && originQuery.trim().length < 3)
  );

  const showDestDropdown = destFocused && (
    destLoading ||
    destQuery.trim() === '' ||
    destListToRender.length > 0 ||
    (destQuery.trim().length > 0 && destQuery.trim().length < 3)
  );

  const showWaypointDropdown = waypointFocused && (
    waypointLoading ||
    waypointQuery.trim() === '' ||
    waypointListToRender.length > 0 ||
    (waypointQuery.trim().length > 0 && waypointQuery.trim().length < 3)
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <style>{`
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="card space-y-4 bg-white/5 border border-white/5 overflow-visible">
        <h3 className="font-bold text-xl text-white">🗺️ Stealth Fuel Router</h3>
        <p className="text-sm text-slate-400">Generate driving routes, estimate exact fuel costs, calculate monthly commute cost calendar, and active Toll/Patrol Checkpoints.</p>
        
        {/* Quick Launch Presets & Saved Routes */}
        <div className="flex flex-col gap-2 border-b border-white/5 pb-2.5">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Quick Presets:</span>
            {[
              { label: 'Bandra ➔ Pune', origin: 'Bandra, Mumbai', dest: 'Pune, Maharashtra', coords: { o: {lat: 19.0596, lon: 72.8295}, d: {lat: 18.5204, lon: 73.8567} } },
              { label: 'Trichy ➔ Chennai', origin: 'Tiruchirappalli, Tamil Nadu', dest: 'Chennai, Tamil Nadu', coords: { o: {lat: 10.7905, lon: 78.7047}, d: {lat: 13.0827, lon: 80.2707} } },
              { label: 'Delhi ➔ Noida Sec 62', origin: 'Connaught Place, New Delhi', dest: 'Noida Sector 62, Uttar Pradesh', coords: { o: {lat: 28.6304, lon: 77.2177}, d: {lat: 28.6219, lon: 77.3794} } },
              { label: 'BLR Airport ➔ E-City', origin: 'Kempegowda International Airport, Bengaluru', dest: 'Electronic City, Bengaluru', coords: { o: {lat: 13.1986, lon: 77.7066}, d: {lat: 12.8399, lon: 77.6770} } }
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-black rounded-lg transition"
              >
                📍 {preset.label}
              </button>
            ))}
          </div>

          {savedRoutes.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-white/5 mt-1 animate-fade-in">
              <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-wider flex items-center gap-1">⭐ Saved Routes:</span>
              {savedRoutes.map((route, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1.5 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-[10px] font-bold rounded-lg px-2.5 py-1 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOriginQuery(route.originShort);
                      setDestQuery(route.destShort);
                      setForm({
                        origin: route.origin,
                        destination: route.destination,
                        originCoords: route.originCoords,
                        destCoords: route.destCoords,
                        vehicleType: route.vehicleType || 'car',
                        fuelPrice: route.fuelPrice || 106,
                        avoidPolice: route.avoidPolice || false
                      });
                      toast.success(`Loaded favorite: ${route.label}!`);
                    }}
                    className="hover:underline flex items-center gap-1"
                  >
                    {route.label}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = savedRoutes.filter((_, i) => i !== idx);
                      setSavedRoutes(updated);
                      localStorage.setItem('finbuddy_saved_routes', JSON.stringify(updated));
                      toast.success('Removed favorite route');
                    }}
                    className="text-red-400 hover:text-red-300 font-black ml-1 select-none"
                    title="Remove Favorite"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-stretch relative">
          {/* Left Part: Route Inputs Stack */}
          <div className="flex-1 relative flex flex-col gap-4">
            {/* Left Visual Timeline Line */}
            <div 
              className="absolute left-[15px] w-0.5 border-l-2 border-dashed border-cyan-500/25 pointer-events-none" 
              style={{
                top: '20px',
                bottom: '20px',
              }}
            />

            {/* Origin Field */}
            <div className="flex items-center gap-3 relative pl-9">
              {/* Visual Indicator: Origin Node */}
              <span className="absolute left-[8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 bg-slate-950 flex items-center justify-center z-10 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </span>
              <div ref={originWrapperRef} className="relative flex items-center w-full">
                <input 
                  ref={originInputRef}
                  className={`input-dark bg-black/20 w-full pr-20 transition-all duration-200 ${form.originCoords ? 'border-emerald-500/30 shadow-emerald-950/10 shadow-inner' : ''}`}
                  placeholder="Origin (Alt+O) (e.g. Bandra, Mumbai)" 
                  value={originQuery || form.origin} 
                  onChange={e => handleOriginChange(e.target.value)} 
                  onFocus={() => setOriginFocused(true)}
                  onKeyDown={handleOriginKeyDown}
                  role="combobox"
                  aria-expanded={showOriginDropdown}
                  aria-autocomplete="list"
                  aria-controls="origin-suggestions-list"
                  aria-activedescendant={originActiveIndex >= 0 ? `origin-option-${originActiveIndex}` : undefined}
                />

                {/* Input Action Group (Tick + Mic + Clear/GPS/Spinner) */}
                <div className="absolute right-3 flex items-center gap-2">
                  {form.originCoords && !originLoading && (
                    <span className="text-emerald-400 text-[10px] font-black flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded select-none animate-fade-in shrink-0" title="Selection Confirmed">
                      ✓
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => startVoiceInput('origin')}
                    className={`text-sm hover:scale-110 active:scale-95 transition-all shrink-0 ${
                      listeningField === 'origin' ? 'text-rose-500 animate-pulse font-black scale-110' : 'text-slate-400 hover:text-rose-400'
                    }`}
                    title="Voice Search"
                  >
                    🎤
                  </button>

                  {originLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex items-center justify-center shrink-0" />
                  ) : (originQuery || form.origin) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginQuery('');
                        setForm(prev => ({ ...prev, origin: '', originCoords: null }));
                        setOriginSuggestions([]);
                        setOriginActiveIndex(-1);
                      }}
                      className="text-slate-400 hover:text-red-400 transition-colors text-xs font-bold flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10 shrink-0"
                      title="Clear Origin"
                    >
                      ✕
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => useGPSForField('origin')}
                      disabled={gpsLoading}
                      title="Use Live GPS Coordinates"
                      className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center justify-center shrink-0"
                    >
                      {gpsLoading ? '⏳' : '🎯'}
                    </button>
                  )}
                </div>

                {/* Origin Autocomplete Suggestions Listbox */}
                {showOriginDropdown && (
                  <div 
                    id="origin-suggestions-list"
                    role="listbox"
                    className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-slate-950/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-slide-down"
                  >
                    <div className="flex-1 overflow-y-auto scrollbar-thin-premium max-h-[220px]">
                      {originLoading ? (
                        <div className="divide-y divide-white/5 animate-pulse bg-slate-950/40">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="px-4 py-3 flex flex-col gap-1.5 select-none">
                              <div className="h-3 bg-white/10 rounded w-1/3" />
                              <div className="h-2 bg-white/5 rounded w-1/2" />
                            </div>
                          ))}
                        </div>
                      ) : originQuery.trim() === '' ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => useGPSForField('origin')}
                            disabled={gpsLoading}
                            className="w-full text-left px-4 py-3 text-xs text-cyan-400 hover:bg-white/5 flex items-center gap-2.5 font-bold border-b border-white/5 transition-all select-none"
                          >
                            <span className="shrink-0 text-sm">{gpsLoading ? '⏳' : '📍'}</span>
                            <span className="truncate">{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                          </button>

                          {recentSearches.length > 0 && (
                            <>
                              <div className="px-4 py-1.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-white/5 bg-white/2 select-none">
                                🕐 Recent Searches
                              </div>
                              {recentSearches.map((s, idx) => {
                                const isActive = idx === originActiveIndex;
                                const primary = s.primary || s.display.split(', ')[0] || '';
                                const secondary = s.secondary || s.display.split(', ').slice(1).join(', ') || '';
                                return (
                                  <button
                                    key={idx}
                                    id={`origin-option-${idx}`}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => selectOrigin(s)}
                                    className={`w-full text-left px-4 py-2.5 text-xs transition-all duration-150 border-b border-white/5 last:border-0 flex items-center gap-2.5 ${
                                      isActive
                                        ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 pl-3 font-semibold'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    <span className="shrink-0 text-[10px] text-slate-500">🕐</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-white font-medium">{primary}</span>
                                      {secondary && <span className="truncate text-[10px] text-slate-500 mt-0.5">{secondary}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      ) : originQuery.trim().length > 0 && originQuery.trim().length < 3 ? (
                        <div className="px-4 py-3 text-xs text-slate-400 bg-slate-950/90 flex items-center gap-2 select-none font-medium">
                          💡 Type {3 - originQuery.trim().length} more character${3 - originQuery.trim().length > 1 ? 's' : ''} to search...
                        </div>
                      ) : filteredOriginSuggestions.length > 0 ? (
                        (() => {
                          const grouped = groupSuggestions(filteredOriginSuggestions);
                          let globalIdx = -1;
                          return (
                            <div className="flex flex-col">
                              {grouped.nearby.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest bg-cyan-950/20 border-b border-white/5 select-none flex items-center justify-between">
                                    <span>📍 Nearby Locations</span>
                                    <span className="text-[8px] opacity-65">within 30 km</span>
                                  </div>
                                  {grouped.nearby.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === originActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'origin');
                                  })}
                                </>
                              )}
                              {grouped.cities.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/20 border-b border-white/5 select-none">
                                    🏙️ Cities & Regions
                                  </div>
                                  {grouped.cities.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === originActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'origin');
                                  })}
                                </>
                              )}
                              {grouped.other.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-amber-400 font-extrabold uppercase tracking-widest bg-amber-950/20 border-b border-white/5 select-none">
                                    🗺️ Other Results
                                  </div>
                                  {grouped.other.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === originActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'origin');
                                  })}
                                </>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 italic bg-slate-950/90 flex items-center gap-2 select-none">
                          🔍 No matching locations found
                        </div>
                      )}
                    </div>
                    {originListToRender.length > 0 && !originLoading && (
                      <div className="px-4 py-1.5 bg-black/60 border-t border-white/5 text-[9px] text-slate-500 flex justify-between items-center select-none font-medium shrink-0">
                        <span>Press <b>↑↓</b> to navigate</span>
                        <span><b>Enter</b> to select</span>
                        <span><b>Esc</b> to close</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Waypoint Field (if active) */}
            {showWaypoint && (
              <div className="flex items-center gap-3 relative pl-9">
                {/* Visual Indicator: Waypoint Node */}
                <span className="absolute left-[8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-amber-400 bg-slate-950 flex items-center justify-center z-10 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </span>
                <div ref={waypointWrapperRef} className="relative flex items-center w-full">
                  <input 
                    ref={waypointInputRef}
                    className={`input-dark bg-black/20 w-full pr-20 transition-all duration-200 ${form.waypointCoords ? 'border-emerald-500/30 shadow-emerald-950/10 shadow-inner' : ''}`}
                    placeholder="Waypoint (Intermediate Stop) (e.g. Navi Mumbai)" 
                    value={waypointQuery || form.waypoint} 
                    onChange={e => handleWaypointChange(e.target.value)} 
                    onFocus={() => setWaypointFocused(true)}
                    onKeyDown={handleWaypointKeyDown}
                    role="combobox"
                    aria-expanded={showWaypointDropdown}
                    aria-autocomplete="list"
                    aria-controls="waypoint-suggestions-list"
                    aria-activedescendant={waypointActiveIndex >= 0 ? `waypoint-option-${waypointActiveIndex}` : undefined}
                  />

                  <div className="absolute right-3 flex items-center gap-2">
                    {form.waypointCoords && !waypointLoading && (
                      <span className="text-emerald-400 text-[10px] font-black flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded select-none animate-fade-in shrink-0" title="Selection Confirmed">
                        ✓
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => startVoiceInput('waypoint')}
                      className={`text-sm hover:scale-110 active:scale-95 transition-all shrink-0 ${
                        listeningField === 'waypoint' ? 'text-rose-500 animate-pulse font-black scale-110' : 'text-slate-400 hover:text-rose-400'
                      }`}
                      title="Voice Search"
                    >
                      🎤
                    </button>

                    {waypointLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex items-center justify-center shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setWaypointQuery('');
                          setForm(prev => ({ ...prev, waypoint: '', waypointCoords: null }));
                          setShowWaypoint(false);
                          setWaypointSuggestions([]);
                          setWaypointActiveIndex(-1);
                        }}
                        className="text-slate-400 hover:text-red-400 transition-colors text-xs font-bold flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10 shrink-0"
                        title="Remove Waypoint"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {showWaypointDropdown && (
                    <div 
                      id="waypoint-suggestions-list"
                      role="listbox"
                      className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-slate-950/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-slide-down"
                    >
                      <div className="flex-1 overflow-y-auto scrollbar-thin-premium max-h-[220px]">
                        {waypointLoading ? (
                          <div className="divide-y divide-white/5 animate-pulse bg-slate-950/40">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="px-4 py-3 flex flex-col gap-1.5 select-none">
                                <div className="h-3 bg-white/10 rounded w-1/3" />
                                <div className="h-2 bg-white/5 rounded w-1/2" />
                              </div>
                            ))}
                          </div>
                        ) : waypointQuery.trim() === '' ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => useGPSForField('waypoint')}
                              disabled={gpsLoading}
                              className="w-full text-left px-4 py-3 text-xs text-cyan-400 hover:bg-white/5 flex items-center gap-2.5 font-bold border-b border-white/5 transition-all select-none"
                            >
                              <span className="shrink-0 text-sm">{gpsLoading ? '⏳' : '📍'}</span>
                              <span className="truncate">{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                            </button>

                            {recentSearches.length > 0 && (
                              <>
                                <div className="px-4 py-1.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-white/5 bg-white/2 select-none">
                                  🕐 Recent Searches
                                </div>
                                {recentSearches.map((s, idx) => {
                                  const isActive = idx === waypointActiveIndex;
                                  const primary = s.primary || s.display.split(', ')[0] || '';
                                  const secondary = s.secondary || s.display.split(', ').slice(1).join(', ') || '';
                                  return (
                                    <button
                                      key={idx}
                                      id={`waypoint-option-${idx}`}
                                      type="button"
                                      role="option"
                                      aria-selected={isActive}
                                      onClick={() => selectWaypoint(s)}
                                      className={`w-full text-left px-4 py-2.5 text-xs transition-all duration-150 border-b border-white/5 last:border-0 flex items-center gap-2.5 ${
                                        isActive
                                          ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 pl-3 font-semibold'
                                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      <span className="shrink-0 text-[10px] text-slate-500">🕐</span>
                                      <div className="flex flex-col min-w-0">
                                        <span className="truncate text-white font-medium">{primary}</span>
                                        {secondary && <span className="truncate text-[10px] text-slate-500 mt-0.5">{secondary}</span>}
                                      </div>
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        ) : waypointQuery.trim().length > 0 && waypointQuery.trim().length < 3 ? (
                          <div className="px-4 py-3 text-xs text-slate-400 bg-slate-950/90 flex items-center gap-2 select-none font-medium">
                            💡 Type {3 - waypointQuery.trim().length} more character${3 - waypointQuery.trim().length > 1 ? 's' : ''} to search...
                          </div>
                        ) : filteredWaypointSuggestions.length > 0 ? (
                          (() => {
                            const grouped = groupSuggestions(filteredWaypointSuggestions);
                            let globalIdx = -1;
                            return (
                              <div className="flex flex-col">
                                {grouped.nearby.length > 0 && (
                                  <>
                                    <div className="px-4 py-1 text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest bg-cyan-950/20 border-b border-white/5 select-none flex items-center justify-between">
                                      <span>📍 Nearby Locations</span>
                                      <span className="text-[8px] opacity-65">within 30 km</span>
                                    </div>
                                    {grouped.nearby.map((s) => {
                                      globalIdx++;
                                      const isCurrentActive = globalIdx === waypointActiveIndex;
                                      return renderSuggestionRow(s, globalIdx, isCurrentActive, 'waypoint');
                                    })}
                                  </>
                                )}
                                {grouped.cities.length > 0 && (
                                  <>
                                    <div className="px-4 py-1 text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/20 border-b border-white/5 select-none">
                                      🏙️ Cities & Regions
                                    </div>
                                    {grouped.cities.map((s) => {
                                      globalIdx++;
                                      const isCurrentActive = globalIdx === waypointActiveIndex;
                                      return renderSuggestionRow(s, globalIdx, isCurrentActive, 'waypoint');
                                    })}
                                  </>
                                )}
                                {grouped.other.length > 0 && (
                                  <>
                                    <div className="px-4 py-1 text-[9px] text-amber-400 font-extrabold uppercase tracking-widest bg-amber-950/20 border-b border-white/5 select-none">
                                      🗺️ Other Results
                                    </div>
                                    {grouped.other.map((s) => {
                                      globalIdx++;
                                      const isCurrentActive = globalIdx === waypointActiveIndex;
                                      return renderSuggestionRow(s, globalIdx, isCurrentActive, 'waypoint');
                                    })}
                                  </>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="px-4 py-3 text-xs text-slate-500 italic bg-slate-950/90 flex items-center gap-2 select-none">
                            🔍 No matching locations found
                          </div>
                        )}
                      </div>
                      {waypointListToRender.length > 0 && !waypointLoading && (
                        <div className="px-4 py-1.5 bg-black/60 border-t border-white/5 text-[9px] text-slate-500 flex justify-between items-center select-none font-medium shrink-0">
                          <span>Press <b>↑↓</b> to navigate</span>
                          <span><b>Enter</b> to select</span>
                          <span><b>Esc</b> to close</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Destination Field */}
            <div className="flex items-center gap-3 relative pl-9">
              {/* Visual Indicator: Destination Node */}
              <span className="absolute left-[8px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-pink-500 bg-slate-950 flex items-center justify-center z-10 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              </span>
              <div ref={destWrapperRef} className="relative flex items-center w-full">
                <input 
                  ref={destInputRef}
                  className={`input-dark bg-black/20 w-full pr-20 transition-all duration-200 ${form.destCoords ? 'border-emerald-500/30 shadow-emerald-950/10 shadow-inner' : ''}`}
                  placeholder="Destination (Alt+D) (e.g. Pune City)" 
                  value={destQuery || form.destination} 
                  onChange={e => handleDestChange(e.target.value)} 
                  onFocus={() => setDestFocused(true)}
                  onKeyDown={handleDestKeyDown}
                  role="combobox"
                  aria-expanded={showDestDropdown}
                  aria-autocomplete="list"
                  aria-controls="dest-suggestions-list"
                  aria-activedescendant={destActiveIndex >= 0 ? `dest-option-${destActiveIndex}` : undefined}
                />

                {/* Input Action Group (Tick + Mic + Clear/GPS/Spinner) */}
                <div className="absolute right-3 flex items-center gap-2">
                  {form.destCoords && !destLoading && (
                    <span className="text-emerald-400 text-[10px] font-black flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded select-none animate-fade-in shrink-0" title="Selection Confirmed">
                      ✓
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => startVoiceInput('dest')}
                    className={`text-sm hover:scale-110 active:scale-95 transition-all shrink-0 ${
                      listeningField === 'dest' ? 'text-rose-500 animate-pulse font-black scale-110' : 'text-slate-400 hover:text-rose-400'
                    }`}
                    title="Voice Search"
                  >
                    🎤
                  </button>

                  {destLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex items-center justify-center shrink-0" />
                  ) : (destQuery || form.destination) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDestQuery('');
                        setForm(prev => ({ ...prev, destination: '', destCoords: null }));
                        setDestSuggestions([]);
                        setDestActiveIndex(-1);
                      }}
                      className="text-slate-400 hover:text-red-400 transition-colors text-xs font-bold flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10 shrink-0"
                      title="Clear Destination"
                    >
                      ✕
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => useGPSForField('dest')}
                      disabled={gpsLoading}
                      title="Use Live GPS Coordinates"
                      className="text-slate-400 hover:text-cyan-400 transition-colors text-sm flex items-center justify-center shrink-0"
                    >
                      {gpsLoading ? '⏳' : '🎯'}
                    </button>
                  )}
                </div>

                {/* Destination Autocomplete Suggestions Listbox */}
                {showDestDropdown && (
                  <div 
                    id="dest-suggestions-list"
                    role="listbox"
                    className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-slate-950/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-slide-down"
                  >
                    <div className="flex-1 overflow-y-auto scrollbar-thin-premium max-h-[220px]">
                      {destLoading ? (
                        <div className="divide-y divide-white/5 animate-pulse bg-slate-950/40">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="px-4 py-3 flex flex-col gap-1.5 select-none">
                              <div className="h-3 bg-white/10 rounded w-1/3" />
                              <div className="h-2 bg-white/5 rounded w-1/2" />
                            </div>
                          ))}
                        </div>
                      ) : destQuery.trim() === '' ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => useGPSForField('dest')}
                            disabled={gpsLoading}
                            className="w-full text-left px-4 py-3 text-xs text-cyan-400 hover:bg-white/5 flex items-center gap-2.5 font-bold border-b border-white/5 transition-all select-none"
                          >
                            <span className="shrink-0 text-sm">{gpsLoading ? '⏳' : '📍'}</span>
                            <span className="truncate">{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                          </button>

                          {recentSearches.length > 0 && (
                            <>
                              <div className="px-4 py-1.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest border-b border-white/5 bg-white/2 select-none">
                                🕐 Recent Searches
                              </div>
                              {recentSearches.map((s, idx) => {
                                const isActive = idx === destActiveIndex;
                                const primary = s.primary || s.display.split(', ')[0] || '';
                                const secondary = s.secondary || s.display.split(', ').slice(1).join(', ') || '';
                                return (
                                  <button
                                    key={idx}
                                    id={`dest-option-${idx}`}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => selectDest(s)}
                                    className={`w-full text-left px-4 py-2.5 text-xs transition-all duration-150 border-b border-white/5 last:border-0 flex items-center gap-2.5 ${
                                      isActive
                                        ? 'bg-cyan-500/10 text-white border-l-2 border-cyan-400 pl-3 font-semibold'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    <span className="shrink-0 text-[10px] text-slate-500">🕐</span>
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate text-white font-medium">{primary}</span>
                                      {secondary && <span className="truncate text-[10px] text-slate-500 mt-0.5">{secondary}</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      ) : destQuery.trim().length > 0 && destQuery.trim().length < 3 ? (
                        <div className="px-4 py-3 text-xs text-slate-400 bg-slate-950/90 flex items-center gap-2 select-none font-medium">
                          💡 Type {3 - destQuery.trim().length} more character${3 - destQuery.trim().length > 1 ? 's' : ''} to search...
                        </div>
                      ) : filteredDestSuggestions.length > 0 ? (
                        (() => {
                          const grouped = groupSuggestions(filteredDestSuggestions);
                          let globalIdx = -1;
                          return (
                            <div className="flex flex-col">
                              {grouped.nearby.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest bg-cyan-950/20 border-b border-white/5 select-none flex items-center justify-between">
                                    <span>📍 Nearby Locations</span>
                                    <span className="text-[8px] opacity-65">within 30 km</span>
                                  </div>
                                  {grouped.nearby.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === destActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'destination');
                                  })}
                                </>
                              )}
                              {grouped.cities.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-950/20 border-b border-white/5 select-none">
                                    🏙️ Cities & Regions
                                  </div>
                                  {grouped.cities.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === destActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'destination');
                                  })}
                                </>
                              )}
                              {grouped.other.length > 0 && (
                                <>
                                  <div className="px-4 py-1 text-[9px] text-amber-400 font-extrabold uppercase tracking-widest bg-amber-950/20 border-b border-white/5 select-none">
                                    🗺️ Other Results
                                  </div>
                                  {grouped.other.map((s) => {
                                    globalIdx++;
                                    const isCurrentActive = globalIdx === destActiveIndex;
                                    return renderSuggestionRow(s, globalIdx, isCurrentActive, 'destination');
                                  })}
                                </>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-500 italic bg-slate-950/90 flex items-center gap-2 select-none">
                          🔍 No matching locations found
                        </div>
                      )}
                    </div>
                    {destListToRender.length > 0 && !destLoading && (
                      <div className="px-4 py-1.5 bg-black/60 border-t border-white/5 text-[9px] text-slate-500 flex justify-between items-center select-none font-medium shrink-0">
                        <span>Press <b>↑↓</b> to navigate</span>
                        <span><b>Enter</b> to select</span>
                        <span><b>Esc</b> to close</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Part: Swap Button (⇅) */}
          <div className="flex flex-row lg:flex-col justify-center gap-3 items-center shrink-0">
            <button
              type="button"
              onClick={swapRoutes}
              className="z-10 w-10 h-10 rounded-xl bg-slate-950 border border-white/10 text-cyan-400 hover:text-cyan-300 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
              title="Swap Origin and Destination (Alt+S)"
            >
              <span className="group-hover:rotate-180 transition-transform duration-300 text-sm font-black">⇅</span>
            </button>
          </div>
        </div>
        {/* Feature ⑤: Add Waypoint Button */}
        {!showWaypoint && (
          <button
            type="button"
            onClick={() => setShowWaypoint(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center gap-1.5 pl-1.5"
          >
            ➕ Add Waypoint Stop
          </button>
        )}

        {/* Feature ②: CONFIRMED Route Ready validation strip */}
        {form.originCoords && form.destCoords && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex justify-between items-center text-xs font-semibold animate-pulse-emerald shadow-md select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>🛣️ Route Ready: <b>{getDistanceKm(form.originCoords.lat, form.originCoords.lon, form.destCoords.lat, form.destCoords.lon).toFixed(1)} km</b> (direct path)</span>
            </div>
            <button 
              type="button" 
              onClick={() => {
                setOriginQuery('');
                setDestQuery('');
                setForm(prev => ({ ...prev, origin: '', destination: '', originCoords: null, destCoords: null }));
              }}
              className="text-emerald-400 hover:text-red-400 transition-colors px-1 shrink-0 font-bold text-sm"
              title="Clear route selection"
            >
              ✕
            </button>
          </div>
        )}

        {/* Feature ④: Live Fuel Price Ticker & Vehicle Profiles */}
        <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
          <label className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Fuel / Energy Type Market Rates</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'Petrol', price: 106, icon: '⛽', label: '₹106/L' },
              { type: 'Diesel', price: 94, icon: '🛢️', label: '₹94/L' },
              { type: 'CNG', price: 86, icon: '💨', label: '₹86/kg' },
              { type: 'EV', price: 8, icon: '⚡', label: '₹8/kWh' }
            ].map(tile => {
              const isSelected = parseFloat(form.fuelPrice) === tile.price;
              return (
                <button
                  key={tile.type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fuelPrice: tile.price }))}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 duration-200 ${
                    isSelected 
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 font-extrabold shadow-md shadow-cyan-950/25'
                      : 'bg-black/35 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm mb-1">{tile.icon}</span>
                  <span className="text-[10px] font-bold">{tile.type}</span>
                  <span className="text-[8px] opacity-75 mt-0.5">{tile.label}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Vehicle Profile</label>
              <select className="input-dark bg-black/25 text-xs py-2 w-full" value={form.vehicleType} onChange={e=>setForm({...form,vehicleType:e.target.value})}>
                <option value="bike">🏍️ Motorcycle (45 Kmpl)</option>
                <option value="car">🚗 Hatchback/Sedan (15 Kmpl)</option>
                <option value="suv">🚙 SUV / Offroad (12 Kmpl)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Custom Price (₹)</label>
              <input 
                type="number" 
                className="input-dark bg-black/25 text-xs py-2 w-full" 
                placeholder="Fuel Price (₹)" 
                value={form.fuelPrice} 
                onChange={e=>setForm({...form,fuelPrice:e.target.value})} 
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none text-slate-300">
          <input type="checkbox" className="accent-cyan-500 w-4 h-4 rounded-md" checked={form.avoidPolice} onChange={e=>setForm({...form,avoidPolice:e.target.checked})} />
          Stealth Mode: Actively avoid highways, tolls, and checkpoints
        </label>
        <button onClick={plan} disabled={loading} className="btn-primary w-full shadow-lg shadow-cyan-500/10">{loading ? 'Calculating Route Vectors…' : 'Calculate Smart Route'}</button>
      </div>

      {loading && <div className="card"><Skeleton /></div>}

      {result && (
        <div id="route-results-grid" className="space-y-6 animate-fade-in">
          {result.isNight && (
            <div className="card bg-red-950/10 border border-red-500/25 p-4 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-semibold animate-pulse-rose">
              <span className="text-2xl">🌙</span>
              <div>
                <p className="font-bold text-white text-sm">Night-time Patrol Protocol Active</p>
                <p className="text-red-400 font-normal mt-0.5">Active police checkposts & document inspections are heavily elevated between 9:00 PM and 5:00 AM.</p>
              </div>
            </div>
          )}

          {/* Main Map & Route Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Map & Active Route Details) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="card bg-white/3 border border-white/5 p-4 space-y-4 h-[480px] flex flex-col">
                <h4 className="font-bold text-white text-sm tracking-wider uppercase flex items-center gap-2">
                  🗺️ Live Interactive Navigation & Route Vector
                </h4>
                <div className="flex-1 rounded-xl overflow-hidden border border-white/5 bg-black/45 relative">
                  <iframe
                    title="Google Maps Directions"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?saddr=${encodeURIComponent(form.origin)}&daddr=${encodeURIComponent(form.destination)}&output=embed`}
                  />
                </div>
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">📲 Send Directions to Navigation App</span>
                  <div className="flex gap-3">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(form.origin)}&destination=${encodeURIComponent(form.destination)}&travelmode=driving`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 text-center bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      🚗 Open in Google Maps
                    </a>
                    <a 
                      href={`https://waze.com/ul?q=${encodeURIComponent(form.destination)}&navigate=yes`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 text-center bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      🚙 Open in Waze App
                    </a>
                  </div>
                </div>
              </div>

              {result.routes && result.routes[activeRouteIdx] && (() => {
                const r = result.routes[activeRouteIdx];
                const distKm = parseDistanceKm(r.distance);
                return (
                  <div className="card border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-6">
                    {/* Print Media Query CSS injection */}
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #print-section, #print-section * {
                          visibility: visible;
                        }
                        #print-section {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100%;
                          color: #000 !important;
                          background: #fff !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                      }
                    `}</style>

                    {/* Header & Telemetry HUD Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
                      {/* Left Column: Route Details, Badges & Action Buttons */}
                      <div className="space-y-3.5 flex-1 min-w-0 w-full">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-1">Active Route Vector</span>
                          <h4 className="font-black text-white text-base sm:text-lg leading-tight truncate">
                            🔍 {r.summary}
                          </h4>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] font-bold">
                          <span className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider ${r.safetyScore > 75 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                            🛡️ Safety: {r.safetyScore}%
                          </span>
                          {r.policeCheckpoints?.length > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                              ⚠️ {r.policeCheckpoints.length} Patrols
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">
                              🛡️ Patrol Free
                            </span>
                          )}
                          {(() => {
                            const scoreVal = Math.max(10, Math.min(100, Math.round(
                              (r.safetyScore * 0.6) + 
                              (form.vehicleType === 'bike' ? 40 : form.vehicleType === 'car' ? 30 : 20) - 
                              ((r.policeCheckpoints?.length || 0) * 5)
                            )));
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                scoreVal >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : scoreVal >= 55 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                🏆 Score: {scoreVal} ({scoreVal >= 80 ? 'Elite' : scoreVal >= 55 ? 'Standard' : 'Sub-optimal'})
                              </span>
                            );
                          })()}
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={toggleFavoriteRoute}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all duration-150 ${
                              savedRoutes.some(fav => fav.origin === form.origin && fav.destination === form.destination)
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 hover:scale-105'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:text-yellow-400 hover:bg-white/10 hover:scale-105'
                            }`}
                            title={savedRoutes.some(fav => fav.origin === form.origin && fav.destination === form.destination) ? "Remove Route from Favorites" : "Save Route to Favorites"}
                          >
                            <span>★</span>
                            <span>{savedRoutes.some(fav => fav.origin === form.origin && fav.destination === form.destination) ? "Saved" : "Save"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => shareRoute(r)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-150 hover:scale-105"
                            title="Share Route Details"
                          >
                            <span>📤</span>
                            <span>Share</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-150 hover:scale-105"
                            title="Print Route & Export QR"
                          >
                            <span>🖨️</span>
                            <span>Print</span>
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Sleek Telemetry HUD Card */}
                      <div className="flex items-center gap-4 bg-black/40 border border-white/10 p-4 rounded-2xl w-full md:w-auto md:min-w-[210px] justify-between md:justify-end shrink-0 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="text-left md:text-right">
                          <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider mb-0.5">Commute Time</span>
                          <p className="font-black text-2xl text-cyan-400 font-mono leading-none">{r.duration}</p>
                          <span className="text-[10px] text-green-400 font-bold mt-1 font-mono block">Est. {r.fuelCost} ({r.fuelLiters})</span>
                        </div>

                        {/* Circular Score Gauge */}
                        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                          {(() => {
                            const scoreVal = Math.max(10, Math.min(100, Math.round(
                              (r.safetyScore * 0.6) + 
                              (form.vehicleType === 'bike' ? 40 : form.vehicleType === 'car' ? 30 : 20) - 
                              ((r.policeCheckpoints?.length || 0) * 5)
                            )));
                            return (
                              <>
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    className="text-slate-800"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  <path
                                    className={`transition-all duration-1000 ease-out ${
                                      scoreVal >= 80 ? 'text-emerald-400' : scoreVal >= 55 ? 'text-yellow-400' : 'text-rose-500'
                                    }`}
                                    strokeWidth="3.5"
                                    strokeDasharray={`${scoreVal}, 100`}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                </svg>
                                <div className="absolute text-center flex flex-col justify-center">
                                  <span className="text-[11px] font-black text-white font-mono leading-none">{scoreVal}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    {/* Feature ③: Rich Route Card Metrics Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/35 p-3.5 rounded-xl border border-white/5">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">⏱️ Est. Arrival</span>
                        <span className="font-extrabold text-white text-xs mt-1 font-mono">
                          {(() => {
                            const durationMins = parseInt(r.duration) || 0;
                            return new Date(Date.now() + durationMins * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">🌱 CO₂ Emissions</span>
                        <span className="font-extrabold text-emerald-400 text-xs mt-1 font-mono">
                          {(() => {
                            const factor = form.vehicleType === 'bike' ? 60 : form.vehicleType === 'suv' ? 210 : 120;
                            return ((distKm * factor) / 1000).toFixed(2);
                          })()} kg
                        </span>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">⛽ Fuel Liters</span>
                        <span className="font-extrabold text-cyan-400 text-xs mt-1 font-mono">{r.fuelLiters}</span>
                      </div>

                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-center">
                        <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">🎫 Toll Estimate</span>
                        <span className="font-extrabold text-yellow-400 text-xs mt-1 font-mono">
                          {(() => {
                            const tollCount = r.policeCheckpoints?.filter(c => c.type.includes('Toll')).length || 0;
                            return `₹${tollCount * 80}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Color-coded Risk Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-wider">
                        <span>🕵️ Patrol & Delay Risk Index</span>
                        <span className={r.safetyScore > 80 ? 'text-green-400 font-bold' : r.safetyScore > 60 ? 'text-yellow-400 font-bold' : 'text-rose-400 font-bold'}>
                          {r.safetyScore > 80 ? 'Low Risk' : r.safetyScore > 60 ? 'Moderate Risk' : 'High Risk'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            r.safetyScore > 80 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : r.safetyScore > 60 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                          }`} 
                          style={{ width: `${r.safetyScore}%` }} 
                        />
                      </div>
                    </div>

                    {/* Fuel Arbitrage & Live Alerts Ticker */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">⛽ Fuel Type Comparison</span>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                            <span className="text-slate-500 block">Petrol (15 Kmpl)</span>
                            <span className="font-bold text-white block mt-0.5 font-mono">₹{Math.round(distKm * (1/(form.vehicleType === 'bike' ? 45 : form.vehicleType === 'suv' ? 12 : 15)) * form.fuelPrice)}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                            <span className="text-slate-500 block">Diesel (17 Kmpl)</span>
                            <span className="font-bold text-cyan-300 block mt-0.5 font-mono">₹{Math.round(distKm * (1/17) * (form.fuelPrice * 0.88))}</span>
                          </div>
                          <div className="bg-slate-900/40 p-2 rounded-lg border border-white/5">
                            <span className="text-slate-500 block">EV (Electric)</span>
                            <span className="font-bold text-green-400 block mt-0.5 font-mono">₹{Math.round(distKm * 0.15 * 8)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🚨 Live Community Alerts</span>
                        <div className="space-y-1.5 max-h-[85px] overflow-y-auto no-scrollbar pr-1">
                          {(() => {
                            const dynamicAlerts = [];
                            const policeCPS = r.policeCheckpoints?.filter(cp => cp.type.toLowerCase().includes('police') || cp.type.toLowerCase().includes('naka') || cp.type.toLowerCase().includes('patrol')) || [];
                            const tollCPS = r.policeCheckpoints?.filter(cp => cp.type.toLowerCase().includes('toll') || cp.type.toLowerCase().includes('plaza')) || [];
                            
                            policeCPS.forEach((cp, index) => {
                              dynamicAlerts.push({
                                text: `Active checkpost reported near ${cp.location || 'highway sector'}`,
                                time: `${5 + index * 6}m ago`,
                                icon: '👮'
                              });
                            });

                            tollCPS.forEach((cp, index) => {
                              dynamicAlerts.push({
                                text: `FASTag lanes slow at ${cp.location || 'toll plaza'}`,
                                time: `${3 + index * 8}m ago`,
                                icon: '🎫'
                              });
                            });

                            if (dynamicAlerts.length < 2 && r.steps && r.steps.length > 0) {
                              const roads = [...new Set(r.steps
                                .map(s => {
                                  const match = s.instruction.match(/(?:onto|on|along|continue|merge|enter)\s+([^,]+)/i);
                                  return match ? match[1].trim() : null;
                                })
                                .filter(Boolean)
                              )];

                              if (roads.length > 0) {
                                if (dynamicAlerts.length === 0) {
                                  dynamicAlerts.push({
                                    text: `Speed radar unit active on ${roads[0]}`,
                                    time: '4m ago',
                                    icon: '📸'
                                  });
                                }
                                if (dynamicAlerts.length < 2 && roads[1]) {
                                  dynamicAlerts.push({
                                    text: `Road patrol spotted cruising along ${roads[1]}`,
                                    time: '18m ago',
                                    icon: '🚨'
                                  });
                                } else if (dynamicAlerts.length < 2) {
                                  dynamicAlerts.push({
                                    text: `Congestion building up on ${roads[0]}`,
                                    time: '12m ago',
                                    icon: '🚗'
                                  });
                                }
                              }
                            }

                            if (dynamicAlerts.length === 0) {
                              dynamicAlerts.push({
                                text: 'Stealth channels clear; no active speed traps reported',
                                time: '1m ago',
                                icon: '🛡️'
                              });
                              dynamicAlerts.push({
                                text: `Patrol check frequency low near ${form.destination.split(',')[0]}`,
                                time: '25m ago',
                                icon: '🛰️'
                              });
                            }

                            return dynamicAlerts.slice(0, 3).map((alert, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-slate-900/30 p-2 rounded-xl text-[10px] border border-white/5 animate-fade-in">
                                <span className="text-sm shrink-0">{alert.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-300 font-semibold truncate">{alert.text}</p>
                                  <p className="text-[8px] text-slate-500 mt-0.5">Reported {alert.time}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Encounter Checkpoints & Congestion Area Chart */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🚨 Encounter Checkpoints ({r.policeCheckpoints?.length || 0})</span>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 no-scrollbar flex-1">
                          {r.policeCheckpoints?.length > 0 ? (
                            r.policeCheckpoints.map((cp, idx) => (
                              <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-xl p-2.5 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-white shrink-0">{cp.type}</span>
                                  <span className="text-[9px] text-slate-400 font-medium truncate">{cp.location || 'Highway Section'}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">💡 <span className="text-slate-300 font-medium">{cp.advice}</span></p>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-500 italic p-4 text-center">🛡️ No active checkposts reported on this route vector.</div>
                          )}
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">📊 Congestion & Patrol Density Profile</span>
                        {r.profileData?.length > 0 ? (
                          <div className="h-40 w-full text-[9px] mt-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={r.profileData} margin={{ top: 5, right: 5, left: -40, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                                <YAxis stroke="#475569" tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                <Area type="monotone" dataKey="traffic" name="Traffic Congestion" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.1)" strokeWidth={1.5} />
                                <Area type="monotone" dataKey="patrolProbability" name="Patrol Risk" stroke="#f43f5e" fill="rgba(244, 63, 94, 0.1)" strokeWidth={1.5} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic p-8 text-center">No profile details active.</div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Directions Timeline */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 mt-4">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🗺️ Step-by-Step Directions Timeline</span>
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin-premium">
                        {r.steps && r.steps.length > 0 ? (
                          r.steps.map((step, idx) => {
                            const inst = step.instruction.toLowerCase();
                            let icon = '➡️';
                            if (inst.includes('left')) icon = '↩️';
                            else if (inst.includes('right')) icon = '↪️';
                            else if (inst.includes('straight') || inst.includes('continue')) icon = '⬆️';
                            else if (inst.includes('depart') || inst.includes('start')) icon = '🛫';
                            else if (inst.includes('arrive') || inst.includes('destination')) icon = '🏁';
                            else if (inst.includes('toll') || inst.includes('gate')) icon = '🎫';
                            else if (inst.includes('merge')) icon = '🔀';

                            const isActiveStep = emulating && isSelectedForEmu && Math.floor((emuProgress / 100) * r.steps.length) === idx;

                            return (
                              <div 
                                key={idx} 
                                className={`flex gap-3 items-start p-2.5 rounded-xl border transition-all duration-200 ${
                                  isActiveStep 
                                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)] scale-102 pl-3.5' 
                                    : 'bg-slate-900/30 border-white/5 hover:border-white/10 hover:bg-slate-900/50'
                                }`}
                              >
                                <span className={`text-sm shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                  isActiveStep ? 'bg-cyan-500/20 text-cyan-300 font-black' : 'bg-white/5 text-slate-400'
                                }`}>
                                  {icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[11px] leading-relaxed ${isActiveStep ? 'text-white font-bold' : 'text-slate-300 font-medium'}`}>
                                    {step.instruction}
                                  </p>
                                  <span className="text-[9px] text-slate-500 mt-0.5 block font-mono">{step.distance}</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-xs text-slate-500 italic p-4 text-center">No direction vectors found.</div>
                        )}
                      </div>
                    </div>

                    {/* Emulator Progress & Control Button */}
                    <div className="pt-2 border-t border-white/5 space-y-3">
                      <button
                        type="button"
                        onClick={() => runEmulator(activeRouteIdx)}
                        disabled={emulating && !isSelectedForEmu}
                        className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-black text-xs py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                      >
                        🎮 {emulating && isSelectedForEmu ? 'Driving (Emulator Running)...' : emuCompleted && isSelectedForEmu ? 'Stealth Drive Finished! View Report' : emuFailed && isSelectedForEmu ? 'Simulation Stalled! Click to Retry' : 'Test Run Route (Emulator)'}
                      </button>

                      {isSelectedForEmu && (emulating || emuCompleted || emuFailed) && (
                        <div className="bg-black/85 border border-cyan-500/25 p-5 rounded-2xl space-y-4 font-mono text-xs animate-fade-in shadow-2xl">
                          {emuCompleted ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                                <span className="font-black text-emerald-400 flex items-center gap-1.5 animate-pulse">
                                  🏆 Stealth Drive Complete!
                                </span>
                                <span className="text-[9px] text-emerald-500 font-extrabold uppercase">MISSION SUCCESS</span>
                              </div>

                              <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl space-y-3">
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">stealth run performance metrics</p>
                                <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Total Distance</span>
                                    <span className="font-extrabold text-white text-xs mt-0.5 block">{r.distance}</span>
                                  </div>
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Net FinCoins Earned</span>
                                    <span className="font-extrabold text-yellow-400 text-xs mt-0.5 block">🪙 +{emuCoins - 100 + 50} Coins (Balance: {emuCoins})</span>
                                  </div>
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Refuels Executed</span>
                                    <span className="font-extrabold text-cyan-400 text-xs mt-0.5 block">⛽ {emuRefuelsCount} stations</span>
                                  </div>
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Speed Traps Jammed</span>
                                    <span className="font-extrabold text-pink-400 text-xs mt-0.5 block">⚡ {emuTrapsEvaded} radar blocks</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  <span>Route vector endpoints verified</span>
                                </div>
                                <div className="space-y-1 text-[9px]">
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <span className="text-emerald-400 font-extrabold">✓</span>
                                    <span className="truncate">Departed: {form.origin}</span>
                                  </div>
                                  {showWaypoint && form.waypoint && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                      <span className="text-amber-400 font-extrabold">✓</span>
                                      <span className="truncate">Stopover: {form.waypoint}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <span className="text-pink-400 font-extrabold">✓</span>
                                    <span className="truncate">Arrived: {form.destination}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  onClick={handleSaveToTripVault}
                                  disabled={emuSavingTrip}
                                  className="flex-1 py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 rounded-xl font-black text-[10px] tracking-wider transition uppercase disabled:opacity-50"
                                >
                                  {emuSavingTrip ? 'Saving profile...' : '💾 Save to Trip Vault'}
                                </button>
                                <button
                                  type="button"
                                  onClick={stopEmulator}
                                  className="flex-1 py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-300 rounded-xl font-black text-[10px] tracking-wider transition uppercase"
                                >
                                  🔄 Test Another Route
                                </button>
                              </div>
                            </div>
                          ) : emuFailed ? (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-rose-500/20 pb-2">
                                <span className="font-black text-rose-400 flex items-center gap-1.5 animate-pulse">
                                  ❌ Mission Failed: Stalled
                                </span>
                                <span className="text-[9px] text-rose-500 font-extrabold uppercase">VEHICLE IMMOBILIZED</span>
                              </div>

                              <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl space-y-3">
                                <p className="text-[10px] text-rose-400 leading-relaxed font-semibold">
                                  Your hybrid fuel cell was completely drained at <span className="font-bold text-white font-mono">{emuProgress}%</span> of the travel vector. The vehicle has stalled on the highway with zero reserves.
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-[10px]">
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Remaining Coins</span>
                                    <span className="font-extrabold text-white text-xs mt-0.5 block">🪙 {emuCoins} Coins</span>
                                  </div>
                                  <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                                    <span className="text-slate-500 block uppercase text-[8px] font-bold">Estimated Distance Covered</span>
                                    <span className="font-extrabold text-rose-400 text-xs mt-0.5 block">
                                      ~{Math.round((emuProgress / 100) * parseDistanceKm(r.distance))} km
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  onClick={() => runEmulator(activeRouteIdx)}
                                  className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-xl font-black text-[10px] tracking-wider transition uppercase"
                                >
                                  🔄 Restart Simulation
                                </button>
                                <button
                                  type="button"
                                  onClick={stopEmulator}
                                  className="flex-1 py-2 px-3 bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-300 rounded-xl font-black text-[10px] tracking-wider transition uppercase"
                                >
                                  ⏹️ Exit Simulation
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full bg-cyan-400 ${emuPaused ? 'opacity-80' : 'animate-ping bg-cyan-400'}`} />
                                  🛰️ Stealth Drive Core {emuPaused ? 'Paused' : 'Active'}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold">SAT-LINK: {emuPaused ? 'IDLE' : 'ACTIVE'}</span>
                              </div>

                              {emuEvent && (
                                <div className={`p-3 rounded-xl border border-dashed text-[10px] animate-pulse ${
                                  emuEvent === 'speed_trap' 
                                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                                    : emuEvent === 'toll_plaza' 
                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' 
                                    : 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                                }`}>
                                  <div className="flex justify-between items-center font-bold font-sans">
                                    <span>
                                      {emuEvent === 'speed_trap' 
                                        ? '⚠️ SPEED RADAR SCANNER ACTIVE!' 
                                        : emuEvent === 'toll_plaza' 
                                        ? '🎫 APPROACHING TOLL GATE!' 
                                        : '⛽ LOW FUEL WARNING!'}
                                    </span>
                                    <span className="text-[8px] uppercase tracking-widest font-mono">Action Required</span>
                                  </div>
                                  <p className="mt-1 text-[9px] font-mono leading-relaxed">
                                    {emuEvent === 'speed_trap'
                                      ? 'Scramble radar frequencies with Jammer, or decelerate throttle below 45 km/h immediately to comply!'
                                      : emuEvent === 'toll_plaza'
                                      ? 'Authorize manual toll plaza passage (10 FinCoins) to avoid automatic fee penalty.'
                                      : 'Refuel hybrid cell at upcoming station stop (15 FinCoins) to prevent complete power stall.'}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-3 gap-4 items-center py-2">
                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black">Velocity</span>
                                  <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-800"
                                        strokeWidth="2.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className={`transition-all duration-300 ${emuSpeed > 90 ? 'text-rose-500' : 'text-cyan-400'}`}
                                        strokeWidth="2.5"
                                        strokeDasharray={`${(emuSpeed / 120) * 100}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                      <span className="text-sm font-black text-white">{emuSpeed}</span>
                                      <span className="text-[7px] text-slate-500">km/h</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black">Progress</span>
                                  <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-800"
                                        strokeWidth="2.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-pink-500 transition-all duration-300"
                                        strokeWidth="2.5"
                                        strokeDasharray={`${emuProgress}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                      <span className="text-sm font-black text-white">{emuProgress}%</span>
                                      <span className="text-[7px] text-slate-500">done</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-center justify-center space-y-1">
                                  <span className="text-[9px] text-slate-500 uppercase font-black">Fuel Cell</span>
                                  <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-slate-800"
                                        strokeWidth="2.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className={`transition-all duration-300 ${emuFuel < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}
                                        strokeWidth="2.5"
                                        strokeDasharray={`${emuFuel}, 100`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                      <span className="text-sm font-black text-white">{Math.round(emuFuel)}%</span>
                                      <span className={`text-[7px] ${emuFuel < 20 ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-500'}`}>{emuFuel < 20 ? 'LOW ⚠️' : 'FUEL'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-1 bg-black/60 p-3 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                  <span className="text-slate-400 font-bold uppercase tracking-wider">Throttle Regulator</span>
                                  <span className="font-black text-cyan-400">{emuThrottle} km/h {emuThrottle > 95 && '⚠️ Speeding Risk'}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="40" 
                                  max="120" 
                                  value={emuThrottle} 
                                  onChange={(e) => setEmuThrottle(parseInt(e.target.value))}
                                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className="flex justify-between text-[7px] text-slate-600 font-bold uppercase tracking-wider">
                                  <span>Compliance (40)</span>
                                  <span>Cruising (75)</span>
                                  <span>Hyperdrive (120) ⚡</span>
                                </div>
                              </div>

                              <div className="bg-black/65 border border-white/5 rounded-xl p-3 space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                                <span className="text-[8px] text-slate-500 uppercase font-black block tracking-wider">SAT-NAV Route Vectors</span>
                                <div className="space-y-2 relative border-l border-cyan-500/20 pl-4 ml-1">
                                  {r.steps?.map((step, idx) => {
                                    const isActive = emuActiveStepIdx === idx;
                                    return (
                                      <div 
                                        key={idx} 
                                        id={`emu-step-${idx}`}
                                        className={`relative transition-all duration-300 p-2 rounded-lg ${isActive ? 'bg-cyan-500/10 border border-cyan-500/30' : 'opacity-45'}`}
                                      >
                                        <div className={`absolute -left-[21px] top-3.5 w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-800 border border-white/10'}`} />
                                        <div className="flex justify-between gap-2 text-[9px] font-mono">
                                          <span className={`font-bold ${isActive ? 'text-cyan-400' : 'text-slate-300'}`}>{step.instruction}</span>
                                          <span className="text-slate-500 shrink-0">{step.distance}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-1 px-1">
                                <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase tracking-wider select-none">
                                  <span>Origin: {form.origin?.split(',')[0]}</span>
                                  {showWaypoint && form.waypoint && <span>Stop: {form.waypoint?.split(',')[0]}</span>}
                                  <span>Dest: {form.destination?.split(',')[0]}</span>
                                </div>
                                <div className="relative w-full h-1.5 bg-slate-950 rounded-full border border-white/5 overflow-visible flex items-center">
                                  {showWaypoint && form.waypoint && (
                                    <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 border border-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.6)] z-10 animate-pulse" />
                                  )}
                                  <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)] transition-all duration-300"
                                    style={{ width: `${emuProgress}%` }}
                                  />
                                  <div 
                                    className="absolute -top-1.5 -translate-x-1/2 text-xs transition-all duration-300 pointer-events-none select-none"
                                    style={{ left: `${emuProgress}%` }}
                                  >
                                    🚗
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5 text-[10px]">
                                <div>
                                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">ETA Remaining</span>
                                  <span className="font-bold text-white text-xs">{emuEta} mins</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">FASTag Wallet</span>
                                  <span className="font-bold text-yellow-400 text-xs font-mono">🪙 {emuCoins} Coins</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Simulation XP</span>
                                  <span className="font-bold text-yellow-400 text-xs flex items-center gap-1">✨ +{activeXP} XP</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleJamRadar}
                                    disabled={jammerActive || emuCoins < 15}
                                    className={`flex-1 py-2 px-3 border rounded-xl font-bold text-[9px] tracking-wider transition uppercase flex items-center justify-center gap-1 ${
                                      jammerActive
                                        ? 'bg-slate-950 border-cyan-500/10 text-cyan-500/50 cursor-not-allowed'
                                        : emuCoins < 15
                                        ? 'bg-black border-white/5 text-slate-600 cursor-not-allowed'
                                        : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/35 text-cyan-400 active:scale-95'
                                    }`}
                                    title="Click to jam active speed traps (costs 15 FinCoins)"
                                  >
                                    ⚡ {jammerActive ? 'Jammer Active...' : 'Jam Speed Radar (-15 Coins)'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleDeployDecoy}
                                    disabled={decoyDeployed || emuCoins < 25}
                                    className={`flex-1 py-2 px-3 border rounded-xl font-bold text-[9px] tracking-wider transition uppercase flex items-center justify-center gap-1 ${
                                      decoyDeployed
                                        ? 'bg-slate-950 border-amber-500/10 text-amber-500/50 cursor-not-allowed'
                                        : emuCoins < 25
                                        ? 'bg-black border-white/5 text-slate-600 cursor-not-allowed'
                                        : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 text-amber-400 active:scale-95'
                                    }`}
                                    title="Redirect highway patrols (costs 25 FinCoins)"
                                  >
                                    🕵️ {decoyDeployed ? 'Decoy Deployed' : 'Deploy Decoy (-25 Coins)'}
                                  </button>
                                </div>

                                {emuEvent === 'speed_trap' && (
                                  <button
                                    type="button"
                                    onClick={() => setEmuThrottle(40)}
                                    className="w-full py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-xl font-bold text-[9px] uppercase tracking-wider transition animate-pulse"
                                  >
                                    ⚠️ Apply Brakes (Slow to 40 km/h)
                                  </button>
                                )}
                                {emuEvent === 'toll_plaza' && (
                                  <button
                                    type="button"
                                    onClick={handlePayToll}
                                    disabled={emuCoins < 10}
                                    className="w-full py-2 px-3 bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/50 text-amber-300 rounded-xl font-bold text-[9px] uppercase tracking-wider transition animate-bounce disabled:opacity-50"
                                  >
                                    🎫 Authorize FASTag Toll (costs 10 Coins)
                                  </button>
                                )}
                                {emuEvent === 'fuel_refill' && (
                                  <button
                                    type="button"
                                    onClick={handleRefuel}
                                    disabled={emuCoins < 15}
                                    className="w-full py-2 px-3 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-500/50 text-emerald-300 rounded-xl font-bold text-[9px] uppercase tracking-wider transition animate-pulse disabled:opacity-50"
                                  >
                                    ⛽ Pull Into Refuel Station (costs 15 Coins)
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-2 justify-center border-t border-white/5 pt-3">
                                {emuPaused ? (
                                  <button
                                    type="button"
                                    onClick={resumeEmulator}
                                    className="flex-1 py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 rounded-lg font-black text-[9px] tracking-wider transition uppercase"
                                  >
                                    ▶️ Resume Drive
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={pauseEmulator}
                                    className="flex-1 py-1.5 px-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 rounded-lg font-black text-[9px] tracking-wider transition uppercase"
                                  >
                                    ⏸️ Pause Drive
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={stopEmulator}
                                  className="flex-1 py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-lg font-black text-[9px] tracking-wider transition uppercase"
                                >
                                  ⏹️ Stop & Reset
                                </button>
                              </div>

                              <div className="bg-black border border-cyan-500/25 p-3 rounded-xl shadow-[inset_0_1px_8px_rgba(6,182,212,0.12)]">
                                <p className="text-cyan-400 font-mono text-[10px] leading-relaxed flex items-start gap-1">
                                  <span className="text-pink-500 shrink-0 font-extrabold animate-pulse">❯</span>
                                  <span>{emuLog}</span>
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Feature ⑧: Print-Only Hidden Summary (styled for printing) */}
                    <div id="print-section" className="hidden print:block p-8 bg-white text-black font-sans">
                      <div className="border-b-2 border-slate-800 pb-4 mb-6">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">🗺️ FinBuddy Stealth Route Summary</h1>
                        <p className="text-xs text-slate-500 mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Journey Details</h2>
                          <div className="space-y-1.5 text-xs text-slate-800">
                            <p><b>Origin:</b> {form.origin}</p>
                            {showWaypoint && form.waypoint && <p><b>Waypoint Stop:</b> {form.waypoint}</p>}
                            <p><b>Destination:</b> {form.destination}</p>
                            <p><b>Vehicle Type:</b> <span className="capitalize">{form.vehicleType}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end justify-between">
                          <div className="text-right space-y-1 text-xs text-slate-800">
                            <p><b>Total Distance:</b> {r.distance}</p>
                            <p><b>Est. Duration:</b> {r.duration}</p>
                            <p><b>Fuel Cost:</b> <span className="font-bold text-slate-900">{r.fuelCost}</span> ({r.fuelLiters} consumed)</p>
                            <p><b>Safety Score:</b> <span className="font-bold">{r.safetyScore}%</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">⚠️ Encounter Checkpoints ({r.policeCheckpoints?.length || 0})</h3>
                        {r.policeCheckpoints?.length > 0 ? (
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="border-b border-slate-300">
                                <th className="py-2 font-bold text-slate-700">Type</th>
                                <th className="py-2 font-bold text-slate-700">Location</th>
                                <th className="py-2 font-bold text-slate-700">Stealth Advice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.policeCheckpoints.map((cp, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 pr-4 font-semibold text-slate-800">{cp.type}</td>
                                  <td className="py-2 pr-4 text-slate-600">{cp.location}</td>
                                  <td className="py-2 text-slate-500 italic">{cp.advice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-green-700 font-semibold">🛡️ Zero police checkposts or highway tolls detected on this route. Safe drive!</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-6 items-end border-t border-slate-200 pt-6">
                        <div className="col-span-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">📍 Driving Steps Timeline</h3>
                          <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-slate-700">
                            {r.steps?.map((step, idx) => (
                              <li key={idx} className="truncate">
                                <b>{step.distance}</b>: {step.instruction}
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex flex-col items-center justify-center text-center">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                              `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(form.origin)}&destination=${encodeURIComponent(form.destination)}${showWaypoint && form.waypoint ? `&waypoints=${encodeURIComponent(form.waypoint)}` : ''}&travelmode=driving`
                            )}`} 
                            alt="Scan to Navigate" 
                            className="w-24 h-24 border border-slate-300 p-1 mb-1.5"
                          />
                          <span className="text-[8px] text-slate-500 font-semibold uppercase">Scan for GPS Navigation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column (Route Selector Cards & WFH Calculator) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Route Selector List */}
              <div className="card space-y-4 bg-white/5 border border-white/5">
                <h4 className="font-bold text-white text-sm tracking-wider uppercase">
                  Computed Routes ({result.routes?.length || 0})
                </h4>
                <div className="space-y-3">
                  {result.routes?.map((r, i) => {
                    const isActive = activeRouteIdx === i;
                    const optimal = r.routeIndex === result.recommended;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveRouteIdx(i)}
                        className={`w-full text-left card p-4 border transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-101' 
                            : 'border-white/5 bg-white/3 hover:border-white/10 hover:bg-white/5 hover:scale-101'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h5 className="font-bold text-white text-sm flex items-center gap-1.5 truncate">
                              {r.summary}
                            </h5>
                            {optimal && (
                              <span className="inline-block text-[8px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1.5">
                                Optimal Route
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-sm text-cyan-400">{r.duration}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{r.distance}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap text-[9px] mt-3 border-t border-white/5 pt-2.5">
                          <span className={`px-2 py-0.5 rounded font-black uppercase ${r.safetyScore > 75 ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/10'}`}>
                            Safety: {r.safetyScore}%
                          </span>
                          {r.policeCheckpoints?.length > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-black uppercase">
                              ⚠️ {r.policeCheckpoints.length} Patrols
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-black uppercase">
                              🛡️ Clean
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WFH Savings Optimizer & Commute Analytics inside right column */}
              {result.routes && result.routes[activeRouteIdx] && (() => {
                const r = result.routes[activeRouteIdx];
                const distKm = parseDistanceKm(r.distance);
                const singleTripCost = Math.round((distKm / (form.vehicleType === 'bike' ? 45 : form.vehicleType === 'suv' ? 12 : 15)) * form.fuelPrice);
                const standardMonthlyCost = singleTripCost * 2 * 22; // 5 days commute
                const optimizedCommuteDays = 5 - wfhDays;
                const optimizedMonthlyCost = singleTripCost * 2 * (optimizedCommuteDays * 4.4);
                const monthlySavings = standardMonthlyCost - optimizedMonthlyCost;

                const commuteChartData = [
                  { name: 'Standard (5d)', Cost: standardMonthlyCost, Savings: 0 },
                  { name: `WFH (${optimizedCommuteDays}d)`, Cost: optimizedMonthlyCost, Savings: monthlySavings }
                ];

                return (
                  <div className="space-y-6">
                    <div className="card bg-white/3 border border-white/5 p-4 space-y-4">
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider border-b border-white/5 pb-2">
                        🧠 WFH Savings Optimizer
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
                            <span>WFH Days / Week:</span>
                            <span className="text-cyan-400 font-mono">{wfhDays} Days</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="4" 
                            step="1"
                            value={wfhDays} 
                            onChange={(e) => setWfhDays(parseInt(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase font-black block">Standard</span>
                            <span className="text-sm font-bold text-white font-mono">₹{standardMonthlyCost.toLocaleString('en-IN')}/mo</span>
                          </div>
                          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase font-black block">Optimized</span>
                            <span className="text-sm font-bold text-green-400 font-mono">₹{optimizedMonthlyCost.toLocaleString('en-IN')}/mo</span>
                          </div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 text-green-300 rounded-xl p-3 text-[11px] text-center font-bold">
                          🎉 Saves ₹{monthlySavings.toLocaleString('en-IN')}/month!
                        </div>
                      </div>
                    </div>

                    <div className="card bg-white/3 border border-white/5 p-4 flex flex-col justify-between">
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-2">
                        📊 Monthly Commute Expenses
                      </h4>
                      <div className="h-40 w-full text-[10px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={commuteChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                            <YAxis stroke="#475569" tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                            />
                            <Bar dataKey="Cost" fill="#ec4899" stackId="a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Savings" fill="#22d3ee" stackId="a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 text-[9px] font-bold mt-2">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-pink-500 rounded-sm" /><span>Active Cost</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" /><span>Optimized Savings</span></div>
                      </div>
                    </div>

                    {/* 🌱 Eco Impact Commute Tracker */}
                    <div className="card bg-emerald-950/5 border border-emerald-500/15 p-4 space-y-4">
                      <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider border-b border-emerald-500/10 pb-2 flex items-center gap-1.5">
                        🌱 Eco Impact Commute Tracker
                      </h4>
                      {(() => {
                        const factors = { bike: 60, car: 120, suv: 210 };
                        const factor = factors[form.vehicleType] || 120;
                        const dailyEmissionsKg = (distKm * 2 * factor) / 1000;
                        const standardMonthlyEmissionsKg = dailyEmissionsKg * 22;
                        const optimizedMonthlyEmissionsKg = dailyEmissionsKg * (optimizedCommuteDays * 4.4);
                        const monthlyCO2SavingsKg = standardMonthlyEmissionsKg - optimizedMonthlyEmissionsKg;
                        const annualCO2SavingsKg = monthlyCO2SavingsKg * 12;
                        const treesSaved = (annualCO2SavingsKg / 22).toFixed(1);

                        return (
                          <div className="space-y-3.5 text-xs text-slate-300 font-sans">
                            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black block">Standard Footprint</span>
                                <span className="font-bold text-white font-mono">{standardMonthlyEmissionsKg.toFixed(1)} kg CO₂/mo</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-500 uppercase font-black block">Optimized Footprint</span>
                                <span className="font-bold text-emerald-400 font-mono">{optimizedMonthlyEmissionsKg.toFixed(1)} kg CO₂/mo</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-center">
                                <span className="text-[9px] text-emerald-500/80 uppercase font-black block">Monthly CO₂ Saved</span>
                                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">{monthlyCO2SavingsKg.toFixed(1)} kg</span>
                              </div>
                              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-center">
                                <span className="text-[9px] text-emerald-500/80 uppercase font-black block">Tree Equivalence</span>
                                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">🌳 {treesSaved} trees/yr</span>
                              </div>
                            </div>

                            {(form.vehicleType === 'car' || form.vehicleType === 'suv') && (
                              <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 text-[10px] text-cyan-300 leading-relaxed font-semibold">
                                💡 <b>EV Hack:</b> Switching to an Electric Vehicle (EV) would completely eliminate tailpipe emissions, saving ~<b>{(dailyEmissionsKg * 22 * 12).toFixed(0)} kg CO₂</b> per year!
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Feature ⑦: Trip Cost Summary Card */}
                    {(() => {
                      const mileage = { bike: 45, car: 15, suv: 12 };
                      const kmpl = mileage[form.vehicleType] || 15;
                      const singleTripCost = Math.round((distKm / kmpl) * form.fuelPrice);

                      return (
                        <div className="card bg-white/3 border border-white/5 p-4 space-y-4">
                          <h4 className="font-bold text-xs text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center justify-between">
                            <span>💰 Commute Cost Breakdown</span>
                            <span className="text-[9px] text-cyan-400 font-semibold lowercase">driving vs cab</span>
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div className="space-y-2.5">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">One-Way (Fuel)</span>
                                <p className="font-extrabold text-white text-sm font-mono mt-0.5">₹{singleTripCost.toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">Round-Trip (Fuel)</span>
                                <p className="font-extrabold text-white text-sm font-mono mt-0.5">₹{(singleTripCost * 2).toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">Monthly Commute</span>
                                <p className="font-extrabold text-cyan-400 text-sm font-mono mt-0.5">₹{(singleTripCost * 2 * 22).toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">Annual Commute</span>
                                <p className="font-extrabold text-cyan-400 text-sm font-mono mt-0.5">₹{(singleTripCost * 2 * 22 * 12).toLocaleString('en-IN')}</p>
                              </div>
                            </div>

                            <div className="border-l border-white/5 pl-3.5 space-y-2.5">
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">App Cab (One-Way)</span>
                                <p className="font-extrabold text-pink-400 text-sm font-mono mt-0.5">₹{Math.round(distKm * 18).toLocaleString('en-IN')}</p>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 uppercase font-black">App Cab (Monthly)</span>
                                <p className="font-extrabold text-pink-400 text-sm font-mono mt-0.5">₹{Math.round(distKm * 18 * 2 * 22).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-xl p-2.5 text-[10px] font-bold mt-2">
                                💡 Driving saves you <b>{Math.round((1 - (singleTripCost / (distKm * 18 || 1))) * 100)}%</b> compared to app cabs!
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
