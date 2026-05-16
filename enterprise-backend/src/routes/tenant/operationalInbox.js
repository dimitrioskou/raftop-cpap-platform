const express = require('express');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../db',
    '../config/db'
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

  throw new Error('Could not resolve database client in operationalInbox route.');
}

const db = resolveDb();

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function requireTenantSideActor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized'
    });
  }

  if (normalizeRole(req.user?.role) === 'patient') {
    return res.status(403).json({
      ok: false,
      message: 'Tenant/provider access only'
    });
  }

  return next();
}

function getTenantIdFromUser(user) {
  return (
    user?.tenantId ||
    user?.organizationId ||
    user?.raw?.tenant_id ||
    user?.raw?.organization_id ||
    null
  );
}

async function tableExists(tableName) {
  const result = await db.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1
    `,
    [tableName]
  );

  return Boolean(result.rows.length);
}

function getMemoryTaskStore() {
  if (!global.__raftopTenantTaskMemoryStore) {
    global.__raftopTenantTaskMemoryStore = [];
  }

  return global.__raftopTenantTaskMemoryStore;
}

function mapDbTaskRow(row) {
  return {
    id: row.id,
    title: row.title || 'Task',
    description: row.description || '',
    patientEmail: row.patient_email || null,
    patientUserId: row.patient_user_id || null,
    tenantId: row.tenant_id || null,
    patientSignalId: row.patient_signal_id || null,
    signalKind: row.signal_kind || null,
    signalTitle: row.signal_title || null,
    status: row.status || 'open',
    createdBy: row.created_by || null,
    createdAt: row.created_at || new Date().toISOString(),
    source: 'patient_signal_tasks'
  };
}

function mapMemoryTaskRow(row) {
  return {
    id: row.id,
    title: row.title || 'Task',
    description: row.description || '',
    patientEmail: row.patientEmail || null,
    patientUserId: row.patientUserId || null,
    tenantId: row.tenantId || null,
    patientSignalId: row.patientSignalId || row.sourceSignalId || null,
    signalKind: row.signalKind || null,
    signalTitle: row.signalTitle || null,
    status: row.status || 'open',
    createdBy: row.createdBy || null,
    createdAt: row.createdAt || new Date().toISOString(),
    source: 'memory'
  };
}

function sortDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

function buildSummary(items) {
  return {
    total: items.length,
    openCount: items.filter((item) => String(item.status || '').toLowerCase() === 'open').length,
    resolvedCount: items.filter((item) => String(item.status || '').toLowerCase() === 'resolved').length,
    callbackRelatedCount: items.filter((item) => String(item.signalKind || '').toLowerCase() === 'callback').length,
    issueRelatedCount: items.filter((item) => String(item.signalKind || '').toLowerCase() === 'issue').length
  };
}

async function listInboxItems(user) {
  const tenantId = getTenantIdFromUser(user);

  try {
    const hasTaskTable = await tableExists('patient_signal_tasks');
    const hasSignalTable = await tableExists('patient_signals');

    if (!hasTaskTable) {
      const memoryItems = getMemoryTaskStore().map(mapMemoryTaskRow);
      return tenantId
        ? sortDesc(
            memoryItems.filter((item) => !item.tenantId || String(item.tenantId) === String(tenantId))
          )
        : sortDesc(memoryItems);
    }

    if (hasSignalTable) {
      if (tenantId) {
        const result = await db.query(
          `
            SELECT
              t.*,
              s.kind AS signal_kind,
              s.title AS signal_title
            FROM patient_signal_tasks t
            LEFT JOIN patient_signals s
              ON s.id = t.patient_signal_id
            WHERE t.tenant_id = $1 OR t.tenant_id IS NULL
            ORDER BY t.created_at DESC
            LIMIT 200
          `,
          [String(tenantId)]
        );

        return result.rows.map(mapDbTaskRow);
      }

      const result = await db.query(`
        SELECT
          t.*,
          s.kind AS signal_kind,
          s.title AS signal_title
        FROM patient_signal_tasks t
        LEFT JOIN patient_signals s
          ON s.id = t.patient_signal_id
        ORDER BY t.created_at DESC
        LIMIT 200
      `);

      return result.rows.map(mapDbTaskRow);
    }

    if (tenantId) {
      const result = await db.query(
        `
          SELECT *
          FROM patient_signal_tasks
          WHERE tenant_id = $1 OR tenant_id IS NULL
          ORDER BY created_at DESC
          LIMIT 200
        `,
        [String(tenantId)]
      );

      return result.rows.map(mapDbTaskRow);
    }

    const result = await db.query(`
      SELECT *
      FROM patient_signal_tasks
      ORDER BY created_at DESC
      LIMIT 200
    `);

    return result.rows.map(mapDbTaskRow);
  } catch (_error) {
    const memoryItems = getMemoryTaskStore().map(mapMemoryTaskRow);
    return tenantId
      ? sortDesc(
          memoryItems.filter((item) => !item.tenantId || String(item.tenantId) === String(tenantId))
        )
      : sortDesc(memoryItems);
  }
}

async function resolveInboxTask(user, taskId) {
  try {
    const hasTaskTable = await tableExists('patient_signal_tasks');

    if (hasTaskTable) {
      const result = await db.query(
        `
          UPDATE patient_signal_tasks
          SET status = 'resolved'
          WHERE id = $1
          RETURNING *
        `,
        [String(taskId)]
      );

      if (result.rows[0]) {
        return mapDbTaskRow(result.rows[0]);
      }
    }
  } catch (_error) {
    // fallback below
  }

  const memoryStore = getMemoryTaskStore();
  const item = memoryStore.find((entry) => String(entry.id) === String(taskId));

  if (!item) {
    throw new Error('Task not found');
  }

  item.status = 'resolved';
  return mapMemoryTaskRow(item);
}

router.use(requireAuth);
router.use(requireTenantSideActor);

router.get('/', async (req, res) => {
  try {
    const items = await listInboxItems(req.user);

    return res.json({
      ok: true,
      data: {
        summary: buildSummary(items),
        items
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load operational inbox',
      error: error.message
    });
  }
});

router.post('/:id/resolve', async (req, res) => {
  try {
    const item = await resolveInboxTask(req.user, req.params.id);

    return res.json({
      ok: true,
      message: 'Inbox task resolved',
      data: item
    });
  } catch (error) {
    const status = /not found/i.test(error.message) ? 404 : 500;

    return res.status(status).json({
      ok: false,
      message: error.message || 'Failed to resolve inbox task'
    });
  }
});

module.exports = router;