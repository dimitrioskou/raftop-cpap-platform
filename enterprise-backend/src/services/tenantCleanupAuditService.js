const db = require('./db');

function normalizeTenantId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildCheck({
  group,
  name,
  status,
  critical = false,
  message,
  details = {},
  nextAction = null
}) {
  return {
    group,
    name,
    status,
    critical: critical === true,
    message,
    details,
    nextAction,
    generatedAt: new Date().toISOString()
  };
}

async function tableExists(tableName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
    `,
    [tableName]
  );

  return result.rows[0]?.exists === true;
}

async function columnExists(tableName, columnName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
    `,
    [tableName, columnName]
  );

  return result.rows[0]?.exists === true;
}

async function getRowsIfTableExists(tableName, sql, params = []) {
  const exists = await tableExists(tableName);

  if (!exists) {
    return {
      exists: false,
      rows: [],
      error: null
    };
  }

  try {
    const result = await db.query(sql, params);

    return {
      exists: true,
      rows: result.rows,
      error: null
    };
  } catch (error) {
    return {
      exists: true,
      rows: [],
      error: error.message
    };
  }
}

async function getTenantSubscriptions() {
  const exists = await tableExists('tenant_subscriptions');

  if (!exists) {
    return {
      exists: false,
      rows: [],
      error: null
    };
  }

  const possibleColumns = [
    'id',
    'tenant_id',
    'tenantId',
    'plan',
    'status',
    'seats',
    'patient_limit',
    'patientLimit',
    'billing_email',
    'billingEmail',
    'created_at',
    'createdAt',
    'updated_at',
    'updatedAt'
  ];

  const selected = [];

  for (const column of possibleColumns) {
    if (await columnExists('tenant_subscriptions', column)) {
      selected.push(`"${column}"`);
    }
  }

  const sql = `
    SELECT ${selected.length > 0 ? selected.join(', ') : '*'}
    FROM tenant_subscriptions
    ORDER BY COALESCE("updated_at", "created_at", NOW()) DESC
    LIMIT 500
  `;

  try {
    const result = await db.query(sql);

    return {
      exists: true,
      rows: result.rows,
      error: null
    };
  } catch (error) {
    const fallback = await db.query(`
      SELECT *
      FROM tenant_subscriptions
      LIMIT 500
    `);

    return {
      exists: true,
      rows: fallback.rows,
      error: error.message
    };
  }
}

async function getTenantProfiles() {
  const exists = await tableExists('tenant_profiles');

  if (!exists) {
    return {
      exists: false,
      rows: [],
      error: null
    };
  }

  try {
    const result = await db.query(`
      SELECT *
      FROM tenant_profiles
      ORDER BY COALESCE(updated_at, created_at, NOW()) DESC
      LIMIT 500
    `);

    return {
      exists: true,
      rows: result.rows,
      error: null
    };
  } catch (error) {
    const fallback = await db.query(`
      SELECT *
      FROM tenant_profiles
      LIMIT 500
    `);

    return {
      exists: true,
      rows: fallback.rows,
      error: error.message
    };
  }
}

function getTenantIdFromRow(row) {
  return (
    row.tenant_id ||
    row.tenantId ||
    row.tenant ||
    row.id ||
    ''
  );
}

function getProfileTenantId(row) {
  return (
    row.tenant_id ||
    row.tenantId ||
    row.tenant ||
    ''
  );
}

function getDisplayName(row) {
  return (
    row.display_name ||
    row.displayName ||
    row.name ||
    row.brand_name ||
    row.brandName ||
    ''
  );
}

function getBrandName(row) {
  return (
    row.brand_name ||
    row.brandName ||
    row.brand ||
    row.display_name ||
    row.displayName ||
    ''
  );
}

function detectDemoTenantIds(rows) {
  return rows
    .map((row) => ({
      tenantId: normalizeTenantId(getTenantIdFromRow(row)),
      raw: row
    }))
    .filter((item) =>
      item.tenantId.includes('demo') ||
      item.tenantId.includes('test') ||
      item.tenantId.includes('sample')
    );
}

