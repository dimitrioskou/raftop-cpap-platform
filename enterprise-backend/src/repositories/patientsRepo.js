const patients = [
  {
    id: 'patient_raft_1',
    organization_id: 'org_raftopoulos_master',
    external_code: 'RFT-0001',
    first_name: 'Maria',
    last_name: 'Papadopoulou',
    date_of_birth: '1978-04-12',
    phone: '6900000001',
    email: 'maria@example.com',
    gender: 'female',
    notes: 'Needs close follow-up for adherence.',
    status: 'active',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'patient_raft_2',
    organization_id: 'org_raftopoulos_master',
    external_code: 'RFT-0002',
    first_name: 'Giorgos',
    last_name: 'Nikolaou',
    date_of_birth: '1969-11-02',
    phone: '6900000002',
    email: 'giorgos@example.com',
    gender: 'male',
    notes: 'Device sync issue reported.',
    status: 'active',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'patient_clinic_1',
    organization_id: 'org_demo_clinic_1',
    external_code: 'CLN-0001',
    first_name: 'Eleni',
    last_name: 'Kosta',
    date_of_birth: '1980-09-21',
    phone: '6900000010',
    email: 'eleni@example.com',
    gender: 'female',
    notes: 'Clinic-owned patient record.',
    status: 'active',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = patients.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    rows = rows.filter((item) => {
      return (
        String(item.first_name || '').toLowerCase().includes(q) ||
        String(item.last_name || '').toLowerCase().includes(q) ||
        String(item.phone || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.external_code || '').toLowerCase().includes(q)
      );
    });
  }

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function findByIdAndOrganizationId(patientId, organizationId) {
  return (
    patients.find(
      (item) =>
        String(item.id) === String(patientId) &&
        String(item.organization_id) === String(organizationId)
    ) || null
  );
}

async function create(payload) {
  const item = {
    id: `patient_${Date.now()}`,
    organization_id: payload.organization_id,
    external_code: payload.external_code || '',
    first_name: payload.first_name || '',
    last_name: payload.last_name || '',
    date_of_birth: payload.date_of_birth || '',
    phone: payload.phone || '',
    email: payload.email || '',
    gender: payload.gender || '',
    notes: payload.notes || '',
    status: payload.status || 'active',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  patients.unshift(item);
  return item;
}

async function update(patientId, organizationId, payload) {
  const index = patients.findIndex(
    (item) =>
      String(item.id) === String(patientId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  patients[index] = {
    ...patients[index],
    ...payload,
    id: patients[index].id,
    organization_id: patients[index].organization_id,
    updated_at: new Date().toISOString()
  };

  return patients[index];
}

async function remove(patientId, organizationId) {
  const index = patients.findIndex(
    (item) =>
      String(item.id) === String(patientId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return false;
  }

  patients.splice(index, 1);
  return true;
}

module.exports = {
  findAllByOrganizationId,
  findByIdAndOrganizationId,
  create,
  update,
  remove
};