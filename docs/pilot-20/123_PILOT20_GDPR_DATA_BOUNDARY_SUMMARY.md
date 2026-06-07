# RAFTOP CPAP CARE Pro - Pilot20 GDPR Data Boundary Summary

REQUIRED_MARKER: PHASE123_PILOT20_GDPR_DATA_BOUNDARY_SUMMARY
REQUIRED_MARKER: PILOT20_PSEUDONYMIZED_BOUNDARY_READY
REQUIRED_MARKER: BUYER_SAFE_DATA_RULES_READY
REQUIRED_MARKER: NO_DIRECT_PATIENT_IDENTIFIERS

## Pilot20 safe data boundary

The Pilot20 environment should only use pseudonymized operational data.

## Give this instruction to buyer

Do not enter patient names, phones, emails, AMKA, addresses or exact date of birth.

Use only:
- patient code
- device serial
- device model
- setup date
- doctor code
- branch code
- AirView usage metrics

## Why this is enough

The platform can calculate:
- progress to 80h
- remaining hours
- required hours per day
- risk level
- rescue priority
- AHI/leak flags

without direct patient identity.

## Full production

Before full rollout, legal/DPO review is required.
