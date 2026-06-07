# RAFTOP CPAP CARE Pro - Unmatched Devices Resolution Center

REQUIRED_MARKER: PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER
REQUIRED_MARKER: UNMATCHED_DEVICE_SERIALS_READY
REQUIRED_MARKER: SKIPPED_DEVICE_DIAGNOSTICS_READY
REQUIRED_MARKER: DEVICE_SERIAL_RESOLUTION_WORKFLOW_READY
REQUIRED_MARKER: READY_FOR_PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT

## Purpose

When an AirView export contains serial numbers that do not match Pilot20 Patient Entry device serials, the rows are skipped.

This phase adds a Resolution Center that shows:
- unmatched device serial
- occurrence count
- latest batch
- latest file
- latest reason
- recommended action

## Page

/pilot20/unmatched-devices

## API

GET /api/pilot20/unmatched-devices

## Production value

Raftopoulos can quickly diagnose skipped uploads and fix serial mismatches.
