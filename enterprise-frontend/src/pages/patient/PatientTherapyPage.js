import React, { useEffect, useMemo, useState } from 'react';
import { getPatientTherapy } from './helpers/patientApi';

const FALLBACK_DATA = {
  overview: {
    myAirScore: 74,
    therapyStatus: 'on_track',
    avgUsageHours: 5.6,
    adherenceRate: 82,
    ahi: 3.8,
    leakRate: 18,
    streakDays: 9,
    lastSyncAt: new Date().toISOString()
  },
  trend: [
    { x: 1, usageHours: 4.8, ahi: 4.2, leakRate: 19 },
    { x: 2, usageHours: 5.1, ahi: 4.0, leakRate: 18 },
    { x: 3, usageHours: 5.5, ahi: 3.9, leakRate: 17 },
    { x: 4, usageHours: 6.0, ahi: 3.6, leakRate: 16 },
    { x: 5, usageHours: 5.8, ahi: 3.7, leakRate: 18 },
    { x: 6, usageHours: 6.3, ahi: 3.3, leakRate: 15 },
    { x: 7, usageHours: 5.9, ahi: 3.5, leakRate: 17 }
  ],
  nextGoal: 'Συνέχισε σταθερή χρήση >4 ώρες/νύχτα.',
  machine: {
    machineModel: 'CPAP Device',
    maskType: 'Standard mask'
  },
  recentSignals: []
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getStatusTone(status) {
  if (status === 'critical') return 'danger';
  if (status === 'at_risk') return 'warning';
  return 'success';
}

function buildMiniBars(trend) {
  const maxUsage = Math.max(...trend.map((item) => Number(item.usageHours || 0)), 1);

  return trend.map((item) => ({
    ...item,
    usageHeight: `${Math.max(12, (Number(item.usageHours || 0) / maxUsage) * 100)}%`
  }));
}

export default function PatientTherapyPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  async function loadTherapy() {
    setLoading(true);

    try {
      const payload = await getPatientTherapy();
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
    loadTherapy();
  }, []);

  const bars = useMemo(() => buildMiniBars(data.trend || []), [data.trend]);
  const toneClass = useMemo(
    () => getStatusTone(data.overview?.therapyStatus),
    [data.overview?.therapyStatus]
  );

  if (loading) {
    return (
      <div className="therapy-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading therapy page...</div>
      </div>
    );
  }

  return (
    <div className="therapy-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">THERAPY</div>
          <h1>Therapy Performance</h1>
          <p>
            Εδώ βλέπεις τη συνολική εικόνα της θεραπείας σου, την πρόσφατη τάση χρήσης και τα πιο σημαντικά metrics.
          </p>

          <div className="meta-row">
            <span className="pill">{data.machine?.machineModel || 'CPAP Device'}</span>
            <span className="pill">{data.machine?.maskType || 'Mask'}</span>
            <span className="pill">Last sync: {formatDateTime(data.overview?.lastSyncAt)}</span>
          </div>
        </div>

        <div className={`hero-score ${toneClass}`}>
          <div className="hero-score-label">Therapy Score</div>
          <div className="hero-score-value">{data.overview?.myAirScore ?? 0}</div>
          <div className="hero-score-subtitle">{data.overview?.therapyStatus || 'on_track'}</div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Τα therapy endpoints δεν απάντησαν και εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Avg Usage</div>
          <div className="metric-value">{data.overview?.avgUsageHours ?? 0}h</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Adherence</div>
          <div className="metric-value">{data.overview?.adherenceRate ?? 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">AHI</div>
          <div className="metric-value">{data.overview?.ahi ?? 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Leak Rate</div>
          <div className="metric-value">{data.overview?.leakRate ?? 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Streak</div>
          <div className="metric-value">{data.overview?.streakDays ?? 0} days</div>
        </div>

        <div className={`metric-card ${toneClass}`}>
          <div className="metric-label">Status</div>
          <div className="metric-value">{data.overview?.therapyStatus ?? 'on_track'}</div>
        </div>
      </section>

      <section className="two-col">
        <div className="page-card">
          <div className="section-title">7-Day Usage Trend</div>

          <div className="trend-chart">
            {bars.map((item) => (
              <div key={item.x} className="trend-col">
                <div className="trend-bar-wrap">
                  <div className="trend-bar" style={{ height: item.usageHeight }} />
                </div>
                <div className="trend-hours">{item.usageHours}h</div>
                <div className="trend-day">Day {item.x}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Coaching Snapshot</div>

          <div className="coaching-list">
            <div className="coach-item">
              <strong>Next Goal</strong>
              <p>{data.nextGoal || '—'}</p>
            </div>

            <div className="coach-item">
              <strong>AHI Focus</strong>
              <p>
                {Number(data.overview?.ahi || 0) <= 5
                  ? 'Το AHI φαίνεται ελεγχόμενο.'
                  : 'Το AHI χρειάζεται επανεκτίμηση από την ομάδα θεραπείας.'}
              </p>
            </div>

            <div className="coach-item">
              <strong>Leak Focus</strong>
              <p>
                {Number(data.overview?.leakRate || 0) <= 24
                  ? 'Η διαρροή μάσκας είναι σε αποδεκτό εύρος.'
                  : 'Η διαρροή μάσκας είναι αυξημένη. Εξέτασε καλύτερη εφαρμογή.'}
              </p>
            </div>

            <div className="coach-item">
              <strong>Usage Focus</strong>
              <p>
                {Number(data.overview?.avgUsageHours || 0) >= 4
                  ? 'Η χρήση είναι κοντά στον στόχο αποζημίωσης/compliance.'
                  : 'Χρειάζεται πιο σταθερή νυχτερινή χρήση.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-card">
        <div className="section-title">Recent Patient Signals</div>

        <div className="signals-list">
          {(data.recentSignals || []).length ? (
            data.recentSignals.map((signal) => (
              <div key={signal.id} className="signal-item">
                <div className="signal-head">
                  <strong>{signal.title}</strong>
                  <span className="signal-status">{signal.status}</span>
                </div>
                <div className="signal-body">{signal.description || '—'}</div>
                <div className="signal-meta">{formatDateTime(signal.createdAt)}</div>
              </div>
            ))
          ) : (
            <div className="empty-text">Δεν υπάρχουν πρόσφατα therapy-related signals.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .therapy-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .metric-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(6,182,212,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,254,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0891b2;
    margin-bottom: 8px;
  }

  .hero-card h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
  }

  .hero-card p {
    color: #475569;
    line-height: 1.7;
  }

  .meta-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
  }

  .hero-score {
    border-radius: 24px;
    padding: 22px;
    color: white;
  }

  .hero-score.success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  }

  .hero-score.warning {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .hero-score.danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .hero-score-label {
    font-size: 13px;
    font-weight: 800;
    opacity: 0.9;
  }

  .hero-score-value {
    font-size: 64px;
    font-weight: 900;
    line-height: 1;
    margin-top: 10px;
  }

  .hero-score-subtitle {
    margin-top: 10px;
    font-size: 14px;
    opacity: 0.9;
    text-transform: uppercase;
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

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
  }

  .metric-card {
    padding: 18px;
  }

  .metric-card.success {
    border: 1px solid #86efac;
    background: #ecfdf5;
  }

  .metric-card.warning {
    border: 1px solid #fdba74;
    background: #fff7ed;
  }

  .metric-card.danger {
    border: 1px solid #fecaca;
    background: #fef2f2;
  }

  .metric-label {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    margin-top: 10px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .trend-chart {
    height: 240px;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 12px;
    align-items: end;
  }

  .trend-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .trend-bar-wrap {
    width: 100%;
    height: 170px;
    border-radius: 16px;
    background: #f1f5f9;
    display: flex;
    align-items: end;
    padding: 8px;
    box-sizing: border-box;
  }

  .trend-bar {
    width: 100%;
    border-radius: 12px;
    background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
  }

  .trend-hours {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
  }

  .trend-day {
    font-size: 12px;
    color: #64748b;
  }

  .coaching-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .coach-item {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .coach-item p {
    margin: 8px 0 0;
    color: #475569;
    line-height: 1.6;
  }

  .signals-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .signal-item {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .signal-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .signal-status {
    font-size: 12px;
    font-weight: 800;
    color: #0f766e;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    border-radius: 999px;
    padding: 6px 10px;
    text-transform: uppercase;
  }

  .signal-body {
    margin-top: 8px;
    color: #475569;
    line-height: 1.6;
  }

  .signal-meta {
    margin-top: 8px;
    font-size: 12px;
    color: #64748b;
  }

  .empty-text {
    color: #64748b;
  }

  @media (max-width: 1280px) {
    .metrics-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .two-col {
      grid-template-columns: 1fr;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .trend-chart {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      height: auto;
    }
  }
`;