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

export default function PatientTherapyPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchPatientTherapySummary());
    } catch (err) {
      setError(err.message || 'Patient therapy load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lastNight = payload?.lastNight || {};
  const insights = payload?.insights || [];
  const actions = payload?.actions || [];
  const nights = payload?.nights || [];

  return (
    <PatientLayout>
      <section style={heroCard}>
        <div>
          <div style={kicker}>NIGHTLY THERAPY SUMMARY</div>
          <h2 style={title}>{lastNight.status || 'Therapy Summary'}</h2>
          <p style={subtitle}>
            Your therapy data shows usage, AHI, leak, pressure and mask-fit performance for the latest available night.
          </p>

          <button type="button" onClick={load} style={refreshButton}>
            {loading ? 'Loading...' : 'Refresh Therapy Data'}
          </button>
        </div>

        <div style={statusBadge}>
          <div>{lastNight.usage || '0h'}</div>
          <span style={statusBadgeText}>used</span>
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric label="Usage" value={lastNight.usage || `${lastNight.usageHours || 0}h`} tone="success" />
        <Metric label="AHI" value={lastNight.ahi ?? '-'} tone={Number(lastNight.ahi || 99) <= 5 ? 'success' : 'warning'} />
        <Metric label="Leak" value={`${lastNight.leak ?? 0} L/min`} tone={Number(lastNight.leak || 99) <= 24 ? 'success' : 'warning'} />
        <Metric label="Avg Pressure" value={`${lastNight.pressure ?? 0} cmH₂O`} />
        <Metric label="Mask Fit" value={`${lastNight.maskFit ?? 0}%`} tone="success" />
        <Metric label="Sleep Window" value={`${lastNight.startTime || '-'} - ${lastNight.endTime || '-'}`} />
      </section>

      <section style={twoGrid}>
        <section style={panel}>
          <h3 style={sectionTitle}>SleepHQ-style nightly insights</h3>

          {insights.length === 0 ? (
            <div style={empty}>No nightly insights available.</div>
          ) : (
            <div style={insightList}>
              {insights.map((item) => (
                <Insight
                  key={`${item.status}-${item.title}`}
                  status={item.status}
                  title={item.title}
                  text={item.text}
                />
              ))}
            </div>
          )}
        </section>

        <section style={panel}>
          <h3 style={sectionTitle}>Provider notes for patient</h3>

          <div style={noteBox}>
            No urgent action required. Maintain nightly usage and monitor comfort. If dryness, mask discomfort or repeated awakenings occur, contact the provider team.
          </div>

          {actions.length === 0 ? (
            <div style={empty}>No recommended actions available.</div>
          ) : (
            <div style={actionGrid}>
              {actions.map((action) => (
                <Action key={action} label={action} />
              ))}
            </div>
          )}
        </section>
      </section>

      <section style={panel}>
        <h3 style={sectionTitle}>7-night therapy trend</h3>

        {nights.length === 0 ? (
          <div style={empty}>No night trend data available.</div>
        ) : (
          <div style={trendGrid}>
            {nights.map((item) => (
              <div key={item.date || item.day} style={trendCard}>
                <div style={trendDay}>{item.day}</div>
                <div style={barTrack}>
                  <div
                    style={{
                      ...barFill,
                      height: `${Math.min(100, Math.round((Number(item.usageHours || 0) / 8) * 100))}%`
                    }}
                  />
                </div>
                <div style={trendValue}>{item.usageHours}h</div>
                <div style={trendMeta}>AHI {item.ahi}</div>
                <div style={trendMeta}>Leak {item.leak}</div>
              </div>
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

function Insight({ status, title, text }) {
  return (
    <div style={insightCard}>
      <span style={statusPill}>{status || 'Info'}</span>
      <div style={insightTitle}>{title}</div>
      <div style={insightText}>{text}</div>
    </div>
  );
}

function Action({ label }) {
  return (
    <div style={actionCard}>
      <span style={check}>✓</span>
      <span>{label}</span>
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
  color: '#1d4ed8',
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
  maxWidth: 760
};

const refreshButton = {
  marginTop: 14,
  border: 0,
  background: '#1d4ed8',
  color: '#ffffff',
  borderRadius: 13,
  padding: '10px 14px',
  fontWeight: 1000,
  cursor: 'pointer'
};

const statusBadge = {
  minWidth: 170,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 20,
  padding: 18,
  textAlign: 'center',
  color: '#1d4ed8',
  fontSize: 38,
  fontWeight: 1000,
  display: 'grid',
  alignContent: 'center'
};

const statusBadgeText = {
  marginTop: 5,
  color: '#1e40af',
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

const statusPill = {
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

const noteBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  color: '#334155',
  fontWeight: 750,
  lineHeight: 1.5,
  marginBottom: 12
};

const actionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10
};

const actionCard = {
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
  fontWeight: 1000
};

const trendGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: 12
};

const trendCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 12,
  display: 'grid',
  justifyItems: 'center',
  gap: 7
};

const trendDay = {
  color: '#0f172a',
  fontWeight: 1000
};

const barTrack = {
  height: 110,
  width: 18,
  background: '#e2e8f0',
  borderRadius: 999,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'flex-end'
};

const barFill = {
  width: '100%',
  background: '#0f766e',
  borderRadius: 999
};

const trendValue = {
  color: '#0f172a',
  fontWeight: 1000
};

const trendMeta = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800
};