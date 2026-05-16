const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientNightAnalysisService = require('../../services/patientNightAnalysisService');

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

    const data = await patientNightAnalysisService.getNightAnalysis(
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
      message: error.message || 'Failed to load nightly analysis'
    });
  }
});

router.get('/:date/compare/:otherDate', async (req, res) => {
  try {
    const { date, otherDate } = req.params;

    if (!isIsoDate(date) || !isIsoDate(otherDate)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid compare date format. Expected YYYY-MM-DD.'
      });
    }

    const data = await patientNightAnalysisService.compareNights(
      req.user,
      date,
      otherDate
    );

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to compare nights'
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

    const data = await patientNightAnalysisService.getNightAnalysis(
      req.user,
      date
    );

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load nightly analysis detail'
    });
  }
});

module.exports = router;