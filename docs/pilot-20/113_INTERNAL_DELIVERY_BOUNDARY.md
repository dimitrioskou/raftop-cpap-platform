# RAFTOP CPAP CARE Pro - Internal Delivery Boundary

REQUIRED_MARKER: PHASE113_INTERNAL_DELIVERY_BOUNDARY
REQUIRED_MARKER: NO_SOURCE_CODE_DELIVERY
REQUIRED_MARKER: NO_INFRASTRUCTURE_ACCESS
REQUIRED_MARKER: NO_DATABASE_ACCESS
REQUIRED_MARKER: NO_SUPER_ADMIN_ACCESS
REQUIRED_MARKER: CREDENTIALS_OUTSIDE_REPO

## Deliver to buyer

Allowed:
- Login URL
- Pilot20 URLs
- Pilot credentials
- Usage CSV instructions
- Two-month pilot explanation

Not allowed:
- source code
- GitHub repository
- Render credentials
- database credentials
- platform super admin
- production secrets
- internal operational scripts

## Credentials

Credentials must be sent separately from the general message.

Credential file is outside the repository:
C:\Users\Administrator\Desktop\RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt
