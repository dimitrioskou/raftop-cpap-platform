function requireSuperAdmin(req, res, next) {
  if (!req.auth?.isPlatformSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }

  next();
}

module.exports = { requireSuperAdmin };