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

function parseJsonObject(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
    if (Array.isArray(value.history)) return value.history;
    if (Array.isArray(value.checks)) return value.checks;
    if (Array.isArray(value.recentProblems)) return value.recentProblems;
    if (Array.isArray(value.recent_problems)) return value.recent_problems;
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
      if (parsed && Array.isArray(parsed.history)) return parsed.history;
      if (parsed && Array.isArray(parsed.checks)) return parsed.checks;
      if (parsed && Array.isArray(parsed.recentProblems)) return parsed.recentProblems;
      if (parsed && Array.isArray(parsed.recent_problems)) return parsed.recent_problems;

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
      'healthy',
      'passed',
      'pass',
      'synced',
      'ok',
      'done',
      'resolved',
      'completed',
      'success'
    ].includes(value)
  ) {
    return 'success';
  }

  if (
    [
      'warning',
      'partial',
      'pending',
      'open',
      'in_progress',
      'no_data'
    ].includes(value)
  ) {
    return 'warning';
  }

  if (
    [
      'critical',
      'failed',
      'fail',
      'error',
      'missing',
      'not_found'
    ].includes(value)
  ) {
    return 'danger';
  }

  return 'neutral';
}

function statusLabel(status = '') {
  const value = String(status || '').toLowerCase();

  if (value === 'healthy') return 'Healthy';
  if (value === 'critical') return 'Critical';
  if (value === 'no_data') return 'No Data';
  if (value === 'passed') return 'Passed';
  if (value === 'failed') return 'Failed';
  if (value === 'warning') return 'Warning';
  if (value === 'open') return 'Open';
  if (value === 'pending') return 'Pending';
  if (value === 'in_progress') return 'In Progress';
  if (value === 'escalated') return 'Escalated';
  if (value === 'done') return 'Done';
  if (value === 'resolved') return 'Resolved';
  if (value === 'completed') return 'Completed';

  return status || 'Unknown';
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
  return firstValue(task?.status, task?.taskStatus, task?.task_status);
}

function getTaskSignalId(task) {
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
  return firstValue(signal?.taskStatus, signal?.task_status);
}

function getSignalFollowupStatus(signal) {
  return firstValue(signal?.followupStatus, signal?.followup_status);
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
  return parseJsonObject(firstValue(signal?.lastActionPayload, signal?.last_action_payload, {}));
}

function getRecordId(record) {
  return firstValue(record?.id, record?.verificationId, record?.verification_id);
}

function getRecordTaskId(record) {
  return firstValue(record?.taskId, record?.task_id);
}

function getRecordSignalId(record) {
  return firstValue(record?.signalId, record?.signal_id);
}

function getRecordSourceActionId(record) {
  return firstValue(record?.sourceActionId, record?.source_action_id);
}

function getRecordVerdict(record) {
  return firstValue(record?.verdict, 'unknown');
}

function getRecordCreatedAt(record) {
  return firstValue(record?.createdAt, record?.created_at);
}

function getRecordEvidence(record) {
  return parseJsonObject(firstValue(record?.evidence, {}));
}

function getRecordChecks(record) {
  return parseJsonArray(firstValue(record?.checks, []));
}

function getRecordPassedCount(record) {
  return firstValue(record?.passedCount, record?.passed_count, 0);
}

function getRecordWarningCount(record) {
  return firstValue(record?.warningCount, record?.warning_count, 0);
}

function getRecordFailedCount(record) {
  return firstValue(record?.failedCount, record?.failed_count, 0);
}

function buildBackendVerificationPath({ taskId, signalId, sourceActionId }) {
  const query = new URLSearchParams();

  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);

  const qs = query.toString();
  return qs ? `/api/tenant/closed-loop-verification?${qs}` : '/api/tenant/closed-loop-verification';
}

function buildSummaryPath({ taskId, signalId, sourceActionId, hours = 168 }) {
  const query = new URLSearchParams();

  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);
  query.set('hours', String(hours));

  return `/api/tenant/closed-loop-verification/summary?${query.toString()}`;
}

function buildHistoryPath({ taskId, signalId, sourceActionId, verdict, limit = 25 }) {
  const query = new URLSearchParams();

  if (taskId) query.set('taskId', taskId);
  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);
  if (verdict) query.set('verdict', verdict);
  query.set('limit', String(limit));

  return `/api/tenant/closed-loop-verification/history?${query.toString()}`;
}

