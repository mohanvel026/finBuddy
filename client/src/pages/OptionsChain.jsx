// client/src/pages/OptionsChain.jsx
// Full Options Chain Viewer — Black-Scholes pricing engine with Greeks, Payoff diagram, and Strike grid
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../services/api';


// ─── Black-Scholes Engine (frontend, no API call) ───────────────────────────
const erf = (x) => {
  const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741,
        a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};
const cnd = (x) => (1 + erf(x / Math.sqrt(2))) / 2;

const blackScholes = (S, K, T, r, sigma, type = 'CALL') => {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsic = type === 'CALL' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: type === 'CALL' ? (S > K ? 1 : 0) : (K > S ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0, intrinsic, timeValue: 0 };
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1  = cnd(d1), Nd2  = cnd(d2);
  const Nnd1 = cnd(-d1), Nnd2 = cnd(-d2);
  const pdf  = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);

  let price, delta;
  if (type === 'CALL') {
    price = S * Nd1  - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
  } else {
    price = K * Math.exp(-r * T) * Nnd2 - S * Nnd1;
    delta = Nd1 - 1;
  }

  const gamma = pdf / (S * sigma * Math.sqrt(T));
  const theta = (type === 'CALL'
    ? -(S * pdf * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2
    : -(S * pdf * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * Nnd2
  ) / 365;
  const vega  = S * pdf * Math.sqrt(T) / 100;
  const rho   = (type === 'CALL'
    ? K * T * Math.exp(-r * T) * Nd2
    : -K * T * Math.exp(-r * T) * Nnd2
  ) / 100;

  const intrinsic = type === 'CALL' ? Math.max(0, S - K) : Math.max(0, K - S);
  const timeValue = Math.max(0, price - intrinsic);

  return {
    price: Math.max(0, price),
    delta, gamma, theta, vega, rho,
    intrinsic, timeValue, d1, d2
  };
};

const generateStrikeRange = (spotPrice, numStrikes = 12, step = null) => {
  const autoStep = step || (spotPrice < 200 ? 5 : spotPrice < 1000 ? 25 : spotPrice < 5000 ? 50 : 100);
  const atm = Math.round(spotPrice / autoStep) * autoStep;
  const strikes = [];
  for (let i = -numStrikes / 2; i <= numStrikes / 2; i++) {
    strikes.push(parseFloat((atm + i * autoStep).toFixed(2)));
  }
  return { strikes, step: autoStep, atm };
};

const POPULAR = [
  { label: 'NIFTY', spot: 24000, name: 'Nifty 50', ticker: '^NSEI' },
  { label: 'BANKNIFTY', spot: 52500, name: 'Bank Nifty', ticker: '^NSEBANK' },
  { label: 'RELIANCE', spot: 2950, name: 'Reliance Industries', ticker: 'RELIANCE' },
  { label: 'TCS', spot: 3850, name: 'Tata Consultancy Services', ticker: 'TCS' },
  { label: 'INFY', spot: 1680, name: 'Infosys', ticker: 'INFY' },
  { label: 'HDFCBANK', spot: 1540, name: 'HDFC Bank', ticker: 'HDFCBANK' },
  { label: 'ICICIBANK', spot: 990, name: 'ICICI Bank', ticker: 'ICICIBANK' },
  { label: 'WIPRO', spot: 480, name: 'Wipro', ticker: 'WIPRO' },
];

const EXPIRY_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '60D', days: 60 },
  { label: '90D', days: 90 },
];

