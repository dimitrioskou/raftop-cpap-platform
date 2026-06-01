# RAFTOP CPAP CARE Pro
# Phase 69.2 - Self-Contained Client Portal
# Safe: creates one standalone HTML portal with embedded content.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DeliveryRoot = Join-Path $Root "client-delivery"
$SourceDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_v1.0"
$OutDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_SELF_CONTAINED_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_SELF_CONTAINED_v1.0.zip"
$HtmlPath = Join-Path $OutDir "index.html"
$PdfPath = Join-Path $OutDir "RAFTOP_CLIENT_PORTAL_SELF_CONTAINED_v1.0.pdf"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase69_2_self_contained_client_portal_" + $Timestamp + ".md")

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

function HtmlEncode {
    param([string]$Text)
    return [System.Net.WebUtility]::HtmlEncode($Text)
}

function ReadSafe {
    param([string]$Path)
    if (Test-Path $Path) {
        return Get-Content -Path $Path -Raw -Encoding UTF8
    }
    return ""
}

function AddSectionHtml {
    param([string]$Title, [string]$Path)

    $Content = ReadSafe $Path
    if ([string]::IsNullOrWhiteSpace($Content)) {
        return "<section class='card'><h2>$Title</h2><p class='missing'>Content not found in source package.</p></section>"
    }

    $Encoded = HtmlEncode $Content
    return "<section class='card'><h2>$Title</h2><pre>$Encoded</pre></section>"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 69.2 Self-Contained Client Portal" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 69.2 Self-Contained Client Portal..."
Write-Host ""

if (Test-Path $SourceDir) {
    Add-Result "Source portal folder exists" "PASS" $SourceDir
} else {
    Add-Result "Source portal folder exists" "FAIL" $SourceDir
}

$Sections = @()

$Sections += AddSectionHtml "01 - Start Here" (Join-Path $SourceDir "02_CLIENT_START_PACK\01_START_HERE_RAFTOP_CPAP_CARE_PRO.md")
$Sections += AddSectionHtml "02 - Platform Access Guide" (Join-Path $SourceDir "02_CLIENT_START_PACK\02_PLATFORM_ACCESS_GUIDE.md")
$Sections += AddSectionHtml "03 - First 7 Days Onboarding Plan" (Join-Path $SourceDir "02_CLIENT_START_PACK\03_FIRST_7_DAYS_ONBOARDING_PLAN.md")
$Sections += AddSectionHtml "04 - Daily CPAP Operations Workflow" (Join-Path $SourceDir "02_CLIENT_START_PACK\04_DAILY_CPAP_OPERATIONS_WORKFLOW.md")
$Sections += AddSectionHtml "05 - ATLAS Actions Guide" (Join-Path $SourceDir "02_CLIENT_START_PACK\05_ATLAS_ACTIONS_GUIDE.md")
$Sections += AddSectionHtml "06 - Compliance / No-Data / Leak Workflow" (Join-Path $SourceDir "02_CLIENT_START_PACK\06_COMPLIANCE_NO_DATA_LEAK_WORKFLOW.md")
$Sections += AddSectionHtml "07 - User Roles and Permissions" (Join-Path $SourceDir "02_CLIENT_START_PACK\07_USER_ROLES_AND_PERMISSIONS.md")
$Sections += AddSectionHtml "08 - Data Intake Requirements" (Join-Path $SourceDir "02_CLIENT_START_PACK\data-intake-csv-template\01_DATA_INTAKE_REQUIREMENTS.md")
$Sections += AddSectionHtml "09 - CSV Template" (Join-Path $SourceDir "02_CLIENT_START_PACK\data-intake-csv-template\02_RAFTOP_CPAP_DATA_TEMPLATE.csv")
$Sections += AddSectionHtml "10 - Sample Data Rows" (Join-Path $SourceDir "02_CLIENT_START_PACK\data-intake-csv-template\04_SAMPLE_DATA_ROWS.csv")
$Sections += AddSectionHtml "11 - Buyer Onboarding Runbook" (Join-Path $SourceDir "02_CLIENT_START_PACK\buyer-onboarding-runbook\01_BUYER_ONBOARDING_RUNBOOK.md")
$Sections += AddSectionHtml "12 - Support Scope Overview" (Join-Path $SourceDir "02_CLIENT_START_PACK\support-sla-change-requests\01_SUPPORT_SCOPE_OVERVIEW.md")
$Sections += AddSectionHtml "13 - Out of Scope Items" (Join-Path $SourceDir "02_CLIENT_START_PACK\support-sla-change-requests\06_OUT_OF_SCOPE_ITEMS.md")
$Sections += AddSectionHtml "14 - Resale Launch Overview" (Join-Path $SourceDir "02_CLIENT_START_PACK\resale-launch-kit\01_RESALE_LAUNCH_OVERVIEW.md")
$Sections += AddSectionHtml "15 - Doctor / Clinic Packages" (Join-Path $SourceDir "02_CLIENT_START_PACK\resale-launch-kit\02_DOCTOR_CLINIC_PACKAGES.md")
$Sections += AddSectionHtml "16 - Resale Boundaries and Contract Rules" (Join-Path $SourceDir "02_CLIENT_START_PACK\resale-launch-kit\07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md")
$Sections += AddSectionHtml "17 - Delivery Manifest" (Join-Path $SourceDir "03_DELIVERY_MANIFEST.md")
$Sections += AddSectionHtml "18 - Security Boundary" (Join-Path $SourceDir "04_SECURITY_BOUNDARY.md")
$Sections += AddSectionHtml "19 - Version Lock" (Join-Path $SourceDir "05_VERSION_LOCK.md")

$SectionsHtml = $Sections -join "`n"

$Html = @"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>RAFTOP CPAP CARE Pro - Client Portal v1.0</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin:0; font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; color:#111827; }
.header { background:#0f172a; color:white; padding:36px 44px; }
.header h1 { margin:0; font-size:32px; }
.header p { color:#cbd5e1; max-width:1050px; line-height:1.55; }
.wrap { max-width:1150px; margin:0 auto; padding:28px; }
.notice { background:white; border-left:7px solid #0f172a; padding:18px 22px; border-radius:12px; margin-bottom:20px; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; margin-bottom:22px; }
.tile { background:white; border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
.tile strong { display:block; margin-bottom:6px; }
.card { background:white; border:1px solid #e5e7eb; border-radius:14px; padding:22px; margin:18px 0; page-break-inside:avoid; }
.card h2 { margin-top:0; font-size:21px; color:#0f172a; }
pre { white-space:pre-wrap; word-wrap:break-word; font-family: Consolas, monospace; font-size:13px; line-height:1.55; background:#f9fafb; padding:16px; border-radius:10px; border:1px solid #e5e7eb; }
.warning { background:#fff7ed; border-left:7px solid #ea580c; padding:18px 22px; border-radius:12px; margin:20px 0; }
.footer { color:#6b7280; font-size:12px; margin:26px 0; }
@media print {
  body { background:white; }
  .card, .notice, .warning, .tile { box-shadow:none; }
}
</style>
</head>
<body>
<div class="header">
<h1>RAFTOP CPAP CARE Pro - Client Portal v1.0</h1>
<p>Self-contained client handover portal for Raftopoulos. This file includes the start guide, onboarding, access instructions, data intake template, support/SLA boundaries, and resale launch material in one HTML file.</p>
</div>

<div class="wrap">
<div class="notice">
<strong>Open this file first.</strong><br>
This portal is self-contained. It does not depend on external Markdown links, so it can be opened directly by double-clicking <strong>index.html</strong> after extracting the ZIP.
</div>

<div class="warning">
<strong>Security boundary:</strong> this portal does not include credentials, source code, GitHub access, database credentials, Render secrets, GitHub secrets, .env files, or internal scripts. Credentials must be delivered separately through a controlled channel.
</div>

<div class="grid">
<div class="tile"><strong>1. Start</strong> Read the Start Here section.</div>
<div class="tile"><strong>2. Access</strong> Confirm users and credential channel.</div>
<div class="tile"><strong>3. Data</strong> Use the embedded CSV template.</div>
<div class="tile"><strong>4. Onboarding</strong> Book the 60-minute kickoff.</div>
<div class="tile"><strong>5. Support</strong> Respect SLA/change request boundaries.</div>
<div class="tile"><strong>6. Resale</strong> Use resale model only with boundaries.</div>
</div>

$SectionsHtml

<p class="footer">RAFTOP CPAP CARE Pro - Client Portal v1.0. This package supports operations, reporting, and follow-up prioritization. It is not a diagnostic medical device.</p>
</div>
</body>
</html>
"@

Set-Content -Path $HtmlPath -Value $Html -Encoding UTF8

if (Test-Path $HtmlPath) {
    Add-Result "Self-contained index.html created" "PASS" $HtmlPath
} else {
    Add-Result "Self-contained index.html created" "FAIL" $HtmlPath
}

$HtmlCheck = ReadSafe $HtmlPath

if ($HtmlCheck -match "href=") {
    Add-Result "No external href dependencies" "WARN" "HTML contains href attributes."
} else {
    Add-Result "No external href dependencies" "PASS" "No href attributes found."
}

if ($HtmlCheck -match "Client Portal v1.0") {
    Add-Result "HTML marker: title" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: title" "FAIL" "Marker missing."
}

if ($HtmlCheck -match "Credentials must be delivered separately") {
    Add-Result "HTML marker: credentials boundary" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: credentials boundary" "FAIL" "Marker missing."
}

if ($HtmlCheck -match "not a diagnostic medical device") {
    Add-Result "HTML marker: medical boundary" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: medical boundary" "FAIL" "Marker missing."
}

# PDF generation using Microsoft Edge
$EdgeCandidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$EdgeExe = $null
foreach ($Candidate in $EdgeCandidates) {
    if (Test-Path $Candidate) {
        $EdgeExe = $Candidate
        break
    }
}

if ($null -ne $EdgeExe) {
    $HtmlUri = (New-Object System.Uri($HtmlPath)).AbsoluteUri
    & $EdgeExe --headless --disable-gpu --print-to-pdf="$PdfPath" "$HtmlUri" | Out-Null

    if (Test-Path $PdfPath) {
        $PdfItem = Get-Item $PdfPath
        if ($PdfItem.Length -gt 1000) {
            Add-Result "PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
        } else {
            Add-Result "PDF generated" "WARN" "PDF exists but size is small."
        }
    } else {
        Add-Result "PDF generated" "WARN" "PDF was not created."
    }
} else {
    Add-Result "PDF generated" "WARN" "Microsoft Edge not found."
}

Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Add-Result "Self-contained portal ZIP created" "PASS" $ZipPath
} else {
    Add-Result "Self-contained portal ZIP created" "FAIL" $ZipPath
}

# Forbidden content check
$ForbiddenPatterns = @(
    "tools",
    "reports",
    "enterprise-backend",
    "enterprise-frontend",
    "node_modules",
    ".git",
    ".env",
    "RAFTOP_BACKUPS_ARCHIVE",
    "RAFTOP_EXTERNAL_BACKUPS"
)

$AllFiles = Get-ChildItem -Path $OutDir -Recurse -File | ForEach-Object {
    $_.FullName.Replace($OutDir, "")
}

foreach ($Pattern in $ForbiddenPatterns) {
    $Matches = $AllFiles | Where-Object { $_ -like ("*" + $Pattern + "*") }

    if ($Matches.Count -eq 0) {
        Add-Result ("Forbidden content absent: " + $Pattern) "PASS" "No matching paths."
    } else {
        Add-Result ("Forbidden content absent: " + $Pattern) "FAIL" ("Found: " + ($Matches -join "; "))
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE69_2_SELF_CONTAINED_CLIENT_PORTAL_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE69_2_SELF_CONTAINED_CLIENT_PORTAL_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE69_2_SELF_CONTAINED_CLIENT_PORTAL_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 69.2 Self-Contained Portal"
Write-Host "============================================================"
Write-Host ""
Write-Host "Portal folder:"
Write-Host $OutDir
Write-Host ""
Write-Host "Portal ZIP:"
Write-Host $ZipPath
Write-Host ""
Write-Host "Portal HTML:"
Write-Host $HtmlPath
Write-Host ""
Write-Host "Portal PDF:"
Write-Host $PdfPath
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