# RAFTOP CPAP CARE Pro
# Phase 41.4B - User/Auth Schema Gap Review
# Safe ASCII-only script
# Reads local source and latest schema report only. Does not modify database.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendSrcDir = Join-Path $Root "enterprise-backend\src"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_user_auth_schema_gap_review_" + $Timestamp + ".md")

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

    $Max = [Math]::Min($Matches.Count, 25)
    $Items = @()

    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = $Matches[$i].Path.Replace($Root + "\", "")
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }

    if ($Matches.Count -gt 25) {
        $Items += ("... plus " + ($Matches.Count - 25) + " more")
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.4B User/Auth Schema Gap Review" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report reviews the gap between production DB schema and backend auth/user implementation."
Write-ReportLine "It reads local source and reports only. It does not modify the database."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.4B user/auth schema gap review..."
Write-Host ""

$LatestSchemaReport = Get-LatestReport "phase41_production_db_schema_discovery_*.md"
$LatestMethodReport = Get-LatestReport "phase41_schema_review_bootstrap_method_*.md"

if ($LatestSchemaReport -eq $null) {
    Add-Result "Latest schema discovery report" "FAIL" "No Phase 41.3 schema discovery report found."
    $SchemaContent = ""
} else {
    Add-Result "Latest schema discovery report" "PASS" ("Found: " + $LatestSchemaReport.FullName)
    $SchemaContent = Get-Content -Path $LatestSchemaReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($LatestMethodReport -eq $null) {
    Add-Result "Latest bootstrap method report" "WARN" "No Phase 41.3B bootstrap method report found."
    $MethodContent = ""
} else {
    Add-Result "Latest bootstrap method report" "PASS" ("Found: " + $LatestMethodReport.FullName)
    $MethodContent = Get-Content -Path $LatestMethodReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($SchemaContent -match "DB_CONNECTION: OK") {
    Add-Result "Schema report database connection" "PASS" "Latest schema report confirms DB connection."
} else {
    Add-Result "Schema report database connection" "FAIL" "Latest schema report does not confirm DB connection."
}

$TenantTables = Get-DiscoveryValue $SchemaContent "tenant_tables"
$UserTables = Get-DiscoveryValue $SchemaContent "user_tables"
$SubscriptionTables = Get-DiscoveryValue $SchemaContent "subscription_module_tables"
$AuditTables = Get-DiscoveryValue $SchemaContent "audit_security_tables"
$PatientTables = Get-DiscoveryValue $SchemaContent "patient_tables"
$DeviceTables = Get-DiscoveryValue $SchemaContent "device_tables"
$AtlasTables = Get-DiscoveryValue $SchemaContent "atlas_task_tables"

if ([string]::IsNullOrWhiteSpace($TenantTables)) {
    Add-Result "Tenant tables in schema report" "FAIL" "No tenant tables detected in latest schema report."
} else {
    Add-Result "Tenant tables in schema report" "PASS" ("Tenant tables: " + $TenantTables)
}

if ([string]::IsNullOrWhiteSpace($UserTables)) {
    Add-Result "User/account tables in schema report" "WARN" "No user/account tables detected in latest schema report."
} else {
    Add-Result "User/account tables in schema report" "PASS" ("User/account tables: " + $UserTables)
}

$BackendFiles = Get-BackendFiles

if ($BackendFiles.Count -gt 0) {
    Add-Result "Backend source scan scope" "PASS" ("Scannable backend files: " + $BackendFiles.Count)
} else {
    Add-Result "Backend source scan scope" "FAIL" "No backend source files found."
}

$AuthMatches = Find-Matches $BackendFiles "/api/auth"
$LoginMatches = Find-Matches $BackendFiles "login"
$JwtMatches = Find-Matches $BackendFiles "jwt"
$BcryptMatches = Find-Matches $BackendFiles "bcrypt"
$PasswordMatches = Find-Matches $BackendFiles "password"
$UserMatches = Find-Matches $BackendFiles "users"
$EmailMatches = Find-Matches $BackendFiles "email"
$TenantMatches = Find-Matches $BackendFiles "tenant"
$CreateTableMatches = Find-Matches $BackendFiles "CREATE TABLE"
$InsertIntoMatches = Find-Matches $BackendFiles "INSERT INTO"
$FromUsersMatches = Find-Matches $BackendFiles "FROM users"
$IntoUsersMatches = Find-Matches $BackendFiles "INTO users"
$UsersTableMatches = Find-Matches $BackendFiles "users table"
$RoleMatches = Find-Matches $BackendFiles "role"
$SuperAdminMatches = Find-Matches $BackendFiles "super_admin"
$AdminMatches = Find-Matches $BackendFiles "admin"

if ((Count-Matches $AuthMatches) -gt 0) {
    Add-Result "Auth route references" "PASS" (Format-MatchLocations $AuthMatches)
} else {
    Add-Result "Auth route references" "WARN" "No /api/auth references found."
}

if ((Count-Matches $LoginMatches) -gt 0) {
    Add-Result "Login references" "PASS" (Format-MatchLocations $LoginMatches)
} else {
    Add-Result "Login references" "WARN" "No login references found."
}

if ((Count-Matches $JwtMatches) -gt 0) {
    Add-Result "JWT references" "PASS" (Format-MatchLocations $JwtMatches)
} else {
    Add-Result "JWT references" "WARN" "No JWT references found."
}

if ((Count-Matches $BcryptMatches) -gt 0) {
    Add-Result "Password hashing references" "PASS" (Format-MatchLocations $BcryptMatches)
} else {
    Add-Result "Password hashing references" "WARN" "No bcrypt references found."
}

if ((Count-Matches $UserMatches) -gt 0) {
    Add-Result "Backend user references" "PASS" (Format-MatchLocations $UserMatches)
} else {
    Add-Result "Backend user references" "WARN" "No backend users references found."
}

if ((Count-Matches $FromUsersMatches) -gt 0 -or (Count-Matches $IntoUsersMatches) -gt 0) {
    Add-Result "SQL users table references" "PASS" ((Format-MatchLocations $FromUsersMatches) + " | " + (Format-MatchLocations $IntoUsersMatches))
} else {
    Add-Result "SQL users table references" "WARN" "No direct FROM users / INTO users references found."
}

if ((Count-Matches $CreateTableMatches) -gt 0) {
    Add-Result "CREATE TABLE references" "PASS" (Format-MatchLocations $CreateTableMatches)
} else {
    Add-Result "CREATE TABLE references" "WARN" "No CREATE TABLE references found in backend source."
}

if ((Count-Matches $InsertIntoMatches) -gt 0) {
    Add-Result "INSERT INTO references" "PASS" (Format-MatchLocations $InsertIntoMatches)
} else {
    Add-Result "INSERT INTO references" "WARN" "No INSERT INTO references found in backend source."
}

if ((Count-Matches $RoleMatches) -gt 0) {
    Add-Result "Role references" "PASS" (Format-MatchLocations $RoleMatches)
} else {
    Add-Result "Role references" "WARN" "No role references found."
}

if ((Count-Matches $SuperAdminMatches) -gt 0 -or (Count-Matches $AdminMatches) -gt 0) {
    Add-Result "Admin/super-admin references" "PASS" ((Format-MatchLocations $SuperAdminMatches) + " | " + (Format-MatchLocations $AdminMatches))
} else {
    Add-Result "Admin/super-admin references" "WARN" "No admin/super-admin references found."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "SCHEMA GROUP SUMMARY"
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
Write-ReportLine "AUTH IMPLEMENTATION SIGNALS"
Write-ReportLine ""
Write-ReportLine ("auth_matches=" + (Count-Matches $AuthMatches))
Write-ReportLine ("login_matches=" + (Count-Matches $LoginMatches))
Write-ReportLine ("jwt_matches=" + (Count-Matches $JwtMatches))
Write-ReportLine ("bcrypt_matches=" + (Count-Matches $BcryptMatches))
Write-ReportLine ("password_matches=" + (Count-Matches $PasswordMatches))
Write-ReportLine ("user_matches=" + (Count-Matches $UserMatches))
Write-ReportLine ("email_matches=" + (Count-Matches $EmailMatches))
Write-ReportLine ("tenant_matches=" + (Count-Matches $TenantMatches))
Write-ReportLine ("create_table_matches=" + (Count-Matches $CreateTableMatches))
Write-ReportLine ("insert_into_matches=" + (Count-Matches $InsertIntoMatches))
Write-ReportLine ("from_users_matches=" + (Count-Matches $FromUsersMatches))
Write-ReportLine ("into_users_matches=" + (Count-Matches $IntoUsersMatches))
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "BOOTSTRAP GAP DECISION"
Write-ReportLine ""

$HasTenantTable = -not [string]::IsNullOrWhiteSpace($TenantTables)
$HasUserTable = -not [string]::IsNullOrWhiteSpace($UserTables)
$BackendUsesUsers = ((Count-Matches $UserMatches) -gt 0 -or (Count-Matches $FromUsersMatches) -gt 0 -or (Count-Matches $IntoUsersMatches) -gt 0)
$BackendHasAuth = ((Count-Matches $AuthMatches) -gt 0 -or (Count-Matches $LoginMatches) -gt 0)
$BackendHasPasswordHashing = ((Count-Matches $BcryptMatches) -gt 0)

if ($HasTenantTable -and $HasUserTable) {
    Write-ReportLine "Decision:"
    Write-ReportLine "Tenant and admin bootstrap can be designed using existing schema."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4A - Controlled Tenant and Admin Bootstrap Script"
    Add-Result "Final bootstrap gap decision" "PASS" "Tenant and user tables exist."
} elseif ($HasTenantTable -and -not $HasUserTable -and $BackendUsesUsers) {
    Write-ReportLine "Decision:"
    Write-ReportLine "Backend appears to reference users, but production DB schema discovery did not find user/account tables."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4C - Production Auth/User Schema Migration Plan"
    Add-Result "Final bootstrap gap decision" "WARN" "User/auth schema gap exists. Migration or table creation likely needed before admin bootstrap."
} elseif ($HasTenantTable -and -not $HasUserTable -and -not $BackendUsesUsers) {
    Write-ReportLine "Decision:"
    Write-ReportLine "Tenant table exists, but user/auth storage model is unclear."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4D - Auth Storage Model Manual Review"
    Add-Result "Final bootstrap gap decision" "WARN" "User storage model unclear."
} else {
    Write-ReportLine "Decision:"
    Write-ReportLine "Production schema is not ready for tenant/admin bootstrap."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4C - Production Schema Migration Plan"
    Add-Result "Final bootstrap gap decision" "FAIL" "Tenant/user schema insufficient."
}

Write-ReportLine ""
Write-ReportLine "Do not create admin users until the user/auth table gap is resolved."
Write-ReportLine ""
Write-ReportLine "Target tenant remains:"
Write-ReportLine "tenant_id: raftopoulos-live"
Write-ReportLine "tenant_name: RAFTOPOULOS"
Write-ReportLine "plan: enterprise"
Write-ReportLine "status: active"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_USER_AUTH_SCHEMA_GAP_REVIEW_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_USER_AUTH_SCHEMA_GAP_REVIEW_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_USER_AUTH_SCHEMA_GAP_REVIEW_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.4B User/Auth Schema Gap Review"
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