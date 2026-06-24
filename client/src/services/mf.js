// client/src/services/mf.js
import api from './api';

export const searchFunds = async (query) => {
  const { data } = await api.get(`/mf/search?q=${encodeURIComponent(query)}`);
  return data.funds || [];
};

export const getNavHistory = async (schemeCode, limit = 730) => {
  const { data } = await api.get(`/mf/${schemeCode}/nav?limit=${limit}`);
  return data;
};

export const analyzeFund = async (schemeCode) => {
  const { data } = await api.get(`/mf/${schemeCode}/analyze`);
  return data;
};

export const getAiAdvisor = async (schemeCode) => {
  const { data } = await api.get(`/mf/${schemeCode}/ai-advisor`);
  return data.aiAdvisory;
};

export const compareFunds = async (schemeCodes) => {
  const { data } = await api.post('/mf/compare', { schemeCodes });
  return data.comparison || [];
};

export const getRollingReturns = async (schemeCode) => {
  const { data } = await api.get(`/mf/${schemeCode}/rolling-returns`);
  return data;
};

export const analyzePortfolio = async (portfolio) => {
  const { data } = await api.post('/mf/portfolio-analyze', { portfolio });
  return data;
};

export default {
  searchFunds,
  getNavHistory,
  analyzeFund,
  getAiAdvisor,
  compareFunds,
  getRollingReturns,
  analyzePortfolio
};
