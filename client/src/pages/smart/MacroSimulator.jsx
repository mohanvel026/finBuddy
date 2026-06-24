// client/src/pages/smart/MacroSimulator.jsx — Premium Macro Shock Correlation Simulator
import React, { useState, useMemo } from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck, Globe, Activity, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Define asset correlation parameters with macro triggers
const ASSETS = [
  { name: 'Large-Cap Equity', baseReturn: 12, vol: 15, correlations: { fed: -0.4, rbi: -0.3, crude: -0.5, cpi: -0.3 } },
  { name: 'Mid-Cap Equity', baseReturn: 15, vol: 20, correlations: { fed: -0.5, rbi: -0.4, crude: -0.6, cpi: -0.4 } },
  { name: 'G-Sec (Govt Debt)', baseReturn: 7.5, vol: 5, correlations: { fed: -0.2, rbi: -0.6, crude: -0.2, cpi: -0.5 } },
  { name: 'Physical Gold', baseReturn: 9.5, vol: 12, correlations: { fed: -0.3, rbi: 0.0, crude: 0.4, cpi: 0.6 } },
  { name: 'Cryptocurrencies', baseReturn: 30, vol: 45, correlations: { fed: -0.7, rbi: -0.2, crude: 0.1, cpi: 0.2 } },
];

