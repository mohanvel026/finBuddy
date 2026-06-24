// server/routes/personality.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const { analyzeSpendingPersonality } = require('../algorithms/spendingPersonality');

router.use(protect);

// @desc    Get spending personality
// @route   GET /api/personality
router.get('/', async (req, res) => {
    try {
        // Get all user's expenses across all groups
        const groups = await Group.find({ 'members.user': req.user._id });
        const groupIds = groups.map(g => g._id);

        const expenses = await Expense.find({
            group: { $in: groupIds },
            paidBy: req.user._id
        });

        const result = analyzeSpendingPersonality(expenses);

        if (result) {
            // Save personality to user
            await User.findByIdAndUpdate(req.user._id, {
                spendingPersonality: result.personality
            });
        }

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get friends personality comparison
// @route   GET /api/personality/compare
router.get('/compare', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('friends', 'name avatar spendingPersonality');

        const comparison = user.friends.map(f => ({
            name: f.name,
            avatar: f.avatar,
            personality: f.spendingPersonality || 'Unknown',
            emoji: { Foodie: '🍕', Traveller: '✈️', Saver: '💰', Impulsive: '🛍️', Balanced: '⚖️' }[f.spendingPersonality] || '❓'
        }));

        res.json({
            success: true,
            myPersonality: user.spendingPersonality,
            friendsPersonalities: comparison
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;