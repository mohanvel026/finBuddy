const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

let razorpayInstance = null;
const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('dummy') || !process.env.RAZORPAY_KEY_SECRET;

if (!isMock) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('⚠️ Failed to initialize Razorpay. Falling back to sandbox simulator.', err.message);
  }
}

// @desc    Get Razorpay Key ID
// @route   GET /api/payments/key
// @access  Private
const getRazorpayKey = async (req, res) => {
  res.json({
    key: isMock ? 'rzp_test_mockkey123' : process.env.RAZORPAY_KEY_ID,
    isMock
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // In INR, e.g. 299
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Please provide amount' });
    }

    const orderOptions = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    if (isMock || !razorpayInstance) {
      // Mock order for dev sandbox
      const mockOrder = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        entity: 'order',
        amount: orderOptions.amount,
        amount_paid: 0,
        amount_due: orderOptions.amount,
        currency: 'INR',
        receipt: orderOptions.receipt,
        status: 'created',
        attempts: 0,
        notes: [],
        created_at: Math.floor(Date.now() / 1000),
        isMock: true
      };

      return res.json({ success: true, order: mockOrder });
    }

    const order = await razorpayInstance.orders.create(orderOptions);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Payment Signature & Upgrade to Premium
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMockPayment } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    if (isMock || isMockPayment || !razorpayInstance) {
      // Simulated signature match for developer testing
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { isPremium: true },
        { new: true }
      );
      return res.json({
        success: true,
        message: 'Payment verified successfully! Welcome to FinBuddy Elite 💎',
        isPremium: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium
        }
      });
    }

    // Real signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { isPremium: true },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Payment verified successfully! Welcome to FinBuddy Elite 💎',
        isPremium: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRazorpayKey,
  createOrder,
  verifyPayment
};
