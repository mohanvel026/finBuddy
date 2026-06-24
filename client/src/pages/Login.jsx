import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Animated Particle ─────────────────────────────────────── */
const Particle = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      background: 'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)',
      animation: 'float-particle linear infinite',
      ...style
    }}
  />
);

/* ─── Stats Strip ────────────────────────────────────────────── */
const STATS = [
  { value: '₹2.4Cr+', label: 'Tracked Daily' },
  { value: '18K+',    label: 'Students' },
  { value: '4.9★',    label: 'App Rating' },
  { value: '100%',    label: 'Data Secure' },
];

const Login = () => {
  const [form, setForm]               = useState({ email: '', password: '' });
  const [otp, setOtp]                 = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId2FA, setUserId2FA]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [focused, setFocused]         = useState(null);
  const { login, verify2FA }          = useAuth();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const from                          = location.state?.from?.pathname || '/dashboard';

  /* OTP digit refs */
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  const handleOtpInput = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[i] = val;
    setOtpDigits(next);
    setOtp(next.join(''));
    if (val && i < 5) otpRefs[i + 1].current?.focus();
    if (!val && i > 0) otpRefs[i - 1].current?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  };

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.requires2FA) {
        setRequires2FA(true);
        setUserId2FA(result.userId);
        toast.success('OTP sent to your email!');
        setTimeout(() => otpRefs[0].current?.focus(), 300);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── 2FA ── */
  const handle2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verify2FA(userId2FA, otp);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtpDigits(['', '', '', '', '', '']);
      setOtp('');
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* ── Google (sandbox / real) ── */
  const handleGoogleLogin = () => {
    const isMock = !import.meta.env.VITE_GOOGLE_CLIENT_ID ||
                   import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('dummy');
    if (isMock) {
      toast.success('Sandbox Mode: Simulated Google Auth…', { icon: '🔑', duration: 2500 });
      setTimeout(() => { window.location.href = '/api/auth/google/mock'; }, 900);
    } else {
      window.location.href = '/api/auth/google';
    }
  };

  /* ── Particles ── */
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 4 + (i % 5) * 6,
    left: `${(i * 37 + 11) % 98}%`,
    top: `${(i * 53 + 7) % 95}%`,
    duration: `${12 + (i % 8) * 3}s`,
    delay: `${-(i * 1.4)}s`,
  }));

  return (
    <div
      id="login-page"
      className="min-h-screen flex"
      style={{ background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Style injection ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes float-particle {
          0%   { transform: translateY(0px) scale(1);   opacity: 0;   }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-120vh) scale(0.4); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
        }
        .login-card { animation: slide-up 0.55s cubic-bezier(.22,1,.36,1) both; }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px 16px;
          color: #F8FAFC;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .input-field:focus {
          border-color: rgba(124,58,237,0.7);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .input-field::placeholder { color: rgba(148,163,184,0.45); }
        .btn-violet {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #7C3AED 0%, #9333ea 50%, #EC4899 100%);
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          position: relative;
          overflow: hidden;
          transition: transform .15s, box-shadow .15s, opacity .15s;
          letter-spacing: 0.3px;
        }
        .btn-violet:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(124,58,237,0.45);
        }
        .btn-violet:active:not(:disabled) { transform: translateY(0); }
        .btn-violet:disabled { opacity: .6; cursor: not-allowed; }
        .btn-violet::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 400px;
          animation: shimmer 2.5s infinite;
        }
        .stat-item {
          text-align: center;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(124,58,237,0.07);
          border: 1px solid rgba(124,58,237,0.15);
          transition: background .2s;
        }
        .stat-item:hover { background: rgba(124,58,237,0.13); }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          color: #E2E8F0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          letter-spacing: 0.2px;
        }
        .google-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }
        .otp-box {
          width: 48px;
          height: 56px;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #F8FAFC;
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: all .2s;
          caret-color: #7C3AED;
        }
        .otp-box:focus {
          border-color: #7C3AED;
          background: rgba(124,58,237,0.08);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15), 0 0 20px rgba(124,58,237,0.2);
          animation: pulse-ring 1.5s infinite;
        }
        .otp-box.filled {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.07);
          color: #A78BFA;
        }
        .left-panel-bg {
          background: radial-gradient(ellipse at 30% 60%, rgba(124,58,237,0.25) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.18) 0%, transparent 55%),
                      linear-gradient(135deg, #08080F 0%, #0E0D18 50%, #12111A 100%);
        }
      `}</style>

      {/* ── LEFT PANEL (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden left-panel-bg p-12"
      >
        {/* Background particles */}
        {particles.map(p => (
          <Particle key={p.id} style={{
            width: p.size, height: p.size,
            left: p.left, top: p.top,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }} />
        ))}

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[100px]"
          style={{ background: 'rgba(124,58,237,0.18)', animation: 'float-particle 20s ease-in-out infinite alternate' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px]"
          style={{ background: 'rgba(236,72,153,0.14)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              💰
            </div>
            <span className="text-2xl font-black" style={{
              background: 'linear-gradient(135deg, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>FinBuddy</span>
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7C3AED' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
                India's Smartest Finance App
              </span>
            </div>
            <h2 className="text-5xl font-black leading-tight text-white">
              Your money,<br />
              <span style={{
                background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #22D3EE 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>finally smart.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Trade stocks, split bills, track goals, battle friends — all with AI-powered intelligence built for Indian students.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: '📈', text: 'Live stock trading with ₹1L virtual wallet' },
              { icon: '💸', text: 'Smart bill splitting with UPI settlement' },
              { icon: '🤖', text: 'AI financial mentor available 24/7' },
              { icon: '⚔️', text: 'Battle friends in stock market duels' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  {f.icon}
                </div>
                <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                  {f.text}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <p className="text-lg font-black" style={{
                  background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>{s.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-slate-400 text-sm italic leading-relaxed">
            "The best investment you can make is in yourself — start with your money habits."
          </p>
          <p className="text-xs text-purple-400 font-bold mt-2">— FinBuddy AI Mentor</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden"
        style={{ background: '#0A0912' }}>

        {/* Subtle right-panel glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.08)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(236,72,153,0.06)' }} />

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              💰
            </div>
            <span className="text-2xl font-black" style={{
              background: 'linear-gradient(135deg, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>FinBuddy</span>
          </Link>
        </div>

        <div className="login-card w-full max-w-[420px] relative z-10">
          {!requires2FA ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white">Welcome back 👋</h1>
                <p className="text-slate-400 mt-1.5 text-sm">
                  Log in to your financial command center
                </p>
              </div>

              {/* Google */}
              <button id="google-login-btn" onClick={handleGoogleLogin} className="google-btn mb-5">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">or email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <form onSubmit={handleLogin} className="space-y-4" id="login-form">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="input-field"
                    placeholder="you@college.edu"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      className="input-field pr-12"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button id="login-submit-btn" type="submit" className="btn-violet mt-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Logging in...
                    </span>
                  ) : 'Log In →'}
                </button>
              </form>

              {/* Bottom links */}
              <div className="mt-6 pt-5 border-t flex flex-col items-center gap-3"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm text-slate-500">
                  No account yet?{' '}
                  <Link to="/register" className="font-bold"
                    style={{ color: '#A78BFA' }}>
                    Create free account
                  </Link>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>🔒</span>
                  <span>256-bit encrypted · Zero data sold</span>
                </div>
              </div>
            </>
          ) : (
            /* ── 2FA Panel ── */
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))', border: '1px solid rgba(124,58,237,0.4)' }}>
                🔐
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Two-Factor Auth</h2>
              <p className="text-slate-400 text-sm mb-8">
                Enter the 6-digit OTP sent to your email
              </p>

              <form onSubmit={handle2FA} id="otp-form">
                <div className="flex items-center justify-center gap-3 mb-8">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`otp-digit-${i}`}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`otp-box${d ? ' filled' : ''}`}
                    />
                  ))}
                </div>

                <button type="submit" className="btn-violet" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : 'Verify & Enter 🚀'}
                </button>

                <button
                  type="button"
                  onClick={() => { setRequires2FA(false); setOtpDigits(['','','','','','']); setOtp(''); }}
                  className="mt-3 w-full py-3 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  ← Back to Login
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;