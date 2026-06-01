# RAFTOP CPAP CARE Pro
# Phase 54 - Paid Pilot / Annual Onboarding Execution Pack
# ASCII-safe version.
# Safe: creates onboarding docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsRoot "commercial-proposal"
$OnboardingDir = Join-Path $CommercialDir "onboarding-execution"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $CommercialDir -Force | Out-Null
New-Item -ItemType Directory -Path $OnboardingDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase54_onboarding_execution_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $OnboardingDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 54 Onboarding Execution Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 54 Onboarding Execution Pack..."
Write-Host ""

Write-Doc "01_ONBOARDING_MASTER_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - Onboarding Master Plan",
    "",
    "Purpose:",
    "",
    "Use this document after buyer acceptance and before starting paid pilot or annual onboarding.",
    "",
    "Onboarding principle:",
    "",
    "No operational work starts without acceptance, billing details, payment or payment structure, named owner, data boundary, and kickoff date.",
    "",
    "Commercial paths:",
    "",
    "1. 30 Day Paid Pilot.",
    "2. 90 Day Operational Pilot.",
    "3. Annual Enterprise License.",
    "",
    "Core onboarding stages:",
    "",
    "1. Acceptance confirmation.",
    "2. Billing and payment confirmation.",
    "3. Start authorization.",
    "4. Kickoff meeting.",
    "5. User and role setup.",
    "6. Data intake.",
    "7. Baseline review.",
    "8. First operational review.",
    "9. Reporting rhythm.",
    "10. Next decision gate.",
    "",
    "Rule:",
    "",
    "Onboarding is not open-ended implementation. It follows agreed scope."
)

Write-Doc "02_KICKOFF_AGENDA.md" @(
    "# RAFTOP CPAP CARE Pro - Kickoff Agenda",
    "",
    "Duration:",
    "",
    "60 minutes",
    "",
    "Agenda:",
    "",
    "0-10 min: Confirm commercial path and scope.",
    "10-20 min: Confirm buyer owner, operations owner, and technical/data contact.",
    "20-30 min: Confirm data boundary and data source.",
    "30-40 min: Confirm users, roles, and access levels.",
    "40-50 min: Confirm KPIs and reporting rhythm.",
    "50-60 min: Confirm next actions and first review date.",
    "",
    "Required attendees:",
    "",
    "- buyer sponsor",
    "- operations owner",
    "- technical or data contact",
    "- RAFTOP owner",
    "",
    "Kickoff outputs:",
    "",
    "- confirmed scope",
    "- confirmed start date",
    "- confirmed data approach",
    "- confirmed roles",
    "- confirmed first review date",
    "- documented blockers",
    "",
    "Do not allow:",
    "",
    "- new feature negotiation inside kickoff",
    "- real patient data without data/legal boundary",
    "- open-ended custom development requests"
)

Write-Doc "03_DATA_INTAKE_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Data Intake Checklist",
    "",
    "Purpose:",
    "",
    "Use this before accepting any pilot or annual data sample.",
    "",
    "Preferred data levels:",
    "",
    "- demo data",
    "- anonymized data",
    "- pseudonymized data",
    "- real data only with legal or DPA framework",
    "",
    "Required data fields if available:",
    "",
    "- patient reference code",
    "- device reference code",
    "- date",
    "- usage hours",
    "- no-data status",
    "- leak metric",
    "- AHI metric if available",
    "- follow-up status if available",
    "- assigned owner if available",
    "",
    "Accepted file types:",
    "",
    "- CSV",
    "- Excel export converted to CSV",
    "- structured sample table",
    "",
    "Data intake rules:",
    "",
    "- do not accept uncontrolled patient identifiers without agreement",
    "- do not accept unclear columns",
    "- do not import before preview and validation",
    "- do not mix production data with demo data without clear label",
    "",
    "Data owner confirmation:",
    "",
    "- data source:",
    "- data contact:",
    "- data date range:",
    "- patient count:",
    "- file format:",
    "- sensitivity level:"
)

