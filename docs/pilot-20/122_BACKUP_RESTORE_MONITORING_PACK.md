# RAFTOP CPAP CARE Pro - Backup, Restore & Monitoring Pack

REQUIRED_MARKER: PHASE122_BACKUP_RESTORE_MONITORING_PACK
REQUIRED_MARKER: BACKUP_SCRIPT_READY
REQUIRED_MARKER: RESTORE_RUNBOOK_READY
REQUIRED_MARKER: MONITORING_SCRIPT_READY
REQUIRED_MARKER: READY_FOR_PHASE123_GDPR_DATA_BOUNDARY_PACK

## Purpose

Production readiness requires backup, restore and monitoring procedures.

This phase adds:
- production backup script
- restore runbook
- monitoring smoke-check script
- operational rules for secrets
- no backup files inside repository

## Backup script

tools/raftop_production_backup.ps1

The script reads the production database connection only from a temporary environment variable in the current PowerShell session.

It does not print the connection string.

## Monitoring script

tools/raftop_production_monitoring_check.ps1

Checks:
- backend health
- frontend pages
- Pilot20 login
- Patient Entry
- Usage Upload
- Rescue Monitor
- Import History
- Unmatched Devices
- Rolling 80h Report
- Production Rollout validation page

## Restore rule

Never restore directly into production without:
1. written approval
2. backup of current production
3. dry-run restore into temporary database
4. smoke test
5. rollback plan
