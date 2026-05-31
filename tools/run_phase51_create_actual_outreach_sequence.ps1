# RAFTOP CPAP CARE Pro
# Phase 51.2 - Actual Outreach Message and Call Sequence
# ASCII-safe version.
# Safe: creates outreach docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$MeetingDir = Join-Path $DocsRoot "buyer-meeting-execution"
$OutreachDir = Join-Path $MeetingDir "outreach-sequence"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $MeetingDir -Force | Out-Null
New-Item -ItemType Directory -Path $OutreachDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase51_actual_outreach_sequence_" + $Timestamp + ".md")

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

    $Path = Join-Path $OutreachDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 51 Actual Outreach Sequence" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 51.2 Actual Outreach Sequence..."
Write-Host ""

Write-Doc "01_FIRST_MESSAGE_WHATSAPP_SMS.md" @(
    "# RAFTOP CPAP CARE Pro - First Outreach Message",
    "",
    "Use this for WhatsApp, Viber, SMS or short email.",
    "",
    "Message:",
    "",
    "Good evening. RAFTOP CPAP CARE Pro is now completed as a buyer-ready version for Raftopoulos review.",
    "",
    "It is not just a demo. It is a CPAP Operations Control Layer with protected login, compliance visibility, no-data detection, ATLAS actions, Quality and Profit reporting, and a base for future doctor or clinic expansion.",
    "",
    "I would like to present it in a 40 minute meeting so we can decide whether to proceed with a paid pilot or annual enterprise scope.",
    "",
    "Can we schedule it for Tuesday or Thursday?",
    "",
    "Rule:",
    "",
    "Do not attach all documents to the first message.",
    "Do not send pricing in the first message unless asked.",
    "The goal is to book the meeting."
)

Write-Doc "02_PHONE_CALL_SCRIPT.md" @(
    "# RAFTOP CPAP CARE Pro - Phone Call Script",
    "",
    "Use this if there is no response within a few hours or by the next business day.",
    "",
    "Opening:",
    "",
    "Hello, this is Dimitris. I sent you a short message about RAFTOP CPAP CARE Pro.",
    "",
    "I am not calling to explain everything by phone. I only want to schedule a 40 minute presentation.",
    "",
    "The platform is now buyer-ready and is built as a CPAP Operations Control Layer for compliance visibility, no-data detection, ATLAS actions, follow-ups, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "Question:",
    "",
    "Can we schedule a short presentation next week?",
    "",
    "If positive:",
    "",
    "Great. I can do Tuesday at [time] or Thursday at [time]. Which one works better?",
    "",
    "If they say send something first:",
    "",
    "Of course. I can send a short summary. However, the value is clearer when you see the flow: CPAP signal, ATLAS action, KPI, management decision. I suggest we keep a 40 minute meeting first and then I send the structured proposal.",
    "",
    "If they ask price:",
    "",
    "There are two paths: paid pilot or annual enterprise scope. I prefer to show the system first, because price depends on data scope, users, and whether we start with pilot or direct enterprise rollout.",
    "",
    "Call rule:",
    "",
    "Do not end with: we will talk later.",
    "End with a date, a next step, or a named person."
)

Write-Doc "03_FOLLOW_UP_AFTER_NO_RESPONSE.md" @(
    "# RAFTOP CPAP CARE Pro - Follow-up After No Response",
    "",
    "Send this 48 hours after first outreach if there is no response.",
    "",
    "Message:",
    "",
    "Hello. I am following up on RAFTOP CPAP CARE Pro.",
    "",
    "I will keep this practical. I would like to show in 40 minutes how the system can help Raftopoulos with no-data cases, compliance risk, leak issues, ATLAS follow-ups, management reporting, and future doctor or clinic expansion.",
    "",
    "Should we schedule a short presentation next week?",
    "",
    "Rule:",
    "",
    "Do not sound desperate.",
    "Do not send a long explanation.",
    "Do not attach all documents."
)

