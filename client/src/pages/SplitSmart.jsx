import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import SectionGuide from '../components/common/SectionGuide';

/* ─── Constants ─────────────────────────────────────────────── */
const groupTypes = [
  { value: 'mess',      label: '🍱 Mess',       emoji: '🍱' },
  { value: 'trip',      label: '✈️ Trip',        emoji: '✈️' },
  { value: 'roommates', label: '🏠 Roommates',   emoji: '🏠' },
  { value: 'outing',   label: '🎉 Outing',      emoji: '🎉' },
  { value: 'other',    label: '👥 Other',       emoji: '👥' },
];

const GROUP_STYLES = {
  trip:      { border: 'border-blue-500/30',   bg: 'from-blue-950/25 to-transparent',   badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',    glow: 'group-hover:shadow-blue-500/10'   },
  mess:      { border: 'border-amber-500/30',  bg: 'from-amber-950/25 to-transparent',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',  glow: 'group-hover:shadow-amber-500/10'  },
  roommates: { border: 'border-green-500/30',  bg: 'from-green-950/25 to-transparent',  badge: 'bg-green-500/20 text-green-300 border-green-500/30',  glow: 'group-hover:shadow-green-500/10'  },
  outing:    { border: 'border-pink-500/30',   bg: 'from-pink-950/25 to-transparent',   badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',     glow: 'group-hover:shadow-pink-500/10'   },
  other:     { border: 'border-white/10',      bg: 'from-slate-800/20 to-transparent',  badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',  glow: 'group-hover:shadow-slate-500/10'  },
};

const CAT_COLORS = {
  food: '#f59e0b', transport: '#3b82f6', accommodation: '#8b5cf6',
  entertainment: '#ec4899', shopping: '#10b981', utilities: '#64748b', other: '#6366f1',
};

const CAT_EMOJIS = {
  food: '🍕', transport: '🚗', accommodation: '🏨', entertainment: '🎬',
  shopping: '🛍️', utilities: '⚡', other: '📦',
};

/* ─── Component ─────────────────────────────────────────────── */
const SplitSmart = () => {
  const { user, updateUser } = useAuth();
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('groups');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showArchived, setShowArchived] = useState(false);

  /* modals */
  const [showCreate, setShowCreate]         = useState(false);
  const [showJoin, setShowJoin]             = useState(false);
  const [newGroupInvite, setNewGroupInvite] = useState(null);
  const [copiedInvite, setCopiedInvite]     = useState(false);
  const [creating, setCreating]             = useState(false);
  const [isJoining, setIsJoining]           = useState(false);
  const [inviteCode, setInviteCode]         = useState('');

  /* form */
  const [form, setForm]         = useState({ name: '', description: '', type: 'other', emoji: '👥' });
  const [upiInput, setUpiInput] = useState('');
  const [upiError, setUpiError] = useState('');

  /* notifications */
  const [notifications, setNotifications]         = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  /* global simplify */
  const [simplifying, setSimplifying]   = useState(false);
  const [globalDebts, setGlobalDebts]   = useState([]);
  const [showDebtsModal, setShowDebtsModal] = useState(false);

  /* analytics */
  const [analyticsData, setAnalyticsData]         = useState(null);
  const [analyticsLoading, setAnalyticsLoading]   = useState(false);

  /* settlement hub */
  const [settlementDebts, setSettlementDebts]       = useState([]);
  const [settlementLoading, setSettlementLoading]   = useState(false);
  const [settlementGroupMap, setSettlementGroupMap] = useState({});

  const socketRef = useRef(null);
  const notifRef  = useRef(null);

  /* ── Derived ── */
  const filteredGroups = useMemo(() => {
    let list = groups.filter(g => showArchived ? g.isArchived : !g.isArchived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => g.name?.toLowerCase().includes(q) || g.type?.includes(q));
    }
    return list;
  }, [groups, searchQuery, showArchived]);

  const totalOwed = useMemo(() => groups.reduce((s, g) => {
    const b = Number(g.myBalance) || 0; return b > 0 ? s + b : s;
  }, 0), [groups]);

  const totalOwe = useMemo(() => groups.reduce((s, g) => {
    const b = Number(g.myBalance) || 0; return b < 0 ? s + Math.abs(b) : s;
  }, 0), [groups]);

  const netBalance = totalOwed - totalOwe;

  const totalGroupSpend = analyticsData?.summary?.totalSpend
    || groups.reduce((acc, g) => acc + (Number(g.totalSpent) || 0), 0);

  const settledGroups = groups.filter(g => (Number(g.myBalance) || 0) === 0).length;

  const pieData  = analyticsData?.categoryBreakdown?.length > 0 ? analyticsData.categoryBreakdown : [];
  const areaData = analyticsData?.monthlyTrend?.length > 0
    ? analyticsData.monthlyTrend.map(m => ({ ...m, debt: Math.round((m.spend || 0) * 0.25) }))
    : [];

  /* ── Load ─────────────────────────────────────────────────── */
  useEffect(() => { loadGroups(); loadNotifications(); }, []);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    setAnalyticsLoading(true);
    api.get('/expenses/analytics')
      .then(({ data }) => { if (data.success) setAnalyticsData(data); })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'settlement' || groups.length === 0) return;
    loadSettlementDebts();
  }, [activeTab, groups]);

  /* ── Sockets ─────────────────────────────────────────────── */
  useEffect(() => {
    const token = localStorage.getItem('finbuddy_token');
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;
    const refresh = () => { loadGroups(); loadNotifications(); };
    socket.on('expense:new',       refresh);
    socket.on('expense:settled',   refresh);
    socket.on('notification:new',  refresh);
    return () => {
      socket.off('expense:new',      refresh);
      socket.off('expense:settled',  refresh);
      socket.off('notification:new', refresh);
    };
  }, []);

  /* close notif dropdown on outside click */
  useEffect(() => {
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── API Functions ──────────────────────────────────────── */
  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups || []);
    } catch { toast.error('Failed to load groups'); }
    setLoading(false);
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/expenses/notifications');
      if (data.success) setNotifications(data.notifications || []);
    } catch {}
  };

  const markNotifRead = async id => {
    try {
      await api.put(`/expenses/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Cleared!');
    } catch {}
  };

  const loadSettlementDebts = async () => {
    setSettlementLoading(true);
    try {
      const results = await Promise.allSettled(groups.map(g => api.get(`/groups/${g._id}/debts`)));
      const allDebts = [];
      const gMap = {};
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value.data?.debts) {
          const gId = groups[idx]._id;
          const gName = groups[idx].name;
          const gEmoji = groups[idx].emoji;
          gMap[gId] = { name: gName, emoji: gEmoji };
          r.value.data.debts.forEach(d => allDebts.push({ ...d, groupId: gId, groupName: gName, groupEmoji: gEmoji }));
        }
      });
      setSettlementDebts(allDebts);
      setSettlementGroupMap(gMap);
    } catch { toast.error('Failed to load settlement data'); }
    setSettlementLoading(false);
  };

  const validateUpi = val => {
    if (!val) return 'UPI ID is required';
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(val) ? '' : 'Invalid UPI. E.g. username@upi';
  };

  const createGroup = async e => {
    e.preventDefault();
    setCreating(true);
    try {
      if (!user?.upiId && upiInput) {
        const { data: ud } = await api.put('/users/me', { upiId: upiInput });
        updateUser(ud.user);
      }
      const res = await api.post('/groups', form);
      if (res.data?.group?.inviteCode) setNewGroupInvite(res.data.group.inviteCode);
      toast.success('Group created! 🎉');
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'other', emoji: '👥' });
      setUpiInput('');
      loadGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    setCreating(false);
  };

  const joinGroup = async e => {
    e.preventDefault();
    setIsJoining(true);
    try {
      if (!user?.upiId && upiInput) {
        const { data: ud } = await api.put('/users/me', { upiId: upiInput });
        updateUser(ud.user);
      }
      await api.post('/groups/join', { inviteCode });
      toast.success('Joined group! 🎉');
      setShowJoin(false);
      setInviteCode('');
      setUpiInput('');
      loadGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid code'); }
    setIsJoining(false);
  };

  const simplifyAllDebts = async () => {
    setSimplifying(true);
    try {
      const results = await Promise.allSettled(groups.map(g => api.get(`/groups/${g._id}/debts`)));
      const allDebts = [];
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.data?.debts) {
          r.value.data.debts.forEach(d => allDebts.push(d));
        }
      });
      setGlobalDebts(allDebts);
      setShowDebtsModal(true);
    } catch { toast.error('Failed to load debts'); }
    setSimplifying(false);
  };

  /* ── Settlement grouped by group ── */
  const mySettlementDebts = settlementDebts.filter(d => d.from === user?._id?.toString());
  const owedToMeDebts     = settlementDebts.filter(d => d.to === user?._id?.toString());
  const otherDebts        = settlementDebts.filter(d => d.from !== user?._id?.toString() && d.to !== user?._id?.toString());

  const settlementByGroup = useMemo(() => {
    const map = {};
    settlementDebts.forEach(d => {
      const key = d.groupId;
      if (!map[key]) map[key] = { name: d.groupName, emoji: d.groupEmoji, debts: [] };
      map[key].debts.push(d);
    });
    return Object.values(map);
  }, [settlementDebts]);

  /* ─────────────────────────────────────────────────────────── */
  /*  RENDER                                                     */
  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="contents">
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              💸 SplitSmart
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Split bills • Minimize debts • Settle via UPI</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/battle" className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>
              ⚔️ Battle
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="btn-secondary relative" style={{ padding: '8px 12px', width: 'auto' }}>
                🔔
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center border border-slate-900 animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Notifications</span>
                    {notifications.length > 0 && <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">{notifications.length} unread</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">🎉 All caught up!</div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {notifications.map(n => (
                        <div key={n._id} className="p-2.5 rounded-xl bg-white/5 border border-white/[0.04]">
                          <p className="text-xs text-slate-200">{n.message}</p>
                          <div className="flex justify-between items-center mt-1.5">
                            <span className="text-[9px] text-slate-500">{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                            <button onClick={() => markNotifRead(n._id)} className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold">Dismiss ✓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setShowJoin(true)} className="btn-secondary text-xs" style={{ padding: '8px 14px', width: 'auto' }}>
              🔗 Join
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-xs" style={{ padding: '8px 16px', width: 'auto' }}>
              + New Group
            </button>
          </div>
        </div>

        {/* ── Balance Hero ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Friends owe you', val: totalOwed, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-950/30', icon: '📈', sub: `across ${groups.filter(g => (Number(g.myBalance)||0) > 0).length} groups` },
            { label: 'You owe friends', val: totalOwe,  color: 'text-red-400',     border: 'border-red-500/20',     bg: 'from-red-950/30',     icon: '📉', sub: `across ${groups.filter(g => (Number(g.myBalance)||0) < 0).length} groups` },
            { label: 'Net balance',    val: Math.abs(netBalance), color: netBalance >= 0 ? 'text-cyan-400' : 'text-orange-400', border: netBalance >= 0 ? 'border-cyan-500/20' : 'border-orange-500/20', bg: netBalance >= 0 ? 'from-cyan-950/30' : 'from-orange-950/30', icon: '⚖️', sub: netBalance >= 0 ? 'in your favor' : 'you owe more', prefix: netBalance >= 0 ? '+' : '-' },
          ].map(s => (
            <div key={s.label} className={`card border ${s.border} bg-gradient-to-br ${s.bg} to-transparent p-5`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.prefix || ''}₹{s.val.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-slate-500 mt-1">{s.sub}</p>
              {totalOwe + totalOwed > 0 && s.label !== 'Net balance' && (
                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.color === 'text-emerald-400' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (s.val / (totalOwe + totalOwed)) * 100)}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-8 gap-1 max-w-lg">
          {[['groups','👥 Groups'], ['settlement','⚡ Settlement Hub'], ['analytics','📊 Analytics']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === tab ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB: GROUPS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'groups' && (
          <>
            {/* ── Search + actions row ── */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  className="input-dark pl-8 text-sm h-10"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={() => setShowArchived(!showArchived)}
                className={`text-xs px-3 h-10 rounded-lg border transition cursor-pointer ${showArchived ? 'border-cyan-400/40 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                {showArchived ? '📦 Archived' : '✅ Active'}
              </button>
              <button onClick={simplifyAllDebts} disabled={simplifying || groups.length === 0}
                className="text-xs px-3 h-10 rounded-lg border border-indigo-400/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition disabled:opacity-40 cursor-pointer">
                {simplifying ? '⏳ Simplifying...' : '🔄 Simplify All Debts'}
              </button>
            </div>

            {/* ── Groups grid ── */}
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="flex gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/5" />
                      <div className="flex-1">
                        <div className="h-4 bg-white/5 rounded mb-2" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                    <div className="h-8 bg-white/5 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 && !searchQuery ? (
              <div className="card text-center py-20 border-dashed">
                <div className="text-6xl mb-4">💸</div>
                <h3 className="text-xl font-bold mb-2">No groups yet</h3>
                <p className="text-slate-400 mb-6 text-sm">Create a group to start splitting bills with friends</p>
                <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto" style={{ width: 'auto', padding: '12px 28px' }}>
                  Create First Group
                </button>
              </div>
            ) : filteredGroups.length === 0 && searchQuery ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-400">No groups matching <strong className="text-white">"{searchQuery}"</strong></p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map(group => {
                  const bal = Number(group.myBalance) || 0;
                  const style = GROUP_STYLES[group.type] || GROUP_STYLES.other;
                  return (
                    <Link key={group._id} to={`/split/group/${group._id}`}>
                      <div className={`card border ${style.border} bg-gradient-to-br ${style.bg} hover:scale-[1.02] transition-all duration-200 cursor-pointer group relative overflow-hidden ${style.glow} hover:shadow-lg`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner border ${style.border}`}>
                              {group.emoji || '👥'}
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-cyan-300 transition">{group.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${style.badge}`}>{group.type || 'other'}</span>
                                <span className="text-[9px] text-slate-500">· {group.members?.length} members</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-1 rounded-full text-slate-400">
                              {group.expenseCount || 0} exp
                            </span>
                            {group.updatedAt && (
                              <span className="text-[9px] text-slate-600">
                                {new Date(group.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Member avatars */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {group.members?.slice(0, 5).map((m, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-slate-800 flex items-center justify-center text-[9px] font-bold overflow-hidden"
                                style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 10 - i }}>
                                {m.user?.avatar
                                  ? <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />
                                  : m.user?.name?.[0]?.toUpperCase()}
                              </div>
                            ))}
                            {(group.members?.length || 0) > 5 && (
                              <span className="text-[9px] text-slate-400 ml-2">+{group.members.length - 5}</span>
                            )}
                          </div>
                          {Number(group.totalSpent) > 0 && (
                            <span className="text-[10px] text-slate-500 ml-auto">
                              Total: <span className="text-slate-300 font-semibold">₹{Number(group.totalSpent).toLocaleString('en-IN')}</span>
                            </span>
                          )}
                        </div>

                        {/* Balance badge */}
                        <div className={`flex items-center justify-between p-2.5 rounded-xl ${
                          bal > 0 ? 'bg-emerald-500/10 border border-emerald-500/15' 
                          : bal < 0 ? 'bg-red-500/10 border border-red-500/15' 
                          : 'bg-white/5 border border-white/5'}`}>
                          <span className="text-xs text-slate-400">Your balance</span>
                          <span className={`font-bold text-xs ${bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {bal > 0 ? `📈 +₹${bal.toFixed(0)} owed to you` : bal < 0 ? `📉 -₹${Math.abs(bal).toFixed(0)} you owe` : '✅ All settled'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* Add card */}
                <div onClick={() => setShowCreate(true)}
                  className="card border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/30 transition min-h-44 group">
                  <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">➕</span>
                  <p className="text-slate-400 text-sm group-hover:text-white transition">Create new group</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: SETTLEMENT HUB
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'settlement' && (
          <div className="space-y-6 animate-fade-in">

            {/* Header explainer */}
            <div className="card bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border-indigo-500/20 p-5">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🧠</div>
                <div>
                  <h3 className="font-bold text-white mb-1">Smart Debt Minimization Engine</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instead of paying everyone separately, FinBuddy uses a <strong className="text-indigo-400">Bitmask DP algorithm</strong> (same as Splitwise) to find the fewest transactions needed.
                    For example, if A→B→C each owe ₹100, instead of 2 transactions you just need A→C for ₹100.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            {!settlementLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'You Owe', val: `₹${mySettlementDebts.reduce((s,d)=>s+(d.amount||0),0).toLocaleString('en-IN')}`, color: 'text-red-400', border: 'border-red-500/20', icon: '💸' },
                  { label: 'Owed to You', val: `₹${owedToMeDebts.reduce((s,d)=>s+(d.amount||0),0).toLocaleString('en-IN')}`, color: 'text-emerald-400', border: 'border-emerald-500/20', icon: '💰' },
                  { label: 'Min Transactions', val: settlementDebts.length, color: 'text-cyan-400', border: 'border-cyan-500/20', icon: '⚡' },
                  { label: 'Groups', val: groups.filter(g=>!g.isArchived).length, color: 'text-purple-400', border: 'border-purple-500/20', icon: '👥' },
                ].map(s => (
                  <div key={s.label} className={`card p-4 border ${s.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                      <span>{s.icon}</span>
                    </div>
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>
            )}

            {settlementLoading ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Computing minimum transactions...</p>
              </div>
            ) : settlementDebts.length === 0 ? (
              <div className="card text-center py-16 border-emerald-500/20">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Completely settled!</h3>
                <p className="text-slate-400 text-sm">No outstanding debts across any of your groups.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Debts I owe */}
                {mySettlementDebts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      You Need to Pay
                    </h3>
                    <div className="space-y-2">
                      {mySettlementDebts.map((debt, i) => (
                        <div key={i} className="card border-red-500/20 bg-red-950/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg font-bold text-red-400">
                                {debt.toUser?.name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">Pay <span className="text-red-300">{debt.toUser?.name || 'Friend'}</span></p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {debt.groupEmoji} {debt.groupName}
                                  {debt.toUser?.upiId && <span className="ml-2 text-cyan-400">📱 {debt.toUser.upiId}</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-red-400">₹{debt.amount?.toLocaleString('en-IN')}</span>
                              <Link to={`/split/group/${debt.groupId}?tab=debts`}>
                                <button className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition">
                                  Settle →
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owed to me */}
                {owedToMeDebts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      Owed to You
                    </h3>
                    <div className="space-y-2">
                      {owedToMeDebts.map((debt, i) => (
                        <div key={i} className="card border-emerald-500/20 bg-emerald-950/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                                {debt.fromUser?.name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm"><span className="text-emerald-300">{debt.fromUser?.name || 'Friend'}</span> owes you</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{debt.groupEmoji} {debt.groupName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-emerald-400">₹{debt.amount?.toLocaleString('en-IN')}</span>
                              <Link to={`/split/group/${debt.groupId}?tab=debts`}>
                                <button className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition">
                                  Remind →
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other group debts */}
                {otherDebts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Other Group Transactions
                    </h3>
                    <div className="space-y-2">
                      {otherDebts.map((debt, i) => (
                        <div key={i} className="card p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
                                {debt.fromUser?.name?.[0] || '?'}
                              </div>
                              <div>
                                <p className="text-sm text-slate-300">
                                  <span className="text-white font-semibold">{debt.fromUser?.name || 'Member'}</span>
                                  <span className="text-slate-500 mx-2">→</span>
                                  <span className="text-white font-semibold">{debt.toUser?.name || 'Member'}</span>
                                </p>
                                <p className="text-[10px] text-slate-500">{debt.groupEmoji} {debt.groupName}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-300">₹{debt.amount?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How it works */}
                <div className="card bg-gradient-to-br from-slate-900 to-slate-900/50 border-white/5 p-5">
                  <h4 className="font-bold text-sm text-white mb-3">📐 How Debt Minimization Works</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <p className="font-bold text-white mb-1">1. Calculate Net Balances</p>
                      <p>Sum up what each person paid vs what they owe across all expenses</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                      <p className="font-bold text-white mb-1">2. Find Zero-Sum Subsets</p>
                      <p>Bitmask DP finds minimum subsets of members who can settle among themselves</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl">
                      <p className="font-bold text-white mb-1">3. Greedy Settlement</p>
                      <p>Within each subset: largest creditor receives from largest debtor first</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: ANALYTICS
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* Status badge */}
            <div>
              {analyticsLoading ? (
                <span className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full w-fit">
                  <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading real expense data...
                </span>
              ) : analyticsData ? (
                <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  🔴 LIVE · Real DB data · {analyticsData.summary?.totalGroups} groups
                </span>
              ) : (
                <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full w-fit">
                  Add expenses to see real analytics
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '💳 Cumulative Spend', val: `₹${totalGroupSpend.toLocaleString('en-IN')}`, color: 'text-cyan-400' },
                { label: '🔄 Groups with Debt', val: `${groups.length - settledGroups}`, color: 'text-indigo-400' },
                { label: '✅ Fully Settled', val: `${settledGroups}/${groups.length}`, color: 'text-emerald-400' },
                { label: '🔥 Active Groups', val: `${groups.filter(g => !g.isArchived).length}`, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Pie */}
              <div className="lg:col-span-5 card p-5">
                <h3 className="font-bold text-white mb-1">📁 Category Allocation</h3>
                <p className="text-xs text-slate-400 mb-5">Share of splits by cost category</p>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-52">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-sm text-slate-400">Add expenses to see breakdown</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center" style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color || CAT_COLORS[e.name] || '#6366f1'} />)}
                          </Pie>
                          <ChartTooltip contentStyle={{ backgroundColor: '#0b1329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                            formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Cost']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-base font-black text-white">₹{totalGroupSpend.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-white/5">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color || CAT_COLORS[d.name] || '#6366f1' }} />
                          <span className="truncate">{d.name} ({Math.round((d.value / totalGroupSpend) * 100) || 0}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Area chart */}
              <div className="lg:col-span-7 card p-5">
                <h3 className="font-bold text-white mb-1">📈 Monthly Spend Trend</h3>
                <p className="text-xs text-slate-400 mb-5">Monthly group expenditure over time</p>
                {areaData.length === 0 ? (
                  <div className="flex items-center justify-center h-52">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📈</div>
                      <p className="text-sm text-slate-400">Add expenses across months to see trends</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                      <ChartTooltip contentStyle={{ backgroundColor: '#0b1329', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="spend" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#cs)" name="Spend" />
                      <Area type="monotone" dataKey="debt"  stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#cd)"  name="Debt"  />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Per-group breakdown table */}
            {groups.filter(g => Number(g.totalSpent) > 0).length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-white mb-4">📋 Group Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                        <th className="pb-3 font-bold">Group</th>
                        <th className="pb-3 font-bold text-right">Total Spent</th>
                        <th className="pb-3 font-bold text-right">Your Balance</th>
                        <th className="pb-3 font-bold text-right">Members</th>
                        <th className="pb-3 font-bold text-right">Expenses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {groups.filter(g => !g.isArchived).map(g => {
                        const bal = Number(g.myBalance) || 0;
                        return (
                          <tr key={g._id} className="hover:bg-white/5 transition">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{g.emoji}</span>
                                <div>
                                  <p className="font-semibold text-white">{g.name}</p>
                                  <p className="text-[9px] text-slate-500 capitalize">{g.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-right font-semibold text-white">₹{Number(g.totalSpent || 0).toLocaleString('en-IN')}</td>
                            <td className={`py-3 text-right font-bold ${bal > 0 ? 'text-emerald-400' : bal < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                              {bal > 0 ? '+' : ''}₹{Math.abs(bal).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 text-right text-slate-400">{g.members?.length || 0}</td>
                            <td className="py-3 text-right text-slate-400">{g.expenseCount || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI insight */}
            <div className="card bg-gradient-to-r from-purple-950/30 to-indigo-950/30 border-purple-500/20 p-5 flex gap-4 items-start">
              <span className="text-3xl mt-0.5">💡</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Smart Split Insight</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {groups.length > 0
                    ? `You have ${groups.length} active ${groups.length === 1 ? 'group' : 'groups'} with a total of ₹${totalGroupSpend.toLocaleString('en-IN')} in shared expenses. ${totalOwe > 0 ? `Clear your ₹${totalOwe.toLocaleString('en-IN')} dues first to improve your trust score.` : 'All dues cleared — excellent financial hygiene! 🏆'}`
                    : 'Create a group, add your shared expenses, and let FinBuddy AI build you personalized split recommendations.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <SectionGuide sectionId="/split" />
      </main>

      {/* ══════════ MODALS ══════════════════════════════════════ */}

      {/* Global Debts Summary Modal */}
      {showDebtsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">🔄 Simplified Debt Summary</h2>
                <p className="text-xs text-slate-400 mt-0.5">Minimum transactions across all groups</p>
              </div>
              <button onClick={() => setShowDebtsModal(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            {globalDebts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-bold text-white">All settled!</p>
                <p className="text-slate-400 text-sm mt-1">No outstanding debts across all groups.</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {globalDebts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-xs font-bold">
                        {(d.fromUser?.name || 'Me')[0]}
                      </div>
                      <span className="text-sm text-slate-300">{d.fromUser?.name || 'You'}</span>
                      <span className="text-slate-500 text-xs">→ owes</span>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-xs font-bold">
                        {(d.toUser?.name || 'Them')[0]}
                      </div>
                      <span className="text-sm text-slate-300">{d.toUser?.name || 'Them'}</span>
                    </div>
                    <span className="font-bold text-red-400">₹{(d.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowDebtsModal(false)} className="btn-secondary w-full mt-4">Close</button>
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {newGroupInvite && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm text-center animate-fade-in">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold mb-1">Group Created!</h2>
            <p className="text-slate-400 text-sm mb-4">Share this invite code with your friends:</p>
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-3xl font-black text-cyan-400 tracking-[0.4em] font-mono">{newGroupInvite}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => { navigator.clipboard.writeText(newGroupInvite); setCopiedInvite(true); setTimeout(() => setCopiedInvite(false), 2000); }}
                className="btn-primary w-full">
                {copiedInvite ? '✅ Copied!' : '📋 Copy Invite Code'}
              </button>
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my FinBuddy group! Use invite code: ${newGroupInvite} 💸`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition">
                <span>🟢</span> Share on WhatsApp
              </a>
              <button onClick={() => setNewGroupInvite(null)} className="btn-secondary w-full">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Create Group</h2>
                <p className="text-xs text-slate-400 mt-0.5">Split expenses with your friends</p>
              </div>
              <button onClick={() => { setShowCreate(false); setUpiInput(''); setUpiError(''); }} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Group Name *</label>
                <input className="input-dark" placeholder="College Trip, Mess Group..." value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Group Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {groupTypes.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value, emoji: t.emoji })}
                      className={`py-2 rounded-xl border text-xl transition ${form.type === t.value ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                      title={t.label}>{t.emoji}</button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 capitalize">Selected: {form.type}</p>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description (optional)</label>
                <input className="input-dark" placeholder="What's this group for?" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {!user?.upiId && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2 animate-fade-in">
                  <p className="text-xs text-cyan-300 font-bold">📱 Setup UPI ID for Settlements</p>
                  <input className={`input-dark font-mono text-cyan-300 text-sm ${upiError ? 'border-red-500/50' : ''}`}
                    placeholder="username@upi" value={upiInput}
                    onChange={e => { setUpiInput(e.target.value); setUpiError(e.target.value ? validateUpi(e.target.value) : ''); }}
                    required />
                  {upiError && <p className="text-[10px] text-red-400">⚠️ {upiError}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    {['@okaxis', '@okicici', '@ybl', '@paytm'].map(s => (
                      <button key={s} type="button" onClick={() => { const p = upiInput.split('@')[0] || 'username'; const v = p + s; setUpiInput(v); setUpiError(validateUpi(v)); }}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-lg text-slate-400 hover:text-cyan-300 transition cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setUpiInput(''); setUpiError(''); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={creating || (!user?.upiId && !!upiError)}>
                  {creating ? 'Creating...' : 'Create Group 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Join Group</h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter your invite code below</p>
              </div>
              <button onClick={() => { setShowJoin(false); setUpiInput(''); setUpiError(''); }} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={joinGroup} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Invite Code</label>
                <input className="input-dark text-center text-2xl font-black tracking-[0.4em] uppercase"
                  placeholder="AB12CD" value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())} maxLength={8} required />
              </div>

              {!user?.upiId && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2">
                  <p className="text-xs text-cyan-300 font-bold">📱 Setup UPI ID for Settlements</p>
                  <input className={`input-dark font-mono text-cyan-300 text-sm ${upiError ? 'border-red-500/50' : ''}`}
                    placeholder="username@upi" value={upiInput}
                    onChange={e => { setUpiInput(e.target.value); setUpiError(e.target.value ? validateUpi(e.target.value) : ''); }}
                    required />
                  {upiError && <p className="text-[10px] text-red-400">⚠️ {upiError}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    {['@okaxis', '@okicici', '@ybl', '@paytm'].map(s => (
                      <button key={s} type="button" onClick={() => { const p = upiInput.split('@')[0] || 'username'; const v = p + s; setUpiInput(v); setUpiError(validateUpi(v)); }}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-lg text-slate-400 hover:text-cyan-300 transition cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowJoin(false); setUpiInput(''); setUpiError(''); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={isJoining || (!user?.upiId && !!upiError)}>
                  {isJoining ? 'Joining...' : 'Join Group →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitSmart;