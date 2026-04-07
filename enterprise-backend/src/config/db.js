const { Pool } = require('pg');
const { env } = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl:
    env.nodeEnv === 'production'
      ? { rejectUnauthorized: false }
      : false
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function testConnection() {
  try {
    const result = await query('SELECT NOW() AS now');
    return result.rows[0];
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};