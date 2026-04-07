const modulesService = require('../../services/superAdminModulesService');
const { ok, fail } = require('../../utils/responses');

async function listByOrganization(req, res, next) {
  try {
    const { organizationId } = req.params;
    const data = await modulesService.listModulesByOrganization(organizationId);
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function updateModuleState(req, res, next) {
  try {
    const { organizationId, moduleCode } = req.params;
    const { is_enabled } = req.body || {};

    if (typeof is_enabled !== 'boolean') {
      return fail(res, 'is_enabled must be boolean', 400);
    }

    const data = await modulesService.updateModuleState(
      organizationId,
      moduleCode,
      is_enabled
    );

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listByOrganization,
  updateModuleState
};