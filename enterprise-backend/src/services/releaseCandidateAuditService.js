const DEFAULT_TIMEOUT_MS = 45000;

const {
  runSecurityExposureAudit
} = require('./securityExposureAuditService');

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
  status,
  critical = false,
  message,
  details = {},
  nextAction = null
}) {
  return {
    group,
    name,
    status,
    critical: critical === true,
    message,
    details,
    nextAction,
    generatedAt: new Date().toISOString()
  };
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
      ok: response.ok,
      statusCode: response.status,
      json,
      text,
      parseFailed,
      error: null,
      timedOut: false
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
      timedOut
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getChecks(payload) {
  if (Array.isArray(payload?.checks)) return payload.checks;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.checks)) return payload.data.checks;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
}

function normalizeCheck(check) {
  const status = String(check.status || check.result || 'UNKNOWN').toUpperCase();

  return {
    group: check.group || check.category || 'unknown',
    name: check.name || check.title || check.path || 'Unnamed check',
    status,
    critical: check.critical === true,
    message: check.message || check.reason || check.error || '',
    nextAction: check.nextAction || check.next_action || null,
    details: check.details || check.preview || check
  };
}

function isTimeoutLike(check) {
  const message = String(check.message || '').toLowerCase();

  return (
    message.includes('aborted') ||
    message.includes('timeout') ||
    message.includes('timed out')
  );
}

function isLocalNonCriticalTimeout(check) {
  return (
    check.status === 'FAIL' &&
    check.critical !== true &&
    isTimeoutLike(check)
  );
}

function extractReadiness(json) {
  if (!json || typeof json !== 'object') return null;

  if (json.readinessStatus) {
    return String(json.readinessStatus).toUpperCase();
  }

  if (json.summary?.readinessStatus) {
    return String(json.summary.readinessStatus).toUpperCase();
  }

  const summary = json.summary || null;

  if (summary) {
    const criticalFailed = Number(summary.criticalFailed || 0);
    const failed = Number(summary.failed || 0);
    const warned = Number(summary.warned || 0);

    if (criticalFailed > 0) return 'BLOCKED';
    if (failed > 0) return 'NEEDS_FIX';
    if (warned > 0) return 'NEEDS_ATTENTION';

    return 'READY';
  }

  return null;
}

function extractSummary(json) {
  const summary = json?.summary || {};

  return {
    total: Number(summary.total || 0),
    passed: Number(summary.passed || 0),
    warned: Number(summary.warned || 0),
    failed: Number(summary.failed || 0),
    criticalFailed: Number(summary.criticalFailed || 0),
    criticalWarnings: Number(summary.criticalWarnings || 0)
  };
}

function classifyAuditPayload({ json, expectedReady = false, nodeEnv }) {
  const payloadChecks = getChecks(json).map(normalizeCheck);
  const summary = extractSummary(json);
  const readiness = extractReadiness(json);

  const hardFailedChecks = payloadChecks.filter((check) => {
    if (isLocalNonCriticalTimeout(check)) return false;
    return check.status === 'FAIL' && check.critical === true;
  });

  const nonCriticalFailedChecks = payloadChecks.filter((check) => {
    if (isLocalNonCriticalTimeout(check)) return true;
    return check.status === 'FAIL' && check.critical !== true;
  });

  const criticalWarningChecks = payloadChecks.filter(
    (check) => check.status === 'WARN' && check.critical === true
  );

  const localWarningChecks = payloadChecks.filter(
    (check) => check.status === 'WARN' && check.critical !== true
  );

  if (hardFailedChecks.length > 0 || summary.criticalFailed > 0) {
    return {
      status: 'FAIL',
      message: `Audit has critical failures: criticalFailed=${summary.criticalFailed}, critical failed checks=${hardFailedChecks.length}.`
    };
  }

  if (nodeEnv === 'production' && summary.failed > 0) {
    return {
      status: 'FAIL',
      message: `Production audit has failures: failed=${summary.failed}.`
    };
  }

  if (summary.failed > 0 || nonCriticalFailedChecks.length > 0) {
    return {
      status: 'WARN',
      message: `Audit has local/non-critical failures: failed=${summary.failed}, nonCriticalFailedChecks=${nonCriticalFailedChecks.length}.`
    };
  }

  if (expectedReady && readiness && readiness !== 'READY') {
    return {
      status: 'WARN',
      message: `Audit readiness is ${readiness}, not READY.`
    };
  }

  if (
    summary.warned > 0 ||
    summary.criticalWarnings > 0 ||
    criticalWarningChecks.length > 0 ||
    localWarningChecks.length > 0
  ) {
    return {
      status: 'WARN',
      message: `Audit has warnings: warned=${summary.warned}, criticalWarnings=${summary.criticalWarnings}.`
    };
  }

  return {
    status: 'PASS',
    message: 'Audit passed.'
  };
}

