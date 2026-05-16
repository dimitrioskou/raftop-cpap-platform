import React from 'react';

const approvalItems = [
  {
    title: 'Controlled pilot launch',
    description:
      'Έναρξη πιλοτικής χρήσης του RAFTOP CPAP CARE Pro με περιορισμένο cohort ασθενών, όχι πλήρες rollout.',
  },
  {
    title: 'Defined patient cohort',
    description:
      'Επιλογή συγκεκριμένου αριθμού CPAP ασθενών για παρακολούθηση, αξιολόγηση συμμόρφωσης και follow-up.',
  },
  {
    title: 'Weekly review rhythm',
    description:
      'Εβδομαδιαία αξιολόγηση με συγκεκριμένα ευρήματα: compliance risk, follow-up needs, operational adoption.',
  },
  {
    title: 'Pilot KPI tracking',
    description:
      'Μέτρηση KPIs που δείχνουν αν η πλατφόρμα δημιουργεί πραγματική επιχειρησιακή και εμπορική αξία.',
  },
];

const notApprovedYet = [
  'Δεν ζητείται άμεση πλήρης εγκατάσταση σε όλους τους ασθενείς.',
  'Δεν ζητείται μακροχρόνια εμπορική δέσμευση πριν το pilot.',
  'Δεν ζητείται πλήρης αλλαγή του τρόπου εργασίας της ομάδας από την πρώτη ημέρα.',
  'Δεν ζητείται τελική τιμολόγηση full rollout πριν υπάρξει pilot evidence.',
];

const kpis = [
  {
    label: 'Patient cohort',
    value: '100–300',
    text: 'ενδεικτικός αριθμός για αρχική απόδειξη αξίας',
  },
  {
    label: 'Compliance target',
    value: '80h/month',
    text: 'κεντρικό operational compliance threshold',
  },
  {
    label: 'Review cadence',
    value: 'Weekly',
    text: 'σταθερή αξιολόγηση προόδου και εμποδίων',
  },
  {
    label: 'Decision window',
    value: '30–45 days',
    text: 'αρκετό διάστημα για evidence-based απόφαση',
  },
];

const decisionOutcomes = [
  {
    outcome: 'Approve pilot',
    meaning:
      'Η Raftopoulos συμφωνεί να ξεκινήσει controlled pilot με cohort, KPIs και υπεύθυνο επαφής.',
    nextStep:
      'Ορίζεται pilot kickoff meeting, τελικό cohort και εβδομαδιαίο review rhythm.',
    tone: 'success',
  },
  {
    outcome: 'Request modifications',
    meaning:
      'Υπάρχει ενδιαφέρον, αλλά ζητούνται αλλαγές σε scope, cohort, reporting ή operational flow.',
    nextStep:
      'Καταγράφονται οι αλλαγές και επανέρχεται αναθεωρημένη pilot πρόταση.',
    tone: 'warning',
  },
  {
    outcome: 'Delay decision',
    meaning:
      'Δεν υπάρχει άμεση απόφαση. Αυτό δεν είναι “όχι”, αλλά χρειάζεται σαφές follow-up.',
    nextStep:
      'Κλείνεται συγκεκριμένη ημερομηνία επόμενης απόφασης. Όχι αόριστο “θα το δούμε”.',
    tone: 'neutral',
  },
  {
    outcome: 'Reject pilot',
    meaning:
      'Η Raftopoulos δεν θέλει να δοκιμάσει το pilot στην παρούσα φάση.',
    nextStep:
      'Ζητείται ο συγκεκριμένος λόγος απόρριψης για μελλοντικό repositioning.',
    tone: 'danger',
  },
];

const requiredCommitments = [
  {
    role: 'Raftopoulos decision owner',
    commitment:
      'Ένας υπεύθυνος που μπορεί να εγκρίνει pilot scope και να παρακολουθεί την πρόοδο.',
  },
  {
    role: 'Operational contact',
    commitment:
      'Ένα άτομο από την ομάδα που θα συμμετέχει στη δοκιμή και θα δίνει feedback.',
  },
  {
    role: 'Patient cohort',
    commitment:
      'Συγκεκριμένη λίστα ή κατηγορία ασθενών για την αρχική δοκιμή.',
  },
  {
    role: 'Weekly review slot',
    commitment:
      'Σταθερή εβδομαδιαία συνάντηση ή review για KPIs, blockers και next actions.',
  },
];

function getOutcomeStyle(tone) {
  if (tone === 'success') {
    return {
      background: '#ecfdf5',
      border: '1px solid #a7f3d0',
      color: '#065f46',
    };
  }

  if (tone === 'warning') {
    return {
      background: '#fffbeb',
      border: '1px solid #fde68a',
      color: '#92400e',
    };
  }

  if (tone === 'danger') {
    return {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#991b1b',
    };
  }

  return {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#334155',
  };
}

function RaftopoulosPilotApprovalDecisionPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrowLight}>RAFTOP CPAP CARE Pro</p>
        <h1 style={styles.title}>Pilot Approval Decision</h1>
        <p style={styles.subtitle}>
          Η τελική σελίδα απόφασης για τη Raftopoulos. Ξεκαθαρίζει τι ζητάμε να
          εγκριθεί, τι δεν ζητάμε ακόμα, ποια KPIs θα μετρηθούν και ποιο είναι
          το αμέσως επόμενο βήμα.
        </p>
      </section>

      <section style={styles.kpiGrid}>
        {kpis.map((item) => (
          <div key={item.label} style={styles.kpiCard}>
            <p style={styles.kpiLabel}>{item.label}</p>
            <h2 style={styles.kpiValue}>{item.value}</h2>
            <p style={styles.kpiText}>{item.text}</p>
          </div>
        ))}
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>What we ask to approve</p>
          <h2 style={styles.sectionTitle}>Τι εγκρίνει ο πελάτης σήμερα</h2>
          <p style={styles.sectionText}>
            Η έγκριση αφορά ελεγχόμενο pilot. Όχι πλήρη εμπορική δέσμευση, όχι
            μαζικό rollout, όχι τελική τιμολόγηση full deployment.
          </p>

          <div style={styles.approvalList}>
            {approvalItems.map((item) => (
              <div key={item.title} style={styles.approvalItem}>
                <div style={styles.checkIcon}>✓</div>
                <div>
                  <h3 style={styles.itemTitle}>{item.title}</h3>
                  <p style={styles.itemText}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.darkPanel}>
          <p style={styles.eyebrowLight}>Boundary control</p>
          <h2 style={styles.sectionTitleLight}>Τι δεν ζητάμε ακόμα</h2>
          <p style={styles.darkText}>
            Αυτό είναι κρίσιμο. Αν ο πελάτης νομίσει ότι του ζητάς full rollout
            από τώρα, αυξάνεται το ρίσκο και καθυστερεί η απόφαση.
          </p>

          <div style={styles.notYetList}>
            {notApprovedYet.map((item) => (
              <div key={item} style={styles.notYetItem}>
                <span style={styles.notIcon}>!</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Decision outcomes</p>
          <h2 style={styles.sectionTitle}>Πιθανά αποτελέσματα της συνάντησης</h2>
          <p style={styles.sectionText}>
            Δεν αφήνουμε το τέλος της παρουσίασης αόριστο. Κάθε πιθανό αποτέλεσμα
            έχει ερμηνεία και επόμενο βήμα.
          </p>
        </div>

        <div style={styles.outcomeGrid}>
          {decisionOutcomes.map((item) => (
            <article key={item.outcome} style={{ ...styles.outcomeCard, ...getOutcomeStyle(item.tone) }}>
              <h3 style={styles.outcomeTitle}>{item.outcome}</h3>
              <p style={styles.outcomeLabel}>Meaning</p>
              <p style={styles.outcomeText}>{item.meaning}</p>
              <p style={styles.outcomeLabel}>Next step</p>
              <p style={styles.outcomeText}>{item.nextStep}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>Minimum commitments</p>
          <h2 style={styles.sectionTitle}>Τι χρειάζεται για να ξεκινήσει το pilot</h2>

          <div style={styles.commitmentList}>
            {requiredCommitments.map((item) => (
              <div key={item.role} style={styles.commitmentItem}>
                <h3 style={styles.itemTitle}>{item.role}</h3>
                <p style={styles.itemText}>{item.commitment}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.closePanel}>
          <p style={styles.finalEyebrow}>Final ask</p>
          <h2 style={styles.finalTitle}>Η καθαρή ερώτηση απόφασης</h2>
          <p style={styles.finalText}>
            “Συμφωνούμε να ξεκινήσουμε controlled pilot με συγκεκριμένο cohort
            ασθενών, μετρήσιμα KPIs, εβδομαδιαίο review και σαφή ημερομηνία
            αξιολόγησης για το αν περνάμε στο επόμενο στάδιο;”
          </p>

          <div style={styles.actionBox}>
            <p style={styles.actionLabel}>If yes</p>
            <h3 style={styles.actionTitle}>Book pilot kickoff</h3>
            <p style={styles.actionText}>
              Κλείνουμε ημερομηνία, ορίζουμε υπεύθυνο, επιλέγουμε cohort και
              συμφωνούμε στα KPIs.
            </p>
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
    background: 'linear-gradient(135deg, #020617 0%, #164e63 52%, #065f46 100%)',
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
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 22,
  },
  kpiCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  },
  kpiLabel: {
    margin: 0,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  kpiValue: {
    margin: '10px 0 6px',
    color: '#0f172a',
    fontSize: 28,
    fontWeight: 1000,
  },
  kpiText: {
    margin: 0,
    color: '#64748b',
    lineHeight: 1.45,
    fontWeight: 700,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 22,
    marginBottom: 22,
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
    marginBottom: 22,
  },
  darkPanel: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 60%, #164e63 100%)',
    color: '#ffffff',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 20px 55px rgba(15, 23, 42, 0.2)',
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
  darkText: {
    margin: '12px 0 0',
    color: '#ccfbf1',
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 650,
  },
  approvalList: {
    display: 'grid',
    gap: 14,
    marginTop: 18,
  },
  approvalItem: {
    display: 'grid',
    gridTemplateColumns: '42px 1fr',
    gap: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  checkIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: '#16a34a',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 1000,
    fontSize: 20,
  },
  itemTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: 1000,
  },
  itemText: {
    margin: '6px 0 0',
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 650,
  },
  notYetList: {
    display: 'grid',
    gap: 12,
    marginTop: 18,
  },
  notYetItem: {
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
  notIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    background: '#f97316',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 1000,
  },
  outcomeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
  },
  outcomeCard: {
    borderRadius: 20,
    padding: 18,
  },
  outcomeTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 1000,
  },
  outcomeLabel: {
    margin: '14px 0 5px',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    opacity: 0.78,
  },
  outcomeText: {
    margin: 0,
    lineHeight: 1.55,
    fontWeight: 700,
  },
  commitmentList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    marginTop: 18,
  },
  commitmentItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
  },
  closePanel: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
    border: '1px solid #a7f3d0',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
    marginBottom: 22,
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
  },
  actionBox: {
    marginTop: 18,
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
    fontSize: 22,
    fontWeight: 1000,
  },
  actionText: {
    margin: 0,
    color: '#047857',
    lineHeight: 1.6,
    fontWeight: 700,
  },
};

export default RaftopoulosPilotApprovalDecisionPage;