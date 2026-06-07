# RAFTOP CPAP CARE Pro
# Phase 123 - GDPR / Data Boundary Pack
# Creates operational GDPR/data boundary documents for Pilot20 and production rollout.
# Does NOT provide legal advice.
# Does NOT expose secrets.
# Does NOT modify application data.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$ComplianceDir = Join-Path $Root "docs\compliance"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ComplianceDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase123_gdpr_data_boundary_pack_" + $Timestamp + ".md")

$MainDoc = Join-Path $ComplianceDir "123_GDPR_DATA_BOUNDARY_PACK.md"
$BuyerRulesDoc = Join-Path $ComplianceDir "123_BUYER_DATA_INTAKE_RULES.md"
$PseudonymizationDoc = Join-Path $ComplianceDir "123_PSEUDONYMIZATION_POLICY.md"
$DpaChecklistDoc = Join-Path $ComplianceDir "123_DPA_LEGAL_REVIEW_CHECKLIST.md"
$IncidentDoc = Join-Path $ComplianceDir "123_DATA_INCIDENT_RESPONSE_CHECKLIST.md"
$PilotDoc = Join-Path $DocsDir "123_PILOT20_GDPR_DATA_BOUNDARY_SUMMARY.md"

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

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 123 GDPR / Data Boundary Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 123 - GDPR / Data Boundary Pack..."
Write-Host ""

# -------------------------------------------------------------------
# Main GDPR / data boundary pack
# -------------------------------------------------------------------
$MainDocContent = @'
# RAFTOP CPAP CARE Pro - GDPR / Data Boundary Pack

REQUIRED_MARKER: PHASE123_GDPR_DATA_BOUNDARY_PACK
REQUIRED_MARKER: DATA_BOUNDARY_READY
REQUIRED_MARKER: PSEUDONYMIZED_PILOT_RULE_READY
REQUIRED_MARKER: PRODUCTION_DPA_REVIEW_REQUIRED
REQUIRED_MARKER: READY_FOR_PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK

## Important note

This document is an operational data-boundary pack.
It is not legal advice.
Final production documents should be reviewed by legal counsel / DPO before full rollout.

## Product context

RAFTOP CPAP CARE Pro processes CPAP operational data for compliance follow-up and 80-hour early warning.

The platform should use pseudonymized operational identifiers wherever possible.

## Core principle

The platform does not need direct patient identifiers for the Pilot20 workflow.

The system can function with:
- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code
- AirView usage metrics
- AHI
- leak
- usage hours
- last data date

## Forbidden unless legally approved and explicitly required

Do not enter:
- patient full name
- first name
- last name
- phone number
- email address
- AMKA
- street address
- exact date of birth
- free text medical history
- direct patient identifiers

## Pilot20 rule

Pilot20 must stay pseudonymized.

Allowed examples:
- CPAP-000001
- P-000001
- DR-001
- ATHENS
- RS-DEVICE-000001

Not allowed examples:
- real patient name
- real phone
- real email
- AMKA
- home address

## AirView export rule

AirView export should be anonymized before upload when possible.

Allowed AirView fields:
- Serial Number
- Start Date
- Last Data Date
- Usage Hours
- Days Used
- AHI
- Leak / 95th Percentile Leak

Avoid importing:
- name
- phone
- email
- AMKA
- address
- DOB

## Roles and access

Platform owner / super user:
- controls platform access
- can lock/unlock tenant
- can support imports and monitoring

Buyer / Raftopoulos pilot user:
- can access Pilot20 pages
- can enter pseudonymized patients
- can upload AirView CSV
- can view import history
- can view rolling 80h report
- cannot access source code
- cannot access database
- cannot access infrastructure
- cannot access internal control key

## Production legal review required

Before full 7,000 patient rollout:
- confirm controller / processor roles
- sign DPA if required
- define data retention
- define support access
- define breach notification flow
- define deletion/export rights
- define audit log requirements
- define backup retention
'@

Set-Content -Path $MainDoc -Value $MainDocContent -Encoding UTF8

# -------------------------------------------------------------------
# Buyer data intake rules
# -------------------------------------------------------------------
$BuyerRulesContent = @'
# RAFTOP CPAP CARE Pro - Buyer Data Intake Rules

REQUIRED_MARKER: PHASE123_BUYER_DATA_INTAKE_RULES
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS_IN_PILOT
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING_RULE
REQUIRED_MARKER: AIRVIEW_EXPORT_DATA_RULES

## What the buyer may enter

For Pilot20 and controlled rollout, use pseudonymized data.

Allowed fields:
- Patient External ID
- Patient Code
- Device Serial
- Device Model
- Setup Date
- Doctor Code
- Branch Code

## What the buyer must not enter

