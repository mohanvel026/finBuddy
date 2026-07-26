// LoadingScreen.jsx - Reusable loading screen with timeout safety
import { useEffect, useState } from 'react';

const LoadingScreen = ({ message = 'Loading...', timeout = 8000, onTimeout }) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, timeout);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <main className="lg:pl-72 flex-1 min-h-full flex items-center justify-center pt-20 lg:pt-0">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-white mb-2">Loading took too long</h2>
          <p className="text-slate-400 text-sm mb-4">The server may be slow or offline.</p>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{width:'auto',padding:'10px 24px'}}>Retry</button>
        </div>
      </main>
    );
  }

  return (
    <main className="lg:pl-72 flex-1 min-h-full flex items-center justify-center pt-20 lg:pt-0">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-cyan-400 border-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-t-indigo-400 border-transparent animate-spin" style={{animationDirection:'reverse',animationDuration:'0.8s'}} />
        </div>
        <p className="text-slate-300 font-medium text-sm">{message}</p>
        <p className="text-slate-500 text-xs mt-1">Please wait...</p>
      </div>
    </main>
  );
};

export default LoadingScreen;
