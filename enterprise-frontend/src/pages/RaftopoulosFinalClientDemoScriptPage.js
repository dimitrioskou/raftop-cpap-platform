import React from 'react';

const demoScript = [
  {
    time: '00:00–02:00',
    section: 'Opening frame',
    page: 'Demo Launcher',
    route: '/demo/raftopoulos/start',
    say:
      'Σήμερα δεν θα σας δείξω απλώς μια εφαρμογή. Θα σας δείξω πώς μπορεί η Raftopoulos να αποκτήσει οργανωμένο σύστημα ελέγχου για CPAP ασθενείς, συμμόρφωση, follow-up και εμπορική αξιοποίηση του υπάρχοντος patient base.',
    goal:
      'Να τοποθετηθεί το project ως business control system, όχι ως απλό software demo.',
  },
  {
    time: '02:00–05:00',
    section: 'Business problem',
    page: 'Sales Snapshot',
    route: '/sales/raftopoulos',
    say:
      'Το βασικό πρόβλημα δεν είναι ότι υπάρχουν CPAP δεδομένα. Το πρόβλημα είναι ότι τα δεδομένα δεν μετατρέπονται πάντα σε έγκαιρη ενέργεια: ποιος ασθενής κινδυνεύει να χαθεί, ποιος χρειάζεται follow-up, ποιος δεν φτάνει τις ώρες συμμόρφωσης, ποιος πρέπει να ενημερωθεί.',
    goal:
      'Να συμφωνήσει ο πελάτης ότι υπάρχει operational και commercial pain.',
  },
  {
    time: '05:00–08:00',
    section: 'Decision framing',
    page: 'Decision Room',
    route: '/sales/raftopoulos/decision-room',
    say:
      'Η σωστή ερώτηση δεν είναι αν η πλατφόρμα είναι ενδιαφέρουσα. Η σωστή ερώτηση είναι αν αξίζει να τη δοκιμάσουμε με controlled pilot, σε συγκεκριμένο αριθμό ασθενών, με συγκεκριμένα KPIs.',
    goal:
      'Να μεταφερθεί η απόφαση από γενική εντύπωση σε συγκεκριμένο pilot decision.',
  },
  {
    time: '08:00–11:00',
    section: 'Objection handling',
    page: 'Objections',
    route: '/sales/raftopoulos/objections',
    say:
      'Καταλαβαίνω ότι μπορεί να υπάρχουν ενστάσεις: κόστος, πολυπλοκότητα, χρόνος ομάδας, τεχνική ωριμότητα. Για αυτό δεν προτείνω άμεσο full rollout. Προτείνω ελεγχόμενο pilot, ώστε να μετρήσουμε αξία πριν ζητηθεί πλήρης δέσμευση.',
    goal:
      'Να μειωθεί το perceived risk πριν τεθεί οικονομική ή τεχνική αντίρρηση.',
  },
  {
    time: '11:00–14:00',
    section: 'Pilot success criteria',
    page: 'Pilot Success',
    route: '/sales/raftopoulos/pilot-success',
    say:
      'Το pilot πρέπει να έχει σαφή κριτήρια επιτυχίας. Δεν αρκεί να πούμε “μας άρεσε”. Πρέπει να δούμε αν βελτιώνει εντοπισμό ασθενών υψηλού κινδύνου, follow-up, συμμόρφωση και δυνατότητα διοικητικής παρακολούθησης.',
    goal:
      'Να κλειδώσει η ανάγκη μετρήσιμων KPIs.',
  },
  {
    time: '14:00–17:00',
    section: 'Pilot operating model',
    page: 'Pilot Playbook',
    route: '/sales/raftopoulos/pilot-playbook',
    say:
      'Εδώ φαίνεται πώς θα λειτουργήσει πρακτικά. Δεν μένουμε σε θεωρία. Ορίζουμε ποιο cohort παρακολουθούμε, ποιος βλέπει alerts, πότε γίνεται follow-up, τι αναφέρεται κάθε εβδομάδα και ποια δεδομένα αξιολογούμε.',
    goal:
      'Να αποδειχθεί ότι υπάρχει πρακτικός τρόπος εκτέλεσης pilot.',
  },
  {
    time: '17:00–20:00',
    section: 'Business impact',
    page: 'Business Impact',
    route: '/tenant/business-impact',
    say:
      'Η πραγματική αξία είναι ότι η Raftopoulos αποκτά μηχανισμό ελέγχου πάνω σε ασθενείς CPAP: λιγότερη απώλεια επαφής, καλύτερη συμμόρφωση, καλύτερη σχέση με ιατρούς και δυνατότητα να χτιστεί premium service layer.',
    goal:
      'Να συνδεθεί η πλατφόρμα με retention, channel power και revenue potential.',
  },
  {
    time: '20:00–23:00',
    section: 'Executive reporting',
    page: 'Executive Report',
    route: '/tenant/statistics/report',
    say:
      'Για τη διοίκηση δεν έχει σημασία να βλέπει κάθε μικρή τεχνική λεπτομέρεια. Χρειάζεται καθαρή εικόνα: πόσοι ασθενείς παρακολουθούνται, πόσοι έχουν ρίσκο, πόσοι χρειάζονται follow-up και τι επίδραση έχει το σύστημα.',
    goal:
      'Να δείξει ότι το προϊόν μιλάει και σε διοικητικό επίπεδο.',
  },
  {
    time: '23:00–26:00',
    section: 'Rollout path',
    page: 'Rollout Roadmap',
    route: '/sales/raftopoulos/rollout-roadmap',
    say:
      'Αυτό είναι το προτεινόμενο rollout. Ξεκινάμε ελεγχόμενα, επιβεβαιώνουμε αξία, μετά επεκτείνουμε λειτουργικά και μόνο τότε πάμε σε εμπορική κλιμάκωση. Δεν ζητάμε άλμα στα τυφλά.',
    goal:
      'Να μετατραπεί το ενδιαφέρον σε πλάνο υλοποίησης.',
  },
  {
    time: '26:00–30:00',
    section: 'Close',
    page: 'Pilot Proposal',
    route: '/sales/raftopoulos/pilot',
    say:
      'Η πρότασή μου είναι να συμφωνήσουμε στο επόμενο βήμα: controlled pilot με συγκεκριμένο αριθμό ασθενών, συγκεκριμένο υπεύθυνο επαφής, συγκεκριμένα KPIs και εβδομαδιαία αξιολόγηση. Αν το pilot δείξει αξία, τότε συζητάμε πλήρες rollout.',
    goal:
      'Να ζητηθεί καθαρά pilot approval, όχι αόριστο follow-up.',
  },
];

