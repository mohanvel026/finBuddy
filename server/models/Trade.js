const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  companyName: { type: String },
  tradeType: { type: String, enum: ['BUY', 'SELL'], required: true },
  assetType: {
    type: String,
    enum: ['stock', 'mutualfund', 'crypto', 'options', 'ipo'],
    default: 'stock'
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  // Wallet snapshot
  walletBefore: { type: Number },
  walletAfter: { type: Number },

  // Paper trading journal
  reasoning: { type: String },
  aiScore: { type: Number, min: 1, max: 10 },
  aiReview: { type: String },
  aiReviewedAt: { type: Date },

  // Options specific
  optionsData: {
    optionType: { type: String, enum: ['CALL', 'PUT'] },
    strikePrice: { type: Number },
    expiryDate: { type: Date },
    premium: { type: Number },
    theoreticalPrice: { type: Number }
  },

  // P&L (calculated on SELL)
  profitLoss: { type: Number, default: 0 },
  profitLossPercent: { type: Number, default: 0 },

  // Battle reference
  battle: { type: mongoose.Schema.Types.ObjectId, ref: 'Battle' },

  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);