import React, { useEffect, useMemo, useState } from 'react';
import TenantTaskWritebackPanel, {
  normalizeTaskWriteback
} from '../components/tenant/TenantTaskWritebackPanel';

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
      payload?.message || options.errorLabel || 'ATLAS action center request failed'
    );
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  summary: {
    total: 3,
    critical: 1,
    warning: 2,
    createTaskNow: 2,
    taskCreated: 1,
    handled: 1,
    writeback: {
      synced: 1,
      partial: 0,
      failed: 0,
      pending: 1,
      noWriteback: 1
    }
  },
  items: [
    {
      id: 'signal:sig-1',
      type: 'signal',
      title: 'Issue reported: dryness',
      subtitle: 'patient1@raftop.local',
      description: 'Issue signal: dryness',
      patientEmail: 'patient1@raftop.local',
      patient_email: 'patient1@raftop.local',
      priority: 'critical',
      status: 'critical_task_missing',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      route: '/tenant/patient-signals',
      routeLabel: 'Open Patient Signals',
      atlasCategory: 'THERAPY_ISSUE_CRITICAL',
      atlas_category: 'THERAPY_ISSUE_CRITICAL',
      canCreateTask: true,
      can_create_task: true,
      linkedTaskId: null,
      linked_task_id: null,
      linked_signal_id: 'sig-1',
      signalId: 'sig-1',
      signal_id: 'sig-1',
      signalKind: 'issue',
      signal_kind: 'issue',
      sourceRef: 'sig-1',
      source_ref: 'sig-1',
      writeback_status: 'pending',
      writebackStatus: 'pending',
      signal_writeback_status: 'pending',
      signalWritebackStatus: 'pending',
      coaching_writeback_status: '',
      coachingWritebackStatus: '',
      writeback_synced_at: null,
      writebackSyncedAt: null,
      writeback_events: [],
      writebackEvents: [],
      badges: [
        { label: 'THERAPY_ISSUE_CRITICAL', tone: 'danger' },
        { label: 'ISSUE', tone: 'neutral' }
      ]
    },
    {
      id: 'import:imp-1',
      type: 'import',
      title: 'Failed import: AirView CSV',
      subtitle: 'patient2@raftop.local',
      description: 'Malformed CSV header',
      patientEmail: 'patient2@raftop.local',
      patient_email: 'patient2@raftop.local',
      priority: 'warning',
      status: 'recovery_needed',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      route: '/tenant/import-history',
      routeLabel: 'Open Import History',
      atlasCategory: 'SYNC_RECOVERY',
      atlas_category: 'SYNC_RECOVERY',
      canCreateTask: true,
      can_create_task: true,
      linkedTaskId: null,
      linked_task_id: null,
      signalId: null,
      signal_id: null,
      signalKind: null,
      signal_kind: null,
      sourceRef: 'imp-1',
      source_ref: 'imp-1',
      writeback_status: 'not_applicable',
      writebackStatus: 'not_applicable',
      signal_writeback_status: '',
      signalWritebackStatus: '',
      coaching_writeback_status: '',
      coachingWritebackStatus: '',
      writeback_synced_at: null,
      writebackSyncedAt: null,
      writeback_events: [],
      writebackEvents: [],
      badges: [
        { label: 'SYNC_RECOVERY', tone: 'warning' },
        { label: 'CSV_IMPORT', tone: 'neutral' }
      ]
    },
    {
      id: 'coaching:patient3@raftop.local:first_4_hours_protocol',
      type: 'coaching',
      title: 'Coaching follow-up: first_4_hours_protocol',
      subtitle: 'patient3@raftop.local',
      description: 'Usage below therapeutic target',
      patientEmail: 'patient3@raftop.local',
      patient_email: 'patient3@raftop.local',
      priority: 'warning',
      status: 'task_linked_handled',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      route: '/tenant/patient-coaching',
      routeLabel: 'Open Patient Coaching',
      atlasCategory: 'COACHING_REVIEW',
      atlas_category: 'COACHING_REVIEW',
      canCreateTask: false,
      can_create_task: false,
      linkedTaskId: 'task-7',
      linked_task_id: 'task-7',
      signalId: null,
      signal_id: null,
      signalKind: null,
      signal_kind: null,
      sourceRef: 'first_4_hours_protocol',
      source_ref: 'first_4_hours_protocol',
      coaching_context_id: 'first_4_hours_protocol',
      coachingContextId: 'first_4_hours_protocol',
      writeback_status: 'synced',
      writebackStatus: 'synced',
      signal_writeback_status: '',
      signalWritebackStatus: '',
      coaching_writeback_status: 'synced',
      coachingWritebackStatus: 'synced',
      writeback_synced_at: new Date().toISOString(),
      writebackSyncedAt: new Date().toISOString(),
      writeback_events: [
        {
          action: 'create_task',
          message: 'Fallback demo writeback event',
          created_at: new Date().toISOString()
        }
      ],
      writebackEvents: [
        {
          action: 'create_task',
          message: 'Fallback demo writeback event',
          created_at: new Date().toISOString()
        }
      ],
      badges: [
        { label: 'COACHING_REVIEW', tone: 'warning' },
        { label: 'TASK LINKED', tone: 'success' },
        { label: 'Task Linked / Handled', tone: 'success' }
      ]
    }
  ],
  debug: {
    tasksLoaded: 3,
    signalsLoaded: 3,
    importsLoaded: 2,
    coachingLoaded: 2
  }
};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return null;
}

