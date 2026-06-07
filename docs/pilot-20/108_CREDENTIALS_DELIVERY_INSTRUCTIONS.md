# RAFTOP CPAP CARE Pro - Credentials Delivery Instructions

REQUIRED_MARKER: PHASE108_CREDENTIALS_DELIVERY_INSTRUCTIONS
REQUIRED_MARKER: DO_NOT_COMMIT_CREDENTIALS
REQUIRED_MARKER: DELIVER_CREDENTIALS_SEPARATELY
REQUIRED_MARKER: ONE_CHANNEL_FOR_LINKS_ONE_CHANNEL_FOR_PASSWORDS

## Credentials file

Credentials are stored outside the repository.

## Delivery rule

Do not send credentials in the same message as the general delivery message.

Recommended method:

1. Send the pilot message with URLs.
2. Send credentials separately.
3. Ask buyer to confirm first login.
4. Ask buyer to change temporary passwords if the application supports it.
5. Do not send platform super admin credentials.

## Credential roles

- Pilot Admin
- Pilot Operations
- Pilot Viewer

## Do not send

- source code
- repository access
- infrastructure access
- database access
- platform super admin
- secrets
