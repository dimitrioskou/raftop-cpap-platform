# RAFTOP CPAP CARE Pro
# Phase 80 - Production Tenant / Roles / Access Pack
# ASCII-safe script.
# Creates controlled production tenant and access documentation for 7000-patient rollout.
# Does not create real users in production DB.
# Does not store credentials.
# Does not import real patient data.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-rollout"
$ToolsDir = Join-Path $Root "tools"

$TenantFile = Join-Path $DocsDir "80_PRODUCTION_TENANT_SETUP.md"
$RoleMatrixFile = Join-Path $DocsDir "80_ROLE_MATRIX.csv"
$AccessPackFile = Join-Path $DocsDir "80_ACCESS_AND_CREDENTIALS_DELIVERY_RULES.md"
$OnboardingFile = Join-Path $DocsDir "80_7000_PATIENT_ROLLOUT_ACCESS_ONBOARDING.md"
$SignoffFile = Join-Path $DocsDir "80_PRODUCTION_ACCESS_SIGNOFF.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase80_production_tenant_roles_access_pack_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 80 Production Tenant Roles Access Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 80 Production Tenant Roles Access Pack..."
Write-Host ""

$TenantDoc = @'
# RAFTOP CPAP CARE Pro - Production Tenant Setup

REQUIRED_MARKER: PHASE80_PRODUCTION_TENANT_SETUP
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION
REQUIRED_MARKER: NO_REAL_PATIENT_DATA_BEFORE_DPA
REQUIRED_MARKER: 7000_PATIENT_ROLLOUT_CONTROLLED

## Production tenant

Tenant name:
Raftopoulos Production

Tenant slug:
raftopoulos-production

Tenant purpose:
Production environment for controlled 7000-patient CPAP monitoring rollout.

## Scope

This tenant is intended for:
- CPAP patient portfolio monitoring
- ATLAS priority queue
- 80 Hours Compliance tracking
- Follow-up tasks
- Management reports
- Future doctor / clinic resale model

## Hard rule

No real patient data is imported before:
- commercial agreement
- GDPR / DPA agreement
- access role approval
- data intake rules
- acceptance signoff

## Rollout principle

The 7000-patient rollout must be controlled:

Stage 1: 100 records validation
Stage 2: 500 records validation
Stage 3: 2000 records validation
Stage 4: 7000 records controlled production import

Direct 7000-patient import without validation is not allowed.
'@

Set-Content -Path $TenantFile -Value $TenantDoc -Encoding UTF8

$RoleCsv = @'
role_code,role_name,owner,scope,allowed_actions,not_allowed
platform_super_admin,Platform Super Admin,Dimitrios / Platform Owner,All tenants,System control; tenant activation; emergency lock; release control,Must not be shared with buyer
tenant_admin,Raftopoulos Tenant Admin,Raftopoulos Management,Raftopoulos tenant only,Manage tenant users; view dashboards; approve rollout,No platform secrets; no source code
operations_user,Operations / Follow-up User,Raftopoulos Team,Assigned tenant patients,View patients; manage tasks; add follow-up notes,No tenant billing; no platform settings
viewer,Management Viewer,Raftopoulos Management,Read-only tenant dashboard,View reports and executive dashboard,No edits; no exports unless approved
doctor_user_future,Doctor / Clinic User,Doctor or clinic,Only assigned doctor patients,View own patients; view reports,No other doctor data
patient_user_future,Patient User,Patient,Own patient portal only,View own CPAP summary,No other patient data
'@

Set-Content -Path $RoleMatrixFile -Value $RoleCsv -Encoding UTF8

$AccessRules = @'
# RAFTOP CPAP CARE Pro - Access and Credentials Delivery Rules

REQUIRED_MARKER: PHASE80_ACCESS_CREDENTIALS_RULES
REQUIRED_MARKER: CREDENTIALS_SEPARATE_DELIVERY
REQUIRED_MARKER: NO_SECRETS_IN_ZIP
REQUIRED_MARKER: NO_SOURCE_CODE_HANDOVER

## Rule 1 - Credentials are never inside the ZIP

The buyer-only ZIP must never contain:
- passwords
- database URLs
- API keys
- Render secrets
- GitHub secrets
- .env files
- source code
- internal scripts

## Rule 2 - Credentials are delivered separately

Credentials are delivered only after:
- purchase or pilot agreement
- named recipient confirmation
- role approval

## Rule 3 - Initial credentials

Each account must have:
- user email
- assigned role
- temporary password
- first-login password change requirement

## Rule 4 - Super admin

Platform Super Admin remains controlled by the platform owner.
This account is not shared with tenant users.

## Rule 5 - Tenant admin

Raftopoulos may receive Tenant Admin access for its own tenant only.
Tenant Admin cannot access platform secrets or other tenants.

## Rule 6 - Patient data

Real patient data must not be uploaded before GDPR / DPA and data intake approval.
'@

Set-Content -Path $AccessPackFile -Value $AccessRules -Encoding UTF8

$OnboardingDoc = @'
# RAFTOP CPAP CARE Pro - 7000 Patient Rollout Access Onboarding

