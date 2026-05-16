import React from 'react';
import { Link } from 'react-router-dom';

export default function RaftopoulosSalesSnapshotPage() {
  return (
    <main style={page}>
      <section style={hero}>
        <div style={kicker}>RAFTOP CPAP CARE Pro</div>

        <h1 style={title}>
          Σύστημα ελέγχου, παρακολούθησης και follow-up ασθενών CPAP
        </h1>

        <p style={subtitle}>
          Μια enterprise πλατφόρμα για διανομέα CPAP που διαχειρίζεται μεγάλο
          αριθμό ασθενών, συσκευών, follow-ups και περιστατικών που χρειάζονται
          καθημερινή προτεραιοποίηση.
        </p>

        <div style={heroActions}>
          <Link to="/tenant/dashboard" style={primaryButton}>
            Άνοιγμα Dashboard
          </Link>

          <Link to="/tenant/patient-signals" style={secondaryButton}>
            Patient Signals
          </Link>

          <Link to="/tenant/atlas" style={secondaryButton}>
            ATLAS
          </Link>

          <Link to="/tenant/atlas/action-center" style={secondaryButton}>
            Action Center
          </Link>
        </div>
      </section>

      <section style={valueStrip}>
        <div style={valueItem}>
          <strong>Για ποιον είναι</strong>
          <span>Για εταιρεία / διανομέα CPAP με μεγάλο χαρτοφυλάκιο ασθενών.</span>
        </div>

        <div style={valueItem}>
          <strong>Τι λύνει</strong>
          <span>Μειώνει το χάος από Excel, τηλεφωνήματα, χαμένα follow-ups και ασύνδετα δεδομένα.</span>
        </div>

        <div style={valueItem}>
          <strong>Τι προσφέρει</strong>
          <span>Καθημερινή λίστα προτεραιοτήτων, signals, tasks και closed-loop παρακολούθηση.</span>
        </div>
      </section>

      <section style={grid}>
        <article style={card}>
          <div style={cardKicker}>Το πρόβλημα</div>
          <h2 style={cardTitle}>Η παρακολούθηση CPAP δεν κλιμακώνεται σωστά με Excel.</h2>
          <p style={text}>
            Όταν υπάρχουν χιλιάδες ασθενείς, η ομάδα δεν μπορεί να βασίζεται σε
            σκόρπιες λίστες, emails, τηλεφωνικές σημειώσεις και χειροκίνητη μνήμη.
            Το πραγματικό ερώτημα δεν είναι μόνο «πόσους ασθενείς έχουμε», αλλά
            «ποιοι χρειάζονται ενέργεια σήμερα».
          </p>
        </article>

        <article style={card}>
          <div style={cardKicker}>Η λύση</div>
          <h2 style={cardTitle}>Ένα επιχειρησιακό control hub για ασθενείς CPAP.</h2>
          <p style={text}>
            Η πλατφόρμα συγκεντρώνει ασθενείς, συσκευές, signals, tasks,
            follow-ups και λειτουργικά alerts σε ένα οργανωμένο tenant-based
            περιβάλλον, σχεδιασμένο για εταιρεία που θέλει έλεγχο και συνέχεια.
          </p>
        </article>

        <article style={card}>
          <div style={cardKicker}>Η διαφορά</div>
          <h2 style={cardTitle}>Το ATLAS μετατρέπει τα δεδομένα σε προτεραιότητες.</h2>
          <p style={text}>
            Το ATLAS δεν είναι απλό dashboard. Είναι το επίπεδο που βοηθά την
            ομάδα να δει ποιοι ασθενείς έχουν μεγαλύτερη ανάγκη παρέμβασης,
            ποια περιστατικά κινδυνεύουν και ποια follow-ups πρέπει να γίνουν πρώτα.
          </p>
        </article>
      </section>

      <section style={panel}>
        <div style={sectionHeader}>
          <div>
            <div style={sectionKicker}>Τι ελέγχει η πλατφόρμα</div>
            <h2 style={sectionTitle}>Από την πληροφορία στην ενέργεια</h2>
          </div>

          <Link to="/tenant/dashboard" style={darkLink}>
            Δες το Dashboard
          </Link>
        </div>

        <div style={featureGrid}>
          <div style={feature}>
            <strong>Ασθενείς</strong>
            <span>
              Οργανωμένο χαρτοφυλάκιο ασθενών ανά tenant, με δυνατότητα σύνδεσης
              με θεραπεία, συσκευή και follow-up ιστορικό.
            </span>
          </div>

          <div style={feature}>
            <strong>Συσκευές CPAP</strong>
            <span>
              Παρακολούθηση συσκευών, serial numbers, μοντέλων, sync status και
              πιθανών λειτουργικών θεμάτων.
            </span>
          </div>

          <div style={feature}>
            <strong>Patient Signals</strong>
            <span>
              Σήματα όπως χαμηλή χρήση, πιθανή διαρροή μάσκας, ανάγκη επικοινωνίας
              ή περιστατικό που πρέπει να ανέβει σε προτεραιότητα.
            </span>
          </div>

          <div style={feature}>
            <strong>ATLAS Prioritization</strong>
            <span>
              Ημερήσια προτεραιοποίηση περιστατικών, ώστε η ομάδα να ξέρει ποιον
              πρέπει να δει πρώτο.
            </span>
          </div>

          <div style={feature}>
            <strong>Action Center</strong>
            <span>
              Ενοποιημένη οθόνη για signals, tasks και επόμενες ενέργειες.
              Από το alert περνάμε στην πράξη.
            </span>
          </div>

          <div style={feature}>
            <strong>Closed Loop</strong>
            <span>
              Έλεγχος ότι ένα πρόβλημα δεν καταγράφηκε απλώς, αλλά ανατέθηκε,
              παρακολουθήθηκε και έκλεισε.
            </span>
          </div>
        </div>
      </section>

      <section style={metricsGrid}>
        <Metric label="Demo Tenant" value="raftopoulos-live" tone="success" />
        <Metric label="Enterprise Plan" value="ACTIVE" tone="success" />
        <Metric label="Patient Capacity" value="50.000" />
        <Metric label="Seats" value="100" />
        <Metric label="Demo Patients" value="5" />
        <Metric label="Demo Devices" value="4" />
      </section>

      <section style={panel}>
        <div style={sectionKicker}>Προτεινόμενο pilot</div>
        <h2 style={sectionTitle}>Πώς μπορεί να ξεκινήσει χωρίς ρίσκο</h2>

        <div style={timeline}>
          <Step
            number="1"
            title="Πιλοτική χρήση"
            text="Ξεκινάμε με 50–100 πραγματικούς ασθενείς και 2–3 χρήστες από την ομάδα."
          />

          <Step
            number="2"
            title="Συμφωνημένο import flow"
            text="Ορίζουμε πώς θα μπαίνουν δεδομένα από AirView export, CSV ή άλλο διαθέσιμο σύστημα."
          />

          <Step
            number="3"
            title="Ρύθμιση workflows"
            text="Ορίζουμε ποια signals έχουν σημασία, ποια follow-ups δημιουργούνται και ποια περιστατικά γίνονται critical."
          />

          <Step
            number="4"
            title="Production rollout"
            text="Μετά το pilot περνάμε σε πραγματικό deployment, backup policy, ρόλους χρηστών και πλήρη κλιμάκωση."
          />
        </div>
      </section>

      <section style={callout}>
        <div>
          <div style={calloutKicker}>Επόμενο βήμα</div>
          <h2 style={calloutTitle}>Προτείνεται controlled pilot πριν από πλήρες rollout.</h2>
          <p style={calloutText}>
            Το σωστό επόμενο βήμα είναι ένα πιλοτικό περιβάλλον με πραγματική δομή:
            επιλεγμένοι ασθενείς, πραγματικά follow-up σενάρια, συγκεκριμένος τρόπος
            εισαγωγής δεδομένων και μετρήσιμο αποτέλεσμα.
          </p>
        </div>

        <div style={calloutActions}>
          <Link to="/tenant/dashboard" style={primaryButton}>
            Start Demo Flow
          </Link>

          <Link to="/tenant/patient-signals" style={secondaryButton}>
            Signals
          </Link>

          <Link to="/tenant/atlas/action-center" style={secondaryButton}>
            Action Center
          </Link>
        </div>
      </section>

      <section style={disclaimer}>
        <strong>Σημείωση παρουσίασης:</strong>{' '}
        Αυτή είναι controlled commercial demo έκδοση. Για production χρήση απαιτούνται
        τελικό deployment, πραγματικά δεδομένα, backup policy, ρόλοι χρηστών και
        συμφωνημένο import workflow.
      </section>
    </main>
  );
}

