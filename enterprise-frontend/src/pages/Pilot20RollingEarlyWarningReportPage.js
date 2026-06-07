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

export default function Pilot20RollingEarlyWarningReportPage() {
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/rolling-80h-early-warning");
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
  const rows = data.rows || [];

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Live Rolling 80h Early Warning</h1>
          <p style={subtitleStyle}>
            Each patient is evaluated inside their own 30-day 80h compliance window. The goal is to identify risk early, not at the end of a calendar month.
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
      {loading && <div style={infoStyle}>Loading rolling 80h early warning...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Live conclusion</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          {data.conclusion || "No conclusion yet."}
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          Logic: individual rolling 30-day window per patient, based on setup date or AirView period start.
        </p>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total Patients" value={summary.total_patients ?? 0} />
        <MetricCard label="Already 80h" value={summary.already_80h ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
        <MetricCard label="Urgent Risk" value={summary.urgent ?? 0} />
        <MetricCard label="WATCH" value={summary.watch ?? 0} />
        <MetricCard label="RESCUE" value={summary.rescue ?? 0} />
        <MetricCard label="CRITICAL" value={summary.critical ?? 0} />
        <MetricCard label="Urgent Rate" value={`${summary.urgent_risk_rate ?? 0}%`} />
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Patient rescue queue</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Sorted by risk. These are the patients Raftopoulos should review before their own 80h window closes.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Risk",
                  "Patient",
                  "Device",
                  "Window",
                  "Days Left",
                  "Current",
                  "Expected",
                  "Missing",
                  "Needed / Day",
                  "Projected",
                  "AHI",
                  "Leak",
                  "Next Action"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="13" style={tdStyle}>No patient rows available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}><RiskBadge risk={row.risk_level} /></td>
                    <td style={tdStyle}>
                      <strong>{row.patient_code || row.patient_external_id}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.patient_external_id}</div>
                    </td>
                    <td style={tdStyle}>
                      {row.device_serial || "-"}
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.device_model || ""}</div>
                    </td>
                    <td style={tdStyle}>
                      {row.period_start || "-"} β†’ {row.period_end || "-"}
                    </td>
                    <td style={tdStyle}><strong>{row.days_remaining}</strong></td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.expected_hours_today)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}><strong>{round(row.required_daily_hours)}h/day</strong></td>
                    <td style={tdStyle}>{round(row.projected_end_window_hours)}h</td>
                    <td style={tdStyle}>{round(row.ahi_avg_30d)}</td>
                    <td style={tdStyle}>{round(row.leak_avg_30d)}</td>
                    <td style={tdStyle}>{row.atlas_action || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Why this matters</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Patients do not all start on the first day of the month.</li>
          <li>Each patient has their own 30-day 80h compliance window.</li>
          <li>The platform calculates remaining hours and required hours per day.</li>
          <li>Raftopoulos sees who needs action early, before the window closes.</li>
          <li>This is the operational rescue list, not a late monthly autopsy.</li>
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
  maxWidth: 1280,
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
  maxWidth: 1280,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const cardsGridStyle = {
  maxWidth: 1280,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  maxWidth: 1280,
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
  fontSize: 13,
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  whiteSpace: "nowrap"
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

const infoStyle = {
  maxWidth: 1280,
  margin: "0 auto 16px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};
