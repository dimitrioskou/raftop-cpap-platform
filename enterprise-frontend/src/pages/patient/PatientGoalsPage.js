import React, { useEffect, useState } from 'react';
import { getPatientGoals } from './helpers/patientApi';

const FALLBACK_DATA = {
  summary: {
    total: 3,
    activeCount: 2,
    completedCount: 1
  },
  items: [
    {
      id: 'goal-usage',
      title: 'Use CPAP at least 4h/night',
      description: 'Στόχος συμμόρφωσης για σταθερή θεραπεία.',
      status: 'active',
      progressPercent: 78,
      targetValue: '4h/night'
    }
  ]
};

function progressTone(progress) {
  if (progress >= 100) return 'success';
  if (progress >= 60) return 'warning';
  return 'neutral';
}

export default function PatientGoalsPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  async function loadGoals() {
    setLoading(true);

    try {
      const payload = await getPatientGoals();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  if (loading) {
    return (
      <div className="patient-goals-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="patient-goals-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">GOALS</div>
          <h1>Therapy Goals</h1>
          <p>
            Στόχοι συμμόρφωσης, streak και βελτίωσης θεραπευτικής συμπεριφοράς.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Active <strong>{data.summary?.activeCount ?? 0}</strong></div>
          <div className="summary-pill">Completed <strong>{data.summary?.completedCount ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Goals σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="goals-list">
        {(data.items || []).map((goal) => (
          <div key={goal.id} className="page-card goal-card">
            <div className="goal-top">
              <div>
                <div className="goal-title">{goal.title}</div>
                <div className="goal-desc">{goal.description || '—'}</div>
              </div>

              <div className={`goal-status ${progressTone(goal.progressPercent)}`}>
                {goal.status || 'active'}
              </div>
            </div>

            <div className="goal-meta">
              Target: <strong>{goal.targetValue || '—'}</strong>
            </div>

            <div className="progress-wrap">
              <div
                className={`progress-bar ${progressTone(goal.progressPercent)}`}
                style={{ width: `${Math.max(0, Math.min(100, Number(goal.progressPercent || 0)))}%` }}
              />
            </div>

            <div className="progress-label">
              {goal.progressPercent ?? 0}%
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-goals-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card, .page-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 360px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(22,163,74,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #16a34a;
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

  .summary-grid {
    display: grid;
    gap: 12px;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #ecfdf5;
    border: 1px solid #86efac;
    color: #047857;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
  }

  .summary-pill strong {
    color: #0f172a;
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

  .goals-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .page-card {
    padding: 18px;
  }

  .goal-top {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
  }

  .goal-title {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .goal-desc {
    margin-top: 8px;
    color: #475569;
    line-height: 1.6;
  }

  .goal-status {
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .goal-status.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .goal-status.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .goal-status.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .goal-meta {
    margin-top: 12px;
    font-size: 13px;
    color: #64748b;
  }

  .progress-wrap {
    margin-top: 14px;
    height: 14px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    border-radius: 999px;
  }

  .progress-bar.success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  }

  .progress-bar.warning {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .progress-bar.neutral {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .progress-label {
    margin-top: 10px;
    font-weight: 900;
    color: #0f172a;
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }
  }
`;