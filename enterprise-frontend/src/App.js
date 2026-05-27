import React, { useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useInRouterContext,
  useLocation
} from 'react-router-dom';

import CommercialDemoBanner from './components/CommercialDemoBanner';
import TenantBrandBanner from './components/TenantBrandBanner';
import { TenantRuntimeProvider } from './context/TenantRuntimeContext';
import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';
import RuntimeFeatureGate from './components/RuntimeFeatureGate';

import RaftopoulosSalesSnapshotPage from './pages/RaftopoulosSalesSnapshotPage';
import RaftopoulosPilotProposalPage from './pages/RaftopoulosPilotProposalPage';
import RaftopoulosDecisionRoomPage from './pages/RaftopoulosDecisionRoomPage';
import RaftopoulosObjectionHandlingPage from './pages/RaftopoulosObjectionHandlingPage';
import RaftopoulosPilotSuccessCriteriaPage from './pages/RaftopoulosPilotSuccessCriteriaPage';
import RaftopoulosPilotOperatingPlaybookPage from './pages/RaftopoulosPilotOperatingPlaybookPage';
import RaftopoulosRolloutRoadmapPage from './pages/RaftopoulosRolloutRoadmapPage';
import RaftopoulosClientPresentationFlowPage from './pages/RaftopoulosClientPresentationFlowPage';
import RaftopoulosFinalClientDemoScriptPage from './pages/RaftopoulosFinalClientDemoScriptPage';
import RaftopoulosPilotApprovalDecisionPage from './pages/RaftopoulosPilotApprovalDecisionPage';
import RaftopoulosExecutivePilotClosePage from './pages/RaftopoulosExecutivePilotClosePage';
import RaftopoulosExecutiveLeaveBehindPage from './pages/RaftopoulosExecutiveLeaveBehindPage';
import RaftopoulosExecutiveDemoScriptPage from './pages/RaftopoulosExecutiveDemoScriptPage';
import RaftopoulosPilotWalkthroughScenarioPage from './pages/RaftopoulosPilotWalkthroughScenarioPage';
import RaftopoulosExecutiveDemoHomePage from './pages/RaftopoulosExecutiveDemoHomePage';
import RaftopoulosQualityProfitExcellencePage from './pages/RaftopoulosQualityProfitExcellencePage';
import PilotDemoDashboardPage from "./pages/PilotDemoDashboardPage";
import PreSaleChecklistPage from './pages/PreSaleChecklistPage';
import ClientDemoStartPage from './pages/ClientDemoStartPage';
import DemoRoutes from './routes/DemoRoutes';
import SalesRoutes from './routes/SalesRoutes';
import TenantRoutes from './routes/TenantRoutes';
import PatientRoutes from './routes/PatientRoutes';
import SystemRoutes from './routes/SystemRoutes';
import SuperAdminRoutes from './routes/SuperAdminRoutes';
import RuntimeRoleSwitcher from './security/RuntimeRoleSwitcher';
import RuntimeAclStatusPanel from './security/RuntimeAclStatusPanel';
import RuntimeAclNavGate from './security/RuntimeAclNavGate';
import { PERMISSIONS } from './security/runtimeAcl';
import TenantStatisticsPage from './pages/TenantStatisticsPage';
import TenantExecutiveStatisticsReportPage from './pages/TenantExecutiveStatisticsReportPage';
import TenantBusinessImpactPage from './pages/TenantBusinessImpactPage';
import SuperAdminTenantProvisioningPage from './pages/SuperAdminTenantProvisioningPage';

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function getFrontendAuthToken() {
  try {
    return (
      localStorage.getItem('raftop_auth_token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      ''
    );
  } catch (error) {
    return '';
  }
}

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

function setTenantId(value) {
  const clean = String(value || 'raftopoulos-live').trim() || 'raftopoulos-live';
  localStorage.setItem('tenant_id', clean);
  localStorage.setItem('tenantId', clean);
  return clean;
}

function getSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

function setSuperAdminKey(value) {
  const clean = String(value || '').trim();

  if (clean) {
    localStorage.setItem('super_admin_api_key', clean);
    localStorage.setItem('superAdminApiKey', clean);
  }

  return clean;
}

function isCommercialDemoMode() {
  return (
    getTenantId() === 'raftopoulos-live' ||
    localStorage.getItem('commercial_demo_mode') === 'true'
  );
}

function isTechnicalDemoUnlocked() {
  return localStorage.getItem('show_technical_demo_routes') === 'true';
}

function statusStyle(value) {
  const text = String(value || '').toUpperCase();

  if (
    text.includes('BLOCKED') ||
    text.includes('FAIL') ||
    text.includes('NOT_READY') ||
    text.includes('LOCKED') ||
    text.includes('EXPIRED') ||
    text.includes('CRITICAL')
  ) {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fecaca'
    };
  }

  if (
    text.includes('WARN') ||
    text.includes('NEEDS_ATTENTION') ||
    text.includes('TRIAL') ||
    text.includes('MEDIUM') ||
    text.includes('OPEN')
  ) {
    return {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fde68a'
    };
  }

  return {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0'
  };
}

