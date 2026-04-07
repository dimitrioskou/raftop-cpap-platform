import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import { buildApiNotice, fetchJson, formatDateTime } from '../utils/tenantDataHelpers';
import {
  buttonStyle,
  panelStyle,
  statusBadgeStyle,
  tableContainerStyle,
  toolbarCardStyle
} from '../utils/uiStyles';

const FALLBACK_ROWS = [
  {
    id: 'TASK-1',
    title: 'Call non-compliant patient',
    patient_name: 'Μαρία Κωνσταντίνου',
    owner: 'Atlas Team',
    due_at: '2026-04-05T10:00:00Z',
    status: 'pending'
  },
  {
    id: 'TASK-2',
    title: 'Review offline device alert',
    patient_name: 'CPAP Test Patient',
    owner: 'Support Desk',
    due_at: '2026-04-05T08:00:00Z',
    status: 'overdue'
  }
];

function safeKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value);
}

function describePayloadShape(value, depth = 0) {
  if (depth > 2) return '...';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Array(0)';
    const first = value[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      return `Array(${value.length}) of { ${safeKeys(first).slice(0, 10).join(', ')} }`;
    }
    return `Array(${value.length})`;
  }

  if (!value || typeof value !== 'object') return String(value);

  return `{ ${Object.entries(value)
    .slice(0, 12)
    .map(([k, v]) => `${k}: ${describePayloadShape(v, depth + 1)}`)
    .join(' | ')} }`;
}

function scoreArrayCandidate(arr) {
  if (!Array.isArray(arr)) return -1;
  if (arr.length === 0) return 0;

  let score = 0;
  for (const item of arr.slice(0, 5)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const keys = Object.keys(item).map((k) => k.toLowerCase());

    if (keys.includes('title') || keys.includes('task_title') || keys.includes('tasktitle')) score += 4;
    if (keys.includes('patient_name') || keys.includes('patientname')) score += 2;
    if (keys.includes('owner') || keys.includes('assigned_to') || keys.includes('assignedto')) score += 2;
    if (keys.includes('due_at') || keys.includes('dueat')) score += 2;
    if (keys.includes('status')) score += 3;
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
  const candidates = findBestArray(payload)
    .filter((entry) => Array.isArray(entry.value))
    .sort((a, b) => b.score - a.score || b.value.length - a.value.length);

  const best = candidates[0];
  if (!best) return { rows: [], debug: `No arrays found in payload. Shape: ${describePayloadShape(payload)}` };
  if (best.value.length === 0) return { rows: [], debug: `Best array at ${best.path} is empty. Shape: ${describePayloadShape(payload)}` };
  if (best.score <= 0) return { rows: [], debug: `Only low-confidence arrays found. Best: ${best.path}. Shape: ${describePayloadShape(payload)}` };
  return { rows: best.value, debug: `Using ${best.path} (score ${best.score})` };
}

async function fetchFirstUsablePayload(urls, signal) {
  const diagnostics = [];

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, { signal });
      const extraction = extractRows(payload);

      diagnostics.push(`${url} -> ${extraction.debug}`);

      if (Array.isArray(extraction.rows) && extraction.rows.length > 0) {
        return { rows: extraction.rows, debug: `Using ${url} | ${extraction.debug}` };
      }
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      diagnostics.push(`${url} -> ERROR ${error.message}`);
    }
  }

  return { rows: [], debug: diagnostics.join(' || ') };
}

function normalizeRow(item, index) {
  return {
    id: String(item.id || item.task_id || item.taskId || `TASK-${index + 1}`),
    title: item.title || item.task_title || item.taskTitle || `Task ${index + 1}`,
    patientName: item.patient_name || item.patientName || item.name || '—',
    owner: item.owner || item.assigned_to || item.assignedTo || 'Team',
    dueAt: item.due_at || item.dueAt || null,
    status: item.status || 'open'
  };
}

function getKind(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('overdue') || raw.includes('critical')) return 'danger';
  if (raw.includes('pending') || raw.includes('open')) return 'warning';
  return 'success';
}

export default function TenantTasksPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [payloadDebug, setPayloadDebug] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);
    setPayloadDebug('');

    try {
      const result = await fetchFirstUsablePayload(
        ['/api/tenant/tasks', '/api/tasks', '/api/tenant/atlas/tasks'],
        signal
      );

      const normalized = (result.rows || []).map(normalizeRow);
      setPayloadDebug(result.debug || '');

      if (!normalized.length) {
        setRows(FALLBACK_ROWS.map(normalizeRow));
        setUsingFallback(true);
        setApiError('No usable task rows found. Showing fallback task data.');
      } else {
        setRows(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setRows(FALLBACK_ROWS.map(normalizeRow));
      setUsingFallback(true);
      setApiError(error.message || 'Failed to load task data.');
      setPayloadDebug('Request failed before usable task payload was found.');
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
        row.title.toLowerCase().includes(q) ||
        row.patientName.toLowerCase().includes(q) ||
        row.owner.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' ? true : String(row.status).toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => String(r.status).toLowerCase() === 'pending').length,
    overdue: rows.filter((r) => String(r.status).toLowerCase() === 'overdue').length,
    completed: rows.filter((r) => String(r.status).toLowerCase() === 'completed').length
  }), [rows]);

  const apiNotice = useMemo(() => buildApiNotice({
    apiError,
    usingFallback,
    entityLabel: 'task records'
  }), [apiError, usingFallback]);

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
          <div style={{ fontSize: 12, fontWeight: 900, color: '#93c5fd', letterSpacing: 0.6 }}>
            TASK WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            Tasks
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Premium task workspace with tenant and ATLAS task streams.
          </div>
        </div>

        <button type="button" onClick={handleRefresh} style={buttonStyle('primary')}>
          Refresh
        </button>
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
        <MetricCard label="Pending" value={stats.pending} tone="orange" />
        <MetricCard label="Overdue" value={stats.overdue} tone="dark" />
        <MetricCard label="Completed" value={stats.completed} tone="green" />
      </div>

      <div style={{ ...toolbarCardStyle(), marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task, patient or owner..."
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
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
          Task List
        </div>

        {loading ? (
          <PageStateCard
            title="Loading tasks"
            message="Fetching task data from the active tenant endpoints."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No tasks found"
            message="Try clearing filters or refresh the page to retry the tenant API."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 980 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Task', 'Patient', 'Owner', 'Due', 'Status'].map((heading) => (
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
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 900 }}>{row.title}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {row.patientName}
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {row.owner}
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {formatDateTime(row.dueAt)}
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      <span style={statusBadgeStyle(getKind(row.status))}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}