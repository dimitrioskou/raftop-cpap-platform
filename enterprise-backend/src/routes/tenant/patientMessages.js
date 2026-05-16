const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  q,
  querySafe,
  tableExists,
  getColumns,
  firstExisting
} = require('../../utils/routeDbHelpers');

function resolveDb() {
  const candidates = [
    '../../db',
    '../../config/db',
    '../../config/database',
    '../../database',
    '../../lib/db',
    '../db',
    '../config/db'
  ];

  for (const candidate of candidates) {
    try {
      const mod = require(candidate);

      if (mod && typeof mod.query === 'function') {
        return mod;
      }

      if (mod && mod.pool && typeof mod.pool.query === 'function') {
        return mod.pool;
      }

      if (typeof mod === 'function') {
        const maybeDb = mod();
        if (maybeDb && typeof maybeDb.query === 'function') {
          return maybeDb;
        }
      }
    } catch (_error) {
      // keep scanning
    }
  }

  throw new Error('Could not resolve database client in tenant patient messages route.');
}

const db = resolveDb();
const router = express.Router();

function normalizeText(value) {
  if (value === null || typeof value === 'undefined') return null;
  const text = String(value).trim();
  return text || null;
}

async function findMessageTable() {
  const candidates = ['patient_messages', 'messages'];

  for (const tableName of candidates) {
    if (await tableExists(db, tableName)) {
      return tableName;
    }
  }

  return null;
}

function mapMessageRow(row, columns, index = 0) {
  const idCol = firstExisting(columns, ['id', 'message_id']);
  const subjectCol = firstExisting(columns, ['subject', 'title']);
  const bodyCol = firstExisting(columns, ['body', 'message', 'content']);
  const statusCol = firstExisting(columns, ['status']);
  const readAtCol = firstExisting(columns, ['read_at']);
  const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
  const senderNameCol = firstExisting(columns, ['sender_name', 'from_name']);
  const senderEmailCol = firstExisting(columns, ['sender_email', 'from_email']);
  const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
  const replyToCol = firstExisting(columns, ['reply_to_id', 'parent_message_id']);

  return {
    id: row?.[idCol] || `msg-${index + 1}`,
    subject: row?.[subjectCol] || 'Message',
    body: row?.[bodyCol] || '',
    status: row?.[statusCol] || 'sent',
    read: Boolean(row?.[readAtCol]),
    createdAt: row?.[createdAtCol] || null,
    senderName: row?.[senderNameCol] || 'Provider',
    senderEmail: row?.[senderEmailCol] || null,
    recipientEmail: row?.[recipientEmailCol] || null,
    replyToId: row?.[replyToCol] || null
  };
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const patientEmail = normalizeText(req.query?.patientEmail);
    const tableName = await findMessageTable();

    if (!tableName) {
      return res.json({
        ok: true,
        data: {
          summary: {
            total: 0,
            unreadCount: 0
          },
          items: []
        }
      });
    }

    const columns = await getColumns(db, tableName);
    const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
    const patientEmailCol = firstExisting(columns, ['patient_email', 'email', 'user_email']);
    const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);

    let sql = `SELECT * FROM ${tableName}`;
    const params = [];

    if (patientEmail && (recipientEmailCol || patientEmailCol)) {
      const conditions = [];

      if (recipientEmailCol) {
        params.push(patientEmail);
        conditions.push(`LOWER(${q(recipientEmailCol)}) = LOWER($${params.length})`);
      }

      if (patientEmailCol) {
        params.push(patientEmail);
        conditions.push(`LOWER(${q(patientEmailCol)}) = LOWER($${params.length})`);
      }

      sql += ` WHERE ${conditions.join(' OR ')}`;
    }

    sql += ` ORDER BY ${createdAtCol ? `${q(createdAtCol)} DESC` : '1 DESC'} LIMIT 100`;

    const result = await querySafe(db, sql, params);
    const rows = (result.rows || []).map((row, index) => mapMessageRow(row, columns, index));

    return res.json({
      ok: true,
      data: {
        summary: {
          total: rows.length,
          unreadCount: rows.filter((item) => !item.read).length
        },
        items: rows
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load tenant patient messages'
    });
  }
});

router.post('/send', async (req, res) => {
  try {
    const tableName = await findMessageTable();

    if (!tableName) {
      return res.status(500).json({
        ok: false,
        message: 'No message table exists'
      });
    }

    const patientEmail = normalizeText(req.body?.patientEmail);
    const subject = normalizeText(req.body?.subject) || 'Provider message';
    const body = normalizeText(req.body?.body);
    const replyToId = normalizeText(req.body?.replyToId);

    if (!patientEmail) {
      return res.status(400).json({
        ok: false,
        message: 'patientEmail is required'
      });
    }

    if (!body) {
      return res.status(400).json({
        ok: false,
        message: 'body is required'
      });
    }

    const columns = await getColumns(db, tableName);

    const subjectCol = firstExisting(columns, ['subject', 'title']);
    const bodyCol = firstExisting(columns, ['body', 'message', 'content']);
    const statusCol = firstExisting(columns, ['status']);
    const createdAtCol = firstExisting(columns, ['created_at', 'sent_at', 'date']);
    const senderNameCol = firstExisting(columns, ['sender_name', 'from_name']);
    const senderEmailCol = firstExisting(columns, ['sender_email', 'from_email']);
    const recipientEmailCol = firstExisting(columns, ['recipient_email', 'to_email']);
    const readAtCol = firstExisting(columns, ['read_at']);
    const replyToCol = firstExisting(columns, ['reply_to_id', 'parent_message_id']);

    const senderName =
      normalizeText(req.user?.name) ||
      normalizeText(req.user?.email) ||
      'RAFTOP Provider';

    const senderEmail =
      normalizeText(req.user?.email) ||
      'provider@raftop.local';

    const insertPairs = [];

    if (subjectCol) insertPairs.push([subjectCol, subject]);
    if (bodyCol) insertPairs.push([bodyCol, body]);
    if (statusCol) insertPairs.push([statusCol, 'sent']);
    if (createdAtCol) insertPairs.push([createdAtCol, new Date().toISOString()]);
    if (senderNameCol) insertPairs.push([senderNameCol, senderName]);
    if (senderEmailCol) insertPairs.push([senderEmailCol, senderEmail]);
    if (recipientEmailCol) insertPairs.push([recipientEmailCol, patientEmail]);
    if (readAtCol) insertPairs.push([readAtCol, null]);
    if (replyToCol && replyToId) insertPairs.push([replyToCol, replyToId]);

    if (!insertPairs.length) {
      return res.status(500).json({
        ok: false,
        message: 'No compatible message columns found'
      });
    }

    const insertColumns = insertPairs.map(([column]) => q(column)).join(', ');
    const placeholders = insertPairs.map((_, index) => `$${index + 1}`).join(', ');
    const values = insertPairs.map(([, value]) => value);

    const result = await querySafe(
      db,
      `
        INSERT INTO ${tableName} (${insertColumns})
        VALUES (${placeholders})
        RETURNING *
      `,
      values
    );

    return res.status(201).json({
      ok: true,
      message: 'Provider message sent',
      data: mapMessageRow(result.rows?.[0] || {}, columns, 0)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to send provider message'
    });
  }
});

module.exports = router;