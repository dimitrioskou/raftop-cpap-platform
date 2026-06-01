# RAFTOP CPAP CARE Pro
# Phase 57 - Executive One Page Summary Pack
# ASCII-safe version.
# Safe: creates executive summary docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ExecutiveDir = Join-Path $DocsRoot "executive-one-page"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ExecutiveDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase57_executive_one_page_pack_" + $Timestamp + ".md")

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

function Write-Doc {
    param([string]$FileName, [string[]]$Lines)

    $Path = Join-Path $ExecutiveDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 57 Executive One Page Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 57 Executive One Page Pack..."
Write-Host ""

Write-Doc "01_EXECUTIVE_ONE_PAGE_SUMMARY.md" @(
    "# RAFTOP CPAP CARE Pro - Executive One Page Summary",
    "",
    "What it is:",
    "",
    "RAFTOP CPAP CARE Pro is a buyer-ready CPAP Operations Control Layer for Raftopoulos.",
    "",
    "It supports patient monitoring, compliance visibility, no-data detection, leak and therapy issue visibility, ATLAS actions, follow-up prioritization, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "What it is not:",
    "",
    "It is not positioned as a diagnostic medical device.",
    "It does not replace medical judgment.",
    "",
    "What Raftopoulos buys:",
    "",
    "- CPAP operations platform",
    "- buyer-ready release",
    "- presentation-ready package",
    "- commercial proposal pack",
    "- deal acceptance pack",
    "- onboarding execution pack",
    "- resale and scale delivery pack",
    "",
    "Commercial paths:",
    "",
    "1. 30 Day Paid Pilot: 4900 EUR plus VAT.",
    "2. 90 Day Operational Pilot: 15000 EUR plus VAT.",
    "3. Annual Enterprise License: 42000 EUR per year plus VAT plus 7500 EUR onboarding.",
    "",
    "Best recommended next step:",
    "",
    "90 Day Operational Pilot.",
    "",
    "Reason:",
    "",
    "It measures operational value before annual rollout and creates clear evidence for management decision.",
    "",
    "Final close question:",
    "",
    "Should Raftopoulos proceed with a paid pilot to measure value, or discuss annual enterprise license scope directly?"
)

Write-Doc "02_EXECUTIVE_TALK_TRACK.md" @(
    "# RAFTOP CPAP CARE Pro - Executive Talk Track",
    "",
    "Opening:",
    "",
    "This is not just a software demo. RAFTOP CPAP CARE Pro is a CPAP Operations Control Layer built to help Raftopoulos control patient monitoring, follow-ups, ATLAS actions, compliance visibility, reporting, and future doctor or clinic expansion.",
    "",
    "Core problem:",
    "",
    "With a large CPAP patient base, the problem is not only data access. The problem is operational control: who needs attention, who owns the next action, and what management can decide.",
    "",
    "Core value:",
    "",
    "RAFTOP turns CPAP signals into structured actions and management visibility.",
    "",
    "Business value:",
    "",
    "- better follow-up discipline",
    "- fewer blind spots",
    "- clearer compliance risk visibility",
    "- action ownership",
    "- executive reporting",
    "- future resale path to doctors and clinics",
    "",
    "Recommended close:",
    "",
    "The safest commercial next step is a 90 Day Operational Pilot with KPIs, data sample, weekly reviews, and final pilot report."
)

Write-Doc "03_EXECUTIVE_DECISION_PATH.md" @(
    "# RAFTOP CPAP CARE Pro - Executive Decision Path",
    "",
    "Decision option 1:",
    "",
    "30 Day Paid Pilot.",
    "Use when buyer wants fast validation with limited sample.",
    "",
    "Decision option 2:",
    "",
    "90 Day Operational Pilot.",
    "Use when buyer wants measured evidence before annual rollout.",
    "",
    "Decision option 3:",
    "",
    "Annual Enterprise License.",
    "Use when buyer wants direct structured implementation.",
    "",
    "Avoid:",
    "",
    "- free trial",
    "- undefined technical review",
    "- open-ended custom development",
    "- starting without written acceptance",
    "- sending full internal docs before commitment",
    "",
    "Preferred decision:",
    "",
    "90 Day Operational Pilot."
)

Write-Doc "04_FINAL_STATUS_STATEMENT.md" @(
    "# RAFTOP CPAP CARE Pro - Final Status Statement",
    "",
    "Final readiness status:",
    "",
    "Product: READY",
    "Presentation: READY",
    "Meeting execution: READY",
    "Commercial proposal: READY",
    "Deal acceptance: READY",
    "Onboarding execution: READY",
    "Resale and scale: READY",
    "",
    "Final gates:",
    "",
    "PHASE49_FINAL_100_PERCENT_PRODUCT_COMPLETION_READY",
    "PHASE50_FINAL_BUYER_PRESENTATION_READINESS_READY",
    "PHASE51_FINAL_BUYER_MEETING_EXECUTION_READINESS_READY",
    "PHASE52_FINAL_COMMERCIAL_PROPOSAL_READINESS_READY",
    "PHASE53_FINAL_DEAL_ACCEPTANCE_READINESS_READY",
    "PHASE54_FINAL_ONBOARDING_EXECUTION_READINESS_READY",
    "PHASE55_FINAL_MASTER_COMMERCIAL_DELIVERY_READY",
    "PHASE56_FINAL_RESALE_SCALE_READINESS_READY",
    "",
    "Final statement:",
    "",
    "RAFTOP CPAP CARE Pro is ready for buyer presentation, commercial discussion, paid pilot, annual license negotiation, onboarding, and controlled resale/scale planning."
)

Write-Host ""
Write-Host "Verifying executive one page pack..."
Write-Host ""

$RequiredDocs = @{
    "01_EXECUTIVE_ONE_PAGE_SUMMARY.md" = @("Executive One Page Summary", "Commercial paths", "90 Day Operational Pilot")
    "02_EXECUTIVE_TALK_TRACK.md" = @("Executive Talk Track", "Core problem", "Business value")
    "03_EXECUTIVE_DECISION_PATH.md" = @("Executive Decision Path", "Preferred decision", "Avoid")
    "04_FINAL_STATUS_STATEMENT.md" = @("Final Status Statement", "PHASE56_FINAL_RESALE_SCALE_READINESS_READY", "controlled resale")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $ExecutiveDir $Doc

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
    $FinalStatus = "PHASE57_EXECUTIVE_ONE_PAGE_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE57_EXECUTIVE_ONE_PAGE_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE57_EXECUTIVE_ONE_PAGE_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 57 Executive One Page Pack"
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