function badgeClass(tone = '') {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  if (tone === 'info') return 'info';
  return 'neutral';
}

function priorityTone(priority = '') {
  const value = String(priority || '').toLowerCase();

  if (value === 'critical') return 'danger';
  if (value === 'warning' || value === 'high') return 'warning';
  if (value === 'success') return 'success';

  return 'neutral';
}

function writebackTone(status = '') {
  const value = String(status || '').toLowerCase();

  if (['synced', 'success', 'completed', 'complete', 'ok'].includes(value)) return 'success';
  if (['partial', 'partially_synced', 'partial_success'].includes(value)) return 'warning';
  if (['failed', 'error', 'writeback_failed', 'sync_failed'].includes(value)) return 'danger';
  if (['pending', 'queued', 'processing', 'in_progress'].includes(value)) return 'info';

  return 'neutral';
}

function writebackLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (['synced', 'success', 'completed', 'complete', 'ok'].includes(value)) return 'Synced';
  if (['partial', 'partially_synced', 'partial_success'].includes(value)) return 'Partial';
  if (['failed', 'error', 'writeback_failed', 'sync_failed'].includes(value)) return 'Failed';
  if (['pending', 'queued', 'processing', 'in_progress'].includes(value)) return 'Pending';
  if (['skipped', 'not_applicable', 'none', 'no_context', ''].includes(value)) return 'No writeback';

  return status || 'Unknown';
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

  if (value === 'critical_task_missing') return 'Critical Task Missing';
  if (value === 'recovery_needed') return 'Recovery Needed';
  if (value === 'followup_recommended') return 'Follow-up Recommended';
  if (value === 'task_created') return 'Task Created';
  if (value === 'task_linked_handled') return 'Task Linked / Handled';
  if (value === 'operationally_handled') return 'Operationally Handled';
  if (value === 'handled') return 'Handled';
  if (value === 'resolved') return 'Resolved';
  if (value === 'acknowledged') return 'Acknowledged';
  if (value === 'contacted') return 'Contacted';
  if (value === 'open') return 'Open';
  if (value === 'pending') return 'Pending';
  if (value === 'done') return 'Done';
  if (value === 'duplicate_archived') return 'Duplicate Archived';

  return status || 'Unknown';
}

function openTenantRoute(path) {
  window.location.href = path;
}

function getItemId(item, index = 0) {
  return String(
    firstValue(
      item?.id,
      item?.actionId,
      item?.action_id,
      item?.sourceRef,
      item?.source_ref,
      item?.signalId,
      item?.signal_id,
      item?.linked_signal_id,
      `atlas-action-${index}`
    )
  );
}

function getPatientEmail(item) {
  return firstValue(
    item?.patientEmail,
    item?.patient_email,
    item?.email,
    item?.patient?.email
  );
}

function hasRealPatientEmail(item) {
  const email = getPatientEmail(item);
  return Boolean(email && email.includes('@') && !email.includes('raftop.local'));
}

function getItemType(item) {
  return firstValue(item?.type, item?.sourceType, item?.source_type, item?.module, 'action');
}

function getAtlasCategory(item) {
  return firstValue(
    item?.atlasCategory,
    item?.atlas_category,
    item?.action_group_name,
    item?.actionGroupName,
    item?.category,
    '—'
  );
}

function getSignalId(item) {
  return firstValue(
    item?.signalId,
    item?.signal_id,
    item?.linked_signal_id,
    item?.linkedSignalId,
    item?.atlas_signal_id,
    item?.atlasSignalId,
    item?.case_id,
    item?.caseId
  );
}

function getSignalKind(item) {
  return firstValue(item?.signalKind, item?.signal_kind, item?.kind, '—');
}

function getLinkedTaskId(item) {
  return firstValue(
    item?.linkedTaskId,
    item?.linked_task_id,
    item?.createdTaskId,
    item?.created_task_id,
    item?.existingTaskId,
    item?.existing_task_id
  );
}

function canCreateTask(item) {
  return !getLinkedTaskId(item);
}

function getCreateTaskButtonLabel(item) {
  const status = String(item?.status || '').toLowerCase();

  if (['resolved', 'closed', 'completed', 'done'].includes(status)) {
    return 'Force Create Task / Test Writeback';
  }

  if (['task_created', 'created'].includes(status)) {
    return 'Retry Create Task / Test Writeback';
  }

  return 'Create Task Now';
}

function getCreatedAt(item) {
  return firstValue(item?.createdAt, item?.created_at, item?.inserted_at);
}

function getRouteLabel(item) {
  return firstValue(item?.routeLabel, item?.route_label, 'Open Route');
}

function buildPatientTasksLink(item) {
  const email = getPatientEmail(item);
  const query = new URLSearchParams();
  const linkedTaskId = getLinkedTaskId(item);
  const signalId = getSignalId(item);

  if (linkedTaskId) {
    query.set('taskId', linkedTaskId);
    query.set('q', linkedTaskId);
  }

  if (signalId) {
    query.set('signalId', signalId);
  }

  if (item?.id) {
    query.set('sourceActionId', item.id);
  }

  if (!linkedTaskId) {
    if (item?.priority === 'critical') {
      query.set('status', 'escalated');
    } else if (item?.priority === 'warning') {
      query.set('status', 'pending');
    }

    if (item?.title) {
      query.set('q', item.title);
    }
  }

  if (email && email.includes('@') && !email.includes('raftop.local')) {
    return `/tenant/patient-tasks/${encodeURIComponent(email)}?${query.toString()}`;
  }

  return `/tenant/tasks-unified?${query.toString()}`;
}

