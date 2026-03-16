import React, { useEffect, useMemo, useState } from 'react';
import {
  getAllFollowUpOutcomes,
  getFollowUpOutcomesSummary
} from '../api/followup';

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
    'Patient'
  );
}

function getPatientPhone(item) {
  return (
    item?.patients?.phone ||
    item?.phone ||
    item?.mobile ||
    '-'
  );
}

function getOutcomeStatus(item) {
  return item?.outcome_status || item?.status || '-';
}

function getOutcomeNote(item) {
  return item?.note || item?.details || item?.comment || '';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function outcomeBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'reached') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (s === 'no_answer') {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fcd34d'
    };
  }

  if (s === 'callback_requested') {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (s === 'refused') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (s === 'promised_improvement') {
    return {
      background: '#ede9fe',
      color: '#6d28d9',
      border: '1px solid #c4b5fd'
    };
  }

  return {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };
}

export default function FollowUpOutcomes() {
  const [outcomes, setOutcomes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [error, setError] = useState('');

  useEffect(() => {
    loadOutcomes();
  }, []);

  async function loadOutcomes() {
    try {
      setLoading(true);
      setError('');

      const [outcomesData, summaryData] = await Promise.all([
        getAllFollowUpOutcomes(),
        getFollowUpOutcomesSummary()
      ]);

      setOutcomes(safeArray(outcomesData?.data || outcomesData));
      setSummary(summaryData || null);
    } catch (err) {
      console.error('Error loading follow-up outcomes:', err);
      setOutcomes([]);
      setSummary(null);
      setError('Αποτυχία φόρτωσης outcomes.');
    } finally {
      setLoading(false);
    }
  }

  const filteredOutcomes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return outcomes.filter((item) => {
      const patientName = getPatientName(item).toLowerCase();
      const patientPhone = String(getPatientPhone(item)).toLowerCase();
      const status = String(getOutcomeStatus(item)).toLowerCase();
      const note = String(getOutcomeNote(item)).toLowerCase();

      const matchesSearch =
        !q ||
        patientName.includes(q) ||
        patientPhone.includes(q) ||
        note.includes(q);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [outcomes, search, statusFilter]);

  const derivedStats = useMemo(() => {
    const total = outcomes.length;
    const reached = outcomes.filter(
      (item) => String(getOutcomeStatus(item)).toLowerCase() === 'reached'
    ).length;
    const noAnswer = outcomes.filter(
      (item) => String(getOutcomeStatus(item)).toLowerCase() === 'no_answer'
    ).length;
    const callbackRequested = outcomes.filter(
      (item) => String(getOutcomeStatus(item)).toLowerCase() === 'callback_requested'
    ).length;
    const refused = outcomes.filter(
      (item) => String(getOutcomeStatus(item)).toLowerCase() === 'refused'
    ).length;
    const promisedImprovement = outcomes.filter(
      (item) => String(getOutcomeStatus(item)).toLowerCase() === 'promised_improvement'
    ).length;

    return {
      total,
      reached,
      noAnswer,
      callbackRequested,
      refused,
      promisedImprovement
    };
  }, [outcomes]);

  const stats = summary || derivedStats;

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Follow-up Outcomes</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Επισκόπηση αποτελεσμάτων επικοινωνίας με ασθενείς και αναζήτηση σε όλα τα recorded outcomes.
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Total Outcomes</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {stats?.total || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Reached</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {stats?.reached || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>No Answer</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {stats?.no_answer ?? stats?.noAnswer ?? 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Callback Requested</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {stats?.callback_requested ?? stats?.callbackRequested ?? 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Refused</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {stats?.refused || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Promised Improvement</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
            {stats?.promised_improvement ?? stats?.promisedImprovement ?? 0}
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
              placeholder="patient / phone / note"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Outcome Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="reached">reached</option>
              <option value="no_answer">no_answer</option>
              <option value="callback_requested">callback_requested</option>
              <option value="refused">refused</option>
              <option value="promised_improvement">promised_improvement</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="button" style={buttonStyle} onClick={loadOutcomes}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Outcome List</h2>

        {loading ? (
          <div>Loading outcomes...</div>
        ) : filteredOutcomes.length === 0 ? (
          <div>No outcomes found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredOutcomes.map((item, index) => (
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
                      {getPatientName(item)}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap'
                      }}
                    >
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          ...outcomeBadgeStyle(getOutcomeStatus(item))
                        }}
                      >
                        {getOutcomeStatus(item)}
                      </span>
                    </div>
                  </div>

                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {formatDate(item?.created_at || item?.createdAt)}
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
                    <div style={{ fontWeight: 600 }}>{getPatientPhone(item)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Callback Date</div>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(item?.callback_date || item?.callbackDate)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Created By / Source</div>
                    <div style={{ fontWeight: 600 }}>
                      {item?.source || item?.created_by || '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Note
                  </div>
                  <div style={{ color: '#374151' }}>
                    {getOutcomeNote(item) || 'No note.'}
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