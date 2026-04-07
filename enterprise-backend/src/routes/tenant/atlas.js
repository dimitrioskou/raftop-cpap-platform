const express = require('express');
const router = express.Router();
const db = require('../../db');

function q(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function querySafe(text, params = []) {
  try {
    return await db.query(text, params);
  } catch (error) {
    return { rows: [], error };
  }
}

async function tableExists(tableName) {
  const result = await querySafe(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName]
  );

  if (result.error) return false;
  return Boolean(result.rows?.[0]?.exists);
}

async function getColumns(tableName) {
  const result = await querySafe(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  if (result.error) return [];
  return result.rows.map((row) => row.column_name);
}

function firstExisting(columns, candidates) {
  return candidates.find((name) => columns.includes(name)) || null;
}

function safeJoinOn(leftAlias, leftColumn, rightAlias, rightColumn) {
  return `${leftAlias}.${q(leftColumn)}::text = ${rightAlias}.${q(rightColumn)}::text`;
}

function normalizePriority(statusValue, hoursValue, riskValue) {
  const status = String(statusValue || '').toLowerCase();
  const risk = String(riskValue || '').toLowerCase();
  const hours = Number(hoursValue || 0);

  if (status.includes('critical')) return 'critical';
  if (risk.includes('high')) return 'critical';
  if (hours > 0 && hours < 4) return 'critical';

  if (status.includes('warning') || status.includes('medium') || status.includes('low')) return 'warning';
  if (hours > 0 && hours < 8) return 'warning';

  return 'normal';
}

function normalizeRisk(statusValue, hoursValue, riskValue) {
  const risk = String(riskValue || '').toLowerCase();
  const status = String(statusValue || '').toLowerCase();
  const hours = Number(hoursValue || 0);

  if (risk.includes('high') || status.includes('critical') || (hours > 0 && hours < 4)) return 'high';
  if (risk.includes('medium') || status.includes('warning') || status.includes('low') || (hours > 0 && hours < 8)) return 'medium';
  return 'low';
}

function pickPatientName(row) {
  return row.patient_name || row.name || `Patient ${row.id || ''}`.trim();
}

function pickDoctorName(row) {
  if (row.doctor_name) return row.doctor_name;
  if (row.doctor_id) return `Doctor #${row.doctor_id}`;
  return '—';
}

async function readAtlasBasePatients() {
  const patientsExists = await tableExists('patients');
  const doctorsExists = await tableExists('doctors');

  const patientsColumns = patientsExists ? await getColumns('patients') : [];
  const doctorsColumns = doctorsExists ? await getColumns('doctors') : [];

  if (!patientsExists) {
    return {
      rows: [],
      meta: {
        patientsTable: false,
        doctorsTable: doctorsExists,
        patientsColumns,
        doctorsColumns
      },
      debug: 'patients_table_missing'
    };
  }

  const patientIdColumn = firstExisting(patientsColumns, ['id', 'patient_id']);
  const patientNameColumn = firstExisting(patientsColumns, ['name', 'full_name', 'fullname']);
  const patientHoursColumn = firstExisting(patientsColumns, ['cpap_hours', 'usage_hours', 'compliance_hours', 'monthly_usage_hours']);
  const patientStatusColumn = firstExisting(patientsColumns, ['compliance_status', 'status']);
  const patientRiskColumn = firstExisting(patientsColumns, ['risk_level', 'risk_score']);
  const patientDoctorIdColumn = firstExisting(patientsColumns, ['doctor_id']);
  const patientCreatedColumn = firstExisting(patientsColumns, ['updated_at', 'created_at']);

  const doctorIdColumn = firstExisting(doctorsColumns, ['id', 'doctor_id']);
  const doctorNameColumn = firstExisting(doctorsColumns, ['name', 'full_name', 'fullname']);

  if (!patientIdColumn) {
    return {
      rows: [],
      meta: {
        patientsTable: true,
        doctorsTable: doctorsExists,
        patientsColumns,
        doctorsColumns
      },
      debug: 'patient_id_column_missing'
    };
  }

  const joins = [];

  if (patientDoctorIdColumn && doctorIdColumn && doctorsExists) {
    joins.push(
      `LEFT JOIN doctors d ON ${safeJoinOn('d', doctorIdColumn, 'p', patientDoctorIdColumn)}`
    );
  }

  const doctorExpr =
    doctorNameColumn && joins.length
      ? `COALESCE(d.${q(doctorNameColumn)}::text, 'Doctor #' || COALESCE(p.${q(patientDoctorIdColumn)}::text, '—'))`
      : patientDoctorIdColumn
      ? `'Doctor #' || COALESCE(p.${q(patientDoctorIdColumn)}::text, '—')`
      : `NULL`;

  const sql = `
    SELECT
      p.${q(patientIdColumn)}::text AS ${q('id')},
      ${
        patientNameColumn
          ? `p.${q(patientNameColumn)}::text AS ${q('patient_name')}`
          : `NULL AS ${q('patient_name')}`
      },
      ${
        patientHoursColumn
          ? `p.${q(patientHoursColumn)}::text AS ${q('cpap_hours')}`
          : `NULL AS ${q('cpap_hours')}`
      },
      ${
        patientStatusColumn
          ? `p.${q(patientStatusColumn)}::text AS ${q('compliance_status')}`
          : `NULL AS ${q('compliance_status')}`
      },
      ${
        patientRiskColumn
          ? `p.${q(patientRiskColumn)}::text AS ${q('risk_level')}`
          : `NULL AS ${q('risk_level')}`
      },
      ${doctorExpr} AS ${q('doctor_name')},
      ${
        patientDoctorIdColumn
          ? `p.${q(patientDoctorIdColumn)}::text AS ${q('doctor_id')}`
          : `NULL AS ${q('doctor_id')}`
      },
      ${
        patientCreatedColumn
          ? `p.${q(patientCreatedColumn)}::text AS ${q('created_at')}`
          : `NULL AS ${q('created_at')}`
      }
    FROM patients p
    ${joins.join('\n')}
    ORDER BY ${patientCreatedColumn ? `p.${q(patientCreatedColumn)} DESC NULLS LAST` : `p.${q(patientIdColumn)} DESC`}
    LIMIT 500
  `;

  const result = await querySafe(sql);

  if (result.error) {
    return {
      rows: [],
      meta: {
        patientsTable: true,
        doctorsTable: doctorsExists,
        patientsColumns,
        doctorsColumns
      },
      debug: result.error.message
    };
  }

  return {
    rows: result.rows || [],
    meta: {
      patientsTable: true,
      doctorsTable: doctorsExists,
      patientsColumns,
      doctorsColumns
    },
    debug: null
  };
}

function buildSummaryRows(baseRows) {
  return baseRows.map((row, index) => {
    const hours = Number(row.cpap_hours || 0);
    const risk = normalizeRisk(row.compliance_status, hours, row.risk_level);
    const priority = normalizePriority(row.compliance_status, hours, row.risk_level);

    let groupName = 'Stable Patients';
    if (priority === 'critical') groupName = 'Below 4h Critical';
    else if (priority === 'warning') groupName = 'Below 8h Follow-up';

    return {
      id: `atlas-summary-${row.id || index + 1}`,
      group_name: groupName,
      patient_name: pickPatientName(row),
      risk,
      priority,
      status: 'open',
      doctor_name: pickDoctorName(row),
      doctor_id: row.doctor_id || null
    };
  });
}

function buildQueueRows(baseRows) {
  return baseRows
    .filter((row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) !== 'normal')
    .map((row, index) => {
      const priority = normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level);

      return {
        id: `atlas-queue-${row.id || index + 1}`,
        patient_name: pickPatientName(row),
        queue_name: priority === 'critical' ? 'Critical Compliance Queue' : 'Warning Compliance Queue',
        priority,
        owner: 'ATLAS Team',
        due_at: row.created_at || new Date().toISOString(),
        doctor_name: pickDoctorName(row),
        doctor_id: row.doctor_id || null
      };
    });
}

