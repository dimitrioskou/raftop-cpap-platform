function isGuardEnabled() {
  return String(process.env.SUPER_ADMIN_GUARD_ENABLED || 'true').toLowerCase() === 'true';
}

function getExpectedKey() {
  return process.env.SUPER_ADMIN_API_KEY || '';
}

function getProvidedKey(req) {
  const directKey = req.headers['x-super-admin-key'];

  if (directKey) {
    return String(directKey);
  }

  const authorization = req.headers.authorization || '';

  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
}

function superAdminGuard(req, res, next) {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!isGuardEnabled()) {
      return next();
    }

    const expectedKey = getExpectedKey();

    if (!expectedKey) {
      return res.status(500).json({
        ok: false,
        fallback: false,
        error: 'SUPER_ADMIN_GUARD_NOT_CONFIGURED',
        message: 'SUPER_ADMIN_API_KEY is missing from backend .env.',
        phase: '22.14-super-admin-backend-guard'
      });
    }

    const providedKey = getProvidedKey(req);

    if (!providedKey) {
      return res.status(401).json({
        ok: false,
        fallback: false,
        error: 'SUPER_ADMIN_KEY_REQUIRED',
        message: 'Super admin API key is required.',
        phase: '22.14-super-admin-backend-guard'
      });
    }

    if (providedKey !== expectedKey) {
      return res.status(403).json({
        ok: false,
        fallback: false,
        error: 'SUPER_ADMIN_KEY_INVALID',
        message: 'Invalid super admin API key.',
        phase: '22.14-super-admin-backend-guard'
      });
    }

    req.superAdmin = {
      authenticated: true,
      method: 'api_key',
      phase: '22.14-super-admin-backend-guard'
    };

    return next();
  } catch (error) {
    console.error('[superAdminGuard] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SUPER_ADMIN_GUARD_FAILED',
      message: error.message
    });
  }
}

module.exports = superAdminGuard;