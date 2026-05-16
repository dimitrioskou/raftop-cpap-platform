import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

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
        'Patient orchestrator request failed'
    );
  }

  return payload?.data ?? payload;
}

const FALLBACK_DATA = {
  patient: {
    fullName: 'Patient Demo',
    email: 'patient@raftop.local'
  },
  summary: {
    riskLevel: 'high',
    usageHours: 3.8,
    ahi: 4.9,
    leakRate: 27.1,
    minSpo2: 89.4,
    openSignals: 2,
    unresolvedTasks: 2,
    coachingOpen: 1,
    syncState: 'stale'
  },
  shortcuts: [
    {
      id: 'reload-patient-orchestrator',
      label: 'Reload Patient Workspace',
      href: '/tenant/patient-orchestrator/patient%40raftop.local'
    },
    {
      id: 'open-patient-tasks',
      label: 'Open Patient Tasks',
      href: '/tenant/patient-tasks/patient%40raftop.local'
    },
    {
      id: 'open-signals',
      label: 'Open Patient Signals',
      href: '/tenant/patient-signals'
    },
    {
      id: 'open-coaching',
      label: 'Open Patient Coaching',
      href: '/tenant/patient-coaching'
    },
    {
      id: 'open-report',
      label: 'Open Clinician Report',
      href: '/tenant/reports/patient/patient%40raftop.local'
    },
    {
      id: 'open-import-history',
      label: 'Open Import History',
      href: '/tenant/import-history'
    },
    {
      id: 'open-action-center',
      label: 'Open ATLAS Action Center',
      href: '/tenant/atlas/action-center'
    }
  ],
  report: {
    id: 'report_demo',
    title: 'Clinician Review Report — Patient Demo',
    generatedAt: new Date().toISOString(),
    atlasRecommendation: {
      riskLevel: 'high',
      recommendedNextAction:
        'Provider review and direct patient follow-up are recommended.',
      priorityReason:
        'High-risk signal or unstable therapy/physiology pattern detected.',
      followupWindow: 'within 24h'
    }
  },
  reportHistory: [],
  syncStatus: {
    syncHealth: {
      state: 'stale',
      hoursSinceLastSync: 35
    },
    latestJob: {
      id: 'job-1',
      status: 'failed',
      sourceType: 'csv_import',
      createdAt: new Date().toISOString(),
      errorMessage: 'Malformed CSV header'
    }
  },
  signals: [
    {
      id: 'sig-1',
      title: 'Issue reported: dryness',
      kind: 'issue',
      status: 'priority',
      createdAt: new Date().toISOString()
    },
    {
      id: 'sig-2',
      title: 'Callback requested',
      kind: 'callback',
      status: 'open',
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Follow-up: Issue reported: dryness',
      status: 'escalated',
      priority: 'critical',
      updatedAt: new Date().toISOString(),
      atlasCategory: 'THERAPY_ISSUE_CRITICAL'
    },
    {
      id: 'task-2',
      title: 'Review coaching adherence',
      status: 'pending',
      priority: 'warning',
      updatedAt: new Date().toISOString(),
      atlasCategory: 'COACHING_REVIEW'
    }
  ],
  coaching: [
    {
      id: 'coach-1',
      lessonId: 'first_4_hours_protocol',
      status: 'assigned',
      priority: 'warning',
      triggerReason: 'Usage below therapeutic target',
      updatedAt: new Date().toISOString()
    }
  ],
  timeline: [
    {
      id: 'signal-sig-1',
      type: 'signal',
      title: 'Issue reported: dryness',
      subtitle: 'issue',
      createdAt: new Date().toISOString(),
      tone: 'danger'
    },
    {
      id: 'task-task-1',
      type: 'task',
      title: 'Follow-up: Issue reported: dryness',
      subtitle: 'critical • escalated',
      createdAt: new Date().toISOString(),
      tone: 'danger'
    }
  ]
};

function badgeClass(tone = '') {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'neutral';
}

function toneFromRiskLevel(value = '') {
  const v = String(value || '').toLowerCase();

  if (v === 'high') return 'danger';
  if (v === 'medium' || v === 'stale') return 'warning';
  if (v === 'low' || v === 'healthy' || v === 'synced') return 'success';
  return 'neutral';
}

