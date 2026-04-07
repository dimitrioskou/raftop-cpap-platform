const rechecks = [
  {
    id: 'recheck_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    task_id: 'task_raft_1',
    scheduled_for: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'scheduled',
    reason: 'Low adherence recheck',
    note: 'Call again after mask adjustment.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId) {
  const rows = rechecks.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  rows.sort((a, b) => new Date(a.scheduled_for || 0) - new Date(b.scheduled_for || 0));
  return rows;
}

async function create(payload) {
  const item = {
    id: `recheck_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    task_id: payload.task_id || null,
    scheduled_for: payload.scheduled_for || null,
    status: payload.status || 'scheduled',
    reason: payload.reason || '',
    note: payload.note || '',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  rechecks.unshift(item);
  return item;
}

module.exports = {
  findAllByOrganizationId,
  create
};