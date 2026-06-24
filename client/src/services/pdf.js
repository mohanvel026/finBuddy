import api from './api';

const downloadBlob = (data, filename) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

export const downloadExpenseReport = (groupId) =>
  api.get(`/pdf/expense-report/${groupId}`, { responseType: 'blob' })
    .then(r => downloadBlob(r.data, `expense-report-${groupId}.pdf`));

export const downloadTradeCertificate = (tradeId) =>
  api.get(`/pdf/trade-certificate/${tradeId}`, { responseType: 'blob' })
    .then(r => downloadBlob(r.data, `trade-certificate-${tradeId}.pdf`));

export const downloadAnnualReview = (year = new Date().getFullYear()) =>
  api.get(`/pdf/annual-review?year=${year}`, { responseType: 'blob' })
    .then(r => downloadBlob(r.data, `annual-review-${year}.pdf`));

export const downloadInvoice = (invoiceId) =>
  api.get(`/pdf/invoice/${invoiceId}`, { responseType: 'blob' })
    .then(r => downloadBlob(r.data, `invoice-${invoiceId}.pdf`));
