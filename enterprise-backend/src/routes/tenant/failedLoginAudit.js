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

function calculateRisk({ totalFailed, uniqueEmails, uniqueIps, topEmailCount, topIpCount }) {
  let score = 0;

  if (totalFailed > 0) score += 15;
  if (totalFailed >= 5) score += 20;
  if (totalFailed >= 20) score += 25;

  if (topEmailCount >= 3) score += 15;
  if (topEmailCount >= 10) score += 20;

  if (topIpCount >= 3) score += 15;
  if (topIpCount >= 10) score += 20;

  if (uniqueEmails >= 5) score += 10;
  if (uniqueIps >= 5) score += 10;

  score = Math.min(score, 100);

  return {
    score,
    level: score >= 75 ? 'high' : score >= 40 ? 'medium' : score > 0 ? 'low' : 'clear',
    label:
      score >= 75
        ? 'High failed-login risk'
        : score >= 40
          ? 'Moderate failed-login risk'
          : score > 0
            ? 'Low failed-login activity'
            : 'Clear'
  };
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const limit = toLimit(req.query.limit, 100);

    const summaryResult = await db.query(
      `
      SELECT
        COUNT(*)::int AS total_failed,
        COUNT(DISTINCT email)::int AS unique_emails,
        COUNT(DISTINCT ip)::int AS unique_ips
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      `,
      [tenantId]
    );

    const recentResult = await db.query(
      `
      SELECT
        id,
        tenant_id,
        email,
        role,
        reason,
        status_code,
        ip,
        user_agent,
        source,
        metadata,
        created_at
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [tenantId, limit]
    );

    const byEmailResult = await db.query(
      `
      SELECT
        COALESCE(email, 'unknown') AS email,
        COUNT(*)::int AS failed_count,
        MAX(created_at) AS last_seen
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(email, 'unknown')
      ORDER BY failed_count DESC, last_seen DESC
      LIMIT 20
      `,
      [tenantId]
    );

    const byIpResult = await db.query(
      `
      SELECT
        COALESCE(ip, 'unknown') AS ip,
        COUNT(*)::int AS failed_count,
        MAX(created_at) AS last_seen
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(ip, 'unknown')
      ORDER BY failed_count DESC, last_seen DESC
      LIMIT 20
      `,
      [tenantId]
    );

    const byReasonResult = await db.query(
      `
      SELECT
        reason,
        COUNT(*)::int AS failed_count
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      GROUP BY reason
      ORDER BY failed_count DESC, reason ASC
      LIMIT 20
      `,
      [tenantId]
    );

    const summary = summaryResult.rows[0] || {
      total_failed: 0,
      unique_emails: 0,
      unique_ips: 0
    };

    const topEmailCount = Number(byEmailResult.rows[0]?.failed_count || 0);
    const topIpCount = Number(byIpResult.rows[0]?.failed_count || 0);

    const risk = calculateRisk({
      totalFailed: Number(summary.total_failed || 0),
      uniqueEmails: Number(summary.unique_emails || 0),
      uniqueIps: Number(summary.unique_ips || 0),
      topEmailCount,
      topIpCount
    });

    return res.json({
      ok: true,
      fallback: false,
      source: 'failed-login-audit-postgres',
      phase: '35A.14-failed-login-audit-api',
      tenantId,
      tenant_id: tenantId,
      summary: {
        totalFailed: Number(summary.total_failed || 0),
        uniqueEmails: Number(summary.unique_emails || 0),
        uniqueIps: Number(summary.unique_ips || 0),
        topEmailCount,
        topIpCount
      },
      risk,
      byEmail: byEmailResult.rows,
      byIp: byIpResult.rows,
      byReason: byReasonResult.rows,
      recentFailedLogins: recentResult.rows,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'FAILED_LOGIN_AUDIT_QUERY_FAILED',
      message: error.message,
      phase: '35A.14-failed-login-audit-api'
    });
  }
});

module.exports = router;