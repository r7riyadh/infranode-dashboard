import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/common/ToastContainer';

import AuthPage from './components/auth/AuthPage';
import InventoryPage from './components/inventory/InventoryPage';
import Layout from './components/layout/Layout';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-primary)' }}>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              } />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
