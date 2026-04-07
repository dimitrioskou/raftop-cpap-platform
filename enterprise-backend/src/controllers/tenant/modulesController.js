const modulesService = require('../../services/tenant/modulesService');
const getTenantId = require('../../utils/getTenantId');

async function getTenantModules(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message: 'Missing tenant id.'
      });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const data = await modulesService.getTenantModules({
      tenantId,
      search: q
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTenantModules
};