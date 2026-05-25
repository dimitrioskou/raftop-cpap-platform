// enterprise-backend/src/server.js
const helmet = require('helmet');
const express = require('express');
const cors = require('cors');

const { buildCorsOptions } = require('./middleware/corsOptions');
const { applySecurityHeaders } = require('./middleware/securityHeaders');
const { productionAuthEnforcement } = require('./productionAuthEnforcement');

const authRoutes = require('./routes/auth');

// Super Admin routes
const superAdminDashboardRoutes = require('./routes/superAdmin/dashboard');
const superAdminOrganizationsRoutes = require('./routes/superAdmin/organizations');
const superAdminLicensesRoutes = require('./routes/superAdmin/licenses');
const superAdminPlansRoutes = require('./routes/superAdmin/plans');
const superAdminModulesRoutes = require('./routes/superAdmin/modules');
const superAdminSubscriptionsRoutes = require('./routes/superAdmin/subscriptions');
const superAdminAuditLogsRoutes = require('./routes/superAdmin/auditLogs');
const superAdminTenantProfilesRoutes = require('./routes/superAdmin/tenantProfiles');
const superAdminTenantProvisioningRoutes = require('./routes/superAdmin/tenantProvisioning');

// System / audit routes
const routeStabilityAuditRoutes = require('./routes/system/routeStabilityAudit');
const saasStabilityAuditRoutes = require('./routes/system/saasStabilityAudit');
const productionReadinessAuditRoutes = require('./routes/system/productionReadinessAudit');
const backendProductionConfigAuditRoutes = require('./routes/system/backendProductionConfigAudit');
const databaseBackupSafetyAuditRoutes = require('./routes/system/databaseBackupSafetyAudit');
const securityExposureAuditRoutes = require('./routes/system/securityExposureAudit');
const tenantCleanupAuditRoutes = require('./routes/system/tenantCleanupAudit');
const releaseCandidateAuditRoutes = require('./routes/system/releaseCandidateAudit');
const releaseCandidateBlockerInspectorRoutes = require('./routes/system/releaseCandidateBlockerInspector');
const systemMonitoringRoutes = require('./routes/system/systemMonitoring');
const systemAlertsRoutes = require('./routes/system/systemAlerts');
const systemMaintenanceRoutes = require('./routes/system/systemMaintenance');

// Tenant routes
const tenantSubscriptionRoutes = require('./routes/tenant/subscription');
const tenantProfileRoutes = require('./routes/tenant/profile');
const tenantAclAuditRoutes = require('./routes/tenant/aclAudit');
const tenantSecurityOverviewRoutes = require('./routes/tenant/securityOverview');
const tenantUserActivityAuditRoutes = require('./routes/tenant/userActivityAudit');
const tenantDashboardRoutes = require('./routes/tenant/dashboard');
const tenantExecutiveMetricsRoutes = require('./routes/tenant/executiveMetrics');
const tenantPatientsRoutes = require('./routes/tenant/patients');
const tenantDevicesRoutes = require('./routes/tenant/devices');
const tenantPatientSignalsRoutes = require('./routes/tenant/patientSignals');
const patientAccessGuard = require('./middleware/patientAccessGuard');
const tenantFailedLoginAuditRoutes = require('./routes/tenant/failedLoginAudit');
const patientTherapyRoutes = require('./routes/patient/therapy');
const patientNightlyAnalysisRoutes = require('./routes/patient/nightlyAnalysis');
const patientNightCompareRoutes = require('./routes/patient/nightCompare');
const tenantUnifiedTasksRoutes = require('./routes/tenant/unifiedTasks');
const tenantTasksRoutes = require('./routes/tenant/tasks');

const tenantAtlasRoutes = require('./routes/tenant/atlas');
const atlasActionCenterForceRoute = require('./routes/tenant/atlasActionCenterForceRoute');

const tenantClosedLoopVerificationRoutes = require('./routes/tenant/closedLoopVerification');
const tenantClosedLoopRemediationRoutes = require('./routes/tenant/closedLoopRemediation');
const tenantClosedLoopResolutionRoutes = require('./routes/tenant/closedLoopResolution');
const tenantClosedLoopControlRoutes = require('./routes/tenant/closedLoopControl');
const closedLoopControlSummaryRoutes = require('./routes/tenant/closedLoopControlSummary');

