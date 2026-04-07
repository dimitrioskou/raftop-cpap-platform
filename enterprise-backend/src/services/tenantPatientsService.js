const patientsRepo = require('../repositories/patientsRepo');

async function list(organizationId, filters = {}) {
  return patientsRepo.findAllByOrganizationId(organizationId, filters);
}

async function details(organizationId, patientId) {
  return patientsRepo.findByIdAndOrganizationId(patientId, organizationId);
}

async function create(organizationId, userId, payload) {
  return patientsRepo.create({
    ...payload,
    organization_id: organizationId,
    created_by_user_id: userId,
    updated_by_user_id: userId
  });
}

async function update(organizationId, patientId, userId, payload) {
  return patientsRepo.update(patientId, organizationId, {
    ...payload,
    updated_by_user_id: userId
  });
}

async function remove(organizationId, patientId) {
  return patientsRepo.remove(patientId, organizationId);
}

module.exports = {
  list,
  details,
  create,
  update,
  remove
};