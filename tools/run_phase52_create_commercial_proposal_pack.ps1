# RAFTOP CPAP CARE Pro
# Phase 52 - Commercial Proposal Pack
# ASCII-safe version.
# Safe: creates commercial proposal docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsRoot "commercial-proposal"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $CommercialDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase52_commercial_proposal_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $CommercialDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 52 Commercial Proposal Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 52 Commercial Proposal Pack..."
Write-Host ""

Write-Doc "01_COMMERCIAL_SUMMARY.md" @(
    "# RAFTOP CPAP CARE Pro - Commercial Summary",
    "",
    "Positioning:",
    "",
    "RAFTOP CPAP CARE Pro is a CPAP Operations Control Layer for Raftopoulos.",
    "",
    "It supports patient monitoring, compliance visibility, no-data detection, leak and therapy issue visibility, ATLAS actions, follow-up prioritization, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "It is not positioned as a diagnostic medical device.",
    "",
    "Commercial objective:",
    "",
    "Help Raftopoulos control a large CPAP patient base, reduce operational blind spots, organize follow-ups, create management visibility, and build a future CPAP reporting service for doctors and clinics.",
    "",
    "Verified status:",
    "",
    "Product status: 100 percent buyer-ready.",
    "Presentation status: buyer presentation ready.",
    "Meeting execution status: ready.",
    "",
    "Release tags:",
    "",
    "raftop-buyer-ready-v1.0.0",
    "raftop-buyer-presentation-ready-v1.0.0",
    "raftop-buyer-meeting-ready-v1.0.0"
)

Write-Doc "02_30_DAY_PAID_PILOT_PROPOSAL.md" @(
    "# RAFTOP CPAP CARE Pro - 30 Day Paid Pilot Proposal",
    "",
    "Price:",
    "",
    "4900 EUR plus VAT",
    "",
    "Purpose:",
    "",
    "Fast validation of RAFTOP value using limited demo, anonymized, pseudonymized, or agreed sample data.",
    "",
    "Duration:",
    "",
    "30 days",
    "",
    "Includes:",
    "",
    "- buyer onboarding meeting",
    "- limited data or sample setup",
    "- protected access",
    "- CPAP signal review",
    "- no-data visibility",
    "- compliance risk visibility",
    "- leak issue visibility where data is available",
    "- ATLAS action demonstration",
    "- short pilot summary",
    "",
    "Does not include:",
    "",
    "- full production rollout",
    "- full historical migration",
    "- doctor portal rollout",
    "- mobile app",
    "- 24/7 support",
    "- custom integrations",
    "- real patient identifiers without data or legal framework",
    "",
    "Best for:",
    "",
    "Buyer wants low-risk validation before committing to operational pilot or annual license."
)

Write-Doc "03_90_DAY_OPERATIONAL_PILOT_PROPOSAL.md" @(
    "# RAFTOP CPAP CARE Pro - 90 Day Operational Pilot Proposal",
    "",
    "Price:",
    "",
    "15000 EUR plus VAT",
    "",
    "Purpose:",
    "",
    "Measure operational value with defined KPIs, data sample, ATLAS actions, weekly reviews, and final pilot report.",
    "",
    "Duration:",
    "",
    "90 days",
    "",
    "Recommended scope:",
    "",
    "500 to 1500 CPAP patients or agreed sample.",
    "",
    "Includes:",
    "",
    "- kickoff",
    "- user and role setup",
    "- data boundary confirmation",
    "- pilot KPI baseline",
    "- no-data monitoring",
    "- compliance risk monitoring",
    "- leak or therapy issue visibility where data exists",
    "- ATLAS action tracking",
    "- weekly review rhythm",
    "- midpoint review",
    "- final pilot report",
    "- annual license recommendation",
    "",
    "Payment structure:",
    "",
    "50 percent on acceptance.",
    "30 percent at midpoint.",
    "20 percent on final pilot report.",
    "",
    "Best for:",
    "",
    "Buyer wants evidence before annual rollout."
)

Write-Doc "04_ANNUAL_ENTERPRISE_LICENSE_PROPOSAL.md" @(
    "# RAFTOP CPAP CARE Pro - Annual Enterprise License Proposal",
    "",
    "Annual Enterprise License:",
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
    "Includes:",
    "",
    "- protected platform access",
    "- tenant-aware structure",
    "- patient, device and compliance visibility",
    "- no-data visibility",
    "- compliance risk visibility",
    "- leak and therapy issue visibility where data is available",
    "- ATLAS action system",
    "- follow-up workflow support",
    "- Quality and Profit reporting",
    "- monthly executive reporting framework",
    "- buyer delivery documentation",
    "- controlled support within agreed scope",
    "",
    "Does not automatically include:",
    "",
    "- full patient mobile app",
    "- full live AirView integration",
    "- doctor or clinic full production rollout",
    "- unlimited custom development",
    "- 24/7 support",
    "- use of real patient identifiers without DPA or legal framework",
    "",
    "Best for:",
    "",
    "Buyer wants RAFTOP as permanent CPAP Operations Control Layer."
)

