const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  category: { type: String, default: 'General' },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
