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

async function fetchSubscriptionStatus() {
  const tenantId = getTenantId();

  const response = await fetch(`${API_BASE}/api/tenant/subscription/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'Subscription status request failed.');
  }

  return payload;
}

export default function TenantSubscriptionStatusPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchSubscriptionStatus());
    } catch (err) {
      setError(err.message || 'Subscription status load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subscription = payload?.subscription || {};
  const access = payload?.access || subscription.access || {};
  const limits = payload?.limits || subscription.limits || {};
  const modules = payload?.modules || subscription.modules || {};
  const entitlements = payload?.entitlements || subscription.entitlements || {};

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>SAAS COMMERCIAL READINESS</div>
        <h1 style={title}>Tenant Subscription Status</h1>
        <p style={subtitle}>
          Commercial control panel for plan, access state, SaaS limits, module entitlements and upgrade readiness.
        </p>

        <button type="button" onClick={load} style={button}>
          {loading ? 'Loading...' : 'Refresh Subscription'}
        </button>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={statusCard(access?.allowed || access?.isAllowed)}>
        <div>
          <div style={statusLabel}>Access State</div>
          <div style={statusValue}>{access?.accessState || access?.state || 'UNKNOWN'}</div>
          <div style={statusReason}>{access?.reason || 'No access reason available.'}</div>
        </div>

        <div style={tenantBox}>
          <div><strong>Tenant:</strong> {payload?.tenantId || getTenantId()}</div>
          <div><strong>Plan:</strong> {subscription.plan || '-'}</div>
          <div><strong>Status:</strong> {subscription.status || '-'}</div>
          <div><strong>Upgrade Required:</strong> {subscription.upgradeRequired || subscription.upgrade_required ? 'YES' : 'NO'}</div>
        </div>
      </section>

      <section style={metricsGrid}>
        <Metric label="Patient Limit" value={limits.patientLimit ?? subscription.patientLimit ?? '-'} />
        <Metric label="Current Patients" value={limits.currentPatients ?? subscription.currentPatients ?? 0} />
        <Metric label="Patient Usage" value={`${limits.patientUsagePercent ?? 0}%`} tone={limits.patientLimitReached ? 'danger' : 'success'} />
        <Metric label="Seat Limit" value={limits.seatLimit ?? subscription.seatLimit ?? '-'} />
        <Metric label="Current Seats" value={limits.currentSeats ?? subscription.currentSeats ?? 0} />
        <Metric label="Seat Usage" value={`${limits.seatUsagePercent ?? 0}%`} tone={limits.seatLimitReached ? 'danger' : 'success'} />
      </section>

      <section style={twoGrid}>
        <ModulePanel title="Enabled Modules" data={modules} />
        <ModulePanel title="Entitlements" data={entitlements} />
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Billing & Periods</h2>

        <div style={detailGrid}>
          <Info label="Billing Email" value={subscription.billingEmail || subscription.billing_email || '-'} />
          <Info label="Stripe Customer" value={subscription.stripeCustomerId || subscription.stripe_customer_id || '-'} />
          <Info label="Stripe Subscription" value={subscription.stripeSubscriptionId || subscription.stripe_subscription_id || '-'} />
          <Info label="Trial Ends" value={formatDate(subscription.trialEndsAt || subscription.trial_ends_at)} />
          <Info label="Period Ends" value={formatDate(subscription.currentPeriodEndsAt || subscription.current_period_ends_at)} />
          <Info label="Updated" value={formatDate(subscription.updatedAt || subscription.updated_at)} />
        </div>
      </section>

      <section style={panel}>
        <h2 style={sectionTitle}>Limit Warnings</h2>

        {(limits.warnings || []).length === 0 ? (
          <div style={empty}>No active SaaS limit warnings.</div>
        ) : (
          <div style={chips}>
            {limits.warnings.map((warning) => (
              <span key={warning} style={dangerChip}>
                {warning}
              </span>
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

function ModulePanel({ title, data }) {
  const rows = Object.entries(data || {});

  return (
    <section style={panel}>
      <h2 style={sectionTitle}>{title}</h2>

      {rows.length === 0 ? (
        <div style={empty}>No module data available.</div>
      ) : (
        <div style={chips}>
          {rows.map(([key, value]) => (
            <span key={key} style={value ? successChip : dangerChip}>
              {key}: {value ? 'ON' : 'OFF'}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoCard}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{String(value || '-')}</div>
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
  background: 'linear-gradient(135deg, #020617 0%, #1d4ed8 52%, #0f766e 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 30,
  boxShadow: '0 18px 50px rgba(15,23,42,0.16)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  color: '#bfdbfe'
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

function statusCard(allowed) {
  return {
    background: allowed ? '#f0fdf4' : '#fff1f2',
    border: `1px solid ${allowed ? '#bbf7d0' : '#fecdd3'}`,
    borderRadius: 24,
    padding: 22,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
  };
}

const statusLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const statusValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 38,
  fontWeight: 1000
};

const statusReason = {
  marginTop: 6,
  color: '#334155',
  fontWeight: 850
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

const detailGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const infoCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12
};

const infoLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const infoValue = {
  marginTop: 7,
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 850,
  wordBreak: 'break-word'
};

const chips = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
};

const successChip = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900
};

const dangerChip = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 900
};

const empty = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 14,
  padding: 14,
  fontWeight: 800
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16,
  fontWeight: 850
};