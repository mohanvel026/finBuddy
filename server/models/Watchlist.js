const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stocks: [{
    symbol: { type: String, required: true },
    companyName: { type: String },
    addedAt: { type: Date, default: Date.now },
    notes: { type: String },
    alerts: [{
      type: { type: String, enum: ['above', 'below'], required: true },
      price: { type: Number, required: true },
      isTriggered: { type: Boolean, default: false },
      triggeredAt: { type: Date },
      notified: { type: Boolean, default: false }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);