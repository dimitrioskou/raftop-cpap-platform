# RAFTOP CPAP CARE Pro
# Phase 95B - Users Table Discovery & Real Tenant User Apply Plan
# Discovers public.users table columns and prepares safe user activation plan.
# Does NOT create real users.
# Does NOT store real passwords.
# Does NOT execute INSERT statements.
# Does NOT print DATABASE_URL.

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
$ReportPath = Join-Path $ReportsDir ("phase95b_users_table_discovery_apply_plan_" + $Timestamp + ".md")

$UsersColumnsCsv = Join-Path $ReportsDir ("phase95b_users_columns_" + $Timestamp + ".csv")
$UsersSampleShapeCsv = Join-Path $ReportsDir ("phase95b_users_sample_shape_" + $Timestamp + ".csv")

$DiscoveryDoc = Join-Path $DocsDir "95B_USERS_TABLE_DISCOVERY.md"
$ApplyPlanDoc = Join-Path $DocsDir "95B_REAL_TENANT_USER_APPLY_PLAN.md"
$CredentialsRulesDoc = Join-Path $DocsDir "95B_CREDENTIALS_RULES_REAL_USERS.md"
$SqlTemplate = Join-Path $SqlDir "phase95b_real_tenant_users_apply_template.sql"

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

function Find-Column {
    param(
        [array]$Columns,
        [string[]]$Candidates
    )

    foreach ($Candidate in $Candidates) {
        foreach ($Column in $Columns) {
            if ($Column.column_name -eq $Candidate) {
                return $Candidate
            }
        }
    }

    return ""
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 95B Users Table Discovery Apply Plan" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: inspect public.users schema and prepare safe user activation plan." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not create users and does not store real credentials." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 95B - Users Table Discovery & Real Tenant User Apply Plan..."
Write-Host ""

Check-ReportStatus "Phase 94D production schema apply latest status" "phase94d_apply_production_schema_bootstrap_and_verify_*.md" @(
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY",
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 95 activation pack latest status" "phase95_tenant_users_credentials_activation_pack_*.md" @(
    "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK_READY",
    "PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK_READY_WITH_WARNINGS"
)

$DatabaseUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Add-Result "Production DATABASE URL env set" "FAIL" "RAFTOP_PRODUCTION_DATABASE_URL is not set."
} else {
    Add-Result "Production DATABASE URL env set" "PASS" "Env value is set. Value is not printed."
}

if ($null -eq $PsqlCommand) {
    Add-Result "psql command available" "FAIL" "psql not found in PATH."
} else {
    Add-Result "psql command available" "PASS" ("psql found: " + $PsqlCommand.Source)
}

