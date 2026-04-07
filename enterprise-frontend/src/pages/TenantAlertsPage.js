import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

function cardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function alertColor(severity) {
  const value = String(severity || '').toLowerCase();
  if (value === 'critical') return '#b42318';
  if (value === 'high') return '#c2410c';
  if (value === 'medium') return '#b54708';
  return '#1d4ed8';
}

function normalizeAlert(item, index = 0) {
  return {
    id: item?.id || item?.alertId || `alert-${index + 1}`,
    title: item?.title || `Alert ${index + 1}`,
    message: item?.message || '',
    severity: String(item?.severity || 'medium').toLowerCase(),
    status: String(item?.status || 'open').toLowerCase(),
    category: String(item?.category || 'atlas').toLowerCase(),
    patientId: item?.patientId || null,
    deviceId: item?.deviceId || null,
    createdAt: item?.createdAt || null
  };
}

export default function AtlasAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/alerts');
        const rows = Array.isArray(payload?.alerts) ? payload.alerts : [];

        if (!mounted) return;

        setAlerts(rows.map((item, index) => normalizeAlert(item, index)));
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || 'Failed to load ATLAS alerts');
        setAlerts([]);
        setMeta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>ATLAS SYSTEM</div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>Alerts</h1>
        <div style={{ color: '#667085' }}>ATLAS alert stream and derived clinical/operational alerts.</div>
      </div>

      {error ? (
        <div style={{ ...cardStyle(), background: '#fff1f2', border: '1px solid #fda4af', color: '#b42318', marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading ATLAS alerts...</div>
      ) : alerts.length === 0 ? (
        <div style={cardStyle()}>No ATLAS alerts found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {alerts.map((alert) => (
            <div key={alert.id} style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#101828' }}>{alert.title}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: alertColor(alert.severity) }}>{alert.severity}</div>
              </div>
              <div style={{ color: '#667085', marginBottom: 10 }}>{alert.message || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Status</div>
                  <div style={{ fontWeight: 800 }}>{alert.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Category</div>
                  <div style={{ fontWeight: 800 }}>{alert.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Patient ID</div>
                  <div style={{ fontWeight: 800 }}>{alert.patientId || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Device ID</div>
                  <div style={{ fontWeight: 800 }}>{alert.deviceId || '—'}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: '#667085' }}>
              Source: <strong>{meta?.source || '—'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}