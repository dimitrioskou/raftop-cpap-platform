# RAFTOP CPAP CARE Pro
# Phase 59 - Client Start Pack
# ASCII-safe version.
# Safe: creates client-facing start docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase59_client_start_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $ClientDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 59 Client Start Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 59 Client Start Pack..."
Write-Host ""

Write-Doc "01_START_HERE_RAFTOP_CPAP_CARE_PRO.md" @(
    "# RAFTOP CPAP CARE Pro - Start Here",
    "",
    "Purpose:",
    "",
    "This is the first document for Raftopoulos after purchase or pilot acceptance.",
    "",
    "What Raftopoulos receives:",
    "",
    "RAFTOP CPAP CARE Pro is a CPAP Operations Control Layer for monitoring CPAP patients, identifying no-data cases, reviewing compliance risk, organizing ATLAS actions, supporting follow-ups, and creating management visibility.",
    "",
    "What it is not:",
    "",
    "It is not a diagnostic medical device.",
    "It does not replace physician judgment.",
    "",
    "Production frontend:",
    "",
    "https://raftop-cpap-frontend.onrender.com",
    "",
    "Backend health:",
    "",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "First operational goal:",
    "",
    "Use the platform to create visibility and action discipline around CPAP patients.",
    "",
    "First workflow:",
    "",
    "1. Login.",
    "2. Review dashboard.",
    "3. Review no-data cases.",
    "4. Review compliance risk cases.",
    "5. Review leak or therapy issue signals where data exists.",
    "6. Create or review ATLAS actions.",
    "7. Assign owners.",
    "8. Review open actions.",
    "9. Prepare management summary.",
    "",
    "Important rule:",
    "",
    "Do not share passwords, tokens, secrets, database URLs, or patient identifiers through unsecured channels."
)

Write-Doc "02_PLATFORM_ACCESS_GUIDE.md" @(
    "# RAFTOP CPAP CARE Pro - Platform Access Guide",
    "",
    "Purpose:",
    "",
    "Explain how the buyer accesses the platform safely.",
    "",
    "Access URL:",
    "",
    "https://raftop-cpap-frontend.onrender.com/login",
    "",
    "Recommended first users:",
    "",
    "1. Buyer Admin.",
    "2. CPAP Operations User.",
    "3. Management Viewer.",
    "4. Technical/Data Contact.",
    "",
    "Credential rule:",
    "",
    "Credentials must be delivered separately through a controlled channel.",
    "",
    "Do not send:",
    "",
    "- passwords in group chat",
    "- admin passwords by public email",
    "- database credentials",
    "- tokens",
    "- Render settings",
    "- GitHub secrets",
    "",
    "Access control rule:",
    "",
    "Give each user the minimum access required for their role.",
    "",
    "If a user leaves or changes role:",
    "",
    "Disable or update access immediately."
)

Write-Doc "03_FIRST_7_DAYS_ONBOARDING_PLAN.md" @(
    "# RAFTOP CPAP CARE Pro - First 7 Days Onboarding Plan",
    "",
    "Day 1 - Kickoff and access:",
    "",
    "- confirm buyer owner",
    "- confirm operations owner",
    "- confirm technical/data contact",
    "- confirm access users",
    "",
    "Day 2 - User roles:",
    "",
    "- assign admin user",
    "- assign operations user",
    "- assign management viewer",
    "- assign technical/data contact",
    "",
    "Day 3 - Data sample:",
    "",
    "- confirm data level",
    "- review first sample",
    "- check field names",
    "- confirm data safety",
    "",
    "Day 4 - First CPAP signal review:",
    "",
    "- review no-data examples",
    "- review compliance risk examples",
    "- review leak/therapy signals where data exists",
    "",
    "Day 5 - ATLAS workflow:",
    "",
    "- create/review ATLAS actions",
    "- assign owners",
    "- set statuses",
    "",
    "Day 6 - Management reporting:",
    "",
    "- review Quality and Profit view",
    "- define first management summary",
    "",
    "Day 7 - Feedback and blockers:",
    "",
    "- record blockers",
    "- confirm next review",
    "- decide next scope step"
)

