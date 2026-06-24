const mongoose = require('mongoose');

const savedStrategySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 200 },
  symbol: { type: String, required: true },
  companyName: { type: String },

  // Strategy rules
  entryRules: [{ type: String }],
  exitRules: [{ type: String }],
  entryLogic: { type: String, enum: ['AND', 'OR'], default: 'OR' },
  exitLogic: { type: String, enum: ['AND', 'OR'], default: 'OR' },

  // Parameters
  entryParams: { type: mongoose.Schema.Types.Mixed, default: {} },
  exitParams: { type: mongoose.Schema.Types.Mixed, default: {} },
  slippagePct: { type: Number, default: 0.1 },
  brokerFeePct: { type: Number, default: 0.05 },

  // Last known backtest results (cached)
  lastResult: {
    roiPct: Number,
    winRate: Number,
    totalTrades: Number,
    sharpeRatio: Number,
    maxDrawdownPct: Number,
  }

}, { timestamps: true });

module.exports = mongoose.model('SavedStrategy', savedStrategySchema);
