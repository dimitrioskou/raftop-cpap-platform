import React, { useEffect, useMemo, useState } from 'react';
import { getDoctorAtlasQueue } from '../api/atlas';

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

function buttonStyle(variant = 'primary') {
  const base = {
    border: 'none',
    borderRadius: 10,
    padding: '9px 12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14
  };

  if (variant === 'secondary') {
    return { ...base, background: '#e2e8f0', color: '#0f172a' };
  }

  if (variant === 'success') {
    return { ...base, background: '#16a34a', color: '#ffffff' };
  }

  return { ...base, background: '#2563eb', color: '#ffffff' };
}

function priorityBadgeStyle(priority) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700
  };

  if (priority === 'critical') return { ...base, background: '#fee2e2', color: '#991b1b' };
  if (priority === 'high') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (priority === 'medium') return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  return { ...base, background: '#dcfce7', color: '#166534' };
}

function normalizeCase(row = {}) {
  return {
    id: row.id || row.case_id || row.caseId || Math.random().toString(36),
    patientName: row.patient_name || row.patientName || row.full_name || 'Unknown Patient',
    reason: row.reason || row.title || '-',
    priority: String(row.priority || 'medium').toLowerCase(),
    score: Number(row.score || 0),
    ahi: Number(row.ahi_avg_7d || row.ahi || 0),
    usage7d: Number(row.usage_avg_7d || row.usage7d || 0),
    doctorName: row.doctor_name || row.doctorName || '-',
    createdAt: row.created_at || row.createdAt || '-',
    status: String(row.status || 'open').toLowerCase()
  };
}

export default function TenantDoctorAtlasQueuePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getDoctorAtlasQueue();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setRows(list.map(normalizeCase));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        row.patientName.toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q) ||
        String(row.doctorName).toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === 'all' || row.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [rows, search, priorityFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Doctor ATLAS Queue</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Doctor-facing queue of patient cases requiring clinical attention.
        </p>
      </div>

      <div
        style={{
          ...cardStyle(),
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 14
        }}
      >
        <div>
          <label
            htmlFor="doctor-atlas-search"
            style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 6 }}
          >
            Search
          </label>
          <input
            id="doctor-atlas-search"
            type="text"
            placeholder="Search by patient, reason, doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle()}
          />
        </div>

        <div>
          <label
            htmlFor="doctor-atlas-priority"
            style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 6 }}
          >
            Priority
          </label>
          <select
            id="doctor-atlas-priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={inputStyle()}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div style={{ ...cardStyle(), padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20 }}>Loading doctor queue...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: 20, color: '#64748b' }}>No doctor ATLAS cases found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 14 }}>Patient</th>
                  <th style={{ padding: 14 }}>Reason</th>
                  <th style={{ padding: 14 }}>Priority</th>
                  <th style={{ padding: 14 }}>Score</th>
                  <th style={{ padding: 14 }}>AHI</th>
                  <th style={{ padding: 14 }}>Usage 7d</th>
                  <th style={{ padding: 14 }}>Doctor</th>
                  <th style={{ padding: 14 }}>Created</th>
                  <th style={{ padding: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>{row.patientName}</td>
                    <td style={{ padding: 14 }}>{row.reason}</td>
                    <td style={{ padding: 14 }}>
                      <span style={priorityBadgeStyle(row.priority)}>{row.priority}</span>
                    </td>
                    <td style={{ padding: 14 }}>{row.score}</td>
                    <td style={{ padding: 14 }}>{row.ahi}</td>
                    <td style={{ padding: 14 }}>{row.usage7d}</td>
                    <td style={{ padding: 14 }}>{row.doctorName}</td>
                    <td style={{ padding: 14 }}>{row.createdAt}</td>
                    <td style={{ padding: 14 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" style={buttonStyle('primary')}>
                          Review
                        </button>
                        <button type="button" style={buttonStyle('success')}>
                          Resolve
                        </button>
                        <button type="button" style={buttonStyle('secondary')}>
                          Refer
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