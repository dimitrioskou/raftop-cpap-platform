import React, { useCallback, useEffect, useState } from 'react';

import PatientLayout from '../../patient/PatientLayout';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

function getPatientId() {
  return (
    localStorage.getItem('patient_id') ||
    localStorage.getItem('patientId') ||
    'demo-patient-001'
  );
}

async function fetchNightlyAnalysis() {
  const tenantId = getTenantId();
  const patientId = getPatientId();

  const url = new URL(`${API_BASE}/api/patient/nightly-analysis`);
  url.searchParams.set('patientId', patientId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.message || payload.error || 'Nightly analysis request failed.');
  }

  return payload;
}

export default function PatientNightlyAnalysisPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchNightlyAnalysis());
    } catch (err) {
      setError(err.message || 'Nightly analysis load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const night = payload?.night || {};
  const score = payload?.score || {};
  const interpretation = payload?.interpretation || {};
  const insights = payload?.insights || [];
  const recommendations = payload?.recommendations || [];
  const escalation = payload?.providerEscalation || {};

  return (
    <PatientLayout>
      <section style={heroCard}>
        <div>
          <div style={kicker}>SLEEPHQ-STYLE NIGHTLY ANALYSIS</div>
          <h2 style={title}>{score.status || 'Nightly Analysis'}</h2>
          <p style={subtitle}>
            A patient-friendly interpretation of usage, AHI, leak, pressure stability and mask fit for the latest therapy night.
          </p>

          <button type="button" onClick={load} style={refreshButton}>
            {loading ? 'Loading...' : 'Refresh Nightly Analysis'}
          </button>
        </div>

        <div style={scoreBox}>
          <div style={scoreNumber}>{score.nightScore ?? 0}</div>
          <div style={scoreLabel}>Night Score</div>
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric label="Usage" value={night.usage || `${night.usageHours || 0}h`} tone="success" />
        <Metric label="AHI" value={night.ahi ?? '-'} tone={Number(night.ahi || 99) <= 5 ? 'success' : 'warning'} />
        <Metric label="Leak" value={`${night.leak ?? 0} L/min`} tone={Number(night.leak || 99) <= 24 ? 'success' : 'warning'} />
        <Metric label="Pressure Avg" value={`${night.pressureAverage ?? 0} cmH₂O`} />
        <Metric label="Pressure P95" value={`${night.pressureP95 ?? 0} cmH₂O`} />
        <Metric label="Mask Fit" value={`${night.maskFit ?? 0}%`} tone="success" />
      </section>

      <section style={metricsGrid}>
        <Metric label="Usage Score" value={score.usageScore ?? 0} tone="success" />
        <Metric label="AHI Score" value={score.ahiScore ?? 0} tone="success" />
        <Metric label="Leak Score" value={score.leakScore ?? 0} tone="success" />
        <Metric label="Pressure Score" value={score.pressureScore ?? 0} />
      </section>

      <section style={twoGrid}>
        <section style={panel}>
          <h3 style={sectionTitle}>Clinical-style interpretation</h3>

          <div style={interpretationGrid}>
            <Interpretation label="Usage Quality" value={interpretation.usageQuality} />
            <Interpretation label="AHI Control" value={interpretation.ahiControl} />
            <Interpretation label="Leak Risk" value={interpretation.leakRisk} />
            <Interpretation label="Pressure Stability" value={interpretation.pressureStability} />
            <Interpretation label="Mask Fit" value={interpretation.maskFit} />
          </div>
        </section>

        <section style={escalation.required ? escalationPanelDanger : panel}>
          <h3 style={sectionTitle}>Provider escalation</h3>

          <div style={escalationBadge(escalation.required)}>
            {escalation.required ? 'REVIEW REQUIRED' : 'NO ESCALATION'}
          </div>

          <p style={escalationText}>
            {escalation.reason || 'No escalation decision available.'}
          </p>

          <div style={priorityText}>
            Priority: <strong>{escalation.priority || 'none'}</strong>
          </div>
        </section>
      </section>

      <section style={panel}>
        <h3 style={sectionTitle}>Nightly insights</h3>

        {insights.length === 0 ? (
          <div style={empty}>No nightly insights available.</div>
        ) : (
          <div style={insightGrid}>
            {insights.map((item) => (
              <Insight
                key={`${item.severity}-${item.title}`}
                severity={item.severity}
                title={item.title}
                text={item.text}
              />
            ))}
          </div>
        )}
      </section>

      <section style={panel}>
        <h3 style={sectionTitle}>Patient recommendations</h3>

        {recommendations.length === 0 ? (
          <div style={empty}>No recommendations available.</div>
        ) : (
          <div style={recommendationGrid}>
            {recommendations.map((item) => (
              <Recommendation key={item} text={item} />
            ))}
          </div>
        )}
      </section>
    </PatientLayout>
  );
}

function Metric({ label, value, tone = 'default' }) {
  const style =
    tone === 'success'
      ? metricSuccess
      : tone === 'warning'
        ? metricWarning
        : metricCard;

  return (
    <div style={style}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function Interpretation({ label, value }) {
  return (
    <div style={interpretationCard}>
      <div style={interpretationLabel}>{label}</div>
      <div style={interpretationValue}>{value || '-'}</div>
    </div>
  );
}

function Insight({ severity, title, text }) {
  const badge =
    severity === 'critical'
      ? criticalBadge
      : severity === 'warning'
        ? warningBadge
        : positiveBadge;

  return (
    <div style={insightCard}>
      <span style={badge}>{severity || 'info'}</span>
      <div style={insightTitle}>{title}</div>
      <div style={insightText}>{text}</div>
    </div>
  );
}

function Recommendation({ text }) {
  return (
    <div style={recommendationCard}>
      <span style={check}>✓</span>
      <span>{text}</span>
    </div>
  );
}

const heroCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  flexWrap: 'wrap',
  boxShadow: '0 12px 30px rgba(15,23,42,0.06)'
};

const kicker = {
  color: '#7c3aed',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.14em'
};

const title = {
  margin: '8px 0',
  color: '#0f172a',
  fontSize: 30,
  lineHeight: 1.1
};

const subtitle = {
  margin: 0,
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.55,
  maxWidth: 780
};

const refreshButton = {
  marginTop: 14,
  border: 0,
  background: '#7c3aed',
  color: '#ffffff',
  borderRadius: 13,
  padding: '10px 14px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const scoreBox = {
  minWidth: 170,
  background: '#f5f3ff',
  border: '1px solid #ddd6fe',
  borderRadius: 20,
  padding: 18,
  textAlign: 'center'
};

const scoreNumber = {
  color: '#5b21b6',
  fontSize: 48,
  fontWeight: 1000,
  lineHeight: 1
};

const scoreLabel = {
  marginTop: 8,
  color: '#5b21b6',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const errorBox = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 18,
  padding: 16,
  fontWeight: 850
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 14
};

const metricCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
};

const metricSuccess = {
  ...metricCard,
  background: '#f0fdf4',
  border: '1px solid #bbf7d0'
};

const metricWarning = {
  ...metricCard,
  background: '#fffbeb',
  border: '1px solid #fde68a'
};

const metricLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metricValue = {
  marginTop: 8,
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 1000
};

const twoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 14
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 10px 26px rgba(15,23,42,0.05)'
};

