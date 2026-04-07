const rolePermissions = {
  SUPER_ADMIN: ['*'],

  MASTER_OWNER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.patients.write',
    'tenant.devices.read',
    'tenant.devices.write',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write',
    'tenant.referrals.read',
    'tenant.referrals.write',
    'tenant.followup.read',
    'tenant.followup.write',
    'tenant.rechecks.manage',
    'reseller.accounts.read',
    'reseller.accounts.write'
  ],

  ENTERPRISE_MANAGER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.patients.write',
    'tenant.devices.read',
    'tenant.devices.write',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write',
    'tenant.referrals.read',
    'tenant.referrals.write',
    'tenant.followup.read',
    'tenant.followup.write'
  ],

  FOLLOWUP_MANAGER: [
    'tenant.dashboard.read',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write',
    'tenant.followup.read',
    'tenant.followup.write',
    'tenant.rechecks.manage'
  ],

  STAFF_USER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.devices.read',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write',
    'tenant.followup.read'
  ],

  READ_ONLY_VIEWER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.devices.read',
    'tenant.tasks.read',
    'tenant.notes.read',
    'tenant.referrals.read',
    'tenant.followup.read'
  ],

  CLINIC_OWNER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.patients.write',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write',
    'tenant.followup.read',
    'tenant.followup.write'
  ],

  CLINIC_STAFF: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.tasks.read',
    'tenant.tasks.write',
    'tenant.notes.read',
    'tenant.notes.write'
  ],

  DOCTOR_VIEWER: [
    'tenant.dashboard.read',
    'tenant.patients.read',
    'tenant.followup.read'
  ]
};

function getPermissionsForRole(roleCode) {
  return rolePermissions[roleCode] || [];
}

function hasPermission(roleCode, permission) {
  const permissions = getPermissionsForRole(roleCode);
  return permissions.includes('*') || permissions.includes(permission);
}

module.exports = {
  getPermissionsForRole,
  hasPermission
};