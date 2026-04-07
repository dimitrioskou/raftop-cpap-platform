import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FeatureGate from '../components/tenant/FeatureGate';
import ApiStatusNotice from '../components/common/ApiStatusNotice';
import { FEATURE_KEYS } from '../utils/planFeatures';
import { useTenant } from '../context/TenantContext';
import { getTenantPatients } from '../api/tenant';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 20,
    padding: 20,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
  };
}

function statCardStyle() {
  return {
    ...cardStyle(),
    minHeight: 138,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePatient(row = {}) {
  return {
    id: String(row.id || ''),
    fullName: row.fullName || row.full_name || row.name || 'Unknown',
    doctor: row.doctor || row.doctor_name || '—',
    serial: row.serial || row.deviceSerial || '—',
    complianceHours: safe(row.complianceHours ?? row.compliance_hours),
    ahi: safe(row.ahi),
    status: String(row.status || 'stable').toLowerCase()
  };
}

function extractRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
}

const FALLBACK_PATIENTS = [
  {
    id: 'PT-1001',
    fullName: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    serial: 'RM-22341',
    complianceHours: 92,
    ahi: 3.1,
    status: 'stable'
  },
  {
    id: 'PT-1002',
    fullName: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    serial: 'RM-22342',
    complianceHours: 61,
    ahi: 8.4,
    status: 'warning'
  },
  {
    id: 'PT-1003',
    fullName: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    serial: 'RM-22343',
    complianceHours: 44,
    ahi: 11.2,
    status: 'critical'
  },
  {
    id: 'PT-1004',
    fullName: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    serial: 'RM-22344',
    complianceHours: 108,
    ahi: 2.8,
    status: 'stable'
  }
];

function badgeStyle(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'critical') {
    return {
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#b91c1c'
    };
  }

  if (value === 'warning') {
    return {
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      color: '#92400e'
    };
  }

  return {
    background: '#dcfce7',
    border: '1px solid #86efac',
    color: '#166534'
  };
}

export default function TenantPatientsPage() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || 'demo-tenant';

  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState(FALLBACK_PATIENTS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [notice, setNotice] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setNotice('');

      const response = await getTenantPatients({
        tenantId,
        query: search ? { q: search } : {}
      });

      const rows = extractRows(response).map(normalizePatient);
      setPatients(rows);
      setUsingFallback(false);
    } catch (error) {
      console.error(error);
      const q = String(search || '').trim().toLowerCase();

      const filteredFallback = !q
        ? FALLBACK_PATIENTS
        : FALLBACK_PATIENTS.filter((item) =>
            [item.id, item.fullName, item.doctor, item.serial, item.status]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(q))
          );

      setPatients(filteredFallback);
      setUsingFallback(true);
      setNotice(error.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const stats = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter((p) => p.status === 'critical').length;
    const warning = patients.filter((p) => p.status === 'warning').length;
    const stable = patients.filter((p) => p.status === 'stable').length;

    return { total, critical, warning, stable };
  }, [patients]);

  return (
    <FeatureGate feature={FEATURE_KEYS.PATIENTS}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            ...cardStyle(),
            background:
              'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.08)), #ffffff'
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748b',
              marginBottom: 8
            }}
          >
            Tenant Workspace
          </div>

          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, color: '#0f172a' }}>
            Patients
          </h1>

          <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
            Operational patient registry για compliance follow-up, device mapping και doctor-level visibility.
          </p>
        </div>

        {(loading || usingFallback || notice) && (
          <ApiStatusNotice
            state={loading ? 'loading' : usingFallback ? 'fallback' : 'error'}
            message={
              loading
                ? 'Loading patient registry...'
                : usingFallback
                  ? `Using fallback patient data because API is unavailable: ${notice || 'Unknown error'}`
                  : notice
            }
          />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          <div style={statCardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Patients
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#0f172a' }}>{stats.total}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>All synced / registered patients</div>
          </div>

          <div style={statCardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Critical
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#b91c1c' }}>{stats.critical}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>Immediate intervention needed</div>
          </div>

          <div style={statCardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Warning
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#92400e' }}>{stats.warning}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>Needs follow-up review</div>
          </div>

          <div style={statCardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Stable
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#166534' }}>{stats.stable}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>Healthy current compliance profile</div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ marginBottom: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, doctor, id, serial..."
              style={{
                width: '100%',
                borderRadius: 14,
                border: '1px solid #d1d5db',
                padding: '13px 14px',
                fontSize: 14,
                outline: 'none',
                background: '#ffffff',
                color: '#0f172a'
              }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Patient', 'Doctor', 'Device', 'Hours / Month', 'AHI', 'Status'].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: 'left',
                        padding: '12px 10px',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: 12,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em'
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '22px 10px',
                        color: '#64748b',
                        fontSize: 14
                      }}
                    >
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id}>
                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7'
                        }}
                      >
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>
                          {patient.fullName}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                          {patient.id}
                        </div>
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7',
                          color: '#0f172a'
                        }}
                      >
                        {patient.doctor}
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7',
                          color: '#0f172a'
                        }}
                      >
                        {patient.serial}
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7',
                          color: '#0f172a',
                          fontWeight: 800
                        }}
                      >
                        {patient.complianceHours}
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7',
                          color: '#0f172a',
                          fontWeight: 800
                        }}
                      >
                        {patient.ahi}
                      </td>

                      <td
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #eef2f7'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '7px 11px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            ...badgeStyle(patient.status)
                          }}
                        >
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {usingFallback && (
          <ApiStatusNotice
            state="fallback"
            message="Backend integration is wired. When the tenant API returns live patient data, this page will switch automatically from fallback to real values."
          />
        )}
      </div>
    </FeatureGate>
  );
}