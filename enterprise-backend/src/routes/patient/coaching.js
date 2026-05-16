const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const patientCoachingEngineService = require('../../services/patientCoachingEngineService');

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

router.use(requireAuth);
router.use(requirePatient);

router.get('/', async (req, res) => {
  try {
    const data = await patientCoachingEngineService.getPatientCoachingDashboard(req.user);

    return res.json({
      ok: true,
      data
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patient coaching dashboard'
    });
  }
});

router.get('/lessons', async (req, res) => {
  try {
    const data = await patientCoachingEngineService.getPatientCoachingDashboard(req.user);

    return res.json({
      ok: true,
      data: {
        lessons: data.lessons,
        summary: data.summary
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to load patient coaching lessons'
    });
  }
});

router.post('/lessons/:id/start', async (req, res) => {
  try {
    const lesson = await patientCoachingEngineService.markLessonState(
      req.user,
      req.params.id,
      'in_progress'
    );

    return res.json({
      ok: true,
      message: 'Lesson marked as in progress',
      data: lesson
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to start coaching lesson'
    });
  }
});

router.post('/lessons/:id/complete', async (req, res) => {
  try {
    const lesson = await patientCoachingEngineService.markLessonState(
      req.user,
      req.params.id,
      'completed'
    );

    return res.json({
      ok: true,
      message: 'Lesson marked as completed',
      data: lesson
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || 'Failed to complete coaching lesson'
    });
  }
});

module.exports = router;