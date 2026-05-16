const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

const patientReportService = require('./patientReportService');
const patientIngestionService = require('./patientIngestionService');

function resolveDb() {
  const candidates = [
    '../db',
    '../config/db',
    '../config/database',
    '../database',
    '../lib/db',
    '../../db',
    '../../config/db'
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
      // continue
    }
  }

  throw new Error('Could not resolve database client in tenantPatientOrchestratorService.');
}

const db = resolveDb();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function safeJsonParse(raw, fallback = {}) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function normalizeTaskStatus(value) {
  const raw = safeLower(value);

  if (!raw) return 'pending';
  if (
    [
      'pending',
      'in_progress',
      'done',
      'cancelled',
      'escalated',
      'resolved',
      'closed',
      'completed'
    ].includes(raw)
  ) {
    return raw;
  }

  if (raw.includes('progress')) return 'in_progress';
  if (raw.includes('escal')) return 'escalated';
  if (raw.includes('done') || raw.includes('complete') || raw.includes('resolv') || raw.includes('close')) {
    return 'done';
  }
  if (raw.includes('cancel')) return 'cancelled';

  return 'pending';
}

function normalizeTaskPriority(value) {
  const raw = safeLower(value);

  if (!raw) return 'normal';
  if (['normal', 'warning', 'critical'].includes(raw)) return raw;
  if (raw.includes('crit')) return 'critical';
  if (raw.includes('warn')) return 'warning';

  return 'normal';
}

function parseTaskMetadata(notes) {
  const text = String(notes || '');

  function extract(pattern) {
    const match = text.match(pattern);
    return match?.[1] ? String(match[1]).trim() : null;
  }

  return {
    actionId: extract(/action_id=([^\n\r]+)/i),
    signalId: extract(/signal_id=([^\n\r]+)/i),
    signalKind: extract(/signal_kind=([^\n\r]+)/i),
    patientEmail: extract(/patient_email=([^\n\r]+)/i),
    atlasCategory: extract(/category=([A-Z0-9_]+)/i)
  };
}

function buildShortcutList(patientEmail) {
  const ref = encodeURIComponent(patientEmail || 'patient@raftop.local');

  return [
    {
      id: 'reload-patient-orchestrator',
      label: 'Reload Patient Workspace',
      href: `/tenant/patient-orchestrator/${ref}`
    },
    {
      id: 'open-patient-tasks',
      label: 'Open Patient Tasks',
      href: `/tenant/patient-tasks/${ref}`
    },
    {
      id: 'open-signals',
      label: 'Open Patient Signals',
      href: '/tenant/patient-signals'
    },
    {
      id: 'open-coaching',
      label: 'Open Patient Coaching',
      href: '/tenant/patient-coaching'
    },
    {
      id: 'open-report',
      label: 'Open Clinician Report',
      href: `/tenant/reports/patient/${ref}`
    },
    {
      id: 'open-import-history',
      label: 'Open Import History',
      href: '/tenant/import-history'
    },
    {
      id: 'open-action-center',
      label: 'Open ATLAS Action Center',
      href: '/tenant/atlas/action-center'
    }
  ];
}

