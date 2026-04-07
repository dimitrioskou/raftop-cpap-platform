const path = require('path');
const jwt = require('jsonwebtoken');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

const {
  query,
  listTables,
  pickTable,
  TABLE_GROUPS
} = require('./liveVerificationService');

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && typeof value !== 'undefined' && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
}

function normalizeRole(value) {
  return String(value || 'guest').trim().toLowerCase();
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeBoolean(value, fallback = true) {
  if (value === null || typeof value === 'undefined') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 1 || value === '1' || value === 'true' || value === 'TRUE') {
    return true;
  }

  if (value === 0 || value === '0' || value === 'false' || value === 'FALSE') {
    return false;
  }

  return fallback;
}

function readBearerToken(req) {
  const header =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    '';

  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
}

function tryDecodeToken(token) {
  if (!token) {
    return null;
  }

  const secretCandidates = [
    process.env.JWT_SECRET,
    process.env.JWT_KEY,
    process.env.ACCESS_TOKEN_SECRET,
    process.env.TOKEN_SECRET
  ].filter(Boolean);

  for (const secret of secretCandidates) {
    try {
      return jwt.verify(token, secret);
    } catch (_error) {
      // try next
    }
  }

  try {
    return jwt.decode(token);
  } catch (_error) {
    return null;
  }
}

function unwrapPossibleUserShape(source) {
  if (!source || typeof source !== 'object') {
    return {};
  }

  if (source.user && typeof source.user === 'object') {
    return source.user;
  }

  return source;
}

function extractRawActor(req) {
  const token = readBearerToken(req);
  const decoded = tryDecodeToken(token);

  const reqUser = unwrapPossibleUserShape(req.user);
  const reqAuth = unwrapPossibleUserShape(req.auth);
  const reqCurrentUser = unwrapPossibleUserShape(req.currentUser);
  const decodedUser = unwrapPossibleUserShape(decoded?.user);
  const decodedRoot = unwrapPossibleUserShape(decoded);

  const merged = {
    ...decodedRoot,
    ...decodedUser,
    ...reqAuth,
    ...reqCurrentUser,
    ...reqUser
  };

  return {
    userId: firstNonEmpty(
      merged.id,
      merged.userId,
      merged.user_id,
      merged.uid,
      merged.sub
    ),
    role: normalizeRole(
      firstNonEmpty(
        merged.role,
        merged.userRole,
        merged.user_role,
        merged.accountType,
        merged.user_type,
        merged.type
      )
    ),
    tenantId: firstNonEmpty(
      merged.tenantId,
      merged.tenant_id,
      merged.organizationId,
      merged.organization_id,
      merged.orgId,
      merged.org_id,
      merged.workspaceId,
      merged.workspace_id,
      merged.clinicId,
      merged.clinic_id,
      req.headers?.['x-tenant-id']
    ),
    email: firstNonEmpty(
      merged.email,
      merged.userEmail,
      merged.user_email
    ),
    tokenPresent: Boolean(token),
    decodedTokenPresent: Boolean(decoded)
  };
}

async function getColumns(tableName) {
  if (!tableName) {
    return new Set();
  }

  const result = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
    [tableName]
  );

  return new Set(result.rows.map((row) => row.column_name));
}

function firstExisting(columns, names) {
  for (const name of names) {
    if (columns.has(name)) {
      return name;
    }
  }
  return null;
}

async function getUserIdColumnMeta() {
  const result = await query(
    `
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('id', 'user_id')
      ORDER BY CASE WHEN column_name = 'id' THEN 0 ELSE 1 END
      LIMIT 1
    `
  );

  return result.rows[0] || null;
}

function isIntegerLikeColumn(meta) {
  if (!meta) {
    return false;
  }

  return ['int2', 'int4', 'int8'].includes(meta.udt_name) ||
    ['smallint', 'integer', 'bigint'].includes(meta.data_type);
}

async function loadUserRecord(userId, email) {
  const tableSet = await listTables();
  const usersTable = pickTable(tableSet, TABLE_GROUPS.users);

  if (!usersTable) {
    return null;
  }

  const columns = await getColumns(usersTable);
  const idKey = firstExisting(columns, ['id', 'user_id']);
  const emailKey = firstExisting(columns, ['email', 'user_email']);

  if (userId && idKey) {
    const idMeta = await getUserIdColumnMeta();

    if (!isIntegerLikeColumn(idMeta) || Number.isInteger(Number(userId))) {
      const safeValue = isIntegerLikeColumn(idMeta) ? Number(userId) : userId;

      const result = await query(
        `SELECT * FROM "${usersTable}" WHERE "${idKey}" = $1 LIMIT 1`,
        [safeValue]
      );

      if (result.rows[0]) {
        return {
          table: usersTable,
          columns,
          row: result.rows[0]
        };
      }
    }
  }

  if (email && emailKey) {
    const result = await query(
      `SELECT * FROM "${usersTable}" WHERE "${emailKey}" = $1 LIMIT 1`,
      [email]
    );

    if (result.rows[0]) {
      return {
        table: usersTable,
        columns,
        row: result.rows[0]
      };
    }
  }

  return null;
}

