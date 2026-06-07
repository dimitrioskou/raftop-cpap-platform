# RAFTOP CPAP CARE Pro - Live Usage Upload Verification

REQUIRED_MARKER: PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION
REQUIRED_MARKER: LIVE_USAGE_TEMPLATE_VERIFIED
REQUIRED_MARKER: LIVE_USAGE_UPLOAD_VERIFIED
REQUIRED_MARKER: NO_PATIENT_CREATED_IN_THIS_PHASE
REQUIRED_MARKER: READY_FOR_BUYER_AUTOMATED_USAGE_WORKFLOW

## Verified

- Pilot admin login works.
- Usage CSV template endpoint works.
- Usage CSV upload endpoint accepts CSV.
- Unknown device is skipped safely.
- No patient is created by this phase.
- Rescue Monitor remains live.
- Usage Upload page is reachable.
- Manual Entry page remains reachable.
- Rescue Monitor page remains reachable.

## Buyer workflow

1. Enter patients once.
2. Upload usage CSV periodically.
3. Open Rescue Monitor.
4. See patient progress automatically.
