const express = require('express');
const path = require('path');

try {
  require('dotenv').config({
    path: path.resolve(__dirname, '../../../.env')
  });
} catch (_error) {
  // ignore dotenv load failures
}

const router = express.Router();

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../../../db',
    '../../../config/db'
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

  throw new Error('Could not resolve database client in tenant patients route.');
}

const db = resolveDb();

async function getColumns(tableName) {
  const result = await db.query(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows;
}

function firstExisting(columns, names) {
  const set = new Set(columns.map((col) => col.column_name));
  for (const name of names) {
    if (set.has(name)) {
      return name;
    }
  }
  return null;
}

function getColumnMeta(columns, names) {
  for (const name of names) {
    const found = columns.find((col) => col.column_name === name);
    if (found) {
      return found;
    }
  }
  return null;
}

function isIntegerLikeColumn(meta) {
  if (!meta) {
    return false;
  }

  return ['int2', 'int4', 'int8'].includes(meta.udt_name) ||
    ['smallint', 'integer', 'bigint'].includes(meta.data_type);
}

async function resolvePatientsTable() {
  const result = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const names = new Set(result.rows.map((row) => row.table_name));

  for (const candidate of ['patients']) {
    if (names.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Patients table not found.');
}

function extractActor(req) {
  const user = req.user || {};

  return {
    userId: user.id || user.userId || user.user_id || null,
    tenantId:
      user.tenantId ||
      user.tenant_id ||
      user.organizationId ||
      user.organization_id ||
      null,
    role: String(user.role || user.userRole || user.user_role || 'guest').toLowerCase()
  };
}

function buildTenantFilter(columns, actor, startingParamIndex = 1) {
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);
  const tenantValue = actor.tenantId || null;

  if (!tenantKey || !tenantValue) {
    return {
      clause: '',
      params: []
    };
  }

  return {
    clause: ` WHERE "${tenantKey}" = $${startingParamIndex} `,
    params: [tenantValue]
  };
}

function normalizePatient(row, columns) {
  if (!row) {
    return null;
  }

  const col = (names) => firstExisting(columns, names);

  const idKey = col(['id', 'patient_id']);
  const tenantKey = col(['tenant_id', 'organization_id']);
  const doctorKey = col(['doctor_id', 'doctor_user_id']);
  const firstNameKey = col(['first_name']);
  const lastNameKey = col(['last_name']);
  const fullNameKey = col(['full_name', 'name']);
  const emailKey = col(['email']);
  const phoneKey = col(['phone', 'mobile']);
  const statusKey = col(['status']);
  const createdAtKey = col(['created_at']);
  const updatedAtKey = col(['updated_at']);

  const id = idKey ? row[idKey] : null;
  const fullName =
    (fullNameKey ? row[fullNameKey] : null) ||
    [firstNameKey ? row[firstNameKey] : null, lastNameKey ? row[lastNameKey] : null]
      .filter(Boolean)
      .join(' ') ||
    null;

  return {
    id,
    patientId: id,
    publicId: id !== null && typeof id !== 'undefined' ? `PATIENT-${id}` : null,
    tenantId: tenantKey ? row[tenantKey] : null,
    doctorId: doctorKey ? row[doctorKey] : null,
    firstName: firstNameKey ? row[firstNameKey] : null,
    lastName: lastNameKey ? row[lastNameKey] : null,
    fullName,
    name: fullName,
    email: emailKey ? row[emailKey] : null,
    phone: phoneKey ? row[phoneKey] : null,
    status: statusKey ? row[statusKey] : null,
    createdAt: createdAtKey ? row[createdAtKey] : null,
    updatedAt: updatedAtKey ? row[updatedAtKey] : null,
    raw: row
  };
}

async function listTenantPatients(actor) {
  const tableName = await resolvePatientsTable();
  const columns = await getColumns(tableName);

  const tenantFilter = buildTenantFilter(columns, actor);
  const orderKey =
    firstExisting(columns, ['updated_at', 'created_at', 'id', 'patient_id']) || 'id';

  const result = await db.query(
    `
      SELECT *
      FROM "${tableName}"
      ${tenantFilter.clause}
      ORDER BY "${orderKey}" DESC NULLS LAST
      LIMIT 500
    `,
    tenantFilter.params
  );

  return {
    tableName,
    columns,
    rows: result.rows || []
  };
}

async function findPatientByLookup(actor, lookupValue) {
  const tableName = await resolvePatientsTable();
  const columns = await getColumns(tableName);

  const idKey = firstExisting(columns, ['id', 'patient_id']);
  const idMeta = getColumnMeta(columns, ['id', 'patient_id']);
  const emailKey = firstExisting(columns, ['email']);
  const fullNameKey = firstExisting(columns, ['full_name', 'name']);
  const tenantKey = firstExisting(columns, ['tenant_id', 'organization_id']);

  const params = [];
  const tenantParts = [];

  if (tenantKey && actor.tenantId) {
    params.push(actor.tenantId);
    tenantParts.push(`"${tenantKey}" = $${params.length}`);
  }

  const lookup = String(lookupValue || '').trim();
  const searchParts = [];

  if (idKey) {
    if (isIntegerLikeColumn(idMeta)) {
      if (Number.isInteger(Number(lookup))) {
        params.push(Number(lookup));
        searchParts.push(`"${idKey}" = $${params.length}`);
      }
    } else {
      params.push(lookup);
      searchParts.push(`"${idKey}" = $${params.length}`);
    }
  }

  if (emailKey) {
    params.push(lookup);
    searchParts.push(`"${emailKey}" = $${params.length}`);
  }

  if (fullNameKey) {
    params.push(lookup);
    searchParts.push(`"${fullNameKey}" = $${params.length}`);
  }

  if (!searchParts.length) {
    return {
      tableName,
      columns,
      row: null
    };
  }

  const result = await db.query(
    `
      SELECT *
      FROM "${tableName}"
      WHERE
        ${tenantParts.length ? `${tenantParts.join(' AND ')} AND ` : ''}
        (${searchParts.join(' OR ')})
      LIMIT 1
    `,
    params
  );

  return {
    tableName,
    columns,
    row: result.rows[0] || null
  };
}

function getPlaceholderPatientIndex(value) {
  const normalized = String(value || '').trim().toUpperCase();

  let match = normalized.match(/^PATIENT[-_](\d+)$/);
  if (match) {
    const index = Number(match[1]);
    return Number.isInteger(index) && index > 0 ? index : null;
  }

  match = normalized.match(/^(\d+)$/);
  if (match) {
    const index = Number(match[1]);
    return Number.isInteger(index) && index > 0 ? index : null;
  }

  return null;
}

function pickPlaceholderMappedRow(rows, placeholderIndex) {
  if (!Array.isArray(rows) || !rows.length) {
    return null;
  }

  if (!placeholderIndex) {
    return rows[0];
  }

  const zeroBased = placeholderIndex - 1;

  if (rows[zeroBased]) {
    return rows[zeroBased];
  }

  return rows[0];
}

router.get('/', async (req, res) => {
  try {
    const actor = extractActor(req);
    const listed = await listTenantPatients(actor);

    const patients = listed.rows.map((row, index) => {
      const normalized = normalizePatient(row, listed.columns);

      return {
        ...normalized,
        placeholderId: `PATIENT-${index + 1}`
      };
    });

    return res.status(200).json({
      ok: true,
      patients,
      total: patients.length,
      meta: {
        table: listed.tableName,
        tenantId: actor.tenantId || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patients.'
    });
  }
});

router.get('/:patientId', async (req, res) => {
  try {
    const actor = extractActor(req);
    const requestedId = String(req.params.patientId || '').trim();

    let found = await findPatientByLookup(actor, requestedId);
    let fallbackMatched = false;

    const placeholderIndex = getPlaceholderPatientIndex(requestedId);

    if (!found.row && placeholderIndex !== null) {
      const listed = await listTenantPatients(actor);
      const matchedRow = pickPlaceholderMappedRow(listed.rows, placeholderIndex);

      found = {
        tableName: listed.tableName,
        columns: listed.columns,
        row: matchedRow
      };

      fallbackMatched = Boolean(matchedRow);
    }

    if (!found.row) {
      return res.status(404).json({
        ok: false,
        message: 'Patient not found'
      });
    }

    return res.status(200).json({
      ok: true,
      patient: {
        ...normalizePatient(found.row, found.columns),
        placeholderId:
          placeholderIndex !== null ? `PATIENT-${placeholderIndex}` : null
      },
      meta: {
        requestedId,
        table: found.tableName,
        fallbackMatched
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patient.'
    });
  }
});

module.exports = router;