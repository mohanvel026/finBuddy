const Trade = require('../models/Trade');
const SavedStrategy = require('../models/SavedStrategy');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const marketService = require('../utils/marketService');

// ─── Technical Indicators ───
const calculateSMA = (data, period, key = 'close') => {
  const sma = [];
  let slice = [];

  for (let i = 0; i < data.length; i++) {
    const val = data[i]?.[key];
    if (val === null || val === undefined || isNaN(val)) {
      sma.push(null);
      slice = []; // Reset on gaps
      continue;
    }
    slice.push(val);
    if (slice.length > period) {
      slice.shift();
    }
    if (slice.length < period) {
      sma.push(null);
    } else {
      const sum = slice.reduce((acc, curr) => acc + curr, 0);
      sma.push(sum / period);
    }
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

const calculateMACD = (data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) => {
  const shortEma = calculateEMA(data, shortPeriod);
  const longEma = calculateEMA(data, longPeriod);
  const macdLine = [];
  
  for (let i = 0; i < data.length; i++) {
    if (shortEma[i] === null || longEma[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(shortEma[i] - longEma[i]);
    }
  }

  // Calculate signal line safely
  const macdData = macdLine.map(val => ({ close: val }));
  const signalLine = calculateEMA(macdData, signalPeriod);

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
    if (slice.includes(null) || slice.includes(undefined)) {
      bands.push({ upper: null, lower: null, middle: null });
      continue;
    }
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
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      } else {
        rsi.push(null);
      }
    } else {
      const prevAvgGain = (gains * (period - 1) + (change > 0 ? change : 0)) / period;
      const prevAvgLoss = (losses * (period - 1) + (change < 0 ? -change : 0)) / period;
      gains = prevAvgGain;
      losses = prevAvgLoss;
      const rs = prevAvgLoss === 0 ? 100 : prevAvgGain / prevAvgLoss;
      rsi.push(100 - (100 / (1 + rs)));
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
      const trVal = data[i].high - data[i].low;
      tr.push(trVal);
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
      const sum = validTrSlice.reduce((acc, val) => acc + val, 0);
      atr.push(sum / period);
    } else {
      const prevAtr = atr[i - 1];
      if (prevAtr === null) {
        const sum = validTrSlice.slice(-period).reduce((acc, val) => acc + val, 0);
        atr.push(sum / period);
      } else {
        atr.push((prevAtr * (period - 1) + trueRange) / period);
      }
    }
  }
  return atr;
};

