import React, { useEffect, useMemo, useState } from 'react';
import {
  generatePatientReport,
  getPatientReportsDashboard
} from './helpers/reportsApi';
import {
  formatDateTime,
  labelFromReportType,
  toneFromRiskLevel
} from './helpers/reportsHelpers';

const FALLBACK_DATA = {
  currentReport: {
    id: 'report_demo_patient',
    reportType: 'patient_safe',
    title: 'Patient Summary Report — Patient Demo',
    generatedAt: new Date().toISOString(),
    patient: {
      fullName: 'Patient Demo',
      email: 'patient@raftop.local'
    },
    summary: {
      patientName: 'Patient Demo',
      patientEmail: 'patient@raftop.local',
      selectedDate: '2026-04-29',
      usageHours: 5.8,
      ahi: 2.6,
      leakRate: 14.2,
      minSpo2: 92.4,
      coachingInProgress: 1,
      openSignals: 1,
      unresolvedTasks: 1,
      riskLevel: 'medium'
    },
    atlasRecommendation: {
      riskLevel: 'medium',
      recommendedNextAction: 'Review coaching adherence, mask fit and nightly trend before next visit.',
      priorityReason: 'Suboptimal therapy pattern needs structured monitoring.',
      followupWindow: 'within 72h'
    },
    sections: [
      {
        key: 'therapy_snapshot',
        title: 'Therapy Snapshot',
        items: ['Usage: 5.8h', 'AHI: 2.6', 'Leak: 14.2', 'Mask Seal: 90%']
      },
      {
        key: 'physiology_snapshot',
        title: 'Physiology Snapshot',
        items: ['Min SpO2: 92.4', 'Avg SpO2: 94.1', 'Pulse Avg: 69', 'Desaturation Events: 2']
      },
      {
        key: 'next_steps',
        title: 'Next Steps',
        items: [
          'Review coaching adherence, mask fit and nightly trend before next visit.',
          'Suggested follow-up window: within 72h'
        ]
      }
    ]
  },
  history: [
    {
      id: 'report_hist_1',
      reportType: 'patient_safe',
      title: 'Patient Summary Report — Patient Demo',
      riskLevel: 'medium',
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

export default function PatientReportsPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  async function loadDashboard(preferredHistoryId = '') {
    setLoading(true);

    try {
      const payload = await getPatientReportsDashboard();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setFlashMessage('');
      setSelectedHistoryId(preferredHistoryId || payload?.history?.[0]?.id || '');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setSelectedHistoryId(preferredHistoryId || FALLBACK_DATA.history[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

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

  async function handleGenerateReport() {
    setBusy(true);
    setFlashMessage('');

    try {
      await generatePatientReport();
      setFlashMessage('Το patient-safe report δημιουργήθηκε επιτυχώς.');
      await loadDashboard();
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία δημιουργίας report');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="patient-reports-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient reports...</div>
      </div>
    );
  }

  return (
    <div className="patient-reports-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">REPORT GENERATOR</div>
          <h1>Patient Reports</h1>
          <p>
            Patient-safe summary με therapy snapshot, physiology snapshot, coaching context και next steps.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{currentReport.patient?.fullName || 'Patient'}</span>
            <span className="hero-chip">{currentReport.patient?.email || '—'}</span>
            <span className={`badge ${badgeClass(toneFromRiskLevel(currentReport.atlasRecommendation?.riskLevel))}`}>
              Risk {currentReport.atlasRecommendation?.riskLevel || 'low'}
            </span>
          </div>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="primary-btn"
            disabled={busy}
            onClick={handleGenerateReport}
          >
            {busy ? 'Generating...' : 'Generate New Report'}
          </button>

          <div className="generated-at">
            Last generated: {formatDateTime(currentReport.generatedAt)}
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Reports page σε fallback mode. Εμφανίζονται demo δεδομένα.
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
          <div className="section-title">Current Report</div>

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
                <button
                  key={item.id}
                  type="button"
                  className={`history-row ${selectedHistoryId === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedHistoryId(item.id)}
                >
                  <div className="history-title">{item.title}</div>
                  <div className="history-meta">
                    {labelFromReportType(item.reportType)} • {formatDateTime(item.createdAt)}
                  </div>
                  <div className="history-meta">
                    <span className={`mini-badge ${badgeClass(toneFromRiskLevel(item.riskLevel))}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="muted-inline">No report history yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-reports-page {
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
    grid-template-columns: 1.35fr 280px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,242,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4f46e5;
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
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12px;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    color: #fff;
    cursor: pointer;
  }

  .generated-at {
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
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

  .section-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
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
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .history-row.active {
    background: #eef2ff;
    border-color: #c7d2fe;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
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
  }
`;