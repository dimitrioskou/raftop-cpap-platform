# RAFTOP CPAP CARE Pro - Live Rolling 80h Early Warning & Patient Rescue Report

REQUIRED_MARKER: PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT
REQUIRED_MARKER: INDIVIDUAL_ROLLING_30_DAY_WINDOW_READY
REQUIRED_MARKER: EARLY_WARNING_BEFORE_WINDOW_END_READY
REQUIRED_MARKER: PATIENT_RESCUE_QUEUE_READY
REQUIRED_MARKER: READY_FOR_PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK

## Correction

This is not a calendar month report.

Raftopoulos does not need to know only what happened at the end of the month.
Patients start CPAP therapy on different dates.

The correct logic is:
- each patient has their own 30-day 80h compliance window
- the platform checks progress before the window closes
- the platform calculates how many hours per day are still needed
- the platform identifies who needs follow-up early

## Page

/pilot20/rolling-80h-report

## API

GET /api/pilot20/rolling-80h-early-warning

## Calculates per patient

- period_start
- period_end
- days_elapsed
- days_remaining
- current_hours
- expected_hours_today
- remaining_hours
- required_daily_hours
- projected_end_window_hours
- risk_level
- atlas_action

## Commercial value

This is an early warning and rescue system, not a late monthly autopsy.
