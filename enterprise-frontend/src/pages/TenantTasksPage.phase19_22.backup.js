import React, { useEffect, useMemo, useState } from 'react';

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
    throw new Error(payload?.message || options.errorLabel || 'Unified tasks request failed');
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    total: 4,
    pending: 1,
    inProgress: 1,
    escalated: 1,
    done: 1,
    critical: 1,
    synced: 1,
    failed: 0
  },
  tasks: [
    {
      id: 'demo-task-1',
      title: 'Call critical compliance patient',
      description: 'Demo fallback task',
      patient_name: 'Demo Patient',
      owner: 'Operations Admin',
      priority: 'critical',
      status: 'escalated',
      source_action_id: 'ATT-DEMO',
      linked_signal_id: 'AT-DEMO',
      writeback_status: 'pending',
      created_at: new Date().toISOString()
    }
  ]
};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search || '');

  return {
    taskId: firstValue(params.get('taskId'), params.get('task_id')),
    q: firstValue(params.get('q'), params.get('search')),
    sourceActionId: firstValue(params.get('sourceActionId'), params.get('source_action_id')),
    signalId: firstValue(params.get('signalId'), params.get('signal_id')),
    status: firstValue(params.get('status')),
    includeArchived: firstValue(params.get('includeArchived'), params.get('include_archived'))
  };
}

function normalizePayload(payload) {
  const safePayload = payload || {};
  const tasks = safePayload.tasks || safePayload.items || safePayload.rows || [];

  return {
    ...safePayload,
    summary: safePayload.summary || FALLBACK_DATA.summary,
    tasks: Array.isArray(tasks) ? tasks : []
  };
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

function statusLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'open') return 'Open';
  if (value === 'pending') return 'Pending';
  if (value === 'in_progress') return 'In Progress';
  if (value === 'escalated') return 'Escalated';
  if (value === 'done') return 'Done';
  if (value === 'completed') return 'Completed';
  if (value === 'resolved') return 'Resolved';
  if (value === 'duplicate_archived') return 'Duplicate Archived';

  return status || 'Unknown';
}

function priorityTone(priority = '') {
  const value = String(priority || '').toLowerCase();

  if (value === 'critical') return 'danger';
  if (value === 'high' || value === 'warning') return 'warning';
  if (value === 'low') return 'neutral';

  return 'info';
}

function statusTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'done' || value === 'completed' || value === 'resolved') return 'success';
  if (value === 'escalated') return 'danger';
  if (value === 'in_progress') return 'warning';
  if (value === 'pending' || value === 'open') return 'info';

  return 'neutral';
}

function writebackTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'synced' || value === 'success') return 'success';
  if (value === 'pending' || value === 'queued' || value === 'processing') return 'info';
  if (value === 'failed' || value === 'error') return 'danger';
  if (value === 'partial') return 'warning';

  return 'neutral';
}

function badgeClass(tone = '') {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  if (tone === 'info') return 'info';
  return 'neutral';
}

function getTaskId(task) {
  return firstValue(task?.id, task?.taskId, task?.task_id);
}

function getTaskTitle(task) {
  return firstValue(task?.title, task?.task_title, 'Untitled task');
}

function getTaskPatient(task) {
  return firstValue(
    task?.patientName,
    task?.patient_name,
    task?.patientEmail,
    task?.patient_email,
    task?.case_id,
    '—'
  );
}

function getTaskStatus(task) {
  return firstValue(task?.status, task?.taskStatus, task?.task_status, 'open');
}

function getTaskPriority(task) {
  return firstValue(task?.priority, 'medium');
}

function getTaskWriteback(task) {
  return firstValue(task?.writebackStatus, task?.writeback_status, 'no_writeback');
}

function getTaskSignal(task) {
  return firstValue(
    task?.linkedSignalId,
    task?.linked_signal_id,
    task?.signalId,
    task?.signal_id,
    task?.atlasSignalId,
    task?.atlas_signal_id,
    task?.case_id
  );
}

function getTaskSourceAction(task) {
  return firstValue(task?.sourceActionId, task?.source_action_id, task?.sourceRef, task?.source_ref);
}

function getTaskCreatedAt(task) {
  return firstValue(task?.createdAt, task?.created_at, task?.updatedAt, task?.updated_at);
}

function taskMatchesFocus(task, focusTaskId) {
  if (!focusTaskId) return false;

  const taskId = getTaskId(task);
  const linkedTaskId = firstValue(task?.linkedTaskId, task?.linked_task_id);

  return String(taskId || '') === String(focusTaskId) ||
    String(linkedTaskId || '') === String(focusTaskId);
}

function groupTasks(tasks = []) {
  const groups = {
    pending: [],
    inProgress: [],
    escalated: [],
    done: []
  };

  for (const task of tasks) {
    const status = String(getTaskStatus(task) || '').toLowerCase();

    if (status === 'done' || status === 'completed' || status === 'resolved') {
      groups.done.push(task);
    } else if (status === 'escalated') {
      groups.escalated.push(task);
    } else if (status === 'in_progress') {
      groups.inProgress.push(task);
    } else {
      groups.pending.push(task);
    }
  }

  return groups;
}

