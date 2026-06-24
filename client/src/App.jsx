import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/common/Layout';
import PWAInstallBanner from './components/common/PWAInstallBanner';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SplitSmart = lazy(() => import('./pages/SplitSmart'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const TripVault = lazy(() => import('./pages/TripVault'));
const TripPhotoVault = lazy(() => import('./pages/TripPhotoVault'));
const PublicPhotoVault = lazy(() => import('./pages/PublicPhotoVault'));
const TradeArena = lazy(() => import('./pages/TradeArena'));
const StrategyLab = lazy(() => import('./pages/StrategyLab'));
const BacktestArena = lazy(() => import('./pages/BacktestArena'));
const AIMentor = lazy(() => import('./pages/AIMentor'));
const WealthMap = lazy(() => import('./pages/WealthMap'));
const FinBattle = lazy(() => import('./pages/FinBattle'));
const SmartFeatures = lazy(() => import('./pages/SmartFeatures'));
const MFAnalyzer = lazy(() => import('./pages/MFAnalyzer'));
const Profile = lazy(() => import('./pages/Profile'));
const GoogleAuthSuccess = lazy(() => import('./pages/GoogleAuthSuccess'));
const LearnHub = lazy(() => import('./pages/LearnHub'));
const LabPage = lazy(() => import('./pages/LabPage'));
const Playground = lazy(() => import('./pages/Playground'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OptionsChain = lazy(() => import('./pages/OptionsChain'));
const FeatureGuide = lazy(() => import('./pages/FeatureGuide'));

const PR = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

const RouteLoader = () => (
  <div className="min-h-screen bg-[#0b1329] text-white flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-t-purple-500 border-r-pink-500 border-b-cyan-500 border-l-transparent rounded-full animate-spin" />
    <p className="text-xs uppercase tracking-widest text-slate-500 font-extrabold animate-pulse">
      Loading FinBuddy module...
    </p>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{
              style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
              success: { iconTheme: { primary: '#7C3AED', secondary: 'var(--bg-secondary)' } },
              error: { iconTheme: { primary: '#ef4444', secondary: 'var(--bg-secondary)' } }
            }} />
            <PWAInstallBanner />
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
                <Route path="/public/photos/:inviteCode" element={<PublicPhotoVault />} />

                {/* Protected */}
                <Route element={<PR><Layout /></PR>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/split" element={<SplitSmart />} />
                  <Route path="/split/group/:id" element={<GroupDetail />} />
                  <Route path="/split/trip/:groupId" element={<TripVault />} />
                  <Route path="/split/photos/:groupId" element={<TripPhotoVault />} />
                  <Route path="/trade" element={<TradeArena />} />
                  <Route path="/trade/strategy" element={<StrategyLab />} />
                  <Route path="/trade/backtest" element={<BacktestArena />} />
                  <Route path="/trade/options" element={<OptionsChain />} />
                  <Route path="/mentor" element={<AIMentor />} />
                  <Route path="/wealth" element={<WealthMap />} />
                  <Route path="/battle" element={<FinBattle />} />
                  <Route path="/smart" element={<SmartFeatures />} />
                  <Route path="/mf" element={<MFAnalyzer />} />
                  <Route path="/learn" element={<LearnHub />} />
                  <Route path="/learn/lab" element={<LabPage />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/guide" element={<FeatureGuide />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;