const licenses = [
  {
    id: 'license_raftopoulos_1',
    organization_id: 'org_raftopoulos_master',
    license_key: 'RAFTOP-ENT-001',
    license_status: 'active',
    issued_at: new Date().toISOString(),
    expires_at: null,
    max_users: 100,
    max_patients: 10000,
    max_devices: 10000,
    reseller_enabled: true,
    notes: 'Master reseller enterprise license',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'license_demo_clinic_1',
    organization_id: 'org_demo_clinic_1',
    license_key: 'RAFTOP-CLINIC-001',
    license_status: 'active',
    issued_at: new Date().toISOString(),
    expires_at: null,
    max_users: 10,
    max_patients: 300,
    max_devices: 300,
    reseller_enabled: false,
    notes: 'Clinic partner license',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findByOrganizationId(organizationId) {
  return licenses.find((item) => String(item.organization_id) === String(organizationId)) || null;
}

async function findAll() {
  return licenses;
}

async function findById(licenseId) {
  return licenses.find((item) => String(item.id) === String(licenseId)) || null;
}

async function create(payload) {
  const item = {
    id: `license_${Date.now()}`,
    organization_id: payload.organization_id,
    license_key: payload.license_key || `RAFTOP-${Date.now()}`,
    license_status: payload.license_status || 'active',
    issued_at: payload.issued_at || new Date().toISOString(),
    expires_at: payload.expires_at || null,
    max_users: Number(payload.max_users || 0),
    max_patients: Number(payload.max_patients || 0),
    max_devices: Number(payload.max_devices || 0),
    reseller_enabled: !!payload.reseller_enabled,
    notes: payload.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  licenses.unshift(item);
  return item;
}

async function update(licenseId, payload) {
  const index = licenses.findIndex((item) => String(item.id) === String(licenseId));

  if (index === -1) {
    return null;
  }

  licenses[index] = {
    ...licenses[index],
    ...payload,
    id: licenses[index].id,
    updated_at: new Date().toISOString()
  };

  return licenses[index];
}

async function updateStatus(licenseId, license_status) {
  const index = licenses.findIndex((item) => String(item.id) === String(licenseId));

  if (index === -1) {
    return null;
  }

  licenses[index] = {
    ...licenses[index],
    license_status,
    updated_at: new Date().toISOString()
  };

  return licenses[index];
}

module.exports = {
  findByOrganizationId,
  findAll,
  findById,
  create,
  update,
  updateStatus
};