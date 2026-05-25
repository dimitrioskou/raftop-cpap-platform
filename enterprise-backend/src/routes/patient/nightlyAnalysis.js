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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreUsage(hours) {
  if (hours >= 7) return 100;
  if (hours >= 6) return 92;
  if (hours >= 4) return 75;
  if (hours >= 2) return 45;
  return 20;
}

function scoreAhi(ahi) {
  if (ahi <= 2) return 100;
  if (ahi <= 5) return 88;
  if (ahi <= 10) return 60;
  if (ahi <= 15) return 40;
  return 20;
}

function scoreLeak(leak) {
  if (leak <= 12) return 100;
  if (leak <= 24) return 85;
  if (leak <= 35) return 55;
  return 25;
}

function scorePressureStability(pressureVariance) {
  if (pressureVariance <= 1) return 100;
  if (pressureVariance <= 2) return 82;
  if (pressureVariance <= 3) return 65;
  return 45;
}

function classifyNight({ usageHours, ahi, leak, pressureVariance }) {
  const usageScore = scoreUsage(usageHours);
  const ahiScore = scoreAhi(ahi);
  const leakScore = scoreLeak(leak);
  const pressureScore = scorePressureStability(pressureVariance);

  const nightScore = Math.round(
    usageScore * 0.35 +
    ahiScore * 0.30 +
    leakScore * 0.25 +
    pressureScore * 0.10
  );

  const escalation =
    ahi > 10 ||
    leak > 35 ||
    usageHours < 2 ||
    (ahi > 5 && leak > 24);

  let status = 'Excellent';

  if (nightScore < 85) status = 'Good';
  if (nightScore < 70) status = 'Needs Attention';
  if (nightScore < 50) status = 'High Risk';

  return {
    nightScore: clamp(nightScore, 0, 100),
    status,
    usageScore,
    ahiScore,
    leakScore,
    pressureScore,
    escalation
  };
}

function buildNightlyAnalysisPayload({ tenantId, patientId }) {
  const rawNight = {
    date: '2026-05-22',
    usageHours: 6.7,
    ahi: 3.1,
    leak: 14,
    pressureAverage: 9.4,
    pressureP95: 11.2,
    pressureMin: 7.8,
    pressureMax: 12.4,
    pressureVariance: 1.8,
    maskFit: 92,
    startTime: '23:48',
    endTime: '06:30'
  };

  const classification = classifyNight(rawNight);

  return {
    ok: true,
    fallback: false,
    source: 'patient-nightly-analysis-engine',
    phase: '35C.10-patient-nightly-analysis-engine',
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

    night: {
      ...rawNight,
      usage: '6h 42m',
      sleepWindow: `${rawNight.startTime} - ${rawNight.endTime}`
    },

    score: {
      nightScore: classification.nightScore,
      status: classification.status,
      usageScore: classification.usageScore,
      ahiScore: classification.ahiScore,
      leakScore: classification.leakScore,
      pressureScore: classification.pressureScore
    },

    interpretation: {
      usageQuality:
        rawNight.usageHours >= 4
          ? 'Usage duration supports adherence and therapeutic continuity.'
          : 'Usage duration is below the adherence target and should be improved.',
      ahiControl:
        rawNight.ahi <= 5
          ? 'AHI is controlled and suggests effective therapy response.'
          : 'AHI is above target and may require clinical review.',
      leakRisk:
        rawNight.leak <= 24
          ? 'Leak is within acceptable range.'
          : 'Leak is elevated and may reduce treatment effectiveness.',
      pressureStability:
        rawNight.pressureVariance <= 2
          ? 'Pressure pattern appears stable.'
          : 'Pressure variability is increased and should be monitored.',
      maskFit:
        rawNight.maskFit >= 85
          ? 'Mask fit appears adequate.'
          : 'Mask fit may need adjustment.'
    },

    insights: [
      {
        severity: rawNight.usageHours >= 4 ? 'positive' : 'warning',
        title: 'Usage quality',
        text:
          rawNight.usageHours >= 4
            ? 'The patient exceeded the minimum adherence threshold for the night.'
            : 'The patient did not reach the minimum adherence threshold.'
      },
      {
        severity: rawNight.ahi <= 5 ? 'positive' : 'warning',
        title: 'Respiratory control',
        text:
          rawNight.ahi <= 5
            ? 'Residual respiratory events are controlled.'
            : 'Residual respiratory events are above the preferred control range.'
      },
      {
        severity: rawNight.leak <= 24 ? 'positive' : 'warning',
        title: 'Leak control',
        text:
          rawNight.leak <= 24
            ? 'Leak values are compatible with reliable pressure delivery.'
            : 'Leak values may interfere with therapy effectiveness.'
      },
      {
        severity: classification.escalation ? 'critical' : 'positive',
        title: 'Provider escalation',
        text: classification.escalation
          ? 'This night should be reviewed by the provider team.'
          : 'No provider escalation is required based on this night.'
      }
    ],

    recommendations: [
      'Use the CPAP device every night for the full sleep period.',
      'Check mask seal before turning on the device.',
      'Clean the mask cushion if leak increases.',
      'Contact the provider team if AHI, leak, or discomfort worsens.'
    ],

    providerEscalation: {
      required: classification.escalation,
      reason: classification.escalation
        ? 'One or more nightly therapy indicators exceeded escalation thresholds.'
        : 'Nightly therapy indicators are within acceptable range.',
      priority: classification.escalation ? 'medium' : 'none'
    },

    generatedAt: new Date().toISOString()
  };
}

router.get('/', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const patientId = readPatientId(req);

    return res.json(buildNightlyAnalysisPayload({ tenantId, patientId }));
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PATIENT_NIGHTLY_ANALYSIS_FAILED',
      message: error.message,
      phase: '35C.10-patient-nightly-analysis-engine'
    });
  }
});

module.exports = router;