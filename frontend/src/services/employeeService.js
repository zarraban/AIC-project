import api from './api';

export const getEmployees = () => api.get('/employees/');
export const getCashiers = () => api.get('/employees/cashiers');
export const getMe = () => api.get('/employees/me');
export const createEmployee = (data) => api.post('/employees/', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const changePassword = (id, data) => api.put(`/employees/${id}/password`, data);