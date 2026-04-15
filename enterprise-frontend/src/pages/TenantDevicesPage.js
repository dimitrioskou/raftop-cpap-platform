import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import DeviceEnrollmentModal from '../components/devices/DeviceEnrollmentModal';
import { apiPut } from '../lib/api';
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
    id: 'DV-001',
    device_serial: 'RSM-CPAP-0001',
    device_brand: 'ResMed',
    model: 'AirSense 10',
    patient_id: 'PT-001',
    patient_name: 'Γεώργιος Παπαδόπουλος',
    doctor_id: '2',
    doctor_name: 'Dr. Ελένη Περράκη',
    status: 'active',
    last_sync_at: '2026-04-15T10:30:00Z',
    notes: 'Primary home device'
  },
  {
    id: 'DV-002',
    device_serial: 'PHL-CPAP-0002',
    device_brand: 'Philips',
    model: 'DreamStation',
    patient_id: 'PT-002',
    patient_name: 'Μαρία Κωνσταντίνου',
    doctor_id: '3',
    doctor_name: 'Dr. Νίκος Ανδρεάδης',
    status: 'offline',
    last_sync_at: '2026-04-12T08:10:00Z',
    notes: 'Needs sync check'
  },
  {
    id: 'DV-003',
    device_serial: 'LWN-CPAP-0003',
    device_brand: 'Löwenstein',
    model: 'Prisma',
    patient_id: '',
    patient_name: '',
    doctor_id: '',
    doctor_name: '',
    status: 'pending',
    last_sync_at: '',
    notes: 'Unassigned new stock'
  }
];

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (['active', 'offline', 'pending', 'inactive', 'replaced'].includes(raw)) {
    return raw;
  }

  if (raw.includes('offline')) return 'offline';
  if (raw.includes('active')) return 'active';
  if (raw.includes('replace')) return 'replaced';
  if (raw.includes('inactive')) return 'inactive';

  return 'pending';
}