async function hydrateActor(rawActor) {
  const actor = {
    userId: rawActor.userId || null,
    role: normalizeRole(rawActor.role || 'guest'),
    tenantId: rawActor.tenantId || null,
    email: rawActor.email || null,
    tokenPresent: Boolean(rawActor.tokenPresent),
    decodedTokenPresent: Boolean(rawActor.decodedTokenPresent)
  };

  const userRecord = await loadUserRecord(actor.userId, actor.email);

  if (!userRecord || !userRecord.row) {
    return actor;
  }

  const { columns, row } = userRecord;

  const idKey = firstExisting(columns, ['id', 'user_id']);
  const roleKey = firstExisting(columns, ['role', 'user_role', 'type']);
  const tenantKey = firstExisting(columns, [
    'tenant_id',
    'organization_id',
    'org_id',
    'workspace_id',
    'clinic_id'
  ]);
  const emailKey = firstExisting(columns, ['email', 'user_email']);

  if (idKey) {
    actor.userId = row[idKey];
  }

  if (!actor.role || actor.role === 'guest') {
    actor.role = normalizeRole(roleKey ? row[roleKey] : actor.role);
  }

  if (!actor.tenantId && tenantKey) {
    actor.tenantId = row[tenantKey];
  }

  if (!actor.email && emailKey) {
    actor.email = row[emailKey];
  }

  return actor;
}

async function loadTenantRecord(tenantId) {
  const tableSet = await listTables();
  const tenantTable = pickTable(tableSet, TABLE_GROUPS.tenant);

  if (!tenantTable || !tenantId) {
    return {
      ok: false,
      table: tenantTable,
      reason: !tenantId ? 'tenant_id_missing' : 'tenant_table_missing',
      row: null,
      columns: new Set()
    };
  }

  const columns = await getColumns(tenantTable);
  const tenantKey = firstExisting(columns, ['id', 'tenant_id', 'organization_id']);

  if (!tenantKey) {
    return {
      ok: false,
      table: tenantTable,
      reason: 'tenant_primary_key_not_found',
      row: null,
      columns
    };
  }

  const result = await query(
    `SELECT * FROM "${tenantTable}" WHERE "${tenantKey}" = $1 LIMIT 1`,
    [tenantId]
  );

  return {
    ok: true,
    table: tenantTable,
    reason: null,
    row: result.rows[0] || null,
    columns
  };
}

function evaluateTenantRecord(record) {
  if (!record.ok) {
    return {
      active: false,
      reason: record.reason,
      table: record.table || null,
      status: null
    };
  }

  if (!record.row) {
    return {
      active: false,
      reason: 'tenant_not_found',
      table: record.table,
      status: null
    };
  }

  const columns = record.columns;
  const row = record.row;

  const statusCol = firstExisting(columns, [
    'status',
    'subscription_status',
    'billing_status',
    'plan_status'
  ]);

  const activeCol = firstExisting(columns, ['is_active', 'active']);
  const suspendedCol = firstExisting(columns, ['is_suspended', 'suspended']);

  const status = normalizeStatus(statusCol ? row[statusCol] : 'active');
  const isActive = normalizeBoolean(activeCol ? row[activeCol] : true, true);
  const isSuspended = normalizeBoolean(suspendedCol ? row[suspendedCol] : false, false);

  const billingOk = !status || ['active', 'trial', 'grace'].includes(status);
  const active = isActive && !isSuspended && billingOk;

  return {
    active,
    reason: active ? 'tenant_active' : `tenant_${status || 'inactive'}`,
    table: record.table,
    status
  };
}

