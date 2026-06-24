const CoopVault = require('../models/CoopVault');
const DebtTracker = require('../models/DebtTracker');
const User = require('../models/User');
const StockDuel = require('../models/StockDuel');
const MoneyChallenge = require('../models/MoneyChallenge');
const logActivity = require('../utils/logActivity');

const getVaults = async (req, res) => {
  try {
    const vaults = await CoopVault.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (vaults.length === 0) {
      const seeded = await CoopVault.create([
        { user: req.user._id, name: 'Goa Trip Piggy Bank 🌴', target: 25000, saved: 12000, youContributed: 3000, members: ['You', 'Vikram', 'Kriti'] },
        { user: req.user._id, name: 'Flat Rent Rent-Sync 🏠', target: 40000, saved: 20000, youContributed: 5000, members: ['You', 'Vikram'] }
      ]);
      return res.json({ success: true, vaults: seeded });
    }
    res.json({ success: true, vaults });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createVault = async (req, res) => {
  try {
    const { name, target, members } = req.body;
    const vault = await CoopVault.create({
      user: req.user._id,
      name,
      target: parseFloat(target),
      members: members || ['You']
    });
    res.json({ success: true, vault });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const contributeToVault = async (req, res) => {
  try {
    const { amount } = req.body;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ success: false, message: 'Invalid contribution amount' });

    const user = await User.findById(req.user._id);
    if (user.virtualWallet < amt) {
      return res.status(400).json({ success: false, message: 'Insufficient virtual wallet balance' });
    }

    const vault = await CoopVault.findOne({ _id: req.params.id, user: req.user._id });
    if (!vault) return res.status(404).json({ success: false, message: 'Vault not found' });

    user.virtualWallet -= amt;
    await user.save();

    vault.saved += amt;
    vault.youContributed += amt;
    await vault.save();

    await logActivity(req.user._id, 'goal', '💰', `Contributed ₹${amt.toLocaleString('en-IN')} to "${vault.name}"`, `Saved: ₹${vault.saved}`);

    res.json({ success: true, vault, walletBalance: user.virtualWallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDebts = async (req, res) => {
  try {
    const debts = await DebtTracker.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (debts.length === 0) {
      const seeded = await DebtTracker.create([
        { user: req.user._id, friendName: 'Vikram', type: 'lent', amount: 450, reason: 'Nandos Dinner split' },
        { user: req.user._id, friendName: 'Kriti', type: 'borrowed', amount: 200, reason: 'Starbucks coffee' }
      ]);
      return res.json({ success: true, debts: seeded });
    }
    res.json({ success: true, debts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDebt = async (req, res) => {
  try {
    const { friendName, type, amount, reason } = req.body;
    const debt = await DebtTracker.create({
      user: req.user._id,
      friendName,
      type,
      amount: parseFloat(amount),
      reason
    });

    await logActivity(req.user._id, 'expense', '💸', `Logged debt: ${type === 'lent' ? 'Lent' : 'Borrowed'} ₹${amount} ${type === 'lent' ? 'to' : 'from'} ${friendName}`, reason);

    res.json({ success: true, debt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const settleDebt = async (req, res) => {
  try {
    const debt = await DebtTracker.findOne({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ success: false, message: 'Debt record not found' });

    await logActivity(req.user._id, 'settlement', '🤝', `Settled ₹${debt.amount} with ${debt.friendName}`, `Settle reason: ${debt.reason}`);

    await DebtTracker.findByIdAndDelete(debt._id);

    res.json({ success: true, message: 'Debt settled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDuels = async (req, res) => {
  try {
    const duels = await StockDuel.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (duels.length === 0) {
      const seeded = await StockDuel.create([
        { user: req.user._id, ticker: 'RELIANCE', direction: 'UP', friendName: 'Vikram', friendDirection: 'DOWN', betCoins: 20, status: 'active', percentageChange: '+1.2%', durationLeft: '18h 45m' },
        { user: req.user._id, ticker: 'TCS', direction: 'DOWN', friendName: 'Kriti', friendDirection: 'UP', betCoins: 50, status: 'active', percentageChange: '-0.8%', durationLeft: '22h 10m' }
      ]);
      return res.json({ success: true, duels: seeded });
    }
    res.json({ success: true, duels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDuel = async (req, res) => {
  try {
    const { ticker, direction, friendName, betCoins } = req.body;
    const coins = parseInt(betCoins);
    if (isNaN(coins) || coins <= 0) return res.status(400).json({ success: false, message: 'Invalid coins wager' });

    const user = await User.findById(req.user._id);
    if (user.virtualCoins < coins) {
      return res.status(400).json({ success: false, message: 'Insufficient virtual coins balance' });
    }

    user.virtualCoins -= coins;
    await user.save();

    const duel = await StockDuel.create({
      user: req.user._id,
      ticker,
      direction,
      friendName,
      friendDirection: direction === 'UP' ? 'DOWN' : 'UP',
      betCoins: coins,
      status: 'active',
      percentageChange: '+0.0%',
      durationLeft: '24h 00m'
    });

    await logActivity(req.user._id, 'trade', '⚔️', `Challenged ${friendName} to a ${ticker} Duel for 🪙${coins}`, `Stock duel status: active`);

    res.json({ success: true, duel, coinsBalance: user.virtualCoins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveDuel = async (req, res) => {
  try {
    const duel = await StockDuel.findOne({ _id: req.params.id, user: req.user._id });
    if (!duel) return res.status(404).json({ success: false, message: 'Duel not found' });
    if (duel.status === 'resolved') return res.status(400).json({ success: false, message: 'Duel already resolved' });

    const isPlayerWinner = (duel.direction === 'UP' && duel.percentageChange.startsWith('+')) ||
                           (duel.direction === 'DOWN' && duel.percentageChange.startsWith('-'));

    const user = await User.findById(req.user._id);
    let reward = 0;
    if (isPlayerWinner) {
      reward = duel.betCoins * 2;
      user.virtualCoins += reward;
      await user.save();
      await logActivity(req.user._id, 'trade', '🏆', `Won Stock Duel vs ${duel.friendName} (+🪙${reward})`, `Stock duel resolved`);
    } else {
      await logActivity(req.user._id, 'trade', '😢', `Lost Stock Duel vs ${duel.friendName} (-🪙${duel.betCoins})`, `Stock duel resolved`);
    }

    duel.status = 'resolved';
    await duel.save();

    res.json({ success: true, duel, won: isPlayerWinner, reward, coinsBalance: user.virtualCoins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChallenges = async (req, res) => {
  try {
    const challenges = await MoneyChallenge.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (challenges.length === 0) {
      const seeded = await MoneyChallenge.create([
        { user: req.user._id, title: 'No-Spend Weekend 🚫', desc: 'Keep spendings under ₹500 from Sat to Sun', wager: 10, reward: 20, friendName: 'Vikram', status: 'pending', progress: 'Waiting buddy approval' },
        { user: req.user._id, title: 'Quiz Streak Master 🏆', desc: 'Be the first to hit a 10-day quiz streak', wager: 25, reward: 50, friendName: 'Kriti', status: 'active', progress: 'You: 4d vs Kriti: 6d' }
      ]);
      return res.json({ success: true, challenges: seeded });
    }
    res.json({ success: true, challenges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createChallenge = async (req, res) => {
  try {
    const { title, desc, wager, friendName } = req.body;
    const coins = parseInt(wager);
    if (isNaN(coins) || coins <= 0) return res.status(400).json({ success: false, message: 'Invalid wager' });

    const user = await User.findById(req.user._id);
    if (user.virtualCoins < coins) {
      return res.status(400).json({ success: false, message: 'Insufficient virtual coins balance' });
    }

    user.virtualCoins -= coins;
    await user.save();

    const challenge = await MoneyChallenge.create({
      user: req.user._id,
      title,
      desc: desc || (title.includes('No-Spend') ? 'Keep spendings under ₹500 from Sat to Sun' : 'Highest portfolio return in 7 days'),
      wager: coins,
      reward: coins * 2,
      friendName,
      status: 'pending',
      progress: 'Waiting buddy approval'
    });

    await logActivity(req.user._id, 'badge', '🎯', `Proposed "${title}" challenge to ${friendName} for 🪙${coins}`, `Money challenge created`);

    res.json({ success: true, challenge, coinsBalance: user.virtualCoins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptChallenge = async (req, res) => {
  try {
    const challenge = await MoneyChallenge.findOne({ _id: req.params.id, user: req.user._id });
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (challenge.status !== 'pending') return res.status(400).json({ success: false, message: 'Challenge already accepted or completed' });

    challenge.status = 'active';
    challenge.progress = `You: 0d vs ${challenge.friendName}: 0d`;
    await challenge.save();

    await logActivity(req.user._id, 'badge', '🏁', `Accepted challenge: "${challenge.title}" vs ${challenge.friendName}`, `Money challenge accepted`);

    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const claimChallenge = async (req, res) => {
  try {
    const challenge = await MoneyChallenge.findOne({ _id: req.params.id, user: req.user._id });
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (challenge.status !== 'active') return res.status(400).json({ success: false, message: 'Challenge must be active to claim reward' });

    const user = await User.findById(req.user._id);
    user.virtualCoins += challenge.reward;
    await user.save();

    challenge.status = 'claimed';
    await challenge.save();

    await logActivity(req.user._id, 'badge', '🏆', `Claimed reward for "${challenge.title}" (+🪙${challenge.reward})`, `Challenge completed`);

    res.json({ success: true, challenge, coinsBalance: user.virtualCoins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVaults, createVault, contributeToVault,
  getDebts, createDebt, settleDebt,
  getDuels, createDuel, resolveDuel,
  getChallenges, createChallenge, acceptChallenge, claimChallenge
};