function buildTaskUiPath({ taskId, signalId, sourceActionId }) {
  const query = new URLSearchParams();

  if (taskId) {
    query.set('taskId', taskId);
    query.set('q', taskId);
  }

  if (signalId) query.set('signalId', signalId);
  if (sourceActionId) query.set('sourceActionId', sourceActionId);

  const qs = query.toString();
  return qs ? `/tenant/tasks-unified?${qs}` : '/tenant/tasks-unified';
}

function buildSignalUiPath({ signalId }) {
  const query = new URLSearchParams();

  if (signalId) query.set('signalId', signalId);

  const qs = query.toString();
  return qs ? `/tenant/patient-signals?${qs}` : '/tenant/patient-signals';
}

function openTenantRoute(path) {
  window.location.href = path;
}

function normalizeBackendPayload(payload) {
  const safe = payload || {};
  const verification = safe.verification || {};
  const checks = Array.isArray(verification.checks) ? verification.checks : [];

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.34-closed-loop-kpi-dashboard-ui',
    generatedAt: safe.generatedAt,
    query: safe.query || {},
    verdict: safe.verdict || verification.verdict || 'not_checked',
    verification: {
      ...verification,
      checks,
      evidence: verification.evidence || {}
    },
    verificationRecord: safe.verificationRecord || safe.verification_record || null,
    verification_record: safe.verificationRecord || safe.verification_record || null,
    audit: safe.audit || {},
    task: safe.task || null,
    signal: safe.signal || null
  };
}

function normalizeHistoryPayload(payload) {
  const safe = payload || {};
  const history = safe.history || safe.items || safe.rows || [];

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.34-closed-loop-kpi-dashboard-ui',
    generatedAt: safe.generatedAt,
    total: safe.total ?? history.length,
    history: Array.isArray(history) ? history : []
  };
}

function normalizeSummaryPayload(payload) {
  const safe = payload || {};
  const summary = safe.summary || {};
  const totals = summary.totals || {};
  const health = summary.health || {};

  return {
    ok: safe.ok !== false,
    phase: safe.phase || '19.34-closed-loop-kpi-dashboard-ui',
    generatedAt: safe.generatedAt,
    summary: {
      ...summary,
      totals: {
        total: totals.total || 0,
        passed: totals.passed || 0,
        warning: totals.warning || 0,
        failed: totals.failed || 0,
        lastCheckedAt: firstValue(totals.lastCheckedAt, totals.last_checked_at, null),
        last_checked_at: firstValue(totals.last_checked_at, totals.lastCheckedAt, null)
      },
      health: {
        status: firstValue(health.status, 'no_data'),
        passRate: firstValue(health.passRate, health.pass_rate, 0),
        pass_rate: firstValue(health.pass_rate, health.passRate, 0),
        problemRate: firstValue(health.problemRate, health.problem_rate, 0),
        problem_rate: firstValue(health.problem_rate, health.problemRate, 0)
      },
      byVerdict: parseJsonArray(firstValue(summary.byVerdict, summary.by_verdict, [])),
      by_verdict: parseJsonArray(firstValue(summary.by_verdict, summary.byVerdict, [])),
      topProblemSignals: parseJsonArray(
        firstValue(summary.topProblemSignals, summary.top_problem_signals, [])
      ),
      top_problem_signals: parseJsonArray(
        firstValue(summary.top_problem_signals, summary.topProblemSignals, [])
      ),
      recentProblems: parseJsonArray(firstValue(summary.recentProblems, summary.recent_problems, [])),
      recent_problems: parseJsonArray(firstValue(summary.recent_problems, summary.recentProblems, [])),
      recent: parseJsonArray(summary.recent || [])
    }
  };
}

function CheckRow({ check }) {
  const tone = statusTone(check.status);

  return (
    <div className={`check-row ${tone}`}>
      <div>
        <div className="check-label">{check.label || check.id || 'Check'}</div>
        <div className="check-detail">{check.detail || '—'}</div>
      </div>

      <span className={`badge ${badgeClass(tone)}`}>
        {statusLabel(check.status)}
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

function KpiCard({ label, value, tone, subtext }) {
  return (
    <div className={`kpi-card ${badgeClass(tone)}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {subtext ? <small>{subtext}</small> : null}
    </div>
  );
}

function ClosedLoopKpiDashboard({ summaryResult, loading, error, onRefresh }) {
  const summary = summaryResult?.summary || {};
  const totals = summary.totals || {};
  const health = summary.health || {};
  const healthTone = statusTone(health.status);

  const topProblemSignals = parseJsonArray(
    firstValue(summary.topProblemSignals, summary.top_problem_signals, [])
  );

  const recentProblems = parseJsonArray(
    firstValue(summary.recentProblems, summary.recent_problems, [])
  );

  return (
    <section className={`kpi-dashboard-card ${badgeClass(healthTone)}`}>
      <div className="kpi-dashboard-header">
        <div>
          <div className="eyebrow">CLOSED LOOP SYSTEM HEALTH</div>
          <h2>KPI Dashboard</h2>
          <p>
            Συνολική εικόνα από το audit trail του closed loop verification. Αν εδώ έχει failed,
            δεν πανηγυρίζουμε επειδή ένα μόνο task πέρασε.
          </p>
        </div>

        <div className="kpi-health-box">
          <span>Health</span>
          <strong>{statusLabel(health.status || 'no_data')}</strong>
          <small>
            Last check: {formatDateTime(firstValue(totals.lastCheckedAt, totals.last_checked_at))}
          </small>
        </div>
      </div>

      {error ? (
        <div className="banner danger">
          {error}
        </div>
      ) : null}

      <div className="kpi-grid">
        <KpiCard label="Total checks" value={totals.total || 0} tone="neutral" />
        <KpiCard label="Passed" value={totals.passed || 0} tone="success" />
        <KpiCard label="Warnings" value={totals.warning || 0} tone="warning" />
        <KpiCard label="Failed" value={totals.failed || 0} tone="danger" />
        <KpiCard
          label="Pass rate"
          value={`${firstValue(health.passRate, health.pass_rate, 0)}%`}
          tone={Number(firstValue(health.passRate, health.pass_rate, 0)) >= 90 ? 'success' : 'warning'}
        />
        <KpiCard
          label="Problem rate"
          value={`${firstValue(health.problemRate, health.problem_rate, 0)}%`}
          tone={Number(firstValue(health.problemRate, health.problem_rate, 0)) > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="kpi-actions">
        <button
          type="button"
          className="ghost-btn"
          disabled={loading}
          onClick={onRefresh}
        >
          {loading ? 'Loading KPIs...' : 'Refresh KPI Summary'}
        </button>
      </div>

      <div className="problem-grid">
        <div className="problem-panel">
          <div className="section-subtitle">Top problem signals</div>

          {topProblemSignals.length ? (
            <div className="problem-list">
              {topProblemSignals.map((item, index) => (
                <div key={`${item.signal_id || index}`} className="problem-row">
                  <div>
                    <strong>{item.signal_id || '—'}</strong>
                    <span>
                      Total {item.total || 0} · Failed {item.failed || 0} · Warning {item.warning || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mini-link-btn"
                    onClick={() =>
                      item.signal_id
                        ? openTenantRoute(`/tenant/patient-signals?signalId=${encodeURIComponent(item.signal_id)}`)
                        : null
                    }
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Δεν υπάρχουν προβληματικά signals στο τρέχον χρονικό παράθυρο.
            </div>
          )}
        </div>

        <div className="problem-panel">
          <div className="section-subtitle">Recent warning / failed checks</div>

          {recentProblems.length ? (
            <div className="problem-list">
              {recentProblems.map((record) => (
                <div key={getRecordId(record)} className="problem-row">
                  <div>
                    <strong>{getRecordVerdict(record)}</strong>
                    <span>
                      {getRecordSignalId(record) || '—'} · {formatDateTime(getRecordCreatedAt(record))}
                    </span>
                  </div>
                  <span className={`badge ${badgeClass(statusTone(getRecordVerdict(record)))}`}>
                    {statusLabel(getRecordVerdict(record))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Δεν υπάρχουν πρόσφατα warning / failed records.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ServerVerdictPanel({ result }) {
  const verdict = result?.verdict || 'not_checked';
  const tone = statusTone(verdict);
  const checks = result?.verification?.checks || [];
  const failed = checks.filter((check) => check.status === 'failed').length;
  const warnings = checks.filter((check) => check.status === 'warning').length;
  const passed = checks.filter((check) => check.status === 'passed').length;
  const record = result?.verificationRecord || result?.verification_record;

  return (
    <section className={`server-verdict-card ${badgeClass(tone)}`}>
      <div>
        <div className="eyebrow">SERVER-SIDE VERDICT</div>
        <h2>{statusLabel(verdict)}</h2>
        <p>
          Το verdict προέρχεται από το backend και γράφεται μόνιμα στο audit trail.
        </p>

        {record ? (
          <div className="audit-record-pill">
            Audit record: <strong>{getRecordId(record)}</strong>
          </div>
        ) : (
          <div className="audit-record-pill warning-text">
            Audit record δεν επέστρεψε στο response.
          </div>
        )}
      </div>

      <div className="verdict-metrics">
        <div>
          <span>Passed</span>
          <strong>{passed}</strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{warnings}</strong>
        </div>
        <div>
          <span>Failed</span>
          <strong>{failed}</strong>
        </div>
      </div>
    </section>
  );
}

function AuditHistoryRow({ record, active, onSelect }) {
  const verdict = getRecordVerdict(record);
  const tone = statusTone(verdict);

  return (
    <button
      type="button"
      className={`history-row ${active ? 'active' : ''}`}
      onClick={() => onSelect(record)}
    >
      <div className="history-row-top">
        <span className="history-id">{getRecordId(record)}</span>
        <span className={`badge ${badgeClass(tone)}`}>
          {statusLabel(verdict)}
        </span>
      </div>

      <div className="history-meta">
        Signal: <strong>{getRecordSignalId(record) || '—'}</strong>
      </div>

      <div className="history-meta">
        Task: <strong>{getRecordTaskId(record) || '—'}</strong>
      </div>

      <div className="history-meta">
        Created: <strong>{formatDateTime(getRecordCreatedAt(record))}</strong>
      </div>

      <div className="history-counts">
        <span className="mini-count success">P {getRecordPassedCount(record)}</span>
        <span className="mini-count warning">W {getRecordWarningCount(record)}</span>
        <span className="mini-count danger">F {getRecordFailedCount(record)}</span>
      </div>
    </button>
  );
}

function AuditRecordDetail({ record }) {
  const checks = getRecordChecks(record);
  const evidence = getRecordEvidence(record);
  const verdict = getRecordVerdict(record);

  return (
    <div className="audit-detail-wrap">
      <div className="audit-detail-title">
        <span>Audit Detail</span>
        <span className={`badge ${badgeClass(statusTone(verdict))}`}>
          {statusLabel(verdict)}
        </span>
      </div>

      <div className="evidence-grid compact">
        <DetailRow label="Record ID" value={getRecordId(record)} />
        <DetailRow label="Created" value={formatDateTime(getRecordCreatedAt(record))} />
        <DetailRow label="Task ID" value={getRecordTaskId(record)} />
        <DetailRow label="Signal ID" value={getRecordSignalId(record)} />
        <DetailRow label="Source Action" value={getRecordSourceActionId(record)} />
        <DetailRow label="Task status" value={evidence.taskStatus} tone={statusTone(evidence.taskStatus)} />
        <DetailRow label="Signal task status" value={evidence.signalTaskStatus} tone={statusTone(evidence.signalTaskStatus)} />
        <DetailRow label="Signal follow-up" value={evidence.signalFollowupStatus} tone={statusTone(evidence.signalFollowupStatus)} />
        <DetailRow label="Last writeback" value={formatDateTime(evidence.lastWritebackAt)} />
        <DetailRow label="Payload task id" value={evidence.payloadTaskId} />
      </div>

      <div className="audit-checks-mini">
        <div className="section-subtitle">Stored checks</div>

        {checks.length ? (
          checks.map((check) => (
            <CheckRow key={check.id || check.label} check={check} />
          ))
        ) : (
          <div className="empty-state">No stored checks in this record.</div>
        )}
      </div>
    </div>
  );
}

function AuditHistoryPanel({
  history,
  selectedRecord,
  onSelectRecord,
  loading,
  error,
  onRefresh
}) {
  return (
    <section className="audit-history-card">
      <div className="history-header">
        <div>
          <div className="eyebrow">PERSISTENT AUDIT TRAIL</div>
          <h2>Closed loop verification history</h2>
          <p>
            Κάθε backend verification αποθηκεύεται μόνιμα στο table closed_loop_verifications.
          </p>
        </div>

        <button
          type="button"
          className="ghost-btn"
          disabled={loading}
          onClick={onRefresh}
        >
          {loading ? 'Loading...' : 'Refresh History'}
        </button>
      </div>

      {error ? (
        <div className="banner danger">
          {error}
        </div>
      ) : null}

      <div className="history-layout">
        <div className="history-list">
          {history.length ? (
            history.map((record) => (
              <AuditHistoryRow
                key={getRecordId(record)}
                record={record}
                active={getRecordId(selectedRecord) === getRecordId(record)}
                onSelect={onSelectRecord}
              />
            ))
          ) : (
            <div className="empty-state">
              Δεν υπάρχει ακόμα audit history για τα τρέχοντα φίλτρα.
            </div>
          )}
        </div>

        <div className="history-detail">
          {selectedRecord ? (
            <AuditRecordDetail record={selectedRecord} />
          ) : (
            <div className="empty-state">
              Επίλεξε ένα audit record για λεπτομέρειες.
            </div>
          )}
        </div>
      </div>
    </section>
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
  const [summaryHours, setSummaryHours] = useState('168');
  const [historyVerdictFilter, setHistoryVerdictFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [result, setResult] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState('');

  const task = result?.task || null;
  const signal = result?.signal || null;
  const evidence = result?.verification?.evidence || {};
  const checks = result?.verification?.checks || [];
  const payload = getLastPayload(signal);

  async function loadSummary() {
    setSummaryLoading(true);
    setSummaryError('');

    try {
      const summaryPayload = await apiRequest(
        buildSummaryPath({
          taskId,
          signalId,
          sourceActionId,
          hours: summaryHours
        }),
        {
          errorLabel: 'Closed loop verification summary request failed'
        }
      );

      const normalized = normalizeSummaryPayload(summaryPayload);
      setSummaryResult(normalized);
    } catch (error) {
      setSummaryError(error?.message || 'Closed loop verification summary request failed');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function loadHistory(preferredRecordId = '') {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const historyPayload = await apiRequest(
        buildHistoryPath({
          taskId,
          signalId,
          sourceActionId,
          verdict: historyVerdictFilter,
          limit: 25
        }),
        {
          errorLabel: 'Closed loop verification history request failed'
        }
      );

      const normalized = normalizeHistoryPayload(historyPayload);
      const nextHistory = normalized.history || [];

      setHistory(nextHistory);

      const preferred =
        nextHistory.find((record) => getRecordId(record) === preferredRecordId) ||
        nextHistory[0] ||
        null;

      setSelectedRecord(preferred);
    } catch (error) {
      setHistoryError(error?.message || 'Closed loop verification history request failed');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function runVerification() {
    setLoading(true);
    setErrorMessage('');

    try {
      const payloadData = await apiRequest(
        buildBackendVerificationPath({
          taskId,
          signalId,
          sourceActionId
        }),
        {
          errorLabel: 'Backend closed loop verification request failed'
        }
      );

      const normalized = normalizeBackendPayload(payloadData);
      const record = normalized.verificationRecord || normalized.verification_record;

      setResult(normalized);
      setLastCheckedAt(new Date().toISOString());

      await loadSummary();
      await loadHistory(record ? getRecordId(record) : '');
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
            Phase 19.34: η σελίδα δείχνει πλέον operational KPI dashboard από το backend summary endpoint.
            Δεν κοιτάμε μόνο ένα record· κοιτάμε την υγεία ολόκληρου του closed-loop συστήματος.
          </p>
        </div>

        <div className={`verdict-card ${badgeClass(statusTone(result?.verdict || 'not_checked'))}`}>
          <span>Latest Verdict</span>
          <strong>{statusLabel(result?.verdict || 'Not checked')}</strong>
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

        <div className="input-group">
          <label>Summary Window</label>
          <select
            value={summaryHours}
            onChange={(event) => setSummaryHours(event.target.value)}
          >
            <option value="24">Last 24 hours</option>
            <option value="168">Last 7 days</option>
            <option value="720">Last 30 days</option>
            <option value="2160">Last 90 days</option>
          </select>
        </div>

        <div className="input-group">
          <label>History Verdict</label>
          <select
            value={historyVerdictFilter}
            onChange={(event) => setHistoryVerdictFilter(event.target.value)}
          >
            <option value="">All verdicts</option>
            <option value="passed">passed</option>
            <option value="warning">warning</option>
            <option value="failed">failed</option>
          </select>
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

      <ClosedLoopKpiDashboard
        summaryResult={summaryResult}
        loading={summaryLoading}
        error={summaryError}
        onRefresh={loadSummary}
      />

      {result ? <ServerVerdictPanel result={result} /> : null}

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Backend Verification Checks</div>

          {checks.length ? (
            <div className="check-list">
              {checks.map((check) => (
                <CheckRow key={check.id || check.label} check={check} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Δεν έχει τρέξει ακόμα backend verification.
            </div>
          )}
        </div>

        <div className="page-card">
          <div className="section-title">Server Evidence</div>

          <div className="evidence-grid">
            <DetailRow label="Backend phase" value={result?.phase} />
            <DetailRow label="Generated at" value={formatDateTime(result?.generatedAt)} />

            <DetailRow label="Task ID" value={getTaskId(task) || evidence.taskId} />
            <DetailRow label="Task status" value={getTaskStatus(task) || evidence.taskStatus} tone={statusTone(getTaskStatus(task) || evidence.taskStatus)} />
            <DetailRow label="Task linked signal" value={getTaskSignalId(task) || evidence.taskSignalId} />

            <DetailRow label="Signal ID" value={getSignalId(signal) || evidence.signalId} />
            <DetailRow label="Signal task status" value={getSignalTaskStatus(signal) || evidence.signalTaskStatus} tone={statusTone(getSignalTaskStatus(signal) || evidence.signalTaskStatus)} />
            <DetailRow label="Signal follow-up status" value={getSignalFollowupStatus(signal) || evidence.signalFollowupStatus} tone={statusTone(getSignalFollowupStatus(signal) || evidence.signalFollowupStatus)} />

            <DetailRow label="Last writeback" value={formatDateTime(getLastWritebackAt(signal) || evidence.lastWritebackAt)} />
            <DetailRow label="Payload action" value={payload?.action || evidence.payloadAction} />
            <DetailRow label="Payload task id" value={payload?.task_id || payload?.taskId || evidence.payloadTaskId} />
            <DetailRow label="Payload next status" value={payload?.next_status || payload?.task_status || evidence.payloadNextStatus} tone={statusTone(payload?.next_status || payload?.task_status || evidence.payloadNextStatus)} />
            <DetailRow label="Payload follow-up" value={payload?.followup_status || evidence.payloadFollowupStatus} tone={statusTone(payload?.followup_status || evidence.payloadFollowupStatus)} />
          </div>

          <div className="action-row">
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                openTenantRoute(
                  buildTaskUiPath({
                    taskId: getTaskId(task) || taskId,
                    signalId: getSignalId(signal) || signalId,
                    sourceActionId
                  })
                )
              }
            >
              Open Unified Task
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                openTenantRoute(
                  buildSignalUiPath({
                    signalId: getSignalId(signal) || signalId
                  })
                )
              }
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

      <AuditHistoryPanel
        history={history}
        selectedRecord={selectedRecord}
        onSelectRecord={setSelectedRecord}
        loading={historyLoading}
        error={historyError}
        onRefresh={() => loadHistory(selectedRecord ? getRecordId(selectedRecord) : '')}
      />
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
  .verdict-card,
  .server-verdict-card,
  .audit-history-card,
  .kpi-dashboard-card {
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

  h2 {
    margin: 0;
    font-size: 24px;
    color: #0f172a;
  }

  p {
    color: #475569;
    line-height: 1.7;
  }

  .verdict-card,
  .server-verdict-card,
  .audit-history-card,
  .kpi-dashboard-card {
    padding: 20px;
  }

  .verdict-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .verdict-card span,
  .server-verdict-card span,
  .kpi-health-box span,
  .kpi-card span {
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

  .verdict-card.success,
  .server-verdict-card.success,
  .kpi-dashboard-card.success,
  .kpi-card.success {
    background: #ecfdf5;
    border-color: #86efac;
    color: #047857;
  }

  .verdict-card.warning,
  .server-verdict-card.warning,
  .kpi-dashboard-card.warning,
  .kpi-card.warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }

  .verdict-card.danger,
  .server-verdict-card.danger,
  .kpi-dashboard-card.danger,
  .kpi-card.danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .verdict-card.neutral,
  .server-verdict-card.neutral,
  .kpi-dashboard-card.neutral,
  .kpi-card.neutral {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
  }

  .kpi-dashboard-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .kpi-dashboard-header {
    display: grid;
    grid-template-columns: 1.35fr 320px;
    gap: 18px;
    align-items: center;
  }

  .kpi-health-box {
    border-radius: 20px;
    padding: 18px;
    background: rgba(255,255,255,0.75);
    border: 1px solid rgba(148,163,184,0.25);
  }

  .kpi-health-box strong {
    display: block;
    margin-top: 6px;
    font-size: 28px;
    text-transform: uppercase;
    color: #0f172a;
  }

  .kpi-health-box small {
    display: block;
    margin-top: 8px;
    color: #64748b;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .kpi-card {
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 18px;
    padding: 14px;
  }

  .kpi-card strong {
    display: block;
    margin-top: 8px;
    color: #0f172a;
    font-size: 24px;
  }

  .kpi-card small {
    display: block;
    margin-top: 6px;
    color: #64748b;
  }

  .kpi-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .problem-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .problem-panel {
    border-radius: 18px;
    padding: 14px;
    background: rgba(255,255,255,0.68);
    border: 1px solid rgba(148,163,184,0.25);
  }

  .problem-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .problem-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .problem-row strong {
    display: block;
    color: #0f172a;
    font-weight: 900;
  }

  .problem-row span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 12px;
  }

  .mini-link-btn {
    border: 1px solid #d0d5dd;
    background: #fff;
    color: #344054;
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .server-verdict-card {
    display: grid;
    grid-template-columns: 1.3fr 360px;
    gap: 18px;
    align-items: center;
  }

  .audit-record-pill {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(148,163,184,0.25);
    color: #334155;
    font-weight: 800;
    word-break: break-word;
  }

  .warning-text {
    color: #c2410c;
  }

  .verdict-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .verdict-metrics div {
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(148,163,184,0.25);
    border-radius: 16px;
    padding: 12px;
  }

  .verdict-metrics span {
    display: block;
    color: #475569;
    font-size: 11px;
  }

  .verdict-metrics strong {
    display: block;
    margin-top: 5px;
    color: #0f172a;
    font-size: 22px;
  }

  .toolbar-card {
    padding: 16px 18px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)) 190px;
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

  .page-card {
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
    margin-top: 0;
    font-size: 14px;
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

  .evidence-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .evidence-grid.compact {
    grid-template-columns: 1fr;
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

  .audit-history-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .history-layout {
    display: grid;
    grid-template-columns: 430px 1fr;
    gap: 16px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 650px;
    overflow: auto;
    padding-right: 4px;
  }

  .history-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
    transition: 0.16s ease;
  }

  .history-row:hover {
    border-color: #99f6e4;
    background: #f0fdfa;
  }

  .history-row.active {
    border-color: #10b981;
    background: #ecfdf5;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
  }

  .history-row-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .history-id {
    font-weight: 900;
    color: #0f172a;
    word-break: break-word;
  }

  .history-meta {
    margin-top: 5px;
    color: #64748b;
    font-size: 12px;
  }

  .history-meta strong {
    color: #0f172a;
  }

  .history-counts {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mini-count {
    border-radius: 999px;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 900;
  }

  .mini-count.success {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .mini-count.warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .mini-count.danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .history-detail {
    min-height: 420px;
  }

  .audit-detail-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .audit-detail-title {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    font-weight: 900;
    color: #0f172a;
  }

  .audit-checks-mini {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .empty-state {
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 14px;
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

  .primary-btn:disabled,
  .ghost-btn:disabled {
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

  @media (max-width: 1400px) {
    .kpi-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .toolbar-card {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1200px) {
    .hero-card,
    .layout-grid,
    .server-verdict-card,
    .history-layout,
    .kpi-dashboard-header,
    .problem-grid {
      grid-template-columns: 1fr;
    }

    .evidence-grid,
    .verdict-metrics {
      grid-template-columns: 1fr;
    }

    .history-header {
      flex-direction: column;
    }
  }

  @media (max-width: 760px) {
    .toolbar-card,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;