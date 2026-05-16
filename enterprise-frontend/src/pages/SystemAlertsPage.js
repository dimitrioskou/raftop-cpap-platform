import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getSeverityStyle(severity) {
  const normalized = String(severity || '').toUpperCase();

  if (normalized === 'CRITICAL') {
    return { background: '#7f1d1d', color: '#ffffff', border: '1px solid #991b1b' };
  }

  if (normalized === 'HIGH') {
    return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
  }

  if (normalized === 'MEDIUM') {
    return { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
  }

  if (normalized === 'LOW') {
    return { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' };
  }

  return { background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' };
}

function getStatusStyle(openCount) {
  if (Number(openCount || 0) > 0) {
    return { background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' };
  }

  return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
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

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

export default function SystemAlertsPage() {
  const [state, setState] = useState({
    loading: true,
    acknowledgingId: '',
    error: '',
    payload: null
  });

  const [showRaw, setShowRaw] = useState(false);
  const [filter, setFilter] = useState('OPEN');

  async function loadAlerts() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));

      const response = await fetch(`${API_BASE}/api/system/alerts?limit=100`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        acknowledgingId: '',
        error: '',
        payload: json
      });
    } catch (error) {
      setState({
        loading: false,
        acknowledgingId: '',
        error: error.message || 'Failed to load system alerts.',
        payload: null
      });
    }
  }

  async function acknowledgeAlert(alertId) {
    try {
      setState((prev) => ({ ...prev, acknowledgingId: alertId, error: '' }));

      const response = await fetch(
        `${API_BASE}/api/system/alerts/${encodeURIComponent(alertId)}/acknowledge`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadAlerts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        acknowledgingId: '',
        error: error.message || 'Failed to acknowledge alert.'
      }));
    }
  }

  async function acknowledgeAll() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));

      const response = await fetch(`${API_BASE}/api/system/alerts/acknowledge-all`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadAlerts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to acknowledge all alerts.'
      }));
    }
  }

  async function runMonitoringAndRefresh() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));

      const response = await fetch(`${API_BASE}/api/system/monitoring/run-now`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      await loadAlerts();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to run monitoring.'
      }));
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const payload = state.payload || {};
  const stats = payload.stats || {};
  const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];

  const visibleAlerts = useMemo(() => {
    if (filter === 'ALL') return alerts;
    if (filter === 'OPEN') return alerts.filter((alert) => alert.acknowledged !== true);
    if (filter === 'ACKNOWLEDGED') return alerts.filter((alert) => alert.acknowledged === true);

    return alerts.filter((alert) => String(alert.severity || '').toUpperCase() === filter);
  }, [alerts, filter]);

  const openCount = Number(stats.open || 0);

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
              openCount > 0
                ? 'linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #f97316 100%)'
                : 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)',
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
            System Alerts
          </h1>

          <p style={{ maxWidth: 900, fontSize: 15, opacity: 0.9 }}>
            Deduplicated persistent alert inbox. Repeated issues increase occurrence count instead of flooding the system.
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
                ...getStatusStyle(openCount),
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              {openCount > 0 ? `${openCount} Open Alert(s)` : 'No Open Alerts'}
            </span>

            <button onClick={loadAlerts} disabled={state.loading} style={headerButton}>
              Refresh Alerts
            </button>

            <button onClick={runMonitoringAndRefresh} disabled={state.loading} style={headerButton}>
              Run Monitoring
            </button>

            <button onClick={acknowledgeAll} disabled={state.loading || openCount === 0} style={headerButton}>
              Acknowledge All
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
            Loading alerts...
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
            <strong>Alert UI Error</strong>
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
              <MetricCard label="Alert Types" value={stats.total} />
              <MetricCard label="Open" value={stats.open} tone={Number(stats.open || 0) > 0 ? 'warning' : 'success'} />
              <MetricCard label="Acknowledged" value={stats.acknowledged} tone="success" />
              <MetricCard label="Total Occurrences" value={stats.totalOccurrences} tone="warning" />
              <MetricCard label="Critical Open" value={stats.criticalOpen} tone={Number(stats.criticalOpen || 0) > 0 ? 'danger' : 'success'} />
              <MetricCard label="High Open" value={stats.highOpen} tone={Number(stats.highOpen || 0) > 0 ? 'danger' : 'success'} />
              <MetricCard label="Medium Open" value={stats.mediumOpen} tone={Number(stats.mediumOpen || 0) > 0 ? 'warning' : 'success'} />
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
                  <h2 style={{ margin: 0, fontSize: 24 }}>Alert Inbox</h2>
                  <p style={{ color: '#64748b', marginTop: 8 }}>
                    Review, acknowledge and track recurring monitoring events.
                  </p>
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 800,
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="OPEN">Open only</option>
                  <option value="ALL">All alerts</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {visibleAlerts.length === 0 ? (
                <div
                  style={{
                    marginTop: 18,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    borderRadius: 18,
                    padding: 18,
                    fontWeight: 900
                  }}
                >
                  No alerts match this filter.
                </div>
              ) : (
                <div style={{ marginTop: 18, display: 'grid', gap: 14 }}>
                  {visibleAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        background: alert.acknowledged ? '#f8fafc' : '#ffffff',
                        border: alert.acknowledged ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                        borderRadius: 20,
                        padding: 20,
                        boxShadow: alert.acknowledged ? 'none' : '0 12px 28px rgba(15, 23, 42, 0.06)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 16,
                          alignItems: 'flex-start',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 280 }}>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                ...getSeverityStyle(alert.severity),
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 900
                              }}
                            >
                              {alert.severity || 'UNKNOWN'}
                            </span>

                            <span
                              style={{
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 900,
                                background: alert.acknowledged ? '#dcfce7' : '#fff7ed',
                                color: alert.acknowledged ? '#166534' : '#9a3412',
                                border: alert.acknowledged ? '1px solid #bbf7d0' : '1px solid #fed7aa'
                              }}
                            >
                              {alert.acknowledged ? 'ACKNOWLEDGED' : 'OPEN'}
                            </span>

                            <span
                              style={{
                                borderRadius: 999,
                                padding: '6px 10px',
                                fontSize: 12,
                                fontWeight: 900,
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            >
                              Occurrences: {alert.occurrenceCount || 1}
                            </span>
                          </div>

                          <h3 style={{ margin: '14px 0 8px', fontSize: 20 }}>
                            {alert.title || 'System alert'}
                          </h3>

                          <div style={{ color: '#475569', fontSize: 14 }}>
                            {alert.message || 'No alert message.'}
                          </div>

                          <div
                            style={{
                              marginTop: 12,
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                              gap: 8,
                              color: '#64748b',
                              fontSize: 12
                            }}
                          >
                            <span>Source: {alert.source || 'system'}</span>
                            <span>First seen: {formatDate(alert.firstSeenAt || alert.createdAt)}</span>
                            <span>Last seen: {formatDate(alert.lastSeenAt || alert.createdAt)}</span>
                            {alert.acknowledgedAt && (
                              <span>Acknowledged: {formatDate(alert.acknowledgedAt)}</span>
                            )}
                          </div>

                          {alert.fingerprint && (
                            <div
                              style={{
                                marginTop: 10,
                                color: '#94a3b8',
                                fontSize: 11,
                                fontFamily: 'monospace'
                              }}
                            >
                              Fingerprint: {String(alert.fingerprint).slice(0, 18)}...
                            </div>
                          )}
                        </div>

                        <div>
                          {!alert.acknowledged ? (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              disabled={state.acknowledgingId === alert.id}
                              style={{
                                border: 0,
                                background: '#0f172a',
                                color: '#ffffff',
                                borderRadius: 12,
                                padding: '10px 14px',
                                fontWeight: 900,
                                cursor: state.acknowledgingId === alert.id ? 'not-allowed' : 'pointer',
                                opacity: state.acknowledgingId === alert.id ? 0.65 : 1
                              }}
                            >
                              {state.acknowledgingId === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                            </button>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                borderRadius: 12,
                                padding: '10px 14px',
                                fontWeight: 900,
                                background: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #bbf7d0'
                              }}
                            >
                              Done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

const headerButton = {
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};