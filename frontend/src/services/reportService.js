import api from './api';
export const getSalesByPeriod = (dateFrom, dateTo, idEmployee = '') => {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (idEmployee && idEmployee !== 'all') params.append('id_employee', idEmployee);
    return api.get(`/reports/sales-by-period?${params.toString()}`);
};

export const getProductSales = (idProduct, dateFrom, dateTo) => {
    const params = new URLSearchParams({ id_product: idProduct, date_from: dateFrom, date_to: dateTo });
    return api.get(`/reports/product-sales?${params.toString()}`);
};