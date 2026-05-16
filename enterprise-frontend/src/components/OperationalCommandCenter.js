import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  const tenantId = getTenantId();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId
    }
  });

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Non-JSON response: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
  }

  return json;
}

function safeArray(value, keys = []) {
  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data?.queue)) return value.data.queue;
  if (Array.isArray(value?.data?.rows)) return value.data.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.queue)) return value.queue;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.tasks)) return value.tasks;
  if (Array.isArray(value?.signals)) return value.signals;
  if (Array.isArray(value?.nextBestActions)) return value.nextBestActions;
  if (Array.isArray(value?.next_best_actions)) return value.next_best_actions;

  return [];
}

function pickSummary(payload) {
  return payload?.summary || payload?.data?.summary || {};
}

function pickReadiness(payload) {
  return (
    payload?.readinessStatus ||
    payload?.readiness_status ||
    payload?.summary?.readinessStatus ||
    payload?.summary?.readiness_status ||
    payload?.data?.readinessStatus ||
    payload?.data?.readiness_status ||
    'UNKNOWN'
  );
}

function pickMetric(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return 0;
}

function fallbackPayload() {
  return {
    atlas: {
      summary: {
        openSignals: 3,
        openTasks: 4,
        criticalItems: 1,
        readinessStatus: 'NEEDS_ATTENTION'
      },
      queue: [
        {
          id: 'fallback-1',
          patientName: 'High-risk compliance cohort',
          title: 'Usage below 80h/month',
          priority: 'HIGH',
          status: 'OPEN',
          nextBestAction: 'ATLAS follow-up within 48h'
        },
        {
          id: 'fallback-2',
          patientName: 'New CPAP starts',
          title: 'First 14 days adherence risk',
          priority: 'MEDIUM',
          status: 'OPEN',
          nextBestAction: 'Early coaching call'
        },
        {
          id: 'fallback-3',
          patientName: 'Doctor referral group',
          title: 'Missing progress feedback',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          nextBestAction: 'Send executive summary'
        }
      ]
    },
    closedLoop: {
      readinessStatus: 'NEEDS_ATTENTION',
      metrics: {
        totalSignals: 3,
        totalTasks: 4,
        openTasks: 3,
        criticalSignals: 1
      },
      nextBestActions: []
    },
    actionCenter: {
      summary: {
        total: 3,
        createTaskNow: 2,
        taskCreated: 1,
        handled: 1
      },
      items: []
    },
    fallback: true
  };
}

