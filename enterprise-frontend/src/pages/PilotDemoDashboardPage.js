// enterprise-frontend/src/pages/PilotDemoDashboardPage.js
// RAFTOP CPAP CARE Pro
// Phase 42.6 - Pilot Demo Dashboard Page
// Reads protected pilot demo API data from /api/tenant/pilot-demo/dashboard

import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://raftop-cpap-backend.onrender.com";

const TENANT_ID = "raftopoulos-live";

function getAuthToken() {
  try {
    return (
      localStorage.getItem("raftop_auth_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token") ||
      ""
    );
  } catch (err) {
    return "";
  }
}

function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("el-GR");
  } catch (err) {
    return String(value);
  }
}

function formatPriority(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "critical") return "Critical";
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  if (value === "low") return "Low";

  return priority || "-";
}

function getPriorityClass(priority) {
  const value = String(priority || "").toLowerCase();

  if (value === "critical") return "badge badge-critical";
  if (value === "high") return "badge badge-high";
  if (value === "medium") return "badge badge-medium";
  if (value === "low") return "badge badge-low";

  return "badge";
}

function getRiskClass(risk) {
  const value = String(risk || "").toLowerCase();

  if (value.includes("no_data")) return "risk risk-dark";
  if (value.includes("compliance")) return "risk risk-red";
  if (value.includes("therapy")) return "risk risk-orange";
  if (value.includes("new_setup")) return "risk risk-blue";
  if (value.includes("stable")) return "risk risk-green";
  if (value.includes("doctor")) return "risk risk-purple";

  return "risk";
}

function getComplianceClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "compliant") return "status status-green";
  if (value === "at_risk" || value === "early_risk" || value === "no_data") {
    return "status status-red";
  }
  if (value === "borderline" || value === "partial") {
    return "status status-orange";
  }

  return "status";
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="pd-stat-card">
      <div className="pd-stat-label">{label}</div>
      <div className="pd-stat-value">{value}</div>
      {subtext ? <div className="pd-stat-subtext">{subtext}</div> : null}
    </div>
  );
}

