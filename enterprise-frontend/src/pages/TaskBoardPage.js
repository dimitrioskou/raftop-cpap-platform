import React, { useCallback, useEffect, useState } from 'react';
import TenantLayout from '../layouts/TenantLayout';
import { completeTask, getTaskBoard, refreshTaskSla } from '../api/atlas';

function slaStyle(slaStatus) {
  if (slaStatus === 'overdue') {
    return { background: '#fee2e2', color: '#991b1b' };
  }

  if (slaStatus === 'completed') {
    return { background: '#dcfce7', color: '#166534' };
  }

  return { background: '#e0f2fe', color: '#075985' };
}

function buttonStyle(disabled) {
  return {
    padding: '8px 12px',
    borderRadius: 10,
    border: 'none',
    background: '#111827',
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1
  };
}

export default function TaskBoardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getTaskBoard();
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load task board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function handleRefreshSla() {
    try {
      setRefreshing(true);
      setError('');
      await refreshTaskSla();
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to refresh SLA');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleComplete(taskId) {
    try {
      setWorkingId(taskId);
      setError('');
      await completeTask(taskId);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete task');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <TenantLayout title="Task Board">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>📋 SLA Task Board</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            All generated tasks with SLA status and completion actions.
          </p>
        </div>

        <button
          onClick={handleRefreshSla}
          disabled={refreshing}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#111827',
            color: '#fff',
            border: 'none',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1,
            fontWeight: 700
          }}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh SLA'}
        </button>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 12,
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 16
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Description</th>
                <th style={{ padding: 12 }}>Priority</th>
                <th style={{ padding: 12 }}>SLA</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Due Date</th>
                <th style={{ padding: 12 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{row.title}</td>
                  <td style={{ padding: 12 }}>{row.description}</td>
                  <td style={{ padding: 12 }}>{row.priority}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        ...slaStyle(row.sla_status),
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {row.sla_status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{row.status}</td>
                  <td style={{ padding: 12 }}>
                    {row.due_date ? new Date(row.due_date).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.status !== 'completed' ? (
                      <button
                        onClick={() => handleComplete(row.id)}
                        disabled={workingId === row.id}
                        style={buttonStyle(workingId === row.id)}
                      >
                        {workingId === row.id ? 'Completing...' : 'Complete'}
                      </button>
                    ) : (
                      <span style={{ color: '#166534', fontWeight: 700 }}>Done</span>
                    )}
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}
                  >
                    No tasks found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </TenantLayout>
  );
}