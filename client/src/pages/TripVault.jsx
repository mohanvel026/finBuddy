// client/src/pages/TripVault.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SectionGuide from '../components/common/SectionGuide';
/* import Sidebar removed */
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#7C3AED', '#A78BFA', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const TripVault = () => {
  const { groupId } = useParams();
  const [trip, setTrip] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [convertForm, setConvertForm] = useState({ amount: '', currency: 'USD' });
  const [convertedINR, setConvertedINR] = useState(null);
  const [editForm, setEditForm] = useState({
    destination: '', startDate: '', endDate: '', totalBudget: '', currency: 'INR'
  });

  useEffect(() => {
    loadTrip();
    loadCurrencies();
  }, [groupId]);

  const loadTrip = async () => {
    try {
      const { data } = await api.get(`/trips/${groupId}`);
      setTrip(data.trip);
      const td = data.trip.tripDetails || {};
      setEditForm({
        destination: td.destination || '',
        startDate: td.startDate ? td.startDate.split('T')[0] : '',
        endDate: td.endDate ? td.endDate.split('T')[0] : '',
        totalBudget: td.totalBudget || '',
        currency: td.currency || 'INR'
      });
    } catch (e) { toast.error('Failed to load trip'); }
    setLoading(false);
  };

  const loadCurrencies = async () => {
    try {
      const { data } = await api.get('/trips/currencies/list');
      setCurrencies(data.currencies || []);
    } catch (e) { }
  };

  const saveTrip = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trips/${groupId}`, editForm);
      toast.success('Trip details saved!');
      setShowEdit(false);
      loadTrip();
    } catch (e) { toast.error('Failed to save'); }
  };

  const convertCurrency = async () => {
    if (!convertForm.amount) return;
    try {
      const { data } = await api.post('/trips/convert', {
        amount: parseFloat(convertForm.amount),
        fromCurrency: convertForm.currency
      });
      setConvertedINR(data.amountINR);
    } catch (e) { toast.error('Conversion failed'); }
  };

  if (loading) return (
    <main className="lg:pl-72 flex-1 min-h-full flex items-center justify-center pt-16 lg:pt-0">
      <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </main>
  );

  const stats = trip?.stats || {};
  const pieData = trip?.byCategory
    ? Object.entries(trip.byCategory).map(([name, value]) => ({ name, value }))
    : [];
  const barData = trip?.byDay
    ? Object.entries(trip.byDay).map(([day, amount]) => ({ day, amount }))
    : [];

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={`/split/group/${groupId}`} className="text-slate-400 hover:text-white">← Back</Link>
            <div>
              <h1 className="text-3xl font-bold">✈️ Trip Vault</h1>
              <p className="text-slate-400 text-sm">
                {trip?.tripDetails?.destination || 'Set destination'} •
                {stats.daysLeft != null ? ` ${stats.daysLeft} days left` : ' No end date set'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to={`/split/photos/${groupId}`}>
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 20px' }}>
                📸 Photo Vault
              </button>
            </Link>
            <button onClick={() => setShowEdit(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
              ✏️ Edit Trip
            </button>
          </div>
        </div>


        {/* Budget Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-slate-400 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-cyan-400">
              ₹{(stats.budget || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Total Spent</p>
            <p className={`text-2xl font-bold ${stats.isOverBudget ? 'text-red-400' : 'text-white'}`}>
              ₹{(stats.totalSpentINR || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className={`card ${stats.isOverBudget ? 'border-red-500/30' : 'border-green-500/20'}`}>
            <p className="text-slate-400 text-sm">Remaining</p>
            <p className={`text-2xl font-bold ${stats.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
              {stats.isOverBudget ? '-' : ''}₹{Math.abs(stats.remaining || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="card">
            <p className="text-slate-400 text-sm">Per Person</p>
            <p className="text-2xl font-bold">₹{(stats.perPersonSpent || 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Budget progress bar */}
        {stats.budget > 0 && (
          <div className="card mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Budget used</span>
              <span className={stats.budgetUsedPercent > 90 ? 'text-red-400' : 'text-cyan-400'}>
                {stats.budgetUsedPercent}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  stats.budgetUsedPercent > 90 ? 'bg-red-400' :
                  stats.budgetUsedPercent > 70 ? 'bg-yellow-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(stats.budgetUsedPercent, 100)}%` }}
              />
            </div>
            {stats.isOverBudget && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ Over budget by ₹{Math.abs(stats.remaining).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Category pie */}
          {pieData.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">Spending by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toFixed(0)}`} contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily spending bar */}
          {barData.length > 0 && (
            <div className="card">
              <h3 className="font-bold mb-4">Daily Spending</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="day" tick={{ fill: '#6366F1', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6366F1', fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v.toFixed(0)}`} contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }}  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                  <Bar dataKey="amount" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Currency Converter */}
        <div className="card mb-8">
          <h3 className="font-bold mb-4">💱 Currency Converter</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-32">
              <label className="text-sm text-slate-400 mb-1 block">Amount</label>
              <input
                type="number"
                className="input-dark"
                placeholder="100"
                value={convertForm.amount}
                onChange={e => setConvertForm({ ...convertForm, amount: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-sm text-slate-400 mb-1 block">From Currency</label>
              <select
                className="input-dark"
                value={convertForm.currency}
                onChange={e => setConvertForm({ ...convertForm, currency: e.target.value })}
              >
                {currencies.filter(c => c.code !== 'INR').map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <button onClick={convertCurrency} className="btn-primary" style={{ width: 'auto', padding: '12px 20px' }}>
              Convert
            </button>
            {convertedINR !== null && (
              <div className="card border-cyan-500/20 text-center px-6">
                <p className="text-sm text-slate-400">= Indian Rupees</p>
                <p className="text-xl font-bold text-cyan-400">₹{convertedINR.toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>

          {/* Exchange rates table */}
          {currencies.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {currencies.filter(c => c.code !== 'INR').map(c => (
                <div key={c.code} className="text-center p-2 bg-white/5 rounded-lg">
                  <p className="text-xs text-slate-400">{c.code}</p>
                  <p className="text-sm font-bold text-cyan-400">₹{c.rateToINR}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses list */}
        <div>
          <h3 className="font-bold mb-4">All Trip Expenses</h3>
          <div className="space-y-3">
            {trip?.expenses?.map(exp => (
              <div key={exp._id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {exp.category === 'food' ? '🍕' : exp.category === 'transport' ? '🚗' :
                     exp.category === 'accommodation' ? '🏨' : exp.category === 'entertainment' ? '🎮' : '💰'}
                  </span>
                  <div>
                    <p className="font-medium">{exp.description}</p>
                    <p className="text-sm text-slate-400">
                      {exp.paidBy?.name} • {new Date(exp.date).toLocaleDateString('en-IN')}
                      {exp.currency !== 'INR' && ` • ${exp.currency} ${exp.amount}`}
                    </p>
                  </div>
                </div>
                <p className="font-bold">₹{(exp.amountINR || exp.amount).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Trip Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Edit Trip Details</h2>
                <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <form onSubmit={saveTrip} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Destination</label>
                  <input className="input-dark" placeholder="Goa, Thailand, Ooty..." value={editForm.destination} onChange={e => setEditForm({ ...editForm, destination: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Start Date</label>
                    <input type="date" className="input-dark" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">End Date</label>
                    <input type="date" className="input-dark" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Total Budget (₹)</label>
                  <input type="number" className="input-dark" placeholder="20000" value={editForm.totalBudget} onChange={e => setEditForm({ ...editForm, totalBudget: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Save Trip ✈️</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <SectionGuide sectionId="/split/trip/:groupId" />
      </main>
    
    </div>
  );
};

export default TripVault;