function SectionTitle({ kicker, title, subtitle }) {
  return (
    <div className="pd-section-title">
      <div className="pd-kicker">{kicker}</div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export default function PilotDemoDashboardPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setStatus("loading");
      setError("");

      const token = getAuthToken();

      if (!token) {
        setStatus("error");
        setError("Δεν υπάρχει ενεργό login token. Κάνε login ξανά.");
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/tenant/pilot-demo/dashboard`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": TENANT_ID,
            Accept: "application/json"
          }
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              `Pilot demo API failed with HTTP ${response.status}`
          );
        }

        if (!payload || payload.ok !== true) {
          throw new Error("Pilot demo API returned invalid payload.");
        }

        if (isMounted) {
          setData(payload);
          setStatus("ready");
        }
      } catch (err) {
        if (isMounted) {
          setStatus("error");
          setError(err?.message || "Pilot demo dashboard failed.");
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const patients = data?.patients || [];
  const devices = data?.devices || [];
  const compliance = data?.compliance || [];
  const atlasTasks = data?.atlas_tasks || [];
  const notes = data?.notes || [];
  const summary = data?.summary || {};

  const filteredPatients = useMemo(() => {
    if (selectedPatient === "ALL") return patients;
    return patients.filter((patient) => patient.demo_code === selectedPatient);
  }, [patients, selectedPatient]);

  const selectedPatientData = useMemo(() => {
    if (selectedPatient === "ALL") return null;
    return patients.find((patient) => patient.demo_code === selectedPatient) || null;
  }, [patients, selectedPatient]);

  const filteredTasks = useMemo(() => {
    if (selectedPatient === "ALL") return atlasTasks;
    return atlasTasks.filter((task) => task.patient_demo_code === selectedPatient);
  }, [atlasTasks, selectedPatient]);

  const filteredCompliance = useMemo(() => {
    if (selectedPatient === "ALL") return compliance;
    return compliance.filter((row) => row.patient_demo_code === selectedPatient);
  }, [compliance, selectedPatient]);

  const avgUsage = summary.average_usage_hours || "0.00";
  const riskPatients = numberValue(summary.risk_patients_count);
  const compliantPatients = numberValue(summary.compliant_patients_count);
  const totalPatients = numberValue(summary.patients_count);
  const riskRate =
    totalPatients > 0 ? Math.round((riskPatients / totalPatients) * 100) : 0;

  if (status === "loading") {
    return (
      <div className="pd-page">
        <style>{styles}</style>
        <div className="pd-loading-card">
          <div className="pd-spinner" />
          <h1>Loading RAFTOP Pilot Demo...</h1>
          <p>Σύνδεση με protected pilot demo API.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="pd-page">
        <style>{styles}</style>
        <div className="pd-error-card">
          <div className="pd-kicker">Pilot Demo Error</div>
          <h1>Δεν φορτώθηκε το demo dashboard</h1>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <style>{styles}</style>

      <header className="pd-hero">
        <div>
          <div className="pd-kicker">RAFTOP CPAP CARE Pro</div>
          <h1>Raftopoulos Pilot Demo Dashboard</h1>
          <p>
            Isolated pilot dataset για παρουσίαση: CPAP patients, devices,
            compliance, ATLAS actions και clinical follow-up prioritization.
          </p>
        </div>

        <div className="pd-hero-panel">
          <div className="pd-panel-label">Tenant</div>
          <div className="pd-panel-value">{data?.tenant_id || TENANT_ID}</div>
          <div className="pd-panel-subtext">Protected API verified</div>
        </div>
      </header>

      <section className="pd-stats-grid">
        <StatCard
          label="Demo Patients"
          value={summary.patients_count || 0}
          subtext={`${compliantPatients} compliant / ${riskPatients} need attention`}
        />
        <StatCard
          label="CPAP Devices"
          value={summary.devices_count || 0}
          subtext="ResMed, Philips, Lowenstein, Cefam"
        />
        <StatCard
          label="Compliance Nights"
          value={summary.compliance_nights_count || 0}
          subtext={`Average usage: ${avgUsage}h`}
        />
        <StatCard
          label="ATLAS Open Tasks"
          value={summary.open_tasks_count || 0}
          subtext={`${summary.critical_tasks_count || 0} critical / ${
            summary.high_tasks_count || 0
          } high`}
        />
        <StatCard
          label="Risk Load"
          value={`${riskRate}%`}
          subtext="Patients requiring operational attention"
        />
      </section>

      <section className="pd-control-strip">
        <div>
          <div className="pd-kicker">Demo Filter</div>
          <h2>Patient Focus</h2>
        </div>

        <select
          value={selectedPatient}
          onChange={(event) => setSelectedPatient(event.target.value)}
        >
          <option value="ALL">All demo patients</option>
          {patients.map((patient) => (
            <option key={patient.demo_code} value={patient.demo_code}>
              {patient.demo_code} — {patient.full_name}
            </option>
          ))}
        </select>
      </section>

      {selectedPatientData ? (
        <section className="pd-focus-card">
          <div>
            <div className="pd-kicker">Selected Patient</div>
            <h2>{selectedPatientData.full_name}</h2>
            <p>{selectedPatientData.clinical_summary}</p>
          </div>

          <div className="pd-focus-badges">
            <span className={getRiskClass(selectedPatientData.risk_segment)}>
              {selectedPatientData.risk_segment}
            </span>
            <span className={getComplianceClass(selectedPatientData.compliance_status)}>
              {selectedPatientData.compliance_status}
            </span>
          </div>
        </section>
      ) : null}

      <section className="pd-grid-2">
        <div className="pd-card">
          <SectionTitle
            kicker="ATLAS System"
            title="Action Queue"
            subtitle="Prioritized operational tasks for follow-up and intervention."
          />

          <div className="pd-task-list">
            {filteredTasks.map((task, index) => (
              <div className="pd-task" key={`${task.patient_demo_code}-${task.title}-${index}`}>
                <div className="pd-task-top">
                  <span className={getPriorityClass(task.priority)}>
                    {formatPriority(task.priority)}
                  </span>
                  <span className="pd-muted">{task.patient_demo_code}</span>
                </div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="pd-task-meta">
                  <span>{task.action_group}</span>
                  <span>Status: {task.status}</span>
                  <span>Due: {formatDate(task.due_at)}</span>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 ? (
              <div className="pd-empty">No ATLAS tasks for this filter.</div>
            ) : null}
          </div>
        </div>

        <div className="pd-card">
          <SectionTitle
            kicker="Compliance"
            title="7-Night Usage Snapshot"
            subtitle="Usage, AHI, leak and compliance flag per demo patient."
          />

          <div className="pd-table-wrap">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>AHI</th>
                  <th>Leak</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompliance.slice(0, 24).map((row, index) => (
                  <tr key={`${row.patient_demo_code}-${row.therapy_date}-${index}`}>
                    <td>{row.patient_demo_code}</td>
                    <td>{formatDate(row.therapy_date)}</td>
                    <td>{row.usage_hours}</td>
                    <td>{row.ahi}</td>
                    <td>{row.leak_l_min}</td>
                    <td>
                      <span className={getComplianceClass(row.compliance_flag)}>
                        {row.compliance_flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompliance.length > 24 ? (
            <div className="pd-table-note">
              Showing first 24 rows from {filteredCompliance.length}.
            </div>
          ) : null}
        </div>
      </section>

      <section className="pd-card">
        <SectionTitle
          kicker="Pilot Cohort"
          title="Demo Patients"
          subtitle="Prepared for Raftopoulos operational sales demonstration."
        />

        <div className="pd-patient-grid">
          {filteredPatients.map((patient) => {
            const patientDevice = devices.find(
              (device) => device.patient_demo_code === patient.demo_code
            );

            return (
              <div className="pd-patient-card" key={patient.demo_code}>
                <div className="pd-patient-head">
                  <div>
                    <div className="pd-code">{patient.demo_code}</div>
                    <h3>{patient.full_name}</h3>
                  </div>
                  <span className={getComplianceClass(patient.compliance_status)}>
                    {patient.compliance_status}
                  </span>
                </div>

                <p>{patient.clinical_summary}</p>

                <div className="pd-patient-meta">
                  <span>{patient.age} yrs</span>
                  <span>{patient.sex}</span>
                  <span>{patient.city}</span>
                </div>

                <div className="pd-device-line">
                  <strong>Device:</strong>{" "}
                  {patientDevice
                    ? `${patientDevice.device_brand} ${patientDevice.device_model}`
                    : "No device"}
                </div>

                <span className={getRiskClass(patient.risk_segment)}>
                  {patient.risk_segment}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pd-card">
        <SectionTitle
          kicker="Notes"
          title="Clinical / Operational Notes"
          subtitle="Concise notes used to support the pilot story."
        />

        <div className="pd-notes-grid">
          {notes.map((note, index) => (
            <div className="pd-note" key={`${note.patient_demo_code}-${index}`}>
              <div className="pd-note-top">
                <strong>{note.patient_demo_code}</strong>
                <span>{note.note_type}</span>
              </div>
              <p>{note.body}</p>
              <div className="pd-muted">Created by: {note.created_by}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = `
.pd-page {
  min-height: 100vh;
  padding: 34px;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 32%),
    linear-gradient(135deg, #07111f 0%, #0f172a 52%, #0f766e 130%);
  color: #e5f4ff;
  font-family: Inter, Arial, sans-serif;
  box-sizing: border-box;
}

.pd-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
  align-items: stretch;
  margin-bottom: 24px;
}

.pd-hero h1 {
  margin: 8px 0 12px;
  font-size: 44px;
  line-height: 1.02;
  letter-spacing: -0.04em;
  font-weight: 950;
}

.pd-hero p {
  max-width: 840px;
  color: #bfd6e5;
  font-size: 16px;
  line-height: 1.55;
  margin: 0;
}

.pd-kicker {
  color: #5eead4;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.16em;
}

.pd-hero-panel,
.pd-stat-card,
.pd-card,
.pd-focus-card,
.pd-control-strip,
.pd-loading-card,
.pd-error-card {
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
  border-radius: 28px;
}

.pd-hero-panel {
  padding: 26px;
}

.pd-panel-label {
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.pd-panel-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 950;
}

.pd-panel-subtext {
  margin-top: 10px;
  color: #047857;
  font-weight: 900;
}

.pd-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.pd-stat-card {
  padding: 22px;
}

.pd-stat-label {
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.pd-stat-value {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.pd-stat-subtext {
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.pd-control-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px;
  margin-bottom: 20px;
}

.pd-control-strip h2,
.pd-section-title h2,
.pd-focus-card h2 {
  margin: 6px 0 0;
  font-size: 24px;
  letter-spacing: -0.03em;
}

.pd-control-strip select {
  min-width: 360px;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 800;
  background: #fff;
}

.pd-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1.08fr;
  gap: 20px;
  margin-bottom: 20px;
}

.pd-card {
  padding: 24px;
}

.pd-section-title {
  margin-bottom: 18px;
}

.pd-section-title p {
  margin: 8px 0 0;
  color: #64748b;
  font-weight: 700;
  line-height: 1.45;
}

.pd-focus-card {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.pd-focus-card p {
  margin: 10px 0 0;
  color: #475569;
  font-weight: 700;
  line-height: 1.5;
}

.pd-focus-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pd-task-list {
  display: grid;
  gap: 12px;
}

.pd-task {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 20px;
  padding: 16px;
}

.pd-task-top,
.pd-task-meta,
.pd-patient-meta,
.pd-note-top {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.pd-task h3,
.pd-patient-card h3 {
  margin: 10px 0 8px;
  font-size: 17px;
  letter-spacing: -0.02em;
}

.pd-task p,
.pd-patient-card p,
.pd-note p {
  color: #475569;
  line-height: 1.45;
  font-size: 13px;
  font-weight: 700;
}

.pd-task-meta {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.badge,
.status,
.risk {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #e2e8f0;
  color: #334155;
}

.badge-critical,
.status-red,
.risk-red {
  background: #fee2e2;
  color: #991b1b;
}

.badge-high,
.status-orange,
.risk-orange {
  background: #ffedd5;
  color: #9a3412;
}

.badge-medium,
.risk-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-low,
.status-green,
.risk-green {
  background: #dcfce7;
  color: #166534;
}

.risk-dark {
  background: #e5e7eb;
  color: #111827;
}

.risk-purple {
  background: #ede9fe;
  color: #6d28d9;
}

.pd-table-wrap {
  overflow-x: auto;
}

.pd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.pd-table th {
  text-align: left;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.pd-table td {
  padding: 10px;
  border-bottom: 1px solid #eef2f7;
  font-weight: 750;
}

.pd-table-note {
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.pd-patient-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.pd-patient-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 16px;
}

.pd-patient-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.pd-code {
  font-size: 12px;
  font-weight: 950;
  color: #0f766e;
}

.pd-patient-meta {
  justify-content: flex-start;
  margin: 12px 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.pd-device-line {
  margin: 12px 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.4;
}

.pd-notes-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.pd-note {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 14px;
}

.pd-note-top span {
  color: #0f766e;
  font-size: 12px;
  font-weight: 950;
}

.pd-muted {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.pd-empty {
  padding: 20px;
  color: #64748b;
  font-weight: 800;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  text-align: center;
}

.pd-loading-card,
.pd-error-card {
  max-width: 560px;
  margin: 10vh auto;
  padding: 34px;
  text-align: center;
}

.pd-error-card h1,
.pd-loading-card h1 {
  margin: 12px 0;
  font-size: 30px;
}

.pd-error-card p,
.pd-loading-card p {
  color: #475569;
  font-weight: 700;
}

.pd-error-card button {
  margin-top: 16px;
  height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: #0f766e;
  color: #fff;
  font-weight: 950;
  cursor: pointer;
}

.pd-spinner {
  width: 34px;
  height: 34px;
  margin: 0 auto 18px;
  border-radius: 50%;
  border: 4px solid #ccfbf1;
  border-top-color: #0f766e;
  animation: pd-spin 0.9s linear infinite;
}

@keyframes pd-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .pd-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pd-grid-2 {
    grid-template-columns: 1fr;
  }

  .pd-patient-grid,
  .pd-notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pd-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .pd-page {
    padding: 18px;
  }

  .pd-hero h1 {
    font-size: 32px;
  }

  .pd-stats-grid,
  .pd-patient-grid,
  .pd-notes-grid {
    grid-template-columns: 1fr;
  }

  .pd-control-strip {
    display: grid;
    gap: 16px;
  }

  .pd-control-strip select {
    min-width: 0;
    width: 100%;
  }
}
`;