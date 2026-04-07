import React, { useCallback, useEffect, useState } from 'react';
import TenantLayout from '../layouts/TenantLayout';
import {
  executeAutoAction,
  getAutoActions,
  runAiScoring,
  runAutoActions
} from '../api/atlas';

function statusStyle(status) {
  if (status === 'executed') {
    return { background: '#dcfce7', color: '#166534' };
  }

  return { background: '#fef3c7', color: '#92400e' };
}

export default function AutoActionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [workingActionId, setWorkingActionId] = useState(null);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAutoActions();
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load auto actions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function handleRunEngine() {
    try {
      setWorking(true);
      setError('');

      const aiRes = await runAiScoring();
      const actionRes = await runAutoActions();

      alert(
        `AI updated ${aiRes.updated || 0} cases\nAuto-actions created ${actionRes.created || 0}`
      );

      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to run AI auto-actions engine');
    } finally {
      setWorking(false);
    }
  }

  async function handleExecute(actionId) {
    try {
      setWorkingActionId(actionId);
      setError('');

      const res = await executeAutoAction(actionId);

      if (res?.data?.task) {
        alert(`Action executed and task created: ${res.data.task.title}`);
      } else {
        alert('Action executed');
      }

      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to execute auto action');
    } finally {
      setWorkingActionId(null);
    }
  }

  return (
    <TenantLayout title="AI Auto Actions">
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
          <h2 style={{ margin: 0 }}>🤖 AI Auto Actions</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            Predictive actions created automatically from ATLAS AI scoring.
          </p>
        </div>

        <button
          onClick={handleRunEngine}
          disabled={working}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#111827',
            color: '#fff',
            border: 'none',
            cursor: working ? 'not-allowed' : 'pointer',
            opacity: working ? 0.7 : 1,
            fontWeight: 700
          }}
        >
          {working ? 'Running...' : '🧠 Run AI + Auto Actions'}
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
                <th style={{ padding: 12 }}>Patient</th>
                <th style={{ padding: 12 }}>Action Type</th>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Description</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Created</th>
                <th style={{ padding: 12 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {row.patient_name}
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.action_type}
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.title}
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.description}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        ...statusStyle(row.status),
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: 12 }}>
                    {row.status !== 'executed' ? (
                      <button
                        onClick={() => handleExecute(row.id)}
                        disabled={workingActionId === row.id}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: 'none',
                          background: '#111827',
                          color: '#fff',
                          cursor: workingActionId === row.id ? 'not-allowed' : 'pointer',
                          opacity: workingActionId === row.id ? 0.7 : 1
                        }}
                      >
                        {workingActionId === row.id ? 'Executing...' : 'Execute'}
                      </button>
                    ) : (
                      <span style={{ color: '#166534', fontWeight: 700 }}>
                        Done
                      </span>
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
                    No AI auto actions found
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