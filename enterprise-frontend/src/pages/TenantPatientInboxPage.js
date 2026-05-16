import React, { useEffect, useMemo, useState } from 'react';

const FALLBACK_DATA = {
  summary: {
    total: 3,
    unreadCount: 2
  },
  items: [
    {
      id: 'msg-1',
      subject: 'Welcome to RAFTOP CPAP CARE',
      body: 'Η ομάδα είναι διαθέσιμη για υποστήριξη θεραπείας και follow-up όταν το χρειαστείς.',
      status: 'sent',
      read: false,
      createdAt: new Date().toISOString(),
      senderName: 'RAFTOP Care Team',
      senderEmail: 'provider@raftop.local',
      recipientEmail: 'patient1@raftop.local',
      replyToId: null
    },
    {
      id: 'msg-2',
      subject: 'Re: Welcome to RAFTOP CPAP CARE',
      body: 'Ευχαριστώ, θα συνεχίσω τη θεραπεία.',
      status: 'sent',
      read: true,
      createdAt: new Date().toISOString(),
      senderName: 'Patient User',
      senderEmail: 'patient1@raftop.local',
      recipientEmail: 'provider@raftop.local',
      replyToId: 'msg-1'
    },
    {
      id: 'msg-3',
      subject: 'Mask leak follow-up',
      body: 'Παρακαλώ επιβεβαιώστε αν συνεχίζεται η διαρροή μάσκας.',
      status: 'sent',
      read: false,
      createdAt: new Date().toISOString(),
      senderName: 'RAFTOP Care Team',
      senderEmail: 'provider@raftop.local',
      recipientEmail: 'patient2@raftop.local',
      replyToId: null
    }
  ]
};

