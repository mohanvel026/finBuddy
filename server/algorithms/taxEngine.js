// server/algorithms/taxEngine.js
const calculateTax = (annualIncome, regime = 'new', deductions = {}) => {
  let taxableIncome = annualIncome;
  let tax = 0;

  if (regime === 'old') {
    taxableIncome -= 50000; // standard deduction
    taxableIncome -= Math.min(deductions.section80C || 0, 150000);
    taxableIncome -= Math.min(deductions.section80D || 0, 25000);
    taxableIncome -= deductions.hra || 0;
    taxableIncome = Math.max(0, taxableIncome);

    if (taxableIncome <= 250000) tax = 0;
    else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
    else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
    else tax = 112500 + (taxableIncome - 1000000) * 0.30;
  } else {
    taxableIncome -= 75000; // New Regime Standard Deduction (FY 2025-26)
    taxableIncome = Math.max(0, taxableIncome);

    // Union Budget 2025 Slabs (FY 2025-26)
    if (taxableIncome <= 400000) {
      tax = 0;
    } else if (taxableIncome <= 800000) {
      tax = (taxableIncome - 400000) * 0.05;
    } else if (taxableIncome <= 1200000) {
      tax = 20000 + (taxableIncome - 800000) * 0.10;
    } else if (taxableIncome <= 1600000) {
      tax = 60000 + (taxableIncome - 1200000) * 0.15;
    } else if (taxableIncome <= 2000000) {
      tax = 120000 + (taxableIncome - 1600000) * 0.20;
    } else if (taxableIncome <= 2400000) {
      tax = 200000 + (taxableIncome - 2000000) * 0.25;
    } else {
      tax = 300000 + (taxableIncome - 2400000) * 0.30;
    }

    // Section 87A Rebate: Under Budget 2025, if taxable income <= ₹12 Lakhs, basic tax is fully rebated to NIL!
    if (taxableIncome <= 1200000) {
      tax = 0;
    }
  }

  const cess = tax * 0.04;
  const totalTax = tax + cess;

  return {
    taxableIncome: Math.max(0, Math.round(taxableIncome)),
    basicTax: Math.round(tax),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax),
    effectiveRate: annualIncome > 0 ? ((totalTax / annualIncome) * 100).toFixed(2) : '0.00',
    monthlyTDS: Math.round(totalTax / 12),
    regime
  };
};

const calculateDynamicTax = (annualIncome, regimeConfig, deductions = {}, regimeType = 'new') => {
  let taxableIncome = annualIncome;
  let tax = 0;

  // Apply standard deduction
  const stdDed = regimeConfig.standardDeduction !== undefined ? regimeConfig.standardDeduction : (regimeType === 'new' ? 75000 : 50000);
  taxableIncome -= stdDed;

  // Apply optional regime-specific deductions (only for old regime)
  if (regimeType === 'old') {
    taxableIncome -= Math.min(deductions.section80C || 0, 150000);
    taxableIncome -= Math.min(deductions.section80D || 0, 25000);
    taxableIncome -= deductions.hra || 0;
  }

  taxableIncome = Math.max(0, taxableIncome);

  // Compute tax using the slab array
  const slabs = regimeConfig.slabs || [];
  
  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    const min = parseFloat(slab.min) || 0;
    const max = (slab.max === null || slab.max === undefined) ? Infinity : parseFloat(slab.max);
    const percent = parseFloat(slab.percent) || 0;

    if (taxableIncome > min) {
      const taxableInThisSlab = Math.min(taxableIncome, max) - min;
      if (taxableInThisSlab > 0) {
        tax += taxableInThisSlab * (percent / 100);
      }
    }
  }

  // Section 87A rebate rules
  const rebateThreshold = parseFloat(regimeConfig.rebateThreshold) || 0;
  if (taxableIncome <= rebateThreshold) {
    tax = 0; // Fully rebated to zero!
  }

  const cess = tax * 0.04;
  const totalTax = tax + cess;

  return {
    taxableIncome: Math.max(0, Math.round(taxableIncome)),
    basicTax: Math.round(tax),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax),
    effectiveRate: annualIncome > 0 ? ((totalTax / annualIncome) * 100).toFixed(2) : '0.00',
    monthlyTDS: Math.round(totalTax / 12),
    regime: regimeType
  };
};

module.exports = { calculateTax, calculateDynamicTax };