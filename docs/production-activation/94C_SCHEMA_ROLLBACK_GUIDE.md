# RAFTOP CPAP CARE Pro - Phase 94C Schema Rollback Guide

REQUIRED_MARKER: PHASE94C_SCHEMA_ROLLBACK_GUIDE
REQUIRED_MARKER: NO_AUTOMATIC_ROLLBACK
REQUIRED_MARKER: MANUAL_REVIEW_REQUIRED

## Rollback principle

Because this SQL is non-destructive and uses CREATE TABLE IF NOT EXISTS, rollback is usually not required.

## If rollback is requested

Do not drop production data blindly.

Manual review is required before removing:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs
- patient_compliance_latest view

## Production safety

No patient data should be imported before schema is verified and buyer/GDPR approval exists.
