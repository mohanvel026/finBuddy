// client/src/pages/BacktestArena.jsx
import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Line,
  ResponsiveContainer, ReferenceLine, CartesianGrid
} from 'recharts';

// ─── Popular stocks to test ───
const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'SBI' },
];

// ─── Quick date presets ───
const DATE_PRESETS = [
  { label: '1 Week Ago', desc: 'Recent short-term trading setup. Analyze the immediate price action.', getDates: () => {
    const to = new Date(); to.setDate(to.getDate() - 2);
    const from = new Date(to); from.setDate(from.getDate() - 7);
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0], resultDate: new Date().toISOString().split('T')[0] };
  }},
  { label: '1 Month Ago', desc: 'Medium-term candle pattern test. Practice finding local swing highs and lows.', getDates: () => {
    const to = new Date(); to.setDate(to.getDate() - 2);
    const from = new Date(to); from.setMonth(from.getMonth() - 1);
    return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0], resultDate: new Date().toISOString().split('T')[0] };
  }},
  { label: 'COVID Crash (Mar 2020)', desc: 'Markets collapsed globally in March 2020 due to pandemic lockdowns. Nifty plummeted over 30% in weeks. Can you stay calm?', getDates: () => ({
    from: '2020-01-01', to: '2020-03-23', resultDate: '2020-12-31'
  })},
  { label: 'COVID Recovery', desc: 'One of the fastest bull markets in history. Central banks injected massive liquidity, sending stocks to all-time highs.', getDates: () => ({
    from: '2020-03-23', to: '2020-12-31', resultDate: '2021-12-31'
  })},
  { label: '2022 Bear Market', desc: 'Rising inflation and interest rates triggered a global sell-off. Tech and high-growth sectors suffered severe corrections.', getDates: () => ({
    from: '2022-01-01', to: '2022-06-30', resultDate: '2022-12-31'
  })},
  { label: '2008 Financial Crisis', desc: 'The subprime mortgage meltdown collapsed global investment banks. Nifty fell more than 50% from its peak. A historic test of grit!', getDates: () => ({
    from: '2008-01-01', to: '2008-10-31', resultDate: '2009-12-31'
  })},
  { label: 'DotCom Crash (2000)', desc: 'Speculation in early internet companies bubble burst. Tech stock valuations fell up to 90%, starting a long multi-year tech winter.', getDates: () => ({
    from: '2000-01-01', to: '2000-09-30', resultDate: '2001-12-31'
  })},
];

// ─── Grade colors ───
const gradeColor = (grade) => ({
  'A+': 'text-green-400', 'A': 'text-green-400',
  'B': 'text-cyan-400', 'C': 'text-yellow-400',
  'D': 'text-red-400', 'F': 'text-red-500'
})[grade] || 'text-slate-400';

