const Backtest = require('../models/Backtest');
const User = require('../models/User');
const marketService = require('../utils/marketService');

// @desc    Get historical chart for backtest setup
// @route   GET /api/backtest/chart?symbol=...&fromDate=...&toDate=...
exports.getBacktestChart = async (req, res) => {
  try {
    const { symbol, fromDate, toDate } = req.query;
    if (!symbol || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    let candles = await marketService.fetchHistoricalData(symbol, fromDate, toDate);
    let isMock = false;
    if (!candles || candles.length === 0) {
      isMock = true;
      console.warn(`Yahoo Finance chart failed for ${symbol}, using mock fallback daily candles.`);
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const dateArray = [];
      let current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          dateArray.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }

      const priceMap = {
        'RELIANCE.NS': 2950, 'TCS.NS': 3850, 'INFY.NS': 1680, 'HDFCBANK.NS': 1540,
        'ICICIBANK.NS': 990, 'SBIN.NS': 740, 'WIPRO.NS': 480, 'TATAMOTORS.NS': 920,
        'HCLTECH.NS': 1450, 'BAJFINANCE.NS': 6500, 'MARUTI.NS': 11500, 'SUNPHARMA.NS': 1540,
        'DRREDDY.NS': 6150, 'NTPC.NS': 340, 'ONGC.NS': 260, 'HINDUNILVR.NS': 2420,
        'ITC.NS': 410, 'KOTAKBANK.NS': 1820, 'ADANIENT.NS': 3100, 'TECHM.NS': 1250,
        'DIVISLAB.NS': 3700, 'CIPLA.NS': 1450, 'M&M.NS': 1890, 'POWERGRID.NS': 275,
        'NESTLEIND.NS': 2510
      };
      
      const cleanSymbol = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
      const basePrice = priceMap[symbol.toUpperCase()] || priceMap[cleanSymbol + '.NS'] || 1000;

      let lastClose = basePrice;
      candles = dateArray.map((dateStr, idx) => {
        const changePercent = (Math.sin(idx / 10) * 0.015) + ((Math.random() - 0.48) * 0.03);
        const close = lastClose * (1 + changePercent);
        const high = Math.max(lastClose, close) * (1 + Math.random() * 0.015);
        const low = Math.min(lastClose, close) * (1 - Math.random() * 0.015);
        const open = lastClose;
        lastClose = close;
        return {
          date: dateStr,
          open,
          high,
          low,
          close,
          volume: Math.floor(500000 + Math.random() * 1500000)
        };
      });
    }

    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const endPrice = prices[prices.length - 1];
    const startPrice = prices[0];
    const periodReturn = ((endPrice - startPrice) / startPrice) * 100;

    res.json({
      success: true,
      isMock,
      candles: candles.map(c => ({
        date: c.date,
        close: parseFloat(c.close.toFixed(2)),
        high: parseFloat(c.high.toFixed(2)),
        low: parseFloat(c.low.toFixed(2)),
        open: parseFloat(c.open.toFixed(2))
      })),
      summary: {
        tradingDays: candles.length,
        endPrice: parseFloat(endPrice.toFixed(2)),
        periodReturn: parseFloat(periodReturn.toFixed(2)),
        high: parseFloat(Math.max(...highs).toFixed(2)),
        low: parseFloat(Math.min(...lows).toFixed(2))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Execute backtest trade and evaluate results
// @route   POST /api/backtest/trade
exports.executeBacktestTrade = async (req, res) => {
  try {
    const { symbol, companyName, quantity, buyDate, resultDate } = req.body;
    if (!symbol || !quantity || !buyDate || !resultDate) {
      return res.status(400).json({ success: false, message: 'Missing trade parameters' });
    }

    // Fetch candles from buyDate to resultDate (journey)
    let candles = await marketService.fetchHistoricalData(symbol, buyDate, resultDate);
    let isMock = false;
    if (!candles || candles.length < 2) {
      isMock = true;
      console.warn(`Yahoo Finance chart failed for trade execution of ${symbol}, using mock fallback journey.`);
      const start = new Date(buyDate);
      const end = new Date(resultDate);
      const dateArray = [];
      let current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          dateArray.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
      
      const priceMap = {
        'RELIANCE.NS': 2950, 'TCS.NS': 3850, 'INFY.NS': 1680, 'HDFCBANK.NS': 1540,
        'ICICIBANK.NS': 990, 'SBIN.NS': 740, 'WIPRO.NS': 480, 'TATAMOTORS.NS': 920,
        'HCLTECH.NS': 1450, 'BAJFINANCE.NS': 6500, 'MARUTI.NS': 11500, 'SUNPHARMA.NS': 1540,
        'DRREDDY.NS': 6150, 'NTPC.NS': 340, 'ONGC.NS': 260, 'HINDUNILVR.NS': 2420,
        'ITC.NS': 410, 'KOTAKBANK.NS': 1820, 'ADANIENT.NS': 3100, 'TECHM.NS': 1250,
        'DIVISLAB.NS': 3700, 'CIPLA.NS': 1450, 'M&M.NS': 1890, 'POWERGRID.NS': 275,
        'NESTLEIND.NS': 2510
      };
      const cleanSymbol = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
      const basePrice = priceMap[symbol.toUpperCase()] || priceMap[cleanSymbol + '.NS'] || 1000;
      
      let lastClose = basePrice;
      candles = dateArray.map((dateStr, idx) => {
        const changePercent = (Math.sin(idx / 8) * 0.02) + ((Math.random() - 0.49) * 0.04);
        const close = lastClose * (1 + changePercent);
        const high = Math.max(lastClose, close) * (1 + Math.random() * 0.015);
        const low = Math.min(lastClose, close) * (1 - Math.random() * 0.015);
        const open = lastClose;
        lastClose = close;
        return {
          date: dateStr,
          open,
          high,
          low,
          close,
          volume: Math.floor(500000 + Math.random() * 1500000)
        };
      });
    }

    const buyPrice = candles[0].close;
    const resultPrice = candles[candles.length - 1].close;

    const totalInvested = quantity * buyPrice;
    const resultValue = quantity * resultPrice;
    const profitLoss = resultValue - totalInvested;
    const profitLossPercent = (profitLoss / totalInvested) * 100;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);

    const maxGain = ((maxPrice - buyPrice) / buyPrice) * 100;
    const maxLoss = ((minPrice - buyPrice) / buyPrice) * 100;

    // Find best and worst days
    let bestDay = candles[0];
    let worstDay = candles[0];
    for (const c of candles) {
      if (c.close > bestDay.close) bestDay = c;
      if (c.close < worstDay.close) worstDay = c;
    }

    // Grading and feedback
    let grade = 'C';
    let message = '';
    if (profitLossPercent >= 20) {
      grade = 'A+';
      message = 'Incredible market timing! You caught a massive upward rally and maximized your gains.';
    } else if (profitLossPercent >= 5) {
      grade = 'A';
      message = 'Great trade! You correctly identified a strong bullish trend and locked in solid returns.';
    } else if (profitLossPercent > 0) {
      grade = 'B';
      message = 'Nice job! You completed a profitable trade. Consistent small wins compound into huge wealth.';
    } else if (profitLossPercent >= -10) {
      grade = 'C';
      message = 'Minor loss. Drawdown is part of trading. Evaluate if a tighter stop loss could protect your cash.';
    } else if (profitLossPercent >= -20) {
      grade = 'D';
      message = 'Significant loss. Did you buy high during peak market panic or FOMO? Review technical indicators.';
    } else {
      grade = 'F';
      message = 'Heavy loss. Position sizing and stop losses are vital to protect capital from extreme downside.';
    }



    res.json({
      success: true,
      isMock,
      result: {
        symbol,
        companyName: companyName || symbol,
        quantity,
        buyPrice: parseFloat(buyPrice.toFixed(2)),
        resultPrice: parseFloat(resultPrice.toFixed(2)),
        buyDate,
        resultDate,
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        isProfit: profitLoss >= 0,
        feedback: { grade, message },
        journey: {
          candles: candles.map(c => ({
            date: c.date,
            close: parseFloat(c.close.toFixed(2)),
            high: parseFloat(c.high.toFixed(2)),
            low: parseFloat(c.low.toFixed(2)),
            open: parseFloat(c.open.toFixed(2))
          })),
          maxGain: parseFloat(maxGain.toFixed(2)),
          maxLoss: parseFloat(maxLoss.toFixed(2)),
          minPrice: parseFloat(minPrice.toFixed(2)),
          maxPrice: parseFloat(maxPrice.toFixed(2)),
          bestDay: { date: bestDay.date, price: parseFloat(bestDay.close.toFixed(2)) },
          worstDay: { date: worstDay.date, price: parseFloat(worstDay.close.toFixed(2)) },
          tradingDays: candles.length
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all backtests for user
// @route   GET /api/backtest/history
exports.getBacktestHistory = async (req, res) => {
  try {
    const history = await Backtest.find({ user: req.user._id }).sort({ timestamp: -1 });

    const totalBacktests = history.length;
    const wins = history.filter(t => t.profitLossPercent > 0);
    const winRate = totalBacktests > 0 ? ((wins.length / totalBacktests) * 100).toFixed(2) : 0;
    const totalPnL = history.reduce((sum, t) => sum + t.profitLoss, 0).toFixed(2);
    const avgReturn = totalBacktests > 0 
      ? (history.reduce((sum, t) => sum + t.profitLossPercent, 0) / totalBacktests).toFixed(2) 
      : 0;

    res.json({
      success: true,
      trades: history,
      stats: {
        totalBacktests,
        winRate,
        totalPnL,
        avgReturn
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Save completed backtest trade and update user wallet
// @route   POST /api/backtest/save
exports.saveBacktestTrade = async (req, res) => {
  try {
    const {
      symbol,
      companyName,
      quantity,
      price,
      resultPrice,
      buyDate,
      resultDate,
      profitLoss,
      profitLossPercent,
      grade,
      finalWalletBalance
    } = req.body;

    if (!symbol || !quantity || price == null || resultPrice == null || !buyDate || !resultDate || profitLoss == null || profitLossPercent == null || !grade) {
      return res.status(400).json({ success: false, message: 'Missing parameters to save backtest' });
    }

    const backtest = new Backtest({
      user: req.user._id,
      symbol,
      companyName: companyName || symbol,
      quantity,
      price,
      resultPrice,
      buyDate,
      resultDate,
      profitLoss,
      profitLossPercent,
      grade
    });

    await backtest.save();

    // Update user's virtual wallet in DB
    const user = await User.findById(req.user._id);
    if (user && finalWalletBalance != null) {
      user.virtualWallet = parseFloat(finalWalletBalance);
      await user.save();
    }

    res.json({
      success: true,
      backtest,
      walletBalance: user ? user.virtualWallet : 100000
    });
  } catch (error) {
    console.error('Error saving backtest:', error);
    res.status(500).json({ success: false, message: 'Server Error saving backtest' });
  }
};

// @desc    Search stock symbols from Yahoo Finance Autocomplete
// @route   GET /api/backtest/search?q=...
exports.searchSymbols = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ success: true, quotes: [] });
    }

    const quotes = await marketService.searchSymbols(q);
    
    const filtered = quotes.map(item => ({
      symbol: item.symbol,
      name: item.longname || item.shortname || item.symbol,
      exchange: item.exchDisp || item.exchange,
      type: item.quoteType
    }));

    res.json({ success: true, quotes: filtered });
  } catch (error) {
    console.error('Symbol search error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to search symbols' });
  }
};