function Metric({ label, value, tone = 'default' }) {
  const styles =
    tone === 'success'
      ? {
          background: '#f0fdf4',
          border: '#bbf7d0'
        }
      : {
          background: '#ffffff',
          border: '#e2e8f0'
        };

  return (
    <div
      style={{
        background: styles.background,
        border: `1px solid ${styles.border}`,
        borderRadius: 22,
        padding: 22,
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)'
      }}
    >
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div style={timelineItem}>
      <div style={timelineNumber}>{number}</div>
      <div>
        <strong style={stepTitle}>{title}</strong>
        <p style={stepText}>{text}</p>
      </div>
    </div>
  );
}

const page = {
  display: 'grid',
  gap: 20
};

const hero = {
  background: 'linear-gradient(135deg, #020617 0%, #0f766e 48%, #14b8a6 100%)',
  color: '#ffffff',
  borderRadius: 34,
  padding: 44,
  boxShadow: '0 24px 70px rgba(15, 23, 42, 0.18)'
};

const kicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  opacity: 0.9
};

const title = {
  margin: '14px 0 12px',
  fontSize: 52,
  lineHeight: 1.03,
  letterSpacing: '-0.04em',
  maxWidth: 1000
};

const subtitle = {
  margin: 0,
  maxWidth: 980,
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 750,
  fontSize: 20,
  lineHeight: 1.48
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
  textDecoration: 'none'
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

const valueStrip = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14
};

