import { isDangerousDevControlsEnabled } from '../config/devControls';

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  'http://localhost:5001';

const LOCAL_SUPER_ADMIN_KEY = 'local-super-admin-key-raftop-2026';

function normalizeBool(value) {
  return String(value || '').toLowerCase() === 'true';
}

function isLocalHostName(hostname) {
  const value = String(hostname || '').toLowerCase();

  return (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '0.0.0.0' ||
    value.endsWith('.local')
  );
}

function isLocalUrl(value) {
  const text = String(value || '').toLowerCase();

  return (
    text.includes('localhost') ||
    text.includes('127.0.0.1') ||
    text.includes('0.0.0.0')
  );
}

function getStoredSuperAdminKey() {
  return (
    localStorage.getItem('super_admin_api_key') ||
    localStorage.getItem('superAdminApiKey') ||
    process.env.REACT_APP_SUPER_ADMIN_API_KEY ||
    ''
  );
}

function getTenantId() {
  return (
    localStorage.getItem('tenant_id') ||
    localStorage.getItem('tenantId') ||
    'demo-tenant'
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

function safeWindowLocation() {
  try {
    return {
      href: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname
    };
  } catch (error) {
    return {
      href: null,
      origin: null,
      hostname: null,
      protocol: null,
      pathname: null
    };
  }
}

function detectRuntimeMode() {
  const location = safeWindowLocation();
  const hostname = location.hostname || '';
  const nodeEnv = process.env.NODE_ENV || 'development';

  const localFrontend = isLocalHostName(hostname);
  const localApi = isLocalUrl(API_BASE);

  const likelyProductionRuntime =
    !localFrontend &&
    String(location.protocol || '').toLowerCase() === 'https:';

  return {
    nodeEnv,
    location,
    apiBase: API_BASE,
    localFrontend,
    localApi,
    likelyProductionRuntime
  };
}

function checkApiBase(runtime) {
  if (!API_BASE) {
    return buildCheck({
      group: 'api',
      name: 'Backend API base URL',
      status: 'FAIL',
      critical: true,
      message: 'Backend API base URL is missing.',
      details: {
        apiBase: API_BASE
      },
      nextAction: 'Set REACT_APP_API_URL or REACT_APP_BACKEND_URL.'
    });
  }

  if (runtime.likelyProductionRuntime && runtime.localApi) {
    return buildCheck({
      group: 'api',
      name: 'Backend API base URL',
      status: 'FAIL',
      critical: true,
      message: 'Frontend is running like production but API points to localhost.',
      details: {
        apiBase: API_BASE,
        location: runtime.location
      },
      nextAction: 'Set REACT_APP_API_URL to the real production backend URL before building.'
    });
  }

  if (!runtime.likelyProductionRuntime && runtime.localApi) {
    return buildCheck({
      group: 'api',
      name: 'Backend API base URL',
      status: 'WARN',
      critical: false,
      message: 'API points to localhost. Acceptable locally, not for production build.',
      details: {
        apiBase: API_BASE
      },
      nextAction: 'For production build set REACT_APP_API_URL=https://your-backend-domain.'
    });
  }

  return buildCheck({
    group: 'api',
    name: 'Backend API base URL',
    status: 'PASS',
    critical: true,
    message: 'Backend API base URL is configured.',
    details: {
      apiBase: API_BASE
    }
  });
}

function checkBuildMode(runtime) {
  if (runtime.nodeEnv === 'production') {
    return buildCheck({
      group: 'build',
      name: 'Frontend NODE_ENV',
      status: 'PASS',
      critical: false,
      message: 'Frontend NODE_ENV is production.',
      details: {
        nodeEnv: runtime.nodeEnv
      }
    });
  }

  return buildCheck({
    group: 'build',
    name: 'Frontend NODE_ENV',
    status: 'WARN',
    critical: false,
    message: 'Frontend NODE_ENV is not production. This is acceptable locally.',
    details: {
      nodeEnv: runtime.nodeEnv
    },
    nextAction: 'Use npm run build for production deployment.'
  });
}

function checkProtocol(runtime) {
  if (runtime.localFrontend) {
    return buildCheck({
      group: 'deployment',
      name: 'Frontend protocol',
      status: 'WARN',
      critical: false,
      message: 'Frontend is running locally over development protocol.',
      details: runtime.location,
      nextAction: 'Production frontend must run on HTTPS.'
    });
  }

  if (String(runtime.location.protocol || '').toLowerCase() !== 'https:') {
    return buildCheck({
      group: 'deployment',
      name: 'Frontend protocol',
      status: 'FAIL',
      critical: true,
      message: 'Production frontend is not using HTTPS.',
      details: runtime.location,
      nextAction: 'Deploy frontend behind HTTPS before external use.'
    });
  }

  return buildCheck({
    group: 'deployment',
    name: 'Frontend protocol',
    status: 'PASS',
    critical: true,
    message: 'Frontend is using HTTPS.',
    details: runtime.location
  });
}

function checkDangerousDevControls(runtime) {
  const envFlag = normalizeBool(process.env.REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS);
  const localOverride = normalizeBool(
    localStorage.getItem('raftop_show_dangerous_dev_controls')
  );
  const effectiveEnabled = isDangerousDevControlsEnabled();

  if (effectiveEnabled) {
    return buildCheck({
      group: 'security',
      name: 'Dangerous dev controls',
      status: 'FAIL',
      critical: true,
      message: 'Dangerous dev controls are enabled.',
      details: {
        envFlag,
        localOverride,
        effectiveEnabled
      },
      nextAction: 'Set REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS=false and remove localStorage override.'
    });
  }

  return buildCheck({
    group: 'security',
    name: 'Dangerous dev controls',
    status: 'PASS',
    critical: true,
    message: 'Dangerous dev controls are OFF.',
    details: {
      envFlag,
      localOverride,
      effectiveEnabled
    }
  });
}

function checkSuperAdminKey(runtime) {
  const key = getStoredSuperAdminKey();
  const exists = String(key || '').length > 0;
  const isLocalKey = key === LOCAL_SUPER_ADMIN_KEY;

  if (!exists) {
    return buildCheck({
      group: 'security',
      name: 'Super-admin key in frontend runtime',
      status: 'WARN',
      critical: false,
      message: 'No super-admin key is stored in frontend runtime.',
      details: {
        configured: false
      },
      nextAction: 'For local audit, store the key. For production, avoid hardcoding super-admin secrets in public frontend.'
    });
  }

  if (runtime.likelyProductionRuntime && isLocalKey) {
    return buildCheck({
      group: 'security',
      name: 'Super-admin key in frontend runtime',
      status: 'FAIL',
      critical: true,
      message: 'Known local super-admin key is exposed in production-like frontend runtime.',
      details: {
        configured: true,
        knownLocalKey: true
      },
      nextAction: 'Never ship the local super-admin key in production. Replace the admin access model before external deployment.'
    });
  }

  if (isLocalKey) {
    return buildCheck({
      group: 'security',
      name: 'Super-admin key in frontend runtime',
      status: 'WARN',
      critical: true,
      message: 'Known local super-admin key is being used. Acceptable only locally.',
      details: {
        configured: true,
        knownLocalKey: true
      },
      nextAction: 'Use a unique production-only key and do not hardcode it into the public frontend.'
    });
  }

  return buildCheck({
    group: 'security',
    name: 'Super-admin key in frontend runtime',
    status: 'PASS',
    critical: true,
    message: 'Super-admin key is not the known local development key.',
    details: {
      configured: true,
      knownLocalKey: false,
      length: key.length
    }
  });
}

function checkTenantContext() {
  const tenantId = getTenantId();

  if (!tenantId) {
    return buildCheck({
      group: 'tenant',
      name: 'Tenant context',
      status: 'FAIL',
      critical: true,
      message: 'Tenant context is missing.',
      details: {
        tenantId
      },
      nextAction: 'Set tenant_id / tenantId in localStorage or use Tenant Context Switcher.'
    });
  }

  return buildCheck({
    group: 'tenant',
    name: 'Tenant context',
    status: 'PASS',
    critical: true,
    message: 'Tenant context is available.',
    details: {
      tenantId
    }
  });
}

function checkFrontendPublicEnv(runtime) {
  const publicEnv = {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || null,
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL || null,
    REACT_APP_SUPER_ADMIN_API_KEY: process.env.REACT_APP_SUPER_ADMIN_API_KEY
      ? '[configured]'
      : null,
    REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS:
      process.env.REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS || null
  };

  const hasPublicSuperAdminKey = Boolean(process.env.REACT_APP_SUPER_ADMIN_API_KEY);

  if (runtime.likelyProductionRuntime && hasPublicSuperAdminKey) {
    return buildCheck({
      group: 'security',
      name: 'Public frontend env exposure',
      status: 'FAIL',
      critical: true,
      message: 'REACT_APP_SUPER_ADMIN_API_KEY is bundled into a production-like frontend.',
      details: publicEnv,
      nextAction: 'Remove super-admin secrets from public frontend builds. Use server-side admin auth instead.'
    });
  }

  if (hasPublicSuperAdminKey) {
    return buildCheck({
      group: 'security',
      name: 'Public frontend env exposure',
      status: 'WARN',
      critical: true,
      message: 'REACT_APP_SUPER_ADMIN_API_KEY exists. This is public in frontend builds.',
      details: publicEnv,
      nextAction: 'Do not use public React env variables for sensitive production secrets.'
    });
  }

  return buildCheck({
    group: 'security',
    name: 'Public frontend env exposure',
    status: 'PASS',
    critical: true,
    message: 'No REACT_APP_SUPER_ADMIN_API_KEY detected in public env.',
    details: publicEnv
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
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

function endpointCheckFromResponse({
  group,
  name,
  response,
  critical,
  nextAction,
  expectedReadiness = null
}) {
  let status = 'PASS';
  let message = 'Endpoint is reachable.';

  const readiness =
    response.json?.readinessStatus ||
    response.json?.summary?.readinessStatus ||
    null;

  if (response.timedOut) {
    status = critical ? 'FAIL' : 'WARN';
    message = 'Endpoint timed out.';
  } else if (response.error) {
    status = critical ? 'FAIL' : 'WARN';
    message = response.error;
  } else if (response.statusCode === 404) {
    status = critical ? 'FAIL' : 'WARN';
    message = 'Endpoint returned 404.';
  } else if (response.statusCode >= 500) {
    status = critical ? 'FAIL' : 'WARN';
    message = 'Endpoint returned server error.';
  } else if (!response.ok) {
    status = critical ? 'FAIL' : 'WARN';
    message = response.json?.message || response.json?.error || `HTTP ${response.statusCode}`;
  } else if (
    expectedReadiness &&
    String(readiness || '').toUpperCase() !== String(expectedReadiness).toUpperCase()
  ) {
    status = 'WARN';
    message = `Endpoint readiness is ${readiness || 'UNKNOWN'}, expected ${expectedReadiness}.`;
  }

  return buildCheck({
    group,
    name,
    status,
    critical,
    message,
    details: {
      statusCode: response.statusCode,
      readinessStatus: readiness,
      phase: response.json?.phase || null,
      summary: response.json?.summary || null,
      error: response.json?.error || response.error || null
    },
    nextAction: status === 'PASS' ? null : nextAction
  });
}

async function checkBackendHealth() {
  const response = await fetchWithTimeout(`${API_BASE}/api/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  return endpointCheckFromResponse({
    group: 'api',
    name: 'Backend health reachability',
    response,
    critical: true,
    nextAction: 'Check REACT_APP_API_URL / backend server / CORS.'
  });
}

async function checkSaasAudit() {
  const tenantId = getTenantId();
  const superAdminKey = getStoredSuperAdminKey();

  const response = await fetchWithTimeout(
    `${API_BASE}/api/system/saas-stability-audit?tenantId=${encodeURIComponent(tenantId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
        'x-super-admin-key': superAdminKey
      }
    }
  );

  return endpointCheckFromResponse({
    group: 'api',
    name: 'SaaS stability audit reachability',
    response,
    critical: true,
    expectedReadiness: 'READY',
    nextAction: 'Open /system/saas-stability-audit and fix backend audit issues.'
  });
}

async function checkProductionReadiness() {
  const tenantId = getTenantId();
  const superAdminKey = getStoredSuperAdminKey();

  const response = await fetchWithTimeout(
    `${API_BASE}/api/system/production-readiness-audit?tenantId=${encodeURIComponent(tenantId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-tenant-id': tenantId,
        'x-super-admin-key': superAdminKey,
        'x-frontend-dangerous-dev-controls': isDangerousDevControlsEnabled()
          ? 'true'
          : 'false'
      }
    }
  );

  return endpointCheckFromResponse({
    group: 'api',
    name: 'Production readiness audit reachability',
    response,
    critical: true,
    nextAction: 'Open /system/production-readiness and fix release gate warnings/failures.'
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
    securityWarnings: checks.filter((check) => check.group === 'security' && check.status === 'WARN').length,
    securityFailures: checks.filter((check) => check.group === 'security' && check.status === 'FAIL').length,
    apiFailures: checks.filter((check) => check.group === 'api' && check.status === 'FAIL').length,
    deploymentWarnings: checks.filter((check) => check.group === 'deployment' && check.status === 'WARN').length
  };
}

function buildNextBestActions(checks, summary) {
  const actions = [];

  const criticalFails = checks.filter((check) => check.status === 'FAIL' && check.critical);
  const criticalWarnings = checks.filter((check) => check.status === 'WARN' && check.critical);
  const warnings = checks.filter((check) => check.status === 'WARN' && !check.critical);

  for (const check of criticalFails.slice(0, 5)) {
    actions.push({
      priority: 'HIGH',
      type: 'FRONTEND_PRODUCTION_BLOCKER',
      title: `Fix: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of criticalWarnings.slice(0, 5)) {
    actions.push({
      priority: 'HIGH',
      type: 'FRONTEND_SECURITY_WARNING',
      title: `Strengthen: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of warnings.slice(0, 5)) {
    actions.push({
      priority: 'MEDIUM',
      type: 'FRONTEND_CONFIG_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'FRONTEND_CONFIG_READY',
      title: 'Frontend production config is clean',
      description: 'Proceed to database backup / restore safety check.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'FRONTEND_CONFIG_ACCEPTABLE_LOCAL',
      title: 'Frontend is acceptable locally with warnings',
      description: 'Warnings may be acceptable locally, but production deployment must clear localhost/API/secret exposure issues.'
    });
  }

  return actions;
}

export async function runFrontendProductionConfigAudit() {
  const runtime = detectRuntimeMode();

  const checks = [];

  checks.push(checkBuildMode(runtime));
  checks.push(checkProtocol(runtime));
  checks.push(checkApiBase(runtime));
  checks.push(checkDangerousDevControls(runtime));
  checks.push(checkSuperAdminKey(runtime));
  checks.push(checkFrontendPublicEnv(runtime));
  checks.push(checkTenantContext());

  checks.push(await checkBackendHealth());
  checks.push(await checkSaasAudit());
  checks.push(await checkProductionReadiness());

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
    source: 'runtime-frontend-production-config-audit',
    phase: '23.3-frontend-production-config-hardening',
    readinessStatus,
    runtime,
    summary,
    checks,
    nextBestActions: buildNextBestActions(checks, summary),
    generatedAt: new Date().toISOString()
  };
}