const tenantNotesRoutes = require('./routes/tenant/notes');
const tenantReferralsRoutes = require('./routes/tenant/referrals');
const tenantFollowupRoutes = require('./routes/tenant/followup');
const tenantNotificationsRoutes = require('./routes/tenant/notifications');

const tenantPaymentsRoutes = require('./routes/tenant/payments');
const tenantUsersRoutes = require('./routes/tenant/users');
const tenantBillingRoutes = require('./routes/tenant/billing');
const tenantModulesRoutes = require('./routes/tenant/modules');
const tenantIntegrationsRoutes = require('./routes/tenant/integrations');
const tenantBrandingRoutes = require('./routes/tenant/branding');
const tenantContextRoutes = require('./routes/tenant/context');

// Middleware
const superAdminGuard = require('./middleware/superAdminGuard');
const tenantSubscriptionGuard = require('./middleware/tenantSubscriptionGuard');
const tenantPlanLimitGuard = require('./middleware/tenantPlanLimitGuard');
const requireTenantContext = require('./middleware/requireTenantContext');
const userActivityAuditMiddleware = require('./middleware/userActivityAuditMiddleware');
const tenantModuleEntitlementGuard = require('./middleware/tenantModuleEntitlementGuard');
const { runtimeAclMiddleware } = require('./middleware/runtimeAclMiddleware');
const { startSystemMonitoringLoop } = require('./services/systemMonitoringRunner');
const { startSystemMaintenanceLoop } = require('./services/systemMaintenanceRunner');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
          }
        : false
  })
);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(applySecurityHeaders);

app.use(cors(buildCorsOptions()));
app.options('*', cors(buildCorsOptions()));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    fallback: false,
    service: 'RAFTOP enterprise backend',
    time: new Date().toISOString(),
    requestId: req.requestId || null
  });
});

// Public auth.
// Login must remain public, otherwise production login will break.
app.use('/api/auth', authRoutes);

// Phase 41.11B production backend authorization enforcement.
// This must stay after /api/health and /api/auth,
// but before /api/system, /api/super-admin, /api/tenant and /api/patient routes.
app.use(productionAuthEnforcement);

// System routes.
// In strict production auth mode, protected /api/system routes are blocked
// by productionAuthEnforcement unless a valid JWT or super-admin key is present.
app.use('/api/system/route-stability-audit', routeStabilityAuditRoutes);
app.use('/api/system/saas-stability-audit', saasStabilityAuditRoutes);
app.use('/api/system/production-readiness-audit', productionReadinessAuditRoutes);
app.use('/api/system/backend-production-config-audit', backendProductionConfigAuditRoutes);
app.use('/api/system/database-backup-safety-audit', databaseBackupSafetyAuditRoutes);
app.use('/api/system/security-exposure-audit', securityExposureAuditRoutes);
app.use('/api/system/tenant-cleanup-audit', tenantCleanupAuditRoutes);
app.use('/api/system/release-candidate-audit', releaseCandidateAuditRoutes);
app.use('/api/system/release-candidate-blockers', releaseCandidateBlockerInspectorRoutes);
app.use('/api/system/monitoring', systemMonitoringRoutes);
app.use('/api/system/alerts', systemAlertsRoutes);
app.use('/api/system/maintenance', systemMaintenanceRoutes);

// Super Admin guard must be before every /api/super-admin business route.
app.use('/api/super-admin', superAdminGuard);

app.use('/api/super-admin/dashboard', superAdminDashboardRoutes);
app.use('/api/super-admin/organizations', superAdminOrganizationsRoutes);
app.use('/api/super-admin/licenses', superAdminLicensesRoutes);
app.use('/api/super-admin/plans', superAdminPlansRoutes);
app.use('/api/super-admin/modules', superAdminModulesRoutes);
app.use('/api/super-admin/subscriptions', superAdminSubscriptionsRoutes);
app.use('/api/super-admin/audit-logs', superAdminAuditLogsRoutes);
app.use('/api/super-admin/tenant-profiles', superAdminTenantProfilesRoutes);
app.use('/api/super-admin/tenant-provisioning', superAdminTenantProvisioningRoutes);

