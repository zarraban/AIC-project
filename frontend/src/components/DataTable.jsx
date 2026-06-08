import React from 'react';

function DataTable({ columns, data, onEdit, onDelete, loading }) {
    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 animate-pulse">Завантаження...</div>
        </div>
    );

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                            {col.label}
                        </th>
                    ))}
                    {(onEdit || onDelete) && (
                        <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right print:hidden">
                            Дії
                        </th>
                    )}
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length + 1} className="text-center py-12 text-gray-400">
                            Нічого не знайдено
                        </td>
                    </tr>
                ) : data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {columns.map((col) => (
                            <td key={col.key} className="px-4 py-3 text-gray-700">
                                {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                            </td>
                        ))}
                        {(onEdit || onDelete) && (
                            <td className="px-4 py-3 text-right print:hidden">
                                <div className="flex justify-end gap-2">
                                    {onEdit && (
                                        <button onClick={() => onEdit(row)}
                                                className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                                            Редагувати
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button onClick={() => onDelete(row)}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                                            Видалити
                                        </button>
                                    )}
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;