async function resolvePatientContext(patientRef) {
  const rawRef = normalizeText(patientRef) || 'patient@raftop.local';

  const base = {
    patientId: /^\d+$/.test(rawRef) ? rawRef : null,
    userId: null,
    email: rawRef.includes('@') ? rawRef : 'patient@raftop.local',
    fullName: 'Patient User'
  };

  if (!(await tableExists(db, 'patients'))) {
    return base;
  }

  const columns = await getColumns(db, 'patients');
  const idCol = firstExisting(columns, ['id', 'patient_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const nameCol = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  let row = null;

  if (idCol && /^\d+$/.test(rawRef)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE ${q(idCol)}::text = $1 LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row && emailCol && rawRef.includes('@')) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE LOWER(${q(emailCol)}) = LOWER($1) LIMIT 1`,
      [String(rawRef)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row) {
    return base;
  }

  return {
    patientId: idCol ? row[idCol] : base.patientId,
    userId: userIdCol ? row[userIdCol] || null : null,
    email: emailCol ? row[emailCol] || base.email : base.email,
    fullName: (nameCol ? row[nameCol] : null) || base.fullName
  };
}

async function loadPatientSignals(patientEmail) {
  if (!(await tableExists(db, 'patient_signals'))) {
    return [];
  }

  const columns = await getColumns(db, 'patient_signals');
  const idCol = firstExisting(columns, ['id', 'signal_id']);
  const titleCol = firstExisting(columns, ['title', 'subject', 'name']);
  const kindCol = firstExisting(columns, ['kind', 'type', 'signal_type']);
  const statusCol = firstExisting(columns, ['status']);
  const metadataCol = firstExisting(columns, ['metadata', 'meta', 'payload']);
  const emailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const createdAtCol = firstExisting(columns, ['created_at', 'submitted_at', 'date']);

  if (!emailCol || !patientEmail) return [];

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM patient_signals
      WHERE LOWER(${q(emailCol)}) = LOWER($1)
      ORDER BY ${q(createdAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT 50
    `,
    [String(patientEmail)]
  );

  if (result.error) return [];

  return (result.rows || []).map((row, index) => ({
    id: idCol ? String(row[idCol]) : `signal-${index + 1}`,
    title: titleCol ? row[titleCol] || 'Patient Signal' : 'Patient Signal',
    kind: safeLower(kindCol ? row[kindCol] : '') || '',
    status: safeLower(statusCol ? row[statusCol] : 'open') || 'open',
    createdAt: createdAtCol ? row[createdAtCol] || null : null,
    metadata: safeJsonParse(metadataCol ? row[metadataCol] : null, {})
  }));
}

async function resolveTasksTable() {
  const candidates = ['tasks', 'tenant_tasks', 'followup_tasks'];

  for (const candidate of candidates) {
    if (await tableExists(db, candidate)) {
      return candidate;
    }
  }

  return null;
}

async function loadPatientTasks(patientEmail, patientId = null) {
  const tableName = await resolveTasksTable();

  if (!tableName) return [];

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'task_id']);
  const titleCol = firstExisting(columns, ['title', 'task_title', 'name']);
  const statusCol = firstExisting(columns, ['status', 'task_status']);
  const priorityCol = firstExisting(columns, ['priority', 'severity']);
  const notesCol = firstExisting(columns, ['notes', 'comment']);
  const assignedToCol = firstExisting(columns, ['assigned_to', 'owner']);
  const dueAtCol = firstExisting(columns, ['due_at', 'scheduled_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at', 'created_at']);

  const where = [];
  const params = [];

  const patientEmailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const patientIdCol = firstExisting(columns, ['patient_id']);

  if (patientEmailCol && patientEmail) {
    params.push(String(patientEmail));
    where.push(`LOWER(${q(patientEmailCol)}) = LOWER($${params.length})`);
  }

  if (patientIdCol && patientId) {
    params.push(String(patientId));
    where.push(`${q(patientIdCol)}::text = $${params.length}`);
  }

  if (notesCol && patientEmail) {
    params.push(`%patient_email=${String(patientEmail)}%`);
    where.push(`${q(notesCol)} ILIKE $${params.length}`);
  }

  if (!where.length) return [];

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE ${where.join(' OR ')}
      ORDER BY ${q(updatedAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT 50
    `,
    params
  );

  if (result.error) return [];

  return (result.rows || []).map((row, index) => {
    const notes = notesCol ? row[notesCol] || '' : '';
    const meta = parseTaskMetadata(notes);

    return {
      id: idCol ? String(row[idCol]) : `task-${index + 1}`,
      title: titleCol ? row[titleCol] || 'Task' : 'Task',
      status: normalizeTaskStatus(statusCol ? row[statusCol] : 'pending'),
      priority: normalizeTaskPriority(priorityCol ? row[priorityCol] : 'normal'),
      updatedAt: updatedAtCol ? row[updatedAtCol] || null : null,
      dueAt: dueAtCol ? row[dueAtCol] || null : null,
      assignedTo: assignedToCol ? row[assignedToCol] || 'RAFTOP Team' : 'RAFTOP Team',
      notes,
      meta,
      atlasCategory: meta.atlasCategory || null
    };
  });
}

async function loadPatientCoachingAssignments(patientEmail) {
  const candidates = ['patient_coaching_assignments', 'coaching_assignments'];

  let tableName = null;
  for (const candidate of candidates) {
    if (await tableExists(db, candidate)) {
      tableName = candidate;
      break;
    }
  }

  if (!tableName) return [];

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id']);
  const lessonIdCol = firstExisting(columns, ['lesson_id', 'coaching_lesson_id']);
  const statusCol = firstExisting(columns, ['status']);
  const priorityCol = firstExisting(columns, ['priority']);
  const reasonCol = firstExisting(columns, ['trigger_reason', 'reason']);
  const whyCol = firstExisting(columns, ['why_this_lesson', 'why']);
  const emailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const updatedAtCol = firstExisting(columns, ['updated_at', 'assigned_at', 'created_at']);

  if (!emailCol || !patientEmail) return [];

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE LOWER(${q(emailCol)}) = LOWER($1)
      ORDER BY ${q(updatedAtCol || idCol || 'id')} DESC NULLS LAST
      LIMIT 50
    `,
    [String(patientEmail)]
  );

  if (result.error) return [];

  return (result.rows || []).map((row, index) => ({
    id: idCol ? String(row[idCol]) : `coach-${index + 1}`,
    lessonId: lessonIdCol ? String(row[lessonIdCol]) : `lesson-${index + 1}`,
    status: safeLower(statusCol ? row[statusCol] : 'assigned') || 'assigned',
    priority: normalizeTaskPriority(priorityCol ? row[priorityCol] : 'normal'),
    triggerReason: reasonCol ? row[reasonCol] || '' : '',
    whyThisLesson: whyCol ? row[whyCol] || '' : '',
    updatedAt: updatedAtCol ? row[updatedAtCol] || null : null
  }));
}

