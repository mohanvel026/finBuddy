const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getIO } = require('../sockets');
const OpenAI = require('openai');
const { calculateSplit, validateSplit, getSplitDescription } = require('../algorithms/splitEngine');
const logActivity = require('../utils/logActivity');

const getAICompletion = async (messages, maxTokens = 500) => {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
  const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  for (const model of models) {
    try {
      const response = await groqClient.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens
      });
      return response.choices[0].message.content;
    } catch (groqError) {
      console.warn(`Groq model ${model} failed:`, groqError.message);
    }
  }

  // Fallback to Gemini
  try {
    const geminiClient = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
    });
    const response = await geminiClient.chat.completions.create({
      model: 'gemini-1.5-flash',
      messages,
      max_tokens: maxTokens
    });
    return response.choices[0].message.content;
  } catch (geminiError) {
    console.error('❌ Gemini AI fallback call failed:', geminiError.message);
    throw new Error('All AI providers failed');
  }
};

const getAIVisionCompletion = async (imageUrl, textPrompt) => {
  try {
    const groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: textPrompt }
        ]
      }]
    });
    return response.choices[0].message.content;
  } catch (groqError) {
    console.error('⚠️ Groq Vision failed, falling back to Gemini:', groqError.message);
    try {
      const geminiClient = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
      });
      const response = await geminiClient.chat.completions.create({
        model: 'gemini-1.5-flash',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: textPrompt }
          ]
        }],
        max_tokens: 1000
      });
      return response.choices[0].message.content;
    } catch (geminiError) {
      console.error('❌ Gemini Vision failed:', geminiError.message);
      throw new Error('All Vision AI providers failed');
    }
  }
};

// @desc    Add expense (industry-standard split engine)
// @route   POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const {
      groupId, description, amount, currency,
      category, splitType, participants, notes, date,
      isRecurring, recurringPattern, receiptData, paidBy
    } = req.body;

    console.log("ADD EXPENSE REQUEST BODY:", JSON.stringify(req.body, null, 2));

    const group = await Group.findById(groupId).populate('members.user', 'name avatar');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    const allMembers = group.members.map(m => ({ userId: m.user._id.toString() }));
    const parsedAmount = parseFloat(amount);

    // Use industry-standard split engine
    let finalSplits = [];
    try {
      const rawSplits = calculateSplit({
        amount: parsedAmount,
        splitType: splitType || 'equal',
        allMembers,
        participants: participants || [],
        paidBy: paidBy || req.user._id.toString()
      });
      finalSplits = validateSplit(rawSplits, parsedAmount);
    } catch (splitError) {
      return res.status(400).json({ success: false, message: splitError.message });
    }

    // 🧠 Self-Healing: If splitType is 'item' and receiptData has no items, auto-generate from participants with proper names!
    let finalReceiptData = receiptData;
    if (splitType === 'item' && (!finalReceiptData || !finalReceiptData.items || finalReceiptData.items.length === 0)) {
      finalReceiptData = {
        items: (participants || []).map(p => {
          const member = allMembers.find(m => (m.user?._id || m.user)?.toString() === p.userId?.toString());
          const memberName = member?.user?.name || 'Member';
          return {
            name: `${memberName}'s share`,
            price: parseFloat(p.amount) || 0,
            claimedBy: p.userId
          };
        }).filter(item => item.price > 0),
        subtotal: parsedAmount,
        total: parsedAmount
      };
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount: parsedAmount,
      currency: currency || 'INR',
      amountINR: parsedAmount,
      category: category || 'other',
      paidBy: paidBy || req.user._id,
      splitType: splitType || 'equal',
      splitDescription: getSplitDescription(splitType, participants, allMembers),
      splits: finalSplits,
      participantCount: finalSplits.length,
      totalGroupMembers: allMembers.length,
      notes,
      date: date ? new Date(date) : new Date(),
      addedBy: req.user._id,
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      receiptData: finalReceiptData
    });

    try {
      await Group.findByIdAndUpdate(groupId, { $inc: { totalExpenses: parsedAmount } });

      // Update budget envelope
      const now = new Date();
      await Group.findOneAndUpdate(
        {
          _id: groupId,
          'budgetEnvelopes.category': category,
          'budgetEnvelopes.month': now.getMonth() + 1,
          'budgetEnvelopes.year': now.getFullYear()
        },
        { $inc: { 'budgetEnvelopes.$.spentAmount': parsedAmount } }
      );
    } catch (dbErr) {
      // Rollback expense creation
      await Expense.findByIdAndDelete(expense._id);
      throw new Error(`Failed to update group budget statistics: ${dbErr.message}`);
    }

    await expense.populate([
      { path: 'paidBy', select: 'name avatar' },
      { path: 'splits.user', select: 'name avatar' }
    ]);

    try {
      const io = getIO();
      io.to(`group-${groupId}`).emit('expense:new', {
        expense,
        addedBy: { name: req.user.name, avatar: req.user.avatar }
      });
    } catch (e) {}

    await logActivity(req.user._id, 'expense', '💸', `Added expense: ${description} — ₹${parsedAmount}`, `Expense added to group`, { amount: parsedAmount });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group expenses