function buildLinkedTaskReviewLink(item) {
  const linkedTaskId = getLinkedTaskId(item);
  const patientEmail = getPatientEmail(item);
  const signalId = getSignalId(item);

  const query = new URLSearchParams();

  if (linkedTaskId) {
    query.set('taskId', linkedTaskId);
    query.set('q', linkedTaskId);
  }

  if (item?.id) {
    query.set('sourceActionId', item.id);
  }

  if (item?.source_action_id || item?.sourceActionId) {
    query.set('sourceActionId', item.source_action_id || item.sourceActionId);
  }

  if (signalId) {
    query.set('signalId', signalId);
  }

  if (patientEmail && patientEmail.includes('@') && !patientEmail.includes('raftop.local')) {
    return `/tenant/patient-tasks/${encodeURIComponent(patientEmail)}?${query.toString()}`;
  }

  return `/tenant/tasks-unified?${query.toString()}`;
}

function normalizeSummary(summary = {}) {
  const writeback = summary.writeback || {};

  return {
    ...summary,
    total: firstValue(summary.total, summary.totalTasks, summary.total_tasks, 0),
    critical: firstValue(summary.critical, summary.criticalTasks, summary.critical_tasks, 0),
    warning: firstValue(summary.warning, summary.warningTasks, summary.warning_tasks, 0),
    createTaskNow: firstValue(
      summary.createTaskNow,
      summary.create_task_now,
      summary.createTaskRequired,
      summary.create_task_required,
      0
    ),
    taskCreated: firstValue(
      summary.taskCreated,
      summary.task_created,
      summary.createdTasks,
      summary.created_tasks,
      0
    ),
    handled: firstValue(summary.handled, summary.operationallyHandled, summary.operationally_handled, 0),
    writeback: {
      synced: firstValue(writeback.synced, summary.writebackSynced, summary.writeback_synced, 0),
      partial: firstValue(writeback.partial, summary.writebackPartial, summary.writeback_partial, 0),
      failed: firstValue(writeback.failed, summary.writebackFailed, summary.writeback_failed, 0),
      pending: firstValue(writeback.pending, summary.writebackPending, summary.writeback_pending, 0),
      noWriteback: firstValue(
        writeback.noWriteback,
        writeback.no_writeback,
        summary.noWriteback,
        summary.no_writeback,
        0
      )
    }
  };
}

function normalizeActionCenterPayload(payload) {
  const safePayload = payload || {};

  const items =
    safePayload.items ||
    safePayload.tasks ||
    safePayload.queue ||
    safePayload.rows ||
    [];

  return {
    ...safePayload,
    summary: normalizeSummary(safePayload.summary || FALLBACK_DATA.summary),
    items: Array.isArray(items) ? items : []
  };
}

function calculateWritebackSummary(items = []) {
  const result = {
    synced: 0,
    partial: 0,
    failed: 0,
    pending: 0,
    noWriteback: 0,
    totalWithContext: 0,
    handled: 0
  };

  for (const item of items) {
    const state = normalizeTaskWriteback(item);
    const status = String(state.status || '').toLowerCase();

    if (state.linkedSignalId || state.coachingContextId || getSignalId(item)) {
      result.totalWithContext += 1;
    }

    if (item?.isOperationallyHandled || item?.is_operationally_handled || item?.status === 'task_linked_handled') {
      result.handled += 1;
    }

    if (['synced', 'success', 'completed', 'complete', 'ok'].includes(status)) {
      result.synced += 1;
    } else if (['partial', 'partially_synced', 'partial_success'].includes(status)) {
      result.partial += 1;
    } else if (['failed', 'error', 'writeback_failed', 'sync_failed'].includes(status)) {
      result.failed += 1;
    } else if (['pending', 'queued', 'processing', 'in_progress'].includes(status)) {
      result.pending += 1;
    } else {
      result.noWriteback += 1;
    }
  }

  return result;
}

