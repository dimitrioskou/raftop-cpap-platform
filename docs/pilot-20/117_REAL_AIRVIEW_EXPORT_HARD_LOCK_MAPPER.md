# RAFTOP CPAP CARE Pro - Real AirView Export Hard-Lock Mapper

REQUIRED_MARKER: PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER
REQUIRED_MARKER: REAL_AIRVIEW_HEADER_LOCK
REQUIRED_MARKER: LOCKED_AIRVIEW_ALIAS_CONFIG
REQUIRED_MARKER: READY_FOR_PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER

## Purpose

This phase creates a production hard-lock mapping layer for the real AirView export format used by Raftopoulos.

## Sample folder

C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\data-intake\raftopoulos-pilot-20\real-airview-samples

## Locked config

C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-backend\config\pilot20AirViewHeaderMap.locked.json

## Current lock status

WAITING_FOR_REAL_AIRVIEW_EXPORT

## Why this matters

The application already supports AirView-style exports.
This phase hard-locks the exact real export headers so the buyer does not need to manually rename columns.

## Production rule

The device serial in AirView must match the device serial entered in Patient Entry.

## Next phase

Phase 118 - Unmatched Devices Resolution Center.
