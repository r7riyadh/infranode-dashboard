import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { getOperators, addOperator, deleteOperator } from '../../services/operatorService';
import { logActivityEvent } from '../../services/activityLogger';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [searchOp, setSearchOp] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOperators(getOperators());
    }
    const handleUpdate = () => setOperators(getOperators());
    window.addEventListener('operators-updated', handleUpdate);
    return () => window.removeEventListener('operators-updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddOperator = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      addToast({ title: 'Input Required', message: 'Please provide both username and password.', type: 'warning' });
      return;
    }

    try {
      const created = addOperator(newUsername.trim(), newPassword.trim());
      setOperators(getOperators());
      logActivityEvent('Employee Account Created', `Added new employee account: ${created.username}`, user?.username || user?.email, 'settings');
      addToast({ title: 'Employee Added', message: `Employee "${created.username}" created successfully.`, type: 'success' });
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      addToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteOperator = (op) => {
    deleteOperator(op.id);
    setOperators(getOperators());
    logActivityEvent('Employee Account Deleted', `Removed employee account: ${op.username}`, user?.username || user?.email, 'settings');
    addToast({ title: 'Employee Removed', message: `Employee "${op.username}" removed.`, type: 'info' });
  };

  const handleSaveSettings = () => {
    addToast({ title: 'Settings Saved', message: 'Settings saved successfully.', type: 'success' });
    onClose();
  };

  const filteredOperators = operators.filter(op => 
    op.username.toLowerCase().includes(searchOp.toLowerCase())
  );

  return createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 999999, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          padding: '28px', 
          backgroundColor: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          borderRadius: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Settings
            </h2>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '8px', marginBottom: '4px' }}>
              Local Client Environment Settings
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Manage access clearance profiles for this network node instance.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn-small" style={{ alignSelf: 'flex-start' }}>
            <X size={20} />
          </button>
        </div>

        {/* Box: Manage Employees */}
        <div style={{ 
          backgroundColor: 'var(--bg-color)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '18px', 
          marginBottom: '20px' 
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            MANAGE EMPLOYEES
          </div>

          <form onSubmit={handleAddOperator} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
            <input 
              type="password" 
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
            <button 
              type="submit" 
              className="btn-primary"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}
            >
              Add
            </button>
          </form>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '14px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Active Employees
            </span>
            <div style={{ position: 'relative', width: '160px' }}>
              <input 
                type="text" 
                placeholder="Search..."
                value={searchOp}
                onChange={(e) => setSearchOp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredOperators.map(op => (
              <div 
                key={op.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {op.username}
                </span>
                <button 
                  type="button"
                  onClick={() => handleDeleteOperator(op)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-critical)',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                  title="Remove employee"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn-primary"
            onClick={handleSaveSettings}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