function classifyAuditResponse({ response, critical, expectedReady = false, nodeEnv }) {
  const routeNotFound =
    response.statusCode === 404 ||
    /route not found/i.test(String(response.json?.message || response.text || ''));

  if (response.timedOut) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: 'Audit endpoint timed out.'
    };
  }

  if (response.error) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: response.error
    };
  }

  if (routeNotFound) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: 'Audit endpoint returned route not found.'
    };
  }

  if (response.statusCode >= 500) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: 'Audit endpoint returned server error.'
    };
  }

  if (response.parseFailed) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: 'Audit endpoint returned non-JSON response.'
    };
  }

  if (!response.ok) {
    return {
      status: critical ? 'FAIL' : 'WARN',
      message: response.json?.message || response.json?.error || `HTTP ${response.statusCode}`
    };
  }

  return classifyAuditPayload({
    json: response.json,
    expectedReady,
    nodeEnv
  });
}

function effectiveCritical({ status, stageCritical, nodeEnv }) {
  if (status === 'FAIL') return stageCritical === true;

  if (nodeEnv === 'production') {
    return stageCritical === true;
  }

  return false;
}

async function runHttpStage({
  baseUrl,
  tenantId,
  superAdminKey,
  group,
  name,
  path,
  critical,
  expectedReady,
  nextAction,
  nodeEnv
}) {
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId,
      'x-super-admin-key': superAdminKey,
      'x-frontend-dangerous-dev-controls': 'false'
    }
  });

  const classification = classifyAuditResponse({
    response,
    critical,
    expectedReady,
    nodeEnv
  });

  return buildCheck({
    group,
    name,
    status: classification.status,
    critical: effectiveCritical({
      status: classification.status,
      stageCritical: critical,
      nodeEnv
    }),
    message: classification.message,
    details: {
      mode: 'http',
      path,
      statusCode: response.statusCode,
      readinessStatus: extractReadiness(response.json),
      phase: response.json?.phase || null,
      summary: response.json?.summary || null,
      error: response.json?.error || response.error || null
    },
    nextAction: classification.status === 'PASS' ? null : nextAction
  });
}

async function runSecurityExposureStage({
  req,
  group,
  name,
  critical,
  expectedReady,
  nextAction,
  nodeEnv
}) {
  try {
    const payload = await runSecurityExposureAudit(req);

    const classification = classifyAuditPayload({
      json: payload,
      expectedReady,
      nodeEnv
    });

    return buildCheck({
      group,
      name,
      status: classification.status,
      critical: effectiveCritical({
        status: classification.status,
        stageCritical: critical,
        nodeEnv
      }),
      message: classification.message,
      details: {
        mode: 'direct-service',
        path: '/api/system/security-exposure-audit',
        statusCode: 200,
        readinessStatus: extractReadiness(payload),
        phase: payload.phase || null,
        summary: payload.summary || null,
        error: payload.error || null
      },
      nextAction: classification.status === 'PASS' ? null : nextAction
    });
  } catch (error) {
    return buildCheck({
      group,
      name,
      status: 'FAIL',
      critical: critical === true,
      message: `Security Exposure direct service failed: ${error.message}`,
      details: {
        mode: 'direct-service',
        path: '/api/system/security-exposure-audit',
        error: error.message
      },
      nextAction
    });
  }
}

async function checkSystemAlerts(baseUrl, tenantId, superAdminKey) {
  const response = await fetchWithTimeout(`${baseUrl}/api/system/alerts`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-tenant-id': tenantId,
      'x-super-admin-key': superAdminKey
    }
  });

  if (!response.ok || !response.json) {
    return buildCheck({
      group: 'system',
      name: 'Open system alerts',
      status: 'WARN',
      critical: false,
      message: 'Could not verify open system alerts cleanly.',
      details: {
        statusCode: response.statusCode,
        error: response.error || response.json?.error || null
      },
      nextAction: 'Open /system/alerts and verify/acknowledge active alerts.'
    });
  }

  const stats = response.json.stats || {};

  const criticalOpen = Number(stats.criticalOpen || 0);
  const highOpen = Number(stats.highOpen || 0);
  const open = Number(stats.open || 0);

  if (criticalOpen > 0 || highOpen > 0) {
    return buildCheck({
      group: 'system',
      name: 'Open system alerts',
      status: 'WARN',
      critical: false,
      message: 'There are open high/critical system alerts.',
      details: {
        stats
      },
      nextAction: 'Fix or acknowledge high/critical system alerts before final demo.'
    });
  }

  if (open > 0) {
    return buildCheck({
      group: 'system',
      name: 'Open system alerts',
      status: 'WARN',
      critical: false,
      message: 'There are open non-critical system alerts.',
      details: {
        stats
      },
      nextAction: 'Review open alerts before final release candidate sign-off.'
    });
  }

  return buildCheck({
    group: 'system',
    name: 'Open system alerts',
    status: 'PASS',
    critical: false,
    message: 'No open system alerts detected.',
    details: {
      stats
    }
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
    stabilityFailures: checks.filter((check) => check.group === 'stability' && check.status === 'FAIL').length,
    configFailures: checks.filter((check) => check.group === 'config' && check.status === 'FAIL').length,
    databaseFailures: checks.filter((check) => check.group === 'database' && check.status === 'FAIL').length,
    securityFailures: checks.filter((check) => check.group === 'security' && check.status === 'FAIL').length,
    tenantFailures: checks.filter((check) => check.group === 'tenant_cleanup' && check.status === 'FAIL').length,
    systemWarnings: checks.filter((check) => check.group === 'system' && check.status === 'WARN').length
  };
}

