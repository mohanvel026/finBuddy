// client/src/components/common/NotificationBell.jsx
// Upgraded: Uses real price alerts from /api/watchlist/alerts/active + in-app activity feed
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [permStatus, setPermStatus] = useState('default'); // 'granted' | 'denied' | 'default'
  const panelRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    setPermStatus(Notification?.permission || 'default');
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const loadNotifications = async () => {
    try {
      const [notifRes, alertRes] = await Promise.allSettled([
        api.get('/notifications'),
        api.get('/watchlist/alerts/active'),
      ]);

      const inApp = notifRes.status === 'fulfilled'
        ? (notifRes.value.data.notifications || []).slice(0, 6).map(n => ({
            ...n,
            category: 'activity',
          }))
        : [];

      const activeAlerts = alertRes.status === 'fulfilled'
        ? (alertRes.value.data.alerts || []).slice(0, 4).map(a => ({
            id: a._id || `alert-${a.symbol}-${a.type}`,
            type: 'alert',
            category: 'alert',
            title: `🔔 Alert: ${a.symbol}`,
            body: `Watching for price ${a.type === 'above' ? '↑ above' : '↓ below'} ₹${a.price.toLocaleString('en-IN')}`,
            time: new Date(),
            read: false,
          }))
        : [];

      const combined = [...activeAlerts, ...inApp];
      setNotifications(combined);
      setAlertCount(activeAlerts.length + inApp.filter(n => !n.read).length);
    } catch (e) {
      // silent fail
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermStatus(result);
      if (result === 'granted') {
        toast.success('🔔 Push notifications enabled!');
        // Register service worker push subscription
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          toast.success('Service worker ready for push alerts ✅');
        }
      } else {
        toast.error('Notifications blocked — please enable in browser settings');
      }
    } catch (e) {
      toast.error('Could not request permission');
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setAlertCount(0);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-xl hover:bg-white/5 transition text-slate-400 hover:text-white cursor-pointer"
        title="Notifications"
        id="notification-bell-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute top-12 right-0 w-80 bg-[var(--bg-secondary)] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadNotifications}
                className="text-[10px] text-slate-400 hover:text-white transition"
                title="Refresh"
              >
                ↻
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition font-bold"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Push Permission Banner */}
          {permStatus !== 'granted' && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-amber-500/15 flex items-center gap-3">
              <span className="text-lg">🔔</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-400">Enable Push Alerts</p>
                <p className="text-[10px] text-slate-400">Get notified when your price targets hit</p>
              </div>
              <button
                onClick={requestPermission}
                className="text-[10px] font-black text-white bg-amber-500/80 hover:bg-amber-500 px-2.5 py-1 rounded-lg transition shrink-0"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔕</div>
                <p className="text-slate-500 text-xs">No notifications yet</p>
                <p className="text-slate-600 text-[10px] mt-1">Set price alerts in TradeArena to get started</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n.id || i}
                  className={`px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition ${!n.read ? 'bg-cyan-500/3' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Category indicator */}
                    <div className={`mt-0.5 shrink-0 ${n.category === 'alert' ? 'text-amber-400' : n.type === 'trade' ? 'text-purple-400' : 'text-slate-400'}`}>
                      {n.category === 'alert' ? '🔔' : n.type === 'trade' ? '📈' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-bold text-white truncate">{n.title}</p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        {new Date(n.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
            <a href="/trade" className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition">
              → Manage Alerts
            </a>
            <span className="text-[10px] text-slate-600">
              {permStatus === 'granted' ? '🟢 Push enabled' : '⚪ Push off'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
