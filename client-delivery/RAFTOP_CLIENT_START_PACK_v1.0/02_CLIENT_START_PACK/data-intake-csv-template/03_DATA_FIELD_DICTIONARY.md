# RAFTOP CPAP CARE Pro - Data Field Dictionary

patient_reference_code

Description: pseudonymized patient reference.
Required: yes.
Example: P-0001.
Do not use full patient name unless legal/data framework is confirmed.

device_reference_code

Description: pseudonymized device reference.
Required: yes if available.
Example: D-1001.

date

Description: therapy data date.
Required: yes.
Format: YYYY-MM-DD.
Example: 2026-06-01.

usage_hours

Description: CPAP usage hours for the date or reporting period.
Required: yes if available.
Format: numeric decimal.
Example: 5.7.

no_data_status

Description: indicates whether data is missing.
Required: yes.
Allowed values: yes,no.
Example: no.

leak_metric

Description: leak value if available.
Required: optional.
Format: numeric decimal or blank.
Example: 18.5.

ahi_metric

Description: AHI value if available.
Required: optional.
Format: numeric decimal or blank.
Example: 4.2.

follow_up_status

Description: current follow-up state.
Required: optional.
Allowed values: none,open,in_progress,completed,blocked.
Example: open.

assigned_owner

Description: person or team responsible for follow-up.
Required: optional.
Example: operations_team.

notes

Description: short operational note.
Required: optional.
Do not include sensitive clinical narratives unless approved.

Boundary:

The data template supports operational review and follow-up prioritization. It does not replace physician judgment.
