# RAFTOP CPAP CARE Pro - 7000 Patient Dry-Run Import Plan

REQUIRED_MARKER: PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN
REQUIRED_MARKER: NO_REAL_PATIENT_DATA
REQUIRED_MARKER: STAGED_IMPORT_100_500_2000_7000
REQUIRED_MARKER: ATLAS_80H_COMPLIANCE_DRY_RUN

## Purpose

This phase simulates the 7000-patient production rollout using pseudonymized synthetic data only.

It does not import real patient data.
It does not create production users.
It does not write to the production database.

## Synthetic dataset

File:
C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\data-intake\raftopoulos-production\RAFTOP_7000_PATIENT_SYNTHETIC_DRY_RUN.csv

Rows:
7000

Tenant:
raftopoulos-production

## Dry-run metrics

Total rows:
7000

Patients >= 80 hours:
4782

Patients below 80 hours:
2218

No-data / old-data patients:
942

High AHI rows:
538

High leak rows:
636

## Staged rollout

Stage 1:
100 rows

Stage 2:
500 rows

Stage 3:
2000 rows

Stage 4:
7000 rows

## Approval rule

Real 7000-patient import requires:
- commercial agreement
- GDPR / DPA agreement
- approved CSV
- successful validation
- tenant access signoff
- staged import signoff
