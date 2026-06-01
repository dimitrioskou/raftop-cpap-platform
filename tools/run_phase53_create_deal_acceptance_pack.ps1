# RAFTOP CPAP CARE Pro
# Phase 53 - Deal Acceptance, Invoice and Start Authorization Pack
# ASCII-safe version.
# Safe: creates commercial acceptance docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsRoot "commercial-proposal"
$DealDir = Join-Path $CommercialDir "deal-acceptance"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $CommercialDir -Force | Out-Null
New-Item -ItemType Directory -Path $DealDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase53_deal_acceptance_pack_" + $Timestamp + ".md")

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
    param([string]$FileName, [string[]]$Lines)

    $Path = Join-Path $DealDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 53 Deal Acceptance Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 53 Deal Acceptance Pack..."
Write-Host ""

Write-Doc "01_DEAL_ACCEPTANCE_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Deal Acceptance Checklist",
    "",
    "Purpose:",
    "",
    "Use this before starting any paid pilot, annual license, technical setup, data import, or onboarding work.",
    "",
    "Required before start:",
    "",
    "- commercial path selected",
    "- written acceptance received",
    "- price confirmed",
    "- payment structure confirmed",
    "- billing details received",
    "- buyer sponsor named",
    "- operations owner named",
    "- technical or data contact named",
    "- data boundary confirmed",
    "- kickoff date confirmed",
    "- start authorization confirmed",
    "",
    "Commercial paths:",
    "",
    "1. 30 Day Paid Pilot: 4900 EUR plus VAT.",
    "2. 90 Day Operational Pilot: 15000 EUR plus VAT.",
    "3. Annual Enterprise License: 42000 EUR per year plus VAT plus 7500 EUR onboarding.",
    "",
    "No-start rule:",
    "",
    "If any required item is missing, do not start delivery work."
)

Write-Doc "02_BILLING_DETAILS_REQUEST.md" @(
    "# RAFTOP CPAP CARE Pro - Billing Details Request",
    "",
    "Use this when buyer says yes.",
    "",
    "Required billing details:",
    "",
    "- company legal name",
    "- VAT number",
    "- tax office if applicable",
    "- billing address",
    "- billing email",
    "- payment contact",
    "- purchase order if required",
    "- selected commercial path",
    "- agreed price",
    "- payment structure",
    "",
    "Message:",
    "",
    "To proceed with RAFTOP CPAP CARE Pro, please send the billing details and confirm the selected commercial path.",
    "",
    "Once billing and payment structure are confirmed, we can schedule kickoff and start only within the agreed scope."
)

Write-Doc "03_30_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" @(
    "# RAFTOP CPAP CARE Pro - 30 Day Paid Pilot Acceptance Template",
    "",
    "Commercial path:",
    "",
    "30 Day Paid Pilot",
    "",
    "Price:",
    "",
    "4900 EUR plus VAT",
    "",
    "Duration:",
    "",
    "30 days",
    "",
    "Acceptance text:",
    "",
    "We confirm acceptance of the RAFTOP CPAP CARE Pro 30 Day Paid Pilot at 4900 EUR plus VAT, subject to agreed scope, billing details, payment confirmation, data boundary, and kickoff date.",
    "",
    "Required before start:",
    "",
    "- billing details",
    "- payment confirmation",
    "- buyer owner",
    "- data contact",
    "- data level",
    "- kickoff date"
)

Write-Doc "04_90_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" @(
    "# RAFTOP CPAP CARE Pro - 90 Day Operational Pilot Acceptance Template",
    "",
    "Commercial path:",
    "",
    "90 Day Operational Pilot",
    "",
    "Price:",
    "",
    "15000 EUR plus VAT",
    "",
    "Payment structure:",
    "",
    "50 percent on acceptance.",
    "30 percent at midpoint.",
    "20 percent on final pilot report.",
    "",
    "Duration:",
    "",
    "90 days",
    "",
    "Acceptance text:",
    "",
    "We confirm acceptance of the RAFTOP CPAP CARE Pro 90 Day Operational Pilot at 15000 EUR plus VAT, with 50 percent on acceptance, 30 percent at midpoint, and 20 percent on final pilot report, subject to agreed scope, data boundary, buyer owner, data contact, and kickoff date.",
    "",
    "Required before start:",
    "",
    "- billing details",
    "- first payment confirmation or written payment structure",
    "- buyer sponsor",
    "- operations owner",
    "- technical or data contact",
    "- pilot data level",
    "- kickoff date"
)

