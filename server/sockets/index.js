const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const marketService = require('../utils/marketService');

let io;
let activeLobbies = [];

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all localhost ports or matched CLIENT_URL
        const allowedPattern = /^http:\/\/localhost(:\d+)?$/;
        if (!origin || allowedPattern.test(origin) || origin === process.env.CLIENT_URL) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for Socket.io (Supports both registered tokens and guest inviteCodes)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const inviteCode = socket.handshake.auth.inviteCode;

      // Guest Authorization
      if (!token && inviteCode) {
        const Group = require('../models/Group');
        const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
        if (!group) return next(new Error('Invalid trip invite code'));

        socket.userId = `guest-${socket.id}`;
        socket.userName = 'Guest';
        socket.userAvatar = '';
        socket.userFinScore = 0;
        socket.isGuest = true;
        socket.inviteCode = inviteCode.toUpperCase();
        return next();
      }

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name avatar finScore');
      if (!user) return next(new Error('User not found'));

      socket.userId = decoded.id;
      socket.userName = user.name;
      socket.userAvatar = user.avatar;
      socket.userFinScore = user.finScore;
      socket.isGuest = false;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.userName} (${socket.userId})${socket.isGuest ? ' [GUEST]' : ''}`);

    // Auto-join personal room for direct notifications (members only)
    if (!socket.isGuest) {
      socket.join(`user-${socket.userId}`);
    }

    // ---- GROUP ALBUM ROOM EVENTS (TripPhotoVault) ----
    socket.on('group:join', ({ groupId }) => {
      socket.join(`group-${groupId}`);
    });

    socket.on('group:leave', ({ groupId }) => {
      socket.leave(`group-${groupId}`);
    });

    // ---- BILL ROOM EVENTS (SplitSmart) ----
    socket.on('bill:join', ({ roomId }) => {
      socket.join(`bill-${roomId}`);
      socket.to(`bill-${roomId}`).emit('bill:user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        avatar: socket.userAvatar
      });
    });

    socket.on('bill:add-item', ({ roomId, item }) => {
      io.to(`bill-${roomId}`).emit('bill:item-added', {
        ...item,
        addedBy: { id: socket.userId, name: socket.userName }
      });
    });

    socket.on('bill:claim-item', ({ roomId, itemId }) => {
      io.to(`bill-${roomId}`).emit('bill:item-claimed', {
        itemId,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('bill:update-split', ({ roomId, splits, total }) => {
      io.to(`bill-${roomId}`).emit('bill:split-updated', { splits, total });
    });

    socket.on('bill:finalize', ({ roomId, finalSplit }) => {
      io.to(`bill-${roomId}`).emit('bill:finalized', finalSplit);
    });

    socket.on('bill:leave', ({ roomId }) => {
      socket.leave(`bill-${roomId}`);
      socket.to(`bill-${roomId}`).emit('bill:user-left', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // ---- MARKET FEED EVENTS (TradeArena) ----
    socket.on('market:subscribe', ({ symbols }) => {
      socket.join('market-feed');
      socket.marketSymbols = symbols || [];
    });

    socket.on('market:unsubscribe', () => {
      socket.leave('market-feed');
    });

    // ---- BATTLE EVENTS (FinBattle) ----
    socket.on('battle:join', ({ battleId }) => {
      socket.join(`battle-${battleId}`);
      socket.to(`battle-${battleId}`).emit('battle:user-joined', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('battle:update-portfolio', async ({ battleId, totalValue }) => {
      try {
        const Battle = require('../models/Battle');
        await Battle.findOneAndUpdate(
          { _id: battleId, 'participants.user': socket.userId },
          { $set: { 'participants.$.totalValue': totalValue } }
        );

        const battle = await Battle.findById(battleId)
          .populate('participants.user', 'name avatar');

        const sorted = [...battle.participants].sort((a, b) => b.totalValue - a.totalValue);
        sorted.forEach((p, i) => p.rank = i + 1);

        io.to(`battle-${battleId}`).emit('battle:leaderboard-update', sorted);
      } catch (err) {
        console.error('Battle update error:', err.message);
      }
    });

    // ---- REAL-TIME LOBBY EVENTS (FinBattle) ----
    socket.on('lobby:get-all', () => {
      socket.emit('lobby:list', activeLobbies);
    });

    socket.on('lobby:create', ({ name, emoji, college }) => {
      const lobbyId = 'lobby_' + Date.now();
      const newLobby = {
        id: lobbyId,
        name,
        emoji,
        college,
        members: [{
          id: socket.userId,
          name: socket.userName,
          finScore: socket.userFinScore || 500,
          isMe: true // evaluated client-side
        }]
      };
      activeLobbies.push(newLobby);
      socket.join(`lobby-${lobbyId}`);
      socket.currentLobbyId = lobbyId;
      
      io.emit('lobby:list', activeLobbies);
      socket.emit('lobby:joined', newLobby);
    });

    socket.on('lobby:join', ({ lobbyId }) => {
      const lobby = activeLobbies.find(l => l.id === lobbyId);
      if (!lobby) {
        return socket.emit('lobby:error', { message: 'Lobby not found' });
      }
      if (lobby.members.length >= 4) {
        return socket.emit('lobby:error', { message: 'Lobby is full' });
      }
      
      const exists = lobby.members.some(m => m.id === socket.userId);
      if (!exists) {
        lobby.members.push({
          id: socket.userId,
          name: socket.userName,
          finScore: socket.userFinScore || 500
        });
      }

      socket.join(`lobby-${lobbyId}`);
      socket.currentLobbyId = lobbyId;

      io.emit('lobby:list', activeLobbies);
      io.to(`lobby-${lobbyId}`).emit('lobby:member-update', lobby);
      socket.emit('lobby:joined', lobby);
    });

    socket.on('lobby:leave', () => {
      const lobbyId = socket.currentLobbyId;
      if (!lobbyId) return;

      const lobbyIdx = activeLobbies.findIndex(l => l.id === lobbyId);
      if (lobbyIdx !== -1) {
        const lobby = activeLobbies[lobbyIdx];
        lobby.members = lobby.members.filter(m => m.id !== socket.userId);
        
        socket.leave(`lobby-${lobbyId}`);
        socket.currentLobbyId = null;

        if (lobby.members.length === 0) {
          activeLobbies.splice(lobbyIdx, 1);
        } else {
          io.to(`lobby-${lobbyId}`).emit('lobby:member-update', lobby);
        }
        io.emit('lobby:list', activeLobbies);
      }
      socket.emit('lobby:left');
    });

    socket.on('lobby:lock', () => {
      const lobbyId = socket.currentLobbyId;
      if (!lobbyId) return;

      const lobby = activeLobbies.find(l => l.id === lobbyId);
      if (lobby) {
        io.to(`lobby-${lobbyId}`).emit('lobby:locked', lobby);
        activeLobbies = activeLobbies.filter(l => l.id !== lobbyId);
        io.emit('lobby:list', activeLobbies);
      }
    });

    // ---- SQUAD CHAT EVENTS ----
    socket.on('squad:join', ({ squadId }) => {
      socket.join(`squad-${squadId}`);
    });

    socket.on('squad:message', ({ squadId, message }) => {
      io.to(`squad-${squadId}`).emit('squad:new-message', {
        userId: socket.userId,
        userName: socket.userName,
        avatar: socket.userAvatar,
        message,
        timestamp: new Date()
      });
    });

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userName}`);
    });
  });

  // Start live market feed (polls every 15 seconds)
  startMarketFeed(io);

  console.log('✅ Socket.io initialized');
  return io;
};

