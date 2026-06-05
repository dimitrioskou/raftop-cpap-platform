# RAFTOP CPAP CARE Pro - 100-row Controlled Pilot Import

REQUIRED_MARKER: PHASE96_100_ROW_CONTROLLED_PILOT_IMPORT
REQUIRED_MARKER: PILOT_IMPORT_APPLIED
REQUIRED_MARKER: ONLY_100_ROWS
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS
REQUIRED_MARKER: READY_FOR_PHASE97_ATLAS_80H_VERIFICATION

## Meaning

The first controlled pilot import was applied to production operational tables.

## Scope

Imported into:
- patients
- devices
- compliance_nights
- import_audit_logs

## Safety

Only 100 rows were used.
No direct identifier columns are allowed.
No users were created.
No 7000-row import was performed.

## Next phase

Phase 97:
ATLAS / 80h / Reports verification using imported pilot data.
