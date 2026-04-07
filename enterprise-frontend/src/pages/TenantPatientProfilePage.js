import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FeatureGate from '../components/tenant/FeatureGate';
import ApiStatusNotice from '../components/common/ApiStatusNotice';
import { FEATURE_KEYS } from '../utils/planFeatures';
import { useTenant } from '../context/TenantContext';
import {
  getTenantPatients,
  getTenantDevices,
  getTenantCompliance,
  getTenantFollowups,
  getTenantNotes
} from '../api/tenant';
import { getAtlasQueue } from '../api/atlas';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 20,
    padding: 20,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)'
  };
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data?.items)) return result.data.items;
  return [];
}

function normalizePatient(row = {}) {
  return {
    id: String(row.id || ''),
    fullName: row.fullName || row.full_name || row.name || 'Unknown',
    doctor: row.doctor || row.doctor_name || '—',
    serial: row.serial || '—',
    complianceHours: safe(row.complianceHours ?? row.compliance_hours),
    ahi: safe(row.ahi),
    status: String(row.status || 'stable').toLowerCase()
  };
}

function normalizeDevice(row = {}) {
  return {
    id: String(row.id || ''),
    serial: row.serial || '—',
    patientName: row.patient || row.patient_name || row.patientName || 'Unknown',
    doctor: row.doctor || row.doctor_name || '—',
    lastSync: row.lastSync || row.last_sync || '—',
    usage7d: safe(row.usage7d ?? row.usage_7d),
    leak: safe(row.leak),
    status: String(row.status || 'online').toLowerCase()
  };
}

function normalizeCompliance(row = {}) {
  return {
    id: String(row.id || ''),
    patientName: row.patient || row.patient_name || 'Unknown',
    doctor: row.doctor || row.doctor_name || '—',
    hours: safe(row.hours ?? row.complianceHours ?? row.compliance_hours),
    trend: row.trend || '0h',
    status: String(row.status || 'compliant').toLowerCase()
  };
}

function normalizeFollowup(row = {}) {
  return {
    id: String(row.id || ''),
    patientName: row.patient || row.patient_name || 'Unknown',
    reason: row.reason || '-',
    owner: row.owner || '—',
    priority: String(row.priority || 'normal').toLowerCase(),
    outcome: row.outcome || 'Pending',
    nextAction: row.nextAction || row.next_action || 'Review case'
  };
}

function normalizeNote(row = {}) {
  return {
    id: String(row.id || ''),
    patientName: row.patient || row.patient_name || 'Unknown',
    author: row.author || '—',
    category: String(row.category || 'general').toLowerCase(),
    createdAt: row.createdAt || row.created_at || '—',
    text: row.text || row.note || row.body || 'No note text'
  };
}

