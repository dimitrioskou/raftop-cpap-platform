# RAFTOP CPAP CARE Pro
# Phase 69 - Client Portal HTML and PDF Pack
# ASCII-safe version.
# Safe: creates client-facing HTML/PDF portal package only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$SourcePackDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0"
$SourceZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0.zip"

$PortalDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_v1.0"
$AssetsDir = Join-Path $PortalDir "assets"
$PortalZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_v1.0.zip"
$HtmlPath = Join-Path $PortalDir "index.html"
$CssPath = Join-Path $AssetsDir "style.css"
$PdfPath = Join-Path $PortalDir "RAFTOP_CLIENT_START_PACK_v1.0.pdf"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryRoot -Force | Out-Null

if (Test-Path $PortalDir) {
    Remove-Item -Path $PortalDir -Recurse -Force
}

if (Test-Path $PortalZip) {
    Remove-Item -Path $PortalZip -Force
}

New-Item -ItemType Directory -Path $PortalDir -Force | Out-Null
New-Item -ItemType Directory -Path $AssetsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase69_client_portal_html_pdf_pack_" + $Timestamp + ".md")

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

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Write-TextFile {
    param([string]$Path, [string[]]$Lines)

    $Parent = Split-Path $Path -Parent
    New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 69 Client Portal HTML and PDF Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 69 Client Portal HTML and PDF Pack..."
Write-Host ""

# Source validation
if (Test-Path $SourcePackDir) {
    Add-Result "Source client pack folder exists" "PASS" $SourcePackDir
} else {
    Add-Result "Source client pack folder exists" "FAIL" $SourcePackDir
}

if (Test-Path $SourceZip) {
    Add-Result "Source client ZIP exists" "PASS" $SourceZip
} else {
    Add-Result "Source client ZIP exists" "FAIL" $SourceZip
}

# Copy client start pack material into portal
if (Test-Path $SourcePackDir) {
    Copy-Item -Path (Join-Path $SourcePackDir "02_CLIENT_START_PACK") -Destination (Join-Path $PortalDir "02_CLIENT_START_PACK") -Recurse -Force
    Copy-Item -Path (Join-Path $SourcePackDir "03_DELIVERY_MANIFEST.md") -Destination (Join-Path $PortalDir "03_DELIVERY_MANIFEST.md") -Force
    Copy-Item -Path (Join-Path $SourcePackDir "04_SECURITY_BOUNDARY.md") -Destination (Join-Path $PortalDir "04_SECURITY_BOUNDARY.md") -Force
    Copy-Item -Path (Join-Path $SourcePackDir "05_VERSION_LOCK.md") -Destination (Join-Path $PortalDir "05_VERSION_LOCK.md") -Force
}

# CSS
Write-TextFile $CssPath @(
    "body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f4f6f8; color: #1f2937; }",
    ".top { background: #0f172a; color: white; padding: 34px 42px; }",
    ".top h1 { margin: 0; font-size: 32px; }",
    ".top p { margin: 12px 0 0 0; font-size: 16px; color: #cbd5e1; max-width: 980px; }",
    ".wrap { max-width: 1180px; margin: 0 auto; padding: 30px; }",
    ".notice { background: white; border-left: 6px solid #0f172a; padding: 18px 22px; border-radius: 10px; box-shadow: 0 1px 6px rgba(15,23,42,0.08); margin-bottom: 22px; }",
    ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }",
    ".card { background: white; padding: 20px; border-radius: 14px; box-shadow: 0 1px 8px rgba(15,23,42,0.08); border: 1px solid #e5e7eb; }",
    ".card h2 { font-size: 18px; margin: 0 0 8px 0; color: #111827; }",
    ".card p { font-size: 14px; line-height: 1.55; color: #4b5563; }",
    ".card a { display: inline-block; margin-top: 8px; color: #0f172a; font-weight: bold; text-decoration: none; border-bottom: 1px solid #0f172a; }",
    ".section { margin-top: 30px; }",
    ".section h2 { font-size: 22px; margin-bottom: 12px; }",
    "table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 8px rgba(15,23,42,0.08); }",
    "td, th { padding: 12px 14px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 14px; }",
    "th { background: #e5e7eb; color: #111827; }",
    ".danger { background: #fff7ed; border-left: 6px solid #ea580c; padding: 18px 22px; border-radius: 10px; margin-top: 22px; }",
    ".footer { color: #6b7280; font-size: 12px; margin-top: 32px; }",
    "@media print { body { background: white; } .card, .notice, table, .danger { box-shadow: none; } .top { padding: 24px 30px; } }"
)

