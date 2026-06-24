const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    register,
    login,
    verifyOTP,
    sendOTP,
    toggle2FA,
    verifyEmail,
    googleCallback,
    googleMockLogin,
    getMe,
    logout,
    refreshToken
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const validate = require('../middleware/validate.middleware');

const registerSchema = {
  body: {
    name: { type: 'string', minLength: 2, required: true },
    email: { type: 'email', required: true },
    password: { type: 'string', minLength: 6, required: true }
  }
};

// Email auth
router.post('/register', validate(registerSchema), register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/verify-email/:token', verifyEmail);

// 2FA (protected)
router.post('/send-otp', protect, sendOTP);
router.put('/toggle-2fa', protect, toggle2FA);

// Google OAuth
router.get('/google/mock', googleMockLogin);
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

// Me & Logout
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/refresh', protect, refreshToken);

module.exports = router;