function detectRaftopoulosTenantIds(rows) {
  return rows
    .map((row) => ({
      tenantId: normalizeTenantId(getTenantIdFromRow(row)),
      raw: row
    }))
    .filter((item) =>
      item.tenantId.includes('raftopoulos') ||
      item.tenantId.includes('raftop')
    );
}

function countBy(items, getKey) {
  const map = {};

  for (const item of items) {
    const key = getKey(item);

    if (!key) continue;

    map[key] = (map[key] || 0) + 1;
  }

  return map;
}

function duplicatesFromMap(map) {
  return Object.entries(map)
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      key,
      count
    }));
}

async function checkSubscriptionTable(subscriptions) {
  if (!subscriptions.exists) {
    return buildCheck({
      group: 'tenants',
      name: 'Tenant subscriptions table',
      status: 'FAIL',
      critical: true,
      message: 'tenant_subscriptions table is missing.',
      details: subscriptions,
      nextAction: 'Create/run subscription migration before release candidate.'
    });
  }

  if (subscriptions.error) {
    return buildCheck({
      group: 'tenants',
      name: 'Tenant subscriptions table',
      status: 'WARN',
      critical: false,
      message: 'tenant_subscriptions table was readable with fallback query, but schema ordering failed.',
      details: {
        error: subscriptions.error,
        count: subscriptions.rows.length
      },
      nextAction: 'Review tenant_subscriptions schema and standardize timestamp columns.'
    });
  }

  if (subscriptions.rows.length === 0) {
    return buildCheck({
      group: 'tenants',
      name: 'Tenant subscriptions records',
      status: 'FAIL',
      critical: true,
      message: 'No tenant subscription records found.',
      details: {
        count: 0
      },
      nextAction: 'Create at least one active tenant subscription before demo.'
    });
  }

  return buildCheck({
    group: 'tenants',
    name: 'Tenant subscriptions records',
    status: 'PASS',
    critical: true,
    message: 'Tenant subscriptions exist.',
    details: {
      count: subscriptions.rows.length
    }
  });
}

async function checkProfileTable(profiles) {
  if (!profiles.exists) {
    return buildCheck({
      group: 'profiles',
      name: 'Tenant profiles table',
      status: 'FAIL',
      critical: true,
      message: 'tenant_profiles table is missing.',
      details: profiles,
      nextAction: 'Create/run tenant_profiles migration before release candidate.'
    });
  }

  if (profiles.rows.length === 0) {
    return buildCheck({
      group: 'profiles',
      name: 'Tenant profile records',
      status: 'FAIL',
      critical: true,
      message: 'No tenant profile records found.',
      details: {
        count: 0
      },
      nextAction: 'Open Tenant Profiles page and create/backfill tenant profiles.'
    });
  }

  return buildCheck({
    group: 'profiles',
    name: 'Tenant profile records',
    status: 'PASS',
    critical: true,
    message: 'Tenant profiles exist.',
    details: {
      count: profiles.rows.length
    }
  });
}

