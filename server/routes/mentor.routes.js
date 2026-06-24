// server/routes/mentor.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    askMentor, getWeeklyReport, whatIfSimulator,
    getFinancialTwin, getLessons, completeLesson, getTaxEstimate,
    portfolioRiskAnalysis,
    getChatSessions, getChatSessionById, createChatSession, deleteChatSession,
    saveLearnProgress, getLearnProgress
} = require('../controllers/mentor.controller');

router.use(protect);

router.post('/ask', askMentor);
router.get('/weekly-report', getWeeklyReport);
router.post('/whatif', whatIfSimulator);
router.get('/financial-twin', getFinancialTwin);
router.get('/lessons', getLessons);
router.post('/lesson-complete', completeLesson);
router.get('/tax-estimate', getTaxEstimate);
router.post('/portfolio-risk', portfolioRiskAnalysis);

// Chat Sessions endpoints
router.get('/chat-sessions', getChatSessions);
router.get('/chat-sessions/:sessionId', getChatSessionById);
router.post('/chat-sessions', createChatSession);
router.delete('/chat-sessions/:sessionId', deleteChatSession);

// Learn progress sync (DB-backed resume from where you left off)
router.get('/learn-progress', getLearnProgress);
router.post('/learn-progress', saveLearnProgress);

module.exports = router;