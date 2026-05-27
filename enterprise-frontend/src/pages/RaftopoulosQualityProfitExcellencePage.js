// enterprise-frontend/src/pages/RaftopoulosQualityProfitExcellencePage.js
// RAFTOP CPAP CARE Pro
// Phase 44.1 - Raftopoulos Quality & Profit Excellence Center
//
// Safe implementation:
// - Frontend-only page.
// - Reads existing protected pilot demo API.
// - Does not modify backend, database, auth or production data.
// - Uses configurable financial assumptions for estimated business impact.
// - Designed for Raftopoulos commercial presentation.

import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://raftop-cpap-backend.onrender.com";

const TENANT_ID = "raftopoulos-live";

const assumptions = {
  managedPatientsScenario: 7000,
  monthlySupportCostPerDefect: 8,
  estimatedRevenueProtectionPerRecoveredPatient: 18,
  estimatedDoctorRelationshipValuePerResolvedCase: 12,
  targetDefectReductionPercent: 35,
  targetFasterResolutionPercent: 45
};

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

function n(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function euro(value) {
  const amount = n(value);
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(amount);
}

function percent(value) {
  return `${Math.round(n(value))}%`;
}

function StatCard({ label, value, subtext, tone = "default" }) {
  return (
    <div className={`qp-stat qp-${tone}`}>
      <div className="qp-stat-label">{label}</div>
      <div className="qp-stat-value">{value}</div>
      {subtext ? <div className="qp-stat-subtext">{subtext}</div> : null}
    </div>
  );
}

function DmaicStep({ letter, title, body, metric }) {
  return (
    <div className="qp-dmaic-step">
      <div className="qp-dmaic-letter">{letter}</div>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        {metric ? <div className="qp-dmaic-metric">{metric}</div> : null}
      </div>
    </div>
  );
}

function DefectRow({ label, baseline, target, impact }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{baseline}</td>
      <td>{target}</td>
      <td>{impact}</td>
    </tr>
  );
}

