const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const LimitOrder = require('../models/LimitOrder');
const ShortPosition = require('../models/ShortPosition');
const { awardBadge } = require('../algorithms/finScore');
const { blackScholes, generatePayoffDiagram } = require('../algorithms/blackScholes');
const { getIO } = require('../sockets');
const axios = require('axios');
const { getAICompletion } = require('../utils/aiService');
const Razorpay = require('razorpay');
const marketService = require('../utils/marketService');
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️ Razorpay payment gateway credentials missing. Real payments will be simulated.');
}

// @desc    Buy stock/asset
// @route   POST /api/trades/buy
const buyStock = async (req, res) => {
  try {
    const { symbol, companyName, quantity, assetType = 'stock', reasoning, stopLossPrice, targetPrice } = req.body;

    // Get live price
    const price = await marketService.getLivePrice(symbol);
    if (!price) return res.status(400).json({ success: false, message: 'Could not fetch live price' });

    const totalAmount = price * parseInt(quantity);

    // Check wallet balance
    const user = await User.findById(req.user._id);
    if (user.virtualWallet < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Need ₹${totalAmount.toFixed(2)}, have ₹${user.virtualWallet.toFixed(2)}`
      });
    }

    // Deduct from wallet
    const walletBefore = user.virtualWallet;
    user.virtualWallet -= totalAmount;
    await user.save();

    let trade;
    try {
      // Create trade record
      trade = await Trade.create({
        user: req.user._id,
        symbol,
        companyName,
        tradeType: 'BUY',
        assetType,
        quantity: parseInt(quantity),
        price,
        totalAmount,
        walletBefore,
        walletAfter: user.virtualWallet,
        reasoning
      });
    } catch (tradeErr) {
      // Rollback wallet save
      user.virtualWallet = walletBefore;
      await user.save();
      throw new Error(`Trade record creation failed: ${tradeErr.message}`);
    }

    try {
      // Update portfolio
      let portfolio = await Portfolio.findOne({ user: req.user._id });
      if (!portfolio) {
        portfolio = new Portfolio({ user: req.user._id });
      }

      const existingIdx = portfolio.holdings.findIndex(h => h.symbol === symbol);
      if (existingIdx >= 0) {
        const existing = portfolio.holdings[existingIdx];
        const newQty = existing.quantity + parseInt(quantity);
        const newAvg = ((existing.avgBuyPrice * existing.quantity) + totalAmount) / newQty;
        portfolio.holdings[existingIdx].quantity = newQty;
        portfolio.holdings[existingIdx].avgBuyPrice = Math.round(newAvg * 100) / 100;
        portfolio.holdings[existingIdx].totalInvested += totalAmount;
        portfolio.holdings[existingIdx].currentPrice = price;
        portfolio.holdings[existingIdx].currentValue = newQty * price;
        portfolio.holdings[existingIdx].companyName = companyName;
        if (stopLossPrice !== undefined) portfolio.holdings[existingIdx].stopLossPrice = stopLossPrice;
        if (targetPrice !== undefined) portfolio.holdings[existingIdx].targetPrice = targetPrice;
      } else {
        portfolio.holdings.push({
          symbol,
          companyName,
          quantity: parseInt(quantity),
          avgBuyPrice: price,
          currentPrice: price,
          totalInvested: totalAmount,
          currentValue: totalAmount,
          profitLoss: 0,
          stopLossPrice: stopLossPrice || null,
          targetPrice: targetPrice || null
        });
      }

      portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.totalInvested, 0);
      portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + h.currentValue, 0);
      portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
      portfolio.lastUpdated = new Date();
      await portfolio.save();
    } catch (portfolioErr) {
      // Rollback trade creation & wallet save
      if (trade) await Trade.findByIdAndDelete(trade._id);
      user.virtualWallet = walletBefore;
      await user.save();
      throw new Error(`Portfolio update failed: ${portfolioErr.message}`);
    }

    // Award first trade badge
    try {
      const tradeCount = await Trade.countDocuments({ user: req.user._id, tradeType: 'BUY' });
      if (tradeCount === 1) await awardBadge(req.user._id, 'First Trade', '📈');
    } catch (badgeErr) {
      console.warn('Failed to award badge:', badgeErr.message);
    }

    res.json({
      success: true,
      trade,
      walletBalance: user.virtualWallet,
      message: `Bought ${quantity} shares of ${symbol} at ₹${price}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Sell stock
// @route   POST /api/trades/sell
const sellStock = async (req, res) => {
  try {
    const { symbol, quantity, reasoning } = req.body;

    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(400).json({ success: false, message: 'No portfolio found' });

    const holdingIdx = portfolio.holdings.findIndex(h => h.symbol === symbol);
    if (holdingIdx === -1) return res.status(400).json({ success: false, message: 'You do not own this stock' });

    const holding = portfolio.holdings[holdingIdx];
    const sellQty = parseInt(quantity);

    if (holding.quantity < sellQty) {
      return res.status(400).json({ success: false, message: `You only have ${holding.quantity} shares` });
    }

    // Get live price
    const price = await marketService.getLivePrice(symbol);
    if (!price) return res.status(400).json({ success: false, message: 'Could not fetch live price' });

    const totalAmount = price * sellQty;
    const costBasis = holding.avgBuyPrice * sellQty;
    const profitLoss = totalAmount - costBasis;
    const profitLossPercent = ((profitLoss / costBasis) * 100);

    // Update wallet
    const user = await User.findById(req.user._id);
    const walletBefore = user.virtualWallet;
    user.virtualWallet += totalAmount;
    await user.save();

    let trade;
    try {
      // Create trade record
      trade = await Trade.create({
        user: req.user._id,
        symbol,
        companyName: holding.companyName,
        tradeType: 'SELL',
        quantity: sellQty,
        price,
        totalAmount,
        walletBefore,
        walletAfter: user.virtualWallet,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
        reasoning
      });
    } catch (tradeErr) {
      // Rollback wallet save
      user.virtualWallet = walletBefore;
      await user.save();
      throw new Error(`Trade record creation failed: ${tradeErr.message}`);
    }

    try {
      // Update portfolio
      if (holding.quantity === sellQty) {
        portfolio.holdings.splice(holdingIdx, 1);
      } else {
        portfolio.holdings[holdingIdx].quantity -= sellQty;
        portfolio.holdings[holdingIdx].totalInvested -= costBasis;
        portfolio.holdings[holdingIdx].currentValue = portfolio.holdings[holdingIdx].quantity * price;
      }

      portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.totalInvested, 0);
      portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + h.currentValue, 0);
      portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
      await portfolio.save();
    } catch (portfolioErr) {
      // Rollback trade creation & wallet save
      if (trade) await Trade.findByIdAndDelete(trade._id);
      user.virtualWallet = walletBefore;
      await user.save();
      throw new Error(`Portfolio update failed: ${portfolioErr.message}`);
    }

    res.json({
      success: true,
      trade,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      walletBalance: user.virtualWallet,
      message: `Sold ${sellQty} shares of ${symbol} at ₹${price}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get portfolio
// @route   GET /api/trades/portfolio
const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = { holdings: [], mutualFunds: [], crypto: [], totalInvested: 0, currentValue: 0, totalProfitLoss: 0 };
    }

    const user = await User.findById(req.user._id).select('virtualWallet finScore');

    // Update live prices
    if (portfolio.holdings?.length > 0) {
      try {
        const symbols = portfolio.holdings.map(h => h.symbol);
        const quotes = await marketService.getMultipleLiveQuotes(symbols);

        quotes.forEach(q => {
          const idx = portfolio.holdings.findIndex(h => h.symbol === q.symbol || h.symbol === q.yahooSymbol);
          if (idx >= 0 && portfolio.holdings[idx]) {
            portfolio.holdings[idx].currentPrice = q.price;
            portfolio.holdings[idx].currentValue = q.price * portfolio.holdings[idx].quantity;
            portfolio.holdings[idx].profitLoss = portfolio.holdings[idx].currentValue - portfolio.holdings[idx].totalInvested;
            portfolio.holdings[idx].profitLossPercent = ((portfolio.holdings[idx].profitLoss / portfolio.holdings[idx].totalInvested) * 100);
            portfolio.holdings[idx].dayChange = q.changePercent;
          }
        });

        if (portfolio.save) {
          portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
          portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
          await portfolio.save();
        }
      } catch (e) { /* use cached prices */ }
    }

    res.json({
      success: true,
      portfolio,
      walletBalance: user.virtualWallet,
      totalNetWorth: user.virtualWallet + (portfolio.currentValue || 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trade history
// @route   GET /api/trades/history
const getTradeHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, assetType, symbol } = req.query;
    const query = { user: req.user._id };
    if (assetType) query.assetType = assetType;
    if (symbol) query.symbol = symbol;

    const total = await Trade.countDocuments(query);
    const trades = await Trade.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Stats
    const sells = trades.filter(t => t.tradeType === 'SELL');
    const totalPnL = sells.reduce((s, t) => s + t.profitLoss, 0);
    const winTrades = sells.filter(t => t.profitLoss > 0).length;
    const winRate = sells.length > 0 ? Math.round((winTrades / sells.length) * 100) : 0;

    res.json({
      success: true,
      trades,
      stats: { totalPnL, winRate, totalTrades: total, sellCount: sells.length },
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get paper trading journal
// @route   GET /api/trades/journal
const getTradingJournal = async (req, res) => {
  try {
    const trades = await Trade.find({
      user: req.user._id,
      reasoning: { $exists: true, $ne: '' }
    }).sort({ timestamp: -1 }).limit(50);

    res.json({ success: true, trades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add reasoning + get AI review for a trade
// @route   PUT /api/trades/:id/reasoning
const addReasoning = async (req, res) => {
  try {
    const { reasoning } = req.body;
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { reasoning },
      { new: true }
    );
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });

    // Get AI review
    try {
      const messages = [{
        role: 'system',
        content: 'You are a financial trading coach. Review trade decisions briefly and give a score 1-10. Be encouraging but honest. Max 3 sentences.'
      }, {
        role: 'user',
        content: `Trade: ${trade.tradeType} ${trade.quantity} shares of ${trade.symbol} at ₹${trade.price}.
        Reasoning: "${reasoning}"
        Result: ${trade.profitLoss > 0 ? `+₹${trade.profitLoss}` : trade.profitLoss < 0 ? `-₹${Math.abs(trade.profitLoss)}` : 'Still open'}
        Give a score /10 and brief feedback.`
      }];

      const review = await getAICompletion(messages, 300);
      const scoreMatch = review.match(/(\d+)\/10|(\d+) out of 10/i);
      const aiScore = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 5;

      trade.aiReview = review;
      trade.aiScore = aiScore;
      trade.aiReviewedAt = new Date();
      await trade.save();
    } catch (e) { /* AI optional */ }

    res.json({ success: true, trade });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get/manage watchlist
// @route   GET /api/trades/watchlist
const getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.json({ success: true, stocks: [] });

    // Fetch live prices for watchlist
    if (watchlist.stocks.length > 0) {
      try {
        const symbols = watchlist.stocks.map(s => s.symbol);
        const quotes = await marketService.getMultipleLiveQuotes(symbols);

        const enriched = watchlist.stocks.map(stock => {
          const quote = quotes.find(q => q.symbol === stock.symbol || q.yahooSymbol === stock.symbol);
          return {
            ...stock.toObject(),
            currentPrice: quote?.price,
            change: quote?.change,
            changePercent: quote?.changePercent,
            isUp: (quote?.change || 0) >= 0
          };
        });
        return res.json({ success: true, stocks: enriched });
      } catch (e) { }
    }

    res.json({ success: true, stocks: watchlist.stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add to watchlist
// @route   POST /api/trades/watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { symbol, companyName, notes } = req.body;

    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) watchlist = new Watchlist({ user: req.user._id, stocks: [] });

    const exists = watchlist.stocks.some(s => s.symbol === symbol);
    if (exists) return res.status(400).json({ success: false, message: 'Already in watchlist' });

    watchlist.stocks.push({ symbol, companyName, notes });
    await watchlist.save();

    res.json({ success: true, message: `${symbol} added to watchlist` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/trades/watchlist/:symbol
const removeFromWatchlist = async (req, res) => {
  try {
    await Watchlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { stocks: { symbol: req.params.symbol } } }
    );
    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set price alert
// @route   POST /api/trades/alert
const setPriceAlert = async (req, res) => {
  try {
    const { symbol, type, price } = req.body;

    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) return res.status(404).json({ success: false, message: 'Add stock to watchlist first' });

    const stockIdx = watchlist.stocks.findIndex(s => s.symbol === symbol);
    if (stockIdx === -1) return res.status(404).json({ success: false, message: 'Stock not in watchlist' });

    watchlist.stocks[stockIdx].alerts.push({ type, price, isTriggered: false });
    await watchlist.save();

    res.json({ success: true, message: `Alert set: notify when ${symbol} goes ${type} ₹${price}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set stop loss & target for a portfolio holding
// @route   PUT /api/trades/holdings/:symbol/limits
const setStopLossTarget = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { stopLossPrice, targetPrice } = req.body;

    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const holdingIdx = portfolio.holdings.findIndex(h => h.symbol === symbol);
    if (holdingIdx === -1) return res.status(404).json({ success: false, message: 'Holding not found in portfolio' });

    portfolio.holdings[holdingIdx].stopLossPrice = (stopLossPrice !== undefined && stopLossPrice !== null && stopLossPrice !== '') ? parseFloat(stopLossPrice) : null;
    portfolio.holdings[holdingIdx].targetPrice = (targetPrice !== undefined && targetPrice !== null && targetPrice !== '') ? parseFloat(targetPrice) : null;
    portfolio.lastUpdated = new Date();

    await portfolio.save();

    res.json({
      success: true,
      message: `Stop-Loss and Target updated for ${symbol}`,
      holding: portfolio.holdings[holdingIdx]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Black-Scholes options price calculator
// @route   POST /api/trades/options-price
const calculateOptionsPrice = async (req, res) => {
  try {
    const { stockPrice, strikePrice, daysToExpiry, volatility, optionType } = req.body;

    const T = parseFloat(daysToExpiry) / 365;
    const sigma = parseFloat(volatility) / 100;

    const result = blackScholes(
      parseFloat(stockPrice),
      parseFloat(strikePrice),
      T,
      0.065, // RBI repo rate
      sigma,
      optionType
    );

    const payoffDiagram = generatePayoffDiagram(
      parseFloat(strikePrice),
      result.price,
      optionType
    );

    res.json({ success: true, result, payoffDiagram });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Invest in mutual fund (SIP or Lumpsum, supporting virtual capital or sandbox Razorpay)
// @route   POST /api/trades/buy-mutual-fund
const buyMutualFund = async (req, res) => {
  try {
    const { schemeCode, schemeName, amount, investmentType, nav, paymentId } = req.body;

    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    const price = parseFloat(nav);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid Net Asset Value (NAV)' });
    }

    const quantity = totalAmount / price;

    // Create trade record
    const trade = await Trade.create({
      user: req.user._id,
      symbol: schemeCode,
      companyName: schemeName,
      tradeType: 'BUY',
      assetType: 'mutual_fund',
      quantity,
      price,
      totalAmount,
      reasoning: `Invested in ${schemeName} via ${investmentType} payment mode.`
    });

    // Update portfolio holdings
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new Portfolio({ user: req.user._id });
    }

    const existingIdx = portfolio.holdings.findIndex(h => h.symbol === schemeCode);
    if (existingIdx >= 0) {
      const existing = portfolio.holdings[existingIdx];
      const newQty = existing.quantity + quantity;
      const newAvg = ((existing.avgBuyPrice * existing.quantity) + totalAmount) / newQty;
      portfolio.holdings[existingIdx].quantity = newQty;
      portfolio.holdings[existingIdx].avgBuyPrice = Math.round(newAvg * 100) / 100;
      portfolio.holdings[existingIdx].totalInvested += totalAmount;
      portfolio.holdings[existingIdx].currentPrice = price;
      portfolio.holdings[existingIdx].currentValue = newQty * price;
    } else {
      portfolio.holdings.push({
        symbol: schemeCode,
        companyName: schemeName,
        quantity,
        avgBuyPrice: price,
        currentPrice: price,
        totalInvested: totalAmount,
        currentValue: totalAmount,
        profitLoss: 0
      });
    }

    await portfolio.save();

    // Deduct from virtual wallet if not paid with Razorpay
    if (!paymentId) {
      const user = await User.findById(req.user._id);
      if (user.virtualWallet >= totalAmount) {
        user.virtualWallet -= totalAmount;
        await user.save();
      }
    }

    // Award badge
    await awardBadge(req.user._id, {
      name: 'Mutual Fund Guru 📈',
      icon: '🏆',
      description: 'Completed your first dynamic mutual fund investment.'
    });

    res.status(201).json({
      success: true,
      message: `Successfully invested ₹${totalAmount.toLocaleString('en-IN')} in ${schemeName}!`,
      trade
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay order
// @route   POST /api/trades/razorpay/order
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!razorpay) {
      // Safe fallback sandbox order when keys are omitted
      return res.json({
        success: true,
        order: {
          id: `order_mock_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency: 'INR',
          status: 'created'
        },
        key: 'rzp_test_mockkey123',
        isMock: true
      });
    }
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `fb_${Date.now()}`,
    });
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/trades/razorpay/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;
    if (isMock || !razorpay) {
      return res.json({ success: true, paymentId: razorpay_payment_id || `pay_mock_${Date.now()}` });
    }
    const crypto = require('crypto');
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get limit orders
// @route   GET /api/trades/limit-orders
const getLimitOrders = async (req, res) => {
  try {
    const orders = await LimitOrder.find({ user: req.user._id, status: 'PENDING' }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Place a limit order
// @route   POST /api/trades/limit-orders
const placeLimitOrder = async (req, res) => {
  try {
    const { symbol, companyName, tradeType, quantity, limitPrice, reasoning } = req.body;
    const order = await LimitOrder.create({
      user: req.user._id,
      symbol,
      companyName,
      tradeType,
      quantity: parseInt(quantity),
      limitPrice: parseFloat(limitPrice),
      reasoning
    });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a limit order
// @route   DELETE /api/trades/limit-orders/:id
const cancelLimitOrder = async (req, res) => {
  try {
    const order = await LimitOrder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'PENDING' },
      { status: 'CANCELLED' },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Pending limit order not found' });
    res.json({ success: true, message: 'Limit order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get short positions
// @route   GET /api/trades/short-positions
const getShortPositions = async (req, res) => {
  try {
    const positions = await ShortPosition.find({ user: req.user._id, status: 'OPEN' }).sort({ createdAt: -1 });
    res.json({ success: true, positions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Open a short position
// @route   POST /api/trades/short-positions
const openShortPosition = async (req, res) => {
  try {
    const { symbol, companyName, quantity, entryPrice, reasoning } = req.body;
    const qty = parseInt(quantity);
    const price = parseFloat(entryPrice);
    const shortValue = price * qty;

    const user = await User.findById(req.user._id);
    if (user.virtualWallet < shortValue) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds for short margin. Need ₹${shortValue.toLocaleString('en-IN')}`
      });
    }

    user.virtualWallet -= shortValue;
    await user.save();

    const position = await ShortPosition.create({
      user: req.user._id,
      symbol,
      companyName,
      quantity: qty,
      entryPrice: price,
      reasoning
    });

    // Create a trade record for trade history
    await Trade.create({
      user: req.user._id,
      symbol,
      companyName,
      tradeType: 'SHORT',
      quantity: qty,
      price,
      totalAmount: shortValue,
      walletBefore: user.virtualWallet + shortValue,
      walletAfter: user.virtualWallet,
      reasoning
    });

    res.json({ success: true, position, walletBalance: user.virtualWallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cover a short position
// @route   POST /api/trades/short-positions/:id/cover
const coverShortPosition = async (req, res) => {
  try {
    const { exitPrice } = req.body;
    const position = await ShortPosition.findOne({ _id: req.params.id, user: req.user._id, status: 'OPEN' });
    if (!position) return res.status(404).json({ success: false, message: 'Open short position not found' });

    const price = parseFloat(exitPrice);
    const costToCover = price * position.quantity;
    const initialMargin = position.entryPrice * position.quantity;
    const pnl = initialMargin - costToCover;

    const user = await User.findById(req.user._id);
    const walletBefore = user.virtualWallet;
    user.virtualWallet += (initialMargin + pnl);
    await user.save();

    position.status = 'CLOSED';
    position.exitPrice = price;
    position.profitLoss = pnl;
    position.profitLossPercent = (pnl / initialMargin) * 100;
    await position.save();

    // Create a trade record
    await Trade.create({
      user: position.user,
      symbol: position.symbol,
      companyName: position.companyName,
      tradeType: 'COVER',
      quantity: position.quantity,
      price,
      totalAmount: costToCover,
      profitLoss: pnl,
      profitLossPercent: position.profitLossPercent,
      walletBefore,
      walletAfter: user.virtualWallet,
      reasoning: `Covered short position. Entry: ₹${position.entryPrice.toFixed(2)}, Exit: ₹${price.toFixed(2)}`
    });

    res.json({ success: true, position, walletBalance: user.virtualWallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  buyStock, sellStock, getPortfolio, getTradeHistory,
  getTradingJournal, addReasoning, getWatchlist,
  addToWatchlist, removeFromWatchlist, setPriceAlert,
  calculateOptionsPrice, createOrder, verifyPayment, buyMutualFund,
  setStopLossTarget,
  getLimitOrders, placeLimitOrder, cancelLimitOrder,
  getShortPositions, openShortPosition, coverShortPosition
};