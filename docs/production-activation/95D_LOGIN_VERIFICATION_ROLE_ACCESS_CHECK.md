# RAFTOP CPAP CARE Pro - Login Verification & Role Access Check

REQUIRED_MARKER: PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK
REQUIRED_MARKER: LOGIN_VERIFIED_WITHOUT_PRINTING_PASSWORDS
REQUIRED_MARKER: TOKENS_NOT_STORED_IN_REPORT
REQUIRED_MARKER: READY_FOR_PHASE96_CSV_INTAKE_IF_LOGIN_OK

## Meaning

This phase verifies whether the created production tenant users can authenticate against the production backend.

## Security

Passwords are not printed.
Tokens are not printed.
Credentials remain outside the repository.

## Expected users

- tenant_admin
- operations_user
- operations_user
- viewer

## If login fails

Do not proceed to real CSV import.
First fix:
- auth endpoint
- password hashing compatibility
- user role mapping
- tenant mapping

## Next phase

If login works:
Phase 96 - Real CSV Intake / 100-row Pilot Import.

If login does not work:
Phase 95E - Auth Compatibility Fix.
