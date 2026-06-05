# RAFTOP CPAP CARE Pro - 7000 Patient Import Approval Form

REQUIRED_MARKER: PHASE85_7000_PATIENT_IMPORT_APPROVAL_FORM
REQUIRED_MARKER: IMPORT_APPROVAL_REQUIRED
REQUIRED_MARKER: GDPR_DPA_REQUIRED
REQUIRED_MARKER: CSV_VALIDATION_REQUIRED

## Import approval

Production tenant:
raftopoulos-production

Import scope:
Controlled CPAP patient portfolio import.

Expected scale:
Up to 7000 patient records.

## Required approvals before real data import

[ ] Commercial agreement signed
[ ] GDPR / DPA signed
[ ] Data controller / processor responsibilities confirmed
[ ] CSV template approved
[ ] CSV validation passed
[ ] No direct identifiers in import file
[ ] Tenant admin approved
[ ] Operations users approved
[ ] Viewer users approved
[ ] Stage 100 approved
[ ] Stage 500 approved
[ ] Stage 2000 approved
[ ] Stage 7000 approved

## Hard blockers

Import is blocked if:
- CSV contains names, phones, emails, AMKA, addresses, or direct identifiers
- tenant_id is not raftopoulos-production
- patient_external_id is not unique
- device_serial is missing
- consent_basis is missing
- GDPR / DPA is not approved
- prior stage signoff is missing

## Approval

Approved by:
Role:
Date:
Signature:
