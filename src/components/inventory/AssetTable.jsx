import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, ArrowUpDown, Wrench, Archive, AlertTriangle, X, MapPin, User, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const cleanUsername = (str) => {
  if (!str) return 'admin';
  const val = String(str).trim();
  if (val.includes('@')) return val.split('@')[0];
  return val;
};

const AssetTable = ({ assets, onEdit, onDelete, onUpdateAsset, externalOpenId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  const canModify = (asset) => {
    if (!asset) return false;
    if (isAdmin) return true;
    if (!asset.created_by) return false;

    const creatorClean = cleanUsername(asset.created_by).toLowerCase();
    const userClean = cleanUsername(user?.username || user?.email).toLowerCase();

    return creatorClean === userClean;
  };
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [openActionId, setOpenActionId] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedMaintenanceAsset, setSelectedMaintenanceAsset] = useState(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');

  useEffect(() => {
    if (externalOpenId) {
      setOpenActionId(externalOpenId);
    }
  }, [externalOpenId]);

  const handleWrenchClick = (e, assetId) => {
    e.stopPropagation();
    setOpenActionId(assetId);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAssets = useMemo(() => {
    const sortable = [...assets];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle numeric or date sorting
        if (sortConfig.key === 'purchase_cost' || sortConfig.key === 'current_value') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (sortConfig.key === 'purchase_date' || sortConfig.key === 'created_at') {
          aVal = new Date(aVal).getTime() || 0;
          bVal = new Date(bVal).getTime() || 0;
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [assets, sortConfig]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'var(--color-success)';
      case 'Warning': return 'var(--color-warning)';
      case 'Critical': return 'var(--color-critical)';
      default: return 'var(--text-secondary)';
    }
  };

  const SortableHeader = ({ label, sortKey }) => (
    <th onClick={() => handleSort(sortKey)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown size={14} className={sortConfig.key === sortKey ? 'text-primary' : 'text-secondary'} />
      </div>
    </th>
  );

  return (
    <>
      <div className="table-wrapper">
        <div className="table-responsive" style={{ maxHeight: '315px', overflowY: 'auto' }}>
          <table className="data-table inventory-table">
            <thead>
              <tr>
                <SortableHeader label="Name" sortKey="name" />
                <SortableHeader label="Category" sortKey="category" />
                <SortableHeader label="Status" sortKey="status" />
                <SortableHeader label="Location" sortKey="location" />
                <SortableHeader label="Purchase Date" sortKey="purchase_date" />
                <th>
                  <div className="flex items-center gap-2">End of Life Date</div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset) => {
                const eolDateStr = asset.end_of_life ? new Date(asset.end_of_life).toISOString().split('T')[0] : 'N/A';

                return (
                  <tr key={asset.id} className="animate-slide-in-row">
                    <td>{asset.name}</td>
                    <td className="text-secondary">{asset.category}</td>
                    <td>
                      <span style={{
                        color: getStatusColor(asset.status),
                        backgroundColor: `color-mix(in srgb, ${getStatusColor(asset.status)} 15%, transparent)`,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {asset.status}
                      </span>
                    </td>
                    <td>{asset.location}</td>
                    <td>{asset.purchase_date}</td>
                    <td className="text-secondary">{eolDateStr}</td>
                    {onEdit && (
                      <td>
                        <div className="action-buttons flex gap-2">
                          {canModify(asset) ? (
                            <button
                              onClick={(e) => handleWrenchClick(e, asset.id)}
                              className="icon-btn-small text-secondary wrench-btn"
                              title="Actions"
                            >
                              <Wrench size={16} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {sortedAssets.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-secondary">No assets found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openActionId && (() => {
        const activeAsset = assets.find(a => a.id === openActionId);
        if (!activeAsset) return null;

        const getStatusBadgeStyle = (status) => {
          switch (status) {
            case 'Active': return { color: 'var(--color-success)', borderColor: 'var(--color-success)' };
            case 'Warning': return { color: 'var(--color-warning)', borderColor: 'var(--color-warning)' };
            case 'Critical': return { color: 'var(--color-critical)', borderColor: 'var(--color-critical)' };
            default: return { color: 'var(--text-secondary)', borderColor: 'var(--border-color)' };
          }
        };

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
            onClick={() => setOpenActionId(null)}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {activeAsset.name}
                  </h2>
                </div>
                <button
                  onClick={() => setOpenActionId(null)}
                  className="icon-btn-small"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Category
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {activeAsset.category}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid',
                      ...getStatusBadgeStyle(activeAsset.status)
                    }}>
                      {activeAsset.status}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Location
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} className="text-secondary" /> {activeAsset.location || 'Unassigned'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Assigned To
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} className="text-secondary" /> {activeAsset.assigned_to || 'Unassigned'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    End of Life / Warranty
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} className="text-secondary" /> {activeAsset.end_of_life || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Added By
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} className="text-secondary" /> {cleanUsername(activeAsset.created_by)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {canModify(activeAsset) ? (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { onDelete(activeAsset.id); setOpenActionId(null); }}
                      style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)', marginRight: 'auto' }}
                    >
                      <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete
                    </button>

                    {activeAsset.status === 'Critical' && onUpdateAsset && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => { onUpdateAsset(activeAsset.id, { status: 'Decommissioned' }); setOpenActionId(null); }}
                        style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}
                      >
                        <Archive size={16} style={{ marginRight: '6px' }} /> Decommission
                      </button>
                    )}

                    {activeAsset.status === 'Warning' && onUpdateAsset && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedMaintenanceAsset(activeAsset);
                          setMaintenanceDate(activeAsset.end_of_life || new Date().toISOString().split('T')[0]);
                          setShowMaintenanceModal(true);
                          setOpenActionId(null);
                        }}
                        style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                      >
                        <AlertTriangle size={16} style={{ marginRight: '6px' }} /> Schedule Maintenance
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => { onEdit(activeAsset); setOpenActionId(null); }}
                    >
                      <Edit2 size={16} style={{ marginRight: '6px' }} /> Edit Asset
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 auto', textAlign: 'center' }}>
                    Read-only item (Created by {cleanUsername(activeAsset.created_by)})
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {showMaintenanceModal && selectedMaintenanceAsset && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-container" style={{ maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '16px' }}>Schedule Action</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Select a target date for maintenance or decommission the asset:
              <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '8px' }}>
                {selectedMaintenanceAsset.name}
              </strong>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Maintenance Date
              </label>
              <input 
                type="date" 
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setSelectedMaintenanceAsset(null);
                }}
              >
                Cancel
              </button>

              <button 
                type="button" 
                className="btn-secondary" 
                onClick={async () => {
                  if (onUpdateAsset) {
                    await onUpdateAsset(selectedMaintenanceAsset.id, { 
                      status: 'Decommissioned' 
                    });
                  }
                  setShowMaintenanceModal(false);
                  setSelectedMaintenanceAsset(null);
                }}
                style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}
              >
                Decommission
              </button>

              <button 
                type="button" 
                className="btn-primary" 
                onClick={async () => {
                  if (onUpdateAsset) {
                    await onUpdateAsset(selectedMaintenanceAsset.id, { 
                      end_of_life: maintenanceDate,
                      status: 'Active' 
                    });
                  }
                  setShowMaintenanceModal(false);
                  setSelectedMaintenanceAsset(null);
                }}
              >
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssetTable;
