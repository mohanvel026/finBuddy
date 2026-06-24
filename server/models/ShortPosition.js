const mongoose = require('mongoose');

const shortPositionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true },
  companyName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  entryPrice: { type: Number, required: true },
  reasoning: { type: String },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  exitPrice: { type: Number },
  profitLoss: { type: Number, default: 0 },
  profitLossPercent: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ShortPosition', shortPositionSchema);
