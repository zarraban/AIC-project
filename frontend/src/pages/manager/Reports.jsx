import React, { useState, useEffect } from 'react';
import { getSalesByPeriod, getProductSales } from '../../services/reportService';
import { getEmployees } from '../../services/employeeService';
import { getProducts } from '../../services/productInfoService';

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600";
const btnCls = "px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400";

export default function Reports() {
    const [activeTab, setActiveTab] = useState('sales');

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [cashiers, setCashiers] = useState([]);
    const [products, setProducts] = useState([]);

    const [selectedCashier, setSelectedCashier] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState('');

    const [salesSummary, setSalesSummary] = useState(null);
    const [productTotalSold, setProductTotalSold] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getEmployees().then(res => setCashiers(res.data.filter(e => e.empl_role.toLowerCase() === 'cashier'))).catch(console.error);
        getProducts().then(res => setProducts(res.data)).catch(console.error);
    }, []);

    const generateReport = async () => {
        if (!dateFrom || !dateTo) {
            setError('Будь ласка, оберіть початкову та кінцеву дати');
            return;
        }

        setLoading(true);
        setError('');
        setSalesSummary(null);
        setProductTotalSold(null);

        try {
            if (activeTab === 'sales') {
                const res = await getSalesByPeriod(dateFrom, dateTo, selectedCashier);
                setSalesSummary(res.data.summary);
            } else if (activeTab === 'products') {
                if (!selectedProduct) {
                    setError('Оберіть товар зі списку');
                    setLoading(false);
                    return;
                }
                const res = await getProductSales(selectedProduct, dateFrom, dateTo);
                setProductTotalSold(res.data.total_sold);
            }
        } catch (err) {
            setError('Помилка генерації звіту');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Аналітичні звіти</h1>
                <button onClick={() => window.print()} className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50">
                    🖨 Друк звіту
                </button>
            </div>

            <div className="flex border-b border-gray-200 mb-6 print:hidden">
                <button
                    onClick={() => { setActiveTab('sales'); setProductTotalSold(null); setError(''); }}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'sales' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Загальна сума продажів
                </button>
                <button
                    onClick={() => { setActiveTab('products'); setSalesSummary(null); setError(''); }}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'products' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    Продажі певного товару
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 print:hidden">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">З дати</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">По дату</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                </div>

                {activeTab === 'sales' ? (
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Касир</label>
                        <select value={selectedCashier} onChange={(e) => setSelectedCashier(e.target.value)} className={inputCls}>
                            <option value="all">Усі касири</option>
                            {cashiers.map(c => (
                                <option key={c.id_employee} value={c.id_employee}>
                                    {c.empl_surname} {c.empl_name}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Оберіть товар</label>
                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className={inputCls}>
                            <option value="" disabled></option>
                            {products.map(p => (
                                <option key={p.id_product} value={p.id_product}>{p.product_name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-end">
                    <button onClick={generateReport} disabled={loading} className={`${btnCls} w-full h-[38px]`}>
                        {loading ? 'Генерація...' : '📊 Згенерувати'}
                    </button>
                </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm print:hidden">{error}</div>}

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg text-gray-600">
                    {activeTab === 'sales' ? 'Звіт: Загальна сума продажів' : 'Звіт: Продажі товару'}
                </h2>
                <p className="text-sm text-gray-500">Період: {dateFrom || '—'} — {dateTo || '—'}</p>
            </div>

            {activeTab === 'sales' && salesSummary && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-green-200 max-w-2xl mx-auto text-center mt-8">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Загальна сума проданих товарів</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Касир: <span className="font-bold">{selectedCashier === 'all' ? 'Усі касири' : cashiers.find(c => c.id_employee === selectedCashier)?.empl_surname}</span>
                    </p>
                    <div className="text-5xl font-black text-green-700 mb-4">
                        {Number(salesSummary.total_sum || 0).toFixed(2)} грн
                    </div>
                    <p className="text-gray-500">
                        Оброблено чеків: <span className="font-bold">{salesSummary.count || 0}</span>
                    </p>
                </div>
            )}

            {activeTab === 'products' && productTotalSold !== null && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-blue-200 max-w-2xl mx-auto text-center mt-8">
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Загальна кількість проданих одиниць</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Товар: <span className="font-bold">{products.find(p => p.id_product === Number(selectedProduct))?.product_name}</span>
                    </p>
                    <div className="text-5xl font-black text-blue-700 mb-4">
                        {productTotalSold} <span className="text-2xl text-blue-500">шт.</span>
                    </div>
                </div>
            )}

            {!loading && !salesSummary && productTotalSold === null && !error && (
                <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg mt-4 print:hidden">
                    Оберіть параметри та натисніть "Згенерувати" для отримання звіту
                </div>
            )}
        </div>
    );
}