# RAFTOP CPAP CARE Pro - CSV Validation Rules

REQUIRED_MARKER: PHASE81_CSV_VALIDATION_RULES
REQUIRED_MARKER: CONTROLLED_7000_IMPORT_ONLY
REQUIRED_MARKER: STAGED_IMPORT_100_500_2000_7000

Import stages:
1. Validate file structure
2. Validate 100 rows
3. Validate 500 rows
4. Validate 2000 rows
5. Validate 7000 rows
6. Import only after signoff

Hard blockers:
- missing required columns
- forbidden direct patient identifiers
- duplicate patient_external_id
- invalid tenant_id
- invalid numeric fields
- empty consent_basis
- empty device_serial

Warnings:
- row count below expected number
- duplicate device serials
- no-data patients
- old last_data_date
- high leak
- high AHI
- usage below 80 hours
