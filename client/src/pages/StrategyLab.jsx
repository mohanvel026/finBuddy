// client/src/pages/StrategyLab.jsx
import { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Play, SkipForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

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

const ENTRY_RULES = [
  { id: 'RSI_DROP_30', name: '📉 RSI drops below Threshold', desc: 'Buy when stock becomes oversold' },
  { id: 'PRICE_CROSS_ABOVE_20MA', name: '📈 Price crosses above MA', desc: 'Buy on bullish momentum shift' },
  { id: 'MACD_CROSSOVER', name: '📊 MACD Bullish Crossover', desc: 'Buy when MACD histogram crosses above 0' },
  { id: 'BB_BOUNCE_LOWER', name: '⚖️ Bollinger Band Lower Bounce', desc: 'Buy when price dips below lower band and bounces' },
  { id: '3_RED_DAYS', name: '🟥 N consecutive red days', desc: 'Buy when stock has fallen for N days in a row' },
  { id: 'PRICE_DROP_5PCT_WEEK', name: '⚡ Price drops > X% in a week', desc: 'Buy on a sharp weekly dip' },
  { id: 'VOLUME_SPIKE_2X', name: '📊 Volume spikes Xx above average', desc: 'Buy when institutional trading volume surges' },
];

const EXIT_RULES = [
  { id: 'RSI_ABOVE_70', name: '📈 RSI goes above Threshold', desc: 'Sell when stock becomes overbought' },
  { id: 'PRICE_CROSS_BELOW_20MA', name: '📉 Price crosses below MA', desc: 'Sell on bearish momentum shift' },
  { id: 'MACD_CROSSUNDER', name: '📊 MACD Bearish Crossunder', desc: 'Sell when MACD histogram crosses below 0' },
  { id: 'BB_TOUCH_UPPER', name: '⚖️ Bollinger Band Touch Upper', desc: 'Sell when price touches upper band' },
  { id: 'TRAILING_STOP_3_ATR', name: '🛡️ Trailing Stop (Xx ATR)', desc: 'Sell when price falls Xx ATR below peak' },
  { id: 'PROFIT_10PCT_LOSS_5PCT', name: '🛡️ Target Profit / Stop-Loss', desc: 'Sell with fixed profit target and stop-loss' },
  { id: 'HOLD_5_DAYS', name: '⏳ Hold for exactly N days', desc: 'Sell after a short-term holding period' },
];

// ─── Mathematical Indicator Calculations (Client-Side) ───
const calculateSMA = (data, period, key = 'close') => {
  const sma = [];
  let slice = [];
  for (let i = 0; i < data.length; i++) {
    const val = data[i]?.[key];
    if (val === null || val === undefined || isNaN(val)) {
      sma.push(null);
      slice = [];
      continue;
    }
    slice.push(val);
    if (slice.length > period) slice.shift();
    if (slice.length < period) sma.push(null);
    else sma.push(slice.reduce((acc, curr) => acc + curr, 0) / period);
  }
  return sma;
};

const calculateEMA = (data, period, key = 'close') => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  let prevEma = null;
  let validCount = 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const val = data[i]?.[key];
    if (val === null || val === undefined || isNaN(val)) {
      ema.push(null);
      validCount = 0;
      sum = 0;
      prevEma = null;
      continue;
    }
    validCount++;
    if (validCount < period) {
      sum += val;
      ema.push(null);
    } else if (validCount === period) {
      sum += val;
      prevEma = sum / period;
      ema.push(prevEma);
    } else {
      prevEma = (val - prevEma) * multiplier + prevEma;
      ema.push(prevEma);
    }
  }
  return ema;
};

const calculateMACD = (data, fast = 12, slow = 26, signal = 9) => {
  const shortEma = calculateEMA(data, fast);
  const longEma = calculateEMA(data, slow);
  const macdLine = [];
  for (let i = 0; i < data.length; i++) {
    if (shortEma[i] === null || longEma[i] === null) macdLine.push(null);
    else macdLine.push(shortEma[i] - longEma[i]);
  }
  const macdData = macdLine.map(val => ({ close: val }));
  const signalLine = calculateEMA(macdData, signal);
  return macdLine.map((val, i) => ({
    macd: val,
    signal: signalLine[i],
    histogram: (val !== null && signalLine[i] !== null) ? val - signalLine[i] : null
  }));
};

const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
  const sma = calculateSMA(data, period);
  const bands = [];
  for (let i = 0; i < data.length; i++) {
    const mean = sma[i];
    if (mean === null || mean === undefined) {
      bands.push({ upper: null, lower: null, middle: null });
      continue;
    }
    const slice = data.slice(i - period + 1, i + 1).map(val => val.close);
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    bands.push({
      middle: mean,
      upper: mean + (stdDev * multiplier),
      lower: mean - (stdDev * multiplier)
    });
  }
  return bands;
};

const calculateRSI = (data, period = 14) => {
  const rsi = [];
  let gains = 0, losses = 0;
  let validChanges = 0;
  for (let i = 0; i < data.length; i++) {
    if (i === 0 || data[i]?.close === null || data[i - 1]?.close === null) {
      rsi.push(null);
      continue;
    }
    const change = data[i].close - data[i - 1].close;
    validChanges++;
    if (validChanges <= period) {
      if (change > 0) gains += change;
      else losses -= change;
      if (validChanges === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        rsi.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss))));
      } else {
        rsi.push(null);
      }
    } else {
      const prevAvgGain = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
      const prevAvgLoss = (losses * (period - 1) + (change < 0 ? -change : 0)) / period;
      gains = prevAvgGain;
      losses = prevAvgLoss;
      rsi.push(prevAvgLoss === 0 ? 100 : 100 - (100 / (1 + (prevAvgGain / prevAvgLoss))));
    }
  }
  return rsi;
};

const calculateATR = (data, period = 14) => {
  const atr = [];
  const tr = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.high === null || data[i]?.low === null) {
      atr.push(null);
      tr.push(null);
      continue;
    }
    if (i === 0 || data[i - 1]?.close === null) {
      tr.push(data[i].high - data[i].low);
      atr.push(null);
      continue;
    }
    const hl = data[i].high - data[i].low;
    const hpc = Math.abs(data[i].high - data[i - 1].close);
    const lpc = Math.abs(data[i].low - data[i - 1].close);
    const trueRange = Math.max(hl, hpc, lpc);
    tr.push(trueRange);
    const validTrSlice = tr.slice(0, i + 1).filter(v => v !== null);
    if (validTrSlice.length < period) {
      atr.push(null);
    } else if (validTrSlice.length === period) {
      atr.push(validTrSlice.reduce((acc, val) => acc + val, 0) / period);
    } else {
      const prevAtr = atr[i - 1];
      if (prevAtr === null) {
        atr.push(validTrSlice.slice(-period).reduce((acc, val) => acc + val, 0) / period);
      } else {
        atr.push((prevAtr * (period - 1) + trueRange) / period);
      }
    }
  }
  return atr;
};

