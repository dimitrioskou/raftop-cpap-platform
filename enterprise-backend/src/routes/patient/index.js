const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientSignalService = require('../../services/patientSignalService');
const patientWorkflowAutomationService = require('../../services/patientWorkflowAutomationService');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../../utils/routeDbHelpers');

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../db',
    '../config/db'
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

  throw new Error('Could not resolve database client in patient routes.');
}

const db = resolveDb();
const router = express.Router();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function requirePatient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized'
    });
  }

  if (normalizeRole(req.user.role) !== 'patient') {
    return res.status(403).json({
      ok: false,
      message: 'Patient access only'
    });
  }

  return next();
}

function pickFirst(row, candidates) {
  for (const key of candidates) {
    if (key && typeof row?.[key] !== 'undefined' && row?.[key] !== null) {
      return row[key];
    }
  }
  return null;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function safeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function getIdentityRefs(user, metrics = null) {
  return {
    patientId: metrics?.patientId || null,
    userId: user?.userId || user?.id || null,
    email: normalizeText(user?.email)
  };
}

function buildIdentityConditions(columns, refs) {
  const conditions = [];
  const params = [];

  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
  const senderEmailCol = firstExisting(columns, ['sender_email', 'from_email']);

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

  if (senderEmailCol && normalizeText(refs.email)) {
    params.push(String(refs.email));
    conditions.push(`LOWER(${q(senderEmailCol)}) = LOWER($${params.length})`);
  }

  return { conditions, params };
}

function rowMatchesRefs(row, columns, refs) {
  const candidateValues = [
    pickFirst(row, [firstExisting(columns, ['patient_id'])]),
    pickFirst(row, [firstExisting(columns, ['user_id'])]),
    pickFirst(row, [firstExisting(columns, ['email', 'patient_email', 'user_email'])]),
    pickFirst(row, [firstExisting(columns, ['recipient_email', 'to_email'])]),
    pickFirst(row, [firstExisting(columns, ['sender_email', 'from_email'])])
  ]
    .filter((value) => value !== null && typeof value !== 'undefined')
    .map((value) => String(value).trim().toLowerCase());

  const expected = [refs.patientId, refs.userId, refs.email]
    .filter((value) => normalizeText(value))
    .map((value) => String(value).trim().toLowerCase());

  return expected.some((value) => candidateValues.includes(value));
}

async function resolvePatientRow(user) {
  const exists = await tableExists(db, 'patients');

  if (!exists) {
    return null;
  }

  const columns = await getColumns(db, 'patients');
  const idColumn = firstExisting(columns, ['id', 'patient_id']);
  const userIdColumn = firstExisting(columns, ['user_id']);
  const emailColumn = firstExisting(columns, ['email', 'patient_email', 'user_email']);

  if (userIdColumn && normalizeText(user?.userId || user?.id)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients p WHERE p.${q(userIdColumn)}::text = $1 LIMIT 1`,
      [String(user.userId || user.id)]
    );

    if (!result.error && result.rows?.[0]) {
      return {
        row: result.rows[0],
        columns,
        idColumn
      };
    }
  }

  if (emailColumn && normalizeText(user?.email)) {
    const result = await querySafe(
      db,
      `SELECT * FROM patients p WHERE LOWER(p.${q(emailColumn)}) = LOWER($1) LIMIT 1`,
      [String(user.email)]
    );

    if (!result.error && result.rows?.[0]) {
      return {
        row: result.rows[0],
        columns,
        idColumn
      };
    }
  }

  return null;
}

function computeMyAirScore(metrics) {
  let score = 35;

  const avgUsage = Number(metrics.avgUsageHours || 0);
  const adherenceRate = Number(metrics.adherenceRate || 0);
  const ahi = Number(metrics.ahi || 0);
  const leak = Number(metrics.leakRate || 0);
  const streak = Number(metrics.streakDays || 0);

  if (avgUsage >= 6) score += 20;
  else if (avgUsage >= 4) score += 12;
  else if (avgUsage >= 2) score += 5;

  if (adherenceRate >= 85) score += 18;
  else if (adherenceRate >= 70) score += 10;
  else if (adherenceRate >= 50) score += 5;

  if (ahi > 0 && ahi < 5) score += 12;
  else if (ahi < 10) score += 6;

  if (leak > 0 && leak <= 24) score += 8;
  else if (leak <= 35) score += 4;

  if (streak >= 14) score += 7;
  else if (streak >= 7) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function loadPatientMetrics(user) {
  const patientRef = await resolvePatientRow(user);

  const basePatient = patientRef?.row || null;
  const patientIdColumn = patientRef?.idColumn || null;
  const patientId = patientIdColumn ? basePatient?.[patientIdColumn] : null;

  let usageRows = [];

  if (await tableExists(db, 'cpap_usage_logs')) {
    const usageColumns = await getColumns(db, 'cpap_usage_logs');
    const dateCol = firstExisting(usageColumns, ['usage_date', 'date', 'recorded_at', 'created_at']);
    const hoursCol = firstExisting(usageColumns, ['usage_hours', 'hours', 'hours_used']);
    const ahiCol = firstExisting(usageColumns, ['ahi']);
    const leakCol = firstExisting(usageColumns, ['leak_rate', 'leak', 'mask_leak']);

    const refs = getIdentityRefs(user, { patientId });
    const { conditions, params } = buildIdentityConditions(usageColumns, refs);

    if (conditions.length) {
      const result = await querySafe(
        db,
        `
          SELECT
            ${dateCol ? `${q(dateCol)} AS usage_date,` : `NULL AS usage_date,`}
            ${hoursCol ? `${q(hoursCol)} AS usage_hours,` : `NULL AS usage_hours,`}
            ${ahiCol ? `${q(ahiCol)} AS ahi,` : `NULL AS ahi,`}
            ${leakCol ? `${q(leakCol)} AS leak_rate` : `NULL AS leak_rate`}
          FROM cpap_usage_logs
          WHERE ${conditions.join(' OR ')}
          ORDER BY ${dateCol ? `${q(dateCol)} DESC` : '1 DESC'}
          LIMIT 30
        `,
        params
      );

      if (!result.error) {
        usageRows = result.rows || [];
      }
    }
  }

  if (!usageRows.length && await tableExists(db, 'devices')) {
    const deviceColumns = await getColumns(db, 'devices');
    const hoursCol = firstExisting(deviceColumns, ['monthly_hours', 'usage_hours', 'hours_used']);
    const ahiCol = firstExisting(deviceColumns, ['ahi']);
    const leakCol = firstExisting(deviceColumns, ['leak_rate', 'leak']);
    const updatedAtCol = firstExisting(deviceColumns, ['updated_at', 'last_sync_at', 'created_at']);

    const refs = getIdentityRefs(user, { patientId });
    const { conditions, params } = buildIdentityConditions(deviceColumns, refs);

    if (conditions.length) {
      const result = await querySafe(
        db,
        `
          SELECT
            ${updatedAtCol ? `${q(updatedAtCol)} AS usage_date,` : `NULL AS usage_date,`}
            ${hoursCol ? `${q(hoursCol)} AS usage_hours,` : `NULL AS usage_hours,`}
            ${ahiCol ? `${q(ahiCol)} AS ahi,` : `NULL AS ahi,`}
            ${leakCol ? `${q(leakCol)} AS leak_rate` : `NULL AS leak_rate`}
          FROM devices
          WHERE ${conditions.join(' OR ')}
          ORDER BY ${updatedAtCol ? `${q(updatedAtCol)} DESC` : '1 DESC'}
          LIMIT 7
        `,
        params
      );

      if (!result.error) {
        usageRows = result.rows || [];
      }
    }
  }

  const nights = usageRows.length;
  const avgUsageHours =
    nights > 0
      ? round(
          usageRows.reduce((sum, row) => sum + toNumber(row.usage_hours), 0) / nights,
          1
        )
      : 0;

  const adherenceNights = usageRows.filter((row) => toNumber(row.usage_hours) >= 4).length;
  const adherenceRate = nights > 0 ? round((adherenceNights / nights) * 100, 1) : 0;

  const ahiValues = usageRows
    .map((row) => toNumber(row.ahi, NaN))
    .filter((value) => Number.isFinite(value) && value > 0);

  const leakValues = usageRows
    .map((row) => toNumber(row.leak_rate, NaN))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const ahi = ahiValues.length
    ? round(ahiValues.reduce((sum, value) => sum + value, 0) / ahiValues.length, 1)
    : 0;

  const leakRate = leakValues.length
    ? round(leakValues.reduce((sum, value) => sum + value, 0) / leakValues.length, 1)
    : 0;

  let streakDays = 0;
  for (const row of usageRows) {
    if (toNumber(row.usage_hours) >= 4) streakDays += 1;
    else break;
  }

  const therapyStatus =
    avgUsageHours >= 4 && adherenceRate >= 70
      ? 'on_track'
      : avgUsageHours >= 2
      ? 'at_risk'
      : 'critical';

  const fullName = pickFirst(basePatient, [
    'full_name',
    'name',
    'display_name',
    'patient_name'
  ]);

  const maskType = pickFirst(basePatient, ['mask_type', 'cpap_mask_type']);
  const machineModel = pickFirst(basePatient, ['device_model', 'cpap_device_model']);
  const nextGoal =
    avgUsageHours >= 4
      ? 'Συνέχισε σταθερή χρήση >4 ώρες/νύχτα.'
      : 'Στόχος: τουλάχιστον 4 ώρες χρήσης κάθε βράδυ.';

  const metrics = {
    patientId: patientId || null,
    fullName: fullName || 'Patient User',
    email: user?.email || null,
    avgUsageHours,
    adherenceRate,
    adherenceNights,
    totalNights: nights,
    ahi,
    leakRate,
    streakDays,
    therapyStatus,
    machineModel: machineModel || 'CPAP Device',
    maskType: maskType || 'Standard mask',
    nextGoal,
    myAirScore: 0,
    lastSyncAt: usageRows[0]?.usage_date || null,
    trend: usageRows
      .slice()
      .reverse()
      .map((row, index) => ({
        x: index + 1,
        date: row.usage_date,
        usageHours: round(toNumber(row.usage_hours), 1),
        ahi: round(toNumber(row.ahi), 1),
        leakRate: round(toNumber(row.leak_rate), 1)
      }))
  };

  metrics.myAirScore = computeMyAirScore(metrics);

  return metrics;
}

function buildActionCatalog(signalsSummary) {
  return [
    {
      key: 'request_callback',
      title: 'Request callback',
      description: 'Ζήτησε επικοινωνία από την ομάδα υποστήριξης.',
      recommended: signalsSummary.openCount === 0
    },
    {
      key: 'report_issue',
      title: 'Report issue',
      description: 'Δήλωσε ενόχληση, διαρροή μάσκας ή άλλο πρόβλημα θεραπείας.',
      recommended: true
    },
    {
      key: 'acknowledge_therapy',
      title: 'Acknowledge therapy',
      description: 'Επιβεβαίωσε ότι συνεχίζεις συστηματικά τη θεραπεία.',
      recommended: false
    }
  ];
}

function mapNotificationRow(row, columns, index = 0) {
  const idCol = firstExisting(columns, ['id', 'notification_id']);
  const titleCol = firstExisting(columns, ['title', 'subject']);
  const bodyCol = firstExisting(columns, ['body', 'message', 'content']);
  const typeCol = firstExisting(columns, ['type', 'notification_type']);
  const statusCol = firstExisting(columns, ['status']);
  const readAtCol = firstExisting(columns, ['read_at']);
  const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);

  return {
    id: pickFirst(row, [idCol]) || `notif-${index + 1}`,
    title: pickFirst(row, [titleCol]) || 'Notification',
    body: pickFirst(row, [bodyCol]) || '',
    type: pickFirst(row, [typeCol]) || 'system',
    status: pickFirst(row, [statusCol]) || 'active',
    read: Boolean(pickFirst(row, [readAtCol])),
    createdAt: pickFirst(row, [createdAtCol]) || null
  };
}

function mapMessageRow(row, columns, index = 0) {
  const idCol = firstExisting(columns, ['id', 'message_id']);
  const subjectCol = firstExisting(columns, ['subject', 'title']);
  const bodyCol = firstExisting(columns, ['body', 'message', 'content']);
  const statusCol = firstExisting(columns, ['status']);
  const readAtCol = firstExisting(columns, ['read_at']);
  const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
  const senderNameCol = firstExisting(columns, ['sender_name', 'from_name', 'sender_email', 'from_email']);
  const senderEmailCol = firstExisting(columns, ['sender_email', 'from_email']);
  const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
  const replyToCol = firstExisting(columns, ['reply_to_id', 'parent_message_id']);

  return {
    id: pickFirst(row, [idCol]) || `msg-${index + 1}`,
    subject: pickFirst(row, [subjectCol]) || 'Message',
    body: pickFirst(row, [bodyCol]) || '',
    sender: pickFirst(row, [senderNameCol]) || 'RAFTOP Care Team',
    senderEmail: pickFirst(row, [senderEmailCol]) || null,
    recipientEmail: pickFirst(row, [recipientEmailCol]) || null,
    status: pickFirst(row, [statusCol]) || 'sent',
    read: Boolean(pickFirst(row, [readAtCol])),
    createdAt: pickFirst(row, [createdAtCol]) || null,
    replyToId: pickFirst(row, [replyToCol]) || null
  };
}

async function loadPatientNotifications(user, metrics, recentSignals) {
  const refs = getIdentityRefs(user, metrics);
  let items = [];

  if (await tableExists(db, 'notifications')) {
    const columns = await getColumns(db, 'notifications');
    const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
    const { conditions, params } = buildIdentityConditions(columns, refs);

    if (conditions.length) {
      const result = await querySafe(
        db,
        `
          SELECT *
          FROM notifications
          WHERE ${conditions.join(' OR ')}
          ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'}
          LIMIT 50
        `,
        params
      );

      if (!result.error) {
        items = (result.rows || []).map((row, index) => mapNotificationRow(row, columns, index));
      }
    }
  }

  if (!items.length) {
    if (metrics?.therapyStatus === 'critical') {
      items.push({
        id: 'fallback-therapy-critical',
        title: 'Therapy attention needed',
        body: 'Η χρήση θεραπείας είναι χαμηλή και χρειάζεται ενίσχυση.',
        type: 'therapy',
        status: 'active',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    if (Number(metrics?.leakRate || 0) > 24) {
      items.push({
        id: 'fallback-leak',
        title: 'Mask leak alert',
        body: 'Η διαρροή μάσκας είναι αυξημένη και ίσως χρειάζεται έλεγχος εφαρμογής.',
        type: 'mask',
        status: 'active',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    recentSignals.slice(0, 3).forEach((signal, index) => {
      items.push({
        id: `fallback-signal-${index + 1}`,
        title: signal.title || 'Recent activity',
        body: signal.description || '',
        type: signal.kind || 'signal',
        status: signal.status || 'active',
        read: false,
        createdAt: signal.createdAt || new Date().toISOString()
      });
    });
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return {
    summary: {
      total: items.length,
      unreadCount,
      activeCount: items.filter((item) => item.status !== 'archived').length
    },
    items
  };
}

async function loadPatientGoals(user, metrics) {
  let items = [];

  if (await tableExists(db, 'patient_goals')) {
    const columns = await getColumns(db, 'patient_goals');
    const idCol = firstExisting(columns, ['id', 'goal_id']);
    const titleCol = firstExisting(columns, ['title', 'name']);
    const descCol = firstExisting(columns, ['description', 'details']);
    const statusCol = firstExisting(columns, ['status']);
    const progressCol = firstExisting(columns, ['progress_percent', 'progress']);
    const targetCol = firstExisting(columns, ['target_value', 'target']);
    const createdAtCol = firstExisting(columns, ['created_at']);

    const refs = getIdentityRefs(user, metrics);
    const { conditions, params } = buildIdentityConditions(columns, refs);

    if (conditions.length) {
      const result = await querySafe(
        db,
        `
          SELECT *
          FROM patient_goals
          WHERE ${conditions.join(' OR ')}
          ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'}
          LIMIT 20
        `,
        params
      );

      if (!result.error) {
        items = (result.rows || []).map((row, index) => ({
          id: pickFirst(row, [idCol]) || `goal-${index + 1}`,
          title: pickFirst(row, [titleCol]) || 'Goal',
          description: pickFirst(row, [descCol]) || '',
          status: pickFirst(row, [statusCol]) || 'active',
          progressPercent: round(toNumber(pickFirst(row, [progressCol]), 0), 1),
          targetValue: pickFirst(row, [targetCol]) || null
        }));
      }
    }
  }

  if (!items.length) {
    const usageProgress = Math.max(0, Math.min(100, round((Number(metrics.avgUsageHours || 0) / 4) * 100, 1)));
    const streakProgress = Math.max(0, Math.min(100, round((Number(metrics.streakDays || 0) / 14) * 100, 1)));
    const leakProgress = Math.max(0, Math.min(100, round(((24 - Number(metrics.leakRate || 0)) / 24) * 100, 1)));

    items = [
      {
        id: 'goal-usage',
        title: 'Use CPAP at least 4h/night',
        description: 'Στόχος συμμόρφωσης για σταθερή θεραπεία.',
        status: usageProgress >= 100 ? 'completed' : 'active',
        progressPercent: usageProgress,
        targetValue: '4h/night'
      },
      {
        id: 'goal-streak',
        title: 'Build a 14-day streak',
        description: 'Στόχος συνεχόμενης καλής χρήσης.',
        status: streakProgress >= 100 ? 'completed' : 'active',
        progressPercent: streakProgress,
        targetValue: '14 days'
      },
      {
        id: 'goal-leak',
        title: 'Keep mask leak under control',
        description: 'Στόχος για καλύτερη εφαρμογή μάσκας.',
        status: leakProgress >= 100 ? 'completed' : 'active',
        progressPercent: leakProgress,
        targetValue: '<24 leak'
      }
    ];
  }

  return {
    summary: {
      total: items.length,
      activeCount: items.filter((item) => item.status !== 'completed').length,
      completedCount: items.filter((item) => item.status === 'completed').length
    },
    items
  };
}

async function loadPatientMessages(user, metrics, recentSignals) {
  const refs = getIdentityRefs(user, metrics);
  let items = [];

  const candidateTables = ['patient_messages', 'messages'];

  for (const tableName of candidateTables) {
    if (!(await tableExists(db, tableName))) continue;

    const columns = await getColumns(db, tableName);
    const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
    const { conditions, params } = buildIdentityConditions(columns, refs);

    if (!conditions.length) continue;

    const result = await querySafe(
      db,
      `
        SELECT *
        FROM ${tableName}
        WHERE ${conditions.join(' OR ')}
        ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'}
        LIMIT 50
      `,
      params
    );

    if (!result.error) {
      items = (result.rows || []).map((row, index) => mapMessageRow(row, columns, index));
    }

    if (items.length) break;
  }

  if (!items.length) {
    items = [
      {
        id: 'msg-welcome',
        subject: 'Welcome to RAFTOP CPAP CARE',
        body: 'Η ομάδα είναι διαθέσιμη για υποστήριξη θεραπείας και follow-up όταν το χρειαστείς.',
        sender: 'RAFTOP Care Team',
        senderEmail: 'provider@raftop.local',
        recipientEmail: user?.email || 'patient@raftop.local',
        status: 'sent',
        read: false,
        createdAt: new Date().toISOString(),
        replyToId: null
      }
    ];

    if (recentSignals[0]) {
      items.push({
        id: 'msg-last-signal',
        subject: `Update: ${recentSignals[0].title || 'Recent activity'}`,
        body: recentSignals[0].description || 'Έχει καταγραφεί νέα δραστηριότητα στο patient action center.',
        sender: 'RAFTOP Care Team',
        senderEmail: 'provider@raftop.local',
        recipientEmail: user?.email || 'patient@raftop.local',
        status: 'sent',
        read: false,
        createdAt: recentSignals[0].createdAt || new Date().toISOString(),
        replyToId: null
      });
    }
  }

  return {
    summary: {
      total: items.length,
      unreadCount: items.filter((item) => !item.read).length
    },
    items
  };
}

function buildPatientInsights(metrics, signalsSummary) {
  const cards = [];

  cards.push({
    id: 'insight-score',
    title: 'Therapy score',
    tone: metrics.myAirScore >= 80 ? 'success' : metrics.myAirScore >= 60 ? 'warning' : 'danger',
    value: metrics.myAirScore,
    description:
      metrics.myAirScore >= 80
        ? 'Η θεραπεία φαίνεται σταθερή.'
        : metrics.myAirScore >= 60
        ? 'Υπάρχει βάση, αλλά χρειάζεται περισσότερη συνέπεια.'
        : 'Χρειάζεται άμεση ενίσχυση της θεραπευτικής χρήσης.'
  });

  cards.push({
    id: 'insight-usage',
    title: 'Usage insight',
    tone: metrics.avgUsageHours >= 4 ? 'success' : 'warning',
    value: `${metrics.avgUsageHours}h`,
    description:
      metrics.avgUsageHours >= 4
        ? 'Η μέση χρήση είναι κοντά στον θεραπευτικό στόχο.'
        : 'Η μέση χρήση είναι κάτω από τον επιθυμητό στόχο.'
  });

  cards.push({
    id: 'insight-leak',
    title: 'Mask leak insight',
    tone: metrics.leakRate <= 24 ? 'success' : 'warning',
    value: metrics.leakRate,
    description:
      metrics.leakRate <= 24
        ? 'Η διαρροή μάσκας είναι ελεγχόμενη.'
        : 'Η διαρροή μάσκας χρειάζεται προσοχή.'
  });

  if (signalsSummary.unresolvedHighPriorityCount > 0) {
    cards.push({
      id: 'insight-support',
      title: 'Support risk',
      tone: 'danger',
      value: signalsSummary.unresolvedHighPriorityCount,
      description: 'Υπάρχουν unresolved υψηλής προτεραιότητας signals.'
    });
  }

  const recommendations = [
    metrics.avgUsageHours < 4
      ? 'Στόχευσε σε τουλάχιστον 4 ώρες χρήσης κάθε βράδυ.'
      : 'Διατήρησε σταθερό nightly usage.',
    metrics.leakRate > 24
      ? 'Έλεγξε την εφαρμογή της μάσκας για να μειωθεί η διαρροή.'
      : 'Συνέχισε με την τρέχουσα εφαρμογή μάσκας.',
    metrics.ahi > 5
      ? 'Το AHI χρειάζεται πιθανή αξιολόγηση από την ομάδα θεραπείας.'
      : 'Το AHI φαίνεται ικανοποιητικό.'
  ];

  return {
    summary: {
      therapyStatus: metrics.therapyStatus,
      score: metrics.myAirScore,
      adherenceRate: metrics.adherenceRate
    },
    cards,
    recommendations
  };
}

function buildActionCenterPayload(metrics, recentSignals) {
  const summary = patientSignalService.buildSummary(recentSignals);

  return {
    summary,
    recentSignals,
    actions: buildActionCatalog(summary),
    quickActions: [
      {
        key: 'request_callback',
        title: 'Request callback',
        enabled: true
      },
      {
        key: 'report_issue',
        title: 'Report issue',
        enabled: true
      },
      {
        key: 'acknowledge_therapy',
        title: 'Acknowledge therapy',
        enabled: true
      }
    ],
    hints: [
      metrics.avgUsageHours < 4
        ? 'Η χρήση είναι χαμηλή. Ίσως χρειάζεται callback.'
        : 'Η χρήση είναι ικανοποιητική. Συνέχισε σταθερά.',
      metrics.leakRate > 24
        ? 'Υπάρχει πιθανό θέμα μάσκας. Έλεγξε την εφαρμογή ή δήλωσε issue.'
        : 'Δεν φαίνεται σημαντικό θέμα leak αυτή τη στιγμή.'
    ]
  };
}

async function mutateNotificationState(user, notificationId, action) {
  if (!(await tableExists(db, 'notifications'))) {
    return {
      id: notificationId,
      synthetic: true,
      action
    };
  }

  const metrics = await loadPatientMetrics(user);
  const refs = getIdentityRefs(user, metrics);

  const columns = await getColumns(db, 'notifications');
  const idCol = firstExisting(columns, ['id', 'notification_id']);
  const readAtCol = firstExisting(columns, ['read_at']);
  const statusCol = firstExisting(columns, ['status']);

  if (!idCol) {
    throw new Error('Notification id column missing');
  }

  const existing = await querySafe(
    db,
    `SELECT * FROM notifications WHERE ${q(idCol)}::text = $1 LIMIT 1`,
    [String(notificationId)]
  );

  const row = existing.rows?.[0];

  if (!row) {
    throw new Error('Notification not found');
  }

  if (!rowMatchesRefs(row, columns, refs)) {
    throw new Error('Notification access denied');
  }

  const assignments = [];
  const values = [];

  if (action === 'read' && readAtCol) {
    values.push(new Date().toISOString());
    assignments.push(`${q(readAtCol)} = $${values.length}`);
  }

  if (action === 'archive' && statusCol) {
    values.push('archived');
    assignments.push(`${q(statusCol)} = $${values.length}`);
  }

  if (!assignments.length) {
    return mapNotificationRow(row, columns, 0);
  }

  values.push(String(notificationId));

  const result = await querySafe(
    db,
    `
      UPDATE notifications
      SET ${assignments.join(', ')}
      WHERE ${q(idCol)}::text = $${values.length}
      RETURNING *
    `,
    values
  );

  return mapNotificationRow(result.rows?.[0] || row, columns, 0);
}

async function findMessageTable() {
  const candidates = ['patient_messages', 'messages'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

async function mutateMessageReadState(user, messageId) {
  const tableName = await findMessageTable();

  if (!tableName) {
    return {
      id: messageId,
      synthetic: true,
      read: true
    };
  }

  const metrics = await loadPatientMetrics(user);
  const refs = getIdentityRefs(user, metrics);

  const columns = await getColumns(db, tableName);
  const idCol = firstExisting(columns, ['id', 'message_id']);
  const readAtCol = firstExisting(columns, ['read_at']);

  if (!idCol) {
    throw new Error('Message id column missing');
  }

  const existing = await querySafe(
    db,
    `SELECT * FROM ${tableName} WHERE ${q(idCol)}::text = $1 LIMIT 1`,
    [String(messageId)]
  );

  const row = existing.rows?.[0];

  if (!row) {
    throw new Error('Message not found');
  }

  if (!rowMatchesRefs(row, columns, refs)) {
    throw new Error('Message access denied');
  }

  if (!readAtCol) {
    return mapMessageRow(row, columns, 0);
  }

  const result = await querySafe(
    db,
    `
      UPDATE ${tableName}
      SET ${q(readAtCol)} = $1
      WHERE ${q(idCol)}::text = $2
      RETURNING *
    `,
    [new Date().toISOString(), String(messageId)]
  );

  return mapMessageRow(result.rows?.[0] || row, columns, 0);
}

async function insertPatientReply(user, bodyInput) {
  const tableName = await findMessageTable();

  if (!tableName) {
    throw new Error('No message table exists');
  }

  const metrics = await loadPatientMetrics(user);
  const columns = await getColumns(db, tableName);

  const idCol = firstExisting(columns, ['id', 'message_id']);
  const subjectCol = firstExisting(columns, ['subject', 'title']);
  const bodyCol = firstExisting(columns, ['body', 'message', 'content']);
  const statusCol = firstExisting(columns, ['status']);
  const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
  const senderNameCol = firstExisting(columns, ['sender_name', 'from_name']);
  const senderEmailCol = firstExisting(columns, ['sender_email', 'from_email']);
  const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const readAtCol = firstExisting(columns, ['read_at']);
  const replyToCol = firstExisting(columns, ['reply_to_id', 'parent_message_id']);

  const replyToId = normalizeText(bodyInput?.replyToId);
  const subject = normalizeText(bodyInput?.subject) || 'Patient reply';
  const bodyText = normalizeText(bodyInput?.body);

  if (!bodyText) {
    throw new Error('Reply body is required');
  }

  let targetEmail = normalizeText(bodyInput?.toEmail);

  if (!targetEmail && replyToId && idCol) {
    const existing = await querySafe(
      db,
      `SELECT * FROM ${tableName} WHERE ${q(idCol)}::text = $1 LIMIT 1`,
      [String(replyToId)]
    );

    const row = existing.rows?.[0];

    if (row) {
      const sourceSender = normalizeText(pickFirst(row, [senderEmailCol]));
      const sourceRecipient = normalizeText(pickFirst(row, [recipientEmailCol]));
      const myEmail = normalizeText(user?.email);

      if (sourceSender && sourceSender !== myEmail) {
        targetEmail = sourceSender;
      } else if (sourceRecipient && sourceRecipient !== myEmail) {
        targetEmail = sourceRecipient;
      }
    }
  }

  if (!targetEmail) {
    targetEmail = 'care-team@raftop.local';
  }

  const insertPairs = [];

  if (subjectCol) insertPairs.push([subjectCol, subject]);
  if (bodyCol) insertPairs.push([bodyCol, bodyText]);
  if (statusCol) insertPairs.push([statusCol, 'sent']);
  if (createdAtCol) insertPairs.push([createdAtCol, new Date().toISOString()]);
  if (senderNameCol) insertPairs.push([senderNameCol, normalizeText(user?.name) || 'Patient User']);
  if (senderEmailCol) insertPairs.push([senderEmailCol, normalizeText(user?.email) || 'patient@raftop.local']);
  if (recipientEmailCol) insertPairs.push([recipientEmailCol, targetEmail]);
  if (patientIdCol && normalizeText(metrics?.patientId)) insertPairs.push([patientIdCol, String(metrics.patientId)]);
  if (userIdCol && normalizeText(user?.userId || user?.id)) insertPairs.push([userIdCol, String(user.userId || user.id)]);
  if (readAtCol) insertPairs.push([readAtCol, null]);
  if (replyToCol && replyToId) insertPairs.push([replyToCol, replyToId]);

  if (!insertPairs.length) {
    throw new Error('No compatible message columns found');
  }

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);

  const returning = idCol ? 'RETURNING *' : '';

  const result = await querySafe(
    db,
    `
      INSERT INTO ${tableName} (${insertColumns})
      VALUES (${placeholders})
      ${returning}
    `,
    values
  );

  const row = result.rows?.[0];

  if (!row) {
    return {
      id: `synthetic-${Date.now()}`,
      subject,
      body: bodyText,
      sender: normalizeText(user?.name) || 'Patient User',
      senderEmail: normalizeText(user?.email) || 'patient@raftop.local',
      recipientEmail: targetEmail,
      status: 'sent',
      read: false,
      createdAt: new Date().toISOString(),
      replyToId: replyToId || null
    };
  }

  return mapMessageRow(row, columns, 0);
}

async function safeAutoCreateTaskForSignal(user, signal) {
  try {
    return await patientWorkflowAutomationService.autoCreateTaskForSignal(signal, user);
  } catch (error) {
    return {
      ok: false,
      message: error.message || 'Signal automation failed'
    };
  }
}

async function safeAutoCreateTaskForPatientReply(user, message) {
  try {
    return await patientWorkflowAutomationService.autoCreateTaskForPatientReply(message, user);
  } catch (error) {
    return {
      ok: false,
      message: error.message || 'Patient reply automation failed'
    };
  }
}

async function handleRequestCallback(req, res) {
  try {
    const phone = normalizeText(req.body?.phone);
    const preferredWindow = normalizeText(req.body?.preferredWindow);
    const note = normalizeText(req.body?.note);

    const signal = await patientSignalService.createSignal(req.user, {
      kind: 'callback',
      title: 'Callback requested',
      description: [phone ? `Phone: ${phone}` : null, preferredWindow ? `Preferred window: ${preferredWindow}` : null, note]
        .filter(Boolean)
        .join('. '),
      status: 'open',
      source: 'patient_action_center',
      metadata: {
        phone,
        preferredWindow,
        note
      }
    });

    const automation = await safeAutoCreateTaskForSignal(req.user, signal);

    return res.status(201).json({
      ok: true,
      message: 'Callback request submitted',
      data: {
        signal,
        automation
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to submit callback request',
      error: error.message
    });
  }
}

async function handleReportIssue(req, res) {
  try {
    const issueType = normalizeText(req.body?.issueType) || 'general_issue';
    const severity = normalizeText(req.body?.severity) || 'medium';
    const note = normalizeText(req.body?.note);

    const signal = await patientSignalService.createSignal(req.user, {
      kind: 'issue',
      title: `Issue reported: ${issueType}`,
      description: [`Severity: ${severity}`, note].filter(Boolean).join('. '),
      status: severity === 'high' ? 'priority' : 'open',
      source: 'patient_action_center',
      metadata: {
        issueType,
        severity,
        note
      }
    });

    const automation = await safeAutoCreateTaskForSignal(req.user, signal);

    return res.status(201).json({
      ok: true,
      message: 'Issue reported successfully',
      data: {
        signal,
        automation
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to report issue',
      error: error.message
    });
  }
}

async function handleAcknowledgeTherapy(req, res) {
  try {
    const note = normalizeText(req.body?.note);

    const signal = await patientSignalService.createSignal(req.user, {
      kind: 'acknowledge',
      title: 'Therapy commitment acknowledged',
      description: note || 'Patient confirmed ongoing therapy adherence.',
      status: 'logged',
      source: 'patient_action_center',
      metadata: {
        note
      }
    });

    const automation = await safeAutoCreateTaskForSignal(req.user, signal);

    return res.status(201).json({
      ok: true,
      message: 'Therapy acknowledgement submitted',
      data: {
        signal,
        automation
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to acknowledge therapy',
      error: error.message
    });
  }
}

router.use(requireAuth);
router.use(requirePatient);

router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 6 });
    const signalsSummary = patientSignalService.buildSummary(recentSignals);

    return res.json({
      ok: true,
      data: {
        patient: {
          fullName: metrics.fullName,
          email: metrics.email,
          machineModel: metrics.machineModel,
          maskType: metrics.maskType
        },
        metrics,
        signalsSummary,
        recentSignals,
        actions: buildActionCatalog(signalsSummary)
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient dashboard',
      error: error.message
    });
  }
});

router.get('/therapy', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 12 });

    return res.json({
      ok: true,
      data: {
        overview: {
          myAirScore: metrics.myAirScore,
          therapyStatus: metrics.therapyStatus,
          avgUsageHours: metrics.avgUsageHours,
          adherenceRate: metrics.adherenceRate,
          ahi: metrics.ahi,
          leakRate: metrics.leakRate,
          streakDays: metrics.streakDays,
          lastSyncAt: metrics.lastSyncAt
        },
        trend: metrics.trend,
        nextGoal: metrics.nextGoal,
        machine: {
          machineModel: metrics.machineModel,
          maskType: metrics.maskType
        },
        recentSignals
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient therapy data',
      error: error.message
    });
  }
});

router.get('/actions', async (req, res) => {
  try {
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 20 });
    const summary = patientSignalService.buildSummary(recentSignals);

    return res.json({
      ok: true,
      data: {
        summary,
        recentSignals,
        actions: buildActionCatalog(summary)
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient actions',
      error: error.message
    });
  }
});

router.get('/action-center', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 20 });

    return res.json({
      ok: true,
      data: buildActionCenterPayload(metrics, recentSignals)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient action center',
      error: error.message
    });
  }
});

router.get('/insights', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 12 });
    const summary = patientSignalService.buildSummary(recentSignals);

    return res.json({
      ok: true,
      data: buildPatientInsights(metrics, summary)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient insights',
      error: error.message
    });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 10 });
    const payload = await loadPatientNotifications(req.user, metrics, recentSignals);

    return res.json({
      ok: true,
      data: payload
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient notifications',
      error: error.message
    });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const item = await mutateNotificationState(req.user, req.params.id, 'read');

    return res.json({
      ok: true,
      message: 'Notification marked as read',
      data: item
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

router.post('/notifications/:id/archive', async (req, res) => {
  try {
    const item = await mutateNotificationState(req.user, req.params.id, 'archive');

    return res.json({
      ok: true,
      message: 'Notification archived',
      data: item
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to archive notification'
    });
  }
});

router.get('/goals', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const payload = await loadPatientGoals(req.user, metrics);

    return res.json({
      ok: true,
      data: payload
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient goals',
      error: error.message
    });
  }
});

router.get('/messages', async (req, res) => {
  try {
    const metrics = await loadPatientMetrics(req.user);
    const recentSignals = await patientSignalService.listSignalsForPatient(req.user, { limit: 10 });
    const payload = await loadPatientMessages(req.user, metrics, recentSignals);

    return res.json({
      ok: true,
      data: payload
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to load patient messages',
      error: error.message
    });
  }
});

router.post('/messages/:id/read', async (req, res) => {
  try {
    const item = await mutateMessageReadState(req.user, req.params.id);

    return res.json({
      ok: true,
      message: 'Message marked as read',
      data: item
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to mark message as read'
    });
  }
});

router.post('/messages/reply', async (req, res) => {
  try {
    const item = await insertPatientReply(req.user, req.body || {});
    const automation = await safeAutoCreateTaskForPatientReply(req.user, item);

    return res.status(201).json({
      ok: true,
      message: 'Reply sent successfully',
      data: {
        message: item,
        automation
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to send reply'
    });
  }
});

router.post('/messages/:id/reply', async (req, res) => {
  try {
    const item = await insertPatientReply(req.user, {
      ...(req.body || {}),
      replyToId: req.params.id
    });

    const automation = await safeAutoCreateTaskForPatientReply(req.user, item);

    return res.status(201).json({
      ok: true,
      message: 'Reply sent successfully',
      data: {
        message: item,
        automation
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to send reply'
    });
  }
});

router.post('/actions/request-callback', handleRequestCallback);
router.post('/actions/report-issue', handleReportIssue);
router.post('/actions/acknowledge-therapy', handleAcknowledgeTherapy);

router.post('/action-center/request-callback', handleRequestCallback);
router.post('/action-center/report-issue', handleReportIssue);
router.post('/action-center/acknowledge-therapy', handleAcknowledgeTherapy);

module.exports = router;