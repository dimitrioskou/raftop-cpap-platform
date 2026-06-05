# RAFTOP CPAP CARE Pro - Production Schema Mapping Discovery

REQUIRED_MARKER: PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY
REQUIRED_MARKER: CURRENT_SCHEMA_PARTIAL
REQUIRED_MARKER: TENANT_PROFILES_PRESENT
REQUIRED_MARKER: PATIENTS_DEVICES_SCHEMA_REQUIRED
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT

## Discovery conclusion

The current production database appears to contain a partial schema.

Observed production-style tables may include:
- users
- tenant_profiles
- tenant_subscriptions
- atlas_tasks
- system_monitoring_snapshots

Observed demo-style tables may include:
- pilot_demo_devices
- pilot_demo_compliance_nights
- pilot_demo_atlas_tasks

Missing or not yet confirmed as production tables:
- patients
- devices
- compliance_nights
- generic tasks table if required by backend

## Meaning

The application can have working backend health and partial DB schema, but it is not safe to activate 7000-patient production usage until schema repair or schema mapping is completed.

## Required next step

Phase 94C must create a production schema bootstrap / repair plan.

It must decide:
1. Whether tenant_profiles is the canonical tenants table.
2. Whether atlas_tasks is the canonical tasks table.
3. Whether production patients/devices/compliance tables must be created.
4. Whether compatibility views are required for legacy endpoints.
5. Whether demo tables should remain isolated from production tenant data.

## Hard stop

Do not import real patient data until schema is confirmed and tenant activation is verified.
