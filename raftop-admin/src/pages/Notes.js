import React, { useEffect, useMemo, useState } from 'react';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} from '../api/notes';

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

function getPatientName(note) {
  return (
    note?.patient_name ||
    note?.patientName ||
    note?.fullName ||
    note?.name ||
    'General Note'
  );
}

const emptyForm = {
  title: '',
  note: '',
  category: 'general',
  patient_name: ''
};

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setLoading(true);
      setError('');
      const data = await getNotes();
      setNotes(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading notes:', err);
      setNotes([]);
      setError('Αποτυχία φόρτωσης notes.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(note) {
    setEditingId(note.id);
    setForm({
      title: note.title || '',
      note: note.note || '',
      category: note.category || 'general',
      patient_name: note.patient_name || note.patientName || ''
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.note.trim()) {
      setError('Το note είναι υποχρεωτικό.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        title: form.title.trim(),
        note: form.note.trim(),
        category: form.category,
        patient_name: form.patient_name.trim()
      };

      if (editingId) {
        await updateNote(editingId, payload);
        setSuccess('Το note ενημερώθηκε.');
      } else {
        await createNote(payload);
        setSuccess('Το note δημιουργήθηκε.');
      }

      resetForm();
      await loadNotes();
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Αποτυχία αποθήκευσης note.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId) {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτό το note;');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteNote(noteId);
      setSuccess('Το note διαγράφηκε.');
      if (editingId === noteId) resetForm();
      await loadNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Αποτυχία διαγραφής note.');
    }
  }

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return notes.filter((item) => {
      const matchesSearch =
        !q ||
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.note || '').toLowerCase().includes(q) ||
        String(item.patient_name || item.patientName || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === 'all' ||
        String(item.category || '').toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [notes, search, categoryFilter]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Notes</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Αποθήκευση operational notes, patient comments και εσωτερικών παρατηρήσεων.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>
          {editingId ? 'Edit Note' : 'Create Note'}
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
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                style={inputStyle}
                placeholder="π.χ. Patient communication note"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Patient
              </label>
              <input
                type="text"
                value={form.patient_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, patient_name: e.target.value }))
                }
                style={inputStyle}
                placeholder="Patient name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                style={inputStyle}
              >
                <option value="general">general</option>
                <option value="patient">patient</option>
                <option value="followup">followup</option>
                <option value="device">device</option>
                <option value="compliance">compliance</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Note
            </label>
            <textarea
              rows={5}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Write internal note..."
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Note' : 'Create Note'}
            </button>

            <button type="button" style={buttonStyle} onClick={resetForm} disabled={saving}>
              Clear
            </button>

            <button type="button" style={buttonStyle} onClick={loadNotes} disabled={saving}>
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
              placeholder="title / patient / note"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="general">general</option>
              <option value="patient">patient</option>
              <option value="followup">followup</option>
              <option value="device">device</option>
              <option value="compliance">compliance</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Note List</h2>

        {loading ? (
          <div>Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div>No notes found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredNotes.map((item, index) => (
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
                      {item.title || 'Untitled Note'}
                    </div>
                    <div style={{ color: '#4b5563' }}>
                      {getPatientName(item)} · {item.category || 'general'}
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

                <div style={{ color: '#374151', marginBottom: 12 }}>
                  {item.note || 'No note.'}
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