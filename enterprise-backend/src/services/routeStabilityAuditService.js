const DEFAULT_TIMEOUT_MS = 12000;

function getNodeEnv() {
  return String(process.env.NODE_ENV || 'development').toLowerCase();
}

function getBaseUrl(req) {
  const nodeEnv = getNodeEnv();

  if (nodeEnv !== 'production') {
    const port = process.env.PORT || 5001;
    return `http://localhost:${port}`;
  }

  const fromEnv =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_INTERNAL_URL ||
    process.env.PUBLIC_BACKEND_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    '';

  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, '');
  }

  const port = process.env.PORT || 5001;
  return `http://localhost:${port}`;
}

function normalizeTenantId(value) {
  return String(value || 'demo-tenant')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'demo-tenant';
}

function getTenantId(req) {
  return normalizeTenantId(
    req.headers['x-tenant-id'] ||
      req.headers['x-tenant'] ||
      req.query.tenantId ||
      req.query.tenant_id ||
      'demo-tenant'
  );
}

function getSuperAdminKey(req) {
  return (
    req.headers['x-super-admin-key'] ||
    process.env.SUPER_ADMIN_API_KEY ||
    ''
  );
}

function buildCheck({
  group,
  name,
  method = 'GET',
  path,
  status,
  critical = false,
  message,
  durationMs = null,
  details = {},
  nextAction = null
}) {
  return {
    group,
    name,
    method,
    path,
    status,
    critical: critical === true,
    message,
    durationMs,
    details,
    nextAction,
    generatedAt: new Date().toISOString()
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();

    let json = null;
    let parseFailed = false;

    try {
      json = text ? JSON.parse(text) : null;
    } catch (error) {
      parseFailed = true;
    }

    return {
      ok: response.ok,
      statusCode: response.status,
      json,
      text,
      parseFailed,
      error: null,
      timedOut: false,
      durationMs: Date.now() - startedAt
    };
  } catch (error) {
    const timedOut =
      error.name === 'AbortError' ||
      String(error.message || '').toLowerCase().includes('aborted');

    return {
      ok: false,
      statusCode: 0,
      json: null,
      text: '',
      parseFailed: false,
      error: error.message || String(error),
      timedOut,
      durationMs: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyResponse({ route, response }) {
  const responseText = String(response.text || '');
  const responseMessage = String(
    response.json?.message ||
      response.json?.error ||
      response.error ||
      ''
  );

  const routeNotFound =
    response.statusCode === 404 ||
    /route not found/i.test(responseText) ||
    /route not found/i.test(responseMessage);

  const tenantContextMissing =
    response.statusCode === 400 &&
    (
      /TENANT_CONTEXT_REQUIRED/i.test(responseText) ||
      /tenant context is required/i.test(responseText) ||
      /TENANT_CONTEXT_REQUIRED/i.test(responseMessage) ||
      /tenant context is required/i.test(responseMessage)
    );

  const fallbackDetected =
    response.json?.fallback === true ||
    /fallback/i.test(responseText) ||
    /mock/i.test(responseText);

  if (response.timedOut) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: 'Route check timed out.',
      tags: {
        timedOut: true,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (response.error) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: response.error,
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (tenantContextMissing) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: 'Tenant context was required but not accepted by the checked route.',
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: true,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (routeNotFound) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: 'Route returned 404 / route not found.',
      tags: {
        timedOut: false,
        routeNotFound: true,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (response.statusCode >= 500) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: `Route returned server error HTTP ${response.statusCode}.`,
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: true
      }
    };
  }

  if (response.parseFailed) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message: 'Route returned non-JSON response.',
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (!response.ok) {
    return {
      status: route.critical ? 'FAIL' : 'WARN',
      message:
        response.json?.message ||
        response.json?.error ||
        `Route returned HTTP ${response.statusCode}.`,
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: false,
        serverError: false
      }
    };
  }

  if (fallbackDetected && route.critical) {
    return {
      status: 'WARN',
      message: 'Route returned OK but fallback/mock data was detected.',
      tags: {
        timedOut: false,
        routeNotFound: false,
        tenantContextMissing: false,
        fallbackDetected: true,
        serverError: false
      }
    };
  }

  return {
    status: fallbackDetected ? 'WARN' : 'PASS',
    message: fallbackDetected
      ? 'Route returned OK with fallback/mock indicators.'
      : 'Route returned 200 OK.',
    tags: {
      timedOut: false,
      routeNotFound: false,
      tenantContextMissing: false,
      fallbackDetected,
      serverError: false
    }
  };
}

function buildRoutes({ tenantId }) {
  return [
    {
      group: 'system',
      name: 'Backend Health',
      method: 'GET',
      path: '/api/health',
      critical: true,
      auth: 'none'
    },

    {
      group: 'tenant',
      name: 'Tenant Dashboard',
      method: 'GET',
      path: '/api/tenant/dashboard',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'tenant',
      name: 'Tenant Patients',
      method: 'GET',
      path: '/api/tenant/patients',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'tenant',
      name: 'Tenant Devices',
      method: 'GET',
      path: '/api/tenant/devices',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'tenant',
      name: 'Patient Signals',
      method: 'GET',
      path: '/api/tenant/patient-signals',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'tenant',
      name: 'Unified Tasks',
      method: 'GET',
      path: '/api/tenant/tasks-unified',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'atlas',
      name: 'ATLAS Main',
      method: 'GET',
      path: '/api/tenant/atlas',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'atlas',
      name: 'ATLAS Action Center',
      method: 'GET',
      path: '/api/tenant/atlas/action-center',
      critical: true,
      auth: 'tenant'
    },
    {
      group: 'closed_loop',
      name: 'Closed Loop Control Summary',
      method: 'GET',
      path: '/api/tenant/closed-loop/control-summary',
      critical: true,
      auth: 'tenant'
    },

    {
      group: 'business',
      name: 'Tenant Notes',
      method: 'GET',
      path: '/api/tenant/notes',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Referrals',
      method: 'GET',
      path: '/api/tenant/referrals',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Followup',
      method: 'GET',
      path: '/api/tenant/followup',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Notifications',
      method: 'GET',
      path: '/api/tenant/notifications',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Payments',
      method: 'GET',
      path: '/api/tenant/payments',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Users',
      method: 'GET',
      path: '/api/tenant/users',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Billing',
      method: 'GET',
      path: '/api/tenant/billing',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Modules',
      method: 'GET',
      path: '/api/tenant/modules',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Integrations',
      method: 'GET',
      path: '/api/tenant/integrations',
      critical: false,
      auth: 'tenant'
    },
    {
      group: 'business',
      name: 'Tenant Branding',
      method: 'GET',
      path: '/api/tenant/branding',
      critical: false,
      auth: 'tenant'
    },

    {
      group: 'system',
      name: 'System Alerts',
      method: 'GET',
      path: '/api/system/alerts',
      critical: false,
      auth: 'admin'
    },
    {
      group: 'system',
      name: 'System Monitoring History',
      method: 'GET',
      path: '/api/system/monitoring/history',
      critical: false,
      auth: 'admin'
    },

    {
      group: 'super_admin',
      name: 'Super Admin Subscriptions',
      method: 'GET',
      path: '/api/super-admin/subscriptions',
      critical: false,
      auth: 'admin'
    },
    {
      group: 'super_admin',
      name: 'Super Admin Tenant Profiles',
      method: 'GET',
      path: '/api/super-admin/tenant-profiles',
      critical: false,
      auth: 'admin'
    }
  ].map((route) => ({
    ...route,
    tenantId
  }));
}

function buildHeaders({ route, tenantId, superAdminKey }) {
  const headers = {
    Accept: 'application/json'
  };

  if (route.auth === 'tenant' || route.auth === 'admin') {
    headers['x-tenant-id'] = tenantId;
  }

  if (route.auth === 'admin') {
    headers['x-super-admin-key'] = superAdminKey;
  }

  return headers;
}

function trimPreview(value) {
  const text = String(value || '');

  if (text.length <= 800) return text;

  return `${text.slice(0, 800)}...`;
}

async function runOneRoute({ baseUrl, route, tenantId, superAdminKey }) {
  const headers = buildHeaders({
    route,
    tenantId,
    superAdminKey
  });

  const response = await fetchWithTimeout(`${baseUrl}${route.path}`, {
    method: route.method || 'GET',
    headers
  });

  const classification = classifyResponse({
    route,
    response
  });

  return buildCheck({
    group: route.group,
    name: route.name,
    method: route.method,
    path: route.path,
    status: classification.status,
    critical: route.critical,
    message: classification.message,
    durationMs: response.durationMs,
    details: {
      auth: route.auth,
      tenantId,
      statusCode: response.statusCode,
      tags: classification.tags,
      phase: response.json?.phase || null,
      source: response.json?.source || null,
      fallback: response.json?.fallback || false,
      responseMessage: response.json?.message || response.json?.error || null,
      preview: trimPreview(response.text)
    },
    nextAction:
      classification.status === 'PASS'
        ? null
        : route.critical
          ? 'Fix this critical route before Release Candidate can pass.'
          : 'Review this non-critical route warning before production.'
  });
}

function buildSummary(checks) {
  return {
    total: checks.length,
    passed: checks.filter((check) => check.status === 'PASS').length,
    warned: checks.filter((check) => check.status === 'WARN').length,
    failed: checks.filter((check) => check.status === 'FAIL').length,
    criticalFailed: checks.filter((check) => check.status === 'FAIL' && check.critical).length,
    criticalWarnings: checks.filter((check) => check.status === 'WARN' && check.critical).length,
    routeNotFound: checks.filter((check) => check.details?.tags?.routeNotFound).length,
    serverErrors: checks.filter((check) => check.details?.tags?.serverError).length,
    tenantContextFailures: checks.filter((check) => check.details?.tags?.tenantContextMissing).length,
    fallbackDetected: checks.filter((check) => check.details?.tags?.fallbackDetected).length,
    slowRoutes: checks.filter((check) => Number(check.durationMs || 0) > 2500).length,
    tenantCriticalFailures: checks.filter(
      (check) => check.group === 'tenant' && check.status === 'FAIL' && check.critical
    ).length,
    atlasCriticalFailures: checks.filter(
      (check) => check.group === 'atlas' && check.status === 'FAIL' && check.critical
    ).length,
    closedLoopCriticalFailures: checks.filter(
      (check) => check.group === 'closed_loop' && check.status === 'FAIL' && check.critical
    ).length
  };
}

function buildNextBestActions(checks, summary) {
  const actions = [];

  for (const check of checks.filter((item) => item.status === 'FAIL' && item.critical).slice(0, 8)) {
    actions.push({
      priority: 'HIGH',
      type: 'ROUTE_STABILITY_BLOCKER',
      title: `Fix route: ${check.name}`,
      description: `${check.method} ${check.path} — ${check.message}`
    });
  }

  for (const check of checks.filter((item) => item.status === 'WARN').slice(0, 8)) {
    actions.push({
      priority: check.critical ? 'HIGH' : 'MEDIUM',
      type: check.critical ? 'CRITICAL_ROUTE_WARNING' : 'ROUTE_WARNING',
      title: `Review route: ${check.name}`,
      description: `${check.method} ${check.path} — ${check.message}`
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'ROUTE_STABILITY_READY',
      title: 'Route layer is stable',
      description: 'All audited routes returned stable responses.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'ROUTE_STABILITY_READY_WITH_WARNINGS',
      title: 'Route layer is usable with warnings',
      description: 'No critical route failed, but warnings should be reviewed before production.'
    });
  }

  return actions;
}

async function runRouteStabilityAudit(req) {
  const tenantId = getTenantId(req);
  const superAdminKey = getSuperAdminKey(req);
  const baseUrl = getBaseUrl(req);
  const nodeEnv = getNodeEnv();

  const routes = buildRoutes({
    tenantId
  });

  const checks = [];

  for (const route of routes) {
    checks.push(
      await runOneRoute({
        baseUrl,
        route,
        tenantId,
        superAdminKey
      })
    );
  }

  const summary = buildSummary(checks);

  const readinessStatus =
    summary.criticalFailed > 0
      ? 'BLOCKED'
      : summary.failed > 0
        ? 'NEEDS_FIX'
        : summary.warned > 0
          ? 'NEEDS_ATTENTION'
          : 'READY';

  return {
    ok: summary.criticalFailed === 0,
    fallback: false,
    source: 'runtime-route-stability-audit',
    phase: '23.9A-route-stability-tenant-context-safe',
    tenantId,
    baseUrl,
    nodeEnv,
    readinessStatus,
    summary,
    checks,
    results: checks,
    nextBestActions: buildNextBestActions(checks, summary),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runRouteStabilityAudit
};