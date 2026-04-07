import React, { useEffect, useMemo, useState } from 'react';
import {
  getNotificationQueue,
  markNotificationFailed,
  markNotificationSent
} from '../api/atlas';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function inputStyle() {
  return {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid #dbe2ea',
    background: '#ffffff',
    fontSize: 14,
    boxSizing: 'border-box'
  };
}

function buttonStyle(variant = 'primary', disabled = false) {
  const base = {
    border: 'none',
    borderRadius: 10,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    opacity: disabled ? 0.7 : 1
  };

  if (variant === 'secondary') {
    return { ...base, background: '#e2e8f0', color: '#0f172a' };
  }

  if (variant === 'danger') {
    return { ...base, background: '#ef4444', color: '#ffffff' };
  }

  if (variant === 'success') {
    return { ...base, background: '#16a34a', color: '#ffffff' };
  }

  return { ...base, background: '#2563eb', color: '#ffffff' };
}

function badgeStyle(status) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700
  };

  if (status === 'sent') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'failed') return { ...base, background: '#fee2e2', color: '#991b1b' };
  if (status === 'pending') return { ...base, background: '#fef3c7', color: '#92400e' };

  return { ...base, background: '#e2e8f0', color: '#475569' };
}

function normalizeNotification(row = {}) {
  return {
    id: row.id,
    patient_name: row.patient_name || 'Unknown Patient',
    channel: row.channel || 'sms',
    recipient: row.recipient || '-',
    message: row.message || '',
    status: row.status || 'pending',
    created_at: row.created_at || ''
  };
}

export default function TenantNotificationQueuePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  async function loadRows() {
    try {
      setLoading(true);
      setError('');
      const result = await getNotificationQueue();
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setRows(list.map(normalizeNotification));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load notification queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function handleMarkSent(id) {
    try {
      setWorkingId(id);
      setError('');
      await markNotificationSent(id);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to mark notification as sent');
    } finally {
      setWorkingId(null);
    }
  }

  async function handleMarkFailed(id) {
    try {
      setWorkingId(id);
      setError('');
      await markNotificationFailed(id);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to mark notification as failed');
    } finally {
      setWorkingId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !q ||
        [row.patient_name, row.channel, row.recipient, row.message, row.status]
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      sent: rows.filter((r) => r.status === 'sent').length,
      failed: rows.filter((r) => r.status === 'failed').length
    };
  }, [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Notification Queue</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Review outbound messages, SMS/email queue status, and delivery outcomes.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16
        }}
      >
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Total</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Pending</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.pending}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Sent</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.sent}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Failed</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.failed}</div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 14
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ ...cardStyle(), padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18 }}>Outbound Queue</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              style={{ ...inputStyle(), minWidth: 220 }}
              placeholder="Search notifications"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              style={{ ...inputStyle(), minWidth: 140 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">all</option>
              <option value="pending">pending</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading notifications...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: 20, color: '#64748b' }}>No notifications found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1150 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 14 }}>Patient</th>
                  <th style={{ padding: 14 }}>Channel</th>
                  <th style={{ padding: 14 }}>Recipient</th>
                  <th style={{ padding: 14 }}>Message</th>
                  <th style={{ padding: 14 }}>Status</th>
                  <th style={{ padding: 14 }}>Created</th>
                  <th style={{ padding: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>{row.patient_name}</td>
                    <td style={{ padding: 14 }}>{row.channel}</td>
                    <td style={{ padding: 14 }}>{row.recipient}</td>
                    <td style={{ padding: 14, maxWidth: 320 }}>{row.message}</td>
                    <td style={{ padding: 14 }}>
                      <span style={badgeStyle(row.status)}>{row.status}</span>
                    </td>
                    <td style={{ padding: 14 }}>{row.created_at || '-'}</td>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          style={buttonStyle('success', workingId === row.id)}
                          disabled={workingId === row.id}
                          onClick={() => handleMarkSent(row.id)}
                        >
                          {workingId === row.id ? 'Working...' : 'Mark Sent'}
                        </button>

                        <button
                          type="button"
                          style={buttonStyle('danger', workingId === row.id)}
                          disabled={workingId === row.id}
                          onClick={() => handleMarkFailed(row.id)}
                        >
                          {workingId === row.id ? 'Working...' : 'Mark Failed'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}