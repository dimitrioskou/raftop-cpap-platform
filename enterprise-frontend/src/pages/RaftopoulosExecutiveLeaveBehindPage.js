import React from 'react';

const summaryBlocks = [
  {
    title: 'The problem',
    text:
      'Η Raftopoulos έχει σημαντική βάση CPAP ασθενών, αλλά η αξία χάνεται όταν τα δεδομένα δεν μετατρέπονται άμεσα σε follow-up, συμμόρφωση, προτεραιοποίηση και διοικητική εικόνα.',
  },
  {
    title: 'The proposed solution',
    text:
      'Το RAFTOP CPAP CARE Pro λειτουργεί ως commercial-operational command layer για CPAP ασθενείς, συσκευές, compliance risk, ATLAS prioritization, follow-up και executive reporting.',
  },
  {
    title: 'The low-risk path',
    text:
      'Η πρόταση δεν είναι άμεσο full rollout. Η πρόταση είναι controlled pilot με περιορισμένο cohort, σαφή KPIs, εβδομαδιαία αξιολόγηση και συγκεκριμένη απόφαση συνέχειας.',
  },
];

const pilotScope = [
  'Controlled pilot με επιλεγμένο cohort ασθενών',
  'Παρακολούθηση CPAP usage και compliance signals',
  'ATLAS prioritization για ασθενείς που χρειάζονται ενέργεια',
  'Weekly executive review με KPIs και blockers',
  'Απόφαση επέκτασης μόνο αν το pilot αποδείξει αξία',
];

const kpis = [
  {
    label: 'Pilot cohort',
    value: '100–300',
    note: 'ενδεικτικοί ασθενείς για αρχική αξιολόγηση',
  },
  {
    label: 'Compliance reference',
    value: '80h/month',
    note: 'κεντρικό σημείο αξιολόγησης χρήσης CPAP',
  },
  {
    label: 'Review cadence',
    value: 'Weekly',
    note: 'σταθερή επιχειρησιακή αξιολόγηση',
  },
  {
    label: 'Decision window',
    value: '30–45 days',
    note: 'χρονικό πλαίσιο για evidence-based απόφαση',
  },
];

const decisionPoints = [
  {
    label: 'Approve',
    text: 'Έγκριση controlled pilot με cohort, KPIs και pilot owner.',
  },
  {
    label: 'Assign',
    text: 'Ορισμός υπεύθυνου επαφής από Raftopoulos.',
  },
  {
    label: 'Start',
    text: 'Pilot kickoff με συγκεκριμένη ημερομηνία και εβδομαδιαίο rhythm.',
  },
];