function checkProfileSubscriptionAlignment(subscriptions, profiles) {
  if (!subscriptions.exists || !profiles.exists) {
    return buildCheck({
      group: 'alignment',
      name: 'Profiles/subscriptions alignment',
      status: 'FAIL',
      critical: true,
      message: 'Cannot check alignment because one of the tables is missing.',
      details: {
        subscriptionsExists: subscriptions.exists,
        profilesExists: profiles.exists
      },
      nextAction: 'Fix missing tenant tables first.'
    });
  }

  const subscriptionIds = subscriptions.rows
    .map((row) => normalizeTenantId(getTenantIdFromRow(row)))
    .filter(Boolean);

  const profileIds = profiles.rows
    .map((row) => normalizeTenantId(getProfileTenantId(row)))
    .filter(Boolean);

  const subscriptionSet = new Set(subscriptionIds);
  const profileSet = new Set(profileIds);

  const missingProfiles = subscriptionIds.filter((tenantId) => !profileSet.has(tenantId));
  const orphanProfiles = profileIds.filter((tenantId) => !subscriptionSet.has(tenantId));

  if (missingProfiles.length > 0) {
    return buildCheck({
      group: 'alignment',
      name: 'Profiles/subscriptions alignment',
      status: 'FAIL',
      critical: true,
      message: 'Some subscriptions do not have matching tenant profiles.',
      details: {
        subscriptionCount: subscriptionIds.length,
        profileCount: profileIds.length,
        missingProfiles,
        orphanProfiles
      },
      nextAction: 'Backfill tenant_profiles for all subscription tenant IDs before demo.'
    });
  }

  if (orphanProfiles.length > 0) {
    return buildCheck({
      group: 'alignment',
      name: 'Profiles/subscriptions alignment',
      status: 'WARN',
      critical: false,
      message: 'There are tenant profiles without matching subscription records.',
      details: {
        subscriptionCount: subscriptionIds.length,
        profileCount: profileIds.length,
        missingProfiles,
        orphanProfiles
      },
      nextAction: 'Review orphan profiles. Keep only intentional demo/reseller records.'
    });
  }

  return buildCheck({
    group: 'alignment',
    name: 'Profiles/subscriptions alignment',
    status: 'PASS',
    critical: true,
    message: 'Every subscription has a matching tenant profile.',
    details: {
      subscriptionCount: subscriptionIds.length,
      profileCount: profileIds.length,
      missingProfiles,
      orphanProfiles
    }
  });
}

function checkDuplicateTenantIds(subscriptions, profiles) {
  const subscriptionIds = subscriptions.rows
    .map((row) => normalizeTenantId(getTenantIdFromRow(row)))
    .filter(Boolean);

  const profileIds = profiles.rows
    .map((row) => normalizeTenantId(getProfileTenantId(row)))
    .filter(Boolean);

  const duplicateSubscriptions = duplicatesFromMap(countBy(subscriptionIds, (id) => id));
  const duplicateProfiles = duplicatesFromMap(countBy(profileIds, (id) => id));

  if (duplicateSubscriptions.length > 0 || duplicateProfiles.length > 0) {
    return buildCheck({
      group: 'duplicates',
      name: 'Duplicate tenant IDs',
      status: 'WARN',
      critical: true,
      message: 'Duplicate tenant IDs were detected.',
      details: {
        duplicateSubscriptions,
        duplicateProfiles
      },
      nextAction: 'Remove or merge duplicate demo tenants before commercial demo.'
    });
  }

  return buildCheck({
    group: 'duplicates',
    name: 'Duplicate tenant IDs',
    status: 'PASS',
    critical: true,
    message: 'No duplicate tenant IDs detected.',
    details: {
      duplicateSubscriptions,
      duplicateProfiles
    }
  });
}

function checkDemoTenantNoise(subscriptions, profiles) {
  const demoSubscriptions = detectDemoTenantIds(subscriptions.rows);
  const demoProfiles = profiles.rows
    .map((row) => ({
      tenantId: normalizeTenantId(getProfileTenantId(row)),
      displayName: getDisplayName(row),
      brandName: getBrandName(row),
      raw: row
    }))
    .filter((item) =>
      item.tenantId.includes('demo') ||
      item.tenantId.includes('test') ||
      item.tenantId.includes('sample') ||
      String(item.displayName || '').toLowerCase().includes('demo') ||
      String(item.brandName || '').toLowerCase().includes('demo')
    );

  const demoCount = demoSubscriptions.length + demoProfiles.length;

  if (demoCount > 0) {
    return buildCheck({
      group: 'demo_cleanup',
      name: 'Demo/test tenant noise',
      status: 'WARN',
      critical: false,
      message: 'Demo/test tenant records are visible.',
      details: {
        demoSubscriptions: demoSubscriptions.map((item) => item.tenantId),
        demoProfiles: demoProfiles.map((item) => ({
          tenantId: item.tenantId,
          displayName: item.displayName,
          brandName: item.brandName
        }))
      },
      nextAction: 'Before external sales demo, hide/archive demo tenants or switch to a polished Raftopoulos tenant.'
    });
  }

  return buildCheck({
    group: 'demo_cleanup',
    name: 'Demo/test tenant noise',
    status: 'PASS',
    critical: false,
    message: 'No obvious demo/test tenant noise detected.',
    details: {
      demoCount
    }
  });
}

