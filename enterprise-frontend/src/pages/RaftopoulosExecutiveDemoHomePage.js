// enterprise-frontend/src/pages/RaftopoulosExecutiveDemoHomePage.js
// RAFTOP CPAP CARE Pro
// Safe executive demo home page
// Purpose: prevents production build failure when App.js imports ./pages/RaftopoulosExecutiveDemoHomePage

import React from "react";

const routes = [
  {
    title: "Pilot Demo Dashboard",
    path: "/sales/raftopoulos/pilot-demo",
    description:
      "Live protected pilot dashboard με 8 demo patients, 8 devices, 56 compliance nights και 7 ATLAS tasks.",
    status: "Phase 42 Ready"
  },
  {
    title: "Executive Demo Script",
    path: "/sales/raftopoulos/executive-demo-script",
    description:
      "Δομημένο script παρουσίασης για πρόβλημα, λύση, ATLAS, compliance και εμπορικό κλείσιμο.",
    status: "Sales Narrative"
  },
  {
    title: "Pilot Walkthrough Scenario",
    path: "/sales/raftopoulos/pilot-walkthrough-scenario",
    description:
      "Βήμα-βήμα σενάριο για το πώς παρουσιάζεται το pilot demo στη Raftopoulos.",
    status: "Demo Flow"
  }
];

const proof = [
  "Frontend login gate active",
  "Backend protected routes verified",
  "Admin login E2E verified",
  "Pilot demo schema applied",
  "Pilot demo data verified",
  "Pilot demo API routes verified"
];

export default function RaftopoulosExecutiveDemoHomePage() {
  function goTo(path) {
    window.location.href = path;
  }

  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>RAFTOP CPAP CARE Pro</div>
          <h1 style={styles.title}>Raftopoulos Executive Demo Home</h1>
          <p style={styles.subtitle}>
            Κεντρική σελίδα παρουσίασης για τη Raftopoulos. Από εδώ ξεκινάς το
            executive story, το pilot walkthrough και το protected pilot demo
            dashboard.
          </p>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Production State</div>
          <div style={styles.statusValue}>Demo Ready</div>
          <div style={styles.statusSubtext}>Phase 42 pipeline active</div>
        </div>
      </header>

      <section style={styles.grid}>
        {routes.map((item) => (
          <button
            key={item.path}
            type="button"
            style={styles.routeCard}
            onClick={() => goTo(item.path)}
          >
            <div style={styles.routeStatus}>{item.status}</div>
            <h2 style={styles.routeTitle}>{item.title}</h2>
            <p style={styles.routeDescription}>{item.description}</p>
            <div style={styles.routePath}>{item.path}</div>
          </button>
        ))}
      </section>

      <section style={styles.mainGrid}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Commercial Message</div>
          <h2 style={styles.sectionTitle}>Τι πουλάς στη Raftopoulos</h2>
          <p style={styles.text}>
            Δεν πουλάς ένα απλό dashboard. Πουλάς ένα CPAP operations control
            layer: patient monitoring, compliance visibility, ATLAS action
            groups, follow-up prioritization και δυνατότητα μεταπώλησης σε
            ιατρούς/ιατρεία.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Proof Checklist</div>
          <h2 style={styles.sectionTitle}>Τι έχει ήδη περάσει</h2>

          <div style={styles.proofList}>
            {proof.map((item) => (
              <div key={item} style={styles.proofItem}>
                <span style={styles.check}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionLabel}>Recommended Demo Order</div>
        <h2 style={styles.sectionTitle}>Σειρά παρουσίασης</h2>

        <ol style={styles.list}>
          <li>Ξεκινάς με το πρόβλημα: μεγάλος όγκος CPAP ασθενών και χαμένα follow-ups.</li>
          <li>Δείχνεις ότι το production περιβάλλον είναι protected με login.</li>
          <li>Ανοίγεις το Pilot Demo Dashboard.</li>
          <li>Δείχνεις compliant, at-risk, no-data και leak issue ασθενείς.</li>
          <li>Περνάς στο ATLAS action queue και δείχνεις ποιος χρειάζεται δράση σήμερα.</li>
          <li>Κλείνεις με pilot proposal και εμπορική επέκταση.</li>
        </ol>
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
    color: "#ffffff",
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,0.24), transparent 34%), linear-gradient(135deg, #07111f 0%, #0f172a 56%, #0f766e 140%)"
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 340px",
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
    fontSize: "46px",
    lineHeight: 1.02,
    letterSpacing: "-0.045em",
    fontWeight: 950
  },
  subtitle: {
    margin: 0,
    maxWidth: "860px",
    color: "#cbd5e1",
    fontSize: "16px",
    lineHeight: 1.55,
    fontWeight: 700
  },
  statusCard: {
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.26)"
  },
  statusLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    fontWeight: 900,
    letterSpacing: "0.12em"
  },
  statusValue: {
    marginTop: "10px",
    fontSize: "28px",
    fontWeight: 950,
    color: "#0f766e"
  },
  statusSubtext: {
    marginTop: "8px",
    color: "#475569",
    fontWeight: 800
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "20px"
  },
  routeCard: {
    textAlign: "left",
    border: 0,
    cursor: "pointer",
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 22px 70px rgba(0,0,0,0.22)"
  },
  routeStatus: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  routeTitle: {
    margin: "14px 0 10px",
    fontSize: "23px",
    fontWeight: 950,
    letterSpacing: "-0.03em"
  },
  routeDescription: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 700
  },
  routePath: {
    marginTop: "16px",
    color: "#0f766e",
    fontSize: "13px",
    fontWeight: 950,
    wordBreak: "break-word"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "18px",
    marginBottom: "20px"
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "26px",
    padding: "24px",
    boxShadow: "0 22px 70px rgba(0,0,0,0.20)"
  },
  sectionLabel: {
    color: "#0f766e",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.13em"
  },
  sectionTitle: {
    margin: "8px 0 14px",
    fontSize: "25px",
    letterSpacing: "-0.03em",
    fontWeight: 950
  },
  text: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
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
    gap: "10px",
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
  },
  list: {
    margin: 0,
    paddingLeft: "22px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.8,
    fontWeight: 750
  }
};