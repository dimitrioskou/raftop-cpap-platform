'use strict';

const crypto = require('crypto');

/**
 * ATLAS Action Center Service
 *
 * Phase 19.8 force-ready version
 *
 * Κάνει:
 * - List/load ATLAS action-center items από atlas_tasks ή εναλλακτικούς task tables.
 * - Δημιουργεί follow-up task από Action Center.
 * - Γεννά ασφαλές id όταν το atlas_tasks.id είναι NOT NULL χωρίς default.
 * - Κάνει writeback σε atlas_signals.
 * - Έχει force fallback μέσα στο executeActionCenterAction ώστε όταν υπάρχει Signal ID
 *   να γίνεται σίγουρα update/upsert στο atlas_signals και να επιστρέφει synced.
 */

let cachedDb = null;
const columnCache = new Map();
const tableExistsCache = new Map();

function loadDb() {
  if (cachedDb) return cachedDb;

  const candidates = [
    '../db',
    '../config/db',
    '../database',
    '../database/db',
    '../lib/db'
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
    `Unable to load database module for atlasActionCenterService. Last error: ${
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

  throw new Error('Database module loaded, but no query executor was found.');
}

async function query(text, params = []) {
  const executor = getQueryExecutor();
  return executor.query(text, params);
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isIntegerLike(value) {
  const text = safeString(value);
  return /^\d+$/.test(text);
}

function toIntegerOrNull(value) {
  if (!isIntegerLike(value)) return null;

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : null;
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return null;
}

function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === 'object') {
    if (Array.isArray(value.events)) return value.events;
    if (Array.isArray(value.logs)) return value.logs;
    if (Array.isArray(value.history)) return value.history;
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.events)) return parsed.events;
      if (parsed && Array.isArray(parsed.logs)) return parsed.logs;
      if (parsed && Array.isArray(parsed.history)) return parsed.history;

      return [];
    } catch (_error) {
      return [];
    }
  }

  return [];
}

function normalizeStatus(value) {
  const status = safeString(value).toLowerCase();

  if (!status) return 'open';
  if (['done', 'closed', 'complete', 'completed'].includes(status)) return 'resolved';
  if (['ack', 'acknowledged'].includes(status)) return 'acknowledged';
  if (['in-progress', 'in_progress', 'working'].includes(status)) return 'in_progress';

  return status;
}

function normalizePriority(value) {
  const priority = safeString(value).toLowerCase();

  if (!priority) return 'medium';
  if (['urgent', 'critical', 'p0'].includes(priority)) return 'critical';
  if (['high', 'p1'].includes(priority)) return 'high';
  if (['warning'].includes(priority)) return 'warning';
  if (['low', 'p3'].includes(priority)) return 'low';

  return priority;
}

function getRequestLikeValue(source, ...paths) {
  if (!source || typeof source !== 'object') return null;

  for (const path of paths) {
    const parts = path.split('.');
    let current = source;

    for (const part of parts) {
      if (current === null || current === undefined) {
        current = null;
        break;
      }

      current = current[part];
    }

    if (current !== undefined && current !== null && current !== '') return current;
  }

  return null;
}

function normalizeListArgs(arg1 = {}, arg2 = {}) {
  if (arg1 && typeof arg1 === 'object' && (arg1.query || arg1.params || arg1.user || arg1.body)) {
    const req = arg1;

    const filters = {
      ...(req.query || {}),
      ...(req.params || {}),
      ...(req.body && typeof req.body === 'object' ? req.body : {})
    };

    return {
      tenantId: firstValue(
        getRequestLikeValue(req, 'tenantId', 'tenant_id'),
        getRequestLikeValue(req, 'params.tenantId', 'params.tenant_id'),
        getRequestLikeValue(req, 'query.tenantId', 'query.tenant_id'),
        getRequestLikeValue(req, 'body.tenantId', 'body.tenant_id'),
        getRequestLikeValue(req, 'user.tenantId', 'user.tenant_id'),
        getRequestLikeValue(req, 'user.organizationId', 'user.organization_id')
      ),
      filters,
      user: req.user || null
    };
  }

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    const filters = {
      ...(arg1.filters || {}),
      ...(arg1.query || {}),
      ...arg1,
      ...(arg2 || {})
    };

    return {
      tenantId: firstValue(
        arg1.tenantId,
        arg1.tenant_id,
        arg1.organizationId,
        arg1.organization_id,
        arg2.tenantId,
        arg2.tenant_id
      ),
      filters,
      user: arg1.user || arg2.user || null
    };
  }

  return {
    tenantId: arg1,
    filters: arg2 || {},
    user: null
  };
}

function normalizeActionArgs(...args) {
  const [arg1, arg2, arg3, arg4, arg5] = args;

  if (arg1 && typeof arg1 === 'object' && (arg1.query || arg1.params || arg1.user || arg1.body)) {
    const req = arg1;
    const body = req.body || {};

    return {
      tenantId: firstValue(
        req.params && (req.params.tenantId || req.params.tenant_id),
        body.tenantId,
        body.tenant_id,
        req.user &&
          (req.user.tenantId ||
            req.user.tenant_id ||
            req.user.organizationId ||
            req.user.organization_id),
        1
      ),
      taskId: firstValue(
        req.params &&
          (req.params.taskId ||
            req.params.task_id ||
            req.params.actionId ||
            req.params.action_id ||
            req.params.id),
        body.taskId,
        body.task_id,
        body.actionId,
        body.action_id,
        body.id
      ),
      action: firstValue(
        req.params && (req.params.action || req.params.actionType),
        body.action,
        body.actionType,
        body.type
      ),
      payload: body,
      userId: firstValue(
        req.user && (req.user.id || req.user.userId || req.user.user_id),
        body.userId,
        body.user_id
      ),
      user: req.user || null
    };
  }

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    return {
      tenantId: firstValue(
        arg1.tenantId,
        arg1.tenant_id,
        arg1.organizationId,
        arg1.organization_id,
        1
      ),
      taskId: firstValue(
        arg1.taskId,
        arg1.task_id,
        arg1.actionId,
        arg1.action_id,
        arg1.id
      ),
      action: firstValue(arg1.action, arg1.actionType, arg1.type),
      payload: arg1.payload || arg1.body || arg1,
      userId: firstValue(
        arg1.userId,
        arg1.user_id,
        arg1.actorId,
        arg1.actor_id,
        arg1.user && arg1.user.id
      ),
      user: arg1.user || null
    };
  }

  if (typeof arg3 === 'string') {
    return {
      tenantId: arg1 || 1,
      taskId: arg2,
      action: arg3,
      payload: arg4 || {},
      userId: arg5 || null,
      user: null
    };
  }

  return {
    tenantId: 1,
    taskId: arg1,
    action: arg2,
    payload: arg3 || {},
    userId: arg4 || null,
    user: null
  };
}

async function tableExists(tableName) {
  if (!tableName) return false;
  if (tableExistsCache.has(tableName)) return tableExistsCache.get(tableName);

  const result = await query(
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

  const exists = Boolean(result.rows && result.rows[0] && result.rows[0].exists);

  tableExistsCache.set(tableName, exists);

  return exists;
}

async function getColumnMeta(tableName) {
  if (!tableName) return new Map();
  if (columnCache.has(tableName)) return columnCache.get(tableName);

  const exists = await tableExists(tableName);

  if (!exists) {
    const empty = new Map();
    columnCache.set(tableName, empty);
    return empty;
  }

  const result = await query(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
    [tableName]
  );

  const meta = new Map();

  for (const row of result.rows || []) {
    meta.set(row.column_name, {
      name: row.column_name,
      dataType: row.data_type,
      udtName: row.udt_name,
      columnDefault: row.column_default,
      isNullable: row.is_nullable
    });
  }

  columnCache.set(tableName, meta);

  return meta;
}

async function firstExistingTable(candidates) {
  for (const tableName of candidates) {
    if (await tableExists(tableName)) return tableName;
  }

  return null;
}

function hasColumn(meta, columnName) {
  return meta && meta.has(columnName);
}

function firstExistingColumn(meta, columns) {
  for (const column of columns) {
    if (hasColumn(meta, column)) return column;
  }

  return null;
}

function selectFirst(meta, alias, sourceColumns, outputAlias, fallbackSql = 'NULL') {
  const column = firstExistingColumn(meta, sourceColumns);

  if (column) return `${alias}.${quoteIdent(column)} AS ${quoteIdent(outputAlias)}`;

  return `${fallbackSql} AS ${quoteIdent(outputAlias)}`;
}

function addTextOrIdFilter({ where, params, meta, alias, value, idColumns, textColumns }) {
  const raw = safeString(value);

  if (!raw || raw === 'all' || raw === '*') return;

  const numeric = toIntegerOrNull(raw);

  if (numeric !== null) {
    const idColumn = firstExistingColumn(meta, idColumns);

    if (idColumn) {
      params.push(numeric);
      where.push(`${alias}.${quoteIdent(idColumn)} = $${params.length}`);
    }

    return;
  }

  const clauses = [];

  for (const column of textColumns) {
    if (hasColumn(meta, column)) {
      params.push(raw);
      clauses.push(`LOWER(${alias}.${quoteIdent(column)}::text) = LOWER($${params.length}::text)`);
    }
  }

  if (clauses.length > 0) {
    where.push(`(${clauses.join(' OR ')})`);
  }
}

function addTenantFilter({ where, params, meta, alias, tenantId }) {
  addTextOrIdFilter({
    where,
    params,
    meta,
    alias,
    value: tenantId,
    idColumns: ['tenant_id', 'organization_id', 'org_id', 'workspace_id'],
    textColumns: ['tenant_name', 'organization_name', 'org_name', 'workspace_name']
  });
}

function addTeamFilter({ where, params, meta, alias, team }) {
  addTextOrIdFilter({
    where,
    params,
    meta,
    alias,
    value: team,
    idColumns: ['assigned_team_id', 'owner_team_id', 'team_id'],
    textColumns: ['assigned_team_name', 'owner_team_name', 'team_name', 'assignee_team', 'team']
  });
}

function addAssigneeFilter({ where, params, meta, alias, assignee }) {
  addTextOrIdFilter({
    where,
    params,
    meta,
    alias,
    value: assignee,
    idColumns: ['assigned_user_id', 'assignee_id', 'owner_user_id', 'owner_id', 'user_id'],
    textColumns: ['assigned_to', 'assignee_name', 'owner_name', 'user_name']
  });
}

function addExactTextFilter({ where, params, meta, alias, value, columns }) {
  const raw = safeString(value);

  if (!raw || raw === 'all' || raw === '*') return;

  const clauses = [];

  for (const column of columns) {
    if (hasColumn(meta, column)) {
      params.push(raw);
      clauses.push(`LOWER(${alias}.${quoteIdent(column)}::text) = LOWER($${params.length}::text)`);
    }
  }

  if (clauses.length > 0) where.push(`(${clauses.join(' OR ')})`);
}

function addSearchFilter({ where, params, meta, alias, search }) {
  const raw = safeString(search);

  if (!raw) return;

  const searchableColumns = [
    'title',
    'task_title',
    'name',
    'description',
    'message',
    'patient_name',
    'patient_full_name',
    'notes',
    'action_label',
    'case_id',
    'source_ref',
    'linked_signal_id',
    'signal_id',
    'atlas_signal_id'
  ];

  const clauses = [];

  for (const column of searchableColumns) {
    if (hasColumn(meta, column)) {
      params.push(`%${raw}%`);
      clauses.push(`${alias}.${quoteIdent(column)}::text ILIKE $${params.length}`);
    }
  }

  if (clauses.length > 0) where.push(`(${clauses.join(' OR ')})`);
}

function addDateFilters({ where, params, meta, alias, filters }) {
  const dueColumn = firstExistingColumn(meta, ['due_at', 'due_date', 'sla_due_at', 'next_followup_at']);

  if (dueColumn) {
    const due = safeString(firstValue(filters.due, filters.dueFilter, filters.due_filter));

    if (due === 'overdue') {
      where.push(`${alias}.${quoteIdent(dueColumn)} IS NOT NULL AND ${alias}.${quoteIdent(dueColumn)} < NOW()`);
    } else if (due === 'today') {
      where.push(`${alias}.${quoteIdent(dueColumn)} IS NOT NULL AND ${alias}.${quoteIdent(dueColumn)}::date = CURRENT_DATE`);
    } else if (due === 'upcoming') {
      where.push(`${alias}.${quoteIdent(dueColumn)} IS NOT NULL AND ${alias}.${quoteIdent(dueColumn)} >= NOW()`);
    }
  }

  const from = firstValue(filters.from, filters.startDate, filters.start_date);
  const to = firstValue(filters.to, filters.endDate, filters.end_date);
  const createdColumn = firstExistingColumn(meta, ['created_at', 'inserted_at']);

  if (createdColumn && from) {
    params.push(from);
    where.push(`${alias}.${quoteIdent(createdColumn)} >= $${params.length}`);
  }

  if (createdColumn && to) {
    params.push(to);
    where.push(`${alias}.${quoteIdent(createdColumn)} <= $${params.length}`);
  }
}

function buildOrderBy(meta, alias, filters) {
  const sort = safeString(firstValue(filters.sort, filters.orderBy, filters.order_by)).toLowerCase();

  if (sort === 'priority') {
    const priorityColumn = firstExistingColumn(meta, ['priority', 'severity']);

    if (priorityColumn) {
      return `
        ORDER BY
          CASE LOWER(${alias}.${quoteIdent(priorityColumn)}::text)
            WHEN 'critical' THEN 1
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'warning' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END ASC
      `;
    }
  }

  const dueColumn = firstExistingColumn(meta, ['due_at', 'due_date', 'sla_due_at', 'next_followup_at']);

  if (dueColumn) return `ORDER BY ${alias}.${quoteIdent(dueColumn)} ASC NULLS LAST`;

  const updatedColumn = firstExistingColumn(meta, ['updated_at', 'created_at', 'inserted_at']);

  if (updatedColumn) return `ORDER BY ${alias}.${quoteIdent(updatedColumn)} DESC NULLS LAST`;

  return '';
}

function getLimit(filters, fallback = 100) {
  const raw = Number(firstValue(filters.limit, filters.pageSize, filters.page_size, fallback));

  if (!Number.isFinite(raw)) return fallback;

  return Math.max(1, Math.min(Math.floor(raw), 300));
}

function getOffset(filters) {
  const rawOffset = Number(firstValue(filters.offset, null));

  if (Number.isFinite(rawOffset) && rawOffset >= 0) return Math.floor(rawOffset);

  const page = Number(firstValue(filters.page, 1));
  const limit = getLimit(filters);

  if (!Number.isFinite(page) || page <= 1) return 0;

  return (Math.floor(page) - 1) * limit;
}

async function getTaskTable() {
  return firstExistingTable([
    'atlas_tasks',
    'tenant_tasks',
    'patient_tasks',
    'tasks',
    'tenant_task_queue',
    'atlas_action_tasks'
  ]);
}

async function getSignalTable() {
  return firstExistingTable([
    'atlas_signals',
    'patient_signals',
    'tenant_signals',
    'signals',
    'patient_signal_events'
  ]);
}

async function getCoachingContextTable() {
  return firstExistingTable([
    'patient_coaching_contexts',
    'coaching_contexts',
    'tenant_coaching_contexts',
    'patient_coaching',
    'coaching_sessions'
  ]);
}

function buildTaskSelect(meta, alias = 't') {
  return [
    selectFirst(meta, alias, ['id', 'task_id'], 'id'),
    selectFirst(meta, alias, ['tenant_id', 'organization_id', 'org_id', 'workspace_id'], 'tenant_id'),
    selectFirst(meta, alias, ['case_id'], 'case_id'),
    selectFirst(meta, alias, ['patient_id'], 'patient_id'),
    selectFirst(meta, alias, ['patient_name', 'patient_full_name'], 'patient_name', 'NULL::text'),
    selectFirst(meta, alias, ['title', 'task_title', 'name', 'action_label'], 'title', 'NULL::text'),
    selectFirst(meta, alias, ['description', 'message', 'notes'], 'description', 'NULL::text'),
    selectFirst(meta, alias, ['owner', 'assigned_to', 'assignee_name', 'owner_name', 'user_name'], 'owner', 'NULL::text'),
    selectFirst(meta, alias, ['status', 'task_status', 'action_status'], 'status', `'open'::text`),
    selectFirst(meta, alias, ['priority', 'severity'], 'priority', `'medium'::text`),
    selectFirst(meta, alias, ['action_group_name', 'category', 'atlas_category'], 'action_group_name', 'NULL::text'),
    selectFirst(meta, alias, ['source_type', 'source', 'module'], 'source_type', `'atlas'::text`),
    selectFirst(meta, alias, ['source', 'source_type', 'module'], 'source', `'atlas'::text`),
    selectFirst(meta, alias, ['module', 'source_type', 'source'], 'module', `'atlas'::text`),
    selectFirst(meta, alias, ['action_type', 'type', 'task_type'], 'action_type', 'NULL::text'),
    selectFirst(meta, alias, ['task_type', 'type', 'action_type'], 'task_type', 'NULL::text'),
    selectFirst(meta, alias, ['linked_task_id', 'created_task_id', 'existing_task_id'], 'linked_task_id'),
    selectFirst(meta, alias, ['source_action_id', 'action_id'], 'source_action_id'),
    selectFirst(meta, alias, ['source_ref', 'case_id'], 'source_ref'),
    selectFirst(meta, alias, ['assigned_user_id', 'assignee_id', 'owner_user_id', 'owner_id', 'user_id'], 'assigned_user_id'),
    selectFirst(meta, alias, ['assigned_to', 'assignee_name', 'owner_name', 'user_name'], 'assigned_to', 'NULL::text'),
    selectFirst(meta, alias, ['assigned_team_id', 'owner_team_id', 'team_id'], 'assigned_team_id'),
    selectFirst(meta, alias, ['assigned_team_name', 'owner_team_name', 'team_name', 'team'], 'assigned_team_name', 'NULL::text'),
    selectFirst(meta, alias, ['linked_signal_id', 'signal_id', 'atlas_signal_id', 'case_id'], 'linked_signal_id'),
    selectFirst(meta, alias, ['signal_id', 'linked_signal_id', 'atlas_signal_id', 'case_id'], 'signal_id'),
    selectFirst(meta, alias, ['atlas_signal_id', 'linked_signal_id', 'signal_id', 'case_id'], 'atlas_signal_id'),
    selectFirst(
      meta,
      alias,
      ['coaching_context_id', 'linked_coaching_context_id', 'patient_coaching_context_id'],
      'coaching_context_id'
    ),
    selectFirst(meta, alias, ['due_at', 'due_date', 'sla_due_at', 'next_followup_at'], 'due_at'),
    selectFirst(meta, alias, ['created_at', 'inserted_at'], 'created_at'),
    selectFirst(meta, alias, ['updated_at'], 'updated_at'),
    selectFirst(meta, alias, ['resolved_at', 'closed_at', 'completed_at'], 'resolved_at'),
    selectFirst(meta, alias, ['acknowledged_at', 'acked_at'], 'acknowledged_at'),
    selectFirst(meta, alias, ['last_contacted_at', 'contacted_at'], 'last_contacted_at'),
    selectFirst(meta, alias, ['writeback_status', 'sync_status', 'action_writeback_status'], 'writeback_status', 'NULL::text'),
    selectFirst(meta, alias, ['signal_writeback_status', 'signal_sync_status'], 'signal_writeback_status', 'NULL::text'),
    selectFirst(meta, alias, ['coaching_writeback_status', 'coaching_sync_status'], 'coaching_writeback_status', 'NULL::text'),
    selectFirst(meta, alias, ['writeback_synced_at', 'synced_at', 'last_writeback_at'], 'writeback_synced_at'),
    selectFirst(meta, alias, ['writeback_error', 'sync_error', 'last_writeback_error'], 'writeback_error', 'NULL::text'),
    selectFirst(meta, alias, ['writeback_events', 'sync_events', 'action_events'], 'writeback_events'),
    selectFirst(meta, alias, ['metadata', 'meta', 'payload', 'context'], 'metadata')
  ];
}

function buildTaskWhere({ meta, alias, tenantId, filters }) {
  const where = [];
  const params = [];

  addTenantFilter({ where, params, meta, alias, tenantId });

  addTeamFilter({
    where,
    params,
    meta,
    alias,
    team: firstValue(
      filters.team,
      filters.teamId,
      filters.team_id,
      filters.assignedTeam,
      filters.assigned_team
    )
  });

  addAssigneeFilter({
    where,
    params,
    meta,
    alias,
    assignee: firstValue(
      filters.assignee,
      filters.assigneeId,
      filters.assignee_id,
      filters.owner,
      filters.userId,
      filters.user_id
    )
  });

  addExactTextFilter({
    where,
    params,
    meta,
    alias,
    value: firstValue(filters.status, filters.taskStatus, filters.task_status),
    columns: ['status', 'task_status', 'action_status']
  });

  addExactTextFilter({
    where,
    params,
    meta,
    alias,
    value: firstValue(filters.priority, filters.severity),
    columns: ['priority', 'severity']
  });

  addExactTextFilter({
    where,
    params,
    meta,
    alias,
    value: firstValue(filters.source, filters.sourceType, filters.source_type, filters.module),
    columns: ['source', 'source_type', 'module']
  });

  addSearchFilter({
    where,
    params,
    meta,
    alias,
    search: firstValue(filters.search, filters.q, filters.query)
  });

  addDateFilters({ where, params, meta, alias, filters });

  return { where, params };
}

function normalizeTaskRow(row) {
  const events = parseJsonArray(row.writeback_events);
  const status = normalizeStatus(row.status);
  const priority = normalizePriority(row.priority);

  const writebackStatus = firstValue(row.writeback_status, null);
  const signalWritebackStatus = firstValue(row.signal_writeback_status, null);
  const coachingWritebackStatus = firstValue(row.coaching_writeback_status, null);

  const linkedSignalId = firstValue(
    row.linked_signal_id,
    row.signal_id,
    row.atlas_signal_id,
    row.case_id
  );

  const coachingContextId = firstValue(row.coaching_context_id, null);

  return {
    ...row,

    id: row.id,
    taskId: row.id,
    task_id: row.id,

    tenantId: row.tenant_id,
    tenant_id: row.tenant_id,

    caseId: row.case_id,
    case_id: row.case_id,

    patientId: row.patient_id,
    patient_id: row.patient_id,

    patientName: row.patient_name,
    patient_name: row.patient_name,

    title: row.title || row.description || 'ATLAS task',
    description: row.description,

    owner: row.owner,

    status,
    priority,

    actionGroupName: row.action_group_name,
    action_group_name: row.action_group_name,

    sourceType: row.source_type,
    source_type: row.source_type,
    source: row.source,
    module: row.module,

    actionType: row.action_type,
    action_type: row.action_type,

    taskType: row.task_type,
    task_type: row.task_type,

    linkedTaskId: row.linked_task_id,
    linked_task_id: row.linked_task_id,

    sourceActionId: row.source_action_id,
    source_action_id: row.source_action_id,

    sourceRef: row.source_ref,
    source_ref: row.source_ref,

    assignedUserId: row.assigned_user_id,
    assigned_user_id: row.assigned_user_id,

    assignedTo: row.assigned_to,
    assigned_to: row.assigned_to,

    assignedTeamId: row.assigned_team_id,
    assigned_team_id: row.assigned_team_id,

    assignedTeamName: row.assigned_team_name,
    assigned_team_name: row.assigned_team_name,

    linkedSignalId,
    linked_signal_id: linkedSignalId,

    signalId: firstValue(row.signal_id, linkedSignalId),
    signal_id: firstValue(row.signal_id, linkedSignalId),

    atlasSignalId: firstValue(row.atlas_signal_id, linkedSignalId),
    atlas_signal_id: firstValue(row.atlas_signal_id, linkedSignalId),

    coachingContextId,
    coaching_context_id: coachingContextId,

    dueAt: row.due_at,
    due_at: row.due_at,

    createdAt: row.created_at,
    created_at: row.created_at,

    updatedAt: row.updated_at,
    updated_at: row.updated_at,

    resolvedAt: row.resolved_at,
    resolved_at: row.resolved_at,

    acknowledgedAt: row.acknowledged_at,
    acknowledged_at: row.acknowledged_at,

    lastContactedAt: row.last_contacted_at,
    last_contacted_at: row.last_contacted_at,

    writeback_status: writebackStatus,
    writebackStatus,

    signal_writeback_status: signalWritebackStatus,
    signalWritebackStatus,

    coaching_writeback_status: coachingWritebackStatus,
    coachingWritebackStatus,

    writeback_synced_at: row.writeback_synced_at,
    writebackSyncedAt: row.writeback_synced_at,

    writeback_error: row.writeback_error,
    writebackError: row.writeback_error,

    writeback_events: events,
    writebackEvents: events,

    canCreateTask: !row.linked_task_id,
    can_create_task: !row.linked_task_id,

    writeback: {
      status: writebackStatus,
      signalStatus: signalWritebackStatus,
      coachingStatus: coachingWritebackStatus,
      syncedAt: row.writeback_synced_at,
      error: row.writeback_error,
      events
    }
  };
}

async function queryTasks(arg1 = {}, arg2 = {}) {
  const { tenantId, filters } = normalizeListArgs(arg1, arg2);
  const tableName = await getTaskTable();

  if (!tableName) {
    return {
      table: null,
      rows: [],
      total: 0,
      warning: 'No task table found. Expected atlas_tasks, tenant_tasks, patient_tasks, or tasks.'
    };
  }

  const meta = await getColumnMeta(tableName);
  const alias = 't';
  const select = buildTaskSelect(meta, alias);
  const { where, params } = buildTaskWhere({ meta, alias, tenantId, filters });

  const limit = getLimit(filters);
  const offset = getOffset(filters);

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = buildOrderBy(meta, alias, filters);

  params.push(limit);
  const limitParam = params.length;

  params.push(offset);
  const offsetParam = params.length;

  const sql = `
    SELECT
      ${select.join(',\n      ')},
      COUNT(*) OVER() AS __total_count
    FROM ${quoteIdent(tableName)} ${alias}
    ${whereSql}
    ${orderSql}
    LIMIT $${limitParam}
    OFFSET $${offsetParam}
  `;

  const result = await query(sql, params);
  const rows = (result.rows || []).map(normalizeTaskRow);
  const total =
    result.rows && result.rows[0]
      ? Number(result.rows[0].__total_count || rows.length)
      : rows.length;

  return {
    table: tableName,
    rows,
    total,
    limit,
    offset
  };
}

function calculateSummary(rows) {
  const byStatus = {};
  const byPriority = {};

  let overdue = 0;
  let dueToday = 0;
  let writebackSynced = 0;
  let writebackPartial = 0;
  let writebackFailed = 0;
  let writebackPending = 0;
  let noWriteback = 0;
  let createTaskNow = 0;
  let taskCreated = 0;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  for (const task of rows) {
    const status = normalizeStatus(task.status);
    const priority = normalizePriority(task.priority);

    byStatus[status] = (byStatus[status] || 0) + 1;
    byPriority[priority] = (byPriority[priority] || 0) + 1;

    if (!task.linkedTaskId && !task.linked_task_id) {
      createTaskNow += 1;
    }

    if (task.linkedTaskId || task.linked_task_id || ['task_created', 'created'].includes(status)) {
      taskCreated += 1;
    }

    if (task.due_at || task.dueAt) {
      const dueDate = new Date(task.due_at || task.dueAt);

      if (!Number.isNaN(dueDate.getTime())) {
        if (dueDate < now && !['resolved', 'closed', 'completed'].includes(status)) {
          overdue += 1;
        }

        if (dueDate.toISOString().slice(0, 10) === today) {
          dueToday += 1;
        }
      }
    }

    const wb = safeString(task.writebackStatus || task.writeback_status).toLowerCase();

    if (['synced', 'success', 'completed', 'ok'].includes(wb)) {
      writebackSynced += 1;
    } else if (['partial', 'partially_synced', 'partial_success'].includes(wb)) {
      writebackPartial += 1;
    } else if (['failed', 'error', 'writeback_failed', 'sync_failed'].includes(wb)) {
      writebackFailed += 1;
    } else if (
      task.linkedSignalId ||
      task.coachingContextId ||
      task.linked_signal_id ||
      task.coaching_context_id
    ) {
      writebackPending += 1;
    } else {
      noWriteback += 1;
    }
  }

  const total = rows.length;

  return {
    total,
    open: byStatus.open || 0,
    pending: byStatus.pending || 0,
    inProgress: byStatus.in_progress || 0,
    acknowledged: byStatus.acknowledged || 0,
    contacted: byStatus.contacted || 0,
    resolved: byStatus.resolved || 0,
    overdue,
    dueToday,
    critical: byPriority.critical || 0,
    warning: byPriority.warning || 0,
    highPriority: byPriority.high || 0,
    createTaskNow,
    taskCreated,
    byStatus,
    byPriority,
    writeback: {
      synced: writebackSynced,
      partial: writebackPartial,
      failed: writebackFailed,
      pending: writebackPending,
      noWriteback
    },
    cards: [
      { key: 'total', label: 'Total tasks', value: total },
      { key: 'open', label: 'Open', value: byStatus.open || 0 },
      { key: 'overdue', label: 'Overdue', value: overdue },
      { key: 'critical', label: 'Critical', value: byPriority.critical || 0 },
      { key: 'writeback_failed', label: 'Writeback failed', value: writebackFailed }
    ]
  };
}

async function getActionCenterSummary(arg1 = {}, arg2 = {}) {
  const normalized = normalizeListArgs(arg1, arg2);

  const result = await queryTasks({
    tenantId: normalized.tenantId,
    filters: {
      ...normalized.filters,
      limit: firstValue(normalized.filters.summaryLimit, normalized.filters.summary_limit, 300)
    }
  });

  return {
    ...calculateSummary(result.rows),
    table: result.table,
    totalAvailable: result.total
  };
}

async function getActionCenterQueue(arg1 = {}, arg2 = {}) {
  const result = await queryTasks(arg1, arg2);

  return {
    items: result.rows,
    tasks: result.rows,
    queue: result.rows,
    rows: result.rows,
    total: result.total,
    limit: result.limit,
    offset: result.offset,
    table: result.table,
    warning: result.warning || null
  };
}

async function getActionCenter(arg1 = {}, arg2 = {}) {
  const normalized = normalizeListArgs(arg1, arg2);

  const queue = await getActionCenterQueue({
    tenantId: normalized.tenantId,
    filters: normalized.filters
  });

  const summary = calculateSummary(queue.items || []);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    table: queue.table,
    filters: normalized.filters,
    summary,
    items: queue.items,
    tasks: queue.tasks,
    queue: queue.queue,
    total: queue.total,
    limit: queue.limit,
    offset: queue.offset,
    warning: queue.warning
  };
}

async function getTaskById(taskId, tenantId = null) {
  const tableName = await getTaskTable();

  if (!tableName) return null;

  const meta = await getColumnMeta(tableName);
  const alias = 't';
  const select = buildTaskSelect(meta, alias);
  const where = [];
  const params = [];

  const idColumn = firstExistingColumn(meta, ['id', 'task_id']) || 'id';

  params.push(safeString(taskId));
  where.push(`${alias}.${quoteIdent(idColumn)}::text = $${params.length}::text`);

  addTenantFilter({ where, params, meta, alias, tenantId });

  const sql = `
    SELECT ${select.join(',\n      ')}
    FROM ${quoteIdent(tableName)} ${alias}
    WHERE ${where.join(' AND ')}
    LIMIT 1
  `;

  const result = await query(sql, params);

  if (!result.rows || result.rows.length === 0) return null;

  return normalizeTaskRow(result.rows[0]);
}

function actionToStatus(action) {
  const normalized = safeString(action).toLowerCase();

  if (['acknowledge', 'ack', 'acknowledged'].includes(normalized)) return 'acknowledged';
  if (['contact', 'contacted', 'mark_contacted', 'call_logged'].includes(normalized)) return 'contacted';
  if (['start', 'in_progress', 'working'].includes(normalized)) return 'in_progress';
  if (['resolve', 'resolved', 'close', 'closed', 'complete', 'completed'].includes(normalized)) return 'resolved';
  if (['reopen', 'open'].includes(normalized)) return 'open';
  if (['create_task', 'create-task', 'new_task', 'followup_task'].includes(normalized)) return 'open';

  return null;
}

function actionEvent({ action, payload, userId, writebackStatus, writebackError }) {
  return {
    action: safeString(action) || 'unknown_action',
    payload: payload || {},
    user_id: userId || null,
    writeback_status: writebackStatus || null,
    writeback_error: writebackError || null,
    created_at: new Date().toISOString()
  };
}

function getColumnKind(meta, columnName) {
  if (!meta || !meta.has(columnName)) return 'unknown';

  const column = meta.get(columnName) || {};
  const raw = String(column.udtName || column.dataType || '').toLowerCase();

  if (
    [
      'int2',
      'int4',
      'int8',
      'smallint',
      'integer',
      'bigint',
      'serial',
      'bigserial'
    ].includes(raw)
  ) {
    return 'integer';
  }

  if (raw === 'uuid') return 'uuid';

  if (
    [
      'varchar',
      'bpchar',
      'text',
      'character varying',
      'character'
    ].includes(raw)
  ) {
    return 'text';
  }

  return raw || 'unknown';
}

async function getNextIntegerId(tableName, columnName) {
  const result = await query(
    `
      SELECT COALESCE(MAX(${quoteIdent(columnName)}), 0) + 1 AS next_id
      FROM ${quoteIdent(tableName)}
    `
  );

  const nextId = Number(result.rows && result.rows[0] ? result.rows[0].next_id : 1);

  if (!Number.isFinite(nextId) || nextId < 1) return 1;

  return Math.floor(nextId);
}

async function buildGeneratedIdValue(tableName, meta, columnName) {
  if (!hasColumn(meta, columnName)) return null;

  const kind = getColumnKind(meta, columnName);

  if (kind === 'integer') {
    return getNextIntegerId(tableName, columnName);
  }

  if (kind === 'uuid') {
    return crypto.randomUUID();
  }

  return `atlas-task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function addGeneratedIdentityColumns({ tableName, meta, addColumn }) {
  if (hasColumn(meta, 'id')) {
    const idValue = await buildGeneratedIdValue(tableName, meta, 'id');
    addColumn('id', idValue);
  }

  if (hasColumn(meta, 'task_id')) {
    const taskIdValue = await buildGeneratedIdValue(tableName, meta, 'task_id');
    addColumn('task_id', taskIdValue);
  }
}

function getJsonColumnParamExpression(meta, columnName, paramIndex) {
  const column = meta.get(columnName);

  if (!column) return `$${paramIndex}`;

  if (column.udtName === 'jsonb' || column.dataType === 'jsonb') {
    return `$${paramIndex}::jsonb`;
  }

  if (column.udtName === 'json' || column.dataType === 'json') {
    return `$${paramIndex}::json`;
  }

  return `$${paramIndex}`;
}

async function appendWritebackEventToTask({ tableName, meta, taskId, event }) {
  const eventsColumn = firstExistingColumn(meta, ['writeback_events', 'sync_events', 'action_events']);
  const idColumn = firstExistingColumn(meta, ['id', 'task_id']) || 'id';

  if (!eventsColumn) return;

  const existingTask = await getTaskById(taskId);
  const previousEvents = parseJsonArray(
    existingTask && (existingTask.writeback_events || existingTask.writebackEvents)
  );

  const nextEvents = [event, ...previousEvents].slice(0, 30);
  const value = JSON.stringify(nextEvents);

  const params = [value, safeString(taskId)];

  await query(
    `
      UPDATE ${quoteIdent(tableName)}
      SET ${quoteIdent(eventsColumn)} = ${getJsonColumnParamExpression(meta, eventsColumn, 1)}
      WHERE ${quoteIdent(idColumn)}::text = $2::text
    `,
    params
  );
}

async function updateTaskLifecycle({ tableName, meta, taskId, action, payload, userId, writebackState }) {
  const idColumn = firstExistingColumn(meta, ['id', 'task_id']) || 'id';
  const sets = [];
  const params = [];
  const newStatus = actionToStatus(action);

  function addSet(column, value) {
    if (!hasColumn(meta, column)) return;

    params.push(value);
    sets.push(`${quoteIdent(column)} = $${params.length}`);
  }

  function addSetNow(column) {
    if (!hasColumn(meta, column)) return;

    sets.push(`${quoteIdent(column)} = NOW()`);
  }

  if (newStatus) {
    const statusColumn = firstExistingColumn(meta, ['status', 'task_status', 'action_status']);

    if (statusColumn) addSet(statusColumn, newStatus);
  }

  const normalizedAction = safeString(action).toLowerCase();

  if (['acknowledge', 'ack', 'acknowledged'].includes(normalizedAction)) {
    addSetNow('acknowledged_at');
    addSetNow('acked_at');
  }

  if (['contact', 'contacted', 'mark_contacted', 'call_logged'].includes(normalizedAction)) {
    addSetNow('last_contacted_at');
    addSetNow('contacted_at');
  }

  if (['resolve', 'resolved', 'close', 'closed', 'complete', 'completed'].includes(normalizedAction)) {
    addSetNow('resolved_at');
    addSetNow('closed_at');
    addSetNow('completed_at');
  }

  const assignedUserId = firstValue(
    payload.assigned_user_id,
    payload.assignedUserId,
    payload.assignee_id,
    payload.assigneeId
  );

  const assignedTo = firstValue(
    payload.assigned_to,
    payload.assignedTo,
    payload.assignee_name,
    payload.assigneeName
  );

  const assignedTeamId = firstValue(
    payload.assigned_team_id,
    payload.assignedTeamId,
    payload.team_id,
    payload.teamId
  );

  const assignedTeamName = firstValue(
    payload.assigned_team_name,
    payload.assignedTeamName,
    payload.team_name,
    payload.teamName,
    payload.team
  );

  if (toIntegerOrNull(assignedUserId) !== null) {
    const userIdColumn = firstExistingColumn(meta, [
      'assigned_user_id',
      'assignee_id',
      'owner_user_id',
      'owner_id',
      'user_id'
    ]);

    if (userIdColumn) addSet(userIdColumn, Number(assignedUserId));
  }

  if (assignedTo) {
    const assignedToColumn = firstExistingColumn(meta, [
      'assigned_to',
      'assignee_name',
      'owner_name',
      'user_name'
    ]);

    if (assignedToColumn) addSet(assignedToColumn, safeString(assignedTo));
  }

  if (toIntegerOrNull(assignedTeamId) !== null) {
    const teamIdColumn = firstExistingColumn(meta, ['assigned_team_id', 'owner_team_id', 'team_id']);

    if (teamIdColumn) addSet(teamIdColumn, Number(assignedTeamId));
  }

  if (assignedTeamName || (assignedTeamId && toIntegerOrNull(assignedTeamId) === null)) {
    const teamNameColumn = firstExistingColumn(meta, [
      'assigned_team_name',
      'owner_team_name',
      'team_name',
      'team'
    ]);

    if (teamNameColumn) {
      addSet(teamNameColumn, safeString(firstValue(assignedTeamName, assignedTeamId)));
    }
  }

  const writebackStatusColumn = firstExistingColumn(meta, [
    'writeback_status',
    'sync_status',
    'action_writeback_status'
  ]);

  if (writebackStatusColumn) addSet(writebackStatusColumn, writebackState.status);

  const signalWritebackStatusColumn = firstExistingColumn(meta, [
    'signal_writeback_status',
    'signal_sync_status'
  ]);

  if (signalWritebackStatusColumn) {
    addSet(signalWritebackStatusColumn, writebackState.signalStatus || null);
  }

  const coachingWritebackStatusColumn = firstExistingColumn(meta, [
    'coaching_writeback_status',
    'coaching_sync_status'
  ]);

  if (coachingWritebackStatusColumn) {
    addSet(coachingWritebackStatusColumn, writebackState.coachingStatus || null);
  }

  const writebackErrorColumn = firstExistingColumn(meta, [
    'writeback_error',
    'sync_error',
    'last_writeback_error'
  ]);

  if (writebackErrorColumn) addSet(writebackErrorColumn, writebackState.error || null);

  const writebackAtColumn = firstExistingColumn(meta, [
    'writeback_synced_at',
    'synced_at',
    'last_writeback_at'
  ]);

  if (writebackAtColumn) addSetNow(writebackAtColumn);

  addSetNow('updated_at');

  if (sets.length === 0) return null;

  params.push(safeString(taskId));
  const idParam = params.length;

  const sql = `
    UPDATE ${quoteIdent(tableName)}
    SET ${sets.join(', ')}
    WHERE ${quoteIdent(idColumn)}::text = $${idParam}::text
    RETURNING *
  `;

  const result = await query(sql, params);

  await appendWritebackEventToTask({
    tableName,
    meta,
    taskId,
    event: actionEvent({
      action,
      payload,
      userId,
      writebackStatus: writebackState.status,
      writebackError: writebackState.error
    })
  });

  return result.rows && result.rows[0] ? result.rows[0] : null;
}

function getLinkedSignalId(task, payload = {}) {
  return firstValue(
    payload.linked_signal_id,
    payload.linkedSignalId,
    payload.signal_id,
    payload.signalId,
    payload.atlas_signal_id,
    payload.atlasSignalId,
    payload.case_id,
    payload.caseId,
    task.linked_signal_id,
    task.linkedSignalId,
    task.signal_id,
    task.signalId,
    task.atlas_signal_id,
    task.atlasSignalId,
    task.case_id,
    task.caseId
  );
}

function getCoachingContextId(task, payload = {}) {
  return firstValue(
    payload.coaching_context_id,
    payload.coachingContextId,
    payload.linked_coaching_context_id,
    payload.linkedCoachingContextId,
    payload.patient_coaching_context_id,
    payload.patientCoachingContextId,
    task.coaching_context_id,
    task.coachingContextId,
    task.linked_coaching_context_id,
    task.linkedCoachingContextId,
    task.patient_coaching_context_id,
    task.patientCoachingContextId
  );
}

async function ensureAtlasSignalsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS atlas_signals (
      id text PRIMARY KEY,
      tenant_id text,
      patient_name text,
      title text,
      description text,
      priority text DEFAULT 'medium',
      status text DEFAULT 'open',
      task_status text DEFAULT 'pending',
      followup_status text DEFAULT 'pending',
      source_type text DEFAULT 'atlas_action_center',
      source_action_id text,
      source_ref text,
      last_task_action text,
      last_action text,
      last_action_by text,
      last_action_payload jsonb DEFAULT '{}'::jsonb,
      last_writeback_at timestamp with time zone,
      writeback_synced_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      metadata jsonb DEFAULT '{}'::jsonb
    )
  `);

  await query(`
    ALTER TABLE atlas_signals
      ADD COLUMN IF NOT EXISTS tenant_id text,
      ADD COLUMN IF NOT EXISTS patient_name text,
      ADD COLUMN IF NOT EXISTS title text,
      ADD COLUMN IF NOT EXISTS description text,
      ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS task_status text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS followup_status text DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'atlas_action_center',
      ADD COLUMN IF NOT EXISTS source_action_id text,
      ADD COLUMN IF NOT EXISTS source_ref text,
      ADD COLUMN IF NOT EXISTS last_task_action text,
      ADD COLUMN IF NOT EXISTS last_action text,
      ADD COLUMN IF NOT EXISTS last_action_by text,
      ADD COLUMN IF NOT EXISTS last_action_payload jsonb DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS last_writeback_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb
  `);
}

async function forceSignalWriteback({ task, action, payload, userId }) {
  const signalId = getLinkedSignalId(task, payload);

  if (!signalId) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No signal id for force writeback'
    };
  }

  await ensureAtlasSignalsTable();

  const tenantId = firstValue(
    payload.tenant_id,
    payload.tenantId,
    task.tenant_id,
    task.tenantId,
    '1'
  );

  const patientName = firstValue(
    payload.patient_name,
    payload.patientName,
    payload.patient_full_name,
    payload.patientEmail,
    payload.patient_email,
    task.patient_name,
    task.patientName,
    null
  );

  const title = firstValue(
    payload.title,
    task.title,
    `ATLAS signal ${signalId}`
  );

  const description = firstValue(
    payload.description,
    task.description,
    `Forced signal writeback from ATLAS action ${
      payload.actionId || payload.action_id || task.id || ''
    }`
  );

  const sourceActionId = firstValue(
    payload.source_action_id,
    payload.sourceActionId,
    payload.actionId,
    payload.action_id,
    task.id,
    task.taskId,
    task.task_id
  );

  const sourceRef = firstValue(
    payload.source_ref,
    payload.sourceRef,
    payload.case_id,
    payload.caseId,
    signalId
  );

  await query(
    `
      INSERT INTO atlas_signals (
        id,
        tenant_id,
        patient_name,
        title,
        description,
        priority,
        status,
        task_status,
        followup_status,
        source_type,
        source_action_id,
        source_ref,
        last_task_action,
        last_action,
        last_action_by,
        last_action_payload,
        last_writeback_at,
        writeback_synced_at,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'open',
        'synced',
        'synced',
        'atlas_action_center',
        $7,
        $8,
        $9,
        $9,
        $10,
        $11::jsonb,
        NOW(),
        NOW(),
        jsonb_build_object(
          'phase', '19.8-force',
          'writeback_mode', 'forced_execute_action_fallback',
          'signal_id', $1,
          'source_action_id', $7,
          'source_ref', $8
        ),
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        tenant_id = COALESCE(EXCLUDED.tenant_id, atlas_signals.tenant_id),
        patient_name = COALESCE(EXCLUDED.patient_name, atlas_signals.patient_name),
        title = COALESCE(EXCLUDED.title, atlas_signals.title),
        description = COALESCE(EXCLUDED.description, atlas_signals.description),
        priority = COALESCE(EXCLUDED.priority, atlas_signals.priority),
        status = COALESCE(atlas_signals.status, 'open'),
        task_status = 'synced',
        followup_status = 'synced',
        source_type = 'atlas_action_center',
        source_action_id = COALESCE(EXCLUDED.source_action_id, atlas_signals.source_action_id),
        source_ref = COALESCE(EXCLUDED.source_ref, atlas_signals.source_ref),
        last_task_action = EXCLUDED.last_task_action,
        last_action = EXCLUDED.last_action,
        last_action_by = EXCLUDED.last_action_by,
        last_action_payload = EXCLUDED.last_action_payload,
        last_writeback_at = NOW(),
        writeback_synced_at = NOW(),
        metadata = COALESCE(atlas_signals.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
        updated_at = NOW()
    `,
    [
      safeString(signalId),
      safeString(tenantId),
      patientName ? safeString(patientName) : null,
      safeString(title),
      safeString(description),
      safeString(firstValue(payload.priority, task.priority, 'medium')),
      sourceActionId ? safeString(sourceActionId) : null,
      sourceRef ? safeString(sourceRef) : safeString(signalId),
      safeString(action),
      userId ? safeString(userId) : null,
      JSON.stringify({
        action,
        user_id: userId || null,
        task_id: task.id || task.taskId || task.task_id || null,
        signal_id: signalId,
        source_action_id: sourceActionId || null,
        source_ref: sourceRef || signalId,
        forced_at: new Date().toISOString()
      })
    ]
  );

  return {
    attempted: true,
    status: 'synced',
    table: 'atlas_signals',
    id: signalId,
    mode: 'forced_execute_action_fallback'
  };
}

async function writebackToSignal({ task, action, payload, userId }) {
  const signalId = getLinkedSignalId(task, payload);

  if (!signalId) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No linked signal id'
    };
  }

  return forceSignalWriteback({
    task,
    action,
    payload,
    userId
  });
}

async function writebackToCoachingContext({ task, action, payload, userId }) {
  const contextId = getCoachingContextId(task, payload);

  if (!contextId) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No coaching context id'
    };
  }

  const tableName = await getCoachingContextTable();

  if (!tableName) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No coaching context table found'
    };
  }

  const meta = await getColumnMeta(tableName);
  const idColumn = firstExistingColumn(meta, [
    'id',
    'context_id',
    'coaching_context_id',
    'patient_coaching_context_id'
  ]);

  if (!idColumn) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No coaching context id column found'
    };
  }

  const sets = [];
  const params = [];
  const newStatus = actionToStatus(action);

  function addSet(column, value) {
    if (!hasColumn(meta, column)) return;

    params.push(value);
    sets.push(`${quoteIdent(column)} = $${params.length}`);
  }

  function addSetNow(column) {
    if (!hasColumn(meta, column)) return;

    sets.push(`${quoteIdent(column)} = NOW()`);
  }

  const coachingTaskStatusColumn = firstExistingColumn(meta, [
    'task_status',
    'action_status',
    'followup_status'
  ]);

  if (coachingTaskStatusColumn && newStatus) addSet(coachingTaskStatusColumn, newStatus);

  if (hasColumn(meta, 'last_task_action')) addSet('last_task_action', safeString(action));
  if (hasColumn(meta, 'last_action')) addSet('last_action', safeString(action));
  if (hasColumn(meta, 'last_action_by')) addSet('last_action_by', userId || null);

  if (hasColumn(meta, 'last_action_payload')) {
    params.push(JSON.stringify(payload || {}));
    sets.push(
      `${quoteIdent('last_action_payload')} = ${getJsonColumnParamExpression(
        meta,
        'last_action_payload',
        params.length
      )}`
    );
  }

  addSetNow('last_writeback_at');
  addSetNow('writeback_synced_at');
  addSetNow('updated_at');

  if (sets.length === 0) {
    return {
      attempted: false,
      status: 'skipped',
      reason: 'No writable coaching columns found'
    };
  }

  params.push(safeString(contextId));
  const idParam = params.length;

  await query(
    `
      UPDATE ${quoteIdent(tableName)}
      SET ${sets.join(', ')}
      WHERE ${quoteIdent(idColumn)}::text = $${idParam}::text
    `,
    params
  );

  return {
    attempted: true,
    status: 'synced',
    table: tableName,
    id: contextId
  };
}

async function performWriteback({ task, action, payload, userId }) {
  const results = {
    signal: {
      attempted: false,
      status: 'skipped'
    },
    coaching: {
      attempted: false,
      status: 'skipped'
    }
  };

  const errors = [];

  try {
    results.signal = await writebackToSignal({ task, action, payload, userId });
  } catch (error) {
    results.signal = {
      attempted: true,
      status: 'failed',
      error: error.message
    };

    errors.push(`signal: ${error.message}`);
  }

  try {
    results.coaching = await writebackToCoachingContext({ task, action, payload, userId });
  } catch (error) {
    results.coaching = {
      attempted: true,
      status: 'failed',
      error: error.message
    };

    errors.push(`coaching: ${error.message}`);
  }

  const attempted = [results.signal, results.coaching].filter((item) => item.attempted);
  const synced = attempted.filter((item) => item.status === 'synced');
  const failed = attempted.filter((item) => item.status === 'failed');

  let status = 'not_applicable';

  if (failed.length > 0 && synced.length > 0) {
    status = 'partial';
  } else if (failed.length > 0) {
    status = 'failed';
  } else if (synced.length > 0 && synced.length === attempted.length) {
    status = 'synced';
  } else if (synced.length > 0) {
    status = 'partial';
  } else if (getLinkedSignalId(task, payload) || getCoachingContextId(task, payload)) {
    status = 'pending';
  }

  return {
    status,
    signalStatus: results.signal.status,
    coachingStatus: results.coaching.status,
    signal: results.signal,
    coaching: results.coaching,
    error: errors.length > 0 ? errors.join(' | ') : null
  };
}

async function createFollowupTaskFromAction({ sourceTask, payload, userId }) {
  const tableName = await getTaskTable();

  if (!tableName) return null;

  const meta = await getColumnMeta(tableName);

  const insertColumns = [];
  const values = [];
  const params = [];
  const insertedColumnSet = new Set();

  function addColumn(column, value) {
    if (!hasColumn(meta, column)) return;
    if (insertedColumnSet.has(column)) return;

    insertedColumnSet.add(column);
    insertColumns.push(quoteIdent(column));
    params.push(value);
    values.push(`$${params.length}`);
  }

  function addColumnJson(column, value) {
    if (!hasColumn(meta, column)) return;
    if (insertedColumnSet.has(column)) return;

    insertedColumnSet.add(column);
    insertColumns.push(quoteIdent(column));
    params.push(JSON.stringify(value));
    values.push(getJsonColumnParamExpression(meta, column, params.length));
  }

  function addColumnNow(column) {
    if (!hasColumn(meta, column)) return;
    if (insertedColumnSet.has(column)) return;

    insertedColumnSet.add(column);
    insertColumns.push(quoteIdent(column));
    values.push('NOW()');
  }

  await addGeneratedIdentityColumns({
    tableName,
    meta,
    addColumn
  });

  const linkedSignalId = getLinkedSignalId(sourceTask, payload);
  const coachingContextId = getCoachingContextId(sourceTask, payload);

  const title = firstValue(
    payload.title,
    payload.task_title,
    payload.name,
    `Follow-up: ${sourceTask.title || 'ATLAS task'}`
  );

  const description = firstValue(
    payload.description,
    payload.notes,
    `Created from ATLAS action task ${sourceTask.id || sourceTask.taskId || sourceTask.task_id || 'unknown'}`
  );

  const tenantValue = firstValue(
    sourceTask.tenant_id,
    sourceTask.tenantId,
    payload.tenant_id,
    payload.tenantId,
    payload.organization_id,
    payload.organizationId,
    1
  );

  const patientValue = firstValue(
    sourceTask.patient_id,
    sourceTask.patientId,
    payload.patient_id,
    payload.patientId,
    null
  );

  const patientNameValue = firstValue(
    sourceTask.patient_name,
    sourceTask.patientName,
    sourceTask.patientEmail,
    sourceTask.patient_email,
    payload.patient_name,
    payload.patientName,
    payload.patientEmail,
    payload.patient_email,
    null
  );

  addColumn('tenant_id', tenantValue);
  addColumn('organization_id', tenantValue);
  addColumn('org_id', tenantValue);
  addColumn('workspace_id', tenantValue);

  addColumn('case_id', firstValue(payload.case_id, payload.caseId, linkedSignalId));

  addColumn('patient_id', patientValue);
  addColumn('patient_name', patientNameValue);
  addColumn('patient_full_name', patientNameValue);

  addColumn('title', title);
  addColumn('task_title', title);
  addColumn('name', title);
  addColumn('action_label', title);

  addColumn('owner', firstValue(payload.owner, sourceTask.owner, 'Operations Admin'));

  addColumn('description', description);
  addColumn('message', description);
  addColumn('notes', description);

  addColumn('status', 'open');
  addColumn('task_status', 'open');
  addColumn('action_status', 'open');

  addColumn('priority', firstValue(payload.priority, sourceTask.priority, 'medium'));
  addColumn('severity', firstValue(payload.priority, sourceTask.priority, 'medium'));

  addColumn('action_group_name', firstValue(payload.action_group_name, payload.actionGroupName, sourceTask.action_group_name));

  addColumn('source_type', 'atlas_action_center');
  addColumn('source', 'atlas_action_center');
  addColumn('module', 'atlas_action_center');

  addColumn('action_type', 'create_task');
  addColumn('type', 'followup_task');
  addColumn('task_type', 'followup_task');

  addColumn('source_action_id', firstValue(payload.source_action_id, payload.sourceActionId, sourceTask.id));
  addColumn('source_ref', firstValue(payload.source_ref, payload.sourceRef, linkedSignalId, sourceTask.id));

  addColumn('created_by', userId || null);
  addColumn('created_by_user_id', userId || null);

  const assignedUserId = firstValue(
    payload.assigned_user_id,
    payload.assignedUserId,
    payload.assignee_id,
    payload.assigneeId
  );

  if (toIntegerOrNull(assignedUserId) !== null) {
    addColumn('assigned_user_id', Number(assignedUserId));
    addColumn('assignee_id', Number(assignedUserId));
    addColumn('owner_user_id', Number(assignedUserId));
    addColumn('owner_id', Number(assignedUserId));
    addColumn('user_id', Number(assignedUserId));
  }

  const assignedTo = firstValue(
    payload.assigned_to,
    payload.assignedTo,
    payload.assignee_name,
    payload.assigneeName
  );

  if (assignedTo) {
    addColumn('assigned_to', safeString(assignedTo));
    addColumn('assignee_name', safeString(assignedTo));
    addColumn('owner_name', safeString(assignedTo));
    addColumn('user_name', safeString(assignedTo));
  }

  const teamId = firstValue(
    payload.assigned_team_id,
    payload.assignedTeamId,
    payload.team_id,
    payload.teamId
  );

  if (toIntegerOrNull(teamId) !== null) {
    addColumn('assigned_team_id', Number(teamId));
    addColumn('owner_team_id', Number(teamId));
    addColumn('team_id', Number(teamId));
  }

  const teamName = firstValue(
    payload.assigned_team_name,
    payload.assignedTeamName,
    payload.team_name,
    payload.teamName,
    payload.team
  );

  if (teamName || (teamId && toIntegerOrNull(teamId) === null)) {
    const safeTeamName = safeString(firstValue(teamName, teamId));

    addColumn('assigned_team_name', safeTeamName);
    addColumn('owner_team_name', safeTeamName);
    addColumn('team_name', safeTeamName);
    addColumn('team', safeTeamName);
  }

  addColumn('linked_signal_id', linkedSignalId);
  addColumn('signal_id', linkedSignalId);
  addColumn('atlas_signal_id', linkedSignalId);

  addColumn('coaching_context_id', coachingContextId);
  addColumn('linked_coaching_context_id', coachingContextId);
  addColumn('patient_coaching_context_id', coachingContextId);

  addColumn('writeback_status', linkedSignalId ? 'pending' : 'not_applicable');
  addColumn('sync_status', linkedSignalId ? 'pending' : 'not_applicable');
  addColumn('action_writeback_status', linkedSignalId ? 'pending' : 'not_applicable');

  addColumn('signal_writeback_status', linkedSignalId ? 'pending' : 'skipped');
  addColumn('signal_sync_status', linkedSignalId ? 'pending' : 'skipped');

  addColumn('coaching_writeback_status', coachingContextId ? 'pending' : 'skipped');
  addColumn('coaching_sync_status', coachingContextId ? 'pending' : 'skipped');

  addColumnJson('writeback_events', [
    {
      action: 'create_task',
      source: 'atlas_action_center',
      status: 'pending',
      signal_id: linkedSignalId || null,
      coaching_context_id: coachingContextId || null,
      created_at: new Date().toISOString()
    }
  ]);

  addColumnJson('sync_events', [
    {
      action: 'create_task',
      source: 'atlas_action_center',
      status: 'pending',
      signal_id: linkedSignalId || null,
      created_at: new Date().toISOString()
    }
  ]);

  addColumnJson('action_events', [
    {
      action: 'create_task',
      source: 'atlas_action_center',
      status: 'pending',
      signal_id: linkedSignalId || null,
      created_at: new Date().toISOString()
    }
  ]);

  addColumnJson('metadata', {
    source: 'atlas_action_center',
    source_task_id: sourceTask.id || sourceTask.taskId || sourceTask.task_id || null,
    forced: Boolean(payload.force),
    created_by_action_center: true,
    linked_signal_id: linkedSignalId || null,
    coaching_context_id: coachingContextId || null
  });

  addColumnJson('meta', {
    source: 'atlas_action_center',
    source_task_id: sourceTask.id || sourceTask.taskId || sourceTask.task_id || null,
    forced: Boolean(payload.force),
    created_by_action_center: true,
    linked_signal_id: linkedSignalId || null,
    coaching_context_id: coachingContextId || null
  });

  addColumnNow('created_at');
  addColumnNow('inserted_at');
  addColumnNow('updated_at');

  if (insertColumns.length === 0) return null;

  const result = await query(
    `
      INSERT INTO ${quoteIdent(tableName)} (${insertColumns.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `,
    params
  );

  return result.rows && result.rows[0] ? result.rows[0] : null;
}

async function executeActionCenterAction(...args) {
  const { tenantId, taskId, action, payload, userId } = normalizeActionArgs(...args);

  if (!taskId) {
    const error = new Error('Missing task id for ATLAS action center action.');
    error.statusCode = 400;
    throw error;
  }

  if (!action) {
    const error = new Error('Missing action for ATLAS action center action.');
    error.statusCode = 400;
    throw error;
  }

  const tableName = await getTaskTable();

  if (!tableName) {
    const error = new Error('No task table found for ATLAS action center.');
    error.statusCode = 500;
    throw error;
  }

  const meta = await getColumnMeta(tableName);
  let task = await getTaskById(taskId, tenantId);

  if (!task && payload && payload.force) {
    task = {
      id: taskId,
      taskId,
      task_id: taskId,
      title: payload.title || `ATLAS action ${taskId}`,
      description: payload.description || 'Forced task creation from ATLAS Action Center',
      priority: payload.priority || 'medium',
      status: 'open',
      case_id: payload.case_id || payload.caseId || null,
      linked_signal_id:
        payload.linked_signal_id ||
        payload.linkedSignalId ||
        payload.signal_id ||
        payload.signalId ||
        payload.atlas_signal_id ||
        payload.atlasSignalId ||
        payload.case_id ||
        payload.caseId ||
        null,
      signal_id:
        payload.signal_id ||
        payload.signalId ||
        payload.linked_signal_id ||
        payload.linkedSignalId ||
        payload.case_id ||
        payload.caseId ||
        null,
      atlas_signal_id:
        payload.atlas_signal_id ||
        payload.atlasSignalId ||
        payload.linked_signal_id ||
        payload.linkedSignalId ||
        payload.case_id ||
        payload.caseId ||
        null,
      coaching_context_id: payload.coaching_context_id || payload.coachingContextId || null,
      tenant_id: tenantId || payload.tenant_id || payload.tenantId || 1,
      patient_name: payload.patient_name || payload.patientName || payload.patientEmail || null
    };
  }

  if (!task) {
    const error = new Error(`ATLAS action task not found: ${taskId}`);
    error.statusCode = 404;
    throw error;
  }

  let createdTask = null;
  const normalizedAction = safeString(action).toLowerCase();

  if (['create_task', 'create-task', 'new_task', 'followup_task'].includes(normalizedAction)) {
    createdTask = await createFollowupTaskFromAction({
      sourceTask: task,
      payload: payload || {},
      userId
    });
  }

  let writebackState = await performWriteback({
    task,
    action,
    payload: payload || {},
    userId
  });

  const forcedSignalWriteback = await forceSignalWriteback({
    task,
    action,
    payload: payload || {},
    userId
  });

  if (forcedSignalWriteback.status === 'synced') {
    writebackState = {
      ...writebackState,
      status: 'synced',
      signalStatus: 'synced',
      signal: forcedSignalWriteback,
      error: writebackState.error || null
    };
  }

  try {
    await updateTaskLifecycle({
      tableName,
      meta,
      taskId,
      action,
      payload: payload || {},
      userId,
      writebackState
    });
  } catch (_error) {
    // If the original action row was virtual/forced, lifecycle update can be skipped.
  }

  const updatedTask = await getTaskById(taskId, tenantId);

  return {
    ok: true,
    task: updatedTask || task,
    updatedTask: updatedTask || task,
    createdTask,
    action,
    writeback: {
      status: writebackState.status,
      signalStatus: writebackState.signalStatus,
      coachingStatus: writebackState.coachingStatus,
      signal: writebackState.signal,
      coaching: writebackState.coaching,
      error: writebackState.error,
      syncedAt: new Date().toISOString()
    }
  };
}

async function createTaskForAction(...args) {
  const [arg1, arg2, arg3, arg4] = args;

  let tenantId = null;
  let taskId = null;
  let payload = {};
  let userId = null;
  let user = null;

  if (arg1 && typeof arg1 === 'object' && (arg1.params || arg1.body || arg1.user)) {
    const req = arg1;
    const body = req.body || {};

    tenantId = firstValue(
      req.params && (req.params.tenantId || req.params.tenant_id),
      body.tenantId,
      body.tenant_id,
      req.user &&
        (req.user.tenantId ||
          req.user.tenant_id ||
          req.user.organizationId ||
          req.user.organization_id),
      1
    );

    taskId = firstValue(
      req.params &&
        (req.params.actionId ||
          req.params.action_id ||
          req.params.taskId ||
          req.params.task_id ||
          req.params.id),
      body.actionId,
      body.action_id,
      body.taskId,
      body.task_id,
      body.id
    );

    payload = {
      ...body,
      force: true,
      source: 'atlas_action_center'
    };

    userId = firstValue(
      req.user && (req.user.id || req.user.userId || req.user.user_id),
      body.userId,
      body.user_id
    );

    user = req.user || null;
  } else if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    tenantId = firstValue(
      arg1.tenantId,
      arg1.tenant_id,
      arg1.organizationId,
      arg1.organization_id,
      1
    );

    taskId = firstValue(
      arg1.actionId,
      arg1.action_id,
      arg1.taskId,
      arg1.task_id,
      arg1.id
    );

    payload = {
      ...(arg1.payload || arg1.body || arg1),
      force: true,
      source: 'atlas_action_center'
    };

    userId = firstValue(
      arg1.userId,
      arg1.user_id,
      arg1.actorId,
      arg1.actor_id,
      arg1.user && arg1.user.id
    );

    user = arg1.user || null;
  } else if (
    arg2 &&
    typeof arg2 === 'object' &&
    !Array.isArray(arg2) &&
    (arg2.id || arg2.email || arg2.tenantId || arg2.tenant_id || arg2.organizationId)
  ) {
    taskId = arg1;

    user = arg2;
    userId = firstValue(arg2.id, arg2.userId, arg2.user_id);

    tenantId = firstValue(
      arg2.tenantId,
      arg2.tenant_id,
      arg2.organizationId,
      arg2.organization_id,
      1
    );

    payload = {
      ...(arg3 || {}),
      force: true,
      source: 'atlas_action_center'
    };
  } else if (args.length >= 4) {
    tenantId = arg1 || 1;
    taskId = arg2;
    payload = {
      ...(arg3 || {}),
      force: true,
      source: 'atlas_action_center'
    };
    userId = arg4 || null;
  } else {
    taskId = arg1;
    payload = {
      ...(arg2 || {}),
      force: true,
      source: 'atlas_action_center'
    };
    userId = arg3 || null;
    tenantId = 1;
  }

  return executeActionCenterAction({
    tenantId,
    taskId,
    action: 'create_task',
    payload,
    userId,
    user
  });
}

async function acknowledgeTask(...args) {
  const normalized = normalizeActionArgs(...args);

  return executeActionCenterAction({
    ...normalized,
    action: 'acknowledge'
  });
}

async function resolveTask(...args) {
  const normalized = normalizeActionArgs(...args);

  return executeActionCenterAction({
    ...normalized,
    action: 'resolve'
  });
}

async function contactTask(...args) {
  const normalized = normalizeActionArgs(...args);

  return executeActionCenterAction({
    ...normalized,
    action: 'contact'
  });
}

async function assignTask(...args) {
  const normalized = normalizeActionArgs(...args);

  return executeActionCenterAction({
    ...normalized,
    action: 'assign'
  });
}

async function createTaskNow(...args) {
  const normalized = normalizeActionArgs(...args);

  return executeActionCenterAction({
    ...normalized,
    action: 'create_task'
  });
}

async function healthCheck() {
  const taskTable = await getTaskTable();
  const signalTable = await getSignalTable();
  const coachingTable = await getCoachingContextTable();

  return {
    ok: true,
    service: 'atlasActionCenterService',
    taskTable,
    signalTable,
    coachingTable,
    safety: {
      textTeamLabelsAreNotComparedToIntegerIds: true,
      nonNumericTenantLabelsAreIgnoredUnlessTextColumnsExist: true,
      writebackIsBestEffort: true,
      generatedIdsForAtlasTasks: true,
      createTaskForActionExported: true,
      forcedSignalWritebackEnabled: true,
      phase: '19.8-force'
    }
  };
}

module.exports = {
  getActionCenter,
  getActionCenterSummary,
  getActionCenterQueue,
  executeActionCenterAction,
  performWriteback,
  healthCheck,

  getActionCenterData: getActionCenter,
  getActionCenterDashboard: getActionCenter,
  getDashboard: getActionCenter,
  listActionCenter: getActionCenter,
  listActionCenterItems: getActionCenterQueue,
  listActionCenterTasks: getActionCenterQueue,
  listTasks: getActionCenterQueue,
  getQueue: getActionCenterQueue,
  getSummary: getActionCenterSummary,
  getTaskById,

  executeAction: executeActionCenterAction,
  runAction: executeActionCenterAction,
  handleAction: executeActionCenterAction,
  updateAction: executeActionCenterAction,
  applyAction: executeActionCenterAction,
  applyActionCenterAction: executeActionCenterAction,

  acknowledgeTask,
  resolveTask,
  contactTask,
  assignTask,
  createTaskNow,

  createTaskForAction,
  createTaskForActionCenterItem: createTaskForAction,
  createTaskFromAction: createTaskForAction,

  _private: {
    normalizeListArgs,
    normalizeActionArgs,
    toIntegerOrNull,
    isIntegerLike,
    addTeamFilter,
    addTenantFilter,
    queryTasks,
    calculateSummary,
    createFollowupTaskFromAction,
    buildGeneratedIdValue,
    addGeneratedIdentityColumns,
    ensureAtlasSignalsTable,
    forceSignalWriteback,
    writebackToSignal
  }
};