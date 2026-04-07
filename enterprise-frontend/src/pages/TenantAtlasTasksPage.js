import React, { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

function cardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function normalizeTask(item, index = 0) {
  return {
    id: item?.id || item?.taskId || `task-${index + 1}`,
    title: item?.title || `Task ${index + 1}`,
    status: String(item?.status || 'open').toLowerCase(),
    priority: String(item?.priority || 'medium').toLowerCase(),
    patientId: item?.patientId || null,
    deviceId: item?.deviceId || null,
    dueDate: item?.dueDate || null,
    createdAt: item?.createdAt || null
  };
}

export default function AtlasTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/atlas/tasks');
        const rows = Array.isArray(payload?.tasks) ? payload.tasks : [];

        if (!mounted) return;

        setTasks(rows.map((item, index) => normalizeTask(item, index)));
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) return;

        setError(err?.message || 'Failed to load ATLAS tasks');
        setTasks([]);
        setMeta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>ATLAS SYSTEM</div>
        <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>Tasks</h1>
        <div style={{ color: '#667085' }}>Open and derived ATLAS tasks.</div>
      </div>

      {error ? (
        <div style={{ ...cardStyle(), background: '#fff1f2', border: '1px solid #fda4af', color: '#b42318', marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading ATLAS tasks...</div>
      ) : tasks.length === 0 ? (
        <div style={cardStyle()}>No ATLAS tasks found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {tasks.map((task) => (
            <div key={task.id} style={cardStyle()}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
                {task.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Status</div>
                  <div style={{ fontWeight: 800 }}>{task.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Priority</div>
                  <div style={{ fontWeight: 800 }}>{task.priority}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Patient ID</div>
                  <div style={{ fontWeight: 800 }}>{task.patientId || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Device ID</div>
                  <div style={{ fontWeight: 800 }}>{task.deviceId || '—'}</div>
                </div>
              </div>
            </div>
          ))}

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: '#667085' }}>
              Source: <strong>{meta?.source || '—'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}