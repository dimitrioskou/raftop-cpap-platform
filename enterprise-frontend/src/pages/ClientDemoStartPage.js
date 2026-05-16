import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function lockClientDemo() {
  localStorage.setItem('tenant_id', 'raftopoulos-live');
  localStorage.setItem('tenantId', 'raftopoulos-live');
  localStorage.setItem('commercial_demo_mode', 'true');
  localStorage.setItem('show_technical_demo_routes', 'false');
  localStorage.setItem('allow_visible_technical_unlock', 'false');

  localStorage.removeItem('demo_unlock_requested');
  localStorage.removeItem('debug_mode');
  localStorage.removeItem('show_json');
  localStorage.removeItem('show_internal_routes');

  return {
    tenantId: 'raftopoulos-live',
    commercialDemoMode: 'true',
    showTechnicalDemoRoutes: 'false',
    allowVisibleTechnicalUnlock: 'false'
  };
}

function getDestination(mode) {
  if (mode === 'pilot') {
    return '/sales/raftopoulos/pilot';
  }

  if (mode === 'decision-room') {
    return '/sales/raftopoulos/decision-room';
  }

  return '/sales/raftopoulos';
}

function getModeLabel(mode) {
  if (mode === 'pilot') {
    return 'Pilot Proposal';
  }

  if (mode === 'decision-room') {
    return 'Decision Room';
  }

  return 'Sales Snapshot';
}