const escalationPanelDanger = {
  ...panel,
  background: '#fff1f2',
  border: '1px solid #fecdd3'
};

const sectionTitle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: 20
};

const interpretationGrid = {
  display: 'grid',
  gap: 10
};

const interpretationCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14
};

const interpretationLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const interpretationValue = {
  marginTop: 6,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.45
};

function escalationBadge(required) {
  return {
    display: 'inline-block',
    background: required ? '#fee2e2' : '#dcfce7',
    color: required ? '#991b1b' : '#166534',
    border: `1px solid ${required ? '#fecaca' : '#bbf7d0'}`,
    borderRadius: 999,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 1000
  };
}

const escalationText = {
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.5
};

const priorityText = {
  color: '#0f172a',
  fontWeight: 850
};

const insightGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12
};

const insightCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14
};

const positiveBadge = {
  display: 'inline-block',
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 1000,
  marginBottom: 8
};

const warningBadge = {
  ...positiveBadge,
  background: '#fffbeb',
  color: '#92400e',
  border: '1px solid #fde68a'
};

const criticalBadge = {
  ...positiveBadge,
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca'
};

const insightTitle = {
  color: '#0f172a',
  fontWeight: 1000,
  marginBottom: 5
};

const insightText = {
  color: '#475569',
  fontWeight: 700,
  lineHeight: 1.45
};

const recommendationGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 10
};

const recommendationCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 12,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#334155',
  fontWeight: 800
};

const check = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  width: 24,
  height: 24,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 1000,
  flex: '0 0 auto'
};

const empty = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 14,
  padding: 14,
  fontWeight: 800
};