# HTML portal
Write-TextFile $HtmlPath @(
    "<!doctype html>",
    "<html lang='en'>",
    "<head>",
    "  <meta charset='utf-8'>",
    "  <meta name='viewport' content='width=device-width, initial-scale=1'>",
    "  <title>RAFTOP CPAP CARE Pro - Client Start Portal v1.0</title>",
    "  <link rel='stylesheet' href='assets/style.css'>",
    "</head>",
    "<body>",
    "  <header class='top'>",
    "    <h1>RAFTOP CPAP CARE Pro - Client Start Portal v1.0</h1>",
    "    <p>Client-facing handover portal for controlled use, onboarding, data intake, support boundaries, and resale launch planning.</p>",
    "  </header>",
    "  <main class='wrap'>",
    "    <div class='notice'>",
    "      <strong>Start here:</strong> This portal is the readable version of RAFTOP_CLIENT_START_PACK_v1.0. It does not contain credentials, source code, GitHub access, database credentials, secrets, internal scripts, or developer-only logs.",
    "    </div>",
    "    <div class='grid'>",
    "      <div class='card'>",
    "        <h2>1. Start Here</h2>",
    "        <p>Initial orientation for what Raftopoulos receives, what the platform does, what it does not do, and the first operational workflow.</p>",
    "        <a href='02_CLIENT_START_PACK/01_START_HERE_RAFTOP_CPAP_CARE_PRO.md'>Open Start Here</a>",
    "      </div>",
    "      <div class='card'>",
    "        <h2>2. Production Access</h2>",
    "        <p>How to start controlled platform access, activate the buyer tenant, set users, and test first login.</p>",
    "        <a href='02_CLIENT_START_PACK/production-access-tenant-activation/01_PRODUCTION_ACCESS_OVERVIEW.md'>Open Access Guide</a>",
    "      </div>",
    "      <div class='card'>",
    "        <h2>3. Data Intake</h2>",
    "        <p>CSV template, data dictionary, sample rows, validation checklist, and privacy/identifier rules.</p>",
    "        <a href='02_CLIENT_START_PACK/data-intake-csv-template/02_RAFTOP_CPAP_DATA_TEMPLATE.csv'>Open CSV Template</a>",
    "      </div>",
    "      <div class='card'>",
    "        <h2>4. Onboarding Runbook</h2>",
    "        <p>Kickoff, first week execution, first month operating rhythm, ATLAS routine, management review, and blocker escalation.</p>",
    "        <a href='02_CLIENT_START_PACK/buyer-onboarding-runbook/01_BUYER_ONBOARDING_RUNBOOK.md'>Open Runbook</a>",
    "      </div>",
    "      <div class='card'>",
    "        <h2>5. Support / SLA / Change Requests</h2>",
    "        <p>Defines support scope, incident severity, bug versus change request, out-of-scope items, and support request format.</p>",
    "        <a href='02_CLIENT_START_PACK/support-sla-change-requests/01_SUPPORT_SCOPE_OVERVIEW.md'>Open Support Scope</a>",
    "      </div>",
    "      <div class='card'>",
    "        <h2>6. Resale Launch Kit</h2>",
    "        <p>Doctor/clinic packages, sales talk track, onboarding flow, tenant provisioning, reseller support, and resale boundaries.</p>",
    "        <a href='02_CLIENT_START_PACK/resale-launch-kit/01_RESALE_LAUNCH_OVERVIEW.md'>Open Resale Kit</a>",
    "      </div>",
    "    </div>",
    "    <section class='section'>",
    "      <h2>Operational start sequence</h2>",
    "      <table>",
    "        <tr><th>Step</th><th>Action</th><th>Output</th></tr>",
    "        <tr><td>1</td><td>Open this portal and read Start Here</td><td>Shared understanding</td></tr>",
    "        <tr><td>2</td><td>Confirm receipt of delivery pack</td><td>Receipt confirmation</td></tr>",
    "        <tr><td>3</td><td>Confirm named users</td><td>Buyer admin, operations user, management viewer, technical/data contact</td></tr>",
    "        <tr><td>4</td><td>Confirm credential delivery channel</td><td>Credentials delivered separately</td></tr>",
    "        <tr><td>5</td><td>Book 60 minute kickoff</td><td>Kickoff scheduled</td></tr>",
    "        <tr><td>6</td><td>Prepare first data sample</td><td>CSV/data preview ready</td></tr>",
    "        <tr><td>7</td><td>Book first operational review</td><td>Review 3 to 7 days after kickoff</td></tr>",
    "      </table>",
    "    </section>",
    "    <div class='danger'>",
    "      <strong>Security boundary:</strong> Credentials must be delivered separately. Do not send passwords, secrets, database URLs, Render settings, GitHub secrets, or uncontrolled patient identifiers through unsecured channels.",
    "    </div>",
    "    <section class='section'>",
    "      <h2>Delivery files</h2>",
    "      <table>",
    "        <tr><th>File</th><th>Purpose</th></tr>",
    "        <tr><td><a href='03_DELIVERY_MANIFEST.md'>03_DELIVERY_MANIFEST.md</a></td><td>What is included and excluded from delivery</td></tr>",
    "        <tr><td><a href='04_SECURITY_BOUNDARY.md'>04_SECURITY_BOUNDARY.md</a></td><td>Security and credential separation rules</td></tr>",
    "        <tr><td><a href='05_VERSION_LOCK.md'>05_VERSION_LOCK.md</a></td><td>Version lock and readiness chain</td></tr>",
    "      </table>",
    "    </section>",
    "    <p class='footer'>RAFTOP CPAP CARE Pro - Client Start Portal v1.0. This package supports operations, reporting, and follow-up prioritization. It is not a diagnostic medical device.</p>",
    "  </main>",
    "</body>",
    "</html>"
)

