const UserActivity = require('../models/UserActivity');

const logActivity = async (userId, type, icon, text, details = '', metadata = {}) => {
  try {
    await UserActivity.create({ user: userId, type, icon, text, details, metadata });
    const count = await UserActivity.countDocuments({ user: userId });
    if (count > 50) {
      const oldest = await UserActivity.find({ user: userId })
        .sort({ createdAt: 1 })
        .limit(count - 50)
        .select('_id');
      await UserActivity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
    }
  } catch (e) {
    console.warn('logActivity failed:', e.message);
  }
};

module.exports = logActivity;