const closingQuestions = [
  'Ποιος θα είναι ο εσωτερικός υπεύθυνος για το pilot;',
  'Με πόσους ασθενείς θέλετε να ξεκινήσει το πρώτο cohort;',
  'Ποια KPI θεωρείτε πιο σημαντικά: συμμόρφωση, follow-up, retention ή ιατρική συνεργασία;',
  'Θέλετε το pilot να είναι μόνο internal ή να συμμετέχουν και επιλεγμένοι ιατροί;',
  'Πότε μπορούμε να ορίσουμε το pilot kickoff meeting;',
];

const dangerPhrases = [
  {
    bad: 'Η εφαρμογή είναι σχεδόν έτοιμη.',
    good: 'Η πλατφόρμα είναι έτοιμη για controlled pilot.',
  },
  {
    bad: 'Έχει πολλά features.',
    good: 'Έχει συγκεκριμένη εμπορική και επιχειρησιακή χρήση.',
  },
  {
    bad: 'Μπορούμε να το προσαρμόσουμε όπως θέλετε.',
    good: 'Ξεκινάμε με καθαρό pilot scope και μετά αποφασίζουμε προσαρμογές.',
  },
  {
    bad: 'Να σας δείξω και τα τεχνικά audits.',
    good: 'Τα τεχνικά audits υπάρχουν για εσωτερική ασφάλεια. Σήμερα εστιάζουμε στην επιχειρησιακή απόφαση.',
  },
];

function RaftopoulosFinalClientDemoScriptPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrowLight}>RAFTOP CPAP CARE Pro</p>
        <h1 style={styles.title}>Final Client Demo Script</h1>
        <p style={styles.subtitle}>
          Τελικό σενάριο παρουσίασης προς Raftopoulos. Περιλαμβάνει σειρά,
          χρονισμό, σελίδα, ακριβές μήνυμα και στόχο κάθε ενότητας.
        </p>
      </section>

      <section style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Demo duration</p>
          <h2 style={styles.kpiValue}>30 min</h2>
          <p style={styles.kpiText}>Ιδανικό για decision meeting χωρίς τεχνική υπερφόρτωση.</p>
        </div>

        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Core ask</p>
          <h2 style={styles.kpiValue}>Pilot</h2>
          <p style={styles.kpiText}>Όχι “να το δούμε”. Ζητάμε συγκεκριμένο controlled pilot.</p>
        </div>

        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Tone</p>
          <h2 style={styles.kpiValue}>Executive</h2>
          <p style={styles.kpiText}>Business-first παρουσίαση, όχι developer demo.</p>
        </div>

        <div style={styles.kpiCard}>
          <p style={styles.kpiLabel}>Risk frame</p>
          <h2 style={styles.kpiValue}>Low risk</h2>
          <p style={styles.kpiText}>Μικρό cohort, KPIs, εβδομαδιαία αξιολόγηση.</p>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Demo sequence</p>
          <h2 style={styles.sectionTitle}>Ακριβές σενάριο 30 λεπτών</h2>
          <p style={styles.sectionText}>
            Ακολούθησε αυτή τη σειρά. Μην ανοίγεις σελίδες τυχαία. Το demo πρέπει
            να οδηγήσει σε μία απόφαση: έγκριση pilot.
          </p>
        </div>

        <div style={styles.scriptList}>
          {demoScript.map((item) => (
            <article key={item.section} style={styles.scriptCard}>
              <div style={styles.scriptTop}>
                <div style={styles.timeBox}>{item.time}</div>
                <div>
                  <h3 style={styles.scriptTitle}>{item.section}</h3>
                  <p style={styles.pageLabel}>{item.page}</p>
                </div>
              </div>

              <div style={styles.routePill}>{item.route}</div>

              <div style={styles.sayBox}>
                <p style={styles.boxLabel}>Say this</p>
                <p style={styles.sayText}>“{item.say}”</p>
              </div>

              <div style={styles.goalBox}>
                <p style={styles.boxLabel}>Goal</p>
                <p style={styles.goalText}>{item.goal}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>Closing control</p>
          <h2 style={styles.sectionTitle}>Ερωτήσεις κλεισίματος</h2>
          <p style={styles.sectionText}>
            Αυτές οι ερωτήσεις μετατρέπουν το “ενδιαφέρον” σε επόμενο βήμα.
          </p>

          <div style={styles.questionList}>
            {closingQuestions.map((question) => (
              <div key={question} style={styles.questionItem}>
                {question}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.darkPanel}>
          <p style={styles.eyebrowLight}>Language discipline</p>
          <h2 style={styles.sectionTitleLight}>Τι να μην πεις και τι να πεις αντί γι’ αυτό</h2>

          <div style={styles.phraseList}>
            {dangerPhrases.map((phrase) => (
              <div key={phrase.bad} style={styles.phraseCard}>
                <div style={styles.badPhrase}>
                  <span style={styles.phraseLabelBad}>Avoid</span>
                  <p>{phrase.bad}</p>
                </div>
                <div style={styles.goodPhrase}>
                  <span style={styles.phraseLabelGood}>Say instead</span>
                  <p>{phrase.good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.closePanel}>
        <p style={styles.finalEyebrow}>Final close</p>
        <h2 style={styles.finalTitle}>Η τελική πρόταση</h2>
        <p style={styles.finalScript}>
          “Το σωστό επόμενο βήμα δεν είναι να δεσμευτείτε σήμερα για πλήρες
          rollout. Το σωστό επόμενο βήμα είναι να εγκρίνουμε controlled pilot,
          με συγκεκριμένο cohort, συγκεκριμένα KPIs και συγκεκριμένη ημερομηνία
          αξιολόγησης. Αν τα δεδομένα δείξουν αξία, τότε περνάμε οργανωμένα στην
          επόμενη φάση.”
        </p>
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
    background: 'linear-gradient(135deg, #020617 0%, #1e3a8a 52%, #581c87 100%)',
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
    color: '#c4b5fd',
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
    maxWidth: 1000,
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
  scriptList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
  },
  scriptCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
  },
  scriptTop: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  timeBox: {
    minWidth: 98,
    borderRadius: 16,
    padding: '12px 10px',
    background: '#1d4ed8',
    color: '#ffffff',
    fontWeight: 1000,
    textAlign: 'center',
    fontSize: 13,
  },
  scriptTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 19,
    fontWeight: 1000,
  },
  pageLabel: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  routePill: {
    display: 'inline-flex',
    background: '#ede9fe',
    color: '#5b21b6',
    border: '1px solid #ddd6fe',
    borderRadius: 999,
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 14,
  },
  sayBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  goalBox: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 16,
    padding: 14,
  },
  boxLabel: {
    margin: '0 0 6px',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  sayText: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.6,
    fontWeight: 700,
  },
  goalText: {
    margin: 0,
    color: '#047857',
    lineHeight: 1.55,
    fontWeight: 800,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 22,
    marginBottom: 22,
  },
  questionList: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  questionItem: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 16,
    padding: 15,
    color: '#1e3a8a',
    lineHeight: 1.5,
    fontWeight: 900,
  },
  darkPanel: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 60%, #581c87 100%)',
    color: '#ffffff',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 20px 55px rgba(15, 23, 42, 0.2)',
    marginBottom: 22,
  },
  phraseList: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  phraseCard: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  badPhrase: {
    background: 'rgba(239, 68, 68, 0.14)',
    border: '1px solid rgba(248, 113, 113, 0.35)',
    borderRadius: 16,
    padding: 14,
    color: '#fecaca',
    fontWeight: 800,
    lineHeight: 1.45,
  },
  goodPhrase: {
    background: 'rgba(34, 197, 94, 0.14)',
    border: '1px solid rgba(74, 222, 128, 0.35)',
    borderRadius: 16,
    padding: 14,
    color: '#bbf7d0',
    fontWeight: 800,
    lineHeight: 1.45,
  },
  phraseLabelBad: {
    display: 'block',
    marginBottom: 6,
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  phraseLabelGood: {
    display: 'block',
    marginBottom: 6,
    color: '#86efac',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  closePanel: {
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
    border: '1px solid #ddd6fe',
    borderRadius: 28,
    padding: 30,
  },
  finalEyebrow: {
    margin: '0 0 8px',
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  finalTitle: {
    margin: 0,
    color: '#2e1065',
    fontSize: 31,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  finalScript: {
    margin: '14px 0 0',
    color: '#4c1d95',
    fontSize: 18,
    lineHeight: 1.75,
    fontWeight: 750,
    maxWidth: 1150,
  },
};

export default RaftopoulosFinalClientDemoScriptPage;