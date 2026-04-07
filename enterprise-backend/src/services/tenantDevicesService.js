const devicesRepo = require('../repositories/devicesRepo');

async function list(organizationId, filters = {}) {
  return devicesRepo.findAllByOrganizationId(organizationId, filters);
}

async function details(organizationId, deviceId) {
  return devicesRepo.findByIdAndOrganizationId(deviceId, organizationId);
}

async function create(organizationId, userId, payload) {
  return devicesRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function update(organizationId, deviceId, userId, payload) {
  return devicesRepo.update(deviceId, organizationId, {
    ...payload,
    updated_by_user_id: userId
  });
}

async function remove(organizationId, deviceId) {
  return devicesRepo.remove(deviceId, organizationId);
}

module.exports = {
  list,
  details,
  create,
  update,
  remove
};