// ─── Local Strategy Backtesting Simulation Engine ───
const runLocalSimulation = (rawData, config) => {
  const {
    entryRules, exitRules, entryLogic, exitLogic,
    entryParams, exitParams, slippagePct, brokerFeePct
  } = config;

  // Calculate Indicators
  const rsiPeriod = Number(entryParams.rsiPeriod) || Number(exitParams.rsiPeriod) || 14;
  const smaPeriod = Number(entryParams.smaPeriod) || Number(exitParams.smaPeriod) || 20;
  const volPeriod = Number(entryParams.volPeriod) || 20;
  const macdFast = Number(entryParams.macdFast) || Number(exitParams.macdFast) || 12;
  const macdSlow = Number(entryParams.macdSlow) || Number(exitParams.macdSlow) || 26;
  const macdSignal = Number(entryParams.macdSignal) || Number(exitParams.macdSignal) || 9;
  const bbPeriod = Number(entryParams.bbPeriod) || Number(exitParams.bbPeriod) || 20;
  const bbStdDev = Number(entryParams.bbStdDev) || Number(exitParams.bbStdDev) || 2;
  const atrPeriod = Number(exitParams.atrPeriod) || 14;

  const entryRsiThresh = Number(entryParams.rsiThreshold) || 30;
  const entryConsecutiveDays = Number(entryParams.consecutiveDays) || 3;
  const entryDropLookback = Number(entryParams.dropLookback) || 5;
  const entryDropPercent = Number(entryParams.dropPercent) || 5;
  const entryVolMultiplier = Number(entryParams.volMultiplier) || 2;

  const exitRsiThresh = Number(exitParams.rsiThreshold) || 70;
  const exitAtrMultiplier = Number(exitParams.atrMultiplier) || 3;
  const exitProfitTarget = Number(exitParams.profitTarget) || 10;
  const exitStopLoss = Number(exitParams.stopLoss) || 5;
  const exitHoldDays = Number(exitParams.holdDays) || 5;

  const rsi = calculateRSI(rawData, rsiPeriod);
  const sma = calculateSMA(rawData, smaPeriod);
  const avgVol = calculateSMA(rawData, volPeriod, 'volume');
  const macd = calculateMACD(rawData, macdFast, macdSlow, macdSignal);
  const bb = calculateBollingerBands(rawData, bbPeriod, bbStdDev);
  const atr = calculateATR(rawData, atrPeriod);

  const data = rawData.map((d, i) => ({
    ...d,
    rsi: rsi[i],
    sma20: sma[i],
    avgVol: avgVol[i],
    macd: macd[i],
    bb: bb[i],
    atr: atr[i]
  }));

  const testData = data.slice(30);
  if (testData.length < 2) return null;

  let trades = [];
  let position = null;
  let initialCapital = 100000;
  let currentCapital = initialCapital;
  const equityCurve = [];
  const firstPrice = testData[0].close;

  for (let i = 1; i < testData.length; i++) {
    const today = testData[i];
    const prevDay = testData[i - 1];

    if (today.rsi === null || today.sma20 === null) continue;

    if (!position) {
      let buySignal = false;
      const ruleResults = [];

      if (entryRules.includes('RSI_DROP_30')) {
        ruleResults.push(prevDay.rsi >= entryRsiThresh && today.rsi < entryRsiThresh);
      }
      if (entryRules.includes('PRICE_CROSS_ABOVE_20MA')) {
        ruleResults.push(prevDay.close <= prevDay.sma20 && today.close > today.sma20);
      }
      if (entryRules.includes('MACD_CROSSOVER')) {
        ruleResults.push(prevDay.macd.histogram <= 0 && today.macd.histogram > 0);
      }
      if (entryRules.includes('BB_BOUNCE_LOWER')) {
        ruleResults.push(prevDay.close <= prevDay.bb.lower && today.close > today.bb.lower);
      }
      if (entryRules.includes('3_RED_DAYS')) {
        let redDays = 0;
        for (let j = 0; j < entryConsecutiveDays; j++) {
          const day = testData[i - j];
          if (day && day.close < day.open) redDays++;
          else break;
        }
        ruleResults.push(redDays === entryConsecutiveDays);
      }
      if (entryRules.includes('PRICE_DROP_5PCT_WEEK') && i >= entryDropLookback) {
        const pastDay = testData[i - entryDropLookback];
        ruleResults.push(pastDay && ((pastDay.close - today.close) / pastDay.close) > (entryDropPercent / 100));
      }
      if (entryRules.includes('VOLUME_SPIKE_2X')) {
        ruleResults.push(today.avgVol && today.volume > today.avgVol * entryVolMultiplier);
      }

      if (ruleResults.length > 0) {
        buySignal = entryLogic === 'AND' ? ruleResults.every(Boolean) : ruleResults.some(Boolean);
      }

      if (buySignal) {
        const execPrice = today.close * (1 + (slippagePct / 100));
        const shares = currentCapital / execPrice;
        const fee = currentCapital * (brokerFeePct / 100);
        position = {
          buyPrice: execPrice,
          shares: shares,
          feePaid: fee,
          buyDate: today.date,
          buyIndex: i,
          maxPriceSeen: execPrice,
          atrAtBuy: today.atr
        };
        currentCapital -= fee;
      }
    } else {
      let sellSignal = false;
      const profitPct = ((today.close - position.buyPrice) / position.buyPrice) * 100;
      const daysHeld = i - position.buyIndex;

      if (today.close > position.maxPriceSeen) {
        position.maxPriceSeen = today.close;
      }

      const exitRuleResults = [];
      if (exitRules.includes('RSI_ABOVE_70')) {
        exitRuleResults.push(today.rsi > exitRsiThresh);
      }
      if (exitRules.includes('PRICE_CROSS_BELOW_20MA')) {
        exitRuleResults.push(prevDay.close >= prevDay.sma20 && today.close < today.sma20);
      }
      if (exitRules.includes('MACD_CROSSUNDER')) {
        exitRuleResults.push(prevDay.macd.histogram >= 0 && today.macd.histogram < 0);
      }
      if (exitRules.includes('BB_TOUCH_UPPER')) {
        exitRuleResults.push(today.close >= today.bb.upper);
      }
      if (exitRules.includes('TRAILING_STOP_3_ATR') && position.atrAtBuy) {
        exitRuleResults.push(today.close <= (position.maxPriceSeen - (exitAtrMultiplier * position.atrAtBuy)));
      }
      if (exitRules.includes('PROFIT_10PCT_LOSS_5PCT')) {
        exitRuleResults.push(profitPct >= exitProfitTarget || profitPct <= -exitStopLoss);
      }
      if (exitRules.includes('HOLD_5_DAYS')) {
        exitRuleResults.push(daysHeld >= exitHoldDays);
      }

      if (exitRuleResults.length > 0) {
        sellSignal = exitLogic === 'AND' ? exitRuleResults.every(Boolean) : exitRuleResults.some(Boolean);
      }

      if (i === testData.length - 1) sellSignal = true;

      if (sellSignal) {
        const execPrice = today.close * (1 - (slippagePct / 100));
        const grossVal = position.shares * execPrice;
        const fee = grossVal * (brokerFeePct / 100);
        const netVal = grossVal - fee;
        const invested = position.shares * position.buyPrice;
        const profitAbs = netVal - invested - position.feePaid;
        const profitPctNet = (profitAbs / invested) * 100;

        trades.push({
          buyDate: position.buyDate,
          sellDate: today.date,
          buyPrice: position.buyPrice,
          sellPrice: execPrice,
          profitPct: profitPctNet,
          profitAbs: profitAbs,
          daysHeld: daysHeld
        });
        currentCapital = netVal;
        position = null;
      }
    }

    const dailyEquity = position ? position.shares * today.close : currentCapital;
    equityCurve.push({
      date: today.date,
      close: parseFloat(today.close.toFixed(2)),
      strategyReturn: parseFloat((((dailyEquity - initialCapital) / initialCapital) * 100).toFixed(2)),
      benchmarkReturn: parseFloat((((today.close - firstPrice) / firstPrice) * 100).toFixed(2))
    });
  }

  // Statistics
  const wins = trades.filter(t => t.profitPct > 0);
  const losses = trades.filter(t => t.profitPct <= 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const grossProfit = wins.reduce((sum, t) => sum + t.profitAbs, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitAbs, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 100 : 0) : (grossProfit / grossLoss);

  let sharpeRatio = 0;
  let sortinoRatio = 0;
  if (trades.length > 1) {
    const returns = trades.map(t => t.profitPct / 100);
    const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
    const variance = returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    const downsides = returns.filter(r => r < 0);
    const downsideVar = downsides.reduce((acc, val) => acc + Math.pow(val, 2), 0) / (returns.length - 1);
    const downsideStdDev = Math.sqrt(downsideVar);
    const holdDaysSum = trades.reduce((acc, val) => acc + val.daysHeld, 0);
    const avgHoldDays = holdDaysSum / trades.length;
    const tradesPerYear = avgHoldDays > 0 ? 252 / avgHoldDays : 252;
    const rfrPerTrade = 0.05 / tradesPerYear;
    sharpeRatio = stdDev > 0 ? ((meanReturn - rfrPerTrade) / stdDev) * Math.sqrt(tradesPerYear) : 0;
    sortinoRatio = downsideStdDev > 0 ? ((meanReturn - rfrPerTrade) / downsideStdDev) * Math.sqrt(tradesPerYear) : 0;
  }

  let maxDrawdown = 0;
  let peak = initialCapital;
  let cap = initialCapital;
  for (const t of trades) {
    cap += t.profitAbs;
    if (cap > peak) peak = cap;
    const dd = peak - cap;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const lastPrice = testData[testData.length - 1].close;
  const buyAndHoldReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
  const roiPct = ((currentCapital - initialCapital) / initialCapital) * 100;
  const maxDrawdownPct = (maxDrawdown / initialCapital) * 100;
  const calmarRatio = maxDrawdownPct > 0 ? roiPct / maxDrawdownPct : 0;

  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.profitAbs)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.profitAbs)) : 0;

  return {
    stats: {
      totalTrades: trades.length,
      winRate: winRate.toFixed(2),
      wins: wins.length,
      losses: losses.length,
      netProfit: (currentCapital - initialCapital).toFixed(2),
      roiPct: roiPct.toFixed(2),
      buyAndHoldPct: buyAndHoldReturn.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      avgWin: (wins.length > 0 ? grossProfit / wins.length : 0).toFixed(2),
      avgLoss: (losses.length > 0 ? grossLoss / losses.length : 0).toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      sortinoRatio: sortinoRatio.toFixed(2),
      calmarRatio: calmarRatio.toFixed(2),
      maxDrawdownPct: maxDrawdownPct.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      bestTrade: bestTrade.toFixed(2),
      worstTrade: worstTrade.toFixed(2),
    },
    trades,
    chartData: equityCurve
  };
};

