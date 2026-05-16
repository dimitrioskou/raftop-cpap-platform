import React, { useEffect, useMemo, useState } from 'react';
import {
  getPatientMessages,
  markPatientMessageRead,
  replyPatientMessageTo
} from './helpers/patientApi';

const FALLBACK_DATA = {
  summary: {
    total: 2,
    unreadCount: 1
  },
  items: [
    {
      id: 'msg-1',
      subject: 'Welcome to RAFTOP CPAP CARE',
      body: 'Η ομάδα είναι διαθέσιμη για υποστήριξη θεραπείας και follow-up όταν το χρειαστείς.',
      sender: 'RAFTOP Care Team',
      status: 'sent',
      read: false,
      createdAt: new Date().toISOString(),
      replyToId: null
    }
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

export default function PatientMessagesPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  async function loadMessages(keepSelection = true) {
    setLoading(true);

    try {
      const payload = await getPatientMessages();
      const nextData = payload || FALLBACK_DATA;
      setData(nextData);
      setFallbackMode(false);

      if (!keepSelection || !selectedId) {
        setSelectedId(nextData.items?.[0]?.id || '');
      }
    } catch (_error) {
      setData(FALLBACK_DATA);
      setFallbackMode(true);

      if (!keepSelection || !selectedId) {
        setSelectedId(FALLBACK_DATA.items?.[0]?.id || '');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages(false);
  }, []);

  const selectedMessage = useMemo(() => {
    return (data.items || []).find((item) => item.id === selectedId) || data.items?.[0] || null;
  }, [data.items, selectedId]);

  useEffect(() => {
    if (selectedMessage) {
      setReplySubject(`Re: ${selectedMessage.subject || 'Message'}`);
    }
  }, [selectedMessage?.id]);

  async function handleMarkRead() {
    if (!selectedMessage) return;

    setBusyAction('read');
    setMessage('');

    try {
      await markPatientMessageRead(selectedMessage.id);
      setMessage('Το message σημειώθηκε ως read.');
      await loadMessages(true);
    } catch (error) {
      setMessage(error.message || 'Αποτυχία ενημέρωσης message.');
    } finally {
      setBusyAction('');
    }
  }

  async function handleReply() {
    if (!selectedMessage) return;

    setBusyAction('reply');
    setMessage('');

    try {
      await replyPatientMessageTo(selectedMessage.id, {
        subject: replySubject,
        body: replyBody
      });

      setMessage('Η απάντηση στάλθηκε.');
      setReplyBody('');
      await loadMessages(true);
    } catch (error) {
      setMessage(error.message || 'Αποτυχία αποστολής reply.');
    } finally {
      setBusyAction('');
    }
  }

  if (loading) {
    return (
      <div className="patient-messages-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="patient-messages-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">MESSAGES</div>
          <h1>Care Team Messages</h1>
          <p>
            Ενημερώσεις και επικοινωνίες που σχετίζονται με τη θεραπεία και το follow-up σου.
          </p>
        </div>

        <div className="summary-box">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Unread <strong>{data.summary?.unreadCount ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Messages σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="messages-grid">
        <div className="page-card left-col">
          <div className="section-title">Inbox</div>

          <div className="message-list">
            {(data.items || []).length ? (
              data.items.map((item) => (
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
                  <div className="message-sender">{item.sender}</div>
                  <div className="message-date">{formatDateTime(item.createdAt)}</div>
                </button>
              ))
            ) : (
              <div className="empty-text">Δεν υπάρχουν messages.</div>
            )}
          </div>
        </div>

        <div className="page-card right-col">
          <div className="section-title">Message Detail</div>

          {selectedMessage ? (
            <div className="message-detail">
              <div className="detail-subject">{selectedMessage.subject}</div>
              <div className="detail-meta">
                From: <strong>{selectedMessage.sender}</strong> • {formatDateTime(selectedMessage.createdAt)}
              </div>
              <div className="detail-status">{selectedMessage.status || 'sent'}</div>
              <div className="detail-body">{selectedMessage.body || '—'}</div>

              <div className="detail-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={selectedMessage.read || Boolean(busyAction)}
                  onClick={handleMarkRead}
                >
                  {busyAction === 'read' ? 'Working...' : 'Mark as Read'}
                </button>
              </div>

              <div className="reply-box">
                <div className="reply-title">Reply</div>

                <input
                  className="input"
                  value={replySubject}
                  onChange={(event) => setReplySubject(event.target.value)}
                  placeholder="Reply subject"
                />

                <textarea
                  className="textarea"
                  rows="6"
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Write your reply..."
                />

                <button
                  type="button"
                  className="primary-btn"
                  disabled={!replyBody.trim() || Boolean(busyAction)}
                  onClick={handleReply}
                >
                  {busyAction === 'reply' ? 'Sending...' : 'Send Reply'}
                </button>
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
  .patient-messages-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px;
  }

  .hero-card, .page-card {
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

  .messages-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
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

  .message-sender,
  .message-date,
  .detail-meta,
  .detail-status {
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

  .detail-actions {
    margin-top: 14px;
  }

  .reply-box {
    margin-top: 18px;
    padding: 16px;
    border-radius: 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .reply-title {
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

  @media (max-width: 980px) {
    .hero-card,
    .messages-grid {
      grid-template-columns: 1fr;
    }
  }
`;