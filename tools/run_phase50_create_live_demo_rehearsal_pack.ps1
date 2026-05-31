# RAFTOP CPAP CARE Pro
# Phase 50.3 - Live Demo Rehearsal Pack
# ASCII-safe version.
# Safe: creates rehearsal docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$PresentationDir = Join-Path $DocsRoot "buyer-presentation"
$RehearsalDir = Join-Path $PresentationDir "rehearsal"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $PresentationDir -Force | Out-Null
New-Item -ItemType Directory -Path $RehearsalDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase50_live_demo_rehearsal_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $RehearsalDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 50 Live Demo Rehearsal Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 50.3 Live Demo Rehearsal Pack..."
Write-Host ""

Write-Doc "01_DEMO_REHEARSAL_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Demo Rehearsal Checklist",
    "",
    "Purpose:",
    "",
    "Use this checklist before every buyer presentation.",
    "",
    "Pre-demo technical checks:",
    "",
    "- Frontend opens",
    "- Backend health opens",
    "- Login page opens",
    "- Login works",
    "- Incognito protected route redirects to login",
    "- Executive demo home loads",
    "- Quality and Profit page loads",
    "- Pilot walkthrough loads",
    "- Pilot demo dashboard loads",
    "- Settings route loads",
    "- Compliance route loads",
    "- Reports route loads",
    "- Doctor route loads",
    "- Clinic route loads",
    "",
    "Pre-demo business checks:",
    "",
    "- Know who attends",
    "- Know decision maker",
    "- Know technical reviewer, if any",
    "- Know whether this is demo, technical review, or commercial discussion",
    "- Know target close: paid pilot or annual license",
    "",
    "Do not open:",
    "",
    "- source code",
    "- .env files",
    "- Render secrets",
    "- GitHub secrets",
    "- database URL",
    "- tokens",
    "- admin passwords",
    "- raw logs with sensitive values",
    "",
    "Rehearsal pass criteria:",
    "",
    "- Complete demo in 35 to 40 minutes",
    "- No more than 10 routes shown",
    "- Every screen tied to buyer value",
    "- End with clear next step"
)

Write-Doc "02_BROWSER_TABS_ORDER.md" @(
    "# RAFTOP CPAP CARE Pro - Browser Tabs Order",
    "",
    "Open these tabs before the meeting.",
    "",
    "Tab 1 - Login",
    "https://raftop-cpap-frontend.onrender.com/login",
    "",
    "Tab 2 - Executive Demo Home",
    "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/executive-demo-home",
    "",
    "Tab 3 - Quality and Profit",
    "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/quality-profit",
    "",
    "Tab 4 - Pilot Walkthrough",
    "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-walkthrough-scenario",
    "",
    "Tab 5 - Pilot Demo Dashboard",
    "https://raftop-cpap-frontend.onrender.com/sales/raftopoulos/pilot-demo",
    "",
    "Tab 6 - Settings",
    "https://raftop-cpap-frontend.onrender.com/settings",
    "",
    "Tab 7 - Compliance",
    "https://raftop-cpap-frontend.onrender.com/compliance",
    "",
    "Tab 8 - Reports",
    "https://raftop-cpap-frontend.onrender.com/reports",
    "",
    "Tab 9 - Doctor",
    "https://raftop-cpap-frontend.onrender.com/doctor",
    "",
    "Tab 10 - Clinic",
    "https://raftop-cpap-frontend.onrender.com/clinic",
    "",
    "Tab 11 - Backend Health",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "Rule:",
    "",
    "Do not improvise route order during the demo. Follow this order unless buyer asks a direct question."
)

Write-Doc "03_40_MINUTE_TALK_TRACK.md" @(
    "# RAFTOP CPAP CARE Pro - 40 Minute Talk Track",
    "",
    "0-5 min - Opening",
    "",
    "This is not just an application. It is a CPAP Operations Control Layer for patient monitoring, follow-up prioritization, ATLAS actions, compliance visibility, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "5-10 min - Business problem",
    "",
    "The issue in a large CPAP patient base is not only data access. The issue is operational control: who needs attention, who owns the next action, and what management can decide.",
    "",
    "10-18 min - Quality and Profit",
    "",
    "Show Quality and Profit Excellence Center.",
    "Explain that the goal is not fake ROI. The goal is to turn operational defects into management visibility.",
    "Key defects: no-data, compliance risk, leak issues, delayed follow-ups, open actions.",
    "",
    "18-25 min - Pilot Demo Dashboard",
    "",
    "Show the pilot flow.",
    "Explain signal to action to KPI.",
    "No-data becomes a blind spot action.",
    "Compliance risk becomes follow-up priority.",
    "Leak issue becomes mask or therapy review.",
    "",
    "25-30 min - Buyer routes",
    "",
    "Show Settings, Compliance, Reports, Doctor, Clinic.",
    "Explain that these routes make the product buyer-ready, not just demo-ready.",
    "",
    "30-35 min - Delivery readiness",
    "",
    "Mention release tag: raftop-buyer-ready-v1.0.0.",
    "Mention Phase 46, Phase 47, Phase 48, Phase 49 gates.",
    "Do not show internal logs unless asked.",
    "",
    "35-40 min - Close",
    "",
    "Ask:",
    "Based on what you saw, should we proceed with a paid pilot to measure value, or should we discuss annual enterprise license scope directly?",
    "",
    "Do not end with:",
    "What do you think?",
    "",
    "End with:",
    "What is the next decision step?"
)

