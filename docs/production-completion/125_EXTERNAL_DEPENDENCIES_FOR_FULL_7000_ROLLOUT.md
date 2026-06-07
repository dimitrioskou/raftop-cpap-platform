# RAFTOP CPAP CARE Pro - External Dependencies for Full 7,000 Rollout

REQUIRED_MARKER: PHASE125_EXTERNAL_DEPENDENCIES
REQUIRED_MARKER: REAL_AIRVIEW_EXPORT_REQUIRED
REQUIRED_MARKER: CLEAN_7000_ROLLOUT_FILE_REQUIRED
REQUIRED_MARKER: LEGAL_REVIEW_REQUIRED

## Not development blockers

These are not missing development tasks.
They are external buyer/production dependencies.

## Required from Raftopoulos

1. Real anonymized AirView export
- 2 to 3 devices are enough for mapping hard-lock
- no names
- no phone
- no email
- no AMKA
- no address

2. Clean 7,000 rollout CSV
Required columns:
- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code

3. Legal / DPO review
Required before full production live rollout.

4. Commercial approval
Required before onboarding all patients.

## After these are received

Run:
- Phase117 again for real AirView hard-lock
- 7,000 rollout validation
- production backup
- controlled import
- smoke test
- buyer acceptance
