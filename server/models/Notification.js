const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
  type: { 
    type: String, 
    enum: ['payment_pending', 'payment_approved', 'payment_rejected', 'general'], 
    default: 'general' 
  },
  message: { type: String, required: true },
  amount: { type: Number },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
