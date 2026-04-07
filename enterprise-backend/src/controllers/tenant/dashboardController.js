const dashboardService = require('../../services/tenant/dashboardService');
const getTenantId = require('../../utils/getTenantId');

async function getTenantDashboard(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({
        message: 'Missing tenant id.'
      });
    }

    const data = await dashboardService.getTenantDashboard({ tenantId });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTenantDashboard
};