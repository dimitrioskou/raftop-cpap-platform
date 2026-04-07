const referrals = [
  {
    id: 'ref_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    patient_name: 'Maria Papadopoulou',
    doctor_name: 'Dr. Demo',
    clinic_name: 'Athens Pulmo Clinic',
    referral_reason: 'Low adherence review',
    priority: 'high',
    status: 'open',
    note: 'Needs rapid contact.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ref_clinic_1',
    organization_id: 'org_demo_clinic_1',
    patient_id: 'patient_clinic_1',
    patient_name: 'Eleni Kosta',
    doctor_name: 'Dr. Clinic',
    clinic_name: 'Athens Sleep Clinic',
    referral_reason: 'General CPAP follow-up',
    priority: 'medium',
    status: 'open',
    note: 'Routine review.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = referrals.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );

  if (filters.status) {
    rows = rows.filter(
      (item) => String(item.status).toLowerCase() === String(filters.status).toLowerCase()
    );
  }

  if (filters.q) {
    const q = String(filters.q).toLowerCase();
    rows = rows.filter((item) =>
      String(item.patient_name || '').toLowerCase().includes(q) ||
      String(item.doctor_name || '').toLowerCase().includes(q) ||
      String(item.clinic_name || '').toLowerCase().includes(q) ||
      String(item.referral_reason || '').toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function findByIdAndOrganizationId(referralId, organizationId) {
  return (
    referrals.find(
      (item) =>
        String(item.id) === String(referralId) &&
        String(item.organization_id) === String(organizationId)
    ) || null
  );
}

async function create(payload) {
  const item = {
    id: `ref_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    patient_name: payload.patient_name || '',
    doctor_name: payload.doctor_name || '',
    clinic_name: payload.clinic_name || '',
    referral_reason: payload.referral_reason || '',
    priority: payload.priority || 'medium',
    status: payload.status || 'open',
    note: payload.note || '',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  referrals.unshift(item);
  return item;
}

async function update(referralId, organizationId, payload) {
  const index = referrals.findIndex(
    (item) =>
      String(item.id) === String(referralId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) return null;

  referrals[index] = {
    ...referrals[index],
    ...payload,
    id: referrals[index].id,
    organization_id: referrals[index].organization_id,
    updated_at: new Date().toISOString()
  };

  return referrals[index];
}

async function remove(referralId, organizationId) {
  const index = referrals.findIndex(
    (item) =>
      String(item.id) === String(referralId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) return false;

  referrals.splice(index, 1);
  return true;
}

module.exports = {
  findAllByOrganizationId,
  findByIdAndOrganizationId,
  create,
  update,
  remove
};