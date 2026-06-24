const mongoose = require('mongoose');

const coopVaultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  target: { type: Number, required: true },
  saved: { type: Number, default: 0 },
  youContributed: { type: Number, default: 0 },
  members: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('CoopVault', coopVaultSchema);
