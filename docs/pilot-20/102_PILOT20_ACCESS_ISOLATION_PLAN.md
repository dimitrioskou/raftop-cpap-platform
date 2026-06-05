# RAFTOP CPAP CARE Pro - Pilot 20 Access Isolation Plan

REQUIRED_MARKER: PHASE102_PILOT20_ACCESS_ISOLATION_LOCK
REQUIRED_MARKER: PILOT_TENANT_RAFTOPoulos_PILOT_20
REQUIRED_MARKER: MAX_20_PATIENTS
REQUIRED_MARKER: TWO_MONTH_PILOT
REQUIRED_MARKER: SYNTHETIC_7000_NOT_VISIBLE_TO_BUYER
REQUIRED_MARKER: READY_FOR_PHASE103_MANUAL_ENTRY_MODULE

## Purpose

Create a clean 20-patient pilot environment for Raftopoulos.

## Pilot tenant

Tenant slug:
raftopoulos-pilot-20

Tenant name:
Raftopoulos Pilot 20

## Why separate tenant

The 7000-row validation dataset proves technical scale readiness.
The buyer pilot must be clean and limited to 20 real pseudonymized patients.

## Pilot duration

2 months.

## Pilot limit

Maximum 20 patients.

## Buyer access

Raftopoulos receives tenant-level pilot access only.

## Not included

- source code
- GitHub
- Render credentials
- database credentials
- super admin
- synthetic 7000 dataset access
- raw database access

## Required next phase

Phase 103 must add/verify manual entry flow so buyer can enter:
- patient code
- device serial
- device model
- setup date
- CPAP usage
- 80h compliance data
- AHI
- leak

No direct identifiers.
