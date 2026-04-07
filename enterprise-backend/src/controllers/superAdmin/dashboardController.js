async function getDashboard(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        organizations: 12,
        activeLicenses: 10,
        suspendedOrganizations: 2,
        totalPlatformUsers: 48,
        totalPatients: 7000,
        totalDevices: 6820,
        totalTasks: 1240,
        totalReferrals: 530
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard
};