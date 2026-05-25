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

function riskLevel(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  if (score > 0) return 'low';
  return 'clear';
}

function riskLabel(score) {
  if (score >= 75) return 'High security attention required';
  if (score >= 40) return 'Moderate security attention';
  if (score > 0) return 'Low security activity';
  return 'Clear';
}

function calculateRiskScore({
  deniedEvents,
  totalEvents,
  uniqueDeniedPaths,
  failedUserActivity,
  totalUserActivity,
  openSystemAlerts,
  failedLogins,
  failedLoginRiskScore
}) {
  let score = 0;

  if (deniedEvents > 0) score += 20;
  if (deniedEvents >= 5) score += 20;
  if (deniedEvents >= 20) score += 25;
  if (uniqueDeniedPaths >= 3) score += 20;

  const denyRatio = totalEvents > 0 ? deniedEvents / totalEvents : 0;
  if (denyRatio > 0.25) score += 10;
  if (denyRatio > 0.50) score += 15;

  if (failedUserActivity > 0) score += 10;
  if (failedUserActivity >= 5) score += 15;
  if (failedUserActivity >= 20) score += 20;

  const failedActivityRatio =
    totalUserActivity > 0 ? failedUserActivity / totalUserActivity : 0;

  if (failedActivityRatio > 0.10) score += 10;
  if (failedActivityRatio > 0.25) score += 15;

  if (failedLogins > 0) score += 10;
  if (failedLogins >= 5) score += 15;
  if (failedLogins >= 20) score += 20;

  if (failedLoginRiskScore >= 40) score += 10;
  if (failedLoginRiskScore >= 75) score += 15;

  if (openSystemAlerts > 0) score += 10;
  if (openSystemAlerts >= 5) score += 15;

  return Math.min(score, 100);
}

