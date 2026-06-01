# RAFTOP CPAP CARE Pro
# Phase 66 - Final Client Delivery Master Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$BuildDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0.zip"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase66_final_client_delivery_master_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Test-FileMarker {
    param([string]$Name, [string]$Path, [string]$Marker)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ($Name + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ($Name + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 66 Final Client Delivery Master Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 66 Final Client Delivery Master Gate..."
Write-Host ""

# Final client delivery readiness chain
Check-ReportStatus "Phase 65 final client delivery ZIP readiness" "phase65_1_final_client_delivery_zip_readiness_gate_*.md" @(
    "PHASE65_FINAL_CLIENT_DELIVERY_ZIP_READINESS_READY"
)

Check-ReportStatus "Phase 64 final resale launch kit readiness" "phase64_final_resale_launch_kit_readiness_gate_*.md" @(
    "PHASE64_FINAL_RESALE_LAUNCH_KIT_READINESS_READY"
)

Check-ReportStatus "Phase 63 final support SLA change request readiness" "phase63_final_support_sla_change_request_readiness_gate_*.md" @(
    "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_READY"
)

Check-ReportStatus "Phase 62 final buyer onboarding runbook readiness" "phase62_final_buyer_onboarding_runbook_readiness_gate_*.md" @(
    "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY"
)

Check-ReportStatus "Phase 61 final data intake CSV template readiness" "phase61_final_data_intake_csv_template_readiness_gate_*.md" @(
    "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY"
)

Check-ReportStatus "Phase 60 final production access tenant activation readiness" "phase60_final_production_access_tenant_activation_readiness_gate_*.md" @(
    "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY"
)

Check-ReportStatus "Phase 59 final client start pack readiness" "phase59_final_client_start_pack_readiness_gate_*.md" @(
    "PHASE59_FINAL_CLIENT_START_PACK_READINESS_READY"
)

# Delivery artifact checks
Test-PathExists "Final ZIP exists" $ZipPath
Test-PathExists "Final build folder exists" $BuildDir

$RequiredFiles = @(
    "00_START_HERE.md",
    "01_EXECUTIVE_SUMMARY.md",
    "02_CLIENT_START_PACK\01_START_HERE_RAFTOP_CPAP_CARE_PRO.md",
    "02_CLIENT_START_PACK\production-access-tenant-activation\01_PRODUCTION_ACCESS_OVERVIEW.md",
    "02_CLIENT_START_PACK\data-intake-csv-template\02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
    "02_CLIENT_START_PACK\buyer-onboarding-runbook\01_BUYER_ONBOARDING_RUNBOOK.md",
    "02_CLIENT_START_PACK\support-sla-change-requests\01_SUPPORT_SCOPE_OVERVIEW.md",
    "02_CLIENT_START_PACK\resale-launch-kit\01_RESALE_LAUNCH_OVERVIEW.md",
    "02_CLIENT_START_PACK\resale-launch-kit\07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md",
    "03_DELIVERY_MANIFEST.md",
    "04_SECURITY_BOUNDARY.md",
    "05_VERSION_LOCK.md"
)

foreach ($File in $RequiredFiles) {
    Test-PathExists ("Required delivery file: " + $File) (Join-Path $BuildDir $File)
}

# Client-facing safety markers
Test-FileMarker "Start here" (Join-Path $BuildDir "00_START_HERE.md") "source code"
Test-FileMarker "Start here" (Join-Path $BuildDir "00_START_HERE.md") "Credentials must be delivered separately"
Test-FileMarker "Delivery manifest" (Join-Path $BuildDir "03_DELIVERY_MANIFEST.md") "not a source-code handover"
Test-FileMarker "Security boundary" (Join-Path $BuildDir "04_SECURITY_BOUNDARY.md") "must not contain credentials"
Test-FileMarker "Security boundary" (Join-Path $BuildDir "04_SECURITY_BOUNDARY.md") "not a diagnostic medical device"
Test-FileMarker "Version lock" (Join-Path $BuildDir "05_VERSION_LOCK.md") "Anything added after this client delivery package is a new version or change request"
Test-FileMarker "Resale boundaries" (Join-Path $BuildDir "02_CLIENT_START_PACK\resale-launch-kit\07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md") "unrestricted resale rights"
Test-FileMarker "Resale boundaries" (Join-Path $BuildDir "02_CLIENT_START_PACK\resale-launch-kit\07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md") "Scaling without boundaries"

# ZIP must not contain forbidden material
if (Test-Path $ZipPath) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredZipEntries = @(
            "00_START_HERE.md",
            "01_EXECUTIVE_SUMMARY.md",
            "02_CLIENT_START_PACK/01_START_HERE_RAFTOP_CPAP_CARE_PRO.md",
            "02_CLIENT_START_PACK/production-access-tenant-activation/01_PRODUCTION_ACCESS_OVERVIEW.md",
            "02_CLIENT_START_PACK/data-intake-csv-template/02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
            "02_CLIENT_START_PACK/buyer-onboarding-runbook/01_BUYER_ONBOARDING_RUNBOOK.md",
            "02_CLIENT_START_PACK/support-sla-change-requests/01_SUPPORT_SCOPE_OVERVIEW.md",
            "02_CLIENT_START_PACK/resale-launch-kit/07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md",
            "03_DELIVERY_MANIFEST.md",
            "04_SECURITY_BOUNDARY.md",
            "05_VERSION_LOCK.md"
        )

        foreach ($Entry in $RequiredZipEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("ZIP entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("ZIP entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "RAFTOP_BACKUPS_ARCHIVE"
        )

        foreach ($Forbidden in $ForbiddenEntries) {
            $Matches = $ZipEntries | Where-Object {
                $_ -like ("*" + $Forbidden + "*")
            }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "PASS" "No matching ZIP entries."
            } else {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "ZIP content readable" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

# Required script exists
Test-PathExists "Tool exists: run_phase66_final_client_delivery_master_gate.ps1" (Join-Path $ToolsDir "run_phase66_final_client_delivery_master_gate.ps1")

# Git status
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Git working tree" "WARN" "There are uncommitted/untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE66_FINAL_CLIENT_DELIVERY_MASTER_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE66_FINAL_CLIENT_DELIVERY_MASTER_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE66_FINAL_CLIENT_DELIVERY_MASTER_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 66 Final Client Delivery Master Gate"
Write-Host "============================================================"
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