import React, { useEffect, useMemo, useState } from 'react';
import { runFrontendProductionConfigAudit } from '../services/frontendProductionConfigAudit';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'demo-tenant'
  );
}

function getSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

function statusStyle(value) {
  const normalized = String(value || '').toUpperCase();

  if (['FAIL', 'FAILED', 'BLOCKED', 'NEEDS_FIX', 'NOT_READY'].includes(normalized)) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (
    [
      'WARN',
      'WARNING',
      'NEEDS_ATTENTION',
      'READY_WITH_WARNINGS',
      'READY_WITH_CRITICAL_WARNINGS'
    ].includes(normalized)
  ) {
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

function buildFrontendStage(frontendPayload) {
  const summary = frontendPayload?.summary || {};

  const failed = Number(summary.failed || 0);
  const criticalFailed = Number(summary.criticalFailed || 0);
  const warned = Number(summary.warned || 0);
  const criticalWarnings = Number(summary.criticalWarnings || 0);

  let status = 'PASS';
  let message = 'Frontend production config audit passed.';

  if (criticalFailed > 0 || failed > 0) {
    status = 'FAIL';
    message = `Frontend config has failures: failed=${failed}, criticalFailed=${criticalFailed}.`;
  } else if (warned > 0 || criticalWarnings > 0) {
    status = 'WARN';
    message = `Frontend config has warnings: warned=${warned}, criticalWarnings=${criticalWarnings}.`;
  }

  return {
    group: 'frontend',
    name: 'Frontend Production Config Audit',
    status,
    critical: true,
    message,
    details: {
      phase: frontendPayload?.phase || null,
      readinessStatus: frontendPayload?.readinessStatus || null,
      summary: frontendPayload?.summary || null,
      runtime: frontendPayload?.runtime || null
    },
    nextAction:
      status === 'PASS'
        ? null
        : 'Open /system/frontend-config and fix frontend API/dev-control/secret exposure warnings.',
    generatedAt: new Date().toISOString()
  };
}

function buildCombinedSummary(backendPayload, frontendPayload) {
  const backendSummary = backendPayload?.summary || {};
  const frontendSummary = frontendPayload?.summary || {};

  const backendChecks = Array.isArray(backendPayload?.checks)
    ? backendPayload.checks
    : [];

  const frontendStage = buildFrontendStage(frontendPayload);

  const checks = [...backendChecks, frontendStage];

  return {
    total: checks.length,
    passed: checks.filter((check) => check.status === 'PASS').length,
    warned: checks.filter((check) => check.status === 'WARN').length,
    failed: checks.filter((check) => check.status === 'FAIL').length,
    criticalFailed: checks.filter((check) => check.status === 'FAIL' && check.critical).length,
    criticalWarnings: checks.filter((check) => check.status === 'WARN' && check.critical).length,
    backendFailed: Number(backendSummary.failed || 0),
    backendCriticalFailed: Number(backendSummary.criticalFailed || 0),
    frontendFailed: Number(frontendSummary.failed || 0),
    frontendCriticalFailed: Number(frontendSummary.criticalFailed || 0),
    frontendWarnings: Number(frontendSummary.warned || 0)
  };
}

function buildCombinedReadiness(summary) {
  if (summary.criticalFailed > 0) return 'BLOCKED';
  if (summary.failed > 0) return 'NEEDS_FIX';
  if (summary.warned > 0) return 'NEEDS_ATTENTION';
  return 'READY';
}

function buildCommercialDemoStatus(summary) {
  if (summary.criticalFailed > 0 || summary.failed > 0) return 'NOT_READY';
  if (summary.criticalWarnings > 0) return 'READY_WITH_CRITICAL_WARNINGS';
  if (summary.warned > 0) return 'READY_WITH_WARNINGS';
  return 'READY';
}

export default function SystemReleaseCandidatePage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    backendPayload: null,
    frontendPayload: null,
    selectedCheck: null
  });

  const [tenantId, setTenantId] = useState(getTenantId());
  const [superAdminKey, setSuperAdminKey] = useState(getSuperAdminKey());
  const [filter, setFilter] = useState('ALL');
  const [showRaw, setShowRaw] = useState(false);

  async function runAudit() {
    try {
      const cleanTenantId = String(tenantId || 'demo-tenant').trim() || 'demo-tenant';

      localStorage.setItem('tenant_id', cleanTenantId);
      localStorage.setItem('tenantId', cleanTenantId);

      if (superAdminKey) {
        localStorage.setItem('super_admin_api_key', superAdminKey);
        localStorage.setItem('superAdminApiKey', superAdminKey);
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: '',
        selectedCheck: null
      }));

      const [backendResponse, frontendPayload] = await Promise.all([
        fetch(
          `${API_BASE}/api/system/release-candidate-audit?tenantId=${encodeURIComponent(cleanTenantId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'x-tenant-id': cleanTenantId,
              'x-super-admin-key': superAdminKey
            }
          }
        ),
        runFrontendProductionConfigAudit()
      ]);

      const backendPayload = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(
          backendPayload?.message ||
            backendPayload?.error ||
            `HTTP ${backendResponse.status}`
        );
      }

      setState({
        loading: false,
        error: '',
        backendPayload,
        frontendPayload,
        selectedCheck: null
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'Release candidate audit failed.',
        backendPayload: null,
        frontendPayload: null,
        selectedCheck: null
      });
    }
  }

  useEffect(() => {
    runAudit();
  }, []);

  const frontendStage = state.frontendPayload
    ? buildFrontendStage(state.frontendPayload)
    : null;

  const backendChecks = Array.isArray(state.backendPayload?.checks)
    ? state.backendPayload.checks
    : [];

  const checks = frontendStage ? [...backendChecks, frontendStage] : backendChecks;

  const summary = buildCombinedSummary(state.backendPayload, state.frontendPayload);
  const readiness = buildCombinedReadiness(summary);
  const commercialDemoStatus = buildCommercialDemoStatus(summary);

  const actions = [
    ...(Array.isArray(state.backendPayload?.nextBestActions)
      ? state.backendPayload.nextBestActions
      : []),
    ...(state.frontendPayload?.nextBestActions || [])
  ];

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
            RAFTOP CPAP CARE Pro / Phase 23.7
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Final Release Candidate Checklist
          </h1>

          <p style={{ maxWidth: 980, fontSize: 15, opacity: 0.9 }}>
            Final gate combining SaaS stability, route stability, production readiness, backend config, frontend config, database backup safety, security exposure, tenant cleanup and system alerts.
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

            <span
              style={{
                ...statusStyle(commercialDemoStatus),
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 900,
                fontSize: 13
              }}
            >
              Commercial Demo: {commercialDemoStatus}
            </span>

            <button onClick={runAudit} disabled={state.loading} style={headerButton}>
              {state.loading ? 'Running...' : 'Run Final Audit'}
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
                window.location.href = '/system/security-exposure';
              }}
              style={headerButton}
            >
              Security Exposure
            </button>

            <button
              onClick={() => {
                window.location.href = '/system/tenant-cleanup';
              }}
              style={headerButton}
            >
              Tenant Cleanup
            </button>
          </div>
        </section>

        <section style={panelStyleWithMargin}>
          <h2 style={{ margin: 0, fontSize: 24 }}>Audit Inputs</h2>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1fr) auto',
              gap: 12,
              alignItems: 'end'
            }}
          >
            <label style={inputLabel}>
              Tenant ID
              <input
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              x-super-admin-key
              <input
                type="password"
                value={superAdminKey}
                onChange={(event) => setSuperAdminKey(event.target.value)}
                placeholder="local-super-admin-key-raftop-2026"
                style={inputStyle}
              />
            </label>

            <button onClick={runAudit} disabled={state.loading} style={darkButton}>
              Save & Run
            </button>
          </div>
        </section>

        {state.error && (
          <div style={errorBox}>
            <strong>Release Candidate Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {state.loading && (
          <div style={loadingBox}>
            Running final release candidate audit...
          </div>
        )}

        {!state.loading && state.backendPayload && state.frontendPayload && (
          <>
            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 16
              }}
            >
              <MetricCard label="Total Gates" value={summary.total} />
              <MetricCard label="Passed" value={summary.passed} tone="success" />
              <MetricCard label="Warnings" value={summary.warned} tone={summary.warned > 0 ? 'warning' : 'success'} />
              <MetricCard label="Failed" value={summary.failed} tone={summary.failed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Critical Failed" value={summary.criticalFailed} tone={summary.criticalFailed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Critical Warnings" value={summary.criticalWarnings} tone={summary.criticalWarnings > 0 ? 'warning' : 'success'} />
              <MetricCard label="Backend Failed" value={summary.backendFailed} tone={summary.backendFailed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Frontend Failed" value={summary.frontendFailed} tone={summary.frontendFailed > 0 ? 'danger' : 'success'} />
              <MetricCard label="Frontend Warnings" value={summary.frontendWarnings} tone={summary.frontendWarnings > 0 ? 'warning' : 'success'} />
            </section>

            <section style={panelStyleWithMargin}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Final Verdict</h2>

              <div
                style={{
                  marginTop: 16,
                  borderRadius: 18,
                  padding: 18,
                  ...statusStyle(commercialDemoStatus)
                }}
              >
                <strong>
                  {commercialDemoStatus === 'READY'
                    ? 'Release Candidate approved with no warnings.'
                    : commercialDemoStatus === 'READY_WITH_WARNINGS'
                      ? 'Release Candidate possible, but warnings must be reviewed before external demo.'
                      : commercialDemoStatus === 'READY_WITH_CRITICAL_WARNINGS'
                        ? 'Release Candidate technically possible, but critical warnings remain. Do not present as production-ready.'
                        : 'Release Candidate is blocked. Fix failures first.'}
                </strong>

                <div style={{ marginTop: 8 }}>
                  Generated: {formatDate(state.backendPayload.generatedAt)}
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
                  <h2 style={{ margin: 0, fontSize: 24 }}>Release Gates</h2>
                  <p style={{ marginTop: 8, color: '#64748b' }}>
                    Showing {visibleChecks.length} of {checks.length} release gates.
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
                      <th style={th}>Gate</th>
                      <th style={th}>Critical</th>
                      <th style={th}>Message</th>
                      <th style={th}>Next Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleChecks.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={td}>
                          No release gates match this filter.
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
                <h2 style={{ margin: 0, fontSize: 24 }}>Selected Gate Detail</h2>

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
                  <span><strong>Gate:</strong> {state.selectedCheck.name}</span>
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
              <h2 style={{ margin: 0, fontSize: 24 }}>Final Next Best Actions</h2>

              {actions.length === 0 ? (
                <div style={successBoxSmall}>
                  No next best actions returned.
                </div>
              ) : (
                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                  {actions.slice(0, 12).map((action, index) => (
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
                  {JSON.stringify(
                    {
                      backendPayload: state.backendPayload,
                      frontendPayload: state.frontendPayload,
                      combinedSummary: summary,
                      combinedReadiness: readiness,
                      commercialDemoStatus
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

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
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