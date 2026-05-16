import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function isLockedSubscription(subscription) {
  const status = String(subscription?.status || '').toUpperCase();
  const access = subscription?.access || {};

  if (access.isAllowed === false) return true;

  return ['EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(status);
}

function getLockReason(subscription) {
  const access = subscription?.access || {};

  return (
    access.reason ||
    subscription?.lockedReason ||
    'This tenant subscription does not currently allow access.'
  );
}

export default function SubscriptionSoftGuard({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: '',
    payload: null
  });

  async function loadSubscriptionStatus() {
    try {
      const tenantId = getTenantId();

      setState({
        loading: true,
        error: '',
        payload: null
      });

      const response = await fetch(`${API_BASE}/api/tenant/subscription/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'x-tenant-id': tenantId
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
      }

      setState({
        loading: false,
        error: '',
        payload: json
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'Failed to load subscription status.',
        payload: null
      });
    }
  }

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  if (state.loading) {
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
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.2em',
              color: '#2563eb',
              textTransform: 'uppercase'
            }}
          >
            RAFTOP CPAP CARE Pro / SaaS Guard
          </div>

          <h1 style={{ marginTop: 12, fontSize: 30 }}>
            Checking subscription access...
          </h1>

          <p style={{ color: '#64748b' }}>
            Verifying tenant subscription before opening this protected page.
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
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
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.2em',
              color: '#b45309',
              textTransform: 'uppercase'
            }}
          >
            Subscription Status Warning
          </div>

          <h1 style={{ marginTop: 12, fontSize: 30, color: '#92400e' }}>
            Could not verify subscription
          </h1>

          <p style={{ color: '#475569' }}>
            The system could not confirm the tenant subscription. Because this is still a soft guard phase, access is not hard-blocked yet.
          </p>

          <pre
            style={{
              marginTop: 18,
              background: '#111827',
              color: '#f9fafb',
              padding: 16,
              borderRadius: 14,
              overflow: 'auto'
            }}
          >
            {state.error}
          </pre>

          <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={loadSubscriptionStatus}
              style={darkButton}
            >
              Retry Check
            </button>

            <Link to="/tenant/subscription" style={redLink}>
              Manage Subscription
            </Link>
          </div>

          <div
            style={{
              marginTop: 24,
              borderTop: '1px solid #e2e8f0',
              paddingTop: 24
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  const subscription = state.payload?.subscription || {};
  const access = subscription.access || {};
  const locked = isLockedSubscription(subscription);

  if (!locked) {
    return children;
  }

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
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #fecaca',
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.14)'
        }}
      >
        <section
          style={{
            background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #ef4444 100%)',
            color: '#ffffff',
            padding: 32
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.2em',
              opacity: 0.9,
              textTransform: 'uppercase'
            }}
          >
            RAFTOP CPAP CARE Pro / Subscription Lock
          </div>

          <h1 style={{ margin: '14px 0 8px', fontSize: 38, lineHeight: 1.1 }}>
            Tenant Access Locked
          </h1>

          <p style={{ maxWidth: 820, fontSize: 15, opacity: 0.92 }}>
            This tenant cannot access protected RAFTOP / ATLAS pages until the subscription is active again.
          </p>
        </section>

        <section style={{ padding: 32 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <InfoCard label="Tenant ID" value={state.payload?.tenantId || 'demo-tenant'} />
            <InfoCard label="Plan" value={subscription.plan || '-'} />
            <InfoCard label="Status" value={subscription.status || '-'} danger />
            <InfoCard label="Access State" value={access.accessState || '-'} danger />
            <InfoCard label="Trial Ends" value={formatDate(subscription.trialEndsAt)} />
            <InfoCard label="Period Ends" value={formatDate(subscription.currentPeriodEndsAt)} />
          </div>

          <div
            style={{
              marginTop: 24,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 20,
              padding: 20
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Lock Reason
            </div>

            <div style={{ marginTop: 8, fontSize: 17, fontWeight: 900 }}>
              {getLockReason(subscription)}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <Link to="/tenant/subscription" style={redLink}>
              Manage Subscription
            </Link>

            <button
              type="button"
              onClick={loadSubscriptionStatus}
              style={darkButton}
            >
              Recheck Access
            </button>

            <Link to="/system/monitoring" style={blueLink}>
              Open System Monitoring
            </Link>
          </div>

          <div
            style={{
              marginTop: 28,
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              borderRadius: 20,
              padding: 20,
              fontSize: 14
            }}
          >
            This is a frontend soft guard. Backend hard enforcement will be added in the next phase after we confirm the UI lock behavior is correct.
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value, danger }) {
  return (
    <div
      style={{
        background: danger ? '#fff1f2' : '#ffffff',
        border: danger ? '1px solid #fecdd3' : '1px solid #e2e8f0',
        borderRadius: 18,
        padding: 18
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
          marginTop: 8,
          fontSize: 18,
          fontWeight: 900,
          color: danger ? '#991b1b' : '#0f172a',
          wordBreak: 'break-word'
        }}
      >
        {value ?? '-'}
      </div>
    </div>
  );
}

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900,
  cursor: 'pointer'
};

const redLink = {
  display: 'inline-block',
  background: '#b91c1c',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900
};

const blueLink = {
  display: 'inline-block',
  background: '#2563eb',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 18px',
  borderRadius: 14,
  fontWeight: 900
};