import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  generateTenantPatientReport,
  getTenantPatientReport
} from './patient/helpers/reportsApi';
import {
  formatDateTime,
  labelFromReportType,
  toneFromRiskLevel
} from './patient/helpers/reportsHelpers';

const FALLBACK_DATA = {
  patientContext: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  currentReport: {
    id: 'report_demo_clinician',
    reportType: 'clinician',
    title: 'Clinician Review Report — Patient Demo',
    generatedAt: new Date().toISOString(),
    patient: {
      fullName: 'Patient Demo',
      email: 'patient@raftop.local'
    },
    summary: {
      patientName: 'Patient Demo',
      patientEmail: 'patient@raftop.local',
      selectedDate: '2026-04-29',
      usageHours: 3.8,
      ahi: 4.9,
      leakRate: 27.1,
      minSpo2: 89.4,
      coachingInProgress: 1,
      openSignals: 2,
      unresolvedTasks: 2,
      riskLevel: 'high'
    },
    atlasRecommendation: {
      riskLevel: 'high',
      recommendedNextAction: 'Provider review and direct patient follow-up are recommended.',
      priorityReason: 'High-risk signal or unstable therapy/physiology pattern detected.',
      followupWindow: 'within 24h'
    },
    sections: [
      {
        key: 'clinical_snapshot',
        title: 'Clinical Snapshot',
        items: ['Usage 3.8h', 'AHI 4.9', 'Leak 27.1', 'Pressure 8.4', 'Min SpO2 89.4', 'Pulse Avg 72']
      },
      {
        key: 'workflow_snapshot',
        title: 'Workflow Snapshot',
        items: ['Signals total: 3', 'Critical open signals: 1', 'Tasks total: 2', 'Unresolved tasks: 2', 'Critical tasks: 1']
      },
      {
        key: 'atlas_recommendation',
        title: 'ATLAS Recommendation',
        items: ['Risk Level: high', 'Next Action: Provider review and direct patient follow-up are recommended.']
      }
    ]
  },
  history: [
    {
      id: 'tenant_report_hist_1',
      reportType: 'clinician',
      title: 'Clinician Review Report — Patient Demo',
      riskLevel: 'high',
      createdAt: new Date().toISOString()
    }
  ]
};

function badgeClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

