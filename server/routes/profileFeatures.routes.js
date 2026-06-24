const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getVaults, createVault, contributeToVault,
  getDebts, createDebt, settleDebt,
  getDuels, createDuel, resolveDuel,
  getChallenges, createChallenge, acceptChallenge, claimChallenge
} = require('../controllers/profileFeatures.controller');

router.use(protect);

router.get('/vaults', getVaults);
router.post('/vaults', createVault);
router.post('/vaults/:id/contribute', contributeToVault);

router.get('/debts', getDebts);
router.post('/debts', createDebt);
router.delete('/debts/:id/settle', settleDebt);

router.get('/duels', getDuels);
router.post('/duels', createDuel);
router.post('/duels/:id/resolve', resolveDuel);

router.get('/challenges', getChallenges);
router.post('/challenges', createChallenge);
router.post('/challenges/:id/accept', acceptChallenge);
router.post('/challenges/:id/claim', claimChallenge);

module.exports = router;
