const { v4: uuidv4 } = require('uuid');
const nativeTaskBridgeService = require('./nativeTaskBridgeService');

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

  throw new Error('Could not resolve database client in patientSignalService.');
}

const db = resolveDb();

let tablesEnsured = false;

function getMemorySignalStore() {
  if (!global.__raftopPatientActionMemoryStore) {
    global.__raftopPatientActionMemoryStore = [];
  }

  return global.__raftopPatientActionMemoryStore;
}

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  const text = String(value).trim();
  return text ? text : null;
}

function buildSignalId() {
  return `psig-${uuidv4()}`;
}

function getTenantIdFromUser(user) {
  return normalizeText(
    user?.tenantId ||
      user?.organizationId ||
      user?.raw?.tenant_id ||
      user?.raw?.organization_id
  );
}

function formatKindLabel(kind) {
  const normalized = String(kind || '').toLowerCase();

  if (normalized === 'acknowledge') return 'Acknowledgement';
  if (normalized === 'issue') return 'Reported issue';
  if (normalized === 'callback') return 'Callback request';

  return 'Patient action';
}

function mapSignalRow(row) {
  return {
    id: row.id,
    kind: row.kind || 'action',
    kindLabel: formatKindLabel(row.kind),
    title: row.title || 'Patient action',
    description: row.description || '',
    status: row.status || 'logged',
    source: row.source || 'db',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    email: row.patient_email || row.email || null,
    userId: row.patient_user_id || row.userId || null,
    tenantId: row.tenant_id || row.tenantId || null,
    taskCreated: Boolean(row.task_created),
    linkedTaskId: row.linked_task_id || null,
    resolvedAt: row.resolved_at || null,
    resolvedBy: row.resolved_by || null,
    metadata: row.metadata || {}
  };
}

function sortSignalsDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

