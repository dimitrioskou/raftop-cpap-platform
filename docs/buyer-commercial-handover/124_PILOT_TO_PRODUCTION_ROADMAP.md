# RAFTOP CPAP CARE Pro - Pilot to Production Roadmap

REQUIRED_MARKER: PHASE124_PILOT_TO_PRODUCTION_ROADMAP
REQUIRED_MARKER: PILOT_TO_PRODUCTION_ROADMAP_READY
REQUIRED_MARKER: FULL_7000_ROLLOUT_PATH_READY
REQUIRED_MARKER: REAL_AIRVIEW_EXPORT_REQUIRED

## Stage 1 - Pilot20

Status:
Ready.

Scope:
- 20 pseudonymized patients
- AirView CSV upload
- rolling 80h early warning
- import audit
- unmatched device resolution
- buyer access isolation

Goal:
Show operational value before full purchase.

## Stage 2 - Real AirView export hard-lock

Requirement:
Raftopoulos provides anonymized AirView export with 2-3 devices.

Outcome:
The platform locks the exact real AirView column format.

## Stage 3 - 7,000 patient rollout validation

Requirement:
Raftopoulos provides production rollout CSV using approved template.

Validation checks:
- required fields
- missing device serial
- duplicate patient codes
- duplicate serials
- forbidden direct identifiers
- date format errors

Outcome:
Clean file approved for controlled production import.

## Stage 4 - Production onboarding

Actions:
- import patient/device portfolio
- verify sample patients
- verify AirView uploads
- verify rolling 80h report
- verify backup/monitoring
- verify tenant control

## Stage 5 - Full commercial operation

Operational cycle:
1. periodic AirView export
2. upload to platform
3. check import history
4. fix unmatched devices
5. review rolling 80h early warning
6. call RESCUE / CRITICAL patients
7. track compliance improvement

## Stage 6 - Expansion

Optional after purchase:
- doctor portal
- doctor-specific patient lists
- billing / subscription controls
- mobile app
- deeper SleepHQ-style therapy analysis
- direct AirView API exploration if commercially and legally feasible
