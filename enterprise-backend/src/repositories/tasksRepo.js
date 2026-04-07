const tasks = [
  {
    id: 'task_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    assigned_user_id: 'user_super_admin_1',
    title: 'Call patient for low adherence',
    description: 'Follow-up about CPAP usage below target.',
    task_type: 'FOLLOW_UP',
    priority: 'HIGH',
    status: 'pending',
    due_at: new Date(Date.now() + 86400000).toISOString(),
    source_module: 'followup_center',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task_clinic_1',
    organization_id: 'org_demo_clinic_1',
    patient_id: 'patient_clinic_1',
    assigned_user_id: 'user_super_admin_1',
    title: 'Review patient progress',
    description: 'General follow-up review.',
    task_type: 'GENERAL',
    priority: 'MEDIUM',
    status: 'in_progress',
    due_at: new Date(Date.now() + 172800000).toISOString(),
    source_module: 'dashboard',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = tasks.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  if (filters.status) {
    rows = rows.filter(
      (item) => String(item.status).toLowerCase() === String(filters.status).toLowerCase()
    );
  }

  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    rows = rows.filter((item) => {
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q) ||
        String(item.task_type || '').toLowerCase().includes(q)
      );
    });
  }

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function findByIdAndOrganizationId(taskId, organizationId) {
  return (
    tasks.find(
      (item) =>
        String(item.id) === String(taskId) &&
        String(item.organization_id) === String(organizationId)
    ) || null
  );
}

async function create(payload) {
  const item = {
    id: `task_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    assigned_user_id: payload.assigned_user_id || null,
    title: payload.title || '',
    description: payload.description || '',
    task_type: payload.task_type || 'GENERAL',
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'pending',
    due_at: payload.due_at || null,
    source_module: payload.source_module || 'manual',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  tasks.unshift(item);
  return item;
}

async function update(taskId, organizationId, payload) {
  const index = tasks.findIndex(
    (item) =>
      String(item.id) === String(taskId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  tasks[index] = {
    ...tasks[index],
    ...payload,
    id: tasks[index].id,
    organization_id: tasks[index].organization_id,
    updated_at: new Date().toISOString()
  };

  return tasks[index];
}

async function remove(taskId, organizationId) {
  const index = tasks.findIndex(
    (item) =>
      String(item.id) === String(taskId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  return true;
}

module.exports = {
  findAllByOrganizationId,
  findByIdAndOrganizationId,
  create,
  update,
  remove
};