const express = require('express');
const controller = require('../../controllers/tenant/notesController');

const router = express.Router();

router.get('/', controller.getTenantNotes);

module.exports = router;