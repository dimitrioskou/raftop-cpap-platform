import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3000/api";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
    fetchAlerts();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Patients error:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(
        `${API}/patients/alerts/non-compliant`
      );
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error("Alerts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "critical") return "#ef4444";
    if (risk === "warning") return "#f59e0b";
    return "#22c55e";
  };

  const getRiskLabel = (risk) => {
    if (risk === "critical") return "ΚΡΙΣΙΜΟΣ";
    if (risk === "warning") return "ΧΑΜΗΛΗ ΣΥΜΜΟΡΦΩΣΗ";
    return "ΣΥΜΜΟΡΦΩΜΕΝΟΣ";
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>🩺 RAFTOP CPAP Care – Clinical Dashboard</h1>

      {/* ALERT PANEL */}
      <div style={{
        marginTop: 30,
        padding: 20,
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <h2>🚨 Clinical Alert Panel (Μη Συμμορφούμενοι Ασθενείς)</h2>
        <p>Κριτήριο: &lt; 80 ώρες CPAP / μήνα</p>

        {loading ? (
          <p>Φόρτωση alerts...</p>
        ) : (
          <table style={table}>
            <thead>
              <tr>
                <th>Ασθενής</th>
                <th>Διάγνωση</th>
                <th>Ώρες Μήνα</th>
                <th>Κλινικός Κίνδυνος</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.diagnosis || "OSA"}</td>
                  <td>{a.monthly_hours} h</td>
                  <td>
                    <span style={{
                      background: getRiskColor(a.risk_level),
                      color: "#fff",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontWeight: "bold"
                    }}>
                      {getRiskLabel(a.risk_level)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PATIENT LIST */}
      <div style={{
        marginTop: 30,
        padding: 20,
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}>
        <h2>👥 Λίστα Ασθενών CPAP</h2>

        <table style={table}>
          <thead>
            <tr>
              <th>Όνομα</th>
              <th>Διάγνωση</th>
              <th>Συνολικές Ώρες CPAP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.diagnosis}</td>
                <td>{p.cpap_hours || 0} h</td>
                <td>{p.compliance_status || "Unknown"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const table = {
  width: "100%",
  marginTop: 15,
  borderCollapse: "collapse"
};