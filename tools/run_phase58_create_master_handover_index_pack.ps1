# RAFTOP CPAP CARE Pro
# Phase 58 - Master Handover Index Pack
# ASCII-safe version.
# Safe: creates master handover docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$HandoverDir = Join-Path $DocsRoot "master-handover"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $HandoverDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase58_master_handover_index_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $HandoverDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 58 Master Handover Index Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 58 Master Handover Index Pack..."
Write-Host ""

Write-Doc "01_MASTER_HANDOVER_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Master Handover Index",
    "",
    "Purpose:",
    "",
    "This document is the master index for the RAFTOP CPAP CARE Pro commercial handover.",
    "",
    "Final status:",
    "",
    "RAFTOP CPAP CARE Pro is ready as product, presentation package, meeting execution package, commercial proposal package, deal acceptance package, onboarding execution package, resale/scale package, and executive one-page package.",
    "",
    "Core folders:",
    "",
    "docs/buyer-delivery",
    "docs/buyer-presentation",
    "docs/buyer-meeting-execution",
    "docs/commercial-proposal",
    "docs/commercial-proposal/deal-acceptance",
    "docs/commercial-proposal/onboarding-execution",
    "docs/commercial-proposal/resale-scale-delivery",
    "docs/executive-one-page",
    "docs/master-handover",
    "",
    "Core production routes:",
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
    "Core commercial paths:",
    "",
    "30 Day Paid Pilot: 4900 EUR plus VAT.",
    "90 Day Operational Pilot: 15000 EUR plus VAT.",
    "Annual Enterprise License: 42000 EUR per year plus VAT plus 7500 EUR onboarding.",
    "",
    "Recommended commercial path:",
    "",
    "90 Day Operational Pilot."
)

Write-Doc "02_RELEASE_TAG_MAP.md" @(
    "# RAFTOP CPAP CARE Pro - Release Tag Map",
    "",
    "Purpose:",
    "",
    "This document maps release tags to business readiness milestones.",
    "",
    "Tags:",
    "",
    "raftop-buyer-ready-v1.0.0",
    "Meaning: product is buyer-ready.",
    "",
    "raftop-buyer-presentation-ready-v1.0.0",
    "Meaning: buyer presentation pack is ready.",
    "",
    "raftop-buyer-meeting-ready-v1.0.0",
    "Meaning: buyer meeting execution pack is ready.",
    "",
    "raftop-commercial-proposal-ready-v1.0.0",
    "Meaning: commercial proposal pack is ready.",
    "",
    "raftop-deal-acceptance-ready-v1.0.0",
    "Meaning: deal acceptance and start authorization pack is ready.",
    "",
    "raftop-onboarding-execution-ready-v1.0.0",
    "Meaning: onboarding execution pack is ready.",
    "",
    "raftop-master-commercial-delivery-ready-v1.0.0",
    "Meaning: master commercial delivery is ready.",
    "",
    "raftop-resale-scale-ready-v1.0.0",
    "Meaning: resale and scale readiness is ready.",
    "",
    "raftop-executive-one-page-ready-v1.0.0",
    "Meaning: executive one-page pack is ready.",
    "",
    "Rule:",
    "",
    "Anything after these tags is a new version and should not be mixed with the v1.0.0 commercial readiness baseline."
)

Write-Doc "03_FINAL_PHASE_STATUS_MAP.md" @(
    "# RAFTOP CPAP CARE Pro - Final Phase Status Map",
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
    "PHASE57_FINAL_EXECUTIVE_ONE_PAGE_READINESS_READY",
    "",
    "Interpretation:",
    "",
    "The project is complete for buyer presentation, commercial discussion, paid pilot, annual license negotiation, onboarding execution, and controlled resale planning.",
    "",
    "No further product development is required before buyer presentation."
)

