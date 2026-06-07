import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const RISK_BADGE_STYLE = {
  SAFE: { background: "#dcfce7", color: "#166534" },
  ON_TRACK: { background: "#dbeafe", color: "#1d4ed8" },
  WATCH: { background: "#fef3c7", color: "#92400e" },
  RESCUE: { background: "#ffedd5", color: "#c2410c" },
  CRITICAL: { background: "#fee2e2", color: "#991b1b" }
};

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

function round(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return Math.round(n * 10) / 10;
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

export default function Pilot20ComplianceRescueMonitorPage() {
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/rescue-monitor");
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

  const rows = data.rows || [];
  const summary = data.summary || {};

  const commercialHeadline = useMemo(() => {
    if ((summary.critical || 0) > 0) {
      return "Critical patients need immediate rescue action.";
    }
    if ((summary.rescue || 0) > 0) {
      return "Some patients are still recoverable if contacted now.";
    }
    if ((summary.watch || 0) > 0) {
      return "Some patients need monitoring before month end.";
    }
    return "Pilot patients are currently under control.";
  }, [summary]);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>80h Compliance Pace & Rescue Monitor</h1>
          <p style={subtitleStyle}>
            See which CPAP patients are safe, on track, at risk, or need urgent intervention before the month ends.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload Usage CSV</a>
          <button onClick={loadData} style={primaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading rescue monitor...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Commercial signal</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
          {commercialHeadline}
        </div>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total patients" value={summary.total_patients ?? 0} />
        <MetricCard label="Already 80h" value={summary.already_80h ?? 0} />
        <MetricCard label="On track" value={summary.on_track ?? 0} />
        <MetricCard label="Watch" value={summary.watch ?? 0} />
        <MetricCard label="Rescue" value={summary.rescue ?? 0} />
        <MetricCard label="Critical" value={summary.critical ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Priority rescue queue</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Sorted from highest compliance risk to lowest. Use this list to decide who must be contacted first.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Patient",
                  "Used",
                  "Expected",
                  "Remaining",
                  "Days Left",
                  "Needed / Day",
                  "Projected",
                  "Risk",
                  "Action"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={tdStyle}>
                    No pilot patients entered yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}>
                      <strong>{row.patient_code}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.device_serial || "-"}</div>
                    </td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.expected_by_today)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}>{row.days_left}</td>
                    <td style={tdStyle}>
                      <strong>{round(row.required_daily_hours)}h/day</strong>
                    </td>
                    <td style={tdStyle}>{round(row.projected_end_month_hours)}h</td>
                    <td style={tdStyle}>
                      <RiskBadge risk={row.risk_level} />
                    </td>
                    <td style={tdStyle}>
                      <strong>{row.atlas_action}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        AHI {round(row.ahi_avg_30d)} / Leak {round(row.leak_avg_30d)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How Raftopoulos should use this</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Enter or update CPAP usage data for the same 20 pilot patients every few days.</li>
          <li>Open this rescue monitor before month end.</li>
          <li>Call CRITICAL and RESCUE patients first.</li>
          <li>Use required daily hours to tell each patient exactly what is needed to reach 80h.</li>
          <li>At the end of the pilot, use the queue as proof of operational value.</li>
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
  const style = RISK_BADGE_STYLE[risk] || RISK_BADGE_STYLE.WATCH;

  return (
    <span style={{ ...style, padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
      {risk}
    </span>
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
  maxWidth: 720
};

const cardsGridStyle = {
  maxWidth: 1180,
  margin: "0 auto 24px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 12
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
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

const headlineStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
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

const primaryButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none"
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

