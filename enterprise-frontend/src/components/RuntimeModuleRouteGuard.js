import React from 'react';
import { Link } from 'react-router-dom';
import { useTenantRuntime } from '../context/TenantRuntimeContext';

function isFeatureAllowed(runtime, feature) {
  const modules = runtime?.modules || {};
  const entitlements = runtime?.entitlements || {};
  const access = runtime?.access || {};

  if (access.allowed === false) return false;

  const rules = {
    atlas: modules.atlas !== false && entitlements.canUseAtlas !== false,
    actionCenter:
      modules.actionCenter !== false &&
      entitlements.canUseActionCenter !== false,
    closedLoop:
      modules.closedLoop !== false &&
      entitlements.canUseClosedLoop !== false,
    executiveMetrics:
      modules.executiveMetrics !== false &&
      entitlements.canUseExecutiveMetrics !== false,
    rolloutRoadmap:
      modules.rolloutRoadmap !== false &&
      entitlements.canUseRolloutRoadmap !== false
  };

  return rules[feature] !== false;
}

export default function RuntimeModuleRouteGuard({
  feature,
  title = 'Module unavailable',
  children
}) {
  const runtime = useTenantRuntime();

  const allowed = isFeatureAllowed(runtime, feature);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <main style={page}>
      <section style={card}>
        <div style={kicker}>TENANT MODULE ENFORCEMENT</div>

        <h1 style={heading}>{title}</h1>

        <p style={text}>
          This module is not enabled for the current tenant or the tenant does not have the required entitlement.
        </p>

        <div style={metaGrid}>
          <div style={metaCard}>
            <strong>Tenant</strong>
            <span>{runtime.tenantId}</span>
          </div>

          <div style={metaCard}>
            <strong>Feature</strong>
            <span>{feature}</span>
          </div>

          <div style={metaCard}>
            <strong>Plan</strong>
            <span>{runtime.plan?.code || 'unknown'}</span>
          </div>

          <div style={metaCard}>
            <strong>Access</strong>
            <span>{runtime.access?.state || 'unknown'}</span>
          </div>
        </div>

        <Link to="/sales/raftopoulos/executive-demo-home" style={button}>
          Return to Executive Demo Home
        </Link>
      </section>
    </main>
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

const heading = {
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
  maxWidth: 900
};

const metaGrid = {
  marginTop: 18,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12
};

const metaCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  display: 'grid',
  gap: 6,
  color: '#0f172a'
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