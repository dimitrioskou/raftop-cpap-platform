import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getAuthToken() {
  return (
    localStorage.getItem('raftop_auth_token') ||
    localStorage.getItem('token') ||
    ''
  );
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePayload(payload) {
  const rawSummary = payload?.summary || payload?.data?.summary || {};
  const rawMetrics = payload?.metrics || payload?.data?.metrics || rawSummary?.metrics || {};

  const rawBlockers =
    payload?.blockers ||
    payload?.data?.blockers ||
    rawSummary?.blockers ||
    [];

  const rawNextBestActions =
    payload?.nextBestActions ||
    payload?.next_best_actions ||
    payload?.data?.nextBestActions ||
    payload?.data?.next_best_actions ||
    rawSummary?.nextBestActions ||
    rawSummary?.next_best_actions ||
    [];

  const readinessStatus =
    payload?.readinessStatus ||
    payload?.readiness_status ||
    rawSummary?.readinessStatus ||
    rawSummary?.readiness_status ||
    'UNKNOWN';

  return {
    ok: payload?.ok !== false,
    readinessStatus,
    metrics: {
      totalSignals: numberValue(rawMetrics.totalSignals ?? rawSummary.totalSignals),
      openSignals: numberValue(rawMetrics.openSignals ?? rawSummary.openSignals),
      criticalSignals: numberValue(rawMetrics.criticalSignals ?? rawSummary.criticalSignals),
      totalVerifications: numberValue(rawMetrics.totalVerifications ?? rawSummary.totalVerifications),
      passedVerifications: numberValue(rawMetrics.passedVerifications ?? rawSummary.passedVerifications),
      failedVerifications: numberValue(rawMetrics.failedVerifications ?? rawSummary.failedVerifications),
      openRemediations: numberValue(rawMetrics.openRemediations ?? rawSummary.openRemediations),
      resolvedRemediations: numberValue(rawMetrics.resolvedRemediations ?? rawSummary.resolvedRemediations)
    },
    blockers: Array.isArray(rawBlockers) ? rawBlockers : [],
    nextBestActions: Array.isArray(rawNextBestActions) ? rawNextBestActions : [],
    raw: payload
  };
}

function badgeStyle(value) {
  const v = String(value || '').toUpperCase();

  if (v === 'READY' || v === 'LOW' || v === 'PASS') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    };
  }

  if (v === 'NEEDS_ATTENTION' || v === 'MEDIUM' || v === 'WARN') {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  if (v === 'BLOCKED' || v === 'HIGH' || v === 'CRITICAL' || v === 'FAIL') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  return {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1'
  };
}

function MetricCard({ label, value, danger }) {
  return (
    <div style={{
      background: danger ? '#fff1f2' : '#ffffff',
      border: danger ? '1px solid #fecdd3' : '1px solid #e2e8f0',
      borderRadius: 20,
      padding: 20,
      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
    }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 34, fontWeight: 900, color: '#0f172a' }}>
        {value}
      </div>
    </div>
  );
}

export default function TenantClosedLoopControlHubPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    payload: null
  });

  const [showRaw, setShowRaw] = useState(false);

  async function loadControlHub() {
    setState({ loading: true, error: '', payload: null });

    try {
      const token = getAuthToken();

      const response = await fetch(`${API_BASE}/api/tenant/closed-loop/control-summary`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        error: '',
        payload: normalizePayload(json)
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'Failed to load Control Hub',
        payload: null
      });
    }
  }

  useEffect(() => {
    loadControlHub();
  }, []);

  const payload = state.payload;

  const verdict = useMemo(() => {
    return String(payload?.readinessStatus || 'UNKNOWN').toUpperCase();
  }, [payload]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: 32,
      fontFamily: 'Arial, sans-serif',
      color: '#0f172a'
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <section style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%)',
          color: '#ffffff',
          borderRadius: 28,
          padding: 32,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.20)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.2em', opacity: 0.85 }}>
            RAFTOP CPAP CARE Pro / ATLAS
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Closed Loop Control Hub
          </h1>

          <p style={{ maxWidth: 860, fontSize: 15, opacity: 0.88 }}>
            Operational control layer for verification, remediation, blockers, readiness and next best actions.
          </p>

          <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              ...badgeStyle(verdict),
              borderRadius: 999,
              padding: '10px 16px',
              fontWeight: 900,
              fontSize: 13
            }}>
              Readiness: {verdict}
            </span>

            <button
              onClick={loadControlHub}
              style={{
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: 14,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        </section>

        {state.loading && (
          <div style={{ marginTop: 24, background: '#ffffff', padding: 24, borderRadius: 20 }}>
            Loading Control Hub...
          </div>
        )}

        {!state.loading && state.error && (
          <div style={{
            marginTop: 24,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: 24,
            borderRadius: 20
          }}>
            <strong>Control Hub API Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {!state.loading && !state.error && payload && (
          <>
            <section style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}>
              <MetricCard label="Total Signals" value={payload.metrics.totalSignals} />
              <MetricCard label="Open Signals" value={payload.metrics.openSignals} danger={payload.metrics.openSignals > 0} />
              <MetricCard label="Critical Signals" value={payload.metrics.criticalSignals} danger={payload.metrics.criticalSignals > 0} />
              <MetricCard label="Open Remediations" value={payload.metrics.openRemediations} danger={payload.metrics.openRemediations > 0} />
              <MetricCard label="Total Verifications" value={payload.metrics.totalVerifications} />
              <MetricCard label="Passed Verifications" value={payload.metrics.passedVerifications} />
              <MetricCard label="Failed Verifications" value={payload.metrics.failedVerifications} danger={payload.metrics.failedVerifications > 0} />
              <MetricCard label="Resolved Remediations" value={payload.metrics.resolvedRemediations} />
            </section>

            <section style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 20
            }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24 }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Blockers</h2>
                <p style={{ color: '#64748b' }}>Problems that block operational readiness.</p>

                {payload.blockers.length === 0 ? (
                  <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16 }}>
                    No blockers detected.
                  </div>
                ) : (
                  payload.blockers.map((item, index) => (
                    <div key={item.id || index} style={{
                      marginTop: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 18,
                      padding: 18
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{item.title || item.name || `Blocker ${index + 1}`}</strong>
                        <span style={{
                          ...badgeStyle(item.priority),
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontWeight: 900,
                          fontSize: 12
                        }}>
                          {item.priority || 'MEDIUM'}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, color: '#475569', fontSize: 14 }}>
                        {item.description || item.message || 'No description available.'}
                      </div>
                      <div style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>
                        Source: {item.source || item.module || 'closed-loop'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24 }}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Next Best Actions</h2>
                <p style={{ color: '#64748b' }}>Recommended actions generated by the control engine.</p>

                {payload.nextBestActions.length === 0 ? (
                  <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16 }}>
                    No action required.
                  </div>
                ) : (
                  payload.nextBestActions.map((item, index) => (
                    <div key={item.id || index} style={{
                      marginTop: 14,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 18,
                      padding: 18
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{item.title || item.action || `Action ${index + 1}`}</strong>
                        <span style={{
                          ...badgeStyle(item.priority),
                          borderRadius: 999,
                          padding: '6px 10px',
                          fontWeight: 900,
                          fontSize: 12
                        }}>
                          {item.priority || 'MEDIUM'}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, color: '#475569', fontSize: 14 }}>
                        {item.description || item.message || 'No description available.'}
                      </div>
                      <div style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>
                        Type: {item.type || 'CONTROL_ACTION'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section style={{
              marginTop: 24,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              padding: 24
            }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>Control Readiness Verdict</h2>

              <div style={{
                marginTop: 16,
                background: '#f8fafc',
                borderRadius: 18,
                padding: 18,
                color: '#334155'
              }}>
                {verdict === 'READY' && 'System is operationally ready. Continue to Phase 20 Route Stability Audit.'}
                {verdict === 'NEEDS_ATTENTION' && 'System is not blocked, but there are warnings. Fix blockers before adding risky features.'}
                {verdict === 'BLOCKED' && 'System is blocked. Do not add new features. Fix critical issues first.'}
                {!['READY', 'NEEDS_ATTENTION', 'BLOCKED'].includes(verdict) && 'Readiness is unknown. Verify backend response shape.'}
              </div>
            </section>

            <section style={{
              marginTop: 24,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              padding: 24
            }}>
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
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>

              {showRaw && (
                <pre style={{
                  marginTop: 16,
                  background: '#020617',
                  color: '#e2e8f0',
                  padding: 18,
                  borderRadius: 16,
                  overflow: 'auto',
                  maxHeight: 500,
                  fontSize: 12
                }}>
                  {JSON.stringify(payload.raw, null, 2)}
                </pre>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}