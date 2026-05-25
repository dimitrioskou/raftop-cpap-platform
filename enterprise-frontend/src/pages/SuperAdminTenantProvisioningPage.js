// enterprise-frontend/src/pages/SuperAdminTenantProvisioningPage.js
// RAFTOP CPAP CARE Pro
// Safe Super Admin Tenant Provisioning Page
// Purpose: prevents production build failure when App.js imports ./pages/SuperAdminTenantProvisioningPage

import React, { useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://raftop-cpap-backend.onrender.com";

function getAuthToken() {
  try {
    return (
      localStorage.getItem("raftop_auth_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token") ||
      ""
    );
  } catch (err) {
    return "";
  }
}

export default function SuperAdminTenantProvisioningPage() {
  const [tenantId, setTenantId] = useState("raftopoulos-live");
  const [tenantName, setTenantName] = useState("Raftopoulos CPAP Pilot");
  const [plan, setPlan] = useState("enterprise");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function runPreview() {
    setStatus("loading");
    setMessage("");

    const token = getAuthToken();

    if (!token) {
      setStatus("error");
      setMessage("No auth token found. Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/super-admin/tenant-provisioning/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-tenant-id": tenantId
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            tenant_name: tenantName,
            plan,
            status: "active"
          })
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Preview failed with HTTP ${response.status}`
        );
      }

      setStatus("success");
      setMessage(JSON.stringify(payload, null, 2));
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "Tenant provisioning preview failed.");
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>Super Admin</div>
          <h1 style={styles.title}>Tenant Provisioning</h1>
          <p style={styles.subtitle}>
            Safe tenant provisioning control page. Production writes should be
            handled through controlled bootstrap workflows and verification
            reports. This page is safe for preview and operational planning.
          </p>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Mode</div>
          <div style={styles.statusValue}>Safe Preview</div>
          <div style={styles.statusSubtext}>No direct production write required</div>
        </div>
      </header>

      <section style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Provisioning Preview</div>
          <h2 style={styles.sectionTitle}>Tenant Details</h2>

          <label style={styles.label}>Tenant ID</label>
          <input
            style={styles.input}
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
          />

          <label style={styles.label}>Tenant Name</label>
          <input
            style={styles.input}
            value={tenantName}
            onChange={(event) => setTenantName(event.target.value)}
          />

          <label style={styles.label}>Plan</label>
          <select
            style={styles.input}
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          >
            <option value="trial">trial</option>
            <option value="professional">professional</option>
            <option value="enterprise">enterprise</option>
          </select>

          <button style={styles.button} type="button" onClick={runPreview}>
            {status === "loading" ? "Running preview..." : "Run Safe Preview"}
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Result</div>
          <h2 style={styles.sectionTitle}>Provisioning Response</h2>

          {status === "idle" ? (
            <p style={styles.text}>
              Run a preview to verify that the backend route is reachable and
              returns a safe provisioning plan.
            </p>
          ) : null}

          {status === "error" ? (
            <pre style={styles.errorBox}>{message}</pre>
          ) : null}

          {status === "success" ? (
            <pre style={styles.resultBox}>{message}</pre>
          ) : null}

          {status === "loading" ? (
            <p style={styles.text}>Contacting protected backend route...</p>
          ) : null}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionLabel}>Operating Rule</div>
        <h2 style={styles.sectionTitle}>No Blind Tenant Creation</h2>
        <p style={styles.text}>
          New production tenants should only be created through controlled
          bootstrap scripts, schema verification, admin-user verification and
          post-create route audit. This prevents partial tenants, missing users,
          broken subscriptions and unsafe access.
        </p>
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
      "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 34%), linear-gradient(135deg, #07111f 0%, #0f172a 56%, #0f766e 140%)"
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
    fontSize: "44px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
    fontWeight: 950
  },
  subtitle: {
    margin: 0,
    maxWidth: "850px",
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
    fontSize: "26px",
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
    gridTemplateColumns: "0.9fr 1.1fr",
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
    margin: "8px 0 18px",
    fontSize: "25px",
    letterSpacing: "-0.03em",
    fontWeight: 950
  },
  label: {
    display: "block",
    margin: "14px 0 7px",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  },
  input: {
    width: "100%",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: 800,
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#0f172a"
  },
  button: {
    width: "100%",
    height: "50px",
    marginTop: "20px",
    border: 0,
    borderRadius: "16px",
    background: "#0f766e",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer"
  },
  text: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
    fontWeight: 750
  },
  resultBox: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#ecfdf5",
    color: "#064e3b",
    border: "1px solid #a7f3d0",
    borderRadius: "16px",
    padding: "14px",
    maxHeight: "520px",
    overflow: "auto",
    fontSize: "12px",
    fontWeight: 750
  },
  errorBox: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "12px",
    fontWeight: 800
  }
};