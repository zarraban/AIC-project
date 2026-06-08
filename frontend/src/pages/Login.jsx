import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from "../services/api.js";

export default function Login() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();

        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', id);
        params.append('password', password);

        try {
            const response = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            console.log('Успіх!', response.data);

            // Ось тут ми дістаємо роль з відповіді сервера
            // ВАЖЛИВО: Перевір у консолі, чи точно поле називається 'role'.
            // Якщо його там немає, можливо, воно всередині іншого об'єкта.
            const userRole = response.data.role;

            login(response.data);

            // Перевіряємо роль. Враховуємо, що може бути 'Manager' або 'manager'
            if (userRole && userRole.toLowerCase() === 'manager') {
                navigate('/manager/employees');
            } else {
                navigate('/cashier/new-receipt');
            }
        } catch (err) {
            console.error('Помилка логіну:', err.response?.data || err.message);
            alert('Невірний логін або пароль!');
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