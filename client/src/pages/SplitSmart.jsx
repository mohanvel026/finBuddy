import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, PieChart, Pie, Cell
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

const CAT_COLORS = {
  food: '#f59e0b', transport: '#3b82f6', accommodation: '#8b5cf6',
  entertainment: '#ec4899', shopping: '#10b981', utilities: '#64748b', other: '#6366f1',
};

/* ─── Dijkstra Helpers ──────────────────────────────────────── */
const buildGraphMatrix = (nodes, edges) => {
  const n = nodes.length;
  const graph = Array.from({ length: n }, () => new Array(n).fill(0));
  edges.forEach(e => {
    if (e.from < n && e.to < n) { graph[e.from][e.to] = e.fee; graph[e.to][e.from] = e.fee; }
  });
  return graph;
};

const DEMO_NODES = [
  { id: 0, name: 'You', x: 200, y: 50 }, { id: 1, name: 'Bob', x: 340, y: 130 },
  { id: 2, name: 'Charlie', x: 340, y: 270 }, { id: 3, name: 'Dia', x: 200, y: 350 },
  { id: 4, name: 'Eva', x: 60, y: 270 },  { id: 5, name: 'Frank', x: 60, y: 130 },
];
const DEMO_EDGES = [
  { from: 0, to: 1, fee: 50 }, { from: 0, to: 2, fee: 120 }, { from: 1, to: 2, fee: 30 },
  { from: 1, to: 3, fee: 80 }, { from: 2, to: 3, fee: 60 }, { from: 2, to: 4, fee: 100 },
  { from: 3, to: 4, fee: 40 }, { from: 3, to: 5, fee: 90 }, { from: 4, to: 5, fee: 50 },
];

