import React, { useCallback, useEffect, useState } from 'react';
import TenantLayout from '../layouts/TenantLayout';
import {
  createTaskFromAtlasCase,
  getMyAtlasQueue,
  markAtlasCaseContacted,
  resolveAtlasCase
} from '../api/atlas';

function priorityStyle(priority) {
  if (priority === 'critical') {
    return { background: '#fee2e2', color: '#991b1b' };
  }
  if (priority === 'high') {
    return { background: '#fef3c7', color: '#92400e' };
  }
  if (priority === 'medium') {
    return { background: '#e0f2fe', color: '#075985' };
  }
  return { background: '#ecfdf5', color: '#166534' };
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

export default function MyAtlasQueuePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMyAtlasQueue();
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load My ATLAS queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function handleContacted(caseId) {
    try {
      setWorkingId(caseId);
      setError('');
      await markAtlasCaseContacted(caseId, 'Patient contacted from My ATLAS queue');
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to mark contacted');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleCreateTask(caseId) {
    try {
      setWorkingId(caseId);
      setError('');
      const res = await createTaskFromAtlasCase(caseId);
      alert(`Task created: ${res?.data?.title || 'OK'}`);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create task');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleResolve(caseId) {
    try {
      setWorkingId(caseId);
      setError('');
      await resolveAtlasCase(caseId, 'Resolved from My ATLAS queue');
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to resolve case');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <TenantLayout title="My ATLAS Queue">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>My ATLAS Queue</h2>
        <p style={{ color: '#6b7280', marginTop: 8 }}>
          My doctor-specific ATLAS cases.
        </p>
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
                <th style={{ padding: 12 }}>Patient</th>
                <th style={{ padding: 12 }}>Group</th>
                <th style={{ padding: 12 }}>Reason</th>
                <th style={{ padding: 12 }}>Priority</th>
                <th style={{ padding: 12 }}>Score</th>
                <th style={{ padding: 12 }}>Revenue</th>
                <th style={{ padding: 12 }}>Usage 7d</th>
                <th style={{ padding: 12 }}>AHI 7d</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{row.patient_name}</td>
                  <td style={{ padding: 12 }}>{row.action_group_name}</td>
                  <td style={{ padding: 12 }}>{row.reason}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        ...priorityStyle(row.priority),
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{row.score}</td>
                  <td style={{ padding: 12 }}>€{row.revenue_estimate || 0}</td>
                  <td style={{ padding: 12 }}>{row.usage_avg_7d || 0}</td>
                  <td style={{ padding: 12 }}>{row.ahi_avg_7d || 0}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleContacted(row.id)}
                        disabled={workingId === row.id}
                        style={buttonStyle(workingId === row.id)}
                      >
                        Contacted
                      </button>

                      <button
                        onClick={() => handleCreateTask(row.id)}
                        disabled={workingId === row.id}
                        style={buttonStyle(workingId === row.id)}
                      >
                        Create Task
                      </button>

                      <button
                        onClick={() => handleResolve(row.id)}
                        disabled={workingId === row.id}
                        style={buttonStyle(workingId === row.id)}
                      >
                        Resolve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                    No My ATLAS cases found
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