import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

export default function PatientLayout({ children }) {
  const location = useLocation();

  return (
    <main style={shell}>
      <section style={topBar}>
        <div>
          <div style={kicker}>PATIENT CPAP CARE</div>
          <h1 style={title}>My Therapy Portal</h1>
          <p style={subtitle}>
            Patient-facing CPAP therapy overview powered by RAFTOP CPAP CARE Pro.
          </p>
        </div>

        <div style={tenantBadge}>
          Tenant: {getTenantId()}
        </div>
      </section>

      <nav style={nav}>
        <PatientLink
          to="/patient/dashboard"
          label="Dashboard"
          active={location.pathname === '/patient/dashboard'}
        />
        <PatientLink
          to="/patient/therapy"
          label="Therapy"
          active={location.pathname === '/patient/therapy'}
        />
        <PatientLink
  to="/patient/nightly-analysis"
  label="Nightly Analysis"
  active={location.pathname === '/patient/nightly-analysis'}
/>
<PatientLink
  to="/patient/night-compare"
  label="Night Compare"
  active={location.pathname === '/patient/night-compare'}
/>
        <PatientLink
          to="/tenant/dashboard"
          label="Provider View"
          active={false}
        />
      </nav>

      <section style={content}>
        {children}
      </section>
    </main>
  );
}

function PatientLink({ to, label, active }) {
  return (
    <Link to={to} style={active ? activeLink : navLink}>
      {label}
    </Link>
  );
}

const shell = {
  display: 'grid',
  gap: 18
};

const topBar = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 54%, #0f766e 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 30,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  boxShadow: '0 18px 50px rgba(15,23,42,0.16)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  color: '#bfdbfe'
};

const title = {
  margin: '10px 0 8px',
  fontSize: 38,
  lineHeight: 1.1
};

const subtitle = {
  margin: 0,
  maxWidth: 820,
  color: 'rgba(255,255,255,0.88)',
  fontWeight: 650,
  lineHeight: 1.55
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

const nav = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 12,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  boxShadow: '0 10px 24px rgba(15,23,42,0.04)'
};

const navLink = {
  display: 'inline-block',
  textDecoration: 'none',
  background: '#334155',
  color: '#ffffff',
  borderRadius: 12,
  padding: '10px 13px',
  fontSize: 13,
  fontWeight: 950
};

const activeLink = {
  ...navLink,
  background: '#0f766e'
};

const content = {
  display: 'grid',
  gap: 18
};