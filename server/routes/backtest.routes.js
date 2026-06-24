const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getBacktestChart, executeBacktestTrade, getBacktestHistory, saveBacktestTrade, searchSymbols } = require('../controllers/backtest.controller');

router.use(protect);

router.get('/chart', getBacktestChart);
router.post('/trade', executeBacktestTrade);
router.get('/history', getBacktestHistory);
router.post('/save', saveBacktestTrade);
router.get('/search', searchSymbols);

module.exports = router;
