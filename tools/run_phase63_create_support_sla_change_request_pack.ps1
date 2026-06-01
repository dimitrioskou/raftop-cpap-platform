# RAFTOP CPAP CARE Pro
# Phase 63 - Support SLA and Change Request Boundary Pack
# ASCII-safe version.
# Safe: creates client-facing support/SLA/change request docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$SupportDir = Join-Path $ClientDir "support-sla-change-requests"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $SupportDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase63_support_sla_change_request_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $SupportDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 63 Support SLA and Change Request Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 63 Support SLA and Change Request Pack..."
Write-Host ""

Write-Doc "01_SUPPORT_SCOPE_OVERVIEW.md" @(
    "# RAFTOP CPAP CARE Pro - Support Scope Overview",
    "",
    "Purpose:",
    "",
    "Define what support includes and what requires separate scope.",
    "",
    "Included support within agreed commercial path:",
    "",
    "- access issue review",
    "- login guidance",
    "- route availability review",
    "- agreed workflow questions",
    "- data intake clarification",
    "- CSV template clarification",
    "- ATLAS workflow guidance",
    "- reporting usage guidance",
    "- incident triage",
    "- bug investigation within agreed scope",
    "",
    "Not included as standard support:",
    "",
    "- new features",
    "- new dashboards",
    "- live AirView integration",
    "- mobile app",
    "- doctor portal production expansion",
    "- ERP/CRM integration",
    "- unlimited custom development",
    "- unplanned data migration",
    "- 24/7 support unless contracted",
    "",
    "Support principle:",
    "",
    "Support keeps the agreed platform operating. It does not create unlimited new product scope.",
    "",
    "Boundary:",
    "",
    "New functionality requires change request approval."
)

Write-Doc "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md" @(
    "# RAFTOP CPAP CARE Pro - Support Channels and Response Times",
    "",
    "Purpose:",
    "",
    "Define how Raftopoulos submits support issues.",
    "",
    "Preferred support channels:",
    "",
    "- agreed email channel",
    "- agreed support contact",
    "- scheduled review meeting",
    "- structured issue tracker if later agreed",
    "",
    "Do not submit support through:",
    "",
    "- random group chats",
    "- voice notes without written issue details",
    "- screenshots containing passwords",
    "- files with uncontrolled patient identifiers",
    "- messages containing tokens or secrets",
    "",
    "Indicative response targets:",
    "",
    "Critical access blocker:",
    "Target first response: same business day where possible.",
    "",
    "High operational blocker:",
    "Target first response: within 1 business day.",
    "",
    "Normal support question:",
    "Target first response: within 2 business days.",
    "",
    "Change request:",
    "Response after scope review, not treated as urgent support.",
    "",
    "Rule:",
    "",
    "Support speed depends on issue clarity, severity, and whether it is inside agreed scope."
)

Write-Doc "03_INCIDENT_SEVERITY_LEVELS.md" @(
    "# RAFTOP CPAP CARE Pro - Incident Severity Levels",
    "",
    "Severity 1 - Critical:",
    "",
    "Definition:",
    "Authorized users cannot access the platform or a core agreed workflow is blocked.",
    "",
    "Examples:",
    "- production login unavailable",
    "- tenant access unavailable",
    "- major route inaccessible for all authorized users",
    "",
    "Severity 2 - High:",
    "",
    "Definition:",
    "Important operational workflow is affected but workaround exists.",
    "",
    "Examples:",
    "- CSV sample cannot be reviewed",
    "- ATLAS workflow issue affects assigned users",
    "- reporting route loads but expected content is unclear",
    "",
    "Severity 3 - Normal:",
    "",
    "Definition:",
    "Question, clarification, minor issue or non-blocking behavior.",
    "",
    "Examples:",
    "- role clarification",
    "- workflow question",
    "- field dictionary question",
    "",
    "Severity 4 - Change Request:",
    "",
    "Definition:",
    "New feature, new module, new integration, new dashboard or scope expansion.",
    "",
    "Rule:",
    "",
    "Not every request is an incident. Some requests are paid change requests."
)

Write-Doc "04_BUG_VS_CHANGE_REQUEST.md" @(
    "# RAFTOP CPAP CARE Pro - Bug vs Change Request",
    "",
    "Bug:",
    "",
    "A bug is when an agreed function does not behave as intended within agreed scope.",
    "",
    "Examples:",
    "- login route fails for authorized user",
    "- agreed buyer route is unavailable",
    "- CSV template documentation has an error",
    "- support document contains conflicting instruction",
    "",
    "Change request:",
    "",
    "A change request is a request to add, modify, expand or customize functionality beyond agreed scope.",
    "",
    "Examples:",
    "- add new dashboard",
    "- add live AirView integration",
    "- add mobile app",
    "- add doctor portal production rollout",
    "- add new AI module",
    "- add custom report",
    "- change pricing package logic",
    "",
    "Decision rule:",
    "",
    "If it was agreed and it fails, treat as bug.",
    "If it is new or expanded scope, treat as change request.",
    "",
    "Commercial rule:",
    "",
    "Change requests require written scope, effort estimate, price or commercial approval, and timeline."
)