function normalizeActionEvidence(result, actionId, fallbackContext = {}) {
  const safe = result || {};
  const writeback = safe.writeback || {};
  const task = safe.task || safe.updatedTask || safe.updated_task || {};
  const createdTask = safe.createdTask || safe.created_task || {};

  const status = firstValue(
    writeback.status,
    task.writeback_status,
    task.writebackStatus,
    safe.writeback_status,
    safe.writebackStatus,
    fallbackContext.writebackStatus,
    'unknown'
  );

  const signalStatus = firstValue(
    writeback.signalStatus,
    writeback.signal_status,
    writeback.signal?.status,
    task.signal_writeback_status,
    task.signalWritebackStatus,
    safe.signal_writeback_status,
    safe.signalWritebackStatus,
    fallbackContext.signalStatus,
    '—'
  );

  const coachingStatus = firstValue(
    writeback.coachingStatus,
    writeback.coaching_status,
    writeback.coaching?.status,
    task.coaching_writeback_status,
    task.coachingWritebackStatus,
    safe.coaching_writeback_status,
    safe.coachingWritebackStatus,
    fallbackContext.coachingStatus,
    '—'
  );

  const signalId = firstValue(
    writeback.signal?.id,
    writeback.signalId,
    writeback.signal_id,
    task.linked_signal_id,
    task.linkedSignalId,
    task.signal_id,
    task.signalId,
    task.atlas_signal_id,
    task.atlasSignalId,
    safe.linked_signal_id,
    safe.linkedSignalId,
    safe.signal_id,
    safe.signalId,
    safe.atlas_signal_id,
    safe.atlasSignalId,
    fallbackContext.signalId,
    '—'
  );

  const coachingContextId = firstValue(
    writeback.coaching?.id,
    writeback.coachingContextId,
    writeback.coaching_context_id,
    task.coaching_context_id,
    task.coachingContextId,
    task.linked_coaching_context_id,
    task.linkedCoachingContextId,
    safe.coaching_context_id,
    safe.coachingContextId,
    safe.linked_coaching_context_id,
    safe.linkedCoachingContextId,
    fallbackContext.coachingContextId,
    '—'
  );

  const createdTaskId = firstValue(
    createdTask.id,
    createdTask.taskId,
    createdTask.task_id,
    safe.createdTaskId,
    safe.created_task_id,
    task.linked_task_id,
    task.linkedTaskId,
    task.id,
    task.taskId,
    task.task_id,
    fallbackContext.createdTaskId,
    '—'
  );

  const error = firstValue(
    writeback.error,
    writeback.errorMessage,
    writeback.error_message,
    task.writeback_error,
    task.writebackError,
    safe.writeback_error,
    safe.writebackError,
    null
  );

  return {
    actionId,
    action: firstValue(safe.action, safe.actionType, safe.action_type, 'create_task'),
    ok: safe.ok !== false,
    status,
    signalStatus,
    coachingStatus,
    signalId,
    coachingContextId,
    createdTaskId,
    error,
    syncedAt: firstValue(
      writeback.syncedAt,
      writeback.synced_at,
      task.writeback_synced_at,
      task.writebackSyncedAt,
      fallbackContext.syncedAt,
      new Date().toISOString()
    ),
    raw: safe
  };
}

function buildActionCreatePayload({ actionId, sourceItem }) {
  const sourceSignalId = firstValue(
    sourceItem?.linked_signal_id,
    sourceItem?.linkedSignalId,
    sourceItem?.signal_id,
    sourceItem?.signalId,
    sourceItem?.atlas_signal_id,
    sourceItem?.atlasSignalId,
    sourceItem?.case_id,
    sourceItem?.caseId
  );

  const sourceCoachingContextId = firstValue(
    sourceItem?.coaching_context_id,
    sourceItem?.coachingContextId,
    sourceItem?.linked_coaching_context_id,
    sourceItem?.linkedCoachingContextId,
    sourceItem?.patient_coaching_context_id,
    sourceItem?.patientCoachingContextId
  );

  const patientEmail = getPatientEmail(sourceItem);
  const patientName = firstValue(
    sourceItem?.patient_name,
    sourceItem?.patientName,
    sourceItem?.patient_full_name,
    sourceItem?.patientName,
    patientEmail
  );

  return {
    actionId,
    action_id: actionId,
    id: actionId,

    title: sourceItem?.title || `ATLAS action ${actionId}`,
    description: sourceItem?.description || 'Created from ATLAS Action Center',
    priority: sourceItem?.priority || 'medium',
    status: sourceItem?.status || 'open',

    tenant_id: sourceItem?.tenant_id,
    tenantId: sourceItem?.tenantId,

    patient_id: sourceItem?.patient_id,
    patientId: sourceItem?.patientId,

    patient_name: patientName,
    patientName,
    patient_full_name: patientName,
    patientEmail,
    patient_email: patientEmail,

    case_id: sourceItem?.case_id || sourceItem?.caseId || sourceSignalId,
    caseId: sourceItem?.caseId || sourceItem?.case_id || sourceSignalId,

    linked_signal_id: sourceSignalId,
    linkedSignalId: sourceSignalId,
    signal_id: sourceSignalId,
    signalId: sourceSignalId,
    atlas_signal_id: sourceSignalId,
    atlasSignalId: sourceSignalId,

    coaching_context_id: sourceCoachingContextId,
    coachingContextId: sourceCoachingContextId,
    linked_coaching_context_id: sourceCoachingContextId,
    linkedCoachingContextId: sourceCoachingContextId,
    patient_coaching_context_id: sourceCoachingContextId,
    patientCoachingContextId: sourceCoachingContextId,

    source_action_id: actionId,
    sourceActionId: actionId,
    source_ref: sourceItem?.source_ref || sourceItem?.sourceRef || sourceSignalId || actionId,
    sourceRef: sourceItem?.sourceRef || sourceItem?.source_ref || sourceSignalId || actionId,

    source_type: sourceItem?.source_type || sourceItem?.sourceType || 'atlas_action_center',
    sourceType: sourceItem?.sourceType || sourceItem?.source_type || 'atlas_action_center',
    source: sourceItem?.source || 'atlas_action_center',
    module: sourceItem?.module || 'atlas_action_center',

    action_group_name: sourceItem?.action_group_name || sourceItem?.actionGroupName,
    actionGroupName: sourceItem?.actionGroupName || sourceItem?.action_group_name,

    force: true
  };
}

function EvidenceRow({ label, value, tone }) {
  return (
    <div className="evidence-row">
      <span className="evidence-label">{label}</span>
      <span className={tone ? `evidence-value ${tone}` : 'evidence-value'}>
        {value || '—'}
      </span>
    </div>
  );
}

