import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import PageStateCard from '../components/PageStateCard';
import { buildApiNotice, fetchJson, formatDateTime } from '../utils/tenantDataHelpers';
import { buttonStyle, quickActionCardStyle } from '../utils/uiStyles';

const FALLBACK_DASHBOARD = {
  patientsCount: 4,
  patients_count: 4,
  doctorsCount: 4,
  doctors_count: 4,
  devicesCount: 4,
  devices_count: 4,
  seatsCount: 4,
  seats_count: 4,
  modulesCount: 12,
  modules_count: 12,
  featuresCount: 29,
  features_count: 29,
  criticalFollowups: 3,
  critical_followups: 3,
  warningFollowups: 2,
  warning_followups: 2,
  pendingTasks: 5,
  pending_tasks: 5,
  offlineDevices: 1,
  offline_devices: 1,
  updated_at: '2026-04-05T13:00:00Z'
};

function cardStyle() {
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)'
  };
}

function normalizeDashboard(payload) {
  const source = payload || {};

  return {
    patientsCount: Number(source.patientsCount ?? source.patients_count ?? 0) || 0,
    doctorsCount: Number(source.doctorsCount ?? source.doctors_count ?? 0) || 0,
    devicesCount: Number(source.devicesCount ?? source.devices_count ?? 0) || 0,
    seatsCount: Number(source.seatsCount ?? source.seats_count ?? 0) || 0,
    modulesCount: Number(source.modulesCount ?? source.modules_count ?? 0) || 0,
    featuresCount: Number(source.featuresCount ?? source.features_count ?? 0) || 0,
    criticalFollowups: Number(source.criticalFollowups ?? source.critical_followups ?? 0) || 0,
    warningFollowups: Number(source.warningFollowups ?? source.warning_followups ?? 0) || 0,
    pendingTasks: Number(source.pendingTasks ?? source.pending_tasks ?? 0) || 0,
    offlineDevices: Number(source.offlineDevices ?? source.offline_devices ?? 0) || 0,
    updatedAt:
      source.updated_at ||
      source.updatedAt ||
      source.timestamp ||
      null
  };
}

export default function TenantDashboardPage() {
  const [dashboard, setDashboard] = useState(normalizeDashboard(FALLBACK_DASHBOARD));
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setApiError('');
    setUsingFallback(false);

    try {
      const payload = await fetchJson('/api/tenant/dashboard', { signal });
      const normalized = normalizeDashboard(payload);

      const hasUsableData =
        normalized.patientsCount > 0 ||
        normalized.doctorsCount > 0 ||
        normalized.devicesCount > 0 ||
        normalized.modulesCount > 0 ||
        normalized.featuresCount > 0 ||
        normalized.criticalFollowups > 0 ||
        normalized.pendingTasks > 0 ||
        normalized.offlineDevices > 0;

      if (!hasUsableData) {
        setDashboard(normalizeDashboard(FALLBACK_DASHBOARD));
        setUsingFallback(true);
        setApiError('Dashboard API returned no usable metrics. Showing fallback dashboard data.');
      } else {
        setDashboard(normalized);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      setDashboard(normalizeDashboard(FALLBACK_DASHBOARD));
      setUsingFallback(true);
      setApiError(error.message || 'Failed to load dashboard. Showing fallback dashboard data.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [loadDashboard]);

  const apiNotice = useMemo(() => {
    return buildApiNotice({
      apiError,
      usingFallback,
      entityLabel: 'dashboard metrics'
    });
  }, [apiError, usingFallback]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <PageStateCard
          title="Loading dashboard"
          message="Fetching tenant dashboard metrics from the active backend endpoints."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
          <div style={{ color: '#667085', marginTop: 6 }}>
            Production-safe tenant overview.
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const controller = new AbortController();
            loadDashboard(controller.signal);
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
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Patients</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.patientsCount}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Doctors</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.doctorsCount}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Devices</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.devicesCount}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Modules</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.modulesCount}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Features</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.featuresCount}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Critical Follow-ups</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.criticalFollowups}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Warning Follow-ups</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.warningFollowups}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Pending Tasks</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.pendingTasks}</div></div>
        <div style={cardStyle()}><div style={{ color: '#667085', fontSize: 13 }}>Offline Devices</div><div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{dashboard.offlineDevices}</div></div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        <Link to="/tenant/followup" style={quickActionCardStyle('red')}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Follow-up Center</div>
          <div style={{ color: '#667085', fontSize: 14 }}>
            Open critical and warning patient follow-up workflow.
          </div>
        </Link>

        <Link to="/tenant/compliance" style={quickActionCardStyle('orange')}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Compliance</div>
          <div style={{ color: '#667085', fontSize: 14 }}>
            Review below-threshold usage and adherence metrics.
          </div>
        </Link>

        <Link to="/tenant/devices" style={quickActionCardStyle('blue')}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Devices</div>
          <div style={{ color: '#667085', fontSize: 14 }}>
            Check device status, connectivity, and profiles.
          </div>
        </Link>

        <Link to="/tenant/atlas/summary" style={quickActionCardStyle('green')}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>ATLAS Summary</div>
          <div style={{ color: '#667085', fontSize: 14 }}>
            Open advanced prioritization and action-group overview.
          </div>
        </Link>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>
          Last Dashboard Sync
        </div>
        <div style={{ color: '#667085', lineHeight: 1.5 }}>
          {formatDateTime(dashboard.updatedAt)}
        </div>
      </div>
    </div>
  );
}