import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ManagerLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-green-800 text-white p-4 shadow-lg">
                <h2 className="text-xl font-bold mb-8 text-center">ZLAGODA Manager</h2>
                <nav className="space-y-2">
                    <div className="p-3 bg-green-700 rounded cursor-pointer font-medium">👥 Працівники</div>
                    <div className="p-3 hover:bg-green-700 rounded cursor-pointer">📦 Категорії</div>
                    <div className="p-3 hover:bg-green-700 rounded cursor-pointer">🛒 Товари</div>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
}