export default function ClientDemoStartPage({ mode = 'snapshot' }) {
  const [lockedState, setLockedState] = useState(null);
  const [seconds, setSeconds] = useState(3);

  const destination = useMemo(() => getDestination(mode), [mode]);
  const modeLabel = useMemo(() => getModeLabel(mode), [mode]);

  useEffect(() => {
    const state = lockClientDemo();
    setLockedState(state);

    const countdown = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(countdown);
          window.location.href = destination;
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [destination]);

  function goNow() {
    lockClientDemo();
    window.location.href = destination;
  }

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro</div>

        <h1 style={title}>
          Client Demo Launcher
        </h1>

        <p style={subtitle}>
          Το demo κλειδώνει αυτόματα σε καθαρό client-facing mode και ανοίγει
          τη σωστή εμπορική σελίδα χωρίς Console, χωρίς τεχνικά routes και χωρίς
          internal audit προβολές.
        </p>

        <div style={destinationBadge}>
          Destination: {modeLabel}
        </div>

        <div style={statusRow}>
          <StatusPill label="Tenant" value="raftopoulos-live" tone="success" />
          <StatusPill label="Commercial Demo" value="ON" tone="success" />
          <StatusPill label="Technical Pages" value="LOCKED" tone="success" />
          <StatusPill label="Visible Unlock" value="HIDDEN" tone="success" />
        </div>

        <div style={heroActions}>
          <button type="button" style={primaryButton} onClick={goNow}>
            Open Now
          </button>

          <Link to="/sales/raftopoulos" style={secondaryButton}>
            Sales Snapshot
          </Link>

          <Link to="/sales/raftopoulos/decision-room" style={secondaryButton}>
            Decision Room
          </Link>

          <Link to="/sales/raftopoulos/pilot" style={secondaryButton}>
            Pilot Proposal
          </Link>
        </div>
      </section>

      <section style={panel}>
        <div style={panelKicker}>Automatic redirect</div>

        <h2 style={panelTitle}>
          Opening {modeLabel} in {seconds}...
        </h2>

        <p style={panelText}>
          Destination:{' '}
          <strong>
            {destination}
          </strong>
        </p>

        <div style={progressTrack}>
          <div
            style={{
              ...progressFill,
              width: `${Math.max(0, Math.min(100, ((3 - seconds) / 3) * 100))}%`
            }}
          />
        </div>
      </section>

      <section style={grid}>
        <article style={card}>
          <h3 style={cardTitle}>Τι κάνει αυτόματα</h3>

          <ul style={list}>
            <li>Επιλέγει tenant: raftopoulos-live</li>
            <li>Ενεργοποιεί commercial demo mode</li>
            <li>Κρύβει τεχνικές σελίδες</li>
            <li>Κρύβει visible unlock controls</li>
            <li>Καθαρίζει debug/local demo flags</li>
            <li>Σε πηγαίνει στο σωστό sales page</li>
          </ul>
        </article>

        <article style={card}>
          <h3 style={cardTitle}>Τι δεν πρέπει να κάνεις μπροστά στον πελάτη</h3>

          <ul style={dangerList}>
            <li>Μην ανοίγεις DevTools</li>
            <li>Μην ανοίγεις Console</li>
            <li>Μην δείχνεις internal routes</li>
            <li>Μην δείχνεις Release Candidate</li>
            <li>Μην δείχνεις JSON ή backend audit pages</li>
          </ul>
        </article>

        <article style={card}>
          <h3 style={cardTitle}>Καθαρά links παρουσίασης</h3>

          <div style={linkBox}>
            <div style={linkLabel}>Sales Snapshot</div>
            <code style={code}>/demo/raftopoulos/start</code>
          </div>

          <div style={linkBox}>
            <div style={linkLabel}>Decision Room</div>
            <code style={code}>/demo/raftopoulos/decision-room</code>
          </div>

          <div style={linkBox}>
            <div style={linkLabel}>Pilot Proposal</div>
            <code style={code}>/demo/raftopoulos/pilot</code>
          </div>
        </article>
      </section>

      <section style={flowPanel}>
        <div style={flowKicker}>Recommended Demo Flow</div>

        <h2 style={flowTitle}>
          Η σωστή σειρά παρουσίασης
        </h2>

        <div style={flowSteps}>
          <FlowStep number="1" title="Sales Snapshot" text="Δείχνεις τη συνολική εμπορική εικόνα." />
          <FlowStep number="2" title="Decision Room" text="Δείχνεις γιατί πρέπει να αποφασίσουν pilot." />
          <FlowStep number="3" title="Statistics" text="Δείχνεις επιχειρησιακά KPIs." />
          <FlowStep number="4" title="Business Impact" text="Δείχνεις πού δημιουργείται οικονομική αξία." />
          <FlowStep number="5" title="Pilot Proposal" text="Κλείνεις με ελεγχόμενο επόμενο βήμα." />
        </div>
      </section>

      <section style={internalBox}>
        <strong>Εσωτερική σημείωση:</strong>{' '}
        Πριν από παρουσίαση χρησιμοποιείς μόνο launcher links. Το πιο δυνατό
        link για απόφαση είναι το Decision Room launcher.
      </section>

      {lockedState && (
        <section style={technicalBox}>
          <div style={technicalTitle}>Locked State</div>

          <pre style={pre}>
            {JSON.stringify(lockedState, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}

function StatusPill({ label, value, tone = 'default' }) {
  const styles =
    tone === 'success'
      ? successPill
      : tone === 'danger'
        ? dangerPill
        : neutralPill;

  return (
    <div style={styles}>
      <span style={pillLabel}>{label}</span>
      <span style={pillValue}>{value}</span>
    </div>
  );
}

function FlowStep({ number, title, text }) {
  return (
    <article style={flowStep}>
      <div style={flowNumber}>{number}</div>
      <div>
        <h3 style={flowStepTitle}>{title}</h3>
        <p style={flowStepText}>{text}</p>
      </div>
    </article>
  );
}

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #0f766e 52%, #14b8a6 100%)',
  color: '#ffffff',
  borderRadius: 34,
  padding: 44,
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.18)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  opacity: 0.9,
  textTransform: 'uppercase'
};

const title = {
  margin: '14px 0 12px',
  fontSize: 52,
  lineHeight: 1.03,
  letterSpacing: '-0.04em'
};

const subtitle = {
  margin: 0,
  maxWidth: 980,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 750,
  fontSize: 20,
  lineHeight: 1.5
};

const destinationBadge = {
  marginTop: 18,
  display: 'inline-flex',
  alignItems: 'center',
  background: '#ffffff',
  color: '#0f172a',
  borderRadius: 999,
  padding: '10px 14px',
  fontWeight: 1000
};

const statusRow = {
  marginTop: 24,
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const neutralPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 999,
  padding: '9px 12px'
};

const successPill = {
  ...neutralPill,
  background: '#dcfce7',
  border: '1px solid #bbf7d0',
  color: '#166534'
};

const dangerPill = {
  ...neutralPill,
  background: '#fee2e2',
  border: '1px solid #fecaca',
  color: '#991b1b'
};

const pillLabel = {
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  opacity: 0.82
};

const pillValue = {
  fontSize: 13,
  fontWeight: 1000
};

const heroActions = {
  marginTop: 28,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const primaryButton = {
  display: 'inline-block',
  border: '1px solid rgba(255,255,255,0.55)',
  background: '#ffffff',
  color: '#0f172a',
  borderRadius: 16,
  padding: '13px 17px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const secondaryButton = {
  display: 'inline-block',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.12)',
  color: '#ffffff',
  borderRadius: 16,
  padding: '13px 17px',
  fontWeight: 1000,
  textDecoration: 'none'
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const panelKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const panelTitle = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const panelText = {
  margin: 0,
  color: '#475569',
  fontWeight: 800
};

const progressTrack = {
  marginTop: 18,
  background: '#e2e8f0',
  height: 12,
  borderRadius: 999,
  overflow: 'hidden'
};

const progressFill = {
  height: '100%',
  background: 'linear-gradient(90deg, #0f766e, #14b8a6)',
  borderRadius: 999,
  transition: 'width 0.4s ease'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16
};

const card = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 22,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
};

const cardTitle = {
  margin: '0 0 14px',
  color: '#0f172a',
  fontSize: 21,
  lineHeight: 1.2
};

const list = {
  margin: 0,
  paddingLeft: 20,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.7
};

const dangerList = {
  ...list,
  color: '#991b1b'
};

const linkBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  marginBottom: 10
};

const linkLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 6
};

const code = {
  display: 'block',
  color: '#0f172a',
  fontWeight: 900,
  whiteSpace: 'normal',
  wordBreak: 'break-all'
};

const flowPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const flowKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const flowTitle = {
  margin: '8px 0 18px',
  color: '#0f172a',
  fontSize: 32,
  lineHeight: 1.12
};

const flowSteps = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 14
};

const flowStep = {
  display: 'grid',
  gridTemplateColumns: '44px 1fr',
  gap: 12,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const flowNumber = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const flowStepTitle = {
  margin: 0,
  color: '#0f172a',
  fontSize: 17
};

const flowStepText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const internalBox = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 20,
  padding: 18,
  fontWeight: 850,
  lineHeight: 1.5
};

const technicalBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18
};

const technicalTitle = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 10
};

const pre = {
  margin: 0,
  background: '#020617',
  color: '#e2e8f0',
  padding: 14,
  borderRadius: 14,
  overflow: 'auto',
  fontSize: 12
};