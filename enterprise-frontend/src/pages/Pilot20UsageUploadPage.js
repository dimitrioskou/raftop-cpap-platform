import React, { useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const SAMPLE_CSV = `device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d
DEVICE-001,2026-06-01,2026-06-10,24,24,8,7.2,18
DEVICE-002,2026-06-01,2026-06-10,61,61,10,3.8,12
DEVICE-003,2026-06-01,2026-06-10,14,14,4,12.4,31`;

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function postUsageCsv(csvText) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}/api/pilot20/usage-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ csv_text: csvText })
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Upload failed");
  }

  return json;
}

export default function Pilot20UsageUploadPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const summary = result?.report || null;

  const commercialText = useMemo(() => {
    if (!summary) return "Upload a usage CSV to update CPAP progress automatically.";
    if ((summary.updated || 0) === 0) return "No matching devices were updated. Check device serials.";
    return "Usage data updated. Open Rescue Monitor to see who is at risk before month end.";
  }, [summary]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
  }

  async function uploadCsv() {
    setUploading(true);
    setError("");
    setResult(null);

    try {
      const json = await postUsageCsv(csvText);
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>AirView / CPAP Usage Update</h1>
          <p style={subtitleStyle}>
            Enter Pilot 20 patients once. Then upload usage CSV exports to automatically update compliance, ATLAS and the 80h Rescue Monitor.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
        </div>
      </header>

      <section style={headlineStyle}>
        <div style={labelStyle}>Automation model</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
          {commercialText}
        </div>
      </section>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Upload usage CSV</h2>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Accepted formats: standard Pilot20 CSV or AirView-style export. Required matching key: device serial. Standard columns: device_serial, month_start, last_data_date, month_usage_hours,
          usage_hours_30d, days_used_30d, ahi_avg_30d, leak_avg_30d.
        </p>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ marginBottom: 16 }} />

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={12}
          style={textareaStyle}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="button" onClick={uploadCsv} disabled={uploading} style={primaryButtonStyle}>
            {uploading ? "Processing..." : "Process usage CSV"}
          </button>

          <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} style={secondaryButtonStyle}>
            Reset sample
          </button>
        </div>
      </section>

      {summary && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Import report</h2>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={summary.total_rows ?? 0} />
            <MetricCard label="Updated" value={summary.updated ?? 0} />
            <MetricCard label="Skipped" value={summary.skipped ?? 0} />
            <MetricCard label="Errors" value={summary.errors ?? 0} />
          </div>

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Device", "Patient", "Reason", "Hours", "80h"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary.rows || []).map((row, index) => (
                  <tr key={`${row.line}-${index}`}>
                    <td style={tdStyle}>{row.line}</td>
                    <td style={tdStyle}><strong>{row.status}</strong></td>
                    <td style={tdStyle}>{row.device_serial || "-"}</td>
                    <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                    <td style={tdStyle}>{row.reason || "-"}</td>
                    <td style={tdStyle}>{row.month_usage_hours ?? "-"}</td>
                    <td style={tdStyle}>{row.is_80h_compliant === true ? "YES" : row.is_80h_compliant === false ? "NO" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Buyer workflow</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Enter the 20 pilot patients once in Patient Entry.</li>
          <li>Export or prepare a CPAP usage CSV every few days.</li>
          <li>Upload the CSV here.</li>
          <li>The platform maps AirView-style columns automatically and updates usage by device serial.</li>
          <li>Open Rescue Monitor to see who may miss 80 hours before month end.</li>
        </ol>
      </section>
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
  maxWidth: 1180,
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start"
};

const eyebrowStyle = {
  margin: 0,
  color: "#64748b",
  fontWeight: 900
};

const titleStyle = {
  margin: "4px 0 8px",
  color: "#0f172a"
};

const subtitleStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
  maxWidth: 760
};

const headlineStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
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

const errorStyle = {
  maxWidth: 1180,
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
  fontSize: 13
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top"
};