// Auto-trigger executor for Stop-Loss and Target Sell orders
const checkStopLossAndTarget = async (io, prices) => {
  try {
    const Portfolio = require('../models/Portfolio');
    const User = require('../models/User');
    const Trade = require('../models/Trade');
    const Notification = require('../models/Notification');

    // Find portfolios with active SL/TGT limits
    const portfolios = await Portfolio.find({
      $or: [
        { 'holdings.stopLossPrice': { $ne: null } },
        { 'holdings.targetPrice': { $ne: null } }
      ]
    });

    for (const portfolio of portfolios) {
      let updated = false;
      const nextHoldings = [];
      const user = await User.findById(portfolio.user);
      if (!user) continue;

      for (const holding of portfolio.holdings) {
        const match = prices.find(p => p.symbol === holding.symbol);
        if (!match) {
          nextHoldings.push(holding);
          continue;
        }

        const currentPrice = match.price;
        let isTriggered = false;
        let triggerType = ''; // 'Stop-Loss' or 'Target'
        let triggerPrice = 0;

        if (holding.stopLossPrice !== null && currentPrice <= holding.stopLossPrice) {
          isTriggered = true;
          triggerType = 'Stop-Loss';
          triggerPrice = holding.stopLossPrice;
        } else if (holding.targetPrice !== null && currentPrice >= holding.targetPrice) {
          isTriggered = true;
          triggerType = 'Target';
          triggerPrice = holding.targetPrice;
        }

        if (isTriggered) {
          updated = true;
          const sellQty = holding.quantity;
          const totalAmount = currentPrice * sellQty;
          const costBasis = holding.avgBuyPrice * sellQty;
          const profitLoss = totalAmount - costBasis;
          const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

          // Update user wallet
          const walletBefore = user.virtualWallet;
          user.virtualWallet += totalAmount;

          // Create trade journal record
          await Trade.create({
            user: user._id,
            symbol: holding.symbol,
            companyName: holding.companyName,
            tradeType: 'SELL',
            quantity: sellQty,
            price: currentPrice,
            totalAmount,
            walletBefore,
            walletAfter: user.virtualWallet,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
            reasoning: `[Auto-Triggered] ${triggerType} hit at ₹${currentPrice.toFixed(2)} (Trigger limit: ₹${triggerPrice.toFixed(2)})`
          });

          // Create DB Notification
          const notificationMessage = `🚨 ${triggerType} executed! Sold ${sellQty} shares of ${holding.symbol} at ₹${currentPrice.toFixed(2)} (P&L: ₹${profitLoss.toFixed(2)}).`;
          await Notification.create({
            recipient: user._id,
            type: 'general',
            message: notificationMessage
          });

          // Send in-app socket notification directly to user room
          io.to(`user-${user._id}`).emit('notification', {
            message: notificationMessage,
            type: 'general'
          });

          // Send direct event to let client reload portfolio and wallet
          io.to(`user-${user._id}`).emit('portfolio:update', {
            walletBalance: user.virtualWallet,
            message: notificationMessage
          });

          console.log(`🎯 Auto-Trigger: ${triggerType} executed for user ${user.name} on ${holding.symbol} at ₹${currentPrice}`);
        } else {
          nextHoldings.push(holding);
        }
      }

      if (updated) {
        await user.save();
        portfolio.holdings = nextHoldings;
        portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + (h.totalInvested || 0), 0);
        portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + (h.currentValue || 0), 0);
        portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
        portfolio.lastUpdated = new Date();
        await portfolio.save();
      }
    }
  } catch (error) {
    console.error('Error in checkStopLossAndTarget:', error);
  }
};