function checkRaftopoulosTenantReadiness(subscriptions, profiles) {
  const raftopoulosSubscriptions = detectRaftopoulosTenantIds(subscriptions.rows);

  const raftopoulosProfiles = profiles.rows
    .map((row) => ({
      tenantId: normalizeTenantId(getProfileTenantId(row)),
      displayName: getDisplayName(row),
      brandName: getBrandName(row),
      supportEmail: row.support_email || row.supportEmail || null,
      billingEmail: row.billing_email || row.billingEmail || null,
      contactEmail: row.contact_email || row.contactEmail || null,
      website: row.website || null,
      tenantType: row.tenant_type || row.tenantType || row.type || null,
      raw: row
    }))
    .filter((item) =>
      item.tenantId.includes('raftopoulos') ||
      item.tenantId.includes('raftop') ||
      String(item.displayName || '').toLowerCase().includes('raftopoulos') ||
      String(item.brandName || '').toLowerCase().includes('raftopoulos') ||
      String(item.displayName || '').toLowerCase().includes('raftop') ||
      String(item.brandName || '').toLowerCase().includes('raftop')
    );

  if (raftopoulosSubscriptions.length === 0 && raftopoulosProfiles.length === 0) {
    return buildCheck({
      group: 'raftopoulos',
      name: 'Raftopoulos tenant readiness',
      status: 'WARN',
      critical: true,
      message: 'No Raftopoulos tenant/profile was detected.',
      details: {
        raftopoulosSubscriptions: [],
        raftopoulosProfiles: []
      },
      nextAction: 'Create a clean raftopoulos-live tenant and profile before commercial presentation.'
    });
  }

  const incompleteProfiles = raftopoulosProfiles.filter((profile) => {
    return (
      !profile.displayName ||
      !profile.brandName ||
      !profile.billingEmail ||
      !profile.supportEmail
    );
  });

  if (incompleteProfiles.length > 0) {
    return buildCheck({
      group: 'raftopoulos',
      name: 'Raftopoulos tenant readiness',
      status: 'WARN',
      critical: true,
      message: 'Raftopoulos tenant/profile exists but metadata is incomplete.',
      details: {
        raftopoulosSubscriptions: raftopoulosSubscriptions.map((item) => item.tenantId),
        raftopoulosProfiles,
        incompleteProfiles
      },
      nextAction: 'Complete display name, brand name, support email and billing email.'
    });
  }

  return buildCheck({
    group: 'raftopoulos',
    name: 'Raftopoulos tenant readiness',
    status: 'PASS',
    critical: true,
    message: 'Raftopoulos tenant/profile metadata looks present.',
    details: {
      raftopoulosSubscriptions: raftopoulosSubscriptions.map((item) => item.tenantId),
      raftopoulosProfiles
    }
  });
}

