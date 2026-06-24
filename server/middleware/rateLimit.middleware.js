// server/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimit = createRateLimit(15 * 60 * 1000, 200, 'Too many requests, please try again later.');
const authLimit = createRateLimit(15 * 60 * 1000, 15, 'Too many auth attempts, please try again later.');
const aiLimit = createRateLimit(60 * 1000, 10, 'Too many AI requests, please wait a moment.');
const tradeLimit = createRateLimit(60 * 1000, 30, 'Too many trade requests, please slow down.');

module.exports = { generalLimit, authLimit, aiLimit, tradeLimit };
