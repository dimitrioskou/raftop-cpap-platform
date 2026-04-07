const memberships = [
  {
    id: 'membership_super_admin_1',
    organization_id: 'org_raftopoulos_master',
    user_id: 'user_super_admin_1',
    role_id: 'role_super_admin',
    role_code: 'SUPER_ADMIN',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findByUserId(userId) {
  return memberships.filter((item) => String(item.user_id) === String(userId));
}

async function findPrimaryByUserId(userId) {
  const rows = await findByUserId(userId);
  return rows[0] || null;
}

module.exports = {
  findByUserId,
  findPrimaryByUserId
};