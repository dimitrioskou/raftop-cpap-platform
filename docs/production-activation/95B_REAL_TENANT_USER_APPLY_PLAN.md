# RAFTOP CPAP CARE Pro - Real Tenant User Apply Plan

REQUIRED_MARKER: PHASE95B_REAL_TENANT_USER_APPLY_PLAN
REQUIRED_MARKER: PHASE95C_APPLY_NEXT
REQUIRED_MARKER: APPROVED_BUYER_EMAILS_REQUIRED
REQUIRED_MARKER: CREDENTIALS_OUTSIDE_GIT

## Users to create

Initial production users:

1. Tenant Admin
   - role: tenant_admin
   - scope: raftopoulos-production

2. Operations User 1
   - role: operations_user
   - scope: patient monitoring and follow-up tasks

3. Operations User 2
   - role: operations_user
   - scope: patient monitoring and follow-up tasks

4. Management Viewer
   - role: viewer
   - scope: read-only dashboards and reports

## Required from buyer

Before applying real users, buyer must provide:
- full names
- emails
- role approval
- who receives credentials

## Security rules

- real temporary secrets are generated outside Git
- credentials are not committed
- credentials are not included in buyer ZIP
- super admin is not shared
- each user receives only their own access

## Next phase

Phase 95C:
Generate real user SQL from approved emails and apply to production DB.
