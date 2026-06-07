# RAFTOP CPAP CARE Pro - Buyer Pilot20 Usage Instructions

REQUIRED_MARKER: PHASE113_BUYER_PILOT20_USAGE_INSTRUCTIONS
REQUIRED_MARKER: ENTER_PATIENTS_ONCE
REQUIRED_MARKER: UPLOAD_USAGE_CSV
REQUIRED_MARKER: REVIEW_RESCUE_MONITOR
REQUIRED_MARKER: CALL_CRITICAL_AND_RESCUE_FIRST

## Step 1 - Login

Open:
https://raftop-cpap-frontend.onrender.com/login

Use Pilot20 credentials.

## Step 2 - Enter patients once

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Enter up to 20 patients.

Required:
- Patient External ID
- Patient Code
- Device Serial
- Device Model
- Setup Date
- Doctor Code
- Branch Code

Do not enter direct identifiers.

## Step 3 - Upload usage CSV periodically

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

Required CSV columns:
- device_serial
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d

## Step 4 - Review 80h Rescue Monitor

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

Use priority:
1. CRITICAL
2. RESCUE
3. WATCH
4. ON_TRACK
5. SAFE

## Step 5 - Act before month end

Call patients who need intervention before they miss the 80-hour threshold.
