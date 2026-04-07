const outcomes = [
  {
    id: 'outcome_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    task_id: 'task_raft_1',
    outcome_status: 'callback_requested',
    note: 'Patient asked to be called tomorrow.',
    callback_at: new Date(Date.now() + 86400000).toISOString(),
    created_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId) {
  const rows = outcomes.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows;
}

async function create(payload) {
  const item = {
    id: `outcome_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    task_id: payload.task_id || null,
    outcome_status: payload.outcome_status || 'reached',
    note: payload.note || '',
    callback_at: payload.callback_at || null,
    created_by_user_id: payload.created_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  outcomes.unshift(item);
  return item;
}

async function getSummaryByOrganizationId(organizationId) {
  const rows = await findAllByOrganizationId(organizationId);

  const summary = {
    total: rows.length,
    reached: 0,
    no_answer: 0,
    callback_requested: 0,
    refused: 0,
    promised_improvement: 0
  };

  rows.forEach((item) => {
    const key = String(item.outcome_status || '').toLowerCase();
    if (summary[key] !== undefined) {
      summary[key] += 1;
    }
  });

  return summary;
}

module.exports = {
  findAllByOrganizationId,
  create,
  getSummaryByOrganizationId
};