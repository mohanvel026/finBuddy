const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  amountINR: { type: Number },

  category: {
    type: String,
    enum: ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'other'],
    default: 'other'
  },

  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Industry-standard split types ──
  splitType: {
    type: String,
    enum: ['equal', 'selective', 'item', 'percentage', 'shares', 'subgroup'],
    default: 'equal'
  },
  splitDescription: { type: String },   // human-readable e.g. "Split among 3 of 6 members"
  participantCount: { type: Number },  // how many people are in this split
  totalGroupMembers: { type: Number },  // total group size at time of expense

  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, default: 0 },
    percentage: { type: Number },
    shares: { type: Number },          // for share-based splits
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paymentId: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ['unpaid', 'pending', 'paid', 'rejected'], 
      default: 'unpaid' 
    },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'razorpay', null], default: null },
    isSubgroup: { type: Boolean, default: false },
    items: [{ name: String, price: Number }]  // item-based splits
  }],

  // Receipt OCR
  receiptImage: { type: String },
  receiptData: {
    items: [{ name: String, price: Number, claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    subtotal: { type: Number },
    tax: { type: Number },
    total: { type: Number }
  },

  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['monthly', 'weekly', null], default: null },
  recurringParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },

  notes: { type: String },
  date: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Dispute
  dispute: {
    isDisputed: { type: Boolean, default: false },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    votes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['valid', 'invalid'] },
      votedAt: { type: Date, default: Date.now }
    }],
    resolvedAt: { type: Date },
    resolution: { type: String },
    aiSuggestion: { type: String }
  }
}, { timestamps: true });

expenseSchema.pre('save', function (next) {
  if (this.currency === 'INR') this.amountINR = this.amount;
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);