export default function OperationalCommandCenter() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [atlas, closedLoop, actionCenter] = await Promise.all([
        apiGet('/api/tenant/atlas'),
        apiGet('/api/tenant/closed-loop/control-summary'),
        apiGet('/api/tenant/atlas/action-center')
      ]);

      setPayload({
        atlas,
        closedLoop,
        actionCenter,
        fallback: false
      });
    } catch (err) {
      setPayload(fallbackPayload());
      setError(err.message || 'Live operational binding failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = payload || fallbackPayload();

  const atlasSummary = pickSummary(data.atlas);
  const closedLoopMetrics = data.closedLoop?.metrics || {};
  const actionSummary = pickSummary(data.actionCenter);

  const queue = useMemo(() => {
    return safeArray(data.atlas, ['queue', 'items', 'rows'])
      .slice(0, 4);
  }, [data.atlas]);

  const readiness = pickReadiness(data.closedLoop || data.atlas);

  const impactItems = [
    {
      label: 'ATLAS queue',
      value: pickMetric(
        atlasSummary.totalQueueItems,
        atlasSummary.criticalItems,
        queue.length
      )
    },
    {
      label: 'Open tasks',
      value: pickMetric(
        closedLoopMetrics.openTasks,
        atlasSummary.openTasks,
        actionSummary.createTaskNow
      )
    },
    {
      label: 'Signals',
      value: pickMetric(
        closedLoopMetrics.totalSignals,
        atlasSummary.totalSignals,
        atlasSummary.openSignals
      )
    },
    {
      label: 'Create Task Now',
      value: pickMetric(
        actionSummary.createTaskNow,
        actionSummary.total
      )
    }
  ];

  return (
    <section style={shell}>
      <div style={header}>
        <div>
          <p style={eyebrow}>LIVE OPERATIONAL COMMAND CENTER</p>
          <h2 style={title}>ATLAS-driven CPAP operations</h2>
          <p style={subtitle}>
            Live executive view from ATLAS, Closed Loop Control Summary and Action Center.
          </p>
        </div>

        <div style={rightActions}>
          <div style={statusBox}>
            <span style={statusDot(readiness)} />
            {readiness}
          </div>

          <button type="button" onClick={load} style={refreshButton}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={warningBox}>
          Live API fallback active: {error}
        </div>
      )}

      <div style={grid}>
        <div style={panel}>
          <h3 style={panelTitle}>ATLAS priority queue</h3>

          <div style={queueList}>
            {queue.length === 0 ? (
              <div style={emptyBox}>No ATLAS queue items available.</div>
            ) : (
              queue.map((item, index) => (
                <div key={item.id || index} style={queueCard}>
                  <div style={queueTop}>
                    <strong>
                      {item.patientName ||
                        item.patient_name ||
                        item.title ||
                        `Queue item ${index + 1}`}
                    </strong>
                    <span style={priorityPill(item.priority || item.severity)}>
                      {item.priority || item.severity || 'MEDIUM'}
                    </span>
                  </div>

                  <p style={queueText}>
                    {item.title || item.description || item.signalType || item.signal_type || 'Operational signal'}
                  </p>

                  <p style={actionText}>
                    {item.nextBestAction ||
                      item.next_best_action ||
                      item.metadata?.nextBestAction ||
                      'Review and assign owner.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>Pilot impact snapshot</h3>

          <div style={impactGrid}>
            {impactItems.map((item) => (
              <div key={item.label} style={impactCard}>
                <div style={impactValue}>{item.value}</div>
                <div style={impactLabel}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={readinessBox}>
            <strong>Readiness:</strong> {readiness}. This layer is now bound to live backend operational endpoints.
          </div>
        </div>
      </div>
    </section>
  );
}

const shell = {
  background: 'linear-gradient(135deg, #020617 0%, #0f172a 60%, #164e63 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 26,
  marginBottom: 18,
  boxShadow: '0 22px 60px rgba(15,23,42,0.22)'
};

const header = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 18,
  marginBottom: 20,
  flexWrap: 'wrap'
};

const eyebrow = {
  margin: 0,
  color: '#99f6e4',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.14em'
};

const title = {
  margin: '8px 0',
  fontSize: 28,
  fontWeight: 1000
};

const subtitle = {
  margin: 0,
  color: '#cbd5e1',
  maxWidth: 820,
  lineHeight: 1.6,
  fontWeight: 650
};

const rightActions = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const statusBox = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  background: 'rgba(16, 185, 129, 0.14)',
  border: '1px solid rgba(45, 212, 191, 0.35)',
  borderRadius: 999,
  padding: '10px 14px',
  color: '#ccfbf1',
  fontWeight: 900
};

const statusDot = (value) => {
  const text = String(value || '').toUpperCase();
  const color = text.includes('READY') && !text.includes('NEEDS') ? '#22c55e' : '#f59e0b';

  return {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: color,
    boxShadow: `0 0 0 6px ${color === '#22c55e' ? 'rgba(34,197,94,0.16)' : 'rgba(245,158,11,0.18)'}`
  };
};

const refreshButton = {
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  borderRadius: 999,
  padding: '10px 14px',
  fontWeight: 900,
  cursor: 'pointer'
};

const warningBox = {
  background: 'rgba(245,158,11,0.16)',
  border: '1px solid rgba(251,191,36,0.35)',
  color: '#fef3c7',
  borderRadius: 16,
  padding: 12,
  marginBottom: 16,
  fontWeight: 800
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: 16
};

const panel = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 22,
  padding: 18
};

const panelTitle = {
  margin: '0 0 14px',
  color: '#ffffff',
  fontSize: 19,
  fontWeight: 1000
};

const queueList = {
  display: 'grid',
  gap: 12
};

const queueCard = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 14
};

const queueTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center'
};

const priorityPill = (priority) => {
  const text = String(priority || '').toUpperCase();

  const danger = text.includes('HIGH') || text.includes('CRITICAL');

  return {
    background: danger ? '#fee2e2' : '#fef3c7',
    color: danger ? '#991b1b' : '#92400e',
    borderRadius: 999,
    padding: '5px 9px',
    fontSize: 12,
    fontWeight: 1000
  };
};

const queueText = {
  margin: '8px 0 4px',
  color: '#cbd5e1',
  fontWeight: 700
};

const actionText = {
  margin: 0,
  color: '#99f6e4',
  fontWeight: 900
};

const impactGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12
};

const impactCard = {
  background: '#ffffff',
  color: '#0f172a',
  borderRadius: 16,
  padding: 14
};

const impactValue = {
  fontSize: 28,
  fontWeight: 1000
};

const impactLabel = {
  marginTop: 4,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
};

const readinessBox = {
  marginTop: 14,
  background: 'rgba(20,184,166,0.14)',
  border: '1px solid rgba(45,212,191,0.3)',
  borderRadius: 16,
  padding: 14,
  color: '#ccfbf1',
  lineHeight: 1.6,
  fontWeight: 750
};

const emptyBox = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: 14,
  color: '#cbd5e1',
  fontWeight: 800
};