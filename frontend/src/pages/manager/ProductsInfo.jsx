import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productInfoService.js';
import { getCategories } from '../../services/categoryService';
import PrintPreviewModal from '../../components/PrintPreviewModal';
import api from '../../services/api';

const EMPTY = { id_product: '', category_number: '', product_name: '', manufacturer: '', characteristics: '' };

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400";
const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

export default function ProductsInfo() {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [modal, setModal] = useState({ open: false, mode: 'add', row: null });
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [printOpen, setPrintOpen] = useState(false);

    const [analyticsProductId, setAnalyticsProductId] = useState('');
    const [productStats, setProductStats] = useState({ loaded: false, data: [], loading: false, error: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
            setData(prodRes.data);
            setCategories(catRes.data);
        } catch {
            setError('Помилка завантаження даних');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const openAdd = () => { setForm(EMPTY); setError(''); setModal({ open: true, mode: 'add', row: null }); };
    const openEdit = (row) => { setForm(row); setError(''); setModal({ open: true, mode: 'edit', row }); };

    const handleDelete = async (row) => {
        if (!window.confirm(`Видалити товар "${row.product_name}"?`)) return;
        setError('');
        try {
            await deleteProduct(row.id_product);
            loadData();
        } catch (e) {
            setError(e.response?.data?.detail || 'Не вдалося видалити товар. Можливо, він вже є у магазині.');
        }
    };

    const handleSubmit = async () => {
        if (!form.id_product || !form.category_number || !form.product_name || !form.manufacturer || !form.characteristics) {
            setError('Заповніть усі поля');
            return;
        }
        setSaving(true); setError('');
        try {
            const payload = {
                ...form,
                id_product: Number(form.id_product),
                category_number: Number(form.category_number)
            };

            modal.mode === 'add'
                ? await createProduct(payload)
                : await updateProduct(modal.row.id_product, payload);

            setModal({ open: false, mode: 'add', row: null });
            loadData();
        } catch (e) {
            setError(e.response?.data?.detail || 'Помилка збереження');
        } finally {
            setSaving(false);
        }
    };

    const handleLoadProductStats = async () => {
        if (!analyticsProductId) {
            setProductStats(prev => ({...prev, error: 'Оберіть товар з переліку'}));
            return;
        }
        setProductStats({ loaded: false, data: [], loading: true, error: '' });
        try {
            const res = await api.get(`http://localhost:8000/analytics/vashchenko/product-sales-stats/${analyticsProductId}`);
            setProductStats({ loaded: true, data: res.data, loading: false, error: '' });
        } catch (e) {
            console.error(e);
            setProductStats({ loaded: true, data: [], loading: false, error: 'Помилка завантаження статистики' });
        }
    };

    const filtered = data
        .filter(p => p.product_name.toLowerCase().includes(search.toLowerCase()))
        .filter(p => categoryFilter === 'all' || p.category_number === Number(categoryFilter))
        .sort((a, b) => a.product_name.localeCompare(b.product_name, 'uk'));

    const columns = [
        { key: 'id_product', label: 'ID' },
        {
            key: 'category_number',
            label: 'Категорія',
            render: (val) => categories.find(c => c.category_number === val)?.category_name || val
        },
        { key: 'product_name', label: 'Назва товару' },
        { key: 'manufacturer', label: 'Виробник' },
        { key: 'characteristics', label: 'Характеристики' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Довідник товарів</h1>
                <div className="flex gap-3">
                    <button onClick={() => setPrintOpen(true)}
                            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        🖨 Друк
                    </button>
                    <button onClick={openAdd}
                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                        + Додати
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-4 print:hidden">
                <input
                    type="text"
                    placeholder="Пошук за назвою"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                />

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                    <option value="all">Всі категорії</option>
                    {categories.map(c => (
                        <option key={c.category_number} value={c.category_number}>
                            {c.category_name}
                        </option>
                    ))}
                </select>
            </div>

            {error && !modal.open && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>
            )}

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">Звіт: Товари довідника</h2>
                <p className="text-sm text-gray-500">Дата формування: {new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

            <div className="hidden print:flex justify-between mt-6 border-t pt-4 text-sm text-gray-500">
                <span>Міні-супермаркет «ZLAGODA» — Конфіденційний документ</span>
                <span className="font-bold">Всього товарів у списку: {filtered.length}</span>
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })}
                   title={modal.mode === 'add' ? 'Додати товар' : 'Редагувати товар'}
                   onSubmit={handleSubmit} loading={saving}>

                {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>ID Товару *</label>
                            <input
                                type="number"
                                value={form.id_product}
                                onChange={(e) => setForm({ ...form, id_product: e.target.value })}
                                disabled={modal.mode === 'edit'}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Категорія *</label>
                            <select
                                value={form.category_number}
                                onChange={(e) => setForm({ ...form, category_number: e.target.value })}
                                className={inputCls}
                            >
                                <option value="" disabled>Оберіть категорію...</option>
                                {categories.map(c => (
                                    <option key={c.category_number} value={c.category_number}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Назва товару *</label>
                        <input
                            type="text"
                            value={form.product_name}
                            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                            className={inputCls}
                            placeholder="Введіть назву"
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Виробник *</label>
                        <input
                            type="text"
                            value={form.manufacturer}
                            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                            className={inputCls}
                            placeholder="Назва компанії-виробника"
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Характеристики *</label>
                        <textarea
                            value={form.characteristics}
                            onChange={(e) => setForm({ ...form, characteristics: e.target.value })}
                            className={`${inputCls} resize-none h-24`}
                            placeholder="Вага, об'єм, склад тощо..."
                        />
                    </div>
                </div>
            </Modal>

            <div className="mt-8 print:hidden border border-gray-200 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-1">
                    📊 Статистика продажів товару
                </h2>
                <p className="text-xs text-gray-400 mb-4">Оберіть товар зі списку</p>
                <div className="flex gap-3 mb-4">
                    <select
                        value={analyticsProductId}
                        onChange={(e) => { setAnalyticsProductId(e.target.value); setProductStats(prev => ({...prev, loaded: false, error: ''})); }}
                        className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                    >
                        <option value="" disabled>Оберіть товар...</option>
                        {data.map(p => (
                            <option key={p.id_product} value={p.id_product}>
                                {p.product_name} (ID: {p.id_product})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleLoadProductStats}
                        disabled={productStats.loading}
                        className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                        {productStats.loading ? "Завантаження..." : "Показати"}
                    </button>
                </div>

                {productStats.error && (
                    <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">
                        {productStats.error}
                    </div>
                )}

                {!productStats.loading && productStats.loaded && productStats.data.length > 0 && (
                    <table className="w-full text-sm text-left border border-gray-200 rounded mt-2">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
                        <tr>
                            <th className="p-3">Штрих-код (UPC)</th>
                            <th className="p-3 text-center">Акційний</th>
                            <th className="p-3 text-center">К-сть чеків</th>
                            <th className="p-3 text-center">Продано од.</th>
                            <th className="p-3 text-right">Виторг</th>
                        </tr>
                        </thead>
                        <tbody>
                        {productStats.data.map(r => (
                            <tr key={r.upc} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 font-mono text-xs text-gray-600">{r.upc}</td>
                                <td className="p-3 text-center">
                                    {r.promotional_product ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-xs">Так</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded font-bold text-xs">Ні</span>
                                    )}
                                </td>
                                <td className="p-3 text-center font-medium">{r.receipt_count}</td>
                                <td className="p-3 text-center font-medium">{r.items_sold} шт</td>
                                <td className="p-3 text-right font-bold text-green-700">{Number(r.total_revenue).toFixed(2)} грн</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {!productStats.loading && productStats.loaded && productStats.data.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">Цей товар ще жодного разу не продавався.</p>
                )}
            </div>

            <PrintPreviewModal
                isOpen={printOpen}
                onClose={() => setPrintOpen(false)}
                title="Довідник товарів"
                subtitle={categoryFilter !== 'all' ? `Фільтр: ${categories.find(c => c.category_number === Number(categoryFilter))?.category_name || ''}` : undefined}
                columns={columns}
                data={filtered}
                renderCell={(col, row) => {
                    if (col.key === 'category_number') {
                        return categories.find(c => c.category_number === row[col.key])?.category_name || row[col.key];
                    }
                    return row[col.key];
                }}
            />
        </div>
    );
}