function buildNextBestActions(checks, summary) {
  const actions = [];

  const failures = checks.filter((check) => check.status === 'FAIL');
  const criticalWarnings = checks.filter((check) => check.status === 'WARN' && check.critical);
  const warnings = checks.filter((check) => check.status === 'WARN' && !check.critical);

  for (const check of failures.slice(0, 6)) {
    actions.push({
      priority: 'HIGH',
      type: 'RELEASE_CANDIDATE_BLOCKER',
      title: `Fix: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of criticalWarnings.slice(0, 6)) {
    actions.push({
      priority: 'HIGH',
      type: 'RELEASE_CANDIDATE_CRITICAL_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of warnings.slice(0, 6)) {
    actions.push({
      priority: 'MEDIUM',
      type: 'RELEASE_CANDIDATE_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'RELEASE_CANDIDATE_APPROVED',
      title: 'Approve Release Candidate',
      description: 'All backend release candidate gates passed without warnings.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'RELEASE_CANDIDATE_WITH_WARNINGS',
      title: 'Release Candidate possible with warnings',
      description: 'No hard blocker was found. Warnings should be reviewed before client-facing demo or production deployment.'
    });
  }

  return actions;
}

async function runReleaseCandidateAudit(req) {
  const tenantId = normalizeTenantId(
    req.headers['x-tenant-id'] ||
      req.query.tenantId ||
      req.query.tenant_id ||
      'demo-tenant'
  );

  const superAdminKey = getSuperAdminKey(req);
  const baseUrl = getBaseUrl(req);
  const nodeEnv = getNodeEnv();

  const checks = [];

  const httpStages = [
    {
      group: 'stability',
      name: 'SaaS Stability Audit',
      path: `/api/system/saas-stability-audit?tenantId=${encodeURIComponent(tenantId)}`,
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/saas-stability-audit and review SaaS endpoint warnings.'
    },
    {
      group: 'stability',
      name: 'Route Stability Audit',
      path: '/api/system/route-stability-audit',
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/stability and fix route failures, 404s or 500s.'
    },
    {
      group: 'config',
      name: 'Production Readiness Audit',
      path: `/api/system/production-readiness-audit?tenantId=${encodeURIComponent(tenantId)}`,
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/production-readiness and fix release gate failures.'
    },
    {
      group: 'config',
      name: 'Backend Production Config Audit',
      path: '/api/system/backend-production-config-audit',
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/backend-config and fix backend config/security warnings.'
    },
    {
      group: 'database',
      name: 'Database Backup Safety Audit',
      path: '/api/system/database-backup-safety-audit',
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/database-backup-safety and fix database/backup blockers.'
    },
    {
      group: 'tenant_cleanup',
      name: 'Tenant Cleanup Audit',
      path: '/api/system/tenant-cleanup-audit',
      critical: true,
      expectedReady: false,
      nextAction: 'Open /system/tenant-cleanup and clean demo/Raftopoulos tenant metadata.'
    }
  ];

  for (const stage of httpStages) {
    checks.push(
      await runHttpStage({
        baseUrl,
        tenantId,
        superAdminKey,
        nodeEnv,
        ...stage
      })
    );
  }

  checks.push(
    await runSecurityExposureStage({
      req,
      group: 'security',
      name: 'Security Exposure Audit',
      critical: true,
      expectedReady: nodeEnv === 'production',
      nextAction: 'Open /system/security-exposure and fix security exposure blockers.',
      nodeEnv
    })
  );

  checks.push(await checkSystemAlerts(baseUrl, tenantId, superAdminKey));

  const summary = buildSummary(checks);

  const readinessStatus =
    summary.criticalFailed > 0
      ? 'BLOCKED'
      : summary.failed > 0
        ? 'NEEDS_FIX'
        : summary.warned > 0
          ? 'NEEDS_ATTENTION'
          : 'READY';

  const commercialDemoStatus =
    summary.criticalFailed > 0 || summary.failed > 0
      ? 'NOT_READY'
      : summary.criticalWarnings > 0
        ? 'READY_WITH_CRITICAL_WARNINGS'
        : summary.warned > 0
          ? 'READY_WITH_WARNINGS'
          : 'READY';

  return {
    ok: summary.criticalFailed === 0,
    fallback: false,
    source: 'runtime-release-candidate-audit',
    phase: '23.8C-final-release-candidate-direct-security-stage',
    tenantId,
    baseUrl,
    nodeEnv,
    readinessStatus,
    commercialDemoStatus,
    summary,
    checks,
    nextBestActions: buildNextBestActions(checks, summary),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runReleaseCandidateAudit
};