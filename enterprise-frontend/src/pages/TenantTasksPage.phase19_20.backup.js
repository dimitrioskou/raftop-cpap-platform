import React, { useEffect, useMemo, useState } from 'react';

const FALLBACK_DATA = {
  summary: {
    total: 3,
    open: 3,
    resolved: 0,
    native: 1,
    patientSignal: 2
  },
  buckets: {
    all: 3,
    mostUrgent: 1,
    slaRisk: 2,
    callbackQueue: 1,
    therapyIssues: 1,
    complianceReview: 0
  },
  items: [
    {
      id: 'task-1',
      title: 'Follow-up: Issue reported: dryness',
      description: 'Severity: high. No extra note provided.',
      status: 'escalated',
      priority: 'critical',
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: 'RAFTOP Team',
      notes: '[PATIENT_SIGNAL]\nsignal_id=sig-1\nsignal_kind=issue\npatient_email=patient1@raftop.local\n[/PATIENT_SIGNAL]\n[ATLAS_RULE]\ncategory=THERAPY_ISSUE_CRITICAL\npriority=critical\n[/ATLAS_RULE]',
      notesExcerpt: 'Issue reported from patient action center',
      patientEmail: 'patient1@raftop.local',
      createdBy: 'patient@raftop.local',
      sourceType: 'patient_signal',
      signalId: 'sig-1',
      signalKind: 'issue',
      messageId: null,
      atlasCategory: 'THERAPY_ISSUE_CRITICAL',
      origin: 'patient_automation',
      workflowState: 'escalated',
      queueBucket: 'therapy_issues',
      urgencyScore: 96,
      badges: [
        { label: 'THERAPY ISSUE CRITICAL', tone: 'danger' },
        { label: 'Urgency 96', tone: 'danger' }
      ]
    },
    {
      id: 'task-2',
      title: 'Follow-up: Callback requested',
      description: 'Patient asked for callback.',
      status: 'pending',
      priority: 'warning',
      dueAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: 'RAFTOP Team',
      notes: '[PATIENT_SIGNAL]\nsignal_id=sig-2\nsignal_kind=callback\npatient_email=patient2@raftop.local\n[/PATIENT_SIGNAL]\n[ATLAS_RULE]\ncategory=CALLBACK_REQUEST\npriority=warning\n[/ATLAS_RULE]',
      notesExcerpt: 'Callback requested from patient action center',
      patientEmail: 'patient2@raftop.local',
      createdBy: 'patient@raftop.local',
      sourceType: 'patient_signal',
      signalId: 'sig-2',
      signalKind: 'callback',
      messageId: null,
      atlasCategory: 'CALLBACK_REQUEST',
      origin: 'patient_automation',
      workflowState: 'open',
      queueBucket: 'callback_queue',
      urgencyScore: 78,
      badges: [
        { label: 'CALLBACK REQUEST', tone: 'warning' },
        { label: 'Urgency 78', tone: 'warning' }
      ]
    },
    {
      id: 'task-3',
      title: 'Review patient note',
      description: 'Native provider task example.',
      status: 'pending',
      priority: 'normal',
      dueAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: 'Provider',
      notes: '',
      notesExcerpt: '',
      patientEmail: null,
      createdBy: 'admin@raftop.local',
      sourceType: 'native',
      signalId: null,
      signalKind: null,
      messageId: null,
      atlasCategory: null,
      origin: null,
      workflowState: 'open',
      queueBucket: 'general',
      urgencyScore: 44,
      badges: [{ label: 'Urgency 44', tone: 'neutral' }]
    }
  ],
  debug: 'fallback_mode'
};

function readToken() {
  try {
    return localStorage.getItem('raftop_auth_token') || '';
  } catch (_error) {
    return '';
  }
}

async function readJsonSafely(response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
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

function toneClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

function priorityTone(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'critical') return 'danger';
  if (p === 'warning') return 'warning';
  return 'neutral';
}

function workflowLabel(workflowState) {
  const value = String(workflowState || '').toLowerCase();

  if (value === 'resolved') return 'Resolved';
  if (value === 'escalated') return 'Escalated';
  if (value === 'in_progress') return 'In Progress';
  return 'Open';
}