const valueItem = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 20,
  display: 'grid',
  gap: 8,
  color: '#334155',
  fontWeight: 750,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)'
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 18
};

const card = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const cardKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const cardTitle = {
  margin: '10px 0',
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 1.15
};

const text = {
  margin: 0,
  color: '#475569',
  fontSize: 15,
  lineHeight: 1.68,
  fontWeight: 650
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 26,
  padding: 26,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const sectionHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  flexWrap: 'wrap',
  marginBottom: 18
};

const sectionKicker = {
  color: '#0f766e',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const sectionTitle = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 30,
  lineHeight: 1.12
};

const darkLink = {
  background: '#0f172a',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: 15,
  padding: '12px 15px',
  fontWeight: 1000
};

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 14
};

const feature = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  display: 'grid',
  gap: 8,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.45
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 16
};

const metricLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metricValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 1000
};

const timeline = {
  display: 'grid',
  gap: 14,
  marginTop: 18
};

const timelineItem = {
  display: 'grid',
  gridTemplateColumns: '46px 1fr',
  gap: 14,
  alignItems: 'start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 18,
  color: '#334155',
  lineHeight: 1.55
};

const timelineNumber = {
  width: 46,
  height: 46,
  borderRadius: 999,
  background: '#0f766e',
  color: '#ffffff',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 1000
};

const stepTitle = {
  color: '#0f172a',
  fontSize: 16
};

const stepText = {
  margin: '6px 0 0',
  color: '#475569',
  fontWeight: 650
};

const callout = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 20,
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  color: '#ffffff',
  borderRadius: 30,
  padding: 32,
  boxShadow: '0 16px 50px rgba(15, 23, 42, 0.15)'
};

const calloutKicker = {
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

const calloutTitle = {
  margin: '8px 0',
  fontSize: 30,
  lineHeight: 1.1
};

const calloutText = {
  margin: 0,
  maxWidth: 820,
  color: 'rgba(255,255,255,0.86)',
  fontWeight: 700,
  lineHeight: 1.55
};

const calloutActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
};

const disclaimer = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 20,
  padding: 18,
  fontWeight: 800,
  lineHeight: 1.5
};