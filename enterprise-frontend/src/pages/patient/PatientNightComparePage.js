import React, { useEffect, useState } from 'react';
import { getPatientNightComparison, getPatientNightlyAnalysis } from './helpers/nightlyAnalysisApi';
import {
  compareToneFromDelta,
  formatDateLabel
} from './helpers/nightlyInsightHelpers';

const FALLBACK_COMPARE = {
  availableDates: ['2026-04-28', '2026-04-27', '2026-04-26'],
  current: {
    night: {
      date: '2026-04-28',
      usageHours: 6.2,
      ahi: 2.4,
      leakRate: 11.8,
      avgPressure: 8.3,
      maskSeal: 93,
      interruptions: 1
    }
  },
  comparison: {
    night: {
      date: '2026-04-27',
      usageHours: 4.8,
      ahi: 4.1,
      leakRate: 21.4,
      avgPressure: 8.0,
      maskSeal: 86,
      interruptions: 2
    }
  },
  deltas: {
    usageHours: { current: 6.2, previous: 4.8, delta: '+1.4h' },
    ahi: { current: 2.4, previous: 4.1, delta: '-1.7' },
    leakRate: { current: 11.8, previous: 21.4, delta: '-9.6' },
    avgPressure: { current: 8.3, previous: 8.0, delta: '+0.3' },
    maskSeal: { current: 93, previous: 86, delta: '+7%' }
  },
  interpretation: [
    'Η τρέχουσα νύχτα είχε καλύτερη χρήση από τη νύχτα σύγκρισης.',
    'Η διαρροή μάσκας βελτιώθηκε.',
    'Το residual AHI ήταν χαμηλότερο στην τρέχουσα νύχτα.'
  ]
};

export default function PatientNightComparePage() {
  const [availableDates, setAvailableDates] = useState(FALLBACK_COMPARE.availableDates);
  const [date, setDate] = useState(FALLBACK_COMPARE.current.night.date);
  const [otherDate, setOtherDate] = useState(FALLBACK_COMPARE.comparison.night.date);
  const [data, setData] = useState(FALLBACK_COMPARE);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  async function loadAvailableDates() {
    try {
      const nightly = await getPatientNightlyAnalysis();
      const dates = nightly?.availableDates || [];
      if (dates.length) {
        setAvailableDates(dates);
        setDate((prev) => prev || dates[0]);
        setOtherDate((prev) => prev || dates[1] || dates[0]);
      }
    } catch (_error) {
      // keep fallback
    }
  }

  async function loadComparison(nextDate, nextOtherDate) {
    setLoading(true);

    try {
      const payload = await getPatientNightComparison(nextDate, nextOtherDate);
      setData(payload || FALLBACK_COMPARE);
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_COMPARE);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (date && otherDate && date !== otherDate) {
      loadComparison(date, otherDate);
    } else {
      setLoading(false);
    }
  }, [date, otherDate]);

  if (loading) {
    return (
      <div className="patient-night-compare-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading night comparison...</div>
      </div>
    );
  }

  return (
    <div className="patient-night-compare-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">COMPARE NIGHTS</div>
          <h1>Night-to-Night Comparison</h1>
          <p>
            Σύγκριση δύο νυχτών για χρήση, leak, AHI, pressure και mask seal.
          </p>
        </div>

        <div className="hero-controls">
          <div className="field">
            <div className="control-label">Current night</div>
            <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
              {availableDates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="control-label">Compare with</div>
            <select className="input" value={otherDate} onChange={(e) => setOtherDate(e.target.value)}>
              {availableDates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Night comparison σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      <section className="comparison-header page-card">
        <div className="night-box">
          <div className="night-label">Current</div>
          <div className="night-date">{formatDateLabel(data.current?.night?.date)}</div>
        </div>
        <div className="vs-box">VS</div>
        <div className="night-box">
          <div className="night-label">Comparison</div>
          <div className="night-date">{formatDateLabel(data.comparison?.night?.date)}</div>
        </div>
      </section>

      <section className="compare-grid">
        {[
          ['Usage Hours', data.deltas?.usageHours?.current, data.deltas?.usageHours?.previous, data.deltas?.usageHours?.delta, false],
          ['AHI', data.deltas?.ahi?.current, data.deltas?.ahi?.previous, data.deltas?.ahi?.delta, true],
          ['Leak Rate', data.deltas?.leakRate?.current, data.deltas?.leakRate?.previous, data.deltas?.leakRate?.delta, true],
          ['Avg Pressure', data.deltas?.avgPressure?.current, data.deltas?.avgPressure?.previous, data.deltas?.avgPressure?.delta, false],
          ['Mask Seal', data.deltas?.maskSeal?.current, data.deltas?.maskSeal?.previous, data.deltas?.maskSeal?.delta, false]
        ].map(([label, current, previous, delta, preferLower]) => (
          <div key={label} className="compare-card">
            <div className="compare-label">{label}</div>
            <div className="compare-values">
              <div className="value-block">
                <span className="value-caption">Current</span>
                <strong>{current ?? '—'}</strong>
              </div>
              <div className="value-block">
                <span className="value-caption">Previous</span>
                <strong>{previous ?? '—'}</strong>
              </div>
            </div>
            <div className={`delta-pill ${compareToneFromDelta(delta, preferLower)}`}>
              {delta || '0'}
            </div>
          </div>
        ))}
      </section>

      <section className="page-card">
        <div className="section-title">Interpretation</div>
        <div className="interpretation-list">
          {(data.interpretation || []).map((item, index) => (
            <div key={`${item}-${index}`} className="interpretation-item">
              <div className="interpretation-index">{index + 1}</div>
              <div className="interpretation-text">{item}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-night-compare-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .compare-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 360px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(79,70,229,0.12), transparent 28%),
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

  .hero-controls {
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

  .control-label,
  .section-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
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

  .comparison-header {
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 100px 1fr;
    gap: 14px;
    align-items: center;
  }

  .night-box {
    padding: 16px;
    border-radius: 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    text-align: center;
  }

  .night-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .night-date {
    margin-top: 8px;
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
  }

  .vs-box {
    text-align: center;
    font-size: 28px;
    font-weight: 900;
    color: #4f46e5;
  }

  .compare-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .compare-card {
    padding: 16px;
  }

  .compare-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .compare-values {
    margin-top: 12px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .value-block {
    padding: 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .value-caption {
    font-size: 11px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
  }

  .delta-pill {
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    text-align: center;
  }

  .delta-pill.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .delta-pill.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .delta-pill.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .page-card {
    padding: 20px;
  }

  .interpretation-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .interpretation-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .interpretation-index {
    width: 30px;
    min-width: 30px;
    height: 30px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef2ff;
    color: #4338ca;
    font-weight: 900;
  }

  .interpretation-text {
    color: #334155;
    line-height: 1.6;
  }

  @media (max-width: 1280px) {
    .compare-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .comparison-header {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .compare-grid {
      grid-template-columns: 1fr;
    }
  }
`;