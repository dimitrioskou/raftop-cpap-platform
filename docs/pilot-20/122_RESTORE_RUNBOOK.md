# RAFTOP CPAP CARE Pro - Restore Runbook

REQUIRED_MARKER: PHASE122_RESTORE_RUNBOOK
REQUIRED_MARKER: RESTORE_DRY_RUN_REQUIRED
REQUIRED_MARKER: CURRENT_PRODUCTION_BACKUP_REQUIRED
REQUIRED_MARKER: NO_DIRECT_PRODUCTION_RESTORE

## Critical rule

Do not restore directly into production.

## Restore sequence

1. Confirm written approval.
2. Take a fresh backup of current production.
3. Copy the target backup into a safe local folder.
4. Restore into temporary staging database first.
5. Run smoke tests against staging.
6. Verify:
   - login
   - Pilot20 patients
   - AirView upload
   - Rescue Monitor
   - Import History
   - Rolling 80h Report
7. Only after verification, schedule production restore window.
8. Keep rollback backup available.

## Production restore is forbidden unless

- current production backup exists
- backup file integrity is checked
- staging dry-run succeeds
- owner approves the restore window
