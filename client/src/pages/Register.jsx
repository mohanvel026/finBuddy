import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Password strength ──────────────────────────────────────── */
const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { score: 1, label: 'Weak',   color: '#F87171' },
    { score: 2, label: 'Fair',   color: '#FB923C' },
    { score: 3, label: 'Good',   color: '#FBBF24' },
    { score: 4, label: 'Strong', color: '#34D399' },
  ];
  return levels.find(l => l.score === score) || { score: 0, label: '', color: '' };
};

/* ─── Feature badge ─────────────────────────────────────────── */
const Badge = ({ icon, text }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl reg-badge">
    <span className="text-base">{icon}</span>
    <span className="text-xs font-semibold text-slate-300">{text}</span>
  </div>
);

const FEATURES = [
  { icon: '💰', text: '₹1,00,000 Virtual Wallet' },
  { icon: '📈', text: 'Live Stock Trading' },
  { icon: '💸', text: 'Smart Bill Splitting' },
  { icon: '🤖', text: 'AI Financial Mentor' },
  { icon: '⚔️', text: 'Friend Battle Mode' },
  { icon: '🔒', text: '100% Data Encrypted' },
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    yearOfStudy: '',
    referralCode: searchParams.get('ref') || ''
  });
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [step, setStep]         = useState(1); // 1 or 2
  const { register }            = useAuth();
  const navigate                = useNavigate();
  const strength                = getStrength(form.password);

  /* Step 1 fields valid? */
  const step1Valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
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
    <div
      id="register-page"
      className="min-h-screen flex"
      style={{ background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes slide-up-reg {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes shimmer-reg {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .reg-card { animation: slide-up-reg 0.55s cubic-bezier(.22,1,.36,1) both; }
        .reg-badge {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background .2s, border-color .2s;
        }
        .reg-badge:hover {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.3);
        }
        .reg-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 13px 16px;
          color: #F8FAFC;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .reg-input:focus {
          border-color: rgba(124,58,237,0.7);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .reg-input::placeholder { color: rgba(148,163,184,0.4); }
        .reg-select {
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .reg-select option { background: #1A1928; color: #F8FAFC; }
        .btn-reg-primary {
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
        .btn-reg-primary:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 32px rgba(124,58,237,0.45);
        }
        .btn-reg-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-reg-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          background-size: 400px;
          animation: shimmer-reg 2.5s infinite;
        }
        .btn-reg-secondary {
          width: 100%;
          padding: 13px 24px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.09);
          border-radius: 14px;
          color: #94A3B8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }
        .btn-reg-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .step-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: all .3s;
        }
        .step-dot.active {
          width: 24px;
          border-radius: 4px;
          background: linear-gradient(90deg, #7C3AED, #EC4899);
        }
        .strength-bar {
          height: 3px;
          border-radius: 2px;
          transition: width .4s, background .4s;
        }
        .google-reg-btn {
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
        }
        .google-reg-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[50%] flex-col justify-between relative overflow-hidden p-12"
        style={{
          background: 'radial-gradient(ellipse at 25% 50%, rgba(124,58,237,0.22) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.16) 0%, transparent 50%), linear-gradient(135deg, #08080F 0%, #0E0D18 60%, #12111A 100%)'
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.16)', animation: 'glow-pulse 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
          style={{ background: 'rgba(236,72,153,0.12)' }} />

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

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#34D399', animation: 'glow-pulse 1.5s infinite' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Free Forever · No Credit Card</span>
            </div>
            <h2 className="text-5xl font-black leading-[1.1] text-white">
              Join 18,000+<br />
              <span style={{
                background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #22D3EE 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>smart students.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
              Build real financial literacy with virtual money, live markets, AI guidance, and a community that grows your wealth IQ.
            </p>
          </div>

          {/* Feature badges grid */}
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f, i) => <Badge key={i} {...f} />)}
          </div>

          {/* Wallet preview card */}
          <div className="p-5 rounded-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.15) 100%)',
              border: '1px solid rgba(124,58,237,0.35)'
            }}>
            <div className="absolute top-2 right-3 text-2xl opacity-30">💰</div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-1">Your Starter Wallet</p>
            <p className="text-4xl font-black text-white">₹1,00,000</p>
            <p className="text-xs text-slate-400 mt-1">Virtual funds · Instantly on signup · Trade real markets</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#34D399', animation: 'glow-pulse 1.5s infinite' }} />
              <span className="text-xs text-emerald-400 font-semibold">Markets open · Live prices</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 p-4 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff' }}>A</div>
            <div>
              <p className="text-sm font-bold text-white">Arjun V., IIT Madras</p>
              <div className="text-yellow-400 text-xs">★★★★★</div>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            "FinBuddy made me understand markets better than 3 years of finance classes. The AI mentor is insane!"
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 relative overflow-hidden"
        style={{ background: '#0A0912' }}>

        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
          style={{ background: 'rgba(124,58,237,0.07)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: 'rgba(236,72,153,0.05)' }} />

        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>💰</div>
            <span className="text-2xl font-black" style={{
              background: 'linear-gradient(135deg, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>FinBuddy</span>
          </Link>
        </div>

        <div className="reg-card w-full max-w-[420px] relative z-10">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-black text-white">
                {step === 1 ? 'Create Account 🚀' : 'Almost done! 🎯'}
              </h1>
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
                <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              {step === 1
                ? 'Start your financial intelligence journey'
                : 'Optional details to personalize your experience'}
            </p>
          </div>

          {/* Referral banner */}
          {form.referralCode && (
            <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <span className="text-lg">🎁</span>
              <div>
                <p className="text-xs font-bold text-emerald-400">Referral Bonus Applied!</p>
                <p className="text-xs text-slate-400">+₹10,000 extra virtual money on signup</p>
              </div>
            </div>
          )}

          {/* Google */}
          {step === 1 && (
            <>
              <button id="google-register-btn" onClick={handleGoogleRegister} className="google-reg-btn mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">or email</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>
            </>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  id="reg-name"
                  className="reg-input"
                  placeholder="Arjun Kumar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  className="reg-input"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    className="reg-input pr-12"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="strength-bar flex-1"
                          style={{
                            background: n <= strength.score ? strength.color : 'rgba(255,255,255,0.08)'
                          }} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <button
                id="reg-next-btn"
                type="button"
                className="btn-reg-primary"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form id="register-form" onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College</label>
                  <input
                    id="reg-college"
                    className="reg-input"
                    placeholder="VIT, IIT, Anna…"
                    value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                  <select
                    id="reg-year"
                    className="reg-input reg-select"
                    value={form.yearOfStudy}
                    onChange={e => setForm({ ...form, yearOfStudy: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">PG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Referral Code <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  id="reg-referral"
                  className="reg-input"
                  placeholder="e.g. AB12CD"
                  value={form.referralCode}
                  onChange={e => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Wallet bonus */}
              <div className="p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-sm font-bold text-purple-300">₹1,00,000 Virtual Wallet</p>
                  <p className="text-xs text-slate-500">Credited instantly on signup · No strings attached</p>
                </div>
              </div>

              <button id="reg-submit-btn" type="submit" className="btn-reg-primary" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Free Account 🚀'}
              </button>

              <button type="button" className="btn-reg-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-5 border-t flex flex-col items-center gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold" style={{ color: '#A78BFA' }}>
                Log in
              </Link>
            </p>
            <p className="text-xs text-slate-700 text-center">
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;