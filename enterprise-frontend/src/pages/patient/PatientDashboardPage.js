import React, { useEffect, useMemo, useState } from 'react';
import {
  getPatientDashboard,
  submitPatientCallback,
  submitPatientIssue,
  submitTherapyAcknowledgement
} from './helpers/patientApi';

const FALLBACK_DATA = {
  patient: {
    fullName: 'Patient User',
    email: 'patient@raftop.local',
    machineModel: 'CPAP Device',
    maskType: 'Standard mask'
  },
  metrics: {
    myAirScore: 74,
    avgUsageHours: 5.6,
    adherenceRate: 82,
    ahi: 3.8,
    leakRate: 18,
    streakDays: 9,
    therapyStatus: 'on_track',
    nextGoal: 'Συνέχισε σταθερή χρήση >4 ώρες/νύχτα.',
    lastSyncAt: new Date().toISOString()
  },
  signalsSummary: {
    total: 2,
    openCount: 1,
    callbackCount: 1,
    issueCount: 0,
    unresolvedHighPriorityCount: 0
  },
  recentSignals: [],
  actions: [
    {
      key: 'request_callback',
      title: 'Request callback',
      description: 'Ζήτησε επικοινωνία από την ομάδα υποστήριξης.'
    },
    {
      key: 'report_issue',
      title: 'Report issue',
      description: 'Δήλωσε πρόβλημα θεραπείας ή μάσκας.'
    },
    {
      key: 'acknowledge_therapy',
      title: 'Acknowledge therapy',
      description: 'Επιβεβαίωσε ότι συνεχίζεις συστηματικά τη θεραπεία.'
    }
  ]
};

function metricTone(status) {
  if (status === 'critical') return 'danger';
  if (status === 'at_risk') return 'warning';
  return 'success';
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

function severityBadge(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'high') return 'badge badge-danger';
  if (normalized === 'medium') return 'badge badge-warning';
  return 'badge badge-neutral';
}

