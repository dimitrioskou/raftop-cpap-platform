import React from 'react';

const executivePoints = [
  {
    label: 'Problem',
    title: 'CPAP ασθενείς χωρίς ενιαίο operational control',
    text:
      'Η Raftopoulos διαθέτει σημαντική βάση ασθενών CPAP, αλλά η εμπορική αξία των δεδομένων χάνεται όταν δεν μετατρέπεται έγκαιρα σε follow-up, συμμόρφωση και διοικητική εικόνα.',
  },
  {
    label: 'Solution',
    title: 'RAFTOP CPAP CARE Pro ως command layer',
    text:
      'Η πλατφόρμα οργανώνει ασθενείς, συσκευές, compliance signals, ATLAS prioritization, follow-up και executive reporting σε ένα ενιαίο commercial-operational σύστημα.',
  },
  {
    label: 'Risk control',
    title: 'Controlled pilot αντί για full rollout',
    text:
      'Δεν ζητείται άμεση πλήρης εγκατάσταση. Ζητείται περιορισμένο pilot με σαφή cohort, KPIs, weekly review και συγκεκριμένο παράθυρο αξιολόγησης.',
  },
  {
    label: 'Decision',
    title: 'Έγκριση pilot με μετρήσιμα κριτήρια',
    text:
      'Η απόφαση σήμερα είναι αν αξίζει να δοκιμαστεί οργανωμένα, όχι αν πρέπει να αγοραστεί πλήρες enterprise rollout από την πρώτη ημέρα.',
  },
];

const valueCards = [
  {
    value: 'Better control',
    text: 'Πιο καθαρή εικόνα για το ποιοι ασθενείς χρειάζονται ενέργεια.',
  },
  {
    value: 'Compliance focus',
    text: 'Έμφαση στο κρίσιμο όριο χρήσης και στη συνέπεια παρακολούθησης.',
  },
  {
    value: 'Doctor channel value',
    text: 'Καλύτερη πληροφόρηση και πιθανή ενίσχυση συνεργασίας με ιατρούς.',
  },
  {
    value: 'Scalable model',
    text: 'Δυνατότητα να ξεκινήσει μικρά και να επεκταθεί σε μεγάλο patient base.',
  },
];

const approvalChecklist = [
  'Ορισμός decision owner από Raftopoulos',
  'Επιλογή αρχικού patient cohort',
  'Συμφωνία σε 3–5 pilot KPIs',
  'Ορισμός εβδομαδιαίου review rhythm',
  'Pilot kickoff date',
];

function RaftopoulosExecutivePilotClosePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrowLight}>RAFTOP CPAP CARE Pro</p>
          <h1 style={styles.title}>Executive Pilot Close</h1>
          <p style={styles.subtitle}>
            Η τελική executive σελίδα για να κλείσει η συνάντηση με καθαρή απόφαση:
            controlled pilot, μετρήσιμα KPIs και συγκεκριμένο επόμενο βήμα.
          </p>
        </div>

        <div style={styles.heroDecisionBox}>
          <p style={styles.heroDecisionLabel}>Decision request</p>
          <h2 style={styles.heroDecisionTitle}>Approve controlled pilot</h2>
          <p style={styles.heroDecisionText}>
            Όχι full rollout σήμερα. Έγκριση pilot με σαφές scope και αξιολόγηση.
          </p>
        </div>
      </section>

      <section style={styles.executiveStrip}>
        <div style={styles.stripItem}>
          <p style={styles.stripLabel}>Pilot size</p>
          <h2 style={styles.stripValue}>100–300</h2>
          <p style={styles.stripText}>ενδεικτικοί ασθενείς</p>
        </div>

        <div style={styles.stripItem}>
          <p style={styles.stripLabel}>Decision window</p>
          <h2 style={styles.stripValue}>30–45 days</h2>
          <p style={styles.stripText}>για evidence-based απόφαση</p>
        </div>

        <div style={styles.stripItem}>
          <p style={styles.stripLabel}>Main metric</p>
          <h2 style={styles.stripValue}>80h/month</h2>
          <p style={styles.stripText}>compliance reference point</p>
        </div>

        <div style={styles.stripItem}>
          <p style={styles.stripLabel}>Next action</p>
          <h2 style={styles.stripValue}>Kickoff</h2>
          <p style={styles.stripText}>με owner, cohort και KPIs</p>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Executive summary</p>
          <h2 style={styles.sectionTitle}>Το one-page business case</h2>
          <p style={styles.sectionText}>
            Αυτή είναι η εκδοχή που πρέπει να μείνει στη διοίκηση: πρόβλημα,
            λύση, έλεγχος ρίσκου και καθαρή απόφαση.
          </p>
        </div>

        <div style={styles.pointGrid}>
          {executivePoints.map((point) => (
            <article key={point.label} style={styles.pointCard}>
              <p style={styles.pointLabel}>{point.label}</p>
              <h3 style={styles.pointTitle}>{point.title}</h3>
              <p style={styles.pointText}>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>Value to Raftopoulos</p>
          <h2 style={styles.sectionTitle}>Τι κερδίζει η Raftopoulos</h2>

          <div style={styles.valueGrid}>
            {valueCards.map((item) => (
              <div key={item.value} style={styles.valueCard}>
                <h3 style={styles.valueTitle}>{item.value}</h3>
                <p style={styles.valueText}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.darkPanel}>
          <p style={styles.eyebrowLight}>Approval checklist</p>
          <h2 style={styles.sectionTitleLight}>Τι πρέπει να κλειδώσει πριν φύγουμε</h2>
          <p style={styles.darkText}>
            Αν δεν συμφωνηθούν αυτά, η συνάντηση τελειώνει με ενδιαφέρον αλλά όχι
            με απόφαση. Αυτό είναι αδύναμο close.
          </p>

          <div style={styles.checklist}>
            {approvalChecklist.map((item) => (
              <div key={item} style={styles.checkItem}>
                <span style={styles.checkIcon}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.closePanel}>
        <p style={styles.finalEyebrow}>Final executive close</p>
        <h2 style={styles.finalTitle}>Η τελική πρόταση προς τη διοίκηση</h2>
        <p style={styles.finalText}>
          “Η πρόταση δεν είναι να δεσμευτείτε σήμερα για πλήρη αγορά και rollout.
          Η πρόταση είναι να εγκρίνουμε ένα ελεγχόμενο pilot, με συγκεκριμένο
          αριθμό ασθενών, KPIs και εβδομαδιαία αξιολόγηση. Αν το pilot αποδείξει
          αξία, τότε έχουμε πραγματική βάση για εμπορική επέκταση.”
        </p>

        <div style={styles.actionRow}>
          <div style={styles.actionCard}>
            <p style={styles.actionLabel}>Ask</p>
            <h3 style={styles.actionTitle}>Approve pilot</h3>
            <p style={styles.actionText}>Να συμφωνηθεί ότι το pilot ξεκινά.</p>
          </div>

          <div style={styles.actionCard}>
            <p style={styles.actionLabel}>Next</p>
            <h3 style={styles.actionTitle}>Set kickoff</h3>
            <p style={styles.actionText}>Να οριστεί ημερομηνία, cohort και owner.</p>
          </div>

          <div style={styles.actionCard}>
            <p style={styles.actionLabel}>Guardrail</p>
            <h3 style={styles.actionTitle}>No vague follow-up</h3>
            <p style={styles.actionText}>Όχι “θα το δούμε”. Θέλουμε συγκεκριμένο επόμενο βήμα.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    padding: 28,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 0.8fr)',
    gap: 24,
    alignItems: 'stretch',
    background: 'linear-gradient(135deg, #020617 0%, #1e3a8a 52%, #065f46 100%)',
    color: '#ffffff',
    borderRadius: 30,
    padding: 36,
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.2)',
    marginBottom: 22,
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#2563eb',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  eyebrowLight: {
    margin: '0 0 8px',
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
    fontWeight: 1000,
  },
  subtitle: {
    margin: '16px 0 0',
    maxWidth: 1050,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 18,
    lineHeight: 1.65,
    fontWeight: 650,
  },
  heroDecisionBox: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 24,
    padding: 24,
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heroDecisionLabel: {
    margin: 0,
    color: '#ccfbf1',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  heroDecisionTitle: {
    margin: '12px 0',
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 1000,
  },
  heroDecisionText: {
    margin: 0,
    color: '#e0f2fe',
    lineHeight: 1.6,
    fontWeight: 700,
  },
  executiveStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 22,
  },
  stripItem: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  },
  stripLabel: {
    margin: 0,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  stripValue: {
    margin: '10px 0 6px',
    color: '#0f172a',
    fontSize: 28,
    fontWeight: 1000,
  },
  stripText: {
    margin: 0,
    color: '#64748b',
    lineHeight: 1.45,
    fontWeight: 700,
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
    marginBottom: 22,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 1000,
  },
  sectionTitleLight: {
    margin: 0,
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 1000,
  },
  sectionText: {
    margin: '10px 0 0',
    maxWidth: 1050,
    color: '#475569',
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 650,
  },
  pointGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
  },
  pointCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: 18,
  },
  pointLabel: {
    margin: '0 0 8px',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  pointTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: 1000,
    lineHeight: 1.3,
  },
  pointText: {
    margin: '10px 0 0',
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 650,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 22,
    marginBottom: 22,
  },
  valueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    marginTop: 18,
  },
  valueCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  valueTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: 1000,
  },
  valueText: {
    margin: '8px 0 0',
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 650,
  },
  darkPanel: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 60%, #164e63 100%)',
    color: '#ffffff',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 20px 55px rgba(15, 23, 42, 0.2)',
    marginBottom: 22,
  },
  darkText: {
    margin: '12px 0 0',
    color: '#ccfbf1',
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 650,
  },
  checklist: {
    display: 'grid',
    gap: 12,
    marginTop: 18,
  },
  checkItem: {
    display: 'grid',
    gridTemplateColumns: '34px 1fr',
    gap: 10,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 16,
    padding: 14,
    color: '#e0f2fe',
    lineHeight: 1.55,
    fontWeight: 750,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: '#16a34a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 1000,
  },
  closePanel: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
    border: '1px solid #a7f3d0',
    borderRadius: 28,
    padding: 30,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
  },
  finalEyebrow: {
    margin: '0 0 8px',
    color: '#047857',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  finalTitle: {
    margin: 0,
    color: '#064e3b',
    fontSize: 31,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  finalText: {
    margin: '14px 0 0',
    color: '#047857',
    fontSize: 18,
    lineHeight: 1.75,
    fontWeight: 750,
    maxWidth: 1150,
  },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 14,
    marginTop: 20,
  },
  actionCard: {
    background: '#ffffff',
    border: '1px solid #a7f3d0',
    borderRadius: 20,
    padding: 18,
  },
  actionLabel: {
    margin: 0,
    color: '#047857',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  actionTitle: {
    margin: '8px 0',
    color: '#064e3b',
    fontSize: 21,
    fontWeight: 1000,
  },
  actionText: {
    margin: 0,
    color: '#047857',
    lineHeight: 1.6,
    fontWeight: 700,
  },
};

export default RaftopoulosExecutivePilotClosePage;