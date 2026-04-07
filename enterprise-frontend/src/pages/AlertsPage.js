import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TenantLayout from '../layouts/TenantLayout';
import { getAlertsPanel } from '../api/atlas';

function alertCardStyle(background, border) {
  return {
    background,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 18
  };
}

export default function AlertsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAlertsPanel();
      setData(res.data || null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <TenantLayout title="ATLAS Alerts">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32, color: '#111827' }}>
          ATLAS Alerts
        </h1>
        <p style={{ marginTop: 8, color: '#6b7280' }}>
          Critical operational signals from the ATLAS engine.
        </p>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 20,
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 14
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={alertCardStyle('#fee2e2', '#fecaca')}>
              <div style={{ fontSize: 13, color: '#991b1b' }}>
                Critical Cases
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>
                {data?.criticalCases || 0}
              </div>
            </div>

            <div style={alertCardStyle('#ffedd5', '#fdba74')}>
              <div style={{ fontSize: 13, color: '#c2410c' }}>
                Overdue Tasks
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>
                {data?.overdueTasks || 0}
              </div>
            </div>

            <div style={alertCardStyle('#f3f4f6', '#d1d5db')}>
              <div style={{ fontSize: 13, color: '#374151' }}>
                No Data Patients
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>
                {data?.noDataPatients || 0}
              </div>
            </div>

            <div style={alertCardStyle('#ecfdf5', '#a7f3d0')}>
              <div style={{ fontSize: 13, color: '#166534' }}>
                Revenue Risk
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>
                €{data?.revenueRisk || 0}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 18
              }}
            >
              <h3 style={{ marginTop: 0 }}>Recommended Actions</h3>
              <div style={{ color: '#374151', lineHeight: 1.8 }}>
                <div>Review critical cases in ATLAS Queue.</div>
                <div>Refresh SLA and clear overdue tasks.</div>
                <div>Contact no-data patients quickly.</div>
                <div>Use AI Auto Actions for predictive follow-up.</div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 18
              }}
            >
              <h3 style={{ marginTop: 0 }}>Quick Access</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/tenant/atlas/queue">Open ATLAS Queue</Link>
                <Link to="/tenant/task-board">Open Task Board</Link>
                <Link to="/tenant/daily-board">Open Daily Board</Link>
                <Link to="/tenant/auto-actions">Open AI Auto Actions</Link>
                <Link to="/tenant/notification-queue">Open Notification Queue</Link>
              </div>
            </div>
          </div>
        </>
      )}
    </TenantLayout>
  );
}