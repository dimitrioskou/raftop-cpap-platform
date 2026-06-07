# RAFTOP CPAP CARE Pro - Live AirView Sample Verification

REQUIRED_MARKER: PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION
REQUIRED_MARKER: AIRVIEW_STYLE_CSV_ACCEPTED
REQUIRED_MARKER: NO_PATIENT_CREATED_IN_THIS_PHASE
REQUIRED_MARKER: RESCUE_MONITOR_REMAINS_LIVE
REQUIRED_MARKER: READY_FOR_RAFTOPoulos_AIRVIEW_PILOT

## Verified

- Pilot admin login works.
- AirView-style CSV headers are accepted.
- Unknown AirView device serial is skipped safely.
- No patient is created or updated during this verification.
- Rescue Monitor remains live.
- Usage Upload page is reachable.
- Manual Entry page is reachable.

## Buyer workflow

1. Enter 20 patients once.
2. Export usage CSV from AirView.
3. Upload AirView CSV.
4. Platform maps AirView columns.
5. Platform matches by device serial.
6. Rescue Monitor shows compliance risk before month end.
