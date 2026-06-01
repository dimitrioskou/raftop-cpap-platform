# RAFTOP CPAP CARE Pro - Data Intake Requirements

Purpose:

This document defines the required structure for the first CPAP data sample provided by Raftopoulos.

Preferred data levels:

1. demo data
2. anonymized data
3. pseudonymized data
4. real patient data only with legal or DPA framework

Preferred file type:

CSV UTF-8.

Accepted source formats:

- CSV export
- Excel export converted to CSV
- structured table exported to CSV

Required fields:

- patient_reference_code
- device_reference_code
- date
- usage_hours
- no_data_status
- leak_metric
- ahi_metric
- follow_up_status
- assigned_owner
- notes

Rules:

- do not send uncontrolled real patient identifiers
- do not send passwords or credentials in the data file
- do not mix demo and real data without clear label
- do not import before preview and approval
- confirm data sensitivity before transfer

First data objective:

Enable safe review of no-data cases, compliance risk, leak or therapy signals, follow-up status, and ATLAS actions.
