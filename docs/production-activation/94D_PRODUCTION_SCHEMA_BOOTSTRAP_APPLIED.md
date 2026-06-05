# RAFTOP CPAP CARE Pro - Production Schema Bootstrap Applied

REQUIRED_MARKER: PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLIED
REQUIRED_MARKER: SCHEMA_APPLIED_TO_PRODUCTION
REQUIRED_MARKER: PRODUCTION_TABLES_VERIFIED
REQUIRED_MARKER: READY_FOR_PHASE95_TENANT_USERS
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_IMPORTED

## Meaning

The non-destructive schema bootstrap was applied to the production database.

## Expected production tables

- tenants
- users
- tenant_profiles
- tenant_subscriptions
- patients
- devices
- compliance_nights
- tasks
- atlas_tasks
- import_audit_logs
- patient_compliance_latest view

## Expected tenant

raftopoulos-production

## Important

This phase does not import real patient data.
This phase does not create production users.
This phase prepares the database schema for tenant/user activation.

## Next phase

Phase 95:
Tenant + Users + Credentials Activation Pack