export default function TenantPatientReportsPage() {
  const params = useParams();
  const [patientRef, setPatientRef] = useState(params.patientRef || 'patient@raftop.local');
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadReport(ref = patientRef) {
    setLoading(true);

    try {
      const payload = await getTenantPatientReport(ref);
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setFlashMessage('');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(patientRef);
  }, [params.patientRef]);

  const currentReport = data.currentReport || FALLBACK_DATA.currentReport;

  const summaryCards = useMemo(() => {
    return [
      { label: 'Usage', value: `${currentReport.summary?.usageHours ?? 0}h` },
      { label: 'AHI', value: currentReport.summary?.ahi ?? 0 },
      { label: 'Leak', value: currentReport.summary?.leakRate ?? 0 },
      { label: 'Min SpO2', value: currentReport.summary?.minSpo2 ?? 0 },
      { label: 'Open Signals', value: currentReport.summary?.openSignals ?? 0 },
      { label: 'Unresolved Tasks', value: currentReport.summary?.unresolvedTasks ?? 0 }
    ];
  }, [currentReport]);

  async function handleLoadPatient() {
    await loadReport(patientRef);
  }

  async function handleGenerateReport() {
    setBusy(true);
    setFlashMessage('');

    try {
      await generateTenantPatientReport(patientRef);
      setFlashMessage('Το clinician report δημιουργήθηκε επιτυχώς.');
      await loadReport(patientRef);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία δημιουργίας clinician report');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="tenant-patient-reports-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading tenant patient report...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-reports-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">CLINICIAN REPORT</div>
          <h1>Tenant Patient Reports</h1>
          <p>
            Clinician-focused report με clinical snapshot, workflow snapshot και ATLAS recommendation.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{currentReport.patient?.fullName || data.patientContext?.fullName || 'Patient'}</span>
            <span className="hero-chip">{currentReport.patient?.email || data.patientContext?.email || '—'}</span>
            <span className={`badge ${badgeClass(toneFromRiskLevel(currentReport.atlasRecommendation?.riskLevel))}`}>
              Risk {currentReport.atlasRecommendation?.riskLevel || 'low'}
            </span>
          </div>
        </div>

        <div className="hero-actions">
          <div className="field">
            <label className="field-label">Patient Email or ID</label>
            <input
              className="input"
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="patient@raftop.local"
            />
          </div>

          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={handleLoadPatient}>
              Load
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={busy}
              onClick={handleGenerateReport}
            >
              {busy ? 'Generating...' : 'Generate Clinician Report'}
            </button>
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Tenant reports page σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="summary-card">
            <div className="summary-label">{card.label}</div>
            <div className="summary-value">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Current Clinician Report</div>

          <div className="report-top">
            <div className="report-title">{currentReport.title}</div>
            <div className="report-meta">
              {labelFromReportType(currentReport.reportType)} • {formatDateTime(currentReport.generatedAt)}
            </div>
          </div>

          <div className="atlas-card">
            <div className="atlas-title">ATLAS Recommendation</div>
            <div className="atlas-row">
              <span className="label">Risk Level</span>
              <span className={`badge ${badgeClass(toneFromRiskLevel(currentReport.atlasRecommendation?.riskLevel))}`}>
                {currentReport.atlasRecommendation?.riskLevel || 'low'}
              </span>
            </div>
            <div className="atlas-row">
              <span className="label">Next Action</span>
              <span>{currentReport.atlasRecommendation?.recommendedNextAction || '—'}</span>
            </div>
            <div className="atlas-row">
              <span className="label">Priority Reason</span>
              <span>{currentReport.atlasRecommendation?.priorityReason || '—'}</span>
            </div>
            <div className="atlas-row">
              <span className="label">Follow-up Window</span>
              <span>{currentReport.atlasRecommendation?.followupWindow || '—'}</span>
            </div>
          </div>

          <div className="sections-wrap">
            {(currentReport.sections || []).map((section) => (
              <div key={section.key} className="section-card">
                <div className="section-card-title">{section.title}</div>
                <div className="section-items">
                  {(section.items || []).map((item, index) => (
                    <div key={`${section.key}-${index}`} className="section-item">
                      <span className="dot">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Report History</div>

          <div className="history-list">
            {(data.history || []).length ? (
              data.history.map((item) => (
                <div key={item.id} className="history-row">
                  <div className="history-title">{item.title}</div>
                  <div className="history-meta">
                    {labelFromReportType(item.reportType)} • {formatDateTime(item.createdAt)}
                  </div>
                  <div className="history-meta">
                    <span className={`mini-badge ${badgeClass(toneFromRiskLevel(item.riskLevel))}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No clinician report history yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-reports-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .summary-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(234,88,12,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,237,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ea580c;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .hero-meta {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label,
  .section-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .button-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .primary-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .banner {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
  }

  .banner.warning {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
  }

  .banner.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .summary-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .report-top {
    margin-bottom: 14px;
  }

  .report-title {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
  }

  .report-meta,
  .history-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .atlas-card {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .atlas-title,
  .section-card-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .atlas-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-top: 1px solid #e5e7eb;
  }

  .atlas-row:first-of-type {
    border-top: 0;
  }

  .label {
    color: #475569;
    font-weight: 800;
  }

  .sections-wrap {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-card {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .section-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-item {
    display: flex;
    gap: 8px;
    color: #334155;
    line-height: 1.6;
  }

  .dot {
    font-weight: 900;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .history-row {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
  }

  .history-title {
    font-weight: 900;
    color: #0f172a;
  }

  .badge,
  .mini-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .mini-badge {
    padding: 6px 8px;
  }

  .badge.success,
  .mini-badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.warning,
  .mini-badge.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge.danger,
  .mini-badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge.neutral,
  .mini-badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 1200px) {
    .summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .button-row {
      flex-direction: column;
    }
  }
`;