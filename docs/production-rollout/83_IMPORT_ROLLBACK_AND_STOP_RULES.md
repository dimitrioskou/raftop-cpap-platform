# RAFTOP CPAP CARE Pro - Import Rollback and Stop Rules

REQUIRED_MARKER: PHASE83_IMPORT_ROLLBACK_STOP_RULES
REQUIRED_MARKER: HARD_STOP_ON_VALIDATION_FAIL
REQUIRED_MARKER: NO_NEXT_STAGE_WITHOUT_SIGNOFF
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_WITHOUT_DPA

## Hard stop rules

Stop the import if:
- CSV validation fails
- tenant_id is wrong
- direct identifiers are present
- duplicate patient_external_id exists
- device_serial is missing
- consent_basis is missing
- ATLAS calculation fails
- 80 Hours Compliance calculation fails
- reports do not load
- user access is incorrect
- data appears outside the Raftopoulos tenant

## Rollback principle

Each stage must be reversible or isolated before proceeding.

## No next stage

No next stage is allowed without written signoff.

## Real patient data

Real patient data requires:
- commercial agreement
- GDPR / DPA agreement
- named access approval
- production tenant confirmation
- data processing responsibility confirmation
