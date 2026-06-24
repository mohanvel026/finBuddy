const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { 
  getNetWorth, getEMIs, addEMI, deleteEMI, calculateEMIRoute, addCrypto,
  getGoals, addGoal, updateGoal, deleteGoal, mirrorPortfolio
} = require('../controllers/wealth.controller');

router.use(protect);

router.get('/networth', getNetWorth);
router.get('/emi', getEMIs);
router.post('/emi', addEMI);
router.delete('/emi/:id', deleteEMI);
router.post('/emi/calculate', calculateEMIRoute);
router.post('/crypto', addCrypto);
router.post('/mirror', mirrorPortfolio);

// Goals
router.get('/goals', getGoals);
router.post('/goals', addGoal);
router.put('/goals/:id', updateGoal);
router.delete('/goals/:id', deleteGoal);

module.exports = router;