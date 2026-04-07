const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboard');
const patientsRoutes = require('./patients');
const devicesRoutes = require('./devices');
const complianceRoutes = require('./compliance');
const followupRoutes = require('./followup');
const tasksRoutes = require('./tasks');
const notesRoutes = require('./notes');
const referralsRoutes = require('./referrals');
const notificationsRoutes = require('./notifications');

const atlasSummaryRoutes = require('./atlasSummary');
const atlasQueueRoutes = require('./atlasQueue');
const atlasDailyRoutes = require('./atlasDaily');
const atlasTasksRoutes = require('./atlasTasks');
const atlasAlertsRoutes = require('./atlasAlerts');
const atlasAutoActionsRoutes = require('./atlasAutoActions');

const billingRoutes = require('./billing');
const paymentsRoutes = require('./payments');

const usersRoutes = require('./users');
const modulesRoutes = require('./modules');
const integrationsRoutes = require('./integrations');
const brandingRoutes = require('./branding');
const settingsRoutes = require('./settings');

router.use('/dashboard', dashboardRoutes);
router.use('/patients', patientsRoutes);
router.use('/devices', devicesRoutes);
router.use('/compliance', complianceRoutes);
router.use('/followup', followupRoutes);
router.use('/tasks', tasksRoutes);
router.use('/notes', notesRoutes);
router.use('/referrals', referralsRoutes);
router.use('/notifications', notificationsRoutes);

router.use('/atlas/summary', atlasSummaryRoutes);
router.use('/atlas/queue', atlasQueueRoutes);
router.use('/atlas/daily', atlasDailyRoutes);
router.use('/atlas/tasks', atlasTasksRoutes);
router.use('/atlas/alerts', atlasAlertsRoutes);
router.use('/atlas/auto-actions', atlasAutoActionsRoutes);
router.use('/atlas/autoactions', atlasAutoActionsRoutes);

router.use('/billing', billingRoutes);
router.use('/payments', paymentsRoutes);

router.use('/users', usersRoutes);
router.use('/modules', modulesRoutes);
router.use('/integrations', integrationsRoutes);
router.use('/branding', brandingRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;