function Badge({ value }) {
  return (
    <span
      style={{
        ...statusStyle(value),
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 900,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      {value || 'UNKNOWN'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return String(value);
  }
}

function safeArray(value, keys = []) {
  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key];
  }

  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  if (Array.isArray(value?.data?.rows)) return value.data.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.checks)) return value.checks;
  if (Array.isArray(value?.alerts)) return value.alerts;
  if (Array.isArray(value?.history)) return value.history;
  if (Array.isArray(value?.signals)) return value.signals;
  if (Array.isArray(value?.patients)) return value.patients;
  if (Array.isArray(value?.devices)) return value.devices;
  if (Array.isArray(value?.tasks)) return value.tasks;
  if (Array.isArray(value?.queue)) return value.queue;

  return [];
}

function looksDemoLike(record) {
  const text = JSON.stringify(record || {}).toLowerCase();

  return (
    text.includes('demo-tenant') ||
    text.includes('test') ||
    text.includes('example') ||
    text.includes('patient.local') ||
    text.includes('raftop.local') ||
    text.includes('localhost')
  );
}

function filterCommercialRows(rows) {
  if (!Array.isArray(rows)) return [];

  if (!isCommercialDemoMode()) return rows;

  return rows.filter((row) => {
    const tenant =
      row?.tenantId ||
      row?.tenant_id ||
      row?.tenant ||
      row?.organizationTenantId ||
      '';

    if (String(tenant).toLowerCase() === 'raftopoulos-live') return true;

    return !looksDemoLike(row);
  });
}

