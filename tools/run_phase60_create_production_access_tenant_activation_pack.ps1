# RAFTOP CPAP CARE Pro
# Phase 60 - Production Access and Tenant Activation Pack
# ASCII-safe version.
# Safe: creates client-facing access and tenant activation docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$AccessDir = Join-Path $ClientDir "production-access-tenant-activation"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $AccessDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase60_production_access_tenant_activation_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $AccessDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 60 Production Access and Tenant Activation Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 60 Production Access and Tenant Activation Pack..."
Write-Host ""

Write-Doc "01_PRODUCTION_ACCESS_OVERVIEW.md" @(
    "# RAFTOP CPAP CARE Pro - Production Access Overview",
    "",
    "Purpose:",
    "",
    "This document explains how Raftopoulos starts production access safely.",
    "",
    "Production frontend:",
    "",
    "https://raftop-cpap-frontend.onrender.com",
    "",
    "Login URL:",
    "",
    "https://raftop-cpap-frontend.onrender.com/login",
    "",
    "Backend health:",
    "",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "First access objective:",
    "",
    "Confirm that authorized Raftopoulos users can log in, see the correct buyer environment, and access the intended operational routes.",
    "",
    "Access principle:",
    "",
    "Minimum necessary access.",
    "",
    "Do not share:",
    "",
    "- master credentials",
    "- passwords in group chats",
    "- tokens",
    "- database credentials",
    "- Render secrets",
    "- GitHub secrets",
    "- raw logs",
    "",
    "Important:",
    "",
    "Production access is not source code handover. It is controlled platform access."
)

Write-Doc "02_TENANT_ACTIVATION_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Tenant Activation Checklist",
    "",
    "Purpose:",
    "",
    "Use this checklist to activate the Raftopoulos buyer environment.",
    "",
    "Tenant activation fields:",
    "",
    "- tenant name: Raftopoulos",
    "- tenant type: enterprise buyer",
    "- tenant status: active",
    "- billing status: accepted or pilot-active",
    "- commercial path: 30 day pilot / 90 day pilot / annual license",
    "- user limit:",
    "- module access:",
    "- support level:",
    "- start date:",
    "- renewal or review date:",
    "",
    "Activation checklist:",
    "",
    "- buyer acceptance confirmed",
    "- billing/payment structure confirmed",
    "- tenant active",
    "- buyer admin user created",
    "- operations user created",
    "- management viewer created",
    "- technical/data contact created",
    "- demo or approved sample data available",
    "- first login test completed",
    "- route access checked",
    "- support owner confirmed",
    "",
    "No-start rule:",
    "",
    "Do not activate production access without commercial acceptance, named owner, and data boundary."
)

Write-Doc "03_INITIAL_USER_SETUP.md" @(
    "# RAFTOP CPAP CARE Pro - Initial User Setup",
    "",
    "Purpose:",
    "",
    "Define the first users for Raftopoulos.",
    "",
    "Recommended first users:",
    "",
    "1. Buyer Admin",
    "",
    "Role:",
    "- manages buyer-side access",
    "- sees operational overview",
    "- can coordinate onboarding",
    "",
    "2. CPAP Operations User",
    "",
    "Role:",
    "- reviews no-data cases",
    "- reviews compliance risk",
    "- works ATLAS actions",
    "- updates follow-up status",
    "",
    "3. Management Viewer",
    "",
    "Role:",
    "- reviews reports",
    "- sees Quality and Profit summaries",
    "- supports management decision-making",
    "",
    "4. Technical/Data Contact",
    "",
    "Role:",
    "- supports data sample",
    "- reviews import/data issues",
    "- coordinates data corrections",
    "",
    "User setup fields:",
    "",
    "- full name",
    "- email",
    "- role",
    "- access level",
    "- tenant",
    "- active/inactive",
    "- notes",
    "",
    "Access rule:",
    "",
    "Do not give admin access to every user."
)

