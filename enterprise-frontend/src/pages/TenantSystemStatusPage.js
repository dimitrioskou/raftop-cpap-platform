import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
import PageStateCard from '../components/PageStateCard';
import { buildApiNotice, fetchJson, formatDateTime } from '../utils/tenantDataHelpers';
import { buttonStyle, panelStyle, toolbarCardStyle } from '../utils/uiStyles';

export default function TenantSystemStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const loadStatus = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);

    try {
      const payload = await fetchJson('/api/health', { signal });

      setStatusData({
        ok: payload?.ok === true,
        service: payload?.service || 'RAFTOP Enterprise Backend',
        environment: payload?.environment || 'development',
        port: payload?.port || 5001,
        timestamp: payload?.timestamp || null
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setStatusData({
        ok: false,
        service: 'RAFTOP Enterprise Backend',
        environment: 'unknown',
        port: '—',
        timestamp: null
      });
      setUsingFallback(true);
      setApiError(error.message || 'Failed to load system status.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadStatus(controller.signal);
    return () => controller.abort();
  }, [loadStatus]);

  const apiNotice = useMemo(() => {
    return buildApiNotice({
      apiError,
      usingFallback,
      entityLabel: 'system status'
    });
  }, [apiError, usingFallback]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <PageStateCard
          title="Loading system status"
          message="Checking backend health and runtime environment."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          ...panelStyle(true),
          marginBottom: 18,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#93c5fd', letterSpacing: 0.6 }}>
            SYSTEM WORKSPACE
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
            System Status
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Premium runtime and health visibility for the active environment.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const controller = new AbortController();
            loadStatus(controller.signal);
          }}
          style={buttonStyle('primary')}
        >
          Refresh
        </button>
      </div>

      {apiNotice ? (
        <ApiStatusNotice
          status={apiNotice.status}
          title={apiNotice.title}
          message={apiNotice.message}
          compact
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        <MetricCard label="Backend Health" value={statusData?.ok ? 'OK' : 'DOWN'} tone={statusData?.ok ? 'green' : 'dark'} />
        <MetricCard label="Service" value={statusData?.service || '—'} tone="blue" />
        <MetricCard label="Environment" value={statusData?.environment || '—'} tone="purple" />
        <MetricCard label="Port" value={statusData?.port ?? '—'} tone="orange" />
        <MetricCard label="Last Check" value={formatDateTime(statusData?.timestamp)} tone="blue" />
      </div>

      <div style={toolbarCardStyle()}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Runtime Overview</div>
        <div style={{ color: '#667085', lineHeight: 1.6 }}>
          The backend health endpoint is connected and providing environment-level runtime visibility for the tenant workspace.
        </div>
      </div>
    </div>
  );
}