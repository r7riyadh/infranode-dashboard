import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = {
  Approved: '#10b981', // Green
  Pending: '#f59e0b',  // Amber/Yellow
  Rejected: '#ef4444'  // Red
};

// Map DB statuses to UI statuses
const statusMap = {
  Approved: 'Approved',
  Accepted: 'Approved',
  Fulfilled: 'Approved',
  Pending: 'Pending',
  Rejected: 'Rejected',
  Denied: 'Rejected'
};

const RequestStatusChart = ({ requests = [] }) => {
  const data = useMemo(() => {
    const counts = {
      Approved: 0,
      Pending: 0,
      Rejected: 0
    };

    requests.forEach(req => {
      const mappedStatus = statusMap[req.status] || 'Pending';
      counts[mappedStatus] = (counts[mappedStatus] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((a, b) => b.value - a.value);
  }, [requests]);

  return (
    <div className="card overview-card">
      <h3 className="card-title">Request Status Summary</h3>
      <div className="chart-container" style={{ width: '100%', height: '200px', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name] || '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RequestStatusChart;
