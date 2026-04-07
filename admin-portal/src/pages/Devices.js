import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/devices');
      const data = await res.json();
      setDevices(data || []);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading devices...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Devices Monitoring</h1>

      <div style={{ marginTop: 20, overflowX: 'auto' }}>
        <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th>Serial</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Type</th>
              <th>Status</th>
              <th>Patient</th>
              <th>Last Sync</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td>{device.serial_number}</td>
                <td>{device.brand || '-'}</td>
                <td>{device.model || '-'}</td>
                <td>{device.device_type || '-'}</td>
                <td>{device.status || '-'}</td>
                <td>
                  {device.patients
                    ? `${device.patients.first_name || ''} ${device.patients.last_name || ''}`.trim()
                    : '-'}
                </td>
                <td>
                  {device.last_sync_at
                    ? new Date(device.last_sync_at).toLocaleString()
                    : 'Never'}
                </td>
                <td>
                  <Link to={`/devices/${device.id}`}>View</Link>
                </td>
              </tr>
            ))}

            {devices.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 20, textAlign: 'center' }}>
                  No devices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}