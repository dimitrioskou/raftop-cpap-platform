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

function normalizeNumber(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['true', '1', 'yes', 'y', 'active', 'enabled', 'on'].includes(raw)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'disabled', 'off'].includes(raw)) return false;
  return null;
}

function normalizeDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function deriveComplianceStatus(monthlyHours, monitoringActive, paymentStatus) {
  const active = normalizeBoolean(monitoringActive);
  const payment = String(paymentStatus || '').trim().toLowerCase();

  if (active === false) return 'inactive';
  if (payment && !['paid', 'active'].includes(payment)) return 'inactive';

  const hours = Number(monthlyHours || 0);

  if (!hours) return 'no_data';
  if (hours >= 80) return 'ok';
  if (hours >= 50) return 'warning';
  return 'critical';
}

function buildReadOrder(columns) {
  const createdAtColumn = firstExisting(columns, ['updated_at', 'created_at', 'last_sync_at']);
  const idColumn = firstExisting(columns, ['id', 'patient_id']);

  if (createdAtColumn) {
    return `p.${q(createdAtColumn)} DESC NULLS LAST`;
  }

  if (idColumn) {
    return `p.${q(idColumn)} DESC`;
  }

  return '1 DESC';
}

async function readPatients() {
  const exists = await tableExists(db, 'patients');

  if (!exists) {
    return {
      patients: [],
      totalPatients: 0,
      debug: 'patients_table_missing'
    };
  }

  const columns = await getColumns(db, 'patients');

  const idColumn = firstExisting(columns, ['id', 'patient_id']);
  const nameColumn = firstExisting(columns, ['full_name', 'name', 'fullname']);
  const phoneColumn = firstExisting(columns, ['phone', 'mobile', 'mobile_phone', 'phone_number']);
  const emailColumn = firstExisting(columns, ['email']);
  const doctorNameColumn = firstExisting(columns, ['doctor_name']);
  const doctorIdColumn = firstExisting(columns, ['doctor_id']);
  const patientCodeColumn = firstExisting(columns, ['patient_code', 'code', 'external_id']);
  const deviceSerialColumn = firstExisting(columns, ['device_serial', 'serial_number', 'cpap_serial']);
  const deviceBrandColumn = firstExisting(columns, ['device_brand', 'brand']);
  const therapyStartColumn = firstExisting(columns, ['therapy_start_date', 'start_date']);
  const monthlyHoursColumn = firstExisting(columns, [
    'monthly_usage_hours',
    'cpap_hours',
    'usage_hours',
    'compliance_hours'
  ]);
  const ahiColumn = firstExisting(columns, ['ahi', 'avg_ahi', 'average_ahi']);
  const lastSyncColumn = firstExisting(columns, ['last_sync_at', 'last_sync', 'updated_at']);
  const packageTypeColumn = firstExisting(columns, ['package_type', 'package_plan', 'monitoring_package']);
  const paymentStatusColumn = firstExisting(columns, ['payment_status']);
  const packageStartColumn = firstExisting(columns, ['package_start_date']);
  const packageEndColumn = firstExisting(columns, ['package_end_date']);
  const monitoringActiveColumn = firstExisting(columns, ['monitoring_active', 'monitoring_enabled']);
  const notificationsActiveColumn = firstExisting(columns, ['notifications_active']);
  const followupActiveColumn = firstExisting(columns, ['followup_active']);
  const consentColumn = firstExisting(columns, ['consent_contact', 'contact_consent']);
  const complianceStatusColumn = firstExisting(columns, ['compliance_status', 'status']);

  const sql = `
    SELECT
      ${textExpr('p', idColumn, 'id')},
      ${textExpr('p', nameColumn, 'patient_name')},
      ${textExpr('p', phoneColumn, 'phone')},
      ${textExpr('p', emailColumn, 'email')},
      ${textExpr('p', doctorNameColumn, 'doctor_name')},
      ${textExpr('p', doctorIdColumn, 'doctor_id')},
      ${textExpr('p', patientCodeColumn, 'patient_code')},
      ${textExpr('p', deviceSerialColumn, 'device_serial')},
      ${textExpr('p', deviceBrandColumn, 'device_brand')},
      ${textExpr('p', therapyStartColumn, 'therapy_start_date')},
      ${textExpr('p', monthlyHoursColumn, 'monthly_usage_hours')},
      ${textExpr('p', ahiColumn, 'ahi')},
      ${textExpr('p', lastSyncColumn, 'last_sync_at')},
      ${textExpr('p', packageTypeColumn, 'package_type')},
      ${textExpr('p', paymentStatusColumn, 'payment_status')},
      ${textExpr('p', packageStartColumn, 'package_start_date')},
      ${textExpr('p', packageEndColumn, 'package_end_date')},
      ${textExpr('p', monitoringActiveColumn, 'monitoring_active')},
      ${textExpr('p', notificationsActiveColumn, 'notifications_active')},
      ${textExpr('p', followupActiveColumn, 'followup_active')},
      ${textExpr('p', consentColumn, 'consent_contact')},
      ${textExpr('p', complianceStatusColumn, 'compliance_status')}
    FROM patients p
    ORDER BY ${buildReadOrder(columns)}
    LIMIT 500
  `;

  const result = await querySafe(db, sql);

  if (result.error) {
    return {
      patients: [],
      totalPatients: 0,
      debug: result.error.message
    };
  }

  return {
    patients: result.rows || [],
    totalPatients: result.rows?.length || 0,
    debug: null
  };
}