export default function RaftopoulosQualityProfitExcellencePage() {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
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

        const json = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            json?.error ||
              json?.message ||
              `Pilot demo API failed with HTTP ${response.status}`
          );
        }

        if (!json || json.ok !== true) {
          throw new Error("Pilot demo API returned invalid payload.");
        }

        if (mounted) {
          setPayload(json);
          setStatus("ready");
        }
      } catch (err) {
        if (mounted) {
          setStatus("error");
          setError(err?.message || "Quality Profit page failed.");
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const model = useMemo(() => {
    const summary = payload?.summary || {};
    const patients = payload?.patients || [];
    const tasks = payload?.atlas_tasks || [];
    const compliance = payload?.compliance || [];

    const demoPatients = n(summary.patients_count || patients.length);
    const riskPatients = n(summary.risk_patients_count);
    const compliantPatients = n(summary.compliant_patients_count);
    const openTasks = n(summary.open_tasks_count);
    const criticalTasks = n(summary.critical_tasks_count);
    const highTasks = n(summary.high_tasks_count);
    const noDataNights = n(summary.no_data_nights);
    const lowUsageNights = n(summary.low_usage_nights);
    const avgUsage = n(summary.average_usage_hours);

    const leakIssuePatients = patients.filter((p) =>
      String(p.risk_segment || "").toLowerCase().includes("therapy")
    ).length;

    const noDataPatients = patients.filter((p) =>
      String(p.risk_segment || "").toLowerCase().includes("no_data")
    ).length;

    const newSetupPatients = patients.filter((p) =>
      String(p.risk_segment || "").toLowerCase().includes("new_setup")
    ).length;

    const complianceRiskPatients = patients.filter((p) =>
      String(p.risk_segment || "").toLowerCase().includes("compliance")
    ).length;

    const totalDefects =
      riskPatients + openTasks + noDataPatients + leakIssuePatients + complianceRiskPatients;

    const defectRate = demoPatients > 0 ? (riskPatients / demoPatients) * 100 : 0;

    const scaleFactor =
      demoPatients > 0 ? assumptions.managedPatientsScenario / demoPatients : 0;

    const scaledRiskPatients = riskPatients * scaleFactor;
    const scaledOpenTasks = openTasks * scaleFactor;
    const scaledNoDataPatients = noDataPatients * scaleFactor;
    const scaledLeakPatients = leakIssuePatients * scaleFactor;

    const monthlyDefectCost =
      (scaledOpenTasks + scaledNoDataPatients + scaledLeakPatients) *
      assumptions.monthlySupportCostPerDefect;

    const monthlyRevenueProtection =
      scaledRiskPatients *
      (assumptions.targetDefectReductionPercent / 100) *
      assumptions.estimatedRevenueProtectionPerRecoveredPatient;

    const monthlyDoctorRelationshipValue =
      scaledOpenTasks *
      (assumptions.targetFasterResolutionPercent / 100) *
      assumptions.estimatedDoctorRelationshipValuePerResolvedCase;

    const estimatedMonthlyImpact =
      monthlyDefectCost + monthlyRevenueProtection + monthlyDoctorRelationshipValue;

    const estimatedAnnualImpact = estimatedMonthlyImpact * 12;

    const topTasks = tasks.slice(0, 7);

    const lowUsageRows = compliance.filter((row) =>
      ["low_usage", "no_data", "borderline"].includes(String(row.compliance_flag || ""))
    );

    return {
      demoPatients,
      riskPatients,
      compliantPatients,
      openTasks,
      criticalTasks,
      highTasks,
      noDataNights,
      lowUsageNights,
      avgUsage,
      leakIssuePatients,
      noDataPatients,
      newSetupPatients,
      complianceRiskPatients,
      totalDefects,
      defectRate,
      scaledRiskPatients,
      scaledOpenTasks,
      scaledNoDataPatients,
      scaledLeakPatients,
      monthlyDefectCost,
      monthlyRevenueProtection,
      monthlyDoctorRelationshipValue,
      estimatedMonthlyImpact,
      estimatedAnnualImpact,
      topTasks,
      lowUsageRows
    };
  }, [payload]);

  if (status === "loading") {
    return (
      <div className="qp-page">
        <style>{styles}</style>
        <div className="qp-loading">
          <div className="qp-spinner" />
          <h1>Loading Quality & Profit Excellence Center...</h1>
          <p>Σύνδεση με protected pilot demo API.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="qp-page">
        <style>{styles}</style>
        <div className="qp-error">
          <div className="qp-kicker">Quality Layer Error</div>
          <h1>Δεν φορτώθηκε το Quality & Profit page</h1>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-page">
      <style>{styles}</style>

      <header className="qp-hero">
        <div>
          <div className="qp-kicker">RAFTOP Six Sigma Layer</div>
          <h1>Quality & Profit Excellence Center</h1>
          <p>
            Το RAFTOP δεν δείχνει απλώς CPAP δεδομένα. Μετατρέπει τα δεδομένα σε
            σύστημα DMAIC / Six Sigma για μείωση defects, καλύτερο follow-up,
            προστασία συμμόρφωσης και μετρήσιμο οικονομικό όφελος για τη Raftopoulos.
          </p>
        </div>

        <div className="qp-hero-card">
          <div className="qp-card-label">Commercial Positioning</div>
          <div className="qp-card-value">Profit Protection Layer</div>
          <div className="qp-card-subtext">
            Quality control + ATLAS actions + closed-loop improvement
          </div>
        </div>
      </header>

      <section className="qp-stats-grid">
        <StatCard
          label="Demo Defect Rate"
          value={percent(model.defectRate)}
          subtext={`${model.riskPatients} of ${model.demoPatients} patients need attention`}
          tone="warning"
        />
        <StatCard
          label="Open ATLAS Actions"
          value={model.openTasks}
          subtext={`${model.criticalTasks} critical / ${model.highTasks} high`}
          tone="danger"
        />
        <StatCard
          label="No-Data Patients"
          value={model.noDataPatients}
          subtext={`${model.noDataNights} no-data nights detected`}
          tone="dark"
        />
        <StatCard
          label="Leak / Therapy Issues"
          value={model.leakIssuePatients}
          subtext="Mask fit and therapy intervention opportunity"
          tone="warning"
        />
        <StatCard
          label="Estimated Annual Impact"
          value={euro(model.estimatedAnnualImpact)}
          subtext="Illustrative scenario for 7,000 managed patients"
          tone="success"
        />
      </section>

      <section className="qp-grid-2">
        <div className="qp-card">
          <div className="qp-kicker">DMAIC Operating Model</div>
          <h2>Πώς το RAFTOP γίνεται Six Sigma engine</h2>

          <div className="qp-dmaic-grid">
            <DmaicStep
              letter="D"
              title="Define"
              body="Ορίζουμε τα CPAP operational defects: no data, low usage, leak issue, missed follow-up, new setup risk."
              metric={`${model.totalDefects} demo defect signals`}
            />
            <DmaicStep
              letter="M"
              title="Measure"
              body="Μετράμε baseline: ασθενείς σε κίνδυνο, ανοικτά ATLAS tasks, usage nights, no-data nights και average usage."
              metric={`${model.avgUsage}h average usage`}
            />
            <DmaicStep
              letter="A"
              title="Analyze"
              body="Συνδέουμε κάθε defect με πιθανή αιτία: connectivity, mask fit, adherence, onboarding, doctor review."
              metric={`${model.noDataPatients} no-data / ${model.leakIssuePatients} leak issue`}
            />
            <DmaicStep
              letter="I"
              title="Improve"
              body="Το ATLAS μετατρέπει κάθε πρόβλημα σε παρέμβαση: call, mask refit, onboarding, doctor note, follow-up."
              metric={`${model.openTasks} open interventions`}
            />
            <DmaicStep
              letter="C"
              title="Control"
              body="Ελέγχουμε αν η παρέμβαση έφερε αποτέλεσμα και αν ο ασθενής επέστρεψε σε σταθερή συμμόρφωση."
              metric="Closed-loop quality control"
            />
          </div>
        </div>

        <div className="qp-card">
          <div className="qp-kicker">Estimated Profit Protection</div>
          <h2>Τι βλέπει ο αγοραστής ως κέρδος</h2>

          <div className="qp-impact-list">
            <div className="qp-impact-row">
              <span>Scenario managed patients</span>
              <strong>{assumptions.managedPatientsScenario.toLocaleString("el-GR")}</strong>
            </div>
            <div className="qp-impact-row">
              <span>Scaled risk patients</span>
              <strong>{Math.round(model.scaledRiskPatients).toLocaleString("el-GR")}</strong>
            </div>
            <div className="qp-impact-row">
              <span>Monthly operational defect cost avoided</span>
              <strong>{euro(model.monthlyDefectCost)}</strong>
            </div>
            <div className="qp-impact-row">
              <span>Monthly compliance/revenue protection</span>
              <strong>{euro(model.monthlyRevenueProtection)}</strong>
            </div>
            <div className="qp-impact-row">
              <span>Monthly doctor relationship value</span>
              <strong>{euro(model.monthlyDoctorRelationshipValue)}</strong>
            </div>
            <div className="qp-impact-row qp-impact-total">
              <span>Estimated annual impact</span>
              <strong>{euro(model.estimatedAnnualImpact)}</strong>
            </div>
          </div>

          <div className="qp-note">
            Οι αριθμοί είναι commercial modelling assumptions, όχι λογιστική πρόβλεψη.
            Στην πραγματική εγκατάσταση θα γίνουν configurable με πραγματικά δεδομένα
            Raftopoulos.
          </div>
        </div>
      </section>

      <section className="qp-card">
        <div className="qp-kicker">Defect Reduction Table</div>
        <h2>Πού ακριβώς δημιουργείται αξία</h2>

        <div className="qp-table-wrap">
          <table className="qp-table">
            <thead>
              <tr>
                <th>Operational Defect</th>
                <th>Current Baseline</th>
                <th>Target Improvement</th>
                <th>Business Impact</th>
              </tr>
            </thead>
            <tbody>
              <DefectRow
                label="No-data patients"
                baseline={`${model.noDataPatients} in demo / ~${Math.round(
                  model.scaledNoDataPatients
                )} scaled`}
                target="Reduce by 35–50%"
                impact="Fewer blind spots, faster support response"
              />
              <DefectRow
                label="Compliance risk patients"
                baseline={`${model.riskPatients} in demo / ~${Math.round(
                  model.scaledRiskPatients
                )} scaled`}
                target="Recover high-risk patients before monthly loss"
                impact="Revenue protection and better patient retention"
              />
              <DefectRow
                label="Leak / therapy issue"
                baseline={`${model.leakIssuePatients} in demo / ~${Math.round(
                  model.scaledLeakPatients
                )} scaled`}
                target="Route to mask refit playbook"
                impact="Better satisfaction, fewer complaints"
              />
              <DefectRow
                label="Open ATLAS tasks"
                baseline={`${model.openTasks} open actions / ~${Math.round(
                  model.scaledOpenTasks
                )} scaled`}
                target="Same-day prioritization"
                impact="Less chaos, less lost follow-up"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="qp-grid-2">
        <div className="qp-card">
          <div className="qp-kicker">ATLAS Improvement Playbooks</div>
          <h2>Οι ενέργειες που μειώνουν defects</h2>

          <div className="qp-task-list">
            {model.topTasks.map((task, index) => (
              <div className="qp-task" key={`${task.patient_demo_code}-${index}`}>
                <div className="qp-task-top">
                  <span className={`qp-badge qp-${task.priority || "medium"}`}>
                    {task.priority}
                  </span>
                  <span>{task.patient_demo_code}</span>
                </div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="qp-task-meta">
                  {task.action_group} · status: {task.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="qp-card">
          <div className="qp-kicker">Commercial Close</div>
          <h2>Το μήνυμα που πρέπει να ακούσει η Raftopoulos</h2>

          <div className="qp-script-box">
            “Με το RAFTOP δεν αγοράζετε ένα ακόμα dashboard. Αποκτάτε μηχανισμό
            ποιότητας και κέρδους για τους CPAP ασθενείς σας. Το σύστημα δείχνει
            ποιος κινδυνεύει, ποιος έχει no data, ποιος έχει leak, ποιος χρειάζεται
            follow-up και ποια ενέργεια πρέπει να γίνει σήμερα. Αυτό σημαίνει
            λιγότερα χαμένα περιστατικά, καλύτερη εξυπηρέτηση, ισχυρότερη σχέση με
            ιατρούς και δυνατότητα μεταπώλησης της υπηρεσίας.”
          </div>

          <div className="qp-close-grid">
            <div>
              <strong>Internal value</strong>
              <span>Έλεγχος 7,000 ασθενών</span>
            </div>
            <div>
              <strong>Operational value</strong>
              <span>ATLAS action queue</span>
            </div>
            <div>
              <strong>Quality value</strong>
              <span>DMAIC defect reduction</span>
            </div>
            <div>
              <strong>Commercial value</strong>
              <span>Resell to doctors / clinics</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = `
.qp-page {
  min-height: 100vh;
  padding: 34px;
  box-sizing: border-box;
  color: #e5f4ff;
  font-family: Inter, Arial, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 34%),
    linear-gradient(135deg, #07111f 0%, #0f172a 56%, #0f766e 140%);
}

.qp-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 22px;
}

.qp-kicker {
  color: #5eead4;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.16em;
}

.qp-hero h1 {
  margin: 10px 0 12px;
  font-size: 46px;
  line-height: 1.02;
  letter-spacing: -0.045em;
  font-weight: 950;
}

.qp-hero p {
  margin: 0;
  max-width: 920px;
  color: #cbd5e1;
  font-size: 16px;
  line-height: 1.55;
  font-weight: 700;
}

.qp-hero-card,
.qp-stat,
.qp-card,
.qp-loading,
.qp-error {
  background: rgba(255,255,255,0.96);
  color: #0f172a;
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.24);
}

.qp-hero-card {
  padding: 26px;
}

.qp-card-label {
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.qp-card-value {
  margin-top: 10px;
  font-size: 27px;
  font-weight: 950;
  color: #0f766e;
  line-height: 1.05;
}

.qp-card-subtext {
  margin-top: 10px;
  color: #475569;
  font-weight: 800;
  line-height: 1.4;
}

.qp-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.qp-stat {
  padding: 22px;
}

.qp-stat-label {
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.1em;
}

.qp-stat-value {
  margin-top: 10px;
  font-size: 31px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.qp-stat-subtext {
  margin-top: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.35;
}

.qp-success {
  border: 1px solid #bbf7d0;
}

.qp-warning {
  border: 1px solid #fde68a;
}

.qp-danger {
  border: 1px solid #fecaca;
}

.qp-dark {
  border: 1px solid #cbd5e1;
}

.qp-grid-2 {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 20px;
  margin-bottom: 20px;
}

.qp-card {
  padding: 24px;
}

.qp-card h2 {
  margin: 8px 0 18px;
  font-size: 25px;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.qp-dmaic-grid {
  display: grid;
  gap: 12px;
}

.qp-dmaic-step {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
}

.qp-dmaic-letter {
  width: 40px;
  height: 40px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f766e;
  color: #fff;
  font-weight: 950;
}

.qp-dmaic-step h3 {
  margin: 0 0 6px;
  font-size: 17px;
}

.qp-dmaic-step p {
  margin: 0;
  color: #475569;
  line-height: 1.45;
  font-size: 13px;
  font-weight: 700;
}

.qp-dmaic-metric {
  margin-top: 8px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 950;
}

.qp-impact-list {
  display: grid;
  gap: 10px;
}

.qp-impact-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-weight: 800;
}

.qp-impact-row strong {
  color: #0f766e;
  font-weight: 950;
  text-align: right;
}

.qp-impact-total {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.qp-note {
  margin-top: 14px;
  border-radius: 16px;
  padding: 14px;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.qp-table-wrap {
  overflow-x: auto;
}

.qp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.qp-table th {
  text-align: left;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 11px;
  border-bottom: 1px solid #e2e8f0;
}

.qp-table td {
  padding: 12px;
  border-bottom: 1px solid #eef2f7;
  color: #334155;
  font-weight: 780;
  line-height: 1.45;
}

.qp-task-list {
  display: grid;
  gap: 12px;
}

.qp-task {
  padding: 15px;
  border-radius: 19px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.qp-task-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.qp-task h3 {
  margin: 10px 0 8px;
  font-size: 17px;
}

.qp-task p {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 700;
}

.qp-task-meta {
  margin-top: 10px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
}

.qp-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  background: #e2e8f0;
  color: #334155;
}

.qp-critical {
  background: #fee2e2;
  color: #991b1b;
}

.qp-high {
  background: #ffedd5;
  color: #9a3412;
}

.qp-medium {
  background: #dbeafe;
  color: #1d4ed8;
}

.qp-low {
  background: #dcfce7;
  color: #166534;
}

.qp-script-box {
  border-radius: 20px;
  padding: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 15px;
  line-height: 1.65;
  font-weight: 800;
}

.qp-close-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.qp-close-grid div {
  padding: 14px;
  border-radius: 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.qp-close-grid strong {
  display: block;
  color: #065f46;
  margin-bottom: 5px;
}

.qp-close-grid span {
  color: #047857;
  font-size: 13px;
  font-weight: 800;
}

.qp-loading,
.qp-error {
  max-width: 620px;
  margin: 10vh auto;
  padding: 34px;
  text-align: center;
}

.qp-loading h1,
.qp-error h1 {
  margin: 12px 0;
}

.qp-loading p,
.qp-error p {
  color: #475569;
  font-weight: 700;
}

.qp-error button {
  margin-top: 14px;
  height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: #0f766e;
  color: #fff;
  font-weight: 950;
  cursor: pointer;
}

.qp-spinner {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 4px solid #ccfbf1;
  border-top-color: #0f766e;
  margin: 0 auto 18px;
  animation: qp-spin 0.9s linear infinite;
}

@keyframes qp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1220px) {
  .qp-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .qp-grid-2,
  .qp-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .qp-page {
    padding: 18px;
  }

  .qp-hero h1 {
    font-size: 32px;
  }

  .qp-stats-grid,
  .qp-close-grid {
    grid-template-columns: 1fr;
  }
}
`;