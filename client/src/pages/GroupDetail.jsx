// client/src/pages/GroupDetail.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import useOffline from '../hooks/useOffline';
import { Receipt, User } from 'lucide-react';

const COLORS = ['#7C3AED', '#A78BFA', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { isOnline, pendingCount, saveOffline, syncPending } = useOffline();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showLiveBill, setShowLiveBill] = useState(false);
  const [liveBillItems, setLiveBillItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const socketRef = useRef(null);

  // AI OCR Bill Scanner states
  const [showScanReceipt, setShowScanReceipt] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [itemAssignments, setItemAssignments] = useState({});
  const [receiptTax, setReceiptTax] = useState(0);
  const [receiptTip, setReceiptTip] = useState(0);
  const [receiptImagePreview, setReceiptImagePreview] = useState(null);
  const [receiptPayer, setReceiptPayer] = useState('');

  // Quick Add states
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [submittingQuick, setSubmittingQuick] = useState(false);

  // Advanced settlement options
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null); // { type: 'expense'|'debt', id: string, amount: number, debtObj?: any }
  const [settleMethod, setSettleMethod] = useState('cash'); // 'cash' | 'upi' | 'razorpay'
  const [settling, setSettling] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [settleSuccess, setSettleSuccess] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [inlineUpi, setInlineUpi] = useState('');
  const [inlineUpiError, setInlineUpiError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEmoji, setEditEmoji] = useState('👥');
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [envelopeCategory, setEnvelopeCategory] = useState('food');
  const [envelopeAmount, setEnvelopeAmount] = useState('');
  const [savingEnvelope, setSavingEnvelope] = useState(false);

  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Expense search & filter
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setScannedData(null);
    setItemAssignments({});
    setReceiptImagePreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const { data } = await api.post('/expenses/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.receiptData) {
        setScannedData(data.receiptData);
        setReceiptTax(data.receiptData.tax || 0);
        setReceiptTip(data.receiptData.tip || 0);

        const initial = {};
        (data.receiptData.items || []).forEach((_, idx) => {
          initial[idx] = [];
        });
        setItemAssignments(initial);

        toast.success('Bill successfully scanned by AI OCR! 🧾');
      } else {
        toast.error('AI was unable to parse items from the bill');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bill scan failed');
    }
    setScanning(false);
  };

  const calculateScannedItemizedBreakdown = () => {
    if (!scannedData || !scannedData.items) return [];

    const memberTotals = {};
    const groupMembers = group?.members || [];

    groupMembers.forEach(m => {
      const uid = (m.user._id || m.user).toString();
      memberTotals[uid] = {
        userId: uid,
        name: m.user.name,
        avatar: m.user.avatar,
        subtotal: 0,
        taxShare: 0,
        tipShare: 0,
        total: 0,
        assignedItems: []
      };
    });

    let aggregatedSubtotal = 0;

    scannedData.items.forEach((item, itemIdx) => {
      const assignedUserIds = itemAssignments[itemIdx] || [];
      if (assignedUserIds.length === 0) return;

      const pricePerUser = parseFloat(item.price) / assignedUserIds.length;
      aggregatedSubtotal += parseFloat(item.price);

      assignedUserIds.forEach(uid => {
        if (memberTotals[uid]) {
          memberTotals[uid].subtotal += pricePerUser;
          memberTotals[uid].assignedItems.push({ name: item.name, price: pricePerUser });
        }
      });
    });

    const activeUserIds = Object.keys(memberTotals).filter(uid => memberTotals[uid].subtotal > 0);
    const taxVal = parseFloat(receiptTax) || 0;
    const tipVal = parseFloat(receiptTip) || 0;

    if (aggregatedSubtotal > 0 && activeUserIds.length > 0) {
      activeUserIds.forEach(uid => {
        const ratio = memberTotals[uid].subtotal / aggregatedSubtotal;
        memberTotals[uid].taxShare = ratio * taxVal;
        memberTotals[uid].tipShare = ratio * tipVal;
        memberTotals[uid].total = memberTotals[uid].subtotal + memberTotals[uid].taxShare + memberTotals[uid].tipShare;
      });
    }

    return Object.values(memberTotals).filter(m => m.total > 0);
  };

  const submitScannedBill = async () => {
    const breakdown = calculateScannedItemizedBreakdown();
    if (breakdown.length === 0) {
      toast.error('Please assign at least one item to a participant');
      return;
    }

    setScanning(true);
    try {
      const participants = breakdown.map(b => ({
        userId: b.userId,
        amount: b.subtotal
      }));

      const expenseData = {
        groupId: id,
        description: scannedData.restaurant ? `Bill at ${scannedData.restaurant}` : 'AI Scanned Bill',
        amount: parseFloat(scannedData.total) || breakdown.reduce((s, x) => s + x.total, 0),
        category: 'food',
        splitType: 'itemized',
        participants,
        sharedCosts: {
          tax: receiptTax,
          tip: receiptTip
        },
        notes: `Extracted and assigned automatically from scanned receipt via FinBuddy AI.`
      };

      await api.post('/expenses', expenseData);
      toast.success('AI Itemized Split successfully added! 💸');
      setShowScanReceipt(false);
      setScannedData(null);
      loadGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit itemized expense');
    }
    setScanning(false);
  };

  const [expForm, setExpForm] = useState({
    description: '', amount: '', category: 'food',
    splitType: 'equal', notes: '',
    paidBy: '',
    selectedMembers: [],  // for selective/subgroup
    itemSplits: [],       // for item-based [{userId, amount, items}]
    percentageSplits: [], // for percentage [{userId, percentage}]
    shareSplits: [],      // for shares [{userId, shares}]
  });

  const [addExpenseTab, setAddExpenseTab] = useState('ai');
  const [aiText, setAiText] = useState('');

  const parseNaturalLanguageExpense = (text) => {
    if (!text) return null;
    const members = group?.members || [];
    let description = "Expense";
    let amount = 0;
    let paidByUserId = user?._id?.toString() || '';
    let splitType = 'equal';
    let selectedMembers = [];
    let itemSplits = [];
    let shareSplits = [];

    // 1. Extract amount (look for numbers)
    const amountMatch = text.match(/\b\d+(?:\.\d+)?\b/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[0]);
      // Remove amount from text to avoid matching it for names
      text = text.replace(amountMatch[0], '');
    }

    // 2. Extract description (everything before keywords like "paid by", "split")
    const keywords = ['paid by', 'split', 'with', 'owes', 'shares', 'share'];
    let descText = text;
    keywords.forEach(kw => {
      const idx = descText.toLowerCase().indexOf(kw);
      if (idx !== -1) {
        descText = descText.substring(0, idx);
      }
    });
    description = descText.trim().replace(/^[,-\s]+|[,-\s]+$/g, '') || "Group Expense";

    // 3. Extract "paid by [name]"
    const paidByMatch = text.toLowerCase().match(/paid by\s+([a-zA-Z0-9\s]+)/);
    if (paidByMatch) {
      const payerName = paidByMatch[1].trim().split(/\s+/)[0].toLowerCase();
      if (payerName === 'me' || payerName === 'i') {
        paidByUserId = user?._id?.toString();
      } else {
        const matchMember = members.find(m => m.user?.name?.toLowerCase().includes(payerName));
        if (matchMember) {
          paidByUserId = (matchMember.user?._id || matchMember.user).toString();
        }
      }
    }

    // 4. Extract "split with [names]" or custom owes
    const lowerText = text.toLowerCase();
    if (lowerText.includes('split with') || lowerText.includes('with')) {
      splitType = 'selective';
      const splitWithMatch = lowerText.match(/(?:split with|with)\s+([a-zA-Z0-9\s,and]+)/);
      if (splitWithMatch) {
        const namesList = splitWithMatch[1].replace(/\band\b/g, ',').split(',').map(n => n.trim().toLowerCase());
        selectedMembers = [user?._id?.toString()];
        namesList.forEach(name => {
          if (name === 'me' || name === 'i') return;
          const matchMember = members.find(m => m.user?.name?.toLowerCase().includes(name));
          if (matchMember) {
            const uid = (matchMember.user?._id || matchMember.user).toString();
            if (!selectedMembers.includes(uid)) selectedMembers.push(uid);
          }
        });
      }
    } else if (lowerText.includes('owes') || lowerText.includes(':')) {
      splitType = 'item';
      itemSplits = members.map(m => ({ userId: (m.user?._id || m.user).toString(), amount: 0 }));
      
      const owesRegex = /([a-zA-Z0-9]+)\s+owes\s+(\d+(?:\.\d+)?)/g;
      let match;
      let foundAny = false;
      while ((match = owesRegex.exec(lowerText)) !== null) {
        const name = match[1].toLowerCase();
        const owesAmount = parseFloat(match[2]);
        const idx = members.findIndex(m => m.user?.name?.toLowerCase().includes(name));
        if (idx !== -1) {
          itemSplits[idx].amount = owesAmount;
          foundAny = true;
        }
      }
      if (!foundAny) {
        splitType = 'equal';
      }
    } else {
      splitType = 'equal';
    }

    const payerObj = members.find(m => (m.user?._id || m.user).toString() === paidByUserId);

    return {
      description,
      amount,
      paidBy: paidByUserId,
      paidByName: payerObj?.user?.name || 'Me',
      splitType,
      selectedMembers,
      itemSplits,
      shareSplits
    };
  };


  const handleAISplitSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseNaturalLanguageExpense(aiText);
    if (!parsed || parsed.amount <= 0) {
      toast.error('Please enter a description and amount (e.g. Pizza 1200)');
      return;
    }

    try {
      let participants = [];
      if (parsed.splitType === 'selective') {
        participants = parsed.selectedMembers.map(uid => ({ userId: uid }));
      } else if (parsed.splitType === 'item') {
        participants = parsed.itemSplits.map(s => ({ userId: s.userId, amount: s.amount }));
      }

      const expenseData = {
        groupId: id,
        description: parsed.description,
        amount: parsed.amount,
        paidBy: parsed.paidBy,
        category: 'other',
        splitType: parsed.splitType === 'equal' ? 'equal' : parsed.splitType,
        participants,
        notes: 'Automatically parsed via FinBuddy AI Natural Language Command s'
      };

      if (!isOnline) {
        await saveOffline(expenseData);
      } else {
        await api.post('/expenses', expenseData);
        toast.success('AI parsed expense successfully added! s');
        loadGroup();
      }

      setShowAddExpense(false);
      setAiText('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit AI Split');
    }
  };

  const [customItems, setCustomItems] = useState([]);
  const [customSplitMode, setCustomSplitMode] = useState('direct');
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const handleAddItem = () => {
    const newItems = [...customItems, { name: '🍕 Food', price: '', assignedTo: 'all' }];
    setCustomItems(newItems);
    recalculateFromItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = customItems.filter((_, idx) => idx !== index);
    setCustomItems(newItems);
    recalculateFromItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...customItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setCustomItems(newItems);
    recalculateFromItems(newItems);
  };

  const recalculateFromItems = (itemsList) => {
    const members = group?.members || [];
    let totalSum = 0;
    
    // Initialize member shares to 0
    const memberShares = {};
    members.forEach(m => {
      const uid = (m.user._id || m.user).toString();
      memberShares[uid] = 0;
    });

    itemsList.forEach(item => {
      const price = parseFloat(item.price) || 0;
      totalSum += price;

      if (item.assignedTo === 'all') {
        const share = price / (members.length || 1);
        members.forEach(m => {
          const uid = (m.user._id || m.user).toString();
          memberShares[uid] += share;
        });
      } else if (memberShares[item.assignedTo] !== undefined) {
        memberShares[item.assignedTo] += price;
      }
    });

    // Update expForm amount and itemSplits
    const newItemSplits = members.map(m => {
      const uid = (m.user._id || m.user).toString();
      return {
        userId: uid,
        amount: memberShares[uid] > 0 ? memberShares[uid].toFixed(2) : ''
      };
    });

    setExpForm(f => ({
      ...f,
      amount: totalSum > 0 ? totalSum.toFixed(2) : '',
      itemSplits: newItemSplits
    }));
  };

  useEffect(() => {
    loadGroup();
  }, [id]);

  useEffect(() => {
    if (user) {
      setReceiptPayer(user._id?.toString() || '');
    }
  }, [user]);

  useEffect(() => {
    if (showAddExpense && user && !expForm.paidBy) {
      setExpForm(f => ({ ...f, paidBy: user._id }));
    }
  }, [showAddExpense, user]);

  // Fetch activity when activity tab active
  useEffect(() => {
    if (activeTab !== 'activity') return;
    setActivityLoading(true);
    api.get(`/groups/${id}/activity`)
      .then(({ data }) => { if (data.success) setActivityFeed(data.activities || []); })
      .catch(() => {})
      .finally(() => setActivityLoading(false));
  }, [activeTab, id]);

  const assignAllToItem = (itemIdx) => {
    const allUids = (group?.members || []).map(m => (m.user._id || m.user).toString());
    setItemAssignments(prev => ({ ...prev, [itemIdx]: allUids }));
  };

  const clearItemAssignments = (itemIdx) => {
    setItemAssignments(prev => ({ ...prev, [itemIdx]: [] }));
  };

  // Socket for live bill splitting
  useEffect(() => {
    const socket = getSocket();
    if (socket && showLiveBill) {
      socket.emit('bill:join', { roomId: id });
      socket.on('bill:item-added', (item) => {
        setLiveBillItems(prev => [...prev, item]);
      });
      socket.on('bill:user-joined', ({ userName }) => {
        toast.success(`${userName} joined the bill! 👋`);
      });
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('bill:item-added');
        socketRef.current.off('bill:user-joined');
      }
    };
  }, [showLiveBill, id]);

  const handleQuickDescChange = (e) => {
    const val = e.target.value;
    setQuickDesc(val);

    // Regex to match a trailing space and number (e.g. "Pizza 500" or "Dinner 850.50")
    const match = val.match(/(.+)\s+(\d+(?:\.\d+)?)$/);
    if (match) {
      setQuickDesc(match[1]);
      setQuickAmount(match[2]);
      toast.success(`Auto-extracted amount: ₹${match[2]}! 💸`);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickDesc.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmittingQuick(true);
    try {
      const expenseData = {
        groupId: id,
        description: quickDesc.trim(),
        amount: parseFloat(quickAmount),
        category: 'other',
        splitType: 'equal',
        participants: [],
        notes: 'Added via Inline Quick Split s'
      };

      await api.post('/expenses', expenseData);
      toast.success('Quick Split Added Successfully! s');
      setQuickDesc('');
      setQuickAmount('');
      loadGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add quick expense');
    } finally {
      setSubmittingQuick(false);
    }
  };

  const startEditExpense = (exp) => {
    setEditingExpenseId(exp._id);
    setExpForm({
      description: exp.description,
      amount: exp.amount.toString(),
      category: exp.category,
      splitType: exp.splitType,
      notes: exp.notes || '',
      paidBy: exp.paidBy?._id || exp.paidBy,
      selectedMembers: exp.participants?.map(p => p.userId) || [],
      itemSplits: exp.splits?.map(s => ({ userId: s.user?._id || s.user, amount: s.amount.toString() })) || [],
      percentageSplits: exp.participants?.map(p => ({ userId: p.userId, percentage: p.percentage?.toString() })) || [],
      shareSplits: exp.participants?.map(p => ({ userId: p.userId, shares: p.shares?.toString() })) || [],
    });
    setAddExpenseTab('manual');
    setIsEditingExpense(true);
    setShowAddExpense(true);
  };

  const handleEditExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      let participants = [];
      if (expForm.splitType === 'selective' || expForm.splitType === 'subgroup') {
        participants = expForm.selectedMembers.map(uid => ({ userId: uid }));
      } else if (expForm.splitType === 'item') {
        participants = expForm.itemSplits.map(s => ({ userId: s.userId, amount: parseFloat(s.amount) || 0 }));
      } else if (expForm.splitType === 'percentage') {
        participants = expForm.percentageSplits.map(s => ({ userId: s.userId, percentage: parseFloat(s.percentage) || 0 }));
      } else if (expForm.splitType === 'shares') {
        participants = expForm.shareSplits.map(s => ({ userId: s.userId, shares: parseInt(s.shares) || 1 }));
      }

      const expenseData = {
        description: expForm.description,
        amount: parseFloat(expForm.amount),
        category: expForm.category,
        splitType: expForm.splitType,
        paidBy: expForm.paidBy || user?._id,
        participants,
        notes: expForm.notes
      };

      await api.put(`/expenses/${editingExpenseId}`, expenseData);
      toast.success('Expense updated and splits recalculated! 📝');
      setShowAddExpense(false);
      setIsEditingExpense(false);
      setEditingExpenseId(null);
      loadGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this expense? All balances will be recalculated.');
    if (!confirmDelete) return;

    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted and balances updated! 🗑️');
      loadGroup();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleRaiseDisputePrompt = async (expenseId) => {
    const reason = window.prompt("State your reason for raising this dispute (e.g. 'I was charged twice', 'Amit didn't order pizza'):");
    if (!reason || !reason.trim()) return;

    try {
      const { data } = await api.post(`/expenses/${expenseId}/dispute`, { reason: reason.trim() });
      if (data.success) {
        toast.success('Dispute successfully registered! AI Advisor suggestion generated. 🛡️');
        loadGroup();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to raise dispute');
    }
  };

  const handleVoteDispute = async (expenseId, vote) => {
    try {
      const { data } = await api.post(`/expenses/${expenseId}/vote`, { vote });
      if (data.success) {
        toast.success(`Vote registered as ${vote.toUpperCase()}! 🗳️`);
        loadGroup();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit vote');
    }
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/expenses/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {}
  };

  const loadGroup = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data.group);
      setExpenses(data.expenses || []);
      setDebts(data.simplifiedDebts || []);
      setAnalytics(data.analytics);
      await loadNotifications();
    } catch (e) { toast.error('Failed to load group'); }
    setLoading(false);
  };

  const handleEditGroupSubmit = async (e) => {
    e.preventDefault();
    if (!editName) return toast.error('Group name is required');
    setUpdatingGroup(true);
    try {
      const { data } = await api.put(`/groups/${id}`, {
        name: editName,
        description: editDesc,
        emoji: editEmoji
      });
      if (data.success) {
        toast.success('Group details updated! 📝');
        setShowEditModal(false);
        loadGroup();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group');
    } finally {
      setUpdatingGroup(false);
    }
  };
  const handleSetEnvelope = async (e) => {
    e.preventDefault();
    if (!envelopeAmount || parseFloat(envelopeAmount) <= 0) return toast.error('Please enter a valid amount');
    setSavingEnvelope(true);
    try {
      const today = new Date();
      const { data } = await api.post(`/groups/${id}/envelope`, {
        category: envelopeCategory,
        budgetAmount: parseFloat(envelopeAmount),
        month: today.getMonth() + 1,
        year: today.getFullYear()
      });
      if (data.success) {
        toast.success('Budget envelope updated! 📬');
        setEnvelopeAmount('');
        setShowAddEnvelope(false);
        loadGroup();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set budget envelope');
    } finally {
      setSavingEnvelope(false);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      let participants = [];
      if (expForm.splitType === 'selective' || expForm.splitType === 'subgroup') {
        participants = expForm.selectedMembers.map(uid => ({ userId: uid }));
      } else if (expForm.splitType === 'item') {
        participants = expForm.itemSplits.map(s => ({ userId: s.userId, amount: parseFloat(s.amount) || 0, items: s.items || [] }));
      } else if (expForm.splitType === 'percentage') {
        participants = expForm.percentageSplits.map(s => ({ userId: s.userId, percentage: parseFloat(s.percentage) || 0 }));
      } else if (expForm.splitType === 'shares') {
        participants = expForm.shareSplits.map(s => ({ userId: s.userId, shares: parseInt(s.shares) || 1 }));
      }

      // 🧠  Auto-generate smart description from actual item names if none provided
      let autoDescription = expForm.description.trim();
      if (!autoDescription) {
        if (expForm.splitType === 'item' && customSplitMode === 'itemized' && customItems.length > 0) {
          const itemNames = customItems.filter(i => i.name && i.price).map(i => i.name);
          autoDescription = itemNames.length > 0
            ? itemNames.slice(0, 3).join(' + ') + (itemNames.length > 3 ? ` +${itemNames.length - 3} more` : '')
            : `${expForm.category.charAt(0).toUpperCase() + expForm.category.slice(1)} Expense`;
        } else {
          autoDescription = `${expForm.category.charAt(0).toUpperCase() + expForm.category.slice(1)} Expense`;
        }
      }

      // 🧠  Auto-detect primary category from items if in itemized mode
      let autoCategory = expForm.category;
      if (expForm.splitType === 'item' && customSplitMode === 'itemized' && customItems.length > 0) {
        const firstItem = customItems.find(i => i.name && i.price);
        if (firstItem?.name?.includes('Transport') || firstItem?.name?.includes('Cab')) autoCategory = 'transport';
        else if (firstItem?.name?.includes('Room') || firstItem?.name?.includes('Stay')) autoCategory = 'accommodation';
        else if (firstItem?.name?.includes('Shopping')) autoCategory = 'shopping';
        else if (firstItem?.name?.includes('Utilities') || firstItem?.name?.includes('Bills')) autoCategory = 'utilities';
        else if (firstItem?.name?.includes('Food')) autoCategory = 'food';
        else autoCategory = expForm.category;
      }

      const expenseData = {
        groupId: id,
        description: autoDescription,
        amount: parseFloat(expForm.amount),
        category: autoCategory,
        splitType: expForm.splitType,
        paidBy: expForm.paidBy || user?._id,
        participants,
        notes: expForm.notes,
        receiptData: (expForm.splitType === 'item' && customSplitMode === 'itemized') ? {
          items: customItems.filter(i => parseFloat(i.price) > 0).map(item => {
            const itemObj = {
              name: item.name || 'Item',
              price: parseFloat(item.price) || 0
            };
            if (item.assignedTo && item.assignedTo !== 'all') {
              itemObj.claimedBy = item.assignedTo;
            }
            return itemObj;
          }),
          subtotal: parseFloat(expForm.amount) || 0,
          total: parseFloat(expForm.amount) || 0
        } : null
      };

      if (!isOnline) {
        // Save to IndexedDB for later sync
        await saveOffline(expenseData);
      } else {
        await api.post('/expenses', expenseData);
        toast.success('Expense added! 💸');
        loadGroup();
      }

      setShowAddExpense(false);
      setCustomItems([]);
      setExpForm({
        description: '', amount: '', category: 'food',
        splitType: 'equal', notes: '',
        selectedMembers: [], itemSplits: [], percentageSplits: [], shareSplits: []
      });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add'); }
  };

  const addLiveBillItem = () => {
    if (!newItem.name || !newItem.price) return;
    const item = { ...newItem, price: parseFloat(newItem.price), id: Date.now() };
    socketRef.current?.emit('bill:add-item', { roomId: id, item });
    setLiveBillItems(prev => [...prev, item]);
    setNewItem({ name: '', price: '' });
  };

  const settleDebt = async (debtOrExpenseId, amount) => {
    if (typeof debtOrExpenseId === 'string') {
      setSettleTarget({ type: 'expense', id: debtOrExpenseId, amount });
      setSettleMethod('cash');
      setQrLoading(true);
      setShowSettleModal(true);
    } else {
      const isTheyOweMe = debtOrExpenseId.to === user._id?.toString();
      const debtAmount = amount || debtOrExpenseId.amount;
      setSettleTarget({ type: 'debt', debtObj: debtOrExpenseId, amount: debtAmount });
      
      const payeeUpi = debtOrExpenseId.toUser?.upiId;
      setSettleMethod(isTheyOweMe ? 'cash' : (payeeUpi ? 'upi' : 'cash'));
      setQrLoading(true);
      setShowSettleModal(true);
    }
  };

  const handleSettlementSuccess = (message, dataUser) => {
    triggerConfetti();
    setSettleSuccess(true);
    if (message) toast.success(message);
    if (dataUser) updateUser(dataUser);
    setTimeout(() => {
      setSettleSuccess(false);
      setShowSettleModal(false);
      loadGroup();
    }, 2800);
  };

  const executeSettlement = async () => {
    if (!settleTarget) return;
    setSettling(true);
    try {
      if (settleTarget.type === 'expense') {
        const { id, amount } = settleTarget;
        
        // Virtual Wallet Instant Transfer
        if (settleMethod === 'wallet') {
          if (user.virtualWallet < amount) {
            toast.error('Insufficient virtual wallet balance to settle! 💳');
            setSettling(false);
            return;
          }
          const { data } = await api.post('/expenses/settle', {
            expenseId: id,
            amount: amount,
            paymentMethod: 'wallet',
            paymentId: `PAY-WALLET-${Date.now()}`
          });
          handleSettlementSuccess('Instant transfer successful! Settled via FinBuddy Virtual Wallet. ✅', data.user);
        } else if (settleMethod === 'razorpay') {
          try {
            const { data: orderData } = await api.post('/trades/razorpay/order', {
              amount: amount || 0
            });
            const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock',
              amount: orderData.order.amount,
              currency: 'INR',
              name: 'FinBuddy',
              description: 'Settle group debt',
              order_id: orderData.order.id,
              handler: async (response) => {
                await api.post('/trades/razorpay/verify', response);
                const { data } = await api.post('/expenses/settle', {
                  expenseId: id,
                  paymentId: response.razorpay_payment_id,
                  amount: orderData.order.amount / 100,
                  paymentMethod: 'razorpay'
                });
                handleSettlementSuccess('Settled via Razorpay! ✅', data.user);
              },
              theme: { color: '#0052ff' }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          } catch (e) {
            console.error('Razorpay payment failed:', e);
            toast.error('Razorpay payment initialization failed. Please try again.');
          }
        } else {
          // Cash or UPI: trigger pending approval state!
          const { data } = await api.post('/expenses/settle', {
            expenseId: id,
            amount: amount,
            paymentMethod: settleMethod,
            paymentId: `PAY-${settleMethod.toUpperCase()}-${Date.now()}`
          });
          handleSettlementSuccess(data.message || 'Payment submitted! Awaiting payee approval. ⏳');
        }
      } else if (settleTarget.type === 'debt') {
        const { debtObj } = settleTarget;
        const myId = user._id?.toString();
        const isTheyOweMe = debtObj.to === myId;
        const targetFriendId = isTheyOweMe ? debtObj.from : debtObj.to;
        
        const unpaidExpenses = expenses.filter(exp => {
          const paidByFriend = (exp.paidBy?._id || exp.paidBy)?.toString() === targetFriendId;
          const paidByMe = (exp.paidBy?._id || exp.paidBy)?.toString() === myId;
          
          if (isTheyOweMe) {
            const friendSplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === targetFriendId);
            return paidByMe && friendSplit && !friendSplit.isPaid;
          } else {
            const mySplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === myId);
            return paidByFriend && mySplit && !mySplit.isPaid;
          }
        });

        if (unpaidExpenses.length === 0) {
          toast.error('No unpaid splits found for this transaction.');
          setSettling(false);
          return;
        }

        // Calculate total amount to check wallet balance
        const totalAmount = unpaidExpenses.reduce((sum, exp) => {
          const splitUser = isTheyOweMe ? targetFriendId : myId;
          const targetSplit = exp.splits.find(s => (s.user?._id || s.user)?.toString() === splitUser);
          return sum + (targetSplit ? parseFloat(targetSplit.amount) : 0);
        }, 0);

        if (settleMethod === 'wallet' && !isTheyOweMe && user.virtualWallet < totalAmount) {
          toast.error('Insufficient virtual wallet balance to settle all debts!');
          setSettling(false);
          return;
        }

        if (settleMethod === 'razorpay' && !isTheyOweMe) {
          try {
            const { data: orderData } = await api.post('/trades/razorpay/order', {
              amount: totalAmount || 0
            });
            const options = {
              key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock',
              amount: orderData.order.amount,
              currency: 'INR',
              name: 'FinBuddy',
              description: 'Settle group debts',
              order_id: orderData.order.id,
              handler: async (response) => {
                try {
                  setSettling(true);
                  await api.post('/trades/razorpay/verify', response);
                  let settledCount = 0;
                  let lastUserObj = null;
                  for (const exp of unpaidExpenses) {
                    const splitUser = myId;
                    const targetSplit = exp.splits.find(s => (s.user?._id || s.user)?.toString() === splitUser);
                    if (!targetSplit) continue;

                    const { data } = await api.post('/expenses/settle', {
                      expenseId: exp._id,
                      amount: targetSplit.amount,
                      paymentMethod: 'razorpay',
                      paymentId: response.razorpay_payment_id
                    });
                    if (data.success && data.user) {
                      lastUserObj = data.user;
                    }
                    settledCount++;
                  }
                  handleSettlementSuccess(`Successfully settled ${settledCount} outstanding splits via Razorpay! ✅`, lastUserObj);
                } catch (verifyErr) {
                  toast.error('Payment verification failed.');
                } finally {
                  setSettling(false);
                }
              },
              theme: { color: '#0052ff' }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
          } catch (e) {
            console.error('Razorpay payment failed:', e);
            toast.error('Razorpay payment initialization failed. Please try again.');
          } finally {
            setSettling(false);
          }
          return;
        }

        let settledCount = 0;
        let lastUserObj = null;
        for (const exp of unpaidExpenses) {
          const splitUser = isTheyOweMe ? targetFriendId : myId;
          const targetSplit = exp.splits.find(s => (s.user?._id || s.user)?.toString() === splitUser);
          if (!targetSplit) continue;

          const { data } = await api.post('/expenses/settle', {
            expenseId: exp._id,
            amount: targetSplit.amount,
            paymentMethod: settleMethod,
            paymentId: `PAY-DEBT-${settleMethod.toUpperCase()}-${Date.now()}`,
            ...(isTheyOweMe ? { debtorId: targetFriendId } : {})
          });
          if (data.success && data.user) {
            lastUserObj = data.user;
          }
          settledCount++;
        }

        if (isTheyOweMe) {
          handleSettlementSuccess(`Successfully recorded and approved ${settledCount} split payments! Debt resolved. ✅`, lastUserObj);
        } else {
          if (settleMethod === 'wallet') {
            handleSettlementSuccess(`Successfully settled ${settledCount} outstanding splits instantly using your Virtual Wallet! ✅`, lastUserObj);
          } else {
            handleSettlementSuccess(`Submitted ${settledCount} payments via ${settleMethod.toUpperCase()}! Awaiting payee approval. ⏳`);
          }
        }
      }
    } catch (err) {
      toast.error('Settlement failed to submit.');
    } finally {
      setSettling(false);
    }
  };

  const handleQuickWalletPay = async (debtObj) => {
    const amount = debtObj.amount || 0;
    if (user.virtualWallet < amount) {
      toast.error(`Insufficient Virtual Wallet balance! You need ₹${amount} but only have ₹${user.virtualWallet?.toFixed(2)}.`);
      return;
    }

    const confirmPay = window.confirm(`Pay ₹${amount} instantly to ${debtObj.toUser?.name || 'friend'} using your FinBuddy Virtual Wallet?`);
    if (!confirmPay) return;

    setSettling(true);
    try {
      const myId = user._id?.toString();
      const targetFriendId = debtObj.to;

      const unpaidExpenses = expenses.filter(exp => {
        const paidByFriend = (exp.paidBy?._id || exp.paidBy)?.toString() === targetFriendId;
        const mySplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === myId);
        return paidByFriend && mySplit && !mySplit.isPaid;
      });

      if (unpaidExpenses.length === 0) {
        toast.error('No unpaid splits found.');
        setSettling(false);
        return;
      }

      let settledCount = 0;
      let lastUserObj = null;
      for (const exp of unpaidExpenses) {
        const mySplit = exp.splits.find(s => (s.user?._id || s.user)?.toString() === myId);
        if (!mySplit) continue;

        const { data } = await api.post('/expenses/settle', {
          expenseId: exp._id,
          amount: mySplit.amount,
          paymentMethod: 'wallet',
          paymentId: `PAY-DEBT-WALLET-QUICK-${Date.now()}`
        });
        if (data.success && data.user) {
          lastUserObj = data.user;
        }
        settledCount++;
      }

      toast.success(`Successfully paid ₹${amount} to ${debtObj.toUser?.name || 'friend'} instantly from your wallet! 👛`);
      if (lastUserObj) {
        updateUser(lastUserObj);
      }
      loadGroup();
      triggerConfetti();
    } catch (err) {
      toast.error('Failed to settle via wallet.');
    } finally {
      setSettling(false);
    }
  };

  const handleQuickRecordCash = async (debtObj) => {
    const confirmRecord = window.confirm(`Record cash payment of ₹${debtObj.amount} received from ${debtObj.fromUser?.name || 'friend'}?`);
    if (!confirmRecord) return;
    
    setSettling(true);
    try {
      const myId = user._id?.toString();
      const targetFriendId = debtObj.from;
      
      const unpaidExpenses = expenses.filter(exp => {
        const paidByMe = (exp.paidBy?._id || exp.paidBy)?.toString() === myId;
        const friendSplit = exp.splits?.find(s => (s.user?._id || s.user)?.toString() === targetFriendId);
        return paidByMe && friendSplit && !friendSplit.isPaid;
      });

      if (unpaidExpenses.length === 0) {
        toast.error('No unpaid splits found.');
        setSettling(false);
        return;
      }

      let settledCount = 0;
      for (const exp of unpaidExpenses) {
        const friendSplit = exp.splits.find(s => (s.user?._id || s.user)?.toString() === targetFriendId);
        if (!friendSplit) continue;

        await api.post('/expenses/settle', {
          expenseId: exp._id,
          amount: friendSplit.amount,
          paymentMethod: 'cash',
          paymentId: `PAY-DEBT-CASH-QUICK-${Date.now()}`,
          debtorId: targetFriendId
        });
        settledCount++;
      }

      toast.success(`Successfully recorded ₹${debtObj.amount} cash payment from ${debtObj.fromUser?.name || 'friend'}! ✅`);
      loadGroup();
    } catch (err) {
      toast.error('Failed to record cash payment.');
    } finally {
      setSettling(false);
    }
  };

  const handleSendReminder = async (debtObj) => {
    try {
      const { data } = await api.post('/expenses/remind', {
        debtorId: debtObj.from,
        groupId: id,
        amount: debtObj.amount
      });
      if (data.success) {
        toast.success(`Sent payment reminder to ${debtObj.fromUser?.name || 'friend'}! 🔔`);
      }
    } catch (e) {
      toast.error('Failed to send reminder.');
    }
  };

  const validateInlineUpi = (val) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!val) {
      setInlineUpiError('UPI ID cannot be empty');
    } else if (!upiRegex.test(val)) {
      setInlineUpiError('Invalid UPI ID format (e.g. name@bank)');
    } else {
      setInlineUpiError('');
    }
  };

  const handleSaveInlineUpi = async () => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(inlineUpi)) {
      toast.error('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    
    try {
      const { data } = await api.put('/users/me', { upiId: inlineUpi });
      if (data.success) {
        updateUser({ upiId: inlineUpi });
        setIsEditingUpi(false);
        setQrLoading(true);
        toast.success('UPI ID updated successfully! 📱');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save UPI ID');
    }
  };

  const triggerConfetti = () => {
    // Create lightweight, colorful particles
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'absolute pointer-events-none rounded-full animate-ping';
      const colors = ['#00E5FF', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];
      const size = Math.random() * 8 + 6;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.zIndex = '9999';
      p.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      const modal = document.querySelector('.bg-\\[\\#0b1329\\]');
      if (modal) {
        modal.appendChild(p);
        setTimeout(() => {
          p.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200 - 150}px) scale(0)`;
          p.style.opacity = '0';
        }, 50);
        setTimeout(() => p.remove(), 1600);
      }
    }
  };

  const handleApproveSettlement = async (notificationId) => {
    try {
      const { data } = await api.post('/expenses/approve-settlement', { notificationId });
      if (data.success) {
        toast.success('Payment approved! Debt cleared. ✅');
        loadGroup();
      }
    } catch (e) {
      toast.error('Failed to approve settlement');
    }
  };

  const handleRejectSettlement = async (notificationId) => {
    try {
      const { data } = await api.post('/expenses/reject-settlement', { notificationId });
      if (data.success) {
        toast.success('Payment rejected. Notification sent back. ❌');
        loadGroup();
      }
    } catch (e) {
      toast.error('Failed to reject settlement');
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    toast.success('Invite code copied!');
  };

  if (loading || !user) return (
    <main className="lg:pl-72 flex-1 min-h-full flex items-center justify-center pt-16 lg:pt-0">
      <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </main>
  );

  const myBalance = group?.members?.find(m => (m.user?._id || m.user)?.toString() === user?._id?.toString())?.balance || 0;
  const myDebts = debts.filter(d => d.from === user?._id?.toString());
  const owedToMe = debts.filter(d => d.to === user?._id?.toString());
  const liveBillTotal = liveBillItems.reduce((s, i) => s + parseFloat(i.price || 0), 0);

  const isPreviewMode = expenses.length === 0;

  const computedAnalytics = useMemo(() => {
    const byCategory = {};
    const byMonth = {};
    const byMember = {};
    let totalSpend = 0;

    if (expenses && expenses.length > 0) {
      expenses.forEach(e => {
        const amt = Number(e.amount) || 0;
        totalSpend += amt;

        const cat = (e.category || 'other').toLowerCase();
        let catLabel = '📁 Other';
        if (cat === 'food' || cat === 'dining') catLabel = '🍕 Food';
        else if (cat === 'lodging' || cat === 'stay' || cat === 'rent') catLabel = '🏨 Room / Stay';
        else if (cat === 'transport' || cat === 'travel' || cat === 'cab') catLabel = '🚗 Transport / Cab';
        else if (cat === 'shopping' || cat === 'groceries') catLabel = '🛍️ Shopping';
        else if (cat === 'entertainment' || cat === 'movies') catLabel = '🎬 Entertainment';
        else catLabel = `📁 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;

        byCategory[catLabel] = (byCategory[catLabel] || 0) + amt;

        try {
          const date = new Date(e.date || e.createdAt || Date.now());
          const month = date.toLocaleString('default', { month: 'short' });
          byMonth[month] = (byMonth[month] || 0) + amt;
        } catch (err) {
          byMonth['Unknown'] = (byMonth['Unknown'] || 0) + amt;
        }

        const payerId = (e.paidBy?._id || e.paidBy || '').toString();
        const memberObj = group?.members?.find(m => (m.user?._id || m.user)?.toString() === payerId);
        const name = memberObj?.user?.name || 'Group Member';
        byMember[name] = (byMember[name] || 0) + amt;
      });
    }

    return {
      totalSpend,
      byCategory,
      byMonth,
      byMember
    };
  }, [expenses, group]);

  const activeAnalytics = analytics && Object.keys(analytics.byCategory || {}).length > 0 ? analytics : computedAnalytics;

  const pieData = Object.entries(activeAnalytics.byCategory || {}).map(([name, value]) => ({ name, value }));
  const trendData = Object.entries(activeAnalytics.byMonth || {}).map(([name, amount]) => ({ name, amount }));
  const memberData = Object.entries(activeAnalytics.byMember || {}).map(([name, amount]) => {
    const memberObj = group?.members?.find(m => (m.user?._id || m.user)?.toString() === name);
    return {
      name: memberObj?.user?.name || name,
      amount
    };
  });
  const safeTotalSpend = activeAnalytics.totalSpend || 0;

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Offline banner */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400">
              <span>📶</span>
              <span className="text-sm font-medium">You're offline — expenses will sync when reconnected</span>
            </div>
            {pendingCount > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>
        )}
        {isOnline && pendingCount > 0 && (
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between">
            <span className="text-sm text-cyan-400">🔄 {pendingCount} offline expense(s) ready to sync</span>
            <button onClick={syncPending} className="btn-primary text-xs" style={{ width: 'auto', padding: '6px 14px' }}>Sync Now</button>
          </div>
        )}

        {/* Premium Group Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link to="/split" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition">← Back</Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                  {group?.emoji || '👥'}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">{group?.name}</h1>
                  <p className="text-slate-400 text-xs mt-0.5 capitalize">{group?.type} · {group?.members?.length} members · {expenses.length} expenses</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {group?.type === 'trip' && (
                <>
                  <Link to={`/split/trip/${id}`}><button className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>✈️ Trip Vault</button></Link>
                  <Link to={`/split/photos/${id}`}><button className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>📸 Photos</button></Link>
                </>
              )}
              <button onClick={() => setShowLiveBill(true)} className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>⚡ Live Bill</button>
              <button onClick={() => setShowScanReceipt(true)} className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}>🧾 Scan AI</button>
              <button onClick={() => setShowAddExpense(true)} className="btn-primary text-xs" style={{ padding: '8px 16px', width: 'auto' }}>+ Add Expense</button>
              {group && user && (group.createdBy?._id || group.createdBy)?.toString() !== user._id?.toString() && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Leave this group?')) return;
                    try { await api.delete(`/groups/${id}/leave`); toast.success('Left group!'); navigate('/split'); }
                    catch (e) { toast.error(e.response?.data?.message || 'Failed to leave'); }
                  }}
                  className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                >🚪 Leave</button>
              )}
              {group && user && (group.createdBy?._id || group.createdBy)?.toString() === user._id?.toString() && (
                <>
                  <button onClick={() => { setEditName(group.name); setEditDesc(group.description || ''); setEditEmoji(group.emoji || '👥'); setShowEditModal(true); }}
                    className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>✏️ Edit</button>
                  <button onClick={async () => {
                    if (!window.confirm('Archive this group?')) return;
                    try { await api.delete(`/groups/${id}`); toast.success('Archived!'); navigate('/split'); }
                    catch (e) { toast.error('Failed to archive'); }
                  }} className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition cursor-pointer">🗑️ Archive</button>
                </>
              )}
            </div>
          </div>

          {/* Balance Hero Stats */}
          {expenses.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Group Total', val: `₹${safeTotalSpend.toLocaleString('en-IN')}`, icon: '💳', color: 'text-white', border: 'border-white/5' },
                { label: 'You Paid', val: `₹${expenses.filter(e => (e.paidBy?._id||e.paidBy)?.toString() === user?._id?.toString()).reduce((s,e)=>s+(Number(e.amount)||0),0).toLocaleString('en-IN')}`, icon: '👑', color: 'text-cyan-400', border: 'border-cyan-500/15' },
                { label: 'Your Share', val: `₹${expenses.reduce((s,e)=>{const sp=e.splits?.find(sp=>(sp.user?._id||sp.user)?.toString()===user?._id?.toString());return s+(Number(sp?.amount)||0);},0).toLocaleString('en-IN')}`, icon: '⚖️', color: 'text-indigo-400', border: 'border-indigo-500/15' },
                { label: 'Your Balance', val: (() => { const paid=expenses.filter(e=>(e.paidBy?._id||e.paidBy)?.toString()===user?._id?.toString()).reduce((s,e)=>s+(Number(e.amount)||0),0); const share=expenses.reduce((s,e)=>{const sp=e.splits?.find(sp=>(sp.user?._id||sp.user)?.toString()===user?._id?.toString());return s+(Number(sp?.amount)||0);},0); const b=paid-share; return b>=0?`+₹${b.toLocaleString('en-IN')}`:'-₹'+Math.abs(b).toLocaleString('en-IN'); })(), icon: '📊', color: (() => { const paid=expenses.filter(e=>(e.paidBy?._id||e.paidBy)?.toString()===user?._id?.toString()).reduce((s,e)=>s+(Number(e.amount)||0),0); const share=expenses.reduce((s,e)=>{const sp=e.splits?.find(sp=>(sp.user?._id||sp.user)?.toString()===user?._id?.toString());return s+(Number(sp?.amount)||0);},0); return paid-share>=0?'text-emerald-400':'text-red-400'; })(), border: (() => { const paid=expenses.filter(e=>(e.paidBy?._id||e.paidBy)?.toString()===user?._id?.toString()).reduce((s,e)=>s+(Number(e.amount)||0),0); const share=expenses.reduce((s,e)=>{const sp=e.splits?.find(sp=>(sp.user?._id||sp.user)?.toString()===user?._id?.toString());return s+(Number(sp?.amount)||0);},0); return paid-share>=0?'border-emerald-500/15':'border-red-500/15'; })() },
              ].map(s => (
                <div key={s.label} className={`card p-4 border ${s.border}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                    <span>{s.icon}</span>
                  </div>
                  <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Invite Code Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-sm">🔗</div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Invite Code</p>
                <p className="text-lg font-black tracking-[0.3em] text-cyan-400 font-mono">{group?.inviteCode}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyInviteCode} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-300 transition cursor-pointer">📋 Copy</button>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Join my FinBuddy group "'+group?.name+'"! Code: '+group?.inviteCode+' 💸')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg bg-green-600/80 hover:bg-green-600 text-white font-bold transition">🟢 Share</a>
            </div>
          </div>
        </div>


        {/* Pending Approvals Tray */}
        {notifications.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg shadow-amber-950/20 animate-pulse-subtle">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⏳</span>
              <h3 className="font-bold text-amber-400 text-sm tracking-wide uppercase">Pending Approvals Required</h3>
              <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                {notifications.length} Action{notifications.length > 1 ? 's' : ''} Pending
              </span>
            </div>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm">
                      {notif.sender?.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Received {new Date(notif.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleRejectSettlement(notif._id)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/40 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition"
                    >
                      Reject ❌
                    </button>
                    <button
                      onClick={() => handleApproveSettlement(notif._id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-950/40 border border-emerald-500/40"
                    >
                      Approve ✅
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/5 overflow-x-auto pb-0">
          {[['expenses','💸 Expenses'], ['debts','⚖️ Debts'], ['analytics','📊 Analytics'], ['activity','📋 Activity']].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 whitespace-nowrap cursor-pointer ${activeTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            {/* Search & Filter Bar */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="relative flex-1 min-w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input className="input-dark pl-8 text-xs h-9" placeholder="Search expenses..."
                  value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} />
              </div>
              <select className="input-dark text-xs h-9 bg-black/40" value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)}>
                <option value="all">All categories</option>
                <option value="food">🍱 Food</option>
                <option value="transport">🚗 Transport</option>
                <option value="accommodation">🏠 Stay</option>
                <option value="entertainment">🎉 Entertainment</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="utilities">⚡ Utilities</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            {/* s Sleek Inline Quick Add Bar (Equal Split) */}
            <form onSubmit={handleQuickAddSubmit} className="mb-6 flex flex-col sm:flex-row gap-3 p-3 bg-cyan-950/25 border border-cyan-500/20 rounded-xl hover:border-cyan-500/40 transition">
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                <span className="text-xl">⚡</span>
                <input
                  type="text"
                  className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-white placeholder-slate-500 flex-1 py-1"
                  placeholder="Quick split equally (e.g. Pizza 800)..."
                  value={quickDesc}
                  onChange={handleQuickDescChange}
                  required
                />
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                <span className="text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm text-white placeholder-slate-500 w-24 py-1"
                  placeholder="Amount"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingQuick}
                className="btn-primary hover:brightness-110 flex items-center justify-center gap-1 shrink-0"
                style={{
                  width: 'auto',
                  padding: '8px 18px',
                  background: 'linear-gradient(135deg, #00d4ff, #7C3AED)',
                  border: 'none',
                  borderRadius: '10px'
                }}
              >
                {submittingQuick ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Quick Split Equally ⚖️</span>
                )}
              </button>
            </form>

            {expenses.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">💸</div>
                <p className="text-slate-400">No expenses yet. Add the first one!</p>
              </div>
            ) : expenses.filter(e => {
                const matchSearch = !expenseSearch || e.description?.toLowerCase().includes(expenseSearch.toLowerCase());
                const matchCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
                return matchSearch && matchCategory;
              }).length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-3xl mb-3">🔍</div>
                <p className="text-slate-400 text-sm">No expenses match your filter.</p>
                <button onClick={() => { setExpenseSearch(''); setExpenseCategoryFilter('all'); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 underline cursor-pointer">Clear filters</button>
              </div>
            ) : expenses.filter(e => {
                const matchSearch = !expenseSearch || e.description?.toLowerCase().includes(expenseSearch.toLowerCase());
                const matchCategory = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
                return matchSearch && matchCategory;
              }).map(exp => {
              const mySplit = exp.splits?.find(s => s.user?._id === user._id || s.user === user._id);
              const iPaid = exp.paidBy?._id === user._id || exp.paidBy === user._id;

              // 🧠  Self-Healing Client Fallback: If splitType is 'item' and receiptData has no items, auto-generate from splits!
              let displayItems = exp.receiptData?.items || [];
              if (exp.splitType === 'item' && displayItems.length === 0 && exp.splits?.length > 0) {
                displayItems = exp.splits.map(s => {
                  const mId = s.user?._id || s.user;
                  const memberName = group?.members?.find(m => (m.user?._id || m.user)?.toString() === mId?.toString())?.user?.name || 'Member';
                  return {
                    name: `${memberName}'s share`,
                    price: s.amount,
                    claimedBy: mId
                  };
                });
              }

              return (
                <div 
                  key={exp._id} 
                  onClick={() => setExpandedExpenseId(expandedExpenseId === exp._id ? null : exp._id)}
                  className={`card flex flex-col transition-all duration-300 border cursor-pointer p-4 rounded-2xl relative overflow-hidden ${
                    expandedExpenseId === exp._id 
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/5' 
                      : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center text-2xl border border-cyan-500/20 shrink-0">
                        {exp.category === 'food' ? '🍕' :
                          exp.category === 'transport' ? '🚗' :
                            exp.category === 'accommodation' ? '🏨' :
                              exp.category === 'entertainment' ? '🎮' : '💰'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{exp.description}</p>
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/25 shrink-0">
                            {exp.splitType === 'equal' ? '⚖️ Equal' : '🧾 Itemized'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Paid by <strong className="text-slate-300 font-semibold">{exp.paidBy?.name || 'Unknown'}</strong> • {new Date(exp.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-extrabold text-white text-base">₹{exp.amount?.toLocaleString('en-IN')}</p>
                        {mySplit && !iPaid && (
                          <p className={`text-[10px] font-bold mt-0.5 ${mySplit.isPaid ? 'text-green-400' : 'text-red-400'}`}>
                            {mySplit.isPaid ? '✅ Settled' : `You owe ₹${mySplit.amount?.toFixed(0)}`}
                          </p>
                        )}
                        {iPaid && <p className="text-[10px] font-bold text-cyan-400 mt-0.5">👑 You paid</p>}
                      </div>
                      
                      {/* Collapsible Indicator Chevron */}
                      <span className={`text-slate-500 transition-transform duration-300 text-xs shrink-0 ${expandedExpenseId === exp._id ? 'rotate-180 text-cyan-400' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Premium Expanded Industry-Grade Receipt Dashboard */}
                  {expandedExpenseId === exp._id && (
                    <div 
                      className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in"
                      onClick={(e) => e.stopPropagation()} // Prevent collapse when interacting with the interior
                    >
                      {/* Thermal Receipt Ticket */}
                      <div className="relative bg-[#070b19] border border-slate-700/35 rounded-2xl p-4 shadow-inner overflow-hidden">
                        {/* Receipt Jagged Edge Visuals */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,transparent_50%,#070b19_50%)] bg-[length:8px_8px] border-t border-slate-700/50" />
                        
                        <div className="text-center pb-3 border-b border-dashed border-slate-700/60">
                          <div className="flex items-center justify-center gap-1.5 text-cyan-400">
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="text-[10px] tracking-widest font-black uppercase">Digital Receipt</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{exp.description}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5">TXID: SS-{exp._id.slice(-6).toUpperCase()} • {new Date(exp.date).toLocaleString('en-IN')}</p>
                        </div>

                        {/* Itemized Table */}
                        {displayItems.length > 0 && (
                          <div className="py-3 space-y-2">
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1">
                              <span>Item Description</span>
                              <span>Claimant Portion</span>
                              <span className="text-right">Price</span>
                            </div>
                            <div className="space-y-1.5">
                              {displayItems.map((item, itemIdx) => {
                                const claimedUser = item.claimedBy
                                  ? group?.members?.find(m => (m.user?._id || m.user)?.toString() === item.claimedBy.toString())?.user?.name
                                  : 'All Members (Split)';
                                return (
                                  <div key={itemIdx} className="flex justify-between items-center text-xs bg-white/5 hover:bg-white/10 p-2 rounded-xl transition duration-150">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-slate-300 font-semibold truncate">{item.name}</span>
                                    </div>
                                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-bold border border-slate-700/40 flex items-center gap-1 shrink-0">
                                      <User className="w-3 h-3" />
                                      <span>{claimedUser}</span>
                                    </span>
                                    <span className="text-cyan-400 font-extrabold text-right shrink-0">₹{item.price?.toLocaleString('en-IN')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Receipt Summary Footer */}
                        <div className="pt-3 border-t border-dashed border-slate-700/60 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Subtotal</span>
                            <span>₹{exp.amount?.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Tax & Fees (Proportional)</span>
                            <span>₹0.00</span>
                          </div>
                          <div className="flex justify-between text-white font-extrabold text-sm pt-1 border-t border-slate-800">
                            <span className="text-cyan-400">Total Bill</span>
                            <span className="text-cyan-400">₹{exp.amount?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Split Allocation Matrix Grid */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">📊 Split Allocations Matrix</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {exp.splits?.map((s, idx) => {
                            const mUser = group?.members?.find(m => (m.user?._id || m.user)?.toString() === s.user?._id?.toString() || (m.user?._id || m.user)?.toString() === s.user?.toString())?.user;
                            const isPayer = exp.paidBy?._id === s.user?._id || exp.paidBy === s.user?._id || exp.paidBy === s.user;
                            return (
                              <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition duration-150">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold overflow-hidden text-white border border-white/10 shrink-0">
                                    {mUser?.avatar ? <img src={mUser.avatar} alt="" className="w-full h-full object-cover" /> : mUser?.name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">{mUser?.name || 'Member'}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {isPayer ? '👑 Paid total bill' : '👤 Split Participant'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-black text-cyan-400">₹{s.amount?.toLocaleString('en-IN')}</p>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                                    {s.isPaid ? '✅ Settled' : '❌ Unpaid portion'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 🛡️ Dispute & Resolution Center */}
                      <div className="space-y-2.5 p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                            <span>🛡️ Dispute & Resolution Hub</span>
                          </span>
                          {exp.dispute?.isDisputed ? (
                            <span className="text-[9px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                              ACTIVE DISPUTE
                            </span>
                          ) : exp.dispute?.resolution ? (
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              RESOLVED
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              NO DISPUTES
                            </span>
                          )}
                        </div>

                        {/* Case 1: Active Dispute */}
                        {exp.dispute?.isDisputed && (
                          <div className="space-y-3 pt-1 text-xs">
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1.5 text-slate-300">
                              <p className="font-semibold text-red-400">⚠️ Dispute Raised:</p>
                              <p className="italic text-slate-200">"{exp.dispute.reason}"</p>
                            </div>

                            {exp.dispute.aiSuggestion && (
                              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-1 text-slate-300">
                                <p className="font-semibold text-purple-400 flex items-center gap-1">🤖 FinBuddy AI Suggestion:</p>
                                <p className="text-[11px] leading-relaxed text-slate-300">{exp.dispute.aiSuggestion}</p>
                              </div>
                            )}

                            {/* Votes & Voting Buttons */}
                            <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2.5">
                              {(() => {
                                const validVotes = exp.dispute.votes?.filter(v => v.vote === 'valid').length || 0;
                                const invalidVotes = exp.dispute.votes?.filter(v => v.vote === 'invalid').length || 0;
                                const majority = Math.ceil((group?.members?.length || 1) / 2);
                                const hasVoted = exp.dispute.votes?.some(v => (v.user?._id || v.user)?.toString() === user._id?.toString());
                                
                                return (
                                  <>
                                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                                      <span>Current Votes:</span>
                                      <span className="font-bold text-white font-mono">
                                        👍 {validVotes} Valid / 👎 {invalidVotes} Invalid
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                      <div className="h-full bg-emerald-500" style={{ width: `${(validVotes / (validVotes + invalidVotes || 1)) * 100}%` }} />
                                      <div className="h-full bg-red-500" style={{ width: `${(invalidVotes / (validVotes + invalidVotes || 1)) * 100}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 text-center font-medium">Majority threshold: {majority} votes</p>

                                    {!hasVoted ? (
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => handleVoteDispute(exp._id, 'valid')}
                                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer"
                                        >
                                          Vote Valid 👍
                                        </button>
                                        <button
                                          onClick={() => handleVoteDispute(exp._id, 'invalid')}
                                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer"
                                        >
                                          Vote Invalid 👎
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-center text-cyan-400 font-bold bg-cyan-500/5 border border-cyan-500/10 py-1 rounded-lg">
                                        ✅ You have voted. Awaiting consensus.
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Case 2: Resolved Dispute */}
                        {!exp.dispute?.isDisputed && exp.dispute?.resolution && (
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5 text-xs">
                            <p className="font-semibold text-emerald-400 flex items-center gap-1">✅ Dispute Resolved:</p>
                            <p className="text-slate-300 font-medium">{exp.dispute.resolution}</p>
                            {exp.dispute.resolvedAt && (
                              <p className="text-[10px] text-slate-500 font-mono">Resolved on {new Date(exp.dispute.resolvedAt).toLocaleDateString('en-IN')}</p>
                            )}
                          </div>
                        )}

                        {/* Case 3: No Dispute & Can Raise One */}
                        {!exp.dispute?.isDisputed && !exp.dispute?.resolution && (
                          <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                            <span>Agree with this expense breakdown?</span>
                            <button
                              onClick={() => handleRaiseDisputePrompt(exp._id)}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              Raise Dispute 🛡️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quick Payment Trigger inside the expanded drawer */}
                      {mySplit && !iPaid && !mySplit.isPaid && (
                        <button
                          onClick={() => settleDebt(exp._id, mySplit.amount)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition duration-300 transform active:scale-95 text-xs text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500/20 active:bg-red-500/30"
                        >
                          <span>💳 Pay Your Portion (₹{mySplit.amount?.toFixed(0)}) Now</span>
                        </button>
                      )}

                      {/* Edit / Delete triggers if creator or payer */}
                      {(exp.paidBy?._id === user._id || exp.paidBy === user._id || group?.createdBy === user._id) && (
                        <div className="flex gap-2.5 mt-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() => startEditExpense(exp)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-cyan-500/20 hover:bg-cyan-500/10 text-cyan-400 transition cursor-pointer"
                          >
                            <span>📝 Edit Expense</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/10 text-red-400 transition cursor-pointer"
                          >
                            <span>🗑️ Delete Expense</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Debts Tab */}
        {activeTab === 'debts' && (
          <div className="space-y-4">

            {/* Debts Summary Banner */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-white/[0.06]">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">🧠 Debt Minimization Engine</p>
                {debts.length === 0 ? (
                  <p className="text-emerald-400 font-bold text-base">✅ All settled up!</p>
                ) : (
                  <p className="text-white font-bold text-base">
                    <span className="text-cyan-400">{debts.length}</span> minimum transactions needed
                    <span className="text-slate-500 text-xs font-normal ml-2">(graph algorithm applied)</span>
                  </p>
                )}
              </div>
              {myDebts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 font-semibold">You owe {myDebts.length} {myDebts.length === 1 ? 'person' : 'people'}</span>
                  <button
                    onClick={() => myDebts.forEach(d => settleDebt(d))}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold transition cursor-pointer"
                  >
                    Settle All 💳
                  </button>
                </div>
              )}
              {owedToMe.length > 0 && myDebts.length === 0 && (
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  {owedToMe.length} {owedToMe.length === 1 ? 'person owes' : 'people owe'} you
                </span>
              )}
            </div>

            {debts.length > 0 && (
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-4 mb-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>🧠 Visual Settlement Flow Map</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-bold bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono">
                    REAL-TIME SYNC
                  </span>
                </div>

                <div className="space-y-3.5 pt-1">
                  {debts.map((debt, index) => {
                    const isIowe = debt.from === user._id?.toString();
                    const isTheyOweMe = debt.to === user._id?.toString();
                    
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-white/5 border border-white/5 hover:border-cyan-500/20 p-3 rounded-xl transition-all duration-300"
                      >
                        {/* Debtor Info */}
                        <div className="flex items-center gap-2.5 w-1/3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isIowe 
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                              : 'bg-white/5 border border-white/10 text-slate-300'
                          }`}>
                            {debt.fromUser?.name?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div className="truncate">
                            <p className={`text-xs font-bold truncate ${isIowe ? 'text-red-400' : 'text-slate-200'}`}>
                              {isIowe ? 'You' : (debt.fromUser?.name || 'Member')}
                            </p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Debtor</span>
                          </div>
                        </div>

                        {/* Animated Flow Arrow & Amount */}
                        <div className="flex-1 px-4 flex flex-col items-center justify-center relative">
                          <span className="text-[10px] font-black text-cyan-300 font-mono tracking-tight bg-[#070b19] border border-cyan-500/15 px-2.5 py-0.5 rounded-full z-10 shadow-md shadow-slate-950/50 mb-1">
                            ₹{debt.amount?.toLocaleString('en-IN')}
                          </span>
                          
                          <div className="w-full h-1 bg-gradient-to-r from-red-500/20 via-slate-800 to-emerald-500/20 rounded-full relative overflow-hidden">
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff] animate-flow-pulse" 
                              style={{ animationDelay: `${index * 0.5}s`, animationDuration: '2.5s' }}
                            />
                          </div>
                        </div>

                        {/* Creditor Info */}
                        <div className="flex items-center justify-end gap-2.5 w-1/3 text-right">
                          <div className="truncate">
                            <p className={`text-xs font-bold truncate ${isTheyOweMe ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {isTheyOweMe ? 'You' : (debt.toUser?.name || 'Member')}
                            </p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Payee</span>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isTheyOweMe 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                              : 'bg-white/5 border border-white/10 text-slate-300'
                          }`}>
                            {debt.toUser?.name?.[0]?.toUpperCase() || 'P'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {debts.length === 0 ? (
              <div className="card text-center py-10">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-slate-400">All settled up!</p>
              </div>
            ) : debts.map((debt, i) => {
              const isIowe = debt.from === user._id?.toString();
              const isTheyOweMe = debt.to === user._id?.toString();

              return (
                <div key={i} className={`card flex items-center justify-between border transition hover:scale-[1.01] duration-200 ${
                  isIowe 
                    ? 'bg-red-950/15 border-red-500/25 hover:border-red-500/40' 
                    : isTheyOweMe 
                      ? 'bg-emerald-950/15 border-emerald-500/25 hover:border-emerald-500/40' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Visual Avatars / Indicators */}
                    {isIowe ? (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 font-bold border border-red-500/20">
                          💸
                        </div>
                      </div>
                    ) : isTheyOweMe ? (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                          💰
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 font-bold border border-white/10">
                          ⚖️
                        </div>
                      </div>
                    )}

                    <div>
                      {isIowe ? (
                        <p className="font-medium text-white">
                          You owe <span className="text-red-400 font-bold">{debt.toUser?.name || 'Group Member'}</span>
                        </p>
                      ) : isTheyOweMe ? (
                        <p className="font-medium text-white">
                          <span className="text-emerald-400 font-bold">{debt.fromUser?.name || 'Group Member'}</span> owes you
                        </p>
                      ) : (
                        <p className="font-medium text-slate-300">
                          <span className="text-slate-200 font-bold">{debt.fromUser?.name || 'Group Member'}</span> owes <span className="text-slate-200 font-bold">{debt.toUser?.name || 'Group Member'}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isIowe ? 'Split equitably • Please settle soon' : isTheyOweMe ? 'Split equitably • Awaiting payment' : 'Simplified group transaction'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className={`text-lg font-extrabold ${
                      isIowe ? 'text-red-400' : isTheyOweMe ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      ₹{debt.amount?.toLocaleString('en-IN')}
                    </p>
                    {isIowe && (() => {
                      const payeeUpi = debt.toUser?.upiId;
                      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                      
                      if (payeeUpi) {
                        return (
                          <div className="flex items-center gap-1.5 animate-fade-in">
                            {user.virtualWallet >= debt.amount && (
                              <button
                                onClick={() => handleQuickWalletPay(debt)}
                                className="text-xs font-semibold tracking-wide flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg"
                                style={{ height: '32px' }}
                                title="Pay instantly via Virtual Wallet"
                              >
                                <span>Wallet 👛</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (isMobile) {
                                  const upiUrl = `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(debt.toUser?.name || 'Friend')}&am=${debt.amount}&cu=INR&tn=${encodeURIComponent('FinBuddy Split Settlement')}`;
                                  window.location.href = upiUrl;
                                  toast.success('Launching UPI App. Once paid, notify your friend to approve! 📱');
                                } else {
                                  settleDebt(debt);
                                }
                              }}
                              className="btn-primary text-xs font-semibold tracking-wide flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                              style={{ 
                                padding: '6px 12px', 
                                width: 'auto',
                                background: 'linear-gradient(135deg, #00D4FF, #0052FF)',
                                border: 'none',
                                borderRadius: '8px'
                              }}
                              title={isMobile ? 'Pay via UPI App instantly' : 'Show UPI QR Code'}
                            >
                              <span>UPI Pay 📱</span>
                            </button>
                            <button
                              onClick={() => settleDebt(debt)}
                              className="text-xs font-semibold tracking-wide flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 active:scale-95 transition-all w-8 h-8 rounded-lg"
                              title="Other Payment Options"
                            >
                              <span>⚙️</span>
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          {user.virtualWallet >= debt.amount && (
                            <button
                              onClick={() => handleQuickWalletPay(debt)}
                              className="text-xs font-semibold tracking-wide flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg"
                              style={{ height: '32px' }}
                              title="Pay instantly via Virtual Wallet"
                            >
                              <span>Wallet 👛</span>
                            </button>
                          )}
                          <button
                            onClick={() => settleDebt(debt)}
                            className="btn-primary text-xs font-semibold tracking-wide flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                            style={{ 
                              padding: '6px 12px', 
                              width: 'auto',
                              background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                              border: 'none',
                              borderRadius: '8px'
                            }}
                          >
                            <span>Settle 💳</span>
                          </button>
                        </div>
                      );
                    })()}
                    {isTheyOweMe && (
                      <div className="flex items-center gap-1.5 animate-fade-in">
                        <button
                          onClick={() => handleQuickRecordCash(debt)}
                          className="btn-primary text-xs font-semibold tracking-wide flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                          style={{ 
                            padding: '6px 12px', 
                            width: 'auto',
                            background: 'linear-gradient(135deg, #10B981, #047857)',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                        >
                          <span>Record Cash 💵</span>
                        </button>
                        <button
                          onClick={() => settleDebt(debt)}
                          className="text-xs font-semibold tracking-wide flex items-center justify-center bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-95 transition-all w-8 h-8 rounded-lg"
                          title="Show UPI QR / Other"
                        >
                          <span>📱</span>
                        </button>
                        <button
                          onClick={() => handleSendReminder(debt)}
                          className="text-xs font-semibold tracking-wide flex items-center justify-center bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20 active:scale-95 transition-all w-8 h-8 rounded-lg"
                          title="Ping / Remind Friend"
                        >
                          <span>🔔</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Interactive Preview Mode Banner */}
            {isPreviewMode && (
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-yellow-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-950/20 animate-pulse-subtle">
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="text-xl">📊</span>
                  <span className="text-xs font-bold tracking-wide uppercase">Interactive Preview Mode</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                  Add an expense to populate real-time metrics!
                </span>
              </div>
            )}
            
            {/* 📈 1. High-Fidelity Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Group Spend */}
              <div className="card bg-gradient-to-br from-indigo-950/20 to-slate-900 border-indigo-500/20 p-4 hover:border-indigo-500/30 transition duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Shared Group Spend</span>
                  <span className="text-xl">💰</span>
                </div>
                <p className="text-2xl font-black text-white">₹{safeTotalSpend.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-slate-400 mt-1">{expenses.length} raw transactions tracked</p>
              </div>

              {/* Your Balance */}
              <div className={`card bg-gradient-to-br p-4 border transition duration-200 ${
                myBalance >= 0 
                  ? 'from-emerald-950/20 to-slate-900 border-emerald-500/20 hover:border-emerald-500/30'
                  : 'from-red-950/20 to-slate-900 border-red-500/20 hover:border-red-500/30'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-semibold tracking-wider uppercase ${myBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {myBalance >= 0 ? 'Owed to You' : 'You Owe'}
                  </span>
                  <span className="text-xl">{myBalance >= 0 ? '📈' : '📉'}</span>
                </div>
                <p className={`text-2xl font-black ${myBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{Math.abs(myBalance || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Based on unpaid active splits</p>
              </div>

              {/* Your Personal Fair Share */}
              <div className="card bg-gradient-to-br from-cyan-950/20 to-slate-900 border-cyan-500/20 p-4 hover:border-cyan-500/30 transition duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">Your Fair Share</span>
                  <span className="text-xl">⚖️</span>
                </div>
                <p className="text-2xl font-black text-white">
                  ₹{Math.round(safeTotalSpend / (group?.members?.length || 1)).toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Equal split baseline calculation</p>
              </div>

              {/* Group Trust Index */}
              <div className="card bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-500/20 p-4 hover:border-amber-500/30 transition duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-amber-400 font-semibold tracking-wider uppercase">Group Trust Score</span>
                  <span className="text-xl">🛡️</span>
                </div>
                <p className="text-2xl font-black text-white">
                  {group?.members?.length 
                    ? Math.round(group.members.reduce((sum, m) => sum + (m.trustScore || 100), 0) / group.members.length)
                    : 100}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Payment settlement velocity factor</p>
              </div>
            </div>

            {/* 🤖 2. FinBuddy AI Smart Insights Panel */}
            <div className="card border-purple-500/20 bg-purple-950/5 relative overflow-hidden p-5 space-y-3">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-extrabold text-sm tracking-wider uppercase text-purple-400">FinBuddy AI Smart Budget Insights</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="space-y-2">
                  {/* Category Insights */}
                  <div className="flex gap-2">
                    <span className="text-purple-400">🍕</span>
                    <p>
                      <strong>Category Alert:</strong> {pieData.length > 0 
                        ? `"${pieData.sort((a,b) => b.value - a.value)[0]?.name}" is your highest category representing ₹${pieData.sort((a,b) => b.value - a.value)[0]?.value?.toFixed(0)} (${Math.round((pieData.sort((a,b) => b.value - a.value)[0]?.value / safeTotalSpend)*100)}%).`
                        : 'No category data collected yet.'}
                    </p>
                  </div>
                  {/* Payee Dominance */}
                  <div className="flex gap-2">
                    <span className="text-purple-400">💳</span>
                    <p>
                      <strong>Banker Rotation:</strong> {memberData.length > 0
                        ? `"${memberData.sort((a,b) => b.amount - a.amount)[0]?.name}" is the primary paymaster, funding ₹${memberData.sort((a,b) => b.amount - a.amount)[0]?.amount?.toFixed(0)} (${Math.round((memberData.sort((a,b) => b.amount - a.amount)[0]?.amount / safeTotalSpend)*100)}%) of total expenses.`
                        : 'No participant payment history.'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Debt Minimization */}
                  <div className="flex gap-2">
                    <span className="text-purple-400">s</span>
                    <p>
                      <strong>Settle Optimization:</strong> FinBuddy's bitmask optimization graph algorithm has successfully minimized individual group debts down to <strong>{debts.length} active transactions</strong>.
                    </p>
                  </div>
                  {/* Action Recommendation */}
                  <div className="flex gap-2">
                    <span className="text-purple-400">📈</span>
                    <p>
                      <strong>Action Item:</strong> {myBalance < 0 
                        ? `You are currently owing ₹${Math.abs(myBalance).toFixed(0)}. Use our instant UPI settlement to quickly return the group trust index to 100%.`
                        : myBalance > 0 
                          ? 'You are currently a net creditor. When other members pay you, check the top verification alert tray to approve their settlement.'
                          : 'Congratulations! Your account is completely settled and balanced with all other group members.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 📊 3. Premium Interactive Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Spending by Category Pie */}
              <div className="card border-white/5 hover:border-white/10 transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-white uppercase">Category Distribution</h3>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">Pie Chart</span>
                </div>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" paddingAngle={4}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#0b1329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                          formatter={(v) => `₹${v}`} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
                      {pieData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-400 capitalize truncate">{item.name}</span>
                          <span className="ml-auto font-bold text-white">₹{item.value.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[220px] text-slate-500 text-xs gap-2">
                    <span className="text-3xl">📊</span>
                    <span>No category data to display</span>
                  </div>
                )}
              </div>

              {/* Payments by Member Bar */}
              <div className="card border-white/5 hover:border-white/10 transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-white uppercase">Funding Contributions</h3>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">Bar Chart</span>
                </div>
                {memberData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={memberData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: '#0b1329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                          formatter={(v) => `₹${v}`}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="amount" fill="#00d4ff" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 border-t border-white/5 pt-4 text-center">
                      <p className="text-[10px] text-slate-500 font-medium">Visualizes each member's total raw monetary input paid to date</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[220px] text-slate-500 text-xs gap-2">
                    <span className="text-3xl">👥</span>
                    <span>No member contribution data to display</span>
                  </div>
                )}
              </div>

              {/* Spending Trends Area */}
              <div className="card md:col-span-2 border-white/5 hover:border-white/10 transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm tracking-wide text-white uppercase">Spending History Trend</h3>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">Area Chart</span>
                </div>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0b1329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                        formatter={(v) => `₹${v}`}
                        cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                      <Area type="monotone" dataKey="amount" stroke="#7C3AED" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 text-xs gap-2">
                    <span className="text-3xl">📈</span>
                    <span>No spending history trend to display</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ── Add Expense Modal (Magical AI Express Split & Manual options) ── */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b1329] border border-cyan-500/25 rounded-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl shadow-cyan-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💸</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{isEditingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                    <p className="text-xs text-slate-400">{isEditingExpense ? 'Update your shared expense' : 'Record a new shared expense'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddExpense(false);
                    setIsEditingExpense(false);
                    setEditingExpenseId(null);
                  }}
                  className="text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center border border-white/10"
                >
                  &times;
                </button>
              </div>

              {/* ── Single Flat Mode Selector ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { tab: 'manual', split: 'equal',    icon: '⚖️', label: 'Equal Split' },
                  { tab: 'manual', split: 'itemized', icon: '🧾', label: 'Itemized Bill' },
                  { tab: 'manual', split: 'custom',   icon: '✍️', label: 'Custom Shares' },
                  { tab: 'ai',     split: null,        icon: '⚡', label: 'AI Split' },
                ].map(opt => {
                  const isActive = opt.tab === 'ai'
                    ? addExpenseTab === 'ai'
                    : addExpenseTab === 'manual' && (
                        opt.split === 'equal' ? expForm.splitType === 'equal'
                        : opt.split === 'itemized' ? (expForm.splitType === 'item' && customSplitMode === 'itemized')
                        : (expForm.splitType === 'item' && customSplitMode === 'direct')
                      );
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        if (opt.tab === 'ai') {
                          setAddExpenseTab('ai');
                        } else {
                          setAddExpenseTab('manual');
                          const members = group?.members || [];
                          if (opt.split === 'equal') {
                            setExpForm(f => ({ ...f, splitType: 'equal', itemSplits: members.map(m => ({ userId: m.user._id || m.user, amount: '' })) }));
                            setCustomItems([]);
                            setCustomSplitMode('direct');
                          } else if (opt.split === 'itemized') {
                            setExpForm(f => ({ ...f, splitType: 'item', itemSplits: members.map(m => ({ userId: m.user._id || m.user, amount: '' })) }));
                            setCustomSplitMode('itemized');
                            if (customItems.length === 0) setCustomItems([{ name: '🍕 Food', price: '', assignedTo: 'all' }]);
                          } else {
                            setExpForm(f => ({ ...f, splitType: 'item', itemSplits: members.map(m => ({ userId: m.user._id || m.user, amount: '' })) }));
                            setCustomSplitMode('direct');
                            setCustomItems([]);
                          }
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 text-slate-400 border-white/8 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-[11px] leading-tight text-center">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* MODE 1: Express AI Split */}
              {addExpenseTab === 'ai' && (
                <form onSubmit={handleAISplitSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Express Command Input:</label>
                    <textarea
                      rows={3}
                      className="input-dark w-full p-3 text-sm focus:ring-1 focus:ring-cyan-500"
                      placeholder='e.g. Pizza 1200 paid by Amit, split with Rohan and Rahul'
                      value={aiText}
                      onChange={e => setAiText(e.target.value)}
                      required
                    />
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                      <p className="font-semibold text-cyan-400">💡 Natural Speech Command Examples:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><span className="text-slate-200">"Lunch 800"</span> (splits equally with everyone, paid by you)</li>
                        <li><span className="text-slate-200">"Cab 450 paid by Amit split with Rohan and Rahul"</span></li>
                        <li><span className="text-slate-200">"Drinks 1500 paid by Rahul, Amit owes 500, Rohan owes 1000"</span></li>
                      </ul>
                    </div>
                  </div>

                  {/* 👁️ Dynamic Parser Visual Preview */}
                  {aiText.trim() && (
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/25 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">s Live AI Split Preview</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                      </div>
                      
                      {(() => {
                        const p = parseNaturalLanguageExpense(aiText);
                        if (!p || p.amount <= 0) return <p className="text-xs text-slate-500 italic">Start typing description and amount (e.g. "Dinner 1000")...</p>;
                        
                        return (
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2 text-slate-300">
                              <div><span className="text-slate-500">Item:</span> <strong className="text-white">{p.description}</strong></div>
                              <div><span className="text-slate-500">Amount:</span> <strong className="text-cyan-400">₹{p.amount?.toLocaleString('en-IN')}</strong></div>
                              <div><span className="text-slate-500">Paid By:</span> <strong className="text-white">{p.paidByName}</strong></div>
                              <div><span className="text-slate-500">Split Method:</span> <strong className="text-white capitalize">{p.splitType}</strong></div>
                            </div>
                            
                            {/* Live calculations visualization */}
                            <div className="mt-3 p-2.5 bg-black/25 rounded-xl space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Calculated Portions:</span>
                              {p.splitType === 'equal' && (
                                <div className="flex justify-between items-center text-slate-300">
                                  <span>All group members split equally</span>
                                  <span className="font-bold text-white">₹{(p.amount / (group?.members?.length || 1)).toFixed(0)} each</span>
                                </div>
                              )}
                              {p.splitType === 'selective' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>Selected ({p.selectedMembers.length}):</span>
                                    <span>₹{(p.amount / (p.selectedMembers.length || 1)).toFixed(0)} each</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {p.selectedMembers.map(uid => {
                                      const m = group?.members?.find(mb => (mb.user?._id || mb.user).toString() === uid);
                                      return (
                                        <span key={uid} className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/10 font-medium">
                                          {m?.user?.name || 'Member'}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {p.splitType === 'item' && (
                                <div className="space-y-1">
                                  {p.itemSplits.filter(s => s.amount > 0).map(s => {
                                    const m = group?.members?.find(mb => (mb.user?._id || mb.user).toString() === s.userId);
                                    return (
                                      <div key={s.userId} className="flex justify-between items-center text-slate-300">
                                        <span>{m?.user?.name || 'Member'}</span>
                                        <span className="font-bold text-white">₹{s.amount?.toFixed(0)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      style={{
                        background: 'linear-gradient(135deg, #00d4ff, #7C3AED)',
                        border: 'none',
                        borderRadius: '10px'
                      }}
                    >
                      Express Split Expense 🚀
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 2: Manual Custom Split */}
              {addExpenseTab === 'manual' && (
                <form onSubmit={isEditingExpense ? handleEditExpenseSubmit : addExpense} className="space-y-4">
                  {/* Basic info */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Description (Optional)</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl py-2.5 px-4 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition" 
                      placeholder="e.g. Dinner (defaults to category)" 
                      value={expForm.description} 
                      onChange={e => {
                        const desc = e.target.value;
                        const lower = desc.toLowerCase();
                        let cat = expForm.category;
                        if (/\b(pizza|dinner|lunch|breakfast|food|restaurant|cafe|burger|starbucks|coffee|swiggy|zomato|groceries|snacks|dine|tea|chai|samosa)\b/i.test(lower)) {
                          cat = 'food';
                        } else if (/\b(uber|ola|cab|taxi|train|bus|flight|metro|petrol|fuel|diesel|auto|toll|parking|ticket)\b/i.test(lower)) {
                          cat = 'transport';
                        } else if (/\b(hotel|stay|rent|hostel|airbnb|room|pg|lodge|booking)\b/i.test(lower)) {
                          cat = 'accommodation';
                        } else if (/\b(movie|ticket|show|netflix|spotify|game|fun|party|bowling|pub|club|beer|drinks|cinema|concert|event)\b/i.test(lower)) {
                          cat = 'entertainment';
                        } else if (/\b(amazon|flipkart|clothes|shopping|shoes|gift|mall|groceries|mart|myntra)\b/i.test(lower)) {
                          cat = 'shopping';
                        } else if (/\b(electricity|water|wifi|internet|recharge|bill|gas|maintenance|subscription)\b/i.test(lower)) {
                          cat = 'utilities';
                        }
                        setExpForm(prev => ({ ...prev, description: desc, category: cat }));
                      }} 
                    />
                  </div>

                  {/* Who Paid? (Flat Picker) */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">Who Paid?</label>
                    <div className="flex flex-wrap gap-2">
                      {(group?.members || []).map(m => {
                        const uid = (m.user._id || m.user).toString();
                        const isPayer = expForm.paidBy === uid;
                        const isMe = user && uid === user._id;
                        return (
                          <button
                            key={uid}
                            type="button"
                            onClick={() => setExpForm(f => ({ ...f, paidBy: uid }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              isPayer
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/10'
                                : 'bg-white/5 text-slate-300 border-white/8 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                              {m.user?.avatar ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" /> : m.user?.name?.[0]}
                            </div>
                            <span>{isMe ? 'Me' : m.user?.name?.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        {expForm.splitType === 'item' && customSplitMode === 'itemized' ? 'Total Amount (Auto)' : 'Amount (₹)'}
                      </label>
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl py-2.5 px-4 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition disabled:opacity-75 disabled:cursor-not-allowed" 
                        placeholder="0" 
                        value={expForm.amount} 
                        onChange={e => setExpForm({ ...expForm, amount: e.target.value })} 
                        required 
                        disabled={expForm.splitType === 'item' && customSplitMode === 'itemized'} 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                      <select 
                        className="w-full bg-[#0b1329] border border-white/10 text-white rounded-xl py-2.5 px-4 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition" 
                        value={expForm.category} 
                        onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                      >
                        <option value="food" className="bg-[#0b1329]">🍕 Food</option>
                        <option value="transport" className="bg-[#0b1329]">🚗 Transport</option>
                        <option value="accommodation" className="bg-[#0b1329]">🏨 Stay</option>
                        <option value="entertainment" className="bg-[#0b1329]">🎮 Fun</option>
                        <option value="shopping" className="bg-[#0b1329]">🛍️ Shopping</option>
                        <option value="utilities" className="bg-[#0b1329]">s Utilities</option>
                        <option value="other" className="bg-[#0b1329]">📦 Other</option>
                      </select>
                    </div>
                  </div>

                  {/* ── Equal Split info banner ── */}
                  {expForm.splitType === 'equal' && expForm.amount && (
                    <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl text-xs text-center text-cyan-400 font-medium">
                      ⚖️ ₹{parseFloat(expForm.amount).toFixed(2)} ÷ {group?.members?.length} = <strong className="text-white text-sm ml-1">₹{(parseFloat(expForm.amount) / (group?.members?.length || 1)).toFixed(2)}</strong> each
                    </div>
                  )}

                  {/* ── If Custom/Itemized ── */}
                  {expForm.splitType === 'item' && (
                    <div className="space-y-4 animate-fade-in">
                      {customSplitMode === 'itemized' && (() => {
                        const CATS = [
                          { emoji: '🍕', label: 'Food' },
                          { emoji: '🚗', label: 'Cab' },
                          { emoji: '🏨', label: 'Stay' },
                          { emoji: '🛍️', label: 'Shop' },
                          { emoji: '🎮', label: 'Fun' },
                          { emoji: '⚡', label: 'Bills' },
                          { emoji: '🍺', label: 'Drinks' },
                          { emoji: '📦', label: 'Other' },
                        ];
                        return (
                          <div className="space-y-2">
                            {customItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl p-2 animate-fade-in">
                                {/* Category Dropdown */}
                                <div className="flex-1 min-w-[110px]">
                                  <select
                                    value={item.name}
                                    onChange={e => handleItemChange(idx, 'name', e.target.value)}
                                    className="w-full bg-[#0b1329] border border-white/10 text-white rounded-lg py-1.5 px-2 text-xs outline-none transition focus:border-cyan-400 cursor-pointer"
                                  >
                                    {CATS.map(cat => {
                                      const val = `${cat.emoji} ${cat.label}`;
                                      return (
                                        <option key={cat.label} value={val} className="bg-[#0b1329]">
                                          {cat.emoji} {cat.label}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Price */}
                                <div className="relative w-20 shrink-0">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-black/30 border border-white/10 text-white placeholder-slate-600 rounded-lg py-1.5 pl-5 pr-1 text-xs font-semibold focus:border-cyan-400 outline-none transition"
                                    value={item.price}
                                    onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                  />
                                </div>

                                {/* Who Dropdown */}
                                <div className="flex-1 min-w-[100px]">
                                  <select
                                    value={item.assignedTo}
                                    onChange={e => handleItemChange(idx, 'assignedTo', e.target.value)}
                                    className="w-full bg-[#0b1329] border border-white/10 text-white rounded-lg py-1.5 px-2 text-xs outline-none transition focus:border-cyan-400 cursor-pointer"
                                  >
                                    <option value="all" className="bg-[#0b1329]">👥 All</option>
                                    {(group?.members || []).map(m => {
                                      const uid = (m.user._id || m.user).toString();
                                      const isMe = user && uid === user._id;
                                      return (
                                        <option key={uid} value={uid} className="bg-[#0b1329]">
                                          👤 {isMe ? 'Me' : m.user?.name?.split(' ')[0]}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="text-slate-500 hover:text-red-400 transition text-sm p-1 cursor-pointer"
                                  title="Remove Item"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}

                            {/* Add + Total */}
                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 transition"
                              >+ Add Item</button>
                              {customItems.some(i => i.price) && (
                                <span className="text-xs font-bold text-white">
                                  Total: <span className="text-cyan-400">₹{customItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0).toLocaleString('en-IN')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Real-time sum validation for Direct Shares split */}
                      {customSplitMode === 'direct' && (() => {
                        const total = parseFloat(expForm.amount) || 0;
                        const assignedSum = expForm.itemSplits.reduce((sum, split) => sum + (parseFloat(split.amount) || 0), 0);
                        const difference = total - assignedSum;
                        
                        if (total === 0) return null;
                        
                        if (Math.abs(difference) < 0.05) {
                          return (
                            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-2xl text-xs text-center text-green-400 animate-fade-in font-medium">
                              ✅ Perfect! Sum of shares matches the total amount exactly.
                            </div>
                          );
                        }
                        
                        return (
                          <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl text-xs text-center text-yellow-400 animate-fade-in font-medium space-y-2">
                            <div>
                              ⚠️ Sum of shares (₹{assignedSum.toFixed(2)}) does not match total amount (₹{total.toFixed(2)}).
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {difference > 0 
                                ? `Remaining to allocate: ₹${difference.toFixed(2)}` 
                                : `Overallocated by: ₹${Math.abs(difference).toFixed(2)}`}
                            </div>
                            {difference > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Distribute remaining amount equally among participants
                                  const activeSplits = [...expForm.itemSplits];
                                  const sharePerMember = difference / activeSplits.length;
                                  const updatedSplits = activeSplits.map(s => ({
                                    ...s,
                                    amount: ((parseFloat(s.amount) || 0) + sharePerMember).toFixed(2)
                                  }));
                                  setExpForm(f => ({ ...f, itemSplits: updatedSplits }));
                                }}
                                className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-[10px] font-bold transition border border-yellow-500/25 cursor-pointer inline-flex items-center gap-1"
                              >
                                ⚖️ Distribute Remaining Equally
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Portions list */}
                      <div className="card bg-black/25 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">💰 Portions Breakdown</span>
                          {customSplitMode === 'direct' && (
                            <button
                              type="button"
                              onClick={() => {
                                const members = group?.members || [];
                                const total = parseFloat(expForm.amount) || 0;
                                const equalSplit = (total / (members.length || 1)).toFixed(2);
                                const updatedSplits = expForm.itemSplits.map(s => ({
                                  ...s,
                                  amount: equalSplit
                                }));
                                setExpForm(f => ({ ...f, itemSplits: updatedSplits }));
                              }}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer"
                            >
                              Reset to Equal Shares
                            </button>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          {(group?.members || []).map((m, idx) => {
                            const uid = (m.user._id || m.user).toString();
                            const share = parseFloat(expForm.itemSplits.find(s => s.userId === uid)?.amount) || 0;
                            return (
                              <div key={uid} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold overflow-hidden text-white border border-white/10 shrink-0">
                                    {m.user?.avatar ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" /> : m.user?.name?.[0]}
                                  </div>
                                  <span className="text-slate-300 font-medium">{m.user?.name || 'Member'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 text-[10px] font-bold">₹</span>
                                  {customSplitMode === 'itemized' ? (
                                    <input 
                                      type="number" 
                                      className="bg-cyan-950/20 border border-cyan-500/10 text-cyan-400 font-bold rounded-lg py-1 px-2.5 text-xs w-24 text-right outline-none transition opacity-90 cursor-not-allowed" 
                                      value={expForm.itemSplits.find(s => s.userId === uid)?.amount || ''}
                                      disabled
                                    />
                                  ) : (
                                    <input 
                                      type="number" 
                                      className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg py-1 px-2.5 text-xs w-24 text-right focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition" 
                                      value={expForm.itemSplits.find(s => s.userId === uid)?.amount || ''}
                                      onChange={e => {
                                        const newSplits = [...expForm.itemSplits];
                                        const sIdx = newSplits.findIndex(s => s.userId === uid);
                                        if (sIdx !== -1) {
                                          newSplits[sIdx] = { ...newSplits[sIdx], amount: e.target.value };
                                          setExpForm(f => ({ ...f, itemSplits: newSplits }));
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Notes (optional)</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl py-2.5 px-4 text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition" 
                      placeholder="Any additional details..." 
                      value={expForm.notes} 
                      onChange={e => setExpForm({ ...expForm, notes: e.target.value })} 
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExpense(false);
                        setIsEditingExpense(false);
                        setEditingExpenseId(null);
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      {isEditingExpense ? 'Save Changes 📝' : 'Add Expense 💸'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Live Bill Room Modal */}
        {showLiveBill && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-lg animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">s Live Bill Room</h2>
                  <p className="text-sm text-slate-400">Share QR for friends to join</p>
                </div>
                <button onClick={() => setShowLiveBill(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="flex gap-4 mb-6">
                {/* QR Code */}
                <div className="bg-white p-3 rounded-xl">
                  <QRCode value={`${window.location.origin}/split/group/${id}?livebill=1`} size={100} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">Room: {group?.name}</p>
                  <p className="text-sm text-slate-400 mb-3">Scan QR to join and add your items</p>
                  <div className={`flex items-center gap-2 text-sm ${liveBillItems.length > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {liveBillItems.length} items added
                  </div>
                </div>
              </div>

              {/* Add item */}
              <div className="flex gap-2 mb-4">
                <input className="input-dark flex-1" placeholder="Item name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                <input type="number" className="input-dark w-28" placeholder="₹" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} />
                <button onClick={addLiveBillItem} className="btn-primary" style={{ width: 'auto', padding: '0 16px' }}>+</button>
              </div>

              {/* Items list */}
              <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                {liveBillItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-white/5">
                    <span>{item.name}</span>
                    <span className="text-cyan-400">₹{item.price}</span>
                  </div>
                ))}
              </div>

              {liveBillItems.length > 0 && (
                <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-3 mb-4">
                  <span>Total</span>
                  <span className="text-cyan-400">₹{liveBillTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowLiveBill(false)} className="btn-secondary flex-1">Close</button>
                {liveBillItems.length > 0 && (
                  <button
                    onClick={async () => {
                      setExpForm({ description: 'Live Bill Split', amount: liveBillTotal, category: 'food', splitType: 'equal', notes: '' });
                      setShowLiveBill(false);
                      setShowAddExpense(true);
                    }}
                    className="btn-primary flex-1"
                  >
                    Split This Bill ←
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AI OCR Receipt Scanner Modal ── */}
        {showScanReceipt && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-4xl animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">🧾 AI Smart Receipt Scanner <span className="badge-cyan text-xs">Industry Premium</span></h2>
                  <p className="text-xs text-slate-400">Extracts printed/handwritten items and provides granular visual drag-and-split</p>
                </div>
                <button onClick={() => { setShowScanReceipt(false); setScannedData(null); setReceiptImagePreview(null); }} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>

              {!scannedData && !scanning && (
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center hover:border-cyan-500/30 transition cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                  <h3 className="text-lg font-bold mb-2">Upload or Snap Bill Receipt</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Take a live camera snap from your phone or select a saved bill receipt from your gallery.
                  </p>
                </div>
              )}

              {scanning && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-base text-cyan-400 font-medium animate-pulse">
                    🤖 AI OCR is scanning items and prices from your bill...
                  </p>
                  <p className="text-xs text-slate-500">Extracting details from handwriting and printed thermal paper slips!</p>
                </div>
              )}

              {scannedData && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Left Column: Image Preview and Basic Info (2/5 size) */}
                  <div className="md:col-span-2 space-y-4 border-r border-white/5 pr-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">📄 Scanned Bill Image</p>
                    <div className="border border-white/10 rounded-2xl overflow-hidden aspect-[3/4] bg-black/40 relative">
                      {receiptImagePreview ? (
                        <img src={receiptImagePreview} alt="Receipt Preview" className="w-full h-full object-contain" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                          No preview available
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Establishment Name</label>
                        <input
                          className="input-dark py-1 text-xs"
                          value={scannedData.restaurant || ''}
                          onChange={e => setScannedData({ ...scannedData, restaurant: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Total Bill (₹)</label>
                          <input
                            type="number"
                            className="input-dark py-1 text-xs font-bold text-cyan-400"
                            value={scannedData.total || ''}
                            onChange={e => setScannedData({ ...scannedData, total: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Who paid this bill?</label>
                          <select
                            className="input-dark py-1 text-xs text-white"
                            value={receiptPayer}
                            onChange={e => setReceiptPayer(e.target.value)}
                          >
                            {(group?.members || []).map(m => (
                              <option key={m.user._id || m.user} value={m.user._id || m.user}>
                                {m.user.name} {m.user._id === user._id ? '(You)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Items allocation list (3/5 size) */}
                  <div className="md:col-span-3 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">🏷️ Assign Items to Friends</p>
                    <p className="text-[11px] text-slate-500">Tap on member names to distribute cost. Use the shortcut controls for quick batch assignments.</p>

                    <div className="space-y-3">
                      {(scannedData.items || []).map((item, itemIdx) => {
                        const assignedIds = itemAssignments[itemIdx] || [];
                        const isUnassigned = assignedIds.length === 0;
                        return (
                          <div key={itemIdx} className={`p-3 bg-white/5 border rounded-2xl space-y-2 transition ${isUnassigned ? 'border-yellow-500/20' : 'border-white/5'}`}>
                            <div className="flex justify-between items-center font-medium">
                              <span className="text-sm text-white">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-cyan-400 font-bold">₹{item.price}</span>
                                <button
                                  type="button"
                                  onClick={() => assignAllToItem(itemIdx)}
                                  className="text-[9px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold"
                                >
                                  All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => clearItemAssignments(itemIdx)}
                                  className="text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-white/5">
                              {(group?.members || []).map(m => {
                                const uid = (m.user._id || m.user).toString();
                                const isAssigned = assignedIds.includes(uid);
                                return (
                                  <button
                                    key={uid}
                                    type="button"
                                    onClick={() => {
                                      const next = isAssigned
                                        ? assignedIds.filter(x => x !== uid)
                                        : [...assignedIds, uid];
                                      setItemAssignments({ ...itemAssignments, [itemIdx]: next });
                                    }}
                                    className={`text-[10px] px-2 py-1 rounded-lg border transition ${isAssigned
                                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 font-semibold'
                                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                      }`}
                                  >
                                    {m.user.name}
                                  </button>
                                );
                              })}
                            </div>

                            {isUnassigned && (
                              <p className="text-[10px] text-yellow-500/70 flex items-center gap-1 font-medium">
                                ⚠️ No one is assigned to this item. It will be excluded from splits.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Shared tax & tip inputs */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Shared Tax (₹)</label>
                        <input
                          type="number"
                          className="input-dark py-1 text-xs"
                          placeholder="Tax"
                          value={receiptTax}
                          onChange={e => setReceiptTax(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Shared Tip / Delivery Fee (₹)</label>
                        <input
                          type="number"
                          className="input-dark py-1 text-xs"
                          placeholder="Tip"
                          value={receiptTip}
                          onChange={e => setReceiptTip(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Live estimated breakdown */}
                    {calculateScannedItemizedBreakdown().length > 0 && (
                      <div className="card bg-cyan-500/5 border border-cyan-500/10 space-y-2">
                        <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">💰 Estimated Split Breakdown</h4>
                        <div className="space-y-1.5">
                          {calculateScannedItemizedBreakdown().map(item => (
                            <div key={item.userId} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center font-bold text-[8px]">
                                  {item.name[0]}
                                </div>
                                <span className="font-medium text-slate-300">{item.name}</span>
                              </div>
                              <span className="font-bold text-white">
                                ₹{item.total.toFixed(2)} <span className="text-[9px] text-slate-400 font-normal">(Base: ₹{item.subtotal.toFixed(0)} + Tax/Tip)</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setScannedData(null); setItemAssignments({}); setReceiptImagePreview(null); }}
                        className="btn-secondary flex-1"
                      >
                        Reset Upload
                      </button>
                      <button
                        type="button"
                        onClick={submitScannedBill}
                        className="btn-primary flex-1"
                      >
                        Submit Itemized Split 💸
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 💳 Advanced Multi-Method Settlement Modal */}
        {showSettleModal && settleTarget && (() => {
          const isIncomingRecord = settleTarget.type === 'debt' && settleTarget.debtObj && settleTarget.debtObj.to === user._id?.toString();
          const modalTitle = isIncomingRecord ? 'Record Payment Received' : 'Settle Balance';
          const modalSubtitle = isIncomingRecord ? 'Select how you received payment from your friend' : 'Choose your preferred transaction method';
          
          const confirmText = isIncomingRecord
            ? `Recording payment from ${settleTarget.debtObj.fromUser?.name || 'Friend'}`
            : settleTarget.type === 'debt' && settleTarget.debtObj
              ? `Paying ${settleTarget.debtObj.toUser?.name || 'Friend'}`
              : `Paying Friend`;

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0b1329] border border-cyan-500/25 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl shadow-cyan-950/30 transition-all duration-300 relative overflow-hidden animate-scale-in">
                {settleSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center animate-fade-in">
                    {/* Glowing Success Ring */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-pulse" />
                      <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-3xl rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                        ✓
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white tracking-wide">Settlement Complete!</h3>
                      <p className="text-xs text-slate-400 font-medium">Transaction recorded and updated successfully.</p>
                    </div>

                    {/* FinsCore Level Up Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
                      <span className="text-lg">⚡</span>
                      <div className="text-left">
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-mono">FinsCore Level Up</p>
                        <p className="text-xs text-amber-200 font-bold font-mono">+5 Trust Rating Points</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💳</span>
                        <div>
                          <h3 className="text-lg font-bold text-white">{modalTitle}</h3>
                          <p className="text-xs text-slate-400">{modalSubtitle}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSettleModal(false)}
                        className="text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center border border-white/10"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total to Settle</p>
                      <p className="text-3xl font-extrabold text-cyan-400">₹{settleTarget.amount?.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {confirmText}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 font-semibold block mb-1">Select Payment Mode:</p>
                      
                      {/* Virtual Wallet Mode */}
                      {!isIncomingRecord && (
                        <button
                          type="button"
                          onClick={() => setSettleMethod('wallet')}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                            settleMethod === 'wallet'
                              ? 'border-cyan-500 bg-cyan-500/10 text-white'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">👛</span>
                            <div className="text-left">
                              <p className="text-sm font-semibold">Settle via Virtual Wallet</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Balance: <span className="text-slate-300 font-semibold">₹{user.virtualWallet?.toLocaleString('en-IN') || '0'}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">⚡ Instant Transfer</span>
                        </button>
                      )}

                      {/* Cash Mode */}
                      <button
                        type="button"
                        onClick={() => setSettleMethod('cash')}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                          settleMethod === 'cash'
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💵</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold">{isIncomingRecord ? 'Received via Cash' : 'Settle via Cash'}</p>
                            <p className="text-[10px] text-slate-500">{isIncomingRecord ? 'Received physical money in person' : 'Pay physically in person'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 font-medium">{isIncomingRecord ? '⚡ Clear Debt Now' : '⏳ Requires Approval'}</span>
                      </button>

                      {/* UPI Mode */}
                      <button
                        type="button"
                        onClick={() => { setSettleMethod('upi'); setQrLoading(true); }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                          settleMethod === 'upi'
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📱</span>
                          <div className="text-left">
                            <p className="text-sm font-semibold">{isIncomingRecord ? 'Received via UPI / Bank' : 'Settle via UPI / QR Scan'}</p>
                            <p className="text-[10px] text-slate-500">{isIncomingRecord ? 'Received transfer via UPI App' : 'Pay using GPay, PhonePe, Paytm'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 font-medium">{isIncomingRecord ? '⚡ Clear Debt Now' : '⏳ Requires Approval'}</span>
                      </button>

                      {/* Razorpay Mode */}
                      {!isIncomingRecord && (
                        <button
                          type="button"
                          onClick={() => setSettleMethod('razorpay')}
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                            settleMethod === 'razorpay'
                              ? 'border-cyan-500 bg-cyan-500/10 text-white'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">💳</span>
                            <div className="text-left">
                              <p className="text-sm font-semibold">Settle via Razorpay Card/Netbanking</p>
                              <p className="text-[10px] text-slate-500">Instant direct digital checkout</p>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-400 font-medium">⚡ Instant Settled</span>
                        </button>
                      )}
                    </div>

                    {/* Dynamic P2P Real Money UPI QR & Mobile Link */}
                    {settleMethod === 'upi' && (() => {
                      const payeeName = isIncomingRecord
                        ? user.name
                        : settleTarget.type === 'debt'
                          ? settleTarget.debtObj?.toUser?.name
                          : (expenses.find(e => e._id === settleTarget.id)?.paidBy?.name || 'Friend');
                      
                      const payeeUpi = isIncomingRecord
                        ? user.upiId
                        : settleTarget.type === 'debt'
                          ? settleTarget.debtObj?.toUser?.upiId
                          : expenses.find(e => e._id === settleTarget.id)?.paidBy?.upiId;

                      const amount = settleTarget.amount || 0;

                      if (payeeUpi) {
                        const upiUrl = `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('FinBuddy Split Settlement')}`;
                        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`;

                        return (
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 animate-fade-in">
                            <div className="bg-white p-2.5 rounded-xl relative flex items-center justify-center" style={{ minWidth: '144px', minHeight: '144px' }}>
                              {qrLoading && (
                                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center rounded-lg">
                                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[8px] text-slate-400 mt-1 font-bold">LOADING QR</span>
                                </div>
                              )}
                              <img 
                                src={qrCodeUrl} 
                                alt="UPI QR Code" 
                                className="w-32 h-32 transition-opacity duration-300" 
                                style={{ opacity: qrLoading ? 0 : 1 }}
                                onLoad={() => setQrLoading(false)}
                              />
                            </div>
                            <div className="text-center w-full">
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                {isIncomingRecord ? 'Show QR to friend to receive money' : 'Scan to Pay Real Money'}
                              </p>
                              <div className="flex items-center justify-center gap-2 mt-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg max-w-xs mx-auto">
                                {isEditingUpi ? (
                                  <div className="flex gap-1.5 items-center w-full">
                                    <input
                                      type="text"
                                      value={inlineUpi}
                                      onChange={(e) => {
                                        setInlineUpi(e.target.value);
                                        validateInlineUpi(e.target.value);
                                      }}
                                      placeholder="name@upi"
                                      className="bg-black/40 border border-white/20 rounded-md px-2 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-500 flex-1 font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleSaveInlineUpi}
                                      disabled={!inlineUpi || !!inlineUpiError}
                                      className="text-[10px] bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-2 py-0.5 rounded font-bold transition active:scale-95 disabled:opacity-50"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsEditingUpi(false)}
                                      className="text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 px-2 py-0.5 rounded transition"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-xs text-cyan-300 font-bold font-mono">{payeeUpi}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(payeeUpi);
                                        setCopiedUpi(true);
                                        setTimeout(() => setCopiedUpi(false), 2000);
                                        toast.success('UPI ID copied to clipboard!');
                                      }}
                                      className="text-[10px] bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 transition active:scale-95 font-medium"
                                    >
                                      {copiedUpi ? 'Copied! ✅' : 'Copy 📋'}
                                    </button>
                                    {isIncomingRecord && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInlineUpi(payeeUpi || '');
                                          setInlineUpiError('');
                                          setIsEditingUpi(true);
                                        }}
                                        className="text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 px-2 py-0.5 rounded border border-white/10 transition active:scale-95"
                                        title="Edit UPI ID"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                              {isEditingUpi && inlineUpiError && (
                                <p className="text-[9px] text-red-400 text-center mt-1">{inlineUpiError}</p>
                              )}
                            </div>
                            {!isIncomingRecord && (
                              <>
                                <a 
                                  href={upiUrl}
                                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
                                >
                                  <span>📱 Open UPI App & Pay ₹{amount}</span>
                                </a>
                                <div className="flex items-center justify-center gap-3 py-1 bg-white/5 border border-white/5 rounded-xl w-full text-[10px] text-slate-500 select-none">
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Accepts:</span>
                                  <span className="hover:text-cyan-300 transition">🔍 GPay</span>
                                  <span className="hover:text-purple-300 transition">💜 PhonePe</span>
                                  <span className="hover:text-cyan-400 transition">💙 Paytm</span>
                                  <span className="hover:text-orange-400 transition">🇮🇳 BHIM</span>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center leading-normal max-w-xs px-2">
                                  💡 **Note:** When using a mobile device, clicking the button above will launch Google Pay, PhonePe, Paytm, or BHIM with the payment pre-filled.
                                </p>
                              </>
                            )}
                            {isIncomingRecord && (
                              <p className="text-[10px] text-slate-400 text-center leading-normal max-w-xs px-2">
                                💡 Ask your friend to scan this QR code with GPay, PhonePe, Paytm or BHIM to pay you ₹{amount}. Once paid, click **Record Received** below.
                              </p>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl text-xs space-y-2.5 animate-fade-in">
                            <div>
                              <p className="font-bold">⚠️ No UPI ID Configured</p>
                              <p className="leading-relaxed mt-0.5">
                                {isIncomingRecord 
                                  ? 'You have not added your UPI ID to your profile yet. Configure it below to show your QR code here.' 
                                  : 'This friend has not added their UPI ID to their profile yet. Ask them to configure it in settings, or use cash / virtual wallet to settle.'}
                              </p>
                            </div>
                            {isIncomingRecord && (
                              <div className="pt-2.5 border-t border-yellow-500/20 space-y-2">
                                <p className="text-[10px] text-yellow-300 font-semibold">Add your UPI ID now to instantly generate a QR code:</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="yourname@upi"
                                    value={inlineUpi}
                                    onChange={(e) => {
                                      setInlineUpi(e.target.value);
                                      validateInlineUpi(e.target.value);
                                    }}
                                    className="bg-black/40 border border-yellow-500/30 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-yellow-500/60 flex-1 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSaveInlineUpi}
                                    disabled={!inlineUpi || !!inlineUpiError}
                                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95"
                                  >
                                    Save
                                  </button>
                                </div>
                                {inlineUpiError && (
                                  <p className="text-[9px] text-red-400 font-bold mt-1">{inlineUpiError}</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    })()}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSettleModal(false)}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={executeSettlement}
                        disabled={settling}
                        className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                        style={{
                          background: 'linear-gradient(135deg, #00d4ff, #7C3AED)',
                          border: 'none',
                          borderRadius: '10px'
                        }}
                      >
                        {settling ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isIncomingRecord ? (
                          <span>Record Received 💵</span>
                        ) : (
                          <span>Confirm Payment 🚀</span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="card w-full max-w-md space-y-4 animate-fade-in relative border border-white/10 bg-slate-950 p-6 rounded-3xl shadow-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">📝 Edit Group Details</h2>
              <form onSubmit={handleEditGroupSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Group Name</label>
                  <input
                    type="text"
                    className="input-primary w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Flats & Bills"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    className="input-primary w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="e.g. Shared household expenses"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Group Emoji</label>
                  <input
                    type="text"
                    className="input-primary w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-center text-2xl"
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    placeholder="👥"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingGroup}
                    className="btn-primary flex-1"
                  >
                    {updatingGroup ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Activity Tab ─────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">📋 Group Activity Feed</h3>
              <button
                onClick={() => {
                  setActivityLoading(true);
                  api.get(`/groups/${id}/activity`)
                    .then(({ data }) => { if (data.success) setActivityFeed(data.activities || []); })
                    .catch(() => {})
                    .finally(() => setActivityLoading(false));
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition"
              >
                ↻ Refresh
              </button>
            </div>

            {activityLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <h4 className="font-bold text-white mb-2">No activity yet</h4>
                <p className="text-slate-400 text-sm">Add an expense or settle a debt to see activity here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityFeed.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 leading-snug">{a.text}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {a.timestamp
                          ? new Date(a.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : ''}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      a.type === 'settlement' ? 'bg-green-500/15 text-green-400' : 'bg-cyan-500/15 text-cyan-400'
                    }`}>
                      {a.type === 'settlement' ? 'SETTLED' : 'EXPENSE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <SectionGuide sectionId="/split/group/:id" />
      </main>
    
    </div>
  );
};

export default GroupDetail;

