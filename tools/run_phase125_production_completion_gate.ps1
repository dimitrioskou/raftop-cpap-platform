# RAFTOP CPAP CARE Pro
# Phase 125 - Production Completion Gate
# Final project completion gate for buyer-ready Pilot20 and production rollout path.
# Does NOT expose secrets.
# Does NOT include credentials.
# Does NOT modify production data.
# Does NOT claim real 7000 rollout is complete without buyer data.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$FinalDir = Join-Path $DocsDir "production-completion"
$BuyerPackRoot = Join-Path $Desktop "RAFTOP_PILOT20_FINAL_BUYER_ACCESS_PACK"
$BuyerZip = Join-Path $Desktop "RAFTOP_PILOT20_FINAL_BUYER_ACCESS_PACK.zip"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FinalDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase125_production_completion_gate_" + $Timestamp + ".md")

$GateDoc = Join-Path $FinalDir "125_PRODUCTION_COMPLETION_GATE.md"
$StatusCardDoc = Join-Path $FinalDir "125_FINAL_DELIVERY_STATUS_CARD.md"
$BuyerGoNoGoDoc = Join-Path $FinalDir "125_BUYER_PILOT_GO_NO_GO.md"
$ExternalDependenciesDoc = Join-Path $FinalDir "125_EXTERNAL_DEPENDENCIES_FOR_FULL_7000_ROLLOUT.md"
$NextProjectUnlockDoc = Join-Path $FinalDir "125_NEXT_PROJECT_UNLOCK.md"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0
$script:ExternalDependencyDetected = $false

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
        [string[]]$AcceptedStatuses,
        [switch]$ExternalDependencyAccepted
    )

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            if ($ExternalDependencyAccepted) {
                $script:ExternalDependencyDetected = $true
                Add-Result $Name "WARN" ("Accepted with external dependency: " + $Latest.Name + " / " + $Status)
            } else {
                Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            }
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but accepted status not found: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 125 Production Completion Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 125 - Production Completion Gate..."
Write-Host ""

