// server/controllers/wealth.controller.js
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Goal = require('../models/Goal');
const { calculateEMI, extraPaymentSavings } = require('../algorithms/emiEngine');
const axios = require('axios');

// Mongoose model for persistent EMI schedules
const EMI = require('../models/EMI');

// @desc    Get net worth dashboard
// @route   GET /api/wealth/networth
const getNetWorth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const portfolio = await Portfolio.findOne({ user: req.user._id });

    // Get crypto prices
    let cryptoValue = 0;
    if (portfolio?.crypto?.length > 0) {
      try {
        const ids = portfolio.crypto.map(c => c.coinId).join(',');
        const { data } = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`,
          { timeout: 5000 }
        );
        portfolio.crypto.forEach(c => {
          const price = data[c.coinId]?.inr || c.currentPrice;
          c.currentPrice = price;
          c.currentValue = price * c.quantity;
          c.profitLoss = c.currentValue - c.investedAmount;
          cryptoValue += c.currentValue;
        });
        if (portfolio.save) await portfolio.save();
      } catch (e) {
        cryptoValue = portfolio.crypto.reduce((s, c) => s + (c.currentValue || 0), 0);
      }
    }

    const stockValue = portfolio?.currentValue || 0;
    const walletCash = user.virtualWallet;
    const totalAssets = walletCash + stockValue + cryptoValue;

    // Simple liability calculation from pending debts
    const groups = await Group.find({ 'members.user': req.user._id });
    const groupIds = groups.map(g => g._id);
    const pendingExpenses = await Expense.find({
      group: { $in: groupIds },
      'splits.user': req.user._id,
      'splits.isPaid': false
    });

    const totalLiabilities = pendingExpenses.reduce((s, e) => {
      const split = e.splits.find(sp => sp.user?.toString() === req.user._id.toString() && !sp.isPaid);
      return s + (split?.amount || 0);
    }, 0);

    const netWorth = totalAssets - totalLiabilities;

    // Financial independence score (0-100)
    const fiScore = Math.min(100, Math.round((netWorth / 1000000) * 100));

    let activePortfolio = portfolio;
    if (!activePortfolio) {
      activePortfolio = new Portfolio({ user: req.user._id, holdings: [], mutualFunds: [], crypto: [] });
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (!activePortfolio.valueHistory) activePortfolio.valueHistory = [];
    const hasToday = activePortfolio.valueHistory.find(h => h.date && new Date(h.date).toISOString().split('T')[0] === todayStr);
    if (hasToday) {
      hasToday.value = Math.round(totalAssets);
    } else {
      activePortfolio.valueHistory.push({ date: new Date(), value: Math.round(totalAssets) });
    }
    if (activePortfolio.valueHistory.length > 30) {
      activePortfolio.valueHistory.shift();
    }
    await activePortfolio.save();

    res.json({
      success: true,
      netWorth: Math.round(netWorth),
      assets: {
        cash: walletCash,
        stocks: Math.round(stockValue),
        crypto: Math.round(cryptoValue),
        total: Math.round(totalAssets)
      },
      liabilities: Math.round(totalLiabilities),
      fiScore,
      portfolio: activePortfolio,
      cryptoHoldings: activePortfolio.crypto || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add/Get EMI tracker
// @route   GET/POST /api/wealth/emi
const getEMIs = async (req, res) => {
  try {
    const userEMIs = await EMI.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, emis: userEMIs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch EMIs' });
  }
};

const addEMI = async (req, res) => {
  try {
    const { name, principal, annualRate, tenureMonths, startDate, category } = req.body;
    const result = calculateEMI(parseFloat(principal), parseFloat(annualRate), parseInt(tenureMonths));

    const emi = await EMI.create({
      user: req.user._id,
      name,
      principal: parseFloat(principal),
      annualRate: parseFloat(annualRate),
      tenureMonths: parseInt(tenureMonths),
      startDate,
      category: category || 'Other',
      monthlyPayment: result.monthlyPayment,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest,
      amortizationSchedule: result.schedule || []
    });

    res.json({ success: true, emi });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add EMI' });
  }
};

const deleteEMI = async (req, res) => {
  try {
    await EMI.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'EMI removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove EMI' });
  }
};

const calculateEMIRoute = (req, res) => {
  try {
    const { principal, annualRate, tenureMonths, extraMonthly } = req.body;
    const result = calculateEMI(parseFloat(principal), parseFloat(annualRate), parseInt(tenureMonths));
    let savings = null;
    if (extraMonthly && parseFloat(extraMonthly) > 0) {
      savings = extraPaymentSavings(parseFloat(principal), parseFloat(annualRate), parseInt(tenureMonths), parseFloat(extraMonthly));
    }
    res.json({ success: true, result, savings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add crypto holding
// @route   POST /api/wealth/crypto
const addCrypto = async (req, res) => {
  try {
    const { coinId, symbol, name, quantity, avgBuyPrice } = req.body;

    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) portfolio = new Portfolio({ user: req.user._id });

    const existingIdx = portfolio.crypto.findIndex(c => c.coinId === coinId);
    const investedAmount = parseFloat(quantity) * parseFloat(avgBuyPrice);

    if (existingIdx >= 0) {
      const existing = portfolio.crypto[existingIdx];
      const newQty = existing.quantity + parseFloat(quantity);
      const newAvg = ((existing.avgBuyPrice * existing.quantity) + investedAmount) / newQty;
      portfolio.crypto[existingIdx].quantity = newQty;
      portfolio.crypto[existingIdx].avgBuyPrice = Math.round(newAvg * 100) / 100;
      portfolio.crypto[existingIdx].investedAmount += investedAmount;
    } else {
      portfolio.crypto.push({ coinId, symbol, name, quantity: parseFloat(quantity), avgBuyPrice: parseFloat(avgBuyPrice), investedAmount });
    }

    await portfolio.save();
    res.json({ success: true, crypto: portfolio.crypto });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch goals' });
  }
};

const addGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, category } = req.body;
    const goal = await Goal.create({
      user: req.user._id,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      deadline: deadline ? new Date(deadline) : null,
      category: category || 'General'
    });
    res.json({ success: true, goal });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
};

const updateGoal = async (req, res) => {
  try {
    const { currentAmount, isCompleted } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    
    if (currentAmount !== undefined) {
      goal.currentAmount = parseFloat(currentAmount);
      if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
      } else {
        goal.isCompleted = false;
      }
    }
    if (isCompleted !== undefined) goal.isCompleted = !!isCompleted;
    
    await goal.save();
    res.json({ success: true, goal });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
};

const mirrorPortfolio = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: 'Friend ID required' });

    // 1. Fetch friend's portfolio
    const friendPortfolio = await Portfolio.findOne({ user: friendId });
    if (!friendPortfolio || (!friendPortfolio.holdings?.length && !friendPortfolio.mutualFunds?.length)) {
      return res.status(400).json({ success: false, message: 'Friend has no assets to mirror' });
    }

    // 2. Fetch current user
    const user = await User.findById(req.user._id);
    const cost = 50000;
    if (user.virtualWallet < cost) {
      return res.status(400).json({ success: false, message: `Insufficient Virtual Wallet cash! You need ₹${cost.toLocaleString('en-IN')} to mirror portfolio.` });
    }

    // 3. Fetch/Create user portfolio
    let myPortfolio = await Portfolio.findOne({ user: req.user._id });
    if (!myPortfolio) {
      myPortfolio = new Portfolio({ user: req.user._id, holdings: [], mutualFunds: [], crypto: [] });
    }

    // Deduct cash
    user.virtualWallet -= cost;
    await user.save();

    // 4. Mirror Holdings: friend holdings
    const friendHoldings = friendPortfolio.holdings || [];
    const totalFriendValue = friendHoldings.reduce((sum, h) => sum + (h.currentPrice * h.quantity || h.avgBuyPrice * h.quantity || 0), 0) || 1;
    
    // Scale friend's holdings to cost (₹50000)
    myPortfolio.holdings = friendHoldings.map(h => {
      const value = h.currentPrice * h.quantity || h.avgBuyPrice * h.quantity || 0;
      const pct = value / totalFriendValue;
      const allocatedValue = cost * pct;
      const price = h.currentPrice || h.avgBuyPrice || 1000;
      const quantity = Math.round((allocatedValue / price) * 100) / 100;
      return {
        symbol: h.symbol,
        companyName: h.companyName || h.symbol,
        avgBuyPrice: price,
        currentPrice: price,
        quantity: quantity || 0.1,
        investedAmount: allocatedValue,
        currentValue: allocatedValue,
        profitLoss: 0
      };
    });

    await myPortfolio.save();
    
    res.json({
      success: true,
      message: `Successfully mirrored portfolio! Allocated ₹${cost.toLocaleString('en-IN')} into indices matching friend's allocation.`,
      user
    });
  } catch (error) {
    console.error('Mirror portfolio error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNetWorth, getEMIs, addEMI, deleteEMI, calculateEMIRoute, addCrypto, getGoals, addGoal, updateGoal, deleteGoal, mirrorPortfolio, emiStore: {} };