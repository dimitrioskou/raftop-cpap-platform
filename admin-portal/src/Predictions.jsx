import { useEffect, useState } from "react";
import axios from "axios";

export default function Predictions() {
  const [pred, setPred] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:3000/api/predict", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setPred(res.data))
      .catch(() => setPred({ error: true }));
  }, []);

  if (!pred) return <p>Loading AI predictions...</p>;
  if (pred.error) return <p style={{ color: "red" }}>AI predictions error</p>;

  return (
    <div style={{ marginTop: 30, padding: 15, border: "1px solid #ddd", borderRadius: 10 }}>
      <h2>🤖 AI Predictions</h2>

      <p>
        High: <b>{pred.summary.high}</b> | Medium: <b>{pred.summary.medium}</b> | Low: <b>{pred.summary.low}</b>
      </p>

      <div style={{ overflowX: "auto" }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Risk</th>
              <th>Score</th>
              <th>Last</th>
              <th>Avg</th>
              <th>Trend/day</th>
              <th>Next 3 days</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {pred.predictions.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td style={{ fontWeight: "bold", color: p.riskLabel === "High" ? "red" : p.riskLabel === "Medium" ? "orange" : "green" }}>
                  {p.riskLabel}
                </td>
                <td>{p.riskScore}</td>
                <td>{p.lastHours}</td>
                <td>{p.avgHours}</td>
                <td>{p.trendPerDay}</td>
                <td>{p.predictedNext3Days.join(" → ")}</td>
                <td>{p.reasons.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 10, color: "#666" }}>
        *This is a local heuristic model (no cloud). Χρήσιμο για “early warning”.
      </p>
    </div>
  );
}
