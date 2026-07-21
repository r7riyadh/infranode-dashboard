import React from 'react';
import AssetStatusChart from './AssetStatusChart';
import SystemAlerts from './SystemAlerts';
import RequestStatusChart from './RequestStatusChart';

const DashboardOverview = ({ assets, requests, onSelectAlert }) => {
  return (
    <div className="dashboard-overview-container">
      <div className="overview-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        <AssetStatusChart assets={assets} />
        <RequestStatusChart requests={requests} />
        <SystemAlerts assets={assets} requests={requests} onSelectAlert={onSelectAlert} />
      </div>
    </div>
  );
};

export default DashboardOverview;
