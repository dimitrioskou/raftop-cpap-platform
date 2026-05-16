const DEFAULT_TIMEOUT_MS = 5000;

function normalizeTenantId(value) {
  return String(value || 'demo-tenant')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'demo-tenant';
}

function getBaseUrl(req) {
  const fromEnv = process.env.INTERNAL_BACKEND_URL || process.env.BACKEND_INTERNAL_URL;

  if (fromEnv) {
    return String(fromEnv).replace(/\/$/, '');
  }

  const port = process.env.PORT || 5001;

  return `http://localhost:${port}`;
}

function getSuperAdminKey(req) {
  return (
    req.headers['x-super-admin-key'] ||
    process.env.SUPER_ADMIN_API_KEY ||
    ''
  );
}

function previewText(value, max = 700) {
  const text = String(value || '');

  if (text.length <= max) return text;

  return `${text.slice(0, max)}...`;
}

function includesBadRouteText(value) {
  const text = String(value || '');

  return /route not found/i.test(text) || /cannot get/i.test(text);
}

function includesExplicitFallbackText(value) {
  const text = String(value || '').toLowerCase();

  if (!text) return false;

  return (
    text.includes('fallback mode') ||
    text.includes('fallback response') ||
    text.includes('fallback data') ||
    text.includes('mock response') ||
    text.includes('mock data') ||
    text.includes('not db-backed') ||
    text.includes('not database-backed')
  );
}

function includesExplicitMockText(value) {
  const text = String(value || '').toLowerCase();

  if (!text) return false;

  return (
    text.includes('mock response') ||
    text.includes('mock data') ||
    text.includes('mock mode') ||
    text.includes('placeholder response')
  );
}

function detectNestedFallbackSignals(json) {
  const flags = [];

  if (!json || typeof json !== 'object') {
    return flags;
  }

  if (json.fallback === true) {
    flags.push('FALLBACK_DETECTED');
  }

  if (String(json.source || '').toLowerCase().includes('fallback')) {
    flags.push('FALLBACK_SOURCE');
  }

  if (includesExplicitFallbackText(json.message)) {
    flags.push('FALLBACK_MESSAGE');
  }

  if (includesExplicitMockText(json.message)) {
    flags.push('MOCK_MESSAGE');
  }

  /**
   * Route stability audit has its own summary.fallbackDetected.
   * Only trust numeric fallbackDetected > 0, not the existence of fallback:false text.
   */
  if (
    json.summary &&
    typeof json.summary === 'object' &&
    Number(json.summary.fallbackDetected || 0) > 0
  ) {
    flags.push('NESTED_AUDIT_FALLBACK_DETECTED');
  }

  /**
   * Some routes return arrays of results with flags.
   * Count fallback only if a child result explicitly says fallback was detected.
   */
  if (Array.isArray(json.results)) {
    const childHasFallback = json.results.some((item) => {
      if (!item || typeof item !== 'object') return false;

      const childFlags = Array.isArray(item.flags) ? item.flags : [];

      return (
        item.fallback === true ||
        childFlags.includes('FALLBACK_DETECTED') ||
        childFlags.includes('FALLBACK_SOURCE') ||
        childFlags.includes('FALLBACK_MESSAGE') ||
        childFlags.includes('NESTED_AUDIT_FALLBACK_DETECTED')
      );
    });

    if (childHasFallback) {
      flags.push('CHILD_RESULT_FALLBACK_DETECTED');
    }
  }

  return flags;
}

function detectProblemFlags({ statusCode, json, text, timedOut, parseFailed, networkError }) {
  const flags = [];

  const safeMessage = String(json?.message || '');
  const safeError = String(json?.error || '');
  const safeSource = String(json?.source || '');

  if (timedOut) flags.push('TIMEOUT');

  if (networkError) flags.push('NETWORK_ERROR');

  if (statusCode === 404) flags.push('ROUTE_NOT_FOUND');

  if (statusCode >= 500) flags.push('SERVER_ERROR');

  if (statusCode === 401 || statusCode === 403) flags.push('AUTH_FAILED');

  if (parseFailed) flags.push('NON_JSON_RESPONSE');

  if (json?.ok === false) flags.push('OK_FALSE');

  if (includesBadRouteText(safeMessage) || includesBadRouteText(safeError)) {
    flags.push('ROUTE_NOT_FOUND_MESSAGE');
  }

  if (/cannot get/i.test(safeMessage) || /cannot get/i.test(safeError)) {
    flags.push('CANNOT_GET_MESSAGE');
  }

  /**
   * Important:
   * Do NOT scan the entire raw JSON text for the word "fallback".
   * Every healthy endpoint returns `"fallback": false`, and that caused false positives.
   */
  const fallbackFlags = detectNestedFallbackSignals(json);
  flags.push(...fallbackFlags);

  if (includesExplicitFallbackText(safeMessage) || includesExplicitFallbackText(safeError)) {
    flags.push('FALLBACK_TEXT');
  }

  if (safeSource.toLowerCase().includes('mock')) {
    flags.push('MOCK_SOURCE');
  }

  if (includesExplicitMockText(safeMessage) || includesExplicitMockText(safeError)) {
    flags.push('MOCK_TEXT');
  }

  /**
   * Only use raw text for route/non-JSON diagnostics, not fallback detection.
   */
  if (!json && includesBadRouteText(text)) {
    flags.push('ROUTE_TEXT_DETECTED');
  }

  return Array.from(new Set(flags));
}

