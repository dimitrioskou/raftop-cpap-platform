// enterprise-frontend/src/pages/RaftopoulosExecutiveDemoScriptPage.js
// RAFTOP CPAP CARE Pro
// Safe executive demo script page
// Purpose: prevents production build failure when App.js imports ./pages/RaftopoulosExecutiveDemoScriptPage

import React from "react";

export default function RaftopoulosExecutiveDemoScriptPage() {
  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.kicker}>RAFTOP CPAP CARE Pro</div>
          <h1 style={styles.title}>Raftopoulos Executive Demo Script</h1>
          <p style={styles.subtitle}>
            Δομημένο executive script για παρουσίαση της πλατφόρμας στη
            Raftopoulos: πρόβλημα, λύση, ATLAS operations, CPAP compliance,
            pilot demo και εμπορικό κλείσιμο.
          </p>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Demo Status</div>
          <div style={styles.statusValue}>Ready for Pilot Story</div>
          <div style={styles.statusSubtext}>Use with Phase 42 pilot demo data</div>
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.sectionLabel}>Opening</div>
          <h2 style={styles.sectionTitle}>1. Το επιχειρησιακό πρόβλημα</h2>
          <p style={styles.text}>
            “Σήμερα η CPAP παρακολούθηση δεν είναι μόνο θέμα συσκευής. Είναι θέμα
            καθημερινής λειτουργίας: ποιος ασθενής κινδυνεύει, ποιος χρειάζεται
            follow-up, ποιος χάνει compliance, ποιος έχει leak ή no data και ποια
            ενέργεια πρέπει να γίνει σήμερα.”
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>Positioning</div>
          <h2 style={styles.sectionTitle}>2. Τι κάνει το RAFTOP</h2>
          <p style={styles.text}>
            “Το RAFTOP CPAP CARE Pro μετατρέπει τα CPAP δεδομένα σε λειτουργικό
            σύστημα ελέγχου. Δεν είναι απλό dashboard. Είναι control center για
            compliance, alerts, tasks, ATLAS action groups και παρακολούθηση
            ασθενών ανά tenant.”
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>ATLAS</div>
          <h2 style={styles.sectionTitle}>3. Το ATLAS System</h2>
          <p style={styles.text}>
            “Το ATLAS βγάζει από τη λίστα τους ασθενείς που δεν χρειάζονται
            παρέμβαση και ανεβάζει στην κορυφή αυτούς που χρειάζονται δράση:
            compliance risk, no data, therapy issue, new setup, doctor review.”
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>Pilot Demo</div>
          <h2 style={styles.sectionTitle}>4. Το pilot dataset</h2>
          <p style={styles.text}>
            “Στο pilot demo βλέπουμε 8 demo ασθενείς, 8 CPAP συσκευές, 56
            compliance nights, 7 ATLAS tasks και notes. Τα δεδομένα είναι
            απομονωμένα σε pilot tables και δεν ακουμπάνε production ασθενείς.”
          </p>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>Business Case</div>
          <h2 style={styles.sectionTitle}>5. Γιατί αξίζει στη Raftopoulos</h2>
          <ul style={styles.list}>
            <li>Καλύτερος έλεγχος των ασθενών CPAP.</li>
            <li>Μείωση χαμένων follow-ups.</li>
            <li>Προτεραιοποίηση περιστατικών υψηλού κινδύνου.</li>
            <li>Πιο οργανωμένη εμπορική και κλινική εξυπηρέτηση.</li>
            <li>Βάση για μεταπώληση σε ιατρούς και ιατρεία.</li>
          </ul>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>Close</div>
          <h2 style={styles.sectionTitle}>6. Κλείσιμο παρουσίασης</h2>
          <p style={styles.text}>
            “Η πρόταση δεν είναι να αγοράσετε ένα ακόμα software. Η πρόταση είναι
            να αποκτήσετε ένα operational layer πάνω από το CPAP business σας:
            follow-up, compliance, task control, patient risk και εμπορική
            επεκτασιμότητα.”
          </p>
        </section>
      </div>

      <div style={styles.footerCard}>
        <strong>Next demo route:</strong>{" "}
        <span>/sales/raftopoulos/pilot-demo</span>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "34px",
    boxSizing: "border-box",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,0.20), transparent 30%), linear-gradient(135deg, #07111f 0%, #0f172a 58%, #0f766e 140%)"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: "22px",
    alignItems: "stretch",
    marginBottom: "22px"
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
    color: "#ffffff",
    fontSize: "44px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    fontWeight: 950
  },
  subtitle: {
    margin: 0,
    maxWidth: "820px",
    color: "#cbd5e1",
    fontSize: "16px",
    lineHeight: 1.55,
    fontWeight: 700
  },
  statusCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
  },
  statusLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: 900,
    letterSpacing: "0.12em"
  },
  statusValue: {
    marginTop: "8px",
    fontSize: "22px",
    fontWeight: 950
  },
  statusSubtext: {
    marginTop: "8px",
    color: "#047857",
    fontSize: "13px",
    fontWeight: 850
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px"
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 55px rgba(0,0,0,0.18)"
  },
  sectionLabel: {
    color: "#0f766e",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.13em"
  },
  sectionTitle: {
    margin: "8px 0 12px",
    fontSize: "24px",
    letterSpacing: "-0.03em",
    fontWeight: 950
  },
  text: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: 700
  },
  list: {
    margin: "0",
    paddingLeft: "20px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
    fontWeight: 750
  },
  footerCard: {
    marginTop: "18px",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "20px",
    padding: "18px 22px",
    color: "#0f172a",
    fontWeight: 800
  }
};