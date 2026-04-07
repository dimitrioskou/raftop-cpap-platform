import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiStatusNotice from './ApiStatusNotice';
import MetricCard from './MetricCard';
import PageStateCard from './PageStateCard';
import { buildApiNotice, fetchJson } from '../utils/tenantDataHelpers';
import {
  buttonStyle,
  panelStyle,
  tableContainerStyle,
  toolbarCardStyle
} from '../utils/uiStyles';

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

function scoreGenericArrayCandidate(arr) {
  if (!Array.isArray(arr)) return -1;
  if (arr.length === 0) return 0;

  let score = 0;

  for (const item of arr.slice(0, 5)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

    score += 2;

    const keys = Object.keys(item).map((k) => k.toLowerCase());

    if (keys.includes('id')) score += 2;
    if (keys.includes('patient_name') || keys.includes('patientname')) score += 2;
    if (keys.includes('doctor_name') || keys.includes('doctorname')) score += 2;
    if (keys.includes('status') || keys.includes('priority') || keys.includes('severity')) score += 2;
    if (keys.includes('title') || keys.includes('alert_name') || keys.includes('queue_name') || keys.includes('group_name') || keys.includes('rule_name')) score += 2;
  }

  return score;
}

function findBestArray(value, path = 'payload', visited = new Set(), results = []) {
  if (!value || typeof value !== 'object') return results;
  if (visited.has(value)) return results;
  visited.add(value);

  if (Array.isArray(value)) {
    results.push({
      path,
      value,
      score: scoreGenericArrayCandidate(value)
    });

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

function extractRows(payload, responseKeys = []) {
  for (const key of responseKeys) {
    if (Array.isArray(payload?.[key])) {
      if (payload[key].length === 0) {
        return {
          rows: [],
          debug: `${key} exists but is empty. Shape: ${describePayloadShape(payload)}`
        };
      }

      return {
        rows: payload[key],
        debug: `Using payload.${key}`
      };
    }
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

  if (best.value.length === 0) {
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

async function fetchFirstUsablePayload(urls, responseKeys, signal) {
  const diagnostics = [];

  for (const url of urls) {
    try {
      const payload = await fetchJson(url, { signal });
      const extraction = extractRows(payload, responseKeys);

      diagnostics.push(`${url} -> ${extraction.debug}`);

      if (Array.isArray(extraction.rows) && extraction.rows.length > 0) {
        return {
          rows: extraction.rows,
          debug: `Using ${url} | ${extraction.debug}`
        };
      }
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      diagnostics.push(`${url} -> ERROR ${error.message}`);
    }
  }

  return {
    rows: [],
    debug: diagnostics.join(' || ')
  };
}

export default function AtlasWorkspaceTablePage({
  title,
  subtitle,
  entityLabel,
  endpointGroups,
  responseKeys,
  fallbackRows,
  normalizeRow,
  metricsBuilder,
  columns,
  searchPlaceholder,
  getSearchText,
  filterLabel = 'Filter',
  filterOptions = [],
  getFilterValue
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [payloadDebug, setPayloadDebug] = useState('');
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');

  const loadRows = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);
    setPayloadDebug('');

    try {
      const result = await fetchFirstUsablePayload(endpointGroups, responseKeys, signal);
      const normalized = (result.rows || []).map((row, index) => normalizeRow(row, index));

      setPayloadDebug(result.debug || '');

      if (!normalized.length) {
        setRows((fallbackRows || []).map((row, index) => normalizeRow(row, index)));
        setUsingFallback(true);
        setApiError(`No usable ${entityLabel} found. Showing fallback data.`);
      } else {
        setRows(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setRows((fallbackRows || []).map((row, index) => normalizeRow(row, index)));
      setUsingFallback(true);
      setApiError(error.message || `Failed to load ${entityLabel}.`);
      setPayloadDebug(`Request failed before usable ${entityLabel} payload was found.`);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [endpointGroups, responseKeys, normalizeRow, fallbackRows, entityLabel]);

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
      const matchesSearch = !q || String(getSearchText(row) || '').toLowerCase().includes(q);
      const matchesFilter =
        filterValue === 'all' || !getFilterValue
          ? true
          : String(getFilterValue(row) || '').toLowerCase() === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filterValue, getSearchText, getFilterValue]);

  const metrics = useMemo(() => metricsBuilder(filteredRows), [filteredRows, metricsBuilder]);

  const apiNotice = useMemo(() => buildApiNotice({
    apiError,
    usingFallback,
    entityLabel
  }), [apiError, usingFallback, entityLabel]);

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
          <div style={{ fontSize: 12, fontWeight: 900, color: '#c4b5fd', letterSpacing: 0.6 }}>
            ATLAS WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            {title}
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>{subtitle}</div>
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
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label || index}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
            tone={metric.tone || 'purple'}
          />
        ))}
      </div>

      <div style={{ ...toolbarCardStyle(), marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: filterOptions.length ? '2fr 1fr auto' : '2fr auto',
            gap: 12
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              border: '1px solid #d0d5dd',
              borderRadius: 12,
              padding: '12px 14px',
              outline: 'none'
            }}
          />

          {filterOptions.length ? (
            <select
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              style={{
                width: '100%',
                border: '1px solid #d0d5dd',
                borderRadius: 12,
                padding: '12px 14px',
                outline: 'none',
                background: '#fff'
              }}
              aria-label={filterLabel}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilterValue('all');
            }}
            style={buttonStyle('secondary')}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={tableContainerStyle()}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
          {title} List
        </div>

        {loading ? (
          <PageStateCard
            title={`Loading ${entityLabel}`}
            message={`Fetching ${entityLabel} from the active tenant endpoints.`}
          />
        ) : filteredRows.length === 0 ? (
          <PageStateCard
            title={`No ${entityLabel} found`}
            message="Try clearing filters or refresh the page to retry the tenant API."
            actionLabel="Refresh"
            onAction={handleRefresh}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 980 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {columns.map((column) => (
                    <th
                      key={column.label}
                      style={{
                        padding: '12px 10px',
                        color: '#667085',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        borderBottom: '1px solid #eaecf0'
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td
                        key={column.label}
                        style={{
                          padding: '16px 10px',
                          borderBottom: '1px solid #f2f4f7',
                          verticalAlign: 'top'
                        }}
                      >
                        {column.render(row)}
                      </td>
                    ))}
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