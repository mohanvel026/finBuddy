const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../config/cloudinary');
const {
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
} = require('../controllers/user.controller');

router.use(protect); // All user routes are protected

router.get('/me', getMyProfile);
router.put('/me', uploadAvatar.single('avatar'), updateProfile);
router.get('/finscore', getFinScore);
router.get('/badges', getBadges);
router.post('/friend-request', sendFriendRequest);
router.put('/friend-accept', acceptFriendRequest);
router.put('/friend-decline', declineFriendRequest);
router.get('/friends', getFriends);
router.get('/leaderboard', getLeaderboard);
router.get('/peer-benchmark', getPeerBenchmark);
router.put('/fcm-token', updateFCMToken);
router.get('/referral', getReferralStats);
router.get('/search', searchUsers);
router.get('/roast/:friendId', getPeerRoast);

module.exports = router;