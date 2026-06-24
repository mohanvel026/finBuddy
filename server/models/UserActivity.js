const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['trade', 'expense', 'settlement', 'goal', 'badge', 'login', 'group', 'sip', 'backtest'],
    required: true
  },
  icon: { type: String, default: '📌' },
  text: { type: String, required: true },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

userActivitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
