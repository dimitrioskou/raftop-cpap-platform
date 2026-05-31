# RAFTOP CPAP CARE Pro
# Phase 51.4 - Buyer Response Handling Pack
# ASCII-safe version.
# Safe: creates response handling docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$MeetingDir = Join-Path $DocsRoot "buyer-meeting-execution"
$ResponseDir = Join-Path $MeetingDir "response-handling"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $MeetingDir -Force | Out-Null
New-Item -ItemType Directory -Path $ResponseDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase51_buyer_response_handling_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $ResponseDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 51 Buyer Response Handling Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 51.4 Buyer Response Handling Pack..."
Write-Host ""

Write-Doc "01_IF_BUYER_SAYS_YES.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Says Yes",
    "",
    "Buyer response example:",
    "",
    "Yes, let us see it.",
    "",
    "Your response:",
    "",
    "Great. I suggest we keep it focused at 40 minutes so you can see the full flow without wasting time.",
    "",
    "The presentation will cover: CPAP operations problem, compliance visibility, no-data detection, ATLAS actions, Quality and Profit reporting, buyer-ready routes, and the next commercial step.",
    "",
    "I can do Tuesday at [time] or Thursday at [time]. Which one works better?",
    "",
    "Rule:",
    "",
    "Do not answer only: Perfect, I will send details.",
    "Lock day and time.",
    "Ask who should attend.",
    "",
    "Follow-up question:",
    "",
    "Who should join from management, CPAP operations, and technical/data side?"
)

Write-Doc "02_IF_BUYER_SAYS_SEND_INFO.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Says Send Information",
    "",
    "Buyer response example:",
    "",
    "Send us something first.",
    "",
    "Your response:",
    "",
    "Of course. I can send a short summary.",
    "",
    "However, the value is clearer when seen in the product flow: CPAP signal, ATLAS action, KPI, report, and buyer decision.",
    "",
    "If you only see it as text, it may look like an idea. In the presentation, it is clear that it is a buyer-ready operating layer.",
    "",
    "I suggest we do a 40 minute presentation first, then I send the structured proposal based on what you want to evaluate.",
    "",
    "Can we schedule Tuesday or Thursday?",
    "",
    "Rule:",
    "",
    "Do not send the whole delivery pack.",
    "Do not send GitHub.",
    "Do not send raw links without context.",
    "Send only a short summary if absolutely needed."
)

Write-Doc "03_IF_BUYER_ASKS_FOR_LINK.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Asks For Link",
    "",
    "Buyer response example:",
    "",
    "Send us the link to check it.",
    "",
    "Your response:",
    "",
    "I can provide access, but I strongly recommend we first review it together in a 40 minute presentation.",
    "",
    "The value is not only in the screens. The value is in the operating flow: data, signal, ATLAS action, KPI, report, and management decision.",
    "",
    "After the presentation, I can send the appropriate access or summary depending on the next step.",
    "",
    "Rule:",
    "",
    "Do not send credentials casually.",
    "Do not send admin access by unsafe channel.",
    "Do not expose tokens, secrets, or internal logs.",
    "Do not let the buyer evaluate the product without narrative."
)

Write-Doc "04_IF_BUYER_ASKS_PRICE.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Asks Price",
    "",
    "Buyer response example:",
    "",
    "How much does it cost?",
    "",
    "Your response:",
    "",
    "There are three commercial paths.",
    "",
    "1. 30 Day Paid Pilot: 4900 EUR plus VAT.",
    "2. 90 Day Operational Pilot: 15000 EUR plus VAT.",
    "3. Annual Enterprise License: 42000 EUR per year plus VAT, plus 7500 EUR onboarding.",
    "",
    "The right path depends on scope, data sample, users, and whether Raftopoulos wants validation first or direct annual rollout discussion.",
    "",
    "I suggest we do the 40 minute presentation first so the price is connected to the value and scope.",
    "",
    "Rule:",
    "",
    "Do not discount before the demo.",
    "Do not offer free trial.",
    "Do not reduce price without reducing scope."
)

