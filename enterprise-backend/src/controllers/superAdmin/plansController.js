const plansService = require('../../services/superAdminPlansService');
const { ok, fail } = require('../../utils/responses');

async function list(req, res, next) {
  try {
    const data = await plansService.listPlans();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function details(req, res, next) {
  try {
    const { planId } = req.params;
    const data = await plansService.getPlan(planId);

    if (!data) {
      return fail(res, 'Plan not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { code, name } = req.body || {};

    if (!code || !name) {
      return fail(res, 'code and name are required', 400);
    }

    const data = await plansService.createPlan(req.body);
    return ok(res, data, 201);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { planId } = req.params;
    const data = await plansService.updatePlan(planId, req.body);

    if (!data) {
      return fail(res, 'Plan not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  details,
  create,
  update
};