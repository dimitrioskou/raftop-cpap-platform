const organizations = [
  {
    id: 'org_raftopoulos_master',
    name: 'RAFTOPOULOS',
    slug: 'raftopoulos',
    organization_type: 'master_reseller',
    parent_organization_id: null,
    status: 'active',
    branding_name: 'RAFTOPOULOS CPAP CARE',
    contact_email: 'support@raftopoulos.local',
    contact_phone: '',
    country: 'GR',
    timezone: 'Europe/Athens',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'org_demo_clinic_1',
    name: 'Athens Sleep Clinic',
    slug: 'athens-sleep-clinic',
    organization_type: 'clinic',
    parent_organization_id: 'org_raftopoulos_master',
    status: 'active',
    branding_name: 'Athens Sleep Clinic',
    contact_email: 'clinic@example.com',
    contact_phone: '',
    country: 'GR',
    timezone: 'Europe/Athens',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findById(organizationId) {
  return organizations.find((item) => String(item.id) === String(organizationId)) || null;
}

async function findAll() {
  return organizations;
}

async function create(payload) {
  const item = {
    id: `org_${Date.now()}`,
    name: payload.name,
    slug: payload.slug,
    organization_type: payload.organization_type || 'clinic',
    parent_organization_id: payload.parent_organization_id || null,
    status: payload.status || 'active',
    branding_name: payload.branding_name || payload.name,
    contact_email: payload.contact_email || '',
    contact_phone: payload.contact_phone || '',
    country: payload.country || 'GR',
    timezone: payload.timezone || 'Europe/Athens',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  organizations.unshift(item);
  return item;
}

async function update(organizationId, payload) {
  const index = organizations.findIndex(
    (item) => String(item.id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  organizations[index] = {
    ...organizations[index],
    ...payload,
    id: organizations[index].id,
    updated_at: new Date().toISOString()
  };

  return organizations[index];
}

async function updateStatus(organizationId, status) {
  const index = organizations.findIndex(
    (item) => String(item.id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  organizations[index] = {
    ...organizations[index],
    status,
    updated_at: new Date().toISOString()
  };

  return organizations[index];
}

module.exports = {
  findById,
  findAll,
  create,
  update,
  updateStatus
};