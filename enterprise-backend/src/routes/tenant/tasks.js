const express = require('express');
const controller = require('../../controllers/tenant/workspaceController');

const router = express.Router();

router.get('/', controller.getTasks);

module.exports = router;