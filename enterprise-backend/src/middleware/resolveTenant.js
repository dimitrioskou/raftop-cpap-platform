const organizationsRepo = require('../repositories/organizationsRepo');
const licensesRepo = require('../repositories/licensesRepo');
const modulesRepo = require('../repositories/modulesRepo');
const organizationUsersRepo = require('../repositories/organizationUsersRepo');

async function resolveTenant(req, res, next) {
  try {
    const organizationId = req.auth?.organizationId || null;

    if (!organizationId) {
      req.tenant = null;
      return next();
    }

    const organization = await organizationsRepo.findById(organizationId);
    const license = await licensesRepo.findByOrganizationId(organizationId);
    const modules = await modulesRepo.findByOrganizationId(organizationId);
    const membership = await organizationUsersRepo.findPrimaryByUserId(req.auth.userId);

    req.tenant = {
      organization,
      license,
      modules,
      membership
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { resolveTenant };