// client/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PieChart, Pie, Cell } from 'recharts';
import { Search, UserPlus, Check, X, Flame, Award, Zap, Copy, Sparkles, Trophy, UserCheck, Shield, DollarSign, TrendingUp, QrCode, Share2, Camera, Send, Target } from 'lucide-react';

// XP / Level system
const getLevel = (finScore) => {
  if (finScore >= 900) return { level: 'Legend',      xpNext: 1000, color: '#EC4899', emoji: '💎' };
  if (finScore >= 800) return { level: 'Expert',      xpNext: 900,  color: '#7C3AED', emoji: '🌟' };
  if (finScore >= 700) return { level: 'Advanced',    xpNext: 800,  color: '#8B5CF6', emoji: '🚀' };
  if (finScore >= 600) return { level: 'Intermediate', xpNext: 700, color: '#22D3EE', emoji: '📈' };
  if (finScore >= 400) return { level: 'Beginner',    xpNext: 600,  color: '#34D399', emoji: '🌱' };
  return               { level: 'Newcomer',   xpNext: 400,  color: '#94A3B8', emoji: '👶' };
};

// Peer wealth percentile (mocked by finScore)
const getPercentile = (finScore) => Math.min(99, Math.round((finScore / 1000) * 85 + 10));


const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [badges, setBadges] = useState([]);
  const [personality, setPersonality] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [invoices, setInvoices] = useState([]);

  // Fetch real invoices from API when user is premium
  useEffect(() => {
    if (user?.isPremium) {
      api.get('/payments/invoices')
        .then(r => { if (r.data?.success) setInvoices(r.data.invoices || []); })
        .catch(() => setInvoices([]));
    }
  }, [user?.isPremium]);

  // Sync activeTab when query param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Interactive 3D Card tilt states
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: -(y / (rect.height / 2)) * 15,
      y: (x / (rect.width / 2)) * 15
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const shareFinScore = async () => {
    const shareText = `💎 My FinBuddy FinScore is ${user?.finScore || 500}! 📈\n💰 Virtual Balance: ₹${(user?.virtualWallet ?? 0).toLocaleString('en-IN')}\n🔥 Streak: ${user?.currentStreak || 0} days!\n\nJoin me on FinBuddy to master investing with virtual money! 🚀`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My FinScore Card',
          text: shareText,
          url: window.location.origin
        });
        toast.success('Successfully shared FinScore Card! 🚀');
      } catch (err) {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('FinScore metrics copied to clipboard! Share it anywhere! 📋');
    }
  };

  const [form, setForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    yearOfStudy: user?.yearOfStudy || '',
    bio: user?.bio || '',
    upiId: user?.upiId || '',
    isPublicProfile: user?.isPublicProfile ?? false,
    notifications: user?.notifications || { email: true, push: true }
  });

  // Re-sync form when user data loads / changes
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: user.name || '',
        college: user.college || '',
        yearOfStudy: user.yearOfStudy || '',
        bio: user.bio || '',
        upiId: user.upiId || '',
        isPublicProfile: user.isPublicProfile ?? false,
      }));
    }
  }, [user]);

  // 2FA
  const [show2FA, setShow2FA] = useState(false);
  const [otp2FA, setOtp2FA] = useState('');
  const [sending2FA, setSending2FA] = useState(false);

  // Friends & Social states
  const [friendsList, setFriendsList] = useState([]);
  const [friendRequestsList, setFriendRequestsList] = useState([]);
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialSearchResults, setSocialSearchResults] = useState([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  const [friendRoastText, setFriendRoastText] = useState('');
  const [roastingFriend, setRoastingFriend] = useState(false);
  const [selectedFriendNode, setSelectedFriendNode] = useState(null);
  const [peerBenchmark, setPeerBenchmark] = useState(null);
  const [loadingSocial, setLoadingSocial] = useState(false);
  
  // Cooperative Savings Race states
  const [coopVaults, setCoopVaults] = useState([]);
  const [vaultContributionAmount, setVaultContributionAmount] = useState('1000');
  
  // Stock Duels states
  const [stockDuels, setStockDuels] = useState([]);
  const [duelTicker, setDuelTicker] = useState('RELIANCE');
  const [duelDirection, setDuelDirection] = useState('UP');
  const [duelBetCoins, setDuelBetCoins] = useState('20');
  const [duelSelectedFriendId, setDuelSelectedFriendId] = useState('');

  // AI split nudge state
  const [nudgeTone, setNudgeTone] = useState('humorous');
  const [nudgeText, setNudgeText] = useState('');
  const [generatingNudge, setGeneratingNudge] = useState(false);
  const [mirroring, setMirroring] = useState(false);

  // Social Sub-tab navigation
  const [friendsSubTab, setFriendsSubTab] = useState('constellation'); // 'constellation', 'debts', 'savings_copy', 'challenges', 'qr_split'

  // Lend & Borrow Tracker
  const [debts, setDebts] = useState([]);
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtReason, setNewDebtReason] = useState('');
  const [newDebtType, setNewDebtType] = useState('lent'); // 'lent' or 'borrowed'
  const [newDebtFriendId, setNewDebtFriendId] = useState('');

  // Viral Roast Share Card
  const [showShareRoastModal, setShowShareRoastModal] = useState(false);
  const [roastPersonalityTag, setRoastPersonalityTag] = useState('Impulsive Spender 💸');
  const [roastScoreCard, setRoastScoreCard] = useState('F-');

  // Group Savings Ledger Extensions
  const [vaultLedger, setVaultLedger] = useState([]);

  // Money Challenges Desk
  const [moneyChallenges, setMoneyChallenges] = useState([]);
  const [newChallTitle, setNewChallTitle] = useState('No-Spend Weekend 🚫');
  const [newChallWager, setNewChallWager] = useState('10');
  const [newChallFriendId, setNewChallFriendId] = useState('');

  // Investment Copy Trading Dashboard
  const [copyTradingActive, setCopyTradingActive] = useState(false);
  const [copyAmount, setCopyAmount] = useState(10000);
  const [copyTradeHistory, setCopyTradeHistory] = useState([]);

  // QR Split Scanner
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanningStep, setQrScanningStep] = useState('idle'); // 'idle', 'scanning', 'scanned'
  const [scannedBillItems, setScannedBillItems] = useState([]);

  const [splitTaxRate, setSplitTaxRate] = useState(18); // 18% GST




  const [avatarFile, setAvatarFile] = useState(null);

  // Load user-keyed local state from API
  const loadProfileFeatures = async () => {
    try {
      const [vaultsRes, debtsRes, duelsRes, challengesRes] = await Promise.allSettled([
        api.get('/profile-features/vaults'),
        api.get('/profile-features/debts'),
        api.get('/profile-features/duels'),
        api.get('/profile-features/challenges')
      ]);

      if (vaultsRes.status === 'fulfilled' && vaultsRes.value.data?.success) {
        setCoopVaults(vaultsRes.value.data.vaults || []);
      }
      if (debtsRes.status === 'fulfilled' && debtsRes.value.data?.success) {
        setDebts(debtsRes.value.data.debts || []);
      }
      if (duelsRes.status === 'fulfilled' && duelsRes.value.data?.success) {
        setStockDuels(duelsRes.value.data.duels || []);
      }
      if (challengesRes.status === 'fulfilled' && challengesRes.value.data?.success) {
        setMoneyChallenges(challengesRes.value.data.challenges || []);
      }
    } catch (e) {
      console.error('Failed to load profile features:', e);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    const keys = ['vaultLedger','copyTradeHistory'];
    const [vl,ct] = keys.map(k => {
      try { return JSON.parse(localStorage.getItem(`finbuddy_${k}_${user._id}`) || '[]'); } catch { return []; }
    });
    setVaultLedger(vl); setCopyTradeHistory(ct);
    loadProfileFeatures();
  }, [user?._id]);

  // Helper: persist a local state array to user-keyed localStorage
  const persistState = (key, value) => {
    localStorage.setItem(`finbuddy_${key}_${user?._id}`, JSON.stringify(value));
  };

  useEffect(() => {
    if (activeTab === 'badges') loadBadges();
    if (activeTab === 'personality') loadPersonality();
    if (activeTab === 'referral') loadReferral();
    if (activeTab === 'friends') loadSocialData();
  }, [activeTab]);

  // Live simulated stock duel ticker & timer countdown
  useEffect(() => {
    if (activeTab !== 'friends') return;
    
    const interval = setInterval(() => {
      setStockDuels(prev => prev.map(duel => {
        if (duel.status !== 'active') return duel;
        
        // 1. Sim price change fluctuation
        const currentChange = parseFloat(duel.percentageChange);
        const delta = (Math.random() - 0.5) * 0.3; // +/- 0.15% fluctuation
        const newChange = (currentChange + delta).toFixed(2);
        const sign = parseFloat(newChange) >= 0 ? '+' : '';
        
        // 2. Decrement duration timer
        let newDuration = duel.durationLeft;
        const durationRegex = /(\d+)h\s*(\d+)m/;
        const match = duel.durationLeft.match(durationRegex);
        if (match) {
          let hrs = parseInt(match[1]);
          let mins = parseInt(match[2]);
          if (mins > 0) {
            mins -= 1;
          } else if (hrs > 0) {
            hrs -= 1;
            mins = 59;
          }
          newDuration = `${hrs}h ${mins}m`;
        }
        
        return {
          ...duel,
          percentageChange: `${sign}${newChange}%`,
          durationLeft: newDuration
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const loadSocialData = async () => {
    setLoadingSocial(true);
    try {
      const [friendsRes, benchmarkRes] = await Promise.allSettled([
        api.get('/users/friends'),
        api.get('/users/peer-benchmark')
      ]);
      
      if (friendsRes.status === 'fulfilled') {
        setFriendsList(friendsRes.value.data.friends || []);
        setFriendRequestsList(friendsRes.value.data.friendRequests || []);
        if (friendsRes.value.data.friends?.length > 0) {
          setSelectedFriendNode(friendsRes.value.data.friends[0]);
        }
      }
      
      if (benchmarkRes.status === 'fulfilled') {
        setPeerBenchmark(benchmarkRes.value.data.benchmark);
      }
    } catch (err) {
      toast.error('Failed to load social metrics');
    }
    setLoadingSocial(false);
  };

  const searchSocialUsers = async (e) => {
    e.preventDefault();
    if (!socialSearchQuery.trim()) return;
    setSearchingFriends(true);
    try {
      const { data } = await api.get(`/users/search?query=${socialSearchQuery}`);
      setSocialSearchResults(data.users || []);
      if (data.users?.length === 0) {
        toast.error('No public profiles found matching that search');
      }
    } catch (e) {
      toast.error('Search failed');
    }
    setSearchingFriends(false);
  };

  const sendSocialFriendRequest = async (userId) => {
    try {
      const { data } = await api.post('/users/friend-request', { userId });
      toast.success(data.message || 'Request sent! ✉️');
      setSocialSearchResults(prev => prev.map(u => u._id === userId ? { ...u, requestSent: true } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const acceptSocialFriendRequest = async (userId) => {
    try {
      const { data } = await api.put('/users/friend-accept', { userId });
      toast.success('Friend request accepted! 🤝');
      loadSocialData();
    } catch (err) {
      toast.error('Failed to accept request');
    }
  };

  const declineSocialFriendRequest = async (userId) => {
    try {
      await api.put('/users/friend-decline', { userId });
      toast.success('Friend request declined! 🚫');
      loadSocialData();
    } catch (err) {
      toast.error('Failed to decline request');
    }
  };

  const triggerPeerRoast = async (friendId) => {
    setRoastingFriend(true);
    setFriendRoastText('');
    try {
      const { data } = await api.get(`/users/roast/${friendId}`);
      setFriendRoastText(data.roast || 'Roast not available.');
      toast.success('Roast generated by AI Mentor! 🔥');
    } catch (err) {
      toast.error('Failed to generate roast');
    }
    setRoastingFriend(false);
  };

  const triggerNudgeScript = async (friendName, amount) => {
    setGeneratingNudge(true);
    try {
      const res = await api.post('/mentor/chat', {
        message: `Give me a 2-sentence motivational financial nudge. My FinScore is ${user?.finScore || 500} and my virtual wallet is ₹${(user?.virtualWallet || 0).toLocaleString('en-IN')}.`,
      });
      const reply = res.data?.reply || res.data?.message;
      if (reply) {
        setNudgeText(reply);
        toast.success('AI Nudge script ready! 📋');
      }
    } catch (e) {
      // Fallback to tone-based script
      let script = '';
      if (nudgeTone === 'humorous') {
        script = `Hey ${friendName}! Nifty is up but my cashflow is down 📉. Mind settling that ₹${amount} split? I promise to invest it wisely! ☕`;
      } else if (nudgeTone === 'passive-aggressive') {
        script = `Hi ${friendName}. Just a gentle reminder about the ₹${amount} split. I know compounding interest works wonders, but I didn't think it applied to my pocket money too. Settle up when free! ⏳`;
      } else {
        script = `Hi ${friendName}, hope you're doing well. Reminding you about the outstanding split of ₹${amount} for our group expense. Kindly transfer via UPI when you can. Thanks!`;
      }
      setNudgeText(script);
      toast.success('Keep tracking your finances! Your FinScore grows with every good decision. 💪');
    }
    setGeneratingNudge(false);
  };

  const contributeToVault = async (vaultId) => {
    const amt = parseFloat(vaultContributionAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid contribution amount');
      return;
    }
    try {
      const res = await api.post(`/profile-features/vaults/${vaultId}/contribute`, { amount: amt });
      if (res.data?.success) {
        toast.success(`Contributed ₹${amt} to your shared piggy bank! 🐷`);
        updateUser({ ...user, virtualWallet: res.data.walletBalance });
        // Refresh vaults
        const vaultsRes = await api.get('/profile-features/vaults');
        if (vaultsRes.data?.success) setCoopVaults(vaultsRes.data.vaults);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contribution failed');
    }
  };

  const challengeStockDuel = async (e) => {
    e.preventDefault();
    if (!duelSelectedFriendId) {
      toast.error('Select a friend to challenge');
      return;
    }
    const coins = parseInt(duelBetCoins);
    if (isNaN(coins) || coins <= 0) {
      toast.error('Enter valid coins amount');
      return;
    }
    const friend = friendsList.find(f => f._id === duelSelectedFriendId);
    const friendName = friend ? friend.name : 'your friend';

    try {
      const res = await api.post('/profile-features/duels', {
        ticker: duelTicker,
        direction: duelDirection,
        friendName,
        betCoins: coins
      });
      if (res.data?.success) {
        toast.success(`Challenged ${friendName} to a ${duelTicker} Duel for 🪙${coins}! ⚔️`);
        updateUser({ ...user, virtualCoins: res.data.coinsBalance });
        // Refresh duels
        const duelsRes = await api.get('/profile-features/duels');
        if (duelsRes.data?.success) setStockDuels(duelsRes.data.duels);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Challenge failed');
    }
  };

  const resolveStockDuel = async (duelId) => {
    try {
      const res = await api.post(`/profile-features/duels/${duelId}/resolve`);
      if (res.data?.success) {
        if (res.data.won) {
          toast.success(`You won the Stock Duel! Earned 🪙${res.data.reward} virtual coins! 🏆`);
        } else {
          toast.error(`You lost the Stock Duel. Better luck next time! 😢`);
        }
        updateUser({ ...user, virtualCoins: res.data.coinsBalance });
        // Refresh duels
        const duelsRes = await api.get('/profile-features/duels');
        if (duelsRes.data?.success) setStockDuels(duelsRes.data.duels);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve duel');
    }
  };

  const mirrorFriendPortfolio = async () => {
    if (!selectedFriendNode) return;
    setMirroring(true);
    try {
      const { data } = await api.post('/wealth/mirror', { friendId: selectedFriendNode._id });
      if (data.success) {
        toast.success(data.message || 'Portfolio mirrored successfully!');
        if (data.user) {
          updateUser(data.user);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mirror portfolio');
    }
    setMirroring(false);
  };

  // Lend & Borrow Tracker functions
  const addDebt = async (e) => {
    e.preventDefault();
    if (!newDebtFriendId) {
      toast.error('Please select a buddy');
      return;
    }
    const amt = parseFloat(newDebtAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!newDebtReason.trim()) {
      toast.error('Enter a reason/description');
      return;
    }
    const friend = friendsList.find(f => f._id === newDebtFriendId);
    const friendName = friend ? friend.name : 'your friend';

    try {
      const res = await api.post('/profile-features/debts', {
        friendName,
        type: newDebtType,
        amount: amt,
        reason: newDebtReason
      });
      if (res.data?.success) {
        toast.success(`Added: ${newDebtType === 'lent' ? 'Lent' : 'Borrowed'} ₹${amt} ${newDebtType === 'lent' ? 'to' : 'from'} ${friendName} ✅`);
        setNewDebtAmount('');
        setNewDebtReason('');
        // Refresh debts
        const debtsRes = await api.get('/profile-features/debts');
        if (debtsRes.data?.success) setDebts(debtsRes.data.debts);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add debt');
    }
  };

  const settleDebt = async (debtId) => {
    const debt = debts.find(d => (d._id === debtId || d.id === debtId));
    if (!debt) return;

    toast.success(`Launching mock UPI payment for ₹${debt.amount} to ${debt.friendName}... 📱`);
    setTimeout(async () => {
      try {
        const res = await api.delete(`/profile-features/debts/${debt._id || debtId}/settle`);
        if (res.data?.success) {
          toast.success(`Transaction Approved! Settled ₹${debt.amount} with ${debt.friendName} 🤝`);
          // Refresh debts
          const debtsRes = await api.get('/profile-features/debts');
          if (debtsRes.data?.success) setDebts(debtsRes.data.debts);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to settle debt');
      }
    }, 1500);
  };

  // Peer challenges functions
  const proposeChallenge = async (e) => {
    e.preventDefault();
    if (!newChallFriendId) {
      toast.error('Please select a buddy');
      return;
    }
    const wager = parseInt(newChallWager);
    if (isNaN(wager) || wager <= 0) {
      toast.error('Enter a valid wager amount');
      return;
    }
    const friend = friendsList.find(f => f._id === newChallFriendId);
    const friendName = friend ? friend.name : 'your friend';

    try {
      const res = await api.post('/profile-features/challenges', {
        title: newChallTitle,
        wager,
        friendName
      });
      if (res.data?.success) {
        toast.success(`Proposed "${newChallTitle}" to ${friendName}! ⚔️`);
        updateUser({ ...user, virtualCoins: res.data.coinsBalance });
        // Refresh challenges
        const challengesRes = await api.get('/profile-features/challenges');
        if (challengesRes.data?.success) setMoneyChallenges(challengesRes.data.challenges);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to propose challenge');
    }
  };

  const acceptChallenge = async (challId) => {
    try {
      const res = await api.post(`/profile-features/challenges/${challId}/accept`);
      if (res.data?.success) {
        toast.success('Challenge accepted! Let the race begin! 🏁');
        // Refresh challenges
        const challengesRes = await api.get('/profile-features/challenges');
        if (challengesRes.data?.success) setMoneyChallenges(challengesRes.data.challenges);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept challenge');
    }
  };

  const claimChallengeReward = async (challId) => {
    try {
      const res = await api.post(`/profile-features/challenges/${challId}/claim`);
      if (res.data?.success) {
        toast.success(`Claimed 🪙${res.data.challenge.reward} virtual coins! Outstanding performance! 🏆`);
        updateUser({ ...user, virtualCoins: res.data.coinsBalance });
        // Refresh challenges
        const challengesRes = await api.get('/profile-features/challenges');
        if (challengesRes.data?.success) setMoneyChallenges(challengesRes.data.challenges);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward');
    }
  };

  // Investment Copy Trading Dashboard functions
  const startCopyTrading = (e) => {
    e.preventDefault();
    if (copyTradingActive) {
      toast.error('Copy trading is already active!');
      return;
    }
    const amt = parseFloat(copyAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid allocation amount');
      return;
    }
    if (user?.virtualWallet < amt) {
      toast.error('Insufficient virtual wallet balance!');
      return;
    }
    
    const buddyName = selectedFriendNode ? selectedFriendNode.name : 'your friend';
    updateUser({ ...user, virtualWallet: user.virtualWallet - amt });
    setCopyTradingActive(true);
    
    const newEntry = {
      id: `copy-${Date.now()}`,
      buddy: buddyName,
      amount: amt,
      allocation: 'Custom index (60%), Gold (20%), Liquid Cash (20%)',
      date: new Date().toISOString().split('T')[0]
    };
    setCopyTradeHistory(prev => {
      const updated = [newEntry, ...prev];
      persistState('copyTradeHistory', updated);
      return updated;
    });
    toast.success(`Copy trading active! Allocated ₹${amt.toLocaleString('en-IN')} matching ${buddyName}'s portfolio! 📈`);
  };

  const stopCopyTrading = () => {
    if (!copyTradingActive) return;
    const activeTrade = copyTradeHistory[0];
    const refunded = activeTrade ? activeTrade.amount : copyAmount;
    updateUser({ ...user, virtualWallet: user.virtualWallet + refunded });
    setCopyTradingActive(false);
    toast.success(`Copy trading stopped! Returned ₹${refunded.toLocaleString('en-IN')} to virtual wallet. 🤝`);
  };

  // QR Split Scanner functions
  const startQRScan = async () => {
    setShowQRScanner(true);
    setQrScanningStep('scanning');
    let activeStream = null;
    try {
      setTimeout(async () => {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setCameraStream(activeStream);
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play();
          }
        } catch (err) {
          console.warn('Camera stream failed:', err.message);
        }
      }, 100);
    } catch (e) {
      console.warn('Camera setup warning:', e.message);
    }
    setTimeout(() => {
      setQrScanningStep('scanned');
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
      toast.success('Bill receipt scanned & parsed successfully! 🧾');
    }, 3000);
  };

  const assignItemToFriend = (itemId, friendName) => {
    setScannedBillItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedTo.includes(friendName);
        const newAssigned = isAssigned
          ? item.assignedTo.filter(name => name !== friendName)
          : [...item.assignedTo, friendName];
        return {
          ...item,
          assignedTo: newAssigned.length === 0 ? ['You'] : newAssigned
        };
      }
      return item;
    }));
  };

  const settleQRBill = () => {
    const friendTotals = { You: 0 };
    friendsList.forEach(f => {
      friendTotals[f.name] = 0;
    });

    scannedBillItems.forEach(item => {
      const splitCount = item.assignedTo.length;
      if (splitCount === 0) return;
      const pricePerPerson = item.price / splitCount;
      item.assignedTo.forEach(person => {
        if (friendTotals[person] !== undefined) {
          friendTotals[person] += pricePerPerson;
        } else {
          friendTotals[person] = pricePerPerson;
        }
      });
    });

    const taxMultiplier = 1 + (splitTaxRate / 100);
    const splitDebts = [];
    
    Object.keys(friendTotals).forEach(person => {
      friendTotals[person] = Math.round(friendTotals[person] * taxMultiplier);
      if (person !== 'You' && friendTotals[person] > 0) {
        splitDebts.push({
          id: `debt-qr-${Date.now()}-${person}`,
          friendName: person,
          type: 'lent',
          amount: friendTotals[person],
          reason: 'QR Restaurant Split',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (splitDebts.length > 0) {
      setDebts(prev => {
        const updated = [...splitDebts, ...prev];
        persistState('debts', updated);
        return updated;
      });
    }

    setShowQRScanner(false);
    setQrScanningStep('idle');
    toast.success(`Bill split completed! Added ${splitDebts.length} new lent records to your ledger. 🤝`);
  };

  const loadBadges = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/badges');
      setBadges(data.badges || []);
    } catch (e) { }
    setLoading(false);
  };

  const loadPersonality = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/personality');
      setPersonality(data.result);
    } catch (e) { }
    setLoading(false);
  };

  const loadReferral = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/referral');
      setReferral(data);
    } catch (e) { }
    setLoading(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('college', form.college || '');
      formData.append('yearOfStudy', form.yearOfStudy || '');
      formData.append('bio', form.bio || '');
      formData.append('upiId', form.upiId || '');
      formData.append('isPublicProfile', form.isPublicProfile ?? false);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.user);
      toast.success('Profile updated! ✅');
      setAvatarFile(null);
    } catch (e) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const send2FAOTP = async () => {
    setSending2FA(true);
    try {
      await api.post('/auth/send-otp');
      setShow2FA(true);
      toast.success('OTP sent to your email!');
    } catch (e) { toast.error('Failed to send OTP'); }
    setSending2FA(false);
  };

  const toggle2FA = async () => {
    try {
      const { data } = await api.put('/auth/toggle-2fa', { otp: otp2FA });
      updateUser({ twoFactorEnabled: data.twoFactorEnabled });
      setShow2FA(false);
      setOtp2FA('');
      toast.success(data.message);
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid OTP'); }
  };

  const copyReferralLink = () => {
    if (referral?.shareLink) {
      navigator.clipboard.writeText(referral.shareLink);
      toast.success('Referral link copied! 🎁');
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    const loadToast = toast.loading('Initializing payment gateway...');
    try {
      // 1. Get Key
      const keyRes = await api.get('/payments/key');
      const { key, isMock } = keyRes.data;

      // 2. Create Order
      const orderRes = await api.post('/payments/order', { amount: 299 });
      const { order } = orderRes.data;

      toast.dismiss(loadToast);

      if (isMock) {
        // Show simulated billing checkout dialog
        toast.success('🔑 Sandbox mode: Launching simulated payment verification...');
        setTimeout(async () => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: order.id,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: 'mock_signature_approved',
              isMockPayment: true
            });
            if (verifyRes.data.success) {
              updateUser(verifyRes.data.user || { isPremium: true });
              toast.success('💎 Welcome to FinBuddy Elite! Upgraded successfully!');
              setShowConfetti(true);
              setActiveTab('billing');
            }
          } catch (verifyErr) {
            toast.error('Simulation failed');
          }
        }, 1500);
        setLoading(false);
        return;
      }

      // Real Razorpay Integration
      // Load script
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway script');
        setLoading(false);
        return;
      }

      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: 'FinBuddy Elite',
        description: 'FinBuddy Premium Tier Upgrade',
        order_id: order.id,
        handler: async (response) => {
          const verifyToast = toast.loading('Confirming transaction with bank...');
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (verifyRes.data.success) {
              updateUser(verifyRes.data.user || { isPremium: true });
              toast.success('🎉 Welcome to FinBuddy Elite! Subscription Active!', { id: verifyToast });
              setShowConfetti(true);
              setActiveTab('billing');
            }
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.', { id: verifyToast });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#7C3AED'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      toast.dismiss(loadToast);
      toast.error(err.response?.data?.message || 'Payment initialization failed');
    }
    setLoading(false);
  };

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">👤 Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account, badges, and settings</p>
        </div>


        {/* Premium Profile Hero Card */}
        <div className="card border-violet-500/20 mb-6 relative overflow-hidden">
          {/* Background glow orbs */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-pink-500/8 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-5 relative">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-lg shadow-violet-500/25">
                {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user?.name?.[0]}
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base shadow-md animate-float">
                {getLevel(user?.finScore || 500).emoji}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-black text-white">{user?.name}</h2>
                  <p className="text-slate-400 text-sm">{user?.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black gradient-text">₹{(user?.virtualWallet ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500">Virtual Wallet</p>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/25 px-2 py-1 rounded-full font-bold">
                  {getLevel(user?.finScore || 500).level} · FinScore {user?.finScore || 500}
                </span>
                {user?.isPremium && (
                  <span className="text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-1 rounded-full font-black animate-pulse shadow-sm shadow-pink-500/20">
                    💎 Elite Pro
                  </span>
                )}
                <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">🪙 {user?.virtualCoins || 0} coins</span>
                <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full animate-streak-fire">🔥 {user?.currentStreak || 0} day streak</span>
                {user?.twoFactorEnabled && <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">🔐 2FA On</span>}
                <span className="text-xs bg-cyan-500/8 text-cyan-400 border border-cyan-500/15 px-2 py-1 rounded-full">
                  Top {100 - getPercentile(user?.finScore || 500)}% of peers
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">XP Progress to next level</span>
                  <span style={{ color: getLevel(user?.finScore || 500).color }} className="font-black">
                    {user?.finScore || 500} / {getLevel(user?.finScore || 500).xpNext} XP
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full animate-xp-shimmer"
                    style={{ width: `${Math.min(100, Math.round(((user?.finScore || 500) / getLevel(user?.finScore || 500).xpNext) * 100))}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-600 mt-1">
                  {getLevel(user?.finScore || 500).xpNext - (user?.finScore || 500)} XP to reach {getLevel(user?.finScore || 500).level === 'Advanced' ? 'Expert' : getLevel(user?.finScore || 500).level === 'Intermediate' ? 'Advanced' : getLevel(user?.finScore || 500).level === 'Beginner' ? 'Intermediate' : 'Legend'} level
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5">
          {['profile', 'friends', 'badges', 'personality', 'referral', 'security', 'downloads', 'billing'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 capitalize font-medium text-sm whitespace-nowrap border-b-2 transition ${
                activeTab === t ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Profile Edit */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Upload Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files[0])}
                  className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer"
                />
                {avatarFile && <span className="text-xs text-cyan-400 ml-2">Selected: {avatarFile.name}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Full Name</label>
                  <input className="input-dark" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">College</label>
                  <input className="input-dark" placeholder="VIT, Anna Univ..." value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Year of Study</label>
                  <select className="input-dark" value={form.yearOfStudy} onChange={e => setForm({ ...form, yearOfStudy: e.target.value })}>
                    <option value="">Select year</option>
                    {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y === 5 ? 'PG' : `${y}${['st','nd','rd','th','th'][y-1]} Year`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">UPI ID for Settlements (Real P2P)</label>
                  <input className="input-dark" placeholder="friend@upi" value={form.upiId || ''} onChange={e => setForm({ ...form, upiId: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Bio</label>
                <textarea className="input-dark resize-none h-20" placeholder="Tell others about yourself..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={200} />
                <p className="text-xs text-slate-500 mt-1">{form.bio.length}/200</p>
              </div>

              <div className="card bg-[var(--bg-primary)] space-y-3">
                <h3 className="font-bold">Notifications</h3>
                {[
                  { key: 'email', label: '📧 Email notifications' },
                  { key: 'push', label: '🔔 Push notifications' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between">
                    <span className="text-sm">{n.label}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, notifications: { ...f.notifications, [n.key]: !f.notifications[n.key] } }))}
                      className={`w-12 h-6 rounded-full transition-colors ${form.notifications[n.key] ? 'bg-cyan-400' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.notifications[n.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <span className="text-sm">🌐 Public Profile</span>
                    <p className="text-xs text-slate-500">Show on leaderboard</p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isPublicProfile: !f.isPublicProfile }))}
                    className={`w-12 h-6 rounded-full transition-colors ${form.isPublicProfile ? 'bg-cyan-400' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${form.isPublicProfile ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes ✅'}
              </button>
            </form>
          </div>
        )}

        {/* Friends & Social Circle Hub */}
        {activeTab === 'friends' && (
          <div className="space-y-6 animate-fade-in">
            {/* Social Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center p-4">
                <p className="text-xs text-slate-400">Total Buddies</p>
                <p className="text-2xl font-black text-cyan-400">{friendsList.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Connected Network</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-xs text-slate-400">Active Duels</p>
                <p className="text-2xl font-black text-orange-400">
                  {stockDuels.filter(d => d.status === 'active').length}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Trading Arena</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-xs text-slate-400">Shared Piggy Banks</p>
                <p className="text-2xl font-black text-purple-400">{coopVaults.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Savings Races</p>
              </div>
              <div className="card text-center p-4">
                <p className="text-xs text-slate-400">Global Social Rank</p>
                <p className="text-2xl font-black text-yellow-400">
                  {peerBenchmark?.rank ? `#${peerBenchmark.rank}` : peerBenchmark?.finScorePercentile ? `Top ${Math.round(100 - peerBenchmark.finScorePercentile)}%` : '--'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Top of Circle 👑</p>
              </div>
            </div>

            {/* Main Interactive Row */}
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Left Column: Constellation, Savings Race, Duels */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* SVG Constellation Social Map */}
                <div className="card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-extrabold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>FinConstellation Map</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Interactive visual social network. Solid green lines indicate active streak connections!</p>
                    </div>
                    {friendsList.length > 0 && (
                      <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-full font-bold text-cyan-400">
                        {friendsList.length} Connected Stars
                      </span>
                    )}
                  </div>

                  {friendsList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      No friends connected to display in your Constellation. Search for buddies below to expand your network!
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-6 bg-black/20 rounded-2xl border border-white/5 relative">
                      <svg width="100%" height="260" viewBox="0 0 400 260" className="max-w-md mx-auto">
                        <defs>
                          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="glow-purple" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                          </radialGradient>
                        </defs>
                        
                        {/* Render Connecting Dotted Lines */}
                        {friendsList.map((friend, idx) => {
                          const angle = (idx * 2 * Math.PI) / friendsList.length;
                          const r = 90;
                          const fx = 200 + r * Math.cos(angle);
                          const fy = 130 + r * Math.sin(angle);
                          const hasStreak = friend.currentStreak > 0;
                          
                          return (
                            <g key={friend._id}>
                              <line
                                x1="200"
                                y1="130"
                                x2={fx}
                                y2={fy}
                                stroke={hasStreak ? '#10B981' : '#a855f7'}
                                strokeWidth={hasStreak ? '2.5' : '1.5'}
                                strokeDasharray={hasStreak ? '0' : '4 4'}
                                className={hasStreak ? 'animate-pulse' : ''}
                                opacity="0.6"
                              />
                              {/* Glowing streak pulse animation particle */}
                              {hasStreak && (
                                <circle r="3" fill="#34D399">
                                  <animateMotion
                                    dur={`${2 + Math.random() * 1.5}s`}
                                    repeatCount="indefinite"
                                    path={`M 200,130 L ${fx},${fy}`}
                                  />
                                </circle>
                              )}
                            </g>
                          );
                        })}

                        {/* Central User Node */}
                        <circle cx="200" cy="130" r="30" fill="url(#glow-purple)" />
                        <circle cx="200" cy="130" r="20" className="fill-violet-600 stroke-violet-400 stroke-2 animate-pulse" />
                        <text x="200" y="134" textAnchor="middle" fill="white" className="text-[10px] font-black pointer-events-none uppercase">YOU</text>

                        {/* Friend Nodes */}
                        {friendsList.map((friend, idx) => {
                          const angle = (idx * 2 * Math.PI) / friendsList.length;
                          const r = 90;
                          const fx = 200 + r * Math.cos(angle);
                          const fy = 130 + r * Math.sin(angle);
                          const isSelected = selectedFriendNode?._id === friend._id;
                          
                          return (
                            <g
                              key={friend._id}
                              className="cursor-pointer group animate-fade-in"
                              onClick={() => setSelectedFriendNode(friend)}
                            >
                              <circle cx={fx} cy={fy} r="22" fill="url(#glow)" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                              <circle
                                cx={fx}
                                cy={fy}
                                r="16"
                                className={`transition-all duration-300 ${
                                  isSelected 
                                    ? 'fill-cyan-400 stroke-white stroke-2 scale-110' 
                                    : 'fill-slate-800 stroke-cyan-500/50 stroke hover:stroke-cyan-300'
                                }`}
                              />
                              {/* Initials */}
                              <text
                                x={fx}
                                y={fy + 4}
                                textAnchor="middle"
                                fill={isSelected ? 'black' : 'white'}
                                className="text-[9px] font-extrabold pointer-events-none"
                              >
                                {friend.name ? friend.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase() : 'B'}
                              </text>
                              
                              {/* Score hover tooltips */}
                              <text
                                x={fx}
                                y={fy - 20}
                                textAnchor="middle"
                                fill="#22D3EE"
                                className="text-[8px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                              >
                                {friend.finScore} pts
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Interactive constellation background float notification */}
                      <div className="absolute bottom-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">
                        Click on nodes to view profile dashboard & trigger roasts
                      </div>
                    </div>
                  )}
                </div>

                {/* Cooperative Savings Race */}
                <div className="card relative overflow-hidden">
                  <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="font-extrabold text-white flex items-center gap-1.5 mb-4">
                    <span>🌴 Cooperative Piggy Bank Goal Race</span>
                    <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase font-extrabold ml-auto animate-pulse">Social Goals</span>
                  </h3>

                  <div className="space-y-6">
                    {coopVaults.map(vault => {
                      const totalNeeded = vault.target;
                      const totalSaved = vault.saved;
                      const pct = Math.min(100, Math.round((totalSaved / totalNeeded) * 100));
                      
                      // Calculate positions for racing competitors
                      const youPct = Math.min(100, Math.round((vault.youContributed / totalNeeded) * 100));
                      
                      return (
                        <div key={vault.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl relative">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-200">{vault.name}</h4>
                              <p className="text-xs text-slate-500">Goal Target: ₹{totalNeeded.toLocaleString('en-IN')} • Saved: ₹{totalSaved.toLocaleString('en-IN')}</p>
                            </div>
                            <span className="text-xs font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
                              {pct}% Funded
                            </span>
                          </div>

                          {/* Interactive Goal Race Tracks */}
                          <div className="space-y-4 my-4 p-3 bg-slate-950/40 border border-white/5 rounded-xl relative overflow-hidden">
                            {/* Finish Line */}
                            <div className="absolute right-4 top-0 bottom-0 w-0.5 border-r border-dashed border-cyan-400/25 flex flex-col justify-between items-center py-1 select-none pointer-events-none">
                              <span className="text-[8px] text-cyan-400 font-black tracking-widest rotate-90 opacity-70">GOAL</span>
                              <span className="text-xs">🏁</span>
                            </div>

                            {/* Track 1: You */}
                            <div className="relative h-8 flex items-center">
                              <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-wider w-16 truncate shrink-0">YOU</span>
                              <div className="flex-1 bg-white/5 h-2 rounded-full relative mx-2">
                                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-1000 shadow-md shadow-cyan-400/20" style={{ width: `${youPct}%` }} />
                                {/* Car Emoji floating indicator */}
                                <div 
                                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center select-none"
                                  style={{ left: `${youPct}%` }}
                                >
                                  <span className="text-sm filter drop-shadow-[0_2px_4px_rgba(34,211,238,0.5)]">🚗</span>
                                  <span className="text-[8px] text-white font-black bg-cyan-900 border border-cyan-500/30 px-1 rounded absolute -top-4 whitespace-nowrap">₹{vault.youContributed}</span>
                                </div>
                              </div>
                            </div>

                            {/* Track 2: Friends */}
                            {vault.friends.map((friend, fIdx) => {
                              const friendPct = Math.min(100, Math.round((friend.contributed / totalNeeded) * 100));
                              const emoji = fIdx === 0 ? '🏍️' : '🚲';
                              
                              return (
                                <div key={friend.name} className="relative h-8 flex items-center">
                                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider w-16 truncate shrink-0">{friend.name}</span>
                                  <div className="flex-1 bg-white/5 h-2 rounded-full relative mx-2">
                                    <div className="h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full transition-all duration-1000" style={{ width: `${friendPct}%` }} />
                                    {/* Friend Emoji floating indicator */}
                                    <div 
                                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center select-none"
                                      style={{ left: `${friendPct}%` }}
                                    >
                                      <span className="text-sm">{emoji}</span>
                                      <span className="text-[8px] text-slate-300 font-bold bg-slate-900 border border-white/5 px-1 rounded absolute -top-4 whitespace-nowrap">₹{friend.contributed}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Contribute Virtual Cash form */}
                          <div className="flex gap-2.5 max-w-sm mt-3">
                            <input
                              type="number"
                              className="input-dark text-xs py-1.5"
                              value={vaultContributionAmount}
                              onChange={e => setVaultContributionAmount(e.target.value)}
                              placeholder="₹ Amount to contribute"
                              style={{ width: 'auto', flex: 1 }}
                            />
                            <button
                              onClick={() => contributeToVault(vault.id)}
                              className="py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition shrink-0"
                            >
                              💸 Contribute
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 24-Hour Stock Duel Arena */}
                <div className="card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="font-extrabold text-white flex items-center gap-1.5 mb-4">
                    <span>⚔️ 24-Hour Stock Price Duel Arena</span>
                    <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase font-extrabold ml-auto">Paper Trading Duel</span>
                  </h3>

                  {/* Create Duel Form */}
                  <form onSubmit={challengeStockDuel} className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-4 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Challenge a buddy</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Select Buddy</label>
                        {friendsList.length === 0 ? (
                          <span className="text-xs text-slate-500 italic block">No buddies yet</span>
                        ) : (
                          <select
                            className="input-dark text-xs py-1.5 mr-0"
                            value={duelSelectedFriendId}
                            onChange={e => setDuelSelectedFriendId(e.target.value)}
                          >
                            <option value="">Select friend</option>
                            {friendsList.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Stock Ticker</label>
                        <select
                          className="input-dark text-xs py-1.5"
                          value={duelTicker}
                          onChange={e => setDuelTicker(e.target.value)}
                        >
                          <option value="RELIANCE">RELIANCE</option>
                          <option value="TCS">TCS</option>
                          <option value="INFY">INFY</option>
                          <option value="HDFCBANK">HDFCBANK</option>
                          <option value="TATAMOTORS">TATAMOTORS</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Stock Direction</label>
                        <select
                          className="input-dark text-xs py-1.5"
                          value={duelDirection}
                          onChange={e => setDuelDirection(e.target.value)}
                        >
                          <option value="UP">UP 📈</option>
                          <option value="DOWN">DOWN 📉</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Bet Coins</label>
                        <input
                          type="number"
                          className="input-dark text-xs py-1.5"
                          value={duelBetCoins}
                          onChange={e => setDuelBetCoins(e.target.value)}
                          placeholder="Coins"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-orange-500/10"
                    >
                      ⚔️ Launch Stock Duel!
                    </button>
                  </form>

                  {/* Active Duels List */}
                  <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Active Stock Duels</span>
                      {stockDuels.filter(d => d.status === 'active').length > 0 && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      )}
                    </h4>
                    {stockDuels.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active duels. Challenge a buddy above!</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stockDuels.map(duel => (
                          <div key={duel.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                            <div>
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{duel.ticker}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${duel.direction === 'UP' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {duel.direction}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">vs {duel.friendName} ({duel.friendDirection})</p>
                              <p className="text-[10px] text-slate-400">Time: {duel.durationLeft} · Price: <span className={duel.percentageChange.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{duel.percentageChange}</span></p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-extrabold text-yellow-400">🪙 {duel.betCoins}</p>
                              <button
                                onClick={() => resolveStockDuel(duel.id)}
                                className="mt-2 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black rounded-lg transition"
                              >
                                Resolve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lend & Borrow Ledger Tracker */}
                <div className="card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="font-extrabold text-white flex items-center gap-1.5 mb-4">
                    <span>💵 Peer Lend & Borrow Ledger Tracker</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-extrabold ml-auto">Personal Debts</span>
                  </h3>

                  {/* Add Debt Form */}
                  <form onSubmit={addDebt} className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-4 space-y-4">
                    <div className="flex justify-between items-center w-full mb-1">
                      <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Record a transaction</h4>
                      <button
                        type="button"
                        onClick={startQRScan}
                        className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-black text-[9px] font-black rounded-lg transition"
                      >
                        📸 Camera QR Splitter
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Select Buddy</label>
                        {friendsList.length === 0 ? (
                          <span className="text-xs text-slate-500 italic block">No buddies yet</span>
                        ) : (
                          <select
                            className="input-dark text-xs py-1.5 mr-0"
                            value={newDebtFriendId}
                            onChange={e => setNewDebtFriendId(e.target.value)}
                          >
                            <option value="">Select friend</option>
                            {friendsList.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Type</label>
                        <select
                          className="input-dark text-xs py-1.5"
                          value={newDebtType}
                          onChange={e => setNewDebtType(e.target.value)}
                        >
                          <option value="lent">Lent 📈</option>
                          <option value="borrowed">Borrowed 📉</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">₹ Amount</label>
                        <input
                          type="number"
                          className="input-dark text-xs py-1.5"
                          value={newDebtAmount}
                          onChange={e => setNewDebtAmount(e.target.value)}
                          placeholder="Amount"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Reason / Item</label>
                        <input
                          type="text"
                          className="input-dark text-xs py-1.5"
                          value={newDebtReason}
                          onChange={e => setNewDebtReason(e.target.value)}
                          placeholder="Coffee, dinner, etc."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-500/10"
                    >
                      💾 Record Transaction
                    </button>
                  </form>

                  {/* Active Debts List */}
                  <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Active Transactions Ledger</h4>
                    {debts.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active lend/borrow ledger entries found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {debts.map(debt => (
                          <div key={debt._id || debt.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{debt.friendName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${debt.type === "lent" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                  {debt.type === "lent" ? "Lent" : "Borrowed"}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">Item: {debt.reason || "Personal loan"}</p>
                              <p className="text-[10px] text-slate-500">Date: {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString("en-IN") : "Today"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-extrabold text-white mb-2">₹{debt.amount}</p>
                              <button
                                onClick={() => settleDebt(debt._id || debt.id)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-black text-[9px] font-black rounded-lg transition"
                              >
                                Settle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Peer Money Challenges Desk */}
                <div className="card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="font-extrabold text-white flex items-center gap-1.5 mb-4">
                    <span>🏆 Peer Money Challenges Arena</span>
                    <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase font-extrabold ml-auto">Streak Bets</span>
                  </h3>

                  {/* Create Challenge Form */}
                  <form onSubmit={proposeChallenge} className="p-4 bg-white/5 border border-white/5 rounded-2xl mb-4 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Challenge a buddy</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Select Buddy</label>
                        {friendsList.length === 0 ? (
                          <span className="text-xs text-slate-500 italic block">No buddies yet</span>
                        ) : (
                          <select
                            className="input-dark text-xs py-1.5 mr-0"
                            value={newChallFriendId}
                            onChange={e => setNewChallFriendId(e.target.value)}
                          >
                            <option value="">Select friend</option>
                            {friendsList.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Challenge Task</label>
                        <select
                          className="input-dark text-xs py-1.5"
                          value={newChallTitle}
                          onChange={e => setNewChallTitle(e.target.value)}
                        >
                          <option value="No-Spend Weekend 🚫">No-Spend Weekend 🚫</option>
                          <option value="5-Day Streak Tracker 🔥">5-Day Streak Tracker 🔥</option>
                          <option value="Invest ₹500 in Nifty SIP 📈">Invest ₹500 in Nifty SIP 📈</option>
                          <option value="No junk food order 🍔">No junk food order 🍔</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Wager Coins</label>
                        <input
                          type="number"
                          className="input-dark text-xs py-1.5"
                          value={newChallWager}
                          onChange={e => setNewChallWager(e.target.value)}
                          placeholder="Coins"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-violet-500/10"
                    >
                      🚀 Propose Challenge
                    </button>
                  </form>

                  {/* Active Challenges List */}
                  <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">Ongoing Money Challenges</h4>
                    {moneyChallenges.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No ongoing proposed or accepted money challenges.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {moneyChallenges.map(chall => {
                          const isSentByMe = chall.proposer === user._id || chall.proposer?._id === user._id || chall.proposerName === user.name;
                          return (
                            <div key={chall._id || chall.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-white">{chall.title}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {isSentByMe ? `Proposed to: ${chall.challengerName || chall.friendName}` : `Proposed by: ${chall.proposerName || "Buddy"}`}
                                </p>
                                <p className="text-[10px] text-slate-500">Status: <span className="capitalize text-cyan-400">{chall.status}</span></p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-extrabold text-yellow-400 mb-2">🪙 {chall.wager}</p>
                                {chall.status === "pending" && !isSentByMe && (
                                  <button
                                    onClick={() => acceptChallenge(chall._id || chall.id)}
                                    className="px-2.5 py-1 bg-violet-500 hover:bg-violet-600 text-white text-[9px] font-black rounded-lg transition"
                                  >
                                    Accept Challenge
                                  </button>
                                )}
                                {chall.status === "active" && (
                                  <button
                                    onClick={() => claimChallengeReward(chall._id || chall.id)}
                                    className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-black text-[9px] font-black rounded-lg transition"
                                  >
                                    Claim Reward
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column: Buddy stats popup, AI Roast, Mirror Allocation, Search & Add, Requests */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Selected Buddy Profile details popup */}
                <div className="card border-cyan-500/25 relative overflow-hidden bg-gradient-to-b from-slate-900 to-[var(--bg-secondary)] shadow-lg shadow-cyan-500/5">
                  <h3 className="font-extrabold text-white text-sm mb-4 border-b border-white/5 pb-2">🎯 Selected Buddy Desk</h3>

                  {selectedFriendNode ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center font-bold text-white text-lg overflow-hidden shadow-md">
                          {selectedFriendNode.avatar ? <img src={selectedFriendNode.avatar} alt="" className="w-full h-full object-cover" /> : selectedFriendNode.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-base">{selectedFriendNode.name}</h4>
                          <p className="text-xs text-slate-400">{selectedFriendNode.college || 'VIT Vellore'}</p>
                        </div>
                      </div>

                      {/* Score metrics */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                        <div>
                          <p className="text-[10px] text-slate-400">FinScore</p>
                          <p className="font-black text-cyan-400 text-lg">{selectedFriendNode.finScore || 500}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Streak</p>
                          <p className="font-black text-orange-400 text-lg">🔥 {selectedFriendNode.currentStreak || 0}d</p>
                        </div>
                      </div>

                      {/* AI Peer Sparring & Roast Box */}
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span>AI Social Sparring Roast</span>
                        </h4>
                        
                        {friendRoastText && (
                          <div className="p-3 bg-violet-950/20 border border-violet-500/20 rounded-xl mb-3 text-xs leading-relaxed text-slate-200 relative animate-scale-up">
                            <span className="text-[10px] text-violet-400 font-extrabold uppercase block mb-1">🔥 AI Roast Master</span>
                            {friendRoastText}
                          </div>
                        )}

                        <button
                          onClick={() => triggerPeerRoast(selectedFriendNode._id)}
                          className="w-full py-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10"
                          disabled={roastingFriend}
                        >
                          {roastingFriend ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Roasting in progress...</span>
                            </>
                          ) : (
                            <>🔥 Roast {selectedFriendNode.name}!</>
                          )}
                        </button>
                      </div>

                      {/* Social Sandbox Mirror Desk */}
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-3">📊 Portfolio Comparison (You vs {selectedFriendNode.name})</h4>
                        
                        <div className="space-y-3 my-2">
                          {selectedFriendNode?.portfolioSummary ? (
                            Object.entries(selectedFriendNode.portfolioSummary).map(([asset, pct]) => (
                              <div key={asset}>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                  <span className="capitalize">{asset}</span>
                                  <span className="text-slate-300"><strong className="text-purple-400">{pct}%</strong></span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 italic text-center py-3">
                              No portfolio allocation data available for this buddy.
                            </p>
                          )}
                        </div>

                        <button
                          onClick={mirrorFriendPortfolio}
                          className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 mt-3 shadow-lg shadow-cyan-500/10"
                          disabled={mirroring}
                        >
                          {mirroring ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Mirroring allocation...</span>
                            </>
                          ) : (
                            <>📈 Mirror {selectedFriendNode.name}'s Allocation</>
                          )}
                        </button>
                      </div>

                      {/* AI Split Nudge generator */}
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">💸 Friendly Split Settlement Nudge</h4>
                        
                        {nudgeText && (
                          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl mb-2 text-xs text-slate-300 leading-relaxed relative animate-fade-in">
                            {nudgeText}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(nudgeText);
                                toast.success('Nudge script copied! 📋');
                              }}
                              className="absolute top-1 right-1 p-1 bg-white/5 hover:bg-white/10 rounded-lg transition"
                              title="Copy to Clipboard"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2 mb-3">
                          {['humorous', 'passive-aggressive', 'formal'].map(tone => (
                            <button
                              key={tone}
                              onClick={() => setNudgeTone(tone)}
                              className={`flex-1 py-1 rounded-lg text-[10px] capitalize font-extrabold transition border ${
                                nudgeTone === tone
                                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              {tone.replace('-', ' ')}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => triggerNudgeScript(selectedFriendNode.name, 450)}
                          className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs rounded-xl transition"
                          disabled={generatingNudge}
                        >
                          {generatingNudge ? 'Analyzing tone...' : '📢 Generate AI Nudge script'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      Click a friend's star in the constellation map or select them from the list to show details.
                    </div>
                  )}
                </div>

                {/* Search & Add Friend */}
                <div className="card relative overflow-hidden">
                  <h3 className="font-extrabold text-white text-sm mb-3">🔍 Find & Add Buddies</h3>
                  
                  <form onSubmit={searchSocialUsers} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        className="input-dark text-xs py-2"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search by name or email..."
                        value={socialSearchQuery}
                        onChange={e => setSocialSearchQuery(e.target.value)}
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      className="btn-primary font-bold"
                      style={{ width: 'auto', padding: '0 16px', fontSize: '12px' }}
                      disabled={searchingFriends}
                    >
                      {searchingFriends ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {socialSearchResults.length > 0 && (
                    <div className="mt-4 space-y-2.5 border-t border-white/5 pt-3">
                      {socialSearchResults.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-400/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                              {u.name?.[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{u.name}</p>
                              <p className="text-[9px] text-slate-500">{u.college || 'VIT Vellore'}</p>
                            </div>
                          </div>
                          
                          {u.requestSent ? (
                            <span className="text-[10px] text-slate-500 italic">Pending...</span>
                          ) : (
                            <button
                              onClick={() => sendSocialFriendRequest(u._id)}
                              className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition"
                              title="Send Friend Request"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Friend Requests Inbox */}
                <div className="card">
                  <h3 className="font-extrabold text-white text-sm mb-3">📬 Friend Requests</h3>
                  
                  {friendRequestsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs italic">
                      Inbox is empty. No pending requests.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friendRequestsList.map(req => (
                        <div key={req._id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <p className="text-xs font-bold text-white">{(req.from && req.from.name) || 'FinBuddy Member'}</p>
                            <p className="text-[9px] text-slate-500">{(req.from && req.from.email) || ''}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptSocialFriendRequest(req.from?._id || req.from)}
                              className="p-1 bg-green-500 hover:bg-green-600 text-black rounded-lg transition"
                              title="Accept Request"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => declineSocialFriendRequest(req.from?._id || req.from)}
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                              title="Decline Request"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        {activeTab === 'badges' && (
          <div>
            {/* Wealth Percentile comparison bar */}
            <div className="card border-violet-500/15 mb-6 bg-gradient-to-r from-violet-950/20 to-pink-950/10">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Wealth Percentile · Peer Comparison</p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">You vs. peer group</span>
                    <span className="text-violet-400 font-black">Top {100 - getPercentile(user?.finScore || 500)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${getPercentile(user?.finScore || 500)}%`,
                        background: 'linear-gradient(90deg, #7C3AED, #EC4899)' 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                    <span>0th percentile</span>
                    <span>100th percentile</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black" style={{ color: getLevel(user?.finScore || 500).color }}>
                    {getPercentile(user?.finScore || 500)}th
                  </p>
                  <p className="text-[9px] text-slate-500">percentile</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-slate-400">Earned: <span className="text-white font-bold">{badges.filter(b => b.earned).length}</span> / {badges.length}</p>
              <p className="text-slate-400">Coins: <span className="text-yellow-400 font-bold">🪙 {user?.virtualCoins || 0}</span></p>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge, i) => (
                  <div key={i} className={`card text-center transition hover:scale-105 ${
                    badge.earned ? 'border-yellow-500/30 animate-neon-pulse' : 'opacity-40'
                  }`}>
                    <div className={`text-4xl mb-3 ${badge.earned ? 'animate-float' : ''}`}>{badge.icon}</div>
                    <p className="font-bold text-sm">{badge.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
                    {badge.earned && badge.earnedAt && (
                      <p className="text-xs text-yellow-400 mt-2">
                        {new Date(badge.earnedAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                    {!badge.earned && <p className="text-xs text-slate-500 mt-2">🔒 Locked</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personality */}
        {activeTab === 'personality' && (
          <div className="max-w-2xl">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : personality ? (
              <div className="space-y-6">
                <div className="card border-cyan-500/20 text-center py-8">
                  <div className="text-7xl mb-4">{personality.emoji}</div>
                  <h2 className="text-3xl font-bold gradient-text">{personality.personality}</h2>
                  <p className="text-slate-400 mt-3 max-w-sm mx-auto">{personality.description}</p>
                </div>

                <div className="card">
                  <h3 className="font-bold mb-4">Spending Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(personality.percentages || {}).sort((a, b) => b[1] - a[1]).map(([cat, pct]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-slate-300">{cat}</span>
                          <span className="text-cyan-400">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-cyan-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={loadPersonality} className="btn-secondary w-full">Refresh Analysis</button>
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🧠</div>
                <p className="text-slate-400 mb-4">Add more expenses to unlock your spending personality!</p>
                <p className="text-xs text-slate-500">Need at least 3 expenses across groups</p>
              </div>
            )}
          </div>
        )}

        {/* Referral */}
        {activeTab === 'referral' && (
          <div className="max-w-2xl space-y-6">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : referral && (
              <>
                <div className="card border-green-500/20 text-center py-8">
                  <p className="text-slate-400 mb-2">Your Referral Code</p>
                  <p className="text-4xl font-bold tracking-widest text-cyan-400">{referral.referralCode}</p>
                  <p className="text-slate-400 text-sm mt-3">Each friend you refer gets +₹10,000 virtual money</p>
                  <p className="text-green-400 font-bold mt-1">You also get +₹10,000! 🎁</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-cyan-400">{referral.referralCount}</p>
                    <p className="text-xs text-slate-400">Friends Referred</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-green-400">₹{(referral.bonusEarned || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-400">Bonus Earned</p>
                  </div>
                  <div className="card text-center">
                    <p className="text-2xl font-bold text-yellow-400">{referral.referredUsers?.length || 0}</p>
                    <p className="text-xs text-slate-400">Active Users</p>
                  </div>
                </div>

                <button onClick={copyReferralLink} className="btn-primary">
                  📋 Copy Referral Link
                </button>

                {referral.referredUsers?.length > 0 && (
                  <div className="card">
                    <h3 className="font-bold mb-3">Friends You Referred</h3>
                    <div className="space-y-2">
                      {referral.referredUsers.map((u, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-sm font-bold">
                            {u.name?.[0]}
                          </div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="ml-auto text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">🔐 Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {user?.twoFactorEnabled ? 'Enabled — OTP sent on every login' : 'Disabled — Enable for extra security'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user?.twoFactorEnabled ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-400'}`}>
                  {user?.twoFactorEnabled ? 'ON' : 'OFF'}
                </span>
              </div>

              {!show2FA ? (
                <button onClick={send2FAOTP} disabled={sending2FA} className="btn-secondary mt-4" style={{ width: 'auto', padding: '10px 20px' }}>
                  {sending2FA ? 'Sending...' : user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-400">Enter the OTP sent to your email:</p>
                  <input className="input-dark text-center text-2xl tracking-widest" maxLength={6} placeholder="000000" value={otp2FA} onChange={e => setOtp2FA(e.target.value.replace(/\D/g, ''))} />
                  <div className="flex gap-3">
                    <button onClick={() => setShow2FA(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={toggle2FA} disabled={otp2FA.length !== 6} className="btn-primary flex-1">Confirm</button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold mb-2">📧 Email Verified</h3>
              <div className="flex items-center gap-2">
                <span className={user?.isEmailVerified ? 'text-green-400' : 'text-red-400'}>
                  {user?.isEmailVerified ? '✅ Verified' : '❌ Not verified'}
                </span>
                <span className="text-slate-400 text-sm">({user?.email})</span>
              </div>
            </div>

            <div className="card border-red-500/10">
              <h3 className="font-bold text-red-400 mb-2">⚠️ Danger Zone</h3>
              <button onClick={() => { logout(); navigate('/'); }} className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition font-medium">
                Logout from FinBuddy
              </button>
            </div>
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="max-w-2xl space-y-4">
            <p className="text-slate-400 text-sm mb-2">Download your financial reports and certificates as PDF</p>

            {/* Monthly Expense Report */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">📊 Monthly Expense Report</h3>
                  <p className="text-sm text-slate-400 mt-1">All your group expenses for the selected month</p>
                </div>
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex gap-3 mt-4">
                <select
                  className="input-dark flex-1"
                  id="reportMonth"
                  defaultValue={new Date().getMonth() + 1}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString('en-IN', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    const month = document.getElementById('reportMonth').value;
                    const year = new Date().getFullYear();
                    try {
                      const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/pdf/expense-report?month=${month}&year=${year}`,
                        { headers: { Authorization: `Bearer ${localStorage.getItem('finbuddy_token')}` } }
                      );
                      if (!response.ok) throw new Error('Failed');
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `finbuddy-report-${month}-${year}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Report downloaded! 📄');
                    } catch (e) { toast.error('Download failed — check server'); }
                  }}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 20px' }}
                >
                  Download PDF
                </button>
              </div>
            </div>

            {/* Trading Certificate */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">🏆 Trading Certificate</h3>
                  <p className="text-sm text-slate-400 mt-1">Certificate showing your virtual trading performance</p>
                </div>
                <span className="text-2xl">🎓</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/pdf/trade-certificate`,
                      { headers: { Authorization: `Bearer ${localStorage.getItem('finbuddy_token')}` } }
                    );
                    if (!response.ok) throw new Error('Failed');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `finbuddy-certificate-${user?.name}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Certificate downloaded! 🏆');
                  } catch (e) { toast.error('Download failed — check server'); }
                }}
                className="btn-primary mt-4"
              >
                Download Certificate
              </button>
            </div>

            {/* Annual Wealth Review */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">📊 Annual Wealth Review</h3>
                  <p className="text-sm text-slate-400 mt-1">Comprehensive review of your net worth, assets, and liabilities</p>
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <button
                onClick={async () => {
                  const loadingToast = toast.loading('Compiling annual wealth metrics... 📊');
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_API_URL}/pdf/annual-review`,
                      { headers: { Authorization: `Bearer ${localStorage.getItem('finbuddy_token')}` } }
                    );
                    if (!response.ok) throw new Error('Failed');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `finbuddy-annual-review-${user?.name}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Annual Review downloaded! 📊', { id: loadingToast });
                  } catch (e) {
                    toast.error('Download failed — check server', { id: loadingToast });
                  }
                }}
                className="btn-primary mt-4"
              >
                Download Annual Review
              </button>
            </div>

            {/* FinScore Card */}
            <div className={`card border transition-all ${user?.isPremium ? 'border-pink-500/25 bg-gradient-to-br from-violet-950/20 via-[var(--bg-secondary)] to-pink-950/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-cyan-500/20'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold">💳 Interactive FinScore Card</h3>
                  <p className="text-sm text-slate-400 mt-1">Hover to interact with your dynamic hologram credit card</p>
                </div>
                <span className="text-2xl">💎</span>
              </div>

              {/* Ultra-Premium 3D Hologram Tilt Credit Card */}
              <div
                className={`relative p-6 overflow-hidden rounded-2xl cursor-pointer select-none border transition-colors ${
                  user?.isPremium 
                    ? 'border-violet-500/50 shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:border-pink-500/50' 
                    : 'border-cyan-500/30 shadow-none'
                }`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={shareFinScore}
                style={{
                  transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                  transition: 'transform 0.1s ease, border-color 0.3s ease',
                  background: user?.isPremium
                    ? 'linear-gradient(135deg, rgba(46, 24, 86, 0.8) 0%, rgba(20, 10, 40, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(13, 13, 26, 0.95) 100%)',
                  boxShadow: rotate.x !== 0 || rotate.y !== 0
                    ? user?.isPremium 
                      ? '0 25px 50px -12px rgba(168, 85, 247, 0.45), inset 0 1px 0 0 rgba(255,255,255,0.15)'
                      : '0 25px 50px -12px rgba(0, 212, 255, 0.4), inset 0 1px 0 0 rgba(255,255,255,0.1)'
                    : user?.isPremium
                      ? '0 10px 30px -12px rgba(168, 85, 247, 0.25), inset 0 1px 0 0 rgba(255,255,255,0.05)'
                      : '0 10px 30px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Glossy hologram reflection light */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-30 transition-opacity"
                  style={{
                    background: user?.isPremium
                      ? `radial-gradient(circle at ${50 + rotate.y * 3}% ${50 - rotate.x * 3}%, rgba(236, 72, 153, 0.45) 0%, transparent 60%)`
                      : `radial-gradient(circle at ${50 + rotate.y * 3}% ${50 - rotate.x * 3}%, rgba(0, 212, 255, 0.4) 0%, transparent 60%)`,
                  }}
                />

                {/* Cyberpunk network grid background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#7C3AED_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Card Branding */}
                <div className="flex justify-between items-start mb-8" style={{ transform: 'translateZ(30px)' }}>
                  <div>
                    <p className={`text-[10px] font-extrabold tracking-widest uppercase ${user?.isPremium ? 'text-pink-400' : 'text-cyan-400'}`}>
                      {user?.isPremium ? '💎 FINBUDDY ELITE VIP' : 'FINBUDDY PREMIUM'}
                    </p>
                    <p className="text-xs text-slate-400">FINTECH EXPERIMENT CLUB</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg ${user?.isPremium ? 'bg-gradient-to-br from-violet-400 to-pink-500 shadow-pink-500/20' : 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-orange-500/20'}`}>
                    FB
                  </div>
                </div>

                {/* Hologram metallic chip */}
                <div className="mb-6" style={{ transform: 'translateZ(40px)' }}>
                  <div className="w-10 h-8 rounded-md bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-600 border border-yellow-400/30 relative overflow-hidden flex items-center justify-center shadow-md">
                    {/* Chip contact lines */}
                    <div className="absolute inset-0 grid grid-cols-3 gap-0.5 opacity-20">
                      <div className="border-r border-black" />
                      <div className="border-r border-black" />
                    </div>
                  </div>
                </div>

                {/* Center score display */}
                <div className="flex items-end justify-between" style={{ transform: 'translateZ(50px)' }}>
                  <div>
                    <p className="text-[9px] text-slate-400 tracking-wider">FINBUDDY SCORE</p>
                    <p className="text-5xl font-black tracking-tight text-white flex items-center gap-1 drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                      {user?.finScore || 500}
                      <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md self-center mb-1">
                        {user?.finScore >= 700 ? 'Expert' : user?.finScore >= 600 ? 'Advanced' : user?.finScore >= 500 ? 'Intermediate' : 'Beginner'}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 tracking-wider">VIRTUAL WALLET</p>
                    <p className="text-lg font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,212,255,0.3)]">
                      ₹{(user?.virtualWallet ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Footer details: Name and active streak */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5" style={{ transform: 'translateZ(30px)' }}>
                  <div>
                    <p className="text-[9px] text-slate-500 tracking-wider">CARD HOLDER</p>
                    <p className="text-xs font-bold text-slate-200 tracking-wide uppercase">{user?.name || 'FinBuddy Member'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 tracking-wider">ACTIVE STREAK</p>
                    <p className="text-xs font-bold text-orange-400 flex items-center gap-1 justify-end">
                      🔥 {user?.currentStreak || 0} Days
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={shareFinScore}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  🚀 Share Card & Referral Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing & Premium Tab */}
        {activeTab === 'billing' && (
          <div className="max-w-2xl space-y-6 animate-fade-in">
            {user?.isPremium ? (
              /* Upgraded Premium View */
              <div className="space-y-6 animate-fade-in">
                <div className="card border-violet-500/25 relative overflow-hidden bg-gradient-to-br from-violet-950/20 via-slate-900 to-pink-950/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="text-center py-8 relative">
                    <div className="text-6xl mb-4 animate-float">💎</div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                      Elite Member
                    </span>
                    <h2 className="text-3xl font-black text-white mt-4">FinBuddy Elite Active</h2>
                    <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                      You have unlocked all premium training capabilities, unlimited AI mentoring, and exclusive digital badges.
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-6 mt-4 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Current Plan</span>
                      <span className="font-bold text-violet-400">FinBuddy Elite Annual (Pro)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Billing Interval</span>
                      <span className="text-slate-300">₹299 / Year</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Payment Status</span>
                      <span className="text-green-400 font-medium">✓ Auto-Verified</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-violet-500/5 rounded-xl border border-violet-500/10 text-center">
                    <p className="text-xs text-violet-300 font-medium">Thank you for supporting FinBuddy! Keep compounding! 📈</p>
                  </div>
                </div>

                {/* Invoice Ledger history */}
                {invoices.length > 0 && (
                  <div className="card border-white/5 bg-black/10">
                    <h4 className="font-extrabold text-sm text-slate-300 mb-4">🧾 Billing Ledger & Receipts</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-500 font-extrabold">
                            <th className="pb-2">Invoice ID</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Reference ID</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {invoices.map((inv, idx) => (
                            <tr key={idx} className="text-slate-300">
                              <td className="py-3 font-mono text-slate-400">{inv.id}</td>
                              <td className="py-3">{inv.date}</td>
                              <td className="py-3 font-semibold text-white">{inv.amount}</td>
                              <td className="py-3 font-mono text-slate-500">{inv.gatewayId}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-400 font-bold border border-green-500/20 animate-pulse">
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={async () => {
                                    const loadToast = toast.loading('Generating invoice receipt PDF...');
                                    try {
                                      const response = await fetch(
                                        `${import.meta.env.VITE_API_URL}/pdf/invoice?invoiceId=${inv.id}&date=${inv.date}&gatewayId=${inv.gatewayId}`,
                                        { headers: { Authorization: `Bearer ${localStorage.getItem('finbuddy_token')}` } }
                                      );
                                      if (!response.ok) throw new Error('Failed');
                                      const blob = await response.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `finbuddy-receipt-${inv.id}.pdf`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                      toast.success('Invoice receipt downloaded! 📄', { id: loadToast });
                                    } catch (e) {
                                      toast.error('Download failed — verify server connection', { id: loadToast });
                                    }
                                  }}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold hover:underline bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                >
                                  Download PDF ⬇️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Upgrade CTA View */
              <div className="space-y-6">
                <div className="card border-violet-500/20 relative overflow-hidden bg-gradient-to-r from-violet-950/10 to-slate-900">
                  <div className="absolute -right-10 -top-10 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">👑</div>
                    <div>
                      <h3 className="text-xl font-bold">Upgrade to FinBuddy Elite</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Unlock complete premium features & unlimited training modules</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Gain exclusive access to institutional-level stock trading capabilities, priority AI mentors, and comprehensive wealth tracking tools.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      { icon: '🤖', title: 'Unlimited AI coaching', desc: 'No token constraints on AI coaching conversations.' },
                      { icon: '🗺️', title: 'Full Wealth Vault', desc: 'Advanced encryption + real-time metrics auditing.' },
                      { icon: '⚔️', title: 'Premium Battle Lobbies', desc: 'Access exclusive campus vs campus tournaments.' },
                      { icon: '📄', title: 'Interactive Certifications', desc: 'Download accredited trading certificates instantly.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-200">{item.title}</h4>
                          <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
                    <div>
                      <p className="text-xs text-slate-400">FINBUDDY PRO SUBSCRIPTION</p>
                      <p className="text-2xl font-black text-white">₹299 <span className="text-xs text-slate-500 font-normal">/ Year</span></p>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-bold transition shadow-lg shadow-violet-500/20 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Upgrade Now →'}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center">
                    Secure UPI payments powered by Razorpay. Safe & encrypted.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <SectionGuide sectionId="/profile" />
      </main>

      {/* Full-screen Celebration Overlay */}
      {showConfetti && <ConfettiCelebration onClose={() => setShowConfetti(false)} />}

      {showQRScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md relative border border-white/10 bg-[#0b1329]">
            <button 
              onClick={() => {
                setShowQRScanner(false);
                setQrScanningStep('idle');
                if (cameraStream) {
                  cameraStream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                }
              }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
            >&times;</button>
            <h3 className="font-extrabold text-white text-sm mb-4">📸 QR Receipt Scanner & Splitter</h3>
            
            {qrScanningStep === 'scanning' && (
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-white/10 flex flex-col items-center justify-center text-slate-400">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-cyan-400 animate-scanner-bar shadow-[0_0_8px_#22d3ee]" />
                <div className="z-10 text-[10px] font-black uppercase text-cyan-400 bg-black/50 px-3 py-1 rounded-full border border-cyan-500/20 animate-pulse">
                  Align bill receipt in view...
                </div>
              </div>
            )}

            {qrScanningStep === 'scanned' && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-xs text-green-400 flex items-center gap-2">
                  <span>✅</span>
                  <div>
                    <p className="font-bold">Bill Scanned & Extracted!</p>
                    <p className="text-[10px] text-green-500/80">Extracted items from restaurant bill</p>
                  </div>
                </div>
                
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {scannedBillItems.map(item => (
                    <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold text-white mb-2">
                        <span>{item.name}</span>
                        <span>₹{item.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['You', ...friendsList.map(f => f.name)].map(person => {
                          const isAssigned = item.assignedTo.includes(person);
                          return (
                            <button
                              key={person}
                              type="button"
                              onClick={() => assignItemToFriend(item.id, person)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                                isAssigned 
                                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-extrabold' 
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {person}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={settleQRBill}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl transition mt-2 shadow-lg shadow-cyan-500/10"
                >
                  🤝 Split and Add to Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Celebration component with particles
const ConfettiCelebration = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 85 }).map((_, idx) => {
          const randomX = Math.random() * 100;
          const randomSize = Math.random() * 8 + 6;
          const randomDelay = Math.random() * 3.5;
          const randomDuration = Math.random() * 2.5 + 1.8;
          const colors = ['#22D3EE', '#EC4899', '#8B5CF6', '#F59E0B', '#34D399'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div 
              key={idx}
              className="absolute top-[-20px] rounded-sm opacity-90"
              style={{
                left: `${randomX}%`,
                width: `${randomSize}px`,
                height: `${randomSize * (Math.random() > 0.5 ? 1.4 : 0.6)}px`,
                backgroundColor: randomColor,
                animation: `confetti-fall ${randomDuration}s linear ${randomDelay}s infinite`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          );
        })}
      </div>

      <div className="card max-w-md w-full border-violet-500/30 text-center py-10 relative overflow-hidden bg-gradient-to-b from-slate-900 to-[var(--bg-secondary)] shadow-[0_0_60px_rgba(168,85,247,0.35)] animate-scale-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-7xl mb-4 animate-bounce">👑</div>
        <h2 className="text-3xl font-black gradient-text">FinBuddy Elite Unlocked!</h2>
        <p className="text-slate-300 text-sm mt-3 px-6 leading-relaxed">
          Congratulations! You have upgraded to the **Elite Premium Tier**. All advanced modules, Priority AI mentoring, and Wealth Map analytics are now fully unlocked.
        </p>

        <div className="my-6 py-3 px-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mx-6 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Subscription Tier:</span>
          <span className="text-violet-400 font-extrabold tracking-widest uppercase">ELITE PRO 💎</span>
        </div>

        <button 
          onClick={onClose}
          className="btn-primary mx-auto"
          style={{ width: 'auto', padding: '12px 32px' }}
        >
          Start Compounding 📈
        </button>
      </div>
    
    </div>
  );
};

export default Profile;