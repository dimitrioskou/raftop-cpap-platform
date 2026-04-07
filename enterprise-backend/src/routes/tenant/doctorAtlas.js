const express = require('express');

const router = express.Router();

const doctorAtlasSummary = {
  totalCases: 21,
  criticalCases: 4,
  activePatients: 58,
  avgRiskScore: 68,
  estimatedRevenue: 3650,
  unresolvedAlerts: 6
};

const doctorAtlasQueue = [
  {
    id: 901,
    patient_name: 'Doctor Patient 01',
    reason: 'AHI remains elevated despite adherence',
    priority: 'critical',
    score: 93,
    ahi_avg_7d: 17.4,
    usage_avg_7d: 5.9,
    doctor_name: 'Dr. Example',
    created_at: '2026-03-30 08:15',
    status: 'open'
  },
  {
    id: 902,
    patient_name: 'Doctor Patient 02',
    reason: 'Leak escalation with poor mask tolerance',
    priority: 'high',
    score: 81,
    ahi_avg_7d: 8.1,
    usage_avg_7d: 4.7,
    doctor_name: 'Dr. Example',
    created_at: '2026-03-30 08:30',
    status: 'open'
  },
  {
    id: 903,
    patient_name: 'Doctor Patient 03',
    reason: 'Clinical follow-up requested after review',
    priority: 'medium',
    score: 66,
    ahi_avg_7d: 5.2,
    usage_avg_7d: 6.3,
    doctor_name: 'Dr. Example',
    created_at: '2026-03-29 16:40',
    status: 'in_progress'
  }
];

function ok(res, data) {
  return res.json({
    success: true,
    data
  });
}

router.get('/summary', async (req, res) => {
  return ok(res, doctorAtlasSummary);
});

router.get('/queue', async (req, res) => {
  return ok(res, doctorAtlasQueue);
});

module.exports = router;