Write-Doc "04_DAILY_CPAP_OPERATIONS_WORKFLOW.md" @(
    "# RAFTOP CPAP CARE Pro - Daily CPAP Operations Workflow",
    "",
    "Purpose:",
    "",
    "Define daily operational use.",
    "",
    "Daily workflow:",
    "",
    "1. Login.",
    "2. Review patient overview.",
    "3. Check no-data cases.",
    "4. Check compliance risk cases.",
    "5. Check leak or therapy issue signals where available.",
    "6. Review ATLAS queue.",
    "7. Assign actions.",
    "8. Update statuses.",
    "9. Escalate blocked cases.",
    "10. Prepare daily or weekly summary.",
    "",
    "Action ownership:",
    "",
    "Every important signal should have an owner or a documented reason why no action is needed.",
    "",
    "Management value:",
    "",
    "The goal is not only to see data. The goal is to turn signals into actions."
)

Write-Doc "05_ATLAS_ACTIONS_GUIDE.md" @(
    "# RAFTOP CPAP CARE Pro - ATLAS Actions Guide",
    "",
    "Purpose:",
    "",
    "Explain ATLAS action handling.",
    "",
    "ATLAS action types:",
    "",
    "- compliance risk",
    "- no-data case",
    "- leak or therapy issue",
    "- follow-up required",
    "- technical/data issue",
    "- management review item",
    "",
    "Action fields:",
    "",
    "- patient reference",
    "- signal type",
    "- priority",
    "- owner",
    "- status",
    "- due date",
    "- notes",
    "",
    "Recommended statuses:",
    "",
    "- open",
    "- in progress",
    "- waiting",
    "- resolved",
    "- escalated",
    "",
    "Rule:",
    "",
    "An ATLAS action without owner and status is not operational control."
)

Write-Doc "06_COMPLIANCE_NO_DATA_LEAK_WORKFLOW.md" @(
    "# RAFTOP CPAP CARE Pro - Compliance, No-Data and Leak Workflow",
    "",
    "Purpose:",
    "",
    "Define the first clinical-operational signals to review.",
    "",
    "No-data workflow:",
    "",
    "1. Identify patient/device without data.",
    "2. Check whether data absence is expected.",
    "3. Assign follow-up owner.",
    "4. Record action status.",
    "5. Escalate unresolved cases.",
    "",
    "Compliance risk workflow:",
    "",
    "1. Identify low or declining usage.",
    "2. Assign follow-up action.",
    "3. Record patient contact or action outcome.",
    "4. Recheck at next review.",
    "",
    "Leak or therapy signal workflow:",
    "",
    "1. Identify high leak or therapy issue signal where data exists.",
    "2. Assign technical or clinical review action.",
    "3. Record outcome.",
    "",
    "Boundary:",
    "",
    "The platform supports operations and follow-up prioritization. It does not replace medical judgment."
)

Write-Doc "07_USER_ROLES_AND_PERMISSIONS.md" @(
    "# RAFTOP CPAP CARE Pro - User Roles and Permissions",
    "",
    "Recommended roles:",
    "",
    "Buyer Admin:",
    "",
    "- manages buyer-side access",
    "- sees operational overview",
    "",
    "CPAP Operations User:",
    "",
    "- reviews patient signals",
    "- works ATLAS actions",
    "- updates follow-up status",
    "",
    "Management Viewer:",
    "",
    "- sees executive summaries",
    "- reviews reporting outputs",
    "",
    "Technical/Data Contact:",
    "",
    "- supports data sample",
    "- checks import/data issues",
    "",
    "Access principle:",
    "",
    "Minimum necessary access.",
    "",
    "Do not give admin access to every user."
)

