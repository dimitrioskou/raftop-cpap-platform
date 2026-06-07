# RAFTOP CPAP CARE Pro - Buyer Data Intake Rules

REQUIRED_MARKER: PHASE123_BUYER_DATA_INTAKE_RULES
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS_IN_PILOT
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING_RULE
REQUIRED_MARKER: AIRVIEW_EXPORT_DATA_RULES

## What the buyer may enter

For Pilot20 and controlled rollout, use pseudonymized data.

Allowed fields:
- Patient External ID
- Patient Code
- Device Serial
- Device Model
- Setup Date
- Doctor Code
- Branch Code

## What the buyer must not enter

Do not enter:
- patient name
- patient surname
- phone
- mobile
- email
- AMKA
- address
- exact date of birth
- free text with identifiable information

## Why

The application does not need direct identity to calculate:
- usage hours
- remaining hours to 80
- required hours per day
- AHI
- leak
- risk level
- rescue priority

## Device serial rule

Device Serial in Patient Entry must match Serial Number in AirView export.

If they do not match:
- AirView row is skipped
- Unmatched Devices page shows the failed serial
- the user must correct the Patient Entry device serial or export format

## Upload rule

Before uploading AirView CSV:
1. Confirm no direct identifiers are included.
2. Confirm serial numbers are present.
3. Confirm usage hours are present.
4. Confirm last data date is present.
5. Upload only the necessary fields.

## Buyer-facing wording

Use operational patient codes, not real patient identities.
