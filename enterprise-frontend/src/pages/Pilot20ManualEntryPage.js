import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const EMPTY_FORM = {
  patient_external_id: "",
  patient_code: "",
  device_serial: "",
  device_model: "AirSense 10",
  setup_date: "",
  month_start: "",
  last_data_date: "",
  month_usage_hours: "",
  usage_hours_30d: "",
  days_used_30d: "",
  ahi_avg_30d: "",
  leak_avg_30d: "",
  doctor_external_id: "",
  branch_code: "PILOT20"
};

function toNumber(value) {
  const n = Number(String(value || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function calculatePreview(form) {
  const monthUsage = toNumber(form.month_usage_hours);
  const ahi = toNumber(form.ahi_avg_30d);
  const leak = toNumber(form.leak_avg_30d);

  const reasons = [];
  let score = 0;

  if (monthUsage < 80) {
    score += 40;
    reasons.push("Below 80 hours");
  }

  if (ahi > 10) {
    score += 25;
    reasons.push("High AHI");
  }

  if (leak > 24) {
    score += 20;
    reasons.push("High leak");
  }

  let priority = "Low";
  if (score >= 80) priority = "Critical";
  else if (score >= 50) priority = "High";
  else if (score >= 25) priority = "Medium";

  return {
    is80h: monthUsage >= 80,
    score,
    priority,
    reasons
  };
}

export default function Pilot20ManualEntryPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const preview = useMemo(() => calculatePreview(form), [form]);

  function getToken() {
    return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  }

  function clearInvalidToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    setAuthRequired(true);
  }

  async function apiFetch(path, options = {}) {
    const token = getToken();

    if (!token) {
      setAuthRequired(true);
      throw new Error("Please login first.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const json = await response.json().catch(() => ({}));

    if (response.status === 401 || json.error === "pilot20_invalid_token") {
      clearInvalidToken();
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(json.message || json.error || "Request failed");
    }

    return json;
  }

  async function loadData() {
    setError("");

    try {
      const summaryJson = await apiFetch("/api/pilot20/summary");
      setSummary(summaryJson);

      const patientsJson = await apiFetch("/api/pilot20/patients");
      setPatients(patientsJson.rows || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitPatient(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await apiFetch("/api/pilot20/patients", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setMessage(
        `Saved: ${result.patient_code}. 80h compliant: ${
          result.is_80h_compliant ? "YES" : "NO"
        }. ATLAS priority: ${result.atlas?.priority || "-"}`
      );

      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const currentPatients = summary?.current_patients ?? patients.length;
  const remainingSlots = summary?.remaining_slots ?? Math.max(0, 20 - patients.length);

  return (
    <div className="pilot20-page" style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#64748b", fontWeight: 800 }}>
          RAFTOP CPAP CARE Pro
        </p>
        <h1 style={{ margin: "4px 0 8px", color: "#0f172a" }}>
          Pilot 20 - CPAP Patient Entry
        </h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Clean 2-month pilot environment for up to 20 pseudonymized CPAP patients.
          Enter only patient code, device details and CPAP usage metrics.
        </p>
              <div style={{ marginTop: 16 }}>
          <button type="button" onClick={() => { window.location.href = "/pilot20/rescue-monitor"; }} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }}>Open 80h Rescue Monitor</button>
        </div>
      </header>

      {authRequired && (
        <div style={warningStyle}>
          Please login again before using Pilot 20.
          <br />
          <a href="/login" style={{ fontWeight: 800 }}>Go to login</a>
        </div>
      )}

      <section style={cardsGridStyle}>
        <MetricCard label="Pilot patients" value={`${currentPatients}/20`} />
        <MetricCard label="Remaining slots" value={remainingSlots} />
        <MetricCard label="80h compliant records" value={summary?.compliance?.compliant_records ?? "-"} />
        <MetricCard label="Below 80h records" value={summary?.compliance?.below_80h_records ?? "-"} />
      </section>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <form onSubmit={submitPatient} style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>New patient entry / update</h2>

          <div style={gridStyle}>
            <Field label="Patient External ID" value={form.patient_external_id} onChange={(v) => updateField("patient_external_id", v)} required />
            <Field label="Patient Code" value={form.patient_code} onChange={(v) => updateField("patient_code", v)} required />
            <Field label="Device Serial" value={form.device_serial} onChange={(v) => updateField("device_serial", v)} required />
            <Field label="Device Model" value={form.device_model} onChange={(v) => updateField("device_model", v)} />

            <Field type="date" label="Setup Date" value={form.setup_date} onChange={(v) => updateField("setup_date", v)} />
            <Field type="date" label="Month Start" value={form.month_start} onChange={(v) => updateField("month_start", v)} />
            <Field type="date" label="Last Data Date" value={form.last_data_date} onChange={(v) => updateField("last_data_date", v)} />

            <Field label="Month Usage Hours" value={form.month_usage_hours} onChange={(v) => updateField("month_usage_hours", v)} required />
            <Field label="Usage Hours 30d" value={form.usage_hours_30d} onChange={(v) => updateField("usage_hours_30d", v)} />
            <Field label="Days Used 30d" value={form.days_used_30d} onChange={(v) => updateField("days_used_30d", v)} />
            <Field label="AHI Avg 30d" value={form.ahi_avg_30d} onChange={(v) => updateField("ahi_avg_30d", v)} />
            <Field label="Leak Avg 30d" value={form.leak_avg_30d} onChange={(v) => updateField("leak_avg_30d", v)} />

            <Field label="Doctor Code" value={form.doctor_external_id} onChange={(v) => updateField("doctor_external_id", v)} />
            <Field label="Branch Code" value={form.branch_code} onChange={(v) => updateField("branch_code", v)} />
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <button type="submit" disabled={saving || remainingSlots <= 0 || authRequired} style={primaryButtonStyle}>
              {saving ? "Saving..." : "Save patient"}
            </button>
            <button type="button" onClick={() => setForm(EMPTY_FORM)} style={secondaryButtonStyle}>
              Clear
            </button>
          </div>

          {remainingSlots <= 0 && (
            <p style={{ color: "#b91c1c", fontWeight: 800 }}>
              The 20-patient pilot limit has been reached.
            </p>
          )}
        </form>

        <aside style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Live preview</h2>

          <PreviewBox label="80 Hours Compliance" value={preview.is80h ? "YES" : "NO"} />
          <PreviewBox label="ATLAS Priority" value={preview.priority} subvalue={`Score: ${preview.score}`} />

          <div style={previewBoxStyle}>
            <div style={labelStyle}>Follow-up reasons</div>
            {preview.reasons.length === 0 ? (
              <div>No immediate risk signal.</div>
            ) : (
              <ul>
                {preview.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section style={{ ...panelStyle, marginTop: 24 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Pilot patients</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Code", "Device", "Usage", "80h", "AHI", "Leak", "Doctor", "Last Data"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td style={tdStyle} colSpan="8">No pilot patients entered yet.</td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patient_external_id}>
                    <td style={tdStyle}>{p.patient_code}</td>
                    <td style={tdStyle}>{p.device_serial}</td>
                    <td style={tdStyle}>{p.month_usage_hours ?? "-"}</td>
                    <td style={tdStyle}>{String(p.is_80h_compliant) === "true" ? "YES" : "NO"}</td>
                    <td style={tdStyle}>{p.ahi_avg_30d ?? "-"}</td>
                    <td style={tdStyle}>{p.leak_avg_30d ?? "-"}</td>
                    <td style={tdStyle}>{p.doctor_external_id ?? "-"}</td>
                    <td style={tdStyle}>{p.last_data_date ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

function PreviewBox({ label, value, subvalue }) {
  return (
    <div style={previewBoxStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{value}</div>
      {subvalue && <div style={{ color: "#64748b" }}>{subvalue}</div>}
    </div>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: 6, color: "#334155", fontWeight: 800 }}>
        {label}{required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 24
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const labelStyle = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.4
};

const metricStyle = {
  fontSize: 30,
  fontWeight: 900,
  marginTop: 6,
  color: "#0f172a"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
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

const secondaryButtonStyle = {
  background: "#f8fafc",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const previewBoxStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
  background: "#f8fafc"
};

const successStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 800
};

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 800
};

const warningStyle = {
  background: "#fef3c7",
  color: "#92400e",
  border: "1px solid #fde68a",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 800
};

const thStyle = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569"
};

const tdStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid #f1f5f9"
};

