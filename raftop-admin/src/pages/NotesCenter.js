import React, { useEffect, useMemo, useState } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../api/notes';
import {
  getPatientsLookup,
  getDoctorsLookup,
  getOrganizationsLookup,
  getClinicsLookup
} from '../api/lookups';
import { getReferrals } from '../api/referrals';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function NotesCenter() {
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [noteTypeFilter, setNoteTypeFilter] = useState('');

  const [form, setForm] = useState({
    title: '',
    body: '',
    note_type: 'general',
    patient_id: '',
    doctor_id: '',
    referral_id: '',
    clinic_id: '',
    organization_id: '',
    author_name: 'Admin'
  });

  async function loadAll() {
    try {
      const [
        notesData,
        patientsData,
        doctorsData,
        referralsData,
        clinicsData,
        organizationsData
      ] = await Promise.all([
        getNotes(),
        getPatientsLookup(),
        getDoctorsLookup(),
        getReferrals(),
        getClinicsLookup(),
        getOrganizationsLookup()
      ]);

      setNotes(notesData || []);
      setPatients(patientsData || []);
      setDoctors(doctorsData || []);
      setReferrals(referralsData || []);
      setClinics(clinicsData || []);
      setOrganizations(organizationsData || []);
    } catch (error) {
      console.error('Error loading notes center:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => !noteTypeFilter || n.note_type === noteTypeFilter);
  }, [notes, noteTypeFilter]);

  async function handleCreateNote(e) {
    e.preventDefault();

    try {
      await createNote({
        ...form,
        patient_id: form.patient_id || null,
        doctor_id: form.doctor_id || null,
        referral_id: form.referral_id || null,
        clinic_id: form.clinic_id || null,
        organization_id: form.organization_id || null
      });

      setForm({
        title: '',
        body: '',
        note_type: 'general',
        patient_id: '',
        doctor_id: '',
        referral_id: '',
        clinic_id: '',
        organization_id: '',
        author_name: 'Admin'
      });

      setLoading(true);
      await loadAll();
    } catch (error) {
      console.error('Create note error:', error);
      alert('Failed to create note');
    }
  }

  async function handleDeleteNote(id) {
    const ok = window.confirm('Delete this note?');
    if (!ok) return;

    try {
      await deleteNote(id);
      setLoading(true);
      await loadAll();
    } catch (error) {
      console.error('Delete note error:', error);
      alert('Failed to delete note');
    }
  }

  async function handleQuickPromote(id) {
    try {
      await updateNote(id, { note_type: 'important' });
      setLoading(true);
      await loadAll();
    } catch (error) {
      console.error('Update note error:', error);
      alert('Failed to update note');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Notes Center</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Central note system for patients, doctors, referrals and operations.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3>Create Note</h3>

        <form
          onSubmit={handleCreateNote}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            placeholder="Body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />

          <select
            value={form.note_type}
            onChange={(e) => setForm({ ...form, note_type: e.target.value })}
          >
            <option value="general">general</option>
            <option value="patient">patient</option>
            <option value="doctor">doctor</option>
            <option value="referral">referral</option>
            <option value="important">important</option>
          </select>

          <select
            value={form.patient_id}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>

          <select
            value={form.doctor_id}
            onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.first_name && d.last_name
                  ? `${d.first_name} ${d.last_name}`
                  : d.name || d.email || d.id}
              </option>
            ))}
          </select>

          <select
            value={form.referral_id}
            onChange={(e) => setForm({ ...form, referral_id: e.target.value })}
          >
            <option value="">Select Referral</option>
            {referrals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>

          <select
            value={form.clinic_id}
            onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
          >
            <option value="">Select Clinic</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={form.organization_id}
            onChange={(e) => setForm({ ...form, organization_id: e.target.value })}
          >
            <option value="">Select Organization</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Author Name"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          />

          <button type="submit">Create Note</button>
        </form>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <select
          value={noteTypeFilter}
          onChange={(e) => setNoteTypeFilter(e.target.value)}
        >
          <option value="">All Note Types</option>
          <option value="general">general</option>
          <option value="patient">patient</option>
          <option value="doctor">doctor</option>
          <option value="referral">referral</option>
          <option value="important">important</option>
        </select>
      </div>

      <div style={cardStyle}>
        {loading ? (
          <p>Loading notes...</p>
        ) : filteredNotes.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th>Title</th>
                <th>Type</th>
                <th>Author</th>
                <th>Patient</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note) => (
                <tr key={note.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td>{note.title}</td>
                  <td>{note.note_type}</td>
                  <td>{note.author_name || '-'}</td>
                  <td>
                    {note.patients
                      ? `${note.patients.first_name || ''} ${note.patients.last_name || ''}`.trim()
                      : '-'}
                  </td>
                  <td>{note.created_at ? new Date(note.created_at).toLocaleString() : '-'}</td>
                  <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => handleQuickPromote(note.id)}>Mark Important</button>
                    <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
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
