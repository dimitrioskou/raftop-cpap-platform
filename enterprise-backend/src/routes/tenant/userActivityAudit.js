const express = require('express');
const db = require('../../services/db');

const router = express.Router();

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    'raftopoulos-live'
  );
}

function toLimit(value, fallback = 100) {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, 500);
  }

  return fallback;
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const limit = toLimit(req.query.limit, 100);

    const eventsResult = await db.query(
      `
      SELECT
        id,
        tenant_id,
        user_id,
        user_email,
        role,
        method,
        path,
        action,
        source,
        status_code,
        success,
        ip,
        user_agent,
        metadata,
        created_at
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [tenantId, limit]
    );

    const summaryResult = await db.query(
      `
      SELECT
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE success = true)::int AS successful_events,
        COUNT(*) FILTER (WHERE success = false)::int AS failed_events,
        COUNT(DISTINCT role)::int AS roles_seen,
        COUNT(DISTINCT path)::int AS paths_seen,
        COUNT(DISTINCT user_email)::int AS users_seen
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      `,
      [tenantId]
    );

    const byRoleResult = await db.query(
      `
      SELECT
        COALESCE(role, 'unknown') AS role,
        COUNT(*)::int AS event_count,
        COUNT(*) FILTER (WHERE success = false)::int AS failed_count
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(role, 'unknown')
      ORDER BY event_count DESC, role ASC
      LIMIT 20
      `,
      [tenantId]
    );

    const byPathResult = await db.query(
      `
      SELECT
        path,
        COUNT(*)::int AS event_count,
        COUNT(*) FILTER (WHERE success = false)::int AS failed_count
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      GROUP BY path
      ORDER BY event_count DESC, path ASC
      LIMIT 20
      `,
      [tenantId]
    );

    const failedResult = await db.query(
      `
      SELECT
        id,
        role,
        method,
        path,
        action,
        status_code,
        success,
        created_at
      FROM user_activity_audit_log
      WHERE tenant_id = $1
        AND success = false
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [tenantId]
    );

    return res.json({
      ok: true,
      fallback: false,
      source: 'user-activity-audit-postgres',
      phase: '35A.5-user-activity-audit-api',
      tenantId,
      tenant_id: tenantId,
      summary: summaryResult.rows[0] || {
        total_events: 0,
        successful_events: 0,
        failed_events: 0,
        roles_seen: 0,
        paths_seen: 0,
        users_seen: 0
      },
      byRole: byRoleResult.rows,
      byPath: byPathResult.rows,
      failedEvents: failedResult.rows,
      events: eventsResult.rows,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'USER_ACTIVITY_AUDIT_QUERY_FAILED',
      message: error.message,
      phase: '35A.5-user-activity-audit-api'
    });
  }
});

module.exports = router;