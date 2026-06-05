# RAFTOP CPAP CARE Pro
# Phase 95 - Tenant + Users + Credentials Activation Pack
# Creates tenant/user/credential activation plan and SQL template.
# Does NOT execute SQL.
# Does NOT create real users yet.
# Does NOT store real passwords.
# Does NOT print secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$BackendDir = Join-Path $Root "enterprise-backend"
$SqlDir = Join-Path $BackendDir "sql"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $SqlDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase95_tenant_users_credentials_activation_pack_" + $Timestamp + ".md")

$ActivationDoc = Join-Path $DocsDir "95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK.md"
$RoleMatrixCsv = Join-Path $DocsDir "95_RAFTOPoulos_PRODUCTION_USERS_ROLE_MATRIX.csv"
$CredentialsTemplate = Join-Path $DocsDir "95_CREDENTIALS_DELIVERY_TEMPLATE_DO_NOT_COMMIT_SECRETS.md"
$ApplyGuide = Join-Path $DocsDir "95_TENANT_USERS_SQL_APPLY_GUIDE.md"
$SqlTemplate = Join-Path $SqlDir "phase95_tenant_users_activation_template.sql"

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
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 95 Tenant Users Credentials Activation Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: prepare tenant/user/credentials activation without storing real secrets." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not execute SQL." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 95 - Tenant + Users + Credentials Activation Pack..."
Write-Host ""

Check-ReportStatus "Phase 94D production schema apply latest status" "phase94d_apply_production_schema_bootstrap_and_verify_*.md" @(
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY",
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY_WITH_WARNINGS"
)

$ActivationContent = @'
# RAFTOP CPAP CARE Pro - Tenant + Users + Credentials Activation Pack

REQUIRED_MARKER: PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION
REQUIRED_MARKER: USERS_READY_FOR_PHASE95B_APPLY
REQUIRED_MARKER: NO_REAL_PASSWORDS_STORED
REQUIRED_MARKER: CREDENTIALS_SEPARATE_DELIVERY

## Purpose

This pack prepares the production tenant/user activation for Raftopoulos.

It does not execute SQL.
It does not create users yet.
It does not store real passwords.
It does not expose secrets.

## Tenant

Tenant slug:
raftopoulos-production

Tenant name:
Raftopoulos Production

## Initial access model

1. Platform Super Admin
   - stays with platform owner
   - not shared with buyer

2. Tenant Admin
   - Raftopoulos management
   - controls only raftopoulos-production tenant

3. Operations Users
   - follow-up / CPAP support team
   - patient monitoring and task workflow

4. Management Viewer
   - read-only dashboards/reports

5. Doctor Users
   - future stage

6. Patient Users
   - future stage

## Next phase

Phase 95B will apply real user activation only after:
- Phase 94D schema verified
- buyer confirms named users
- temporary passwords are generated outside Git
- credentials are delivered separately
'@

Set-Content -Path $ActivationDoc -Value $ActivationContent -Encoding UTF8

$RoleMatrix = @'
account_key,role_code,role_name,tenant_slug,scope,status,email_to_fill_later,password_storage_rule
tenant_admin_01,tenant_admin,Raftopoulos Tenant Admin,raftopoulos-production,tenant_only,pending,TO_BE_FILLED_OUTSIDE_GIT,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
operations_01,operations_user,Operations Follow-up User 1,raftopoulos-production,tenant_patients_tasks,pending,TO_BE_FILLED_OUTSIDE_GIT,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
operations_02,operations_user,Operations Follow-up User 2,raftopoulos-production,tenant_patients_tasks,pending,TO_BE_FILLED_OUTSIDE_GIT,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
viewer_01,viewer,Management Viewer,raftopoulos-production,read_only_reports,pending,TO_BE_FILLED_OUTSIDE_GIT,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
doctor_future_01,doctor_user_future,Doctor User Future,raftopoulos-production,assigned_doctor_patients,future,TO_BE_FILLED_LATER,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
patient_future_01,patient_user_future,Patient User Future,raftopoulos-production,own_patient_portal,future,TO_BE_FILLED_LATER,DO_NOT_STORE_REAL_PASSWORD_IN_GIT
'@

Set-Content -Path $RoleMatrixCsv -Value $RoleMatrix -Encoding UTF8

$CredentialsTemplateContent = @'
# RAFTOP CPAP CARE Pro - Credentials Delivery Template

REQUIRED_MARKER: PHASE95_CREDENTIALS_DELIVERY_TEMPLATE
REQUIRED_MARKER: DO_NOT_COMMIT_REAL_PASSWORDS
REQUIRED_MARKER: DELIVER_CREDENTIALS_SEPARATELY
REQUIRED_MARKER: FIRST_LOGIN_PASSWORD_CHANGE

## Hard rule

Do not commit real passwords.
Do not store real passwords in docs.
Do not put credentials inside ZIP files.
Do not send credentials in the same message as the buyer ZIP.

## Credentials delivery format

Use this template outside Git:

User:
Role:
Email:
Temporary password:
Login URL:
First-login action: change password immediately

## Initial users

Tenant Admin:
Email:
Temporary password:

