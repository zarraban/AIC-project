import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ManagerLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        `block p-3 rounded cursor-pointer transition-colors ${
            isActive ? 'bg-green-700 font-medium' : 'hover:bg-green-700'
        }`;

    return (
        <div className="flex h-screen print:bg-white bg-gray-50 print:block">
            <aside className="w-64 bg-green-800 text-white flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.50)] print:hidden">
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-8 mt-4 text-center">ZLAGODA Manager</h2>
                    <nav className="space-y-2">
                        <NavLink to="/manager/employees" className={linkClass}>
                            👥 Працівники
                        </NavLink>
                        <NavLink to="/manager/customers" className={linkClass}>
                            👨🏻‍💼 Постійні клієнти
                        </NavLink>
                        <NavLink to="/manager/products-categories" className={linkClass}>
                            🗂️ Категорії товарів
                        </NavLink>
                        <NavLink to="/manager/products-info" className={linkClass}>
                            📚 Довідник товарів
                        </NavLink>
                        <NavLink to="/manager/products-store" className={linkClass}>
                            🛍️ Товари в магазині
                        </NavLink>
                        <NavLink to="/manager/receipts" className={linkClass}>
                            🧾 Чеки
                        </NavLink>
                        <NavLink to="/manager/reports" className={linkClass}>
                            📊 Аналітичні звіти
                        </NavLink>

                    </nav>
                </div>

                <div className="mt-auto p-4 relative">
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-green-300/50 to-transparent "></div>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left p-3 hover:bg-green-700 rounded transition text-white hover:text-red-400 font-semibold mt-1"
                    >
                        ❌ Вийти
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible print:block print:w-full">
                <Outlet />
            </main>
        </div>
    );
}