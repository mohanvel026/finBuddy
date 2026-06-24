import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1329] text-white flex items-center justify-center p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="card w-full max-w-lg border border-white/10 bg-[#0f1a36]/80 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="text-6xl animate-bounce">⚠️</div>
            <h2 className="text-2xl font-black text-white tracking-tight">Something Went Wrong</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              An unexpected error occurred in the application view. Rest assured, your funds and data are perfectly safe.
            </p>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={this.handleReload} 
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                🔄 Reload App
              </button>
              <button 
                onClick={this.handleGoHome} 
                className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-sm rounded-xl transition"
              >
                🏠 Go to Dashboard
              </button>
            </div>

            {this.state.error && (
              <details className="text-left bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono text-slate-500 max-h-48 overflow-y-auto cursor-pointer">
                <summary className="font-extrabold text-slate-400 select-none pb-2 focus:outline-none">
                  Technical Details
                </summary>
                <p className="text-red-400 font-bold whitespace-pre-wrap">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <p className="mt-2 whitespace-pre-wrap text-[10px] text-slate-600">{this.state.errorInfo.componentStack}</p>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
