# RAFTOP CPAP CARE Pro
# Phase 85 - Buyer Acceptance / Production Rollout Signoff Pack
# ASCII-safe script.
# Creates buyer acceptance, production rollout signoff, GDPR blocker, and import approval documents.
# Does not import real patient data.
# Does not create production users.
# Does not write to production database.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-rollout"
$ToolsDir = Join-Path $Root "tools"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production"

$BuyerAcceptanceDoc = Join-Path $DocsDir "85_BUYER_ACCEPTANCE_CHECKLIST.md"
$ProductionRolloutSignoffDoc = Join-Path $DocsDir "85_PRODUCTION_ROLLOUT_SIGNOFF.md"
$ImportApprovalDoc = Join-Path $DocsDir "85_7000_PATIENT_IMPORT_APPROVAL_FORM.md"
$GdprBlockerDoc = Join-Path $DocsDir "85_GDPR_DPA_BLOCKER_NOTICE.md"
$CommercialAcceptanceDoc = Join-Path $DocsDir "85_COMMERCIAL_ACCEPTANCE_NOTE.md"
$FinalHandoverDoc = Join-Path $DocsDir "85_FINAL_BUYER_TO_PRODUCTION_HANDOVER.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase85_buyer_acceptance_production_rollout_signoff_pack_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 85 Buyer Acceptance Production Rollout Signoff Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: create buyer acceptance and production rollout signoff documents before any real 7000-patient import." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not import real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 85 - Buyer Acceptance / Production Rollout Signoff Pack..."
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

$BuyerAcceptanceContent = @'
# RAFTOP CPAP CARE Pro - Buyer Acceptance Checklist

REQUIRED_MARKER: PHASE85_BUYER_ACCEPTANCE_CHECKLIST
REQUIRED_MARKER: BUYER_ACCEPTANCE_BEFORE_PRODUCTION
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_BEFORE_SIGNOFF
REQUIRED_MARKER: NOT_DIAGNOSTIC_MEDICAL_DEVICE

## Buyer acceptance purpose

This checklist confirms that the buyer has reviewed the buyer-only product view, full guide PDF, production rollout process, access rules, and staged import controls.

## Product accepted for pilot / controlled production rollout

Buyer confirms review of:

[ ] Buyer-only link
[ ] Buyer-only ZIP
[ ] Full Guide PDF
[ ] ATLAS / AirView-like Monitoring explanation
[ ] SleepHQ-style CPAP Analysis explanation
[ ] 80 Hours Compliance explanation
[ ] Compliance Rescue explanation
[ ] Production tenant setup
[ ] Role matrix
[ ] Credentials delivery rules
[ ] CSV template
[ ] 7000-patient staged import plan
[ ] ATLAS / 80h / reports synthetic verification

## Boundary

The platform supports:
- CPAP operational monitoring
- ATLAS prioritization
- 80 Hours Compliance tracking
- follow-up workflow
- reporting
- doctor / clinic resale model preparation

The platform is not presented as:
- diagnostic medical device
- replacement for medical judgment
- automatic clinical decision system
- direct copy of AirView or SleepHQ

## Acceptance

Buyer representative:
Role:
Company:
Date:
Signature:
'@

Set-Content -Path $BuyerAcceptanceDoc -Value $BuyerAcceptanceContent -Encoding UTF8

$ProductionRolloutContent = @'
# RAFTOP CPAP CARE Pro - Production Rollout Signoff

REQUIRED_MARKER: PHASE85_PRODUCTION_ROLLOUT_SIGNOFF
REQUIRED_MARKER: STAGED_ROLLOUT_REQUIRED
REQUIRED_MARKER: SIGNOFF_BEFORE_EACH_STAGE
REQUIRED_MARKER: NO_DIRECT_7000_IMPORT

## Production rollout stages

Stage 1:
100 rows

Stage 2:
500 rows

Stage 3:
2000 rows

Stage 4:
7000 rows

## Stage 1 - 100 rows

Required before execution:
[ ] Commercial agreement signed
[ ] GDPR / DPA approved
[ ] Tenant approved
[ ] Users approved
[ ] CSV validated
[ ] No direct identifiers confirmed
[ ] Backup / rollback principle confirmed

Acceptance after execution:
[ ] Patients visible
[ ] Devices linked
[ ] ATLAS queue visible
[ ] 80 Hours Compliance visible
[ ] Reports visible
[ ] User access correct
[ ] No cross-tenant leakage

Signoff:
Name:
Role:
Date:
Signature:

## Stage 2 - 500 rows

Proceed only after Stage 1 signoff.

Signoff:
Name:
Role:
Date:
Signature:

## Stage 3 - 2000 rows

Proceed only after Stage 2 signoff.

Signoff:
Name:
Role:
Date:
Signature:

## Stage 4 - 7000 rows

Proceed only after Stage 3 signoff.

Signoff:
Name:
Role:
Date:
Signature:
'@

Set-Content -Path $ProductionRolloutSignoffDoc -Value $ProductionRolloutContent -Encoding UTF8

$ImportApprovalContent = @'
# RAFTOP CPAP CARE Pro - 7000 Patient Import Approval Form

