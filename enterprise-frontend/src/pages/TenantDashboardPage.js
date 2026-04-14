import React, { useCallback, useEffect, useState } from 'react';

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

function normalizeDashboard(payload) {
  const source =
    payload?.dashboard ||
    payload?.data ||
    payload?.summary ||
    payload?.metrics ||
    payload ||
    {};

  const cards =
    source?.cards ||
    source?.metrics ||
    source?.overview ||
    source?.counts ||
    {};

  const patientsRows = source?.patients || payload?.patients;
  const doctorsRows = source?.doctors || payload?.doctors;
  const devicesRows = source?.devices || payload?.devices;
  const modulesRows = source?.modules || payload?.modules;
  const tasksRows = source?.tasks || payload?.tasks;

  return {
    patients: firstNumber(
      cards?.patients,
      source?.patients,
      source?.patientCount,
      source?.patientsCount,
      source?.totalPatients,
      source?.totals?.patients,
      patientsRows
    ),
    doctors: firstNumber(
      cards?.doctors,
      source?.doctors,
      source?.doctorCount,
      source?.doctorsCount,
      source?.totalDoctors,
      source?.totals?.doctors,
      doctorsRows
    ),
    devices: firstNumber(
      cards?.devices,
      source?.devices,
      source?.deviceCount,
      source?.devicesCount,
      source?.totalDevices,
      source?.totals?.devices,
      devicesRows
    ),
    modules: firstNumber(
      cards?.modules,
      source?.modules,
      source?.moduleCount,
      source?.modulesCount,
      source?.totalModules,
      source?.totals?.modules,
      modulesRows
    ),
    criticalFollowups: firstNumber(
      cards?.criticalFollowups,
      cards?.critical_followups,
      source?.criticalFollowups,
      source?.critical_followups,
      source?.criticalCount,
      source?.totals?.criticalFollowups,
      source?.followups?.critical
    ),
    warningFollowups: firstNumber(
      cards?.warningFollowups,
      cards?.warning_followups,
      source?.warningFollowups,
      source?.warning_followups,
      source?.warningCount,
      source?.totals?.warningFollowups,
      source?.followups?.warning
    ),
    pendingTasks: firstNumber(
      cards?.pendingTasks,
      cards?.pending_tasks,
      source?.pendingTasks,
      source?.pending_tasks,
      source?.taskCount,
      source?.totals?.pendingTasks,
      tasksRows
    ),
    offlineDevices: firstNumber(
      cards?.offlineDevices,
      cards?.offline_devices,
      source?.offlineDevices,
      source?.offline_devices,
      source?.offlineCount,
      source?.totals?.offlineDevices
    ),
    lastSync: firstText(
      source?.lastSync,
      source?.last_sync,
      source?.syncedAt,
      source?.updatedAt,
      payload?.lastSync
    ),
    fallbackMessage: firstText(
      source?.fallbackMessage,
      payload?.message
    )
  };
}

function cardStyle(tone = 'blue') {
  const tones = {
    blue: { border: '1px solid #bfdbfe', background: '#eff6ff' },
    purple: { border: '1px solid #ddd6fe', background: '#f5f3ff' },
    green: { border: '1px solid #bbf7d0', background: '#f0fdf4' },
    orange: { border: '1px solid #fed7aa', background: '#fff7ed' },
    red: { border: '1px solid #fecaca', background: '#fef2f2' },
    dark: { border: '1px solid #0f172a', background: '#0f172a', color: '#fff' },
    neutral: { border: '1px solid #e5e7eb', background: '#f8fafc' }
  };

  return {
    borderRadius: 18,
    padding: 18,
    minHeight: 92,
    boxSizing: 'border-box',
    ...tones[tone]
  };
}

export default function TenantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(() => normalizeDashboard({}));

  const loadDashboard = useCallback(async ({ signal, silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const payload = await fetchJson('/api/tenant/dashboard', { signal });
      setDashboard(normalizeDashboard(payload));
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDashboard]);

  return (
    <div style={{ display: 'grid', gap: 18, padding: 22 }}>
      <div
        style={{
          borderRadius: 24,
          padding: 22,
          color: '#fff',
          background:
            'linear-gradient(135deg, #0f172a 0%, #0b1f5f 45%, #111827 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.6, color: '#93c5fd', marginBottom: 6 }}>
            RAFTOP OVERVIEW
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Dashboard</div>
          <div style={{ color: '#dbeafe' }}>
            Premium tenant overview with live metrics and quick actions.
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard({ silent: true })}
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
          Loading dashboard...
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
            <div style={cardStyle('blue')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Patients</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#1d4ed8' }}>{dashboard.patients}</div>
            </div>

            <div style={cardStyle('purple')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Doctors</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#7c3aed' }}>{dashboard.doctors}</div>
            </div>

            <div style={cardStyle('green')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Devices</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#15803d' }}>{dashboard.devices}</div>
            </div>

            <div style={cardStyle('orange')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Modules</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#c2410c' }}>{dashboard.modules}</div>
            </div>

            <div style={cardStyle('dark')}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: 8 }}>
                Critical Follow-ups
              </div>
              <div style={{ fontSize: 42, fontWeight: 900 }}>{dashboard.criticalFollowups}</div>
            </div>

            <div style={cardStyle('red')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Warning Follow-ups</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#dc2626' }}>{dashboard.warningFollowups}</div>
            </div>

            <div style={cardStyle('neutral')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Pending Tasks</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#7c3aed' }}>{dashboard.pendingTasks}</div>
            </div>

            <div style={cardStyle('neutral')}>
              <div style={{ color: '#475467', fontWeight: 700, marginBottom: 8 }}>Offline Devices</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#2563eb' }}>{dashboard.offlineDevices}</div>
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
            <div style={{ fontSize: 24, fontWeight: 900, color: '#101828', marginBottom: 12 }}>
              Last Dashboard Sync
            </div>
            <div style={{ color: '#475467', fontWeight: 700 }}>
              {dashboard.lastSync || 'No sync timestamp available yet.'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}