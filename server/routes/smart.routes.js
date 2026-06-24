// server/routes/smart.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth.middleware');
const {
  spendingDNA, fraudShield, costOfLivingRadar,
  billNegotiator, getSmartRoute, purchaseOracle,
  emiTrapDetector, impulseTherapist, newsCanceler,
  searchAddress,
  financialAutopsy,
  macroShockSimulation,
  debtRefinanceAnalysis,
  swpTaxAdvice
} = require('../controllers/smart.controller');

const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40,
  message: { success: false, message: 'Too many requests, please slow down.' }
});

router.use(protect);
router.use(aiLimiter);

router.post('/spending-dna',    spendingDNA);
router.post('/fraud-shield',    fraudShield);
router.post('/cost-of-living',  costOfLivingRadar);
router.post('/bill-negotiate',  billNegotiator);     // SSE streaming
router.post('/route',           getSmartRoute);
router.post('/purchase-oracle', purchaseOracle);
router.post('/emi-trap',        emiTrapDetector);
router.post('/impulse',         impulseTherapist);
router.post('/news-cancel',     newsCanceler);        // SSE streaming
router.get('/search-address',   searchAddress);

router.post('/autopsy',         financialAutopsy);
router.post('/macro-shock',     macroShockSimulation);
router.post('/debt-refinance',  debtRefinanceAnalysis);
router.post('/swp-tax-advice',  swpTaxAdvice);

module.exports = router;

