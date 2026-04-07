const db = require('../../db');

const FALLBACK_MODULES = {
  items: [
    {
      id: 'MOD-001',
      key: 'dashboard',
      name: 'Dashboard',
      enabled: true,
      requiredPlan: 'starter',
      status: 'active'
    },
    {
      id: 'MOD-002',
      key: 'atlas',
      name: 'ATLAS System',
      enabled: true,
      requiredPlan: 'professional',
      status: 'active'
    },
    {
      id: 'MOD-003',
      key: 'predictive_ai',
      name: 'Predictive AI',
      enabled: true,
      requiredPlan: 'professional',
      status: 'active'
    },
    {
      id: 'MOD-004',
      key: 'doctor_billing',
      name: 'Doctor Billing',
      enabled: true,
      requiredPlan: 'enterprise',
      status: 'active'
    },
    {
      id: 'MOD-005',
      key: 'white_label',
      name: 'White Label',
      enabled: false,
      requiredPlan: 'enterprise',
      status: 'locked'
    }
  ],
  summary: {
    total: 5,
    enabled: 4,
    locked: 1
  }
};

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') return db.query(sql, params);
  if (db.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  throw new Error('Database query function is not available.');
}

function filterFallback(items, search) {
  if (!search) return items;
  const q = String(search).toLowerCase();

  return items.filter((item) =>
    [item.id, item.key, item.name, item.requiredPlan, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
}

async function getTenantModules({ tenantId, search = '' }) {
  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        CAST(tm.id AS TEXT) ILIKE $2
        OR COALESCE(tm.key, '') ILIKE $2
        OR COALESCE(tm.name, '') ILIKE $2
        OR COALESCE(tm.required_plan, '') ILIKE $2
        OR COALESCE(tm.status, '') ILIKE $2
      )
    `;
  }

  try {
    const result = await runQuery(
      `
        SELECT
          tm.id,
          COALESCE(NULLIF(tm.key, ''), 'module') AS key,
          COALESCE(NULLIF(tm.name, ''), 'Module') AS name,
          COALESCE(tm.enabled, FALSE) AS enabled,
          LOWER(COALESCE(NULLIF(tm.required_plan, ''), 'starter')) AS required_plan,
          LOWER(
            COALESCE(
              NULLIF(tm.status, ''),
              CASE WHEN tm.enabled = TRUE THEN 'active' ELSE 'locked' END
            )
          ) AS status
        FROM tenant_modules tm
        WHERE tm.tenant_id = $1
        ${searchSql}
        ORDER BY tm.created_at DESC NULLS LAST, tm.id DESC
        LIMIT 200
      `,
      params
    );

    const items = (result.rows || []).map((row) => ({
      id: row.id,
      key: row.key || 'module',
      name: row.name || 'Module',
      enabled: Boolean(row.enabled),
      requiredPlan: row.required_plan || 'starter',
      status: row.status || (row.enabled ? 'active' : 'locked')
    }));

    return {
      items,
      summary: {
        total: items.length,
        enabled: items.filter((item) => item.enabled).length,
        locked: items.filter((item) => !item.enabled || item.status === 'locked').length
      }
    };
  } catch (error) {
    const items = filterFallback(FALLBACK_MODULES.items, search);

    return {
      items,
      summary: {
        total: items.length,
        enabled: items.filter((item) => item.enabled).length,
        locked: items.filter((item) => !item.enabled || item.status === 'locked').length
      }
    };
  }
}

module.exports = {
  getTenantModules
};