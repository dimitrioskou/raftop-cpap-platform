import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeviceById, deleteDevice } from '../api/devices';

const pageStyle = {
  padding: 24
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: '#dc2626',
  color: '#ffffff',
  border: '1px solid #dc2626'
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'offline') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (s === 'maintenance') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (s === 'active') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  return {
    background: '#f3f4f6',
    color: '#4b5563',
    border: '1px solid #d1d5db'
  };
}

export default function DeviceProfile() {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function loadDevice() {
    try {
      setLoading(true);
      setError('');
      const data = await getDeviceById(deviceId);
      setDevice(data || null);
    } catch (err) {
      console.error('Error loading device profile:', err);
      setDevice(null);
      setError('Αποτυχία φόρτωσης device profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή τη συσκευή;');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await deleteDevice(deviceId);
      navigate('/devices');
    } catch (err) {
      console.error('Error deleting device:', err);
      setError('Αποτυχία διαγραφής συσκευής.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Device Profile</h1>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Αναλυτική προβολή συσκευής και τεχνικών στοιχείων.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => navigate('/devices')}>
            Back to Devices
          </button>

          <button
            type="button"
            style={dangerButtonStyle}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Device'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle}>Loading device profile...</div>
      ) : !device ? (
        <div style={cardStyle}>Device not found.</div>
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
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Serial Number</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {device.serial_number || '-'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Brand</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {device.brand || '-'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Model</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {device.model || '-'}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  ...statusBadgeStyle(device.status)
                }}
              >
                {device.status || 'inactive'}
              </span>

              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Updated: {formatDate(device.updated_at || device.updatedAt)}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Device ID</div>
                <div style={{ fontWeight: 600 }}>{device.id || '-'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Assigned Patient</div>
                <div style={{ fontWeight: 600 }}>
                  {device.assigned_patient || '-'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                <div style={{ fontWeight: 600 }}>
                  {formatDate(device.created_at || device.createdAt)}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Notes
              </div>
              <div style={{ color: '#374151' }}>
                {device.notes || '-'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}