function normalizeAtlasCase(row = {}) {
  return {
    id: String(row.id || ''),
    patientName: row.patientName || row.patient_name || 'Unknown',
    actionGroupName: row.actionGroupName || row.action_group_name || '-',
    reason: row.reason || '-',
    priority: String(row.priority || 'medium').toLowerCase(),
    score: safe(row.score),
    revenueEstimate: safe(row.revenueEstimate ?? row.revenue_estimate),
    status: String(row.status || 'open').toLowerCase()
  };
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

const FALLBACK_DEVICES = [
  {
    id: 'DV-1001',
    serial: 'RM-22341',
    patientName: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    lastSync: '2026-03-31 08:55',
    usage7d: 7.2,
    leak: 8,
    status: 'online'
  },
  {
    id: 'DV-1002',
    serial: 'RM-22342',
    patientName: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    lastSync: '2026-03-29 12:20',
    usage7d: 4.8,
    leak: 18,
    status: 'warning'
  },
  {
    id: 'DV-1003',
    serial: 'RM-22343',
    patientName: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    lastSync: '2026-03-24 09:10',
    usage7d: 3.1,
    leak: 26,
    status: 'offline'
  },
  {
    id: 'DV-1004',
    serial: 'RM-22344',
    patientName: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    lastSync: '2026-03-31 09:02',
    usage7d: 8.0,
    leak: 6,
    status: 'online'
  }
];

const FALLBACK_COMPLIANCE = [
  {
    id: 'CMP-PT-1001',
    patientName: 'Giorgos Papadakis',
    doctor: 'Dr. Maria Papadopoulou',
    hours: 92,
    trend: '+8h',
    status: 'compliant'
  },
  {
    id: 'CMP-PT-1002',
    patientName: 'Eleni Kosta',
    doctor: 'Dr. Nikos Andreou',
    hours: 61,
    trend: '-7h',
    status: 'warning'
  },
  {
    id: 'CMP-PT-1003',
    patientName: 'Dimitris Leonidas',
    doctor: 'Dr. Eleni Perraki',
    hours: 44,
    trend: '-15h',
    status: 'critical'
  },
  {
    id: 'CMP-PT-1004',
    patientName: 'Maria Ioannou',
    doctor: 'Dr. George Dimitriou',
    hours: 108,
    trend: '+4h',
    status: 'compliant'
  }
];

const FALLBACK_FOLLOWUPS = [
  {
    id: 'FU-001',
    patientName: 'Eleni Kosta',
    reason: 'Below 80h compliance',
    owner: 'Follow-up Manager',
    priority: 'high',
    outcome: 'Callback requested',
    nextAction: 'Call tomorrow 10:00'
  },
  {
    id: 'FU-002',
    patientName: 'Dimitris Leonidas',
    reason: 'Critical usage drop',
    owner: 'Operations Admin',
    priority: 'critical',
    outcome: 'No answer',
    nextAction: 'Escalate to doctor'
  },
  {
    id: 'FU-004',
    patientName: 'Maria Ioannou',
    reason: 'Mask leak review',
    owner: 'Operations Admin',
    priority: 'high',
    outcome: 'Promised improvement',
    nextAction: 'Recheck in 3 days'
  }
];

const FALLBACK_NOTES = [
  {
    id: 'NT-001',
    patientName: 'Eleni Kosta',
    author: 'Follow-up Manager',
    category: 'followup',
    createdAt: '2026-03-31 09:10',
    text: 'Patient requested callback after 18:00 λόγω εργασίας.'
  },
  {
    id: 'NT-002',
    patientName: 'Dimitris Leonidas',
    author: 'Operations Admin',
    category: 'critical',
    createdAt: '2026-03-31 08:45',
    text: 'Σημαντική πτώση συμμόρφωσης και επαναλαμβανόμενο no-answer.'
  },
  {
    id: 'NT-003',
    patientName: 'Maria Ioannou',
    author: 'Operations Admin',
    category: 'device',
    createdAt: '2026-03-30 17:20',
    text: 'Παρατηρήθηκε αυξημένο leak για δύο συνεχόμενες νύχτες.'
  }
];

const FALLBACK_ATLAS = [
  {
    id: 'AT-001',
    patientName: 'Dimitris Leonidas',
    actionGroupName: 'Critical Compliance Drop',
    reason: 'Usage below target for 5 days',
    priority: 'critical',
    score: 94,
    revenueEstimate: 420,
    status: 'open'
  },
  {
    id: 'AT-002',
    patientName: 'Eleni Kosta',
    actionGroupName: 'Callback Requested',
    reason: 'Patient requested evening call',
    priority: 'high',
    score: 76,
    revenueEstimate: 180,
    status: 'open'
  },
  {
    id: 'AT-003',
    patientName: 'Maria Ioannou',
    actionGroupName: 'Mask Leak Watch',
    reason: 'Leak increased for 2 consecutive nights',
    priority: 'medium',
    score: 58,
    revenueEstimate: 90,
    status: 'monitoring'
  }
];

function statusTone(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'critical' || value === 'offline') {
    return {
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#b91c1c'
    };
  }

  if (value === 'warning' || value === 'high') {
    return {
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      color: '#92400e'
    };
  }

  if (value === 'online' || value === 'compliant' || value === 'stable') {
    return {
      background: '#dcfce7',
      border: '1px solid #86efac',
      color: '#166534'
    };
  }

  return {
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    color: '#1d4ed8'
  };
}

