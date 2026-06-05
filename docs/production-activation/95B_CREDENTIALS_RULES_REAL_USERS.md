# RAFTOP CPAP CARE Pro - Credentials Rules for Real Users

REQUIRED_MARKER: PHASE95B_CREDENTIALS_RULES_REAL_USERS
REQUIRED_MARKER: SEPARATE_CREDENTIAL_DELIVERY
REQUIRED_MARKER: NO_CREDENTIALS_IN_REPO
REQUIRED_MARKER: FIRST_LOGIN_RESET

## Rules

1. Credentials are created outside Git.
2. Credentials are delivered separately.
3. Do not store real temporary secrets in repository files.
4. Do not send credentials in the same email as the ZIP.
5. Do not share platform super admin.
6. Each user gets the minimum necessary role.
7. First login should trigger or require password change where supported.

## Credential recipient list

Tenant Admin:
- approved recipient required

Operations User 1:
- approved recipient required

Operations User 2:
- approved recipient required

Management Viewer:
- approved recipient required
