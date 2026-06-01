# RAFTOP CPAP CARE Pro
# Phase 64 - Resale Launch Kit
# ASCII-safe version.
# Safe: creates client-facing resale launch docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$ResaleDir = Join-Path $ClientDir "resale-launch-kit"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $ResaleDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase64_resale_launch_kit_" + $Timestamp + ".md")

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

    $Path = Join-Path $ResaleDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 64 Resale Launch Kit" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 64 Resale Launch Kit..."
Write-Host ""

Write-Doc "01_RESALE_LAUNCH_OVERVIEW.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Launch Overview",
    "",
    "Purpose:",
    "",
    "This document explains how Raftopoulos can resell RAFTOP CPAP CARE Pro value to doctors and clinics.",
    "",
    "Resale positioning:",
    "",
    "Raftopoulos can offer CPAP monitoring visibility, structured follow-up support, compliance risk visibility, no-data awareness, ATLAS action discipline, and management/reporting value to doctors and clinics.",
    "",
    "Important:",
    "",
    "Doctor and clinic resale should start only after the internal Raftopoulos workflow is stable.",
    "",
    "Primary resale value:",
    "",
    "- recurring revenue",
    "- stronger doctor relationship",
    "- CPAP patient retention",
    "- differentiation beyond device sales",
    "- structured reporting service",
    "- controlled doctor/clinic access",
    "",
    "What doctors buy:",
    "",
    "Doctors and clinics do not buy source code. They buy access, visibility, reports, and structured CPAP follow-up information under an agreed package.",
    "",
    "Boundary:",
    "",
    "RAFTOP supports operations, reporting, and follow-up prioritization. It is not a diagnostic medical device and does not replace physician judgment."
)

Write-Doc "02_DOCTOR_CLINIC_PACKAGES.md" @(
    "# RAFTOP CPAP CARE Pro - Doctor and Clinic Packages",
    "",
    "Purpose:",
    "",
    "Define resale packages for doctors and clinics.",
    "",
    "Package 1 - Basic CPAP Report",
    "",
    "Price:",
    "490 EUR per doctor per year plus VAT.",
    "",
    "Includes:",
    "- periodic CPAP patient summary",
    "- risk list",
    "- no-data visibility summary",
    "- basic compliance risk visibility",
    "- report export or summary",
    "",
    "Best for:",
    "Doctors who want periodic CPAP patient visibility without full dashboard use.",
    "",
    "Package 2 - Doctor Dashboard",
    "",
    "Price:",
    "990 EUR per doctor per year plus VAT.",
    "",
    "Includes:",
    "- doctor-specific dashboard",
    "- assigned patient visibility",
    "- no-data cases",
    "- compliance risk cases",
    "- ATLAS action visibility",
    "- reports",
    "",
    "Best for:",
    "Doctors who want ongoing visibility for their CPAP patients.",
    "",
    "Package 3 - Clinic Plan",
    "",
    "Price:",
    "1900 to 2900 EUR per clinic per year plus VAT.",
    "",
    "Includes:",
    "- clinic-level overview",
    "- multiple users",
    "- patient group reporting",
    "- management summary",
    "- review cadence",
    "",
    "Best for:",
    "Clinics with multiple doctors or larger CPAP patient groups.",
    "",
    "Pricing rule:",
    "",
    "Do not discount before scope is clear. If price is reduced, scope must also be reduced."
)

Write-Doc "03_DOCTOR_SALES_TALK_TRACK.md" @(
    "# RAFTOP CPAP CARE Pro - Doctor Sales Talk Track",
    "",
    "Opening:",
    "",
    "Raftopoulos now offers a structured CPAP reporting and monitoring visibility service for doctors and clinics.",
    "",
    "Problem:",
    "",
    "Many CPAP patients generate data or non-data signals, but doctors often do not have a simple operational view of who needs attention, who has no data, who is at compliance risk, and which cases require follow-up.",
    "",
    "Value:",
    "",
    "RAFTOP helps organize CPAP patient visibility into reports, risk lists, no-data awareness, ATLAS actions, and structured follow-up information.",
    "",
    "Doctor benefit:",
    "",
    "- better visibility of CPAP patient status",
    "- no-data and compliance risk awareness",
    "- structured reporting",
    "- stronger follow-up process",
    "- less manual searching",
    "",
    "Close question:",
    "",
    "Would you prefer a simple periodic CPAP report, or a doctor dashboard with ongoing visibility?",
    "",
    "Rule:",
    "",
    "Do not sell this as diagnosis. Sell it as CPAP visibility, reporting, and follow-up organization."
)

