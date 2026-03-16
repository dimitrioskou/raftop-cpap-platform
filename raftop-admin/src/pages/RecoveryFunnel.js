import React, { useEffect, useMemo, useState } from 'react';
import { getRecoveryFunnel } from '../api/followup';

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

const badgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700
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

function getPatientName(item) {
  return (
    item?.patientName ||
    item?.fullName ||
    item?.name ||
    `${item?.firstName || ''} ${item?.lastName || ''}`.trim() ||
    `${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
    'Patient'
  );
}

function getPhone(item) {
  return item?.phone || item?.mobile || item?.telephone || '-';
}

function getStage(item) {
  return item?.stage || 'identified';
}

function getPriority(item) {
  return item?.priority || 'MEDIUM';
}

function getUsage(item) {
  return item?.usage_hours ?? item?.usageHours ?? item?.hours ?? 0;
}

function getTarget(item) {
  return item?.target_hours ?? item?.targetHours ?? 80;
}

function getLastAction(item) {
  return item?.last_action || item?.lastAction || item?.recommendedAction || '-';
}

function stageStyle(stage) {
  const s = String(stage || '').toLowerCase();

  if (s === 'recovered') {
    return {
      ...badgeBase,
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (s === 'improving') {
    return {
      ...badgeBase,
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (s === 'contacted') {
    return {
      ...badgeBase,
      background: '#ede9fe',
      color: '#6d28d9',
      border: '1px solid #c4b5fd'
    };
  }

  return {
    ...badgeBase,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d'
  };
}

function priorityStyle(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'critical') {
    return {
      ...badgeBase,
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (p === 'high') {
    return {
      ...badgeBase,
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (p === 'low') {
    return {
      ...badgeBase,
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0'
    };
  }

  return {
    ...badgeBase,
    background: '#e5e7eb',
    color: '#374151',
    border: '1px solid #d1d5db'
  };
}

export default function RecoveryFunnel() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecoveryFunnel();
  }, []);

  async function loadRecoveryFunnel() {
    try {
      setLoading(true);
      setError('');
      const data = await getRecoveryFunnel();
      const normalized = safeArray(data?.items || data?.data || data);
      setItems(normalized);
      setSummary(data?.summary || null);
    } catch (err) {
      console.error('Error loading recovery funnel:', err);
      setItems([]);
      setSummary(null);
      setError('Αποτυχία φόρτωσης recovery funnel.');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !q ||
        getPatientName(item).toLowerCase().includes(q) ||
        String(getPhone(item)).toLowerCase().includes(q);

      const matchesStage =
        stageFilter === 'all' ||
        String(getStage(item)).toLowerCase() === stageFilter.toLowerCase();

      return matchesSearch && matchesStage;
    });
  }, [items, search, stageFilter]);

  const derivedSummary = useMemo(() => {
    return {
      total: items.length,
      identified: items.filter((i) => String(getStage(i)).toLowerCase() === 'identified').length,
      contacted: items.filter((i) => String(getStage(i)).toLowerCase() === 'contacted').length,
      improving: items.filter((i) => String(getStage(i)).toLowerCase() === 'improving').length,
      recovered: items.filter((i) => String(getStage(i)).toLowerCase() === 'recovered').length
    };
  }, [items]);

  const stats = summary || derivedSummary;

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Recovery Funnel</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Παρακολούθηση ασθενών από το initial risk μέχρι improvement και recovery.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats?.total || 0}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Identified</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {stats?.identified || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Contacted</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
            {stats?.contacted || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Improving</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {stats?.improving || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Recovered</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {stats?.recovered || 0}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Filters</h2>

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
              placeholder="patient / phone"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="identified">identified</option>
              <option value="contacted">contacted</option>
              <option value="improving">improving</option>
              <option value="recovered">recovered</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              type="button"
              onClick={loadRecoveryFunnel}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#111827',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Recovery List</h2>

        {loading ? (
          <div>Loading recovery funnel...</div>
        ) : filteredItems.length === 0 ? (
          <div>No recovery funnel items found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredItems.map((item, index) => (
              <div
                key={item.id || item.patientId || index}
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
                      {getPatientName(item)}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={stageStyle(getStage(item))}>{getStage(item)}</span>
                      <span style={priorityStyle(getPriority(item))}>{getPriority(item)}</span>
                    </div>
                  </div>

                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {formatDate(item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginBottom: 12
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                    <div style={{ fontWeight: 600 }}>{getPhone(item)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Usage</div>
                    <div style={{ fontWeight: 600 }}>
                      {getUsage(item)} / {getTarget(item)} ώρες
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Last Action</div>
                    <div style={{ fontWeight: 600 }}>{getLastAction(item)}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Note
                  </div>
                  <div style={{ color: '#374151' }}>
                    {item?.note || item?.reason || item?.recommendedAction || '-'}
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