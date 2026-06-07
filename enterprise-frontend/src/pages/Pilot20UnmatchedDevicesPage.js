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

export default function Pilot20UnmatchedDevicesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/unmatched-devices");
      setRows(json.rows || []);
      setTotal(json.total_unmatched_devices || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Unmatched Devices Resolution Center</h1>
          <p style={subtitleStyle}>
            See AirView serial numbers that did not match any Pilot20 patient device serial. Use this page to correct mismatches before the next upload.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <a href="/pilot20/rolling-80h-report" style={secondaryButtonStyle}>Rolling 80h Report</a>
          <a href="/pilot20/monthly-value-report" style={secondaryButtonStyle}>Monthly Report</a>
          <button type="button" onClick={loadData} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading unmatched devices...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Unmatched device serials</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: total > 0 ? "#991b1b" : "#166534" }}>
          {total}
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          Target after a clean AirView upload: 0 unmatched devices.
        </p>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Resolution queue</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Device Serial", "Severity", "Times Seen", "Last Seen", "Batch", "File", "Reason", "Resolution Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={tdStyle}>No unmatched AirView devices found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.device_serial}>
                    <td style={tdStyle}><strong>{row.device_serial}</strong></td>
                    <td style={tdStyle}>
                      <span style={row.severity === "REPEATED" ? dangerBadgeStyle : warnBadgeStyle}>
                        {row.severity}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.occurrence_count}</td>
                    <td style={tdStyle}>{formatDate(row.last_seen_at)}</td>
                    <td style={tdStyle}>{row.latest_batch_id || "-"}</td>
                    <td style={tdStyle}>{row.latest_filename || "-"}</td>
                    <td style={tdStyle}>{row.latest_reason || "-"}</td>
                    <td style={tdStyle}>{row.resolution_action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How to resolve</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Copy the unmatched AirView serial number.</li>
          <li>Open Patient Entry.</li>
          <li>Find the corresponding pilot patient.</li>
          <li>Make sure Device Serial exactly matches the AirView Serial Number.</li>
          <li>Re-upload the AirView CSV.</li>
          <li>Return here. The unmatched device should disappear.</li>
        </ol>
      </section>
    </div>
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

const labelStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.4
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

const warnBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12
};

const dangerBadgeStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12
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


