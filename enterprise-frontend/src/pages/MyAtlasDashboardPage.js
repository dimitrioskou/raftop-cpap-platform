import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TenantLayout from '../layouts/TenantLayout';
import { getMyAtlasSummary, runAiScoring, runAutoActions } from '../api/atlas';

function cardStyle(background = '#ffffff', border = '#e5e7eb') {
  return {
    background,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 18
  };
}

function SummaryCard({ code, title, total, revenue }) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        {code}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
        {title}
      </div>

      <div
        style={{
          fontSize: 34,
          fontWeight: 800,
          marginTop: 12,
          color: '#111827'
        }}
      >
        {total}
      </div>

      <div
        style={{
          fontSize: 15,
          marginTop: 8,
          color: '#16a34a',
          fontWeight: 700
        }}
      >
        €{revenue || 0}
      </div>
    </div>
  );
}

export default function MyAtlasDashboardPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getMyAtlasSummary();
      setSummary(result.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load My ATLAS summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRunAi() {
    try {
      setWorking(true);
      setError('');

      const aiRes = await runAiScoring();
      const autoRes = await runAutoActions();

      alert(
        `AI updated ${aiRes.updated || 0} cases\nAuto-actions created ${autoRes.created || 0}`
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to run AI engine');
    } finally {
      setWorking(false);
    }
  }

  const totalRevenue = summary.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  const totalCases = summary.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  return (
    <TenantLayout title="My ATLAS Dashboard">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32, color: '#111827' }}>
            My ATLAS Dashboard
          </h1>
          <p style={{ marginTop: 8, color: '#6b7280' }}>
            Doctor-specific ATLAS summary and AI command center.
          </p>
        </div>

        <button
          onClick={handleRunAi}
          disabled={working}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#111827',
            color: '#fff',
            border: 'none',
            cursor: working ? 'not-allowed' : 'pointer',
            opacity: working ? 0.7 : 1,
            fontWeight: 700
          }}
        >
          {working ? 'Running...' : '🧠 Run AI + Auto Actions'}
        </button>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 20,
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

      {!loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          <div style={cardStyle('#ecfdf5', '#a7f3d0')}>
            <div style={{ fontSize: 13, color: '#166534' }}>
              My Revenue Opportunity
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                marginTop: 10,
                color: '#166534'
              }}
            >
              €{totalRevenue}
            </div>
          </div>

          <div style={cardStyle('#eff6ff', '#bfdbfe')}>
            <div style={{ fontSize: 13, color: '#1d4ed8' }}>
              My Open Cases
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                marginTop: 10,
                color: '#1d4ed8'
              }}
            >
              {totalCases}
            </div>
          </div>

          <div style={cardStyle('#f9fafb', '#e5e7eb')}>
            <div style={{ fontSize: 13, color: '#374151' }}>
              Quick Access
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/tenant/my-atlas">My Queue</Link>
              <Link to="/tenant/daily-board">Daily Board</Link>
              <Link to="/tenant/auto-actions">AI Auto Actions</Link>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          {summary.map((item) => (
            <SummaryCard
              key={item.code}
              code={item.code}
              title={item.name}
              total={item.total}
              revenue={item.revenue}
            />
          ))}
        </div>
      )}
    </TenantLayout>
  );
}