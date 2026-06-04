# RAFTOP CPAP CARE Pro - 7000 Patient CSV Schema

REQUIRED_MARKER: PHASE81_7000_PATIENT_CSV_SCHEMA
REQUIRED_MARKER: NO_DIRECT_IDENTIFIABLE_PATIENT_FIELDS
REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE_INPUT
REQUIRED_MARKER: ATLAS_INPUT_READY

Required columns:

tenant_id
patient_external_id
patient_code
device_serial
device_model
setup_date
month_start
last_data_date
month_usage_hours
usage_hours_30d
days_used_30d
ahi_avg_30d
leak_avg_30d
doctor_external_id
branch_code
consent_basis
data_source

Forbidden direct identifiable columns:

first_name
last_name
full_name
name
surname
phone
mobile
email
address
amka
adt
id_number
date_of_birth
dob
birth_date

Rules:
- tenant_id must be raftopoulos-production
- patient_external_id must be unique
- patient_code must be pseudonymized
- device_serial must not be empty
- month_usage_hours must be numeric
- usage_hours_30d must be numeric
- days_used_30d must be 0 to 31
- ahi_avg_30d must be numeric
- leak_avg_30d must be numeric
- consent_basis must not be empty
- no real patient names, phones, AMKA, addresses, or emails are allowed in this master CSV

80 Hours Compliance:
- month_usage_hours >= 80 means compliant for the month
- month_usage_hours < 80 means compliance risk
- no data / old data requires ATLAS follow-up