Operations User 1:
Email:
Temporary password:

Operations User 2:
Email:
Temporary password:

Management Viewer:
Email:
Temporary password:

## Delivery rule

Credentials must be sent separately after:
- commercial approval
- role approval
- named recipient confirmation
'@

Set-Content -Path $CredentialsTemplate -Value $CredentialsTemplateContent -Encoding UTF8

$SqlTemplateContent = @'
-- RAFTOP CPAP CARE Pro
-- Phase 95 - Tenant Users Activation SQL Template
-- TEMPLATE ONLY - DO NOT EXECUTE WITHOUT EDITING VARIABLES
-- Does not contain real passwords.
-- Does not contain real emails.
-- Use Phase 95B to apply with real approved user details.

BEGIN;

-- Ensure tenant exists.
INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-production',
    'Raftopoulos Production',
    'active',
    'enterprise',
    'Production tenant for controlled CPAP portfolio rollout.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    updated_at = now();

-- IMPORTANT:
-- This template assumes public.users supports at least email-like identity and role fields.
-- Phase 95B must inspect users columns before applying real inserts.

-- Placeholder examples only.
-- Replace in Phase 95B after confirming users schema:
-- TENANT_ADMIN_EMAIL
-- OPERATIONS_01_EMAIL
-- OPERATIONS_02_EMAIL
-- VIEWER_01_EMAIL
-- PASSWORD_HASH_OR_TEMP_AUTH_FLOW

COMMIT;
'@

Set-Content -Path $SqlTemplate -Value $SqlTemplateContent -Encoding UTF8

$ApplyGuideContent = @'
# RAFTOP CPAP CARE Pro - Phase 95 Apply Guide

REQUIRED_MARKER: PHASE95_SQL_APPLY_GUIDE
REQUIRED_MARKER: PHASE95B_APPLY_ONLY_AFTER_USER_SCHEMA_DISCOVERY
REQUIRED_MARKER: REAL_EMAILS_OUTSIDE_GIT
REQUIRED_MARKER: PASSWORDS_OUTSIDE_GIT

## Meaning

Phase 95 only prepares activation material.

## Do not execute the SQL template directly

The users table schema must be inspected first.

## Required before Phase 95B

1. Confirm Phase 94D passed.
2. Inspect public.users columns.
3. Confirm auth model:
   - email column
   - password/hash column
   - role column
   - tenant reference column
4. Get named buyer users.
5. Generate temporary credentials outside Git.
6. Apply SQL safely.
7. Verify login.

## Real user creation happens in Phase 95B

Phase 95B must:
- inspect users table
- create exact SQL based on actual columns
- avoid committing real emails/passwords if confidential
- verify users exist
- create separate credentials delivery file outside repo
'@

Set-Content -Path $ApplyGuide -Value $ApplyGuideContent -Encoding UTF8

foreach ($Path in @($ActivationDoc, $RoleMatrixCsv, $CredentialsTemplate, $ApplyGuide, $SqlTemplate)) {
    if (Test-Path $Path) {
        Add-Result ("Phase 95 file created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase 95 file created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK",
    "TENANT_RAFTOPoulos_PRODUCTION",
    "USERS_READY_FOR_PHASE95B_APPLY",
    "NO_REAL_PASSWORDS_STORED",
    "CREDENTIALS_SEPARATE_DELIVERY",
    "PHASE95_CREDENTIALS_DELIVERY_TEMPLATE",
    "DO_NOT_COMMIT_REAL_PASSWORDS",
    "DELIVER_CREDENTIALS_SEPARATELY",
    "FIRST_LOGIN_PASSWORD_CHANGE",
    "PHASE95_SQL_APPLY_GUIDE",
    "PHASE95B_APPLY_ONLY_AFTER_USER_SCHEMA_DISCOVERY",
    "REAL_EMAILS_OUTSIDE_GIT",
    "PASSWORDS_OUTSIDE_GIT"
)) {
    $Found = $false

    foreach ($Path in @($ActivationDoc, $CredentialsTemplate, $ApplyGuide)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGeneratedContent = ""
foreach ($Path in @($ActivationDoc, $RoleMatrixCsv, $CredentialsTemplate, $ApplyGuide, $SqlTemplate)) {
    $AllGeneratedContent += "`n---FILE---`n"
    $AllGeneratedContent += Read-FileSafe $Path
}

$ForbiddenSecrets = @(
    "PASSWORD=",
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)

foreach ($Forbidden in $ForbiddenSecrets) {
    if (ContainsText $AllGeneratedContent $Forbidden) {
        Add-Result ("Forbidden secret absent: " + $Forbidden) "FAIL" "Forbidden secret-like value found."
    } else {
        Add-Result ("Forbidden secret absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 95 Tenant + Users + Credentials Activation Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Activation doc:"
Write-Host $ActivationDoc
Write-Host ""
Write-Host "Role matrix:"
Write-Host $RoleMatrixCsv
Write-Host ""
Write-Host "Credentials template:"
Write-Host $CredentialsTemplate
Write-Host ""
Write-Host "SQL template:"
Write-Host $SqlTemplate
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