# RAFTOP CPAP CARE Pro
# Phase 41.4C - Production Auth/User Schema Migration Plan
# Safe ASCII-only script
# Reads reports and local backend source only. Does not modify database.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendSrcDir = Join-Path $Root "enterprise-backend\src"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_auth_user_schema_migration_plan_" + $Timestamp + ".md")

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

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

function Get-DiscoveryValue {
    param(
        [string]$Content,
        [string]$Key
    )

    $Pattern = [regex]::Escape($Key) + "=(.*)"
    $Match = [regex]::Match($Content, $Pattern)

    if ($Match.Success) {
        return $Match.Groups[1].Value.Trim()
    }

    return ""
}

function Get-BackendFiles {
    if (!(Test-Path $BackendSrcDir)) {
        return @()
    }

    $Files = Get-ChildItem -Path $BackendSrcDir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.Extension -in @(".js", ".ts", ".json")
    }

    return $Files
}

function Find-Matches {
    param(
        [array]$Files,
        [string]$Pattern
    )

    $Matches = @()

    foreach ($File in $Files) {
        try {
            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue
            if ($Result) {
                $Matches += $Result
            }
        } catch {
        }
    }

    return $Matches
}

function Format-MatchLocations {
    param([array]$Matches)

    if ($Matches.Count -eq 0) {
        return "No matches."
    }

    $Max = [Math]::Min($Matches.Count, 30)
    $Items = @()

    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = $Matches[$i].Path.Replace($Root + "\", "")
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }

    if ($Matches.Count -gt 30) {
        $Items += ("... plus " + ($Matches.Count - 30) + " more")
    }

    return ($Items -join "; ")
}

