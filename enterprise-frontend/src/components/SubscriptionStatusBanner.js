import React, { useEffect, useState } from 'react';

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

function getStatusStyle(subscription) {
  const access = subscription?.access || {};
  const status = String(subscription?.status || 'UNKNOWN').toUpperCase();

  if (access.isAllowed === false) {
    return {
      background: '#7f1d1d',
      color: '#ffffff',
      border: '1px solid #991b1b'
    };
  }

  if (status === 'PAST_DUE') {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  return {
    background: '#064e3b',
    color: '#ffffff',
    border: '1px solid #047857'
  };
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return String(value);
  }
}

export default function SubscriptionStatusBanner() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    payload: null
  });

  async function loadSubscription() {
    try {
      const tenantId = getTenantId();

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
    loadSubscription();
  }, []);

  if (state.loading) {
    return null;
  }

  if (state.error) {
    return (
      <div
        style={{
          background: '#7f1d1d',
          color: '#ffffff',
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 800
        }}
      >
        Subscription status unavailable: {state.error}
      </div>
    );
  }

  const subscription = state.payload?.subscription || {};
  const access = subscription.access || {};
  const style = getStatusStyle(subscription);

  return (
    <div
      style={{
        ...style,
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: 13
      }}
    >
      <div style={{ fontWeight: 900 }}>
        Tenant: {state.payload?.tenantId || 'demo-tenant'} · Plan: {subscription.plan || '-'} · Status:{' '}
        {subscription.status || '-'} · Access: {access.accessState || '-'}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>
          Period ends: {formatDate(subscription.currentPeriodEndsAt || subscription.trialEndsAt)}
        </span>

        {access.isAllowed === false && (
          <span style={{ fontWeight: 900 }}>
            LOCKED: {access.reason || subscription.lockedReason || 'Access denied.'}
          </span>
        )}

        <a
          href="/tenant/subscription"
          style={{
            color: '#ffffff',
            fontWeight: 900,
            textDecoration: 'underline'
          }}
        >
          Manage
        </a>
      </div>
    </div>
  );
}