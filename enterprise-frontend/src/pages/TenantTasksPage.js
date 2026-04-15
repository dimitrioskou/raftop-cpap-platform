import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import TaskCreateModal from '../components/tasks/TaskCreateModal';
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

  if (['pending', 'in_progress', 'done', 'cancelled', 'escalated'].includes(raw)) {
    return raw;
  }

  if (raw.includes('progress')) return 'in_progress';
  if (raw.includes('done') || raw.includes('complete')) return 'done';
  if (raw.includes('cancel')) return 'cancelled';
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
  if (status === 'done') return 'success';
  if (status === 'in_progress') return 'warning';
  if (status === 'escalated') return 'dark';
  if (status === 'cancelled') return 'danger';
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

    if (keys.includes('title') || keys.includes('task_title') || keys.includes('name')) score += 4;
    if (keys.includes('status')) score += 3;
    if (keys.includes('priority')) score += 3;
    if (keys.includes('due_at')) score += 2;
    if (keys.includes('patient_name')) score += 1;
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
  if (Array.isArray(payload?.tasks)) {
    return {
      rows: payload.tasks,
      debug: 'Using payload.tasks'
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
    id: String(item.id || item.task_id || `TS-${index + 1}`),
    title: item.title || item.task_title || item.name || `Task ${index + 1}`,
    patientId: item.patient_id || '',
    patientName: item.patient_name || '',
    doctorId: item.doctor_id || '',
    doctorName: item.doctor_name || '',
    followupId: item.followup_id || '',
    status: normalizeStatus(item.status || item.task_status),
    priority: normalizePriority(item.priority || item.severity),
    dueAt: item.due_at || item.scheduled_at || null,
    assignedTo: item.assigned_to || item.owner || '',
    notes: item.notes || item.comment || ''
  };
}

export default function TenantTasksPage() {
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
      const payload = await fetchJson('/api/tenant/tasks', { signal });
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
      setApiError(error?.message || 'Failed to load tasks.');
      setPayloadDebug('Request failed before usable tasks were found.');
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

  const handleTaskUpdate = useCallback(
    async (row, patch) => {
      try {
        await apiPut(`/api/tenant/tasks/${encodeURIComponent(row.id)}`, patch);
        handleRefresh();
      } catch (error) {
        alert(error?.message || 'Failed to update task.');
      }
    },
    [handleRefresh]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        String(row.patientName || '').toLowerCase().includes(q) ||
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
      inProgress: rows.filter((row) => row.status === 'in_progress').length,
      done: rows.filter((row) => row.status === 'done').length,
      critical: rows.filter((row) => row.priority === 'critical').length,
      assigned: rows.filter((row) => row.assignedTo).length
    }),
    [rows]
  );

  const apiNotice = useMemo(
    () =>
      buildApiNotice({
        apiError,
        usingFallback,
        entityLabel: 'task records'
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
            TASK WORKSPACE
          </div>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 30,
              fontWeight: 900,
              color: '#ffffff'
            }}
          >
            Tasks
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Operational execution workflow for outreach and patient actions.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={buttonStyle('primary')}
          >
            + New Task
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
        <MetricCard label="Total Tasks" value={stats.total} tone="blue" />
        <MetricCard label="Pending" value={stats.pending} tone="dark" />
        <MetricCard label="In Progress" value={stats.inProgress} tone="warning" />
        <MetricCard label="Done" value={stats.done} tone="green" />
        <MetricCard label="Critical" value={stats.critical} tone="orange" />
        <MetricCard label="Assigned" value={stats.assigned} tone="purple" />
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
            placeholder="Search by title, patient, doctor, assignee or id..."
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
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
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
          Task Board
        </div>

        {loading ? (
          <PageStateCard
            title="Loading tasks"
            message="Fetching operational task records."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No tasks found"
            message="Create a new task to start the execution workflow."
            actionLabel="New Task"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                minWidth: 1480
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {[
                    'Task',
                    'Patient',
                    'Doctor',
                    'Status',
                    'Priority',
                    'Due At',
                    'Owner',
                    'Follow-up',
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
                      <div style={{ fontWeight: 900 }}>{row.title}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>
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
                      <div>{row.patientName || '—'}</div>
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
                      {formatDateTime(row.dueAt)}
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
                        verticalAlign: 'top'
                      }}
                    >
                      {row.followupId || '—'}
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
                          onClick={() =>
                            handleTaskUpdate(row, {
                              status: 'done'
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
                          Mark Done
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleTaskUpdate(row, {
                              status: 'pending'
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
                          Mark Pending
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const nextDate = new Date(row.dueAt || Date.now());
                            nextDate.setDate(nextDate.getDate() + 1);

                            handleTaskUpdate(row, {
                              due_at: nextDate.toISOString(),
                              status: 'in_progress'
                            });
                          }}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleTaskUpdate(row, {
                              assigned_to: 'RAFTOP Team',
                              status: row.status === 'pending' ? 'in_progress' : row.status
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
                          Assign Task
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

      <TaskCreateModal
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