Write-Doc "05_DOCTOR_CLINIC_EXPANSION_COMMERCIAL_MODEL.md" @(
    "# RAFTOP CPAP CARE Pro - Doctor and Clinic Expansion Model",
    "",
    "Purpose:",
    "",
    "Enable Raftopoulos to transform RAFTOP from internal operations layer into a doctor and clinic CPAP reporting service.",
    "",
    "Potential packages:",
    "",
    "Basic CPAP Report:",
    "490 EUR per doctor per year plus VAT.",
    "",
    "Doctor Dashboard:",
    "990 EUR per doctor per year plus VAT.",
    "",
    "Clinic Plan:",
    "1900 to 2900 EUR per clinic per year plus VAT.",
    "",
    "Commercial value:",
    "",
    "- recurring revenue",
    "- stronger doctor relationship",
    "- differentiation from competitors",
    "- CPAP patient retention",
    "- co-branded reporting service",
    "",
    "Important rule:",
    "",
    "Doctor and clinic expansion should follow internal Raftopoulos adoption. Do not launch doctor resale before internal workflow is stable."
)

Write-Doc "06_PROPOSAL_FOLLOWUP_EMAIL.md" @(
    "# RAFTOP CPAP CARE Pro - Proposal Follow-up Email",
    "",
    "Subject:",
    "",
    "RAFTOP CPAP CARE Pro - Proposal and next step",
    "",
    "Email:",
    "",
    "Good evening,",
    "",
    "Following our discussion, I am sending the proposed commercial paths for RAFTOP CPAP CARE Pro.",
    "",
    "There are three possible next steps:",
    "",
    "1. 30 Day Paid Pilot at 4900 EUR plus VAT for fast validation.",
    "2. 90 Day Operational Pilot at 15000 EUR plus VAT for KPI-based value measurement.",
    "3. Annual Enterprise License at 42000 EUR per year plus VAT plus 7500 EUR onboarding.",
    "",
    "My recommendation is the 90 Day Operational Pilot if you want measured evidence before annual rollout, or Annual Enterprise License if Raftopoulos wants to move directly to structured implementation.",
    "",
    "The next step is to confirm preferred path, scope, responsible owner, data contact, and kickoff date.",
    "",
    "Best regards,",
    "Dimitris"
)

Write-Doc "07_COMMERCIAL_SCOPE_CONFIRMATION.md" @(
    "# RAFTOP CPAP CARE Pro - Commercial Scope Confirmation",
    "",
    "Use this when the buyer is ready to proceed.",
    "",
    "Required confirmations:",
    "",
    "- chosen commercial path",
    "- price",
    "- payment structure",
    "- company billing details",
    "- responsible buyer owner",
    "- technical or data contact",
    "- data level: demo, anonymized, pseudonymized, or real data with legal framework",
    "- start date",
    "- review cadence",
    "- success criteria",
    "",
    "No-start rule:",
    "",
    "Do not start pilot or annual work without written acceptance, billing details, payment confirmation or agreed payment structure, named owner, data boundary, and kickoff date."
)

Write-Host ""
Write-Host "Verifying commercial proposal pack..."
Write-Host ""

$RequiredDocs = @{
    "01_COMMERCIAL_SUMMARY.md" = @("Commercial Summary", "Release tags", "100 percent buyer-ready")
    "02_30_DAY_PAID_PILOT_PROPOSAL.md" = @("30 Day Paid Pilot", "4900 EUR", "Does not include")
    "03_90_DAY_OPERATIONAL_PILOT_PROPOSAL.md" = @("90 Day Operational Pilot", "15000 EUR", "weekly reviews")
    "04_ANNUAL_ENTERPRISE_LICENSE_PROPOSAL.md" = @("Annual Enterprise License", "42000 EUR", "7500 EUR")
    "05_DOCTOR_CLINIC_EXPANSION_COMMERCIAL_MODEL.md" = @("Doctor and Clinic Expansion", "990 EUR", "recurring revenue")
    "06_PROPOSAL_FOLLOWUP_EMAIL.md" = @("Proposal Follow-up Email", "three possible next steps", "Dimitris")
    "07_COMMERCIAL_SCOPE_CONFIRMATION.md" = @("Commercial Scope Confirmation", "No-start rule", "kickoff date")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $CommercialDir $Doc

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
    $FinalStatus = "PHASE52_COMMERCIAL_PROPOSAL_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE52_COMMERCIAL_PROPOSAL_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE52_COMMERCIAL_PROPOSAL_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 52 Commercial Proposal Pack"
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