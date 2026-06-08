import React from 'react';

function Modal({ isOpen, onClose, title, children, onSubmit, submitLabel = 'Зберегти', loading = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>
                <div className="px-6 py-5">{children}</div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button"
                            className="px-5 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                        Скасувати
                    </button>
                    <button onClick={onSubmit} type="button" disabled={loading}
                            className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
                        {loading ? 'Збереження...' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;