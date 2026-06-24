const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { calculateFinScore } = require('../algorithms/finScore');
const { cloudinary } = require('../config/cloudinary');
const { getAICompletion } = require('../utils/aiService');

// @desc    Get my profile
// @route   GET /api/users/me
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name avatar finScore college')
      .populate('referredBy', 'name');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update my profile
// @route   PUT /api/users/me
const updateProfile = async (req, res) => {
  try {
    const { name, college, yearOfStudy, bio, currency, notifications, isPublicProfile, upiId, financialDna, claimedChests } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (college) updateData.college = college;
    if (yearOfStudy) updateData.yearOfStudy = yearOfStudy;
    if (bio) updateData.bio = bio;
    if (currency) updateData.currency = currency;
    if (notifications) updateData.notifications = notifications;
    if (isPublicProfile !== undefined) updateData.isPublicProfile = isPublicProfile;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (financialDna) updateData.financialDna = financialDna;
    if (claimedChests) updateData.claimedChests = claimedChests;

    // Handle avatar upload
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get FinScore
// @route   GET /api/users/finscore
const getFinScore = async (req, res) => {
  try {
    const score = await calculateFinScore(req.user._id);
    const breakdown = await getFinScoreBreakdown(req.user._id);
    res.json({ success: true, finScore: score, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my badges
// @route   GET /api/users/badges
const getBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('badges virtualCoins currentStreak');
    const allBadges = [
      { name: 'First Trade', icon: '📈', description: 'Made your first virtual trade', earned: false },
      { name: 'Smart Trader', icon: '🧠', description: 'Profitable for 3 consecutive weeks', earned: false },
      { name: 'Debt Slayer', icon: '⚡', description: 'Cleared debts within 24hrs always', earned: false },
      { name: 'Savings King', icon: '💰', description: 'Spent least in your friend group', earned: false },
      { name: 'Goal Crusher', icon: '🎯', description: 'Hit a savings goal', earned: false },
      { name: 'Quiz Master', icon: '🏆', description: 'Scored 100% on 5 quizzes', earned: false },
      { name: 'Streak 7', icon: '🔥', description: '7-day login streak', earned: false },
      { name: 'Streak 30', icon: '💎', description: '30-day login streak', earned: false },
      { name: 'IPO Hunter', icon: '🚀', description: 'Applied for 3 IPOs', earned: false },
      { name: 'Diversified', icon: '🌐', description: 'Invested in 5+ different stocks', earned: false },
    ];

    const earnedNames = user.badges.map(b => b.name);
    const badgesWithStatus = allBadges.map(b => ({
      ...b,
      earned: earnedNames.includes(b.name),
      earnedAt: user.badges.find(eb => eb.name === b.name)?.earnedAt
    }));

    res.json({
      success: true,
      badges: badgesWithStatus,
      earnedCount: earnedNames.length,
      coins: user.virtualCoins,
      streak: user.currentStreak
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send friend request
// @route   POST /api/users/friend-request
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Can't add yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already friends
    if (req.user.friends.includes(userId)) {
      return res.status(400).json({ success: false, message: 'Already friends' });
    }

    // Check if request already sent
    const alreadySent = targetUser.friendRequests.some(
      r => r.from.toString() === req.user._id.toString()
    );
    if (alreadySent) {
      return res.status(400).json({ success: false, message: 'Request already sent' });
    }

    targetUser.friendRequests.push({ from: req.user._id });
    await targetUser.save();

    res.json({ success: true, message: 'Friend request sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept friend request
// @route   PUT /api/users/friend-accept
const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(req.user._id);
    const requestIndex = user.friendRequests.findIndex(
      r => r.from.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Remove from requests
    user.friendRequests.splice(requestIndex, 1);

    // Add to friends (both sides)
    user.friends.push(userId);
    await user.save();

    await User.findByIdAndUpdate(userId, {
      $push: { friends: req.user._id }
    });

    res.json({ success: true, message: 'Friend added!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Decline friend request
// @route   PUT /api/users/friend-decline
const declineFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(req.user._id);
    const requestIndex = user.friendRequests.findIndex(
      r => r.from.toString() === userId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    user.friendRequests.splice(requestIndex, 1);
    await user.save();

    res.json({ success: true, message: 'Friend request declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get friends list
// @route   GET /api/users/friends
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name avatar finScore college currentStreak badges virtualWallet')
      .populate('friendRequests.from', 'name avatar college');

    const friendsWithSummaries = await Promise.all(user.friends.map(async (friend) => {
      const portfolio = await Portfolio.findOne({ user: friend._id });
      const friendObj = friend.toObject ? friend.toObject() : friend;
      
      const stocks = portfolio?.currentValue || 0;
      const crypto = portfolio?.crypto?.reduce((sum, c) => sum + (c.currentValue || 0), 0) || 0;
      const cash = friend.virtualWallet || 10000;
      const total = stocks + crypto + cash;
      
      friendObj.portfolioSummary = {
        stocks: total > 0 ? Math.round((stocks / total) * 100) : 0,
        crypto: total > 0 ? Math.round((crypto / total) * 100) : 0,
        cash: total > 0 ? Math.round((cash / total) * 100) : 100
      };
      
      const sum = friendObj.portfolioSummary.stocks + friendObj.portfolioSummary.crypto + friendObj.portfolioSummary.cash;
      if (sum !== 100 && sum > 0) {
        friendObj.portfolioSummary.cash += (100 - sum);
      }
      
      return friendObj;
    }));

    res.json({
      success: true,
      friends: friendsWithSummaries,
      friendRequests: user.friendRequests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    College leaderboard
// @route   GET /api/users/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { type = 'finScore', college } = req.query;

    const query = { isPublicProfile: true };
    if (college) query.college = college;

    let sortField = {};
    if (type === 'finScore') sortField = { finScore: -1 };
    else if (type === 'wallet') sortField = { virtualWallet: -1 };
    else if (type === 'streak') sortField = { currentStreak: -1 };
    else if (type === 'coins') sortField = { virtualCoins: -1 };

    const users = await User.find(query)
      .select('name avatar finScore virtualWallet currentStreak virtualCoins college badges')
      .sort(sortField)
      .limit(50);

    const leaderboard = users.map((u, index) => ({
      rank: index + 1,
      _id: u._id,
      name: u.name,
      avatar: u.avatar,
      finScore: u.finScore,
      virtualWallet: u.virtualWallet,
      currentStreak: u.currentStreak,
      virtualCoins: u.virtualCoins,
      college: u.college,
      badgeCount: u.badges.length,
      isMe: u._id.toString() === req.user._id.toString()
    }));

    res.json({ success: true, leaderboard, type });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Anonymous peer benchmark
// @route   GET /api/users/peer-benchmark
const getPeerBenchmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const peers = await User.find({
      college: user.college,
      _id: { $ne: user._id }
    }).select('finScore virtualWallet currentStreak');

    if (peers.length === 0) {
      return res.json({ success: true, message: 'Not enough peers yet', benchmark: null });
    }

    const avgFinScore = peers.reduce((a, p) => a + p.finScore, 0) / peers.length;
    const avgWallet = peers.reduce((a, p) => a + p.virtualWallet, 0) / peers.length;
    const avgStreak = peers.reduce((a, p) => a + p.currentStreak, 0) / peers.length;

    const finScoreRank = peers.filter(p => p.finScore > user.finScore).length + 1;
    const walletRank = peers.filter(p => p.virtualWallet > user.virtualWallet).length + 1;

    res.json({
      success: true,
      benchmark: {
        totalPeers: peers.length,
        avgFinScore: Math.round(avgFinScore),
        avgWallet: Math.round(avgWallet),
        avgStreak: Math.round(avgStreak),
        yourFinScore: user.finScore,
        yourWallet: user.virtualWallet,
        yourStreak: user.currentStreak,
        finScoreRank,
        walletRank,
        finScorePercentile: Math.round((1 - finScoreRank / peers.length) * 100),
        walletPercentile: Math.round((1 - walletRank / peers.length) * 100),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update FCM token for push notifications
// @route   PUT /api/users/fcm-token
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get referral stats
// @route   GET /api/users/referral
const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('referralCode referralCount virtualWallet');

    const referredUsers = await User.find({ referredBy: req.user._id })
      .select('name avatar createdAt');

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      bonusEarned: user.referralCount * 10000,
      referredUsers,
      shareLink: `${process.env.CLIENT_URL}/register?ref=${user.referralCode}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: FinScore breakdown
const getFinScoreBreakdown = async (userId) => {
  return {
    debtClearance: { score: 0, max: 200, label: 'Debt Clearance Speed' },
    investmentConsistency: { score: 0, max: 100, label: 'Investment Consistency' },
    portfolioDiversity: { score: 0, max: 100, label: 'Portfolio Diversity' },
    savingsRate: { score: 0, max: 100, label: 'Savings Rate' },
  };
};

// @desc    Search public users by name/email
// @route   GET /api/users/search
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { isPublicProfile: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email avatar college finScore currentStreak badges');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate AI roast comparing spending personality of user and friend
// @route   GET /api/users/roast/:friendId
const getPeerRoast = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friend = await User.findById(req.params.friendId);
    if (!friend) {
      return res.status(404).json({ success: false, message: 'Friend not found' });
    }

    const myPersonality = user.spendingPersonality || 'Balanced';
    const friendPersonality = friend.spendingPersonality || 'Saver';

    const prompt = `You are a savage, funny financial roast master AI. 
    You are roasting two college students side-by-side:
    Student A (User): Name is "${user.name}", Spending DNA is "${myPersonality}", FinScore is ${user.finScore}, and Streaks is ${user.currentStreak} days.
    Student B (Friend): Name is "${friend.name}", Spending DNA is "${friendPersonality}", FinScore is ${friend.finScore}, and Streaks is ${friend.currentStreak} days.
    
    Write a 3-4 sentence hilarious, witty, and savage roast comparing their financial decisions, spending DNA, and scores. Be funny, relatable, and use finance jargon (like inflation, asset classes, portfolio, debt, compounding, cashflow). Return ONLY the roast text.`;

    try {
      const roast = await getAICompletion([{ role: 'user', content: prompt }], 250);
      res.json({ success: true, roast });
    } catch (aiError) {
      console.warn('⚡ getPeerRoast falling back to local savage templates:', aiError.message);
      const localRoasts = [
        `Looks like ${user.name} and ${friend.name} are in a race to see whose virtual wallet can gather dust faster. ${user.name}'s FinScore of ${user.finScore} is basically a rounding error compared to actual compounding, while ${friend.name}'s ${friendPersonality} DNA suggests they live on instant noodles just to save ₹10 in gas!`,
        `While ${user.name} is showing off a ${user.currentStreak}-day learning streak, their actual portfolio activity is quieter than a bank during a holiday. Meanwhile, ${friend.name} is holding onto their FinScore of ${friend.finScore} like it's a gold bar, but they're both losing to inflation at a steady 6% a year.`,
        `${user.name}'s "${myPersonality}" profile is essentially financial code for 'spending now, crying later.' Meanwhile, ${friend.name} is hoarding coins like a digital dragon but has yet to discover what a diversified index SIP actually does. Pick a lane, you two!`
      ];
      const fallbackRoast = localRoasts[Math.floor(Math.random() * localRoasts.length)];
      res.json({ success: true, roast: fallbackRoast, fallback: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  getFinScore,
  getBadges,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getLeaderboard,
  getPeerBenchmark,
  updateFCMToken,
  getReferralStats,
  searchUsers,
  getPeerRoast
};