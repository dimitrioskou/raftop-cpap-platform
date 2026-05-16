const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

function resolveDb() {
  const candidates = [
    '../db',
    '../config/db',
    '../config/database',
    '../database',
    '../lib/db',
    '../../db',
    '../../config/db'
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        return mod;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        return mod.pool;
      }

      if (typeof mod === 'function') {
        const maybeDb = mod();
        if (maybeDb && typeof maybeDb.query === 'function') {
          return maybeDb;
        }
      }
    } catch (_error) {
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client in patientIngestionService.');
}

const db = resolveDb();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildIdentityConditions(columns, refs) {
  const conditions = [];
  const params = [];

  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);

  if (patientIdCol && normalizeText(refs.patientId)) {
    params.push(String(refs.patientId));
    conditions.push(`${q(patientIdCol)}::text = $${params.length}`);
  }

  if (userIdCol && normalizeText(refs.userId)) {
    params.push(String(refs.userId));
    conditions.push(`${q(userIdCol)}::text = $${params.length}`);
  }

  if (emailCol && normalizeText(refs.email)) {
    params.push(String(refs.email));
    conditions.push(`LOWER(${q(emailCol)}) = LOWER($${params.length})`);
  }

  return { conditions, params };
}

async function resolvePatientContextFromUser(user) {
  const context = {
    patientId: null,
    userId: user?.userId || user?.id || null,
    email: normalizeText(user?.email) || 'patient@raftop.local',
    fullName: normalizeText(user?.name || user?.fullName) || 'Patient User'
  };

  if (!(await tableExists(db, 'patients'))) {
    return context;
  }

  const columns = await getColumns(db, 'patients');
  const idCol = firstExisting(columns, ['id', 'patient_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const nameCol = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  let row = null;

  if (userIdCol && normalizeText(context.userId)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE ${q(userIdCol)}::text = $1 LIMIT 1`,
      [String(context.userId)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row && emailCol && normalizeText(context.email)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE LOWER(${q(emailCol)}) = LOWER($1) LIMIT 1`,
      [String(context.email)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row) {
    return context;
  }

  return {
    patientId: idCol ? row[idCol] : null,
    userId: context.userId,
    email: context.email || (emailCol ? row[emailCol] : null),
    fullName: (nameCol ? row[nameCol] : null) || context.fullName
  };
}

async function resolvePatientContextFromRef(patientRef) {
  const rawRef = normalizeText(patientRef) || 'patient@raftop.local';

  const base = {
    patientId: /^\d+$/.test(rawRef) ? rawRef : null,
    userId: null,
    email: rawRef.includes('@') ? rawRef : 'patient@raftop.local',
    fullName: 'Patient User'
  };

  if (!(await tableExists(db, 'patients'))) {
    return base;
  }

  const columns = await getColumns(db, 'patients');
  const idCol = firstExisting(columns, ['id', 'patient_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const nameCol = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  let row = null;

  if (idCol && /^\d+$/.test(rawRef)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE ${q(idCol)}::text = $1 LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row && emailCol && rawRef.includes('@')) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE LOWER(${q(emailCol)}) = LOWER($1) LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row) {
    return base;
  }

  return {
    patientId: idCol ? row[idCol] : base.patientId,
    userId: userIdCol ? row[userIdCol] || null : null,
    email: emailCol ? row[emailCol] || base.email : base.email,
    fullName: (nameCol ? row[nameCol] : null) || base.fullName
  };
}

async function resolveImportJobsTable() {
  const candidates = ['patient_import_jobs', 'import_jobs'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

function buildSyntheticSyncStatus(context) {
  const now = new Date();
  const lastSyncAt = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const staleThresholdHours = 24;
  const missingThresholdHours = 72;

  return {
    patient: {
      fullName: context.fullName,
      email: context.email
    },
    source: {
      deviceType: 'CPAP',
      sourceName: 'Manual / Demo Sync',
      lastSyncAt
    },
    status: 'synced',
    syncHealth: {
      state: 'healthy',
      staleThresholdHours,
      missingThresholdHours,
      hoursSinceLastSync: 18
    },
    counters: {
      importedNights: 12,
      missingNights: 0,
      failedImports: 0
    },
    alerts: [],
    latestJob: {
      id: 'import_demo_1',
      status: 'completed',
      sourceType: 'manual_upload',
      createdAt: lastSyncAt,
      finishedAt: lastSyncAt,
      importedRows: 12,
      errorMessage: null
    }
  };
}

async function loadSyncStatusForRefs(context) {
  const tableName = await resolveImportJobsTable();

  if (!tableName) {
    return buildSyntheticSyncStatus(context);
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'job_id', 'import_job_id']);
  const statusCol = firstExisting(columns, ['status']);
  const sourceTypeCol = firstExisting(columns, ['source_type', 'import_type']);
  const createdAtCol = firstExisting(columns, ['created_at', 'started_at']);
  const finishedAtCol = firstExisting(columns, ['finished_at', 'completed_at', 'updated_at']);
  const importedRowsCol = firstExisting(columns, ['imported_rows', 'processed_rows', 'row_count']);
  const errorCol = firstExisting(columns, ['error_message', 'error']);
  const deviceTypeCol = firstExisting(columns, ['device_type']);
  const sourceNameCol = firstExisting(columns, ['source_name', 'integration_name']);

  const refs = {
    patientId: context.patientId,
    userId: context.userId,
    email: context.email
  };

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length) {
    return buildSyntheticSyncStatus(context);
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE ${conditions.join(' OR ')}
      ORDER BY ${q(createdAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT 50
    `,
    params
  );

  const rows = result.rows || [];

  if (!rows.length) {
    return {
      ...buildSyntheticSyncStatus(context),
      status: 'missing',
      syncHealth: {
        state: 'missing',
        staleThresholdHours: 24,
        missingThresholdHours: 72,
        hoursSinceLastSync: 999
      },
      counters: {
        importedNights: 0,
        missingNights: 7,
        failedImports: 0
      },
      alerts: [
        {
          level: 'danger',
          title: 'No recent sync data',
          description: 'Δεν βρέθηκαν recent import jobs για αυτόν τον patient.'
        }
      ],
      latestJob: null
    };
  }

  const latestRow = rows[0];
  const latestCreatedAt = createdAtCol ? latestRow[createdAtCol] || null : null;
  const hoursSinceLastSync = latestCreatedAt
    ? Math.max(0, Math.round((Date.now() - new Date(latestCreatedAt).getTime()) / (1000 * 60 * 60)))
    : 999;

  let state = 'healthy';
  if (hoursSinceLastSync >= 72) state = 'missing';
  else if (hoursSinceLastSync >= 24) state = 'stale';

  const failedImports = rows.filter((row) => safeLower(statusCol ? row[statusCol] : '') === 'failed').length;
  const importedNights = rows.reduce((sum, row) => sum + toNumber(importedRowsCol ? row[importedRowsCol] : 0, 0), 0);

  const alerts = [];

  if (state === 'stale') {
    alerts.push({
      level: 'warning',
      title: 'Sync is stale',
      description: 'Τα δεδομένα δεν έχουν ανανεωθεί μέσα στο επιθυμητό παράθυρο.'
    });
  }

  if (state === 'missing') {
    alerts.push({
      level: 'danger',
      title: 'Sync is missing',
      description: 'Δεν υπάρχει πρόσφατο import και απαιτείται recovery action.'
    });
  }

  if (failedImports > 0) {
    alerts.push({
      level: 'warning',
      title: 'Failed import jobs detected',
      description: `Υπάρχουν ${failedImports} failed import jobs.`
    });
  }

  return {
    patient: {
      fullName: context.fullName,
      email: context.email
    },
    source: {
      deviceType: deviceTypeCol ? latestRow[deviceTypeCol] || 'CPAP' : 'CPAP',
      sourceName: sourceNameCol ? latestRow[sourceNameCol] || 'Import Center' : 'Import Center',
      lastSyncAt: latestCreatedAt
    },
    status: state === 'healthy' ? 'synced' : state,
    syncHealth: {
      state,
      staleThresholdHours: 24,
      missingThresholdHours: 72,
      hoursSinceLastSync
    },
    counters: {
      importedNights,
      missingNights: state === 'missing' ? 7 : state === 'stale' ? 2 : 0,
      failedImports
    },
    alerts,
    latestJob: {
      id: idCol ? String(latestRow[idCol]) : `job_${Date.now()}`,
      status: safeLower(statusCol ? latestRow[statusCol] : 'completed') || 'completed',
      sourceType: sourceTypeCol ? latestRow[sourceTypeCol] || 'manual_upload' : 'manual_upload',
      createdAt: latestCreatedAt,
      finishedAt: finishedAtCol ? latestRow[finishedAtCol] || null : null,
      importedRows: toNumber(importedRowsCol ? latestRow[importedRowsCol] : 0, 0),
      errorMessage: errorCol ? latestRow[errorCol] || null : null
    }
  };
}

async function getPatientSyncStatus(user) {
  const context = await resolvePatientContextFromUser(user);
  return loadSyncStatusForRefs(context);
}

async function listImportHistoryForRefs(context, limit = 50) {
  const tableName = await resolveImportJobsTable();

  if (!tableName) {
    return [
      {
        id: 'import_demo_1',
        patientEmail: context.email,
        status: 'completed',
        sourceType: 'manual_upload',
        sourceName: 'Manual / Demo Sync',
        deviceType: 'CPAP',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        finishedAt: new Date(Date.now() - 17.8 * 60 * 60 * 1000).toISOString(),
        importedRows: 12,
        errorMessage: null
      }
    ];
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'job_id', 'import_job_id']);
  const statusCol = firstExisting(columns, ['status']);
  const sourceTypeCol = firstExisting(columns, ['source_type', 'import_type']);
  const sourceNameCol = firstExisting(columns, ['source_name', 'integration_name']);
  const deviceTypeCol = firstExisting(columns, ['device_type']);
  const createdAtCol = firstExisting(columns, ['created_at', 'started_at']);
  const finishedAtCol = firstExisting(columns, ['finished_at', 'completed_at', 'updated_at']);
  const importedRowsCol = firstExisting(columns, ['imported_rows', 'processed_rows', 'row_count']);
  const errorCol = firstExisting(columns, ['error_message', 'error']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);

  const refs = {
    patientId: context.patientId,
    userId: context.userId,
    email: context.email
  };

  const { conditions, params } = buildIdentityConditions(columns, refs);

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      ${conditions.length ? `WHERE ${conditions.join(' OR ')}` : ''}
      ORDER BY ${q(createdAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT ${Number(limit) || 50}
    `,
    params
  );

  return (result.rows || []).map((row, index) => ({
    id: idCol ? String(row[idCol]) : `job_${index + 1}`,
    patientEmail: emailCol ? row[emailCol] || context.email : context.email,
    status: safeLower(statusCol ? row[statusCol] : 'completed') || 'completed',
    sourceType: sourceTypeCol ? row[sourceTypeCol] || 'manual_upload' : 'manual_upload',
    sourceName: sourceNameCol ? row[sourceNameCol] || 'Import Center' : 'Import Center',
    deviceType: deviceTypeCol ? row[deviceTypeCol] || 'CPAP' : 'CPAP',
    createdAt: createdAtCol ? row[createdAtCol] || null : null,
    finishedAt: finishedAtCol ? row[finishedAtCol] || null : null,
    importedRows: toNumber(importedRowsCol ? row[importedRowsCol] : 0, 0),
    errorMessage: errorCol ? row[errorCol] || null : null
  }));
}

async function createImportJobForRefs(context, payload = {}) {
  const tableName = await resolveImportJobsTable();
  const now = new Date().toISOString();

  const syntheticJob = {
    id: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patientEmail: context.email,
    status: 'completed',
    sourceType: normalizeText(payload.sourceType) || 'manual_upload',
    sourceName: normalizeText(payload.sourceName) || 'Manual Upload Wizard',
    deviceType: normalizeText(payload.deviceType) || 'CPAP',
    createdAt: now,
    finishedAt: now,
    importedRows: Math.max(1, toNumber(payload.importedRows, 7)),
    errorMessage: null
  };

  if (!tableName) {
    return syntheticJob;
  }

  const columns = await getColumns(db, tableName);
  const insertPairs = [];

  const idCol = firstExisting(columns, ['job_id', 'import_job_id']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const statusCol = firstExisting(columns, ['status']);
  const sourceTypeCol = firstExisting(columns, ['source_type', 'import_type']);
  const sourceNameCol = firstExisting(columns, ['source_name', 'integration_name']);
  const deviceTypeCol = firstExisting(columns, ['device_type']);
  const createdAtCol = firstExisting(columns, ['created_at', 'started_at']);
  const finishedAtCol = firstExisting(columns, ['finished_at', 'completed_at', 'updated_at']);
  const importedRowsCol = firstExisting(columns, ['imported_rows', 'processed_rows', 'row_count']);
  const errorCol = firstExisting(columns, ['error_message', 'error']);

  if (idCol) insertPairs.push([idCol, syntheticJob.id]);
  if (patientIdCol && normalizeText(context.patientId)) insertPairs.push([patientIdCol, String(context.patientId)]);
  if (userIdCol && normalizeText(context.userId)) insertPairs.push([userIdCol, String(context.userId)]);
  if (emailCol && normalizeText(context.email)) insertPairs.push([emailCol, context.email]);
  if (statusCol) insertPairs.push([statusCol, syntheticJob.status]);
  if (sourceTypeCol) insertPairs.push([sourceTypeCol, syntheticJob.sourceType]);
  if (sourceNameCol) insertPairs.push([sourceNameCol, syntheticJob.sourceName]);
  if (deviceTypeCol) insertPairs.push([deviceTypeCol, syntheticJob.deviceType]);
  if (createdAtCol) insertPairs.push([createdAtCol, syntheticJob.createdAt]);
  if (finishedAtCol) insertPairs.push([finishedAtCol, syntheticJob.finishedAt]);
  if (importedRowsCol) insertPairs.push([importedRowsCol, syntheticJob.importedRows]);
  if (errorCol) insertPairs.push([errorCol, null]);

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);

  const result = await querySafe(
    db,
    `
      INSERT INTO ${tableName} (${insertColumns})
      VALUES (${placeholders})
      RETURNING *
    `,
    values
  );

  const row = result.rows?.[0];

  if (!row) {
    return syntheticJob;
  }

  return {
    id: row.job_id || row.import_job_id || row.id || syntheticJob.id,
    patientEmail: row.email || row.patient_email || row.user_email || syntheticJob.patientEmail,
    status: safeLower(row.status || syntheticJob.status),
    sourceType: row.source_type || row.import_type || syntheticJob.sourceType,
    sourceName: row.source_name || row.integration_name || syntheticJob.sourceName,
    deviceType: row.device_type || syntheticJob.deviceType,
    createdAt: row.created_at || row.started_at || syntheticJob.createdAt,
    finishedAt: row.finished_at || row.completed_at || row.updated_at || syntheticJob.finishedAt,
    importedRows: toNumber(row.imported_rows || row.processed_rows || row.row_count, syntheticJob.importedRows),
    errorMessage: row.error_message || row.error || null
  };
}

async function createPatientImportJob(user, payload = {}) {
  const context = await resolvePatientContextFromUser(user);
  return createImportJobForRefs(context, payload);
}

async function listTenantImportHistory(limit = 100) {
  const tableName = await resolveImportJobsTable();

  if (!tableName) {
    return [
      {
        id: 'import_demo_1',
        patientEmail: 'patient@raftop.local',
        status: 'completed',
        sourceType: 'manual_upload',
        sourceName: 'Manual / Demo Sync',
        deviceType: 'CPAP',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        finishedAt: new Date(Date.now() - 17.8 * 60 * 60 * 1000).toISOString(),
        importedRows: 12,
        errorMessage: null
      },
      {
        id: 'import_demo_2',
        patientEmail: 'patient2@raftop.local',
        status: 'failed',
        sourceType: 'csv_import',
        sourceName: 'AirView CSV',
        deviceType: 'CPAP',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        finishedAt: new Date(Date.now() - 47.5 * 60 * 60 * 1000).toISOString(),
        importedRows: 0,
        errorMessage: 'Malformed CSV header'
      }
    ];
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'job_id', 'import_job_id']);
  const statusCol = firstExisting(columns, ['status']);
  const sourceTypeCol = firstExisting(columns, ['source_type', 'import_type']);
  const sourceNameCol = firstExisting(columns, ['source_name', 'integration_name']);
  const deviceTypeCol = firstExisting(columns, ['device_type']);
  const createdAtCol = firstExisting(columns, ['created_at', 'started_at']);
  const finishedAtCol = firstExisting(columns, ['finished_at', 'completed_at', 'updated_at']);
  const importedRowsCol = firstExisting(columns, ['imported_rows', 'processed_rows', 'row_count']);
  const errorCol = firstExisting(columns, ['error_message', 'error']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      ORDER BY ${q(createdAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT ${Number(limit) || 100}
    `
  );

  return (result.rows || []).map((row, index) => ({
    id: idCol ? String(row[idCol]) : `job_${index + 1}`,
    patientEmail: emailCol ? row[emailCol] || 'unknown@patient.local' : 'unknown@patient.local',
    status: safeLower(statusCol ? row[statusCol] : 'completed') || 'completed',
    sourceType: sourceTypeCol ? row[sourceTypeCol] || 'manual_upload' : 'manual_upload',
    sourceName: sourceNameCol ? row[sourceNameCol] || 'Import Center' : 'Import Center',
    deviceType: deviceTypeCol ? row[deviceTypeCol] || 'CPAP' : 'CPAP',
    createdAt: createdAtCol ? row[createdAtCol] || null : null,
    finishedAt: finishedAtCol ? row[finishedAtCol] || null : null,
    importedRows: toNumber(importedRowsCol ? row[importedRowsCol] : 0, 0),
    errorMessage: errorCol ? row[errorCol] || null : null
  }));
}

async function createTenantImportJob(patientRef, payload = {}) {
  const context = await resolvePatientContextFromRef(patientRef);
  return createImportJobForRefs(context, payload);
}

module.exports = {
  getPatientSyncStatus,
  createPatientImportJob,
  listTenantImportHistory,
  createTenantImportJob,
  listImportHistoryForRefs,
  resolvePatientContextFromUser,
  resolvePatientContextFromRef
};