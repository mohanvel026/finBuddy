const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
require('dotenv').config();

const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const expenseRoutes = require('./routes/expense.routes');
const marketRoutes = require('./routes/market.routes');
const tradeRoutes = require('./routes/trade.routes');
const battleRoutes = require('./routes/battle.routes');
const mentorRoutes = require('./routes/mentor.routes');
const wealthRoutes = require('./routes/wealth.routes');
const tripRoutes = require('./routes/trip.routes');
const personalityRoutes = require('./routes/personality.routes');
const pdfRoutes = require('./routes/pdf.routes');
const strategyRoutes = require('./routes/strategy.routes');
const backtestRoutes = require('./routes/backtest.routes');
const notificationRoutes = require('./routes/notification.routes');
const smartRoutes = require('./routes/smart.routes');
const photoRoutes = require('./routes/photo.routes');
const mfRoutes = require('./routes/mf.routes');
const learnRoutes = require('./routes/learn.routes');
const sipPortfolioRoutes = require('./routes/sipPortfolio.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const activityRoutes = require('./routes/activity.routes');
const profileFeaturesRoutes = require('./routes/profileFeatures.routes');

connectDB();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "ws://localhost:*"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5177',
  'http://localhost:5179',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5179'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 📝 Structured Request-Response Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API Log] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 🛡️ MongoDB NoSQL Injection Prevention Middleware

app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (let key in obj) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// ⏱️ Production-Grade Security Rate Limiters
const apiLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Brute-force protection: Too many login attempts, please try again in 15 minutes.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// 🛡️ JSON Payload Size Limiting (DoS buffer prevention)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'OK', message: '💰 FinBuddy API running!' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/wealth', wealthRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/personality', personalityRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/smart', smartRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/mf', mfRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/sip-portfolio', sipPortfolioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/profile-features', profileFeaturesRoutes);


app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

module.exports = app;