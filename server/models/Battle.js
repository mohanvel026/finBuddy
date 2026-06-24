const mongoose = require('mongoose');
const crypto = require('crypto');

const battleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { type: String, enum: ['1v1', 'group'], default: 'group' },
  battleType: {
    type: String,
    enum: ['trading', 'savings', 'spending'],
    default: 'trading'
  },

  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startingBalance: { type: Number, default: 100000 },
    currentBalance: { type: Number, default: 100000 },
    portfolioValue: { type: Number, default: 0 },
    totalValue: { type: Number, default: 100000 },
    returnPercent: { type: Number, default: 0 },
    rank: { type: Number, default: 1 },
    joinedAt: { type: Date, default: Date.now }
  }],

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  duration: { type: String, enum: ['1day', '1week', '1month'], default: '1week' },

  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inviteCode: { type: String, unique: true },
  maxParticipants: { type: Number, default: 10 },

  // Squad battle
  squad: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad' }
}, { timestamps: true });

battleSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Battle', battleSchema);