function Count-Matches {
    param([array]$Matches)

    if ($Matches -eq $null) {
        return 0
    }

    return $Matches.Count
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.4C Auth/User Schema Migration Plan" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report defines the production auth/user schema migration plan required before admin user bootstrap."
Write-ReportLine "It does not modify the database."
Write-ReportLine "It does not create users."
Write-ReportLine "It does not store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.4C auth/user schema migration plan..."
Write-Host ""

$LatestSchemaReport = Get-LatestReport "phase41_production_db_schema_discovery_*.md"
$LatestGapReport = Get-LatestReport "phase41_user_auth_schema_gap_review_*.md"
$LatestMethodReport = Get-LatestReport "phase41_schema_review_bootstrap_method_*.md"

if ($LatestSchemaReport -eq $null) {
    Add-Result "Latest schema discovery report" "FAIL" "No Phase 41.3 schema discovery report found."
    $SchemaContent = ""
} else {
    Add-Result "Latest schema discovery report" "PASS" ("Found: " + $LatestSchemaReport.FullName)
    $SchemaContent = Get-Content -Path $LatestSchemaReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($LatestGapReport -eq $null) {
    Add-Result "Latest user/auth gap report" "FAIL" "No Phase 41.4B user/auth gap report found."
    $GapContent = ""
} else {
    Add-Result "Latest user/auth gap report" "PASS" ("Found: " + $LatestGapReport.FullName)
    $GapContent = Get-Content -Path $LatestGapReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($LatestMethodReport -eq $null) {
    Add-Result "Latest bootstrap method report" "WARN" "No Phase 41.3B bootstrap method report found."
    $MethodContent = ""
} else {
    Add-Result "Latest bootstrap method report" "PASS" ("Found: " + $LatestMethodReport.FullName)
    $MethodContent = Get-Content -Path $LatestMethodReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($SchemaContent -match "DB_CONNECTION: OK") {
    Add-Result "Production DB connection confirmed" "PASS" "Latest schema report confirmed DB connection."
} else {
    Add-Result "Production DB connection confirmed" "FAIL" "Latest schema report did not confirm DB connection."
}

if ($GapContent -match "FINAL STATUS: PHASE41_USER_AUTH_SCHEMA_GAP_REVIEW_READY_WITH_WARNINGS" -or $GapContent -match "FINAL STATUS: PHASE41_USER_AUTH_SCHEMA_GAP_REVIEW_READY") {
    Add-Result "User/auth gap review status" "PASS" "Latest user/auth gap review has acceptable final status."
} else {
    Add-Result "User/auth gap review status" "WARN" "Could not confirm acceptable user/auth gap review final status."
}

$TenantTables = Get-DiscoveryValue $SchemaContent "tenant_tables"
$UserTables = Get-DiscoveryValue $SchemaContent "user_tables"
$SubscriptionTables = Get-DiscoveryValue $SchemaContent "subscription_module_tables"
$AuditTables = Get-DiscoveryValue $SchemaContent "audit_security_tables"
$PatientTables = Get-DiscoveryValue $SchemaContent "patient_tables"
$DeviceTables = Get-DiscoveryValue $SchemaContent "device_tables"
$AtlasTables = Get-DiscoveryValue $SchemaContent "atlas_task_tables"

if ([string]::IsNullOrWhiteSpace($TenantTables)) {
    Add-Result "Tenant schema presence" "FAIL" "No tenant-related table found."
} else {
    Add-Result "Tenant schema presence" "PASS" ("Tenant tables: " + $TenantTables)
}

if ([string]::IsNullOrWhiteSpace($UserTables)) {
    Add-Result "User/account schema presence" "WARN" "No user/account-related table found in production schema."
} else {
    Add-Result "User/account schema presence" "PASS" ("User/account tables: " + $UserTables)
}

$BackendFiles = Get-BackendFiles

if ($BackendFiles.Count -gt 0) {
    Add-Result "Backend source scan scope" "PASS" ("Scannable backend files: " + $BackendFiles.Count)
} else {
    Add-Result "Backend source scan scope" "FAIL" "No backend source files found."
}

$CreateTableMatches = Find-Matches $BackendFiles "CREATE TABLE"
$CreateUsersMatches = Find-Matches $BackendFiles "CREATE TABLE users"
$UsersIdMatches = Find-Matches $BackendFiles "id"
$UsersEmailMatches = Find-Matches $BackendFiles "email"
$UsersPasswordHashMatches = Find-Matches $BackendFiles "password_hash"
$UsersPasswordMatches = Find-Matches $BackendFiles "password"
$UsersTenantIdMatches = Find-Matches $BackendFiles "tenant_id"
$UsersRoleMatches = Find-Matches $BackendFiles "role"
$UsersStatusMatches = Find-Matches $BackendFiles "status"
$UsersCreatedAtMatches = Find-Matches $BackendFiles "created_at"
$UsersUpdatedAtMatches = Find-Matches $BackendFiles "updated_at"
$BcryptMatches = Find-Matches $BackendFiles "bcrypt"
$JwtMatches = Find-Matches $BackendFiles "jwt"
$LoginMatches = Find-Matches $BackendFiles "login"
$FromUsersMatches = Find-Matches $BackendFiles "FROM users"
$IntoUsersMatches = Find-Matches $BackendFiles "INTO users"
$SelectUsersMatches = Find-Matches $BackendFiles "SELECT"
$InsertUsersMatches = Find-Matches $BackendFiles "INSERT INTO users"
$UpdateUsersMatches = Find-Matches $BackendFiles "UPDATE users"
$UniqueMatches = Find-Matches $BackendFiles "UNIQUE"
$AuditMatches = Find-Matches $BackendFiles "audit"
$ActivityMatches = Find-Matches $BackendFiles "activity"

if ((Count-Matches $CreateTableMatches) -gt 0) {
    Add-Result "CREATE TABLE references" "PASS" (Format-MatchLocations $CreateTableMatches)
} else {
    Add-Result "CREATE TABLE references" "WARN" "No CREATE TABLE references found."
}

if ((Count-Matches $CreateUsersMatches) -gt 0) {
    Add-Result "CREATE TABLE users references" "PASS" (Format-MatchLocations $CreateUsersMatches)
} else {
    Add-Result "CREATE TABLE users references" "WARN" "No exact CREATE TABLE users reference found."
}

if ((Count-Matches $FromUsersMatches) -gt 0 -or (Count-Matches $IntoUsersMatches) -gt 0 -or (Count-Matches $InsertUsersMatches) -gt 0 -or (Count-Matches $UpdateUsersMatches) -gt 0) {
    Add-Result "Backend SQL users usage" "PASS" ((Format-MatchLocations $FromUsersMatches) + " | " + (Format-MatchLocations $IntoUsersMatches) + " | " + (Format-MatchLocations $InsertUsersMatches) + " | " + (Format-MatchLocations $UpdateUsersMatches))
} else {
    Add-Result "Backend SQL users usage" "WARN" "No direct users SQL usage found."
}

if ((Count-Matches $BcryptMatches) -gt 0) {
    Add-Result "Password hashing signal" "PASS" "bcrypt references found."
} else {
    Add-Result "Password hashing signal" "WARN" "No bcrypt references found."
}

if ((Count-Matches $JwtMatches) -gt 0) {
    Add-Result "JWT auth signal" "PASS" "JWT references found."
} else {
    Add-Result "JWT auth signal" "WARN" "No JWT references found."
}

if ((Count-Matches $LoginMatches) -gt 0) {
    Add-Result "Login route signal" "PASS" "Login references found."
} else {
    Add-Result "Login route signal" "WARN" "No login references found."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DISCOVERED SCHEMA GROUPS"
Write-ReportLine ""
Write-ReportLine ("tenant_tables=" + $TenantTables)
Write-ReportLine ("user_tables=" + $UserTables)
Write-ReportLine ("subscription_module_tables=" + $SubscriptionTables)
Write-ReportLine ("audit_security_tables=" + $AuditTables)
Write-ReportLine ("patient_tables=" + $PatientTables)
Write-ReportLine ("device_tables=" + $DeviceTables)
Write-ReportLine ("atlas_task_tables=" + $AtlasTables)
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "AUTH USER MIGRATION REQUIREMENT"
Write-ReportLine ""

$NeedsUserMigration = $false

if ([string]::IsNullOrWhiteSpace($UserTables)) {
    $NeedsUserMigration = $true
    Write-ReportLine "Decision:"
    Write-ReportLine "Production database needs an auth/user schema migration before admin user bootstrap."
} else {
    Write-ReportLine "Decision:"
    Write-ReportLine "Production database already exposes user/account table names. Direct migration may not be required."
}

Write-ReportLine ""
Write-ReportLine "Reason:"
Write-ReportLine "- Backend has auth/login/user logic."
Write-ReportLine "- Backend references users in SQL/code."
Write-ReportLine "- Latest production schema discovery did not clearly discover user/account tables."
Write-ReportLine "- Creating admin user before confirming user table structure would be unsafe."
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RECOMMENDED MINIMUM USERS TABLE SHAPE"
Write-ReportLine ""
Write-ReportLine "Table:"
Write-ReportLine "users"
Write-ReportLine ""
Write-ReportLine "Recommended columns:"
Write-ReportLine "- id"
Write-ReportLine "- tenant_id"
Write-ReportLine "- email"
Write-ReportLine "- password_hash"
Write-ReportLine "- name"
Write-ReportLine "- role"
Write-ReportLine "- status"
Write-ReportLine "- created_at"
Write-ReportLine "- updated_at"
Write-ReportLine "- last_login_at"
Write-ReportLine ""
Write-ReportLine "Recommended constraints:"
Write-ReportLine "- primary key on id"
Write-ReportLine "- unique tenant_id plus email"
Write-ReportLine "- role must support super_admin, admin, staff, provider, patient"
Write-ReportLine "- status must support active, inactive, blocked"
Write-ReportLine "- password_hash must not be null for password-based users"
Write-ReportLine ""
Write-ReportLine "Recommended indexes:"
Write-ReportLine "- users_tenant_id_idx"
Write-ReportLine "- users_email_idx"
Write-ReportLine "- users_tenant_email_unique"
Write-ReportLine "- users_role_idx"
Write-ReportLine "- users_status_idx"
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RECOMMENDED MIGRATION SAFETY RULES"
Write-ReportLine ""
Write-ReportLine "- Migration must be idempotent."
Write-ReportLine "- Migration must use CREATE TABLE IF NOT EXISTS."
Write-ReportLine "- Migration must not drop tables."
Write-ReportLine "- Migration must not delete data."
Write-ReportLine "- Migration must not hardcode real passwords."
Write-ReportLine "- Migration must not create admin user in the same step unless explicitly approved."
Write-ReportLine "- Migration must be run after backup or before real patient data import."
Write-ReportLine "- Migration must create an audit event if audit table exists."
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "MIGRATION DECISION"
Write-ReportLine ""

if ($NeedsUserMigration) {
    Write-ReportLine "Selected next phase:"
    Write-ReportLine "Phase 41.5 - Generate Safe Auth/User Schema Migration Script"
    Write-ReportLine ""
    Write-ReportLine "Do not proceed to admin user bootstrap before Phase 41.5 passes."
    Add-Result "Migration decision" "WARN" "Auth/user schema migration is required before admin bootstrap."
} else {
    Write-ReportLine "Selected next phase:"
    Write-ReportLine "Phase 41.5B - Existing User Table Mapping Review"
    Write-ReportLine ""
    Write-ReportLine "Do not create admin user until existing table columns are mapped."
    Add-Result "Migration decision" "PASS" "User table exists. Mapping review should precede admin bootstrap."
}

Write-ReportLine ""
Write-ReportLine "Target after migration:"
Write-ReportLine "- tenant_id: raftopoulos-live"
Write-ReportLine "- admin user: not created yet"
Write-ReportLine "- super admin user: not created yet"
Write-ReportLine "- patient import: blocked until backup/restore and access control verification"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_PLAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_PLAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_AUTH_USER_SCHEMA_MIGRATION_PLAN_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.4C Auth/User Schema Migration Plan"
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