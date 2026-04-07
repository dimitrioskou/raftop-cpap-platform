const paymentsService = require('../../services/tenant/paymentsService');
const getTenantId = require('../../utils/getTenantId');

function getSearch(req) {
  return typeof req.query.q === 'string' ? req.query.q.trim() : '';
}

async function getPaymentsConfig(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.getPaymentsConfig({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createCardPaymentIntent(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.createCardPaymentIntent({
      tenantId,
      doctorId: req.body?.doctorId,
      customerName: req.body?.customerName,
      customerEmail: req.body?.customerEmail,
      description: req.body?.description,
      amount: req.body?.amount,
      currency: req.body?.currency || 'EUR',
      metadata: req.body?.metadata || {}
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createPayPalOrder(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.createPayPalOrder({
      tenantId,
      doctorId: req.body?.doctorId,
      customerName: req.body?.customerName,
      customerEmail: req.body?.customerEmail,
      description: req.body?.description,
      amount: req.body?.amount,
      currency: req.body?.currency || 'EUR',
      metadata: req.body?.metadata || {}
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function capturePayPalOrder(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.capturePayPalOrder({
      tenantId,
      providerOrderId: req.body?.providerOrderId
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createBankTransferPayment(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.createBankTransferPayment({
      tenantId,
      doctorId: req.body?.doctorId,
      customerName: req.body?.customerName,
      customerEmail: req.body?.customerEmail,
      description: req.body?.description,
      amount: req.body?.amount,
      currency: req.body?.currency || 'EUR',
      notes: req.body?.notes || ''
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function createCashPayment(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.createCashPayment({
      tenantId,
      doctorId: req.body?.doctorId,
      customerName: req.body?.customerName,
      customerEmail: req.body?.customerEmail,
      description: req.body?.description,
      amount: req.body?.amount,
      currency: req.body?.currency || 'EUR',
      notes: req.body?.notes || ''
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function listPayments(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await paymentsService.listPayments({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function verifyPayment(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const paymentId = req.body?.paymentId ? String(req.body.paymentId) : '';
    const status = req.body?.status ? String(req.body.status) : 'verified';

    if (!paymentId) {
      return res.status(400).json({ message: 'Missing paymentId.' });
    }

    const data = await paymentsService.verifyPayment({
      tenantId,
      paymentId,
      status
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPaymentsConfig,
  createCardPaymentIntent,
  createPayPalOrder,
  capturePayPalOrder,
  createBankTransferPayment,
  createCashPayment,
  listPayments,
  verifyPayment
};