const express = require('express');
const controller = require('../../controllers/tenant/workspaceController');

const router = express.Router();

router.get('/', controller.getCompliance);

module.exports = router;