# RAFTOP CPAP CARE Pro - Pilot 20 Manual Patient Entry Module

REQUIRED_MARKER: PHASE103_PILOT20_MANUAL_ENTRY_MODULE
REQUIRED_MARKER: BUYER_CAN_ENTER_PATIENTS
REQUIRED_MARKER: HARD_LIMIT_20_PATIENTS
REQUIRED_MARKER: TENANT_RAFTOPoulos_PILOT_20_ONLY
REQUIRED_MARKER: EIGHTY_HOURS_PREVIEW
REQUIRED_MARKER: ATLAS_PREVIEW
REQUIRED_MARKER: READY_FOR_PHASE104_INTEGRATION_AND_DEPLOY

## Purpose

This module allows Raftopoulos to manually enter up to 20 pseudonymized CPAP pilot patients.

## Tenant

raftopoulos-pilot-20

## Hard limit

Maximum 20 patients.

## Manual entry fields

- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d
- doctor_external_id
- branch_code

## Outputs

- patient saved
- device saved
- compliance record saved
- 80h compliance preview
- ATLAS score preview
- pilot summary
- pilot patient list

## Security

No direct identifiers are allowed.
Buyer gets tenant-level access only.
Synthetic 7000 validation data must not be exposed in the pilot workflow.
