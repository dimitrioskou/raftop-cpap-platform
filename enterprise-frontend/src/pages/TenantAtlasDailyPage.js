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

function severityColor(severity) {
  const value = String(severity || '').toLowerCase();
  if (value === 'critical') return '#b42318';
  if (value === 'high') return '#c2410c';
  if (value === 'medium') return '#b54708';
  return '#1d4ed8';
}

function normalizeDailyItem(item, index = 0) {
  return {
    id: item?.id || `daily-${index + 1}`,
    title: item?.title || `Daily Item ${index + 1}`,
    subtitle: item?.subtitle || '',
    severity: String(item?.severity || 'medium').toLowerCase(),
    status: String(item?.status || 'open').toLowerCase()
  };
}

function listBlock(title, rows) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 10 }}>{title}</div>

      {rows.length === 0 ? (
        <div style={{ color: '#667085' }}>No items.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #eef2f6',
                borderRadius: 14,
                padding: 14
              }}
            >
              <div style={{ fontWeight: 900, color: '#101828', marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ color: '#667085', fontSize: 13, marginBottom: 6 }}>
                {item.subtitle || '—'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: severityColor(item.severity) }}>
                {item.severity} · {item.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AtlasDailyPage() {
  const [daily, setDaily] = useState({ urgent: [], routine: [], totals: { urgent: 0, routine: 0 }, date: null });
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/daily');
        const value = payload?.daily || {};

        if (!mounted) return;

        setDaily({
          date: value?.date || null,
          urgent: Array.isArray(value?.urgent) ? value.urgent.map((x, i) => normalizeDailyItem(x, i)) : [],
          routine: Array.isArray(value?.routine) ? value.routine.map((x, i) => normalizeDailyItem(x, i)) : [],
          totals: {
            urgent: Number(value?.totals?.urgent || 0),
            routine: Number(value?.totals?.routine || 0)
          }
        });
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || 'Failed to load ATLAS daily board');
        setDaily({ urgent: [], routine: [], totals: { urgent: 0, routine: 0 }, date: null });
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
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>Daily Board</h1>
        <div style={{ color: '#667085' }}>Urgent and routine ATLAS work for the day.</div>
      </div>

      {error ? (
        <div style={{ ...cardStyle(), background: '#fff1f2', border: '1px solid #fda4af', color: '#b42318', marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading ATLAS daily board...</div>
      ) : (
        <>
          <div style={{ ...cardStyle(), marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Date</div>
              <div style={{ fontWeight: 900 }}>{daily.date || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Urgent</div>
              <div style={{ fontWeight: 900 }}>{daily.totals.urgent}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Routine</div>
              <div style={{ fontWeight: 900 }}>{daily.totals.routine}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {listBlock('Urgent', daily.urgent)}
            {listBlock('Routine', daily.routine)}
          </div>

          <div style={{ ...cardStyle(), marginTop: 16 }}>
            <div style={{ fontSize: 13, color: '#667085' }}>
              Source: <strong>{meta?.source || '—'}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}