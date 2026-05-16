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
    throw new Error(payload?.message || options.errorLabel || 'Patient signals request failed');
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    total: 1,
    critical: 1,
    open: 1,
    acknowledged: 0,
    inProgress: 0,
    escalated: 0,
    done: 0,
    synced: 0
  },
  signals: [
    {
      id: 'AT-DEMO',
      signalId: 'AT-DEMO',
      title: 'Demo ATLAS signal',
      description: 'Fallback signal. Backend endpoint is not connected.',
      patientName: 'Demo Patient',
      patient_name: 'Demo Patient',
      priority: 'critical',
      status: 'open',
      taskStatus: 'pending',
      task_status: 'pending',
      followupStatus: 'pending',
      followup_status: 'pending',
      sourceActionId: 'ATT-DEMO',
      source_action_id: 'ATT-DEMO',
      lastAction: null,
      last_action: null,
      lastWritebackAt: null,
      last_writeback_at: null,
      writebackSyncedAt: null,
      writeback_synced_at: null,
      lastActionPayload: {},
      last_action_payload: {},
      createdAt: new Date().toISOString(),
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
    signalId: firstValue(params.get('signalId'), params.get('signal_id'), params.get('id')),
    q: firstValue(params.get('q'), params.get('search')),
    status: firstValue(params.get('status')),
    taskStatus: firstValue(params.get('taskStatus'), params.get('task_status')),
    followupStatus: firstValue(params.get('followupStatus'), params.get('followup_status'))
  };
}

function buildApiPath(params) {
  const query = new URLSearchParams();

  if (params.signalId) query.set('signalId', params.signalId);
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status', params.status);
  if (params.taskStatus) query.set('taskStatus', params.taskStatus);
  if (params.followupStatus) query.set('followupStatus', params.followupStatus);

  const qs = query.toString();
  return qs ? `/api/tenant/patient-signals?${qs}` : '/api/tenant/patient-signals';
}

function normalizePayload(payload) {
  const safe = payload || {};
  const signals = safe.signals || safe.items || safe.rows || [];

  return {
    ...safe,
    summary: safe.summary || FALLBACK_DATA.summary,
    signals: Array.isArray(signals) ? signals : []
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

function badgeClass(tone = '') {
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'danger') return 'danger';
  if (tone === 'info') return 'info';
  return 'neutral';
}

function priorityTone(priority = '') {
  const value = String(priority || '').toLowerCase();

  if (value === 'critical') return 'danger';
  if (value === 'high' || value === 'warning') return 'warning';
  if (value === 'medium') return 'info';

  return 'neutral';
}

function statusTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'done' || value === 'resolved' || value === 'completed') return 'success';
  if (value === 'escalated') return 'danger';
  if (value === 'in_progress' || value === 'acknowledged') return 'warning';
  if (value === 'open' || value === 'pending') return 'info';

  return 'neutral';
}

function statusLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'open') return 'Open';
  if (value === 'pending') return 'Pending';
  if (value === 'acknowledged') return 'Acknowledged';
  if (value === 'in_progress') return 'In Progress';
  if (value === 'escalated') return 'Escalated';
  if (value === 'done') return 'Done';
  if (value === 'resolved') return 'Resolved';

  return status || 'Unknown';
}

function actionLabel(action = '') {
  const value = String(action || '').toLowerCase();

  if (value === 'acknowledge') return 'Acknowledge';
  if (value === 'escalate') return 'Escalate';
  if (value === 'resolve') return 'Resolve';
  if (value === 'reopen') return 'Reopen';
  if (value === 'task_status_transition') return 'Task Transition';

  return action || 'Action';
}

function getSignalId(signal) {
  return firstValue(signal?.id, signal?.signalId, signal?.signal_id);
}

function getPatient(signal) {
  return firstValue(
    signal?.patientName,
    signal?.patient_name,
    signal?.patientEmail,
    signal?.patient_email,
    '—'
  );
}

function getTaskStatus(signal) {
  return firstValue(signal?.taskStatus, signal?.task_status, 'pending');
}

function getFollowupStatus(signal) {
  return firstValue(signal?.followupStatus, signal?.followup_status, 'pending');
}

function getLastAction(signal) {
  return firstValue(signal?.lastAction, signal?.last_action, signal?.lastTaskAction, signal?.last_task_action);
}

function getLastPayload(signal) {
  return firstValue(signal?.lastActionPayload, signal?.last_action_payload, {});
}

function getLastWritebackAt(signal) {
  return firstValue(signal?.lastWritebackAt, signal?.last_writeback_at, signal?.writebackSyncedAt, signal?.writeback_synced_at);
}

function getCreatedAt(signal) {
  return firstValue(signal?.createdAt, signal?.created_at, signal?.updatedAt, signal?.updated_at);
}

