# RAFTOP CPAP CARE Pro
# Phase 62 - Buyer Onboarding Runbook Pack
# ASCII-safe version.
# Safe: creates client-facing onboarding runbook docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$RunbookDir = Join-Path $ClientDir "buyer-onboarding-runbook"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $RunbookDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase62_buyer_onboarding_runbook_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $RunbookDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 62 Buyer Onboarding Runbook Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 62 Buyer Onboarding Runbook Pack..."
Write-Host ""

Write-Doc "01_BUYER_ONBOARDING_RUNBOOK.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Onboarding Runbook",
    "",
    "Purpose:",
    "",
    "This runbook explains how Raftopoulos starts using RAFTOP CPAP CARE Pro after purchase, pilot acceptance, or annual license activation.",
    "",
    "Onboarding goal:",
    "",
    "Move from platform access to controlled operational use.",
    "",
    "Required before onboarding starts:",
    "",
    "- written acceptance",
    "- billing details",
    "- payment or payment structure",
    "- commercial path selected",
    "- tenant activation",
    "- buyer sponsor named",
    "- operations owner named",
    "- technical/data contact named",
    "- data boundary confirmed",
    "",
    "Onboarding stages:",
    "",
    "1. kickoff",
    "2. user activation",
    "3. data sample review",
    "4. first login and route test",
    "5. first CPAP signal review",
    "6. ATLAS daily board routine",
    "7. first management review",
    "8. blocker review",
    "9. next scope decision",
    "",
    "Boundary:",
    "",
    "Onboarding is not unlimited implementation. It follows agreed scope and commercial path."
)

Write-Doc "02_KICKOFF_MEETING_SCRIPT.md" @(
    "# RAFTOP CPAP CARE Pro - Kickoff Meeting Script",
    "",
    "Duration:",
    "",
    "60 minutes.",
    "",
    "Required attendees:",
    "",
    "- buyer sponsor",
    "- operations owner",
    "- technical/data contact",
    "- platform owner",
    "",
    "Opening statement:",
    "",
    "The goal of this kickoff is to activate controlled use of RAFTOP CPAP CARE Pro, confirm users, confirm data boundary, confirm first review rhythm, and make sure the platform starts with operational discipline.",
    "",
    "Agenda:",
    "",
    "0-10 min: confirm commercial path and scope.",
    "10-20 min: confirm responsible owners.",
    "20-30 min: confirm users and access.",
    "30-40 min: confirm data sample and data safety.",
    "40-50 min: confirm first workflow.",
    "50-60 min: confirm blockers, first review date, and next actions.",
    "",
    "Kickoff outputs:",
    "",
    "- confirmed owner list",
    "- confirmed user list",
    "- confirmed data level",
    "- confirmed first review date",
    "- confirmed first operational workflow",
    "- blocker list",
    "",
    "Do not allow:",
    "",
    "- new feature negotiation inside kickoff",
    "- uncontrolled patient identifiers",
    "- undefined technical review",
    "- open-ended custom development"
)

Write-Doc "03_FIRST_WEEK_EXECUTION_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - First Week Execution Checklist",
    "",
    "Day 1 - Kickoff:",
    "",
    "- confirm scope",
    "- confirm owners",
    "- confirm users",
    "- confirm data boundary",
    "",
    "Day 2 - Access:",
    "",
    "- activate buyer admin",
    "- activate operations user",
    "- activate management viewer",
    "- activate technical/data contact",
    "- complete first login test",
    "",
    "Day 3 - Data:",
    "",
    "- receive CSV or sample data",
    "- validate headers",
    "- validate identifiers",
    "- confirm data sensitivity",
    "- approve preview",
    "",
    "Day 4 - Signal review:",
    "",
    "- review no-data cases",
    "- review compliance risk cases",
    "- review leak/therapy signals where data exists",
    "",
    "Day 5 - ATLAS:",
    "",
    "- create or review ATLAS actions",
    "- assign owners",
    "- set statuses",
    "- identify escalations",
    "",
    "Day 6 - Reporting:",
    "",
    "- review Quality and Profit reporting",
    "- prepare first management summary",
    "",
    "Day 7 - Review:",
    "",
    "- record blockers",
    "- confirm next actions",
    "- confirm next review date",
    "",
    "Success condition:",
    "",
    "Raftopoulos users can log in, review signals, understand ATLAS actions, and produce a first operational summary."
)

Write-Doc "04_FIRST_MONTH_OPERATING_RHYTHM.md" @(
    "# RAFTOP CPAP CARE Pro - First Month Operating Rhythm",
    "",
    "Purpose:",
    "",
    "Define the first monthly operating rhythm after activation.",
    "",
    "Week 1:",
    "",
    "- access setup",
    "- data sample review",
    "- first signal review",
    "- first ATLAS actions",
    "",
    "Week 2:",
    "",
    "- daily or periodic ATLAS review",
    "- open action follow-up",
    "- compliance risk follow-up",
    "- no-data review",
    "",
    "Week 3:",
    "",
    "- blocker resolution",
    "- workflow adjustment within agreed scope",
    "- management summary draft",
    "",
    "Week 4:",
    "",
    "- first management review",
    "- action summary",
    "- risk summary",
    "- next scope decision",
    "",
    "Recommended weekly review questions:",
    "",
    "- which no-data cases remain unresolved?",
    "- which compliance risk cases need follow-up?",
    "- which ATLAS actions are open?",
    "- who owns blocked cases?",
    "- what should management know?"
)

