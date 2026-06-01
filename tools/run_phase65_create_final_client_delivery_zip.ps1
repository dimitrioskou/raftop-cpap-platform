# RAFTOP CPAP CARE Pro
# Phase 65 - Final Client Delivery ZIP
# ASCII-safe version.
# Safe: creates client-facing ZIP only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientStartDir = Join-Path $DocsRoot "client-start-pack"
$ExecutiveDir = Join-Path $DocsRoot "executive-one-page"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$BuildDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_START_PACK_v1.0.zip"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryRoot -Force | Out-Null

if (Test-Path $BuildDir) {
    Remove-Item -Path $BuildDir -Recurse -Force
}

if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
}

New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase65_final_client_delivery_zip_" + $Timestamp + ".md")

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

function Write-Doc {
    param([string]$RelativePath, [string[]]$Lines)

    $Path = Join-Path $BuildDir $RelativePath
    $Parent = Split-Path $Path -Parent
    New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $RelativePath"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 65 Final Client Delivery ZIP" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 65 Final Client Delivery ZIP..."
Write-Host ""

Write-Doc "00_START_HERE.md" @(
    "# RAFTOP CPAP CARE Pro - Final Client Delivery Start Here",
    "",
    "This package is the client-facing start pack for Raftopoulos.",
    "",
    "Package name:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Purpose:",
    "",
    "Help Raftopoulos start controlled use of RAFTOP CPAP CARE Pro after purchase, pilot acceptance, or annual license activation.",
    "",
    "What is included:",
    "",
    "- executive summary",
    "- platform access guidance",
    "- tenant activation guidance",
    "- first 7 days onboarding plan",
    "- daily CPAP operations workflow",
    "- ATLAS actions guide",
    "- data intake and CSV template",
    "- buyer onboarding runbook",
    "- support/SLA/change request boundary",
    "- resale launch kit",
    "",
    "What is not included:",
    "",
    "- source code",
    "- GitHub repository access",
    "- internal scripts",
    "- reports",
    "- secrets",
    "- credentials",
    "- environment variables",
    "- database URLs",
    "- Render settings",
    "- raw logs",
    "",
    "First file to read:",
    "",
    "00_START_HERE.md",
    "",
    "First folder to open:",
    "",
    "02_CLIENT_START_PACK",
    "",
    "Important:",
    "",
    "Credentials must be delivered separately through a controlled channel."
)

$ExecSummarySource = Join-Path $ExecutiveDir "01_EXECUTIVE_ONE_PAGE_SUMMARY.md"
$ExecSummaryDest = Join-Path $BuildDir "01_EXECUTIVE_SUMMARY.md"

if (Test-Path $ExecSummarySource) {
    Copy-Item -Path $ExecSummarySource -Destination $ExecSummaryDest -Force
} else {
    Write-Doc "01_EXECUTIVE_SUMMARY.md" @(
        "# RAFTOP CPAP CARE Pro - Executive Summary",
        "",
        "RAFTOP CPAP CARE Pro is a CPAP Operations Control Layer for Raftopoulos.",
        "",
        "It supports patient monitoring, no-data visibility, compliance risk visibility, ATLAS actions, follow-up discipline, management reporting, and controlled resale/scale planning."
    )
}

$ClientPackDest = Join-Path $BuildDir "02_CLIENT_START_PACK"

if (Test-Path $ClientStartDir) {
    Copy-Item -Path $ClientStartDir -Destination $ClientPackDest -Recurse -Force
} else {
    Add-Result "Client start pack source exists" "FAIL" "Missing docs/client-start-pack."
}

Write-Doc "03_DELIVERY_MANIFEST.md" @(
    "# RAFTOP CPAP CARE Pro - Delivery Manifest",
    "",
    "Delivery package:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Included folders:",
    "",
    "00_START_HERE.md",
    "01_EXECUTIVE_SUMMARY.md",
    "02_CLIENT_START_PACK/",
    "03_DELIVERY_MANIFEST.md",
    "04_SECURITY_BOUNDARY.md",
    "05_VERSION_LOCK.md",
    "",
    "Client start pack contains:",
    "",
    "- client start documents",
    "- production access and tenant activation pack",
    "- data intake and CSV template pack",
    "- buyer onboarding runbook pack",
    "- support/SLA/change request pack",
    "- resale launch kit",
    "",
    "Excluded materials:",
    "",
    "- tools/",
    "- reports/",
    "- enterprise-backend/",
    "- enterprise-frontend/",
    "- node_modules/",
    "- .git/",
    "- .env files",
    "- secrets",
    "- raw logs",
    "- backup folders",
    "",
    "Delivery rule:",
    "",
    "This ZIP is safe for client-facing handover. It is not a source-code handover."
)

Write-Doc "04_SECURITY_BOUNDARY.md" @(
    "# RAFTOP CPAP CARE Pro - Security Boundary",
    "",
    "This package must not contain credentials, tokens, secrets, database URLs, source code, internal scripts, or developer-only logs.",
    "",
    "Credential delivery:",
    "",
    "Credentials must be delivered separately through a controlled channel.",
    "",
    "Do not send:",
    "",
    "- passwords in group chats",
    "- admin credentials in public email threads",
    "- database URLs",
    "- Render secrets",
    "- GitHub secrets",
    "- raw tokens",
    "- patient identifiers through uncontrolled channels",
    "",
    "Production access:",
    "",
    "Production access is controlled platform access, not source code handover.",
    "",
    "Data rule:",
    "",
    "Use demo, anonymized, or pseudonymized data unless real patient data has legal/data protection approval.",
    "",
    "Boundary:",
    "",
    "RAFTOP supports operations, reporting, and follow-up prioritization. It is not a diagnostic medical device."
)

Write-Doc "05_VERSION_LOCK.md" @(
    "# RAFTOP CPAP CARE Pro - Version Lock",
    "",
    "Delivery version:",
    "",
    "v1.0",
    "",
    "Package:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Readiness chain:",
    "",
    "PHASE59_FINAL_CLIENT_START_PACK_READINESS_READY",
    "PHASE60_FINAL_PRODUCTION_ACCESS_TENANT_ACTIVATION_READINESS_READY",
    "PHASE61_FINAL_DATA_INTAKE_CSV_TEMPLATE_READINESS_READY",
    "PHASE62_FINAL_BUYER_ONBOARDING_RUNBOOK_READINESS_READY",
    "PHASE63_FINAL_SUPPORT_SLA_CHANGE_REQUEST_READINESS_READY",
    "PHASE64_FINAL_RESALE_LAUNCH_KIT_READINESS_READY",
    "",
    "Version rule:",
    "",
    "Anything added after this client delivery package is a new version or change request, not part of the v1.0 client start pack."
)

Write-Host ""
Write-Host "Creating ZIP..."
Write-Host ""

Compress-Archive -Path (Join-Path $BuildDir "*") -DestinationPath $ZipPath -Force

Write-Host ""
Write-Host "Verifying final client delivery ZIP..."
Write-Host ""

if (Test-Path $ZipPath) {
    Add-Result "Final ZIP exists" "PASS" $ZipPath
} else {
    Add-Result "Final ZIP exists" "FAIL" "ZIP was not created."
}

$RequiredFiles = @(
    "00_START_HERE.md",
    "01_EXECUTIVE_SUMMARY.md",
    "02_CLIENT_START_PACK\01_START_HERE_RAFTOP_CPAP_CARE_PRO.md",
    "02_CLIENT_START_PACK\production-access-tenant-activation\01_PRODUCTION_ACCESS_OVERVIEW.md",
    "02_CLIENT_START_PACK\data-intake-csv-template\02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
    "02_CLIENT_START_PACK\buyer-onboarding-runbook\01_BUYER_ONBOARDING_RUNBOOK.md",
    "02_CLIENT_START_PACK\support-sla-change-requests\01_SUPPORT_SCOPE_OVERVIEW.md",
    "02_CLIENT_START_PACK\resale-launch-kit\01_RESALE_LAUNCH_OVERVIEW.md",
    "03_DELIVERY_MANIFEST.md",
    "04_SECURITY_BOUNDARY.md",
    "05_VERSION_LOCK.md"
)

foreach ($File in $RequiredFiles) {
    $Path = Join-Path $BuildDir $File
    if (Test-Path $Path) {
        Add-Result ("Delivery file exists: " + $File) "PASS" "Found."
    } else {
        Add-Result ("Delivery file exists: " + $File) "FAIL" "Missing."
    }
}

$ForbiddenPatterns = @(
    "tools",
    "reports",
    "enterprise-backend",
    "enterprise-frontend",
    "node_modules",
    ".git",
    ".env",
    "RAFTOP_BACKUPS_ARCHIVE"
)

$AllFiles = Get-ChildItem -Path $BuildDir -Recurse -File | ForEach-Object {
    $_.FullName.Replace($BuildDir, "")
}

foreach ($Pattern in $ForbiddenPatterns) {
    $Matches = $AllFiles | Where-Object {
        $_ -like ("*" + $Pattern + "*")
    }

    if ($Matches.Count -eq 0) {
        Add-Result ("Forbidden content absent: " + $Pattern) "PASS" "No matching file paths."
    } else {
        Add-Result ("Forbidden content absent: " + $Pattern) "FAIL" ("Found forbidden path(s): " + ($Matches -join "; "))
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE65_FINAL_CLIENT_DELIVERY_ZIP_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE65_FINAL_CLIENT_DELIVERY_ZIP_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE65_FINAL_CLIENT_DELIVERY_ZIP_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 65 Final Client Delivery ZIP"
Write-Host "============================================================"
Write-Host ""
Write-Host "ZIP created:"
Write-Host $ZipPath
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