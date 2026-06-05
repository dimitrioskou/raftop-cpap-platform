# RAFTOP CPAP CARE Pro
# Phase 86 - Final Commercial Sale Pack
# ASCII-safe script.
# Creates commercial offer, pricing options, license/support scope, resale rights terms, and final sales checklist.
# Does not create legal contract.
# Does not replace lawyer/accountant review.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\commercial-sale-pack"
$ProductionDocsDir = Join-Path $Root "docs\production-rollout"
$ToolsDir = Join-Path $Root "tools"

$CommercialOffer = Join-Path $DocsDir "86_COMMERCIAL_OFFER_RAFTOP_CPAP_CARE_PRO.md"
$PricingOptions = Join-Path $DocsDir "86_PRICING_OPTIONS.md"
$LicenseSupportScope = Join-Path $DocsDir "86_LICENSE_AND_SUPPORT_SCOPE.md"
$ResaleRightsTerms = Join-Path $DocsDir "86_RESALE_RIGHTS_TERMS.md"
$PaymentMilestones = Join-Path $DocsDir "86_PAYMENT_MILESTONES.md"
$FinalSalesChecklist = Join-Path $DocsDir "86_FINAL_SALES_HANDOVER_CHECKLIST.md"
$BuyerEmailDraft = Join-Path $DocsDir "86_BUYER_EMAIL_DRAFT.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase86_final_commercial_sale_pack_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Test-Marker {
    param([string]$Name, [string]$Path, [string]$Marker)

    $Content = Read-FileSafe $Path

    if (ContainsText $Content $Marker) {
        Add-Result ($Name + ": " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ($Name + ": " + $Marker) "FAIL" "Marker missing."
    }
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 86 Final Commercial Sale Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: create the final commercial sale pack for buyer purchase discussion." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This is not a legal contract and does not replace legal/accounting review." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 86 - Final Commercial Sale Pack..."
Write-Host ""

# Previous phase gates
Check-ReportStatus "Phase 79 preflight latest status" "phase79_7000_patient_production_rollout_preflight_gate_*.md" @(
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY",
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 80 tenant roles access latest status" "phase80_production_tenant_roles_access_pack_*.md" @(
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY",
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 81 CSV validator latest status" "phase81_7000_patient_csv_master_validator_*.md" @(
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY",
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 82 synthetic dry-run latest status" "phase82_7000_patient_synthetic_dry_run_import_pack_*.md" @(
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY",
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 83 staging gate latest status" "phase83_production_import_staging_gate_*.md" @(
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY",
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 84 ATLAS 80h reports latest status" "phase84_atlas_80h_reports_verification_pack_*.md" @(
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY",
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 85 buyer acceptance latest status" "phase85_buyer_acceptance_production_rollout_signoff_pack_*.md" @(
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY",
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY_WITH_WARNINGS"
)

$CommercialOfferContent = @'
# RAFTOP CPAP CARE Pro - Commercial Offer

REQUIRED_MARKER: PHASE86_COMMERCIAL_OFFER
REQUIRED_MARKER: PLATFORM_LICENSE_SETUP_SUPPORT
REQUIRED_MARKER: CONTROLLED_7000_ROLLOUT
REQUIRED_MARKER: NOT_A_SOURCE_CODE_HANDOVER

## Offer title

RAFTOP CPAP CARE Pro
CPAP portfolio monitoring, ATLAS prioritization, 80 Hours Compliance tracking, follow-up workflow, management reports, and doctor/clinic resale preparation.

## What is being offered

The offer covers a platform license and controlled activation package for Raftopoulos.

Included:
- buyer-only product package
- production tenant setup plan
- role/access matrix
- 7000-patient CSV template
- synthetic 7000 dry-run validation
- ATLAS / 80h / reports verification pack
- production rollout signoff pack
- staged rollout support plan
- doctor / clinic resale preparation terms

## What the platform does

The platform supports:
- CPAP patient portfolio monitoring
- ATLAS priority queue
- AirView-like operational monitoring explanation
- SleepHQ-style CPAP data analysis explanation
- 80 Hours Compliance tracking
- Compliance Rescue workflow
- follow-up tasks
- management reports
- doctor / clinic view preparation
- future resale model

## Boundary

The platform is positioned as an operational monitoring and follow-up platform.
It is not offered as a diagnostic medical device.
It is not a replacement for physician judgment.
It is not a direct copy of AirView or SleepHQ.

## Delivery model

Recommended delivery:
1. Commercial approval
2. GDPR / DPA confirmation
3. Production tenant setup
4. 100-row controlled import
5. 500-row controlled import
6. 2000-row controlled import
7. 7000-row controlled rollout
8. Monthly support / reporting

## Source code

Source code is not included by default.
GitHub access is not included by default.
Infrastructure secrets are not included.
Super admin credentials are not shared with buyer tenant users.
'@

Set-Content -Path $CommercialOffer -Value $CommercialOfferContent -Encoding UTF8

$PricingContent = @'
# RAFTOP CPAP CARE Pro - Pricing Options

REQUIRED_MARKER: PHASE86_PRICING_OPTIONS
REQUIRED_MARKER: PILOT_OPTION
REQUIRED_MARKER: INTERNAL_USE_OPTION
REQUIRED_MARKER: RESELLER_OPTION

## Pricing note

These are commercial proposal ranges.
Final price must be confirmed based on scope, support expectations, resale rights, and legal/accounting review.

## Option 1 - Pilot Activation

Price range:
3,000 EUR - 5,000 EUR

Includes:
- buyer package
- production tenant planning
- controlled 100-patient pilot setup
- CSV validation
- basic ATLAS / 80h / reports verification
- pilot review meeting

Does not include:
- 7000-patient full rollout
- unlimited support
- source code
- resale rights

## Option 2 - Full Internal Use

Price range:
12,000 EUR - 25,000 EUR setup / license activation

Support:
500 EUR - 1,500 EUR per month

Includes:
- platform activation for Raftopoulos internal CPAP portfolio monitoring
- production tenant setup
- staged import support up to 7000 patients
- role/access setup plan
- reporting support
- support/change request process

Does not include by default:
- source code
- unrestricted resale
- custom features beyond agreed scope

## Option 3 - Internal Use + Doctor / Clinic Resale Rights

Price range:
25,000 EUR - 60,000 EUR

Support:
monthly support fee plus resale terms

Resale model options:
- fixed annual platform reseller fee
- fee per doctor / clinic
- revenue share per active doctor account
- hybrid license + support model

Includes:
- internal use rights
- resale preparation
- doctor / clinic view terms
- role separation model
- support framework for reseller rollout

Requires separate written agreement for:
- territory
- branding
- support responsibility
- pricing to doctors
- data responsibilities
- revenue share / license fee
'@

Set-Content -Path $PricingOptions -Value $PricingContent -Encoding UTF8

$LicenseSupportContent = @'
# RAFTOP CPAP CARE Pro - License and Support Scope

REQUIRED_MARKER: PHASE86_LICENSE_SUPPORT_SCOPE
REQUIRED_MARKER: LICENSE_NOT_OWNERSHIP_BY_DEFAULT
REQUIRED_MARKER: SUPPORT_SCOPE_DEFINED
REQUIRED_MARKER: CHANGE_REQUESTS_SEPARATE

## License principle

Default commercial structure:
platform license + setup + support.

This means the buyer receives the right to use the platform under agreed terms.
It does not automatically mean transfer of source code, GitHub repository, infrastructure accounts, or intellectual property.

## Included support

Standard support may include:
- access support
- user role guidance
- CSV validation guidance
- staged rollout assistance
- bug triage
- monthly report review
- operational workflow support

## Not included unless separately agreed

Not included by default:
- new major features
- custom integrations
- source code handover
- infrastructure transfer
- unlimited user training
- unlimited doctor onboarding
- custom mobile apps
- legal/GDPR documentation drafting beyond templates

## Change requests

Any request outside the agreed scope should be handled as:
- change request
- quoted separately
- scheduled separately
- approved before implementation

## Support tiers

Basic:
email / scheduled support

Standard:
monthly support + minor fixes

Premium:
priority support + monthly review + rollout assistance

Enterprise:
custom SLA, reseller support, doctor rollout support
'@

Set-Content -Path $LicenseSupportScope -Value $LicenseSupportContent -Encoding UTF8

$ResaleContent = @'
# RAFTOP CPAP CARE Pro - Resale Rights Terms

REQUIRED_MARKER: PHASE86_RESALE_RIGHTS_TERMS
REQUIRED_MARKER: RESELLER_RIGHTS_REQUIRE_WRITTEN_TERMS
REQUIRED_MARKER: DOCTOR_CLINIC_MODEL
REQUIRED_MARKER: NO_UNRESTRICTED_RESALE_BY_DEFAULT

## Resale principle

Doctor / clinic resale is commercially valuable and must not be granted vaguely.

Resale rights require written terms.

## What may be resold

Potential resale product:
- doctor CPAP monitoring dashboard
- doctor / clinic patient view
- CPAP compliance report service
- 80 Hours Compliance monitoring service
- follow-up reporting package
- clinic CPAP portfolio monitoring

## Required resale terms

Define:
- who can resell
- to whom
- territory
- duration
- pricing
- branding
- support responsibility
- data responsibility
- doctor user limits
- patient record limits
- termination rules
- revenue share or fixed license fee

## Recommended model

Raftopoulos may resell access to doctors / clinics under a controlled reseller agreement.

Platform owner retains:
- platform control
- super admin control
- release control
- security boundary
- right to suspend misuse
- right to define support limits

## Not allowed by default

Not allowed without written agreement:
- unlimited resale
- source code resale
- white-label transfer to third parties
- sublicensing to unrelated distributors
- sharing platform secrets
- granting super admin access
'@

Set-Content -Path $ResaleRightsTerms -Value $ResaleContent -Encoding UTF8

$PaymentContent = @'
# RAFTOP CPAP CARE Pro - Payment Milestones

REQUIRED_MARKER: PHASE86_PAYMENT_MILESTONES
REQUIRED_MARKER: PAYMENT_BEFORE_PRODUCTION_IMPORT
REQUIRED_MARKER: STAGED_DELIVERY_PAYMENT
REQUIRED_MARKER: SUPPORT_BILLED_SEPARATELY

## Recommended payment structure

Milestone 1 - Commercial reservation / kickoff
30% payment

Triggers:
- project start
- buyer acceptance package
- production tenant planning
- access planning

Milestone 2 - Pilot activation
30% payment

Triggers:
- 100-row controlled pilot
- CSV validation
- initial ATLAS / 80h / reports validation
- user onboarding

Milestone 3 - Production rollout readiness
30% payment

Triggers:
- 500 / 2000 staged checks
- production workflow confirmation
- signoff before full 7000 rollout

Milestone 4 - Final acceptance
10% payment

Triggers:
- buyer acceptance signoff
- production rollout documentation
- support process handover

## Monthly support

Support should be billed separately:
- monthly fixed support
- or annual support contract
- or reseller support package

## Hard rule

Real 7000-patient import should not happen before:
- signed agreement
- GDPR / DPA approval
- payment milestone agreement
- role/access approval
- CSV validation
- staged signoff
'@

Set-Content -Path $PaymentMilestones -Value $PaymentContent -Encoding UTF8

$ChecklistContent = @'
# RAFTOP CPAP CARE Pro - Final Sales Handover Checklist

REQUIRED_MARKER: PHASE86_FINAL_SALES_HANDOVER_CHECKLIST
REQUIRED_MARKER: SELL_READY_PACKAGE
REQUIRED_MARKER: BUYER_LINK_AND_ZIP
REQUIRED_MARKER: COMMERCIAL_PACK_READY

## Send to buyer

Send:
[ ] Buyer-only link
[ ] Buyer-only ZIP
[ ] Full Guide PDF
[ ] Commercial offer
[ ] Pricing options
[ ] License/support scope
[ ] Resale rights terms
[ ] Payment milestones
[ ] Buyer acceptance checklist
[ ] Production rollout signoff
[ ] GDPR / DPA blocker notice

## Do not send

Do not send:
[ ] source code
[ ] GitHub repository
[ ] .env
[ ] database URL
[ ] Render secrets
[ ] API keys
[ ] super admin credentials
[ ] internal scripts
[ ] old demo ZIPs
[ ] /login as first buyer link

## Buyer link

Buyer-only link:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Buyer ZIP

Buyer ZIP:
RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip

## Final buyer statement

The platform is ready for purchase discussion and controlled production rollout preparation.
Real 7000-patient import remains blocked until agreement, GDPR / DPA, CSV validation, and staged signoff.
'@

Set-Content -Path $FinalSalesChecklist -Value $ChecklistContent -Encoding UTF8

$EmailDraftContent = @'
# RAFTOP CPAP CARE Pro - Buyer Email Draft

REQUIRED_MARKER: PHASE86_BUYER_EMAIL_DRAFT
REQUIRED_MARKER: BUYER_ONLY_LINK_INCLUDED
REQUIRED_MARKER: ZIP_INCLUDED
REQUIRED_MARKER: COMMERCIAL_NEXT_STEP

Subject:
RAFTOP CPAP CARE Pro - Buyer package and production rollout proposal

Body:

Hello,

I am sending the buyer package for RAFTOP CPAP CARE Pro.

The package includes:
- buyer-only product view
- full guide PDF
- ATLAS / AirView-like monitoring explanation
- SleepHQ-style CPAP analysis explanation
- 80 Hours Compliance workflow
- Compliance Rescue workflow
- production rollout plan for up to 7000 CPAP patients
- staged import process
- role/access structure
- commercial options and support scope

Buyer-only link:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

Attached:
RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip

The recommended next step is a controlled pilot / production activation sequence:
100 records, then 500, then 2000, then full 7000 rollout after validation and signoff.

Before real patient data import, we need commercial approval, GDPR / DPA confirmation, CSV validation, and staged acceptance.

Regards,
'@

Set-Content -Path $BuyerEmailDraft -Value $EmailDraftContent -Encoding UTF8

# File checks
Test-PathExists "Commercial offer exists" $CommercialOffer
Test-PathExists "Pricing options exists" $PricingOptions
Test-PathExists "License support scope exists" $LicenseSupportScope
Test-PathExists "Resale rights terms exists" $ResaleRightsTerms
Test-PathExists "Payment milestones exists" $PaymentMilestones
Test-PathExists "Final sales checklist exists" $FinalSalesChecklist
Test-PathExists "Buyer email draft exists" $BuyerEmailDraft

# Marker checks
Test-Marker "Commercial offer marker" $CommercialOffer "PHASE86_COMMERCIAL_OFFER"
Test-Marker "Commercial offer marker" $CommercialOffer "PLATFORM_LICENSE_SETUP_SUPPORT"
Test-Marker "Commercial offer marker" $CommercialOffer "CONTROLLED_7000_ROLLOUT"

Test-Marker "Pricing marker" $PricingOptions "PHASE86_PRICING_OPTIONS"
Test-Marker "Pricing marker" $PricingOptions "PILOT_OPTION"
Test-Marker "Pricing marker" $PricingOptions "INTERNAL_USE_OPTION"
Test-Marker "Pricing marker" $PricingOptions "RESELLER_OPTION"

Test-Marker "License support marker" $LicenseSupportScope "PHASE86_LICENSE_SUPPORT_SCOPE"
Test-Marker "License support marker" $LicenseSupportScope "LICENSE_NOT_OWNERSHIP_BY_DEFAULT"
Test-Marker "License support marker" $LicenseSupportScope "SUPPORT_SCOPE_DEFINED"

Test-Marker "Resale marker" $ResaleRightsTerms "PHASE86_RESALE_RIGHTS_TERMS"
Test-Marker "Resale marker" $ResaleRightsTerms "RESELLER_RIGHTS_REQUIRE_WRITTEN_TERMS"
Test-Marker "Resale marker" $ResaleRightsTerms "NO_UNRESTRICTED_RESALE_BY_DEFAULT"

Test-Marker "Payment marker" $PaymentMilestones "PHASE86_PAYMENT_MILESTONES"
Test-Marker "Payment marker" $PaymentMilestones "PAYMENT_BEFORE_PRODUCTION_IMPORT"
Test-Marker "Payment marker" $PaymentMilestones "STAGED_DELIVERY_PAYMENT"

Test-Marker "Checklist marker" $FinalSalesChecklist "PHASE86_FINAL_SALES_HANDOVER_CHECKLIST"
Test-Marker "Checklist marker" $FinalSalesChecklist "SELL_READY_PACKAGE"
Test-Marker "Checklist marker" $FinalSalesChecklist "BUYER_LINK_AND_ZIP"

Test-Marker "Email marker" $BuyerEmailDraft "PHASE86_BUYER_EMAIL_DRAFT"
Test-Marker "Email marker" $BuyerEmailDraft "BUYER_ONLY_LINK_INCLUDED"
Test-Marker "Email marker" $BuyerEmailDraft "COMMERCIAL_NEXT_STEP"

# Safety forbidden checks
$DocsToCheck = @(
    $CommercialOffer,
    $PricingOptions,
    $LicenseSupportScope,
    $ResaleRightsTerms,
    $PaymentMilestones,
    $FinalSalesChecklist,
    $BuyerEmailDraft
)

$ForbiddenText = @(
    "source code included",
    "super admin credentials included",
    "unrestricted resale included",
    "real 7000 import allowed immediately",
    "GDPR not required",
    "is a diagnostic medical device",
    "share Render secrets",
    "share database URL"
)

foreach ($Doc in $DocsToCheck) {
    $Content = Read-FileSafe $Doc

    foreach ($Text in $ForbiddenText) {
        if (ContainsText $Content $Text) {
            Add-Result ("Forbidden text absent in " + (Split-Path $Doc -Leaf) + ": " + $Text) "FAIL" "Forbidden text found."
        } else {
            Add-Result ("Forbidden text absent in " + (Split-Path $Doc -Leaf) + ": " + $Text) "PASS" "Forbidden text absent."
        }
    }
}

# Git warning
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE86_FINAL_COMMERCIAL_SALE_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 86 Final Commercial Sale Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Commercial sale pack folder:"
Write-Host $DocsDir
Write-Host ""
Write-Host "Commercial offer:"
Write-Host $CommercialOffer
Write-Host ""
Write-Host "Pricing options:"
Write-Host $PricingOptions
Write-Host ""
Write-Host "Final sales checklist:"
Write-Host $FinalSalesChecklist
Write-Host ""
Write-Host "Buyer email draft:"
Write-Host $BuyerEmailDraft
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
