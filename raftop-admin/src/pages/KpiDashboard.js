import React, { useEffect, useState } from 'react';
import { getKpiOverview } from '../api/kpi';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function KpiDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await getKpiOverview();
        setOverview(data);
      } catch (error) {
        console.error('Error loading KPI overview:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading KPI dashboard...</div>;
  }

  if (!overview) {
    return <div style={{ padding: 24 }}>No KPI data found.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Business KPIs</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        High-level operational view of the RAFTOP CPAP CARE platform.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16
        }}
      >
        <div style={cardStyle}>
          <div>Total Patients</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalPatients}</div>
        </div>

        <div style={cardStyle}>
          <div>Total Devices</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalDevices}</div>
        </div>

        <div style={cardStyle}>
          <div>Active Devices</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {overview.activeDevices}
          </div>
        </div>

        <div style={cardStyle}>
          <div>Offline Devices</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {overview.offlineDevices}
          </div>
        </div>

        <div style={cardStyle}>
          <div>Total Doctors</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalDoctors}</div>
        </div>

        <div style={cardStyle}>
          <div>Total Referrals</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalReferrals}</div>
        </div>

        <div style={cardStyle}>
          <div>New Referrals</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {overview.newReferrals}
          </div>
        </div>

        <div style={cardStyle}>
          <div>Closed Referrals</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {overview.closedReferrals}
          </div>
        </div>

        <div style={cardStyle}>
          <div>High Priority</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {overview.highPriorityReferrals}
          </div>
        </div>

        <div style={cardStyle}>
          <div>Total Clinics</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalClinics}</div>
        </div>

        <div style={cardStyle}>
          <div>Active Clinics</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
            {overview.activeClinics}
          </div>
        </div>
      </div>
    </div>
  );
}