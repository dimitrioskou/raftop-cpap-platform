const subscriptions = [
  {
    id: 'sub_raftopoulos_1',
    organization_id: 'org_raftopoulos_master',
    plan_id: 'plan_enterprise_1',
    billing_cycle: 'monthly',
    status: 'active',
    starts_at: new Date().toISOString(),
    ends_at: null,
    trial_ends_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub_demo_clinic_1',
    organization_id: 'org_demo_clinic_1',
    plan_id: 'plan_clinic_advanced_1',
    billing_cycle: 'monthly',
    status: 'active',
    starts_at: new Date().toISOString(),
    ends_at: null,
    trial_ends_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findByOrganizationId(organizationId) {
  return subscriptions.find(
    (item) => String(item.organization_id) === String(organizationId)
  ) || null;
}

module.exports = {
  findByOrganizationId
};