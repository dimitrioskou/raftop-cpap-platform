import React, { useEffect, useMemo, useState } from 'react';
import { getFollowUpPatients, getPriorityQueue } from '../api/followup';

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

function getPatientId(item) {
  return (
    item?.patientId ||
    item?.patient_id ||
    item?.id ||
    item?._id ||
    item?.patients?.id ||
    item?.patients?._id ||
    null
  );
}

function getPatientName(item) {
  if (item?.patients) {
    const full = `${item.patients.first_name || ''} ${item.patients.last_name || ''}`.trim();
    if (full) return full;
  }

  return (
    item?.patientName ||
    item?.fullName ||
    item?.name ||
    `${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
    `${item?.firstName || ''} ${item?.lastName || ''}`.trim() ||
    'Patient'
  );
}

function getPatientPhone(item) {
  return item?.patients?.phone || item?.phone || item?.mobile || item?.telephone || '-';
}

function getUsageHours(item) {
  return Number(
    item?.usage_hours ??
      item?.usageHours ??
      item?.hours ??
      item?.monthly_usage_hours ??
      0
  ) || 0;
}

function getTargetHours(item) {
  return Number(item?.target_hours ?? item?.targetHours ?? 80) || 80;
}

function getComplianceStatus(item) {
  const explicit = String(item?.compliance_status || item?.complianceStatus || '').toLowerCase();
  if (['critical', 'warning', 'ok'].includes(explicit)) return explicit;

  const usage = getUsageHours(item);
  const target = getTargetHours(item);

  if (usage < Math.max(40, target * 0.5)) return 'critical';
  if (usage < target) return 'warning';
  return 'ok';
}

function getPriority(item, priorityQueueMap) {
  const patientId = String(getPatientId(item) || '');
  return priorityQueueMap.get(patientId)?.priority || 'MEDIUM';
}

function formatUpdatedAt(item) {
  const value =
    item?.updated_at ||
    item?.updatedAt ||
    item?.last_sync_at ||
    item?.created_at ||
    item?.createdAt;

  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'critical') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (s === 'warning') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  return {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac'
  };
}

function priorityBadgeStyle(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'critical') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (p === 'high') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (p === 'low') {
    return {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0'
    };
  }

  return {
    background: '#ede9fe',
    color: '#6d28d9',
    border: '1px solid #c4b5fd'
  };
}

export default function Compliance() {
  const [patients, setPatients] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [error, setError] = useState('');

  useEffect(() => {
    loadCompliance();
  }, []);

  async function loadCompliance() {
    try {
      setLoading(true);
      setError('');

      const [followUpData, priorityData] = await Promise.all([
        getFollowUpPatients(),
        getPriorityQueue()
      ]);

      setPatients(safeArray(followUpData?.data || followUpData));
      setPriorityQueue(safeArray(priorityData?.data || priorityData));
    } catch (err) {
      console.error('Error loading compliance data:', err);
      setPatients([]);
      setPriorityQueue([]);
      setError('Αποτυχία φόρτωσης compliance data.');
    } finally {
      setLoading(false);
    }
  }

  const priorityQueueMap = useMemo(() => {
    const map = new Map();

    priorityQueue.forEach((item) => {
      const patientId = String(getPatientId(item) || '');
      if (patientId) {
        map.set(patientId, item);
      }
    });

    return map;
  }, [priorityQueue]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return patients.filter((item) => {
      const status = getComplianceStatus(item);
      const matchesSearch =
        !q ||
        getPatientName(item).toLowerCase().includes(q) ||
        String(getPatientPhone(item)).toLowerCase().includes(q) ||
        String(getPatientId(item) || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const summary = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter((item) => getComplianceStatus(item) === 'critical').length;
    const warning = patients.filter((item) => getComplianceStatus(item) === 'warning').length;
    const ok = patients.filter((item) => getComplianceStatus(item) === 'ok').length;

    const avgUsage =
      total > 0
        ? Math.round(
            patients.reduce((sum, item) => sum + getUsageHours(item), 0) / total
          )
        : 0;

    return { total, critical, warning, ok, avgUsage };
  }, [patients]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>80h Compliance</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Παρακολούθηση ασθενών με βάση τη χρήση CPAP και την ανάγκη follow-up.
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Below Target</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.total}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Critical</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {summary.critical}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Warning</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c' }}>
            {summary.warning}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Recovered / OK</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {summary.ok}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Average Usage</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {summary.avgUsage}h
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
              placeholder="patient / phone / id"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="critical">critical</option>
              <option value="warning">warning</option>
              <option value="ok">ok</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="button" style={buttonStyle} onClick={loadCompliance}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Compliance List</h2>

        {loading ? (
          <div>Loading compliance data...</div>
        ) : filteredPatients.length === 0 ? (
          <div>No compliance records found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredPatients.map((item, index) => {
              const status = getComplianceStatus(item);
              const priority = getPriority(item, priorityQueueMap);

              return (
                <div
                  key={getPatientId(item) || index}
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
                      alignItems: 'flex-start',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                        {getPatientName(item)}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...statusBadgeStyle(status)
                          }}
                        >
                          {status}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...priorityBadgeStyle(priority)
                          }}
                        >
                          {priority}
                        </span>
                      </div>
                    </div>

                    <div style={{ color: '#6b7280', fontSize: 14 }}>
                      Updated: {formatUpdatedAt(item)}
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
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Usage</div>
                      <div style={{ fontWeight: 600 }}>
                        {getUsageHours(item)} / {getTargetHours(item)} ώρες
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                      <div style={{ fontWeight: 600 }}>{getPatientPhone(item)}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Patient ID</div>
                      <div style={{ fontWeight: 600 }}>{getPatientId(item) || '-'}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      Follow-up Hint
                    </div>
                    <div style={{ color: '#374151' }}>
                      {priorityQueueMap.get(String(getPatientId(item) || ''))?.reason ||
                        'Monitor usage and plan next action.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}