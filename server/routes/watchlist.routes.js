// server/routes/watchlist.routes.js
// Price Alerts + Watchlist management endpoints
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Watchlist = require('../models/Watchlist');

router.use(protect);

// ── GET /api/watchlist ── Get user's watchlist with alerts
router.get('/', async (req, res) => {
  try {
    let wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) {
      wl = await Watchlist.create({ user: req.user._id, stocks: [] });
    }
    res.json({ success: true, watchlist: wl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/watchlist/stock ── Add stock to watchlist
router.post('/stock', async (req, res) => {
  try {
    const { symbol, companyName } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol is required' });

    let wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) wl = new Watchlist({ user: req.user._id, stocks: [] });

    const already = wl.stocks.find(s => s.symbol === symbol.toUpperCase());
    if (already) {
      return res.status(400).json({ success: false, message: 'Stock already in watchlist' });
    }

    wl.stocks.push({ symbol: symbol.toUpperCase(), companyName: companyName || symbol, alerts: [] });
    await wl.save();
    res.json({ success: true, watchlist: wl, message: `${symbol} added to watchlist` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/watchlist/stock/:symbol ── Remove stock from watchlist
router.delete('/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) return res.status(404).json({ success: false, message: 'Watchlist not found' });

    wl.stocks = wl.stocks.filter(s => s.symbol !== symbol);
    await wl.save();
    res.json({ success: true, watchlist: wl, message: `${symbol} removed` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/watchlist/alert ── Add price alert for a stock
router.post('/alert', async (req, res) => {
  try {
    const { symbol, type, price, companyName } = req.body;
    if (!symbol || !type || !price) {
      return res.status(400).json({ success: false, message: 'symbol, type, and price are required' });
    }
    if (!['above', 'below'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be "above" or "below"' });
    }

    let wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) wl = new Watchlist({ user: req.user._id, stocks: [] });

    let stock = wl.stocks.find(s => s.symbol === symbol.toUpperCase());
    if (!stock) {
      wl.stocks.push({ symbol: symbol.toUpperCase(), companyName: companyName || symbol, alerts: [] });
      stock = wl.stocks[wl.stocks.length - 1];
    }

    // Prevent duplicate alerts
    const hasDuplicate = stock.alerts.some(a => a.type === type && Math.abs(a.price - price) < 0.01 && !a.isTriggered);
    if (hasDuplicate) {
      return res.status(400).json({ success: false, message: 'Similar alert already exists' });
    }

    stock.alerts.push({ type, price: parseFloat(price), isTriggered: false });
    await wl.save();

    res.json({
      success: true,
      watchlist: wl,
      message: `Alert set: ${symbol} ${type} ₹${parseFloat(price).toFixed(2)}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/watchlist/alert ── Delete a specific alert
router.delete('/alert', async (req, res) => {
  try {
    const { symbol, alertIndex } = req.body;
    const wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) return res.status(404).json({ success: false, message: 'Watchlist not found' });

    const stock = wl.stocks.find(s => s.symbol === symbol.toUpperCase());
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found in watchlist' });

    stock.alerts.splice(alertIndex, 1);
    await wl.save();
    res.json({ success: true, watchlist: wl, message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/watchlist/alerts/triggered ── Clear all triggered alerts
router.delete('/alerts/triggered', async (req, res) => {
  try {
    const wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) return res.status(404).json({ success: false, message: 'Watchlist not found' });

    for (const stock of wl.stocks) {
      stock.alerts = stock.alerts.filter(a => !a.isTriggered);
    }
    await wl.save();
    res.json({ success: true, watchlist: wl, message: 'Triggered alerts cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/watchlist/alerts/active ── Get all active (not triggered) alerts
router.get('/alerts/active', async (req, res) => {
  try {
    const wl = await Watchlist.findOne({ user: req.user._id });
    if (!wl) return res.json({ success: true, alerts: [] });

    const alerts = [];
    for (const stock of wl.stocks) {
      for (const alert of stock.alerts) {
        if (!alert.isTriggered) {
          alerts.push({
            symbol: stock.symbol,
            companyName: stock.companyName,
            type: alert.type,
            price: alert.price,
            _id: alert._id
          });
        }
      }
    }
    res.json({ success: true, alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
