import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import ManagerLayout from './layouts/ManagerLayout';
import CashierLayout from './layouts/CashierLayout';

import Employees from './pages/manager/Employees';
import ProductsCategories from "./pages/manager/ProductsCategories.jsx";
import ProductsInfo from "./pages/manager/ProductsInfo.jsx";
import ProductsStore from "./pages/manager/ProductsStore.jsx";
import CustomerCards from "./pages/manager/CustomerCards.jsx";
import Receipts from "./pages/manager/Receipts.jsx";
import Reports from "./pages/manager/Reports.jsx";

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
        return <Navigate to="/cashier/categories" replace />;
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
                        <Route path="products-info" element={<ProductsInfo />} />
                        <Route path="products-store" element={<ProductsStore />} />
                        <Route path="customer-cards" element={<CustomerCards />} />
                        <Route path="receipts" element={<Receipts />} />
                        <Route path="reports" element={<Reports />} />
                    </Route>

                    <Route
                        path="/cashier/*"
                        element={
                            <ProtectedRoute allowedRole="cashier">
                                <CashierLayout />
                            </ProtectedRoute>
                        }
                    >

                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;