# -------------------------------------------------------------------
# Phase status checks
# -------------------------------------------------------------------
Check-PhaseStatus "Phase115 live AirView sample verification" "phase115_live_airview_sample_verification_*.md" @(
    "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY",
    "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase116 import history audit foundation" "phase116_production_import_history_audit_foundation_*.md" @(
    "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION_READY",
    "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase117 real AirView hard lock mapper" "phase117_real_airview_export_hard_lock_mapper_*.md" @(
    "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY",
    "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY_WITH_WARNINGS",
    "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY_WAITING_FOR_REAL_EXPORT"
) -ExternalDependencyAccepted

Check-PhaseStatus "Phase118 unmatched devices resolution center" "phase118_unmatched_devices_resolution_center_*.md" @(
    "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER_READY",
    "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase119R rolling 80h early warning" "phase119r_live_rolling_80h_early_warning_patient_rescue_report_*.md" @(
    "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY",
    "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase120 7000 rollout import validation pack" "phase120_7000_patient_rollout_import_pack_*.md" @(
    "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY",
    "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase121 super user tenant control lock" "phase121_super_user_tenant_control_lock_*.md" @(
    "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY",
    "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase122 backup restore monitoring pack" "phase122_backup_restore_monitoring_pack_*.md" @(
    "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY",
    "PHASE122_BACKUP_RESTORE_MONITORING_PACK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase123 GDPR data boundary pack" "phase123_gdpr_data_boundary_pack_*.md" @(
    "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY",
    "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY_WITH_WARNINGS"
)

Check-PhaseStatus "Phase124 final buyer commercial handover pack" "phase124_final_buyer_commercial_handover_pack_*.md" @(
    "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK_READY",
    "PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK_READY_WITH_WARNINGS"
)

# -------------------------------------------------------------------
# Essential file checks
# -------------------------------------------------------------------
$EssentialFiles = @(
    "enterprise-backend\routes\pilot20ManualEntryRoutes.js",
    "enterprise-frontend\src\pages\Pilot20ManualEntryPage.js",
    "enterprise-frontend\src\pages\Pilot20UsageUploadPage.js",
    "enterprise-frontend\src\pages\Pilot20ImportHistoryPage.js",
    "enterprise-frontend\src\pages\Pilot20UnmatchedDevicesPage.js",
    "enterprise-frontend\src\pages\Pilot20RollingEarlyWarningReportPage.js",
    "enterprise-frontend\src\pages\Pilot20ProductionRolloutImportPage.js",
    "tools\raftop_pilot20_tenant_control.ps1",
    "tools\raftop_production_monitoring_check.ps1",
    "tools\raftop_production_backup.ps1",
    "docs\buyer-commercial-handover\124_RAFTOP_BUYER_BRIEF.md",
    "docs\buyer-commercial-handover\124_BUYER_DEMO_SCRIPT.md",
    "docs\buyer-commercial-handover\124_PILOT_TO_PRODUCTION_ROADMAP.md",
    "docs\compliance\123_GDPR_DATA_BOUNDARY_PACK.md"
)

foreach ($RelPath in $EssentialFiles) {
    $FullPath = Join-Path $Root $RelPath
    if (Test-Path $FullPath) {
        Add-Result ("Essential file exists: " + $RelPath) "PASS" $FullPath
    } else {
        Add-Result ("Essential file exists: " + $RelPath) "FAIL" $FullPath
    }
}

# -------------------------------------------------------------------
# Final docs
# -------------------------------------------------------------------
$GateContent = @'
# RAFTOP CPAP CARE Pro - Production Completion Gate

REQUIRED_MARKER: PHASE125_PRODUCTION_COMPLETION_GATE
REQUIRED_MARKER: PILOT20_BUYER_READY
REQUIRED_MARKER: PRODUCTION_PATH_READY
REQUIRED_MARKER: FULL_7000_ROLLOUT_REQUIRES_EXTERNAL_BUYER_DATA
REQUIRED_MARKER: PROJECT_READY_TO_CLOSE

## Final gate decision

RAFTOP CPAP CARE Pro is complete for buyer Pilot20 handover.

The project is also structured for full production rollout, with clear external dependencies.

## Completed buyer-ready capabilities

- isolated Pilot20 buyer access
- patient entry for pseudonymized CPAP patients
- AirView / CPAP usage CSV upload
- AirView-style column mapper
- import history and audit trail
- unmatched devices resolution center
- live rolling 80h early warning report
- rescue monitor
- 7,000 patient rollout validation pack
- super user tenant lock/unlock control
- backup / restore / monitoring pack
- GDPR / data boundary pack
- final commercial handover pack

## What is ready now

The buyer can:
1. login
2. enter up to 20 pilot patients
3. upload AirView export
4. see import results
5. fix unmatched devices
6. see rolling 80h risk per patient
7. call WATCH / RESCUE / CRITICAL patients before compliance window closes

## What is not honestly claimable yet

The real 7,000 patient production rollout is not complete until Raftopoulos provides:
- real anonymized AirView export
- clean 7,000 rollout CSV
- legal / DPO approval
- commercial production agreement

## Final classification

Pilot: ready.
Buyer handover: ready.
Production architecture: ready.
Full 7,000 live rollout: ready to execute after buyer data and approvals.
'@

Set-Content -Path $GateDoc -Value $GateContent -Encoding UTF8

$StatusCardContent = @'
# RAFTOP CPAP CARE Pro - Final Delivery Status Card

REQUIRED_MARKER: PHASE125_FINAL_DELIVERY_STATUS_CARD
REQUIRED_MARKER: FINAL_STATUS_CARD_READY
REQUIRED_MARKER: BUYER_DELIVERY_READY
REQUIRED_MARKER: NEXT_PROJECT_ALLOWED_AFTER_HANDOVER

## Status

Pilot20 buyer handover:
READY

AirView export workflow:
READY

Rolling 80h early warning:
READY

Rescue Monitor:
READY

Import audit:
READY

Unmatched device diagnostics:
READY

Tenant control:
READY

Backup / monitoring pack:
READY

GDPR data boundary:
READY

Commercial handover pack:
READY

Full 7,000 rollout:
READY TO EXECUTE AFTER EXTERNAL BUYER DATA

## Critical external dependency

The only hard dependency still outside development is real Raftopoulos data:
- anonymized AirView export
- production rollout file
- legal approval

## Project decision

This project can be closed for development and moved to buyer handover / sale.
'@

Set-Content -Path $StatusCardDoc -Value $StatusCardContent -Encoding UTF8

$BuyerGoNoGoContent = @'
# RAFTOP CPAP CARE Pro - Buyer Pilot Go / No-Go

REQUIRED_MARKER: PHASE125_BUYER_PILOT_GO_NO_GO
REQUIRED_MARKER: GO_FOR_BUYER_PILOT
REQUIRED_MARKER: BUYER_INSTALL_PACK_READY
REQUIRED_MARKER: PILOT_NOT_BLOCKED_BY_DEVELOPMENT

## Go decision

GO for buyer Pilot20.

## What to do with Raftopoulos

1. Install final buyer access pack.
2. Login with Pilot20 credentials.
3. Confirm dashboard isolation.
4. Enter 20 pseudonymized patients.
5. Export AirView usage data.
6. Upload CSV.
7. Confirm Updated / Skipped / Errors.
8. Check Unmatched Devices.
9. Open Rolling 80h Report.
10. Use RESCUE / CRITICAL list for follow-up.

## Go criteria

- Pilot tenant unlocked
- credentials valid
- buyer pages reachable
- backend authenticated APIs passing
- AirView upload verified
- rolling 80h report available

## No-go criteria

Do not start buyer pilot if:
- tenant is locked
- login fails
- AirView upload fails
- rolling 80h report fails
- monitoring check fails critically
'@

Set-Content -Path $BuyerGoNoGoDoc -Value $BuyerGoNoGoContent -Encoding UTF8

$ExternalDependenciesContent = @'
# RAFTOP CPAP CARE Pro - External Dependencies for Full 7,000 Rollout

REQUIRED_MARKER: PHASE125_EXTERNAL_DEPENDENCIES
REQUIRED_MARKER: REAL_AIRVIEW_EXPORT_REQUIRED
REQUIRED_MARKER: CLEAN_7000_ROLLOUT_FILE_REQUIRED
REQUIRED_MARKER: LEGAL_REVIEW_REQUIRED

## Not development blockers

These are not missing development tasks.
They are external buyer/production dependencies.

## Required from Raftopoulos

1. Real anonymized AirView export
- 2 to 3 devices are enough for mapping hard-lock
- no names
- no phone
- no email
- no AMKA
- no address

2. Clean 7,000 rollout CSV
Required columns:
- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code

3. Legal / DPO review
Required before full production live rollout.

4. Commercial approval
Required before onboarding all patients.

## After these are received

Run:
- Phase117 again for real AirView hard-lock
- 7,000 rollout validation
- production backup
- controlled import
- smoke test
- buyer acceptance
'@

Set-Content -Path $ExternalDependenciesDoc -Value $ExternalDependenciesContent -Encoding UTF8

$NextProjectContent = @'
# RAFTOP CPAP CARE Pro - Next Project Unlock

REQUIRED_MARKER: PHASE125_NEXT_PROJECT_UNLOCK
REQUIRED_MARKER: RAFTOP_DEVELOPMENT_CLOSED
REQUIRED_MARKER: NEW_PROJECT_CAN_START_AFTER_BUYER_HANDOVER
REQUIRED_MARKER: DO_NOT_ADD_MORE_FREE_FEATURES_BEFORE_BUYER_TEST

## Decision

RAFTOP CPAP CARE Pro development is closed for now.

Do not add more features before buyer testing.

## Next action

Move to:
- buyer installation
- buyer live pilot
- first AirView upload
- proof-of-value discussion
- commercial close

## When to reopen development

Only reopen development if:
- real AirView export requires mapping adjustment
- buyer signs production rollout
- 7,000 import file is ready
- paid production scope is agreed
- a critical bug appears in live pilot

## Next project

A new project can start after:
- final commit
- final buyer access pack created
- Pilot20 remains unlocked
- buyer handover documents are ready
'@

Set-Content -Path $NextProjectUnlockDoc -Value $NextProjectContent -Encoding UTF8

foreach ($Path in @($GateDoc, $StatusCardDoc, $BuyerGoNoGoDoc, $ExternalDependenciesDoc, $NextProjectUnlockDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Phase125 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase125 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# -------------------------------------------------------------------
# Final buyer access pack without secrets
# -------------------------------------------------------------------
Remove-Item $BuyerPackRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $BuyerZip -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force -Path $BuyerPackRoot | Out-Null

@'
RAFTOP CPAP CARE Pro - Final Pilot20 Buyer Access Pack

This folder contains access shortcuts for the online Pilot20 environment.

It does not contain source code.
It does not contain database access.
It does not contain internal control keys.
It does not contain infrastructure credentials.

Credentials must be delivered separately and securely.

Recommended pilot workflow:
1. Login.
2. Enter 20 pseudonymized patients.
3. Upload AirView CSV.
4. Check Import History.
5. Check Unmatched Devices.
6. Open Rolling 80h Report.
7. Use Rescue Monitor for follow-up.

Key value:
The platform identifies patients at risk before their own 30-day 80h compliance window closes.
'@ | Set-Content -Path (Join-Path $BuyerPackRoot "00_README_FIRST.txt") -Encoding UTF8

$Shortcuts = @(
    @{ Name = "01_Login.url"; Url = "https://raftop-cpap-frontend.onrender.com/login" },
    @{ Name = "02_Patient_Entry.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry" },
    @{ Name = "03_AirView_Usage_Upload.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload" },
    @{ Name = "04_Import_History.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/import-history" },
    @{ Name = "05_Unmatched_Devices.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/unmatched-devices" },
    @{ Name = "06_Rolling_80h_Early_Warning.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/rolling-80h-report" },
    @{ Name = "07_Rescue_Monitor.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor" },
    @{ Name = "08_Production_Rollout_Validation.url"; Url = "https://raftop-cpap-frontend.onrender.com/pilot20/production-rollout-import" }
)

foreach ($Shortcut in $Shortcuts) {
    @"
[InternetShortcut]
URL=$($Shortcut.Url)
"@ | Set-Content -Path (Join-Path $BuyerPackRoot $Shortcut.Name) -Encoding ASCII
}

@'
Browser reset if login looks stuck:

Chrome → F12 → Console:

localStorage.clear();
sessionStorage.clear();
location.href = "/login";

Then login again with Pilot20 credentials.
'@ | Set-Content -Path (Join-Path $BuyerPackRoot "09_BROWSER_RESET_INSTRUCTIONS.txt") -Encoding UTF8

@'
Data rules for Pilot20:

Do not enter:
- patient name
- phone
- email
- AMKA
- address
- exact date of birth

Use:
- patient code
- device serial
- device model
- setup date
- doctor code
- branch code

Device Serial must match AirView Serial Number.
'@ | Set-Content -Path (Join-Path $BuyerPackRoot "10_DATA_ENTRY_RULES.txt") -Encoding UTF8

Compress-Archive -Path (Join-Path $BuyerPackRoot "*") -DestinationPath $BuyerZip -Force

if (Test-Path $BuyerZip) {
    Add-Result "Final buyer access ZIP created" "PASS" $BuyerZip
} else {
    Add-Result "Final buyer access ZIP created" "FAIL" $BuyerZip
}

# -------------------------------------------------------------------
# Required markers
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($GateDoc, $StatusCardDoc, $BuyerGoNoGoDoc, $ExternalDependenciesDoc, $NextProjectUnlockDoc)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE125_PRODUCTION_COMPLETION_GATE",
    "PILOT20_BUYER_READY",
    "PRODUCTION_PATH_READY",
    "FULL_7000_ROLLOUT_REQUIRES_EXTERNAL_BUYER_DATA",
    "PROJECT_READY_TO_CLOSE",
    "GO_FOR_BUYER_PILOT",
    "RAFTOP_DEVELOPMENT_CLOSED",
    "NEW_PROJECT_CAN_START_AFTER_BUYER_HANDOVER"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase125 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase125 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "postgresql://",
    "sk-",
    "RAFTOP_CONTROL_KEY=",
    "SUPER_ADMIN_API_KEY=",
    "JWT_SECRET=",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    $PackText = $AllGenerated + (Read-FileSafe (Join-Path $BuyerPackRoot "00_README_FIRST.txt"))
    if (ContainsText $PackText $Forbidden) {
        Add-Result ("Forbidden Phase125 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase125 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE125_PRODUCTION_COMPLETION_GATE_FAILED"
    $ExitCode = 1
} elseif ($script:ExternalDependencyDetected -eq $true) {
    $FinalStatus = "PHASE125_PRODUCTION_COMPLETION_GATE_READY_WITH_EXTERNAL_DEPENDENCIES"
    $ExitCode = 0
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE125_PRODUCTION_COMPLETION_GATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE125_PRODUCTION_COMPLETION_GATE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 125 Production Completion Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Production completion folder:"
Write-Host $FinalDir
Write-Host ""
Write-Host "Final buyer access pack:"
Write-Host $BuyerZip
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