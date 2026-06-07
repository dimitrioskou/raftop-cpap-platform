# RAFTOP CPAP CARE Pro - Monitoring Operations

REQUIRED_MARKER: PHASE122_MONITORING_OPERATIONS
REQUIRED_MARKER: DAILY_MONITORING_CHECK_READY
REQUIRED_MARKER: PILOT20_ENDPOINTS_MONITORED
REQUIRED_MARKER: BUYER_ACCESS_MONITORED

## Daily check

Run:

.\tools\raftop_production_monitoring_check.ps1

## What must pass

- backend health
- frontend login
- Pilot20 page access
- authenticated Pilot20 API checks
- Rescue Monitor
- Import History
- Unmatched Devices
- Rolling 80h Early Warning

## If monitoring fails

1. Check Render backend deploy status.
2. Check Render frontend deploy status.
3. Check environment variables.
4. Check database availability.
5. Check latest Git commit.
6. Do not give buyer access until critical failure is resolved.

## Buyer rule

If buyer reports a problem, run monitoring check before changing code.
