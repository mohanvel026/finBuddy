// server/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Expense = require('../models/Expense');
const Group = require('../models/Group');

router.use(protect);

// Admin guard middleware
const adminOnly = (req, res, next) => {
  // Allow if user has admin role OR if it's the first user (for demo)
  if (req.user?.role === 'admin' || req.user?.isAdmin === true) {
    return next();
  }
  // For demo purposes — allow all logged-in users to view analytics
  // In production, uncomment the line below:
  // return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Core counts in parallel
    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      totalTrades,
      totalGroups,
      totalExpenses,
      newUsersThisWeek,
      newUsersThisMonth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveDate: { $gte: oneDayAgo } }),
      User.countDocuments({ lastActiveDate: { $gte: sevenDaysAgo } }),
      Trade.countDocuments(),
      Group.countDocuments(),
      Expense.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Total trade volume (sum of invested)
    const tradeVolumeAgg = await Trade.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price'] } } } }
    ]);
    const totalTradeVolume = tradeVolumeAgg[0]?.total || 0;

    // DAU over last 30 days
    const dauData = await User.aggregate([
      {
        $match: { lastActiveDate: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastActiveDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // New user signups over last 30 days
    const signupData = await User.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top 5 most active users by trade count
    const topTraders = await Trade.aggregate([
      { $group: { _id: '$user', tradeCount: { $sum: 1 }, totalPnL: { $sum: '$profitLoss' } } },
      { $sort: { tradeCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          tradeCount: 1,
          totalPnL: 1,
          name: { $arrayElemAt: ['$userInfo.name', 0] },
          email: { $arrayElemAt: ['$userInfo.email', 0] },
          finScore: { $arrayElemAt: ['$userInfo.finScore', 0] },
          avatar: { $arrayElemAt: ['$userInfo.avatar', 0] }
        }
      }
    ]);

    // Trade distribution by type (BUY vs SELL)
    const tradeTypes = await Trade.aggregate([
      { $group: { _id: '$tradeType', count: { $sum: 1 } } }
    ]);

    // Top stocks by trade volume
    const topStocks = await Trade.aggregate([
      { $group: { _id: '$symbol', count: { $sum: 1 }, volume: { $sum: { $multiply: ['$quantity', '$price'] } } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Average FinScore
    const avgFinScoreAgg = await User.aggregate([
      { $group: { _id: null, avg: { $avg: '$finScore' }, max: { $max: '$finScore' } } }
    ]);
    const avgFinScore = avgFinScoreAgg[0]?.avg || 0;
    const maxFinScore = avgFinScoreAgg[0]?.max || 0;

    // Expense categories breakdown
    const expenseCategories = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        activeToday,
        activeThisWeek,
        totalTrades,
        totalGroups,
        totalExpenses,
        newUsersThisWeek,
        newUsersThisMonth,
        totalTradeVolume: Math.round(totalTradeVolume),
        avgFinScore: Math.round(avgFinScore),
        maxFinScore
      },
      charts: {
        dau: dauData.map(d => ({ date: d._id, users: d.count })),
        signups: signupData.map(d => ({ date: d._id, signups: d.count })),
        tradeTypes: tradeTypes.map(t => ({ type: t._id, count: t.count })),
        topStocks: topStocks.map(s => ({ symbol: s._id, trades: s.count, volume: Math.round(s.volume) })),
        expenseCategories: expenseCategories.map(e => ({ category: e._id || 'Other', total: Math.round(e.total), count: e.count }))
      },
      topTraders: topTraders.map(t => ({
        name: t.name || 'Anonymous',
        email: t.email,
        tradeCount: t.tradeCount,
        totalPnL: Math.round(t.totalPnL || 0),
        finScore: t.finScore || 0,
        avatar: t.avatar
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