const IV_PRESETS = [
  { label: 'Low (15%)', value: 15 },
  { label: 'Normal (25%)', value: 25 },
  { label: 'High (40%)', value: 40 },
  { label: 'Extreme (60%)', value: 60 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
      <p className="text-slate-400 mb-1 font-mono">Strike: ₹{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: ₹{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

const PayoffTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
      <p className="text-slate-400 mb-1 font-mono">Spot: ₹{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.value >= 0 ? '#10b981' : '#ef4444' }} className="font-bold">
          P&L: {p.value >= 0 ? '+' : ''}₹{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
};

const GreekBadge = ({ label, value, color = 'cyan', fmt = (v) => v.toFixed(4) }) => (
  <div className={`p-2.5 rounded-xl bg-white/3 border border-white/5 text-center`}>
    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</p>
    <p className={`text-sm font-black font-mono ${
      color === 'cyan' ? 'text-cyan-400' :
      color === 'green' ? 'text-emerald-400' :
      color === 'red' ? 'text-red-400' :
      color === 'amber' ? 'text-amber-400' :
      color === 'purple' ? 'text-violet-400' : 'text-white'
    }`}>{fmt(value)}</p>
  </div>
);

const OptionsChain = () => {
  const [selected, setSelected] = useState(POPULAR[0]);
  const [spotPrice, setSpotPrice] = useState(POPULAR[0].spot);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const fetchLiveSpotPrice = useCallback(async (item) => {
    setLoadingPrice(true);
    try {
      const ticker = item.ticker || item.label;
      const res = await api.get(`/market/quote/${ticker}`);
      if (res.data?.success && res.data.quote?.price) {
        setSpotPrice(res.data.quote.price);
      } else {
        setSpotPrice(item.spot);
      }
    } catch (e) {
      console.warn('Failed to fetch live spot price:', e);
      setSpotPrice(item.spot);
    } finally {
      setLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveSpotPrice(selected);
  }, [selected, fetchLiveSpotPrice]);
  const [iv, setIv] = useState(25);
  const [expiry, setExpiry] = useState(30);
  const [riskFree, setRiskFree] = useState(6.5);
  const [chainData, setChainData] = useState([]);
  const [payoffData, setPayoffData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null); // { strike, type }
  const [payoffLegs, setPayoffLegs] = useState([]);
  const [strategyMode, setStrategyMode] = useState(false);
  const [highlightATM, setHighlightATM] = useState(true);
  const [atmStrike, setAtmStrike] = useState(null);

  const computeChain = useCallback(() => {
    const T = expiry / 365;
    const r = riskFree / 100;
    const sigma = iv / 100;
    const { strikes, atm } = generateStrikeRange(spotPrice, 22);
    setAtmStrike(atm);

    const rows = strikes.map(K => {
      const call = blackScholes(spotPrice, K, T, r, sigma, 'CALL');
      const put  = blackScholes(spotPrice, K, T, r, sigma, 'PUT');
      const moneyness = ((spotPrice - K) / K) * 100;
      const isATM = Math.abs(K - atm) < 0.01;
      const isITMCall = K < spotPrice;
      const isITMPut  = K > spotPrice;
      return { K, call, put, moneyness, isATM, isITMCall, isITMPut };
    });

    setChainData(rows);

    // Auto-select ATM row for single view
    if (!selectedRow) {
      setSelectedRow({ strike: atm, type: 'CALL' });
    }
  }, [spotPrice, iv, expiry, riskFree]);

  useEffect(() => {
    computeChain();
  }, [computeChain]);

  useEffect(() => {
    if (!selectedRow) return;
    const T = expiry / 365;
    const r = riskFree / 100;
    const sigma = iv / 100;
    const K = selectedRow.strike;
    const type = selectedRow.type;
    const premium = blackScholes(spotPrice, K, T, r, sigma, type).price;

    // Build payoff curve for single leg
    const pts = [];
    const lo = spotPrice * 0.7;
    const hi = spotPrice * 1.3;
    const step = (hi - lo) / 80;
    for (let S = lo; S <= hi; S += step) {
      let pnl = type === 'CALL' ? Math.max(0, S - K) - premium : Math.max(0, K - S) - premium;
      // Add payoff legs if any
      payoffLegs.forEach(leg => {
        const legPrem = blackScholes(spotPrice, leg.strike, T, r, sigma, leg.type).price;
        const legPnl = leg.type === 'CALL' ? Math.max(0, S - leg.strike) - legPrem : Math.max(0, leg.strike - S) - legPrem;
        pnl += legPnl * (leg.side === 'SELL' ? -1 : 1);
      });
      pts.push({ spot: parseFloat(S.toFixed(1)), pnl: parseFloat(pnl.toFixed(2)) });
    }
    setPayoffData(pts);
  }, [selectedRow, spotPrice, iv, expiry, riskFree, payoffLegs]);

  const handleSelectPopular = (p) => {
    setSelected(p);
    setSpotPrice(p.spot);
    setSelectedRow(null);
  };

  const selectedBS = selectedRow
    ? blackScholes(spotPrice, selectedRow.strike, expiry / 365, riskFree / 100, iv / 100, selectedRow.type)
    : null;

  const addToPayoffLegs = (strike, type, side) => {
    if (payoffLegs.length >= 4) {
      toast.error('Max 4 legs for strategy payoff');
      return;
    }
    if (payoffLegs.some(l => l.strike === strike && l.type === type && l.side === side)) {
      toast('Already added this leg');
      return;
    }
    setPayoffLegs(prev => [...prev, { strike, type, side }]);
    toast.success(`Added ${side} ${type} ${strike} to strategy`);
  };

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-black text-white">⛓️ Options Chain</h1>
              <span className="text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                Black-Scholes
              </span>
            </div>
            <p className="text-slate-400 text-sm">NSE-style live options matrix with Greeks, IV surface & Payoff builder</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/trade">
              <button className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '12px' }}>
                📈 Trade Arena
              </button>
            </Link>
          </div>
        </div>


        {/* ── Control Bar ── */}
        <div className="card mb-5 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Spot Price */}
            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">
                Spot Price (₹) {loadingPrice && <span className="text-cyan-400 animate-pulse font-normal lowercase"> (fetching live...)</span>}
              </label>
              <input
                type="number"
                value={spotPrice}
                onChange={e => setSpotPrice(parseFloat(e.target.value) || 0)}
                className="input-dark w-full text-lg font-mono font-black"
              />
            </div>
            {/* IV */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">IV / Volatility</label>
                <span className="text-cyan-400 font-black text-xs font-mono">{iv}%</span>
              </div>
              <input
                type="range" min="5" max="120" step="1"
                value={iv}
                onChange={e => setIv(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-400 bg-white/10"
              />
              <div className="flex gap-1.5 mt-2">
                {IV_PRESETS.map(p => (
                  <button key={p.value} onClick={() => setIv(p.value)}
                    className={`flex-1 text-[8px] py-0.5 rounded-lg font-bold transition border ${iv === p.value ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}>
                    {p.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            {/* DTE */}
            <div>
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Days to Expiry</label>
              <div className="flex gap-1.5">
                {EXPIRY_OPTIONS.map(e => (
                  <button key={e.days} onClick={() => setExpiry(e.days)}
                    className={`flex-1 py-1.5 rounded-xl text-[9px] font-black border transition ${expiry === e.days ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'border-white/5 text-slate-500 hover:text-slate-300'}`}>
                    {e.label}
                  </button>
                ))}
              </div>
              <input
                type="number" min="1" max="365"
                value={expiry}
                onChange={e => setExpiry(parseInt(e.target.value) || 30)}
                className="input-dark w-full mt-2 text-center font-mono text-xs"
                placeholder="Custom days"
              />
            </div>
            {/* Risk Free Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Risk-Free Rate</label>
                <span className="text-amber-400 font-black text-xs font-mono">{riskFree}%</span>
              </div>
              <input
                type="range" min="3" max="12" step="0.25"
                value={riskFree}
                onChange={e => setRiskFree(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-400 bg-white/10"
              />
              <p className="text-[9px] text-slate-600 mt-1.5">RBI Repo Rate proxy</p>
            </div>
          </div>

          {/* Popular Underlyings */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Quick Select Underlying</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR.map(p => (
                <button key={p.label} onClick={() => handleSelectPopular(p)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black border transition ${selected.label === p.label ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400' : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Layout: Chain + Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* ── Options Chain Grid ── */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-white text-sm">{selected.name} — Options Chain</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Spot: <span className="text-cyan-400 font-black">₹{spotPrice.toLocaleString('en-IN')}</span> &nbsp;•&nbsp; ATM: <span className="text-violet-400 font-black">₹{atmStrike}</span> &nbsp;•&nbsp; DTE: <span className="text-amber-400 font-black">{expiry}d</span> &nbsp;•&nbsp; IV: <span className="text-emerald-400 font-black">{iv}%</span>
                </p>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                <input type="checkbox" checked={highlightATM} onChange={e => setHighlightATM(e.target.checked)} className="accent-cyan-400" />
                Highlight ATM
              </label>
            </div>

            {/* Chain Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th colSpan={5} className="px-2 py-2 text-green-400 font-black text-left bg-green-500/5">
                      ← CALLS
                    </th>
                    <th className="px-3 py-2 text-center text-slate-300 font-black bg-white/3 text-[11px]">STRIKE</th>
                    <th colSpan={5} className="px-2 py-2 text-red-400 font-black text-right bg-red-500/5">
                      PUTS →
                    </th>
                  </tr>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider">
                    <th className="px-2 py-1.5 text-left font-black bg-green-500/3">LTP</th>
                    <th className="px-2 py-1.5 text-left font-black bg-green-500/3">Δ Delta</th>
                    <th className="px-2 py-1.5 text-left font-black bg-green-500/3">Γ</th>
                    <th className="px-2 py-1.5 text-left font-black bg-green-500/3">Θ/d</th>
                    <th className="px-2 py-1.5 text-left font-black bg-green-500/3">Vega</th>
                    <th className="px-3 py-1.5 text-center font-black">STRIKE</th>
                    <th className="px-2 py-1.5 text-right font-black bg-red-500/3">LTP</th>
                    <th className="px-2 py-1.5 text-right font-black bg-red-500/3">Δ Delta</th>
                    <th className="px-2 py-1.5 text-right font-black bg-red-500/3">Γ</th>
                    <th className="px-2 py-1.5 text-right font-black bg-red-500/3">Θ/d</th>
                    <th className="px-2 py-1.5 text-right font-black bg-red-500/3">Vega</th>
                  </tr>
                </thead>
                <tbody>
                  {chainData.map((row, idx) => {
                    const isSelected = selectedRow?.strike === row.K;
                    const isATMRow = highlightATM && row.isATM;

                    return (
                      <tr
                        key={idx}
                        className={`border-b border-white/3 transition-all cursor-pointer ${
                          isATMRow
                            ? 'bg-violet-500/8 border-violet-500/20'
                            : isSelected
                            ? 'bg-cyan-500/8'
                            : 'hover:bg-white/2'
                        }`}
                      >
                        {/* CALL side */}
                        <td
                          onClick={() => setSelectedRow({ strike: row.K, type: 'CALL' })}
                          className={`px-2 py-1.5 font-black font-mono ${row.isITMCall ? 'bg-green-500/5 text-green-400' : 'text-slate-300'} ${isSelected && selectedRow?.type === 'CALL' ? 'text-cyan-300' : ''}`}
                        >
                          {row.call.price.toFixed(2)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono ${row.isITMCall ? 'bg-green-500/5' : ''}`}>
                          <span className="text-cyan-400">{row.call.delta.toFixed(3)}</span>
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-slate-400 ${row.isITMCall ? 'bg-green-500/5' : ''}`}>
                          {row.call.gamma.toFixed(4)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-amber-400 ${row.isITMCall ? 'bg-green-500/5' : ''}`}>
                          {row.call.theta.toFixed(2)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-violet-400 ${row.isITMCall ? 'bg-green-500/5' : ''}`}>
                          {row.call.vega.toFixed(2)}
                        </td>

                        {/* Strike */}
                        <td className={`px-3 py-1.5 text-center font-black text-sm ${
                          isATMRow ? 'text-violet-300 bg-violet-500/10' : 'text-white'
                        }`}>
                          {row.K.toLocaleString('en-IN')}
                          {isATMRow && <span className="ml-1 text-[8px] bg-violet-500/20 text-violet-400 px-1 py-0.5 rounded font-black">ATM</span>}
                        </td>

                        {/* PUT side */}
                        <td
                          onClick={() => setSelectedRow({ strike: row.K, type: 'PUT' })}
                          className={`px-2 py-1.5 font-black font-mono text-right ${row.isITMPut ? 'bg-red-500/5 text-red-400' : 'text-slate-300'} ${isSelected && selectedRow?.type === 'PUT' ? 'text-cyan-300' : ''}`}
                        >
                          {row.put.price.toFixed(2)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-right ${row.isITMPut ? 'bg-red-500/5' : ''}`}>
                          <span className="text-pink-400">{row.put.delta.toFixed(3)}</span>
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-slate-400 text-right ${row.isITMPut ? 'bg-red-500/5' : ''}`}>
                          {row.put.gamma.toFixed(4)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-amber-400 text-right ${row.isITMPut ? 'bg-red-500/5' : ''}`}>
                          {row.put.theta.toFixed(2)}
                        </td>
                        <td className={`px-2 py-1.5 font-mono text-violet-400 text-right ${row.isITMPut ? 'bg-red-500/5' : ''}`}>
                          {row.put.vega.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-3 border-t border-white/5 flex items-center gap-4 text-[9px] text-slate-500 font-black uppercase tracking-widest">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/15 inline-block" /> ITM Call</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/15 inline-block" /> ITM Put</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-500/15 inline-block" /> ATM</span>
              <span className="ml-auto">Click any LTP to inspect</span>
            </div>
          </div>

          {/* ── Right Panel: Selected Option Details ── */}
          <div className="space-y-4">
            {selectedRow && selectedBS ? (
              <>
                {/* Premium Card */}
                <div className={`card p-5 border ${selectedRow.type === 'CALL' ? 'border-green-500/20 bg-green-500/3' : 'border-red-500/20 bg-red-500/3'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {selected.label} {selectedRow.type}
                      </p>
                      <p className={`text-2xl font-black font-mono ${selectedRow.type === 'CALL' ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{selectedBS.price.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Strike: ₹{selectedRow.strike.toLocaleString('en-IN')} &nbsp;• &nbsp;
                        {selectedRow.strike < spotPrice ? (
                          <span className="text-green-400 font-bold">ITM ✓</span>
                        ) : selectedRow.strike > spotPrice ? (
                          <span className="text-slate-400 font-bold">OTM</span>
                        ) : (
                          <span className="text-violet-400 font-bold">ATM</span>
                        )}
                      </p>
                    </div>
                    <div className={`text-4xl ${selectedRow.type === 'CALL' ? '' : ''}`}>
                      {selectedRow.type === 'CALL' ? '📈' : '📉'}
                    </div>
                  </div>

                  {/* Greeks Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    <GreekBadge label="Δ Delta" value={selectedBS.delta} color={selectedRow.type === 'CALL' ? 'cyan' : 'pink'} />
                    <GreekBadge label="Γ Gamma" value={selectedBS.gamma} color="amber" fmt={v => v.toFixed(5)} />
                    <GreekBadge label="Θ Theta/d" value={selectedBS.theta} color="red" fmt={v => v.toFixed(3)} />
                    <GreekBadge label="ν Vega/1%" value={selectedBS.vega} color="purple" fmt={v => v.toFixed(3)} />
                    <GreekBadge label="ρ Rho/1%" value={selectedBS.rho} color="green" fmt={v => v.toFixed(3)} />
                    <GreekBadge label="IV %" value={iv} color="cyan" fmt={v => `${v}%`} />
                  </div>

                  {/* Intrinsic vs Time Value */}
                  <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Intrinsic</p>
                      <p className="text-sm font-black text-emerald-400 font-mono">₹{selectedBS.intrinsic.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Time Value</p>
                      <p className="text-sm font-black text-amber-400 font-mono">₹{selectedBS.timeValue.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Add to Strategy */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToPayoffLegs(selectedRow.strike, selectedRow.type, 'BUY')}
                      className="py-2 rounded-xl text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      ＋ BUY Leg
                    </button>
                    <button
                      onClick={() => addToPayoffLegs(selectedRow.strike, selectedRow.type, 'SELL')}
                      className="py-2 rounded-xl text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                    >
                      ＋ SELL Leg
                    </button>
                  </div>
                </div>

                {/* Strategy Legs List */}
                {payoffLegs.length > 0 && (
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Strategy Legs</p>
                      <button onClick={() => setPayoffLegs([])} className="text-[9px] text-red-400 hover:text-red-300 font-black">Clear All</button>
                    </div>
                    {payoffLegs.map((l, i) => (
                      <div key={i} className={`flex items-center justify-between p-2 rounded-lg mb-1 text-[10px] ${l.side === 'BUY' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <span className={`font-black ${l.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{l.side}</span>
                        <span className="text-white font-mono">{l.type} ₹{l.strike}</span>
                        <button onClick={() => setPayoffLegs(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 font-black text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-2">👆</p>
                <p className="text-slate-400 text-sm font-bold">Click any LTP in the chain</p>
                <p className="text-slate-600 text-xs mt-1">to inspect Greeks & build payoff</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Payoff Diagram ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card p-5">
            <h3 className="font-black text-white mb-1">📐 Payoff at Expiry</h3>
            <p className="text-[10px] text-slate-400 mb-4">
              {selectedRow ? `${selectedRow.type} @ ₹${selectedRow.strike}${payoffLegs.length > 0 ? ` + ${payoffLegs.length} leg(s)` : ''}` : 'Select an option to build payoff'}
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payoffData}>
                  <defs>
                    <linearGradient id="payoffGradPos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="payoffGradNeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="spot" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} interval={15}
                    tickFormatter={v => `₹${v}`} />
                  <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false}
                    tickFormatter={v => `₹${v}`} />
                  <Tooltip content={<PayoffTooltip />}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  <ReferenceLine x={spotPrice} stroke="#7C3AED" strokeDasharray="3 3" label={{ value: 'Spot', fill: '#7C3AED', fontSize: 9 }} />
                  {selectedRow && (
                    <ReferenceLine x={selectedRow.strike} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Strike', fill: '#f59e0b', fontSize: 9 }} />
                  )}
                  <Area type="monotone" dataKey="pnl" name="P&L"
                    stroke="#10b981" strokeWidth={2}
                    fill="url(#payoffGradPos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Premium vs Strike Chart (Smile Approximation) ── */}
          <div className="card p-5">
            <h3 className="font-black text-white mb-1">📊 Premium vs Strike</h3>
            <p className="text-[10px] text-slate-400 mb-4">Call & Put premium curve across strikes</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chainData.map(r => ({ strike: r.K, Call: parseFloat(r.call.price.toFixed(2)), Put: parseFloat(r.put.price.toFixed(2)) }))}>
                  <XAxis dataKey="strike" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false}
                    interval={3} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                  <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend formatter={(v) => <span className="text-[10px] text-slate-400">{v}</span>} />
                  <ReferenceLine x={atmStrike} stroke="#7C3AED" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="Call" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Put" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Greeks Sensitivity Chart ── */}
        <div className="card p-5 mb-5">
          <h3 className="font-black text-white mb-1">⚡ Delta & Gamma Across Strikes</h3>
          <p className="text-[10px] text-slate-400 mb-4">How Greeks change as underlying moves through different strikes</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chainData.map(r => ({
                strike: r.K,
                CallDelta: parseFloat(r.call.delta.toFixed(3)),
                PutDelta: parseFloat(r.put.delta.toFixed(3)),
                Gamma: parseFloat((r.call.gamma * 100).toFixed(4))
              }))}>
                <XAxis dataKey="strike" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false}
                  interval={3} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                <Legend formatter={(v) => <span className="text-[10px] text-slate-400">{v}</span>} />
                <ReferenceLine x={atmStrike} stroke="#7C3AED" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="CallDelta" stroke="#10b981" strokeWidth={2} dot={false} name="Call Δ" />
                <Line type="monotone" dataKey="PutDelta" stroke="#ef4444" strokeWidth={2} dot={false} name="Put Δ" />
                <Line type="monotone" dataKey="Gamma" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Γ×100" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Strategy Quick Presets ── */}
        <div className="card p-5">
          <h3 className="font-black text-white mb-1">🎯 Strategy Presets</h3>
          <p className="text-[10px] text-slate-400 mb-4">Common multi-leg options strategies — ATM = ₹{atmStrike?.toLocaleString('en-IN')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Long Call', legs: [{ type: 'CALL', side: 'BUY', offset: 0 }], color: 'emerald', desc: 'Bullish' },
              { name: 'Long Put', legs: [{ type: 'PUT', side: 'BUY', offset: 0 }], color: 'red', desc: 'Bearish' },
              { name: 'Bull Spread', legs: [{ type: 'CALL', side: 'BUY', offset: 0 }, { type: 'CALL', side: 'SELL', offset: 1 }], color: 'cyan', desc: 'Limited upside' },
              { name: 'Bear Spread', legs: [{ type: 'PUT', side: 'BUY', offset: 0 }, { type: 'PUT', side: 'SELL', offset: -1 }], color: 'violet', desc: 'Limited downside' },
              { name: 'Straddle', legs: [{ type: 'CALL', side: 'BUY', offset: 0 }, { type: 'PUT', side: 'BUY', offset: 0 }], color: 'amber', desc: 'Big move either way' },
              { name: 'Strangle', legs: [{ type: 'CALL', side: 'BUY', offset: 1 }, { type: 'PUT', side: 'BUY', offset: -1 }], color: 'pink', desc: 'Wide OTM play' },
            ].map((strat, i) => {
              const { strikes, step } = generateStrikeRange(spotPrice);
              const atm = Math.round(spotPrice / step) * step;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPayoffLegs([]);
                    const legData = strat.legs.map(l => ({
                      strike: parseFloat((atm + l.offset * step).toFixed(2)),
                      type: l.type,
                      side: l.side
                    }));
                    setPayoffLegs(legData);
                    setSelectedRow({ strike: legData[0].strike, type: legData[0].type });
                    toast.success(`Loaded ${strat.name} strategy`);
                  }}
                  className={`p-3 rounded-2xl border text-left hover:scale-102 transition-all duration-200 ${
                    strat.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' :
                    strat.color === 'red' ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10' :
                    strat.color === 'cyan' ? 'border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10' :
                    strat.color === 'violet' ? 'border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10' :
                    strat.color === 'amber' ? 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' :
                    'border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10'
                  }`}
                >
                  <p className={`text-xs font-black mb-0.5 ${
                    strat.color === 'emerald' ? 'text-emerald-400' :
                    strat.color === 'red' ? 'text-red-400' :
                    strat.color === 'cyan' ? 'text-cyan-400' :
                    strat.color === 'violet' ? 'text-violet-400' :
                    strat.color === 'amber' ? 'text-amber-400' :
                    'text-pink-400'
                  }`}>{strat.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold">{strat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
        <SectionGuide sectionId="/trade/options" />
      </main>
    
    </div>
  );
};

export default OptionsChain;
