import React, { useEffect, useMemo, useState } from 'react';
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

function severityBadgeStyle(severity) {
  const map = {
    critical: { bg: '#fef2f2', border: '#fca5a5', color: '#b42318' },
    high: { bg: '#fff4ed', border: '#fdba74', color: '#c2410c' },
    medium: { bg: '#fffaeb', border: '#fcd34d', color: '#b54708' },
    low: { bg: '#eff8ff', border: '#93c5fd', color: '#1d4ed8' }
  };

  const current = map[String(severity || 'low').toLowerCase()] || map.low;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: 999,
    background: current.bg,
    border: `1px solid ${current.border}`,
    color: current.color,
    fontWeight: 800,
    fontSize: 12
  };
}

function normalizeQueueItem(item, index = 0) {
  return {
    id: item?.id || `queue-${index + 1}`,
    type: item?.type || 'item',
    title: item?.title || `Queue Item ${index + 1}`,
    subtitle: item?.subtitle || '',
    severity: String(item?.severity || 'medium').toLowerCase(),
    status: String(item?.status || 'open').toLowerCase(),
    patientId: item?.patientId || null,
    deviceId: item?.deviceId || null,
    source: item?.source || 'atlas'
  };
}

export default function AtlasQueuePage() {
  const [queue, setQueue] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/queue');
        const rows = Array.isArray(payload?.queue) ? payload.queue : [];

        if (!mounted) return;

        setQueue(rows.map((item, index) => normalizeQueueItem(item, index)));
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || 'Failed to load ATLAS queue');
        setQueue([]);
        setMeta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredQueue = useMemo(() => {
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return queue;

    return queue.filter((item) =>
      [item.title, item.subtitle, item.type, item.status, item.severity, item.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [queue, query]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>
            ATLAS SYSTEM
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
            Queue
          </h1>
          <div style={{ color: '#667085' }}>
            Prioritized operational queue for alerts and tasks.
          </div>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search queue..."
          style={{
            width: 320,
            maxWidth: '100%',
            border: '1px solid #d0d5dd',
            borderRadius: 14,
            padding: '12px 14px',
            outline: 'none',
            fontSize: 14
          }}
        />
      </div>

      {error ? (
        <div style={{ ...cardStyle(), background: '#fff1f2', border: '1px solid #fda4af', color: '#b42318', marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading ATLAS queue...</div>
      ) : filteredQueue.length === 0 ? (
        <div style={cardStyle()}>No queue items found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredQueue.map((item) => (
            <div
              key={item.id}
              style={{
                ...cardStyle(),
                display: 'grid',
                gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
                gap: 14,
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#101828', marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ color: '#667085', fontSize: 13 }}>{item.subtitle || '—'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Severity</div>
                <div style={severityBadgeStyle(item.severity)}>{item.severity}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Status</div>
                <div style={{ fontWeight: 800 }}>{item.status}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>Source</div>
                <div style={{ fontWeight: 800 }}>{item.source}</div>
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