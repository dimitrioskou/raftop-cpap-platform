import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDoctorById, updateDoctor, deleteDoctor, linkPatientToDoctor } from '../api/doctors';
import { getPatientsLookup, getClinicsLookup, getOrganizationsLookup } from '../api/lookups';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignForm, setAssignForm] = useState({
    patient_id: '',
    relationship_type: 'referring'
  });

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    specialty: '',
    phone: '',
    email: '',
    clinic_name: '',
    notes: '',
    clinic_id: '',
    organization_id: ''
  });

  useEffect(() => {
    async function fetchDoctorPageData() {
      try {
        const [doctorData, patientsData, clinicsData, organizationsData] = await Promise.all([
          getDoctorById(id),
          getPatientsLookup(),
          getClinicsLookup(),
          getOrganizationsLookup()
        ]);

        setDoctor(doctorData);
        setPatients(patientsData || []);
        setClinics(clinicsData || []);
        setOrganizations(organizationsData || []);

        setForm({
          first_name: doctorData.first_name || '',
          last_name: doctorData.last_name || '',
          specialty: doctorData.specialty || '',
          phone: doctorData.phone || '',
          email: doctorData.email || '',
          clinic_name: doctorData.clinic_name || '',
          notes: doctorData.notes || '',
          clinic_id: doctorData.clinic_id || '',
          organization_id: doctorData.organization_id || ''
        });
      } catch (error) {
        console.error('Error loading doctor:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctorPageData();
  }, [id]);

  async function reloadDoctorOnly() {
    try {
      const doctorData = await getDoctorById(id);
      setDoctor(doctorData);
      setForm({
        first_name: doctorData.first_name || '',
        last_name: doctorData.last_name || '',
        specialty: doctorData.specialty || '',
        phone: doctorData.phone || '',
        email: doctorData.email || '',
        clinic_name: doctorData.clinic_name || '',
        notes: doctorData.notes || '',
        clinic_id: doctorData.clinic_id || '',
        organization_id: doctorData.organization_id || ''
      });
    } catch (error) {
      console.error('Error reloading doctor:', error);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await updateDoctor(id, {
        ...form,
        clinic_id: form.clinic_id || null,
        organization_id: form.organization_id || null
      });
      setDoctor({ ...doctor, ...updated });
      alert('Doctor updated successfully');
    } catch (error) {
      console.error('Update doctor error:', error);
      alert('Failed to update doctor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm('Are you sure you want to delete this doctor?');
    if (!ok) return;

    try {
      await deleteDoctor(id);
      alert('Doctor deleted successfully');
      navigate('/doctors');
    } catch (error) {
      console.error('Delete doctor error:', error);
      alert('Failed to delete doctor');
    }
  }

  async function handleAssignPatient(e) {
    e.preventDefault();

    try {
      await linkPatientToDoctor(id, assignForm);
      setAssignForm({
        patient_id: '',
        relationship_type: 'referring'
      });
      await reloadDoctorOnly();
      alert('Patient linked successfully');
    } catch (error) {
      console.error('Link patient error:', error);
      alert('Failed to link patient');
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading doctor...</div>;
  }

  if (!doctor) {
    return <div style={{ padding: 24 }}>Doctor not found</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/doctors">← Back to Doctors</Link>
      </div>

      <h1 style={{ marginBottom: 8 }}>Doctor Profile</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Edit doctor details and assign patients from the dashboard.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3>Edit Doctor</h3>

        <form
          onSubmit={handleSave}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First Name" />
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last Name" />
          <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Specialty" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder="Clinic Name" />

          <select value={form.organization_id} onChange={(e) => setForm({ ...form, organization_id: e.target.value })}>
            <option value="">Select Organization</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <select value={form.clinic_id} onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}>
            <option value="">Select Clinic</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleDelete}>
              Delete Doctor
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3>Assign Patient</h3>

        <form
          onSubmit={handleAssignPatient}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          <select
            value={assignForm.patient_id}
            onChange={(e) => setAssignForm({ ...assignForm, patient_id: e.target.value })}
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>

          <select
            value={assignForm.relationship_type}
            onChange={(e) => setAssignForm({ ...assignForm, relationship_type: e.target.value })}
          >
            <option value="referring">referring</option>
            <option value="supervising">supervising</option>
            <option value="follow_up">follow_up</option>
          </select>

          <button type="submit">Assign Patient</button>
        </form>
      </div>

      <div style={cardStyle}>
        <h3>Linked Patients</h3>

        {!doctor.linked_patients || doctor.linked_patients.length === 0 ? (
          <p>No linked patients.</p>
        ) : (
          <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th>Patient</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {doctor.linked_patients.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td>
                    {item.patients
                      ? `${item.patients.first_name || ''} ${item.patients.last_name || ''}`.trim()
                      : '-'}
                  </td>
                  <td>{item.patients?.phone || '-'}</td>
                  <td>{item.patients?.email || '-'}</td>
                  <td>{item.relationship_type || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
