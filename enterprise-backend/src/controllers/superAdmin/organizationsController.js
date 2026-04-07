const organizationsService = require('../../services/superAdminOrganizationsService');
const { ok, fail } = require('../../utils/responses');

async function list(req, res, next) {
  try {
    const data = await organizationsService.listOrganizations();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function details(req, res, next) {
  try {
    const { organizationId } = req.params;
    const data = await organizationsService.getOrganizationDetails(organizationId);

    if (!data) {
      return fail(res, 'Organization not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { name, slug } = req.body || {};

    if (!name || !slug) {
      return fail(res, 'name and slug are required', 400);
    }

    const data = await organizationsService.createOrganization(req.body);
    return ok(res, data, 201);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { organizationId } = req.params;
    const data = await organizationsService.updateOrganization(organizationId, req.body);

    if (!data) {
      return fail(res, 'Organization not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return fail(res, 'status is required', 400);
    }

    const data = await organizationsService.updateOrganizationStatus(organizationId, status);

    if (!data) {
      return fail(res, 'Organization not found', 404);
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
  update,
  updateStatus
};