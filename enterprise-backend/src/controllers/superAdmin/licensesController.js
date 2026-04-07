const licensesService = require('../../services/superAdminLicensesService');
const { ok, fail } = require('../../utils/responses');

async function list(req, res, next) {
  try {
    const data = await licensesService.listLicenses();
    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function details(req, res, next) {
  try {
    const { licenseId } = req.params;
    const data = await licensesService.getLicense(licenseId);

    if (!data) {
      return fail(res, 'License not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { organization_id } = req.body || {};

    if (!organization_id) {
      return fail(res, 'organization_id is required', 400);
    }

    const data = await licensesService.createLicense(req.body);
    return ok(res, data, 201);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { licenseId } = req.params;
    const data = await licensesService.updateLicense(licenseId, req.body);

    if (!data) {
      return fail(res, 'License not found', 404);
    }

    return ok(res, data);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { licenseId } = req.params;
    const { license_status } = req.body || {};

    if (!license_status) {
      return fail(res, 'license_status is required', 400);
    }

    const data = await licensesService.updateLicenseStatus(licenseId, license_status);

    if (!data) {
      return fail(res, 'License not found', 404);
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