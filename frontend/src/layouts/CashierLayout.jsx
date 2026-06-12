import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

export default function CashierLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profileOpen, setProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const openProfile = async () => {
        setProfileOpen(true);
        if (!profileData) {
            setLoading(true);
            try {
                const res = await api.get(`/employees/me`);
                setProfileData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    const linkClass = ({ isActive }) =>
        `block p-3 rounded cursor-pointer transition-colors ${
            isActive ? 'bg-blue-700 font-medium' : 'hover:bg-blue-700'
        }`;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 print:bg-white print:block">
            <aside className="w-64 bg-blue-800 text-white flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.50)] print:hidden">
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-8 mt-4 text-center">ZLAGODA Cashier</h2>
                    <nav className="space-y-2">
                        <NavLink to="/cashier/new-receipt" className={linkClass}>
                            🧾 Новий чек
                        </NavLink>
                        <NavLink to="/cashier/customers" className={linkClass}>
                            👨🏻‍💼 Постійні клієнти
                        </NavLink>
                        <NavLink to="/cashier/products-info" className={linkClass}>
                            📚 Довідник товарів
                        </NavLink>
                        <NavLink to="/cashier/products-store" className={linkClass}>
                            🛍️ Товари в магазині
                        </NavLink>
                        <NavLink to="/cashier/my-receipts" className={linkClass}>
                            📑 Мої чеки
                        </NavLink>

                    </nav>
                </div>

                <div className="mt-auto p-4 relative space-y-2">
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent"></div>
                    <button
                        onClick={openProfile}
                        className="w-full text-left p-3 hover:bg-blue-700 rounded transition text-white font-medium mt-2"
                    >
                        🪪 Мій профіль
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left p-3 hover:bg-blue-700 rounded transition text-white hover:text-red-300 font-semibold"
                    >
                        ❌ Вийти
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible print:block print:w-full">
                <Outlet />
            </main>

            <Modal
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                title="Особиста картка працівника"
                hideSubmit={true}
            >
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Завантаження даних...</div>
                ) : profileData ? (
                    <div className="flex flex-col gap-4 text-sm text-gray-800">
                        <div className="flex justify-center mb-2">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl text-blue-600 font-black shadow-inner">
                                {profileData.empl_name?.[0]}{profileData.empl_surname?.[0]}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">ID працівника</span>
                                <span className="font-mono text-lg bg-gray-200 px-2 py-0.5 rounded">{profileData.id_employee}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Посада</span>
                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{profileData.empl_role}</span>
                            </div>

                            <div className="col-span-2">
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">ПІБ</span>
                                <span className="text-xl font-bold">{profileData.empl_surname} {profileData.empl_name} {profileData.empl_patronymic}</span>
                            </div>

                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Телефон</span>
                                <span className="font-medium text-gray-900">{profileData.phone_number}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Зарплата</span>
                                <span className="font-black text-green-700 text-lg">{Number(profileData.salary).toFixed(2)} грн</span>
                            </div>

                            <div className="col-span-2">
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Адреса проживання</span>
                                <span className="text-gray-700">{profileData.zip_code}, {profileData.city}, {profileData.street}</span>
                            </div>

                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата початку роботи</span>
                                <span className="text-gray-600">{new Date(profileData.date_of_start).toLocaleDateString('uk-UA')}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-red-500">Не вдалося завантажити дані профілю.</div>
                )}
            </Modal>
        </div>
    );
}