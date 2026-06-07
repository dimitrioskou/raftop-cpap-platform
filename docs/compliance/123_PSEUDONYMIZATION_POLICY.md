# RAFTOP CPAP CARE Pro - Pseudonymization Policy

REQUIRED_MARKER: PHASE123_PSEUDONYMIZATION_POLICY
REQUIRED_MARKER: PATIENT_CODE_POLICY_READY
REQUIRED_MARKER: DEVICE_SERIAL_ALLOWED
REQUIRED_MARKER: IDENTITY_SEPARATION_REQUIRED

## Purpose

The platform should operate using pseudonymized patient references wherever possible.

## Recommended code format

patient_external_id:
P-000001

patient_code:
CPAP-000001

doctor_external_id:
DR-001

branch_code:
ATHENS

## Separation rule

If Raftopoulos keeps a mapping between patient code and real patient identity, that mapping should remain outside the RAFTOP CPAP CARE Pro application unless there is a signed legal basis and production data-processing agreement.

## Application rule

The application stores operational therapy and compliance data.

It does not require:
- name
- phone
- email
- AMKA
- address

## AirView matching key

The technical matching key is:
device_serial

## Why device serial is needed

The AirView export identifies therapy usage by device serial.
The platform uses this to update the correct pseudonymized patient record.

## Minimum necessary data

Use only what is needed for:
- 80h compliance calculation
- rolling 30-day risk
- rescue prioritization
- AHI/leak review
- import audit
- unmatched device resolution