function buildSummary(reportData, tasks, signals, coaching, syncStatus) {
  return {
    riskLevel: reportData?.currentReport?.atlasRecommendation?.riskLevel || 'low',
    usageHours: reportData?.currentReport?.summary?.usageHours ?? 0,
    ahi: reportData?.currentReport?.summary?.ahi ?? 0,
    leakRate: reportData?.currentReport?.summary?.leakRate ?? 0,
    minSpo2: reportData?.currentReport?.summary?.minSpo2 ?? 0,
    openSignals: signals.filter((item) => ['open', 'priority', 'logged'].includes(item.status)).length,
    unresolvedTasks: tasks.filter((item) => !['done', 'resolved', 'closed', 'completed', 'cancelled'].includes(item.status)).length,
    coachingOpen: coaching.filter((item) => ['assigned', 'in_progress'].includes(item.status)).length,
    syncState: syncStatus?.syncHealth?.state || syncStatus?.status || 'unknown'
  };
}

function buildTimeline(tasks, signals, coaching, syncStatus, reportData) {
  const items = [];

  for (const signal of signals.slice(0, 5)) {
    items.push({
      id: `signal-${signal.id}`,
      type: 'signal',
      title: signal.title,
      subtitle: signal.kind || 'signal',
      createdAt: signal.createdAt,
      tone: signal.kind === 'issue' ? 'danger' : 'warning'
    });
  }

  for (const task of tasks.slice(0, 5)) {
    items.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      subtitle: `${task.priority} • ${task.status}`,
      createdAt: task.updatedAt,
      tone: task.priority === 'critical' ? 'danger' : task.priority === 'warning' ? 'warning' : 'neutral'
    });
  }

  for (const item of coaching.slice(0, 5)) {
    items.push({
      id: `coaching-${item.id}`,
      type: 'coaching',
      title: item.lessonId,
      subtitle: `${item.priority} • ${item.status}`,
      createdAt: item.updatedAt,
      tone: item.priority === 'critical' ? 'danger' : 'warning'
    });
  }

  if (syncStatus?.latestJob) {
    items.push({
      id: `import-${syncStatus.latestJob.id}`,
      type: 'import',
      title: syncStatus.latestJob.sourceType || 'import',
      subtitle: syncStatus.latestJob.status || 'unknown',
      createdAt: syncStatus.latestJob.createdAt,
      tone: safeLower(syncStatus.latestJob.status) === 'failed' ? 'danger' : 'success'
    });
  }

  if (reportData?.currentReport) {
    items.push({
      id: `report-${reportData.currentReport.id}`,
      type: 'report',
      title: reportData.currentReport.title,
      subtitle: reportData.currentReport.reportType || 'clinician',
      createdAt: reportData.currentReport.generatedAt,
      tone: 'neutral'
    });
  }

  return items
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 12);
}

function generateTaskId() {
  return `manual_task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getColumnTypeMap(tableName) {
  const result = await querySafe(
    db,
    `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
    [tableName]
  );

  if (result.error) return {};

  return (result.rows || []).reduce((acc, row) => {
    acc[row.column_name] = row.data_type;
    return acc;
  }, {});
}

function isIntegerType(type) {
  return ['integer', 'bigint', 'smallint'].includes(safeLower(type));
}

