import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  confirmText = 'Delete', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 999999, 
        backgroundColor: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(4px)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onCancel}
    >
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '24px', 
          backgroundColor: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          borderRadius: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            backgroundColor: type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
            color: type === 'danger' ? 'var(--color-critical)' : 'var(--color-warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={onConfirm}
            style={{ 
              backgroundColor: type === 'danger' ? 'var(--color-critical)' : 'var(--color-warning)',
              borderColor: type === 'danger' ? 'var(--color-critical)' : 'var(--color-warning)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
