# RAFTOP CPAP CARE Pro - GDPR / Data Boundary Pack

REQUIRED_MARKER: PHASE123_GDPR_DATA_BOUNDARY_PACK
REQUIRED_MARKER: DATA_BOUNDARY_READY
REQUIRED_MARKER: PSEUDONYMIZED_PILOT_RULE_READY
REQUIRED_MARKER: PRODUCTION_DPA_REVIEW_REQUIRED
REQUIRED_MARKER: READY_FOR_PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK

## Important note

This document is an operational data-boundary pack.
It is not legal advice.
Final production documents should be reviewed by legal counsel / DPO before full rollout.

## Product context

RAFTOP CPAP CARE Pro processes CPAP operational data for compliance follow-up and 80-hour early warning.

The platform should use pseudonymized operational identifiers wherever possible.

## Core principle

The platform does not need direct patient identifiers for the Pilot20 workflow.

The system can function with:
- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code
- AirView usage metrics
- AHI
- leak
- usage hours
- last data date

## Forbidden unless legally approved and explicitly required

Do not enter:
- patient full name
- first name
- last name
- phone number
- email address
- AMKA
- street address
- exact date of birth
- free text medical history
- direct patient identifiers

## Pilot20 rule

Pilot20 must stay pseudonymized.

Allowed examples:
- CPAP-000001
- P-000001
- DR-001
- ATHENS
- RS-DEVICE-000001

Not allowed examples:
- real patient name
- real phone
- real email
- AMKA
- home address

## AirView export rule

AirView export should be anonymized before upload when possible.

Allowed AirView fields:
- Serial Number
- Start Date
- Last Data Date
- Usage Hours
- Days Used
- AHI
- Leak / 95th Percentile Leak

Avoid importing:
- name
- phone
- email
- AMKA
- address
- DOB

## Roles and access

Platform owner / super user:
- controls platform access
- can lock/unlock tenant
- can support imports and monitoring

Buyer / Raftopoulos pilot user:
- can access Pilot20 pages
- can enter pseudonymized patients
- can upload AirView CSV
- can view import history
- can view rolling 80h report
- cannot access source code
- cannot access database
- cannot access infrastructure
- cannot access internal control key

## Production legal review required

Before full 7,000 patient rollout:
- confirm controller / processor roles
- sign DPA if required
- define data retention
- define support access
- define breach notification flow
- define deletion/export rights
- define audit log requirements
- define backup retention
