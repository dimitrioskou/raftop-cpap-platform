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

export default function BuyerSettingsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro Β· Enterprise Settings</div>
        <h1 style={styles.title}>Settings & Tenant Control Center</h1>
        <p style={styles.subtitle}>
          Buyer-ready settings surface for tenant configuration, roles, modules, branding,
          integrations, access state and operational governance. This page exists to make
          the enterprise settings capability visible and navigable during buyer review.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Tenant Configuration</h2>
            <p style={styles.text}>Tenant identity, active modules, commercial mode, operational limits and buyer-facing configuration readiness.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Roles & Access</h2>
            <p style={styles.text}>Admin, staff, viewer, doctor and super-admin access boundaries for controlled enterprise rollout.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Branding & Presentation</h2>
            <p style={styles.text}>Buyer/client-facing branding, commercial demo positioning and future white-label readiness.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Operational Governance</h2>
            <p style={styles.text}>Monthly reviews, change request control, security boundaries and rollout discipline.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Control Area</th>
              <th style={styles.th}>Buyer Meaning</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Tenant Context</td>
              <td style={styles.td}>Separates customer environment and commercial scope.</td>
              <td style={styles.td}>Buyer-ready route</td>
            </tr>
            <tr>
              <td style={styles.td}>Module Gating</td>
              <td style={styles.td}>Supports staged rollout and paid add-ons.</td>
              <td style={styles.td}>Governance-ready</td>
            </tr>
            <tr>
              <td style={styles.td}>Access Policy</td>
              <td style={styles.td}>Prevents uncontrolled operational use.</td>
              <td style={styles.td}>Controlled pilot boundary</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
