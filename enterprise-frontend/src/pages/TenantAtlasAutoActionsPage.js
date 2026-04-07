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

function normalizeAction(item, index = 0) {
  return {
    id: item?.id || `auto-action-${index + 1}`,
    type: item?.type || 'action',
    title: item?.title || `Auto Action ${index + 1}`,
    recommendation: item?.recommendation || '',
    severity: String(item?.severity || 'low').toLowerCase(),
    patientId: item?.patientId || null,
    deviceId: item?.deviceId || null
  };
}

export default function AtlasAutoActionsPage() {
  const [actions, setActions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/auto-actions');
        const rows = Array.isArray(payload?.autoActions) ? payload.autoActions : [];

        if (!mounted) return;

        setActions(rows.map((item, index) => normalizeAction(item, index)));
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || 'Failed to load ATLAS auto-actions');
        setActions([]);
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
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>Auto Actions</h1>
        <div style={{ color: '#667085' }}>Recommended ATLAS actions from alerts and tasks.</div>
      </div>

      {error ? (
        <div style={{ ...cardStyle(), background: '#fff1f2', border: '1px solid #fda4af', color: '#b42318', marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading ATLAS auto-actions...</div>
      ) : actions.length === 0 ? (
        <div style={cardStyle()}>No ATLAS auto-actions found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {actions.map((action) => (
            <div key={action.id} style={cardStyle()}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
                {action.title}
              </div>
              <div style={{ color: '#667085', marginBottom: 10 }}>{action.recommendation || '—'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Type</div>
                  <div style={{ fontWeight: 800 }}>{action.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Severity</div>
                  <div style={{ fontWeight: 800 }}>{action.severity}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Patient ID</div>
                  <div style={{ fontWeight: 800 }}>{action.patientId || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Device ID</div>
                  <div style={{ fontWeight: 800 }}>{action.deviceId || '—'}</div>
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