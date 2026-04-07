const notes = [
  {
    id: 'note_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    title: 'Follow-up note',
    note: 'Patient requested callback in two days.',
    category: 'followup',
    visibility: 'internal',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'note_clinic_1',
    organization_id: 'org_demo_clinic_1',
    patient_id: 'patient_clinic_1',
    title: 'General note',
    note: 'Clinic review completed.',
    category: 'general',
    visibility: 'internal',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = notes.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  if (filters.category) {
    rows = rows.filter(
      (item) => String(item.category).toLowerCase() === String(filters.category).toLowerCase()
    );
  }

  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    rows = rows.filter((item) => {
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.note || '').toLowerCase().includes(q)
      );
    });
  }

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function findByIdAndOrganizationId(noteId, organizationId) {
  return (
    notes.find(
      (item) =>
        String(item.id) === String(noteId) &&
        String(item.organization_id) === String(organizationId)
    ) || null
  );
}

async function create(payload) {
  const item = {
    id: `note_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    title: payload.title || '',
    note: payload.note || '',
    category: payload.category || 'general',
    visibility: payload.visibility || 'internal',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  notes.unshift(item);
  return item;
}

async function update(noteId, organizationId, payload) {
  const index = notes.findIndex(
    (item) =>
      String(item.id) === String(noteId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  notes[index] = {
    ...notes[index],
    ...payload,
    id: notes[index].id,
    organization_id: notes[index].organization_id,
    updated_at: new Date().toISOString()
  };

  return notes[index];
}

async function remove(noteId, organizationId) {
  const index = notes.findIndex(
    (item) =>
      String(item.id) === String(noteId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return false;
  }

  notes.splice(index, 1);
  return true;
}

module.exports = {
  findAllByOrganizationId,
  findByIdAndOrganizationId,
  create,
  update,
  remove
};