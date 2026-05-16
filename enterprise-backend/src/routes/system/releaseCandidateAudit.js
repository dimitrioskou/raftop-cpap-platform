const express = require('express');

const {
  runReleaseCandidateAudit
} = require('../../services/releaseCandidateAuditService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runReleaseCandidateAudit(req);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[release candidate audit] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'RELEASE_CANDIDATE_AUDIT_FAILED',
      message: error.message,
      phase: '23.7-final-release-candidate-checklist'
    });
  }
});

module.exports = router;