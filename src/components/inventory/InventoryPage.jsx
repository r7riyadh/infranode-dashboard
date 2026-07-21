import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Filter, Wrench, CheckCircle, XCircle, Trash2, X, User } from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { useRequests } from '../../hooks/useRequests';
import DashboardOverview from './overview/DashboardOverview';
import AssetTable from './AssetTable';
import AssetFormModal from './AssetFormModal';
import RequestFormModal from './RequestFormModal';
import ConfirmModal from '../common/ConfirmModal';
import { logActivityEvent } from '../../services/activityLogger';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './Inventory.css';

const InventoryPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { assets, loading: assetsLoading, addAsset, updateAsset, deleteAsset } = useAssets();
  const { requests, addRequest, updateRequest, deleteRequest } = useRequests();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const [openRequestId, setOpenRequestId] = useState(null);
  const [openAssetReviewId, setOpenAssetReviewId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleRequestWrenchClick = (e, reqId) => {
    e.stopPropagation();
    setOpenRequestId(reqId);
  };

  const handleDeleteRequest = (id) => {
    if (!isAdmin) {
      addToast({ title: 'Access Denied', message: 'Only Administrators can delete equipment requests.', type: 'error' });
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Request',
      message: 'Are you sure you want to delete this request? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteRequest(id);
          logActivityEvent('Request Deleted', `Deleted equipment request #${id}`, user?.username || user?.email, 'inventory');
          addToast({ title: 'Request Deleted', message: 'Request deleted successfully', type: 'info' });
        } catch (error) {
          addToast({ title: 'Error', message: error.message, type: 'error' });
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleSelectAlert = (alert) => {
    if (alert.targetType === 'asset') {
      setOpenAssetReviewId(alert.targetId);
      const section = document.getElementById('asset-inventory-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (alert.targetType === 'request') {
      if (!isAdmin) {
        addToast({ title: 'Access Denied', message: 'Only Administrators can review equipment requests.', type: 'error' });
        return;
      }
      setOpenRequestId(alert.targetId);
      const section = document.getElementById('employee-requests-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };



  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch =
        (asset.name && asset.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (asset.category && asset.category.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (asset.location && asset.location.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesCategory = filterCategory ? asset.category === filterCategory : true;
      const matchesStatus = filterStatus ? asset.status === filterStatus : true;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, debouncedSearch, filterCategory, filterStatus]);

  const exportCSV = useMemo(() => () => {
    if (filteredAssets.length === 0) return;
    const headers = ['Name', 'Category', 'Status', 'Location', 'Purchase Date', 'Assigned To'];
    const rows = filteredAssets.map(a => [
      a.name, a.category, a.status, a.location, a.purchase_date, a.assigned_to
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "assets_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ title: 'Export Complete', message: 'CSV file downloaded.', type: 'info' });
  }, [filteredAssets, addToast]);

  // Listen for CSV export event from Header
  useEffect(() => {
    const handleExportEvent = () => {
      exportCSV();
    };
    window.addEventListener('export-csv', handleExportEvent);
    return () => window.removeEventListener('export-csv', handleExportEvent);
  }, [exportCSV]);

  const handleOpenModal = (asset = null) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
  };

  const handleSave = async (assetData) => {
    try {
      const creatorName = user?.username || (user?.email ? user.email.split('@')[0] : 'Employee');
      const fullAssetData = {
        ...assetData,
        created_by: editingAsset?.created_by || creatorName
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, fullAssetData);
        logActivityEvent('Asset Updated', `Updated asset "${assetData.name}"`, creatorName, 'inventory');
        addToast({ title: 'Success', message: 'Asset updated successfully', type: 'success' });
      } else {
        await addAsset(fullAssetData);
        logActivityEvent('Asset Created', `Created asset "${assetData.name}" in category ${assetData.category}`, creatorName, 'inventory');
        addToast({ title: 'Success', message: 'Asset added successfully', type: 'success' });
      }
      handleCloseModal();
    } catch (error) {
      addToast({ title: 'Error', message: error.message, type: 'error' });
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteAsset(id);
          logActivityEvent('Asset Deleted', `Deleted asset #${id}`, user?.username || user?.email, 'inventory');
          addToast({ title: 'Success', message: 'Asset deleted successfully', type: 'success' });
        } catch (error) {
          addToast({ title: 'Error', message: error.message, type: 'error' });
        } finally {
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateAssetStatus = async (id, updates) => {
    try {
      await updateAsset(id, updates);
      logActivityEvent('Asset Status Changed', `Updated asset #${id} status to ${updates.status || 'modified'}`, user?.username || user?.email, 'inventory');
      addToast({ title: 'Success', message: 'Asset updated successfully', type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', message: error.message, type: 'error' });
    }
  };

  const handleSaveRequest = async (requestData) => {
    try {
      await addRequest(requestData);
      logActivityEvent('Equipment Requested', `Requested: "${requestData.item_description}" (${requestData.urgency} urgency)`, user?.username || user?.email, 'inventory');
      addToast({ title: 'Success', message: 'Equipment request submitted!', type: 'success' });
      setIsRequestModalOpen(false);
    } catch (error) {
      addToast({ title: 'Error', message: error.message, type: 'error' });
    }
  };

  const handleUpdateRequestStatus = async (id, status) => {
    if (!isAdmin) {
      addToast({ title: 'Access Denied', message: 'Only Administrators can review or approve equipment requests.', type: 'error' });
      return;
    }
    try {
      await updateRequest(id, { status });
      logActivityEvent(`Request ${status}`, `Equipment request #${id} set to ${status}`, user?.username || user?.email, 'inventory');
      addToast({ title: 'Status Updated', message: `Request has been ${status.toLowerCase()}`, type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', message: error.message, type: 'error' });
    }
  };

  if (assetsLoading) return <div className="loading-state">Loading inventory...</div>;

  return (
    <div className="inventory-container">

      <DashboardOverview assets={assets} requests={requests} onSelectAlert={handleSelectAlert} />

      <div className="inventory-filters card no-print" style={{ marginTop: '24px' }}>
        <div className="filter-group">
          <Search size={16} className="text-secondary" />
          <input
            type="text"
            placeholder="Search name, category, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group-right">
          <div className="filter-select">
            <Filter size={14} className="text-secondary" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Server">Server</option>
              <option value="Network">Network</option>
              <option value="Storage">Storage</option>
              <option value="Power">Power</option>
              <option value="Workstation">Workstation</option>
              <option value="Laptop">Laptop</option>
              <option value="Security / Firewall">Security / Firewall</option>
              <option value="Cloud / Virtual">Cloud / Virtual</option>
              <option value="Peripheral">Peripheral</option>
              <option value="Software License">Software License</option>
            </select>
          </div>

          <div className="filter-select">
            <Filter size={14} className="text-secondary" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Warning">Warning</option>
              <option value="Critical">Critical</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      <div id="asset-inventory-section" className="card" style={{ marginTop: '16px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="card-title">Inventory</h3>
          <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Asset
          </button>
        </div>
        <AssetTable
          assets={filteredAssets}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onUpdateAsset={handleUpdateAssetStatus}
          externalOpenId={openAssetReviewId}
        />
      </div>

      <div id="employee-requests-section" className="card" style={{ marginTop: '32px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="card-title">Equipment Request</h3>
          <button onClick={() => setIsRequestModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> Request Equipment
          </button>
        </div>
        <div className="table-responsive" style={{ maxHeight: '315px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Requested By</th>
                <th>Item Description</th>
                <th>Urgency</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests && requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req.id}>
                    <td>{req.requested_by}</td>
                    <td>{req.item_description}</td>
                    <td>{req.urgency}</td>
                    <td>
                      <span style={{
                        color: req.status === 'Approved' || req.status === 'Fulfilled' ? 'var(--color-success)' : req.status === 'Pending' ? 'var(--color-warning)' : 'var(--color-critical)',
                        fontWeight: '600'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="action-buttons flex gap-2">
                          <button
                            onClick={(e) => handleRequestWrenchClick(e, req.id)}
                            className="icon-btn-small text-secondary request-wrench-btn"
                            title="Actions"
                          >
                            <Wrench size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? "5" : "4"} style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-secondary">No active equipment requests.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <AssetFormModal
          asset={editingAsset}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}

      {isRequestModalOpen && (
        <RequestFormModal
          onClose={() => setIsRequestModalOpen(false)}
          onSave={handleSaveRequest}
        />
      )}

      {openRequestId && (() => {
        const activeRequest = requests.find(r => r.id === openRequestId);
        if (!activeRequest) return null;

        const getUrgencyColor = (urgency) => {
          switch (urgency) {
            case 'Critical': return 'var(--color-critical)';
            case 'High': return 'var(--color-warning)';
            case 'Medium': return 'var(--color-primary)';
            default: return 'var(--text-secondary)';
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
            onClick={() => setOpenRequestId(null)}
          >
            <div
              className="card animate-fade-in"
              style={{
                maxWidth: '540px',
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Review Equipment Request
                </h2>
                <button
                  onClick={() => setOpenRequestId(null)}
                  className="icon-btn-small"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Requested By
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} className="text-secondary" /> {activeRequest.requested_by}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Urgency
                  </div>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: getUrgencyColor(activeRequest.urgency),
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${getUrgencyColor(activeRequest.urgency)}`
                    }}>
                      {activeRequest.urgency}
                    </span>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Item Description
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {activeRequest.item_description}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reason for Request
                  </div>
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    "{activeRequest.reason || 'No specific reason provided.'}"
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { handleDeleteRequest(activeRequest.id); setOpenRequestId(null); }}
                    style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)', marginRight: 'auto' }}
                  >
                    <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { handleUpdateRequestStatus(activeRequest.id, 'Rejected'); setOpenRequestId(null); }}
                    style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                  >
                    <XCircle size={16} style={{ marginRight: '6px' }} /> Reject
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => { handleUpdateRequestStatus(activeRequest.id, 'Approved'); setOpenRequestId(null); }}
                    style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    <CheckCircle size={16} style={{ marginRight: '6px' }} /> Accept
                  </button>
                </div>
              ) : (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Read-only view (Only Administrators can approve or modify equipment requests)
                </div>
              )}
            </div>
          </div>,
          document.body
        );
      })()}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default InventoryPage;
