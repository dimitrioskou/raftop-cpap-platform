const workspaceService = require('../../services/tenant/workspaceService');
const getTenantId = require('../../utils/getTenantId');

function getSearch(req) {
  return typeof req.query.q === 'string' ? req.query.q.trim() : '';
}

async function getDashboard(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getDashboard({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getPatients(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getPatients({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getDevices(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getDevices({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getCompliance(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getCompliance({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getFollowups(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getFollowups({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getTasks(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getTasks({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getNotes(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getNotes({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getReferrals(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getReferrals({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getNotifications(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getNotifications({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getUsers({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getModules(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getModules({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getIntegrations(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getIntegrations({
      tenantId,
      search: getSearch(req)
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getBranding(req, res, next) {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Missing tenant id.' });

    const data = await workspaceService.getBranding({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getDashboard,
  getPatients,
  getDevices,
  getCompliance,
  getFollowups,
  getTasks,
  getNotes,
  getReferrals,
  getNotifications,
  getUsers,
  getModules,
  getIntegrations,
  getBranding
};