export default function PatientDashboardPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackWindow, setCallbackWindow] = useState('');
  const [callbackNote, setCallbackNote] = useState('');
  const [issueType, setIssueType] = useState('mask_discomfort');
  const [issueSeverity, setIssueSeverity] = useState('medium');
  const [issueNote, setIssueNote] = useState('');
  const [ackNote, setAckNote] = useState('');

  async function loadDashboard() {
    setLoading(true);

    try {
      const payload = await getPatientDashboard();
      setData(payload || FALLBACK_DATA);
      setFallbackMode(false);
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCallbackSubmit() {
    setBusyAction('callback');
    setMessage('');

    try {
      await submitPatientCallback({
        phone: callbackPhone,
        preferredWindow: callbackWindow,
        note: callbackNote
      });

      setMessage('Το αίτημα callback καταχωρήθηκε.');
      setCallbackPhone('');
      setCallbackWindow('');
      setCallbackNote('');
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || 'Η αποστολή callback απέτυχε.');
    } finally {
      setBusyAction('');
    }
  }

  async function handleIssueSubmit() {
    setBusyAction('issue');
    setMessage('');

    try {
      await submitPatientIssue({
        issueType,
        severity: issueSeverity,
        note: issueNote
      });

      setMessage('Το πρόβλημα στάλθηκε στην ομάδα υποστήριξης.');
      setIssueNote('');
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || 'Η αναφορά προβλήματος απέτυχε.');
    } finally {
      setBusyAction('');
    }
  }

  async function handleAckSubmit() {
    setBusyAction('ack');
    setMessage('');

    try {
      await submitTherapyAcknowledgement({
        note: ackNote
      });

      setMessage('Η επιβεβαίωση θεραπείας καταχωρήθηκε.');
      setAckNote('');
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || 'Η επιβεβαίωση θεραπείας απέτυχε.');
    } finally {
      setBusyAction('');
    }
  }

  const statusClass = useMemo(
    () => `metric-card ${metricTone(data?.metrics?.therapyStatus)}`,
    [data?.metrics?.therapyStatus]
  );

  if (loading) {
    return (
      <div className="patient-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient dashboard...</div>
      </div>
    );
  }

  return (
    <div className="patient-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PATIENT DASHBOARD</div>
          <h1>{data.patient?.fullName || 'Patient Dashboard'}</h1>
          <p>
            Παρακολούθηση θεραπείας, γρήγορες ενέργειες και άμεση σύνδεση με την ομάδα φροντίδας.
          </p>

          <div className="hero-meta">
            <span className="pill">{data.patient?.machineModel || 'CPAP Device'}</span>
            <span className="pill">{data.patient?.maskType || 'Mask'}</span>
            <span className="pill">Last sync: {formatDateTime(data.metrics?.lastSyncAt)}</span>
          </div>
        </div>

        <div className="score-card">
          <div className="score-label">Therapy Score</div>
          <div className="score-value">{data.metrics?.myAirScore ?? 0}</div>
          <div className="score-subtitle">Patient-side equivalent layer</div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Fallback mode ενεργό. Τα patient endpoints δεν απάντησαν και εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="metrics-grid">
        <div className={statusClass}>
          <div className="metric-label">Therapy Status</div>
          <div className="metric-value">{data.metrics?.therapyStatus || 'on_track'}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Avg Usage</div>
          <div className="metric-value">{data.metrics?.avgUsageHours ?? 0}h</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Adherence</div>
          <div className="metric-value">{data.metrics?.adherenceRate ?? 0}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">AHI</div>
          <div className="metric-value">{data.metrics?.ahi ?? 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Leak Rate</div>
          <div className="metric-value">{data.metrics?.leakRate ?? 0}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Streak</div>
          <div className="metric-value">{data.metrics?.streakDays ?? 0} days</div>
        </div>
      </section>

      <section className="two-col">
        <div className="page-card">
          <div className="section-title">Next Goal</div>
          <p className="section-text">{data.metrics?.nextGoal || '—'}</p>

          <div className="signals-summary">
            <div className="summary-pill">
              Total Signals
              <strong>{data.signalsSummary?.total ?? 0}</strong>
            </div>
            <div className="summary-pill">
              Open
              <strong>{data.signalsSummary?.openCount ?? 0}</strong>
            </div>
            <div className="summary-pill">
              Callbacks
              <strong>{data.signalsSummary?.callbackCount ?? 0}</strong>
            </div>
            <div className="summary-pill">
              Issues
              <strong>{data.signalsSummary?.issueCount ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="page-card">
          <div className="section-title">Recent Signals</div>

          <div className="signal-list">
            {(data.recentSignals || []).length ? (
              data.recentSignals.map((signal) => (
                <div key={signal.id} className="signal-item">
                  <div className="signal-top">
                    <strong>{signal.title}</strong>
                    <span className="badge badge-neutral">{signal.status}</span>
                  </div>
                  <div className="signal-text">{signal.description || '—'}</div>
                  <div className="signal-meta">
                    {signal.kindLabel || signal.kind} • {formatDateTime(signal.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-text">Δεν υπάρχουν πρόσφατα patient signals.</div>
            )}
          </div>
        </div>
      </section>

      <section className="actions-grid">
        <div className="page-card action-card">
          <div className="section-title">Request Callback</div>

          <input
            className="input"
            value={callbackPhone}
            onChange={(event) => setCallbackPhone(event.target.value)}
            placeholder="Phone"
          />
          <input
            className="input"
            value={callbackWindow}
            onChange={(event) => setCallbackWindow(event.target.value)}
            placeholder="Preferred window"
          />
          <textarea
            className="textarea"
            rows="4"
            value={callbackNote}
            onChange={(event) => setCallbackNote(event.target.value)}
            placeholder="Extra note"
          />

          <button
            type="button"
            className="primary-btn"
            disabled={busyAction === 'callback'}
            onClick={handleCallbackSubmit}
          >
            {busyAction === 'callback' ? 'Submitting...' : 'Submit Callback'}
          </button>
        </div>

        <div className="page-card action-card">
          <div className="section-title">Report Issue</div>

          <select
            className="input"
            value={issueType}
            onChange={(event) => setIssueType(event.target.value)}
          >
            <option value="mask_discomfort">Mask discomfort</option>
            <option value="high_leak">High leak</option>
            <option value="dryness">Dryness / irritation</option>
            <option value="machine_problem">Machine problem</option>
            <option value="other">Other</option>
          </select>

          <select
            className="input"
            value={issueSeverity}
            onChange={(event) => setIssueSeverity(event.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <div className={severityBadge(issueSeverity)}>{issueSeverity}</div>

          <textarea
            className="textarea"
            rows="4"
            value={issueNote}
            onChange={(event) => setIssueNote(event.target.value)}
            placeholder="Describe the issue"
          />

          <button
            type="button"
            className="warn-btn"
            disabled={busyAction === 'issue'}
            onClick={handleIssueSubmit}
          >
            {busyAction === 'issue' ? 'Submitting...' : 'Report Issue'}
          </button>
        </div>

        <div className="page-card action-card">
          <div className="section-title">Acknowledge Therapy</div>

          <textarea
            className="textarea"
            rows="6"
            value={ackNote}
            onChange={(event) => setAckNote(event.target.value)}
            placeholder="Π.χ. συνεχίζω κανονικά τη θεραπεία και θα διατηρήσω καθημερινή χρήση."
          />

          <button
            type="button"
            className="success-btn"
            disabled={busyAction === 'ack'}
            onClick={handleAckSubmit}
          >
            {busyAction === 'ack' ? 'Submitting...' : 'Acknowledge Therapy'}
          </button>
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .metric-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 320px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,242,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4f46e5;
    margin-bottom: 8px;
  }

  .hero-card h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
  }

  .hero-card p,
  .section-text {
    color: #475569;
    line-height: 1.7;
  }

  .hero-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4338ca;
    font-size: 12px;
    font-weight: 700;
  }

  .score-card {
    border-radius: 24px;
    padding: 22px;
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    color: #fff;
    box-shadow: 0 18px 34px rgba(79,70,229,0.24);
  }

  .score-label {
    font-size: 13px;
    font-weight: 800;
    opacity: 0.9;
  }

  .score-value {
    font-size: 64px;
    font-weight: 900;
    line-height: 1;
    margin-top: 10px;
  }

  .score-subtitle {
    margin-top: 10px;
    font-size: 13px;
    opacity: 0.9;
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

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 14px;
  }

  .metric-card {
    padding: 18px;
  }

  .metric-card.success {
    border: 1px solid #86efac;
    background: #ecfdf5;
  }

  .metric-card.warning {
    border: 1px solid #fdba74;
    background: #fff7ed;
  }

  .metric-card.danger {
    border: 1px solid #fecaca;
    background: #fef2f2;
  }

  .metric-label {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-value {
    margin-top: 10px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .page-card {
    padding: 20px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .signals-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 14px;
  }

  .summary-pill {
    padding: 12px 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
  }

  .summary-pill strong {
    color: #0f172a;
  }

  .signal-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .signal-item {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .signal-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .signal-text {
    margin-top: 8px;
    color: #475569;
    line-height: 1.6;
  }

  .signal-meta {
    margin-top: 8px;
    font-size: 12px;
    color: #64748b;
  }

  .empty-text {
    color: #64748b;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .input,
  .textarea {
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
    resize: vertical;
  }

  .primary-btn,
  .warn-btn,
  .success-btn {
    border: 0;
    border-radius: 14px;
    padding: 12px 14px;
    font-weight: 800;
    cursor: pointer;
    color: white;
  }

  .primary-btn {
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
  }

  .warn-btn {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }

  .success-btn {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    width: fit-content;
    text-transform: uppercase;
  }

  .badge-danger {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge-warning {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .badge-neutral {
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
  }

  @media (max-width: 1280px) {
    .metrics-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .hero-card,
    .two-col {
      grid-template-columns: 1fr;
    }

    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .metrics-grid,
    .signals-summary {
      grid-template-columns: 1fr;
    }
  }
`;