function buildApiPath(params) {
  const query = new URLSearchParams();

  if (params.taskId) query.set('taskId', params.taskId);
  if (params.q) query.set('q', params.q);
  if (params.sourceActionId) query.set('sourceActionId', params.sourceActionId);
  if (params.signalId) query.set('signalId', params.signalId);
  if (params.status) query.set('status', params.status);
  if (params.includeArchived) query.set('includeArchived', params.includeArchived);

  const qs = query.toString();
  return qs ? `/api/tenant/tasks-unified?${qs}` : '/api/tenant/tasks-unified';
}

function openTenantRoute(path) {
  window.location.href = path;
}

function TaskCard({ task, focused }) {
  const taskId = getTaskId(task);
  const status = getTaskStatus(task);
  const priority = getTaskPriority(task);
  const writeback = getTaskWriteback(task);
  const signalId = getTaskSignal(task);
  const sourceActionId = getTaskSourceAction(task);

  return (
    <div className={`task-card ${focused ? 'focused' : ''}`} id={focused ? 'focused-task' : undefined}>
      <div className="task-card-top">
        <div>
          <div className="task-title">{getTaskTitle(task)}</div>
          <div className="task-subtitle">{getTaskPatient(task)}</div>
        </div>

        <span className={`badge ${badgeClass(priorityTone(priority))}`}>
          {priority}
        </span>
      </div>

      <div className="task-description">
        {task.description || task.details || 'No task description.'}
      </div>

      <div className="task-badges">
        <span className={`mini-badge ${badgeClass(statusTone(status))}`}>
          {statusLabel(status)}
        </span>

        <span className={`mini-badge ${badgeClass(writebackTone(writeback))}`}>
          {writeback || 'no_writeback'}
        </span>

        {focused ? <span className="mini-badge success">FOCUSED</span> : null}
      </div>

      <div className="task-meta-grid">
        <div>
          <span>Task ID</span>
          <strong>{taskId || '—'}</strong>
        </div>

        <div>
          <span>Signal</span>
          <strong>{signalId || '—'}</strong>
        </div>

        <div>
          <span>Source action</span>
          <strong>{sourceActionId || '—'}</strong>
        </div>

        <div>
          <span>Created</span>
          <strong>{formatDateTime(getTaskCreatedAt(task))}</strong>
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ title, tasks, focusTaskId }) {
  return (
    <section className="task-column">
      <div className="column-title">
        <span>{title}</span>
        <strong>{tasks.length}</strong>
      </div>

      <div className="column-list">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={getTaskId(task)}
              task={task}
              focused={taskMatchesFocus(task, focusTaskId)}
            />
          ))
        ) : (
          <div className="empty-column">No tasks.</div>
        )}
      </div>
    </section>
  );
}

