function isPatientAccessGuardEnabled() {
  return String(process.env.PATIENT_ACCESS_GUARD_ENABLED || 'true').toLowerCase() === 'true';
}

function isBypassEnabled(req) {
  const bypassKey = process.env.PATIENT_ACCESS_GUARD_BYPASS_KEY;

  if (bypassKey && req.headers['x-patient-access-bypass-key'] === bypassKey) {
    return true;
  }

  if (String(req.headers['x-patient-access-bypass'] || '').toLowerCase() === 'true') {
    return true;
  }

  return false;
}

function readTenantId(req) {
  return (
    req.headers['x-tenant-id'] ||
    req.headers['tenant-id'] ||
    req.query.tenantId ||
    req.query.tenant_id ||
    null
  );
}

function readPatientId(req) {
  return (
    req.headers['x-patient-id'] ||
    req.query.patientId ||
    req.query.patient_id ||
    null
  );
}

function readRuntimeRole(req) {
  return String(
    req.headers['x-runtime-role'] ||
      req.headers['x-user-role'] ||
      req.headers.role ||
      req.query.runtimeRole ||
      req.query.role ||
      'patient'
  )
    .trim()
    .toLowerCase();
}

function isProviderRole(role) {
  return [
    'super_admin',
    'tenant_admin',
    'doctor',
    'operator'
  ].includes(role);
}

function patientAccessGuard(req, res, next) {
  try {
    if (!isPatientAccessGuardEnabled()) {
      return next();
    }

    if (isBypassEnabled(req)) {
      return next();
    }

    const tenantId = readTenantId(req);
    const patientId = readPatientId(req);
    const role = readRuntimeRole(req);

    if (!tenantId) {
      return res.status(401).json({
        ok: false,
        fallback: false,
        error: 'PATIENT_TENANT_REQUIRED',
        message: 'Patient API requires x-tenant-id or tenantId.',
        phase: '35C.19-patient-access-guard'
      });
    }

    if (!patientId) {
      return res.status(401).json({
        ok: false,
        fallback: false,
        error: 'PATIENT_ID_REQUIRED',
        message: 'Patient API requires x-patient-id or patientId.',
        phase: '35C.19-patient-access-guard',
        tenantId,
        tenant_id: tenantId
      });
    }

    req.patientAccess = {
      allowed: true,
      tenantId,
      tenant_id: tenantId,
      patientId,
      patient_id: patientId,
      role,
      providerRole: isProviderRole(role),
      source: 'patient-access-guard'
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      fallback: false,
      error: 'PATIENT_ACCESS_GUARD_FAILED',
      message: error.message,
      phase: '35C.19-patient-access-guard'
    });
  }
}

module.exports = patientAccessGuard;