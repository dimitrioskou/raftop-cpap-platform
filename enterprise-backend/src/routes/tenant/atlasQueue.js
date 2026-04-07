const express = require('express');
const {
  extractActor,
  loadAtlasContext,
  buildAtlasQueue
} = require('../../services/atlasDerivedService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const actor = extractActor(req);
    const context = await loadAtlasContext(actor);
    const queue = buildAtlasQueue(context);

    return res.status(200).json({
      ok: true,
      queue,
      total: queue.length,
      meta: {
        tenantId: actor.tenantId || null,
        source: 'derived_or_table_backed'
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load ATLAS queue.'
    });
  }
});

module.exports = router;