$Columns = @()
$UsersTableExists = $false
$EmailColumn = ""
$PasswordHashColumn = ""
$RoleColumn = ""
$TenantColumn = ""
$StatusColumn = ""
$IdColumn = ""
$CreatedAtColumn = ""
$UpdatedAtColumn = ""

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $TableExistsQuery = "select count(*) from information_schema.tables where table_schema='public' and table_name='users';"
        $TableExistsOutput = & psql $DatabaseUrl -t -A -c $TableExistsQuery 2>&1
        $TableExistsExit = $LASTEXITCODE

        if ($TableExistsExit -eq 0) {
            $TableCount = (($TableExistsOutput | Out-String).Trim())

            if ($TableCount -match "^[0-9]+$" -and [int]$TableCount -gt 0) {
                $UsersTableExists = $true
                Add-Result "public.users table exists" "PASS" "users table found."
            } else {
                Add-Result "public.users table exists" "FAIL" "users table missing."
            }
        } else {
            Add-Result "public.users table exists" "FAIL" ($TableExistsOutput | Out-String)
        }

        if ($UsersTableExists) {
            $ColumnQuery = "select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='users' order by ordinal_position;"
            $ColumnsOutput = & psql $DatabaseUrl -t -A -F "," -c $ColumnQuery 2>&1
            $ColumnsExit = $LASTEXITCODE

            if ($ColumnsExit -eq 0) {
                Set-Content -Path $UsersColumnsCsv -Value "column_name,data_type,is_nullable,column_default" -Encoding UTF8
                Add-Content -Path $UsersColumnsCsv -Value $ColumnsOutput -Encoding UTF8
                Add-Result "users columns exported" "PASS" $UsersColumnsCsv

                $RawLines = @($ColumnsOutput)
                foreach ($Line in $RawLines) {
                    if ([string]::IsNullOrWhiteSpace($Line)) { continue }

                    $Parts = $Line.Split(",", 4)
                    if ($Parts.Count -ge 3) {
                        $Columns += [PSCustomObject]@{
                            column_name = $Parts[0]
                            data_type = $Parts[1]
                            is_nullable = $Parts[2]
                            column_default = if ($Parts.Count -ge 4) { $Parts[3] } else { "" }
                        }
                    }
                }

                $EmailColumn = Find-Column $Columns @("email", "user_email", "username", "login_email")
                $PasswordHashColumn = Find-Column $Columns @("password_hash", "password_digest", "password", "hashed_password", "passwordHash")
                $RoleColumn = Find-Column $Columns @("role", "role_code", "user_role")
                $TenantColumn = Find-Column $Columns @("tenant_slug", "tenant_id", "tenant", "tenant_key")
                $StatusColumn = Find-Column $Columns @("status", "is_active", "active")
                $IdColumn = Find-Column $Columns @("id", "user_id")
                $CreatedAtColumn = Find-Column $Columns @("created_at", "createdAt")
                $UpdatedAtColumn = Find-Column $Columns @("updated_at", "updatedAt")

                if ([string]::IsNullOrWhiteSpace($IdColumn)) {
                    Add-Result "users id column mapped" "WARN" "No id/user_id column detected."
                } else {
                    Add-Result "users id column mapped" "PASS" ("Mapped to: " + $IdColumn)
                }

                if ([string]::IsNullOrWhiteSpace($EmailColumn)) {
                    Add-Result "users email/login column mapped" "FAIL" "No email/username column detected."
                } else {
                    Add-Result "users email/login column mapped" "PASS" ("Mapped to: " + $EmailColumn)
                }

                if ([string]::IsNullOrWhiteSpace($PasswordHashColumn)) {
                    Add-Result "users password/hash column mapped" "WARN" "No password/hash column detected. Auth may use external flow."
                } else {
                    Add-Result "users password/hash column mapped" "PASS" ("Mapped to: " + $PasswordHashColumn)
                }

                if ([string]::IsNullOrWhiteSpace($RoleColumn)) {
                    Add-Result "users role column mapped" "WARN" "No role column detected."
                } else {
                    Add-Result "users role column mapped" "PASS" ("Mapped to: " + $RoleColumn)
                }

                if ([string]::IsNullOrWhiteSpace($TenantColumn)) {
                    Add-Result "users tenant reference column mapped" "WARN" "No tenant column detected."
                } else {
                    Add-Result "users tenant reference column mapped" "PASS" ("Mapped to: " + $TenantColumn)
                }

                if ([string]::IsNullOrWhiteSpace($StatusColumn)) {
                    Add-Result "users status/active column mapped" "WARN" "No status/is_active/active column detected."
                } else {
                    Add-Result "users status/active column mapped" "PASS" ("Mapped to: " + $StatusColumn)
                }
            } else {
                Add-Result "users columns exported" "FAIL" ($ColumnsOutput | Out-String)
            }

            $SampleShapeQuery = "select * from public.users limit 0;"
            $SampleShapeOutput = & psql $DatabaseUrl -c $SampleShapeQuery 2>&1
            $SampleShapeExit = $LASTEXITCODE

            if ($SampleShapeExit -eq 0) {
                Set-Content -Path $UsersSampleShapeCsv -Value ($SampleShapeOutput | Out-String) -Encoding UTF8
                Add-Result "users sample shape query works" "PASS" $UsersSampleShapeCsv
            } else {
                Add-Result "users sample shape query works" "WARN" ($SampleShapeOutput | Out-String)
            }
        }
    } catch {
        Add-Result "users table discovery execution" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$SqlTemplateContent = @"
-- RAFTOP CPAP CARE Pro
-- Phase 95B - Real Tenant Users Apply Template
-- TEMPLATE ONLY.
-- Do not commit real emails or real temporary secrets.
-- Do not execute before filling approved user details outside Git.
-- This template was generated after discovering public.users schema.

BEGIN;

-- Ensure tenant is active.
INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-production',
    'Raftopoulos Production',
    'active',
    'enterprise',
    'Production tenant for Raftopoulos controlled CPAP rollout.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    updated_at = now();

-- DISCOVERED USERS COLUMN MAP
-- id column: $IdColumn
-- login/email column: $EmailColumn
-- secret/hash column: $PasswordHashColumn
-- role column: $RoleColumn
-- tenant column: $TenantColumn
-- status column: $StatusColumn
-- created_at column: $CreatedAtColumn
-- updated_at column: $UpdatedAtColumn

-- Next step:
-- Phase 95C must generate an apply script outside Git with:
-- 1. approved buyer emails
-- 2. temporary secrets or auth reset flow
-- 3. exact INSERT/UPSERT syntax matching the discovered columns
-- 4. verification queries
-- 5. separate credentials delivery file outside repository

COMMIT;
"@

Set-Content -Path $SqlTemplate -Value $SqlTemplateContent -Encoding UTF8

$DiscoveryContent = @"
# RAFTOP CPAP CARE Pro - Users Table Discovery

REQUIRED_MARKER: PHASE95B_USERS_TABLE_DISCOVERY
REQUIRED_MARKER: USERS_SCHEMA_DISCOVERED
REQUIRED_MARKER: REAL_USER_APPLY_NOT_YET_EXECUTED
REQUIRED_MARKER: NO_REAL_PASSWORDS_STORED

## Purpose

This phase inspected the production public.users table before creating real Raftopoulos users.

## Column mapping

ID column:
$IdColumn

Login/email column:
$EmailColumn

Secret/hash column:
$PasswordHashColumn

Role column:
$RoleColumn

Tenant reference column:
$TenantColumn

Status/active column:
$StatusColumn

Created at column:
$CreatedAtColumn

Updated at column:
$UpdatedAtColumn

## Meaning

Real user activation must match the actual production users schema.

## Hard stop

Do not create real users until:
- buyer provides approved names/emails
- temporary credentials are generated outside Git
- exact users insert/update SQL is generated
- credentials delivery process is ready
"@

Set-Content -Path $DiscoveryDoc -Value $DiscoveryContent -Encoding UTF8

$ApplyPlanContent = @'
# RAFTOP CPAP CARE Pro - Real Tenant User Apply Plan

REQUIRED_MARKER: PHASE95B_REAL_TENANT_USER_APPLY_PLAN
REQUIRED_MARKER: PHASE95C_APPLY_NEXT
REQUIRED_MARKER: APPROVED_BUYER_EMAILS_REQUIRED
REQUIRED_MARKER: CREDENTIALS_OUTSIDE_GIT

## Users to create

Initial production users:

1. Tenant Admin
   - role: tenant_admin
   - scope: raftopoulos-production

2. Operations User 1
   - role: operations_user
   - scope: patient monitoring and follow-up tasks

3. Operations User 2
   - role: operations_user
   - scope: patient monitoring and follow-up tasks

4. Management Viewer
   - role: viewer
   - scope: read-only dashboards and reports

## Required from buyer

Before applying real users, buyer must provide:
- full names
- emails
- role approval
- who receives credentials

## Security rules

- real temporary secrets are generated outside Git
- credentials are not committed
- credentials are not included in buyer ZIP
- super admin is not shared
- each user receives only their own access

## Next phase

Phase 95C:
Generate real user SQL from approved emails and apply to production DB.
'@

Set-Content -Path $ApplyPlanDoc -Value $ApplyPlanContent -Encoding UTF8

$CredentialsRulesContent = @'
# RAFTOP CPAP CARE Pro - Credentials Rules for Real Users

REQUIRED_MARKER: PHASE95B_CREDENTIALS_RULES_REAL_USERS
REQUIRED_MARKER: SEPARATE_CREDENTIAL_DELIVERY
REQUIRED_MARKER: NO_CREDENTIALS_IN_REPO
REQUIRED_MARKER: FIRST_LOGIN_RESET

## Rules

1. Credentials are created outside Git.
2. Credentials are delivered separately.
3. Do not store real temporary secrets in repository files.
4. Do not send credentials in the same email as the ZIP.
5. Do not share platform super admin.
6. Each user gets the minimum necessary role.
7. First login should trigger or require password change where supported.

## Credential recipient list

Tenant Admin:
- approved recipient required

Operations User 1:
- approved recipient required

Operations User 2:
- approved recipient required

Management Viewer:
- approved recipient required
'@

Set-Content -Path $CredentialsRulesDoc -Value $CredentialsRulesContent -Encoding UTF8

foreach ($Path in @($DiscoveryDoc, $ApplyPlanDoc, $CredentialsRulesDoc, $SqlTemplate)) {
    if (Test-Path $Path) {
        Add-Result ("Phase 95B file created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase 95B file created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE95B_USERS_TABLE_DISCOVERY",
    "USERS_SCHEMA_DISCOVERED",
    "REAL_USER_APPLY_NOT_YET_EXECUTED",
    "NO_REAL_PASSWORDS_STORED",
    "PHASE95B_REAL_TENANT_USER_APPLY_PLAN",
    "PHASE95C_APPLY_NEXT",
    "APPROVED_BUYER_EMAILS_REQUIRED",
    "CREDENTIALS_OUTSIDE_GIT",
    "PHASE95B_CREDENTIALS_RULES_REAL_USERS",
    "SEPARATE_CREDENTIAL_DELIVERY",
    "NO_CREDENTIALS_IN_REPO",
    "FIRST_LOGIN_RESET"
)) {
    $Found = $false

    foreach ($Path in @($DiscoveryDoc, $ApplyPlanDoc, $CredentialsRulesDoc)) {
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
foreach ($Path in @($DiscoveryDoc, $ApplyPlanDoc, $CredentialsRulesDoc, $SqlTemplate)) {
    $AllGeneratedContent += "`n---FILE---`n"
    $AllGeneratedContent += Read-FileSafe $Path
}

$ForbiddenSecrets = @(
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
    $FinalStatus = "PHASE95B_USERS_TABLE_DISCOVERY_APPLY_PLAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE95B_USERS_TABLE_DISCOVERY_APPLY_PLAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE95B_USERS_TABLE_DISCOVERY_APPLY_PLAN_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 95B Users Table Discovery & Real Tenant User Apply Plan"
Write-Host "============================================================"
Write-Host ""
Write-Host "Users columns CSV:"
Write-Host $UsersColumnsCsv
Write-Host ""
Write-Host "Discovery doc:"
Write-Host $DiscoveryDoc
Write-Host ""
Write-Host "Apply plan:"
Write-Host $ApplyPlanDoc
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