Write-Doc "04_USER_ROLE_SETUP.md" @(
    "# RAFTOP CPAP CARE Pro - User and Role Setup",
    "",
    "Purpose:",
    "",
    "Define who gets access and why.",
    "",
    "Suggested roles:",
    "",
    "Super admin:",
    "",
    "- platform-level control",
    "- release and access oversight",
    "",
    "Buyer admin:",
    "",
    "- manages buyer users",
    "- sees operational overview",
    "",
    "Operations user:",
    "",
    "- works ATLAS actions",
    "- reviews patients and follow-ups",
    "",
    "Management viewer:",
    "",
    "- sees reports and executive summaries",
    "",
    "Technical or data contact:",
    "",
    "- supports data intake and issue diagnosis",
    "",
    "Doctor or clinic viewer:",
    "",
    "- future expansion only",
    "- limited access",
    "",
    "Access rule:",
    "",
    "Give minimum necessary access. Do not give admin access to every user.",
    "",
    "User setup fields:",
    "",
    "- name",
    "- email",
    "- role",
    "- access level",
    "- tenant",
    "- active/inactive status",
    "- notes"
)

Write-Doc "05_30_DAY_PILOT_EXECUTION_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - 30 Day Pilot Execution Plan",
    "",
    "Duration:",
    "",
    "30 days",
    "",
    "Goal:",
    "",
    "Fast validation of operational value.",
    "",
    "Week 0:",
    "",
    "- acceptance",
    "- billing/payment",
    "- kickoff",
    "- data sample confirmation",
    "- user setup",
    "",
    "Week 1:",
    "",
    "- baseline review",
    "- no-data review",
    "- compliance risk review",
    "- first ATLAS action check",
    "",
    "Week 2:",
    "",
    "- issue review",
    "- action status review",
    "- early blockers",
    "",
    "Week 3:",
    "",
    "- improvement review",
    "- unresolved cases",
    "- buyer feedback",
    "",
    "Week 4:",
    "",
    "- final pilot summary",
    "- commercial recommendation",
    "- next step decision",
    "",
    "Final decision options:",
    "",
    "- extend to 90 day operational pilot",
    "- move to annual enterprise license",
    "- stop"
)

Write-Doc "06_90_DAY_PILOT_EXECUTION_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - 90 Day Operational Pilot Execution Plan",
    "",
    "Duration:",
    "",
    "90 days",
    "",
    "Goal:",
    "",
    "Measure operational value with KPIs and weekly reviews.",
    "",
    "Phase 1 - Setup and baseline:",
    "",
    "- kickoff",
    "- users",
    "- data sample",
    "- baseline KPIs",
    "- ATLAS categories",
    "",
    "Phase 2 - Operational rhythm:",
    "",
    "- weekly reviews",
    "- no-data tracking",
    "- compliance risk tracking",
    "- leak/therapy issue tracking",
    "- ATLAS owner/status tracking",
    "",
    "Phase 3 - Midpoint review:",
    "",
    "- review adoption",
    "- review blockers",
    "- adjust workflow if needed",
    "- confirm remaining pilot goals",
    "",
    "Phase 4 - Final report:",
    "",
    "- baseline vs final view",
    "- action summary",
    "- unresolved defects",
    "- Quality and Profit interpretation",
    "- annual license recommendation",
    "",
    "Final decision options:",
    "",
    "- annual enterprise license",
    "- extended pilot",
    "- pause or stop"
)

Write-Doc "07_ANNUAL_ONBOARDING_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - Annual Onboarding Plan",
    "",
    "Purpose:",
    "",
    "Use this if buyer proceeds directly to annual enterprise license.",
    "",
    "Month 0:",
    "",
    "- acceptance",
    "- billing",
    "- onboarding payment",
    "- scope confirmation",
    "- user/role setup",
    "- data boundary",
    "- kickoff",
    "",
    "Month 1:",
    "",
    "- first operational data sample",
    "- baseline report",
    "- ATLAS workflow alignment",
    "- first management review",
    "",
    "Month 2:",
    "",
    "- support rhythm",
    "- no-data workflow",
    "- compliance risk workflow",
    "- leak/therapy issue workflow",
    "",
    "Month 3:",
    "",
    "- executive review",
    "- adoption review",
    "- change request backlog",
    "",
    "Months 4-12:",
    "",
    "- monthly management reports",
    "- governance reviews",
    "- controlled improvements",
    "- doctor/clinic expansion discussion only after internal adoption is stable",
    "",
    "Annual rule:",
    "",
    "Annual license is not unlimited development. New modules and integrations require scope and approval."
)

