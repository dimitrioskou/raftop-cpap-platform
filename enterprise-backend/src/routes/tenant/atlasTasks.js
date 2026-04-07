const express = require('express');
const {
  extractActor,
  loadAtlasContext,
  buildAtlasTasks
} = require('../../services/atlasDerivedService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const actor = extractActor(req);
    const context = await loadAtlasContext(actor);
    const tasks = buildAtlasTasks(context);

    return res.status(200).json({
      ok: true,
      tasks,
      total: tasks.length,
      meta: {
        tenantId: actor.tenantId || null,
        source: 'derived_or_table_backed'
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load ATLAS tasks.'
    });
  }
});

module.exports = router;