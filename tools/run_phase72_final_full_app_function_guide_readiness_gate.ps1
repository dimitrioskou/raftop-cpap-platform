# RAFTOP CPAP CARE Pro
# Phase 72.1 - Final Full Greek App Function Guide Readiness Gate
# ASCII-safe validation script.
# Safe: read-only verification. Does not modify application code.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$PortalDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0"
$PortalZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.zip"
$HtmlPath = Join-Path $PortalDir "index.html"
$PdfPath = Join-Path $PortalDir "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf"
$ToolsDir = Join-Path $Root "tools"
$AppUrl = "https://raftop-cpap-frontend.onrender.com/login"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase72_final_full_app_function_guide_readiness_gate_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

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
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
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

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
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

function Test-ForbiddenTextAbsent {
    param([string]$Name, [string]$Path, [string]$Forbidden)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Forbidden) {
        Add-Result ($Name + ": " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ($Name + ": " + $Forbidden) "PASS" "Forbidden text absent."
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 72 Final Full Greek App Function Guide Readiness Gate" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 72.1 Final Full Greek App Function Guide Readiness Gate..."
Write-Host ""

Check-ReportStatus "Phase 72 full app function guide Greek portal" "phase72_full_app_function_guide_greek_portal_*.md" @(
    "PHASE72_FULL_APP_FUNCTION_GUIDE_GREEK_PORTAL_READY"
)

Check-ReportStatus "Phase 71 final app link button guide readiness" "phase71_final_app_link_button_guide_readiness_gate_*.md" @(
    "PHASE71_FINAL_APP_LINK_BUTTON_GUIDE_READINESS_READY"
)

Check-ReportStatus "Phase 70 final Greek buyer-clean portal readiness" "phase70_final_greek_buyer_clean_portal_readiness_gate_*.md" @(
    "PHASE70_FINAL_GREEK_BUYER_CLEAN_PORTAL_READINESS_READY"
)

Test-PathExists "Greek buyer portal folder exists" $PortalDir
Test-PathExists "Greek buyer portal ZIP exists" $PortalZip
Test-PathExists "Greek buyer portal index.html exists" $HtmlPath
Test-PathExists "Greek buyer portal PDF exists" $PdfPath

$HtmlContent = Read-FileSafe $HtmlPath

if (ContainsText $HtmlContent $AppUrl) {
    Add-Result "App URL exists in HTML" "PASS" $AppUrl
} else {
    Add-Result "App URL exists in HTML" "FAIL" "App URL missing."
}

Test-FileMarker "Full guide marker" $HtmlPath "RAFTOP_APP_ACCESS_GUIDE_START"
Test-FileMarker "Full guide marker" $HtmlPath "RAFTOP_APP_ACCESS_GUIDE_END"
Test-FileMarker "Full guide marker" $HtmlPath "raftopShowGuide"

$ButtonMatches = [regex]::Matches($HtmlContent, 'class="app-guide-button"')
if ($ButtonMatches.Count -ge 40) {
    Add-Result "Full app guide button count" "PASS" ("Buttons found: " + $ButtonMatches.Count)
} else {
    Add-Result "Full app guide button count" "FAIL" ("Buttons found: " + $ButtonMatches.Count)
}

$RequiredButtons = @(
    "Executive Demo Home",
    "Executive Demo Script",
    "Quality &amp; Profit",
    "Pilot Walkthrough",
    "Demo Launcher",
    "Pilot Launcher",
    "Decision Launcher",
    "Sales Snapshot",
    "Pilot Proposal",
    "Decision Room",
    "Objections",
    "Pilot Success",
    "Pilot Playbook",
    "Rollout Roadmap",
    "Presentation Flow",
    "Final Demo Script",
    "Pilot Approval Decision",
    "Executive Pilot Close",
    "Executive Leave-behind",
    "Statistics",
    "Executive Report",
    "Business Impact",
    "Dashboard",
    "Patient Portal",
    "Patients",
    "Devices",
    "Patient Signals",
    "ATLAS",
    "Action Center",
    "Closed Loop",
    "Tasks",
    "Follow-up",
    "Notes",
    "Referrals",
    "Notifications",
    "Operational Efficiency",
    "Readiness Score",
    "Unresolved Risk Load",
    "Active Interventions",
    "Compliance Rescue",
    "Burden Index",
    "Refresh",
    "Safe Fallback"
)

foreach ($Button in $RequiredButtons) {
    if (ContainsText $HtmlContent $Button) {
        Add-Result ("Documented app button: " + $Button) "PASS" "Button found."
    } else {
        Add-Result ("Documented app button: " + $Button) "FAIL" "Button missing."
    }
}

# Allow only the live app href. This prevents old broken local links.
$HrefMatches = [regex]::Matches($HtmlContent, 'href="([^"]+)"')
$BadHrefs = @()

foreach ($Match in $HrefMatches) {
    $Href = $Match.Groups[1].Value

    if ($Href -ne $AppUrl) {
        $BadHrefs += $Href
    }
}

if ($BadHrefs.Count -eq 0) {
    Add-Result "No broken local href dependencies" "PASS" "Only allowed href is live app URL."
} else {
    Add-Result "No broken local href dependencies" "FAIL" ("Unexpected hrefs: " + ($BadHrefs -join "; "))
}

$ForbiddenText = @(
    "do not give",
    "do not send",
    "ChatGPT",
    "developer-only",
    "internal scripts",
    "GitHub secrets",
    "Render secrets",
    "raw logs",
    "tools/",
    "reports/",
    ".env"
)

foreach ($Forbidden in $ForbiddenText) {
    Test-ForbiddenTextAbsent "Buyer-facing forbidden text absent" $HtmlPath $Forbidden
}

if (Test-Path $PdfPath) {
    $PdfItem = Get-Item $PdfPath
    if ($PdfItem.Length -gt 1000) {
        Add-Result "Updated Greek portal PDF file size" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "Updated Greek portal PDF file size" "WARN" ("PDF exists but size is small: " + $PdfItem.Length)
    }
}

if (Test-Path $PortalZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($PortalZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "index.html") {
            Add-Result "ZIP contains index.html" "PASS" "Entry found."
        } else {
            Add-Result "ZIP contains index.html" "FAIL" "Entry missing."
        }

        if ($ZipEntries -contains "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf") {
            Add-Result "ZIP contains updated PDF" "PASS" "Entry found."
        } else {
            Add-Result "ZIP contains updated PDF" "FAIL" "Entry missing."
        }

        $ForbiddenEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "RAFTOP_BACKUPS_ARCHIVE",
            "RAFTOP_EXTERNAL_BACKUPS"
        )

        foreach ($Forbidden in $ForbiddenEntries) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

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

$RequiredTools = @(
    "run_phase72_replace_greek_button_guide_with_full_app_function_guide.ps1",
    "run_phase72_final_full_app_function_guide_readiness_gate.ps1"
)

foreach ($Tool in $RequiredTools) {
    Test-PathExists ("Tool exists: " + $Tool) (Join-Path $ToolsDir $Tool)
}

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
    $FinalStatus = "PHASE72_FINAL_FULL_APP_FUNCTION_GUIDE_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE72_FINAL_FULL_APP_FUNCTION_GUIDE_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE72_FINAL_FULL_APP_FUNCTION_GUIDE_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 72 Final Full Greek App Function Guide Readiness Gate"
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