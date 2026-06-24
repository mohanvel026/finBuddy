const mongoose = require('mongoose');

const calculateFinScore = async (userId) => {
  try {
    const User = require('../models/User');
    const Expense = require('../models/Expense');
    const Trade = require('../models/Trade');
    const Portfolio = require('../models/Portfolio');

    let score = 500; // Base score

    // --- Factor 1: Debt clearance speed (max +200 points) ---
    const settledSplits = await Expense.find({
      'splits.user': userId,
      'splits.isPaid': true
    });

    if (settledSplits.length > 0) {
      let totalDays = 0;
      let count = 0;

      settledSplits.forEach(expense => {
        const split = expense.splits.find(
          s => s.user.toString() === userId.toString() && s.isPaid && s.paidAt
        );
        if (split) {
          const days = (split.paidAt - expense.createdAt) / (1000 * 60 * 60 * 24);
          totalDays += days;
          count++;
        }
      });

      if (count > 0) {
        const avgDays = totalDays / count;
        if (avgDays <= 1) score += 200;
        else if (avgDays <= 3) score += 150;
        else if (avgDays <= 7) score += 100;
        else if (avgDays <= 14) score += 50;
        else score -= 50;
      }
    }

    // --- Factor 2: Investment consistency (max +100 points) ---
    const trades = await Trade.find({ user: userId });
    const uniqueTradingDays = new Set(
      trades.map(t => new Date(t.timestamp).toDateString())
    ).size;
    score += Math.min(uniqueTradingDays * 5, 100);

    // --- Factor 3: Portfolio diversity (max +100 points) ---
    const portfolio = await Portfolio.findOne({ user: userId });
    if (portfolio) {
      score += Math.min(portfolio.holdings.length * 10, 60);
      if (portfolio.mutualFunds.length > 0) score += 20;
      if (portfolio.crypto.length > 0) score += 20;
    }

    // --- Factor 4: Savings rate (max +100 points) ---
    const user = await User.findById(userId);
    const walletGrowth = user.virtualWallet - 100000;
    if (walletGrowth > 50000) score += 100;
    else if (walletGrowth > 20000) score += 70;
    else if (walletGrowth > 0) score += 40;
    else if (walletGrowth < -30000) score -= 50;

    // --- Factor 5: Streak bonus (max +50 points) ---
    score += Math.min(user.currentStreak * 2, 50);

    // Clamp between 300-900
    score = Math.max(300, Math.min(900, Math.round(score)));

    // Save to user
    await User.findByIdAndUpdate(userId, { finScore: score });

    return score;
  } catch (error) {
    console.error('FinScore calculation error:', error);
    return 500;
  }
};

// Award badge to user
const awardBadge = async (userId, badgeName, badgeIcon) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);

    const alreadyHas = user.badges.some(b => b.name === badgeName);
    if (!alreadyHas) {
      user.badges.push({ name: badgeName, icon: badgeIcon });
      await user.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Badge award error:', error);
    return false;
  }
};

module.exports = { calculateFinScore, awardBadge };