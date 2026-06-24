const Group = require('../models/Group');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { minimizeDebts, getUserBalance, getGroupAnalytics } = require('../algorithms/debtMinimization');

// @desc    Create group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description, type, emoji, tripDetails } = req.body;

    const group = await Group.create({
      name,
      description,
      type: type || 'other',
      emoji: emoji || '👥',
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        trustScore: 100
      }],
      tripDetails: type === 'trip' ? tripDetails : undefined
    });

    await group.populate('members.user', 'name avatar email');

    res.status(201).json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my groups
// @route   GET /api/groups
const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isArchived: false
    })
      .populate('members.user', 'name avatar')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 });

    // Add user balance to each group
    const groupsWithBalance = await Promise.all(groups.map(async (group) => {
      const expenses = await Expense.find({ group: group._id });
      const myBalance = getUserBalance(expenses, req.user._id);
      return {
        ...group.toObject(),
        myBalance,
        expenseCount: expenses.length,
        totalSpent: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
      };
    }));

    res.json({ success: true, groups: groupsWithBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name avatar email finScore upiId')
      .populate('createdBy', 'name avatar');

    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Check membership
    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ group: group._id })
      .populate('paidBy', 'name avatar upiId')
      .populate('splits.user', 'name avatar upiId')
      .sort({ date: -1 });

    const memberIds = group.members.map(m => m.user._id);
    const simplifiedDebts = minimizeDebts(expenses, memberIds);

    // Populate fromUser and toUser details directly from the pre-populated group.members
    const memberMap = {};
    group.members.forEach(m => {
      if (m.user) {
        memberMap[m.user._id.toString()] = {
          _id: m.user._id,
          name: m.user.name,
          avatar: m.user.avatar,
          upiId: m.user.upiId
        };
      }
    });

    const populatedDebts = simplifiedDebts.map(debt => ({
      ...debt,
      fromUser: memberMap[debt.from] || { _id: debt.from, name: 'Group Member' },
      toUser: memberMap[debt.to] || { _id: debt.to, name: 'Group Member' }
    }));

    const myBalance = getUserBalance(expenses, req.user._id);
    const analytics = getGroupAnalytics(expenses);

    res.json({
      success: true,
      group,
      expenses,
      simplifiedDebts: populatedDebts,
      myBalance,
      analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin only' });

    const { name, description, emoji, tripDetails } = req.body;
    if (name) group.name = name;
    if (description) group.description = description;
    if (emoji) group.emoji = emoji;
    if (tripDetails) group.tripDetails = { ...group.tripDetails, ...tripDetails };

    await group.save();
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join group via invite code
// @route   POST /api/groups/join
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase(), isArchived: false });
    if (!group) return res.status(404).json({ success: false, message: 'Invalid invite code' });

    const alreadyMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ success: false, message: 'Already a member' });

    group.members.push({
      user: req.user._id,
      role: 'member',
      trustScore: 100
    });
    await group.save();

    await group.populate('members.user', 'name avatar');
    res.json({ success: true, message: 'Joined group!', group });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive group
