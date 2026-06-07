# RAFTOP CPAP CARE Pro - Production Import History & Audit Foundation

REQUIRED_MARKER: PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION
REQUIRED_MARKER: IMPORT_HISTORY_READY
REQUIRED_MARKER: IMPORT_AUDIT_TABLES_READY
REQUIRED_MARKER: USAGE_UPLOAD_AUDIT_TRAIL_READY
REQUIRED_MARKER: READY_FOR_PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK

## Purpose

Production systems need an audit trail for every AirView / CPAP usage upload.

This phase adds:
- import batch history
- per-row import details
- updated/skipped/error counts
- created by user
- created timestamp
- frontend Import History page

## Buyer value

Raftopoulos can see:
- what was uploaded
- when it was uploaded
- who uploaded it
- how many rows updated patients
- which devices were skipped
- which rows failed

## Page

/pilot20/import-history

## API

GET /api/pilot20/import-history
GET /api/pilot20/import-history/:batchId

## Production reason

Without import history, production support is blind.
With import history, skipped devices and failed mappings can be diagnosed quickly.
