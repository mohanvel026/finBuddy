// server/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/pushNotification');

router.use(protect);

// @desc    Get user notifications (in-app)
// @route   GET /api/notifications
router.get('/', async (req, res) => {
  try {
    // Return recent activity as notifications
    const Trade = require('../models/Trade');
    const Expense = require('../models/Expense');
    const Group = require('../models/Group');

    const [recentTrades, groups] = await Promise.all([
      Trade.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(5),
      Group.find({ 'members.user': req.user._id }).limit(5)
    ]);

    const notifications = [
      ...recentTrades.map(t => ({
        id: t._id,
        type: 'trade',
        title: `${t.tradeType} ${t.symbol}`,
        body: `${t.quantity} shares @ ₹${t.price?.toFixed(2)} — ${t.profitLoss > 0 ? '📈 Profit' : t.profitLoss < 0 ? '📉 Loss' : 'Open'}`,
        time: t.timestamp,
        read: false
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Send test push notification
// @route   POST /api/notifications/test
router.post('/test', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.fcmToken) {
      return res.status(400).json({ success: false, message: 'No FCM token. Enable notifications in browser first.' });
    }
    await sendPushNotification({
      fcmToken: user.fcmToken,
      title: '💰 FinBuddy Test',
      body: 'Push notifications are working! 🎉',
      data: { type: 'test' }
    });
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update FCM token
// @route   PUT /api/notifications/fcm
router.put('/fcm', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