export const MacroSimulator = () => {
  const [fedShift, setFedShift] = useState(0); // in % (e.g. -1.5% to +1.5%)
  const [rbiShift, setRbiShift] = useState(0); // in % (-1.0% to +1.0%)
  const [crudePrice, setCrudePrice] = useState(80); // $80 base
  const [inflationRate, setInflationRate] = useState(5.5); // 5.5% base

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply macro regime templates
  const applyRegime = (regime) => {
    switch (regime) {
      case '2008':
        setFedShift(-1.50);
        setRbiShift(-1.00);
        setCrudePrice(60);
        setInflationRate(3.0);
        toast.success('Regime loaded: 2008 Financial Crisis');
        break;
      case '2022':
        setFedShift(1.50);
        setRbiShift(1.00);
        setCrudePrice(115);
        setInflationRate(8.5);
        toast.success('Regime loaded: 2022 Inflation Shock');
        break;
      case 'stagflation':
        setFedShift(0.75);
        setRbiShift(0.50);
        setCrudePrice(100);
        setInflationRate(7.6);
        toast.success('Regime loaded: Stagflation Era');
        break;
      case 'goldilocks':
        setFedShift(-0.50);
        setRbiShift(-0.25);
        setCrudePrice(75);
        setInflationRate(4.2);
        toast.success('Regime loaded: Goldilocks Economy');
        break;
      default:
        setFedShift(0);
        setRbiShift(0);
        setCrudePrice(80);
        setInflationRate(5.5);
        toast.success('Regime reset to baseline');
    }
  };

  // Compute return shifts based on correlations
  const simulation = useMemo(() => {
    // Shifts relative to base
    const crudeShiftPercent = (crudePrice - 80) / 80; // percent difference from $80 base
    const inflationShiftPercent = (inflationRate - 5.5) / 5.5;

    const chartData = ASSETS.map(asset => {
      // Calculate delta
      const deltaFed = (fedShift) * asset.correlations.fed * 3; // amplify rate impact
      const deltaRbi = (rbiShift) * asset.correlations.rbi * 2.5;
      const deltaCrude = crudeShiftPercent * asset.correlations.crude * 8; // crude impact scaling
      const deltaCpi = inflationShiftPercent * asset.correlations.cpi * 6;

      const totalShift = deltaFed + deltaRbi + deltaCrude + deltaCpi;
      const simulatedReturn = Math.round((asset.baseReturn + totalShift) * 10) / 10;
      
      // Volatility rises under shocks
      const absShock = Math.abs(fedShift) + Math.abs(rbiShift) + Math.abs(crudeShiftPercent) * 2 + Math.abs(inflationShiftPercent) * 1.5;
      const simulatedVol = Math.round((asset.vol + absShock * 2.5) * 10) / 10;

      return {
        name: asset.name,
        'Base Return (%)': asset.baseReturn,
        'Simulated Return (%)': simulatedReturn,
        'Simulated Volatility (%)': simulatedVol,
        shift: Math.round(totalShift * 10) / 10
      };
    });

    return { chartData };
  }, [fedShift, rbiShift, crudePrice, inflationRate]);

  const { chartData } = simulation;

  const handleAskMacroAI = async () => {
    setLoading(true);
    setAiAnalysis('');
    try {
      const { data } = await api.post('/smart/macro-shock', {
        fedShift,
        rbiShift,
        crudePrice,
        inflationRate
      });
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        toast.error('AI analysis failed.');
      }
    } catch {
      toast.error('Failed to contact macro advisor.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-medium">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Pane */}
        <div className="lg:col-span-4 card bg-slate-900/60 border border-white/5 p-5 space-y-4">
          <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            🌐 Macro Stress Sliders
          </h4>

          {/* Premium upgrades: Macro Regime presets selection */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">⚡ Historical Regimes Presets</span>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
              <button onClick={() => applyRegime('2008')} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer text-left">📉 2008 Crash</button>
              <button onClick={() => applyRegime('2022')} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer text-left">🔥 2022 Inflation</button>
              <button onClick={() => applyRegime('stagflation')} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer text-left">🚧 Stagflation</button>
              <button onClick={() => applyRegime('goldilocks')} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer text-left">🦄 Goldilocks</button>
            </div>
            <button onClick={() => applyRegime('reset')} className="text-[9px] text-slate-500 hover:text-cyan-400 underline block cursor-pointer">Reset to baseline</button>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">US Federal Reserve Rate</span>
                <span className={`font-bold ${fedShift > 0 ? 'text-red-400' : fedShift < 0 ? 'text-green-400' : 'text-slate-300'}`}>
                  {fedShift > 0 ? `+${fedShift}% hike` : fedShift < 0 ? `${fedShift}% cut` : 'No change (Base)'}
                </span>
              </div>
              <input 
                type="range"
                min="-1.50"
                max="1.50"
                step="0.25"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={fedShift}
                onChange={e => setFedShift(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">RBI Repo Rate Shift</span>
                <span className={`font-bold ${rbiShift > 0 ? 'text-red-400' : rbiShift < 0 ? 'text-green-400' : 'text-slate-300'}`}>
                  {rbiShift > 0 ? `+${rbiShift}% hike` : rbiShift < 0 ? `${rbiShift}% cut` : 'No change (Base)'}
                </span>
              </div>
              <input 
                type="range"
                min="-1.00"
                max="1.00"
                step="0.25"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={rbiShift}
                onChange={e => setRbiShift(parseFloat(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Brent Crude Price</span>
                <span className={`font-bold ${crudePrice > 90 ? 'text-red-400' : crudePrice < 70 ? 'text-green-400' : 'text-slate-300'}`}>
                  ${crudePrice}/barrel
                </span>
              </div>
              <input 
                type="range"
                min="60"
                max="120"
                step="5"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={crudePrice}
                onChange={e => setCrudePrice(parseInt(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">CPI Inflation Rate</span>
                <span className={`font-bold ${inflationRate > 7 ? 'text-red-400' : inflationRate < 4.5 ? 'text-green-400' : 'text-slate-300'}`}>
                  {inflationRate}% p.a.
                </span>
              </div>
              <input 
                type="range"
                min="3.0"
                max="9.0"
                step="0.2"
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                value={inflationRate}
                onChange={e => setInflationRate(parseFloat(e.target.value))}
              />
            </div>

            <button 
              onClick={handleAskMacroAI}
              disabled={loading}
              className="btn-primary w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Evaluating threat matrix...' : '🌐 Generate AI Threat Report'}
            </button>
          </div>
        </div>

        {/* Right Chart & Correlation Pane */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bar Chart comparing Default vs Simulated */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-base">Macro Sensitivity Projections</h4>
              <p className="text-xs text-slate-400 mt-0.5">Projects return shifts per asset class under current macroeconomic variables.</p>
            </div>

            <div className="h-60 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(val) => `${val}%`}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Base Return (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulated Return (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Table */}
          <div className="card bg-white/3 border border-white/5 p-4 overflow-hidden">
            <h5 className="font-bold text-xs text-white mb-3 flex items-center gap-1.5"><Activity size={14} /> Asset Class Risk Matrix</h5>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-bold">
                    <th className="pb-2">Asset Class</th>
                    <th className="pb-2 text-center">Expected Return</th>
                    <th className="pb-2 text-center">Simulated Return</th>
                    <th className="pb-2 text-center">Expected Volatility</th>
                    <th className="pb-2 text-center">Divergence (Delta)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {chartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/2">
                      <td className="py-2 text-white">{row.name}</td>
                      <td className="py-2 text-center text-slate-400">{row['Base Return (%)']}%</td>
                      <td className="py-2 text-center text-cyan-400">{row['Simulated Return (%)']}%</td>
                      <td className="py-2 text-center text-yellow-500/80">{row['Simulated Volatility (%)']}%</td>
                      <td className={`py-2 text-center font-bold ${row.shift > 0 ? 'text-green-400' : row.shift < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {row.shift > 0 ? `+${row.shift}%` : row.shift < 0 ? `${row.shift}%` : '0.0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Response Card */}
          {aiAnalysis && (
            <div className="card bg-gradient-to-br from-cyan-950/20 to-teal-950/20 border border-cyan-500/20 p-5 space-y-3 animate-fade-in font-medium">
              <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-white/5 pb-2">
                <ShieldCheck size={18} />
                <span className="text-xs uppercase tracking-wider">MACRO REGIME THREAT ASSESSMENT</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">{aiAnalysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