// Live market price broadcast with high-frequency simulation & real API sync
const checkLimitOrders = async (io, prices) => {
  try {
    const LimitOrder = require('../models/LimitOrder');
    const User = require('../models/User');
    const Trade = require('../models/Trade');
    const Portfolio = require('../models/Portfolio');
    const Notification = require('../models/Notification');

    const pendingOrders = await LimitOrder.find({ status: 'PENDING' });
    if (pendingOrders.length === 0) return;

    for (const order of pendingOrders) {
      const match = prices.find(p => p.symbol === order.symbol);
      if (!match) continue;

      const currentPrice = match.price;
      let shouldTrigger = false;

      if (order.tradeType === 'BUY' && currentPrice <= order.limitPrice) {
        shouldTrigger = true;
      } else if (order.tradeType === 'SELL' && currentPrice >= order.limitPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        try {
          const user = await User.findById(order.user);
          if (!user) continue;

          const totalAmount = currentPrice * order.quantity;

          if (order.tradeType === 'BUY') {
            if (user.virtualWallet < totalAmount) {
              console.warn(`Limit Order BUY failed for user ${user.name}: Insufficient funds`);
              continue;
            }

            const walletBefore = user.virtualWallet;
            user.virtualWallet -= totalAmount;
            await user.save();

            await Trade.create({
              user: user._id,
              symbol: order.symbol,
              companyName: order.companyName,
              tradeType: 'BUY',
              quantity: order.quantity,
              price: currentPrice,
              totalAmount,
              walletBefore,
              walletAfter: user.virtualWallet,
              reasoning: `[Limit Order Executed] BUY triggered at ₹${currentPrice.toFixed(2)} (Limit: ₹${order.limitPrice.toFixed(2)})`
            });

            let portfolio = await Portfolio.findOne({ user: user._id });
            if (!portfolio) portfolio = new Portfolio({ user: user._id });

            const existingIdx = portfolio.holdings.findIndex(h => h.symbol === order.symbol);
            if (existingIdx >= 0) {
              const existing = portfolio.holdings[existingIdx];
              const newQty = existing.quantity + order.quantity;
              const newAvg = ((existing.avgBuyPrice * existing.quantity) + totalAmount) / newQty;
              portfolio.holdings[existingIdx].quantity = newQty;
              portfolio.holdings[existingIdx].avgBuyPrice = Math.round(newAvg * 100) / 100;
              portfolio.holdings[existingIdx].totalInvested += totalAmount;
              portfolio.holdings[existingIdx].currentPrice = currentPrice;
              portfolio.holdings[existingIdx].currentValue = newQty * currentPrice;
            } else {
              portfolio.holdings.push({
                symbol: order.symbol,
                companyName: order.companyName,
                quantity: order.quantity,
                avgBuyPrice: currentPrice,
                currentPrice,
                totalInvested: totalAmount,
                currentValue: totalAmount,
                profitLoss: 0
              });
            }
            portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.totalInvested, 0);
            portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + h.currentValue, 0);
            portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
            await portfolio.save();
          } else { // SELL
            let portfolio = await Portfolio.findOne({ user: user._id });
            if (!portfolio) continue;

            const holdingIdx = portfolio.holdings.findIndex(h => h.symbol === order.symbol);
            if (holdingIdx === -1 || portfolio.holdings[holdingIdx].quantity < order.quantity) {
              console.warn(`Limit Order SELL failed for user ${user.name}: Insufficient holdings`);
              continue;
            }

            const holding = portfolio.holdings[holdingIdx];
            const costBasis = holding.avgBuyPrice * order.quantity;
            const profitLoss = totalAmount - costBasis;

            const walletBefore = user.virtualWallet;
            user.virtualWallet += totalAmount;
            await user.save();

            await Trade.create({
              user: user._id,
              symbol: order.symbol,
              companyName: order.companyName,
              tradeType: 'SELL',
              quantity: order.quantity,
              price: currentPrice,
              totalAmount,
              walletBefore,
              walletAfter: user.virtualWallet,
              profitLoss: Math.round(profitLoss * 100) / 100,
              profitLossPercent: Math.round(((profitLoss / costBasis) * 100) * 100) / 100,
              reasoning: `[Limit Order Executed] SELL triggered at ₹${currentPrice.toFixed(2)} (Limit: ₹${order.limitPrice.toFixed(2)})`
            });

            if (holding.quantity === order.quantity) {
              portfolio.holdings.splice(holdingIdx, 1);
            } else {
              portfolio.holdings[holdingIdx].quantity -= order.quantity;
              portfolio.holdings[holdingIdx].totalInvested -= costBasis;
              portfolio.holdings[holdingIdx].currentValue = portfolio.holdings[holdingIdx].quantity * currentPrice;
            }
            portfolio.totalInvested = portfolio.holdings.reduce((s, h) => s + h.totalInvested, 0);
            portfolio.currentValue = portfolio.holdings.reduce((s, h) => s + h.currentValue, 0);
            portfolio.totalProfitLoss = portfolio.currentValue - portfolio.totalInvested;
            await portfolio.save();
          }

          order.status = 'EXECUTED';
          await order.save();

          const msg = `🚨 Limit Order Executed! ${order.tradeType} ${order.quantity} shares of ${order.symbol} at ₹${currentPrice.toFixed(2)} (Limit: ₹${order.limitPrice.toFixed(2)}).`;
          await Notification.create({ recipient: user._id, type: 'general', message: msg });

          io.to(`user-${user._id}`).emit('notification', { message: msg, type: 'general' });
          io.to(`user-${user._id}`).emit('portfolio:update', { walletBalance: user.virtualWallet, message: msg });
        } catch (execErr) {
          console.error(`Failed to execute limit order ${order._id}:`, execErr);
        }
      }
    }
  } catch (error) {
    console.error('Error in checkLimitOrders:', error);
  }
};

