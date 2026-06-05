# RAFTOP CPAP CARE Pro - 7000 Patient Rollout Access Onboarding

REQUIRED_MARKER: PHASE80_7000_ACCESS_ONBOARDING
REQUIRED_MARKER: CONTROLLED_IMPORT_STAGES
REQUIRED_MARKER: ATLAS_80H_REPORTS_VERIFICATION

## Day 0 - Buyer agreement

Required:
- commercial approval
- support scope
- GDPR / DPA approval
- named users
- production tenant approval

## Day 1 - Access setup

Create:
- 1 tenant admin
- 2 operations users
- 1 management viewer

Optional later:
- doctor users
- patient users

## Day 2 - CSV validation

Use pseudonymized or approved CSV.
Validate:
- patient_id
- device_serial
- month_usage_hours
- usage_hours_30d
- last_data_date
- ahi
- leak
- doctor_id
- consent / lawful basis marker
- tenant_id

## Day 3 - Controlled import test

Import first 100 rows.
Check:
- patients list
- devices
- ATLAS
- 80 Hours Compliance
- reports
- tasks

## Stage rollout

Stage 1: 100 rows
Stage 2: 500 rows
Stage 3: 2000 rows
Stage 4: 7000 rows

Each stage requires validation before proceeding.