function calculateFailedLoginRisk({ totalFailed, uniqueEmails, uniqueIps, topEmailCount, topIpCount }) {
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
    level: riskLevel(score),
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

async function safeQuery(sql, params, fallbackRows = []) {
  try {
    const result = await db.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('[securityOverview] optional query failed:', error.message);
    return fallbackRows;
  }
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);

    const aclSummaryRows = await safeQuery(
      `
      SELECT
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE allowed = false)::int AS denied_events,
        COUNT(*) FILTER (WHERE allowed = true)::int AS allowed_events,
        COUNT(DISTINCT CASE WHEN allowed = false THEN path END)::int AS unique_denied_paths,
        COUNT(DISTINCT CASE WHEN allowed = false THEN role END)::int AS unique_denied_roles
      FROM acl_audit_log
      WHERE tenant_id = $1
      `,
      [tenantId],
      [
        {
          total_events: 0,
          denied_events: 0,
          allowed_events: 0,
          unique_denied_paths: 0,
          unique_denied_roles: 0
        }
      ]
    );

    const recentDeniedRows = await safeQuery(
      `
      SELECT
        id,
        role,
        path,
        permission,
        reason,
        source,
        allowed,
        created_at
      FROM acl_audit_log
      WHERE tenant_id = $1
        AND allowed = false
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [tenantId]
    );

    const topDeniedRoleRows = await safeQuery(
      `
      SELECT role, COUNT(*)::int AS count
      FROM acl_audit_log
      WHERE tenant_id = $1
        AND allowed = false
      GROUP BY role
      ORDER BY count DESC, role ASC
      LIMIT 1
      `,
      [tenantId]
    );

    const topDeniedPathRows = await safeQuery(
      `
      SELECT path, COUNT(*)::int AS count
      FROM acl_audit_log
      WHERE tenant_id = $1
        AND allowed = false
      GROUP BY path
      ORDER BY count DESC, path ASC
      LIMIT 1
      `,
      [tenantId]
    );

    const userActivitySummaryRows = await safeQuery(
      `
      SELECT
        COUNT(*)::int AS total_activity_events,
        COUNT(*) FILTER (WHERE success = true)::int AS successful_activity_events,
        COUNT(*) FILTER (WHERE success = false)::int AS failed_activity_events,
        COUNT(DISTINCT role)::int AS activity_roles_seen,
        COUNT(DISTINCT path)::int AS activity_paths_seen,
        COUNT(DISTINCT COALESCE(user_email, user_id))::int AS activity_users_seen
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      `,
      [tenantId],
      [
        {
          total_activity_events: 0,
          successful_activity_events: 0,
          failed_activity_events: 0,
          activity_roles_seen: 0,
          activity_paths_seen: 0,
          activity_users_seen: 0
        }
      ]
    );

    const recentFailedActivityRows = await safeQuery(
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
      LIMIT 10
      `,
      [tenantId]
    );

    const topActiveRoleRows = await safeQuery(
      `
      SELECT
        COALESCE(role, 'unknown') AS role,
        COUNT(*)::int AS count
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(role, 'unknown')
      ORDER BY count DESC, role ASC
      LIMIT 1
      `,
      [tenantId]
    );

    const topAccessedPathRows = await safeQuery(
      `
      SELECT
        path,
        COUNT(*)::int AS count
      FROM user_activity_audit_log
      WHERE tenant_id = $1
      GROUP BY path
      ORDER BY count DESC, path ASC
      LIMIT 1
      `,
      [tenantId]
    );

    const failedLoginSummaryRows = await safeQuery(
      `
      SELECT
        COUNT(*)::int AS total_failed,
        COUNT(DISTINCT email)::int AS unique_emails,
        COUNT(DISTINCT ip)::int AS unique_ips
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      `,
      [tenantId],
      [
        {
          total_failed: 0,
          unique_emails: 0,
          unique_ips: 0
        }
      ]
    );

    const topFailedEmailRows = await safeQuery(
      `
      SELECT
        COALESCE(email, 'unknown') AS email,
        COUNT(*)::int AS count,
        MAX(created_at) AS last_seen
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(email, 'unknown')
      ORDER BY count DESC, last_seen DESC
      LIMIT 1
      `,
      [tenantId]
    );

    const topFailedIpRows = await safeQuery(
      `
      SELECT
        COALESCE(ip, 'unknown') AS ip,
        COUNT(*)::int AS count,
        MAX(created_at) AS last_seen
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      GROUP BY COALESCE(ip, 'unknown')
      ORDER BY count DESC, last_seen DESC
      LIMIT 1
      `,
      [tenantId]
    );

    const recentFailedLoginRows = await safeQuery(
      `
      SELECT
        id,
        email,
        role,
        reason,
        status_code,
        ip,
        source,
        created_at
      FROM failed_login_audit_log
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [tenantId]
    );

    const systemAlertsRows = await safeQuery(
      `
      SELECT COUNT(*)::int AS open_alerts
      FROM system_alerts
      WHERE COALESCE(status, 'open') IN ('open', 'active', 'critical', 'warning')
      `,
      [],
      [{ open_alerts: 0 }]
    );

    const tenantContextRows = await safeQuery(
      `
      SELECT
        tenant_id,
        company_name,
        platform_name,
        plan,
        status
      FROM tenant_registry
      WHERE tenant_id = $1
      LIMIT 1
      `,
      [tenantId],
      []
    );

    const aclSummary = aclSummaryRows[0] || {
      total_events: 0,
      denied_events: 0,
      allowed_events: 0,
      unique_denied_paths: 0,
      unique_denied_roles: 0
    };

    const activitySummary = userActivitySummaryRows[0] || {
      total_activity_events: 0,
      successful_activity_events: 0,
      failed_activity_events: 0,
      activity_roles_seen: 0,
      activity_paths_seen: 0,
      activity_users_seen: 0
    };

    const failedLoginSummary = failedLoginSummaryRows[0] || {
      total_failed: 0,
      unique_emails: 0,
      unique_ips: 0
    };

    const failedLoginRisk = calculateFailedLoginRisk({
      totalFailed: Number(failedLoginSummary.total_failed || 0),
      uniqueEmails: Number(failedLoginSummary.unique_emails || 0),
      uniqueIps: Number(failedLoginSummary.unique_ips || 0),
      topEmailCount: Number(topFailedEmailRows[0]?.count || 0),
      topIpCount: Number(topFailedIpRows[0]?.count || 0)
    });

    const openSystemAlerts = Number(systemAlertsRows[0]?.open_alerts || 0);

    const score = calculateRiskScore({
      deniedEvents: Number(aclSummary.denied_events || 0),
      totalEvents: Number(aclSummary.total_events || 0),
      uniqueDeniedPaths: Number(aclSummary.unique_denied_paths || 0),
      failedUserActivity: Number(activitySummary.failed_activity_events || 0),
      totalUserActivity: Number(activitySummary.total_activity_events || 0),
      openSystemAlerts,
      failedLogins: Number(failedLoginSummary.total_failed || 0),
      failedLoginRiskScore: failedLoginRisk.score
    });

    return res.json({
      ok: true,
      fallback: false,
      source: 'security-overview-postgres',
      phase: '35A.20-security-overview-failed-login-risk',
      tenantId,
      tenant_id: tenantId,

      tenant: tenantContextRows[0] || {
        tenant_id: tenantId,
        status: 'unknown',
        plan: 'unknown'
      },

      summary: {
        totalEvents: Number(aclSummary.total_events || 0),
        deniedEvents: Number(aclSummary.denied_events || 0),
        allowedEvents: Number(aclSummary.allowed_events || 0),
        uniqueDeniedPaths: Number(aclSummary.unique_denied_paths || 0),
        uniqueDeniedRoles: Number(aclSummary.unique_denied_roles || 0),
        openSystemAlerts,

        userActivityTotalEvents: Number(activitySummary.total_activity_events || 0),
        userActivitySuccessfulEvents: Number(activitySummary.successful_activity_events || 0),
        userActivityFailedEvents: Number(activitySummary.failed_activity_events || 0),
        userActivityRolesSeen: Number(activitySummary.activity_roles_seen || 0),
        userActivityPathsSeen: Number(activitySummary.activity_paths_seen || 0),
        userActivityUsersSeen: Number(activitySummary.activity_users_seen || 0),

        failedLoginTotal: Number(failedLoginSummary.total_failed || 0),
        failedLoginUniqueEmails: Number(failedLoginSummary.unique_emails || 0),
        failedLoginUniqueIps: Number(failedLoginSummary.unique_ips || 0),
        failedLoginRiskScore: failedLoginRisk.score
      },

      userActivity: {
        totalEvents: Number(activitySummary.total_activity_events || 0),
        successfulEvents: Number(activitySummary.successful_activity_events || 0),
        failedEvents: Number(activitySummary.failed_activity_events || 0),
        rolesSeen: Number(activitySummary.activity_roles_seen || 0),
        pathsSeen: Number(activitySummary.activity_paths_seen || 0),
        usersSeen: Number(activitySummary.activity_users_seen || 0),
        topActiveRole: topActiveRoleRows[0] || null,
        topAccessedPath: topAccessedPathRows[0] || null,
        recentFailedEvents: recentFailedActivityRows
      },

      failedLogins: {
        totalFailed: Number(failedLoginSummary.total_failed || 0),
        uniqueEmails: Number(failedLoginSummary.unique_emails || 0),
        uniqueIps: Number(failedLoginSummary.unique_ips || 0),
        topFailedEmail: topFailedEmailRows[0] || null,
        topFailedIp: topFailedIpRows[0] || null,
        recentFailedLogins: recentFailedLoginRows,
        risk: failedLoginRisk
      },

      risk: {
        score,
        level: riskLevel(score),
        label: riskLabel(score)
      },

      topDeniedRole: topDeniedRoleRows[0] || null,
      topDeniedPath: topDeniedPathRows[0] || null,
      recentDeniedEvents: recentDeniedRows,

      complianceSignals: {
        aclDeniedEvents: Number(aclSummary.denied_events || 0),
        failedUserActivity: Number(activitySummary.failed_activity_events || 0),
        failedLogins: Number(failedLoginSummary.total_failed || 0),
        failedLoginRiskScore: failedLoginRisk.score,
        openSystemAlerts,

        hasRecentFailedActivity: recentFailedActivityRows.length > 0,
        hasRecentAclDenials: recentDeniedRows.length > 0,
        hasRecentFailedLogins: recentFailedLoginRows.length > 0,

        needsAttention:
          Number(aclSummary.denied_events || 0) > 0 ||
          Number(activitySummary.failed_activity_events || 0) > 0 ||
          Number(failedLoginSummary.total_failed || 0) > 0 ||
          openSystemAlerts > 0
      },

      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'SECURITY_OVERVIEW_FAILED',
      message: error.message,
      phase: '35A.20-security-overview-failed-login-risk'
    });
  }
});

module.exports = router;