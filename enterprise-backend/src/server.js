// enterprise-backend/src/server.js

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const superAdminDashboardRoutes = require('./routes/superAdmin/dashboard');
const superAdminOrganizationsRoutes = require('./routes/superAdmin/organizations');
const superAdminLicensesRoutes = require('./routes/superAdmin/licenses');
const superAdminPlansRoutes = require('./routes/superAdmin/plans');
const superAdminModulesRoutes = require('./routes/superAdmin/modules');

const tenantDashboardRoutes = require('./routes/tenant/dashboard');
const tenantPatientsRoutes = require('./routes/tenant/patients');
const tenantDevicesRoutes = require('./routes/tenant/devices');
const tenantTasksRoutes = require('./routes/tenant/tasks');
const tenantNotesRoutes = require('./routes/tenant/notes');
const tenantReferralsRoutes = require('./routes/tenant/referrals');
const tenantFollowupRoutes = require('./routes/tenant/followup');

const restoreBootstrapRoutes = require('./routes/restoreBootstrap');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'RAFTOP enterprise backend',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

app.use('/api/super-admin/dashboard', superAdminDashboardRoutes);
app.use('/api/super-admin/organizations', superAdminOrganizationsRoutes);
app.use('/api/super-admin/licenses', superAdminLicensesRoutes);
app.use('/api/super-admin/plans', superAdminPlansRoutes);
app.use('/api/super-admin/modules', superAdminModulesRoutes);

app.use('/api/tenant/dashboard', tenantDashboardRoutes);
app.use('/api/tenant/patients', tenantPatientsRoutes);
app.use('/api/tenant/devices', tenantDevicesRoutes);
app.use('/api/tenant/tasks', tenantTasksRoutes);
app.use('/api/tenant/notes', tenantNotesRoutes);
app.use('/api/tenant/referrals', tenantReferralsRoutes);
app.use('/api/tenant/followup', tenantFollowupRoutes);

app.use('/api/admin', restoreBootstrapRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`RAFTOP enterprise backend running on port ${PORT}`);
});