# RAFTOP CPAP CARE Pro - Data Validation Checklist

Use this checklist before import or operational review.

File checks:

- file is CSV UTF-8
- header row exists
- columns match template
- no extra uncontrolled columns
- date format is YYYY-MM-DD
- usage_hours is numeric
- no_data_status uses yes/no
- leak_metric is numeric or blank
- ahi_metric is numeric or blank
- follow_up_status uses allowed values

Safety checks:

- patient names removed or approved
- direct identifiers removed or approved
- no credentials in file
- no passwords in file
- no database URLs in file
- data level confirmed
- data source confirmed

Operational checks:

- no-data examples exist
- compliance risk examples exist
- leak/therapy issue examples exist where available
- follow-up status is understandable
- assigned owner field is clear

Approval rule:

Do not import or use data operationally before preview, validation, and approval.
