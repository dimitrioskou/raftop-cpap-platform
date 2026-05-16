const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '..', '.env')
});

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const db = require('../src/services/db');

const TENANT_ID = 'raftopoulos-live';

function nowIso() {
  return new Date().toISOString();
}

async function tableExists(tableName) {
  const result = await db.query(
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

  return result.rows[0]?.exists === true;
}

async function getColumns(tableName) {
  const result = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

function qIdent(value) {
  const text = String(value || '');

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    throw new Error(`Unsafe SQL identifier: ${text}`);
  }

  return `"${text}"`;
}

function pickColumn(columns, candidates) {
  return candidates.find((candidate) => columns.includes(candidate)) || null;
}

async function findFirstExistingTable(candidates) {
  for (const tableName of candidates) {
    if (await tableExists(tableName)) {
      return {
        tableName,
        columns: await getColumns(tableName)
      };
    }
  }

  return null;
}

async function ensureUniqueIndexIfPossible(tableName, columnName) {
  const columns = await getColumns(tableName);

  if (!columns.includes(columnName)) return false;

  try {
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_${columnName}_phase239b_unique
      ON ${qIdent(tableName)} (${qIdent(columnName)})
    `);

    return true;
  } catch (error) {
    console.warn(`Could not create unique index on ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

async function upsertDynamic({ tableName, conflictColumn, values }) {
  const columns = await getColumns(tableName);

  const filteredEntries = Object.entries(values).filter(([key, value]) => {
    if (!columns.includes(key)) return false;
    if (value === undefined) return false;
    return true;
  });

  if (filteredEntries.length === 0) {
    return {
      tableName,
      skipped: true,
      reason: 'No matching columns.',
      row: null
    };
  }

  const insertColumns = filteredEntries.map(([key]) => key);
  const insertValues = filteredEntries.map(([, value]) => value);
  const placeholders = insertColumns.map((_, index) => `$${index + 1}`);

  const hasConflictColumn = columns.includes(conflictColumn);

  if (hasConflictColumn) {
    await ensureUniqueIndexIfPossible(tableName, conflictColumn);
  }

  const updateColumns = insertColumns.filter((column) => column !== conflictColumn);

  const updateSql =
    updateColumns.length > 0
      ? updateColumns.map((column) => `${qIdent(column)} = EXCLUDED.${qIdent(column)}`).join(', ')
      : `${qIdent(conflictColumn)} = EXCLUDED.${qIdent(conflictColumn)}`;

  const sql = hasConflictColumn
    ? `
      INSERT INTO ${qIdent(tableName)} (${insertColumns.map(qIdent).join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${qIdent(conflictColumn)})
      DO UPDATE SET ${updateSql}
      RETURNING *
    `
    : `
      INSERT INTO ${qIdent(tableName)} (${insertColumns.map(qIdent).join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

  const result = await db.query(sql, insertValues);

  return {
    tableName,
    usedColumns: insertColumns,
    row: result.rows[0] || null
  };
}

function patientRows() {
  const now = nowIso();

  return [
    {
      id: 'raft-patient-001',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      name: 'Γεώργιος Παπαδόπουλος',
      patient_name: 'Γεώργιος Παπαδόπουλος',
      patientName: 'Γεώργιος Παπαδόπουλος',
      email: 'g.papadopoulos@patient.local',
      patient_email: 'g.papadopoulos@patient.local',
      phone: '69XXXXXXXX',
      status: 'active',
      therapy_status: 'ACTIVE',
      compliance_status: 'GOOD',
      created_at: now,
      updated_at: now,
      metadata: {
        source: 'phase23_9B_clean_dataset',
        presentationPatient: true,
        riskLevel: 'LOW',
        cpapHours30d: 126
      }
    },
    {
      id: 'raft-patient-002',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      name: 'Μαρία Κωνσταντίνου',
      patient_name: 'Μαρία Κωνσταντίνου',
      patientName: 'Μαρία Κωνσταντίνου',
      email: 'm.konstantinou@patient.local',
      patient_email: 'm.konstantinou@patient.local',
      phone: '69XXXXXXXX',
      status: 'active',
      therapy_status: 'ACTIVE',
      compliance_status: 'NEEDS_ATTENTION',
      created_at: now,
      updated_at: now,
      metadata: {
        source: 'phase23_9B_clean_dataset',
        presentationPatient: true,
        riskLevel: 'MEDIUM',
        cpapHours30d: 74
      }
    },
    {
      id: 'raft-patient-003',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      name: 'Νικόλαος Δημητρίου',
      patient_name: 'Νικόλαος Δημητρίου',
      patientName: 'Νικόλαος Δημητρίου',
      email: 'n.dimitriou@patient.local',
      patient_email: 'n.dimitriou@patient.local',
      phone: '69XXXXXXXX',
      status: 'active',
      therapy_status: 'ACTIVE',
      compliance_status: 'CRITICAL',
      created_at: now,
      updated_at: now,
      metadata: {
        source: 'phase23_9B_clean_dataset',
        presentationPatient: true,
        riskLevel: 'HIGH',
        cpapHours30d: 42
      }
    },
    {
      id: 'raft-patient-004',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      name: 'Ελένη Αντωνίου',
      patient_name: 'Ελένη Αντωνίου',
      patientName: 'Ελένη Αντωνίου',
      email: 'e.antoniou@patient.local',
      patient_email: 'e.antoniou@patient.local',
      phone: '69XXXXXXXX',
      status: 'active',
      therapy_status: 'ACTIVE',
      compliance_status: 'GOOD',
      created_at: now,
      updated_at: now,
      metadata: {
        source: 'phase23_9B_clean_dataset',
        presentationPatient: true,
        riskLevel: 'LOW',
        cpapHours30d: 151
      }
    },
    {
      id: 'raft-patient-005',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      name: 'Αθανάσιος Ιωάννου',
      patient_name: 'Αθανάσιος Ιωάννου',
      patientName: 'Αθανάσιος Ιωάννου',
      email: 'a.ioannou@patient.local',
      patient_email: 'a.ioannou@patient.local',
      phone: '69XXXXXXXX',
      status: 'active',
      therapy_status: 'ACTIVE',
      compliance_status: 'NEEDS_ATTENTION',
      created_at: now,
      updated_at: now,
      metadata: {
        source: 'phase23_9B_clean_dataset',
        presentationPatient: true,
        riskLevel: 'MEDIUM',
        cpapHours30d: 81
      }
    }
  ];
}

function deviceRows() {
  const now = nowIso();

  return [
    {
      id: 'raft-device-001',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      patient_id: 'raft-patient-001',
      patientId: 'raft-patient-001',
      serial_number: 'RFT-A10-1001',
      device_serial: 'RFT-A10-1001',
      model: 'AirSense 10 AutoSet',
      device_model: 'AirSense 10 AutoSet',
      brand: 'ResMed',
      status: 'active',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
      metadata: {
        presentationDevice: true,
        usage30dHours: 126,
        leakStatus: 'OK'
      }
    },
    {
      id: 'raft-device-002',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      patient_id: 'raft-patient-002',
      patientId: 'raft-patient-002',
      serial_number: 'RFT-A10-1002',
      device_serial: 'RFT-A10-1002',
      model: 'AirSense 10 AutoSet',
      device_model: 'AirSense 10 AutoSet',
      brand: 'ResMed',
      status: 'active',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
      metadata: {
        presentationDevice: true,
        usage30dHours: 74,
        leakStatus: 'WATCH'
      }
    },
    {
      id: 'raft-device-003',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      patient_id: 'raft-patient-003',
      patientId: 'raft-patient-003',
      serial_number: 'RFT-A11-1003',
      device_serial: 'RFT-A11-1003',
      model: 'AirSense 11 AutoSet',
      device_model: 'AirSense 11 AutoSet',
      brand: 'ResMed',
      status: 'active',
      last_sync_at: now,
      created_at: now,
      updated_at: now,
      metadata: {
        presentationDevice: true,
        usage30dHours: 42,
        leakStatus: 'HIGH'
      }
    }
  ];
}

function signalRows() {
  const now = nowIso();

  return [
    {
      id: 'raft-signal-001',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      patient_id: 'raft-patient-003',
      patientId: 'raft-patient-003',
      patient_name: 'Νικόλαος Δημητρίου',
      patientName: 'Νικόλαος Δημητρίου',
      signal_type: 'LOW_USAGE',
      signalType: 'LOW_USAGE',
      type: 'LOW_USAGE',
      title: 'Low CPAP usage risk',
      description: 'Ο ασθενής έχει χαμηλή χρήση CPAP και χρειάζεται follow-up.',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'open',
      source: 'ATLAS',
      metadata: {
        presentationSignal: true,
        nextBestAction: 'Schedule phone follow-up within 48 hours',
        cpapHours30d: 42
      },
      created_at: now,
      updated_at: now
    },
    {
      id: 'raft-signal-002',
      tenant_id: TENANT_ID,
      tenantId: TENANT_ID,
      patient_id: 'raft-patient-002',
      patientId: 'raft-patient-002',
      patient_name: 'Μαρία Κωνσταντίνου',
      patientName: 'Μαρία Κωνσταντίνου',
      signal_type: 'MASK_LEAK',
      signalType: 'MASK_LEAK',
      type: 'MASK_LEAK',
      title: 'Possible mask leak issue',
      description: 'Πιθανή διαρροή μάσκας. Προτείνεται έλεγχος εφαρμογής.',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'open',
      source: 'ATLAS',
      metadata: {
        presentationSignal: true,
        nextBestAction: 'Check mask fit and comfort',
        leakStatus: 'WATCH'
      },
      created_at: now,
      updated_at: now
    }
  ];
}

async function seedPatients() {
  const target = await findFirstExistingTable(['patients', 'tenant_patients']);

  if (!target) {
    console.log('Patients table not found. Skipping patients.');
    return;
  }

  console.log(`\nSeeding patients into ${target.tableName}`);

  for (const row of patientRows()) {
    const result = await upsertDynamic({
      tableName: target.tableName,
      conflictColumn: 'id',
      values: row
    });

    console.log(`- patient ${row.id}`, result.skipped ? result.reason : 'ok');
  }
}

async function seedDevices() {
  const target = await findFirstExistingTable(['devices', 'tenant_devices']);

  if (!target) {
    console.log('Devices table not found. Skipping devices.');
    return;
  }

  console.log(`\nSeeding devices into ${target.tableName}`);

  for (const row of deviceRows()) {
    const result = await upsertDynamic({
      tableName: target.tableName,
      conflictColumn: 'id',
      values: row
    });

    console.log(`- device ${row.id}`, result.skipped ? result.reason : 'ok');
  }
}

async function seedSignals() {
  const target = await findFirstExistingTable([
    'patient_signals',
    'tenant_patient_signals',
    'patient_signal_events',
    'signals'
  ]);

  if (!target) {
    console.log('Patient signals table not found. Skipping signals.');
    return;
  }

  console.log(`\nSeeding patient signals into ${target.tableName}`);

  for (const row of signalRows()) {
    const result = await upsertDynamic({
      tableName: target.tableName,
      conflictColumn: 'id',
      values: row
    });

    console.log(`- signal ${row.id}`, result.skipped ? result.reason : 'ok');
  }
}

async function main() {
  console.log('Phase 23.9B — Seed clean Raftopoulos commercial demo dataset');
  console.log('Tenant:', TENANT_ID);

  await seedPatients();
  await seedDevices();
  await seedSignals();

  console.log('\nDONE.');
  console.log('Clean commercial demo data seeded for tenant:', TENANT_ID);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nFAILED:', error);
    process.exit(1);
  });