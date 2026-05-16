'use strict';

function nowIso() {
  return new Date().toISOString();
}

function env(name) {
  return process.env[name] || '';
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function isLocalUrl(value) {
  const text = String(value || '').toLowerCase();
  return (
    text.includes('localhost') ||
    text.includes('127.0.0.1') ||
    text.includes('0.0.0.0')
  );
}

function hasWeakSecret(value) {
  const text = String(value || '').trim().toLowerCase();

  if (!text) return true;

  const weakFragments = [
    'local',
    'demo',
    'test',
    'default',
    'secret',
    'changeme',
    'password',
    'raftop-2026'
  ];

  if (text.length < 32) return true;

  return weakFragments.some((fragment) => text.includes(fragment));
}

function addCheck(checks, group, name, status, critical, message, details, nextAction) {
  checks.push({
    group,
    name,
    status,
    critical: Boolean(critical),
    message,
    details: details || '',
    nextAction: nextAction || '',
    generatedAt: nowIso()
  });
}

function summarize(checks) {
  const failed = checks.filter((check) => check.status === 'FAIL').length;
  const warned = checks.filter((check) => check.status === 'WARN').length;
  const passed = checks.filter((check) => check.status === 'PASS').length;
  const criticalFailed = checks.filter(
    (check) => check.status === 'FAIL' && check.critical
  ).length;
  const criticalWarnings = checks.filter(
    (check) => check.status === 'WARN' && check.critical
  ).length;

  return {
    total: checks.length,
    passed,
    warned,
    failed,
    criticalFailed,
    criticalWarnings,
    configFailures: checks.filter(
      (check) => check.group === 'config' && check.status === 'FAIL'
    ).length,
    runtimeWarnings: checks.filter(
      (check) => check.group === 'runtime' && check.status === 'WARN'
    ).length,
    deploymentWarnings: checks.filter(
      (check) => check.group === 'deployment' && check.status === 'WARN'
    ).length,
    secretWarnings: checks.filter(
      (check) => check.group === 'security' && check.status === 'WARN'
    ).length
  };
}

function buildBackendProductionConfigAudit() {
  const checks = [];

  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = env('DATABASE_URL');
  const jwtSecret = env('JWT_SECRET');
  const superAdminKey = env('SUPER_ADMIN_API_KEY');
  const publicBackendUrl =
    env('PUBLIC_BACKEND_URL') ||
    env('BACKEND_PUBLIC_URL') ||
    env('RENDER_EXTERNAL_URL') ||
    env('API_PUBLIC_URL');

  if (!databaseUrl) {
    addCheck(
      checks,
      'config',
      'DATABASE_URL configured',
      'FAIL',
      true,
      'DATABASE_URL is missing.',
      '',
      'Set DATABASE_URL before production or demo backend validation.'
    );
  } else {
    addCheck(
      checks,
      'config',
      'DATABASE_URL configured',
      'PASS',
      true,
      'DATABASE_URL exists.',
      '',
      ''
    );
  }

  if (!jwtSecret) {
    addCheck(
      checks,
      'security',
      'JWT_SECRET configured',
      'FAIL',
      true,
      'JWT_SECRET is missing.',
      '',
      'Set JWT_SECRET in backend environment.'
    );
  } else if (hasWeakSecret(jwtSecret)) {
    addCheck(
      checks,
      'security',
      'JWT_SECRET strength',
      isProduction() ? 'FAIL' : 'WARN',
      isProduction(),
      isProduction()
        ? 'JWT_SECRET is weak for production.'
        : 'JWT_SECRET should be stronger before production.',
      '',
      'Use a long random JWT_SECRET before production.'
    );
  } else {
    addCheck(
      checks,
      'security',
      'JWT_SECRET strength',
      'PASS',
      true,
      'JWT_SECRET appears strong.',
      '',
      ''
    );
  }

  if (!superAdminKey) {
    addCheck(
      checks,
      'security',
      'SUPER_ADMIN_API_KEY configured',
      'FAIL',
      true,
      'SUPER_ADMIN_API_KEY is missing.',
      '',
      'Set SUPER_ADMIN_API_KEY in backend environment.'
    );
  } else if (hasWeakSecret(superAdminKey)) {
    addCheck(
      checks,
      'security',
      'SUPER_ADMIN_API_KEY strength',
      isProduction() ? 'FAIL' : 'WARN',
      isProduction(),
      isProduction()
        ? 'SUPER_ADMIN_API_KEY is weak for production.'
        : 'SUPER_ADMIN_API_KEY should be replaced before production.',
      '',
      'Use a long random SUPER_ADMIN_API_KEY before production.'
    );
  } else {
    addCheck(
      checks,
      'security',
      'SUPER_ADMIN_API_KEY strength',
      'PASS',
      true,
      'SUPER_ADMIN_API_KEY appears strong.',
      '',
      ''
    );
  }

  if (isProduction()) {
    addCheck(
      checks,
      'runtime',
      'NODE_ENV',
      'PASS',
      true,
      'NODE_ENV is production.',
      '',
      ''
    );
  } else {
    addCheck(
      checks,
      'runtime',
      'NODE_ENV',
      'WARN',
      false,
      'NODE_ENV is not production. This is acceptable locally, not for deployment.',
      '',
      'For production deployment set NODE_ENV=production.'
    );
  }

  if (!publicBackendUrl) {
    addCheck(
      checks,
      'deployment',
      'Public backend URL',
      'WARN',
      false,
      'Public backend URL is not configured locally.',
      '',
      'Set PUBLIC_BACKEND_URL or platform external URL before public deployment.'
    );
  } else if (isProduction() && isLocalUrl(publicBackendUrl)) {
    addCheck(
      checks,
      'deployment',
      'Public backend URL',
      'FAIL',
      true,
      'Production public backend URL points to a local address.',
      publicBackendUrl,
      'Use the real deployed backend URL.'
    );
  } else {
    addCheck(
      checks,
      'deployment',
      'Public backend URL',
      'PASS',
      false,
      'Public backend URL is configured.',
      publicBackendUrl,
      ''
    );
  }

  const frontendUrl =
    env('FRONTEND_URL') ||
    env('CLIENT_URL') ||
    env('REACT_APP_PUBLIC_URL') ||
    '';

  if (!frontendUrl) {
    addCheck(
      checks,
      'deployment',
      'Frontend URL',
      'WARN',
      false,
      'Frontend URL is not configured locally.',
      '',
      'Set FRONTEND_URL or CLIENT_URL before deployment.'
    );
  } else if (isProduction() && isLocalUrl(frontendUrl)) {
    addCheck(
      checks,
      'deployment',
      'Frontend URL',
      'FAIL',
      true,
      'Production frontend URL points to a local address.',
      frontendUrl,
      'Use the real deployed frontend URL.'
    );
  } else {
    addCheck(
      checks,
      'deployment',
      'Frontend URL',
      'PASS',
      false,
      'Frontend URL is configured.',
      frontendUrl,
      ''
    );
  }

  const summary = summarize(checks);

  const readinessStatus =
    summary.criticalFailed > 0
      ? 'BLOCKED'
      : summary.failed > 0
        ? 'NEEDS_ATTENTION'
        : summary.warned > 0
          ? 'NEEDS_ATTENTION'
          : 'READY';

  const nextBestActions = checks
    .filter((check) => check.status !== 'PASS')
    .map((check) => ({
      priority: check.critical ? 'HIGH' : 'MEDIUM',
      type:
        check.status === 'FAIL'
          ? 'BACKEND_CONFIG_BLOCKER'
          : 'BACKEND_CONFIG_WARNING',
      auditName: 'Backend Production Config Audit',
      title: `Review Backend Production Config Audit: ${check.name}`,
      description: check.nextAction || check.message,
      details: check.details || ''
    }));

  return {
    ok: true,
    fallback: false,
    source: 'runtime-backend-production-config-audit',
    phase: '23.2-backend-production-config-hardening',
    nodeEnv,
    readinessStatus,
    summary,
    checks,
    nextBestActions,
    generatedAt: nowIso()
  };
}

async function runBackendProductionConfigAudit() {
  return buildBackendProductionConfigAudit();
}

async function getBackendProductionConfigAudit() {
  return buildBackendProductionConfigAudit();
}

async function getBackendProductionConfigAuditSnapshot() {
  return buildBackendProductionConfigAudit();
}

async function runProductionConfigAudit() {
  return buildBackendProductionConfigAudit();
}

async function getProductionConfigAuditSnapshot() {
  return buildBackendProductionConfigAudit();
}

async function auditBackendProductionConfig() {
  return buildBackendProductionConfigAudit();
}

async function runAudit() {
  return buildBackendProductionConfigAudit();
}

module.exports = {
  buildBackendProductionConfigAudit,
  runBackendProductionConfigAudit,
  getBackendProductionConfigAudit,
  getBackendProductionConfigAuditSnapshot,
  runProductionConfigAudit,
  getProductionConfigAuditSnapshot,
  auditBackendProductionConfig,
  runAudit
};