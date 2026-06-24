const mongoose = require('mongoose');

const debtTrackerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  friendName: { type: String, required: true },
  type: { type: String, enum: ['lent', 'borrowed'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DebtTracker', debtTrackerSchema);
