import React from 'react';
import { Outlet } from 'react-router-dom';

export default function CashierLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-blue-800 text-white p-4 shadow-lg">
                <h2 className="text-xl font-bold mb-8 text-center">ZLAGODA Cashier</h2>
                <nav className="space-y-2">
                    <div className="p-3 bg-blue-700 rounded cursor-pointer font-medium">🧾 Новий чек</div>
                    <div className="p-3 hover:bg-blue-700 rounded cursor-pointer">🔍 Пошук товарів</div>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}