import React, { useEffect, useMemo, useState } from 'react';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient
} from '../api/patients';

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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function getFullName(item) {
  return (
    item?.fullName ||
    item?.patientName ||
    `${item?.first_name || item?.firstName || ''} ${item?.last_name || item?.lastName || ''}`.trim() ||
    item?.name ||
    'Unnamed Patient'
  );
}

function complianceBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'critical') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (s === 'warning') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  return {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac'
  };
}

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  birth_date: '',
  cpap_model: '',
  usage_hours: '0',
  target_hours: '80',
  compliance_status: 'ok'
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      setLoading(true);
      setError('');
      const data = await getPatients();
      setPatients(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading patients:', err);
      setPatients([]);
      setError('Αποτυχία φόρτωσης patients.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      first_name: item.first_name || item.firstName || '',
      last_name: item.last_name || item.lastName || '',
      phone: item.phone || '',
      email: item.email || '',
      birth_date: item.birth_date || item.birthDate || '',
      cpap_model: item.cpap_model || item.cpapModel || '',
      usage_hours: String(item.usage_hours ?? item.usageHours ?? 0),
      target_hours: String(item.target_hours ?? item.targetHours ?? 80),
      compliance_status: item.compliance_status || item.complianceStatus || 'ok'
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Το όνομα και το επώνυμο είναι υποχρεωτικά.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        birth_date: form.birth_date || null,
        cpap_model: form.cpap_model.trim(),
        usage_hours: Number(form.usage_hours || 0),
        target_hours: Number(form.target_hours || 80),
        compliance_status: form.compliance_status
      };

      if (editingId) {
        await updatePatient(editingId, payload);
        setSuccess('Ο ασθενής ενημερώθηκε.');
      } else {
        await createPatient(payload);
        setSuccess('Ο ασθενής δημιουργήθηκε.');
      }

      resetForm();
      await loadPatients();
    } catch (err) {
      console.error('Error saving patient:', err);
      setError('Αποτυχία αποθήκευσης ασθενούς.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(patientId) {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτόν τον ασθενή;');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deletePatient(patientId);
      setSuccess('Ο ασθενής διαγράφηκε.');
      if (editingId === patientId) resetForm();
      await loadPatients();
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('Αποτυχία διαγραφής ασθενούς.');
    }
  }

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return patients.filter((item) => {
      const matchesSearch =
        !q ||
        getFullName(item).toLowerCase().includes(q) ||
        String(item.phone || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.cpap_model || item.cpapModel || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        String(item.compliance_status || item.complianceStatus || '').toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Patients</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Διαχείριση patient records, usage δεδομένων και βασικών compliance στοιχείων.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>
          {editingId ? 'Edit Patient' : 'Create Patient'}
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
                First Name
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Last Name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Birth Date
              </label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((prev) => ({ ...prev, birth_date: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                CPAP Model
              </label>
              <input
                type="text"
                value={form.cpap_model}
                onChange={(e) => setForm((prev) => ({ ...prev, cpap_model: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Usage Hours
              </label>
              <input
                type="number"
                value={form.usage_hours}
                onChange={(e) => setForm((prev) => ({ ...prev, usage_hours: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Target Hours
              </label>
              <input
                type="number"
                value={form.target_hours}
                onChange={(e) => setForm((prev) => ({ ...prev, target_hours: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Compliance Status
              </label>
              <select
                value={form.compliance_status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, compliance_status: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="ok">ok</option>
                <option value="warning">warning</option>
                <option value="critical">critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Patient' : 'Create Patient'}
            </button>

            <button type="button" style={buttonStyle} onClick={resetForm} disabled={saving}>
              Clear
            </button>

            <button type="button" style={buttonStyle} onClick={loadPatients} disabled={saving}>
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
              placeholder="name / phone / email / model"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Compliance Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="ok">ok</option>
              <option value="warning">warning</option>
              <option value="critical">critical</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Patient List</h2>

        {loading ? (
          <div>Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div>No patients found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredPatients.map((item, index) => (
              <div
                key={item.id || index}
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
                      {getFullName(item)}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        ...complianceBadgeStyle(
                          item.compliance_status || item.complianceStatus || 'ok'
                        )
                      }}
                    >
                      {item.compliance_status || item.complianceStatus || 'ok'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={buttonStyle} onClick={() => handleEdit(item)}>
                      Edit
                    </button>

                    <button
                      type="button"
                      style={dangerButtonStyle}
                      onClick={() => handleDelete(item.id)}
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
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                    <div style={{ fontWeight: 600 }}>{item.phone || '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Email</div>
                    <div style={{ fontWeight: 600 }}>{item.email || '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>CPAP Model</div>
                    <div style={{ fontWeight: 600 }}>
                      {item.cpap_model || item.cpapModel || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Usage</div>
                    <div style={{ fontWeight: 600 }}>
                      {item.usage_hours ?? item.usageHours ?? 0} /{' '}
                      {item.target_hours ?? item.targetHours ?? 80} ώρες
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Created: {formatDate(item.created_at || item.createdAt)} · Updated:{' '}
                  {formatDate(item.updated_at || item.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}