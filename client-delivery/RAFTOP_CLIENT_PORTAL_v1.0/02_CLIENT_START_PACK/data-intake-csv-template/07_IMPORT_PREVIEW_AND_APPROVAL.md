# RAFTOP CPAP CARE Pro - Import Preview and Approval

Purpose:

Define the process before data is used in the platform.

Preview steps:

1. Receive CSV file.
2. Confirm source and date range.
3. Confirm data level: demo, anonymized, pseudonymized, or real.
4. Validate headers.
5. Validate row format.
6. Check sensitive identifiers.
7. Check sample rows.
8. Confirm no-data/compliance/leak examples.
9. Approve for demo or operational use.

Approval fields:

- file name
- data owner
- data source
- date range
- patient count
- data level
- approved by
- approval date

Reject file if:

- columns do not match
- date format is wrong
- identifiers are uncontrolled
- data sensitivity is unclear
- file contains credentials or secrets

Rule:

Preview first. Import second. Never reverse this order.
