# RAFTOP CPAP CARE Pro - AirView Export Mapper for Pilot20

REQUIRED_MARKER: PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20
REQUIRED_MARKER: AIRVIEW_EXPORT_MAPPING
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING
REQUIRED_MARKER: AIRVIEW_COLUMNS_ACCEPTED
REQUIRED_MARKER: READY_FOR_PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION

## Purpose

Pilot20 usage upload now accepts both:
- standard Pilot20 usage CSV
- AirView-style export CSV

## Matching key

device serial

## Common AirView-style column aliases

- Serial Number -> device_serial
- Device Serial -> device_serial
- Start Date -> month_start
- Last Data Date -> last_data_date
- End Date -> last_data_date
- Usage Hours -> month_usage_hours
- Used Hours -> month_usage_hours
- Days Used -> days_used_30d
- AHI -> ahi_avg_30d
- 95th Percentile Leak -> leak_avg_30d
- Mask Leak -> leak_avg_30d

## Buyer value

Raftopoulos exports usage data from AirView, uploads the CSV, and the platform updates compliance and Rescue Monitor automatically.

## Boundary

No direct patient identifiers are needed.
