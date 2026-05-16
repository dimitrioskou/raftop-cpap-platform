const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

const patientNightAnalysisService = require('./patientNightAnalysisService');
const patientOverlayService = require('./patientOverlayService');

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

  throw new Error('Could not resolve database client in patientCoachingEngineService.');
}

const db = resolveDb();

const LESSON_CATALOG = [
  {
    id: 'mask_fit_foundation',
    title: 'Mask Fit Foundation',
    description: 'Γρήγορος οδηγός για εφαρμογή μάσκας, straps και έλεγχο seal.',
    estimatedMinutes: 6,
    theme: 'mask'
  },
  {
    id: 'dryness_relief_protocol',
    title: 'Dryness Relief Protocol',
    description: 'Μικρό protocol για dryness, humidification και comfort optimization.',
    estimatedMinutes: 5,
    theme: 'comfort'
  },
  {
    id: 'first_4_hours_protocol',
    title: 'First 4 Hours Protocol',
    description: 'Σχέδιο προσαρμογής για να περάσεις σταθερά το όριο των 4 ωρών.',
    estimatedMinutes: 7,
    theme: 'adherence'
  },
  {
    id: 'fragmented_sleep_reset',
    title: 'Fragmented Sleep Reset',
    description: 'Βήματα για interruptions, awakenings και βελτίωση της συνέχειας του session.',
    estimatedMinutes: 6,
    theme: 'sleep_continuity'
  },
  {
    id: 'residual_events_checkin',
    title: 'Residual Events Check-In',
    description: 'Εκπαιδευτικό micro-lesson για residual events και πότε να ζητήσεις review.',
    estimatedMinutes: 5,
    theme: 'clinical'
  },
  {
    id: 'stability_maintenance',
    title: 'Stability Maintenance',
    description: 'Σύντομο maintenance lesson όταν η θεραπεία είναι σταθερή.',
    estimatedMinutes: 4,
    theme: 'maintenance'
  }
];

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

function buildIdentityConditions(columns, refs) {
  const conditions = [];
  const params = [];

  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);

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

  return { conditions, params };
}

async function resolvePatientContext(user) {
  const context = {
    patientId: null,
    email: normalizeText(user?.email),
    userId: user?.userId || user?.id || null,
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
    email: context.email || (emailCol ? row[emailCol] : null),
    userId: context.userId,
    fullName: (nameCol ? row[nameCol] : null) || context.fullName
  };
}

function getLessonById(lessonId) {
  return LESSON_CATALOG.find((item) => item.id === lessonId) || {
    id: lessonId,
    title: lessonId,
    description: 'Coaching lesson',
    estimatedMinutes: 5,
    theme: 'general'
  };
}

