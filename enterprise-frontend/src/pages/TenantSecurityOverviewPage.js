import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

async function fetchSecurityOverview() {
  const tenantId = getTenantId();

  const url = new URL(`${API_BASE}/api/tenant/security/overview`);
  url.searchParams.set('tenantId', tenantId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'Security overview request failed.');
  }

  return payload;
}

export default function TenantSecurityOverviewPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchSecurityOverview());
    } catch (err) {
      setError(err.message || 'Security overview load failed.');
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
  const tenant = payload?.tenant || {};
  const userActivity = payload?.userActivity || {};
  const failedLogins = payload?.failedLogins || {};
  const complianceSignals = payload?.complianceSignals || {};

  return (
    <main style={page}>
      <section style={hero}>
        <div>
          <div style={kicker}>SECURITY COMMAND CENTER</div>
          <h1 style={title}>Tenant Security Overview</h1>
          <p style={subtitle}>
            Centralized security posture for ACL activity, user activity audit, failed logins,
            protected endpoints, tenant status and operational compliance risk.
          </p>

          <div style={actions}>
            <button type="button" onClick={load} style={button}>
              {loading ? 'Loading...' : 'Refresh Security'}
            </button>

            <Link to="/tenant/security/acl-audit" style={secondaryButton}>
              Open ACL Audit
            </Link>

            <Link to="/tenant/security/user-activity" style={secondaryButton}>
              Open User Activity
            </Link>

            <Link to="/tenant/security/failed-logins" style={secondaryButton}>
              Open Failed Logins
            </Link>
          </div>
        </div>

        <div style={tenantBadge}>
          Tenant: {payload?.tenantId || getTenantId()}
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={riskCard(risk.level)}>
        <div>
          <div style={riskLabel}>Security Risk Score</div>
          <div style={riskScore}>{risk.score ?? 0}/100</div>
          <div style={riskText}>{risk.label || 'Clear'}</div>
        </div>

        <div style={tenantBox}>
          <div><strong>Tenant:</strong> {payload?.tenantId || getTenantId()}</div>
          <div><strong>Company:</strong> {tenant.company_name || tenant.companyName || '-'}</div>
          <div><strong>Plan:</strong> {tenant.plan || '-'}</div>
          <div><strong>Status:</strong> {tenant.status || '-'}</div>
          <div><strong>Failed Login Risk:</strong> {summary.failedLoginRiskScore ?? 0}/100</div>
        </div>
      </section>

      <section style={metricsGrid}>
        <Metric label="ACL Total Events" value={summary.totalEvents || 0} />
        <Metric label="ACL Denied Events" value={summary.deniedEvents || 0} tone={summary.deniedEvents > 0 ? 'danger' : 'success'} />
        <Metric label="ACL Allowed Events" value={summary.allowedEvents || 0} tone="success" />
        <Metric label="Unique Denied Paths" value={summary.uniqueDeniedPaths || 0} />
        <Metric label="Unique Denied Roles" value={summary.uniqueDeniedRoles || 0} />
        <Metric label="Open System Alerts" value={summary.openSystemAlerts || 0} tone={summary.openSystemAlerts > 0 ? 'danger' : 'success'} />
      </section>

      <section style={metricsGrid}>
        <Metric label="User Activity Events" value={summary.userActivityTotalEvents || 0} />
        <Metric label="Successful Activity" value={summary.userActivitySuccessfulEvents || 0} tone="success" />
        <Metric label="Failed Activity" value={summary.userActivityFailedEvents || 0} tone={summary.userActivityFailedEvents > 0 ? 'danger' : 'success'} />
        <Metric label="Activity Roles Seen" value={summary.userActivityRolesSeen || 0} />
        <Metric label="Activity Paths Seen" value={summary.userActivityPathsSeen || 0} />
        <Metric label="Activity Users Seen" value={summary.userActivityUsersSeen || 0} />
      </section>

      <section style={metricsGrid}>
        <Metric label="Failed Logins" value={summary.failedLoginTotal || 0} tone={summary.failedLoginTotal > 0 ? 'danger' : 'success'} />
        <Metric label="Failed Login Emails" value={summary.failedLoginUniqueEmails || 0} tone={summary.failedLoginUniqueEmails > 0 ? 'danger' : 'success'} />
        <Metric label="Failed Login IPs" value={summary.failedLoginUniqueIps || 0} tone={summary.failedLoginUniqueIps > 0 ? 'danger' : 'success'} />
        <Metric label="Failed Login Risk" value={`${summary.failedLoginRiskScore ?? 0}/100`} tone={(summary.failedLoginRiskScore || 0) > 0 ? 'danger' : 'success'} />
        <Metric label="Auth Risk Level" value={failedLogins?.risk?.level || 'clear'} tone={(failedLogins?.risk?.score || 0) > 0 ? 'danger' : 'success'} />
        <Metric label="Auth Attack Surface" value={(summary.failedLoginTotal || 0) > 0 ? 'Active' : 'Clear'} tone={(summary.failedLoginTotal || 0) > 0 ? 'danger' : 'success'} />
      </section>

      <section style={twoGrid}>
        <Insight
          title="Top Denied Role"
          main={payload?.topDeniedRole?.role || 'None'}
          sub={`${payload?.topDeniedRole?.count || 0} denied events`}
        />

        <Insight
          title="Top Denied Path"
          main={payload?.topDeniedPath?.path || 'None'}
          sub={`${payload?.topDeniedPath?.count || 0} denied events`}
        />

        <Insight
          title="Top Active Role"
          main={userActivity?.topActiveRole?.role || 'None'}
          sub={`${userActivity?.topActiveRole?.count || 0} activity events`}
        />

        <Insight
          title="Top Accessed Path"
          main={userActivity?.topAccessedPath?.path || 'None'}
          sub={`${userActivity?.topAccessedPath?.count || 0} activity events`}
        />

        <Insight
          title="Top Failed Email"
          main={failedLogins?.topFailedEmail?.email || 'None'}
          sub={`${failedLogins?.topFailedEmail?.count || 0} failed attempts`}
        />

        <Insight
          title="Top Failed IP"
          main={failedLogins?.topFailedIp?.ip || 'None'}
          sub={`${failedLogins?.topFailedIp?.count || 0} failed attempts`}
        />
      </section>

      <section style={complianceSignals.needsAttention ? attentionPanel : panel}>
        <h2 style={sectionTitle}>Compliance Signals</h2>

        <div style={signalGrid}>
          <Signal
            label="ACL Denials"
            active={Number(complianceSignals.aclDeniedEvents || 0) > 0}
            value={complianceSignals.aclDeniedEvents || 0}
          />

          <Signal
            label="Failed User Activity"
            active={Number(complianceSignals.failedUserActivity || 0) > 0}
            value={complianceSignals.failedUserActivity || 0}
          />

          <Signal
            label="Failed Logins"
            active={Number(complianceSignals.failedLogins || 0) > 0}
            value={complianceSignals.failedLogins || 0}
          />

          <Signal
            label="Failed Login Risk"
            active={Number(complianceSignals.failedLoginRiskScore || 0) > 0}
            value={`${complianceSignals.failedLoginRiskScore || 0}/100`}
          />

          <Signal
            label="Open System Alerts"
            active={Number(complianceSignals.openSystemAlerts || 0) > 0}
            value={complianceSignals.openSystemAlerts || 0}
          />

          <Signal
            label="Recent ACL Denials"
            active={Boolean(complianceSignals.hasRecentAclDenials)}
            value={complianceSignals.hasRecentAclDenials ? 'YES' : 'NO'}
          />

          <Signal
            label="Recent Failed Activity"
            active={Boolean(complianceSignals.hasRecentFailedActivity)}
            value={complianceSignals.hasRecentFailedActivity ? 'YES' : 'NO'}
          />

          <Signal
            label="Recent Failed Logins"
            active={Boolean(complianceSignals.hasRecentFailedLogins)}
            value={complianceSignals.hasRecentFailedLogins ? 'YES' : 'NO'}
          />

          <Signal
            label="Needs Attention"
            active={Boolean(complianceSignals.needsAttention)}
            value={complianceSignals.needsAttention ? 'YES' : 'NO'}
          />
        </div>
      </section>

      <section style={twoGrid}>
        <section style={panel}>
          <h2 style={sectionTitle}>Recent ACL Denied Events</h2>

          {(payload?.recentDeniedEvents || []).length === 0 ? (
            <div style={empty}>No denied ACL events.</div>
          ) : (
            <div style={eventList}>
              {payload.recentDeniedEvents.map((event) => (
                <EventCard
                  key={`acl-${event.id}`}
                  badge="ACL DENY"
                  role={event.role}
                  path={event.path}
                  reason={event.reason || event.permission || 'Access denied'}
                  createdAt={event.created_at}
                />
              ))}
            </div>
          )}
        </section>

        <section style={panel}>
          <h2 style={sectionTitle}>Recent Failed User Activity</h2>

          {(userActivity?.recentFailedEvents || []).length === 0 ? (
            <div style={empty}>No failed user activity events.</div>
          ) : (
            <div style={eventList}>
              {userActivity.recentFailedEvents.map((event) => (
                <EventCard
                  key={`activity-${event.id}`}
                  badge={`${event.status_code || 'FAIL'}`}
                  role={event.role || 'unknown'}
                  path={event.path}
                  reason={event.action || 'Failed activity'}
                  createdAt={event.created_at}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Recent Failed Login Attempts</h2>

        {(failedLogins?.recentFailedLogins || []).length === 0 ? (
          <div style={empty}>No failed login attempts.</div>
        ) : (
          <div style={eventList}>
            {failedLogins.recentFailedLogins.map((event) => (
              <EventCard
                key={`failed-login-${event.id}`}
                badge={`${event.status_code || 'AUTH FAIL'}`}
                role={event.email || 'unknown email'}
                path={event.ip || 'unknown ip'}
                reason={event.reason || 'Failed login'}
                createdAt={event.created_at}
              />
            ))}
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

function Insight({ title, main, sub }) {
  return (
    <section style={panel}>
      <div style={insightTitle}>{title}</div>
      <div style={insightMain}>{main}</div>
      <div style={insightSub}>{sub}</div>
    </section>
  );
}

function Signal({ label, active, value }) {
  return (
    <div style={active ? signalActive : signalClear}>
      <div style={signalLabel}>{label}</div>
      <div style={signalValue}>{value}</div>
    </div>
  );
}

function EventCard({ badge, role, path, reason, createdAt }) {
  return (
    <div style={eventCard}>
      <div style={eventTop}>
        <span style={denyBadge}>{badge}</span>
        <strong>{role || 'unknown'}</strong>
        <span style={muted}>{formatDate(createdAt)}</span>
      </div>

      <div style={eventPath}>{path}</div>
      <div style={eventReason}>{reason}</div>
    </div>
  );
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
  background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 45%, #7f1d1d 100%)',
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
  maxWidth: 920,
  color: 'rgba(255,255,255,0.88)',
  fontWeight: 650,
  lineHeight: 1.55
};

const actions = {
  marginTop: 18,
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const button = {
  border: '1px solid rgba(255,255,255,0.30)',
  background: 'rgba(255,255,255,0.16)',
  color: '#ffffff',
  borderRadius: 14,
  padding: '11px 16px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const secondaryButton = {
  ...button,
  textDecoration: 'none',
  display: 'inline-block'
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

const tenantBox = {
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 14
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
};

const attentionPanel = {
  ...panel,
  background: '#fff1f2',
  border: '1px solid #fecdd3'
};

const sectionTitle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: 20
};

const insightTitle = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const insightMain = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 1000,
  wordBreak: 'break-word'
};

const insightSub = {
  marginTop: 6,
  color: '#64748b',
  fontWeight: 800
};

const signalGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 12
};

const signalClear = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 16,
  padding: 14
};

const signalActive = {
  background: '#fee2e2',
  border: '1px solid #fecaca',
  borderRadius: 16,
  padding: 14
};

const signalLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const signalValue = {
  marginTop: 7,
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 1000
};

const empty = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 14,
  padding: 14,
  fontWeight: 800
};

const eventList = {
  display: 'grid',
  gap: 10
};

const eventCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14
};

const eventTop = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  color: '#0f172a'
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

const muted = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800
};

const eventPath = {
  marginTop: 8,
  color: '#0f172a',
  fontWeight: 1000,
  wordBreak: 'break-word'
};

const eventReason = {
  marginTop: 6,
  color: '#475569',
  fontWeight: 750,
  lineHeight: 1.45
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16,
  fontWeight: 850
};