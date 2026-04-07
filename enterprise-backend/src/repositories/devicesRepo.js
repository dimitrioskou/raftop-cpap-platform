const devices = [
  {
    id: 'device_raft_1',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_1',
    serial_number: 'CPAP-AX1001',
    brand: 'ResMed',
    model: 'AirSense 10',
    device_type: 'CPAP',
    status: 'active',
    assigned_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    notes: 'Main therapy device.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'device_raft_2',
    organization_id: 'org_raftopoulos_master',
    patient_id: 'patient_raft_2',
    serial_number: 'CPAP-BX2040',
    brand: 'BMC',
    model: 'G3',
    device_type: 'CPAP',
    status: 'offline',
    assigned_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    notes: 'Needs sync check.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'device_clinic_1',
    organization_id: 'org_demo_clinic_1',
    patient_id: 'patient_clinic_1',
    serial_number: 'SEFAM-001',
    brand: 'SEFAM',
    model: 'S.Box',
    device_type: 'CPAP',
    status: 'active',
    assigned_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
    notes: 'Clinic device.',
    created_by_user_id: 'user_super_admin_1',
    updated_by_user_id: 'user_super_admin_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAllByOrganizationId(organizationId, filters = {}) {
  let rows = devices.filter(
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
        String(item.serial_number || '').toLowerCase().includes(q) ||
        String(item.brand || '').toLowerCase().includes(q) ||
        String(item.model || '').toLowerCase().includes(q)
      );
    });
  }

  rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return rows;
}

async function findByIdAndOrganizationId(deviceId, organizationId) {
  return (
    devices.find(
      (item) =>
        String(item.id) === String(deviceId) &&
        String(item.organization_id) === String(organizationId)
    ) || null
  );
}

async function create(payload) {
  const item = {
    id: `device_${Date.now()}`,
    organization_id: payload.organization_id,
    patient_id: payload.patient_id || null,
    serial_number: payload.serial_number || '',
    brand: payload.brand || '',
    model: payload.model || '',
    device_type: payload.device_type || 'CPAP',
    status: payload.status || 'active',
    assigned_at: payload.assigned_at || new Date().toISOString(),
    last_sync_at: payload.last_sync_at || null,
    notes: payload.notes || '',
    created_by_user_id: payload.created_by_user_id || null,
    updated_by_user_id: payload.updated_by_user_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  devices.unshift(item);
  return item;
}

async function update(deviceId, organizationId, payload) {
  const index = devices.findIndex(
    (item) =>
      String(item.id) === String(deviceId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return null;
  }

  devices[index] = {
    ...devices[index],
    ...payload,
    id: devices[index].id,
    organization_id: devices[index].organization_id,
    updated_at: new Date().toISOString()
  };

  return devices[index];
}

async function remove(deviceId, organizationId) {
  const index = devices.findIndex(
    (item) =>
      String(item.id) === String(deviceId) &&
      String(item.organization_id) === String(organizationId)
  );

  if (index === -1) {
    return false;
  }

  devices.splice(index, 1);
  return true;
}

module.exports = {
  findAllByOrganizationId,
  findByIdAndOrganizationId,
  create,
  update,
  remove
};