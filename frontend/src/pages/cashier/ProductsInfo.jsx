import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { getProducts } from '../../services/productInfoService';
import { getCategories } from '../../services/categoryService';
import PrintPreviewModal from '../../components/PrintPreviewModal';

export default function ProductsInfoCsh() {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [printOpen, setPrintOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
                setData(prodRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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
        { key: 'characteristics', label: 'Характеристики' }
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Довідник товарів</h1>
                <button onClick={() => setPrintOpen(true)}
                        className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    🖨 Друк
                </button>
            </div>

            <div className="flex gap-4 mb-4 print:hidden">
                <input
                    type="text"
                    placeholder="Пошук за назвою..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                    <option value="all">Всі категорії</option>
                    {categories.map(c => (
                        <option key={c.category_number} value={c.category_number}>
                            {c.category_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">Довідник усіх товарів мережі</h2>
                <p className="text-sm text-gray-500">Дата формування: {new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} />

            <div className="hidden print:flex justify-between mt-6 border-t pt-4 text-sm text-gray-500">
                <span>Міні-супермаркет «ZLAGODA» — Конфіденційний документ</span>
                <span className="font-bold">Всього позицій у довіднику: {filtered.length}</span>
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