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


  // ─── Job 2: Weekly FinBuddy Summary — every Monday at 9am IST ───
  // Only sends to users who: (1) opted in to email notifications,
  // (2) have been active in the past 7 days, (3) have actual data to show.
  cron.schedule('30 3 * * 1', async () => {
    // 03:30 UTC = 09:00 IST every Monday
    console.log('⏰ Running weekly summary email job...');
    let sent = 0;
    let skipped = 0;
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Only users who explicitly opted in to email notifications
      const users = await User.find({
        'notifications.email': true,
        isActive: true,
        lastActiveDate: { $gte: oneWeekAgo } // Only active users this week
      }).select('name email finScore currentStreak _id');

      for (const user of users) {
        try {
          const groups = await Group.find({ 'members.user': user._id });
          const groupIds = groups.map(g => g._id);

          const weekExpenses = await Expense.find({
            group: { $in: groupIds },
            createdAt: { $gte: oneWeekAgo }
          });

          const totalSpent = weekExpenses
            .filter(e => e.splits?.some(s => s.user?.toString() === user._id.toString()))
            .reduce((sum, e) => {
              const mySplit = e.splits.find(s => s.user?.toString() === user._id.toString());
              return sum + (mySplit?.amount || 0);
            }, 0);

          // Skip users with no activity this week
          if (totalSpent === 0 && groups.length === 0) { skipped++; continue; }

          const clientUrl = process.env.CLIENT_URL || 'https://finbuddy.launchlive.in';
          const unsubUrl  = `${clientUrl}/profile`; // User can toggle off in Profile > Notifications

          await sendEmail({
            to: user.email,
            subject: `📊 Your FinBuddy Weekly Wrap — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08080f;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:36px;margin-bottom:4px">💰</div>
      <h1 style="margin:0;font-size:22px;font-weight:900;background:linear-gradient(135deg,#22d3ee,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">FinBuddy</h1>
      <p style="margin:6px 0 0;color:#64748b;font-size:13px">Your weekly financial wrap</p>
    </div>

    <!-- Greeting -->
    <div style="background:linear-gradient(135deg,rgba(34,211,238,0.08),rgba(129,140,248,0.08));border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;margin-bottom:16px">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:13px">Hey ${user.name?.split(' ')[0] || 'there'} 👋</p>
      <p style="margin:0;color:#e2e8f0;font-size:15px;line-height:1.6">Here's your FinBuddy summary for the week of <strong style="color:#22d3ee">${new Date(oneWeekAgo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.</p>
    </div>

    <!-- Stats Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#22d3ee">₹${(totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div style="color:#64748b;font-size:11px;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Week's Split</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#818cf8">${groups.length}</div>
        <div style="color:#64748b;font-size:11px;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Active Groups</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#f59e0b">${user.finScore || 0}</div>
        <div style="color:#64748b;font-size:11px;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">FinScore</div>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#10b981">🔥 ${user.currentStreak || 0}</div>
        <div style="color:#64748b;font-size:11px;margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Day Streak</div>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:24px 0">
      <a href="${clientUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#818cf8);color:#08080f;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:900;font-size:14px;letter-spacing:0.3px">
        View Full Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;margin-top:8px">
      <p style="margin:0;color:#334155;font-size:11px;line-height:1.8">
        You're receiving this because you enabled weekly summaries in FinBuddy.<br>
        <a href="${unsubUrl}" style="color:#22d3ee;text-decoration:none">Unsubscribe</a> · 
        <a href="${clientUrl}" style="color:#22d3ee;text-decoration:none">Open App</a>
      </p>
    </div>

  </div>
</body>
</html>
            `
          });
          sent++;
        } catch (e) {
          console.warn(`Weekly email failed for ${user.email}:`, e.message);
        }
      }
      console.log(`✅ Weekly summary: ${sent} sent, ${skipped} skipped (no activity).`);
    } catch (err) {
      console.error('Weekly summary job error:', err.message);
    }
  });



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