Write-Doc "05_ATLAS_DAILY_BOARD_ROUTINE.md" @(
    "# RAFTOP CPAP CARE Pro - ATLAS Daily Board Routine",
    "",
    "Purpose:",
    "",
    "Define daily ATLAS operating behavior.",
    "",
    "Daily board steps:",
    "",
    "1. open ATLAS board or action queue.",
    "2. review critical/high priority items.",
    "3. check no-data cases.",
    "4. check compliance risk cases.",
    "5. check leak/therapy issue signals where available.",
    "6. assign owner if missing.",
    "7. update status.",
    "8. escalate blocked cases.",
    "9. close resolved cases.",
    "10. record management-relevant notes.",
    "",
    "Minimum action fields:",
    "",
    "- patient reference",
    "- signal type",
    "- priority",
    "- owner",
    "- status",
    "- due date",
    "- note",
    "",
    "Rule:",
    "",
    "A signal without owner and status is not operational control."
)

Write-Doc "06_MANAGEMENT_REVIEW_ROUTINE.md" @(
    "# RAFTOP CPAP CARE Pro - Management Review Routine",
    "",
    "Purpose:",
    "",
    "Define what management should review.",
    "",
    "Recommended review frequency:",
    "",
    "Weekly during pilot.",
    "Monthly during annual license.",
    "",
    "Management review items:",
    "",
    "- active patient/sample scope",
    "- no-data cases",
    "- compliance risk cases",
    "- leak/therapy issue signals where available",
    "- open ATLAS actions",
    "- resolved ATLAS actions",
    "- blocked cases",
    "- operational defects",
    "- support issues",
    "- next decisions",
    "",
    "Management questions:",
    "",
    "- what changed since last review?",
    "- which risks need escalation?",
    "- which process creates the most defects?",
    "- what is the next operational improvement?",
    "- should scope expand?",
    "",
    "Output:",
    "",
    "- summary decisions",
    "- action owners",
    "- next review date"
)

Write-Doc "07_BLOCKER_AND_ESCALATION_PROCESS.md" @(
    "# RAFTOP CPAP CARE Pro - Blocker and Escalation Process",
    "",
    "Purpose:",
    "",
    "Prevent unresolved issues from becoming hidden failures.",
    "",
    "Blocker types:",
    "",
    "- login/access blocker",
    "- data file blocker",
    "- data quality blocker",
    "- role/permission blocker",
    "- ATLAS ownership blocker",
    "- support response blocker",
    "- scope/change request blocker",
    "",
    "Blocker fields:",
    "",
    "- blocker description",
    "- affected user",
    "- affected workflow",
    "- severity",
    "- owner",
    "- due date",
    "- current status",
    "- next action",
    "",
    "Escalation rule:",
    "",
    "If a blocker prevents onboarding, data intake, ATLAS review, or management reporting, it must be assigned to an owner and reviewed at the next checkpoint.",
    "",
    "Do not do:",
    "",
    "- leave blocker owner empty",
    "- solve by uncontrolled new feature request",
    "- share secrets while trying to fix access issue",
    "- mix support issue with change request"
)

Write-Doc "08_ONBOARDING_RUNBOOK_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Buyer Onboarding Runbook Index",
    "",
    "This folder contains the buyer onboarding runbook pack.",
    "",
    "Documents:",
    "",
    "01_BUYER_ONBOARDING_RUNBOOK.md",
    "02_KICKOFF_MEETING_SCRIPT.md",
    "03_FIRST_WEEK_EXECUTION_CHECKLIST.md",
    "04_FIRST_MONTH_OPERATING_RHYTHM.md",
    "05_ATLAS_DAILY_BOARD_ROUTINE.md",
    "06_MANAGEMENT_REVIEW_ROUTINE.md",
    "07_BLOCKER_AND_ESCALATION_PROCESS.md",
    "08_ONBOARDING_RUNBOOK_INDEX.md",
    "",
    "First document to open:",
    "",
    "01_BUYER_ONBOARDING_RUNBOOK.md",
    "",
    "Important:",
    "",
    "This pack is client-facing. It does not include source code, credentials, secrets, internal scripts, or developer-only notes."
)

Write-Host ""
Write-Host "Verifying buyer onboarding runbook pack..."
Write-Host ""

$RequiredDocs = @{
    "01_BUYER_ONBOARDING_RUNBOOK.md" = @("Buyer Onboarding Runbook", "Onboarding stages", "agreed scope")
    "02_KICKOFF_MEETING_SCRIPT.md" = @("Kickoff Meeting Script", "Required attendees", "Kickoff outputs")
    "03_FIRST_WEEK_EXECUTION_CHECKLIST.md" = @("First Week Execution Checklist", "Day 1", "Success condition")
    "04_FIRST_MONTH_OPERATING_RHYTHM.md" = @("First Month Operating Rhythm", "Week 4", "management summary")
    "05_ATLAS_DAILY_BOARD_ROUTINE.md" = @("ATLAS Daily Board", "owner and status", "operational control")
    "06_MANAGEMENT_REVIEW_ROUTINE.md" = @("Management Review Routine", "Management review items", "next review date")
    "07_BLOCKER_AND_ESCALATION_PROCESS.md" = @("Blocker and Escalation", "Escalation rule", "change request")
    "08_ONBOARDING_RUNBOOK_INDEX.md" = @("Buyer Onboarding Runbook Index", "First document to open", "client-facing")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $RunbookDir $Doc

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
    $FinalStatus = "PHASE62_BUYER_ONBOARDING_RUNBOOK_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE62_BUYER_ONBOARDING_RUNBOOK_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE62_BUYER_ONBOARDING_RUNBOOK_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 62 Buyer Onboarding Runbook Pack"
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