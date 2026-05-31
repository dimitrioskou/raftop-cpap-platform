import React from "react";

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(135deg, #07111f 0%, #10233f 45%, #172a4a 100%)",
    color: "#f8fafc",
    fontFamily: "Inter, Arial, sans-serif"
  },
  shell: {
    maxWidth: "1180px",
    margin: "0 auto"
  },
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(56, 189, 248, 0.14)",
    border: "1px solid rgba(125, 211, 252, 0.25)",
    color: "#bae6fd",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "16px"
  },
  title: {
    fontSize: "34px",
    lineHeight: 1.1,
    margin: "0 0 12px 0"
  },
  subtitle: {
    fontSize: "17px",
    lineHeight: 1.6,
    color: "#cbd5e1",
    maxWidth: "850px",
    marginBottom: "28px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)"
  },
  cardTitle: {
    fontSize: "18px",
    margin: "0 0 10px 0",
    color: "#ffffff"
  },
  text: {
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: "14px",
    margin: 0
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "22px",
    background: "rgba(15, 23, 42, 0.65)",
    borderRadius: "18px",
    overflow: "hidden"
  },
  th: {
    textAlign: "left",
    padding: "14px",
    color: "#bae6fd",
    borderBottom: "1px solid rgba(148,163,184,0.2)"
  },
  td: {
    padding: "14px",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(148,163,184,0.12)"
  }
};

export default function BuyerDoctorClinicPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro Β· Doctor / Clinic Expansion</div>
        <h1 style={styles.title}>Doctor & Clinic CPAP Reporting Module</h1>
        <p style={styles.subtitle}>
          Buyer-ready doctor / clinic expansion route for future resale of CPAP monitoring,
          patient summaries, compliance risk lists and co-branded reporting services.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Doctor Patient Summaries</h2>
            <p style={styles.text}>Gives physicians filtered visibility into stable patients, risk patients and follow-up needs.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Clinic Reporting</h2>
            <p style={styles.text}>Supports clinic-level CPAP monitoring summaries, risk grouping and periodic review.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Co-Branded Service</h2>
            <p style={styles.text}>Allows Raftopoulos to move from equipment supplier to CPAP monitoring service partner.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Recurring Revenue Path</h2>
            <p style={styles.text}>Creates future packages for basic reports, doctor dashboard access and clinic plans.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Package</th>
              <th style={styles.th}>Target</th>
              <th style={styles.th}>Indicative Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Basic CPAP Report</td>
              <td style={styles.td}>Individual doctor</td>
              <td style={styles.td}>Monthly patient status visibility</td>
            </tr>
            <tr>
              <td style={styles.td}>Doctor Dashboard</td>
              <td style={styles.td}>Active CPAP referrer</td>
              <td style={styles.td}>Risk lists and patient summaries</td>
            </tr>
            <tr>
              <td style={styles.td}>Clinic Plan</td>
              <td style={styles.td}>Larger clinic / group</td>
              <td style={styles.td}>Group-level reporting and reviews</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
