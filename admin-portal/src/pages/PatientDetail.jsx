import React, { useEffect, useState } from "react";
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
  CartesianGrid
} from "recharts";
import { useParams } from "react-router-dom";

const API = "http://localhost:3000/api";

export default function PatientDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [eventType, setEventType] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const token =
    localStorage.getItem("doctor_token") ||
    localStorage.getItem("token");

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const res = await axios.get(`${API}/timeline-engine/${id}`, authHeaders);
    setData(res.data);
  };

  const addEvent = async () => {
    if (!eventType.trim()) return;

    await axios.post(
      `${API}/timeline-engine/event`,
      {
        patient_id: id,
        event_type: eventType,
        description: eventDescription
      },
      authHeaders
    );

    setEventType("");
    setEventDescription("");
    loadData();
  };

  const openPdf = () => {
    window.open(`${API}/reports/patient/${id}`, "_blank");
  };

  if (!data) {
    return <div style={{ padding: 30 }}>Loading timeline engine...</div>;
  }

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1>Patient Timeline Engine</h1>
      <p style={{ color: "#4b5563" }}>ResMed-style therapy history and clinical overview</p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
        <Card title="Patient" value={data.patient.name || "-"} color="#2563eb" />
        <Card title="Diagnosis" value={data.patient.diagnosis || "-"} color="#7c3aed" />
        <Card title="Device" value={data.patient.device_serial || "-"} color="#ea580c" />
        <Card title="Doctor" value={data.patient.doctor_name || "-"} color="#16a34a" />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
        <Card title="Avg Hours 30d" value={data.summary.avg_hours_30d || 0} color="#111827" />
        <Card title="Avg AHI 30d" value={data.summary.avg_ahi_30d || 0} color="#dc2626" />
        <Card title="Avg Leak 30d" value={data.summary.avg_leak_30d || 0} color="#f59e0b" />
        <Card title="Compliant Days" value={data.summary.compliant_days || 0} color="#0891b2" />
      </div>

      <div style={panelStyle}>
        <h2>📈 Daily Therapy Hours</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.usage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="usage_date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="hours_used" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>🫁 AHI Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.usage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="usage_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="ahi" stroke="#dc2626" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>💨 Leak Trend</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.usage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="usage_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="leak" stroke="#f59e0b" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={panelStyle}>
        <h2>📋 Clinical Notes</h2>
        {data.notes.length === 0 ? (
          <p>No notes yet</p>
        ) : (
          data.notes.map((n) => (
            <div key={n.id} style={itemStyle}>
              <strong>{n.doctor_name || "Doctor"}</strong>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {String(n.created_at).slice(0, 19).replace("T", " ")}
              </div>
              <p>{n.note}</p>
            </div>
          ))
        )}
      </div>

      <div style={panelStyle}>
        <h2>📅 Timeline Events</h2>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            style={inputStyle}
            placeholder="Event type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
          />
          <button style={buttonStyle} onClick={addEvent}>
            Add Event
          </button>
        </div>

        {data.events.length === 0 ? (
          <p>No timeline events yet</p>
        ) : (
          data.events.map((e) => (
            <div key={e.id} style={itemStyle}>
              <strong>{e.event_type}</strong>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {String(e.created_at).slice(0, 19).replace("T", " ")}
              </div>
              <p>{e.description}</p>
            </div>
          ))
        )}
      </div>

      <div style={panelStyle}>
        <h2>⏰ Follow-up Reminders</h2>
        {data.followups.length === 0 ? (
          <p>No follow-up reminders</p>
        ) : (
          data.followups.map((f) => (
            <div key={f.id} style={itemStyle}>
              <strong>{String(f.reminder_date).slice(0, 10)}</strong>
              <div>Status: {f.status}</div>
              <p>{f.note}</p>
            </div>
          ))
        )}
      </div>

      <div style={panelStyle}>
        <h2>📄 Report</h2>
        <button style={buttonStyle} onClick={openPdf}>
          Download PDF Report
        </button>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
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
      <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>{value}</div>
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

const itemStyle = {
  background: "#f9fafb",
  padding: 14,
  borderRadius: 10,
  marginBottom: 10,
  border: "1px solid #e5e7eb"
};

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  minWidth: 220
};

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#fff",
  cursor: "pointer"
};