Write-Doc "04_CREDENTIAL_DELIVERY_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - Credential Delivery Rules",
    "",
    "Purpose:",
    "",
    "Prevent unsafe credential sharing.",
    "",
    "Allowed:",
    "",
    "- send username and temporary password through separate controlled channels",
    "- force password change where available",
    "- confirm user identity before providing access",
    "- disable users who no longer need access",
    "",
    "Not allowed:",
    "",
    "- sending passwords in group chats",
    "- sending admin credentials in public email thread",
    "- sharing one account across multiple users",
    "- sharing database credentials",
    "- sharing tokens",
    "- sharing secrets",
    "- sharing GitHub or Render secret settings",
    "",
    "Credential delivery checklist:",
    "",
    "- user confirmed",
    "- role confirmed",
    "- email confirmed",
    "- credential channel confirmed",
    "- temporary password delivered",
    "- login tested",
    "- password change requested if applicable",
    "",
    "Rule:",
    "",
    "Credentials are operational access, not casual messages."
)

Write-Doc "05_DEMO_SAMPLE_DATA_ACTIVATION.md" @(
    "# RAFTOP CPAP CARE Pro - Demo and Sample Data Activation",
    "",
    "Purpose:",
    "",
    "Ensure the buyer environment does not look empty during first use.",
    "",
    "Recommended first data state:",
    "",
    "- demo patients or approved sample patients",
    "- no-data examples",
    "- compliance risk examples",
    "- leak or therapy signal examples where available",
    "- ATLAS action examples",
    "- management reporting examples",
    "",
    "Data safety rule:",
    "",
    "Use demo, anonymized or pseudonymized data unless real patient data has legal/data protection approval.",
    "",
    "Sample data checklist:",
    "",
    "- sample data source confirmed",
    "- fields reviewed",
    "- patient identifiers removed or controlled",
    "- data sensitivity confirmed",
    "- no-data examples available",
    "- compliance risk examples available",
    "- ATLAS examples available",
    "- management summary available",
    "",
    "Rule:",
    "",
    "A buyer should not enter an empty system during first operational review."
)

Write-Doc "06_FIRST_LOGIN_AND_ROUTE_TEST.md" @(
    "# RAFTOP CPAP CARE Pro - First Login and Route Test",
    "",
    "Purpose:",
    "",
    "Confirm that buyer users can access the correct screens.",
    "",
    "First login test:",
    "",
    "1. Open login URL.",
    "2. Enter assigned credentials.",
    "3. Confirm successful login.",
    "4. Confirm correct tenant/buyer context.",
    "5. Confirm user role.",
    "6. Confirm accessible routes.",
    "7. Confirm restricted routes are not accessible if role should not access them.",
    "",
    "Routes to test:",
    "",
    "- /login",
    "- /sales/raftopoulos/executive-demo-home",
    "- /sales/raftopoulos/quality-profit",
    "- /sales/raftopoulos/pilot-walkthrough-scenario",
    "- /sales/raftopoulos/pilot-demo",
    "- /settings",
    "- /compliance",
    "- /reports",
    "- /doctor",
    "- /clinic",
    "",
    "Backend health test:",
    "",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "Issue rule:",
    "",
    "If login or route access fails, record user, route, time, screenshot if safe, and error message."
)

Write-Doc "07_ACCESS_REVOCATION_AND_ROLE_CHANGE.md" @(
    "# RAFTOP CPAP CARE Pro - Access Revocation and Role Change",
    "",
    "Purpose:",
    "",
    "Define what happens when a user changes role or should no longer have access.",
    "",
    "When to revoke access:",
    "",
    "- user leaves company",
    "- user changes role",
    "- pilot ends",
    "- annual license ends",
    "- non-payment or inactive commercial status",
    "- suspected credential exposure",
    "",
    "Revocation checklist:",
    "",
    "- identify user",
    "- confirm reason",
    "- disable or update access",
    "- document date/time",
    "- notify buyer owner if needed",
    "- confirm no shared credentials remain active",
    "",
    "Role change checklist:",
    "",
    "- confirm new role",
    "- update access level",
    "- remove unnecessary permissions",
    "- test access",
    "",
    "Rule:",
    "",
    "Access must follow active commercial status and real operational need."
)