function deriveRecommendedLessons(nightData, overlayData) {
  const night = nightData?.night || {};
  const flags = nightData?.flags || {};
  const latestJournal = overlayData?.journal?.latest || {};
  const symptoms = Array.isArray(latestJournal.symptoms)
    ? latestJournal.symptoms.map((item) => safeLower(item))
    : [];

  const results = [];

  if (flags.highLeak || flags.maskSealConcern || symptoms.includes('mask_discomfort')) {
    results.push({
      lessonId: 'mask_fit_foundation',
      priority: flags.highLeak ? 'critical' : 'warning',
      triggerReason: 'Υπάρχει αυξημένο leak ή concern για mask seal.',
      whyThisLesson: 'Η σωστή εφαρμογή μάσκας μειώνει leak, dryness και discomfort.'
    });
  }

  if (symptoms.includes('dryness') || toNumber(night.leakRate, 0) > 18) {
    results.push({
      lessonId: 'dryness_relief_protocol',
      priority: toNumber(night.leakRate, 0) > 24 ? 'warning' : 'normal',
      triggerReason: 'Καταγράφηκε dryness ή elevated leak pattern.',
      whyThisLesson: 'Η dry comfort παρέμβαση βοηθά στη διατήρηση της θεραπείας.'
    });
  }

  if (flags.lowUsage || toNumber(night.usageHours, 0) < 4) {
    results.push({
      lessonId: 'first_4_hours_protocol',
      priority: toNumber(night.usageHours, 0) < 2.5 ? 'critical' : 'warning',
      triggerReason: 'Η χρήση της θεραπείας είναι κάτω από το therapeutic target.',
      whyThisLesson: 'Ο στόχος είναι να σταθεροποιηθεί πρώτα η διάρκεια χρήσης.'
    });
  }

  if (flags.fragmentedSleep || symptoms.includes('frequent_awakenings')) {
    results.push({
      lessonId: 'fragmented_sleep_reset',
      priority: 'warning',
      triggerReason: 'Υπάρχουν interruptions ή frequent awakenings.',
      whyThisLesson: 'Η ασυνέχεια της νύχτας συχνά ρίχνει adherence και tolerance.'
    });
  }

  if (flags.residualAhiRisk || toNumber(night.ahi, 0) > 5) {
    results.push({
      lessonId: 'residual_events_checkin',
      priority: 'warning',
      triggerReason: 'Το residual AHI παραμένει αυξημένο.',
      whyThisLesson: 'Χρειάζεται καλύτερη κατανόηση για το πότε απαιτείται clinician review.'
    });
  }

  if (!results.length) {
    results.push({
      lessonId: 'stability_maintenance',
      priority: 'normal',
      triggerReason: 'Η νύχτα φαίνεται γενικά σταθερή χωρίς major issues.',
      whyThisLesson: 'Το maintenance coaching βοηθά να μη χαθεί η συνέπεια.'
    });
  }

  const unique = [];
  const seen = new Set();

  for (const item of results) {
    if (seen.has(item.lessonId)) continue;
    seen.add(item.lessonId);
    unique.push(item);
  }

  return unique.map((item, index) => {
    const lesson = getLessonById(item.lessonId);

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      theme: lesson.theme,
      priority: item.priority,
      triggerReason: item.triggerReason,
      whyThisLesson: item.whyThisLesson,
      order: index + 1
    };
  });
}

