import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSingleDeviceReport } from '../api/reports';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function DeviceReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await getSingleDeviceReport(id);
        setReport(data);
      } catch (error) {
        console.error('Error loading device report:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading report...</div>;
  }

  if (!report) {
    return <div style={{ padding: 24 }}>Report not found</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/reports">← Back to Reports</Link>
      </div>

      <h1 style={{ marginBottom: 8 }}>Device Report</h1>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>
        Report for device {report.serial_number}
      </p>

      <button
        type="button"
        onClick={() => window.print()}
        style={{
          padding: '10px 16px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          marginBottom: 24
        }}
      >
        Print Device Report
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}
      >
        <div style={cardStyle}>
          <h3>Device Summary</h3>
          <p><strong>Serial:</strong> {report.serial_number}</p>
          <p><strong>Brand:</strong> {report.brand || '-'}</p>
          <p><strong>Model:</strong> {report.model || '-'}</p>
          <p><strong>Status:</strong> {report.status || '-'}</p>
          <p><strong>Device Type:</strong> {report.device_type || '-'}</p>
          <p><strong>Mode:</strong> {report.mode || '-'}</p>
        </div>

        <div style={cardStyle}>
          <h3>Patient Assignment</h3>
          {report.patients ? (
            <>
              <p>
                <strong>Name:</strong> {report.patients.first_name || ''} {report.patients.last_name || ''}
              </p>
              <p><strong>Phone:</strong> {report.patients.phone || '-'}</p>
              <p><strong>Email:</strong> {report.patients.email || '-'}</p>
            </>
          ) : (
            <p>No patient assigned.</p>
          )}
        </div>

        <div style={cardStyle}>
          <h3>Technical Settings</h3>
          <p><strong>Pressure Min:</strong> {report.pressure_min ?? '-'}</p>
          <p><strong>Pressure Max:</strong> {report.pressure_max ?? '-'}</p>
          <p><strong>Mask Type:</strong> {report.mask_type || '-'}</p>
          <p>
            <strong>Last Sync:</strong>{' '}
            {report.last_sync_at ? new Date(report.last_sync_at).toLocaleString() : 'Never'}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Notes</h3>
          <p>{report.notes || 'No notes available.'}</p>
        </div>
      </div>
    </div>
  );
}
