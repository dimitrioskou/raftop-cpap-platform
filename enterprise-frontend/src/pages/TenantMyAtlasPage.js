import React, { useEffect, useState } from 'react';
import { getMyAtlasQueue, resolveAtlasCase } from '../api/atlas';

function card() {
  return {
    background: '#fff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function badge(priority) {
  const base = { padding: '4px 10px', borderRadius: 999, fontWeight: 700, fontSize: 12 };
  if (priority === 'critical') return { ...base, background: '#fee2e2', color: '#991b1b' };
  if (priority === 'high') return { ...base, background: '#fef3c7', color: '#92400e' };
  return { ...base, background: '#dcfce7', color: '#166534' };
}

export default function TenantMyAtlasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await getMyAtlasQueue();
    setRows(res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(id) {
    await resolveAtlasCase(id, 'Resolved from My ATLAS');
    load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card()}>
        <h2>My ATLAS Cases</h2>
        <p style={{ color: '#64748b' }}>Cases assigned to me</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={card()}>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 12,
                borderBottom: '1px solid #e5e7eb'
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{r.patient_name}</div>
                <div style={{ fontSize: 13 }}>{r.reason}</div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={badge(r.priority)}>{r.priority}</span>
                <button onClick={() => handleResolve(r.id)}>Resolve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}