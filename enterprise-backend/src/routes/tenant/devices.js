const express = require('express');
const router = express.Router();
const db = require('../../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting,
  textExpr
} = require('../../utils/routeDbHelpers');

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();

  if (!raw) return 'pending';
  if (['active', 'offline', 'pending', 'inactive', 'replaced'].includes(raw)) {
    return raw;
  }

  if (raw.includes('offline')) return 'offline';
  if (raw.includes('active')) return 'active';
  if (raw.includes('replace')) return 'replaced';
  if (raw.includes('inactive')) return 'inactive';

  return 'pending';
}

function buildReadOrder(columns) {
  const updatedAtColumn = firstExisting(columns, ['updated_at', 'last_sync_at', 'created_at']);
  const idColumn = firstExisting(columns, ['id', 'device_id']);

  if (updatedAtColumn) return `d.${q(updatedAtColumn)} DESC NULLS LAST`;
  if (idColumn) return `d.${q(idColumn)} DESC`;

  return '1 DESC';
}

function pushIfColumnExists(payload, columns, candidates, value) {
  const column = firstExisting(columns, candidates);
  if (!column) return null;
  if (typeof value === 'undefined') return null;

  payload.push({ column, value });
  return column;
}

async function resolveLinkedId(tableName, rawId, idCandidates) {
  if (!rawId) return null;

  const exists = await tableExists(db, tableName);
  if (!exists) return null;

  const columns = await getColumns(db, tableName);
  const pkColumn = firstExisting(columns, idCandidates);

  if (!pkColumn) return null;

  const check = await querySafe(
    db,
    `SELECT 1 FROM ${tableName} t WHERE t.${q(pkColumn)}::text = $1 LIMIT 1`,
    [rawId]
  );

  if (check.error || !check.rows?.length) return null;

  return rawId;
}

async function readDevices() {
  const exists = await tableExists(db, 'devices');

  if (!exists) {
    return {
      devices: [],
      totalDevices: 0,
      debug: 'devices_table_missing'
    };
  }

  const columns = await getColumns(db, 'devices');

  const idColumn = firstExisting(columns, ['id', 'device_id']);
  const serialColumn = firstExisting(columns, ['device_serial', 'serial_number', 'cpap_serial', 'serial']);
  const brandColumn = firstExisting(columns, ['device_brand', 'brand', 'manufacturer']);
  const modelColumn = firstExisting(columns, ['model', 'device_model']);
  const patientIdColumn = firstExisting(columns, ['patient_id']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const statusColumn = firstExisting(columns, ['status', 'device_status']);
  const lastSyncColumn = firstExisting(columns, ['last_sync_at', 'last_sync', 'updated_at']);
  const notesColumn = firstExisting(columns, ['notes', 'device_notes', 'comment']);
  const tenantIdColumn = firstExisting(columns, ['tenant_id']);
  const createdAtColumn = firstExisting(columns, ['created_at']);
  const updatedAtColumn = firstExisting(columns, ['updated_at']);

  const sql = `
    SELECT
      ${textExpr('d', idColumn, 'id')},
      ${textExpr('d', serialColumn, 'device_serial')},
      ${textExpr('d', brandColumn, 'device_brand')},
      ${textExpr('d', modelColumn, 'model')},
      ${textExpr('d', patientIdColumn, 'patient_id')},
      ${textExpr('d', patientNameColumn, 'patient_name')},
      ${textExpr('d', doctorIdColumn, 'doctor_id')},
      ${textExpr('d', doctorNameColumn, 'doctor_name')},
      ${textExpr('d', statusColumn, 'status')},
      ${textExpr('d', lastSyncColumn, 'last_sync_at')},
      ${textExpr('d', notesColumn, 'notes')},
      ${textExpr('d', tenantIdColumn, 'tenant_id')},
      ${textExpr('d', createdAtColumn, 'created_at')},
      ${textExpr('d', updatedAtColumn, 'updated_at')}
    FROM devices d
    ORDER BY ${buildReadOrder(columns)}
    LIMIT 500
  `;

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      devices: [],
      totalDevices: 0,
      debug: result.error.message
    };
  }

  return {
    devices: result.rows || [],
    totalDevices: result.rows?.length || 0,
    debug: null
  };
}

