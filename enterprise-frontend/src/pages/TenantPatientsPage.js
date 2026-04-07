import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/api';

function cardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function valueOrDash(value) {
  return value === null || typeof value === 'undefined' || value === ''
    ? '—'
    : String(value);
}

function resolvePatientRouteId(patient, index) {
  return (
    patient?.publicId ||
    patient?.placeholderId ||
    patient?.patientId ||
    patient?.id ||
    patient?.email ||
    `PATIENT-${index + 1}`
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/patients');
        const rows = Array.isArray(payload?.patients) ? payload.patients : [];

        if (!mounted) {
          return;
        }

        setPatients(rows);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'Failed to load patients');
        setPatients([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const normalized = String(query || '').trim().toLowerCase();

    if (!normalized) {
      return patients;
    }

    return patients.filter((patient) =>
      [
        patient?.fullName,
        patient?.name,
        patient?.email,
        patient?.phone,
        patient?.status,
        patient?.publicId
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [patients, query]);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>
            RAFTOP PATIENTS
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
            Patients
          </h1>
          <div style={{ color: '#667085' }}>
            Tenant patient registry and profile access.
          </div>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search patient, email, phone..."
          style={{
            width: 320,
            maxWidth: '100%',
            border: '1px solid #d0d5dd',
            borderRadius: 14,
            padding: '12px 14px',
            outline: 'none',
            fontSize: 14
          }}
        />
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            background: '#fff1f2',
            border: '1px solid #fda4af',
            color: '#b42318',
            borderRadius: 14,
            padding: '12px 14px',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading patients...</div>
      ) : filteredPatients.length === 0 ? (
        <div style={cardStyle()}>No patients found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredPatients.map((patient, index) => {
            const routeId = resolvePatientRouteId(patient, index);

            return (
              <div
                key={`${routeId}-${index}`}
                style={{
                  ...cardStyle(),
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
                  gap: 14,
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, color: '#101828', marginBottom: 4 }}>
                    {valueOrDash(patient?.fullName || patient?.name)}
                  </div>
                  <div style={{ color: '#667085', fontSize: 13 }}>
                    Email: {valueOrDash(patient?.email)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Phone</div>
                  <div style={{ fontWeight: 700 }}>{valueOrDash(patient?.phone)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Status</div>
                  <div style={{ fontWeight: 700 }}>{valueOrDash(patient?.status)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Patient ID</div>
                  <div style={{ fontWeight: 700 }}>
                    {valueOrDash(patient?.publicId || patient?.patientId || patient?.id)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/tenant/patients/${encodeURIComponent(routeId)}`)}
                  style={{
                    border: '1px solid #1d4ed8',
                    background: '#1d4ed8',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}