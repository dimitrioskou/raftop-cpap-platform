import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#f8fafc',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 760,
    borderRadius: 24,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)',
    padding: 28
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: 8
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: '#0f172a',
    lineHeight: 1.05,
    marginBottom: 10
  },
  text: {
    fontSize: 14,
    lineHeight: 1.7,
    color: '#475569'
  },
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1'
  }
};

const FALLBACK_ROUTES = [
  '/tenant/dashboard',
  '/tenant/patients',
  '/tenant/compliance',
  '/tenant/followup'
];

export default function ProtectedTenantRoute() {
  const location = useLocation();
  const tenantApi = useTenant();

  const currentTenant = tenantApi?.currentTenant || null;
  const canAccessRoute =
    typeof tenantApi?.canAccessRoute === 'function'
      ? tenantApi.canAccessRoute
      : () => true;

  if (!currentTenant) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>Tenant Access</div>
          <div style={styles.title}>No active tenant found</div>
          <div style={styles.text}>
            Tenant context is not ready yet, so the enterprise workspace cannot load.
          </div>
        </div>
      </div>
    );
  }

  if (currentTenant.isActive === false) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>Tenant Access</div>
          <div style={styles.title}>This tenant is inactive</div>
          <div style={styles.text}>
            The selected workspace is currently inactive or suspended, so access is restricted.
          </div>

          <div style={styles.pillRow}>
            <span style={styles.pill}>Tenant: {currentTenant.name}</span>
            <span style={styles.pill}>Status: {String(currentTenant.status || 'inactive')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessRoute(location.pathname)) {
    const fallback = FALLBACK_ROUTES.find((route) => canAccessRoute(route));

    if (fallback && fallback !== location.pathname) {
      return <Navigate to={fallback} replace state={{ from: location.pathname }} />;
    }

    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>Tenant Access</div>
          <div style={styles.title}>Route not available in current plan</div>
          <div style={styles.text}>
            The selected workspace does not have access to this route based on current entitlements.
          </div>

          <div style={styles.pillRow}>
            <span style={styles.pill}>Tenant: {currentTenant.name}</span>
            <span style={styles.pill}>Path: {location.pathname}</span>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}