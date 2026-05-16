import React, { useEffect, useMemo, useState } from 'react';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getStoredSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

function setStoredSuperAdminKey(value) {
  localStorage.setItem('super_admin_api_key', value || '');
  localStorage.setItem('superAdminApiKey', value || '');
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function statusStyle(value) {
  const normalized = String(value || '').toUpperCase();

  if (['FAILED', 'DENIED', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(normalized)) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (['WARNING', 'UPDATE_TENANT_SUBSCRIPTION', 'FORCE_TENANT_EXPIRED'].includes(normalized)) {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  if (['SUCCESS', 'CREATE_TENANT_SUBSCRIPTION', 'FORCE_TENANT_ACTIVE'].includes(normalized)) {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #bbf7d0'
    };
  }

  return {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1'
  };
}

function Badge({ value }) {
  return (
    <span
      style={{
        ...statusStyle(value),
        borderRadius: 999,
        padding: '5px 10px',
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
          fontSize: 32,
          fontWeight: 900,
          color: '#0f172a'
        }}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function getChangedFields(log) {
  const changedFields = Array.isArray(log?.changes?.changedFields)
    ? log.changes.changedFields
    : [];

  if (changedFields.length === 0) {
    return '-';
  }

  return changedFields.slice(0, 6).join(', ') + (changedFields.length > 6 ? '…' : '');
}

function getActionLabel(action) {
  const value = String(action || '').replace(/_/g, ' ');

  return value || 'UNKNOWN ACTION';
}

export default function SuperAdminAuditLogsPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    success: '',
    payload: null,
    selectedLog: null
  });

  const [superAdminKey, setSuperAdminKey] = useState(getStoredSuperAdminKey());

  const [filters, setFilters] = useState({
    tenantId: '',
    action: '',
    outcome: '',
    actor: '',
    limit: 100
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  function buildQuery() {
    const params = new URLSearchParams();

    if (filters.tenantId.trim()) params.set('tenantId', filters.tenantId.trim());
    if (filters.action.trim()) params.set('action', filters.action.trim());
    if (filters.outcome.trim()) params.set('outcome', filters.outcome.trim());
    if (filters.actor.trim()) params.set('actor', filters.actor.trim());

    params.set('limit', String(filters.limit || 100));

    return params.toString();
  }

  async function loadAuditLogs() {
    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: '',
        success: ''
      }));

      const key = getStoredSuperAdminKey();

      const response = await fetch(`${API_BASE}/api/super-admin/audit-logs?${buildQuery()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-super-admin-key': key
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: '',
        payload: json,
        selectedLog: prev.selectedLog
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load super admin audit logs.',
        payload: null
      }));
    }
  }

  function saveKeyAndReload() {
    setStoredSuperAdminKey(superAdminKey);

    setState((prev) => ({
      ...prev,
      success: 'Super admin key saved locally.',
      error: ''
    }));

    loadAuditLogs();
  }

  function clearFilters() {
    setFilters({
      tenantId: '',
      action: '',
      outcome: '',
      actor: '',
      limit: 100
    });

    setClientSearch('');

    setTimeout(() => {
      loadAuditLogs();
    }, 50);
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const logs = Array.isArray(state.payload?.logs) ? state.payload.logs : [];
  const stats = state.payload?.stats || {};

  const visibleLogs = useMemo(() => {
    if (!clientSearch.trim()) return logs;

    const query = clientSearch.toLowerCase();

    return logs.filter((log) => {
      return (
        String(log.tenantId || '').toLowerCase().includes(query) ||
        String(log.actor || '').toLowerCase().includes(query) ||
        String(log.action || '').toLowerCase().includes(query) ||
        String(log.outcome || '').toLowerCase().includes(query) ||
        String(log.message || '').toLowerCase().includes(query) ||
        String(log.ipAddress || '').toLowerCase().includes(query)
      );
    });
  }, [logs, clientSearch]);

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
            background: 'linear-gradient(135deg, #111827 0%, #4c1d95 55%, #7c3aed 100%)',
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
            RAFTOP CPAP CARE Pro / Super Admin Audit
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Super Admin Audit Logs
          </h1>

          <p style={{ maxWidth: 980, fontSize: 15, opacity: 0.9 }}>
            Immutable operational history for tenant provisioning, subscription edits, lock/unlock actions and emergency admin operations.
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
            <button
              onClick={loadAuditLogs}
              disabled={state.loading}
              style={headerButton}
            >
              {state.loading ? 'Loading...' : 'Refresh'}
            </button>

            <button
              onClick={() => {
                window.location.href = '/super-admin/subscriptions';
              }}
              style={headerButton}
            >
              Subscription Console
            </button>

            <button
              onClick={() => {
                window.location.href = '/tenant/subscription';
              }}
              style={headerButton}
            >
              Tenant Subscription
            </button>
          </div>
        </section>

        <section style={panelStyleWithMargin}>
          <h2 style={{ margin: 0, fontSize: 24 }}>Super Admin API Key</h2>

          <p style={{ color: '#64748b', marginTop: 8 }}>
            The key is stored in browser localStorage for local development. In production this should become JWT role-based authentication.
          </p>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'minmax(260px, 1fr) auto',
              gap: 12,
              alignItems: 'end'
            }}
          >
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

            <button
              onClick={saveKeyAndReload}
              style={darkButton}
            >
              Save Key & Reload
            </button>
          </div>
        </section>

        {state.error && (
          <div style={errorBox}>
            <strong>Audit Log Error</strong>
            <div style={{ marginTop: 8 }}>{state.error}</div>
          </div>
        )}

        {state.success && (
          <div style={successBox}>
            <strong>Success</strong>
            <div style={{ marginTop: 8 }}>{state.success}</div>
          </div>
        )}

        <section style={panelStyleWithMargin}>
          <h2 style={{ margin: 0, fontSize: 24 }}>Filters</h2>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14
            }}
          >
            <label style={inputLabel}>
              Tenant ID
              <input
                value={filters.tenantId}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    tenantId: event.target.value
                  }))
                }
                placeholder="demo-tenant"
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              Action
              <select
                value={filters.action}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    action: event.target.value
                  }))
                }
                style={inputStyle}
              >
                <option value="">All actions</option>
                <option value="CREATE_TENANT_SUBSCRIPTION">CREATE_TENANT_SUBSCRIPTION</option>
                <option value="UPDATE_TENANT_SUBSCRIPTION">UPDATE_TENANT_SUBSCRIPTION</option>
                <option value="FORCE_TENANT_ACTIVE">FORCE_TENANT_ACTIVE</option>
                <option value="FORCE_TENANT_EXPIRED">FORCE_TENANT_EXPIRED</option>
                <option value="FORCE_TENANT_SUSPENDED">FORCE_TENANT_SUSPENDED</option>
              </select>
            </label>

            <label style={inputLabel}>
              Outcome
              <select
                value={filters.outcome}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    outcome: event.target.value
                  }))
                }
                style={inputStyle}
              >
                <option value="">All outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="DENIED">DENIED</option>
                <option value="WARNING">WARNING</option>
              </select>
            </label>

            <label style={inputLabel}>
              Actor
              <input
                value={filters.actor}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    actor: event.target.value
                  }))
                }
                placeholder="dimitris-local-admin"
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              Limit
              <input
                type="number"
                min="1"
                max="500"
                value={filters.limit}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    limit: Number(event.target.value)
                  }))
                }
                style={inputStyle}
              />
            </label>

            <label style={inputLabel}>
              Client Search
              <input
                value={clientSearch}
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Search loaded rows..."
                style={inputStyle}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: 18,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <button onClick={loadAuditLogs} style={blueButton}>
              Apply Filters
            </button>

            <button onClick={clearFilters} style={darkButton}>
              Clear Filters
            </button>
          </div>
        </section>

        {state.loading && (
          <div style={loadingBox}>
            Loading super admin audit logs...
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
              <MetricCard label="Total" value={stats.total} />
              <MetricCard label="Success" value={stats.success} tone="success" />
              <MetricCard label="Failed" value={stats.failed} tone={Number(stats.failed || 0) > 0 ? 'danger' : 'success'} />
              <MetricCard label="Created" value={stats.created} />
              <MetricCard label="Updated" value={stats.updated} />
              <MetricCard label="Forced Active" value={stats.forcedActive} tone="success" />
              <MetricCard label="Forced Expired" value={stats.forcedExpired} tone={Number(stats.forcedExpired || 0) > 0 ? 'warning' : 'success'} />
              <MetricCard label="Forced Suspended" value={stats.forcedSuspended} tone={Number(stats.forcedSuspended || 0) > 0 ? 'danger' : 'success'} />
              <MetricCard label="Last Event" value={formatDate(stats.lastEventAt)} />
            </section>

            <section
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: state.selectedLog ? 'minmax(0, 1.3fr) minmax(380px, 0.7fr)' : '1fr',
                gap: 20,
                alignItems: 'start'
              }}
            >
              <div style={panelStyle}>
                <h2 style={{ margin: 0, fontSize: 24 }}>Audit Log Events</h2>

                <p style={{ color: '#64748b', marginTop: 8 }}>
                  Showing {visibleLogs.length} loaded audit log event(s).
                </p>

                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={th}>Time</th>
                        <th style={th}>Outcome</th>
                        <th style={th}>Action</th>
                        <th style={th}>Tenant</th>
                        <th style={th}>Actor</th>
                        <th style={th}>Changed Fields</th>
                        <th style={th}>IP</th>
                        <th style={th}>Message</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleLogs.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={td}>
                            No audit logs match this filter.
                          </td>
                        </tr>
                      ) : (
                        visibleLogs.map((log) => (
                          <tr
                            key={log.id}
                            style={{
                              background:
                                state.selectedLog?.id === log.id ? '#eff6ff' : '#ffffff'
                            }}
                          >
                            <td style={td}>
                              <button
                                onClick={() =>
                                  setState((prev) => ({
                                    ...prev,
                                    selectedLog: log
                                  }))
                                }
                                style={{
                                  border: 0,
                                  background: 'transparent',
                                  color: '#2563eb',
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                  padding: 0,
                                  textAlign: 'left'
                                }}
                              >
                                {formatDate(log.createdAt)}
                              </button>
                            </td>

                            <td style={td}>
                              <Badge value={log.outcome} />
                            </td>

                            <td style={td}>
                              <Badge value={log.action} />
                            </td>

                            <td style={{ ...td, fontWeight: 900 }}>
                              {log.tenantId || '-'}
                            </td>

                            <td style={td}>
                              {log.actor || '-'}
                            </td>

                            <td style={td}>
                              {getChangedFields(log)}
                            </td>

                            <td style={td}>
                              {log.ipAddress || '-'}
                            </td>

                            <td style={td}>
                              {log.message || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {state.selectedLog && (
                <div style={panelStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: 24 }}>Audit Detail</h2>

                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          selectedLog: null
                        }))
                      }
                      style={smallDarkButton}
                    >
                      Close
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      display: 'grid',
                      gap: 10,
                      fontSize: 14,
                      color: '#475569'
                    }}
                  >
                    <span><strong>ID:</strong> {state.selectedLog.id}</span>
                    <span><strong>Tenant:</strong> {state.selectedLog.tenantId || '-'}</span>
                    <span><strong>Actor:</strong> {state.selectedLog.actor || '-'}</span>
                    <span><strong>Action:</strong> {getActionLabel(state.selectedLog.action)}</span>
                    <span><strong>Outcome:</strong> {state.selectedLog.outcome}</span>
                    <span><strong>Created:</strong> {formatDate(state.selectedLog.createdAt)}</span>
                    <span><strong>Method:</strong> {state.selectedLog.method || '-'}</span>
                    <span><strong>Path:</strong> {state.selectedLog.path || '-'}</span>
                    <span><strong>Status Code:</strong> {state.selectedLog.statusCode || '-'}</span>
                    <span><strong>IP:</strong> {state.selectedLog.ipAddress || '-'}</span>
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 18,
                      padding: 16
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18 }}>Changed Fields</h3>

                    <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                      {Array.isArray(state.selectedLog.changes?.changedFields) &&
                      state.selectedLog.changes.changedFields.length > 0 ? (
                        state.selectedLog.changes.changedFields.map((field) => (
                          <div
                            key={field}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 14,
                              padding: 12
                            }}
                          >
                            <div style={{ fontWeight: 900, color: '#0f172a' }}>
                              {field}
                            </div>

                            <div
                              style={{
                                marginTop: 8,
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 8,
                                fontSize: 12
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 900, color: '#991b1b' }}>Before</div>
                                <pre style={miniPre}>
                                  {JSON.stringify(
                                    state.selectedLog.changes?.fields?.[field]?.before ?? null,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>

                              <div>
                                <div style={{ fontWeight: 900, color: '#166534' }}>After</div>
                                <pre style={miniPre}>
                                  {JSON.stringify(
                                    state.selectedLog.changes?.fields?.[field]?.after ?? null,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#64748b' }}>
                          No changed fields recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    style={{
                      marginTop: 18,
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 0,
                      padding: '10px 16px',
                      borderRadius: 12,
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON'}
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
                      {JSON.stringify(state.selectedLog, null, 2)}
                    </pre>
                  )}
                </div>
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

const panelStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const panelStyleWithMargin = {
  ...panelStyle,
  marginTop: 24
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

const successBox = {
  marginTop: 24,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  color: '#166534',
  borderRadius: 20,
  padding: 24
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

const blueButton = {
  border: 0,
  background: '#2563eb',
  color: '#ffffff',
  padding: '11px 16px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '11px 16px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const smallDarkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '8px 12px',
  borderRadius: 10,
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 12
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

const miniPre = {
  margin: '6px 0 0',
  background: '#020617',
  color: '#e2e8f0',
  padding: 10,
  borderRadius: 10,
  overflow: 'auto',
  maxHeight: 160,
  fontSize: 11
};