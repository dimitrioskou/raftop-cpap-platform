# RAFTOP CPAP CARE Pro - Data Incident Response Checklist

REQUIRED_MARKER: PHASE123_DATA_INCIDENT_RESPONSE_CHECKLIST
REQUIRED_MARKER: INCIDENT_RESPONSE_READY
REQUIRED_MARKER: ACCESS_LOCK_OPTION_READY
REQUIRED_MARKER: EVIDENCE_PRESERVATION_READY

## When to use

Use this checklist if:
- wrong file was uploaded
- direct identifiers were uploaded accidentally
- unauthorized access is suspected
- buyer reports unexpected patient data exposure
- database or backup exposure is suspected
- credentials were shared incorrectly

## Immediate actions

1. Do not delete evidence immediately.
2. Record time and description.
3. Lock Pilot20 tenant if needed.
4. Preserve logs and import history.
5. Identify affected upload batch.
6. Identify whether direct identifiers were involved.
7. Notify responsible internal person.
8. Escalate to legal/DPO if required.

## Tenant lock

Use internal control:

.\tools\raftop_pilot20_tenant_control.ps1 -Action lock -Reason "data_incident_review"

After investigation:

.\tools\raftop_pilot20_tenant_control.ps1 -Action unlock -Reason "data_incident_review_completed"

## Evidence to collect

- import batch ID
- filename
- upload timestamp
- user who uploaded
- row count
- skipped/error count
- whether direct identifiers were present
- affected endpoint/page
- screenshots if needed

## Do not

- do not send secrets by email
- do not send database URLs
- do not export raw data unnecessarily
- do not give buyer infrastructure access
- do not commit files containing patient identifiers

## Follow-up

After containment:
1. correct the file format
2. remove direct identifiers from future workflow
3. update buyer instructions if needed
4. document final outcome
