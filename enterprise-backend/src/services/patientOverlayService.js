const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../utils/routeDbHelpers');

const patientNightAnalysisService = require('./patientNightAnalysisService');

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

  throw new Error('Could not resolve database client in patientOverlayService.');
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

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
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

function buildSyntheticOximetry(dateKey, night) {
  const minSpo2 = night.usageHours >= 5 ? 91 : 88;
  const avgSpo2 = night.usageHours >= 5 ? 94.6 : 92.4;
  const pulseAvg = night.interruptions >= 2 ? 74 : 68;
  const desaturationEvents = night.ahi > 5 ? 7 : night.leakRate > 24 ? 5 : 2;

  return {
    date: dateKey,
    minSpo2,
    avgSpo2,
    pulseAvg,
    desaturationEvents,
    source: 'synthetic_oximetry'
  };
}

function buildSyntheticJournal(dateKey, night) {
  const symptoms = [];
  if (night.leakRate > 24) symptoms.push('mask_discomfort');
  if (night.leakRate > 18) symptoms.push('dryness');
  if (night.interruptions >= 2) symptoms.push('frequent_awakenings');
  if (!symptoms.length) symptoms.push('felt_ok');

  return {
    id: `journal-${dateKey}`,
    date: dateKey,
    symptoms,
    sleepQuality: night.usageHours >= 5 ? 8 : 6,
    energyLevel: night.usageHours >= 5 ? 7 : 5,
    notes:
      night.leakRate > 24
        ? 'Υπήρξε ενόχληση από τη μάσκα.'
        : 'Γενικά αποδεκτή νύχτα θεραπείας.',
    source: 'synthetic_journal'
  };
}

