const express = require('express');
const router = express.Router();
const db = require('../../db');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../../utils/routeDbHelpers');

function euro(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
}

function resolvePlanFromPatients(patientCount) {
  const count = Number(patientCount || 0);

  if (count >= 8) {
    return {
      key: 'enterprise',
      label: 'Enterprise',
      annualFee: 1200
    };
  }

  if (count >= 4) {
    return {
      key: 'premium',
      label: 'Premium',
      annualFee: 800
    };
  }

  return {
    key: 'starter',
    label: 'Starter',
    annualFee: 500
  };
}

function buildSubscriptionRow(row, index) {
  const patientCount = Number(row.patient_count || 0);
  const plan = resolvePlanFromPatients(patientCount);
  const annualFee = euro(plan.annualFee);
  const monthlyEquivalent = euro(annualFee / 12);
  const estimatedPatientRevenueMonthly = euro(patientCount * (20 / 6));
  const totalMonthlyValue = euro(monthlyEquivalent + estimatedPatientRevenueMonthly);

  return {
    id: row.id || `doctor-sub-${index + 1}`,
    doctor_name: row.doctor_name || `Doctor ${index + 1}`,
    doctor_email: row.doctor_email || '—',
    patient_count: patientCount,
    plan_key: plan.key,
    plan_label: plan.label,
    annual_fee: annualFee,
    monthly_equivalent: monthlyEquivalent,
    estimated_patient_revenue_monthly: estimatedPatientRevenueMonthly,
    total_monthly_value: totalMonthlyValue,
    status: patientCount > 0 ? 'active' : 'inactive'
  };
}

async function readDoctorSubscriptionsFromDb() {
  const doctorsExists = await tableExists(db, 'doctors');
  const patientsExists = await tableExists(db, 'patients');

  const doctorsColumns = doctorsExists ? await getColumns(db, 'doctors') : [];
  const patientsColumns = patientsExists ? await getColumns(db, 'patients') : [];

  const doctorIdColumn = firstExisting(doctorsColumns, ['id', 'doctor_id']);
  const doctorNameColumn = firstExisting(doctorsColumns, ['name', 'full_name', 'fullname']);
  const doctorEmailColumn = firstExisting(doctorsColumns, ['email']);

  const patientDoctorIdColumn = firstExisting(patientsColumns, ['doctor_id']);
  const patientIdColumn = firstExisting(patientsColumns, ['id', 'patient_id']);

  if (doctorsExists && doctorIdColumn) {
    const sql = `
      SELECT
        d.${q(doctorIdColumn)}::text AS id,
        COALESCE(${doctorNameColumn ? `d.${q(doctorNameColumn)}::text` : `NULL`}, 'Doctor #' || d.${q(doctorIdColumn)}::text) AS doctor_name,
        ${doctorEmailColumn ? `d.${q(doctorEmailColumn)}::text` : `'—'`} AS doctor_email,
        ${
          patientsExists && patientDoctorIdColumn && patientIdColumn
            ? `COUNT(p.${q(patientIdColumn)})::int`
            : `0::int`
        } AS patient_count
      FROM doctors d
      ${
        patientsExists && patientDoctorIdColumn && patientIdColumn
          ? `LEFT JOIN patients p ON p.${q(patientDoctorIdColumn)}::text = d.${q(doctorIdColumn)}::text`
          : ``
      }
      GROUP BY d.${q(doctorIdColumn)}${doctorNameColumn ? `, d.${q(doctorNameColumn)}` : ''}${doctorEmailColumn ? `, d.${q(doctorEmailColumn)}` : ''}
      ORDER BY patient_count DESC, doctor_name ASC
      LIMIT 200
    `;

    const result = await querySafe(db, sql);
    if (!result.error) {
      return (result.rows || []).map(buildSubscriptionRow);
    }
  }

  if (patientsExists && patientDoctorIdColumn) {
    const sql = `
      SELECT
        p.${q(patientDoctorIdColumn)}::text AS id,
        'Doctor #' || p.${q(patientDoctorIdColumn)}::text AS doctor_name,
        '—' AS doctor_email,
        COUNT(*)::int AS patient_count
      FROM patients p
      WHERE p.${q(patientDoctorIdColumn)} IS NOT NULL
      GROUP BY p.${q(patientDoctorIdColumn)}
      ORDER BY patient_count DESC, doctor_name ASC
      LIMIT 200
    `;

    const result = await querySafe(db, sql);
    if (!result.error) {
      return (result.rows || []).map(buildSubscriptionRow);
    }
  }

  return [];
}

function buildFallbackDoctorSubscriptions() {
  return [
    {
      id: 'doctor-sub-1',
      doctor_name: 'Dr. Ελένη Περράκη',
      doctor_email: 'perraki@raftop.local',
      patient_count: 3,
      plan_key: 'starter',
      plan_label: 'Starter',
      annual_fee: 500,
      monthly_equivalent: euro(500 / 12),
      estimated_patient_revenue_monthly: euro(3 * (20 / 6)),
      total_monthly_value: euro(500 / 12 + 3 * (20 / 6)),
      status: 'active'
    },
    {
      id: 'doctor-sub-2',
      doctor_name: 'Dr. Νίκος Ανδρεάδης',
      doctor_email: 'andreadis@raftop.local',
      patient_count: 5,
      plan_key: 'premium',
      plan_label: 'Premium',
      annual_fee: 800,
      monthly_equivalent: euro(800 / 12),
      estimated_patient_revenue_monthly: euro(5 * (20 / 6)),
      total_monthly_value: euro(800 / 12 + 5 * (20 / 6)),
      status: 'active'
    },
    {
      id: 'doctor-sub-3',
      doctor_name: 'Dr. Μαρία Λάμπρου',
      doctor_email: 'lamprou@raftop.local',
      patient_count: 9,
      plan_key: 'enterprise',
      plan_label: 'Enterprise',
      annual_fee: 1200,
      monthly_equivalent: euro(1200 / 12),
      estimated_patient_revenue_monthly: euro(9 * (20 / 6)),
      total_monthly_value: euro(1200 / 12 + 9 * (20 / 6)),
      status: 'active'
    }
  ];
}

router.get('/', async (req, res) => {
  let doctorSubscriptions = await readDoctorSubscriptionsFromDb();

  if (!doctorSubscriptions.length) {
    doctorSubscriptions = buildFallbackDoctorSubscriptions();
  }

  const monthlyRevenueEstimate = euro(
    doctorSubscriptions.reduce((sum, row) => sum + Number(row.total_monthly_value || 0), 0)
  );

  const annualRecurringRevenue = euro(
    doctorSubscriptions.reduce((sum, row) => sum + Number(row.annual_fee || 0), 0)
  );

  const doctorBillingEstimate = monthlyRevenueEstimate;
  const activeDoctors = doctorSubscriptions.filter((row) => row.status === 'active').length;
  const criticalCases = doctorSubscriptions.filter((row) => Number(row.patient_count || 0) >= 8).length;
  const warningCases = doctorSubscriptions.filter((row) => {
    const count = Number(row.patient_count || 0);
    return count >= 4 && count < 8;
  }).length;

  return res.json({
    ok: true,
    doctorSubscriptions,
    totalDoctorSubscriptions: doctorSubscriptions.length,
    activeDoctors,
    monthlyRevenueEstimate,
    annualRecurringRevenue,
    doctorBillingEstimate,
    criticalCases,
    warningCases,
    currency: 'EUR',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;