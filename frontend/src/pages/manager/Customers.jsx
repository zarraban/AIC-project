import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { getCustomerCards, createCustomerCard, updateCustomerCard, deleteCustomerCard } from '../../services/customerCardService';

const EMPTY = {
    card_number: '',
    cust_surname: '',
    cust_name: '',
    cust_patronymic: '',
    phone_number: '',
    city: '',
    street: '',
    zip_code: '',
    percent: 0
};

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400";
const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

export default function Customers() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [percentFilter, setPercentFilter] = useState('all');

    const [modal, setModal] = useState({ open: false, mode: 'add', row: null });
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const res = await getCustomerCards();
                setData(res.data);
            } catch (err) {
                setError('Помилка завантаження даних клієнтів');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getCustomerCards();
            setData(res.data);
        } catch {
            setError('Помилка оновлення даних');
        }
    };

    const openAdd = () => { setForm(EMPTY); setError(''); setModal({ open: true, mode: 'add', row: null }); };
    const openEdit = (row) => {
        setForm({
            ...row,
            cust_patronymic: row.cust_patronymic || '',
            city: row.city || '',
            street: row.street || '',
            zip_code: row.zip_code || ''
        });
        setError('');
        setModal({ open: true, mode: 'edit', row });
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Видалити карту клієнта ${row.cust_surname} ${row.cust_name}?`)) return;
        setError('');
        try {
            await deleteCustomerCard(row.card_number);
            loadData();
        } catch (e) {
            setError(e.response?.data?.detail || 'Не вдалося видалити карту. Можливо, вона використовується в чеках.');
        }
    };

    const handleSubmit = async () => {
        if (!form.card_number || !form.cust_surname || !form.cust_name || !form.phone_number || form.percent === '') {
            setError('Заповніть усі обов\'язкові поля (*)');
            return;
        }

        if (parseInt(form.percent, 10) < 0) {
            setError('Помилка: Відсоток знижки не може бути від\'ємним');
            return;
        }

        const phoneRegex = /^\+380\d{9}$/;
        if (!phoneRegex.test(form.phone_number)) {
            setError('Введіть номер телефону в форматі +380XXXXXXXXX');
            return;
        }

        setSaving(true); setError('');
        try {
            const payload = {
                ...form,
                percent: parseInt(form.percent, 10),
                cust_patronymic: form.cust_patronymic.trim() === '' ? null : form.cust_patronymic,
                city: form.city.trim() === '' ? null : form.city,
                street: form.street.trim() === '' ? null : form.street,
                zip_code: form.zip_code.trim() === '' ? null : form.zip_code
            };

            modal.mode === 'add'
                ? await createCustomerCard(payload)
                : await updateCustomerCard(modal.row.card_number, payload);

            setModal({ open: false, mode: 'add', row: null });
            loadData();
        } catch (e) {
            setError(e.response?.data?.detail || 'Помилка збереження');
        } finally {
            setSaving(false);
        }
    };

    const uniquePercents = [...new Set(data.map(item => item.percent))].sort((a, b) => a - b);

    const filtered = data
        .filter(c => c.cust_surname.toLowerCase().includes(search.toLowerCase()))
        .filter(c => percentFilter === 'all' || c.percent === Number(percentFilter))
        .sort((a, b) => a.cust_surname.localeCompare(b.cust_surname, 'uk'));

    const columns = [
        { key: 'card_number', label: 'Номер карти' },
        { key: 'cust_surname', label: 'Прізвище' },
        { key: 'cust_name', label: 'Ім\'я' },
        { key: 'phone_number', label: 'Телефон' },
        { key: 'percent', label: 'Знижка', render: (val) => <span className="font-bold text-blue-700">{val}%</span> },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 print:hidden">
                <h1 className="text-2xl font-bold text-gray-900">Постійні клієнти
                </h1>
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

            <div className="flex gap-4 mb-4 print:hidden">
                <input
                    type="text"
                    placeholder="Пошук за прізвищем..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                />

                <select
                    value={percentFilter}
                    onChange={(e) => setPercentFilter(e.target.value)}
                    className="max-w-xs px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                    <option value="all">Усі знижки</option>
                    {uniquePercents.map(p => (
                        <option key={p} value={p}>Знижка {p}%</option>
                    ))}
                </select>
            </div>

            {error && !modal.open && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>
            )}

            <div className="hidden print:block mb-6 text-center border-b pb-4">
                <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                <h2 className="text-lg">
                    Звіт: Постійні клієнти
                    {percentFilter !== 'all' ? ` (Знижка ${percentFilter}%)` : ' (Усі знижки)'}
                </h2>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('uk-UA')}</p>
            </div>

            <DataTable columns={columns} data={filtered} loading={loading} onEdit={openEdit} onDelete={handleDelete} />

            <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                Кількість клієнтів у списку: {filtered.length}
            </div>

            <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })}
                   title={modal.mode === 'add' ? 'Додати карту клієнта' : 'Редагувати карту'}
                   onSubmit={handleSubmit} loading={saving}>

                {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Номер карти *</label>
                            <input
                                type="text"
                                value={form.card_number}
                                onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                                disabled={modal.mode === 'edit'}
                                className={inputCls}
                                maxLength={13}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Відсоток знижки *</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.percent}
                                onChange={(e) => setForm({ ...form, percent: e.target.value })}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Прізвище *</label>
                            <input type="text" value={form.cust_surname} onChange={(e) => setForm({ ...form, cust_surname: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Ім'я *</label>
                            <input type="text" value={form.cust_name} onChange={(e) => setForm({ ...form, cust_name: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>По батькові</label>
                            <input type="text" value={form.cust_patronymic} onChange={(e) => setForm({ ...form, cust_patronymic: e.target.value })} className={inputCls} />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Телефон *</label>
                        <input
                            type="text"
                            value={form.phone_number}
                            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                            className={inputCls}
                            placeholder="+380XXXXXXXXX"
                            maxLength={13}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Місто</label>
                            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Вулиця</label>
                            <input type="text" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Індекс</label>
                            <input type="text" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} className={inputCls} maxLength={9} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}