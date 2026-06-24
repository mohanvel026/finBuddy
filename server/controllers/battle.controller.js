const Battle = require('../models/Battle');
const Squad = require('../models/Squad');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const { awardBadge } = require('../algorithms/finScore');
const { getIO } = require('../sockets');

// @desc    Create battle
// @route   POST /api/battles
const createBattle = async (req, res) => {
  try {
    const { name, duration, battleType, maxParticipants } = req.body;

    const now = new Date();
    const endDate = new Date(now);
    if (duration === '1day') endDate.setDate(endDate.getDate() + 1);
    else if (duration === '1week') endDate.setDate(endDate.getDate() + 7);
    else if (duration === '1month') endDate.setMonth(endDate.getMonth() + 1);

    const battle = await Battle.create({
      name,
      createdBy: req.user._id,
      duration: duration || '1week',
      battleType: battleType || 'trading',
      maxParticipants: maxParticipants || 10,
      startDate: now,
      endDate,
      status: 'active',
      participants: [{
        user: req.user._id,
        startingBalance: 100000,
        currentBalance: req.user.virtualWallet,
        totalValue: req.user.virtualWallet,
        joinedAt: now
      }]
    });

    await battle.populate('participants.user', 'name avatar finScore');

    res.status(201).json({ success: true, battle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my battles
// @route   GET /api/battles
const getMyBattles = async (req, res) => {
  try {
    const battles = await Battle.find({
      'participants.user': req.user._id
    })
      .populate('participants.user', 'name avatar finScore')
      .populate('createdBy', 'name')
      .populate('winner', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, battles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get battle by ID with live leaderboard
// @route   GET /api/battles/:id
const getBattleById = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate('participants.user', 'name avatar finScore virtualWallet')
      .populate('createdBy', 'name avatar')
      .populate('winner', 'name avatar');

    if (!battle) return res.status(404).json({ success: false, message: 'Battle not found' });

    // Update participant values from their portfolios
    for (let i = 0; i < battle.participants.length; i++) {
      const p = battle.participants[i];
      const portfolio = await Portfolio.findOne({ user: p.user._id });
      const user = await User.findById(p.user._id).select('virtualWallet');

      battle.participants[i].currentBalance = user?.virtualWallet || 100000;
      battle.participants[i].portfolioValue = portfolio?.currentValue || 0;
      battle.participants[i].totalValue = (user?.virtualWallet || 100000) + (portfolio?.currentValue || 0);
      battle.participants[i].returnPercent =
        ((battle.participants[i].totalValue - battle.participants[i].startingBalance) / battle.participants[i].startingBalance) * 100;
    }

    // Sort by total value for rankings
    battle.participants.sort((a, b) => b.totalValue - a.totalValue);
    battle.participants.forEach((p, idx) => { p.rank = idx + 1; });

    await battle.save();

    res.json({ success: true, battle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join battle via invite code
// @route   POST /api/battles/join
const joinBattle = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const battle = await Battle.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'active' });
    if (!battle) return res.status(404).json({ success: false, message: 'Battle not found or ended' });

    if (battle.participants.length >= battle.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Battle is full' });
    }

    const alreadyJoined = battle.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );
    if (alreadyJoined) return res.status(400).json({ success: false, message: 'Already in this battle' });

    const user = await User.findById(req.user._id);

    battle.participants.push({
      user: req.user._id,
      startingBalance: 100000,
      currentBalance: user.virtualWallet,
      totalValue: user.virtualWallet,
      joinedAt: new Date()
    });
    await battle.save();

    // Notify via socket
    try {
      const io = getIO();
      io.to(`battle-${battle._id}`).emit('battle:user-joined', {
        userId: req.user._id,
        userName: req.user.name
      });
    } catch (e) { }

    res.json({ success: true, message: 'Joined battle!', battle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current season info
// @route   GET /api/battles/season/current
const getCurrentSeason = async (req, res) => {
  try {
    const now = new Date();
    const monthName = now.toLocaleString('en-IN', { month: 'long' });
    const year = now.getFullYear();

    // Top users this season
    const topUsers = await User.find({ isPublicProfile: true })
      .select('name avatar finScore currentSeasonPoints college')
      .sort({ currentSeasonPoints: -1 })
      .limit(10);

    res.json({
      success: true,
      season: {
        name: `${monthName} ${year} Season`,
        month: now.getMonth() + 1,
        year,
        endsAt: new Date(year, now.getMonth() + 1, 0), // Last day of month
        daysLeft: new Date(year, now.getMonth() + 1, 0).getDate() - now.getDate(),
      },
      leaderboard: topUsers.map((u, i) => ({
        rank: i + 1,
        name: u.name,
        avatar: u.avatar,
        finScore: u.finScore,
        points: u.currentSeasonPoints,
        college: u.college
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── QUIZ ────────────────────────────────────────────────

const QUESTIONS_BANK = [
  {
    id: 1,
    question: 'What does PE ratio stand for?',
    options: ['Price-to-Earnings', 'Profit-to-Equity', 'Price-to-Equity', 'Profit-to-Expense'],
    correct: 0,
    explanation: 'PE ratio = Stock Price / Earnings Per Share. It tells how much you pay for ₹1 of earnings.',
    category: 'stocks',
    difficulty: 'easy',
    coins: 10
  },
  {
    id: 2,
    question: 'What is a SIP in mutual funds?',
    options: ['Stock Investment Plan', 'Systematic Investment Plan', 'Secure Income Plan', 'Savings Interest Plan'],
    correct: 1,
    explanation: 'SIP (Systematic Investment Plan) lets you invest a fixed amount regularly in mutual funds.',
    category: 'mutualfunds',
    difficulty: 'easy',
    coins: 10
  },
  {
    id: 3,
    question: 'Which is NOT a type of mutual fund?',
    options: ['Equity Fund', 'Debt Fund', 'Credit Fund', 'Hybrid Fund'],
    correct: 2,
    explanation: 'Credit Fund is not a standard category. The main types are Equity, Debt, and Hybrid funds.',
    category: 'mutualfunds',
    difficulty: 'medium',
    coins: 15
  },
  {
    id: 4,
    question: 'What does SEBI stand for?',
    options: ['Securities Exchange Board of India', 'Stock Exchange Bureau of India', 'Securities and Exchange Board of India', 'Stock and Exchange Bureau of India'],
    correct: 2,
    explanation: 'SEBI (Securities and Exchange Board of India) regulates the securities market in India.',
    category: 'general',
    difficulty: 'easy',
    coins: 10
  },
  {
    id: 5,
    question: 'If a stock has a Beta of 1.5, it means:',
    options: ['50% less volatile than market', '50% more volatile than market', 'Same volatility as market', '150% less volatile'],
    correct: 1,
    explanation: 'Beta > 1 means more volatile than market. Beta 1.5 = 50% more volatile than market index.',
    category: 'stocks',
    difficulty: 'hard',
    coins: 20
  },
  {
    id: 6,
    question: 'What is the current GST rate on equity mutual fund redemptions?',
    options: ['0%', '5%', '12%', '18%'],
    correct: 0,
    explanation: 'There is no GST on mutual fund redemptions. However, capital gains tax applies.',
    category: 'tax',
    difficulty: 'medium',
    coins: 15
  },
  {
    id: 7,
    question: 'LTCG tax on equity after holding for 1 year is:',
    options: ['0%', '10% above ₹1 lakh gain', '15%', '20%'],
    correct: 1,
    explanation: 'Long-Term Capital Gains (LTCG) on equity is 10% on gains above ₹1 lakh per year.',
    category: 'tax',
    difficulty: 'hard',
    coins: 20
  },
  {
    id: 8,
    question: 'Bitcoin was created by:',
    options: ['Elon Musk', 'Satoshi Nakamoto', 'Vitalik Buterin', 'Mark Zuckerberg'],
    correct: 1,
    explanation: 'Bitcoin was created by the pseudonymous Satoshi Nakamoto in 2009.',
    category: 'crypto',
    difficulty: 'easy',
    coins: 10
  },
  {
    id: 9,
    question: 'What does IPO stand for?',
    options: ['Initial Public Offering', 'International Purchase Order', 'Index Price Option', 'Internal Profit Objective'],
    correct: 0,
    explanation: 'IPO (Initial Public Offering) is when a company first offers shares to the public.',
    category: 'stocks',
    difficulty: 'easy',
    coins: 10
  },
  {
    id: 10,
    question: 'Which index represents top 50 companies on NSE?',
    options: ['SENSEX', 'NIFTY 50', 'BSE 100', 'NIFTY BANK'],
    correct: 1,
    explanation: 'NIFTY 50 tracks the top 50 companies listed on the National Stock Exchange (NSE).',
    category: 'stocks',
    difficulty: 'easy',
    coins: 10
  }
];

// @desc    Get today's quiz questions
// @route   GET /api/battles/quiz/today
const getTodayQuiz = async (req, res) => {
  try {
    // Pick 3 random questions for today based on date seed
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const shuffled = [...QUESTIONS_BANK].sort((a, b) => ((a.id * seed) % 7) - ((b.id * seed) % 7));
    const todayQuestions = shuffled.slice(0, 3).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty,
      coins: q.coins
    }));

    res.json({ success: true, questions: todayQuestions, totalCoins: todayQuestions.reduce((s, q) => s + q.coins, 0) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/battles/quiz/submit
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{questionId, selectedOption}]

    let coinsEarned = 0;
    let correct = 0;
    const results = answers.map(ans => {
      const q = QUESTIONS_BANK.find(q => q.id === ans.questionId);
      const isCorrect = q && ans.selectedOption === q.correct;
      if (isCorrect) {
        coinsEarned += q.coins;
        correct++;
      }
      return {
        questionId: ans.questionId,
        isCorrect,
        correctAnswer: q ? q.correct : null,
        explanation: q ? q.explanation : ''
      };
    });

    // Award coins to user
    if (coinsEarned > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          virtualCoins: coinsEarned,
          totalQuizScore: correct,
          currentSeasonPoints: coinsEarned
        }
      });
    }

    // Award quiz master badge
    const user = await User.findById(req.user._id);
    if (user.totalQuizScore >= 5) {
      await awardBadge(req.user._id, 'Quiz Master', '🏆');
    }

    res.json({
      success: true,
      results,
      correct,
      total: answers.length,
      coinsEarned,
      isPerfect: correct === answers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SQUADS ──────────────────────────────────────────────

// @desc    Create squad
// @route   POST /api/battles/squads
const createSquad = async (req, res) => {
  try {
    const { name, emoji } = req.body;

    const squad = await Squad.create({
      name,
      emoji: emoji || '⚔️',
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'captain' }]
    });

    await squad.populate('members.user', 'name avatar finScore');
    res.status(201).json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my squad
// @route   GET /api/battles/squads/mine
const getMySquad = async (req, res) => {
  try {
    const squad = await Squad.findOne({ 'members.user': req.user._id })
      .populate('members.user', 'name avatar finScore currentStreak');

    if (!squad) return res.json({ success: true, squad: null });

    // Calculate squad fin score
    const memberScores = squad.members.map(m => m.user?.finScore || 500);
    squad.squadFinScore = Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length);
    await squad.save();

    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join squad
// @route   POST /api/battles/squads/join
const joinSquad = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const squad = await Squad.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!squad) return res.status(404).json({ success: false, message: 'Squad not found' });

    if (squad.members.length >= squad.maxMembers) {
      return res.status(400).json({ success: false, message: 'Squad is full (max 4 members)' });
    }

    const alreadyMember = squad.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'Already in this squad' });

    squad.members.push({ user: req.user._id, role: 'member' });
    await squad.save();
    await squad.populate('members.user', 'name avatar finScore');

    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBattle, getMyBattles, getBattleById,
  joinBattle, getCurrentSeason,
  getTodayQuiz, submitQuiz,
  createSquad, getMySquad, joinSquad
};