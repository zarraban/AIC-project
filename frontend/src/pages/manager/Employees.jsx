    import React, { useState, useEffect } from 'react';
    import DataTable from '../../components/DataTable';
    import Modal from '../../components/Modal';
    import { getEmployees, getCashiers, createEmployee, updateEmployee, deleteEmployee, changePassword } from '../../services/employeeService';

    const EMPTY = {
        id_employee: '', empl_surname: '', empl_name: '', empl_patronymic: '',
        empl_role: 'cashier', salary: '', date_of_birth: '', date_of_start: '',
        phone_number: '', city: '', street: '', zip_code: '', password: '', login: ''
    };

    const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400";
    const labelCls = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5";

    function Employees() {
        const [data, setData] = useState([]);
        const [loading, setLoading] = useState(true);
        const [filter, setFilter] = useState('all'); // 'all' | 'cashier'
        const [search, setSearch] = useState('');
        const [modal, setModal] = useState({ open: false, mode: 'add', row: null });
        const [pwdModal, setPwdModal] = useState({ open: false, id: null });
        const [form, setForm] = useState(EMPTY);
        const [newPassword, setNewPassword] = useState('');
        const [saving, setSaving] = useState(false);
        const [error, setError] = useState('');

        const load = async () => {
            setLoading(true);
            try {
                const res = filter === 'cashier' ? await getCashiers() : await getEmployees();
                setData(res.data);
            } catch { setError('Помилка завантаження'); }
            finally { setLoading(false); }
        };

        useEffect(() => { load(); }, [filter]);

        const openAdd = () => { setForm(EMPTY); setError(''); setModal({ open: true, mode: 'add', row: null }); };
        const openEdit = (row) => {
            setForm({ ...row, password: '' });
            setError('');
            setModal({ open: true, mode: 'edit', row });
        };

        const handleDelete = async (row) => {
            if (!window.confirm(`Видалити працівника ${row.empl_surname} ${row.empl_name}?`)) return;

            setError('');

            try {
                await deleteEmployee(row.id_employee);
                load();
            } catch (err) {
                const message = err.response?.data?.detail || 'Не вдалося видалити працівника. Можливо, він має зв’язані записи в базі.';
                setError(message);
            }
        };

        const handleSubmit = async () => {
            const required = ['id_employee', 'empl_surname', 'empl_name', 'empl_role', 'salary', 'date_of_birth', 'date_of_start', 'phone_number', 'city', 'street', 'zip_code'];
            if (required.some(k => !form[k])) { setError('Заповніть усі обов\'язкові поля'); return; }
            if (modal.mode === 'add' && !form.password) { setError('Введіть пароль для нового працівника'); return; }

            const birthDate = new Date(form.date_of_birth);
            const startDate = new Date(form.date_of_start);

            if (startDate <= birthDate) {
                setError('Дата початку роботи має бути пізніше дати народження!');
                return;
            }

            const eighteenYearsLater = new Date(birthDate);
            eighteenYearsLater.setFullYear(eighteenYearsLater.getFullYear() + 18);

            if (startDate < eighteenYearsLater) {
                setError('Працівник має бути старше 18 років на момент початку роботи!');
                return;
            }

            const phoneRegex = /^\+380\d{9}$/;

            if (!phoneRegex.test(form.phone_number)) {
                setError('Введіть номер в форматі +380XXXXXXXXX (13 символів)');
                return;
            }

            setSaving(true); setError('');
            try {
                const payload = { ...form, salary: parseFloat(form.salary) };
                modal.mode === 'add'
                    ? await createEmployee(payload)
                    : await updateEmployee(modal.row.id_employee, payload);
                setModal({ open: false, mode: 'add', row: null });
                load();
            } catch (e) { setError(e.response?.data?.detail || 'Помилка збереження'); }
            finally { setSaving(false); }
        };

        const handlePasswordChange = async () => {
            if (!newPassword) { setError('Введіть новий пароль'); return; }
            setSaving(true);
            try {
                await changePassword(pwdModal.id, { new_password: newPassword });
                setPwdModal({ open: false, id: null });
                setNewPassword('');
            } catch (e) { setError(e.response?.data?.detail || 'Помилка зміни пароля'); }
            finally { setSaving(false); }
        };

        const filtered = data.filter(e =>
            `${e.empl_surname} ${e.empl_name}`.toLowerCase().includes(search.toLowerCase())
        );

        const columns = [
            { key: 'id_employee', label: 'ID' },
            { key: 'empl_surname', label: 'Прізвище' },
            { key: 'empl_name', label: 'Ім\'я' },
            { key: 'empl_patronymic', label: 'По батькові' },
            { key: 'empl_role', label: 'Посада', render: (v) => v === 'manager' ? 'Менеджер' : 'Касир' },
            { key: 'salary', label: 'Зарплата', render: (v) => `${Number(v).toFixed(2)} грн` },
            { key: 'phone_number', label: 'Телефон' },
        ];

        const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        const today1 = new Date().toISOString().split('T')[0];

        return (
            <div>
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <h1 className="text-2xl font-bold text-gray-900">Працівники</h1>
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

                <div className="flex gap-3 mb-4 print:hidden flex-wrap">
                    <div className="flex rounded-md overflow-hidden border border-gray-300">
                        {[['all', 'Всі'], ['cashier', 'Лише касири']].map(([val, label]) => (
                            <button key={val} onClick={() => setFilter(val)}
                                    className={`px-4 py-2 text-sm font-bold transition-colors ${filter === val ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <input type="text" placeholder="Пошук за прізвищем..."
                           value={search} onChange={(e) => setSearch(e.target.value)}
                           className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                </div>

                {error && !modal.open && !pwdModal.open && (
                    <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>
                )}

                <div className="hidden print:block mb-6 text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">Міні-супермаркет ZLAGODA</h1>
                    <h2 className="text-lg">Звіт: {filter === 'cashier' ? 'Касири' : 'Всі працівники'}</h2>
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString('uk-UA')}</p>
                </div>

                <DataTable columns={columns} data={filtered} loading={loading}
                           onEdit={openEdit} onDelete={handleDelete} />

                <div className="hidden print:block mt-6 border-t pt-4 text-sm text-gray-500 text-center">
                    Всього записів: {filtered.length}
                </div>

                <Modal isOpen={modal.open} onClose={() => setModal({ ...modal, open: false })}
                       title={modal.mode === 'add' ? 'Додати працівника' : 'Редагувати працівника'}
                       onSubmit={handleSubmit} loading={saving}>

                    {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>ID працівника *</label>
                                <input
                                    className={inputCls}
                                    value={form.id_employee}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm({ ...form, id_employee: val, login: val });
                                    }}
                                    disabled={modal.mode === 'edit'}
                                    placeholder="XXX-001"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Посада *</label>
                                <select className={inputCls} {...f('empl_role')}>
                                    <option value="cashier">Касир</option>
                                    <option value="manager">Менеджер</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Прізвище *</label>
                                <input className={inputCls} {...f('empl_surname')} />
                            </div>
                            <div>
                                <label className={labelCls}>Ім'я *</label>
                                <input className={inputCls} {...f('empl_name')} />
                            </div>
                            <div>
                                <label className={labelCls}>По батькові</label>
                                <input className={inputCls} {...f('empl_patronymic')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Зарплата *</label>
                                <input type="number" step="0.01" min="0" className={inputCls} {...f('salary')} />
                            </div>
                            <div>
                                <label className={labelCls}>Телефон *</label>
                                <input className={inputCls} {...f('phone_number')} placeholder="+380XXXXXXXXX" maxLength={13} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Дата народження *</label>
                                <input
                                    type="date"
                                    className={inputCls}
                                    max={eighteenYearsAgo}
                                    {...f('date_of_birth')}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Дата початку роботи *</label>
                                <input type="date" className={inputCls} max={today1} {...f('date_of_start')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Місто *</label>
                                <input className={inputCls} {...f('city')} />
                            </div>
                            <div>
                                <label className={labelCls}>Вулиця *</label>
                                <input className={inputCls} {...f('street')} />
                            </div>
                            <div>
                                <label className={labelCls}>Індекс *</label>
                                <input className={inputCls} {...f('zip_code')} />
                            </div>
                        </div>

                        {modal.mode === 'add' && (
                            <div>
                                <label className={labelCls}>Пароль *</label>
                                <input type="password" className={inputCls} {...f('password')} />
                            </div>
                        )}

                        {modal.mode === 'edit' && (
                            <button type="button"
                                    onClick={() => { setPwdModal({ open: true, id: modal.row.id_employee }); setModal({ ...modal, open: false }); }}
                                    className="text-sm text-green-700 underline text-left hover:text-green-900">
                                Змінити пароль
                            </button>
                        )}
                    </div>
                </Modal>

                <Modal isOpen={pwdModal.open} onClose={() => setPwdModal({ open: false, id: null })}
                       title="Змінити пароль" onSubmit={handlePasswordChange} loading={saving} submitLabel="Змінити">
                    {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}
                    <div>
                        <label className={labelCls}>Новий пароль</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
                    </div>
                </Modal>
            </div>
        );
    }

    export default Employees;