# RAFTOP CPAP CARE Pro - ATLAS / 80h / Reports Verification

REQUIRED_MARKER: PHASE84_ATLAS_80H_REPORTS_VERIFICATION
REQUIRED_MARKER: ATLAS_PRIORITY_QUEUE_VERIFIED
REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE_VERIFIED
REQUIRED_MARKER: MANAGEMENT_REPORT_SNAPSHOT_VERIFIED
REQUIRED_MARKER: NO_REAL_PATIENT_DATA

## Purpose

This phase verifies the operational logic over the synthetic 7000-patient dataset.

It does not import real patient data.
It does not write to the production database.

## Input

Synthetic CSV:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\data-intake\raftopoulos-production\RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv

Rows:
7000

## Verified outputs

ATLAS priority queue:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\reports\phase84_atlas_priority_queue.csv

80h compliance summary:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\reports\phase84_80h_compliance_summary.csv

Action group summary:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\reports\phase84_action_group_summary.csv

Management report snapshot:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\reports\phase84_management_report_snapshot.csv

## Key metrics

Total patients:
7000

Patients >= 80 hours:
4782

Patients below 80 hours:
2218

80h compliance rate percent:
68.31

No-data / old-data patients:
942

High AHI patients:
538

High leak patients:
636

ATLAS queue total:
2988

Critical priority:
952

High priority:
194

Medium priority:
1440

## Business interpretation

The synthetic 7000-patient dataset produces:
- compliant patients
- below-80h compliance risk patients
- no-data / old-data patients
- high AHI patients
- high leak patients
- ATLAS prioritization output
- management reporting snapshot

## Hard rule

Real patient data import remains blocked until:
- commercial agreement
- GDPR / DPA agreement
- production tenant signoff
- CSV validation
- stage 100 import signoff
- stage 500 import signoff
- stage 2000 import signoff
- stage 7000 import signoff
