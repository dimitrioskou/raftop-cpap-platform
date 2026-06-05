# RAFTOP CPAP CARE Pro - Production App Completion Status

REQUIRED_MARKER: PHASE93_PRODUCTION_APP_COMPLETION_STATUS
REQUIRED_MARKER: REAL_APP_DELIVERY_MODE
REQUIRED_MARKER: PRODUCTION_ACTIVATION_NEXT
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT_BEFORE_DPA

## Meaning

This status marks the switch from buyer/sales package to actual production application delivery.

## What must be completed before giving operational access

1. Backend health verified.
2. Production DB/schema verified.
3. Raftopoulos tenant created.
4. Tenant admin user created.
5. Operations users created.
6. Viewer user created.
7. Credentials delivered separately.
8. CSV validator run on real approved CSV.
9. 100-row controlled import.
10. 500-row controlled import.
11. 2000-row controlled import.
12. 7000-row controlled import.
13. Final production smoke test.
14. Buyer production handover signoff.

## Hard stop

No real patient import before commercial agreement, GDPR/DPA, CSV validation, and stage signoff.