export default function TenantTasksPage() {
  const [urlParams, setUrlParams] = useState(() => getUrlParams());
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => getUrlParams().q || '');

  async function loadTasks(nextParams = urlParams) {
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(buildApiPath(nextParams), {
        errorLabel: 'Unified tasks endpoint failed'
      });

      const normalized = normalizePayload(payload);

      setData(normalized);
      setFallbackMode(false);

      window.setTimeout(() => {
        const el = document.getElementById('focused-task');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setErrorMessage(error?.message || 'Unified tasks endpoint failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = getUrlParams();
    setUrlParams(params);
    setSearchTerm(params.q || '');
    loadTasks(params);
    
  }, []);

  const filteredTasks = useMemo(() => {
    let tasks = [...(data.tasks || [])];

    if (statusFilter) {
      tasks = tasks.filter((task) => String(getTaskStatus(task) || '').toLowerCase() === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();

      tasks = tasks.filter((task) => {
        const haystack = [
          getTaskId(task),
          getTaskTitle(task),
          getTaskPatient(task),
          getTaskStatus(task),
          getTaskPriority(task),
          getTaskWriteback(task),
          getTaskSignal(task),
          getTaskSourceAction(task),
          task.description,
          task.owner,
          task.action_group_name,
          task.actionGroupName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return tasks;
  }, [data.tasks, statusFilter, searchTerm]);

  const grouped = useMemo(() => groupTasks(filteredTasks), [filteredTasks]);

  const focusedTask = useMemo(() => {
    return (data.tasks || []).find((task) => taskMatchesFocus(task, urlParams.taskId)) || null;
  }, [data.tasks, urlParams.taskId]);

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
          <div className="eyebrow">UNIFIED TASK BOARD</div>
          <h1>Tenant Tasks</h1>
          <p>
            Ενιαία προβολή των ATLAS-generated follow-up tasks. Το Phase 19.21 κάνει focus
            στο linked task που έρχεται από το ATLAS Action Center.
          </p>

          <div className="hero-badges">
            {urlParams.taskId ? (
              <span className="badge success">Focused task: {urlParams.taskId}</span>
            ) : (
              <span className="badge neutral">No task focus</span>
            )}

            {urlParams.sourceActionId ? (
              <span className="badge neutral">Source: {urlParams.sourceActionId}</span>
            ) : null}

            {urlParams.signalId ? (
              <span className="badge neutral">Signal: {urlParams.signalId}</span>
            ) : null}
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? filteredTasks.length}</strong></div>
          <div className="summary-pill">Pending <strong>{data.summary?.pending ?? grouped.pending.length}</strong></div>
          <div className="summary-pill">In Progress <strong>{data.summary?.inProgress ?? grouped.inProgress.length}</strong></div>
          <div className="summary-pill">Escalated <strong>{data.summary?.escalated ?? grouped.escalated.length}</strong></div>
          <div className="summary-pill">Done <strong>{data.summary?.done ?? grouped.done.length}</strong></div>
          <div className="summary-pill">Critical <strong>{data.summary?.critical ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Το endpoint `/api/tenant/tasks-unified` δεν απάντησε σωστά.
          {errorMessage ? ` (${errorMessage})` : ''}
        </div>
      ) : (
        <div className="banner success">
          Live unified tasks endpoint connected.
        </div>
      )}

      {urlParams.taskId && focusedTask ? (
        <div className="banner info">
          Focused linked task found: <strong>{getTaskTitle(focusedTask)}</strong>
        </div>
      ) : null}

      {urlParams.taskId && !focusedTask && !fallbackMode ? (
        <div className="banner warning">
          Το taskId υπάρχει στο URL αλλά δεν βρέθηκε task με αυτό το id. Έλεγξε αν είναι archived ή αν ανήκει σε άλλο tenant/source.
        </div>
      ) : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">open</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="escalated">escalated</option>
            <option value="done">done</option>
            <option value="resolved">resolved</option>
          </select>

          <input
            className="input search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search task, patient, signal, action..."
          />
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setStatusFilter('');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => openTenantRoute('/tenant/atlas/action-center')}
          >
            Back to ATLAS
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => loadTasks(urlParams)}
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="focused-section">
        <div className="section-title">Focused Linked Task</div>

        {focusedTask ? (
          <TaskCard task={focusedTask} focused />
        ) : (
          <div className="page-card muted">
            No focused task selected or found.
          </div>
        )}
      </section>

      <section className="kanban-grid">
        <TaskColumn title="Pending / Open" tasks={grouped.pending} focusTaskId={urlParams.taskId} />
        <TaskColumn title="In Progress" tasks={grouped.inProgress} focusTaskId={urlParams.taskId} />
        <TaskColumn title="Escalated" tasks={grouped.escalated} focusTaskId={urlParams.taskId} />
        <TaskColumn title="Done" tasks={grouped.done} focusTaskId={urlParams.taskId} />
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
  .task-column,
  .task-card {
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 440px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(20,184,166,0.14), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,250,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0f766e;
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

  .hero-badges {
    margin-top: 14px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-self: start;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    color: #0f766e;
    font-weight: 900;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .summary-pill strong {
    color: #0f172a;
  }

  .banner {
    border-radius: 18px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 700;
  }

  .banner.warning {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #fdba74;
  }

  .banner.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
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

  .input.search {
    min-width: 360px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .focused-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .kanban-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .task-column {
    padding: 16px;
    min-height: 360px;
  }

  .column-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .column-title strong {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #334155;
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 12px;
  }

  .column-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .empty-column,
  .muted {
    color: #64748b;
    padding: 12px;
  }

  .task-card {
    padding: 16px;
    border-radius: 18px;
    box-shadow: none;
    border-color: #e2e8f0;
    transition: 0.16s ease;
  }

  .task-card.focused {
    border-color: #22c55e;
    background:
      radial-gradient(circle at top right, rgba(34,197,94,0.14), transparent 36%),
      #ffffff;
    box-shadow: 0 0 0 4px rgba(34,197,94,0.14), 0 18px 40px rgba(15,23,42,0.12);
  }

  .task-card-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }

  .task-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
  }

  .task-subtitle {
    margin-top: 5px;
    color: #64748b;
    font-size: 13px;
  }

  .task-description {
    margin-top: 10px;
    color: #334155;
    line-height: 1.6;
    font-size: 13px;
  }

  .task-badges {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .task-meta-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .task-meta-grid div {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px 10px;
  }

  .task-meta-grid span {
    display: block;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .task-meta-grid strong {
    display: block;
    color: #0f172a;
    font-size: 12px;
    word-break: break-word;
  }

  .badge,
  .mini-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .badge {
    padding: 8px 10px;
    font-size: 11px;
  }

  .mini-badge {
    padding: 6px 8px;
    font-size: 10px;
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

  .badge.info,
  .mini-badge.info {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .badge.neutral,
  .mini-badge.neutral {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .primary-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  @media (max-width: 1300px) {
    .kanban-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }

    .input.search {
      min-width: 220px;
    }
  }

  @media (max-width: 700px) {
    .summary-grid,
    .kanban-grid,
    .task-meta-grid {
      grid-template-columns: 1fr;
    }
  }
`;