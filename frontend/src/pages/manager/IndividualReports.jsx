import React, { useState } from 'react';
import api from '../../services/api';
import axios from 'axios';

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('vashchenko');
    const [error, setError] = useState('');

    const [vCard, setVCard] = useState('');
    const [vRes1, setVRes1] = useState(null);
    const [vRes2, setVRes2] = useState(null);
    const [vLoad1, setVLoad1] = useState(false);
    const [vLoad2, setVLoad2] = useState(false);

    const [t2Param, setT2Param] = useState('');
    const [t2Res1, setT2Res1] = useState(null);
    const [t2Res2, setT2Res2] = useState(null);
    const [t2Load1, setT2Load1] = useState(false);
    const [t2Load2, setT2Load2] = useState(false);

    const [t3Param, setT3Param] = useState('');
    const [t3Res1, setT3Res1] = useState(null);
    const [t3Res2, setT3Res2] = useState(null);
    const [t3Load1, setT3Load1] = useState(false);
    const [t3Load2, setT3Load2] = useState(false);

    const handleVashchenkoQ1 = async () => {
        if (!vCard) { setError('Введіть номер картки'); return; }
        setVLoad1(true); setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:8000/analytics/vashchenko/cashier-stats/${vCard}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setVRes1(res.data);
        } catch { setError('Помилка запиту 1'); } finally { setVLoad1(false); }
    };

    const handleVashchenkoQ2 = async () => {
        setVLoad2(true); setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:8000/analytics/vashchenko/promo-hunters`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setVRes2(res.data);
        } catch { setError('Помилка запиту 2'); } finally { setVLoad2(false); }
    };


    const handleT2Q1 = async () => {
        setTLoad1(true); setError('');
        try {
            const res = await api.get(`/analytics/teammate2/query1/${t2Param}`);
            setT2Res1(res.data);
        } catch { setError('Помилка'); } finally { setT2Load1(false); }
    };

    const handleT2Q2 = async () => {
        setT2Load2(true); setError('');
        try {
            const res = await api.get(`/analytics/teammate2/query2`);
            setT2Res2(res.data);
        } catch { setError('Помилка'); } finally { setT2Load2(false); }
    };

    const inputCls = "px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-600";
    const btnCls = "px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400";
    const cardCls = "bg-white p-6 rounded-lg shadow-sm border border-gray-200";

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Індивідуальні аналітичні звіти</h1>

            <div className="flex border-b border-gray-200 mb-6 gap-2">
                <button
                    onClick={() => { setActiveTab('vashchenko'); setError(''); }}
                    className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'vashchenko' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Студент: Ващенко М.
                </button>
                <button
                    onClick={() => { setActiveTab('teammate2'); setError(''); }}
                    className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'teammate2' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Студент: Смирнов В.
                </button>
                <button
                    onClick={() => { setActiveTab('teammate3'); setError(''); }}
                    className={`py-2 px-4 font-bold text-sm border-b-2 transition-colors ${activeTab === 'teammate3' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Студент Волік О.
                </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm">{error}</div>}


            {activeTab === 'vashchenko' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className={cardCls}>
                        <h2 className="text-base mb-4 font-bold text-green-800 mb-2">1. Кількість чеків та сума покупок, які оформив кожен касир для вказаного постійного клієнта</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Номер картки (напр. C000000000001)" value={vCard} onChange={(e) => setVCard(e.target.value)} className={`${inputCls} flex-1`} />
                            <button onClick={handleVashchenkoQ1} disabled={vLoad1} className={btnCls}>{vLoad1 ? '...' : 'Виконати'}</button>
                        </div>
                        {vRes1 && (
                            <table className="w-full text-sm text-left border border-gray-200 rounded">
                                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
                                <tr><th className="p-3">ID</th><th className="p-3">Касир</th><th className="p-3 text-center">Чеки</th><th className="p-3 text-right">Сума</th></tr>
                                </thead>
                                <tbody>
                                {vRes1.map(row => (
                                    <tr key={row.id_employee} className="border-b border-gray-100">
                                        <td className="p-3 font-mono">{row.id_employee}</td>
                                        <td className="p-3">{row.empl_surname} {row.empl_name[0]}.</td>
                                        <td className="p-3 text-center font-bold">{row.receipt_count}</td>
                                        <td className="p-3 text-right font-bold text-green-700">{Number(row.total_sum).toFixed(2)} грн</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className={cardCls}>
                        <h2 className="text-base font-bold mb-4 text-green-800 mb-2">2. Знаходить постійних клієнтів, які купували абсолютно всі акційні товари магазину</h2>
                        <button onClick={handleVashchenkoQ2} disabled={vLoad2} className={`${btnCls} mb-4`}>{vLoad2 ? 'Пошук...' : 'Виконати'}</button>
                        {vRes2 && (
                            <table className="w-full text-sm text-left border border-gray-200 rounded">
                                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600">
                                <tr><th className="p-3">Номер картки</th><th className="p-3">Клієнт</th></tr>
                                </thead>
                                <tbody>
                                {vRes2.map(row => (
                                    <tr key={row.card_number} className="border-b border-gray-100">
                                        <td className="p-3 font-mono">{row.card_number}</td>
                                        <td className="p-3 font-medium">{row.cust_surname} {row.cust_name}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}


            {activeTab === 'teammate2' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className={cardCls}>
                        <h2 className="text-base font-bold mb-4 text-green-800 mb-2">1. -</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Введіть параметр..." value={t2Param} onChange={(e) => setT2Param(e.target.value)} className={`${inputCls} flex-1`} />
                            <button onClick={handleT2Q1} className={btnCls}>Виконати</button>
                        </div>
                    </div>

                    <div className={cardCls}>
                        <h2 className="text-base font-bold mb-4 text-green-800 mb-2">2. -</h2>
                        <button onClick={handleT2Q2} className={`${btnCls} mb-4`}>Виконати</button>

                    </div>
                </div>
            )}

            {activeTab === 'teammate3' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className={cardCls}>
                        <h2 className="text-base font-bold mb-4 text-green-800 mb-2">1. -</h2>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="Введіть параметр..." value={t3Param} onChange={(e) => setT3Param(e.target.value)} className={`${inputCls} flex-1`} />
                            <button className={btnCls}>Виконати</button>
                        </div>
                    </div>

                    <div className={cardCls}>
                        <h2 className="text-base font-bold mb-4 text-green-800 mb-2">2. -</h2>
                        <button className={`${btnCls} mb-4`}>Виконати</button>
                    </div>
                </div>
            )}
        </div>
    );
}