const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadReceipt } = require('../config/cloudinary');
const {
    addExpense, getGroupExpenses, updateExpense,
    deleteExpense, scanReceipt, settleExpense,
    raiseDispute, voteOnDispute,
    approveSettlement, rejectSettlement, getNotifications, markNotificationAsRead,
    remindDebtor
} = require('../controllers/expense.controller');
const { getExpenseAnalytics } = require('../controllers/strategy.controller');

const validate = require('../middleware/validate.middleware');

const expenseSchema = {
  body: {
    description: { type: 'string', required: true, minLength: 1 },
    amount: { type: 'number', required: true, min: 0.01 },
    groupId: { type: 'string', required: true }
  }
};

router.use(protect);

// Real DB analytics for SplitSmart dashboard
router.get('/analytics', getExpenseAnalytics);

router.post('/', validate(expenseSchema), addExpense);
router.get('/group/:id', getGroupExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/scan-receipt', uploadReceipt.single('receipt'), scanReceipt);
router.post('/settle', settleExpense);
router.post('/approve-settlement', approveSettlement);
router.post('/reject-settlement', rejectSettlement);
router.post('/remind', remindDebtor);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationAsRead);
router.post('/:id/dispute', raiseDispute);
router.post('/:id/vote', voteOnDispute);

module.exports = router;