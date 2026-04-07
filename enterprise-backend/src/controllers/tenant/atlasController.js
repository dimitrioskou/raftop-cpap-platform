const atlasService = require('../../services/tenant/atlasService');
const getTenantId = require('../../utils/getTenantId');

async function getAtlasSummary(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.getAtlasSummary({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getAtlasQueue(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const priority = typeof req.query.priority === 'string' ? req.query.priority.trim() : '';

    const data = await atlasService.getAtlasQueue({
      tenantId,
      search: q,
      priority
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getAtlasDaily(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.getAtlasDaily({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getAtlasTasks(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const data = await atlasService.getAtlasTasks({
      tenantId,
      search: q
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getAtlasAlerts(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.getAtlasAlerts({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function getAtlasAutoActions(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.getAtlasAutoActions({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function recalculateAtlas(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.recalculateAtlas({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function runAiScoring(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.runAiScoring({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function runAutoActions(req, res, next) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(400).json({ message: 'Missing tenant id.' });
    }

    const data = await atlasService.runAutoActions({ tenantId });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAtlasSummary,
  getAtlasQueue,
  getAtlasDaily,
  getAtlasTasks,
  getAtlasAlerts,
  getAtlasAutoActions,
  recalculateAtlas,
  runAiScoring,
  runAutoActions
};