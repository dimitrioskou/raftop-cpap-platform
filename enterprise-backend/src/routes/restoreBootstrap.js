const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false
});

router.post('/restore-bootstrap', async (req, res) => {
  try {
    const restoreKey = req.headers['x-restore-key'];

    if (!process.env.RESTORE_KEY) {
      return res.status(500).json({
        ok: false,
        message: 'RESTORE_KEY is not set on the server'
      });
    }

    if (restoreKey !== process.env.RESTORE_KEY) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    const sqlPath = path.join(__dirname, '../../bootstrap/raftop_remote_bootstrap.sql');

    if (!fs.existsSync(sqlPath)) {
      return res.status(404).json({
        ok: false,
        message: 'Bootstrap SQL file not found',
        path: sqlPath
      });
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (!sql || !sql.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Bootstrap SQL file is empty'
      });
    }

    const client = await pool.connect();

    try {
      await client.query(sql);

      return res.json({
        ok: true,
        message: 'Bootstrap restore completed successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;