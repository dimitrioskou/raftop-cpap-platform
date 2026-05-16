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
    throw new Error(
      payload?.message ||
        options.errorLabel ||
        'Closed loop remediation request failed'
    );
  }

  return payload?.data ?? payload;
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
}

function parseJsonObject(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (_error) {
      return {};
    }
  }

  return {};
}

function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === 'object') {
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.queue)) return value.queue;
    if (Array.isArray(value.results)) return value.results;
    if (Array.isArray(value.checks)) return value.checks;
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
      if (parsed && Array.isArray(parsed.queue)) return parsed.queue;
      if (parsed && Array.isArray(parsed.results)) return parsed.results;
      if (parsed && Array.isArray(parsed.checks)) return parsed.checks;

      return [];
    } catch (_error) {
      return [];
    }
  }

  return [];
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

  if (
    [
      'task_exists',
      'created',
      'passed',
      'synced',
      'done',
      'resolved',
      'success',
      'ok'
    ].includes(value)
  ) {
    return 'success';
  }

  if (
    [
      'needs_task',
      'warning',
      'pending',
      'open',
      'skipped',
      'partial'
    ].includes(value)
  ) {
    return 'warning';
  }

  if (
    [
      'failed',
      'critical',
      'error',
      'missing',
      'not_found'
    ].includes(value)
  ) {
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

function statusLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'task_exists') return 'Task Exists';
  if (value === 'needs_task') return 'Needs Task';
  if (value === 'created') return 'Created';
  if (value === 'skipped') return 'Skipped';
  if (value === 'failed') return 'Failed';
  if (value === 'warning') return 'Warning';
  if (value === 'critical') return 'Critical';
  if (value === 'open') return 'Open';
  if (value === 'done') return 'Done';

  return status || 'Unknown';
}

function getVerification(item) {
  return item?.record || item?.verification || item || {};
}

function getRemediationTask(item) {
  return firstValue(item?.remediationTask, item?.remediation_task, item?.task, null);
}

function getQueueStatus(item) {
  return firstValue(item?.remediationStatus, item?.remediation_status, 'unknown');
}

function getRecordId(record) {
  return firstValue(record?.id, record?.verificationId, record?.verification_id);
}

function getRecordSignalId(record) {
  const evidence = parseJsonObject(record?.evidence);

  return firstValue(
    record?.signalId,
    record?.signal_id,
    evidence.signalId,
    evidence.taskSignalId
  );
}

function getRecordTaskId(record) {
  const evidence = parseJsonObject(record?.evidence);

  return firstValue(
    record?.taskId,
    record?.task_id,
    evidence.taskId,
    evidence.payloadTaskId
  );
}

function getRecordVerdict(record) {
  return firstValue(record?.verdict, 'unknown');
}

function getRecordCreatedAt(record) {
  return firstValue(record?.createdAt, record?.created_at);
}

function getRecordChecks(record) {
  return parseJsonArray(record?.checks);
}

function getRecordEvidence(record) {
  return parseJsonObject(record?.evidence);
}

function getTaskId(task) {
  return firstValue(task?.id, task?.taskId, task?.task_id);
}

function getTaskTitle(task) {
  return firstValue(task?.title, 'Remediation task');
}

function getTaskPriority(task) {
  return firstValue(task?.priority, 'medium');
}

function getTaskStatus(task) {
  return firstValue(task?.status, 'open');
}

function getTaskSourceRef(task) {
  return firstValue(task?.sourceRef, task?.source_ref);
}

function buildQueuePath({ signalId, taskId, sourceActionId, verdict, limit = 25 }) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);
  if (taskId) query.set('taskId', taskId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);
  if (verdict) query.set('verdict', verdict);
  query.set('limit', String(limit));

  return `/api/tenant/closed-loop-remediation/queue?${query.toString()}`;
}

