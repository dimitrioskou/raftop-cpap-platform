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

async function fetchFailedLoginAudit() {
  const tenantId = getTenantId();

  const url = new URL(`${API_BASE}/api/tenant/security/failed-logins`);
  url.searchParams.set('tenantId', tenantId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'Failed login audit request failed.');
  }

  return payload;
}

export default function TenantFailedLoginAuditPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchFailedLoginAudit());
    } catch (err) {
      setError(err.message || 'Failed login audit load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = payload?.summary || {};
  const risk = payload?.risk || {};
  const byEmail = payload?.byEmail || [];
  const byIp = payload?.byIp || [];
  const byReason = payload?.byReason || [];
  const recentFailedLogins = payload?.recentFailedLogins || [];

  return (
    <main style={page}>
      <section style={hero}>
        <div>
          <div style={kicker}>AUTH SECURITY & BRUTE-FORCE MONITORING</div>
          <h1 style={title}>Failed Login Audit</h1>
          <p style={subtitle}>
            Monitor failed authentication attempts by email, IP, reason and frequency. This helps detect brute-force patterns, credential stuffing and suspicious tenant access attempts.
          </p>

          <button type="button" onClick={load} style={button}>
            {loading ? 'Loading...' : 'Refresh Failed Logins'}
          </button>
        </div>

        <div style={tenantBadge}>
          Tenant: {payload?.tenantId || getTenantId()}
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={riskCard(risk.level)}>
        <div>
          <div style={riskLabel}>Failed Login Risk</div>
          <div style={riskScore}>{risk.score ?? 0}/100</div>
          <div style={riskText}>{risk.label || 'Clear'}</div>
        </div>

        <div style={riskFacts}>
          <div><strong>Total Failed:</strong> {summary.totalFailed || 0}</div>
          <div><strong>Unique Emails:</strong> {summary.uniqueEmails || 0}</div>
          <div><strong>Unique IPs:</strong> {summary.uniqueIps || 0}</div>
          <div><strong>Top Email Count:</strong> {summary.topEmailCount || 0}</div>
          <div><strong>Top IP Count:</strong> {summary.topIpCount || 0}</div>
        </div>
      </section>

      <section style={metricsGrid}>
        <Metric label="Total Failed" value={summary.totalFailed || 0} tone={summary.totalFailed > 0 ? 'danger' : 'success'} />
        <Metric label="Unique Emails" value={summary.uniqueEmails || 0} />
        <Metric label="Unique IPs" value={summary.uniqueIps || 0} />
        <Metric label="Top Email Count" value={summary.topEmailCount || 0} tone={summary.topEmailCount >= 3 ? 'danger' : 'default'} />
        <Metric label="Top IP Count" value={summary.topIpCount || 0} tone={summary.topIpCount >= 3 ? 'danger' : 'default'} />
        <Metric label="Risk Level" value={risk.level || 'clear'} tone={risk.score > 0 ? 'danger' : 'success'} />
      </section>

      <section style={twoGrid}>
        <BreakdownPanel
          title="Failed Logins by Email"
          rows={byEmail}
          labelKey="email"
          countKey="failed_count"
          emptyText="No failed login emails found."
        />

        <BreakdownPanel
          title="Failed Logins by IP"
          rows={byIp}
          labelKey="ip"
          countKey="failed_count"
          emptyText="No failed login IPs found."
        />
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Failure Reasons</h2>

        {byReason.length === 0 ? (
          <div style={empty}>No failed login reasons found.</div>
        ) : (
          <div style={reasonGrid}>
            {byReason.map((row) => (
              <div key={row.reason} style={reasonCard}>
                <div style={reasonName}>{row.reason}</div>
                <div style={reasonCount}>{row.failed_count}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Recent Failed Login Attempts</h2>

        {recentFailedLogins.length === 0 ? (
          <div style={empty}>No failed login attempts found.</div>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Time</Th>
                  <Th>Email</Th>
                  <Th>IP</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>User Agent</Th>
                </tr>
              </thead>
              <tbody>
                {recentFailedLogins.map((event) => (
                  <tr key={event.id}>
                    <Td>{event.id}</Td>
                    <Td>{formatDate(event.created_at)}</Td>
                    <Td>{event.email || '-'}</Td>
                    <Td>{event.ip || '-'}</Td>
                    <Td>
                      <span style={dangerBadge}>{event.reason}</span>
                    </Td>
                    <Td>{event.status_code || '-'}</Td>
                    <Td>{event.source || '-'}</Td>
                    <Td>{event.user_agent || '-'}</Td>
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

function BreakdownPanel({ title, rows, labelKey, countKey, emptyText }) {
  return (
    <section style={panel}>
      <h2 style={sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <div style={empty}>{emptyText}</div>
      ) : (
        <div style={breakdownList}>
          {rows.map((row) => (
            <div key={row[labelKey] || 'unknown'} style={breakdownRow}>
              <div>
                <div style={breakdownLabel}>{row[labelKey] || 'unknown'}</div>
                <div style={breakdownSub}>Last seen: {formatDate(row.last_seen)}</div>
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
  background: 'linear-gradient(135deg, #020617 0%, #7f1d1d 52%, #be123c 100%)',
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
  color: '#fecaca'
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

function riskCard(level) {
  const high = level === 'high';
  const medium = level === 'medium';
  const low = level === 'low';

  return {
    background: high ? '#fff1f2' : medium ? '#fffbeb' : low ? '#eff6ff' : '#f0fdf4',
    border: `1px solid ${high ? '#fecdd3' : medium ? '#fde68a' : low ? '#bfdbfe' : '#bbf7d0'}`,
    borderRadius: 24,
    padding: 22,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
  };
}

const riskLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const riskScore = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 44,
  fontWeight: 1000
};

const riskText = {
  color: '#334155',
  fontSize: 16,
  fontWeight: 900
};

const riskFacts = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  minWidth: 280,
  color: '#0f172a',
  display: 'grid',
  gap: 6,
  fontWeight: 750
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
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 1000
};

const reasonGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10
};

const reasonCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center'
};

const reasonName = {
  color: '#0f172a',
  fontWeight: 1000,
  wordBreak: 'break-word'
};

const reasonCount = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
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

const dangerBadge = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
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