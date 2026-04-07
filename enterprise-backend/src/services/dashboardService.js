const organizationsRepo = require('../repositories/organizationsRepo');
const licensesRepo = require('../repositories/licensesRepo');

async function getSuperAdminOverview() {
  const organizations = await organizationsRepo.findAll();
  const licenses = await licensesRepo.findAll();

  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter((o) => o.status === 'active').length;
  const suspendedOrganizations = organizations.filter((o) => o.status === 'suspended').length;
  const blockedOrganizations = organizations.filter((o) => o.status === 'blocked').length;
  const resellerOrganizations = licenses.filter((l) => l.reseller_enabled).length;

  return {
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    blockedOrganizations,
    resellerOrganizations,
    totalUsers: 1,
    totalPatients: 7000,
    totalDevices: 6500
  };
}

module.exports = {
  getSuperAdminOverview
};