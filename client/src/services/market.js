// client/src/services/market.js
import api from './api';

export const searchStocks = async (query) => {
  const { data } = await api.get(`/market/search?q=${encodeURIComponent(query)}`);
  return data.results || [];
};

export const getQuote = async (symbol) => {
  const { data } = await api.get(`/market/quote/${symbol}`);
  return data.quote;
};

export const getHistory = async (symbol, period = '1mo', interval = '1d') => {
  const { data } = await api.get(`/market/history/${symbol}?period=${period}&interval=${interval}`);
  return data.candles || [];
};

export const getTrending = async () => {
  const { data } = await api.get('/market/trending');
  return data.stocks || [];
};

export const getCrypto = async () => {
  const { data } = await api.get('/market/crypto');
  return data.coins || [];
};

export const getMutualFunds = async (search = '') => {
  const { data } = await api.get(`/market/mutual-funds?search=${encodeURIComponent(search)}`);
  return data.funds || [];
};

export const getStockNews = async (symbol) => {
  const { data } = await api.get(`/market/news/${symbol}`);
  return data.articles || [];
};

export const getSectorHeatmap = async () => {
  try {
    const response = await api.get('/market/sectors');
    if (response.data?.success && response.data.sectors) return response.data.sectors;
    throw new Error('No sector data');
  } catch (e) {
    return [
      { name: 'IT', pct: 0 }, { name: 'BANK', pct: 0 }, { name: 'AUTO', pct: 0 },
      { name: 'FMCG', pct: 0 }, { name: 'PHARMA', pct: 0 }, { name: 'ENERGY', pct: 0 },
      { name: 'METAL', pct: 0 }, { name: 'REALTY', pct: 0 }, { name: 'MEDIA', pct: 0 }, { name: 'PSU', pct: 0 },
    ];
  }
};

export default {
  searchStocks, getQuote, getHistory, getTrending,
  getCrypto, getMutualFunds, getStockNews, getSectorHeatmap
};