Write-Doc "04_IF_THEY_REQUEST_LINK.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Requests Link",
    "",
    "If the buyer says: send me a link to see it.",
    "",
    "Response:",
    "",
    "I can send access, but I strongly suggest we first review it together in a 40 minute presentation.",
    "",
    "The value is not only in the screens. The value is in the flow: CPAP data, signal, ATLAS action, KPI, report, and buyer decision.",
    "",
    "After the presentation, I can send the appropriate summary, delivery material, or technical review agenda.",
    "",
    "Rule:",
    "",
    "Do not send raw access without context unless there is a clear reason.",
    "Never send credentials in an unsafe way.",
    "Never expose admin credentials, tokens, secrets, or technical logs."
)

Write-Doc "05_IF_THEY_REQUEST_TECHNICAL_REVIEW.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Requests Technical Review",
    "",
    "If the buyer says: our technical person needs to see it.",
    "",
    "Response:",
    "",
    "Of course. The correct next step is a structured technical review.",
    "",
    "The technical review should cover protected login, tenant context, buyer routes, backend health, API readiness, data import, data minimization, security boundaries, and deployment approach.",
    "",
    "It should not become uncontrolled live debugging or secret exposure.",
    "",
    "Ask:",
    "",
    "Should we schedule the business presentation first and then a technical review, or do you want both in the same meeting with the right people present?",
    "",
    "Rule:",
    "",
    "Technical review is useful only if there is a clear buyer scope and business sponsor."
)

Write-Doc "06_IF_THEY_ASK_FOR_PRICE.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Asks For Price",
    "",
    "If they ask price before the meeting:",
    "",
    "Response:",
    "",
    "There are three commercial paths.",
    "",
    "1. 30 Day Paid Pilot: 4900 EUR plus VAT.",
    "2. 90 Day Operational Pilot: 15000 EUR plus VAT.",
    "3. Annual Enterprise License: 42000 EUR per year plus VAT, plus 7500 EUR onboarding.",
    "",
    "The right option depends on scope, data sample, users, and whether Raftopoulos wants validation first or direct enterprise rollout discussion.",
    "",
    "I suggest we do the 40 minute presentation first and then decide which path fits.",
    "",
    "Rule:",
    "",
    "Do not discount before value is understood.",
    "Do not offer free trial.",
    "Do not reduce price without reducing scope."
)

Write-Doc "07_MEETING_BOOKING_TRACKER.md" @(
    "# RAFTOP CPAP CARE Pro - Meeting Booking Tracker",
    "",
    "First message sent:",
    "",
    "- Date:",
    "- Time:",
    "- Channel:",
    "- Recipient:",
    "",
    "Response:",
    "",
    "- Positive:",
    "- Asked for link:",
    "- Asked for technical review:",
    "- Asked for price:",
    "- No response:",
    "",
    "Call attempt:",
    "",
    "- Date:",
    "- Time:",
    "- Outcome:",
    "",
    "Meeting status:",
    "",
    "- Scheduled:",
    "- Date:",
    "- Time:",
    "- Attendees:",
    "- Meeting type: business demo / technical review / commercial discussion",
    "",
    "Next action:",
    "",
    "- Owner:",
    "- Deadline:"
)

Write-Host ""
Write-Host "Verifying actual outreach sequence..."
Write-Host ""

$RequiredDocs = @{
    "01_FIRST_MESSAGE_WHATSAPP_SMS.md" = @("First Outreach Message", "paid pilot", "annual enterprise")
    "02_PHONE_CALL_SCRIPT.md" = @("Phone Call Script", "40 minute presentation", "Which one works better")
    "03_FOLLOW_UP_AFTER_NO_RESPONSE.md" = @("Follow-up After No Response", "48 hours", "no-data cases")
    "04_IF_THEY_REQUEST_LINK.md" = @("If Buyer Requests Link", "Do not send raw access", "credentials")
    "05_IF_THEY_REQUEST_TECHNICAL_REVIEW.md" = @("Technical Review", "protected login", "secret exposure")
    "06_IF_THEY_ASK_FOR_PRICE.md" = @("If Buyer Asks For Price", "Annual Enterprise License", "Do not discount")
    "07_MEETING_BOOKING_TRACKER.md" = @("Meeting Booking Tracker", "Meeting status", "Next action")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $OutreachDir $Doc

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
    $FinalStatus = "PHASE51_ACTUAL_OUTREACH_SEQUENCE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE51_ACTUAL_OUTREACH_SEQUENCE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE51_ACTUAL_OUTREACH_SEQUENCE_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 51 Actual Outreach Sequence"
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