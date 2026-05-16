const express = require('express');

const router = express.Router();

function getTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    req.body?.tenantId ||
    req.body?.tenant_id ||
    'raftopoulos-live'
  );
}

function buildSignal({
  id,
  tenantId,
  patientName,
  signalType,
  severity,
  status,
  source,
  description,
  nextBestAction,
  monthlyHours,
  createdAt,
}) {
  return {
    id,
    tenantId,
    tenant_id: tenantId,
    patientName,
    patient_name: patientName,
    signalType,
    signal_type: signalType,
    severity,
    priority: severity,
    status,
    source,
    description,
    monthlyHours,
    monthly_hours: monthlyHours,
    nextBestAction,
    next_best_action: nextBestAction,
    metadata: {
      nextBestAction,
      commercialDemoSafe: true,
    },
    createdAt,
    created_at: createdAt,
    updatedAt: createdAt,
    updated_at: createdAt,
  };
}

router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  const now = new Date().toISOString();

  const signals = [
    buildSignal({
      id: 'sig-raftop-001',
      tenantId,
      patientName: 'ΚΟΥΤΡΩΤΣΙΟΣ ΔΗΜΗΤΡΙΟΣ',
      signalType: 'LOW_USAGE',
      severity: 'HIGH',
      status: 'OPEN',
      source: 'ATLAS',
      description: 'CPAP usage below the 80h/month compliance reference point.',
      nextBestAction: 'Call patient within 48h and verify mask comfort, leak, and usage barriers.',
      monthlyHours: 42,
      createdAt: now,
    }),
    buildSignal({
      id: 'sig-raftop-002',
      tenantId,
      patientName: 'Γεώργιος Παπαδόπουλος',
      signalType: 'EARLY_ADHERENCE_RISK',
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'ATLAS',
      description: 'New CPAP start with early adherence risk during first 14 days.',
      nextBestAction: 'Schedule early coaching call and review setup comfort.',
      monthlyHours: 61,
      createdAt: now,
    }),
    buildSignal({
      id: 'sig-raftop-003',
      tenantId,
      patientName: 'Μαρία Κωνσταντίνου',
      signalType: 'FOLLOWUP_DUE',
      severity: 'MEDIUM',
      status: 'OPEN',
      source: 'FOLLOWUP_ENGINE',
      description: 'Patient requires scheduled compliance follow-up review.',
      nextBestAction: 'Create follow-up task and prepare doctor-facing progress summary.',
      monthlyHours: 74,
      createdAt: now,
    }),
    buildSignal({
      id: 'sig-raftop-004',
      tenantId,
      patientName: 'Νίκος Δημητρίου',
      signalType: 'DOCTOR_REPORT_READY',
      severity: 'LOW',
      status: 'READY',
      source: 'REPORTING',
      description: 'Doctor-channel report is ready for review.',
      nextBestAction: 'Send concise compliance update to referring doctor.',
      monthlyHours: 93,
      createdAt: now,
    }),
  ];

  res.json({
    ok: true,
    fallback: false,
    tenantId,
    tenant_id: tenantId,
    summary: {
      total: signals.length,
      open: signals.filter((item) => item.status === 'OPEN').length,
      high: signals.filter((item) => item.severity === 'HIGH').length,
      medium: signals.filter((item) => item.severity === 'MEDIUM').length,
      low: signals.filter((item) => item.severity === 'LOW').length,
      warnings: 0,
      failed: 0,
      criticalFailed: 0,
    },
    signals,
    items: signals,
    rows: signals,
    generatedAt: now,
  });
});

module.exports = router;