function classifyAuditResult({ statusCode, critical, flags, json }) {
  const hasHardFailure =
    flags.includes('TIMEOUT') ||
    flags.includes('NETWORK_ERROR') ||
    flags.includes('ROUTE_NOT_FOUND') ||
    flags.includes('ROUTE_NOT_FOUND_MESSAGE') ||
    flags.includes('CANNOT_GET_MESSAGE') ||
    flags.includes('ROUTE_TEXT_DETECTED') ||
    flags.includes('SERVER_ERROR') ||
    flags.includes('NON_JSON_RESPONSE') ||
    flags.includes('OK_FALSE');

  const hasWarning =
    flags.includes('FALLBACK_DETECTED') ||
    flags.includes('FALLBACK_SOURCE') ||
    flags.includes('FALLBACK_MESSAGE') ||
    flags.includes('FALLBACK_TEXT') ||
    flags.includes('NESTED_AUDIT_FALLBACK_DETECTED') ||
    flags.includes('CHILD_RESULT_FALLBACK_DETECTED') ||
    flags.includes('MOCK_SOURCE') ||
    flags.includes('MOCK_MESSAGE') ||
    flags.includes('MOCK_TEXT');

  if (hasHardFailure) {
    return 'FAIL';
  }

  if (statusCode < 200 || statusCode >= 300) {
    return critical ? 'FAIL' : 'WARN';
  }

  if (
    json?.readinessStatus &&
    String(json.readinessStatus).toUpperCase() !== 'READY'
  ) {
    return 'WARN';
  }

  if (hasWarning) {
    return 'WARN';
  }

  return 'PASS';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
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
      timedOut: false,
      statusCode: response.status,
      text,
      json,
      parseFailed,
      networkError: null
    };
  } catch (error) {
    const isAbort =
      error.name === 'AbortError' ||
      String(error.message || '').toLowerCase().includes('aborted');

    return {
      timedOut: isAbort,
      statusCode: 0,
      text: '',
      json: null,
      parseFailed: false,
      networkError: error.message || String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildTests({ tenantId, superAdminKey }) {
  const tenantHeaders = {
    Accept: 'application/json',
    'x-tenant-id': tenantId
  };

  const superAdminHeaders = {
    Accept: 'application/json',
    'x-super-admin-key': superAdminKey
  };

  return [
    {
      group: 'system',
      name: 'Backend Health',
      method: 'GET',
      path: '/api/health',
      critical: true,
      headers: {
        Accept: 'application/json'
      }
    },
    {
      group: 'tenant',
      name: 'Tenant Subscription Status',
      method: 'GET',
      path: '/api/tenant/subscription/status',
      critical: true,
      headers: tenantHeaders
    },
    {
      group: 'tenant',
      name: 'Tenant Subscription Overview',
      method: 'GET',
      path: '/api/tenant/subscription/overview',
      critical: true,
      headers: tenantHeaders
    },
    {
      group: 'tenant',
      name: 'Tenant Subscription Guard Events',
      method: 'GET',
      path: '/api/tenant/subscription/guard-events?limit=20',
      critical: false,
      headers: tenantHeaders
    },
    {
      group: 'tenant',
      name: 'Tenant Plan Limit Events',
      method: 'GET',
      path: '/api/tenant/subscription/limit-events?limit=20',
      critical: false,
      headers: tenantHeaders
    },
    {
      group: 'tenant',
      name: 'Tenant Profile',
      method: 'GET',
      path: '/api/tenant/profile',
      critical: true,
      headers: tenantHeaders
    },
    {
      group: 'super_admin',
      name: 'Super Admin Subscriptions',
      method: 'GET',
      path: '/api/super-admin/subscriptions',
      critical: true,
      headers: superAdminHeaders
    },
    {
      group: 'super_admin',
      name: 'Super Admin Audit Logs',
      method: 'GET',
      path: '/api/super-admin/audit-logs?limit=20',
      critical: true,
      headers: superAdminHeaders
    },
    {
      group: 'super_admin',
      name: 'Super Admin Tenant Profiles',
      method: 'GET',
      path: '/api/super-admin/tenant-profiles',
      critical: true,
      headers: superAdminHeaders
    },
    {
      group: 'system',
      name: 'Route Stability Audit Endpoint',
      method: 'GET',
      path: '/api/system/route-stability-audit',
      critical: false,
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
        'x-super-admin-key': superAdminKey
      }
    }
  ];
}

function buildNextBestActions(summary) {
  const actions = [];

  if (summary.routeNotFound > 0) {
    actions.push({
      priority: 'HIGH',
      type: 'ROUTE_REGISTRATION',
      title: 'Fix missing route registrations',
      description: 'One or more endpoints returned 404 or Route not found. Check server.js imports and app.use order.'
    });
  }

  if (summary.serverErrors > 0) {
    actions.push({
      priority: 'HIGH',
      type: 'SERVER_ERROR_FIX',
      title: 'Fix backend 500 errors',
      description: 'One or more endpoints returned server errors. Check backend terminal stack traces first.'
    });
  }

  if (summary.authFailed > 0) {
    actions.push({
      priority: 'HIGH',
      type: 'SUPER_ADMIN_AUTH',
      title: 'Fix super-admin key configuration',
      description: 'Super-admin routes require x-super-admin-key. Check SUPER_ADMIN_API_KEY in backend .env and frontend localStorage.'
    });
  }

  if (summary.fallbackDetected > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'FALLBACK_REMOVAL',
      title: 'Remove fallback/mock responses',
      description: 'Fallback/mock responses were detected. Replace with DB-backed responses before production.'
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'PHASE_22_READY_TO_CLOSE',
      title: 'Close Phase 22',
      description: 'All SaaS audit endpoints passed without warnings. Phase 22 can be marked complete.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'WARNING_REVIEW',
      title: 'Review warnings before closing Phase 22',
      description: 'No hard failures were detected, but warnings remain. Review readiness warnings before declaring production readiness.'
    });
  }

  return actions;
}

