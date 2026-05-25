const db = require('../db');

async function writeAclAudit({
  tenantId,
  role,
  path,
  permission,
  reason,
  source = 'backend',
  allowed = false,
  metadata = {}
}) {
  try {
    await db.query(
      `
      INSERT INTO acl_audit_log (
        tenant_id,
        role,
        path,
        permission,
        reason,
        source,
        allowed,
        metadata
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      `,
      [
        tenantId || 'unknown',
        role || 'unknown',
        path || '',
        permission || null,
        reason || null,
        source,
        allowed,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (error) {
    console.error('[ACL AUDIT]', error.message);
  }
}

module.exports = {
  writeAclAudit
};