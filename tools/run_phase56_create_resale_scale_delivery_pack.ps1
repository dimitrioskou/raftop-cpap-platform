# RAFTOP CPAP CARE Pro
# Phase 56 - Resale and Scale Delivery Pack
# ASCII-safe version.
# Safe: creates resale/scale docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$CommercialDir = Join-Path $DocsRoot "commercial-proposal"
$ResaleDir = Join-Path $CommercialDir "resale-scale-delivery"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $CommercialDir -Force | Out-Null
New-Item -ItemType Directory -Path $ResaleDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase56_resale_scale_delivery_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $ResaleDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 56 Resale and Scale Delivery Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 56 Resale and Scale Delivery Pack..."
Write-Host ""

Write-Doc "01_RAFTOP_PURCHASE_SCOPE.md" @(
    "# RAFTOP CPAP CARE Pro - Purchase Scope",
    "",
    "Purpose:",
    "",
    "Define what Raftopoulos buys.",
    "",
    "Raftopoulos buys:",
    "",
    "- CPAP Operations Control Layer",
    "- buyer-ready platform release",
    "- patient/device/compliance visibility capability",
    "- no-data detection capability",
    "- ATLAS action system capability",
    "- follow-up workflow capability",
    "- Quality and Profit reporting layer",
    "- buyer delivery pack",
    "- commercial proposal pack",
    "- deal acceptance pack",
    "- onboarding execution pack",
    "- resale and scale delivery pack",
    "",
    "Raftopoulos does not automatically buy:",
    "",
    "- unlimited custom development",
    "- full mobile app",
    "- unrestricted source code rights",
    "- unrestricted resale rights without commercial agreement",
    "- live AirView integration unless separately scoped",
    "- 24/7 support unless separately contracted",
    "- legal responsibility for real patient data without DPA/legal framework",
    "",
    "Important boundary:",
    "",
    "RAFTOP is an operations, follow-up and reporting platform. It is not a diagnostic medical device."
)

Write-Doc "02_RAFTOP_INTERNAL_USE_MODEL.md" @(
    "# RAFTOP CPAP CARE Pro - Internal Use Model",
    "",
    "Purpose:",
    "",
    "Define how Raftopoulos uses the platform internally first.",
    "",
    "Internal use cases:",
    "",
    "- monitor CPAP patient base",
    "- identify no-data cases",
    "- identify compliance risk",
    "- identify leak or therapy issue signals where data exists",
    "- organize follow-ups",
    "- assign ATLAS actions",
    "- review open and closed actions",
    "- generate management visibility",
    "- prepare future doctor/clinic service line",
    "",
    "Recommended internal rollout:",
    "",
    "Step 1: controlled pilot.",
    "Step 2: operational workflow adoption.",
    "Step 3: management reporting rhythm.",
    "Step 4: annual enterprise rollout.",
    "Step 5: doctor/clinic resale expansion.",
    "",
    "Rule:",
    "",
    "Do not sell externally before internal workflow is stable."
)

Write-Doc "03_RESALE_MODEL_FOR_DOCTORS_CLINICS.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Model for Doctors and Clinics",
    "",
    "Purpose:",
    "",
    "Define how Raftopoulos can resell RAFTOP value to doctors and clinics.",
    "",
    "Resale positioning:",
    "",
    "Raftopoulos can offer CPAP monitoring visibility and periodic reporting to doctors and clinics.",
    "",
    "Potential packages:",
    "",
    "Package 1 - Basic CPAP Report",
    "Price: 490 EUR per doctor per year plus VAT.",
    "Includes: periodic CPAP patient summary, risk list, and report export.",
    "",
    "Package 2 - Doctor Dashboard",
    "Price: 990 EUR per doctor per year plus VAT.",
    "Includes: doctor-specific dashboard, assigned patients, risk visibility, and reports.",
    "",
    "Package 3 - Clinic Plan",
    "Price: 1900 to 2900 EUR per clinic per year plus VAT.",
    "Includes: clinic-level overview, multiple users, patient group reports, and review cadence.",
    "",
    "Commercial value:",
    "",
    "- recurring revenue",
    "- stronger doctor relationship",
    "- more CPAP follow-up discipline",
    "- differentiation from competitors",
    "- service layer beyond device sales",
    "",
    "Rule:",
    "",
    "External resale requires clear package, support boundary, data boundary, and pricing approval."
)

Write-Doc "04_TENANT_PROVISIONING_SOP.md" @(
    "# RAFTOP CPAP CARE Pro - Tenant Provisioning SOP",
    "",
    "Purpose:",
    "",
    "Define how a new doctor, clinic, or buyer environment is opened.",
    "",
    "Tenant provisioning steps:",
    "",
    "1. Confirm customer type: internal, doctor, clinic, enterprise.",
    "2. Confirm commercial package.",
    "3. Confirm billing status.",
    "4. Confirm data boundary.",
    "5. Create tenant or access scope.",
    "6. Create admin user.",
    "7. Create limited users.",
    "8. Confirm role permissions.",
    "9. Load demo or approved data sample.",
    "10. Run access check.",
    "11. Confirm onboarding date.",
    "",
    "Tenant record fields:",
    "",
    "- tenant name",
    "- tenant type",
    "- package",
    "- status: active/inactive",
    "- billing status",
    "- user limit",
    "- module access",
    "- data boundary",
    "- support level",
    "- renewal date",
    "",
    "No-start rule:",
    "",
    "Do not provision a resale tenant without commercial package, billing status, data boundary, and named owner."
)

