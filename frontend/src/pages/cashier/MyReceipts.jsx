import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { getReceipts, getReceiptDetails } from '../../services/receiptService';
import { getStoreProducts } from '../../services/productStoreService';
import { getProducts } from '../../services/productInfoService';

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600";

export default function MyReceipts() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [storeProducts, setStoreProducts] = useState([]);
    const [baseProducts, setBaseProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(todayStr);
    const [dateTo, setDateTo] = useState(todayStr);
    const [search, setSearch] = useState('');

    const [detailsModal, setDetailsModal] = useState({ open: false, receipt: null, items: [], loading: false });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [recRes, storeRes, baseRes] = await Promise.all([
                    getReceipts(),
                    getStoreProducts(),
                    getProducts()
                ]);
                setData(recRes.data.filter(r => r.id_employee === user?.id));
                setStoreProducts(storeRes.data);
                setBaseProducts(baseRes.data);
            } catch (err) {
                setError('Помилка завантаження даних');
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) {
            fetchInitialData();
        }
    }, [user?.id]);

    const handleOpenDetails = async (row) => {
        setDetailsModal({ open: true, receipt: row, items: [], loading: true });
        try {
            const res = await getReceiptDetails(row.receipt_number);
            const items = res.data.items || res.data.sales || res.data;
            setDetailsModal(prev => ({ ...prev, items, loading: false }));
        } catch (err) {
            setDetailsModal(prev => ({ ...prev, loading: false }));
            setError('Не вдалося завантажити деталі чека');
        }
    };

    const filtered = data
        .filter(r => {
            if (!dateFrom && !dateTo) return true;
            const rDate = new Date(r.print_date).toISOString().split('T')[0];
            if (dateFrom && rDate < dateFrom) return false;
            if (dateTo && rDate > dateTo) return false;
            return true;
        })
        .filter(r => r.receipt_number.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.print_date) - new Date(a.print_date));

    const totalSum = filtered.reduce((sum, r) => sum + Number(r.sum_total), 0);

    const columns = [
        { key: 'receipt_number', label: 'Номер чека' },
        { key: 'print_date', label: 'Дата і час', render: (val) => new Date(val).toLocaleString('uk-UA') },
        { key: 'card_number', label: 'Карта клієнта', render: (val) => val || 'Немає' },
        { key: 'sum_total', label: 'Сума', render: (val) => <span className="font-bold text-gray-900">{Number(val).toFixed(2)} грн</span> },
        {
            key: 'actions',
            label: 'Дії',
            render: (_, row) => (
                <button onClick={() => handleOpenDetails(row)} className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                    Деталі
                </button>
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Мої чеки</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">З дати</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">По дату</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
                </div>

                <div className="flex flex-col justify-end gap-2">
                    <button
                        onClick={() => { setDateFrom(todayStr); setDateTo(todayStr); }}
                        className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        За сьогодні
                    </button>
                </div>

                <div className="flex flex-col justify-end">
                    <input
                        type="text"
                        placeholder="Пошук за номером чека..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={inputCls}
                    />
                </div>
            </div>

            {error && !detailsModal.open && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>
            )}

            <DataTable
                columns={columns}
                data={filtered}
                loading={loading}
            />

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
                            <p><span className="font-bold text-gray-700">Касир:</span> Ви ({detailsModal.receipt?.id_employee})</p>
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