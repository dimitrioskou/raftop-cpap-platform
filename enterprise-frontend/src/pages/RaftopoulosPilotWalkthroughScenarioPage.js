// enterprise-frontend/src/pages/RaftopoulosPilotWalkthroughScenarioPage.js
// RAFTOP CPAP CARE Pro
// Safe pilot walkthrough scenario page
// Purpose: prevents production build failure when App.js imports ./pages/RaftopoulosPilotWalkthroughScenarioPage

import React from "react";

const steps = [
  {
    label: "Step 1",
    title: "Ξεκινάμε από το Executive Problem",
    body:
      "Η Raftopoulos έχει μεγάλο αριθμό CPAP ασθενών. Το πραγματικό πρόβλημα δεν είναι μόνο η πώληση ή η παράδοση συσκευής, αλλά η συνεχής παρακολούθηση: compliance, no data, leak, usage risk, follow-up και εμπορικός έλεγχος."
  },
  {
    label: "Step 2",
    title: "Δείχνουμε το Production Login",
    body:
      "Ο χρήστης μπαίνει σε protected production περιβάλλον. Το frontend δεν ανοίγει dashboard χωρίς login και τα backend APIs δεν επιστρέφουν protected data χωρίς token."
  },
  {
    label: "Step 3",
    title: "Μπαίνουμε στο Pilot Demo Dashboard",
    body:
      "Ανοίγουμε τη διαδρομή /sales/raftopoulos/pilot-demo. Εκεί παρουσιάζουμε isolated pilot dataset με 8 demo ασθενείς, 8 CPAP devices, 56 compliance nights, 7 ATLAS tasks και 5 notes."
  },
  {
    label: "Step 4",
    title: "Αναδεικνύουμε το ATLAS System",
    body:
      "Το ATLAS μετατρέπει τα δεδομένα σε action queue: compliance risk, no data, therapy issue, new setup, doctor review και high-value stable ασθενείς. Το μήνυμα είναι ότι η πλατφόρμα λέει ποιος χρειάζεται δράση σήμερα."
  },
  {
    label: "Step 5",
    title: "Δείχνουμε Patient-Level Story",
    body:
      "Επιλέγουμε συγκεκριμένο demo patient, π.χ. PILOT-003 No Data ή PILOT-004 Leak Issue. Δείχνουμε κλινικό summary, compliance nights, ATLAS task και operational next step."
  },
  {
    label: "Step 6",
    title: "Συνδέουμε το Demo με το Business Case",
    body:
      "Η πλατφόρμα δεν πουλιέται ως απλό software. Πουλιέται ως operational CPAP control layer που μειώνει χαμένα follow-ups, βελτιώνει compliance και δίνει δυνατότητα μεταπώλησης σε ιατρούς/ιατρεία."
  },
  {
    label: "Step 7",
    title: "Κλείσιμο με Pilot Proposal",
    body:
      "Προτείνεται πιλοτική χρήση με συγκεκριμένο tenant, συγκεκριμένο αριθμό ασθενών, εβδομαδιαία αναφορά, ATLAS task review και απόφαση εμπορικής επέκτασης μετά το pilot."
  }
];

const proofPoints = [
  "Frontend auth gate: verified",
  "Backend protected routes: verified",
  "Admin login E2E: verified with warnings",
  "Pilot demo DB schema: applied",
  "Pilot demo data: verified",
  "Pilot demo API routes: verified",
  "Next: frontend pilot demo page verification"
];

