// client/src/pages/smart/SWPSimulator.jsx — Peak Industry SWP Simulation & Macro Stress Lab
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRight, HelpCircle, AlertTriangle, ShieldCheck, Percent, DollarSign, Calendar, TrendingUp, RotateCcw, Dice5, Info, Layers, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ReferenceLine, CartesianGrid } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const renderMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentTable = null;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let currentList = null;

  const flushList = (key) => {
    if (currentList) {
      elements.push(
        <ul key={key} className="list-disc pl-5 space-y-1 mb-4 text-slate-300">
          {currentList.map((item, i) => (
            <li key={i} className="text-xs leading-relaxed">{item}</li>
          ))}
        </ul>
      );
      currentList = null;
    }
  };

  const flushTable = (key) => {
    if (currentTable) {
      elements.push(
        <div key={key} className="overflow-x-auto my-4 rounded-lg border border-white/5 bg-black/10">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/3">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTable.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/3 transition duration-150">
                  {row.map((val, i) => (
                    <td key={i} className="px-4 py-2 text-xs text-slate-300 font-mono">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const parseInline = (str) => {
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(str)) !== null) {
      const plainText = str.substring(lastIndex, match.index);
      if (plainText) parts.push(plainText);
      parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    const leftOver = str.substring(lastIndex);
    if (leftOver) parts.push(leftOver);

    return parts.length > 0 ? parts : str;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        elements.push(
          <div key={`code-${i}`} className="bg-black/30 border border-white/5 rounded-lg p-4 font-mono text-xs text-slate-300 my-4 whitespace-pre-wrap leading-relaxed">
            {codeBlockLines.join('\n')}
          </div>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(lines[i]);
      continue;
    }

    if (line.startsWith('|')) {
      const parts = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = parts.every(p => p.startsWith('-'));
      if (isSeparator) {
        continue;
      }
      if (!currentTable) {
        currentTable = { headers: parts, rows: [] };
      } else {
        currentTable.rows.push(parts);
      }
      continue;
    } else {
      flushTable(`table-${i}`);
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      if (!currentList) currentList = [];
      currentList.push(parseInline(content));
      continue;
    } else {
      flushList(`list-${i}`);
    }

    if (line.startsWith('>')) {
      const content = line.substring(1).trim();
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-cyan-500 bg-cyan-500/5 px-4 py-2.5 my-3 rounded-r-lg text-xs text-slate-300 italic leading-relaxed">
          {parseInline(content)}
        </blockquote>
      );
      continue;
    }

    if (line.startsWith('###')) {
      const content = line.substring(3).trim();
      elements.push(
        <h4 key={`h-${i}`} className="text-sm font-extrabold text-white tracking-wider mt-6 mb-3 border-b border-white/5 pb-1 uppercase">
          {parseInline(content)}
        </h4>
      );
      continue;
    } else if (line.startsWith('##')) {
      const content = line.substring(2).trim();
      elements.push(
        <h3 key={`h-${i}`} className="text-base font-black text-white tracking-wide mt-8 mb-4 border-b border-white/10 pb-1.5 uppercase">
          {parseInline(content)}
        </h3>
      );
      continue;
    } else if (line.startsWith('#')) {
      const content = line.substring(1).trim();
      elements.push(
        <h2 key={`h-${i}`} className="text-lg font-black text-white tracking-wide mt-10 mb-6">
          {parseInline(content)}
        </h2>
      );
      continue;
    }

    if (line === '---') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-white/5" />);
      continue;
    }

    if (line) {
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed mb-4">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushTable('table-end');
  flushList('list-end');

  return elements;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm">
        <p className="text-xs font-bold text-white mb-2 tracking-wide border-b border-white/5 pb-1">
          📅 {label && label.startsWith('Mo') ? `Month ${label.replace('Mo ', '')}` : `Simulation Year ${label ? label.replace('Yr ', '') : ''}`}
        </p>
        <div className="space-y-2">
          {payload.map((item, idx) => {
            const val = item.value;
            let formattedVal = `₹${val.toLocaleString('en-IN')}`;
            if (val <= 0 && item.name.includes('Remaining Balance')) {
              formattedVal = '❌ Depleted';
            }
            return (
              <div key={idx} className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-2 rounded-full h-2 inline-block shrink-0" 
                    style={{ backgroundColor: item.color || item.stroke }}
                  />
                  <span className="text-[10px] text-slate-350 font-medium">{item.name}</span>
                </div>
                <span className={`text-[10px] font-mono font-black ${val <= 0 && item.name.includes('Remaining Balance') ? 'text-rose-450' : 'text-white'}`}>
                  {formattedVal}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const SWPSimulator = () => {
  const [visibleLines, setVisibleLines] = useState({
    taxOptimized: true,
    standard: true,
    guardrail: false,
    inflationAdj: false,
    totalWithdrawn: false,
    mcOptimistic: true,
    mcMedian: true,
    mcWorst: true
  });

  const [initialCapital, setInitialCapital] = useState(5000000); // 50 Lakhs
  const [initialWithdrawal, setInitialWithdrawal] = useState(30000); // 30k/month
  const [expectedReturn, setExpectedReturn] = useState(10); // 10% p.a.
  const [volatility, setVolatility] = useState(12); // 12% standard deviation
  const [duration, setDuration] = useState(20); // 20 years
  const [durationUnit, setDurationUnit] = useState('years'); // 'years' | 'months'
  const [stepUp, setStepUp] = useState(6); // 6% annual step-up
  const [equityAllocation, setEquityAllocation] = useState(60); // 60% Equity
  const [bucketSizingMode, setBucketSizingMode] = useState('percentage'); // 'percentage' | 'years'
  const [cashYears, setCashYears] = useState(3); // 3 Years of withdrawals
  const [debtYears, setDebtYears] = useState(5); // 5 Years of withdrawals
  const [taxBracket, setTaxBracket] = useState(30); // 30% slab rate
  const [inflationRate, setInflationRate] = useState(6); // 6% p.a. inflation
  const [srrToggle, setSrrToggle] = useState(false); // Sequence of Returns Risk
  const [guytonKlinger, setGuytonKlinger] = useState(false); // Guyton-Klinger Guardrails
  const [mode, setMode] = useState('deterministic'); // 'deterministic' | 'montecarlo'
  const [historicalShock, setHistoricalShock] = useState('none'); // 'none' | 'gfc' | 'covid' | 'dotcom'
  
  const [showLedger, setShowLedger] = useState(true);
  const [ledgerView, setLedgerView] = useState('months'); // 'cashflow' | 'allocation' | 'tax' | 'months'
  const [activeMechanicTab, setActiveMechanicTab] = useState('rca'); // 'rca' | 'shield' | 'tax' | 'salary'
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);

  useEffect(() => {
    setLedgerPage(1);
  }, [duration, durationUnit]);

  // Box-Muller transform for generating normally distributed random variables
  const boxMullerRandom = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  // 1. Monte Carlo Stochastic Calculation engine
  const stochasticSimulation = useMemo(() => {
    if (duration <= 0) return { percentileData: [], survivalProbability: 100 };
    
    const numTrials = 200;
    const years = durationUnit === 'years' ? duration : Math.max(1, Math.round(duration / 12));
    const trialsData = [];

    const mean = expectedReturn / 100;
    const stdDev = volatility / 100;
    const stepUpRate = stepUp / 100;
    const infRate = inflationRate / 100;

    let successfulTrials = 0;

    for (let t = 0; t < numTrials; t++) {
      let balance = initialCapital;
      let monthlyWithdrawal = initialWithdrawal;
      const path = [initialCapital];

      for (let y = 1; y <= years; y++) {
        const annualWithdrawal = monthlyWithdrawal * 12;
        
        // Random annual return based on normal curve
        const rand = boxMullerRandom();
        
        // Apply historical shock override to first 3 years of stochastics if active
        let annualReturn = mean + stdDev * rand;
        if (historicalShock === 'gfc' && y === 1) annualReturn = -0.40;
        else if (historicalShock === 'gfc' && y === 2) annualReturn = -0.10;
        else if (historicalShock === 'gfc' && y === 3) annualReturn = 0.35;
        else if (historicalShock === 'covid' && y === 1) annualReturn = -0.30;
        else if (historicalShock === 'covid' && y === 2) annualReturn = 0.55;
        else if (historicalShock === 'dotcom' && y === 1) annualReturn = -0.35;
        else if (historicalShock === 'dotcom' && y === 2) annualReturn = -0.15;
        else if (historicalShock === 'dotcom' && y === 3) annualReturn = 0.05;

        balance = balance * (1 + annualReturn);
        balance = balance - annualWithdrawal;

        if (balance < 0) balance = 0;
        path.push(Math.round(balance));

        // Step up
        monthlyWithdrawal = monthlyWithdrawal * (1 + stepUpRate);
      }

      if (balance > 0) successfulTrials++;
      trialsData.push(path);
    }

    const survivalProbability = Math.round((successfulTrials / numTrials) * 100);

    // Group percentiles year by year
    const percentileData = [];
    percentileData.push({
      name: 'Start',
      'Optimistic Case (90th Pct)': initialCapital,
      'Median Case (50th Pct)': initialCapital,
      'Worst Case (10th Pct)': initialCapital,
    });

    for (let y = 1; y <= years; y++) {
      const yearValues = trialsData.map(path => path[y]).sort((a, b) => a - b);
      const idx10 = Math.floor(numTrials * 0.10);
      const idx50 = Math.floor(numTrials * 0.50);
      const idx90 = Math.floor(numTrials * 0.90);

      const inflationFactor = Math.pow(1 + infRate, y);

      percentileData.push({
        name: `Yr ${y}`,
        'Optimistic Case (90th Pct)': Math.round(yearValues[idx90] / inflationFactor),
        'Median Case (50th Pct)': Math.round(yearValues[idx50] / inflationFactor),
        'Worst Case (10th Pct)': Math.round(yearValues[idx10] / inflationFactor),
      });
    }

    return { percentileData, survivalProbability };
  }, [initialCapital, initialWithdrawal, expectedReturn, volatility, duration, durationUnit, stepUp, inflationRate, historicalShock]);

  // 2. Safe Withdrawal Rate Heatmap Zone matrix
  const swrMatrix = useMemo(() => {
    const eqSplits = [20, 40, 60, 80];
    const withdrawalRates = [3, 4, 5, 6]; // % of initial capital p.a.
    const matrix = [];

    const numTrials = 50;
    const years = durationUnit === 'years' ? duration : Math.max(1, Math.round(duration / 12));
    const mean = expectedReturn / 100;
    const stdDev = volatility / 100;
    const stepUpRate = stepUp / 100;

    for (const wr of withdrawalRates) {
      const row = { rate: wr };
      for (const eq of eqSplits) {
        let successfulTrials = 0;
        const initialAnnualWithdrawal = initialCapital * (wr / 100);
        
        for (let t = 0; t < numTrials; t++) {
          let balance = initialCapital;
          let annualWithdrawal = initialAnnualWithdrawal;

          for (let y = 1; y <= years; y++) {
            const rand = boxMullerRandom();
            // adjust parameters based on allocation (more equity, more risk/return)
            const adjustedMean = mean + (eq - 50) * 0.0003; 
            const adjustedStdDev = stdDev * (eq / 60);
            const annualReturn = adjustedMean + adjustedStdDev * rand;

            balance = balance * (1 + annualReturn);
            balance = balance - annualWithdrawal;

            if (balance < 0) {
              balance = 0;
              break;
            }
            annualWithdrawal = annualWithdrawal * (1 + stepUpRate);
          }
          if (balance > 0) successfulTrials++;
        }
        row[eq] = Math.round((successfulTrials / numTrials) * 100);
      }
      matrix.push(row);
    }
    return matrix;
  }, [initialCapital, expectedReturn, volatility, duration, durationUnit, stepUp]);

  // 3. Three-Bucket Asset Visualizer calculations
  const bucketAllocation = useMemo(() => {
    let bucket1 = 0;
    let bucket2 = 0;
    let bucket3 = 0;

    if (bucketSizingMode === 'years') {
      const annualWithdrawal = initialWithdrawal * 12;
      bucket1 = Math.min(initialCapital, annualWithdrawal * cashYears);
      bucket2 = Math.min(initialCapital - bucket1, annualWithdrawal * debtYears);
      bucket3 = Math.max(0, initialCapital - bucket1 - bucket2);
    } else {
      const equityVal = initialCapital * (equityAllocation / 100);
      const debtVal = initialCapital - equityVal;
      bucket1 = debtVal * 0.30;
      bucket2 = debtVal * 0.70;
      bucket3 = equityVal;
    }

    const total = bucket1 + bucket2 + bucket3 || 1;

    return {
      bucket1: Math.round(bucket1),
      bucket2: Math.round(bucket2),
      bucket3: Math.round(bucket3),
      b1Pct: Math.round((bucket1 / total) * 100),
      b2Pct: Math.round((bucket2 / total) * 100),
      b3Pct: Math.round((bucket3 / total) * 100),
    };
  }, [initialCapital, initialWithdrawal, equityAllocation, bucketSizingMode, cashYears, debtYears]);

  // 4. Deterministic Triple-Simulation (Standard vs Tax-Optimized vs Guardrail Optimized)
  const simulation = useMemo(() => {
    let balanceStd = initialCapital;
    let balanceOpt = initialCapital;
    let balanceGuard = initialCapital;
    
    let cumulativeWithdrawals = 0;
    let cumulativeInterest = 0;
    let cumulativeTaxStandard = 0;
    let cumulativeTaxOptimized = 0;
    let cumulativeTaxGuard = 0;

    let monthlyWithdrawal = initialWithdrawal;
    let monthlyWithdrawalGuard = initialWithdrawal;

    let depletedMonth = null;
    let depletedYear = null;

    const chartData = [];
    const ledgerData = [];
    const monthlyBreakdown = [];
    
    const infRateDec = inflationRate / 100;

    chartData.push({
      name: 'Start',
      'Remaining Balance (Standard)': Math.round(balanceStd),
      'Remaining Balance (Tax-Optimized)': Math.round(balanceOpt),
      'Remaining Balance (Guardrail Adjusted)': Math.round(balanceGuard),
      'Real Balance (Inflation-Adj)': Math.round(balanceOpt),
      'Total Withdrawn': 0,
      'Interest Growth': 0,
      'Tax Saved': 0
    });

    let yearlyEquityLtcgStandard = 0;
    let yearlyDebtGainsStandard = 0;
    let yearlyEquityLtcgOptimized = 0;
    let yearlyDebtGainsOptimized = 0;
    let yearlyEquityLtcgGuard = 0;
    let yearlyDebtGainsGuard = 0;

    let yearBeginningBalance = balanceOpt;
    let yearInterestEarned = 0;
    let yearWithdrawals = 0;
    let yearTaxPaid = 0;

    const totalMonths = durationUnit === 'years' ? duration * 12 : duration;

    for (let m = 1; m <= totalMonths; m++) {
      const yearIdx = Math.ceil(m / 12);
      
      // Determine rate of return for this month
      let annualRate = expectedReturn / 100;
      let annualRateStd = annualRate - 0.018; // 1.8% annual drag due to style drift and lack of rebalancing
      
      // Override returns based on historical shocks
      if (historicalShock === 'gfc') {
        if (yearIdx === 1) {
          annualRate = -0.40;
          annualRateStd = -0.48; // Higher loss due to equity liquidation during crash
        } else if (yearIdx === 2) {
          annualRate = -0.10;
          annualRateStd = -0.15;
        } else if (yearIdx === 3) {
          annualRate = 0.35;
          annualRateStd = 0.25; // Slower recovery
        }
      } else if (historicalShock === 'covid') {
        if (yearIdx === 1) {
          annualRate = -0.30;
          annualRateStd = -0.38;
        } else if (yearIdx === 2) {
          annualRate = 0.55;
          annualRateStd = 0.40;
        }
      } else if (historicalShock === 'dotcom') {
        if (yearIdx === 1) {
          annualRate = -0.35;
          annualRateStd = -0.42;
        } else if (yearIdx === 2) {
          annualRate = -0.15;
          annualRateStd = -0.20;
        } else if (yearIdx === 3) {
          annualRate = 0.05;
          annualRateStd = 0.02;
        }
      } else if (srrToggle) {
        if (yearIdx === 1) {
          annualRate = -0.25;
          annualRateStd = -0.32;
        } else {
          annualRate = (expectedReturn + 1.5) / 100;
          annualRateStd = (expectedReturn - 0.5) / 100;
        }
      }
      
      const monthlyRate = annualRate / 12;
      const monthlyRateStd = annualRateStd / 12;

      // growth
      if (balanceStd > 0) balanceStd += balanceStd * monthlyRateStd;
      let currentOpeningOpt = balanceOpt;
      let returnsOpt = 0;
      if (balanceOpt > 0) {
        returnsOpt = balanceOpt * monthlyRate;
        balanceOpt += returnsOpt;
        cumulativeInterest += returnsOpt;
        yearInterestEarned += returnsOpt;
      }
      if (balanceGuard > 0) balanceGuard += balanceGuard * monthlyRate;

      // Apply Guyton-Klinger Guardrails (Only to balanceGuard)
      if (balanceGuard > 0) {
        const currentWithdrawalPercentage = (monthlyWithdrawalGuard * 12) / balanceGuard;
        const initialWithdrawalPercentage = (initialWithdrawal * 12) / initialCapital;

        if (currentWithdrawalPercentage > initialWithdrawalPercentage * 1.20) {
          monthlyWithdrawalGuard = monthlyWithdrawalGuard * 0.90; // Preservation Rule
        } else if (currentWithdrawalPercentage < initialWithdrawalPercentage * 0.80) {
          monthlyWithdrawalGuard = monthlyWithdrawalGuard * 1.10; // Prosperity Rule
        }
      }

      // Withdraw Standard
      if (balanceStd > 0) {
        const actualWithdrawnStd = Math.min(balanceStd, monthlyWithdrawal);
        balanceStd -= actualWithdrawnStd;

        const eqWeight = equityAllocation / 100;
        const debtWeight = 1 - eqWeight;
        const stdEqWithdrawn = actualWithdrawnStd * eqWeight;
        const stdDebtWithdrawn = actualWithdrawnStd * debtWeight;

        yearlyEquityLtcgStandard += stdEqWithdrawn * 0.40;
        yearlyDebtGainsStandard += stdDebtWithdrawn * 0.40;
      }

      // Withdraw Optimized (No Guardrails)
      let actualWithdrawnOpt = 0;
      if (balanceOpt > 0) {
        actualWithdrawnOpt = Math.min(balanceOpt, monthlyWithdrawal);
        balanceOpt -= actualWithdrawnOpt;
        cumulativeWithdrawals += actualWithdrawnOpt;
        yearWithdrawals += actualWithdrawnOpt;

        let optEqWithdrawn = 0;
        let optDebtWithdrawn = 0;
        const monthlyEqLimit = 26041;

        if (actualWithdrawnOpt <= monthlyEqLimit) {
          optEqWithdrawn = actualWithdrawnOpt;
        } else {
          optEqWithdrawn = monthlyEqLimit;
          optDebtWithdrawn = actualWithdrawnOpt - monthlyEqLimit;
        }

        yearlyEquityLtcgOptimized += optEqWithdrawn * 0.40;
        yearlyDebtGainsOptimized += optDebtWithdrawn * 0.40;
      } else {
        if (depletedMonth === null) {
          depletedMonth = m % 12 || 12;
          depletedYear = Math.ceil(m / 12);
        }
        balanceOpt = 0;
      }

      // Record Month-by-Month projection
      monthlyBreakdown.push({
        month: m,
        opening: Math.round(currentOpeningOpt),
        returns: Math.round(returnsOpt),
        withdrawal: Math.round(actualWithdrawnOpt),
        closing: Math.round(balanceOpt)
      });

      // Withdraw Guardrail Optimized
      if (balanceGuard > 0) {
        const actualWithdrawnGuard = Math.min(balanceGuard, monthlyWithdrawalGuard);
        balanceGuard -= actualWithdrawnGuard;

        let guardEqWithdrawn = 0;
        let guardDebtWithdrawn = 0;
        const monthlyEqLimit = 26041;

        if (actualWithdrawnGuard <= monthlyEqLimit) {
          guardEqWithdrawn = actualWithdrawnGuard;
        } else {
          guardEqWithdrawn = monthlyEqLimit;
          guardDebtWithdrawn = actualWithdrawnGuard - monthlyEqLimit;
        }

        yearlyEquityLtcgGuard += guardEqWithdrawn * 0.40;
        yearlyDebtGainsGuard += guardDebtWithdrawn * 0.40;
      } else {
        balanceGuard = 0;
      }

      // Annual Tax & Step Up
      if (m % 12 === 0 || m === totalMonths) {
        const stdLtcgTax = Math.max(0, yearlyEquityLtcgStandard - 125000) * 0.125;
        const stdDebtTax = yearlyDebtGainsStandard * (taxBracket / 100);
        const totalTaxStd = stdLtcgTax + stdDebtTax;
        cumulativeTaxStandard += totalTaxStd;
        balanceStd = Math.max(0, balanceStd - totalTaxStd);

        const optLtcgTax = Math.max(0, yearlyEquityLtcgOptimized - 125000) * 0.125;
        const optDebtTax = yearlyDebtGainsOptimized * (taxBracket / 100);
        const totalTaxOpt = optLtcgTax + optDebtTax;
        cumulativeTaxOptimized += totalTaxOpt;
        balanceOpt = Math.max(0, balanceOpt - totalTaxOpt);
        yearTaxPaid = totalTaxOpt;

        const guardLtcgTax = Math.max(0, yearlyEquityLtcgGuard - 125000) * 0.125;
        const guardDebtTax = yearlyDebtGainsGuard * (taxBracket / 100);
        const totalTaxGuardVal = guardLtcgTax + guardDebtTax;
        cumulativeTaxGuard += totalTaxGuardVal;
        balanceGuard = Math.max(0, balanceGuard - totalTaxGuardVal);

        const targetCashPct = bucketAllocation.b1Pct;
        const targetDebtPct = bucketAllocation.b2Pct;
        const targetEquityPct = bucketAllocation.b3Pct;

        const currentCashBuffer = balanceOpt * (targetCashPct / 100);
        const currentDebtMf = balanceOpt * (targetDebtPct / 100);
        const currentEquityMf = balanceOpt * (targetEquityPct / 100);

        let rebalanceAlert = 'Portfolio in balance.';
        let rebalanceAmount = 0;
        const currentYearNum = Math.ceil(m / 12);
        let isCrashYear = false;
        if (historicalShock === 'gfc' && currentYearNum <= 2) isCrashYear = true;
        else if (historicalShock === 'covid' && currentYearNum === 1) isCrashYear = true;
        else if (historicalShock === 'dotcom' && currentYearNum <= 2) isCrashYear = true;
        else if (srrToggle && currentYearNum === 1) isCrashYear = true;

        if (isCrashYear) {
          rebalanceAlert = 'Sequence Shield Active: Equity Mutual Funds (Bucket 3) left untouched during crash.';
        } else {
          rebalanceAmount = yearWithdrawals;
          rebalanceAlert = `Refilled Cash Buffer (Bucket 1) by ₹${Math.round(rebalanceAmount).toLocaleString('en-IN')} from Equity Mutual Funds (Bucket 3).`;
        }

        ledgerData.push({
          year: currentYearNum,
          begBal: Math.round(yearBeginningBalance),
          growth: Math.round(yearInterestEarned),
          withdrawn: Math.round(yearWithdrawals),
          tax: Math.round(yearTaxPaid),
          endBal: Math.round(balanceOpt),
          cashBuffer: Math.round(currentCashBuffer),
          debtMf: Math.round(currentDebtMf),
          equityMf: Math.round(currentEquityMf),
          totalMf: Math.round(currentDebtMf + currentEquityMf),
          rebalanceAlert,
          rebalanceAmount: Math.round(rebalanceAmount),
          equityGains: Math.round(yearlyEquityLtcgOptimized),
          exemptionUtilized: Math.round(Math.min(yearlyEquityLtcgOptimized, 125000)),
          ltcgTax: Math.round(optLtcgTax),
          slabTax: Math.round(optDebtTax),
          taxSaved: Math.round(Math.max(0, totalTaxStd - totalTaxOpt))
        });

        yearBeginningBalance = balanceOpt;
        yearInterestEarned = 0;
        yearWithdrawals = 0;
        yearTaxPaid = 0;
        
        yearlyEquityLtcgStandard = 0;
        yearlyDebtGainsStandard = 0;
        yearlyEquityLtcgOptimized = 0;
        yearlyDebtGainsOptimized = 0;
        yearlyEquityLtcgGuard = 0;
        yearlyDebtGainsGuard = 0;

        monthlyWithdrawal = monthlyWithdrawal * (1 + stepUp / 100);
        monthlyWithdrawalGuard = monthlyWithdrawalGuard * (1 + stepUp / 100);
      }

      // Sample to chart
      let shouldSample = false;
      if (totalMonths <= 24) {
        shouldSample = (m % 2 === 0);
      } else if (totalMonths <= 120) {
        shouldSample = (m % 6 === 0);
      } else {
        shouldSample = (m % 12 === 0);
      }

      if (shouldSample || m === totalMonths) {
        const elapsedYears = m / 12;
        const inflationFactor = Math.pow(1 + infRateDec, elapsedYears);
        
        let labelName = `Yr ${Math.round(m / 12)}`;
        if (totalMonths <= 24) {
          labelName = `Mo ${m}`;
        } else if (totalMonths <= 120) {
          const yrs = m / 12;
          labelName = yrs % 1 === 0 ? `Yr ${yrs}` : `Yr ${yrs.toFixed(1)}`;
        }

        chartData.push({
          name: labelName,
          'Remaining Balance (Standard)': Math.round(balanceStd),
          'Remaining Balance (Tax-Optimized)': Math.round(balanceOpt),
          'Remaining Balance (Guardrail Adjusted)': Math.round(balanceGuard),
          'Real Balance (Inflation-Adj)': Math.round(balanceOpt / inflationFactor),
          'Total Withdrawn': Math.round(cumulativeWithdrawals),
          'Interest Growth': Math.round(cumulativeInterest),
          'Tax Saved': Math.round(Math.max(0, cumulativeTaxStandard - cumulativeTaxOptimized))
        });
      }
    }

    const netTaxSavings = Math.max(0, cumulativeTaxStandard - cumulativeTaxOptimized);

    return {
      chartData,
      ledgerData,
      monthlyBreakdown,
      finalBalance: Math.round(balanceOpt),
      totalWithdrawn: Math.round(cumulativeWithdrawals),
      interestGrowth: Math.round(cumulativeInterest),
      taxSaved: Math.round(netTaxSavings),
      depletedMonth,
      depletedYear
    };
  }, [initialCapital, initialWithdrawal, expectedReturn, duration, durationUnit, stepUp, equityAllocation, taxBracket, srrToggle, guytonKlinger, inflationRate, historicalShock]);

  const { chartData, ledgerData, monthlyBreakdown, finalBalance, totalWithdrawn, interestGrowth, taxSaved, depletedMonth, depletedYear } = simulation;
  const { percentileData, survivalProbability } = stochasticSimulation;

  const downloadPdfReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to download the PDF report.');
      return;
    }
    const html = `
      <html>
        <head>
          <title>FinBuddy SWP Simulation Report</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; background-color: #fff; }
            h1 { color: #0f172a; margin-bottom: 5px; font-weight: 800; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h3 { color: #64748b; margin-top: 5px; font-weight: 500; font-size: 13px; margin-bottom: 25px; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
            .card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; text-align: center; background-color: #f8fafc; }
            .card span { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
            .card p { font-size: 18px; font-weight: 800; margin: 4px 0 0 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 11px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: right; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; }
            th:first-child, td:first-child { text-align: left; font-weight: bold; }
            .green { color: #16a34a; font-weight: bold; }
            .red { color: #dc2626; font-weight: bold; }
            .section-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 35px; margin-bottom: 10px; text-transform: uppercase; border-left: 4px solid #0ea5e9; padding-left: 8px; }
          </style>
        </head>
        <body>
          <h1>FinBuddy Systematic Withdrawal Plan (SWP) Simulation Report</h1>
          <h3>Generated on ${new Date().toLocaleDateString('en-IN')}</h3>
          
          <div class="metrics">
            <div class="card">
              <span>Initial Capital</span>
              <p>₹${initialCapital.toLocaleString('en-IN')}</p>
            </div>
            <div class="card">
              <span>Monthly Withdrawal</span>
              <p>₹${initialWithdrawal.toLocaleString('en-IN')}</p>
            </div>
            <div class="card">
              <span>Total Payouts</span>
              <p>₹${totalWithdrawn.toLocaleString('en-IN')}</p>
            </div>
            <div class="card">
              <span>Ending Balance</span>
              <p>₹${finalBalance.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div class="section-title">Year-by-Year Simulation Projection</div>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Beginning Balance</th>
                <th>Growth Earned</th>
                <th>Amount Withdrawn</th>
                <th>Est. Taxes Paid</th>
                <th>Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerData.map(row => `
                <tr>
                  <td>Year ${row.year}</td>
                  <td>₹${row.begBal.toLocaleString('en-IN')}</td>
                  <td>₹${row.growth.toLocaleString('en-IN')}</td>
                  <td>₹${row.withdrawn.toLocaleString('en-IN')}</td>
                  <td>₹${row.tax.toLocaleString('en-IN')}</td>
                  <td class="${row.endBal > 0 ? 'green' : 'red'}">₹${row.endBal.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const resetInputs = () => {
    setInitialCapital(5000000);
    setInitialWithdrawal(30000);
    setExpectedReturn(10);
    setVolatility(12);
    setDuration(20);
    setDurationUnit('years');
    setStepUp(6);
    setEquityAllocation(60);
    setBucketSizingMode('percentage');
    setCashYears(3);
    setDebtYears(5);
    setTaxBracket(30);
    setInflationRate(6);
    setSrrToggle(false);
    setGuytonKlinger(false);
    setHistoricalShock('none');
    setLedgerView('cashflow');
    toast.success('Simulation parameters reset to default values.');
  };

  // AI Tax Strategy generation
  const getAiTaxAdvice = async () => {
    setLoadingAdvice(true);
    setAiAdvice('');
    try {
      const { data } = await api.post('/smart/swp-tax-advice', {
        initialCapital,
        initialWithdrawal,
        expectedReturn,
        stepUp,
        equityAllocation,
        taxBracket,
        srrToggle,
        guytonKlinger
      });
      if (data.success) {
        setAiAdvice(data.advice);
      } else {
        toast.error('Could not generate AI advice.');
      }
    } catch (e) {
      toast.error('Server error generating strategy.');
    }
    setLoadingAdvice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-medium">
      {/* Top Warning Banner if Depleted */}
      {mode === 'deterministic' && depletedYear && (
        <div className="card bg-red-950/20 border border-red-500/30 p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-red-400 h-6 w-6 shrink-0" />
          <div>
            <h5 className="font-extrabold text-sm text-red-300">Portfolio Depletion Warning!</h5>
            <p className="text-xs text-slate-350">
              Under these parameters, your account runs out of capital in <strong>Year {depletedYear}, Month {depletedMonth}</strong>. Consider lowering the initial withdrawal rate, decreasing the step-up percentage, or adjusting the equity mix.
            </p>
          </div>
        </div>
      )}

      {/* Three-Bucket Retirement Asset Visualizer */}
      <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4 text-left relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="flex items-center gap-2">
          <Layers className="text-cyan-400 h-5 w-5" />
          <div>
            <h4 className="font-black text-sm text-white">Three-Bucket Asset Allocation Strategy</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Dynamically structured based on your initial capital and equity split inputs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
          {/* Bucket 1 */}
          <div className="bg-white/5 border border-cyan-500/20 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-cyan-400 font-mono text-[9px] uppercase tracking-wider">Bucket 1: Safe Cash (0-3 Yrs)</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-mono font-bold">{bucketAllocation.b1Pct}%</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Short-term liquid buffer protecting your immediate withdrawals from market sequence corrections. Holds cash equivalents & liquid funds.
              </p>
            </div>
            <div className="text-lg font-black text-white font-mono">
              ₹{bucketAllocation.bucket1.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Bucket 2 */}
          <div className="bg-white/5 border border-purple-500/20 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-purple-400 font-mono text-[9px] uppercase tracking-wider">Bucket 2: Stable Debt (3-8 Yrs)</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-mono font-bold">{bucketAllocation.b2Pct}%</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Medium-term low-volatility anchor. Yields stable fixed income (Gilt, corporate bonds, FDs) to periodically refill Bucket 1.
              </p>
            </div>
            <div className="text-lg font-black text-white font-mono">
              ₹{bucketAllocation.bucket2.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Bucket 3 */}
          <div className="bg-white/5 border border-emerald-500/20 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-emerald-400 font-mono text-[9px] uppercase tracking-wider">Bucket 3: Equity Growth (8+ Yrs)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">{bucketAllocation.b3Pct}%</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Long-term wealth compounding engine. Invests in equities & mutual funds to beat inflation and drive future retirement capital.
              </p>
            </div>
            <div className="text-lg font-black text-white font-mono">
              ₹{bucketAllocation.bucket3.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mode === 'montecarlo' ? (
          <div className="card bg-white/3 border border-white/5 p-4 text-center flex flex-col justify-center items-center relative overflow-hidden group">
            {/* Circle gauge visualization */}
            <div className="relative w-16 h-16 flex items-center justify-center mb-1">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="transparent" 
                  stroke={survivalProbability >= 90 ? '#10B981' : survivalProbability >= 50 ? '#F59E0B' : '#EF4444'} 
                  strokeWidth="4" 
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - survivalProbability / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="text-sm font-black text-white">{survivalProbability}%</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Survival Probability</span>
            <span className="text-[9px] text-slate-500 mt-1 block">Chance of lasting {duration} Yrs</span>
          </div>
        ) : (
          <div className="card bg-white/3 border border-white/5 p-4 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Final Account Balance</span>
            <p className={`text-2xl font-black ${finalBalance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{finalBalance.toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Value at end of {duration} Years</span>
          </div>
        )}
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Total Payouts Withdrawn</span>
          <p className="text-2xl font-black text-cyan-400">
            ₹{totalWithdrawn.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Sum of all periodic SWPs</span>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Interest / Growth Generated</span>
          <p className="text-2xl font-black text-purple-400">
            ₹{interestGrowth.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">How much your money grew</span>
        </div>
        <div className="card bg-white/3 border border-white/5 p-4 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Estimated Tax Savings</span>
          <p className="text-2xl font-black text-yellow-400">
            ₹{taxSaved.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Via Annual LTCG Harvesting</span>
        </div>
      </div>

      {/* Projection mode tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 gap-1.5 w-fit">
        <button
          onClick={() => setMode('deterministic')}
          className={`py-1.5 px-4 text-xs font-black rounded-xl transition cursor-pointer ${
            mode === 'deterministic' ? 'bg-cyan-500 text-slate-950 shadow-lg font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Deterministic Projections
        </button>
        <button
          onClick={() => setMode('montecarlo')}
          className={`py-1.5 px-4 text-xs font-black rounded-xl transition cursor-pointer ${
            mode === 'montecarlo' ? 'bg-cyan-500 text-slate-950 shadow-lg font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎲 Stochastic Monte Carlo (200 Paths)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SWP Parameter Controllers */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4 text-left">
            <h4 className="font-extrabold text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              ⚙️ SWP Parameters
            </h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Initial Capital</span>
                  <span className="text-white font-bold">₹{initialCapital.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range"
                  min="1000000"
                  max="20000000"
                  step="250000"
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                  value={initialCapital}
                  onChange={e => setInitialCapital(parseInt(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Initial Monthly Withdrawal</span>
                  <span className="text-white font-bold">₹{initialWithdrawal.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range"
                  min="5000"
                  max="150000"
                  step="2000"
                  className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                  value={initialWithdrawal}
                  onChange={e => setInitialWithdrawal(parseInt(e.target.value))}
                />
                <div className="text-[9px] text-slate-400 mt-1 font-bold">
                  Safe Withdrawal Rate: <strong className="text-emerald-400">{((initialWithdrawal * 12 / initialCapital) * 100).toFixed(2)}% p.a.</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Expected Return</span>
                    <span className="text-white font-bold">{expectedReturn}%</span>
                  </div>
                  <input 
                    type="range"
                    min="4"
                    max="16"
                    step="0.5"
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={expectedReturn}
                    onChange={e => setExpectedReturn(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Annual Step-Up</span>
                    <span className="text-white font-bold">{stepUp}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={stepUp}
                    onChange={e => setStepUp(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {mode === 'montecarlo' && (
                <div className="animate-fade-in">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Market Volatility (Risk)</span>
                    <span className="text-white font-bold">{volatility}%</span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="25"
                    step="0.5"
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={volatility}
                    onChange={e => setVolatility(parseFloat(e.target.value))}
                  />
                  <span className="text-[8px] text-slate-500 mt-1 block">Annual standard deviation of returns.</span>
                </div>
              )}

              <div className="flex flex-col space-y-2 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Investment Duration</span>
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDurationUnit('years');
                        if (duration > 35) setDuration(Math.max(5, Math.round(duration / 12)));
                      }}
                      className={`py-0.5 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                        durationUnit === 'years' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDurationUnit('months');
                        if (duration <= 35) setDuration(duration * 12);
                      }}
                      className={`py-0.5 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                        durationUnit === 'months' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min={durationUnit === 'years' ? "5" : "12"}
                    max={durationUnit === 'years' ? "35" : "420"}
                    step={durationUnit === 'years' ? "1" : "12"}
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                  />
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold w-20 text-center">
                    {duration} {durationUnit === 'years' ? 'Yrs' : 'Mths'}
                  </div>
                </div>
              </div>

              {/* Bucket Sizing Strategy Selector */}
              <div className="flex flex-col space-y-2 border-t border-b border-white/5 py-3.5 my-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">📦 Bucket Sizing Strategy</span>
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 gap-1">
                    <button
                      type="button"
                      onClick={() => setBucketSizingMode('percentage')}
                      className={`py-0.5 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                        bucketSizingMode === 'percentage' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      % Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setBucketSizingMode('years')}
                      className={`py-0.5 px-2 text-[9px] font-bold rounded transition cursor-pointer ${
                        bucketSizingMode === 'years' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⏳ Years Target
                    </button>
                  </div>
                </div>

                {bucketSizingMode === 'percentage' ? (
                  <div className="animate-fade-in pt-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-medium">Equity Allocation Split</span>
                      <span className="text-white font-bold">{equityAllocation}% Equity</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                      value={equityAllocation}
                      onChange={e => setEquityAllocation(parseInt(e.target.value))}
                    />
                    <span className="text-[8px] text-slate-500 mt-1 block">Remaining {(100 - equityAllocation)}% allocated to Debt (30% Cash Buffer / 70% Stable Debt MF).</span>
                  </div>
                ) : (
                  <div className="animate-fade-in grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400 font-medium">Cash Target (B1)</span>
                        <span className="text-white font-bold font-mono">{cashYears} Yrs</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                        value={cashYears}
                        onChange={e => setCashYears(parseInt(e.target.value))}
                      />
                      <span className="text-[8px] text-slate-500 mt-1 block">Years of cash buffer.</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400 font-medium">Debt Target (B2)</span>
                        <span className="text-white font-bold font-mono">{debtYears} Yrs</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="10"
                        step="1"
                        className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                        value={debtYears}
                        onChange={e => setDebtYears(parseInt(e.target.value))}
                      />
                      <span className="text-[8px] text-slate-500 mt-1 block">Years of stable debt income.</span>
                    </div>
                    <span className="text-[8px] text-slate-500 col-span-2 mt-0.5 leading-snug">
                      Calculates Cash (Bucket 1) & Debt (Bucket 2) targets using withdrawals. The remainder compounds in Equity Growth (Bucket 3).
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Inflation Rate</span>
                    <span className="text-white font-bold">{inflationRate}%</span>
                  </div>
                  <input 
                    type="range"
                    min="3"
                    max="10"
                    step="0.5"
                    className="w-full accent-cyan-400 cursor-pointer h-1 bg-white/10 rounded-full"
                    value={inflationRate}
                    onChange={e => setInflationRate(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Tax Slab Rate</label>
                  <select 
                    value={taxBracket} 
                    onChange={e => setTaxBracket(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="10" className="bg-slate-900">10% Slab</option>
                    <option value="20" className="bg-slate-900">20% Slab</option>
                    <option value="30" className="bg-slate-900">30% Slab</option>
                  </select>
                </div>
              </div>

              {/* Advanced Risk Toggles & Historical dropdown */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">🛡️ Stress Testing & Shocks</span>
                
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Historical Crash Scenario</label>
                  <select 
                    value={historicalShock} 
                    onChange={e => setHistoricalShock(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="none" className="bg-slate-900">Standard Expected Return</option>
                    <option value="gfc" className="bg-slate-900">2008 Global Financial Crisis (-40%)</option>
                    <option value="covid" className="bg-slate-900">2020 COVID-19 Panic (-30%)</option>
                    <option value="dotcom" className="bg-slate-900">2000 Dot-com Bust (-35%)</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group pt-1">
                  <input 
                    type="checkbox" 
                    checked={srrToggle} 
                    disabled={historicalShock !== 'none'}
                    onChange={e => setSrrToggle(e.target.checked)}
                    className="rounded border-white/10 text-cyan-500 bg-white/5 focus:ring-0 cursor-pointer disabled:opacity-30"
                  />
                  <div>
                    <span className={`text-xs font-bold text-white group-hover:text-cyan-300 transition-colors ${historicalShock !== 'none' ? 'opacity-40' : ''}`}>Sequence of Returns Risk</span>
                    <p className="text-[9px] text-slate-400 leading-tight">Simulates a steep -25% market crash in Year 1 of retirement.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={guytonKlinger} 
                    onChange={e => setGuytonKlinger(e.target.checked)}
                    className="rounded border-white/10 text-cyan-500 bg-white/5 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Guyton-Klinger Guardrails</span>
                    <p className="text-[9px] text-slate-400 leading-tight">Dynamically adjusts payout -10% in bear runs or +10% in bull runs.</p>
                  </div>
                </label>
              </div>

              {/* Calculate, Download PDF, and Reset action buttons */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => toast.success('SWP projections recalculated.')}
                  className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-[0.98]"
                >
                  Calculate
                </button>
                
                <button
                  type="button"
                  onClick={downloadPdfReport}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  📥 Download PDF Report
                </button>

                <button
                  type="button"
                  onClick={resetInputs}
                  className="w-full bg-transparent hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  🔄 Reset Parameters
                </button>
              </div>
            </div>
          </div>

          {/* SWR Heatmap matrix card */}
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-3 text-left animate-fade-in">
            <div>
              <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-cyan-400" /> SWR Survival Matrix Zone
              </h5>
              <p className="text-[9px] text-slate-400 mt-0.5">Survival probability (%) across allocations and withdrawal rates.</p>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-mono">
              {/* Header row */}
              <div className="text-slate-500 font-bold self-center">SWR %</div>
              <div className="text-slate-400 font-bold">20% Eq</div>
              <div className="text-slate-400 font-bold">40% Eq</div>
              <div className="text-slate-400 font-bold">60% Eq</div>
              <div className="text-slate-400 font-bold">80% Eq</div>
              
              {swrMatrix.map((row, idx) => (
                <React.Fragment key={idx}>
                  <div className="text-white font-bold self-center bg-white/2 py-1 rounded">{row.rate}%</div>
                  {[20, 40, 60, 80].map((eq) => {
                    const prob = row[eq];
                    const colorClass = prob >= 90 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : prob >= 50 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20';
                    return (
                      <div key={eq} className={`py-1 rounded font-bold ${colorClass}`}>
                        {prob}%
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Projections & Advisor */}
        <div className="lg:col-span-8 space-y-6 text-left">
          {/* Decay Line Chart */}
          <div className="card bg-[#0b0f19]/80 border border-white/5 p-6 space-y-4 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-extrabold text-white text-base tracking-tight">
                  {mode === 'montecarlo' ? '🎲 Stochastic Monte Carlo Retirement Projections' : '📊 SWP Balance Decay & Compounding Trajectory'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'montecarlo' 
                    ? 'Inflation-adjusted envelopes representing probability distributions of 200 random outcomes.'
                    : `Calculates standard vs tax-optimized balance decay. Initial capital: ₹${initialCapital.toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>

            {/* Quick Trajectory Explainer */}
            <div className="bg-white/2 border border-white/5 p-3.5 rounded-2xl flex items-start gap-3 text-[10px] text-slate-400 leading-relaxed">
              <Info size={14} className="text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="text-slate-200 font-extrabold block mb-0.5">Interactive Multi-Strategy Simulator</strong>
                Compare standard mutual fund depletion against tax-optimized rebalancing. Toggle strategies below to isolate trajectories, and hover over any year to inspect comparative ending balances, purchasing power adjustments, and tax savings.
              </div>
            </div>

            {/* Interactive Toggle Pills Panel */}
            {mode === 'montecarlo' ? (
              <div className="flex flex-wrap gap-2 pt-1 border-b border-white/5 pb-3">
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, mcOptimistic: !prev.mcOptimistic }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.mcOptimistic 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Optimistic (90th Pct)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, mcMedian: !prev.mcMedian }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.mcMedian 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Median (50th Pct)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, mcWorst: !prev.mcWorst }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.mcWorst 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-450" />
                  Worst (10th Pct)
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1 border-b border-white/5 pb-3">
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, taxOptimized: !prev.taxOptimized }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.taxOptimized 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tax-Optimized Balance
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, standard: !prev.standard }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.standard 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-450" />
                  Standard Balance
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, guardrail: !prev.guardrail }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.guardrail 
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-455" />
                  Guardrail Adjusted
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, inflationAdj: !prev.inflationAdj }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.inflationAdj 
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-450" />
                  Inflation-Adjusted Real
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLines(prev => ({ ...prev, totalWithdrawn: !prev.totalWithdrawn }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border cursor-pointer ${
                    visibleLines.totalWithdrawn 
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                      : 'bg-white/2 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Total Payouts
                </button>
              </div>
            )}

            <div className="h-72 w-full text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={mode === 'montecarlo' ? percentileData : chartData} 
                  margin={{ top: 15, right: 10, left: 25, bottom: 5 }}
                >
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    tickLine={false} 
                    width={90}
                    tickFormatter={(val) => {
                      if (val === 0) return '0';
                      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
                      return `₹${(val / 100000).toFixed(0)} L`;
                    }} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(34, 211, 238, 0.15)', strokeWidth: 1.5, strokeDasharray: '3 3' }} />
                  
                  {mode === 'montecarlo' ? (
                    <>
                      {visibleLines.mcOptimistic && (
                        <Area 
                          type="monotone" 
                          dataKey="Optimistic Case (90th Pct)" 
                          stroke="#10B981" 
                          fill="rgba(16, 185, 129, 0.06)" 
                          strokeWidth={2}
                          name="Optimistic Case (90th Pct)"
                        />
                      )}
                      {visibleLines.mcMedian && (
                        <Area 
                          type="monotone" 
                          dataKey="Median Case (50th Pct)" 
                          stroke="#6366F1" 
                          fill="rgba(99, 102, 241, 0.06)" 
                          strokeWidth={2}
                          name="Median Case (50th Pct)"
                        />
                      )}
                      {visibleLines.mcWorst && (
                        <Area 
                          type="monotone" 
                          dataKey="Worst Case (10th Pct)" 
                          stroke="#EF4444" 
                          fill="rgba(239, 68, 68, 0.06)" 
                          strokeWidth={2}
                          name="Worst Case (10th Pct)"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Principal Benchmark Line */}
                      <ReferenceLine y={initialCapital} stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" label={{ value: 'Principal Benchmark', position: 'insideTopLeft', fill: '#fb7185', fontSize: 9 }} />
                      
                      {visibleLines.taxOptimized && (
                        <Area 
                          type="monotone" 
                          dataKey="Remaining Balance (Tax-Optimized)" 
                          stroke="#10b981" 
                          fill="rgba(16, 185, 129, 0.04)" 
                          strokeWidth={3}
                          name="Remaining Balance (Tax-Optimized)"
                        />
                      )}
                      {visibleLines.guardrail && (
                        <Area 
                          type="monotone" 
                          dataKey="Remaining Balance (Guardrail Adjusted)" 
                          stroke="#06b6d4" 
                          fill="rgba(6, 182, 212, 0.04)" 
                          strokeWidth={2}
                          name="Remaining Balance (Guardrail Adjusted)"
                        />
                      )}
                      {visibleLines.standard && (
                        <Area 
                          type="monotone" 
                          dataKey="Remaining Balance (Standard)" 
                          stroke="#EF4444" 
                          fill="none" 
                          strokeWidth={3}
                          name="Remaining Balance (Standard)"
                        />
                      )}
                      {visibleLines.inflationAdj && (
                        <Area 
                          type="monotone" 
                          dataKey="Real Balance (Inflation-Adj)" 
                          stroke="#a855f7" 
                          fill="none" 
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          name="Real Balance (Inflation Adjusted)"
                        />
                      )}
                      {visibleLines.totalWithdrawn && (
                        <Area 
                          type="monotone" 
                          dataKey="Total Withdrawn" 
                          stroke="#f59e0b" 
                          fill="none" 
                          strokeWidth={1.5}
                          name="Total Payouts"
                        />
                      )}
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {mode === 'deterministic' && (
              <>
                {/* Toggle Ledger Button */}
                <button 
                  onClick={() => setShowLedger(!showLedger)}
                  className="btn-secondary text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 w-full mt-4 cursor-pointer"
                >
                  📋 {showLedger ? 'Hide Cashflow Ledger Table' : 'View Detailed Cashflow Ledger Table'}
                </button>

                {showLedger && (
                  <div className="card bg-white/3 border border-white/5 p-4 overflow-hidden mt-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-bold text-xs text-white">Simulation Breakdown Ledger</h5>
                      <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 gap-1">
                        <button
                          onClick={() => setLedgerView('cashflow')}
                          className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            ledgerView === 'cashflow' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          💸 Cashflows
                        </button>
                        <button
                          onClick={() => setLedgerView('allocation')}
                          className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            ledgerView === 'allocation' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📈 Mutual Funds Split
                        </button>
                        <button
                          onClick={() => setLedgerView('tax')}
                          className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            ledgerView === 'tax' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🛡️ Tax & Rebalancing
                        </button>
                        <button
                          onClick={() => setLedgerView('months')}
                          className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition cursor-pointer ${
                            ledgerView === 'months' ? 'bg-cyan-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📅 Month-by-Month
                        </button>
                      </div>
                    </div>

                    {ledgerView === 'months' && (
                      <div className="flex items-center justify-between mb-4 bg-white/3 border border-white/5 p-3 rounded-2xl flex-wrap gap-3">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Showing Months {((ledgerPage - 1) * 10) + 1} - {Math.min(monthlyBreakdown.length, ledgerPage * 10)} of {monthlyBreakdown.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={ledgerPage === 1}
                            onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white disabled:opacity-30 cursor-pointer"
                          >
                            ← Prev
                          </button>
                          <span className="text-xs text-slate-300 font-mono font-bold">
                            Page {ledgerPage} of {Math.ceil(monthlyBreakdown.length / 10)}
                          </span>
                          <button
                            type="button"
                            disabled={ledgerPage === Math.ceil(monthlyBreakdown.length / 10)}
                            onClick={() => setLedgerPage(prev => Math.min(Math.ceil(monthlyBreakdown.length / 10), prev + 1))}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white disabled:opacity-30 cursor-pointer"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto text-[10px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      <table className="w-full text-left min-w-[1000px] border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-350 font-bold sticky top-0 bg-[#0f172a] z-10">
                            <th className="px-4 py-3 text-left font-bold">{ledgerView === 'months' ? 'Month' : 'Year'}</th>
                            {ledgerView === 'cashflow' && (
                              <>
                                <th className="px-4 py-3 text-right">Beginning Balance</th>
                                <th className="px-4 py-3 text-right">Growth Earned</th>
                                <th className="px-4 py-3 text-right">Amount Withdrawn</th>
                                <th className="px-4 py-3 text-right">Est. Taxes</th>
                                <th className="px-4 py-3 text-right">Ending Balance</th>
                              </>
                            )}
                            {ledgerView === 'allocation' && (
                              <>
                                <th className="px-4 py-3 text-right">Ending Balance</th>
                                <th className="px-4 py-3 text-right text-cyan-400">Cash Buffer (B1)</th>
                                <th className="px-4 py-3 text-right text-purple-400">Debt Mutual Funds (B2)</th>
                                <th className="px-4 py-3 text-right text-emerald-400">Equity Mutual Funds (B3)</th>
                                <th className="px-4 py-3 text-right text-yellow-400">Total Mutual Funds (B2+B3)</th>
                              </>
                            )}
                            {ledgerView === 'tax' && (
                              <>
                                <th className="px-4 py-3 text-right">Ending Balance</th>
                                <th className="px-4 py-3 text-right text-emerald-400">Realized Gains</th>
                                <th className="px-4 py-3 text-right text-cyan-400">Exemption (1.25L)</th>
                                <th className="px-4 py-3 text-right text-yellow-400">LTCG Tax</th>
                                <th className="px-4 py-3 text-right text-rose-405">Slab Tax</th>
                                <th className="px-4 py-3 text-right text-emerald-400">Tax Saved</th>
                                <th className="px-4 py-3 text-left pl-6">Annual Rebalancing Action</th>
                              </>
                            )}
                            {ledgerView === 'months' && (
                              <>
                                <th className="px-4 py-3 text-right">Opening</th>
                                <th className="px-4 py-3 text-right">Withdrawal</th>
                                <th className="px-4 py-3 text-right text-purple-400">Returns</th>
                                <th className="px-4 py-3 text-right text-emerald-400">Closing</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium animate-fade-in">
                          {ledgerView === 'months' ? (
                            (() => {
                              const itemsPerPage = 10;
                              const startIndex = (ledgerPage - 1) * itemsPerPage;
                              const endIndex = startIndex + itemsPerPage;
                              return monthlyBreakdown.slice(startIndex, endIndex).map((row, idx) => (
                                <tr key={idx} className="even:bg-white/[0.01] hover:bg-white/3 transition-colors border-b border-white/5 last:border-b-0">
                                  <td className="px-4 py-3 text-white font-bold font-mono">Month {row.month}</td>
                                  <td className="px-4 py-3 text-right text-slate-300">₹{row.opening.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-3 text-right text-cyan-400">₹{row.withdrawal.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-3 text-right text-purple-400 font-mono">₹{row.returns.toLocaleString('en-IN')}</td>
                                  <td className={`px-4 py-3 text-right font-bold ${row.closing > 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                    ₹{row.closing.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ));
                            })()
                          ) : (
                            ledgerData.map((row, idx) => (
                              <tr key={idx} className="even:bg-white/[0.01] hover:bg-white/3 transition-colors border-b border-white/5 last:border-b-0">
                                <td className="px-4 py-3 text-white font-bold">Yr {row.year}</td>
                                {ledgerView === 'cashflow' && (
                                  <>
                                    <td className="px-4 py-3 text-right text-slate-300">₹{row.begBal.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-purple-400 font-mono">₹{row.growth.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-cyan-400 font-mono">₹{row.withdrawn.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-yellow-500/80 font-mono">₹{row.tax.toLocaleString('en-IN')}</td>
                                    <td className={`px-4 py-3 text-right font-bold font-mono ${row.endBal > 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                      ₹{row.endBal.toLocaleString('en-IN')}
                                    </td>
                                  </>
                                )}
                                {ledgerView === 'allocation' && (
                                  <>
                                    <td className={`px-4 py-3 text-right font-bold font-mono ${row.endBal > 0 ? 'text-slate-350' : 'text-rose-450'}`}>
                                      ₹{row.endBal.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-cyan-400/90 font-mono">₹{row.cashBuffer.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-purple-400/90 font-mono">₹{row.debtMf.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400/90 font-mono">₹{row.equityMf.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-yellow-400/90 font-mono font-bold">₹{row.totalMf.toLocaleString('en-IN')}</td>
                                  </>
                                )}
                                {ledgerView === 'tax' && (
                                  <>
                                    <td className="px-4 py-3 text-right text-slate-350 font-bold font-mono">₹{row.endBal.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400/90 font-mono">₹{row.equityGains.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-cyan-400/90 font-mono">₹{row.exemptionUtilized.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-yellow-400/90 font-mono">₹{row.ltcgTax.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-rose-450 font-mono">₹{row.slabTax.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400 font-mono font-bold">₹{row.taxSaved.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-left pl-6">
                                      {row.rebalanceAlert.includes('Shield Active') ? (
                                        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl text-[9px] font-bold leading-tight w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-450 shrink-0 animate-pulse" />
                                          {row.rebalanceAlert}
                                        </div>
                                      ) : row.rebalanceAlert.includes('Refilled') ? (
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[9px] font-bold leading-tight w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                          {row.rebalanceAlert}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 bg-slate-500/10 border border-slate-500/20 text-slate-400 px-3 py-1 rounded-xl text-[9px] font-bold leading-tight w-fit">
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                          {row.rebalanceAlert}
                                        </div>
                                      )}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

          {/* AI Tax Optimization Advice Card */}
          <div className="card bg-white/3 border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">🛡️ Tax-Harvesting Waterfall Optimization</h4>
                <p className="text-xs text-slate-400 mt-0.5">Learn how to withdraw capital with minimum tax slab drag.</p>
              </div>
              <button 
                onClick={getAiTaxAdvice} 
                disabled={loadingAdvice}
                className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loadingAdvice ? 'Analyzing...' : 'Ask AI Strategist 🧠'}
              </button>
            </div>

            {aiAdvice ? (
              <div className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-2xl text-xs leading-relaxed text-slate-300 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                  <ShieldCheck size={16} />
                  <span>AI TAX RECOMMENDATION & ACTION PLAN</span>
                </div>
                <div className="space-y-1 font-sans">
                  {renderMarkdown(aiAdvice)}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed flex flex-col gap-2">
                <p>
                  💡 <strong>Standard Harvesting Heuristic:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Harvest Equity Long-Term Capital Gains (LTCG) up to <strong>₹1,25,000 tax-free</strong> every financial year.</li>
                  <li>Withdraw from debt/liquid assets up to the basic exemption limit (₹3,0,000) to keep slab taxation at 0%.</li>
                  <li>Restructure remaining balances to take advantage of low-rate capital gains over slab taxation.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Why Withdraw Monthly Mechanics Hub */}
          <div className="card bg-slate-900/60 border border-white/5 p-5 space-y-4 text-left relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"></div>
            <div className="flex items-center gap-2">
              <RefreshCw className="text-cyan-400 h-5 w-5 animate-spin-slow" />
              <div>
                <h4 className="font-black text-sm text-white">Why Withdraw Monthly? The SWP Mechanics Hub</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Learn why a systematic monthly payout beats lump sums or dividends.</p>
              </div>
            </div>

            {/* Selector tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white/3 p-1 rounded-xl border border-white/5 gap-1">
              <button
                onClick={() => setActiveMechanicTab('rca')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition text-center cursor-pointer ${
                  activeMechanicTab === 'rca' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔄 Reverse RCA
              </button>
              <button
                onClick={() => setActiveMechanicTab('shield')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition text-center cursor-pointer ${
                  activeMechanicTab === 'shield' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Sequence Shield
              </button>
              <button
                onClick={() => setActiveMechanicTab('tax')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition text-center cursor-pointer ${
                  activeMechanicTab === 'tax' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                📈 Tax Arbitrage
              </button>
              <button
                onClick={() => setActiveMechanicTab('salary')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition text-center cursor-pointer ${
                  activeMechanicTab === 'salary' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                💵 Synthetic Salary
              </button>
            </div>

            {/* Tab contents */}
            <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl text-xs space-y-3 min-h-[140px] flex flex-col justify-center">
              {activeMechanicTab === 'rca' && (
                <div className="space-y-2 animate-fade-in">
                  <h5 className="font-extrabold text-cyan-400 flex items-center gap-1.5">
                    🔄 Reverse Rupee Cost Averaging (RCA) Mitigation
                  </h5>
                  <p className="text-slate-300 leading-relaxed">
                    When you withdraw a constant sum monthly, you sell <strong>fewer mutual fund units</strong> when the market is rising (high NAV) and <strong>more units</strong> when the market is falling (low NAV).
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    💡 <em>Industry Insight:</em> By structuring your portfolio with a cash buffer, we prevent the "forced selling" of equity mutual funds at the absolute bottom of a crash, solving the structural weakness of simple SWPs.
                  </p>
                </div>
              )}

              {activeMechanicTab === 'shield' && (
                <div className="space-y-2 animate-fade-in">
                  <h5 className="font-extrabold text-purple-400 flex items-center gap-1.5">
                    🛡️ The Three-Bucket Sequence of Returns Risk Shield
                  </h5>
                  <p className="text-slate-300 leading-relaxed">
                    A market crash in the first few years of retirement (Sequence Risk) can deplete a standard single-portfolio SWP prematurely. By dividing your capital, we withdraw exclusively from the <strong>Cash Buffer (Bucket 1)</strong>.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    💡 <em>Industry Insight:</em> Your volatile <strong>Equity Mutual Funds (Bucket 3)</strong> are left completely untouched during downturns, giving them a 3-to-5 year window to fully recover and grow compound interest.
                  </p>
                </div>
              )}

              {activeMechanicTab === 'tax' && (
                <div className="space-y-2 animate-fade-in">
                  <h5 className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    📈 Indian Tax Arbitrage Advantage
                  </h5>
                  <p className="text-slate-300 leading-relaxed">
                    Unlike FD interest or salary which are taxed at your slab rate (up to 30%+), SWP withdrawals are treated as redemptions of capital. Only the <strong>gain portion</strong> is taxed, not the principal.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    💡 <em>Industry Insight:</em> Under Section 112A, Equity LTCG up to <strong>₹1.25 Lakhs per year is 100% tax-free</strong>. By automatically harvesting this limit every year, you keep your effective tax rate close to 0-3%.
                  </p>
                </div>
              )}

              {activeMechanicTab === 'salary' && (
                <div className="space-y-2 animate-fade-in">
                  <h5 className="font-extrabold text-amber-400 flex items-center gap-1.5">
                    💵 Predictable Synthetic Salary Stream
                  </h5>
                  <p className="text-slate-300 leading-relaxed">
                    Retirement requires regular cash flows to cover monthly household bills. Instead of manually redeeming mutual funds or waiting for unpredictable stock dividends, the SWP automates a monthly bank credit.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    💡 <em>Industry Insight:</em> This provides behavioral peace of mind, allowing retirees to maintain their lifestyle budget without stressing over short-term market volatility or cash-flow crunches.
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
