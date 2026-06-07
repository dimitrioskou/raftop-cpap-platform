# RAFTOP CPAP CARE Pro - DPA / Legal Review Checklist

REQUIRED_MARKER: PHASE123_DPA_LEGAL_REVIEW_CHECKLIST
REQUIRED_MARKER: LEGAL_REVIEW_REQUIRED_BEFORE_FULL_ROLLOUT
REQUIRED_MARKER: DATA_PROCESSING_AGREEMENT_CHECKLIST_READY
REQUIRED_MARKER: PRODUCTION_ROLLOUT_NOT_LEGAL_FINAL_WITHOUT_REVIEW

## Important

This is not legal advice.
Use this checklist with legal counsel / DPO before full production rollout.

## Items to define

1. Parties
- platform provider
- Raftopoulos
- clinics / doctors if applicable

2. Roles
- controller
- processor
- sub-processor if applicable

3. Processing purpose
- CPAP usage monitoring
- 80h compliance support
- patient follow-up prioritization
- operational reporting

4. Data categories
- pseudonymized patient code
- device serial
- therapy usage
- AHI
- leak
- setup date
- doctor/branch code

5. Special category data assessment
- confirm whether CPAP therapy usage data is health-related data
- define legal basis
- define safeguards

6. Access control
- who can login
- who can upload exports
- who can see reports
- who can lock/unlock tenant
- who can access audit logs

7. Retention
- how long imports are kept
- how long backups are kept
- how long audit logs are kept

8. Deletion and export
- deletion request process
- export request process
- tenant offboarding process

9. Incident response
- internal notification
- buyer notification
- DPO/legal review
- evidence preservation

10. Technical measures
- pseudonymization
- role-based access
- tenant isolation
- audit logs
- backup/restore controls
- secret management

## Production gate

Full 7,000 patient rollout should not proceed until legal/data-processing review is complete.