function LastActionEvidencePanel({ evidence, onClear }) {
  if (!evidence) return null;

  const tone = writebackTone(evidence.status);

  return (
    <section className={`action-evidence-card ${tone}`}>
      <div className="action-evidence-header">
        <div>
          <div className="eyebrow evidence-eyebrow">LAST ACTION WRITEBACK EVIDENCE</div>
          <h2>Action execution result</h2>
          <p>
            Απόδειξη του τελευταίου operation: τι task δημιουργήθηκε, αν έγινε writeback,
            και σε ποιο linked context συγχρονίστηκε.
          </p>
        </div>

        <div className="evidence-status-wrap">
          <span className={`badge ${badgeClass(tone)}`}>
            {writebackLabel(evidence.status)}
          </span>

          <button type="button" className="ghost-btn small" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="evidence-grid">
        <EvidenceRow label="Action" value={evidence.action} />
        <EvidenceRow label="Action ID" value={evidence.actionId} />
        <EvidenceRow label="Created / Updated task" value={evidence.createdTaskId} />
        <EvidenceRow
          label="Writeback status"
          value={writebackLabel(evidence.status)}
          tone={tone}
        />
        <EvidenceRow label="Signal ID" value={evidence.signalId} />
        <EvidenceRow label="Signal writeback" value={evidence.signalStatus} />
        <EvidenceRow label="Coaching context" value={evidence.coachingContextId} />
        <EvidenceRow label="Coaching writeback" value={evidence.coachingStatus} />
        <EvidenceRow label="Synced at" value={formatDateTime(evidence.syncedAt)} />
        <EvidenceRow
          label="Error"
          value={evidence.error || '—'}
          tone={evidence.error ? 'danger' : ''}
        />
      </div>

      {evidence.error ? (
        <div className="evidence-error">
          Το action εκτελέστηκε, αλλά υπάρχει writeback error. Αυτό θέλει backend/data check πριν θεωρηθεί κλειστό.
        </div>
      ) : null}
    </section>
  );
}

export default function TenantAtlasActionCenterPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [lastActionEvidence, setLastActionEvidence] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [writebackFilter, setWritebackFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  async function loadData(preferredId = '', options = {}) {
    setLoading(true);

    try {
      const payload = await apiRequest('/api/tenant/atlas/action-center', {
        errorLabel: 'ATLAS action center request failed'
      });

      const nextData = normalizeActionCenterPayload(payload || FALLBACK_DATA);
      const firstId = nextData.items?.length ? getItemId(nextData.items[0], 0) : '';

      setData(nextData);
      setFallbackMode(false);

      if (!options.preserveFlash) {
        setFlashMessage('');
      }

      if (options.clearEvidence) {
        setLastActionEvidence(null);
      }

      setSelectedId(preferredId || firstId);
    } catch (_error) {
      const firstId = FALLBACK_DATA.items?.length ? getItemId(FALLBACK_DATA.items[0], 0) : '';

      setData(FALLBACK_DATA);
      setFallbackMode(true);

      if (!options.preserveFlash) {
        setFlashMessage('');
      }

      if (options.clearEvidence) {
        setLastActionEvidence(null);
      }

      setSelectedId(preferredId || firstId);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const computedWriteback = useMemo(() => {
    return calculateWritebackSummary(data.items || []);
  }, [data.items]);

  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    if (priorityFilter) {
      items = items.filter((item) => String(item.priority || '') === priorityFilter);
    }

    if (typeFilter) {
      items = items.filter((item) => String(getItemType(item) || '') === typeFilter);
    }

    if (writebackFilter) {
      items = items.filter((item) => {
        const state = normalizeTaskWriteback(item);
        const status = String(state.status || '').toLowerCase();

        if (writebackFilter === 'synced') {
          return ['synced', 'success', 'completed', 'complete', 'ok'].includes(status);
        }

        if (writebackFilter === 'partial') {
          return ['partial', 'partially_synced', 'partial_success'].includes(status);
        }

        if (writebackFilter === 'failed') {
          return ['failed', 'error', 'writeback_failed', 'sync_failed'].includes(status);
        }

        if (writebackFilter === 'pending') {
          return ['pending', 'queued', 'processing', 'in_progress'].includes(status);
        }

        if (writebackFilter === 'no_writeback') {
          return ['skipped', 'not_applicable', 'none', 'no_context', ''].includes(status);
        }

        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();

      items = items.filter((item) => {
        const state = normalizeTaskWriteback(item);

        const haystack = [
          item.title,
          item.subtitle,
          item.description,
          getPatientEmail(item),
          item.patientName,
          item.patient_name,
          getAtlasCategory(item),
          getSignalKind(item),
          item.status,
          item.raw_status,
          item.operationalLabel,
          item.operational_label,
          item.case_id,
          item.caseId,
          state.status,
          state.linkedSignalId,
          state.coachingContextId,
          state.signalStatus,
          state.coachingStatus,
          getLinkedTaskId(item),
          getSignalId(item)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [data.items, priorityFilter, typeFilter, writebackFilter, searchTerm]);

  const selectedItem = useMemo(() => {
    return (
      filteredItems.find((item, index) => getItemId(item, index) === selectedId) ||
      filteredItems[0] ||
      null
    );
  }, [filteredItems, selectedId]);

  async function handleCreateTask(actionId) {
    setBusyId(actionId);
    setFlashMessage('');
    setLastActionEvidence(null);

    const sourceItem =
      selectedItem ||
      (data.items || []).find((item, index) => getItemId(item, index) === actionId) ||
      null;

    const requestBody = buildActionCreatePayload({
      actionId,
      sourceItem
    });

    const fallbackContext = {
      signalId: firstValue(
        requestBody.linked_signal_id,
        requestBody.signal_id,
        requestBody.atlas_signal_id,
        requestBody.case_id
      ),
      coachingContextId: firstValue(
        requestBody.coaching_context_id,
        requestBody.linked_coaching_context_id,
        requestBody.patient_coaching_context_id
      ),
      signalStatus: requestBody.linked_signal_id || requestBody.signal_id ? 'pending' : 'skipped',
      coachingStatus: requestBody.coaching_context_id ? 'pending' : 'skipped',
      writebackStatus:
        requestBody.linked_signal_id || requestBody.signal_id || requestBody.coaching_context_id
          ? 'pending'
          : 'not_applicable'
    };

    try {
      const result = await apiRequest(
        `/api/tenant/atlas/action-center/${encodeURIComponent(actionId)}/create-task`,
        {
          method: 'POST',
          body: requestBody,
          errorLabel: 'Create ATLAS task request failed'
        }
      );

      const evidence = normalizeActionEvidence(result, actionId, fallbackContext);
      setLastActionEvidence(evidence);

      setFlashMessage(
        evidence.status && evidence.status !== 'unknown'
          ? `Το task συγχρονίστηκε. Writeback status: ${writebackLabel(evidence.status)}.`
          : 'Το task δημιουργήθηκε ή επαναχρησιμοποιήθηκε επιτυχώς από το ATLAS Action Center.'
      );

      await loadData(actionId, { preserveFlash: true });
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία δημιουργίας task');
      setLastActionEvidence({
        actionId,
        action: 'create_task',
        ok: false,
        status: 'failed',
        signalStatus: fallbackContext.signalStatus || '—',
        coachingStatus: fallbackContext.coachingStatus || '—',
        signalId: fallbackContext.signalId || '—',
        coachingContextId: fallbackContext.coachingContextId || '—',
        createdTaskId: '—',
        error: error?.message || 'Create task failed',
        syncedAt: new Date().toISOString(),
        raw: null
      });
    } finally {
      setBusyId('');
    }
  }

  function handleActionRowKeyDown(event, id) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedId(id);
    }
  }

  if (loading) {
    return (
      <div className="tenant-atlas-action-center-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading ATLAS action center...</div>
      </div>
    );
  }

  return (
    <div className="tenant-atlas-action-center-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">ATLAS ACTION CENTER</div>
          <h1>Unified Escalation Surface</h1>
          <p>
            Ενιαία operational προβολή για patient signals, failed imports και coaching-driven follow-up.
            Το Phase 19.18 διορθώνει το deep link: όταν δεν υπάρχει πραγματικό patient email,
            το linked task ανοίγει στο unified task board αντί για ψεύτικο patient fallback.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">
            Total <strong>{data.summary?.total ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Critical <strong>{data.summary?.critical ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Warning <strong>{data.summary?.warning ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Create Task Now <strong>{data.summary?.createTaskNow ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Task Created <strong>{data.summary?.taskCreated ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Handled <strong>{computedWriteback.handled}</strong>
          </div>
          <div className="summary-pill">
            Linked Context <strong>{computedWriteback.totalWithContext}</strong>
          </div>
        </div>
      </section>

      <section className="writeback-summary-grid">
        <button
          type="button"
          className={`writeback-card success ${writebackFilter === 'synced' ? 'active' : ''}`}
          onClick={() => setWritebackFilter(writebackFilter === 'synced' ? '' : 'synced')}
        >
          <span>Synced</span>
          <strong>{computedWriteback.synced}</strong>
        </button>

        <button
          type="button"
          className={`writeback-card warning ${writebackFilter === 'partial' ? 'active' : ''}`}
          onClick={() => setWritebackFilter(writebackFilter === 'partial' ? '' : 'partial')}
        >
          <span>Partial</span>
          <strong>{computedWriteback.partial}</strong>
        </button>

        <button
          type="button"
          className={`writeback-card danger ${writebackFilter === 'failed' ? 'active' : ''}`}
          onClick={() => setWritebackFilter(writebackFilter === 'failed' ? '' : 'failed')}
        >
          <span>Failed</span>
          <strong>{computedWriteback.failed}</strong>
        </button>

        <button
          type="button"
          className={`writeback-card info ${writebackFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setWritebackFilter(writebackFilter === 'pending' ? '' : 'pending')}
        >
          <span>Pending</span>
          <strong>{computedWriteback.pending}</strong>
        </button>

        <button
          type="button"
          className={`writeback-card neutral ${writebackFilter === 'no_writeback' ? 'active' : ''}`}
          onClick={() =>
            setWritebackFilter(writebackFilter === 'no_writeback' ? '' : 'no_writeback')
          }
        >
          <span>No writeback</span>
          <strong>{computedWriteback.noWriteback}</strong>
        </button>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          ATLAS Action Center σε fallback mode. Εμφανίζονται demo δεδομένα. Το writeback UI φαίνεται,
          αλλά δεν επιβεβαιώνει πραγματικό backend sync.
        </div>
      ) : (
        <div className="banner success">
          Live ATLAS backend connected. Τα writeback states προέρχονται από το πραγματικό endpoint.
        </div>
      )}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <LastActionEvidencePanel
        evidence={lastActionEvidence}
        onClear={() => setLastActionEvidence(null)}
      />

      <section className="toolbar-card">
        <div className="toolbar-group">
          <select
            className="input"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="critical">critical</option>
            <option value="warning">warning</option>
            <option value="normal">normal</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>

          <select
            className="input"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">All types</option>
            <option value="signal">signal</option>
            <option value="import">import</option>
            <option value="coaching">coaching</option>
            <option value="atlas">atlas</option>
            <option value="action">action</option>
          </select>

          <select
            className="input"
            value={writebackFilter}
            onChange={(event) => setWritebackFilter(event.target.value)}
          >
            <option value="">All writeback states</option>
            <option value="synced">synced</option>
            <option value="partial">partial</option>
            <option value="failed">failed</option>
            <option value="pending">pending</option>
            <option value="no_writeback">no writeback</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            className="input search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patient, category, status, writeback..."
          />

          <button
            type="button"
            className="ghost-btn"
            onClick={() =>
              loadData(selectedItem ? getItemId(selectedItem, 0) : '', {
                clearEvidence: true
              })
            }
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Actions</div>

          <div className="action-list">
            {filteredItems.length ? (
              filteredItems.map((item, index) => {
                const id = getItemId(item, index);
                const state = normalizeTaskWriteback(item);

                return (
                  <div
                    key={id}
                    role="button"
                    tabIndex={0}
                    className={`action-row ${selectedId === id ? 'active' : ''}`}
                    onClick={() => setSelectedId(id)}
                    onKeyDown={(event) => handleActionRowKeyDown(event, id)}
                  >
                    <div className="action-row-top">
                      <span className="action-title">{item.title || 'ATLAS Action'}</span>
                      <span className={`badge ${badgeClass(priorityTone(item.priority))}`}>
                        {item.priority || 'normal'}
                      </span>
                    </div>

                    <div className="action-meta">
                      {item.subtitle || getPatientEmail(item) || item.patient_name || item.patientName || '—'}
                    </div>

                    <div className="action-meta">{statusLabel(item.status)}</div>

                    <div className="action-inline-badges">
                      {(item.badges || []).slice(0, 3).map((badge, badgeIndex) => (
                        <span
                          key={`${badge.label}-${badgeIndex}`}
                          className={`mini-badge ${badgeClass(badge.tone)}`}
                        >
                          {badge.label}
                        </span>
                      ))}

                      <span className={`mini-badge ${badgeClass(writebackTone(state.status))}`}>
                        {writebackLabel(state.status)}
                      </span>

                      {getLinkedTaskId(item) ? (
                        <span className="mini-badge success">LINKED TASK</span>
                      ) : null}
                    </div>

                    <TenantTaskWritebackPanel
                      task={item}
                      compact
                      showTitle={false}
                    />
                  </div>
                );
              })
            ) : (
              <div className="muted-inline">No ATLAS actions for this filter.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Action Detail</div>

          {selectedItem ? (
            <div className="detail-wrap">
              <div className="detail-title">{selectedItem.title || 'ATLAS Action'}</div>

              <div className="detail-badges">
                <span className={`badge ${badgeClass(priorityTone(selectedItem.priority))}`}>
                  {selectedItem.priority || 'normal'}
                </span>
                <span className="badge neutral">{statusLabel(selectedItem.status)}</span>
                <span className="badge neutral">{getItemType(selectedItem)}</span>
                <span
                  className={`badge ${badgeClass(
                    writebackTone(normalizeTaskWriteback(selectedItem).status)
                  )}`}
                >
                  {writebackLabel(normalizeTaskWriteback(selectedItem).status)}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">Patient</span>
                <span>
                  {getPatientEmail(selectedItem) ||
                    selectedItem.patient_name ||
                    selectedItem.patientName ||
                    '—'}
                </span>
              </div>

              <div className="detail-row">
                <span className="label">ATLAS Category</span>
                <span>{getAtlasCategory(selectedItem)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Signal ID</span>
                <span>{getSignalId(selectedItem) || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Signal Kind</span>
                <span>{getSignalKind(selectedItem)}</span>
              </div>

              <div className="detail-row">
                <span className="label">Linked Task</span>
                <span>{getLinkedTaskId(selectedItem) || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Created At</span>
                <span>{formatDateTime(getCreatedAt(selectedItem))}</span>
              </div>

              <div className="detail-description">
                {selectedItem.description || 'No description'}
              </div>

              <TenantTaskWritebackPanel task={selectedItem} />

              <div className="detail-actions">
                {canCreateTask(selectedItem) ? (
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={busyId === getItemId(selectedItem, 0)}
                    onClick={() => handleCreateTask(getItemId(selectedItem, 0))}
                  >
                    {busyId === getItemId(selectedItem, 0)
                      ? 'Creating...'
                      : getCreateTaskButtonLabel(selectedItem)}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="success-btn"
                      onClick={() => openTenantRoute(buildLinkedTaskReviewLink(selectedItem))}
                    >
                      Open Linked Task
                    </button>

                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => openTenantRoute(buildPatientTasksLink(selectedItem))}
                    >
                      Review Patient Tasks
                    </button>
                  </>
                )}

                {selectedItem.route ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => openTenantRoute(selectedItem.route)}
                  >
                    {getRouteLabel(selectedItem)}
                  </button>
                ) : null}

                {hasRealPatientEmail(selectedItem) ? (
                  <>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() =>
                        openTenantRoute(
                          `/tenant/patient-orchestrator/${encodeURIComponent(
                            getPatientEmail(selectedItem)
                          )}`
                        )
                      }
                    >
                      Open Patient
                    </button>

                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => openTenantRoute(buildPatientTasksLink(selectedItem))}
                    >
                      Open Patient Tasks
                    </button>

                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() =>
                        openTenantRoute(
                          `/tenant/reports/patient/${encodeURIComponent(
                            getPatientEmail(selectedItem)
                          )}`
                        )
                      }
                    >
                      Open Report
                    </button>
                  </>
                ) : null}
              </div>

              <div className="subsection-title">Badges</div>
              <div className="detail-badges">
                {(selectedItem.badges || []).map((badge, index) => (
                  <span
                    key={`${badge.label}-${index}`}
                    className={`badge ${badgeClass(badge.tone)}`}
                  >
                    {badge.label}
                  </span>
                ))}

                {getLinkedTaskId(selectedItem) ? (
                  <span className="badge success">LINKED TASK READY</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="muted-inline">No action selected.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-atlas-action-center-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .toolbar-card,
  .writeback-card,
  .action-evidence-card {
    background: rgba(255,255,255,0.94);
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
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .summary-pill strong {
    color: #0f172a;
  }

  .writeback-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .writeback-card {
    border-radius: 18px;
    padding: 14px 16px;
    cursor: pointer;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: 0.16s ease;
    font-weight: 900;
  }

  .writeback-card span {
    font-size: 13px;
  }

  .writeback-card strong {
    font-size: 22px;
    color: #0f172a;
  }

  .writeback-card:hover,
  .writeback-card.active {
    transform: translateY(-1px);
    box-shadow: 0 18px 42px rgba(15,23,42,0.12);
  }

  .writeback-card.success {
    background: #ecfdf5;
    color: #047857;
    border-color: #86efac;
  }

  .writeback-card.warning {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fdba74;
  }

  .writeback-card.danger {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .writeback-card.info {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .writeback-card.neutral {
    background: #f8fafc;
    color: #475569;
    border-color: #cbd5e1;
  }

  .action-evidence-card {
    padding: 18px;
    border-radius: 22px;
  }

  .action-evidence-card.success {
    background:
      radial-gradient(circle at top right, rgba(18,183,106,0.12), transparent 30%),
      #ffffff;
    border-color: #abefc6;
  }

  .action-evidence-card.warning {
    background:
      radial-gradient(circle at top right, rgba(247,144,9,0.12), transparent 30%),
      #ffffff;
    border-color: #fedf89;
  }

  .action-evidence-card.danger {
    background:
      radial-gradient(circle at top right, rgba(240,68,56,0.12), transparent 30%),
      #ffffff;
    border-color: #fecdca;
  }

  .action-evidence-card.info {
    background:
      radial-gradient(circle at top right, rgba(46,144,250,0.12), transparent 30%),
      #ffffff;
    border-color: #b2ddff;
  }

  .action-evidence-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .evidence-status-wrap {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .evidence-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .evidence-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .evidence-label {
    color: #475569;
    font-weight: 900;
  }

  .evidence-value {
    color: #0f172a;
    font-weight: 800;
    text-align: right;
    word-break: break-word;
  }

  .evidence-value.success {
    color: #047857;
  }

  .evidence-value.warning {
    color: #c2410c;
  }

  .evidence-value.danger {
    color: #b91c1c;
  }

  .evidence-value.info {
    color: #1d4ed8;
  }

  .evidence-error {
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    font-weight: 800;
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

  .banner.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
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

  .layout-grid {
    display: grid;
    grid-template-columns: 440px 1fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title,
  .subsection-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .subsection-title {
    margin-top: 6px;
    font-size: 14px;
  }

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    box-sizing: border-box;
    outline: none;
    transition: 0.16s ease;
  }

  .action-row:hover {
    border-color: #c4b5fd;
    background: #faf5ff;
  }

  .action-row:focus-visible {
    box-shadow: 0 0 0 3px rgba(124,58,237,0.18);
  }

  .action-row.active {
    background: #f5f3ff;
    border-color: #c4b5fd;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
  }

  .action-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
  }

  .action-title {
    font-weight: 900;
    color: #0f172a;
  }

  .action-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .action-inline-badges,
  .detail-badges,
  .detail-actions {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
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

  .detail-description {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
  }

  .label {
    color: #475569;
    font-weight: 800;
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
  .success-btn,
  .ghost-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .ghost-btn.small {
    padding: 8px 10px;
    font-size: 12px;
  }

  .primary-btn:disabled,
  .success-btn:disabled,
  .ghost-btn:disabled {
    opacity: 0.72;
    cursor: not-allowed;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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

  .muted-inline {
    color: #64748b;
  }

  @media (max-width: 1180px) {
    .writeback-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .evidence-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .action-evidence-header {
      flex-direction: column;
    }

    .evidence-status-wrap {
      justify-content: flex-start;
    }
  }

  @media (max-width: 700px) {
    .summary-grid,
    .writeback-summary-grid {
      grid-template-columns: 1fr;
    }

    .input.search {
      min-width: 170px;
    }
  }
`;