// Tenant subscription route.
// In strict production auth mode, this is no longer public through direct API access.
// Frontend must use authenticated access after login.
app.use('/api/tenant/subscription', tenantSubscriptionRoutes);

// Tenant hardening.
// Every sensitive /api/tenant route below this line requires explicit tenant context.
app.use('/api/tenant', requireTenantContext);
app.use('/api/tenant', userActivityAuditMiddleware);
app.use('/api/tenant', tenantSubscriptionGuard);
app.use('/api/tenant', tenantPlanLimitGuard);
app.use('/api/tenant', tenantModuleEntitlementGuard);

app.use('/api/tenant/profile', tenantProfileRoutes);

app.use('/api/tenant/dashboard', tenantDashboardRoutes);
app.use('/api/tenant/executive-metrics', tenantExecutiveMetricsRoutes);
app.use('/api/tenant/patients', tenantPatientsRoutes);
app.use('/api/tenant/devices', tenantDevicesRoutes);
app.use('/api/tenant/patient-signals', tenantPatientSignalsRoutes);

app.use('/api/patient', userActivityAuditMiddleware);
app.use('/api/patient', patientAccessGuard);

app.use('/api/tenant/security/failed-logins', tenantFailedLoginAuditRoutes);
app.use('/api/patient/therapy', patientTherapyRoutes);
app.use('/api/patient/nightly-analysis', patientNightlyAnalysisRoutes);
app.use('/api/patient/night-compare', patientNightCompareRoutes);

app.use('/api/tenant/tasks-unified', tenantUnifiedTasksRoutes);
app.use('/api/tenant/tasks', tenantTasksRoutes);

app.use('/api/tenant/security/acl-audit', tenantAclAuditRoutes);
app.use('/api/tenant/security/overview', tenantSecurityOverviewRoutes);
app.use('/api/tenant/security/user-activity', tenantUserActivityAuditRoutes);

app.use('/api/tenant/atlas', runtimeAclMiddleware);
app.use('/api/tenant/atlas/action-center', atlasActionCenterForceRoute);
app.use('/api/tenant/atlas', tenantAtlasRoutes);

app.use('/api/tenant/closed-loop', runtimeAclMiddleware);
app.use('/api/tenant/closed-loop', closedLoopControlSummaryRoutes);

app.use('/api/tenant/closed-loop-verification', runtimeAclMiddleware);
app.use('/api/tenant/closed-loop-verification', tenantClosedLoopVerificationRoutes);

app.use('/api/tenant/closed-loop-remediation', runtimeAclMiddleware);
app.use('/api/tenant/closed-loop-remediation', tenantClosedLoopRemediationRoutes);

app.use('/api/tenant/closed-loop-resolution', runtimeAclMiddleware);
app.use('/api/tenant/closed-loop-resolution', tenantClosedLoopResolutionRoutes);

app.use('/api/tenant/closed-loop-control', runtimeAclMiddleware);
app.use('/api/tenant/closed-loop-control', tenantClosedLoopControlRoutes);

app.use('/api/tenant/notes', tenantNotesRoutes);
app.use('/api/tenant/referrals', tenantReferralsRoutes);
app.use('/api/tenant/followup', tenantFollowupRoutes);
app.use('/api/tenant/notifications', tenantNotificationsRoutes);

app.use('/api/tenant/payments', tenantPaymentsRoutes);
app.use('/api/tenant/users', tenantUsersRoutes);
app.use('/api/tenant/billing', tenantBillingRoutes);
app.use('/api/tenant/modules', tenantModulesRoutes);
app.use('/api/tenant/integrations', tenantIntegrationsRoutes);
app.use('/api/tenant/branding', tenantBrandingRoutes);
app.use('/api/tenant/context', tenantContextRoutes);

// Final 404 handler
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    fallback: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId || null
  });
});

// Final error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`RAFTOP enterprise backend running on port ${PORT}`);

  if (typeof startSystemMonitoringLoop === 'function') {
    startSystemMonitoringLoop();
  }

  if (typeof startSystemMaintenanceLoop === 'function') {
    startSystemMaintenanceLoop();
  }
});