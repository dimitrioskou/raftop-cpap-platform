# RAFTOP CPAP CARE Pro
# Phase 95C - Real Tenant Users Apply
# Creates real tenant users in production DB.
# Writes temporary credentials ONLY outside repo.
# Does not print passwords.
# Does not commit credentials.
# Requires RAFTOP_PRODUCTION_DATABASE_URL in current PowerShell session.

param(
    [string]$TenantAdminEmail = "raftopoulos.admin@raftopoulos.local",
    [string]$TenantAdminName = "Raftopoulos Tenant Admin",

    [string]$OperationsEmail1 = "raftopoulos.operations1@raftopoulos.local",
    [string]$OperationsName1 = "Raftopoulos Operations User 1",

    [string]$OperationsEmail2 = "raftopoulos.operations2@raftopoulos.local",
    [string]$OperationsName2 = "Raftopoulos Operations User 2",

    [string]$ViewerEmail = "raftopoulos.viewer@raftopoulos.local",
    [string]$ViewerName = "Raftopoulos Management Viewer"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$ToolsDir = Join-Path $Root "tools"

$CredentialOutDir = Join-Path $Desktop "RAFTOP_PRODUCTION_CREDENTIALS_DO_NOT_COMMIT"
$CredentialFile = Join-Path $CredentialOutDir "RAFTOP_PRODUCTION_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"
$ApplySqlFile = Join-Path $CredentialOutDir "phase95c_real_users_apply_DO_NOT_COMMIT.sql"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $CredentialOutDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase95c_real_tenant_users_apply_" + $Timestamp + ".md")
$ApplyDoc = Join-Path $DocsDir "95C_REAL_TENANT_USERS_APPLIED.md"
$VerificationCsv = Join-Path $ReportsDir ("phase95c_real_users_verification_" + $Timestamp + ".csv")

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

function New-TempPassword {
    $Bytes = New-Object byte[] 18
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($Bytes)
    $Base = [Convert]::ToBase64String($Bytes)
    $Safe = $Base.Replace("+","A").Replace("/","B").Replace("=","C")
    return ("Rft!" + $Safe.Substring(0,18) + "9")
}

function SqlEscape {
    param([string]$Value)

    if ($null -eq $Value) { return "" }
    return $Value.Replace("'", "''")
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 95C Real Tenant Users Apply" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: create real production tenant users without committing credentials." -Encoding UTF8
Add-Content -Path $ReportPath -Value "Passwords are not printed in this report." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 95C - Real Tenant Users Apply..."
Write-Host ""

Check-ReportStatus "Phase 94D production schema apply latest status" "phase94d_apply_production_schema_bootstrap_and_verify_*.md" @(
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY",
    "PHASE94D_PRODUCTION_SCHEMA_BOOTSTRAP_APPLY_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 95B users table discovery latest status" "phase95b_users_table_discovery_apply_plan_*.md" @(
    "PHASE95B_USERS_TABLE_DISCOVERY_APPLY_PLAN_READY",
    "PHASE95B_USERS_TABLE_DISCOVERY_APPLY_PLAN_READY_WITH_WARNINGS"
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

$Emails = @(
    $TenantAdminEmail,
    $OperationsEmail1,
    $OperationsEmail2,
    $ViewerEmail
)

foreach ($Email in $Emails) {
    if ($Email -match "^[^@\s]+@[^@\s]+\.[^@\s]+$") {
        Add-Result ("Email format valid: " + $Email) "PASS" "Valid email format."
    } else {
        Add-Result ("Email format valid: " + $Email) "FAIL" "Invalid email format."
    }

    if ($Email -like "*.local") {
        Add-Result ("Email is placeholder/local: " + $Email) "WARN" "This is a placeholder .local email. Replace with real buyer email when available."
    }
}

$TenantAdminPassword = New-TempPassword
$OperationsPassword1 = New-TempPassword
$OperationsPassword2 = New-TempPassword
$ViewerPassword = New-TempPassword

$Users = @(
    [PSCustomObject]@{
        email = $TenantAdminEmail
        name = $TenantAdminName
        role = "tenant_admin"
        password = $TenantAdminPassword
    },
    [PSCustomObject]@{
        email = $OperationsEmail1
        name = $OperationsName1
        role = "operations_user"
        password = $OperationsPassword1
    },
    [PSCustomObject]@{
        email = $OperationsEmail2
        name = $OperationsName2
        role = "operations_user"
        password = $OperationsPassword2
    },
    [PSCustomObject]@{
        email = $ViewerEmail
        name = $ViewerName
        role = "viewer"
        password = $ViewerPassword
    }
)

$CredentialContent = @()
$CredentialContent += "RAFTOP CPAP CARE Pro - Production User Credentials"
$CredentialContent += ""
$CredentialContent += "DO NOT COMMIT THIS FILE."
$CredentialContent += "DO NOT SEND IN SAME EMAIL AS BUYER ZIP."
$CredentialContent += "DELIVER SEPARATELY TO APPROVED RECIPIENTS."
$CredentialContent += ""
$CredentialContent += "Login URL:"
$CredentialContent += "https://raftop-cpap-frontend.onrender.com/login"
$CredentialContent += ""

foreach ($User in $Users) {
    $CredentialContent += "----------------------------------------"
    $CredentialContent += ("Role: " + $User.role)
    $CredentialContent += ("Name: " + $User.name)
    $CredentialContent += ("Email: " + $User.email)
    $CredentialContent += ("Temporary password: " + $User.password)
    $CredentialContent += "First action: change password after first login where supported."
    $CredentialContent += ""
}

Set-Content -Path $CredentialFile -Value $CredentialContent -Encoding UTF8

if (Test-Path $CredentialFile) {
    Add-Result "Credentials file created outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Credentials file created outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Credentials file outside repository" "FAIL" "Credentials file is inside repo."
} else {
    Add-Result "Credentials file outside repository" "PASS" "Credentials file is outside repo."
}

$SqlLines = @()
$SqlLines += "-- RAFTOP CPAP CARE Pro - Phase 95C real users apply"
$SqlLines += "-- DO NOT COMMIT THIS FILE. It contains password material."
$SqlLines += "BEGIN;"
$SqlLines += ""
$SqlLines += "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
$SqlLines += ""
$SqlLines += "INSERT INTO public.tenants (slug, name, status, plan_name, notes)"
$SqlLines += "VALUES ('raftopoulos-production', 'Raftopoulos Production', 'active', 'enterprise', 'Production tenant for Raftopoulos controlled CPAP rollout.')"
$SqlLines += "ON CONFLICT (slug) DO UPDATE"
$SqlLines += "SET name = EXCLUDED.name, status = EXCLUDED.status, plan_name = EXCLUDED.plan_name, updated_at = now();"
$SqlLines += ""

foreach ($User in $Users) {
    $Email = SqlEscape $User.email
    $Name = SqlEscape $User.name
    $Role = SqlEscape $User.role
    $Password = SqlEscape $User.password

    $SqlLines += "-- Upsert user: $Role / $Email"
    $SqlLines += "UPDATE public.users"
    $SqlLines += "SET"
    $SqlLines += "  tenant_id = 'raftopoulos-production',"
    $SqlLines += "  name = '$Name',"
    $SqlLines += "  role = '$Role',"
    $SqlLines += "  status = 'active',"
    $SqlLines += "  password_hash = crypt('$Password', gen_salt('bf')),"
    $SqlLines += "  updated_at = now()"
    $SqlLines += "WHERE email = '$Email';"
    $SqlLines += ""
    $SqlLines += "INSERT INTO public.users (tenant_id, email, password_hash, name, role, status, created_at, updated_at)"
    $SqlLines += "SELECT"
    $SqlLines += "  'raftopoulos-production',"
    $SqlLines += "  '$Email',"
    $SqlLines += "  crypt('$Password', gen_salt('bf')),"
    $SqlLines += "  '$Name',"
    $SqlLines += "  '$Role',"
    $SqlLines += "  'active',"
    $SqlLines += "  now(),"
    $SqlLines += "  now()"
    $SqlLines += "WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = '$Email');"
    $SqlLines += ""
}

$SqlLines += "COMMIT;"
Set-Content -Path $ApplySqlFile -Value $SqlLines -Encoding UTF8

if (Test-Path $ApplySqlFile) {
    Add-Result "Local apply SQL created outside repo" "PASS" $ApplySqlFile
} else {
    Add-Result "Local apply SQL created outside repo" "FAIL" $ApplySqlFile
}

if ($ApplySqlFile -like "$Root*") {
    Add-Result "Local apply SQL outside repository" "FAIL" "Apply SQL is inside repo."
} else {
    Add-Result "Local apply SQL outside repository" "PASS" "Apply SQL is outside repo."
}

if ($script:FailCount -eq 0) {
    try {
        $ApplyOutput = & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $ApplySqlFile 2>&1
        $ApplyExit = $LASTEXITCODE

        Add-Content -Path $ReportPath -Value "SQL_APPLY_OUTPUT_REDACTED:" -Encoding UTF8
        Add-Content -Path $ReportPath -Value (($ApplyOutput | Out-String) -replace [regex]::Escape($DatabaseUrl), "[REDACTED_DATABASE_URL]") -Encoding UTF8
        Add-Content -Path $ReportPath -Value "" -Encoding UTF8

        if ($ApplyExit -eq 0) {
            Add-Result "Real tenant users SQL applied" "PASS" "psql exit code 0."
        } else {
            Add-Result "Real tenant users SQL applied" "FAIL" ("psql exit code: " + $ApplyExit)
        }
    } catch {
        Add-Result "Real tenant users SQL applied" "FAIL" ("Exception: " + $_.Exception.Message)
    }
} else {
    Add-Result "Real tenant users SQL applied" "FAIL" "Skipped because pre-apply gate has FAIL."
}

if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $EmailListSql = ($Emails | ForEach-Object { "'" + (SqlEscape $_) + "'" }) -join ","
        $VerifyQuery = "select tenant_id, email, name, role, status from public.users where email in ($EmailListSql) order by role, email;"
        $VerifyOutput = & psql $DatabaseUrl -t -A -F "," -c $VerifyQuery 2>&1
        $VerifyExit = $LASTEXITCODE

        if ($VerifyExit -eq 0) {
            Set-Content -Path $VerificationCsv -Value "tenant_id,email,name,role,status" -Encoding UTF8
            Add-Content -Path $VerificationCsv -Value $VerifyOutput -Encoding UTF8
            Add-Result "Real tenant users verification exported" "PASS" $VerificationCsv

            $VerifyText = ($VerifyOutput | Out-String)

            foreach ($Email in $Emails) {
                if (ContainsText $VerifyText $Email) {
                    Add-Result ("Created/updated user exists: " + $Email) "PASS" "User found."
                } else {
                    Add-Result ("Created/updated user exists: " + $Email) "FAIL" "User not found."
                }
            }

            if (ContainsText $VerifyText "raftopoulos-production") {
                Add-Result "Users mapped to raftopoulos-production" "PASS" "Tenant marker found."
            } else {
                Add-Result "Users mapped to raftopoulos-production" "FAIL" "Tenant marker missing."
            }
        } else {
            Add-Result "Real tenant users verification exported" "FAIL" ($VerifyOutput | Out-String)
        }
    } catch {
        Add-Result "Real tenant users verification exported" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$ApplyDocContent = @'
# RAFTOP CPAP CARE Pro - Real Tenant Users Applied

REQUIRED_MARKER: PHASE95C_REAL_TENANT_USERS_APPLIED
REQUIRED_MARKER: TENANT_USERS_CREATED_OR_UPDATED
REQUIRED_MARKER: CREDENTIALS_CREATED_OUTSIDE_REPO
REQUIRED_MARKER: PASSWORDS_NOT_COMMITTED
REQUIRED_MARKER: READY_FOR_PHASE95D_LOGIN_VERIFICATION

## Meaning

Initial production users for raftopoulos-production were created or updated.

## Users

- tenant_admin
- operations_user
- operations_user
- viewer

## Credentials

Credentials were generated outside the repository.

Do not commit credentials.
Do not send credentials in the same message as the buyer ZIP.
Do not share super admin.

## Next phase

Phase 95D:
Login verification and role access check.
'@

Set-Content -Path $ApplyDoc -Value $ApplyDocContent -Encoding UTF8

if (Test-Path $ApplyDoc) {
    Add-Result "Phase 95C apply document created" "PASS" $ApplyDoc
} else {
    Add-Result "Phase 95C apply document created" "FAIL" $ApplyDoc
}

foreach ($Marker in @(
    "PHASE95C_REAL_TENANT_USERS_APPLIED",
    "TENANT_USERS_CREATED_OR_UPDATED",
    "CREDENTIALS_CREATED_OUTSIDE_REPO",
    "PASSWORDS_NOT_COMMITTED",
    "READY_FOR_PHASE95D_LOGIN_VERIFICATION"
)) {
    $DocContent = Read-FileSafe $ApplyDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Apply doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Apply doc marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

# Safety: do not add credential files to Git.
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} else {
    if ($GitStatus -match "RAFTOP_PRODUCTION_CREDENTIALS_DO_NOT_COMMIT") {
        Add-Result "Credentials not tracked by git status" "FAIL" "Credentials folder appears in git status."
    } else {
        Add-Result "Credentials not tracked by git status" "PASS" "Credentials folder is outside repo / not tracked."
    }

    if ([string]::IsNullOrWhiteSpace($GitStatus)) {
        Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
    } else {
        Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE95C_REAL_TENANT_USERS_APPLY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE95C_REAL_TENANT_USERS_APPLY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE95C_REAL_TENANT_USERS_APPLY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 95C Real Tenant Users Apply"
Write-Host "============================================================"
Write-Host ""
Write-Host "Credentials file outside repo:"
Write-Host $CredentialFile
Write-Host ""
Write-Host "Local apply SQL outside repo:"
Write-Host $ApplySqlFile
Write-Host ""
Write-Host "Apply doc:"
Write-Host $ApplyDoc
Write-Host ""
Write-Host "Verification CSV:"
Write-Host $VerificationCsv
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