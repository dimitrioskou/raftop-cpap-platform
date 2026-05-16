import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function SystemStabilityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/system/route-stability-audit`);
      const json = await res.json();

      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading system audit...</div>;

  if (error)
    return (
      <div style={{ padding: 20, color: 'red' }}>
        Error: {error}
      </div>
    );

  const { summary, results, nextBestActions } = data;

  return (
    <div style={{ padding: 30 }}>
      <h1>System Stability Audit</h1>

      <div style={{ marginBottom: 20 }}>
        <strong>Status: </strong>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background:
              summary.readinessStatus === 'READY'
                ? '#4caf50'
                : summary.readinessStatus === 'BLOCKED'
                ? '#f44336'
                : '#ff9800',
            color: 'white',
            marginLeft: 10
          }}
        >
          {summary.readinessStatus}
        </span>

        <button onClick={load} style={{ marginLeft: 20 }}>
          Refresh
        </button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Stat title="Total" value={summary.total} />
        <Stat title="Passed" value={summary.passed} />
        <Stat title="Warnings" value={summary.warned} />
        <Stat title="Failed" value={summary.failed} />
        <Stat title="Critical Failed" value={summary.criticalFailed} />
      </div>

      {/* NEXT ACTIONS */}
      <div style={{ marginTop: 40 }}>
        <h2>Next Best Actions</h2>
        {nextBestActions.map((a, i) => (
          <div key={i} style={cardStyle}>
            <strong>{a.title}</strong>
            <div>{a.description}</div>
            <small>{a.type}</small>
          </div>
        ))}
      </div>

      {/* ROUTES TABLE */}
      <div style={{ marginTop: 40 }}>
        <h2>Routes</h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Route</th>
              <th>Status</th>
              <th>Code</th>
              <th>Time</th>
              <th>Reason</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{r.path}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{r.statusCode}</td>
                <td>{r.durationMs}ms</td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 10,
        background: '#f5f5f5',
        minWidth: 120
      }}
    >
      <div style={{ fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    PASS: '#4caf50',
    WARN: '#ff9800',
    FAIL: '#f44336'
  };

  return (
    <span
      style={{
        background: colors[status] || '#999',
        color: 'white',
        padding: '4px 10px',
        borderRadius: 6
      }}
    >
      {status}
    </span>
  );
}

const cardStyle = {
  padding: 15,
  borderRadius: 10,
  background: '#f9f9f9',
  marginBottom: 10
};