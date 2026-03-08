import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ComplianceDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompliance = async () => {
    try {
      const res = await api.get("/compliance");

      console.log("COMPLIANCE API RESPONSE:", res.data);

      // 🔥 ΚΡΙΣΙΜΟ FIX (πιάνει όλες τις περιπτώσεις backend)
      if (Array.isArray(res.data)) {
        setRecords(res.data);
      } else if (Array.isArray(res.data.records)) {
        setRecords(res.data.records);
      } else if (Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error("Compliance fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  if (loading) return <h3>Loading Compliance Data...</h3>;

  return (
    <div style={{ marginTop: 40 }}>
      <h2>CPAP Compliance Dashboard</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Compliance %</th>
            <th>CPAP Hours</th>
            <th>Status</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="5">No compliance records found</td>
            </tr>
          ) : (
            records.map((rec, index) => (
              <tr key={index}>
                <td>{rec.patient_id || rec.id}</td>
                <td>{rec.compliance_percentage || rec.compliance || 0}%</td>
                <td>{rec.cpap_hours || 0}</td>
                <td>{rec.status || "pending"}</td>
                <td
                  style={{
                    color:
                      (rec.compliance_percentage || 0) >= 70
                        ? "green"
                        : "red",
                    fontWeight: "bold",
                  }}
                >
                  {(rec.compliance_percentage || 0) >= 70
                    ? "LOW RISK"
                    : "HIGH RISK"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
