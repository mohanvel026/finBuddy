const mongoose = require('mongoose');

const moneyChallengeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  wager: { type: Number, required: true },
  reward: { type: Number, required: true },
  friendName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'active', 'claimed'], default: 'pending' },
  progress: { type: String, default: 'Waiting buddy approval' }
}, { timestamps: true });

module.exports = mongoose.model('MoneyChallenge', moneyChallengeSchema);
