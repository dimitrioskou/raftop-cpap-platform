const { env } = require('../config/env');

function getMockSuperAdminUser() {
  return {
    id: 'user_super_admin_1',
    first_name: 'Platform',
    last_name: 'Owner',
    email: env.superAdminEmail,
    password: env.superAdminPassword,
    phone: '',
    is_platform_super_admin: true,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function findByEmail(email) {
  const superAdmin = getMockSuperAdminUser();

  if (String(email || '').toLowerCase() === String(superAdmin.email).toLowerCase()) {
    return superAdmin;
  }

  return null;
}

async function findById(userId) {
  const superAdmin = getMockSuperAdminUser();

  if (String(userId) === String(superAdmin.id)) {
    return superAdmin;
  }

  return null;
}

module.exports = {
  findByEmail,
  findById,
  getMockSuperAdminUser
};