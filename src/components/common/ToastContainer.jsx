import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const Toast = ({ id, title, message, type, duration, onRemove }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - (100 / (duration / 10)); // updating every 10ms
      });
    }, 10);

    const timeout = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [id, duration, onRemove]);

  const icons = {
    success: <CheckCircle className="text-success" size={20} />,
    error: <AlertOctagon className="text-critical" size={20} />,
    warning: <AlertTriangle className="text-warning" size={20} />,
    info: <Info className="text-primary" size={20} />,
  };

  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-critical)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
  };

  return (
    <div
      className="card animate-toast"
      style={{
        position: 'relative',
        width: '320px',
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', padding: '12px 16px', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>{icons[type]}</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{title}</h4>
          {message && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{message}</p>}
        </div>
        <button
          onClick={() => onRemove(id)}
          style={{ color: 'var(--text-secondary)', padding: '2px', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        style={{
          height: '4px',
          width: `${progress}%`,
          backgroundColor: colors[type],
          transition: 'width 10ms linear',
        }}
      />
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
