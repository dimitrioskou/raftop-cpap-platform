import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ComplianceCharts({ records = [] }) {
  const safe = Array.isArray(records) ? records : [];

  const stats = useMemo(() => {
    const normalized = safe.map((r, idx) => {
      const patient_id = r.patient_id ?? r.id ?? idx + 1;
      const compliance = Number(r.compliance_percentage ?? r.compliance ?? 0);
      const hours = Number(r.cpap_hours ?? 0);
      const status = r.status ?? (compliance >= 70 ? "compliant" : "pending");
      return { patient_id, compliance, hours, status };
    });

    const compliantCount = normalized.filter((x) => x.compliance >= 70).length;
    const nonCompliantCount = normalized.length - compliantCount;

    const avgCompliance =
      normalized.length === 0
        ? 0
        : Math.round(
            normalized.reduce((a, b) => a + b.compliance, 0) /
              normalized.length
          );

    const avgHours =
      normalized.length === 0
        ? 0
        : Math.round(
            (normalized.reduce((a, b) => a + b.hours, 0) / normalized.length) *
              10
          ) / 10;

    const pieData = [
      { name: "Compliant (>=70%)", value: compliantCount },
      { name: "Non-compliant (<70%)", value: nonCompliantCount },
    ];

    // Bar chart top 10 by compliance
    const barData = [...normalized]
      .sort((a, b) => b.compliance - a.compliance)
      .slice(0, 10)
      .map((x) => ({
        patient: String(x.patient_id),
        compliance: x.compliance,
      }));

    // Line chart hours by patient_id (sorted)
    const lineData = [...normalized]
      .sort((a, b) => Number(a.patient_id) - Number(b.patient_id))
      .map((x) => ({
        patient: String(x.patient_id),
        hours: x.hours,
        compliance: x.compliance,
      }));

    return { normalized, compliantCount, nonCompliantCount, avgCompliance, avgHours, pieData, barData, lineData };
  }, [safe]);

  if (stats.normalized.length === 0) {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>Compliance Charts</h3>
        <p>No compliance data yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Compliance Charts</h3>

      <div style={{ marginTop: 10, marginBottom: 20 }}>
        <b>Avg Compliance:</b> {stats.avgCompliance}% &nbsp; | &nbsp;
        <b>Avg CPAP Hours:</b> {stats.avgHours}h &nbsp; | &nbsp;
        <b>Records:</b> {stats.normalized.length}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* PIE */}
        <div style={{ height: 320, border: "1px solid #ccc", padding: 12 }}>
          <h4 style={{ marginTop: 0 }}>Compliant vs Non-compliant</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={stats.pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label
              >
                {/* αφήνω default χρώματα (Cell υπάρχει μόνο για σωστή εμφάνιση) */}
                <Cell />
                <Cell />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR */}
        <div style={{ height: 320, border: "1px solid #ccc", padding: 12 }}>
          <h4 style={{ marginTop: 0 }}>Top 10 Compliance</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={stats.barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="patient" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="compliance" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* LINE */}
        <div style={{ height: 340, border: "1px solid #ccc", padding: 12, gridColumn: "1 / span 2" }}>
          <h4 style={{ marginTop: 0 }}>CPAP Hours & Compliance by Patient</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={stats.lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="patient" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" />
              <Line type="monotone" dataKey="compliance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