Write-Doc "08_TENANT_ACTIVATION_SIGNOFF.md" @(
    "# RAFTOP CPAP CARE Pro - Tenant Activation Signoff",
    "",
    "Purpose:",
    "",
    "Use this to confirm that Raftopoulos can start using the platform.",
    "",
    "Signoff fields:",
    "",
    "- tenant name:",
    "- commercial path:",
    "- activation date:",
    "- buyer sponsor:",
    "- operations owner:",
    "- technical/data contact:",
    "- buyer admin user:",
    "- operations user:",
    "- management viewer:",
    "- technical/data user:",
    "- data level:",
    "- first review date:",
    "",
    "Activation checks:",
    "",
    "- production frontend reachable",
    "- backend health reachable",
    "- buyer admin login tested",
    "- operations login tested",
    "- management viewer login tested",
    "- technical/data login tested",
    "- sample data visible",
    "- ATLAS examples visible",
    "- reporting route visible",
    "- support contact confirmed",
    "",
    "Signoff statement:",
    "",
    "Raftopoulos tenant access is activated for controlled use within the agreed commercial path, user roles, data boundary, and support scope.",
    "",
    "Rule:",
    "",
    "Tenant activation is not approval for unlimited development or uncontrolled data use."
)

Write-Doc "09_PRODUCTION_ACCESS_PACK_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Production Access and Tenant Activation Index",
    "",
    "This folder contains the production access and tenant activation pack.",
    "",
    "Documents:",
    "",
    "01_PRODUCTION_ACCESS_OVERVIEW.md",
    "02_TENANT_ACTIVATION_CHECKLIST.md",
    "03_INITIAL_USER_SETUP.md",
    "04_CREDENTIAL_DELIVERY_RULES.md",
    "05_DEMO_SAMPLE_DATA_ACTIVATION.md",
    "06_FIRST_LOGIN_AND_ROUTE_TEST.md",
    "07_ACCESS_REVOCATION_AND_ROLE_CHANGE.md",
    "08_TENANT_ACTIVATION_SIGNOFF.md",
    "09_PRODUCTION_ACCESS_PACK_INDEX.md",
    "",
    "First document to open:",
    "",
    "01_PRODUCTION_ACCESS_OVERVIEW.md",
    "",
    "Important:",
    "",
    "This pack is client-facing. It does not include source code, internal scripts, credentials, secrets, or developer-only notes."
)

Write-Host ""
Write-Host "Verifying production access and tenant activation pack..."
Write-Host ""

$RequiredDocs = @{
    "01_PRODUCTION_ACCESS_OVERVIEW.md" = @("Production Access Overview", "Login URL", "controlled platform access")
    "02_TENANT_ACTIVATION_CHECKLIST.md" = @("Tenant Activation Checklist", "tenant status", "No-start rule")
    "03_INITIAL_USER_SETUP.md" = @("Initial User Setup", "Buyer Admin", "Technical/Data Contact")
    "04_CREDENTIAL_DELIVERY_RULES.md" = @("Credential Delivery Rules", "Not allowed", "temporary password")
    "05_DEMO_SAMPLE_DATA_ACTIVATION.md" = @("Demo and Sample Data Activation", "not look empty", "anonymized")
    "06_FIRST_LOGIN_AND_ROUTE_TEST.md" = @("First Login", "Routes to test", "Backend health test")
    "07_ACCESS_REVOCATION_AND_ROLE_CHANGE.md" = @("Access Revocation", "non-payment", "commercial status")
    "08_TENANT_ACTIVATION_SIGNOFF.md" = @("Tenant Activation Signoff", "Activation checks", "controlled use")
    "09_PRODUCTION_ACCESS_PACK_INDEX.md" = @("Production Access", "First document to open", "client-facing")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $AccessDir $Doc

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
    $FinalStatus = "PHASE60_PRODUCTION_ACCESS_TENANT_ACTIVATION_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE60_PRODUCTION_ACCESS_TENANT_ACTIVATION_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE60_PRODUCTION_ACCESS_TENANT_ACTIVATION_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 60 Production Access and Tenant Activation Pack"
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