async function checkPatientDemoNoise() {
  const possibleTables = ['patients', 'tenant_patients'];

  const results = [];

  for (const table of possibleTables) {
    if (!(await tableExists(table))) {
      results.push({
        table,
        exists: false,
        count: 0,
        demoRows: []
      });
      continue;
    }

    const hasTenantId = await columnExists(table, 'tenant_id');
    const hasName = await columnExists(table, 'name') || await columnExists(table, 'patient_name');
    const hasEmail = await columnExists(table, 'email') || await columnExists(table, 'patient_email');

    let nameExpr = `'unknown'`;
    if (await columnExists(table, 'name')) nameExpr = 'name';
    if (await columnExists(table, 'patient_name')) nameExpr = 'patient_name';

    let emailExpr = `NULL`;
    if (await columnExists(table, 'email')) emailExpr = 'email';
    if (await columnExists(table, 'patient_email')) emailExpr = 'patient_email';

    let tenantExpr = `NULL`;
    if (hasTenantId) tenantExpr = 'tenant_id';

    const result = await db.query(`
      SELECT
        ${tenantExpr} AS tenant_id,
        ${nameExpr} AS patient_name,
        ${emailExpr} AS patient_email
      FROM ${table}
      WHERE
        LOWER(COALESCE(${nameExpr}::text, '')) LIKE '%demo%'
        OR LOWER(COALESCE(${nameExpr}::text, '')) LIKE '%test%'
        OR LOWER(COALESCE(${emailExpr}::text, '')) LIKE '%example%'
        OR LOWER(COALESCE(${emailExpr}::text, '')) LIKE '%test%'
      LIMIT 50
    `);

    const countResult = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM ${table}
    `);

    results.push({
      table,
      exists: true,
      count: Number(countResult.rows[0]?.count || 0),
      demoRows: result.rows,
      inspected: {
        hasTenantId,
        hasName,
        hasEmail
      }
    });
  }

  const demoRows = results.flatMap((item) => item.demoRows || []);

  if (demoRows.length > 0) {
    return buildCheck({
      group: 'data_cleanup',
      name: 'Patient demo/test data',
      status: 'WARN',
      critical: false,
      message: 'Demo/test/example patient data was detected.',
      details: {
        results
      },
      nextAction: 'Before external demo, use clean realistic patient data or hide demo/test rows.'
    });
  }

  return buildCheck({
    group: 'data_cleanup',
    name: 'Patient demo/test data',
    status: 'PASS',
    critical: false,
    message: 'No obvious demo/test patient rows detected.',
    details: {
      results
    }
  });
}

async function checkDeviceDemoNoise() {
  const possibleTables = ['devices', 'tenant_devices'];

  const results = [];

  for (const table of possibleTables) {
    if (!(await tableExists(table))) {
      results.push({
        table,
        exists: false,
        count: 0,
        demoRows: []
      });
      continue;
    }

    const hasSerial = await columnExists(table, 'serial_number') || await columnExists(table, 'device_serial');
    const hasModel = await columnExists(table, 'model') || await columnExists(table, 'device_model');

    let serialExpr = `NULL`;
    if (await columnExists(table, 'serial_number')) serialExpr = 'serial_number';
    if (await columnExists(table, 'device_serial')) serialExpr = 'device_serial';

    let modelExpr = `NULL`;
    if (await columnExists(table, 'model')) modelExpr = 'model';
    if (await columnExists(table, 'device_model')) modelExpr = 'device_model';

    const result = await db.query(`
      SELECT
        ${serialExpr} AS serial_number,
        ${modelExpr} AS model
      FROM ${table}
      WHERE
        LOWER(COALESCE(${serialExpr}::text, '')) LIKE '%demo%'
        OR LOWER(COALESCE(${serialExpr}::text, '')) LIKE '%test%'
        OR LOWER(COALESCE(${modelExpr}::text, '')) LIKE '%demo%'
        OR LOWER(COALESCE(${modelExpr}::text, '')) LIKE '%test%'
      LIMIT 50
    `);

    const countResult = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM ${table}
    `);

    results.push({
      table,
      exists: true,
      count: Number(countResult.rows[0]?.count || 0),
      demoRows: result.rows,
      inspected: {
        hasSerial,
        hasModel
      }
    });
  }

  const demoRows = results.flatMap((item) => item.demoRows || []);

  if (demoRows.length > 0) {
    return buildCheck({
      group: 'data_cleanup',
      name: 'Device demo/test data',
      status: 'WARN',
      critical: false,
      message: 'Demo/test device data was detected.',
      details: {
        results
      },
      nextAction: 'Before external demo, use clean realistic device records.'
    });
  }

  return buildCheck({
    group: 'data_cleanup',
    name: 'Device demo/test data',
    status: 'PASS',
    critical: false,
    message: 'No obvious demo/test device rows detected.',
    details: {
      results
    }
  });
}

