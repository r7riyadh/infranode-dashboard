import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { logActivityEvent } from '../../services/activityLogger';
import { fetchOperatorsFromDB } from '../../services/operatorService';
import { AlertCircle } from 'lucide-react';
import Layout from '../layout/Layout';
import InventoryPage from '../inventory/InventoryPage';
import './AuthPage.css';

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOperatorsFromDB();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!username.trim() || !password.trim()) {
      const msg = 'Please enter both username and password.';
      setAuthError(msg);
      addToast({ title: 'Input Required', message: msg, type: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = loginUser(username, password);
      logActivityEvent('User Login', `"${loggedUser.username}" (${loggedUser.role}) logged in`, loggedUser.username || loggedUser.email, 'auth');
      addToast({ title: 'Welcome Back', message: `Signed in as ${loggedUser.username}.`, type: 'success' });
      navigate('/');
    } catch (err) {
      const errorMsg = err.message || 'Invalid username or password. Please try again.';
      setAuthError(errorMsg);
      addToast({ title: 'Authentication Failed', message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
      {/* Background glance of website */}
      <div style={{ filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
        <Layout>
          <InventoryPage />
        </Layout>
      </div>

      {/* Semi-transparent Glassmorphism Overlay */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          padding: '16px'
        }}
      >
        <div 
          className="card animate-fade-in"
          style={{
            position: 'relative',
            maxWidth: '380px',
            width: '100%',
            padding: '36px 36px 32px 36px',
            backgroundColor: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Login required
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              This is a public demo environment. You can explore the features or deploy this system on your own server.
            </p>
          </div>

          {/* Demo Credentials Box */}
          <div 
            style={{ 
              marginBottom: '16px', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              backgroundColor: 'var(--bg-color)', 
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo Credentials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>• Administrator: <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.8rem' }}>admin / admin</span></div>
              <div>• Employee: <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.8rem' }}>meaw / meaw</span></div>
            </div>
          </div>

          {authError && (
            <div 
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-critical)',
                color: 'var(--color-critical)',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              id="auth-username" 
              value={username}
              onChange={(e) => { setUsername(e.target.value); setAuthError(''); }}
              placeholder="Username"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />

            <input 
              type="password" 
              id="auth-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />

            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
              style={{ 
                padding: '12px', 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                width: '100%', 
                marginTop: '8px',
                borderRadius: '8px'
              }}
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
