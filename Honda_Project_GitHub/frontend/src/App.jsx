import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Customers } from './pages/Customers';
import { Enquiries } from './pages/Enquiries';
import { TestRides } from './pages/TestRides';
import { SalesBilling } from './pages/SalesBilling';
import { SalesList } from './pages/SalesList';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Dealership Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<SalesList />} />
              <Route path="sales/new" element={<SalesBilling />} />
              <Route path="payments" element={<Payments />} />
              <Route path="customers" element={<Customers />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="test-rides" element={<TestRides />} />
              <Route path="reports" element={<Reports />} />

              {/* Admin Protected Routes */}
              <Route
                path="settings"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}
