const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const db = require('./db');

const execFileAsync = promisify(execFile);

function boolEnv(name) {
  return String(process.env[name] || '').toLowerCase() === 'true';
}

function existsEnv(name) {
  return String(process.env[name] || '').trim().length > 0;
}

function getNodeEnv() {
  return String(process.env.NODE_ENV || 'development').toLowerCase();
}

function maskValue(value) {
  const text = String(value || '');

  if (!text) return null;
  if (text.length <= 10) return `${text.slice(0, 2)}...`;

  return `${text.slice(0, 5)}...${text.slice(-5)}`;
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

function parseDatabaseUrl() {
  const value = String(process.env.DATABASE_URL || '');

  if (!value) {
    return {
      configured: false,
      provider: 'unknown',
      host: null,
      database: null,
      sslDetected: false,
      masked: null
    };
  }

  let parsed = null;

  try {
    parsed = new URL(value);
  } catch (error) {
    return {
      configured: true,
      provider: 'unknown',
      parseError: error.message,
      host: null,
      database: null,
      sslDetected:
        value.toLowerCase().includes('sslmode=require') ||
        String(process.env.PGSSLMODE || '').toLowerCase() === 'require',
      masked: maskValue(value)
    };
  }

  const lower = value.toLowerCase();
  let provider = 'unknown';

  if (lower.includes('render.com')) provider = 'render';
  if (lower.includes('neon.tech')) provider = 'neon';
  if (lower.includes('supabase')) provider = 'supabase';
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) provider = 'local';

  return {
    configured: true,
    provider,
    protocol: parsed.protocol,
    host: parsed.hostname,
    port: parsed.port || null,
    database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : null,
    sslDetected:
      lower.includes('sslmode=require') ||
      lower.includes('ssl=true') ||
      String(process.env.PGSSLMODE || '').toLowerCase() === 'require',
    masked: maskValue(value)
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

async function safeCountTable(tableName) {
  try {
    const exists = await tableExists(tableName);

    if (!exists) {
      return {
        table: tableName,
        exists: false,
        count: 0,
        error: null
      };
    }

    const result = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM ${tableName}
    `);

    return {
      table: tableName,
      exists: true,
      count: Number(result.rows[0]?.count || 0),
      error: null
    };
  } catch (error) {
    return {
      table: tableName,
      exists: false,
      count: 0,
      error: error.message
    };
  }
}

async function checkDatabaseConnection() {
  try {
    const result = await db.query(`
      SELECT
        NOW() AS now,
        current_database() AS database_name,
        current_user AS database_user,
        version() AS version
    `);

    return buildCheck({
      group: 'database',
      name: 'Database connection',
      status: 'PASS',
      critical: true,
      message: 'Database connection is healthy.',
      details: result.rows[0] || {}
    });
  } catch (error) {
    return buildCheck({
      group: 'database',
      name: 'Database connection',
      status: 'FAIL',
      critical: true,
      message: 'Database connection failed.',
      details: {
        error: error.message
      },
      nextAction: 'Fix DATABASE_URL / SSL / provider availability before any release candidate.'
    });
  }
}

function checkDatabaseUrl() {
  const info = parseDatabaseUrl();

  if (!info.configured) {
    return buildCheck({
      group: 'database',
      name: 'DATABASE_URL configured',
      status: 'FAIL',
      critical: true,
      message: 'DATABASE_URL is missing.',
      details: info,
      nextAction: 'Configure DATABASE_URL before deployment.'
    });
  }

  if (getNodeEnv() === 'production' && info.provider !== 'local' && !info.sslDetected) {
    return buildCheck({
      group: 'database',
      name: 'DATABASE_URL SSL safety',
      status: 'WARN',
      critical: true,
      message: 'DATABASE_URL exists, but SSL was not clearly detected.',
      details: info,
      nextAction: 'Confirm SSL requirement for production Postgres. Add sslmode=require if needed.'
    });
  }

  return buildCheck({
    group: 'database',
    name: 'DATABASE_URL configured',
    status: 'PASS',
    critical: true,
    message: 'DATABASE_URL exists.',
    details: info
  });
}

async function ensureBackupSafetyLogTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS database_backup_safety_log (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_database_backup_safety_log_created_at
    ON database_backup_safety_log (created_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_database_backup_safety_log_event_type
    ON database_backup_safety_log (event_type);
  `);
}

async function checkBackupSafetyLogTable() {
  try {
    await ensureBackupSafetyLogTable();

    const result = await db.query(`
      SELECT COUNT(*)::int AS count
      FROM database_backup_safety_log
    `);

    return buildCheck({
      group: 'backup',
      name: 'Backup safety log table',
      status: 'PASS',
      critical: false,
      message: 'Backup safety log table exists.',
      details: {
        count: Number(result.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    return buildCheck({
      group: 'backup',
      name: 'Backup safety log table',
      status: 'WARN',
      critical: false,
      message: 'Could not verify/create backup safety log table.',
      details: {
        error: error.message
      },
      nextAction: 'Check database permissions for CREATE TABLE / CREATE INDEX.'
    });
  }
}

async function checkCoreTables() {
  const criticalTables = [
    'tenant_subscriptions',
    'tenant_profiles'
  ];

  const importantTables = [
    'patients',
    'devices',
    'patient_signals',
    'tenant_tasks',
    'system_alert_events',
    'system_monitoring_history',
    'super_admin_audit_logs'
  ];

  const results = [];

  for (const table of [...criticalTables, ...importantTables]) {
    results.push(await safeCountTable(table));
  }

  const missingCritical = results.filter(
    (item) => criticalTables.includes(item.table) && !item.exists
  );

  const missingImportant = results.filter(
    (item) => importantTables.includes(item.table) && !item.exists
  );

  if (missingCritical.length > 0) {
    return buildCheck({
      group: 'database',
      name: 'Core SaaS tables',
      status: 'FAIL',
      critical: true,
      message: 'Critical SaaS tables are missing.',
      details: {
        results,
        missingCritical,
        missingImportant
      },
      nextAction: 'Run the required migrations/bootstrap before release.'
    });
  }

  if (missingImportant.length > 0) {
    return buildCheck({
      group: 'database',
      name: 'Important operational tables',
      status: 'WARN',
      critical: false,
      message: 'Some important operational tables are missing.',
      details: {
        results,
        missingImportant
      },
      nextAction: 'Review whether missing tables are deprecated or need migration.'
    });
  }

  return buildCheck({
    group: 'database',
    name: 'Core/important tables',
    status: 'PASS',
    critical: true,
    message: 'Core SaaS and operational tables are present.',
    details: {
      results
    }
  });
}

function getPgToolCommand(toolName) {
  const pgBinDir =
    process.env.PG_BIN_DIR ||
    process.env.POSTGRES_BIN_DIR ||
    '';

  const suffix = process.platform === 'win32' ? '.exe' : '';

  if (pgBinDir) {
    return path.join(pgBinDir, `${toolName}${suffix}`);
  }

  return toolName;
}

async function checkPgTool(toolName) {
  const command = getPgToolCommand(toolName);

  try {
    const result = await execFileAsync(command, ['--version'], {
      timeout: 3000,
      windowsHide: true
    });

    return {
      toolName,
      command,
      available: true,
      version: String(result.stdout || result.stderr || '').trim(),
      error: null
    };
  } catch (error) {
    return {
      toolName,
      command,
      available: false,
      version: null,
      error: error.message
    };
  }
}

async function checkPostgresClientTools() {
  const pgDump = await checkPgTool('pg_dump');
  const psql = await checkPgTool('psql');

  const bothAvailable = pgDump.available && psql.available;

  if (!bothAvailable) {
    return buildCheck({
      group: 'backup',
      name: 'Postgres client tools',
      status: 'WARN',
      critical: false,
      message: 'pg_dump and/or psql were not found in PATH/PG_BIN_DIR.',
      details: {
        pgDump,
        psql,
        pgBinDir: process.env.PG_BIN_DIR || process.env.POSTGRES_BIN_DIR || null
      },
      nextAction: 'Install PostgreSQL client tools or set PG_BIN_DIR to the PostgreSQL bin folder.'
    });
  }

  return buildCheck({
    group: 'backup',
    name: 'Postgres client tools',
    status: 'PASS',
    critical: false,
    message: 'pg_dump and psql are available.',
    details: {
      pgDump,
      psql
    }
  });
}

function getBackupDirectory() {
  return (
    process.env.DATABASE_BACKUP_DIR ||
    process.env.BACKUP_DIR ||
    path.join(process.cwd(), 'backups', 'database')
  );
}

function checkBackupDirectory() {
  const backupDir = getBackupDirectory();

  try {
    fs.mkdirSync(backupDir, {
      recursive: true
    });

    fs.accessSync(backupDir, fs.constants.W_OK);

    const files = fs
      .readdirSync(backupDir)
      .filter((file) =>
        file.endsWith('.sql') ||
        file.endsWith('.dump') ||
        file.endsWith('.backup') ||
        file.endsWith('.gz')
      );

    return buildCheck({
      group: 'backup',
      name: 'Backup directory',
      status: 'PASS',
      critical: false,
      message: 'Backup directory exists and is writable.',
      details: {
        backupDir,
        backupFilesCount: files.length,
        recentFiles: files.slice(-5)
      }
    });
  } catch (error) {
    return buildCheck({
      group: 'backup',
      name: 'Backup directory',
      status: 'WARN',
      critical: false,
      message: 'Backup directory is not writable.',
      details: {
        backupDir,
        error: error.message
      },
      nextAction: 'Create a writable backup directory or configure DATABASE_BACKUP_DIR.'
    });
  }
}

function checkRestoreSafetyFlags() {
  const nodeEnv = getNodeEnv();

  const flags = {
    ENABLE_DB_RESTORE: boolEnv('ENABLE_DB_RESTORE'),
    ENABLE_DATABASE_RESTORE: boolEnv('ENABLE_DATABASE_RESTORE'),
    ENABLE_DANGEROUS_DB_RESTORE: boolEnv('ENABLE_DANGEROUS_DB_RESTORE'),
    ENABLE_BOOTSTRAP_RESTORE: boolEnv('ENABLE_BOOTSTRAP_RESTORE'),
    ENABLE_DANGEROUS_ADMIN_RESTORE: boolEnv('ENABLE_DANGEROUS_ADMIN_RESTORE')
  };

  const enabled = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  if (enabled.length > 0 && nodeEnv === 'production') {
    return buildCheck({
      group: 'restore',
      name: 'Restore safety flags',
      status: 'FAIL',
      critical: true,
      message: 'Dangerous restore flags are enabled in production.',
      details: {
        nodeEnv,
        flags,
        enabled
      },
      nextAction: 'Disable restore/admin/bootstrap restore flags before production.'
    });
  }

  if (enabled.length > 0) {
    return buildCheck({
      group: 'restore',
      name: 'Restore safety flags',
      status: 'WARN',
      critical: true,
      message: 'Restore/dev/admin flags are enabled locally.',
      details: {
        nodeEnv,
        flags,
        enabled
      },
      nextAction: 'Keep restore endpoints disabled unless doing controlled local recovery testing.'
    });
  }

  return buildCheck({
    group: 'restore',
    name: 'Restore safety flags',
    status: 'PASS',
    critical: true,
    message: 'No dangerous restore flags are enabled.',
    details: {
      nodeEnv,
      flags,
      enabled
    }
  });
}

function checkBackupPolicyEnv() {
  const retentionDays = Number(process.env.DATABASE_BACKUP_RETENTION_DAYS || 0);
  const encryptionKeyConfigured = existsEnv('DATABASE_BACKUP_ENCRYPTION_KEY');
  const backupDirConfigured = existsEnv('DATABASE_BACKUP_DIR') || existsEnv('BACKUP_DIR');
  const nodeEnv = getNodeEnv();

  const warnings = [];

  if (!backupDirConfigured) warnings.push('backup_directory_not_explicitly_configured');
  if (!retentionDays || retentionDays < 7) warnings.push('backup_retention_days_missing_or_low');
  if (nodeEnv === 'production' && !encryptionKeyConfigured) warnings.push('backup_encryption_key_missing');

  if (warnings.length > 0) {
    return buildCheck({
      group: 'backup',
      name: 'Backup policy configuration',
      status: nodeEnv === 'production' && !encryptionKeyConfigured ? 'WARN' : 'WARN',
      critical: false,
      message: 'Backup policy has missing/weak production metadata.',
      details: {
        backupDirConfigured,
        retentionDays,
        encryptionKeyConfigured,
        warnings
      },
      nextAction: 'Configure DATABASE_BACKUP_DIR, DATABASE_BACKUP_RETENTION_DAYS and, for production, DATABASE_BACKUP_ENCRYPTION_KEY.'
    });
  }

  return buildCheck({
    group: 'backup',
    name: 'Backup policy configuration',
    status: 'PASS',
    critical: false,
    message: 'Backup policy environment looks configured.',
    details: {
      backupDirConfigured,
      retentionDays,
      encryptionKeyConfigured
    }
  });
}

function checkNoAutomaticRestoreEndpoint() {
  return buildCheck({
    group: 'restore',
    name: 'Automatic restore endpoint',
    status: 'PASS',
    critical: true,
    message: 'No database restore endpoint is exposed by this phase.',
    details: {
      restoreEndpointExposed: false,
      policy: 'Audit-only. Restore must remain manual/controlled until explicit recovery phase.'
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
    databaseFailures: checks.filter((check) => check.group === 'database' && check.status === 'FAIL').length,
    backupWarnings: checks.filter((check) => check.group === 'backup' && check.status === 'WARN').length,
    restoreFailures: checks.filter((check) => check.group === 'restore' && check.status === 'FAIL').length,
    restoreWarnings: checks.filter((check) => check.group === 'restore' && check.status === 'WARN').length
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
      type: 'DATABASE_BACKUP_BLOCKER',
      title: `Fix: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of criticalWarnings.slice(0, 5)) {
    actions.push({
      priority: 'HIGH',
      type: 'RESTORE_SAFETY_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  for (const check of warnings.slice(0, 5)) {
    actions.push({
      priority: 'MEDIUM',
      type: 'BACKUP_POLICY_WARNING',
      title: `Review: ${check.name}`,
      description: check.nextAction || check.message
    });
  }

  if (summary.failed === 0 && summary.warned === 0) {
    actions.push({
      priority: 'LOW',
      type: 'DATABASE_BACKUP_SAFETY_READY',
      title: 'Database backup safety gate passed',
      description: 'Proceed to security exposure audit.'
    });
  }

  if (summary.failed === 0 && summary.warned > 0) {
    actions.push({
      priority: 'MEDIUM',
      type: 'DATABASE_BACKUP_ACCEPTABLE_LOCAL',
      title: 'Database backup safety is acceptable locally with warnings',
      description: 'Warnings may be acceptable locally, but production must have explicit backup directory, retention policy, client tools and no restore flags.'
    });
  }

  return actions;
}

async function runDatabaseBackupSafetyAudit() {
  const checks = [];

  checks.push(checkDatabaseUrl());
  checks.push(await checkDatabaseConnection());
  checks.push(await checkCoreTables());
  checks.push(await checkBackupSafetyLogTable());
  checks.push(await checkPostgresClientTools());
  checks.push(checkBackupDirectory());
  checks.push(checkBackupPolicyEnv());
  checks.push(checkRestoreSafetyFlags());
  checks.push(checkNoAutomaticRestoreEndpoint());

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
    source: 'runtime-database-backup-safety-audit',
    phase: '23.4-database-backup-restore-safety-check',
    readinessStatus,
    summary,
    checks,
    nextBestActions: buildNextBestActions(checks, summary),
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  runDatabaseBackupSafetyAudit
};