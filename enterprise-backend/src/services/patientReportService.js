const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

const patientNightAnalysisService = require('./patientNightAnalysisService');
const patientOverlayService = require('./patientOverlayService');
const patientCoachingEngineService = require('./patientCoachingEngineService');

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
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client in patientReportService.');
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

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function safeJsonParse(raw, fallback = null) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function buildIdentityConditions(columns, refs) {
  const conditions = [];
  const params = [];

  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);

  if (patientIdCol && normalizeText(refs.patientId)) {
    params.push(String(refs.patientId));
    conditions.push(`${q(patientIdCol)}::text = $${params.length}`);
  }

  if (userIdCol && normalizeText(refs.userId)) {
    params.push(String(refs.userId));
    conditions.push(`${q(userIdCol)}::text = $${params.length}`);
  }

  if (emailCol && normalizeText(refs.email)) {
    params.push(String(refs.email));
    conditions.push(`LOWER(${q(emailCol)}) = LOWER($${params.length})`);
  }

  if (recipientEmailCol && normalizeText(refs.email)) {
    params.push(String(refs.email));
    conditions.push(`LOWER(${q(recipientEmailCol)}) = LOWER($${params.length})`);
  }

  return { conditions, params };
}

async function resolvePatientContextFromUser(user) {
  const context = {
    patientId: null,
    userId: user?.userId || user?.id || null,
    email: normalizeText(user?.email) || 'patient@raftop.local',
    fullName: normalizeText(user?.name || user?.fullName) || 'Patient User'
  };

  if (!(await tableExists(db, 'patients'))) {
    return context;
  }

  const columns = await getColumns(db, 'patients');
  const idCol = firstExisting(columns, ['id', 'patient_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const nameCol = firstExisting(columns, ['full_name', 'name', 'display_name', 'patient_name']);

  let row = null;

  if (userIdCol && normalizeText(context.userId)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE ${q(userIdCol)}::text = $1 LIMIT 1`,
      [String(context.userId)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row && emailCol && normalizeText(context.email)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients WHERE LOWER(${q(emailCol)}) = LOWER($1) LIMIT 1`,
      [String(context.email)]
    );
    row = result.rows?.[0] || null;
  }

  if (!row) {
    return context;
  }

  return {
    patientId: idCol ? row[idCol] : null,
    userId: context.userId,
    email: context.email || (emailCol ? row[emailCol] : null),
    fullName: (nameCol ? row[nameCol] : null) || context.fullName
  };
}

async function resolvePatientContextFromRef(patientRef) {
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

async function loadSignalsSnapshot(refs) {
  if (!(await tableExists(db, 'patient_signals'))) {
    return {
      total: 0,
      criticalOpen: 0,
      openSignals: [],
      latestSignalAt: null
    };
  }

  const columns = await getColumns(db, 'patient_signals');
  const titleCol = firstExisting(columns, ['title', 'subject', 'name']);
  const kindCol = firstExisting(columns, ['kind', 'type', 'signal_type']);
  const statusCol = firstExisting(columns, ['status']);
  const metadataCol = firstExisting(columns, ['metadata', 'meta', 'payload']);
  const createdAtCol = firstExisting(columns, ['created_at', 'submitted_at', 'date']);

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length) {
    return {
      total: 0,
      criticalOpen: 0,
      openSignals: [],
      latestSignalAt: null
    };
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM patient_signals
      WHERE ${conditions.join(' OR ')}
      ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'}
      LIMIT 50
    `,
    params
  );

  const rows = result.rows || [];

  const mapped = rows.map((row) => {
    const metadata = safeJsonParse(metadataCol ? row[metadataCol] : null, {}) || {};
    const severity = safeLower(metadata.severity || metadata.priority || '');
    const status = safeLower(statusCol ? row[statusCol] : 'open');

    return {
      title: titleCol ? row[titleCol] || 'Patient Signal' : 'Patient Signal',
      kind: safeLower(kindCol ? row[kindCol] : ''),
      status,
      severity,
      createdAt: createdAtCol ? row[createdAtCol] || null : null
    };
  });

  const openSignals = mapped.filter((item) =>
    ['open', 'priority', 'logged'].includes(item.status)
  );

  const criticalOpen = openSignals.filter(
    (item) => item.kind === 'issue' && (item.severity === 'high' || item.status === 'priority')
  ).length;

  return {
    total: mapped.length,
    criticalOpen,
    openSignals: openSignals.slice(0, 5),
    latestSignalAt: mapped[0]?.createdAt || null
  };
}

function parseTaskMetaFromNotes(notes) {
  const text = String(notes || '');

  function extract(pattern) {
    const match = text.match(pattern);
    return match?.[1] ? String(match[1]).trim() : null;
  }

  return {
    atlasCategory: extract(/category=([A-Z0-9_]+)/i),
    signalKind: extract(/signal_kind=([^\n\r]+)/i),
    signalId: extract(/signal_id=([^\n\r]+)/i),
    patientEmail: extract(/patient_email=([^\n\r]+)/i)
  };
}

async function loadTasksSnapshot(refs) {
  const candidates = ['tasks', 'tenant_tasks', 'followup_tasks'];

  let taskTable = null;
  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      taskTable = tableName;
      break;
    }
  }

  if (!taskTable) {
    return {
      total: 0,
      unresolved: 0,
      critical: 0,
      latestTaskAt: null,
      topTasks: []
    };
  }

  const columns = await getColumns(db, taskTable);
  const titleCol = firstExisting(columns, ['title', 'task_title', 'name']);
  const statusCol = firstExisting(columns, ['status', 'task_status']);
  const priorityCol = firstExisting(columns, ['priority', 'severity']);
  const notesCol = firstExisting(columns, ['notes', 'comment']);
  const updatedAtCol = firstExisting(columns, ['updated_at', 'created_at']);
  const patientEmailCol = firstExisting(columns, ['patient_email']);

  const conditions = [];
  const params = [];

  if (patientEmailCol && normalizeText(refs.email)) {
    params.push(String(refs.email));
    conditions.push(`LOWER(${q(patientEmailCol)}) = LOWER($${params.length})`);
  }

  if (!conditions.length && notesCol && normalizeText(refs.email)) {
    params.push(`%patient_email=${String(refs.email)}%`);
    conditions.push(`${q(notesCol)} ILIKE $${params.length}`);
  }

  if (!conditions.length) {
    return {
      total: 0,
      unresolved: 0,
      critical: 0,
      latestTaskAt: null,
      topTasks: []
    };
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${taskTable}
      WHERE ${conditions.join(' OR ')}
      ORDER BY ${updatedAtCol ? `${q(updatedAtCol)} DESC NULLS LAST` : '1 DESC'}
      LIMIT 50
    `,
    params
  );

  const rows = result.rows || [];

  const mapped = rows.map((row) => {
    const notes = notesCol ? row[notesCol] || '' : '';
    const meta = parseTaskMetaFromNotes(notes);
    const status = safeLower(statusCol ? row[statusCol] : 'pending');
    const priority = safeLower(priorityCol ? row[priorityCol] : 'normal');

    return {
      title: titleCol ? row[titleCol] || 'Task' : 'Task',
      status,
      priority,
      updatedAt: updatedAtCol ? row[updatedAtCol] || null : null,
      atlasCategory: meta.atlasCategory || null,
      signalKind: meta.signalKind || null
    };
  });

  const unresolved = mapped.filter(
    (item) => !['done', 'resolved', 'closed', 'completed', 'cancelled'].includes(item.status)
  );

  return {
    total: mapped.length,
    unresolved: unresolved.length,
    critical: unresolved.filter((item) => item.priority === 'critical').length,
    latestTaskAt: mapped[0]?.updatedAt || null,
    topTasks: mapped.slice(0, 5)
  };
}

function buildAtlasRecommendation(nightData, overlayData, coachingData, signalSnapshot, taskSnapshot) {
  const usageHours = toNumber(nightData?.night?.usageHours, 0);
  const ahi = toNumber(nightData?.night?.ahi, 0);
  const leakRate = toNumber(nightData?.night?.leakRate, 0);
  const minSpo2 = toNumber(overlayData?.oximetry?.minSpo2, 95);
  const criticalSignals = toNumber(signalSnapshot?.criticalOpen, 0);
  const criticalTasks = toNumber(taskSnapshot?.critical, 0);
  const coachingInProgress = toNumber(coachingData?.summary?.inProgress, 0);

  let riskLevel = 'low';
  let recommendedNextAction = 'Continue current therapy and routine monitoring.';
  let priorityReason = 'Stable nightly profile without critical workflow blockers.';
  let followupWindow = '7-14 days';

  if (
    criticalSignals > 0 ||
    criticalTasks > 0 ||
    usageHours < 2.5 ||
    leakRate > 28 ||
    minSpo2 < 89
  ) {
    riskLevel = 'high';
    recommendedNextAction = 'Provider review and direct patient follow-up are recommended.';
    priorityReason = 'High-risk signal or unstable therapy/physiology pattern detected.';
    followupWindow = 'within 24h';
  } else if (
    usageHours < 4 ||
    ahi > 5 ||
    leakRate > 20 ||
    minSpo2 < 91 ||
    coachingInProgress > 0
  ) {
    riskLevel = 'medium';
    recommendedNextAction = 'Review coaching adherence, mask fit and nightly trend before next visit.';
    priorityReason = 'Suboptimal therapy pattern needs structured monitoring.';
    followupWindow = 'within 72h';
  }

  return {
    riskLevel,
    recommendedNextAction,
    priorityReason,
    followupWindow
  };
}

function buildPatientSafeSections(nightData, overlayData, coachingData, atlasRecommendation) {
  const symptoms = overlayData?.journal?.latest?.symptoms || [];

  return [
    {
      key: 'therapy_snapshot',
      title: 'Therapy Snapshot',
      items: [
        `Usage: ${nightData?.night?.usageHours ?? 0}h`,
        `AHI: ${nightData?.night?.ahi ?? 0}`,
        `Leak: ${nightData?.night?.leakRate ?? 0}`,
        `Mask Seal: ${nightData?.night?.maskSeal ?? 0}%`
      ]
    },
    {
      key: 'physiology_snapshot',
      title: 'Physiology Snapshot',
      items: [
        `Min SpO2: ${overlayData?.oximetry?.minSpo2 ?? 0}`,
        `Avg SpO2: ${overlayData?.oximetry?.avgSpo2 ?? 0}`,
        `Pulse Avg: ${overlayData?.oximetry?.pulseAvg ?? 0}`,
        `Desaturation Events: ${overlayData?.oximetry?.desaturationEvents ?? 0}`
      ]
    },
    {
      key: 'journal_snapshot',
      title: 'Journal Snapshot',
      items: [
        `Symptoms: ${symptoms.length ? symptoms.join(', ') : 'none logged'}`,
        `Sleep Quality: ${overlayData?.journal?.latest?.sleepQuality ?? 0}/10`,
        `Energy Level: ${overlayData?.journal?.latest?.energyLevel ?? 0}/10`,
        `Notes: ${overlayData?.journal?.latest?.notes || 'none'}`
      ]
    },
    {
      key: 'next_steps',
      title: 'Next Steps',
      items: [
        atlasRecommendation.recommendedNextAction,
        `Suggested follow-up window: ${atlasRecommendation.followupWindow}`
      ]
    },
    {
      key: 'coaching',
      title: 'Coaching',
      items: (coachingData?.lessons || []).slice(0, 3).map(
        (lesson) => `${lesson.title} (${lesson.status})`
      )
    }
  ];
}

function buildClinicianSections(nightData, overlayData, coachingData, signalSnapshot, taskSnapshot, atlasRecommendation) {
  return [
    {
      key: 'clinical_snapshot',
      title: 'Clinical Snapshot',
      items: [
        `Usage ${nightData?.night?.usageHours ?? 0}h`,
        `AHI ${nightData?.night?.ahi ?? 0}`,
        `Leak ${nightData?.night?.leakRate ?? 0}`,
        `Pressure ${nightData?.night?.avgPressure ?? 0}`,
        `Min SpO2 ${overlayData?.oximetry?.minSpo2 ?? 0}`,
        `Pulse Avg ${overlayData?.oximetry?.pulseAvg ?? 0}`
      ]
    },
    {
      key: 'workflow_snapshot',
      title: 'Workflow Snapshot',
      items: [
        `Signals total: ${signalSnapshot.total}`,
        `Critical open signals: ${signalSnapshot.criticalOpen}`,
        `Tasks total: ${taskSnapshot.total}`,
        `Unresolved tasks: ${taskSnapshot.unresolved}`,
        `Critical tasks: ${taskSnapshot.critical}`
      ]
    },
    {
      key: 'coaching_snapshot',
      title: 'Coaching Snapshot',
      items: [
        `Lessons total: ${coachingData?.summary?.total ?? 0}`,
        `In progress: ${coachingData?.summary?.inProgress ?? 0}`,
        `Completed: ${coachingData?.summary?.completed ?? 0}`,
        ...(coachingData?.lessons || []).slice(0, 3).map(
          (lesson) => `${lesson.title} • ${lesson.status} • ${lesson.priority}`
        )
      ]
    },
    {
      key: 'atlas_recommendation',
      title: 'ATLAS Recommendation',
      items: [
        `Risk Level: ${atlasRecommendation.riskLevel}`,
        `Next Action: ${atlasRecommendation.recommendedNextAction}`,
        `Priority Reason: ${atlasRecommendation.priorityReason}`,
        `Follow-up Window: ${atlasRecommendation.followupWindow}`
      ]
    }
  ];
}

async function resolveReportsTable() {
  const candidates = ['patient_reports', 'reports'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

async function saveReportIfPossible(refs, report) {
  const tableName = await resolveReportsTable();

  if (!tableName) {
    return {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: 'synthetic'
    };
  }

  const columns = await getColumns(db, tableName);
  const insertPairs = [];

  const idCol = firstExisting(columns, ['report_id']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const reportTypeCol = firstExisting(columns, ['report_type', 'type']);
  const titleCol = firstExisting(columns, ['title', 'report_title']);
  const summaryCol = firstExisting(columns, ['summary_json', 'summary']);
  const payloadCol = firstExisting(columns, ['payload_json', 'payload', 'report_payload']);
  const riskCol = firstExisting(columns, ['risk_level']);
  const createdAtCol = firstExisting(columns, ['created_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);

  if (idCol) insertPairs.push([idCol, `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`]);
  if (patientIdCol && normalizeText(refs.patientId)) insertPairs.push([patientIdCol, String(refs.patientId)]);
  if (userIdCol && normalizeText(refs.userId)) insertPairs.push([userIdCol, String(refs.userId)]);
  if (emailCol && normalizeText(refs.email)) insertPairs.push([emailCol, String(refs.email)]);
  if (reportTypeCol) insertPairs.push([reportTypeCol, report.reportType]);
  if (titleCol) insertPairs.push([titleCol, report.title]);
  if (summaryCol) insertPairs.push([summaryCol, JSON.stringify(report.summary)]);
  if (payloadCol) insertPairs.push([payloadCol, JSON.stringify(report)]);
  if (riskCol) insertPairs.push([riskCol, report.atlasRecommendation?.riskLevel || 'low']);
  if (createdAtCol) insertPairs.push([createdAtCol, new Date().toISOString()]);
  if (updatedAtCol) insertPairs.push([updatedAtCol, new Date().toISOString()]);

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);

  const result = await querySafe(
    db,
    `
      INSERT INTO ${tableName} (${insertColumns})
      VALUES (${placeholders})
      RETURNING *
    `,
    values
  );

  const inserted = result.rows?.[0];

  return {
    ...report,
    id:
      inserted?.report_id ||
      inserted?.id ||
      `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: tableName
  };
}

async function loadReportHistory(refs, limit = 20) {
  const tableName = await resolveReportsTable();

  if (!tableName) {
    return [];
  }

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'report_id']);
  const reportTypeCol = firstExisting(columns, ['report_type', 'type']);
  const titleCol = firstExisting(columns, ['title', 'report_title']);
  const riskCol = firstExisting(columns, ['risk_level']);
  const createdAtCol = firstExisting(columns, ['created_at', 'updated_at']);

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length) {
    return [];
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE ${conditions.join(' OR ')}
      ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC NULLS LAST` : '1 DESC'}
      LIMIT ${Number(limit) || 20}
    `,
    params
  );

  return (result.rows || []).map((row, index) => ({
    id: idCol ? String(row[idCol]) : `report-history-${index + 1}`,
    reportType: reportTypeCol ? row[reportTypeCol] || 'report' : 'report',
    title: titleCol ? row[titleCol] || 'Patient Report' : 'Patient Report',
    riskLevel: riskCol ? row[riskCol] || 'low' : 'low',
    createdAt: createdAtCol ? row[createdAtCol] || null : null
  }));
}

function buildBaseSummary(patientContext, nightData, overlayData, coachingData, signalSnapshot, taskSnapshot, atlasRecommendation) {
  return {
    patientName: patientContext.fullName,
    patientEmail: patientContext.email,
    selectedDate: nightData.selectedDate,
    usageHours: round(nightData?.night?.usageHours, 1),
    ahi: round(nightData?.night?.ahi, 1),
    leakRate: round(nightData?.night?.leakRate, 1),
    minSpo2: round(overlayData?.oximetry?.minSpo2, 1),
    coachingInProgress: coachingData?.summary?.inProgress ?? 0,
    openSignals: signalSnapshot?.openSignals?.length ?? 0,
    unresolvedTasks: taskSnapshot?.unresolved ?? 0,
    riskLevel: atlasRecommendation?.riskLevel || 'low'
  };
}

async function buildReportForRefs(patientContext, reportType, persist = false) {
  const userProxy = {
    id: patientContext.userId,
    userId: patientContext.userId,
    email: patientContext.email,
    name: patientContext.fullName,
    fullName: patientContext.fullName,
    role: 'patient'
  };

  const nightData = await patientNightAnalysisService.getNightAnalysis(userProxy, null);
  const overlayData = await patientOverlayService.getOverlayData(userProxy, nightData.selectedDate);
  const coachingData = await patientCoachingEngineService.getPatientCoachingDashboard(userProxy);

  const refs = {
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  };

  const signalSnapshot = await loadSignalsSnapshot(refs);
  const taskSnapshot = await loadTasksSnapshot(refs);
  const atlasRecommendation = buildAtlasRecommendation(
    nightData,
    overlayData,
    coachingData,
    signalSnapshot,
    taskSnapshot
  );

  const sections =
    reportType === 'clinician'
      ? buildClinicianSections(
          nightData,
          overlayData,
          coachingData,
          signalSnapshot,
          taskSnapshot,
          atlasRecommendation
        )
      : buildPatientSafeSections(
          nightData,
          overlayData,
          coachingData,
          atlasRecommendation
        );

  const report = {
    reportType,
    title:
      reportType === 'clinician'
        ? `Clinician Review Report — ${patientContext.fullName}`
        : `Patient Summary Report — ${patientContext.fullName}`,
    generatedAt: new Date().toISOString(),
    patient: {
      fullName: patientContext.fullName,
      email: patientContext.email,
      patientId: patientContext.patientId || null
    },
    summary: buildBaseSummary(
      patientContext,
      nightData,
      overlayData,
      coachingData,
      signalSnapshot,
      taskSnapshot,
      atlasRecommendation
    ),
    atlasRecommendation,
    sections,
    context: {
      nightly: nightData,
      overlay: overlayData,
      coaching: coachingData,
      signals: signalSnapshot,
      tasks: taskSnapshot
    }
  };

  if (!persist) {
    return {
      ...report,
      id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      source: 'runtime'
    };
  }

  return saveReportIfPossible(refs, report);
}

async function getPatientReportDashboard(user) {
  const patientContext = await resolvePatientContextFromUser(user);
  const currentReport = await buildReportForRefs(patientContext, 'patient_safe', false);
  const history = await loadReportHistory({
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  }, 20);

  return {
    currentReport,
    history
  };
}

async function generatePatientReport(user) {
  const patientContext = await resolvePatientContextFromUser(user);
  const savedReport = await buildReportForRefs(patientContext, 'patient_safe', true);

  return savedReport;
}

async function getTenantPatientReport(patientRef) {
  const patientContext = await resolvePatientContextFromRef(patientRef);
  const currentReport = await buildReportForRefs(patientContext, 'clinician', false);
  const history = await loadReportHistory({
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  }, 20);

  return {
    patientContext,
    currentReport,
    history
  };
}

async function generateTenantPatientReport(patientRef) {
  const patientContext = await resolvePatientContextFromRef(patientRef);
  const savedReport = await buildReportForRefs(patientContext, 'clinician', true);

  return savedReport;
}

module.exports = {
  getPatientReportDashboard,
  generatePatientReport,
  getTenantPatientReport,
  generateTenantPatientReport
};