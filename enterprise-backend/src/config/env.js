require('dotenv').config();

const env = {
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || ''
};

module.exports = { env };