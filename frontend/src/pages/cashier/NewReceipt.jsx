import React, { useState, useEffect } from 'react';
import { getStoreProducts } from '../../services/productStoreService';
import { getProducts } from '../../services/productInfoService';
import { getCustomerCards } from '../../services/customerCardService';
import { createReceipt } from '../../services/receiptService';

const inputCls = "w-full px-4 py-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-600";
const btnCls = "px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400";

export default function NewReceipt() {
    const [storeProducts, setStoreProducts] = useState([]);
    const [baseProducts, setBaseProducts] = useState([]);
    const [customerCards, setCustomerCards] = useState([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState([]);
    const [currentUpc, setCurrentUpc] = useState('');
    const [currentQty, setCurrentQty] = useState(1);

    const [cardNumberInput, setCardNumberInput] = useState('');
    const [appliedCard, setAppliedCard] = useState(null);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [storeRes, baseRes, cardsRes] = await Promise.all([
                    getStoreProducts(),
                    getProducts(),
                    getCustomerCards()
                ]);
                setStoreProducts(storeRes.data);
                setBaseProducts(baseRes.data);
                setCustomerCards(cardsRes.data);
            } catch (err) {
                setError('Не вдалося завантажити базу товарів або клієнтів');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleAddToCart = (e) => {
        e?.preventDefault();
        setError('');
        setSuccessMsg('');

        const upc = currentUpc.trim();
        if (!upc) return;

        const storeProd = storeProducts.find(p => p.upc === upc);
        if (!storeProd) {
            setError(`Товар з UPC ${upc} не знайдено в магазині`);
            return;
        }

        const qtyToAdd = parseInt(currentQty, 10);
        if (qtyToAdd <= 0) {
            setError('Кількість має бути більшою за 0');
            return;
        }

        const existingItem = cart.find(item => item.upc === upc);
        const totalRequestedQty = existingItem ? existingItem.quantity + qtyToAdd : qtyToAdd;

        if (totalRequestedQty > storeProd.products_number) {
            setError(`Недостатньо товару на складі. Доступно: ${storeProd.products_number} шт.`);
            return;
        }

        const baseProd = baseProducts.find(bp => bp.id_product === storeProd.id_product);
        const productName = baseProd ? baseProd.product_name : 'Невідомий товар';

        if (existingItem) {
            setCart(cart.map(item =>
                item.upc === upc ? { ...item, quantity: totalRequestedQty } : item
            ));
        } else {
            setCart([...cart, {
                upc: storeProd.upc,
                product_name: productName,
                selling_price: Number(storeProd.selling_price),
                quantity: qtyToAdd,
                promotional_product: storeProd.promotional_product
            }]);
        }

        setCurrentUpc('');
        setCurrentQty(1);
    };

    const handleRemoveFromCart = (upc) => {
        setCart(cart.filter(item => item.upc !== upc));
    };

    const handleApplyCard = () => {
        setError('');
        const card = customerCards.find(c => c.card_number === cardNumberInput.trim());
        if (card) {
            setAppliedCard(card);
            setSuccessMsg(`Застосовано карту клієнта: ${card.cust_surname} ${card.cust_name} (${card.percent}% знижки)`);
        } else {
            setError('Карту клієнта не знайдено');
            setAppliedCard(null);
        }
    };

    const handleSubmitReceipt = async () => {
        if (cart.length === 0) {
            setError('Чек порожній! Додайте хоча б один товар.');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const generatedReceiptNumber = 'R' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');

            const payload = {
                receipt_number: generatedReceiptNumber,
                card_number: appliedCard ? appliedCard.card_number : null,
                items: cart.map(item => ({
                    upc: item.upc,
                    product_number: item.quantity
                }))
            };

            const res = await createReceipt(payload);

            setSuccessMsg(`Чек №${res.data.receipt_number || generatedReceiptNumber} успішно пробито!`);

            setCart([]);
            setAppliedCard(null);
            setCardNumberInput('');

            const storeRes = await getStoreProducts();
            setStoreProducts(storeRes.data);

        } catch (err) {
            const errorData = err.response?.data?.detail;
            if (Array.isArray(errorData)) {
                setError(`Помилка даних: ${errorData[0].loc[1]} ${errorData[0].msg}`);
            } else {
                setError(errorData || 'Помилка при створенні чека');
            }
        } finally {
            setProcessing(false);
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const discountPercent = appliedCard ? appliedCard.percent : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const totalToPay = subtotal - discountAmount;
    const vatPreview = totalToPay * 0.2;

    if (loading) return <div className="p-8 text-center text-gray-500">Завантаження касового апарату...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-blue-900 mb-4">🛒 Додати товар</h2>
                    <form onSubmit={handleAddToCart} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Штрих-код (UPC)</label>
                            <input
                                type="text"
                                autoFocus
                                value={currentUpc}
                                onChange={(e) => setCurrentUpc(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Кількість</label>
                            <input
                                type="number"
                                min="1"
                                value={currentQty}
                                onChange={(e) => setCurrentQty(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <button type="submit" className={`${btnCls} w-full mt-2 h-[50px] text-lg`}>
                            Додати в чек (Enter)
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-blue-900 mb-4">💳 Карта клієнта</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={cardNumberInput}
                            onChange={(e) => setCardNumberInput(e.target.value)}
                            className={`${inputCls} flex-1`}
                        />
                        <button onClick={handleApplyCard} className="px-4 bg-gray-800 text-white font-bold rounded-md hover:bg-gray-900">
                            Ок
                        </button>
                    </div>
                    {appliedCard && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                            <span className="font-bold">Клієнт:</span> {appliedCard.cust_surname} {appliedCard.cust_name} <br/>
                            <span className="font-bold text-lg">Знижка: {appliedCard.percent}%</span>
                        </div>
                    )}
                </div>

                {error && <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-700 font-medium">{error}</div>}
                {successMsg && <div className="p-4 bg-green-50 border-l-4 border-green-600 text-green-700 font-medium">{successMsg}</div>}
            </div>

            <div className="w-full lg:w-2/3 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-700 uppercase">UPC</th>
                            <th className="p-4 text-xs font-bold text-gray-700 uppercase">Назва</th>
                            <th className="p-4 text-xs font-bold text-gray-700 uppercase text-center">К-сть</th>
                            <th className="p-4 text-xs font-bold text-gray-700 uppercase text-right">Ціна</th>
                            <th className="p-4 text-xs font-bold text-gray-700 uppercase text-right">Сума</th>
                            <th className="p-4"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {cart.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-gray-400 text-lg">Чек порожній</td>
                            </tr>
                        ) : (
                            cart.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 text-sm font-mono text-gray-500">{item.upc}</td>
                                    <td className="p-4 text-sm font-bold text-gray-800">
                                        {item.product_name}
                                        {item.promotional_product && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Акція</span>}
                                    </td>
                                    <td className="p-4 text-sm text-center font-bold">{item.quantity}</td>
                                    <td className="p-4 text-sm text-right">{item.selling_price.toFixed(2)}</td>
                                    <td className="p-4 text-sm text-right font-bold text-blue-800">{(item.selling_price * item.quantity).toFixed(2)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRemoveFromCart(item.upc)} className="text-red-500 hover:text-red-700 font-bold px-2 text-xl">×</button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-800 text-white p-4">
                    <div className="flex justify-between items-center mb-1 text-gray-300">
                        <span>Сума по товарах:</span>
                        <span className="text-lg">{subtotal.toFixed(2)} грн</span>
                    </div>
                    {appliedCard && (
                        <div className="flex justify-between items-center mb-1 text-green-400">
                            <span>Знижка по карті ({appliedCard.percent}%):</span>
                            <span className="text-lg">- {discountAmount.toFixed(2)} грн</span>
                        </div>
                    )}
                    <div className="border-t border-gray-600 my-3"></div>
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-gray-400 text-sm">ПДВgit : {vatPreview.toFixed(2)} грн</p>
                            <h3 className="text-xl font-bold mt-1">До сплати:</h3>
                        </div>
                        <div className="text-4xl font-black text-green-400">
                            {totalToPay.toFixed(2)} <span className="text-xl font-bold text-gray-300">грн</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmitReceipt}
                        disabled={cart.length === 0 || processing}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white text-xl font-bold py-3 rounded-lg shadow transition-colors"
                    >
                        {processing ? 'Обробка...' : 'ДРУКУВАТИ ЧЕК'}
                    </button>
                </div>
            </div>
        </div>
    );
}