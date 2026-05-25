const express = require('express');

const router = express.Router();

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    'raftopoulos-live'
  );
}

function readPatientId(req) {
  return (
    req.headers['x-patient-id'] ||
    req.query.patientId ||
    req.query.patient_id ||
    'demo-patient-001'
  );
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function average(rows, key) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  const total = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
  return round(total / rows.length, 1);
}

function delta(current, previous) {
  return round(Number(current || 0) - Number(previous || 0), 1);
}

function direction(value, lowerIsBetter = false) {
  if (value === 0) return 'stable';

  if (lowerIsBetter) {
    return value < 0 ? 'improved' : 'worsened';
  }

  return value > 0 ? 'improved' : 'worsened';
}

function buildSignal({ label, current, previous, lowerIsBetter, unit = '' }) {
  const change = delta(current, previous);

  return {
    label,
    current,
    previous,
    delta: change,
    unit,
    direction: direction(change, lowerIsBetter)
  };
}

function buildNightComparePayload({ tenantId, patientId }) {
  const nights = [
    { day: 'Mon', date: '2026-05-16', usageHours: 6.2, ahi: 3.8, leak: 16, pressure: 9.1, nightScore: 84 },
    { day: 'Tue', date: '2026-05-17', usageHours: 5.9, ahi: 4.2, leak: 18, pressure: 9.3, nightScore: 80 },
    { day: 'Wed', date: '2026-05-18', usageHours: 7.1, ahi: 2.9, leak: 13, pressure: 9.5, nightScore: 91 },
    { day: 'Thu', date: '2026-05-19', usageHours: 6.4, ahi: 3.4, leak: 15, pressure: 9.4, nightScore: 87 },
    { day: 'Fri', date: '2026-05-20', usageHours: 4.8, ahi: 5.1, leak: 22, pressure: 9.8, nightScore: 70 },
    { day: 'Sat', date: '2026-05-21', usageHours: 6.9, ahi: 3.0, leak: 14, pressure: 9.2, nightScore: 90 },
    { day: 'Sun', date: '2026-05-22', usageHours: 6.7, ahi: 3.1, leak: 14, pressure: 9.4, nightScore: 89 }
  ];

  const lastNight = nights[nights.length - 1];
  const previousNight = nights[nights.length - 2];

  const sevenDayAverage = {
    usageHours: average(nights, 'usageHours'),
    ahi: average(nights, 'ahi'),
    leak: average(nights, 'leak'),
    pressure: average(nights, 'pressure'),
    nightScore: average(nights, 'nightScore')
  };

  const vsPrevious = {
    usage: buildSignal({
      label: 'Usage',
      current: lastNight.usageHours,
      previous: previousNight.usageHours,
      lowerIsBetter: false,
      unit: 'h'
    }),
    ahi: buildSignal({
      label: 'AHI',
      current: lastNight.ahi,
      previous: previousNight.ahi,
      lowerIsBetter: true
    }),
    leak: buildSignal({
      label: 'Leak',
      current: lastNight.leak,
      previous: previousNight.leak,
      lowerIsBetter: true,
      unit: 'L/min'
    }),
    pressure: buildSignal({
      label: 'Pressure',
      current: lastNight.pressure,
      previous: previousNight.pressure,
      lowerIsBetter: false,
      unit: 'cmH₂O'
    }),
    nightScore: buildSignal({
      label: 'Night Score',
      current: lastNight.nightScore,
      previous: previousNight.nightScore,
      lowerIsBetter: false
    })
  };

  const vsSevenDayAverage = {
    usage: buildSignal({
      label: 'Usage vs 7-day avg',
      current: lastNight.usageHours,
      previous: sevenDayAverage.usageHours,
      lowerIsBetter: false,
      unit: 'h'
    }),
    ahi: buildSignal({
      label: 'AHI vs 7-day avg',
      current: lastNight.ahi,
      previous: sevenDayAverage.ahi,
      lowerIsBetter: true
    }),
    leak: buildSignal({
      label: 'Leak vs 7-day avg',
      current: lastNight.leak,
      previous: sevenDayAverage.leak,
      lowerIsBetter: true,
      unit: 'L/min'
    }),
    pressure: buildSignal({
      label: 'Pressure vs 7-day avg',
      current: lastNight.pressure,
      previous: sevenDayAverage.pressure,
      lowerIsBetter: false,
      unit: 'cmH₂O'
    }),
    nightScore: buildSignal({
      label: 'Night Score vs 7-day avg',
      current: lastNight.nightScore,
      previous: sevenDayAverage.nightScore,
      lowerIsBetter: false
    })
  };

  const deteriorationSignals = [
    vsPrevious.usage.direction === 'worsened' && Math.abs(vsPrevious.usage.delta) >= 1
      ? 'Usage dropped by at least 1 hour vs previous night.'
      : null,
    vsPrevious.ahi.direction === 'worsened' && vsPrevious.ahi.delta >= 2
      ? 'AHI increased meaningfully vs previous night.'
      : null,
    vsPrevious.leak.direction === 'worsened' && vsPrevious.leak.delta >= 8
      ? 'Leak increased meaningfully vs previous night.'
      : null,
    lastNight.ahi > 5 ? 'AHI is above preferred control range.' : null,
    lastNight.leak > 24 ? 'Leak is above preferred range.' : null
  ].filter(Boolean);

  const improvementSignals = [
    vsPrevious.usage.direction === 'improved'
      ? 'Usage improved vs previous night.'
      : null,
    vsPrevious.ahi.direction === 'improved'
      ? 'AHI improved vs previous night.'
      : null,
    vsPrevious.leak.direction === 'improved'
      ? 'Leak improved vs previous night.'
      : null,
    vsPrevious.nightScore.direction === 'improved'
      ? 'Night score improved vs previous night.'
      : null
  ].filter(Boolean);

  const providerAttentionRequired = deteriorationSignals.length >= 2;

  return {
    ok: true,
    fallback: false,
    source: 'patient-night-compare-engine',
    phase: '35C.14-patient-night-compare-api',
    tenantId,
    tenant_id: tenantId,
    patientId,
    patient_id: patientId,

    patient: {
      id: patientId,
      displayName: 'Demo Patient',
      therapyMode: 'CPAP',
      provider: 'RAFTOP CPAP CARE Pro'
    },

    lastNight,
    previousNight,
    sevenDayAverage,

    comparison: {
      vsPrevious,
      vsSevenDayAverage
    },

    signals: {
      improvementSignals,
      deteriorationSignals,
      providerAttentionRequired,
      providerPriority: providerAttentionRequired ? 'medium' : 'none'
    },

    summary: {
      headline: providerAttentionRequired
        ? 'Some therapy indicators worsened and should be reviewed.'
        : 'Therapy remains broadly stable compared with recent nights.',
      status: providerAttentionRequired ? 'Needs Review' : 'Stable',
      patientMessage: providerAttentionRequired
        ? 'Some values changed compared with your recent nights. Continue therapy and contact your provider if discomfort or mask leak persists.'
        : 'Your latest night is consistent with recent therapy trends. Keep using your CPAP every night.'
    },

    generatedAt: new Date().toISOString()
  };
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const patientId = readPatientId(req);

    return res.json(buildNightComparePayload({ tenantId, patientId }));
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PATIENT_NIGHT_COMPARE_FAILED',
      message: error.message,
      phase: '35C.14-patient-night-compare-api'
    });
  }
});

module.exports = router;