import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReportsOverview, getDeviceReports } from '../api/reports';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [overviewData, devicesData] = await Promise.all([
          getReportsOverview(),
          getDeviceReports()
        ]);

        setOverview(overviewData);
        setDevices(devicesData || []);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading reports...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Reports Center</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Overview and reporting for devices and patient assignments.
      </p>

      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Devices</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalDevices}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Active Devices</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
              {overview.activeDevices}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Offline Devices</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
              {overview.offlineDevices}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Maintenance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
              {overview.maintenanceDevices}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Total Patients</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {overview.totalPatients}
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Device Reports</h3>

        {devices.length === 0 ? (
          <p>No report data found.</p>
        ) : (
          <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th>Serial</th>
                <th>Brand</th>
                <th>Model</th>
                <th>Status</th>
                <th>Patient</th>
                <th>Last Sync</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td>{device.serial_number}</td>
                  <td>{device.brand || '-'}</td>
                  <td>{device.model || '-'}</td>
                  <td>{device.status || '-'}</td>
                  <td>
                    {device.patients
                      ? `${device.patients.first_name || ''} ${device.patients.last_name || ''}`.trim()
                      : 'Unassigned'}
                  </td>
                  <td>
                    {device.last_sync_at
                      ? new Date(device.last_sync_at).toLocaleString()
                      : 'Never'}
                  </td>
                  <td>
                    <Link to={`/reports/device/${device.id}`}>Open Report</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}