import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = (e) => {
        e.preventDefault();

        if (id === 'M-01' && password === '123') {
            login({
                token: 'fake-jwt-manager',
                role: 'manager',
                name: 'Іван',
                id: 'M-01'
            });
            navigate('/manager/employees');
        } else if (id === 'C-01' && password === '123') {
            login({
                token: 'fake-jwt-cashier',
                role: 'cashier',
                name: 'Олена',
                id: 'C-01'
            });
            navigate('/cashier/new-receipt');
        } else {
            alert('Неправильний логін або пароль!');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
                    Міні-супермаркет ZLAGODA
                </h1>
                <p className="text-gray-600 text-center mb-6">Вхід у систему</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">ID Працівника</label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1 text-sm font-medium">Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition mt-2"
                    >
                        Увійти
                    </button>
                </form>
            </div>
        </div>
    );
}