import React, { useEffect, useMemo, useState } from 'react';
import {
  getReferrals,
  createReferral,
  updateReferral,
  deleteReferral
} from '../api/referrals';

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

function priorityBadgeStyle(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'urgent') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (p === 'high') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (p === 'low') {
    return {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0'
    };
  }

  return {
    background: '#ede9fe',
    color: '#6d28d9',
    border: '1px solid #c4b5fd'
  };
}

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'completed') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (s === 'in_progress') {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (s === 'cancelled') {
    return {
      background: '#f3f4f6',
      color: '#4b5563',
      border: '1px solid #d1d5db'
    };
  }

  return {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d'
  };
}

const emptyForm = {
  patient_name: '',
  doctor_name: '',
  clinic_name: '',
  referral_reason: '',
  priority: 'medium',
  status: 'new',
  note: ''
};

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadReferrals();
  }, []);

  async function loadReferrals() {
    try {
      setLoading(true);
      setError('');
      const data = await getReferrals();
      setReferrals(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading referrals:', err);
      setReferrals([]);
      setError('Αποτυχία φόρτωσης referrals.');
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
      patient_name: item.patient_name || '',
      doctor_name: item.doctor_name || '',
      clinic_name: item.clinic_name || '',
      referral_reason: item.referral_reason || '',
      priority: item.priority || 'medium',
      status: item.status || 'new',
      note: item.note || ''
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.patient_name.trim()) {
      setError('Το patient name είναι υποχρεωτικό.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        patient_name: form.patient_name.trim(),
        doctor_name: form.doctor_name.trim(),
        clinic_name: form.clinic_name.trim(),
        referral_reason: form.referral_reason.trim(),
        priority: form.priority,
        status: form.status,
        note: form.note.trim()
      };

      if (editingId) {
        await updateReferral(editingId, payload);
        setSuccess('Το referral ενημερώθηκε.');
      } else {
        await createReferral(payload);
        setSuccess('Το referral δημιουργήθηκε.');
      }

      resetForm();
      await loadReferrals();
    } catch (err) {
      console.error('Error saving referral:', err);
      setError('Αποτυχία αποθήκευσης referral.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(referralId) {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτό το referral;');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteReferral(referralId);
      setSuccess('Το referral διαγράφηκε.');
      if (editingId === referralId) resetForm();
      await loadReferrals();
    } catch (err) {
      console.error('Error deleting referral:', err);
      setError('Αποτυχία διαγραφής referral.');
    }
  }

  const filteredReferrals = useMemo(() => {
    const q = search.trim().toLowerCase();

    return referrals.filter((item) => {
      const matchesSearch =
        !q ||
        String(item.patient_name || '').toLowerCase().includes(q) ||
        String(item.doctor_name || '').toLowerCase().includes(q) ||
        String(item.clinic_name || '').toLowerCase().includes(q) ||
        String(item.referral_reason || '').toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === 'all' ||
        String(item.priority || '').toLowerCase() === priorityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        String(item.status || '').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [referrals, search, priorityFilter, statusFilter]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Referrals</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Διαχείριση παραπομπών από ιατρούς, κλινικές και συνεργάτες.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>
          {editingId ? 'Edit Referral' : 'Create Referral'}
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
                Patient Name
              </label>
              <input
                type="text"
                value={form.patient_name}
                onChange={(e) => setForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Doctor Name
              </label>
              <input
                type="text"
                value={form.doctor_name}
                onChange={(e) => setForm((prev) => ({ ...prev, doctor_name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Clinic Name
              </label>
              <input
                type="text"
                value={form.clinic_name}
                onChange={(e) => setForm((prev) => ({ ...prev, clinic_name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                style={inputStyle}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
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
                <option value="new">new</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Referral Reason
            </label>
            <textarea
              rows={3}
              value={form.referral_reason}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, referral_reason: e.target.value }))
              }
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Note
            </label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Referral' : 'Create Referral'}
            </button>

            <button type="button" style={buttonStyle} onClick={resetForm} disabled={saving}>
              Clear
            </button>

            <button type="button" style={buttonStyle} onClick={loadReferrals} disabled={saving}>
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
              placeholder="patient / doctor / clinic"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
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
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Referral List</h2>

        {loading ? (
          <div>Loading referrals...</div>
        ) : filteredReferrals.length === 0 ? (
          <div>No referrals found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredReferrals.map((item, index) => (
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
                      {item.patient_name || 'Unknown Patient'}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          ...priorityBadgeStyle(item.priority)
                        }}
                      >
                        {item.priority || 'medium'}
                      </span>

                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          ...statusBadgeStyle(item.status)
                        }}
                      >
                        {item.status || 'new'}
                      </span>
                    </div>
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
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Doctor</div>
                    <div style={{ fontWeight: 600 }}>{item.doctor_name || '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Clinic</div>
                    <div style={{ fontWeight: 600 }}>{item.clinic_name || '-'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(item.created_at || item.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Referral Reason
                  </div>
                  <div style={{ color: '#374151' }}>{item.referral_reason || '-'}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Note
                  </div>
                  <div style={{ color: '#374151' }}>{item.note || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}