async function runSaasStabilityAudit(req) {
  const tenantId = normalizeTenantId(
    req.headers['x-tenant-id'] ||
      req.query.tenantId ||
      req.query.tenant_id ||
      'demo-tenant'
  );

  const superAdminKey = getSuperAdminKey(req);
  const baseUrl = getBaseUrl(req);

  const tests = buildTests({
    tenantId,
    superAdminKey
  });

  const results = [];

  for (const test of tests) {
    const startedAt = Date.now();
    const url = `${baseUrl}${test.path}`;

    const response = await fetchWithTimeout(
      url,
      {
        method: test.method,
        headers: test.headers || {}
      },
      test.timeoutMs || DEFAULT_TIMEOUT_MS
    );

    const durationMs = Date.now() - startedAt;

    const flags = detectProblemFlags({
      statusCode: response.statusCode,
      json: response.json,
      text: response.text,
      timedOut: response.timedOut,
      parseFailed: response.parseFailed,
      networkError: response.networkError
    });

    const status = classifyAuditResult({
      statusCode: response.statusCode,
      critical: test.critical,
      flags,
      json: response.json
    });

    results.push({
      group: test.group,
      name: test.name,
      method: test.method,
      path: test.path,
      critical: test.critical === true,
      statusCode: response.statusCode,
      durationMs,
      status,
      flags,
      reason:
        response.networkError ||
        response.json?.message ||
        response.json?.error ||
        (status === 'PASS' ? 'OK' : 'Check flags and preview.'),
      preview: response.json
        ? response.json
        : previewText(response.text),
      generatedAt: new Date().toISOString()
    });
  }

  const summary = {
    total: results.length,
    passed: results.filter((item) => item.status === 'PASS').length,
    warned: results.filter((item) => item.status === 'WARN').length,
    failed: results.filter((item) => item.status === 'FAIL').length,
    criticalFailed: results.filter((item) => item.status === 'FAIL' && item.critical).length,
    routeNotFound: results.filter((item) =>
      item.flags.includes('ROUTE_NOT_FOUND') ||
      item.flags.includes('ROUTE_NOT_FOUND_MESSAGE') ||
      item.flags.includes('CANNOT_GET_MESSAGE') ||
      item.flags.includes('ROUTE_TEXT_DETECTED')
    ).length,
    serverErrors: results.filter((item) => item.flags.includes('SERVER_ERROR')).length,
    authFailed: results.filter((item) => item.flags.includes('AUTH_FAILED')).length,
    fallbackDetected: results.filter((item) =>
      item.flags.includes('FALLBACK_DETECTED') ||
      item.flags.includes('FALLBACK_SOURCE') ||
      item.flags.includes('FALLBACK_MESSAGE') ||
      item.flags.includes('FALLBACK_TEXT') ||
      item.flags.includes('NESTED_AUDIT_FALLBACK_DETECTED') ||
      item.flags.includes('CHILD_RESULT_FALLBACK_DETECTED')
    ).length,
    mockDetected: results.filter((item) =>
      item.flags.includes('MOCK_SOURCE') ||
      item.flags.includes('MOCK_MESSAGE') ||
      item.flags.includes('MOCK_TEXT')
    ).length,
    slowRoutes: results.filter((item) => Number(item.durationMs || 0) > 2500).length
  };

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
    source: 'runtime-saas-stability-audit',
    phase: '22.19B-final-saas-stability-audit-fallback-fix',
    tenantId,
    baseUrl,
    readinessStatus,
    summary,
    results,
    nextBestActions: buildNextBestActions(summary),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runSaasStabilityAudit
};