async function ensureTables() {
  if (tablesEnsured) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS patient_signals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NULL,
      patient_user_id TEXT NULL,
      patient_email TEXT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NULL,
      status TEXT NOT NULL DEFAULT 'logged',
      source TEXT NOT NULL DEFAULT 'db',
      task_created BOOLEAN NOT NULL DEFAULT FALSE,
      linked_task_id TEXT NULL,
      resolved_at TIMESTAMPTZ NULL,
      resolved_by TEXT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_patient_signals_tenant_created
    ON patient_signals (tenant_id, created_at DESC)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_patient_signals_user_created
    ON patient_signals (patient_user_id, created_at DESC)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_patient_signals_email_created
    ON patient_signals (patient_email, created_at DESC)
  `);

  tablesEnsured = true;
}

function buildSummary(items) {
  const openCount = items.filter((item) =>
    ['open', 'priority', 'logged', 'task_created'].includes(
      String(item.status || '').toLowerCase()
    )
  ).length;

  const callbackCount = items.filter(
    (item) => String(item.kind || '').toLowerCase() === 'callback'
  ).length;

  const issueCount = items.filter(
    (item) => String(item.kind || '').toLowerCase() === 'issue'
  ).length;

  const unresolvedHighPriorityCount = items.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    const description = String(item.description || '').toLowerCase();

    return (
      ['priority', 'open'].includes(status) &&
      (description.includes('severity: high') || description.includes('high'))
    );
  }).length;

  return {
    total: items.length,
    openCount,
    callbackCount,
    issueCount,
    unresolvedHighPriorityCount
  };
}

function filterMemorySignalsForPatient(user, limit = 12) {
  const store = getMemorySignalStore();

  const items = store.filter((item) => {
    if (user?.userId && item.userId) {
      return String(item.userId) === String(user.userId);
    }

    if (user?.email && item.email) {
      return String(item.email).toLowerCase() === String(user.email).toLowerCase();
    }

    return false;
  });

  return sortSignalsDesc(items).slice(0, limit);
}

function filterMemorySignalsForTenant(user, limit = 100) {
  const store = getMemorySignalStore();
  const tenantId = getTenantIdFromUser(user);

  let items = store;

  if (tenantId) {
    items = items.filter((item) => {
      if (!item.tenantId) return true;
      return String(item.tenantId) === String(tenantId);
    });
  }

  return sortSignalsDesc(items).slice(0, limit);
}

async function listSignalsForPatient(user, options = {}) {
  const limit = Number(options.limit || 12);

  try {
    await ensureTables();

    const patientUserId = normalizeText(user?.userId || user?.id);
    const patientEmail = normalizeText(user?.email);

    if (!patientUserId && !patientEmail) {
      return filterMemorySignalsForPatient(user, limit);
    }

    const conditions = [];
    const params = [];

    if (patientUserId) {
      params.push(patientUserId);
      conditions.push(`patient_user_id = $${params.length}`);
    }

    if (patientEmail) {
      params.push(patientEmail.toLowerCase());
      conditions.push(`LOWER(patient_email) = $${params.length}`);
    }

    params.push(limit);

    const result = await db.query(
      `
        SELECT *
        FROM patient_signals
        WHERE ${conditions.join(' OR ')}
        ORDER BY created_at DESC
        LIMIT $${params.length}
      `,
      params
    );

    return result.rows.map(mapSignalRow);
  } catch (_error) {
    return filterMemorySignalsForPatient(user, limit);
  }
}

async function listSignalsForTenant(user, options = {}) {
  const limit = Number(options.limit || 100);
  const tenantId = getTenantIdFromUser(user);

  try {
    await ensureTables();

    if (tenantId) {
      const result = await db.query(
        `
          SELECT *
          FROM patient_signals
          WHERE tenant_id = $1 OR tenant_id IS NULL
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [tenantId, limit]
      );

      return result.rows.map(mapSignalRow);
    }

    const result = await db.query(
      `
        SELECT *
        FROM patient_signals
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(mapSignalRow);
  } catch (_error) {
    return filterMemorySignalsForTenant(user, limit);
  }
}

async function createSignal(user, input = {}) {
  const record = {
    id: buildSignalId(),
    tenantId: getTenantIdFromUser(user),
    userId: normalizeText(user?.userId || user?.id),
    email: normalizeText(user?.email),
    kind: normalizeText(input.kind) || 'action',
    title: normalizeText(input.title) || 'Patient action',
    description: normalizeText(input.description) || '',
    status: normalizeText(input.status) || 'logged',
    source: normalizeText(input.source) || 'db',
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: new Date().toISOString()
  };

  try {
    await ensureTables();

    const result = await db.query(
      `
        INSERT INTO patient_signals (
          id,
          tenant_id,
          patient_user_id,
          patient_email,
          kind,
          title,
          description,
          status,
          source,
          metadata,
          created_at,
          updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$11)
        RETURNING *
      `,
      [
        record.id,
        record.tenantId,
        record.userId,
        record.email,
        record.kind,
        record.title,
        record.description,
        record.status,
        record.source,
        JSON.stringify(record.metadata || {}),
        record.createdAt
      ]
    );

    return mapSignalRow(result.rows[0]);
  } catch (_error) {
    const memoryStore = getMemorySignalStore();

    const memoryRecord = {
      id: record.id,
      tenantId: record.tenantId,
      userId: record.userId,
      email: record.email,
      kind: record.kind,
      title: record.title,
      description: record.description,
      status: record.status,
      source: 'memory',
      createdAt: record.createdAt,
      taskCreated: false,
      linkedTaskId: null,
      resolvedAt: null,
      resolvedBy: null,
      metadata: record.metadata || {}
    };

    memoryStore.push(memoryRecord);
    return memoryRecord;
  }
}

async function resolveSignal(actor, signalId) {
  const id = normalizeText(signalId);

  if (!id) {
    throw new Error('Signal id is required');
  }

  const resolvedBy = normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user';
  const resolvedAt = new Date().toISOString();

  try {
    await ensureTables();

    const result = await db.query(
      `
        UPDATE patient_signals
        SET
          status = 'resolved',
          resolved_at = $2,
          resolved_by = $3,
          updated_at = $2
        WHERE id = $1
        RETURNING *
      `,
      [id, resolvedAt, resolvedBy]
    );

    if (!result.rows[0]) {
      throw new Error('Signal not found');
    }

    return mapSignalRow(result.rows[0]);
  } catch (error) {
    const store = getMemorySignalStore();
    const item = store.find((entry) => String(entry.id) === String(id));

    if (!item) {
      throw new Error('Signal not found');
    }

    item.status = 'resolved';
    item.resolvedAt = resolvedAt;
    item.resolvedBy = resolvedBy;

    return item;
  }
}

async function createTaskFromSignal(actor, signalId) {
  const id = normalizeText(signalId);

  if (!id) {
    throw new Error('Signal id is required');
  }

  await ensureTables();

  const signalResult = await db.query(
    `SELECT * FROM patient_signals WHERE id = $1 LIMIT 1`,
    [id]
  );

  const signal = signalResult.rows[0];

  if (!signal) {
    throw new Error('Signal not found');
  }

  if (signal.task_created && signal.linked_task_id) {
    return {
      signal: mapSignalRow(signal),
      task: {
        id: signal.linked_task_id,
        source: 'native',
        sourceType: 'native'
      }
    };
  }

  const nativeTask = await nativeTaskBridgeService.createNativeTaskFromSignal(
    {
      id: signal.id,
      kind: signal.kind,
      title: signal.title,
      description: signal.description,
      source: signal.source,
      email: signal.patient_email,
      patientEmail: signal.patient_email,
      userId: signal.patient_user_id,
      patientUserId: signal.patient_user_id,
      tenantId: signal.tenant_id,
      tenant_id: signal.tenant_id,
      metadata: signal.metadata || {}
    },
    actor
  );

  const updatedSignalResult = await db.query(
    `
      UPDATE patient_signals
      SET
        task_created = TRUE,
        linked_task_id = $2,
        status = 'task_created',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [signal.id, nativeTask.id]
  );

  return {
    signal: mapSignalRow(updatedSignalResult.rows[0]),
    task: {
      id: nativeTask.id,
      title: nativeTask.title,
      description: nativeTask.description,
      patientEmail: nativeTask.patientEmail,
      status: nativeTask.status,
      createdBy: normalizeText(actor?.email || actor?.userId || actor?.id) || 'tenant-user',
      createdAt: new Date().toISOString(),
      source: 'native',
      sourceType: 'native'
    }
  };
}

module.exports = {
  buildSummary,
  createSignal,
  createTaskFromSignal,
  listSignalsForPatient,
  listSignalsForTenant,
  resolveSignal
};