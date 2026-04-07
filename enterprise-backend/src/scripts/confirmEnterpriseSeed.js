const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
} = require('../services/liveVerificationService');

const columnMetaCache = new Map();

async function getColumnMeta(tableName) {
  if (columnMetaCache.has(tableName)) {
    return columnMetaCache.get(tableName);
  }

  const result = await query(
    `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        is_identity
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  columnMetaCache.set(tableName, result.rows);
  return result.rows;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function columnHasDefault(meta) {
  return Boolean(meta.column_default) || String(meta.is_identity || '').toUpperCase() === 'YES';
}

function isNumericType(meta) {
  return ['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(meta.udt_name) ||
    ['smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision'].includes(meta.data_type);
}

function isTextType(meta) {
  return ['text', 'varchar', 'bpchar', 'uuid'].includes(meta.udt_name) ||
    ['text', 'character varying', 'character', 'uuid'].includes(meta.data_type);
}

function isBooleanType(meta) {
  return meta.udt_name === 'bool' || meta.data_type === 'boolean';
}

function isDateLikeType(meta) {
  return ['date', 'timestamp', 'timestamptz'].includes(meta.udt_name) ||
    ['date', 'timestamp without time zone', 'timestamp with time zone'].includes(meta.data_type);
}

async function nextNumericValue(tableName, columnName) {
  const result = await query(
    `SELECT COALESCE(MAX("${columnName}"), 0) + 1 AS next_value FROM "${tableName}"`
  );
  return Number(result.rows[0]?.next_value || 1);
}

async function generateRequiredValue(tableName, meta, currentPayload = {}) {
  const col = meta.column_name;
  const nowIso = new Date().toISOString();

  if (col === 'id') {
    if (meta.udt_name === 'uuid' || meta.data_type === 'uuid') {
      return uuidv4();
    }

    if (isNumericType(meta)) {
      return await nextNumericValue(tableName, col);
    }

    if (isTextType(meta)) {
      return `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }

  if (col.endsWith('_id')) {
    return null;
  }

  if (['created_at', 'updated_at', 'starts_at', 'started_at', 'start_date', 'end_date', 'ends_at', 'expires_at', 'recognized_at', 'paid_at', 'last_sync_at', 'created_on', 'updated_on'].includes(col)) {
    return nowIso;
  }

  if (['is_active', 'active', 'enabled'].includes(col)) {
    return true;
  }

  if (['is_suspended', 'suspended'].includes(col)) {
    return false;
  }

  if (['status', 'subscription_status', 'billing_status', 'plan_status'].includes(col)) {
    return 'active';
  }

  if (col === 'currency') {
    return 'EUR';
  }

  if (col === 'plan_name') {
    return 'premium';
  }

  if (col === 'plan_key') {
    return 'premium';
  }

  if (col === 'role') {
    return currentPayload.email === 'admin@raftop.local' ? 'admin' : 'doctor';
  }

  if (col === 'slug') {
    return `${tableName}-${Date.now()}`;
  }

  if (['code', 'reference', 'external_reference'].includes(col)) {
    return `${tableName.toUpperCase()}-${Date.now()}`;
  }

  if (['name', 'full_name', 'title'].includes(col)) {
    return `${tableName} ${Date.now()}`;
  }

  if (col === 'email') {
    return `${tableName}_${Date.now()}@local.test`;
  }

  if (col === 'phone') {
    return '6900000000';
  }

  if (isBooleanType(meta)) {
    return true;
  }

  if (isDateLikeType(meta)) {
    return nowIso;
  }

  if (isTextType(meta)) {
    return `${col}_${Date.now()}`;
  }

  if (isNumericType(meta)) {
    return 1;
  }

  return null;
}

async function buildInsertPayload(tableName, rawPayload) {
  const meta = await getColumnMeta(tableName);
  const validColumns = new Set(meta.map((c) => c.column_name));
  const payload = {};

  for (const [key, value] of Object.entries(rawPayload)) {
    if (validColumns.has(key) && typeof value !== 'undefined') {
      payload[key] = value;
    }
  }

  for (const col of meta) {
    const hasValue = hasOwn(payload, col.column_name) && payload[col.column_name] !== null;
    const required = col.is_nullable === 'NO' && !columnHasDefault(col);

    if (!hasValue && required) {
      const generated = await generateRequiredValue(tableName, col, payload);
      if (generated !== null) {
        payload[col.column_name] = generated;
      }
    }
  }

  const missingRequired = meta
    .filter((col) => col.is_nullable === 'NO' && !columnHasDefault(col))
    .filter((col) => !hasOwn(payload, col.column_name) || payload[col.column_name] === null)
    .map((col) => col.column_name);

  if (missingRequired.length) {
    throw new Error(`Missing required values for ${tableName}: ${missingRequired.join(', ')}`);
  }

  return payload;
}

