const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getRazorpayKey,
  createOrder,
  verifyPayment
} = require('../controllers/payment.controller');

router.use(protect); // All payment routes require authentication

router.get('/key', getRazorpayKey);
router.post('/order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
