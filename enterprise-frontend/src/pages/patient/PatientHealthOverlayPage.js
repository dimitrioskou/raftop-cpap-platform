import React, { useEffect, useMemo, useState } from 'react';
import {
  createPatientJournalEntry,
  getPatientOverlay
} from './helpers/overlayApi';
import {
  formatDateLabel,
  symptomLabel,
  toneFromCorrelationType,
  toneFromStatus
} from './helpers/overlayHelpers';

const FALLBACK_DATA = {
  availableDates: ['2026-04-28', '2026-04-27', '2026-04-26'],
  selectedDate: '2026-04-28',
  patient: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  cpap: {
    usageHours: 6.1,
    ahi: 2.5,
    leakRate: 13.4,
    avgPressure: 8.2,
    maskSeal: 91,
    interruptions: 1
  },
  oximetry: {
    minSpo2: 91,
    avgSpo2: 94.4,
    pulseAvg: 68,
    desaturationEvents: 2,
    source: 'synthetic_oximetry'
  },
  journal: {
    latest: {
      id: 'journal-1',
      date: '2026-04-28',
      symptoms: ['dryness'],
      sleepQuality: 7,
      energyLevel: 6,
      notes: 'Ήπια ξηρότητα αλλά συνολικά ανεκτή νύχτα.',
      source: 'synthetic_journal'
    },
    entries: [
      {
        id: 'journal-1',
        date: '2026-04-28',
        symptoms: ['dryness'],
        sleepQuality: 7,
        energyLevel: 6,
        notes: 'Ήπια ξηρότητα αλλά συνολικά ανεκτή νύχτα.',
        source: 'synthetic_journal'
      }
    ],
    symptomsSummary: {
      total: 1,
      items: ['dryness']
    }
  },
  correlations: [
    {
      type: 'positive',
      title: 'Overlay signals are broadly aligned',
      description: 'CPAP, physiology και journal δεν δείχνουν προφανή σύγκρουση για αυτή τη νύχτα.'
    }
  ],
  sourceCards: [
    {
      key: 'cpap',
      title: 'CPAP Source',
      status: 'connected',
      tone: 'success',
      description: 'Usage 6.1h • AHI 2.5 • Leak 13.4'
    },
    {
      key: 'oximetry',
      title: 'Oximetry Source',
      status: 'fallback',
      tone: 'warning',
      description: 'Min SpO2 91 • Avg SpO2 94.4 • Pulse 68'
    },
    {
      key: 'journal',
      title: 'Journal Source',
      status: 'fallback',
      tone: 'warning',
      description: '1 entries available for this night'
    }
  ],
  timeline: [
    { label: '22:30', pressure: 8.0, leakRate: 12, spo2: 94, pulse: 67 },
    { label: '23:15', pressure: 8.4, leakRate: 13, spo2: 93.8, pulse: 69 },
    { label: '00:00', pressure: 8.2, leakRate: 12.6, spo2: 94.2, pulse: 68 },
    { label: '00:45', pressure: 8.5, leakRate: 14.2, spo2: 93.1, pulse: 71 }
  ]
};

function statusClass(tone) {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'neutral';
}

