# RAFTOP CPAP CARE Pro
# Phase 51.1 - Buyer Meeting Execution Pack
# ASCII-safe version.
# Safe: creates buyer meeting docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$MeetingDir = Join-Path $DocsRoot "buyer-meeting-execution"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $MeetingDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase51_buyer_meeting_execution_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $MeetingDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 51 Buyer Meeting Execution Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 51.1 Buyer Meeting Execution Pack..."
Write-Host ""

Write-Doc "01_MEETING_BOOKING_MESSAGE.md" @(
    "# RAFTOP CPAP CARE Pro - Meeting Booking Message",
    "",
    "Purpose:",
    "",
    "Use this message to book the buyer presentation.",
    "",
    "Message:",
    "",
    "Hello. RAFTOP CPAP CARE Pro is now completed as a buyer-ready version for Raftopoulos review.",
    "",
    "It is not just a demo. It is a CPAP Operations Control Layer with protected login, compliance visibility, no-data detection, ATLAS actions, Quality and Profit reporting, and a base for future doctor or clinic expansion.",
    "",
    "I would like to present it in a 40 minute meeting so we can decide whether to proceed with a paid pilot or annual enterprise scope.",
    "",
    "Can we schedule it for Tuesday or Thursday?",
    "",
    "Rule:",
    "",
    "Do not send all documents before the meeting. The goal of this message is to book the meeting."
)

Write-Doc "02_REQUIRED_ATTENDEES.md" @(
    "# RAFTOP CPAP CARE Pro - Required Attendees",
    "",
    "The meeting should not include only technical people.",
    "",
    "Required attendees:",
    "",
    "1. Business decision maker",
    "2. CPAP operations lead",
    "3. Technical or data contact",
    "4. Commercial or management sponsor",
    "",
    "Reason:",
    "",
    "RAFTOP is not only a technical tool. It affects CPAP operations, patient follow-up, management reporting, and future commercial expansion.",
    "",
    "If only technical staff attend:",
    "",
    "The risk is that the discussion becomes about features and not buyer value.",
    "",
    "If only management attends:",
    "",
    "The risk is that data import and technical boundaries are not clarified.",
    "",
    "Best composition:",
    "",
    "Decision maker plus CPAP operations plus technical/data contact."
)

Write-Doc "03_MEETING_AGENDA.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Meeting Agenda",
    "",
    "Duration: 40 minutes",
    "",
    "0-5 min: Opening and business context",
    "5-10 min: CPAP operations problem",
    "10-18 min: Quality and Profit layer",
    "18-25 min: Pilot dashboard and ATLAS action flow",
    "25-30 min: Buyer-ready routes",
    "30-35 min: Release readiness and delivery pack",
    "35-40 min: Commercial next step",
    "",
    "Opening:",
    "",
    "This is not a simple application demo. It is a buyer-ready CPAP Operations Control Layer for patient monitoring, follow-up prioritization, ATLAS actions, compliance visibility, Quality and Profit reporting, and doctor or clinic expansion planning.",
    "",
    "Close:",
    "",
    "Based on what you saw, should we proceed with a paid pilot to measure value, or should we discuss annual enterprise license scope directly?"
)

Write-Doc "04_BUYER_QUALIFICATION_QUESTIONS.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Qualification Questions",
    "",
    "Ask these questions during or after the presentation.",
    "",
    "Business questions:",
    "",
    "1. How many CPAP patients are actively monitored today?",
    "2. Who currently checks no-data cases?",
    "3. Who follows compliance risk patients?",
    "4. How are leak or therapy issues handled?",
    "5. Is there a monthly management report today?",
    "6. Who owns unresolved CPAP follow-up cases?",
    "",
    "Data questions:",
    "",
    "1. What export format can you provide?",
    "2. Is the source AirView, Excel, CSV, PDF, or another system?",
    "3. Can patient data be anonymized or pseudonymized for pilot?",
    "4. Which fields are available: usage, leak, AHI, date, device code?",
    "",
    "Commercial questions:",
    "",
    "1. Do you want to validate with a paid pilot first?",
    "2. Would you prefer annual enterprise scope if the system is ready?",
    "3. Is the doctor or clinic expansion commercially interesting?",
    "",
    "Decision question:",
    "",
    "What needs to be true for Raftopoulos to proceed?"
)

Write-Doc "05_CLOSE_AND_NEXT_STEP_SCRIPT.md" @(
    "# RAFTOP CPAP CARE Pro - Close and Next Step Script",
    "",
    "Never close with: What do you think?",
    "",
    "Close with a decision path.",
    "",
    "Option A - Paid pilot close:",
    "",
    "The safest next step is a paid pilot with defined data sample, KPIs, weekly review, and final pilot report. This lets us measure value without jumping directly to full rollout.",
    "",
    "Option B - Annual license close:",
    "",
    "If you consider the platform already aligned with your operational needs, we can discuss annual enterprise scope directly, including onboarding, users, data boundaries, support, and rollout plan.",
    "",
    "Option C - Technical review close:",
    "",
    "If the next blocker is technical confidence, we should schedule a structured technical review with a fixed agenda: auth, tenant context, routes, APIs, data import, security boundaries, and production readiness.",
    "",
    "Final question:",
    "",
    "Which next step makes more sense for Raftopoulos: paid pilot, annual enterprise scope, or structured technical review?",
    "",
    "Rule:",
    "",
    "Do not leave the meeting without a named next step, owner, and date."
)

