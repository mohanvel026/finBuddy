import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar } from 'recharts';

const MutualFundSIP = () => {
  const [query, setQuery] = useState('Nifty 50');
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFund, setSelectedFund] = useState(null);

  // User virtual capital
  const [walletBalance, setWalletBalance] = useState(100000);

  // Advanced Analysis states
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chartMode, setChartMode] = useState('nav'); // 'nav' (historical) or 'sip' (simulated projection)

  // AI Curation & Advisory
  const [aiAdvisory, setAiAdvisory] = useState(null);
  const [fetchingAI, setFetchingAI] = useState(false);

  // Investment Form
  const [investAmount, setInvestAmount] = useState(5000);
  const [investType, setInvestType] = useState('LUMPSUM'); // 'LUMPSUM' or 'SIP'
  const [investing, setInvesting] = useState(false);

  // Calculator params
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [durationYears, setDurationYears] = useState(10);
  const [sipResult, setSipResult] = useState(null);

  // ── Goal-Targeted SIP States ──
  const [selectedGoal, setSelectedGoal] = useState('Dream Home 🏡');
  const [goalTargetAmount, setGoalTargetAmount] = useState(5000000); // Default 50 Lakhs
  const [inflationRate, setInflationRate] = useState(6); // Default 6%
  const [annualStepUp, setAnnualStepUp] = useState(10); // Default 10% annual increase

  useEffect(() => {
    searchFunds();
    loadWalletBalance();
  }, []);

  useEffect(() => {
    if (selectedFund) {
      loadFundAnalysis(selectedFund.schemeCode);
      loadAIAdvisory(selectedFund.schemeCode);
    }
  }, [selectedFund]);

  useEffect(() => {
    calculateSIP();
  }, [monthlyInvestment, expectedReturn, durationYears, selectedFund, analysis]);

  const loadWalletBalance = async () => {
    try {
      const { data } = await api.get('/trades/portfolio');
      if (data.success) {
        setWalletBalance(data.walletBalance || 100000);
      }
    } catch (e) {
      console.error('Failed to load virtual balance:', e.message);
    }
  };

  const searchFunds = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/market/mutual-funds?search=${encodeURIComponent(query)}`);
      if (data.success) {
        setFunds(data.funds || []);
        if (data.funds?.length > 0 && !selectedFund) {
          setSelectedFund(data.funds[0]);
        }
      }
    } catch (e) {
      toast.error('Failed to fetch mutual funds');
    }
    setLoading(false);
  };

  const loadFundAnalysis = async (code) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await api.get(`/market/mutual-funds/${code}/analyze`);
      if (data.success) {
        setAnalysis(data);
        if (data.analysis?.returns?.threeYearCAGR) {
          setExpectedReturn(Math.round(data.analysis.returns.threeYearCAGR));
        }
        setChartMode('nav');
      }
    } catch (e) {
      toast.error('Failed to load fund CAGR metrics');
    }
    setAnalyzing(false);
  };

  const loadAIAdvisory = async (code) => {
    setFetchingAI(true);
    setAiAdvisory(null);
    try {
      const { data } = await api.get(`/market/mutual-funds/${code}/ai-advisor`);
      if (data.success) {
        setAiAdvisory(data.aiAdvisory);
      }
    } catch (e) {
      console.error('AI Advisory failed:', e.message);
    }
    setFetchingAI(false);
  };

  const calculateSIP = () => {
    const P = parseFloat(monthlyInvestment);
    const i = parseFloat(expectedReturn) / 12 / 100;
    const n = parseFloat(durationYears) * 12;

    if (P <= 0 || i <= 0 || n <= 0) return;

    // ── Standard SIP future value ──
    const futureValue = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    const totalInvested = P * n;
    const wealthGain = futureValue - totalInvested;

    // ── Step-Up SIP future value (annual increment) ──
    const stepRate = annualStepUp / 100;
    let stepUpTotal = 0;
    let stepUpInvested = 0;
    for (let yr = 1; yr <= durationYears; yr++) {
      const sipThisYear = P * Math.pow(1 + stepRate, yr - 1);
      const monthsRemaining = (durationYears - yr + 1) * 12;
      stepUpTotal += sipThisYear * (((Math.pow(1 + i, monthsRemaining) - 1) / i) * (1 + i));
      stepUpInvested += sipThisYear * 12;
    }

    // ── Inflation-adjusted goal target ──
    const inflationAdjustedGoal = goalTargetAmount * Math.pow(1 + inflationRate / 100, durationYears);
    const shortfall = Math.max(0, inflationAdjustedGoal - futureValue);
    const stepUpCoversGoal = stepUpTotal >= inflationAdjustedGoal;

    // ── Required SIP to hit goal ──
    const requiredSIP = i > 0
      ? Math.ceil((inflationAdjustedGoal * i) / (((Math.pow(1 + i, n) - 1)) * (1 + i)))
      : Math.ceil(inflationAdjustedGoal / n);

    const chartData = [];
    for (let yr = 1; yr <= durationYears; yr++) {
      const months = yr * 12;
      const fv = P * (((Math.pow(1 + i, months) - 1) / i) * (1 + i));
      const invested = P * months;
      const goalLine = goalTargetAmount * Math.pow(1 + inflationRate / 100, yr);
      chartData.push({
        year: `Yr ${yr}`,
        Invested: Math.round(invested),
        ExpectedWealth: Math.round(fv),
        GoalTarget: Math.round(goalLine),
      });
    }

    setSipResult({
      totalInvested: Math.round(totalInvested),
      futureValue: Math.round(futureValue),
      wealthGain: Math.round(wealthGain),
      stepUpTotal: Math.round(stepUpTotal),
      stepUpInvested: Math.round(stepUpInvested),
      inflationAdjustedGoal: Math.round(inflationAdjustedGoal),
      shortfall: Math.round(shortfall),
      requiredSIP,
      stepUpCoversGoal,
      chartData,
    });
  };

  // ── Quantitative Risk Ratio Engine (Sharpe / Sortino / Alpha / Beta) ──
  const computeQuantRatios = (navData) => {
    if (!navData || navData.length < 60) return null;

    const prices = navData.slice(-252).map(d => parseFloat(d.NAV)).filter(Boolean);
    if (prices.length < 30) return null;

    const dailyReturns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);

    // Benchmark Nifty 50 proxy: assume 0.04% avg daily return
    const benchmarkDailyReturn = 0.0004;
    const riskFreeRate = 0.065 / 252; // 6.5% annual risk-free rate

    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe Ratio (annualised)
    const sharpe = stdDev > 0
      ? (((meanReturn - riskFreeRate) * 252) / (stdDev * Math.sqrt(252))).toFixed(2)
      : 'N/A';

    // Sortino Ratio (downside deviation only)
    const downsideReturns = dailyReturns.filter(r => r < 0);
    const downsideVariance = downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / (downsideReturns.length || 1);
    const downsideStd = Math.sqrt(downsideVariance);
    const sortino = downsideStd > 0
      ? (((meanReturn - riskFreeRate) * 252) / (downsideStd * Math.sqrt(252))).toFixed(2)
      : 'N/A';

    // Beta (vs benchmark)
    const covariance = dailyReturns.reduce((a, r) => a + (r - meanReturn) * (benchmarkDailyReturn - benchmarkDailyReturn), 0) / dailyReturns.length;
    const benchmarkVariance = Math.pow(benchmarkDailyReturn * 0.5, 2); // simplified
    const beta = (benchmarkVariance > 0 ? (covariance / benchmarkVariance) : 1).toFixed(2);

    // Alpha (Jensen's Alpha)
    const annualisedReturn = meanReturn * 252;
    const alpha = (annualisedReturn - (riskFreeRate * 252 + parseFloat(beta) * (benchmarkDailyReturn * 252 - riskFreeRate * 252))).toFixed(2);

    // Max Drawdown
    let peak = prices[0];
    let maxDrawdown = 0;
    prices.forEach(p => {
      if (p > peak) peak = p;
      const drawdown = (peak - p) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return {
      sharpe,
      sortino,
      beta,
      alpha: (parseFloat(alpha) * 100).toFixed(2) + '%',
      maxDrawdown: (maxDrawdown * 100).toFixed(1) + '%',
      volatility: (stdDev * Math.sqrt(252) * 100).toFixed(1) + '%',
    };
  };

  // ── Expense Ratio Leakage Scanner ──
  const computeLeakageScan = () => {
    const monthly = parseFloat(monthlyInvestment) || 10000;
    const years = parseFloat(durationYears) || 20;
    const n = years * 12;
    const grossReturn = parseFloat(expectedReturn) || 12;

    const plans = [
      { label: 'Your Direct Plan', expense: 0.2, color: '#A78BFA' },
      { label: 'Regular Dist. Plan', expense: 1.5, color: '#ef4444' },
      { label: 'Avg Active Fund', expense: 0.95, color: '#f59e0b' },
      { label: 'Passive ETF', expense: 0.07, color: '#7C3AED' },
    ];

    return plans.map(plan => {
      const netRate = (grossReturn - plan.expense) / 100 / 12;
      const fv = netRate > 0
        ? monthly * (((Math.pow(1 + netRate, n) - 1) / netRate) * (1 + netRate))
        : monthly * n;
      const invested = monthly * n;
      const gain = fv - invested;
      return { ...plan, fv: Math.round(fv), gain: Math.round(gain), invested: Math.round(invested) };
    });
  };

  const handleInvest = async () => {
    if (!selectedFund || !analysis) {
      toast.error('Please select a scheme first');
      return;
    }
    if (investAmount <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }
    if (walletBalance < investAmount) {
      toast.error(`Insufficient virtual capital! Have ₹${walletBalance.toLocaleString('en-IN')}, need ₹${investAmount.toLocaleString('en-IN')}`);
      return;
    }

    setInvesting(true);
    try {
      // Virtual sandbox capital investment
      const { data } = await api.post('/trades/buy-mutual-fund', {
        schemeCode: selectedFund.schemeCode,
        schemeName: selectedFund.schemeName,
        amount: investAmount,
        investmentType: investType,
        nav: analysis.analysis.latestNAV
      });

      if (data.success) {
        toast.success(`🎉 Virtual investment of ₹${investAmount.toLocaleString('en-IN')} completed!`);
        loadWalletBalance(); // update virtual balance instantly
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Investment failed to complete');
    }
    setInvesting(false);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Search & Sandbox Play Capital (col-span-4) */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        
        {/* Real Mutual Funds Search Card */}
        <div className="card flex flex-col justify-between bg-white/2 border border-white/5 p-5 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔍</span>
              <div>
                <h3 className="font-extrabold text-sm text-white">Real Mutual Funds Search</h3>
                <p className="text-[10px] text-slate-400">Powered by live Association of Mutual Funds in India (AMFI) index</p>
              </div>
            </div>
            
            <div className="flex gap-2 mb-4 mt-2">
              <input
                className="input-dark text-xs flex-1 py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 font-medium focus:border-cyan-400 focus:outline-none transition"
                placeholder="e.g. Axis, Quant, Nifty 50..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchFunds()}
              />
              <button
                onClick={searchFunds}
                className="py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Search
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col justify-center items-center py-12 space-y-2">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-slate-500">Querying AMFI Registry...</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                {funds.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-6">No funds found. Try another search query!</p>
                ) : (
                  funds.map((f) => (
                    <div
                      key={f.schemeCode}
                      onClick={() => setSelectedFund(f)}
                      className={`p-3 rounded-xl cursor-pointer text-[11px] transition-all border ${
                        selectedFund?.schemeCode === f.schemeCode
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-white font-bold shadow-inner'
                          : 'bg-white/2 border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <p className="line-clamp-2 leading-relaxed">{f.schemeName}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">Code: {f.schemeCode}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 💼 Interactive Paper-Trading Investment Module (Balanced on the Left!) */}
        {selectedFund && analysis && (
          <div className="card bg-gradient-to-br from-[#0c142c] to-[#080d1e] border border-cyan-500/20 p-5 rounded-3xl space-y-4 shadow-xl animate-fade-in">
            <div className="border-b border-white/5 pb-2">
              <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-black uppercase">
                Sandbox Play capital Desk
              </span>
              <h4 className="text-xs font-black text-white mt-2 flex items-center gap-1.5">
                💼 Buy Asset with Paper Money
              </h4>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold font-mono">Buy Amount (INR)</label>
                <input
                  type="number"
                  className="input-dark font-black text-sm bg-black/45 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-cyan-400 focus:outline-none w-full"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Math.max(100, parseInt(e.target.value) || 0))}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold font-mono">Investment Style</label>
                <select
                  className="input-dark font-bold text-xs bg-black/45 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-cyan-400 focus:outline-none w-full"
                  value={investType}
                  onChange={(e) => setInvestType(e.target.value)}
                >
                  <option value="LUMPSUM">One-Time Lumpsum</option>
                  <option value="SIP">Monthly SIP Plan</option>
                </select>
              </div>

              <div className="pt-1.5">
                <button
                  onClick={handleInvest}
                  disabled={investing}
                  className="py-2.5 w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                >
                  {investing ? 'Processing sandbox asset...' : 'Execute Buy (Virtual Capital)'}
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono bg-black/25 p-2.5 rounded-xl border border-white/5">
                <span>Demat Wallet:</span>
                <span className="font-bold text-emerald-400">₹{walletBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Statistics, Interactive Recharts, Sliders, and Risk analysis (col-span-8) */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        
        {/* Selected Scheme details banner */}
        {selectedFund && (
          <div className="card p-5 bg-white/2 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div className="space-y-1">
              <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                Active Scheme ({selectedFund.schemeCode})
              </span>
              <h4 className="font-black text-lg text-white mt-2 leading-snug">{selectedFund.schemeName}</h4>
            </div>
            {analysis?.analysis?.risk && (
              <span className="text-xs font-black px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-inner shrink-0">
                🟡 {analysis.analysis.risk.label}
              </span>
            )}
          </div>
        )}

        {/* Dynamic Curation Grid (AMFI Analysis Results) */}
        {analyzing ? (
          <div className="card flex justify-center items-center py-8 bg-white/2 border border-white/5 rounded-3xl">
            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 ml-3">Conducting Quantitative Backtests...</span>
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Latest NAV', val: `₹${analysis.analysis.latestNAV}`, sub: analysis.analysis.latestDate },
              { label: '1Y Return', val: analysis.analysis.returns.oneYear ? `${analysis.analysis.returns.oneYear}%` : 'N/A', sub: 'Past 12 Months', color: analysis.analysis.returns.oneYear >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: '3Y CAGR', val: analysis.analysis.returns.threeYearCAGR ? `${analysis.analysis.returns.threeYearCAGR}%` : 'N/A', sub: 'Medium Horizon', color: analysis.analysis.returns.threeYearCAGR >= 0 ? 'text-green-400' : 'text-red-400' },
              { label: '5Y CAGR', val: analysis.analysis.returns.fiveYearCAGR ? `${analysis.analysis.returns.fiveYearCAGR}%` : 'N/A', sub: 'Long Term', color: analysis.analysis.returns.fiveYearCAGR >= 0 ? 'text-green-400' : 'text-red-400' },
            ].map((card, i) => (
              <div key={i} className="p-4 bg-white/2 border border-white/5 rounded-2xl text-center shadow-lg hover:border-white/10 transition duration-300">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">{card.label}</p>
                <p className={`text-xl font-black mt-1.5 ${card.color || 'text-white'}`}>{card.val}</p>
                <p className="text-[9px] text-slate-500 mt-1 font-mono">{card.sub}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* 🤖 AI Dynamic Advisor Panel */}
        {fetchingAI ? (
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-cyan-400 font-semibold tracking-wide">AI conducting Curation & suitability analytics...</span>
          </div>
        ) : aiAdvisory ? (
          <div className="card p-5 bg-cyan-950/10 border border-cyan-500/15 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-cyan-500/10 border-l border-b border-cyan-500/25 rounded-bl-xl text-[9px] font-black text-cyan-400 uppercase tracking-wider">
              🤖 AI ADVISOR CURATION
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${
                aiAdvisory.verdict === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                aiAdvisory.verdict === 'AVOID' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                VERDICT: {aiAdvisory.verdict}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                  <span>SIP suitability Score</span>
                  <span>{aiAdvisory.suitabilityScore} / 10</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${aiAdvisory.suitabilityScore * 10}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-black/25 rounded-2xl border border-white/5">
                <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  📁 Fundamental Analysis
                </h5>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{aiAdvisory.fundamentalAnalysis}</p>
              </div>
              <div className="p-3 bg-black/25 rounded-2xl border border-white/5">
                <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  📈 Technical Analysis
                </h5>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{aiAdvisory.technicalAnalysis}</p>
              </div>
            </div>

            <p className="text-xs font-bold text-cyan-400 italic bg-cyan-950/20 p-3 rounded-2xl border border-cyan-500/10">
              💡 Summary Verdict: {aiAdvisory.reason}
            </p>
          </div>
        ) : null}

        {/* Chart View Selector */}
        <div className="flex gap-4 border-b border-white/5 pb-2">
          <button
            onClick={() => setChartMode('nav')}
            disabled={!analysis}
            className={`pb-2 px-1 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 ${
              chartMode === 'nav'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            📊 Real NAV Trajectory (AMFI)
          </button>
          <button
            onClick={() => setChartMode('sip')}
            className={`pb-2 px-1 text-xs uppercase font-extrabold tracking-wider transition-all border-b-2 ${
              chartMode === 'sip'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📈 Simulated Compounding SIP
          </button>
        </div>

        {/* Charts & Plots */}
        <div className="card p-5 bg-white/2 border border-white/5 rounded-3xl shadow-xl">
          {chartMode === 'nav' && analysis?.chartData ? (
            <div className="h-60 w-full">
              <p className="text-xs text-slate-400 mb-3">NAV value chart over the last year of active trading:</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysis.chartData}>
                  <defs>
                    <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} interval={40} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    formatter={(v) => [`₹${v.toFixed(2)}`, 'NAV']}
                    contentStyle={{ background: '#0f172a', border: '1px solid #7C3AED33', borderRadius: '12px' }}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="NAV" stroke="#7C3AED" strokeWidth={2.5} fill="url(#navGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : sipResult?.chartData ? (
            <div className="h-60 w-full">
              <p className="text-xs text-slate-400 mb-3">Wealth growth vs invested capital vs <span className="text-yellow-400 font-semibold">inflation-adjusted goal</span>:</p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sipResult.chartData}>
                  <defs>
                    <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip
                    formatter={(v, name) => [`₹${v.toLocaleString('en-IN')}`, name === 'GoalTarget' ? '🎯 Goal' : name]}
                    contentStyle={{ background: '#0f172a', border: '1px solid #8b5cf633', borderRadius: '12px' }}
                   cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="ExpectedWealth" name="Projected Wealth" stroke="#8b5cf6" strokeWidth={2} fill="url(#wealthGrad)" />
                  <Area type="monotone" dataKey="Invested" name="Invested" stroke="#A78BFA" strokeWidth={2} fill="url(#investGrad)" />
                  <Area type="monotone" dataKey="GoalTarget" name="GoalTarget" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
              <p>Select a fund or run search to visualize interactive trajectory curves</p>
            </div>
          )}
        </div>

      </div>


      {/* Simulator Inputs & Results Dashboard (Full-Width Below Grid) */}
      <div className="col-span-12 mt-6 pt-6 border-t border-white/5 space-y-6">
        {/* ── SECTION: Simulator Inputs ── */}
        <div className="card p-5 bg-white/2 border border-white/5 rounded-3xl shadow-xl space-y-5">
          <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">⚙️ SIP Parameters & Sliders</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Monthly SIP (₹)</label>
              <input type="number" className="input-dark font-black text-sm bg-black/45 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-cyan-400 focus:outline-none w-full" value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Math.max(100, parseInt(e.target.value) || 0))} />
              <input type="range" min="500" max="100000" step="500" className="w-full mt-2 accent-cyan-400"
                value={monthlyInvestment} onChange={(e) => setMonthlyInvestment(parseInt(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Expected Return (% p.a.)</label>
              <input type="number" className="input-dark font-black text-sm bg-black/45 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-cyan-400 focus:outline-none w-full" value={expectedReturn}
                onChange={(e) => setExpectedReturn(Math.max(1, parseFloat(e.target.value) || 0))} />
              <input type="range" min="5" max="30" step="0.5" className="w-full mt-2 accent-cyan-400"
                value={expectedReturn} onChange={(e) => setExpectedReturn(parseFloat(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Duration (Years)</label>
              <input type="number" className="input-dark font-black text-sm bg-black/45 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-cyan-400 focus:outline-none w-full" value={durationYears}
                onChange={(e) => setDurationYears(Math.max(1, parseInt(e.target.value) || 0))} />
              <input type="range" min="1" max="40" step="1" className="w-full mt-2 accent-cyan-400"
                value={durationYears} onChange={(e) => setDurationYears(parseInt(e.target.value))} />
            </div>
          </div>

          {/* ── Goal Planner Row ── */}
          <div className="grid md:grid-cols-4 gap-3.5 p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl">
            <div>
              <label className="text-[10px] text-yellow-400 font-bold uppercase block mb-1">🎯 Life Goal</label>
              <select className="input-dark text-xs py-1.5 px-3 bg-black/55 border border-white/15 rounded-xl text-yellow-300 w-full focus:outline-none" value={selectedGoal}
                onChange={e => setSelectedGoal(e.target.value)}>
                {['Dream Home 🏡','Child Education 🎓','Retirement Fund 🌅','Dream Car 🚗','World Travel ✈️','Emergency Corpus 🛡️'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-yellow-400 font-bold uppercase block mb-1">Target (₹)</label>
              <input type="number" className="input-dark text-xs py-1.5 px-3 bg-black/55 border border-white/15 rounded-xl text-yellow-300 w-full focus:outline-none" value={goalTargetAmount}
                onChange={e => setGoalTargetAmount(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-[10px] text-yellow-400 font-bold uppercase block mb-1">Inflation Rate (%)</label>
              <input type="range" min="3" max="12" step="0.5" className="w-full mt-3 accent-yellow-400"
                value={inflationRate} onChange={e => setInflationRate(parseFloat(e.target.value))} />
              <p className="text-[9px] text-yellow-400 text-right font-bold font-mono">{inflationRate}%</p>
            </div>
            <div>
              <label className="text-[10px] text-yellow-400 font-bold uppercase block mb-1">Annual Step-Up (%)</label>
              <input type="range" min="0" max="25" step="1" className="w-full mt-3 accent-yellow-400"
                value={annualStepUp} onChange={e => setAnnualStepUp(parseInt(e.target.value))} />
              <p className="text-[9px] text-yellow-400 text-right font-bold font-mono">{annualStepUp}%/yr</p>
            </div>
          </div>
        </div>

        {/* ── SECTION: Results Dashboard ── */}
        {sipResult && (
          <div className="space-y-5">

            {/* Row 1 — Core metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Invested', val: sipResult.totalInvested, color: 'text-white' },
                { label: 'Est. Wealth Gain', val: sipResult.wealthGain, color: 'text-green-400' },
                { label: 'Projected Value', val: sipResult.futureValue, color: 'text-cyan-400', highlight: true },
                { label: 'Step-Up Portfolio', val: sipResult.stepUpTotal, color: 'text-purple-400' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl text-center shadow-lg transition duration-300 ${
                  item.highlight ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/2 border border-white/5'
                }`}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className={`text-base font-black mt-2 ${item.color}`}>₹{item.val.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>

            {/* Row 2 — Goal Shortfall Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
              sipResult.shortfall === 0
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="space-y-1.5">
                <p className="text-xs font-black text-white flex items-center gap-2">
                  {sipResult.shortfall === 0 ? '✅ GOAL ACHIEVABLE!' : '⚠️ GOAL SHORTFALL DETECTED'} — {selectedGoal}
                </p>
                <p className="text-[11px] text-slate-400">
                  Inflation-adjusted target in {durationYears} yrs: <strong className="text-yellow-400 font-mono">₹{sipResult.inflationAdjustedGoal.toLocaleString('en-IN')}</strong>
                  {sipResult.shortfall > 0 && <> &nbsp;•&nbsp; Shortfall: <strong className="text-red-400 font-mono">₹{sipResult.shortfall.toLocaleString('en-IN')}</strong></>}
                </p>
                {sipResult.shortfall > 0 && (
                  <p className="text-[11px] text-slate-300">
                    💡 Suggestion: Increase your monthly SIP to <strong className="text-cyan-400 font-mono">₹{sipResult.requiredSIP.toLocaleString('en-IN')}</strong> or enable
                    &nbsp;<strong className="text-purple-400 font-mono">{annualStepUp}% annual step-up</strong>
                    &nbsp;{sipResult.stepUpCoversGoal ? '✅ (covers target!)' : '⚠️ (still insufficient)'}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-3xl animate-bounce">
                {sipResult.shortfall === 0 ? '🏆' : '🎯'}
              </div>
            </div>

            {/* Row 3 — Quant Risk Ratios */}
            {analysis?.chartData && (() => {
              const ratios = computeQuantRatios(analysis.chartData);
              if (!ratios) return null;
              return (
                <div className="p-4 bg-white/2 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">📐 Quantitative Risk Metrics (Computed from Real NAV Data)</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: 'Sharpe Ratio', val: ratios.sharpe, tip: '>1 = good risk-adjusted return', color: parseFloat(ratios.sharpe) > 1 ? 'text-green-400' : 'text-yellow-400' },
                      { label: 'Sortino Ratio', val: ratios.sortino, tip: 'Penalises downside only', color: parseFloat(ratios.sortino) > 1 ? 'text-green-400' : 'text-yellow-400' },
                      { label: 'Beta (β)', val: ratios.beta, tip: '<1 = less volatile than market', color: parseFloat(ratios.beta) < 1 ? 'text-green-400' : 'text-red-400' },
                      { label: 'Alpha (α)', val: ratios.alpha, tip: 'Excess return vs benchmark', color: 'text-cyan-400' },
                      { label: 'Max Drawdown', val: ratios.maxDrawdown, tip: 'Worst peak-to-trough drop', color: 'text-red-400' },
                      { label: 'Volatility', val: ratios.volatility, tip: 'Annual std deviation', color: 'text-slate-300' },
                    ].map((r, i) => (
                      <div key={i} className="p-3 bg-black/25 rounded-2xl text-center border border-white/5 group relative cursor-help hover:border-white/15 transition duration-300">
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{r.label}</p>
                        <p className={`text-xs font-black mt-1.5 ${r.color}`}>{r.val}</p>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 bg-slate-900 border border-white/10 rounded-xl text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none z-10 shadow-2xl">
                          {r.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Row 4 — Expense Leakage Scanner */}
            {(() => {
              const plans = computeLeakageScan();
              const best = plans.reduce((a, b) => a.fv > b.fv ? a : b);
              return (
                <div className="p-4 bg-red-500/2 border border-red-500/10 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">🔍 Expense Ratio Leakage Scanner — Same SIP, Different Fee Plans</p>
                    <span className="text-[9px] text-slate-500 font-mono">{durationYears} years at ₹{monthlyInvestment.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="space-y-2.5">
                    {plans.map((plan, i) => {
                      const pct = (plan.fv / best.fv) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 w-36 shrink-0 font-medium">{plan.label} <span className="text-slate-600">({plan.expense}%)</span></span>
                          <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: plan.color }}
                            />
                          </div>
                          <span className="text-[10px] font-black shrink-0 font-mono" style={{ color: plan.color }}>
                            ₹{(plan.fv / 100000).toFixed(1)}L
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-white/5 leading-relaxed">
                    💡 Switching from Regular (1.5%) to Direct (0.2%) saves you
                    &nbsp;<strong className="text-green-400 font-mono">₹{((plans[0].fv - plans[1].fv) / 100000).toFixed(2)} Lakhs</strong> over {durationYears} years in leaked advisor commissions!
                  </p>
                </div>
              );
            })()}

          </div>
        )}

      </div>
    </div>
  );
};

export default MutualFundSIP;
