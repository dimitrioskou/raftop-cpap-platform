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

function buildDemoTherapyPayload({ tenantId, patientId }) {
  const nights = [
    { day: 'Mon', date: '2026-05-16', usageHours: 6.2, ahi: 3.8, leak: 16, pressure: 9.1 },
    { day: 'Tue', date: '2026-05-17', usageHours: 5.9, ahi: 4.2, leak: 18, pressure: 9.3 },
    { day: 'Wed', date: '2026-05-18', usageHours: 7.1, ahi: 2.9, leak: 13, pressure: 9.5 },
    { day: 'Thu', date: '2026-05-19', usageHours: 6.4, ahi: 3.4, leak: 15, pressure: 9.4 },
    { day: 'Fri', date: '2026-05-20', usageHours: 4.8, ahi: 5.1, leak: 22, pressure: 9.8 },
    { day: 'Sat', date: '2026-05-21', usageHours: 6.9, ahi: 3.0, leak: 14, pressure: 9.2 },
    { day: 'Sun', date: '2026-05-22', usageHours: 6.7, ahi: 3.1, leak: 14, pressure: 9.4 }
  ];

  const lastNight = nights[nights.length - 1];

  return {
    ok: true,
    fallback: false,
    source: 'patient-therapy-demo-engine',
    phase: '35C.6-patient-therapy-api',
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

    summary: {
      adherenceScore: 86,
      status: 'Controlled',
      trend: 'Improving',
      nightsUsed: 24,
      totalNights: 30,
      usageHoursLastNight: lastNight.usageHours,
      ahiLastNight: lastNight.ahi,
      leakLastNight: lastNight.leak,
      averagePressure: lastNight.pressure,
      maskFit: 92,
      startTime: '23:48',
      endTime: '06:30'
    },

    lastNight: {
      date: lastNight.date,
      usage: '6h 42m',
      usageHours: lastNight.usageHours,
      ahi: lastNight.ahi,
      leak: lastNight.leak,
      pressure: lastNight.pressure,
      maskFit: 92,
      startTime: '23:48',
      endTime: '06:30',
      status: 'Controlled'
    },

    insights: [
      {
        status: 'Good',
        title: 'Therapy control',
        text: 'AHI remained below the target threshold, suggesting effective pressure delivery during the night.'
      },
      {
        status: 'Stable',
        title: 'Leak profile',
        text: 'Leak stayed within acceptable range. Continue checking mask seal before sleep.'
      },
      {
        status: 'Good',
        title: 'Usage duration',
        text: 'Usage exceeded 4 hours, supporting compliance and long-term therapeutic benefit.'
      }
    ],

    actions: [
      'Use the device again tonight for at least 4 hours.',
      'Check mask position before sleep.',
      'Clean mask cushion if leak increases.',
      'Contact your provider if discomfort continues.'
    ],

    nights,

    generatedAt: new Date().toISOString()
  };
}

router.get('/summary', async (req, res) => {
  try {
    const tenantId = readTenantId(req);
    const patientId = readPatientId(req);

    return res.json(buildDemoTherapyPayload({ tenantId, patientId }));
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PATIENT_THERAPY_SUMMARY_FAILED',
      message: error.message,
      phase: '35C.6-patient-therapy-api'
    });
  }
});

module.exports = router;