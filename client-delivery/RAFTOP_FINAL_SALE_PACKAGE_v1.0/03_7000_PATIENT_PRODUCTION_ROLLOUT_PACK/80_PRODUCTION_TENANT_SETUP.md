# RAFTOP CPAP CARE Pro - Production Tenant Setup

REQUIRED_MARKER: PHASE80_PRODUCTION_TENANT_SETUP
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_BEFORE_DPA
REQUIRED_MARKER: 7000_PATIENT_ROLLOUT_CONTROLLED

## Production tenant

Tenant name:
Raftopoulos Production

Tenant slug:
raftopoulos-production

Tenant purpose:
Production environment for controlled 7000-patient CPAP monitoring rollout.

## Scope

This tenant is intended for:
- CPAP patient portfolio monitoring
- ATLAS priority queue
- 80 Hours Compliance tracking
- Follow-up tasks
- Management reports
- Future doctor / clinic resale model

## Hard rule

No real patient data is imported before:
- commercial agreement
- GDPR / DPA agreement
- access role approval
- data intake rules
- acceptance signoff

## Rollout principle

The 7000-patient rollout must be controlled:

Stage 1: 100 records validation
Stage 2: 500 records validation
Stage 3: 2000 records validation
Stage 4: 7000 records controlled production import

Direct 7000-patient import without validation is not allowed.
