const DEFAULT_TIMEOUT_MS = 45000;

function getBaseUrl(req) {
  const fromEnv =
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_INTERNAL_URL ||
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

function normalizeCheck(check, auditName) {
  const status = String(check.status || check.result || 'UNKNOWN').toUpperCase();

  return {
    auditName,
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

function isFalseLocalTimeoutBlocker(check) {
  return (
    check.status === 'FAIL' &&
    check.critical !== true &&
    isTimeoutLike(check)
  );
}

function extractProblemChecks(payload, auditName) {
  const checks = getChecks(payload);

  return checks
    .map((check) => normalizeCheck(check, auditName))
    .filter((check) => check.status === 'FAIL' || check.status === 'WARN');
}

function extractHardBlockers(payload, auditName) {
  const checks = getChecks(payload);

  return checks
    .map((check) => normalizeCheck(check, auditName))
    .filter((check) => {
      if (isFalseLocalTimeoutBlocker(check)) {
        return false;
      }

      return check.status === 'FAIL';
    });
}

function extractCriticalWarnings(payload, auditName) {
  const checks = getChecks(payload);

  return checks
    .map((check) => normalizeCheck(check, auditName))
    .filter((check) => {
      if (isFalseLocalTimeoutBlocker(check)) {
        return false;
      }

      return check.status === 'WARN' && check.critical === true;
    });
}

function extractLocalWarnings(payload, auditName) {
  const checks = getChecks(payload);

  return checks
    .map((check) => normalizeCheck(check, auditName))
    .filter((check) => {
      if (isFalseLocalTimeoutBlocker(check)) {
        return true;
      }

      return check.status === 'WARN' && check.critical !== true;
    });
}

function buildAuditResult({ auditName, path, response }) {
  const payload = response.json || {};

  const summary = payload.summary || {};
  const readinessStatus = payload.readinessStatus || summary.readinessStatus || null;

  const problemChecks = extractProblemChecks(payload, auditName);
  const hardBlockers = extractHardBlockers(payload, auditName);
  const criticalWarnings = extractCriticalWarnings(payload, auditName);
  const localWarnings = extractLocalWarnings(payload, auditName);

  const endpointFailed =
    response.timedOut ||
    response.error ||
    response.parseFailed ||
    !response.ok ||
    response.statusCode >= 500;

  return {
    auditName,
    path,
    ok: response.ok,
    statusCode: response.statusCode,
    phase: payload.phase || null,
    readinessStatus,
    summary,
    endpointFailed,
    endpointTimedOut: response.timedOut,
    endpointError: response.error || payload.error || null,
    endpointMessage: payload.message || null,
    hardBlockers,
    criticalWarnings,
    localWarnings,
    problemChecks
  };
}

function buildSummary(auditResults) {
  const hardBlockers = auditResults.flatMap((item) => item.hardBlockers || []);
  const criticalWarnings = auditResults.flatMap((item) => item.criticalWarnings || []);
  const localWarnings = auditResults.flatMap((item) => item.localWarnings || []);
  const allProblems = auditResults.flatMap((item) => item.problemChecks || []);
  const endpointFailures = auditResults.filter((item) => item.endpointFailed);

  return {
    totalAudits: auditResults.length,
    endpointFailures: endpointFailures.length,
    hardBlockers: hardBlockers.length,
    criticalWarnings: criticalWarnings.length,
    localWarnings: localWarnings.length,
    totalProblems: allProblems.length,
    blockedAudits: auditResults
      .filter((item) => item.hardBlockers.length > 0)
      .map((item) => item.auditName),
    criticalWarningAudits: auditResults
      .filter((item) => item.criticalWarnings.length > 0)
      .map((item) => item.auditName),
    localWarningAudits: auditResults
      .filter((item) => item.localWarnings.length > 0)
      .map((item) => item.auditName),
    warningAudits: auditResults
      .filter((item) => item.problemChecks.length > 0 && item.hardBlockers.length === 0)
      .map((item) => item.auditName)
  };
}

function buildNextBestActions(auditResults) {
  const actions = [];

  for (const audit of auditResults) {
    for (const blocker of audit.hardBlockers.slice(0, 5)) {
      actions.push({
        priority: 'HIGH',
        type: 'RC_HARD_BLOCKER',
        auditName: audit.auditName,
        title: `Fix ${audit.auditName}: ${blocker.name}`,
        description: blocker.nextAction || blocker.message || 'Open the audit page and fix this failed check.',
        details: blocker
      });
    }
  }

  for (const audit of auditResults) {
    for (const warning of audit.criticalWarnings.slice(0, 5)) {
      actions.push({
        priority: 'HIGH',
        type: 'RC_CRITICAL_WARNING',
        auditName: audit.auditName,
        title: `Review ${audit.auditName}: ${warning.name}`,
        description: warning.nextAction || warning.message || 'Review this critical warning before demo.',
        details: warning
      });
    }
  }

  for (const audit of auditResults) {
    for (const warning of audit.localWarnings.slice(0, 5)) {
      actions.push({
        priority: 'MEDIUM',
        type: 'RC_LOCAL_WARNING',
        auditName: audit.auditName,
        title: `Local warning ${audit.auditName}: ${warning.name}`,
        description: warning.nextAction || warning.message || 'Local warning. Review, but it is not a hard blocker.',
        details: warning
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      priority: 'LOW',
      type: 'RC_NO_HARD_BLOCKERS',
      title: 'No blockers detected',
      description: 'Release Candidate blockers were not found in sub-audits.'
    });
  }

  return actions;
}

async function runReleaseCandidateBlockerInspector(req) {
  const tenantId = normalizeTenantId(
    req.headers['x-tenant-id'] ||
      req.query.tenantId ||
      req.query.tenant_id ||
      'demo-tenant'
  );

  const superAdminKey = getSuperAdminKey(req);
  const baseUrl = getBaseUrl(req);

  const audits = [
    {
      auditName: 'SaaS Stability Audit',
      path: `/api/system/saas-stability-audit?tenantId=${encodeURIComponent(tenantId)}`
    },
    {
      auditName: 'Security Exposure Audit',
      path: '/api/system/security-exposure-audit'
    },
    {
      auditName: 'Production Readiness Audit',
      path: `/api/system/production-readiness-audit?tenantId=${encodeURIComponent(tenantId)}`
    },
    {
      auditName: 'Backend Production Config Audit',
      path: '/api/system/backend-production-config-audit'
    },
    {
      auditName: 'Tenant Cleanup Audit',
      path: '/api/system/tenant-cleanup-audit'
    }
  ];

  const auditResults = [];

  for (const audit of audits) {
    const response = await fetchWithTimeout(`${baseUrl}${audit.path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
        'x-super-admin-key': superAdminKey,
        'x-frontend-dangerous-dev-controls': 'false'
      }
    });

    auditResults.push(
      buildAuditResult({
        auditName: audit.auditName,
        path: audit.path,
        response
      })
    );
  }

  const summary = buildSummary(auditResults);

  const readinessStatus =
    summary.endpointFailures > 0 || summary.hardBlockers > 0
      ? 'BLOCKED'
      : summary.criticalWarnings > 0 || summary.localWarnings > 0 || summary.totalProblems > 0
        ? 'NEEDS_ATTENTION'
        : 'READY';

  return {
    ok: readinessStatus !== 'BLOCKED',
    fallback: false,
    source: 'runtime-release-candidate-blocker-inspector',
    phase: '23.7E-release-candidate-blocker-inspector-warning-classification',
    tenantId,
    baseUrl,
    readinessStatus,
    summary,
    auditResults,
    hardBlockers: auditResults.flatMap((item) => item.hardBlockers),
    criticalWarnings: auditResults.flatMap((item) => item.criticalWarnings),
    localWarnings: auditResults.flatMap((item) => item.localWarnings),
    nextBestActions: buildNextBestActions(auditResults),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runReleaseCandidateBlockerInspector
};