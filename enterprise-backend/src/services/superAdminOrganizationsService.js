const organizationsRepo = require('../repositories/organizationsRepo');
const licensesRepo = require('../repositories/licensesRepo');
const modulesRepo = require('../repositories/modulesRepo');
const subscriptionsRepo = require('../repositories/subscriptionsRepo');

async function listOrganizations() {
  const organizations = await organizationsRepo.findAll();

  const enriched = await Promise.all(
    organizations.map(async (organization) => {
      const license = await licensesRepo.findByOrganizationId(organization.id);
      const subscription = await subscriptionsRepo.findByOrganizationId(organization.id);
      const modules = await modulesRepo.findByOrganizationId(organization.id);

      return {
        ...organization,
        license,
        subscription,
        modules_count: modules.length
      };
    })
  );

  return enriched;
}

async function getOrganizationDetails(organizationId) {
  const organization = await organizationsRepo.findById(organizationId);

  if (!organization) {
    return null;
  }

  const license = await licensesRepo.findByOrganizationId(organization.id);
  const subscription = await subscriptionsRepo.findByOrganizationId(organization.id);
  const modules = await modulesRepo.findByOrganizationId(organization.id);

  return {
    ...organization,
    license,
    subscription,
    modules
  };
}

async function createOrganization(payload) {
  return organizationsRepo.create(payload);
}

async function updateOrganization(organizationId, payload) {
  return organizationsRepo.update(organizationId, payload);
}

async function updateOrganizationStatus(organizationId, status) {
  return organizationsRepo.updateStatus(organizationId, status);
}

module.exports = {
  listOrganizations,
  getOrganizationDetails,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus
};