const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === 'false'
        ? false
        : { rejectUnauthorized: false }
  });

  return pool;
}

async function query(text, params = []) {
  const db = getPool();
  return db.query(text, params);
}

module.exports = {
  query,
  getPool
};