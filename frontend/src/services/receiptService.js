import api from './api';

export const getReceipts = () => api.get('/receipts/');
export const getReceiptDetails = (receiptNumber) => api.get(`/receipts/${receiptNumber}`);
export const createReceipt = (data) => api.post('/receipts/', data);
export const deleteReceipt = (receiptNumber) => api.delete(`/receipts/${receiptNumber}`);