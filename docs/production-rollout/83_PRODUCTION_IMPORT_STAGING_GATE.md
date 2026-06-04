# RAFTOP CPAP CARE Pro - Production Import Staging Gate

REQUIRED_MARKER: PHASE83_PRODUCTION_IMPORT_STAGING_GATE
REQUIRED_MARKER: STAGE_100_500_2000_7000
REQUIRED_MARKER: NO_DIRECT_7000_IMPORT
REQUIRED_MARKER: BUYER_SIGNOFF_REQUIRED
REQUIRED_MARKER: STOP_RULES_REQUIRED

## Purpose

This document controls the staged rollout for the Raftopoulos 7000-patient CPAP production import.

The system must not import all 7000 records directly without stage validation.

## Required stages

Stage 1:
100 rows

Stage 2:
500 rows

Stage 3:
2000 rows

Stage 4:
7000 rows

## Stage checks

Each stage must confirm:
- CSV validation passed
- tenant_id is raftopoulos-production
- no direct identifiers are present
- patients are created correctly
- devices are linked correctly
- ATLAS priorities calculate correctly
- 80 Hours Compliance counts are correct
- no-data cases are visible
- reports load correctly
- operations users can view assigned data
- no cross-tenant leakage exists

## Approval rule

Each stage requires signoff before proceeding to the next stage.

## Hard stop

If any stage fails, the next stage is blocked.