function RaftopoulosExecutiveLeaveBehindPage() {
  return (
    <main style={styles.page}>
      <section style={styles.sheet}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>RAFTOP CPAP CARE Pro</p>
            <h1 style={styles.title}>Executive Pilot Leave-behind</h1>
            <p style={styles.subtitle}>
              One-page executive summary για τη διοίκηση της Raftopoulos μετά το demo.
            </p>
          </div>

          <div style={styles.decisionBox}>
            <p style={styles.decisionLabel}>Requested decision</p>
            <h2 style={styles.decisionTitle}>Approve controlled pilot</h2>
            <p style={styles.decisionText}>
              Όχι full rollout σήμερα. Έγκριση pilot με σαφή scope, KPIs και αξιολόγηση.
            </p>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          {summaryBlocks.map((item) => (
            <article key={item.title} style={styles.summaryCard}>
              <h2 style={styles.cardTitle}>{item.title}</h2>
              <p style={styles.cardText}>{item.text}</p>
            </article>
          ))}
        </section>

        <section style={styles.kpiGrid}>
          {kpis.map((item) => (
            <div key={item.label} style={styles.kpiCard}>
              <p style={styles.kpiLabel}>{item.label}</p>
              <h3 style={styles.kpiValue}>{item.value}</h3>
              <p style={styles.kpiNote}>{item.note}</p>
            </div>
          ))}
        </section>

        <section style={styles.twoColumn}>
          <div style={styles.panel}>
            <p style={styles.sectionKicker}>Pilot scope</p>
            <h2 style={styles.sectionTitle}>Τι περιλαμβάνει το pilot</h2>

            <div style={styles.scopeList}>
              {pilotScope.map((item) => (
                <div key={item} style={styles.scopeItem}>
                  <span style={styles.check}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.darkPanel}>
            <p style={styles.sectionKickerLight}>Business value</p>
            <h2 style={styles.sectionTitleLight}>Γιατί αξίζει να δοκιμαστεί</h2>
            <p style={styles.darkText}>
              Το pilot μειώνει το ρίσκο απόφασης και αποδεικνύει αν η Raftopoulos
              μπορεί να μετατρέψει το CPAP patient base σε οργανωμένο σύστημα
              συμμόρφωσης, follow-up, retention και doctor-channel value.
            </p>
          </div>
        </section>

        <section style={styles.decisionSection}>
          <div>
            <p style={styles.sectionKicker}>Next decision</p>
            <h2 style={styles.sectionTitle}>Τι πρέπει να συμφωνηθεί</h2>
          </div>

          <div style={styles.decisionGrid}>
            {decisionPoints.map((item) => (
              <article key={item.label} style={styles.decisionStep}>
                <div style={styles.stepBadge}>{item.label}</div>
                <p style={styles.stepText}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.finalClose}>
          <p style={styles.finalKicker}>Final executive message</p>
          <h2 style={styles.finalTitle}>
            Το σωστό επόμενο βήμα είναι controlled pilot, όχι αόριστη μελλοντική συζήτηση.
          </h2>
          <p style={styles.finalText}>
            Αν το pilot αποδείξει αξία σε compliance visibility, follow-up prioritization,
            operational adoption και διοικητική πληροφόρηση, τότε υπάρχει καθαρή βάση
            για εμπορικό rollout.
          </p>
        </section>

        <footer style={styles.footer}>
          <span>RAFTOP CPAP CARE Pro</span>
          <span>Controlled Pilot Proposal</span>
          <span>Prepared for Raftopoulos</span>
        </footer>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#e5e7eb',
    padding: 28,
    color: '#0f172a',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sheet: {
    maxWidth: 1180,
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: 28,
    padding: 34,
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.16)',
    border: '1px solid #e2e8f0',
  },
  header: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.8fr)',
    gap: 24,
    alignItems: 'stretch',
    paddingBottom: 22,
    borderBottom: '1px solid #e2e8f0',
    marginBottom: 22,
  },
  kicker: {
    margin: '0 0 8px',
    color: '#047857',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: 42,
    lineHeight: 1.06,
    fontWeight: 1000,
  },
  subtitle: {
    margin: '12px 0 0',
    maxWidth: 760,
    color: '#475569',
    fontSize: 17,
    lineHeight: 1.55,
    fontWeight: 650,
  },
  decisionBox: {
    background: 'linear-gradient(135deg, #0f172a 0%, #065f46 100%)',
    color: '#ffffff',
    borderRadius: 22,
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  decisionLabel: {
    margin: 0,
    color: '#99f6e4',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  decisionTitle: {
    margin: '10px 0',
    fontSize: 25,
    lineHeight: 1.15,
    fontWeight: 1000,
  },
  decisionText: {
    margin: 0,
    color: '#d1fae5',
    lineHeight: 1.6,
    fontWeight: 700,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 18,
  },
  summaryCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 1000,
  },
  cardText: {
    margin: '9px 0 0',
    color: '#475569',
    lineHeight: 1.58,
    fontWeight: 650,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
    marginBottom: 18,
  },
  kpiCard: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 18,
    padding: 16,
  },
  kpiLabel: {
    margin: 0,
    color: '#047857',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  kpiValue: {
    margin: '8px 0 4px',
    color: '#064e3b',
    fontSize: 25,
    fontWeight: 1000,
  },
  kpiNote: {
    margin: 0,
    color: '#047857',
    lineHeight: 1.45,
    fontWeight: 700,
    fontSize: 13,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 18,
    marginBottom: 18,
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
  },
  darkPanel: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 65%, #164e63 100%)',
    color: '#ffffff',
    borderRadius: 22,
    padding: 20,
  },
  sectionKicker: {
    margin: '0 0 7px',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  sectionKickerLight: {
    margin: '0 0 7px',
    color: '#99f6e4',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 24,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  sectionTitleLight: {
    margin: 0,
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  darkText: {
    margin: '12px 0 0',
    color: '#ccfbf1',
    lineHeight: 1.68,
    fontWeight: 700,
  },
  scopeList: {
    display: 'grid',
    gap: 10,
    marginTop: 14,
  },
  scopeItem: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr',
    gap: 9,
    alignItems: 'start',
    color: '#334155',
    lineHeight: 1.5,
    fontWeight: 750,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    background: '#16a34a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 1000,
  },
  decisionSection: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 0.65fr) minmax(0, 1.35fr)',
    gap: 18,
    alignItems: 'stretch',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
  },
  decisionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  },
  decisionStep: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 15,
  },
  stepBadge: {
    display: 'inline-flex',
    background: '#dbeafe',
    color: '#1d4ed8',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
  },
  stepText: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.55,
    fontWeight: 750,
  },
  finalClose: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
    border: '1px solid #a7f3d0',
    borderRadius: 24,
    padding: 22,
  },
  finalKicker: {
    margin: '0 0 8px',
    color: '#047857',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  finalTitle: {
    margin: 0,
    color: '#064e3b',
    fontSize: 27,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  finalText: {
    margin: '12px 0 0',
    color: '#047857',
    fontSize: 16,
    lineHeight: 1.65,
    fontWeight: 750,
    maxWidth: 1000,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    borderTop: '1px solid #e2e8f0',
    marginTop: 20,
    paddingTop: 14,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};

export default RaftopoulosExecutiveLeaveBehindPage;