async function resolveAssignmentTable() {
  const candidates = ['patient_coaching_assignments', 'coaching_assignments'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

async function resolveEventsTable() {
  const candidates = ['patient_coaching_events', 'coaching_events'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

async function loadAssignmentMap(refs) {
  const tableName = await resolveAssignmentTable();

  if (!tableName) {
    return {};
  }

  const columns = await getColumns(db, tableName);
  const lessonIdCol = firstExisting(columns, ['lesson_id', 'coaching_lesson_id']);
  const statusCol = firstExisting(columns, ['status']);
  const priorityCol = firstExisting(columns, ['priority']);
  const reasonCol = firstExisting(columns, ['trigger_reason', 'reason']);
  const whyCol = firstExisting(columns, ['why_this_lesson', 'why']);
  const startedAtCol = firstExisting(columns, ['started_at']);
  const completedAtCol = firstExisting(columns, ['completed_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);
  const assignedAtCol = firstExisting(columns, ['assigned_at', 'created_at']);

  if (!lessonIdCol) {
    return {};
  }

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length) {
    return {};
  }

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE ${conditions.join(' OR ')}
      ORDER BY ${updatedAtCol ? `${q(updatedAtCol)} DESC` : `${q(assignedAtCol || lessonIdCol)} DESC`}
      LIMIT 100
    `,
    params
  );

  const map = {};

  for (const row of result.rows || []) {
    const lessonId = String(row[lessonIdCol]);
    if (!lessonId || map[lessonId]) continue;

    map[lessonId] = {
      status: safeLower(statusCol ? row[statusCol] : 'assigned') || 'assigned',
      priority: safeLower(priorityCol ? row[priorityCol] : 'normal') || 'normal',
      triggerReason: reasonCol ? row[reasonCol] || null : null,
      whyThisLesson: whyCol ? row[whyCol] || null : null,
      startedAt: startedAtCol ? row[startedAtCol] || null : null,
      completedAt: completedAtCol ? row[completedAtCol] || null : null,
      lastActionAt: (updatedAtCol ? row[updatedAtCol] : null) || (assignedAtCol ? row[assignedAtCol] : null) || null
    };
  }

  return map;
}

function mergeLessonsWithAssignments(recommendedLessons, assignmentMap) {
  return recommendedLessons.map((lesson) => {
    const assignment = assignmentMap[lesson.id];

    return {
      ...lesson,
      status: assignment?.status || 'assigned',
      priority: assignment?.priority || lesson.priority || 'normal',
      triggerReason: assignment?.triggerReason || lesson.triggerReason,
      whyThisLesson: assignment?.whyThisLesson || lesson.whyThisLesson,
      startedAt: assignment?.startedAt || null,
      completedAt: assignment?.completedAt || null,
      lastActionAt: assignment?.lastActionAt || null,
      source: assignment ? 'stored_assignment' : 'rules_engine'
    };
  });
}

function buildSummary(lessons) {
  return {
    total: lessons.length,
    recommended: lessons.filter((item) => item.status === 'assigned').length,
    inProgress: lessons.filter((item) => item.status === 'in_progress').length,
    completed: lessons.filter((item) => item.status === 'completed').length,
    critical: lessons.filter((item) => item.priority === 'critical').length
  };
}

async function getPatientCoachingDashboard(user) {
  const patientContext = await resolvePatientContext(user);
  const nightData = await patientNightAnalysisService.getNightAnalysis(user, null);
  const overlayData = await patientOverlayService.getOverlayData(user, nightData.selectedDate);

  const recommendedLessons = deriveRecommendedLessons(nightData, overlayData);
  const assignmentMap = await loadAssignmentMap({
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  });

  const lessons = mergeLessonsWithAssignments(recommendedLessons, assignmentMap);

  return {
    patient: {
      fullName: patientContext.fullName,
      email: patientContext.email
    },
    summary: buildSummary(lessons),
    context: {
      selectedDate: nightData.selectedDate,
      usageHours: nightData.night?.usageHours ?? 0,
      ahi: nightData.night?.ahi ?? 0,
      leakRate: nightData.night?.leakRate ?? 0,
      latestSymptoms: overlayData.journal?.latest?.symptoms || []
    },
    lessons
  };
}

async function writeCoachingEvent(refs, lessonId, action, metadata = {}) {
  const tableName = await resolveEventsTable();

  if (!tableName) {
    return;
  }

  const columns = await getColumns(db, tableName);
  const insertPairs = [];

  const idCol = firstExisting(columns, ['event_id']);
  const lessonIdCol = firstExisting(columns, ['lesson_id', 'coaching_lesson_id']);
  const actionCol = firstExisting(columns, ['action', 'event_type']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const metadataCol = firstExisting(columns, ['metadata', 'payload']);
  const createdAtCol = firstExisting(columns, ['created_at']);

  if (idCol) insertPairs.push([idCol, `coach_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`]);
  if (lessonIdCol) insertPairs.push([lessonIdCol, lessonId]);
  if (actionCol) insertPairs.push([actionCol, action]);
  if (patientIdCol && normalizeText(refs.patientId)) insertPairs.push([patientIdCol, String(refs.patientId)]);
  if (userIdCol && normalizeText(refs.userId)) insertPairs.push([userIdCol, String(refs.userId)]);
  if (emailCol && normalizeText(refs.email)) insertPairs.push([emailCol, String(refs.email)]);
  if (metadataCol) insertPairs.push([metadataCol, JSON.stringify(metadata)]);
  if (createdAtCol) insertPairs.push([createdAtCol, new Date().toISOString()]);

  if (!insertPairs.length) {
    return;
  }

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);

  await querySafe(
    db,
    `
      INSERT INTO ${tableName} (${insertColumns})
      VALUES (${placeholders})
    `,
    values
  );
}

async function markLessonState(user, lessonId, targetStatus) {
  const patientContext = await resolvePatientContext(user);
  const refs = {
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  };

  const lesson = getLessonById(lessonId);
  const dashboard = await getPatientCoachingDashboard(user);
  const recommended = dashboard.lessons.find((item) => item.id === lessonId) || {
    ...lesson,
    priority: 'normal',
    triggerReason: 'Manual coaching state update',
    whyThisLesson: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes
  };

  const tableName = await resolveAssignmentTable();

  if (!tableName) {
    const now = new Date().toISOString();

    return {
      ...recommended,
      status: targetStatus,
      startedAt: targetStatus === 'in_progress' || targetStatus === 'completed' ? now : null,
      completedAt: targetStatus === 'completed' ? now : null,
      lastActionAt: now,
      source: 'synthetic_assignment'
    };
  }

  const columns = await getColumns(db, tableName);
  const lessonIdCol = firstExisting(columns, ['lesson_id', 'coaching_lesson_id']);
  const statusCol = firstExisting(columns, ['status']);
  const priorityCol = firstExisting(columns, ['priority']);
  const reasonCol = firstExisting(columns, ['trigger_reason', 'reason']);
  const whyCol = firstExisting(columns, ['why_this_lesson', 'why']);
  const startedAtCol = firstExisting(columns, ['started_at']);
  const completedAtCol = firstExisting(columns, ['completed_at']);
  const updatedAtCol = firstExisting(columns, ['updated_at']);
  const assignedAtCol = firstExisting(columns, ['assigned_at', 'created_at']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);

  if (!lessonIdCol) {
    throw new Error('Lesson id column missing in coaching assignments table');
  }

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length) {
    throw new Error('Cannot resolve patient identity for coaching assignment');
  }

  params.push(String(lessonId));

  const existing = await querySafe(
    db,
    `
      SELECT *
      FROM ${tableName}
      WHERE (${conditions.join(' OR ')})
        AND ${q(lessonIdCol)}::text = $${params.length}
      LIMIT 1
    `,
    params
  );

  const now = new Date().toISOString();
  const row = existing.rows?.[0] || null;

  if (row) {
    const updatePairs = [];

    if (statusCol) updatePairs.push([statusCol, targetStatus]);
    if (priorityCol) updatePairs.push([priorityCol, recommended.priority || 'normal']);
    if (reasonCol) updatePairs.push([reasonCol, recommended.triggerReason || '']);
    if (whyCol) updatePairs.push([whyCol, recommended.whyThisLesson || '']);
    if (startedAtCol && (targetStatus === 'in_progress' || targetStatus === 'completed')) {
      updatePairs.push([startedAtCol, row[startedAtCol] || now]);
    }
    if (completedAtCol && targetStatus === 'completed') {
      updatePairs.push([completedAtCol, now]);
    }
    if (updatedAtCol) updatePairs.push([updatedAtCol, now]);

    const assignments = updatePairs.map(([column], index) => `${q(column)} = $${index + 1}`).join(', ');
    const values = updatePairs.map(([, value]) => value);
    values.push(row[lessonIdCol]);

    const result = await querySafe(
      db,
      `
        UPDATE ${tableName}
        SET ${assignments}
        WHERE ${q(lessonIdCol)}::text = $${values.length}
        RETURNING *
      `,
      values
    );

    await writeCoachingEvent(refs, lessonId, targetStatus, {
      triggerReason: recommended.triggerReason || null
    });

    const updatedRow = result.rows?.[0] || row;

    return {
      ...recommended,
      status: targetStatus,
      startedAt: startedAtCol ? updatedRow[startedAtCol] || now : null,
      completedAt: completedAtCol ? updatedRow[completedAtCol] || null : null,
      lastActionAt: updatedAtCol ? updatedRow[updatedAtCol] || now : now,
      source: 'stored_assignment'
    };
  }

  const insertPairs = [];

  if (lessonIdCol) insertPairs.push([lessonIdCol, lessonId]);
  if (statusCol) insertPairs.push([statusCol, targetStatus]);
  if (priorityCol) insertPairs.push([priorityCol, recommended.priority || 'normal']);
  if (reasonCol) insertPairs.push([reasonCol, recommended.triggerReason || '']);
  if (whyCol) insertPairs.push([whyCol, recommended.whyThisLesson || '']);
  if (patientIdCol && normalizeText(refs.patientId)) insertPairs.push([patientIdCol, String(refs.patientId)]);
  if (userIdCol && normalizeText(refs.userId)) insertPairs.push([userIdCol, String(refs.userId)]);
  if (emailCol && normalizeText(refs.email)) insertPairs.push([emailCol, String(refs.email)]);
  if (startedAtCol && (targetStatus === 'in_progress' || targetStatus === 'completed')) insertPairs.push([startedAtCol, now]);
  if (completedAtCol && targetStatus === 'completed') insertPairs.push([completedAtCol, now]);
  if (assignedAtCol) insertPairs.push([assignedAtCol, now]);
  if (updatedAtCol) insertPairs.push([updatedAtCol, now]);

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

  await writeCoachingEvent(refs, lessonId, targetStatus, {
    triggerReason: recommended.triggerReason || null
  });

  const insertedRow = result.rows?.[0];

  return {
    ...recommended,
    status: targetStatus,
    startedAt: startedAtCol ? insertedRow?.[startedAtCol] || now : null,
    completedAt: completedAtCol ? insertedRow?.[completedAtCol] || null : null,
    lastActionAt: updatedAtCol ? insertedRow?.[updatedAtCol] || now : now,
    source: 'stored_assignment'
  };
}

async function listTenantPatientCoachingOverview() {
  const assignmentTable = await resolveAssignmentTable();

  if (assignmentTable) {
    const columns = await getColumns(db, assignmentTable);
    const lessonIdCol = firstExisting(columns, ['lesson_id', 'coaching_lesson_id']);
    const statusCol = firstExisting(columns, ['status']);
    const priorityCol = firstExisting(columns, ['priority']);
    const reasonCol = firstExisting(columns, ['trigger_reason', 'reason']);
    const whyCol = firstExisting(columns, ['why_this_lesson', 'why']);
    const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
    const updatedAtCol = firstExisting(columns, ['updated_at']);
    const assignedAtCol = firstExisting(columns, ['assigned_at', 'created_at']);

    const result = await querySafe(
      db,
      `
        SELECT *
        FROM ${assignmentTable}
        ORDER BY ${updatedAtCol ? `${q(updatedAtCol)} DESC NULLS LAST` : `${q(assignedAtCol || lessonIdCol)} DESC`}
        LIMIT 200
      `
    );

    const items = (result.rows || []).map((row, index) => {
      const lesson = getLessonById(String(row[lessonIdCol]));
      return {
        id: `${String(row[lessonIdCol])}-${index + 1}`,
        lessonId: lesson.id,
        title: lesson.title,
        patientEmail: emailCol ? row[emailCol] || 'unknown@patient.local' : 'unknown@patient.local',
        status: safeLower(statusCol ? row[statusCol] : 'assigned') || 'assigned',
        priority: safeLower(priorityCol ? row[priorityCol] : 'normal') || 'normal',
        triggerReason: reasonCol ? row[reasonCol] || '' : '',
        whyThisLesson: whyCol ? row[whyCol] || lesson.description : lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        lastActionAt: (updatedAtCol ? row[updatedAtCol] : null) || (assignedAtCol ? row[assignedAtCol] : null) || null
      };
    });

    return {
      summary: {
        total: items.length,
        assigned: items.filter((item) => item.status === 'assigned').length,
        inProgress: items.filter((item) => item.status === 'in_progress').length,
        completed: items.filter((item) => item.status === 'completed').length,
        critical: items.filter((item) => item.priority === 'critical').length
      },
      items
    };
  }

  const fallbackItems = [];
  const hasSignals = await tableExists(db, 'patient_signals');

  if (hasSignals) {
    const columns = await getColumns(db, 'patient_signals');
    const titleCol = firstExisting(columns, ['title', 'subject', 'name']);
    const kindCol = firstExisting(columns, ['kind', 'type', 'signal_type']);
    const statusCol = firstExisting(columns, ['status']);
    const emailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
    const metadataCol = firstExisting(columns, ['metadata', 'meta', 'payload']);
    const createdAtCol = firstExisting(columns, ['created_at', 'submitted_at', 'date']);

    const result = await querySafe(
      db,
      `
        SELECT *
        FROM patient_signals
        ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'}
        LIMIT 50
      `
    );

    const seen = new Set();

    for (const row of result.rows || []) {
      const email = emailCol ? row[emailCol] || null : null;
      if (!email || seen.has(String(email).toLowerCase())) continue;
      seen.add(String(email).toLowerCase());

      const kind = safeLower(kindCol ? row[kindCol] : '');
      const title = titleCol ? row[titleCol] || 'Patient signal' : 'Patient signal';
      const status = safeLower(statusCol ? row[statusCol] : 'open');
      const rawMeta = metadataCol ? row[metadataCol] : null;

      let metadata = {};
      if (rawMeta && typeof rawMeta === 'object') {
        metadata = rawMeta;
      } else if (typeof rawMeta === 'string') {
        try {
          metadata = JSON.parse(rawMeta);
        } catch (_error) {
          metadata = {};
        }
      }

      let lessonId = 'stability_maintenance';
      let priority = 'normal';
      let reason = 'General stability coaching';

      if (kind === 'issue') {
        if (safeLower(metadata.issueType).includes('dry') || safeLower(title).includes('dry')) {
          lessonId = 'dryness_relief_protocol';
        } else {
          lessonId = 'mask_fit_foundation';
        }

        priority = status === 'priority' ? 'critical' : 'warning';
        reason = title;
      } else if (kind === 'callback') {
        lessonId = 'first_4_hours_protocol';
        priority = 'warning';
        reason = 'Callback requested indicates extra support need';
      }

      const lesson = getLessonById(lessonId);

      fallbackItems.push({
        id: `${lessonId}-${String(email)}`,
        lessonId,
        title: lesson.title,
        patientEmail: String(email),
        status: 'assigned',
        priority,
        triggerReason: reason,
        whyThisLesson: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        lastActionAt: createdAtCol ? row[createdAtCol] || null : null
      });
    }
  }

  if (!fallbackItems.length) {
    fallbackItems.push({
      id: 'fallback-mask-fit',
      lessonId: 'mask_fit_foundation',
      title: 'Mask Fit Foundation',
      patientEmail: 'patient@raftop.local',
      status: 'assigned',
      priority: 'warning',
      triggerReason: 'Fallback coaching dataset',
      whyThisLesson: 'Visibility sample for provider review.',
      estimatedMinutes: 6,
      lastActionAt: new Date().toISOString()
    });
  }

  return {
    summary: {
      total: fallbackItems.length,
      assigned: fallbackItems.filter((item) => item.status === 'assigned').length,
      inProgress: fallbackItems.filter((item) => item.status === 'in_progress').length,
      completed: fallbackItems.filter((item) => item.status === 'completed').length,
      critical: fallbackItems.filter((item) => item.priority === 'critical').length
    },
    items: fallbackItems
  };
}

module.exports = {
  getPatientCoachingDashboard,
  markLessonState,
  listTenantPatientCoachingOverview
};