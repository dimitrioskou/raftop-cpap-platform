import React, { useEffect, useState } from 'react';
import {
  getPatientActionCenter,
  submitPatientCallback,
  submitPatientIssue,
  submitTherapyAcknowledgement
} from './helpers/patientApi';

const FALLBACK_DATA = {
  summary: {
    total: 1,
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
      description: 'Ζήτησε επικοινωνία από την ομάδα υποστήριξης.',
      recommended: true
    },
    {
      key: 'report_issue',
      title: 'Report issue',
      description: 'Δήλωσε πρόβλημα θεραπείας ή μάσκας.',
      recommended: true
    },
    {
      key: 'acknowledge_therapy',
      title: 'Acknowledge therapy',
      description: 'Επιβεβαίωσε ότι συνεχίζεις συστηματικά τη θεραπεία.',
      recommended: false
    }
  ],
  quickActions: [
    { key: 'request_callback', title: 'Request callback', enabled: true },
    { key: 'report_issue', title: 'Report issue', enabled: true },
    { key: 'acknowledge_therapy', title: 'Acknowledge therapy', enabled: true }
  ],
  hints: [
    'Η χρήση είναι χαμηλή. Ίσως χρειάζεται callback.',
    'Υπάρχει πιθανό θέμα μάσκας. Έλεγξε την εφαρμογή ή δήλωσε issue.'
  ]
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export default function PatientActionCenterPage() {
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

  async function loadActionCenter() {
    setLoading(true);

    try {
      const payload = await getPatientActionCenter();
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
    loadActionCenter();
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

      setMessage('Το callback request καταχωρήθηκε.');
      setCallbackPhone('');
      setCallbackWindow('');
      setCallbackNote('');
      await loadActionCenter();
    } catch (error) {
      setMessage(error.message || 'Το callback request απέτυχε.');
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

      setMessage('Το issue καταχωρήθηκε.');
      setIssueNote('');
      await loadActionCenter();
    } catch (error) {
      setMessage(error.message || 'Η αναφορά issue απέτυχε.');
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
      await loadActionCenter();
    } catch (error) {
      setMessage(error.message || 'Η επιβεβαίωση απέτυχε.');
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <div className="patient-action-center-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading action center...</div>
      </div>
    );
  }

  return (
    <div className="patient-action-center-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">ACTION CENTER</div>
          <h1>Patient Action Center</h1>
          <p>
            Άμεσες ενέργειες για callback, αναφορά προβλήματος και επιβεβαίωση θεραπείας.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Open <strong>{data.summary?.openCount ?? 0}</strong></div>
          <div className="summary-pill">Callbacks <strong>{data.summary?.callbackCount ?? 0}</strong></div>
          <div className="summary-pill">Issues <strong>{data.summary?.issueCount ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Action Center σε fallback mode. Τα demo δεδομένα εμφανίζονται επειδή το backend response δεν ήταν διαθέσιμο.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="hints-card">
        <div className="section-title">Smart Hints</div>
        <div className="hint-list">
          {(data.hints || []).map((hint, index) => (
            <div key={`${hint}-${index}`} className="hint-item">
              {hint}
            </div>
          ))}
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
            placeholder="Γράψε ένα σύντομο note για τη συνέχιση της θεραπείας."
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

      <section className="page-card">
        <div className="section-title">Recent Signals</div>

        <div className="signal-list">
          {(data.recentSignals || []).length ? (
            data.recentSignals.map((signal) => (
              <div key={signal.id} className="signal-item">
                <div className="signal-top">
                  <strong>{signal.title}</strong>
                  <span className="signal-badge">{signal.status}</span>
                </div>
                <div className="signal-desc">{signal.description || '—'}</div>
                <div className="signal-meta">{formatDateTime(signal.createdAt)}</div>
              </div>
            ))
          ) : (
            <div className="empty-text">Δεν υπάρχουν πρόσφατα action signals.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-action-center-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card, .page-card, .hints-card {
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(148,163,184,0.18);
    border-radius: 24px;
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
  }

  .hero-card {
    padding: 24px;
    display: grid;
    grid-template-columns: 1.4fr 360px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(236,254,255,0.96));
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

  .summary-grid {
    display: grid;
    gap: 12px;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    color: #0f766e;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
  }

  .summary-pill strong {
    color: #0f172a;
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

  .hints-card,
  .page-card {
    padding: 20px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 12px;
  }

  .hint-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .hint-item {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.6;
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

  .signal-badge {
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
  }

  .signal-desc {
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

  @media (max-width: 1180px) {
    .actions-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }
  }
`;