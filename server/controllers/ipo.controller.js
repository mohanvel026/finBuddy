// server/controllers/ipo.controller.js
const axios = require('axios');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

// NSE India API headers (required to avoid bot detection)
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
  'Connection': 'keep-alive',
};

// In-memory cache (15 minutes) to avoid hammering NSE
let ipoCache = null;
let ipoCacheTime = 0;
const IPO_CACHE_TTL = 15 * 60 * 1000;

const fetchLiveIPOs = async () => {
  const now = Date.now();
  if (ipoCache && now - ipoCacheTime < IPO_CACHE_TTL) return ipoCache;

  const parseIPOList = (items = []) =>
    items.map((item, idx) => ({
      id: item.isinNumber || item.symbol || ('ipo_' + idx),
      companyName: item.companyName || item.name || 'Unknown',
      symbol: item.symbol || '',
      sector: item.industry || item.sector || 'General',
      priceRange: {
        min: parseFloat(item.minBidPrice || item.priceMin || item.issuePrice || 0),
        max: parseFloat(item.maxBidPrice || item.priceMax || item.issuePrice || 0),
      },
      lotSize: parseInt(item.lotSize || item.minBidQty || 0),
      issueSize: item.issueSize || item.issueSizeInCr || '',
      openDate: item.openDate ? new Date(item.openDate) : null,
      closeDate: item.closeDate ? new Date(item.closeDate) : null,
      listingDate: item.listingDate ? new Date(item.listingDate) : null,
      gmp: null,
      subscription: {
        retail: parseFloat(item.retailSubscription || 0),
        qib: parseFloat(item.qibSubscription || 0),
        nii: parseFloat(item.niiSubscription || item.nonInstitutionalSubscription || 0),
      },
      status: item.status || (item.closeDate && new Date(item.closeDate) < new Date() ? 'listed' : 'upcoming'),
      listingGainPercent: item.listingGain ? parseFloat(item.listingGain) : null,
      listingPrice: item.listingPrice ? parseFloat(item.listingPrice) : null,
      source: 'NSE India',
    }));

  // Primary: NSE /getAllIPO
  try {
    const res = await axios.get('https://www.nseindia.com/api/getAllIPO', { headers: NSE_HEADERS, timeout: 8000 });
    const raw = res.data;
    const all = [...(raw?.upcoming || []), ...(raw?.current || []), ...(raw?.listed || [])];
    if (all.length === 0) throw new Error('getAllIPO returned empty');
    const ipos = parseIPOList(all);
    ipoCache = ipos; ipoCacheTime = now;
    return ipos;
  } catch (e) { console.warn('NSE getAllIPO failed:', e.message); }

  // Fallback: NSE /getIPO
  try {
    const res = await axios.get('https://www.nseindia.com/api/getIPO', { headers: NSE_HEADERS, timeout: 8000 });
    const raw = res.data?.ipoList || res.data?.data || [];
    if (raw.length === 0) throw new Error('getIPO returned empty');
    const ipos = parseIPOList(raw);
    ipoCache = ipos; ipoCacheTime = now;
    return ipos;
  } catch (e) {
    console.error('All NSE IPO endpoints failed:', e.message);
    return null;
  }
};

// @desc  Get live IPO listings from NSE India
// @route GET /api/trades/ipo
const getIPOs = async (req, res) => {
  try {
    const ipos = await fetchLiveIPOs();
    if (!ipos) return res.status(503).json({ success: false, message: 'IPO data temporarily unavailable. Please try again in a moment.' });
    res.json({ success: true, ipos, count: ipos.length });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch IPO data' });
  }
};

// @desc  Apply for IPO (virtual simulation using real live IPO data)
// @route POST /api/trades/ipo/apply
const applyForIPO = async (req, res) => {
  try {
    const { ipoId, lots } = req.body;
    const ipos = await fetchLiveIPOs();
    if (!ipos) return res.status(503).json({ success: false, message: 'IPO data temporarily unavailable' });

    const ipo = ipos.find(i => i.id === ipoId);
    if (!ipo) return res.status(404).json({ success: false, message: 'IPO not found' });

    const isOpen = ipo.openDate && ipo.closeDate
      ? new Date() >= new Date(ipo.openDate) && new Date() <= new Date(ipo.closeDate)
      : false;
    if (!isOpen) return res.status(400).json({ success: false, message: 'IPO is not currently open for applications' });

    const issuePrice = ipo.priceRange.max || ipo.priceRange.min || 0;
    const lotSize = ipo.lotSize || 1;
    const applicationAmount = issuePrice * lotSize * (lots || 1);
    if (applicationAmount === 0) return res.status(400).json({ success: false, message: 'Invalid IPO price or lot size data' });

    const user = await User.findById(req.user._id);
    if (user.virtualWallet < applicationAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds. Need Rs.' + applicationAmount.toLocaleString('en-IN') });
    }

    user.virtualWallet -= applicationAmount;
    await user.save();

    const isAllotted = Math.random() < 0.4;
    if (isAllotted) {
      const listingPrice = issuePrice * 1.12;
      const quantity = lotSize * (lots || 1);
      let portfolio = await Portfolio.findOne({ user: req.user._id });
      if (!portfolio) portfolio = new Portfolio({ user: req.user._id });
      portfolio.holdings.push({
        symbol: (ipo.symbol || ipo.companyName.replace(/\s+/g,'').toUpperCase().slice(0,10)),
        companyName: ipo.companyName, quantity,
        avgBuyPrice: issuePrice, currentPrice: listingPrice,
        totalInvested: applicationAmount, currentValue: quantity * listingPrice,
        profitLoss: (listingPrice - issuePrice) * quantity,
      });
      portfolio.totalInvested += applicationAmount;
      portfolio.currentValue += quantity * listingPrice;
      await portfolio.save();
      res.json({ success: true, allotted: true, message: 'Allotted! ' + quantity + ' shares of ' + ipo.companyName, shares: quantity, issuePrice, estimatedListingPrice: Math.round(listingPrice), estimatedGain: Math.round((listingPrice - issuePrice) * quantity) });
    } else {
      user.virtualWallet += applicationAmount;
      await user.save();
      res.json({ success: true, allotted: false, message: 'Not allotted. Rs.' + applicationAmount.toLocaleString('en-IN') + ' refunded to wallet.', refunded: applicationAmount });
    }
  } catch (e) {
    console.error('applyForIPO error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getIPOs, applyForIPO };
