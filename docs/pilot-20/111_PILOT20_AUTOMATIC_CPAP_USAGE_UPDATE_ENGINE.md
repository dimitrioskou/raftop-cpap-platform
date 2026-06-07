# RAFTOP CPAP CARE Pro - Pilot20 Automatic CPAP Usage Update Engine

REQUIRED_MARKER: PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE
REQUIRED_MARKER: USAGE_CSV_UPLOAD
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING
REQUIRED_MARKER: AUTOMATIC_COMPLIANCE_UPDATE
REQUIRED_MARKER: RESCUE_MONITOR_AUTO_REFRESH
REQUIRED_MARKER: READY_FOR_PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION

## Purpose

Raftopoulos enters the 20 pilot patients once.

After that, updated CPAP usage is imported through CSV upload.
The platform matches usage rows by device_serial and automatically updates:
- compliance records
- 80h status
- projected month usage
- required daily hours
- Rescue Monitor risk level

## Required CSV columns

- device_serial
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d

## Page

/pilot20/usage-upload

## API

POST /api/pilot20/usage-upload
GET /api/pilot20/usage-template

## Boundary

No direct patient identifiers are allowed in usage CSV.