Write-Doc "05_ANNUAL_LICENSE_ACCEPTANCE_TEMPLATE.md" @(
    "# RAFTOP CPAP CARE Pro - Annual Enterprise License Acceptance Template",
    "",
    "Commercial path:",
    "",
    "Annual Enterprise License",
    "",
    "License price:",
    "",
    "42000 EUR per year plus VAT",
    "",
    "Onboarding:",
    "",
    "7500 EUR plus VAT",
    "",
    "Recommended scope:",
    "",
    "Up to 7000 CPAP patients.",
    "",
    "Acceptance text:",
    "",
    "We confirm acceptance of the RAFTOP CPAP CARE Pro Annual Enterprise License at 42000 EUR per year plus VAT, plus 7500 EUR plus VAT onboarding, subject to agreed scope, payment structure, buyer owner, technical or data contact, data boundary, onboarding plan, and kickoff date.",
    "",
    "Required before start:",
    "",
    "- billing details",
    "- payment structure",
    "- buyer sponsor",
    "- operations owner",
    "- technical or data contact",
    "- data boundary",
    "- onboarding date",
    "- support boundary"
)

Write-Doc "06_START_AUTHORIZATION.md" @(
    "# RAFTOP CPAP CARE Pro - Start Authorization",
    "",
    "Use this after commercial acceptance and before starting work.",
    "",
    "Start authorization fields:",
    "",
    "- commercial path:",
    "- start date:",
    "- end date if pilot:",
    "- buyer sponsor:",
    "- operations owner:",
    "- technical or data contact:",
    "- data level:",
    "- first review date:",
    "- success criteria:",
    "- allowed scope:",
    "- excluded scope:",
    "",
    "Start authorization text:",
    "",
    "RAFTOP CPAP CARE Pro delivery is authorized to start under the agreed commercial path, agreed data boundary, named owners, and confirmed scope. Any additional feature, module, integration, doctor rollout, real patient identifier use, or custom development requires separate written approval.",
    "",
    "Rule:",
    "",
    "No start authorization means no operational start."
)

Write-Doc "07_NO_START_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - No Start Rules",
    "",
    "Do not start if:",
    "",
    "- there is no written acceptance",
    "- billing details are missing",
    "- payment or payment structure is not confirmed",
    "- no buyer owner is named",
    "- no technical or data contact is named",
    "- data boundary is unclear",
    "- real patient data is requested without legal or DPA framework",
    "- kickoff date is missing",
    "- scope is not defined",
    "- buyer requests open-ended custom work",
    "",
    "Response if buyer says start and we will arrange later:",
    "",
    "We can start immediately after written acceptance, billing details, payment structure, named owner, data boundary, and kickoff date are confirmed. This protects both sides and keeps the rollout controlled.",
    "",
    "Rule:",
    "",
    "A serious buyer can confirm scope. An unclear buyer creates uncontrolled work."
)

Write-Host ""
Write-Host "Verifying deal acceptance pack..."
Write-Host ""

$RequiredDocs = @{
    "01_DEAL_ACCEPTANCE_CHECKLIST.md" = @("Deal Acceptance Checklist", "No-start rule", "commercial path selected")
    "02_BILLING_DETAILS_REQUEST.md" = @("Billing Details Request", "billing email", "payment structure")
    "03_30_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" = @("30 Day Paid Pilot", "4900 EUR", "Acceptance text")
    "04_90_DAY_PILOT_ACCEPTANCE_TEMPLATE.md" = @("90 Day Operational Pilot", "15000 EUR", "50 percent")
    "05_ANNUAL_LICENSE_ACCEPTANCE_TEMPLATE.md" = @("Annual Enterprise License", "42000 EUR", "7500 EUR")
    "06_START_AUTHORIZATION.md" = @("Start Authorization", "allowed scope", "No start authorization")
    "07_NO_START_RULES.md" = @("No Start Rules", "written acceptance", "controlled work")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $DealDir $Doc

    if (Test-Path $Path) {
        Add-Result ("Document exists: " + $Doc) "PASS" "Document exists."
        $Content = Get-Content -Path $Path -Raw

        foreach ($Marker in $RequiredDocs[$Doc]) {
            if ($Content.IndexOf($Marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                Add-Result ("Marker in " + $Doc + ": " + $Marker) "PASS" "Marker found."
            } else {
                Add-Result ("Marker in " + $Doc + ": " + $Marker) "FAIL" "Marker missing."
            }
        }
    } else {
        Add-Result ("Document exists: " + $Doc) "FAIL" "Document missing."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE53_DEAL_ACCEPTANCE_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE53_DEAL_ACCEPTANCE_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE53_DEAL_ACCEPTANCE_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 53 Deal Acceptance Pack"
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