Write-Doc "05_RESELLER_SUPPORT_BOUNDARY.md" @(
    "# RAFTOP CPAP CARE Pro - Reseller Support Boundary",
    "",
    "Purpose:",
    "",
    "Define support boundaries between platform owner, Raftopoulos, doctors, and clinics.",
    "",
    "Support levels:",
    "",
    "Level 1 - Raftopoulos operational support:",
    "",
    "- basic user questions",
    "- report explanation",
    "- workflow guidance",
    "- doctor/clinic onboarding questions",
    "",
    "Level 2 - Platform support:",
    "",
    "- technical route issue",
    "- auth issue",
    "- data import problem",
    "- bug investigation",
    "- release gate checks",
    "",
    "Level 3 - Custom development:",
    "",
    "- new features",
    "- new modules",
    "- integrations",
    "- custom dashboards",
    "- doctor portal expansion",
    "",
    "Rule:",
    "",
    "Support is not unlimited development. New features are change requests."
)

Write-Doc "06_RESALE_CONTRACT_POINTS.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Contract Points",
    "",
    "Purpose:",
    "",
    "Define points that must be covered before Raftopoulos resells the platform.",
    "",
    "Required contract points:",
    "",
    "- who owns the platform",
    "- whether Raftopoulos has resale rights",
    "- whether resale is exclusive or non-exclusive",
    "- resale territory",
    "- resale packages",
    "- revenue share or wholesale pricing",
    "- support responsibilities",
    "- data controller/processor roles",
    "- use of brand and white-label rights",
    "- pricing control",
    "- renewal handling",
    "- termination rules",
    "- non-payment access blocking",
    "- liability boundary",
    "",
    "Critical point:",
    "",
    "Do not allow unlimited resale rights without written commercial terms."
)

Write-Doc "07_SCALE_RISK_REGISTER.md" @(
    "# RAFTOP CPAP CARE Pro - Scale Risk Register",
    "",
    "Purpose:",
    "",
    "Identify risks before scaling beyond the first buyer.",
    "",
    "Risks:",
    "",
    "1. Too many custom requests.",
    "Mitigation: change request process.",
    "",
    "2. Real patient data without legal boundary.",
    "Mitigation: DPA/legal review before real data.",
    "",
    "3. Resale without support capacity.",
    "Mitigation: define Level 1, Level 2, Level 3 support.",
    "",
    "4. Doctors expect medical diagnosis.",
    "Mitigation: position as operations and reporting layer only.",
    "",
    "5. Pricing becomes inconsistent.",
    "Mitigation: fixed packages and approval rules.",
    "",
    "6. Tenants are created without payment.",
    "Mitigation: tenant status and billing confirmation.",
    "",
    "7. Buyer asks for unlimited development.",
    "Mitigation: scope boundaries and change requests.",
    "",
    "Rule:",
    "",
    "Scaling without governance destroys product value."
)

Write-Doc "08_RESALE_READINESS_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Resale Readiness Checklist",
    "",
    "Before selling RAFTOP to other doctors or clinics, confirm:",
    "",
    "- Raftopoulos internal workflow is stable",
    "- support model is defined",
    "- doctor/clinic packages are defined",
    "- pricing is approved",
    "- tenant provisioning SOP exists",
    "- data boundary is defined",
    "- support boundary is defined",
    "- resale contract points are agreed",
    "- no unrestricted resale rights without written agreement",
    "- no real patient data without legal/DPA framework",
    "",
    "Ready condition:",
    "",
    "RAFTOP is ready for resale only when internal use, support, pricing, tenant provisioning, and contract boundaries are controlled."
)

Write-Host ""
Write-Host "Verifying resale and scale delivery pack..."
Write-Host ""

$RequiredDocs = @{
    "01_RAFTOP_PURCHASE_SCOPE.md" = @("Purchase Scope", "Raftopoulos buys", "not a diagnostic medical device")
    "02_RAFTOP_INTERNAL_USE_MODEL.md" = @("Internal Use Model", "internal rollout", "Do not sell externally")
    "03_RESALE_MODEL_FOR_DOCTORS_CLINICS.md" = @("Resale Model", "Doctor Dashboard", "recurring revenue")
    "04_TENANT_PROVISIONING_SOP.md" = @("Tenant Provisioning SOP", "billing status", "No-start rule")
    "05_RESELLER_SUPPORT_BOUNDARY.md" = @("Reseller Support Boundary", "Level 1", "unlimited development")
    "06_RESALE_CONTRACT_POINTS.md" = @("Resale Contract Points", "resale rights", "unlimited resale rights")
    "07_SCALE_RISK_REGISTER.md" = @("Scale Risk Register", "Mitigation", "governance")
    "08_RESALE_READINESS_CHECKLIST.md" = @("Resale Readiness Checklist", "pricing is approved", "Ready condition")
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
    $FinalStatus = "PHASE56_RESALE_SCALE_DELIVERY_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE56_RESALE_SCALE_DELIVERY_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE56_RESALE_SCALE_DELIVERY_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 56 Resale and Scale Delivery Pack"
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