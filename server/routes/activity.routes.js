const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const UserActivity = require('../models/UserActivity');

router.use(protect);

// GET /api/activity — fetch last 30 activities for logged-in user
router.get('/', async (req, res) => {
  try {
    const activities = await UserActivity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json({ success: true, activities });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load activities' });
  }
});

// POST /api/activity — manually log an activity event
router.post('/', async (req, res) => {
  try {
    const { type, icon, text, details, metadata } = req.body;
    const activity = await UserActivity.create({
      user: req.user._id,
      type,
      icon,
      text,
      details,
      metadata
    });
    res.json({ success: true, activity });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to log activity' });
  }
});

module.exports = router;
