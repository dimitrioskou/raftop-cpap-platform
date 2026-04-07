const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Please configure enterprise-backend/.env');
}

const isLocal =
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal
    ? false
    : {
        rejectUnauthorized: false
      }
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};