import React, { useEffect, useMemo, useState } from 'react';
import { getActivityLogs } from '../api/activity';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await getActivityLogs();
        setLogs(data || []);
      } catch (error) {
        console.error('Error loading activity logs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = !actionFilter || log.action === actionFilter;
      const matchesEntity = !entityFilter || log.entity_type === entityFilter;
      return matchesAction && matchesEntity;
    });
  }, [logs, actionFilter, entityFilter]);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Activity Logs</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Audit trail of actions performed across the platform.
      </p>

      <div style={{ ...cardStyle, display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </select>

        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          <option value="">All Entities</option>
          <option value="device">device</option>
          <option value="doctor">doctor</option>
          <option value="referral">referral</option>
          <option value="task">task</option>
          <option value="patient">patient</option>
        </select>
      </div>

      <div style={cardStyle}>
        {loading ? (
          <p>Loading activity logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p>No activity logs found.</p>
        ) : (
          <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Description</th>
                <th>Actor</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td>{log.action}</td>
                  <td>{log.entity_type}</td>
                  <td>{log.entity_id || '-'}</td>
                  <td>{log.description || '-'}</td>
                  <td>{log.actor_name || '-'}</td>
                  <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
