import React, { useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const SAMPLE_CSV = `patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code
P-000001,CPAP-000001,RS-DEVICE-000001,AirSense 10,2026-06-01,DR-001,ATHENS
P-000002,CPAP-000002,RS-DEVICE-000002,AirSense 11,2026-06-03,DR-002,PIRAEUS
P-000003,CPAP-000003,RS-DEVICE-000003,AirSense 10,2026-06-07,DR-001,ATHENS`;

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function validateRollout(csvText) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}/api/pilot20/production-rollout/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      csv_text: csvText,
      filename: "raftop_7000_rollout.csv"
    })
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Validation failed");
  }

  return json;
}

export default function Pilot20ProductionRolloutImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
  }

  async function runValidation() {
    setValidating(true);
    setError("");
    setResult(null);

    try {
      const json = await validateRollout(csvText);
      setResult(json.validation);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  const ready = result?.ready_for_rollout === true;

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>7,000 Patient Rollout Import Pack</h1>
          <p style={subtitleStyle}>
            Validate the production rollout CSV before any full import. This page does not create patients; it checks whether the file is safe and structurally ready.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/rolling-80h-report" style={primaryLinkStyle}>Rolling 80h Report</a>
          <a href="/pilot20/rescue-monitor" style={secondaryButtonStyle}>Rescue Monitor</a>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Production rule</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          Validate first. Never import 7,000 patients blindly.
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          The file must not contain names, phones, emails, AMKA, addresses or direct patient identifiers.
        </p>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Upload / paste rollout CSV</h2>

        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Required columns: patient_external_id, patient_code, device_serial, device_model,
          setup_date, doctor_external_id, branch_code.
        </p>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ marginBottom: 16 }} />

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={12}
          style={textareaStyle}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={runValidation} disabled={validating} style={primaryButtonStyle}>
            {validating ? "Validating..." : "Validate rollout file"}
          </button>
          <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} style={secondaryButtonStyle}>
            Reset sample
          </button>
        </div>
      </section>

      {result && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Validation result</h2>

          <div style={ready ? successStyle : warningStyle}>
            {ready
              ? "READY FOR CONTROLLED ROLLOUT IMPORT"
              : "NOT READY β€” FIX BLOCKERS BEFORE IMPORT"}
          </div>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={result.total_rows ?? 0} />
            <MetricCard label="Valid rows" value={result.valid_rows ?? 0} />
            <MetricCard label="Warning rows" value={result.warning_rows ?? 0} />
            <MetricCard label="Error rows" value={result.error_rows ?? 0} />
          </div>

          <div style={twoColumnStyle}>
            <div style={smallPanelStyle}>
              <h3 style={{ marginTop: 0 }}>Blockers</h3>
              {(result.hard_blockers || []).length === 0 ? (
                <p>No hard blockers.</p>
              ) : (
                <ul>
                  {(result.hard_blockers || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>

            <div style={smallPanelStyle}>
              <h3 style={{ marginTop: 0 }}>Forbidden headers</h3>
              {(result.forbidden_headers || []).length === 0 ? (
                <p>No forbidden headers detected.</p>
              ) : (
                <ul>
                  {(result.forbidden_headers || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>

          <h3>Row preview</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Patient", "Code", "Device Serial", "Setup Date", "Issues", "Warnings"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result.rows || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" style={tdStyle}>No rows returned.</td>
                  </tr>
                ) : (
                  (result.rows || []).map((row) => (
                    <tr key={row.line}>
                      <td style={tdStyle}>{row.line}</td>
                      <td style={tdStyle}><strong>{row.status}</strong></td>
                      <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                      <td style={tdStyle}>{row.patient_code || "-"}</td>
                      <td style={tdStyle}>{row.device_serial || "-"}</td>
                      <td style={tdStyle}>{row.setup_date || "-"}</td>
                      <td style={tdStyle}>{(row.issues || []).join(", ") || "-"}</td>
                      <td style={tdStyle}>{(row.warnings || []).join(", ") || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={metricStyle}>{value}</div>
    </div>
  );
}

const pageStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483000,
  overflowY: "auto",
  background: "#f8fafc",
  padding: 24,
  boxSizing: "border-box",
  fontFamily: '"Segoe UI", "Noto Sans", "Roboto", "Arial", sans-serif'
};

const headerStyle = {
  maxWidth: 1280,
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start"
};

const eyebrowStyle = { margin: 0, color: "#64748b", fontWeight: 900 };
const titleStyle = { margin: "4px 0 8px", color: "#0f172a" };
const subtitleStyle = { margin: 0, color: "#475569", lineHeight: 1.6, maxWidth: 760 };

const headlineStyle = {
  maxWidth: 1280,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const smallPanelStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginTop: 16
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginTop: 16
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16
};

const labelStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.4
};

const metricStyle = {
  marginTop: 8,
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a"
};

const textareaStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: 12,
  fontFamily: "Consolas, monospace",
  fontSize: 13,
  boxSizing: "border-box"
};

const primaryButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const primaryLinkStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none"
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer"
};

const successStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #bbf7d0",
  padding: 12,
  borderRadius: 12,
  fontWeight: 900
};

const warningStyle = {
  background: "#fef3c7",
  color: "#92400e",
  border: "1px solid #fde68a",
  padding: 12,
  borderRadius: 12,
  fontWeight: 900
};

const errorStyle = {
  maxWidth: 1280,
  margin: "0 auto 16px",
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 13,
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  whiteSpace: "nowrap"
};