Write-Doc "04_BUYER_FACING_VS_INTERNAL.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Facing vs Internal Materials",
    "",
    "Buyer-facing materials:",
    "",
    "- executive one-page summary",
    "- buyer presentation docs",
    "- commercial proposal summary",
    "- pilot or annual proposal",
    "- onboarding checklist after acceptance",
    "",
    "Internal materials:",
    "",
    "- verification scripts",
    "- internal reports",
    "- GitHub repository",
    "- source code",
    "- environment files",
    "- raw technical logs",
    "- credentials",
    "- Render settings",
    "- GitHub secrets",
    "",
    "Rule:",
    "",
    "Do not send internal materials before scope, technical review boundary, and buyer intent are clear.",
    "",
    "Safe buyer flow:",
    "",
    "1. Send short message.",
    "2. Book meeting.",
    "3. Present product.",
    "4. Choose commercial path.",
    "5. Send proposal.",
    "6. Get written acceptance.",
    "7. Start onboarding."
)

Write-Doc "05_NO_MORE_BUILD_RULE.md" @(
    "# RAFTOP CPAP CARE Pro - No More Build Rule",
    "",
    "Purpose:",
    "",
    "Prevent unnecessary development after commercial readiness.",
    "",
    "Rule:",
    "",
    "Do not add new features before the buyer meeting.",
    "",
    "Do not add new routes before the buyer meeting.",
    "",
    "Do not change pricing before the buyer meeting.",
    "",
    "Do not send source code before structured technical review.",
    "",
    "Do not start pilot or annual work without written acceptance, billing details, payment structure, data boundary, named owner, and kickoff date.",
    "",
    "Allowed before meeting:",
    "",
    "- rehearse demo",
    "- collect screenshots",
    "- prepare meeting agenda",
    "- send buyer message",
    "- schedule call",
    "",
    "Not allowed before meeting:",
    "",
    "- new development",
    "- uncontrolled access sharing",
    "- free trial",
    "- undefined technical review",
    "- open-ended custom work",
    "",
    "Final statement:",
    "",
    "The next bottleneck is not product readiness. The next bottleneck is sales execution."
)

Write-Doc "06_NEXT_ACTION_COMMAND.md" @(
    "# RAFTOP CPAP CARE Pro - Next Action Command",
    "",
    "Immediate action:",
    "",
    "Send the buyer message and book the 40 minute presentation.",
    "",
    "Message goal:",
    "",
    "Book meeting.",
    "",
    "Do not include:",
    "",
    "- links",
    "- GitHub",
    "- prices",
    "- screenshots",
    "- full proposal",
    "- delivery pack",
    "",
    "Meeting target:",
    "",
    "Get one of three decisions:",
    "",
    "1. 30 Day Paid Pilot.",
    "2. 90 Day Operational Pilot.",
    "3. Annual Enterprise License.",
    "",
    "Recommended target:",
    "",
    "90 Day Operational Pilot.",
    "",
    "Final close question:",
    "",
    "Should Raftopoulos proceed with a paid pilot to measure value, or discuss annual enterprise license scope directly?"
)

Write-Host ""
Write-Host "Verifying master handover index pack..."
Write-Host ""

$RequiredDocs = @{
    "01_MASTER_HANDOVER_INDEX.md" = @("Master Handover Index", "Recommended commercial path", "90 Day Operational Pilot")
    "02_RELEASE_TAG_MAP.md" = @("Release Tag Map", "raftop-buyer-ready-v1.0.0", "new version")
    "03_FINAL_PHASE_STATUS_MAP.md" = @("Final Phase Status Map", "PHASE57_FINAL_EXECUTIVE_ONE_PAGE_READINESS_READY", "No further product development")
    "04_BUYER_FACING_VS_INTERNAL.md" = @("Buyer Facing", "Internal materials", "Safe buyer flow")
    "05_NO_MORE_BUILD_RULE.md" = @("No More Build Rule", "Do not add new features", "sales execution")
    "06_NEXT_ACTION_COMMAND.md" = @("Next Action Command", "Book meeting", "Annual Enterprise License")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $HandoverDir $Doc

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
    $FinalStatus = "PHASE58_MASTER_HANDOVER_INDEX_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE58_MASTER_HANDOVER_INDEX_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE58_MASTER_HANDOVER_INDEX_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 58 Master Handover Index Pack"
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