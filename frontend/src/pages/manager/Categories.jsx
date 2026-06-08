import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';

const EMPTY = { category_number: '', category_name: '' };

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400";
const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

function Categories() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState({ open: false, mode: 'add', row: null });
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try { setData((await getCategories()).data); }
        catch { setError('Помилка завантаження'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => { setForm(EMPTY); setError(''); setModal({ open: true, mode: 'add', row: null }); };
    const openEdit = (row) => { setForm(row); setError(''); setModal({ open: true, mode: 'edit', row }); };

    const handleDelete = async (row) => {
        if (!window.confirm(`Видалити категорію "${row.category_name}"?`)) return;
        try { await deleteCategory(row.category_number); load(); }
        catch { setError('Не вдалося видалити'); }
    };

    const handleSubmit = async () => {
        if (!form.category_number || !form.category_name) { setError('Заповніть усі поля'); return; }
        setSaving(true); setError('');
        try {
            modal.mode === 'add'
                ? await createCategory(form)
                : await updateCategory(modal.row.category_number, { category_name: form.category_name });
            setModal({ open: false, mode: 'add', row: null });
            load();
        } catch (e) { setError(e.response?.data?.detail || 'Помилка збереження'); }
        finally { setSaving(false); }
    };

    const filtered = data.filter(c =>
        c.category_name.toLowerCase().includes(search.toLowerCase())
    );



    const columns = [
        { key: 'category_number', label: '№' },
        { key: 'category_name', label: 'Назва категорії' },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Категорії</h1>
                <div className="flex gap-3">
                    <button onClick={() => window.print()}
                            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        🖨 Друк
                    </button>
                    <button onClick={openAdd}
                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                        + Додати
                    </button>
                </div>
            </div>

            <div className="mb-4 print:hidden">
                <input type="text" placeholder="Пошук за назвою..."
                       value={search} onChange={(e) => setSearch(e.target.value)}
                       className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                />
            </div>

            {error && !modal.open && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>
            )}

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">Звіт: Категорії товарів</h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('uk-UA')}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

            <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                Всього записів: {filtered.length}
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })}
                   title={modal.mode === 'add' ? 'Додати категорію' : 'Редагувати категорію'}
                   onSubmit={handleSubmit} loading={saving}>

                {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className={labelCls}>№ Категорії</label>
                        <input type="number" value={form.category_number}
                               onChange={(e) => setForm({ ...form, category_number: e.target.value })}
                               disabled={modal.mode === 'edit'} className={inputCls} placeholder="Введіть номер" />
                    </div>
                    <div>
                        <label className={labelCls}>Назва</label>
                        <input type="text" value={form.category_name}
                               onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                               className={inputCls} placeholder="Введіть назву" />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Categories;