export default function RaftopoulosPilotWalkthroughScenarioPage() {
  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>RAFTOP CPAP CARE Pro</div>
          <h1 style={styles.title}>Raftopoulos Pilot Walkthrough Scenario</h1>
          <p style={styles.subtitle}>
            Πρακτικό σενάριο παρουσίασης για να δείξεις στη Raftopoulos την αξία
            του RAFTOP ως CPAP operations platform: από το πρόβλημα, στο live
            protected demo, στο ATLAS action system και στο εμπορικό pilot.
          </p>
        </div>

        <div style={styles.heroCard}>
          <div style={styles.cardLabel}>Pilot Route</div>
          <div style={styles.route}>/sales/raftopoulos/pilot-demo</div>
          <div style={styles.cardSubtext}>Use after secure login</div>
        </div>
      </header>

      <section style={styles.grid}>
        <div style={styles.mainCard}>
          <div style={styles.sectionLabel}>Walkthrough</div>
          <h2 style={styles.sectionTitle}>Πώς το παρουσιάζεις βήμα-βήμα</h2>

          <div style={styles.timeline}>
            {steps.map((step, index) => (
              <div key={step.label} style={styles.step}>
                <div style={styles.stepIndex}>{index + 1}</div>
                <div>
                  <div style={styles.stepLabel}>{step.label}</div>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepBody}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={styles.sideColumn}>
          <div style={styles.sideCard}>
            <div style={styles.sectionLabel}>Proof Points</div>
            <h2 style={styles.sideTitle}>Τι έχει ήδη περάσει</h2>

            <div style={styles.proofList}>
              {proofPoints.map((item) => (
                <div key={item} style={styles.proofItem}>
                  <span style={styles.check}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sectionLabel}>Core Message</div>
            <h2 style={styles.sideTitle}>Το μήνυμα πώλησης</h2>
            <p style={styles.sideText}>
              “Δεν αγοράζετε απλώς ένα dashboard. Αποκτάτε ένα operational
              control layer για CPAP ασθενείς, compliance, ATLAS tasks,
              follow-up και εμπορική επεκτασιμότητα προς ιατρούς.”
            </p>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sectionLabel}>Next Action</div>
            <h2 style={styles.sideTitle}>Επόμενο demo βήμα</h2>
            <p style={styles.sideText}>
              Άνοιξε το Pilot Demo Dashboard, επίλεξε έναν ασθενή υψηλού ρίσκου
              και δείξε πώς το ATLAS μετατρέπει τα δεδομένα σε συγκεκριμένη
              ενέργεια.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "34px",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, sans-serif",
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 34%), linear-gradient(135deg, #07111f 0%, #0f172a 56%, #0f766e 140%)",
    color: "#ffffff"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "24px",
    alignItems: "stretch",
    marginBottom: "24px"
  },
  kicker: {
    color: "#5eead4",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.16em"
  },
  title: {
    margin: "10px 0 12px",
    fontSize: "44px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    fontWeight: 950
  },
  subtitle: {
    margin: 0,
    maxWidth: "880px",
    color: "#cbd5e1",
    fontSize: "16px",
    lineHeight: 1.55,
    fontWeight: 700
  },
  heroCard: {
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.26)"
  },
  cardLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: 900,
    letterSpacing: "0.12em"
  },
  route: {
    marginTop: "10px",
    fontSize: "20px",
    fontWeight: 950,
    color: "#0f766e",
    wordBreak: "break-word"
  },
  cardSubtext: {
    marginTop: "12px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 800
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 380px",
    gap: "22px",
    alignItems: "start"
  },
  mainCard: {
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.22)"
  },
  sectionLabel: {
    color: "#0f766e",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.13em"
  },
  sectionTitle: {
    margin: "8px 0 22px",
    fontSize: "28px",
    letterSpacing: "-0.04em",
    fontWeight: 950
  },
  timeline: {
    display: "grid",
    gap: "14px"
  },
  step: {
    display: "grid",
    gridTemplateColumns: "46px minmax(0, 1fr)",
    gap: "14px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    background: "#f8fafc"
  },
  stepIndex: {
    width: "38px",
    height: "38px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 950
  },
  stepLabel: {
    color: "#0f766e",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: 950,
    letterSpacing: "0.1em"
  },
  stepTitle: {
    margin: "4px 0 8px",
    fontSize: "18px",
    fontWeight: 950,
    letterSpacing: "-0.02em"
  },
  stepBody: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 700
  },
  sideColumn: {
    display: "grid",
    gap: "16px"
  },
  sideCard: {
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 55px rgba(0,0,0,0.18)"
  },
  sideTitle: {
    margin: "8px 0 14px",
    fontSize: "22px",
    fontWeight: 950,
    letterSpacing: "-0.03em"
  },
  sideText: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 750,
    margin: 0
  },
  proofList: {
    display: "grid",
    gap: "9px"
  },
  proofItem: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 850
  },
  check: {
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    flexShrink: 0
  }
};