const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientOverlayService = require('../../services/patientOverlayService');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase();
}

function requirePatient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized'
    });
  }

  if (normalizeRole(req.user.role) !== 'patient') {
    return res.status(403).json({
      ok: false,
      message: 'Patient access only'
    });
  }

  return next();
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

router.use(requireAuth);
router.use(requirePatient);

router.get('/', async (req, res) => {
  try {
    const requestedDate = req.query?.date;

    if (requestedDate && !isIsoDate(requestedDate)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    const data = await patientOverlayService.getOverlayData(
      req.user,
      requestedDate || null
    );

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load overlay data'
    });
  }
});

router.get('/journal', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 20;
    const items = await patientOverlayService.listJournalEntriesForPatient(req.user, limit);

    return res.json({
      ok: true,
      data: {
        items
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load journal entries'
    });
  }
});

router.post('/journal', async (req, res) => {
  try {
    const item = await patientOverlayService.createJournalEntry(req.user, req.body || {});

    return res.status(201).json({
      ok: true,
      message: 'Journal entry saved successfully',
      data: item
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to save journal entry'
    });
  }
});

router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    if (!isIsoDate(date)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.'
      });
    }

    const data = await patientOverlayService.getOverlayData(req.user, date);

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load overlay detail'
    });
  }
});

module.exports = router;