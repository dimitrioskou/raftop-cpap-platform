const referralsRepo = require('../repositories/referralsRepo');

async function list(organizationId, filters = {}) {
  return referralsRepo.findAllByOrganizationId(organizationId, filters);
}

async function details(organizationId, referralId) {
  return referralsRepo.findByIdAndOrganizationId(referralId, organizationId);
}

async function create(organizationId, userId, payload) {
  return referralsRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function update(organizationId, referralId, userId, payload) {
  return referralsRepo.update(referralId, organizationId, {
    ...payload,
    updated_by_user_id: userId
  });
}

async function remove(organizationId, referralId) {
  return referralsRepo.remove(referralId, organizationId);
}

module.exports = {
  list,
  details,
  create,
  update,
  remove
};