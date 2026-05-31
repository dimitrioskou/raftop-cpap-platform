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

export default function BuyerCompliancePage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro Β· Compliance Operations</div>
        <h1 style={styles.title}>CPAP Compliance & Risk Control</h1>
        <p style={styles.subtitle}>
          Buyer-ready compliance surface for usage visibility, no-data detection,
          compliance risk, leak / therapy issue visibility and ATLAS follow-up linkage.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Usage Visibility</h2>
            <p style={styles.text}>Shows whether patients are using CPAP consistently enough to remain operationally safe and commercially protected.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>No-Data Detection</h2>
            <p style={styles.text}>Turns missing data into visible operational blind spots that can trigger connectivity or patient follow-up.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Compliance Risk</h2>
            <p style={styles.text}>Prioritizes patients with low or declining usage so the team can act before the case deteriorates.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Leak / Therapy Signals</h2>
            <p style={styles.text}>Surfaces likely mask, comfort or therapy issues that can affect patient experience and adherence.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Signal</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Management Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>No Data</td>
              <td style={styles.td}>Connectivity check / patient call</td>
              <td style={styles.td}>Reduces blind spots</td>
            </tr>
            <tr>
              <td style={styles.td}>Low Usage</td>
              <td style={styles.td}>Compliance follow-up</td>
              <td style={styles.td}>Protects adherence and renewal value</td>
            </tr>
            <tr>
              <td style={styles.td}>High Leak</td>
              <td style={styles.td}>Mask check / technical review</td>
              <td style={styles.td}>Improves quality of service</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
