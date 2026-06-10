import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CashierLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        `block p-3 rounded cursor-pointer transition-colors ${
            isActive ? 'bg-blue-700 font-medium' : 'hover:bg-blue-700'
        }`;

    return (
        <div className="flex min-h-screen bg-gray-50 print:bg-white print:block">
            <aside className="w-64 bg-blue-800 text-white flex flex-col shadow-lg print:hidden">
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-8 text-center">ZLAGODA Cashier</h2>
                    <nav className="space-y-2">
                        <NavLink to="/cashier/new-receipt" className={linkClass}>
                            🧾 Новий чек
                        </NavLink>
                        <NavLink to="/cashier/products" className={linkClass}>
                            🔍 Пошук товарів
                        </NavLink>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-blue-500">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left p-3 hover:bg-blue-700 rounded transition text-white hover:text-red-500 font-semibold"
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