async function createManualTaskForPatient(patientRef, payload = {}) {
  const patient = await resolvePatientContext(patientRef);
  const tableName = await resolveTasksTable();

  if (!tableName) {
    throw new Error('No tasks table found.');
  }

  const columns = await getColumns(db, tableName);
  const typeMap = await getColumnTypeMap(tableName);

  const idCol = firstExisting(columns, ['id', 'task_id']);
  const titleCol = firstExisting(columns, ['title', 'task_title', 'name']);
  const statusCol = firstExisting(columns, ['status', 'task_status']);
  const priorityCol = firstExisting(columns, ['priority', 'severity']);
  const patientEmailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const assignedToCol = firstExisting(columns, ['assigned_to', 'owner']);
  const notesCol = firstExisting(columns, ['notes', 'comment']);
  const dueAtCol = firstExisting(columns, ['due_at', 'scheduled_at']);
  const createdAtCol = firstExisting(columns, ['created_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);

  const title = normalizeText(payload.title) || `Manual follow-up for ${patient.fullName || patient.email}`;
  const priority = normalizeTaskPriority(payload.priority || 'warning');
  const status = normalizeTaskStatus(payload.status || 'pending');
  const assignedTo = normalizeText(payload.assignedTo) || 'RAFTOP Team';
  const atlasCategory = normalizeText(payload.atlasCategory) || 'MANUAL_FOLLOWUP';
  const noteText = normalizeText(payload.notes) || 'Manual task created from Patient Orchestrator.';
  const dueAt = normalizeText(payload.dueAt) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const insertPairs = [];

  if (idCol && !isIntegerType(typeMap[idCol])) {
    insertPairs.push([idCol, generateTaskId()]);
  }

  if (titleCol) insertPairs.push([titleCol, title]);
  if (statusCol) insertPairs.push([statusCol, status]);
  if (priorityCol) insertPairs.push([priorityCol, priority]);
  if (patientEmailCol && patient.email) insertPairs.push([patientEmailCol, patient.email]);
  if (patientIdCol && patient.patientId) insertPairs.push([patientIdCol, patient.patientId]);
  if (assignedToCol) insertPairs.push([assignedToCol, assignedTo]);
  if (dueAtCol) insertPairs.push([dueAtCol, dueAt]);

  if (notesCol) {
    insertPairs.push([
      notesCol,
      [
        '[PATIENT_ORCHESTRATOR_TASK]',
        `patient_email=${patient.email || ''}`,
        `category=${atlasCategory}`,
        noteText,
        '[/PATIENT_ORCHESTRATOR_TASK]'
      ].join('\n')
    ]);
  }

  if (createdAtCol) insertPairs.push([createdAtCol, now]);
  if (updatedAtCol) insertPairs.push([updatedAtCol, now]);

  if (!insertPairs.length) {
    throw new Error('No compatible columns found for manual task insert.');
  }

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);
  const returnIdCol = firstExisting(columns, ['id', 'task_id']);

  const result = await querySafe(
    db,
    `
      INSERT INTO ${tableName} (${insertColumns})
      VALUES (${placeholders})
      ${returnIdCol ? `RETURNING ${q(returnIdCol)}::text AS id` : ''}
    `,
    values
  );

  if (result.error) {
    throw new Error(result.error.message || 'Failed to create manual task.');
  }

  return {
    id: result.rows?.[0]?.id || null,
    title,
    priority,
    status,
    patientEmail: patient.email
  };
}

async function getTenantPatientOrchestrator(patientRef) {
  const patient = await resolvePatientContext(patientRef);

  let reportData = { currentReport: null, history: [] };
  let syncStatus = {
    status: 'missing',
    syncHealth: {
      state: 'missing',
      hoursSinceLastSync: null
    },
    latestJob: null
  };

  try {
    reportData = await patientReportService.getTenantPatientReport(patient.email);
  } catch (_error) {
    reportData = { currentReport: null, history: [] };
  }

  try {
    syncStatus = await patientIngestionService.getPatientSyncStatus({
      id: patient.userId,
      userId: patient.userId,
      email: patient.email,
      name: patient.fullName,
      fullName: patient.fullName,
      role: 'patient'
    });
  } catch (_error) {
    syncStatus = {
      status: 'missing',
      syncHealth: {
        state: 'missing',
        hoursSinceLastSync: null
      },
      latestJob: null
    };
  }

  const [signals, tasks, coaching] = await Promise.all([
    loadPatientSignals(patient.email),
    loadPatientTasks(patient.email, patient.patientId),
    loadPatientCoachingAssignments(patient.email)
  ]);

  return {
    patient,
    summary: buildSummary(reportData, tasks, signals, coaching, syncStatus),
    shortcuts: buildShortcutList(patient.email),
    report: reportData?.currentReport || null,
    reportHistory: reportData?.history || [],
    syncStatus,
    signals: signals.slice(0, 10),
    tasks: tasks.slice(0, 10),
    coaching: coaching.slice(0, 10),
    timeline: buildTimeline(tasks, signals, coaching, syncStatus, reportData)
  };
}

module.exports = {
  getTenantPatientOrchestrator,
  createManualTaskForPatient
};