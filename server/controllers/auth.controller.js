const User = require('../models/User');
const { generateToken } = require('../middleware/auth.middleware');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSMS');
const crypto = require('crypto');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, college, yearOfStudy, referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Handle referral
    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
    }

    const user = await User.create({
      name,
      email,
      password,
      college,
      yearOfStudy,
      referredBy: referredByUser?._id || null,
    });

    // Give referral bonus
    if (referredByUser) {
      referredByUser.referralCount += 1;
      referredByUser.virtualWallet += 10000; // ₹10,000 bonus
      referredByUser.virtualCoins += 50;
      await referredByUser.save();

      // New user also gets bonus
      user.virtualWallet += 10000;
      user.virtualCoins += 50;
      await user.save();
    }

    // Send verify email (non-blocking — don't fail registration if email fails)
    try {
      const verifyToken = user.generateEmailVerifyToken();
      await user.save();
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
      const { subject, html } = emailTemplates.verifyEmail(name, verifyUrl);
      await sendEmail({ to: email, subject, html });

      // Send welcome email
      const welcome = emailTemplates.welcomeEmail(name);
      await sendEmail({ to: email, subject: welcome.subject, html: welcome.html });
    } catch (emailErr) {
      console.warn('⚠️  Email delivery failed (SMTP not configured?):', emailErr.message);
      // Registration still succeeds — email is optional at this stage
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        virtualWallet: user.virtualWallet,
        finScore: user.finScore,
        isEmailVerified: user.isEmailVerified,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        isPremium: user.isPremium || false,
        upiId: user.upiId || '',
        bio: user.bio || '',
        yearOfStudy: user.yearOfStudy || '',
        isPublicProfile: user.isPublicProfile || false,
        referralCode: user.referralCode || '',
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // If 2FA enabled, send OTP instead of token
    if (user.twoFactorEnabled) {
      const otp = user.generateOTP();
      await user.save();

      // Send OTP via email
      const { subject, html } = emailTemplates.otpEmail(user.name, otp);
      await sendEmail({ to: user.email, subject, html });

      // Also send via SMS if phone verified
      if (user.isPhoneVerified && user.phone) {
        await sendSMS(user.phone, `Your FinBuddy OTP: ${otp}. Valid for 10 minutes.`);
      }

      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: 'OTP sent to your email'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.currentStreak = updateStreak(user.lastActiveDate, user.currentStreak);
    user.lastActiveDate = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        virtualWallet: user.virtualWallet,
        virtualCoins: user.virtualCoins,
        finScore: user.finScore,
        badges: user.badges,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        college: user.college,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        isPremium: user.isPremium || false,
        upiId: user.upiId || '',
        bio: user.bio || '',
        yearOfStudy: user.yearOfStudy || '',
        isPublicProfile: user.isPublicProfile || false,
        referralCode: user.referralCode || '',
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify 2FA OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactorOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.twoFactorOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Clear OTP
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpire = undefined;
    user.lastLogin = new Date();
    user.lastActiveDate = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        virtualWallet: user.virtualWallet,
        finScore: user.finScore,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        isPremium: user.isPremium || false,
        upiId: user.upiId || '',
        bio: user.bio || '',
        yearOfStudy: user.yearOfStudy || '',
        isPublicProfile: user.isPublicProfile || false,
        referralCode: user.referralCode || '',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP for 2FA setup/login
// @route   POST /api/auth/send-otp
// @access  Private
const sendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = user.generateOTP();
    await user.save();

    const { subject, html } = emailTemplates.otpEmail(user.name, otp);
    await sendEmail({ to: user.email, subject, html });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle 2FA
// @route   PUT /api/auth/toggle-2fa
// @access  Private
const toggle2FA = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (user.twoFactorOTP !== otp || user.twoFactorOTPExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: `2FA ${user.twoFactorEnabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerifyToken: hashedToken,
      emailVerifyExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
};

// @desc    Google OAuth Mock Sandbox Login (for local dev/review)
// @route   GET /api/auth/google/mock
// @access  Public
const googleMockLogin = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    // Find or create a mock Google user
    let user = await User.findOne({ email: 'mock.google.student@college.edu' });
    if (!user) {
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user = await User.create({
        name: 'Mock Google Student 🎓',
        email: 'mock.google.student@college.edu',
        googleId: 'mock-google-id-123456789',
        avatar: '',
        isEmailVerified: true,
        referralCode,
        virtualWallet: 100000,
        virtualCoins: 100
      });
    }

    const token = generateToken(user._id);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5177'}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error('Google mock login error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5177'}/login?error=oauth_failed`);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name avatar finScore')
      .populate('referredBy', 'name');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear FCM token on logout
    await User.findByIdAndUpdate(req.user._id, { fcmToken: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.json({ success: true, token, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Update daily streak
const updateStreak = (lastActiveDate, currentStreak) => {
  if (!lastActiveDate) return 1;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = lastActiveDate.toDateString() === yesterday.toDateString();
  const isToday = lastActiveDate.toDateString() === new Date().toDateString();
  if (isYesterday) return currentStreak + 1;
  if (isToday) return currentStreak;
  return 1; // streak reset
};

module.exports = {
  register,
  login,
  verifyOTP,
  sendOTP,
  toggle2FA,
  verifyEmail,
  googleCallback,
  googleMockLogin,
  getMe,
  logout,
  refreshToken
};