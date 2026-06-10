import api from './api';

export const getCustomerCards = () => api.get('/customer-cards/');
export const createCustomerCard = (data) => api.post('/customer-cards/', data);
export const updateCustomerCard = (cardNumber, data) => api.put(`/customer-cards/${cardNumber}`, data);
export const deleteCustomerCard = (cardNumber) => api.delete(`/customer-cards/${cardNumber}`);