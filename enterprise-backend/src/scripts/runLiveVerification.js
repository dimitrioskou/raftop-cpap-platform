const { buildLiveVerificationReport } = require('../services/liveVerificationService');

(async () => {
  try {
    const report = await buildLiveVerificationReport();
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: 'Live verification script failed.',
          error: error.message
        },
        null,
        2
      )
    );
    process.exit(1);
  }
})();