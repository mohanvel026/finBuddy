const mongoose = require('mongoose');

const stockDuelSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ticker: { type: String, required: true },
  direction: { type: String, enum: ['UP', 'DOWN'], required: true },
  friendName: { type: String, required: true },
  friendDirection: { type: String, enum: ['UP', 'DOWN'], required: true },
  betCoins: { type: Number, required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  percentageChange: { type: String, default: '+0.0%' },
  durationLeft: { type: String, default: '24h 00m' }
}, { timestamps: true });

module.exports = mongoose.model('StockDuel', stockDuelSchema);
