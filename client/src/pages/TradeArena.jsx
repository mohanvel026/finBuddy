// client/src/pages/TradeArena.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
/* import Sidebar removed */
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ComposedChart
} from 'recharts';
import IPOArena from '../components/trade/IPOArena';
import MutualFundSIP from '../components/trade/MutualFundSIP';
import SectorScreener from '../components/trade/SectorScreener';
import SectionGuide from '../components/common/SectionGuide';


// ─── Sub-components ────────────────────────────────────────

const StockRow = ({ stock, onSelect, isSelected }) => {
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null
  const prevPriceRef = useRef(stock.price);

  useEffect(() => {
    if (stock.price !== prevPriceRef.current) {
      const dir = stock.price > prevPriceRef.current ? 'up' : 'down';
      setFlash(dir);
      prevPriceRef.current = stock.price;
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  return (
    <div
      onClick={() => onSelect(stock)}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
        isSelected ? 'bg-cyan-500/15 border-cyan-500/30 shadow-[0_4px_12px_rgba(6,182,212,0.08)]' : 'bg-transparent border-transparent hover:bg-white/5'
      }`}
    >
      <div>
        <p className="font-medium text-sm text-white">{stock.name || stock.symbol}</p>
        <p className="text-xs text-slate-400">{stock.symbol}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold text-sm ${
          flash === 'up' ? 'animate-flash-green' : 
          flash === 'down' ? 'animate-flash-red' : 'text-white'
        }`}>₹{stock.price?.toFixed(2)}</p>
        <p className={`text-xs font-medium ${stock.isUp ? 'text-green-400' : 'text-red-400'}`}>
          {stock.isUp ? '▲' : '▼'} {Math.abs(stock.changePercent || 0).toFixed(2)}%
        </p>
      </div>
    </div>
  );
};

const PortfolioCard = ({ holding, onUpdate }) => {
  const isProfit = holding.profitLoss >= 0;
  const [showLimits, setShowLimits] = useState(false);
  const [slVal, setSlVal] = useState(holding.stopLossPrice !== null && holding.stopLossPrice !== undefined ? holding.stopLossPrice : '');
  const [tgtVal, setTgtVal] = useState(holding.targetPrice !== null && holding.targetPrice !== undefined ? holding.targetPrice : '');
  const [saving, setSaving] = useState(false);

  const saveLimits = async () => {
    setSaving(true);
    try {
      await api.put(`/trades/holdings/${holding.symbol}/limits`, {
        stopLossPrice: slVal,
        targetPrice: tgtVal
      });
      toast.success(`Limits updated for ${holding.symbol}`);
      setShowLimits(false);
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Failed to update limits');
    }
    setSaving(false);
  };

  return (
    <div className="card hover:border-white/10 transition space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-white flex items-center gap-1.5">
            {holding.symbol}
            {(holding.stopLossPrice !== null || holding.targetPrice !== null) && (
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded-full">
                🛡️ SL/TGT
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 truncate max-w-28">{holding.companyName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isProfit ? '+' : ''}{holding.profitLossPercent?.toFixed(2)}%
          </span>
          <button
            onClick={() => setShowLimits(!showLimits)}
            className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-0.5"
          >
            ⚙️ {showLimits ? 'Hide Limits' : 'Set Limits'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm border-b border-white/5 pb-2">
        <div>
          <p className="text-slate-400 text-xs">Qty</p>
          <p className="font-medium text-white">{holding.quantity}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Avg Buy</p>
          <p className="font-medium text-white">₹{holding.avgBuyPrice?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Current</p>
          <p className="font-medium text-white">₹{holding.currentPrice?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">P&L</p>
          <p className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}₹{holding.profitLoss?.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Limits display if set */}
      {!showLimits && (holding.stopLossPrice !== null || holding.targetPrice !== null) && (
        <div className="flex justify-between items-center bg-white/3 p-2 rounded-xl text-[10px]">
          {holding.stopLossPrice !== null && (
            <span className="text-red-400">🛑 SL: ₹{holding.stopLossPrice?.toFixed(2)}</span>
          )}
          {holding.targetPrice !== null && (
            <span className="text-green-400">🎯 TGT: ₹{holding.targetPrice?.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Collapsible edit form */}
      {showLimits && (
        <div className="bg-white/3 p-3 rounded-2xl border border-white/5 space-y-3 animate-fade-in">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Set SL & Target Limits</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Stop-Loss (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Drop below ₹"
                className="input-dark text-xs p-1.5"
                value={slVal}
                onChange={e => setSlVal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Rises above ₹"
                className="input-dark text-xs p-1.5"
                value={tgtVal}
                onChange={e => setTgtVal(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowLimits(false)}
              className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={saveLimits}
              disabled={saving}
              className="text-[10px] px-2.5 py-1 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Candlestick = (props) => {
  const { x, y, width, height, payload, yScale } = props;
  if (!payload || !yScale) return null;

  const { open, close, high, low, color } = payload;
  const isUp = close >= open;

  const yHigh = yScale(high);
  const yLow = yScale(low);
  const yOpen = yScale(open);
  const yClose = yScale(close);

  const cx = x + width / 2;
  const candleWidth = 8;

  const strokeColor = color;
  const fillColor = color;

  return (
    <g>
      {/* High/Low Wick Shadow line */}
      <line
        x1={cx}
        y1={yHigh}
        x2={cx}
        y2={yLow}
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Candle Body */}
      <rect
        x={cx - candleWidth / 2}
        y={Math.min(yOpen, yClose)}
        width={candleWidth}
        height={Math.max(1.5, Math.abs(yOpen - yClose))}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
        rx={1}
      />
    </g>
  );
};

// ─── Main TradeArena Page ────────────────────────────────────

const getReasoningScore = (text = '') => {
  const t = text.toLowerCase();
  const fundamental = ['pe', 'growth', 'revenue', 'earnings', 'dividend', 'ebitda', 'undervalued', 'fundamental', 'value', 'capital', 'balance sheet', 'debt', 'margin'];
  const technical = ['rsi', 'macd', 'average', 'support', 'resistance', 'breakout', 'volume', 'chart', 'trend', 'technical', 'moving', 'indicator'];
  const risk = ['risk', 'stoploss', 'stop loss', 'diversify', 'hedge', 'size', 'allocation', 'portfolio'];

  let fundCount = fundamental.filter(kw => t.includes(kw)).length;
  let techCount = technical.filter(kw => t.includes(kw)).length;
  let riskCount = risk.filter(kw => t.includes(kw)).length;

  const total = fundCount + techCount + riskCount;
  if (total === 0) {
    return {
      score: 0,
      label: 'Weak / Speculative 🔴',
      color: 'text-red-400',
      barCol: 'bg-red-500',
      feedback: 'Add details like PE ratio, support levels, or stoploss to boost quality score.'
    };
  }

  const score = Math.min(100, total * 25);
  let label = 'Retail Level Analysis 🔵';
  let color = 'text-blue-400';
  let barCol = 'bg-blue-500';
  
  if (score >= 75) {
    label = 'Institutional Quality 🟢';
    color = 'text-green-400';
    barCol = 'bg-green-500';
  } else if (score >= 50) {
    label = 'Semi-Professional 🟡';
    color = 'text-yellow-400';
    barCol = 'bg-yellow-500';
  }

  let primaryType = 'Speculative';
  if (fundCount >= techCount && fundCount >= riskCount) primaryType = 'Fundamental';
  else if (techCount >= fundCount && techCount >= riskCount) primaryType = 'Technical';
  else primaryType = 'Risk Managed';

  return {
    score,
    label: `${label} (${primaryType})`,
    color,
    barCol,
    feedback: `Detected: ${fundCount} fundamental, ${techCount} technical, ${riskCount} risk indicators.`
  };
};

// Trie Data Structure for O(m) Autocomplete Search
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.stock = null;
  }
}

class StockTrie {
  constructor() {
    this.root = new TrieNode();
  }
  
  insert(symbol, name) {
    let node = this.root;
    const symbolKey = symbol.toLowerCase();
    for (let char of symbolKey) {
      if (!node.children[char]) node.children[char] = new TrieNode();
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.stock = { symbol, name };

    const nameWords = name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (word.length < 2) return;
      let nNode = this.root;
      for (let char of word) {
        if (!nNode.children[char]) nNode.children[char] = new TrieNode();
        nNode = nNode.children[char];
      }
      nNode.isEndOfWord = true;
      nNode.stock = { symbol, name };
    });
  }

  search(prefix) {
    if (!prefix) return [];
    let node = this.root;
    const key = prefix.toLowerCase();
    for (let char of key) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    
    const results = [];
    const visited = new Set();
    const dfs = (curr) => {
      if (curr.isEndOfWord && curr.stock) {
        if (!visited.has(curr.stock.symbol)) {
          visited.add(curr.stock.symbol);
          results.push(curr.stock);
        }
      }
      for (let char in curr.children) {
        dfs(curr.children[char]);
      }
    };
    dfs(node);
    return results.slice(0, 8);
  }
}

// LRU Cache for O(1) Stock Price Caching
class LRUNode {
  constructor(key, val) {
    this.key = key;
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity = 5) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new LRUNode(0, 0);
    this.tail = new LRUNode(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToHead(node) {
    node.next = this.head.next;
    node.next.prev = node;
    this.head.next = node;
    node.prev = this.head;
  }

  get(key) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      this._remove(node);
      this._addToHead(node);
      return { val: node.val, hit: true };
    }
    return { val: null, hit: false };
  }

  put(key, val) {
    let evictedKey = null;
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = val;
      this._remove(node);
      this._addToHead(node);
    } else {
      if (this.map.size >= this.capacity) {
        const lruNode = this.tail.prev;
        evictedKey = lruNode.key;
        this._remove(lruNode);
        this.map.delete(lruNode.key);
      }
      const newNode = new LRUNode(key, val);
      this.map.set(key, newNode);
      this._addToHead(newNode);
    }
    return evictedKey;
  }

  getKeysOrdered() {
    const keys = [];
    let curr = this.head.next;
    while (curr !== this.tail) {
      keys.push({ symbol: curr.key, name: curr.val.name || curr.key, price: curr.val.price });
      curr = curr.next;
    }
    return keys;
  }
}

const TRIE_POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'RELINFRA', name: 'Reliance Infrastructure' },
  { symbol: 'RELIANCEIND', name: 'Reliance Industrial Infrastructure' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'WIPRO', name: 'Wipro Limited' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'ITC', name: 'ITC Limited' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever' },
  { symbol: 'LICI', name: 'LIC of India' },
];

const TradeArena = () => {
  const { user, updateUser } = useAuth();

  // ── Trie & LRU Refs ──
  const trieRef = useRef(null);
  const lruCacheRef = useRef(null);
  
  if (!trieRef.current) {
    trieRef.current = new StockTrie();
    TRIE_POPULAR_STOCKS.forEach(s => trieRef.current.insert(s.symbol, s.name));
  }
  
  if (!lruCacheRef.current) {
    lruCacheRef.current = new LRUCache(5);
  }

  // ── Cache HUD State ──
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);
  const [cacheList, setCacheList] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'market');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);
  const [trending, setTrending] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyPeriod, setHistoryPeriod] = useState('1mo');
  const [livePrice, setLivePrice] = useState(null);
  const [priceFlash, setPriceFlash] = useState(null);
  const prevLivePriceRef = useRef(null);
  const selectedStockRef = useRef(null);
  const prevSymbolRef = useRef(null);

  useEffect(() => {
    selectedStockRef.current = selectedStock;
  }, [selectedStock]);

  useEffect(() => {
    const currentPrice = livePrice || selectedStock?.price;
    const currentSymbol = selectedStock?.symbol;

    if (currentSymbol !== prevSymbolRef.current) {
      // Stock selection switched! Reset refs and do not flash
      prevSymbolRef.current = currentSymbol;
      prevLivePriceRef.current = currentPrice;
      setPriceFlash(null);
    } else {
      // Same stock, check for actual live price updates
      if (currentPrice && prevLivePriceRef.current !== null && currentPrice !== prevLivePriceRef.current) {
        const dir = currentPrice > prevLivePriceRef.current ? 'up' : 'down';
        setPriceFlash(dir);
        const timer = setTimeout(() => setPriceFlash(null), 1000);
        prevLivePriceRef.current = currentPrice;
        return () => clearTimeout(timer);
      } else if (currentPrice) {
        prevLivePriceRef.current = currentPrice;
      }
    }
  }, [livePrice, selectedStock]);

  const [chartType, setChartType] = useState('area'); // 'area' | 'candle'
  const [stopLossPercent, setStopLossPercent] = useState(5);
  const [journalTrades, setJournalTrades] = useState([]);
  const [selectedJournalTrade, setSelectedJournalTrade] = useState(null);

  // Buy/Sell form
  const [tradeForm, setTradeForm] = useState({
    type: 'BUY', quantity: 1, reasoning: ''
  });
  const [trading, setTrading] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showOptionsCalc, setShowOptionsCalc] = useState(false);
  const [optionsForm, setOptionsForm] = useState({
    stockPrice: '', strikePrice: '', daysToExpiry: 30,
    volatility: 25, optionType: 'CALL'
  });
  const [optionsResult, setOptionsResult] = useState(null);

  // AI Portfolio Risk Analysis
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const runRiskAnalysis = async () => {
    setShowRiskModal(true);
    if (riskAnalysis) return; // Use cached result
    setRiskLoading(true);
    try {
      const holdings = portfolio?.portfolio?.holdings || [];
      const { data } = await api.post('/mentor/portfolio-risk', {
        holdings,
        walletBalance,
        totalInvested: portfolio?.portfolio?.totalInvested || 0,
        currentValue: portfolio?.portfolio?.currentValue || 0
      });
      setRiskAnalysis(data.risk);
    } catch (e) {
      toast.error('Risk analysis failed');
    }
    setRiskLoading(false);
  };

  const [whatIfData, setWhatIfData] = useState(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  const loadWhatIfData = async (symbol) => {
    setLoadingWhatIf(true);
    try {
      const { data } = await api.get(`/market/returns/${symbol}`);
      if (data.success) {
        const ret1M = data.returns.oneMonth;
        const ret3M = data.returns.threeMonth;
        const ret1Y = data.returns.oneYear;

        const val1M = 10000 * (1 + ret1M / 100);
        const val3M = 10000 * (1 + ret3M / 100);
        const val1Y = 10000 * (1 + ret1Y / 100);

        const lumpsum1Y = 12000 * (1 + ret1Y / 100);
        const rMonthly = (ret1Y / 100) / 12;
        let sip1Y = 0;
        for (let m = 0; m < 12; m++) {
          sip1Y += 1000 * Math.pow(1 + rMonthly, 12 - m);
        }

        setWhatIfData({
          m1: { pct: ret1M, val: Math.round(val1M) },
          m3: { pct: ret3M, val: Math.round(val3M) },
          y1: { pct: ret1Y, val: Math.round(val1Y) },
          dca: {
            lumpsumVal: Math.round(lumpsum1Y),
            sipVal: Math.round(sip1Y),
            lumpsumPct: ret1Y,
            sipPct: +(((sip1Y - 12000) / 12000) * 100).toFixed(1)
          }
        });
      }
    } catch (e) {
      setWhatIfData(null);
    }
    setLoadingWhatIf(false);
  };

  const socketRef = useRef(null);

  // Limit Orders & Short Selling states
  const [orderExecType, setOrderExecType] = useState('MARKET'); // 'MARKET' | 'LIMIT'
  const [limitPrice, setLimitPrice] = useState('');
  const [limitOrders, setLimitOrders] = useState([]);
  const [shortPositions, setShortPositions] = useState([]);

  const placeLimitOrder = async () => {
    if (!selectedStock) return;
    const lPrice = parseFloat(limitPrice);
    if (isNaN(lPrice) || lPrice <= 0) {
      toast.error('Please enter a valid limit price');
      return;
    }
    const qty = parseInt(tradeForm.quantity);
    
    try {
      const { data } = await api.post('/trades/limit-orders', {
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        tradeType: tradeForm.type,
        quantity: qty,
        limitPrice: lPrice,
        reasoning: tradeForm.reasoning
      });
      if (data.success) {
        setLimitOrders(prev => [data.order, ...prev]);
        toast.success(`Limit Order placed! Will execute if ${selectedStock.symbol} touches ₹${lPrice.toFixed(2)} ⏰`);
        setShowTradeModal(false);
        setLimitPrice('');
        setTradeForm({ type: 'BUY', quantity: 1, reasoning: '' });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place limit order');
    }
  };

  const cancelLimitOrder = async (orderId) => {
    try {
      const { data } = await api.delete(`/trades/limit-orders/${orderId}`);
      if (data.success) {
        setLimitOrders(prev => prev.filter(o => (o._id || o.id) !== orderId));
        toast.success('Limit Order cancelled ✕');
      }
    } catch (e) {
      toast.error('Failed to cancel limit order');
    }
  };

  const executeShort = async () => {
    if (!selectedStock) return;
    const qty = parseInt(tradeForm.quantity);
    
    try {
      const { data } = await api.post('/trades/short-positions', {
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        quantity: qty,
        entryPrice: selectedStock.price,
        reasoning: tradeForm.reasoning
      });
      if (data.success) {
        setShortPositions(prev => [data.position, ...prev]);
        updateUser({ virtualWallet: data.walletBalance });
        const { data: journalRes } = await api.get('/trades/journal');
        if (journalRes.success) {
          setJournalTrades(journalRes.trades || []);
          setTradeHistory(journalRes.trades || []);
        }
        toast.success(`Shorted ${qty} shares of ${selectedStock.symbol} at ₹${selectedStock.price.toFixed(2)}! 📉`);
        setShowTradeModal(false);
        setTradeForm({ type: 'BUY', quantity: 1, reasoning: '' });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to open short position');
    }
  };

  const executeCover = async (pos, currentPrice) => {
    try {
      const { data } = await api.post(`/trades/short-positions/${pos._id || pos.id}/cover`, {
        exitPrice: currentPrice
      });
      if (data.success) {
        setShortPositions(prev => prev.filter(p => (p._id || p.id) !== (pos._id || pos.id)));
        updateUser({ virtualWallet: data.walletBalance });
        const { data: journalRes } = await api.get('/trades/journal');
        if (journalRes.success) {
          setJournalTrades(journalRes.trades || []);
          setTradeHistory(journalRes.trades || []);
        }
        const profitLoss = data.position.profitLoss;
        toast.success(`Covered short on ${pos.symbol} at ₹${currentPrice.toFixed(2)}! P&L: ₹${profitLoss.toFixed(2)}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cover short position');
    }
  };

  const exportToCSV = () => {
    if (!tradeHistory.length) {
      toast.error('No trade history to export');
      return;
    }
    const headers = ['Date', 'Symbol', 'Company Name', 'Type', 'Quantity', 'Execution Price', 'Total Value', 'Realized P&L'];
    const rows = tradeHistory.map(t => [
      new Date(t.timestamp).toLocaleDateString('en-IN'),
      t.symbol,
      t.companyName || '',
      t.tradeType,
      t.quantity,
      t.price,
      t.totalAmount,
      t.profitLoss || 0
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinBuddy_Trade_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Trade History exported as CSV! 📊');
  };

  const calculateMyTodayPnL = () => {
    if (!portfolio || !portfolio.portfolio || !portfolio.portfolio.totalInvested) return 0;
    const pnl = portfolio.portfolio.totalProfitLoss || 0;
    const invested = portfolio.portfolio.totalInvested || 1;
    return (pnl / invested) * 100;
  };

  const calculateTotalOpenPnL = () => {
    let holdingsPnL = portfolio?.portfolio?.totalProfitLoss || 0;
    let shortsPnL = 0;
    
    shortPositions.forEach(pos => {
      const match = trending.find(t => t.symbol === pos.symbol);
      const curPrice = match ? match.price : (selectedStock?.symbol === pos.symbol ? livePrice || selectedStock.price : pos.entryPrice);
      shortsPnL += (pos.entryPrice - curPrice) * pos.quantity;
    });
    
    return holdingsPnL + shortsPnL;
  };

  useEffect(() => {
    loadInitialData();
    setupMarketSocket();
    return () => {
      socketRef.current?.emit('market:unsubscribe');
      socketRef.current?.off('portfolio:update');
    };
  }, []);

  useEffect(() => {
    if (selectedStock) {
      loadPriceHistory(selectedStock.symbol, historyPeriod);
      loadWhatIfData(selectedStock.symbol);
      setOptionsForm(prev => ({ ...prev, stockPrice: selectedStock.price?.toFixed(2) || '' }));
    }
  }, [selectedStock, historyPeriod]);

  useEffect(() => {
    if (!socketRef.current) return;
    const symbols = new Set();
    if (selectedStock?.symbol) symbols.add(selectedStock.symbol);
    watchlist.forEach(w => { if (w.symbol) symbols.add(w.symbol); });
    portfolio?.portfolio?.holdings?.forEach(h => { if (h.symbol) symbols.add(h.symbol); });
    shortPositions.forEach(s => { if (s.symbol) symbols.add(s.symbol); });
    
    socketRef.current.emit('market:subscribe', { symbols: Array.from(symbols) });
  }, [selectedStock?.symbol, watchlist, portfolio?.portfolio?.holdings, shortPositions]);

  const setupMarketSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('market:subscribe', { symbols: [] });
    socket.on('market:price-update', (prices) => {
      setTrending(prev => {
        if (!prev.length) return prices;
        return prev.map(stock => {
          const update = prices.find(p => p.symbol === stock.symbol);
          return update ? { ...stock, ...update } : stock;
        });
      });
      // Update selected stock live price
      const currentSelected = selectedStockRef.current;
      if (currentSelected) {
        const update = prices.find(p => p.symbol === currentSelected.symbol);
        if (update) {
          setLivePrice(update.price);
          setSelectedStock(prev => {
            if (!prev) return prev;
            return { ...prev, ...update };
          });
          // Update the last candle/close in the priceHistory chart data!
          setPriceHistory(prevHistory => {
            if (!prevHistory || prevHistory.length === 0) return prevHistory;
            const updatedHistory = [...prevHistory];
            const lastIndex = updatedHistory.length - 1;
            const lastCandle = updatedHistory[lastIndex];
            
            const newClose = update.price;
            const newOpen = lastCandle.open !== undefined ? lastCandle.open : newClose;
            const newHigh = lastCandle.high !== undefined ? Math.max(lastCandle.high, newClose) : newClose;
            const newLow = lastCandle.low !== undefined ? Math.min(lastCandle.low, newClose) : newClose;
            
            updatedHistory[lastIndex] = {
              ...lastCandle,
              close: newClose,
              high: newHigh,
              low: newLow,
              body: [Math.min(newOpen, newClose), Math.max(newOpen, newClose)],
              shadow: [newLow, newHigh],
              color: newClose >= newOpen ? '#34D399' : '#F87171'
            };
            return updatedHistory;
          });
        }
      }
    });
    socket.on('portfolio:update', (data) => {
      if (data.message) {
        toast.success(data.message, { duration: 6000 });
      }
      if (data.walletBalance !== undefined) {
        updateUser({ virtualWallet: data.walletBalance });
      }
      loadInitialData();
    });
    socketRef.current = socket;
  };

  const loadInitialData = async () => {
    try {
      const [trendingRes, portfolioRes, watchlistRes, journalRes, limitOrdersRes, shortPositionsRes] = await Promise.allSettled([
        api.get('/market/trending'),
        api.get('/trades/portfolio'),
        api.get('/trades/watchlist'),
        api.get('/trades/journal'),
        api.get('/trades/limit-orders'),
        api.get('/trades/short-positions')
      ]);
      if (trendingRes.status === 'fulfilled') {
        const stocks = trendingRes.value.data.stocks || [];
        setTrending(stocks);
        if (stocks.length > 0) setSelectedStock(stocks[0]);
      }
      if (portfolioRes.status === 'fulfilled') setPortfolio(portfolioRes.value.data);
      if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value.data.stocks || []);
      if (journalRes.status === 'fulfilled') {
        const trades = journalRes.value.data.trades || [];
        setJournalTrades(trades);
        setTradeHistory(trades);
        if (trades.length > 0) setSelectedJournalTrade(trades[0]);
      }
      if (limitOrdersRes.status === 'fulfilled') {
        setLimitOrders(limitOrdersRes.value.data.orders || []);
      }
      if (shortPositionsRes.status === 'fulfilled') {
        setShortPositions(shortPositionsRes.value.data.positions || []);
      }
    } catch (e) { }
    setLoading(false);
  };

  const loadPriceHistory = async (symbol, period) => {
    try {
      const { data } = await api.get(`/market/history/${symbol}?period=${period}&interval=1d`);
      const candles = (data.candles || []).map(c => {
        const isUp = c.close >= c.open;
        return {
          date: new Date(c.time * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          close: c.close,
          open: c.open,
          high: c.high,
          low: c.low,
          volume: c.volume,
          body: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
          shadow: [c.low, c.high],
          color: isUp ? '#34D399' : '#F87171'
        };
      });
      setPriceHistory(candles);
    } catch (e) { setPriceHistory([]); }
  };

  const searchStocks = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    
    // Check local Trie first
    const trieMatches = trieRef.current.search(q);
    if (trieMatches.length > 0) {
      const formatted = trieMatches.map(m => ({
        symbol: m.symbol,
        name: m.name,
        exchange: 'NSE',
        type: 'trie'
      }));
      setSearchResults(formatted);
      return;
    }

    try {
      const { data } = await api.get(`/market/search?q=${q}`);
      setSearchResults(data.results || []);
    } catch (e) { }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStocks(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = async (result) => {
    setSearchQuery('');
    setSearchResults([]);
    
    // Check LRU Cache first
    const { val: cachedStock, hit } = lruCacheRef.current.get(result.symbol);
    if (hit) {
      setCacheHits(prev => prev + 1);
      setCacheList(lruCacheRef.current.getKeysOrdered());
      setSelectedStock(cachedStock);
      setActiveTab('market');
      toast.success(`[Cache HIT] Loaded ${result.symbol} in 0ms! ⚡`);
      return;
    }

    setCacheMisses(prev => prev + 1);
    const loadingToast = toast.loading(`[Cache MISS] Fetching ${result.symbol} (API)...`);
    
    try {
      // Simulate network latency for API fetch
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data } = await api.get(`/market/quote/${result.symbol}`);
      const stock = {
        symbol: result.symbol,
        name: result.name || result.symbol,
        price: data.quote.price,
        change: data.quote.change,
        changePercent: data.quote.changePercent,
        isUp: data.quote.change >= 0,
        pe: data.quote.pe,
        marketCap: data.quote.marketCap,
        week52High: data.quote.week52High,
        week52Low: data.quote.week52Low
      };
      
      // Store in LRU Cache
      const evicted = lruCacheRef.current.put(result.symbol, stock);
      setCacheList(lruCacheRef.current.getKeysOrdered());
      
      toast.dismiss(loadingToast);
      if (evicted) {
        toast.error(`[Cache EVICT] Evicted ${evicted} (LRU)! 🗑️`);
      } else {
        toast.success(`Loaded ${result.symbol} from server.`);
      }
      
      setSelectedStock(stock);
      setActiveTab('market');
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('Could not load stock');
    }
  };

  const executeTrade = async () => {
    if (!selectedStock) return;
    
    if (orderExecType === 'LIMIT') {
      placeLimitOrder();
      return;
    }
    
    if (tradeForm.type === 'SHORT') {
      executeShort();
      return;
    }

    setTrading(true);
    try {
      const endpoint = tradeForm.type === 'BUY' ? '/trades/buy' : '/trades/sell';
      const payload = {
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        quantity: parseInt(tradeForm.quantity),
        reasoning: tradeForm.reasoning
      };
      if (tradeForm.type === 'BUY') {
        payload.stopLossPrice = selectedStock.price * (1 - stopLossPercent/100);
      }
      const { data } = await api.post(endpoint, payload);

      toast.success(data.message);
      updateUser({ virtualWallet: data.walletBalance });
      setShowTradeModal(false);
      setTradeForm({ type: 'BUY', quantity: 1, reasoning: '' });
      loadInitialData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Trade failed');
    }
    setTrading(false);
  };

  const addToWatchlist = async (symbol, name) => {
    try {
      await api.post('/trades/watchlist', { symbol, companyName: name });
      toast.success('Added to watchlist ⭐');
      const { data } = await api.get('/trades/watchlist');
      setWatchlist(data.stocks || []);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await api.delete(`/trades/watchlist/${symbol}`);
      setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
      toast.success('Removed from watchlist');
    } catch (e) { }
  };

  // Price alert state per symbol: { [symbol]: { price: '', type: 'above' } }
  const [alertForms, setAlertForms] = useState({});
  const [settingAlert, setSettingAlert] = useState(null); // symbol being configured

  const saveAlert = async (symbol) => {
    const form = alertForms[symbol];
    if (!form?.price || isNaN(parseFloat(form.price))) {
      toast.error('Enter a valid target price');
      return;
    }
    try {
      await api.post('/trades/alert', {
        symbol,
        price: parseFloat(form.price),
        type: form.type || 'above'
      });
      toast.success(`🔔 Alert set: ${symbol} ${form.type || 'above'} ₹${form.price}`);
      setSettingAlert(null);
      const { data } = await api.get('/trades/watchlist');
      setWatchlist(data.stocks || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Alert save failed');
    }
  };

  const calculateOptions = async () => {
    try {
      const { data } = await api.post('/trades/options-price', optionsForm);
      setOptionsResult(data);
    } catch (e) { toast.error('Calculation failed'); }
  };

  const totalInvested = portfolio?.portfolio?.totalInvested || 0;
  const currentValue = portfolio?.portfolio?.currentValue || 0;
  const totalPnL = currentValue - totalInvested;
  const walletBalance = portfolio?.walletBalance ?? user?.virtualWallet ?? 0;
  const totalNetWorth = walletBalance + currentValue;
  const chartColor = selectedStock?.isUp !== false ? '#7C3AED' : '#ef4444';

  if (loading) return (
    <main className="lg:pl-72 flex-1 min-h-full flex items-center justify-center pt-20 lg:pt-0">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400">Loading live market data...</p>
      </div>
    </main>
  );

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">📈 TradeArena</h1>
            <p className="text-slate-400 text-sm">Practice investing with virtual money • Live NSE/BSE data</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Virtual Wallet</p>
              <p className="text-xl font-bold text-cyan-400">₹{walletBalance.toLocaleString('en-IN')}</p>
            </div>
            <Link to="/trade/strategy">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                🔬 Strategy Lab
              </button>
            </Link>
            <Link to="/trade/backtest">
              <button className="btn-secondary" style={{ width: 'auto', padding: '10px 16px' }}>
                ⏳ Time Machine
              </button>
            </Link>
            <button
              onClick={() => setShowOptionsCalc(true)}
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px' }}
            >
              ⚙️ Options Calc
            </button>
            <button
              onClick={runRiskAnalysis}
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px', background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
            >
              🧠 AI Risk
            </button>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('finbuddy_token');
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/pdf/annual-review`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (!res.ok) throw new Error('PDF generation failed');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = 'finbuddy-portfolio-report.pdf'; a.click();
                  URL.revokeObjectURL(url);
                  toast.success('📄 Portfolio PDF downloaded!');
                } catch (e) { toast.error('PDF download failed'); }
              }}
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px', background: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(6,182,212,0.08))', border: '1px solid rgba(34,197,94,0.25)', color: '#86efac' }}
            >
              📄 PDF Report
            </button>
          </div>
        </div>


        {/* Portfolio summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-xs text-slate-400">Total Net Worth</p>
            <p className="text-xl font-bold text-cyan-400">₹{totalNetWorth.toLocaleString('en-IN')}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-400">Invested</p>
            <p className="text-xl font-bold">₹{totalInvested.toLocaleString('en-IN')}</p>
          </div>
          <div className="card">
            <p className="text-xs text-slate-400">Current Value</p>
            <p className="text-xl font-bold">₹{currentValue.toLocaleString('en-IN')}</p>
          </div>
          <div className={`card ${totalPnL >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
            <p className="text-xs text-slate-400">Total P&L</p>
            <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Stock list + search */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                className="input-dark"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search stocks... (RELIANCE, TCS)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              {searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-[var(--bg-secondary)] border border-white/10 rounded-xl z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSearchResult(r)}
                      className="px-4 py-2 hover:bg-white/5 cursor-pointer text-sm flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{r.symbol}</span>
                        <span className="text-slate-400 ml-2">{r.name}</span>
                      </div>
                      {r.type === 'trie' && (
                        <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
                          Trie O(m)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LRU Cache Telemetry HUD */}
            <div className="card bg-white/3 border border-white/5 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  ⚙️ Stock Price LRU Cache HUD (Capacity: 5)
                </h4>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono">Telemetry</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono border-b border-white/5 pb-2">
                <div>
                  <p className="text-slate-500">Hits</p>
                  <p className="text-emerald-400 font-bold text-sm">{cacheHits}</p>
                </div>
                <div>
                  <p className="text-slate-500">Misses</p>
                  <p className="text-red-400 font-bold text-sm">{cacheMisses}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hit Rate</p>
                  <p className="text-cyan-400 font-bold text-sm">
                    {cacheHits + cacheMisses > 0 
                      ? `${Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)}%` 
                      : '0%'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cache State (MRU → LRU)</p>
                {cacheList.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic text-center py-1">Cache is empty.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {cacheList.map((item, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 ${
                          idx === 0 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold' 
                            : idx === cacheList.length - 1 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' 
                            : 'bg-white/5 text-slate-300 border-white/10'
                        }`}
                        title={idx === 0 ? 'Most Recently Used (MRU)' : idx === cacheList.length - 1 ? 'Least Recently Used (LRU) - Next to evict' : ''}
                      >
                        {item.symbol} (₹{Math.round(item.price)})
                        {idx === 0 && <span className="text-[8px]">🔥</span>}
                        {idx === cacheList.length - 1 && <span className="text-[8px]">⚠️</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {['market', 'watchlist', 'journal'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${
                    activeTab === t ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >{t}</button>
              ))}
            </div>

            {/* Stock list */}
            <div className="card p-2 max-h-[420px] overflow-y-auto space-y-1">
              {activeTab === 'market' && trending.map((stock) => (
                <StockRow key={stock.symbol} stock={stock} onSelect={setSelectedStock} isSelected={selectedStock?.symbol === stock.symbol} />
              ))}
              {activeTab === 'watchlist' && (
                watchlist.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <p>No stocks in watchlist</p>
                    <p className="text-xs mt-1">Click ⭐ on any stock to add</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {watchlist.map((stock) => (
                      <div key={stock.symbol} className="rounded-xl bg-white/3 border border-white/5 p-2">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 min-w-0">
                            <StockRow stock={stock} onSelect={setSelectedStock} isSelected={selectedStock?.symbol === stock.symbol} />
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => setSettingAlert(settingAlert === stock.symbol ? null : stock.symbol)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-lg transition ${
                                (stock.alerts?.length > 0) ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-400 hover:text-amber-400'
                              }`}
                              title="Set price alert"
                            >
                              🔔
                            </button>
                            <button onClick={() => removeFromWatchlist(stock.symbol)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                          </div>
                        </div>

                        {/* Existing active alerts */}
                        {stock.alerts?.filter(a => !a.isTriggered).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {stock.alerts.filter(a => !a.isTriggered).map((a, ai) => (
                              <span key={ai} className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                {a.type === 'above' ? '↑' : '↓'} ₹{a.price}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Alert form (collapsible) */}
                        {settingAlert === stock.symbol && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Set Price Alert</p>
                            <div className="flex gap-1.5">
                              <select
                                value={alertForms[stock.symbol]?.type || 'above'}
                                onChange={e => setAlertForms(p => ({ ...p, [stock.symbol]: { ...p[stock.symbol], type: e.target.value } }))}
                                className="text-[10px] bg-white/5 border border-white/10 rounded px-1 py-1 text-slate-300 flex-shrink-0"
                              >
                                <option value="above">↑ Above</option>
                                <option value="below">↓ Below</option>
                              </select>
                              <input
                                type="number"
                                placeholder="Target ₹"
                                value={alertForms[stock.symbol]?.price || ''}
                                onChange={e => setAlertForms(p => ({ ...p, [stock.symbol]: { ...p[stock.symbol], price: e.target.value } }))}
                                className="flex-1 text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white min-w-0"
                              />
                              <button
                                onClick={() => saveAlert(stock.symbol)}
                                className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/30 transition"
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
              {activeTab === 'journal' && (
                journalTrades.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <p>No journal entries found</p>
                    <p className="text-xs mt-1">Add reasoning to trades to start journaling</p>
                  </div>
                ) : journalTrades.map((trade, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedJournalTrade(trade)}
                    className={`p-3 rounded-xl cursor-pointer transition border text-left ${
                      selectedJournalTrade?._id === trade._id
                        ? 'bg-purple-500/15 border-purple-500/30 text-white font-bold'
                        : 'bg-white/3 border-transparent hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs uppercase">{trade.symbol}</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        trade.tradeType === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.tradeType}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{trade.companyName}</p>
                    <p className="text-[8px] text-slate-500 mt-1">{new Date(trade.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center + Right: Chart + details */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'journal' ? (
              selectedJournalTrade ? (
                <div className="card space-y-5 animate-fade-in border border-purple-500/20 shadow-[0_8px_32px_0_rgba(124,58,237,0.08)]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📖 Journal: {selectedJournalTrade.symbol}</span>
                      </h2>
                      <p className="text-xs text-slate-400">{selectedJournalTrade.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Date of Trade</p>
                      <p className="font-bold text-xs text-slate-300">{new Date(selectedJournalTrade.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-white/3 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Trade Action</span>
                      <span className={`text-sm font-extrabold ${selectedJournalTrade.tradeType === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedJournalTrade.tradeType}
                      </span>
                    </div>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Quantity</span>
                      <span className="text-sm font-extrabold text-white">{selectedJournalTrade.quantity}</span>
                    </div>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Execution Price</span>
                      <span className="text-sm font-extrabold text-white">₹{selectedJournalTrade.price.toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-white/3 rounded-xl border border-white/[0.03]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Total Value</span>
                      <span className="text-sm font-extrabold text-white">₹{selectedJournalTrade.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Trade Reasoning</span>
                    <div className="p-4 bg-white/3 rounded-2xl border border-white/5 text-xs text-slate-300 leading-relaxed italic">
                      "{selectedJournalTrade.reasoning}"
                    </div>
                  </div>

                  {selectedJournalTrade.aiReview ? (
                    <div className="card border border-purple-500/20 bg-purple-950/10 p-4 space-y-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <span className="text-xs font-black uppercase text-purple-300 tracking-wider">AI Coach Feedback</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Analysis Score:</span>
                          <span className="text-sm font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                            {selectedJournalTrade.aiScore}/10
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${selectedJournalTrade.aiScore * 10}%` }}
                        />
                      </div>

                      <p className="text-xs text-purple-200 leading-relaxed font-medium">
                        {selectedJournalTrade.aiReview}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center text-xs text-slate-500">
                      <p>AI Review has not been requested or computed for this trade yet.</p>
                      <button
                        onClick={async () => {
                          try {
                            const loadingToastId = toast.loading('Analyzing trade decision with AI...');
                            const res = await api.put(`/trades/${selectedJournalTrade._id}/reasoning`, {
                              reasoning: selectedJournalTrade.reasoning
                            });
                            if (res.data.success) {
                              toast.dismiss(loadingToastId);
                              toast.success('AI Coaching review received! 🤖');
                              setSelectedJournalTrade(res.data.trade);
                              loadInitialData(); // Refresh the full list
                            }
                          } catch (err) {
                            toast.dismiss();
                            toast.error('AI analysis failed');
                          }
                        }}
                        className="btn-primary mt-3 text-xs"
                        style={{ width: 'auto', padding: '8px 14px' }}
                      >
                        ⚡ Query AI Coach Review
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card flex items-center justify-center h-64 text-slate-500">
                  <p>Select a journal trade on the left to view AI Coaching review</p>
                </div>
              )
            ) : (
              <>
                {/* Stock details card */}
                {selectedStock ? (
                  <div className="card">
                    {/* Stock header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate" title={selectedStock.name || selectedStock.symbol}>
                          {selectedStock.name || selectedStock.symbol}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 font-bold tracking-wider mt-0.5">{selectedStock.symbol}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto shrink-0 border-t border-white/5 pt-3 sm:pt-0 sm:border-t-0">
                        <div className="text-left sm:text-right">
                          <p className={`text-2xl sm:text-3xl font-black ${
                            priceFlash === 'up' ? 'animate-flash-green' : 
                            priceFlash === 'down' ? 'animate-flash-red' : 'text-white'
                          }`}>₹{(livePrice || selectedStock.price)?.toFixed(2)}</p>
                          <p className={`text-xs sm:text-sm font-bold mt-0.5 ${selectedStock.isUp !== false ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedStock.isUp !== false ? '▲' : '▼'} ₹{Math.abs(selectedStock.change || 0).toFixed(2)} ({Math.abs(selectedStock.changePercent || 0).toFixed(2)}%)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToWatchlist(selectedStock.symbol, selectedStock.name)}
                            className="btn-secondary text-xs sm:text-sm"
                            style={{ padding: '8px 12px', width: 'auto' }}
                          >⭐</button>
                          <button
                            onClick={() => { setTradeForm({ ...tradeForm, type: 'BUY' }); setShowTradeModal(true); }}
                            className="btn-primary text-xs sm:text-sm"
                            style={{ padding: '8px 14px', width: 'auto', background: 'linear-gradient(135deg,#A78BFA,#00cc66)' }}
                          >BUY</button>
                          <button
                            onClick={() => { setTradeForm({ ...tradeForm, type: 'SELL' }); setShowTradeModal(true); }}
                            className="btn-primary text-xs sm:text-sm"
                            style={{ padding: '8px 14px', width: 'auto', background: 'linear-gradient(135deg,#F87171,#cc0000)' }}
                          >SELL</button>
                        </div>
                      </div>
                    </div>

                    {/* Period & Chart Type selector */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex gap-2">
                        {['5d', '1mo', '3mo', '6mo', '1y'].map(p => (
                          <button key={p} onClick={() => setHistoryPeriod(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                              historyPeriod === p ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
                            }`}
                          >{p}</button>
                        ))}
                      </div>
                      <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                        <button
                          onClick={() => setChartType('area')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                            chartType === 'area' ? 'bg-cyan-500/10 text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >Area</button>
                        <button
                          onClick={() => setChartType('candle')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                            chartType === 'candle' ? 'bg-cyan-500/10 text-cyan-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >Candles</button>
                      </div>
                    </div>

                    {/* Price chart */}
                    {priceHistory.length > 0 ? (
                      chartType === 'candle' ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={priceHistory}>
                            <XAxis dataKey="date" tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                              formatter={(v, name) => {
                                if (name === 'body') return [`₹${v[0]?.toFixed(2)} - ₹${v[1]?.toFixed(2)}`, 'Open/Close'];
                                if (name === 'shadow') return [`₹${v[0]?.toFixed(2)} - ₹${v[1]?.toFixed(2)}`, 'Low/High'];
                                return [`₹${v?.toFixed(2)}`, name];
                              }}
                              contentStyle={{ background: 'var(--bg-secondary)', border: `1px solid ${chartColor}33`, borderRadius: '8px' }}
                             cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                            {/* Hidden shadow bar to preserve tooltip entries */}
                            <Bar dataKey="shadow" barSize={0} opacity={0} />
                            {/* Open/Close Body bar with custom Candlestick wicks */}
                            <Bar dataKey="body" shape={<Candlestick />} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={priceHistory}>
                            <defs>
                              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#6366F1', fontSize: 10 }} tickLine={false} domain={['auto', 'auto']} />
                            <Tooltip
                              formatter={(v) => [`₹${v?.toFixed(2)}`, 'Price']}
                              contentStyle={{ background: 'var(--bg-secondary)', border: `1px solid ${chartColor}33`, borderRadius: '8px' }}
                             cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="h-48 flex items-center justify-center text-slate-500">
                        <p>Loading chart...</p>
                      </div>
                    )}

                    {/* Stock stats */}
                    {selectedStock.pe && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
                        {[
                          { label: 'P/E Ratio', value: selectedStock.pe?.toFixed(1) || 'N/A' },
                          { label: '52W High', value: selectedStock.week52High ? `₹${selectedStock.week52High?.toFixed(0)}` : 'N/A' },
                          { label: '52W Low', value: selectedStock.week52Low ? `₹${selectedStock.week52Low?.toFixed(0)}` : 'N/A' },
                          { label: 'Market Cap', value: selectedStock.marketCap ? `₹${(selectedStock.marketCap / 1e9)?.toFixed(0)}B` : 'N/A' },
                        ].map((item, i) => (
                          <div key={i} className="text-center">
                            <p className="text-xs text-slate-400">{item.label}</p>
                            <p className="font-bold text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card flex items-center justify-center h-64 bg-slate-950/20 border border-white/5 rounded-3xl">
                    <div className="text-center">
                      <div className="text-5xl mb-3 animate-pulse">📈</div>
                      <p className="font-bold text-lg text-white">Interactive Trading Terminal</p>
                      <p className="text-slate-400 text-xs mt-1">Select a stock from the list to analyze live chart and trade</p>
                    </div>
                  </div>
                )}


              </>
            )}
          </div>
        </div>

        {/* Unified Trading Status Hub (Full-Width Below Grid) */}
        {activeTab !== 'journal' && (
          <div className="mt-6">
                {/* Unified Trading Status Hub (Holdings, Shorts, Limits, Leaderboard) */}
                <div className="space-y-6 mt-6 border-t border-white/5 pt-6">
                  {/* Section Title & CSV Export */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>📊 Live Positions Hub</span>
                      </h3>
                      <p className="text-slate-400 text-xs">Manage your open positions, limit orders, and peer rankings</p>
                    </div>
                    <button
                      onClick={exportToCSV}
                      className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 border border-cyan-500/20 text-cyan-400"
                      style={{ width: 'auto' }}
                    >
                      <span>📥 Export CSV</span>
                    </button>
                  </div>

                  {/* Holdings & Shorts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Holdings */}
                    <div className="card bg-[var(--bg-secondary)] border border-white/5">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-slate-300">
                        <span>💼 Long Holdings</span>
                        <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                          {portfolio?.portfolio?.holdings?.length || 0}
                        </span>
                      </h4>
                      {portfolio?.portfolio?.holdings?.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {portfolio.portfolio.holdings.map((h, i) => (
                            <PortfolioCard key={i} holding={h} onUpdate={loadInitialData} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500 italic">
                          No long holdings. Place a BUY market/limit order to open a position.
                        </div>
                      )}
                    </div>

                    {/* Active Shorts */}
                    <div className="card bg-[var(--bg-secondary)] border border-white/5">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-slate-300">
                        <span>📉 Short Positions</span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
                          {shortPositions.length}
                        </span>
                      </h4>
                      {shortPositions.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {shortPositions.map((pos) => {
                            const match = trending.find(t => t.symbol === pos.symbol);
                            const currentPrice = match ? match.price : (selectedStock?.symbol === pos.symbol ? livePrice || selectedStock.price : pos.entryPrice);
                            const initialMargin = pos.entryPrice * pos.quantity;
                            const currentCost = currentPrice * pos.quantity;
                            const pl = initialMargin - currentCost;
                            const plPct = (pl / initialMargin) * 100;
                            const isProfit = pl >= 0;
                            return (
                              <div key={pos.id} className="p-3 bg-white/3 rounded-2xl border border-white/5 space-y-2 hover:border-white/10 transition">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-sm text-white">{pos.symbol}</p>
                                    <p className="text-[10px] text-slate-400 truncate max-w-28">{pos.companyName}</p>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {isProfit ? '+' : ''}{plPct.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300">
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Qty</span>
                                    <span className="font-mono">{pos.quantity}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Short Price</span>
                                    <span className="font-mono">₹{pos.entryPrice.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Current</span>
                                    <span className="font-mono">₹{currentPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                  <div>
                                    <span className="text-slate-500 text-[9px] uppercase font-bold block">Unrealized P&L</span>
                                    <span className={`font-mono font-bold text-xs ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                      {isProfit ? '+' : ''}₹{pl.toFixed(2)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => executeCover(pos, currentPrice)}
                                    className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-purple-500 text-white hover:bg-purple-600 transition"
                                  >
                                    Cover Short
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500 italic">
                          No active short positions. Place a SHORT order to simulate short selling.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Limit Orders & Peer Leaderboard Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Limit Orders */}
                    <div className="card bg-[var(--bg-secondary)] border border-white/5">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-slate-300">
                        <span>⏰ Active Limit Orders</span>
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold">
                          {limitOrders.length}
                        </span>
                      </h4>
                      {limitOrders.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {limitOrders.map((ord) => (
                            <div key={ord.id} className="p-3 bg-white/3 rounded-2xl border border-white/5 space-y-2 hover:border-white/10 transition">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-sm text-white">{ord.symbol}</p>
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                                    ord.tradeType === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {ord.tradeType}
                                  </span>
                                </div>
                                <button
                                  onClick={() => cancelLimitOrder(ord._id || ord.id)}
                                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Qty</span>
                                  <span>{ord.quantity}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Target Price</span>
                                  <span className="font-mono text-cyan-400 font-bold">₹{ord.limitPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500 italic">
                          No pending limit orders. Select "Limit" order execution in trade form.
                        </div>
                      )}
                    </div>

                    {/* Peer Leaderboard */}
                    <div className="card bg-[var(--bg-secondary)] border border-white/5">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-slate-300">
                        <span>🏆 Campus Leaderboard</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold ml-auto">Simulated</span>
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {[
                          { name: 'You (FinBuddy)', profitPct: calculateMyTodayPnL(), avatar: '👑', isUser: true },
                          { name: 'Arjun K. (IIT Bombay)', profitPct: 14.5, avatar: '👨‍🎓' },
                          { name: 'Priya M. (BITS Pilani)', profitPct: 12.2, avatar: '👩‍🎓' },
                          { name: 'Ananya V. (NIT Trichy)', profitPct: 8.9, avatar: '👩‍🎓' },
                          { name: 'Rohan S. (Delhi University)', profitPct: -3.4, avatar: '👨‍🎓' }
                        ].sort((a, b) => b.profitPct - a.profitPct).map((peer, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                              peer.isUser
                                ? 'bg-cyan-500/10 border-cyan-500/30 font-bold text-white shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                : 'bg-white/3 border-transparent text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{peer.avatar}</span>
                              <span className="truncate max-w-[150px]">{peer.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${peer.profitPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {peer.profitPct >= 0 ? '+' : ''}{peer.profitPct.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        )}

        {/* ─── Sector Heatmap & Stock Screener ─── */}
        <div className="mt-8 border-t border-white/5 pt-8">
          <SectorScreener onSelectStock={(stock) => {
            const fullSymbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.NS`;
            setSelectedStock({
              ...stock,
              symbol: fullSymbol
            });
            setLivePrice(stock.price);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast.success(`Loaded ${stock.symbol} into analyzer! 📈`);
          }} />
        </div>

        {/* ─── IPO Arena ─── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🏛️ IPO Arena</h2>
            <span className="text-xs text-slate-400">Apply with virtual money • 40% allotment chance</span>
          </div>
          <IPOArena />
        </div>

        {/* ─── Mutual Fund SIP ─── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">💼 Mutual Fund SIP</h2>
            <span className="text-xs text-slate-400">Real AMFI data • Simulate monthly investments</span>
          </div>
          <MutualFundSIP />
        </div>

        {/* Buy/Sell/Short Modal */}
        {showTradeModal && selectedStock && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  <span className={tradeForm.type === 'BUY' ? 'text-green-400' : tradeForm.type === 'SHORT' ? 'text-purple-400' : 'text-red-400'}>
                    {tradeForm.type}
                  </span> {selectedStock.name}
                </h2>
                <button onClick={() => setShowTradeModal(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                  <button onClick={() => { setTradeForm({ ...tradeForm, type: 'BUY' }); setOrderExecType('MARKET'); }}
                    className={`flex-1 py-2 rounded-xl font-bold transition ${tradeForm.type === 'BUY' ? 'bg-green-500 text-white' : 'text-slate-400'}`}
                  >BUY</button>
                  <button onClick={() => { setTradeForm({ ...tradeForm, type: 'SELL' }); setOrderExecType('MARKET'); }}
                    className={`flex-1 py-2 rounded-xl font-bold transition ${tradeForm.type === 'SELL' ? 'bg-red-500 text-white' : 'text-slate-400'}`}
                  >SELL</button>
                  <button onClick={() => { setTradeForm({ ...tradeForm, type: 'SHORT' }); setOrderExecType('MARKET'); }}
                    className={`flex-1 py-2 rounded-xl font-bold transition ${tradeForm.type === 'SHORT' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                  >SHORT</button>
                </div>

                <div className="card bg-[var(--bg-primary)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Market Price</span>
                    <span className="font-bold">₹{selectedStock.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">Available Wallet</span>
                    <span className="font-bold text-cyan-400">₹{walletBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Execution Type Selector */}
                {tradeForm.type !== 'SHORT' && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Execution Type</label>
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                      <button onClick={() => setOrderExecType('MARKET')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${orderExecType === 'MARKET' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
                      >Market</button>
                      <button onClick={() => setOrderExecType('LIMIT')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${orderExecType === 'LIMIT' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
                      >Limit</button>
                    </div>
                  </div>
                )}

                {orderExecType === 'LIMIT' && tradeForm.type !== 'SHORT' && (
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Limit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-dark font-mono"
                      placeholder={`e.g. ${selectedStock.price?.toFixed(2)}`}
                      value={limitPrice}
                      onChange={e => setLimitPrice(e.target.value)}
                    />
                  </div>
                )}

                {/* Live Price Impact Calculator (What-If) */}
                {tradeForm.type === 'BUY' && (() => {
                  if (loadingWhatIf) {
                    return (
                      <div className="card bg-[var(--bg-primary)] p-4 text-center text-xs text-slate-400">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading historical What-If performance...
                      </div>
                    );
                  }
                  if (!whatIfData) return null;
                  return (
                    <div className="space-y-2">
                      <div className="card bg-[var(--bg-primary)] border border-cyan-500/10 p-3 space-y-2">
                        <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest block">
                          📈 Historical What-If Impact (If you had bought ₹10,000)
                        </span>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {Object.entries(whatIfData).filter(([k]) => k !== 'dca').map(([period, data]) => {
                            const isUp = data.pct >= 0;
                            const label = { m1: '1 Month Ago', m3: '3 Months Ago', y1: '1 Year Ago' }[period];
                            return (
                              <div key={period} className="text-center p-2 bg-white/3 rounded-xl border border-white/[0.03]">
                                <p className="text-[8px] text-slate-500 font-bold uppercase">{label}</p>
                                <p className="font-bold text-xs mt-1 text-white">₹{data.val.toLocaleString('en-IN')}</p>
                                <p className={`text-[9px] font-black mt-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                  {isUp ? '▲' : '▼'} {Math.abs(data.pct)}%
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* DCA Compounding Impact Card */}
                      <div className="card bg-[var(--bg-primary)] border border-purple-500/10 p-3 space-y-2">
                        <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block">
                          ⚖️ DCA SIP vs. Lumpsum (Compounding over last 1Y - Total ₹12,000)
                        </span>
                        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                          <div className="p-2 bg-white/3 rounded-xl border border-white/[0.03] text-center">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">1Y Lumpsum (₹12K)</span>
                            <span className="font-bold text-white block mt-1">₹{whatIfData.dca.lumpsumVal.toLocaleString('en-IN')}</span>
                            <span className={`text-[9px] font-bold ${whatIfData.dca.lumpsumPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {whatIfData.dca.lumpsumPct >= 0 ? '▲' : '▼'} {Math.abs(whatIfData.dca.lumpsumPct)}% yield
                            </span>
                          </div>
                          <div className="p-2 bg-white/3 rounded-xl border border-white/[0.03] text-center">
                            <span className="text-[8px] text-slate-500 font-bold uppercase block">1Y Monthly SIP (₹1K)</span>
                            <span className="font-bold text-white block mt-1">₹{whatIfData.dca.sipVal.toLocaleString('en-IN')}</span>
                            <span className={`text-[9px] font-bold ${whatIfData.dca.sipPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {whatIfData.dca.sipPct >= 0 ? '▲' : '▼'} {Math.abs(whatIfData.dca.sipPct)}% yield
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="input-dark"
                    value={tradeForm.quantity}
                    onChange={e => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                  />
                </div>

                {/* Stop Loss Simulator Slider */}
                {tradeForm.type === 'BUY' && (
                  <div className="card bg-[var(--bg-primary)] border border-rose-500/10 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Stop-Loss Protection Level:</span>
                      <span className="font-bold text-red-400">{stopLossPercent}%</span>
                    </div>
                    <input
                      type="range" min="1" max="25" value={stopLossPercent}
                      onChange={e => setStopLossPercent(parseInt(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Trigger Price: ₹{(selectedStock.price * (1 - stopLossPercent/100)).toFixed(2)}</span>
                      <span>Max Simulated Risk: ₹{((selectedStock.price * tradeForm.quantity) * (stopLossPercent/100)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="card bg-[var(--bg-primary)]">
                  <div className="flex justify-between font-bold">
                    <span>Total Amount</span>
                    <span className={tradeForm.type === 'BUY' ? 'text-red-400' : tradeForm.type === 'SHORT' ? 'text-purple-400' : 'text-green-400'}>
                      {tradeForm.type === 'BUY' || tradeForm.type === 'SHORT' ? '-' : '+'}₹{((orderExecType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : selectedStock.price) * tradeForm.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">
                    Why this trade? <span className="text-xs">(AI will score your reasoning)</span>
                  </label>
                  <textarea
                    className="input-dark resize-none h-20"
                    placeholder="e.g. Q3 results were strong, PE ratio is 14, standard breakout, stoploss set at 5%..."
                    value={tradeForm.reasoning}
                    onChange={e => setTradeForm({ ...tradeForm, reasoning: e.target.value })}
                  />
                </div>

                {/* AI Reasoning Quality Gauge */}
                {(() => {
                  const assessment = getReasoningScore(tradeForm.reasoning);
                  return (
                    <div className="card bg-[var(--bg-primary)] border border-white/5 p-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">AI Reasoning Quality Rank:</span>
                        <span className={assessment.color}>{assessment.label}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${assessment.barCol}`} style={{ width: `${assessment.score}%` }} />
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 italic">{assessment.feedback}</p>
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button onClick={() => setShowTradeModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={executeTrade}
                    disabled={trading}
                    className="flex-1 py-3 rounded-xl font-bold text-white transition"
                    style={{ background: tradeForm.type === 'BUY' ? 'linear-gradient(135deg,#A78BFA,#00cc66)' : tradeForm.type === 'SHORT' ? 'linear-gradient(135deg,#8B5CF6,#6366F1)' : 'linear-gradient(135deg,#F87171,#cc0000)' }}
                  >
                    {trading ? 'Processing...' : `Confirm ${tradeForm.type}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Options Calculator Modal */}
        {showOptionsCalc && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-lg animate-fade-in max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">⚙️ Options Pricing</h2>
                  <p className="text-xs text-slate-400">Black-Scholes Model</p>
                </div>
                <button onClick={() => setShowOptionsCalc(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Stock Price (₹)</label>
                  <input type="number" className="input-dark" value={optionsForm.stockPrice} onChange={e => setOptionsForm({ ...optionsForm, stockPrice: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Strike Price (₹)</label>
                  <input type="number" className="input-dark" value={optionsForm.strikePrice} onChange={e => setOptionsForm({ ...optionsForm, strikePrice: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Days to Expiry</label>
                  <input type="number" className="input-dark" value={optionsForm.daysToExpiry} onChange={e => setOptionsForm({ ...optionsForm, daysToExpiry: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Volatility (%)</label>
                  <input type="number" className="input-dark" value={optionsForm.volatility} onChange={e => setOptionsForm({ ...optionsForm, volatility: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {['CALL', 'PUT'].map(t => (
                  <button key={t} onClick={() => setOptionsForm({ ...optionsForm, optionType: t })}
                    className={`flex-1 py-2 rounded-xl font-bold transition ${optionsForm.optionType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-white/5 text-slate-400'}`}
                  >{t}</button>
                ))}
              </div>

              <button onClick={calculateOptions} className="btn-primary mb-4">Calculate Price</button>

              {optionsResult?.result && (
                <div className="card bg-[var(--bg-primary)] space-y-3">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">Theoretical Premium</p>
                    <p className="text-3xl font-bold text-cyan-400">₹{optionsResult.result.price}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Delta', value: optionsResult.result.delta },
                      { label: 'Gamma', value: optionsResult.result.gamma },
                      { label: 'Theta/day', value: optionsResult.result.theta },
                      { label: 'Vega/1%', value: optionsResult.result.vega },
                    ].map((g, i) => (
                      <div key={i} className="text-center p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-slate-400">{g.label}</p>
                        <p className="font-bold text-sm">{g.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-slate-400">Intrinsic Value</p>
                      <p className="font-bold">₹{optionsResult.result.intrinsicValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Time Value</p>
                      <p className="font-bold">₹{optionsResult.result.timeValue?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Floating P&L Ticker */}
        {(() => {
          const totalPnL = calculateTotalOpenPnL();
          const isUp = totalPnL >= 0;
          return (
            <div className="fixed bottom-4 right-4 z-40 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 px-4 flex items-center gap-3 shadow-2xl transition hover:scale-105">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-green-400 animate-ping' : 'bg-red-400 animate-ping'}`} />
                Live Hub P&L:
              </span>
              <span className={`font-mono font-black text-xs transition-all duration-300 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '▲ +' : '▼ -'}₹{Math.abs(totalPnL).toFixed(2)}
              </span>
            </div>
          );
        })()}
        <SectionGuide sectionId="/trade" />
      </main>

      {/* ─── AI Portfolio Risk Modal ─── */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in border-violet-500/30">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold gradient-text">🧠 AI Portfolio Risk Analysis</h2>
                <p className="text-slate-400 text-xs mt-0.5">CFA-grade quantitative risk scoring powered by AI</p>
              </div>
              <button onClick={() => setShowRiskModal(false)} className="text-slate-400 hover:text-white text-2xl transition">×</button>
            </div>

            {riskLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🧠</div>
                </div>
                <p className="text-violet-400 font-medium">Analysing portfolio with institutional-grade AI...</p>
                <p className="text-slate-500 text-xs">Computing concentration risk, VaR, sector exposure...</p>
              </div>
            ) : riskAnalysis ? (
              <div className="space-y-5">

                {/* Overall Risk Score */}
                <div className={`rounded-2xl p-5 text-center border ${
                  riskAnalysis.overallScore >= 70 ? 'bg-red-950/30 border-red-500/30' :
                  riskAnalysis.overallScore >= 50 ? 'bg-orange-950/30 border-orange-500/30' :
                  riskAnalysis.overallScore >= 30 ? 'bg-yellow-950/30 border-yellow-500/30' :
                  'bg-green-950/30 border-green-500/30'
                }`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Overall Portfolio Risk Score</p>
                  <div className="flex items-center justify-center gap-6">
                    <div>
                      <p className={`text-6xl font-black ${
                        riskAnalysis.overallScore >= 70 ? 'text-red-400' :
                        riskAnalysis.overallScore >= 50 ? 'text-orange-400' :
                        riskAnalysis.overallScore >= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>{riskAnalysis.overallScore}</p>
                      <p className="text-xs text-slate-400 mt-1">/ 100 (higher = riskier)</p>
                    </div>
                    <div className="text-left space-y-2">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Risk Level</p>
                        <p className={`font-black text-lg ${
                          riskAnalysis.riskLevel === 'Very High' ? 'text-red-400' :
                          riskAnalysis.riskLevel === 'High' ? 'text-orange-400' :
                          riskAnalysis.riskLevel === 'Moderate' ? 'text-yellow-400' : 'text-green-400'
                        }`}>{riskAnalysis.riskLevel}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Diversification</p>
                        <p className="font-bold text-cyan-400">{riskAnalysis.diversificationScore}/100</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">Volatility</p>
                        <p className={`font-bold ${
                          riskAnalysis.volatilityRating === 'High' ? 'text-red-400' :
                          riskAnalysis.volatilityRating === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>{riskAnalysis.volatilityRating}</p>
                      </div>
                    </div>
                  </div>
                  {/* Risk Score Bar */}
                  <div className="mt-4">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${riskAnalysis.overallScore}%`,
                          background: riskAnalysis.overallScore >= 70 ? '#ef4444' :
                            riskAnalysis.overallScore >= 50 ? '#f97316' :
                            riskAnalysis.overallScore >= 30 ? '#eab308' : '#22c55e'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                      <span>Low Risk</span><span>Moderate</span><span>High</span><span>Very High</span>
                    </div>
                  </div>
                </div>

                {/* Concentration bars */}
                {riskAnalysis.concentration?.length > 0 && (
                  <div className="card bg-[var(--bg-primary)]">
                    <h3 className="font-bold mb-3 text-sm">📊 Holdings Concentration</h3>
                    <div className="space-y-2">
                      {riskAnalysis.concentration.slice(0, 8).map((c, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{c.symbol}</span>
                            <span className={c.weight > 40 ? 'text-red-400 font-bold' : 'text-slate-400'}>{c.weight}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${c.weight}%`,
                                background: c.weight > 40 ? '#ef4444' : c.weight > 25 ? '#f97316' : '#7C3AED'
                              }}
                            />
                          </div>
                          {c.alert && <p className="text-[10px] text-red-400 mt-0.5">⚠️ {c.alert}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sector Exposure */}
                {riskAnalysis.sectorExposure?.length > 0 && (
                  <div className="card bg-[var(--bg-primary)]">
                    <h3 className="font-bold mb-3 text-sm">🏭 Sector Exposure</h3>
                    <div className="space-y-2">
                      {riskAnalysis.sectorExposure.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-28 truncate">{s.sector}</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                              style={{ width: `${s.weight}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{s.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                {riskAnalysis.insights?.length > 0 && (
                  <div className="card bg-[var(--bg-primary)]">
                    <h3 className="font-bold mb-3 text-sm">💡 Key Insights</h3>
                    <div className="space-y-2">
                      {riskAnalysis.insights.map((insight, i) => (
                        <div key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-violet-400 shrink-0">→</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Comment & Recommendation */}
                <div className="card bg-gradient-to-br from-violet-950/30 to-pink-950/10 border-violet-500/20">
                  <p className="text-xs text-violet-400 font-bold uppercase tracking-wider mb-2">🤖 AI Risk Commentary</p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">{riskAnalysis.aiComment}</p>
                  <div className="border-t border-violet-500/15 pt-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommended Action</p>
                    <p className="text-sm text-cyan-300 font-medium">{riskAnalysis.recommendation}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setRiskAnalysis(null); setRiskLoading(false); runRiskAnalysis(); }}
                  className="btn-secondary w-full"
                >
                  🔄 Re-run Analysis
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    
    </div>
  );
};

export default TradeArena;