async function findExistingRow(tableName, criteria) {
  const meta = await getColumnMeta(tableName);
  const validColumns = new Set(meta.map((c) => c.column_name));

  const pairs = Object.entries(criteria).filter(
    ([key, value]) => validColumns.has(key) && value !== null && typeof value !== 'undefined'
  );

  if (!pairs.length) {
    return null;
  }

  const where = pairs.map(([key], index) => `"${key}" = $${index + 1}`).join(' AND ');
  const values = pairs.map(([, value]) => value);

  const result = await query(`SELECT * FROM "${tableName}" WHERE ${where} LIMIT 1`, values);
  return result.rows[0] || null;
}

async function insertRow(tableName, rawPayload) {
  const payload = await buildInsertPayload(tableName, rawPayload);
  const entries = Object.entries(payload);

  const keys = entries.map(([key]) => `"${key}"`);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const values = entries.map(([, value]) => value);

  const result = await query(
    `
      INSERT INTO "${tableName}" (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `,
    values
  );

  return result.rows[0];
}

async function insertOrFind(tableName, criteria, payload) {
  const existing = await findExistingRow(tableName, criteria);
  if (existing) {
    return { row: existing, created: false };
  }

  const row = await insertRow(tableName, payload);
  return { row, created: true };
}

function extractId(row) {
  if (!row) return null;
  return row.id || row.organization_id || row.tenant_id || row.user_id || row.patient_id || row.doctor_id || null;
}

async function buildPasswordPayload(tableName) {
  const meta = await getColumnMeta(tableName);
  const columns = new Set(meta.map((c) => c.column_name));
  const password = 'Raftop123!';
  const payload = {};

  if (columns.has('password_hash') || columns.has('hashed_password')) {
    let hash = password;

    try {
      const bcrypt = require('bcryptjs');
      hash = await bcrypt.hash(password, 10);
    } catch (_error) {
      hash = password;
    }

    if (columns.has('password_hash')) {
      payload.password_hash = hash;
    }

    if (columns.has('hashed_password')) {
      payload.hashed_password = hash;
    }
  } else if (columns.has('password')) {
    payload.password = password;
  }

  if (columns.has('must_change_password')) {
    payload.must_change_password = false;
  }

  return payload;
}

async function getForeignKeyReference(tableName, columnName) {
  const result = await query(
    `
      SELECT
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = $1
        AND kcu.column_name = $2
      LIMIT 1
    `,
    [tableName, columnName]
  );

  return result.rows[0] || null;
}

