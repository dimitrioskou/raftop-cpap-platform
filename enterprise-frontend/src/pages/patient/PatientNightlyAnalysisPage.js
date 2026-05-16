import React, { useEffect, useMemo, useState } from 'react';
import { getPatientNightlyAnalysis } from './helpers/nightlyAnalysisApi';
import {
  badgeToneFromInsightType,
  buildFlagCards,
  formatDateLabel
} from './helpers/nightlyInsightHelpers';

const FALLBACK_DATA = {
  availableDates: ['2026-04-28', '2026-04-27', '2026-04-26'],
  selectedDate: '2026-04-28',
  previousDate: '2026-04-27',
  night: {
    date: '2026-04-28',
    usageHours: 6.4,
    ahi: 2.6,
    leakRate: 12.2,
    avgPressure: 8.4,
    maskSeal: 93,
    interruptions: 1,
    sessionStart: '2026-04-28T22:24:00.000Z',
    sessionEnd: '2026-04-29T04:48:00.000Z',
    deviceModel: 'AirSense 10',
    maskType: 'Nasal Mask'
  },
  flags: {
    lowUsage: false,
    highLeak: false,
    residualAhiRisk: false,
    fragmentedSleep: false,
    maskSealConcern: false
  },
  insights: [
    {
      type: 'positive',
      title: 'Stable therapy night',
      description: 'Καλή χρήση με ελεγχόμενη διαρροή και ικανοποιητικό AHI.'
    }
  ],
  recommendations: [
    'Συνέχισε με σταθερό nightly use και παρακολούθηση της συνέπειας.'
  ],
  trendPoints: [
    { label: '22:30', pressure: 8.2, leakRate: 11, ahiSignal: 2.3, stability: 88 },
    { label: '23:15', pressure: 8.5, leakRate: 12, ahiSignal: 2.1, stability: 90 },
    { label: '00:00', pressure: 8.3, leakRate: 11.5, ahiSignal: 2.4, stability: 89 },
    { label: '00:45', pressure: 8.6, leakRate: 13, ahiSignal: 2.8, stability: 86 }
  ]
};

function metricCard(title, value, subtitle) {
  return { title, value, subtitle };
}

export default function PatientNightlyAnalysisPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  async function loadNight(date = '') {
    setLoading(true);

    try {
      const payload = await getPatientNightlyAnalysis(date);
      setData(payload || FALLBACK_DATA);
      setSelectedDate(payload?.selectedDate || FALLBACK_DATA.selectedDate);
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setSelectedDate(FALLBACK_DATA.selectedDate);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNight();
  }, []);

  const metricCards = useMemo(() => {
    return [
      metricCard('Usage', `${data.night?.usageHours ?? 0}h`, 'Nightly therapy usage'),
      metricCard('AHI', data.night?.ahi ?? 0, 'Residual events'),
      metricCard('Leak', data.night?.leakRate ?? 0, 'Mask leak rate'),
      metricCard('Pressure', data.night?.avgPressure ?? 0, 'Average pressure'),
      metricCard('Mask Seal', `${data.night?.maskSeal ?? 0}%`, 'Mask fit quality'),
      metricCard('Interruptions', data.night?.interruptions ?? 0, 'Night session breaks')
    ];
  }, [data]);

  const flagCards = useMemo(() => buildFlagCards(data.flags || {}), [data.flags]);

  if (loading) {
    return (
      <div className="patient-nightly-analysis-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading nightly analysis...</div>
      </div>
    );
  }

  return (
    <div className="patient-nightly-analysis-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">NIGHTLY ANALYSIS</div>
          <h1>Night-by-Night Therapy Review</h1>
          <p>
            Αναλυτική εικόνα της τελευταίας νύχτας με flags, trend points και πρακτικές συστάσεις.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{formatDateLabel(data.selectedDate)}</span>
            <span className="hero-chip">{data.night?.deviceModel || 'CPAP Device'}</span>
            <span className="hero-chip">{data.night?.maskType || 'Mask'}</span>
          </div>
        </div>

        <div className="hero-controls">
          <div className="control-label">Night</div>
          <select
            className="input"
            value={selectedDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              setSelectedDate(nextDate);
              loadNight(nextDate);
            }}
          >
            {(data.availableDates || []).map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          {data.previousDate ? (
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                window.location.href = `/patient/compare-nights?date=${encodeURIComponent(data.selectedDate)}&otherDate=${encodeURIComponent(data.previousDate)}`;
              }}
            >
              Compare with Previous Night
            </button>
          ) : null}
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Nightly analysis σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="metrics-grid">
        {metricCards.map((card) => (
          <div key={card.title} className="metric-card">
            <div className="metric-label">{card.title}</div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-subtitle">{card.subtitle}</div>
          </div>
        ))}
      </section>

      <section className="flags-card page-card">
        <div className="section-title">Night Flags</div>
        <div className="flag-grid">
          {flagCards.map((flag) => (
            <div key={flag.key} className={`flag-pill ${flag.tone}`}>
              <span>{flag.label}</span>
              <strong>{flag.active ? 'ON' : 'OK'}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="analysis-grid">
        <div className="page-card">
          <div className="section-title">Night Trend</div>

          <div className="trend-chart">
            {(data.trendPoints || []).map((point, index) => (
              <div key={`${point.label}-${index}`} className="trend-row">
                <div className="trend-time">{point.label}</div>
                <div className="trend-bars">
                  <div className="bar-wrap">
                    <div className="bar-label">Pressure</div>
                    <div className="bar-track">
                      <div className="bar-fill pressure" style={{ width: `${Math.min(100, point.pressure * 8)}%` }} />
                    </div>
                  </div>

                  <div className="bar-wrap">
                    <div className="bar-label">Leak</div>
                    <div className="bar-track">
                      <div className="bar-fill leak" style={{ width: `${Math.min(100, point.leakRate * 3)}%` }} />
                    </div>
                  </div>

                  <div className="bar-wrap">
                    <div className="bar-label">Stability</div>
                    <div className="bar-track">
                      <div className="bar-fill stability" style={{ width: `${Math.min(100, point.stability)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Insights</div>

          <div className="insight-list">
            {(data.insights || []).map((insight, index) => (
              <div key={`${insight.title}-${index}`} className={`insight-card ${badgeToneFromInsightType(insight.type)}`}>
                <div className="insight-title">{insight.title}</div>
                <div className="insight-text">{insight.description}</div>
              </div>
            ))}
          </div>

          <div className="section-title spaced">Recommendations</div>
          <div className="recommendation-list">
            {(data.recommendations || []).map((item, index) => (
              <div key={`${item}-${index}`} className="recommendation-item">
                <div className="recommendation-index">{index + 1}</div>
                <div className="recommendation-text">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-nightly-analysis-page {
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
    grid-template-columns: 1.35fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(8,145,178,0.12), transparent 28%),
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
  }

  .hero-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #ecfeff;
    color: #0f766e;
    border: 1px solid #a5f3fc;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .control-label,
  .section-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .section-title.spaced {
    margin-top: 16px;
  }

  .input {
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #0891b2 0%, #155e75 100%);
    color: #fff;
    cursor: pointer;
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
    gap: 12px;
  }

  .metric-card {
    padding: 16px;
  }

  .metric-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .metric-subtitle {
    margin-top: 8px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
  }

  .flags-card,
  .page-card {
    padding: 20px;
  }

  .flag-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .flag-pill {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 900;
  }

  .flag-pill.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .flag-pill.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .analysis-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 18px;
  }

  .trend-chart {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .trend-row {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 12px;
    align-items: center;
  }

  .trend-time {
    font-size: 12px;
    font-weight: 900;
    color: #475569;
  }

  .trend-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bar-wrap {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 10px;
    align-items: center;
  }

  .bar-label {
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
  }

  .bar-track {
    height: 10px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .bar-fill.pressure {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  .bar-fill.leak {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .bar-fill.stability {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  }

  .insight-list,
  .recommendation-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .insight-card {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid transparent;
  }

  .insight-card.success {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .insight-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }

  .insight-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .insight-card.neutral {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }

  .insight-title {
    font-size: 14px;
    font-weight: 900;
  }

  .insight-text {
    margin-top: 6px;
    line-height: 1.6;
  }

  .recommendation-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .recommendation-index {
    width: 30px;
    min-width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ecfeff;
    color: #0f766e;
    font-weight: 900;
  }

  .recommendation-text {
    color: #334155;
    line-height: 1.6;
  }

  @media (max-width: 1200px) {
    .metrics-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .flag-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .analysis-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .metrics-grid,
    .flag-grid {
      grid-template-columns: 1fr;
    }
  }
`;