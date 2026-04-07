function checkTenantStatus(req, res, next) {
  if (req.auth?.isPlatformSuperAdmin) {
    return next();
  }

  const organizationStatus = req.tenant?.organization?.status;
  const licenseStatus = req.tenant?.license?.license_status;

  if (!req.tenant?.organization) {
    return res.status(403).json({
      success: false,
      error: 'No active organization context'
    });
  }

  if (organizationStatus === 'blocked') {
    return res.status(403).json({
      success: false,
      error: 'Organization is blocked'
    });
  }

  if (organizationStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'Organization is suspended'
    });
  }

  if (organizationStatus === 'maintenance') {
    return res.status(403).json({
      success: false,
      error: 'Organization is under maintenance'
    });
  }

  if (licenseStatus === 'blocked') {
    return res.status(403).json({
      success: false,
      error: 'License is blocked'
    });
  }

  if (licenseStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'License is suspended'
    });
  }

  if (licenseStatus === 'expired') {
    return res.status(403).json({
      success: false,
      error: 'License is expired'
    });
  }

  next();
}

module.exports = { checkTenantStatus };