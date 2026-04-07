function calculatePriority(score) {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function calculateRevenue(selectedGroup, patient) {
  const usageAvg7d = Number(patient.usage_avg_7d || 0);
  const noDataDays = Number(patient.no_data_days || 0);
  const unresolvedDays = Number(patient.unresolved_days || 0);

  switch (selectedGroup) {
    case 'HIGH_VALUE':
      return 120;

    case 'COMPLIANCE_RISK':
      if (usageAvg7d < 2) return 120;
      if (usageAvg7d < 4) return 80;
      return 50;

    case 'NO_DATA':
      if (noDataDays >= 7) return 90;
      return 50;

    case 'THERAPY_ISSUES':
      return 60;

    case 'CRITICAL_CLINICAL':
      return 100;

    case 'NEW_SETUP':
      if (unresolvedDays >= 2) return 40;
      return 20;

    default:
      return 0;
  }
}

function evaluatePatientForAtlas(patient) {
  let score = 0;
  const reasons = [];
  let selectedGroup = null;

  const usageAvg3d = Number(patient.usage_avg_3d || 0);
  const usageAvg7d = Number(patient.usage_avg_7d || 0);
  const ahiAvg7d = Number(patient.ahi_avg_7d || 0);
  const leakAvg7d = Number(patient.leak_avg_7d || 0);
  const noDataDays = Number(patient.no_data_days || 0);
  const daysSinceSetup = Number(patient.days_since_setup || 9999);
  const unresolvedDays = Number(patient.unresolved_days || 0);
  const accessoryRenewalDueDays = Number(patient.accessory_renewal_due_days || 9999);

  if (noDataDays >= 7) {
    score += 40;
    reasons.push(`No data for ${noDataDays} days`);
    selectedGroup = 'NO_DATA';
  } else if (noDataDays >= 3) {
    score += 25;
    reasons.push(`No data for ${noDataDays} days`);
    selectedGroup = selectedGroup || 'NO_DATA';
  }

  if (ahiAvg7d > 15) {
    score += 35;
    reasons.push(`AHI avg 7d is ${ahiAvg7d}`);
    selectedGroup = 'CRITICAL_CLINICAL';
  } else if (ahiAvg7d > 10) {
    score += 20;
    reasons.push(`Elevated AHI avg 7d is ${ahiAvg7d}`);
    selectedGroup = selectedGroup || 'THERAPY_ISSUES';
  }

  if (usageAvg3d < 2) {
    score += 30;
    reasons.push(`Usage avg 3d is ${usageAvg3d}h`);
    selectedGroup = 'CRITICAL_CLINICAL';
  } else if (usageAvg7d < 4) {
    score += 25;
    reasons.push(`Usage avg 7d is ${usageAvg7d}h`);
    selectedGroup = selectedGroup || 'COMPLIANCE_RISK';
  }

  if (leakAvg7d > 24) {
    score += 20;
    reasons.push(`Leak avg 7d is ${leakAvg7d}`);
    selectedGroup = selectedGroup || 'THERAPY_ISSUES';
  }

  if (daysSinceSetup <= 30) {
    score += 10;
    reasons.push(`New setup: ${daysSinceSetup} days`);
    selectedGroup = selectedGroup || 'NEW_SETUP';
  }

  if (unresolvedDays > 7) {
    score += 15;
    reasons.push(`Unresolved for ${unresolvedDays} days`);
  }

  if (accessoryRenewalDueDays <= 15) {
    score += 10;
    reasons.push(`Accessory renewal due in ${accessoryRenewalDueDays} days`);
    if (!selectedGroup) selectedGroup = 'HIGH_VALUE';
  }

  const priority = calculatePriority(score);
  const revenue = calculateRevenue(selectedGroup, patient);

  return {
    selectedGroup,
    score,
    priority,
    reason: reasons.join(' | '),
    revenue
  };
}

module.exports = {
  calculatePriority,
  calculateRevenue,
  evaluatePatientForAtlas
};