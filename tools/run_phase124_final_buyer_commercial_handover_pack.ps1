# RAFTOP CPAP CARE Pro
# Phase 124 - Final Buyer Commercial Handover Pack
# Creates final commercial handover docs for Raftopoulos buyer presentation.
# Does NOT expose secrets.
# Does NOT include credentials.
# Does NOT modify production data.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$PilotDocsDir = Join-Path $DocsDir "pilot-20"
$CommercialDir = Join-Path $DocsDir "buyer-commercial-handover"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $PilotDocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $CommercialDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase124_final_buyer_commercial_handover_pack_" + $Timestamp + ".md")

$MainHandoverDoc = Join-Path $CommercialDir "124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK.md"
$BuyerBriefDoc = Join-Path $CommercialDir "124_RAFTOP_BUYER_BRIEF.md"
$DemoScriptDoc = Join-Path $CommercialDir "124_BUYER_DEMO_SCRIPT.md"
$RoadmapDoc = Join-Path $CommercialDir "124_PILOT_TO_PRODUCTION_ROADMAP.md"
$ScopeDoc = Join-Path $CommercialDir "124_WHAT_BUYER_GETS_AND_NOT_GETS.md"
$OfferDoc = Join-Path $CommercialDir "124_COMMERCIAL_OFFER_TERMS_DRAFT.md"
$AccessGuideDoc = Join-Path $CommercialDir "124_INSTALLATION_AND_ACCESS_GUIDE.md"
$CompletionSummaryDoc = Join-Path $CommercialDir "124_PRODUCTION_COMPLETION_SUMMARY.md"
$PilotSummaryDoc = Join-Path $PilotDocsDir "124_PILOT20_BUYER_HANDOVER_SUMMARY.md"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like $Pattern } |
        Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-PhaseStatus {
    param(
        [string]$Name,
        [string]$Pattern,
        [string[]]$AcceptedStatuses
    )

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "WARN" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "WARN" ("Latest report exists but accepted status not found: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 124 Final Buyer Commercial Handover Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 124 - Final Buyer Commercial Handover Pack..."
Write-Host ""

# -------------------------------------------------------------------
# Previous phase checks
# -------------------------------------------------------------------
Check-PhaseStatus "Phase115 AirView live sample verification" "phase115_live_airview_sample_verification_*.md" @(
    "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY",
    "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase119R rolling 80h early warning" "phase119r_live_rolling_80h_early_warning_patient_rescue_report_*.md" @(
    "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY",
    "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase120 7000 rollout import pack" "phase120_7000_patient_rollout_import_pack_*.md" @(
    "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY",
    "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase121 super user tenant control" "phase121_super_user_tenant_control_lock_*.md" @(
    "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY",
    "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase122 backup restore monitoring" "phase122_backup_restore_monitoring_pack_*.md" @(
    "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY",
    "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase123 GDPR data boundary" "phase123_gdpr_data_boundary_pack_*.md" @(
    "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY",
    "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY_WITH_WARNINGS"
)

# -------------------------------------------------------------------
# Main commercial handover doc
# -------------------------------------------------------------------
$MainHandoverContent = @'
# RAFTOP CPAP CARE Pro - Final Buyer Commercial Handover Pack

REQUIRED_MARKER: PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK
REQUIRED_MARKER: BUYER_HANDOVER_READY
REQUIRED_MARKER: COMMERCIAL_PRESENTATION_READY
REQUIRED_MARKER: PILOT_TO_PRODUCTION_PATH_READY
REQUIRED_MARKER: READY_FOR_PHASE125_PRODUCTION_COMPLETION_GATE

## What this is

RAFTOP CPAP CARE Pro is a CPAP compliance and follow-up platform designed for Raftopoulos.

It converts AirView / CPAP usage data into operational action:
- who is safe
- who is on track
- who needs monitoring
- who needs rescue call
- who is critical before missing 80h compliance

## Core buyer value

The platform is not just a dashboard.

It is an early warning and patient rescue system for CPAP 80-hour compliance.

The key question it answers is:

Which patients must we contact now, before their own 30-day 80h compliance window closes?

## Pilot20 buyer flow

1. Buyer logs in.
2. Buyer enters up to 20 pseudonymized CPAP patients.
3. Buyer exports usage data from AirView.
4. Buyer uploads AirView CSV.
5. Platform maps AirView-style columns.
6. Platform matches by device serial.
7. Platform updates usage, AHI, leak and compliance.
8. Platform shows rolling 80h early warning.
9. Buyer sees who needs action before it is too late.

## Production-ready blocks completed

- Pilot20 isolated buyer access
- AirView-style usage upload
- AirView mapper
- import history and audit trail
- unmatched devices resolution center
- rolling 80h early warning report
- 7,000 patient rollout validation pack
- super user tenant lock control
- backup / restore / monitoring pack
- GDPR / data boundary pack
- commercial handover pack

## Important commercial boundary

Pilot20 is ready for buyer use.

Full 7,000 patient production rollout should proceed only after:
- real anonymized AirView export hard-lock
- buyer approval
- legal / DPO review
- clean 7,000 rollout validation
- production support agreement
'@

Set-Content -Path $MainHandoverDoc -Value $MainHandoverContent -Encoding UTF8

# -------------------------------------------------------------------
# Buyer brief
# -------------------------------------------------------------------
$BuyerBriefContent = @'
# RAFTOP CPAP CARE Pro - Buyer Brief for Raftopoulos

REQUIRED_MARKER: PHASE124_RAFTOP_BUYER_BRIEF
REQUIRED_MARKER: BUYER_BRIEF_READY
REQUIRED_MARKER: AIRVIEW_TO_ACTION_VALUE_READY
REQUIRED_MARKER: ROLLING_80H_EXPLAINED

## Short description

RAFTOP CPAP CARE Pro helps Raftopoulos monitor CPAP patients and detect early who is at risk of not reaching 80 hours of use inside their own compliance window.

## Problem

CPAP patients do not all start therapy on the same day.

A calendar-month report is not enough.

The company needs to know early:
- who is behind
- who still has time to recover
- who needs a call now
- who is critical

## Solution

The platform uses:
- patient code
- device serial
- setup date
- AirView usage export
- usage hours
- AHI
- leak
- last data date

and calculates:
- days elapsed
- days remaining
- current usage hours
- expected hours by today
- remaining hours to 80
- required hours per day
- projected end-window hours
- risk level
- recommended action

## Risk levels

SAFE:
Patient has reached 80h or is safe.

ON_TRACK:
Patient is progressing correctly.

WATCH:
Patient is slightly behind and needs monitoring.

RESCUE:
Patient can still be saved but needs contact.

CRITICAL:
Patient is at high risk and needs urgent intervention.

## Why this matters

The value is not to know at the end who failed.

The value is to know early who is about to fail, and act before the patient is lost.
'@

Set-Content -Path $BuyerBriefDoc -Value $BuyerBriefContent -Encoding UTF8

# -------------------------------------------------------------------
# Demo script
# -------------------------------------------------------------------
$DemoScriptContent = @'
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
'@

Set-Content -Path $DemoScriptDoc -Value $DemoScriptContent -Encoding UTF8

# -------------------------------------------------------------------
# Roadmap
# -------------------------------------------------------------------
$RoadmapContent = @'
# RAFTOP CPAP CARE Pro - Pilot to Production Roadmap

REQUIRED_MARKER: PHASE124_PILOT_TO_PRODUCTION_ROADMAP
REQUIRED_MARKER: PILOT_TO_PRODUCTION_ROADMAP_READY
REQUIRED_MARKER: FULL_7000_ROLLOUT_PATH_READY
REQUIRED_MARKER: REAL_AIRVIEW_EXPORT_REQUIRED

## Stage 1 - Pilot20

Status:
Ready.

Scope:
- 20 pseudonymized patients
- AirView CSV upload
- rolling 80h early warning
- import audit
- unmatched device resolution
- buyer access isolation

Goal:
Show operational value before full purchase.

## Stage 2 - Real AirView export hard-lock

Requirement:
Raftopoulos provides anonymized AirView export with 2-3 devices.

Outcome:
The platform locks the exact real AirView column format.

## Stage 3 - 7,000 patient rollout validation

Requirement:
Raftopoulos provides production rollout CSV using approved template.

Validation checks:
- required fields
- missing device serial
- duplicate patient codes
- duplicate serials
- forbidden direct identifiers
- date format errors

Outcome:
Clean file approved for controlled production import.

## Stage 4 - Production onboarding

Actions:
- import patient/device portfolio
- verify sample patients
- verify AirView uploads
- verify rolling 80h report
- verify backup/monitoring
- verify tenant control

## Stage 5 - Full commercial operation

Operational cycle:
1. periodic AirView export
2. upload to platform
3. check import history
4. fix unmatched devices
5. review rolling 80h early warning
6. call RESCUE / CRITICAL patients
7. track compliance improvement

## Stage 6 - Expansion

Optional after purchase:
- doctor portal
- doctor-specific patient lists
- billing / subscription controls
- mobile app
- deeper SleepHQ-style therapy analysis
- direct AirView API exploration if commercially and legally feasible
'@

Set-Content -Path $RoadmapDoc -Value $RoadmapContent -Encoding UTF8

# -------------------------------------------------------------------
# Scope doc
# -------------------------------------------------------------------
$ScopeContent = @'
# RAFTOP CPAP CARE Pro - What Buyer Gets and Does Not Get

REQUIRED_MARKER: PHASE124_WHAT_BUYER_GETS_AND_NOT_GETS
REQUIRED_MARKER: BUYER_SCOPE_READY
REQUIRED_MARKER: INTERNAL_BOUNDARIES_READY
REQUIRED_MARKER: NO_SOURCE_CODE_TRANSFER

## Buyer gets

For Pilot20:
- login access
- patient entry page
- AirView / usage CSV upload
- import history
- unmatched devices resolution center
- rolling 80h early warning report
- 80h rescue monitor
- pseudonymized data workflow
- buyer usage instructions

For production after purchase:
- controlled rollout plan
- 7,000 patient import validation
- operational monitoring procedure
- backup / restore procedure
- data boundary documentation
- support process if agreed commercially

## Buyer does not get

- GitHub repository
- source code
- database access
- Render account access
- infrastructure secrets
- internal control key
- super user lock/unlock key
- direct database connection string
- unrestricted admin access

## Why

The buyer buys platform access and operational value, not the full source code or infrastructure control.

## Internal owner control

The platform owner keeps:
- source control
- production deployment control
- tenant lock/unlock control
- backup/restore control
- support control
'@

Set-Content -Path $ScopeDoc -Value $ScopeContent -Encoding UTF8

# -------------------------------------------------------------------
# Commercial offer terms draft
# -------------------------------------------------------------------
$OfferContent = @'
# RAFTOP CPAP CARE Pro - Commercial Offer Terms Draft

REQUIRED_MARKER: PHASE124_COMMERCIAL_OFFER_TERMS_DRAFT
REQUIRED_MARKER: COMMERCIAL_TERMS_DRAFT_READY
REQUIRED_MARKER: PILOT_TO_PAID_ROLLOUT_READY
REQUIRED_MARKER: SUPPORT_SCOPE_TO_BE_DEFINED

## Purpose

This is a draft commercial structure.
Final pricing and legal terms must be confirmed before signing.

## Proposed structure

### Option A - Paid Pilot

Scope:
- Pilot20 environment
- support for first AirView export upload
- review of rolling 80h results
- weekly check-in during pilot

Duration:
2 months

Goal:
Prove value using real pseudonymized CPAP patients.

### Option B - Production License

Scope:
- full production tenant for Raftopoulos
- 7,000 patient rollout validation
- AirView export workflow
- rolling 80h early warning
- import history
- unmatched device resolution
- backup / monitoring operations
- super user controlled access

Billing options:
- annual platform license
- monthly support fee
- per-doctor resale model
- optional setup fee for 7,000 patient onboarding

### Option C - Resale to doctors / clinics

Raftopoulos can resell controlled access to doctors/clinics after production hardening.

Possible model:
- Starter
- Pro
- Enterprise

## Items to define before production agreement

- final price
- payment schedule
- support hours
- response times
- data-processing roles
- legal review
- rollout timeline
- access limits
- cancellation / lock policy
'@

Set-Content -Path $OfferDoc -Value $OfferContent -Encoding UTF8

# -------------------------------------------------------------------
# Access guide
# -------------------------------------------------------------------
$AccessGuideContent = @'
# RAFTOP CPAP CARE Pro - Installation and Access Guide

REQUIRED_MARKER: PHASE124_INSTALLATION_AND_ACCESS_GUIDE
REQUIRED_MARKER: BUYER_ACCESS_GUIDE_READY
REQUIRED_MARKER: DESKTOP_SHORTCUT_PACK_READY
REQUIRED_MARKER: DO_NOT_SHARE_INTERNAL_KEYS

## Buyer installation

The buyer does not install a local application.

The buyer receives a Desktop access folder with shortcuts to the online platform.

Expected folder:
RAFTOP CPAP CARE Pro - Pilot20 AirView

## Buyer links

Login:
https://raftop-cpap-frontend.onrender.com/login

Patient Entry:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

AirView / Usage Upload:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

Import History:
https://raftop-cpap-frontend.onrender.com/pilot20/import-history

Unmatched Devices:
https://raftop-cpap-frontend.onrender.com/pilot20/unmatched-devices

Rolling 80h Report:
https://raftop-cpap-frontend.onrender.com/pilot20/rolling-80h-report

Rescue Monitor:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

## Buyer credentials

Credentials must be delivered securely.

Do not place internal control keys in the buyer pack.

## Browser issue

If browser shows stale session:
- use Incognito
- or clear localStorage/sessionStorage
- login again

## Internal warning

Do not give buyer:
- RAFTOP_CONTROL_KEY
- SUPER_ADMIN_API_KEY
- database URL
- GitHub access
- Render access
'@

Set-Content -Path $AccessGuideDoc -Value $AccessGuideContent -Encoding UTF8

# -------------------------------------------------------------------
# Completion summary
# -------------------------------------------------------------------
$CompletionSummaryContent = @'
# RAFTOP CPAP CARE Pro - Production Completion Summary

REQUIRED_MARKER: PHASE124_PRODUCTION_COMPLETION_SUMMARY
REQUIRED_MARKER: PRODUCTION_COMPLETION_SUMMARY_READY
REQUIRED_MARKER: PILOT_READY_FOR_BUYER
REQUIRED_MARKER: FULL_PRODUCTION_REQUIRES_REAL_EXPORT_AND_LEGAL_REVIEW

## Pilot readiness

Pilot20 is ready for buyer use.

Ready:
- isolated buyer access
- patient entry
- AirView-style upload
- live AirView sample verification
- import history
- unmatched device resolution
- rolling 80h early warning
- rescue monitor
- tenant lock/unlock control
- monitoring pack
- GDPR/data boundary pack
- buyer commercial handover docs

## Full production readiness

The platform has the structure for production rollout.

Before full live 7,000 patient operation:
- receive real anonymized AirView export
- hard-lock exact AirView mapping
- validate 7,000 rollout file
- complete legal / DPO review
- define support agreement
- confirm backup/restore procedure
- define commercial agreement

## Final buyer message

Pilot is ready now.
Production rollout is the next paid stage after buyer approval.
'@

Set-Content -Path $CompletionSummaryDoc -Value $CompletionSummaryContent -Encoding UTF8

# -------------------------------------------------------------------
# Pilot summary doc
# -------------------------------------------------------------------
$PilotSummaryContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Buyer Handover Summary

REQUIRED_MARKER: PHASE124_PILOT20_BUYER_HANDOVER_SUMMARY
REQUIRED_MARKER: PILOT20_BUYER_HANDOVER_READY
REQUIRED_MARKER: AIRVIEW_UPLOAD_TO_RESCUE_MONITOR_READY
REQUIRED_MARKER: ROLLING_80H_EARLY_WARNING_READY

## What the buyer will do

1. Login.
2. Enter up to 20 pseudonymized CPAP patients.
3. Export usage data from AirView.
4. Upload AirView CSV.
5. Check import history.
6. Fix unmatched devices if needed.
7. Open Rolling 80h Report.
8. Call WATCH / RESCUE / CRITICAL patients.

## What the buyer will see

- current hours
- expected hours by today
- missing hours to 80
- days remaining in individual window
- required hours per day
- projected end-window usage
- AHI
- leak
- risk level
- recommended action

## Key selling point

The platform shows who is at risk before the patient's own 80h window closes.
'@

Set-Content -Path $PilotSummaryDoc -Value $PilotSummaryContent -Encoding UTF8

# -------------------------------------------------------------------
# Check docs created
# -------------------------------------------------------------------
$CreatedDocs = @(
    $MainHandoverDoc,
    $BuyerBriefDoc,
    $DemoScriptDoc,
    $RoadmapDoc,
    $ScopeDoc,
    $OfferDoc,
    $AccessGuideDoc,
    $CompletionSummaryDoc,
    $PilotSummaryDoc
)

foreach ($Path in $CreatedDocs) {
    if (Test-Path $Path) {
        Add-Result ("Phase124 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase124 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# -------------------------------------------------------------------
# Required marker checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in $CreatedDocs) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK",
    "BUYER_HANDOVER_READY",
    "COMMERCIAL_PRESENTATION_READY",
    "PILOT_TO_PRODUCTION_PATH_READY",
    "PHASE124_RAFTOP_BUYER_BRIEF",
    "PHASE124_BUYER_DEMO_SCRIPT",
    "PHASE124_PILOT_TO_PRODUCTION_ROADMAP",
    "PHASE124_WHAT_BUYER_GETS_AND_NOT_GETS",
    "PHASE124_COMMERCIAL_OFFER_TERMS_DRAFT",
    "PHASE124_INSTALLATION_AND_ACCESS_GUIDE",
    "PHASE124_PRODUCTION_COMPLETION_SUMMARY",
    "READY_FOR_PHASE125_PRODUCTION_COMPLETION_GATE"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase124 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase124 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase124 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase124 content absent: " + $Forbidden) "PASS" "Absent."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 124 Final Buyer Commercial Handover Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Commercial handover folder:"
Write-Host $CommercialDir
Write-Host ""
Write-Host "Pilot handover summary:"
Write-Host $PilotSummaryDoc
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode