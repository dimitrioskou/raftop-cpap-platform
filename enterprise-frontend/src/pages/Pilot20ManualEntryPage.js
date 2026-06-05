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

function calculateLocalPreview(form) {
  const monthUsage = toNumber(form.month_usage_hours);
  const ahi = toNumber(form.ahi_avg_30d);
  const leak = toNumber(form.leak_avg_30d);

  const reasons = [];
  let score = 0;

  if (monthUsage < 80) {
    score += 40;
    reasons.push("ΞΞ¬Ο„Ο‰ Ξ±Ο€Ο 80 ΟΟΞµΟ‚");
  }

  if (ahi > 10) {
    score += 25;
    reasons.push("Ξ¥ΟΞ·Ξ»Ο AHI");
  }

  if (leak > 24) {
    score += 20;
    reasons.push("Ξ¥ΟΞ·Ξ»Ο leak");
  }

  let priority = "Ξ§Ξ±ΞΌΞ·Ξ»Ξ®";
  if (score >= 80) priority = "ΞΟΞ―ΟƒΞΉΞΌΞ·";
  else if (score >= 50) priority = "Ξ¥ΟΞ·Ξ»Ξ®";
  else if (score >= 25) priority = "ΞΞµΟƒΞ±Ξ―Ξ±";

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

  const preview = useMemo(() => calculateLocalPreview(form), [form]);

  async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json.message || json.error || "Request failed");
    }

    return json;
  }

  async function loadData() {
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
        `Ξ‘Ο€ΞΏΞΈΞ·ΞΊΞµΟΟ„Ξ·ΞΊΞµ: ${result.patient_code}. 80h: ${
          result.is_80h_compliant ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"
        }. ATLAS: ${result.atlas?.priority || "-"}`
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
    <div style={{ padding: 24, maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#64748b", fontWeight: 700 }}>
          RAFTOP CPAP CARE Pro
        </p>
        <h1 style={{ margin: "4px 0 8px" }}>Pilot 20 β€” ΞΞ±Ο„Ξ±Ο‡ΟΟΞ·ΟƒΞ· CPAP Ξ±ΟƒΞΈΞµΞ½ΟΞ½</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          ΞΞ±ΞΈΞ±ΟΟ pilot Ο€ΞµΟΞΉΞ²Ξ¬Ξ»Ξ»ΞΏΞ½ Ξ³ΞΉΞ± Ξ­Ο‰Ο‚ 20 ΟΞµΟ…Ξ΄Ο‰Ξ½Ο…ΞΌΞΏΟ€ΞΏΞΉΞ·ΞΌΞ­Ξ½ΞΏΟ…Ο‚ Ξ±ΟƒΞΈΞµΞ½ΞµΞ―Ο‚.
          Ξ”ΞµΞ½ ΞΊΞ±Ο„Ξ±Ο‡Ο‰ΟΞΏΟΞ½Ο„Ξ±ΞΉ ΞΏΞ½ΟΞΌΞ±Ο„Ξ±, ΟƒΟ„ΞΏΞΉΟ‡ΞµΞ―Ξ± ΞµΟ€ΞΉΞΊΞΏΞΉΞ½Ο‰Ξ½Ξ―Ξ±Ο‚ Ξ® Ξ¬ΞΌΞµΟƒΞ± Ξ±Ξ½Ξ±Ξ³Ξ½Ο‰ΟΞΉΟƒΟ„ΞΉΞΊΞ¬.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={labelStyle}>Ξ‘ΟƒΞΈΞµΞ½ΞµΞ―Ο‚ pilot</div>
          <div style={metricStyle}>{currentPatients}/20</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Ξ”ΞΉΞ±ΞΈΞ­ΟƒΞΉΞΌΞµΟ‚ ΞΈΞ­ΟƒΞµΞΉΟ‚</div>
          <div style={metricStyle}>{remainingSlots}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>80h compliant records</div>
          <div style={metricStyle}>{summary?.compliance?.compliant_records ?? "-"}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>ΞΞ¬Ο„Ο‰ Ξ±Ο€Ο 80h</div>
          <div style={metricStyle}>{summary?.compliance?.below_80h_records ?? "-"}</div>
        </div>
      </section>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <form onSubmit={submitPatient} style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>ΞΞ­Ξ± ΞΊΞ±Ο„Ξ±Ο‡ΟΟΞ·ΟƒΞ· / ΞµΞ½Ξ·ΞΌΞ­ΟΟ‰ΟƒΞ· Ξ±ΟƒΞΈΞµΞ½ΞΏΟΟ‚</h2>

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
            <button type="submit" disabled={saving || remainingSlots <= 0} style={primaryButtonStyle}>
              {saving ? "Ξ‘Ο€ΞΏΞΈΞ®ΞΊΞµΟ…ΟƒΞ·..." : "Ξ‘Ο€ΞΏΞΈΞ®ΞΊΞµΟ…ΟƒΞ· Ξ±ΟƒΞΈΞµΞ½ΞΏΟΟ‚"}
            </button>
            <button type="button" onClick={() => setForm(EMPTY_FORM)} style={secondaryButtonStyle}>
              ΞΞ±ΞΈΞ±ΟΞΉΟƒΞΌΟΟ‚
            </button>
          </div>

          {remainingSlots <= 0 && (
            <p style={{ color: "#b91c1c", fontWeight: 700 }}>
              Ξ¤ΞΏ ΟΟΞΉΞΏ Ο„Ο‰Ξ½ 20 Ξ±ΟƒΞΈΞµΞ½ΟΞ½ Ξ­Ο‡ΞµΞΉ ΟƒΟ…ΞΌΟ€Ξ»Ξ·ΟΟ‰ΞΈΞµΞ―.
            </p>
          )}
        </form>

        <aside style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Ξ†ΞΌΞµΟƒΞ· Ο€ΟΞΏΞµΟ€ΞΉΟƒΞΊΟΟ€Ξ·ΟƒΞ·</h2>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>80 Hours Compliance</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {preview.is80h ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"}
            </div>
          </div>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>ATLAS Priority</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{preview.priority}</div>
            <div style={{ color: "#64748b" }}>Score: {preview.score}</div>
          </div>

          <div style={previewBoxStyle}>
            <div style={labelStyle}>Ξ›ΟΞ³ΞΏΞΉ follow-up</div>
            {preview.reasons.length === 0 ? (
              <div>Ξ”ΞµΞ½ Ο…Ο€Ξ¬ΟΟ‡ΞµΞΉ Ξ¬ΞΌΞµΟƒΞΏ ΟƒΞ®ΞΌΞ± ΞΊΞΉΞ½Ξ΄ΟΞ½ΞΏΟ….</div>
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
        <h2 style={{ marginTop: 0 }}>Pilot Ξ±ΟƒΞΈΞµΞ½ΞµΞ―Ο‚</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Code",
                  "Device",
                  "Usage",
                  "80h",
                  "AHI",
                  "Leak",
                  "Doctor",
                  "Last Data"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.patient_external_id}>
                  <td style={tdStyle}>{p.patient_code}</td>
                  <td style={tdStyle}>{p.device_serial}</td>
                  <td style={tdStyle}>{p.month_usage_hours ?? "-"}</td>
                  <td style={tdStyle}>{String(p.is_80h_compliant) === "true" ? "ΞΞ‘Ξ™" : "ΞΞ§Ξ™"}</td>
                  <td style={tdStyle}>{p.ahi_avg_30d ?? "-"}</td>
                  <td style={tdStyle}>{p.leak_avg_30d ?? "-"}</td>
                  <td style={tdStyle}>{p.doctor_external_id ?? "-"}</td>
                  <td style={tdStyle}>{p.last_data_date ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", marginBottom: 6, color: "#334155", fontWeight: 700 }}>
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
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4
};

const metricStyle = {
  fontSize: 30,
  fontWeight: 900,
  marginTop: 6
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
  fontSize: 14
};

const primaryButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer"
};

const secondaryButtonStyle = {
  background: "#f8fafc",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
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
  fontWeight: 700
};

const errorStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 700
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
