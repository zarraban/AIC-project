import React, { useEffect } from 'react';

export default function PrintPreviewModal({
    isOpen,
    onClose,
    title = 'Звіт',
    subtitle = '',
    columns = [],
    data = [],
    renderCell,
    footer = '',
}) {
    const today = new Date().toLocaleDateString('uk-UA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getCellText = (col, row) => {
        if (renderCell) {
            const val = renderCell(col, row);
            if (val && typeof val === 'object' && val.props) {
                return val.props.children ?? row[col.key] ?? '—';
            }
            return val ?? '—';
        }
        return row[col.key] ?? '—';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 print:hidden"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Попередній перегляд — {title}</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                        >
                            🖨 Роздрукувати / Зберегти PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            ✕ Закрити
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-gray-50 flex justify-center">
                    <div className="bg-white shadow-sm border border-gray-200 p-8 w-full max-w-4xl">
                        <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800 mb-6 text-center">
                            <div className="text-left">
                                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                                    Міні-супермаркет «ZLAGODA»
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                            </div>
                            <div className="text-right text-sm text-gray-500">
                                <div>Дата формування:</div>
                                <div className="font-bold text-gray-800">{today}</div>
                            </div>
                        </div>

                        {data.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Немає даних</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse mb-6 text-center mx-auto">
                                    <thead>
                                        <tr className="border-b-2 border-gray-800">
                                            {columns.map(col => (
                                                <th key={col.key} className="py-2 px-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, i) => (
                                            <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                {columns.map(col => (
                                                    <td key={col.key} className="py-2 px-3 text-gray-700 text-center">
                                                        {getCellText(col, row)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-800 text-xs text-gray-500">
                            <span>Міні-супермаркет «ZLAGODA» — Конфіденційний документ</span>
                            <span className="font-bold text-gray-700">
                                {footer && <span className="mr-3">{footer}</span>}
                                Всього записів: {data.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
