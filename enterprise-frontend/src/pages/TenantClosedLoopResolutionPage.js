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
        'Closed loop resolution request failed'
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
      'resolved',
      'done',
      'completed',
      'complete',
      'closed',
      'fixed',
      'terminal',
      'success',
      'ok',
      'true'
    ].includes(value)
  ) {
    return 'success';
  }

  if (
    [
      'open',
      'pending',
      'in_progress',
      'active',
      'warning',
      'task_created',
      'task_exists'
    ].includes(value)
  ) {
    return 'warning';
  }

  if (
    [
      'failed',
      'critical',
      'error',
      'missing_task',
      'task_missing',
      'missing',
      'not_found',
      'false'
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

  if (value === 'resolved') return 'Resolved';
  if (value === 'open') return 'Open';
  if (value === 'missing_task') return 'Missing Task';
  if (value === 'task_missing') return 'Missing Task';
  if (value === 'done') return 'Done';
  if (value === 'completed') return 'Completed';
  if (value === 'complete') return 'Complete';
  if (value === 'closed') return 'Closed';
  if (value === 'fixed') return 'Fixed';
  if (value === 'failed') return 'Failed';
  if (value === 'warning') return 'Warning';
  if (value === 'task_created') return 'Task Created';
  if (value === 'task_exists') return 'Task Exists';
  if (value === 'true') return 'Terminal';
  if (value === 'false') return 'Not Terminal';

  return status || 'Unknown';
}

function getVerification(item) {
  return item?.verification || item?.record || item?.updatedRecord || item?.updated_record || {};
}

function getTask(item) {
  return firstValue(item?.remediationTask, item?.remediation_task, item?.task, null);
}

function getVerificationId(record) {
  return firstValue(record?.id, record?.verificationId, record?.verification_id);
}

function getSignalId(record) {
  return firstValue(record?.signalId, record?.signal_id);
}

function getOriginalTaskId(record) {
  return firstValue(record?.taskId, record?.task_id);
}

function getRemediationTaskId(record, task) {
  return firstValue(
    record?.remediationTaskId,
    record?.remediation_task_id,
    task?.id,
    task?.taskId,
    task?.task_id
  );
}

function getRemediationStatus(record) {
  return firstValue(record?.remediationStatus, record?.remediation_status, 'not_started');
}

function getResolutionStatus(record, item) {
  return firstValue(
    item?.resolutionStatus,
    item?.resolution_status,
    record?.remediationResolutionStatus,
    record?.remediation_resolution_status,
    'open'
  );
}

function getTaskStatus(item, task) {
  return firstValue(item?.taskStatus, item?.task_status, task?.status, 'missing_task');
}

function getTerminal(item) {
  return Boolean(item?.terminal);
}

function getResolvedAt(record) {
  return firstValue(record?.remediationResolvedAt, record?.remediation_resolved_at);
}

function getResolutionLastSyncAt(record) {
  return firstValue(
    record?.remediationResolutionLastSyncAt,
    record?.remediation_resolution_last_sync_at
  );
}

function getResolutionNote(record) {
  return firstValue(record?.remediationResolutionNote, record?.remediation_resolution_note);
}

function getResolutionPayload(record) {
  return parseJsonObject(
    firstValue(record?.remediationResolutionPayload, record?.remediation_resolution_payload, {})
  );
}

function getCreatedAt(record) {
  return firstValue(record?.createdAt, record?.created_at);
}

function buildQueuePath({ verificationId, taskId, signalId, resolutionStatus, limit }) {
  const query = new URLSearchParams();

  if (verificationId) query.set('verificationId', verificationId);
  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (resolutionStatus) query.set('resolutionStatus', resolutionStatus);
  query.set('limit', String(limit || 50));

  return `/api/tenant/closed-loop-resolution/queue?${query.toString()}`;
}

function buildSyncPath({ verificationId, taskId, signalId, resolutionStatus, limit }) {
  const query = new URLSearchParams();

  if (verificationId) query.set('verificationId', verificationId);
  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (resolutionStatus) query.set('resolutionStatus', resolutionStatus);
  query.set('limit', String(limit || 50));

  return `/api/tenant/closed-loop-resolution/sync?${query.toString()}`;
}

function buildTaskUiPath(taskId) {
  const query = new URLSearchParams();

  if (taskId) {
    query.set('taskId', taskId);
    query.set('q', taskId);
  }

  const qs = query.toString();
  return qs ? `/tenant/tasks-unified?${qs}` : '/tenant/tasks-unified';
}

function buildSignalUiPath(signalId) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);

  const qs = query.toString();
  return qs ? `/tenant/patient-signals?${qs}` : '/tenant/patient-signals';
}

