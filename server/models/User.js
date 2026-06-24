const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, minlength: 6 },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  phone: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  emailVerifyToken: String,
  emailVerifyExpire: Date,

  // 2FA
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOTP: { type: String },
  twoFactorOTPExpire: { type: Date },

  // Financial Profile
  virtualWallet: { type: Number, default: 100000 },   // ₹1,00,000 to start
  virtualCoins: { type: Number, default: 100 },        // Learn & Earn coins
  finScore: { type: Number, default: 500, min: 300, max: 900 },
  spendingPersonality: {
    type: String,
    enum: ['Foodie', 'Traveller', 'Saver', 'Impulsive', 'Balanced', null],
    default: null
  },

  // Settings
  currency: { type: String, default: 'INR' },
  college: { type: String },
  yearOfStudy: { type: Number },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  fcmToken: { type: String },

  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  referralBonusGiven: { type: Boolean, default: false },

  // Social
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now }
  }],

  // Gamification
  badges: [{
    name: { type: String },
    earnedAt: { type: Date, default: Date.now },
    icon: { type: String }
  }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  totalQuizScore: { type: Number, default: 0 },
  lessonsCompleted: [{ type: String }],
  lastActiveLessonId: { type: String, default: null },
  lastActiveStation: { type: Number, default: 1 },
  financialDna: { type: String, default: null },
  claimedChests: [{ type: String }],

  // Season
  currentSeasonPoints: { type: Number, default: 0 },
  seasonHistory: [{
    season: String,
    rank: Number,
    points: Number
  }],

  // Public Profile
  isPublicProfile: { type: Boolean, default: false },
  bio: { type: String, maxlength: 200 },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  upiId: { type: String, trim: true, default: '' },
  passwordResetToken: String,
  passwordResetExpire: Date,

}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate referral code before first save
userSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verify token
userSchema.methods.generateEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Generate OTP for 2FA
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.twoFactorOTP = otp;
  this.twoFactorOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Don't send password in response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.twoFactorOTP;
  delete user.twoFactorOTPExpire;
  delete user.emailVerifyToken;
  delete user.passwordResetToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);