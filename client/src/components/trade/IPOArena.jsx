import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const IPOArena = () => {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIpo, setSelectedIpo] = useState(null);
  const [lots, setLots] = useState(1);
  const [applying, setApplying] = useState(false);
  const [walletBalance, setWalletBalance] = useState(100000);
  const [allotmentResult, setAllotmentResult] = useState(null);

  useEffect(() => {
    loadIPOs();
    loadProfile();
  }, []);

  const loadIPOs = async () => {
    try {
      const { data } = await api.get('/trades/ipo');
      if (data.success) {
        setIpos(data.ipos || []);
      }
    } catch (e) {
      toast.error('Failed to load IPO listings');
    }
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/users/profile');
      if (data.success) {
        setWalletBalance(data.user?.virtualWallet ?? 0);
      }
    } catch (e) {}
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedIpo) return;

    const price = selectedIpo.priceRange.max * selectedIpo.lotSize * lots;
    if (walletBalance < price) {
      toast.error(`Insufficient wallet balance! You need ₹${price.toLocaleString('en-IN')}`);
      return;
    }

    setApplying(true);
    try {
      const { data } = await api.post('/trades/ipo/apply', {
        ipoId: selectedIpo.id,
        lots: parseInt(lots)
      });

      if (data.success) {
        setAllotmentResult(data);
        loadProfile(); // refresh wallet
        if (data.allotted) {
          toast.success('IPO Allotment Successful! 🎉');
        } else {
          toast.error('Not Allotted. Refund issued.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ipos.map((ipo) => {
          const minPrice = ipo.priceRange.min;
          const maxPrice = ipo.priceRange.max;
          const lotVal = maxPrice * ipo.lotSize;
          const isOpen = ipo.status === 'open';

          return (
            <div key={ipo.id} className="card relative overflow-hidden group hover:border-white/15 transition flex flex-col justify-between">
              {/* Status Badge */}
              <div className="absolute top-3 right-3 flex gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {ipo.status}
                </span>
                {ipo.gmp > 0 && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                    🚀 +{ipo.gmp}% GMP
                  </span>
                )}
              </div>

              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{ipo.sector}</p>
                <h3 className="font-bold text-lg text-white mt-1 group-hover:text-cyan-400 transition">{ipo.companyName}</h3>
                <p className="text-slate-500 text-xs mt-0.5">NSE: {ipo.symbol}</p>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-xs text-slate-400">Price Band</p>
                    <p className="font-bold text-sm text-white">₹{minPrice} - ₹{maxPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Lot Size</p>
                    <p className="font-bold text-sm text-white">{ipo.lotSize} shares (₹{lotVal.toLocaleString('en-IN')})</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Issue Size</p>
                    <p className="font-bold text-sm text-white">{ipo.issueSize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Subscription</p>
                    <p className="font-bold text-sm text-white">
                      {ipo.subscription?.retail ? `${ipo.subscription.retail}x Retail` : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Financial Overview */}
                {ipo.financials && (
                  <div className="mt-4 p-2 bg-white/5 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Revenue:</span>
                      <span className="text-white font-medium">{ipo.financials.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Net Profit:</span>
                      <span className="text-green-400 font-medium">{ipo.financials.profit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">P/E Ratio:</span>
                      <span className="text-cyan-400 font-medium">{ipo.financials.pe}x</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                <button
                  disabled={!isOpen}
                  onClick={() => { setSelectedIpo(ipo); setAllotmentResult(null); setLots(1); }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    isOpen
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
                      : 'bg-white/5 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isOpen ? '📝 Apply Now' : '⌛ Coming Soon'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Modal */}
      {selectedIpo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Apply for {selectedIpo.companyName}</h3>
                <p className="text-xs text-slate-400 mt-1">Lot Size: {selectedIpo.lotSize} Shares • Price: ₹{selectedIpo.priceRange.max} / share</p>
              </div>
              <button
                onClick={() => setSelectedIpo(null)}
                className="text-slate-400 hover:text-white text-2xl transition"
              >
                ×
              </button>
            </div>

            {!allotmentResult ? (
              <form onSubmit={handleApply} className="space-y-4">
                <div className="card bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Shares:</span>
                    <span className="font-bold text-white">{selectedIpo.lotSize * lots} shares</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Application Price:</span>
                    <span className="font-bold text-white">₹{(selectedIpo.priceRange.max * selectedIpo.lotSize * lots).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                    <span className="text-slate-400">Available Cash:</span>
                    <span className="font-bold text-cyan-400">₹{walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Number of Lots</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLots(Math.max(1, lots - 1))}
                      className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition text-lg font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="input-dark text-center text-lg font-bold"
                      value={lots}
                      onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button
                      type="button"
                      onClick={() => setLots(lots + 1)}
                      className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIpo(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="btn-primary flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  >
                    {applying ? 'Applying...' : 'Confirm Bid 📝'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                {allotmentResult.allotted ? (
                  <div className="space-y-3">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <h4 className="text-xl font-bold text-green-400">Congratulations!</h4>
                    <p className="text-slate-300 text-sm">{allotmentResult.message}</p>
                    <div className="card bg-white/5 p-3 rounded-xl border border-white/5 space-y-2 mt-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Shares Allotted:</span>
                        <span className="font-bold text-white">{allotmentResult.shares}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Allotment Price:</span>
                        <span className="font-bold text-white">₹{allotmentResult.issuePrice}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Est. Listing Price:</span>
                        <span className="font-bold text-cyan-400">₹{allotmentResult.estimatedListingPrice}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                        <span className="text-slate-400">Est. Listing Gain:</span>
                        <span className="font-bold text-green-400">+₹{allotmentResult.estimatedGain?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-6xl">💸</div>
                    <h4 className="text-xl font-bold text-red-400">Not Allotted</h4>
                    <p className="text-slate-300 text-sm">{allotmentResult.message}</p>
                    <p className="text-xs text-slate-500">Your funds have been immediately unlocked and refunded to your wallet.</p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedIpo(null)}
                  className="btn-primary w-full mt-6"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IPOArena;
