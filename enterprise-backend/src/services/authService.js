const usersRepo = require('../repositories/usersRepo');
const organizationUsersRepo = require('../repositories/organizationUsersRepo');
const organizationsRepo = require('../repositories/organizationsRepo');
const licensesRepo = require('../repositories/licensesRepo');
const modulesRepo = require('../repositories/modulesRepo');
const { encodeSessionPayload } = require('../utils/tokens');

async function login(email, password) {
  const user = await usersRepo.findByEmail(email);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (String(user.status) !== 'active') {
    throw new Error('User is not active');
  }

  if (String(user.password) !== String(password)) {
    throw new Error('Invalid credentials');
  }

  const membership = await organizationUsersRepo.findPrimaryByUserId(user.id);
  const organization = membership
    ? await organizationsRepo.findById(membership.organization_id)
    : null;

  const sessionPayload = {
    userId: user.id,
    organizationId: organization?.id || null,
    isPlatformSuperAdmin: !!user.is_platform_super_admin
  };

  const accessToken = encodeSessionPayload(sessionPayload);

  return {
    accessToken,
    user,
    membership,
    organization
  };
}

async function getMe(sessionUser) {
  const user = await usersRepo.findById(sessionUser.userId);

  if (!user) {
    throw new Error('User not found');
  }

  const memberships = await organizationUsersRepo.findByUserId(user.id);
  const currentMembership =
    memberships.find(
      (item) => String(item.organization_id) === String(sessionUser.organizationId)
    ) || memberships[0] || null;

  const organization = currentMembership
    ? await organizationsRepo.findById(currentMembership.organization_id)
    : null;

  const license = organization
    ? await licensesRepo.findByOrganizationId(organization.id)
    : null;

  const modules = organization
    ? await modulesRepo.findByOrganizationId(organization.id)
    : [];

  return {
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      is_platform_super_admin: !!user.is_platform_super_admin,
      status: user.status
    },
    currentOrganization: organization,
    currentMembership,
    license,
    modules
  };
}

module.exports = {
  login,
  getMe
};