Do not enter:
- patient name
- patient surname
- phone
- mobile
- email
- AMKA
- address
- exact date of birth
- free text with identifiable information

## Why

The application does not need direct identity to calculate:
- usage hours
- remaining hours to 80
- required hours per day
- AHI
- leak
- risk level
- rescue priority

## Device serial rule

Device Serial in Patient Entry must match Serial Number in AirView export.

If they do not match:
- AirView row is skipped
- Unmatched Devices page shows the failed serial
- the user must correct the Patient Entry device serial or export format

## Upload rule

Before uploading AirView CSV:
1. Confirm no direct identifiers are included.
2. Confirm serial numbers are present.
3. Confirm usage hours are present.
4. Confirm last data date is present.
5. Upload only the necessary fields.

## Buyer-facing wording

Use operational patient codes, not real patient identities.
'@

Set-Content -Path $BuyerRulesDoc -Value $BuyerRulesContent -Encoding UTF8

# -------------------------------------------------------------------
# Pseudonymization policy
# -------------------------------------------------------------------
$PseudonymizationContent = @'
# RAFTOP CPAP CARE Pro - Pseudonymization Policy

REQUIRED_MARKER: PHASE123_PSEUDONYMIZATION_POLICY
REQUIRED_MARKER: PATIENT_CODE_POLICY_READY
REQUIRED_MARKER: DEVICE_SERIAL_ALLOWED
REQUIRED_MARKER: IDENTITY_SEPARATION_REQUIRED

## Purpose

The platform should operate using pseudonymized patient references wherever possible.

## Recommended code format

patient_external_id:
P-000001

patient_code:
CPAP-000001

doctor_external_id:
DR-001

branch_code:
ATHENS

## Separation rule

If Raftopoulos keeps a mapping between patient code and real patient identity, that mapping should remain outside the RAFTOP CPAP CARE Pro application unless there is a signed legal basis and production data-processing agreement.

## Application rule

The application stores operational therapy and compliance data.

It does not require:
- name
- phone
- email
- AMKA
- address

## AirView matching key

The technical matching key is:
device_serial

## Why device serial is needed

The AirView export identifies therapy usage by device serial.
The platform uses this to update the correct pseudonymized patient record.

## Minimum necessary data

Use only what is needed for:
- 80h compliance calculation
- rolling 30-day risk
- rescue prioritization
- AHI/leak review
- import audit
- unmatched device resolution
'@

Set-Content -Path $PseudonymizationDoc -Value $PseudonymizationContent -Encoding UTF8

# -------------------------------------------------------------------
# DPA / legal review checklist
# -------------------------------------------------------------------
$DpaChecklistContent = @'
# RAFTOP CPAP CARE Pro - DPA / Legal Review Checklist

REQUIRED_MARKER: PHASE123_DPA_LEGAL_REVIEW_CHECKLIST
REQUIRED_MARKER: LEGAL_REVIEW_REQUIRED_BEFORE_FULL_ROLLOUT
REQUIRED_MARKER: DATA_PROCESSING_AGREEMENT_CHECKLIST_READY
REQUIRED_MARKER: PRODUCTION_ROLLOUT_NOT_LEGAL_FINAL_WITHOUT_REVIEW

## Important

This is not legal advice.
Use this checklist with legal counsel / DPO before full production rollout.

## Items to define

1. Parties
- platform provider
- Raftopoulos
- clinics / doctors if applicable

2. Roles
- controller
- processor
- sub-processor if applicable

3. Processing purpose
- CPAP usage monitoring
- 80h compliance support
- patient follow-up prioritization
- operational reporting

4. Data categories
- pseudonymized patient code
- device serial
- therapy usage
- AHI
- leak
- setup date
- doctor/branch code

5. Special category data assessment
- confirm whether CPAP therapy usage data is health-related data
- define legal basis
- define safeguards

6. Access control
- who can login
- who can upload exports
- who can see reports
- who can lock/unlock tenant
- who can access audit logs

7. Retention
- how long imports are kept
- how long backups are kept
- how long audit logs are kept

8. Deletion and export
- deletion request process
- export request process
- tenant offboarding process

9. Incident response
- internal notification
- buyer notification
- DPO/legal review
- evidence preservation

10. Technical measures
- pseudonymization
- role-based access
- tenant isolation
- audit logs
- backup/restore controls
- secret management

## Production gate

Full 7,000 patient rollout should not proceed until legal/data-processing review is complete.
'@

Set-Content -Path $DpaChecklistDoc -Value $DpaChecklistContent -Encoding UTF8

# -------------------------------------------------------------------
# Incident response checklist
# -------------------------------------------------------------------
$IncidentContent = @'
# RAFTOP CPAP CARE Pro - Data Incident Response Checklist