/* ─── Component ─────────────────────────────────────────────── */
const SplitSmart = () => {
  const { user, updateUser } = useAuth();
  const [groups, setGroups]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('groups');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showArchived, setShowArchived] = useState(false);

  /* modals */
  const [showCreate, setShowCreate]     = useState(false);
  const [showJoin, setShowJoin]         = useState(false);
  const [newGroupInvite, setNewGroupInvite] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [creating, setCreating]         = useState(false);
  const [isJoining, setIsJoining]       = useState(false);
  const [inviteCode, setInviteCode]     = useState('');

  /* form */
  const [form, setForm]       = useState({ name: '', description: '', type: 'other', emoji: '👥' });
  const [upiInput, setUpiInput]   = useState('');
  const [upiError, setUpiError]   = useState('');

  /* notifications */
  const [notifications, setNotifications]     = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  /* global simplify */
  const [simplifying, setSimplifying]   = useState(false);
  const [globalDebts, setGlobalDebts]   = useState([]);
  const [showDebtsModal, setShowDebtsModal] = useState(false);

  /* analytics */
  const [analyticsData, setAnalyticsData]     = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  /* dijkstra */
  const [dijkstraSource, setDijkstraSource]   = useState(0);
  const [dijkstraTarget, setDijkstraTarget]   = useState(5);
  const [dijkstraPath, setDijkstraPath]       = useState([]);
  const [dijkstraCost, setDijkstraCost]       = useState(0);
  const [dijkstraSteps, setDijkstraSteps]     = useState([]);
  const [dijkstraStepIdx, setDijkstraStepIdx] = useState(-1);
  const [isPlayingDijkstra, setIsPlayingDijkstra] = useState(false);
  const [realDebtNodes, setRealDebtNodes]     = useState([]);
  const [realDebtEdges, setRealDebtEdges]     = useState([]);
  const [loadingDebtGraph, setLoadingDebtGraph] = useState(false);

  const socketRef = useRef(null);
  const notifRef  = useRef(null);

  /* ── Derived ── */
  const filteredGroups = useMemo(() => {
    let list = groups.filter(g => showArchived ? g.isArchived : !g.isArchived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.type?.includes(q));
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
    if (activeTab !== 'dijkstra' || groups.length === 0) return;
    buildDebtGraph();
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

  /* ── Dijkstra animation ──────────────────────────────────── */
  useEffect(() => {
    let interval = null;
    if (isPlayingDijkstra && dijkstraSteps.length > 0) {
      interval = setInterval(() => {
        setDijkstraStepIdx(prev => {
          if (prev >= dijkstraSteps.length - 1) { setIsPlayingDijkstra(false); return prev; }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingDijkstra, dijkstraSteps]);

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

  /* ── Debt Graph Builder ─────────────────────────────────── */
  const buildDebtGraph = async () => {
    setLoadingDebtGraph(true);
    try {
      const memberMap = new Map();
      const allDebts  = [];
      await Promise.allSettled(groups.map(async g => {
        try {
          const { data } = await api.get(`/groups/${g._id}/debts`);
          if (data.success && data.debts) {
            data.debts.forEach(d => {
              if (!memberMap.has(d.fromUser?._id || d.from))
                memberMap.set(d.fromUser?._id || d.from, { id: memberMap.size, name: d.fromUser?.name?.split(' ')[0] || 'Me' });
              if (!memberMap.has(d.toUser?._id || d.to))
                memberMap.set(d.toUser?._id || d.to, { id: memberMap.size, name: d.toUser?.name?.split(' ')[0] || 'Friend' });
              allDebts.push({ fromId: d.fromUser?._id || d.from, toId: d.toUser?._id || d.to, amount: d.amount });
            });
          }
        } catch {}
      }));
      if (memberMap.size < 2) { setLoadingDebtGraph(false); return; }
      const nodes = Array.from(memberMap.values());
      const R = 150, cx = 200, cy = 200;
      nodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
        n.x = Math.round(cx + R * Math.cos(angle));
        n.y = Math.round(cy + R * Math.sin(angle));
      });
      const edgeMap = new Map();
      allDebts.forEach(d => {
        const fn = memberMap.get(d.fromId); const tn = memberMap.get(d.toId);
        if (!fn || !tn) return;
        const key = `${Math.min(fn.id, tn.id)}-${Math.max(fn.id, tn.id)}`;
        const ex  = edgeMap.get(key);
        if (ex) ex.fee = Math.round(ex.fee + d.amount);
        else edgeMap.set(key, { from: fn.id, to: tn.id, fee: Math.round(d.amount) });
      });
      setRealDebtNodes(nodes);
      setRealDebtEdges(Array.from(edgeMap.values()));
      if (nodes.length >= 2) { setDijkstraSource(0); setDijkstraTarget(Math.min(1, nodes.length - 1)); }
    } catch (e) { console.error('Debt graph error:', e); }
    setLoadingDebtGraph(false);
  };

  /* ── Dijkstra Algorithm ─────────────────────────────────── */
  const calculateDijkstra = () => {
    const dNodes = realDebtNodes.length > 0 ? realDebtNodes : DEMO_NODES;
    const dEdges = realDebtEdges.length > 0 ? realDebtEdges : DEMO_EDGES;
    const dGraph = buildGraphMatrix(dNodes, dEdges);
    const n     = dGraph.length;
    const dist  = new Array(n).fill(Infinity);
    const prev  = new Array(n).fill(null);
    const visited = new Array(n).fill(false);
    dist[dijkstraSource] = 0;
    const steps = [{ u: -1, dist: [...dist], visited: [...visited], msg: `Start: source ${dNodes[dijkstraSource]?.name} = ₹0, others = ∞` }];
    for (let count = 0; count < n; count++) {
      let u = -1, minDist = Infinity;
      for (let i = 0; i < n; i++) if (!visited[i] && dist[i] < minDist) { minDist = dist[i]; u = i; }
      if (u === -1) break;
      visited[u] = true;
      steps.push({ u, dist: [...dist], visited: [...visited], msg: `Visiting ${dNodes[u]?.name} (dist ₹${dist[u]})` });
      if (u === dijkstraTarget) break;
      for (let v = 0; v < n; v++) {
        const w = dGraph[u][v];
        if (w > 0 && !visited[v]) {
          const alt = dist[u] + w;
          if (alt < dist[v]) {
            dist[v] = alt; prev[v] = u;
            steps.push({ u, v, alt, dist: [...dist], visited: [...visited], msg: `Update ${dNodes[v]?.name}: ₹${dist[u]} + ₹${w} = ₹${alt}` });
          }
        }
      }
    }
    const path = []; let curr = dijkstraTarget;
    while (curr !== null) { path.unshift(curr); curr = prev[curr]; }
    setDijkstraPath(dist[dijkstraTarget] === Infinity ? [] : path);
    setDijkstraCost(dist[dijkstraTarget]);
    setDijkstraSteps(steps);
    setDijkstraStepIdx(0);
    setIsPlayingDijkstra(false);
  };

  /* ─────────────────────────────────────────────────────────── */
  /*  RENDER                                                     */
  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="contents">
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
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

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 max-w-sm mb-8 gap-1">
          {[['groups','👥 Groups'], ['analytics','📊 Analytics'], ['dijkstra','⚡ Routing']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === tab ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-slate-200'
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
            {/* ── Hero balance cards ── */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card border-green-500/20 bg-gradient-to-br from-green-950/30 to-transparent p-4">
                <p className="text-xs text-slate-400 mb-1">Friends owe you</p>
                <p className="text-xl font-black text-green-400">₹{totalOwed.toLocaleString('en-IN')}</p>
              </div>
              <div className="card border-red-500/20 bg-gradient-to-br from-red-950/30 to-transparent p-4">
                <p className="text-xs text-slate-400 mb-1">You owe</p>
                <p className="text-xl font-black text-red-400">₹{totalOwe.toLocaleString('en-IN')}</p>
              </div>
              <div className={`card p-4 ${netBalance >= 0 ? 'border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-transparent' : 'border-orange-500/20 bg-gradient-to-br from-orange-950/30 to-transparent'}`}>
                <p className="text-xs text-slate-400 mb-1">Net balance</p>
                <p className={`text-xl font-black ${netBalance >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {netBalance >= 0 ? '+' : ''}₹{Math.abs(netBalance).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

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
              <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredGroups.length === 0 && !searchQuery ? (
              <div className="card text-center py-20">
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
                  return (
                    <Link key={group._id} to={`/split/group/${group._id}`}>
                      <div className="card hover:border-cyan-500/30 transition-all duration-200 cursor-pointer group relative overflow-hidden hover:scale-[1.01]">
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-indigo-500/0 group-hover:from-cyan-500/5 group-hover:to-indigo-500/5 transition-all duration-300 rounded-2xl pointer-events-none" />

                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                              {group.emoji || '👥'}
                            </div>
                            <div>
                              <h3 className="font-bold text-white group-hover:text-cyan-300 transition">{group.name}</h3>
                              <p className="text-xs text-slate-400 capitalize">{group.type} · {group.members?.length} members</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-1 rounded-full text-slate-400">
                              {group.expenseCount} exp
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
                        <div className={`flex items-center justify-between p-2.5 rounded-xl ${bal > 0 ? 'bg-green-500/10 border border-green-500/15' : bal < 0 ? 'bg-red-500/10 border border-red-500/15' : 'bg-white/5 border border-white/5'}`}>
                          <span className="text-xs text-slate-400">Your balance</span>
                          <span className={`font-bold text-xs ${bal > 0 ? 'text-green-400' : bal < 0 ? 'text-red-400' : 'text-slate-400'}`}>
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
                <h3 className="font-bold text-white mb-1">📈 Split Flow & Debt Velocity</h3>
                <p className="text-xs text-slate-400 mb-5">Monthly spend vs outstanding debt</p>
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

        {/* ══════════════════════════════════════════════════════
            TAB: DIJKSTRA ROUTING
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'dijkstra' && (() => {
          const dNodes = realDebtNodes.length > 0 ? realDebtNodes : DEMO_NODES;
          const dEdges = realDebtEdges.length > 0 ? realDebtEdges : DEMO_EDGES;
          return (
            <div className="space-y-6 animate-fade-in">
              {/* Status */}
              <div>
                {loadingDebtGraph ? (
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    Loading real debt data...
                  </span>
                ) : realDebtNodes.length > 0 ? (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                    🔴 LIVE · Real debts from {groups.length} group{groups.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                    📊 Demo · Add group expenses to see real debt routing
                  </span>
                )}
              </div>

              {/* Explainer */}
              <div className="card bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border-cyan-500/20 p-5">
                <h3 className="text-base font-bold text-cyan-400 mb-1">⚡ Optimal Cross-Group Settlement Routing</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dijkstra's shortest-path algorithm finds the <strong>cheapest payment route</strong> between any two members
                  across all groups — minimizing transaction fees when settling debts that span multiple circles.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Controls */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="card p-5 space-y-4">
                    <h4 className="font-extrabold text-xs text-cyan-400 uppercase tracking-widest">⚙️ Router Parameters</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Source Payer</label>
                        <select className="input-dark text-xs py-2 bg-black/40" value={dijkstraSource}
                          onChange={e => { setDijkstraSource(Number(e.target.value)); setDijkstraPath([]); setDijkstraSteps([]); setDijkstraStepIdx(-1); }}>
                          {dNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Target Payee</label>
                        <select className="input-dark text-xs py-2 bg-black/40" value={dijkstraTarget}
                          onChange={e => { setDijkstraTarget(Number(e.target.value)); setDijkstraPath([]); setDijkstraSteps([]); setDijkstraStepIdx(-1); }}>
                          {dNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <button onClick={calculateDijkstra} disabled={dijkstraSource === dijkstraTarget}
                        className="btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50">
                        🚀 Find Cheapest Route
                      </button>
                    </div>
                  </div>

                  {dijkstraSteps.length > 0 && (
                    <div className="card p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">🎬 Simulation</h4>
                        <span className="text-[10px] text-cyan-400 font-mono">Step {dijkstraStepIdx + 1}/{dijkstraSteps.length}</span>
                      </div>
                      <div className="flex gap-2">
                        {[
                          ['◀', () => setDijkstraStepIdx(p => Math.max(0, p - 1)), dijkstraStepIdx <= 0],
                          [isPlayingDijkstra ? '⏸' : '▶', () => setIsPlayingDijkstra(!isPlayingDijkstra), false],
                          ['▶', () => setDijkstraStepIdx(p => Math.min(dijkstraSteps.length - 1, p + 1)), dijkstraStepIdx >= dijkstraSteps.length - 1],
                        ].map(([label, action, disabled], i) => (
                          <button key={i} onClick={action} disabled={disabled}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition disabled:opacity-40 ${i === 1 ? 'btn-primary' : 'btn-secondary'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-slate-300 leading-relaxed min-h-16">
                        {dijkstraSteps[dijkstraStepIdx]?.msg}
                      </div>
                    </div>
                  )}

                  {dijkstraPath.length > 0 && dijkstraStepIdx === dijkstraSteps.length - 1 && (() => {
                    const naive = buildGraphMatrix(dNodes, dEdges)[dijkstraSource]?.[dijkstraTarget] > 0
                      ? buildGraphMatrix(dNodes, dEdges)[dijkstraSource][dijkstraTarget] : 120;
                    const savings = naive - dijkstraCost;
                    return (
                      <div className="card bg-gradient-to-br from-cyan-950/20 to-slate-900 border-cyan-500/20 p-5 space-y-3">
                        <h4 className="font-bold text-xs text-cyan-400 uppercase tracking-wider">📊 Optimization Report</h4>
                        <div className="space-y-2 text-xs">
                          {[['Direct (Naive)', `₹${naive}`, 'text-red-400'],
                            ['Dijkstra Optimal', `₹${dijkstraCost}`, 'text-emerald-400'],
                            ['Hops Required', `${dijkstraPath.length - 1}`, 'text-cyan-400']].map(([label, val, color]) => (
                            <div key={label} className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-slate-400">{label}</span>
                              <span className={`font-bold font-mono ${color}`}>{val}</span>
                            </div>
                          ))}
                          <div className="p-2.5 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                            <p className="text-[9px] text-cyan-300 font-black uppercase mb-1">💰 Verdict</p>
                            <p className="text-[10px] text-slate-300">
                              Saved <strong className="text-cyan-400">₹{Math.max(0, savings)}</strong> ({savings > 0 ? Math.round((savings / naive) * 100) : 0}% reduction in fees)
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Visualizer */}
                <div className="lg:col-span-8 card p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white">Network Visualizer</h4>
                    {dijkstraPath.length > 0 && dijkstraStepIdx === dijkstraSteps.length - 1 && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        Optimal: ₹{dijkstraCost}
                      </span>
                    )}
                  </div>

                  <div className="relative border border-white/5 bg-slate-950/40 rounded-2xl overflow-hidden flex items-center justify-center py-4">
                    <svg width="420" height="420" viewBox="0 0 400 400" className="max-w-full">
                      <defs>
                        <filter id="glow-c"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <filter id="glow-o"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        <radialGradient id="nd" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" /></radialGradient>
                        <radialGradient id="ns" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" /><stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" /></radialGradient>
                        <radialGradient id="nt" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" /><stop offset="100%" stopColor="#be185d" stopOpacity="0.9" /></radialGradient>
                        <radialGradient id="nv" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#047857" stopOpacity="0.9" /></radialGradient>
                        <radialGradient id="nc" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" /><stop offset="100%" stopColor="#b45309" stopOpacity="0.9" /></radialGradient>
                      </defs>
                      {/* Edges */}
                      {dEdges.map((edge, idx) => {
                        const fn = dNodes[edge.from]; const tn = dNodes[edge.to];
                        if (!fn || !tn) return null;
                        let inPath = false;
                        if (dijkstraPath.length > 0 && dijkstraStepIdx === dijkstraSteps.length - 1) {
                          for (let k = 0; k < dijkstraPath.length - 1; k++) {
                            if ((dijkstraPath[k] === edge.from && dijkstraPath[k+1] === edge.to) ||
                                (dijkstraPath[k] === edge.to && dijkstraPath[k+1] === edge.from)) { inPath = true; break; }
                          }
                        }
                        const step = dijkstraSteps[dijkstraStepIdx];
                        const isActive = step && ((step.u === edge.from && step.v === edge.to) || (step.u === edge.to && step.v === edge.from));
                        return (
                          <g key={idx}>
                            {inPath && <line x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y} stroke="rgba(34,211,238,0.4)" strokeWidth="8" filter="url(#glow-c)" strokeLinecap="round" />}
                            {isActive && <line x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y} stroke="rgba(245,158,11,0.4)" strokeWidth="6" filter="url(#glow-o)" strokeLinecap="round" />}
                            <line x1={fn.x} y1={fn.y} x2={tn.x} y2={tn.y}
                              stroke={inPath ? '#22d3ee' : isActive ? '#f59e0b' : 'rgba(255,255,255,0.06)'}
                              strokeWidth={inPath ? 3 : isActive ? 2.5 : 1}
                              strokeDasharray={!inPath && !isActive ? '3 3' : undefined} />
                            <g transform={`translate(${(fn.x + tn.x) / 2},${(fn.y + tn.y) / 2})`}>
                              <rect x="-18" y="-8" width="36" height="16" fill="#0b1329" rx="5"
                                stroke={inPath ? '#22d3ee' : isActive ? '#f59e0b' : 'rgba(255,255,255,0.08)'} strokeWidth="1" />
                              <text x="0" y="4" fill={inPath ? '#22d3ee' : isActive ? '#f59e0b' : '#94a3b8'} fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                ₹{edge.fee}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                      {/* Nodes */}
                      {dNodes.map(node => {
                        const step = dijkstraSteps[dijkstraStepIdx];
                        const isV = step && step.visited[node.id];
                        const isC = step && step.u === node.id;
                        const isSrc = node.id === dijkstraSource;
                        const isDst = node.id === dijkstraTarget;
                        const inFP = dijkstraPath.length > 0 && dijkstraStepIdx === dijkstraSteps.length - 1 && dijkstraPath.includes(node.id);
                        let stroke = 'rgba(255,255,255,0.15)', fill = 'url(#nd)', sw = 1.5, gf = '';
                        if (isC) { stroke = '#f59e0b'; fill = 'url(#nc)'; sw = 2.5; gf = 'url(#glow-o)'; }
                        else if (isV) { stroke = '#10b981'; fill = 'url(#nv)'; }
                        if (isSrc) { stroke = '#3b82f6'; fill = 'url(#ns)'; sw = 3; }
                        else if (isDst) { stroke = '#ec4899'; fill = 'url(#nt)'; sw = 3; }
                        if (inFP) { gf = 'url(#glow-c)'; stroke = '#22d3ee'; }
                        return (
                          <g key={node.id} filter={gf}>
                            {(isSrc || isDst || isC) && (
                              <circle cx={node.x} cy={node.y} r="32" fill="none"
                                stroke={isSrc ? 'rgba(59,130,246,0.15)' : isDst ? 'rgba(236,72,153,0.15)' : 'rgba(245,158,11,0.15)'}
                                strokeWidth="4" className="animate-ping" style={{ animationDuration: '3s' }} />
                            )}
                            <circle cx={node.x} cy={node.y} r="24" fill={fill} stroke={stroke} strokeWidth={sw} />
                            <text x={node.x} y={node.y - 2} fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" className="select-none">
                              {node.name.length > 5 ? node.name.slice(0, 5) : node.name}
                            </text>
                            <text x={node.x} y={node.y + 10} fill={step && step.dist[node.id] !== Infinity ? '#22d3ee' : '#64748b'}
                              fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" className="select-none">
                              {step && step.dist[node.id] === Infinity ? '∞' : `₹${step ? step.dist[node.id] : 0}`}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Distance table */}
                  {dijkstraSteps.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] font-mono border-collapse">
                        <thead><tr className="bg-white/5 text-slate-400 border-b border-white/5">
                          <th className="p-2">Node</th><th className="p-2">Distance</th><th className="p-2">Status</th>
                        </tr></thead>
                        <tbody>
                          {dNodes.map(node => {
                            const step = dijkstraSteps[dijkstraStepIdx];
                            const isV = step && step.visited[node.id];
                            const isC = step && step.u === node.id;
                            return (
                              <tr key={node.id} className="border-b border-white/5">
                                <td className="p-2 font-bold text-slate-200">{node.name}{node.id === dijkstraSource ? ' (Src)' : node.id === dijkstraTarget ? ' (Dst)' : ''}</td>
                                <td className="p-2 text-cyan-400">{step && step.dist[node.id] === Infinity ? '∞' : `₹${step ? step.dist[node.id] : 0}`}</td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${isC ? 'bg-amber-500/20 text-amber-400' : isV ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                    {isC ? 'VISITING' : isV ? 'VISITED' : 'QUEUED'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <SectionGuide sectionId="/split" />
      </main>

      {/* ══════════ MODALS ══════════════════════════════════════ */}

      {/* Global Debts Summary Modal */}
      {showDebtsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">🔄 Simplified Debt Summary</h2>
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
              <h2 className="text-xl font-bold">Create Group</h2>
              <button onClick={() => { setShowCreate(false); setUpiInput(''); setUpiError(''); }} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Group Name *</label>
                <input className="input-dark" placeholder="College Trip, Mess Group..." value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {groupTypes.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value, emoji: t.emoji })}
                      className={`py-2 rounded-xl border text-xl transition ${form.type === t.value ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                      title={t.label}>{t.emoji}</button>
                  ))}
                </div>
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
              <h2 className="text-xl font-bold">Join Group</h2>
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