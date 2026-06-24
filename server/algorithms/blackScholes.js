// server/algorithms/blackScholes.js

/**
 * Black-Scholes Options Pricing Model
 * Used to calculate theoretical price of CALL/PUT options
 */

// Cumulative normal distribution function
const normalCDF = (x) => {
  const a1 = 0.254829592, a2 = -0.284496736;
  const a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
};

/**
 * Calculate option price using Black-Scholes
 * @param {number} S - Current stock price (₹)
 * @param {number} K - Strike price (₹)
 * @param {number} T - Time to expiry in years (e.g., 30 days = 30/365)
 * @param {number} r - Risk-free rate (India RBI repo rate ~0.065)
 * @param {number} sigma - Volatility (e.g., 0.25 for 25%)
 * @param {string} type - 'CALL' or 'PUT'
 */
const blackScholes = (S, K, T, r = 0.065, sigma = 0.25, type = 'CALL') => {
  if (T <= 0) return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let price;
  let delta;

  if (type === 'CALL') {
    price = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    delta = normalCDF(d1);
  } else {
    price = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    delta = normalCDF(d1) - 1;
  }

  // Greeks
  const phi = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
  const gamma = phi / (S * sigma * Math.sqrt(T));
  const theta = type === 'CALL'
    ? (-S * phi * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365
    : (-S * phi * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normalCDF(-d2)) / 365;
  const vega = S * phi * Math.sqrt(T) / 100; // per 1% change in volatility

  return {
    price: Math.max(0, Math.round(price * 100) / 100),
    delta: Math.round(delta * 1000) / 1000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    d1: Math.round(d1 * 4) / 4,
    d2: Math.round(d2 * 4) / 4,
    intrinsicValue: type === 'CALL'
      ? Math.max(0, S - K)
      : Math.max(0, K - S),
    timeValue: Math.max(0, price - (type === 'CALL' ? Math.max(0, S - K) : Math.max(0, K - S)))
  };
};

// Generate payoff diagram data
const generatePayoffDiagram = (K, premium, type, priceRange = 20) => {
  const points = [];
  const low = K * (1 - priceRange / 100);
  const high = K * (1 + priceRange / 100);
  const step = (high - low) / 40;

  for (let price = low; price <= high; price += step) {
    let payoff;
    if (type === 'CALL') {
      payoff = Math.max(0, price - K) - premium;
    } else {
      payoff = Math.max(0, K - price) - premium;
    }
    points.push({
      stockPrice: Math.round(price),
      profitLoss: Math.round(payoff * 100) / 100,
      breakeven: type === 'CALL' ? K + premium : K - premium
    });
  }
  return points;
};

module.exports = { blackScholes, generatePayoffDiagram };