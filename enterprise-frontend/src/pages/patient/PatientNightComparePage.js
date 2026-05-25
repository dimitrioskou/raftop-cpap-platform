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

async function fetchNightCompare() {
  const tenantId = getTenantId();
  const patientId = getPatientId();

  const url = new URL(`${API_BASE}/api/patient/night-compare`);
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
    throw new Error(payload.message || payload.error || 'Night compare request failed.');
  }

  return payload;
}

export default function PatientNightComparePage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setPayload(await fetchNightCompare());
    } catch (err) {
      setError(err.message || 'Night compare load failed.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lastNight = payload?.lastNight || {};
  const previousNight = payload?.previousNight || {};
  const sevenDayAverage = payload?.sevenDayAverage || {};
  const comparison = payload?.comparison || {};
  const signals = payload?.signals || {};
  const summary = payload?.summary || {};

  const vsPrevious = comparison.vsPrevious || {};
  const vsSevenDayAverage = comparison.vsSevenDayAverage || {};

  return (
    <PatientLayout>
      <section style={heroCard}>
        <div>
          <div style={kicker}>NIGHT COMPARISON</div>
          <h2 style={title}>{summary.status || 'Night Compare'}</h2>
          <p style={subtitle}>
            {summary.patientMessage ||
              'Compare your latest CPAP night with the previous night and your 7-day average.'}
          </p>

          <button type="button" onClick={load} style={refreshButton}>
            {loading ? 'Loading...' : 'Refresh Comparison'}
          </button>
        </div>

        <div style={statusBox(signals.providerAttentionRequired)}>
          <div style={statusMain}>
            {signals.providerAttentionRequired ? 'Review' : 'Stable'}
          </div>
          <div style={statusLabel}>Provider Attention</div>
        </div>
      </section>

      {error && <section style={errorBox}>{error}</section>}

      <section style={metricsGrid}>
        <Metric label="Last Night Usage" value={`${lastNight.usageHours ?? 0}h`} tone="success" />
        <Metric label="Previous Usage" value={`${previousNight.usageHours ?? 0}h`} />
        <Metric label="7-day Avg Usage" value={`${sevenDayAverage.usageHours ?? 0}h`} />
        <Metric label="Last AHI" value={lastNight.ahi ?? '-'} tone={Number(lastNight.ahi || 99) <= 5 ? 'success' : 'warning'} />
        <Metric label="Last Leak" value={`${lastNight.leak ?? 0} L/min`} tone={Number(lastNight.leak || 99) <= 24 ? 'success' : 'warning'} />
        <Metric label="Night Score" value={lastNight.nightScore ?? '-'} tone="success" />
      </section>

      <section style={twoGrid}>
        <ComparisonPanel
          title="Last night vs previous night"
          rows={Object.values(vsPrevious)}
        />

        <ComparisonPanel
          title="Last night vs 7-day average"
          rows={Object.values(vsSevenDayAverage)}
        />
      </section>

      <section style={twoGrid}>
        <SignalPanel
          title="Improvement signals"
          rows={signals.improvementSignals || []}
          emptyText="No clear improvement signals detected."
          tone="success"
        />

        <SignalPanel
          title="Deterioration signals"
          rows={signals.deteriorationSignals || []}
          emptyText="No meaningful deterioration signals detected."
          tone="danger"
        />
      </section>

      <section style={panel}>
        <h3 style={sectionTitle}>Provider attention decision</h3>

        <div style={decisionGrid}>
          <Info label="Attention Required" value={signals.providerAttentionRequired ? 'YES' : 'NO'} />
          <Info label="Priority" value={signals.providerPriority || 'none'} />
          <Info label="Headline" value={summary.headline || '-'} />
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

function ComparisonPanel({ title, rows }) {
  const cleanRows = (rows || []).filter(Boolean);

  return (
    <section style={panel}>
      <h3 style={sectionTitle}>{title}</h3>

      {cleanRows.length === 0 ? (
        <div style={empty}>No comparison data available.</div>
      ) : (
        <div style={comparisonList}>
          {cleanRows.map((row) => (
            <ComparisonRow key={row.label} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}

function ComparisonRow({ row }) {
  const isImproved = row.direction === 'improved';
  const isWorsened = row.direction === 'worsened';

  return (
    <div style={comparisonRow}>
      <div>
        <div style={comparisonLabel}>{row.label}</div>
        <div style={comparisonSub}>
          Current: {row.current}{row.unit ? ` ${row.unit}` : ''} · Previous: {row.previous}{row.unit ? ` ${row.unit}` : ''}
        </div>
      </div>

      <span style={isImproved ? goodBadge : isWorsened ? dangerBadge : neutralBadge}>
        {row.direction || 'stable'} {row.delta > 0 ? '+' : ''}{row.delta}
      </span>
    </div>
  );
}

function SignalPanel({ title, rows, emptyText, tone }) {
  return (
    <section style={panel}>
      <h3 style={sectionTitle}>{title}</h3>

      {rows.length === 0 ? (
        <div style={empty}>{emptyText}</div>
      ) : (
        <div style={signalList}>
          {rows.map((item) => (
            <div key={item} style={tone === 'danger' ? dangerSignal : successSignal}>
              <span style={signalIcon}>{tone === 'danger' ? '!' : '✓'}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div style={infoCard}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{String(value || '-')}</div>
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
  color: '#be123c',
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
  background: '#be123c',
  color: '#ffffff',
  borderRadius: 13,
  padding: '10px 14px',
  fontWeight: 1000,
  cursor: 'pointer'
};

function statusBox(required) {
  return {
    minWidth: 180,
    background: required ? '#fff1f2' : '#ecfdf5',
    border: `1px solid ${required ? '#fecdd3' : '#bbf7d0'}`,
    borderRadius: 20,
    padding: 18,
    textAlign: 'center',
    display: 'grid',
    alignContent: 'center'
  };
}

const statusMain = {
  color: '#0f172a',
  fontSize: 34,
  fontWeight: 1000,
  lineHeight: 1
};

const statusLabel = {
  marginTop: 8,
  color: '#475569',
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

const comparisonList = {
  display: 'grid',
  gap: 10
};

const comparisonRow = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const comparisonLabel = {
  color: '#0f172a',
  fontWeight: 1000
};

const comparisonSub = {
  marginTop: 5,
  color: '#64748b',
  fontSize: 13,
  fontWeight: 750
};

const goodBadge = {
  background: '#dcfce7',
  color: '#166534',
  border: '1px solid #bbf7d0',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 1000
};

const dangerBadge = {
  background: '#fee2e2',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 1000
};

const neutralBadge = {
  background: '#e2e8f0',
  color: '#334155',
  border: '1px solid #cbd5e1',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 1000
};

const signalList = {
  display: 'grid',
  gap: 10
};

const successSignal = {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  gap: 10,
  color: '#166534',
  fontWeight: 850
};

const dangerSignal = {
  background: '#fff1f2',
  border: '1px solid #fecdd3',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  gap: 10,
  color: '#991b1b',
  fontWeight: 850
};

const signalIcon = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 1000,
  flex: '0 0 auto'
};

const decisionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12
};

const infoCard = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12
};

const infoLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const infoValue = {
  marginTop: 7,
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 850,
  wordBreak: 'break-word'
};