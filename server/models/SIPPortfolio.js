const mongoose = require('mongoose');

const lumpsumSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  note: { type: String }
}, { _id: true });

const redemptionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  units: { type: Number, required: true },
  nav: { type: Number },
  note: { type: String }
}, { _id: true });

const sipEntrySchema = new mongoose.Schema({
  schemeCode: { type: String, required: true },
  schemeName: { type: String, required: true },
  platform: { type: String, enum: ['Groww', 'PhonePe', 'Paytm Money', 'Zerodha', 'HDFC MF', 'SBI MF', 'Other'], default: 'Groww' },
  sipAmount: { type: Number, required: true },           // Monthly SIP amount ₹
  sipDay: { type: Number, required: true, min: 1, max: 28 }, // Day of month SIP executes
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },                // null = ongoing
  stepUpPercent: { type: Number, default: 0 },           // Annual step-up %
  lumpsums: [lumpsumSchema],
  redemptions: [redemptionSchema],
  category: {
    type: String,
    enum: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index', 'Debt', 'Liquid', 'International', 'Sectoral', 'Other'],
    default: 'Other'
  },
  createdAt: { type: Date, default: Date.now },
  lastCalculatedAt: { type: Date }
}, { _id: true });

const sipPortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  sips: [sipEntrySchema],
  goldHoldings: [{
    platform: { type: String, enum: ['PhonePe', 'Aura Gold', 'Jar', 'MMTC-PAMP', 'SafeGold', 'Zerodha', 'Other'], required: true },
    metalType: { type: String, enum: ['Gold', 'Silver'], default: 'Gold' },
    grams: { type: Number, required: true },
    avgBuyPrice: { type: Number },                       // avg buy price per gram
    updatedAt: { type: Date, default: Date.now }
  }],
  zerodhaHoldings: [{
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    avgPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    invested: { type: Number, default: 0 },
    category: { type: String, default: 'Stock' },
    platform: { type: String, default: 'Zerodha' }
  }],
  indmoneyUS: [{
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    avgPriceUsd: { type: Number, required: true },
    currentPriceUsd: { type: Number, default: 0 },
    investedUsd: { type: Number, default: 0 },
    category: { type: String, default: 'US Stock' },
    platform: { type: String, default: 'INDMoney' }
  }],
  cryptos: [{
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    avgPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    invested: { type: Number, default: 0 },
    platform: { type: String, default: 'CoinDCX' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SIPPortfolio', sipPortfolioSchema);
