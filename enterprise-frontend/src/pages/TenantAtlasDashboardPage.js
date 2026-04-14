import React, { useCallback, useEffect, useState } from 'react';
import TenantLayout from '../layouts/TenantLayout';

const API_BASE = (
  process.env.REACT_APP_API_URL || 'https://raftop-enterprise-backend.onrender.com'
).replace(/\/+$/, '');

const TOKEN_KEY = 'raftop_auth_token';

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (_error) {
    return '';
  }
}

function buildHeaders() {
  const token = readStoredToken();

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {
      ok: false,
      message: text
    };
  }
}

async function fetchJson(path, { signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
    signal
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.length;
    }

    const parsed = toNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return 0;
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizeAtlasSummary(summaryPayload, dashboardPayload) {
  const source =
    summaryPayload?.summary ||
    summaryPayload?.atlas ||
    summaryPayload?.data ||
    summaryPayload ||
    {};

  const dashboard =
    dashboardPayload?.dashboard ||
    dashboardPayload?.data ||
    dashboardPayload ||
    {};

  return {
    openCases: firstNumber(
      source?.openCases,
      source?.open_cases,
      source?.queue,
      source?.caseCount,
      source?.counts?.openCases
    ),
    alerts: firstNumber(
      source?.alerts,
      source?.alertCount,
      source?.counts?.alerts
    ),
    tasks: firstNumber(
      source?.tasks,
      source?.taskCount,
      source?.counts?.tasks
    ),
    autoActions: firstNumber(
      source?.autoActions,
      source?.auto_actions,
      source?.counts?.autoActions
    ),
    criticalFollowups: firstNumber(
      source?.criticalFollowups,
      source?.critical_followups,
      dashboard?.criticalFollowups,
      dashboard?.critical_followups,
      dashboard?.criticalCount
    ),
    warningFollowups: firstNumber(
      source?.warningFollowups,
      source?.warning_followups,
      dashboard?.warningFollowups,
      dashboard?.warning_followups,
      dashboard?.warningCount
    ),
    lastSync: firstText(
      source?.lastSync,
      source?.last_sync,
      summaryPayload?.lastSync,
      dashboard?.lastSync,
      dashboard?.last_sync
    ),
    message: firstText(
      summaryPayload?.message,
      dashboardPayload?.message
    )
  };
}

function cardStyle(tone = 'blue') {
  const tones = {
    blue: {
      border: '1px solid #bfdbfe',
      background: '#eff6ff'
    },
    purple: {
      border: '1px solid #ddd6fe',
      background: '#f5f3ff'
    },
    green: {
      border: '1px solid #bbf7d0',
      background: '#f0fdf4'
    },
    orange: {
      border: '1px solid #fed7aa',
      background: '#fff7ed'
    },
    red: {
      border: '1px solid #fecaca',
      background: '#fef2f2'
    },
    dark: {
      border: '1px solid #0f172a',
      background: '#0f172a',
      color: '#fff'
    }
  };

  return {
    borderRadius: 18,
    padding: 18,
    minHeight: 92,
    boxSizing: 'border-box',
    ...tones[tone]
  };
}

export default function TenantAtlasDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(() =>
    normalizeAtlasSummary({}, {})
  );

  const loadSummary = useCallback(async ({ signal, silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [summaryPayload, dashboardPayload] = await Promise.all([
        fetchJson('/api/tenant/atlas/summary', { signal }).catch(() => ({})),
        fetchJson('/api/tenant/dashboard', { signal }).catch(() => ({}))
      ]);

      setSummary(normalizeAtlasSummary(summaryPayload, dashboardPayload));
    } catch (err) {
      setError(err?.message || 'Failed to load ATLAS dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSummary({ signal: controller.signal });

    return () => controller.abort();
  }, [loadSummary]);

  return (
    <TenantLayout title="ATLAS Dashboard">
      <div
        style={{
          display: 'grid',
          gap: 18
        }}
      >
        <div
          style={{
            borderRadius: 24,
            padding: 22,
            color: '#fff',
            background:
              'linear-gradient(135deg, #0f172a 0%, #0b1f5f 45%, #14532d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 0.6,
                color: '#86efac',
                marginBottom: 6
              }}
            >
              ATLAS SYSTEM
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                marginBottom: 6
              }}
            >
              ATLAS Dashboard
            </div>
            <div style={{ color: '#dcfce7' }}>
              Prioritization, alerts and operational summary for live follow-up workflows.
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadSummary({ silent: true })}
            disabled={refreshing}
            style={{
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              borderRadius: 16,
              padding: '12px 18px',
              fontWeight: 800,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.7 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {summary?.message ? (
          <div
            style={{
              borderRadius: 18,
              padding: '16px 18px',
              border: '1px solid #fde68a',
              background: '#fffbeb',
              color: '#92400e',
              fontWeight: 700
            }}
          >
            {summary.message}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              borderRadius: 18,
              padding: '16px 18px',
              border: '1px solid #fca5a5',
              background: '#fef2f2',
              color: '#b42318',
              fontWeight: 700
            }}
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <div
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 24,
              padding: 24,
              fontWeight: 800,
              color: '#101828'
            }}
          >
            Loading ATLAS dashboard...
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14
              }}
            >
              <div style={cardStyle('dark')}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: 8 }}>
                  Open Cases
                </div>
                <div style={{ fontSize: 42, fontWeight: 900 }}>
                  {summary.openCases}
                </div>
              </div>

              <div style={cardStyle('red')}>
                <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>
                  Critical Follow-ups
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#dc2626' }}>
                  {summary.criticalFollowups}
                </div>
              </div>

              <div style={cardStyle('orange')}>
                <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>
                  Warning Follow-ups
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#c2410c' }}>
                  {summary.warningFollowups}
                </div>
              </div>

              <div style={cardStyle('purple')}>
                <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>
                  Alerts
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#7c3aed' }}>
                  {summary.alerts}
                </div>
              </div>

              <div style={cardStyle('blue')}>
                <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>
                  Tasks
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#1d4ed8' }}>
                  {summary.tasks}
                </div>
              </div>

              <div style={cardStyle('green')}>
                <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>
                  Auto Actions
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#15803d' }}>
                  {summary.autoActions}
                </div>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                background: '#fff',
                borderRadius: 24,
                padding: 22
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#101828',
                  marginBottom: 12
                }}
              >
                ATLAS Last Sync
              </div>
              <div style={{ color: '#475467', fontWeight: 700 }}>
                {summary.lastSync || 'No ATLAS sync timestamp available yet.'}
              </div>
            </div>
          </>
        )}
      </div>
    </TenantLayout>
  );
}