function buildSummary(checks) {
  return {
    total: checks.length,
    passed: checks.filter((check) => check.status === 'PASS').length,
    warned: checks.filter((check) => check.status === 'WARN').length,
    failed: checks.filter((check) => check.status === 'FAIL').length,
    criticalFailed: checks.filter((check) => check.status === 'FAIL' && check.critical).length,
    criticalWarnings: checks.filter((check) => check.status === 'WARN' && check.critical).length,
    tenantFailures: checks.filter((check) => check.group === 'tenants' && check.status === 'FAIL').length,
    profileFailures: checks.filter((check) => check.group === 'profiles' && check.status === 'FAIL').length,
    alignmentFailures: checks.filter((check) => check.group === 'alignment' && check.status === 'FAIL').length,
    raftopoulosWarnings: checks.filter((check) => check.group === 'raftopoulos' && check.status === 'WARN').length,
    demoWarnings: checks.filter((check) => check.group.includes('cleanup') && check.status === 'WARN').length
  };
}

function buildNextBestActions(checks, summary) {
  const actions = [];

  const criticalFailures = checks.filter((check) => check.status === 'FAIL' && check.critical);
  const criticalWarnings = checks.filter((check) => check.status === 'WARN' && check.critical);
  const warnings = checks.filter((check) => check.status === 'WARN' && !check.critical);

  for (const check of criticalFailures.slice(0, 5)) {
    actions.push({
      priority: 'HIGH',
      type: 'TENANT_CLEANUP_BLOCKER',
      title: `Fix: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of criticalWarnings.slice(0, 5)) {
    actions.push({
      priority: 'HIGH',
      type: 'TENANT_CLEANUP_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of warnings.slice(0, 5)) {
    actions.push({
      priority: 'MEDIUM',
      type: 'DEMO_CLEANUP_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'TENANT_CLEANUP_READY',
      title: 'Tenant cleanup audit is clean',
      description: 'Proceed to final release candidate checklist.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'TENANT_CLEANUP_ACCEPTABLE_WITH_WARNINGS',
      title: 'Tenant cleanup acceptable with warnings',
      description: 'No hard blocker was found, but demo/test tenant noise should be cleaned before sales presentation.'
    });
  }

  return actions;
}

async function runTenantCleanupAudit() {
  const subscriptions = await getTenantSubscriptions();
  const profiles = await getTenantProfiles();

  const checks = [];

  checks.push(await checkSubscriptionTable(subscriptions));
  checks.push(await checkProfileTable(profiles));
  checks.push(checkProfileSubscriptionAlignment(subscriptions, profiles));
  checks.push(checkDuplicateTenantIds(subscriptions, profiles));
  checks.push(checkDemoTenantNoise(subscriptions, profiles));
  checks.push(checkRaftopoulosTenantReadiness(subscriptions, profiles));
  checks.push(await checkPatientDemoNoise());
  checks.push(await checkDeviceDemoNoise());

  const summary = buildSummary(checks);

  const readinessStatus =
    summary.criticalFailed > 0
      ? 'BLOCKED'
      : summary.failed > 0
        ? 'NEEDS_FIX'
        : summary.warned > 0
          ? 'NEEDS_ATTENTION'
          : 'READY';

  return {
    ok: summary.criticalFailed === 0,
    fallback: false,
    source: 'runtime-tenant-cleanup-audit',
    phase: '23.6-demo-tenant-raftopoulos-cleanup-audit',
    readinessStatus,
    summary,
    checks,
    nextBestActions: buildNextBestActions(checks, summary),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runTenantCleanupAudit
};