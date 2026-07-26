// server/jobs/index.js
const cron = require('node-cron');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Group = require('../models/Group');
const { sendEmail } = require('../utils/sendEmail');
const marketService = require('../utils/marketService');


const startJobs = () => {

  // ─── Job 1: Debt reminders — DISABLED (was spamming users) ───
  // To re-enable: uncomment the cron.schedule block below
  // cron.schedule('0 9 * * *', async () => { ... });


  // ─── Job 2: Weekly financial summary — DISABLED (was spamming users) ───
  // To re-enable: uncomment the cron.schedule block below
  // cron.schedule('0 8 * * 1', async () => { ... });


  // ─── Job 3: Update FinScores daily at midnight ───
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Updating FinScores...');
    try {
      const { calculateFinScore } = require('../algorithms/finScore');
      const users = await User.find({ isActive: true }).select('_id');
      for (const user of users) {
        await calculateFinScore(user._id);
      }
      console.log(`✅ FinScores updated for ${users.length} users`);
    } catch (err) {
      console.error('FinScore update job error:', err.message);
    }
  });

  // ─── Job 4: Reset daily streak if user missed a day ───
  cron.schedule('0 1 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Users who haven't logged in yesterday or today
      await User.updateMany(
        {
          lastActiveDate: { $lt: yesterday },
          currentStreak: { $gt: 0 }
        },
        { $set: { currentStreak: 0 } }
      );
      console.log('✅ Streaks reset for inactive users');
    } catch (err) {
      console.error('Streak reset error:', err.message);
    }
  });

  // ─── Job 5: SIP auto-invest on scheduled dates ───
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Running SIP auto-invest job...');
    try {
      const Portfolio = require('../models/Portfolio');
      const axios = require('axios');
      const portfolios = await Portfolio.find({
        'mutualFunds.isSIPActive': true,
        'mutualFunds.nextSIPDate': { $lte: new Date() }
      });
      for (const portfolio of portfolios) {
        let portfolioChanged = false;
        for (let i = 0; i < portfolio.mutualFunds.length; i++) {
          const fund = portfolio.mutualFunds[i];
          if (!fund.isSIPActive || !fund.nextSIPDate || fund.nextSIPDate > new Date()) continue;
          
          const user = await User.findById(portfolio.user);
          if (!user) continue;

          if (user.virtualWallet < fund.sipAmount) {
            try {
              const Notification = require('../models/Notification');
              const logActivity = require('../utils/logActivity');
              const msg = `🚨 SIP Failed: Insufficient funds for your SIP of ₹${fund.sipAmount.toLocaleString('en-IN')} in ${fund.schemeName}. Please top up your virtual wallet.`;
              
              await Notification.create({
                recipient: user._id,
                type: 'general',
                message: msg
              });

              await logActivity(
                user._id,
                'sip',
                '⚠️',
                `SIP Auto-Invest Failed`,
                `Insufficient balance (Required: ₹${fund.sipAmount.toFixed(2)}, Available: ₹${user.virtualWallet.toFixed(2)}) for ${fund.schemeName}`
              );

              // Reschedule to next month to avoid spamming the user daily
              const next = new Date(fund.nextSIPDate);
              next.setMonth(next.getMonth() + 1);
              portfolio.mutualFunds[i].nextSIPDate = next;
              portfolioChanged = true;
            } catch (err) {
              console.warn('Failed to handle SIP failure notifications:', err.message);
            }
            continue;
          }
          let nav = fund.currentNAV || 100;
          try {
            const navRes = await axios.get(`https://api.mfapi.in/mf/${fund.schemeCode}`, { timeout: 5000 });
            if (navRes.data?.data?.[0]) nav = parseFloat(navRes.data.data[0].nav);
          } catch (e) {}
          const units = fund.sipAmount / nav;
          user.virtualWallet -= fund.sipAmount;
          await user.save();
          portfolio.mutualFunds[i].units += units;
          portfolio.mutualFunds[i].currentNAV = nav;
          portfolio.mutualFunds[i].currentValue = portfolio.mutualFunds[i].units * nav;
          portfolio.mutualFunds[i].investedAmount += fund.sipAmount;
          const next = new Date(fund.nextSIPDate);
          next.setMonth(next.getMonth() + 1);
          portfolio.mutualFunds[i].nextSIPDate = next;
          portfolioChanged = true;
        }
        if (portfolioChanged) {
          portfolio.markModified('mutualFunds');
          await portfolio.save();
        }
      }
      console.log('✅ SIP auto-invest complete');
    } catch (err) {
      console.error('SIP error:', err.message);
    }
  });

  // ─── Job 6: Check price alerts every 15 minutes ───
  cron.schedule('*/15 * * * *', async () => {
    try {
      const Watchlist = require('../models/Watchlist');
      const { sendPushNotification } = require('../utils/pushNotification');
      const watchlists = await Watchlist.find({
        'stocks.alerts': { $elemMatch: { isTriggered: false } }
      }).populate({ path: 'user', select: 'fcmToken' });
      for (const wl of watchlists) {
        const symbols = wl.stocks.map(s => s.symbol);
        let quotes = [];
        try {
          quotes = await marketService.getMultipleLiveQuotes(symbols);
        } catch (e) { continue; }
        let changed = false;
        for (let si = 0; si < wl.stocks.length; si++) {
          const stock = wl.stocks[si];
          const quote = quotes.find(q => q.symbol.toUpperCase() === stock.symbol.toUpperCase() || q.yahooSymbol.toUpperCase() === stock.symbol.toUpperCase());
          if (!quote) continue;
          const price = quote.price;
          for (let ai = 0; ai < stock.alerts.length; ai++) {
            const alert = stock.alerts[ai];
            if (alert.isTriggered) continue;
            const triggered = (alert.type === 'above' && price >= alert.price) || (alert.type === 'below' && price <= alert.price);
            if (triggered) {
              wl.stocks[si].alerts[ai].isTriggered = true;
              wl.stocks[si].alerts[ai].triggeredAt = new Date();
              changed = true;
              if (wl.user?.fcmToken) {
                await sendPushNotification({
                  fcmToken: wl.user.fcmToken,
                  title: `📈 Alert: ${stock.symbol}`,
                  body: `${stock.symbol} hit ₹${price.toFixed(2)} (${alert.type} ₹${alert.price})`,
                  data: { symbol: stock.symbol }
                });
              }
            }
          }
        }
        if (changed) await wl.save();
      }
    } catch (err) {
      console.error('Price alert error:', err.message);
    }
  });

  console.log('✅ All cron jobs started');
};

module.exports = { startJobs };