Write-Doc "04_DOCTOR_ONBOARDING_FLOW.md" @(
    "# RAFTOP CPAP CARE Pro - Doctor Onboarding Flow",
    "",
    "Purpose:",
    "",
    "Define how a doctor or clinic is onboarded into a resale package.",
    "",
    "Step 1 - Package selection:",
    "",
    "- Basic CPAP Report",
    "- Doctor Dashboard",
    "- Clinic Plan",
    "",
    "Step 2 - Commercial confirmation:",
    "",
    "- price confirmed",
    "- billing details confirmed",
    "- start date confirmed",
    "- renewal date confirmed",
    "",
    "Step 3 - Data and patient scope:",
    "",
    "- assigned patients confirmed",
    "- data boundary confirmed",
    "- identifiers controlled",
    "- reporting frequency confirmed",
    "",
    "Step 4 - User setup:",
    "",
    "- doctor user",
    "- clinic admin if applicable",
    "- viewer users if included",
    "",
    "Step 5 - First review:",
    "",
    "- confirm login if dashboard package",
    "- review report format",
    "- review no-data/compliance risk visibility",
    "- record feedback",
    "",
    "Step 6 - Ongoing rhythm:",
    "",
    "- periodic report",
    "- monthly review if included",
    "- support through agreed channel",
    "",
    "No-start rule:",
    "",
    "Do not onboard a doctor or clinic without package, billing status, data boundary, and named owner."
)

Write-Doc "05_RESALE_TENANT_PROVISIONING.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Tenant Provisioning",
    "",
    "Purpose:",
    "",
    "Define what must be confirmed before opening access for a doctor or clinic.",
    "",
    "Tenant/access fields:",
    "",
    "- customer name",
    "- customer type: doctor / clinic",
    "- package",
    "- billing status",
    "- start date",
    "- renewal date",
    "- user limit",
    "- module access",
    "- patient scope",
    "- support level",
    "- status: active/inactive",
    "",
    "Provisioning checklist:",
    "",
    "1. commercial package confirmed.",
    "2. billing status confirmed.",
    "3. data boundary confirmed.",
    "4. patient scope confirmed.",
    "5. user list confirmed.",
    "6. role permissions confirmed.",
    "7. access created.",
    "8. login tested.",
    "9. report/dashboard reviewed.",
    "10. support path confirmed.",
    "",
    "Access control rule:",
    "",
    "Each doctor or clinic must see only the agreed patient scope.",
    "",
    "Blocking rule:",
    "",
    "Inactive or unpaid tenants should not retain active access."
)

Write-Doc "06_RESELLER_ROLES_AND_SUPPORT.md" @(
    "# RAFTOP CPAP CARE Pro - Reseller Roles and Support",
    "",
    "Purpose:",
    "",
    "Define responsibilities between platform owner, Raftopoulos, doctors, and clinics.",
    "",
    "Raftopoulos responsibilities:",
    "",
    "- sell doctor/clinic packages",
    "- collect billing information",
    "- define customer package",
    "- provide Level 1 support",
    "- explain reports",
    "- coordinate onboarding",
    "",
    "Platform owner responsibilities:",
    "",
    "- support technical issues within agreed scope",
    "- support route/access investigation",
    "- support data template clarification",
    "- support release readiness checks where agreed",
    "",
    "Doctor/clinic responsibilities:",
    "",
    "- provide required user information",
    "- use access according to package",
    "- avoid sharing credentials",
    "- avoid sending uncontrolled patient identifiers",
    "",
    "Support levels:",
    "",
    "Level 1: Raftopoulos operational support.",
    "Level 2: platform technical support.",
    "Level 3: paid change request or custom development.",
    "",
    "Rule:",
    "",
    "Resale support is not unlimited custom development."
)

