const db = require('../../db');

async function runQuery(sql, params = []) {
  if (typeof db.query === 'function') {
    return db.query(sql, params);
  }

  if (db.pool && typeof db.pool.query === 'function') {
    return db.pool.query(sql, params);
  }

  throw new Error('Database query function is not available.');
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeText(value, fallback = '') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

async function ensureTables() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_patients (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      full_name TEXT,
      doctor_name TEXT,
      serial TEXT,
      compliance_hours NUMERIC DEFAULT 0,
      ahi NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'stable',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_devices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      serial TEXT,
      patient_name TEXT,
      doctor_name TEXT,
      last_sync TEXT,
      usage_7d NUMERIC DEFAULT 0,
      leak NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'online',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_followups (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      patient_name TEXT,
      reason TEXT,
      owner TEXT,
      priority TEXT DEFAULT 'normal',
      outcome TEXT,
      next_action TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_tasks (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT,
      owner TEXT,
      due TEXT,
      sla TEXT DEFAULT 'scheduled',
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_notes (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      patient_name TEXT,
      author TEXT,
      category TEXT,
      created_label TEXT,
      note_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_referrals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      patient_name TEXT,
      ref_doctor TEXT,
      specialty TEXT,
      stage TEXT DEFAULT 'new',
      source TEXT,
      created_label TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_notifications (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      title TEXT,
      channel TEXT,
      recipient TEXT,
      status TEXT DEFAULT 'pending',
      body TEXT,
      created_label TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT DEFAULT 'viewer',
      status TEXT DEFAULT 'active',
      last_active TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_modules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      module_key TEXT,
      name TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      required_plan TEXT DEFAULT 'starter',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_integrations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT,
      provider TEXT,
      status TEXT DEFAULT 'pending',
      mode TEXT DEFAULT 'api',
      last_sync TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tenant_workspace_branding (
      tenant_id TEXT PRIMARY KEY,
      company_name TEXT,
      logo_url TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      accent_color TEXT,
      white_label BOOLEAN DEFAULT FALSE,
      custom_domain TEXT,
      support_email TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twp_tenant_id ON tenant_workspace_patients(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twd_tenant_id ON tenant_workspace_devices(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twf_tenant_id ON tenant_workspace_followups(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twt_tenant_id ON tenant_workspace_tasks(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twn_tenant_id ON tenant_workspace_notes(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twr_tenant_id ON tenant_workspace_referrals(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twno_tenant_id ON tenant_workspace_notifications(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twu_tenant_id ON tenant_workspace_users(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twm_tenant_id ON tenant_workspace_modules(tenant_id)`);
  await runQuery(`CREATE INDEX IF NOT EXISTS idx_twi_tenant_id ON tenant_workspace_integrations(tenant_id)`);
}

async function seedIfEmpty(tenantId) {
  await ensureTables();

  const count = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_patients WHERE tenant_id = $1`,
    [tenantId]
  );

  if (safe(count.rows?.[0]?.count) > 0) {
    return;
  }

  const patients = [
    ['PT-1001', tenantId, 'Giorgos Papadakis', 'Dr. Maria Papadopoulou', 'RM-22341', 92, 3.1, 'stable'],
    ['PT-1002', tenantId, 'Eleni Kosta', 'Dr. Nikos Andreou', 'RM-22342', 61, 8.4, 'warning'],
    ['PT-1003', tenantId, 'Dimitris Leonidas', 'Dr. Eleni Perraki', 'RM-22343', 44, 11.2, 'critical'],
    ['PT-1004', tenantId, 'Maria Ioannou', 'Dr. George Dimitriou', 'RM-22344', 108, 2.8, 'stable']
  ];

  for (const row of patients) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_patients
          (id, tenant_id, full_name, doctor_name, serial, compliance_hours, ahi, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      row
    );
  }

  const devices = [
    ['DV-1001', tenantId, 'RM-22341', 'Giorgos Papadakis', 'Dr. Maria Papadopoulou', '2026-03-31 08:55', 7.2, 8, 'online'],
    ['DV-1002', tenantId, 'RM-22342', 'Eleni Kosta', 'Dr. Nikos Andreou', '2026-03-29 12:20', 4.8, 18, 'warning'],
    ['DV-1003', tenantId, 'RM-22343', 'Dimitris Leonidas', 'Dr. Eleni Perraki', '2026-03-24 09:10', 3.1, 26, 'offline'],
    ['DV-1004', tenantId, 'RM-22344', 'Maria Ioannou', 'Dr. George Dimitriou', '2026-03-31 09:02', 8.0, 6, 'online']
  ];

  for (const row of devices) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_devices
          (id, tenant_id, serial, patient_name, doctor_name, last_sync, usage_7d, leak, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      row
    );
  }

  const followups = [
    ['FU-001', tenantId, 'Eleni Kosta', 'Below 80h compliance', 'Follow-up Manager', 'high', 'Callback requested', 'Call tomorrow 10:00'],
    ['FU-002', tenantId, 'Dimitris Leonidas', 'Critical usage drop', 'Operations Admin', 'critical', 'No answer', 'Escalate to doctor'],
    ['FU-003', tenantId, 'Giorgos Papadakis', 'Education follow-up', 'Follow-up Manager', 'normal', 'Reached', 'Close if stable next week'],
    ['FU-004', tenantId, 'Maria Ioannou', 'Mask leak review', 'Operations Admin', 'high', 'Promised improvement', 'Recheck in 3 days']
  ];

  for (const row of followups) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_followups
          (id, tenant_id, patient_name, reason, owner, priority, outcome, next_action)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      row
    );
  }

  const tasks = [
    ['TSK-001', tenantId, 'Call Dimitris Leonidas', 'Operations Admin', '2026-03-31 11:30', 'overdue', 'open'],
    ['TSK-002', tenantId, 'Review mask leak for Maria Ioannou', 'Follow-up Manager', '2026-03-31 15:00', 'today', 'open'],
    ['TSK-003', tenantId, 'Send billing reminder', 'Billing Viewer', '2026-04-01 10:00', 'scheduled', 'pending'],
    ['TSK-004', tenantId, 'Doctor callback summary', 'Operations Admin', '2026-03-30 17:00', 'closed', 'done']
  ];

  for (const row of tasks) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_tasks
          (id, tenant_id, title, owner, due, sla, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      row
    );
  }

  const notes = [
    ['NT-001', tenantId, 'Eleni Kosta', 'Follow-up Manager', 'followup', '2026-03-31 09:10', 'Patient requested callback after 18:00 λόγω εργασίας. Αναφέρει δυσφορία με τη μάσκα και χαμηλή διάρκεια χρήσης τις τελευταίες 4 νύχτες.'],
    ['NT-002', tenantId, 'Dimitris Leonidas', 'Operations Admin', 'critical', '2026-03-31 08:45', 'Σημαντική πτώση συμμόρφωσης και επαναλαμβανόμενο no-answer. Προτείνεται ιατρική ειδοποίηση και δεύτερη προσπάθεια επικοινωνίας σήμερα.'],
    ['NT-003', tenantId, 'Maria Ioannou', 'Operations Admin', 'device', '2026-03-30 17:20', 'Παρατηρήθηκε αυξημένο leak για δύο συνεχόμενες νύχτες. Έγινε σύσταση για επανέλεγχο μάσκας και σωστής εφαρμογής.'],
    ['NT-004', tenantId, 'Giorgos Papadakis', 'Follow-up Manager', 'stable', '2026-03-30 13:10', 'Καλή συνολική εικόνα, συμμόρφωση πάνω από στόχο και σταθερή χρήση. Παραμένει σε passive monitoring.']
  ];

  for (const row of notes) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_notes
          (id, tenant_id, patient_name, author, category, created_label, note_text)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      row
    );
  }

  const referrals = [
    ['RF-001', tenantId, 'Alexandros Vrettos', 'Dr. Maria Papadopoulou', 'Pulmonology', 'new', 'Clinic', '2026-03-31'],
    ['RF-002', tenantId, 'Katerina Meli', 'Dr. Nikos Andreou', 'Cardiology', 'contacted', 'Private Practice', '2026-03-30'],
    ['RF-003', tenantId, 'Giannis Laskaris', 'Dr. Eleni Perraki', 'Pulmonology', 'scheduled', 'Hospital', '2026-03-29'],
    ['RF-004', tenantId, 'Sofia Dima', 'Dr. George Dimitriou', 'ENT', 'converted', 'Clinic', '2026-03-28']
  ];

  for (const row of referrals) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_referrals
          (id, tenant_id, patient_name, ref_doctor, specialty, stage, source, created_label)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      row
    );
  }

  const notifications = [
    ['NF-001', tenantId, 'Critical patient non-compliance', 'internal', 'Operations Admin', 'pending', 'Patient Dimitris Leonidas dropped below threshold. Recommend immediate call and doctor escalation.', '2026-03-31 09:02'],
    ['NF-002', tenantId, 'Device offline alert', 'email', 'Follow-up Manager', 'sent', 'Device RM-22343 has not synced for 6 days. Review connectivity and patient usage barriers.', '2026-03-31 08:30'],
    ['NF-003', tenantId, 'Doctor trial conversion reminder', 'email', 'Billing Viewer', 'queued', 'Upcoming trial expiration for high-usage doctor account. Commercial follow-up suggested.', '2026-03-30 17:40'],
    ['NF-004', tenantId, 'Follow-up callback reminder', 'sms', 'Patient Outreach', 'failed', 'Callback reminder was not delivered successfully. Retry via alternate route.', '2026-03-30 15:12']
  ];

  for (const row of notifications) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_notifications
          (id, tenant_id, title, channel, recipient, status, body, created_label)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      row
    );
  }

  const users = [
    ['USR-001', tenantId, 'RAFTOP Owner', 'owner@raftop.local', 'owner', 'active', '2026-04-02 10:15'],
    ['USR-002', tenantId, 'Operations Admin', 'ops@raftop.local', 'admin', 'active', '2026-04-02 09:50'],
    ['USR-003', tenantId, 'Follow-up Manager', 'followup@raftop.local', 'manager', 'active', '2026-04-01 18:35'],
    ['USR-004', tenantId, 'Billing Viewer', 'billing@raftop.local', 'viewer', 'invited', '—']
  ];

  for (const row of users) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_users
          (id, tenant_id, name, email, role, status, last_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      row
    );
  }

  const modules = [
    ['MOD-001', tenantId, 'dashboard', 'Dashboard', true, 'starter', 'active'],
    ['MOD-002', tenantId, 'atlas', 'ATLAS System', true, 'professional', 'active'],
    ['MOD-003', tenantId, 'predictive_ai', 'Predictive AI', true, 'professional', 'active'],
    ['MOD-004', tenantId, 'doctor_billing', 'Doctor Billing', true, 'enterprise', 'active'],
    ['MOD-005', tenantId, 'white_label', 'White Label', false, 'enterprise', 'locked']
  ];

  for (const row of modules) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_modules
          (id, tenant_id, module_key, name, enabled, required_plan, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      row
    );
  }

  const integrations = [
    ['INT-001', tenantId, 'ResMed AirView', 'ResMed', 'connected', 'csv-sync', '2026-04-02 08:40'],
    ['INT-002', tenantId, 'Stripe Billing', 'Stripe', 'ready', 'api', '2026-04-01 16:20'],
    ['INT-003', tenantId, 'Email Notifications', 'SMTP', 'connected', 'smtp', '2026-04-02 09:10'],
    ['INT-004', tenantId, 'SMS Gateway', 'Twilio', 'pending', 'api', '—']
  ];

  for (const row of integrations) {
    await runQuery(
      `
        INSERT INTO tenant_workspace_integrations
          (id, tenant_id, name, provider, status, mode, last_sync)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      row
    );
  }

  await runQuery(
    `
      INSERT INTO tenant_workspace_branding
        (tenant_id, company_name, logo_url, primary_color, secondary_color, accent_color, white_label, custom_domain, support_email, updated_at)
      VALUES
        ($1,'RAFTOP Enterprise','', '#2563eb', '#0f172a', '#10b981', true, 'enterprise.raftop.local', 'support@raftop.local', NOW())
      ON CONFLICT (tenant_id) DO NOTHING
    `,
    [tenantId]
  );
}

function buildSearchClause(search, columns, startIndex = 2) {
  if (!search) {
    return { sql: '', params: [] };
  }

  const param = `%${search}%`;
  const idx = startIndex;
  return {
    sql: ` AND (${columns.map((col) => `COALESCE(${col}, '') ILIKE $${idx}`).join(' OR ')})`,
    params: [param]
  };
}

async function getDashboard({ tenantId }) {
  await seedIfEmpty(tenantId);

  const patients = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_patients WHERE tenant_id = $1`,
    [tenantId]
  );
  const doctors = await runQuery(
    `SELECT COUNT(DISTINCT doctor_name)::int AS count FROM tenant_workspace_patients WHERE tenant_id = $1`,
    [tenantId]
  );
  const seats = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_users WHERE tenant_id = $1`,
    [tenantId]
  );
  const modules = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_modules WHERE tenant_id = $1 AND enabled = TRUE`,
    [tenantId]
  );
  const criticalFollowups = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_followups WHERE tenant_id = $1 AND priority IN ('critical','high')`,
    [tenantId]
  );
  const offlineDevices = await runQuery(
    `SELECT COUNT(*)::int AS count FROM tenant_workspace_devices WHERE tenant_id = $1 AND status = 'offline'`,
    [tenantId]
  );

  const modulesCount = safe(modules.rows?.[0]?.count);
  const featuresCount = modulesCount * 6 + 5;

  return {
    patientsCount: safe(patients.rows?.[0]?.count),
    patients_count: safe(patients.rows?.[0]?.count),
    doctorsCount: safe(doctors.rows?.[0]?.count),
    doctors_count: safe(doctors.rows?.[0]?.count),
    seatsCount: safe(seats.rows?.[0]?.count),
    seats_count: safe(seats.rows?.[0]?.count),
    modulesCount,
    modules_count: modulesCount,
    featuresCount,
    features_count: featuresCount,
    criticalFollowups: safe(criticalFollowups.rows?.[0]?.count),
    critical_followups: safe(criticalFollowups.rows?.[0]?.count),
    offlineDevices: safe(offlineDevices.rows?.[0]?.count),
    offline_devices: safe(offlineDevices.rows?.[0]?.count)
  };
}

async function getPatients({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'full_name', 'doctor_name', 'serial', 'status']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_patients
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY full_name ASC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    fullName: normalizeText(row.full_name, 'Unknown'),
    full_name: normalizeText(row.full_name, 'Unknown'),
    name: normalizeText(row.full_name, 'Unknown'),
    doctor: normalizeText(row.doctor_name, '—'),
    doctor_name: normalizeText(row.doctor_name, '—'),
    serial: normalizeText(row.serial, '—'),
    complianceHours: safe(row.compliance_hours),
    compliance_hours: safe(row.compliance_hours),
    ahi: safe(row.ahi),
    status: normalizeText(row.status, 'stable').toLowerCase()
  }));
}

async function getDevices({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'serial', 'patient_name', 'doctor_name', 'status']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_devices
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY serial ASC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    serial: normalizeText(row.serial, '—'),
    patient: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    patientName: normalizeText(row.patient_name, 'Unknown'),
    doctor: normalizeText(row.doctor_name, '—'),
    doctor_name: normalizeText(row.doctor_name, '—'),
    lastSync: normalizeText(row.last_sync, '—'),
    last_sync: normalizeText(row.last_sync, '—'),
    usage7d: safe(row.usage_7d),
    usage_7d: safe(row.usage_7d),
    leak: safe(row.leak),
    status: normalizeText(row.status, 'online').toLowerCase()
  }));
}

async function getCompliance({ tenantId, search = '' }) {
  const patients = await getPatients({ tenantId, search });

  return patients.map((row) => {
    let trend = '+4h';
    if (safe(row.compliance_hours || row.complianceHours) < 80) trend = '-7h';
    if (safe(row.compliance_hours || row.complianceHours) < 50) trend = '-15h';

    let status = 'compliant';
    if (safe(row.compliance_hours || row.complianceHours) < 80) status = 'warning';
    if (safe(row.compliance_hours || row.complianceHours) < 50) status = 'critical';

    return {
      id: `CMP-${row.id}`,
      patient: row.fullName || row.full_name || row.name,
      patient_name: row.fullName || row.full_name || row.name,
      doctor: row.doctor || row.doctor_name,
      doctor_name: row.doctor || row.doctor_name,
      hours: safe(row.complianceHours || row.compliance_hours),
      complianceHours: safe(row.complianceHours || row.compliance_hours),
      compliance_hours: safe(row.complianceHours || row.compliance_hours),
      trend,
      status
    };
  });
}

async function getFollowups({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'patient_name', 'reason', 'owner', 'priority', 'outcome', 'next_action']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_followups
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at DESC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    patient: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    reason: normalizeText(row.reason, 'Follow-up required'),
    owner: normalizeText(row.owner, '—'),
    priority: normalizeText(row.priority, 'normal').toLowerCase(),
    outcome: normalizeText(row.outcome, 'Pending'),
    nextAction: normalizeText(row.next_action, 'Review case'),
    next_action: normalizeText(row.next_action, 'Review case')
  }));
}

async function getTasks({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'title', 'owner', 'sla', 'status']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_tasks
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at DESC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    title: normalizeText(row.title, 'Task'),
    owner: normalizeText(row.owner, '—'),
    due: normalizeText(row.due, '—'),
    due_at: normalizeText(row.due, '—'),
    due_date: normalizeText(row.due, '—'),
    deadline: normalizeText(row.due, '—'),
    sla: normalizeText(row.sla, 'scheduled').toLowerCase(),
    status: normalizeText(row.status, 'open').toLowerCase()
  }));
}

async function getNotes({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'patient_name', 'author', 'category', 'note_text']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_notes
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at DESC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    patient: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    author: normalizeText(row.author, '—'),
    category: normalizeText(row.category, 'general').toLowerCase(),
    createdAt: normalizeText(row.created_label, '—'),
    created_at: normalizeText(row.created_label, '—'),
    text: normalizeText(row.note_text, 'No note text'),
    note: normalizeText(row.note_text, 'No note text'),
    body: normalizeText(row.note_text, 'No note text')
  }));
}

async function getReferrals({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'patient_name', 'ref_doctor', 'specialty', 'stage', 'source']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_referrals
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at DESC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    patient: normalizeText(row.patient_name, 'Unknown'),
    patient_name: normalizeText(row.patient_name, 'Unknown'),
    refDoctor: normalizeText(row.ref_doctor, '—'),
    ref_doctor: normalizeText(row.ref_doctor, '—'),
    specialty: normalizeText(row.specialty, '—'),
    stage: normalizeText(row.stage, 'new').toLowerCase(),
    source: normalizeText(row.source, '—'),
    createdAt: normalizeText(row.created_label, '—'),
    created_at: normalizeText(row.created_label, '—')
  }));
}

async function getNotifications({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'title', 'channel', 'recipient', 'status', 'body']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_notifications
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at DESC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    title: normalizeText(row.title, 'Notification'),
    channel: normalizeText(row.channel, 'internal').toLowerCase(),
    recipient: normalizeText(row.recipient, '—'),
    status: normalizeText(row.status, 'pending').toLowerCase(),
    createdAt: normalizeText(row.created_label, '—'),
    created_at: normalizeText(row.created_label, '—'),
    body: normalizeText(row.body, 'No notification content'),
    message: normalizeText(row.body, 'No notification content')
  }));
}

async function getUsers({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'name', 'email', 'role', 'status']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_users
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at ASC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    name: normalizeText(row.name, 'Unknown User'),
    email: normalizeText(row.email, '—'),
    role: normalizeText(row.role, 'viewer').toLowerCase(),
    status: normalizeText(row.status, 'active').toLowerCase(),
    lastActive: normalizeText(row.last_active, '—'),
    last_active: normalizeText(row.last_active, '—')
  }));
}

async function getModules({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'module_key', 'name', 'required_plan', 'status']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_modules
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at ASC
    `,
    [tenantId, ...searchData.params]
  );

  return {
    items: result.rows.map((row) => ({
      id: normalizeText(row.id),
      key: normalizeText(row.module_key, 'module'),
      name: normalizeText(row.name, 'Module'),
      enabled: Boolean(row.enabled),
      requiredPlan: normalizeText(row.required_plan, 'starter').toLowerCase(),
      required_plan: normalizeText(row.required_plan, 'starter').toLowerCase(),
      status: normalizeText(row.status, row.enabled ? 'active' : 'locked').toLowerCase()
    }))
  };
}