// ─── Advanced Metrics Engine ─────────────────────────────────────────────────
// Computes institutional-grade risk/return analytics from a candle series
const computeAdvancedMetrics = (candles) => {
  if (!candles || candles.length < 5) return null;

  // Daily returns
  const dailyReturns = [];
  for (let i = 1; i < candles.length; i++) {
    const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    dailyReturns.push(ret);
  }
  if (!dailyReturns.length) return null;

  // Stats
  const n = dailyReturns.length;
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / n;
  const variance = dailyReturns.reduce((a, r) => a + Math.pow(r - avgReturn, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // India risk-free rate: 6.5% p.a. → per day
  const rfDay = 0.065 / 252;

  // Sharpe Ratio (annualised)
  const sharpeRatio = stdDev === 0 ? 0 : ((avgReturn - rfDay) / stdDev) * Math.sqrt(252);

  // Sortino Ratio – penalises only downside volatility
  const negReturns = dailyReturns.filter(r => r < rfDay);
  const downsideVar = negReturns.reduce((a, r) => a + Math.pow(r - rfDay, 2), 0) / (n || 1);
  const downsideDev = Math.sqrt(downsideVar);
  const sortinoRatio = downsideDev === 0 ? 0 : ((avgReturn - rfDay) / downsideDev) * Math.sqrt(252);

  // Max Drawdown — peak-to-trough
  let peak = candles[0].close;
  let maxDrawdown = 0;
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > peak) peak = candles[i].close;
    const dd = (peak - candles[i].close) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // VaR 95% — 5th-percentile of daily returns
  const sorted = [...dailyReturns].sort((a, b) => a - b);
  const var95 = sorted[Math.floor(sorted.length * 0.05)] ?? sorted[0];

  // Annualised return & Calmar Ratio
  const totalRet = (candles[candles.length - 1].close - candles[0].close) / candles[0].close;
  const annReturn = Math.pow(1 + totalRet, 252 / candles.length) - 1;
  const calmarRatio = maxDrawdown === 0 ? 99 : annReturn / maxDrawdown;

  // Win Rate
  const winRate = (dailyReturns.filter(r => r > 0).length / n) * 100;

  // Volatility (annualised)
  const annVolatility = stdDev * Math.sqrt(252);

  return {
    sharpeRatio:    parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio:   parseFloat(sortinoRatio.toFixed(2)),
    maxDrawdown:    parseFloat((maxDrawdown * 100).toFixed(2)),
    var95:          parseFloat((Math.abs(var95) * 100).toFixed(2)),
    calmarRatio:    parseFloat(calmarRatio.toFixed(2)),
    winRate:        parseFloat(winRate.toFixed(1)),
    annVolatility:  parseFloat((annVolatility * 100).toFixed(2)),
    annReturn:      parseFloat((annReturn * 100).toFixed(2)),
    tradingDays:    candles.length,
  };
};

const BacktestArena = () => {
  const { user, updateUser } = useAuth();
  
  // ── Binary Search State ──
  const [bsSearchDate, setBsSearchDate] = useState('2025-06-15'); // Sunday
  const [bsClosestDate, setBsClosestDate] = useState('');
  const [bsSteps, setBsSteps] = useState([]);
  const [bsStepIdx, setBsStepIdx] = useState(-1);
  const [bsTradingDays, setBsTradingDays] = useState([]);

  useEffect(() => {
    const days = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    let curr = new Date(startDate);
    while (curr <= endDate) {
      const dayOfWeek = curr.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dayOfMonth = curr.getDate();
        const month = curr.getMonth();
        const isHoliday = (month === 0 && dayOfMonth === 1) || 
                          (month === 7 && dayOfMonth === 15) || 
                          (month === 9 && dayOfMonth === 2);
        if (!isHoliday) {
          days.push(curr.toISOString().split('T')[0]);
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
    setBsTradingDays(days);
  }, []);

  const runBinarySearchDate = (targetDate) => {
    if (bsTradingDays.length === 0) return;
    const targetTime = new Date(targetDate).getTime();
    let low = 0;
    let high = bsTradingDays.length - 1;
    const steps = [];
    let foundIdx = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midDate = bsTradingDays[mid];
      const midTime = new Date(midDate).getTime();
      
      steps.push({
        low,
        high,
        mid,
        midDate,
        msg: `Step: Checking index ${mid} (${midDate}). Active search boundaries: indices [${low} ... ${high}].`
      });

      if (midTime === targetTime) {
        foundIdx = mid;
        break;
      } else if (midTime < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (foundIdx === -1) {
      let closestIdx = -1;
      let minDiff = Infinity;
      for (const idx of [high, low]) {
        if (idx >= 0 && idx < bsTradingDays.length) {
          const diff = Math.abs(new Date(bsTradingDays[idx]).getTime() - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        }
      }
      foundIdx = closestIdx;
      steps.push({
        low,
        high,
        mid: foundIdx,
        midDate: bsTradingDays[foundIdx],
        msg: `Done: Target date is a weekend/holiday. Closest trading day located at index ${foundIdx} (${bsTradingDays[foundIdx]}).`
      });
    }

    setBsClosestDate(bsTradingDays[foundIdx]);
    setBsSteps(steps);
    setBsStepIdx(0);
  };

  // Step 1: Setup
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [companyName, setCompanyName] = useState('Reliance Industries');
  const [searchQuery, setSearchQuery] = useState('Reliance Industries (RELIANCE.NS)');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [resultDate, setResultDate] = useState('');

  // Step 2: Chart loaded
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Step 3: Result
  const [result, setResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Advanced metrics (computed from candle series when result is set)
  const [advancedMetrics, setAdvancedMetrics] = useState(null);

  // Step tracker
  const [step, setStep] = useState(1); // 1=setup, 2=chart+buy, 3=result

  // Interactive Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [simIndex, setSimIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simQuantity, setSimQuantity] = useState(10);
  const [simTotalInvested, setSimTotalInvested] = useState(0);
  const [simAvgBuy, setSimAvgBuy] = useState(0);
  const [averageDownQty, setAverageDownQty] = useState(10);

  // Premium interactive states
  const [showSma, setShowSma] = useState(false);
  const [equityHistory, setEquityHistory] = useState([]);
  const [eventCue, setEventCue] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Leverage and Margin trading states
  const [leverage, setLeverage] = useState(1);
  const [borrowedAmount, setBorrowedAmount] = useState(0);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  const [isLiquidated, setIsLiquidated] = useState(false);

  // Limit & Stop-Loss states
  const [limitBuyPrice, setLimitBuyPrice] = useState('');
  const [limitBuyQty, setLimitBuyQty] = useState(10);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [isLimitBuyPlaced, setIsLimitBuyPlaced] = useState(false);
  const [isStopLossPlaced, setIsStopLossPlaced] = useState(false);

  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    const dates = preset.getDates();
    setFromDate(dates.from);
    setToDate(dates.to);
    setResultDate(dates.resultDate || new Date().toISOString().split('T')[0]);
  };

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const { data } = await api.get(`/backtest/search?q=${encodeURIComponent(val)}`);
      if (data.success) {
        setSuggestions(data.quotes);
      }
    } catch (err) {
      console.error('Failed to fetch symbol suggestions:', err);
    }
  };

  const loadChart = async () => {
    let targetSymbol = symbol.trim().toUpperCase();
    if (!targetSymbol || !fromDate || !toDate) {
      toast.error('Select a stock and date range first');
      return;
    }
    if (!targetSymbol.includes('.')) {
      targetSymbol = `${targetSymbol}.NS`;
      setSymbol(targetSymbol);
    }
    if (new Date(toDate) >= new Date()) {
      toast.error('End date must be in the past');
      return;
    }
    setChartLoading(true);
    try {
      const { data } = await api.get(
        `/backtest/chart?symbol=${targetSymbol}&fromDate=${fromDate}&toDate=${toDate}`
      );
      setChartData(data);
      setStep(2);
      toast.success(`Chart loaded! Now decide — buy or skip? 🤔`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load chart');
    }
    setChartLoading(false);
  };

  const saveCompletedTrade = async (finalResult, finalWallet) => {
    try {
      await api.post('/backtest/save', {
        symbol: finalResult.symbol,
        companyName: finalResult.companyName,
        quantity: finalResult.quantity,
        price: parseFloat(finalResult.buyPrice.toFixed(2)),
        resultPrice: parseFloat(finalResult.resultPrice.toFixed(2)),
        buyDate: finalResult.buyDate,
        resultDate: finalResult.resultDate,
        profitLoss: parseFloat(finalResult.profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(finalResult.profitLossPercent.toFixed(2)),
        grade: finalResult.feedback.grade,
        finalWalletBalance: finalWallet
      });
    } catch (err) {
      console.error('Failed to save backtest to DB:', err);
    }
  };

  const executeTrade = async () => {
    if (!resultDate) {
      toast.error('Set a result date to check outcome');
      return;
    }
    if (new Date(resultDate) <= new Date(toDate)) {
      toast.error('Result date must be after your buy date');
      return;
    }
    const totalValue = quantity * (chartData?.summary?.endPrice || 0);
    const requiredMargin = totalValue / leverage;
    const walletBalance = user?.virtualWallet ?? 100000;
    if (walletBalance < requiredMargin) {
      toast.error(`Insufficient virtual cash! Required Margin: ₹${Math.round(requiredMargin).toLocaleString('en-IN')}, Available: ₹${Math.round(walletBalance).toLocaleString('en-IN')}`);
      return;
    }
    setResultLoading(true);
    try {
      const { data } = await api.post('/backtest/trade', {
        symbol,
        companyName,
        quantity: parseInt(quantity),
        buyDate: toDate,
        resultDate
      });
      
      const borrowed = totalValue - requiredMargin;
      const maintenance = requiredMargin * 0.10;
      const liqPrice = leverage > 1 ? (borrowed + maintenance) / parseInt(quantity) : 0;

      setBorrowedAmount(borrowed);
      setLiquidationPrice(liqPrice);
      setIsLiquidated(false);
      
      // Deduct margin locally via updateUser
      if (user) {
        updateUser({ virtualWallet: user.virtualWallet - requiredMargin });
      }

      setSimulationData(data.result);
      setSimIndex(0);
      setSimQuantity(parseInt(quantity));
      setSimTotalInvested(totalValue);
      setSimAvgBuy(chartData.summary.endPrice);
      
      // Reset pending orders
      setLimitBuyPrice('');
      setLimitBuyQty(10);
      setStopLossPrice('');
      setIsLimitBuyPlaced(false);
      setIsStopLossPlaced(false);

      setIsSimulating(true);
      setIsPlaying(false);
      toast.success(`Position opened! You are now in Live simulation mode. ⏱️`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Trade execution failed');
    }
    setResultLoading(false);
  };

  const triggerLiquidation = useCallback((price, date) => {
    setIsPlaying(false);
    setIsSimulating(false);
    const collateral = simTotalInvested / leverage;
    const finalPnL = -collateral;
    const finalResult = {
      ...simulationData,
      buyPrice: simAvgBuy,
      resultPrice: price,
      resultDate: date,
      profitLoss: finalPnL,
      profitLossPercent: -100,
      totalInvested: collateral,
      quantity: simQuantity,
      isProfit: false,
      feedback: {
        grade: 'F',
        message: `🚨 MARGIN CALL & FORCE LIQUIDATION! Your position was liquidated on ${date} at price ₹${price} because it dropped below your liquidation price of ₹${liquidationPrice.toFixed(2)}. You lost 100% of your collateral.`
      },
      journey: {
        ...simulationData.journey,
        candles: simulationData.journey.candles.slice(0, simIndex + 1),
        tradingDays: simIndex + 1
      }
    };
    setResult(finalResult);
    setIsLiquidated(true);
    setStep(3);

    const newWallet = user?.virtualWallet ?? 100000;
    updateUser({ virtualWallet: newWallet });
    saveCompletedTrade(finalResult, newWallet);

    toast.error(`🚨 MARGIN CALL: Force Liquidated at ₹${price}! 💀`, { duration: 5000 });
  }, [simulationData, simAvgBuy, liquidationPrice, simQuantity, simTotalInvested, leverage, simIndex, user, updateUser]);

  const getEarlyExitFeedback = (pct) => {
    let grade = 'C';
    let message = '';
    if (pct >= 20) {
      grade = 'A+';
      message = 'Diamond hands paid off! You cashed out with massive gains.';
    } else if (pct >= 5) {
      grade = 'A';
      message = 'Smart exit! You took profits at a great moment and protected your capital.';
    } else if (pct > 0) {
      grade = 'B';
      message = 'Profitable trade! Locking in green returns is key to long-term success.';
    } else if (pct >= -10) {
      grade = 'C';
      message = 'Took a small loss. You cut your position early, which is a good risk practice.';
    } else if (pct >= -20) {
      grade = 'D';
      message = 'Cashed out at a major loss. Review chart patterns to avoid selling at the bottom.';
    } else {
      grade = 'F';
      message = 'Extreme drawdown. Ensure you size your positions correctly next time.';
    }
    return { grade, message };
  };

  const finishSimulation = (endIdx) => {
    if (!simulationData) return;
    const currentPrice = simulationData.journey.candles[endIdx].close;
    const finalPnL = (simQuantity * currentPrice) - simTotalInvested;
    const collateral = simTotalInvested / leverage;
    const finalPnLPercent = (finalPnL / collateral) * 100;
    
    const finalResult = {
      ...simulationData,
      buyPrice: simAvgBuy,
      resultPrice: currentPrice,
      resultDate: simulationData.journey.candles[endIdx].date,
      profitLoss: finalPnL,
      profitLossPercent: parseFloat(finalPnLPercent.toFixed(2)),
      totalInvested: simTotalInvested,
      quantity: simQuantity,
      isProfit: finalPnL >= 0,
      feedback: getEarlyExitFeedback(finalPnLPercent)
    };
    
    setResult(finalResult);
    setAdvancedMetrics(computeAdvancedMetrics(simulationData.journey.candles.slice(0, endIdx + 1)));
    setIsSimulating(false);
    setStep(3);

    const refund = leverage > 1 ? (simQuantity * currentPrice) - borrowedAmount : simQuantity * currentPrice;
    const newWallet = (user?.virtualWallet ?? 100000) + refund;
    updateUser({ virtualWallet: newWallet });
    saveCompletedTrade(finalResult, newWallet);

    toast.success('Simulation complete! Review your scorecard. 📊');
  };

  const evaluateStepTriggers = useCallback((candle, idx) => {
    if (!simulationData) return { stop: false };

    // Check for Liquidation
    if (leverage > 1 && liquidationPrice > 0 && candle.close <= liquidationPrice) {
      triggerLiquidation(candle.close, candle.date);
      return { stop: true };
    }

    // Check stop loss
    if (isStopLossPlaced && stopLossPrice && candle.low <= parseFloat(stopLossPrice)) {
      setIsPlaying(false);
      setIsSimulating(false);
      
      const exitPrice = parseFloat(stopLossPrice);
      const finalPnL = (simQuantity * exitPrice) - simTotalInvested;
      const collateral = simTotalInvested / leverage;
      const finalPnLPercent = (finalPnL / collateral) * 100;
      
      const finalResult = {
        ...simulationData,
        buyPrice: simAvgBuy,
        resultPrice: exitPrice,
        resultDate: candle.date,
        profitLoss: finalPnL,
        profitLossPercent: parseFloat(finalPnLPercent.toFixed(2)),
        totalInvested: simTotalInvested,
        quantity: simQuantity,
        isProfit: finalPnL >= 0,
        feedback: getEarlyExitFeedback(finalPnLPercent),
        journey: {
          ...simulationData.journey,
          candles: simulationData.journey.candles.slice(0, idx + 1),
          tradingDays: idx + 1
        }
      };

      setResult(finalResult);
      setStep(3);
      
      let refund = (simQuantity * exitPrice) - borrowedAmount;
      if (leverage === 1) refund = simQuantity * exitPrice;
      const newWallet = (user?.virtualWallet ?? 100000) + refund;
      updateUser({ virtualWallet: newWallet });
      saveCompletedTrade(finalResult, newWallet);

      toast.success(`🛑 Stop Loss Triggered at ₹${exitPrice} on ${candle.date}! Position sold.`);
      return { stop: true };
    }

    // Check limit buy
    if (isLimitBuyPlaced && limitBuyPrice && candle.low <= parseFloat(limitBuyPrice)) {
      const execPrice = parseFloat(limitBuyPrice);
      const cost = limitBuyQty * execPrice;
      const marginReq = cost / leverage;
      const walletBalance = user?.virtualWallet ?? 100000;

      if (walletBalance >= marginReq) {
        const additionalBorrowed = cost - marginReq;
        const newQuantity = simQuantity + limitBuyQty;
        const newTotalInvested = simTotalInvested + cost;
        const newAvgBuy = ((simAvgBuy * simQuantity) + cost) / newQuantity;
        const newBorrowed = borrowedAmount + additionalBorrowed;
        
        const newTotalMargin = newTotalInvested / leverage;
        const newMaintenance = newTotalMargin * 0.10;
        const newLiqPrice = leverage > 1 ? (newBorrowed + newMaintenance) / newQuantity : 0;

        const newWallet = walletBalance - marginReq;
        updateUser({ virtualWallet: newWallet });

        setSimQuantity(newQuantity);
        setSimTotalInvested(newTotalInvested);
        setSimAvgBuy(newAvgBuy);
        setBorrowedAmount(newBorrowed);
        setLiquidationPrice(newLiqPrice);

        setIsLimitBuyPlaced(false);
        setLimitBuyPrice('');

        toast.success(`📈 Limit Buy Triggered! Bought ${limitBuyQty} shares at ₹${execPrice} on ${candle.date}.`);
      } else {
        setIsLimitBuyPlaced(false);
        setLimitBuyPrice('');
        toast.error(`⚠️ Limit Buy failed on ${candle.date}: Insufficient margin for ₹${execPrice}. Order cancelled.`);
      }
    }

    return { stop: false };
  }, [
    simulationData, leverage, liquidationPrice, isStopLossPlaced, stopLossPrice,
    simQuantity, simTotalInvested, simAvgBuy, borrowedAmount, isLimitBuyPlaced,
    limitBuyPrice, limitBuyQty, user, updateUser, triggerLiquidation
  ]);

  const advanceSimulation = (days) => {
    if (!simulationData) return;
    const candles = simulationData.journey.candles;
    const maxIdx = candles.length - 1;
    
    let currentIdx = simIndex;
    let stopSimulation = false;
    
    for (let i = 1; i <= days; i++) {
      const targetIdx = currentIdx + 1;
      if (targetIdx > maxIdx) {
        break;
      }
      
      const candle = candles[targetIdx];
      const check = evaluateStepTriggers(candle, targetIdx);
      currentIdx = targetIdx;
      
      if (check.stop) {
        stopSimulation = true;
        break;
      }
    }
    
    if (!stopSimulation) {
      if (currentIdx >= maxIdx) {
        setIsPlaying(false);
        finishSimulation(maxIdx);
      } else {
        setSimIndex(currentIdx);
      }
    }
  };

  // Auto-run play/pause
  useEffect(() => {
    let timer = null;
    if (isPlaying && isSimulating && simulationData) {
      timer = setInterval(() => {
        const candles = simulationData.journey.candles;
        const maxIdx = candles.length - 1;
        setSimIndex(prev => {
          const next = prev + 1;
          
          if (next > maxIdx) {
            setIsPlaying(false);
            clearInterval(timer);
            finishSimulation(maxIdx);
            return maxIdx;
          }
          
          const candle = candles[next];
          const check = evaluateStepTriggers(candle, next);
          if (check.stop) {
            setIsPlaying(false);
            clearInterval(timer);
            return prev;
          }
          
          return next;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isSimulating, simulationData, evaluateStepTriggers]);

  // Track Portfolio Equity Value Day-by-Day (Check for liquidation and draw equity path)
  useEffect(() => {
    if (isSimulating && simulationData) {
      const currentPrice = simulationData.journey.candles[simIndex]?.close || 0;
      const currentDate = simulationData.journey.candles[simIndex]?.date;
      
      // Check for Liquidation
      if (leverage > 1 && liquidationPrice > 0 && currentPrice <= liquidationPrice) {
        triggerLiquidation(currentPrice, currentDate);
        return;
      }

      const currentEquity = (user?.virtualWallet ?? 100000) + (simQuantity * currentPrice) - borrowedAmount;
      
      setEquityHistory(prev => {
        const formattedDate = new Date(currentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const exists = prev.findIndex(item => item.date === formattedDate);
        if (exists >= 0) {
          const copy = [...prev];
          copy[exists] = { date: formattedDate, equity: Math.round(currentEquity) };
          return copy.slice(0, exists + 1);
        } else {
          return [...prev, { date: formattedDate, equity: Math.round(currentEquity) }];
        }
      });
    } else {
      setEquityHistory([]);
    }
  }, [simIndex, isSimulating, simQuantity, simulationData, user, leverage, liquidationPrice, borrowedAmount, triggerLiquidation]);

  // Load history stats on mount for Leaderboard
  useEffect(() => {
    const fetchHistoryOnMount = async () => {
      try {
        const { data } = await api.get('/backtest/history');
        setHistory(data.trades || []);
        setHistoryStats(data.stats);
      } catch (e) {
        console.error('Failed to load history on mount', e.message);
      }
    };
    fetchHistoryOnMount();
  }, []);

  const cashOut = () => {
    if (!simulationData) return;
    setIsPlaying(false);
    setEventCue('cash_out');
    setTimeout(() => setEventCue(null), 800);
    const candles = simulationData.journey.candles;
    const currentCandle = candles[simIndex];
    const currentPrice = currentCandle.close;
    const finalPnL = (simQuantity * currentPrice) - simTotalInvested;
    const collateral = simTotalInvested / leverage;
    const finalPnLPercent = (finalPnL / collateral) * 100;

    const finalResult = {
      ...simulationData,
      buyPrice: simAvgBuy,
      resultPrice: currentPrice,
      resultDate: currentCandle.date,
      profitLoss: finalPnL,
      profitLossPercent: parseFloat(finalPnLPercent.toFixed(2)),
      totalInvested: simTotalInvested,
      quantity: simQuantity,
      isProfit: finalPnL >= 0,
      feedback: getEarlyExitFeedback(finalPnLPercent),
      journey: {
        ...simulationData.journey,
        candles: simulationData.journey.candles.slice(0, simIndex + 1),
        tradingDays: simIndex + 1
      }
    };

    setResult(finalResult);
    setAdvancedMetrics(computeAdvancedMetrics(simulationData.journey.candles.slice(0, simIndex + 1)));
    setIsSimulating(false);
    setStep(3);

    const refund = leverage > 1 ? (simQuantity * currentPrice) - borrowedAmount : simQuantity * currentPrice;
    const newWallet = (user?.virtualWallet ?? 100000) + refund;
    updateUser({ virtualWallet: newWallet });
    saveCompletedTrade(finalResult, newWallet);

    toast.success(`Cashed out early at ₹${currentPrice}! Profit/Loss: ₹${finalPnL.toFixed(2)} 💵`);
  };

  const averageDown = () => {
    if (!simulationData) return;
    const candles = simulationData.journey.candles;
    const currentPrice = candles[simIndex].close;
    const cost = averageDownQty * currentPrice;
    const walletBalance = user?.virtualWallet ?? 100000;

    if (walletBalance < cost) {
      toast.error(`Insufficient virtual cash to average down! Need ₹${Math.round(cost).toLocaleString('en-IN')}`);
      return;
    }

    setEventCue('average_down');
    setTimeout(() => setEventCue(null), 800);

    // Deduct cash locally via updateUser
    const newWallet = walletBalance - cost;
    updateUser({ virtualWallet: newWallet });
    
    const nextQty = simQuantity + averageDownQty;
    const nextInvested = simTotalInvested + cost;
    const nextAvgBuy = ((simAvgBuy * simQuantity) + cost) / nextQty;

    // Update leverage borrowed amount and liquidation price
    const additionalBorrowed = cost - (cost / leverage);
    const newBorrowed = borrowedAmount + additionalBorrowed;
    
    const newTotalMargin = nextInvested / leverage;
    const newMaintenance = newTotalMargin * 0.10;
    const newLiqPrice = leverage > 1 ? (newBorrowed + newMaintenance) / nextQty : 0;

    setSimQuantity(nextQty);
    setSimTotalInvested(nextInvested);
    setSimAvgBuy(nextAvgBuy);
    setBorrowedAmount(newBorrowed);
    setLiquidationPrice(newLiqPrice);

    toast.success(`Bought ${averageDownQty} more shares @ ₹${currentPrice}! ➕`);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/backtest/history');
      setHistory(data.trades || []);
      setHistoryStats(data.stats);
      setShowHistory(true);
    } catch (e) { toast.error('Failed to load history'); }
    setHistoryLoading(false);
  };

  const reset = () => {
    setStep(1);
    setChartData(null);
    setAdvancedMetrics(null);
    setResult(null);
    setSymbol('RELIANCE.NS');
    setCompanyName('Reliance Industries');
    setSearchQuery('Reliance Industries (RELIANCE.NS)');
    setFromDate('');
    setToDate('');
    setResultDate('');
    setIsSimulating(false);
    setSimulationData(null);
    setSimIndex(0);
    setIsPlaying(false);
    setLeverage(1);
    setBorrowedAmount(0);
    setLiquidationPrice(0);
    setIsLiquidated(false);
  };

  // Prepare chart display data
  const getSimulatedCandles = () => {
    if (!chartData) return [];
    const initial = chartData.candles.map(c => ({
      date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      close: c.close,
      high: c.high,
      low: c.low
    }));
    let combined = initial;
    if (isSimulating && simulationData) {
      const journey = simulationData.journey.candles.slice(0, simIndex + 1).map(c => ({
        date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        close: c.close,
        high: c.high,
        low: c.low
      }));
      combined = [...initial, ...journey];
    }
    
    // Calculate 20-Day SMA
    return combined.map((candle, idx, arr) => {
      if (idx < 19) return { ...candle, sma: null };
      const slice = arr.slice(idx - 19, idx + 1);
      const sum = slice.reduce((acc, val) => acc + val.close, 0);
      return { ...candle, sma: parseFloat((sum / 20).toFixed(2)) };
    });
  };

  const displayCandles = getSimulatedCandles();

  const journeyCandles = result?.journey?.candles?.map(c => ({
    date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    close: c.close,
  })) || [];

  const chartColor = chartData?.summary?.periodReturn >= 0 ? '#7C3AED' : '#ef4444';

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">⏳ Time Machine Game</h1>
            <p className="text-slate-400 text-sm mt-1">
              Travel to any past date • Practice trading • Instantly see if you were right
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Virtual Wallet</p>
              <p className="text-xl font-bold text-cyan-400">₹{(user?.virtualWallet ?? 100000).toLocaleString('en-IN')}</p>
            </div>
            <Link to="/trade">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                📈 Trading Arena
              </button>
            </Link>
            <Link to="/trade/strategy">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                🔬 Strategy Lab
              </button>
            </Link>
            <button
              onClick={() => { loadHistory(); }}
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px' }}
            >
              📊 My History
            </button>
            {step > 1 && (
              <button onClick={reset} className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                🔄 New Test
              </button>
            )}
          </div>
        </div>


        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Pick Stock & Date' },
            { n: 2, label: 'Analyze & Decide' },
            { n: 3, label: 'See Result' }
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                step === s.n ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400' :
                step > s.n ? 'border-green-400 bg-green-500/20 text-green-400' :
                'border-white/20 text-slate-500'
              }`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-sm hidden md:block ${step >= s.n ? 'text-white' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-8 h-px mx-1 ${step > s.n ? 'bg-green-400' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Setup ─── */}
        {step === 1 && (
          <div className="max-w-3xl space-y-6">

            {/* Explainer */}
            <div className="card border-cyan-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <h3 className="font-bold text-cyan-400 mb-2">🧠 How Backtesting Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Pick a stock and a past date range you want to "travel to"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>See the chart ONLY up to that date — decide to buy or skip</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Instantly see what actually happened — profit or loss?</span>
                </div>
              </div>
            </div>

            {/* Stock picker */}
            <div className="card">
              <h3 className="font-bold mb-4">1. Pick a Stock</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {POPULAR_STOCKS.map(s => (
                  <button key={s.symbol}
                    onClick={() => { 
                      setSymbol(s.symbol); 
                      setCompanyName(s.name); 
                      setSearchQuery(`${s.name} (${s.symbol})`);
                    }}
                    className={`p-2 rounded-xl text-xs font-medium transition border ${
                      symbol === s.symbol
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {/* Custom symbol search */}
              <div className="relative">
                <input
                  className="input-dark w-full"
                  placeholder="🔍 Type stock name or symbol (e.g. Reliance, TCS, Infy, AAPL)..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-[var(--bg-secondary)] border border-white/10 rounded-xl max-h-60 overflow-y-auto z-50 shadow-2xl">
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSymbol(item.symbol);
                          setCompanyName(item.name);
                          setSearchQuery(`${item.name} (${item.symbol})`);
                          setShowSuggestions(false);
                        }}
                        className="p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition flex justify-between items-center text-left"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.symbol} • {item.exchange}</p>
                        </div>
                        <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase">
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date range picker */}
            <div className="card">
              <h3 className="font-bold mb-4">2. Choose Time Period to Travel To</h3>

              {/* Quick presets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition border ${
                      fromDate === preset.getDates().from && toDate === preset.getDates().to
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {selectedPreset && (
                <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 text-slate-300 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <span className="font-extrabold text-cyan-400">Historical Context: </span>
                    {selectedPreset.desc}
                  </div>
                </div>
              )}

              {/* Custom date picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Chart Start Date</label>
                  <input
                    type="date"
                    className="input-dark"
                    max={new Date().toISOString().split('T')[0]}
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    Your "Buy Date" <span className="text-cyan-400">(chart ends here)</span>
                  </label>
                  <input
                    type="date"
                    className="input-dark"
                    max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Shares to Buy</label>
                  <input
                    type="number"
                    min="1"
                    className="input-dark"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    Check Result On <span className="text-xs text-slate-500">(must be after buy date)</span>
                  </label>
                  <input
                    type="date"
                    className="input-dark"
                    min={toDate}
                    max={new Date().toISOString().split('T')[0]}
                    value={resultDate}
                    onChange={e => setResultDate(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Leverage Selector */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="text-sm text-slate-400 mb-2 block">
                  Select Leverage (Margin Trading) <span className="text-xs text-slate-500">(1x = No Leverage, 3x = Max borrowing power)</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 1, label: '1x (Cash only)' },
                    { value: 2, label: '2x (Margin)' },
                    { value: 3, label: '3x (High Leverage)' }
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => setLeverage(item.value)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        leverage === item.value
                          ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400 shadow-md shadow-cyan-400/10'
                          : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* InstaDate Snapper (Binary Search) */}
            <div className="card bg-white/3 border border-white/5 p-5 rounded-2xl">
              <h3 className="font-bold mb-2 flex items-center gap-2 text-white">
                ⏱️ InstaDate™ Snapper (O(log n) Binary Search)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Markets are closed on weekends and public holidays. To check trading data, the system must snap your input date to the closest active trading day. 
                Our Binary Search engine does this in $O(\log n)$ operations instead of scanning all 252 trading days sequentially.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 items-end">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Pick Calendar Date (2025)</label>
                  <input
                    type="date"
                    className="input-dark"
                    min="2025-01-01"
                    max="2025-12-31"
                    value={bsSearchDate}
                    onChange={e => setBsSearchDate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => runBinarySearchDate(bsSearchDate)}
                  className="btn-primary py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-600 cursor-pointer"
                >
                  🔍 Snap to Trading Day
                </button>
              </div>

              {bsSteps.length > 0 && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-fade-in">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-cyan-400">Binary Search Steps</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBsStepIdx(prev => Math.max(0, prev - 1))}
                        disabled={bsStepIdx <= 0}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-50 cursor-pointer"
                      >
                        ◀
                      </button>
                      <span className="text-slate-400 font-mono">Step {bsStepIdx + 1} / {bsSteps.length}</span>
                      <button
                        type="button"
                        onClick={() => setBsStepIdx(prev => Math.min(bsSteps.length - 1, prev + 1))}
                        disabled={bsStepIdx >= bsSteps.length - 1}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-50 cursor-pointer"
                      >
                        ▶
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] font-mono text-slate-300 leading-relaxed min-h-12">
                    {bsSteps[bsStepIdx]?.msg}
                  </div>

                  {/* Array bounds visualization */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Low: {bsSteps[bsStepIdx]?.low}</span>
                      <span className="text-amber-400">Mid: {bsSteps[bsStepIdx]?.mid}</span>
                      <span>High: {bsSteps[bsStepIdx]?.high}</span>
                    </div>
                    <div className="h-6 bg-white/5 rounded-lg overflow-hidden flex relative border border-white/5 font-mono text-[9px] text-slate-400">
                      {/* Left inactive */}
                      <div 
                        style={{ width: `${(bsSteps[bsStepIdx]?.low / bsTradingDays.length) * 100}%` }}
                        className="bg-red-500/10 h-full border-r border-red-500/20"
                      />
                      {/* Active search area */}
                      <div 
                        style={{ width: `${((bsSteps[bsStepIdx]?.high - bsSteps[bsStepIdx]?.low + 1) / bsTradingDays.length) * 100}%` }}
                        className="bg-cyan-500/10 h-full flex items-center justify-center font-bold text-cyan-300"
                      >
                        Search Space ({bsSteps[bsStepIdx]?.high - bsSteps[bsStepIdx]?.low + 1} days)
                      </div>
                      {/* Right inactive */}
                      <div 
                        style={{ width: `${((bsTradingDays.length - 1 - bsSteps[bsStepIdx]?.high) / bsTradingDays.length) * 100}%` }}
                        className="bg-red-500/10 h-full border-l border-red-500/20"
                      />
                      {/* Mid indicator line */}
                      <div 
                        style={{ left: `${(bsSteps[bsStepIdx]?.mid / bsTradingDays.length) * 100}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Trades Leaderboard */}
            {history.length > 0 && (
              <div className="card border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="font-bold flex items-center gap-2 text-green-400">
                    <span>🏆</span> Trade Hall of Fame (Top 5)
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Ranked by ROI %</span>
                </div>
                <div className="space-y-2.5">
                  {[...history]
                    .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
                    .slice(0, 5)
                    .map((t, idx) => {
                      const rankColors = ['#F59E0B', '#94A3B8', '#B45309', '#64748B', '#64748B'];
                      return (
                        <div key={t._id || idx} className="flex items-center justify-between p-2.5 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition">
                          <div className="flex items-center gap-3">
                            <span 
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border"
                              style={{ 
                                borderColor: rankColors[idx], 
                                backgroundColor: `${rankColors[idx]}20`, 
                                color: rankColors[idx] 
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-extrabold text-xs text-white">{t.symbol}</p>
                              <p className="text-[10px] text-slate-400">
                                Bought @ ₹{t.price?.toFixed(2)} on {t.buyDate}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-black text-xs ${t.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {t.profitLossPercent >= 0 ? '+' : ''}{t.profitLossPercent}%
                            </p>
                            <p className="text-[9px] text-slate-500">
                              {t.profitLoss >= 0 ? '+' : ''}₹{Math.round(t.profitLoss).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <button
              onClick={loadChart}
              disabled={chartLoading || !symbol || !fromDate || !toDate}
              className="btn-primary w-full py-4 text-lg font-bold"
            >
              {chartLoading ? '⏳ Loading historical data...' : '⏰ Travel to This Date →'}
            </button>
          </div>
        )}

        {/* ─── STEP 2: Chart + Buy Decision ─── */}
        {step === 2 && chartData && (
          isSimulating && simulationData ? (
            <div className="space-y-6">
              {/* Active Simulation Header */}
              <div className="card border-cyan-500/25 bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 flex items-center justify-between p-4 flex-wrap gap-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-pulse">⏳</span>
                  <div>
                    <p className="font-extrabold text-sm text-cyan-400">Active Simulation: Travelling through time...</p>
                    <p className="text-xs text-slate-400 mt-0.5">Current Date: <span className="text-white font-bold">{simulationData.journey.candles[simIndex]?.date}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Progress:</span>
                  <span className="text-xs bg-cyan-400/10 text-cyan-400 px-2.5 py-1 rounded-full font-mono font-bold">
                    Day {simIndex + 1} of {simulationData.journey.candles.length}
                  </span>
                </div>
              </div>

              {/* Simulation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Chart */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="card">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                      <h3 className="font-bold">{companyName} — Time Travel Chart</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSma(!showSma)}
                          className={`px-3 py-1 text-xs rounded-lg font-bold border transition cursor-pointer ${
                            showSma ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-md shadow-cyan-400/10' : 'border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          📈 {showSma ? 'SMA(20) ON' : 'SMA(20) OFF'}
                        </button>
                        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full font-bold">
                          ⚡ Step-by-Step Simulation Mode
                        </span>
                      </div>
                    </div>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayCandles}>
                          <defs>
                            <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                          <XAxis dataKey="date" tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false}
                            interval={Math.max(1, Math.floor(displayCandles.length / 6))} />
                          <YAxis tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']}
                            tickFormatter={v => `₹${v.toFixed(0)}`} />
                          <Tooltip
                            formatter={(v, name) => [name === 'sma' ? `₹${v?.toFixed(2)}` : `₹${v?.toFixed(2)}`, name === 'sma' ? '20-Day SMA' : 'Price']}
                            contentStyle={{ background: 'var(--bg-secondary)', border: `1px solid ${chartColor}33`, borderRadius: '12px' }}
                           cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                          <Area type="monotone" name="close" dataKey="close" stroke={chartColor} strokeWidth={2}
                            fill="url(#backtestGrad)" dot={false} />
                          {showSma && (
                            <Line type="monotone" name="sma" dataKey="sma" stroke="#F59E0B" strokeWidth={1.5} dot={false} activeDot={false} />
                          )}
                          {isLimitBuyPlaced && limitBuyPrice && (
                            <ReferenceLine
                              y={parseFloat(limitBuyPrice)}
                              stroke="#10B981"
                              strokeDasharray="4 4"
                              label={{ value: `Limit Buy: ₹${limitBuyPrice}`, fill: '#10B981', fontSize: 9, position: 'insideBottomLeft' }}
                            />
                          )}
                          {isStopLossPlaced && stopLossPrice && (
                            <ReferenceLine
                              y={parseFloat(stopLossPrice)}
                              stroke="#EF4444"
                              strokeDasharray="4 4"
                              label={{ value: `Stop Loss: ₹${stopLossPrice}`, fill: '#EF4444', fontSize: 9, position: 'insideBottomLeft' }}
                            />
                          )}
                          {leverage > 1 && liquidationPrice > 0 && (
                            <ReferenceLine
                              y={liquidationPrice}
                              stroke="#F59E0B"
                              strokeDasharray="5 5"
                              label={{ value: `Liquidation: ₹${liquidationPrice.toFixed(2)}`, fill: '#F59E0B', fontSize: 9, position: 'insideTopLeft' }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Dual Chart: Portfolio Valuation Path */}
                  {equityHistory.length > 0 && (
                    <div className="card">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Portfolio Equity Path (Net Worth)</h4>
                        <span className="text-xs font-bold text-green-400">
                          ₹{equityHistory[equityHistory.length - 1]?.equity?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-36 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={equityHistory}>
                            <defs>
                              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                            <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false}
                              interval={Math.max(1, Math.floor(equityHistory.length / 6))} />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} domain={['auto', 'auto']}
                              tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} />
                            <Tooltip
                              formatter={(v) => [`₹${v?.toLocaleString('en-IN')}`, 'Net Worth']}
                              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid #10B98133', borderRadius: '10px' }}
                             cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2}
                              fill="url(#equityGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Portfolio & Controls */}
                <div className={`space-y-4 transition-all duration-300 ${
                  eventCue === 'average_down' ? 'scale-[1.01] ring-2 ring-green-400 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.2)] bg-green-500/5' :
                  eventCue === 'cash_out' ? 'scale-[1.01] ring-2 ring-yellow-400 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.2)] bg-yellow-500/5' :
                  ''
                }`}>
                  {/* Portfolio HUD */}
                  {(() => {
                    const currentPrice = simulationData.journey.candles[simIndex]?.close || 0;
                    const currentVal = simQuantity * currentPrice;
                    const pnl = currentVal - simTotalInvested;
                    const pnlPercent = (pnl / simTotalInvested) * 100;
                    const isProfit = pnl >= 0;
                    return (
                      <>
                        <div className={`card border text-center p-6 space-y-2 transition-all rounded-2xl ${
                          isProfit ? 'border-green-500/20 bg-green-500/5 shadow-[0_0_20px_rgba(52,211,153,0.04)]' : 'border-red-500/20 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.04)]'
                        }`}>
                          <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Unrealized P&L</p>
                          <h2 className={`text-3xl font-black ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h2>
                          <p className={`text-sm font-bold ${isProfit ? 'text-green-400/80' : 'text-red-400/80'}`}>
                            {pnlPercent >= 0 ? '▲' : '▼'} {Math.abs(pnlPercent).toFixed(2)}%
                          </p>
                        </div>

                        {/* Stats Dashboard Grid */}
                        <div className="card space-y-3 rounded-2xl">
                          <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-2">
                            <span className="text-slate-400">Avg Buy Price:</span>
                            <span className="text-white">₹{simAvgBuy.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-2">
                            <span className="text-slate-400">Quantity Held:</span>
                            <span className="text-white">{simQuantity} shares</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-2">
                            <span className="text-slate-400">Total Invested:</span>
                            <span className="text-white">₹{Math.round(simTotalInvested).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-2">
                            <span className="text-slate-400">Current Price:</span>
                            <span className="text-white">₹{currentPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-400">Current Value:</span>
                            <span className="text-cyan-400">₹{Math.round(currentVal).toLocaleString('en-IN')}</span>
                          </div>

                          {/* Diamond Hands Bar */}
                          <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-[9px] font-extrabold tracking-wider">
                              <span className="text-slate-500 uppercase">DIAMOND HANDS HUD</span>
                              <span style={{ color: pnlPercent >= 10 ? '#34D399' : pnlPercent <= -15 ? '#ef4444' : '#F59E0B' }}>
                                {pnlPercent >= 10 ? '🚀 MOONING' : pnlPercent <= -15 ? '💀 PANIC PRESSURE' : '💎 HODLING'}
                              </span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(100, Math.max(0, pnlPercent + 50))}%`, 
                                  backgroundColor: pnlPercent >= 10 ? '#34D399' : pnlPercent <= -15 ? '#ef4444' : '#F59E0B' 
                                }} 
                              />
                            </div>
                          </div>
                          {pnlPercent <= -12 && (
                            <div className="mt-3 p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-center space-y-1.5 animate-bounce shadow-md shadow-red-500/10">
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">⚠️ PANIC METER BURNING ⚠️</p>
                              <p className="text-[11px] text-slate-200">
                                Your position is down <span className="font-extrabold text-red-400">{pnlPercent.toFixed(1)}%</span>! The crowd is panic selling. Do you have Diamond Hands 💎 or will you Paper Hand 📄 out?
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Controls Block */}
                        <div className="card space-y-4 rounded-2xl">
                          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Simulation Controls</h4>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setIsPlaying(!isPlaying)}
                              className={`py-2.5 px-4 rounded-xl text-xs font-black transition cursor-pointer flex-1 flex items-center justify-center gap-1.5 ${
                                isPlaying 
                                  ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20' 
                                  : 'bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/20'
                              }`}
                            >
                              {isPlaying ? '⏸️ Pause Auto' : '▶️ Play Auto'}
                            </button>
                            <button 
                              onClick={() => { setIsPlaying(false); advanceSimulation(5); }}
                              className="py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              +1 Wk
                            </button>
                            <button 
                              onClick={() => { setIsPlaying(false); advanceSimulation(20); }}
                              className="py-2.5 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              +1 Mo
                            </button>
                          </div>

                          <div className="border-t border-white/5 pt-3 space-y-2">
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                min="1" 
                                value={averageDownQty} 
                                onChange={e => setAverageDownQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="input-dark w-16 text-center text-xs" 
                              />
                              <button 
                                onClick={averageDown}
                                className="flex-1 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 text-cyan-400 hover:text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                ➕ Average Down
                              </button>
                            </div>
                            <button 
                              onClick={cashOut}
                              className="w-full py-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2"
                            >
                              💵 Sell & Cash Out Position Early
                            </button>
                          </div>
                        </div>

                        {/* Limit & Stop Loss Orders Card */}
                        <div className="card space-y-4 rounded-2xl border border-white/5">
                          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            🎯 Pending Orders
                          </h4>
                          
                          {/* Limit Buy Order Setup */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">Limit Buy Order</span>
                              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isLimitBuyPlaced ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-slate-500'}`}>
                                {isLimitBuyPlaced ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Price (₹)"
                                value={limitBuyPrice}
                                onChange={e => setLimitBuyPrice(e.target.value)}
                                disabled={isLimitBuyPlaced}
                                className="input-dark text-xs flex-1 text-center"
                              />
                              <input
                                type="number"
                                placeholder="Qty"
                                value={limitBuyQty}
                                onChange={e => setLimitBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
                                disabled={isLimitBuyPlaced}
                                className="input-dark text-xs w-16 text-center"
                              />
                              {isLimitBuyPlaced ? (
                                <button
                                  onClick={() => {
                                    setIsLimitBuyPlaced(false);
                                    setLimitBuyPrice('');
                                    toast.error('Limit Buy order cancelled');
                                  }}
                                  className="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!limitBuyPrice || parseFloat(limitBuyPrice) <= 0) {
                                      toast.error('Enter a valid price');
                                      return;
                                    }
                                    setIsLimitBuyPlaced(true);
                                    toast.success(`Limit Buy placed at ₹${parseFloat(limitBuyPrice).toFixed(2)}`);
                                  }}
                                  className="py-1 px-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  Place
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stop Loss Order Setup */}
                          <div className="space-y-2 border-t border-white/5 pt-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold">Stop Loss Sell Order</span>
                              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isStopLossPlaced ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-slate-500'}`}>
                                {isStopLossPlaced ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Price (₹)"
                                value={stopLossPrice}
                                onChange={e => setStopLossPrice(e.target.value)}
                                disabled={isStopLossPlaced}
                                className="input-dark text-xs flex-1 text-center"
                              />
                              {isStopLossPlaced ? (
                                <button
                                  onClick={() => {
                                    setIsStopLossPlaced(false);
                                    setStopLossPrice('');
                                    toast.error('Stop Loss order cancelled');
                                  }}
                                  className="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!stopLossPrice || parseFloat(stopLossPrice) <= 0) {
                                      toast.error('Enter a valid price');
                                      return;
                                    }
                                    const currentPrice = simulationData.journey.candles[simIndex]?.close || 0;
                                    if (parseFloat(stopLossPrice) >= currentPrice) {
                                      toast.error('Stop loss price must be below current price');
                                      return;
                                    }
                                    setIsStopLossPlaced(true);
                                    toast.success(`Stop Loss placed at ₹${parseFloat(stopLossPrice).toFixed(2)}`);
                                  }}
                                  className="py-1 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
                                >
                                  Place
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="card border-yellow-500/20 flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-bold text-yellow-400">You've traveled to {toDate}</p>
                  <p className="text-sm text-slate-400">
                    You can see {chartData.summary.tradingDays} days of {companyName} data. The future is hidden. Decide now!
                  </p>
                </div>
              </div>

              {/* Stock summary at "current" (buy) date */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '"Current" Price', value: `₹${chartData.summary.endPrice?.toFixed(2)}`, color: 'text-white' },
                  { label: 'Period Return', value: `${chartData.summary.periodReturn >= 0 ? '+' : ''}${chartData.summary.periodReturn}%`, color: chartData.summary.periodReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                  { label: '52D High', value: `₹${chartData.summary.high?.toFixed(2)}`, color: 'text-green-400' },
                  { label: '52D Low', value: `₹${chartData.summary.low?.toFixed(2)}`, color: 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="card text-center">
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Price chart (up to buy date ONLY) */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">{companyName} — Historical Chart</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSma(!showSma)}
                      className={`px-3 py-1 text-xs rounded-lg font-bold border transition cursor-pointer ${
                        showSma ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-md shadow-cyan-400/10' : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      📈 {showSma ? 'SMA(20) ON' : 'SMA(20) OFF'}
                    </button>
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">
                      🔒 Future hidden — {fromDate} to {toDate}
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={displayCandles}>
                    <defs>
                      <linearGradient id="backtestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false}
                      interval={Math.max(1, Math.floor(displayCandles.length / 6))} />
                    <YAxis tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']}
                      tickFormatter={v => `₹${v.toFixed(0)}`} />
                    <Tooltip
                      formatter={(v, name) => [name === 'sma' ? `₹${v?.toFixed(2)}` : `₹${v?.toFixed(2)}`, name === 'sma' ? '20-Day SMA' : 'Price']}
                      contentStyle={{ background: 'var(--bg-secondary)', border: `1px solid ${chartColor}33`, borderRadius: '8px' }}
                     cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                    <Area type="monotone" name="close" dataKey="close" stroke={chartColor} strokeWidth={2}
                      fill="url(#backtestGrad)" dot={false} />
                    {showSma && (
                      <Line type="monotone" name="sma" dataKey="sma" stroke="#F59E0B" strokeWidth={1.5} dot={false} activeDot={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Buy decision */}
              <div className="card border-cyan-500/20">
                <h3 className="font-bold mb-3">🤔 Your Decision</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="card bg-[var(--bg-primary)]">
                    <p className="text-xs text-slate-400">You're buying</p>
                    <p className="font-bold">{quantity} shares</p>
                  </div>
                  <div className="card bg-[var(--bg-primary)]">
                    <p className="text-xs text-slate-400">At price</p>
                    <p className="font-bold">₹{chartData.summary.endPrice?.toFixed(2)}</p>
                  </div>
                  <div className="card bg-[var(--bg-primary)]">
                    <p className="text-xs text-slate-400">Total investment</p>
                    <p className="font-bold text-cyan-400">
                      ₹{(chartData.summary.endPrice * quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-1">Checking result on: <span className="text-white font-medium">{resultDate}</span></p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep(1); setChartData(null); }}
                    className="btn-secondary flex-1 py-3"
                  >
                    ❌ Skip — Don't Buy
                  </button>
                  <button
                    onClick={executeTrade}
                    disabled={resultLoading}
                    className="btn-primary flex-1 py-3 text-lg font-bold"
                    style={{ background: 'linear-gradient(135deg,#A78BFA,#00cc66)' }}
                  >
                    {resultLoading ? '⏳ Calculating...' : '✅ Buy! Reveal Result →'}
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* ─── STEP 3: Result ─── */}
        {step === 3 && result && (
          <div className="space-y-6 max-w-3xl">

            {/* Grade card */}
            <div className={`card text-center py-8 ${
              result.isProfit ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}>
              <div className={`text-7xl font-bold mb-2 ${gradeColor(result.feedback.grade)}`}>
                {result.feedback.grade}
              </div>
              <p className="text-2xl font-bold mb-2">
                {result.isProfit ? '🎉 Profitable Trade!' : '📉 Loss — But You Learned!'}
              </p>
              <p className="text-slate-400 max-w-md mx-auto">{result.feedback.message}</p>
            </div>

            {/* P&L breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Buy Price', value: `₹${result.buyPrice}`, sub: result.buyDate, color: 'text-white' },
                { label: 'Result Price', value: `₹${result.resultPrice}`, sub: result.resultDate, color: 'text-white' },
                { label: 'Profit / Loss', value: `${result.isProfit ? '+' : ''}₹${result.profitLoss?.toLocaleString('en-IN')}`, sub: `${result.profitLossPercent >= 0 ? '+' : ''}${result.profitLossPercent}%`, color: result.isProfit ? 'text-green-400' : 'text-red-400' },
                { label: 'Total Invested', value: `₹${result.totalInvested?.toLocaleString('en-IN')}`, sub: `${result.quantity} shares`, color: 'text-cyan-400' },
              ].map((s, i) => (
                <div key={i} className="card text-center">
                  <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Journey chart — full picture revealed */}
            {journeyCandles.length > 0 && (
              <div className="card">
                <h3 className="font-bold mb-2">📈 Full Journey Revealed</h3>
                <p className="text-xs text-slate-400 mb-4">
                  This is what actually happened from your buy date to result date
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={journeyCandles}>
                    <defs>
                      <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={result.isProfit ? '#A78BFA' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={result.isProfit ? '#A78BFA' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false}
                      interval={Math.floor(journeyCandles.length / 5)} />
                    <YAxis tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']}
                      tickFormatter={v => `₹${v.toFixed(0)}`} />
                    <Tooltip
                      formatter={(v) => [`₹${v?.toFixed(2)}`, 'Price']}
                      contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }}
                     cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                    <ReferenceLine y={result.buyPrice} stroke="#ffffff40" strokeDasharray="4 4"
                      label={{ value: 'Buy Price', fill: '#94a3b8', fontSize: 11 }} />
                    <Area type="monotone" dataKey="close"
                      stroke={result.isProfit ? '#A78BFA' : '#ef4444'} strokeWidth={2}
                      fill="url(#journeyGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Journey milestones */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Max Possible Gain', value: `+${result.journey.maxGain}%`, sub: `₹${result.journey.maxPrice}`, color: 'text-green-400' },
                { label: 'Max Possible Loss', value: `${result.journey.maxLoss}%`, sub: `₹${result.journey.minPrice}`, color: 'text-red-400' },
                { label: 'Best Day', value: result.journey.bestDay ? `₹${result.journey.bestDay.price?.toFixed(2)}` : '—', sub: result.journey.bestDay?.date || '', color: 'text-green-400' },
                { label: 'Worst Day', value: result.journey.worstDay ? `₹${result.journey.worstDay.price?.toFixed(2)}` : '—', sub: result.journey.worstDay?.date || '', color: 'text-red-400' },
              ].map((s, i) => (
                <div key={i} className="card text-center">
                  <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                  <p className={`font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* ─── Institutional Risk Metrics Card ─── */}
            {advancedMetrics && (
              <div className="card border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-transparent">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📊</span>
                  <h3 className="font-bold text-violet-300">Institutional Risk Metrics</h3>
                  <span className="ml-auto text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">Quant Analysis</span>
                </div>

                {/* Top row — 4 key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {/* Sharpe Ratio */}
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sharpe Ratio</p>
                    <p className={`text-2xl font-black ${
                      advancedMetrics.sharpeRatio >= 1 ? 'text-green-400' :
                      advancedMetrics.sharpeRatio >= 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.sharpeRatio}</p>
                    <p className="text-[9px] text-slate-600 mt-1">
                      {advancedMetrics.sharpeRatio >= 2 ? '🏆 Excellent' :
                       advancedMetrics.sharpeRatio >= 1 ? '✅ Good' :
                       advancedMetrics.sharpeRatio >= 0 ? '⚠️ Acceptable' : '🔴 Poor'}
                    </p>
                  </div>

                  {/* Max Drawdown */}
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Max Drawdown</p>
                    <p className={`text-2xl font-black ${
                      advancedMetrics.maxDrawdown <= 10 ? 'text-green-400' :
                      advancedMetrics.maxDrawdown <= 25 ? 'text-yellow-400' : 'text-red-400'
                    }`}>-{advancedMetrics.maxDrawdown}%</p>
                    <p className="text-[9px] text-slate-600 mt-1">
                      {advancedMetrics.maxDrawdown <= 10 ? '🟢 Low Risk' :
                       advancedMetrics.maxDrawdown <= 25 ? '🟡 Moderate' : '🔴 High Risk'}
                    </p>
                  </div>

                  {/* VaR 95% */}
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">VaR (95%)</p>
                    <p className="text-2xl font-black text-orange-400">-{advancedMetrics.var95}%</p>
                    <p className="text-[9px] text-slate-600 mt-1">Max daily loss</p>
                  </div>

                  {/* Win Rate */}
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Day Win Rate</p>
                    <p className={`text-2xl font-black ${
                      advancedMetrics.winRate >= 55 ? 'text-green-400' :
                      advancedMetrics.winRate >= 45 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.winRate}%</p>
                    <p className="text-[9px] text-slate-600 mt-1">Profitable days</p>
                  </div>
                </div>

                {/* Second row — Sortino, Calmar, Volatility, Ann. Return */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sortino Ratio</p>
                    <p className={`text-lg font-bold ${
                      advancedMetrics.sortinoRatio >= 1.5 ? 'text-green-400' :
                      advancedMetrics.sortinoRatio >= 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.sortinoRatio}</p>
                    <p className="text-[9px] text-slate-600">Downside risk adj.</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Calmar Ratio</p>
                    <p className={`text-lg font-bold ${
                      advancedMetrics.calmarRatio >= 1 ? 'text-green-400' :
                      advancedMetrics.calmarRatio >= 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.calmarRatio > 50 ? '99+' : advancedMetrics.calmarRatio}</p>
                    <p className="text-[9px] text-slate-600">Return / Drawdown</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ann. Volatility</p>
                    <p className={`text-lg font-bold ${
                      advancedMetrics.annVolatility <= 20 ? 'text-green-400' :
                      advancedMetrics.annVolatility <= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.annVolatility}%</p>
                    <p className="text-[9px] text-slate-600">Price fluctuation</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ann. Return</p>
                    <p className={`text-lg font-bold ${
                      advancedMetrics.annReturn >= 15 ? 'text-green-400' :
                      advancedMetrics.annReturn >= 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{advancedMetrics.annReturn >= 0 ? '+' : ''}{advancedMetrics.annReturn}%</p>
                    <p className="text-[9px] text-slate-600">Projected/yr</p>
                  </div>
                </div>

                {/* Quant Interpretation */}
                <div className="bg-violet-950/30 border border-violet-500/15 rounded-xl p-3 text-sm">
                  <p className="text-violet-300 font-bold mb-1">🤖 Quant Interpretation</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {advancedMetrics.sharpeRatio >= 1 && advancedMetrics.maxDrawdown <= 20
                      ? `Solid risk-adjusted performance. Sharpe of ${advancedMetrics.sharpeRatio} beats the market average (typically 0.5–0.8). Max drawdown of ${advancedMetrics.maxDrawdown}% is within institutional tolerance.`
                      : advancedMetrics.sharpeRatio < 0
                      ? `Negative Sharpe (${advancedMetrics.sharpeRatio}) means this trade underperformed the risk-free rate. The ${advancedMetrics.maxDrawdown}% drawdown is painful — tighter stop-losses or smaller position sizing would help.`
                      : `Moderate performance. Sharpe of ${advancedMetrics.sharpeRatio} is below institutional standard of 1.0. The ${advancedMetrics.var95}% daily VaR means on a bad day you could lose that much of your position value.`
                    }
                    {' '}Day win rate of {advancedMetrics.winRate}% {advancedMetrics.winRate >= 50 ? 'shows positive trend-following ability.' : 'suggests more losing days than winning — review entry timing.'}
                  </p>
                </div>
              </div>
            )}

            {/* Learning insight */}
            <div className="card border-cyan-500/20 bg-cyan-500/5">
              <h3 className="font-bold text-cyan-400 mb-3">📚 What This Teaches You</h3>
              <div className="space-y-2 text-sm text-slate-300">
                {result.isProfit ? (
                  <>
                    <p>✅ Your instinct was correct. The stock went {result.profitLossPercent > 0 ? 'up' : 'down as expected'}.</p>
                    <p>💡 Max gain was <strong>{result.journey.maxGain}%</strong> — if you had sold at the peak you would have made even more.</p>
                    <p>🎯 Practice identifying what made this a good buy — fundamentals, trend, sector momentum?</p>
                  </>
                ) : (
                  <>
                    <p>📉 The stock moved against you. This is how real traders learn.</p>
                    <p>💡 Even in this loss, there was a period of <strong>+{result.journey.maxGain}%</strong> gain. What would have been your exit strategy?</p>
                    <p>🎯 Study what happened in the market/news around your buy date. What did you miss?</p>
                  </>
                )}
                <p className="text-slate-400 mt-3">
                  You held for <strong>{result.journey.tradingDays} trading days</strong>.
                  Your decision quality: <span className={gradeColor(result.feedback.grade)}>{result.feedback.grade}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={reset} className="btn-primary flex-1 py-3">
                ⏰ Try Another Backtest
              </button>
              <button onClick={loadHistory} className="btn-secondary flex-1 py-3">
                📊 View All My Backtests
              </button>
            </div>
          </div>
        )}

        {/* ─── History Modal ─── */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-2xl animate-fade-in max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📊 Backtest History</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>

              {/* Stats */}
              {historyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Total Tests', value: historyStats.totalBacktests, color: 'text-white' },
                    { label: 'Win Rate', value: `${historyStats.winRate}%`, color: 'text-green-400' },
                    { label: 'Avg Return', value: `${historyStats.avgReturn >= 0 ? '+' : ''}${historyStats.avgReturn}%`, color: historyStats.avgReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Total P&L', value: `${historyStats.totalPnL >= 0 ? '+' : ''}₹${historyStats.totalPnL}`, color: historyStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
                  ].map((s, i) => (
                    <div key={i} className="card bg-[var(--bg-primary)] text-center">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className={`font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Trade list */}
              <div className="overflow-y-auto flex-1 space-y-2">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No backtests yet. Start your first one!</p>
                  </div>
                ) : history.map((t, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${
                    t.profitLoss >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div>
                      <p className="font-bold text-sm">{t.symbol}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.timestamp).toLocaleDateString('en-IN')} • {t.quantity} shares @ ₹{t.price?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.profitLoss >= 0 ? '+' : ''}₹{t.profitLoss?.toFixed(0)}
                      </p>
                      <p className={`text-xs ${t.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.profitLossPercent >= 0 ? '+' : ''}{t.profitLossPercent?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <SectionGuide sectionId="/trade/backtest" />
      </main>
    
    </div>
  );
};

export default BacktestArena;
