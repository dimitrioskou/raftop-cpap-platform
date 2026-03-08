import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchAlerts = async () => {
    const res = await api.get("/alerts");
    setAlerts(Array.isArray(res.data) ? res.data : []);
  };

  const runDetection = async () => {
    setBusy(true);
    try {
      const res = await api.post("/alerts/run");
      alert(`Detection done. New alerts: ${res.data?.created ?? 0}`);
      await fetchAlerts();
    } catch (e) {
      console.error(e);
      alert("Error running detection");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Alerts</h3>

      <button onClick={runDetection} disabled={busy}>
        {busy ? "Running..." : "Run Non-Compliance Detection"}
      </button>

      <div style={{ marginTop: 12 }}>
        {alerts.length === 0 ? (
          <p>No alerts</p>
        ) : (
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient ID</th>
                <th>Severity</th>
                <th>Message</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient_id}</td>
                  <td>{a.severity}</td>
                  <td>{a.message}</td>
                  <td>{String(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