// ─── Knuth-Morris-Pratt (KMP) Substring Matcher (Client-Side) ───
const computeLPSArray = (pat) => {
  const M = pat.length;
  const lps = new Array(M).fill(0);
  let len = 0;
  let i = 1;
  while (i < M) {
    if (pat[i] === pat[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }
  return lps;
};

const generateKMPSteps = (txt, pat, lps) => {
  const steps = [];
  const N = txt.length;
  const M = pat.length;
  if (M === 0) return steps;
  let i = 0; // index for txt
  let j = 0; // index for pat

  while (i < N) {
    steps.push({
      i,
      j,
      textChar: txt[i],
      patChar: pat[j],
      type: 'compare',
      desc: `Comparing Text[${i}] ('${txt[i]}') and Pattern[${j}] ('${pat[j]}')`,
      match: txt[i] === pat[j]
    });

    if (pat[j] === txt[i]) {
      i++;
      j++;
    }

    if (j === M) {
      steps.push({
        i,
        j,
        type: 'found',
        desc: `🎉 Pattern match found starting at Text index ${i - j}!`,
        matchIndex: i - j
      });
      j = lps[j - 1];
    } else if (i < N && pat[j] !== txt[i]) {
      steps.push({
        i,
        j,
        type: 'mismatch',
        desc: `Mismatch! Text[${i}] ('${txt[i]}') != Pattern[${j}] ('${pat[j]}')`,
        match: false
      });
      if (j !== 0) {
        const nextJ = lps[j - 1];
        steps.push({
          i,
          j,
          type: 'jump',
          desc: `LPS Backtrack: Jump pattern pointer j from j=${j} to j=${nextJ} (LPS[${j-1}])`,
          prevJ: j,
          nextJ
        });
        j = nextJ;
      } else {
        steps.push({
          i,
          j,
          type: 'advance',
          desc: `Pattern index j is at 0. Increment text index i to ${i + 1}`,
          prevI: i,
          nextI: i + 1
        });
        i++;
      }
    }
  }
  return steps;
};

const StrategyLab = () => {
  // Page states
  const [tab, setTab] = useState('backtest'); // 'backtest', 'optimize', 'library', or 'integrity'
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [companyName, setCompanyName] = useState('Reliance Industries');
  const [searchQuery, setSearchQuery] = useState('Reliance Industries (RELIANCE.NS)');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  // KMP Integrity Scanner states
  const [kmpText, setKmpText] = useState("Buy RELIANCE when 14-day RSI drops below 30. Sell when trailing stop ATR multiplier reaches 3.0x.");
  const [kmpPattern, setKmpPattern] = useState("RSI drops below 30");
  const [kmpCurrentStep, setKmpCurrentStep] = useState(-1);
  const [kmpIsPlaying, setKmpIsPlaying] = useState(false);
  const [kmpSpeed, setKmpSpeed] = useState(1000);

  const kmpLps = useMemo(() => {
    return computeLPSArray(kmpPattern);
  }, [kmpPattern]);

  const kmpSteps = useMemo(() => {
    return generateKMPSteps(kmpText, kmpPattern, kmpLps);
  }, [kmpText, kmpPattern, kmpLps]);

  useEffect(() => {
    let timer;
    if (kmpIsPlaying) {
      timer = setInterval(() => {
        setKmpCurrentStep((prev) => {
          if (prev >= kmpSteps.length - 1) {
            setKmpIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, kmpSpeed);
    }
    return () => clearInterval(timer);
  }, [kmpIsPlaying, kmpSteps.length, kmpSpeed]);

  // Plagiarism Auditor states
  const [libraryAuditResults, setLibraryAuditResults] = useState([]);
  const [auditingLibrary, setAuditingLibrary] = useState(false);

  const runLibraryAudit = () => {
    if (!kmpPattern || kmpPattern.trim() === '') {
      toast.error('Please enter a pattern to check plagiarism');
      return;
    }
    setAuditingLibrary(true);
    setTimeout(() => {
      const results = savedStrategies.map(strat => {
        // Build the text representation of the saved strategy
        const entryStr = strat.entryRules?.map(r => {
          const ruleObj = ENTRY_RULES.find(er => er.id === r);
          return `${ruleObj?.name || r}: ${ruleObj?.desc || ''}`;
        }).join(', ') || '';
        
        const exitStr = strat.exitRules?.map(r => {
          const ruleObj = EXIT_RULES.find(er => er.id === r);
          return `${ruleObj?.name || r}: ${ruleObj?.desc || ''}`;
        }).join(', ') || '';

        const fullStrategyText = `${strat.name} ${strat.description || ''} ${strat.symbol} EntryRules:[${entryStr}] ExitRules:[${exitStr}]`.toLowerCase();
        const patternLower = kmpPattern.toLowerCase();
        
        // Run KMP algorithm on fullStrategyText for patternLower
        const lps = computeLPSArray(patternLower);
        let i = 0;
        let j = 0;
        let occurrences = 0;
        const n = fullStrategyText.length;
        const m = patternLower.length;

        if (m > 0) {
          while (i < n) {
            if (fullStrategyText[i] === patternLower[j]) {
              i++;
              j++;
            }
            if (j === m) {
              occurrences++;
              j = lps[j - 1];
            } else if (i < n && fullStrategyText[i] !== patternLower[j]) {
              if (j !== 0) {
                j = lps[j - 1];
              } else {
                i++;
              }
            }
          }
        }

        // Calculate a similarity score (0 to 100) based on occurrences and character match
        let similarityScore = 0;
        if (occurrences > 0) {
          similarityScore = Math.min(100, 75 + occurrences * 5);
        } else {
          // If no exact match, calculate sub-pattern word matching to give partial similarity
          const words = patternLower.split(/\s+/).filter(w => w.length > 2);
          if (words.length > 0) {
            let matchedWords = 0;
            words.forEach(word => {
              const wlps = computeLPSArray(word);
              let wi = 0, wj = 0;
              const wn = fullStrategyText.length;
              const wm = word.length;
              let wordFound = false;
              while (wi < wn) {
                if (fullStrategyText[wi] === word[wj]) {
                  wi++;
                  wj++;
                }
                if (wj === wm) {
                  wordFound = true;
                  break;
                } else if (wi < wn && fullStrategyText[wi] !== word[wj]) {
                  if (wj !== 0) {
                    wj = wlps[wj - 1];
                  } else {
                    wi++;
                  }
                }
              }
              if (wordFound) matchedWords++;
            });
            similarityScore = Math.round((matchedWords / words.length) * 50);
          }
        }

        // Determine Verdict
        let verdict = 'CLEAR';
        let verdictColor = 'text-green-400 bg-green-500/10 border-green-500/20';
        if (similarityScore > 70) {
          verdict = 'CLONE DETECTED';
          verdictColor = 'text-red-400 bg-red-500/10 border-red-500/20';
        } else if (similarityScore > 30) {
          verdict = 'PARTIAL MATCH';
          verdictColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        }

        return {
          id: strat._id,
          name: strat.name,
          symbol: strat.symbol,
          similarityScore,
          occurrences,
          verdict,
          verdictColor
        };
      });

      // Sort by similarity score descending
      results.sort((a, b) => b.similarityScore - a.similarityScore);
      setLibraryAuditResults(results);
      setAuditingLibrary(false);
      toast.success('Library Plagiarism Scan complete!');
    }, 1000);
  };

  // Strategy Composer states
  const [entryRules, setEntryRules] = useState(['RSI_DROP_30']);
  const [exitRules, setExitRules] = useState(['PROFIT_10PCT_LOSS_5PCT']);
  const [entryLogic, setEntryLogic] = useState('OR');
  const [exitLogic, setExitLogic] = useState('OR');

  const [entryParams, setEntryParams] = useState({
    rsiThreshold: 30, rsiPeriod: 14, smaPeriod: 20,
    macdFast: 12, macdSlow: 26, macdSignal: 9,
    bbPeriod: 20, bbStdDev: 2, consecutiveDays: 3,
    dropLookback: 5, dropPercent: 5, volMultiplier: 2, volPeriod: 20
  });

  const [exitParams, setExitParams] = useState({
    rsiThreshold: 70, rsiPeriod: 14, smaPeriod: 20,
    macdFast: 12, macdSlow: 26, macdSignal: 9,
    bbPeriod: 20, bbStdDev: 2, atrMultiplier: 3, atrPeriod: 14,
    profitTarget: 10, stopLoss: 5, holdDays: 5
  });

  const [slippagePct, setSlippagePct] = useState(0.1);
  const [brokerFeePct, setBrokerFeePct] = useState(0.05);

  // Simulation results
  const [simulationResult, setSimulationResult] = useState(null);

  // Optimization sweep parameters
  const [optimizing, setOptimizing] = useState(false);
  const [optParamA, setOptParamA] = useState('rsiThreshold'); // entryParams
  const [optParamB, setOptParamB] = useState('profitTarget'); // exitParams
  const [optParamARange, setOptParamARange] = useState({ min: 20, max: 40, step: 5 });
  const [optParamBRange, setOptParamBRange] = useState({ min: 5, max: 20, step: 3 });
  const [optimizationMatrix, setOptimizationMatrix] = useState(null);

  // ── Strategy Library ──────────────────────────────────────
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '', _id: null });
  const [saving, setSaving] = useState(false);

  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const { data } = await api.get('/strategy/library');
      if (data.success) setSavedStrategies(data.strategies || []);
    } catch (e) {
      toast.error('Failed to load strategy library');
    }
    setLibraryLoading(false);
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (tab === 'library') fetchLibrary();
  }, [tab]);

  const handleSaveStrategy = async (e) => {
    e.preventDefault();
    if (!saveForm.name.trim()) { toast.error('Enter a strategy name'); return; }
    setSaving(true);
    try {
      const payload = {
        _id: saveForm._id || undefined,
        name: saveForm.name.trim(),
        description: saveForm.description.trim(),
        symbol, companyName,
        entryRules, exitRules, entryLogic, exitLogic,
        entryParams, exitParams, slippagePct, brokerFeePct,
        lastResult: simulationResult ? {
          roiPct: parseFloat(simulationResult.stats.roiPct),
          winRate: parseFloat(simulationResult.stats.winRate),
          totalTrades: simulationResult.stats.totalTrades,
          sharpeRatio: parseFloat(simulationResult.stats.sharpeRatio),
          maxDrawdownPct: parseFloat(simulationResult.stats.maxDrawdownPct),
        } : undefined
      };
      const { data } = await api.post('/strategy/library', payload);
      if (data.success) {
        toast.success(`📚 "${saveForm.name}" saved to your library!`);
        setShowSaveModal(false);
        setSaveForm({ name: '', description: '', _id: null });
        fetchLibrary();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save strategy');
    }
    setSaving(false);
  };

  const handleLoadStrategy = (strat) => {
    setSymbol(strat.symbol);
    setCompanyName(strat.companyName || strat.symbol);
    setSearchQuery(`${strat.companyName || strat.symbol} (${strat.symbol})`);
    setEntryRules(strat.entryRules);
    setExitRules(strat.exitRules);
    setEntryLogic(strat.entryLogic || 'OR');
    setExitLogic(strat.exitLogic || 'OR');
    setEntryParams(strat.entryParams || {});
    setExitParams(strat.exitParams || {});
    setSlippagePct(strat.slippagePct ?? 0.1);
    setBrokerFeePct(strat.brokerFeePct ?? 0.05);
    setTab('backtest');
    setSimulationResult(null);
    toast.success(`📂 Loaded: "${strat.name}" — run backtest to see results!`);
  };

  const handleDeleteStrategy = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/strategy/library/${id}`);
      toast.success(`🗑️ "${name}" deleted`);
      setSavedStrategies(prev => prev.filter(s => s._id !== id));
    } catch (e) {
      toast.error('Failed to delete strategy');
    }
  };

  // Load 1 year historical data on Symbol Change
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setSimulationResult(null);
      setOptimizationMatrix(null);
      const toDateStr = new Date().toISOString().split('T')[0];
      const fromDate = new Date();
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      fromDate.setDate(fromDate.getDate() - 40); // buffer
      const fromDateStr = fromDate.toISOString().split('T')[0];

      try {
        const { data } = await api.get(`/backtest/chart?symbol=${symbol}&fromDate=${fromDateStr}&toDate=${toDateStr}`);
        if (data.success && data.candles?.length > 0) {
          setHistoricalData(data.candles);
          setIsMockData(!!data.isMock);
        } else {
          toast.error('Failed to get price candles');
        }
      } catch (err) {
        setIsMockData(true);
        toast.error('Could not fetch real historical price data. Using simulated mock data for strategy simulation.', { duration: 5000 });
        // Graceful fallback: generate mock OHLCV data client-side so the Lab always works
        const mockCandles = [];
        const priceMap = {
          'RELIANCE.NS': 2950, 'TCS.NS': 3850, 'INFY.NS': 1680, 'HDFCBANK.NS': 1540,
          'ICICIBANK.NS': 990, 'SBIN.NS': 740, 'WIPRO.NS': 480, 'TATAMOTORS.NS': 920,
          'HCLTECH.NS': 1450, 'BAJFINANCE.NS': 6500, 'MARUTI.NS': 11500,
          'SUNPHARMA.NS': 1540, 'DRREDDY.NS': 6150, 'NTPC.NS': 340, 'ONGC.NS': 260,
          'NESTLEIND.NS': 2510, 'ADANIENT.NS': 3100, 'ITC.NS': 410
        };
        const basePrice = priceMap[symbol.toUpperCase()] || 1000;
        let lastClose = basePrice;
        const today = new Date();
        for (let i = 299; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          if (d.getDay() === 0 || d.getDay() === 6) continue;
          const chg = (Math.sin(i / 10) * 0.015) + ((Math.random() - 0.48) * 0.025);
          const close = lastClose * (1 + chg);
          const high = Math.max(lastClose, close) * (1 + Math.random() * 0.012);
          const low = Math.min(lastClose, close) * (1 - Math.random() * 0.012);
          mockCandles.push({
            date: d.toISOString().split('T')[0],
            open: parseFloat(lastClose.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
          });
          lastClose = close;
        }
        setHistoricalData(mockCandles);
        // Silently continue — no error toast shown to user
      }

      setLoading(false);
    };

    fetchChartData();
  }, [symbol]);

  // Run Local Backtest when config changes or raw data arrives
  const activeConfig = useMemo(() => ({
    entryRules, exitRules, entryLogic, exitLogic,
    entryParams, exitParams, slippagePct, brokerFeePct
  }), [entryRules, exitRules, entryLogic, exitLogic, entryParams, exitParams, slippagePct, brokerFeePct]);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const payload = {
        symbol,
        entryRules,
        exitRules,
        entryLogic,
        exitLogic,
        entryParams,
        exitParams
      };
      const { data } = await api.post('/strategy/run', payload);
      if (data.success) {
        setSimulationResult({
          stats: {
            ...data.stats,
            totalTrades: Number(data.stats.totalTrades),
            winRate: parseFloat(data.stats.winRate),
            wins: Number(data.stats.wins),
            losses: Number(data.stats.losses),
            netProfit: parseFloat(data.stats.netProfit),
            roiPct: parseFloat(data.stats.roiPct),
            buyAndHoldPct: parseFloat(data.stats.buyAndHoldPct),
            profitFactor: parseFloat(data.stats.profitFactor),
            avgWin: parseFloat(data.stats.avgWin),
            avgLoss: parseFloat(data.stats.avgLoss),
            maxWinStreak: Number(data.stats.maxWinStreak),
            maxLossStreak: Number(data.stats.maxLossStreak),
            sharpeRatio: parseFloat(data.stats.sharpeRatio),
            sortinoRatio: parseFloat(data.stats.sortinoRatio),
            calmarRatio: parseFloat(data.stats.calmarRatio),
            maxDrawdownPct: parseFloat(data.stats.maxDrawdownPct),
            maxDrawdown: parseFloat(data.stats.maxDrawdown),
            bestTrade: parseFloat(data.stats.bestTrade),
            worstTrade: parseFloat(data.stats.worstTrade),
          },
          trades: data.trades,
          chartData: data.chartData
        });
        toast.success('Strategy Simulated on Server! 🚀');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Server simulation failed, falling back to local simulation:', e.message);
    }

    if (!historicalData) {
      toast.error('No stock data loaded');
      setLoading(false);
      return;
    }
    const res = runLocalSimulation(historicalData, activeConfig);
    if (res) {
      setSimulationResult(res);
      toast.success('Strategy Simulated (Local Fallback)! 🧪');
    } else {
      toast.error('Simulation returned empty results.');
    }
    setLoading(false);
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
      console.error('Symbol query error:', err);
    }
  };

  const toggleEntryRule = (id) => {
    setEntryRules(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleExitRule = (id) => {
    setExitRules(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Run Parameter Grid Search Optimization
  const runParameterOptimization = () => {
    if (!historicalData) {
      toast.error('No historical stock data loaded');
      return;
    }
    setOptimizing(true);
    setOptimizationMatrix(null);

    setTimeout(() => {
      const results = [];
      const rangeA = [];
      for (let v = optParamARange.min; v <= optParamARange.max; v += optParamARange.step) {
        rangeA.push(v);
      }
      const rangeB = [];
      for (let v = optParamBRange.min; v <= optParamBRange.max; v += optParamBRange.step) {
        rangeB.push(v);
      }

      // Loop combinations
      for (const valA of rangeA) {
        const row = { valA, cols: [] };
        for (const valB of rangeB) {
          // Clone config
          const entryParamsCopy = { ...entryParams };
          const exitParamsCopy = { ...exitParams };

          // Set parameter values
          if (optParamA in entryParamsCopy) entryParamsCopy[optParamA] = valA;
          else if (optParamA in exitParamsCopy) exitParamsCopy[optParamA] = valA;

          if (optParamB in entryParamsCopy) entryParamsCopy[optParamB] = valB;
          else if (optParamB in exitParamsCopy) exitParamsCopy[optParamB] = valB;

          const testConfig = {
            entryRules, exitRules, entryLogic, exitLogic,
            entryParams: entryParamsCopy, exitParams: exitParamsCopy,
            slippagePct, brokerFeePct
          };

          const sim = runLocalSimulation(historicalData, testConfig);
          row.cols.push({
            valB,
            roiPct: sim ? parseFloat(sim.stats.roiPct) : 0,
            calmar: sim ? parseFloat(sim.stats.calmarRatio) : 0,
            totalTrades: sim ? sim.stats.totalTrades : 0,
            config: testConfig
          });
        }
        results.push(row);
      }

      setOptimizationMatrix({
        paramAName: optParamA,
        paramBName: optParamB,
        rangeA,
        rangeB,
        rows: results
      });
      setOptimizing(false);
      toast.success('Grid Sweep Complete! 🚀');
    }, 50);
  };

  // Autoload a sweep result configuration into backtest
  const loadOptimizationConfig = (config, valA, valB) => {
    setEntryParams(config.entryParams);
    setExitParams(config.exitParams);
    setTab('backtest');
    setTimeout(() => {
      const res = runLocalSimulation(historicalData, config);
      if (res) {
        setSimulationResult(res);
        toast.success(`Loaded configuration: ${optParamA}=${valA}, ${optParamB}=${valB}`);
      }
    }, 100);
  };

  const outperformance = parseFloat(simulationResult?.stats?.roiPct || 0) - parseFloat(simulationResult?.stats?.buyAndHoldPct || 0);

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">🧪 StrategyLab</h1>
            <p className="text-slate-400 text-sm mt-1">
              Design institutional algorithms • Run dynamic sweeps • Instantly optimize parameters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/trade">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                📈 Trading Arena
              </button>
            </Link>
            <Link to="/trade/backtest">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                ⏳ Time Machine
              </button>
            </Link>
          </div>
        </div>


        {/* Studio Tabs */}
        <div className="flex border-b border-white/5 mb-6 items-center justify-between">
          <div className="flex">
            <button
              onClick={() => setTab('backtest')}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition cursor-pointer ${
                tab === 'backtest'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🧪 Strategy Backtester
            </button>
            <button
              onClick={() => setTab('optimize')}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition cursor-pointer ${
                tab === 'optimize'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Grid Sweep Optimizer
            </button>
            <button
              onClick={() => setTab('library')}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition cursor-pointer flex items-center gap-2 ${
                tab === 'library'
                  ? 'border-purple-400 text-purple-400 bg-purple-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📚 Strategy Library
              {savedStrategies.length > 0 && (
                <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                  {savedStrategies.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('integrity')}
              className={`py-3 px-6 font-bold text-sm border-b-2 transition cursor-pointer flex items-center gap-2 ${
                tab === 'integrity'
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Integrity Scanner
            </button>
          </div>
          {/* Save current strategy button */}
          {(tab === 'backtest' || tab === 'optimize') && (
            <button
              onClick={() => { setSaveForm({ name: '', description: '', _id: null }); setShowSaveModal(true); }}
              className="flex items-center gap-2 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 px-4 py-2 rounded-lg transition mb-0.5"
            >
              💾 Save Strategy
            </button>
          )}
        </div>

        {/* Save Strategy Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">💾 Save Strategy to Library</h2>
                <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
              </div>
              <form onSubmit={handleSaveStrategy} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block font-medium">Strategy Name *</label>
                  <input
                    className="input-dark"
                    placeholder="e.g. RSI Bounce + 10% Profit Target"
                    value={saveForm.name}
                    onChange={e => setSaveForm(f => ({ ...f, name: e.target.value }))}
                    maxLength={80}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block font-medium">Description (optional)</label>
                  <textarea
                    className="input-dark resize-none"
                    rows={2}
                    placeholder="What makes this strategy special?"
                    value={saveForm.description}
                    onChange={e => setSaveForm(f => ({ ...f, description: e.target.value }))}
                    maxLength={200}
                  />
                </div>
                <div className="text-[11px] text-slate-500 bg-white/5 rounded-xl p-3 space-y-0.5">
                  <div>📈 <span className="text-slate-400">Ticker:</span> {symbol}</div>
                  <div>🎯 <span className="text-slate-400">Entry Rules:</span> {entryRules.join(', ')}</div>
                  <div>🚪 <span className="text-slate-400">Exit Rules:</span> {exitRules.join(', ')}</div>
                  {simulationResult && (
                    <div>📊 <span className="text-slate-400">Last ROI:</span> <span className={parseFloat(simulationResult.stats.roiPct) >= 0 ? 'text-green-400' : 'text-red-400'}>{simulationResult.stats.roiPct}%</span></div>
                  )}
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowSaveModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Saving...' : '💾 Save to Library'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Layout Grid */}
        {tab !== 'integrity' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Composer Controls */}
          <div className="space-y-6 lg:col-span-1">

            {/* 1. Stock Selection */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-cyan-400">1. Select Ticker</h3>
                {symbol && (
                  <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                    {symbol.replace('.NS', '')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-4">
                {POPULAR_STOCKS.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      setSymbol(s.symbol);
                      setCompanyName(s.name);
                      setSearchQuery(`${s.name} (${s.symbol})`);
                    }}
                    title={s.name}
                    className={`p-1.5 rounded-lg text-[9px] font-bold transition border ${
                      symbol === s.symbol
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400 shadow-md'
                        : 'border-white/8 text-slate-500 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {s.name.split(' ')[0].substring(0, 6)}
                  </button>
                ))}
              </div>

              {/* Autocomplete Input */}
              <div className="relative">
                <input
                  className="input-dark w-full"
                  placeholder="🔍 Search stock (e.g. Reliance, TCS, INFY)..."
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

            {/* 2. Entry Rules */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-green-400">2. Entry Rules</h3>
                  {entryRules.length > 0 && (
                    <span className="text-[9px] font-black bg-green-500/20 text-green-400 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                      {entryRules.length} active
                    </span>
                  )}
                </div>
                <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[9px] font-bold">
                  {['OR', 'AND'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setEntryLogic(mode)}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        entryLogic === mode ? 'bg-green-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {ENTRY_RULES.map(rule => {
                  const isSelected = entryRules.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleEntryRule(rule.id)}
                      className={`px-3 py-2 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-green-400/50 bg-green-500/8 text-white'
                          : 'border-white/5 bg-white/3 text-slate-400 hover:border-white/10 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition ${
                        isSelected ? 'border-green-400 bg-green-400' : 'border-white/20'
                      }`}>
                        {isSelected && <span className="text-black text-[8px] font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[11px] leading-tight truncate">{rule.name}</p>
                        {isSelected && <p className="text-[9px] text-slate-500 mt-0.5 truncate">{rule.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Exit Rules */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-red-400">3. Exit Rules</h3>
                  {exitRules.length > 0 && (
                    <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">
                      {exitRules.length} active
                    </span>
                  )}
                </div>
                <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[9px] font-bold">
                  {['OR', 'AND'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setExitLogic(mode)}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        exitLogic === mode ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {EXIT_RULES.map(rule => {
                  const isSelected = exitRules.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleExitRule(rule.id)}
                      className={`px-3 py-2 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-red-400/50 bg-red-500/8 text-white'
                          : 'border-white/5 bg-white/3 text-slate-400 hover:border-white/10 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition ${
                        isSelected ? 'border-red-400 bg-red-400' : 'border-white/20'
                      }`}>
                        {isSelected && <span className="text-black text-[8px] font-black">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[11px] leading-tight truncate">{rule.name}</p>
                        {isSelected && <p className="text-[9px] text-slate-500 mt-0.5 truncate">{rule.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Customize Parameters */}
            <div className="card bg-[var(--bg-secondary)] border border-white/5 shadow-md">
              <h3 className="font-bold text-lg mb-4 text-cyan-400">4. Customize Parameters</h3>
              
              {/* Entry settings parameters block */}
              <div className="space-y-4 border-b border-white/5 pb-4 mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Entry Settings</h4>
                
                {entryRules.includes('RSI_DROP_30') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">RSI Oversold Threshold</span>
                      <span className="text-green-400">{entryParams.rsiThreshold}</span>
                    </div>
                    <input
                      type="range" min="15" max="45" step="1"
                      value={entryParams.rsiThreshold}
                      onChange={e => setEntryParams({ ...entryParams, rsiThreshold: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                    />
                  </div>
                )}
                
                {entryRules.includes('PRICE_CROSS_ABOVE_20MA') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Moving Average Period</span>
                      <span className="text-green-400">{entryParams.smaPeriod} days</span>
                    </div>
                    <input
                      type="range" min="5" max="100" step="1"
                      value={entryParams.smaPeriod}
                      onChange={e => setEntryParams({ ...entryParams, smaPeriod: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                    />
                  </div>
                )}
                
                {entryRules.includes('MACD_CROSSOVER') && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">MACD Fast Period</span>
                        <span className="text-green-400">{entryParams.macdFast}</span>
                      </div>
                      <input
                        type="range" min="5" max="30" step="1"
                        value={entryParams.macdFast}
                        onChange={e => setEntryParams({ ...entryParams, macdFast: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">MACD Slow Period</span>
                        <span className="text-green-400">{entryParams.macdSlow}</span>
                      </div>
                      <input
                        type="range" min="20" max="60" step="1"
                        value={entryParams.macdSlow}
                        onChange={e => setEntryParams({ ...entryParams, macdSlow: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                  </div>
                )}
                
                {entryRules.includes('BB_BOUNCE_LOWER') && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Bollinger Band Period</span>
                        <span className="text-green-400">{entryParams.bbPeriod}</span>
                      </div>
                      <input
                        type="range" min="5" max="50" step="1"
                        value={entryParams.bbPeriod}
                        onChange={e => setEntryParams({ ...entryParams, bbPeriod: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Band Standard Dev.</span>
                        <span className="text-green-400">{entryParams.bbStdDev}x</span>
                      </div>
                      <input
                        type="range" min="1" max="4" step="0.5"
                        value={entryParams.bbStdDev}
                        onChange={e => setEntryParams({ ...entryParams, bbStdDev: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                  </div>
                )}
                
                {entryRules.includes('3_RED_DAYS') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Consecutive Fall Days</span>
                      <span className="text-green-400">{entryParams.consecutiveDays} days</span>
                    </div>
                    <input
                      type="range" min="2" max="10" step="1"
                      value={entryParams.consecutiveDays}
                      onChange={e => setEntryParams({ ...entryParams, consecutiveDays: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                    />
                  </div>
                )}
                
                {entryRules.includes('PRICE_DROP_5PCT_WEEK') && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Lookback Period (Days)</span>
                        <span className="text-green-400">{entryParams.dropLookback} days</span>
                      </div>
                      <input
                        type="range" min="2" max="20" step="1"
                        value={entryParams.dropLookback}
                        onChange={e => setEntryParams({ ...entryParams, dropLookback: parseInt(e.target.value) || 0 })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Drop Percentage Threshold</span>
                        <span className="text-green-400">{entryParams.dropPercent}%</span>
                      </div>
                      <input
                        type="range" min="1" max="25" step="1"
                        value={entryParams.dropPercent}
                        onChange={e => setEntryParams({ ...entryParams, dropPercent: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                      />
                    </div>
                  </div>
                )}
                
                {entryRules.includes('VOLUME_SPIKE_2X') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Volume Spike Multiplier</span>
                      <span className="text-green-400">{entryParams.volMultiplier}x</span>
                    </div>
                    <input
                      type="range" min="1.5" max="5" step="0.5"
                      value={entryParams.volMultiplier}
                      onChange={e => setEntryParams({ ...entryParams, volMultiplier: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-400"
                    />
                  </div>
                )}
              </div>

              {/* Exit settings parameters block */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Exit Settings</h4>
                
                {exitRules.includes('RSI_ABOVE_70') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">RSI Overbought Threshold</span>
                      <span className="text-red-400">{exitParams.rsiThreshold}</span>
                    </div>
                    <input
                      type="range" min="50" max="90" step="1"
                      value={exitParams.rsiThreshold}
                      onChange={e => setExitParams({ ...exitParams, rsiThreshold: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                    />
                  </div>
                )}
                
                {exitRules.includes('PRICE_CROSS_BELOW_20MA') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Moving Average Period</span>
                      <span className="text-red-400">{exitParams.smaPeriod} days</span>
                    </div>
                    <input
                      type="range" min="5" max="100" step="1"
                      value={exitParams.smaPeriod}
                      onChange={e => setExitParams({ ...exitParams, smaPeriod: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                    />
                  </div>
                )}
                
                {exitRules.includes('TRAILING_STOP_3_ATR') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Trailing Stop ATR Multiplier</span>
                      <span className="text-red-400">{exitParams.atrMultiplier}x ATR</span>
                    </div>
                    <input
                      type="range" min="1.5" max="6" step="0.5"
                      value={exitParams.atrMultiplier}
                      onChange={e => setExitParams({ ...exitParams, atrMultiplier: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                    />
                  </div>
                )}
                
                {exitRules.includes('PROFIT_10PCT_LOSS_5PCT') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Profit Target %</label>
                      <input
                        type="number" min="1" max="100"
                        value={exitParams.profitTarget}
                        onChange={e => setExitParams({ ...exitParams, profitTarget: Math.max(1, parseInt(e.target.value) || 0) })}
                        className="input-dark w-full text-xs py-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Stop Loss %</label>
                      <input
                        type="number" min="1" max="50"
                        value={exitParams.stopLoss}
                        onChange={e => setExitParams({ ...exitParams, stopLoss: Math.max(1, parseInt(e.target.value) || 0) })}
                        className="input-dark w-full text-xs py-2"
                      />
                    </div>
                  </div>
                )}
                
                {exitRules.includes('HOLD_5_DAYS') && (
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">Holding Days</span>
                      <span className="text-red-400">{exitParams.holdDays} days</span>
                    </div>
                    <input
                      type="range" min="1" max="30" step="1"
                      value={exitParams.holdDays}
                      onChange={e => setExitParams({ ...exitParams, holdDays: parseInt(e.target.value) })}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-400"
                    />
                  </div>
                )}
              </div>
              
              {/* Friction costs */}
              <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Execution Costs</h4>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Slippage per Trade</span>
                    <span className="text-yellow-500">{slippagePct}%</span>
                  </div>
                  <input
                    type="range" min="0" max="2" step="0.1"
                    value={slippagePct}
                    onChange={e => setSlippagePct(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">Brokerage & Fees</span>
                    <span className="text-yellow-500">{brokerFeePct}%</span>
                  </div>
                  <input
                    type="range" min="0" max="0.5" step="0.01"
                    value={brokerFeePct}
                    onChange={e => setBrokerFeePct(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>
              </div>
            </div>

            {/* Backtest Trigger */}
            <div className="sticky bottom-4 pt-2">
              <button
                onClick={runBacktest}
                disabled={loading || !historicalData}
                className="btn-primary w-full py-4 text-base font-bold shadow-2xl shadow-cyan-500/30"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)', backdropFilter: 'blur(10px)' }}
              >
                {loading ? '⏳ Fetching 1Y Historical Data...' : '⚡ Run Backtest →'}
              </button>
              {!symbol && (
                <p className="text-center text-[10px] text-slate-500 mt-2">Select a stock ticker first</p>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Tabs Content */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 self-start">

            {/* Backtest View */}
            {tab === 'backtest' && (
              <>
                {!simulationResult && !loading && (
                  <div className="card flex flex-col items-center justify-center min-h-[400px] text-center bg-gradient-to-br from-cyan-900/5 to-transparent">
                    <div className="text-6xl mb-4">🧪</div>
                    <h3 className="text-xl font-bold text-white mb-2">Quant Backtester</h3>
                    <p className="text-slate-400 max-w-md">
                      Compose your quantitative strategy using Entry and Exit rules on the left panel, customize indicator periods/thresholds, and click "Run Backtest" to evaluate performance curves instantly.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="card flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-cyan-400 font-bold">Fetching Historical Candles from Yahoo Finance...</p>
                  </div>
                )}

                {simulationResult && !loading && (
                  <>
                    {isMockData && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 mb-4">
                        ⚠️ <strong>Simulated fallback data:</strong> Yahoo Finance chart fetching failed. The simulation results are running on mock historical candle data.
                      </div>
                    )}
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="card text-center bg-cyan-950/20 border-cyan-500/20 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Net Return (ROI %)</p>
                          <p className={`text-xl font-black mt-1 ${parseFloat(simulationResult.stats.netProfit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {parseFloat(simulationResult.stats.netProfit) >= 0 ? '+' : ''}₹{parseFloat(simulationResult.stats.netProfit).toLocaleString('en-IN')} ({simulationResult.stats.roiPct}%)
                          </p>
                        </div>
                        <div className="mt-2 border-t border-white/5 pt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Market: {simulationResult.stats.buyAndHoldPct}%</span>
                          <span className={`px-1.5 py-0.5 rounded font-extrabold text-[9px] ${outperformance >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {outperformance >= 0 ? '▲' : '▼'} {Math.abs(outperformance).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Win Rate</p>
                        <p className="text-xl font-black text-white mt-1">{simulationResult.stats.winRate}%</p>
                        <p className="text-[10px] text-slate-400 mt-1">{simulationResult.stats.wins} Wins • {simulationResult.stats.losses} Losses</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Total Trades</p>
                        <p className="text-xl font-black text-white mt-1">{simulationResult.stats.totalTrades}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Executed over 1 Year</p>
                      </div>
                      <div className="card text-center bg-red-950/20 border-red-500/20">
                        <p className="text-xs text-slate-400">Max Drawdown</p>
                        <p className="text-xl font-black text-red-400 mt-1">₹{parseFloat(simulationResult.stats.maxDrawdown).toLocaleString('en-IN')} ({simulationResult.stats.maxDrawdownPct}%)</p>
                        <p className="text-[10px] text-slate-500 mt-1">Max peak-to-trough drop</p>
                      </div>
                    </div>

                    {/* Advanced Risk Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Profit Factor</p>
                        <p className="text-xl font-black text-white mt-1">{simulationResult.stats.profitFactor}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Gross Gain / Loss</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Sharpe Ratio</p>
                        <p className={`text-xl font-black mt-1 ${parseFloat(simulationResult.stats.sharpeRatio) > 1.0 ? 'text-green-400' : parseFloat(simulationResult.stats.sharpeRatio) > 0.0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {simulationResult.stats.sharpeRatio}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Risk-Adjusted Return</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Sortino Ratio</p>
                        <p className={`text-xl font-black mt-1 ${parseFloat(simulationResult.stats.sortinoRatio) > 1.0 ? 'text-green-400' : parseFloat(simulationResult.stats.sortinoRatio) > 0.0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {simulationResult.stats.sortinoRatio}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Downside Deviation</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Calmar Ratio</p>
                        <p className={`text-xl font-black mt-1 ${parseFloat(simulationResult.stats.calmarRatio) > 1.0 ? 'text-green-400' : parseFloat(simulationResult.stats.calmarRatio) > 0.0 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {simulationResult.stats.calmarRatio}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">ROI / Drawdown</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-xs text-slate-400">Best / Worst Trade</p>
                        <p className="text-[11px] font-black text-white mt-1.5">
                          🟢 ₹{Math.round(simulationResult.stats.bestTrade)} | 🔴 ₹{Math.round(simulationResult.stats.worstTrade)}
                        </p>
                      </div>
                    </div>

                    {/* Chart */}
                    {simulationResult.chartData.length > 0 && (
                      <div className="card">
                        <h3 className="font-bold text-lg mb-4">📈 Performance vs. Benchmark</h3>
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simulationResult.chartData}>
                              <defs>
                                <linearGradient id="strategyGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} interval={Math.floor(simulationResult.chartData.length / 6)} />
                              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
                              <Tooltip
                                formatter={(v, name) => [`${v >= 0 ? '+' : ''}${v?.toFixed(2)}%`, name]}
                                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid #ffffff10', borderRadius: '12px' }}
                               cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                              <Area type="monotone" name="Strategy Return" dataKey="strategyReturn" stroke="#22D3EE" strokeWidth={2.5} fill="url(#strategyGrad)" dot={false} />
                              <Area type="monotone" name="Benchmark (Buy & Hold)" dataKey="benchmarkReturn" stroke="#A78BFA" strokeWidth={1.5} fill="url(#benchmarkGrad)" dot={false} strokeDasharray="3 3" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Trade history log */}
                    <div className="card">
                      <h3 className="font-bold text-lg mb-4">📊 Complete Strategy Trade Log</h3>
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-400">
                              <th className="pb-3">Buy Date / Price</th>
                              <th className="pb-3">Sell Date / Price</th>
                              <th className="pb-3">Duration</th>
                              <th className="pb-3 text-right">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulationResult.trades.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="text-center py-6 text-slate-500">
                                  No trades triggered. Try adjusting rules or easing parameters.
                                </td>
                              </tr>
                            ) : (
                              simulationResult.trades.map((t, idx) => (
                                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                                  <td className="py-3">
                                    <span className="font-medium text-slate-300">{t.buyDate}</span>
                                    <p className="text-xs text-slate-500">₹{t.buyPrice.toFixed(2)}</p>
                                  </td>
                                  <td className="py-3">
                                    <span className="font-medium text-slate-300">{t.sellDate}</span>
                                    <p className="text-xs text-slate-500">₹{t.sellPrice.toFixed(2)}</p>
                                  </td>
                                  <td className="py-3 text-slate-400">{t.daysHeld} days</td>
                                  <td className={`py-3 text-right font-bold ${t.profitPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.profitPct >= 0 ? '+' : ''}₹{t.profitAbs.toFixed(0)} ({t.profitPct >= 0 ? '+' : ''}{t.profitPct.toFixed(1)}%)
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Parameter Sweeping Optimizer View */}
            {tab === 'optimize' && (
              <div className="space-y-6">
                
                {/* Sweep config dashboard card */}
                <div className="card space-y-4">
                  <h3 className="font-bold text-lg text-cyan-400">📊 Configure Grid Parameter Sweep</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sweep Param A Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">Parameter A (Y-Axis)</label>
                      <select
                        className="input-dark text-xs w-full"
                        value={optParamA}
                        onChange={e => setOptParamA(e.target.value)}
                      >
                        <option value="rsiThreshold">RSI Buy Threshold</option>
                        <option value="smaPeriod">SMA Period</option>
                        <option value="consecutiveDays">Consecutive Red Days</option>
                        <option value="dropPercent">Price Drop %</option>
                      </select>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Min</label>
                          <input
                            type="number"
                            value={optParamARange.min}
                            onChange={e => setOptParamARange({ ...optParamARange, min: parseInt(e.target.value) || 0 })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Max</label>
                          <input
                            type="number"
                            value={optParamARange.max}
                            onChange={e => setOptParamARange({ ...optParamARange, max: parseInt(e.target.value) || 0 })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Step</label>
                          <input
                            type="number"
                            value={optParamARange.step}
                            onChange={e => setOptParamARange({ ...optParamARange, step: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sweep Param B Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">Parameter B (X-Axis)</label>
                      <select
                        className="input-dark text-xs w-full"
                        value={optParamB}
                        onChange={e => setOptParamB(e.target.value)}
                      >
                        <option value="profitTarget">Profit Target %</option>
                        <option value="stopLoss">Stop Loss %</option>
                        <option value="holdDays">Exit Hold Days</option>
                        <option value="atrMultiplier">Trailing ATR Multiplier</option>
                      </select>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Min</label>
                          <input
                            type="number"
                            value={optParamBRange.min}
                            onChange={e => setOptParamBRange({ ...optParamBRange, min: parseInt(e.target.value) || 0 })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Max</label>
                          <input
                            type="number"
                            value={optParamBRange.max}
                            onChange={e => setOptParamBRange({ ...optParamBRange, max: parseInt(e.target.value) || 0 })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase text-slate-500 font-bold block mb-1">Step</label>
                          <input
                            type="number"
                            value={optParamBRange.step}
                            onChange={e => setOptParamBRange({ ...optParamBRange, step: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="input-dark text-xs w-full p-2 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={runParameterOptimization}
                    disabled={optimizing || !historicalData}
                    className="btn-primary py-3 text-sm font-black w-full"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  >
                    {optimizing ? '⏳ Sweeping Grid Combinations...' : '📊 Run Parameter Optimization Sweep'}
                  </button>
                </div>

                {/* Optimization Sweep Results Heatmap */}
                {optimizationMatrix && (
                  <div className="card space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-white">🔥 Grid Sweep Heatmap (Net ROI %)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Y-Axis: {optimizationMatrix.paramAName} vs X-Axis: {optimizationMatrix.paramBName}. Click any cell to load its parameters.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="border-collapse mx-auto">
                        <thead>
                          <tr>
                            <th className="p-2 text-[10px] font-bold text-slate-500 text-right uppercase border-r border-white/5 pr-4">
                              {optimizationMatrix.paramAName} \ {optimizationMatrix.paramBName}
                            </th>
                            {optimizationMatrix.rangeB.map(valB => (
                              <th key={valB} className="p-2.5 text-center text-xs font-mono font-bold text-slate-300 min-w-16 border-b border-white/5">
                                {valB}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {optimizationMatrix.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="p-2 text-right text-xs font-mono font-black text-slate-300 pr-4 border-r border-white/5">
                                {row.valA}
                              </td>
                              {row.cols.map((cell, cIdx) => {
                                const roi = cell.roiPct;
                                const isPositive = roi >= 0;
                                // HSL color code calculation based on profit scale
                                const hue = isPositive ? 140 : 0;
                                const absRoi = Math.min(30, Math.abs(roi));
                                const saturation = Math.round(30 + absRoi * 2);
                                const lightness = isPositive ? Math.round(20 + absRoi * 0.5) : Math.round(25 + absRoi * 0.5);
                                const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                                const textColor = isPositive ? '#34D399' : '#F87171';

                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => loadOptimizationConfig(cell.config, row.valA, cell.valB)}
                                    style={{ backgroundColor: `${bgColor}20`, borderColor: '#ffffff05' }}
                                    className="p-3.5 text-center border font-mono text-xs font-bold transition hover:scale-105 hover:border-cyan-400 cursor-pointer rounded-lg relative group"
                                  >
                                    <span style={{ color: textColor }}>
                                      {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                    </span>
                                    <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-[9px] p-2 rounded border border-white/10 z-50 whitespace-nowrap shadow-lg">
                                      <p className="font-extrabold text-cyan-400">Trades: {cell.totalTrades}</p>
                                      <p className="font-extrabold text-green-400">Calmar Ratio: {cell.calmar}</p>
                                      <p className="text-slate-400">Click to backtest</p>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* ── Strategy Library Tab ─────────────────────────── */}
        {tab === 'library' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-purple-300">📚 Your Strategy Library</h2>
                <p className="text-xs text-slate-400 mt-1">
                  {savedStrategies.length > 0
                    ? `${savedStrategies.length} saved strategies — click Load to restore any into the Backtester`
                    : 'Save strategies from the Backtester and access them anytime, on any device'}
                </p>
              </div>
              <button
                onClick={() => { setSaveForm({ name: '', description: '', _id: null }); setShowSaveModal(true); setTab('library'); }}
                className="flex items-center gap-2 text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-xl transition"
              >
                💾 Save Current Strategy
              </button>
            </div>

            {libraryLoading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Loading your library...</p>
              </div>
            ) : savedStrategies.length === 0 ? (
              <div className="card text-center py-20 border-dashed border-white/10">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2 text-white">No saved strategies yet</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                  Build a strategy in the Backtester, run a simulation, then click <span className="text-purple-300 font-semibold">💾 Save Strategy</span> to store it permanently in your profile.
                </p>
                <button
                  onClick={() => setTab('backtest')}
                  className="btn-primary inline-flex items-center gap-2"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  🧪 Go to Backtester
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {savedStrategies.map(strat => (
                  <div key={strat._id} className="card hover:border-purple-500/30 transition group relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition">{strat.name}</h3>
                        {strat.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{strat.description}</p>
                        )}
                      </div>
                      {strat.lastResult?.roiPct !== undefined && (
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ml-2 shrink-0 ${
                          strat.lastResult.roiPct >= 0
                            ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                            : 'bg-red-500/15 text-red-400 border border-red-500/25'
                        }`}>
                          {strat.lastResult.roiPct >= 0 ? '+' : ''}{strat.lastResult.roiPct.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Strategy details */}
                    <div className="space-y-1.5 text-[10px] text-slate-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">📈</span>
                        <span className="font-mono text-cyan-400">{strat.symbol?.replace('.NS','')}</span>
                        <span className="text-slate-600">·</span>
                        <span className="truncate">{strat.entryRules?.slice(0,2).join(', ')}{strat.entryRules?.length > 2 ? ` +${strat.entryRules.length-2}` : ''}</span>
                      </div>
                      {strat.lastResult && (
                        <div className="flex gap-3">
                          <span>🎯 Win: <span className="text-white">{strat.lastResult.winRate?.toFixed(0)}%</span></span>
                          <span>📊 Trades: <span className="text-white">{strat.lastResult.totalTrades}</span></span>
                          <span>📉 DD: <span className="text-red-400">{strat.lastResult.maxDrawdownPct?.toFixed(1)}%</span></span>
                        </div>
                      )}
                      <div className="text-slate-600">
                        Saved {new Date(strat.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadStrategy(strat)}
                        className="flex-1 text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/25 hover:border-cyan-400/40 py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        📂 Load Strategy
                      </button>
                      <button
                        onClick={() => {
                          setSaveForm({ name: strat.name, description: strat.description || '', _id: strat._id });
                          setShowSaveModal(true);
                        }}
                        className="text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-400/40 px-3 py-2 rounded-lg transition"
                        title="Update saved strategy"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteStrategy(strat._id, strat.name)}
                        className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-400/40 px-3 py-2 rounded-lg transition"
                        title="Delete strategy"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Strategy Integrity Scanner (KMP) ─────────────────── */}
        {tab === 'integrity' && (
          <div className="space-y-6 animate-fade-in text-slate-100">
            {/* Header Description */}
            <div className="card bg-white/3 border border-white/5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-yellow-400 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm">🛡️</span>
                  Strategy Integrity & Plagiarism Checker
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Inspect your trading strategies for description duplication and pattern duplication using the Knuth-Morris-Pratt (KMP) search algorithm. Runs in linear time <strong className="text-yellow-400">O(N + M)</strong> by pre-computing character shift tables.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Time Complexity</p>
                  <p className="text-sm font-black font-mono">O(N + M)</p>
                </div>
                <div className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Space Complexity</p>
                  <p className="text-sm font-black font-mono">O(M)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Input Fields */}
              <div className="lg:col-span-4 space-y-6">
                <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-yellow-400">
                    📝 Inspection Text
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Description to Scan (Text N)</label>
                      <textarea
                        className="input-dark w-full text-xs font-mono bg-black/40 resize-none h-32 text-slate-200 p-3 rounded-xl border border-white/5"
                        value={kmpText}
                        onChange={e => {
                          setKmpText(e.target.value);
                          setKmpCurrentStep(-1);
                          setKmpIsPlaying(false);
                        }}
                        placeholder="Paste strategy rules or description..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Pattern to Find (Pattern M)</label>
                      <input
                        type="text"
                        className="input-dark w-full text-xs font-mono bg-black/40 text-slate-200 px-3 py-2 rounded-xl border border-white/5"
                        value={kmpPattern}
                        onChange={e => {
                          setKmpPattern(e.target.value);
                          setKmpCurrentStep(-1);
                          setKmpIsPlaying(false);
                        }}
                        placeholder="e.g. RSI drops below 30"
                      />
                    </div>
                  </div>
                </div>

                {/* Pre-Computed LPS Array */}
                <div className="card bg-white/3 border border-white/5 p-5 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-300">
                    📋 Pre-processed LPS Table
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                    The Longest Prefix Suffix (LPS) array maps character patterns to backtrack offsets, skipping redundant character comparisons.
                  </p>
                  
                  {kmpPattern.length > 0 ? (
                    <div className="overflow-x-auto pb-2 pr-1">
                      <table className="min-w-full text-center border-collapse">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="p-1 text-[9px] text-slate-500 font-bold font-mono">Char</th>
                            {kmpPattern.split('').map((char, idx) => (
                              <th key={idx} className="p-1 text-xs font-bold text-slate-300 font-mono min-w-8">
                                {char}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="p-1 text-[9px] text-slate-500 font-bold font-mono">Index</td>
                            {kmpPattern.split('').map((_, idx) => (
                              <td key={idx} className="p-1 text-[10px] text-slate-400 font-mono">
                                {idx}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-1 text-[9px] text-yellow-400 font-black font-mono">LPS</td>
                            {kmpLps.map((val, idx) => (
                              <td key={idx} className="p-1 text-[11px] text-yellow-400 font-black font-mono bg-yellow-500/5 border border-yellow-500/10">
                                {val}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Enter a pattern to see the LPS array.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Search Space & Logs */}
              <div className="lg:col-span-8 space-y-6">
                {/* Visualizer Block */}
                <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                    <span>🔬 KMP Comparison Trace</span>
                    <span className="text-[10px] text-slate-500 font-normal font-sans">(Scroll horizontally to track shifts)</span>
                  </h4>

                  {/* Character Slider Visualizer */}
                  <div className="p-5 bg-slate-950/40 rounded-2xl border border-white/5 space-y-6 overflow-hidden shadow-[inset_0_4px_25px_rgba(0,0,0,0.5)]">
                    {/* Text row */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Text (String N)</span>
                      <div className="flex gap-1 overflow-x-auto py-2 pr-1 select-none font-mono scrollbar-thin">
                        {kmpText.split('').map((char, idx) => {
                          const activeStep = kmpCurrentStep >= 0 ? kmpSteps[kmpCurrentStep] : null;
                          const isCurrentCompare = activeStep && activeStep.i === idx;
                          
                          let cellClass = 'bg-white/3 border-white/5 text-slate-300';
                          if (isCurrentCompare) {
                            if (activeStep.type === 'found') {
                              cellClass = 'bg-green-500/20 border-green-400 text-green-300 font-extrabold scale-105 shadow-[0_0_15px_rgba(34,197,94,0.45)]';
                            } else if (activeStep.match) {
                              cellClass = 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.4)]';
                            } else if (activeStep.type === 'mismatch') {
                              cellClass = 'bg-red-500/20 border-red-500 text-red-400 font-extrabold scale-105 shadow-[0_0_12px_rgba(239,68,68,0.35)]';
                            } else {
                              cellClass = 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(234,179,8,0.35)]';
                            }
                          } else if (activeStep && activeStep.type === 'found' && idx >= activeStep.matchIndex && idx < activeStep.matchIndex + kmpPattern.length) {
                            cellClass = 'bg-green-500/15 border-green-500/30 text-green-400 font-black';
                          }

                          return (
                            <div key={idx} className={`w-8 h-9 shrink-0 flex flex-col items-center justify-center rounded-lg border text-xs transition-all duration-200 ${cellClass}`}>
                              <span className="text-[7px] text-slate-500 font-bold block select-none">{idx}</span>
                              <span className="leading-none mt-0.5">{char === ' ' ? '␣' : char}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pattern row (aligned) */}
                    {kmpPattern.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Pattern (String M)</span>
                        <div className="flex gap-1 overflow-x-auto py-2 pr-1 select-none font-mono relative scrollbar-thin">
                          {/* Left Offset Spacer */}
                          {(() => {
                            const activeStep = kmpCurrentStep >= 0 ? kmpSteps[kmpCurrentStep] : null;
                            const shift = activeStep ? activeStep.i - activeStep.j : 0;
                            return Array.from({ length: Math.max(0, shift) }).map((_, idx) => (
                              <div key={`space-${idx}`} className="w-8 h-9 shrink-0 opacity-0" />
                            ));
                          })()}

                          {kmpPattern.split('').map((char, idx) => {
                            const activeStep = kmpCurrentStep >= 0 ? kmpSteps[kmpCurrentStep] : null;
                            const isCurrentCompare = activeStep && activeStep.j === idx;

                            let cellClass = 'bg-white/3 border-white/5 text-slate-400';
                            if (isCurrentCompare) {
                              if (activeStep.type === 'found') {
                                cellClass = 'bg-green-500/20 border-green-400 text-green-300 font-extrabold scale-105 shadow-[0_0_15px_rgba(34,197,94,0.45)]';
                              } else if (activeStep.match) {
                                cellClass = 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.4)]';
                              } else if (activeStep.type === 'mismatch') {
                                cellClass = 'bg-red-500/20 border-red-500 text-red-400 font-extrabold scale-105 shadow-[0_0_12px_rgba(239,68,68,0.35)]';
                              } else {
                                cellClass = 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(234,179,8,0.35)]';
                              }
                            } else if (activeStep && activeStep.type === 'found') {
                              cellClass = 'bg-green-500/15 border-green-500/30 text-green-400 font-black';
                            }

                            return (
                              <div key={idx} className={`w-8 h-9 shrink-0 flex flex-col items-center justify-center rounded-lg border text-xs transition-all duration-200 ${cellClass}`}>
                                <span className="text-[7px] text-slate-500 font-bold block select-none">{idx}</span>
                                <span className="leading-none mt-0.5">{char === ' ' ? '␣' : char}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => { setKmpCurrentStep(-1); setKmpIsPlaying(false); }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-300 transition"
                        title="Reset Search"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={kmpIsPlaying ? () => setKmpIsPlaying(false) : () => { if (kmpCurrentStep === -1 || kmpCurrentStep === kmpSteps.length - 1) setKmpCurrentStep(0); setKmpIsPlaying(true); }}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-yellow-400" />
                        {kmpIsPlaying ? 'Pause' : 'Trace Search'}
                      </button>
                      <button 
                        onClick={() => {
                          setKmpIsPlaying(false);
                          setKmpCurrentStep(prev => Math.min(kmpSteps.length - 1, prev + 1));
                        }}
                        disabled={kmpCurrentStep >= kmpSteps.length - 1}
                        className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 rounded-lg text-xs font-bold text-slate-300 transition"
                        title="Step Forward"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold">Speed:</span>
                      <select 
                        className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-xs text-yellow-400 font-mono"
                        value={kmpSpeed}
                        onChange={e => setKmpSpeed(Number(e.target.value))}
                      >
                        <option value={1500}>Slow</option>
                        <option value={1000}>Normal</option>
                        <option value={400}>Fast</option>
                      </select>
                    </div>
                  </div>

                  {/* KMP Trace Step Description */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">
                      💬 Step-by-Step KMP Traversal Logs
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px]">
                      {kmpCurrentStep === -1 ? (
                        <div className="text-slate-500 italic">Click "Trace Search" to begin execution of the KMP search.</div>
                      ) : (
                        kmpSteps.slice(0, kmpCurrentStep + 1).map((step, idx) => {
                          let stepColor = 'text-slate-400';
                          if (step.type === 'found') stepColor = 'text-green-400 font-black';
                          else if (step.type === 'mismatch') stepColor = 'text-red-400';
                          else if (step.type === 'jump') stepColor = 'text-purple-400';

                          return (
                            <div 
                              key={idx} 
                              className={`p-1.5 rounded transition ${idx === kmpCurrentStep ? 'bg-yellow-950/20 border-l-2 border-yellow-500 text-yellow-200' : stepColor}`}
                            >
                              {step.desc}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-Strategy Plagiarism Auditor */}
            <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
                <div>
                  <h4 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
                    📚 Saved Strategies Plagiarism Auditor
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Compare the pattern "<strong>{kmpPattern || 'N/A'}</strong>" across all {savedStrategies.length} saved strategies in your library using KMP matching.
                  </p>
                </div>
                <button
                  onClick={runLibraryAudit}
                  disabled={auditingLibrary || savedStrategies.length === 0}
                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-40 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  {auditingLibrary ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      Scanning Library...
                    </>
                  ) : (
                    <>
                      ⚡ Run Library Plagiarism Scan
                    </>
                  )}
                </button>
              </div>

              {savedStrategies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Your strategy library is empty. Save some strategies first to run a plagiarism audit!
                </div>
              ) : libraryAuditResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Click "Run Library Plagiarism Scan" to compare the pattern against your saved strategy library.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Strategy Name</th>
                        <th className="pb-3">Ticker</th>
                        <th className="pb-3">Similarity Index</th>
                        <th className="pb-3">KMP Matches</th>
                        <th className="pb-3 pr-2 text-right">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {libraryAuditResults.map((result) => (
                        <tr key={result.id} className="hover:bg-white/3 transition group">
                          <td className="py-3 pl-2 font-semibold text-slate-200">
                            {result.name}
                          </td>
                          <td className="py-3 font-mono text-cyan-400">
                            {result.symbol.replace('.NS', '')}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-300 w-8">{result.similarityScore}%</span>
                              <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    result.similarityScore > 70 
                                      ? 'bg-red-500' 
                                      : result.similarityScore > 30 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${result.similarityScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-slate-400 font-bold">
                            {result.occurrences} {result.occurrences === 1 ? 'match' : 'matches'}
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${result.verdictColor}`}>
                              {result.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        <SectionGuide sectionId="/trade/strategy" />
      </main>
    
    </div>
  );
};

export default StrategyLab;
