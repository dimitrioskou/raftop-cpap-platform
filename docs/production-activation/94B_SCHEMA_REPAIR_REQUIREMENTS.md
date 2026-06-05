# RAFTOP CPAP CARE Pro - Schema Repair Requirements

REQUIRED_MARKER: PHASE94B_SCHEMA_REPAIR_REQUIREMENTS
REQUIRED_MARKER: CREATE_OR_MAP_PATIENTS_DEVICES
REQUIRED_MARKER: TENANT_COMPATIBILITY_REQUIRED
REQUIRED_MARKER: BEFORE_PHASE95_TENANT_USERS

## Required before Phase 95

Before creating production tenant users, the following must be resolved:

1. Tenant model
   - use tenant_profiles as canonical tenant table
   - or create tenants compatibility view/table

2. Users model
   - confirm users table has email, password/hash, role, tenant reference

3. Patients model
   - create production patients table
   - or confirm existing equivalent table

4. Devices model
   - create production devices table
   - or confirm existing equivalent table

5. Compliance model
   - create compliance_nights / compliance_records table
   - or confirm existing equivalent table

6. Tasks model
   - confirm atlas_tasks covers operational tasks
   - or create tasks compatibility view/table

7. Demo data separation
   - production data must not depend on pilot_demo_* tables

## Next phase

Phase 94C:
Production Schema Bootstrap / Compatibility Plan

Phase 95 can only run after Phase 94C is ready.
