const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    createBattle, getMyBattles, getBattleById,
    joinBattle, getCurrentSeason,
    getTodayQuiz, submitQuiz,
    createSquad, getMySquad, joinSquad
} = require('../controllers/battle.controller');

router.use(protect);

// Battles
router.post('/', createBattle);
router.get('/', getMyBattles);
router.post('/join', joinBattle);
router.get('/season/current', getCurrentSeason);

// Quiz
router.get('/quiz/today', getTodayQuiz);
router.post('/quiz/submit', submitQuiz);

// Squads
router.post('/squads', createSquad);
router.get('/squads/mine', getMySquad);
router.post('/squads/join', joinSquad);

// Must be last (param route)
router.get('/:id', getBattleById);

module.exports = router;