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

async function fetchPatientTherapySummary() {
  const tenantId = getTenantId();
  const patientId = getPatientId();

  const url = new URL(`${API_BASE}/api/patient/therapy/summary`);
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
    throw new Error(payload.message || payload.error || 'Patient therapy summary request failed.');
  }

  return payload;
}

export default function PatientDashboardPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchPatientTherapySummary();
      setPayload(result);
    } catch (err) {
      setError(err.message || 'Patient dashboard load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = payload?.summary || {};
  const lastNight = payload?.lastNight || {};
  const insights = payload?.insights || [];
  const actions = payload?.actions || [];

  const nightsUsed = Number(summary.nightsUsed || 0);
  const totalNights = Number(summary.totalNights || 30);
  const adherencePercent =
    totalNights > 0 ? Math.round((nightsUsed / totalNights) * 100) : 0;

  const ahiValue = summary.ahiLastNight ?? lastNight.ahi ?? null;
  const leakValue = summary.leakLastNight ?? lastNight.leak ?? null;

  return (
    <PatientLayout>
      <section style={heroCard}>
        <div>
          <div style={kicker}>TODAY&apos;S THERAPY STATUS</div>
          <h2 style={title}>{summary.status || 'Therapy Overview'}</h2>
          <p style={subtitle}>
            {summary.status === 'Controlled'
              ? 'Your CPAP therapy usage is currently within the target zone. Keep using your device every night.'
              : 'Your therapy data is available. Review your usage, AHI, leak and next best actions.'}
          </p>

          <button type="button" onClick={load} style={refreshButton}>
            {loading ? 'Loading...' : 'Refresh Therapy Data'}
          </button>
        </div>

        <div style={scoreBox}>
          <div style={score}>{summary.adherenceScore ?? 0}</div>
          <div style={scoreLabel}>Adherence Score</div>
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric
          label="Usage Last Night"
          value={lastNight.usage || `${summary.usageHoursLastNight || 0}h`}
          tone="success"
        />

        <Metric
          label="Nights Used"
          value={`${nightsUsed}/${totalNights}`}
        />

        <Metric
          label="AHI"
          value={ahiValue ?? '-'}
          tone={Number(ahiValue || 99) <= 5 ? 'success' : 'warning'}
        />

        <Metric
          label="Leak"
          value={`${leakValue ?? 0} L/min`}
          tone={Number(leakValue || 99) <= 24 ? 'success' : 'warning'}
        />

        <Metric
          label="Mask Fit"
          value={`${summary.maskFit ?? lastNight.maskFit ?? 0}%`}
          tone="success"
        />

        <Metric
          label="Trend"
          value={summary.trend || 'Stable'}
          tone="success"
        />
      </section>

      <section style={twoGrid}>
        <section style={panel}>
          <h3 style={sectionTitle}>What this means</h3>

          {insights.length === 0 ? (
            <div style={empty}>No therapy insights available.</div>
          ) : (
            <div style={insightList}>
              {insights.map((item) => (
                <Insight
                  key={`${item.title}-${item.status}`}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          )}
        </section>

        <section style={panel}>
          <h3 style={sectionTitle}>Next best actions</h3>

          {actions.length === 0 ? (
            <div style={empty}>No recommended actions available.</div>
          ) : (
            <div style={actionList}>
              {actions.map((item) => (
                <Action key={item} text={item} />
              ))}
            </div>
          )}
        </section>
      </section>

      <section style={panel}>
        <h3 style={sectionTitle}>30-day adherence progress</h3>

        <div style={progressShell}>
          <div style={progressTop}>
            <span>{nightsUsed} nights used</span>
            <span>{adherencePercent}%</span>
          </div>

          <div style={progressTrack}>
            <div
              style={{
                ...progressFill,
                width: `${adherencePercent}%`
              }}
            />
          </div>
        </div>
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

function Insight({ title, text }) {
  return (
    <div style={insightCard}>
      <div style={insightTitle}>{title}</div>
      <div style={insightText}>{text}</div>
    </div>
  );
}

function Action({ text }) {
  return (
    <div style={actionCard}>
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
  color: '#0f766e',
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
  maxWidth: 720
};

const refreshButton = {
  marginTop: 14,
  border: 0,
  background: '#0f766e',
  color: '#ffffff',
  borderRadius: 13,
  padding: '10px 14px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const scoreBox = {
  minWidth: 170,
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  borderRadius: 20,
  padding: 18,
  textAlign: 'center'
};

const score = {
  color: '#166534',
  fontSize: 48,
  fontWeight: 1000,
  lineHeight: 1
};

const scoreLabel = {
  marginTop: 8,
  color: '#166534',
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

const sectionTitle = {
  margin: '0 0 12px',
  color: '#0f172a',
  fontSize: 20
};

const empty = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  borderRadius: 14,
  padding: 14,
  fontWeight: 800
};

const insightList = {
  display: 'grid',
  gap: 10
};

const insightCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14
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

const actionList = {
  display: 'grid',
  gap: 10
};

const actionCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
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
  fontWeight: 1000
};

const progressShell = {
  display: 'grid',
  gap: 10
};

const progressTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  color: '#334155',
  fontWeight: 900
};

const progressTrack = {
  height: 16,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden'
};

const progressFill = {
  height: '100%',
  background: '#0f766e',
  borderRadius: 999
};