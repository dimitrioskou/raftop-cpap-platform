# RAFTOP CPAP CARE Pro
# Phase 50.4 - Final Buyer Presentation Readiness Gate
# ASCII-safe version.
# Safe: read-only verification plus URL checks. Does not modify application code.

param(
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs"
$BuyerDeliveryDir = Join-Path $DocsDir "buyer-delivery"
$BuyerPresentationDir = Join-Path $DocsDir "buyer-presentation"
$RehearsalDir = Join-Path $BuyerPresentationDir "rehearsal"
$ScreenshotsDir = Join-Path $BuyerPresentationDir "screenshots"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase50_final_buyer_presentation_readiness_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

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
    param(
        [string]$Content,
        [string]$Needle
    )

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
    param(
        [string]$Name,
        [string]$Pattern,
        [string[]]$AcceptedStatuses
    )

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
    param(
        [string]$Name,
        [string]$Path
    )

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Test-Url {
    param(
        [string]$Name,
        [string]$Url
    )

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop

        if ($Response.StatusCode -eq 200) {
            Add-Result $Name "PASS" ("HTTP 200: " + $Url)
        } else {
            Add-Result $Name "WARN" ("Unexpected HTTP status " + $Response.StatusCode + ": " + $Url)
        }
    } catch {
        Add-Result $Name "WARN" ("URL check failed: " + $_.Exception.Message)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 50 Final Buyer Presentation Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 50.4 Final Buyer Presentation Readiness Gate..."
Write-Host ""

# 1. Previous gates
Check-ReportStatus "Phase 49 final 100 percent product completion" "phase49_final_100_percent_product_completion_gate_*.md" @(
    "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY"
)

Check-ReportStatus "Phase 50 buyer presentation command center" "phase50_buyer_presentation_command_center_*.md" @(
    "PHASE50_BUYER_PRESENTATION_COMMAND_CENTER_READY"
)

Check-ReportStatus "Phase 50 live demo rehearsal pack" "phase50_live_demo_rehearsal_pack_*.md" @(
    "PHASE50_LIVE_DEMO_REHEARSAL_PACK_READY"
)

# 2. Buyer delivery docs
$DeliveryDocs = @(
    "01_RAFTOP_BUYER_DELIVERY_PACK.md",
    "02_PRODUCT_SCOPE_AND_BOUNDARIES.md",
    "03_BUYER_ONBOARDING_CHECKLIST.md",
    "04_SUPPORT_AND_INCIDENT_PROCESS.md",
    "05_RELEASE_NOTES.md",
    "06_OPERATIONAL_RUNBOOK.md"
)

foreach ($Doc in $DeliveryDocs) {
    Test-PathExists ("Buyer delivery doc: " + $Doc) (Join-Path $BuyerDeliveryDir $Doc)
}

# 3. Buyer presentation docs
$PresentationDocs = @(
    "01_DEMO_DAY_RUNBOOK.md",
    "02_BUYER_ROUTES_AND_LINKS.md",
    "03_30_MINUTE_BUYER_SCRIPT.md",
    "04_OBJECTION_HANDLING.md",
    "05_CLOSE_OPTIONS.md",
    "06_POST_DEMO_ACTIONS.md",
    "SCREENSHOT_BACKUP_CHECKLIST.md"
)

foreach ($Doc in $PresentationDocs) {
    Test-PathExists ("Buyer presentation doc: " + $Doc) (Join-Path $BuyerPresentationDir $Doc)
}

# 4. Rehearsal docs
$RehearsalDocs = @(
    "01_DEMO_REHEARSAL_CHECKLIST.md",
    "02_BROWSER_TABS_ORDER.md",
    "03_40_MINUTE_TALK_TRACK.md",
    "04_LIVE_DEMO_FAILOVER_PLAN.md",
    "05_DEMO_SCORING_SHEET.md"
)

foreach ($Doc in $RehearsalDocs) {
    Test-PathExists ("Rehearsal doc: " + $Doc) (Join-Path $RehearsalDir $Doc)
}

# 5. Screenshot folder structure
$ScreenshotFolders = @(
    "01-login",
    "02-sales-demo",
    "03-quality-profit",
    "04-pilot-demo",
    "05-buyer-routes",
    "06-backend-health"
)

foreach ($Folder in $ScreenshotFolders) {
    Test-PathExists ("Screenshot folder: " + $Folder) (Join-Path $ScreenshotsDir $Folder)
}

# 6. Required scripts
$RequiredTools = @(
    "run_phase49_final_100_percent_product_completion_gate.ps1",
    "run_phase50_create_buyer_presentation_command_center.ps1",
    "run_phase50_create_live_demo_rehearsal_pack.ps1",
    "run_phase50_final_buyer_presentation_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

# 7. Production URL checks
Test-Url "Production frontend root" ($FrontendUrl.TrimEnd("/") + "/")
Test-Url "Production login URL" ($FrontendUrl.TrimEnd("/") + "/login")
Test-Url "Production executive demo home URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/executive-demo-home")
Test-Url "Production quality profit URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/quality-profit")
Test-Url "Production pilot walkthrough URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-walkthrough-scenario")
Test-Url "Production pilot demo URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-demo")
Test-Url "Production buyer settings URL" ($FrontendUrl.TrimEnd("/") + "/settings")
Test-Url "Production buyer compliance URL" ($FrontendUrl.TrimEnd("/") + "/compliance")
Test-Url "Production buyer reports URL" ($FrontendUrl.TrimEnd("/") + "/reports")
Test-Url "Production buyer doctor URL" ($FrontendUrl.TrimEnd("/") + "/doctor")
Test-Url "Production buyer clinic URL" ($FrontendUrl.TrimEnd("/") + "/clinic")
Test-Url "Production backend health" ($BackendUrl.TrimEnd("/") + "/api/health")

# 8. Git status
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
    $FinalStatus = "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 50 Final Buyer Presentation Readiness Gate"
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