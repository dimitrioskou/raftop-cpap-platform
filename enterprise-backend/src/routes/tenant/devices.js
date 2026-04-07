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

  throw new Error('Could not resolve database client in tenant devices route.');
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

async function resolveDevicesTable() {
  const result = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  const names = new Set(result.rows.map((row) => row.table_name));

  for (const candidate of ['devices']) {
    if (names.has(candidate)) {
      return candidate;
    }
  }

  throw new Error('Devices table not found.');
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

function normalizeDevice(row, columns) {
  if (!row) {
    return null;
  }

  const col = (names) => firstExisting(columns, names);

  const idKey = col(['id', 'device_id']);
  const tenantKey = col(['tenant_id', 'organization_id']);
  const patientKey = col(['patient_id']);
  const doctorKey = col(['doctor_id', 'doctor_user_id']);
  const serialKey = col(['serial_number', 'device_serial']);
  const deviceSerialKey = col(['device_serial', 'serial_number']);
  const brandKey = col(['brand', 'manufacturer']);
  const manufacturerKey = col(['manufacturer', 'brand']);
  const modelKey = col(['model', 'device_model']);
  const statusKey = col(['status']);
  const activeKey = col(['is_active', 'active']);
  const lastSyncKey = col(['last_sync_at', 'updated_at']);
  const createdAtKey = col(['created_at']);
  const updatedAtKey = col(['updated_at']);

  const realId = idKey ? row[idKey] : null;
  const serial = serialKey ? row[serialKey] : null;
  const deviceSerial = deviceSerialKey ? row[deviceSerialKey] : null;

  return {
    id: realId,
    deviceId: realId,
    publicId: serial || deviceSerial || (realId !== null ? String(realId) : null),
    tenantId: tenantKey ? row[tenantKey] : null,
    patientId: patientKey ? row[patientKey] : null,
    doctorId: doctorKey ? row[doctorKey] : null,
    serialNumber: serial,
    deviceSerial,
    brand: brandKey ? row[brandKey] : null,
    manufacturer: manufacturerKey ? row[manufacturerKey] : null,
    model: modelKey ? row[modelKey] : null,
    status: statusKey ? row[statusKey] : null,
    isActive: activeKey ? row[activeKey] : true,
    lastSyncAt: lastSyncKey ? row[lastSyncKey] : null,
    createdAt: createdAtKey ? row[createdAtKey] : null,
    updatedAt: updatedAtKey ? row[updatedAtKey] : null,
    raw: row
  };
}

async function listTenantDevices(actor) {
  const tableName = await resolveDevicesTable();
  const columns = await getColumns(tableName);

  const tenantFilter = buildTenantFilter(columns, actor);
  const orderKey =
    firstExisting(columns, ['updated_at', 'created_at', 'id', 'device_id']) || 'id';

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

async function findDeviceByLookup(actor, lookupValue) {
  const tableName = await resolveDevicesTable();
  const columns = await getColumns(tableName);

  const idKey = firstExisting(columns, ['id', 'device_id']);
  const idMeta = getColumnMeta(columns, ['id', 'device_id']);
  const serialKey = firstExisting(columns, ['serial_number']);
  const deviceSerialKey = firstExisting(columns, ['device_serial']);
  const modelKey = firstExisting(columns, ['model', 'device_model']);
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

  if (serialKey) {
    params.push(lookup);
    searchParts.push(`"${serialKey}" = $${params.length}`);
  }

  if (deviceSerialKey && deviceSerialKey !== serialKey) {
    params.push(lookup);
    searchParts.push(`"${deviceSerialKey}" = $${params.length}`);
  }

  if (modelKey) {
    params.push(lookup);
    searchParts.push(`"${modelKey}" = $${params.length}`);
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

function getPlaceholderDeviceIndex(value) {
  const normalized = String(value || '').trim().toUpperCase();
  const match = normalized.match(/^DEVICE[-_](\d+)$/);

  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 1) {
    return null;
  }

  return index;
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
    const listed = await listTenantDevices(actor);

    const devices = listed.rows.map((row, index) => {
      const normalized = normalizeDevice(row, listed.columns);

      return {
        ...normalized,
        placeholderId: `DEVICE-${index + 1}`
      };
    });

    return res.status(200).json({
      ok: true,
      devices,
      total: devices.length,
      meta: {
        table: listed.tableName,
        tenantId: actor.tenantId || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load devices.'
    });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    const actor = extractActor(req);
    const requestedId = String(req.params.deviceId || '').trim();

    let found = await findDeviceByLookup(actor, requestedId);
    let fallbackMatched = false;

    const placeholderIndex = getPlaceholderDeviceIndex(requestedId);

    if (!found.row && placeholderIndex !== null) {
      const listed = await listTenantDevices(actor);
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
        message: 'Device not found'
      });
    }

    return res.status(200).json({
      ok: true,
      device: {
        ...normalizeDevice(found.row, found.columns),
        placeholderId:
          placeholderIndex !== null ? `DEVICE-${placeholderIndex}` : null
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
      message: error.message || 'Failed to load device.'
    });
  }
});

module.exports = router;