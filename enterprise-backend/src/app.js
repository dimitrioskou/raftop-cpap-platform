const express = require('express');
const cors = require('cors');

const db = require('./config/db');

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
const tenantAtlasRoutes = require('./routes/tenant/atlas');
const tenantNotificationQueueRoutes = require('./routes/tenant/notificationQueue');

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
    success: true,
    data: {
      status: 'OK',
      service: 'RAFTOP CPAP CARE Pro Enterprise API',
      time: new Date().toISOString()
    }
  });
});

app.get('/api/debug/db', async (req, res) => {
  try {
    const currentDb = await db.query('SELECT current_database() AS db');

    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'patients',
          'patient_metrics',
          'action_groups',
          'patient_action_status',
          'tasks',
          'atlas_auto_actions',
          'notification_queue'
        )
      ORDER BY table_name
    `);

    res.json({
      success: true,
      database: currentDb.rows[0]?.db,
      tables: tables.rows.map((r) => r.table_name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
app.use('/api/tenant/atlas', tenantAtlasRoutes);
app.use('/api/tenant/notification-queue', tenantNotificationQueueRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
});

app.use(errorHandler);

module.exports = app;