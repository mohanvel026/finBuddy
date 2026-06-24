// server/routes/trip.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { convertToINR, getSupportedCurrencies, getExchangeRates } = require('../utils/currencyConverter');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

router.use(protect);

// @desc    Get trip details with budget tracking
// @route   GET /api/trips/:groupId
router.get('/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'name avatar');

    if (!group || group.type !== 'trip') {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name avatar')
      .sort({ date: -1 });

    const totalSpentINR = expenses.reduce((s, e) => s + (e.amountINR || e.amount), 0);
    const budget = group.tripDetails?.totalBudget || 0;
    const budgetUsedPercent = budget > 0 ? Math.round((totalSpentINR / budget) * 100) : 0;
    const remaining = budget - totalSpentINR;
    const perPersonBudget = budget / (group.members?.length || 1);
    const perPersonSpent = totalSpentINR / (group.members?.length || 1);

    // Category breakdown
    const byCategory = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + (e.amountINR || e.amount);
    });

    // Daily spending
    const byDay = {};
    expenses.forEach(e => {
      const day = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      byDay[day] = (byDay[day] || 0) + (e.amountINR || e.amount);
    });

    res.json({
      success: true,
      trip: {
        ...group.toObject(),
        stats: {
          totalSpentINR,
          budget,
          budgetUsedPercent,
          remaining,
          perPersonBudget,
          perPersonSpent,
          isOverBudget: totalSpentINR > budget,
          daysLeft: group.tripDetails?.endDate
            ? Math.max(0, Math.ceil((new Date(group.tripDetails.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
            : null
        },
        byCategory,
        byDay,
        expenses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update trip details
// @route   PUT /api/trips/:groupId
router.put('/:groupId', async (req, res) => {
  try {
    const { destination, startDate, endDate, totalBudget, currency } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      {
        $set: {
          'tripDetails.destination': destination,
          'tripDetails.startDate': startDate,
          'tripDetails.endDate': endDate,
          'tripDetails.totalBudget': totalBudget,
          'tripDetails.currency': currency || 'INR',
        }
      },
      { new: true }
    );

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get supported currencies + live rates
// @route   GET /api/trips/currencies/list
router.get('/currencies/list', async (req, res) => {
  try {
    const currencies = getSupportedCurrencies();
    const rates = await getExchangeRates();
    const currenciesWithRates = currencies.map(c => ({
      ...c,
      rateToINR: c.code === 'INR' ? 1 : Math.round((1 / (rates[c.code] || 1)) * 100) / 100
    }));
    res.json({ success: true, currencies: currenciesWithRates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Convert amount to INR
// @route   POST /api/trips/convert
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency } = req.body;
    const amountINR = await convertToINR(parseFloat(amount), fromCurrency);
    res.json({ success: true, amountINR, fromCurrency, amount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;