const db = require('../../db');

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params);
  }

  throw new Error('Database query function is not available.');
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

async function ensureAtlasTables() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS atlas_cases (
      id TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS atlas_tasks (
      id TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS atlas_alerts (
      id TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS atlas_auto_actions (
      id TEXT PRIMARY KEY
    )
  `);

  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS tenant_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS patient_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS patient_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS doctor_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS action_group_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS reason TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS revenue_estimate NUMERIC DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS usage_avg_7d NUMERIC DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS ahi_avg_7d NUMERIC DEFAULT 0
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS assigned_to TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS lane TEXT DEFAULT 'today'
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await runQuery(`
    ALTER TABLE atlas_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS tenant_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS case_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS patient_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS title TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS owner TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS action_group_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await runQuery(`
    ALTER TABLE atlas_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS tenant_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS case_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS title TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS patient_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'warning'
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS message TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await runQuery(`
    ALTER TABLE atlas_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS tenant_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS case_id TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS rule_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS patient_name TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS action TEXT
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'System'
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued'
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
  `);
  await runQuery(`
    ALTER TABLE atlas_auto_actions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  await runQuery(`
    UPDATE atlas_cases
    SET tenant_id = 'demo-tenant'
    WHERE tenant_id IS NULL
  `);

  await runQuery(`
    UPDATE atlas_tasks
    SET tenant_id = 'demo-tenant'
    WHERE tenant_id IS NULL
  `);

  await runQuery(`
    UPDATE atlas_alerts
    SET tenant_id = 'demo-tenant'
    WHERE tenant_id IS NULL
  `);

  await runQuery(`
    UPDATE atlas_auto_actions
    SET tenant_id = 'demo-tenant'
    WHERE tenant_id IS NULL
  `);

  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_atlas_cases_tenant_id ON atlas_cases(tenant_id)
  `);
  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_atlas_tasks_tenant_id ON atlas_tasks(tenant_id)
  `);
  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_atlas_alerts_tenant_id ON atlas_alerts(tenant_id)
  `);
  await runQuery(`
    CREATE INDEX IF NOT EXISTS idx_atlas_auto_actions_tenant_id ON atlas_auto_actions(tenant_id)
  `);
}

function buildDemoCases(tenantId) {
  return [
    {
      id: 'AT-001',
      tenantId,
      patientId: 'PT-1003',
      patientName: 'Dimitris Leonidas',
      doctorName: 'Dr. Eleni Perraki',
      actionGroupName: 'Critical Compliance Drop',
      reason: 'Usage below target for 5 days',
      priority: 'critical',
      score: 94,
      revenueEstimate: 420,
      usageAvg7d: 2.8,
      ahiAvg7d: 10.9,
      assignedTo: 'Operations Admin',
      status: 'open',
      lane: 'today'
    },
    {
      id: 'AT-002',
      tenantId,
      patientId: 'PT-1002',
      patientName: 'Eleni Kosta',
      doctorName: 'Dr. Nikos Andreou',
      actionGroupName: 'Callback Requested',
      reason: 'Patient requested evening call',
      priority: 'high',
      score: 76,
      revenueEstimate: 180,
      usageAvg7d: 4.6,
      ahiAvg7d: 7.8,
      assignedTo: 'Follow-up Manager',
      status: 'open',
      lane: 'today'
    },
    {
      id: 'AT-003',
      tenantId,
      patientId: 'PT-1004',
      patientName: 'Maria Ioannou',
      doctorName: 'Dr. George Dimitriou',
      actionGroupName: 'Mask Leak Watch',
      reason: 'Leak increased for 2 consecutive nights',
      priority: 'medium',
      score: 58,
      revenueEstimate: 90,
      usageAvg7d: 7.4,
      ahiAvg7d: 3.4,
      assignedTo: 'Operations Admin',
      status: 'monitoring',
      lane: 'next'
    },
    {
      id: 'AT-004',
      tenantId,
      patientId: 'PT-1001',
      patientName: 'Giorgos Papadakis',
      doctorName: 'Dr. Maria Papadopoulou',
      actionGroupName: 'Education Follow-up',
      reason: 'Review adherence coaching outcome',
      priority: 'low',
      score: 28,
      revenueEstimate: 55,
      usageAvg7d: 7.8,
      ahiAvg7d: 2.7,
      assignedTo: 'Follow-up Manager',
      status: 'resolved',
      lane: 'done'
    }
  ];
}

function buildDemoTasks(tenantId) {
  return [
    {
      id: 'ATT-001',
      tenantId,
      caseId: 'AT-001',
      patientName: 'Dimitris Leonidas',
      title: 'Call critical compliance patient',
      owner: 'Operations Admin',
      priority: 'critical',
      status: 'open',
      dueAt: new Date().toISOString(),
      actionGroupName: 'Critical Compliance Drop'
    },
    {
      id: 'ATT-002',
      tenantId,
      caseId: 'AT-002',
      patientName: 'Eleni Kosta',
      title: 'Schedule requested callback',
      owner: 'Follow-up Manager',
      priority: 'high',
      status: 'pending',
      dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      actionGroupName: 'Callback Requested'
    },
    {
      id: 'ATT-003',
      tenantId,
      caseId: 'AT-003',
      patientName: 'Maria Ioannou',
      title: 'Review leak pattern',
      owner: 'Operations Admin',
      priority: 'medium',
      status: 'done',
      dueAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      actionGroupName: 'Mask Leak Watch'
    }
  ];
}

function buildDemoAlerts(tenantId) {
  return [
    {
      id: 'ALA-001',
      tenantId,
      caseId: 'AT-001',
      title: 'Critical non-compliance',
      patientName: 'Dimitris Leonidas',
      severity: 'critical',
      message: 'Usage dropped sharply and no recent recovery detected.',
      status: 'open'
    },
    {
      id: 'ALA-002',
      tenantId,
      caseId: 'AT-002',
      title: 'Offline device risk',
      patientName: 'Eleni Kosta',
      severity: 'high',
      message: 'No recent sync after callback request.',
      status: 'open'
    },
    {
      id: 'ALA-003',
      tenantId,
      caseId: 'AT-003',
      title: 'Leak trend watch',
      patientName: 'Maria Ioannou',
      severity: 'warning',
      message: 'Leak increased over two consecutive nights.',
      status: 'monitoring'
    }
  ];
}

function buildDemoAutoActions(tenantId) {
  return [
    {
      id: 'AA-001',
      tenantId,
      caseId: 'AT-001',
      ruleName: 'Critical compliance escalation',
      patientName: 'Dimitris Leonidas',
      action: 'Create urgent follow-up and notify doctor',
      owner: 'System',
      status: 'executed'
    },
    {
      id: 'AA-002',
      tenantId,
      caseId: 'AT-002',
      ruleName: 'Callback reminder',
      patientName: 'Eleni Kosta',
      action: 'Create callback task for evening slot',
      owner: 'System',
      status: 'queued'
    },
    {
      id: 'AA-003',
      tenantId,
      caseId: 'AT-003',
      ruleName: 'Leak monitoring follow-up',
      patientName: 'Maria Ioannou',
      action: 'Assign device review to operations admin',
      owner: 'System',
      status: 'executed'
    }
  ];
}

async function seedAtlasIfEmpty(tenantId) {
  await ensureAtlasTables();

  const casesCount = await runQuery(
    `SELECT COUNT(*)::int AS count FROM atlas_cases WHERE tenant_id = $1`,
    [tenantId]
  );

  if (safe(casesCount.rows?.[0]?.count) > 0) {
    return;
  }

  const demoCases = buildDemoCases(tenantId);

  for (const item of demoCases) {
    await runQuery(
      `
        INSERT INTO atlas_cases (
          id, tenant_id, patient_id, patient_name, doctor_name, action_group_name,
          reason, priority, score, revenue_estimate, usage_avg_7d, ahi_avg_7d,
          assigned_to, status, lane
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.tenantId,
        item.patientId,
        item.patientName,
        item.doctorName,
        item.actionGroupName,
        item.reason,
        item.priority,
        item.score,
        item.revenueEstimate,
        item.usageAvg7d,
        item.ahiAvg7d,
        item.assignedTo,
        item.status,
        item.lane
      ]
    );
  }

  for (const item of buildDemoTasks(tenantId)) {
    await runQuery(
      `
        INSERT INTO atlas_tasks (
          id, tenant_id, case_id, patient_name, title, owner, priority, status, due_at, action_group_name
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.tenantId,
        item.caseId,
        item.patientName,
        item.title,
        item.owner,
        item.priority,
        item.status,
        item.dueAt,
        item.actionGroupName
      ]
    );
  }

  for (const item of buildDemoAlerts(tenantId)) {
    await runQuery(
      `
        INSERT INTO atlas_alerts (
          id, tenant_id, case_id, title, patient_name, severity, message, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.tenantId,
        item.caseId,
        item.title,
        item.patientName,
        item.severity,
        item.message,
        item.status
      ]
    );
  }

  for (const item of buildDemoAutoActions(tenantId)) {
    await runQuery(
      `
        INSERT INTO atlas_auto_actions (
          id, tenant_id, case_id, rule_name, patient_name, action, owner, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        item.id,
        item.tenantId,
        item.caseId,
        item.ruleName,
        item.patientName,
        item.action,
        item.owner,
        item.status
      ]
    );
  }
}

function mapCase(row = {}) {
  return {
    id: normalizeText(row.id),
    patientName: normalizeText(row.patient_name, 'Unknown Patient'),
    patient_name: normalizeText(row.patient_name, 'Unknown Patient'),
    doctorName: normalizeText(row.doctor_name, '-'),
    doctor_name: normalizeText(row.doctor_name, '-'),
    actionGroupName: normalizeText(row.action_group_name, '-'),
    action_group_name: normalizeText(row.action_group_name, '-'),
    reason: normalizeText(row.reason, '-'),
    priority: normalizeText(row.priority, 'medium').toLowerCase(),
    score: safe(row.score),
    revenueEstimate: safe(row.revenue_estimate),
    revenue_estimate: safe(row.revenue_estimate),
    usageAvg7d: safe(row.usage_avg_7d),
    usage_avg_7d: safe(row.usage_avg_7d),
    ahiAvg7d: safe(row.ahi_avg_7d),
    ahi_avg_7d: safe(row.ahi_avg_7d),
    assignedTo: normalizeText(row.assigned_to, '-'),
    assigned_to: normalizeText(row.assigned_to, '-'),
    status: normalizeText(row.status, 'open').toLowerCase(),
    lane: normalizeText(row.lane, 'today').toLowerCase()
  };
}

async function getAtlasSummary({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      SELECT
        COUNT(*)::int AS total_cases,
        COUNT(*) FILTER (WHERE priority = 'critical')::int AS critical_cases,
        COUNT(*) FILTER (WHERE status IN ('open', 'monitoring', 'pending'))::int AS open_cases,
        COUNT(DISTINCT patient_name)::int AS active_patients,
        COALESCE(ROUND(AVG(score)), 0)::int AS avg_risk_score,
        COALESCE(SUM(revenue_estimate), 0)::numeric AS estimated_revenue
      FROM atlas_cases
      WHERE tenant_id = $1
    `,
    [tenantId]
  );

  const alerts = await runQuery(
    `
      SELECT COUNT(*)::int AS unresolved_alerts
      FROM atlas_alerts
      WHERE tenant_id = $1
        AND status IN ('open', 'monitoring', 'pending')
    `,
    [tenantId]
  );

  const autoActions = await runQuery(
    `
      SELECT COUNT(*)::int AS auto_actions_today
      FROM atlas_auto_actions
      WHERE tenant_id = $1
        AND created_at::date = CURRENT_DATE
    `,
    [tenantId]
  );

  const row = result.rows?.[0] || {};
  const alertsRow = alerts.rows?.[0] || {};
  const autoRow = autoActions.rows?.[0] || {};

  return {
    totalCases: safe(row.total_cases),
    total_cases: safe(row.total_cases),
    criticalCases: safe(row.critical_cases),
    critical_cases: safe(row.critical_cases),
    openCases: safe(row.open_cases),
    open_cases: safe(row.open_cases),
    activePatients: safe(row.active_patients),
    active_patients: safe(row.active_patients),
    avgRiskScore: safe(row.avg_risk_score),
    avg_risk_score: safe(row.avg_risk_score),
    estimatedRevenue: safe(row.estimated_revenue),
    estimated_revenue: safe(row.estimated_revenue),
    unresolvedAlerts: safe(alertsRow.unresolved_alerts),
    unresolved_alerts: safe(alertsRow.unresolved_alerts),
    autoActionsToday: safe(autoRow.auto_actions_today),
    auto_actions_today: safe(autoRow.auto_actions_today)
  };
}

async function getAtlasQueue({ tenantId, search = '', priority = '' }) {
  await seedAtlasIfEmpty(tenantId);

  const params = [tenantId];
  const conditions = ['tenant_id = $1'];

  if (priority) {
    params.push(String(priority).toLowerCase());
    conditions.push(`LOWER(priority) = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(`
      (
        COALESCE(patient_name, '') ILIKE $${idx}
        OR COALESCE(doctor_name, '') ILIKE $${idx}
        OR COALESCE(action_group_name, '') ILIKE $${idx}
        OR COALESCE(reason, '') ILIKE $${idx}
        OR COALESCE(assigned_to, '') ILIKE $${idx}
      )
    `);
  }

  const result = await runQuery(
    `
      SELECT *
      FROM atlas_cases
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE
          WHEN priority = 'critical' THEN 1
          WHEN priority = 'high' THEN 2
          WHEN priority = 'medium' THEN 3
          ELSE 4
        END,
        score DESC,
        revenue_estimate DESC,
        created_at DESC
    `,
    params
  );

  return result.rows.map(mapCase);
}

async function getAtlasDaily({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      SELECT *
      FROM atlas_cases
      WHERE tenant_id = $1
      ORDER BY
        CASE
          WHEN lane = 'today' THEN 1
          WHEN lane = 'next' THEN 2
          WHEN lane = 'done' THEN 3
          ELSE 4
        END,
        created_at DESC
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    patientName: normalizeText(row.patient_name, 'Unknown Patient'),
    patient_name: normalizeText(row.patient_name, 'Unknown Patient'),
    lane: normalizeText(row.lane, 'today').toLowerCase(),
    owner: normalizeText(row.assigned_to, 'Unassigned'),
    assigned_to: normalizeText(row.assigned_to, 'Unassigned'),
    reason: normalizeText(row.reason, '-'),
    priority: normalizeText(row.priority, 'medium').toLowerCase(),
    due: row.updated_at,
    due_at: row.updated_at,
    status: normalizeText(row.status, 'open').toLowerCase()
  }));
}

async function getAtlasTasks({ tenantId, search = '' }) {
  await seedAtlasIfEmpty(tenantId);

  const params = [tenantId];
  let searchSql = '';

  if (search) {
    params.push(`%${search}%`);
    searchSql = `
      AND (
        COALESCE(title, '') ILIKE $2
        OR COALESCE(patient_name, '') ILIKE $2
        OR COALESCE(owner, '') ILIKE $2
        OR COALESCE(action_group_name, '') ILIKE $2
      )
    `;
  }

  const result = await runQuery(
    `
      SELECT *
      FROM atlas_tasks
      WHERE tenant_id = $1
      ${searchSql}
      ORDER BY
        CASE
          WHEN priority = 'critical' THEN 1
          WHEN priority = 'high' THEN 2
          WHEN priority = 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
    `,
    params
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    title: normalizeText(row.title, 'ATLAS Task'),
    patientName: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    owner: normalizeText(row.owner, '-'),
    priority: normalizeText(row.priority, 'medium').toLowerCase(),
    status: normalizeText(row.status, 'open').toLowerCase(),
    due: row.due_at,
    due_at: row.due_at,
    actionGroupName: normalizeText(row.action_group_name, '-'),
    action_group_name: normalizeText(row.action_group_name, '-')
  }));
}

async function getAtlasAlerts({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      SELECT *
      FROM atlas_alerts
      WHERE tenant_id = $1
      ORDER BY
        CASE
          WHEN severity = 'critical' THEN 1
          WHEN severity = 'high' THEN 2
          ELSE 3
        END,
        created_at DESC
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    title: normalizeText(row.title, 'ATLAS Alert'),
    patientName: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    severity: normalizeText(row.severity, 'warning').toLowerCase(),
    message: normalizeText(row.message, '-'),
    createdAt: row.created_at,
    created_at: row.created_at,
    status: normalizeText(row.status, 'open').toLowerCase()
  }));
}

async function getAtlasAutoActions({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      SELECT *
      FROM atlas_auto_actions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    ruleName: normalizeText(row.rule_name, 'Auto Action Rule'),
    rule_name: normalizeText(row.rule_name, 'Auto Action Rule'),
    patientName: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    action: normalizeText(row.action, '-'),
    owner: normalizeText(row.owner, 'System'),
    status: normalizeText(row.status, 'queued').toLowerCase(),
    createdAt: row.created_at,
    created_at: row.created_at
  }));
}

async function recalculateAtlas({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      UPDATE atlas_cases
      SET updated_at = NOW()
      WHERE tenant_id = $1
    `,
    [tenantId]
  );

  return {
    ok: true,
    created: safe(result.rowCount),
    updated: safe(result.rowCount)
  };
}

async function runAiScoring({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const result = await runQuery(
    `
      UPDATE atlas_cases
      SET
        score = LEAST(100, score + 3),
        updated_at = NOW()
      WHERE tenant_id = $1
        AND status IN ('open', 'monitoring')
    `,
    [tenantId]
  );

  return {
    ok: true,
    updated: safe(result.rowCount)
  };
}

async function runAutoActions({ tenantId }) {
  await seedAtlasIfEmpty(tenantId);

  const openCases = await runQuery(
    `
      SELECT *
      FROM atlas_cases
      WHERE tenant_id = $1
        AND priority IN ('critical', 'high')
        AND status IN ('open', 'monitoring')
      ORDER BY score DESC, created_at DESC
      LIMIT 3
    `,
    [tenantId]
  );

  let created = 0;

  for (const row of openCases.rows) {
    const actionId = `AA-${Date.now()}-${created + 1}`;

    await runQuery(
      `
        INSERT INTO atlas_auto_actions (
          id, tenant_id, case_id, rule_name, patient_name, action, owner, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO NOTHING
      `,
      [
        actionId,
        tenantId,
        row.id,
        row.priority === 'critical'
          ? 'Critical compliance escalation'
          : 'Priority outreach automation',
        row.patient_name,
        row.priority === 'critical'
          ? 'Create urgent follow-up and notify doctor'
          : 'Create high-priority outreach task',
        'System',
        'queued'
      ]
    );

    created += 1;
  }

  return {
    ok: true,
    created
  };
}

module.exports = {
  getAtlasSummary,
  getAtlasQueue,
  getAtlasDaily,
  getAtlasTasks,
  getAtlasAlerts,
  getAtlasAutoActions,
  recalculateAtlas,
  runAiScoring,
  runAutoActions
};