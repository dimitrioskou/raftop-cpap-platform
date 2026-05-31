# RAFTOP CPAP CARE Pro
# Phase 48 - Create Buyer Delivery Pack v2
# Safe: creates docs only. Does not touch backend, database or frontend code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$DeliveryDir = Join-Path $DocsRoot "buyer-delivery"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase48_buyer_delivery_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $DeliveryDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 48 Buyer Delivery Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 48 Buyer Delivery Pack..."
Write-Host ""

Write-Doc "01_RAFTOP_BUYER_DELIVERY_PACK.md" @(
    "# RAFTOP CPAP CARE Pro — Buyer Delivery Pack",
    "",
    "## Delivery Status",
    "",
    "RAFTOP CPAP CARE Pro has reached buyer-ready release candidate status.",
    "",
    "Verified gates:",
    "",
    "- Phase 46 Full Product Completion Audit: READY",
    "- Phase 47 Final Buyer-Ready Release Candidate Gate: READY",
    "",
    "## Product Positioning",
    "",
    "RAFTOP CPAP CARE Pro is a CPAP Operations Control Layer for monitoring, organizing and managing CPAP patient workflows.",
    "",
    "## What Is Delivered",
    "",
    "The delivery includes:",
    "",
    "1. Enterprise frontend application.",
    "2. Backend API layer.",
    "3. Protected login.",
    "4. Tenant-aware operational structure.",
    "5. Patient/device/compliance capability.",
    "6. ATLAS action system capability.",
    "7. Tasks and follow-up capability.",
    "8. Quality & Profit Excellence Center.",
    "9. Buyer-ready navigation routes.",
    "10. Doctor / Clinic expansion route.",
    "11. Billing/subscription readiness evidence.",
    "12. CSV import capability evidence.",
    "13. Security and GDPR boundary documentation.",
    "14. Verification scripts and release gates.",
    "15. Buyer delivery documentation.",
    "",
    "## Primary Buyer Routes",
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
    "## Buyer Meaning",
    "",
    "The product is not positioned as a simple dashboard. It is positioned as a control layer that helps the buyer manage CPAP patients, risks, actions, reports and future doctor/clinic expansion.",
    "",
    "## Important Boundary",
    "",
    "RAFTOP supports operational monitoring, follow-up workflows and reporting. It does not replace medical judgment, diagnosis or treatment decisions."
)

Write-Doc "02_PRODUCT_SCOPE_AND_BOUNDARIES.md" @(
    "# RAFTOP CPAP CARE Pro — Product Scope & Boundaries",
    "",
    "## Product Scope",
    "",
    "The core enterprise product includes protected login, buyer-ready navigation, patient management capability, device management capability, compliance visibility, ATLAS action capability, tasks/follow-up capability, Quality & Profit Excellence Center, reports, settings, doctor/clinic expansion base, verification gates and delivery documentation.",
    "",
    "## Not Included",
    "",
    "The following are not automatically included without separate scope:",
    "",
    "- full patient mobile app",
    "- full live AirView integration",
    "- complete historical data migration",
    "- 24/7 support",
    "- on-site support",
    "- advanced AI coaching",
    "- custom ERP / CRM integrations",
    "- full doctor portal production rollout",
    "- unrestricted custom development",
    "- legal/GDPR final contract drafting",
    "- use of real patient identifiers without DPA/legal review",
    "",
    "## Pilot Data Boundary",
    "",
    "Preferred pilot data level is demo, anonymized or pseudonymized data. Real patient data requires written data scope, controller/processor role definition, DPA or equivalent legal framework, retention/deletion policy, secure transfer method and authorized users.",
    "",
    "## Medical Boundary",
    "",
    "RAFTOP is an operational and management support platform. It is not a diagnostic device and does not replace physician review."
)

Write-Doc "03_BUYER_ONBOARDING_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro — Buyer Onboarding Checklist",
    "",
    "## Before Onboarding",
    "",
    "- Agreement confirmed",
    "- Scope confirmed",
    "- Payment / commercial terms confirmed",
    "- Buyer sponsor assigned",
    "- Operations lead assigned",
    "- Data contact assigned",
    "- Users and roles confirmed",
    "- Data boundary confirmed",
    "- Kickoff date confirmed",
    "",
    "## Technical Start",
    "",
    "- Production frontend confirmed",
    "- Production backend health confirmed",
    "- Login confirmed",
    "- Tenant context confirmed",
    "- Buyer routes confirmed",
    "- Admin/staff access confirmed",
    "- Initial data sample agreed",
    "- Security boundaries confirmed",
    "",
    "## Operational Start",
    "",
    "- No-data workflow agreed",
    "- Compliance risk workflow agreed",
    "- Leak / therapy issue workflow agreed",
    "- ATLAS categories agreed",
    "- Action statuses agreed",
    "- Weekly or monthly review cadence agreed",
    "- Reporting format agreed",
    "",
    "## Success Criteria",
    "",
    "The onboarding is successful when users can log in, buyer routes load, operations users understand daily workflow, ATLAS actions have owner/status, reports support management decisions and change requests are controlled."
)

