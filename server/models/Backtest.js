const mongoose = require('mongoose');

const backtestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  companyName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Buy price
  resultPrice: { type: Number, required: true },
  buyDate: { type: String, required: true },
  resultDate: { type: String, required: true },
  profitLoss: { type: Number, required: true },
  profitLossPercent: { type: Number, required: true },
  grade: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Backtest', backtestSchema);
