import { useEffect, useState } from "react";
import axios from "axios";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:3000/api/alerts", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setAlerts(res.data));
  }, []);

  return (
    <div>
      <h3>⚠ Non-Compliant Patients</h3>
      {alerts.map(a => (
        <p key={a.id} style={{ color: "red" }}>
          {a.name} - {a.hours} hrs
        </p>
      ))}
    </div>
  );
}