async function loadDoctorSubscription(userId, tenantId) {
  const tableSet = await listTables();
  const subTable = pickTable(tableSet, TABLE_GROUPS.doctorSubscriptions);

  if (!subTable) {
    return {
      ok: false,
      table: null,
      reason: 'doctor_subscriptions_table_missing',
      row: null,
      columns: new Set()
    };
  }

  const columns = await getColumns(subTable);
  const doctorKey = firstExisting(columns, ['doctor_user_id', 'doctor_id', 'user_id']);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const statusKey = firstExisting(columns, ['status', 'subscription_status']);
  const endsAtKey = firstExisting(columns, ['ends_at', 'end_date', 'expires_at']);

  if (!doctorKey || userId === null || typeof userId === 'undefined' || String(userId).trim() === '') {
    return {
      ok: false,
      table: subTable,
      reason: 'doctor_user_id_missing',
      row: null,
      columns
    };
  }

  const doctorValue = Number.isInteger(Number(userId)) ? Number(userId) : userId;
  const whereParts = [`"${doctorKey}" = $1`];
  const params = [doctorValue];

  if (tenantKey && tenantId) {
    params.push(tenantId);
    whereParts.push(`"${tenantKey}" = $${params.length}`);
  }

  const orderBy = endsAtKey
    ? `"${endsAtKey}" DESC NULLS LAST`
    : statusKey
      ? `"${statusKey}" ASC`
      : '1';

  const result = await query(
    `
      SELECT *
      FROM "${subTable}"
      WHERE ${whereParts.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT 1
    `,
    params
  );

  return {
    ok: true,
    table: subTable,
    reason: null,
    row: result.rows[0] || null,
    columns
  };
}

function evaluateDoctorSubscription(record) {
  if (!record.ok) {
    return {
      active: false,
      reason: record.reason,
      table: record.table || null,
      status: null,
      endsAt: null
    };
  }

  if (!record.row) {
    return {
      active: false,
      reason: 'doctor_subscription_not_found',
      table: record.table,
      status: null,
      endsAt: null
    };
  }

  const columns = record.columns;
  const row = record.row;

  const statusKey = firstExisting(columns, ['status', 'subscription_status']);
  const endsAtKey = firstExisting(columns, ['ends_at', 'end_date', 'expires_at']);
  const activeFlagKey = firstExisting(columns, ['is_active', 'active']);

  const status = normalizeStatus(statusKey ? row[statusKey] : 'active');
  const flagActive = normalizeBoolean(activeFlagKey ? row[activeFlagKey] : true, true);
  const endsAt = endsAtKey && row[endsAtKey] ? new Date(row[endsAtKey]) : null;
  const notExpired = !endsAt || endsAt.getTime() >= Date.now();

  const statusOk = !status || ['active', 'trial', 'grace'].includes(status);
  const active = flagActive && statusOk && notExpired;

  return {
    active,
    reason: active ? 'doctor_subscription_active' : 'doctor_subscription_inactive',
    table: record.table,
    status,
    endsAt: endsAt ? endsAt.toISOString() : null
  };
}

async function getSubscriptionSnapshot(req) {
  const rawActor = extractRawActor(req);
  const actor = await hydrateActor(rawActor);

  const tenantRecord = await loadTenantRecord(actor.tenantId);
  const tenant = evaluateTenantRecord(tenantRecord);

  let doctor = {
    active: true,
    reason: 'not_required',
    table: null,
    status: null,
    endsAt: null
  };

  if (actor.role === 'doctor') {
    const doctorRecord = await loadDoctorSubscription(actor.userId, actor.tenantId);
    doctor = evaluateDoctorSubscription(doctorRecord);
  }

  return {
    actor,
    tenant,
    doctor,
    access: {
      tenantAllowed: tenant.active,
      doctorAllowed: actor.role === 'doctor' ? doctor.active : true
    }
  };
}

async function evaluateAccess(req, options = {}) {
  const { requireDoctorActive = false, allowAdminBypass = true } = options;
  const snapshot = await getSubscriptionSnapshot(req);
  const role = normalizeRole(snapshot.actor.role);

  const adminRoles = new Set([
    'super_admin',
    'admin',
    'owner',
    'administrator',
    'tenant_admin',
    'org_admin'
  ]);

  if (allowAdminBypass && adminRoles.has(role)) {
    return {
      allowed: true,
      code: 'admin_bypass',
      httpStatus: 200,
      snapshot
    };
  }

  if (!snapshot.tenant.active) {
    return {
      allowed: false,
      code: 'tenant_inactive',
      httpStatus: 402,
      snapshot
    };
  }

  if (requireDoctorActive && role === 'doctor' && !snapshot.doctor.active) {
    return {
      allowed: false,
      code: 'doctor_subscription_inactive',
      httpStatus: 402,
      snapshot
    };
  }

  return {
    allowed: true,
    code: 'access_granted',
    httpStatus: 200,
    snapshot
  };
}

module.exports = {
  evaluateAccess,
  extractRawActor,
  firstExisting,
  getColumns,
  getSubscriptionSnapshot,
  hydrateActor,
  loadDoctorSubscription,
  loadTenantRecord,
  loadUserRecord,
  normalizeBoolean,
  normalizeRole,
  normalizeStatus
};