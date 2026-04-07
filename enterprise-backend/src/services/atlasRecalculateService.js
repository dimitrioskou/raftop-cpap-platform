const db = require('../config/db');

function getPriority(score) {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

async function recalculateAtlas() {
  // 🔥 1. πάρε metrics
  const metrics = await db.query(`
    SELECT
      pm.*,
      p.id AS patient_id
    FROM patient_metrics pm
    JOIN patients p ON p.id = pm.patient_id
  `);

  // 🔥 2. καθάρισε παλιά current
  await db.query(`
    UPDATE patient_action_status
    SET is_current = false
    WHERE is_current = true
  `);

  const created = [];

  for (const row of metrics.rows) {
    let score = 0;
    let actionGroupCode = 'NEW_SETUP';
    let reason = 'General monitoring';

    // =========================
    // RULES ENGINE
    // =========================

    if (row.no_data_days >= 2) {
      score = 70;
      actionGroupCode = 'NO_DATA';
      reason = `No data ${row.no_data_days} days`;
    }

    else if (row.usage_avg_7d < 4) {
      score = 60;
      actionGroupCode = 'COMPLIANCE_RISK';
      reason = 'Low CPAP usage';
    }

    else if (row.ahi_avg_7d > 10 || row.leak_avg_7d > 20) {
      score = 65;
      actionGroupCode = 'THERAPY_ISSUES';
      reason = 'AHI / Leak issue';
    }

    else if (row.days_since_setup <= 30) {
      score = 30;
      actionGroupCode = 'NEW_SETUP';
      reason = `New setup: ${row.days_since_setup} days`;
    }

    // =========================
    // GET GROUP ID
    // =========================
    const group = await db.query(`
      SELECT id FROM action_groups WHERE code = $1 LIMIT 1
    `, [actionGroupCode]);

    if (!group.rows.length) continue;

    const actionGroupId = group.rows[0].id;

    const priority = getPriority(score);

    // =========================
    // INSERT CASE
    // =========================
    const insert = await db.query(`
      INSERT INTO patient_action_status (
        patient_id,
        action_group_id,
        reason,
        score,
        priority,
        status,
        is_current,
        no_data_days,
        usage_avg_3d,
        usage_avg_7d,
        ahi_avg_7d,
        leak_avg_7d,
        unresolved_days,
        revenue_estimate,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,'open',true,
        $6,$7,$8,$9,$10,$11,50,NOW(),NOW()
      )
      RETURNING *
    `, [
      row.patient_id,
      actionGroupId,
      reason,
      score,
      priority,
      row.no_data_days,
      row.usage_avg_3d,
      row.usage_avg_7d,
      row.ahi_avg_7d,
      row.leak_avg_7d,
      row.unresolved_days
    ]);

    created.push(insert.rows[0]);
  }

  return created;
}

module.exports = {
  recalculateAtlas
};