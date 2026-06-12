import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { getReceipts, deleteReceipt, getReceiptDetails } from '../../services/receiptService';
import { getEmployees } from '../../services/employeeService';
import { getStoreProducts } from '../../services/productStoreService';
import { getProducts } from '../../services/productInfoService';

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600";

export default function Receipts() {
    const [data, setData] = useState([]);
    const [cashiers, setCashiers] = useState([]);
    const [storeProducts, setStoreProducts] = useState([]);
    const [baseProducts, setBaseProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedCashier, setSelectedCashier] = useState('all');

    const [detailsModal, setDetailsModal] = useState({ open: false, receipt: null, items: [], loading: false });

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [receiptsRes, employeesRes, storeRes, baseRes] = await Promise.all([
                getReceipts(),
                getEmployees(),
                getStoreProducts(),
                getProducts()
            ]);
            setData(receiptsRes.data);

            const onlyCashiers = employeesRes.data.filter(emp => emp.empl_role.toLowerCase() === 'cashier');
            setCashiers(onlyCashiers);
            setStoreProducts(storeRes.data);
            setBaseProducts(baseRes.data);
        } catch (err) {
            setError('Помилка завантаження даних');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (row) => {
        if (!window.confirm(`Видалити чек №${row.receipt_number}?`)) return;
        try {
            await deleteReceipt(row.receipt_number);
            loadData();
        } catch (e) {
            setError(e.response?.data?.detail || 'Не вдалося видалити чек');
        }
    };

    const handleViewDetails = async (row) => {
        setDetailsModal({ open: true, receipt: row, items: [], loading: true });
        try {
            const res = await getReceiptDetails(row.receipt_number);
            const items = res.data.items || res.data.sales || res.data;
            setDetailsModal(prev => ({ ...prev, items, loading: false }));
        } catch (e) {
            setDetailsModal(prev => ({ ...prev, loading: false }));
            alert('Не вдалося завантажити деталі чека');
        }
    };

    const filtered = data.filter(r => {
        if (selectedCashier !== 'all' && r.id_employee !== selectedCashier) return false;

        const receiptDate = new Date(r.print_date);
        if (dateFrom && receiptDate < new Date(dateFrom)) return false;

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setDate(toDate.getDate() + 1);
            if (receiptDate >= toDate) return false;
        }

        return true;
    }).sort((a, b) => new Date(b.print_date) - new Date(a.print_date));

    const totalSum = filtered.reduce((sum, r) => sum + Number(r.sum_total), 0);
    const totalVat = filtered.reduce((sum, r) => sum + Number(r.vat), 0);

    const columns = [
        { key: 'receipt_number', label: '№ Чека' },
        {
            key: 'print_date',
            label: 'Дата і час',
            render: (val) => new Date(val).toLocaleString('uk-UA')
        },
        {
            key: 'id_employee',
            label: 'Касир',
            render: (val) => {
                const cashier = cashiers.find(c => c.id_employee === val);
                return cashier ? `${cashier.empl_surname} ${cashier.empl_name[0]}.` : val;
            }
        },
        { key: 'card_number', label: 'Карта клієнта', render: (val) => val || '—' },
        { key: 'sum_total', label: 'Загальна сума', render: (val) => <span className="font-bold text-green-700">{Number(val).toFixed(2)} грн</span> },
        {
            key: 'actions',
            label: 'Дії',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={() => handleViewDetails(row)} className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 print:hidden">
                        Деталі
                    </button>
                    <button onClick={() => handleDelete(row)} className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 rounded hover:bg-red-100 print:hidden">
                        Видалити
                    </button>
                </div>
            )
        }
    ];

    const getProductName = (upc) => {
        const sp = storeProducts.find(p => p.upc === upc);
        if (!sp) return 'Невідомий товар';
        const bp = baseProducts.find(p => p.id_product === sp.id_product);
        return bp ? bp.product_name : 'Невідомий товар';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Чеки та звіти продажу</h1>
                <div className="flex gap-3">
                    <button onClick={() => window.print()}
                            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        🖨 Друк
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">З дати</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">По дату</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Касир</label>
                    <select value={selectedCashier} onChange={(e) => setSelectedCashier(e.target.value)} className={inputCls}>
                        <option value="all">Усі касири</option>
                        {cashiers.map(c => (
                            <option key={c.id_employee} value={c.id_employee}>
                                {c.empl_surname} {c.empl_name} (ID: {c.id_employee})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col justify-center bg-green-50 p-3 rounded border border-green-200 text-right">
                    <p className="text-xs font-bold text-green-800 uppercase">Всього продано на:</p>
                    <p className="text-xl font-black text-green-700">{totalSum.toFixed(2)} грн</p>
                </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">Звіт з продажу</h2>
                <p className="text-sm text-gray-500">
                    Період: {dateFrom ? new Date(dateFrom).toLocaleDateString() : 'Початок'} — {dateTo ? new Date(dateTo).toLocaleDateString() : 'Сьогодні'}
                </p>
                <p className="text-sm text-gray-500">
                    Касир: {selectedCashier === 'all' ? 'Усі касири' : cashiers.find(c => c.id_employee === selectedCashier)?.empl_surname}
                </p>
                <h3 className="mt-4 font-bold text-xl">Загальна сума: {totalSum.toFixed(2)} грн (в т.ч. ПДВ: {totalVat.toFixed(2)} грн)</h3>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                            {columns.map(col => (
                                <th key={col.key} className={`p-4 text-xs font-bold text-gray-700 uppercase ${col.key === 'actions' ? 'print:hidden' : ''}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length} className="p-4 text-center">Завантаження...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={columns.length} className="p-4 text-center text-gray-500">Чеки не знайдено</td></tr>
                        ) : (
                            filtered.map(row => (
                                <tr key={row.receipt_number} className="border-b border-gray-100 hover:bg-gray-50">
                                    {columns.map(col => (
                                        <td key={col.key} className={`p-4 text-sm ${col.key === 'actions' ? 'print:hidden' : ''}`}>
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                Кількість чеків у звіті: {filtered.length}
            </div>

            <Modal
                isOpen={detailsModal.open}
                onClose={() => setDetailsModal({ open: false, receipt: null, items: [], loading: false })}
                title={`Деталі чека №${detailsModal.receipt?.receipt_number}`}
                hideSubmit={true}
            >
                {detailsModal.loading ? (
                    <p className="text-center p-4">Завантаження складу чека...</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p><span className="font-bold text-gray-700">Дата:</span> {new Date(detailsModal.receipt?.print_date).toLocaleString('uk-UA')}</p>
                            <p>
                                <span className="font-bold text-gray-700">Касир:</span>{' '}
                                {cashiers.find(c => c.id_employee === detailsModal.receipt?.id_employee)
                                    ? `${cashiers.find(c => c.id_employee === detailsModal.receipt?.id_employee).empl_surname} ${cashiers.find(c => c.id_employee === detailsModal.receipt?.id_employee).empl_name[0]}.`
                                    : detailsModal.receipt?.id_employee}
                            </p>
                            <p><span className="font-bold text-gray-700">Карта клієнта:</span> {detailsModal.receipt?.card_number || 'Не застосована'}</p>
                            <p><span className="font-bold text-gray-700">ПДВ:</span> {Number(detailsModal.receipt?.vat).toFixed(2)} грн</p>
                        </div>

                        <table className="w-full text-sm text-left border-collapse mt-2">
                            <thead>
                            <tr className="bg-gray-200">
                                <th className="p-2 border border-gray-300">UPC товару</th>
                                <th className="p-2 border border-gray-300">Назва товару</th>
                                <th className="p-2 border border-gray-300 text-center">К-сть</th>
                                <th className="p-2 border border-gray-300 text-right">Ціна (шт)</th>
                                <th className="p-2 border border-gray-300 text-right">Сума</th>
                            </tr>
                            </thead>
                            <tbody>
                            {detailsModal.items.length > 0 ? (
                                detailsModal.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-200">
                                        <td className="p-2 border border-gray-300 font-mono text-gray-600">{item.UPC || item.upc}</td>
                                        <td className="p-2 border border-gray-300 font-medium text-gray-900">{getProductName(item.UPC || item.upc)}</td>
                                        <td className="p-2 border border-gray-300 text-center">{item.product_number} шт</td>
                                        <td className="p-2 border border-gray-300 text-right">{Number(item.selling_price).toFixed(2)} грн</td>
                                        <td className="p-2 border border-gray-300 text-right font-medium">
                                            {(Number(item.selling_price) * Number(item.product_number)).toFixed(2)} грн
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Товарів не знайдено</td></tr>
                            )}
                            </tbody>
                        </table>

                        {(() => {
                            const subtotal = detailsModal.items.reduce((sum, item) => sum + (Number(item.selling_price) * Number(item.product_number)), 0);
                            const total = Number(detailsModal.receipt?.sum_total);
                            const discount = subtotal - total;

                            return (
                                <div className="flex flex-col items-end gap-1 mt-2 text-sm bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex justify-between w-64 text-gray-600">
                                        <span>Сума по товарах:</span>
                                        <span>{subtotal.toFixed(2)} грн</span>
                                    </div>

                                    {discount > 0.01 && (
                                        <div className="flex justify-between w-64 text-green-600 font-medium">
                                            <span>Знижка клієнта:</span>
                                            <span>- {discount.toFixed(2)} грн</span>
                                        </div>
                                    )}

                                    <div className="w-64 border-t border-gray-300 my-1"></div>

                                    <div className="flex justify-between w-64 font-bold text-lg text-gray-900">
                                        <span>Всього до сплати:</span>
                                        <span>{total.toFixed(2)} грн</span>
                                    </div>
                                </div>
                            );
                        })()}

                    </div>
                )}
            </Modal>
        </div>
    );
}