async function ensureDoctorRow({
  doctorsTable,
  doctorUserId,
  doctorEmail,
  organizationId,
  tenantId
}) {
  if (!doctorsTable) {
    return null;
  }

  const doctorResult = await insertOrFind(
    doctorsTable,
    {
      user_id: doctorUserId,
      email: doctorEmail
    },
    {
      user_id: doctorUserId,
      email: doctorEmail,
      name: 'Demo Doctor',
      full_name: 'Demo Doctor',
      first_name: 'Demo',
      last_name: 'Doctor',
      status: 'active',
      is_active: true,
      active: true,
      organization_id: organizationId,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  );

  return {
    row: doctorResult.row,
    created: doctorResult.created
  };
}

async function buildDoctorSubscriptionPayload({
  doctorSubsTable,
  doctorUserId,
  doctorEmail,
  organizationId,
  tenantId,
  nowIso,
  nextYearIso,
  tableSet,
  summary
}) {
  const payload = {
    organization_id: organizationId,
    tenant_id: tenantId,
    doctor_user_id: doctorUserId,
    user_id: doctorUserId,
    status: 'active',
    subscription_status: 'active',
    plan_name: 'premium_doctor',
    plan_key: 'premium_doctor',
    is_active: true,
    starts_at: nowIso,
    started_at: nowIso,
    start_date: nowIso,
    ends_at: nextYearIso,
    end_date: nextYearIso,
    expires_at: nextYearIso,
    created_at: nowIso,
    updated_at: nowIso
  };

  const criteria = {
    doctor_user_id: doctorUserId,
    user_id: doctorUserId
  };

  const doctorIdFk = await getForeignKeyReference(doctorSubsTable, 'doctor_id');

  if (doctorIdFk) {
    const targetTable = doctorIdFk.foreign_table_name;
    const targetColumn = doctorIdFk.foreign_column_name;

    if (targetTable === 'users') {
      payload.doctor_id = doctorUserId;
      criteria.doctor_id = doctorUserId;
    } else if (targetTable === 'doctors' && tableSet.has('doctors')) {
      const ensuredDoctor = await ensureDoctorRow({
        doctorsTable: 'doctors',
        doctorUserId,
        doctorEmail,
        organizationId,
        tenantId
      });

      const doctorRowId =
        ensuredDoctor?.row?.[targetColumn] ||
        ensuredDoctor?.row?.id ||
        ensuredDoctor?.row?.doctor_id ||
        null;

      if (!doctorRowId) {
        throw new Error('Could not resolve doctors.id for doctor_subscriptions.doctor_id');
      }

      payload.doctor_id = doctorRowId;
      criteria.doctor_id = doctorRowId;

      (ensuredDoctor.created ? summary.created : summary.reused).push('doctors: doctor@raftop.local');
    }
  } else {
    payload.doctor_id = doctorUserId;
    criteria.doctor_id = doctorUserId;
  }

  return { payload, criteria };
}

async function main() {
  const summary = {
    ok: true,
    created: [],
    reused: [],
    skipped: [],
    warnings: [],
    login: {
      admin: 'admin@raftop.local / Raftop123!',
      doctor: 'doctor@raftop.local / Raftop123!'
    }
  };

  try {
    const tableSet = await listTables();

    const tenantTable = pickTable(tableSet, TABLE_GROUPS.tenant);
    const usersTable = pickTable(tableSet, TABLE_GROUPS.users);
    const patientsTable = pickTable(tableSet, TABLE_GROUPS.patients);
    const devicesTable = pickTable(tableSet, TABLE_GROUPS.devices);
    const doctorSubsTable = pickTable(tableSet, TABLE_GROUPS.doctorSubscriptions);
    const revenueTable = pickTable(tableSet, TABLE_GROUPS.revenue);
    const paymentsTable = pickTable(tableSet, TABLE_GROUPS.payments);

    if (!tenantTable || !usersTable) {
      throw new Error('Seed confirmation requires tenant/users tables.');
    }

    const nowIso = new Date().toISOString();
    const nextYearIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const orgResult = await insertOrFind(
      tenantTable,
      { slug: 'raftop-demo', code: 'RAFTOP_DEMO', name: 'RAFTOP Demo Tenant' },
      {
        name: 'RAFTOP Demo Tenant',
        slug: 'raftop-demo',
        code: 'RAFTOP_DEMO',
        status: 'active',
        subscription_status: 'active',
        billing_status: 'active',
        plan_name: 'premium',
        plan_key: 'premium',
        is_active: true,
        active: true,
        created_at: nowIso,
        updated_at: nowIso
      }
    );

    const organizationId = extractId(orgResult.row);
    (orgResult.created ? summary.created : summary.reused).push(`${tenantTable}: raftop-demo`);

    const adminPasswordFields = await buildPasswordPayload(usersTable);
    const doctorPasswordFields = await buildPasswordPayload(usersTable);

    const adminResult = await insertOrFind(
      usersTable,
      { email: 'admin@raftop.local' },
      {
        email: 'admin@raftop.local',
        name: 'RAFTOP Admin',
        full_name: 'RAFTOP Admin',
        first_name: 'RAFTOP',
        last_name: 'Admin',
        role: 'admin',
        status: 'active',
        is_active: true,
        active: true,
        organization_id: organizationId,
        tenant_id: organizationId,
        created_at: nowIso,
        updated_at: nowIso,
        ...adminPasswordFields
      }
    );

    const adminUserId = extractId(adminResult.row);
    (adminResult.created ? summary.created : summary.reused).push(`${usersTable}: admin@raftop.local`);

    const doctorResult = await insertOrFind(
      usersTable,
      { email: 'doctor@raftop.local' },
      {
        email: 'doctor@raftop.local',
        name: 'Demo Doctor',
        full_name: 'Demo Doctor',
        first_name: 'Demo',
        last_name: 'Doctor',
        role: 'doctor',
        status: 'active',
        is_active: true,
        active: true,
        organization_id: organizationId,
        tenant_id: organizationId,
        created_at: nowIso,
        updated_at: nowIso,
        ...doctorPasswordFields
      }
    );

    const doctorUserId = extractId(doctorResult.row);
    (doctorResult.created ? summary.created : summary.reused).push(`${usersTable}: doctor@raftop.local`);

    let patientId = null;

    if (patientsTable) {
      const patientResult = await insertOrFind(
        patientsTable,
        { email: 'patient1@raftop.local' },
        {
          first_name: 'Nikos',
          last_name: 'Papadopoulos',
          full_name: 'Nikos Papadopoulos',
          email: 'patient1@raftop.local',
          phone: '6900000001',
          status: 'active',
          organization_id: organizationId,
          tenant_id: organizationId,
          doctor_id: doctorUserId,
          doctor_user_id: doctorUserId,
          created_by: adminUserId,
          created_at: nowIso,
          updated_at: nowIso
        }
      );

      patientId = extractId(patientResult.row);
      (patientResult.created ? summary.created : summary.reused).push(`${patientsTable}: patient1@raftop.local`);
    } else {
      summary.skipped.push('patients table missing');
    }

    if (devicesTable && patientId) {
      const deviceResult = await insertOrFind(
        devicesTable,
        { serial_number: 'RAFTOP-DEVICE-001', device_serial: 'RAFTOP-DEVICE-001' },
        {
          patient_id: patientId,
          organization_id: organizationId,
          tenant_id: organizationId,
          doctor_id: doctorUserId,
          serial_number: 'RAFTOP-DEVICE-001',
          device_serial: 'RAFTOP-DEVICE-001',
          brand: 'ResMed',
          manufacturer: 'ResMed',
          model: 'AirSense 10 AutoSet',
          status: 'active',
          is_active: true,
          last_sync_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso
        }
      );

      (deviceResult.created ? summary.created : summary.reused).push(`${devicesTable}: RAFTOP-DEVICE-001`);
    } else if (!devicesTable) {
      summary.skipped.push('devices table missing');
    }

    if (doctorSubsTable) {
      const doctorSubData = await buildDoctorSubscriptionPayload({
        doctorSubsTable,
        doctorUserId,
        doctorEmail: 'doctor@raftop.local',
        organizationId,
        tenantId: organizationId,
        nowIso,
        nextYearIso,
        tableSet,
        summary
      });

      const subResult = await insertOrFind(
        doctorSubsTable,
        doctorSubData.criteria,
        doctorSubData.payload
      );

      (subResult.created ? summary.created : summary.reused).push(`${doctorSubsTable}: doctor subscription`);
    } else {
      summary.skipped.push('doctor_subscriptions table missing');
    }

    if (paymentsTable) {
      try {
        const paymentResult = await insertOrFind(
          paymentsTable,
          { external_reference: 'RAFTOP-PAY-001', reference: 'RAFTOP-PAY-001' },
          {
            organization_id: organizationId,
            tenant_id: organizationId,
            doctor_user_id: doctorUserId,
            doctor_id: doctorUserId,
            user_id: doctorUserId,
            amount: 500,
            currency: 'EUR',
            status: 'paid',
            external_reference: 'RAFTOP-PAY-001',
            reference: 'RAFTOP-PAY-001',
            paid_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso
          }
        );

        (paymentResult.created ? summary.created : summary.reused).push(`${paymentsTable}: RAFTOP-PAY-001`);
      } catch (error) {
        summary.warnings.push(`payments seed skipped: ${error.message}`);
      }
    }

    if (revenueTable) {
      try {
        const revenueResult = await insertOrFind(
          revenueTable,
          { external_reference: 'RAFTOP-REV-001', reference: 'RAFTOP-REV-001' },
          {
            organization_id: organizationId,
            tenant_id: organizationId,
            doctor_user_id: doctorUserId,
            doctor_id: doctorUserId,
            user_id: doctorUserId,
            amount: 500,
            currency: 'EUR',
            source: 'doctor_subscription',
            status: 'recognized',
            external_reference: 'RAFTOP-REV-001',
            reference: 'RAFTOP-REV-001',
            recognized_at: nowIso,
            created_at: nowIso,
            updated_at: nowIso
          }
        );

        (revenueResult.created ? summary.created : summary.reused).push(`${revenueTable}: RAFTOP-REV-001`);
      } catch (error) {
        summary.warnings.push(`revenue seed skipped: ${error.message}`);
      }
    }
  } catch (error) {
    summary.ok = false;
    summary.error = error.message;
  }

  console.log(JSON.stringify(summary, null, 2));

  if (!summary.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message
      },
      null,
      2
    )
  );
  process.exit(1);
});