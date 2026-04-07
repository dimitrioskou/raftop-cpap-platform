export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateRiskScore(patient) {
  const usage = safeNumber(patient.usage_hours_month);
  const ahi = safeNumber(patient.ahi);
  const leak = safeNumber(patient.leak);

  let score = 0;

  if (usage < 20) score += 45;
  else if (usage < 40) score += 35;
  else if (usage < 80) score += 20;
  else score += 5;

  if (ahi >= 30) score += 30;
  else if (ahi >= 15) score += 20;
  else if (ahi >= 5) score += 10;

  if (leak >= 40) score += 20;
  else if (leak >= 20) score += 10;

  return Math.min(score, 100);
}

export function getRiskLevel(score) {
  if (score >= 70) return 'critical';
  if (score >= 45) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

export function getPredictionText(patient) {
  const score = calculateRiskScore(patient);
  const level = getRiskLevel(score);

  if (level === 'critical') {
    return 'High probability of compliance failure within the next 7-14 days. Immediate intervention recommended.';
  }

  if (level === 'high') {
    return 'Elevated risk of non-compliance. Patient should be contacted soon and usage barriers reviewed.';
  }

  if (level === 'medium') {
    return 'Moderate risk. Monitor closely and reinforce adherence guidance.';
  }

  return 'Low current risk. Continue normal monitoring.';
}

export function getRecommendedActions(patient) {
  const score = calculateRiskScore(patient);
  const actions = [];

  if (safeNumber(patient.usage_hours_month) < 80) {
    actions.push('Schedule adherence coaching call');
  }

  if (safeNumber(patient.ahi) > 15) {
    actions.push('Clinical review of therapy effectiveness');
  }

  if (safeNumber(patient.leak) > 20) {
    actions.push('Mask fit and leak troubleshooting');
  }

  if (score >= 70) {
    actions.push('Escalate to urgent ATLAS follow-up');
  } else if (score >= 45) {
    actions.push('Create follow-up task within 48 hours');
  } else {
    actions.push('Continue weekly monitoring');
  }

  return actions;
}

export function buildRiskTrajectory(patient) {
  const currentUsage = safeNumber(patient.usage_hours_month);
  const currentAhi = safeNumber(patient.ahi);
  const currentLeak = safeNumber(patient.leak);

  const points = [
    {
      label: 'W-3',
      risk: Math.max(5, calculateRiskScore({
        usage_hours_month: currentUsage + 20,
        ahi: Math.max(0, currentAhi - 3),
        leak: Math.max(0, currentLeak - 5)
      }))
    },
    {
      label: 'W-2',
      risk: Math.max(5, calculateRiskScore({
        usage_hours_month: currentUsage + 10,
        ahi: Math.max(0, currentAhi - 2),
        leak: Math.max(0, currentLeak - 3)
      }))
    },
    {
      label: 'W-1',
      risk: Math.max(5, calculateRiskScore({
        usage_hours_month: currentUsage + 5,
        ahi: Math.max(0, currentAhi - 1),
        leak: Math.max(0, currentLeak - 1)
      }))
    },
    {
      label: 'Now',
      risk: calculateRiskScore(patient)
    },
    {
      label: 'Forecast',
      risk: Math.min(
        100,
        calculateRiskScore({
          usage_hours_month: currentUsage - 10,
          ahi: currentAhi + 2,
          leak: currentLeak + 3
        })
      )
    }
  ];

  return points;
}

export function buildSuggestedMessages(patient) {
  const usage = safeNumber(patient.usage_hours_month);
  const ahi = safeNumber(patient.ahi);
  const leak = safeNumber(patient.leak);

  return {
    sms:
      usage < 80
        ? `Hello ${patient.full_name || 'patient'}, we noticed lower CPAP usage recently. Please continue nightly use and contact our team if you need support.`
        : `Hello ${patient.full_name || 'patient'}, thank you for continuing your CPAP therapy. Keep up the great work.`,
    email:
      ahi > 15 || leak > 20
        ? `Dear ${patient.full_name || 'patient'}, our monitoring suggests your therapy may benefit from review. We recommend a quick follow-up regarding mask fit, leak control, and therapy optimization.`
        : `Dear ${patient.full_name || 'patient'}, your therapy data looks generally stable. We encourage you to maintain regular nightly usage and contact us with any questions.`
  };
}