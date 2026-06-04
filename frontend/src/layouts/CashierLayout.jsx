import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CashierLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-blue-800 text-white flex flex-col shadow-lg">
                <div className="p-4">
                    <h2 className="text-xl font-bold mb-8 text-center">ZLAGODA Cashier</h2>
                    <nav className="space-y-2">
                        <div className="p-3 bg-blue-700 rounded cursor-pointer font-medium">🧾 Новий чек</div>
                        <div className="p-3 hover:bg-blue-700 rounded cursor-pointer">🔍 Пошук товарів</div>
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

            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}