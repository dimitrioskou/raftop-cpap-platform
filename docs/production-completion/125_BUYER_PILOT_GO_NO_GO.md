# RAFTOP CPAP CARE Pro - Buyer Pilot Go / No-Go

REQUIRED_MARKER: PHASE125_BUYER_PILOT_GO_NO_GO
REQUIRED_MARKER: GO_FOR_BUYER_PILOT
REQUIRED_MARKER: BUYER_INSTALL_PACK_READY
REQUIRED_MARKER: PILOT_NOT_BLOCKED_BY_DEVELOPMENT

## Go decision

GO for buyer Pilot20.

## What to do with Raftopoulos

1. Install final buyer access pack.
2. Login with Pilot20 credentials.
3. Confirm dashboard isolation.
4. Enter 20 pseudonymized patients.
5. Export AirView usage data.
6. Upload CSV.
7. Confirm Updated / Skipped / Errors.
8. Check Unmatched Devices.
9. Open Rolling 80h Report.
10. Use RESCUE / CRITICAL list for follow-up.

## Go criteria

- Pilot tenant unlocked
- credentials valid
- buyer pages reachable
- backend authenticated APIs passing
- AirView upload verified
- rolling 80h report available

## No-go criteria

Do not start buyer pilot if:
- tenant is locked
- login fails
- AirView upload fails
- rolling 80h report fails
- monitoring check fails critically
