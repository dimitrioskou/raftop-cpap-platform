const db = require('./db');

function getTenantId(req) {
  return (
    req.user?.tenant_id ||
    req.user?.tenantId ||
    req.headers['x-tenant-id'] ||
    req.query.tenant_id ||
    req.query.tenantId ||
    'demo-tenant'
  );
}

async function ensurePatientSignalsSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS patient_signals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      tenant_id TEXT NOT NULL DEFAULT 'demo-tenant',
      patient_id TEXT,
      patient_name TEXT,
      signal_type TEXT NOT NULL DEFAULT 'MANUAL_SIGNAL',
      title TEXT NOT NULL DEFAULT 'Patient signal',
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      source TEXT NOT NULL DEFAULT 'ATLAS',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'demo-tenant';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS patient_id TEXT;`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS patient_name TEXT;`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS signal_type TEXT DEFAULT 'MANUAL_SIGNAL';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Patient signal';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS description TEXT;`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'MEDIUM';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ATLAS';`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`);
  await db.query(`ALTER TABLE patient_signals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

  await db.query(`
    UPDATE patient_signals
    SET tenant_id = COALESCE(tenant_id, 'demo-tenant'),
        signal_type = COALESCE(signal_type, 'MANUAL_SIGNAL'),
        title = COALESCE(title, 'Patient signal'),
        severity = COALESCE(severity, 'MEDIUM'),
        status = COALESCE(status, 'OPEN'),
        source = COALESCE(source, 'ATLAS'),
        metadata = COALESCE(metadata, '{}'::jsonb),
        created_at = COALESCE(created_at, NOW()),
        updated_at = COALESCE(updated_at, NOW());
  `);
}

async function seedIfEmpty(tenantId) {
  const existing = await db.query(
    `SELECT COUNT(*)::int AS count FROM patient_signals WHERE tenant_id = $1`,
    [tenantId]
  );

  if (Number(existing.rows[0]?.count || 0) > 0) return;

  await db.query(
    `
    INSERT INTO patient_signals
      (id, tenant_id, patient_id, patient_name, signal_type, title, description, severity, status, source, metadata)
    VALUES
      ('sig-demo-001', $1, 'P-1001', 'Demo Patient One', 'LOW_USAGE', 'Low CPAP usage detected', 'Patient is below the required monthly usage threshold.', 'HIGH', 'OPEN', 'ATLAS', '{"rule":"80h_month"}'),
      ('sig-demo-002', $1, 'P-1002', 'Demo Patient Two', 'HIGH_LEAK', 'High mask leak detected', 'Leak trend is above acceptable threshold.', 'MEDIUM', 'OPEN', 'ATLAS', '{"rule":"mask_leak"}'),
      ('sig-demo-003', $1, 'P-1003', 'Demo Patient Three', 'DEVICE_DISCONNECT', 'Device disconnect risk', 'No recent device signal was detected.', 'CRITICAL', 'OPEN', 'ATLAS', '{"rule":"device_sync"}')
    ON CONFLICT (id) DO NOTHING;
    `,
    [tenantId]
  );
}

async function listPatientSignals(req) {
  const tenantId = getTenantId(req);

  await ensurePatientSignalsSchema();
  await seedIfEmpty(tenantId);

  const result = await db.query(
    `
    SELECT
      id,
      tenant_id,
      patient_id,
      patient_name,
      signal_type,
      title,
      description,
      severity,
      status,
      source,
      metadata,
      created_at,
      updated_at
    FROM patient_signals
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT 200
    `,
    [tenantId]
  );

  const signals = result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    signalType: row.signal_type,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    source: row.source,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  return {
    ok: true,
    fallback: false,
    source: 'database',
    tenantId,
    summary: {
      total: signals.length,
      open: signals.filter((s) => String(s.status).toUpperCase() === 'OPEN').length,
      critical: signals.filter((s) => String(s.severity).toUpperCase() === 'CRITICAL').length,
      high: signals.filter((s) => String(s.severity).toUpperCase() === 'HIGH').length,
      medium: signals.filter((s) => String(s.severity).toUpperCase() === 'MEDIUM').length,
      low: signals.filter((s) => String(s.severity).toUpperCase() === 'LOW').length
    },
    signals
  };
}

async function createPatientSignal(req) {
  const tenantId = getTenantId(req);
  const body = req.body || {};

  await ensurePatientSignalsSchema();

  const result = await db.query(
    `
    INSERT INTO patient_signals
      (id, tenant_id, patient_id, patient_name, signal_type, title, description, severity, status, source, metadata)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    RETURNING *
    `,
    [
      body.id || `sig-${Date.now()}`,
      tenantId,
      body.patientId || body.patient_id || null,
      body.patientName || body.patient_name || null,
      body.signalType || body.signal_type || 'MANUAL_SIGNAL',
      body.title || 'Manual patient signal',
      body.description || '',
      String(body.severity || 'MEDIUM').toUpperCase(),
      String(body.status || 'OPEN').toUpperCase(),
      body.source || 'ATLAS',
      JSON.stringify(body.metadata || {})
    ]
  );

  return {
    ok: true,
    fallback: false,
    source: 'database',
    signal: result.rows[0]
  };
}

async function updatePatientSignalStatus(req) {
  const tenantId = getTenantId(req);
  const id = req.params.id;
  const status = String(req.body?.status || 'OPEN').toUpperCase();

  await ensurePatientSignalsSchema();

  const result = await db.query(
    `
    UPDATE patient_signals
    SET status = $1, updated_at = NOW()
    WHERE id::text = $2::text
      AND tenant_id = $3
    RETURNING *
    `,
    [status, id, tenantId]
  );

  if (result.rows.length === 0) {
    return {
      ok: false,
      error: 'PATIENT_SIGNAL_NOT_FOUND',
      message: 'Patient signal not found.'
    };
  }

  return {
    ok: true,
    fallback: false,
    source: 'database',
    signal: result.rows[0]
  };
}

module.exports = {
  listPatientSignals,
  createPatientSignal,
  updatePatientSignalStatus
};