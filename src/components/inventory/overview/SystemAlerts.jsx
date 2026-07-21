import React, { useMemo } from 'react';
import { AlertTriangle, AlertOctagon, MessageSquare } from 'lucide-react';

const SystemAlerts = ({ assets = [], requests = [], onSelectAlert }) => {
  const alerts = useMemo(() => {
    const alertList = [];

    // Add asset warnings
    assets.forEach(asset => {
      if (asset.status === 'Critical') {
        alertList.push({
          id: `asset-crit-${asset.id}`,
          targetId: asset.id,
          targetType: 'asset',
          type: 'critical',
          title: asset.name,
          message: 'Warranty has expired',
          weight: 3,
          icon: AlertOctagon
        });
      } else if (asset.status === 'Warning') {
        alertList.push({
          id: `asset-warn-${asset.id}`,
          targetId: asset.id,
          targetType: 'asset',
          type: 'warning',
          title: asset.name,
          message: 'Warranty expiring soon',
          weight: 2,
          icon: AlertTriangle
        });
      }
    });

    // Add pending requests
    requests.forEach(req => {
      if (req.status === 'Pending') {
        const weight = req.urgency === 'Critical' || req.urgency === 'High' ? 2 : 1;
        alertList.push({
          id: `req-${req.id}`,
          targetId: req.id,
          targetType: 'request',
          type: 'info',
          title: req.item_description,
          message: `Requested by ${req.requested_by}`,
          weight,
          icon: MessageSquare
        });
      }
    });

    // Sort by weight (highest first)
    return alertList.sort((a, b) => b.weight - a.weight);
  }, [assets, requests]);

  const getColor = (type) => {
    switch (type) {
      case 'critical': return 'var(--color-critical)';
      case 'warning': return 'var(--color-warning)';
      case 'info': return 'var(--color-primary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="card overview-card flex-col">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h3 className="card-title">System Alerts</h3>
      </div>
      <div className="alerts-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'flex-start', marginTop: '20px', overflowY: 'auto', paddingRight: '8px', maxHeight: '215px' }}>
        {alerts.length > 0 ? (
          alerts.map(alert => {
            const Icon = alert.icon;
            return (
              <div 
                key={alert.id} 
                className="alert-item" 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `4px solid ${getColor(alert.type)}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, border-color 0.2s ease'
                }}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: getColor(alert.type), 
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {alert.title}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis'
                  }} title={alert.message}>
                    {alert.message}
                  </div>
                </div>

                <div style={{ color: getColor(alert.type), flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
                  <Icon size={18} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-secondary flex items-center justify-center" style={{ flex: 1, fontSize: '0.9rem' }}>
            No active alerts. All clear!
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAlerts;
