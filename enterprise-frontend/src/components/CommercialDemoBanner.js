import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

function isCommercialDemoMode() {
  return (
    getTenantId() === 'raftopoulos-live' ||
    localStorage.getItem('commercial_demo_mode') === 'true'
  );
}

function isTechnicalUnlocked() {
  return localStorage.getItem('show_technical_demo_routes') === 'true';
}

function isVisibleUnlockAllowed() {
  return localStorage.getItem('allow_visible_technical_unlock') === 'true';
}

export default function CommercialDemoBanner() {
  const demo = isCommercialDemoMode();
  const technicalUnlocked = isTechnicalUnlocked();
  const visibleUnlockAllowed = isVisibleUnlockAllowed();

  useEffect(() => {
    const locked = demo && !technicalUnlocked;

    if (locked) {
      document.body.classList.add('raftop-client-demo-locked');
    } else {
      document.body.classList.remove('raftop-client-demo-locked');
    }

    const existing = document.getElementById('raftop-client-demo-lock-style');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'raftop-client-demo-lock-style';
    style.innerHTML = `
      body.raftop-client-demo-locked #root > div > section:first-child {
        display: none !important;
      }

      body.raftop-client-demo-locked input[type="password"] {
        display: none !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.body.classList.remove('raftop-client-demo-locked');
    };
  }, [demo, technicalUnlocked]);

  if (!demo) {
    return (
      <section style={inactiveBox}>
        <div>
          <strong>Client Demo Mode: OFF</strong>
          <div style={inactiveText}>
            Ενεργοποίησέ το μόνο για παρουσίαση σε πελάτη.
          </div>
        </div>

        <button
          type="button"
          style={button}
          onClick={() => {
            localStorage.setItem('commercial_demo_mode', 'true');
            localStorage.setItem('tenant_id', 'raftopoulos-live');
            localStorage.setItem('tenantId', 'raftopoulos-live');
            localStorage.setItem('show_technical_demo_routes', 'false');
            localStorage.setItem('allow_visible_technical_unlock', 'false');
            window.location.href = '/sales/raftopoulos';
          }}
        >
          Enable Raftopoulos Demo
        </button>
      </section>
    );
  }

  return (
    <section style={clientHeader}>
      <div style={headerCopy}>
        <div style={kicker}>RAFTOP CPAP CARE Pro</div>

        <h1 style={title}>Raftopoulos CPAP Care</h1>

        <p style={subtitle}>
          Enterprise περιβάλλον παρακολούθησης CPAP, προτεραιοποίησης ATLAS
          και ελέγχου follow-up για μεγάλο χαρτοφυλάκιο ασθενών.
        </p>

        {technicalUnlocked && (
          <div style={technicalWarning}>
            Οι τεχνικές σελίδες είναι ξεκλειδωμένες. Κλείδωσέ τες πριν από παρουσίαση.
          </div>
        )}
      </div>

      <div style={actions}>
        <Link to="/sales/raftopoulos" style={primaryLink}>
          Sales Snapshot
        </Link>

        <Link to="/tenant/dashboard" style={secondaryLink}>
          Dashboard
        </Link>

        <Link to="/tenant/patient-signals" style={secondaryLink}>
          Signals
        </Link>

        <Link to="/tenant/atlas" style={secondaryLink}>
          ATLAS
        </Link>

        <Link to="/tenant/atlas/action-center" style={secondaryLink}>
          Action Center
        </Link>

        {visibleUnlockAllowed && (
          <button
            type="button"
            style={ghostButton}
            onClick={() => {
              localStorage.setItem(
                'show_technical_demo_routes',
                technicalUnlocked ? 'false' : 'true'
              );
              window.location.reload();
            }}
          >
            {technicalUnlocked ? 'Lock Technical Pages' : 'Unlock Technical Pages'}
          </button>
        )}
      </div>
    </section>
  );
}

const clientHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 22,
  flexWrap: 'wrap',
  background: 'linear-gradient(135deg, #020617 0%, #0f766e 52%, #14b8a6 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 30,
  margin: '0 0 18px',
  boxShadow: '0 22px 64px rgba(15, 23, 42, 0.18)'
};

const headerCopy = {
  maxWidth: 760
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  opacity: 0.9
};

const title = {
  margin: '8px 0 8px',
  fontSize: 36,
  lineHeight: 1.04,
  letterSpacing: '-0.03em'
};

const subtitle = {
  margin: 0,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 750,
  maxWidth: 760,
  lineHeight: 1.5
};

const actions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end'
};

const primaryLink = {
  background: '#ffffff',
  color: '#0f172a',
  textDecoration: 'none',
  borderRadius: 15,
  padding: '12px 15px',
  fontWeight: 1000,
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)'
};

const secondaryLink = {
  background: 'rgba(255,255,255,0.14)',
  color: '#ffffff',
  textDecoration: 'none',
  border: '1px solid rgba(255,255,255,0.32)',
  borderRadius: 15,
  padding: '12px 15px',
  fontWeight: 1000
};

const ghostButton = {
  background: 'rgba(15,23,42,0.45)',
  color: '#ffffff',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 15,
  padding: '12px 15px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const technicalWarning = {
  marginTop: 14,
  display: 'inline-block',
  background: '#fef3c7',
  color: '#92400e',
  border: '1px solid #fde68a',
  borderRadius: 14,
  padding: '9px 12px',
  fontWeight: 900,
  fontSize: 13
};

const inactiveBox = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  background: '#f8fafc',
  color: '#334155',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: '12px 16px',
  margin: '14px 0',
  fontWeight: 800
};

const inactiveText = {
  marginTop: 4,
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700
};

const button = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  borderRadius: 12,
  padding: '9px 13px',
  fontWeight: 900,
  cursor: 'pointer'
};