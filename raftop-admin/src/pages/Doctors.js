import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDoctors, createDoctor } from '../api/doctors';
import { getClinicsLookup, getOrganizationsLookup } from '../api/lookups';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    specialty: '',
    phone: '',
    email: '',
    clinic_name: '',
    notes: '',
    organization_id: '',
    clinic_id: ''
  });

  async function loadAll() {
    try {
      const [doctorsData, clinicsData, organizationsData] = await Promise.all([
        getDoctors(),
        getClinicsLookup(),
        getOrganizationsLookup()
      ]);

      setDoctors(doctorsData || []);
      setClinics(clinicsData || []);
      setOrganizations(organizationsData || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const specialties = useMemo(() => {
    return [...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const fullName = `${doctor.first_name || ''} ${doctor.last_name || ''}`.toLowerCase();
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(searchValue) ||
        doctor.email?.toLowerCase().includes(searchValue) ||
        doctor.clinic_name?.toLowerCase().includes(searchValue);

      const matchesSpecialty =
        !specialtyFilter || doctor.specialty === specialtyFilter;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  async function handleCreateDoctor(e) {
    e.preventDefault();

    try {
      await createDoctor({
        ...form,
        organization_id: form.organization_id || null,
        clinic_id: form.clinic_id || null
      });

      setForm({
        first_name: '',
        last_name: '',
        specialty: '',
        phone: '',
        email: '',
        clinic_name: '',
        notes: '',
        organization_id: '',
        clinic_id: ''
      });

      setLoading(true);
      await loadAll();
    } catch (error) {
      console.error('Create doctor error:', error);
      alert('Failed to create doctor');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Doctor System</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Manage referring doctors and clinical relationships.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3>Create Doctor</h3>

        <form
          onSubmit={handleCreateDoctor}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          <input
            placeholder="First Name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />

          <input
            placeholder="Last Name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />

          <input
            placeholder="Specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />

          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Clinic Name"
            value={form.clinic_name}
            onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
          />

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

          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <button type="submit" style={{ padding: '10px 16px' }}>
            Create Doctor
          </button>
        </form>
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <input
          type="text"
          placeholder="Search doctor, email, clinic"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 12px',
            minWidth: 260,
            border: '1px solid #d1d5db',
            borderRadius: 8
          }}
        />

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            minWidth: 220,
            border: '1px solid #d1d5db',
            borderRadius: 8
          }}
        >
          <option value="">All Specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        {loading ? (
          <p>Loading doctors...</p>
        ) : filteredDoctors.length === 0 ? (
          <p>No doctors found.</p>
        ) : (
          <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th>Name</th>
                <th>Specialty</th>
                <th>Clinic</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td>{doctor.first_name} {doctor.last_name}</td>
                  <td>{doctor.specialty || '-'}</td>
                  <td>{doctor.clinic_name || '-'}</td>
                  <td>{doctor.phone || '-'}</td>
                  <td>{doctor.email || '-'}</td>
                  <td>
                    <Link to={`/doctors/${doctor.id}`}>Open</Link>
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