# Generate PDF using Microsoft Edge if available
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
        Add-Result "PDF generated" "PASS" $PdfPath
    } else {
        Add-Result "PDF generated" "WARN" "Edge was found but PDF was not created."
    }
} else {
    Add-Result "PDF generated" "WARN" "Microsoft Edge not found. HTML portal still created. User can print index.html to PDF manually."
}

# Create portal ZIP
Compress-Archive -Path (Join-Path $PortalDir "*") -DestinationPath $PortalZip -Force

Write-Host ""
Write-Host "Verifying client portal HTML and PDF pack..."
Write-Host ""

Test-PathExists "Portal folder exists" $PortalDir
Test-PathExists "Portal index.html exists" $HtmlPath
Test-PathExists "Portal CSS exists" $CssPath
Test-PathExists "Portal ZIP exists" $PortalZip

$RequiredFiles = @(
    "index.html",
    "assets\style.css",
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
    Test-PathExists ("Portal file exists: " + $File) (Join-Path $PortalDir $File)
}

$HtmlContent = Read-FileSafe $HtmlPath

if (ContainsText $HtmlContent "Client Start Portal v1.0") {
    Add-Result "HTML marker: portal title" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: portal title" "FAIL" "Marker missing."
}

if (ContainsText $HtmlContent "Credentials must be delivered separately") {
    Add-Result "HTML marker: credential separation" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: credential separation" "FAIL" "Marker missing."
}

if (ContainsText $HtmlContent "not a diagnostic medical device") {
    Add-Result "HTML marker: medical boundary" "PASS" "Marker found."
} else {
    Add-Result "HTML marker: medical boundary" "FAIL" "Marker missing."
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

$AllPortalFiles = Get-ChildItem -Path $PortalDir -Recurse -File | ForEach-Object {
    $_.FullName.Replace($PortalDir, "")
}

foreach ($Pattern in $ForbiddenPatterns) {
    $Matches = $AllPortalFiles | Where-Object {
        $_ -like ("*" + $Pattern + "*")
    }

    if ($Matches.Count -eq 0) {
        Add-Result ("Forbidden portal content absent: " + $Pattern) "PASS" "No matching file paths."
    } else {
        Add-Result ("Forbidden portal content absent: " + $Pattern) "FAIL" ("Found forbidden path(s): " + ($Matches -join "; "))
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE69_CLIENT_PORTAL_HTML_PDF_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE69_CLIENT_PORTAL_HTML_PDF_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE69_CLIENT_PORTAL_HTML_PDF_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 69 Client Portal HTML and PDF Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Portal folder:"
Write-Host $PortalDir
Write-Host ""
Write-Host "Portal ZIP:"
Write-Host $PortalZip
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