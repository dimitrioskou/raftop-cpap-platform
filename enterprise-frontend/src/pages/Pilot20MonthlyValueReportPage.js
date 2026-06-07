import React, { useEffect, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function apiFetch(path) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Request failed");
  }

  return json;
}

export default function Pilot20MonthlyValueReportPage() {
  const [data, setData] = useState({ summary: {}, import_summary: {}, top_risk_rows: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/monthly-value-report");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = data.summary || {};
  const importSummary = data.import_summary || {};
  const rows = data.top_risk_rows || [];

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Monthly 80h Commercial Value Report</h1>
          <p style={subtitleStyle}>
            Executive report showing how the platform protects CPAP 80-hour compliance before the month ends.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>
          <a href="/pilot20/unmatched-devices" style={secondaryButtonStyle}>Unmatched Devices</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <button type="button" onClick={loadData} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading monthly value report...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Commercial conclusion</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          {data.commercial_conclusion || "No conclusion yet."}
        </div>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total Patients" value={summary.total_patients ?? 0} />
        <MetricCard label="80h Compliant" value={summary.already_80h ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
        <MetricCard label="Compliance Rate" value={`${summary.compliance_rate ?? 0}%`} />
        <MetricCard label="Urgent Risk" value={summary.urgent ?? 0} />
        <MetricCard label="Urgent Risk Rate" value={`${summary.urgent_risk_rate ?? 0}%`} />
        <MetricCard label="High AHI" value={summary.high_ahi ?? 0} />
        <MetricCard label="High Leak" value={summary.high_leak ?? 0} />
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>80h risk distribution</h2>
          <RiskRow label="SAFE" value={summary.safe ?? 0} />
          <RiskRow label="ON TRACK" value={summary.on_track ?? 0} />
          <RiskRow label="WATCH" value={summary.watch ?? 0} />
          <RiskRow label="RESCUE" value={summary.rescue ?? 0} />
          <RiskRow label="CRITICAL" value={summary.critical ?? 0} />
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>AirView upload performance</h2>
          <MetricLine label="Upload batches" value={importSummary.upload_batches ?? 0} />
          <MetricLine label="Total import rows" value={importSummary.total_import_rows ?? 0} />
          <MetricLine label="Rows updated" value={importSummary.total_updated ?? 0} />
          <MetricLine label="Rows skipped" value={importSummary.total_skipped ?? 0} />
          <MetricLine label="Rows with errors" value={importSummary.total_errors ?? 0} />
          <MetricLine label="Last upload" value={formatDate(importSummary.last_upload_at)} />
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Top risk patients</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Highest priority patients to review before the end of the month.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Patient", "Device", "Current Hours", "Remaining", "Needed / Day", "Projected", "Risk", "Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={tdStyle}>No patient risk rows available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}>
                      <strong>{row.patient_code || row.patient_external_id}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.patient_external_id}</div>
                    </td>
                    <td style={tdStyle}>{row.device_serial || "-"}</td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}><strong>{round(row.required_daily_hours)}h/day</strong></td>
                    <td style={tdStyle}>{round(row.projected_end_month_hours)}h</td>
                    <td style={tdStyle}><RiskBadge risk={row.risk_level} /></td>
                    <td style={tdStyle}>{row.atlas_action || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How to use this with Raftopoulos</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Show how many patients are below 80h before month end.</li>
          <li>Show urgent risk: RESCUE + CRITICAL.</li>
          <li>Show that AirView uploads create measurable operational visibility.</li>
          <li>Use Top Risk Patients as the follow-up call list.</li>
          <li>Use this report as the commercial proof for full rollout.</li>
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

function RiskRow({ label, value }) {
  return (
    <div style={riskRowStyle}>
      <span style={{ fontWeight: 900 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetricLine({ label, value }) {
  return (
    <div style={riskRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskBadge({ risk }) {
  const styleMap = {
    SAFE: { background: "#dcfce7", color: "#166534" },
    ON_TRACK: { background: "#dbeafe", color: "#1d4ed8" },
    WATCH: { background: "#fef3c7", color: "#92400e" },
    RESCUE: { background: "#ffedd5", color: "#c2410c" },
    CRITICAL: { background: "#fee2e2", color: "#991b1b" }
  };

  const style = styleMap[risk] || styleMap.WATCH;

  return (
    <span style={{ ...style, padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
      {risk || "UNKNOWN"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function round(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return Math.round(n * 10) / 10;
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

const cardsGridStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
};

const twoColumnStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  maxWidth: 1180,
  marginLeft: "auto",
  marginRight: "auto"
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
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

const riskRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155"
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

const infoStyle = {
  maxWidth: 1180,
  margin: "0 auto 16px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};
