import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function statusStyle(value) {
  const normalized = String(value || '').toUpperCase();

  if (['FAIL', 'FAILED', 'BLOCKED', 'NEEDS_FIX'].includes(normalized)) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (['WARN', 'WARNING', 'NEEDS_ATTENTION'].includes(normalized)) {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  return {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  };
}

function Badge({ value }) {
  return (
    <span
      style={{
        ...statusStyle(value),
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 900,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
    >
      {value || 'UNKNOWN'}
    </span>
  );
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
          fontSize: 30,
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

export default function SystemBackendConfigAuditPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    payload: null,
    selectedCheck: null
  });

  const [filter, setFilter] = useState('ALL');
  const [showRaw, setShowRaw] = useState(false);

  async function runAudit() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: '',
        selectedCheck: null
      }));

      const response = await fetch(`${API_BASE}/api/system/backend-production-config-audit`, {
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
        error: '',
        payload: json,
        selectedCheck: null
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'Backend production config audit failed.',
        payload: null,
        selectedCheck: null
      });
    }
  }

  useEffect(() => {
    runAudit();
  }, []);

  const summary = state.payload?.summary || {};
  const checks = Array.isArray(state.payload?.checks) ? state.payload.checks : [];
  const actions = Array.isArray(state.payload?.nextBestActions)
    ? state.payload.nextBestActions
    : [];

  const readiness = state.payload?.readinessStatus || 'UNKNOWN';

  const visibleChecks = useMemo(() => {
    if (filter === 'ALL') return checks;

    if (filter === 'CRITICAL') {
      return checks.filter((item) => item.critical === true);
    }

    return checks.filter((item) => String(item.status || '').toUpperCase() === filter);
  }, [checks, filter]);

  const headerGradient =
    readiness === 'READY'
      ? 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)'
      : readiness === 'NEEDS_ATTENTION'
        ? 'linear-gradient(135deg, #78350f 0%, #d97706 55%, #f59e0b 100%)'
        : 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #ef4444 100%)';

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
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <section
          style={{
            background: headerGradient,
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
              opacity: 0.9
            }}
          >
            RAFTOP CPAP CARE Pro / Phase 23.2
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Backend Production Config Audit
          </h1>

          <p style={{ maxWidth: 980, fontSize: 15, opacity: 0.9 }}>
            Backend hardening gate for environment variables, database, CORS, security headers, secrets and production exposure risks.
          </p>

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                ...statusStyle(readiness),
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              Readiness: {readiness}
            </span>

            <button onClick={runAudit} disabled={state.loading} style={headerButton}>
              {state.loading ? 'Running...' : 'Run Audit'}
            </button>

            <button
              onClick={() => {
                window.location.href = '/system/production-readiness';
              }}
              style={headerButton}
            >
              Production Readiness
            </button>

            <button
              onClick={() => {
                window.location.href = '/system/saas-stability-audit';
              }}
              style={headerButton}
            >
              SaaS Audit
            </button>
          </div>
        </section>

        {state.error && (
          <div style={errorBox}>
            <strong>Backend Config Audit Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {state.loading && (
          <div style={loadingBox}>
            Running backend production config audit...
          </div>
        )}

        {!state.loading && state.payload && (
          <>
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 16
              }}
            >
              <MetricCard label="Total" value={summary.total} />
              <MetricCard label="Passed" value={summary.passed} tone="success" />
              <MetricCard label="Warnings" value={summary.warned} tone={summary.warned > 0 ? 'warning' : 'success'} />
              <MetricCard label="Failed" value={summary.failed} tone={summary.failed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Critical Failed" value={summary.criticalFailed} tone={summary.criticalFailed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Critical Warnings" value={summary.criticalWarnings} tone={summary.criticalWarnings > 0 ? 'warning' : 'success'} />
              <MetricCard label="Security Warnings" value={summary.securityWarnings} tone={summary.securityWarnings > 0 ? 'warning' : 'success'} />
              <MetricCard label="Security Failures" value={summary.securityFailures} tone={summary.securityFailures > 0 ? 'danger' : 'success'} />
              <MetricCard label="Database Failures" value={summary.databaseFailures} tone={summary.databaseFailures > 0 ? 'danger' : 'success'} />
            </section>

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Backend Config Verdict</h2>

              <div
                style={{
                  marginTop: 16,
                  borderRadius: 18,
                  padding: 18,
                  ...statusStyle(readiness)
                }}
              >
                <strong>
                  {readiness === 'READY'
                    ? 'Backend production config gate passed.'
                    : readiness === 'NEEDS_ATTENTION'
                      ? 'No hard blocker, but production warnings remain.'
                      : 'Backend production config is blocked. Fix critical failures first.'}
                </strong>

                <div style={{ marginTop: 8 }}>
                  Generated: {formatDate(state.payload.generatedAt)}
                </div>
              </div>
            </section>

            <section style={panelStyleWithMargin}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 24 }}>Backend Checks</h2>
                  <p style={{ marginTop: 8, color: '#64748b' }}>
                    Showing {visibleChecks.length} of {checks.length} checks.
                  </p>
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  style={inputStyle}
                >
                  <option value="ALL">All</option>
                  <option value="PASS">Pass</option>
                  <option value="WARN">Warn</option>
                  <option value="FAIL">Fail</option>
                  <option value="CRITICAL">Critical only</option>
                </select>
              </div>

              <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={th}>Status</th>
                      <th style={th}>Group</th>
                      <th style={th}>Name</th>
                      <th style={th}>Critical</th>
                      <th style={th}>Message</th>
                      <th style={th}>Next Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleChecks.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={td}>
                          No checks match this filter.
                        </td>
                      </tr>
                    ) : (
                      visibleChecks.map((check) => (
                        <tr
                          key={`${check.group}-${check.name}`}
                          style={{
                            background:
                              state.selectedCheck?.name === check.name &&
                              state.selectedCheck?.group === check.group
                                ? '#eff6ff'
                                : '#ffffff'
                          }}
                        >
                          <td style={td}>
                            <button
                              onClick={() =>
                                setState((prev) => ({
                                  ...prev,
                                  selectedCheck: check
                                }))
                              }
                              style={{
                                border: 0,
                                background: 'transparent',
                                padding: 0,
                                cursor: 'pointer'
                              }}
                            >
                              <Badge value={check.status} />
                            </button>
                          </td>
                          <td style={td}>{check.group}</td>
                          <td style={{ ...td, fontWeight: 900 }}>{check.name}</td>
                          <td style={td}>{check.critical ? 'YES' : 'NO'}</td>
                          <td style={td}>{check.message}</td>
                          <td style={td}>{check.nextAction || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {state.selectedCheck && (
              <section style={panelStyleWithMargin}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Selected Check Detail</h2>

                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    color: '#475569'
                  }}
                >
                  <span><strong>Group:</strong> {state.selectedCheck.group}</span>
                  <span><strong>Name:</strong> {state.selectedCheck.name}</span>
                  <span><strong>Status:</strong> {state.selectedCheck.status}</span>
                  <span><strong>Critical:</strong> {state.selectedCheck.critical ? 'YES' : 'NO'}</span>
                  <span><strong>Message:</strong> {state.selectedCheck.message}</span>
                </div>

                <pre style={jsonPre}>
                  {JSON.stringify(state.selectedCheck.details, null, 2)}
                </pre>
              </section>
            )}

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Next Best Actions</h2>

              {actions.length === 0 ? (
                <div style={successBoxSmall}>
                  No next best actions returned.
                </div>
              ) : (
                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                  {actions.map((action, index) => (
                    <div
                      key={`${action.type}-${index}`}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 18,
                        padding: 16
                      }}
                    >
                      <Badge value={action.priority} />
                      <h3 style={{ margin: '12px 0 6px' }}>{action.title}</h3>
                      <p style={{ margin: 0, color: '#475569' }}>{action.description}</p>
                      <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
                        Type: {action.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Debug Payload</h2>

              <button onClick={() => setShowRaw(!showRaw)} style={darkButtonSmall}>
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>

              {showRaw && (
                <pre style={jsonPre}>
                  {JSON.stringify(state.payload, null, 2)}
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

const panelStyleWithMargin = {
  marginTop: 24,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const loadingBox = {
  marginTop: 24,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 24
};

const errorBox = {
  marginTop: 24,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 24
};

const successBoxSmall = {
  marginTop: 16,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 18,
  padding: 18,
  fontWeight: 900
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

const darkButtonSmall = {
  marginTop: 14,
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const th = {
  textAlign: 'left',
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap'
};

const td = {
  padding: 12,
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  verticalAlign: 'top'
};

const jsonPre = {
  marginTop: 16,
  background: '#020617',
  color: '#e2e8f0',
  padding: 18,
  borderRadius: 16,
  overflow: 'auto',
  maxHeight: 520,
  fontSize: 12
};