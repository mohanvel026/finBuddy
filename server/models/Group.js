const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: {
    type: String,
    enum: ['mess', 'trip', 'roommates', 'outing', 'other'],
    default: 'other'
  },
  avatar: { type: String },
  emoji: { type: String, default: '👥' },

  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    totalPaid: { type: Number, default: 0 },
    totalOwed: { type: Number, default: 0 }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Trip details (only for type: 'trip')
  tripDetails: {
    destination: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    totalBudget: { type: Number },
    currency: { type: String, default: 'INR' },
    photos: [{ type: String }],
    googleDriveFolderId: { type: String },
    googleDriveFolderLink: { type: String },
    googleDriveHighlightsFolderId: { type: String },
    googleDriveHighlightsFolderLink: { type: String }
  },

  // Budget envelopes per category
  budgetEnvelopes: [{
    category: {
      type: String,
      enum: ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'other']
    },
    budgetAmount: { type: Number },
    spentAmount: { type: Number, default: 0 },
    month: { type: Number },
    year: { type: Number }
  }],

  // Recurring patterns detected
  recurringExpenses: [{
    description: { type: String },
    amount: { type: Number },
    pattern: { type: String, enum: ['monthly', 'weekly'] },
    nextDue: { type: Date },
    isActive: { type: Boolean, default: true }
  }],

  totalExpenses: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true },
  googleDriveCredentials: {
    accessToken: { type: String },
    refreshToken: { type: String },
    expiryDate: { type: Number },
    ownerEmail: { type: String }
  }
}, { timestamps: true });

// Generate invite code before save
groupSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);