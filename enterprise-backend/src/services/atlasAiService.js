const db = require('../config/db');

// =============================
// AI SCORING ENGINE
// =============================
function calculateRisk(row) {
  let score = 0;

  const usage3 = Number(row.usage_avg_3d || 0);
  const usage7 = Number(row.usage_avg_7d || 0);
  const ahi = Number(row.ahi_avg_7d || 0);
  const leak = Number(row.leak_avg_7d || 0);
  const noData = Number(row.no_data_days || 0);
  const unresolved = Number(row.unresolved_days || 0);
  const revenue = Number(row.revenue_estimate || 0);

  // 📉 Usage drop (VERY IMPORTANT)
  if (usage7 > 0 && usage3 < usage7) {
    score += (usage7 - usage3) * 10;
  }

  // 🚨 Low usage
  if (usage7 < 4) score += 30;
  if (usage7 < 2) score += 50;

  // 😷 AHI
  if (ahi > 10) score += 20;
  if (ahi > 20) score += 40;

  // 💨 Leak
  if (leak > 20) score += 15;
  if (leak > 40) score += 30;

  // 📡 No data
  score += noData * 5;

  // ⏳ Unresolved
  score += unresolved * 3;

  // 💰 Revenue weight
  score += revenue * 0.2;

  return Math.round(score);
}

function getRiskLevel(score) {
  if (score > 120) return 'critical';
  if (score > 80) return 'high';
  if (score > 40) return 'medium';
  return 'low';
}

// =============================
// MAIN FUNCTION
// =============================
async function runAiScoring() {
  const result = await db.query(`
    SELECT
      pas.id,
      pas.usage_avg_3d,
      pas.usage_avg_7d,
      pas.ahi_avg_7d,
      pas.leak_avg_7d,
      pas.no_data_days,
      pas.unresolved_days,
      pas.revenue_estimate
    FROM patient_action_status pas
    WHERE pas.status = 'open'
      AND pas.is_current = true
  `);

  const updates = [];

  for (const row of result.rows) {
    const aiScore = calculateRisk(row);
    const riskLevel = getRiskLevel(aiScore);

    const updated = await db.query(`
      UPDATE patient_action_status
      SET ai_score = $1,
          risk_level = $2
      WHERE id = $3
      RETURNING id, ai_score, risk_level
    `, [aiScore, riskLevel, row.id]);

    updates.push(updated.rows[0]);
  }

  return updates;
}

module.exports = {
  runAiScoring
};