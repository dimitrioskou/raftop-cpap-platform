import React, { useEffect, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function formatMs(value) {
  const ms = Number(value || 0);

  if (!Number.isFinite(ms) || ms <= 0) return '-';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day(s)`;
  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} second(s)`;
}

function statusStyle(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'HEALTHY' || normalized === 'READY' || normalized === 'ENABLED') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    };
  }

  if (normalized === 'FAILED' || normalized === 'BLOCKED' || normalized === 'DISABLED') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (normalized === 'RUNNING' || normalized === 'UNKNOWN') {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  return {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1'
  };
}

function MetricCard({ label, value, tone }) {
  const style =
    tone === 'danger'
      ? { background: '#fff1f2', border: '1px solid #fecdd3' }
      : tone === 'warning'
        ? { background: '#fffbeb', border: '1px solid #fde68a' }
        : tone === 'success'
          ? { background: '#f0fdf4', border: '1px solid #bbf7d0' }
          : { background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <div
      style={{
        ...style,
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#64748b',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 34,
          fontWeight: 900,
          color: '#0f172a'
        }}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function PolicyCard({ label, value }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 16
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 18,
          fontWeight: 900,
          color: '#0f172a'
        }}
      >
        {String(value)}
      </div>
    </div>
  );
}

export default function SystemMaintenancePage() {
  const [state, setState] = useState({
    loading: true,
    runnerLoading: true,
    cleaning: false,
    scheduledRunning: false,
    error: '',
    payload: null,
    runnerPayload: null,
    cleanupResult: null,
    scheduledResult: null
  });

  const [showRaw, setShowRaw] = useState(false);

  const [policy, setPolicy] = useState({
    snapshotKeepLatest: 500,
    snapshotRetentionDays: 30,
    acknowledgedAlertRetentionDays: 30
  });

  function buildQuery() {
    const params = new URLSearchParams();

    params.set('snapshotKeepLatest', String(policy.snapshotKeepLatest || 500));
    params.set('snapshotRetentionDays', String(policy.snapshotRetentionDays || 30));
    params.set(
      'acknowledgedAlertRetentionDays',
      String(policy.acknowledgedAlertRetentionDays || 30)
    );

    return params.toString();
  }

  async function loadStatus() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: ''
      }));

      const response = await fetch(
        `${API_BASE}/api/system/maintenance/status?${buildQuery()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        cleaning: false,
        error: '',
        payload: json
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        cleaning: false,
        error: error.message || 'Failed to load maintenance status.'
      }));
    }
  }

  async function loadRunnerStatus() {
    try {
      setState((prev) => ({
        ...prev,
        runnerLoading: true,
        error: ''
      }));

      const response = await fetch(`${API_BASE}/api/system/maintenance/runner-status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState((prev) => ({
        ...prev,
        runnerLoading: false,
        error: '',
        runnerPayload: json
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        runnerLoading: false,
        error: error.message || 'Failed to load maintenance runner status.'
      }));
    }
  }

  async function refreshAll() {
    await loadStatus();
    await loadRunnerStatus();
  }

  async function runCleanup() {
    const confirmed = window.confirm(
      'Run manual maintenance cleanup now? Open alerts will NOT be deleted. Old snapshots and old acknowledged alerts may be removed based on the current retention policy.'
    );

    if (!confirmed) return;

    try {
      setState((prev) => ({
        ...prev,
        cleaning: true,
        error: '',
        cleanupResult: null
      }));

      const response = await fetch(
        `${API_BASE}/api/system/maintenance/cleanup?${buildQuery()}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        cleaning: false,
        error: '',
        payload: json.after,
        cleanupResult: json
      }));

      await loadRunnerStatus();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        cleaning: false,
        error: error.message || 'Failed to run maintenance cleanup.'
      }));
    }
  }

  async function runScheduledNow() {
    const confirmed = window.confirm(
      'Run the automatic maintenance scheduler manually now? This uses the backend .env retention policy.'
    );

    if (!confirmed) return;

    try {
      setState((prev) => ({
        ...prev,
        scheduledRunning: true,
        error: '',
        scheduledResult: null
      }));

      const response = await fetch(`${API_BASE}/api/system/maintenance/run-scheduled-now`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState((prev) => ({
        ...prev,
        scheduledRunning: false,
        error: '',
        scheduledResult: json,
        runnerPayload: {
          ...(prev.runnerPayload || {}),
          latestMaintenanceRun: json
        }
      }));

      await refreshAll();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        scheduledRunning: false,
        error: error.message || 'Failed to run scheduled maintenance.'
      }));
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const payload = state.payload || {};
  const runnerPayload = state.runnerPayload || {};

  const monitoring = payload.monitoring || {};
  const alerts = payload.alerts || {};
  const activePolicy = payload.policy || policy;
  const cleanup = state.cleanupResult?.cleanup || null;

  const latestMaintenanceRun = runnerPayload.latestMaintenanceRun || {};
  const currentDatabaseStatus = runnerPayload.currentDatabaseStatus || {};
  const runnerStatus = runnerPayload.enabled === false
    ? 'DISABLED'
    : runnerPayload.isRunning
      ? 'RUNNING'
      : latestMaintenanceRun.status || 'UNKNOWN';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: 32,
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a'
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <section
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #4338ca 55%, #7c3aed 100%)',
            color: '#ffffff',
            borderRadius: 28,
            padding: 32,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.20)'
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.2em',
              opacity: 0.88
            }}
          >
            RAFTOP CPAP CARE Pro / ATLAS
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            System Maintenance
          </h1>

          <p style={{ maxWidth: 900, fontSize: 15, opacity: 0.9 }}>
            Retention, cleanup and automatic maintenance scheduler control for monitoring snapshots and alert events.
            Open alerts are protected and are never deleted by cleanup.
          </p>

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <span
              style={{
                ...statusStyle(runnerStatus),
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              Runner: {runnerStatus}
            </span>

            <button
              onClick={refreshAll}
              disabled={state.loading || state.cleaning || state.scheduledRunning}
              style={headerButton}
            >
              Refresh All
            </button>

            <button
              onClick={runCleanup}
              disabled={state.loading || state.cleaning || state.scheduledRunning}
              style={{
                ...headerButton,
                background: 'rgba(249, 115, 22, 0.35)'
              }}
            >
              {state.cleaning ? 'Cleaning...' : 'Run Manual Cleanup'}
            </button>

            <button
              onClick={runScheduledNow}
              disabled={state.loading || state.cleaning || state.scheduledRunning}
              style={{
                ...headerButton,
                background: 'rgba(34, 197, 94, 0.28)'
              }}
            >
              {state.scheduledRunning ? 'Running Scheduler...' : 'Run Scheduled Now'}
            </button>
          </div>
        </section>

        <section
          style={{
            marginTop: 24,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Automatic Maintenance Runner</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>
                Shows whether automatic cleanup is enabled, when it last ran, and what happened.
              </p>
            </div>

            <span
              style={{
                ...statusStyle(runnerStatus),
                borderRadius: 999,
                padding: '8px 14px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              {runnerStatus}
            </span>
          </div>

          {state.runnerLoading ? (
            <div
              style={{
                marginTop: 18,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 18,
                padding: 18
              }}
            >
              Loading runner status...
            </div>
          ) : (
            <>
              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16
                }}
              >
                <PolicyCard
                  label="Enabled"
                  value={runnerPayload.enabled === true ? 'Yes' : 'No'}
                />
                <PolicyCard
                  label="Is Running"
                  value={runnerPayload.isRunning === true ? 'Yes' : 'No'}
                />
                <PolicyCard
                  label="Interval"
                  value={formatMs(runnerPayload.intervalMs)}
                />
                <PolicyCard
                  label="Last Run"
                  value={formatDate(latestMaintenanceRun.lastRunAt)}
                />
                <PolicyCard
                  label="Last Status"
                  value={latestMaintenanceRun.status || 'UNKNOWN'}
                />
                <PolicyCard
                  label="Last Source"
                  value={latestMaintenanceRun.source || '-'}
                />
              </div>

              <div
                style={{
                  marginTop: 18,
                  borderRadius: 18,
                  padding: 18,
                  ...statusStyle(latestMaintenanceRun.status || runnerStatus)
                }}
              >
                <strong>{latestMaintenanceRun.message || 'No maintenance run has been recorded yet.'}</strong>

                {latestMaintenanceRun.lastError && (
                  <div style={{ marginTop: 8 }}>
                    Error: {latestMaintenanceRun.lastError}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section
          style={{
            marginTop: 24,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24 }}>Retention Policy</h2>

          <p style={{ color: '#64748b', marginTop: 8 }}>
            Manual cleanup uses these values. Automatic scheduled cleanup uses backend environment values.
          </p>

          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <label style={inputLabel}>
              Keep Latest Snapshots
              <input
                type="number"
                min="50"
                max="10000"
                value={policy.snapshotKeepLatest}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    snapshotKeepLatest: Number(event.target.value)
                  }))
                }
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              Snapshot Retention Days
              <input
                type="number"
                min="1"
                max="3650"
                value={policy.snapshotRetentionDays}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    snapshotRetentionDays: Number(event.target.value)
                  }))
                }
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              Acknowledged Alert Retention Days
              <input
                type="number"
                min="1"
                max="3650"
                value={policy.acknowledgedAlertRetentionDays}
                onChange={(event) =>
                  setPolicy((prev) => ({
                    ...prev,
                    acknowledgedAlertRetentionDays: Number(event.target.value)
                  }))
                }
                style={inputStyle}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <PolicyCard
              label="Active Keep Latest"
              value={activePolicy.snapshotKeepLatest}
            />
            <PolicyCard
              label="Active Snapshot Days"
              value={activePolicy.snapshotRetentionDays}
            />
            <PolicyCard
              label="Active Alert Days"
              value={activePolicy.acknowledgedAlertRetentionDays}
            />
            <PolicyCard
              label="Open Alerts Protected"
              value={activePolicy.openAlertsAreNeverDeleted === true ? 'Yes' : 'No'}
            />
          </div>
        </section>

        {state.loading && (
          <div
            style={{
              marginTop: 24,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 20,
              padding: 24
            }}
          >
            Loading maintenance status...
          </div>
        )}

        {!state.loading && state.error && (
          <div
            style={{
              marginTop: 24,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 20,
              padding: 24
            }}
          >
            <strong>Maintenance Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {!state.loading && !state.error && payload && (
          <>
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16
              }}
            >
              <MetricCard label="Snapshots Total" value={monitoring.total} />
              <MetricCard label="Healthy" value={monitoring.healthy} tone="success" />
              <MetricCard
                label="Degraded"
                value={monitoring.degraded}
                tone={Number(monitoring.degraded || 0) > 0 ? 'warning' : 'success'}
              />
              <MetricCard
                label="Blocked"
                value={monitoring.blocked}
                tone={Number(monitoring.blocked || 0) > 0 ? 'danger' : 'success'}
              />
              <MetricCard label="Alert Events" value={alerts.total} />
              <MetricCard
                label="Open Alerts"
                value={alerts.open}
                tone={Number(alerts.open || 0) > 0 ? 'warning' : 'success'}
              />
              <MetricCard
                label="Acknowledged Alerts"
                value={alerts.acknowledged}
                tone="success"
              />
            </section>

            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: 20
              }}
            >
              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Monitoring Snapshot Storage</h2>

                <div style={detailGrid}>
                  <span>Total: {monitoring.total ?? 0}</span>
                  <span>Healthy: {monitoring.healthy ?? 0}</span>
                  <span>Degraded: {monitoring.degraded ?? 0}</span>
                  <span>Blocked: {monitoring.blocked ?? 0}</span>
                  <span>Oldest: {formatDate(monitoring.oldestStoredAt)}</span>
                  <span>Latest: {formatDate(monitoring.latestStoredAt)}</span>
                </div>
              </div>

              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Alert Event Storage</h2>

                <div style={detailGrid}>
                  <span>Total: {alerts.total ?? 0}</span>
                  <span>Open: {alerts.open ?? 0}</span>
                  <span>Acknowledged: {alerts.acknowledged ?? 0}</span>
                  <span>Critical Open: {alerts.criticalOpen ?? 0}</span>
                  <span>High Open: {alerts.highOpen ?? 0}</span>
                  <span>Medium Open: {alerts.mediumOpen ?? 0}</span>
                  <span>Oldest: {formatDate(alerts.oldestCreatedAt)}</span>
                  <span>Latest: {formatDate(alerts.latestCreatedAt)}</span>
                  <span>Latest Seen: {formatDate(alerts.latestSeenAt)}</span>
                </div>
              </div>
            </section>

            {cleanup && (
              <section
                style={{
                  marginTop: 24,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
                }}
              >
                <h2 style={{ margin: 0, fontSize: 24 }}>Last Manual Cleanup Result</h2>

                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14
                  }}
                >
                  <PolicyCard
                    label="Deleted Snapshots By Age"
                    value={cleanup.monitoring?.deletedByAge ?? 0}
                  />
                  <PolicyCard
                    label="Deleted Snapshots By Limit"
                    value={cleanup.monitoring?.deletedByLimit ?? 0}
                  />
                  <PolicyCard
                    label="Deleted Snapshot Total"
                    value={cleanup.monitoring?.deletedTotal ?? 0}
                  />
                  <PolicyCard
                    label="Deleted Acknowledged Alerts"
                    value={cleanup.alerts?.deletedAcknowledgedAlerts ?? 0}
                  />
                  <PolicyCard
                    label="Total Deleted"
                    value={cleanup.totalDeleted ?? 0}
                  />
                </div>
              </section>
            )}

            {state.scheduledResult && (
              <section
                style={{
                  marginTop: 24,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1e3a8a',
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
                }}
              >
                <h2 style={{ margin: 0, fontSize: 24 }}>Last Scheduled Run Result</h2>

                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14
                  }}
                >
                  <PolicyCard
                    label="Status"
                    value={state.scheduledResult.status || '-'}
                  />
                  <PolicyCard
                    label="Source"
                    value={state.scheduledResult.source || '-'}
                  />
                  <PolicyCard
                    label="Last Run"
                    value={formatDate(state.scheduledResult.lastRunAt)}
                  />
                  <PolicyCard
                    label="Deleted Total"
                    value={state.scheduledResult.lastResult?.cleanup?.totalDeleted ?? 0}
                  />
                </div>
              </section>
            )}

            <section
              style={{
                marginTop: 24,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 24,
                padding: 24
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24 }}>Debug Payload</h2>

              <button
                onClick={() => setShowRaw(!showRaw)}
                style={{
                  marginTop: 14,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 0,
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>

              {showRaw && (
                <pre
                  style={{
                    marginTop: 16,
                    background: '#020617',
                    color: '#e2e8f0',
                    padding: 18,
                    borderRadius: 16,
                    overflow: 'auto',
                    maxHeight: 520,
                    fontSize: 12
                  }}
                >
                  {JSON.stringify(
                    {
                      maintenanceStatus: payload,
                      runnerStatus: runnerPayload,
                      cleanupResult: state.cleanupResult,
                      scheduledResult: state.scheduledResult,
                      currentDatabaseStatus
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const headerButton = {
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const inputLabel = {
  display: 'grid',
  gap: 8,
  fontSize: 13,
  fontWeight: 900,
  color: '#334155'
};

const inputStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 15,
  fontWeight: 800,
  color: '#0f172a',
  background: '#ffffff'
};

const panelStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const detailGrid = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 10,
  color: '#475569',
  fontSize: 14
};