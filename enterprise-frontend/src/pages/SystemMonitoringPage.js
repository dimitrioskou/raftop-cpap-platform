import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getStatusStyle(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'HEALTHY' || normalized === 'READY') {
    return {
      background: '#dcfce7',
      border: '1px solid #86efac',
      color: '#166534'
    };
  }

  if (normalized === 'DEGRADED' || normalized === 'NEEDS_ATTENTION') {
    return {
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      color: '#92400e'
    };
  }

  if (normalized === 'BLOCKED' || normalized === 'CRITICAL') {
    return {
      background: '#fee2e2',
      border: '1px solid #fca5a5',
      color: '#991b1b'
    };
  }

  return {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#334155'
  };
}

function getAlertStyle(severity) {
  const normalized = String(severity || '').toUpperCase();

  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    return {
      background: '#fff1f2',
      border: '1px solid #fecdd3',
      color: '#9f1239'
    };
  }

  if (normalized === 'MEDIUM') {
    return {
      background: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#92400e'
    };
  }

  return {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#334155'
  };
}

function MetricCard({ label, value, danger }) {
  return (
    <div
      style={{
        background: danger ? '#fff1f2' : '#ffffff',
        border: danger ? '1px solid #fecdd3' : '1px solid #e2e8f0',
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

export default function SystemMonitoringPage() {
  const [state, setState] = useState({
    loading: true,
    running: false,
    error: '',
    payload: null
  });

  const [showRaw, setShowRaw] = useState(false);

  async function loadLatest() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: ''
      }));

      const response = await fetch(`${API_BASE}/api/system/monitoring/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        running: false,
        error: '',
        payload: json
      });
    } catch (error) {
      setState({
        loading: false,
        running: false,
        error: error.message || 'Failed to load monitoring status.',
        payload: null
      });
    }
  }

  async function runNow() {
    try {
      setState((prev) => ({
        ...prev,
        running: true,
        error: ''
      }));

      const response = await fetch(`${API_BASE}/api/system/monitoring/run-now`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        running: false,
        error: '',
        payload: json
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        running: false,
        error: error.message || 'Failed to run monitoring audit.'
      }));
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  const payload = state.payload || {};
  const summary = payload.summary || {};
  const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];
  const auditResults = Array.isArray(payload.audit?.results) ? payload.audit.results : [];

  const statusLabel = useMemo(() => {
    return String(payload.status || 'UNKNOWN').toUpperCase();
  }, [payload.status]);

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
            background:
              statusLabel === 'HEALTHY'
                ? 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)'
                : statusLabel === 'BLOCKED'
                  ? 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #ef4444 100%)'
                  : 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #f59e0b 100%)',
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
            System Monitoring & Self-Protection
          </h1>

          <p style={{ maxWidth: 900, fontSize: 15, opacity: 0.9 }}>
            Live operational status based on the backend Route Stability Audit.
            This page tells you whether the platform is healthy, degraded or blocked.
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
                ...getStatusStyle(statusLabel),
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              Status: {statusLabel}
            </span>

            <button
              onClick={runNow}
              disabled={state.running}
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.14)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: 14,
                fontWeight: 900,
                cursor: state.running ? 'not-allowed' : 'pointer',
                opacity: state.running ? 0.65 : 1
              }}
            >
              {state.running ? 'Running Audit...' : 'Run Monitoring Now'}
            </button>

            <button
              onClick={loadLatest}
              disabled={state.loading}
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: 14,
                fontWeight: 900,
                cursor: state.loading ? 'not-allowed' : 'pointer'
              }}
            >
              Refresh Status
            </button>
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
            Loading monitoring status...
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
            <strong>Monitoring Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {!state.loading && !state.error && payload && (
          <>
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
              <h2 style={{ margin: 0, fontSize: 24 }}>Current Verdict</h2>

              <div
                style={{
                  marginTop: 14,
                  padding: 18,
                  borderRadius: 18,
                  ...getStatusStyle(statusLabel)
                }}
              >
                <strong>{payload.message || 'No monitoring message available.'}</strong>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  Generated: {payload.generatedAt || 'Not generated yet'}
                </div>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  Stored: {payload.storedAt || 'Not stored yet'}
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16
              }}
            >
              <MetricCard label="Total Routes" value={summary.total} />
              <MetricCard label="Passed" value={summary.passed} />
              <MetricCard label="Warnings" value={summary.warned} danger={Number(summary.warned || 0) > 0} />
              <MetricCard label="Failed" value={summary.failed} danger={Number(summary.failed || 0) > 0} />
              <MetricCard label="Critical Failed" value={summary.criticalFailed} danger={Number(summary.criticalFailed || 0) > 0} />
              <MetricCard label="Route Not Found" value={summary.routeNotFound} danger={Number(summary.routeNotFound || 0) > 0} />
              <MetricCard label="Server Errors" value={summary.serverErrors} danger={Number(summary.serverErrors || 0) > 0} />
              <MetricCard label="Fallback Detected" value={summary.fallbackDetected} danger={Number(summary.fallbackDetected || 0) > 0} />
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
              <h2 style={{ margin: 0, fontSize: 24 }}>Alerts</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>
                Alerts are generated automatically from backend audit failures.
              </p>

              {alerts.length === 0 ? (
                <div
                  style={{
                    marginTop: 16,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    borderRadius: 18,
                    padding: 18,
                    fontWeight: 800
                  }}
                >
                  No active alerts. System is clean.
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={alert.id || index}
                    style={{
                      marginTop: 14,
                      borderRadius: 18,
                      padding: 18,
                      ...getAlertStyle(alert.severity)
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <strong>{alert.title || `Alert ${index + 1}`}</strong>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '5px 10px',
                          background: '#ffffff',
                          fontSize: 12,
                          fontWeight: 900
                        }}
                      >
                        {alert.severity || 'UNKNOWN'}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      {alert.message || 'No alert message.'}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                      Source: {alert.source || 'system'} · Created: {alert.createdAt || '-'}
                    </div>
                  </div>
                ))
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
              <h2 style={{ margin: 0, fontSize: 24 }}>Route Results</h2>
              <p style={{ color: '#64748b', marginTop: 8 }}>
                Latest audit result for every critical backend route.
              </p>

              <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={th}>Group</th>
                      <th style={th}>Name</th>
                      <th style={th}>Path</th>
                      <th style={th}>Status</th>
                      <th style={th}>Code</th>
                      <th style={th}>Time</th>
                      <th style={th}>Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditResults.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={td}>
                          No audit results available. Click “Run Monitoring Now”.
                        </td>
                      </tr>
                    ) : (
                      auditResults.map((item, index) => (
                        <tr key={`${item.path}-${index}`}>
                          <td style={td}>{item.group}</td>
                          <td style={td}>{item.name}</td>
                          <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>
                            {item.path}
                          </td>
                          <td style={td}>
                            <span
                              style={{
                                ...getStatusStyle(item.status),
                                borderRadius: 999,
                                padding: '5px 10px',
                                fontWeight: 900,
                                fontSize: 12
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td style={td}>{item.statusCode}</td>
                          <td style={td}>{item.durationMs}ms</td>
                          <td style={td}>{item.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

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
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const th = {
  textAlign: 'left',
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em'
};

const td = {
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#334155'
};