# RAFTOP CPAP CARE Pro - Pilot 20 Integration and Deploy Lock

REQUIRED_MARKER: PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK
REQUIRED_MARKER: BACKEND_API_PILOT20_MOUNTED
REQUIRED_MARKER: FRONTEND_PILOT20_ROUTE_ADDED
REQUIRED_MARKER: PILOT20_READY_FOR_DEPLOY
REQUIRED_MARKER: READY_FOR_PHASE105_LIVE_PILOT20_VERIFICATION

## Backend

The pilot manual entry API must be mounted at:

/api/pilot20

Expected endpoints:

- GET /api/pilot20/health
- GET /api/pilot20/summary
- GET /api/pilot20/patients
- POST /api/pilot20/patients

## Frontend

The pilot manual entry page must be available at:

/pilot20/manual-entry

## Buyer use

Raftopoulos receives tenant-level pilot access only.

## Deployment

After commit and push, Render should redeploy backend/frontend from GitHub.

## Next phase

Phase 105:
Live Pilot 20 verification.