// @route   DELETE /api/groups/:id
const archiveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin only' });

    group.isArchived = true;
    await group.save();

    res.json({ success: true, message: 'Group archived' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get simplified debts (graph algo result)
// @route   GET /api/groups/:id/debts
const getSimplifiedDebts = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const expenses = await Expense.find({ group: group._id });
    const memberIds = group.members.map(m => m.user);

    const rawTransactionCount = expenses.reduce((sum, e) =>
      sum + e.splits.filter(s => !s.isPaid).length, 0
    );

    const simplifiedDebts = minimizeDebts(expenses, memberIds);

    // Populate user details
    const populatedDebts = await Promise.all(
      simplifiedDebts.map(async (debt) => {
        const fromUser = await User.findById(debt.from).select('name avatar upiId');
        const toUser = await User.findById(debt.to).select('name avatar upiId');
        return { ...debt, fromUser, toUser };
      })
    );

    res.json({
      success: true,
      debts: populatedDebts,          // alias used by client Dijkstra
      simplifiedDebts: populatedDebts,
      rawTransactionCount,
      simplifiedCount: simplifiedDebts.length,
      transactionsSaved: rawTransactionCount - simplifiedDebts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group analytics
// @route   GET /api/groups/:id/analytics
const getGroupAnalyticsData = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const expenses = await Expense.find({
      group: req.params.id,
      date: { $gte: daysAgo }
    }).populate('paidBy', 'name avatar');

    const analytics = getGroupAnalytics(expenses);

    // Member spending breakdown
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name avatar');

    const memberSpending = group.members.map(member => {
      const paid = expenses
        .filter(e => e.paidBy?._id.toString() === member.user._id.toString())
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        user: member.user,
        amountPaid: paid,
        trustScore: member.trustScore
      };
    });

    res.json({
      success: true,
      analytics,
      memberSpending,
      period: parseInt(period)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Set budget envelope
// @route   POST /api/groups/:id/envelope
const setBudgetEnvelope = async (req, res) => {
  try {
    const { category, budgetAmount, month, year } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const existingIndex = group.budgetEnvelopes.findIndex(
      e => e.category === category && e.month === month && e.year === year
    );

    if (existingIndex >= 0) {
      group.budgetEnvelopes[existingIndex].budgetAmount = budgetAmount;
    } else {
      group.budgetEnvelopes.push({ category, budgetAmount, month, year, spentAmount: 0 });
    }

    await group.save();
    res.json({ success: true, budgetEnvelopes: group.budgetEnvelopes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const memberIndex = group.members.findIndex(
      m => m.user.toString() === req.user._id.toString()
    );
    if (memberIndex === -1) return res.status(400).json({ success: false, message: 'You are not a member of this group' });
    if (group.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'As admin, archive the group instead of leaving' });
    }

    // Check if the user has outstanding balances in the group
    const expenses = await Expense.find({ group: group._id });
    const myBalance = getUserBalance(expenses, req.user._id);
    if (Math.abs(myBalance) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `You cannot leave the group with outstanding balances. Current balance: ₹${myBalance > 0 ? '+' : ''}${myBalance.toFixed(2)}`
      });
    }

    group.members.splice(memberIndex, 1);
    await group.save();
    res.json({ success: true, message: 'You have left the group' });
  } catch (e) {
    console.error('leaveGroup error:', e);
    res.status(500).json({ success: false, message: 'Failed to leave group' });
  }
};

// @desc    Get group activity feed
// @route   GET /api/groups/:id/activity
const getGroupActivity = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const expenses = await Expense.find({ group: req.params.id })
      .populate('paidBy', 'name avatar')
      .populate('addedBy', 'name avatar')
      .populate('splits.user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const activities = expenses.map(e => {
      const events = [];
      // Expense added event
      events.push({
        type: 'expense_added',
        icon: '💸',
        text: `${e.addedBy?.name || e.paidBy?.name || 'Someone'} added "${e.description}" — ₹${e.amount.toLocaleString('en-IN')}`,
        actor: e.addedBy || e.paidBy,
        timestamp: e.createdAt,
        expenseId: e._id
      });
      // Settled splits
      e.splits.filter(s => s.isPaid && s.paidAt).forEach(s => {
        events.push({
          type: 'settlement',
          icon: '✅',
          text: `${s.user?.name || 'Someone'} settled ₹${s.amount.toLocaleString('en-IN')} for "${e.description}"`,
          actor: s.user,
          timestamp: s.paidAt,
          expenseId: e._id
        });
      });
      return events;
    }).flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  joinGroup,
  archiveGroup,
  getSimplifiedDebts,
  getGroupAnalyticsData,
  setBudgetEnvelope,
  leaveGroup,
  getGroupActivity
};