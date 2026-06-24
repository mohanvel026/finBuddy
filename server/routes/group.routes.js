// server/routes/group.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    createGroup, getMyGroups, getGroupById, updateGroup,
    joinGroup, archiveGroup, getSimplifiedDebts,
    getGroupAnalyticsData, setBudgetEnvelope, leaveGroup, getGroupActivity
} = require('../controllers/group.controller');

router.use(protect);

router.post('/', createGroup);
router.get('/', getMyGroups);
router.post('/join', joinGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', archiveGroup);
router.get('/:id/debts', getSimplifiedDebts);
router.get('/:id/analytics', getGroupAnalyticsData);
router.post('/:id/envelope', setBudgetEnvelope);
router.delete('/:id/leave', protect, leaveGroup);
router.get('/:id/activity', getGroupActivity);

module.exports = router;