Write-Doc "04_LIVE_DEMO_FAILOVER_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - Live Demo Failover Plan",
    "",
    "Purpose:",
    "",
    "Use this plan if something fails during the live demo.",
    "",
    "If Render is waking up:",
    "",
    "- Say: Render may need a few seconds to wake up.",
    "- Continue with screenshots.",
    "- Return to live route later.",
    "",
    "If login is slow:",
    "",
    "- Do not panic.",
    "- Refresh once.",
    "- If still slow, use screenshot backup.",
    "",
    "If a buyer route does not load:",
    "",
    "- Use screenshot backup.",
    "- Say: The route is part of the buyer-ready package and has been verified in the release gate.",
    "- Do not debug live.",
    "",
    "If backend health fails:",
    "",
    "- Do not open code.",
    "- Do not open Render secrets.",
    "- Move to delivery pack and explain that technical review can verify backend health separately.",
    "",
    "If buyer asks for code:",
    "",
    "- Say: We can schedule a structured technical review with agreed scope.",
    "- Do not open source code during business demo.",
    "",
    "If buyer asks for real patient data:",
    "",
    "- Say: Real patient data requires written data scope, DPA/legal review, secure transfer, and authorized users.",
    "",
    "Golden rule:",
    "",
    "Never turn a buyer presentation into live debugging."
)

Write-Doc "05_DEMO_SCORING_SHEET.md" @(
    "# RAFTOP CPAP CARE Pro - Demo Scoring Sheet",
    "",
    "Use this immediately after the meeting.",
    "",
    "Attendees:",
    "",
    "- Name:",
    "- Role:",
    "- Decision power: High / Medium / Low",
    "",
    "Buying signals:",
    "",
    "- Asked about price: Yes / No",
    "- Asked about pilot: Yes / No",
    "- Asked about technical review: Yes / No",
    "- Asked about real data: Yes / No",
    "- Asked about annual license: Yes / No",
    "- Asked about doctor module: Yes / No",
    "",
    "Objections:",
    "",
    "- Cost",
    "- Data/GDPR",
    "- Technical review",
    "- Timing",
    "- Internal approval",
    "- Already have AirView",
    "- Need to see more",
    "",
    "Meeting outcome:",
    "",
    "- Hot: ready for proposal",
    "- Warm: needs follow-up",
    "- Cold: no clear need",
    "",
    "Next action:",
    "",
    "- Send pilot proposal",
    "- Schedule technical review",
    "- Send buyer summary",
    "- Schedule commercial meeting",
    "- No action",
    "",
    "Deadline:",
    "",
    "- Next step date:",
    "- Owner:"
)

Write-Host ""
Write-Host "Verifying live demo rehearsal pack..."
Write-Host ""

$RequiredDocs = @{
    "01_DEMO_REHEARSAL_CHECKLIST.md" = @("Demo Rehearsal Checklist", "Pre-demo technical checks", "Rehearsal pass criteria")
    "02_BROWSER_TABS_ORDER.md" = @("Browser Tabs Order", "Tab 1 - Login", "Backend Health")
    "03_40_MINUTE_TALK_TRACK.md" = @("40 Minute Talk Track", "Quality and Profit", "Close")
    "04_LIVE_DEMO_FAILOVER_PLAN.md" = @("Live Demo Failover Plan", "Never turn a buyer presentation into live debugging", "Real patient data")
    "05_DEMO_SCORING_SHEET.md" = @("Demo Scoring Sheet", "Buying signals", "Next action")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $RehearsalDir $Doc

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
    $FinalStatus = "PHASE50_LIVE_DEMO_REHEARSAL_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE50_LIVE_DEMO_REHEARSAL_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE50_LIVE_DEMO_REHEARSAL_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 50 Live Demo Rehearsal Pack"
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