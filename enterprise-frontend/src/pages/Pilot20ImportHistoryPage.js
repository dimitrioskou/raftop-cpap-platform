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

export default function Pilot20ImportHistoryPage() {
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/import-history");
      setBatches(json.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(batchId) {
    setError("");

    try {
      const json = await apiFetch(`/api/pilot20/import-history/${batchId}`);
      setSelected(json.batch);
      setDetails(json.rows || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>AirView Import History & Audit</h1>
          <p style={subtitleStyle}>
            Production audit trail for AirView / CPAP usage uploads. See what was uploaded, what updated, what was skipped and what failed.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <a href="/pilot20/rolling-80h-report" style={secondaryButtonStyle}>Rolling 80h Report</a>
          <a href="/pilot20/monthly-value-report" style={secondaryButtonStyle}>Monthly Report</a>
          <button type="button" onClick={loadHistory} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading import history...</div>}

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Recent uploads</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Created", "Source", "File", "Rows", "Updated", "Skipped", "Errors", "User", "Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="10" style={tdStyle}>No imports recorded yet.</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id}>
                    <td style={tdStyle}>{batch.id}</td>
                    <td style={tdStyle}>{formatDate(batch.created_at)}</td>
                    <td style={tdStyle}>{batch.upload_source}</td>
                    <td style={tdStyle}>{batch.filename || "-"}</td>
                    <td style={tdStyle}>{batch.total_rows}</td>
                    <td style={{ ...tdStyle, color: "#166534", fontWeight: 900 }}>{batch.updated_count}</td>
                    <td style={{ ...tdStyle, color: "#92400e", fontWeight: 900 }}>{batch.skipped_count}</td>
                    <td style={{ ...tdStyle, color: "#991b1b", fontWeight: 900 }}>{batch.error_count}</td>
                    <td style={tdStyle}>{batch.created_by_email || "-"}</td>
                    <td style={tdStyle}>
                      <button type="button" onClick={() => loadDetails(batch.id)} style={smallButtonStyle}>
                        View rows
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Import details #{selected.id}
          </h2>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={selected.total_rows} />
            <MetricCard label="Updated" value={selected.updated_count} />
            <MetricCard label="Skipped" value={selected.skipped_count} />
            <MetricCard label="Errors" value={selected.error_count} />
          </div>

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Device Serial", "Patient", "Reason", "Last Data", "Hours", "80h"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={tdStyle}>No row details found.</td>
                  </tr>
                ) : (
                  details.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{row.line_number ?? "-"}</td>
                      <td style={tdStyle}><strong>{row.status}</strong></td>
                      <td style={tdStyle}>{row.device_serial || "-"}</td>
                      <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                      <td style={tdStyle}>{row.reason || "-"}</td>
                      <td style={tdStyle}>{row.last_data_date || "-"}</td>
                      <td style={tdStyle}>{row.month_usage_hours ?? "-"}</td>
                      <td style={tdStyle}>{row.is_80h_compliant === true ? "YES" : row.is_80h_compliant === false ? "NO" : "-"}</td>
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
      <div style={metricStyle}>{value ?? 0}</div>
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

const smallButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
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



