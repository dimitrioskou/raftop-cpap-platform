import React, { useCallback, useEffect, useState } from 'react';

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

async function fetchUserActivityAudit() {
  const tenantId = getTenantId();

  const url = new URL(`${API_BASE}/api/tenant/security/user-activity`);
  url.searchParams.set('tenantId', tenantId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'User activity audit request failed.');
  }

  return payload;
}

export default function TenantUserActivityAuditPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchUserActivityAudit());
    } catch (err) {
      setError(err.message || 'User activity audit load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = payload?.summary || {};
  const events = payload?.events || [];
  const byRole = payload?.byRole || [];
  const byPath = payload?.byPath || [];
  const failedEvents = payload?.failedEvents || [];

  return (
    <main style={page}>
      <section style={hero}>
        <div>
          <div style={kicker}>ADVANCED SECURITY & COMPLIANCE</div>
          <h1 style={title}>User Activity Audit</h1>
          <p style={subtitle}>
            Tenant-level audit trail for user activity, patient access, protected endpoints, failed actions and operational traceability.
          </p>

          <button type="button" onClick={load} style={button}>
            {loading ? 'Loading...' : 'Refresh Activity'}
          </button>
        </div>

        <div style={tenantBadge}>
          Tenant: {payload?.tenantId || getTenantId()}
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric label="Total Events" value={summary.total_events || 0} />
        <Metric label="Successful Events" value={summary.successful_events || 0} tone="success" />
        <Metric label="Failed Events" value={summary.failed_events || 0} tone={summary.failed_events > 0 ? 'danger' : 'success'} />
        <Metric label="Roles Seen" value={summary.roles_seen || 0} />
        <Metric label="Paths Seen" value={summary.paths_seen || 0} />
        <Metric label="Users Seen" value={summary.users_seen || 0} />
      </section>

      <section style={twoGrid}>
        <BreakdownPanel
          title="Activity by Role"
          rows={byRole}
          labelKey="role"
          countKey="event_count"
        />

        <BreakdownPanel
          title="Activity by Path"
          rows={byPath}
          labelKey="path"
          countKey="event_count"
        />
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Failed Activity</h2>

        {failedEvents.length === 0 ? (
          <div style={empty}>No failed user activity events.</div>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Time</Th>
                  <Th>Role</Th>
                  <Th>Method</Th>
                  <Th>Path</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {failedEvents.map((event) => (
                  <tr key={event.id}>
                    <Td>{event.id}</Td>
                    <Td>{formatDate(event.created_at)}</Td>
                    <Td>{event.role || 'unknown'}</Td>
                    <Td>{event.method}</Td>
                    <Td>{event.path}</Td>
                    <Td>
                      <span style={dangerBadge}>{event.status_code}</span>
                    </Td>
                    <Td>{event.action}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Last User Activity Events</h2>

        {events.length === 0 ? (
          <div style={empty}>No user activity events found.</div>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Time</Th>
                  <Th>Role</Th>
                  <Th>User</Th>
                  <Th>Method</Th>
                  <Th>Path</Th>
                  <Th>Status</Th>
                  <Th>Success</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <Td>{event.id}</Td>
                    <Td>{formatDate(event.created_at)}</Td>
                    <Td>{event.role || 'unknown'}</Td>
                    <Td>{event.user_email || event.user_id || '-'}</Td>
                    <Td>{event.method}</Td>
                    <Td>{event.path}</Td>
                    <Td>{event.status_code || '-'}</Td>
                    <Td>
                      <span style={event.success ? successBadge : dangerBadge}>
                        {event.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </Td>
                    <Td>{event.action}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, tone = 'default' }) {
  const style =
    tone === 'danger'
      ? metricDanger
      : tone === 'success'
        ? metricSuccess
        : metricCard;

  return (
    <div style={style}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function BreakdownPanel({ title, rows, labelKey, countKey }) {
  return (
    <section style={panel}>
      <h2 style={sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <div style={empty}>No activity breakdown available.</div>
      ) : (
        <div style={breakdownList}>
          {rows.map((row) => (
            <div key={row[labelKey] || 'unknown'} style={breakdownRow}>
              <div>
                <div style={breakdownLabel}>{row[labelKey] || 'unknown'}</div>
                <div style={breakdownSub}>
                  Failed: {row.failed_count || 0}
                </div>
              </div>

              <span style={countBadge}>{row[countKey] || 0}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Th({ children }) {
  return <th style={th}>{children}</th>;
}

function Td({ children }) {
  return <td style={td}>{children}</td>;
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return String(value);
  }
}

const page = {
  display: 'grid',
  gap: 18
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #581c87 48%, #be123c 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 30,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
  boxShadow: '0 18px 50px rgba(15,23,42,0.16)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  color: '#fbcfe8'
};

const title = {
  margin: '10px 0',
  fontSize: 38,
  lineHeight: 1.1
};

const subtitle = {
  margin: 0,
  maxWidth: 900,
  color: 'rgba(255,255,255,0.88)',
  fontWeight: 650,
  lineHeight: 1.55
};

const button = {
  marginTop: 18,
  border: '1px solid rgba(255,255,255,0.30)',
  background: 'rgba(255,255,255,0.16)',
  color: '#ffffff',
  borderRadius: 14,
  padding: '11px 16px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const tenantBadge = {
  alignSelf: 'flex-start',
  background: 'rgba(255,255,255,0.14)',
  border: '1px solid rgba(255,255,255,0.28)',
  borderRadius: 999,
  padding: '9px 13px',
  fontSize: 12,
  fontWeight: 1000
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16,
  fontWeight: 850
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 14
};

const metricCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
};

const metricSuccess = {
  ...metricCard,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0'
};

const metricDanger = {
  ...metricCard,
  background: '#fff1f2',
  border: '1px solid #fecdd3'
};

const metricLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metricValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 1000
};

const twoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 14
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
};

const sectionTitle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: 20
};

const empty = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 14,
  padding: 14,
  fontWeight: 800
};

const breakdownList = {
  display: 'grid',
  gap: 8
};

const breakdownRow = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center'
};

const breakdownLabel = {
  color: '#0f172a',
  fontWeight: 1000,
  wordBreak: 'break-word'
};

const breakdownSub = {
  marginTop: 5,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800
};

const countBadge = {
  background: '#e0e7ff',
  color: '#3730a3',
  border: '1px solid #c7d2fe',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 1000
};

const tableWrap = {
  overflowX: 'auto'
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13
};

const th = {
  textAlign: 'left',
  color: '#64748b',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '10px 8px',
  borderBottom: '1px solid #e2e8f0'
};

const td = {
  color: '#0f172a',
  padding: '10px 8px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'top',
  fontWeight: 700,
  wordBreak: 'break-word'
};

const successBadge = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 1000
};

const dangerBadge = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 1000
};