import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api';

function pageWrapStyle() {
  return {
    padding: 24
  };
}

function headerCardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 22,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function metricCardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function sectionStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function metricLabelStyle() {
  return {
    fontSize: 12,
    fontWeight: 800,
    color: '#667085',
    marginBottom: 8,
    letterSpacing: 0.3
  };
}

function metricValueStyle() {
  return {
    fontSize: 30,
    fontWeight: 900,
    color: '#101828',
    lineHeight: 1
  };
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeSummary(payload) {
  const summary = payload?.summary || {};

  return {
    totalPatients: toNumber(summary.totalPatients),
    totalDevices: toNumber(summary.totalDevices),
    totalAlerts: toNumber(summary.totalAlerts),
    openAlerts: toNumber(summary.openAlerts),
    highAlerts: toNumber(summary.highAlerts),
    totalTasks: toNumber(summary.totalTasks),
    openTasks: toNumber(summary.openTasks),
    highPriorityTasks: toNumber(summary.highPriorityTasks)
  };
}

function ratio(part, total) {
  if (!total) {
    return '0%';
  }
  return `${Math.round((part / total) * 100)}%`;
}

function overviewRow(label, value) {
  return (
    <div
      key={label}
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f2f4f7'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#667085' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#101828' }}>{value}</div>
    </div>
  );
}

export default function AtlasSummaryPage() {
  const [summary, setSummary] = useState({
    totalPatients: 0,
    totalDevices: 0,
    totalAlerts: 0,
    openAlerts: 0,
    highAlerts: 0,
    totalTasks: 0,
    openTasks: 0,
    highPriorityTasks: 0
  });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/summary');

        if (!mounted) {
          return;
        }

        setSummary(normalizeSummary(payload));
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'Failed to load ATLAS summary');
        setSummary({
          totalPatients: 0,
          totalDevices: 0,
          totalAlerts: 0,
          openAlerts: 0,
          highAlerts: 0,
          totalTasks: 0,
          openTasks: 0,
          highPriorityTasks: 0
        });
        setMeta(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => {
    return [
      { label: 'Total Patients', value: summary.totalPatients },
      { label: 'Total Devices', value: summary.totalDevices },
      { label: 'Total Alerts', value: summary.totalAlerts },
      { label: 'Open Alerts', value: summary.openAlerts },
      { label: 'High Alerts', value: summary.highAlerts },
      { label: 'Total Tasks', value: summary.totalTasks },
      { label: 'Open Tasks', value: summary.openTasks },
      { label: 'High Priority Tasks', value: summary.highPriorityTasks }
    ];
  }, [summary]);

  return (
    <div style={pageWrapStyle()}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>
          ATLAS SYSTEM
        </div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
          Summary
        </h1>
        <div style={{ color: '#667085' }}>
          Operational overview for alerts, tasks, patients, and devices.
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            background: '#fff1f2',
            border: '1px solid #fda4af',
            color: '#b42318',
            borderRadius: 14,
            padding: '12px 14px',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={headerCardStyle()}>Loading ATLAS summary...</div>
      ) : (
        <>
          <div style={{ ...headerCardStyle(), marginBottom: 18 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 10 }}>
              ATLAS Overview
            </div>
            <div style={{ color: '#667085', lineHeight: 1.7 }}>
              This summary is now reading the backend summary object directly, not waiting for array rows.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginBottom: 18
            }}
          >
            {cards.map((card) => (
              <div key={card.label} style={metricCardStyle()}>
                <div style={metricLabelStyle()}>{card.label}</div>
                <div style={metricValueStyle()}>{card.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 16
            }}
          >
            <div style={sectionStyle()}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
                Operational Ratios
              </div>

              {overviewRow('Open Alerts Ratio', ratio(summary.openAlerts, summary.totalAlerts))}
              {overviewRow('High Alerts Ratio', ratio(summary.highAlerts, summary.totalAlerts))}
              {overviewRow('Open Tasks Ratio', ratio(summary.openTasks, summary.totalTasks))}
              {overviewRow('High Priority Task Ratio', ratio(summary.highPriorityTasks, summary.totalTasks))}
            </div>

            <div style={sectionStyle()}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
                Response Metadata
              </div>

              {overviewRow('Tenant ID', meta?.tenantId || '—')}
              {overviewRow('Source', meta?.source || '—')}
              {overviewRow('Summary Payload', 'Object-based response')}
              {overviewRow('Fallback Mode', 'Disabled for this page')}
            </div>
          </div>
        </>
      )}
    </div>
  );
}