import api from './api';

export const getStoreProducts = () => api.get('/store-products/');
export const getStoreProductByUpc = (upc) => api.get(`/store-products/${upc}`);
export const createStoreProduct = (data) => api.post('/store-products/', data);
export const updateStoreProduct = (upc, data) => api.put(`/store-products/${upc}`, data);
export const deleteStoreProduct = (upc) => api.delete(`/store-products/${upc}`);