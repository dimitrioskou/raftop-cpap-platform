import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTenantDoctor,
  deleteTenantDoctor,
  getTenantDoctors,
  updateTenantDoctor
} from '../api/tenant';
import { ErrorBanner, SuccessBanner } from '../components/SystemBanner';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function inputStyle() {
  return {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid #dbe2ea',
    background: '#ffffff',
    fontSize: 14,
    boxSizing: 'border-box'
  };
}

function buttonStyle(variant = 'primary', disabled = false) {
  const base = {
    border: 'none',
    borderRadius: 10,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    opacity: disabled ? 0.7 : 1
  };

  if (variant === 'secondary') {
    return { ...base, background: '#e2e8f0', color: '#0f172a' };
  }

  if (variant === 'danger') {
    return { ...base, background: '#ef4444', color: '#ffffff' };
  }

  if (variant === 'success') {
    return { ...base, background: '#16a34a', color: '#ffffff' };
  }

  return { ...base, background: '#2563eb', color: '#ffffff' };
}

function normalizeDoctor(row = {}) {
  return {
    id: row.id,
    full_name: row.full_name || row.name || 'Unknown Doctor',
    specialty: row.specialty || 'General',
    email: row.email || '',
    phone: row.phone || '',
    clinic: row.clinic || '',
    city: row.city || '',
    status: row.status || 'active',
    patients_count: Number(row.patients_count || 0),
    active_cases: Number(row.active_cases || 0),
    compliance_rate: Number(row.compliance_rate || 0),
    referrals_count: Number(row.referrals_count || 0),
    revenue: Number(row.revenue || 0),
    notes: row.notes || ''
  };
}

const emptyForm = {
  full_name: '',
  specialty: '',
  email: '',
  phone: '',
  clinic: '',
  city: '',
  status: 'active',
  notes: ''
};

export default function TenantDoctorsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadRows() {
    try {
      setLoading(true);
      setError('');
      const result = await getTenantDoctors();
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setRows(list.map(normalizeDoctor));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [
        row.full_name,
        row.specialty,
        row.email,
        row.phone,
        row.clinic,
        row.city,
        row.status
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      full_name: row.full_name || '',
      specialty: row.specialty || '',
      email: row.email || '',
      phone: row.phone || '',
      clinic: row.clinic || '',
      city: row.city || '',
      status: row.status || 'active',
      notes: row.notes || ''
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setError('Doctor name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        full_name: form.full_name,
        specialty: form.specialty,
        email: form.email,
        phone: form.phone,
        clinic: form.clinic,
        city: form.city,
        status: form.status,
        notes: form.notes
      };

      if (editingId) {
        await updateTenantDoctor(editingId, payload);
        setSuccess('Doctor updated successfully.');
      } else {
        await createTenantDoctor(payload);
        setSuccess('Doctor created successfully.');
      }

      resetForm();
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      setError('');
      setSuccess('');
      await deleteTenantDoctor(id);
      setSuccess('Doctor deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete doctor');
    }
  }

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      patients: rows.reduce((sum, r) => sum + r.patients_count, 0),
      revenue: rows.reduce((sum, r) => sum + r.revenue, 0)
    };
  }, [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Doctors</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Manage doctor partners, specialties, and performance.
        </p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16
        }}
      >
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Doctors</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Active</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.active}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Patients</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.patients}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>€{stats.revenue}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 20
        }}
      >
        <form onSubmit={handleSubmit} style={cardStyle()}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
            {editingId ? 'Edit Doctor' : 'Add Doctor'}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              style={inputStyle()}
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => updateForm('full_name', e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Specialty"
              value={form.specialty}
              onChange={(e) => updateForm('specialty', e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Email"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="Clinic"
              value={form.clinic}
              onChange={(e) => updateForm('clinic', e.target.value)}
            />
            <input
              style={inputStyle()}
              placeholder="City"
              value={form.city}
              onChange={(e) => updateForm('city', e.target.value)}
            />
            <select
              style={inputStyle()}
              value={form.status}
              onChange={(e) => updateForm('status', e.target.value)}
            >
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="inactive">inactive</option>
            </select>
            <textarea
              style={{ ...inputStyle(), minHeight: 100, resize: 'vertical' }}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} style={buttonStyle('primary', saving)}>
                {saving ? 'Saving...' : editingId ? 'Update Doctor' : 'Create Doctor'}
              </button>
              <button type="button" onClick={resetForm} style={buttonStyle('secondary')}>
                Reset
              </button>
            </div>
          </div>
        </form>

        <div style={{ ...cardStyle(), padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: 16,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>Doctor Registry</div>
            <input
              style={{ ...inputStyle(), maxWidth: 260 }}
              placeholder="Search doctors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>Loading doctors...</div>
          ) : filteredRows.length === 0 ? (
            <div style={{ padding: 20, color: '#64748b' }}>No doctors found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: 14 }}>Doctor</th>
                    <th style={{ padding: 14 }}>Specialty</th>
                    <th style={{ padding: 14 }}>Clinic</th>
                    <th style={{ padding: 14 }}>Patients</th>
                    <th style={{ padding: 14 }}>Cases</th>
                    <th style={{ padding: 14 }}>Revenue</th>
                    <th style={{ padding: 14 }}>Status</th>
                    <th style={{ padding: 14 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderTop: '1px solid #e5e7eb', cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                      onClick={() => navigate(`/tenant/doctors/${row.id}`)}
                    >
                      <td style={{ padding: 14 }}>
                        <div style={{ fontWeight: 700 }}>{row.full_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{row.email || '-'}</div>
                      </td>
                      <td style={{ padding: 14 }}>{row.specialty}</td>
                      <td style={{ padding: 14 }}>
                        {row.clinic || '-'}
                        <div style={{ fontSize: 12, color: '#64748b' }}>{row.city || '-'}</div>
                      </td>
                      <td style={{ padding: 14 }}>{row.patients_count}</td>
                      <td style={{ padding: 14 }}>{row.active_cases}</td>
                      <td style={{ padding: 14 }}>€{row.revenue}</td>
                      <td style={{ padding: 14 }}>{row.status}</td>
                      <td
                        style={{ padding: 14 }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" style={buttonStyle('secondary')} onClick={() => startEdit(row)}>
                            Edit
                          </button>
                          <button type="button" style={buttonStyle('success')} onClick={() => navigate(`/tenant/doctors/${row.id}`)}>
                            Open
                          </button>
                          <button type="button" style={buttonStyle('danger')} onClick={() => handleDelete(row.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}