REQUIRED_MARKER: PHASE123_DATA_INCIDENT_RESPONSE_CHECKLIST
REQUIRED_MARKER: INCIDENT_RESPONSE_READY
REQUIRED_MARKER: ACCESS_LOCK_OPTION_READY
REQUIRED_MARKER: EVIDENCE_PRESERVATION_READY

## When to use

Use this checklist if:
- wrong file was uploaded
- direct identifiers were uploaded accidentally
- unauthorized access is suspected
- buyer reports unexpected patient data exposure
- database or backup exposure is suspected
- credentials were shared incorrectly

## Immediate actions

1. Do not delete evidence immediately.
2. Record time and description.
3. Lock Pilot20 tenant if needed.
4. Preserve logs and import history.
5. Identify affected upload batch.
6. Identify whether direct identifiers were involved.
7. Notify responsible internal person.
8. Escalate to legal/DPO if required.

## Tenant lock

Use internal control:

.\tools\raftop_pilot20_tenant_control.ps1 -Action lock -Reason "data_incident_review"

After investigation:

.\tools\raftop_pilot20_tenant_control.ps1 -Action unlock -Reason "data_incident_review_completed"

## Evidence to collect

- import batch ID
- filename
- upload timestamp
- user who uploaded
- row count
- skipped/error count
- whether direct identifiers were present
- affected endpoint/page
- screenshots if needed

## Do not

- do not send secrets by email
- do not send database URLs
- do not export raw data unnecessarily
- do not give buyer infrastructure access
- do not commit files containing patient identifiers

## Follow-up

After containment:
1. correct the file format
2. remove direct identifiers from future workflow
3. update buyer instructions if needed
4. document final outcome
'@

Set-Content -Path $IncidentDoc -Value $IncidentContent -Encoding UTF8

# -------------------------------------------------------------------
# Pilot summary doc
# -------------------------------------------------------------------
$PilotDocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 GDPR Data Boundary Summary

REQUIRED_MARKER: PHASE123_PILOT20_GDPR_DATA_BOUNDARY_SUMMARY
REQUIRED_MARKER: PILOT20_PSEUDONYMIZED_BOUNDARY_READY
REQUIRED_MARKER: BUYER_SAFE_DATA_RULES_READY
REQUIRED_MARKER: NO_DIRECT_PATIENT_IDENTIFIERS

## Pilot20 safe data boundary

The Pilot20 environment should only use pseudonymized operational data.

## Give this instruction to buyer

Do not enter patient names, phones, emails, AMKA, addresses or exact date of birth.

Use only:
- patient code
- device serial
- device model
- setup date
- doctor code
- branch code
- AirView usage metrics

## Why this is enough

The platform can calculate:
- progress to 80h
- remaining hours
- required hours per day
- risk level
- rescue priority
- AHI/leak flags

without direct patient identity.

## Full production

Before full rollout, legal/DPO review is required.
'@

Set-Content -Path $PilotDoc -Value $PilotDocContent -Encoding UTF8

# -------------------------------------------------------------------
# Check created docs
# -------------------------------------------------------------------
foreach ($Path in @($MainDoc, $BuyerRulesDoc, $PseudonymizationDoc, $DpaChecklistDoc, $IncidentDoc, $PilotDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Phase123 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase123 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# -------------------------------------------------------------------
# Required marker checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($MainDoc, $BuyerRulesDoc, $PseudonymizationDoc, $DpaChecklistDoc, $IncidentDoc, $PilotDoc)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE123_GDPR_DATA_BOUNDARY_PACK",
    "DATA_BOUNDARY_READY",
    "PSEUDONYMIZED_PILOT_RULE_READY",
    "PRODUCTION_DPA_REVIEW_REQUIRED",
    "PHASE123_BUYER_DATA_INTAKE_RULES",
    "PHASE123_PSEUDONYMIZATION_POLICY",
    "PHASE123_DPA_LEGAL_REVIEW_CHECKLIST",
    "PHASE123_DATA_INCIDENT_RESPONSE_CHECKLIST",
    "READY_FOR_PHASE124_FINAL_BUYER_COMMERCIAL_HANDOVER_PACK"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase123 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase123 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase123 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase123 content absent: " + $Forbidden) "PASS" "Absent."
    }
}

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
    $FinalStatus = "PHASE123_GDPR_DATA_BOUNDARY_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE123_GDPR_DATA_BOUNDARY_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 123 GDPR / Data Boundary Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Compliance docs:"
Write-Host $MainDoc
Write-Host $BuyerRulesDoc
Write-Host $PseudonymizationDoc
Write-Host $DpaChecklistDoc
Write-Host $IncidentDoc
Write-Host ""
Write-Host "Pilot doc:"
Write-Host $PilotDoc
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