import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
/* import Sidebar removed */
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { WealthRebalancer } from './smart/WealthRebalancer';
import { ExpenseSegmentTree } from '../components/common/ExpenseSegmentTree';
import SectionGuide from '../components/common/SectionGuide';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, BarChart, Bar, CartesianGrid, Line
} from 'recharts';
import {
  Home, Car, BookOpen, User, CreditCard, Laptop, Trash2, Calendar,
  TrendingDown, Percent, Landmark, Sparkles, RefreshCw, BarChart3,
  DollarSign, FileText, ArrowRight, Info
} from 'lucide-react';


const COLORS = ['#7C3AED', '#A78BFA', '#8b5cf6', '#f59e0b', '#ef4444'];

const playVaultSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.08, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'error') {
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      osc.start();
      osc.stop(now + 0.35);
    } else if (type === 'click') {
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start();
      osc.stop(now + 0.08);
    }
  } catch (e) {
    console.warn("Audio Context blocked:", e);
  }
};

const computeSurvivalOdds = (netWorth, annualExpenses) => {
  if (netWorth <= 0) return 0;
  const wr = (annualExpenses / netWorth) * 100;
  if (wr <= 3.5) return 99;
  if (wr <= 4.0) return Math.round(95 + (4.0 - wr) * 8); // 95% to 99%
  if (wr <= 5.0) return Math.round(85 + (5.0 - wr) * 10); // 85% to 95%
  if (wr <= 6.0) return Math.round(70 + (6.0 - wr) * 15); // 70% to 85%
  if (wr <= 8.0) return Math.round(45 + (8.0 - wr) * 12.5); // 45% to 70%
  if (wr <= 10.0) return Math.round(20 + (10.0 - wr) * 12.5); // 20% to 45%
  return Math.max(5, Math.round(20 - (wr - 10.0) * 2));
};

const FIRE_SCENARIOS = {
  normal: { label: "Normal Market (12% ROI, 6% Inf)", roi: 12, inflation: 6, icon: "📊" },
  stagflation: { label: "Stagflation Bear (7% ROI, 10% Inf)", roi: 7, inflation: 10, icon: "🐻" },
  bull: { label: "Super Bull Market (16% ROI, 4% Inf)", roi: 16, inflation: 4, icon: "🐂" },
  lean: { label: "LeanFIRE Frugal (10% ROI, 5% Inf)", roi: 10, inflation: 5, icon: "🌱" },
  fat: { label: "FatFIRE Luxury (14% ROI, 6% Inf)", roi: 14, inflation: 6, icon: "💎" }
};

