# RAFTOP CPAP CARE Pro
# Phase 60.1 - Final Production Access and Tenant Activation Readiness Gate
# ASCII-safe version.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsDir "client-start-pack"
$AccessDir = Join-Path $ClientDir "production-access-tenant-activation"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase60_final_production_access_tenant_activation_readiness_gate_" + $Timestamp + ".md")

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

function Test-DocMarker {
    param([string]$DocName, [string]$Marker)

    $Path = Join-Path $AccessDir $DocName
    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Marker in " + $DocName + ": " + $Marker) "FAIL" "Marker missing."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 60 Final Production Access and Tenant Activation Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 60.1 Final Production Access and Tenant Activation Readiness Gate..."
Write-Host ""

# Previous readiness gates
Check-ReportStatus "Phase 60 production access and tenant activation pack" "phase60_production_access_tenant_activation_pack_*.md" @(
    "PHASE60_PRODUCTION_ACCESS_TENANT_ACTIVATION_PACK_READY"
)

Check-ReportStatus "Phase 59 final client start pack readiness" "phase59_final_client_start_pack_readiness_gate_*.md" @(
    "PHASE59_FINAL_CLIENT_START_PACK_READINESS_READY"
)

Check-ReportStatus "Phase 58 final master handover readiness" "phase58_final_master_handover_readiness_gate_*.md" @(
    "PHASE58_FINAL_MASTER_HANDOVER_READINESS_READY"
)

# Production access docs
$AccessDocs = @(
    "01_PRODUCTION_ACCESS_OVERVIEW.md",
    "02_TENANT_ACTIVATION_CHECKLIST.md",
    "03_INITIAL_USER_SETUP.md",
    "04_CREDENTIAL_DELIVERY_RULES.md",
    "05_DEMO_SAMPLE_DATA_ACTIVATION.md",
    "06_FIRST_LOGIN_AND_ROUTE_TEST.md",
    "07_ACCESS_REVOCATION_AND_ROLE_CHANGE.md",
    "08_TENANT_ACTIVATION_SIGNOFF.md",
    "09_PRODUCTION_ACCESS_PACK_INDEX.md"
)

foreach ($Doc in $AccessDocs) {
    Test-PathExists ("Production access doc exists: " + $Doc) (Join-Path $AccessDir $Doc)
}

# Marker checks
Test-DocMarker "01_PRODUCTION_ACCESS_OVERVIEW.md" "controlled platform access"
Test-DocMarker "01_PRODUCTION_ACCESS_OVERVIEW.md" "Login URL"
Test-DocMarker "02_TENANT_ACTIVATION_CHECKLIST.md" "tenant status"
Test-DocMarker "02_TENANT_ACTIVATION_CHECKLIST.md" "No-start rule"
Test-DocMarker "03_INITIAL_USER_SETUP.md" "Buyer Admin"
Test-DocMarker "03_INITIAL_USER_SETUP.md" "Technical/Data Contact"
Test-DocMarker "04_CREDENTIAL_DELIVERY_RULES.md" "Credential Delivery Rules"
Test-DocMarker "04_CREDENTIAL_DELIVERY_RULES.md" "temporary password"
Test-DocMarker "05_DEMO_SAMPLE_DATA_ACTIVATION.md" "not look empty"
Test-DocMarker "05_DEMO_SAMPLE_DATA_ACTIVATION.md" "anonymized"
Test-DocMarker "06_FIRST_LOGIN_AND_ROUTE_TEST.md" "Routes to test"
Test-DocMarker "06_FIRST_LOGIN_AND_ROUTE_TEST.md" "Backend health test"
Test-DocMarker "07_ACCESS_REVOCATION_AND_ROLE_CHANGE.md" "commercial status"
Test-DocMarker "08_TENANT_ACTIVATION_SIGNOFF.md" "controlled use"
Test-DocMarker "09_PRODUCTION_ACCESS_PACK_INDEX.md" "client-facing"

# Required scripts
$RequiredTools = @(
    "run_phase60_create_production_access_tenant_activation_pack.ps1",
    "run_phase60_final_production_access_tenant_activation_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

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
    $FinalStatus = "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 60 Final Production Access and Tenant Activation Readiness Gate"
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