import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const TenantRuntimeContext = createContext(null);

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

function readTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'raftopoulos-live'
  );
}

function writeTenantId(value) {
  const clean = String(value || '').trim();

  if (clean) {
    localStorage.setItem('tenant_id', clean);
    localStorage.setItem('tenantId', clean);
  }

  return clean;
}

const fallbackContext = {
  tenantId: 'raftopoulos-live',

  identity: {
    tenantId: 'raftopoulos-live',
    companyName: 'Raftopoulos',
    platformName: 'Raftopoulos CPAP Care'
  },

  plan: {
    code: 'professional',
    status: 'active',
    accessState: 'active'
  },

  branding: {
    platformName: 'Raftopoulos CPAP Care',
    shortName: 'RAFTOP',
    logoText: 'RAFTOP',
    logoIcon: 'RC',
    primaryColor: '#1d4ed8',
    secondaryColor: '#0f766e',
    accentColor: '#0f172a',
    supportEmail: 'support@raftop.local',
    supportPhone: '+30 210 0000000',
    landingTitle: 'Enterprise CPAP Care Intelligence',
    landingSubtitle:
      'Operational CPAP care platform for distributors, clinics and sleep medicine teams.',
    whiteLabelReady: true,
    executiveMode: true
  },

  modules: {
    atlas: true,
    actionCenter: true,
    closedLoop: true,
    executiveMetrics: true,
    rolloutRoadmap: true
  },

  limits: {
    patients: 500,
    users: 15,
    devices: 1000
  },

  entitlements: {
    canUseAtlas: true,
    canUseActionCenter: true,
    canUseClosedLoop: true,
    canUseExecutiveMetrics: true,
    canUseRolloutRoadmap: true,
    canProvisionPatients: true,
    canInviteUsers: true
  },

  access: {
    allowed: true,
    state: 'active',
    reason: null
  }
};

export function TenantRuntimeProvider({ children }) {
  const [tenantId, setTenantId] = useState(readTenantId());
  const [context, setContext] = useState(fallbackContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);

  const refresh = useCallback(
    async (overrideTenantId) => {
      const resolvedTenantId =
        overrideTenantId || tenantId || 'raftopoulos-live';

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE}/api/tenant/context`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'x-tenant-id': resolvedTenantId
            }
          }
        );

        const payload = await response.json();

        if (!response.ok || payload.ok !== true) {
          throw new Error(
            payload?.message ||
              payload?.error ||
              'Tenant runtime context request failed.'
          );
        }

        setTenantId(resolvedTenantId);
        writeTenantId(resolvedTenantId);

        setContext(payload.context || fallbackContext);
        setFallback(payload.fallback === true);
      } catch (err) {
        setContext({
          ...fallbackContext,
          tenantId: resolvedTenantId
        });

        setFallback(true);

        setError(
          err?.message ||
            'Tenant runtime context unavailable.'
        );
      } finally {
        setLoading(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    refresh(tenantId);
  }, [tenantId, refresh]);

  const switchTenant = useCallback(
    async (nextTenantId) => {
      const clean = String(nextTenantId || '').trim();

      if (!clean) return;

      writeTenantId(clean);
      await refresh(clean);
    },
    [refresh]
  );

  const value = useMemo(() => {
    const branding = context.branding || {};
    const modules = context.modules || {};
    const limits = context.limits || {};
    const entitlements = context.entitlements || {};
    const access = context.access || {};
    const plan = context.plan || {};
    const identity = context.identity || {};

    return {
      tenantId,
      setTenantId: switchTenant,

      context,

      identity,
      plan,
      branding,
      modules,
      limits,
      entitlements,
      access,

      loading,
      error,
      fallback,

      isActive:
        access.allowed !== false &&
        plan.status !== 'disabled',

      canUseAtlas:
        entitlements.canUseAtlas !== false,

      canUseExecutiveMetrics:
        entitlements.canUseExecutiveMetrics !== false,

      canUseClosedLoop:
        entitlements.canUseClosedLoop !== false,

      refresh
    };
  }, [
    tenantId,
    context,
    loading,
    error,
    fallback,
    switchTenant,
    refresh
  ]);

  return (
    <TenantRuntimeContext.Provider value={value}>
      {children}
    </TenantRuntimeContext.Provider>
  );
}

export function useTenantRuntime() {
  const value = useContext(TenantRuntimeContext);

  if (!value) {
    throw new Error(
      'useTenantRuntime must be used inside TenantRuntimeProvider'
    );
  }

  return value;
}

export default TenantRuntimeContext;