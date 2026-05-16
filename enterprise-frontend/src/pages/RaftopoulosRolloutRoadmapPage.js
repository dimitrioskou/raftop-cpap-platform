import React from 'react';

const roadmapPhases = [
  {
    phase: 'Phase 1',
    title: 'Controlled Pilot Readiness',
    period: 'Week 1',
    status: 'Ready for controlled demo',
    objective:
      'Να παρουσιαστεί η πλατφόρμα στη Raftopoulos με ασφαλή controlled demo, χωρίς να εξαρτάται η πώληση από live production data.',
    deliverables: [
      'Sales Snapshot',
      'Decision Room',
      'Objections Page',
      'Pilot Proposal',
      'Pilot Playbook',
      'Business Impact view',
      'Executive Statistics Report',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Pilot Launch',
    period: 'Weeks 2–4',
    status: 'Next commercial step',
    objective:
      'Να ξεκινήσει πιλοτική χρήση με περιορισμένο αριθμό ασθενών και σαφές operational workflow.',
    deliverables: [
      'Initial patient cohort',
      'CPAP usage review',
      '80-hour compliance tracking',
      'ATLAS task prioritization',
      'Weekly distributor review',
      'Doctor-facing reporting',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Operational Expansion',
    period: 'Month 2',
    status: 'Expansion candidate',
    objective:
      'Να μετατραπεί το pilot από παρουσίαση σε καθημερινό εργαλείο παρακολούθησης και follow-up.',
    deliverables: [
      'Expanded patient import',
      'Follow-up task board',
      'Risk segmentation',
      'Non-compliance queue',
      'Patient support workflow',
      'Distributor team adoption',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Commercial Rollout',
    period: 'Month 3',
    status: 'Revenue phase',
    objective:
      'Να περάσει η πλατφόρμα σε εμπορική χρήση ως premium CPAP management system για ασθενείς, ιατρούς και συνεργάτες.',
    deliverables: [
      'Subscription model activation',
      'Clinic / doctor access',
      'Distributor dashboard',
      'Monthly compliance reports',
      'Renewal-risk analytics',
      'White-label sales material',
    ],
  },
];

const kpis = [
  {
    label: 'Pilot target',
    value: '100–300',
    description: 'ασθενείς για αρχικό εμπορικό validation',
  },
  {
    label: 'Full channel potential',
    value: '7,000+',
    description: 'ασθενείς Raftopoulos υπό διαχείριση',
  },
  {
    label: 'Core compliance metric',
    value: '80h/month',
    description: 'κεντρικό όριο συμμόρφωσης CPAP',
  },
  {
    label: 'Commercial model',
    value: 'B2B2C',
    description: 'Raftopoulos → ιατροί/ασθενείς',
  },
];

const risks = [
  {
    risk: 'Demo χωρίς καθαρό business case',
    mitigation:
      'Το Rollout Roadmap συνδέει κάθε τεχνική λειτουργία με εμπορικό αποτέλεσμα.',
  },
  {
    risk: 'Υπερβολικά γρήγορη απαίτηση για production',
    mitigation:
      'Ξεκινάμε με controlled pilot, όχι με υπόσχεση πλήρους deployment από την πρώτη μέρα.',
  },
  {
    risk: 'Αμφιβολία για καθημερινή χρήση από ομάδα',
    mitigation:
      'Το ATLAS παρουσιάζεται ως operational command center, όχι απλώς dashboard.',
  },
  {
    risk: 'Πίεση τιμής',
    mitigation:
      'Η αξία δένεται με patient retention, compliance, renewals και doctor channel expansion.',
  },
];

function RaftopoulosRolloutRoadmapPage() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>RAFTOP CPAP CARE Pro</p>
          <h1 style={styles.title}>Rollout Roadmap</h1>
          <p style={styles.subtitle}>
            Εμπορικός και επιχειρησιακός χάρτης μετάβασης από controlled demo σε pilot,
            από pilot σε καθημερινή χρήση και από καθημερινή χρήση σε πλήρη εμπορική
            αξιοποίηση από τη Raftopoulos.
          </p>
        </div>

        <div style={styles.heroCard}>
          <p style={styles.heroCardLabel}>Current phase</p>
          <h2 style={styles.heroCardTitle}>Phase 23.10J</h2>
          <p style={styles.heroCardText}>
            Demo-ready commercial layer με controlled warnings, χωρίς hard blockers.
          </p>
        </div>
      </section>

      <section style={styles.kpiGrid}>
        {kpis.map((item) => (
          <div key={item.label} style={styles.kpiCard}>
            <p style={styles.kpiLabel}>{item.label}</p>
            <h3 style={styles.kpiValue}>{item.value}</h3>
            <p style={styles.kpiDescription}>{item.description}</p>
          </div>
        ))}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Execution sequence</p>
          <h2 style={styles.sectionTitle}>4-step rollout path</h2>
          <p style={styles.sectionDescription}>
            Δεν πουλάμε “μια εφαρμογή”. Πουλάμε ελεγχόμενη μετάβαση σε CPAP management
            σύστημα που μπορεί να ξεκινήσει μικρά και να κλιμακωθεί εμπορικά.
          </p>
        </div>

        <div style={styles.timeline}>
          {roadmapPhases.map((phase, index) => (
            <article key={phase.phase} style={styles.phaseCard}>
              <div style={styles.phaseTop}>
                <div style={styles.phaseNumber}>{index + 1}</div>
                <div>
                  <p style={styles.phaseMeta}>
                    {phase.phase} · {phase.period}
                  </p>
                  <h3 style={styles.phaseTitle}>{phase.title}</h3>
                </div>
              </div>

              <div style={styles.statusPill}>{phase.status}</div>

              <p style={styles.phaseObjective}>{phase.objective}</p>

              <div style={styles.deliverables}>
                {phase.deliverables.map((deliverable) => (
                  <div key={deliverable} style={styles.deliverableItem}>
                    <span style={styles.check}>✓</span>
                    <span>{deliverable}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <p style={styles.eyebrow}>Commercial logic</p>
          <h2 style={styles.sectionTitle}>Γιατί αυτό το roadmap πουλάει</h2>
          <p style={styles.bodyText}>
            Η Raftopoulos δεν χρειάζεται απλώς άλλο ένα dashboard. Χρειάζεται ένα
            εργαλείο που μειώνει αδράνεια, εντοπίζει ασθενείς που κινδυνεύουν να
            χαθούν, οργανώνει follow-up και μετατρέπει τα CPAP data σε εμπορική
            υπεραξία.
          </p>

          <div style={styles.argumentList}>
            <div style={styles.argumentItem}>
              <strong>1. Ελέγχει τον κίνδυνο.</strong>
              <span> Ξεκινά με pilot, όχι με τυφλό full rollout.</span>
            </div>
            <div style={styles.argumentItem}>
              <strong>2. Δείχνει business impact.</strong>
              <span> Συνδέει compliance, retention και renewals.</span>
            </div>
            <div style={styles.argumentItem}>
              <strong>3. Είναι scalable.</strong>
              <span> Από 100 ασθενείς μπορεί να πάει σε 7.000+.</span>
            </div>
            <div style={styles.argumentItem}>
              <strong>4. Βάζει τη Raftopoulos στο κέντρο.</strong>
              <span> Η πλατφόρμα γίνεται δικό της channel asset.</span>
            </div>
          </div>
        </div>

        <div style={styles.panelDark}>
          <p style={styles.eyebrowLight}>Decision message</p>
          <h2 style={styles.sectionTitleLight}>Η πρόταση προς Raftopoulos</h2>
          <p style={styles.bodyTextLight}>
            “Δεν σας ζητάμε να αγοράσετε απλώς software. Σας προτείνουμε να
            ελέγξετε, με χαμηλό ρίσκο, αν μπορείτε να μετατρέψετε τα CPAP data σας
            σε οργανωμένο σύστημα συμμόρφωσης, follow-up, συνεργασίας με ιατρούς
            και επαναλαμβανόμενης αξίας.”
          </p>

          <div style={styles.nextActionBox}>
            <p style={styles.nextActionLabel}>Recommended next action</p>
            <h3 style={styles.nextActionTitle}>Approve controlled pilot</h3>
            <p style={styles.nextActionText}>
              Έναρξη με συγκεκριμένο cohort, εβδομαδιαία αξιολόγηση και προκαθορισμένα
              KPIs πριν την πλήρη εμπορική ανάπτυξη.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <p style={styles.eyebrow}>Risk handling</p>
          <h2 style={styles.sectionTitle}>Πιθανές αντιρρήσεις και άμυνα</h2>
        </div>

        <div style={styles.riskGrid}>
          {risks.map((item) => (
            <div key={item.risk} style={styles.riskCard}>
              <h3 style={styles.riskTitle}>{item.risk}</h3>
              <p style={styles.riskText}>{item.mitigation}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.finalBox}>
        <p style={styles.finalEyebrow}>Bottom line</p>
        <h2 style={styles.finalTitle}>
          Το Rollout Roadmap είναι η γέφυρα ανάμεσα στο demo και στην απόφαση αγοράς.
        </h2>
        <p style={styles.finalText}>
          Αν η παρουσίαση μείνει μόνο σε features, η Raftopoulos μπορεί να πει
          “ενδιαφέρον, θα το δούμε”. Αν παρουσιαστεί ως rollout plan με pilot,
          KPIs, εμπορική λογική και risk control, η συζήτηση μεταφέρεται από
          “αν είναι ωραίο” στο “πότε ξεκινάμε”.
        </p>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#111827',
    padding: '32px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 0.8fr)',
    gap: '24px',
    alignItems: 'stretch',
    marginBottom: '24px',
  },
  eyebrow: {
    margin: '0 0 8px 0',
    color: '#2563eb',
    fontWeight: 800,
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  eyebrowLight: {
    margin: '0 0 8px 0',
    color: '#93c5fd',
    fontWeight: 800,
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    fontSize: '44px',
    lineHeight: 1.05,
    fontWeight: 900,
    color: '#0f172a',
  },
  subtitle: {
    maxWidth: '900px',
    margin: '18px 0 0 0',
    fontSize: '18px',
    lineHeight: 1.65,
    color: '#475569',
  },
  heroCard: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    borderRadius: '24px',
    padding: '28px',
    color: '#ffffff',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
  },
  heroCardLabel: {
    margin: 0,
    fontSize: '13px',
    color: '#bfdbfe',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  heroCardTitle: {
    margin: '12px 0',
    fontSize: '30px',
    fontWeight: 900,
  },
  heroCardText: {
    margin: 0,
    color: '#dbeafe',
    lineHeight: 1.6,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
  },
  kpiLabel: {
    margin: 0,
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  kpiValue: {
    margin: '10px 0 6px 0',
    color: '#0f172a',
    fontSize: '30px',
    fontWeight: 900,
  },
  kpiDescription: {
    margin: 0,
    color: '#64748b',
    lineHeight: 1.5,
  },
  section: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
    marginBottom: '28px',
  },
  sectionHeader: {
    marginBottom: '22px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.2,
    fontWeight: 900,
    color: '#0f172a',
  },
  sectionTitleLight: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.2,
    fontWeight: 900,
    color: '#ffffff',
  },
  sectionDescription: {
    margin: '10px 0 0 0',
    maxWidth: '900px',
    color: '#64748b',
    fontSize: '16px',
    lineHeight: 1.65,
  },
  timeline: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '18px',
  },
  phaseCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    padding: '20px',
    background: '#f8fafc',
  },
  phaseTop: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    marginBottom: '14px',
  },
  phaseNumber: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    flexShrink: 0,
  },
  phaseMeta: {
    margin: 0,
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  phaseTitle: {
    margin: '4px 0 0 0',
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: 900,
  },
  statusPill: {
    display: 'inline-flex',
    padding: '7px 10px',
    borderRadius: '999px',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '12px',
    fontWeight: 800,
    marginBottom: '12px',
  },
  phaseObjective: {
    margin: '0 0 14px 0',
    color: '#475569',
    lineHeight: 1.6,
  },
  deliverables: {
    display: 'grid',
    gap: '8px',
  },
  deliverableItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    color: '#334155',
    fontSize: '14px',
    lineHeight: 1.45,
  },
  check: {
    color: '#16a34a',
    fontWeight: 900,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '28px',
  },
  panel: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
  },
  panelDark: {
    background: 'linear-gradient(135deg, #111827 0%, #0f172a 55%, #1e3a8a 100%)',
    borderRadius: '24px',
    padding: '28px',
    color: '#ffffff',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
  },
  bodyText: {
    color: '#475569',
    lineHeight: 1.75,
    fontSize: '16px',
  },
  bodyTextLight: {
    color: '#dbeafe',
    lineHeight: 1.75,
    fontSize: '16px',
  },
  argumentList: {
    display: 'grid',
    gap: '12px',
    marginTop: '18px',
  },
  argumentItem: {
    background: '#f8fafc',
    borderRadius: '16px',
    padding: '14px',
    color: '#334155',
    lineHeight: 1.55,
  },
  nextActionBox: {
    marginTop: '22px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '20px',
    padding: '20px',
  },
  nextActionLabel: {
    margin: 0,
    color: '#bfdbfe',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  nextActionTitle: {
    margin: '8px 0',
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 900,
  },
  nextActionText: {
    margin: 0,
    color: '#dbeafe',
    lineHeight: 1.65,
  },
  riskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
  },
  riskCard: {
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    padding: '18px',
  },
  riskTitle: {
    margin: '0 0 10px 0',
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: 900,
  },
  riskText: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.6,
    fontSize: '14px',
  },
  finalBox: {
    borderRadius: '26px',
    padding: '30px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
    border: '1px solid #bfdbfe',
  },
  finalEyebrow: {
    margin: '0 0 8px 0',
    color: '#1d4ed8',
    fontWeight: 900,
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  finalTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '30px',
    lineHeight: 1.2,
    fontWeight: 900,
  },
  finalText: {
    margin: '14px 0 0 0',
    color: '#475569',
    lineHeight: 1.75,
    fontSize: '17px',
    maxWidth: '1100px',
  },
};

export default RaftopoulosRolloutRoadmapPage;