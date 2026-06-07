# RAFTOP CPAP CARE Pro - Buyer Demo Script

REQUIRED_MARKER: PHASE124_BUYER_DEMO_SCRIPT
REQUIRED_MARKER: DEMO_FLOW_READY
REQUIRED_MARKER: BUYER_PRESENTATION_SCRIPT_READY
REQUIRED_MARKER: CLOSE_THE_SALE_SCRIPT_READY

## Opening line

This platform takes the CPAP data you already have from AirView and turns it into a daily action list: who is safe, who is behind, who needs follow-up and who is critical before losing 80h compliance.

## Demo order

### 1. Login

Open:
https://raftop-cpap-frontend.onrender.com/login

Explain:
This is an isolated buyer environment. You do not see internal admin screens.

### 2. Patient Entry

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Explain:
You enter up to 20 pilot patients once, using patient code and device serial. No names, phones, AMKA or direct identifiers are needed.

### 3. AirView Usage Upload

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

Explain:
After the patient list is entered, you export usage data from AirView and upload the CSV here. The platform maps AirView-style columns automatically.

### 4. Import History

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/import-history

Explain:
Every upload is recorded: when it happened, who uploaded it, how many rows updated, how many were skipped and how many had errors.

### 5. Unmatched Devices

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/unmatched-devices

Explain:
If a device serial in AirView does not match Patient Entry, it appears here so the issue can be fixed.

### 6. Rolling 80h Early Warning

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/rolling-80h-report

Explain:
This is the core value. Each patient is checked inside their own 30-day 80h compliance window. The platform shows who needs intervention before it is too late.

### 7. Rescue Monitor

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

Explain:
This is the action list for follow-up: SAFE, ON_TRACK, WATCH, RESCUE and CRITICAL.

## Closing line

The platform does not replace AirView. It uses AirView exports to create a commercial and operational follow-up system for saving CPAP compliance earlier.
