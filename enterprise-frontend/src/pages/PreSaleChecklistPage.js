import React from 'react';
import { Link } from 'react-router-dom';

export default function PreSaleChecklistPage() {
  const checklist = [
    {
      group: 'Demo Lock',
      items: [
        'Το commercial_demo_mode είναι true.',
        'Το show_technical_demo_routes είναι false.',
        'Το allow_visible_technical_unlock είναι false.',
        'Δεν φαίνεται Tenant Context Switcher.',
        'Δεν φαίνεται x-super-admin-key.',
        'Δεν φαίνεται Technical Unlock.'
      ]
    },
    {
      group: 'Core Demo Flow',
      items: [
        'Η σελίδα /sales/raftopoulos ανοίγει σωστά.',
        'Το Dashboard φορτώνει χωρίς error.',
        'Τα Patient Signals φορτώνουν χωρίς HTTP 500.',
        'Το ATLAS ανοίγει χωρίς Route not found.',
        'Το Action Center ανοίγει χωρίς κόκκινο error.',
        'Το Closed Loop ανοίγει χωρίς τεχνικό σφάλμα.'
      ]
    },
    {
      group: 'Commercial Message',
      items: [
        'Ξεκινάς από πρόβλημα: πολλά CPAP περιστατικά δεν ελέγχονται σωστά με Excel.',
        'Δεν λες “είναι demo με ψεύτικα δεδομένα”.',
        'Λες “controlled commercial demo έκδοση”.',
        'Δεν λες “production-ready”.',
        'Λες ότι για production χρειάζεται deployment, πραγματικά δεδομένα, backup και import workflow.',
        'Κλείνεις ζητώντας pilot 50–100 ασθενών.'
      ]
    },
    {
      group: 'Do Not Show',
      items: [
        'Μην ανοίξεις Release Candidate μπροστά στον πελάτη.',
        'Μην ανοίξεις Route Stability.',
        'Μην ανοίξεις Tenant Cleanup.',
        'Μην ανοίξεις Security Exposure.',
        'Μην ανοίξεις Backend Config.',
        'Μην δείξεις raw JSON.',
        'Μην δείξεις DevTools / Console.'
      ]
    }
  ];

  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>Internal / Pre-Sale Control</div>
        <h1 style={title}>Final Pre-Sale Checklist</h1>
        <p style={subtitle}>
          Χρησιμοποίησέ το μόνο εσωτερικά, 5 λεπτά πριν από παρουσίαση.
          Αν κάτι από αυτά αποτύχει, δεν δείχνεις το demo μέχρι να καθαρίσει.
        </p>

        <div style={heroActions}>
          <button
            type="button"
            style={primaryButton}
            onClick={() => {
              localStorage.setItem('tenant_id', 'raftopoulos-live');
              localStorage.setItem('tenantId', 'raftopoulos-live');
              localStorage.setItem('commercial_demo_mode', 'true');
              localStorage.setItem('show_technical_demo_routes', 'false');
              localStorage.setItem('allow_visible_technical_unlock', 'false');
              window.location.href = '/sales/raftopoulos';
            }}
          >
            Lock Client Demo & Open Sales Snapshot
          </button>

          <Link to="/sales/raftopoulos" style={secondaryButton}>
            Sales Snapshot
          </Link>

          <Link to="/tenant/dashboard" style={secondaryButton}>
            Dashboard
          </Link>
        </div>
      </section>

      <section style={statusGrid}>
        <StatusCard
          label="Tenant"
          value={localStorage.getItem('tenant_id') || localStorage.getItem('tenantId') || 'unknown'}
        />
        <StatusCard
          label="Commercial Demo"
          value={localStorage.getItem('commercial_demo_mode') === 'true' ? 'ON' : 'OFF'}
          tone={localStorage.getItem('commercial_demo_mode') === 'true' ? 'success' : 'danger'}
        />
        <StatusCard
          label="Technical Routes"
          value={localStorage.getItem('show_technical_demo_routes') === 'true' ? 'UNLOCKED' : 'LOCKED'}
          tone={localStorage.getItem('show_technical_demo_routes') === 'true' ? 'danger' : 'success'}
        />
        <StatusCard
          label="Visible Unlock"
          value={localStorage.getItem('allow_visible_technical_unlock') === 'true' ? 'VISIBLE' : 'HIDDEN'}
          tone={localStorage.getItem('allow_visible_technical_unlock') === 'true' ? 'danger' : 'success'}
        />
      </section>

      <section style={grid}>
        {checklist.map((section) => (
          <article key={section.group} style={card}>
            <h2 style={cardTitle}>{section.group}</h2>

            <div style={items}>
              {section.items.map((item) => (
                <label key={item} style={itemRow}>
                  <input type="checkbox" style={checkbox} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section style={scriptPanel}>
        <div style={scriptKicker}>Τελική φράση πριν το κλείσιμο</div>
        <h2 style={scriptTitle}>Μην κλείσεις με “σας άρεσε;”. Κλείσε με pilot.</h2>

        <div style={quoteBox}>
          Το σωστό επόμενο βήμα είναι ένα περιορισμένο pilot με 50–100 πραγματικούς
          ασθενείς, 2–3 χρήστες από την ομάδα σας, συγκεκριμένα follow-up σενάρια
          και συμφωνημένο τρόπο εισαγωγής δεδομένων. Μετά το pilot μπορούμε να
          κοστολογήσουμε πλήρες rollout.
        </div>
      </section>

      <section style={dangerPanel}>
        <strong>Κόκκινη γραμμή:</strong>{' '}
        Αν δεις στην παρουσίαση λέξεις όπως Tenant Cleanup, Release Candidate,
        Security, Backend Config, Route Stability, x-super-admin-key ή Show JSON,
        η παρουσίαση δεν είναι καθαρή για πελάτη.
      </section>
    </main>
  );
}

function StatusCard({ label, value, tone = 'default' }) {
  const style =
    tone === 'success'
      ? successCard
      : tone === 'danger'
        ? dangerCard
        : neutralCard;

  return (
    <div style={style}>
      <div style={statusLabel}>{label}</div>
      <div style={statusValue}>{value}</div>
    </div>
  );
}

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #7f1d1d 52%, #dc2626 100%)',
  color: '#ffffff',
  borderRadius: 34,
  padding: 42,
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
  margin: '12px 0 10px',
  fontSize: 48,
  lineHeight: 1.04,
  letterSpacing: '-0.04em'
};

const subtitle = {
  margin: 0,
  maxWidth: 980,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 750,
  fontSize: 19,
  lineHeight: 1.5
};

const heroActions = {
  marginTop: 26,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center'
};

const primaryButton = {
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

const statusGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  gap: 14
};

const neutralCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
};

const successCard = {
  ...neutralCard,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0'
};

const dangerCard = {
  ...neutralCard,
  background: '#fef2f2',
  border: '1px solid #fecaca'
};

const statusLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const statusValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 1000
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 18
};

const card = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const cardTitle = {
  margin: '0 0 14px',
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 1.15
};

const items = {
  display: 'grid',
  gap: 12
};

const itemRow = {
  display: 'grid',
  gridTemplateColumns: '22px 1fr',
  gap: 10,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.45,
  cursor: 'pointer'
};

const checkbox = {
  width: 18,
  height: 18,
  marginTop: 2
};

const scriptPanel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 28,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const scriptKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const scriptTitle = {
  margin: '8px 0 16px',
  color: '#0f172a',
  fontSize: 30,
  lineHeight: 1.12
};

const quoteBox = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: 20,
  padding: 20,
  fontSize: 17,
  fontWeight: 850,
  lineHeight: 1.6
};

const dangerPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 18,
  fontWeight: 850,
  lineHeight: 1.5
};