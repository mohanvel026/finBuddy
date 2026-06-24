const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  buyStock, sellStock, getPortfolio, getTradeHistory,
  getTradingJournal, addReasoning, getWatchlist,
  addToWatchlist, removeFromWatchlist, setPriceAlert,
  calculateOptionsPrice, createOrder, verifyPayment, buyMutualFund,
  setStopLossTarget,
  getLimitOrders, placeLimitOrder, cancelLimitOrder,
  getShortPositions, openShortPosition, coverShortPosition
} = require('../controllers/trade.controller');
const { getIPOs, applyForIPO } = require('../controllers/ipo.controller');

const validate = require('../middleware/validate.middleware');

const buyMutualFundSchema = {
  body: {
    schemeCode: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 1 }
  }
};

const openShortPositionSchema = {
  body: {
    symbol: { type: 'string', required: true },
    quantity: { type: 'number', required: true, min: 1 }
  }
};

const placeLimitOrderSchema = {
  body: {
    symbol: { type: 'string', required: true },
    quantity: { type: 'number', required: true, min: 1 },
    limitPrice: { type: 'number', required: true, min: 0.01 },
    tradeType: { type: 'string', required: true }
  }
};

router.use(protect);

router.get('/portfolio', getPortfolio);
router.get('/history', getTradeHistory);
router.get('/journal', getTradingJournal);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.post('/buy-mutual-fund', validate(buyMutualFundSchema), buyMutualFund);
router.put('/:id/reasoning', addReasoning);
router.put('/holdings/:symbol/limits', setStopLossTarget);
router.get('/watchlist', getWatchlist);
router.post('/watchlist', addToWatchlist);
router.delete('/watchlist/:symbol', removeFromWatchlist);
router.post('/alert', setPriceAlert);
router.post('/options-price', calculateOptionsPrice);
router.get('/ipo', getIPOs);
router.post('/ipo/apply', applyForIPO);
router.post('/razorpay/order', createOrder);
router.post('/razorpay/verify', verifyPayment);

router.get('/limit-orders', getLimitOrders);
router.post('/limit-orders', validate(placeLimitOrderSchema), placeLimitOrder);
router.delete('/limit-orders/:id', cancelLimitOrder);
router.get('/short-positions', getShortPositions);
router.post('/short-positions', validate(openShortPositionSchema), openShortPosition);
router.post('/short-positions/:id/cover', coverShortPosition);

module.exports = router;