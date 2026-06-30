import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Floating orb ─────────────────────────────────────────────── */
const Orb = ({ style }) => (
  <div className="fb-orb absolute rounded-full pointer-events-none" style={style} />
);

/* ─── Stats ─────────────────────────────────────────────────────── */
const STATS = [
  { value: '₹2.4Cr+', label: 'Tracked Daily', icon: '📊' },
  { value: '18K+',    label: 'Students',       icon: '🎓' },
  { value: '4.9★',    label: 'App Rating',     icon: '⭐' },
  { value: '100%',    label: 'Data Secure',    icon: '🔒' },
];

const FEATURES = [
  { icon: '📈', text: 'Live stock trading with ₹1L virtual wallet', color: '#34D399' },
  { icon: '💸', text: 'Smart bill splitting with UPI settlement',   color: '#60A5FA' },
  { icon: '🤖', text: 'AI financial mentor available 24/7',         color: '#A78BFA' },
  { icon: '⚔️', text: 'Battle friends in stock market duels',       color: '#F472B6' },
];

const Login = () => {
  const [form, setForm]               = useState({ email: '', password: '' });
  const [otp, setOtp]                 = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId2FA, setUserId2FA]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [focused, setFocused]         = useState(null);
  const [mounted, setMounted]         = useState(false);
  const { login, verify2FA }          = useAuth();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const from                          = location.state?.from?.pathname || '/dashboard';

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  /* OTP digit refs */
  const otpRefs   = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
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
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

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

  return (
    <div id="login-page" style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#06050F' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        /* ── Animations ── */
        @keyframes fb-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-18px) rotate(1deg); }
          66%  { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes fb-aurora {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes fb-slide-up {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fb-slide-left {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fb-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes fb-pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0); }
        }
        @keyframes fb-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fb-particle {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes fb-badge-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(139,92,246,0.2); }
          50%       { box-shadow: 0 0 16px rgba(139,92,246,0.5); }
        }
        @keyframes fb-counter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .fb-orb { filter: blur(80px); animation: fb-float linear infinite; }

        /* ── Left panel ── */
        .fb-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 52%;
          padding: 48px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse at 25% 55%, rgba(109,40,217,0.28) 0%, transparent 58%),
                      radial-gradient(ellipse at 80% 15%, rgba(236,72,153,0.2) 0%, transparent 52%),
                      radial-gradient(ellipse at 60% 85%, rgba(6,182,212,0.1) 0%, transparent 45%),
                      linear-gradient(135deg, #07060F 0%, #0D0B1A 55%, #100E1C 100%);
        }
        @media (min-width: 1024px) { .fb-left { display: flex; } }

        .fb-grid-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .fb-aurora {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          animation: fb-aurora 25s linear infinite;
          pointer-events: none;
          opacity: 0.12;
          background: conic-gradient(from 0deg, #7C3AED, #EC4899, #06B6D4, #7C3AED);
          top: 50%; left: 50%;
          transform-origin: center;
          margin-top: -300px; margin-left: -300px;
        }

        .fb-particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.7) 0%, transparent 70%);
          pointer-events: none;
          animation: fb-particle linear infinite;
        }

        .fb-feature-item {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s ease;
          cursor: default;
        }
        .fb-feature-item:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.25);
          transform: translateX(4px);
        }

        .fb-stat {
          text-align: center;
          padding: 14px 10px;
          border-radius: 16px;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.12);
          transition: all 0.25s;
          animation: fb-badge-glow 3s ease-in-out infinite;
        }
        .fb-stat:hover {
          background: rgba(139,92,246,0.14);
          border-color: rgba(139,92,246,0.3);
          transform: translateY(-2px);
        }

        /* ── Right panel ── */
        .fb-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #07060F 0%, #0B0918 100%);
        }

        .fb-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
          padding: 40px 36px;
          border-radius: 28px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.06) inset;
        }
        @media (max-width: 480px) { .fb-card { padding: 28px 20px; border-radius: 20px; } }

        /* ── Inputs ── */
        .fb-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(148,163,184,0.7);
          margin-bottom: 8px;
        }
        .fb-input-wrap { position: relative; }
        .fb-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          color: #F1F5F9;
          font-size: 14.5px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .fb-input:focus {
          border-color: rgba(139,92,246,0.65);
          background: rgba(139,92,246,0.07);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15), 0 2px 12px rgba(139,92,246,0.08);
          animation: fb-pulse-border 2s infinite;
        }
        .fb-input::placeholder { color: rgba(100,116,139,0.6); font-weight: 400; }

        /* Fix browser autofill white background */
        .fb-input:-webkit-autofill,
        .fb-input:-webkit-autofill:hover,
        .fb-input:-webkit-autofill:focus,
        .fb-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0F0D1C inset !important;
          -webkit-text-fill-color: #F1F5F9 !important;
          background-color: #0F0D1C !important;
          border-color: rgba(139,92,246,0.4) !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        /* ── Buttons ── */
        .fb-btn-primary {
          width: 100%;
          padding: 15px 24px;
          background: linear-gradient(135deg, #7C3AED 0%, #9333EA 45%, #EC4899 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
        }
        .fb-btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          background-size: 600px;
          animation: fb-shimmer 2.8s infinite;
        }
        .fb-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,58,237,0.5);
        }
        .fb-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .fb-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .fb-btn-google {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          padding: 13px 20px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #CBD5E1;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.2px;
        }
        .fb-btn-google:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }

        .fb-btn-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(100,116,139,0.7); padding: 4px; font-size: 16px;
          transition: color 0.2s; line-height: 1;
        }
        .fb-btn-eye:hover { color: #A78BFA; }

        .fb-btn-back {
          width: 100%; padding: 12px 20px; margin-top: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: rgba(100,116,139,0.8);
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .fb-btn-back:hover { color: #E2E8F0; background: rgba(255,255,255,0.07); }

        /* ── Divider ── */
        .fb-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 18px 0;
        }
        .fb-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .fb-divider-text { font-size: 11px; color: rgba(71,85,105,0.9); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── OTP ── */
        .fb-otp-box {
          width: 48px; height: 58px;
          background: rgba(255,255,255,0.04);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #F1F5F9;
          font-size: 22px; font-weight: 700;
          text-align: center; font-family: 'Inter', sans-serif;
          outline: none; transition: all 0.2s; caret-color: #8B5CF6;
        }
        .fb-otp-box:focus {
          border-color: #8B5CF6;
          background: rgba(139,92,246,0.09);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.2), 0 0 24px rgba(139,92,246,0.15);
        }
        .fb-otp-box.filled { border-color: rgba(139,92,246,0.55); background: rgba(139,92,246,0.08); color: #C4B5FD; }

        /* ── Logo badge ── */
        .fb-logo-icon {
          width: 42px; height: 42px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          box-shadow: 0 4px 16px rgba(124,58,237,0.4);
        }
        .fb-logo-text {
          font-size: 24px; font-weight: 900; letter-spacing: -0.5px;
          background: linear-gradient(135deg, #A78BFA, #F472B6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .fb-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.28);
          margin-bottom: 20px;
        }

        /* ── Card slide-up ── */
        .fb-animate-card { animation: fb-slide-up 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .fb-animate-left { animation: fb-slide-left 0.65s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Security badge ── */
        .fb-security {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 10px;
          background: rgba(52,211,153,0.06);
          border: 1px solid rgba(52,211,153,0.15);
          margin-top: 8px;
        }

        /* ── Quote card ── */
        .fb-quote {
          padding: 18px 20px; border-radius: 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
        }
        .fb-quote::before {
          content: '"';
          position: absolute; top: -12px; left: 14px;
          font-size: 80px; color: rgba(139,92,246,0.15);
          font-family: Georgia, serif; line-height: 1;
        }
      `}</style>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="fb-left">
        {/* Aurora background */}
        <div className="fb-aurora" />
        {/* Grid overlay */}
        <div className="fb-grid-overlay" />

        {/* Floating orbs */}
        <Orb style={{ width: 320, height: 320, top: '15%', left: '10%', background: 'rgba(124,58,237,0.18)', animationDuration: '22s', animationDelay: '0s' }} />
        <Orb style={{ width: 240, height: 240, bottom: '18%', right: '8%', background: 'rgba(236,72,153,0.15)', animationDuration: '28s', animationDelay: '-10s' }} />
        <Orb style={{ width: 180, height: 180, top: '60%', left: '45%', background: 'rgba(6,182,212,0.1)', animationDuration: '18s', animationDelay: '-5s' }} />

        {/* Particles */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="fb-particle" style={{
            width: 4 + (i % 4) * 4, height: 4 + (i % 4) * 4,
            left: `${(i * 41 + 9) % 95}%`,
            top: `${(i * 67 + 13) % 90}%`,
            animationDuration: `${14 + (i % 7) * 3}s`,
            animationDelay: `${-(i * 1.8)}s`,
          }} />
        ))}

        {/* ── Logo ── */}
        <div className={`relative z-10 ${mounted ? 'fb-animate-left' : 'opacity-0'}`} style={{ animationDelay: '0.05s' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div className="fb-logo-icon">💰</div>
            <span className="fb-logo-text">FinBuddy</span>
          </Link>
        </div>

        {/* ── Hero block ── */}
        <div className={`relative z-10 ${mounted ? 'fb-animate-left' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="fb-badge">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6', animation: 'fb-pulse-border 1.5s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C4B5FD' }}>
              India's Smartest Finance App
            </span>
          </div>

          <h2 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.08, color: '#F8FAFC', letterSpacing: '-1.5px', marginBottom: 16 }}>
            Your money,<br />
            <span style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 50%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>finally smart.</span>
          </h2>

          <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 360 }}>
            Trade stocks, split bills, track goals, battle friends —<br />
            all with AI-powered intelligence built for Indian students.
          </p>
        </div>

        {/* ── Features ── */}
        <div className={`relative z-10 ${mounted ? 'fb-animate-left' : 'opacity-0'}`} style={{ animationDelay: '0.18s', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="fb-feature-item">
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                background: `${f.color}18`, border: `1px solid ${f.color}30`,
              }}>{f.icon}</div>
              <span style={{ fontSize: 13.5, color: '#CBD5E1', fontWeight: 500 }}>{f.text}</span>
              <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: f.color, opacity: 0.7 }} />
            </div>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className={`relative z-10 ${mounted ? 'fb-animate-left' : 'opacity-0'}`} style={{ animationDelay: '0.24s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {STATS.map((s, i) => (
              <div key={i} className="fb-stat">
                <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                <p style={{
                  fontSize: 17, fontWeight: 900, margin: 0,
                  background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{s.value}</p>
                <p style={{ fontSize: 10, color: 'rgba(100,116,139,0.9)', fontWeight: 600, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="fb-quote">
            <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
              "The best investment you can make is in yourself — start with your money habits."
            </p>
            <p style={{ fontSize: 11, color: '#A78BFA', fontWeight: 700, margin: '10px 0 0', letterSpacing: '0.03em' }}>— FinBuddy AI Mentor</p>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="fb-right">
        {/* Background glows */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(124,58,237,0.09)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 350, height: 350, borderRadius: '50%', filter: 'blur(100px)', background: 'rgba(236,72,153,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 200, height: 200, borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(6,182,212,0.05)', pointerEvents: 'none' }} />

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ marginBottom: 28, textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div className="fb-logo-icon" style={{ width: 36, height: 36, fontSize: 17 }}>💰</div>
            <span className="fb-logo-text" style={{ fontSize: 22 }}>FinBuddy</span>
          </Link>
        </div>

        {/* ── CARD ── */}
        <div className={`fb-card ${mounted ? 'fb-animate-card' : 'opacity-0'}`}>
          {!requires2FA ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.5px', margin: 0 }}>
                  Welcome back 👋
                </h1>
                <p style={{ color: 'rgba(100,116,139,0.9)', marginTop: 6, fontSize: 14, fontWeight: 400 }}>
                  Log in to your financial command center
                </p>
              </div>

              {/* Google */}
              <button id="google-login-btn" onClick={handleGoogleLogin} className="fb-btn-google">
                <svg width="19" height="19" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="fb-divider">
                <div className="fb-divider-line" />
                <span className="fb-divider-text">or email</span>
                <div className="fb-divider-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} id="login-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="fb-label" htmlFor="login-email">Email Address</label>
                  <div className="fb-input-wrap">
                    <input
                      id="login-email"
                      type="email"
                      className="fb-input"
                      placeholder="you@college.edu"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="fb-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, textDecoration: 'none' }}
                      onMouseOver={e => e.target.style.color = '#A78BFA'}
                      onMouseOut={e => e.target.style.color = '#8B5CF6'}>
                      Forgot?
                    </Link>
                  </div>
                  <div className="fb-input-wrap">
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      className="fb-input"
                      style={{ paddingRight: 48 }}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" className="fb-btn-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                      {showPwd
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <button id="login-submit-btn" type="submit" className="fb-btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fb-spin 0.7s linear infinite', display: 'inline-block' }} />
                      Signing in...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Sign In
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: 13.5, color: 'rgba(100,116,139,0.85)', margin: 0 }}>
                  No account yet?{' '}
                  <Link to="/register" style={{ color: '#A78BFA', fontWeight: 700, textDecoration: 'none' }}
                    onMouseOver={e => e.target.style.color = '#C4B5FD'}
                    onMouseOut={e => e.target.style.color = '#A78BFA'}>
                    Create free account →
                  </Link>
                </p>
                <div className="fb-security" style={{ justifyContent: 'center', marginTop: 12, display: 'inline-flex' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  <span style={{ fontSize: 11.5, color: 'rgba(52,211,153,0.8)', fontWeight: 600 }}>256-bit encrypted · Zero data sold</span>
                </div>
              </div>
            </>
          ) : (
            /* ── 2FA Panel ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.18))',
                border: '1px solid rgba(124,58,237,0.4)',
                boxShadow: '0 8px 24px rgba(124,58,237,0.2)',
              }}>🔐</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#F8FAFC', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
                Two-Factor Auth
              </h2>
              <p style={{ color: 'rgba(100,116,139,0.85)', fontSize: 14, margin: '0 0 28px' }}>
                Enter the 6-digit OTP sent to your email
              </p>

              <form onSubmit={handle2FA} id="otp-form">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
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
                      className={`fb-otp-box${d ? ' filled' : ''}`}
                    />
                  ))}
                </div>

                <button type="submit" className="fb-btn-primary" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'fb-spin 0.7s linear infinite', display: 'inline-block' }} />
                      Verifying...
                    </span>
                  ) : 'Verify & Enter 🚀'}
                </button>

                <button type="button" className="fb-btn-back"
                  onClick={() => { setRequires2FA(false); setOtpDigits(['','','','','','']); setOtp(''); }}>
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