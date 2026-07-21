import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Search, Trash2, Download } from 'lucide-react';
import { getActivityLogs, clearActivityLogs } from '../../services/activityLogger';
import { useToast } from '../../contexts/ToastContext';

const cleanUserDisplay = (userStr) => {
  if (!userStr) return 'admin';
  const val = String(userStr).trim();
  return val.includes('@') ? val.split('@')[0] : val;
};

const cleanDetailsDisplay = (detailsStr) => {
  if (!detailsStr) return '';
  let str = String(detailsStr);
  str = str.replace(/^Operator\s+/i, '');
  str = str.replace(/@enterprise\.demo/gi, '');
  return str;
};

const ActivityLogModal = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const refreshLogs = useCallback(() => {
    setLogs(getActivityLogs());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }

    const handleLogUpdate = () => {
      refreshLogs();
    };

    window.addEventListener('activity-log-updated', handleLogUpdate);
    return () => {
      window.removeEventListener('activity-log-updated', handleLogUpdate);
    };
  }, [isOpen, refreshLogs]);

  if (!isOpen) return null;

  const handleClearLogs = () => {
    clearActivityLogs();
    refreshLogs();
    addToast({ title: 'Logs Cleared', message: 'Activity logs have been wiped.', type: 'info' });
  };

  const handleExportLogs = () => {
    if (logs.length === 0) {
      addToast({ title: 'No Data', message: 'No logs available to export.', type: 'warning' });
      return;
    }
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details', 'Category'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      cleanUserDisplay(l.user),
      l.action,
      `"${cleanDetailsDisplay(l.details).replace(/"/g, '""')}"`,
      l.category
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ title: 'Export Complete', message: 'Activity logs exported as CSV.', type: 'success' });
  };

  const filteredLogs = logs.filter(log => {
    const userClean = cleanUserDisplay(log.user);
    const detailsClean = cleanDetailsDisplay(log.details);
    const matchesSearch = 
      (userClean && userClean.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (detailsClean && detailsClean.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory ? log.category === filterCategory : true;

    return matchesSearch && matchesCategory;
  });

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
          maxWidth: '820px', 
          width: '100%', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px', 
          backgroundColor: 'var(--surface-color)', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          borderRadius: '16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--color-primary)' }} /> Activity Log Report
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              System events, user logins, asset updates and security trails.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn-small">
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search activity log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <option value="">All Categories</option>
            <option value="auth">Auth & Logins</option>
            <option value="inventory">Inventory Actions</option>
            <option value="settings">Settings Changes</option>
            <option value="system">System Events</option>
          </select>
        </div>

        {/* Log Table */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--surface-color)' }}>Timestamp</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--surface-color)' }}>User</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--surface-color)' }}>Action</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--surface-color)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {cleanUserDisplay(log.user)}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: 'var(--color-primary)'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {cleanDetailsDisplay(log.details)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-secondary">No activity logs found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            onClick={handleClearLogs}
            className="btn-secondary"
            style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}
          >
            <Trash2 size={16} style={{ marginRight: '6px' }} /> Clear Logs
          </button>

          <button 
            type="button"
            onClick={handleExportLogs}
            className="btn-secondary"
          >
            <Download size={16} style={{ marginRight: '6px' }} /> Export Activity Log CSV
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActivityLogModal;
