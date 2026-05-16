import React, { useEffect, useMemo, useState } from 'react';

const FALLBACK_DATA = {
  summary: {
    total: 4,
    openCount: 4,
    taskCreatedCount: 2,
    taskMissingCount: 1,
    noRuleCount: 1,
    criticalCount: 1
  },
  items: [
    {
      id: 'sig-1',
      title: 'Callback requested',
      description: 'Patient requested callback for therapy questions.',
      kind: 'callback',
      status: 'open',
      source: 'patient_action_center',
      patientEmail: 'patient1@raftop.local',
      createdAt: new Date().toISOString(),
      metadata: {},
      automation: {
        status: 'task_created',
        label: 'Task Created',
        tone: 'success'
      },
      linkedTask: {
        id: 'task-101',
        title: 'Follow-up: Callback requested',
        status: 'pending',
        priority: 'warning',
        dueAt: new Date().toISOString(),
        assignedTo: 'RAFTOP Team',
        atlasCategory: 'CALLBACK_REQUEST'
      }
    },
    {
      id: 'sig-2',
      title: 'Issue reported: dryness',
      description: 'Severity: high. No extra note provided.',
      kind: 'issue',
      status: 'priority',
      source: 'patient_action_center',
      patientEmail: 'patient1@raftop.local',
      createdAt: new Date().toISOString(),
      metadata: {
        severity: 'high',
        issueType: 'dryness'
      },
      automation: {
        status: 'task_missing_critical',
        label: 'Critical Task Missing',
        tone: 'danger'
      },
      linkedTask: null
    },
    {
      id: 'sig-3',
      title: 'Therapy commitment acknowledged',
      description: 'Patient confirmed ongoing therapy adherence.',
      kind: 'acknowledge',
      status: 'logged',
      source: 'patient_action_center',
      patientEmail: 'patient3@raftop.local',
      createdAt: new Date().toISOString(),
      metadata: {},
      automation: {
        status: 'no_task_rule',
        label: 'No Task Rule',
        tone: 'neutral'
      },
      linkedTask: null
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

function badgeClassByTone(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

function canCreateTask(item) {
  const status = String(item?.automation?.status || '');
  return status === 'task_missing' || status === 'task_missing_critical';
}

export default function TenantPatientSignalsPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [automationFilter, setAutomationFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [flashMessage, setFlashMessage] = useState('');

  async function loadSignals(preferredId = '') {
    setLoading(true);

    try {
      const token = readToken();

      const response = await fetch('/api/tenant/patient-signals', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || 'Failed to load patient signals');
      }

      const nextData = payload?.data || FALLBACK_DATA;
      setData(nextData);
      setFallbackMode(false);

      const targetId =
        preferredId ||
        selectedId ||
        nextData.items?.[0]?.id ||
        '';

      setSelectedId(targetId);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);

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
    loadSignals();
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    if (kindFilter) {
      items = items.filter((item) => String(item.kind || '') === kindFilter);
    }

    if (automationFilter) {
      items = items.filter((item) => String(item.automation?.status || '') === automationFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.title,
          item.description,
          item.kind,
          item.status,
          item.source,
          item.patientEmail,
          item.linkedTask?.title,
          item.linkedTask?.atlasCategory
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [data.items, kindFilter, automationFilter, searchTerm]);

  const selectedSignal = useMemo(() => {
    return filteredItems.find((item) => String(item.id) === String(selectedId)) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  async function handleCreateTaskNow() {
    if (!selectedSignal) return;

    setBusyAction(`create-${selectedSignal.id}`);
    setFlashMessage('');

    try {
      const token = readToken();

      const response = await fetch(`/api/tenant/patient-signals/${selectedSignal.id}/create-task`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || 'Failed to create task from signal');
      }

      const automationResult = payload?.data?.automationResult;

      if (automationResult?.deduped) {
        setFlashMessage('Υπήρχε ήδη task για αυτό το signal. Έγινε dedupe.');
      } else if (automationResult?.skipped) {
        setFlashMessage(`Δεν δημιουργήθηκε task. Reason: ${automationResult.reason || 'NO_RULE'}`);
      } else {
        setFlashMessage('Το task δημιουργήθηκε επιτυχώς από το signal.');
      }

      await loadSignals(selectedSignal.id);
    } catch (error) {
      setFlashMessage(error?.message || 'Failed to create task from signal');
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <div className="tenant-patient-signals-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient signals...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-signals-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PATIENT SIGNALS</div>
          <h1>Patient Signals & Automation State</h1>
          <p>
            Παρακολούθηση patient actions, linked tasks και automation health μέσα στο ίδιο operational layer.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Open <strong>{data.summary?.openCount ?? 0}</strong></div>
          <div className="summary-pill">Task Created <strong>{data.summary?.taskCreatedCount ?? 0}</strong></div>
          <div className="summary-pill">Task Missing <strong>{data.summary?.taskMissingCount ?? 0}</strong></div>
          <div className="summary-pill">No Rule <strong>{data.summary?.noRuleCount ?? 0}</strong></div>
          <div className="summary-pill">Critical <strong>{data.summary?.criticalCount ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Patient signals page σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="banner info">
          {flashMessage}
        </div>
      ) : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select className="input" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="">All kinds</option>
            <option value="callback">callback</option>
            <option value="issue">issue</option>
            <option value="acknowledge">acknowledge</option>
          </select>

          <select className="input" value={automationFilter} onChange={(e) => setAutomationFilter(e.target.value)}>
            <option value="">All automation states</option>
            <option value="task_created">task_created</option>
            <option value="task_missing">task_missing</option>
            <option value="task_missing_critical">task_missing_critical</option>
            <option value="no_task_rule">no_task_rule</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, email, task, category..."
          />

          <button type="button" className="ghost-btn" onClick={() => loadSignals(selectedSignal?.id || '')}>
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card left-col">
          <div className="section-title">Signals</div>

          <div className="signal-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`signal-row ${selectedSignal?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="signal-row-top">
                    <span className="signal-title">{item.title}</span>
                    <span className={`badge ${badgeClassByTone(item.automation?.tone)}`}>
                      {item.automation?.label || 'Unknown'}
                    </span>
                  </div>

                  <div className="signal-meta">
                    {item.kind} • {item.patientEmail || '—'}
                  </div>

                  <div className="signal-meta">
                    {formatDateTime(item.createdAt)}
                  </div>

                  {item.linkedTask ? (
                    <div className="linked-task-preview">
                      Task: {item.linkedTask.title} • {item.linkedTask.priority}
                    </div>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="empty-text">Δεν υπάρχουν patient signals για αυτό το φίλτρο.</div>
            )}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Signal Detail</div>

          {selectedSignal ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedSignal.title}</div>

              <div className="detail-row">
                <span className="label">Patient</span>
                <span>{selectedSignal.patientEmail || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Kind</span>
                <span>{selectedSignal.kind || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Signal Status</span>
                <span>{selectedSignal.status || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Source</span>
                <span>{selectedSignal.source || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Created</span>
                <span>{formatDateTime(selectedSignal.createdAt)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Automation</span>
                <span className={`badge ${badgeClassByTone(selectedSignal.automation?.tone)}`}>
                  {selectedSignal.automation?.label || 'Unknown'}
                </span>
              </div>

              <div className="detail-description">
                {selectedSignal.description || '—'}
              </div>

              <div className="detail-actions">
                {selectedSignal.linkedTask ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      window.location.href = '/tenant/tasks';
                    }}
                  >
                    Open Tasks Surface
                  </button>
                ) : canCreateTask(selectedSignal) ? (
                  <button
                    type="button"
                    className="danger-btn"
                    disabled={busyAction === `create-${selectedSignal.id}`}
                    onClick={handleCreateTaskNow}
                  >
                    {busyAction === `create-${selectedSignal.id}` ? 'Creating...' : 'Create Task Now'}
                  </button>
                ) : (
                  <div className="muted-inline">
                    This signal has no manual task action.
                  </div>
                )}
              </div>

              <div className="subsection-title">Linked Task</div>

              {selectedSignal.linkedTask ? (
                <div className="task-card">
                  <div className="task-title">{selectedSignal.linkedTask.title}</div>

                  <div className="detail-row">
                    <span className="label">Task ID</span>
                    <span>{selectedSignal.linkedTask.id || '—'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Priority</span>
                    <span>{selectedSignal.linkedTask.priority || '—'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Task Status</span>
                    <span>{selectedSignal.linkedTask.status || '—'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Due</span>
                    <span>{formatDateTime(selectedSignal.linkedTask.dueAt)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Assigned To</span>
                    <span>{selectedSignal.linkedTask.assignedTo || '—'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">ATLAS Category</span>
                    <span>{selectedSignal.linkedTask.atlasCategory || '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="task-card missing">
                  No linked task found for this signal.
                </div>
              )}

              <div className="subsection-title">Metadata</div>
              <pre className="metadata-box">
                {JSON.stringify(selectedSignal.metadata || {}, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="empty-text">Επίλεξε signal για προβολή.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-signals-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .toolbar-card {
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
      radial-gradient(circle at top right, rgba(124,58,237,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,243,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7c3aed;
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
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    color: #6d28d9;
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

  .signal-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .signal-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .signal-row.active {
    background: #f5f3ff;
    border-color: #c4b5fd;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
  }

  .signal-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .signal-title {
    font-weight: 900;
    color: #0f172a;
  }

  .signal-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .linked-task-preview {
    margin-top: 10px;
    font-size: 12px;
    color: #4338ca;
    font-weight: 700;
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

  .task-card {
    padding: 14px;
    border-radius: 16px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
  }

  .task-card.missing {
    background: #fff7ed;
    border-color: #fdba74;
    color: #9a3412;
    font-weight: 700;
  }

  .task-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
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

  .badge {
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

  .badge.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .badge.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .input {
    min-width: 180px;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .ghost-btn,
  .primary-btn,
  .danger-btn {
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
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    color: #ffffff;
  }

  .danger-btn {
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #b91c1c;
  }

  .muted-inline {
    color: #64748b;
    font-size: 13px;
    font-weight: 700;
  }

  .empty-text {
    color: #64748b;
  }

  @media (max-width: 1180px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .summary-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;