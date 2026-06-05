# RAFTOP CPAP CARE Pro - Production DB / Tenant Activation Discovery

REQUIRED_MARKER: PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY
REQUIRED_MARKER: DB_DISCOVERY_BEFORE_TENANT_CREATION
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION_NEXT
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT

## Purpose

This document marks the production activation discovery step.

## Required before production user delivery

1. Backend health URL confirmed.
2. Production DATABASE_URL confirmed.
3. DB schema discovered.
4. Required tables confirmed or bootstrapped.
5. Raftopoulos production tenant created.
6. Tenant admin user created.
7. Operations users created.
8. Viewer user created.
9. Credentials delivered separately.
10. CSV validation completed before any real import.

## Hard stop

No real patient data import before agreement, GDPR/DPA, CSV validation, and staged signoff.
