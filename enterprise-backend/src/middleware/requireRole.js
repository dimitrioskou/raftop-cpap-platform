function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const roleCode = req.tenant?.membership?.role_code || null;

    if (req.auth?.isPlatformSuperAdmin) {
      return next();
    }

    if (!roleCode || !allowedRoles.includes(roleCode)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions'
      });
    }

    next();
  };
}

module.exports = { requireRole };