function getStatusKind(status) {
  if (status === 'active') return 'success';
  if (status === 'offline') return 'danger';
  if (status === 'pending') return 'warning';
  if (status === 'replaced') return 'dark';
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

    if (keys.includes('device_serial') || keys.includes('serial_number') || keys.includes('serial')) {
      score += 4;
    }
    if (keys.includes('device_brand') || keys.includes('brand')) {
      score += 2;
    }
    if (keys.includes('patient_name')) {
      score += 2;
    }
    if (keys.includes('status')) {
      score += 2;
    }
    if (keys.includes('last_sync_at') || keys.includes('last_sync')) {
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
  if (Array.isArray(payload?.devices)) {
    return {
      rows: payload.devices,
      debug: 'Using payload.devices'
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
  return {
    id: String(item.id || item.device_id || `DV-${index + 1}`),
    deviceSerial:
      item.device_serial || item.serial_number || item.cpap_serial || item.serial || '—',
    deviceBrand: item.device_brand || item.brand || item.manufacturer || '—',
    model: item.model || item.device_model || '—',
    patientId: item.patient_id || '',
    patientName: item.patient_name || '',
    doctorId: item.doctor_id || '',
    doctorName: item.doctor_name || '',
    status: normalizeStatus(item.status || item.device_status),
    lastSyncAt: item.last_sync_at || item.last_sync || item.updated_at || null,
    notes: item.notes || item.device_notes || item.comment || ''
  };
}

export default function TenantDevicesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [payloadDebug, setPayloadDebug] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);
    setPayloadDebug('');

    try {
      const payload = await fetchJson('/api/tenant/devices', { signal });
      const extraction = extractRows(payload);
      const normalized = extraction.rows.map(normalizeRow);

      setPayloadDebug(extraction.debug || '');

      if (!normalized.length) {
        setRows(FALLBACK_ROWS.map(normalizeRow));
        setUsingFallback(true);
        setApiError('No usable device rows found. Showing fallback device data.');
      } else {
        setRows(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setRows(FALLBACK_ROWS.map(normalizeRow));
      setUsingFallback(true);
      setApiError(error?.message || 'Failed to load devices.');
      setPayloadDebug('Request failed before usable device data was found.');
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

  const handleActionUpdate = useCallback(
    async (row, patch) => {
      try {
        await apiPut(`/api/tenant/devices/${encodeURIComponent(row.id)}`, patch);
        handleRefresh();
      } catch (error) {
        alert(error?.message || 'Failed to update device.');
      }
    },
    [handleRefresh]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.deviceSerial.toLowerCase().includes(q) ||
        String(row.deviceBrand || '').toLowerCase().includes(q) ||
        String(row.model || '').toLowerCase().includes(q) ||
        String(row.patientName || '').toLowerCase().includes(q) ||
        String(row.doctorName || '').toLowerCase().includes(q) ||
        String(row.id || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.status === 'active').length,
      offline: rows.filter((row) => row.status === 'offline').length,
      pending: rows.filter((row) => row.status === 'pending').length,
      assigned: rows.filter((row) => row.patientId || row.patientName).length
    }),
    [rows]
  );

  const apiNotice = useMemo(
    () =>
      buildApiNotice({
        apiError,
        usingFallback,
        entityLabel: 'device records'
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
            DEVICE WORKSPACE
          </div>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 30,
              fontWeight: 900,
              color: '#ffffff'
            }}
          >
            Devices
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Device registry, assignment and sync state management.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setEditingDevice(null);
              setShowDeviceModal(true);
            }}
            style={buttonStyle('primary')}
          >
            + Add Device
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
        <MetricCard label="Total Devices" value={stats.total} tone="blue" />
        <MetricCard label="Active" value={stats.active} tone="green" />
        <MetricCard label="Offline" value={stats.offline} tone="orange" />
        <MetricCard label="Pending" value={stats.pending} tone="purple" />
        <MetricCard label="Assigned" value={stats.assigned} tone="dark" />
      </div>

      <div style={{ ...toolbarCardStyle(), marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr auto',
            gap: 12
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by serial, brand, model, patient, doctor or id..."
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none'
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none',
              background: '#fff'
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="offline">Offline</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="replaced">Replaced</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
            style={buttonStyle('secondary')}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={tableContainerStyle()}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
          Device Registry
        </div>

        {loading ? (
          <PageStateCard
            title="Loading devices"
            message="Fetching device records from the tenant registry."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No devices found"
            message="Try clearing filters or create a new device."
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
                    'Device',
                    'Patient',
                    'Doctor',
                    'Status',
                    'Last Sync',
                    'Notes',
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
                      <div style={{ fontWeight: 900 }}>{row.deviceSerial}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        {row.deviceBrand} | {row.model || '—'}
                      </div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 2 }}>
                        ID: {row.id}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      <div>{row.patientName || 'Unassigned'}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        Patient ID: {row.patientId || '—'}
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
                      <span style={statusBadgeStyle(getStatusKind(row.status))}>
                        {row.status}
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
                        verticalAlign: 'top',
                        maxWidth: 240
                      }}
                    >
                      <div style={{ whiteSpace: 'normal' }}>{row.notes || '—'}</div>
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
                          to={`/tenant/devices/${encodeURIComponent(row.id)}`}
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
                          Open
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingDevice({
                              id: row.id,
                              device_serial: row.deviceSerial,
                              device_brand: row.deviceBrand,
                              model: row.model,
                              patient_id: row.patientId,
                              patient_name: row.patientName,
                              doctor_id: row.doctorId,
                              doctor_name: row.doctorName,
                              status: row.status,
                              last_sync_at: row.lastSyncAt,
                              notes: row.notes
                            });
                            setShowDeviceModal(true);
                          }}
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
                          Assign / Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleActionUpdate(row, {
                              status: 'active',
                              last_sync_at: new Date().toISOString()
                            })
                          }
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Sync
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleActionUpdate(row, {
                              status: 'offline'
                            })
                          }
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Offline
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleActionUpdate(row, {
                              status: 'active'
                            })
                          }
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Active
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

      <DeviceEnrollmentModal
        open={showDeviceModal}
        initialData={editingDevice}
        onClose={() => {
          setShowDeviceModal(false);
          setEditingDevice(null);
        }}
        onSaved={() => {
          setShowDeviceModal(false);
          setEditingDevice(null);
          handleRefresh();
        }}
      />
    </div>
  );
}