async function loadOximetryForDate(refs, dateKey, night) {
  const exists = await tableExists(db, 'patient_oximetry_logs');

  if (!exists) {
    return buildSyntheticOximetry(dateKey, night);
  }

  const columns = await getColumns(db, 'patient_oximetry_logs');
  const dateCol = firstExisting(columns, ['entry_date', 'date', 'recorded_at', 'created_at']);
  const minSpo2Col = firstExisting(columns, ['min_spo2', 'spo2_min']);
  const avgSpo2Col = firstExisting(columns, ['avg_spo2', 'spo2_avg']);
  const pulseAvgCol = firstExisting(columns, ['pulse_avg', 'avg_pulse', 'heart_rate_avg']);
  const desatCol = firstExisting(columns, ['desaturation_events', 'desats', 'desat_events']);

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!dateCol || !conditions.length) {
    return buildSyntheticOximetry(dateKey, night);
  }

  params.push(dateKey);

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM patient_oximetry_logs
      WHERE (${conditions.join(' OR ')})
        AND ${q(dateCol)}::text LIKE $${params.length} || '%'
      ORDER BY ${q(dateCol)} DESC
      LIMIT 1
    `,
    params
  );

  const row = result.rows?.[0];

  if (!row) {
    return buildSyntheticOximetry(dateKey, night);
  }

  return {
    date: dateKey,
    minSpo2: round(toNumber(minSpo2Col ? row[minSpo2Col] : null, 89), 1),
    avgSpo2: round(toNumber(avgSpo2Col ? row[avgSpo2Col] : null, 94), 1),
    pulseAvg: round(toNumber(pulseAvgCol ? row[pulseAvgCol] : null, 70), 1),
    desaturationEvents: Math.max(0, Math.round(toNumber(desatCol ? row[desatCol] : null, 2))),
    source: 'patient_oximetry_logs'
  };
}

async function loadJournalEntries(refs, dateKey, night, limit = 10) {
  const exists = await tableExists(db, 'patient_journal_entries');

  if (!exists) {
    return [buildSyntheticJournal(dateKey, night)];
  }

  const columns = await getColumns(db, 'patient_journal_entries');
  const idCol = firstExisting(columns, ['id', 'journal_id']);
  const dateCol = firstExisting(columns, ['entry_date', 'date', 'created_at']);
  const symptomsCol = firstExisting(columns, ['symptoms', 'tags']);
  const sleepQualityCol = firstExisting(columns, ['sleep_quality', 'quality_score']);
  const energyCol = firstExisting(columns, ['energy_level', 'morning_energy']);
  const notesCol = firstExisting(columns, ['notes', 'note', 'description']);
  const createdAtCol = firstExisting(columns, ['created_at']);

  const { conditions, params } = buildIdentityConditions(columns, refs);

  if (!conditions.length || !dateCol) {
    return [buildSyntheticJournal(dateKey, night)];
  }

  params.push(dateKey);

  const result = await querySafe(
    db,
    `
      SELECT *
      FROM patient_journal_entries
      WHERE (${conditions.join(' OR ')})
        AND ${q(dateCol)}::text LIKE $${params.length} || '%'
      ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : `${q(dateCol)} DESC`}
      LIMIT ${Number(limit) || 10}
    `,
    params
  );

  const rows = result.rows || [];

  if (!rows.length) {
    return [buildSyntheticJournal(dateKey, night)];
  }

  return rows.map((row, index) => {
    const rawSymptoms = symptomsCol ? row[symptomsCol] : null;
    let symptoms = [];

    if (Array.isArray(rawSymptoms)) {
      symptoms = rawSymptoms.map((item) => String(item));
    } else if (typeof rawSymptoms === 'string') {
      try {
        const parsed = JSON.parse(rawSymptoms);
        if (Array.isArray(parsed)) {
          symptoms = parsed.map((item) => String(item));
        } else {
          symptoms = rawSymptoms.split(',').map((item) => item.trim()).filter(Boolean);
        }
      } catch (_error) {
        symptoms = rawSymptoms.split(',').map((item) => item.trim()).filter(Boolean);
      }
    }

    return {
      id: idCol ? String(row[idCol]) : `journal-${index + 1}`,
      date: formatDateKey(dateCol ? row[dateCol] : dateKey) || dateKey,
      symptoms,
      sleepQuality: round(toNumber(sleepQualityCol ? row[sleepQualityCol] : null, 0), 1),
      energyLevel: round(toNumber(energyCol ? row[energyCol] : null, 0), 1),
      notes: notesCol ? row[notesCol] || '' : '',
      source: 'patient_journal_entries'
    };
  });
}

function buildOverlayTimeline(night, oximetry) {
  const start = new Date(night.sessionStart || `${night.date}T22:30:00.000Z`);
  const points = [];

  for (let i = 0; i < 8; i += 1) {
    const pointDate = new Date(start.getTime() + i * 45 * 60 * 1000);

    points.push({
      label: pointDate.toISOString().slice(11, 16),
      pressure: round(night.avgPressure + (i % 2 === 0 ? 0.3 : -0.2), 1),
      leakRate: round(Math.max(0, night.leakRate + (i % 3 === 0 ? 2.2 : -0.8)), 1),
      spo2: round(Math.max(84, oximetry.avgSpo2 + (i % 4 === 0 ? -1.2 : 0.4)), 1),
      pulse: round(Math.max(52, oximetry.pulseAvg + (i % 4 === 0 ? 5 : -2)), 1)
    });
  }

  return points;
}

function deriveSymptomsSummary(journalEntry) {
  const symptoms = journalEntry?.symptoms || [];

  return {
    total: symptoms.length,
    items: symptoms
  };
}

function buildCorrelations(night, oximetry, journalEntry) {
  const correlations = [];
  const symptoms = (journalEntry?.symptoms || []).map((item) => safeLower(item));
  const hasDryness = symptoms.includes('dryness');
  const hasMaskDiscomfort = symptoms.includes('mask_discomfort');
  const hasAwakenings = symptoms.includes('frequent_awakenings');

  if (night.leakRate > 24 && (hasDryness || hasMaskDiscomfort)) {
    correlations.push({
      type: 'warning',
      title: 'Leak and mask discomfort appear linked',
      description: 'Η αυξημένη διαρροή ταιριάζει με συμπτώματα δυσφορίας ή dryness.'
    });
  }

  if (night.usageHours >= 4 && oximetry.minSpo2 < 90) {
    correlations.push({
      type: 'warning',
      title: 'Adequate use but oxygen concern',
      description: 'Υπάρχει καλή χρήση, αλλά το SpO2 δείχνει πιθανό residual physiological concern.'
    });
  }

  if (night.interruptions >= 2 && hasAwakenings) {
    correlations.push({
      type: 'warning',
      title: 'Journal matches fragmented session',
      description: 'Το journal συμφωνεί με διακεκομμένο session pattern.'
    });
  }

  if (!correlations.length) {
    correlations.push({
      type: 'positive',
      title: 'Overlay signals are broadly aligned',
      description: 'CPAP, physiology και journal δεν δείχνουν προφανή σύγκρουση για αυτή τη νύχτα.'
    });
  }

  return correlations;
}

function buildSourceCards(night, oximetry, journalEntries) {
  return [
    {
      key: 'cpap',
      title: 'CPAP Source',
      status: 'connected',
      tone: 'success',
      description: `Usage ${round(night.usageHours, 1)}h • AHI ${round(night.ahi, 1)} • Leak ${round(night.leakRate, 1)}`
    },
    {
      key: 'oximetry',
      title: 'Oximetry Source',
      status: oximetry.source === 'patient_oximetry_logs' ? 'connected' : 'fallback',
      tone: oximetry.minSpo2 < 90 ? 'warning' : 'success',
      description: `Min SpO2 ${round(oximetry.minSpo2, 1)} • Avg SpO2 ${round(oximetry.avgSpo2, 1)} • Pulse ${round(oximetry.pulseAvg, 1)}`
    },
    {
      key: 'journal',
      title: 'Journal Source',
      status: journalEntries[0]?.source === 'patient_journal_entries' ? 'connected' : 'fallback',
      tone: journalEntries[0]?.symptoms?.length ? 'warning' : 'success',
      description: `${journalEntries.length} entries available for this night`
    }
  ];
}

async function getOverlayData(user, requestedDate = null) {
  const nightData = await patientNightAnalysisService.getNightAnalysis(user, requestedDate);
  const patientContext = await resolvePatientContext(user);
  const refs = {
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  };

  const dateKey = nightData.selectedDate;
  const night = nightData.night;
  const oximetry = await loadOximetryForDate(refs, dateKey, night);
  const journalEntries = await loadJournalEntries(refs, dateKey, night, 10);
  const latestJournal = journalEntries[0] || null;

  const symptomsSummary = deriveSymptomsSummary(latestJournal);
  const correlations = buildCorrelations(night, oximetry, latestJournal);
  const sourceCards = buildSourceCards(night, oximetry, journalEntries);
  const timeline = buildOverlayTimeline(night, oximetry);

  return {
    availableDates: nightData.availableDates || [],
    selectedDate: dateKey,
    patient: {
      fullName: patientContext.fullName,
      email: patientContext.email
    },
    cpap: {
      usageHours: night.usageHours,
      ahi: night.ahi,
      leakRate: night.leakRate,
      avgPressure: night.avgPressure,
      maskSeal: night.maskSeal,
      interruptions: night.interruptions
    },
    oximetry,
    journal: {
      latest: latestJournal,
      entries: journalEntries,
      symptomsSummary
    },
    correlations,
    sourceCards,
    timeline
  };
}

async function listJournalEntriesForPatient(user, limit = 20) {
  const patientContext = await resolvePatientContext(user);
  const refs = {
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  };

  const nightly = await patientNightAnalysisService.getNightAnalysis(user, null);
  const dateKey = nightly.selectedDate;
  const rows = await loadJournalEntries(refs, dateKey, nightly.night, limit);

  return rows;
}

async function createJournalEntry(user, payload = {}) {
  const patientContext = await resolvePatientContext(user);
  const refs = {
    patientId: patientContext.patientId,
    userId: patientContext.userId,
    email: patientContext.email
  };

  const date = normalizeText(payload.date) || formatDateKey(new Date());
  const sleepQuality = toNumber(payload.sleepQuality, 0);
  const energyLevel = toNumber(payload.energyLevel, 0);
  const notes = normalizeText(payload.notes) || '';
  const symptomsInput = Array.isArray(payload.symptoms)
    ? payload.symptoms
    : String(payload.symptoms || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const symptoms = symptomsInput.map((item) => String(item));

  const exists = await tableExists(db, 'patient_journal_entries');

  if (!exists) {
    return {
      id: `synthetic-journal-${Date.now()}`,
      date,
      symptoms,
      sleepQuality,
      energyLevel,
      notes,
      source: 'synthetic_insert'
    };
  }

  const columns = await getColumns(db, 'patient_journal_entries');
  const insertPairs = [];

  const idCol = firstExisting(columns, ['id', 'journal_id']);
  const patientIdCol = firstExisting(columns, ['patient_id']);
  const userIdCol = firstExisting(columns, ['user_id']);
  const emailCol = firstExisting(columns, ['email', 'patient_email', 'user_email']);
  const dateCol = firstExisting(columns, ['entry_date', 'date']);
  const symptomsCol = firstExisting(columns, ['symptoms', 'tags']);
  const sleepQualityCol = firstExisting(columns, ['sleep_quality', 'quality_score']);
  const energyCol = firstExisting(columns, ['energy_level', 'morning_energy']);
  const notesCol = firstExisting(columns, ['notes', 'note', 'description']);
  const createdAtCol = firstExisting(columns, ['created_at']);

  if (idCol && safeLower(idCol) === 'journal_id') {
    insertPairs.push([idCol, `journal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`]);
  }

  if (patientIdCol && normalizeText(refs.patientId)) insertPairs.push([patientIdCol, String(refs.patientId)]);
  if (userIdCol && normalizeText(refs.userId)) insertPairs.push([userIdCol, String(refs.userId)]);
  if (emailCol && normalizeText(refs.email)) insertPairs.push([emailCol, String(refs.email)]);
  if (dateCol) insertPairs.push([dateCol, date]);
  if (symptomsCol) insertPairs.push([symptomsCol, JSON.stringify(symptoms)]);
  if (sleepQualityCol) insertPairs.push([sleepQualityCol, sleepQuality]);
  if (energyCol) insertPairs.push([energyCol, energyLevel]);
  if (notesCol) insertPairs.push([notesCol, notes]);
  if (createdAtCol) insertPairs.push([createdAtCol, new Date().toISOString()]);

  if (!insertPairs.length) {
    throw new Error('No compatible journal columns found');
  }

  const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
  const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
  const values = insertPairs.map(([, value]) => value);

  const result = await querySafe(
    db,
    `
      INSERT INTO patient_journal_entries (${insertColumns})
      VALUES (${placeholders})
      RETURNING *
    `,
    values
  );

  const row = result.rows?.[0];

  if (!row) {
    return {
      id: `journal-${Date.now()}`,
      date,
      symptoms,
      sleepQuality,
      energyLevel,
      notes,
      source: 'synthetic_insert'
    };
  }

  return {
    id: row[idCol] ? String(row[idCol]) : `journal-${Date.now()}`,
    date,
    symptoms,
    sleepQuality,
    energyLevel,
    notes,
    source: 'patient_journal_entries'
  };
}

module.exports = {
  getOverlayData,
  listJournalEntriesForPatient,
  createJournalEntry
};