function buildDailyRows(baseRows) {
  return baseRows
    .filter((row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) !== 'normal')
    .map((row, index) => {
      const priority = normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level);

      return {
        id: `atlas-daily-${row.id || index + 1}`,
        patient_name: pickPatientName(row),
        activity:
          priority === 'critical'
            ? 'Immediate patient outreach'
            : 'Scheduled adherence follow-up',
        priority,
        scheduled_at: row.created_at || new Date().toISOString(),
        status: priority === 'critical' ? 'pending' : 'scheduled',
        doctor_name: pickDoctorName(row),
        doctor_id: row.doctor_id || null
      };
    });
}

function buildTaskRows(baseRows) {
  return baseRows
    .filter((row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) !== 'normal')
    .map((row, index) => {
      const priority = normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level);

      return {
        id: `atlas-task-${row.id || index + 1}`,
        title:
          priority === 'critical'
            ? 'Escalate severe low-usage patient'
            : 'Review warning-level adherence case',
        owner: 'ATLAS Team',
        patient_name: pickPatientName(row),
        due_at: row.created_at || new Date().toISOString(),
        status: priority === 'critical' ? 'overdue' : 'pending',
        doctor_name: pickDoctorName(row),
        doctor_id: row.doctor_id || null
      };
    });
}

