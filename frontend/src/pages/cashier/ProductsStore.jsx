import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { getStoreProducts } from '../../services/productStoreService';
import { getProducts } from '../../services/productInfoService';
import { getCategories } from '../../services/categoryService';

export default function ProductsStoreCsh() {
    const [data, setData] = useState([]);
    const [baseProducts, setBaseProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [promoFilter, setPromoFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const loadData = async () => {
        setLoading(true);
        try {
            const [storeRes, baseRes, catRes] = await Promise.all([
                getStoreProducts(),
                getProducts(),
                getCategories()
            ]);
            setData(storeRes.data);
            setBaseProducts(baseRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = data
        .map(p => {
            const baseProd = baseProducts.find(bp => bp.id_product === p.id_product);
            return {
                ...p,
                product_name: baseProd?.product_name || `ID: ${p.id_product}`,
                characteristics: baseProd?.characteristics || 'Немає даних',
                category_number: baseProd?.category_number
            };
        })
        .filter(p => {
            const nameMatch = p.product_name.toLowerCase().includes(search.toLowerCase());
            const upcMatch = p.upc.toLowerCase().includes(search.toLowerCase());
            return nameMatch || upcMatch;
        })
        .filter(p => {
            if (promoFilter === 'promo') return p.promotional_product;
            if (promoFilter === 'regular') return !p.promotional_product;
            return true;
        })
        .filter(p => {
            if (categoryFilter === 'all') return true;
            return p.category_number === Number(categoryFilter);
        })
        .sort((a, b) => {
            if (sortBy === 'quantity') {
                return a.products_number - b.products_number;
            } else {
                return a.product_name.localeCompare(b.product_name, 'uk');
            }
        });

    const columns = [
        { key: 'upc', label: 'UPC (Штрих-код)' },
        { key: 'product_name', label: 'Назва товару' },
        { key: 'selling_price', label: 'Ціна', render: (val) => `${Number(val).toFixed(2)} грн` },
        { key: 'products_number', label: 'Кількість' },
        { key: 'promotional_product', label: 'Акція', render: (val) => val ? <span className="text-blue-600 font-bold">Так</span> : 'Ні' },
    ];

    if (search.trim() !== '') {
        columns.splice(2, 0, { key: 'characteristics', label: 'Характеристики' });
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Пошук товарів</h1>
                <button onClick={() => window.print()}
                        className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    🖨 Друк
                </button>
            </div>

            <div className="flex gap-4 mb-4 print:hidden">
                <input
                    type="text"
                    placeholder="Пошук за UPC або назвою"
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

                <select
                    value={promoFilter}
                    onChange={(e) => setPromoFilter(e.target.value)}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                    <option value="all">Всі товари</option>
                    <option value="regular">Звичайні</option>
                    <option value="promo">Акційні</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                    <option value="name">Сортувати за назвою</option>
                    <option value="quantity">Сортувати за кількістю</option>
                </select>
            </div>

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">Товари в магазині</h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('uk-UA')}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} />

            <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                Всього позицій: {filtered.length}
            </div>
        </div>
    );
}