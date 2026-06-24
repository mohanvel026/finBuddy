// client/src/components/trade/SectorScreener.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SectorScreener = ({ onSelectStock }) => {
  const [heatmap, setHeatmap] = useState([]);
  const [screenedStocks, setScreenedStocks] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingScreener, setLoadingScreener] = useState(true);

  // Screener Filters State
  const [filters, setFilters] = useState({
    pe: 'all',        // all | low (<15) | mid (15-30) | high (>30)
    price: 'all',     // all | cheap (<1000) | mid (1000-3000) | premium (>3000)
    sortBy: 'marketCap' // marketCap | price | change | pe
  });

  const [activeSector, setActiveSector] = useState(null);

  // ── Min-Heap Top-K States ──
  const [heapMetric, setHeapMetric] = useState('rsi'); // 'rsi' | 'returns'
  const [heapItems, setHeapItems] = useState([]);
  const [heapProgress, setHeapProgress] = useState(0);
  const [heapLog, setHeapLog] = useState('');
  const [isHeapProcessing, setIsHeapProcessing] = useState(false);
  const [heapStocks, setHeapStocks] = useState([]);

  // Generate 500 stocks
  useEffect(() => {
    const sectors = ['IT', 'Banking', 'Auto', 'Pharma', 'Energy', 'FMCG', 'Metal', 'Infra'];
    const stocks = [];
    for (let i = 1; i <= 500; i++) {
      const sector = sectors[i % sectors.length];
      const rsi = Math.round(30 + Math.random() * 60);
      const returns = +(Math.random() * 80 - 20).toFixed(2);
      stocks.push({
        symbol: `${sector.substring(0,3).toUpperCase()}${i}`,
        name: `${sector} Corporation No.${i}`,
        rsi,
        returns,
        price: +(100 + Math.random() * 4900).toFixed(2)
      });
    }
    setHeapStocks(stocks);
  }, []);

  const runMinHeapScreener = async () => {
    if (isHeapProcessing) return;
    setIsHeapProcessing(true);
    
    let currentHeap = [];
    const K = 10;
    
    const compare = (a, b) => {
      return heapMetric === 'rsi' ? a.rsi - b.rsi : a.returns - b.returns;
    };

    const bubbleUp = (idx) => {
      while (idx > 0) {
        const parent = Math.floor((idx - 1) / 2);
        if (compare(currentHeap[idx], currentHeap[parent]) >= 0) break;
        const tmp = currentHeap[idx];
        currentHeap[idx] = currentHeap[parent];
        currentHeap[parent] = tmp;
        idx = parent;
      }
    };

    const bubbleDown = (idx) => {
      const len = currentHeap.length;
      while (true) {
        let left = 2 * idx + 1;
        let right = 2 * idx + 2;
        let smallest = idx;
        if (left < len && compare(currentHeap[left], currentHeap[smallest]) < 0) {
          smallest = left;
        }
        if (right < len && compare(currentHeap[right], currentHeap[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === idx) break;
        const tmp = currentHeap[idx];
        currentHeap[idx] = currentHeap[smallest];
        currentHeap[smallest] = tmp;
        idx = smallest;
      }
    };

    setHeapItems([]);
    setHeapProgress(0);

    for (let i = 0; i < heapStocks.length; i++) {
      // yield delay
      await new Promise(resolve => setTimeout(resolve, 5));
      const stock = heapStocks[i];
      setHeapProgress(i + 1);

      if (currentHeap.length < K) {
        currentHeap.push(stock);
        bubbleUp(currentHeap.length - 1);
        setHeapItems([...currentHeap]);
        setHeapLog(`Heap size < 10. Added ${stock.symbol} (Value: ${heapMetric === 'rsi' ? stock.rsi : stock.returns}) and bubbled up.`);
      } else {
        const root = currentHeap[0];
        const valRoot = heapMetric === 'rsi' ? root.rsi : root.returns;
        const valStock = heapMetric === 'rsi' ? stock.rsi : stock.returns;

        if (valStock > valRoot) {
          currentHeap[0] = stock;
          bubbleDown(0);
          setHeapItems([...currentHeap]);
          setHeapLog(`Evicted min root ${root.symbol} (Val: ${valRoot}) because new stock ${stock.symbol} has higher value (${valStock}). Bubbled down.`);
        } else {
          if (i % 25 === 0) {
            setHeapLog(`Ignored ${stock.symbol} (Val: ${valStock}) — smaller than heap min root (Val: ${valRoot}).`);
          }
        }
      }
    }

    setIsHeapProcessing(false);
    setHeapLog(`Done! Filtered top 10 stocks out of 500 in O(n log k) complexity. Heap holds the absolute maximum values.`);
  };

  useEffect(() => {
    fetchHeatmap();
  }, []);

  useEffect(() => {
    fetchScreenedStocks();
  }, [filters]);

  const fetchHeatmap = async () => {
    setLoadingHeatmap(true);
    try {
      const { data } = await api.get('/market/sector-heatmap');
      setHeatmap(data.heatmap || []);
    } catch (e) {
      toast.error('Failed to load sector heatmap');
    }
    setLoadingHeatmap(false);
  };

  const fetchScreenedStocks = async () => {
    setLoadingScreener(true);
    try {
      const queryParams = new URLSearchParams({
        sortBy: filters.sortBy
      });

      // Map filter descriptions to api expectations
      if (filters.pe === 'low') {
        queryParams.append('maxPE', '15');
      } else if (filters.pe === 'mid') {
        queryParams.append('minPE', '15');
        queryParams.append('maxPE', '30');
      } else if (filters.pe === 'high') {
        queryParams.append('minPE', '30');
      }

      if (filters.price === 'cheap') {
        queryParams.append('maxPrice', '1000');
      } else if (filters.price === 'mid') {
        queryParams.append('minPrice', '1000');
        queryParams.append('maxPrice', '3000');
      } else if (filters.price === 'premium') {
        queryParams.append('minPrice', '3000');
      }

      const { data } = await api.get(`/market/screener?${queryParams.toString()}`);
      setScreenedStocks(data.stocks || []);
    } catch (e) {
      toast.error('Failed to screen stocks');
    }
    setLoadingScreener(false);
  };

  // Filter stocks depending on selected Sector in Heatmap
  const displayStocks = activeSector
    ? screenedStocks.filter(s => {
        const sectorData = heatmap.find(h => h.sector === activeSector);
        return sectorData?.stocks.some(st => st.symbol === s.symbol);
      })
    : screenedStocks;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      
      {/* ─── Sector Heatmap (1 Column) ─── */}
      <div className="md:col-span-1 space-y-4">
        <div>
          <h3 className="font-bold text-lg mb-1">🔥 Sector Heatmap</h3>
          <p className="text-xs text-slate-400">Click a sector to filter the Screener table below</p>
        </div>

        {loadingHeatmap ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {heatmap.map((h, i) => {
              const changeVal = h.avgChange;
              const isPositive = changeVal >= 0;
              const isSelected = activeSector === h.sector;

              return (
                <div
                  key={i}
                  onClick={() => setActiveSector(isSelected ? null : h.sector)}
                  className={`cursor-pointer p-3 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                      : isPositive
                      ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/40'
                      : 'border-red-500/20 bg-red-500/5 hover:border-red-500/40'
                  }`}
                >
                  <p className="text-xs text-slate-400 font-medium">{h.sector}</p>
                  <p className={`text-xl font-black mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{changeVal}%
                  </p>
                  <span className="text-[10px] text-slate-500">{h.stocks?.length} shares</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Stock Screener (2 Columns) ─── */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-lg">🔍 Stock Screener</h3>
            <p className="text-xs text-slate-400">
              {activeSector ? `Showing filtered stocks for ${activeSector}` : 'Scan public securities by valuations'}
            </p>
          </div>

          {/* Filter dropdowns */}
          <div className="flex gap-2 flex-wrap">
            {/* PE */}
            <select
              value={filters.pe}
              onChange={e => setFilters({ ...filters, pe: e.target.value })}
              className="input-dark py-1 text-xs"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="all">📊 All P/E</option>
              <option value="low">Value (&lt; 15)</option>
              <option value="mid">Growth (15 - 30)</option>
              <option value="high">Premium (&gt; 30)</option>
            </select>

            {/* Price */}
            <select
              value={filters.price}
              onChange={e => setFilters({ ...filters, price: e.target.value })}
              className="input-dark py-1 text-xs"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="all">💸 All Prices</option>
              <option value="cheap">Under ₹1,000</option>
              <option value="mid">₹1,000 - ₹3,000</option>
              <option value="premium">Above ₹3,000</option>
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
              className="input-dark py-1 text-xs"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="marketCap">💼 Market Cap</option>
              <option value="price">💸 Share Price</option>
              <option value="change">📈 Day Change</option>
              <option value="pe">📊 P/E Ratio</option>
            </select>
          </div>
        </div>

        {/* Screener list */}
        {loadingScreener ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : displayStocks.length === 0 ? (
          <div className="card text-center py-12 border-dashed border-white/10">
            <span className="text-4xl">📭</span>
            <p className="font-bold text-slate-400 mt-2">No matching stocks found</p>
            <p className="text-xs text-slate-500 mt-1">Try relaxing filters or resetting the active sector</p>
          </div>
        ) : (
          <div className="card p-0 overflow-x-auto max-h-[290px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-400 border-b border-white/5 font-semibold">
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Change</th>
                  <th className="p-3">P/E</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayStocks.map((s, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <p className="font-bold">{s.symbol}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{s.name}</p>
                    </td>
                    <td className="p-3 font-semibold text-white">₹{s.price?.toFixed(2)}</td>
                    <td className={`p-3 font-bold ${s.isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {s.isUp ? '▲' : '▼'} {Math.abs(s.change)}%
                    </td>
                    <td className="p-3 text-slate-300 font-medium">{s.pe || '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectStock(s)}
                        className="btn-primary text-[10px]"
                        style={{ padding: '4px 10px', width: 'auto' }}
                      >
                        Analyze 📊
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Min-Heap Top-K Stock Screener Section (Full Width) ─── */}
      <div className="md:col-span-3 border-t border-white/5 pt-8 mt-4 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-lg text-white">🚀 Top-K Momentum Screener (Min-Heap Engine)</h3>
            <p className="text-xs text-slate-400">
              Find the top 10 stocks from 500 options without sorting the entire dataset, keeping complexity at $O(n \log k)$.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={heapMetric}
              onChange={e => setHeapMetric(e.target.value)}
              disabled={isHeapProcessing}
              className="input-dark py-1 text-xs"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              <option value="rsi">🔥 Top RSI Score</option>
              <option value="returns">📈 Top Returns (%)</option>
            </select>

            <button
              onClick={runMinHeapScreener}
              disabled={isHeapProcessing}
              className="btn-primary text-xs font-bold bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 cursor-pointer"
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              {isHeapProcessing ? `Scanning (${heapProgress}/500)...` : '⚡ Run Heap Screener'}
            </button>
          </div>
        </div>

        {/* Processing Progress Bar */}
        {isHeapProcessing && (
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${(heapProgress / 500) * 100}%` }}
              className="bg-cyan-400 h-full transition-all duration-75"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Min Heap Tree Visualization */}
          <div className="lg:col-span-8 card bg-white/3 border border-white/5 p-5 flex flex-col items-center justify-center min-h-[300px]">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-4 self-start">
              Min-Heap Structure (Root contains minimum of Top-K)
            </h4>

            {heapItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center">No heap created yet. Click run to start processing.</p>
            ) : (
              <svg width="400" height="240" className="max-w-full">
                {/* Draw connecting lines first */}
                {heapItems.map((_, idx) => {
                  if (idx === 0) return null;
                  const parentIdx = Math.floor((idx - 1) / 2);
                  const nodePos = [
                    { x: 200, y: 30 }, // root
                    { x: 100, y: 90 }, { x: 300, y: 90 }, // depth 1
                    { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 250, y: 150 }, { x: 350, y: 150 }, // depth 2
                    { x: 25, y: 210 }, { x: 75, y: 210 }, { x: 125, y: 210 } // depth 3
                  ];
                  const p = nodePos[parentIdx];
                  const c = nodePos[idx];
                  return (
                    <line 
                      key={`line-${idx}`} 
                      x1={p.x} y1={p.y} 
                      x2={c.x} y2={c.y} 
                      stroke="rgba(255,255,255,0.1)" 
                      strokeWidth="2" 
                    />
                  );
                })}

                {/* Draw node circles and text */}
                {heapItems.map((item, idx) => {
                  const nodePos = [
                    { x: 200, y: 30 },
                    { x: 100, y: 90 }, { x: 300, y: 90 },
                    { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 250, y: 150 }, { x: 350, y: 150 },
                    { x: 25, y: 210 }, { x: 75, y: 210 }, { x: 125, y: 210 }
                  ];
                  const pos = nodePos[idx];
                  const isRoot = idx === 0;

                  return (
                    <g key={`node-${idx}`}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="18"
                        fill={isRoot ? '#7f1d1d' : '#0f172a'}
                        stroke={isRoot ? '#f87171' : '#22d3ee'}
                        strokeWidth="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 2}
                        fill="#fff"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {item.symbol}
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 8}
                        fill={isRoot ? '#f87171' : '#22d3ee'}
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {heapMetric === 'rsi' ? `${item.rsi}` : `${item.returns}%`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Screener Telemetry Log */}
          <div className="lg:col-span-4 card bg-white/3 border border-white/5 p-5 space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Screener Log / Stats
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Complexity:</span>
                <span className="text-amber-400 font-bold">O(n log k)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Stocks Scanned:</span>
                <span className="text-white font-bold">{heapProgress} / 500</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Min Heap Value:</span>
                <span className="text-red-400 font-bold">
                  {heapItems.length > 0 
                    ? (heapMetric === 'rsi' ? heapItems[0].rsi : `${heapItems[0].returns}%`) 
                    : '—'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-slate-300 leading-relaxed min-h-[140px] max-h-[180px] overflow-y-auto">
              {heapLog || 'Waiting for execution...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectorScreener;
