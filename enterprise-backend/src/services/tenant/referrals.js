const express = require('express');
const controller = require('../../controllers/tenant/referralsController');

const router = express.Router();

router.get('/', controller.getTenantReferrals);

module.exports = router;