function priorityTone(value = '') {
  const v = String(value || '').toLowerCase();

  if (v === 'critical') return 'danger';
  if (v === 'warning') return 'warning';
  if (v === 'normal') return 'neutral';
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

function openTenantRoute(path) {
  window.location.href = path;
}

export default function TenantPatientOrchestratorPage() {
  const params = useParams();
  const initialRef = params.patientRef || 'patient@raftop.local';

  const [patientRef, setPatientRef] = useState(initialRef);
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [taskBusy, setTaskBusy] = useState(false);

  const [taskTitle, setTaskTitle] = useState('Manual follow-up');
  const [taskPriority, setTaskPriority] = useState('warning');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [taskCategory, setTaskCategory] = useState('MANUAL_FOLLOWUP');
  const [taskAssignedTo, setTaskAssignedTo] = useState('RAFTOP Team');
  const [taskNotes, setTaskNotes] = useState(
    'Manual task created from Patient Orchestrator.'
  );

  async function loadData(ref = patientRef) {
    setLoading(true);

    try {
      const payload = await apiRequest(
        `/api/tenant/patient-orchestrator/${encodeURIComponent(ref)}`,
        {
          errorLabel: 'Patient orchestrator request failed'
        }
      );

      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
      setFlashMessage('');
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPatientRef(initialRef);
    loadData(initialRef);
  }, [initialRef]);

  const summaryCards = useMemo(() => {
    return [
      { label: 'Usage', value: `${data.summary?.usageHours ?? 0}h` },
      { label: 'AHI', value: data.summary?.ahi ?? 0 },
      { label: 'Leak', value: data.summary?.leakRate ?? 0 },
      { label: 'Min SpO2', value: data.summary?.minSpo2 ?? 0 },
      { label: 'Open Signals', value: data.summary?.openSignals ?? 0 },
      { label: 'Unresolved Tasks', value: data.summary?.unresolvedTasks ?? 0 },
      { label: 'Coaching Open', value: data.summary?.coachingOpen ?? 0 },
      { label: 'Sync State', value: data.summary?.syncState ?? 'unknown' }
    ];
  }, [data.summary]);

  const effectiveShortcuts = useMemo(() => {
    const serverShortcuts = Array.isArray(data.shortcuts)
      ? [...data.shortcuts]
      : [];
    const patientEmail = data.patient?.email || patientRef || 'patient@raftop.local';
    const patientTasksHref = `/tenant/patient-tasks/${encodeURIComponent(patientEmail)}`;

    if (!serverShortcuts.some((item) => item.href === patientTasksHref)) {
      serverShortcuts.push({
        id: 'open-patient-tasks-manual',
        label: 'Open Patient Tasks',
        href: patientTasksHref
      });
    }

    return serverShortcuts;
  }, [data.shortcuts, data.patient?.email, patientRef]);

  async function handleCreateTask(event) {
    event.preventDefault();
    setTaskBusy(true);
    setFlashMessage('');

    try {
      await apiRequest(
        `/api/tenant/patient-orchestrator/${encodeURIComponent(
          data.patient?.email || patientRef
        )}/create-task`,
        {
          method: 'POST',
          body: {
            title: taskTitle,
            priority: taskPriority,
            status: taskStatus,
            atlasCategory: taskCategory,
            assignedTo: taskAssignedTo,
            notes: taskNotes
          },
          errorLabel: 'Create manual patient task failed'
        }
      );

      setFlashMessage('Το manual patient task δημιουργήθηκε επιτυχώς.');
      await loadData(data.patient?.email || patientRef);
    } catch (error) {
      setFlashMessage(error?.message || 'Αποτυχία δημιουργίας manual task');
    } finally {
      setTaskBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="tenant-patient-orchestrator-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient orchestrator...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-orchestrator-page">
      <style>{pageStyles}</style>

      <section className="compact-header">
        <div className="compact-left">
          <div className="compact-title-row">
            <div className="eyebrow">PATIENT 360 WORKSPACE</div>
            <div
              className={`badge ${badgeClass(
                toneFromRiskLevel(data.summary?.riskLevel)
              )}`}
            >
              Risk {data.summary?.riskLevel || 'low'}
            </div>
          </div>

          <div className="compact-patient-name">
            {data.patient?.fullName || 'Patient'}{' '}
            <span>• {data.patient?.email || '—'}</span>
          </div>

          <div className="compact-metrics">
            <span className="metric-chip">
              Usage {data.summary?.usageHours ?? 0}h
            </span>
            <span className="metric-chip">AHI {data.summary?.ahi ?? 0}</span>
            <span className="metric-chip">
              Leak {data.summary?.leakRate ?? 0}
            </span>
            <span className="metric-chip">
              SpO2 {data.summary?.minSpo2 ?? 0}
            </span>
            <span
              className={`metric-chip ${badgeClass(
                toneFromRiskLevel(data.summary?.syncState)
              )}`}
            >
              Sync {data.summary?.syncState || 'unknown'}
            </span>
          </div>
        </div>

        <div className="compact-right">
          <div className="field">
            <label className="field-label">Patient Email or ID</label>
            <input
              className="input"
              value={patientRef}
              onChange={(e) => setPatientRef(e.target.value)}
              placeholder="patient@raftop.local"
            />
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={() => loadData(patientRef)}
          >
            Load Patient
          </button>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Patient orchestrator σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {flashMessage ? <div className="banner info">{flashMessage}</div> : null}

      <section className="sticky-shortcuts page-card">
        <div className="section-title">Quick Actions</div>

        <div className="shortcut-grid">
          {effectiveShortcuts.map((item) => (
            <button
              key={item.id}
              type="button"
              className="shortcut-btn"
              onClick={() => openTenantRoute(item.href)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="summary-card">
            <div className="summary-label">{card.label}</div>
            <div className="summary-value">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">ATLAS Recommendation + Sync</div>

          <div className="detail-row">
            <span className="label">Risk Level</span>
            <span
              className={`badge ${badgeClass(
                toneFromRiskLevel(
                  data.report?.atlasRecommendation?.riskLevel ||
                    data.summary?.riskLevel
                )
              )}`}
            >
              {data.report?.atlasRecommendation?.riskLevel ||
                data.summary?.riskLevel ||
                'low'}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Next Action</span>
            <span>
              {data.report?.atlasRecommendation?.recommendedNextAction || '—'}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Priority Reason</span>
            <span>
              {data.report?.atlasRecommendation?.priorityReason || '—'}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Follow-up Window</span>
            <span>{data.report?.atlasRecommendation?.followupWindow || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Sync State</span>
            <span
              className={`badge ${badgeClass(
                toneFromRiskLevel(
                  data.syncStatus?.syncHealth?.state || data.summary?.syncState
                )
              )}`}
            >
              {data.syncStatus?.syncHealth?.state ||
                data.summary?.syncState ||
                'unknown'}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Hours Since Last Sync</span>
            <span>{data.syncStatus?.syncHealth?.hoursSinceLastSync ?? '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Latest Import Job</span>
            <span>{data.syncStatus?.latestJob?.id || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Import Error</span>
            <span>{data.syncStatus?.latestJob?.errorMessage || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Report Title</span>
            <span>{data.report?.title || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Generated At</span>
            <span>{formatDateTime(data.report?.generatedAt)}</span>
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">One-Click Manual Task</div>

          <form className="form-wrap" onSubmit={handleCreateTask}>
            <div className="field">
              <label className="field-label">Title</label>
              <input
                className="input"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Manual follow-up"
              />
            </div>

            <div className="dual-grid">
              <div className="field">
                <label className="field-label">Priority</label>
                <select
                  className="input"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="normal">normal</option>
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Status</label>
                <select
                  className="input"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="escalated">escalated</option>
                  <option value="done">done</option>
                </select>
              </div>
            </div>

            <div className="dual-grid">
              <div className="field">
                <label className="field-label">Category</label>
                <input
                  className="input"
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  placeholder="MANUAL_FOLLOWUP"
                />
              </div>

              <div className="field">
                <label className="field-label">Assigned To</label>
                <input
                  className="input"
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  placeholder="RAFTOP Team"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Notes</label>
              <textarea
                className="input textarea"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Manual task created from Patient Orchestrator."
              />
            </div>

            <button type="submit" className="primary-btn" disabled={taskBusy}>
              {taskBusy ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      </section>

      <section className="layout-grid">
        <div className="page-card">
          <div className="section-title">Recent Timeline</div>

          <div className="timeline-list">
            {(data.timeline || []).length ? (
              data.timeline.map((item) => (
                <div key={item.id} className="timeline-row">
                  <div className={`timeline-dot ${badgeClass(item.tone)}`} />
                  <div className="timeline-content">
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-meta">
                      {item.type} • {item.subtitle}
                    </div>
                    <div className="timeline-meta">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No recent patient events.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Recent Tasks Snapshot</div>

          <div className="mini-list">
            {(data.tasks || []).length ? (
              data.tasks.map((item) => (
                <div key={item.id} className="mini-card">
                  <div className="mini-card-top">
                    <div className="mini-title">{item.title}</div>
                    <span
                      className={`badge ${badgeClass(
                        priorityTone(item.priority)
                      )}`}
                    >
                      {item.priority || 'normal'}
                    </span>
                  </div>
                  <div className="mini-meta">{item.status || 'unknown'}</div>
                  <div className="mini-meta">
                    {item.meta?.atlasCategory || item.atlasCategory || '—'}
                  </div>
                  <div className="mini-meta">{formatDateTime(item.updatedAt)}</div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No tasks.</div>
            )}
          </div>
        </div>
      </section>

      <section className="triple-grid">
        <div className="page-card">
          <div className="section-title">Signals</div>
          <div className="mini-list">
            {(data.signals || []).length ? (
              data.signals.map((item) => (
                <div key={item.id} className="mini-card">
                  <div className="mini-title">{item.title}</div>
                  <div className="mini-meta">
                    {item.kind || 'signal'} • {item.status || 'unknown'}
                  </div>
                  <div className="mini-meta">
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No signals.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Coaching</div>
          <div className="mini-list">
            {(data.coaching || []).length ? (
              data.coaching.map((item) => (
                <div key={item.id} className="mini-card">
                  <div className="mini-card-top">
                    <div className="mini-title">{item.lessonId}</div>
                    <span
                      className={`badge ${badgeClass(
                        priorityTone(item.priority)
                      )}`}
                    >
                      {item.priority || 'normal'}
                    </span>
                  </div>
                  <div className="mini-meta">{item.status || 'unknown'}</div>
                  <div className="mini-meta">{item.triggerReason || '—'}</div>
                  <div className="mini-meta">
                    {formatDateTime(item.updatedAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No coaching assignments.</div>
            )}
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Report History</div>
          <div className="mini-list">
            {(data.reportHistory || []).length ? (
              data.reportHistory.map((item) => (
                <div key={item.id} className="mini-card">
                  <div className="mini-title">{item.title}</div>
                  <div className="mini-meta">{item.reportType || 'report'}</div>
                  <div className="mini-meta">{item.riskLevel || 'low'}</div>
                  <div className="mini-meta">
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted-inline">No report history.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-orchestrator-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .compact-header,
  .page-card,
  .summary-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .compact-header {
    position: sticky;
    top: 12px;
    z-index: 15;
    padding: 18px 20px;
    display: grid;
    grid-template-columns: 1.4fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,249,255,0.96));
    backdrop-filter: blur(10px);
  }

  .compact-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .compact-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .compact-patient-name {
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .compact-patient-name span {
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
  }

  .compact-metrics {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .metric-chip {
    display: inline-flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    font-size: 12px;
    font-weight: 800;
  }

  .compact-right {
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: center;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0284c7;
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

  .textarea {
    min-height: 120px;
    resize: vertical;
  }

  .primary-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 900;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    color: #fff;
    cursor: pointer;
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

  .sticky-shortcuts {
    position: sticky;
    top: 170px;
    z-index: 10;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
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

  .page-card {
    padding: 20px;
  }

  .shortcut-grid {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .shortcut-btn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
    color: #344054;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .dual-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .triple-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    margin-top: 10px;
  }

  .label {
    color: #475569;
    font-weight: 800;
  }

  .timeline-list,
  .mini-list,
  .form-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .timeline-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .timeline-dot {
    width: 12px;
    min-width: 12px;
    height: 12px;
    border-radius: 999px;
    margin-top: 6px;
  }

  .timeline-dot.success { background: #16a34a; }
  .timeline-dot.warning { background: #ea580c; }
  .timeline-dot.danger { background: #dc2626; }
  .timeline-dot.neutral { background: #94a3b8; }

  .timeline-title,
  .mini-title {
    font-weight: 900;
    color: #0f172a;
  }

  .timeline-meta,
  .mini-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
  }

  .mini-card {
    padding: 12px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .mini-card-top {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: flex-start;
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

  @media (max-width: 1200px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .triple-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .compact-header,
    .layout-grid {
      grid-template-columns: 1fr;
    }

    .sticky-shortcuts {
      position: static;
    }

    .dual-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
`;