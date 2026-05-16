import React, { useMemo, useState } from 'react';

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
    throw new Error(payload?.message || options.errorLabel || 'Closed loop verification failed');
  }

  return payload?.data ?? payload;
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
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

function statusTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (['synced', 'ok', 'done', 'resolved', 'completed', 'pass', 'passed'].includes(value)) {
    return 'success';
  }

  if (['pending', 'open', 'in_progress', 'warning'].includes(value)) {
    return 'warning';
  }

  if (['failed', 'error', 'missing', 'not_found', 'fail'].includes(value)) {
    return 'danger';
  }

  return 'neutral';
}

function badgeClass(tone = '') {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  return 'neutral';
}

function getTaskId(task) {
  return firstValue(task?.id, task?.taskId, task?.task_id);
}

function getSignalId(signal) {
  return firstValue(signal?.id, signal?.signalId, signal?.signal_id);
}

function getTaskStatus(task) {
  return firstValue(task?.status, task?.taskStatus, task?.task_status, 'unknown');
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

function getSignalTaskStatus(signal) {
  return firstValue(signal?.taskStatus, signal?.task_status, 'unknown');
}

function getSignalFollowupStatus(signal) {
  return firstValue(signal?.followupStatus, signal?.followup_status, 'unknown');
}

function getLastWritebackAt(signal) {
  return firstValue(
    signal?.lastWritebackAt,
    signal?.last_writeback_at,
    signal?.writebackSyncedAt,
    signal?.writeback_synced_at
  );
}

function getLastPayload(signal) {
  return firstValue(signal?.lastActionPayload, signal?.last_action_payload, {});
}

function buildTaskApiPath({ taskId, signalId, sourceActionId }) {
  const query = new URLSearchParams();

  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);
  if (taskId) query.set('q', taskId);
  else if (signalId) query.set('q', signalId);

  return `/api/tenant/tasks-unified?${query.toString()}`;
}

function buildSignalApiPath({ signalId }) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);

  return `/api/tenant/patient-signals?${query.toString()}`;
}

function buildTaskUiPath({ taskId, signalId, sourceActionId }) {
  const query = new URLSearchParams();

  if (taskId) query.set('taskId', taskId);
  if (taskId) query.set('q', taskId);
  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);

  return `/tenant/tasks-unified?${query.toString()}`;
}

function buildSignalUiPath({ signalId }) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);

  return `/tenant/patient-signals?${query.toString()}`;
}

function openTenantRoute(path) {
  window.location.href = path;
}

function normalizeTasksPayload(payload) {
  const safe = payload || {};
  const tasks = safe.tasks || safe.items || safe.rows || [];
  return Array.isArray(tasks) ? tasks : [];
}

function normalizeSignalsPayload(payload) {
  const safe = payload || {};
  const signals = safe.signals || safe.items || safe.rows || [];
  return Array.isArray(signals) ? signals : [];
}

function calculateVerification({ task, signal, expectedSignalId }) {
  const checks = [];

  const taskId = getTaskId(task);
  const taskStatus = getTaskStatus(task);
  const taskSignalId = getTaskSignal(task);
  const signalId = getSignalId(signal);
  const signalTaskStatus = getSignalTaskStatus(signal);
  const signalFollowupStatus = getSignalFollowupStatus(signal);
  const lastWritebackAt = getLastWritebackAt(signal);

  checks.push({
    id: 'task_found',
    label: 'Task exists',
    status: taskId ? 'passed' : 'failed',
    detail: taskId || 'No task returned from /api/tenant/tasks-unified'
  });

  checks.push({
    id: 'task_has_signal',
    label: 'Task has linked signal',
    status: taskSignalId ? 'passed' : 'failed',
    detail: taskSignalId || 'Task does not contain linked signal id'
  });

  checks.push({
    id: 'signal_found',
    label: 'Signal exists',
    status: signalId ? 'passed' : 'failed',
    detail: signalId || 'No signal returned from /api/tenant/patient-signals'
  });

  checks.push({
    id: 'signal_id_matches',
    label: 'Signal ID matches task context',
    status:
      signalId && taskSignalId && String(signalId) === String(taskSignalId)
        ? 'passed'
        : 'failed',
    detail: `Task signal: ${taskSignalId || '—'} / Signal: ${signalId || '—'} / Expected: ${expectedSignalId || '—'}`
  });

  checks.push({
    id: 'task_status_written_back',
    label: 'Task status written to signal',
    status:
      signalTaskStatus &&
      signalTaskStatus !== 'pending' &&
      signalTaskStatus !== 'unknown'
        ? 'passed'
        : 'warning',
    detail: signalTaskStatus || 'No task_status on signal'
  });

  checks.push({
    id: 'followup_status_written_back',
    label: 'Follow-up status written to signal',
    status:
      signalFollowupStatus &&
      signalFollowupStatus !== 'pending' &&
      signalFollowupStatus !== 'unknown'
        ? 'passed'
        : 'warning',
    detail: signalFollowupStatus || 'No followup_status on signal'
  });

  checks.push({
    id: 'writeback_timestamp',
    label: 'Writeback timestamp exists',
    status: lastWritebackAt ? 'passed' : 'warning',
    detail: lastWritebackAt ? formatDateTime(lastWritebackAt) : 'No last_writeback_at / writeback_synced_at'
  });

  const failed = checks.filter((check) => check.status === 'failed').length;
  const warnings = checks.filter((check) => check.status === 'warning').length;

  let verdict = 'passed';

  if (failed > 0) verdict = 'failed';
  else if (warnings > 0) verdict = 'warning';

  return {
    verdict,
    checks,
    taskStatus,
    signalTaskStatus,
    signalFollowupStatus,
    lastWritebackAt
  };
}

