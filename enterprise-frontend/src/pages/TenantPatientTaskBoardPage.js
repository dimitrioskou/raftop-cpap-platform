import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

function buildUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function readToken() {
  try {
    return (
      localStorage.getItem('raftop_auth_token') ||
      localStorage.getItem('token') ||
      ''
    );
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

async function apiRequest(path, options = {}) {
  const token = readToken();

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || options.errorLabel || 'Patient task board request failed');
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  patient: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  summary: {
    total: 4,
    pending: 1,
    inProgress: 1,
    escalated: 1,
    done: 1,
    critical: 1,
    warning: 2
  },
  columns: {
    pending: [
      {
        id: 'task-1',
        title: 'Call patient about mask dryness',
        status: 'pending',
        priority: 'warning',
        assignedTo: 'RAFTOP Team',
        dueAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        atlasCategory: 'THERAPY_ISSUE'
      }
    ],
    in_progress: [
      {
        id: 'task-2',
        title: 'Review coaching adherence',
        status: 'in_progress',
        priority: 'warning',
        assignedTo: 'RAFTOP Team',
        dueAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        atlasCategory: 'COACHING_REVIEW'
      }
    ],
    escalated: [
      {
        id: 'task-3',
        title: 'Urgent follow-up for issue signal',
        status: 'escalated',
        priority: 'critical',
        assignedTo: 'RAFTOP Team',
        dueAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        atlasCategory: 'THERAPY_ISSUE_CRITICAL'
      }
    ],
    done: [
      {
        id: 'task-4',
        title: 'Import recovery handled',
        status: 'done',
        priority: 'normal',
        assignedTo: 'RAFTOP Team',
        dueAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        atlasCategory: 'SYNC_RECOVERY'
      }
    ]
  },
  items: []
};

function badgeClass(tone = '') {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

function priorityTone(priority = '') {
  const value = String(priority || '').toLowerCase();

  if (value === 'critical') return 'danger';
  if (value === 'warning') return 'warning';
  if (value === 'success') return 'success';
  return 'neutral';
}

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function columnTitle(key) {
  if (key === 'pending') return 'Pending';
  if (key === 'in_progress') return 'In Progress';
  if (key === 'escalated') return 'Escalated';
  if (key === 'done') return 'Done';
  return key;
}

function nextStatusOptions(currentStatus) {
  const normalized = String(currentStatus || '').toLowerCase();

  if (normalized === 'pending') return ['in_progress', 'escalated', 'done'];
  if (normalized === 'in_progress') return ['pending', 'escalated', 'done'];
  if (normalized === 'escalated') return ['in_progress', 'done'];
  if (normalized === 'done') return ['pending', 'in_progress'];
  return ['pending', 'in_progress', 'escalated', 'done'];
}

function normalizeStatusFilter(value) {
  const v = String(value || '').toLowerCase();
  if (['pending', 'in_progress', 'escalated', 'done'].includes(v)) return v;
  return '';
}

export default function TenantPatientTaskBoardPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRef = params.patientRef || 'patient@raftop.local';
  const initialStatusFilter = normalizeStatusFilter(searchParams.get('status'));
  const initialFocusTask = searchParams.get('taskId') || '';
  const initialSearch = searchParams.get('q') || '';

  const [patientRef, setPatientRef] = useState(initialRef);
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [busyId, setBusyId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(initialFocusTask);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [searchText, setSearchText] = useState(initialSearch);

  async function loadBoard(ref = patientRef, preferredTaskId = '') {
    setLoading(true);

    try {
      const payload = await apiRequest(`/api/tenant/patient-tasks/${encodeURIComponent(ref)}`, {
        errorLabel: 'Patient task board request failed'
      });

      const nextData = payload || FALLBACK_DATA;
      setData(nextData);
      setFallbackMode(false);
      setFlashMessage('');

      const allItems = [
        ...(nextData.columns?.pending || []),
        ...(nextData.columns?.in_progress || []),
        ...(nextData.columns?.escalated || []),
        ...(nextData.columns?.done || [])
      ];

      const taskToSelect =
        preferredTaskId ||
        initialFocusTask ||
        allItems[0]?.id ||
        '';

      setSelectedTaskId(taskToSelect);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);

      const allItems = [
        ...(FALLBACK_DATA.columns?.pending || []),
        ...(FALLBACK_DATA.columns?.in_progress || []),
        ...(FALLBACK_DATA.columns?.escalated || []),
        ...(FALLBACK_DATA.columns?.done || [])
      ];

      setSelectedTaskId(preferredTaskId || initialFocusTask || allItems[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPatientRef(initialRef);
    loadBoard(initialRef, initialFocusTask);
  }, [initialRef]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (statusFilter) next.set('status', statusFilter);
    else next.delete('status');

    if (searchText.trim()) next.set('q', searchText.trim());
    else next.delete('q');

    if (selectedTaskId) next.set('taskId', selectedTaskId);
    else next.delete('taskId');

    setSearchParams(next, { replace: true });
  }, [statusFilter, searchText, selectedTaskId, setSearchParams]);

  const flatItems = useMemo(() => {
    return [
      ...(data.columns?.pending || []),
      ...(data.columns?.in_progress || []),
      ...(data.columns?.escalated || []),
      ...(data.columns?.done || [])
    ];
  }, [data.columns]);

  const filteredFlatItems = useMemo(() => {
    let items = [...flatItems];

    if (statusFilter) {
      items = items.filter((item) => String(item.status || '') === statusFilter);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.title,
          item.notes,
          item.atlasCategory,
          item.assignedTo,
          item.signalId,
          item.signalKind
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [flatItems, statusFilter, searchText]);

  const filteredColumns = useMemo(() => {
    const byId = new Set(filteredFlatItems.map((item) => item.id));

    return {
      pending: (data.columns?.pending || []).filter((item) => byId.has(item.id)),
      in_progress: (data.columns?.in_progress || []).filter((item) => byId.has(item.id)),
      escalated: (data.columns?.escalated || []).filter((item) => byId.has(item.id)),
      done: (data.columns?.done || []).filter((item) => byId.has(item.id))
    };
  }, [data.columns, filteredFlatItems]);

  const selectedTask = useMemo(() => {
    return (
      filteredFlatItems.find((item) => item.id === selectedTaskId) ||
      filteredFlatItems[0] ||
      null
    );
  }, [filteredFlatItems, selectedTaskId]);

  async function handleStatusChange(taskId, status) {
    setBusyId(`${taskId}:${status}`);
    setFlashMessage('');

    try {
      await apiRequest(`/api/tenant/patient-tasks/task/${encodeURIComponent(taskId)}/status`, {
        method: 'POST',
        body: { status },
        errorLabel: 'Task status update failed'
      });

      setFlashMessage('Το task status ενημερώθηκε επιτυχώς.');
      await loadBoard(patientRef, taskId);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία ενημέρωσης task');
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <div className="tenant-patient-task-board-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient task board...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-task-board-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PATIENT TASK BOARD</div>
          <h1>Filtered Patient Tasks</h1>
          <p>
            Task board ειδικά για έναν patient, με status transitions, filters και direct deep-link focus.
          </p>

          <div className="hero-meta">
            <span className="hero-chip">{data.patient?.fullName || 'Patient'}</span>
            <span className="hero-chip">{data.patient?.email || '—'}</span>
          </div>
        </div>

        <div className="hero-side">
          <div className="field">
            <label className="field-label">Patient Email or ID</label>
            <input
              className="input"
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="patient@raftop.local"
            />
          </div>

          <button type="button" className="primary-btn" onClick={() => loadBoard(patientRef)}>
            Load Patient Tasks
          </button>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Patient task board σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select
            className="input compact"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="escalated">escalated</option>
            <option value="done">done</option>
          </select>

          <input
            className="input compact"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search task, category, notes..."
          />
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className="ghost-btn"
            onClick={() =>
              (window.location.href = `/tenant/patient-orchestrator/${encodeURIComponent(
                data.patient?.email || patientRef
              )}`)
            }
          >
            Open Patient Orchestrator
          </button>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setStatusFilter('');
              setSearchText('');
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card"><div className="summary-label">Total</div><div className="summary-value">{data.summary?.total ?? 0}</div></div>
        <div className="summary-card"><div className="summary-label">Pending</div><div className="summary-value">{data.summary?.pending ?? 0}</div></div>
        <div className="summary-card"><div className="summary-label">In Progress</div><div className="summary-value">{data.summary?.inProgress ?? 0}</div></div>
        <div className="summary-card"><div className="summary-label">Escalated</div><div className="summary-value">{data.summary?.escalated ?? 0}</div></div>
        <div className="summary-card"><div className="summary-label">Done</div><div className="summary-value">{data.summary?.done ?? 0}</div></div>
        <div className="summary-card"><div className="summary-label">Critical</div><div className="summary-value">{data.summary?.critical ?? 0}</div></div>
      </section>

      <section className="board-grid">
        {['pending', 'in_progress', 'escalated', 'done'].map((columnKey) => (
          <div key={columnKey} className="column-card">
            <div className="column-title">
              {columnTitle(columnKey)} <span>({(filteredColumns?.[columnKey] || []).length})</span>
            </div>

            <div className="task-list">
              {(filteredColumns?.[columnKey] || []).length ? (
                filteredColumns[columnKey].map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`task-card ${selectedTask?.id === task.id ? 'active' : ''}`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className={`badge ${badgeClass(priorityTone(task.priority))}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="task-meta">{task.assignedTo}</div>
                    <div className="task-meta">{task.atlasCategory || '—'}</div>
                  </button>
                ))
              ) : (
                <div className="muted-inline">No tasks.</div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="page-card">
        <div className="section-title">Task Detail</div>

        {selectedTask ? (
          <div className="detail-wrap">
            <div className="detail-title">{selectedTask.title}</div>

            <div className="detail-badges">
              <span className={`badge ${badgeClass(priorityTone(selectedTask.priority))}`}>
                {selectedTask.priority}
              </span>
              <span className="badge neutral">{selectedTask.status}</span>
              <span className="badge neutral">{selectedTask.atlasCategory || 'NO_CATEGORY'}</span>
            </div>

            <div className="detail-row">
              <span className="label">Assigned To</span>
              <span>{selectedTask.assignedTo || '—'}</span>
            </div>

            <div className="detail-row">
              <span className="label">Due At</span>
              <span>{formatDateTime(selectedTask.dueAt)}</span>
            </div>

            <div className="detail-row">
              <span className="label">Updated At</span>
              <span>{formatDateTime(selectedTask.updatedAt)}</span>
            </div>

            <div className="detail-row">
              <span className="label">Signal ID</span>
              <span>{selectedTask.signalId || '—'}</span>
            </div>

            <div className="detail-row">
              <span className="label">Signal Kind</span>
              <span>{selectedTask.signalKind || '—'}</span>
            </div>

            <div className="detail-description">
              {selectedTask.notes || 'No notes available.'}
            </div>

            <div className="section-title small">Quick Status Change</div>

            <div className="detail-actions">
              {nextStatusOptions(selectedTask.status).map((status) => (
                <button
                  key={status}
                  type="button"
                  className="ghost-btn"
                  disabled={busyId === `${selectedTask.id}:${status}`}
                  onClick={() => handleStatusChange(selectedTask.id, status)}
                >
                  {busyId === `${selectedTask.id}:${status}`}
                    ? 'Updating...'
                    : `Move to ${status}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="muted-inline">No task selected.</div>
        )}
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-task-board-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .summary-card,
  .column-card,
  .toolbar-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(6,182,212,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,254,255,0.96));
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

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0891b2;
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

  .hero-meta {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #ecfeff;
    color: #0f766e;
    border: 1px solid #a5f3fc;
    font-size: 12px;
    font-weight: 800;
  }

  .hero-side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label,
  .section-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .section-title.small {
    margin-top: 8px;
    font-size: 13px;
  }

  .input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .input.compact {
    min-width: 220px;
  }

  .primary-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #0891b2 0%, #155e75 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
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

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .summary-value {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
  }

  .board-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .column-card {
    padding: 16px;
    min-height: 280px;
  }

  .column-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .task-card {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 12px;
    cursor: pointer;
  }

  .task-card.active {
    background: #ecfeff;
    border-color: #67e8f9;
    box-shadow: 0 0 0 3px rgba(6,182,212,0.08);
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

  .detail-badges,
  .detail-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
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

  .detail-description {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .label {
    color: #475569;
    font-weight: 800;
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

  .badge.success { background: #ecfdf5; color: #047857; border: 1px solid #86efac; }
  .badge.warning { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
  .badge.danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .badge.neutral { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 1300px) {
    .summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .board-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }

    .board-grid {
      grid-template-columns: 1fr;
    }

    .toolbar-card {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-group {
      justify-content: stretch;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .input.compact {
      min-width: 100%;
    }
  }
`;