function buildAlertRows(baseRows) {
  return baseRows
    .filter((row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) !== 'normal')
    .map((row, index) => {
      const priority = normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level);

      return {
        id: `atlas-alert-${row.id || index + 1}`,
        alert_name:
          priority === 'critical'
            ? 'Critical CPAP compliance drop'
            : 'CPAP usage below target',
        patient_name: pickPatientName(row),
        severity: priority,
        status: 'open',
        created_at: row.created_at || new Date().toISOString(),
        doctor_name: pickDoctorName(row),
        doctor_id: row.doctor_id || null
      };
    });
}

function buildAutoActionRows(baseRows) {
  const criticalCount = baseRows.filter(
    (row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) === 'critical'
  ).length;

  const warningCount = baseRows.filter(
    (row) => normalizePriority(row.compliance_status, row.cpap_hours, row.risk_level) === 'warning'
  ).length;

  const now = new Date().toISOString();

  return [
    {
      id: 'atlas-auto-1',
      rule_name: 'Critical adherence escalation',
      action_name: `Create ${criticalCount} critical follow-up task(s)`,
      last_run_at: now,
      status: criticalCount > 0 ? 'success' : 'scheduled'
    },
    {
      id: 'atlas-auto-2',
      rule_name: 'Warning adherence monitoring',
      action_name: `Queue ${warningCount} warning case(s)`,
      last_run_at: now,
      status: warningCount > 0 ? 'success' : 'scheduled'
    }
  ];
}

router.get('/summary', async (req, res) => {
  const data = await readAtlasBasePatients();
  return res.json({
    summary: buildSummaryRows(data.rows),
    total: data.rows.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/queue', async (req, res) => {
  const data = await readAtlasBasePatients();
  const queue = buildQueueRows(data.rows);
  return res.json({
    queue,
    total: queue.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/daily', async (req, res) => {
  const data = await readAtlasBasePatients();
  const daily = buildDailyRows(data.rows);
  return res.json({
    daily,
    total: daily.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/tasks', async (req, res) => {
  const data = await readAtlasBasePatients();
  const tasks = buildTaskRows(data.rows);
  return res.json({
    tasks,
    total: tasks.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/alerts', async (req, res) => {
  const data = await readAtlasBasePatients();
  const alerts = buildAlertRows(data.rows);
  return res.json({
    alerts,
    total: alerts.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/auto-actions', async (req, res) => {
  const data = await readAtlasBasePatients();
  const autoActions = buildAutoActionRows(data.rows);
  return res.json({
    autoActions,
    total: autoActions.length,
    meta: data.meta,
    debug: data.debug
  });
});

router.get('/autoactions', async (req, res) => {
  const data = await readAtlasBasePatients();
  const autoActions = buildAutoActionRows(data.rows);
  return res.json({
    autoActions,
    total: autoActions.length,
    meta: data.meta,
    debug: data.debug
  });
});

module.exports = router;