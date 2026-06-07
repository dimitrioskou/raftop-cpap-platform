# RAFTOP CPAP CARE Pro - Super User / Tenant Control Lock

REQUIRED_MARKER: PHASE121_SUPER_USER_TENANT_CONTROL_LOCK
REQUIRED_MARKER: TENANT_LOCK_CONTROL_READY
REQUIRED_MARKER: SUPER_USER_ACCESS_BOUNDARY_READY
REQUIRED_MARKER: BUYER_MENU_NOT_EXPOSED
REQUIRED_MARKER: READY_FOR_PHASE122_BACKUP_RESTORE_MONITORING_PACK

## Purpose

The platform owner must be able to lock or unlock Pilot20 access.

This is needed for:
- end of pilot
- unpaid access
- security pause
- commercial control
- controlled rollout

## Buyer boundary

This control is not shown in the buyer menu.

Raftopoulos receives:
- Login
- Patient Entry
- AirView Upload
- Import History
- Unmatched Devices
- Rolling 80h Report
- Rescue Monitor

Raftopoulos does not receive:
- source code
- database access
- infrastructure access
- internal control key
- super user tenant lock control

## Backend internal endpoints

GET /api/pilot20/internal/tenant-control/status

POST /api/pilot20/internal/tenant-control/set

Both require internal control header.

## Internal utility

tools/raftop_pilot20_tenant_control.ps1

## Lock behavior

When locked, Pilot20 endpoints return:

pilot20_tenant_locked