REQUIRED_MARKER: PHASE85_7000_PATIENT_IMPORT_APPROVAL_FORM
REQUIRED_MARKER: IMPORT_APPROVAL_REQUIRED
REQUIRED_MARKER: GDPR_DPA_REQUIRED
REQUIRED_MARKER: CSV_VALIDATION_REQUIRED

## Import approval

Production tenant:
raftopoulos-production

Import scope:
Controlled CPAP patient portfolio import.

Expected scale:
Up to 7000 patient records.

## Required approvals before real data import

[ ] Commercial agreement signed
[ ] GDPR / DPA signed
[ ] Data controller / processor responsibilities confirmed
[ ] CSV template approved
[ ] CSV validation passed
[ ] No direct identifiers in import file
[ ] Tenant admin approved
[ ] Operations users approved
[ ] Viewer users approved
[ ] Stage 100 approved
[ ] Stage 500 approved
[ ] Stage 2000 approved
[ ] Stage 7000 approved

## Hard blockers

Import is blocked if:
- CSV contains names, phones, emails, AMKA, addresses, or direct identifiers
- tenant_id is not raftopoulos-production
- patient_external_id is not unique
- device_serial is missing
- consent_basis is missing
- GDPR / DPA is not approved
- prior stage signoff is missing

## Approval

Approved by:
Role:
Date:
Signature:
'@

Set-Content -Path $ImportApprovalDoc -Value $ImportApprovalContent -Encoding UTF8

$GdprBlockerContent = @'
# RAFTOP CPAP CARE Pro - GDPR / DPA Blocker Notice

REQUIRED_MARKER: PHASE85_GDPR_DPA_BLOCKER_NOTICE
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_WITHOUT_DPA
REQUIRED_MARKER: DATA_PROCESSING_RESPONSIBILITY_REQUIRED
REQUIRED_MARKER: PSEUDONYMIZED_IMPORT_REQUIRED

## Hard rule

No real patient data may be imported before GDPR / DPA approval.

## Required decisions

Before real data import, the buyer must confirm:

[ ] Who is the data controller
[ ] Who is the data processor
[ ] Hosting location
[ ] User access responsibilities
[ ] Data retention rules
[ ] Export rules
[ ] Deletion rules
[ ] Breach notification process
[ ] Lawful basis / consent basis
[ ] Pseudonymization approach

## Allowed before GDPR / DPA

Allowed:
- synthetic data
- pseudonymized test data
- buyer-only view
- full guide PDF
- CSV schema review
- dry-run import simulation

Not allowed:
- live identifiable patient import
- AMKA import
- phone/email import
- full name import
- address import
- raw patient list import
'@

Set-Content -Path $GdprBlockerDoc -Value $GdprBlockerContent -Encoding UTF8

$CommercialAcceptanceContent = @'
# RAFTOP CPAP CARE Pro - Commercial Acceptance Note

REQUIRED_MARKER: PHASE85_COMMERCIAL_ACCEPTANCE_NOTE
REQUIRED_MARKER: PLATFORM_LICENSE_SETUP_SUPPORT
REQUIRED_MARKER: RESALE_RIGHTS_REQUIRE_AGREEMENT
REQUIRED_MARKER: SOURCE_CODE_NOT_INCLUDED_BY_DEFAULT

## Commercial scope

Recommended sale structure:

1. Platform activation / setup fee
2. Annual or monthly platform license
3. Support and maintenance plan
4. Optional resale rights for doctors / clinics
5. Optional custom development / change requests

## Included by default

Included:
- buyer-only presentation package
- production tenant setup plan
- role/access matrix
- CSV template
- synthetic 7000 dry-run pack
- ATLAS / 80h / reports verification outputs
- staged rollout plan
- support process definition

## Not included by default

Not included unless separately agreed:
- source code handover
- GitHub repository access
- Render account transfer
- database secrets
- .env files
- super admin credentials
- unrestricted resale without written terms
- unlimited custom development

## Resale rights

Doctor / clinic resale rights must be explicitly defined:
- territory
- duration
- pricing model
- support responsibility
- branding rules
- data responsibility
- revenue share or license fee
'@

Set-Content -Path $CommercialAcceptanceDoc -Value $CommercialAcceptanceContent -Encoding UTF8

$FinalHandoverContent = @'
# RAFTOP CPAP CARE Pro - Final Buyer to Production Handover

REQUIRED_MARKER: PHASE85_FINAL_BUYER_TO_PRODUCTION_HANDOVER
REQUIRED_MARKER: BUYER_PACK_READY
REQUIRED_MARKER: PRODUCTION_ROLLOUT_READY_AFTER_SIGNOFF
REQUIRED_MARKER: REAL_IMPORT_BLOCKED_UNTIL_APPROVAL

## Handover package

Buyer-facing handover includes:

1. Buyer-only link
2. Buyer-only ZIP
3. Full Guide PDF
4. Production tenant setup
5. Role matrix
6. Credentials delivery rules
7. 7000-patient CSV template
8. CSV validation rules
9. Synthetic dry-run dataset
10. ATLAS / 80h / reports verification
11. Production import staging gate
12. Buyer acceptance checklist
13. Production rollout signoff
14. GDPR / DPA blocker notice
15. Commercial acceptance note

