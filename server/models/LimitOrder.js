const mongoose = require('mongoose');

const limitOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true },
  companyName: { type: String },
  tradeType: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  limitPrice: { type: Number, required: true },
  reasoning: { type: String },
  status: { type: String, enum: ['PENDING', 'EXECUTED', 'CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('LimitOrder', limitOrderSchema);
