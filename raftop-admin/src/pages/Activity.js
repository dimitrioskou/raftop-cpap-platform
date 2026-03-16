import React, { useEffect, useMemo, useState } from 'react';
import { getActivityLogs } from '../api/activity';

const pageStyle = {
  padding: 24
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
};

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 600,
  cursor: 'pointer'
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function getType(item) {
  return item?.type || item?.event_type || item?.action || 'activity';
}

function getTitle(item) {
  return (
    item?.title ||
    item?.message ||
    item?.description ||
    item?.event ||
    'Activity event'
  );
}

function getUser(item) {
  return item?.user || item?.actor || item?.created_by || 'system';
}

function badgeStyle(type) {
  const t = String(type || '').toLowerCase();

  if (t.includes('error') || t.includes('failed')) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (t.includes('follow') || t.includes('task')) {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (t.includes('device')) {
    return {
      background: '#ede9fe',
      color: '#6d28d9',
      border: '1px solid #c4b5fd'
    };
  }

  return {
    background: '#ecfdf5',
    color: '#166534',
    border: '1px solid #86efac'
  };
}

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      setError('');
      const data = await getActivityLogs();
      setLogs(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setLogs([]);
      setError('Αποτυχία φόρτωσης activity logs.');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return logs.filter((item) => {
      if (!q) return true;

      return (
        String(getTitle(item)).toLowerCase().includes(q) ||
        String(getType(item)).toLowerCase().includes(q) ||
        String(getUser(item)).toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Activity</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Καταγραφή πρόσφατων ενεργειών του συστήματος και operational events.
      </p>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 12
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
            placeholder="search activity..."
          />

          <button type="button" style={buttonStyle} onClick={loadLogs}>
            Refresh
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Recent Activity</h2>

        {loading ? (
          <div>Loading activity...</div>
        ) : filteredLogs.length === 0 ? (
          <div>No activity found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredLogs.map((item, index) => (
              <div
                key={item.id || item._id || index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  padding: 16,
                  background: '#ffffff'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 10
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                      {getTitle(item)}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 8px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        ...badgeStyle(getType(item))
                      }}
                    >
                      {getType(item)}
                    </span>
                  </div>

                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {formatDate(item?.created_at || item?.createdAt || item?.timestamp)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>User</div>
                    <div style={{ fontWeight: 600 }}>{getUser(item)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Details</div>
                    <div style={{ color: '#374151' }}>
                      {item?.details || item?.meta || item?.note || '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}