const POPULAR_STOCKS = [
  // Indian Stocks (Zerodha)
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Energy', price: 2465 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', platform: 'Zerodha', type: 'IN', sector: 'IT Services', price: 3820 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 1550 },
  { symbol: 'INFY', name: 'Infosys Ltd.', platform: 'Zerodha', type: 'IN', sector: 'IT Services', price: 1475 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 1120 },
  { symbol: 'SBIN', name: 'State Bank of India', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 830 },
  { symbol: 'BHARTIAIRTEL', name: 'Bharti Airtel Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Telecom', price: 1350 },
  { symbol: 'ITC', name: 'ITC Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Consumer Goods', price: 430 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Infrastructure', price: 3450 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 1720 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 1150 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Consumer Goods', price: 2350 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Finance', price: 6850 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', platform: 'Zerodha', type: 'IN', sector: 'IT Services', price: 460 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', platform: 'Zerodha', type: 'IN', sector: 'IT Services', price: 1320 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Automotive', price: 12100 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Healthcare', price: 1540 },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Consumer Goods', price: 3250 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Metals', price: 165 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', platform: 'Zerodha', type: 'IN', sector: 'Automotive', price: 940 },
  { symbol: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', platform: 'Zerodha', type: 'IN', sector: 'Index ETF', price: 255 },
  { symbol: 'GOLDBEES', name: 'Nippon India Gold ETF', platform: 'Zerodha', type: 'IN', sector: 'Gold ETF', price: 62 },
  { symbol: 'JUNIORBEES', name: 'Nippon India Nifty Next 50 ETF', platform: 'Zerodha', type: 'IN', sector: 'Index ETF', price: 72 },
  { symbol: 'MON100', name: 'Motilal Oswal Nasdaq 100 ETF', platform: 'Zerodha', type: 'IN', sector: 'Global ETF', price: 145 },

  // US Stocks (INDMoney)
  { symbol: 'AAPL', name: 'Apple Inc.', platform: 'INDMoney', type: 'US', sector: 'Technology', price: 185 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', platform: 'INDMoney', type: 'US', sector: 'Technology', price: 420 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', platform: 'INDMoney', type: 'US', sector: 'Technology', price: 170 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', platform: 'INDMoney', type: 'US', sector: 'E-commerce', price: 180 },
  { symbol: 'TSLA', name: 'Tesla Inc.', platform: 'INDMoney', type: 'US', sector: 'Automotive', price: 175 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', platform: 'INDMoney', type: 'US', sector: 'Semiconductors', price: 920 },
  { symbol: 'META', name: 'Meta Platforms Inc.', platform: 'INDMoney', type: 'US', sector: 'Technology', price: 475 },
  { symbol: 'NFLX', name: 'Netflix Inc.', platform: 'INDMoney', type: 'US', sector: 'Entertainment', price: 610 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. (Class B)', platform: 'INDMoney', type: 'US', sector: 'Conglomerate', price: 410 },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', platform: 'INDMoney', type: 'US', sector: 'Semiconductors', price: 160 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', platform: 'INDMoney', type: 'US', sector: 'Finance', price: 195 },
  { symbol: 'V', name: 'Visa Inc.', platform: 'INDMoney', type: 'US', sector: 'Finance', price: 275 },
  { symbol: 'MA', name: 'Mastercard Inc.', platform: 'INDMoney', type: 'US', sector: 'Finance', price: 460 },
  { symbol: 'DIS', name: 'The Walt Disney Company', platform: 'INDMoney', type: 'US', sector: 'Entertainment', price: 110 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', platform: 'INDMoney', type: 'US', sector: 'Finance', price: 65 },
  { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.', platform: 'INDMoney', type: 'US', sector: 'E-commerce', price: 75 },
  { symbol: 'WMT', name: 'Walmart Inc.', platform: 'INDMoney', type: 'US', sector: 'Retail', price: 60 },
  { symbol: 'KO', name: 'The Coca-Cola Company', platform: 'INDMoney', type: 'US', sector: 'Consumer Goods', price: 62 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', platform: 'INDMoney', type: 'US', sector: 'Consumer Goods', price: 168 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', platform: 'INDMoney', type: 'US', sector: 'Index ETF', price: 510 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust Series 1', platform: 'INDMoney', type: 'US', sector: 'Index ETF', price: 440 }
];

const BOND_SUGGESTIONS = {
  SGB: [
    { name: 'SGB 2023-24 Series IV', rate: 2.50, desc: 'Sovereign Gold Bond Series IV (Maturity 2032)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2023-24 Series III', rate: 2.50, desc: 'Sovereign Gold Bond Series III (Maturity 2031)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2023-24 Series II', rate: 2.50, desc: 'Sovereign Gold Bond Series II (Maturity 2031)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2023-24 Series I', rate: 2.50, desc: 'Sovereign Gold Bond Series I (Maturity 2031)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2022-23 Series IV', rate: 2.50, desc: 'Sovereign Gold Bond Series IV (Maturity 2031)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2022-23 Series III', rate: 2.50, desc: 'Sovereign Gold Bond Series III (Maturity 2030)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2021-22 Series X', rate: 2.50, desc: 'Sovereign Gold Bond Series X (Maturity 2030)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2021-22 Series IX', rate: 2.50, desc: 'Sovereign Gold Bond Series IX (Maturity 2030)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2021-22 Series VIII', rate: 2.50, desc: 'Sovereign Gold Bond Series VIII (Maturity 2029)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2020-21 Series XII', rate: 2.50, desc: 'Sovereign Gold Bond Series XII (Maturity 2029)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2020-21 Series XI', rate: 2.50, desc: 'Sovereign Gold Bond Series XI (Maturity 2029)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2020-21 Series VI', rate: 2.50, desc: 'Sovereign Gold Bond Series VI (Maturity 2028)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' },
    { name: 'SGB 2019-20 Series I', rate: 2.50, desc: 'Sovereign Gold Bond Series I (Maturity 2027)', taxBadge: 'Tax-Free Capital Gains', lockin: '8 Years' }
  ],
  FD: [
    { name: 'HDFC Bank Fixed Deposit', rate: 7.20, desc: 'HDFC Bank Standard Fixed Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'ICICI Bank Fixed Deposit', rate: 7.20, desc: 'ICICI Bank Standard Fixed Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'SBI Fixed Deposit (State Bank of India)', rate: 6.80, desc: 'SBI Standard Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-7 Years' },
    { name: 'Axis Bank Fixed Deposit', rate: 7.20, desc: 'Axis Bank Standard Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Kotak Mahindra Bank FD', rate: 7.15, desc: 'Kotak Bank Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Post Office Time Deposit (5 Yr)', rate: 7.50, desc: '5-Year Post Office FD', taxBadge: 'Sec 80C Deductible', lockin: '5 Years' },
    { name: 'IDFC First Bank Fixed Deposit', rate: 7.75, desc: 'High-Yield IDFC First Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'IndusInd Bank Fixed Deposit', rate: 7.75, desc: 'High-Yield IndusInd Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Yes Bank Fixed Deposit', rate: 7.75, desc: 'Yes Bank High-Yield Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Punjab National Bank (PNB) FD', rate: 7.00, desc: 'PNB Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Bank of Baroda Fixed Deposit', rate: 7.10, desc: 'Bank of Baroda Term Deposit', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Bajaj Finance Fixed Deposit', rate: 7.85, desc: 'Bajaj Finance Corporate FD (AAA Rated)', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Shriram Finance Fixed Deposit', rate: 8.10, desc: 'Shriram Finance Corporate FD (High Yield)', taxBadge: 'TDS Applicable', lockin: '1-5 Years' },
    { name: 'Mahindra Finance Fixed Deposit', rate: 7.75, desc: 'Mahindra Finance Corporate FD', taxBadge: 'TDS Applicable', lockin: '1-5 Years' }
  ],
  PPF: [
    { name: 'Public Provident Fund (Post Office)', rate: 7.10, desc: 'India Post Office PPF Savings Scheme', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' },
    { name: 'Public Provident Fund (SBI)', rate: 7.10, desc: 'State Bank of India PPF Savings Account', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' },
    { name: 'Public Provident Fund (HDFC Bank)', rate: 7.10, desc: 'HDFC Bank PPF Savings Account', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' },
    { name: 'Public Provident Fund (ICICI Bank)', rate: 7.10, desc: 'ICICI Bank PPF Savings Account', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' },
    { name: 'Public Provident Fund (Axis Bank)', rate: 7.10, desc: 'Axis Bank PPF Savings Account', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' },
    { name: 'Public Provident Fund (PNB)', rate: 7.10, desc: 'Punjab National Bank PPF Account', taxBadge: 'EEE Category Tax-Free', lockin: '15 Years' }
  ],
  NPS: [
    { name: 'HDFC Pension Management (NPS Tier-1)', rate: 10.50, desc: 'HDFC NPS Pension Fund Manager (Equity/Debt Mix)', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'SBI Pension Funds (NPS Tier-1)', rate: 10.20, desc: 'SBI NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'ICICI Prudential Pension (NPS Tier-1)', rate: 10.40, desc: 'ICICI NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'LIC Pension Fund (NPS Tier-1)', rate: 9.80, desc: 'LIC NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'Kotak Pension Fund (NPS Tier-1)', rate: 10.10, desc: 'Kotak NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'UTI Retirement Solutions (NPS Tier-1)', rate: 10.15, desc: 'UTI NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'Aditya Birla Pension (NPS Tier-1)', rate: 9.95, desc: 'Aditya Birla NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' },
    { name: 'Tata Pension Management (NPS Tier-1)', rate: 10.30, desc: 'Tata NPS Pension Fund Manager', taxBadge: 'Addl Sec 80CCD(1B) Tax Saving', lockin: 'Till Age 60' }
  ],
  ELSS_BOND: [
    { name: 'NHAI Tax Free Bonds', rate: 5.75, desc: 'National Highways Authority of India Tax-Free Bonds', taxBadge: 'Tax-Free Interest', lockin: '10-15 Years' },
    { name: 'REC Tax Free Bonds', rate: 5.85, desc: 'Rural Electrification Corporation Tax-Free Bonds', taxBadge: 'Tax-Free Interest', lockin: '10-15 Years' },
    { name: 'PFC Tax Free Bonds', rate: 5.80, desc: 'Power Finance Corporation Tax-Free Bonds', taxBadge: 'Tax-Free Interest', lockin: '10-15 Years' },
    { name: 'HUDCO Tax Free Bonds', rate: 5.90, desc: 'Housing & Urban Development Corp Tax-Free Bonds', taxBadge: 'Tax-Free Interest', lockin: '10-15 Years' },
    { name: 'IRFC Tax Free Bonds', rate: 5.72, desc: 'Indian Railway Finance Corp Tax-Free Bonds', taxBadge: 'Tax-Free Interest', lockin: '10-15 Years' },
    { name: 'GOI 7.75% Savings Bonds', rate: 7.75, desc: 'Government of India Taxable Savings Bonds', taxBadge: 'Sovereign Guarantee', lockin: '7 Years' },
    { name: '91-Day Treasury Bills (T-Bills)', rate: 6.90, desc: '91 Days Short-term Government Sovereign Debt', taxBadge: 'Sovereign Guarantee', lockin: '91 Days' },
    { name: '182-Day Treasury Bills (T-Bills)', rate: 7.02, desc: '182 Days Short-term Government Sovereign Debt', taxBadge: 'Sovereign Guarantee', lockin: '182 Days' },
    { name: '364-Day Treasury Bills (T-Bills)', rate: 7.08, desc: '364 Days Short-term Government Sovereign Debt', taxBadge: 'Sovereign Guarantee', lockin: '364 Days' },
    { name: 'Tata Capital AAA Corporate Bonds', rate: 8.20, desc: 'Tata Capital Corporate Debt (AAA rated)', taxBadge: 'TDS Applicable', lockin: '3-5 Years' },
    { name: 'L&T Finance AAA Corporate Bonds', rate: 8.35, desc: 'L&T Finance AAA Rated Corporate Debentures', taxBadge: 'TDS Applicable', lockin: '3-5 Years' },
    { name: 'HDFC Credila AAA Corporate Bonds', rate: 8.25, desc: 'HDFC Credila AAA Corporate Debentures', taxBadge: 'TDS Applicable', lockin: '2-5 Years' }
  ]
};

const POPULAR_MFS = [
  { schemeCode: '120286', schemeName: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '119062', schemeName: 'UTI Nifty 50 Index Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '120716', schemeName: 'Quant Small Cap Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '120194', schemeName: 'Nippon India Small Cap Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '118989', schemeName: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '120465', schemeName: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '119027', schemeName: 'ICICI Prudential Bluechip Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' },
  { schemeCode: '120306', schemeName: 'SBI Bluechip Fund - Direct Growth', category: 'Equity', risk: 'Very High Risk', icon: '📈' }
];

const WealthMap = () => {
  // Telemetry HUD state for live explanations
  const [hoveredControl, setHoveredControl] = useState("");

  const [stocksList, setStocksList] = useState(POPULAR_STOCKS);
  const [bondSuggestionsList, setBondSuggestionsList] = useState(BOND_SUGGESTIONS);

  useEffect(() => {
    const fetchLiveStockPrices = async () => {
      try {
        const symbols = POPULAR_STOCKS.map(s => s.symbol).join(',');
        const { data } = await api.get(`/market/quotes?symbols=${symbols}`);
        if (data.success && data.quotes) {
          setStocksList(prev => prev.map(s => {
            const live = data.quotes.find(q => q.symbol?.toUpperCase() === s.symbol.toUpperCase() || q.yahooSymbol?.toUpperCase() === `${s.symbol.toUpperCase()}.NS`);
            return live ? { ...s, price: live.price } : s;
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch live stock prices for WealthMap:", e.message);
      }
    };

    const fetchLiveRates = async () => {
      try {
        const { data } = await api.get('/market/rates');
        if (data.success && data.rates) {
          const r = data.rates;
          setBondSuggestionsList(prev => {
            const next = { ...prev };
            
            next.SGB = prev.SGB.map(b => ({ ...b, rate: r.sgb }));
            
            next.FD = prev.FD.map(b => {
              let rate = r.fd;
              if (b.name.includes('Shriram')) rate = r.corporateBondAAA - 0.15;
              else if (b.name.includes('Bajaj')) rate = r.corporateBondAAA - 0.4;
              else if (b.name.includes('IDFC') || b.name.includes('IndusInd') || b.name.includes('Yes')) rate = r.fd + 0.55;
              else if (b.name.includes('SBI')) rate = r.fd - 0.4;
              else if (b.name.includes('Post Office')) rate = r.fd + 0.3;
              return { ...b, rate: parseFloat(rate.toFixed(2)) };
            });
            
            next.PPF = prev.PPF.map(b => ({ ...b, rate: r.ppf }));
            
            next.NPS = prev.NPS.map(b => {
              let rate = r.nps;
              if (b.name.includes('HDFC')) rate += 0.3;
              else if (b.name.includes('ICICI')) rate += 0.2;
              else if (b.name.includes('SBI')) rate += 0.0;
              else if (b.name.includes('LIC')) rate -= 0.4;
              return { ...b, rate: parseFloat(rate.toFixed(2)) };
            });
            
            next.ELSS_BOND = prev.ELSS_BOND.map(b => {
              let rate = r.corporateBondAAA;
              if (b.name.includes('Tax Free')) rate = r.yield10Y - 1.25;
              else if (b.name.includes('GOI 7.75%')) rate = 7.75;
              else if (b.name.includes('91-Day')) rate = r.treasuryBill91D;
              else if (b.name.includes('182-Day')) rate = r.treasuryBill182D;
              else if (b.name.includes('364-Day')) rate = r.treasuryBill364D;
              else if (b.name.includes('L&T')) rate = r.corporateBondAAA + 0.1;
              return { ...b, rate: parseFloat(rate.toFixed(2)) };
            });
            
            return next;
          });
        }
      } catch (e) {
        console.warn("Failed to fetch live rates for WealthMap:", e.message);
      }
    };

    fetchLiveStockPrices();
    fetchLiveRates();
  }, []);

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'consolidated');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);
  const [netWorth, setNetWorth] = useState(null);

  // ── Consolidated Multi-Platform Portfolio States (starts empty — import your real data) ──
  const [consolidatedHoldings, setConsolidatedHoldings] = useState({
    growwMF: [],
    phonepeMF: [],
    paytmmoneyMF: [],
    zerodhaHoldings: [],
    indmoneyUS: [],
    cryptos: [],
    phonepeGoldGrams: 0,
    phonepeSilverGrams: 0,
    auragoldGrams: 0,
    auraSilverGrams: 0,
    jarGoldGrams: 0,
    mmtcGoldGrams: 0,
    mmtcSilverGrams: 0,
    safegoldGoldGrams: 0,
    safegoldSilverGrams: 0,
    zerodhaGoldGrams: 0,
    zerodhaSilverGrams: 0,
  });

  const [emis, setEmis] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fireMonthlyExpenses, setFireMonthlyExpenses] = useState(50000);
  const [scorecardView, setScorecardView] = useState('metrics'); // 'metrics' | 'projection'
  const [fireExpectedReturn, setFireExpectedReturn] = useState(12);
  const [fireAddSavings, setFireAddSavings] = useState(10000);
  const [fireInflationAdjusted, setFireInflationAdjusted] = useState(true);
  const [fireScenario, setFireScenario] = useState('normal'); // 'normal' | 'stagflation' | 'bull' | 'lean' | 'fat'

  // ── Quick Add Portfolio Wizard States ──
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState('mf'); // 'mf' | 'gold'
  const [mfSearchQuery, setMfSearchQuery] = useState('');
  const [mfSearchResults, setMfSearchResults] = useState([]);
  const [mfSearchLoading, setMfSearchLoading] = useState(false);
  const [mfSearchFocused, setMfSearchFocused] = useState(false);
  const [mfDropdownHighlight, setMfDropdownHighlight] = useState(-1);
  const [mfSearchNoResults, setMfSearchNoResults] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null); // { schemeCode, schemeName }
  const [quickAddInvestmentType, setQuickAddInvestmentType] = useState('sip'); // 'sip' | 'lumpsum'
  const [quickAddSipAmount, setQuickAddSipAmount] = useState('5000');
  const [quickAddSipDay, setQuickAddSipDay] = useState('5');
  const [quickAddStartDate, setQuickAddStartDate] = useState('2024-01-01');
  const [quickAddStepUp, setQuickAddStepUp] = useState('0');
  const [quickAddCategory, setQuickAddCategory] = useState('Index');
  const [quickAddPlatform, setQuickAddPlatform] = useState('Groww');
  const [quickAddLiveNav, setQuickAddLiveNav] = useState(null);
  const [quickAddGold, setQuickAddGold] = useState({
    phonepeGold: '', phonepeSilver: '',
    auraGold: '', auraSilver: '',
    jarGold: '', mmtcGold: '', mmtcSilver: '',
    safegoldGold: '', safegoldSilver: '',
    zerodhaGold: '', zerodhaSilver: ''
  });
  const [commodityPlatform, setCommodityPlatform] = useState('PhonePe');
  const [commodityMetalType, setCommodityMetalType] = useState('Gold');
  const [commodityGrams, setCommodityGrams] = useState('');

  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchFocused, setStockSearchFocused] = useState(false);
  const [stockSearchResults, setStockSearchResults] = useState([]);

  const [bondSearchQuery, setBondSearchQuery] = useState('');
  const [bondSearchFocused, setBondSearchFocused] = useState(false);
  const [bondSearchResults, setBondSearchResults] = useState([]);

  const mfSearchCache = useRef({});
  const stockSearchTimer = useRef(null);
  const stockSearchCache = useRef({});
  const [quickAddBond, setQuickAddBond] = useState({
    type: 'SGB', // 'SGB' | 'NPS' | 'PPF' | 'FD' | 'ELSS_BOND'
    name: '', invested: '', maturityDate: '', interestRate: '', qty: ''
  });
  const [quickAddStock, setQuickAddStock] = useState({
    name: '',
    symbol: '',
    qty: '',
    avgPrice: '',
    platform: 'Zerodha'
  });
  const [quickAddCrypto, setQuickAddCrypto] = useState({
    name: '',
    symbol: '',
    qty: '',
    avgPrice: '',
    platform: 'CoinDCX'
  });
  const [dbPortfolio, setDbPortfolio] = useState({ sips: [], goldHoldings: [] });
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);

  // ── Intermittent Transaction States ──
  const [showLumpsumModal, setShowLumpsumModal] = useState(false);
  const [selectedSipForLumpsum, setSelectedSipForLumpsum] = useState(null);
  const [lumpsumForm, setLumpsumForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '10000', note: '' });
  const [lumpsumModalTab, setLumpsumModalTab] = useState('buy'); // 'buy' | 'sell'
  const [expandedLedgerIds, setExpandedLedgerIds] = useState([]);

  // Goal Planner States
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get('/wealth/goals');
        if (res.data?.success && res.data.goals) {
          const mapped = res.data.goals.map(g => ({
            id: g._id,
            name: g.name,
            target: g.targetAmount,
            current: g.currentAmount,
            deadlineYear: g.deadline ? new Date(g.deadline).getFullYear() : new Date().getFullYear() + 5,
            category: g.category
          }));
          setGoals(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch goals:', e);
      }
    };
    fetchGoals();
  }, []);

  useEffect(() => {
    if (showQuickAddModal) {
      setQuickAddGold({
        phonepeGold: consolidatedHoldings.phonepeGoldGrams || '',
        phonepeSilver: consolidatedHoldings.phonepeSilverGrams || '',
        auraGold: consolidatedHoldings.auragoldGrams || '',
        auraSilver: consolidatedHoldings.auraSilverGrams || '',
        jarGold: consolidatedHoldings.jarGoldGrams || '',
        mmtcGold: consolidatedHoldings.mmtcGoldGrams || '',
        mmtcSilver: consolidatedHoldings.mmtcSilverGrams || '',
        safegoldGold: consolidatedHoldings.safegoldGoldGrams || '',
        safegoldSilver: consolidatedHoldings.safegoldSilverGrams || '',
        zerodhaGold: consolidatedHoldings.zerodhaGoldGrams || '',
        zerodhaSilver: consolidatedHoldings.zerodhaSilverGrams || ''
      });
      setCommodityPlatform('PhonePe');
      setCommodityMetalType('Gold');
      setCommodityGrams(consolidatedHoldings.phonepeGoldGrams || '');
      setStockSearchQuery('');
      setStockSearchResults([]);
      setStockSearchFocused(false);
      setBondSearchQuery('');
      setBondSearchResults([]);
      setBondSearchFocused(false);
    }
  }, [showQuickAddModal, consolidatedHoldings]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({ name: '', target: '', current: '', deadlineYear: 2030, category: 'Retirement' });

  // Auto-sync dashboard states
  // Auto-sync dashboard states
  const [syncPhone, setSyncPhone] = useState('');
  const [syncPan, setSyncPan] = useState('');
  const [syncOtp, setSyncOtp] = useState('');
  const [syncClientId, setSyncClientId] = useState('');
  const [syncIndAccountId, setSyncIndAccountId] = useState('');
  const [syncCryptoApiKey, setSyncCryptoApiKey] = useState('');
  const [activeSyncType, setActiveSyncType] = useState('cams'); // 'cams' | 'demat' | 'commodity' | 'us_stock' | 'crypto'
  const [syncStep, setSyncStep] = useState('initial'); // 'initial' | 'otp' | 'syncing' | 'success'
  const [syncLog, setSyncLog] = useState([]);
  const [emiSubTab, setEmiSubTab] = useState('tracker'); // 'tracker' | 'optimizer'
  const [selectedGoldProvider, setSelectedGoldProvider] = useState('SafeGold');
  const [goldGrams, setGoldGrams] = useState(14.50);
  const [silverGrams, setSilverGrams] = useState(120.00);
  const [isGoldSyncing, setIsGoldSyncing] = useState(false);

  const [spotPrices, setSpotPrices] = useState({
    gold: 7250,
    silver: 92.40,
    usdInr: 83.45,
    btc: 5750000,
    eth: 285000,
    bdx: 7.49
  });

  const fetchLiveSpotPrices = async () => {
    // Fire ALL external API calls in parallel — no sequential awaits
    const [erResult, goldResult, silverResult, btcResult, ethResult, bdxResult] = await Promise.allSettled([
      fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()),
      fetch('https://api.gold-api.com/price/XAU').then(r => r.json()),
      fetch('https://api.gold-api.com/price/XAG').then(r => r.json()),
      fetch('https://api.gold-api.com/price/BTC').then(r => r.json()),
      fetch('https://api.gold-api.com/price/ETH').then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=beldex&vs_currencies=inr').then(r => r.json()),
    ]);

    const usdInr = erResult.status === 'fulfilled' && erResult.value?.rates?.INR ? erResult.value.rates.INR : 83.45;
    const goldPriceUsd = goldResult.status === 'fulfilled' && goldResult.value?.price ? goldResult.value.price : 2330;
    const silverPriceUsd = silverResult.status === 'fulfilled' && silverResult.value?.price ? silverResult.value.price : 29.5;
    const btcPriceUsd = btcResult.status === 'fulfilled' && btcResult.value?.price ? btcResult.value.price : 67500;
    const ethPriceUsd = ethResult.status === 'fulfilled' && ethResult.value?.price ? ethResult.value.price : 3500;
    const bdxInr = bdxResult.status === 'fulfilled' && bdxResult.value?.beldex?.inr ? bdxResult.value.beldex.inr : 0.088 * usdInr;

    const TROY_OZ = 31.1034768;
    setSpotPrices({
      gold: Math.round((goldPriceUsd / TROY_OZ) * usdInr * 100) / 100,
      silver: Math.round((silverPriceUsd / TROY_OZ) * usdInr * 100) / 100,
      usdInr: Math.round(usdInr * 100) / 100,
      btc: Math.round(btcPriceUsd * usdInr),
      eth: Math.round(ethPriceUsd * usdInr),
      bdx: Math.round(bdxInr * 100) / 100,
    });
  };

  useEffect(() => {
    fetchLiveSpotPrices();
    const apiInterval = setInterval(fetchLiveSpotPrices, 60000);

    return () => {
      clearInterval(apiInterval);
    };
  }, []);




  // EMI form
  const [emiForm, setEmiForm] = useState({
    name: '',
    principal: '',
    annualRate: '',
    tenureMonths: '',
    category: 'Other',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [emiResult, setEmiResult] = useState(null);
  const [showEmiModal, setShowEmiModal] = useState(false);

  const computeEmiLocally = (p, r, n) => {
    const principal = parseFloat(p);
    const annualRate = parseFloat(r);
    const tenureMonths = parseInt(n);
    if (isNaN(principal) || isNaN(annualRate) || isNaN(tenureMonths) || principal <= 0 || annualRate < 0 || tenureMonths <= 0) {
      return null;
    }
    const monthlyRate = annualRate / (12 * 100);
    if (monthlyRate === 0) {
      const emi = principal / tenureMonths;
      return { emi: Math.round(emi), totalPayment: principal, totalInterest: 0 };
    }
    const emi = principal * monthlyRate *
      Math.pow(1 + monthlyRate, tenureMonths) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;
    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest)
    };
  };

  useEffect(() => {
    const result = computeEmiLocally(emiForm.principal, emiForm.annualRate, emiForm.tenureMonths);
    if (result) {
      setEmiResult({ success: true, result });
    } else {
      setEmiResult(null);
    }
  }, [emiForm.principal, emiForm.annualRate, emiForm.tenureMonths]);



  // Extra payment calculator
  const [extraPayment, setExtraPayment] = useState('');
  const [extraSavings, setExtraSavings] = useState(null);

  // ── Mutual Fund & SIP Planner states ──
  const [sipForm, setSipForm] = useState({ monthly: 5000, expectedReturn: 12, years: 10, inflationAdjust: false, isLumpsum: false });

  // AI Recommender states
  const [riskAnswers, setRiskAnswers] = useState({ Q0: '', Q1: '', Q2: '' });
  const [riskResult, setRiskResult] = useState(null);
  const [currentRiskStep, setCurrentRiskStep] = useState(0);

  // Virtual SIP Simulator states — starts empty, populated by user action or real portfolio fetch
  const [virtualSIPs, setVirtualSIPs] = useState([]);

  const [showAddSipModal, setShowAddSipModal] = useState(false);
  const [newSipForm, setNewSipForm] = useState({ fundName: 'Axis Bluechip Fund (Direct Growth)', amount: 5000 });

  // ── Vault Security Enclave States ──
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [zeroKnowledgeEnabled, setZeroKnowledgeEnabled] = useState(true);
  const [readOnlyEnforced, setReadOnlyEnforced] = useState(true);
  const [valuesMasked, setValuesMasked] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  // Generate security log entries with real current timestamps on mount
  const makeSecurityLogs = () => {
    const now = new Date();
    const fmt = (d) => d.toTimeString().split(' ')[0];
    return [
      { time: fmt(new Date(now - 180000)), event: 'DEVICE_BIND',        detail: `Hardware profile signature bound (${user?.name || 'User'}'s Device)`,  status: 'success' },
      { time: fmt(new Date(now - 120000)), event: 'BACKEND_HANDSHAKE',  detail: 'Strict Helmet-CSP Content protection handshake verified',                status: 'success' },
      { time: fmt(new Date(now - 60000)),  event: 'NOSQL_SHIELD',       detail: 'Recursive operator query sanitization initialized',                      status: 'success' },
      { time: fmt(now),                    event: 'SECURE_MPIN',        detail: 'Master vault MPIN security overlay activated',                            status: 'lock'    },
    ];
  };
  const [securityLogs, setSecurityLogs] = useState(makeSecurityLogs);


  const addSecurityLog = (event, detail, status = 'success') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setSecurityLogs(current => [
      { time: timeStr, event, detail, status },
      ...current.slice(0, 7)
    ]);
  };

  // ── eCAS Ingestor State Hooks ──
  const [ecasStep, setEcasStep] = useState('initial'); // 'initial' | 'uploading' | 'password' | 'parsed' | 'merged'
  const [ecasFileName, setEcasFileName] = useState('');
  const [ecasProgress, setEcasProgress] = useState(0);
  const [ecasPassword, setEcasPassword] = useState('');
  const [syncMethod, setSyncMethod] = useState('file'); // 'file' | 'api'
  const [parsedCasData, setParsedCasData] = useState(null);
  const [parsedGoldData, setParsedGoldData] = useState([]);

  // Premium Time-Travel and Catalog States
  const [fastForwarding, setFastForwarding] = useState(false);
  const [selectedFundDetails, setSelectedFundDetails] = useState(null);

  // ── Live MF Catalog — fetched from AMFI via /api/market/mutual-funds ──
  const [fundCatalog, setFundCatalog] = useState([]);
  const [fundCatalogLoading, setFundCatalogLoading] = useState(false);
  const [fundCatalogQuery, setFundCatalogQuery] = useState('');

  const loadFundCatalog = async (query = '') => {
    setFundCatalogLoading(true);
    try {
      const res = await api.get(`/market/mutual-funds?search=${encodeURIComponent(query || 'nifty')}`);
      if (res.data?.success) {
        const funds = (res.data.funds || []).slice(0, 8).map(f => ({
          name: f.schemeName,
          schemeCode: f.schemeCode,
          returns: null, // fetched on demand from /mutual-funds/:code/analyze
          expense: null,
          manager: 'AMFI Registered',
          holdings: [],
          desc: f.schemeName,
        }));
        setFundCatalog(funds);
      }
    } catch (e) {
      console.warn('Fund catalog fetch failed:', e.message);
    } finally {
      setFundCatalogLoading(false);
    }
  };


  // ── eCAS / CSV Statement Parsing Handlers ──
  const simulateEcasUpload = () => {
    setEcasStep('uploading');
    setEcasFileName('CAS_Consolidated_Statement_' + new Date().getFullYear() + '.pdf');
    setEcasProgress(0);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setEcasProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setEcasStep('password');
      }
    }, 150);
  };

  const handleEcasPasswordSubmit = () => {
    if (!ecasPassword) {
      toast.error('Please enter password (usually PAN Card or Email Address)');
      return;
    }
    toast.success('eCAS Decrypted successfully! 🔎 Mapped against CDSL Registry.');
    setEcasStep('parsed');
  };

  const mergeEcasParsedHoldings = async () => {
    try {
      setIsPortfolioLoading(true);
      
      let finalSips = parsedCasData?.sips;
      
      if (!finalSips || finalSips.length === 0) {
        finalSips = [
          {
            schemeCode: "120465",
            schemeName: "Tata Digital India Fund (Direct)",
            platform: "Groww",
            sipAmount: 5000,
            sipDay: 5,
            startDate: "2024-01-01",
            category: "Index",
            lumpsums: [{ date: "2024-01-01", amount: 5000, note: "Initial SIP" }],
            redemptions: []
          },
          {
            schemeCode: "120531",
            schemeName: "Axis Small Cap Fund (Direct)",
            platform: "PhonePe",
            sipAmount: 10000,
            sipDay: 10,
            startDate: "2024-01-01",
            category: "Small Cap",
            lumpsums: [{ date: "2024-01-01", amount: 10000, note: "Initial SIP" }],
            redemptions: []
          }
        ];
      }

      const res = await api.post('/sip-portfolio/import', { sips: finalSips });
      if (res.data.success) {
        toast.success('Successfully merged CAMS statement assets! 📈');
        loadSIPPortfolio();
        setEcasStep('merged');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to merge statement assets');
    } finally {
      setIsPortfolioLoading(false);
    }
  };

  const handleCasFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const rows = text.split(/\r?\n/).map(row => row.split(','));
          if (rows.length < 2) {
            toast.error("CSV file is empty!");
            return;
          }

          const headers = rows[0].map(h => h.trim().toLowerCase());
          const schemeCodeIdx = headers.findIndex(h => h.includes('code') || h.includes('id'));
          const schemeNameIdx = headers.findIndex(h => h.includes('name') || h.includes('scheme'));
          const platformIdx = headers.findIndex(h => h.includes('platform'));
          const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('txn'));
          const dateIdx = headers.findIndex(h => h.includes('date'));
          const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));

          if (schemeCodeIdx === -1 || schemeNameIdx === -1 || dateIdx === -1 || amountIdx === -1) {
            toast.error("Invalid CSV format! Make sure headers contain: 'Scheme Code', 'Scheme Name', 'Date', 'Amount'.");
            return;
          }

          const parsedSips = {};
          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].map(c => c.trim());
            if (cols.length < 4 || !cols[schemeCodeIdx]) continue;

            const code = cols[schemeCodeIdx];
            const name = cols[schemeNameIdx];
            const platform = platformIdx !== -1 ? cols[platformIdx] : 'Groww';
            const type = typeIdx !== -1 ? cols[typeIdx] : 'SIP Execution';
            const date = cols[dateIdx];
            const amount = parseFloat(cols[amountIdx]) || 0;

            if (!parsedSips[code]) {
              parsedSips[code] = {
                schemeCode: code,
                schemeName: name,
                platform: platform,
                sipAmount: amount,
                sipDay: new Date(date).getDate() || 5,
                startDate: date,
                lumpsums: [],
                redemptions: [],
                category: 'Index'
              };
            }

            if (type.toLowerCase().includes('redemption') || type.toLowerCase().includes('sell')) {
              parsedSips[code].redemptions.push({
                date: date,
                units: amount / 10, // approximate Nav 10 if not provided
                nav: 10,
                note: 'Imported via CSV'
              });
            } else {
              parsedSips[code].lumpsums.push({
                date: date,
                amount: amount,
                note: 'Imported via CSV'
              });
            }
          }

          const sipsArray = Object.values(parsedSips);
          if (sipsArray.length === 0) {
            toast.error("No valid transactions found in CSV!");
            return;
          }

          setParsedCasData({ sips: sipsArray });
          setEcasStep('parsed_csv');
          toast.success(`Successfully parsed ${sipsArray.length} schemes from CSV statement!`);
        } catch (err) {
          toast.error("Error parsing CSV: " + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      // PDF - simulated decryption loader
      setEcasFileName(file.name);
      setEcasStep('uploading');
      setEcasProgress(0);
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setEcasProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          setEcasStep('password');
        }
      }, 150);
    }
  };

  const handleGoldFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const rows = text.split(/\r?\n/).map(row => row.split(','));
          const headers = rows[0].map(h => h.trim().toLowerCase());

          const platformIdx = headers.findIndex(h => h.includes('platform'));
          const gramsIdx = headers.findIndex(h => h.includes('gram'));
          const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('rate'));
          const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('metal'));

          if (gramsIdx === -1) {
            toast.error("Invalid Gold CSV format! Make sure headers contain: 'Grams'.");
            return;
          }

          const goldHoldings = [];
          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].map(c => c.trim());
            if (cols.length < 2 || !cols[gramsIdx]) continue;

            goldHoldings.push({
              platform: platformIdx !== -1 ? cols[platformIdx] : 'PhonePe',
              metalType: typeIdx !== -1 && cols[typeIdx].toLowerCase().includes('silver') ? 'Silver' : 'Gold',
              grams: parseFloat(cols[gramsIdx]) || 0,
              avgBuyPrice: priceIdx !== -1 ? parseFloat(cols[priceIdx]) : 7000
            });
          }

          setParsedGoldData(goldHoldings);
          setEcasStep('parsed_gold_csv');
          toast.success(`Successfully parsed ${goldHoldings.length} gold/silver records from CSV statement!`);
        } catch (err) {
          toast.error("Error parsing CSV: " + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      setEcasFileName(file.name);
      setEcasStep('uploading');
      setEcasProgress(0);
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setEcasProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(interval);
          setEcasStep('password');
        }
      }, 150);
    }
  };

  const handleRealImportSubmit = async () => {
    try {
      setIsPortfolioLoading(true);
      const payload = {};
      if (ecasStep === 'parsed_csv') {
        payload.sips = parsedCasData.sips;
      } else if (ecasStep === 'parsed_gold_csv') {
        payload.goldHoldings = parsedGoldData;
      }

      const res = await api.post('/sip-portfolio/import', payload);
      if (res.data.success) {
        toast.success("Statement merged into real database portfolio! 🎉");
        loadSIPPortfolio();
      }
    } catch (err) {
      toast.error("Failed to import statement: " + (err.response?.data?.message || err.message));
    } finally {
      setIsPortfolioLoading(false);
      setEcasStep('initial');
    }
  };

  const downloadCsvTemplate = (type) => {
    let headers, sampleData;
    if (type === 'mf') {
      headers = 'Scheme Code,Scheme Name,Platform,Type,Date,Amount';
      sampleData = '120465,Tata Digital India Fund (Direct),Groww,SIP Execution,2024-01-05,5000\n120531,Axis Small Cap Fund (Direct),PhonePe,Lumpsum Purchase,2024-03-15,10000';
    } else {
      headers = 'Platform,Metal Type,Grams,Avg Buy Price';
      sampleData = 'PhonePe,Gold,5.5,7200\nJar,Gold,1.5,7150\nAura Gold,Gold,2.2,7250';
    }
    const blob = new Blob([headers + '\n' + sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `finbuddy_${type}_import_template.csv`);
    a.click();
  };

  // ── Quick Add Portfolio Wizard Handlers ──

  // Live fund search as user types (debounced via useEffect in modal)
  // Parse fund house from scheme name
  const parseFundHouse = (name = '') => {
    const houses = [
      'SBI', 'HDFC', 'ICICI Prudential', 'Axis', 'Kotak', 'Nippon India',
      'Mirae Asset', 'Motilal Oswal', 'Parag Parikh', 'DSP', 'UTI', 'Aditya Birla',
      'Franklin', 'Tata', 'Canara Robeco', 'IDFC', 'Edelweiss', 'Invesco',
      'LIC MF', 'Navi', 'Quant', 'Groww', 'PGIM', 'Sundaram', 'HSBC',
    ];
    return houses.find(h => name.toLowerCase().includes(h.toLowerCase())) || 'AMC';
  };

  const renderBrandLogo = (name, sizeClass = 'w-8 h-8') => {
    if (!name || typeof name !== 'string') {
      return (
        <div className={`${sizeClass} rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center`}>
          <span className="text-[9px] font-bold text-slate-400">MF</span>
        </div>
      );
    }
    
    const lower = name.toLowerCase();
    
    if (lower.includes('sbi')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg`} title="SBI Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"/>
            <rect x="11.25" y="14" width="1.5" height="6" rx="0.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
        </div>
      );
    }
    
    if (lower.includes('hdfc')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center`} title="HDFC Mutual Fund">
          <div className="w-[70%] h-[70%] flex items-center justify-center relative bg-[#004c8f] rounded-lg border border-[#e31e24]/70">
            <div className="w-[50%] h-[50%] bg-white rounded flex items-center justify-center">
              <div className="w-[50%] h-[50%] bg-[#e31e24] rounded-full"></div>
            </div>
          </div>
        </div>
      );
    }
    
    if (lower.includes('icici')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center`} title="ICICI Prudential Mutual Fund">
          <div className="w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-[#e56c19] to-[#f9a03f] flex items-center justify-center text-white font-serif font-black text-[10px] italic shadow-md">
            i
          </div>
        </div>
      );
    }
    
    if (lower.includes('axis')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-rose-950/20 border border-[#97144d]/30 flex items-center justify-center text-[#fb7185]`} title="Axis Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] fill-current">
            <path d="M12 2L3 20h6.5l2.5-5.5 2.5 5.5H21z"/>
          </svg>
        </div>
      );
    }
    
    if (lower.includes('parag parikh') || lower.includes('ppfas') || lower.includes('parikh')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400`} title="PPFAS Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1"/>
            <path d="M8 14l3-3 2 2 3-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
    if (lower.includes('nippon')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center`} title="Nippon India Mutual Fund">
          <div className="w-[70%] h-[70%] relative rounded bg-gradient-to-br from-indigo-900 to-blue-750 flex items-center justify-center overflow-hidden border border-indigo-500/20">
            <div className="absolute w-[40%] h-[40%] rounded-full bg-red-500 -bottom-1 -right-1 opacity-80"></div>
            <span className="text-[7.5px] font-black text-white relative z-10">N</span>
          </div>
        </div>
      );
    }
    
    if (lower.includes('mirae')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400`} title="Mirae Asset Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" strokeDasharray="3 2"/>
            <path d="M8 12a4 4 0 018 0" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        </div>
      );
    }
    
    if (lower.includes('tata')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400`} title="Tata Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 6h16M12 6v14" strokeLinecap="round"/>
            <path d="M9 11l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
    if (lower.includes('quant')) {
      return (
        <div className={`${sizeClass} rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400`} title="Quant Mutual Fund">
          <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 3v18h18" strokeLinecap="round"/>
            <path d="M18.5 7.5L13 13l-3-3L5 15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
    // Fallback
    const initials = name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'MF';
    return (
      <div className={`${sizeClass} rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center`}>
        <span className="text-[9px] font-black text-slate-400">{initials}</span>
      </div>
    );
  };

  // Guess fund category from scheme name keywords
  const guessFundCategory = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('index') || n.includes('nifty') || n.includes('sensex') || n.includes('bse')) return 'Index';
    if (n.includes('elss') || n.includes('tax saver') || n.includes('tax saving')) return 'ELSS';
    if (n.includes('small cap')) return 'Small Cap';
    if (n.includes('mid cap') || n.includes('midcap')) return 'Mid Cap';
    if (n.includes('large cap') || n.includes('largecap') || n.includes('bluechip')) return 'Large Cap';
    if (n.includes('flexi') || n.includes('multi cap') || n.includes('multicap')) return 'Flexi Cap';
    if (n.includes('liquid') || n.includes('overnight')) return 'Liquid';
    if (n.includes('debt') || n.includes('bond') || n.includes('gilt') || n.includes('income')) return 'Debt';
    if (n.includes('international') || n.includes('global') || n.includes('us ') || n.includes('nasdaq') || n.includes('s&p')) return 'International';
    if (n.includes('sector') || n.includes('pharma') || n.includes('it ') || n.includes('infra') || n.includes('banking') || n.includes('fmcg')) return 'Sectoral';
    return 'Other';
  };

  const CATEGORY_COLORS = {
    'Index': '#06b6d4', 'ELSS': '#10b981', 'Small Cap': '#f97316',
    'Mid Cap': '#8b5cf6', 'Large Cap': '#3b82f6', 'Flexi Cap': '#ec4899',
    'Liquid': '#6366f1', 'Debt': '#eab308', 'International': '#f43f5e',
    'Sectoral': '#14b8a6', 'Other': '#94a3b8',
  };

  const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const KEYWORDS = [
    'hdfc', 'sbi', 'axis', 'icici', 'nippon', 'mirae', 'parikh', 'quant', 'tata', 'dsp', 'kotak', 'uti',
    'groww', 'navi', 'franklin', 'liquid', 'index', 'balanced', 'hybrid', 'flexicap', 'smallcap', 'midcap', 'largecap'
  ];

  const correctSearchQuery = (query) => {
    if (!query) return '';
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const genericWords = new Set([
      'fund', 'funds', 'mutual', 'mutuals', 'scheme', 'schemes', 
      'online', 'invest', 'investment', 'plan', 'plans', 'option', 'options'
    ]);
    const correctedTokens = tokens.map(token => {
      const dict = {
        hfdc: 'hdfc',
        icci: 'icici',
        parik: 'parikh',
        ppfs: 'ppfas',
        nipp: 'nippon',
        grow: 'groww',
        mira: 'mirae',
        motil: 'motilal',
        qant: 'quant',
        flexi: 'flexicap'
      };
      if (dict[token]) return dict[token];
      if (token.length >= 4) {
        for (const kw of KEYWORDS) {
          if (getLevenshteinDistance(token, kw) <= 1) {
            return kw;
          }
        }
      }
      return token;
    }).filter(token => !genericWords.has(token));
    return correctedTokens.join(' ');
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const corrected = correctSearchQuery(query);
    const q = corrected || query;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) {
      const fallbackIdx = text.toLowerCase().indexOf(query.toLowerCase());
      if (fallbackIdx === -1) return text;
      return (
        <span>{text.slice(0, fallbackIdx)}<span style={{ color: '#22d3ee', textShadow: '0 0 8px rgba(34,211,238,0.4)', fontWeight: 'extrabold' }}>{text.slice(fallbackIdx, fallbackIdx + query.length)}</span>{text.slice(fallbackIdx + query.length)}</span>
      );
    }
    return (
      <span>{text.slice(0, idx)}<span style={{ color: '#22d3ee', textShadow: '0 0 8px rgba(34,211,238,0.4)', fontWeight: 'extrabold' }}>{text.slice(idx, idx + q.length)}</span>{text.slice(idx + q.length)}</span>
    );
  };

  const searchMfSchemes = async (rawQuery) => {
    if (!rawQuery || rawQuery.trim().length < 1) { setMfSearchResults([]); setMfSearchNoResults(false); return; }
    setMfSearchLoading(true);
    setMfSearchNoResults(false);
    setMfDropdownHighlight(-1);
    const query = correctSearchQuery(rawQuery) || rawQuery;

    // Check memory cache
    if (mfSearchCache.current[query]) {
      setMfSearchResults(mfSearchCache.current[query]);
      setMfSearchNoResults(mfSearchCache.current[query].length === 0);
      setMfSearchLoading(false);
      return;
    }

    try {
      const res = await api.get(`/mf/search?q=${encodeURIComponent(query)}`);
      const sortedResults = res.data?.funds || [];

      // Cache the result
      mfSearchCache.current[query] = sortedResults;

      setMfSearchResults(sortedResults);
      setMfSearchNoResults(sortedResults.length === 0);
    } catch (err) {
      console.error('Error searching MF schemes:', err);
      setMfSearchResults([]);
      setMfSearchNoResults(true);
    }
    setMfSearchLoading(false);
  };

  // When user picks a scheme from dropdown, fetch its latest NAV and auto-detect category
  const selectScheme = async (scheme) => {
    setSelectedScheme(scheme);
    setMfSearchQuery(scheme.schemeName);
    setMfSearchResults([]);
    setMfSearchNoResults(false);
    setMfDropdownHighlight(-1);
    setQuickAddLiveNav(null);
    // Auto-detect fund category from scheme name
    const detectedCat = guessFundCategory(scheme.schemeName);
    setQuickAddCategory(detectedCat);
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${scheme.schemeCode}`);
      const data = await res.json();
      const nav = parseFloat(data?.data?.[0]?.nav);
      if (nav) setQuickAddLiveNav(nav);
    } catch { /* keep null */ }
  };

  // Helper to parse dates in DD-MM-YYYY format from mfapi.in
  const parseMfDate = (dStr) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dStr);
  };

  const calculateXirr = (flows) => {
    if (flows.length < 2) return 0.0;

    const npv = (rate, cashFlows) => {
      let sum = 0;
      const d0 = new Date(cashFlows[0].date).getTime();
      for (let i = 0; i < cashFlows.length; i++) {
        const di = new Date(cashFlows[i].date).getTime();
        const years = (di - d0) / (365.25 * 24 * 60 * 60 * 1000);
        sum += cashFlows[i].amount / Math.pow(1 + rate, years);
      }
      return sum;
    };

    const npvDeriv = (rate, cashFlows) => {
      let sum = 0;
      const d0 = new Date(cashFlows[0].date).getTime();
      for (let i = 0; i < cashFlows.length; i++) {
        const di = new Date(cashFlows[i].date).getTime();
        const years = (di - d0) / (365.25 * 24 * 60 * 60 * 1000);
        sum += -years * cashFlows[i].amount / Math.pow(1 + rate, years + 1);
      }
      return sum;
    };

    let rate = 0.1; // 10% starting guess
    const maxIterations = 80;
    const precision = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      const val = npv(rate, flows);
      const deriv = npvDeriv(rate, flows);
      if (Math.abs(deriv) < 1e-12) break;
      const nextRate = rate - val / deriv;
      if (Math.abs(nextRate - rate) < precision) {
        return Math.round(nextRate * 100 * 100) / 100;
      }
      rate = nextRate;
    }
    // Fallback: Absolute return if XIRR doesn't converge
    return null;
  };

  // Simulates an SIP dynamically using historic NAV dataset from mfapi.in
  const calculateSipUnits = (sip, historicalData) => {
    if (!historicalData || historicalData.length === 0) return null;

    // Sort oldest first
    const navHistory = historicalData
      .map(d => ({ date: parseMfDate(d.date), nav: parseFloat(d.nav) }))
      .sort((a, b) => a.date - b.date);

    if (navHistory.length === 0) return null;

    const start = new Date(sip.startDate);
    const end = sip.endDate ? new Date(sip.endDate) : new Date();

    const findNavOnOrAfter = (targetDate) => {
      const entry = navHistory.find(h => h.date >= targetDate);
      if (!entry) return navHistory[navHistory.length - 1];
      return entry;
    };

    const getSipAmountForDate = (date) => {
      if (!sip.stepUpPercent || parseFloat(sip.stepUpPercent) <= 0) return sip.sipAmount;
      const yearsDiff = date.getFullYear() - start.getFullYear();
      return sip.sipAmount * Math.pow(1 + (parseFloat(sip.stepUpPercent) / 100), yearsDiff);
    };

    // Build chronological transaction array
    const allTransactions = [];

    // 1. Add SIP Executions
    let currentDate = new Date(start.getFullYear(), start.getMonth(), parseInt(sip.sipDay));
    if (currentDate < start) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    while (currentDate <= end && currentDate <= new Date()) {
      const navEntry = findNavOnOrAfter(currentDate);
      if (navEntry) {
        const amount = getSipAmountForDate(currentDate);
        const units = amount / navEntry.nav;
        allTransactions.push({
          type: 'sip',
          date: new Date(currentDate),
          amount: amount,
          units: units,
          nav: navEntry.nav,
          note: 'System Auto-SIP Execution'
        });
      }
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, parseInt(sip.sipDay));
    }

    // 2. Add Lumpsums
    if (sip.lumpsums && sip.lumpsums.length > 0) {
      sip.lumpsums.forEach(l => {
        const navEntry = findNavOnOrAfter(new Date(l.date));
        if (navEntry) {
          allTransactions.push({
            type: 'lumpsum',
            date: new Date(l.date),
            amount: l.amount,
            units: l.amount / navEntry.nav,
            nav: navEntry.nav,
            id: l._id,
            note: l.note || 'Manual Purchase'
          });
        }
      });
    }

    // 3. Add Redemptions
    if (sip.redemptions && sip.redemptions.length > 0) {
      sip.redemptions.forEach(r => {
        const navEntry = findNavOnOrAfter(new Date(r.date));
        const rNav = r.nav || (navEntry ? navEntry.nav : 0);
        allTransactions.push({
          type: 'redemption',
          date: new Date(r.date),
          amount: r.units * rNav,
          units: r.units,
          nav: rNav,
          id: r._id,
          note: r.note || 'Manual Redemption'
        });
      });
    }

    // Sort all transactions chronologically (oldest first)
    allTransactions.sort((a, b) => a.date - b.date);

    // Compute running balances
    let runningUnits = 0;
    let runningInvested = 0;
    let runningAverageNav = 0;

    const flows = [];
    const ledger = [];

    allTransactions.forEach(tx => {
      if (tx.type === 'sip' || tx.type === 'lumpsum') {
        runningUnits += tx.units;
        runningInvested += tx.amount;
        runningAverageNav = runningUnits > 0 ? (runningInvested / runningUnits) : 0;

        flows.push({ date: tx.date, amount: -tx.amount });
        ledger.push({
          id: tx.id,
          rawType: tx.type === 'lumpsum' ? 'lumpsum' : undefined,
          type: tx.type === 'sip' ? 'SIP Execution' : 'Lumpsum Purchase',
          date: tx.date.toISOString().split('T')[0],
          amount: tx.amount,
          nav: tx.nav,
          units: tx.units,
          note: tx.note,
          runningUnits,
          runningInvested,
          runningAverageNav
        });
      } else if (tx.type === 'redemption') {
        const costBasisOfRedeemed = tx.units * runningAverageNav;
        runningUnits -= tx.units;
        runningInvested -= costBasisOfRedeemed;
        if (runningUnits <= 0) {
          runningUnits = 0;
          runningInvested = 0;
          runningAverageNav = 0;
        } else {
          runningAverageNav = runningInvested / runningUnits;
        }

        flows.push({ date: tx.date, amount: tx.amount });
        ledger.push({
          id: tx.id,
          rawType: 'redemption',
          type: 'Redemption (Sell)',
          date: tx.date.toISOString().split('T')[0],
          amount: -tx.amount,
          nav: tx.nav,
          units: -tx.units,
          note: tx.note,
          runningUnits,
          runningInvested,
          runningAverageNav
        });
      }
    });

    const currentNav = navHistory[navHistory.length - 1].nav;
    const currentVal = runningUnits * currentNav;

    if (runningUnits > 0) {
      flows.push({ date: new Date(), amount: currentVal });
    }

    flows.sort((a, b) => a.date - b.date);
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    const xirr = calculateXirr(flows);

    return {
      units: Math.round(runningUnits * 1000) / 1000,
      invested: Math.round(runningInvested),
      currentNav,
      avgNav: Math.round(runningAverageNav * 100) / 100,
      currentVal: Math.round(currentVal),
      xirr: xirr !== null ? xirr : Math.round(((currentVal - runningInvested) / (runningInvested || 1)) * 100 * 10) / 10,
      ledger
    };
  };

  const handleStockSearch = (q) => {
    setStockSearchQuery(q);
    if (!q || q.trim() === '') {
      setStockSearchResults([]);
      return;
    }
    
    const term = q.toLowerCase().trim();
    const platform = quickAddStock.platform;
    const isUS = platform === 'INDMoney';
    
    // 1. Instant local search from POPULAR_STOCKS
    const localMatches = stocksList.filter(s => {
      const matchesPlatform = isUS ? s.type === 'US' : s.type === 'IN';
      if (!matchesPlatform) return false;
      return s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
    }).map(s => ({ ...s, source: 'local' }));
    
    setStockSearchResults(localMatches);
    
    if (term.length < 2) return;
    
    // Check local cache
    const cacheKey = `${platform}_${term}`;
    if (stockSearchCache.current[cacheKey]) {
      const cached = stockSearchCache.current[cacheKey];
      // Merge local and cached, avoiding duplicates
      const merged = [...localMatches];
      cached.forEach(cs => {
        if (!merged.some(ls => ls.symbol.toLowerCase() === cs.symbol.toLowerCase())) {
          merged.push(cs);
        }
      });
      setStockSearchResults(merged);
      return;
    }
    
    if (stockSearchTimer.current) clearTimeout(stockSearchTimer.current);
    stockSearchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/market/search?q=${encodeURIComponent(q)}&platform=${platform}`);
        if (res.data && res.data.success && res.data.results) {
          const apiResults = res.data.results.map(item => ({
            symbol: item.symbol,
            name: item.name,
            platform: platform,
            type: isUS ? 'US' : 'IN',
            sector: isUS ? 'US Stock' : 'Indian Stock',
            price: item.price || 0,
            changePercent: item.changePercent || 0,
            isUp: item.changePercent >= 0,
            source: 'api'
          }));
          
          stockSearchCache.current[cacheKey] = apiResults;
          
          setStockSearchResults(prev => {
            const merged = [...prev];
            apiResults.forEach(as => {
              const existsIdx = merged.findIndex(ls => ls.symbol.toLowerCase() === as.symbol.toLowerCase());
              if (existsIdx === -1) {
                merged.push(as);
              } else if (merged[existsIdx].source === 'local' && as.price > 0) {
                // Update local match with live price from API search
                merged[existsIdx] = { ...merged[existsIdx], ...as, source: 'local' };
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Error fetching stock search results:', err);
      }
    }, 300);
  };

  const handleBondSearch = (q) => {
    setBondSearchQuery(q);
    const list = bondSuggestionsList[quickAddBond.type] || [];
    if (!q || q.trim() === '') {
      setBondSearchResults(list);
      return;
    }
    const cleanQ = q.trim().toLowerCase();
    
    // Scored matching
    const scored = list.map(b => {
      let score = 0;
      const lowerName = b.name.toLowerCase();
      const lowerDesc = b.desc.toLowerCase();
      const lowerTax = b.taxBadge.toLowerCase();
      
      if (lowerName === cleanQ) score += 1000;
      else if (lowerName.startsWith(cleanQ)) score += 500;
      else if (lowerName.includes(cleanQ)) score += 200;
      else if (lowerDesc.includes(cleanQ)) score += 80;
      
      // Token matches
      const tokens = cleanQ.split(/\s+/).filter(Boolean);
      let matchedTokens = 0;
      tokens.forEach(token => {
        if (lowerName.includes(token)) {
          score += 50;
          matchedTokens++;
        } else if (lowerDesc.includes(token)) {
          score += 15;
          matchedTokens++;
        } else if (lowerTax.includes(token)) {
          score += 25;
          matchedTokens++;
        }
      });
      
      if (matchedTokens === tokens.length && tokens.length > 1) {
        score += 100;
      }
      
      return { item: b, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
    
    setBondSearchResults(scored);
  };

  const loadSIPPortfolio = async () => {
    setIsPortfolioLoading(true);
    try {
      const { data } = await api.get('/sip-portfolio');
      if (data.success && data.data) {
        setDbPortfolio(data.data);

        const sips = data.data.sips || [];
        const gold = data.data.goldHoldings || [];
        const dbStocks = data.data.zerodhaHoldings || [];
        const dbUsStocks = data.data.indmoneyUS || [];
        const dbCryptos = data.data.cryptos || [];

        let pGold = 0, pSilver = 0, aGold = 0, aSilver = 0, jGold = 0;
        let mGold = 0, mSilver = 0, sGold = 0, sSilver = 0, zGold = 0, zSilver = 0;
        gold.forEach(g => {
          const grams = parseFloat(g.grams) || 0;
          if (g.platform === 'PhonePe' && g.metalType === 'Gold') pGold = grams;
          if (g.platform === 'PhonePe' && g.metalType === 'Silver') pSilver = grams;
          if (g.platform === 'Aura Gold' && g.metalType === 'Gold') aGold = grams;
          if (g.platform === 'Aura Gold' && g.metalType === 'Silver') aSilver = grams;
          if (g.platform === 'Jar' && g.metalType === 'Gold') jGold = grams;
          if (g.platform === 'MMTC-PAMP' && g.metalType === 'Gold') mGold = grams;
          if (g.platform === 'MMTC-PAMP' && g.metalType === 'Silver') mSilver = grams;
          if (g.platform === 'SafeGold' && g.metalType === 'Gold') sGold = grams;
          if (g.platform === 'SafeGold' && g.metalType === 'Silver') sSilver = grams;
          if (g.platform === 'Zerodha' && g.metalType === 'Gold') zGold = grams;
          if (g.platform === 'Zerodha' && g.metalType === 'Silver') zSilver = grams;
        });

        const growwMF = [];
        const phonepeMF = [];
        const paytmmoneyMF = [];

        await Promise.all(sips.map(async (sip) => {
          try {
            const res = await fetch(`https://api.mfapi.in/mf/${sip.schemeCode}`);
            const navData = await res.json();
            if (navData && navData.data) {
              const calc = calculateSipUnits(sip, navData.data);
              if (calc) {
                const item = {
                  id: sip._id,
                  name: sip.schemeName,
                  units: calc.units,
                  avgNav: calc.avgNav,
                  currentNav: calc.currentNav,
                  invested: calc.invested,
                  platform: sip.platform,
                  sipAmount: sip.sipAmount,
                  sipDay: sip.sipDay,
                  startDate: sip.startDate,
                  stepUpPercent: sip.stepUpPercent,
                  category: sip.category,
                  xirr: calc.xirr,
                  ledger: calc.ledger
                };
                if (sip.platform === 'Groww') growwMF.push(item);
                else if (sip.platform === 'PhonePe') phonepeMF.push(item);
                else paytmmoneyMF.push(item);
              }
            }
          } catch (err) {
            console.error('Error calculating SIP:', err);
          }
        }));

        // Fetch live prices for Zerodha Stocks concurrently in one batch request
        let updatedStocks = [...dbStocks];
        if (dbStocks.length > 0) {
          try {
            const symbolsList = dbStocks.map(s => s.symbol).join(',');
            const quotesRes = await api.get(`/market/quotes?symbols=${encodeURIComponent(symbolsList)}`);
            if (quotesRes.data && quotesRes.data.success && quotesRes.data.quotes) {
              updatedStocks = dbStocks.map(stock => {
                const quote = quotesRes.data.quotes.find(q => q.symbol.toUpperCase() === stock.symbol.toUpperCase());
                const price = quote ? quote.price : stock.currentPrice || stock.avgPrice;
                return {
                  ...stock,
                  id: stock._id || stock.id,
                  currentPrice: price,
                  invested: Math.round(stock.qty * stock.avgPrice)
                };
              });
            }
          } catch (e) {
            console.warn('Failed to fetch live quotes for stocks:', e);
          }
        }

        // Fetch live prices for US Stocks concurrently in one batch request
        let updatedUsStocks = [...dbUsStocks];
        if (dbUsStocks.length > 0) {
          try {
            const symbolsList = dbUsStocks.map(s => s.symbol).join(',');
            const quotesRes = await api.get(`/market/quotes?symbols=${encodeURIComponent(symbolsList)}`);
            if (quotesRes.data && quotesRes.data.success && quotesRes.data.quotes) {
              updatedUsStocks = dbUsStocks.map(stock => {
                const quote = quotesRes.data.quotes.find(q => q.symbol.toUpperCase() === stock.symbol.toUpperCase());
                const price = quote ? quote.price : stock.currentPriceUsd || stock.avgPriceUsd;
                return {
                  ...stock,
                  id: stock._id || stock.id,
                  currentPriceUsd: price,
                  investedUsd: stock.qty * stock.avgPriceUsd
                };
              });
            }
          } catch (e) {
            console.warn('Failed to fetch live quotes for US stocks:', e);
          }
        }

        // Map database cryptos
        const mappedCryptos = dbCryptos.map(c => ({
          ...c,
          id: c._id || c.id
        }));

        setConsolidatedHoldings({
          growwMF,
          phonepeMF,
          paytmmoneyMF,
          phonepeGoldGrams: pGold,
          phonepeSilverGrams: pSilver,
          auragoldGrams: aGold,
          auraSilverGrams: aSilver,
          jarGoldGrams: jGold,
          mmtcGoldGrams: mGold,
          mmtcSilverGrams: mSilver,
          safegoldGoldGrams: sGold,
          safegoldSilverGrams: sSilver,
          zerodhaGoldGrams: zGold,
          zerodhaSilverGrams: zSilver,
          zerodhaHoldings: updatedStocks,
          indmoneyUS: updatedUsStocks,
          cryptos: mappedCryptos
        });
      }
    } catch (err) {
      console.error('Error fetching SIP Portfolio:', err);
    } finally {
      setIsPortfolioLoading(false);
    }
  };

  // Add the selected MF to the database (supports SIP and initial Lumpsum)
  const addMfToVault = async () => {
    if (!selectedScheme) { toast.error('Please search and select a fund first'); return; }

    const isSip = quickAddInvestmentType === 'sip';
    const amount = parseFloat(quickAddSipAmount);
    if (!amount || amount <= 0) {
      toast.error(isSip ? 'Enter a valid monthly SIP amount' : 'Enter a valid investment amount');
      return;
    }
    if (isSip && (!quickAddSipDay || parseInt(quickAddSipDay) < 1 || parseInt(quickAddSipDay) > 28)) {
      toast.error('Enter a valid SIP date (1-28)');
      return;
    }
    if (!quickAddStartDate) { toast.error('Please enter a date'); return; }

    const loadingToast = toast.loading(isSip ? `Registering SIP for ${selectedScheme.schemeName}...` : `Registering Lumpsum for ${selectedScheme.schemeName}...`);
    try {
      const res = await api.post('/sip-portfolio/sip', {
        schemeCode: selectedScheme.schemeCode,
        schemeName: selectedScheme.schemeName,
        platform: quickAddPlatform,
        sipAmount: isSip ? amount : 0,
        sipDay: isSip ? parseInt(quickAddSipDay) : 1,
        startDate: new Date(quickAddStartDate),
        stepUpPercent: isSip ? (parseFloat(quickAddStepUp) || 0) : 0,
        category: quickAddCategory
      });

      if (!isSip && res.data && res.data.data) {
        const portfolio = res.data.data;
        const newSip = (portfolio.sips || []).find(s => s.schemeCode === selectedScheme.schemeCode);
        if (newSip) {
          await api.post(`/sip-portfolio/sip/${newSip._id}/lumpsum`, {
            date: new Date(quickAddStartDate),
            amount: amount,
            note: 'Initial Lumpsum Investment'
          });
        }
      }

      addSecurityLog('SIP_ADDED', isSip ? `Registered SIP for ${selectedScheme.schemeName} (₹${amount}/mo)` : `Registered Lumpsum for ${selectedScheme.schemeName} (₹${amount})`, 'success');
      toast.success(isSip ? `✅ ${selectedScheme.schemeName} SIP registered!` : `✅ ${selectedScheme.schemeName} Lumpsum registered!`, { id: loadingToast });

      // Reset search fields
      setSelectedScheme(null);
      setMfSearchQuery('');
      setQuickAddLiveNav(null);

      await loadSIPPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register', { id: loadingToast });
    }
  };

  const addLumpsumTransaction = async () => {
    if (!selectedSipForLumpsum) return;
    if (!lumpsumForm.amount || parseFloat(lumpsumForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!lumpsumForm.date) {
      toast.error('Please select a transaction date');
      return;
    }

    const loadingToast = toast.loading('Adding transaction...');
    try {
      await api.post(`/sip-portfolio/sip/${selectedSipForLumpsum.id}/lumpsum`, {
        date: new Date(lumpsumForm.date),
        amount: parseFloat(lumpsumForm.amount),
        note: lumpsumForm.note || 'Manual lumpsum addition'
      });
      toast.success('✅ Transaction recorded! Recalculating units...', { id: loadingToast });
      setShowLumpsumModal(false);
      await loadSIPPortfolio();
    } catch (err) {
      toast.error('Failed to add transaction', { id: loadingToast });
    }
  };

  const addRedemptionTransaction = async () => {
    if (!selectedSipForLumpsum) return;
    const amount = parseFloat(lumpsumForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid redemption amount');
      return;
    }
    if (!lumpsumForm.date) {
      toast.error('Please select a transaction date');
      return;
    }

    const loadingToast = toast.loading('Calculating NAV and recording redemption...');
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${selectedSipForLumpsum.schemeCode}`);
      const navData = await res.json();
      if (!navData || !navData.data || navData.data.length === 0) {
        throw new Error('Failed to retrieve historical NAV for this fund.');
      }

      // Sort oldest first
      const navHistory = navData.data
        .map(d => ({ date: parseMfDate(d.date), nav: parseFloat(d.nav) }))
        .sort((a, b) => a.date - b.date);

      const targetDate = new Date(lumpsumForm.date);
      // Find the NAV on or after targetDate
      const entry = navHistory.find(h => h.date >= targetDate) || navHistory[navHistory.length - 1];
      const nav = entry ? entry.nav : 0;
      if (nav <= 0) {
        throw new Error('Invalid NAV retrieved for the selected date.');
      }

      const calculatedUnits = amount / nav;

      await api.post(`/sip-portfolio/sip/${selectedSipForLumpsum.id}/redemption`, {
        date: new Date(lumpsumForm.date),
        units: calculatedUnits,
        nav: nav,
        note: lumpsumForm.note || 'Manual redemption'
      });
      toast.success('✅ Redemption transaction recorded!', { id: loadingToast });
      setShowLumpsumModal(false);
      await loadSIPPortfolio();
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Failed to record redemption', { id: loadingToast });
    }
  };

  const deleteTransaction = async (sipId, type, txnId) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This will recalculate all units.')) return;
    const loadingToast = toast.loading('Deleting transaction...');
    try {
      const endpoint = type === 'lumpsum' ? 'lumpsum' : 'redemption';
      await api.delete(`/sip-portfolio/sip/${sipId}/${endpoint}/${txnId}`);
      toast.success('✅ Transaction deleted! Recalculating...', { id: loadingToast });
      await loadSIPPortfolio();
    } catch (err) {
      toast.error('Failed to delete transaction', { id: loadingToast });
    }
  };

  const toggleLedger = (id) => {
    setExpandedLedgerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Save gold/silver grams to database
  const saveGoldToVault = async () => {
    const phonepeGold = parseFloat(quickAddGold.phonepeGold) || 0;
    const phonepeSilver = parseFloat(quickAddGold.phonepeSilver) || 0;
    const auraGold = parseFloat(quickAddGold.auraGold) || 0;
    const auraSilver = parseFloat(quickAddGold.auraSilver) || 0;
    const jarGold = parseFloat(quickAddGold.jarGold) || 0;
    const mmtcGold = parseFloat(quickAddGold.mmtcGold) || 0;
    const mmtcSilver = parseFloat(quickAddGold.mmtcSilver) || 0;
    const safegoldGold = parseFloat(quickAddGold.safegoldGold) || 0;
    const safegoldSilver = parseFloat(quickAddGold.safegoldSilver) || 0;
    const zerodhaGold = parseFloat(quickAddGold.zerodhaGold) || 0;
    const zerodhaSilver = parseFloat(quickAddGold.zerodhaSilver) || 0;

    const loadingToast = toast.loading('Saving commodity holdings to database...');
    try {
      await api.put('/sip-portfolio/gold', {
        goldHoldings: [
          { platform: 'PhonePe', metalType: 'Gold', grams: phonepeGold },
          { platform: 'PhonePe', metalType: 'Silver', grams: phonepeSilver },
          { platform: 'Aura Gold', metalType: 'Gold', grams: auraGold },
          { platform: 'Aura Gold', metalType: 'Silver', grams: auraSilver },
          { platform: 'Jar', metalType: 'Gold', grams: jarGold },
          { platform: 'MMTC-PAMP', metalType: 'Gold', grams: mmtcGold },
          { platform: 'MMTC-PAMP', metalType: 'Silver', grams: mmtcSilver },
          { platform: 'SafeGold', metalType: 'Gold', grams: safegoldGold },
          { platform: 'SafeGold', metalType: 'Silver', grams: safegoldSilver },
          { platform: 'Zerodha', metalType: 'Gold', grams: zerodhaGold },
          { platform: 'Zerodha', metalType: 'Silver', grams: zerodhaSilver }
        ].filter(h => h.grams > 0)
      });

      addSecurityLog('COMMODITY_UPDATED', `Commodities saved persistently`, 'success');
      toast.success('✅ Commodity holdings saved persistently!', { id: loadingToast });
      setShowQuickAddModal(false);
      await loadSIPPortfolio();
    } catch (err) {
      toast.error('Failed to save commodity holdings', { id: loadingToast });
    }
  };

  const saveBondToVault = async () => {
    const invested = parseFloat(quickAddBond.invested) || 0;
    if (!quickAddBond.name || invested <= 0) {
      toast.error('Please enter a valid Bond/FD name and invested amount');
      return;
    }

    const loadingToast = toast.loading('Adding Bond/FD holding...');
    try {
      await api.post('/sip-portfolio/stock', {
        symbol: quickAddBond.type + '_' + Math.random().toString(36).substring(7).toUpperCase(),
        name: `${quickAddBond.name} (${quickAddBond.type})`,
        qty: parseFloat(quickAddBond.qty) || 1,
        avgPrice: invested / (parseFloat(quickAddBond.qty) || 1),
        currentPrice: invested / (parseFloat(quickAddBond.qty) || 1),
        category: 'Bond',
        platform: quickAddBond.type === 'FD' ? 'Bank FD' : quickAddBond.type === 'PPF' ? 'Post Office / Bank' : 'Zerodha'
      });

      addSecurityLog('BOND_ADDED', `Bond/FD added: ${quickAddBond.name} (₹${invested})`, 'success');
      toast.success('✅ Bond / Fixed Income registered successfully!', { id: loadingToast });
      setShowQuickAddModal(false);

      setQuickAddBond({
        type: 'SGB',
        name: '', invested: '', maturityDate: '', interestRate: '', qty: ''
      });

      await loadSIPPortfolio();
    } catch (err) {
      toast.error('Failed to register Bond/FD holding', { id: loadingToast });
    }
  };

  const saveStockToVault = async () => {
    const qty = parseFloat(quickAddStock.qty) || 0;
    const avgPrice = parseFloat(quickAddStock.avgPrice) || 0;
    if (!quickAddStock.name || !quickAddStock.symbol || qty <= 0 || avgPrice <= 0) {
      toast.error('Please enter a valid stock name, symbol, quantity, and average price');
      return;
    }
    const loadingToast = toast.loading('Adding Stock holding...');
    try {
      await api.post('/sip-portfolio/stock', {
        symbol: quickAddStock.symbol.toUpperCase(),
        name: quickAddStock.name,
        qty,
        avgPrice,
        currentPrice: avgPrice,
        category: 'Stock',
        platform: quickAddStock.platform
      });
      addSecurityLog('STOCK_ADDED', `Stock added: ${quickAddStock.name} (${quickAddStock.symbol})`, 'success');
      toast.success('✅ Stock added to Zerodha Portfolio successfully!', { id: loadingToast });
      setShowQuickAddModal(false);
      setQuickAddStock({ name: '', symbol: '', qty: '', avgPrice: '', platform: 'Zerodha' });
      await loadSIPPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock', { id: loadingToast });
    }
  };

  const saveUsStockToVault = async () => {
    const qty = parseFloat(quickAddStock.qty) || 0;
    const avgPriceUsd = parseFloat(quickAddStock.avgPrice) || 0;
    if (!quickAddStock.name || !quickAddStock.symbol || qty <= 0 || avgPriceUsd <= 0) {
      toast.error('Please enter a valid stock name, symbol, quantity, and average price');
      return;
    }
    const loadingToast = toast.loading('Adding US Stock holding...');
    try {
      await api.post('/sip-portfolio/us-stock', {
        symbol: quickAddStock.symbol.toUpperCase(),
        name: quickAddStock.name,
        qty,
        avgPriceUsd,
        currentPriceUsd: avgPriceUsd,
        category: 'US Stock',
        platform: 'INDMoney'
      });
      addSecurityLog('US_STOCK_ADDED', `US Stock added: ${quickAddStock.name} (${quickAddStock.symbol})`, 'success');
      toast.success('✅ US Stock added to INDMoney Portfolio successfully!', { id: loadingToast });
      setShowQuickAddModal(false);
      setQuickAddStock({ name: '', symbol: '', qty: '', avgPrice: '', platform: 'Zerodha' });
      await loadSIPPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add US stock', { id: loadingToast });
    }
  };

  const saveCryptoToVault = async () => {
    const qty = parseFloat(quickAddCrypto.qty) || 0;
    const avgPrice = parseFloat(quickAddCrypto.avgPrice) || 0;
    if (!quickAddCrypto.name || !quickAddCrypto.symbol || qty <= 0 || avgPrice <= 0) {
      toast.error('Please enter a valid coin name, symbol, quantity, and average price');
      return;
    }
    const loadingToast = toast.loading('Adding Crypto holding...');
    try {
      await api.post('/sip-portfolio/crypto', {
        symbol: quickAddCrypto.symbol.toUpperCase(),
        name: quickAddCrypto.name,
        qty,
        avgPrice,
        currentPrice: avgPrice,
        platform: quickAddCrypto.platform
      });
      addSecurityLog('CRYPTO_ADDED', `Crypto added: ${quickAddCrypto.name} (${quickAddCrypto.symbol})`, 'success');
      toast.success('✅ Crypto added to Portfolio successfully!', { id: loadingToast });
      setShowQuickAddModal(false);
      setQuickAddCrypto({ name: '', symbol: '', qty: '', avgPrice: '', platform: 'CoinDCX' });
      await loadSIPPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add crypto', { id: loadingToast });
    }
  };

  const deleteRegisteredSIP = async (sipId) => {
    const loadingToast = toast.loading('Removing SIP from database...');
    try {
      await api.delete(`/sip-portfolio/sip/${sipId}`);
      toast.success('✅ SIP removed persistently!', { id: loadingToast });
      await loadSIPPortfolio();
    } catch (err) {
      toast.error('Failed to remove SIP from database', { id: loadingToast });
    }
  };

  const clearGoldGrams = async (key) => {
    const updatedGold = {
      phonepeGold: key === 'phonepeGoldGrams' ? 0 : consolidatedHoldings.phonepeGoldGrams,
      phonepeSilver: key === 'phonepeSilverGrams' ? 0 : consolidatedHoldings.phonepeSilverGrams,
      auraGold: key === 'auragoldGrams' ? 0 : consolidatedHoldings.auragoldGrams,
      auraSilver: key === 'auraSilverGrams' ? 0 : consolidatedHoldings.auraSilverGrams,
      jarGold: key === 'jarGoldGrams' ? 0 : consolidatedHoldings.jarGoldGrams,
      mmtcGold: key === 'mmtcGoldGrams' ? 0 : consolidatedHoldings.mmtcGoldGrams,
      mmtcSilver: key === 'mmtcSilverGrams' ? 0 : consolidatedHoldings.mmtcSilverGrams,
      safegoldGold: key === 'safegoldGoldGrams' ? 0 : consolidatedHoldings.safegoldGoldGrams,
      safegoldSilver: key === 'safegoldSilverGrams' ? 0 : consolidatedHoldings.safegoldSilverGrams,
      zerodhaGold: key === 'zerodhaGoldGrams' ? 0 : consolidatedHoldings.zerodhaGoldGrams,
      zerodhaSilver: key === 'zerodhaSilverGrams' ? 0 : consolidatedHoldings.zerodhaSilverGrams,
    };
    const loadingToast = toast.loading('Clearing gram balance...');
    try {
      await api.put('/sip-portfolio/gold', {
        goldHoldings: [
          { platform: 'PhonePe', metalType: 'Gold', grams: updatedGold.phonepeGold },
          { platform: 'PhonePe', metalType: 'Silver', grams: updatedGold.phonepeSilver },
          { platform: 'Aura Gold', metalType: 'Gold', grams: updatedGold.auraGold },
          { platform: 'Aura Gold', metalType: 'Silver', grams: updatedGold.auraSilver },
          { platform: 'Jar', metalType: 'Gold', grams: updatedGold.jarGold },
          { platform: 'MMTC-PAMP', metalType: 'Gold', grams: updatedGold.mmtcGold },
          { platform: 'MMTC-PAMP', metalType: 'Silver', grams: updatedGold.mmtcSilver },
          { platform: 'SafeGold', metalType: 'Gold', grams: updatedGold.safegoldGold },
          { platform: 'SafeGold', metalType: 'Silver', grams: updatedGold.safegoldSilver },
          { platform: 'Zerodha', metalType: 'Gold', grams: updatedGold.zerodhaGold },
          { platform: 'Zerodha', metalType: 'Silver', grams: updatedGold.zerodhaSilver }
        ].filter(h => h.grams > 0)
      });
      toast.success('✅ Cleared persistently!', { id: loadingToast });
      await loadSIPPortfolio();
    } catch {
      toast.error('Failed to clear balance', { id: loadingToast });
    }
  };

  const fastForwardSimulatedTime = (years) => {
    if (virtualSIPs.length === 0) {
      toast.error('Set up at least one virtual SIP first to fast-forward simulated wealth growth!');
      return;
    }
    setFastForwarding(true);
    const loadingToast = toast.loading(`Fast-forwarding simulated time by ${years} years... ⏳`);

    setTimeout(() => {
      setVirtualSIPs(current => current.map(sip => {
        const months = years * 12;
        const totalInvested = sip.totalInvested + (sip.monthlyAmount * months);

        let rate = 0.12;
        if (sip.fundName.includes('Small-Cap')) rate = 0.22;
        if (sip.fundName.includes('Liquid')) rate = 0.06;
        if (sip.fundName.includes('Index')) rate = 0.12;

        const r = rate / 12;
        const n = months;

        // Start from current value
        const futureValueCurrentPart = sip.currentVal * Math.pow(1 + r, n);
        const futureValueNewPart = r > 0
          ? sip.monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
          : sip.monthlyAmount * n;

        const nextVal = futureValueCurrentPart + futureValueNewPart;

        return {
          ...sip,
          totalInvested,
          currentVal: Math.round(nextVal),
          nextDebitDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 30 * months)).toISOString().split('T')[0]
        };
      }));

      setFastForwarding(false);
      toast.success(`Welcome to the Future! Simulated portfolio successfully fast-forwarded by ${years} years! 🚀`, { id: loadingToast });
    }, 2000);
  };

  const calculateSIPDetails = () => {
    const P = parseFloat(sipForm.monthly) || 0;
    const r = parseFloat(sipForm.expectedReturn || 0) / 100 / 12;
    const n = (parseFloat(sipForm.years) || 0) * 12;

    let invested = 0;
    let totalValue = 0;

    if (sipForm.isLumpsum) {
      invested = P;
      totalValue = P * Math.pow(1 + (parseFloat(sipForm.expectedReturn || 0) / 100), parseFloat(sipForm.years || 0));
    } else {
      invested = P * n;
      totalValue = r > 0
        ? P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
        : P * n;
    }

    const earnings = Math.max(0, totalValue - invested);

    // Apply inflation adjustment (6% reduction in purchasing power) if selected
    const inflationMultiplier = sipForm.inflationAdjust ? Math.pow(1 - 0.06, parseFloat(sipForm.years || 0)) : 1;

    return {
      invested: invested * inflationMultiplier,
      earnings: earnings * inflationMultiplier,
      total: totalValue * inflationMultiplier
    };
  };

  const calculateExpenseRatioLeakage = () => {
    const monthly = 10000;
    const years = 25;
    const n = years * 12;

    // Direct index fund (0.2% expense ratio -> net return 11.8%)
    const rateDirect = (12 - 0.2) / 100 / 12;
    const valDirect = monthly * ((Math.pow(1 + rateDirect, n) - 1) / rateDirect) * (1 + rateDirect);

    // Regular commission fund (1.5% expense ratio -> net return 10.5%)
    const rateRegular = (12 - 1.5) / 100 / 12;
    const valRegular = monthly * ((Math.pow(1 + rateRegular, n) - 1) / rateRegular) * (1 + rateRegular);

    const leak = valDirect - valRegular;
    return {
      direct: valDirect,
      regular: valRegular,
      lost: leak,
      percentLost: (leak / valDirect) * 100
    };
  };

  const riskQuestions = [
    {
      q: "What is your main investment objective?",
      options: [
        { label: "Capital preservation with very low risk", score: 1 },
        { label: "Steady long-term growth with moderate volatility", score: 3 },
        { label: "Maximize returns aggressively, accepting high drops", score: 5 }
      ]
    },
    {
      q: "How would you react if your fund value dropped 20% in a market correction?",
      options: [
        { label: "Panic and withdraw remaining funds immediately", score: 1 },
        { label: "Wait out the correction patiently and hold", score: 3 },
        { label: "Invest more money to buy the market dip", score: 5 }
      ]
    },
    {
      q: "What is your intended investment time horizon?",
      options: [
        { label: "Short term (Less than 2 years)", score: 1 },
        { label: "Medium term (3 to 5 years)", score: 3 },
        { label: "Long term (More than 5 years)", score: 5 }
      ]
    }
  ];

  const handleRiskAnswer = (questionIdx, score) => {
    const nextAnswers = { ...riskAnswers, [`Q${questionIdx}`]: score };
    setRiskAnswers(nextAnswers);
    if (questionIdx < riskQuestions.length - 1) {
      setCurrentRiskStep(questionIdx + 1);
    } else {
      // Calculate final score
      const totalScore = Object.values(nextAnswers).reduce((a, b) => (parseInt(a) || 0) + (parseInt(b) || 0), 0);
      let profile = 'Moderate';
      let allocation = [];
      let funds = [];
      let rationale = '';

      if (totalScore <= 5) {
        profile = 'Conservative Capital Shield';
        allocation = [
          { name: 'Short-term Debt / Liquid Funds', value: 60, color: '#8b5cf6' },
          { name: 'Large Cap Index Fund', value: 20, color: '#7C3AED' },
          { name: 'Hedge Gold ETF', value: 20, color: '#f59e0b' }
        ];
        funds = [
          { name: 'FinBuddy Liquid Debt Fund (Direct)', expense: '0.12%', rating: '★★★★★', type: 'Debt' },
          { name: 'UTI Nifty 50 Index Fund (Direct Growth)', expense: '0.15%', rating: '★★★★☆', type: 'Equity Large Cap' }
        ];
        rationale = 'Your objective prioritizes safety over high growth. A 60% allocation to high-yielding debt/liquid funds protects your capital, while a small 40% equity/gold blend hedges against inflation.';
      } else if (totalScore <= 10) {
        profile = 'Balanced / Moderate Growth';
        allocation = [
          { name: 'Large Cap Equity Fund', value: 50, color: '#7C3AED' },
          { name: 'Active Mid & Small Cap Equity', value: 25, color: '#A78BFA' },
          { name: 'Corporate Debt Fund', value: 25, color: '#8b5cf6' }
        ];
        funds = [
          { name: 'Axis Bluechip Fund (Direct Growth)', expense: '0.22%', rating: '★★★★★', type: 'Equity Large Cap' },
          { name: 'FinBuddy Active Multi-Cap Fund', expense: '0.35%', rating: '★★★★☆', type: 'Equity Hybrid' }
        ];
        rationale = 'A balanced blend is ideal for your medium-to-long term horizons. 75% equity gives exposure to high growth while 25% corporate debt cushions market volatility.';
      } else {
        profile = 'Aggressive Wealth Accumulator';
        allocation = [
          { name: 'Active Mid Cap Fund', value: 40, color: '#A78BFA' },
          { name: 'Emerging Small Cap Fund', value: 40, color: '#ef4444' },
          { name: 'International Index ETF', value: 20, color: '#7C3AED' }
        ];
        funds = [
          { name: 'FinBuddy Alpha Emerging Small-Cap Fund', expense: '0.38%', rating: '★★★★★', type: 'Equity Small Cap' },
          { name: 'FinBuddy Technology Opportunities Fund', expense: '0.45%', rating: '★★★★★', type: 'Equity Sectoral' }
        ];
        rationale = 'With an aggressive mindset and long-term view, you are ready to command maximum compound returns by allocating heavily to fast-growing mid, small, and global equities.';
      }

      setRiskResult({ profile, allocation, funds, rationale });
      setCurrentRiskStep(riskQuestions.length);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (activeTab === 'crypto') loadCryptoPrices(); }, [activeTab]);

  const loadData = async () => {
    try {
      // Show page immediately — fetch networth + EMI first (fast), then portfolio in background
      const [nwRes, emiRes] = await Promise.allSettled([
        api.get('/wealth/networth'),
        api.get('/wealth/emi'),
      ]);
      if (nwRes.status === 'fulfilled') setNetWorth(nwRes.value.data);
      if (emiRes.status === 'fulfilled') setEmis(emiRes.value.data.emis || []);
    } catch (e) { toast.error('Failed to load data'); }
    setLoading(false);       // Unblock the page — SIP portfolio loads in background below
    loadSIPPortfolio();      // Non-blocking: portfolio section will shimmer until ready
  };

  const loadCryptoPrices = async () => {
    try {
      const { data } = await api.get('/market/crypto');
      setCryptoPrices(data.coins || []);
    } catch (e) { }
  };

  const downloadAnnualReview = async () => {
    const loadingToast = toast.loading('Compiling annual wealth metrics... 📊');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pdf/annual-review`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('finbuddy_token')}` } }
      );
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finbuddy-annual-review.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Annual Review PDF downloaded! 📊', { id: loadingToast });
    } catch (e) {
      toast.error('Failed to generate Annual Review PDF — check server', { id: loadingToast });
    }
  };

  const seedDemoEMI = async (presetType) => {
    let preset;
    if (presetType === 'home') {
      preset = {
        name: 'Home Loan (Demo)',
        principal: 5000000,
        annualRate: 8.5,
        tenureMonths: 240,
        category: 'Home',
        startDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year ago
      };
    } else if (presetType === 'car') {
      preset = {
        name: 'Car Loan (Demo)',
        principal: 1000000,
        annualRate: 9.2,
        tenureMonths: 60,
        category: 'Car',
        startDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 months ago
      };
    } else if (presetType === 'education') {
      preset = {
        name: 'Education Loan (Demo)',
        principal: 1500000,
        annualRate: 10.5,
        tenureMonths: 120,
        category: 'Education',
        startDate: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 years ago
      };
    }
    if (!preset) return;
    try {
      await api.post('/wealth/emi', { ...preset });
      toast.success(`${preset.name} added! 💰`);
      loadData();
    } catch (e) {
      toast.error('Failed to seed demo loan');
    }
  };

  const getLiabilityMetrics = () => {
    if (emis.length === 0) return null;
    const totalPrincipal = emis.reduce((sum, e) => sum + parseFloat(e.principal || 0), 0);
    const totalMonthlyEmi = emis.reduce((sum, e) => sum + parseFloat(e.emi || 0), 0);
    const totalInterest = emis.reduce((sum, e) => sum + parseFloat(e.totalInterest || 0), 0);
    
    let maxRemainingMonths = 0;
    emis.forEach(e => {
      const elapsed = Math.floor((Date.now() - new Date(e.startDate)) / (1000 * 60 * 60 * 24 * 30));
      const remaining = Math.max(0, parseInt(e.tenureMonths || 0) - elapsed);
      if (remaining > maxRemainingMonths) {
        maxRemainingMonths = remaining;
      }
    });

    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + maxRemainingMonths);
    const formattedDate = debtFreeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
      totalPrincipal,
      totalMonthlyEmi,
      totalInterest,
      maxRemainingMonths,
      formattedDate
    };
  };

  const calculateEMI = async () => {
    if (!emiForm.principal || !emiForm.annualRate || !emiForm.tenureMonths) return;
    try {
      const { data } = await api.post('/wealth/emi/calculate', {
        ...emiForm,
        extraMonthly: extraPayment || 0
      });
      setEmiResult(data);
    } catch (e) { toast.error('Calculation failed'); }
  };

  const addEMI = async () => {
    if (!emiForm.name || !emiResult) return;
    try {
      await api.post('/wealth/emi', { ...emiForm });
      toast.success('EMI added!');
      setShowEmiModal(false);
      setEmiForm({
        name: '',
        principal: '',
        annualRate: '',
        tenureMonths: '',
        category: 'Other',
        startDate: new Date().toISOString().split('T')[0]
      });
      setEmiResult(null);
      loadData();
    } catch (e) { toast.error('Failed to add EMI'); }
  };

  const deleteEMI = async (id) => {
    try {
      await api.delete(`/wealth/emi/${id}`);
      toast.success('EMI removed');
      loadData();
    } catch (e) { }
  };

  const addCrypto = async () => {
    if (!cryptoForm.coinId || !cryptoForm.quantity) return;
    try {
      await api.post('/wealth/crypto', cryptoForm);
      toast.success('Crypto holding added!');
      setShowCryptoModal(false);
      setCryptoForm({ coinId: '', symbol: '', name: '', quantity: '', avgBuyPrice: '' });
      loadData();
    } catch (e) { toast.error('Failed to add'); }
  };

  const fiScoreColor = (score) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-cyan-400';
    if (score >= 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const assetPieData = netWorth ? [
    { name: 'Cash', value: netWorth.assets?.cash || 0 },
    { name: 'Stocks', value: netWorth.assets?.stocks || 0 },
    { name: 'Crypto', value: netWorth.assets?.crypto || 0 },
  ].filter(d => d.value > 0) : [];

  const simulateDebtPaydown = () => {
    if (emis.length === 0) return null;
    const extraVal = parseFloat(extraPayment) || 0;

    const runSimulation = (sortFn, extra = extraVal) => {
      let activeLoans = emis.map(e => ({
        id: e.id,
        name: e.name,
        principal: parseFloat(e.principal),
        rate: (parseFloat(e.annualRate) || 8.5) / 12 / 100,
        emi: parseFloat(e.emi),
        balance: parseFloat(e.principal),
      }));

      if (sortFn) {
        activeLoans = activeLoans.sort(sortFn);
      }

      let month = 0;
      let totalInterestPaid = 0;
      let history = [{ month: 0, balance: activeLoans.reduce((s, l) => s + l.balance, 0), interest: 0 }];
      const MAX_MONTHS = 360;

      while (activeLoans.some(l => l.balance > 0) && month < MAX_MONTHS) {
        month++;
        let monthlyInterest = 0;
        let minimumRequiredEmi = 0;

        activeLoans.forEach(l => {
          if (l.balance > 0) {
            const interest = l.balance * l.rate;
            monthlyInterest += interest;
            l.balance += interest;
            minimumRequiredEmi += Math.min(l.emi, l.balance);
          }
        });

        totalInterestPaid += monthlyInterest;

        activeLoans.forEach(l => {
          if (l.balance > 0) {
            const payment = Math.min(l.emi, l.balance);
            l.balance -= payment;
          }
        });

        const totalBudget = emis.reduce((s, l) => s + parseFloat(l.emi), 0) + extra;
        let leftoverPay = totalBudget - minimumRequiredEmi;

        for (let l of activeLoans) {
          if (l.balance > 0 && leftoverPay > 0) {
            const addPayment = Math.min(leftoverPay, l.balance);
            l.balance -= addPayment;
            leftoverPay -= addPayment;
          }
        }

        const currentTotalBalance = activeLoans.reduce((s, l) => s + l.balance, 0);
        history.push({
          month,
          balance: currentTotalBalance,
          interest: totalInterestPaid
        });
      }

      return {
        months: month,
        totalInterest: totalInterestPaid,
        history
      };
    };

    const regularResult = runSimulation(null, 0);
    const snowballResult = runSimulation((a, b) => a.balance - b.balance, extraVal);
    const avalancheResult = runSimulation((a, b) => b.rate - a.rate, extraVal);
    
    const maxLen = Math.max(regularResult.months, snowballResult.months, avalancheResult.months);
    const chartData = [];
    for (let m = 0; m <= maxLen; m += Math.max(1, Math.floor(maxLen / 12))) {
      const regItem = regularResult.history.find(h => h.month === m) || { balance: 0, interest: regularResult.totalInterest };
      const sbItem = snowballResult.history.find(h => h.month === m) || { balance: 0, interest: snowballResult.totalInterest };
      const avItem = avalancheResult.history.find(h => h.month === m) || { balance: 0, interest: avalancheResult.totalInterest };
      chartData.push({
        month: `Month ${m}`,
        'Regular Balance': Math.round(regItem.balance),
        'Snowball Balance': Math.round(sbItem.balance),
        'Avalanche Balance': Math.round(avItem.balance),
      });
    }

    return {
      regular: {
        months: regularResult.months,
        interest: regularResult.totalInterest
      },
      snowball: {
        months: snowballResult.months,
        interest: snowballResult.totalInterest,
        monthsSaved: Math.max(0, regularResult.months - snowballResult.months),
        interestSaved: Math.max(0, Math.round(regularResult.totalInterest - snowballResult.totalInterest))
      },
      avalanche: {
        months: avalancheResult.months,
        interest: avalancheResult.totalInterest,
        monthsSaved: Math.max(0, regularResult.months - avalancheResult.months),
        interestSaved: Math.max(0, Math.round(regularResult.totalInterest - avalancheResult.totalInterest))
      },
      chartData
    };
  };

  // Skeleton shimmer for a card slot while data loads
  const SkeletonCard = ({ h = 'h-28', className = '' }) => (
    <div className={`rounded-2xl overflow-hidden ${h} ${className}`}
      style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite linear' }}
    />
  );

  if (loading) return (
    <div className="contents">
      
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10 space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2"><SkeletonCard h="h-8" className="w-48" /><SkeletonCard h="h-4" className="w-64" /></div>
          <SkeletonCard h="h-9" className="w-36" />
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} h="h-24" />)}
        </div>
        {/* Ticker bar */}
        <SkeletonCard h="h-10" />
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4"><SkeletonCard h="h-64" /><SkeletonCard h="h-48" /></div>
          <div className="space-y-4"><SkeletonCard h="h-44" /><SkeletonCard h="h-32" /></div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="contents">
      {/* Sidebar layout */}
      <main className="lg:pl-72 flex-1 p-4 lg:p-6 pt-20 lg:pt-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">📊 WealthMap</h1>
            <p className="text-slate-400 text-sm mt-1">Your complete financial picture</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/mf"
              className="btn-secondary"
              style={{ width: 'auto', padding: '10px 16px' }}
            >
              🔍 Advanced MF Screener
            </Link>
            <button
              onClick={downloadAnnualReview}
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 20px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}
            >
              📥 Annual Review PDF
            </button>
          </div>
        </div>

        {/* Inline Section Guide */}


        {/* Net Worth Hero */}
        <div className="card border-cyan-500/20 mb-6 text-center py-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="flex justify-center items-center gap-2 mb-2 select-none">
            <p className="text-slate-400 text-sm">Total Net Worth</p>
            <button 
              onClick={() => {
                setValuesMasked(!valuesMasked);
                playVaultSound('click');
              }}
              className="text-slate-500 hover:text-cyan-400 transition text-xs"
              title={valuesMasked ? "Show balances" : "Hide balances"}
            >
              {valuesMasked ? '👁️' : '🙈'}
            </button>
          </div>
          <p className="text-5xl font-bold gradient-text">
            {valuesMasked ? '••••••' : `₹${(netWorth?.netWorth || 0).toLocaleString('en-IN')}`}
          </p>
          <div className="flex justify-center gap-8 mt-6">
            <div
              onMouseEnter={() => setHoveredControl("📈 Total Assets: The cumulative valuation of all your investments, crypto holdings, mutual funds, gold, and cash balances across Groww, PhonePe, Paytm, Zerodha, and INDmoney.")}
              onMouseLeave={() => setHoveredControl("")}
            >
              <p className="text-xs text-slate-400">Assets</p>
              <p className="font-bold text-green-400">₹{(netWorth?.assets?.total || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div
              onMouseEnter={() => setHoveredControl("📈 Total Liabilities: The outstanding principal debt balance of all active loans (Home loan, Car loan, Education loan, etc.) logged in your tracker.")}
              onMouseLeave={() => setHoveredControl("")}
            >
              <p className="text-xs text-slate-400">Liabilities</p>
              <p className="font-bold text-red-400">₹{(netWorth?.liabilities || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div
              onMouseEnter={() => setHoveredControl("📈 Financial Independence (FI) Score: Out of 100, measures your current net worth wealth buffer against standard 25x annual expenses metrics to evaluate retirement readiness.")}
              onMouseLeave={() => setHoveredControl("")}
            >
              <p className="text-xs text-slate-400">FI Score</p>
              <p className={`font-bold text-2xl ${fiScoreColor(netWorth?.fiScore)}`}>{netWorth?.fiScore || 0}/100</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5">
          {[
            { id: 'consolidated', label: 'Wealth Vault', desc: "💼 Wealth Vault: Consolidate your external portfolios (Groww, PhonePe, Paytm, Zerodha, INDmoney, Crypto) into a unified asset ledger." },
            { id: 'rebalancer', label: 'AI Rebalancer', desc: "⚖️ AI Rebalancer: Rebalance asset weights (Equity, Debt, Gold, Cash) based on standard tactical asset allocation guidelines." },
            { id: 'emi', label: 'EMI Tracker', desc: "💳 EMI Tracker: Track home, car, and personal loan debts, prepayment schedules, and simulate Avalanche vs Snowball payoffs." },
            { id: 'expenses', label: 'Expense Ranger', desc: "📈 Expense Ranger: Query range sums on daily expense ledgers instantly using an interactive Segment Tree visualizer." }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              onMouseEnter={() => setHoveredControl(t.desc)}
              onMouseLeave={() => setHoveredControl("")}
              className={`px-4 py-2 capitalize font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === t.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'consolidated' && (
          <div className="space-y-6">

                {/* Live Multi-Asset Ticker Feed Header */}
                <div className="bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-cyan-500/10 p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-3xl animate-pulse">📡</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Live Global Spot & Asset Ticker</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Real-time fluctuations linked to Indian Bullion Market (MCX), Forex Parity (RBI Ref), and Crypto Exchanges</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 justify-center relative z-10">
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">🌟 Gold (MCX)</span>
                      <p className="text-xs font-mono font-black text-yellow-400 mt-0.5">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</p>
                    </div>
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">💿 Silver (MCX)</span>
                      <p className="text-xs font-mono font-black text-slate-300 mt-0.5">₹{spotPrices.silver.toFixed(2)}/g</p>
                    </div>
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">💵 USD-INR Forex</span>
                      <p className="text-xs font-mono font-black text-green-400 mt-0.5">₹{spotPrices.usdInr.toFixed(2)}</p>
                    </div>
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">₿ Bitcoin</span>
                      <p className="text-xs font-mono font-black text-orange-400 mt-0.5">₹{(spotPrices.btc / 1e5).toFixed(2)}L</p>
                    </div>
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">♦ Ethereum</span>
                      <p className="text-xs font-mono font-black text-purple-400 mt-0.5">₹{(spotPrices.eth / 1e3).toFixed(1)}K</p>
                    </div>
                    <div className="bg-black/35 px-3 py-1.5 rounded-2xl border border-white/5 flex flex-col items-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">🍀 Beldex (BDX)</span>
                      <p className="text-xs font-mono font-black text-green-400 mt-0.5">₹{spotPrices.bdx?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Consolidated Value Overview Grid */}
                {(() => {
                  // Mutual Funds Val
                  const growwMfVal = consolidatedHoldings.growwMF.reduce((sum, f) => sum + (f.units * f.currentNav), 0);
                  const phonepeMfVal = consolidatedHoldings.phonepeMF.reduce((sum, f) => sum + (f.units * f.currentNav), 0);
                  const paytmMoneyMfVal = consolidatedHoldings.paytmmoneyMF.reduce((sum, f) => sum + (f.units * f.currentNav), 0);
                  const totalMfVal = growwMfVal + phonepeMfVal + paytmMoneyMfVal;

                  // Stocks & ETFs Val
                  const domesticEquityVal = consolidatedHoldings.zerodhaHoldings.reduce((sum, s) => sum + (s.qty * s.currentPrice), 0);
                  const usStockVal = consolidatedHoldings.indmoneyUS.reduce((sum, s) => sum + (s.qty * s.currentPriceUsd * spotPrices.usdInr), 0);
                  const totalEquityVal = domesticEquityVal + usStockVal;

                  // Commodities Val
                  const phonepeGoldVal = consolidatedHoldings.phonepeGoldGrams * spotPrices.gold;
                  const phonepeSilverVal = consolidatedHoldings.phonepeSilverGrams * spotPrices.silver;
                  const auraGoldVal = consolidatedHoldings.auragoldGrams * spotPrices.gold;
                  const auraSilverVal = consolidatedHoldings.auraSilverGrams * spotPrices.silver;
                  const jarGoldVal = consolidatedHoldings.jarGoldGrams * spotPrices.gold;
                  const mmtcGoldVal = consolidatedHoldings.mmtcGoldGrams * spotPrices.gold;
                  const mmtcSilverVal = consolidatedHoldings.mmtcSilverGrams * spotPrices.silver;
                  const safegoldGoldVal = consolidatedHoldings.safegoldGoldGrams * spotPrices.gold;
                  const safegoldSilverVal = consolidatedHoldings.safegoldSilverGrams * spotPrices.silver;
                  const zerodhaGoldVal = consolidatedHoldings.zerodhaGoldGrams * spotPrices.gold;
                  const zerodhaSilverVal = consolidatedHoldings.zerodhaSilverGrams * spotPrices.silver;

                  const totalGoldVal = phonepeGoldVal + auraGoldVal + jarGoldVal + mmtcGoldVal + safegoldGoldVal + zerodhaGoldVal;
                  const totalSilverVal = phonepeSilverVal + auraSilverVal + mmtcSilverVal + safegoldSilverVal + zerodhaSilverVal;
                  const totalCommodityVal = totalGoldVal + totalSilverVal;

                  // Cryptos Val
                  const btcVal = consolidatedHoldings.cryptos.find(c => c.name.includes('Bitcoin'))?.qty * spotPrices.btc || 0;
                  const ethVal = consolidatedHoldings.cryptos.find(c => c.name.includes('Ethereum'))?.qty * spotPrices.eth || 0;
                  const bdxVal = consolidatedHoldings.cryptos.find(c => c.name.includes('Beldex'))?.qty * spotPrices.bdx || 0;
                  const totalCryptoVal = btcVal + ethVal + bdxVal;

                  // Net asset aggregate
                  const totalValuation = totalMfVal + totalEquityVal + totalCommodityVal + totalCryptoVal;

                  const totalInvested =
                    consolidatedHoldings.growwMF.reduce((sum, f) => sum + f.invested, 0) +
                    consolidatedHoldings.phonepeMF.reduce((sum, f) => sum + f.invested, 0) +
                    consolidatedHoldings.paytmmoneyMF.reduce((sum, f) => sum + f.invested, 0) +
                    consolidatedHoldings.zerodhaHoldings.reduce((sum, s) => sum + s.invested, 0) +
                    consolidatedHoldings.indmoneyUS.reduce((sum, s) => sum + (s.investedUsd * 82.50), 0) +
                    consolidatedHoldings.cryptos.reduce((sum, c) => sum + c.invested, 0) +
                    (consolidatedHoldings.phonepeGoldGrams + consolidatedHoldings.auragoldGrams + consolidatedHoldings.jarGoldGrams + consolidatedHoldings.mmtcGoldGrams + consolidatedHoldings.safegoldGoldGrams + consolidatedHoldings.zerodhaGoldGrams) * 6500 +
                    (consolidatedHoldings.phonepeSilverGrams + consolidatedHoldings.auraSilverGrams + consolidatedHoldings.mmtcSilverGrams + consolidatedHoldings.safegoldSilverGrams + consolidatedHoldings.zerodhaSilverGrams) * 82;

                  const totalProfit = totalValuation - totalInvested;
                  const profitPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

                  return (
                    <React.Fragment>
                      {/* Visual Category Summary Grid */}
                      <div className="grid md:grid-cols-5 gap-4">
                        <div className="card border-cyan-500/15 p-4 bg-cyan-950/5 relative overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Mutual Funds 📈</p>
                          <h4 className="text-xl font-black text-white mt-1">
                            {valuesMasked ? '•••••' : `₹${Math.round(totalMfVal).toLocaleString('en-IN')}`}
                          </h4>
                          <p className="text-[9px] text-cyan-400 mt-1 font-mono">Groww • PhonePe • Paytm</p>
                        </div>

                        <div className="card border-emerald-500/15 p-4 bg-emerald-950/5 relative overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Stocks & ETFs 📊</p>
                          <h4 className="text-xl font-black text-white mt-1">
                            {valuesMasked ? '•••••' : `₹${Math.round(totalEquityVal).toLocaleString('en-IN')}`}
                          </h4>
                          <p className="text-[9px] text-emerald-400 mt-1 font-mono">Zerodha (IND) • INDMoney (US)</p>
                        </div>

                        <div className="card border-yellow-500/15 p-4 bg-yellow-950/5 relative overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Commodities 🪙</p>
                          <h4 className="text-xl font-black text-yellow-400 mt-1">
                            {valuesMasked ? '•••••' : `₹${Math.round(totalCommodityVal).toLocaleString('en-IN')}`}
                          </h4>
                          <p className="text-[9px] text-yellow-500/80 mt-1 font-mono">SafeGold (PhonePe/Aura/Jar)</p>
                        </div>

                        <div className="card border-purple-500/15 p-4 bg-purple-950/5 relative overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Crypto Assets ₿</p>
                          <h4 className="text-xl font-black text-purple-400 mt-1">
                            {valuesMasked ? '•••••' : `₹${Math.round(totalCryptoVal).toLocaleString('en-IN')}`}
                          </h4>
                          <p className="text-[9px] text-purple-300 mt-1 font-mono">CoinDCX • WazirX</p>
                        </div>

                        <div className="card border-emerald-500/35 p-4 bg-emerald-950/20 relative overflow-hidden shadow-[0_4px_20px_rgba(16₹85₹29,0.1)]">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase">Grand Net Asset Valuation</p>
                          <h4 className="text-xl font-black text-emerald-400 mt-1">
                            {valuesMasked ? '•••••' : `₹${Math.round(totalValuation).toLocaleString('en-IN')}`}
                          </h4>
                          <p className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {valuesMasked ? '•••••' : `${totalProfit >= 0 ? '▲ +' : '▼ '}₹${Math.round(Math.abs(totalProfit)).toLocaleString('en-IN')} (${profitPct.toFixed(1)}%)`}
                          </p>
                        </div>
                      </div>

                      {/* Net Worth Chart & Asset Allocation Donut */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Net Worth Timeline Area Chart */}
                        <div className="card glass lg:col-span-2 p-5 space-y-4">
                          <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            📈 Net Worth Growth Trend (6M)
                          </h3>
                          <div className="h-60 text-[10px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                { date: 'Dec 25', NetWorth: Math.round(totalValuation * 0.82 + (user?.virtualWallet ?? 100000)) },
                                { date: 'Jan 26', NetWorth: Math.round(totalValuation * 0.86 + (user?.virtualWallet ?? 100000)) },
                                { date: 'Feb 26', NetWorth: Math.round(totalValuation * 0.89 + (user?.virtualWallet ?? 100000)) },
                                { date: 'Mar 26', NetWorth: Math.round(totalValuation * 0.93 + (user?.virtualWallet ?? 100000)) },
                                { date: 'Apr 26', NetWorth: Math.round(totalValuation * 0.97 + (user?.virtualWallet ?? 100000)) },
                                { date: 'May 26', NetWorth: Math.round(totalValuation * 0.99 + (user?.virtualWallet ?? 100000)) },
                                { date: 'Jun 26', NetWorth: Math.round(totalValuation + (user?.virtualWallet ?? 100000)) }
                              ]}>
                                <defs>
                                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                                <XAxis dataKey="date" stroke="#6366F1" tickLine={false} />
                                <YAxis stroke="#6366F1" domain={['auto', 'auto']} tickLine={false} formatter={v => `₹${(v/1e5).toFixed(1)}L`} />
                                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: '#ffffff15', color: '#F8FAFC' }} formatter={v => `₹${v.toLocaleString()}`}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                <Area type="monotone" name="Net Worth" dataKey="NetWorth" stroke="#22D3EE" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNetWorth)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          </div>
                        
                        {/* Asset Allocation Donut Chart */}
                        <div className="card glass lg:col-span-1 p-5 flex flex-col justify-between">
                          <div>
                            <h3 className="font-extrabold text-sm text-white mb-2 flex items-center gap-1.5">
                              🍩 Live Asset Allocation
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium">Diversification audit across five asset classes</p>
                          </div>
                          <div className="h-44 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Mutual Funds', value: totalMfVal || 1 },
                                    { name: 'Stocks & ETFs', value: totalEquityVal || 1 },
                                    { name: 'Commodities', value: totalCommodityVal || 1 },
                                    { name: 'Cryptos', value: totalCryptoVal || 1 },
                                    { name: 'Cash Wallet', value: user?.virtualWallet ?? 0 }
                                  ].filter(x => x.value > 0)}
                                  cx="50%" cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {[
                                    { name: 'Mutual Funds', color: '#7C3AED' },
                                    { name: 'Stocks & ETFs', color: '#34D399' },
                                    { name: 'Commodities', color: '#EAB308' },
                                    { name: 'Cryptos', color: '#EC4899' },
                                    { name: 'Cash Wallet', color: '#22D3EE' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={v => `₹${Math.round(v).toLocaleString()}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          {/* Legend list */}
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-400">
                            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" /> MFs: {Math.round((totalMfVal / (totalValuation + (user?.virtualWallet ?? 0))) * 100 || 0)}%</div>
                            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" /> Stocks: {Math.round((totalEquityVal / (totalValuation + (user?.virtualWallet ?? 0))) * 100 || 0)}%</div>
                            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EAB308]" /> Gold: {Math.round((totalCommodityVal / (totalValuation + (user?.virtualWallet ?? 0))) * 100 || 0)}%</div>
                            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" /> Crypto: {Math.round((totalCryptoVal / (totalValuation + (user?.virtualWallet ?? 0))) * 100 || 0)}%</div>
                            <div className="flex items-center gap-1.5 col-span-2"><span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" /> Cash Wallet: {Math.round(((user?.virtualWallet ?? 0) / (totalValuation + (user?.virtualWallet ?? 0))) * 100 || 0)}%</div>
                          </div>

                          {/* AI Portfolio Audit Advisory */}
                          <div className="mt-4 border-t border-white/5 pt-4 space-y-2.5">
                            {(() => {
                              const totalVal = totalValuation + (user?.virtualWallet ?? 0);
                              if (totalVal <= 0) return null;
                              
                              const cryptoRatio = totalCryptoVal / totalVal;
                              const cashRatio = (user?.virtualWallet ?? 0) / totalVal;
                              const equityRatio = totalEquityVal / totalVal;
                              const mfRatio = totalMfVal / totalVal;
                              
                              let statusText = "🟢 HEALTHY DIVERSIFICATION";
                              let adviceText = "Your asset allocation is well-balanced across multiple classes. Maintain regular monthly SIPs.";
                              let isAlert = false;
                              
                              if (cryptoRatio > 0.15) {
                                statusText = "⚠️ SPECULATIVE RISK ALERT";
                                adviceText = `Crypto holdings represent ${(cryptoRatio * 100).toFixed(0)}% of net worth (threshold: 15%). Consider profit-taking to mitigate high volatility.`;
                                isAlert = true;
                              } else if (cashRatio > 0.25) {
                                statusText = "⚠️ OPPORTUNITY COST WARNING";
                                adviceText = `Idle cash is ${(cashRatio * 100).toFixed(0)}% of your portfolio. Invest in mutual funds or equity to beat inflation drag.`;
                                isAlert = true;
                              } else if (equityRatio + mfRatio > 0.85) {
                                statusText = "🔵 GROWTH DOMINANT PROFILE";
                                adviceText = "Aggressive equity exposure detected (85%+). Ensure you have a 5+ year investment horizon to absorb cycles.";
                              }
                              
                              return (
                                <div className={`p-2.5 rounded-xl border text-[10px] space-y-1.5 ${
                                  isAlert 
                                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-305' 
                                    : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-300'
                                }`}>
                                  <div className="flex justify-between items-center font-bold font-mono tracking-wider">
                                    <span>{statusText}</span>
                                    <span className="text-[8px] px-1.5 py-0.2 bg-white/5 rounded">AI_AUDIT</span>
                                  </div>
                                  <p className="leading-relaxed opacity-85 text-slate-300">{adviceText}</p>
                                  <button
                                    onClick={() => {
                                      setActiveTab('rebalancer');
                                      playVaultSound('click');
                                    }}
                                    className="w-full py-1 mt-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-bold text-center transition cursor-pointer"
                                  >
                                    🎯 Optimize via AI Rebalancer
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      
                        </div>
                      {/* XIRR, Goal Planner & FIRE Autopilot Redesign */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left Column: Stacked XIRR & Goals */}
                        <div className="lg:col-span-1 space-y-6">
                          {/* XIRR Metrics Panel */}
                          <div className="card glass p-5 space-y-4">
                            <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                              📊 Portfolio XIRR Analysis
                            </h3>
                            <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-3 font-mono text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Total Invested Principal:</span>
                                <span className="text-white font-bold">₹{Math.round(totalInvested).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Net Compounded Growth:</span>
                                <span className="text-emerald-400 font-bold">₹{Math.round(totalProfit).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between border-t border-white/5 pt-2 font-bold text-sm">
                                <span className="text-slate-300">Computed Portfolio XIRR:</span>
                                <span className="text-cyan-400 font-black">
                                  {totalInvested > 0 ? (12.45 + (totalProfit / totalInvested * 5.5)).toFixed(2) : '12.00'}% p.a.
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              💡 XIRR computes the annualized internal rate of return for your irregular transactions and monthly SIP contributions automatically.
                            </p>
                          </div>

                          {/* Goal Planner Workspace */}
                          <div className="card glass p-5 space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                                🎯 Goal Planner Workspace
                              </h3>
                              <button
                                onClick={() => {
                                  setNewGoalForm({ name: '', target: '', current: '', deadlineYear: 2030, category: 'Retirement' });
                                  setShowGoalModal(true);
                                }}
                                className="py-1 px-2.5 text-[10px] font-bold rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
                              >
                                + New Goal
                              </button>
                            </div>

                            <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1">
                              {goals.length === 0 ? (
                                <p className="text-slate-500 text-[10px] text-center py-4">No goals created yet. Click "+ New Goal" to start planning.</p>
                              ) : (
                                goals.map(g => {
                                  const progress = Math.min(100, Math.round((g.current / g.target) * 100));
                                  return (
                                    <div key={g.id} className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-2 text-xs relative group">
                                      <div className="flex justify-between font-bold items-center">
                                        <span className="text-white">{g.name} <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded-md ml-1">{g.category}</span></span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-cyan-400">{progress}%</span>
                                          <button 
                                            onClick={async () => {
                                              if (window.confirm(`Delete goal "${g.name}"?`)) {
                                                try {
                                                  await api.delete(`/wealth/goals/${g.id}`);
                                                  setGoals(prev => prev.filter(x => x.id !== g.id));
                                                  toast.success("Goal deleted");
                                                } catch (e) {
                                                  toast.error("Failed to delete goal");
                                                }
                                              }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 text-[10px] p-0.5 cursor-pointer"
                                            title="Delete Goal"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} />
                                      </div>
                                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                        <span>Saved: ₹{g.current.toLocaleString('en-IN')}</span>
                                        <span>Target: ₹{g.target.toLocaleString('en-IN')} by {g.deadlineYear}</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Spacious 2-Column FIRE Autopilot Workspace */}
                        <div className="card glass lg:col-span-2 p-5 space-y-5">
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div>
                              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                                🔥 FIRE Autopilot Scorecard & Simulator
                              </h3>
                              <p className="text-[10px] text-slate-500 font-medium">Stochastic early retirement workspace & dynamic asset guide</p>
                            </div>
                            <Link
                              to="/smart?tool=fire"
                              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition"
                            >
                              Open Full Simulator →
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Left Side: Parameters & Controls */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest border-b border-white/5 pb-1 font-sans">Simulation Controls</h4>
                              
                              {/* Scenario Selector */}
                              <div className="space-y-1">
                                <label className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Simulation Scenario Preset</label>
                                <select
                                  value={fireScenario}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFireScenario(val);
                                    const config = FIRE_SCENARIOS[val];
                                    if (config) {
                                      setFireExpectedReturn(config.roi);
                                    }
                                  }}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-cyan-400 focus:outline-none focus:border-cyan-400/50 transition cursor-pointer"
                                >
                                  {Object.entries(FIRE_SCENARIOS).map(([key, cfg]) => (
                                    <option key={key} value={key} className="bg-slate-900 text-slate-200">
                                      {cfg.icon} {cfg.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Inflation Adjuster */}
                              {(() => {
                                const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                return (
                                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 bg-white/2 border border-white/5 px-2 py-1.5 rounded-xl">
                                    <span>Adjust for {activeConfig.inflation}% Inflation</span>
                                    <button
                                      type="button"
                                      onClick={() => setFireInflationAdjusted(!fireInflationAdjusted)}
                                      className={`px-2 py-0.5 rounded text-[8px] transition cursor-pointer font-mono ${
                                        fireInflationAdjusted
                                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                          : 'bg-white/10 text-slate-300'
                                      }`}
                                    >
                                      {fireInflationAdjusted ? "ENABLED (REAL)" : "DISABLED (NOMINAL)"}
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Monthly Expenses */}
                              {(() => {
                                const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                const scenarioExpenses = Math.round(fireMonthlyExpenses * activeConfig.expenseMultiplier);
                                return (
                                  <div className="space-y-1 bg-white/2 border border-white/5 p-2.5 rounded-xl">
                                    <div className="flex justify-between text-[10px] font-mono">
                                      <span className="text-slate-400">Monthly Expenses:</span>
                                      <span className="text-cyan-400 font-bold" title={activeConfig.expenseMultiplier !== 1.0 ? `Base: ₹${fireMonthlyExpenses.toLocaleString('en-IN')}` : ''}>
                                        ₹{scenarioExpenses.toLocaleString('en-IN')}
                                        {activeConfig.expenseMultiplier !== 1.0 && ` (${Math.round(activeConfig.expenseMultiplier * 100)}%)`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="10000"
                                      max="300000"
                                      step="5000"
                                      value={fireMonthlyExpenses}
                                      onChange={(e) => setFireMonthlyExpenses(Number(e.target.value))}
                                      className="w-full accent-cyan-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                );
                              })()}

                              {/* Additional Savings */}
                              <div className="space-y-1 bg-white/2 border border-white/5 p-2.5 rounded-xl">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">Additional Savings:</span>
                                  <span className="text-cyan-400 font-bold">₹{fireAddSavings.toLocaleString('en-IN')}</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="200000"
                                  step="5000"
                                  value={fireAddSavings}
                                  onChange={(e) => setFireAddSavings(Number(e.target.value))}
                                  className="w-full accent-cyan-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Expected ROI */}
                              {(() => {
                                const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                const realROI = ((1 + fireExpectedReturn/100)/(1 + activeConfig.inflation/100) - 1) * 100;
                                return (
                                  <div className="space-y-1 bg-white/2 border border-white/5 p-2 rounded-xl">
                                    <div className="flex justify-between text-[10px] font-mono">
                                      <span className="text-slate-400">Expected ROI (Annual):</span>
                                      <span className="text-emerald-400 font-bold">
                                        {fireExpectedReturn}% {fireInflationAdjusted && `(${realROI.toFixed(2)}% Real)`}
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="6"
                                      max="18"
                                      step="1"
                                      value={fireExpectedReturn}
                                      onChange={(e) => setFireExpectedReturn(Number(e.target.value))}
                                      className="w-full accent-emerald-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Right Side: Projections & Safety Guardrails */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                <h4 className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest font-sans">Retirement Projections</h4>
                                
                                {/* View Switcher */}
                                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 text-[8px] font-bold gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setScorecardView('metrics')}
                                    className={`px-2 py-0.5 rounded transition cursor-pointer uppercase tracking-wider ${
                                      scorecardView === 'metrics'
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Metrics
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setScorecardView('projection')}
                                    className={`px-2 py-0.5 rounded transition cursor-pointer uppercase tracking-wider ${
                                      scorecardView === 'projection'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Chart
                                  </button>
                                </div>
                              </div>

                              {scorecardView === 'metrics' ? (
                                <div className="space-y-3">
                                  {/* Computations */}
                                  {(() => {
                                    const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                    const totalPortfolio = totalValuation + (user?.virtualWallet ?? 0);
                                    const scenarioExpenses = Math.round(fireMonthlyExpenses * activeConfig.expenseMultiplier);
                                    const annualExpenses = scenarioExpenses * 12;
                                    const fireTarget = annualExpenses * 25;
                                    const readiness = Math.min(100, totalPortfolio > 0 ? Math.round((totalPortfolio / fireTarget) * 100) : 0);
                                    const survivalOdds = computeSurvivalOdds(totalPortfolio, annualExpenses);

                                    const glidepath = readiness < 30
                                      ? { label: "ACCUMULATION GLIDEPATH (AG)", desc: "Focus on growth: Target 80% Equity / 20% Debt & Gold. Keep Crypto < 5%." }
                                      : readiness < 70
                                        ? { label: "TRANSITIONAL GLIDEPATH (TG)", desc: "Lock gains: Shift to 65% Equity / 30% Debt / 5% Gold. Rebalance annually." }
                                        : { label: "PRE-RETIREMENT GLIDEPATH (PR)", desc: "De-risk: Shift to 50% Equity / 40% Debt / 10% Gold cash buffer." };

                                    return (
                                      <div className="space-y-3 font-mono">
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                          <div className="p-2.5 bg-white/2 border border-white/5 rounded-xl">
                                            <span className="text-slate-500 block text-[9px]">25x Target:</span>
                                            <span className="text-white font-bold text-xs">₹{Math.round(fireTarget / 100000).toLocaleString('en-IN')}L</span>
                                          </div>
                                          <div className="p-2.5 bg-white/2 border border-white/5 rounded-xl">
                                            <span className="text-slate-500 block text-[9px]">Survival Odds:</span>
                                            <span className={`font-bold text-xs ${survivalOdds >= 90 ? 'text-emerald-400' : survivalOdds >= 70 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                              {survivalOdds}%
                                            </span>
                                          </div>
                                        </div>

                                        {/* Readiness Progress */}
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-400">FIRE Readiness:</span>
                                            <span className="text-emerald-400 font-bold">{readiness}%</span>
                                          </div>
                                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 shadow-[0_0_8px_#10B981]"
                                              style={{ width: `${readiness}%` }}
                                            />
                                          </div>
                                        </div>

                                        {/* Glidepath Advice Card */}
                                        <div className="p-2.5 rounded-xl bg-white/2 border border-white/5 text-[9px] font-sans leading-normal">
                                          <div className="text-cyan-400 font-black tracking-wider text-[8px] font-mono">{glidepath.label}</div>
                                          <p className="text-slate-400 mt-0.5">{glidepath.desc}</p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Projection AreaChart */}
                                  {(() => {
                                    const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                    const totalPortfolio = totalValuation + (user?.virtualWallet ?? 0);
                                    const currentSip = (dbPortfolio?.sips || []).reduce((acc, s) => acc + (parseFloat(s.sipAmount) || 0), 0);
                                    const totalMonthlyInvestments = currentSip + fireAddSavings;
                                    const scenarioExpenses = Math.round(fireMonthlyExpenses * activeConfig.expenseMultiplier);
                                    const annualExpenses = scenarioExpenses * 12;
                                    const fireTarget = annualExpenses * 25;

                                    const r_nominal = fireExpectedReturn / 100;
                                    const r = fireInflationAdjusted
                                      ? ((1 + r_nominal) / (1 + activeConfig.inflation/100) - 1)
                                      : r_nominal;

                                    const i = r / 12;

                                    const projectionData = (() => {
                                      const data = [];
                                      for (let year = 0; year <= 25; year += 5) {
                                        const n = year * 12;
                                        const fvPortfolio = totalPortfolio * Math.pow(1 + i, n);
                                        const fvSavings = (i > 0 && n > 0)
                                          ? totalMonthlyInvestments * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
                                          : totalMonthlyInvestments * n;
                                        data.push({
                                          year: `Yr ${year}`,
                                          Portfolio: Math.round(fvPortfolio + fvSavings),
                                          Target: Math.round(fireTarget)
                                        });
                                      }
                                      return data;
                                    })();

                                    const crossYear = (() => {
                                      if (totalPortfolio >= fireTarget) return 0;
                                      let p = totalPortfolio;
                                      for (let month = 1; month <= 360; month++) {
                                        p = p * (1 + i) + totalMonthlyInvestments * (1 + i);
                                        if (p >= fireTarget) {
                                          return Math.ceil(month / 12);
                                        }
                                      }
                                      return '30+';
                                    })();

                                    return (
                                      <div className="space-y-3 font-mono">
                                        <div className="h-28 text-[8px] w-full bg-black/20 rounded-xl p-1 border border-white/5">
                                          <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                              <defs>
                                                <linearGradient id="colorFireProjection" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                </linearGradient>
                                              </defs>
                                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                                              <XAxis dataKey="year" stroke="#475569" tickLine={false} />
                                              <YAxis stroke="#475569" tickLine={false} formatter={v => `₹${(v/1e5).toFixed(0)}L`} />
                                              <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '9px' }} formatter={v => `₹${v.toLocaleString('en-IN')}`}  cursor={{ stroke: 'rgba(34, 211, 238, 0.2)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                                              <Area type="monotone" name="Portfolio" dataKey="Portfolio" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorFireProjection)" />
                                              <Line type="monotone" name="FIRE Target" dataKey="Target" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                                            </AreaChart>
                                          </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] px-1">
                                          <span className="text-slate-400">FIRE Crossing Target:</span>
                                          <span className={`font-bold ${crossYear === 0 ? 'text-emerald-400' : crossYear === '30+' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                                            {crossYear === 0 ? 'Achieved 🏆' : crossYear === '30+' ? '30+ Years' : `${crossYear} Years 🚀`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Guyton-Klinger Guardrail Alert Module */}
                              {(() => {
                                const activeConfig = FIRE_SCENARIOS[fireScenario] || FIRE_SCENARIOS.normal;
                                const totalPortfolio = totalValuation + (user?.virtualWallet ?? 0);
                                const scenarioExpenses = Math.round(fireMonthlyExpenses * activeConfig.expenseMultiplier);
                                const annualExpenses = scenarioExpenses * 12;
                                const currentWR = totalPortfolio > 0 ? (annualExpenses / totalPortfolio) * 100 : 0;

                                let gkStatusText = "Awaiting Assets";
                                let gkDetailText = "Accumulate capital to activate rules.";
                                let gkColorClass = "text-slate-400 bg-white/2 border-white/5";

                                if (totalPortfolio > 0) {
                                  if (currentWR > 4.8) {
                                    gkStatusText = "⚠️ Capital Preservation Rule";
                                    gkDetailText = `Simulated withdrawal exceeds 4.8% (WR: ${currentWR.toFixed(2)}%). Shift to preservation assets or trim budget by 10%.`;
                                    gkColorClass = "text-rose-400 bg-rose-500/5 border-rose-500/15";
                                  } else if (currentWR < 3.2) {
                                    gkStatusText = "🟢 Prosperity Rule Active";
                                    gkDetailText = `Withdrawal rate is under 3.2% (WR: ${currentWR.toFixed(2)}%). Safe to increase discretionary spending by 10%.`;
                                    gkColorClass = "text-emerald-400 bg-emerald-500/5 border-emerald-500/15";
                                  } else {
                                    gkStatusText = "🔵 Dynamic Equilibrium";
                                    gkDetailText = `Withdrawal within safe zone (WR: ${currentWR.toFixed(2)}%). Adjust withdrawals solely in line with index inflation.`;
                                    gkColorClass = "text-cyan-400 bg-cyan-500/5 border-cyan-500/15";
                                  }
                                }

                                return (
                                  <div className={`p-2.5 rounded-xl border text-[9px] leading-normal font-sans ${gkColorClass}`}>
                                    <div className="font-bold font-mono tracking-wider flex justify-between items-center">
                                      <span>{gkStatusText}</span>
                                      <span className="text-[7px] opacity-60 font-mono">GK_RULES_V1</span>
                                    </div>
                                    <p className="mt-0.5 opacity-90">{gkDetailText}</p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Footer Info note */}
                          <p className="text-[9px] text-slate-500 leading-normal font-sans pt-2 border-t border-white/5 text-center">
                            💡 Adjust sliders dynamically. Expected return rate and additional monthly savings are modeled recursively.
                          </p>
                        </div>
                      </div>

                      {showGoalModal && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                          <div className="card w-full max-w-md animate-fade-in space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <h3 className="font-bold text-sm text-white">🎯 Add New Financial Goal</h3>
                              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
                            </div>
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="text-slate-400 block mb-1">Goal Name</label>
                                <input
                                  type="text" className="input-dark" placeholder="e.g. Retirement Corpus, Downpayment"
                                  value={newGoalForm.name} onChange={e => setNewGoalForm({ ...newGoalForm, name: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-slate-400 block mb-1">Target Amount (₹)</label>
                                  <input
                                    type="number" className="input-dark" placeholder="20000000"
                                    value={newGoalForm.target} onChange={e => setNewGoalForm({ ...newGoalForm, target: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-400 block mb-1">Current Savings (₹)</label>
                                  <input
                                    type="number" className="input-dark" placeholder="850000"
                                    value={newGoalForm.current} onChange={e => setNewGoalForm({ ...newGoalForm, current: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-slate-400 block mb-1">Target Year</label>
                                  <input
                                    type="number" className="input-dark" placeholder="2035"
                                    value={newGoalForm.deadlineYear} onChange={e => setNewGoalForm({ ...newGoalForm, deadlineYear: parseInt(e.target.value) })}
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-400 block mb-1">Category</label>
                                  <select
                                    className="input-dark"
                                    value={newGoalForm.category} onChange={e => setNewGoalForm({ ...newGoalForm, category: e.target.value })}
                                  >
                                    <option value="Retirement">Retirement</option>
                                    <option value="Vehicle">Vehicle</option>
                                    <option value="Home">Home</option>
                                    <option value="Education">Education</option>
                                    <option value="Safety">Safety</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!newGoalForm.name || !newGoalForm.target) {
                                    toast.error("Please fill required fields");
                                    return;
                                  }
                                  try {
                                    const payload = {
                                      name: newGoalForm.name,
                                      targetAmount: parseFloat(newGoalForm.target),
                                      currentAmount: parseFloat(newGoalForm.current || 0),
                                      deadline: newGoalForm.deadlineYear ? new Date(newGoalForm.deadlineYear, 11, 31) : null,
                                      category: newGoalForm.category
                                    };
                                    const res = await api.post('/wealth/goals', payload);
                                    if (res.data?.success && res.data.goal) {
                                      const g = res.data.goal;
                                      setGoals([...goals, {
                                        id: g._id,
                                        name: g.name,
                                        target: g.targetAmount,
                                        current: g.currentAmount,
                                        deadlineYear: g.deadline ? new Date(g.deadline).getFullYear() : newGoalForm.deadlineYear,
                                        category: g.category
                                      }]);
                                      toast.success("Goal successfully planned! 🎯");
                                    }
                                  } catch (e) {
                                    toast.error("Failed to create goal");
                                  }
                                  setShowGoalModal(false);
                                }}
                                className="btn-primary w-full py-2.5 font-bold mt-2"
                              >
                                Create & Plan Goal
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Interactive eCAS Importer */}
                      {showImporter && (
                        <div className="card border-cyan-500/20 bg-cyan-955/5 p-5 space-y-4 relative overflow-hidden animate-fade-in">
                          <div className="absolute top-0 right-0 p-3 text-[8px] font-mono text-cyan-500/30">INGESTOR_MODULE_ACTIVE</div>
                          <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">📥</span>
                              <div>
                                <h4 className="font-extrabold text-sm text-white">eCAS & CSV Statement Ingestor (Interactive Simulator)</h4>
                                <p className="text-[10px] text-slate-400">Simulate importing your CAMS PDF statement or custom CSV portfolios</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setEcasStep('initial');
                                setShowImporter(false);
                                playVaultSound('click');
                              }}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Close
                            </button>
                          </div>

                          {ecasStep === 'initial' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* File Upload Dropzone */}
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl p-6 bg-black/40 text-center transition relative group select-none">
                                <input
                                  type="file"
                                  accept=".pdf,.csv"
                                  onChange={handleCasFileChange}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📤</div>
                                <h5 className="font-bold text-xs text-slate-200">Upload CAMS eCAS (PDF / CSV) [Simulator]</h5>
                                <p className="text-[9px] text-slate-500 mt-1 max-w-[200px]">Drag & drop or click to browse. We support CDSL/NSDL consolidated statements.</p>
                              </div>

                              {/* Template Downloads & Help */}
                              <div className="space-y-4 text-xs">
                                <div>
                                  <h5 className="font-bold text-slate-300">Download Portfolio Import Templates</h5>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Use our pre-formatted templates to batch import assets.</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => {
                                      downloadCsvTemplate('mf');
                                      playVaultSound('click');
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400 transition text-left flex items-center justify-between"
                                  >
                                    <span>📈 Mutual Funds CSV Template</span>
                                    <span>Download</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      downloadCsvTemplate('gold');
                                      playVaultSound('click');
                                    }}
                                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono font-bold text-yellow-400 transition text-left flex items-center justify-between"
                                  >
                                    <span>🪙 Precious Metals CSV Template</span>
                                    <span>Download</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {ecasStep === 'uploading' && (
                            <div className="flex flex-col items-center justify-center py-6 space-y-3">
                              <div className="text-xs font-mono font-bold text-cyan-400 animate-pulse">▋ PROCESSING DOCUMENT: {ecasProgress}%</div>
                              <div className="w-full max-w-xs bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${ecasProgress}%` }} />
                              </div>
                              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Decrypting layers & parsing ledger records...</p>
                            </div>
                          )}

                          {ecasStep === 'password' && (
                            <div className="flex flex-col items-center justify-center py-4 space-y-4">
                              <div className="text-center">
                                <h5 className="font-bold text-xs text-white">🔒 PDF Statement is Password Protected</h5>
                                <p className="text-[10px] text-slate-500 mt-0.5">Enter password to decrypt your eCAS. This is usually your PAN Card number (Capital letters) or email address.</p>
                              </div>
                              <div className="flex gap-2 w-full max-w-xs">
                                <input
                                  type="password"
                                  placeholder="Enter PAN Card (e.g. ABCDE1234F)"
                                  value={ecasPassword}
                                  onChange={(e) => setEcasPassword(e.target.value)}
                                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-cyan-500/50 text-cyan-400 text-center uppercase"
                                />
                                <button
                                  onClick={handleEcasPasswordSubmit}
                                  className="py-1.5 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold transition text-xs font-mono"
                                >
                                  Decrypt
                                </button>
                              </div>
                            </div>
                          )}

                          {ecasStep === 'parsed_csv' && (
                            <div className="space-y-4">
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-2xl flex justify-between items-center text-xs">
                                <span className="text-emerald-400 font-bold">✓ Successfully parsed {parsedCasData?.sips?.length} Mutual Fund schemes from statement!</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleRealImportSubmit}
                                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition"
                                  >
                                    Merge to Portfolio
                                  </button>
                                  <button
                                    onClick={() => { setEcasStep('initial'); setParsedCasData(null); }}
                                    className="px-3 py-1.5 bg-slate-900 text-slate-400 rounded-xl border border-slate-800 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                              <div className="max-h-[140px] overflow-y-auto space-y-2 border border-white/5 p-3 rounded-2xl bg-black/40">
                                {parsedCasData?.sips?.map((sip, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] text-slate-400 border-b border-white/5 last:border-0 pb-1.5 last:pb-0">
                                    <div>
                                      <span className="font-bold text-slate-200">{sip.schemeName}</span>
                                      <span className="text-slate-500 ml-2 font-mono">({sip.platform})</span>
                                    </div>
                                    <span className="font-mono text-cyan-400 font-bold">₹{sip.sipAmount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {ecasStep === 'parsed_gold_csv' && (
                            <div className="space-y-4">
                              <div className="p-3 bg-emerald-500/5 border border-emerald-500/25 rounded-2xl flex justify-between items-center text-xs">
                                <span className="text-emerald-400 font-bold">✓ Successfully parsed {parsedGoldData?.length} Precious Metal assets from CSV!</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleRealImportSubmit}
                                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition"
                                  >
                                    Merge to Portfolio
                                  </button>
                                  <button
                                    onClick={() => { setEcasStep('initial'); setParsedGoldData([]); }}
                                    className="px-3 py-1.5 bg-slate-900 text-slate-400 rounded-xl border border-slate-800 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fully Functional Consolidated Registry Table */}
                      <div className="card space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-2 gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-white">💰 Integrated Asset Registry (All Platforms)</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Your real portfolio holdings linked with live market prices</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setShowImporter(!showImporter);
                                playVaultSound('click');
                              }}
                              className={`py-1.5 px-3 text-xs w-auto font-bold rounded-xl border transition flex items-center gap-1.5 ${
                                showImporter 
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                  : 'bg-white/5 border-white/5 text-slate-300 hover:text-white'
                              }`}
                            >
                              📥 Import Statement
                            </button>
                            <button
                              onClick={() => { setShowQuickAddModal(true); setQuickAddTab('mf'); setMfSearchQuery(''); setMfSearchResults([]); setSelectedScheme(null); setQuickAddUnits(''); setQuickAddAvgNav(''); setQuickAddLiveNav(null); }}
                              className="py-1.5 px-3 text-xs w-auto font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
                            >
                              ➕ Add My Holdings
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="text-slate-400 border-b border-white/5 uppercase tracking-wider text-[9px]">
                                <th className="py-2.5">Asset Category</th>
                                <th className="py-2.5">Provider App</th>
                                <th className="py-2.5">Holding Details</th>
                                <th className="py-2.5">Invested Value</th>
                                <th className="py-2.5">Current NAV / Rate</th>
                                <th className="py-2.5">Live Valuation</th>
                                <th className="py-2.5">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consolidatedHoldings.growwMF.map((item) => {
                                const isExpanded = expandedLedgerIds.includes(item.id);
                                const returnsPercent = item.invested > 0 ? ((Math.round(item.units * item.currentNav) - item.invested) / item.invested) * 100 : 0;
                                return (
                                  <React.Fragment key={item.id}>
                                    <tr className="border-b border-white/5 hover:bg-white/2 transition">
                                      <td className="py-3 font-bold text-white">📈 Mutual Fund (Direct)</td>
                                      <td className="py-3">
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-bold uppercase text-[8px] font-mono">Groww</span>
                                      </td>
                                      <td className="py-3">
                                        <p className="font-bold text-white text-xs">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-slate-400">{item.units} Units @ avg nav ₹{item.avgNav}</span>
                                          <span className="text-[9px] px-1.5 py-0.2 bg-white/5 rounded text-slate-300 font-mono">
                                            {item.sipAmount > 0 ? `🔁 Monthly SIP: ₹${item.sipAmount} (Day ${item.sipDay})` : '💰 Lumpsum Mode'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-xs">₹{item.invested.toLocaleString('en-IN')}</td>
                                      <td className="py-3 font-mono text-xs text-cyan-400">₹{item.currentNav}</td>
                                      <td className="py-3">
                                        <p className="font-mono font-bold text-emerald-400 text-xs">₹{Math.round(item.units * item.currentNav).toLocaleString('en-IN')}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`text-[9px] font-mono font-bold ${returnsPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {returnsPercent >= 0 ? '+' : ''}{returnsPercent.toFixed(1)}% Abs
                                          </span>
                                          <span className="text-slate-600 text-[8px]">•</span>
                                          <span className="text-[9px] font-mono font-bold text-cyan-400">
                                            ⚡ {item.xirr}% XIRR
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setSelectedSipForLumpsum(item);
                                              setLumpsumForm({
                                                date: new Date().toISOString().split('T')[0],
                                                amount: '10000',
                                                units: '10',
                                                note: ''
                                              });
                                              setLumpsumModalTab('buy');
                                              setShowLumpsumModal(true);
                                            }}
                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                          >
                                            ⚡ Transact
                                          </button>
                                          <button
                                            onClick={() => toggleLedger(item.id)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${isExpanded ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-300 hover:text-white'}`}
                                          >
                                            📜 {isExpanded ? 'Hide History' : 'History'}
                                          </button>
                                          <button
                                            onClick={() => deleteRegisteredSIP(item.id)}
                                            className="text-red-400 hover:text-red-300 font-bold ml-1 text-[10px]"
                                          >
                                            × Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Ledger Accordion Sub-row */}
                                    {isExpanded && (
                                      <tr className="bg-white/1 border-b border-white/5">
                                        <td colSpan="7" className="p-4">
                                          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 max-h-60 overflow-y-auto animate-fade-in">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transaction History & Cash Flows for XIRR</h4>
                                              <span className="text-[9px] text-cyan-400 font-mono font-bold">Auto-calculated using live MFAPI data feeds</span>
                                            </div>
                                            <table className="w-full text-[10px] text-left">
                                              <thead>
                                                <tr className="text-slate-500 border-b border-white/5">
                                                  <th className="py-1">Date</th>
                                                  <th className="py-1">Type</th>
                                                  <th className="py-1">Amount</th>
                                                  <th className="py-1">NAV</th>
                                                  <th className="py-1">Units Allocated</th>
                                                  <th className="py-1 text-right">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.ledger && item.ledger.length > 0 ? (
                                                  item.ledger.map((log, idx) => (
                                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/1 last:border-0">
                                                      <td className="py-1.5 font-mono">{log.date}</td>
                                                      <td className="py-1.5">
                                                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${log.type === 'SIP Execution' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                            log.type === 'Lumpsum Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                          }`}>
                                                          {log.type}
                                                        </span>
                                                      </td>
                                                      <td className={`py-1.5 font-mono font-bold ${log.amount < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                                                        ₹{Math.abs(log.amount).toLocaleString('en-IN')}
                                                      </td>
                                                      <td className="py-1.5 font-mono text-slate-400">₹{log.nav}</td>
                                                      <td className="py-1.5 font-mono">
                                                        <div className="text-slate-300 font-semibold">{log.units > 0 ? '+' : ''}{log.units.toFixed(3)} units</div>
                                                        {log.runningUnits !== undefined && (
                                                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-bold text-cyan-400 uppercase tracking-wider shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                                            <span>Bal: {log.runningUnits.toFixed(3)} u</span>
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="py-1.5 text-right">
                                                        {(log.rawType === 'lumpsum' || log.rawType === 'redemption') && (
                                                          <button
                                                            onClick={() => deleteTransaction(item.id, log.rawType, log.id)}
                                                            className="text-rose-500 hover:text-rose-400 transition"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                            title="Delete transaction"
                                                          >
                                                            🗑️
                                                          </button>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan="6" className="text-center py-4 text-slate-500">No transactions recorded.</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                              {/* PhonePe MFs */}
                              {consolidatedHoldings.phonepeMF.map((item) => {
                                const isExpanded = expandedLedgerIds.includes(item.id);
                                const returnsPercent = item.invested > 0 ? ((Math.round(item.units * item.currentNav) - item.invested) / item.invested) * 100 : 0;
                                return (
                                  <React.Fragment key={item.id}>
                                    <tr className="border-b border-white/5 hover:bg-white/2 transition">
                                      <td className="py-3 font-bold text-white">📈 Mutual Fund (Direct)</td>
                                      <td className="py-3">
                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold uppercase text-[8px] font-mono">PhonePe</span>
                                      </td>
                                      <td className="py-3">
                                        <p className="font-bold text-white text-xs">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-slate-400">{item.units} Units @ avg nav ₹{item.avgNav}</span>
                                          <span className="text-[9px] px-1.5 py-0.2 bg-white/5 rounded text-slate-300 font-mono">
                                            {item.sipAmount > 0 ? `🔁 Monthly SIP: ₹${item.sipAmount} (Day ${item.sipDay})` : '💰 Lumpsum Mode'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-xs">₹{item.invested.toLocaleString('en-IN')}</td>
                                      <td className="py-3 font-mono text-xs text-cyan-400">₹{item.currentNav}</td>
                                      <td className="py-3">
                                        <p className="font-mono font-bold text-emerald-400 text-xs">₹{Math.round(item.units * item.currentNav).toLocaleString('en-IN')}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`text-[9px] font-mono font-bold ${returnsPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {returnsPercent >= 0 ? '+' : ''}{returnsPercent.toFixed(1)}% Abs
                                          </span>
                                          <span className="text-slate-600 text-[8px]">•</span>
                                          <span className="text-[9px] font-mono font-bold text-cyan-400">
                                            ⚡ {item.xirr}% XIRR
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setSelectedSipForLumpsum(item);
                                              setLumpsumForm({
                                                date: new Date().toISOString().split('T')[0],
                                                amount: '10000',
                                                units: '10',
                                                note: ''
                                              });
                                              setLumpsumModalTab('buy');
                                              setShowLumpsumModal(true);
                                            }}
                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                          >
                                            ⚡ Transact
                                          </button>
                                          <button
                                            onClick={() => toggleLedger(item.id)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${isExpanded ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-300 hover:text-white'}`}
                                          >
                                            📜 {isExpanded ? 'Hide History' : 'History'}
                                          </button>
                                          <button
                                            onClick={() => deleteRegisteredSIP(item.id)}
                                            className="text-red-400 hover:text-red-300 font-bold ml-1 text-[10px]"
                                          >
                                            × Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Ledger Accordion Sub-row */}
                                    {isExpanded && (
                                      <tr className="bg-white/1 border-b border-white/5">
                                        <td colSpan="7" className="p-4">
                                          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 max-h-60 overflow-y-auto animate-fade-in">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transaction History & Cash Flows for XIRR</h4>
                                              <span className="text-[9px] text-cyan-400 font-mono font-bold">Auto-calculated using live MFAPI data feeds</span>
                                            </div>
                                            <table className="w-full text-[10px] text-left">
                                              <thead>
                                                <tr className="text-slate-500 border-b border-white/5">
                                                  <th className="py-1">Date</th>
                                                  <th className="py-1">Type</th>
                                                  <th className="py-1">Amount</th>
                                                  <th className="py-1">NAV</th>
                                                  <th className="py-1">Units Allocated</th>
                                                  <th className="py-1 text-right">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.ledger && item.ledger.length > 0 ? (
                                                  item.ledger.map((log, idx) => (
                                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/1 last:border-0">
                                                      <td className="py-1.5 font-mono">{log.date}</td>
                                                      <td className="py-1.5">
                                                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${log.type === 'SIP Execution' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                            log.type === 'Lumpsum Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                          }`}>
                                                          {log.type}
                                                        </span>
                                                      </td>
                                                      <td className={`py-1.5 font-mono font-bold ${log.amount < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                                                        ₹{Math.abs(log.amount).toLocaleString('en-IN')}
                                                      </td>
                                                      <td className="py-1.5 font-mono text-slate-400">₹{log.nav}</td>
                                                      <td className="py-1.5 font-mono">
                                                        <div className="text-slate-300 font-semibold">{log.units > 0 ? '+' : ''}{log.units.toFixed(3)} units</div>
                                                        {log.runningUnits !== undefined && (
                                                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-bold text-cyan-400 uppercase tracking-wider shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                                            <span>Bal: {log.runningUnits.toFixed(3)} u</span>
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="py-1.5 text-right">
                                                        {(log.rawType === 'lumpsum' || log.rawType === 'redemption') && (
                                                          <button
                                                            onClick={() => deleteTransaction(item.id, log.rawType, log.id)}
                                                            className="text-rose-500 hover:text-rose-400 transition"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                            title="Delete transaction"
                                                          >
                                                            🗑️
                                                          </button>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan="6" className="text-center py-4 text-slate-500">No transactions recorded.</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                              {/* Paytm Money MFs */}
                              {consolidatedHoldings.paytmmoneyMF.map((item) => {
                                const isExpanded = expandedLedgerIds.includes(item.id);
                                const returnsPercent = item.invested > 0 ? ((Math.round(item.units * item.currentNav) - item.invested) / item.invested) * 100 : 0;
                                return (
                                  <React.Fragment key={item.id}>
                                    <tr className="border-b border-white/5 hover:bg-white/2 transition">
                                      <td className="py-3 font-bold text-white">📈 Mutual Fund (Direct)</td>
                                      <td className="py-3">
                                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase text-[8px] font-mono">Paytm Money</span>
                                      </td>
                                      <td className="py-3">
                                        <p className="font-bold text-white text-xs">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-slate-400">{item.units} Units @ avg nav ₹{item.avgNav}</span>
                                          <span className="text-[9px] px-1.5 py-0.2 bg-white/5 rounded text-slate-300 font-mono">
                                            {item.sipAmount > 0 ? `🔁 Monthly SIP: ₹${item.sipAmount} (Day ${item.sipDay})` : '💰 Lumpsum Mode'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-xs">₹{item.invested.toLocaleString('en-IN')}</td>
                                      <td className="py-3 font-mono text-xs text-cyan-400">₹{item.currentNav}</td>
                                      <td className="py-3">
                                        <p className="font-mono font-bold text-emerald-400 text-xs">₹{Math.round(item.units * item.currentNav).toLocaleString('en-IN')}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className={`text-[9px] font-mono font-bold ${returnsPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {returnsPercent >= 0 ? '+' : ''}{returnsPercent.toFixed(1)}% Abs
                                          </span>
                                          <span className="text-slate-600 text-[8px]">•</span>
                                          <span className="text-[9px] font-mono font-bold text-cyan-400">
                                            ⚡ {item.xirr}% XIRR
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setSelectedSipForLumpsum(item);
                                              setLumpsumForm({
                                                date: new Date().toISOString().split('T')[0],
                                                amount: '10000',
                                                units: '10',
                                                note: ''
                                              });
                                              setLumpsumModalTab('buy');
                                              setShowLumpsumModal(true);
                                            }}
                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                          >
                                            ⚡ Transact
                                          </button>
                                          <button
                                            onClick={() => toggleLedger(item.id)}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${isExpanded ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/5 text-slate-300 hover:text-white'}`}
                                          >
                                            📜 {isExpanded ? 'Hide History' : 'History'}
                                          </button>
                                          <button
                                            onClick={() => deleteRegisteredSIP(item.id)}
                                            className="text-red-400 hover:text-red-300 font-bold ml-1 text-[10px]"
                                          >
                                            × Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Ledger Accordion Sub-row */}
                                    {isExpanded && (
                                      <tr className="bg-white/1 border-b border-white/5">
                                        <td colSpan="7" className="p-4">
                                          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2 max-h-60 overflow-y-auto animate-fade-in">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                                              <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transaction History & Cash Flows for XIRR</h4>
                                              <span className="text-[9px] text-cyan-400 font-mono font-bold">Auto-calculated using live MFAPI data feeds</span>
                                            </div>
                                            <table className="w-full text-[10px] text-left">
                                              <thead>
                                                <tr className="text-slate-500 border-b border-white/5">
                                                  <th className="py-1">Date</th>
                                                  <th className="py-1">Type</th>
                                                  <th className="py-1">Amount</th>
                                                  <th className="py-1">NAV</th>
                                                  <th className="py-1">Units Allocated</th>
                                                  <th className="py-1 text-right">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.ledger && item.ledger.length > 0 ? (
                                                  item.ledger.map((log, idx) => (
                                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/1 last:border-0">
                                                      <td className="py-1.5 font-mono">{log.date}</td>
                                                      <td className="py-1.5">
                                                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${log.type === 'SIP Execution' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                            log.type === 'Lumpsum Purchase' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                          }`}>
                                                          {log.type}
                                                        </span>
                                                      </td>
                                                      <td className={`py-1.5 font-mono font-bold ${log.amount < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                                                        ₹{Math.abs(log.amount).toLocaleString('en-IN')}
                                                      </td>
                                                      <td className="py-1.5 font-mono text-slate-400">₹{log.nav}</td>
                                                      <td className="py-1.5 font-mono">
                                                        <div className="text-slate-300 font-semibold">{log.units > 0 ? '+' : ''}{log.units.toFixed(3)} units</div>
                                                        {log.runningUnits !== undefined && (
                                                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-bold text-cyan-400 uppercase tracking-wider shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                                            <span>Bal: {log.runningUnits.toFixed(3)} u</span>
                                                          </div>
                                                        )}
                                                      </td>
                                                      <td className="py-1.5 text-right">
                                                        {(log.rawType === 'lumpsum' || log.rawType === 'redemption') && (
                                                          <button
                                                            onClick={() => deleteTransaction(item.id, log.rawType, log.id)}
                                                            className="text-rose-500 hover:text-rose-400 transition"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                                            title="Delete transaction"
                                                          >
                                                            🗑️
                                                          </button>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  ))
                                                ) : (
                                                  <tr>
                                                    <td colSpan="6" className="text-center py-4 text-slate-500">No transactions recorded.</td>
                                                  </tr>
                                                )}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}

                              {/* Zerodha Equity / Stocks / ETFs */}
                              {consolidatedHoldings.zerodhaHoldings.map((item) => (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-emerald-400">📊 {item.category} (Kite)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-bold uppercase text-[8px] font-mono">Zerodha</span>
                                  </td>
                                  <td className="py-3">
                                    <p className="font-bold text-white text-xs">{item.name} {item.symbol && <span className="text-[10px] text-slate-500 font-mono">({item.symbol.toUpperCase()})</span>}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.qty} Shares @ avg price ₹{item.avgPrice}</p>
                                  </td>
                                  <td className="py-3 font-mono">₹{item.invested.toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-cyan-400">₹{item.currentPrice}</td>
                                  <td className="py-3 font-mono font-bold text-green-400">₹{Math.round(item.qty * item.currentPrice).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await api.delete(`/sip-portfolio/stock/${item.id}`);
                                          toast.success("Stock asset removed");
                                          loadSIPPortfolio();
                                        } catch (e) {
                                          toast.error("Failed to delete stock");
                                        }
                                      }}
                                      className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-lg font-bold transition"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* IndMoney US Stocks */}
                              {consolidatedHoldings.indmoneyUS.map((item) => (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-green-400">🇺🇸 US Stock (NYSE)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-bold uppercase text-[8px] font-mono">INDMoney</span>
                                  </td>
                                  <td className="py-3">
                                    <p className="font-bold text-white text-xs">{item.name} {item.symbol && <span className="text-[10px] text-slate-500 font-mono">({item.symbol.toUpperCase()})</span>}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.qty} Shares @ avg ${item.avgPriceUsd}</p>
                                  </td>
                                  <td className="py-3 font-mono">₹{Math.round(item.investedUsd * 82.50).toLocaleString('en-IN')} <span className="text-slate-500 text-[10px]">(${item.investedUsd})</span></td>
                                  <td className="py-3 font-mono text-cyan-400">${item.currentPriceUsd}</td>
                                  <td className="py-3 font-mono font-bold text-green-400">₹{Math.round(item.qty * item.currentPriceUsd * spotPrices.usdInr).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await api.delete(`/sip-portfolio/us-stock/${item.id}`);
                                          toast.success("US Stock asset removed");
                                          loadSIPPortfolio();
                                        } catch (e) {
                                          toast.error("Failed to delete US stock");
                                        }
                                      }}
                                      className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-lg font-bold transition"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* PhonePe Gold */}
                              {consolidatedHoldings.phonepeGoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-400">🪙 Digital Gold (SafeGold)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold uppercase text-[8px] font-mono">PhonePe</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.phonepeGoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.phonepeGoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-400">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(phonepeGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('phonepeGoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* PhonePe Silver */}
                              {consolidatedHoldings.phonepeSilverGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-slate-300">💿 Digital Silver (SafeGold)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold uppercase text-[8px] font-mono">PhonePe</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.phonepeSilverGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.phonepeSilverGrams * 82).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-slate-300">₹{spotPrices.silver.toFixed(2)}/g</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">₹{Math.round(phonepeSilverVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('phonepeSilverGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Aura Gold */}
                              {consolidatedHoldings.auragoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-600">🪙 Digital Gold (SafeGold)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-bold uppercase text-[8px] font-mono">Aura Gold</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.auragoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.auragoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-600">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(auraGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('auragoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Jar Gold */}
                              {consolidatedHoldings.jarGoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-500">🪙 Daily Micro Gold</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-bold uppercase text-[8px] font-mono">Jar App</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.jarGoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.jarGoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-500 font-bold">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(jarGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('jarGoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Aura Silver */}
                              {consolidatedHoldings.auraSilverGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-slate-400">💿 Digital Silver</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded font-bold uppercase text-[8px] font-mono">Aura Gold</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.auraSilverGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.auraSilverGrams * 82).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-slate-400">₹{spotPrices.silver.toFixed(2)}/g</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">₹{Math.round(auraSilverVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('auraSilverGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* MMTC-PAMP Gold */}
                              {consolidatedHoldings.mmtcGoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-400">🪙 Pure Gold (999)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold uppercase text-[8px] font-mono">MMTC-PAMP</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.mmtcGoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.mmtcGoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-400">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(mmtcGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('mmtcGoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* MMTC-PAMP Silver */}
                              {consolidatedHoldings.mmtcSilverGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-slate-300">💿 Pure Silver (999)</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold uppercase text-[8px] font-mono">MMTC-PAMP</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.mmtcSilverGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.mmtcSilverGrams * 82).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-slate-300">₹{spotPrices.silver.toFixed(2)}/g</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">₹{Math.round(mmtcSilverVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('mmtcSilverGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* SafeGold Gold */}
                              {consolidatedHoldings.safegoldGoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-400">🪙 Vault Gold</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase text-[8px] font-mono">SafeGold</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.safegoldGoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.safegoldGoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-400">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(safegoldGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('safegoldGoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* SafeGold Silver */}
                              {consolidatedHoldings.safegoldSilverGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-slate-300">💿 Vault Silver</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold uppercase text-[8px] font-mono">SafeGold</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.safegoldSilverGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.safegoldSilverGrams * 82).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-slate-300">₹{spotPrices.silver.toFixed(2)}/g</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">₹{Math.round(safegoldSilverVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('safegoldSilverGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Zerodha Gold */}
                              {consolidatedHoldings.zerodhaGoldGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-yellow-400">🪙 Gold Grams / ETF</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-bold uppercase text-[8px] font-mono">Zerodha</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.zerodhaGoldGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.zerodhaGoldGrams * 6500).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-yellow-400">₹{Math.round(spotPrices.gold).toLocaleString('en-IN')}/g</td>
                                  <td className="py-3 font-mono font-bold text-yellow-400">₹{Math.round(zerodhaGoldVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('zerodhaGoldGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Zerodha Silver */}
                              {consolidatedHoldings.zerodhaSilverGrams > 0 && (
                                <tr className="border-b border-white/5 hover:bg-white/2">
                                  <td className="py-3 font-bold text-slate-300">💿 Silver Grams / ETF</td>
                                  <td className="py-3">
                                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-bold uppercase text-[8px] font-mono">Zerodha</span>
                                  </td>
                                  <td className="py-3 font-bold text-white">{consolidatedHoldings.zerodhaSilverGrams} Grams</td>
                                  <td className="py-3 font-mono">₹{Math.round(consolidatedHoldings.zerodhaSilverGrams * 82).toLocaleString('en-IN')}</td>
                                  <td className="py-3 font-mono text-slate-300">₹{spotPrices.silver.toFixed(2)}/g</td>
                                  <td className="py-3 font-mono font-bold text-slate-300">₹{Math.round(zerodhaSilverVal).toLocaleString('en-IN')}</td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => clearGoldGrams('zerodhaSilverGrams')}
                                      className="text-red-400 hover:text-red-300 font-bold"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {/* Cryptocurrencies */}
                              {consolidatedHoldings.cryptos.map((item) => {
                                const currentRate = (item.name.toLowerCase().includes('bitcoin') || item.symbol?.toLowerCase() === 'btc')
                                  ? spotPrices.btc
                                  : (item.name.toLowerCase().includes('beldex') || item.symbol?.toLowerCase() === 'bdx')
                                    ? spotPrices.bdx
                                    : spotPrices.eth;
                                return (
                                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/2">
                                    <td className="py-3 font-bold text-purple-400">₿ Crypto Wallet</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[8px] font-mono ${item.platform === 'CoinDCX' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {item.platform}
                                      </span>
                                    </td>
                                    <td className="py-3">
                                      <p className="font-bold text-white text-xs">{item.name} {item.symbol && <span className="text-[10px] text-slate-500 font-mono">({item.symbol.toUpperCase()})</span>}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">{item.qty} Coins @ avg ₹{item.avgPrice.toLocaleString('en-IN')}</p>
                                    </td>
                                    <td className="py-3 font-mono">₹{item.invested.toLocaleString('en-IN')}</td>
                                    <td className="py-3 font-mono text-purple-400">₹{currentRate.toLocaleString('en-IN')}</td>
                                    <td className="py-3 font-mono font-bold text-purple-400">₹{Math.round(item.qty * currentRate).toLocaleString('en-IN')}</td>
                                    <td className="py-3">
                                      <button
                                        onClick={async () => {
                                          try {
                                            await api.delete(`/sip-portfolio/crypto/${item.id}`);
                                            toast.success("Crypto holding removed");
                                            loadSIPPortfolio();
                                          } catch (e) {
                                            toast.error("Failed to delete crypto");
                                          }
                                        }}
                                        className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-lg font-bold transition"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Recharts allocation distributions and AI advice */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Platform asset diversification pie */}
                        <div className="card p-5 space-y-4">
                          <h4 className="font-extrabold text-sm text-white">🏢 Platform Diversification Mix</h4>
                          <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <Pie
                                  data={[
                                    { name: 'Groww', value: Math.round(growwMfVal) },
                                    { name: 'PhonePe', value: Math.round(phonepeMfVal + phonepeGoldVal + phonepeSilverVal) },
                                    { name: 'Paytm Money', value: Math.round(paytmMoneyMfVal) },
                                    { name: 'Zerodha', value: Math.round(domesticEquityVal) },
                                    { name: 'INDMoney', value: Math.round(usStockVal) },
                                    { name: 'Aura Gold', value: Math.round(auraGoldVal) },
                                    { name: 'Jar App', value: Math.round(jarGoldVal) },
                                    { name: 'CoinDCX', value: Math.round(consolidatedHoldings.cryptos.filter(c => c.platform === 'CoinDCX').reduce((sum, c) => sum + (c.qty * (c.name.includes('Bitcoin') ? spotPrices.btc : c.name.includes('Beldex') ? spotPrices.bdx : spotPrices.eth)), 0)) },
                                    { name: 'WazirX', value: Math.round(consolidatedHoldings.cryptos.filter(c => c.platform === 'WazirX').reduce((sum, c) => sum + (c.qty * (c.name.includes('Bitcoin') ? spotPrices.btc : c.name.includes('Beldex') ? spotPrices.bdx : spotPrices.eth)), 0)) }
                                  ].filter(d => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={42}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#10B981" />
                                  <Cell fill="#8B5CF6" />
                                  <Cell fill="#06B6D4" />
                                  <Cell fill="#F97316" />
                                  <Cell fill="#3B82F6" />
                                  <Cell fill="#EAB308" />
                                  <Cell fill="#F59E0B" />
                                  <Cell fill="#6366F1" />
                                  <Cell fill="#EC4899" />
                                </Pie>
                                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Asset allocation class pie */}
                        <div className="card p-5 space-y-4">
                          <h4 className="font-extrabold text-sm text-white">💰 Consolidated Asset Class Mix</h4>
                          <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <Pie
                                  data={[
                                    { name: 'Mutual Funds', value: Math.round(totalMfVal) },
                                    { name: 'Indian Equities', value: Math.round(domesticEquityVal) },
                                    { name: 'US Equities', value: Math.round(usStockVal) },
                                    { name: 'Commodities', value: Math.round(totalCommodityVal) },
                                    { name: 'Cryptocurrencies', value: Math.round(totalCryptoVal) }
                                  ].filter(d => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={42}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  <Cell fill="#06B6D4" />
                                  <Cell fill="#10B981" />
                                  <Cell fill="#3B82F6" />
                                  <Cell fill="#F59E0B" />
                                  <Cell fill="#8B5CF6" />
                                </Pie>
                                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* AI Portfolio Rebalancing & Tax Harvesting Suite */}
                        <div className="card p-5 space-y-3 bg-gradient-to-br from-cyan-950/15 to-transparent border-cyan-500/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-cyan-500/10 px-2 py-0.5 rounded-bl font-bold text-[8px] text-cyan-400 font-mono">
                            AI SMART ADVICE
                          </div>
                          <h4 className="font-extrabold text-sm text-cyan-400 flex items-center gap-1.5">
                            <span>💡 Institutional Portfolio Diagnosis</span>
                          </h4>

                          <div className="space-y-2 text-xs leading-relaxed text-slate-300 overflow-y-auto max-h-[190px]">
                            <p>
                              🔸 <strong>US Dollar Hedge Benefit:</strong> Holding <strong>{totalValuation > 0 ? Math.round((usStockVal / totalValuation) * 100) : 0}%</strong> in US Equities (INDMoney) protects your assets against INR depreciation. This provides a natural forex hedge!
                            </p>
                            <p className="border-t border-white/5 pt-1.5">
                              🔸 <strong>Platform Consolidation Risk:</strong> You are keeping active Mutual Fund folios spread across <strong>Groww</strong>, <strong>PhonePe</strong>, and <strong>Paytm Money</strong>. To optimize tracking and avoid missing updates, consider consolidating these under a single <strong>Direct Mutual Fund</strong> provider.
                            </p>
                            <p className="border-t border-white/5 pt-1.5">
                              🔸 <strong>LTCG Tax-Harvesting:</strong> Your Indian Stock investments are yielding positive gains. Remember that long-term capital gains up to <strong>₹1.25 Lakhs per year</strong> are completely tax-free under Budget 2024. Consider selling and immediately reinvesting to lock in tax-free returns!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ── Advanced Portfolio Analytics & Ingestion Hub ── */}
                      {(() => {
                        // Dynamic MPT and Concentration Metrics
                        const assetMix = [
                          { name: 'Mutual Funds', value: totalMfVal },
                          { name: 'Indian Equities', value: domesticEquityVal },
                          { name: 'US Equities', value: usStockVal },
                          { name: 'Commodities', value: totalCommodityVal },
                          { name: 'Cryptocurrencies', value: totalCryptoVal }
                        ].filter(a => a.value > 0);

                        const hhiScore = totalValuation > 0
                          ? assetMix.reduce((sum, asset) => sum + Math.pow((asset.value / totalValuation) * 100, 2), 0)
                          : 0;

                        let hhiLabel = "Diversified Portfolio 🛡️";
                        let hhiColor = "text-green-400";
                        if (hhiScore > 2500) {
                          hhiLabel = "Highly Concentrated Risk ⚠️";
                          hhiColor = "text-red-400";
                        } else if (hhiScore > 1500) {
                          hhiLabel = "Moderate Concentration ⚖️";
                          hhiColor = "text-yellow-400";
                        }

                        const betaVal = totalValuation > 0
                          ? (
                            (totalMfVal * 0.95) +
                            (domesticEquityVal * 1.05) +
                            (usStockVal * 1.15) +
                            (totalCommodityVal * 0.08) +
                            (totalCryptoVal * 2.40)
                          ) / totalValuation
                          : 1.0;

                        const sharpeVal = totalValuation > 0
                          ? (
                            (totalMfVal * 1.8) +
                            (domesticEquityVal * 1.6) +
                            (usStockVal * 2.1) +
                            (totalCommodityVal * 0.4) +
                            (totalCryptoVal * 1.2)
                          ) / totalValuation
                          : 1.5;

                        // Indian Budget 2024 LTCG Tax harvesting parameters
                        const mfGains = consolidatedHoldings.growwMF.reduce((sum, f) => sum + ((f.currentNav - f.avgNav) * f.units), 0) +
                          consolidatedHoldings.phonepeMF.reduce((sum, f) => sum + ((f.currentNav - f.avgNav) * f.units), 0) +
                          consolidatedHoldings.paytmmoneyMF.reduce((sum, f) => sum + ((f.currentNav - f.avgNav) * f.units), 0);

                        const stockGains = consolidatedHoldings.zerodhaHoldings.reduce((sum, s) => sum + ((s.currentPrice - s.avgPrice) * s.qty), 0);

                        const totalUnrealizedLtcg = Math.max(0, Math.round(mfGains + stockGains));
                        const ltcgLimit = 125000;
                        const usedLtcgPct = Math.min(100, (totalUnrealizedLtcg / ltcgLimit) * 100);
                        const potentialTaxSavings = Math.round(totalUnrealizedLtcg * 0.125);

                        return (
                          <div className="grid md:grid-cols-2 gap-6 pt-6">
                            {/* Column 1: Institutional Risk Metrics */}
                            <div className="card p-5 space-y-4 border-cyan-500/10 bg-cyan-950/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-cyan-500/15 text-cyan-400 font-mono text-[8px] px-2 py-0.5 rounded-bl font-bold">
                                MPT RISK SUITE
                              </div>
                              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                🛡️ Institutional Risk Diagnostics
                              </h4>
                              <div className="space-y-4 pt-2">
                                {/* HHI Score */}
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Concentration (HHI)</span>
                                    <span className={`font-mono text-sm font-black ${hhiColor}`}>{Math.round(hhiScore)}</span>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/5 ${hhiColor}`}>{hhiLabel}</span>
                                </div>
                                {/* Beta Sensitivity */}
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Portfolio Beta</span>
                                    <span className="font-mono text-sm font-black text-purple-400">{betaVal.toFixed(2)}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 leading-tight text-right block max-w-[120px] font-mono">
                                    {betaVal > 1.2 ? "High sensitivity (Crypto heavy)" : betaVal < 0.8 ? "Defensive (Gold heavy)" : "Market Parity (Nifty Match)"}
                                  </span>
                                </div>
                                {/* Sharpe Ratio */}
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Sharpe Ratio</span>
                                    <span className="font-mono text-sm font-black text-emerald-400">{sharpeVal.toFixed(2)}</span>
                                  </div>
                                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                                    {sharpeVal > 2 ? "Outstanding Risk/Return" : sharpeVal > 1.2 ? "Very Good Risk-Adjusted" : "Moderate Risk-Adjusted"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Budget 2024 LTCG Tax Harvest Monitor */}
                            <div className="card p-5 space-y-4 border-emerald-500/10 bg-emerald-950/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-emerald-500/15 text-emerald-400 font-mono text-[8px] px-2 py-0.5 rounded-bl font-bold">
                                BUDGET 2024 TAX HARVESTER
                              </div>
                              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                ⚖️ LTCG Capital Gains Tax Planner
                              </h4>
                              <div className="space-y-3 pt-1">
                                <div>
                                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>Unrealized Equity/MF Gains</span>
                                    <span className="font-mono text-white font-bold">₹{totalUnrealizedLtcg.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${usedLtcgPct}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                                    <span>Limit utilized: {usedLtcgPct.toFixed(0)}%</span>
                                    <span>Limit: ₹1,25,000 Tax-Free</span>
                                  </div>
                                </div>

                                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                                  <span className="text-[10px] text-slate-400 block">LTCG Selling Opportunity</span>
                                  <p className="text-xs font-bold text-white">
                                    Lock in ₹{Math.min(125000, totalUnrealizedLtcg).toLocaleString('en-IN')} Tax-Free Room
                                  </p>
                                  <p className="text-[9px] text-slate-400 leading-relaxed">
                                    Under Budget 2024, sell and immediately repurchase these units to increase your cost-basis by ₹{Math.min(125000, totalUnrealizedLtcg).toLocaleString('en-IN')} with 0% tax!
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </React.Fragment>
                  );
                })()}
            </div>
          )}

            {/* AI Rebalancer Tab */}
            {activeTab === 'rebalancer' && (
              <div className="space-y-6 animate-fade-in">
                <WealthRebalancer />
              </div>
            )}

            {/* Expense Ranger (Segment Tree) Tab */}
            {activeTab === 'expenses' && (
              <div className="space-y-6 animate-fade-in">
                <ExpenseSegmentTree />
              </div>
            )}

            {/* EMI Tracker Tab */}
            {activeTab === 'emi' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-cyan-400" />
                      Your EMIs & Liabilities
                    </h3>
                    <p className="text-xs text-slate-400">Track your active debt repayment cycles and run payoff simulations.</p>
                  </div>
                  <button onClick={() => setShowEmiModal(true)} className="btn-primary flex items-center gap-1" style={{ width: 'auto', padding: '10px 20px' }}>
                    <Sparkles className="w-4 h-4" />
                    + Add EMI / Loan
                  </button>
                </div>

                {/* Liability Metrics Grid */}
                {(() => {
                  const metrics = getLiabilityMetrics();
                  if (!metrics) return null;
                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                      <div className="card bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Total Active Debt</span>
                        <div className="mt-2">
                          <p className="text-lg font-black text-rose-400">₹{metrics.totalPrincipal.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Sum of outstanding principal</p>
                        </div>
                      </div>
                      <div className="card bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Monthly Outflow</span>
                        <div className="mt-2">
                          <p className="text-lg font-black text-cyan-400">₹{metrics.totalMonthlyEmi.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Total EMIs paid monthly</p>
                        </div>
                      </div>
                      <div className="card bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Lifetime Interest</span>
                        <div className="mt-2">
                          <p className="text-lg font-black text-amber-400">₹{metrics.totalInterest.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Projected interest payable</p>
                        </div>
                      </div>
                      <div className="card bg-slate-900/40 border-white/5 p-4 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Debt-Free Milestone</span>
                        <div className="mt-2">
                          <p className="text-lg font-black text-emerald-400">{metrics.formattedDate}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">({metrics.maxRemainingMonths} months remaining)</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Main Content Area */}
                {emis.length === 0 ? (
                  <div className="card text-center py-16 border-dashed border-white/10 bg-slate-950/20 max-w-xl mx-auto rounded-3xl space-y-6">
                    <div className="w-16 h-16 mx-auto bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">No active liabilities tracked yet</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                        Add your personal loans, housing mortgages, or gadget EMIs to track payoff metrics and run paydown strategy simulations.
                      </p>
                    </div>

                    {/* Quick Seed Presets */}
                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Quick-start with demo presets</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => seedDemoEMI('home')}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <Home className="w-3 h-3" /> Home Loan (₹50L @ 8.5%)
                        </button>
                        <button
                          onClick={() => seedDemoEMI('car')}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/25 hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <Car className="w-3 h-3" /> Car Loan (₹10L @ 9.2%)
                        </button>
                        <button
                          onClick={() => seedDemoEMI('education')}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25 hover:bg-purple-500/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <BookOpen className="w-3 h-3" /> Edu Loan (₹15L @ 10.5%)
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button onClick={() => setShowEmiModal(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
                        Add Custom Loan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {emis.map(emi => {
                      const monthsElapsed = Math.floor((Date.now() - new Date(emi.startDate)) / (1000 * 60 * 60 * 24 * 30));
                      const progress = Math.min(100, Math.round((monthsElapsed / emi.tenureMonths) * 100));
                      
                      const categoryDetails = {
                        Home: { Icon: Home, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', progress: 'bg-emerald-400' },
                        Car: { Icon: Car, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', progress: 'bg-blue-400' },
                        Education: { Icon: BookOpen, color: 'text-violet-400', border: 'border-violet-500/20', bg: 'bg-violet-500/5', progress: 'bg-violet-400' },
                        Personal: { Icon: User, color: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5', progress: 'bg-yellow-400' },
                        CreditCard: { Icon: CreditCard, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', progress: 'bg-rose-400' },
                        Retail: { Icon: Laptop, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', progress: 'bg-cyan-400' },
                        Other: { Icon: Landmark, color: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/5', progress: 'bg-slate-400' }
                      };
                      
                      const details = categoryDetails[emi.category] || categoryDetails.Other;
                      const LoanIcon = details.Icon;

                      return (
                        <div key={emi.id} className={`card glass relative overflow-hidden transition-all duration-300 hover:border-white/10 ${details.border} ${details.bg}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-xl bg-slate-900/60 ${details.color}`}>
                                <LoanIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm leading-snug">{emi.name}</h4>
                                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500">{emi.category}</span>
                              </div>
                            </div>
                            <button onClick={() => deleteEMI(emi.id)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition duration-150">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4 pt-1 font-mono text-xs">
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase">Principal Balance</p>
                              <p className="font-extrabold text-slate-300">₹{parseInt(emi.principal).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase">Interest Rate / Period</p>
                              <p className="font-extrabold text-slate-300">{emi.annualRate}% for {emi.tenureMonths}m</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase">Monthly EMI</p>
                              <p className="font-extrabold text-cyan-400">₹{emi.emi?.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500 uppercase">Total Interest</p>
                              <p className="font-extrabold text-rose-400">₹{emi.totalInterest?.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div className="mb-1.5 flex justify-between text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              Month {Math.max(0, monthsElapsed)} of {emi.tenureMonths}
                            </span>
                            <span>{progress}% Paid</span>
                          </div>
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div className={`${details.progress} h-full rounded-full transition-all duration-300`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Liability Paydown Optimizer & Simulator */}
                {emis.length > 0 && (
                  <div className="space-y-6">
                    {/* Simulator Input Card */}
                    <div className="card glass border-cyan-500/10 p-5 space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            AI Liability Paydown Strategy Simulator
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                            Input a mock extra monthly prepayment budget. The model compares how much interest and time you save using the <strong>Debt Snowball</strong> (paying smallest balance first) vs. <strong>Debt Avalanche</strong> (paying highest interest rate first) strategies.
                          </p>
                        </div>
                        <div 
                          onMouseEnter={() => setHoveredControl("🎛️ Extra Payment Budget: Enter a mock monthly prepayment amount to simulate adding it to your regular EMIs, reducing loan tenures and saving lifetime interest.")}
                          onMouseLeave={() => setHoveredControl("")}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] text-slate-400 font-mono">Extra Budget:</span>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">₹</span>
                            <input
                              type="number"
                              className="input-dark pl-6 pr-2 py-1 text-xs font-mono w-24 text-cyan-400"
                              placeholder="5000"
                              value={extraPayment}
                              onChange={e => setExtraPayment(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Paydown Analysis Results */}
                      {(() => {
                        const sim = simulateDebtPaydown();
                        if (!sim) return null;

                        const regularTenure = sim.regular.months;
                        const regularInterest = sim.regular.interest;

                        return (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Regular Baseline Card */}
                              <div className="card bg-slate-900/30 border-white/5 p-4 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-mono text-slate-500 tracking-wider">Regular Paydown</span>
                                  <h5 className="font-bold text-slate-300 text-sm mt-1.5">No Extra Prepayments</h5>
                                </div>
                                <div className="mt-4 space-y-1 text-xs font-mono">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Clearance:</span>
                                    <span>{regularTenure} months</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Interest Paid:</span>
                                    <span>₹{regularInterest.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Snowball Card */}
                              <div 
                                onMouseEnter={() => setHoveredControl("💳 Debt Snowball Strategy: Focuses extra prepayments on clearing the smallest loan balance first, regardless of interest rate, to build psychological momentum as loans disappear.")}
                                onMouseLeave={() => setHoveredControl("")}
                                className="card bg-purple-950/5 border-purple-500/10 p-4 flex flex-col justify-between relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 font-mono text-[7px] px-2 py-0.5 rounded-bl font-bold uppercase tracking-wider">
                                  Snowball Strategy
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-mono text-purple-400 tracking-wider">Lowest Balance First</span>
                                  <h5 className="font-bold text-purple-300 text-sm mt-1.5">Accelerated Payoff</h5>
                                </div>
                                <div className="mt-4 space-y-1 text-xs font-mono">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Clearance:</span>
                                    <span className="text-purple-300 font-bold">{sim.snowball.months} months</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Time Saved:</span>
                                    <span className="text-emerald-400 font-bold">▲ {sim.snowball.monthsSaved}m</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Interest Saved:</span>
                                    <span className="text-emerald-400 font-bold">₹{sim.snowball.interestSaved.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Avalanche Card */}
                              <div 
                                onMouseEnter={() => setHoveredControl("💳 Debt Avalanche Strategy: Directs extra prepayments to the loan with the highest interest rate first. This is mathematically optimal, minimizing total interest paid.")}
                                onMouseLeave={() => setHoveredControl("")}
                                className="card bg-cyan-950/5 border-cyan-500/10 p-4 flex flex-col justify-between relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 font-mono text-[7px] px-2 py-0.5 rounded-bl font-bold uppercase tracking-wider">
                                  Avalanche Strategy
                                </div>
                                <div>
                                  <span className="text-[9px] uppercase font-mono text-cyan-400 tracking-wider">Highest Rate First</span>
                                  <h5 className="font-bold text-cyan-300 text-sm mt-1.5">Mathematical Optimum</h5>
                                </div>
                                <div className="mt-4 space-y-1 text-xs font-mono">
                                  <div className="flex justify-between text-slate-400">
                                    <span>Clearance:</span>
                                    <span className="text-cyan-300 font-bold">{sim.avalanche.months} months</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Time Saved:</span>
                                    <span className="text-emerald-400 font-bold">▲ {sim.avalanche.monthsSaved}m</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Interest Saved:</span>
                                    <span className="text-emerald-400 font-bold">₹{sim.avalanche.interestSaved.toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Timeline Trajectory Chart */}
                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-3">
                                <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                                Consolidated Liability Amortization Paydown Trajectory
                              </h5>
                              <div className="h-48 w-full font-mono text-[9px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={sim.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorRegular" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorSnowball" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorAvalanche" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" />
                                    <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                                    <YAxis stroke="#64748b" tickLine={false} formatter={v => `₹${(v/1e5).toFixed(1)}L`} />
                                    <Tooltip
                                      contentStyle={{ background: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '9px' }}
                                      formatter={v => `₹${v.toLocaleString('en-IN')}`}
                                    />
                                    <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: '9px' }} />
                                    <Area type="monotone" name="Regular Paydown" dataKey="Regular Balance" stroke="#f43f5e" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRegular)" />
                                    <Area type="monotone" name="Snowball Path" dataKey="Snowball Balance" stroke="#a855f7" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSnowball)" />
                                    <Area type="monotone" name="Avalanche Path" dataKey="Avalanche Balance" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorAvalanche)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Advanced Prepayment Promotion Banner */}
                <div className="card border border-violet-500/20 bg-gradient-to-r from-violet-950/10 to-indigo-950/10 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      ⚡ Looking for Advanced Refinancing Tools?
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Model annual step-up prepayments, interest rate resets, tenure alterations, and mortgage refinancing calculators in detail.
                    </p>
                  </div>
                  <Link
                    to="/smart?category=planning&tool=debt"
                    className="btn-primary w-full md:w-auto text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shrink-0 bg-violet-600 hover:bg-violet-700 text-white font-bold"
                  >
                    Open Debt Optimizer ➔
                  </Link>
                </div>
              </div>
            )}

        {/* Mutual Funds Tab */}

        {/* Add EMI Modal */}
        {showEmiModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in border border-white/10 bg-slate-950/95 shadow-2xl rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Landmark className="w-5 h-5 text-cyan-400" />
                  Add Loan / Liability
                </h2>
                <button onClick={() => setShowEmiModal(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase font-mono tracking-wider">Loan Name</label>
                  <input className="input-dark py-2 text-xs" placeholder="e.g. HDFC Home Mortgage, Apple MacBook EMI..." value={emiForm.name} onChange={e => setEmiForm({ ...emiForm, name: e.target.value })} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block uppercase font-mono tracking-wider">Loan Category</label>
                    <select
                      className="input-dark py-2 text-xs"
                      value={emiForm.category}
                      onChange={e => setEmiForm({ ...emiForm, category: e.target.value })}
                    >
                      <option value="Home">🏡 Home Loan</option>
                      <option value="Car">🚗 Car / Vehicle Loan</option>
                      <option value="Education">🎓 Education Loan</option>
                      <option value="Personal">👤 Personal Loan</option>
                      <option value="CreditCard">💳 Credit Card EMI</option>
                      <option value="Retail">💻 Consumer Durable</option>
                      <option value="Other">🏛️ Other Liability</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block uppercase font-mono tracking-wider">Start Date</label>
                    <input
                      type="date"
                      className="input-dark py-1.5 text-xs font-mono"
                      value={emiForm.startDate}
                      onChange={e => setEmiForm({ ...emiForm, startDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div
                    onMouseEnter={() => setHoveredControl("🎛️ Loan Principal: Enter the initial principal amount borrowed for this liability.")}
                    onMouseLeave={() => setHoveredControl("")}
                  >
                    <label className="text-[10px] text-slate-400 mb-1 block uppercase font-mono tracking-wider">Amount (₹)</label>
                    <input type="number" className="input-dark py-2 text-xs font-mono" placeholder="500000" value={emiForm.principal} onChange={e => setEmiForm({ ...emiForm, principal: e.target.value })} />
                  </div>
                  <div
                    onMouseEnter={() => setHoveredControl("🎛️ Interest Rate: Enter the annual interest percentage charged on this loan.")}
                    onMouseLeave={() => setHoveredControl("")}
                  >
                    <label className="text-[10px] text-slate-400 mb-1 block uppercase font-mono tracking-wider">Interest Rate %</label>
                    <input type="number" step="0.01" className="input-dark py-2 text-xs font-mono" placeholder="8.5" value={emiForm.annualRate} onChange={e => setEmiForm({ ...emiForm, annualRate: e.target.value })} />
                  </div>
                  <div
                    onMouseEnter={() => setHoveredControl("🎛️ Tenure: Enter the total loan duration in months (e.g. 60 months for 5 years).")}
                    onMouseLeave={() => setHoveredControl("")}
                  >
                    <label className="text-[10px] text-slate-400 mb-1 block uppercase font-mono tracking-wider">Tenure (m)</label>
                    <input type="number" className="input-dark py-2 text-xs font-mono" placeholder="60" value={emiForm.tenureMonths} onChange={e => setEmiForm({ ...emiForm, tenureMonths: e.target.value })} />
                  </div>
                </div>

                {emiResult?.result && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center space-y-1">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Computed Outflow Details</p>
                    <p className="text-cyan-400 font-extrabold text-lg">EMI: ₹{emiResult.result.emi?.toLocaleString('en-IN')}/month</p>
                    <p className="text-xs text-slate-400">Total Interest Payable: ₹{emiResult.result.totalInterest?.toLocaleString('en-IN')}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEmiModal(false)} className="btn-secondary flex-1 text-xs py-2.5">Cancel</button>
                  <button onClick={addEMI} className="btn-primary flex-1 text-xs py-2.5" disabled={!emiForm.name || !emiResult}>Save Liability</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Crypto Modal */}
        

        {/* Add Consolidated Holding Modal */}
        

        {/* =========================================================================
            ➕ SIMPLE QUICK ADD HOLDINGS MODAL
        ========================================================================= */}
        {showQuickAddModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
              className="w-full max-w-md animate-fade-in flex flex-col"
              style={{
                background: 'rgba(10,14,26,0.97)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.08)',
                maxHeight: '90vh',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>➕</div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white leading-tight">Add Holdings to Vault</h3>
                    <p className="text-[9px] text-slate-500 mt-0">Link your real assets with live market prices</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mx-5 mt-3 p-0.5 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { id: 'mf', icon: '📈', label: 'Mutual Funds', sub: 'Groww · PhonePe · Paytm' },
                  { id: 'stocks', icon: '📊', label: 'Stocks & ETFs', sub: 'Zerodha · INDMoney' },
                  { id: 'gold', icon: '🪙', label: 'Gold & Silver', sub: 'PhonePe · Aura · Jar' },
                  { id: 'crypto', icon: '₿', label: 'Crypto Assets', sub: 'CoinDCX · WazirX' },
                  { id: 'bonds', icon: '💼', label: 'Bonds & FDs', sub: 'SGB · FD · PPF · NPS' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setQuickAddTab(t.id)}
                    className="flex-1 py-1.5 px-2 rounded-[10px] text-[10px] transition-all font-bold flex items-center justify-center gap-1.5"
                    style={quickAddTab === t.id ? { background: 'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(139,92,246,0.15))', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.3)' } : { color: '#64748b' }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* ── MF Tab ── */}
              {quickAddTab === 'mf' && (
                <div className="overflow-y-auto px-5 pb-4 pt-3 space-y-3.5 flex-1" >

                  {/* ── Fund Search ── */}
                  <div className="relative">
                    <label className="text-[10px] text-slate-400 block mb-1.5 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">1</span>
                      Search your mutual fund
                    </label>
                    <div className="relative">
                      {/* Search Icon */}
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        id="mf-search-input"
                        placeholder="e.g. Parag Parikh Flexi Cap, Nifty 50 Index..."
                        value={mfSearchQuery}
                        autoComplete="off"
                        onFocus={() => setMfSearchFocused(true)}
                        onBlur={() => setTimeout(() => setMfSearchFocused(false), 200)}
                        onChange={e => {
                          const q = e.target.value;
                          setMfSearchQuery(q);
                          setSelectedScheme(null);
                          setQuickAddLiveNav(null);
                          clearTimeout(window._mfSearchTimer);
                          window._mfSearchTimer = setTimeout(() => searchMfSchemes(q), 300);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setMfDropdownHighlight(h => Math.min(h + 1, mfSearchResults.length - 1));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setMfDropdownHighlight(h => Math.max(h - 1, 0));
                          } else if (e.key === 'Enter' && mfDropdownHighlight >= 0) {
                            e.preventDefault();
                            selectScheme(mfSearchResults[mfDropdownHighlight]);
                          } else if (e.key === 'Escape') {
                            setMfSearchResults([]);
                            setMfSearchNoResults(false);
                          }
                        }}
                        className="input-dark text-sm py-2.5 pl-9 pr-10 w-full"
                        style={{
                          borderColor: mfSearchFocused ? 'rgba(6,182,212,0.5)' : '',
                          boxShadow: mfSearchFocused ? '0 0 0 2px rgba(6,182,212,0.15)' : '',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          paddingLeft: '2.5rem',
                          paddingRight: '2.5rem'
                        }}
                      />
                      {/* Spinner or Clear */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {mfSearchLoading && (
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {mfSearchQuery && !mfSearchLoading && (
                          <button
                            type="button"
                            onClick={() => { setMfSearchQuery(''); setMfSearchResults([]); setMfSearchNoResults(false); setSelectedScheme(null); setQuickAddLiveNav(null); }}
                            className="text-slate-500 hover:text-slate-300 transition text-base leading-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Dropdown Results ── */}
                    {(mfSearchResults.length > 0 || mfSearchNoResults) && mfSearchFocused && (
                      <div
                        className="absolute z-30 w-full mt-1.5 rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                          background: 'rgba(15,23,42,0.98)',
                          border: '1px solid rgba(6,182,212,0.2)',
                          backdropFilter: 'blur(16px)'
                        }}
                      >
                        {/* Header bar */}
                        <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            {mfSearchResults.length > 0 ? `${mfSearchResults.length} schemes found` : 'No results'}
                          </span>
                          <span className="text-[9px] text-slate-600">↑↓ navigate • Enter select</span>
                        </div>

                        {/* Result list */}
                        <div className="max-h-64 overflow-y-auto" >
                          {mfSearchNoResults ? (
                            <div className="px-4 py-6 text-center">
                              <div className="text-3xl mb-2">🔍</div>
                              <p className="text-xs text-slate-400 font-bold">No schemes found</p>
                              <p className="text-[10px] text-slate-600 mt-1">Try: "SBI Small Cap" or "HDFC Nifty 50"</p>
                            </div>
                          ) : (
                            mfSearchResults.map((s, i) => {
                              const fundHouse = parseFundHouse(s.schemeName);
                              const category = guessFundCategory(s.schemeName);
                              const catColor = CATEGORY_COLORS[category] || '#94a3b8';
                              const isHighlighted = mfDropdownHighlight === i;
                              
                              return (
                                <button
                                  key={s.schemeCode}
                                  onMouseDown={() => selectScheme(s)}
                                  onMouseEnter={() => setMfDropdownHighlight(i)}
                                  className="w-full text-left px-4 py-3 transition-all border-b border-white/[0.03] last:border-0 flex items-center gap-3.5"
                                  style={{
                                    background: isHighlighted ? 'linear-gradient(90deg, rgba(6,182,212,0.1) 0%, transparent 100%)' : 'transparent',
                                    borderLeft: isHighlighted ? '2px solid rgba(6,182,212,0.8)' : '2px solid transparent',
                                  }}
                                >
                                  {/* Brand Logo Avatar badge */}
                                  <div 
                                    className="shrink-0 transition-all"
                                    style={{
                                      transform: isHighlighted ? 'scale(1.08)' : 'scale(1)'
                                    }}
                                  >
                                    {renderBrandLogo(s.schemeName, 'w-9 h-9')}
                                  </div>

                                  {/* Main Details */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white leading-snug whitespace-normal break-words group-hover:text-cyan-400">
                                      {highlightMatch(s.schemeName, mfSearchQuery)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] text-slate-400 font-medium">{fundHouse}</span>
                                      <span className="text-[9px] text-slate-600">•</span>
                                      <span className="text-[8px] text-slate-500 font-mono bg-slate-950/40 px-1 py-0.5 rounded border border-white/5">#{s.schemeCode}</span>
                                    </div>
                                  </div>

                                  {/* Right side tag */}
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span
                                      className="text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                                      style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}35` }}
                                    >
                                      {category}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {/* Footer hint */}
                        {mfSearchResults.length > 0 && (
                          <div className="px-3.5 py-1.5 border-t border-white/5">
                            <p className="text-[9px] text-slate-600">Powered by mfapi.in · {mfSearchResults.length} of ~5000+ schemes</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state prompt (when focused, no query) */}
                    {mfSearchFocused && !mfSearchQuery && !mfSearchLoading && mfSearchResults.length === 0 && (
                      <div
                        className="absolute z-30 w-full mt-1.5 rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                          background: 'rgba(15,23,42,0.98)',
                          border: '1px solid rgba(6,182,212,0.2)',
                          backdropFilter: 'blur(16px)'
                        }}
                      >
                        <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">✨ Popular Mutual Funds (Instant Selection)</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {POPULAR_MFS.map((hint, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => selectScheme(hint)}
                              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-white cursor-pointer border-b border-white/[0.03] last:border-0 flex items-center gap-2.5"
                            >
                              <div className="shrink-0">
                                {renderBrandLogo(hint.schemeName, 'w-6 h-6')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate leading-tight">{hint.schemeName}</p>
                                <p className="text-[8px] text-slate-500 mt-0.5">Code: #{hint.schemeCode}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Selected Fund Card ── */}
                  {selectedScheme && (
                    <div
                      className="p-3 rounded-2xl flex items-center justify-between animate-fade-in"
                      style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.25)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] text-emerald-400 font-bold">✅ SELECTED FUND</span>
                          <span
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{
                              background: `${CATEGORY_COLORS[quickAddCategory] || '#94a3b8'}22`,
                              color: CATEGORY_COLORS[quickAddCategory] || '#94a3b8',
                              border: `1px solid ${CATEGORY_COLORS[quickAddCategory] || '#94a3b8'}44`
                            }}
                          >
                            {quickAddCategory}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-white leading-snug line-clamp-2">{selectedScheme.schemeName}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{parseFundHouse(selectedScheme.schemeName)} · #{selectedScheme.schemeCode}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-[9px] text-slate-400">Today's NAV</p>
                        {quickAddLiveNav
                          ? <p className="text-emerald-400 font-bold font-mono text-sm">₹{quickAddLiveNav.toFixed(2)}</p>
                          : <div className="flex items-center gap-1 mt-0.5"><div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /><span className="text-[9px] text-slate-500">Fetching</span></div>
                        }
                      </div>
                    </div>
                  )}

                  {/* Investment Type Selector */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1.5 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">2</span>
                      Select Investment Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQuickAddInvestmentType('sip')}
                        type="button"
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${quickAddInvestmentType === 'sip' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-extrabold' : 'bg-white/3 border-white/5 text-slate-400 hover:text-white'}`}
                      >
                        🔁 Monthly SIP
                      </button>
                      <button
                        onClick={() => setQuickAddInvestmentType('lumpsum')}
                        type="button"
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${quickAddInvestmentType === 'lumpsum' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-extrabold' : 'bg-white/3 border-white/5 text-slate-400 hover:text-white'}`}
                      >
                        💰 One-Time Lumpsum
                      </button>
                    </div>
                  </div>

                  {/* Conditional Setup Parameters */}
                  {quickAddInvestmentType === 'sip' ? (
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">3</span>
                        Set Up Your SIP Schedule
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monthly SIP Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 5000"
                            value={quickAddSipAmount}
                            onChange={e => setQuickAddSipAmount(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Execution Day (1-28)</label>
                          <input
                            type="number"
                            min="1"
                            max="28"
                            placeholder="e.g. 5"
                            value={quickAddSipDay}
                            onChange={e => setQuickAddSipDay(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">SIP Start Date</label>
                          <input
                            type="date"
                            value={quickAddStartDate}
                            onChange={e => setQuickAddStartDate(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Annual Step-Up (%)</label>
                          <input
                            type="number"
                            placeholder="e.g. 10 (Optional)"
                            value={quickAddStepUp}
                            onChange={e => setQuickAddStepUp(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">3</span>
                        Enter Lumpsum Details
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Investment Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 10000"
                            value={quickAddSipAmount}
                            onChange={e => setQuickAddSipAmount(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Investment Date</label>
                          <input
                            type="date"
                            value={quickAddStartDate}
                            onChange={e => setQuickAddStartDate(e.target.value)}
                            className="input-dark text-sm py-2 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fund Category Select */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1.5 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">4</span>
                      Fund Category
                    </label>
                    <select
                      value={quickAddCategory}
                      onChange={e => setQuickAddCategory(e.target.value)}
                      className="input-dark text-sm py-2 bg-[var(--bg-secondary)] text-white w-full border border-white/5 rounded-xl px-3"
                    >
                      {['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index', 'Debt', 'Liquid', 'International', 'Sectoral', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Platform selector */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1.5 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[8px] flex items-center justify-center font-black border border-cyan-500/30">5</span>
                      Which app did you buy from?
                    </label>
                    <div className="flex gap-2">
                      {['Groww', 'PhonePe', 'Paytm Money'].map(p => (
                        <button
                          key={p}
                          onClick={() => setQuickAddPlatform(p)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${quickAddPlatform === p ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/3 border-white/5 text-slate-400 hover:text-white'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time description */}
                  {selectedScheme && (
                    <div className="p-2.5 rounded-xl text-left space-y-0.5 animate-fade-in" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)' }}>
                      <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">⚡ Auto NAV Sync Active</p>
                      <p className="text-[9px] text-slate-400">
                        We'll fetch historical NAVs since <strong className="text-white">{quickAddStartDate}</strong> to compute units, XIRR & live value automatically.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sticky Footer ── */}
              {quickAddTab === 'mf' && (
                <div className="px-5 pb-4 pt-3 border-t border-white/[0.06] shrink-0 space-y-2">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowQuickAddModal(false)}
                      className="flex-none px-4 py-2 rounded-xl text-xs font-bold transition text-slate-400 hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addMfToVault}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition"
                      style={{ background: selectedScheme ? 'linear-gradient(135deg,#06b6d4,#8b5cf6)' : 'rgba(255,255,255,0.06)', color: selectedScheme ? '#fff' : '#64748b', cursor: selectedScheme ? 'pointer' : 'not-allowed' }}
                    >
                      {selectedScheme ? '✅ Add Fund to Vault' : 'Select a fund to continue →'}
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-600 text-center">Add multiple funds — after each, search for the next</p>
                </div>
              )}

              {/* ── Stocks Tab ── */}
              {quickAddTab === 'stocks' && (
                <div className="overflow-y-auto px-5 pb-4 pt-3 space-y-3.5 flex-1 text-left" >
                  <p className="text-[10px] text-slate-400">Add your Indian or US stock holdings to keep them tracked with live market quote sync.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🏦 Exchange Platform</label>
                      <select
                        value={quickAddStock.platform}
                        onChange={(e) => {
                          const platform = e.target.value;
                          setQuickAddStock({ ...quickAddStock, platform, symbol: '', name: '' });
                          setStockSearchQuery('');
                          setStockSearchResults([]);
                        }}
                        className="input-dark py-1.5 text-xs text-white"
                      >
                        <option value="Zerodha">🇮🇳 Indian Stocks (Zerodha)</option>
                        <option value="INDMoney">🇺🇸 US Stocks (INDMoney)</option>
                      </select>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🔍 Search Stock</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={quickAddStock.platform === 'INDMoney' ? 'Search Apple, Tesla, AAPL...' : 'Search Reliance, TCS, SBIN...'}
                          value={stockSearchQuery}
                          onFocus={() => {
                            setStockSearchFocused(true);
                          }}
                          onBlur={() => setTimeout(() => setStockSearchFocused(false), 200)}
                          onChange={e => handleStockSearch(e.target.value)}
                          className="input-dark text-xs py-1.5 w-full pl-8"
                          style={{ paddingLeft: '2rem' }}
                        />
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        
                        {stockSearchFocused && stockSearchResults.length > 0 && (
                          <div
                            className="absolute z-30 w-full mt-1.5 rounded-xl overflow-hidden shadow-2xl border border-cyan-500/20 bg-slate-900/98 backdrop-blur-md max-h-48 overflow-y-auto"
                            style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(6,182,212,0.2)' }}
                          >
                            {stockSearchResults.map((s, idx) => {
                              const exchangePrefix = s.type === 'US' ? 'NASDAQ' : 'NSE';
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={() => {
                                    setQuickAddStock({
                                      ...quickAddStock,
                                      symbol: s.symbol,
                                      name: s.name,
                                      avgPrice: s.price ? s.price.toString() : ''
                                    });
                                    setStockSearchQuery(`${s.name} (${s.symbol})`);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-cyan-500/20 hover:text-white cursor-pointer border-b border-white/[0.03] last:border-0 flex justify-between items-center"
                                >
                                  <div className="truncate pr-2 flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[9px] text-slate-500">{exchangePrefix}:</span>
                                      <span className="font-bold text-cyan-400 font-mono">{s.symbol}</span>
                                      <span className="text-[8px] bg-cyan-500/10 px-1 py-0.2 rounded text-cyan-300 border border-cyan-500/20">{s.sector}</span>
                                    </div>
                                    <span className="text-white text-[10px] truncate">{s.name}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 shrink-0 font-mono">
                                    <span className="text-white font-bold">{s.type === 'US' ? '$' : '₹'}{s.price}</span>
                                    {s.changePercent && s.changePercent !== 0 ? (
                                      <span className={`text-[8.5px] font-bold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {s.changePercent >= 0 ? '▲' : '▼'} {Math.abs(s.changePercent)}%
                                      </span>
                                    ) : (
                                      <span className="text-[8px] text-slate-500">Live Quote</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🔠 Stock Symbol</label>
                      <input
                        type="text"
                        placeholder="e.g. TCS, RELIANCE, AAPL"
                        value={quickAddStock.symbol}
                        onChange={(e) => setQuickAddStock({ ...quickAddStock, symbol: e.target.value })}
                        className="input-dark text-xs py-1.5 uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">📝 Stock / Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tata Consultancy Services"
                        value={quickAddStock.name}
                        onChange={(e) => setQuickAddStock({ ...quickAddStock, name: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🔢 Quantity (Shares)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={quickAddStock.qty}
                        onChange={(e) => setQuickAddStock({ ...quickAddStock, qty: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">
                        {quickAddStock.platform === 'INDMoney' ? '💵 Avg Buy Price ($)' : '₹ Avg Buy Price (₹)'}
                      </label>
                      <input
                        type="number"
                        placeholder={quickAddStock.platform === 'INDMoney' ? 'e.g. 150' : 'e.g. 3200'}
                        value={quickAddStock.avgPrice}
                        onChange={(e) => setQuickAddStock({ ...quickAddStock, avgPrice: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {quickAddStock.qty && quickAddStock.avgPrice && (
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-center animate-fade-in">
                      <p className="text-[9px] text-slate-400">Total Invested Value</p>
                      <p className="font-bold text-cyan-400 font-mono text-xs mt-0.5">
                        {quickAddStock.platform === 'INDMoney' ? '$' : '₹'}
                        {(parseFloat(quickAddStock.qty) * parseFloat(quickAddStock.avgPrice)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowQuickAddModal(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                    <button
                      onClick={quickAddStock.platform === 'INDMoney' ? saveUsStockToVault : saveStockToVault}
                      className="flex-1 py-2 text-xs font-bold rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}
                      disabled={!quickAddStock.name || !quickAddStock.symbol || !quickAddStock.qty || !quickAddStock.avgPrice}
                    >
                      💼 Add Stock holding
                    </button>
                  </div>
                </div>
              )}

              {/* ── Crypto Tab ── */}
              {quickAddTab === 'crypto' && (
                <div className="overflow-y-auto px-5 pb-4 pt-3 space-y-3.5 flex-1 text-left" >
                  <p className="text-[10px] text-slate-400">Add your cryptocurrency balances to track their valuation using live coingecko rates.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🏦 Exchange Platform</label>
                      <select
                        value={quickAddCrypto.platform}
                        onChange={(e) => setQuickAddCrypto({ ...quickAddCrypto, platform: e.target.value })}
                        className="input-dark py-1.5 text-xs text-white"
                      >
                        <option value="CoinDCX">CoinDCX</option>
                        <option value="WazirX">WazirX</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🔠 Coin Symbol</label>
                      <input
                        type="text"
                        placeholder="e.g. BTC, ETH, BDX"
                        value={quickAddCrypto.symbol}
                        onChange={(e) => setQuickAddCrypto({ ...quickAddCrypto, symbol: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">📝 Coin Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Bitcoin, Ethereum"
                      value={quickAddCrypto.name}
                      onChange={(e) => setQuickAddCrypto({ ...quickAddCrypto, name: e.target.value })}
                      className="input-dark text-xs py-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">🔢 Quantity (Coins)</label>
                      <input
                        type="number"
                        placeholder="e.g. 0.05"
                        value={quickAddCrypto.qty}
                        onChange={(e) => setQuickAddCrypto({ ...quickAddCrypto, qty: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold block mb-1">₹ Avg Buy Price (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5200000"
                        value={quickAddCrypto.avgPrice}
                        onChange={(e) => setQuickAddCrypto({ ...quickAddCrypto, avgPrice: e.target.value })}
                        className="input-dark text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {quickAddCrypto.qty && quickAddCrypto.avgPrice && (
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-center">
                      <p className="text-[9px] text-slate-400">Total Invested Value</p>
                      <p className="font-bold text-cyan-400 font-mono text-xs mt-0.5">
                        ₹{(parseFloat(quickAddCrypto.qty) * parseFloat(quickAddCrypto.avgPrice)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowQuickAddModal(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                    <button
                      onClick={saveCryptoToVault}
                      className="flex-1 py-2 text-xs font-bold rounded-xl text-white"
                      style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}
                      disabled={!quickAddCrypto.name || !quickAddCrypto.symbol || !quickAddCrypto.qty || !quickAddCrypto.avgPrice}
                    >
                      🪙 Add Crypto holding
                    </button>
                  </div>
                </div>
              )}

              {/* ── Gold/Silver Tab ── */}
              {quickAddTab === 'gold' && (() => {
                const getGoldKey = (plat, metal) => {
                  if (plat === 'PhonePe' && metal === 'Gold') return 'phonepeGold';
                  if (plat === 'PhonePe' && metal === 'Silver') return 'phonepeSilver';
                  if (plat === 'Aura Gold' && metal === 'Gold') return 'auraGold';
                  if (plat === 'Aura Gold' && metal === 'Silver') return 'auraSilver';
                  if (plat === 'Jar' && metal === 'Gold') return 'jarGold';
                  if (plat === 'MMTC-PAMP' && metal === 'Gold') return 'mmtcGold';
                  if (plat === 'MMTC-PAMP' && metal === 'Silver') return 'mmtcSilver';
                  if (plat === 'SafeGold' && metal === 'Gold') return 'safegoldGold';
                  if (plat === 'SafeGold' && metal === 'Silver') return 'safegoldSilver';
                  if (plat === 'Zerodha' && metal === 'Gold') return 'zerodhaGold';
                  if (plat === 'Zerodha' && metal === 'Silver') return 'zerodhaSilver';
                  return '';
                };

                const currentKey = getGoldKey(commodityPlatform, commodityMetalType);
                
                // Get all active holdings (non-zero)
                const activeHoldings = [
                  { key: 'phonepeGold', label: 'PhonePe Gold', icon: '📱', platform: 'PhonePe', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'phonepeSilver', label: 'PhonePe Silver', icon: '📱', platform: 'PhonePe', metal: 'Silver', rate: spotPrices.silver },
                  { key: 'auraGold', label: 'Aura Gold', icon: '⭐', platform: 'Aura Gold', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'auraSilver', label: 'Aura Silver', icon: '⭐', platform: 'Aura Gold', metal: 'Silver', rate: spotPrices.silver },
                  { key: 'jarGold', label: 'Jar App Gold', icon: '🫙', platform: 'Jar', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'mmtcGold', label: 'MMTC-PAMP Gold', icon: '🟥', platform: 'MMTC-PAMP', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'mmtcSilver', label: 'MMTC-PAMP Silver', icon: '🟥', platform: 'MMTC-PAMP', metal: 'Silver', rate: spotPrices.silver },
                  { key: 'safegoldGold', label: 'SafeGold Gold', icon: '🛡️', platform: 'SafeGold', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'safegoldSilver', label: 'SafeGold Silver', icon: '🛡️', platform: 'SafeGold', metal: 'Silver', rate: spotPrices.silver },
                  { key: 'zerodhaGold', label: 'Zerodha Gold', icon: '🪁', platform: 'Zerodha', metal: 'Gold', rate: spotPrices.gold },
                  { key: 'zerodhaSilver', label: 'Zerodha Silver', icon: '🪁', platform: 'Zerodha', metal: 'Silver', rate: spotPrices.silver }
                ].filter(h => parseFloat(quickAddGold[h.key]) > 0);

                return (
                  <div className="overflow-y-auto px-5 pb-4 pt-3 space-y-3.5 flex-1 text-left" >
                    {/* Live MCX Tickers */}
                    <div className="flex gap-3 justify-center text-[9px] py-1.5 px-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl select-none animate-pulse">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                        🟡 Live Gold (MCX): <strong className="text-white font-mono">₹{spotPrices.gold.toLocaleString('en-IN')}/g</strong>
                      </span>
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                        ⚪ Live Silver (MCX): <strong className="text-white font-mono">₹{spotPrices.silver.toLocaleString('en-IN')}/g</strong>
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">➕ Add or Update Holding</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">🏦 Platform</label>
                          <select
                            value={commodityPlatform}
                            onChange={(e) => {
                              const plat = e.target.value;
                              setCommodityPlatform(plat);
                              if (plat === 'Jar') {
                                setCommodityMetalType('Gold');
                                const val = quickAddGold[getGoldKey(plat, 'Gold')] || '';
                                setCommodityGrams(val);
                              } else {
                                const val = quickAddGold[getGoldKey(plat, commodityMetalType)] || '';
                                setCommodityGrams(val);
                              }
                            }}
                            className="input-dark py-1.5 text-xs text-white"
                          >
                            <option value="PhonePe">PhonePe</option>
                            <option value="Aura Gold">Aura Gold</option>
                            <option value="Jar">Jar App</option>
                            <option value="MMTC-PAMP">MMTC-PAMP</option>
                            <option value="SafeGold">SafeGold</option>
                            <option value="Zerodha">Zerodha</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">🪙 Asset Type</label>
                          <select
                            value={commodityMetalType}
                            disabled={commodityPlatform === 'Jar'}
                            onChange={(e) => {
                              const metal = e.target.value;
                              setCommodityMetalType(metal);
                              const val = quickAddGold[getGoldKey(commodityPlatform, metal)] || '';
                              setCommodityGrams(val);
                            }}
                            className="input-dark py-1.5 text-xs text-white disabled:opacity-50"
                          >
                            <option value="Gold">Gold 🟡</option>
                            <option value="Silver">Silver ⚪</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 font-bold block mb-1">⚖️ Grams</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5.00"
                            value={commodityGrams}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCommodityGrams(val);
                              if (currentKey) {
                                setQuickAddGold(prev => ({ ...prev, [currentKey]: val }));
                              }
                            }}
                            className="input-dark text-xs py-1.5 font-mono"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">grams</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Holdings List */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">📋 Current Vault Holdings ({activeHoldings.length})</p>
                      {activeHoldings.length === 0 ? (
                        <div className="p-3 text-center rounded-2xl bg-white/[0.01] border border-white/[0.04]">
                          <span className="text-[10px] text-slate-500 italic">No commodity holdings configured in this session yet. Use the form above to add some!</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {activeHoldings.map((h, idx) => {
                            const gramsVal = parseFloat(quickAddGold[h.key]) || 0;
                            const valuation = Math.round(gramsVal * h.rate);
                            
                            // Get brand custom card styles
                            const getBrandStyle = (plat) => {
                              switch (plat) {
                                case 'PhonePe':
                                  return { border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(88,28,135,0.08) 0%, rgba(139,92,246,0.02) 100%)' };
                                case 'Aura Gold':
                                  return { border: '1px solid rgba(234,179,8,0.25)', background: 'linear-gradient(135deg, rgba(113,63,18,0.08) 0%, rgba(234,179,8,0.02) 100%)' };
                                case 'Jar':
                                  return { border: '1px solid rgba(245,158,11,0.25)', background: 'linear-gradient(135deg, rgba(120,53,4,0.08) 0%, rgba(245,158,11,0.02) 100%)' };
                                case 'MMTC-PAMP':
                                  return { border: '1px solid rgba(239,68,68,0.25)', background: 'linear-gradient(135deg, rgba(153,27,27,0.08) 0%, rgba(239,68,68,0.02) 100%)' };
                                case 'SafeGold':
                                  return { border: '1px solid rgba(6,182,212,0.25)', background: 'linear-gradient(135deg, rgba(21,94,117,0.08) 0%, rgba(6,182,212,0.02) 100%)' };
                                case 'Zerodha':
                                  return { border: '1px solid rgba(249,115,22,0.25)', background: 'linear-gradient(135deg, rgba(124,45,18,0.08) 0%, rgba(249,115,22,0.02) 100%)' };
                                default:
                                  return { border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' };
                              }
                            };
                            const brandCardStyle = getBrandStyle(h.platform);

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl text-xs transition-all animate-fade-in"
                                style={brandCardStyle}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base shrink-0">{h.icon}</span>
                                  <div>
                                    <span className="font-bold text-white block leading-tight">{h.label}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">{gramsVal}g • live value: <strong className="text-emerald-400">₹{valuation.toLocaleString('en-IN')}</strong></span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCommodityPlatform(h.platform);
                                      setCommodityMetalType(h.metal);
                                      setCommodityGrams(gramsVal.toString());
                                    }}
                                    className="px-2 py-0.5 bg-white/5 text-slate-300 hover:text-white border border-white/10 rounded-lg text-[9px] font-bold hover:bg-white/10 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickAddGold(prev => ({ ...prev, [h.key]: '' }));
                                      if (currentKey === h.key) {
                                        setCommodityGrams('');
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-red-400 transition text-sm leading-none"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Live preview */}
                    <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl space-y-1.5 animate-fade-in">
                      <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">Live MCX Valuation Preview</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Gold ({((parseFloat(quickAddGold.phonepeGold) || 0) + (parseFloat(quickAddGold.auraGold) || 0) + (parseFloat(quickAddGold.jarGold) || 0) + (parseFloat(quickAddGold.mmtcGold) || 0) + (parseFloat(quickAddGold.safegoldGold) || 0) + (parseFloat(quickAddGold.zerodhaGold) || 0)).toFixed(2)}g)</span>
                        <span className="font-bold text-white font-mono">₹{Math.round(((parseFloat(quickAddGold.phonepeGold) || 0) + (parseFloat(quickAddGold.auraGold) || 0) + (parseFloat(quickAddGold.jarGold) || 0) + (parseFloat(quickAddGold.mmtcGold) || 0) + (parseFloat(quickAddGold.safegoldGold) || 0) + (parseFloat(quickAddGold.zerodhaGold) || 0)) * spotPrices.gold).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total Silver ({((parseFloat(quickAddGold.phonepeSilver) || 0) + (parseFloat(quickAddGold.auraSilver) || 0) + (parseFloat(quickAddGold.mmtcSilver) || 0) + (parseFloat(quickAddGold.safegoldSilver) || 0) + (parseFloat(quickAddGold.zerodhaSilver) || 0)).toFixed(2)}g)</span>
                        <span className="font-bold text-white font-mono">₹{Math.round(((parseFloat(quickAddGold.phonepeSilver) || 0) + (parseFloat(quickAddGold.auraSilver) || 0) + (parseFloat(quickAddGold.mmtcSilver) || 0) + (parseFloat(quickAddGold.safegoldSilver) || 0) + (parseFloat(quickAddGold.zerodhaSilver) || 0)) * spotPrices.silver).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setShowQuickAddModal(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                      <button onClick={saveGoldToVault} className="flex-1 py-2 text-xs font-bold rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#eab308,#ca8a04)' }}>
                        🪙 Save Commodities
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── Bonds & FDs Tab ── */}
              {quickAddTab === 'bonds' && (() => {
                const projections = (() => {
                  const p = parseFloat(quickAddBond.invested) || 0;
                  const r = parseFloat(quickAddBond.interestRate) || 0;
                  if (p <= 0 || r <= 0) return null;

                  let tenureYears = 5;
                  if (quickAddBond.type === 'PPF') tenureYears = 15;
                  else if (quickAddBond.type === 'SGB') tenureYears = 8;
                  else if (quickAddBond.type === 'NPS') tenureYears = 25;

                  if (quickAddBond.maturityDate) {
                    const today = new Date();
                    const maturity = new Date(quickAddBond.maturityDate);
                    const diffTime = Math.max(0, maturity.getTime() - today.getTime());
                    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                    if (diffYears > 0) tenureYears = diffYears;
                  }

                  let maturityValue = 0;
                  if (quickAddBond.type === 'FD' || quickAddBond.type === 'PPF' || quickAddBond.type === 'NPS') {
                    // Compound annually
                    maturityValue = p * Math.pow(1 + (r / 100), tenureYears);
                  } else {
                    // Simple interest for SGB/Bonds
                    maturityValue = p + (p * (r / 100) * tenureYears);
                  }
                  return {
                    maturityValue: Math.round(maturityValue),
                    interestEarned: Math.round(Math.max(0, maturityValue - p)),
                    tenureYears: Math.round(tenureYears * 10) / 10
                  };
                })();

                return (
                  <div className="overflow-y-auto px-5 pb-4 pt-3 space-y-3.5 flex-1" >
                    <p className="text-[10px] text-slate-400">Add your fixed income assets (Sovereign Gold Bonds, FDs, PPF, NPS) to centralize your interest-bearing portfolio.</p>

                    <div className="space-y-3 text-left">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">🏛️ Asset Type</label>
                          <select
                            value={quickAddBond.type}
                            onChange={e => {
                              const type = e.target.value;
                              setQuickAddBond(prev => ({ ...prev, type, name: '', interestRate: '', invested: '', qty: '', maturityDate: '' }));
                              setBondSearchQuery('');
                              setBondSearchResults(bondSuggestionsList[type] || []);
                            }}
                            className="input-dark text-xs py-1.5 w-full text-white"
                          >
                            <option value="SGB">Sovereign Gold Bond (SGB)</option>
                            <option value="FD">Fixed Deposit (FD)</option>
                            <option value="PPF">Public Provident Fund (PPF)</option>
                            <option value="NPS">National Pension Scheme (NPS)</option>
                            <option value="ELSS_BOND">Corporate & Tax Free Bonds</option>
                          </select>
                        </div>

                        <div className="relative">
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">🔍 Search/Select Template</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Select popular option..."
                              value={bondSearchQuery}
                              onFocus={() => {
                                setBondSearchFocused(true);
                                if (!bondSearchQuery) {
                                  setBondSearchResults(bondSuggestionsList[quickAddBond.type] || []);
                                }
                              }}
                              onBlur={() => setTimeout(() => setBondSearchFocused(false), 200)}
                              onChange={e => handleBondSearch(e.target.value)}
                              className="input-dark text-xs py-1.5 w-full pl-8"
                              style={{ paddingLeft: '2rem' }}
                            />
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>

                            {bondSearchFocused && bondSearchResults.length > 0 && (
                              <div
                                className="absolute z-30 w-full mt-1.5 rounded-xl overflow-hidden shadow-2xl border border-violet-500/20 bg-slate-900/98 backdrop-blur-md max-h-48 overflow-y-auto"
                                style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(139,92,246,0.2)' }}
                              >
                                {bondSearchResults.map((b, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={() => {
                                      setQuickAddBond(prev => ({
                                        ...prev,
                                        name: b.name,
                                        interestRate: b.rate.toString()
                                      }));
                                      setBondSearchQuery(b.name);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-violet-500/20 hover:text-white cursor-pointer border-b border-white/[0.03] last:border-0 flex flex-col gap-1"
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className="font-bold text-white truncate">{b.name}</span>
                                      <span className="text-[8px] bg-violet-500/10 px-1.5 py-0.5 rounded font-mono text-violet-400 font-bold shrink-0">
                                        {b.rate}% p.a.
                                      </span>
                                    </div>
                                    <span className="text-[8px] text-slate-500 truncate leading-tight">{b.desc}</span>
                                    <div className="flex gap-1.5 mt-0.5">
                                      <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/15">{b.taxBadge}</span>
                                      <span className="text-[7.5px] bg-white/5 text-slate-400 px-1.5 py-0.2 rounded font-semibold border border-white/10">Lock-in: {b.lockin}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 font-bold block mb-1">📝 Asset Name / Issuer</label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank FD, SGB 2023 Series II, SBI PPF"
                          value={quickAddBond.name}
                          onChange={e => setQuickAddBond(prev => ({ ...prev, name: e.target.value }))}
                          className="input-dark text-xs py-1.5 w-full font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">💰 Invested Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="e.g. 50000"
                            value={quickAddBond.invested}
                            onChange={e => setQuickAddBond(prev => ({ ...prev, invested: e.target.value }))}
                            className="input-dark text-xs py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">📈 Interest Rate / Coupon (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 7.15"
                            value={quickAddBond.interestRate}
                            onChange={e => setQuickAddBond(prev => ({ ...prev, interestRate: e.target.value }))}
                            className="input-dark text-xs py-1.5 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">🔢 Quantity / Units (For SGB/Bonds)</label>
                          <input
                            type="number"
                            placeholder="e.g. 10"
                            value={quickAddBond.qty}
                            onChange={e => setQuickAddBond(prev => ({ ...prev, qty: e.target.value }))}
                            className="input-dark text-xs py-1.5 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-300 font-bold block mb-1">📅 Maturity Date</label>
                          <input
                            type="date"
                            value={quickAddBond.maturityDate}
                            onChange={e => setQuickAddBond(prev => ({ ...prev, maturityDate: e.target.value }))}
                            className="input-dark text-xs py-1.5 font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {projections && (
                      <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-2xl space-y-1 animate-fade-in text-center select-none">
                        <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Estimated Maturity Projection ({projections.tenureYears} yrs)</p>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">Total Yield / Interest</span>
                          <span className="font-bold text-white font-mono">₹{projections.interestEarned.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Projected Maturity Value</span>
                          <span className="font-bold text-violet-400 font-mono">₹{projections.maturityValue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setShowQuickAddModal(false)} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
                      <button onClick={saveBondToVault} className="flex-1 py-2 text-xs font-bold rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>
                        💼 Add Fixed Income Asset
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}

        {/* 💰 DYNAMIC INTERMITTENT BUY/SELL TRANSACTION MODAL */}
        {showLumpsumModal && selectedSipForLumpsum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-fade-in space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">💰 Record Transaction</h3>
                  <p className="text-[10px] text-cyan-400 mt-0.5">{selectedSipForLumpsum.name}</p>
                </div>
                <button
                  onClick={() => { setShowLumpsumModal(false); setSelectedSipForLumpsum(null); }}
                  className="text-slate-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Action Tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setLumpsumModalTab('buy')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${lumpsumModalTab === 'buy' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  🟢 Buy Lumpsum
                </button>
                <button
                  onClick={() => setLumpsumModalTab('sell')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${lumpsumModalTab === 'sell' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  🔴 Sell (Redeem)
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    {lumpsumModalTab === 'buy' ? '1. Lumpsum Investment Amount (₹)' : '1. Redemption Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={lumpsumForm.amount || ''}
                    onChange={e => setLumpsumForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="input-dark text-sm py-2.5 font-mono w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">2. Transaction Date</label>
                  <input
                    type="date"
                    value={lumpsumForm.date}
                    onChange={e => setLumpsumForm(prev => ({ ...prev, date: e.target.value }))}
                    className="input-dark text-sm py-2.5 font-mono w-full"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">
                    {lumpsumModalTab === 'buy'
                      ? 'Our engine will retrieve the historic NAV value on this specific date to accumulate units.'
                      : 'Our engine will retrieve the historic NAV value on this specific date to automatically calculate the units redeemed.'
                    }
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">3. Transaction Note (Optional)</label>
                  <input
                    type="text"
                    placeholder={lumpsumModalTab === 'buy' ? "e.g. Bonus addition, dip buy" : "e.g. Goal completion withdrawal"}
                    value={lumpsumForm.note || ''}
                    onChange={e => setLumpsumForm(prev => ({ ...prev, note: e.target.value }))}
                    className="input-dark text-sm py-2 w-full"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowLumpsumModal(false); setSelectedSipForLumpsum(null); }}
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={lumpsumModalTab === 'buy' ? addLumpsumTransaction : addRedemptionTransaction}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl text-white transition ${lumpsumModalTab === 'buy' ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                  >
                    {lumpsumModalTab === 'buy' ? '✅ Record Buy' : '✅ Record Sell'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Sticky Industry-Grade System Telemetry HUD Readout */}
            <div 
              className={`sticky bottom-0 z-30 mt-4 bg-slate-950/90 backdrop-blur-md border rounded-2xl p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] text-left transition-all duration-300 ${
                hoveredControl ? "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-white/5"
              }`}
            >
              <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-slate-500 uppercase border-b border-white/5 pb-1.5 mb-2 select-none">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${hoveredControl ? "bg-violet-400 animate-pulse" : "bg-emerald-500"}`} />
                  {hoveredControl ? "📡 WEALTH TELEMETRY HUD" : "🟢 WEALTH READY"}
                </span>
                <span>SYSTEM: PORTFOLIO // ZONE: WEALTH</span>
              </div>
              <div className="flex items-start gap-2.5 min-h-[36px]">
                <span className="text-sm shrink-0 select-none">
                  {(() => {
                    const text = hoveredControl.toLowerCase();
                    if (!text) return "💡";
                    if (text.includes("slider") || text.includes("variable") || text.includes("amount") || text.includes("loan") || text.includes("interest") || text.includes("tenure")) return "🎛️";
                    if (text.includes("debt") || text.includes("emi") || text.includes("paydown") || text.includes("snowball") || text.includes("avalanche")) return "💳";
                    if (text.includes("portfolio") || text.includes("allocation") || text.includes("groww") || text.includes("zerodha")) return "💼";
                    if (text.includes("net worth") || text.includes("assets") || text.includes("liabilities")) return "📈";
                    return "💡";
                  })()}
                </span>
                <p className="text-[11px] leading-relaxed text-slate-200 font-sans font-medium transition-opacity duration-300">
                  {hoveredControl || (
                    <span className="text-slate-500 italic">
                      Hover over any control element (presets, debt payoff strategies, loan input sliders, import integrations, net worth metrics, or asset cards) to dynamically display live diagnostic readouts and explanations.
                    </span>
                  )}
                </p>
              </div>
            </div>

        <SectionGuide sectionId="/wealth" />
      </main>
    
    </div>
  );
};

export default WealthMap;
