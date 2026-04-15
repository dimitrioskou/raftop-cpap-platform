import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import PatientEnrollmentModal from '../components/patients/PatientEnrollmentModal';
import {
  buildApiNotice,
  fetchJson,
  formatDateTime
} from '../utils/tenantDataHelpers';
import {
  buttonStyle,
  panelStyle,
  statusBadgeStyle,
  tableContainerStyle,
  toolbarCardStyle
} from '../utils/uiStyles';

const FALLBACK_ROWS = [
  {
    id: 'PT-001',
    patient_name: 'Γεώργιος Παπαδόπουλος',
    phone: '6944000001',
    email: 'giorgos@example.com',
    doctor_name: 'Dr. Ελένη Περράκη',
    patient_code: 'P-1001',
    device_serial: 'RSM-CPAP-0001',
    device_brand: 'ResMed',
    monthly_usage_hours: 96,
    ahi: 3.2,
    payment_status: 'paid',
    package_type: '6m',
    monitoring_active: true,
    notifications_active: true,
    followup_active: true,
    consent_contact: true,
    compliance_status: 'ok',
    last_sync_at: '2026-04-12T10:30:00Z'
  },
  {
    id: 'PT-002',
    patient_name: 'Μαρία Κωνσταντίνου',
    phone: '6944000002',
    email: 'maria@example.com',
    doctor_name: 'Dr. Νίκος Ανδρεάδης',
    patient_code: 'P-1002',
    device_serial: 'RSM-CPAP-0002',
    device_brand: 'ResMed',
    monthly_usage_hours: 68,
    ahi: 7.8,
    payment_status: 'paid',
    package_type: '6m',
    monitoring_active: true,
    notifications_active: true,
    followup_active: true,
    consent_contact: true,
    compliance_status: 'warning',
    last_sync_at: '2026-04-11T09:20:00Z'
  },
  {
    id: 'PT-003',
    patient_name: 'CPAP Test Patient',
    phone: '6944000003',
    email: 'cpaptest@example.com',
    doctor_name: 'Dr. Μαρία Λάμπρου',
    patient_code: 'P-1003',
    device_serial: 'RSM-CPAP-0003',
    device_brand: 'Philips',
    monthly_usage_hours: 32,
    ahi: 12.1,
    payment_status: 'pending',
    package_type: '3m',
    monitoring_active: false,
    notifications_active: false,
    followup_active: false,
    consent_contact: false,
    compliance_status: 'critical',
    last_sync_at: '2026-04-09T07:15:00Z'
  }
];

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;

  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return false;
  if (['true', '1', 'yes', 'y', 'on', 'enabled', 'active'].includes(raw)) {
    return true;
  }

  return false;
}

function normalizeComplianceStatus(value, monthlyHours, monitoringActive, paymentStatus) {
  const raw = String(value || '').trim().toLowerCase();
  const active = normalizeBoolean(monitoringActive);
  const payment = String(paymentStatus || '').trim().toLowerCase();
  const hours = Number(monthlyHours || 0);

  if (raw) {
    if (['ok', 'warning', 'critical', 'inactive', 'no_data'].includes(raw)) {
      return raw;
    }
    if (raw.includes('critical')) return 'critical';
    if (raw.includes('warning')) return 'warning';
    if (raw.includes('inactive')) return 'inactive';
    if (raw.includes('no_data')) return 'no_data';
  }

  if (!active) return 'inactive';
  if (payment && !['paid', 'active'].includes(payment)) return 'inactive';
  if (!hours) return 'no_data';
  if (hours >= 80) return 'ok';
  if (hours >= 50) return 'warning';
  return 'critical';
}

function getComplianceKind(status) {
  if (status === 'critical') return 'danger';
  if (status === 'warning') return 'warning';
  if (status === 'inactive') return 'neutral';
  if (status === 'no_data') return 'dark';
  return 'success';
}

function getPaymentKind(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'paid' || raw === 'active') return 'success';
  if (raw === 'pending') return 'warning';
  return 'neutral';
}

function safeKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value);
}

function describePayloadShape(value, depth = 0) {
  if (depth > 2) return '...';

  if (Array.isArray(value)) {
    if (!value.length) return 'Array(0)';
    const first = value[0];

    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return `Array(${value.length}) of { ${safeKeys(first).slice(0, 12).join(', ')} }`;
    }

    return `Array(${value.length})`;
  }

  if (!value || typeof value !== 'object') return String(value);

  return `{ ${Object.entries(value)
    .slice(0, 12)
    .map(([key, nested]) => `${key}: ${describePayloadShape(nested, depth + 1)}`)
    .join(' | ')} }`;
}

function scoreArrayCandidate(arr) {
  if (!Array.isArray(arr)) return -1;
  if (!arr.length) return 0;

  let score = 0;

  for (const item of arr.slice(0, 5)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    const keys = Object.keys(item).map((key) => key.toLowerCase());

    if (keys.includes('patient_name') || keys.includes('full_name') || keys.includes('name')) {
      score += 4;
    }
    if (keys.includes('device_serial') || keys.includes('serial_number')) {
      score += 3;
    }
    if (keys.includes('doctor_name')) {
      score += 2;
    }
    if (keys.includes('monthly_usage_hours') || keys.includes('cpap_hours') || keys.includes('usage_hours')) {
      score += 3;
    }
    if (keys.includes('payment_status')) {
      score += 2;
    }
    if (keys.includes('compliance_status') || keys.includes('status')) {
      score += 2;
    }
  }

  return score;
}

function findBestArray(value, path = 'payload', visited = new Set(), results = []) {
  if (!value || typeof value !== 'object') return results;
  if (visited.has(value)) return results;
  visited.add(value);

  if (Array.isArray(value)) {
    results.push({ path, value, score: scoreArrayCandidate(value) });

    value.forEach((item, index) => {
      if (item && typeof item === 'object') {
        findBestArray(item, `${path}[${index}]`, visited, results);
      }
    });

    return results;
  }

  Object.entries(value).forEach(([key, nested]) => {
    findBestArray(nested, `${path}.${key}`, visited, results);
  });

  return results;
}

function extractRows(payload) {
  if (Array.isArray(payload?.patients)) {
    return {
      rows: payload.patients,
      debug: 'Using payload.patients'
    };
  }

  const candidates = findBestArray(payload)
    .filter((entry) => Array.isArray(entry.value))
    .sort((a, b) => b.score - a.score || b.value.length - a.value.length);

  const best = candidates[0];

  if (!best) {
    return {
      rows: [],
      debug: `No arrays found in payload. Shape: ${describePayloadShape(payload)}`
    };
  }

  if (!best.value.length) {
    return {
      rows: [],
      debug: `Best array at ${best.path} is empty. Shape: ${describePayloadShape(payload)}`
    };
  }

  if (best.score <= 0) {
    return {
      rows: [],
      debug: `Only low-confidence arrays found. Best: ${best.path}. Shape: ${describePayloadShape(payload)}`
    };
  }

  return {
    rows: best.value,
    debug: `Using ${best.path} (score ${best.score})`
  };
}

