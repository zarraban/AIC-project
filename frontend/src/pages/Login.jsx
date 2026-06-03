import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleMockLogin = (selectedRole) => {
        const mockData = {
            token: 'fake-jwt-token-12345',
            role: selectedRole,
            name: selectedRole === 'manager' ? 'Іван Менеджер' : 'Олена Касир',
            id: selectedRole === 'manager' ? 'M-01' : 'C-01'
        };

        login(mockData);

        if (selectedRole === 'manager') {
            navigate('/manager/employees');
        } else {
            navigate('/cashier/new-receipt');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
                    Міні-супермаркет ZLAGODA
                </h1>
                <p className="text-gray-600 text-center mb-6">Вхід у систему (test)</p>

                <div className="space-y-4">
                    <button
                        onClick={() => handleMockLogin('manager')}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
                    >
                        Увійти як Менеджер
                    </button>

                    <button
                        onClick={() => handleMockLogin('cashier')}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
                    >
                        Увійти як Касир
                    </button>
                </div>
            </div>
        </div>
    );
}