import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useTenantRuntime } from '../context/TenantRuntimeContext';
import {
  canAccessRoute,
  getCurrentRuntimeRole
} from './runtimeAcl';

export default function RuntimeAclRouteGuard({ children }) {
  const runtime = useTenantRuntime();
  const location = useLocation();
  const role = getCurrentRuntimeRole();

  const access = canAccessRoute({
    runtime,
    role,
    pathname: location.pathname
  });

  if (access.allowed) {
    return <>{children}</>;
  }

  return (
    <main style={page}>
      <section style={card}>
        <div style={kicker}>ROUTE ACCESS DENIED</div>

        <h1 style={title}>This page is not available for your current role</h1>

        <p style={text}>
          The route is registered, but runtime ACL policy blocked access based on role,
          tenant status, module entitlement, or feature availability.
        </p>

        <div style={grid}>
          <Info label="Tenant" value={runtime.tenantId} />
          <Info label="Role" value={role} />
          <Info label="Path" value={location.pathname} />
          <Info label="Reason" value={access.reason || 'Access denied'} />
        </div>

        <Link to="/sales/raftopoulos/executive-demo-home" style={button}>
          Return to Executive Demo Home
        </Link>
      </section>
    </main>
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

const page = {
  display: 'grid',
  gap: 18
};

const card = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 28,
  padding: 30,
  boxShadow: '0 18px 50px rgba(15,23,42,0.08)'
};

const kicker = {
  color: '#b91c1c',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.14em',
  textTransform: 'uppercase'
};

const title = {
  margin: '10px 0',
  color: '#0f172a',
  fontSize: 34,
  lineHeight: 1.1
};

const text = {
  margin: 0,
  color: '#334155',
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 700,
  maxWidth: 940
};

const grid = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12
};

const infoCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14
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

const button = {
  marginTop: 18,
  display: 'inline-block',
  background: '#0f172a',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: 14,
  padding: '12px 16px',
  fontWeight: 1000
};