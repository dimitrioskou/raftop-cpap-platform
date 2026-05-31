# RAFTOP CPAP CARE Pro
# Phase 50.1 - Buyer Presentation Command Center v2
# ASCII-safe version.
# Safe: creates buyer presentation docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$PresentationDir = Join-Path $DocsRoot "buyer-presentation"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $PresentationDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase50_buyer_presentation_command_center_" + $Timestamp + ".md")

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

function Write-Doc {
    param(
        [string]$FileName,
        [string[]]$Lines
    )

    $Path = Join-Path $PresentationDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 50 Buyer Presentation Command Center" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 50.1 Buyer Presentation Command Center..."
Write-Host ""

Write-Doc "01_DEMO_DAY_RUNBOOK.md" @(
    "# RAFTOP CPAP CARE Pro - Demo Day Runbook",
    "",
    "Objective:",
    "",
    "The objective of the buyer presentation is not to show every screen.",
    "The objective is to prove that RAFTOP CPAP CARE Pro is a buyer-ready CPAP Operations Control Layer.",
    "",
    "Opening statement:",
    "",
    "This is not just an application. This is a CPAP Operations Control Layer for patient monitoring, follow-up prioritization, ATLAS actions, compliance visibility, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "Demo timing:",
    "",
    "0-5 min: Business problem",
    "5-10 min: Executive Demo Home",
    "10-18 min: Quality and Profit Excellence Center",
    "18-25 min: Pilot Demo Dashboard, ATLAS, compliance story",
    "25-30 min: Buyer-ready routes",
    "30-35 min: Delivery pack and release readiness",
    "35-40 min: Close and next step",
    "",
    "Non-negotiable rule:",
    "",
    "Do not open code, secrets, environment variables, database credentials, GitHub secrets, Render secrets, or raw logs during the buyer presentation."
)

Write-Doc "02_BUYER_ROUTES_AND_LINKS.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Routes and Links",
    "",
    "Production frontend:",
    "",
    "https://raftop-cpap-frontend.onrender.com",
    "",
    "Backend health:",
    "",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "Core buyer routes:",
    "",
    "/login",
    "/sales/raftopoulos/executive-demo-home",
    "/sales/raftopoulos/quality-profit",
    "/sales/raftopoulos/pilot-walkthrough-scenario",
    "/sales/raftopoulos/pilot-demo",
    "/settings",
    "/compliance",
    "/reports",
    "/doctor",
    "/clinic",
    "",
    "Release tag:",
    "",
    "raftop-buyer-ready-v1.0.0",
    "",
    "Verified gates:",
    "",
    "Phase 46: PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_READY",
    "Phase 47: PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY",
    "Phase 48: PHASE48_BUYER_DELIVERY_PACK_READY",
    "Phase 49: PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY"
)

Write-Doc "03_30_MINUTE_BUYER_SCRIPT.md" @(
    "# RAFTOP CPAP CARE Pro - 30 Minute Buyer Script",
    "",
    "1. Opening",
    "",
    "RAFTOP CPAP CARE Pro is designed as an operational control layer for CPAP patient management.",
    "It does not replace medical judgment. It organizes data, signals, follow-ups, actions, and reports.",
    "",
    "2. Problem",
    "",
    "In a large CPAP patient base, the problem is not only whether data exists.",
    "The real problem is who sees the important signals, who owns the next action, and what management can decide from the data.",
    "",
    "3. Product",
    "",
    "RAFTOP supports no-data visibility, compliance risk visibility, leak and therapy issue visibility, follow-ups, ATLAS actions, Quality and Profit reporting, and doctor or clinic expansion planning.",
    "",
    "4. Proof",
    "",
    "The project has passed full product completion audit, buyer-ready release candidate gate, buyer delivery pack, and final 100 percent product completion gate.",
    "",
    "5. Close",
    "",
    "The right next decision is whether to proceed with a paid pilot, an annual enterprise license discussion, or a structured technical review."
)

