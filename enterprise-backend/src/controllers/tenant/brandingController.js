const brandingService = require('../../services/tenant/brandingService');
const getTenantId = require('../../utils/getTenantId');

async function getTenantBranding(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message: 'Missing tenant id.'
      });
    }

    const data = await brandingService.getTenantBranding({ tenantId });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTenantBranding
};