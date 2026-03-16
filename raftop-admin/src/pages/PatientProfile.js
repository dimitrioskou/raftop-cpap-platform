import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatientById, deletePatient } from '../api/patients';

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

function formatDateOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('el-GR');
}

function fullName(patient) {
  return `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown Patient';
}

export default function PatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function loadPatient() {
    try {
      setLoading(true);
      setError('');
      const data = await getPatientById(patientId);
      setPatient(data || null);
    } catch (err) {
      console.error('Error loading patient profile:', err);
      setPatient(null);
      setError('Αποτυχία φόρτωσης patient profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτόν τον ασθενή;');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await deletePatient(patientId);
      navigate('/patients');
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('Αποτυχία διαγραφής ασθενούς.');
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
          <h1 style={{ marginBottom: 8 }}>Patient Profile</h1>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Αναλυτική προβολή ασθενή και βασικών στοιχείων επικοινωνίας.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => navigate('/patients')}>
            Back to Patients
          </button>

          <button
            type="button"
            style={dangerButtonStyle}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Patient'}
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
        <div style={cardStyle}>Loading patient profile...</div>
      ) : !patient ? (
        <div style={cardStyle}>Patient not found.</div>
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
              <div style={{ fontSize: 13, color: '#6b7280' }}>Full Name</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {fullName(patient)}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Phone</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {patient.phone || '-'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Email</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {patient.email || '-'}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Patient ID</div>
                <div style={{ fontWeight: 600 }}>{patient.id || '-'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Date of Birth</div>
                <div style={{ fontWeight: 600 }}>
                  {formatDateOnly(patient.date_of_birth)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                <div style={{ fontWeight: 600 }}>
                  {formatDate(patient.created_at || patient.createdAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Updated</div>
                <div style={{ fontWeight: 600 }}>
                  {formatDate(patient.updated_at || patient.updatedAt)}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Notes
              </div>
              <div style={{ color: '#374151' }}>
                {patient.notes || '-'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}