const organizationModules = [
  { organization_id: 'org_raftopoulos_master', module_code: 'dashboard', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'patients', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'devices', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'tasks', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'notes', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'referrals', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'compliance', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'followup_center', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'followup_outcomes', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'priority_queue', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'daily_board', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'recheck_scheduler', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'recovery_funnel', is_enabled: true },
  { organization_id: 'org_raftopoulos_master', module_code: 'reseller_panel', is_enabled: true },

  { organization_id: 'org_demo_clinic_1', module_code: 'dashboard', is_enabled: true },
  { organization_id: 'org_demo_clinic_1', module_code: 'patients', is_enabled: true },
  { organization_id: 'org_demo_clinic_1', module_code: 'tasks', is_enabled: true },
  { organization_id: 'org_demo_clinic_1', module_code: 'notes', is_enabled: true },
  { organization_id: 'org_demo_clinic_1', module_code: 'followup_center', is_enabled: true }
];

async function findByOrganizationId(organizationId) {
  return organizationModules.filter(
    (item) => String(item.organization_id) === String(organizationId)
  );
}

async function isModuleEnabled(organizationId, moduleCode) {
  const item = organizationModules.find(
    (row) =>
      String(row.organization_id) === String(organizationId) &&
      String(row.module_code) === String(moduleCode)
  );

  return !!item?.is_enabled;
}

async function setModuleState(organizationId, moduleCode, isEnabled) {
  const index = organizationModules.findIndex(
    (row) =>
      String(row.organization_id) === String(organizationId) &&
      String(row.module_code) === String(moduleCode)
  );

  if (index === -1) {
    const item = {
      organization_id: organizationId,
      module_code: moduleCode,
      is_enabled: !!isEnabled
    };
    organizationModules.push(item);
    return item;
  }

  organizationModules[index] = {
    ...organizationModules[index],
    is_enabled: !!isEnabled
  };

  return organizationModules[index];
}

module.exports = {
  findByOrganizationId,
  isModuleEnabled,
  setModuleState
};