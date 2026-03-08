import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000/api";

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [dailyUsage, setDailyUsage] = useState([]);
  const [maskLeakAlerts, setMaskLeakAlerts] = useState([]);
  const [ahiSeverity, setAhiSeverity] = useState([]);
  const [followups, setFollowups] = useState([]);

  const token = localStorage.getItem("doctor_token");
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
    loadAlerts();
    loadPredictions();
    loadMaskLeakAlerts();
    loadAhiSeverity();
    loadFollowups();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadDailyUsage(selectedPatientId);
    }
  }, [selectedPatientId]);

  const authHeaders = {
    headers: {
      Authorization: "Bearer " + token
    }
  };

  const loadPatients = async () => {
    const res = await axios.get(API + "/doctor/patients", authHeaders);
    const list = res.data.patients || [];
    setPatients(list);
    if (list.length > 0 && !selectedPatientId) {
      setSelectedPatientId(String(list[0].id));
    }
  };

  const loadAlerts = async () => {
    const res = await axios.get(API + "/doctor/alerts", authHeaders);
    setAlerts(res.data.alerts || []);
  };

  const loadPredictions = async () => {
    const res = await axios.get(API + "/ai/compliance-risk", authHeaders);
    setPredictions(res.data.predictions || []);
  };

  const loadMaskLeakAlerts = async () => {
    const res = await axios.get(API + "/clinical/mask-leak-alerts", authHeaders);
    setMaskLeakAlerts(res.data.alerts || []);
  };

  const loadAhiSeverity = async () => {
    const res = await axios.get(API + "/clinical/ahi-severity", authHeaders);
    setAhiSeverity(res.data.patients || []);
  };

  const loadFollowups = async () => {
    const res = await axios.get(API + "/clinical/followups", authHeaders);
    setFollowups(res.data.reminders || []);
  };

  const loadDailyUsage = async (patientId) => {
    const res = await axios.get(API + "/doctor/patients/" + patientId + "/daily", authHeaders);
    const usageRows = res.data.usage || [];

    const sorted = [...usageRows].sort(
      (a, b) => new Date(a.usage_date) - new Date(b.usage_date)
    );

    let cumulative = 0;
    const trendData = sorted.map((row) => {
      const h = Number(row.hours_used || 0);
      cumulative += h;

      return {
        usage_date: String(row.usage_date).slice(0, 10),
        hours_used: h,
        cumulative_hours: Number(cumulative.toFixed(2))
      };
    });

    setDailyUsage(trendData);
  };

  const openReport = (id) => {
    window.open(API + "/reports/patient/" + id, "_blank");
  };

  const openPatient = (id) => {
    navigate("/patient/" + id);
  };

  const createFollowup = async () => {
    if (!selectedPatientId) {
      alert("Επίλεξε ασθενή");
      return;
    }

    const reminder_date = prompt("Ημερομηνία υπενθύμισης (YYYY-MM-DD)");
    const note = prompt("Σημείωση follow-up");

    if (!reminder_date) return;

    await axios.post(
      API + "/clinical/followups",
      {
        patient_id: selectedPatientId,
        reminder_date,
        note
      },
      authHeaders
    );

    loadFollowups();
    alert("Το follow-up reminder δημιουργήθηκε");
  };

  const markFollowupDone = async (id) => {
    await axios.put(API + "/clinical/followups/" + id + "/done", {}, authHeaders);
    loadFollowups();
  };

  const selectedPrediction = useMemo(() => {
    return predictions.find((p) => String(p.patient_id) === String(selectedPatientId));
  }, [predictions, selectedPatientId]);

  const riskColor = (risk) => {
    if (risk === "HIGH" || risk === "critical" || risk === "HIGH_LEAK" || risk === "SEVERE") return "#dc2626";
    if (risk === "MEDIUM" || risk === "warning" || risk === "MODERATE_LEAK" || risk === "MODERATE" || risk === "MILD") return "#f59e0b";
    return "#16a34a";
  };

  const aiBarData = predictions.map((p) => ({
    name: p.patient_name,
    adherence_score: p.adherence_score,
    risk: p.risk
  }));

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 8 }}>Doctor Dashboard</h1>
      <p style={{ marginTop: 0, color: "#4b5563" }}>
        CPAP Clinical Monitoring • Enterprise / ResMed-style
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
        <StatCard title="My Patients" value={patients.length} color="#2563eb" />
        <StatCard title="Alerts" value={alerts.filter(a => a.risk_level !== "compliant").length} color="#dc2626" />
        <StatCard title="AI High Risk" value={predictions.filter(p => p.risk === "HIGH").length} color="#f59e0b" />
        <StatCard title="Follow-ups" value={followups.filter(f => f.status === "pending").length} color="#7c3aed" />
      </div>

      <div style={panelStyle}>
        <h2>🚨 Non-Compliant Alerts</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Hours</th>
              <th>Risk</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.monthly_hours}</td>
                <td style={{ color: riskColor(a.risk_level), fontWeight: "bold" }}>
                  {a.risk_level}
                </td>
                <td>
                  <button style={buttonStyle} onClick={() => openPatient(a.id)}>
                    Open Patient
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={panelStyle}>
        <h2>💨 Mask Leak Clinical Alerts</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Avg Leak 30d</th>
              <th>Leak Level</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {maskLeakAlerts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.avg_leak_30d}</td>
                <td style={{ color: riskColor(a.leak_level), fontWeight: "bold" }}>
                  {a.leak_level}
                </td>
                <td>
                  <button style={buttonStyle} onClick={() => openPatient(a.id)}>
                    Open Patient
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={panelStyle}>
        <h2>🫁 AHI Severity Engine</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Avg AHI 30d</th>
              <th>Severity</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {ahiSeverity.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.avg_ahi_30d}</td>
                <td style={{ color: riskColor(a.ahi_severity), fontWeight: "bold" }}>
                  {a.ahi_severity}
                </td>
                <td>
                  <button style={buttonStyle} onClick={() => openPatient(a.id)}>
                    Open Patient
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={panelStyle}>
        <h2>🤖 AI Compliance Prediction</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={aiBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="adherence_score">
              {aiBarData.map((entry, index) => (
                <Cell key={index} fill={riskColor(entry.risk)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>👤 Select Patient</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            style={selectStyle}
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button style={buttonStyle} onClick={createFollowup}>
            Create Follow-up Reminder
          </button>

          {selectedPatientId ? (
            <button style={buttonStyle} onClick={() => openPatient(selectedPatientId)}>
              Open Selected Patient
            </button>
          ) : null}
        </div>

        {selectedPrediction ? (
          <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <MiniCard title="Adherence Score" value={selectedPrediction.adherence_score} color="#111827" />
            <MiniCard title="Risk" value={selectedPrediction.risk} color={riskColor(selectedPrediction.risk)} />
            <MiniCard title="Avg 30d Hours" value={selectedPrediction.avg_30d_hours} color="#2563eb" />
            <MiniCard title="Variability" value={selectedPrediction.variability} color="#7c3aed" />
            <MiniCard title="Disconnect Days" value={selectedPrediction.disconnect_days} color="#ea580c" />
            <MiniCard title="Adherence %" value={selectedPrediction.adherence_rate} color="#16a34a" />
          </div>
        ) : null}
      </div>

      <div style={panelStyle}>
        <h2>📈 Daily Usage Graph</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dailyUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="usage_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="hours_used" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>📊 Compliance Trend</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dailyUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="usage_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cumulative_hours" stroke="#16a34a" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>📅 Follow-up Reminders</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
              <th>Note</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {followups.map((f) => (
              <tr key={f.id}>
                <td>{f.patient_name}</td>
                <td>{String(f.reminder_date).slice(0, 10)}</td>
                <td>{f.status}</td>
                <td>{f.note}</td>
                <td>
                  {f.status !== "done" ? (
                    <button style={buttonStyle} onClick={() => markFollowupDone(f.id)}>
                      Mark Done
                    </button>
                  ) : (
                    "Done"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={panelStyle}>
        <h2>My Patients</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Diagnosis</th>
              <th>Phone</th>
              <th>Hours</th>
              <th>Report</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.diagnosis}</td>
                <td>{p.phone}</td>
                <td>{p.cpap_hours}</td>
                <td>
                  <button style={buttonStyle} onClick={() => openReport(p.id)}>
                    PDF
                  </button>
                </td>
                <td>
                  <button style={buttonStyle} onClick={() => openPatient(p.id)}>
                    Open Patient
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        minWidth: 180,
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 8 }}>{value}</div>
    </div>
  );
}

function MiniCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 10,
        minWidth: 140,
        borderLeft: `5px solid ${color}`,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)"
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 6 }}>{value}</div>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  marginTop: 24,
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 16
};

const buttonStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#fff",
  cursor: "pointer"
};

const selectStyle = {
  padding: 10,
  minWidth: 260,
  borderRadius: 8,
  border: "1px solid #d1d5db"
};