const checkWatchlistAlerts = async (io, prices) => {
  try {
    const Watchlist = require('../models/Watchlist');
    const Notification = require('../models/Notification');

    const watchlists = await Watchlist.find({ 'stocks.alerts': { $exists: true, $not: { $size: 0 } } });
    if (watchlists.length === 0) return;

    for (const wl of watchlists) {
      let updated = false;
      for (const stock of wl.stocks) {
        if (!stock.alerts || stock.alerts.length === 0) continue;

        const match = prices.find(p => p.symbol.toUpperCase() === stock.symbol.toUpperCase() || p.symbol.replace('.NS', '').toUpperCase() === stock.symbol.toUpperCase());
        if (!match) continue;

        const currentPrice = match.price;
        for (const alert of stock.alerts) {
          if (alert.isTriggered) continue;

          let trigger = false;
          if (alert.type === 'above' && currentPrice >= alert.price) {
            trigger = true;
          } else if (alert.type === 'below' && currentPrice <= alert.price) {
            trigger = true;
          }

          if (trigger) {
            alert.isTriggered = true;
            alert.triggeredAt = new Date();
            updated = true;

            const msg = `🔔 Watchlist Alert: ${stock.symbol} has gone ${alert.type} your target price of ₹${alert.price.toFixed(2)} (Current: ₹${currentPrice.toFixed(2)})!`;
            
            await Notification.create({
              recipient: wl.user,
              type: 'general',
              message: msg
            });

            io.to(`user-${wl.user}`).emit('notification', {
              message: msg,
              type: 'general'
            });
          }
        }
      }
      if (updated) {
        await wl.save();
      }
    }
  } catch (err) {
    console.error('Error in checkWatchlistAlerts:', err);
  }
};