function CheckRow({ check }) {
  const tone = statusTone(check.status);

  return (
    <div className={`check-row ${tone}`}>
      <div>
        <div className="check-label">{check.label}</div>
        <div className="check-detail">{check.detail}</div>
      </div>

      <span className={`badge ${badgeClass(tone)}`}>
        {check.status}
      </span>
    </div>
  );
}

function DetailRow({ label, value, tone }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={tone ? `detail-value ${tone}` : 'detail-value'}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function TenantClosedLoopVerificationPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search || ''), []);
  const initialTaskId = firstValue(params.get('taskId'), params.get('task_id'), '');
  const initialSignalId = firstValue(params.get('signalId'), params.get('signal_id'), 'AT-001');
  const initialSourceActionId = firstValue(params.get('sourceActionId'), params.get('source_action_id'), '');

  const [taskId, setTaskId] = useState(initialTaskId);
  const [signalId, setSignalId] = useState(initialSignalId);
  const [sourceActionId, setSourceActionId] = useState(initialSourceActionId);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [task, setTask] = useState(null);
  const [signal, setSignal] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState('');

  const verification = useMemo(() => {
    return calculateVerification({
      task,
      signal,
      expectedSignalId: signalId
    });
  }, [task, signal, signalId]);

  async function runVerification() {
    setLoading(true);
    setErrorMessage('');
    setTask(null);
    setSignal(null);

    try {
      const tasksPayload = await apiRequest(
        buildTaskApiPath({ taskId, signalId, sourceActionId }),
        {
          errorLabel: 'Unified tasks verification request failed'
        }
      );

      const tasks = normalizeTasksPayload(tasksPayload);
      const selectedTask =
        tasks.find((item) => {
          const currentTaskId = getTaskId(item);
          const currentSignalId = getTaskSignal(item);

          if (taskId && String(currentTaskId) === String(taskId)) return true;
          if (signalId && String(currentSignalId) === String(signalId)) return true;

          return false;
        }) ||
        tasks[0] ||
        null;

      const resolvedSignalId = firstValue(signalId, selectedTask ? getTaskSignal(selectedTask) : null);

      const signalsPayload = await apiRequest(
        buildSignalApiPath({ signalId: resolvedSignalId }),
        {
          errorLabel: 'Patient signals verification request failed'
        }
      );

      const signals = normalizeSignalsPayload(signalsPayload);
      const selectedSignal =
        signals.find((item) => String(getSignalId(item)) === String(resolvedSignalId)) ||
        signals[0] ||
        null;

      setTask(selectedTask);
      setSignal(selectedSignal);
      setLastCheckedAt(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error?.message || 'Closed loop verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="closed-loop-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">ATLAS CLOSED LOOP VERIFICATION</div>
          <h1>Closed Loop Verification</h1>
          <p>
            Αυτή η σελίδα ελέγχει αν το πραγματικό operational loop έκλεισε:
            ATLAS action, task creation, task transition, signal writeback και Patient Signals visibility.
          </p>
        </div>

        <div className={`verdict-card ${badgeClass(statusTone(verification.verdict))}`}>
          <span>Verdict</span>
          <strong>{verification.verdict}</strong>
          <small>{lastCheckedAt ? `Last checked: ${formatDateTime(lastCheckedAt)}` : 'Not checked yet'}</small>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="input-group">
          <label>Task ID</label>
          <input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            placeholder="atlas-task-..."
          />
        </div>

        <div className="input-group">
          <label>Signal ID</label>
          <input
            value={signalId}
            onChange={(event) => setSignalId(event.target.value)}
            placeholder="AT-001"
          />
        </div>

        <div className="input-group">
          <label>Source Action ID</label>
          <input
            value={sourceActionId}
            onChange={(event) => setSourceActionId(event.target.value)}
            placeholder="ATT-001"
          />
        </div>

        <button
          type="button"
          className="primary-btn"
          disabled={loading}
          onClick={runVerification}
        >
          {loading ? 'Checking...' : 'Run Verification'}
        </button>
      </section>

      {errorMessage ? (
        <div className="banner danger">
          {errorMessage}
        </div>
      ) : null}

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Verification Checks</div>

          <div className="check-list">
            {verification.checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Closed Loop Evidence</div>

          <div className="evidence-grid">
            <DetailRow label="Task ID" value={getTaskId(task)} />
            <DetailRow label="Task status" value={getTaskStatus(task)} tone={statusTone(getTaskStatus(task))} />
            <DetailRow label="Task linked signal" value={getTaskSignal(task)} />
            <DetailRow label="Signal ID" value={getSignalId(signal)} />
            <DetailRow label="Signal task status" value={getSignalTaskStatus(signal)} tone={statusTone(getSignalTaskStatus(signal))} />
            <DetailRow label="Signal follow-up status" value={getSignalFollowupStatus(signal)} tone={statusTone(getSignalFollowupStatus(signal))} />
            <DetailRow label="Last writeback" value={formatDateTime(getLastWritebackAt(signal))} />
            <DetailRow label="Payload action" value={getLastPayload(signal)?.action} />
            <DetailRow label="Payload task id" value={getLastPayload(signal)?.task_id || getLastPayload(signal)?.taskId} />
            <DetailRow label="Payload next status" value={getLastPayload(signal)?.next_status || getLastPayload(signal)?.task_status} />
          </div>

          <div className="action-row">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => openTenantRoute(buildTaskUiPath({ taskId: getTaskId(task) || taskId, signalId, sourceActionId }))}
            >
              Open Unified Task
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => openTenantRoute(buildSignalUiPath({ signalId: getSignalId(signal) || signalId }))}
            >
              Open Patient Signal
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => openTenantRoute('/tenant/atlas/action-center')}
            >
              Back to ATLAS
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .closed-loop-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .toolbar-card,
  .page-card,
  .verdict-card {
    background: rgba(255,255,255,0.96);
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
      radial-gradient(circle at top right, rgba(16,185,129,0.14), transparent 30%),
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

  .verdict-card {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .verdict-card span {
    color: #475569;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 12px;
  }

  .verdict-card strong {
    font-size: 28px;
    text-transform: uppercase;
  }

  .verdict-card small {
    color: #64748b;
  }

  .verdict-card.success {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .verdict-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }

  .verdict-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .verdict-card.neutral {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) 180px;
    gap: 12px;
    align-items: end;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .input-group label {
    color: #344054;
    font-weight: 900;
    font-size: 12px;
  }

  .input-group input {
    border: 1px solid #d0d5dd;
    border-radius: 14px;
    padding: 12px 14px;
    background: #fff;
    color: #101828;
    font-size: 14px;
    outline: none;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 470px 1fr;
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

  .check-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .check-row {
    border-radius: 16px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
  }

  .check-row.success {
    background: #ecfdf5;
    border-color: #86efac;
  }

  .check-row.warning {
    background: #fff7ed;
    border-color: #fdba74;
  }

  .check-row.danger {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .check-label {
    color: #0f172a;
    font-weight: 900;
  }

  .check-detail {
    margin-top: 5px;
    color: #64748b;
    font-size: 13px;
  }

  .evidence-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
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

  .detail-label {
    color: #475569;
    font-weight: 900;
  }

  .detail-value {
    color: #0f172a;
    font-weight: 800;
    text-align: right;
    word-break: break-word;
  }

  .detail-value.success {
    color: #047857;
  }

  .detail-value.warning {
    color: #c2410c;
  }

  .detail-value.danger {
    color: #b91c1c;
  }

  .action-row {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-transform: uppercase;
    white-space: nowrap;
    padding: 8px 10px;
    font-size: 11px;
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

  .primary-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
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
    font-weight: 700;
  }

  .banner.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  @media (max-width: 1100px) {
    .hero-card,
    .layout-grid,
    .toolbar-card {
      grid-template-columns: 1fr;
    }

    .evidence-grid {
      grid-template-columns: 1fr;
    }
  }
`;