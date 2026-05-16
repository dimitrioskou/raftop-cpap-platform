import React, { useEffect, useState } from 'react';
import { getPatientInsights } from './helpers/patientApi';

const FALLBACK_DATA = {
  summary: {
    therapyStatus: 'on_track',
    score: 74,
    adherenceRate: 82
  },
  cards: [
    {
      id: 'score',
      title: 'Therapy score',
      tone: 'success',
      value: 74,
      description: 'Η θεραπεία φαίνεται σταθερή.'
    },
    {
      id: 'usage',
      title: 'Usage insight',
      tone: 'warning',
      value: '5.6h',
      description: 'Υπάρχει καλή βάση, αλλά χρειάζεται συνέπεια.'
    }
  ],
  recommendations: [
    'Στόχευσε σε τουλάχιστον 4 ώρες χρήσης κάθε βράδυ.',
    'Έλεγξε την εφαρμογή της μάσκας για να μειωθεί η διαρροή.',
    'Διατήρησε σταθερή nightly χρήση.'
  ]
};

function toneClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  return 'success';
}

export default function PatientInsightsPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  async function loadInsights() {
    setLoading(true);

    try {
      const payload = await getPatientInsights();
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
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="patient-insights-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="patient-insights-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">INSIGHTS</div>
          <h1>Therapy Insights</h1>
          <p>
            Ερμηνεία της θεραπείας σου σε απλή μορφή, με συνοπτικά signals και πρακτικές συστάσεις.
          </p>
        </div>

        <div className={`score-box ${toneClass(data.summary?.therapyStatus === 'critical' ? 'danger' : data.summary?.therapyStatus === 'at_risk' ? 'warning' : 'success')}`}>
          <div className="score-label">Score</div>
          <div className="score-value">{data.summary?.score ?? 0}</div>
          <div className="score-subtitle">Adherence {data.summary?.adherenceRate ?? 0}%</div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Insights σε fallback mode. Τα demo δεδομένα εμφανίζονται επειδή το backend response δεν ήταν διαθέσιμο.
        </div>
      ) : null}

      <section className="cards-grid">
        {(data.cards || []).map((card) => (
          <div key={card.id} className={`insight-card ${toneClass(card.tone)}`}>
            <div className="card-title">{card.title}</div>
            <div className="card-value">{card.value}</div>
            <div className="card-desc">{card.description}</div>
          </div>
        ))}
      </section>

      <section className="page-card">
        <div className="section-title">Recommendations</div>

        <div className="rec-list">
          {(data.recommendations || []).map((item, index) => (
            <div key={`${item}-${index}`} className="rec-item">
              <div className="rec-index">{index + 1}</div>
              <div className="rec-text">{item}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-insights-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card, .page-card, .insight-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 300px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(129,140,248,0.10), transparent 28%),
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

  .score-box {
    border-radius: 24px;
    padding: 22px;
    color: white;
  }

  .score-box.success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  }

  .score-box.warning {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .score-box.danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .score-label {
    font-size: 13px;
    font-weight: 800;
  }

  .score-value {
    margin-top: 8px;
    font-size: 60px;
    font-weight: 900;
    line-height: 1;
  }

  .score-subtitle {
    margin-top: 10px;
    font-size: 14px;
    opacity: 0.95;
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

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .insight-card {
    padding: 20px;
  }

  .insight-card.success {
    background: #ecfdf5;
    border-color: #86efac;
  }

  .insight-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .insight-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .card-title {
    font-size: 13px;
    font-weight: 900;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .card-value {
    margin-top: 10px;
    font-size: 34px;
    font-weight: 900;
    color: #0f172a;
  }

  .card-desc {
    margin-top: 10px;
    color: #475569;
    line-height: 1.6;
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

  .rec-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rec-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .rec-index {
    min-width: 30px;
    height: 30px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }

  .rec-text {
    color: #334155;
    line-height: 1.6;
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }

    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
`;