import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import { getSuperAdminDashboard } from '../api/superAdmin';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18
};

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await getSuperAdminDashboard();
        setData(response?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <SuperAdminLayout title="Super Admin Dashboard">
      {loading ? <div>Loading...</div> : null}
      {error ? (
        <div style={{ ...cardStyle, background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={cardStyle}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Organizations</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {data.totalOrganizations || 0}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Active Licenses</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {data.activeLicenses || 0}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Suspended Organizations</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {data.suspendedOrganizations || 0}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Total Platform Users</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {data.totalUsers || 0}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16
            }}
          >
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Platform Summary</h3>
              <div style={{ color: '#374151', lineHeight: 1.7 }}>
                <div>Total patients: {data.totalPatients || 0}</div>
                <div>Total devices: {data.totalDevices || 0}</div>
                <div>Total tasks: {data.totalTasks || 0}</div>
                <div>Total referrals: {data.totalReferrals || 0}</div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Management Notes</h3>
              <div style={{ color: '#374151', lineHeight: 1.7 }}>
                <div>Use this dashboard for full platform control.</div>
                <div>Next sprint: organization actions, license actions, module activation.</div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </SuperAdminLayout>
  );
}