Write-Doc "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Boundaries and Contract Rules",
    "",
    "Purpose:",
    "",
    "Prevent uncontrolled resale, unlimited access, or unclear commercial rights.",
    "",
    "Required before resale:",
    "",
    "- resale rights clarified",
    "- pricing approved",
    "- support responsibilities defined",
    "- tenant provisioning rules accepted",
    "- data controller/processor roles clarified",
    "- white-label rights clarified if applicable",
    "- renewal handling defined",
    "- access blocking for non-payment defined",
    "",
    "Not allowed without written agreement:",
    "",
    "- unrestricted resale rights",
    "- source code handover",
    "- unlimited doctor tenants",
    "- unlimited custom development",
    "- uncontrolled patient data transfer",
    "- use as diagnostic medical device",
    "- 24/7 support commitment",
    "",
    "Commercial rule:",
    "",
    "Every resale customer must have a package, price, billing status, support level, and renewal date.",
    "",
    "Legal/data rule:",
    "",
    "Real patient data requires appropriate legal/data protection framework.",
    "",
    "Final boundary:",
    "",
    "Resale must scale with governance. Scaling without boundaries destroys product value."
)

Write-Doc "08_RESALE_LAUNCH_KIT_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Launch Kit Index",
    "",
    "This folder contains the client-facing resale launch kit for Raftopoulos.",
    "",
    "Documents:",
    "",
    "01_RESALE_LAUNCH_OVERVIEW.md",
    "02_DOCTOR_CLINIC_PACKAGES.md",
    "03_DOCTOR_SALES_TALK_TRACK.md",
    "04_DOCTOR_ONBOARDING_FLOW.md",
    "05_RESALE_TENANT_PROVISIONING.md",
    "06_RESELLER_ROLES_AND_SUPPORT.md",
    "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md",
    "08_RESALE_LAUNCH_KIT_INDEX.md",
    "",
    "First document to open:",
    "",
    "01_RESALE_LAUNCH_OVERVIEW.md",
    "",
    "Important:",
    "",
    "This pack is client-facing. It does not include source code, credentials, secrets, internal scripts, or developer-only notes.",
    "",
    "Core rule:",
    "",
    "Do not launch resale before internal Raftopoulos workflow is stable."
)

Write-Host ""
Write-Host "Verifying resale launch kit..."
Write-Host ""

$RequiredDocs = @{
    "01_RESALE_LAUNCH_OVERVIEW.md" = @("Resale Launch Overview", "recurring revenue", "not a diagnostic medical device")
    "02_DOCTOR_CLINIC_PACKAGES.md" = @("Doctor and Clinic Packages", "990 EUR", "Clinic Plan")
    "03_DOCTOR_SALES_TALK_TRACK.md" = @("Doctor Sales Talk Track", "Doctor benefit", "not diagnosis")
    "04_DOCTOR_ONBOARDING_FLOW.md" = @("Doctor Onboarding Flow", "No-start rule", "billing status")
    "05_RESALE_TENANT_PROVISIONING.md" = @("Resale Tenant Provisioning", "Blocking rule", "agreed patient scope")
    "06_RESELLER_ROLES_AND_SUPPORT.md" = @("Reseller Roles", "Level 1", "unlimited custom development")
    "07_RESALE_BOUNDARIES_AND_CONTRACT_RULES.md" = @("Resale Boundaries", "unrestricted resale rights", "Scaling without boundaries")
    "08_RESALE_LAUNCH_KIT_INDEX.md" = @("Resale Launch Kit Index", "First document to open", "internal Raftopoulos workflow")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $ResaleDir $Doc

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
    $FinalStatus = "PHASE64_RESALE_LAUNCH_KIT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE64_RESALE_LAUNCH_KIT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE64_RESALE_LAUNCH_KIT_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 64 Resale Launch Kit"
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