function openTenantRoute(path) {
  window.location.href = path;
}

function normalizeQueuePayload(payload) {
  const safe = payload || {};
  const items = parseJsonArray(firstValue(safe.items, safe.queue, safe.rows, []));

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.41-closed-loop-resolution-ui',
    generatedAt: safe.generatedAt,
    total: safe.total ?? items.length,
    resolved: safe.resolved || 0,
    open: safe.open || 0,
    missingTask: firstValue(safe.missingTask, safe.missing_task, 0),
    terminalReady: firstValue(safe.terminalReady, safe.terminal_ready, 0),
    items
  };
}

function normalizeSyncPayload(payload) {
  const safe = payload || {};
  const results = parseJsonArray(firstValue(safe.results, safe.items, safe.rows, []));

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.41-closed-loop-resolution-ui',
    generatedAt: safe.generatedAt,
    total: safe.total ?? results.length,
    resolved: safe.resolved || 0,
    open: safe.open || 0,
    missingTask: firstValue(safe.missingTask, safe.missing_task, 0),
    results
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

function QueueRow({ item, active, onSelect }) {
  const record = getVerification(item);
  const task = getTask(item);
  const verificationId = getVerificationId(record);
  const signalId = getSignalId(record);
  const resolutionStatus = getResolutionStatus(record, item);
  const taskStatus = getTaskStatus(item, task);
  const terminal = getTerminal(item);

  return (
    <button
      type="button"
      className={`queue-row ${active ? 'active' : ''}`}
      onClick={() => onSelect(item)}
    >
      <div className="queue-row-top">
        <span className="queue-title">
          {signalId || verificationId || 'Closed loop record'}
        </span>

        <span className={`badge ${badgeClass(statusTone(resolutionStatus))}`}>
          {statusLabel(resolutionStatus)}
        </span>
      </div>

      <div className="queue-meta">
        Verification: <strong>{verificationId || '—'}</strong>
      </div>

      <div className="queue-meta">
        Remediation task: <strong>{getRemediationTaskId(record, task) || '—'}</strong>
      </div>

      <div className="queue-meta">
        Created: <strong>{formatDateTime(getCreatedAt(record))}</strong>
      </div>

      <div className="queue-badges">
        <span className={`mini-badge ${badgeClass(statusTone(taskStatus))}`}>
          Task: {statusLabel(taskStatus)}
        </span>

        <span className={`mini-badge ${badgeClass(statusTone(String(terminal)))}`}>
          {terminal ? 'Terminal ready' : 'Not terminal'}
        </span>

        <span className={`mini-badge ${badgeClass(statusTone(getRemediationStatus(record)))}`}>
          Remediation: {statusLabel(getRemediationStatus(record))}
        </span>
      </div>
    </button>
  );
}

function SyncResultPanel({ result }) {
  if (!result) return null;

  return (
    <section className="sync-result-card">
      <div className="sync-result-header">
        <div>
          <div className="eyebrow">LAST RESOLUTION SYNC</div>
          <h2>Sync result</h2>
          <p>
            Αυτό δείχνει αν τα completed remediation tasks γράφτηκαν πίσω ως resolved στο audit record.
          </p>
        </div>

        <div className="sync-metrics">
          <div>
            <span>Total</span>
            <strong>{result.total || 0}</strong>
          </div>
          <div>
            <span>Resolved</span>
            <strong>{result.resolved || 0}</strong>
          </div>
          <div>
            <span>Open</span>
            <strong>{result.open || 0}</strong>
          </div>
          <div>
            <span>Missing Task</span>
            <strong>{result.missingTask || 0}</strong>
          </div>
        </div>
      </div>

      <div className="sync-list">
        {(result.results || []).slice(0, 10).map((item) => {
          const record = item.updatedRecord || item.updated_record || {};
          const verificationId = firstValue(item.verificationId, item.verification_id, getVerificationId(record));
          const resolutionStatus = firstValue(item.resolutionStatus, item.resolution_status, getResolutionStatus(record, item));
          const taskStatus = firstValue(item.taskStatus, item.task_status, '—');

          return (
            <div key={verificationId} className="sync-row">
              <div>
                <strong>{verificationId}</strong>
                <span>
                  Task status: {taskStatus} · Resolution: {statusLabel(resolutionStatus)}
                </span>
              </div>

              <span className={`badge ${badgeClass(statusTone(resolutionStatus))}`}>
                {statusLabel(resolutionStatus)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SelectedDetail({ item, onManualResolve, resolvingId }) {
  if (!item) {
    return (
      <div className="empty-state">
        Επίλεξε ένα resolution item για λεπτομέρειες.
      </div>
    );
  }

  const record = getVerification(item);
  const task = getTask(item);
  const verificationId = getVerificationId(record);
  const signalId = getSignalId(record);
  const originalTaskId = getOriginalTaskId(record);
  const remediationTaskId = getRemediationTaskId(record, task);
  const resolutionStatus = getResolutionStatus(record, item);
  const taskStatus = getTaskStatus(item, task);
  const terminal = getTerminal(item);
  const payload = getResolutionPayload(record);

  return (
    <div className="detail-wrap">
      <div className="detail-header">
        <div>
          <div className="eyebrow">SELECTED RESOLUTION CASE</div>
          <h2>{signalId || remediationTaskId || verificationId}</h2>
        </div>

        <div className="detail-header-badges">
          <span className={`badge ${badgeClass(statusTone(resolutionStatus))}`}>
            Resolution: {statusLabel(resolutionStatus)}
          </span>

          <span className={`badge ${badgeClass(statusTone(taskStatus))}`}>
            Task: {statusLabel(taskStatus)}
          </span>
        </div>
      </div>

      <section className={`resolution-evidence-card ${badgeClass(statusTone(resolutionStatus))}`}>
        <div className="resolution-evidence-header">
          <div>
            <div className="eyebrow">RESOLUTION WRITEBACK EVIDENCE</div>
            <h2>Resolution sync evidence</h2>
            <p>
              Απόδειξη ότι το completed remediation task συγχρονίστηκε πίσω στο closed_loop_verifications.
            </p>
          </div>

          <span className={`badge ${badgeClass(statusTone(resolutionStatus))}`}>
            {statusLabel(resolutionStatus)}
          </span>
        </div>

        <div className="evidence-grid">
          <DetailRow label="Verification ID" value={verificationId} />
          <DetailRow label="Signal ID" value={signalId} />
          <DetailRow label="Original task" value={originalTaskId} />
          <DetailRow label="Remediation task" value={remediationTaskId} />
          <DetailRow
            label="Remediation status"
            value={statusLabel(getRemediationStatus(record))}
            tone={statusTone(getRemediationStatus(record))}
          />
          <DetailRow
            label="Task status"
            value={statusLabel(taskStatus)}
            tone={statusTone(taskStatus)}
          />
          <DetailRow
            label="Terminal ready"
            value={terminal ? 'Yes' : 'No'}
            tone={terminal ? 'success' : 'warning'}
          />
          <DetailRow
            label="Resolution status"
            value={statusLabel(resolutionStatus)}
            tone={statusTone(resolutionStatus)}
          />
          <DetailRow label="Resolved at" value={formatDateTime(getResolvedAt(record))} />
          <DetailRow label="Last resolution sync" value={formatDateTime(getResolutionLastSyncAt(record))} />
          <DetailRow label="Payload mode" value={payload.mode} />
          <DetailRow label="Payload task status" value={payload.task_status} />
        </div>

        {getResolutionNote(record) ? (
          <div className="resolution-note">
            {getResolutionNote(record)}
          </div>
        ) : null}

        <div className="action-row">
          {remediationTaskId ? (
            <button
              type="button"
              className="success-btn"
              onClick={() => openTenantRoute(buildTaskUiPath(remediationTaskId))}
            >
              Open Remediation Task
            </button>
          ) : null}

          {signalId ? (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => openTenantRoute(buildSignalUiPath(signalId))}
            >
              Open Patient Signal
            </button>
          ) : null}

          <button
            type="button"
            className="manual-btn"
            disabled={resolvingId === verificationId}
            onClick={() => onManualResolve(verificationId)}
          >
            {resolvingId === verificationId ? 'Resolving...' : 'Manual Mark Resolved'}
          </button>
        </div>
      </section>

      <div className="section-subtitle">Task Snapshot</div>

      {task ? (
        <div className="evidence-grid">
          <DetailRow label="Task ID" value={task.id} />
          <DetailRow label="Title" value={task.title} />
          <DetailRow label="Priority" value={task.priority} tone={statusTone(task.priority)} />
          <DetailRow label="Status" value={task.status} tone={statusTone(task.status)} />
          <DetailRow label="Source type" value={task.source_type || task.sourceType} />
          <DetailRow label="Source ref" value={task.source_ref || task.sourceRef} />
          <DetailRow label="Created at" value={formatDateTime(task.created_at || task.createdAt)} />
          <DetailRow label="Updated at" value={formatDateTime(task.updated_at || task.updatedAt)} />
        </div>
      ) : (
        <div className="empty-state">
          Δεν βρέθηκε remediation task. Αν υπάρχει remediation_task_id στο audit, έλεγξε αν το task διαγράφηκε ή αν είσαι σε λάθος database.
        </div>
      )}
    </div>
  );
}

export default function TenantClosedLoopResolutionPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search || ''), []);

  const [verificationId, setVerificationId] = useState(firstValue(params.get('verificationId'), params.get('id'), ''));
  const [signalId, setSignalId] = useState(firstValue(params.get('signalId'), ''));
  const [taskId, setTaskId] = useState(firstValue(params.get('taskId'), ''));
  const [resolutionStatus, setResolutionStatus] = useState(firstValue(params.get('resolutionStatus'), ''));
  const [limit, setLimit] = useState('50');

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resolvingId, setResolvingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const items = queueData?.items || [];

  async function loadQueue(preferredVerificationId = '') {
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(
        buildQueuePath({
          verificationId,
          taskId,
          signalId,
          resolutionStatus,
          limit
        }),
        {
          errorLabel: 'Closed loop resolution queue failed'
        }
      );

      const normalized = normalizeQueuePayload(payload);
      const nextItems = normalized.items || [];

      setQueueData(normalized);

      const preferred =
        nextItems.find((item) => getVerificationId(getVerification(item)) === preferredVerificationId) ||
        nextItems[0] ||
        null;

      setSelectedItem(preferred);
    } catch (error) {
      setErrorMessage(error?.message || 'Closed loop resolution queue failed');
    } finally {
      setLoading(false);
    }
  }

  async function runSync() {
    setSyncing(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(
        buildSyncPath({
          verificationId,
          taskId,
          signalId,
          resolutionStatus,
          limit
        }),
        {
          method: 'POST',
          body: {
            verificationId: verificationId || undefined,
            taskId: taskId || undefined,
            signalId: signalId || undefined,
            resolutionStatus: resolutionStatus || undefined,
            limit: Number(limit) || 50
          },
          errorLabel: 'Closed loop resolution sync failed'
        }
      );

      const normalized = normalizeSyncPayload(payload);
      setSyncResult(normalized);

      const firstResult = normalized.results?.[0];
      const preferredId = firstValue(firstResult?.verificationId, firstResult?.verification_id, '');

      await loadQueue(preferredId);
    } catch (error) {
      setErrorMessage(error?.message || 'Closed loop resolution sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function manualResolve(targetVerificationId) {
    if (!targetVerificationId) return;

    setResolvingId(targetVerificationId);
    setErrorMessage('');

    try {
      await apiRequest(
        `/api/tenant/closed-loop-resolution/${encodeURIComponent(targetVerificationId)}/resolve`,
        {
          method: 'POST',
          body: {
            note: 'Manually marked as resolved from Closed Loop Resolution UI.'
          },
          errorLabel: 'Manual resolution failed'
        }
      );

      await loadQueue(targetVerificationId);
    } catch (error) {
      setErrorMessage(error?.message || 'Manual resolution failed');
    } finally {
      setResolvingId('');
    }
  }

  return (
    <div className="resolution-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">ATLAS CLOSED LOOP RESOLUTION</div>
          <h1>Closed Loop Resolution Center</h1>
          <p>
            Phase 19.41: εδώ κλείνει πραγματικά το operational loop. Δεν αρκεί να δημιουργηθεί remediation task·
            πρέπει να γίνει done/resolved και να συγχρονιστεί πίσω στο audit record.
          </p>
        </div>

        <div className="hero-metrics">
          <div>
            <span>Total</span>
            <strong>{queueData?.total || 0}</strong>
          </div>
          <div>
            <span>Resolved</span>
            <strong>{queueData?.resolved || 0}</strong>
          </div>
          <div>
            <span>Open</span>
            <strong>{queueData?.open || 0}</strong>
          </div>
          <div>
            <span>Missing Task</span>
            <strong>{queueData?.missingTask || 0}</strong>
          </div>
          <div>
            <span>Terminal Ready</span>
            <strong>{queueData?.terminalReady || 0}</strong>
          </div>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="input-group">
          <label>Verification ID</label>
          <input
            value={verificationId}
            onChange={(event) => setVerificationId(event.target.value)}
            placeholder="clv-..."
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
          <label>Task ID</label>
          <input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            placeholder="clv-task-..."
          />
        </div>

        <div className="input-group">
          <label>Resolution Status</label>
          <select
            value={resolutionStatus}
            onChange={(event) => setResolutionStatus(event.target.value)}
          >
            <option value="">All</option>
            <option value="open">open</option>
            <option value="resolved">resolved</option>
            <option value="missing_task">missing_task</option>
          </select>
        </div>

        <div className="input-group">
          <label>Limit</label>
          <select value={limit} onChange={(event) => setLimit(event.target.value)}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
        </div>

        <button
          type="button"
          className="ghost-btn"
          disabled={loading}
          onClick={() =>
            loadQueue(selectedItem ? getVerificationId(getVerification(selectedItem)) : '')
          }
        >
          {loading ? 'Loading...' : 'Load Queue'}
        </button>

        <button
          type="button"
          className="primary-btn"
          disabled={syncing}
          onClick={runSync}
        >
          {syncing ? 'Syncing...' : 'Sync Resolution'}
        </button>
      </section>

      {errorMessage ? (
        <div className="banner danger">
          {errorMessage}
        </div>
      ) : null}

      <SyncResultPanel result={syncResult} />

      <section className="layout-grid">
        <div className="queue-card">
          <div className="section-title">Resolution Queue</div>

          <div className="queue-list">
            {items.length ? (
              items.map((item) => {
                const record = getVerification(item);
                const id = getVerificationId(record);

                return (
                  <QueueRow
                    key={id}
                    item={item}
                    active={
                      selectedItem &&
                      getVerificationId(getVerification(selectedItem)) === id
                    }
                    onSelect={setSelectedItem}
                  />
                );
              })
            ) : (
              <div className="empty-state">
                Δεν έχει φορτωθεί queue ή δεν υπάρχουν records.
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <SelectedDetail
            item={selectedItem}
            onManualResolve={manualResolve}
            resolvingId={resolvingId}
          />
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .resolution-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .toolbar-card,
  .queue-card,
  .detail-card,
  .sync-result-card,
  .resolution-evidence-card {
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.15fr 560px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(34,197,94,0.14), transparent 30%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,253,244,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #15803d;
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
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    align-self: center;
  }

  .hero-metrics div,
  .sync-metrics div {
    border-radius: 18px;
    padding: 14px;
    background: rgba(255,255,255,0.76);
    border: 1px solid rgba(148,163,184,0.25);
  }

  .hero-metrics span,
  .sync-metrics span {
    display: block;
    color: #475569;
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .hero-metrics strong,
  .sync-metrics strong {
    display: block;
    margin-top: 7px;
    color: #0f172a;
    font-size: 24px;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)) 160px 190px;
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
  .sync-result-card,
  .resolution-evidence-card {
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
    border-color: #86efac;
    background: #ecfdf5;
  }

  .queue-row.active {
    border-color: #16a34a;
    background: #ecfdf5;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
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
  .sync-result-header,
  .resolution-evidence-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .detail-header-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .sync-result-header {
    display: grid;
    grid-template-columns: 1.15fr 470px;
  }

  .sync-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .sync-list {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sync-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    border-radius: 14px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .sync-row strong {
    display: block;
    color: #0f172a;
    font-weight: 900;
  }

  .sync-row span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
  }

  .resolution-evidence-card.success {
    border-color: #86efac;
    background:
      radial-gradient(circle at top right, rgba(34,197,94,0.12), transparent 32%),
      #ffffff;
  }

  .resolution-evidence-card.warning {
    border-color: #fdba74;
    background:
      radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 32%),
      #ffffff;
  }

  .resolution-evidence-card.danger {
    border-color: #fecaca;
    background:
      radial-gradient(circle at top right, rgba(239,68,68,0.12), transparent 32%),
      #ffffff;
  }

  .resolution-note {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    font-weight: 700;
    line-height: 1.6;
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
    margin-top: 12px;
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
  .manual-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    color: #fff;
  }

  .success-btn {
    border: 0;
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    color: #fff;
  }

  .manual-btn {
    border: 0;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .primary-btn:disabled,
  .success-btn:disabled,
  .manual-btn:disabled,
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

  @media (max-width: 1500px) {
    .toolbar-card {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .hero-card {
      grid-template-columns: 1fr;
    }

    .hero-metrics {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  @media (max-width: 1200px) {
    .layout-grid,
    .sync-result-header {
      grid-template-columns: 1fr;
    }

    .sync-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .evidence-grid {
      grid-template-columns: 1fr;
    }

    .detail-header,
    .resolution-evidence-header {
      flex-direction: column;
    }

    .detail-header-badges {
      justify-content: flex-start;
    }
  }

  @media (max-width: 760px) {
    .toolbar-card,
    .hero-metrics,
    .sync-metrics {
      grid-template-columns: 1fr;
    }
  }
`;