Write-Doc "04_OBJECTION_HANDLING.md" @(
    "# RAFTOP CPAP CARE Pro - Objection Handling",
    "",
    "Objection: We already have AirView.",
    "",
    "Answer: AirView shows data. RAFTOP organizes operational action around that data: ATLAS actions, follow-ups, management reports, and Quality and Profit visibility.",
    "",
    "Objection: We want our technical person to review it.",
    "",
    "Answer: Of course. The technical review should be structured around login, tenant context, routes, APIs, data import, and security boundaries.",
    "",
    "Objection: We want real patient data.",
    "",
    "Answer: That is possible only with written data scope, legal or DPA review, secure transfer, and defined users. For first evaluation, anonymized or pseudonymized data is safer.",
    "",
    "Objection: It is expensive.",
    "",
    "Answer: The price should be compared with the value of controlling a large CPAP patient base, prioritizing follow-ups, reducing blind spots, and creating a future doctor or clinic service line.",
    "",
    "Objection: We want a free trial.",
    "",
    "Answer: A free trial is not recommended. The right structure is a paid pilot with KPIs, because the goal is to measure operational value, not just click through screens."
)

Write-Doc "05_CLOSE_OPTIONS.md" @(
    "# RAFTOP CPAP CARE Pro - Close Options",
    "",
    "Option 1 - 30 Day Paid Pilot",
    "",
    "Price: 4900 EUR plus VAT",
    "Purpose: fast validation",
    "Scope: limited data, demo data, or CSV sample",
    "Deliverable: short pilot summary",
    "",
    "Option 2 - 90 Day Operational Pilot",
    "",
    "Price: 15000 EUR plus VAT",
    "Purpose: operational value measurement",
    "Scope: 500 to 1500 patients or agreed sample",
    "Deliverable: final pilot report",
    "",
    "Option 3 - Annual Enterprise License",
    "",
    "Price: 42000 EUR per year plus VAT",
    "Onboarding: 7500 EUR plus VAT",
    "Scope: up to 7000 CPAP patients",
    "Use: full enterprise operations layer",
    "",
    "Final close question:",
    "",
    "Based on what you saw, should we proceed with a paid pilot to measure value, or should we discuss annual enterprise license scope directly?"
)

Write-Doc "06_POST_DEMO_ACTIONS.md" @(
    "# RAFTOP CPAP CARE Pro - Post Demo Actions",
    "",
    "Same-day actions:",
    "",
    "Record who attended.",
    "Record strongest buying signal.",
    "Record objections.",
    "Record requested next step.",
    "Send follow-up summary.",
    "Propose next meeting date.",
    "",
    "If buyer is hot:",
    "",
    "Send written pilot or annual license proposal within 24 hours.",
    "",
    "If buyer wants technical review:",
    "",
    "Schedule technical review with fixed agenda: auth, tenant context, routes, APIs, data import, and security boundaries.",
    "",
    "If buyer says send something:",
    "",
    "Send short buyer summary, not the entire internal pack.",
    "",
    "If buyer delays:",
    "",
    "Ask what blocks the decision: cost, timing, data, technical review, internal approval, or scope."
)

Write-Host ""
Write-Host "Verifying buyer presentation command center..."
Write-Host ""

$RequiredDocs = @{
    "01_DEMO_DAY_RUNBOOK.md" = @("Demo Day Runbook", "Opening statement", "Non-negotiable rule")
    "02_BUYER_ROUTES_AND_LINKS.md" = @("Buyer Routes", "raftop-buyer-ready-v1.0.0", "Verified gates")
    "03_30_MINUTE_BUYER_SCRIPT.md" = @("30 Minute Buyer Script", "Problem", "Close")
    "04_OBJECTION_HANDLING.md" = @("Objection Handling", "AirView", "free trial")
    "05_CLOSE_OPTIONS.md" = @("Close Options", "90 Day Operational Pilot", "Annual Enterprise License")
    "06_POST_DEMO_ACTIONS.md" = @("Post Demo Actions", "Same-day actions", "technical review")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $PresentationDir $Doc

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
    $FinalStatus = "PHASE50_BUYER_PRESENTATION_COMMAND_CENTER_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE50_BUYER_PRESENTATION_COMMAND_CENTER_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE50_BUYER_PRESENTATION_COMMAND_CENTER_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 50 Buyer Presentation Command Center"
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