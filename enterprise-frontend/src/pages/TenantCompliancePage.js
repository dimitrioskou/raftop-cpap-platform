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
    id: 'CMP-1',
    patient_name: 'Γεώργιος Παπαδόπουλος',
    doctor_name: 'Doctor #2',
    monthly_usage_hours: 96,
    ahi: 3.4,
    status: 'ok',
    last_sync_at: '2026-03-30T10:30:00Z'
  },
  {
    id: 'CMP-2',
    patient_name: 'Μαρία Κωνσταντίνου',
    doctor_name: 'Doctor #3',
    monthly_usage_hours: 62,
    ahi: 8.1,
    status: 'warning',
    last_sync_at: '2026-03-29T12:20:00Z'
  },
  {
    id: 'CMP-3',
    patient_name: 'CPAP Test Patient',
    doctor_name: 'Doctor #1',
    monthly_usage_hours: 39,
    ahi: 12.9,
    status: 'critical',
    last_sync_at: '2026-03-27T08:15:00Z'
  }
];

function normalizeStatus(value, hoursValue) {
  const raw = String(value || '').toLowerCase();

  if (raw.includes('critical')) return 'critical';
  if (raw.includes('warning')) return 'warning';
  if (raw.includes('medium')) return 'warning';
  if (raw.includes('low')) return 'warning';
  if (raw.includes('ok')) return 'ok';
  if (raw.includes('good')) return 'ok';

  const hours = Number(hoursValue || 0);
  if (hours < 50) return 'critical';
  if (hours < 80) return 'warning';
  return 'ok';
}

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

    if (keys.includes('patient_name') || keys.includes('patientname') || keys.includes('name')) score += 3;
    if (keys.includes('monthly_usage_hours') || keys.includes('cpap_hours') || keys.includes('usage_hours')) score += 4;
    if (keys.includes('ahi')) score += 2;
    if (keys.includes('status') || keys.includes('compliance_status')) score += 3;
    if (keys.includes('doctor_name') || keys.includes('doctorname')) score += 2;
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

  if (!best) {
    return { rows: [], debug: `No arrays found in payload. Shape: ${describePayloadShape(payload)}` };
  }

  if (best.value.length === 0) {
    return { rows: [], debug: `Best array at ${best.path} is empty. Shape: ${describePayloadShape(payload)}` };
  }

  if (best.score <= 0) {
    return { rows: [], debug: `Only low-confidence arrays found. Best: ${best.path}. Shape: ${describePayloadShape(payload)}` };
  }

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
  const monthlyHours =
    Number(
      item.monthly_usage_hours ??
        item.monthlyHours ??
        item.compliance_hours ??
        item.complianceHours ??
        item.total_hours_30d ??
        item.totalHours30d ??
        item.usage_hours ??
        item.usageHours ??
        item.cpap_hours ??
        0
    ) || 0;

  const ahi = Number(item.ahi ?? item.avg_ahi ?? item.averageAhi ?? 0) || 0;

  return {
    id: String(item.id || item.patient_id || item.patientId || `CMP-${index + 1}`),
    patientName: item.patient_name || item.patientName || item.full_name || item.name || `Patient ${index + 1}`,
    doctorName: item.doctor_name || item.doctorName || item.physician || '—',
    monthlyHours,
    ahi,
    status: normalizeStatus(item.status || item.compliance_status || item.risk_level, monthlyHours),
    lastSyncAt:
      item.last_sync_at ||
      item.lastSyncAt ||
      item.last_sync ||
      item.updated_at ||
      item.updatedAt ||
      item.created_at ||
      null
  };
}

function getStatusKind(status) {
  if (status === 'critical') return 'danger';
  if (status === 'warning') return 'warning';
  return 'success';
}

export default function TenantCompliancePage() {
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
        ['/api/tenant/compliance', '/api/compliance', '/api/tenant/patients'],
        signal
      );

      const normalized = (result.rows || []).map(normalizeRow);
      setPayloadDebug(result.debug || '');

      if (!normalized.length) {
        setRows(FALLBACK_ROWS.map(normalizeRow));
        setUsingFallback(true);
        setApiError('No usable compliance rows found. Showing fallback compliance data.');
      } else {
        setRows(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setRows(FALLBACK_ROWS.map(normalizeRow));
      setUsingFallback(true);
      setApiError(error.message || 'Failed to load compliance data.');
      setPayloadDebug('Request failed before usable compliance payload was found.');
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
        String(row.doctorName || '').toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    below80: rows.filter((r) => r.monthlyHours < 80).length,
    critical: rows.filter((r) => r.status === 'critical').length,
    warning: rows.filter((r) => r.status === 'warning').length,
    ok: rows.filter((r) => r.status === 'ok').length
  }), [rows]);

  const apiNotice = useMemo(() => buildApiNotice({
    apiError,
    usingFallback,
    entityLabel: 'compliance records'
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
            COMPLIANCE WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            Compliance
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Premium CPAP compliance workspace.
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
        <MetricCard label="Total Records" value={stats.total} tone="blue" />
        <MetricCard label="Below 80h" value={stats.below80} tone="dark" />
        <MetricCard label="Critical" value={stats.critical} tone="orange" />
        <MetricCard label="Warning" value={stats.warning} tone="purple" />
        <MetricCard label="Compliant" value={stats.ok} tone="green" />
      </div>

      <div style={{ ...toolbarCardStyle(), marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, doctor or id..."
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
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="ok">Compliant</option>
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
          Compliance List
        </div>

        {loading ? (
          <PageStateCard
            title="Loading compliance"
            message="Fetching compliance data from the active tenant endpoints."
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title="No compliance records found"
            message="Try clearing filters or refresh the page to retry the tenant API."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 980 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Patient', 'Doctor', 'Monthly Hours', 'AHI', 'Status', 'Last Sync'].map((heading) => (
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
                      <div style={{ fontWeight: 900 }}>{row.patientName}</div>
                      <div style={{ color: '#667085', fontSize: 12, marginTop: 4 }}>ID: {row.id}</div>
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {row.doctorName || '—'}
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top', fontWeight: 800 }}>
                      {Number(row.monthlyHours || 0).toFixed(0)}h
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {Number(row.ahi || 0).toFixed(1)}
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      <span style={statusBadgeStyle(getStatusKind(row.status))}>{row.status}</span>
                    </td>
                    <td style={{ padding: '16px 10px', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }}>
                      {formatDateTime(row.lastSyncAt)}
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