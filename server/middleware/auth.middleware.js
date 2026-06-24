const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Auto-update daily active user streak and lastActiveDate
    try {
      const todayStr = new Date().toDateString();
      const lastActiveStr = req.user.lastActiveDate ? req.user.lastActiveDate.toDateString() : '';
      if (lastActiveStr !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = lastActiveStr === yesterday.toDateString();
        
        if (isYesterday) {
          req.user.currentStreak = (req.user.currentStreak || 0) + 1;
        } else {
          req.user.currentStreak = 1;
        }
        if (req.user.currentStreak > (req.user.longestStreak || 0)) {
          req.user.longestStreak = req.user.currentStreak;
        }
        req.user.lastActiveDate = new Date();
        await req.user.save();
      }
    } catch (streakErr) {
      console.warn('⚠️ Failed to update streak in auth middleware:', streakErr.message);
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = { protect, adminOnly, generateToken };