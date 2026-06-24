import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MESSAGES = [
  'Authenticating your identity…',
  'Loading your portfolio…',
  'Syncing market data…',
  'Preparing your dashboard…',
];

const GoogleAuthSuccess = () => {
  const [searchParams]         = useSearchParams();
  const { handleGoogleSuccess } = useAuth();
  const navigate               = useNavigate();
  const [msgIdx, setMsgIdx]    = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleGoogleSuccess(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => navigate('/dashboard'), 1800);
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 40% 50%, rgba(124,58,237,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.12) 0%, transparent 55%), #08080F',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes spin-ring {
          to { transform: rotate(360deg); }
        }
        @keyframes fade-msg {
          0%, 100% { opacity: 0; transform: translateY(6px); }
          20%, 80%  { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-logo {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .msg-anim { animation: fade-msg 0.8s ease-in-out; }
        .logo-pulse { animation: scale-logo 2s ease-in-out infinite; }
      `}</style>

      <div className="text-center space-y-8 px-6">
        {/* Animated logo */}
        <div className="relative inline-block logo-pulse">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto relative z-10"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5)'
            }}
          >
            💰
          </div>
          {/* Ring */}
          <div
            className="absolute -inset-3 rounded-[28px] border-2 border-transparent"
            style={{
              borderTopColor: '#7C3AED',
              borderRightColor: 'rgba(124,58,237,0.3)',
              animation: 'spin-ring 1.2s linear infinite'
            }}
          />
        </div>

        {/* Brand */}
        <div>
          <p
            className="text-3xl font-black"
            style={{
              background: 'linear-gradient(135deg, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            FinBuddy
          </p>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-1">
            India's Smartest Finance App
          </p>
        </div>

        {/* Animated message */}
        <div className="h-6">
          <p key={msgIdx} className="msg-anim text-sm text-slate-400 font-medium">
            {MESSAGES[msgIdx]}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === msgIdx % 4 ? 24 : 8,
                height: 8,
                background: i === msgIdx % 4
                  ? 'linear-gradient(90deg, #7C3AED, #EC4899)'
                  : 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                transition: 'all 0.4s cubic-bezier(.22,1,.36,1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthSuccess;