async function readDeviceById(deviceId) {
  const exists = await tableExists(db, 'devices');

  if (!exists) {
    return {
      device: null,
      debug: 'devices_table_missing'
    };
  }

  const columns = await getColumns(db, 'devices');
  const idColumn = firstExisting(columns, ['id', 'device_id']);

  if (!idColumn) {
    return {
      device: null,
      debug: 'device_id_column_missing'
    };
  }

  const serialColumn = firstExisting(columns, ['device_serial', 'serial_number', 'cpap_serial', 'serial']);
  const brandColumn = firstExisting(columns, ['device_brand', 'brand', 'manufacturer']);
  const modelColumn = firstExisting(columns, ['model', 'device_model']);
  const patientIdColumn = firstExisting(columns, ['patient_id']);
  const patientNameColumn = firstExisting(columns, ['patient_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const statusColumn = firstExisting(columns, ['status', 'device_status']);
  const lastSyncColumn = firstExisting(columns, ['last_sync_at', 'last_sync', 'updated_at']);
  const notesColumn = firstExisting(columns, ['notes', 'device_notes', 'comment']);
  const tenantIdColumn = firstExisting(columns, ['tenant_id']);
  const createdAtColumn = firstExisting(columns, ['created_at']);
  const updatedAtColumn = firstExisting(columns, ['updated_at']);

  const sql = `
    SELECT
      ${textExpr('d', idColumn, 'id')},
      ${textExpr('d', serialColumn, 'device_serial')},
      ${textExpr('d', brandColumn, 'device_brand')},
      ${textExpr('d', modelColumn, 'model')},
      ${textExpr('d', patientIdColumn, 'patient_id')},
      ${textExpr('d', patientNameColumn, 'patient_name')},
      ${textExpr('d', doctorIdColumn, 'doctor_id')},
      ${textExpr('d', doctorNameColumn, 'doctor_name')},
      ${textExpr('d', statusColumn, 'status')},
      ${textExpr('d', lastSyncColumn, 'last_sync_at')},
      ${textExpr('d', notesColumn, 'notes')},
      ${textExpr('d', tenantIdColumn, 'tenant_id')},
      ${textExpr('d', createdAtColumn, 'created_at')},
      ${textExpr('d', updatedAtColumn, 'updated_at')}
    FROM devices d
    WHERE d.${q(idColumn)}::text = $1
    LIMIT 1
  `;

  const result = await querySafe(db, sql, [String(deviceId)]);

  if (result.error) {
    return {
      device: null,
      debug: result.error.message
    };
  }

  return {
    device: result.rows?.[0] || null,
    debug: null
  };
}

router.get('/', async (_req, res) => {
  const data = await readDevices();

  return res.json({
    ok: true,
    devices: data.devices,
    totalDevices: data.totalDevices,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.get('/:id', async (req, res) => {
  const data = await readDeviceById(req.params.id);

  if (!data.device) {
    return res.status(404).json({
      ok: false,
      message: 'Device not found.'
    });
  }

  return res.json({
    ok: true,
    device: data.device,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.post('/', async (req, res) => {
  const exists = await tableExists(db, 'devices');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Devices table is missing.'
    });
  }

  const columns = await getColumns(db, 'devices');

  const deviceSerial = normalizeText(req.body?.device_serial || req.body?.serial_number || req.body?.serial);
  const deviceBrand = normalizeText(req.body?.device_brand || req.body?.brand);
  const model = normalizeText(req.body?.model);
  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName = normalizeText(req.body?.patient_name);
  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName = normalizeText(req.body?.doctor_name);
  const status = normalizeStatus(req.body?.status);
  const lastSyncAt = normalizeDateTime(req.body?.last_sync_at);
  const notes = normalizeText(req.body?.notes);
  const tenantId = normalizeText(req.body?.tenant_id || 'demo-tenant');

  if (!deviceSerial) {
    return res.status(400).json({
      ok: false,
      message: 'Device serial is required.'
    });
  }

  const patientId = await resolveLinkedId('patients', patientIdRaw, ['id', 'patient_id']);
  const doctorId = await resolveLinkedId('doctors', doctorIdRaw, ['id', 'doctor_id']);

  const insertPairs = [];

  pushIfColumnExists(insertPairs, columns, ['device_serial', 'serial_number', 'cpap_serial', 'serial'], deviceSerial);
  pushIfColumnExists(insertPairs, columns, ['device_brand', 'brand', 'manufacturer'], deviceBrand);
  pushIfColumnExists(insertPairs, columns, ['model', 'device_model'], model);
  pushIfColumnExists(insertPairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(insertPairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(insertPairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(insertPairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(insertPairs, columns, ['status', 'device_status'], status);
  pushIfColumnExists(insertPairs, columns, ['last_sync_at', 'last_sync'], lastSyncAt);
  pushIfColumnExists(insertPairs, columns, ['notes', 'device_notes', 'comment'], notes);
  pushIfColumnExists(insertPairs, columns, ['tenant_id'], tenantId);
  pushIfColumnExists(insertPairs, columns, ['created_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, ['updated_at'], new Date().toISOString());

  if (!insertPairs.length) {
    return res.status(500).json({
      ok: false,
      message: 'No compatible device columns were found for insert.'
    });
  }

  const insertColumns = insertPairs.map((entry) => q(entry.column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map((entry) => entry.value);

  const returningIdColumn = firstExisting(columns, ['id', 'device_id']);

  const sql = `
    INSERT INTO devices (${insertColumns})
    VALUES (${placeholders})
    ${returningIdColumn ? `RETURNING ${q(returningIdColumn)}::text AS id` : ''}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to create device.'
    });
  }

  return res.status(201).json({
    ok: true,
    message: 'Device created successfully.',
    device: {
      id: result.rows?.[0]?.id || null,
      device_serial: deviceSerial,
      device_brand: deviceBrand,
      model,
      patient_id: patientId,
      patient_name: patientName,
      doctor_id: doctorId,
      doctor_name: doctorName,
      status,
      last_sync_at: lastSyncAt,
      notes,
      tenant_id: tenantId
    }
  });
});

router.put('/:id', async (req, res) => {
  const exists = await tableExists(db, 'devices');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Devices table is missing.'
    });
  }

  const columns = await getColumns(db, 'devices');
  const idColumn = firstExisting(columns, ['id', 'device_id']);

  if (!idColumn) {
    return res.status(500).json({
      ok: false,
      message: 'Device ID column is missing.'
    });
  }

  const existing = await querySafe(
    db,
    `SELECT 1 FROM devices d WHERE d.${q(idColumn)}::text = $1 LIMIT 1`,
    [String(req.params.id)]
  );

  if (existing.error || !existing.rows?.length) {
    return res.status(404).json({
      ok: false,
      message: 'Device not found.'
    });
  }

  const deviceSerial = normalizeText(req.body?.device_serial || req.body?.serial_number || req.body?.serial);
  const deviceBrand = normalizeText(req.body?.device_brand || req.body?.brand);
  const model = normalizeText(req.body?.model);
  const patientIdRaw = normalizeText(req.body?.patient_id);
  const patientName = normalizeText(req.body?.patient_name);
  const doctorIdRaw = normalizeText(req.body?.doctor_id);
  const doctorName = normalizeText(req.body?.doctor_name);
  const status =
    typeof req.body?.status !== 'undefined' ? normalizeStatus(req.body?.status) : undefined;
  const lastSyncAt =
    typeof req.body?.last_sync_at !== 'undefined'
      ? normalizeDateTime(req.body?.last_sync_at)
      : undefined;
  const notes = typeof req.body?.notes !== 'undefined' ? normalizeText(req.body?.notes) : undefined;

  const patientId =
    typeof req.body?.patient_id !== 'undefined'
      ? await resolveLinkedId('patients', patientIdRaw, ['id', 'patient_id'])
      : undefined;

  const doctorId =
    typeof req.body?.doctor_id !== 'undefined'
      ? await resolveLinkedId('doctors', doctorIdRaw, ['id', 'doctor_id'])
      : undefined;

  const updatePairs = [];

  pushIfColumnExists(updatePairs, columns, ['device_serial', 'serial_number', 'cpap_serial', 'serial'], deviceSerial);
  pushIfColumnExists(updatePairs, columns, ['device_brand', 'brand', 'manufacturer'], deviceBrand);
  pushIfColumnExists(updatePairs, columns, ['model', 'device_model'], model);
  pushIfColumnExists(updatePairs, columns, ['patient_id'], patientId);
  pushIfColumnExists(updatePairs, columns, ['patient_name'], patientName);
  pushIfColumnExists(updatePairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(updatePairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(updatePairs, columns, ['status', 'device_status'], status);
  pushIfColumnExists(updatePairs, columns, ['last_sync_at', 'last_sync'], lastSyncAt);
  pushIfColumnExists(updatePairs, columns, ['notes', 'device_notes', 'comment'], notes);
  pushIfColumnExists(updatePairs, columns, ['updated_at'], new Date().toISOString());

  if (!updatePairs.length) {
    return res.status(400).json({
      ok: false,
      message: 'No valid device fields were provided for update.'
    });
  }

  const assignments = updatePairs
    .map((entry, index) => `${q(entry.column)} = $${index + 1}`)
    .join(', ');

  const values = updatePairs.map((entry) => entry.value);
  values.push(String(req.params.id));

  const sql = `
    UPDATE devices
    SET ${assignments}
    WHERE ${q(idColumn)}::text = $${values.length}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to update device.'
    });
  }

  return res.json({
    ok: true,
    message: 'Device updated successfully.'
  });
});

module.exports = router;