Write-Doc "05_CHANGE_REQUEST_TEMPLATE.md" @(
    "# RAFTOP CPAP CARE Pro - Change Request Template",
    "",
    "Use this when Raftopoulos requests new scope.",
    "",
    "Change request fields:",
    "",
    "- request title:",
    "- requested by:",
    "- date:",
    "- business reason:",
    "- affected users:",
    "- affected workflow:",
    "- expected value:",
    "- priority: low / medium / high",
    "- desired deadline:",
    "- data impact:",
    "- security impact:",
    "- reporting impact:",
    "- resale impact:",
    "- approval owner:",
    "",
    "Classification:",
    "",
    "- new feature",
    "- integration",
    "- dashboard/report",
    "- workflow change",
    "- data change",
    "- doctor/clinic expansion",
    "- mobile app",
    "- other",
    "",
    "Approval rule:",
    "",
    "No change request starts without written approval of scope, cost, and timeline.",
    "",
    "Boundary:",
    "",
    "Change request approval is separate from support."
)

Write-Doc "06_OUT_OF_SCOPE_ITEMS.md" @(
    "# RAFTOP CPAP CARE Pro - Out of Scope Items",
    "",
    "The following are not included unless separately agreed:",
    "",
    "- live AirView integration",
    "- automatic AirView API connection",
    "- full mobile app",
    "- patient app",
    "- full doctor portal production rollout",
    "- ERP integration",
    "- CRM integration",
    "- EOPYY integration",
    "- automated billing integration",
    "- unlimited custom dashboards",
    "- unlimited data migration",
    "- 24/7 emergency support",
    "- clinical diagnosis or medical decision automation",
    "- unrestricted source code handover",
    "- unrestricted resale rights",
    "",
    "Reason:",
    "",
    "These items require separate technical, legal, commercial, or implementation scope.",
    "",
    "Rule:",
    "",
    "Out of scope does not mean impossible. It means separate approval and pricing."
)

Write-Doc "07_SUPPORT_REQUEST_FORM.md" @(
    "# RAFTOP CPAP CARE Pro - Support Request Form",
    "",
    "Use this format for support issues.",
    "",
    "Required fields:",
    "",
    "- date:",
    "- requester name:",
    "- requester role:",
    "- affected user:",
    "- affected route/screen:",
    "- issue category:",
    "- severity:",
    "- description:",
    "- expected behavior:",
    "- actual behavior:",
    "- screenshot attached if safe:",
    "- patient reference if allowed:",
    "- data file involved: yes/no",
    "- urgency reason:",
    "- business impact:",
    "",
    "Issue categories:",
    "",
    "- access",
    "- data",
    "- ATLAS workflow",
    "- compliance view",
    "- reports",
    "- tenant/user role",
    "- support clarification",
    "- change request",
    "",
    "Do not include:",
    "",
    "- passwords",
    "- tokens",
    "- secrets",
    "- database URLs",
    "- uncontrolled patient identifiers",
    "",
    "Rule:",
    "",
    "Incomplete support requests may require clarification before action."
)

Write-Doc "08_SLA_AND_CHANGE_REQUEST_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Support SLA and Change Request Pack Index",
    "",
    "This folder contains the client-facing support, SLA and change request boundary pack.",
    "",
    "Documents:",
    "",
    "01_SUPPORT_SCOPE_OVERVIEW.md",
    "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md",
    "03_INCIDENT_SEVERITY_LEVELS.md",
    "04_BUG_VS_CHANGE_REQUEST.md",
    "05_CHANGE_REQUEST_TEMPLATE.md",
    "06_OUT_OF_SCOPE_ITEMS.md",
    "07_SUPPORT_REQUEST_FORM.md",
    "08_SLA_AND_CHANGE_REQUEST_INDEX.md",
    "",
    "First document to open:",
    "",
    "01_SUPPORT_SCOPE_OVERVIEW.md",
    "",
    "Important:",
    "",
    "This pack is client-facing. It does not include source code, credentials, secrets, internal scripts, or developer-only notes.",
    "",
    "Core rule:",
    "",
    "Support is not unlimited custom development."
)

Write-Host ""
Write-Host "Verifying support SLA and change request pack..."
Write-Host ""

$RequiredDocs = @{
    "01_SUPPORT_SCOPE_OVERVIEW.md" = @("Support Scope Overview", "Not included", "change request")
    "02_SUPPORT_CHANNELS_AND_RESPONSE_TIMES.md" = @("Support Channels", "Critical access blocker", "business day")
    "03_INCIDENT_SEVERITY_LEVELS.md" = @("Incident Severity", "Severity 1", "Change Request")
    "04_BUG_VS_CHANGE_REQUEST.md" = @("Bug vs Change Request", "If it was agreed and it fails", "expanded scope")
    "05_CHANGE_REQUEST_TEMPLATE.md" = @("Change Request Template", "approval owner", "scope, cost, and timeline")
    "06_OUT_OF_SCOPE_ITEMS.md" = @("Out of Scope", "live AirView integration", "separate approval and pricing")
    "07_SUPPORT_REQUEST_FORM.md" = @("Support Request Form", "Required fields", "Do not include")
    "08_SLA_AND_CHANGE_REQUEST_INDEX.md" = @("Support SLA", "First document to open", "unlimited custom development")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $SupportDir $Doc

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
    $FinalStatus = "PHASE63_SUPPORT_SLA_CHANGE_REQUEST_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE63_SUPPORT_SLA_CHANGE_REQUEST_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE63_SUPPORT_SLA_CHANGE_REQUEST_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 63 Support SLA and Change Request Pack"
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