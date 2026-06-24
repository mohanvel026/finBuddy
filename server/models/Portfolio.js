const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  holdings: [{
    symbol: { type: String, required: true },
    companyName: { type: String },
    exchange: { type: String, default: 'NSE' },
    quantity: { type: Number, required: true, min: 0 },
    avgBuyPrice: { type: Number, required: true },
    currentPrice: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    profitLossPercent: { type: Number, default: 0 },
    dayChange: { type: Number, default: 0 },
    stopLossPrice: { type: Number, default: null },
    targetPrice: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now }
  }],

  mutualFunds: [{
    fundName: { type: String },
    schemeCode: { type: String },
    units: { type: Number, default: 0 },
    avgNAV: { type: Number, default: 0 },
    currentNAV: { type: Number, default: 0 },
    investedAmount: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    sipAmount: { type: Number, default: 0 },
    sipDate: { type: Number },
    nextSIPDate: { type: Date },
    isSIPActive: { type: Boolean, default: false }
  }],

  crypto: [{
    coinId: { type: String },
    symbol: { type: String },
    name: { type: String },
    quantity: { type: Number, default: 0 },
    avgBuyPrice: { type: Number, default: 0 },
    currentPrice: { type: Number, default: 0 },
    investedAmount: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 }
  }],

  // Summary (updated on every trade)
  totalInvested: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  totalProfitLoss: { type: Number, default: 0 },
  totalProfitLossPercent: { type: Number, default: 0 },
  dayProfitLoss: { type: Number, default: 0 },

  // History snapshots for chart (saved daily)
  valueHistory: [{
    date: { type: Date },
    value: { type: Number }
  }],

  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);