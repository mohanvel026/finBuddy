const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { runStrategy, getSavedStrategies, saveStrategy, deleteStrategy } = require('../controllers/strategy.controller');

router.use(protect);

// POST /api/strategy/run
router.post('/run', runStrategy);

// Strategy Library (Save & Load)
router.get('/library', getSavedStrategies);
router.post('/library', saveStrategy);
router.delete('/library/:id', deleteStrategy);

module.exports = router;