Write-Doc "06_TECHNICAL_REVIEW_BOUNDARY.md" @(
    "# RAFTOP CPAP CARE Pro - Technical Review Boundary",
    "",
    "Use this if the buyer says: our technical person needs to see it.",
    "",
    "Response:",
    "",
    "Of course. The technical review should be structured and limited to the correct areas.",
    "",
    "Technical review agenda:",
    "",
    "1. Architecture overview",
    "2. Protected login",
    "3. Tenant context",
    "4. Buyer routes",
    "5. Backend health",
    "6. Pilot API readiness",
    "7. CSV or data import approach",
    "8. Data minimization",
    "9. Security boundaries",
    "10. Deployment and support approach",
    "",
    "Do not show:",
    "",
    "- secrets",
    "- database URL",
    "- environment variables",
    "- admin passwords",
    "- raw tokens",
    "- GitHub secrets",
    "- Render secret settings",
    "",
    "Boundary statement:",
    "",
    "Technical transparency does not mean secret exposure."
)

Write-Doc "07_POST_MEETING_FOLLOWUP_DECISION_TREE.md" @(
    "# RAFTOP CPAP CARE Pro - Post Meeting Follow-up Decision Tree",
    "",
    "If buyer says yes to pilot:",
    "",
    "Send pilot proposal within 24 hours.",
    "Ask for billing details, pilot owner, data contact, and preferred kickoff date.",
    "",
    "If buyer asks for technical review:",
    "",
    "Schedule technical review within 7 days.",
    "Send agenda first.",
    "Do not send all internal docs.",
    "",
    "If buyer says send something:",
    "",
    "Send short buyer summary and propose a follow-up date.",
    "Do not send the entire delivery pack unless there is serious intent.",
    "",
    "If buyer delays:",
    "",
    "Ask what blocks the decision: cost, scope, data, technical review, timing, or internal approval.",
    "",
    "If buyer asks for free trial:",
    "",
    "Redirect to paid pilot. The goal is to measure value with KPIs, not free browsing.",
    "",
    "If buyer wants annual license:",
    "",
    "Move to commercial scope: price, onboarding, users, data, support, rollout date."
)

Write-Doc "08_MEETING_OUTCOME_TRACKER.md" @(
    "# RAFTOP CPAP CARE Pro - Meeting Outcome Tracker",
    "",
    "Meeting date:",
    "",
    "Attendees:",
    "",
    "- Name:",
    "- Role:",
    "- Decision power: High / Medium / Low",
    "",
    "Buyer signals:",
    "",
    "- Asked about price:",
    "- Asked about pilot:",
    "- Asked about technical review:",
    "- Asked about data:",
    "- Asked about annual license:",
    "- Asked about doctor or clinic module:",
    "",
    "Objections:",
    "",
    "- Cost:",
    "- Timing:",
    "- Technical:",
    "- Data/GDPR:",
    "- Internal approval:",
    "- Already have AirView:",
    "",
    "Decision status:",
    "",
    "- Hot",
    "- Warm",
    "- Cold",
    "",
    "Next step:",
    "",
    "- Paid pilot proposal",
    "- Annual license proposal",
    "- Technical review",
    "- Follow-up call",
    "- No action",
    "",
    "Owner:",
    "",
    "Deadline:"
)

Write-Host ""
Write-Host "Verifying buyer meeting execution pack..."
Write-Host ""

$RequiredDocs = @{
    "01_MEETING_BOOKING_MESSAGE.md" = @("Meeting Booking Message", "paid pilot", "annual enterprise")
    "02_REQUIRED_ATTENDEES.md" = @("Required Attendees", "decision maker", "technical")
    "03_MEETING_AGENDA.md" = @("Buyer Meeting Agenda", "40 minutes", "Commercial next step")
    "04_BUYER_QUALIFICATION_QUESTIONS.md" = @("Buyer Qualification Questions", "Business questions", "Data questions")
    "05_CLOSE_AND_NEXT_STEP_SCRIPT.md" = @("Close and Next Step Script", "paid pilot", "named next step")
    "06_TECHNICAL_REVIEW_BOUNDARY.md" = @("Technical Review Boundary", "Technical transparency", "secret exposure")
    "07_POST_MEETING_FOLLOWUP_DECISION_TREE.md" = @("Post Meeting Follow-up Decision Tree", "technical review", "free trial")
    "08_MEETING_OUTCOME_TRACKER.md" = @("Meeting Outcome Tracker", "Buyer signals", "Next step")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $MeetingDir $Doc

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
    $FinalStatus = "PHASE51_BUYER_MEETING_EXECUTION_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE51_BUYER_MEETING_EXECUTION_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE51_BUYER_MEETING_EXECUTION_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 51 Buyer Meeting Execution Pack"
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