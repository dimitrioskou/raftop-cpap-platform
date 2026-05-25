// RAFTOP CPAP CARE Pro
// Phase 41.11B - Production Backend Authorization Enforcement
// Purpose: block protected production API routes unless a valid JWT or super-admin key is present.
// Public routes remain available: health, login, static/public probes.

const jwt = require("jsonwebtoken");

function normalizePath(value) {
  return String(value || "").split("?")[0].replace(/\/+$/, "") || "/";
}

function isPublicRoute(req) {
  const path = normalizePath(req.path || req.originalUrl || "");

  if (path === "/") return true;
  if (path === "/api/health") return true;
  if (path === "/health") return true;
  if (path === "/api/auth/login") return true;
  if (path === "/api/auth/register") return true;
  if (path === "/api/auth/forgot-password") return true;
  if (path === "/api/auth/reset-password") return true;
  if (path === "/api/patient/auth/login") return true;
  if (path === "/api/patient/login") return true;

  return false;
}

function isProtectedRoute(req) {
  const path = normalizePath(req.path || req.originalUrl || "");

  if (path.startsWith("/api/tenant")) return true;
  if (path.startsWith("/api/admin")) return true;
  if (path.startsWith("/api/system")) return true;
  if (path.startsWith("/api/patient")) return true;

  return false;
}

function getBearerToken(req) {
  const header =
    req.headers.authorization ||
    req.headers.Authorization ||
    "";

  if (!header) return "";

  const value = String(header).trim();

  if (value.toLowerCase().startsWith("bearer ")) {
    return value.slice(7).trim();
  }

  return "";
}

function getSuperAdminKey(req) {
  return String(
    req.headers["x-super-admin-key"] ||
    req.headers["X-Super-Admin-Key"] ||
    ""
  ).trim();
}

function getTenantId(req) {
  return String(
    req.headers["x-tenant-id"] ||
    req.headers["X-Tenant-Id"] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    ""
  ).trim();
}

function isStrictProductionMode() {
  return (
    String(process.env.NODE_ENV || "").toLowerCase() === "production" ||
    String(process.env.RAFTOP_STRICT_PRODUCTION_AUTH || "").toLowerCase() === "true"
  );
}

function verifyJwtToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret || String(secret).trim().length < 16) {
    return {
      ok: false,
      reason: "jwt_secret_missing_or_weak"
    };
  }

  try {
    const payload = jwt.verify(token, secret);

    return {
      ok: true,
      payload
    };
  } catch (err) {
    return {
      ok: false,
      reason: "jwt_invalid"
    };
  }
}

function attachAuthContext(req, payload) {
  req.auth = payload || {};
  req.user = payload || {};

  if (!req.tenantId) {
    req.tenantId =
      payload.tenant_id ||
      payload.tenantId ||
      payload.tenant ||
      getTenantId(req);
  }
}

function productionAuthEnforcement(req, res, next) {
  if (isPublicRoute(req)) {
    return next();
  }

  if (!isProtectedRoute(req)) {
    return next();
  }

  const strictMode = isStrictProductionMode();

  if (!strictMode) {
    return next();
  }

  const superAdminKey = getSuperAdminKey(req);
  const expectedSuperAdminKey = String(process.env.SUPER_ADMIN_API_KEY || "").trim();

  if (
    expectedSuperAdminKey &&
    expectedSuperAdminKey.length >= 16 &&
    superAdminKey &&
    superAdminKey === expectedSuperAdminKey
  ) {
    req.auth = {
      role: "super_admin",
      source: "x-super-admin-key"
    };
    req.user = req.auth;
    req.tenantId = getTenantId(req);
    return next();
  }

  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
      code: "AUTH_TOKEN_REQUIRED",
      message: "Protected endpoint requires Authorization: Bearer token."
    });
  }

  const verification = verifyJwtToken(token);

  if (!verification.ok) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
      code: "AUTH_TOKEN_INVALID",
      message: "Invalid or expired auth token."
    });
  }

  attachAuthContext(req, verification.payload);

  return next();
}

module.exports = {
  productionAuthEnforcement
};