function normalizeRow(item, index) {
  const monthlyHours =
    Number(
      item.monthly_usage_hours ??
        item.cpap_hours ??
        item.usage_hours ??
        item.compliance_hours ??
        0
    ) || 0;

  const monitoringActive = normalizeBoolean(
    item.monitoring_active ?? item.monitoring_enabled
  );

  const notificationsActive = normalizeBoolean(item.notifications_active);
  const followupActive = normalizeBoolean(item.followup_active);
  const consentContact = normalizeBoolean(item.consent_contact ?? item.contact_consent);

  const paymentStatus = String(item.payment_status || 'pending').toLowerCase();
  const complianceStatus = normalizeComplianceStatus(
    item.compliance_status ?? item.status,
    monthlyHours,
    monitoringActive,
    paymentStatus
  );

  return {
    id: String(item.id || item.patient_id || `PT-${index + 1}`),
    patientName:
      item.patient_name ||
      item.full_name ||
      item.name ||
      `Patient ${index + 1}`,
    phone: item.phone || item.mobile || item.phone_number || '—',
    email: item.email || '—',
    doctorName: item.doctor_name || '—',
    doctorId: item.doctor_id || null,
    patientCode: item.patient_code || item.code || '—',
    deviceSerial: item.device_serial || item.serial_number || item.cpap_serial || '—',
    deviceBrand: item.device_brand || item.brand || '—',
    monthlyHours,
    ahi: Number(item.ahi || item.avg_ahi || item.average_ahi || 0) || 0,
    packageType: item.package_type || item.package_plan || item.monitoring_package || '—',
    paymentStatus,
    packageStartDate: item.package_start_date || null,
    packageEndDate: item.package_end_date || null,
    therapyStartDate: item.therapy_start_date || item.start_date || null,
    lastSyncAt: item.last_sync_at || item.last_sync || item.updated_at || null,
    monitoringActive,
    notificationsActive,
    followupActive,
    consentContact,
    complianceStatus
  };
}