function buildRunPath({ signalId, taskId, sourceActionId, verdict, limit = 25 }) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);
  if (taskId) query.set('taskId', taskId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);
  if (verdict) query.set('verdict', verdict);
  query.set('limit', String(limit));

  return `/api/tenant/closed-loop-remediation/run?${query.toString()}`;
}

function openTenantRoute(path) {
  window.location.href = path;
}

function buildTaskUiPath(taskId) {
  const query = new URLSearchParams();

  if (taskId) {
    query.set('taskId', taskId);
    query.set('q', taskId);
  }

  return `/tenant/tasks-unified?${query.toString()}`;
}

function buildSignalUiPath(signalId) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);

  return `/tenant/patient-signals?${query.toString()}`;
}

function normalizeQueuePayload(payload) {
  const safe = payload || {};
  const items = safe.items || safe.queue || safe.rows || [];

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.36-closed-loop-remediation-ui',
    generatedAt: safe.generatedAt,
    total: safe.total ?? items.length,
    needsTask: firstValue(safe.needsTask, safe.needs_task, 0),
    taskExists: firstValue(safe.taskExists, safe.task_exists, 0),
    items: Array.isArray(items) ? items : []
  };
}

function normalizeRunPayload(payload) {
  const safe = payload || {};
  const results = safe.results || safe.items || safe.rows || [];

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.36-closed-loop-remediation-ui',
    generatedAt: safe.generatedAt,
    total: safe.total ?? results.length,
    created: safe.created || 0,
    skipped: safe.skipped || 0,
    results: Array.isArray(results) ? results : []
  };
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

function CheckRow({ check }) {
  const tone = statusTone(check?.status);

  return (
    <div className={`check-row ${tone}`}>
      <div>
        <div className="check-label">{check?.label || check?.id || 'Check'}</div>
        <div className="check-detail">{check?.detail || '—'}</div>
      </div>

      <span className={`badge ${badgeClass(tone)}`}>
        {statusLabel(check?.status)}
      </span>
    </div>
  );
}

function QueueRow({ item, active, onSelect }) {
  const record = getVerification(item);
  const task = getRemediationTask(item);
  const status = getQueueStatus(item);
  const verdict = getRecordVerdict(record);

  return (
    <button
      type="button"
      className={`queue-row ${active ? 'active' : ''}`}
      onClick={() => onSelect(item)}
    >
      <div className="queue-row-top">
        <span className="queue-title">
          {getRecordSignalId(record) || getRecordTaskId(record) || getRecordId(record)}
        </span>

        <span className={`badge ${badgeClass(statusTone(verdict))}`}>
          {statusLabel(verdict)}
        </span>
      </div>

      <div className="queue-meta">
        Verification: <strong>{getRecordId(record) || '—'}</strong>
      </div>

      <div className="queue-meta">
        Original task: <strong>{getRecordTaskId(record) || '—'}</strong>
      </div>

      <div className="queue-meta">
        Created: <strong>{formatDateTime(getRecordCreatedAt(record))}</strong>
      </div>

      <div className="queue-badges">
        <span className={`mini-badge ${badgeClass(statusTone(status))}`}>
          {statusLabel(status)}
        </span>

        {task ? (
          <span className="mini-badge success">
            {getTaskId(task)}
          </span>
        ) : (
          <span className="mini-badge warning">No remediation task</span>
        )}
      </div>
    </button>
  );
}

