const billingService = require('../../services/tenant/billingService');
const getTenantId = require('../../utils/getTenantId');

async function getDoctorBillingSummary(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const data = await billingService.getDoctorBillingSummary({
      tenantId,
      search: q
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getRevenueAnalytics(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const range = typeof req.query.range === 'string' ? req.query.range.trim() : '6m';

    const data = await billingService.getRevenueAnalytics({
      tenantId,
      range
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createDoctorCheckoutSession(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const doctorId = req.body?.doctorId ? String(req.body.doctorId) : '';
    const plan = req.body?.plan ? String(req.body.plan) : 'Starter';

    if (!doctorId) {
      return res.status(400).json({ message: 'Missing doctorId.' });
    }

    const data = await billingService.createDoctorCheckoutSession({
      tenantId,
      doctorId,
      plan
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createDoctorBillingPortalSession(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const doctorId = req.body?.doctorId ? String(req.body.doctorId) : '';

    if (!doctorId) {
      return res.status(400).json({ message: 'Missing doctorId.' });
    }

    const data = await billingService.createDoctorBillingPortalSession({
      tenantId,
      doctorId
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDoctorBillingSummary,
  getRevenueAnalytics,
  createDoctorCheckoutSession,
  createDoctorBillingPortalSession
};