Write-Doc "08_SUPPORT_AND_INCIDENT_PROCESS.md" @(
    "# RAFTOP CPAP CARE Pro - Support and Incident Process",
    "",
    "Support categories:",
    "",
    "1. Access issue.",
    "2. Data issue.",
    "3. Operational workflow question.",
    "4. Technical issue.",
    "5. Change request.",
    "",
    "Incident information to record:",
    "",
    "- date",
    "- user",
    "- affected screen",
    "- description",
    "- urgency",
    "- screenshot if safe",
    "- patient reference only if allowed",
    "- owner",
    "",
    "Do not send:",
    "",
    "- passwords",
    "- tokens",
    "- secrets",
    "- database URLs",
    "- patient identifiers through unsecured channels",
    "",
    "Rule:",
    "",
    "Support covers agreed scope. New features are change requests."
)

Write-Doc "09_CHANGE_REQUEST_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - Change Request Rules",
    "",
    "Purpose:",
    "",
    "Prevent uncontrolled scope expansion.",
    "",
    "A change request is required for:",
    "",
    "- new feature",
    "- new module",
    "- new dashboard",
    "- custom report",
    "- live AirView integration",
    "- mobile app",
    "- doctor portal expansion",
    "- ERP/CRM integration",
    "- additional automation",
    "",
    "Change request fields:",
    "",
    "- requested change",
    "- business reason",
    "- priority",
    "- expected value",
    "- affected users",
    "- deadline",
    "- approval owner",
    "",
    "Rule:",
    "",
    "Paid product support is not unlimited custom development."
)

Write-Doc "10_CLIENT_START_PACK_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Client Start Pack Index",
    "",
    "This folder contains the client-facing start pack for Raftopoulos.",
    "",
    "Documents:",
    "",
    "01_START_HERE_RAFTOP_CPAP_CARE_PRO.md",
    "02_PLATFORM_ACCESS_GUIDE.md",
    "03_FIRST_7_DAYS_ONBOARDING_PLAN.md",
    "04_DAILY_CPAP_OPERATIONS_WORKFLOW.md",
    "05_ATLAS_ACTIONS_GUIDE.md",
    "06_COMPLIANCE_NO_DATA_LEAK_WORKFLOW.md",
    "07_USER_ROLES_AND_PERMISSIONS.md",
    "08_SUPPORT_AND_INCIDENT_PROCESS.md",
    "09_CHANGE_REQUEST_RULES.md",
    "10_CLIENT_START_PACK_INDEX.md",
    "",
    "First document to open:",
    "",
    "01_START_HERE_RAFTOP_CPAP_CARE_PRO.md",
    "",
    "Important:",
    "",
    "This pack is buyer-facing. It does not include source code, credentials, secrets, internal scripts, or developer-only notes."
)

Write-Host ""
Write-Host "Verifying client start pack..."
Write-Host ""

$RequiredDocs = @{
    "01_START_HERE_RAFTOP_CPAP_CARE_PRO.md" = @("Start Here", "Production frontend", "not a diagnostic medical device")
    "02_PLATFORM_ACCESS_GUIDE.md" = @("Platform Access Guide", "Credential rule", "minimum access")
    "03_FIRST_7_DAYS_ONBOARDING_PLAN.md" = @("First 7 Days", "Day 1", "Day 7")
    "04_DAILY_CPAP_OPERATIONS_WORKFLOW.md" = @("Daily CPAP Operations Workflow", "Daily workflow", "signals into actions")
    "05_ATLAS_ACTIONS_GUIDE.md" = @("ATLAS Actions Guide", "Recommended statuses", "owner and status")
    "06_COMPLIANCE_NO_DATA_LEAK_WORKFLOW.md" = @("No-data workflow", "Compliance risk workflow", "medical judgment")
    "07_USER_ROLES_AND_PERMISSIONS.md" = @("User Roles", "Buyer Admin", "Minimum necessary access")
    "08_SUPPORT_AND_INCIDENT_PROCESS.md" = @("Support and Incident", "Support categories", "New features")
    "09_CHANGE_REQUEST_RULES.md" = @("Change Request Rules", "live AirView integration", "unlimited custom development")
    "10_CLIENT_START_PACK_INDEX.md" = @("Client Start Pack Index", "First document to open", "buyer-facing")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $ClientDir $Doc

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
    $FinalStatus = "PHASE59_CLIENT_START_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE59_CLIENT_START_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE59_CLIENT_START_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 59 Client Start Pack"
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