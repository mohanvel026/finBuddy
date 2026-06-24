const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getSIPPortfolio,
  addSIP,
  updateSIP,
  deleteSIP,
  addLumpsum,
  addRedemption,
  updateGold,
  deleteLumpsum,
  deleteRedemption,
  importPortfolio,
  addStock,
  deleteStock,
  addUsStock,
  deleteUsStock,
  addCryptoHolding,
  deleteCryptoHolding
} = require('../controllers/sipPortfolio.controller');

router.use(protect);

router.get('/', getSIPPortfolio);
router.post('/sip', addSIP);
router.put('/sip/:sipId', updateSIP);
router.delete('/sip/:sipId', deleteSIP);
router.post('/sip/:sipId/lumpsum', addLumpsum);
router.delete('/sip/:sipId/lumpsum/:lumpsumId', deleteLumpsum);
router.post('/sip/:sipId/redemption', addRedemption);
router.delete('/sip/:sipId/redemption/:redemptionId', deleteRedemption);
router.put('/gold', updateGold);
router.post('/import', importPortfolio);

router.post('/stock', addStock);
router.delete('/stock/:stockId', deleteStock);

router.post('/us-stock', addUsStock);
router.delete('/us-stock/:stockId', deleteUsStock);

router.post('/crypto', addCryptoHolding);
router.delete('/crypto/:cryptoId', deleteCryptoHolding);


module.exports = router;
