import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#00d4ff', '#7C3AED', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon, label, value, sub, color = 'cyan', trend }) => (
  <div className={`p-5 rounded-2xl bg-white/3 border border-white/6 hover:border-white/10 transition-all duration-300 group`}>
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      {trend !== undefined && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className={`text-2xl font-black mb-1 ${
      color === 'cyan' ? 'text-cyan-400' :
      color === 'purple' ? 'text-violet-400' :
      color === 'green' ? 'text-emerald-400' :
      color === 'amber' ? 'text-amber-400' :
      color === 'pink' ? 'text-pink-400' : 'text-white'
    }`}>{value}</p>
    <p className="text-xs text-slate-400 font-semibold">{label}</p>
    {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? p.value.toLocaleString('en-IN') : p.value}
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('dau'); // 'dau' | 'signups'

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      if (data.success) setStats(data);
    } catch (e) {
      console.error('Admin stats failed:', e.message);
    }
    setLoading(false);
  };

  const fmt = (n) => {
    if (!n && n !== 0) return '—';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return n.toLocaleString('en-IN');
    return n.toString();
  };

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-8 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                🔐 Admin Only
              </span>
              <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-0.5 rounded-full font-bold">
                ● Live
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">📊 Analytics Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Platform health, user metrics, and trade intelligence</p>
          </div>
          <button
            onClick={loadStats}
            className="btn-secondary"
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            🔄 Refresh Data
          </button>
        </div>


        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Aggregating platform metrics...</p>
          </div>
        ) : !stats ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-slate-300 font-bold">Failed to load analytics</p>
            <p className="text-slate-500 text-sm mt-1">Make sure you have admin access</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Row 1: Core KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <StatCard icon="👥" label="Total Users" value={stats.overview.totalUsers.toLocaleString()} sub="All time registrations" color="cyan" />
              <StatCard icon="🟢" label="Active Today" value={stats.overview.activeToday} sub="Last 24 hours" color="green" trend={stats.overview.activeToday > 0 ? 12 : -5} />
              <StatCard icon="📈" label="Total Trades" value={stats.overview.totalTrades.toLocaleString()} sub="Virtual executions" color="purple" />
              <StatCard icon="💰" label="Trade Volume" value={fmt(stats.overview.totalTradeVolume)} sub="Virtual ₹ transacted" color="amber" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="👤" label="New This Week" value={stats.overview.newUsersThisWeek} sub="7-day signups" color="pink" />
              <StatCard icon="🗓️" label="New This Month" value={stats.overview.newUsersThisMonth} sub="30-day signups" color="cyan" />
              <StatCard icon="🏆" label="Avg FinScore" value={stats.overview.avgFinScore} sub={`Max: ${stats.overview.maxFinScore}`} color="amber" />
              <StatCard icon="👥" label="Groups Created" value={stats.overview.totalGroups} sub="SplitSmart groups" color="green" />
            </div>

            {/* ── Row 2: DAU Chart + Signup Trend ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white">
                      {activeChart === 'dau' ? '📅 Daily Active Users (Last 30 Days)' : '📈 New Signups (Last 30 Days)'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Platform engagement over time</p>
                  </div>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 text-[10px]">
                    {[['dau', 'DAU'], ['signups', 'Signups']].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActiveChart(key)}
                        className={`px-3 py-1 rounded-lg font-bold transition ${activeChart === key ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeChart === 'dau' ? stats.charts.dau : stats.charts.signups}>
                      <defs>
                        <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#475569', fontSize: 9 }}
                        tickLine={false}
                        tickFormatter={v => v?.slice(5) || ''}
                        interval={4}
                      />
                      <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                      <Area
                        type="monotone"
                        dataKey={activeChart === 'dau' ? 'users' : 'signups'}
                        name={activeChart === 'dau' ? 'Active Users' : 'Signups'}
                        stroke="#00d4ff"
                        strokeWidth={2}
                        fill="url(#adminGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {(activeChart === 'dau' ? stats.charts.dau : stats.charts.signups).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-500 text-sm">No activity data yet — users need lastActiveDate populated</p>
                  </div>
                )}
              </div>

              {/* Trade Type Pie */}
              <div className="card p-5">
                <h3 className="font-bold text-white mb-1">🔁 Trade Split</h3>
                <p className="text-xs text-slate-400 mb-4">BUY vs SELL distribution</p>
                {stats.charts.tradeTypes.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.charts.tradeTypes}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {stats.charts.tradeTypes.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.type === 'BUY' ? '#10b981' : '#ef4444'}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(v) => <span className="text-[10px] text-slate-400">{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center">
                    <p className="text-slate-500 text-xs text-center">No trade data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 3: Top Stocks + Expense Categories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Stocks Bar Chart */}
              <div className="card p-5">
                <h3 className="font-bold text-white mb-1">📊 Most Traded Stocks</h3>
                <p className="text-xs text-slate-400 mb-4">By number of virtual trades executed</p>
                {stats.charts.topStocks.length > 0 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.charts.topStocks} layout="vertical">
                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="symbol"
                          tick={{ fill: '#94a3b8', fontSize: 9 }}
                          tickLine={false}
                          width={75}
                          tickFormatter={v => v?.replace('.NS', '').replace('.BO', '') || v}
                        />
                        <Tooltip content={<CustomTooltip />}  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="trades" name="Trades" radius={[0, 4, 4, 0]}>
                          {stats.charts.topStocks.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center">
                    <p className="text-slate-500 text-xs">No trade data yet</p>
                  </div>
                )}
              </div>

              {/* Expense Categories */}
              <div className="card p-5">
                <h3 className="font-bold text-white mb-1">🏷️ Expense Categories</h3>
                <p className="text-xs text-slate-400 mb-4">Total amounts by category across all groups</p>
                {stats.charts.expenseCategories.length > 0 ? (
                  <div className="space-y-2.5 mt-2">
                    {stats.charts.expenseCategories.map((cat, i) => {
                      const maxTotal = stats.charts.expenseCategories[0]?.total || 1;
                      const pct = (cat.total / maxTotal) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 w-24 shrink-0 truncate font-medium">{cat.category}</span>
                          <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                            />
                          </div>
                          <span className="text-[10px] font-bold shrink-0" style={{ color: COLORS[i % COLORS.length] }}>
                            ₹{cat.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center">
                    <p className="text-slate-500 text-xs">No expense data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 4: Top Traders Leaderboard ── */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-1">🏆 Power Traders Leaderboard</h3>
              <p className="text-xs text-slate-400 mb-5">Top 5 most active users by trade count</p>
              {stats.topTraders.length > 0 ? (
                <div className="space-y-3">
                  {stats.topTraders.map((trader, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/8 transition">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                        i === 1 ? 'bg-slate-400/20 text-slate-300' :
                        i === 2 ? 'bg-orange-700/20 text-orange-400' :
                        'bg-white/5 text-slate-400'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                        {trader.avatar ? (
                          <img src={trader.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                        ) : (
                          trader.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{trader.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{trader.email}</p>
                      </div>
                      <div className="flex gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-xs font-black text-cyan-400">{trader.tradeCount}</p>
                          <p className="text-[9px] text-slate-500">Trades</p>
                        </div>
                        <div>
                          <p className={`text-xs font-black ${trader.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trader.totalPnL >= 0 ? '+' : ''}₹{trader.totalPnL.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[9px] text-slate-500">P&L</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-violet-400">{trader.finScore}</p>
                          <p className="text-[9px] text-slate-500">FinScore</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-8">No trade activity yet</p>
              )}
            </div>

            {/* ── Footer Note ── */}
            <div className="flex items-center gap-2 text-[10px] text-slate-600 py-2">
              <span>📌</span>
              <span>Data reflects live MongoDB aggregations. DAU tracking requires <code className="text-slate-500">lastActiveDate</code> to be set on user login.</span>
            </div>
          </div>
        )}
        <SectionGuide sectionId="/admin" />
      </main>
    
    </div>
  );
};

export default AdminDashboard;
