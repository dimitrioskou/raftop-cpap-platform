'use strict';

function nowIso() {
  return new Date().toISOString();
}

function getEnvValue(name) {
  return process.env[name] || '';
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
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
    routeWarnings: checks.filter(
      (check) => check.group === 'routes' && check.status === 'WARN'
    ).length,
    routeFailures: checks.filter(
      (check) => check.group === 'routes' && check.status === 'FAIL'
    ).length,
    secretWarnings: checks.filter(
      (check) => check.group === 'secrets' && check.status === 'WARN'
    ).length,
    secretFailures: checks.filter(
      (check) => check.group === 'secrets' && check.status === 'FAIL'
    ).length,
    headerFailures: checks.filter(
      (check) => check.group === 'headers' && check.status === 'FAIL'
    ).length,
    networkWarnings: checks.filter(
      (check) => check.group === 'network' && check.status === 'WARN'
    ).length
  };
}

function getCorsAuditSnapshot() {
  const allowedOriginsRaw =
    process.env.CORS_ORIGIN ||
    process.env.ALLOWED_ORIGINS ||
    process.env.CLIENT_ORIGIN ||
    '';

  const allowedOrigins = allowedOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const nodeEnv = process.env.NODE_ENV || 'development';

  const wildcardAllowed = allowedOrigins.includes('*');
  const localhostAllowed = allowedOrigins.some((origin) =>
    origin.includes('localhost')
  );

  const status =
    isProduction() && (wildcardAllowed || allowedOrigins.length === 0)
      ? 'WARN'
      : 'PASS';

  return {
    ok: true,
    status,
    nodeEnv,
    allowedOrigins,
    wildcardAllowed,
    localhostAllowed,
    message:
      status === 'PASS'
        ? 'CORS configuration is acceptable for the current environment.'
        : 'Production CORS should use explicit trusted origins.',
    generatedAt: nowIso()
  };
}

function buildSecurityExposureAudit() {
  const checks = [];
  const nodeEnv = process.env.NODE_ENV || 'development';

  const jwtSecret = getEnvValue('JWT_SECRET');
  const superAdminKey = getEnvValue('SUPER_ADMIN_API_KEY');

  if (hasWeakSecret(jwtSecret)) {
    addCheck(
      checks,
      'secrets',
      'JWT_SECRET strength',
      isProduction() ? 'FAIL' : 'WARN',
      isProduction(),
      isProduction()
        ? 'JWT_SECRET is missing or weak for production.'
        : 'JWT_SECRET exists but should be stronger before production.',
      '',
      'Use a long random secret before production deployment.'
    );
  } else {
    addCheck(
      checks,
      'secrets',
      'JWT_SECRET strength',
      'PASS',
      true,
      'JWT_SECRET appears strong.',
      '',
      ''
    );
  }

  if (hasWeakSecret(superAdminKey)) {
    addCheck(
      checks,
      'secrets',
      'SUPER_ADMIN_API_KEY strength',
      isProduction() ? 'FAIL' : 'WARN',
      isProduction(),
      isProduction()
        ? 'SUPER_ADMIN_API_KEY is missing or weak for production.'
        : 'SUPER_ADMIN_API_KEY exists but should be replaced before production.',
      '',
      'Use a long random admin key and do not expose it in frontend code.'
    );
  } else {
    addCheck(
      checks,
      'secrets',
      'SUPER_ADMIN_API_KEY strength',
      'PASS',
      true,
      'SUPER_ADMIN_API_KEY appears strong.',
      '',
      ''
    );
  }

  const reactAppSecrets = Object.keys(process.env).filter((key) => {
    const upper = key.toUpperCase();
    return (
      upper.startsWith('REACT_APP_') &&
      (upper.includes('SECRET') ||
        upper.includes('PRIVATE') ||
        upper.includes('TOKEN') ||
        upper.includes('SUPER_ADMIN'))
    );
  });

  if (reactAppSecrets.length > 0) {
    addCheck(
      checks,
      'frontend_exposure',
      'REACT_APP secret exposure',
      'FAIL',
      true,
      `Sensitive-looking REACT_APP_* variables detected: ${reactAppSecrets.join(', ')}`,
      '',
      'Never expose backend secrets through REACT_APP_* variables.'
    );
  } else {
    addCheck(
      checks,
      'frontend_exposure',
      'REACT_APP secret exposure',
      'PASS',
      true,
      'No sensitive-looking REACT_APP_* variables detected in backend environment.',
      '',
      ''
    );
  }

  const corsSnapshot = getCorsAuditSnapshot();

  if (corsSnapshot.status === 'WARN') {
    addCheck(
      checks,
      'network',
      'CORS configuration',
      'WARN',
      isProduction(),
      corsSnapshot.message,
      JSON.stringify(corsSnapshot),
      'Before production, set explicit trusted frontend origin.'
    );
  } else {
    addCheck(
      checks,
      'network',
      'CORS configuration',
      'PASS',
      true,
      corsSnapshot.message,
      JSON.stringify(corsSnapshot),
      ''
    );
  }

  addCheck(
    checks,
    'routes',
    'Sensitive system endpoint exposure',
    isProduction() ? 'WARN' : 'WARN',
    false,
    'Sensitive system endpoints are reachable locally. This is useful for development but must be locked before production.',
    '',
    'Before production, add admin guard to sensitive /api/system endpoints or disable them externally.'
  );

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
      type: check.status === 'FAIL' ? 'SECURITY_BLOCKER' : 'SECURITY_HARDENING_WARNING',
      auditName: 'Security Exposure Audit',
      title: `Review Security Exposure Audit: ${check.name}`,
      description: check.nextAction || check.message,
      details: check.details || ''
    }));

  return {
    ok: true,
    fallback: false,
    source: 'runtime-security-exposure-audit',
    phase: '23.5-security-exposure-audit',
    nodeEnv,
    readinessStatus,
    summary,
    checks,
    nextBestActions,
    generatedAt: nowIso()
  };
}

async function runSecurityExposureAudit() {
  return buildSecurityExposureAudit();
}

async function getSecurityExposureAudit() {
  return buildSecurityExposureAudit();
}

async function getSecurityExposureAuditSnapshot() {
  return buildSecurityExposureAudit();
}

async function auditSecurityExposure() {
  return buildSecurityExposureAudit();
}

async function runAudit() {
  return buildSecurityExposureAudit();
}

module.exports = {
  getCorsAuditSnapshot,
  buildSecurityExposureAudit,
  runSecurityExposureAudit,
  getSecurityExposureAudit,
  getSecurityExposureAuditSnapshot,
  auditSecurityExposure,
  runAudit
};