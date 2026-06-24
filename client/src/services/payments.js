import api from './api';

export const getRazorpayKey = () => api.get('/payments/key');
export const createOrder = (amount, currency = 'INR', notes = {}) => api.post('/payments/order', { amount, currency, notes });
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const getInvoices = () => api.get('/payments/invoices');