export default function TenantPatientProfilePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id || 'demo-tenant';

  const [patients, setPatients] = useState(FALLBACK_PATIENTS);
  const [devices, setDevices] = useState(FALLBACK_DEVICES);
  const [compliance, setCompliance] = useState(FALLBACK_COMPLIANCE);
  const [followups, setFollowups] = useState(FALLBACK_FOLLOWUPS);
  const [notes, setNotes] = useState(FALLBACK_NOTES);
  const [atlasCases, setAtlasCases] = useState(FALLBACK_ATLAS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setNotice('');

      const [patientsRes, devicesRes, complianceRes, followupsRes, notesRes, atlasRes] =
        await Promise.all([
          getTenantPatients({ tenantId }),
          getTenantDevices({ tenantId }),
          getTenantCompliance({ tenantId }),
          getTenantFollowups({ tenantId }),
          getTenantNotes({ tenantId }),
          getAtlasQueue({ tenantId })
        ]);

      setPatients(extractRows(patientsRes).map(normalizePatient));
      setDevices(extractRows(devicesRes).map(normalizeDevice));
      setCompliance(extractRows(complianceRes).map(normalizeCompliance));
      setFollowups(extractRows(followupsRes).map(normalizeFollowup));
      setNotes(extractRows(notesRes).map(normalizeNote));
      setAtlasCases(extractRows(atlasRes).map(normalizeAtlasCase));
      setUsingFallback(false);
    } catch (error) {
      console.error(error);
      setPatients(FALLBACK_PATIENTS);
      setDevices(FALLBACK_DEVICES);
      setCompliance(FALLBACK_COMPLIANCE);
      setFollowups(FALLBACK_FOLLOWUPS);
      setNotes(FALLBACK_NOTES);
      setAtlasCases(FALLBACK_ATLAS);
      setUsingFallback(true);
      setNotice(error.message || 'Failed to load patient profile.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patient = useMemo(() => {
    return (
      patients.find((item) => String(item.id) === String(patientId)) ||
      patients[0] ||
      null
    );
  }, [patients, patientId]);

  const patientDevices = useMemo(() => {
    if (!patient) return [];
    return devices.filter(
      (item) =>
        String(item.patientName).toLowerCase() === String(patient.fullName).toLowerCase() ||
        String(item.serial) === String(patient.serial)
    );
  }, [devices, patient]);

  const patientCompliance = useMemo(() => {
    if (!patient) return null;
    return (
      compliance.find(
        (item) =>
          String(item.patientName).toLowerCase() === String(patient.fullName).toLowerCase()
      ) || null
    );
  }, [compliance, patient]);

  const patientFollowups = useMemo(() => {
    if (!patient) return [];
    return followups.filter(
      (item) =>
        String(item.patientName).toLowerCase() === String(patient.fullName).toLowerCase()
    );
  }, [followups, patient]);

  const patientNotes = useMemo(() => {
    if (!patient) return [];
    return notes.filter(
      (item) =>
        String(item.patientName).toLowerCase() === String(patient.fullName).toLowerCase()
    );
  }, [notes, patient]);

  const patientAtlasCases = useMemo(() => {
    if (!patient) return [];
    return atlasCases.filter(
      (item) =>
        String(item.patientName).toLowerCase() === String(patient.fullName).toLowerCase()
    );
  }, [atlasCases, patient]);

  if (!patient) {
    return (
      <FeatureGate feature={FEATURE_KEYS.PATIENTS}>
        <div style={cardStyle()}>Patient not found.</div>
      </FeatureGate>
    );
  }

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
          <button
            type="button"
            onClick={() => navigate('/tenant/patients')}
            style={{
              border: 'none',
              background: '#e2e8f0',
              color: '#0f172a',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: 14
            }}
          >
            ← Back to Patients
          </button>

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
            Patient Profile
          </div>

          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 900, color: '#0f172a' }}>
            {patient.fullName}
          </h1>

          <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.8 }}>
            Doctor: {patient.doctor} · Serial: {patient.serial}
          </p>
        </div>

        {(loading || usingFallback || notice) && (
          <ApiStatusNotice
            state={loading ? 'loading' : usingFallback ? 'fallback' : 'error'}
            message={
              loading
                ? 'Loading patient profile...'
                : usingFallback
                  ? `Using fallback patient profile because API is unavailable: ${notice || 'Unknown error'}`
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
          <div style={cardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Status
            </div>
            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  ...statusTone(patient.status)
                }}
              >
                {patient.status}
              </span>
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Compliance Hours
            </div>
            <div style={{ marginTop: 10, fontSize: 42, fontWeight: 900, color: patient.complianceHours < 80 ? '#92400e' : '#166534' }}>
              {patient.complianceHours}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              AHI
            </div>
            <div style={{ marginTop: 10, fontSize: 42, fontWeight: 900, color: '#0f172a' }}>
              {patient.ahi}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Open ATLAS Cases
            </div>
            <div style={{ marginTop: 10, fontSize: 42, fontWeight: 900, color: '#1d4ed8' }}>
              {patientAtlasCases.length}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20
          }}
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              Compliance snapshot
            </div>

            {patientCompliance ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: 13 }}>Hours</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                    {patientCompliance.hours}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: 13 }}>Trend</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 28,
                      fontWeight: 900,
                      color: String(patientCompliance.trend).startsWith('-') ? '#b91c1c' : '#166534'
                    }}
                  >
                    {patientCompliance.trend}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: 13 }}>Status</div>
                  <div style={{ marginTop: 10 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        ...statusTone(patientCompliance.status)
                      }}
                    >
                      {patientCompliance.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 14 }}>No compliance snapshot found.</div>
            )}
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
              Devices
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {patientDevices.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 14 }}>No devices found.</div>
              ) : (
                patientDevices.map((device) => (
                  <div
                    key={device.id}
                    onClick={() => navigate(`/tenant/devices/${device.id}`)}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>
                      {device.serial}
                    </div>
                    <div style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>
                      Last sync: {device.lastSync}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '7px 11px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          ...statusTone(device.status)
                        }}
                      >
                        {device.status}
                      </span>
                      <span style={{ color: '#475569', fontSize: 13 }}>Usage 7d: {device.usage7d}</span>
                      <span style={{ color: '#475569', fontSize: 13 }}>Leak: {device.leak}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
            Follow-up & ATLAS activity
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20
            }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Follow-ups</div>
              {patientFollowups.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 14 }}>No follow-up rows.</div>
              ) : (
                patientFollowups.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.reason}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                      Owner: {item.owner} · Outcome: {item.outcome}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                      Next action: {item.nextAction}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>ATLAS Cases</div>
              {patientAtlasCases.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 14 }}>No ATLAS cases.</div>
              ) : (
                patientAtlasCases.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      background: '#f8fafc',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.actionGroupName}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                      Priority: {item.priority} · Score: {item.score}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>
                      {item.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
            Notes timeline
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {patientNotes.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 14 }}>No notes found.</div>
            ) : (
              patientNotes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    borderRadius: 16,
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>
                    {note.author}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>
                    {note.category} · {note.createdAt}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.8, color: '#334155' }}>
                    {note.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {usingFallback && (
          <ApiStatusNotice
            state="fallback"
            message="Backend integration is wired. When live APIs return full patient-profile data, this page will switch automatically from fallback to real values."
          />
        )}
      </div>
    </FeatureGate>
  );
}