import React, { useCallback, useEffect, useState } from 'react';
import TenantLayout from '../layouts/TenantLayout';
import { createAutoTasks, getDailyBoard } from '../api/atlas';

export default function DailyBoardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getDailyBoard();
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load daily board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function handleGenerateTasks() {
    try {
      setWorking(true);
      setError('');
      const res = await createAutoTasks();
      alert(`Created ${res.created || 0} tasks`);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create auto tasks');
    } finally {
      setWorking(false);
    }
  }

  return (
    <TenantLayout title="Daily Action Board">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🔥 Today’s Priority Actions</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>
            The most important patient actions for today.
          </p>
        </div>

        <button
          onClick={handleGenerateTasks}
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
          {working ? 'Generating...' : '⚡ Generate Tasks'}
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
        <div style={{ marginTop: 20 }}>
          {rows.map((r, i) => (
            <div
              key={r.id}
              style={{
                padding: 16,
                marginBottom: 12,
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18 }}>
                {i + 1}. {r.patient_name}
              </div>

              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {r.action_group_name || r.action_group_code}
              </div>

              <div style={{ marginTop: 8 }}>
                {r.action_text}
              </div>

              <div style={{ marginTop: 8, color: '#374151' }}>
                Priority: <b>{r.priority}</b> | Score: <b>{r.score}</b> | Revenue: <b>€{r.revenue_estimate || 0}</b>
              </div>
            </div>
          ))}

          {rows.length === 0 ? (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#6b7280'
              }}
            >
              No actions for today.
            </div>
          ) : null}
        </div>
      )}
    </TenantLayout>
  );
}