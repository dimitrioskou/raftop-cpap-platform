# RAFTOP CPAP CARE Pro - Access and Credentials Delivery Rules

REQUIRED_MARKER: PHASE80_ACCESS_CREDENTIALS_RULES
REQUIRED_MARKER: CREDENTIALS_SEPARATE_DELIVERY
REQUIRED_MARKER: NO_SECRETS_IN_ZIP
REQUIRED_MARKER: NO_SOURCE_CODE_HANDOVER

## Rule 1 - Credentials are never inside the ZIP

The buyer-only ZIP must never contain:
- passwords
- database URLs
- API keys
- Render secrets
- GitHub secrets
- .env files
- source code
- internal scripts

## Rule 2 - Credentials are delivered separately

Credentials are delivered only after:
- purchase or pilot agreement
- named recipient confirmation
- role approval

## Rule 3 - Initial credentials

Each account must have:
- user email
- assigned role
- temporary password
- first-login password change requirement

## Rule 4 - Super admin

Platform Super Admin remains controlled by the platform owner.
This account is not shared with tenant users.

## Rule 5 - Tenant admin

Raftopoulos may receive Tenant Admin access for its own tenant only.
Tenant Admin cannot access platform secrets or other tenants.

## Rule 6 - Patient data

Real patient data must not be uploaded before GDPR / DPA and data intake approval.