function readToken() {
  try {
    return localStorage.getItem('raftop_auth_token') || '';
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

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function derivePatientEmail(item) {
  const sender = String(item?.senderEmail || '').toLowerCase();
  const recipient = String(item?.recipientEmail || '').toLowerCase();

  if (sender && !sender.includes('provider@') && !sender.includes('raftop')) {
    return sender;
  }

  if (recipient && !recipient.includes('provider@') && !recipient.includes('raftop')) {
    return recipient;
  }

  return recipient || sender || 'unknown@patient.local';
}

export default function TenantPatientInboxPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [patientFilter, setPatientFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [composePatientEmail, setComposePatientEmail] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  async function loadInbox(targetPatientEmail = '') {
    setLoading(true);

    try {
      const token = readToken();
      const qs = targetPatientEmail
        ? `?patientEmail=${encodeURIComponent(targetPatientEmail)}`
        : '';

      const response = await fetch(`/api/tenant/patient-messages${qs}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || 'Failed to load patient inbox');
      }

      const nextData = payload?.data || FALLBACK_DATA;
      setData(nextData);
      setFallbackMode(false);

      if (!selectedId && nextData.items?.[0]?.id) {
        setSelectedId(nextData.items[0].id);
      }
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);

      if (!selectedId && FALLBACK_DATA.items?.[0]?.id) {
        setSelectedId(FALLBACK_DATA.items[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox(patientFilter);
  }, [patientFilter]);

  const patientOptions = useMemo(() => {
    const set = new Set(
      (data.items || []).map((item) => derivePatientEmail(item)).filter(Boolean)
    );

    return [...set].sort();
  }, [data.items]);

  const filteredItems = useMemo(() => {
    let items = [...(data.items || [])];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.subject,
          item.body,
          item.senderName,
          item.senderEmail,
          item.recipientEmail,
          derivePatientEmail(item)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return items;
  }, [data.items, searchTerm]);

  const selectedMessage = useMemo(() => {
    return filteredItems.find((item) => item.id === selectedId) || filteredItems[0] || null;
  }, [filteredItems, selectedId]);

  useEffect(() => {
    if (selectedMessage) {
      setComposePatientEmail(derivePatientEmail(selectedMessage));
      setComposeSubject(`Re: ${selectedMessage.subject || 'Message'}`);
    }
  }, [selectedMessage?.id]);

  async function handleSendMessage({ replyToId = null } = {}) {
    setBusyAction('send');
    setMessage('');

    try {
      const token = readToken();

      const response = await fetch('/api/tenant/patient-messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          patientEmail: composePatientEmail,
          subject: composeSubject,
          body: composeBody,
          replyToId
        })
      });

      const payload = await readJsonSafely(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.message || 'Failed to send provider message');
      }

      setMessage('Το μήνυμα στάλθηκε.');
      setComposeBody('');
      await loadInbox(patientFilter);
    } catch (error) {
      setMessage(error?.message || 'Failed to send provider message');
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <div className="tenant-patient-inbox-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading patient inbox...</div>
      </div>
    );
  }

  return (
    <div className="tenant-patient-inbox-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">PATIENT INBOX</div>
          <h1>Provider ↔ Patient Messaging</h1>
          <p>
            Κεντρικό inbox για provider-to-patient επικοινωνία μέσα στο ίδιο RAFTOP οικοσύστημα.
          </p>
        </div>

        <div className="summary-box">
          <div className="summary-pill">
            Total
            <strong>{data.summary?.total ?? 0}</strong>
          </div>
          <div className="summary-pill">
            Unread
            <strong>{data.summary?.unreadCount ?? 0}</strong>
          </div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Patient inbox σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="toolbar-card">
        <div className="toolbar-left">
          <select
            className="input"
            value={patientFilter}
            onChange={(event) => setPatientFilter(event.target.value)}
          >
            <option value="">All patients</option>
            {patientOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>

          <input
            className="input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search subject, body, patient..."
          />
        </div>

        <div className="toolbar-right">
          <button type="button" className="ghost-btn" onClick={() => loadInbox(patientFilter)}>
            Refresh
          </button>
        </div>
      </section>

      <section className="inbox-grid">
        <div className="page-card left-col">
          <div className="section-title">Threads / Messages</div>

          <div className="message-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`message-row ${selectedMessage?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="message-row-top">
                    <span className="message-subject">{item.subject}</span>
                    {!item.read ? <span className="dot" /> : null}
                  </div>

                  <div className="message-patient">{derivePatientEmail(item)}</div>
                  <div className="message-meta">
                    {item.senderName || 'Unknown sender'} • {formatDateTime(item.createdAt)}
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-text">Δεν υπάρχουν messages για αυτό το φίλτρο.</div>
            )}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Conversation Detail</div>

          {selectedMessage ? (
            <div className="detail-wrap">
              <div className="detail-subject">{selectedMessage.subject}</div>

              <div className="detail-meta">
                Patient: <strong>{derivePatientEmail(selectedMessage)}</strong>
              </div>

              <div className="detail-meta">
                Sender: <strong>{selectedMessage.senderName || 'Unknown sender'}</strong> •{' '}
                {selectedMessage.senderEmail || '—'}
              </div>

              <div className="detail-meta">
                Date: {formatDateTime(selectedMessage.createdAt)}
              </div>

              <div className="detail-body">{selectedMessage.body || '—'}</div>

              <div className="compose-box">
                <div className="compose-title">Reply / New Provider Message</div>

                <input
                  className="input"
                  value={composePatientEmail}
                  onChange={(event) => setComposePatientEmail(event.target.value)}
                  placeholder="Patient email"
                />

                <input
                  className="input"
                  value={composeSubject}
                  onChange={(event) => setComposeSubject(event.target.value)}
                  placeholder="Subject"
                />

                <textarea
                  className="textarea"
                  rows="7"
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  placeholder="Write provider message..."
                />

                <div className="compose-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    disabled={!composeBody.trim() || Boolean(busyAction)}
                    onClick={() => handleSendMessage({ replyToId: selectedMessage.id })}
                  >
                    {busyAction === 'send' ? 'Sending...' : 'Reply to Selected'}
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    disabled={!composePatientEmail.trim() || !composeBody.trim() || Boolean(busyAction)}
                    onClick={() => handleSendMessage({ replyToId: null })}
                  >
                    {busyAction === 'send' ? 'Sending...' : 'Send New Message'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-text">Επίλεξε message για προβολή.</div>
          )}
        </div>
      </section>
    </div>
  );
}

const pageStyles = `
  .tenant-patient-inbox-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card,
  .page-card,
  .toolbar-card {
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
      radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.96));
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2563eb;
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

  .summary-box {
    display: grid;
    gap: 12px;
  }

  .summary-pill {
    padding: 14px 16px;
    border-radius: 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
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

  .toolbar-card {
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .inbox-grid {
    display: grid;
    grid-template-columns: 400px 1fr;
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

  .message-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .message-row {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 16px;
    padding: 14px;
    cursor: pointer;
  }

  .message-row.active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
  }

  .message-row-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }

  .message-subject {
    font-weight: 900;
    color: #0f172a;
  }

  .message-patient,
  .message-meta,
  .detail-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #2563eb;
    min-width: 10px;
  }

  .detail-wrap {
    display: flex;
    flex-direction: column;
  }

  .detail-subject {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
  }

  .detail-body {
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .compose-box {
    margin-top: 18px;
    padding: 16px;
    border-radius: 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .compose-title {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
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
    margin-bottom: 10px;
  }

  .textarea {
    resize: vertical;
  }

  .compose-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ghost-btn,
  .primary-btn {
    border-radius: 14px;
    padding: 10px 14px;
    font-weight: 800;
    cursor: pointer;
  }

  .ghost-btn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
  }

  .primary-btn {
    border: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    color: #ffffff;
  }

  .empty-text {
    color: #64748b;
  }

  @media (max-width: 1100px) {
    .hero-card,
    .inbox-grid {
      grid-template-columns: 1fr;
    }
  }
`;