function SelectedQueueDetail({ item }) {
  if (!item) {
    return (
      <div className="empty-state">
        Επίλεξε ένα remediation item για λεπτομέρειες.
      </div>
    );
  }

  const record = getVerification(item);
  const task = getRemediationTask(item);
  const evidence = getRecordEvidence(record);
  const checks = getRecordChecks(record);
  const status = getQueueStatus(item);

  return (
    <div className="detail-wrap">
      <div className="detail-header">
        <div>
          <div className="eyebrow">SELECTED REMEDIATION CASE</div>
          <h2>{getRecordSignalId(record) || getRecordTaskId(record) || 'Closed loop case'}</h2>
        </div>

        <span className={`badge ${badgeClass(statusTone(status))}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="evidence-grid">
        <DetailRow label="Verification ID" value={getRecordId(record)} />
        <DetailRow
          label="Verdict"
          value={statusLabel(getRecordVerdict(record))}
          tone={statusTone(getRecordVerdict(record))}
        />
        <DetailRow label="Signal ID" value={getRecordSignalId(record)} />
        <DetailRow label="Original Task ID" value={getRecordTaskId(record)} />
        <DetailRow label="Created at" value={formatDateTime(getRecordCreatedAt(record))} />
        <DetailRow label="Task status evidence" value={evidence.taskStatus} />
        <DetailRow label="Signal task status" value={evidence.signalTaskStatus} />
        <DetailRow label="Signal follow-up" value={evidence.signalFollowupStatus} />
        <DetailRow label="Payload task id" value={evidence.payloadTaskId} />
        <DetailRow label="Last writeback" value={formatDateTime(evidence.lastWritebackAt)} />
      </div>

      <div className="section-subtitle">Remediation Task</div>

      {task ? (
        <>
          <div className="evidence-grid">
            <DetailRow label="Task ID" value={getTaskId(task)} />
            <DetailRow label="Title" value={getTaskTitle(task)} />
            <DetailRow
              label="Priority"
              value={getTaskPriority(task)}
              tone={statusTone(getTaskPriority(task))}
            />
            <DetailRow label="Status" value={getTaskStatus(task)} />
            <DetailRow label="Source ref" value={getTaskSourceRef(task)} />
          </div>

          <div className="action-row">
            <button
              type="button"
              className="success-btn"
              onClick={() => openTenantRoute(buildTaskUiPath(getTaskId(task)))}
            >
              Open Remediation Task
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state">
          Δεν έχει δημιουργηθεί ακόμα remediation task για αυτό το verification.
        </div>
      )}

      <div className="section-subtitle">Problem Checks</div>

      <div className="check-list">
        {checks.length ? (
          checks
            .filter((check) => ['failed', 'warning'].includes(String(check.status || '').toLowerCase()))
            .map((check) => (
              <CheckRow key={check.id || check.label} check={check} />
            ))
        ) : (
          <div className="empty-state">No stored checks.</div>
        )}
      </div>

      <div className="action-row">
        {getRecordSignalId(record) ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => openTenantRoute(buildSignalUiPath(getRecordSignalId(record)))}
          >
            Open Patient Signal
          </button>
        ) : null}

        {getRecordTaskId(record) ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => openTenantRoute(buildTaskUiPath(getRecordTaskId(record)))}
          >
            Open Original Task
          </button>
        ) : null}

        <button
          type="button"
          className="ghost-btn"
          onClick={() => openTenantRoute('/tenant/closed-loop-verification')}
        >
          Open Verification Dashboard
        </button>
      </div>
    </div>
  );
}

function RunResultPanel({ result }) {
  if (!result) return null;

  return (
    <section className="run-result-card">
      <div className="run-result-header">
        <div>
          <div className="eyebrow">LAST REMEDIATION RUN</div>
          <h2>Run result</h2>
          <p>
            Αποτέλεσμα τελευταίας εκτέλεσης remediation. Το σωστό είναι το δεύτερο run να κάνει skipped
            στα ίδια records και όχι να δημιουργεί διπλά tasks.
          </p>
        </div>

        <div className="run-metrics">
          <div>
            <span>Total</span>
            <strong>{result.total || 0}</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{result.created || 0}</strong>
          </div>
          <div>
            <span>Skipped</span>
            <strong>{result.skipped || 0}</strong>
          </div>
        </div>
      </div>

      <div className="run-list">
        {(result.results || []).slice(0, 8).map((item) => {
          const task = item.task || {};
          const tone = item.created ? 'success' : 'warning';

          return (
            <div key={item.verificationId || item.verification_id} className="run-row">
              <div>
                <strong>{item.verificationId || item.verification_id}</strong>
                <span>
                  {item.created ? 'Created' : 'Skipped'} · {getTaskId(task) || '—'}
                </span>
              </div>

              <span className={`badge ${badgeClass(tone)}`}>
                {item.created ? 'Created' : 'Skipped'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function TenantClosedLoopRemediationPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search || ''), []);

  const [signalId, setSignalId] = useState(firstValue(params.get('signalId'), ''));
  const [taskId, setTaskId] = useState(firstValue(params.get('taskId'), ''));
  const [sourceActionId, setSourceActionId] = useState(firstValue(params.get('sourceActionId'), ''));
  const [verdict, setVerdict] = useState(firstValue(params.get('verdict'), ''));
  const [limit, setLimit] = useState('25');

  const [loadingQueue, setLoadingQueue] = useState(false);
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const items = queueData?.items || [];

  async function loadQueue(preferredVerificationId = '') {
    setLoadingQueue(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(
        buildQueuePath({
          signalId,
          taskId,
          sourceActionId,
          verdict,
          limit
        }),
        {
          errorLabel: 'Closed loop remediation queue failed'
        }
      );

      const normalized = normalizeQueuePayload(payload);
      const nextItems = normalized.items || [];

      setQueueData(normalized);

      const preferred =
        nextItems.find((item) => getRecordId(getVerification(item)) === preferredVerificationId) ||
        nextItems[0] ||
        null;

      setSelectedItem(preferred);
    } catch (error) {
      setErrorMessage(error?.message || 'Closed loop remediation queue failed');
    } finally {
      setLoadingQueue(false);
    }
  }

  async function runRemediation() {
    setRunning(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(
        buildRunPath({
          signalId,
          taskId,
          sourceActionId,
          verdict,
          limit
        }),
        {
          method: 'POST',
          body: {
            signalId: signalId || undefined,
            taskId: taskId || undefined,
            sourceActionId: sourceActionId || undefined,
            verdict: verdict || undefined,
            limit: Number(limit) || 25
          },
          errorLabel: 'Closed loop remediation run failed'
        }
      );

      const normalized = normalizeRunPayload(payload);
      setRunResult(normalized);

      const firstResult = normalized.results?.[0];
      const preferredVerificationId =
        firstValue(firstResult?.verificationId, firstResult?.verification_id, '');

      await loadQueue(preferredVerificationId);
    } catch (error) {
      setErrorMessage(error?.message || 'Closed loop remediation run failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="remediation-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">ATLAS CLOSED LOOP REMEDIATION</div>
          <h1>Closed Loop Remediation Center</h1>
          <p>
            Phase 19.36: εδώ βλέπεις failed/warning closed-loop verifications και δημιουργείς
            πραγματικά remediation tasks στο atlas_tasks.
          </p>
        </div>

        <div className="hero-metrics">
          <div>
            <span>Total queue</span>
            <strong>{queueData?.total || 0}</strong>
          </div>
          <div>
            <span>Needs task</span>
            <strong>{queueData?.needsTask || 0}</strong>
          </div>
          <div>
            <span>Task exists</span>
            <strong>{queueData?.taskExists || 0}</strong>
          </div>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="input-group">
          <label>Signal ID</label>
          <input
            value={signalId}
            onChange={(event) => setSignalId(event.target.value)}
            placeholder="AT-001"
          />
        </div>

        <div className="input-group">
          <label>Task ID</label>
          <input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            placeholder="atlas-task-..."
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

        <div className="input-group">
          <label>Verdict</label>
          <select value={verdict} onChange={(event) => setVerdict(event.target.value)}>
            <option value="">Failed + Warning</option>
            <option value="failed">Failed only</option>
            <option value="warning">Warning only</option>
          </select>
        </div>

        <div className="input-group">
          <label>Limit</label>
          <select value={limit} onChange={(event) => setLimit(event.target.value)}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <button
          type="button"
          className="ghost-btn"
          disabled={loadingQueue}
          onClick={() =>
            loadQueue(selectedItem ? getRecordId(getVerification(selectedItem)) : '')
          }
        >
          {loadingQueue ? 'Loading...' : 'Load Queue'}
        </button>

        <button
          type="button"
          className="primary-btn"
          disabled={running}
          onClick={runRemediation}
        >
          {running ? 'Running...' : 'Create Remediation Tasks'}
        </button>
      </section>

      {errorMessage ? (
        <div className="banner danger">
          {errorMessage}
        </div>
      ) : null}

      <RunResultPanel result={runResult} />

      <section className="layout-grid">
        <div className="queue-card">
          <div className="section-title">Remediation Queue</div>

          <div className="queue-list">
            {items.length ? (
              items.map((item) => {
                const record = getVerification(item);
                const id = getRecordId(record);

                return (
                  <QueueRow
                    key={id}
                    item={item}
                    active={
                      selectedItem &&
                      getRecordId(getVerification(selectedItem)) === id
                    }
                    onSelect={setSelectedItem}
                  />
                );
              })
            ) : (
              <div className="empty-state">
                Δεν έχει φορτωθεί queue ή δεν υπάρχουν failed/warning records.
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <SelectedQueueDetail item={selectedItem} />
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .remediation-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .toolbar-card,
  .queue-card,
  .detail-card,
  .run-result-card {
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 420px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(239,68,68,0.13), transparent 30%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,247,237,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #b91c1c;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  h2 {
    margin: 0;
    font-size: 24px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .hero-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    align-self: center;
  }

  .hero-metrics div,
  .run-metrics div {
    border-radius: 18px;
    padding: 14px;
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(148,163,184,0.25);
  }

  .hero-metrics span,
  .run-metrics span {
    display: block;
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .hero-metrics strong,
  .run-metrics strong {
    display: block;
    margin-top: 7px;
    color: #0f172a;
    font-size: 24px;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)) 160px 230px;
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

  .input-group input,
  .input-group select {
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

  .queue-card,
  .detail-card,
  .run-result-card {
    padding: 20px;
  }

  .section-title,
  .section-subtitle {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .section-subtitle {
    margin-top: 16px;
    font-size: 14px;
  }

  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .queue-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    transition: 0.16s ease;
  }

  .queue-row:hover {
    border-color: #fecaca;
    background: #fff7ed;
  }

  .queue-row.active {
    border-color: #f97316;
    background: #fff7ed;
    box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
  }

  .queue-row-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .queue-title {
    color: #0f172a;
    font-weight: 900;
    word-break: break-word;
  }

  .queue-meta {
    margin-top: 5px;
    color: #64748b;
    font-size: 12px;
  }

  .queue-meta strong {
    color: #0f172a;
  }

  .queue-badges {
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

  .detail-header,
  .run-result-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .run-result-header {
    display: grid;
    grid-template-columns: 1.25fr 360px;
  }

  .run-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .run-list {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .run-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    border-radius: 14px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .run-row strong {
    display: block;
    color: #0f172a;
    font-weight: 900;
  }

  .run-row span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
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
    word-break: break-word;
  }

  .action-row {
    margin-top: 8px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .empty-state {
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 14px;
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
    padding: 8px 10px;
    font-size: 11px;
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

  .primary-btn,
  .success-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: #fff;
  }

  .success-btn {
    border: 0;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .primary-btn:disabled,
  .success-btn:disabled,
  .ghost-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
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

  @media (max-width: 1400px) {
    .toolbar-card {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1100px) {
    .hero-card,
    .layout-grid,
    .run-result-header {
      grid-template-columns: 1fr;
    }

    .hero-metrics,
    .run-metrics,
    .evidence-grid {
      grid-template-columns: 1fr;
    }

    .detail-header {
      flex-direction: column;
    }
  }

  @media (max-width: 760px) {
    .toolbar-card {
      grid-template-columns: 1fr;
    }
  }
`;