function signalMatchesSelected(signal, selectedId) {
  return String(getSignalId(signal) || '') === String(selectedId || '');
}

function openTenantRoute(path) {
  window.location.href = path;
}

function buildTasksLink(signal) {
  const signalId = getSignalId(signal);
  const query = new URLSearchParams();

  if (signalId) {
    query.set('signalId', signalId);
    query.set('q', signalId);
  }

  const sourceActionId = firstValue(signal?.sourceActionId, signal?.source_action_id);

  if (sourceActionId) {
    query.set('sourceActionId', sourceActionId);
  }

  return `/tenant/tasks-unified?${query.toString()}`;
}

function buildAtlasLink(signal) {
  const signalId = getSignalId(signal);
  const query = new URLSearchParams();

  if (signalId) {
    query.set('q', signalId);
  }

  return query.toString()
    ? `/tenant/atlas/action-center?${query.toString()}`
    : '/tenant/atlas/action-center';
}

function SignalRow({ signal, active, onSelect }) {
  const signalId = getSignalId(signal);
  const taskStatus = getTaskStatus(signal);
  const followupStatus = getFollowupStatus(signal);

  return (
    <button
      type="button"
      className={`signal-row ${active ? 'active' : ''}`}
      onClick={() => onSelect(signalId)}
    >
      <div className="signal-row-top">
        <span className="signal-title">{signal.title || `Signal ${signalId}`}</span>
        <span className={`badge ${badgeClass(priorityTone(signal.priority))}`}>
          {signal.priority || 'medium'}
        </span>
      </div>

      <div className="signal-meta">{getPatient(signal)}</div>
      <div className="signal-meta">Signal: {signalId}</div>

      <div className="signal-badges">
        <span className={`mini-badge ${badgeClass(statusTone(signal.status))}`}>
          {statusLabel(signal.status)}
        </span>
        <span className={`mini-badge ${badgeClass(statusTone(taskStatus))}`}>
          Task: {statusLabel(taskStatus)}
        </span>
        <span className={`mini-badge ${badgeClass(statusTone(followupStatus))}`}>
          Follow-up: {statusLabel(followupStatus)}
        </span>
      </div>
    </button>
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

function LastActionPanel({ signal }) {
  const payload = getLastPayload(signal);
  const lastAction = getLastAction(signal);

  return (
    <section className="last-action-card">
      <div className="last-action-header">
        <div>
          <div className="eyebrow evidence-eyebrow">SIGNAL WRITEBACK EVIDENCE</div>
          <h2>Last signal update</h2>
          <p>
            Εδώ φαίνεται αν το task lifecycle έγραψε πίσω στο ATLAS signal ή αν έγινε χειροκίνητη ενέργεια από Patient Signals.
          </p>
        </div>

        <span className={`badge ${badgeClass(lastAction ? 'success' : 'neutral')}`}>
          {lastAction ? actionLabel(lastAction) : 'No action'}
        </span>
      </div>

      <div className="evidence-grid">
        <DetailRow label="Last action" value={actionLabel(lastAction)} />
        <DetailRow label="Last writeback" value={formatDateTime(getLastWritebackAt(signal))} />
        <DetailRow label="Payload action" value={actionLabel(payload?.action)} />
        <DetailRow label="Payload task id" value={payload?.task_id || payload?.taskId} />
        <DetailRow label="Payload next status" value={statusLabel(payload?.next_status || payload?.task_status)} tone={statusTone(payload?.next_status || payload?.task_status)} />
        <DetailRow label="Payload follow-up" value={statusLabel(payload?.followup_status)} tone={statusTone(payload?.followup_status)} />
      </div>
    </section>
  );
}

function SignalActionButtons({ signal, busyAction, onAction }) {
  const signalId = getSignalId(signal);

  const actions = [
    { id: 'acknowledge', label: 'Acknowledge' },
    { id: 'escalate', label: 'Escalate' },
    { id: 'resolve', label: 'Resolve' },
    { id: 'reopen', label: 'Reopen' }
  ];

  return (
    <div className="action-buttons">
      {actions.map((action) => {
        const busyKey = `${signalId}:${action.id}`;
        const isBusy = busyAction === busyKey;

        return (
          <button
            key={action.id}
            type="button"
            className={`signal-action-btn ${action.id}`}
            disabled={!signalId || Boolean(busyAction)}
            onClick={() => onAction(signal, action.id)}
          >
            {isBusy ? 'Working...' : action.label}
          </button>
        );
      })}
    </div>
  );
}

export default function TenantPatientSignalsPage() {
  const [urlParams, setUrlParams] = useState(() => getUrlParams());
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => getUrlParams().q || getUrlParams().signalId || '');

  async function loadSignals(nextParams = urlParams, preferredId = '') {
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = await apiRequest(buildApiPath(nextParams), {
        errorLabel: 'Patient signals endpoint failed'
      });

      const normalized = normalizePayload(payload);
      const firstId = normalized.signals?.length ? getSignalId(normalized.signals[0]) : '';

      setData(normalized);
      setFallbackMode(false);
      setSelectedId(preferredId || nextParams.signalId || firstId || '');
    } catch (error) {
      const firstId = FALLBACK_DATA.signals?.length ? getSignalId(FALLBACK_DATA.signals[0]) : '';

      setData(FALLBACK_DATA);
      setFallbackMode(true);
      setErrorMessage(error?.message || 'Patient signals endpoint failed');
      setSelectedId(preferredId || firstId || '');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignalAction(signal, action) {
    const signalId = getSignalId(signal);

    if (!signalId) {
      setFlashMessage('Δεν υπάρχει signal id.');
      return;
    }

    const busyKey = `${signalId}:${action}`;
    setBusyAction(busyKey);
    setFlashMessage('');

    try {
      const payload = await apiRequest(
        `/api/tenant/patient-signals/${encodeURIComponent(signalId)}/${action}`,
        {
          method: 'POST',
          body: {
            source: 'TenantPatientSignalsPage',
            phase: '19.27-patient-signals-writeback-surface',
            patient_name: signal.patient_name || signal.patientName,
            patient_email: signal.patient_email || signal.patientEmail,
            title: signal.title,
            description: signal.description,
            priority: signal.priority,
            source_action_id: signal.source_action_id || signal.sourceActionId,
            source_ref: signal.source_ref || signal.sourceRef || signalId
          },
          errorLabel: `${actionLabel(action)} signal failed`
        }
      );

      const updatedSignal = payload?.signal || payload?.updatedSignal || null;

      setFlashMessage(
        `Signal updated: ${actionLabel(action)} → ${statusLabel(updatedSignal?.status || action)}.`
      );

      await loadSignals(urlParams, signalId);
    } catch (error) {
      setFlashMessage(error?.message || `${actionLabel(action)} signal failed.`);
    } finally {
      setBusyAction('');
    }
  }

  useEffect(() => {
    const params = getUrlParams();
    setUrlParams(params);
    setSearchTerm(params.q || params.signalId || '');
    loadSignals(params);
  }, []);

  const filteredSignals = useMemo(() => {
    let signals = [...(data.signals || [])];

    if (statusFilter) {
      signals = signals.filter((signal) => String(signal.status || '').toLowerCase() === statusFilter);
    }

    if (taskStatusFilter) {
      signals = signals.filter((signal) => String(getTaskStatus(signal) || '').toLowerCase() === taskStatusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();

      signals = signals.filter((signal) => {
        const payload = getLastPayload(signal);

        const haystack = [
          getSignalId(signal),
          signal.title,
          signal.description,
          getPatient(signal),
          signal.priority,
          signal.status,
          getTaskStatus(signal),
          getFollowupStatus(signal),
          signal.sourceActionId,
          signal.source_action_id,
          signal.sourceRef,
          signal.source_ref,
          getLastAction(signal),
          payload?.task_id,
          payload?.taskId,
          payload?.next_status,
          payload?.followup_status
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return signals;
  }, [data.signals, statusFilter, taskStatusFilter, searchTerm]);

  const selectedSignal = useMemo(() => {
    return (
      filteredSignals.find((signal) => signalMatchesSelected(signal, selectedId)) ||
      filteredSignals[0] ||
      null
    );
  }, [filteredSignals, selectedId]);

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
          <div className="eyebrow">ATLAS PATIENT SIGNALS</div>
          <h1>Patient Signals</h1>
          <p>
            Το Phase 19.27 δείχνει καθαρά το writeback από τα Unified Tasks προς το linked ATLAS signal.
            Εδώ ελέγχουμε αν το clinical/operational context συγχρονίζεται σωστά.
          </p>

          <div className="hero-badges">
            {urlParams.signalId ? (
              <span className="badge success">Focused signal: {urlParams.signalId}</span>
            ) : (
              <span className="badge neutral">All signals</span>
            )}
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? filteredSignals.length}</strong></div>
          <div className="summary-pill">Critical <strong>{data.summary?.critical ?? 0}</strong></div>
          <div className="summary-pill">Open <strong>{data.summary?.open ?? 0}</strong></div>
          <div className="summary-pill">In Progress <strong>{data.summary?.inProgress ?? 0}</strong></div>
          <div className="summary-pill">Done <strong>{data.summary?.done ?? 0}</strong></div>
          <div className="summary-pill">Synced <strong>{data.summary?.synced ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Το endpoint `/api/tenant/patient-signals` δεν απάντησε σωστά.
          {errorMessage ? ` (${errorMessage})` : ''}
        </div>
      ) : (
        <div className="banner success">
          Live patient signals endpoint connected.
        </div>
      )}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All signal statuses</option>
            <option value="open">open</option>
            <option value="acknowledged">acknowledged</option>
            <option value="resolved">resolved</option>
          </select>

          <select
            className="input"
            value={taskStatusFilter}
            onChange={(event) => setTaskStatusFilter(event.target.value)}
          >
            <option value="">All task statuses</option>
            <option value="pending">pending</option>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="escalated">escalated</option>
            <option value="done">done</option>
          </select>

          <input
            className="input search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search signal, patient, task status..."
          />
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setStatusFilter('');
              setTaskStatusFilter('');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => loadSignals(urlParams, selectedSignal ? getSignalId(selectedSignal) : '')}
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Signals</div>

          <div className="signal-list">
            {filteredSignals.length ? (
              filteredSignals.map((signal) => (
                <SignalRow
                  key={getSignalId(signal)}
                  signal={signal}
                  active={selectedSignal && getSignalId(selectedSignal) === getSignalId(signal)}
                  onSelect={setSelectedId}
                />
              ))
            ) : (
              <div className="muted-inline">No signals for this filter.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Signal Detail</div>

          {selectedSignal ? (
            <div className="detail-wrap">
              <div className="detail-title">
                {selectedSignal.title || `Signal ${getSignalId(selectedSignal)}`}
              </div>

              <div className="detail-badges">
                <span className={`badge ${badgeClass(priorityTone(selectedSignal.priority))}`}>
                  {selectedSignal.priority || 'medium'}
                </span>

                <span className={`badge ${badgeClass(statusTone(selectedSignal.status))}`}>
                  Signal: {statusLabel(selectedSignal.status)}
                </span>

                <span className={`badge ${badgeClass(statusTone(getTaskStatus(selectedSignal)))}`}>
                  Task: {statusLabel(getTaskStatus(selectedSignal))}
                </span>

                <span className={`badge ${badgeClass(statusTone(getFollowupStatus(selectedSignal)))}`}>
                  Follow-up: {statusLabel(getFollowupStatus(selectedSignal))}
                </span>
              </div>

              <div className="detail-grid">
                <DetailRow label="Signal ID" value={getSignalId(selectedSignal)} />
                <DetailRow label="Patient" value={getPatient(selectedSignal)} />
                <DetailRow label="Source action" value={firstValue(selectedSignal.sourceActionId, selectedSignal.source_action_id)} />
                <DetailRow label="Source ref" value={firstValue(selectedSignal.sourceRef, selectedSignal.source_ref)} />
                <DetailRow label="Created" value={formatDateTime(getCreatedAt(selectedSignal))} />
                <DetailRow label="Last writeback" value={formatDateTime(getLastWritebackAt(selectedSignal))} />
              </div>

              <div className="description-box">
                {selectedSignal.description || 'No description.'}
              </div>

              <LastActionPanel signal={selectedSignal} />

              <SignalActionButtons
                signal={selectedSignal}
                busyAction={busyAction}
                onAction={handleSignalAction}
              />

              <div className="detail-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => openTenantRoute(buildTasksLink(selectedSignal))}
                >
                  Open Linked Tasks
                </button>

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => openTenantRoute(buildAtlasLink(selectedSignal))}
                >
                  Back to ATLAS Action Center
                </button>
              </div>
            </div>
          ) : (
            <div className="muted-inline">No signal selected.</div>
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
  .toolbar-card,
  .last-action-card {
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.35fr 430px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 30%),
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

  .evidence-eyebrow {
    color: #0f766e;
  }

  h1 {
    margin: 0;
    font-size: 30px;
    color: #0f172a;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .hero-badges,
  .detail-badges,
  .detail-actions,
  .action-buttons {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
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
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    color: #6d28d9;
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
    min-width: 320px;
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
    transition: 0.16s ease;
  }

  .signal-row:hover {
    border-color: #c4b5fd;
    background: #faf5ff;
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

  .signal-badges {
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

  .detail-grid,
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

  .detail-value.info {
    color: #1d4ed8;
  }

  .description-box {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
  }

  .last-action-card {
    padding: 18px;
    border-radius: 22px;
    background:
      radial-gradient(circle at top right, rgba(16,185,129,0.10), transparent 32%),
      #ffffff;
  }

  .last-action-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .signal-action-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
    border-radius: 12px;
    padding: 9px 11px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .signal-action-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .signal-action-btn.acknowledge {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .signal-action-btn.escalate {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .signal-action-btn.resolve {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .signal-action-btn.reopen {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
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
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
  }

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 1100px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .detail-grid,
    .evidence-grid {
      grid-template-columns: 1fr;
    }

    .last-action-header {
      flex-direction: column;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .input.search {
      min-width: 180px;
    }
  }
`;