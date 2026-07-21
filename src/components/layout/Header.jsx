import React, { useState, useEffect } from 'react';
import { Settings, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logActivityEvent } from '../../services/activityLogger';
import SettingsModal from './SettingsModal';
import ActivityLogModal from './ActivityLogModal';
import './Layout.css';

const Header = () => {
  const { user, signOut } = useAuth();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('');

  // Live auto-updating Last Synced clock
  useEffect(() => {
    const updateTime = () => {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);



  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  const usernameDisplay = user?.username || user?.email?.split('@')[0] || 'admin';
  const roleDisplay = isAdmin ? 'Administrator' : 'Employee';

  return (
    <>
      <header 
        className="card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 24px', 
          marginBottom: '24px', 
          maxWidth: '1400px', 
          margin: '0 auto 24px auto',
          backgroundColor: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}
      >
        {/* Left Side: Title + Live Time + Username + Role */}
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            InfraNode Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Time: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{lastSyncedTime}</span> &nbsp;|&nbsp; Username: <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{usernameDisplay}</span> &nbsp;|&nbsp; ROLE: <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{roleDisplay}</span>
          </p>
        </div>

        {/* Right Side: Toolbar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Settings Button (Admin only) */}
          {isAdmin && (
            <button
              className="icon-btn-small"
              title="System Settings & Manage Employees"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={18} />
            </button>
          )}

          {/* Logout Button */}
          <button
            className="icon-btn-small text-critical"
            title="Log Out"
            onClick={() => {
              logActivityEvent('User Logout', `${user?.username || user?.email} logged out`, user?.username || user?.email, 'auth');
              signOut();
            }}
          >
            <LogOut size={18} />
          </button>

          {/* Activity Log Report Button (Admin only) */}
          {isAdmin && (
            <>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
              <button
                onClick={() => setIsActivityLogOpen(true)}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Clock size={15} /> Activity Log
              </button>
            </>
          )}
        </div>
      </header>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ActivityLogModal isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />
    </>
  );
};

export default Header;
