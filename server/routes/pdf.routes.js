// server/routes/pdf.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { generatePDF, generateExpenseReportHTML, generateTradeCertificateHTML, generateAnnualReviewHTML, generateInvoiceHTML } = require('../utils/generatePDF');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Trade = require('../models/Trade');

router.use(protect);

// @desc    Download monthly expense report as PDF
// @route   GET /api/pdf/expense-report?month=5&year=2025
router.get('/expense-report', async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    const user = await User.findById(req.user._id);
    const groups = await Group.find({ 'members.user': req.user._id });
    const groupIds = groups.map(g => g._id);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await Expense.find({
      group: { $in: groupIds },
      date: { $gte: startDate, $lte: endDate }
    }).populate('paidBy', 'name');

    const monthName = startDate.toLocaleString('en-IN', { month: 'long' });
    const html = generateExpenseReportHTML(user, groups, expenses, monthName, year);
    const pdf = await generatePDF(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finbuddy-report-${monthName}-${year}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: 'PDF generation failed: ' + error.message });
  }
});

// @desc    Download trading certificate as PDF
// @route   GET /api/pdf/trade-certificate
router.get('/trade-certificate', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const trades = await Trade.find({ user: req.user._id });
    const sells = trades.filter(t => t.tradeType === 'SELL');
    const wins = sells.filter(t => t.profitLoss > 0);

    const stats = {
      totalTrades: trades.length,
      winRate: sells.length > 0 ? Math.round((wins.length / sells.length) * 100) : 0,
      finScore: user.finScore
    };

    const html = generateTradeCertificateHTML(user, stats);
    const pdf = await generatePDF(html, { format: 'A5', landscape: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finbuddy-certificate-${user.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: 'PDF generation failed: ' + error.message });
  }
});

// @desc    Download annual wealth review as PDF
// @route   GET /api/pdf/annual-review
router.get('/annual-review', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const Portfolio = require('../models/Portfolio');
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    const axios = require('axios');
    const EMI = require('../models/EMI');

    // Calculate crypto value
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
          cryptoValue += price * c.quantity;
        });
      } catch (e) {
        cryptoValue = portfolio.crypto.reduce((s, c) => s + (c.currentValue || c.investedAmount || 0), 0);
      }
    }

    const stockValue = portfolio?.currentValue || 0;
    const walletCash = user.virtualWallet || 0;
    const totalAssets = walletCash + stockValue + cryptoValue;

    // Liabilities calculation from groups
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
    const fiScore = Math.min(100, Math.round((netWorth / 1000000) * 100));

    const userEMIs = await EMI.find({ user: req.user._id }).lean();

    const reportData = {
      netWorth: Math.round(netWorth),
      assets: {
        cash: walletCash,
        stocks: Math.round(stockValue),
        crypto: Math.round(cryptoValue),
        total: Math.round(totalAssets)
      },
      liabilities: Math.round(totalLiabilities),
      fiScore,
      emis: userEMIs
    };

    const html = generateAnnualReviewHTML(user, reportData);
    const pdf = await generatePDF(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finbuddy-annual-review-${user.name}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: 'PDF generation failed: ' + error.message });
  }
});

// @desc    Download payment invoice as PDF
// @route   GET /api/pdf/invoice
router.get('/invoice', async (req, res) => {
  try {
    const { invoiceId, date, gatewayId } = req.query;

    if (!invoiceId || !gatewayId) {
      return res.status(400).json({ success: false, message: 'Missing invoice or transaction ID query params' });
    }

    const user = await User.findById(req.user._id);
    
    const invData = {
      id: invoiceId,
      date: date || new Date().toLocaleDateString('en-IN'),
      gatewayId: gatewayId,
      orderId: 'ord_elite_' + invoiceId.split('-')[2]
    };

    const html = generateInvoiceHTML(user, invData);
    const pdf = await generatePDF(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finbuddy-receipt-${invoiceId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Invoice PDF generation failed: ' + error.message });
  }
});

module.exports = router;