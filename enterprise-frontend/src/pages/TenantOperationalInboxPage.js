import React, { useEffect, useMemo, useState } from 'react';

const FALLBACK_DATA = {
  summary: {
    total: 2,
    openCount: 2,
    resolvedCount: 0,
    callbackRelatedCount: 1,
    issueRelatedCount: 1
  },
  items: [
    {
      id: 'demo-1',
      title: 'Follow-up: Callback requested',
      description: 'Phone: 69XXXXXXXX. Preferred window: Απόγευμα.',
      patientEmail: 'patient1@raftop.local',
      patientSignalId: 'sig-1',
      signalKind: 'callback',
      signalTitle: 'Callback requested',
      status: 'open',
      createdBy: 'doctor@raftop.local',
      createdAt: '2026-04-16T10:20:00.000Z',
      source: 'fallback'
    },
    {
      id: 'demo-2',
      title: 'Follow-up: Issue reported: mask_discomfort',
      description: 'Severity: high. Patient reports discomfort and interrupted sleep.',
      patientEmail: 'patient1@raftop.local',
      patientSignalId: 'sig-2',
      signalKind: 'issue',
      signalTitle: 'Issue reported: mask_discomfort',
      status: 'open',
      createdBy: 'doctor@raftop.local',
      createdAt: '2026-04-16T09:40:00.000Z',
      source: 'fallback'
    }
  ]
};

function readAuthToken() {
  try {
    return localStorage.getItem('raftop_auth_token') || '';
  } catch (_error) {
    return '';
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function normalizePayload(rawPayload) {
  const root = rawPayload?.data || rawPayload || {};

  return {
    summary: {
      total: Number(root.summary?.total ?? FALLBACK_DATA.summary.total),
      openCount: Number(root.summary?.openCount ?? FALLBACK_DATA.summary.openCount),
      resolvedCount: Number(root.summary?.resolvedCount ?? FALLBACK_DATA.summary.resolvedCount),
      callbackRelatedCount: Number(
        root.summary?.callbackRelatedCount ?? FALLBACK_DATA.summary.callbackRelatedCount
      ),
      issueRelatedCount: Number(
        root.summary?.issueRelatedCount ?? FALLBACK_DATA.summary.issueRelatedCount
      )
    },
    items:
      Array.isArray(root.items) && root.items.length
        ? root.items.map((item, index) => ({
            id: item?.id || `inbox-${index + 1}`,
            title: item?.title || 'Task',
            description: item?.description || '',
            patientEmail: item?.patientEmail || null,
            patientSignalId: item?.patientSignalId || null,
            signalKind: item?.signalKind || null,
            signalTitle: item?.signalTitle || null,
            status: item?.status || 'open',
            createdBy: item?.createdBy || null,
            createdAt: item?.createdAt || new Date().toISOString(),
            source: item?.source || 'db'
          }))
        : FALLBACK_DATA.items
  };
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'resolved') return 'resolved';
  return 'open';
}

export default function TenantOperationalInboxPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadInbox() {
    setLoading(true);

    try {
      const token = readAuthToken();

      const response = await fetch('/api/tenant/operational-inbox', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Operational inbox request failed with status ${response.status}`);
      }

      const payload = await response.json();
      setData(normalizePayload(payload));
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
  }, []);

  async function handleResolve(id) {
    setMessage('');
    setBusyId(id);

    try {
      const token = readAuthToken();

      const response = await fetch(`/api/tenant/operational-inbox/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || 'Resolve failed');
      }

      setMessage('Το task σημειώθηκε ως resolved.');
      await loadInbox();
    } catch (error) {
      setMessage(error.message || 'Resolve failed');
    } finally {
      setBusyId('');
    }
  }

  const orderedItems = useMemo(() => {
    return [...data.items].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [data.items]);

  if (loading) {
    return (
      <div className="inbox-page">
        <style>{pageStyles}</style>
        <div className="page-card">Φόρτωση operational inbox...</div>
      </div>
    );
  }

  return (
    <div className="inbox-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">OPERATIONAL INBOX</div>
          <h2>Patient-generated follow-up tasks</h2>
          <p>
            Αυτό είναι το bridge layer ανάμεσα σε patient actions και provider workflow.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">
            Total
            <strong>{data.summary.total}</strong>
          </div>
          <div className="summary-pill">
            Open
            <strong>{data.summary.openCount}</strong>
          </div>
          <div className="summary-pill">
            Resolved
            <strong>{data.summary.resolvedCount}</strong>
          </div>
          <div className="summary-pill">
            Callback
            <strong>{data.summary.callbackRelatedCount}</strong>
          </div>
          <div className="summary-pill">
            Issues
            <strong>{data.summary.issueRelatedCount}</strong>
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Το endpoint `/api/tenant/operational-inbox` δεν απάντησε σωστά.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="task-list">
        {orderedItems.map((item) => (
          <div key={item.id} className="page-card task-card">
            <div className="task-top">
              <div>
                <div className="task-title">{item.title}</div>
                <div className="task-meta">
                  {item.patientEmail || 'No patient email'} • {item.signalKind || 'task'} • {formatDateTime(item.createdAt)}
                </div>
              </div>

              <span className={`status-badge ${statusClass(item.status)}`}>
                {item.status}
              </span>
            </div>

            <p className="task-description">{item.description}</p>

            <div className="task-bottom">
              <div className="task-extra">
                source: {item.source}
                {item.createdBy ? ` • created by: ${item.createdBy}` : ''}
                {item.patientSignalId ? ` • signal: ${item.patientSignalId}` : ''}
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() => handleResolve(item.id)}
                disabled={busyId === item.id || item.status === 'resolved'}
              >
                {item.status === 'resolved'
                  ? 'Resolved'
                  : busyId === item.id
                  ? 'Working...'
                  : 'Resolve'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const pageStyles = `
  .inbox-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .hero-card,
  .page-card {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.96), rgba(236,254,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 8px;
  }

  .hero-card h2,
  .task-title {
    margin: 0;
    color: #0f172a;
  }

  .hero-card p,
  .task-description {
    margin: 10px 0 0;
    color: #475569;
    line-height: 1.65;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-content: start;
  }

  .summary-pill {
    padding: 12px 14px;
    border-radius: 16px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }

  .summary-pill strong {
    color: #0f172a;
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

  .banner.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .page-card {
    padding: 18px;
  }

  .task-top {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .task-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .status-badge {
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status-badge.open {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .status-badge.resolved {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .task-bottom {
    margin-top: 14px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .task-extra {
    font-size: 12px;
    color: #64748b;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 700;
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    color: white;
    box-shadow: 0 12px 24px rgba(79,70,229,0.18);
  }

  .primary-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 1180px) {
    .hero-card {
      grid-template-columns: 1fr;
    }
  }
`;