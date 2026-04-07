const express = require('express');
const router = express.Router();

const controller = require('../../controllers/tenant/notificationQueueController');
const { requireAuth } = require('../../middleware/auth');

router.get('/', requireAuth, controller.getQueue);
router.post('/:notificationId/sent', requireAuth, controller.markSent);
router.post('/:notificationId/failed', requireAuth, controller.markFailed);

module.exports = router;