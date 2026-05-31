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

export default function BuyerReportsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro Β· Executive Reporting</div>
        <h1 style={styles.title}>Reports & Management Visibility</h1>
        <p style={styles.subtitle}>
          Buyer-ready reporting route for monthly executive summaries, ATLAS action
          performance, Quality & Profit interpretation, unresolved defects and rollout decisions.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Monthly Executive Report</h2>
            <p style={styles.text}>Summarizes patient risk, no-data, compliance, leak issues, ATLAS performance and decisions needed.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ATLAS Action Summary</h2>
            <p style={styles.text}>Shows created, open, closed, blocked and escalated actions so management sees operational discipline.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quality & Profit Trends</h2>
            <p style={styles.text}>Connects operational defects to management impact without overpromising unsupported ROI.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Rollout Decision Support</h2>
            <p style={styles.text}>Turns pilot and monthly results into annual license, extension, add-on or expansion decisions.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Report Type</th>
              <th style={styles.th}>Frequency</th>
              <th style={styles.th}>Decision Supported</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Weekly Pilot Review</td>
              <td style={styles.td}>Weekly</td>
              <td style={styles.td}>Action closure and course correction</td>
            </tr>
            <tr>
              <td style={styles.td}>Monthly Executive Report</td>
              <td style={styles.td}>Monthly</td>
              <td style={styles.td}>Management priorities</td>
            </tr>
            <tr>
              <td style={styles.td}>Final Pilot Report</td>
              <td style={styles.td}>End of pilot</td>
              <td style={styles.td}>Annual license / extended pilot / stop</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
