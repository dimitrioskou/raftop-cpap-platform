export function calculateComplianceRisk(patient) {
  const usage = Number(patient.usage_hours_month || 0);
  const ahi = Number(patient.ahi || 0);
  const leak = Number(patient.leak || 0);

  let score = 0;

  // Usage (80h threshold critical)
  if (usage < 40) score += 40;
  else if (usage < 80) score += 25;
  else score += 5;

  // AHI
  if (ahi > 30) score += 30;
  else if (ahi > 15) score += 20;
  else if (ahi > 5) score += 10;

  // Leak
  if (leak > 40) score += 20;
  else if (leak > 20) score += 10;

  return Math.min(score, 100);
}

export function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}