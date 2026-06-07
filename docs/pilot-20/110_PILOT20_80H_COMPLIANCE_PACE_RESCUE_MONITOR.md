# RAFTOP CPAP CARE Pro - Pilot20 80h Compliance Pace & Rescue Monitor

REQUIRED_MARKER: PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR
REQUIRED_MARKER: COMPLIANCE_PACE_MONITOR
REQUIRED_MARKER: REQUIRED_DAILY_HOURS_TO_80H
REQUIRED_MARKER: PROJECTED_END_MONTH_USAGE
REQUIRED_MARKER: RESCUE_QUEUE
REQUIRED_MARKER: READY_FOR_PHASE111_LIVE_RESCUE_MONITOR_VERIFICATION

## Purpose

This module shows whether each Pilot20 CPAP patient is on pace to reach the 80-hour monthly compliance threshold before the month ends.

## Buyer value

Raftopoulos can see before month-end:
- who already reached 80h
- who is on track
- who needs monitoring
- who needs rescue call
- who is critical
- how many hours remain
- required daily usage until month end
- projected end-month usage

## Risk levels

SAFE:
Already reached 80h.

ON_TRACK:
Projected to reach 80h.

WATCH:
Behind pace but easily recoverable.

RESCUE:
At real risk. Call today.

CRITICAL:
Very high risk of missing 80h unless urgent intervention happens.

## Page

/pilot20/rescue-monitor

## API

/api/pilot20/rescue-monitor
