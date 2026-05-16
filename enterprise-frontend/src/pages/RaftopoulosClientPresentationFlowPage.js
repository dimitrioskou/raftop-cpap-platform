import React from 'react';

const presentationFlow = [
  {
    step: '01',
    title: 'Start with the problem',
    page: 'Demo Launcher',
    route: '/demo/raftopoulos/start',
    objective:
      'Να ανοίξει η συζήτηση με το επιχειρησιακό πρόβλημα: πολλοί CPAP ασθενείς, δύσκολη παρακολούθηση, χαμένη συμμόρφωση, χαμένο follow-up.',
    message:
      'Η Raftopoulos δεν χρειάζεται άλλο ένα dashboard. Χρειάζεται σύστημα ελέγχου ασθενών CPAP.',
  },
  {
    step: '02',
    title: 'Show the commercial opportunity',
    page: 'Sales Snapshot',
    route: '/sales/raftopoulos',
    objective:
      'Να φανεί αμέσως ότι το project έχει εμπορικό νόημα και δεν είναι απλώς τεχνική εφαρμογή.',
    message:
      'Το CPAP Care μπορεί να γίνει νέο business layer πάνω στους υπάρχοντες ασθενείς.',
  },
  {
    step: '03',
    title: 'Move to decision framing',
    page: 'Decision Room',
    route: '/sales/raftopoulos/decision-room',
    objective:
      'Να μεταφερθεί η κουβέντα από “μας αρέσει;” σε “ποια απόφαση πρέπει να πάρουμε;”.',
    message:
      'Η απόφαση δεν είναι αν η εφαρμογή είναι ωραία. Είναι αν αξίζει controlled pilot.',
  },
  {
    step: '04',
    title: 'Handle objections before they appear',
    page: 'Objections',
    route: '/sales/raftopoulos/objections',
    objective:
      'Να εξουδετερωθούν φόβοι για κόστος, πολυπλοκότητα, τεχνικό ρίσκο και αποδοχή από ομάδα.',
    message:
      'Δεν ζητάμε full rollout από την πρώτη μέρα. Ζητάμε ελεγχόμενο pilot με KPIs.',
  },
  {
    step: '05',
    title: 'Define pilot success',
    page: 'Pilot Success',
    route: '/sales/raftopoulos/pilot-success',
    objective:
      'Να υπάρχει αντικειμενικό πλαίσιο επιτυχίας, ώστε να μην μείνει η συζήτηση υποκειμενική.',
    message:
      'Αν το pilot δείξει compliance, follow-up και adoption, τότε υπάρχει βάση αγοράς.',
  },
  {
    step: '06',
    title: 'Explain pilot operation',
    page: 'Pilot Playbook',
    route: '/sales/raftopoulos/pilot-playbook',
    objective:
      'Να δείξουμε πώς θα δουλέψει πρακτικά το pilot: ποιος βλέπει τι, πότε γίνεται follow-up, τι μετράμε.',
    message:
      'Η πλατφόρμα δεν είναι θεωρία. Έχει συγκεκριμένο εβδομαδιαίο operational rhythm.',
  },
  {
    step: '07',
    title: 'Show business impact',
    page: 'Business Impact',
    route: '/tenant/business-impact',
    objective:
      'Να δέσουμε το προϊόν με retention, renewals, ιατρούς, compliance και αξία καναλιού.',
    message:
      'Η αξία δεν είναι το software. Η αξία είναι ο έλεγχος του CPAP patient base.',
  },
  {
    step: '08',
    title: 'Show executive reporting',
    page: 'Executive Report',
    route: '/tenant/statistics/report',
    objective:
      'Να φανεί ότι η διοίκηση μπορεί να παίρνει αποφάσεις χωρίς να μπαίνει σε τεχνικές λεπτομέρειες.',
    message:
      'Η διοίκηση χρειάζεται καθαρή εικόνα: adoption, risk, compliance, revenue potential.',
  },
  {
    step: '09',
    title: 'Present rollout roadmap',
    page: 'Rollout Roadmap',
    route: '/sales/raftopoulos/rollout-roadmap',
    objective:
      'Να μετατρέψουμε το ενδιαφέρον σε σχέδιο υλοποίησης με χαμηλό ρίσκο.',
    message:
      'Το σωστό επόμενο βήμα είναι controlled pilot, όχι αόριστη μελλοντική συζήτηση.',
  },
  {
    step: '10',
    title: 'Close with pilot proposal',
    page: 'Pilot Proposal',
    route: '/sales/raftopoulos/pilot',
    objective:
      'Να κλείσει η παρουσίαση με καθαρό request: έγκριση pilot και επόμενο meeting.',
    message:
      'Η τελική ερώτηση είναι απλή: ξεκινάμε pilot με συγκεκριμένο cohort και KPIs;',
  },
];

function RaftopoulosClientPresentationFlowPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>RAFTOP CPAP CARE Pro</p>
        <h1 style={styles.title}>Client Presentation Flow Lock</h1>
        <p style={styles.subtitle}>
          Κλειδωμένη σειρά παρουσίασης για Raftopoulos. Ο στόχος είναι να οδηγήσει
          τον πελάτη από πρόβλημα → αξία → pilot → rollout → απόφαση.
        </p>
      </section>

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Presentation mode</p>
          <h2 style={styles.summaryValue}>Client-facing</h2>
          <p style={styles.summaryText}>Χωρίς τεχνική σύγχυση, χωρίς internal noise.</p>
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Primary goal</p>
          <h2 style={styles.summaryValue}>Pilot approval</h2>
          <p style={styles.summaryText}>Όχι γενικό ενδιαφέρον. Συγκεκριμένη απόφαση.</p>
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Flow length</p>
          <h2 style={styles.summaryValue}>10 steps</h2>
          <p style={styles.summaryText}>Από sales framing μέχρι rollout roadmap.</p>
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Risk control</p>
          <h2 style={styles.summaryValue}>Controlled pilot</h2>
          <p style={styles.summaryText}>Μικρό cohort, μετρήσιμα KPIs, καθαρή αξιολόγηση.</p>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Locked sequence</p>
          <h2 style={styles.sectionTitle}>Η σωστή σειρά παρουσίασης</h2>
          <p style={styles.sectionText}>
            Μην ανοίξεις τυχαία σελίδες. Η σειρά έχει σημασία. Αν δείξεις πρώτα
            τεχνικές λειτουργίες, ο πελάτης θα ψάχνει κόστος και δυσκολία. Αν
            δείξεις πρώτα επιχειρησιακό πρόβλημα και μετά λύση, οδηγείς τη συζήτηση.
          </p>
        </div>

        <div style={styles.timeline}>
          {presentationFlow.map((item) => (
            <article key={item.step} style={styles.stepCard}>
              <div style={styles.stepHeader}>
                <div style={styles.stepNumber}>{item.step}</div>
                <div>
                  <h3 style={styles.stepTitle}>{item.title}</h3>
                  <p style={styles.pageName}>{item.page}</p>
                </div>
              </div>

              <div style={styles.routeBox}>{item.route}</div>

              <div style={styles.contentBlock}>
                <p style={styles.blockLabel}>Objective</p>
                <p style={styles.blockText}>{item.objective}</p>
              </div>

              <div style={styles.messageBox}>
                <p style={styles.blockLabelDark}>Key message</p>
                <p style={styles.messageText}>{item.message}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>Do not improvise</p>
          <h2 style={styles.sectionTitle}>Τι δεν πρέπει να κάνεις στην παρουσίαση</h2>

          <div style={styles.warningList}>
            <div style={styles.warningItem}>
              <strong>Μην ξεκινήσεις από features.</strong>
              <span> Θα τους κάνεις να σκεφτούν κόστος, όχι αξία.</span>
            </div>

            <div style={styles.warningItem}>
              <strong>Μην μπεις νωρίς σε τεχνικά routes.</strong>
              <span> Τα internal audits είναι για εμάς, όχι για client-first demo.</span>
            </div>

            <div style={styles.warningItem}>
              <strong>Μην πεις “είναι σχεδόν έτοιμο”.</strong>
              <span> Πες “είναι έτοιμο για controlled pilot”.</span>
            </div>

            <div style={styles.warningItem}>
              <strong>Μην πουλήσεις εφαρμογή.</strong>
              <span> Πούλησε σύστημα ελέγχου CPAP ασθενών και follow-up.</span>
            </div>
          </div>
        </div>

        <div style={styles.darkPanel}>
          <p style={styles.eyebrowLight}>Closing script</p>
          <h2 style={styles.sectionTitleLight}>Η τελική φράση που πρέπει να οδηγήσει σε απόφαση</h2>

          <p style={styles.scriptText}>
            “Η πρότασή μου δεν είναι να κάνουμε άμεσα πλήρη εγκατάσταση σε όλους
            τους ασθενείς. Η σωστή απόφαση είναι να ξεκινήσουμε ελεγχόμενο pilot
            με συγκεκριμένο αριθμό ασθενών, συγκεκριμένα KPIs και εβδομαδιαία
            αξιολόγηση. Αν τα δεδομένα δείξουν αξία, τότε περνάμε σε εμπορικό rollout.”
          </p>

          <div style={styles.closeBox}>
            <p style={styles.closeLabel}>Ask for</p>
            <h3 style={styles.closeTitle}>Pilot approval meeting</h3>
            <p style={styles.closeText}>
              Στόχος δεν είναι “θα το δούμε”. Στόχος είναι ημερομηνία, cohort,
              υπεύθυνος επαφής και κριτήρια επιτυχίας.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.finalPanel}>
        <p style={styles.finalEyebrow}>Phase 23.10K outcome</p>
        <h2 style={styles.finalTitle}>Η παρουσίαση πλέον έχει σπονδυλική στήλη.</h2>
        <p style={styles.finalText}>
          Το RAFTOP CPAP CARE Pro δεν εμφανίζεται ως “collection of pages”.
          Εμφανίζεται ως οργανωμένο commercial decision journey. Αυτό είναι που
          χρειάζεται για να περάσεις από demo σε pilot.
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
    padding: '28px',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  hero: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)',
    color: '#ffffff',
    borderRadius: 28,
    padding: 34,
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
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
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: 42,
    lineHeight: 1.08,
    fontWeight: 1000,
  },
  subtitle: {
    margin: '16px 0 0',
    maxWidth: 980,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 18,
    lineHeight: 1.65,
    fontWeight: 650,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
    marginBottom: 22,
  },
  summaryCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  },
  summaryLabel: {
    margin: 0,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  summaryValue: {
    margin: '10px 0 6px',
    color: '#0f172a',
    fontSize: 25,
    fontWeight: 1000,
  },
  summaryText: {
    margin: 0,
    color: '#64748b',
    fontWeight: 700,
    lineHeight: 1.45,
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
  timeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
  },
  stepCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 20,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: '#1d4ed8',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 1000,
    flexShrink: 0,
  },
  stepTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: 19,
    fontWeight: 1000,
  },
  pageName: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  routeBox: {
    display: 'inline-flex',
    background: '#e0f2fe',
    color: '#075985',
    border: '1px solid #bae6fd',
    borderRadius: 999,
    padding: '7px 11px',
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 14,
  },
  contentBlock: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  blockLabel: {
    margin: '0 0 6px',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  blockText: {
    margin: 0,
    color: '#334155',
    lineHeight: 1.55,
    fontWeight: 650,
  },
  messageBox: {
    background: '#0f172a',
    color: '#ffffff',
    borderRadius: 16,
    padding: 14,
  },
  blockLabelDark: {
    margin: '0 0 6px',
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  messageText: {
    margin: 0,
    color: '#e2e8f0',
    lineHeight: 1.55,
    fontWeight: 700,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 22,
    marginBottom: 22,
  },
  warningList: {
    display: 'grid',
    gap: 12,
    marginTop: 16,
  },
  warningItem: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: 16,
    padding: 15,
    color: '#7c2d12',
    lineHeight: 1.55,
    fontWeight: 700,
  },
  darkPanel: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 60%, #1e3a8a 100%)',
    color: '#ffffff',
    borderRadius: 26,
    padding: 26,
    boxShadow: '0 20px 55px rgba(15, 23, 42, 0.2)',
    marginBottom: 22,
  },
  scriptText: {
    color: '#dbeafe',
    fontSize: 17,
    lineHeight: 1.75,
    fontWeight: 650,
  },
  closeBox: {
    marginTop: 18,
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: 20,
    padding: 18,
  },
  closeLabel: {
    margin: 0,
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 1000,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  closeTitle: {
    margin: '8px 0',
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 1000,
  },
  closeText: {
    margin: 0,
    color: '#dbeafe',
    lineHeight: 1.6,
    fontWeight: 650,
  },
  finalPanel: {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
    border: '1px solid #a7f3d0',
    borderRadius: 26,
    padding: 28,
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
    fontSize: 30,
    lineHeight: 1.18,
    fontWeight: 1000,
  },
  finalText: {
    margin: '12px 0 0',
    color: '#047857',
    fontSize: 17,
    lineHeight: 1.7,
    fontWeight: 700,
    maxWidth: 1050,
  },
};

export default RaftopoulosClientPresentationFlowPage;