import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';

import ManagerLayout from './layouts/ManagerLayout';
import CashierLayout from './layouts/CashierLayout';

// Manager
import Employees from './pages/manager/Employees';
import ProductsCategories from "./pages/manager/ProductsCategories.jsx";
import ProductsInfoMgr from "./pages/manager/ProductsInfo.jsx";
import ProductsStoreMgr from "./pages/manager/ProductsStore.jsx";
import CustomersMgr from "./pages/manager/Customers.jsx";
import ReceiptsMgr from "./pages/manager/Receipts.jsx";
import Reports from "./pages/manager/Reports.jsx";

// Cashier
import NewReceipt from "./pages/cashier/NewReceipt.jsx";
import CustomersCsh from "./pages/cashier/Customers.jsx";
import ProductsInfoCsh from "./pages/cashier/ProductsInfo.jsx";
import ProductsStoreCsh from "./pages/cashier/ProductsStore.jsx";
import MyReceipts from "./pages/cashier/MyReceipts.jsx";

function ProtectedRoute({ allowedRole, children }) {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== allowedRole) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function RootRedirect() {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (user.role === 'manager') {
        return <Navigate to="/manager/employees" replace />;
    }
    if (user.role === 'cashier') {
        return <Navigate to="/cashier/new-receipt" replace />;
    }
    return <Navigate to="/login" replace />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/manager"
                        element={
                            <ProtectedRoute allowedRole="manager">
                                <ManagerLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="employees" element={<Employees />} />
                        <Route path="products-categories" element={<ProductsCategories />} />
                        <Route path="products-info" element={<ProductsInfoMgr />} />
                        <Route path="products-store" element={<ProductsStoreMgr />} />
                        <Route path="customers" element={<CustomersMgr />} />
                        <Route path="receipts" element={<ReceiptsMgr />} />
                        <Route path="reports" element={<Reports />} />
                    </Route>

                    <Route
                        path="/cashier"
                        element={
                            <ProtectedRoute allowedRole="cashier">
                                <CashierLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="new-receipt" element={<NewReceipt />} />
                        <Route path="customers" element={<CustomersCsh />} />
                        <Route path="products-info" element={<ProductsInfoCsh />} />
                        <Route path="products-store" element={<ProductsStoreCsh />} />
                        <Route path="my-receipts" element={<MyReceipts />} />

                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;