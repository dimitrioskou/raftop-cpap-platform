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

async function fetchAclAudit() {
  const tenantId = getTenantId();

  const response = await fetch(`${API_BASE}/api/tenant/security/acl-audit`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'ACL audit request failed.');
  }

  return payload;
}

export default function TenantAclAuditPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchAclAudit();
      setPayload(result);
    } catch (err) {
      setError(err.message || 'ACL audit load failed.');
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

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>SECURITY OBSERVABILITY</div>
        <h1 style={title}>ACL Audit Dashboard</h1>
        <p style={subtitle}>
          Runtime access-control visibility for denied API access, roles, permissions and protected routes.
        </p>

        <button type="button" onClick={load} style={button}>
          {loading ? 'Loading...' : 'Refresh Audit'}
        </button>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric label="Total Events" value={summary.total_events || 0} />
        <Metric label="Denied Events" value={summary.denied_events || 0} tone="danger" />
        <Metric label="Allowed Events" value={summary.allowed_events || 0} tone="success" />
        <Metric label="Roles Seen" value={summary.roles_seen || 0} />
        <Metric label="Paths Seen" value={summary.paths_seen || 0} />
      </section>

      <section style={threeGrid}>
        <Breakdown title="Denied by Role" rows={payload?.deniedByRole || []} labelKey="role" />
        <Breakdown title="Denied by Path" rows={payload?.deniedByPath || []} labelKey="path" />
        <Breakdown title="Denied by Permission" rows={payload?.deniedByPermission || []} labelKey="permission" />
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Last ACL Events</h2>

        {events.length === 0 ? (
          <div style={empty}>No ACL events found.</div>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Time</Th>
                  <Th>Role</Th>
                  <Th>Path</Th>
                  <Th>Permission</Th>
                  <Th>Allowed</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <Td>{event.id}</Td>
                    <Td>{formatDate(event.created_at)}</Td>
                    <Td>{event.role}</Td>
                    <Td>{event.path}</Td>
                    <Td>{event.permission || '-'}</Td>
                    <Td>
                      <span style={event.allowed ? okBadge : denyBadge}>
                        {event.allowed ? 'ALLOW' : 'DENY'}
                      </span>
                    </Td>
                    <Td>{event.reason || '-'}</Td>
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

function Breakdown({ title, rows, labelKey }) {
  return (
    <section style={panel}>
      <h2 style={sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <div style={empty}>No denied events.</div>
      ) : (
        <div style={breakdownList}>
          {rows.map((row) => (
            <div key={row[labelKey] || 'unknown'} style={breakdownRow}>
              <span style={breakdownLabel}>{row[labelKey] || 'unknown'}</span>
              <span style={breakdownCount}>{row.denied_count}</span>
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
  background: 'linear-gradient(135deg, #020617 0%, #7c3aed 55%, #be123c 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 30,
  boxShadow: '0 18px 50px rgba(15,23,42,0.16)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  color: '#ddd6fe'
};

const title = {
  margin: '10px 0',
  fontSize: 38,
  lineHeight: 1.1
};

const subtitle = {
  margin: 0,
  maxWidth: 920,
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

const metricDanger = {
  ...metricCard,
  background: '#fff1f2',
  border: '1px solid #fecdd3'
};

const metricSuccess = {
  ...metricCard,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0'
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

const threeGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 12
};

const breakdownLabel = {
  color: '#334155',
  fontWeight: 850,
  wordBreak: 'break-word'
};

const breakdownCount = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '5px 9px',
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
  fontWeight: 700
};

const okBadge = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 1000
};

const denyBadge = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 1000
};