// @route   GET /api/expenses/group/:id
const getGroupExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    const query = { group: req.params.id };
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('paidBy', 'name avatar')
      .populate('splits.user', 'name avatar')
      .populate('addedBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, expenses, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { description, amount, category, notes } = req.body;
    const oldAmount = expense.amount;
    const oldCategory = expense.category;
    const now = new Date(expense.date || expense.createdAt || Date.now());

    if (amount && parseFloat(amount) !== oldAmount) {
      const diff = parseFloat(amount) - oldAmount;
      await Group.findByIdAndUpdate(expense.group, { $inc: { totalExpenses: diff } });
    }

    const newCategory = category || expense.category;
    const newAmount = amount ? parseFloat(amount) : oldAmount;
    if (newCategory === oldCategory) {
      if (newAmount !== oldAmount) {
        const diff = newAmount - oldAmount;
        await Group.findOneAndUpdate(
          {
            _id: expense.group,
            'budgetEnvelopes.category': oldCategory,
            'budgetEnvelopes.month': now.getMonth() + 1,
            'budgetEnvelopes.year': now.getFullYear()
          },
          { $inc: { 'budgetEnvelopes.$.spentAmount': diff } }
        );
      }
    } else {
      await Group.findOneAndUpdate(
        {
          _id: expense.group,
          'budgetEnvelopes.category': oldCategory,
          'budgetEnvelopes.month': now.getMonth() + 1,
          'budgetEnvelopes.year': now.getFullYear()
        },
        { $inc: { 'budgetEnvelopes.$.spentAmount': -oldAmount } }
      );
      await Group.findOneAndUpdate(
        {
          _id: expense.group,
          'budgetEnvelopes.category': newCategory,
          'budgetEnvelopes.month': now.getMonth() + 1,
          'budgetEnvelopes.year': now.getFullYear()
        },
        { $inc: { 'budgetEnvelopes.$.spentAmount': newAmount } }
      );
    }

    Object.assign(expense, { description, amount, category, notes });
    await expense.save();
    if (req.body.amount && parseFloat(req.body.amount) !== oldAmount && expense.splits?.length > 0) {
      const newAmountVal = parseFloat(req.body.amount);
      const ratio = newAmountVal / oldAmount;
      expense.splits = expense.splits.map(s => ({
        ...(s.toObject ? s.toObject() : s),
        amount: parseFloat((s.amount * ratio).toFixed(2))
      }));
      await expense.save();
    }
    res.json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const now = new Date(expense.date || expense.createdAt || Date.now());
    await Group.findOneAndUpdate(
      {
        _id: expense.group,
        'budgetEnvelopes.category': expense.category,
        'budgetEnvelopes.month': now.getMonth() + 1,
        'budgetEnvelopes.year': now.getFullYear()
      },
      { $inc: { 'budgetEnvelopes.$.spentAmount': -expense.amount } }
    );
    await Group.findByIdAndUpdate(expense.group, { $inc: { totalExpenses: -expense.amount } });
    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Scan receipt with OCR + AI
// @route   POST /api/expenses/scan-receipt
const scanReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const imageUrl = req.file.path;
    const textPrompt = `Extract receipt data and return ONLY valid JSON (no markdown):
    {"items":[{"name":"item name","price":0.00}],"subtotal":0.00,"tax":0.00,"total":0.00,"restaurant":"name if visible","date":"date if visible"}
    If a value is not found, use null. Prices in INR numbers only.`;
    
    let receiptData;
    try {
      const text = await getAIVisionCompletion(imageUrl, textPrompt);
      receiptData = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      receiptData = { items: [], total: null };
    }
    res.json({ success: true, receiptData, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Settle expense via Razorpay
// @route   POST /api/expenses/settle
const settleExpense = async (req, res) => {
  try {
    const { expenseId, paymentId, amount, paymentMethod, debtorId } = req.body;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    
    const isCreditor = expense.paidBy.toString() === req.user._id.toString();
    const targetUserId = (debtorId && isCreditor) ? debtorId : req.user._id.toString();

    const splitIndex = expense.splits.findIndex(s => s.user.toString() === targetUserId);
    if (splitIndex === -1) return res.status(404).json({ success: false, message: 'No split found for this user' });
    
    const method = paymentMethod || 'cash';

    // Virtual Wallet In-App Transaction Engine
    if (method === 'wallet') {
      if (isCreditor) {
        return res.status(400).json({ success: false, message: 'Cannot initiate wallet deduction on behalf of another user. They must pay you from their wallet.' });
      }

      const payerUser = await User.findById(req.user._id);
      const recipientUser = await User.findById(expense.paidBy);
      
      const transferAmount = parseFloat(amount);
      if (payerUser.virtualWallet < transferAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient virtual wallet balance to settle!' });
      }
      
      payerUser.virtualWallet -= transferAmount;
      recipientUser.virtualWallet += transferAmount;
      
      await payerUser.save();
      await recipientUser.save();
      
      try {
        expense.splits[splitIndex].isPaid = true;
        expense.splits[splitIndex].paymentStatus = 'paid';
        expense.splits[splitIndex].paidAt = new Date();
        expense.splits[splitIndex].paymentId = paymentId || `PAY-WALLET-${Date.now()}`;
        expense.splits[splitIndex].paymentMethod = 'wallet';
        
        await expense.save();
        
        await Group.findOneAndUpdate(
          { _id: expense.group, 'members.user': req.user._id },
          { $inc: { 'members.$.trustScore': 5 } }
        );
      } catch (saveErr) {
        // Rollback wallet save
        payerUser.virtualWallet += transferAmount;
        recipientUser.virtualWallet -= transferAmount;
        await payerUser.save();
        await recipientUser.save();
        throw new Error(`Failed to record split payment status: ${saveErr.message}`);
      }
      
      try {
        const io = getIO();
        io.to(`user-${expense.paidBy}`).emit('expense:settled', { expenseId, settledBy: req.user.name, amount: transferAmount });
        
        await Notification.create({
          recipient: expense.paidBy,
          sender: req.user._id,
          group: expense.group,
          expense: expense._id,
          type: 'payment_approved',
          message: `${req.user.name} settled their debt of ₹${transferAmount} for "${expense.description}" instantly using their FinBuddy Virtual Wallet! 💸`,
          amount: transferAmount
        });
      } catch (e) {}
      
      await logActivity(req.user._id, 'settlement', '✅', `Settled ₹${transferAmount}`, `Settlement via wallet`, { amount: transferAmount });
      return res.json({ success: true, message: 'Instant transfer successful! Settled via FinBuddy Virtual Wallet. ✅', user: payerUser });
    }

    // If the creditor themselves is recording the cash/UPI settlement, approve it instantly
    if (isCreditor) {
      expense.splits[splitIndex].isPaid = true;
      expense.splits[splitIndex].paymentStatus = 'paid';
      expense.splits[splitIndex].paidAt = new Date();
      expense.splits[splitIndex].paymentId = paymentId || `PAY-RECORDED-${Date.now()}`;
      expense.splits[splitIndex].paymentMethod = method;
      
      await expense.save();
      
      await Group.findOneAndUpdate(
        { _id: expense.group, 'members.user': targetUserId },
        { $inc: { 'members.$.trustScore': 2 } }
      );
      
      try {
        const io = getIO();
        io.to(`user-${targetUserId}`).emit('expense:settled', { expenseId, settledBy: req.user.name, amount });
        
        await Notification.create({
          recipient: targetUserId,
          sender: req.user._id,
          group: expense.group,
          expense: expense._id,
          type: 'payment_approved',
          message: `${req.user.name} recorded your ${method.toUpperCase()} payment of ₹${amount} for "${expense.description}". Debt cleared! ✅`,
          amount: amount
        });
      } catch (e) {}
      
      await logActivity(req.user._id, 'settlement', '✅', `Settled ₹${amount}`, `Settlement via ${method || 'cash'}`, { amount });
      return res.json({ success: true, message: 'Payment recorded and settled instantly! ✅' });
    }

    // Instead of instantly marking as isPaid = true, we make it "pending approval" unless it's razorpay
    if (method === 'razorpay') {
      expense.splits[splitIndex].isPaid = true;
      expense.splits[splitIndex].paymentStatus = 'paid';
      expense.splits[splitIndex].paidAt = new Date();
      expense.splits[splitIndex].paymentId = paymentId;
      expense.splits[splitIndex].paymentMethod = 'razorpay';
      
      await expense.save();
      
      await Group.findOneAndUpdate(
        { _id: expense.group, 'members.user': req.user._id },
        { $inc: { 'members.$.trustScore': 2 } }
      );
      
      try {
        const io = getIO();
        io.to(`user-${expense.paidBy}`).emit('expense:settled', { expenseId, settledBy: req.user.name, amount });
      } catch (e) {}
      
      return res.json({ success: true, message: 'Marked as settled!' });
    }

    // Cash or UPI goes into pending approval
    expense.splits[splitIndex].isPaid = false; // still not fully settled!
    expense.splits[splitIndex].paymentStatus = 'pending';
    expense.splits[splitIndex].paymentMethod = method;
    expense.splits[splitIndex].paymentId = paymentId || `PAY-${method.toUpperCase()}-${Date.now()}`;
    expense.splits[splitIndex].paidAt = new Date();
    await expense.save();

    // Create a pending notification for the payee (expense.paidBy)
    const notification = await Notification.create({
      recipient: expense.paidBy,
      sender: req.user._id,
      group: expense.group,
      expense: expense._id,
      type: 'payment_pending',
      message: `${req.user.name} submitted a ${method.toUpperCase()} payment of ₹${amount} for "${expense.description}". Please approve or reject this payment.`,
      amount: amount
    });

    try {
      const io = getIO();
      // Emit real-time notification to the receiver
      io.to(`user-${expense.paidBy}`).emit('notification:new', notification);
    } catch (e) {}

    res.json({ success: true, message: 'Payment submitted! Awaiting approval from payee. ⏳', split: expense.splits[splitIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve pending payment settlement
// @route   POST /api/expenses/approve-settlement
const approveSettlement = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    // Safety check: only the recipient (the person receiving money) can approve
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized approval action' });
    }

    const expense = await Expense.findById(notification.expense);
    if (!expense) return res.status(404).json({ success: false, message: 'Associated expense not found' });

    const splitIndex = expense.splits.findIndex(s => s.user.toString() === notification.sender.toString());
    if (splitIndex === -1) return res.status(404).json({ success: false, message: 'No pending split found for that user' });

    // Mark as approved and paid!
    expense.splits[splitIndex].isPaid = true;
    expense.splits[splitIndex].paymentStatus = 'paid';
    await expense.save();

    // Update group trust score
    await Group.findOneAndUpdate(
      { _id: expense.group, 'members.user': notification.sender },
      { $inc: { 'members.$.trustScore': 5 } } // reward of 5 trust score points!
    );

    // Delete or mark original notification as read
    notification.isRead = true;
    await notification.save();

    // Create success notification for the sender
    const successNotif = await Notification.create({
      recipient: notification.sender,
      sender: req.user._id,
      group: expense.group,
      expense: expense._id,
      type: 'payment_approved',
      message: `${req.user.name} approved your ${expense.splits[splitIndex].paymentMethod?.toUpperCase()} payment of ₹${notification.amount}! 💸`,
      amount: notification.amount
    });

    try {
      const io = getIO();
      io.to(`user-${notification.sender}`).emit('notification:new', successNotif);
    } catch (e) {}

    res.json({ success: true, message: 'Payment approved successfully! Split settled! ✅' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject pending payment settlement
// @route   POST /api/expenses/reject-settlement
const rejectSettlement = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    
    // Safety check: only the recipient (the person receiving money) can reject
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized rejection action' });
    }

    const expense = await Expense.findById(notification.expense);
    if (!expense) return res.status(404).json({ success: false, message: 'Associated expense not found' });

    const splitIndex = expense.splits.findIndex(s => s.user.toString() === notification.sender.toString());
    if (splitIndex === -1) return res.status(404).json({ success: false, message: 'No pending split found' });

    // Reject payment: debt remains unpaid!
    const method = expense.splits[splitIndex].paymentMethod;
    expense.splits[splitIndex].isPaid = false;
    expense.splits[splitIndex].paymentStatus = 'rejected';
    expense.splits[splitIndex].paymentMethod = null;
    await expense.save();

    // Mark original notification as read/resolved
    notification.isRead = true;
    await notification.save();

    // Create rejection notification for the sender
    const rejectNotif = await Notification.create({
      recipient: notification.sender,
      sender: req.user._id,
      group: expense.group,
      expense: expense._id,
      type: 'payment_rejected',
      message: `${req.user.name} rejected your ${method?.toUpperCase()} payment of ₹${notification.amount}. The debt has not been cleared. Please contact them or try again.`,
      amount: notification.amount
    });

    try {
      const io = getIO();
      io.to(`user-${notification.sender}`).emit('notification:new', rejectNotif);
    } catch (e) {}

    res.json({ success: true, message: 'Payment rejected. Debt has NOT been cleared and sender has been notified. ❌' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user notifications
// @route   GET /api/expenses/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id, isRead: false })
      .populate('sender', 'name avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/expenses/notifications/:id/read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raise dispute
// @route   POST /api/expenses/:id/dispute
const raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    expense.dispute = { isDisputed: true, raisedBy: req.user._id, reason, votes: [], aiSuggestion: null };
    try {
      const messages = [{
        role: 'user',
        content: `Group expense dispute: "${expense.description}" for ₹${expense.amount}. Dispute reason: "${reason}". Give a fair 1-sentence resolution suggestion.`
      }];
      expense.dispute.aiSuggestion = await getAICompletion(messages, 200);
    } catch (e) {}
    await expense.save();
    res.json({ success: true, dispute: expense.dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Vote on dispute
// @route   POST /api/expenses/:id/vote
const voteOnDispute = async (req, res) => {
  try {
    const { vote } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense?.dispute?.isDisputed) return res.status(400).json({ success: false, message: 'No active dispute' });
    const alreadyVoted = expense.dispute.votes.some(v => v.user.toString() === req.user._id.toString());
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'Already voted' });
    expense.dispute.votes.push({ user: req.user._id, vote });
    const group = await Group.findById(expense.group);
    const majority = Math.ceil(group.members.length / 2);
    const validVotes = expense.dispute.votes.filter(v => v.vote === 'valid').length;
    const invalidVotes = expense.dispute.votes.filter(v => v.vote === 'invalid').length;
    if (validVotes >= majority) {
      expense.dispute.resolvedAt = new Date();
      expense.dispute.resolution = 'Expense validated by group vote';
      expense.dispute.isDisputed = false;
    } else if (invalidVotes >= majority) {
      expense.dispute.resolvedAt = new Date();
      expense.dispute.resolution = 'Expense invalidated — will be removed';
      expense.dispute.isDisputed = false;
    }
    await expense.save();
    res.json({ success: true, dispute: expense.dispute });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const remindDebtor = async (req, res) => {
  try {
    const { debtorId, groupId, amount } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Create notification
    await Notification.create({
      recipient: debtorId,
      sender: req.user._id,
      group: groupId,
      type: 'general',
      message: `🔔 Payment Reminder: ${req.user.name} is reminding you to settle your debt of ₹${amount} in group "${group.name}".`,
      amount: amount
    });

    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      io.to(`user-${debtorId}`).emit('notification:new', {
        message: `🔔 Payment Reminder: ${req.user.name} is reminding you to settle your debt of ₹${amount} in group "${group.name}".`
      });
    } catch (e) {}

    res.json({ success: true, message: 'Reminder sent successfully! 🚀' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addExpense, getGroupExpenses, updateExpense, deleteExpense,
  scanReceipt, settleExpense, raiseDispute, voteOnDispute,
  approveSettlement, rejectSettlement, getNotifications, markNotificationAsRead,
  remindDebtor
};