## Final operational statement

The platform is ready for buyer acceptance and controlled production rollout preparation.

Real 7000-patient import is blocked until:
- commercial agreement
- GDPR / DPA
- CSV validation
- role approval
- staged signoff
- buyer acceptance
'@

Set-Content -Path $FinalHandoverDoc -Value $FinalHandoverContent -Encoding UTF8

# File checks
Test-PathExists "Buyer acceptance checklist exists" $BuyerAcceptanceDoc
Test-PathExists "Production rollout signoff exists" $ProductionRolloutSignoffDoc
Test-PathExists "7000 import approval form exists" $ImportApprovalDoc
Test-PathExists "GDPR DPA blocker notice exists" $GdprBlockerDoc
Test-PathExists "Commercial acceptance note exists" $CommercialAcceptanceDoc
Test-PathExists "Final handover doc exists" $FinalHandoverDoc

# Marker checks
Test-Marker "Buyer acceptance marker" $BuyerAcceptanceDoc "PHASE85_BUYER_ACCEPTANCE_CHECKLIST"
Test-Marker "Buyer acceptance marker" $BuyerAcceptanceDoc "BUYER_ACCEPTANCE_BEFORE_PRODUCTION"
Test-Marker "Buyer acceptance marker" $BuyerAcceptanceDoc "NOT_DIAGNOSTIC_MEDICAL_DEVICE"

Test-Marker "Production rollout marker" $ProductionRolloutSignoffDoc "PHASE85_PRODUCTION_ROLLOUT_SIGNOFF"
Test-Marker "Production rollout marker" $ProductionRolloutSignoffDoc "STAGED_ROLLOUT_REQUIRED"
Test-Marker "Production rollout marker" $ProductionRolloutSignoffDoc "NO_DIRECT_7000_IMPORT"

Test-Marker "Import approval marker" $ImportApprovalDoc "PHASE85_7000_PATIENT_IMPORT_APPROVAL_FORM"
Test-Marker "Import approval marker" $ImportApprovalDoc "IMPORT_APPROVAL_REQUIRED"
Test-Marker "Import approval marker" $ImportApprovalDoc "GDPR_DPA_REQUIRED"
Test-Marker "Import approval marker" $ImportApprovalDoc "CSV_VALIDATION_REQUIRED"

Test-Marker "GDPR blocker marker" $GdprBlockerDoc "PHASE85_GDPR_DPA_BLOCKER_NOTICE"
Test-Marker "GDPR blocker marker" $GdprBlockerDoc "NO_REAL_PATIENT_DATA_WITHOUT_DPA"
Test-Marker "GDPR blocker marker" $GdprBlockerDoc "PSEUDONYMIZED_IMPORT_REQUIRED"

Test-Marker "Commercial marker" $CommercialAcceptanceDoc "PHASE85_COMMERCIAL_ACCEPTANCE_NOTE"
Test-Marker "Commercial marker" $CommercialAcceptanceDoc "PLATFORM_LICENSE_SETUP_SUPPORT"
Test-Marker "Commercial marker" $CommercialAcceptanceDoc "SOURCE_CODE_NOT_INCLUDED_BY_DEFAULT"

Test-Marker "Final handover marker" $FinalHandoverDoc "PHASE85_FINAL_BUYER_TO_PRODUCTION_HANDOVER"
Test-Marker "Final handover marker" $FinalHandoverDoc "BUYER_PACK_READY"
Test-Marker "Final handover marker" $FinalHandoverDoc "PRODUCTION_ROLLOUT_READY_AFTER_SIGNOFF"
Test-Marker "Final handover marker" $FinalHandoverDoc "REAL_IMPORT_BLOCKED_UNTIL_APPROVAL"

# Forbidden unsafe claims
$DocsToCheck = @(
    $BuyerAcceptanceDoc,
    $ProductionRolloutSignoffDoc,
    $ImportApprovalDoc,
    $GdprBlockerDoc,
    $CommercialAcceptanceDoc,
    $FinalHandoverDoc
)

$ForbiddenText = @(
    "direct 7000 import allowed",
    "no GDPR required",
    "source code included by default",
    "is a diagnostic medical device",
    "skip signoff",
    "ignore validation",
    "share super admin"
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

# Git working tree warning only, because this script creates files during the run
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
    $FinalStatus = "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 85 Buyer Acceptance / Production Rollout Signoff Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Buyer acceptance:"
Write-Host $BuyerAcceptanceDoc
Write-Host ""
Write-Host "Production rollout signoff:"
Write-Host $ProductionRolloutSignoffDoc
Write-Host ""
Write-Host "Import approval:"
Write-Host $ImportApprovalDoc
Write-Host ""
Write-Host "GDPR blocker:"
Write-Host $GdprBlockerDoc
Write-Host ""
Write-Host "Commercial acceptance:"
Write-Host $CommercialAcceptanceDoc
Write-Host ""
Write-Host "Final handover:"
Write-Host $FinalHandoverDoc
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