// @desc    Run backtest strategy
// @route   POST /api/strategy/run
// Body: { symbol, entryRule, exitRule }
const runStrategy = async (req, res) => {
  try {
    const { symbol, entryRule, exitRule, entryRules, exitRules, entryLogic = 'OR', exitLogic = 'OR', entryParams = {}, exitParams = {} } = req.body;

    let entryRulesArray = [];
    if (Array.isArray(entryRules)) {
      entryRulesArray = entryRules;
    } else if (typeof entryRules === 'string') {
      entryRulesArray = [entryRules];
    } else if (typeof entryRule === 'string') {
      entryRulesArray = [entryRule];
    }

    let exitRulesArray = [];
    if (Array.isArray(exitRules)) {
      exitRulesArray = exitRules;
    } else if (typeof exitRules === 'string') {
      exitRulesArray = [exitRules];
    } else if (typeof exitRule === 'string') {
      exitRulesArray = [exitRule];
    }

    if (!symbol || entryRulesArray.length === 0 || exitRulesArray.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    // Fetch 1 year of data + 30 days buffer for indicators
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    fromDate.setDate(fromDate.getDate() - 30); // buffer

    const rawData = await marketService.fetchHistoricalData(symbol, fromDate, toDate);
    if (!rawData || rawData.length < 50) {
      return res.status(400).json({ success: false, message: 'Not enough historical data' });
    }

    // Dynamic Parameter Parsing
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

    // Calculate Indicators
    const rsi = calculateRSI(rawData, rsiPeriod);
    const sma = calculateSMA(rawData, smaPeriod);
    const avgVol = calculateSMA(rawData, volPeriod, 'volume');
    const macd = calculateMACD(rawData, macdFast, macdSlow, macdSignal);
    const bb = calculateBollingerBands(rawData, bbPeriod, bbStdDev);
    const atr = calculateATR(rawData, atrPeriod);

    // Combine data
    const data = rawData.map((d, i) => ({
      ...d,
      rsi: rsi[i],
      sma20: sma[i],
      avgVol: avgVol[i],
      macd: macd[i],
      bb: bb[i],
      atr: atr[i]
    }));

    // Start testing after buffer period
    const testData = data.slice(30);

    let trades = [];
    let position = null;
    let initialCapital = 100000;
    let currentCapital = initialCapital;
    const slippagePct = req.body.slippagePct !== undefined ? Number(req.body.slippagePct) : 0.1;
    const brokerFeePct = req.body.brokerFeePct !== undefined ? Number(req.body.brokerFeePct) : 0.05;
    const equityCurve = [];
    const firstPrice = testData[0].close;

    // Simulation Engine
    for (let i = 1; i < testData.length; i++) {
      const today = testData[i];
      const prevDay = testData[i - 1];

      // Ensure indicators exist
      if (today.rsi === null || today.sma20 === null) continue;

      if (!position) {
        // Evaluate Entry Rules
        let buySignal = false;
        const ruleResults = [];

        if (entryRulesArray.includes('RSI_DROP_30')) {
          ruleResults.push(prevDay.rsi >= entryRsiThresh && today.rsi < entryRsiThresh);
        }
        if (entryRulesArray.includes('PRICE_CROSS_ABOVE_20MA')) {
          ruleResults.push(prevDay.close <= prevDay.sma20 && today.close > today.sma20);
        }
        if (entryRulesArray.includes('MACD_CROSSOVER')) {
          ruleResults.push(prevDay.macd.histogram <= 0 && today.macd.histogram > 0);
        }
        if (entryRulesArray.includes('BB_BOUNCE_LOWER')) {
          ruleResults.push(prevDay.close <= prevDay.bb.lower && today.close > today.bb.lower);
        }
        if (entryRulesArray.includes('3_RED_DAYS')) {
          let redDays = 0;
          for (let j = 0; j < entryConsecutiveDays; j++) {
            const day = testData[i - j];
            if (day && day.close < day.open) redDays++;
            else break;
          }
          ruleResults.push(redDays === entryConsecutiveDays);
        }
        if (entryRulesArray.includes('PRICE_DROP_5PCT_WEEK') && i >= entryDropLookback) {
          const pastDay = testData[i - entryDropLookback];
          ruleResults.push(pastDay && ((pastDay.close - today.close) / pastDay.close) > (entryDropPercent / 100));
        }
        if (entryRulesArray.includes('VOLUME_SPIKE_2X')) {
          ruleResults.push(today.avgVol && today.volume > today.avgVol * entryVolMultiplier);
        }

        if (ruleResults.length > 0) {
          if (entryLogic === 'AND') {
            buySignal = ruleResults.every(r => r === true);
          } else {
            buySignal = ruleResults.some(r => r === true);
          }
        }

        if (buySignal) {
          // Calculate realistic execution price (slippage + fee)
          const executionPrice = today.close * (1 + (slippagePct / 100));
          const shares = currentCapital / executionPrice;
          const fee = currentCapital * (brokerFeePct / 100);
          
          position = {
            buyPrice: executionPrice,
            shares: shares,
            feePaid: fee,
            buyDate: today.date,
            buyIndex: i,
            maxPriceSeen: executionPrice,
            atrAtBuy: today.atr
          };
          currentCapital -= fee;
        }
      } else {
        // Evaluate Exit Rules
        let sellSignal = false;
        let profitPct = ((today.close - position.buyPrice) / position.buyPrice) * 100;
        let daysHeld = i - position.buyIndex;

        // Track highest close price seen during the trade for trailing stop loss
        if (today.close > position.maxPriceSeen) {
          position.maxPriceSeen = today.close;
        }

        const exitRuleResults = [];

        if (exitRulesArray.includes('RSI_ABOVE_70')) {
          exitRuleResults.push(today.rsi > exitRsiThresh);
        }
        if (exitRulesArray.includes('PRICE_CROSS_BELOW_20MA')) {
          exitRuleResults.push(prevDay.close >= prevDay.sma20 && today.close < today.sma20);
        }
        if (exitRulesArray.includes('MACD_CROSSUNDER')) {
          exitRuleResults.push(prevDay.macd.histogram >= 0 && today.macd.histogram < 0);
        }
        if (exitRulesArray.includes('BB_TOUCH_UPPER')) {
          exitRuleResults.push(today.close >= today.bb.upper);
        }
        if (exitRulesArray.includes('TRAILING_STOP_3_ATR') && position.atrAtBuy) {
          exitRuleResults.push(today.close <= (position.maxPriceSeen - (exitAtrMultiplier * position.atrAtBuy)));
        }
        if (exitRulesArray.includes('PROFIT_10PCT_LOSS_5PCT')) {
          exitRuleResults.push(profitPct >= exitProfitTarget || profitPct <= -exitStopLoss);
        }
        if (exitRulesArray.includes('HOLD_5_DAYS')) {
          exitRuleResults.push(daysHeld >= exitHoldDays);
        }

        if (exitRuleResults.length > 0) {
          if (exitLogic === 'AND') {
            sellSignal = exitRuleResults.every(r => r === true);
          } else {
            sellSignal = exitRuleResults.some(r => r === true);
          }
        }
        
        // Force close on last day
        if (i === testData.length - 1) sellSignal = true;

        if (sellSignal) {
          // Calculate realistic execution price
          const executionPrice = today.close * (1 - (slippagePct / 100));
          const grossValue = position.shares * executionPrice;
          const fee = grossValue * (brokerFeePct / 100);
          const netValue = grossValue - fee;
          
          const invested = position.shares * position.buyPrice;
          const tradeProfit = netValue - invested - position.feePaid;
          const netProfitPct = (tradeProfit / invested) * 100;
          
          trades.push({
            buyDate: position.buyDate,
            sellDate: today.date,
            buyPrice: position.buyPrice,
            sellPrice: executionPrice,
            profitPct: netProfitPct,
            profitAbs: tradeProfit,
            daysHeld: daysHeld
          });
          currentCapital = netValue;
          position = null;
        }
      }

      // Reconstruct daily portfolio equity for plotting comparison
      let dailyEquity = currentCapital;
      if (position) {
        dailyEquity = position.shares * today.close;
      }
      const strategyRet = ((dailyEquity - initialCapital) / initialCapital) * 100;
      const benchmarkRet = ((today.close - firstPrice) / firstPrice) * 100;
      
      equityCurve.push({
        date: today.date,
        close: parseFloat(today.close.toFixed(2)),
        strategyReturn: parseFloat(strategyRet.toFixed(2)),
        benchmarkReturn: parseFloat(benchmarkRet.toFixed(2))
      });
    }

    // Analytics Calculation
    const wins = trades.filter(t => t.profitPct > 0);
    const losses = trades.filter(t => t.profitPct <= 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    
    // Profit Factor & Averages
    const grossProfit = wins.reduce((sum, t) => sum + t.profitAbs, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitAbs, 0));
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 100 : 0) : (grossProfit / grossLoss);
    
    const avgWin = wins.length > 0 ? (grossProfit / wins.length) : 0;
    const avgLoss = losses.length > 0 ? (grossLoss / losses.length) : 0;
    
    // Streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    for (const t of trades) {
      if (t.profitAbs > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    }

    // Sharpe and Sortino Ratios (based on trade percentage returns)
    let sharpeRatio = 0;
    let sortinoRatio = 0;
    if (trades.length > 1) {
      const returns = trades.map(t => t.profitPct / 100);
      const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
      
      const variance = returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / (returns.length - 1);
      const stdDev = Math.sqrt(variance);

      const negativeReturns = returns.filter(r => r < 0);
      const downsideVariance = negativeReturns.reduce((acc, val) => acc + Math.pow(val, 2), 0) / (returns.length - 1);
      const downsideStdDev = Math.sqrt(downsideVariance);

      // Annualized assuming ~252 trading days and average hold duration
      const avgHoldDays = trades.reduce((acc, val) => acc + val.daysHeld, 0) / trades.length;
      const tradesPerYear = avgHoldDays > 0 ? 252 / avgHoldDays : 252;
      
      const riskFreeRateAnnual = 0.05; // 5% risk free rate
      const riskFreeRatePerTrade = riskFreeRateAnnual / tradesPerYear;

      sharpeRatio = stdDev > 0 ? (meanReturn - riskFreeRatePerTrade) / stdDev : 0;
      sortinoRatio = downsideStdDev > 0 ? (meanReturn - riskFreeRatePerTrade) / downsideStdDev : 0;

      // Annualize ratios
      sharpeRatio = sharpeRatio * Math.sqrt(tradesPerYear);
      sortinoRatio = sortinoRatio * Math.sqrt(tradesPerYear);
    }
    
    // Max Drawdown calculation
    let maxDrawdown = 0;
    let peak = initialCapital;
    let cap = initialCapital;
    for(let t of trades) {
        cap += t.profitAbs;
        if(cap > peak) peak = cap;
        let dd = peak - cap;
        if(dd > maxDrawdown) maxDrawdown = dd;
    }

    // Buy and Hold Benchmark
    const lastPrice = testData[testData.length - 1].close;
    const buyAndHoldReturn = ((lastPrice - firstPrice) / firstPrice) * 100;

    const roiPctVal = ((currentCapital - initialCapital) / initialCapital) * 100;
    const maxDrawdownPct = (maxDrawdown / initialCapital) * 100;
    const calmarRatio = maxDrawdownPct > 0 ? (roiPctVal / maxDrawdownPct) : (roiPctVal > 0 ? 100 : 0);

    let bestTrade = trades.length > 0 ? trades.reduce((prev, current) => (prev.profitPct > current.profitPct) ? prev : current) : null;
    let worstTrade = trades.length > 0 ? trades.reduce((prev, current) => (prev.profitPct < current.profitPct) ? prev : current) : null;

    res.json({
      success: true,
      stats: {
        totalTrades: trades.length,
        winRate: winRate.toFixed(2),
        wins: wins.length,
        losses: losses.length,
        netProfit: (currentCapital - initialCapital).toFixed(2),
        roiPct: roiPctVal.toFixed(2),
        buyAndHoldPct: buyAndHoldReturn.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        maxWinStreak,
        maxLossStreak,
        sharpeRatio: sharpeRatio.toFixed(2),
        sortinoRatio: sortinoRatio.toFixed(2),
        calmarRatio: calmarRatio.toFixed(2),
        maxDrawdownPct: maxDrawdownPct.toFixed(2),
        maxDrawdown: maxDrawdown.toFixed(2),
        bestTrade: bestTrade ? bestTrade.profitAbs.toFixed(2) : 0,
        worstTrade: worstTrade ? worstTrade.profitAbs.toFixed(2) : 0,
      },
      trades: trades,
      chartData: equityCurve
    });

  } catch (error) {
    console.error('Strategy run error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── Strategy Library CRUD ───────────────────────────────────

// @desc  Get all saved strategies for the current user
// @route GET /api/strategy/library
const getSavedStrategies = async (req, res) => {
  try {
    const strategies = await SavedStrategy.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, strategies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Save (create or update) a strategy
// @route POST /api/strategy/library
const saveStrategy = async (req, res) => {
  try {
    const {
      _id, name, description, symbol, companyName,
      entryRules, exitRules, entryLogic, exitLogic,
      entryParams, exitParams, slippagePct, brokerFeePct,
      lastResult
    } = req.body;

    if (!name || !symbol || !entryRules?.length || !exitRules?.length) {
      return res.status(400).json({ success: false, message: 'Name, symbol, entry and exit rules are required' });
    }

    let strategy;
    if (_id) {
      // Update existing
      strategy = await SavedStrategy.findOneAndUpdate(
        { _id, user: req.user._id },
        { name, description, symbol, companyName, entryRules, exitRules, entryLogic, exitLogic, entryParams, exitParams, slippagePct, brokerFeePct, lastResult },
        { new: true }
      );
      if (!strategy) return res.status(404).json({ success: false, message: 'Strategy not found' });
    } else {
      strategy = await SavedStrategy.create({
        user: req.user._id, name, description, symbol, companyName,
        entryRules, exitRules, entryLogic, exitLogic,
        entryParams, exitParams, slippagePct, brokerFeePct, lastResult
      });
    }

    res.json({ success: true, strategy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a saved strategy
// @route DELETE /api/strategy/library/:id
const deleteStrategy = async (req, res) => {
  try {
    const strategy = await SavedStrategy.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!strategy) return res.status(404).json({ success: false, message: 'Strategy not found' });
    res.json({ success: true, message: 'Strategy deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SplitSmart Real Analytics ────────────────────────────────

// @desc  Get real expense analytics for current user (from DB)
// @route GET /api/expenses/analytics
const getExpenseAnalytics = async (req, res) => {
  try {
    // Find all groups the user belongs to
    const groups = await Group.find({ 'members.user': req.user._id }).select('_id type');
    const groupIds = groups.map(g => g._id);

    if (!groupIds.length) {
      return res.json({ success: true, categoryBreakdown: [], monthlyTrend: [], summary: { totalSpend: 0, totalGroups: 0, pendingOwed: 0 } });
    }

    // Category breakdown (last 12 months)
    const categoryAgg = await Expense.aggregate([
      {
        $match: {
          group: { $in: groupIds },
          date: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const CATEGORY_META = {
      food:          { name: '🍕 Food', color: '#a855f7' },
      transport:     { name: '🚗 Transport', color: '#3b82f6' },
      accommodation: { name: '🏨 Accommodation', color: '#6366f1' },
      shopping:      { name: '🛍️ Shopping', color: '#14b8a6' },
      entertainment: { name: '🎬 Entertainment', color: '#f59e0b' },
      utilities:     { name: '⚡ Utilities', color: '#10b981' },
      other:         { name: '📦 Other', color: '#6b7280' },
    };

    const categoryBreakdown = categoryAgg.map(c => ({
      name: CATEGORY_META[c._id]?.name || c._id,
      value: Math.round(c.total),
      count: c.count,
      color: CATEGORY_META[c._id]?.color || '#6b7280'
    }));

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAgg = await Expense.aggregate([
      {
        $match: {
          group: { $in: groupIds },
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          spend: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyAgg.map(m => ({
      month: MONTH_NAMES[m._id.month - 1],
      spend: Math.round(m.spend),
      count: m.count
    }));

    // Outstanding balance for the user
    const allExpenses = await Expense.find({
      group: { $in: groupIds },
      'splits.user': req.user._id
    }).select('splits amount paidBy');

    let totalOwed = 0;
    let totalOwe = 0;
    for (const exp of allExpenses) {
      const split = exp.splits.find(s => s.user?.toString() === req.user._id.toString());
      if (!split) continue;
      if (exp.paidBy?.toString() === req.user._id.toString()) {
        // Others owe me
        const othersShare = exp.splits
          .filter(s => s.user?.toString() !== req.user._id.toString() && !s.isPaid)
          .reduce((sum, s) => sum + (s.amount || 0), 0);
        totalOwed += othersShare;
      } else if (!split.isPaid) {
        totalOwe += split.amount || 0;
      }
    }

    const totalSpend = categoryBreakdown.reduce((s, c) => s + c.value, 0);

    res.json({
      success: true,
      categoryBreakdown,
      monthlyTrend,
      summary: {
        totalSpend,
        totalGroups: groups.length,
        pendingOwed: Math.round(totalOwed),
        pendingOwe: Math.round(totalOwe),
        netBalance: Math.round(totalOwed - totalOwe)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  runStrategy,
  getSavedStrategies,
  saveStrategy,
  deleteStrategy,
  getExpenseAnalytics
};