Write-Doc "04_SUPPORT_AND_INCIDENT_PROCESS.md" @(
    "# RAFTOP CPAP CARE Pro — Support & Incident Process",
    "",
    "## Support Categories",
    "",
    "Category 1 — Access Issue: login problem, route access problem, role/permission issue.",
    "",
    "Category 2 — Data Issue: missing data, wrong import format, no-data due to export problem, duplicate records.",
    "",
    "Category 3 — Operational Issue: ATLAS action not assigned, follow-up status unclear, report not updated.",
    "",
    "Category 4 — Technical Issue: production page does not load, API health failure, frontend build issue, unexpected error.",
    "",
    "## Incident Handling",
    "",
    "1. Stop uncontrolled changes.",
    "2. Record what happened.",
    "3. Identify affected route/module/data.",
    "4. Identify severity.",
    "5. Notify responsible owner.",
    "6. Apply fix or rollback.",
    "7. Document resolution.",
    "8. Review prevention step.",
    "",
    "## Data Incident Boundary",
    "",
    "If any incident involves patient data, notify the responsible contact, preserve evidence, involve legal/DPO where required and document scope and corrective action.",
    "",
    "## Support Rule",
    "",
    "Support covers agreed scope. New features, new modules, integrations or additional data flows are handled as change requests."
)

Write-Doc "05_RELEASE_NOTES.md" @(
    "# RAFTOP CPAP CARE Pro — Release Notes",
    "",
    "## Release Candidate",
    "",
    "Status:",
    "",
    "PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY",
    "",
    "## Verified",
    "",
    "- Phase 46 full product completion audit passed",
    "- Phase 47 buyer-ready release candidate gate passed",
    "- Buyer navigation gaps closed",
    "- Frontend production build passed",
    "- Core buyer routes wired",
    "- Buyer settings page added",
    "- Buyer compliance page added",
    "- Buyer reports page added",
    "- Buyer doctor / clinic page added",
    "- Quality & Profit layer present",
    "- Sales demo routes present",
    "- Backend health verified",
    "",
    "## Buyer-Ready Routes",
    "",
    "- /settings",
    "- /compliance",
    "- /reports",
    "- /doctor",
    "- /clinic",
    "",
    "## Release Meaning",
    "",
    "This release candidate is suitable for buyer review, controlled onboarding planning and commercial delivery discussion."
)

Write-Doc "06_OPERATIONAL_RUNBOOK.md" @(
    "# RAFTOP CPAP CARE Pro — Operational Runbook",
    "",
    "## Local Root",
    "",
    "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE",
    "",
    "## Core Commands",
    "",
    "Run Phase 46 audit:",
    "",
    "cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE",
    ".\tools\run_phase46_full_product_completion_audit_v2.ps1 -RunBuild",
    "",
    "Run Phase 47 release gate:",
    "",
    "cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE",
    ".\tools\run_phase47_final_buyer_ready_release_candidate_gate.ps1 -RunBuild",
    "",
    "Run Phase 48 buyer delivery pack:",
    "",
    "cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE",
    ".\tools\run_phase48_create_buyer_delivery_pack.ps1",
    "",
    "Check Git status:",
    "",
    "git status --short",
    "",
    "Frontend build:",
    "",
    "cd C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-frontend",
    "npm run build",
    "",
    "## Production URLs",
    "",
    "Frontend:",
    "",
    "https://raftop-cpap-frontend.onrender.com",
    "",
    "Backend health:",
    "",
    "https://raftop-cpap-backend.onrender.com/api/health",
    "",
    "## Do Not Show Buyer",
    "",
    "- source code unless technical review is agreed",
    "- environment variables",
    "- database credentials",
    "- raw secrets",
    "- Render secret settings",
    "- GitHub secrets",
    "- internal logs containing sensitive values",
    "",
    "## Change Control",
    "",
    "- bugs are fixed in scope",
    "- minor improvements are evaluated",
    "- new features become change requests",
    "- new modules require separate scope",
    "- real patient data requires legal/DPA framework"
)

Write-Host ""
Write-Host "Verifying buyer delivery pack..."
Write-Host ""

$RequiredDocs = @{
    "01_RAFTOP_BUYER_DELIVERY_PACK.md" = @("Buyer Delivery Pack", "What Is Delivered", "Primary Buyer Routes")
    "02_PRODUCT_SCOPE_AND_BOUNDARIES.md" = @("Product Scope", "Not Included", "Medical Boundary")
    "03_BUYER_ONBOARDING_CHECKLIST.md" = @("Buyer Onboarding Checklist", "Before Onboarding", "Success Criteria")
    "04_SUPPORT_AND_INCIDENT_PROCESS.md" = @("Support & Incident Process", "Incident Handling", "Data Incident Boundary")
    "05_RELEASE_NOTES.md" = @("Release Candidate", "PHASE47_BUYER_READY_RELEASE_CANDIDATE_READY", "Buyer-Ready Routes")
    "06_OPERATIONAL_RUNBOOK.md" = @("Operational Runbook", "Core Commands", "Production URLs")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $DeliveryDir $Doc

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
    $FinalStatus = "PHASE48_BUYER_DELIVERY_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE48_BUYER_DELIVERY_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE48_BUYER_DELIVERY_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 48 Buyer Delivery Pack"
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