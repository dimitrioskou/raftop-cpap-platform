# RAFTOP CPAP CARE Pro - 7000 Patient Rollout Import Pack

REQUIRED_MARKER: PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK
REQUIRED_MARKER: ROLLOUT_CSV_TEMPLATE_READY
REQUIRED_MARKER: ROLLOUT_VALIDATION_ENDPOINT_READY
REQUIRED_MARKER: NO_BLIND_7000_IMPORT
REQUIRED_MARKER: READY_FOR_PHASE121_SUPER_USER_TENANT_CONTROL_LOCK

## Purpose

Full production rollout must not import 7,000 patients blindly.

This phase adds a validation pack:
- rollout CSV template
- rollout CSV sample
- backend validation endpoint
- frontend validation page
- duplicate checks
- missing required field checks
- forbidden direct identifier header checks

## Page

/pilot20/production-rollout-import

## API

GET /api/pilot20/production-rollout/template
POST /api/pilot20/production-rollout/validate

## Required columns

- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code

## Not allowed

- names
- phone numbers
- email
- AMKA
- address
- date of birth
- direct patient identifiers

## Production rule

Validate first. Apply import only after a clean validation report.
