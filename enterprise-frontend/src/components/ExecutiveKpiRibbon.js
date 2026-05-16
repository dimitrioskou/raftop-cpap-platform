import React, { useCallback, useEffect, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': getTenantId()
    }
  });

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (_error) {
    throw new Error(`Non-JSON response: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
  }

  return json;
}

function fallbackKpis() {
  return [
    {
      label: 'Operational Efficiency',
      value: '78%',
      tone: '#0f766e',
      description: 'Fallback estimate'
    },
    {
      label: 'Readiness Score',
      value: '72%',
      tone: '#1d4ed8',
      description: 'Fallback estimate'
    },
    {
      label: 'Unresolved Risk Load',
      value: 3,
      tone: '#b91c1c',
      description: 'Fallback estimate'
    },
    {
      label: 'Active Interventions',
      value: 4,
      tone: '#7c3aed',
      description: 'Fallback estimate'
    },
    {
      label: 'Compliance Rescue',
      value: 2,
      tone: '#d97706',
      description: 'Fallback estimate'
    },
    {
      label: 'Burden Index',
      value: '56%',
      tone: '#15803d',
      description: 'Fallback estimate'
    }
  ];
}

function toneColor(tone, id) {
  const value = String(tone || '').toLowerCase();

  if (value === 'success') return '#0f766e';
  if (value === 'warning') return '#d97706';
  if (value === 'danger') return '#b91c1c';

  if (String(id || '').includes('readiness')) return '#1d4ed8';
  if (String(id || '').includes('risk')) return '#b91c1c';
  if (String(id || '').includes('burden')) return '#15803d';

  return '#7c3aed';
}

function normalizeKpi(kpi) {
  return {
    id: kpi.id || kpi.label,
    label: kpi.label || 'KPI',
    value: kpi.value ?? kpi.numericValue ?? '-',
    tone: toneColor(kpi.tone, kpi.id),
    description: kpi.description || 'Live executive metric'
  };
}

export default function ExecutiveKpiRibbon() {
  const [metrics, setMetrics] = useState(fallbackKpis());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const payload = await apiGet('/api/tenant/executive-metrics');
      const kpis = Array.isArray(payload.kpis)
        ? payload.kpis
        : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.rows)
            ? payload.rows
            : [];

      if (kpis.length === 0) {
        throw new Error('Executive metrics returned no KPIs.');
      }

      setMetrics(kpis.slice(0, 6).map(normalizeKpi));
      setStatus(payload.fallback ? 'fallback' : 'live');
    } catch (err) {
      setMetrics(fallbackKpis());
      setStatus('fallback');
      setError(err.message || 'Executive metrics unavailable.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section style={wrapper}>
      <div style={topBar}>
        <div>
          <div style={eyebrow}>EXECUTIVE LIVE METRICS</div>
          <div style={title}>Operational intelligence snapshot</div>
        </div>

        <div style={rightSide}>
          <span style={statusPill(status)}>
            {status === 'live' ? 'LIVE BACKEND' : status === 'loading' ? 'LOADING' : 'SAFE FALLBACK'}
          </span>

          <button type="button" onClick={load} style={refreshButton}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div style={warningBox}>KPI fallback active: {error}</div>}

      <div style={shell}>
        {metrics.map((metric) => (
          <div
            key={metric.id || metric.label}
            style={{
              ...card,
              borderTop: `4px solid ${metric.tone}`
            }}
          >
            <div style={label}>{metric.label}</div>

            <div style={value}>{metric.value}</div>

            <div
              style={{
                ...delta,
                color: metric.tone
              }}
            >
              {metric.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const wrapper = {
  marginBottom: 18
};

const topBar = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: '14px 16px',
  marginBottom: 12,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  boxShadow: '0 10px 24px rgba(15,23,42,0.04)'
};

const eyebrow = {
  color: '#0f766e',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.12em'
};

const title = {
  marginTop: 3,
  color: '#0f172a',
  fontSize: 16,
  fontWeight: 1000
};

const rightSide = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const statusPill = (status) => ({
  borderRadius: 999,
  padding: '8px 11px',
  fontSize: 11,
  fontWeight: 1000,
  background:
    status === 'live'
      ? '#dcfce7'
      : status === 'loading'
        ? '#e0f2fe'
        : '#fef3c7',
  color:
    status === 'live'
      ? '#166534'
      : status === 'loading'
        ? '#075985'
        : '#92400e',
  border:
    status === 'live'
      ? '1px solid #bbf7d0'
      : status === 'loading'
        ? '1px solid #bae6fd'
        : '1px solid #fde68a'
});

const refreshButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const warningBox = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  fontWeight: 800
};

const shell = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14
};

const card = {
  background: '#ffffff',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  border: '1px solid #e2e8f0'
};

const label = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const value = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 34,
  fontWeight: 1000
};

const delta = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.35
};