REQUIRED_MARKER: PHASE80_7000_ACCESS_ONBOARDING
REQUIRED_MARKER: CONTROLLED_IMPORT_STAGES
REQUIRED_MARKER: ATLAS_80H_REPORTS_VERIFICATION

## Day 0 - Buyer agreement

Required:
- commercial approval
- support scope
- GDPR / DPA approval
- named users
- production tenant approval

## Day 1 - Access setup

Create:
- 1 tenant admin
- 2 operations users
- 1 management viewer

Optional later:
- doctor users
- patient users

## Day 2 - CSV validation

Use pseudonymized or approved CSV.
Validate:
- patient_id
- device_serial
- month_usage_hours
- usage_hours_30d
- last_data_date
- ahi
- leak
- doctor_id
- consent / lawful basis marker
- tenant_id

## Day 3 - Controlled import test

Import first 100 rows.
Check:
- patients list
- devices
- ATLAS
- 80 Hours Compliance
- reports
- tasks

## Stage rollout

Stage 1: 100 rows
Stage 2: 500 rows
Stage 3: 2000 rows
Stage 4: 7000 rows

Each stage requires validation before proceeding.
'@

Set-Content -Path $OnboardingFile -Value $OnboardingDoc -Encoding UTF8

$SignoffDoc = @'
# RAFTOP CPAP CARE Pro - Production Access Signoff

REQUIRED_MARKER: PHASE80_PRODUCTION_ACCESS_SIGNOFF
REQUIRED_MARKER: SIGNOFF_BEFORE_7000_IMPORT
REQUIRED_MARKER: BUYER_ACCEPTANCE_REQUIRED

## Signoff checklist

Buyer-only link verified:
[ ] Yes

Buyer ZIP received:
[ ] Yes

Full guide PDF reviewed:
[ ] Yes

Production tenant approved:
[ ] Yes

Roles approved:
[ ] Yes

Credentials delivery process approved:
[ ] Yes

GDPR / DPA approved:
[ ] Yes

CSV template approved:
[ ] Yes

100-row import approved:
[ ] Yes

500-row import approved:
[ ] Yes

2000-row import approved:
[ ] Yes

7000-row import approved:
[ ] Yes

## Acceptance

Name:
Role:
Date:
Signature:
'@

Set-Content -Path $SignoffFile -Value $SignoffDoc -Encoding UTF8

# Verify files
Test-PathExists "Tenant setup file exists" $TenantFile
Test-PathExists "Role matrix file exists" $RoleMatrixFile
Test-PathExists "Access rules file exists" $AccessPackFile
Test-PathExists "Onboarding file exists" $OnboardingFile
Test-PathExists "Signoff file exists" $SignoffFile

# Verify markers
Test-Marker "Tenant setup marker" $TenantFile "PHASE80_PRODUCTION_TENANT_SETUP"
Test-Marker "Tenant setup marker" $TenantFile "TENANT_RAFTOPoulos_PRODUCTION"
Test-Marker "Tenant setup marker" $TenantFile "7000_PATIENT_ROLLOUT_CONTROLLED"

Test-Marker "Role matrix marker" $RoleMatrixFile "platform_super_admin"
Test-Marker "Role matrix marker" $RoleMatrixFile "tenant_admin"
Test-Marker "Role matrix marker" $RoleMatrixFile "operations_user"
Test-Marker "Role matrix marker" $RoleMatrixFile "viewer"
Test-Marker "Role matrix marker" $RoleMatrixFile "doctor_user_future"
Test-Marker "Role matrix marker" $RoleMatrixFile "patient_user_future"

Test-Marker "Access rules marker" $AccessPackFile "PHASE80_ACCESS_CREDENTIALS_RULES"
Test-Marker "Access rules marker" $AccessPackFile "CREDENTIALS_SEPARATE_DELIVERY"
Test-Marker "Access rules marker" $AccessPackFile "NO_SECRETS_IN_ZIP"
Test-Marker "Access rules marker" $AccessPackFile "NO_SOURCE_CODE_HANDOVER"

Test-Marker "Onboarding marker" $OnboardingFile "PHASE80_7000_ACCESS_ONBOARDING"
Test-Marker "Onboarding marker" $OnboardingFile "CONTROLLED_IMPORT_STAGES"
Test-Marker "Onboarding marker" $OnboardingFile "ATLAS_80H_REPORTS_VERIFICATION"

Test-Marker "Signoff marker" $SignoffFile "PHASE80_PRODUCTION_ACCESS_SIGNOFF"
Test-Marker "Signoff marker" $SignoffFile "SIGNOFF_BEFORE_7000_IMPORT"
Test-Marker "Signoff marker" $SignoffFile "BUYER_ACCEPTANCE_REQUIRED"

# Optional backend health URL check
$BackendHealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL

if ([string]::IsNullOrWhiteSpace($BackendHealthUrl)) {
    Add-Result "Production backend health URL env set" "WARN" "RAFTOP_PRODUCTION_BACKEND_HEALTH_URL is not set. Backend health not checked."
} else {
    try {
        $HealthResponse = Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 30

        if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
            Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
        } else {
            Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
        }
    } catch {
        Add-Result "Production backend health reachable" "FAIL" ("Could not reach backend health: " + $_.Exception.Message)
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 80 Production Tenant Roles Access Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Docs folder:"
Write-Host $DocsDir
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