Write-Doc "08_FIRST_REVIEW_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - First Review Checklist",
    "",
    "Use this for the first review after kickoff.",
    "",
    "Review items:",
    "",
    "- users can log in",
    "- buyer routes load",
    "- data sample received",
    "- data sample understood",
    "- no-data cases visible",
    "- compliance risk cases visible",
    "- leak/therapy issues visible where data exists",
    "- ATLAS action process understood",
    "- owners assigned",
    "- blockers documented",
    "- next review date confirmed",
    "",
    "Questions:",
    "",
    "- what is unclear?",
    "- what blocks adoption?",
    "- which cases need attention first?",
    "- who owns action closure?",
    "- is data quality sufficient?",
    "",
    "Output:",
    "",
    "- first review notes",
    "- blocker list",
    "- owner list",
    "- next action list"
)

Write-Doc "09_ONBOARDING_TRACKER.md" @(
    "# RAFTOP CPAP CARE Pro - Onboarding Tracker",
    "",
    "Commercial path:",
    "",
    "- 30 Day Paid Pilot",
    "- 90 Day Operational Pilot",
    "- Annual Enterprise License",
    "",
    "Buyer sponsor:",
    "",
    "Operations owner:",
    "",
    "Technical/data contact:",
    "",
    "Kickoff date:",
    "",
    "First review date:",
    "",
    "Data level:",
    "",
    "- demo",
    "- anonymized",
    "- pseudonymized",
    "- real data with legal/DPA framework",
    "",
    "Setup checklist:",
    "",
    "- acceptance confirmed",
    "- billing details received",
    "- payment/payment structure confirmed",
    "- start authorization confirmed",
    "- users confirmed",
    "- roles confirmed",
    "- data sample confirmed",
    "- first review scheduled",
    "",
    "Blockers:",
    "",
    "- blocker:",
    "- owner:",
    "- due date:",
    "- status:",
    "",
    "Next action:",
    "",
    "- action:",
    "- owner:",
    "- deadline:"
)

Write-Host ""
Write-Host "Verifying onboarding execution pack..."
Write-Host ""

$RequiredDocs = @{
    "01_ONBOARDING_MASTER_PLAN.md" = @("Onboarding Master Plan", "No operational work starts", "agreed scope")
    "02_KICKOFF_AGENDA.md" = @("Kickoff Agenda", "Required attendees", "Kickoff outputs")
    "03_DATA_INTAKE_CHECKLIST.md" = @("Data Intake Checklist", "Preferred data levels", "Data intake rules")
    "04_USER_ROLE_SETUP.md" = @("User and Role Setup", "minimum necessary access", "Operations user")
    "05_30_DAY_PILOT_EXECUTION_PLAN.md" = @("30 Day Pilot Execution Plan", "Week 4", "Final decision options")
    "06_90_DAY_PILOT_EXECUTION_PLAN.md" = @("90 Day Operational Pilot", "Midpoint review", "Final report")
    "07_ANNUAL_ONBOARDING_PLAN.md" = @("Annual Onboarding Plan", "Month 0", "unlimited development")
    "08_FIRST_REVIEW_CHECKLIST.md" = @("First Review Checklist", "blockers documented", "next review date")
    "09_ONBOARDING_TRACKER.md" = @("Onboarding Tracker", "Commercial path", "Blockers")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $OnboardingDir $Doc

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
    $FinalStatus = "PHASE54_ONBOARDING_EXECUTION_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE54_ONBOARDING_EXECUTION_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE54_ONBOARDING_EXECUTION_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 54 Onboarding Execution Pack"
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