Write-Doc "05_IF_BUYER_WANTS_TECHNICAL_REVIEW.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Wants Technical Review",
    "",
    "Buyer response example:",
    "",
    "Our technical person needs to see it.",
    "",
    "Your response:",
    "",
    "Of course. That is reasonable.",
    "",
    "The technical review should be structured and limited to the correct areas: protected login, tenant context, buyer routes, backend health, API readiness, data import, data minimization, security boundaries, and deployment approach.",
    "",
    "It should not become uncontrolled live debugging or secret exposure.",
    "",
    "Question:",
    "",
    "Should we do the business presentation first and then a technical review, or do you want both in the same meeting with the right people present?",
    "",
    "Rule:",
    "",
    "Never open secrets, environment variables, database credentials, GitHub secrets, Render secret settings, or raw tokens."
)

Write-Doc "06_IF_BUYER_SAYS_NOT_NOW.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Says Not Now",
    "",
    "Buyer response example:",
    "",
    "Not now, we are busy.",
    "",
    "Your response:",
    "",
    "Understood. I will keep it short and practical.",
    "",
    "This is not a long product presentation. In 40 minutes you will see whether RAFTOP can help with no-data cases, compliance risk, ATLAS follow-ups, Quality and Profit reporting, and future doctor or clinic expansion.",
    "",
    "If it is not relevant, we stop there. If it is relevant, we decide next step.",
    "",
    "Can we schedule a short slot next week or the week after?",
    "",
    "Rule:",
    "",
    "Do not push aggressively.",
    "Do not accept an undefined delay.",
    "Ask for a specific future slot."
)

Write-Doc "07_IF_BUYER_SAYS_FREE_TRIAL.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Asks For Free Trial",
    "",
    "Buyer response example:",
    "",
    "Can we try it for free?",
    "",
    "Your response:",
    "",
    "I do not recommend a free trial for this product.",
    "",
    "The purpose is not to click around screens. The purpose is to measure operational value with KPIs: no-data, compliance risk, leak issues, ATLAS actions, follow-up completion, and management reporting.",
    "",
    "The correct structure is a paid pilot with defined scope, data sample, review rhythm, and final report.",
    "",
    "Rule:",
    "",
    "Free trial weakens positioning.",
    "Paid pilot creates commitment.",
    "No commitment means no serious measurement."
)

Write-Doc "08_IF_BUYER_WANTS_ANNUAL.md" @(
    "# RAFTOP CPAP CARE Pro - If Buyer Wants Annual Scope",
    "",
    "Buyer response example:",
    "",
    "Can we go straight to annual agreement?",
    "",
    "Your response:",
    "",
    "Yes, we can discuss annual enterprise scope directly.",
    "",
    "The annual license would need to define patient scope, users, data boundaries, onboarding, support, monthly reporting, ATLAS operating rules, and change request process.",
    "",
    "Commercial anchor:",
    "",
    "Annual Enterprise License: 42000 EUR per year plus VAT.",
    "Onboarding: 7500 EUR plus VAT.",
    "Scope: up to 7000 CPAP patients.",
    "",
    "Next step:",
    "",
    "Schedule commercial scope meeting and prepare annual license confirmation.",
    "",
    "Rule:",
    "",
    "Do not start annual work without written acceptance, billing details, payment structure, and onboarding date."
)

Write-Host ""
Write-Host "Verifying buyer response handling pack..."
Write-Host ""

$RequiredDocs = @{
    "01_IF_BUYER_SAYS_YES.md" = @("If Buyer Says Yes", "Lock day and time", "Who should join")
    "02_IF_BUYER_SAYS_SEND_INFO.md" = @("Send Information", "Do not send the whole delivery pack", "Can we schedule")
    "03_IF_BUYER_ASKS_FOR_LINK.md" = @("Asks For Link", "Do not send credentials casually", "operating flow")
    "04_IF_BUYER_ASKS_PRICE.md" = @("Asks Price", "Annual Enterprise License", "Do not discount")
    "05_IF_BUYER_WANTS_TECHNICAL_REVIEW.md" = @("Technical Review", "secret exposure", "business presentation")
    "06_IF_BUYER_SAYS_NOT_NOW.md" = @("Not Now", "specific future slot", "not relevant")
    "07_IF_BUYER_SAYS_FREE_TRIAL.md" = @("Free Trial", "paid pilot", "No commitment")
    "08_IF_BUYER_WANTS_ANNUAL.md" = @("Annual Scope", "42000 EUR", "written acceptance")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $ResponseDir $Doc

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
    $FinalStatus = "PHASE51_BUYER_RESPONSE_HANDLING_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE51_BUYER_RESPONSE_HANDLING_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE51_BUYER_RESPONSE_HANDLING_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 51 Buyer Response Handling Pack"
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