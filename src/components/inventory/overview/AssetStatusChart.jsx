import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = {
  Active: '#10b981', // Green
  Warning: '#f59e0b', // Yellow
  Critical: '#ef4444', // Red
  Decommissioned: '#6b7280' // Gray
};

const AssetStatusChart = ({ assets = [] }) => {
  const data = useMemo(() => {
    const counts = {
      Active: 0,
      Warning: 0,
      Critical: 0,
      Decommissioned: 0
    };

    assets.forEach(asset => {
      const status = asset.status || 'Active';
      counts[status] = (counts[status] || 0) + 1;
    });

    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(0) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets]);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="card overview-card">
      <h3 className="card-title">Inventory Status Overview</h3>
      <div className="chart-container flex items-center justify-center">
        {data.length > 0 ? (
          <div className="pie-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%', height: '200px' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={CustomLabel}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name]} stroke="rgba(0,0,0,0.1)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="custom-legend" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
              {Object.keys(CHART_COLORS).map(status => (
                <div key={status} className="legend-item flex items-center gap-2">
                  <div style={{ width: '12px', height: '12px', backgroundColor: CHART_COLORS[status], borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state text-secondary flex items-center justify-center h-full w-full">
            No asset data available
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetStatusChart;
