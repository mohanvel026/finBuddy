const SIPPortfolio = require('../models/SIPPortfolio');

// ── GET: Full SIP portfolio for logged-in user ──────────────────────────────
exports.getSIPPortfolio = async (req, res) => {
  try {
    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = { sips: [], goldHoldings: [], zerodhaHoldings: [], indmoneyUS: [], cryptos: [] };
    } else {
      portfolio = portfolio.toObject();
      if (!portfolio.zerodhaHoldings) portfolio.zerodhaHoldings = [];
      if (!portfolio.indmoneyUS) portfolio.indmoneyUS = [];
      if (!portfolio.cryptos) portfolio.cryptos = [];
    }
    res.json({ success: true, data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Add a new SIP entry ────────────────────────────────────────────────
exports.addSIP = async (req, res) => {
  try {
    const { schemeCode, schemeName, platform, sipAmount, sipDay, startDate, endDate, stepUpPercent, category } = req.body;
    if (!schemeCode || !schemeName || !sipAmount || !sipDay || !startDate) {
      return res.status(400).json({ success: false, message: 'schemeCode, schemeName, sipAmount, sipDay and startDate are required' });
    }

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new SIPPortfolio({ user: req.user._id, sips: [], goldHoldings: [] });
    }

    // Prevent duplicate scheme code
    if (portfolio.sips.find(s => s.schemeCode === schemeCode)) {
      return res.status(409).json({ success: false, message: 'This scheme is already registered. Use update instead.' });
    }

    portfolio.sips.push({ schemeCode, schemeName, platform: platform || 'Groww', sipAmount, sipDay, startDate, endDate: endDate || null, stepUpPercent: stepUpPercent || 0, category: category || 'Other' });
    await portfolio.save();

    res.status(201).json({ success: true, message: 'SIP registered successfully', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT: Update a SIP entry ──────────────────────────────────────────────────
exports.updateSIP = async (req, res) => {
  try {
    const { sipId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const sip = portfolio.sips.id(sipId);
    if (!sip) return res.status(404).json({ success: false, message: 'SIP not found' });

    const fields = ['sipAmount', 'sipDay', 'startDate', 'endDate', 'stepUpPercent', 'platform', 'category'];
    fields.forEach(f => { if (req.body[f] !== undefined) sip[f] = req.body[f]; });

    await portfolio.save();
    res.json({ success: true, message: 'SIP updated', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a SIP entry ───────────────────────────────────────────────
exports.deleteSIP = async (req, res) => {
  try {
    const { sipId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    portfolio.sips = portfolio.sips.filter(s => s._id.toString() !== sipId);
    await portfolio.save();
    res.json({ success: true, message: 'SIP removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Add a lumpsum to a SIP ─────────────────────────────────────────────
exports.addLumpsum = async (req, res) => {
  try {
    const { sipId } = req.params;
    const { date, amount, note } = req.body;
    if (!date || !amount) return res.status(400).json({ success: false, message: 'date and amount required' });

    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const sip = portfolio.sips.id(sipId);
    if (!sip) return res.status(404).json({ success: false, message: 'SIP not found' });

    sip.lumpsums.push({ date, amount, note });
    await portfolio.save();
    res.json({ success: true, message: 'Lumpsum added', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Add a redemption to a SIP ─────────────────────────────────────────
exports.addRedemption = async (req, res) => {
  try {
    const { sipId } = req.params;
    const { date, units, nav, note } = req.body;
    if (!date || !units) return res.status(400).json({ success: false, message: 'date and units required' });

    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const sip = portfolio.sips.id(sipId);
    if (!sip) return res.status(404).json({ success: false, message: 'SIP not found' });

    sip.redemptions.push({ date, units, nav: nav || null, note });
    await portfolio.save();
    res.json({ success: true, message: 'Redemption recorded', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT: Update gold/silver holdings ────────────────────────────────────────
exports.updateGold = async (req, res) => {
  try {
    const { goldHoldings } = req.body;
    if (!Array.isArray(goldHoldings)) return res.status(400).json({ success: false, message: 'goldHoldings must be an array' });

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) portfolio = new SIPPortfolio({ user: req.user._id, sips: [] });

    portfolio.goldHoldings = goldHoldings.map(g => ({ ...g, updatedAt: new Date() }));
    await portfolio.save();
    res.json({ success: true, message: 'Gold holdings updated', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a lumpsum from a SIP ───────────────────────────────────────
exports.deleteLumpsum = async (req, res) => {
  try {
    const { sipId, lumpsumId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const sip = portfolio.sips.id(sipId);
    if (!sip) return res.status(404).json({ success: false, message: 'SIP not found' });

    sip.lumpsums = sip.lumpsums.filter(l => l._id.toString() !== lumpsumId);
    await portfolio.save();
    res.json({ success: true, message: 'Lumpsum transaction deleted', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a redemption from a SIP ────────────────────────────────────
exports.deleteRedemption = async (req, res) => {
  try {
    const { sipId, redemptionId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    const sip = portfolio.sips.id(sipId);
    if (!sip) return res.status(404).json({ success: false, message: 'SIP not found' });

    sip.redemptions = sip.redemptions.filter(r => r._id.toString() !== redemptionId);
    await portfolio.save();
    res.json({ success: true, message: 'Redemption transaction deleted', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Batch Import SIPs and Gold ──────────────────────────────────────────
exports.importPortfolio = async (req, res) => {
  try {
    const { sips, goldHoldings } = req.body;

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new SIPPortfolio({ user: req.user._id, sips: [], goldHoldings: [] });
    }

    if (Array.isArray(sips)) {
      sips.forEach(newSip => {
        // Find existing SIP by schemeCode
        const existingSip = portfolio.sips.find(s => s.schemeCode === newSip.schemeCode);
        if (existingSip) {
          // Merge lumpsums
          if (Array.isArray(newSip.lumpsums)) {
            newSip.lumpsums.forEach(l => {
              const dup = existingSip.lumpsums.find(el => 
                new Date(el.date).toISOString().split('T')[0] === new Date(l.date).toISOString().split('T')[0] && 
                el.amount === l.amount
              );
              if (!dup) existingSip.lumpsums.push(l);
            });
          }
          // Merge redemptions
          if (Array.isArray(newSip.redemptions)) {
            newSip.redemptions.forEach(r => {
              const dup = existingSip.redemptions.find(er => 
                new Date(er.date).toISOString().split('T')[0] === new Date(r.date).toISOString().split('T')[0] && 
                er.units === r.units
              );
              if (!dup) existingSip.redemptions.push(r);
            });
          }
          // Update basic fields
          if (newSip.sipAmount !== undefined) existingSip.sipAmount = newSip.sipAmount;
          if (newSip.sipDay !== undefined) existingSip.sipDay = newSip.sipDay;
          if (newSip.startDate !== undefined) existingSip.startDate = newSip.startDate;
          if (newSip.platform !== undefined) existingSip.platform = newSip.platform;
          if (newSip.category !== undefined) existingSip.category = newSip.category;
        } else {
          // Add as new SIP
          portfolio.sips.push(newSip);
        }
      });
    }

    if (Array.isArray(goldHoldings)) {
      goldHoldings.forEach(newGold => {
        const existingGold = portfolio.goldHoldings.find(g => g.platform === newGold.platform && g.metalType === newGold.metalType);
        if (existingGold) {
          existingGold.grams = newGold.grams;
          if (newGold.avgBuyPrice !== undefined) existingGold.avgBuyPrice = newGold.avgBuyPrice;
          existingGold.updatedAt = new Date();
        } else {
          portfolio.goldHoldings.push({ ...newGold, updatedAt: new Date() });
        }
      });
    }

    await portfolio.save();
    res.json({ success: true, message: 'Portfolio imported successfully!', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// ── POST: Add a new Zerodha Stock holding ──────────────────────────────────────
exports.addStock = async (req, res) => {
  try {
    const { symbol, name, qty, avgPrice, currentPrice, category, platform } = req.body;
    if (!symbol || !name || !qty || !avgPrice) {
      return res.status(400).json({ success: false, message: 'symbol, name, qty and avgPrice are required' });
    }

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new SIPPortfolio({ user: req.user._id, sips: [], goldHoldings: [], zerodhaHoldings: [], indmoneyUS: [], cryptos: [] });
    }

    portfolio.zerodhaHoldings.push({
      symbol,
      name,
      qty: parseFloat(qty),
      avgPrice: parseFloat(avgPrice),
      currentPrice: parseFloat(currentPrice || avgPrice),
      invested: Math.round(parseFloat(qty) * parseFloat(avgPrice)),
      category: category || 'Stock',
      platform: platform || 'Zerodha'
    });

    await portfolio.save();
    res.status(201).json({ success: true, message: 'Stock added successfully', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a Zerodha Stock holding ─────────────────────────────────────
exports.deleteStock = async (req, res) => {
  try {
    const { stockId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    portfolio.zerodhaHoldings = portfolio.zerodhaHoldings.filter(s => s._id.toString() !== stockId);
    await portfolio.save();
    res.json({ success: true, message: 'Stock removed', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Add a new US Stock holding ──────────────────────────────────────────
exports.addUsStock = async (req, res) => {
  try {
    const { symbol, name, qty, avgPriceUsd, currentPriceUsd, category, platform } = req.body;
    if (!symbol || !name || !qty || !avgPriceUsd) {
      return res.status(400).json({ success: false, message: 'symbol, name, qty and avgPriceUsd are required' });
    }

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new SIPPortfolio({ user: req.user._id, sips: [], goldHoldings: [], zerodhaHoldings: [], indmoneyUS: [], cryptos: [] });
    }

    portfolio.indmoneyUS.push({
      symbol,
      name,
      qty: parseFloat(qty),
      avgPriceUsd: parseFloat(avgPriceUsd),
      currentPriceUsd: parseFloat(currentPriceUsd || avgPriceUsd),
      investedUsd: parseFloat(qty) * parseFloat(avgPriceUsd),
      category: category || 'US Stock',
      platform: platform || 'INDMoney'
    });

    await portfolio.save();
    res.status(201).json({ success: true, message: 'US Stock added successfully', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a US Stock holding ──────────────────────────────────────────
exports.deleteUsStock = async (req, res) => {
  try {
    const { stockId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    portfolio.indmoneyUS = portfolio.indmoneyUS.filter(s => s._id.toString() !== stockId);
    await portfolio.save();
    res.json({ success: true, message: 'US Stock removed', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST: Add a new Crypto holding ─────────────────────────────────────────────
exports.addCryptoHolding = async (req, res) => {
  try {
    const { symbol, name, qty, avgPrice, currentPrice, platform } = req.body;
    if (!symbol || !name || !qty || !avgPrice) {
      return res.status(400).json({ success: false, message: 'symbol, name, qty and avgPrice are required' });
    }

    let portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = new SIPPortfolio({ user: req.user._id, sips: [], goldHoldings: [], zerodhaHoldings: [], indmoneyUS: [], cryptos: [] });
    }

    portfolio.cryptos.push({
      symbol,
      name,
      qty: parseFloat(qty),
      avgPrice: parseFloat(avgPrice),
      currentPrice: parseFloat(currentPrice || avgPrice),
      invested: Math.round(parseFloat(qty) * parseFloat(avgPrice)),
      platform: platform || 'CoinDCX'
    });

    await portfolio.save();
    res.status(201).json({ success: true, message: 'Crypto holding added successfully', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Remove a Crypto holding ────────────────────────────────────────────
exports.deleteCryptoHolding = async (req, res) => {
  try {
    const { cryptoId } = req.params;
    const portfolio = await SIPPortfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    portfolio.cryptos = portfolio.cryptos.filter(c => c._id.toString() !== cryptoId);
    await portfolio.save();
    res.json({ success: true, message: 'Crypto holding removed', data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
