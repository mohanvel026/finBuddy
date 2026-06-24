const mongoose = require('mongoose');
const crypto = require('crypto');

const squadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  avatar: { type: String },
  emoji: { type: String, default: '⚔️' },

  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['captain', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    contribution: { type: Number, default: 0 }
  }],

  maxMembers: { type: Number, default: 4 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  squadFinScore: { type: Number, default: 0 },
  seasonWins: { type: Number, default: 0 },
  totalBattles: { type: Number, default: 0 },

  inviteCode: { type: String, unique: true },

  chat: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

squadSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Squad', squadSchema);