export default function TenantTasksPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadTasks(preferredId = '') {
    setLoading(true);

    try {
      const token = readToken();

      const response = await fetch('/api/tenant/tasks-unified', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || payload?.ok === false || !payload?.data?.items) {
        throw new Error(payload?.message || 'Unified tasks request failed');
      }

      const nextData = payload.data;
      setData(nextData);
      setFallbackMode(false);
      setFlashMessage('');

      const targetId =
        preferredId ||
        selectedId ||
        nextData.items?.[0]?.id ||
        '';

      setSelectedId(targetId);
    } catch (error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setFlashMessage(error?.message || 'Unified tasks request failed');

      const targetId =
        preferredId ||
        selectedId ||
        FALLBACK_DATA.items?.[0]?.id ||
        '';

      setSelectedId(targetId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    if (sourceFilter) {
      items = items.filter((item) => String(item.sourceType || '') === sourceFilter);
    }

    if (workflowFilter) {
      items = items.filter((item) => String(item.workflowState || '') === workflowFilter);
    }

    if (bucketFilter) {
      items = items.filter((item) => String(item.queueBucket || '') === bucketFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();

      items = items.filter((item) => {
        const haystack = [
          item.title,
          item.description,
          item.patientEmail,
          item.assignedTo,
          item.atlasCategory,
          item.signalKind,
          item.signalId,
          item.messageId,
          item.notesExcerpt,
          item.queueBucket
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [data.items, sourceFilter, workflowFilter, bucketFilter, searchTerm]);

  const selectedTask = useMemo(() => {
    return filteredItems.find((item) => String(item.id) === String(selectedId)) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  if (loading) {
    return (
      <div className="tenant-tasks-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading unified tasks...</div>
      </div>
    );
  }

  return (
    <div className="tenant-tasks-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">TASKS UNIFIED</div>
          <h1>Operational Task Surface</h1>
          <p>
            Ενιαία προβολή native tasks και patient-signal-driven tasks με urgency, queue bucket και ATLAS metadata.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Open <strong>{data.summary?.open ?? 0}</strong></div>
          <div className="summary-pill">Resolved <strong>{data.summary?.resolved ?? 0}</strong></div>
          <div className="summary-pill">Native <strong>{data.summary?.native ?? 0}</strong></div>
          <div className="summary-pill">Patient Signal <strong>{data.summary?.patientSignal ?? 0}</strong></div>
          <div className="summary-pill">Most Urgent <strong>{data.buckets?.mostUrgent ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Το endpoint `/api/tenant/tasks-unified` δεν απάντησε σωστά.
          {flashMessage ? ` (${flashMessage})` : ''}
        </div>
      ) : (
        <div className="banner info">
          Real unified tasks payload loaded successfully.
        </div>
      )}

      <section className="bucket-row">
        <div className="bucket-card">
          <div className="bucket-label">All</div>
          <div className="bucket-value">{data.buckets?.all ?? 0}</div>
        </div>
        <div className="bucket-card">
          <div className="bucket-label">SLA Risk</div>
          <div className="bucket-value">{data.buckets?.slaRisk ?? 0}</div>
        </div>
        <div className="bucket-card">
          <div className="bucket-label">Callback Queue</div>
          <div className="bucket-value">{data.buckets?.callbackQueue ?? 0}</div>
        </div>
        <div className="bucket-card">
          <div className="bucket-label">Therapy Issues</div>
          <div className="bucket-value">{data.buckets?.therapyIssues ?? 0}</div>
        </div>
        <div className="bucket-card">
          <div className="bucket-label">Compliance Review</div>
          <div className="bucket-value">{data.buckets?.complianceReview ?? 0}</div>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select className="input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All sources</option>
            <option value="native">native</option>
            <option value="patient_signal">patient_signal</option>
          </select>

          <select className="input" value={workflowFilter} onChange={(e) => setWorkflowFilter(e.target.value)}>
            <option value="">All workflow states</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="escalated">escalated</option>
            <option value="resolved">resolved</option>
          </select>

          <select className="input" value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value)}>
            <option value="">All buckets</option>
            <option value="callback_queue">callback_queue</option>
            <option value="therapy_issues">therapy_issues</option>
            <option value="compliance_review">compliance_review</option>
            <option value="general">general</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            className="input search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, patient, category, signal..."
          />

          <button type="button" className="ghost-btn" onClick={() => loadTasks(selectedTask?.id || '')}>
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card left-col">
          <div className="section-title">Tasks</div>

          <div className="task-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`task-row ${selectedTask?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="task-row-top">
                    <span className="task-title">{item.title}</span>
                    <span className={`badge ${toneClass(priorityTone(item.priority))}`}>
                      {item.priority || 'normal'}
                    </span>
                  </div>

                  <div className="task-meta">
                    {workflowLabel(item.workflowState)} • {item.queueBucket || 'general'}
                  </div>

                  <div className="task-meta">
                    {item.patientEmail || 'No patient email'} • urgency {item.urgencyScore ?? 0}
                  </div>

                  <div className="task-badges-inline">
                    {(item.badges || []).slice(0, 2).map((badge, index) => (
                      <span key={`${badge.label}-${index}`} className={`mini-badge ${toneClass(badge.tone)}`}>
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-text">Δεν υπάρχουν tasks για αυτό το φίλτρο.</div>
            )}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Task Detail</div>

          {selectedTask ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedTask.title}</div>

              <div className="detail-badges">
                <span className={`badge ${toneClass(priorityTone(selectedTask.priority))}`}>
                  {selectedTask.priority || 'normal'}
                </span>
                <span className={`badge ${toneClass(selectedTask.workflowState === 'resolved' ? 'success' : selectedTask.workflowState === 'escalated' ? 'danger' : 'warning')}`}>
                  {workflowLabel(selectedTask.workflowState)}
                </span>
                <span className="badge neutral">
                  {selectedTask.queueBucket || 'general'}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Task ID</span>
                <span>{selectedTask.id}</span>
              </div>

              <div className="detail-row">
                <span className="label">Source Type</span>
                <span>{selectedTask.sourceType || 'native'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Urgency Score</span>
                <span>{selectedTask.urgencyScore ?? 0}</span>
              </div>

              <div className="detail-row">
                <span className="label">Patient</span>
                <span>{selectedTask.patientEmail || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Assigned To</span>
                <span>{selectedTask.assignedTo || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">ATLAS Category</span>
                <span>{selectedTask.atlasCategory || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Signal Kind</span>
                <span>{selectedTask.signalKind || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Signal ID</span>
                <span>{selectedTask.signalId || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Message ID</span>
                <span>{selectedTask.messageId || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Due</span>
                <span>{formatDateTime(selectedTask.dueAt)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Updated</span>
                <span>{formatDateTime(selectedTask.updatedAt)}</span>
              </div>

              <div className="detail-description">
                {selectedTask.description || 'No description'}
              </div>

              <div className="subsection-title">Badges</div>
              <div className="detail-badges">
                {(selectedTask.badges || []).length ? (
                  selectedTask.badges.map((badge, index) => (
                    <span key={`${badge.label}-${index}`} className={`badge ${toneClass(badge.tone)}`}>
                      {badge.label}
                    </span>
                  ))
                ) : (
                  <span className="muted-inline">No badges</span>
                )}
              </div>

              <div className="subsection-title">Actions</div>
              <div className="detail-actions">
                {selectedTask.signalId ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      window.location.href = '/tenant/patient-signals';
                    }}
                  >
                    Open Patient Signals
                  </button>
                ) : null}

                {selectedTask.messageId ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      window.location.href = '/tenant/patient-messages';
                    }}
                  >
                    Open Patient Inbox
                  </button>
                ) : null}
              </div>

              <div className="subsection-title">Notes / Metadata</div>
              <pre className="metadata-box">
                {selectedTask.notes || 'No notes'}
              </pre>
            </div>
          ) : (
            <div className="empty-text">Επίλεξε task για προβολή.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-tasks-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .toolbar-card,
  .bucket-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 420px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(22,163,74,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #16a34a;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #ecfdf5;
    border: 1px solid #86efac;
    color: #047857;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
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

  .bucket-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .bucket-card {
    padding: 16px;
  }

  .bucket-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .bucket-value {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 430px 1fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .task-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .task-row.active {
    background: #ecfdf5;
    border-color: #86efac;
    box-shadow: 0 0 0 3px rgba(22,163,74,0.08);
  }

  .task-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .task-title {
    font-weight: 900;
    color: #0f172a;
  }

  .task-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .task-badges-inline {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .detail-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-title {
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .label {
    color: #475569;
    font-weight: 800;
  }

  .detail-description {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .detail-badges,
  .detail-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .subsection-title {
    margin-top: 6px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .metadata-box {
    margin: 0;
    padding: 14px;
    border-radius: 16px;
    background: #0f172a;
    color: #e2e8f0;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
  }

  .badge,
  .mini-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .mini-badge {
    padding: 6px 8px;
  }

  .badge.success,
  .mini-badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.warning,
  .mini-badge.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge.danger,
  .mini-badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge.neutral,
  .mini-badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .input {
    min-width: 170px;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .input.search {
    min-width: 280px;
  }

  .ghost-btn,
  .primary-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 800;
    cursor: pointer;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #ffffff;
  }

  .muted-inline,
  .empty-text {
    color: #64748b;
  }

  @media (max-width: 1180px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .bucket-row {
      grid-template-columns: 1fr 1fr;
    }

    .summary-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 760px) {
    .bucket-row,
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .input.search {
      min-width: 170px;
    }
  }
`;