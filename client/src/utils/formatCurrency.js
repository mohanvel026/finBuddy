// client/src/utils/formatCurrency.js

export const formatINR = (amount, decimals = 0) => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const formatCompact = (amount) => {
  if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
};

export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatStockPrice = (price) => {
  if (!price) return '—';
  return `₹${Number(price).toFixed(2)}`;
};

export const getPnLColor = (value) => {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
};

export const getPnLBg = (value) => {
  if (value > 0) return 'bg-green-500/10 border-green-500/20';
  if (value < 0) return 'bg-red-500/10 border-red-500/20';
  return 'bg-white/5 border-white/10';
};
