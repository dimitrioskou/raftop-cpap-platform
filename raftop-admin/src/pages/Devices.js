import React, { useEffect, useMemo, useState } from 'react';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
} from '../api/devices';

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

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
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

const primaryButtonStyle = {
  ...buttonStyle,
  background: '#111827',
  color: '#ffffff',
  border: '1px solid #111827'
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: '#dc2626',
  color: '#ffffff',
  border: '1px solid #dc2626'
};

const emptyForm = {
  serial_number: '',
  model: '',
  brand: '',
  status: 'active',
  assigned_patient: '',
  notes: ''
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

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

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      setLoading(true);
      setError('');
      const data = await getDevices();
      setDevices(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading devices:', err);
      setDevices([]);
      setError('Αποτυχία φόρτωσης devices.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(device) {
    setEditingId(device.id);
    setForm({
      serial_number: device.serial_number || '',
      model: device.model || '',
      brand: device.brand || '',
      status: device.status || 'active',
      assigned_patient: device.assigned_patient || '',
      notes: device.notes || ''
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.serial_number.trim()) {
      setError('Το serial number είναι υποχρεωτικό.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        serial_number: form.serial_number.trim(),
        model: form.model.trim(),
        brand: form.brand.trim(),
        status: form.status,
        assigned_patient: form.assigned_patient.trim(),
        notes: form.notes.trim()
      };

      if (editingId) {
        await updateDevice(editingId, payload);
        setSuccess('Η συσκευή ενημερώθηκε.');
      } else {
        await createDevice(payload);
        setSuccess('Η συσκευή δημιουργήθηκε.');
      }

      resetForm();
      await loadDevices();
    } catch (err) {
      console.error('Error saving device:', err);
      setError('Αποτυχία αποθήκευσης συσκευής.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(deviceId) {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτή τη συσκευή;');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteDevice(deviceId);
      setSuccess('Η συσκευή διαγράφηκε.');
      if (editingId === deviceId) resetForm();
      await loadDevices();
    } catch (err) {
      console.error('Error deleting device:', err);
      setError('Αποτυχία διαγραφής συσκευής.');
    }
  }

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesSearch =
        !q ||
        String(device.serial_number || '').toLowerCase().includes(q) ||
        String(device.model || '').toLowerCase().includes(q) ||
        String(device.brand || '').toLowerCase().includes(q) ||
        String(device.assigned_patient || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        String(device.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [devices, search, statusFilter]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Devices</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Διαχείριση CPAP συσκευών, κατάστασης, ανάθεσης και τεχνικών σημειώσεων.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>
          {editingId ? 'Edit Device' : 'Create Device'}
        </h2>

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

        {success ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#166534',
              border: '1px solid #a7f3d0'
            }}
          >
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              marginBottom: 14
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Serial Number
              </label>
              <input
                type="text"
                value={form.serial_number}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, serial_number: e.target.value }))
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Model
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Brand
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="active">active</option>
                <option value="offline">offline</option>
                <option value="maintenance">maintenance</option>
                <option value="inactive">inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Assigned Patient
              </label>
              <input
                type="text"
                value={form.assigned_patient}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, assigned_patient: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Notes
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Device' : 'Create Device'}
            </button>

            <button type="button" style={buttonStyle} onClick={resetForm} disabled={saving}>
              Clear
            </button>

            <button type="button" style={buttonStyle} onClick={loadDevices} disabled={saving}>
              Refresh
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Filters</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
              placeholder="serial / model / brand / patient"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="active">active</option>
              <option value="offline">offline</option>
              <option value="maintenance">maintenance</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Device List</h2>

        {loading ? (
          <div>Loading devices...</div>
        ) : filteredDevices.length === 0 ? (
          <div>No devices found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredDevices.map((device, index) => (
              <div
                key={device.id || index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  padding: 16,
                  background: '#ffffff'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                      {device.serial_number || 'Unknown Serial'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        alignItems: 'center'
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

                      <span style={{ color: '#4b5563' }}>
                        {device.brand || '-'} · {device.model || '-'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={buttonStyle} onClick={() => handleEdit(device)}>
                      Edit
                    </button>

                    <button
                      type="button"
                      style={dangerButtonStyle}
                      onClick={() => handleDelete(device.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Assigned Patient</div>
                    <div style={{ fontWeight: 600 }}>{device.assigned_patient || '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(device.created_at || device.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Updated</div>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(device.updated_at || device.updatedAt)}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Notes
                  </div>
                  <div style={{ color: '#374151' }}>{device.notes || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}