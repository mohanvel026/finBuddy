// server/utils/currencyConverter.js
// Uses free ExchangeRate-API (no key needed for basic rates)

const axios = require('axios');

// Cache rates for 1 hour to avoid hitting API too often
let ratesCache = null;
let lastFetched = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const getExchangeRates = async () => {
  const now = Date.now();
  if (ratesCache && lastFetched && (now - lastFetched) < CACHE_TTL) {
    return ratesCache;
  }

  try {
    // Free API - no key needed
    const res = await axios.get('https://open.er-api.com/v6/latest/INR', { timeout: 5000 });
    ratesCache = res.data.rates;
    lastFetched = now;
    return ratesCache;
  } catch {
    // Fallback hardcoded rates
    return {
      USD: 0.012, EUR: 0.011, GBP: 0.0095,
      SGD: 0.016, AED: 0.044, THB: 0.43,
      INR: 1
    };
  }
};

const convertToINR = async (amount, fromCurrency) => {
  if (fromCurrency === 'INR') return amount;
  const rates = await getExchangeRates();
  const rateFromINR = rates[fromCurrency];
  if (!rateFromINR) return amount;
  return Math.round((amount / rateFromINR) * 100) / 100;
};

const convertFromINR = async (amountINR, toCurrency) => {
  if (toCurrency === 'INR') return amountINR;
  const rates = await getExchangeRates();
  const rateFromINR = rates[toCurrency];
  if (!rateFromINR) return amountINR;
  return Math.round(amountINR * rateFromINR * 100) / 100;
};

const getSupportedCurrencies = () => [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];

module.exports = { convertToINR, convertFromINR, getSupportedCurrencies, getExchangeRates };