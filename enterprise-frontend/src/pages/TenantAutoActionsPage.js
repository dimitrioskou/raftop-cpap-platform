import React, { useEffect, useMemo, useState } from 'react';
import {
  createAutoTasks,
  executeAutoAction,
  getAutoActions,
  refreshTaskSla,
  runAiScoring,
  runAutoActions
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

  if (variant === 'success') {
    return { ...base, background: '#16a34a', color: '#ffffff' };
  }

  if (variant === 'danger') {
    return { ...base, background: '#ef4444', color: '#ffffff' };
  }

  return { ...base, background: '#2563eb', color: '#ffffff' };
}

function statusBadgeStyle(status) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700
  };

  if (status === 'completed' || status === 'executed') {
    return { ...base, background: '#dcfce7', color: '#166534' };
  }

  if (status === 'ready') {
    return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  }

  if (status === 'failed') {
    return { ...base, background: '#fee2e2', color: '#991b1b' };
  }

  return { ...base, background: '#f8fafc', color: '#475569' };
}

function normalizeAction(row = {}) {
  return {
    id: row.id,
    title: row.title || 'Untitled Action',
    rule: row.rule || '-',
    status: row.status || 'ready',
    created_at: row.created_at || '',
    result: row.result || 'pending'
  };
}

export default function TenantAutoActionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [lastRunMessage, setLastRunMessage] = useState('');

  async function loadRows() {
    try {
      setLoading(true);
      setError('');
      const result = await getAutoActions();
      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
        ? result.data
        : [];
      setRows(list.map(normalizeAction));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load auto actions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function handleRunAiScoring() {
    try {
      setWorking(true);
      setError('');
      const res = await runAiScoring();
      setLastRunMessage(`AI scoring completed. Updated ${res?.updated || res?.data?.updated || 0} cases.`);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to run AI scoring');
    } finally {
      setWorking(false);
    }
  }

  async function handleRunAutoActions() {
    try {
      setWorking(true);
      setError('');
      const res = await runAutoActions();
      setLastRunMessage(`Auto actions run completed. Created ${res?.created || res?.data?.created || 0} actions.`);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to run auto actions');
    } finally {
      setWorking(false);
    }
  }

  async function handleCreateAutoTasks() {
    try {
      setWorking(true);
      setError('');
      const res = await createAutoTasks();
      setLastRunMessage(`Auto tasks created. Count: ${res?.created || res?.data?.created || 0}.`);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create auto tasks');
    } finally {
      setWorking(false);
    }
  }

  async function handleRefreshSla() {
    try {
      setWorking(true);
      setError('');
      await refreshTaskSla();
      setLastRunMessage('Task SLA refresh completed.');
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to refresh task SLA');
    } finally {
      setWorking(false);
    }
  }

  async function handleExecuteAction(id) {
    try {
      setWorkingId(id);
      setError('');
      await executeAutoAction(id);
      await loadRows();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to execute auto action');
    } finally {
      setWorkingId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [row.title, row.rule, row.status, row.result]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      ready: rows.filter((r) => r.status === 'ready').length,
      completed: rows.filter((r) => r.status === 'completed' || r.result === 'executed').length,
      pending: rows.filter((r) => r.result === 'pending').length
    };
  }, [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Auto Actions + AI Control Panel</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Run AI scoring, execute automation flows, create task batches, and monitor action rules.
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
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Actions</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Ready</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.ready}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Completed</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.completed}</div>
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Pending Result</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{stats.pending}</div>
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

      {lastRunMessage ? (
        <div
          style={{
            background: '#ecfdf5',
            color: '#166534',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: 14
          }}
        >
          {lastRunMessage}
        </div>
      ) : null}

      <div
        style={{
          ...cardStyle(),
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        <button type="button" disabled={working} style={buttonStyle('primary', working)} onClick={handleRunAiScoring}>
          {working ? 'Working...' : 'Run AI Scoring'}
        </button>

        <button type="button" disabled={working} style={buttonStyle('success', working)} onClick={handleRunAutoActions}>
          {working ? 'Working...' : 'Run Auto Actions'}
        </button>

        <button type="button" disabled={working} style={buttonStyle('secondary', working)} onClick={handleCreateAutoTasks}>
          {working ? 'Working...' : 'Create Auto Tasks'}
        </button>

        <button type="button" disabled={working} style={buttonStyle('secondary', working)} onClick={handleRefreshSla}>
          {working ? 'Working...' : 'Refresh Task SLA'}
        </button>
      </div>

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
          <div style={{ fontWeight: 800, fontSize: 18 }}>Automation Registry</div>
          <input
            style={{ ...inputStyle(), minWidth: 240 }}
            placeholder="Search auto actions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading auto actions...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: 20, color: '#64748b' }}>No auto actions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1050 }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 14 }}>Title</th>
                  <th style={{ padding: 14 }}>Rule</th>
                  <th style={{ padding: 14 }}>Status</th>
                  <th style={{ padding: 14 }}>Result</th>
                  <th style={{ padding: 14 }}>Created</th>
                  <th style={{ padding: 14 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 14, fontWeight: 700 }}>{row.title}</td>
                    <td style={{ padding: 14 }}>{row.rule}</td>
                    <td style={{ padding: 14 }}>
                      <span style={statusBadgeStyle(row.status)}>{row.status}</span>
                    </td>
                    <td style={{ padding: 14 }}>
                      <span style={statusBadgeStyle(row.result)}>{row.result}</span>
                    </td>
                    <td style={{ padding: 14 }}>{row.created_at || '-'}</td>
                    <td style={{ padding: 14 }}>
                      <button
                        type="button"
                        disabled={workingId === row.id}
                        style={buttonStyle('primary', workingId === row.id)}
                        onClick={() => handleExecuteAction(row.id)}
                      >
                        {workingId === row.id ? 'Executing...' : 'Execute'}
                      </button>
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