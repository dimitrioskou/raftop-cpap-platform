const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const {
  attachSubscriptionSnapshot,
  requireTenantActive,
  requireDoctorSubscription
} = require('./middleware/tenantSubscriptionGuard');

function safeLoadRouter(pathLabel, requirePath) {
  try {
    const mod = require(requirePath);

    if (mod && typeof mod.use === 'function') {
      return mod;
    }

    if (mod && mod.router && typeof mod.router.use === 'function') {
      return mod.router;
    }

    if (mod && mod.default && typeof mod.default.use === 'function') {
      return mod.default;
    }

    console.warn(`[SAFE ROUTER] Invalid router export for ${pathLabel}. Using fallback empty router.`);
    return express.Router();
  } catch (error) {
    console.warn(`[SAFE ROUTER] Failed loading ${pathLabel}: ${error.message}`);
    return express.Router();
  }
}

function resolveAuth() {
  const noop = (_req, _res, next) => next();

  try {
    const mod = require('./middleware/auth');

    return {
      requireAuth:
        mod.requireAuth ||
        mod.authenticate ||
        mod.authRequired ||
        mod.protect ||
        noop
    };
  } catch (error) {
    console.warn(`[AUTH] Could not load auth middleware: ${error.message}`);
    return { requireAuth: noop };
  }
}

function buildAllowedOrigins() {
  const raw = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.CORS_ORIGIN
  ]
    .filter(Boolean)
    .join(',');

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const { requireAuth } = resolveAuth();

const authRoutes = safeLoadRouter('authRoutes', './routes/auth');

const dashboardRoutes = safeLoadRouter('dashboardRoutes', './routes/tenant/dashboard');
const patientsRoutes = safeLoadRouter('patientsRoutes', './routes/tenant/patients');
const devicesRoutes = safeLoadRouter('devicesRoutes', './routes/tenant/devices');
const tasksRoutes = safeLoadRouter('tasksRoutes', './routes/tenant/tasks');
const notesRoutes = safeLoadRouter('notesRoutes', './routes/tenant/notes');
const referralsRoutes = safeLoadRouter('referralsRoutes', './routes/tenant/referrals');
const followupRoutes = safeLoadRouter('followupRoutes', './routes/tenant/followup');
const complianceRoutes = safeLoadRouter('complianceRoutes', './routes/tenant/compliance');
const notificationsRoutes = safeLoadRouter('notificationsRoutes', './routes/tenant/notifications');
const notificationQueueRoutes = safeLoadRouter('notificationQueueRoutes', './routes/tenant/notificationQueue');
const billingRoutes = safeLoadRouter('billingRoutes', './routes/tenant/billing');
const paymentsRoutes = safeLoadRouter('paymentsRoutes', './routes/tenant/payments');
const usersRoutes = safeLoadRouter('usersRoutes', './routes/tenant/users');
const modulesRoutes = safeLoadRouter('modulesRoutes', './routes/tenant/modules');
const integrationsRoutes = safeLoadRouter('integrationsRoutes', './routes/tenant/integrations');
const brandingRoutes = safeLoadRouter('brandingRoutes', './routes/tenant/branding');
const settingsRoutes = safeLoadRouter('settingsRoutes', './routes/tenant/settings');
const subscriptionRoutes = safeLoadRouter('subscriptionRoutes', './routes/tenant/subscription');
const doctorsRoutes = safeLoadRouter('doctorsRoutes', './routes/tenant/doctors');

const atlasSummaryRoutes = safeLoadRouter('atlasSummaryRoutes', './routes/tenant/atlasSummary');
const atlasQueueRoutes = safeLoadRouter('atlasQueueRoutes', './routes/tenant/atlasQueue');
const atlasDailyRoutes = safeLoadRouter('atlasDailyRoutes', './routes/tenant/atlasDaily');
const atlasTasksRoutes = safeLoadRouter('atlasTasksRoutes', './routes/tenant/atlasTasks');
const atlasAlertsRoutes = safeLoadRouter('atlasAlertsRoutes', './routes/tenant/atlasAlerts');
const atlasAutoActionsRoutes = safeLoadRouter('atlasAutoActionsRoutes', './routes/tenant/atlasAutoActions');
const atlasRulesRoutes = safeLoadRouter('atlasRulesRoutes', './routes/tenant/atlasRules');
const doctorAtlasRoutes = safeLoadRouter('doctorAtlasRoutes', './routes/tenant/doctorAtlas');

const systemLiveVerificationRoutes = safeLoadRouter(
  'systemLiveVerificationRoutes',
  './routes/system/liveVerification'
);

const app = express();
const allowedOrigins = buildAllowedOrigins();

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (!allowedOrigins.length) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  return res.status(200).json({
    status: 'OK',
    service: 'RAFTOP Enterprise Backend',
    time: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/system', systemLiveVerificationRoutes);
app.use('/api/tenant/subscription', subscriptionRoutes);
app.use('/api/tenant/payments', requireAuth, paymentsRoutes);

app.use('/api/tenant/dashboard', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), dashboardRoutes);

app.use('/api/tenant/patients', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), patientsRoutes);
app.use('/api/tenant/workspace/patients', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), patientsRoutes);
app.use('/api/patients', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), patientsRoutes);

app.use('/api/tenant/devices', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), devicesRoutes);
app.use('/api/tenant/workspace/devices', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), devicesRoutes);
app.use('/api/devices', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), devicesRoutes);

app.use('/api/tenant/tasks', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), tasksRoutes);
app.use('/api/tenant/notes', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), notesRoutes);
app.use('/api/tenant/referrals', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), referralsRoutes);
app.use('/api/tenant/notifications', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), notificationsRoutes);
app.use('/api/tenant/notification-queue', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), notificationQueueRoutes);
app.use('/api/tenant/users', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), usersRoutes);
app.use('/api/tenant/modules', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), modulesRoutes);
app.use('/api/tenant/integrations', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), integrationsRoutes);
app.use('/api/tenant/branding', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), brandingRoutes);
app.use('/api/tenant/settings', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), settingsRoutes);
app.use('/api/tenant/system-status', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), settingsRoutes);
app.use('/api/tenant/billing', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), billingRoutes);
app.use('/api/tenant/doctor-billing', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), billingRoutes);
app.use('/api/tenant/doctors', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), doctorsRoutes);

app.use('/api/tenant/compliance', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), complianceRoutes);
app.use('/api/tenant/followup', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), followupRoutes);

app.use('/api/tenant/atlas/summary', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasSummaryRoutes);
app.use('/api/tenant/atlas/queue', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasQueueRoutes);
app.use('/api/tenant/atlas/daily', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasDailyRoutes);
app.use('/api/tenant/atlas/tasks', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasTasksRoutes);
app.use('/api/tenant/atlas/alerts', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasAlertsRoutes);
app.use('/api/tenant/atlas/auto-actions', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasAutoActionsRoutes);
app.use('/api/tenant/atlas/rules', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), atlasRulesRoutes);
app.use('/api/tenant/doctor-atlas', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), requireDoctorSubscription(), doctorAtlasRoutes);

app.use('/api/tenant/payments-admin', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), billingRoutes);
app.use('/api/tenant/revenue', requireAuth, attachSubscriptionSnapshot, requireTenantActive(), billingRoutes);

app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled backend error:', err);

  return res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`RAFTOP enterprise backend running on port ${PORT}`);
});

module.exports = app;