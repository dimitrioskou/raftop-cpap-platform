const integrationsService = require('../../services/tenant/integrationsService');
const getTenantId = require('../../utils/getTenantId');

async function getTenantIntegrations(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message: 'Missing tenant id.'
      });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const data = await integrationsService.getTenantIntegrations({
      tenantId,
      search: q
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTenantIntegrations
};