export default function PatientHealthOverlayPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [journalBusy, setJournalBusy] = useState(false);

  const [symptoms, setSymptoms] = useState('dryness');
  const [sleepQuality, setSleepQuality] = useState('7');
  const [energyLevel, setEnergyLevel] = useState('6');
  const [notes, setNotes] = useState('');

  async function loadOverlay(date = '') {
    setLoading(true);

    try {
      const payload = await getPatientOverlay(date);
      setData(payload || FALLBACK_DATA);
      setSelectedDate(payload?.selectedDate || FALLBACK_DATA.selectedDate);
      setFallbackMode(false);
      setFlashMessage('');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setSelectedDate(FALLBACK_DATA.selectedDate);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverlay();
  }, []);

  useEffect(() => {
    const latest = data.journal?.latest;
    if (latest) {
      setSymptoms((latest.symptoms || []).join(', '));
      setSleepQuality(String(latest.sleepQuality ?? ''));
      setEnergyLevel(String(latest.energyLevel ?? ''));
      setNotes(latest.notes || '');
    }
  }, [data.selectedDate]);

  const symptomChips = useMemo(
    () => (data.journal?.symptomsSummary?.items || []).map((item) => symptomLabel(item)),
    [data.journal]
  );

  async function handleSaveJournal(event) {
    event.preventDefault();
    setJournalBusy(true);
    setFlashMessage('');

    try {
      await createPatientJournalEntry({
        date: selectedDate,
        symptoms: symptoms
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        sleepQuality: Number(sleepQuality || 0),
        energyLevel: Number(energyLevel || 0),
        notes
      });

      setFlashMessage('Το journal αποθηκεύτηκε επιτυχώς.');
      await loadOverlay(selectedDate);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία αποθήκευσης journal');
    } finally {
      setJournalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="patient-health-overlay-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading health overlay...</div>
      </div>
    );
  }

  return (
    <div className="patient-health-overlay-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">HEALTH OVERLAY</div>
          <h1>CPAP + Physiology + Journal</h1>
          <p>
            Ενοποιημένη εικόνα θεραπείας, οξυγόνωσης και συμπτωμάτων για καλύτερη κατανόηση της νύχτας.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{formatDateLabel(data.selectedDate)}</span>
            <span className="hero-chip">{data.patient?.fullName || 'Patient'}</span>
            <span className="hero-chip">{data.patient?.email || '—'}</span>
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
              loadOverlay(nextDate);
            }}
          >
            {(data.availableDates || []).map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Health overlay σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="banner info">
          {flashMessage}
        </div>
      ) : null}

      <section className="sources-grid">
        {(data.sourceCards || []).map((card) => (
          <div key={card.key} className="source-card">
            <div className="source-header">
              <div className="source-title">{card.title}</div>
              <span className={`badge ${statusClass(toneFromStatus(card.status))}`}>
                {card.status}
              </span>
            </div>
            <div className="source-text">{card.description}</div>
          </div>
        ))}
      </section>

      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Usage</div>
          <div className="metric-value">{data.cpap?.usageHours ?? 0}h</div>
          <div className="metric-subtitle">Therapy use</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">AHI</div>
          <div className="metric-value">{data.cpap?.ahi ?? 0}</div>
          <div className="metric-subtitle">Residual events</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Leak</div>
          <div className="metric-value">{data.cpap?.leakRate ?? 0}</div>
          <div className="metric-subtitle">Mask leak</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Min SpO2</div>
          <div className="metric-value">{data.oximetry?.minSpo2 ?? 0}</div>
          <div className="metric-subtitle">Lowest oxygen</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg SpO2</div>
          <div className="metric-value">{data.oximetry?.avgSpo2 ?? 0}</div>
          <div className="metric-subtitle">Average oxygen</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pulse Avg</div>
          <div className="metric-value">{data.oximetry?.pulseAvg ?? 0}</div>
          <div className="metric-subtitle">Average pulse</div>
        </div>
      </section>

      <section className="overlay-grid">
        <div className="page-card">
          <div className="section-title">Overlay Timeline</div>

          <div className="timeline-list">
            {(data.timeline || []).map((point, index) => (
              <div key={`${point.label}-${index}`} className="timeline-row">
                <div className="timeline-time">{point.label}</div>

                <div className="timeline-bars">
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
                    <div className="bar-label">SpO2</div>
                    <div className="bar-track">
                      <div className="bar-fill spo2" style={{ width: `${Math.min(100, point.spo2)}%` }} />
                    </div>
                  </div>

                  <div className="bar-wrap">
                    <div className="bar-label">Pulse</div>
                    <div className="bar-track">
                      <div className="bar-fill pulse" style={{ width: `${Math.min(100, point.pulse)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Correlation Insights</div>

          <div className="correlation-list">
            {(data.correlations || []).map((item, index) => (
              <div key={`${item.title}-${index}`} className={`correlation-card ${statusClass(toneFromCorrelationType(item.type))}`}>
                <div className="correlation-title">{item.title}</div>
                <div className="correlation-text">{item.description}</div>
              </div>
            ))}
          </div>

          <div className="section-title spaced">Symptoms Summary</div>
          <div className="symptom-wrap">
            {symptomChips.length ? (
              symptomChips.map((item) => (
                <span key={item} className="symptom-chip">{item}</span>
              ))
            ) : (
              <span className="muted-inline">No symptom tags</span>
            )}
          </div>
        </div>
      </section>

      <section className="journal-grid">
        <div className="page-card">
          <div className="section-title">Night Journal</div>

          <form onSubmit={handleSaveJournal} className="journal-form">
            <div className="field">
              <label className="field-label">Symptoms (comma separated)</label>
              <input
                className="input"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="dryness, mask_discomfort"
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label">Sleep Quality (0-10)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Energy Level (0-10)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Notes</label>
              <textarea
                className="textarea"
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Πώς ένιωσες το πρωί; Υπήρξε πρόβλημα με τη μάσκα;"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={journalBusy}>
              {journalBusy ? 'Saving...' : 'Save Journal Entry'}
            </button>
          </form>
        </div>

        <div className="page-card">
          <div className="section-title">Recent Journal Entries</div>

          <div className="entry-list">
            {(data.journal?.entries || []).length ? (
              data.journal.entries.map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-top">
                    <div className="entry-date">{formatDateLabel(entry.date)}</div>
                    <div className="entry-scores">
                      SQ {entry.sleepQuality ?? 0} • EN {entry.energyLevel ?? 0}
                    </div>
                  </div>

                  <div className="symptom-wrap">
                    {(entry.symptoms || []).length ? (
                      entry.symptoms.map((item) => (
                        <span key={`${entry.id}-${item}`} className="symptom-chip small">
                          {symptomLabel(item)}
                        </span>
                      ))
                    ) : (
                      <span className="muted-inline">No symptoms logged</span>
                    )}
                  </div>

                  <div className="entry-notes">{entry.notes || 'No notes'}</div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No journal entries yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-health-overlay-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .source-card,
  .metric-card {
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
      radial-gradient(circle at top right, rgba(245,158,11,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,251,235,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d97706;
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
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fcd34d;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  .control-label,
  .section-title,
  .field-label {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .section-title.spaced {
    margin-top: 16px;
  }

  .input,
  .textarea {
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

  .textarea {
    resize: vertical;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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

  .banner.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .sources-grid,
  .metrics-grid {
    display: grid;
    gap: 12px;
  }

  .sources-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .metrics-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .source-card,
  .metric-card,
  .page-card {
    padding: 18px;
  }

  .source-header {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .source-title,
  .metric-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .source-text,
  .metric-subtitle {
    margin-top: 10px;
    color: #475569;
    line-height: 1.6;
    font-size: 13px;
  }

  .metric-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .badge {
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

  .badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .overlay-grid,
  .journal-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 18px;
  }

  .timeline-list,
  .correlation-list,
  .entry-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .timeline-row {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 12px;
    align-items: center;
  }

  .timeline-time {
    font-size: 12px;
    font-weight: 900;
    color: #475569;
  }

  .timeline-bars {
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

  .bar-fill.spo2 {
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  }

  .bar-fill.pulse {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  }

  .correlation-card {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid transparent;
  }

  .correlation-card.success {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .correlation-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }

  .correlation-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .correlation-card.neutral {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }

  .correlation-title {
    font-size: 14px;
    font-weight: 900;
  }

  .correlation-text {
    margin-top: 6px;
    line-height: 1.6;
  }

  .symptom-wrap {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .symptom-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
    font-size: 12px;
    font-weight: 800;
  }

  .symptom-chip.small {
    padding: 6px 8px;
    font-size: 11px;
  }

  .journal-form {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .entry-card {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .entry-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .entry-date {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .entry-scores {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
  }

  .entry-notes {
    margin-top: 10px;
    color: #334155;
    line-height: 1.6;
  }

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 1200px) {
    .sources-grid {
      grid-template-columns: 1fr;
    }

    .metrics-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .overlay-grid,
    .journal-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .hero-card,
    .form-row {
      grid-template-columns: 1fr;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
`;