async function getIntegrations({ tenantId, search = '' }) {
  await seedIfEmpty(tenantId);

  const searchData = buildSearchClause(search, ['id', 'name', 'provider', 'status', 'mode']);
  const result = await runQuery(
    `
      SELECT *
      FROM tenant_workspace_integrations
      WHERE tenant_id = $1
      ${searchData.sql}
      ORDER BY created_at ASC
    `,
    [tenantId, ...searchData.params]
  );

  return result.rows.map((row) => ({
    id: normalizeText(row.id),
    name: normalizeText(row.name, 'Integration'),
    provider: normalizeText(row.provider, '—'),
    status: normalizeText(row.status, 'pending').toLowerCase(),
    mode: normalizeText(row.mode, 'api').toLowerCase(),
    lastSync: normalizeText(row.last_sync, '—'),
    last_sync: normalizeText(row.last_sync, '—')
  }));
}

async function getBranding({ tenantId }) {
  await seedIfEmpty(tenantId);

  const result = await runQuery(
    `SELECT * FROM tenant_workspace_branding WHERE tenant_id = $1 LIMIT 1`,
    [tenantId]
  );

  const row = result.rows?.[0] || {};

  return {
    companyName: normalizeText(row.company_name, 'RAFTOP Enterprise'),
    company_name: normalizeText(row.company_name, 'RAFTOP Enterprise'),
    logoUrl: normalizeText(row.logo_url),
    logo_url: normalizeText(row.logo_url),
    primaryColor: normalizeText(row.primary_color, '#2563eb'),
    primary_color: normalizeText(row.primary_color, '#2563eb'),
    secondaryColor: normalizeText(row.secondary_color, '#0f172a'),
    secondary_color: normalizeText(row.secondary_color, '#0f172a'),
    accentColor: normalizeText(row.accent_color, '#10b981'),
    accent_color: normalizeText(row.accent_color, '#10b981'),
    whiteLabel: Boolean(row.white_label),
    white_label: Boolean(row.white_label),
    customDomain: normalizeText(row.custom_domain),
    custom_domain: normalizeText(row.custom_domain),
    supportEmail: normalizeText(row.support_email),
    support_email: normalizeText(row.support_email)
  };
}

module.exports = {
  getDashboard,
  getPatients,
  getDevices,
  getCompliance,
  getFollowups,
  getTasks,
  getNotes,
  getReferrals,
  getNotifications,
  getUsers,
  getModules,
  getIntegrations,
  getBranding
};