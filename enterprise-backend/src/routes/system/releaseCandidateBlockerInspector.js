const express = require('express');

const {
  runReleaseCandidateBlockerInspector
} = require('../../services/releaseCandidateBlockerInspectorService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const payload = await runReleaseCandidateBlockerInspector(req);

    return res.status(200).json(payload);
  } catch (error) {
    console.error('[release candidate blocker inspector] failed:', error);

    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'RELEASE_CANDIDATE_BLOCKER_INSPECTOR_FAILED',
      message: error.message,
      phase: '23.7B-release-candidate-blocker-inspector'
    });
  }
});

module.exports = router;