export default function TenantPatientsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [payloadDebug, setPayloadDebug] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);
    setPayloadDebug('');

    try {
      const payload = await fetchJson('/api/tenant/patients', { signal });
      const extraction = extractRows(payload);
      const normalized = extraction.rows.map(normalizeRow);

      setPayloadDebug(extraction.debug || '');

      if (!normalized.length) {
        setRows(FALLBACK_ROWS.map(normalizeRow));
        setUsingFallback(true);
        setApiError('No usable patient rows found. Showing fallback patient data.');
      } else {
        setRows(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setRows(FALLBACK_ROWS.map(normalizeRow));
      setUsingFallback(true);
      setApiError(error?.message || 'Failed to load patients.');
      setPayloadDebug('Request failed before usable patient data was found.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadRows(controller.signal);

    return () => controller.abort();
  }, [loadRows]);

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    loadRows(controller.signal);
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.patientName.toLowerCase().includes(q) ||
        String(row.phone || '').toLowerCase().includes(q) ||
        String(row.email || '').toLowerCase().includes(q) ||
        String(row.doctorName || '').toLowerCase().includes(q) ||
        String(row.deviceSerial || '').toLowerCase().includes(q) ||
        String(row.id || '').toLowerCase().includes(q) ||
        String(row.patientCode || '').toLowerCase().includes(q);

      const matchesPayment =
        paymentFilter === 'all' ? true : row.paymentStatus === paymentFilter;

      const matchesCompliance =
        complianceFilter === 'all' ? true : row.complianceStatus === complianceFilter;

      return matchesSearch && matchesPayment && matchesCompliance;
    });
  }, [rows, search, paymentFilter, complianceFilter]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      activeMonitoring: rows.filter((row) => row.monitoringActive).length,
      paid: rows.filter((row) => row.paymentStatus === 'paid').length,
      critical: rows.filter((row) => row.complianceStatus === 'critical').length,
      warning: rows.filter((row) => row.complianceStatus === 'warning').length,
      ok: rows.filter((row) => row.complianceStatus === 'ok').length
    }),
    [rows]
  );

  const apiNotice = useMemo(
    () =>
      buildApiNotice({
        apiError,
        usingFallback,
        entityLabel: 'patient records'
      }),
    [apiError, usingFallback]
  );

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          ...panelStyle(true),
          marginBottom: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: '#93c5fd',
              letterSpacing: 0.6
            }}
          >
            PATIENT WORKSPACE
          </div>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 30,
              fontWeight: 900,
              color: '#ffffff'
            }}
          >
            Patients
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Patient registry, monitoring activation and 80-hour compliance entry point.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowEnrollmentModal(true)}
            style={buttonStyle('primary')}
          >
            + New Patient Enrollment
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            style={buttonStyle('secondary')}
          >
            Refresh
          </button>
        </div>
      </div>

      {apiNotice ? (
        <ApiStatusNotice
          status={apiNotice.status}
          title={apiNotice.title}
          message={apiNotice.message}
          details={payloadDebug ? `Debug: ${payloadDebug}` : undefined}
          compact
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        <MetricCard label="Total Patients" value={stats.total} tone="blue" />
        <MetricCard label="Monitoring Active" value={stats.activeMonitoring} tone="green" />
        <MetricCard label="Paid" value={stats.paid} tone="purple" />
        <MetricCard label="Critical" value={stats.critical} tone="orange" />
        <MetricCard label="Warning" value={stats.warning} tone="dark" />
        <MetricCard label="Compliant" value={stats.ok} tone="green" />
      </div>

      <div style={{ ...toolbarCardStyle(), marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr auto',
            gap: 12
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by patient, phone, email, doctor, serial or code..."
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none'
            }}
          />

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none',
              background: '#fff'
            }}
          >
            <option value="all">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={complianceFilter}
            onChange={(event) => setComplianceFilter(event.target.value)}
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none',
              background: '#fff'
            }}
          >
            <option value="all">All compliance</option>
            <option value="ok">OK</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="inactive">Inactive</option>
            <option value="no_data">No data</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setPaymentFilter('all');
              setComplianceFilter('all');
            }}
            style={buttonStyle('secondary')}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={tableContainerStyle()}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
          Patient Registry
        </div>

        {loading ? (
          <PageStateCard
            title="Loading patients"
            message="Fetching patient records from the tenant registry."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No patients found"
            message="Try clearing filters or create a new patient enrollment."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                minWidth: 1380
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {[
                    'Patient',
                    'Doctor',
                    'Contact',
                    'Device',
                    'Hours',
                    'Payment',
                    'Monitoring',
                    'Compliance',
                    'Last Sync',
                    'Actions'
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: '12px 10px',
                        color: '#667085',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        borderBottom: '1px solid #eaecf0'
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{row.patientName}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        ID: {row.id}
                      </div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 2 }}>
                        Code: {row.patientCode || '—'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div>{row.doctorName || '—'}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        Doctor ID: {row.doctorId || '—'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div>{row.phone || '—'}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        {row.email || '—'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{row.deviceSerial || '—'}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        {row.deviceBrand || '—'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {Number(row.monthlyHours || 0).toFixed(0)}h
                      </div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        AHI: {Number(row.ahi || 0).toFixed(1)}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <span style={statusBadgeStyle(getPaymentKind(row.paymentStatus))}>
                        {row.paymentStatus}
                      </span>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 6 }}>
                        Package: {row.packageType || '—'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div>
                        <span
                          style={statusBadgeStyle(
                            row.monitoringActive ? 'success' : 'neutral'
                          )}
                        >
                          {row.monitoringActive ? 'active' : 'inactive'}
                        </span>
                      </div>

                      <div style={{ color: '#667085', fontSize: 12, marginTop: 6 }}>
                        Notif: {row.notificationsActive ? 'on' : 'off'} | Follow-up:{' '}
                        {row.followupActive ? 'on' : 'off'}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <span style={statusBadgeStyle(getComplianceKind(row.complianceStatus))}>
                        {row.complianceStatus}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      {formatDateTime(row.lastSyncAt)}
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Link
                          to={`/tenant/patients/${encodeURIComponent(row.id)}`}
                          style={{
                            textDecoration: 'none',
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            color: '#344054'
                          }}
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => setShowEnrollmentModal(true)}
                          style={{
                            border: '1px solid #1d4ed8',
                            background: '#eff6ff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            color: '#1d4ed8',
                            cursor: 'pointer'
                          }}
                        >
                          Enroll Similar
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

      <PatientEnrollmentModal
        open={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        onCreated={() => {
          setShowEnrollmentModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}