function pushIfColumnExists(payload, columns, candidates, value) {
  const column = firstExisting(columns, candidates);
  if (!column) return null;
  if (typeof value === 'undefined') return null;
  payload.push({ column, value });
  return column;
}

router.get('/', async (_req, res) => {
  const data = await readPatients();

  return res.json({
    ok: true,
    patients: data.patients,
    totalPatients: data.totalPatients,
    timestamp: new Date().toISOString(),
    debug: data.debug || null
  });
});

router.post('/', async (req, res) => {
  const exists = await tableExists(db, 'patients');

  if (!exists) {
    return res.status(500).json({
      ok: false,
      message: 'Patients table is missing.'
    });
  }

  const columns = await getColumns(db, 'patients');

  const fullName = normalizeText(req.body?.full_name || req.body?.patient_name || req.body?.name);
  const phone = normalizeText(req.body?.phone || req.body?.mobile);
  const email = normalizeText(req.body?.email);
  const doctorName = normalizeText(req.body?.doctor_name);
  const doctorId = normalizeText(req.body?.doctor_id);
  const patientCode = normalizeText(req.body?.patient_code);
  const deviceSerial = normalizeText(req.body?.device_serial);
  const deviceBrand = normalizeText(req.body?.device_brand);
  const therapyStartDate = normalizeDateTime(req.body?.therapy_start_date);
  const monthlyUsageHours = normalizeNumber(req.body?.monthly_usage_hours);
  const ahi = normalizeNumber(req.body?.ahi);
  const lastSyncAt = normalizeDateTime(req.body?.last_sync_at);
  const packageType = normalizeText(req.body?.package_type);
  const paymentStatus = normalizeText(req.body?.payment_status || 'pending');
  const packageStartDate = normalizeDateTime(req.body?.package_start_date);
  const packageEndDate = normalizeDateTime(req.body?.package_end_date);
  const monitoringActive = normalizeBoolean(req.body?.monitoring_active);
  const notificationsActive = normalizeBoolean(req.body?.notifications_active);
  const followupActive = normalizeBoolean(req.body?.followup_active);
  const consentContact = normalizeBoolean(req.body?.consent_contact);

  if (!fullName) {
    return res.status(400).json({
      ok: false,
      message: 'Patient full name is required.'
    });
  }

  const complianceStatus = deriveComplianceStatus(
    monthlyUsageHours,
    monitoringActive,
    paymentStatus
  );

  const insertPairs = [];

  pushIfColumnExists(insertPairs, columns, ['full_name', 'name', 'fullname'], fullName);
  pushIfColumnExists(insertPairs, columns, ['phone', 'mobile', 'mobile_phone', 'phone_number'], phone);
  pushIfColumnExists(insertPairs, columns, ['email'], email);
  pushIfColumnExists(insertPairs, columns, ['doctor_name'], doctorName);
  pushIfColumnExists(insertPairs, columns, ['doctor_id'], doctorId);
  pushIfColumnExists(insertPairs, columns, ['patient_code', 'code', 'external_id'], patientCode);
  pushIfColumnExists(insertPairs, columns, ['device_serial', 'serial_number', 'cpap_serial'], deviceSerial);
  pushIfColumnExists(insertPairs, columns, ['device_brand', 'brand'], deviceBrand);
  pushIfColumnExists(insertPairs, columns, ['therapy_start_date', 'start_date'], therapyStartDate);
  pushIfColumnExists(insertPairs, columns, ['monthly_usage_hours', 'cpap_hours', 'usage_hours', 'compliance_hours'], monthlyUsageHours);
  pushIfColumnExists(insertPairs, columns, ['ahi', 'avg_ahi', 'average_ahi'], ahi);
  pushIfColumnExists(insertPairs, columns, ['last_sync_at', 'last_sync'], lastSyncAt);
  pushIfColumnExists(insertPairs, columns, ['package_type', 'package_plan', 'monitoring_package'], packageType);
  pushIfColumnExists(insertPairs, columns, ['payment_status'], paymentStatus);
  pushIfColumnExists(insertPairs, columns, ['package_start_date'], packageStartDate);
  pushIfColumnExists(insertPairs, columns, ['package_end_date'], packageEndDate);
  pushIfColumnExists(insertPairs, columns, ['monitoring_active', 'monitoring_enabled'], monitoringActive);
  pushIfColumnExists(insertPairs, columns, ['notifications_active'], notificationsActive);
  pushIfColumnExists(insertPairs, columns, ['followup_active'], followupActive);
  pushIfColumnExists(insertPairs, columns, ['consent_contact', 'contact_consent'], consentContact);
  pushIfColumnExists(insertPairs, columns, ['compliance_status', 'status'], complianceStatus);
  pushIfColumnExists(insertPairs, columns, ['created_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, ['updated_at'], new Date().toISOString());
  pushIfColumnExists(insertPairs, columns, ['tenant_id'], normalizeText(req.body?.tenant_id || 'demo-tenant'));

  if (!insertPairs.length) {
    return res.status(500).json({
      ok: false,
      message: 'No compatible patient columns were found for insert.'
    });
  }

  const insertColumns = insertPairs.map((entry) => q(entry.column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map((entry) => entry.value);

  const returningIdColumn = firstExisting(columns, ['id', 'patient_id']);

  const sql = `
    INSERT INTO patients (${insertColumns})
    VALUES (${placeholders})
    ${returningIdColumn ? `RETURNING ${q(returningIdColumn)}::text AS id` : ''}
  `;

  const result = await querySafe(db, sql, values);

  if (result.error) {
    return res.status(500).json({
      ok: false,
      message: result.error.message || 'Failed to create patient.'
    });
  }

  return res.status(201).json({
    ok: true,
    message: 'Patient created successfully.',
    patient: {
      id: result.rows?.[0]?.id || null,
      patient_name: fullName,
      phone,
      email,
      doctor_name: doctorName,
      doctor_id: doctorId,
      patient_code: patientCode,
      device_serial: deviceSerial,
      device_brand: deviceBrand,
      therapy_start_date: therapyStartDate,
      monthly_usage_hours: monthlyUsageHours,
      ahi,
      last_sync_at: lastSyncAt,
      package_type: packageType,
      payment_status: paymentStatus,
      package_start_date: packageStartDate,
      package_end_date: packageEndDate,
      monitoring_active: monitoringActive,
      notifications_active: notificationsActive,
      followup_active: followupActive,
      consent_contact: consentContact,
      compliance_status: complianceStatus
    }
  });
});

module.exports = router;