async function apiGet(endpoint, { admin = false, tenantId = getTenantId() } = {}) {
  const superAdminKey = getSuperAdminKey();

  let url = `${API_BASE}${endpoint}`;

  if (
    endpoint.includes('/api/system/') ||
    endpoint.includes('/api/tenant/subscription/status')
  ) {
    url += endpoint.includes('?')
      ? `&tenantId=${encodeURIComponent(tenantId)}`
      : `?tenantId=${encodeURIComponent(tenantId)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId,
      'x-super-admin-key': admin ? superAdminKey : superAdminKey
    }
  });

  const text = await response.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Backend returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(json?.message || json?.error || `HTTP ${response.status}`);
  }

  return json;
}

function TenantContextBar() {
  const location = useLocation();

  const [tenantId, setTenantState] = useState(getTenantId());
  const [manualTenantId, setManualTenantId] = useState(getTenantId());
  const [adminKey, setAdminKey] = useState(getSuperAdminKey());
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const currentTenant = getTenantId();

    setTenantState(currentTenant);
    setManualTenantId(currentTenant);
    setLoading(true);
    setError('');

    try {
      const payload = await apiGet('/api/tenant/subscription/status', {
        tenantId: currentTenant,
        admin: true
      });

      setSubscription(payload.subscription || payload.data?.subscription || payload);
    } catch (err) {
      setSubscription(null);
      setError(err.message || 'Subscription status failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  function switchTenant() {
    const cleanTenant = setTenantId(manualTenantId);
    setSuperAdminKey(adminKey);
    setTenantState(cleanTenant);
    window.location.reload();
  }

  const plan = subscription?.plan || 'UNKNOWN';
  const status = subscription?.status || 'UNKNOWN';
  const access =
    subscription?.access?.accessState ||
    subscription?.accessState ||
    subscription?.access?.status ||
    'UNKNOWN';

  const periodEnd =
    subscription?.currentPeriodEndsAt ||
    subscription?.current_period_ends_at ||
    subscription?.trialEndsAt ||
    subscription?.trial_ends_at;

  const patientLimit =
    subscription?.patientLimit ||
    subscription?.patient_limit ||
    subscription?.limits?.patients ||
    '-';

  const seats =
    subscription?.seats ||
    subscription?.seatLimit ||
    subscription?.seat_limit ||
    subscription?.limits?.seats ||
    '-';

  return (
    <section style={tenantShell}>
      <div style={tenantTop}>
        <div style={tenantTitle}>TENANT CONTEXT SWITCHER</div>

        <div style={badges}>
          <Badge value={`Tenant: ${tenantId}`} />
          <Badge value={`Plan: ${plan}`} />
          <Badge value={`Status: ${status}`} />
          <Badge value={`Access: ${access}`} />
          <Badge value={isCommercialDemoMode() ? 'COMMERCIAL DEMO' : 'NORMAL MODE'} />
          {periodEnd && <span style={periodText}>Period ends: {formatDate(periodEnd)}</span>}
        </div>

        <button type="button" onClick={refresh} style={blueButton}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={tenantGrid}>
        <label style={labelStyle}>
          Tenant ID
          <input
            value={manualTenantId}
            onChange={(event) => setManualTenantId(event.target.value)}
            style={inputStyle}
            placeholder="raftopoulos-live"
          />
        </label>

        <label style={labelStyle}>
          x-super-admin-key
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            style={inputStyle}
            placeholder="Paste SUPER_ADMIN_API_KEY"
          />
        </label>

        <button type="button" onClick={switchTenant} style={darkButton}>
          Switch Tenant
        </button>
      </div>

      {error && <div style={warningBox}>{error}</div>}

      <div style={miniStats}>
        <span>Selected: {tenantId}</span>
        <span>Patient limit: {patientLimit}</span>
        <span>Seats: {seats}</span>
        <span>Backend: {API_BASE}</span>
      </div>
    </section>
  );
}

function NavigationLinks() {
  const demo = isCommercialDemoMode();
  const technicalUnlocked = isTechnicalDemoUnlocked();

  return (
    <nav style={nav}>
      <div style={navGroup}>
        <div style={navTitle}>Presentation</div>

        <Link to="/sales/raftopoulos/executive-demo-home" style={executiveDemoHomeLink}>
          Executive Demo Home
        </Link>

        <Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>

<Link to="/sales/raftopoulos/quality-profit" style={businessLink}>
  Quality & Profit
</Link>

        <Link to="/sales/raftopoulos/pilot-walkthrough-scenario" style={pilotWalkthroughLink}>
          Pilot Walkthrough
        </Link>

        <Link to="/demo/raftopoulos/start" style={launcherLink}>
          Demo Launcher
        </Link>

        <Link to="/demo/raftopoulos/pilot" style={launcherLink}>
          Pilot Launcher
        </Link>

        <Link to="/demo/raftopoulos/decision-room" style={launcherLink}>
          Decision Launcher
        </Link>

        <Link to="/sales/raftopoulos" style={salesLink}>
          Sales Snapshot
        </Link>

        <Link to="/sales/raftopoulos/pilot" style={pilotLink}>
          Pilot Proposal
        </Link>

        <Link to="/sales/raftopoulos/decision-room" style={decisionLink}>
          Decision Room
        </Link>

        <Link to="/sales/raftopoulos/objections" style={objectionLink}>
          Objections
        </Link>

        <Link to="/sales/raftopoulos/pilot-success" style={pilotSuccessLink}>
          Pilot Success
        </Link>

        <Link to="/sales/raftopoulos/pilot-playbook" style={pilotPlaybookLink}>
          Pilot Playbook
        </Link>

        <Link to="/sales/raftopoulos/rollout-roadmap" style={rolloutRoadmapLink}>
          Rollout Roadmap
        </Link>

        <Link to="/sales/raftopoulos/presentation-flow" style={presentationFlowLink}>
          Presentation Flow
        </Link>

        <Link to="/sales/raftopoulos/final-demo-script" style={finalDemoScriptLink}>
          Final Demo Script
        </Link>

        <Link to="/sales/raftopoulos/pilot-approval-decision" style={pilotApprovalDecisionLink}>
          Pilot Approval Decision
        </Link>

        <Link to="/sales/raftopoulos/executive-pilot-close" style={executivePilotCloseLink}>
          Executive Pilot Close
        </Link>

        <Link to="/sales/raftopoulos/executive-leave-behind" style={executiveLeaveBehindLink}>
          Executive Leave-behind
        </Link>

        <Link to="/tenant/statistics" style={statsLink}>
          Statistics
        </Link>

        <Link to="/tenant/statistics/report" style={reportLink}>
          Executive Report
        </Link>

        <Link to="/tenant/business-impact" style={businessLink}>
          Business Impact
        </Link>

        <Link to="/tenant/dashboard" style={navPrimary}>
          Dashboard
        </Link>

<Link to="/patient/dashboard" style={launcherLink}>
  Patient Portal
</Link>

      </div>

      <div style={navGroup}>
        <div style={navTitle}>Platform Operations</div>

        <Link to="/tenant/patients" style={navLink}>
          Patients
        </Link>

        <Link to="/tenant/devices" style={navLink}>
          Devices
        </Link>

        <RuntimeAclNavGate permission={PERMISSIONS.VIEW_PATIENT_SIGNALS}>
  <Link to="/tenant/patient-signals" style={navLink}>
    Patient Signals
  </Link>
</RuntimeAclNavGate>

        <RuntimeAclNavGate permission={PERMISSIONS.VIEW_ATLAS}>
  <Link to="/tenant/atlas" style={navLink}>
    ATLAS
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_ACTION_CENTER}>
  <Link to="/tenant/atlas/action-center" style={navLink}>
    Action Center
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_CLOSED_LOOP}>
  <Link to="/tenant/closed-loop" style={navLink}>
    Closed Loop
  </Link>
</RuntimeAclNavGate>

        <RuntimeAclNavGate permission={PERMISSIONS.VIEW_TASKS}>
  <Link to="/tenant/tasks" style={navLink}>
    Tasks
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_FOLLOWUP}>
  <Link to="/tenant/followup" style={navLink}>
    Follow-up
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_NOTES}>
  <Link to="/tenant/notes" style={navLink}>
    Notes
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_REFERRALS}>
  <Link to="/tenant/referrals" style={navLink}>
    Referrals
  </Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_NOTIFICATIONS}>
  <Link to="/tenant/notifications" style={navLink}>
    Notifications
  </Link>
</RuntimeAclNavGate>
      </div>

      {!demo && (
        <div style={navGroup}>
          <div style={navTitle}>Business</div>
          <Link to="/tenant/payments" style={navLink}>Payments</Link>
          <Link to="/tenant/billing" style={navLink}>Billing</Link>
          <Link to="/tenant/subscription" style={navLink}>Subscription</Link>
          <Link to="/tenant/users" style={navLink}>Users</Link>
          <Link to="/tenant/modules" style={navLink}>Modules</Link>
          <Link to="/tenant/integrations" style={navLink}>Integrations</Link>
          <Link to="/tenant/branding" style={navLink}>Branding</Link>
        </div>
      )}

      {demo && !technicalUnlocked && (
        <div style={clientSafeBox}>
          <div style={clientSafeTitle}>Client-facing mode</div>
          <div style={clientSafeText}>
            This demo is safe for client presentation. Technical pages and internal audits are hidden.
          </div>
        </div>
      )}

      {(!demo || technicalUnlocked) && (
        <div style={navGroup}>
          <div style={navTitle}>Release Gates</div>

          <Link to="/internal/pre-sale-checklist" style={salesLink}>
            Pre-Sale Checklist
          </Link>

          <Link to="/system/release-candidate" style={releaseLink}>
            Release Candidate
          </Link>

          <Link to="/system/route-stability" style={blueLink}>
            Route Stability
          </Link>

          <Link to="/system/saas-stability" style={blueLink}>
            SaaS Audit
          </Link>

          <Link to="/system/production-readiness" style={orangeLink}>
            Production Readiness
          </Link>

          <Link to="/system/tenant-cleanup" style={oliveLink}>
            Tenant Cleanup
          </Link>
        </div>
      )}

      {(!demo || technicalUnlocked) && (
        <div style={navGroup}>
          <div style={navTitle}>Admin/System</div>
          <Link to="/system/security-exposure" style={navLink}>Security</Link>
          <Link to="/system/backend-config" style={navLink}>Backend Config</Link>
          <Link to="/system/database-backup" style={navLink}>DB Backup</Link>
          <Link to="/system/alerts" style={navLink}>Alerts</Link>
          <RuntimeAclNavGate permission={PERMISSIONS.VIEW_SYSTEM}>
  <Link to="/tenant/security" style={purpleLink}>
    Security Center
  </Link>
</RuntimeAclNavGate>
          <RuntimeAclNavGate permission={PERMISSIONS.VIEW_SYSTEM}>
  <Link to="/tenant/security/acl-audit" style={purpleLink}>
    ACL Audit
  </Link>
<RuntimeAclNavGate permission={PERMISSIONS.VIEW_SYSTEM}>
  <Link to="/tenant/security/user-activity" style={purpleLink}>
    User Activity
  </Link>
  <RuntimeAclNavGate permission={PERMISSIONS.VIEW_SYSTEM}>
  <Link to="/tenant/security/failed-logins" style={purpleLink}>
    Failed Logins
  </Link>
</RuntimeAclNavGate>
</RuntimeAclNavGate>
</RuntimeAclNavGate>
         <RuntimeAclNavGate permission={PERMISSIONS.VIEW_SUPER_ADMIN}>
  <Link to="/super-admin/subscriptions" style={purpleLink}>Subscriptions</Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_SUPER_ADMIN}>
  <Link to="/super-admin/tenant-profiles" style={purpleLink}>Tenant Profiles</Link>
</RuntimeAclNavGate>

<RuntimeAclNavGate permission={PERMISSIONS.VIEW_SUPER_ADMIN}>
  <Link to="/super-admin/tenant-provisioning" style={purpleLink}>Tenant Provisioning</Link>
</RuntimeAclNavGate>
        </div>
      )}
    </nav>
  );
}

function TechnicalRoute({ children }) {
  const demo = isCommercialDemoMode();
  const unlocked = isTechnicalDemoUnlocked();

  if (demo && !unlocked) {
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return children;
}

function MetricCard({ label, value, tone = 'default' }) {
  const background =
    tone === 'danger'
      ? '#fff1f2'
      : tone === 'warning'
        ? '#fffbeb'
        : tone === 'success'
          ? '#f0fdf4'
          : '#ffffff';

  const border =
    tone === 'danger'
      ? '#fecdd3'
      : tone === 'warning'
        ? '#fde68a'
        : tone === 'success'
          ? '#bbf7d0'
          : '#e2e8f0';

  return (
    <div
      style={{
        background,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
      }}
    >
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value ?? 0}</div>
    </div>
  );
}

function PageHero({ kicker = 'RAFTOP CPAP CARE Pro', title, subtitle, children }) {
  return (
    <section style={hero}>
      <div style={heroKicker}>{kicker}</div>
      <h1 style={heroTitle}>{title}</h1>
      {subtitle && <p style={heroSubtitle}>{subtitle}</p>}
      {children && <div style={heroActions}>{children}</div>}
    </section>
  );
}

function JsonPanel({ payload }) {
  const demo = isCommercialDemoMode();
  const technicalUnlocked = isTechnicalDemoUnlocked();
  const [open, setOpen] = useState(false);

  if (demo && !technicalUnlocked) {
    return null;
  }

  return (
    <section style={panel}>
      <button type="button" onClick={() => setOpen(!open)} style={smallDarkButton}>
        {open ? 'Hide JSON' : 'Show JSON'}
      </button>

      {open && (
        <pre style={jsonPre}>
          {payload ? JSON.stringify(payload, null, 2) : 'No payload.'}
        </pre>
      )}
    </section>
  );
}

function DataPage({
  title,
  subtitle,
  endpoint,
  rowKeys = [],
  admin = false,
  renderSummary,
  renderRows
}) {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tenantId = getTenantId();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const json = await apiGet(endpoint, {
        tenantId,
        admin
      });

      setPayload(json);
    } catch (err) {
      const message = err.message || 'Request failed.';

      if (
        isCommercialDemoMode() &&
        (
          message.includes('Route not found') ||
          message.includes('Cannot GET') ||
          message.includes('HTTP 404')
        )
      ) {
        setPayload({
          summary: {
            total: 0,
            open: 0,
            warnings: 0,
            failed: 0,
            criticalFailed: 0
          },
          items: [],
          rows: [],
          signals: [],
          tasks: [],
          patients: [],
          devices: [],
          nextBestActions: [],
          blockers: [],
          queue: [],
          cases: [],
          demoSafeFallback: true,
          message: 'Controlled demo fallback: endpoint is not active in this backend environment.'
        });
        setError('');
      } else {
        setPayload(null);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [admin, endpoint, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = filterCommercialRows(safeArray(payload, rowKeys));

  return (
    <main style={page}>
      <PageHero title={title} subtitle={subtitle}>
        <button type="button" onClick={load} style={heroButton}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <Badge value={`Tenant: ${tenantId}`} />
      </PageHero>

      {error && !isCommercialDemoMode() && (
        <section style={errorPanel}>
          <strong>Request Error</strong>
          <div style={{ marginTop: 8 }}>{error}</div>
        </section>
      )}

      {renderSummary ? renderSummary(payload, rows) : <GenericSummary payload={payload} rows={rows} />}

      {renderRows ? renderRows(payload, rows) : <GenericRows rows={rows} />}

      <JsonPanel payload={payload} />
    </main>
  );
}

function GenericSummary({ payload, rows }) {
  const summary = payload?.summary || payload?.data?.summary || {};

  return (
    <section style={metricsGrid}>
      <MetricCard label="Rows" value={rows.length} />
      <MetricCard label="Total" value={summary.total ?? payload?.total ?? '-'} />
      <MetricCard label="Open" value={summary.open ?? '-'} />
      <MetricCard label="Warnings" value={summary.warned ?? summary.warnings ?? '-'} tone="warning" />
      <MetricCard
        label="Failed"
        value={summary.failed ?? 0}
        tone={Number(summary.failed || 0) > 0 ? 'danger' : 'success'}
      />
      <MetricCard
        label="Critical Failed"
        value={summary.criticalFailed ?? 0}
        tone={Number(summary.criticalFailed || 0) > 0 ? 'danger' : 'success'}
      />
    </section>
  );
}

function GenericRows({ rows }) {
  const demo = isCommercialDemoMode();
  const technicalUnlocked = isTechnicalDemoUnlocked();

  return (
    <section style={panel}>
      <h2 style={sectionTitle}>Records</h2>

      {rows.length === 0 ? (
        <div style={emptyBox}>No records to display.</div>
      ) : (
        <div style={cardsGrid}>
          {rows.slice(0, 30).map((row, index) => (
            <div key={row.id || row.tenantId || row.tenant_id || index} style={recordCard}>
              <h3 style={{ margin: 0 }}>
                {row.name ||
                  row.patientName ||
                  row.patient_name ||
                  row.title ||
                  row.displayName ||
                  row.display_name ||
                  row.id ||
                  `Record ${index + 1}`}
              </h3>

              <div style={recordMeta}>
                {row.status && <Badge value={row.status} />}
                {row.severity && <Badge value={row.severity} />}
                {row.plan && <Badge value={row.plan} />}
                {row.type && <Badge value={row.type} />}
                {row.signalType && <Badge value={row.signalType} />}
              </div>

              <CleanRecordView record={row} />

              {(!demo || technicalUnlocked) && (
                <pre style={miniPre}>{JSON.stringify(row, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CleanRecordView({ record }) {
  const fields = [
    ['Patient', record.patientName || record.patient_name || record.name],
    ['Doctor', record.doctorName || record.doctor_name],
    ['Device', record.deviceModel || record.device_model || record.model],
    ['Brand', record.brand],
    ['Serial', record.serialNumber || record.serial_number || record.deviceSerial || record.device_serial],
    ['Email', cleanDemoEmail(record.email || record.patient_email || record.contactEmail)],
    ['Phone', record.phone],
    ['Signal', record.signalType || record.signal_type || record.type],
    ['Priority', record.priority || record.severity],
    ['Status', record.status],
    ['Source', record.source],
    ['Next Action', record.nextBestAction || record.next_best_action || record.metadata?.nextBestAction],
    ['Description', record.description || record.message || record.details],
    ['Created', formatCleanDate(record.createdAt || record.created_at)],
    ['Updated', formatCleanDate(record.updatedAt || record.updated_at)]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '');

  if (fields.length === 0) {
    return (
      <div style={cleanRecordGrid}>
        <div style={cleanField}>
          <div style={cleanLabel}>Record</div>
          <div style={cleanValue}>Available</div>
        </div>
      </div>
    );
  }

  return (
    <div style={cleanRecordGrid}>
      {fields.slice(0, 8).map(([label, value]) => (
        <div key={label} style={cleanField}>
          <div style={cleanLabel}>{label}</div>
          <div style={cleanValue}>{formatCleanValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

function cleanDemoEmail(value) {
  const text = String(value || '');

  if (!text) return '';

  if (isCommercialDemoMode() && text.includes('@patient.local')) {
    return 'masked@patient.gr';
  }

  return text;
}

function formatCleanDate(value) {
  if (!value) return '';

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return String(value);
  }
}

function formatCleanValue(value) {
  if (value === null || value === undefined) return '-';

  if (typeof value === 'object') {
    if (value.nextBestAction) return value.nextBestAction;
    if (value.label) return value.label;
    if (value.name) return value.name;

    return 'Available';
  }

  const text = String(value);

  if (text.length > 120) {
    return `${text.slice(0, 120)}...`;
  }

  return text;
}

function DashboardPage() {
  return (
    <DataPage
      title="Raftopoulos CPAP Care Dashboard"
      subtitle="Commercial overview for CPAP patients, devices, follow-ups, compliance and ATLAS readiness."
      endpoint="/api/tenant/dashboard"
      renderSummary={(payload) => (
        <section style={metricsGrid}>
          <MetricCard label="Patients" value={payload?.patientsCount ?? payload?.patients_count ?? 0} tone="success" />
          <MetricCard label="Doctors" value={payload?.doctorsCount ?? payload?.doctors_count ?? 0} />
          <MetricCard label="Devices" value={payload?.devicesCount ?? payload?.devices_count ?? 0} />
          <MetricCard label="Critical Follow-ups" value={payload?.criticalFollowups ?? payload?.critical_followups ?? 0} tone="warning" />
          <MetricCard label="Pending Tasks" value={payload?.pendingTasks ?? payload?.pending_tasks ?? 0} />
          <MetricCard label="Offline Devices" value={payload?.offlineDevices ?? payload?.offline_devices ?? 0} tone="success" />
        </section>
      )}
      renderRows={() => null}
    />
  );
}

function PatientsPage() {
  return (
    <DataPage
      title="Patients"
      subtitle="Patient portfolio for the Raftopoulos CPAP Care commercial demo."
      endpoint="/api/tenant/patients"
      rowKeys={['patients']}
    />
  );
}

function DevicesPage() {
  return (
    <DataPage
      title="Devices"
      subtitle="CPAP device overview with patient linkage and operational device status."
      endpoint="/api/tenant/devices"
      rowKeys={['devices']}
    />
  );
}

function PatientSignalsPage() {
  return (
    <DataPage
      title="Patient Signals"
      subtitle="ATLAS-driven signals that show which patients need attention first."
      endpoint="/api/tenant/patient-signals"
      rowKeys={['signals']}
    />
  );
}

function AtlasPage() {
  return (
    <DataPage
      title="ATLAS"
      subtitle="Prioritization, risk signals and operational command layer."
      endpoint="/api/tenant/atlas"
      rowKeys={['queue', 'cases', 'tasks', 'signals', 'items']}
    />
  );
}

function AtlasActionCenterPage() {
  return (
    <DataPage
      title="ATLAS Action Center"
      subtitle="Unified escalation surface for patient signals, tasks and next best actions."
      endpoint="/api/tenant/atlas/action-center"
      rowKeys={['items', 'actions', 'tasks', 'signals', 'queue', 'rows']}
    />
  );
}

function ClosedLoopPage() {
  return (
    <DataPage
      title="Closed Loop Control Hub"
      subtitle="Verification, remediation, blockers and release-safe operational readiness."
      endpoint="/api/tenant/closed-loop/control-summary"
      rowKeys={['nextBestActions', 'blockers']}
    />
  );
}

function ReleaseCandidatePage() {
  return (
    <DataPage
      title="Final Release Candidate Checklist"
      subtitle="Final commercial demo gate for the active tenant."
      endpoint="/api/system/release-candidate-audit"
      admin
      rowKeys={['checks']}
    />
  );
}

function GenericEndpointPage({ title, subtitle, endpoint, admin = false }) {
  return (
    <DataPage
      title={title}
      subtitle={subtitle}
      endpoint={endpoint}
      admin={admin}
      rowKeys={[
        'checks',
        'results',
        'alerts',
        'history',
        'items',
        'subscriptions',
        'profiles',
        'tasks',
        'notes',
        'referrals',
        'notifications',
        'followups',
        'followUps',
        'rows'
      ]}
    />
  );
}

function NotFoundPage() {
  return (
    <main style={page}>
      <section style={panel}>
        <h1>Route not found</h1>
        <p style={{ color: '#64748b' }}>
          This frontend route is not registered in the clean commercial demo App.js.
        </p>
        <Link to="/sales/raftopoulos/executive-demo-home" style={launcherLink}>
          Go to Executive Demo Home
        </Link>
      </section>
    </main>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/sales/raftopoulos/executive-demo-home" replace />} />

      {DemoRoutes()}

      {SalesRoutes()}

      {TenantRoutes({
        DashboardPage,
        TenantStatisticsPage,
        TenantExecutiveStatisticsReportPage,
        TenantBusinessImpactPage,
        PatientsPage,
        DevicesPage,
        PatientSignalsPage,
        AtlasPage,
        AtlasActionCenterPage,
        ClosedLoopPage,
        GenericEndpointPage
      })}

{PatientRoutes()}

      <Route path="/tenant/payments" element={<GenericEndpointPage title="Payments" subtitle="Payments." endpoint="/api/tenant/payments" />} />
      <Route path="/tenant/billing" element={<GenericEndpointPage title="Billing" subtitle="Billing." endpoint="/api/tenant/billing" />} />
      <Route path="/tenant/users" element={<GenericEndpointPage title="Users" subtitle="Users." endpoint="/api/tenant/users" />} />
      <Route path="/tenant/modules" element={<GenericEndpointPage title="Modules" subtitle="Modules." endpoint="/api/tenant/modules" />} />
      <Route path="/tenant/integrations" element={<GenericEndpointPage title="Integrations" subtitle="Integrations." endpoint="/api/tenant/integrations" />} />
      <Route path="/tenant/branding" element={<GenericEndpointPage title="Branding" subtitle="Tenant branding configuration." endpoint="/api/tenant/branding" />} />
     <Route path="/sales/raftopoulos/executive-demo-home" element={<RaftopoulosExecutiveDemoHomePage />} />
    <Route path="/sales/raftopoulos/quality-profit" element={<RaftopoulosQualityProfitExcellencePage />} />
      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />
      <Route path="/sales/raftopoulos/pilot-walkthrough-scenario" element={<RaftopoulosPilotWalkthroughScenarioPage />} />
      <Route path="/sales/raftopoulos/pilot-walkthrough" element={<Navigate to="/sales/raftopoulos/pilot-walkthrough-scenario" replace />} />
      <Route path="/super-admin/tenant-provisioning" element={<SuperAdminTenantProvisioningPage />} />
      <Route path="/sales/raftopoulos/pilot-demo" element={<PilotDemoDashboardPage />} />
      {SystemRoutes({
  ReleaseCandidatePage,
  GenericEndpointPage
})}

{SuperAdminRoutes({
  GenericEndpointPage
})}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const token = getFrontendAuthToken();
  const pathname = location?.pathname || '/';
  const search = location?.search || '';
  const isLoginPath = pathname === '/login' || pathname.startsWith('/login/');

  if (!token && !isLoginPath) {
    try {
      localStorage.setItem('raftop_redirect_after_login', pathname + search);
    } catch (error) {
      // Ignore localStorage write errors.
    }

    return <Navigate to="/login" replace />;
  }

  return (
    <TenantRuntimeProvider>
      <div style={appShell}>
        <TenantContextBar />

        <main style={main}>
          <CommercialDemoBanner />
          <TenantBrandBanner />
          <ExecutiveKpiRibbon />
          {isTechnicalDemoUnlocked() && (
  <>
    <RuntimeRoleSwitcher />
    <RuntimeAclStatusPanel />
  </>
)}
          <NavigationLinks />
          <AppRoutes />
        </main>
      </div>
    </TenantRuntimeProvider>
  );
}

export default function App() {
  const insideRouter = useInRouterContext();

  if (insideRouter) return <AppShell />;

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

const appShell = {
  minHeight: '100vh',
  background: '#f8fafc',
  color: '#0f172a',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
};

const main = {
  maxWidth: 1540,
  margin: '0 auto',
  padding: '18px 24px 50px'
};

const tenantShell = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  padding: '12px 20px',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
};

const tenantTop = {
  maxWidth: 1540,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap'
};

const tenantTitle = {
  color: '#1d4ed8',
  fontWeight: 1000,
  fontSize: 13,
  letterSpacing: '0.14em'
};

const badges = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const periodText = {
  color: '#334155',
  fontWeight: 800,
  fontSize: 13
};

const tenantGrid = {
  maxWidth: 1540,
  margin: '12px auto 0',
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) minmax(300px, 1.4fr) auto',
  gap: 10,
  alignItems: 'end'
};

const miniStats = {
  maxWidth: 1540,
  margin: '10px auto 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 8,
  padding: 10,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#334155',
  fontSize: 13,
  fontWeight: 800
};

const labelStyle = {
  display: 'grid',
  gap: 6,
  color: '#334155',
  fontSize: 12,
  fontWeight: 900
};

const inputStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '11px 12px',
  color: '#0f172a',
  fontWeight: 800,
  outline: 'none'
};

const warningBox = {
  maxWidth: 1540,
  margin: '10px auto 0',
  background: '#fffbeb',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 14,
  padding: 12,
  fontWeight: 800
};

const nav = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
  margin: '18px 0'
};

const navGroup = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 14,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignContent: 'flex-start',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
};

const clientSafeBox = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: 18,
  padding: 16,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)'
};

const clientSafeTitle = {
  color: '#065f46',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 6
};

const clientSafeText = {
  color: '#047857',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.45
};

const navTitle = {
  width: '100%',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 4
};

const linkBase = {
  display: 'inline-block',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 900
};

const executiveDemoHomeLink = {
  ...linkBase,
  background: '#0f172a'
};

const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};

const pilotWalkthroughLink = {
  ...linkBase,
  background: '#0e7490'
};

const launcherLink = {
  ...linkBase,
  background: '#0f766e'
};

const salesLink = {
  ...linkBase,
  background: '#0f172a'
};

const pilotLink = {
  ...linkBase,
  background: '#be123c'
};

const decisionLink = {
  ...linkBase,
  background: '#065f46'
};

const objectionLink = {
  ...linkBase,
  background: '#b91c1c'
};

const pilotSuccessLink = {
  ...linkBase,
  background: '#0369a1'
};

const pilotPlaybookLink = {
  ...linkBase,
  background: '#0f766e'
};

const rolloutRoadmapLink = {
  ...linkBase,
  background: '#7c2d12'
};

const presentationFlowLink = {
  ...linkBase,
  background: '#581c87'
};

const finalDemoScriptLink = {
  ...linkBase,
  background: '#312e81'
};

const pilotApprovalDecisionLink = {
  ...linkBase,
  background: '#065f46'
};

const executivePilotCloseLink = {
  ...linkBase,
  background: '#047857'
};

const executiveLeaveBehindLink = {
  ...linkBase,
  background: '#0f766e'
};

const statsLink = {
  ...linkBase,
  background: '#1d4ed8'
};

const reportLink = {
  ...linkBase,
  background: '#4338ca'
};

const businessLink = {
  ...linkBase,
  background: '#15803d'
};

const navPrimary = {
  ...linkBase,
  background: '#0f766e'
};

const navLink = {
  ...linkBase,
  background: '#334155'
};

const blueLink = {
  ...linkBase,
  background: '#2563eb'
};

const orangeLink = {
  ...linkBase,
  background: '#d97706'
};

const oliveLink = {
  ...linkBase,
  background: '#3f6212'
};

const releaseLink = {
  ...linkBase,
  background: '#be123c'
};

const purpleLink = {
  ...linkBase,
  background: '#7c3aed'
};

const blueButton = {
  border: 0,
  background: '#2563eb',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const darkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const smallDarkButton = {
  border: 0,
  background: '#0f172a',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: 12,
  fontWeight: 900,
  cursor: 'pointer'
};

const page = {
  display: 'grid',
  gap: 18
};

const hero = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #14b8a6 100%)',
  color: '#ffffff',
  borderRadius: 28,
  padding: 32,
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)'
};

const heroKicker = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.18em',
  opacity: 0.9
};

const heroTitle = {
  margin: '12px 0 8px',
  fontSize: 36,
  lineHeight: 1.1
};

const heroSubtitle = {
  margin: 0,
  maxWidth: 980,
  color: 'rgba(255,255,255,0.88)',
  fontWeight: 600
};

const heroActions = {
  marginTop: 20,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap'
};

const heroButton = {
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.15)',
  color: '#ffffff',
  borderRadius: 14,
  padding: '10px 16px',
  fontWeight: 900,
  cursor: 'pointer'
};

const panel = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)'
};

const errorPanel = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 20,
  padding: 18,
  fontWeight: 800
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 16
};

const metricLabel = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metricValue = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 30,
  fontWeight: 1000
};

const sectionTitle = {
  margin: '0 0 14px',
  fontSize: 22
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
  color: '#64748b',
  fontWeight: 800
};

const cardsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 14
};

const recordCard = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16
};

const recordMeta = {
  marginTop: 10,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  color: '#475569',
  fontSize: 13,
  fontWeight: 800
};

const cleanRecordGrid = {
  marginTop: 14,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10
};

const cleanField = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 12
};

const cleanLabel = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6
};

const cleanValue = {
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1.35,
  wordBreak: 'break-word'
};

const jsonPre = {
  marginTop: 16,
  background: '#020617',
  color: '#e2e8f0',
  padding: 18,
  borderRadius: 16,
  overflow: 'auto',
  maxHeight: 620,
  fontSize: 12,
  lineHeight: 1.45
};

const miniPre = {
  marginTop: 12,
  background: '#f8fafc',
  color: '#334155',
  padding: 12,
  borderRadius: 12,
  overflow: 'auto',
  maxHeight: 220,
  fontSize: 11
};


