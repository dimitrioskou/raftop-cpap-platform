function requireModule(moduleCode) {
  return (req, res, next) => {
    if (req.auth?.isPlatformSuperAdmin) {
      return next();
    }

    const modules = req.tenant?.modules || [];
    const enabled = modules.some(
      (item) =>
        String(item.module_code) === String(moduleCode) &&
        !!item.is_enabled
    );

    if (!enabled) {
      return res.status(403).json({
        success: false,
        error: `Module not enabled: ${moduleCode}`
      });
    }

    next();
  };
}

module.exports = { requireModule };