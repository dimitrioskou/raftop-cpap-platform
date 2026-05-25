const {
  writeUserActivityFromRequest,
  inferActionFromRequest
} = require('../services/userActivityAuditService');

function isUserActivityAuditEnabled() {
  return String(process.env.USER_ACTIVITY_AUDIT_ENABLED || 'true').toLowerCase() === 'true';
}

function getPath(req) {
  return String(req.originalUrl || req.url || '').split('?')[0];
}

function shouldSkipAudit(req) {
  const path = getPath(req);

  if (path === '/api/health') return true;
  if (path === '/favicon.ico') return true;
  if (path.startsWith('/static/')) return true;

  return false;
}

function buildMetadata(req) {
  return {
    requestId: req.requestId || req.headers['x-request-id'] || null,
    query: req.query || {},
    runtimeRole:
      req.headers['x-runtime-role'] ||
      req.headers['x-user-role'] ||
      req.headers.role ||
      null,
    patientId:
      req.headers['x-patient-id'] ||
      req.query?.patientId ||
      req.query?.patient_id ||
      null
  };
}

function userActivityAuditMiddleware(req, res, next) {
  if (!isUserActivityAuditEnabled()) {
    return next();
  }

  if (shouldSkipAudit(req)) {
    return next();
  }

  const startedAt = Date.now();

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const success = statusCode < 400;

    writeUserActivityFromRequest(req, {
      action: inferActionFromRequest(req),
      statusCode,
      success,
      metadata: {
        ...buildMetadata(req),
        durationMs: Date.now() - startedAt
      }
    });
  });

  return next();
}

module.exports = userActivityAuditMiddleware;