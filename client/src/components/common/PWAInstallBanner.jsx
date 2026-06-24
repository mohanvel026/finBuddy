// client/src/components/common/PWAInstallBanner.jsx
// Shows "Install FinBuddy as App" prompt when browser fires beforeinstallprompt
import { useState, useEffect } from 'react';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (dismissed) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return; // iOS

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 5 seconds of use
      setTimeout(() => setShow(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setDeferredPrompt(null);
      }
    } catch (e) {
      // ignore
    }
    setInstalling(false);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (!show || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-slide-up"
      style={{ animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      id="pwa-install-banner"
    >
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(99,102,241,0.1))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.2)',
          maxWidth: '340px'
        }}
      >
        {/* App Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #06B6D4, #4F46E5)' }}
        >
          💰
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-white leading-tight">Install FinBuddy</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            Add to Home Screen for faster access & offline support
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-white transition hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #4F46E5)' }}
          >
            {installing ? '...' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-300 transition"
          >
            Not now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallBanner;