const startMarketFeed = (io) => {

  let stockCache = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', price: 2450.50, change: 12.30, changePercent: 0.50, volume: 1540200, isUp: true },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 3420.00, change: -24.50, changePercent: -0.71, volume: 820300, isUp: false },
    { symbol: 'INFY.NS', name: 'Infosys Limited', price: 1510.20, change: 8.90, changePercent: 0.59, volume: 1104500, isUp: true },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', price: 1620.40, change: -3.10, changePercent: -0.19, volume: 2400300, isUp: false },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited', price: 430.75, change: 1.25, changePercent: 0.29, volume: 1802300, isUp: true },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', price: 915.60, change: 15.20, changePercent: 1.69, volume: 1400200, isUp: true },
    { symbol: 'SBIN.NS', name: 'State Bank of India', price: 580.30, change: -4.10, changePercent: -0.70, volume: 3200500, isUp: false },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', price: 7120.00, change: -105.00, changePercent: -1.45, volume: 450100, isUp: false }
  ];

  const defaultSymbols = stockCache.map(s => s.symbol);

  const getSubscribedSymbols = () => {
    const symbols = new Set(defaultSymbols);
    if (io && io.sockets && io.sockets.sockets) {
      for (const [id, s] of io.sockets.sockets) {
        if (s.marketSymbols && Array.isArray(s.marketSymbols)) {
          s.marketSymbols.forEach(sym => {
            if (sym) symbols.add(sym.toUpperCase());
          });
        }
      }
    }
    return Array.from(symbols);
  };

  const syncQuotes = async () => {
    try {
      const activeSymbols = getSubscribedSymbols();
      const rawQuotes = await marketService.getMultipleLiveQuotes(activeSymbols);
      
      const quotes = rawQuotes.map(q => ({
        symbol: q.yahooSymbol || q.symbol,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.regularMarketVolume || 1000000
      }));

      if (quotes.length > 0) {
        quotes.forEach(liveQuote => {
          const idx = stockCache.findIndex(s => s.symbol === liveQuote.symbol);
          if (idx >= 0) {
            stockCache[idx] = {
              ...stockCache[idx],
              price: liveQuote.price || stockCache[idx].price,
              change: parseFloat(liveQuote.change?.toFixed(2) || stockCache[idx].change),
              changePercent: parseFloat(liveQuote.changePercent?.toFixed(2) || stockCache[idx].changePercent),
              volume: liveQuote.volume || stockCache[idx].volume,
              isUp: (liveQuote.change || 0) >= 0
            };
          } else {
            stockCache.push({
              symbol: liveQuote.symbol,
              name: liveQuote.symbol.replace('.NS', '').replace('.BO', ''),
              price: liveQuote.price,
              change: liveQuote.change,
              changePercent: liveQuote.changePercent,
              volume: liveQuote.volume,
              isUp: (liveQuote.change || 0) >= 0
            });
          }
        });
        
        io.to('market-feed').emit('market:price-update', stockCache);
        checkStopLossAndTarget(io, stockCache);
        checkLimitOrders(io, stockCache);
        checkWatchlistAlerts(io, stockCache);
      }
    } catch (err) {
      // Catch network/timeout errors silently
    }
  };

  syncQuotes();

  setInterval(() => {
    stockCache = stockCache.map(stock => {
      const percentageChange = (Math.random() * 0.40 - 0.18) / 100;
      const priceDelta = stock.price * percentageChange;
      const newPrice = parseFloat((stock.price + priceDelta).toFixed(2));
      const totalChange = parseFloat((stock.change + priceDelta).toFixed(2));
      const initialPrice = stock.price - stock.change;
      const newChangePercent = parseFloat(((totalChange / (initialPrice || 1)) * 100).toFixed(2));

      return {
        ...stock,
        price: newPrice,
        change: totalChange,
        changePercent: newChangePercent,
        isUp: totalChange >= 0
      };
    });

    io.to('market-feed').emit('market:price-update', stockCache);
    checkStopLossAndTarget(io, stockCache);
    checkLimitOrders(io, stockCache);
    checkWatchlistAlerts(io, stockCache);
  }, 3000);

  setInterval(syncQuotes, 30000);
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };