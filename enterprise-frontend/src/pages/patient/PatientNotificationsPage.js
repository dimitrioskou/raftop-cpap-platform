import React, { useEffect, useState } from 'react';
import {
  archivePatientNotification,
  getPatientNotifications,
  markPatientNotificationRead
} from './helpers/patientApi';

const FALLBACK_DATA = {
  summary: {
    total: 2,
    unreadCount: 2,
    activeCount: 2
  },
  items: [
    {
      id: 'notif-1',
      title: 'Therapy attention needed',
      body: 'Η χρήση θεραπείας είναι χαμηλή και χρειάζεται ενίσχυση.',
      type: 'therapy',
      status: 'active',
      read: false,
      createdAt: new Date().toISOString()
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

function typeClass(type) {
  const value = String(type || '').toLowerCase();

  if (value.includes('therapy')) return 'therapy';
  if (value.includes('mask')) return 'mask';
  if (value.includes('signal')) return 'signal';

  return 'system';
}

export default function PatientNotificationsPage() {
  const [data, setData] = useState(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadNotifications() {
    setLoading(true);

    try {
      const payload = await getPatientNotifications();
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
    loadNotifications();
  }, []);

  async function handleRead(notificationId) {
    setBusyId(`read-${notificationId}`);
    setMessage('');

    try {
      await markPatientNotificationRead(notificationId);
      setMessage('Η ειδοποίηση σημειώθηκε ως read.');
      await loadNotifications();
    } catch (error) {
      setMessage(error.message || 'Αποτυχία ενημέρωσης notification.');
    } finally {
      setBusyId('');
    }
  }

  async function handleArchive(notificationId) {
    setBusyId(`archive-${notificationId}`);
    setMessage('');

    try {
      await archivePatientNotification(notificationId);
      setMessage('Η ειδοποίηση αρχειοθετήθηκε.');
      await loadNotifications();
    } catch (error) {
      setMessage(error.message || 'Αποτυχία αρχειοθέτησης notification.');
    } finally {
      setBusyId('');
    }
  }

  const visibleItems = (data.items || []).filter((item) => item.status !== 'archived');

  if (loading) {
    return (
      <div className="patient-notifications-page">
        <style>{pageStyles}</style>
        <div className="page-card">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="patient-notifications-page">
      <style>{pageStyles}</style>

      <section className="hero-card">
        <div>
          <div className="eyebrow">NOTIFICATIONS</div>
          <h1>Patient Notifications</h1>
          <p>
            Ειδοποιήσεις θεραπείας, system updates και activity από το patient workflow.
          </p>
        </div>

        <div className="summary-grid">
          <div className="summary-pill">Total <strong>{data.summary?.total ?? 0}</strong></div>
          <div className="summary-pill">Unread <strong>{data.summary?.unreadCount ?? 0}</strong></div>
          <div className="summary-pill">Active <strong>{data.summary?.activeCount ?? 0}</strong></div>
        </div>
      </section>

      {fallbackMode ? (
        <div className="banner warning">
          Notifications σε fallback mode. Εμφανίζονται demo δεδομένα.
        </div>
      ) : null}

      {message ? <div className="banner info">{message}</div> : null}

      <section className="list">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <div key={item.id} className={`page-card notif-card ${item.read ? 'read' : 'unread'}`}>
              <div className="notif-top">
                <div>
                  <div className="notif-title">{item.title}</div>
                  <div className="notif-meta">{formatDateTime(item.createdAt)}</div>
                </div>

                <div className="notif-badges">
                  <span className={`type-badge ${typeClass(item.type)}`}>{item.type || 'system'}</span>
                  <span className={`read-badge ${item.read ? 'read' : 'unread'}`}>
                    {item.read ? 'read' : 'unread'}
                  </span>
                </div>
              </div>

              <div className="notif-body">{item.body || '—'}</div>

              <div className="notif-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={item.read || Boolean(busyId)}
                  onClick={() => handleRead(item.id)}
                >
                  {busyId === `read-${item.id}` ? 'Working...' : 'Mark as Read'}
                </button>

                <button
                  type="button"
                  className="warn-btn"
                  disabled={Boolean(busyId)}
                  onClick={() => handleArchive(item.id)}
                >
                  {busyId === `archive-${item.id}` ? 'Working...' : 'Archive'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="page-card empty-card">Δεν υπάρχουν notifications.</div>
        )}
      </section>
    </div>
  );
}

const pageStyles = `
  .patient-notifications-page {
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
    grid-template-columns: 1.4fr 360px;
    gap: 18px;
    background:
      radial-gradient(circle at top right, rgba(8,145,178,0.10), transparent 28%),
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
    grid-template-columns: 1fr;
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

  .list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .page-card {
    padding: 18px;
  }

  .notif-card.unread {
    border-color: #bfdbfe;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.08), 0 14px 40px rgba(15,23,42,0.08);
  }

  .notif-top {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
  }

  .notif-title {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .notif-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .notif-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-badge, .read-badge {
    padding: 8px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .type-badge.therapy {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #86efac;
  }

  .type-badge.mask {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .type-badge.signal {
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
  }

  .type-badge.system {
    background: #f8fafc;
    color: #334155;
    border: 1px solid #cbd5e1;
  }

  .read-badge.unread {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .read-badge.read {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .notif-body {
    margin-top: 14px;
    color: #334155;
    line-height: 1.7;
  }

  .notif-actions {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ghost-btn, .warn-btn {
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

  .warn-btn {
    border: 1px solid #fdba74;
    background: #fff7ed;
    color: #c2410c;
  }

  .empty-card {
    color: #64748b;
  }

  @media (max-width: 980px) {
    .hero-card {
      grid-template-columns: 1fr;
    }
  }
`;