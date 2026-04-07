import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiStatusNotice from '../components/ApiStatusNotice';
import MetricCard from '../components/MetricCard';
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

function sectionCardStyle(dark = false) {
  return {
    background: dark
      ? 'linear-gradient(135deg, #172033 0%, #0f172a 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: dark ? '1px solid #243041' : '1px solid #e5e7eb',
    borderRadius: 20,
    padding: 18,
    boxShadow: '0 12px 24px rgba(16,24,40,0.08)'
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
    updatedAt: source.updated_at || source.updatedAt || source.timestamp || null
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
          ...sectionCardStyle(true),
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
            RAFTOP OVERVIEW
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 900, color: '#ffffff' }}>
            Dashboard
          </h1>
          <div style={{ color: '#cbd5e1', marginTop: 6 }}>
            Premium tenant overview with live metrics and quick actions.
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
        <MetricCard label="Patients" value={dashboard.patientsCount} tone="blue" />
        <MetricCard label="Doctors" value={dashboard.doctorsCount} tone="purple" />
        <MetricCard label="Devices" value={dashboard.devicesCount} tone="green" />
        <MetricCard label="Modules" value={dashboard.modulesCount} tone="orange" />
        <MetricCard label="Critical Follow-ups" value={dashboard.criticalFollowups} tone="dark" />
        <MetricCard label="Warning Follow-ups" value={dashboard.warningFollowups} tone="orange" />
        <MetricCard label="Pending Tasks" value={dashboard.pendingTasks} tone="purple" />
        <MetricCard label="Offline Devices" value={dashboard.offlineDevices} tone="blue" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        <Link to="/tenant/followup" style={quickActionCardStyle('red')}>
          <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 17 }}>Follow-up Center</div>
          <div style={{ color: '#667085', fontSize: 14, lineHeight: 1.5 }}>
            Open critical and warning patient outreach workflow.
          </div>
        </Link>

        <Link to="/tenant/compliance" style={quickActionCardStyle('orange')}>
          <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 17 }}>Compliance</div>
          <div style={{ color: '#667085', fontSize: 14, lineHeight: 1.5 }}>
            Review thresholds, adherence and below-target usage.
          </div>
        </Link>

        <Link to="/tenant/devices" style={quickActionCardStyle('blue')}>
          <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 17 }}>Devices</div>
          <div style={{ color: '#667085', fontSize: 14, lineHeight: 1.5 }}>
            Inspect device connectivity, sync and performance.
          </div>
        </Link>

        <Link to="/tenant/atlas/summary" style={quickActionCardStyle('green')}>
          <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 17 }}>ATLAS Summary</div>
          <div style={{ color: '#667085', fontSize: 14, lineHeight: 1.5 }}>
            Open prioritization logic and action-group overview.
          </div>
        </Link>
      </div>

      <div style={sectionCardStyle()}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10, color: '#101828' }}>
          Last Dashboard Sync
        </div>
        <div style={{ color: '#475467', lineHeight: 1.6 }}>
          {formatDateTime(dashboard.updatedAt)}
        </div>
      </div>
    </div>
  );
}