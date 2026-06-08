import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { getCategories } from '../../services/categoryService'; // Потрібно для списку категорій

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

    const filtered = data
        .filter(p => p.product_name.toLowerCase().includes(search.toLowerCase())) // Пошук за назвою
        .filter(p => categoryFilter === 'all' || p.category_number === Number(categoryFilter)) // Пошук за категорією
        .sort((a, b) => a.product_name.localeCompare(b.product_name, 'uk')); // Сортування за абеткою

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
                    <button onClick={() => window.print()}
                            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        🖨 Друк
                    </button>
                    <button onClick={openAdd}
                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                        + Додати товар
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-4 print:hidden">
                <input
                    type="text"
                    placeholder="Пошук за назвою..."
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
                <h2 className="text-lg">Звіт: Товари довідника (за абеткою)</h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('uk-UA')}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

            <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                Всього товарів у списку: {filtered.length}
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
        </div>
    );
}