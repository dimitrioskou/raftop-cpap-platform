'use strict';

const express = require('express');

const router = express.Router();

let cachedDb = null;

function loadDb() {
  if (cachedDb) return cachedDb;

  const candidates = [
    '../../db',
    '../../config/db',
    '../../database',
    '../../database/db',
    '../../lib/db'
  ];

  let lastError = null;

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(candidate);

      if (mod && (typeof mod.query === 'function' || mod.pool || mod.default)) {
        cachedDb = mod;
        return cachedDb;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to load DB in closedLoopControl route. Last error: ${
      lastError ? lastError.message : 'unknown'
    }`
  );
}

function getQueryExecutor() {
  const db = loadDb();

  if (db && typeof db.query === 'function') return db;
  if (db && db.pool && typeof db.pool.query === 'function') return db.pool;
  if (db && db.default && typeof db.default.query === 'function') return db.default;
  if (db && db.default && db.default.pool && typeof db.default.pool.query === 'function') {
    return db.default.pool;
  }

  throw new Error('DB module loaded, but no query executor was found.');
}

async function query(text, params = []) {
  const executor = getQueryExecutor();
  return executor.query(text, params);
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
}

function safeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function parseJsonObject(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  return {};
}

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS closed_loop_verifications (
      id text PRIMARY KEY,
      tenant_id text DEFAULT '1',
      task_id text,
      signal_id text,
      source_action_id text,
      verdict text NOT NULL DEFAULT 'unknown',
      passed_count integer DEFAULT 0,
      warning_count integer DEFAULT 0,
      failed_count integer DEFAULT 0,
      checks jsonb DEFAULT '[]'::jsonb,
      evidence jsonb DEFAULT '{}'::jsonb,
      query_params jsonb DEFAULT '{}'::jsonb,
      task_snapshot jsonb DEFAULT '{}'::jsonb,
      signal_snapshot jsonb DEFAULT '{}'::jsonb,
      phase text DEFAULT '19.43-control-summary',
      created_at timestamp with time zone DEFAULT now()
    )
  `);

  await query(`
    ALTER TABLE closed_loop_verifications
      ADD COLUMN IF NOT EXISTS remediation_status text DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS remediation_task_id text,
      ADD COLUMN IF NOT EXISTS remediation_created_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS remediation_last_run_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS remediation_note text,
      ADD COLUMN IF NOT EXISTS remediation_payload jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS remediation_resolution_status text DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS remediation_resolved_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS remediation_resolution_last_sync_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS remediation_resolution_note text,
      ADD COLUMN IF NOT EXISTS remediation_resolution_payload jsonb DEFAULT '{}'::jsonb
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS atlas_tasks (
      id text PRIMARY KEY,
      tenant_id text NOT NULL DEFAULT '1',
      case_id text,
      patient_name text,
      title text,
      owner text,
      priority text DEFAULT 'medium',
      status text DEFAULT 'open',
      due_at timestamp with time zone,
      action_group_name text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  await query(`
    ALTER TABLE atlas_tasks
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS patient_email text,
      ADD COLUMN IF NOT EXISTS linked_signal_id text,
      ADD COLUMN IF NOT EXISTS signal_id text,
      ADD COLUMN IF NOT EXISTS atlas_signal_id text,
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS source text,
      ADD COLUMN IF NOT EXISTS module text,
      ADD COLUMN IF NOT EXISTS action_type text,
      ADD COLUMN IF NOT EXISTS task_type text,
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS source_ref text,
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now()
  `);
}

async function countOne(sql, params = []) {
  const result = await query(sql, params);
  const row = result.rows && result.rows[0] ? result.rows[0] : {};
  return safeNumber(firstValue(row.total, row.count, 0));
}

async function getGroupedRows(sql, params = []) {
  const result = await query(sql, params);
  return result.rows || [];
}

async function buildControlSummary() {
  await ensureTables();

  const totalVerifications = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
  `);

  const problemVerifications = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
  `);

  const failedVerifications = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) = 'failed'
  `);

  const warningVerifications = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) = 'warning'
  `);

  const passedVerifications = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) = 'passed'
  `);

  const remediationTasks = await countOne(`
    SELECT COUNT(*) AS total
    FROM atlas_tasks
    WHERE source_type = 'closed_loop_verification_remediation'
  `);

  const remediationOpenTasks = await countOne(`
    SELECT COUNT(*) AS total
    FROM atlas_tasks
    WHERE source_type = 'closed_loop_verification_remediation'
      AND LOWER(COALESCE(status::text, 'open')) NOT IN (
        'done',
        'resolved',
        'completed',
        'complete',
        'closed',
        'fixed'
      )
  `);

  const remediationTerminalTasks = await countOne(`
    SELECT COUNT(*) AS total
    FROM atlas_tasks
    WHERE source_type = 'closed_loop_verification_remediation'
      AND LOWER(COALESCE(status::text, 'open')) IN (
        'done',
        'resolved',
        'completed',
        'complete',
        'closed',
        'fixed'
      )
  `);

  const resolvedRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(remediation_resolution_status::text, 'open')) = 'resolved'
  `);

  const openResolutionRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
      AND LOWER(COALESCE(remediation_resolution_status::text, 'open')) = 'open'
  `);

  const missingTaskResolutionRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
      AND LOWER(COALESCE(remediation_resolution_status::text, 'open')) = 'missing_task'
  `);

  const notStartedRemediationRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
      AND LOWER(COALESCE(remediation_status::text, 'not_started')) = 'not_started'
  `);

  const taskCreatedRemediationRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
      AND LOWER(COALESCE(remediation_status::text, 'not_started')) = 'task_created'
  `);

  const taskExistsRemediationRecords = await countOne(`
    SELECT COUNT(*) AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
      AND LOWER(COALESCE(remediation_status::text, 'not_started')) = 'task_exists'
  `);

  const verificationByVerdict = await getGroupedRows(`
    SELECT
      LOWER(COALESCE(verdict::text, 'unknown')) AS verdict,
      COUNT(*)::integer AS total
    FROM closed_loop_verifications
    GROUP BY LOWER(COALESCE(verdict::text, 'unknown'))
    ORDER BY total DESC
  `);

  const remediationByStatus = await getGroupedRows(`
    SELECT
      LOWER(COALESCE(remediation_status::text, 'not_started')) AS status,
      COUNT(*)::integer AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
    GROUP BY LOWER(COALESCE(remediation_status::text, 'not_started'))
    ORDER BY total DESC
  `);

  const resolutionByStatus = await getGroupedRows(`
    SELECT
      LOWER(COALESCE(remediation_resolution_status::text, 'open')) AS status,
      COUNT(*)::integer AS total
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
    GROUP BY LOWER(COALESCE(remediation_resolution_status::text, 'open'))
    ORDER BY total DESC
  `);

  const latestProblemsResult = await query(`
    SELECT
      id,
      verdict,
      signal_id,
      task_id,
      remediation_status,
      remediation_task_id,
      remediation_resolution_status,
      remediation_last_run_at,
      remediation_resolution_last_sync_at,
      created_at
    FROM closed_loop_verifications
    WHERE LOWER(COALESCE(verdict::text, '')) IN ('failed', 'warning')
    ORDER BY created_at DESC NULLS LAST
    LIMIT 10
  `);

  const latestTasksResult = await query(`
    SELECT
      id,
      title,
      priority,
      status,
      source_ref,
      source_action_id,
      linked_signal_id,
      created_at,
      updated_at,
      metadata
    FROM atlas_tasks
    WHERE source_type = 'closed_loop_verification_remediation'
    ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 10
  `);

  const completionRate =
    problemVerifications > 0
      ? Math.round((resolvedRecords / problemVerifications) * 100)
      : 0;

  const remediationCoverageRate =
    problemVerifications > 0
      ? Math.round(((taskCreatedRemediationRecords + taskExistsRemediationRecords) / problemVerifications) * 100)
      : 0;

  let systemStatus = 'healthy';

  if (failedVerifications > 0 && notStartedRemediationRecords > 0) {
    systemStatus = 'critical';
  } else if (openResolutionRecords > 0 || missingTaskResolutionRecords > 0) {
    systemStatus = 'warning';
  } else if (problemVerifications === 0) {
    systemStatus = 'no_problems';
  }

  return {
    ok: true,
    phase: '19.43-control-summary',
    generatedAt: new Date().toISOString(),
    systemStatus,
    metrics: {
      totalVerifications,
      passedVerifications,
      problemVerifications,
      failedVerifications,
      warningVerifications,

      remediationTasks,
      remediationOpenTasks,
      remediationTerminalTasks,

      notStartedRemediationRecords,
      taskCreatedRemediationRecords,
      taskExistsRemediationRecords,

      resolvedRecords,
      openResolutionRecords,
      missingTaskResolutionRecords,

      completionRate,
      remediationCoverageRate
    },
    grouped: {
      verificationByVerdict,
      remediationByStatus,
      resolutionByStatus
    },
    latest: {
      problems: (latestProblemsResult.rows || []).map((row) => ({
        ...row,
        remediationPayload: parseJsonObject(row.remediation_payload),
        remediationResolutionPayload: parseJsonObject(row.remediation_resolution_payload)
      })),
      remediationTasks: (latestTasksResult.rows || []).map((row) => ({
        ...row,
        metadata: parseJsonObject(row.metadata)
      }))
    }
  };
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    route: 'tenant/closedLoopControl',
    phase: '19.43-control-summary',
    endpoints: [
      'GET /api/tenant/closed-loop-control/health',
      'GET /api/tenant/closed-loop-control/summary'
    ],
    timestamp: new Date().toISOString()
  });
});

router.get('/summary', async (_req, res) => {
  try {
    const summary = await buildControlSummary();

    return res.json({
      ok: true,
      data: summary
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Closed loop control summary failed.',
      phase: '19.43-control-summary'
    });
  }
});

module.exports = router;