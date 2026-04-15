import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import FollowupCreateModal from '../components/followup/FollowupCreateModal';
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

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (
    [
      'pending',
      'contacted',
      'no_answer',
      'callback_requested',
      'resolved',
      'escalated'
    ].includes(raw)
  ) {
    return raw;
  }

  if (raw.includes('contact')) return 'contacted';
  if (raw.includes('no')) return 'no_answer';
  if (raw.includes('callback')) return 'callback_requested';
  if (raw.includes('resolve')) return 'resolved';
  if (raw.includes('escal')) return 'escalated';

  return 'pending';
}

function normalizePriority(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (['normal', 'warning', 'critical'].includes(raw)) return raw;
  if (raw.includes('crit')) return 'critical';
  if (raw.includes('warn')) return 'warning';

  return 'normal';
}

function getStatusKind(status) {
  if (status === 'resolved') return 'success';
  if (status === 'contacted') return 'success';
  if (status === 'callback_requested') return 'warning';
  if (status === 'no_answer') return 'danger';
  if (status === 'escalated') return 'dark';
  return 'neutral';
}

function getPriorityKind(priority) {
  if (priority === 'critical') return 'danger';
  if (priority === 'warning') return 'warning';
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

    if (keys.includes('patient_name')) score += 4;
    if (keys.includes('status')) score += 3;
    if (keys.includes('priority')) score += 3;
    if (keys.includes('scheduled_at')) score += 2;
    if (keys.includes('doctor_name')) score += 1;
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
  if (Array.isArray(payload?.followups)) {
    return {
      rows: payload.followups,
      debug: 'Using payload.followups'
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
    id: String(item.id || item.followup_id || `FU-${index + 1}`),
    patientId: item.patient_id || '',
    patientName: item.patient_name || `Patient ${index + 1}`,
    doctorId: item.doctor_id || '',
    doctorName: item.doctor_name || '',
    status: normalizeStatus(item.status || item.followup_status),
    outcome: item.outcome || item.followup_outcome || '',
    priority: normalizePriority(item.priority || item.severity),
    channel: item.channel || item.contact_channel || 'phone',
    scheduledAt: item.scheduled_at || item.due_at || null,
    contactedAt: item.contacted_at || null,
    assignedTo: item.assigned_to || item.owner || '',
    notes: item.notes || item.comment || ''
  };
}

export default function TenantFollowupPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [payloadDebug, setPayloadDebug] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);
    setPayloadDebug('');

    try {
      const payload = await fetchJson('/api/tenant/followup', { signal });
      const extraction = extractRows(payload);
      const normalized = extraction.rows.map(normalizeRow);

      setPayloadDebug(extraction.debug || '');
      setRows(normalized);
      setUsingFallback(false);
      setApiError('');
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setRows([]);
      setUsingFallback(false);
      setApiError(error?.message || 'Failed to load follow-up data.');
      setPayloadDebug('Request failed before usable follow-up data was found.');
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

  const handleStatusAction = useCallback(
    async (row, nextStatus) => {
      try {
        await apiPut(`/api/tenant/followup/${encodeURIComponent(row.id)}`, {
          status: nextStatus,
          outcome: nextStatus,
          contacted_at:
            nextStatus === 'contacted' ||
            nextStatus === 'callback_requested' ||
            nextStatus === 'resolved'
              ? new Date().toISOString()
              : undefined
        });
        handleRefresh();
      } catch (error) {
        alert(error?.message || 'Failed to update follow-up.');
      }
    },
    [handleRefresh]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.patientName.toLowerCase().includes(q) ||
        String(row.doctorName || '').toLowerCase().includes(q) ||
        String(row.assignedTo || '').toLowerCase().includes(q) ||
        String(row.id || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      contacted: rows.filter((row) => row.status === 'contacted').length,
      callback: rows.filter((row) => row.status === 'callback_requested').length,
      resolved: rows.filter((row) => row.status === 'resolved').length,
      critical: rows.filter((row) => row.priority === 'critical').length
    }),
    [rows]
  );

  const apiNotice = useMemo(
    () =>
      buildApiNotice({
        apiError,
        usingFallback,
        entityLabel: 'follow-up records'
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
            FOLLOW-UP WORKSPACE
          </div>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 30,
              fontWeight: 900,
              color: '#ffffff'
            }}
          >
            Follow-up
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Outreach workflow for patient contact, callback and resolution.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={buttonStyle('primary')}
          >
            + New Follow-up
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
        <MetricCard label="Total Follow-ups" value={stats.total} tone="blue" />
        <MetricCard label="Pending" value={stats.pending} tone="dark" />
        <MetricCard label="Contacted" value={stats.contacted} tone="green" />
        <MetricCard label="Callback" value={stats.callback} tone="purple" />
        <MetricCard label="Resolved" value={stats.resolved} tone="green" />
        <MetricCard label="Critical" value={stats.critical} tone="orange" />
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
            placeholder="Search by patient, doctor, assignee or id..."
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
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="no_answer">No Answer</option>
            <option value="callback_requested">Callback Requested</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
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
          Follow-up Queue
        </div>

        {loading ? (
          <PageStateCard
            title="Loading follow-up"
            message="Fetching outreach workflow records."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No follow-up records found"
            message="Create a new follow-up to start the outreach workflow."
            actionLabel="New Follow-up"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                minWidth: 1500
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {[
                    'Patient',
                    'Doctor',
                    'Status',
                    'Priority',
                    'Channel',
                    'Scheduled',
                    'Contacted',
                    'Owner',
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
                      <div style={{ fontWeight: 900 }}>{row.patientName}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
                        ID: {row.id}
                      </div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 2 }}>
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
                      <span style={statusBadgeStyle(getPriorityKind(row.priority))}>
                        {row.priority}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      {row.channel}
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      {formatDateTime(row.scheduledAt)}
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      {formatDateTime(row.contactedAt)}
                    </td>

                    <td
                      style={{
                        padding: '16px 10px',
                        borderBottom: '1px solid #f2f4f7',
                        verticalAlign: 'top'
                      }}
                    >
                      {row.assignedTo || '—'}
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
                        <button
                          type="button"
                          onClick={() => handleStatusAction(row, 'contacted')}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Contacted
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusAction(row, 'no_answer')}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          No Answer
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusAction(row, 'callback_requested')}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Callback Requested
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusAction(row, 'resolved')}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Resolved
                        </button>

                        {row.patientId ? (
                          <Link
                            to={`/tenant/patients/${encodeURIComponent(row.patientId)}`}
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
                            Open Patient
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FollowupCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}