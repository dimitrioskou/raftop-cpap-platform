const modulesRepo = require('../repositories/modulesRepo');

async function listModulesByOrganization(organizationId) {
  return modulesRepo.findByOrganizationId(organizationId);
}

async function updateModuleState(organizationId, moduleCode, isEnabled) {
  return modulesRepo.setModuleState(organizationId, moduleCode, isEnabled);
}

module.exports = {
  listModulesByOrganization,
  updateModuleState
};