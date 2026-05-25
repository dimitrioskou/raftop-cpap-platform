# RAFTOP CPAP CARE Pro
# Phase 41.9 - Admin User Bootstrap Verification and Login Readiness
# Safe ASCII-only script
# Reads DB and tests backend login readiness. Does not print passwords or secrets.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [string]$TenantId = "raftopoulos-live",
    [string]$AdminEmail = "dimitrisgelly@gmail.com",
    [string]$AdminRole = "admin",
    [string]$AdminStatus = "active"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $Root "tools"
$BackendDir = Join-Path $Root "enterprise-backend"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

if (!(Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_admin_user_bootstrap_verification_" + $Timestamp + ".md")
$JsPath = Join-Path $ToolsDir "_phase41_admin_user_bootstrap_verification_runner.js"

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
        [string]$StatusValue,
        [string]$Details
    )

    if ($StatusValue -eq "PASS") {
        $script:PassCount++
    } elseif ($StatusValue -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $StatusValue)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($StatusValue + " - " + $Name)
}

function Write-JsLine {
    param([string]$Text)
    Add-Content -Path $JsPath -Value $Text -Encoding UTF8
}

function Normalize-Url {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }

    return $Url.Trim().TrimEnd("/")
}

function Test-CommandExists {
    param([string]$Command)

    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-FileExists {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Required
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "PASS" ("Found: " + $RelativePath)
    } else {
        if ($Required -eq "YES") {
            Add-Result $Name "FAIL" ("Missing required file: " + $RelativePath)
        } else {
            Add-Result $Name "WARN" ("Optional file missing: " + $RelativePath)
        }
    }
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

function Invoke-Get {
    param([string]$Url)

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Invoke-LoginAttempt {
    param(
        [string]$Url,
        [hashtable]$Body,
        [hashtable]$Headers
    )

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $JsonBody = $Body | ConvertTo-Json -Depth 10
        $Response = Invoke-WebRequest -Uri $Url -Method POST -Headers $Headers -Body $JsonBody -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.9 Admin User Bootstrap Verification" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This script verifies the production admin user after Phase 41.8."
Write-ReportLine "It confirms DB state and attempts login-readiness checks without printing passwords or secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.9 admin user bootstrap verification..."
Write-Host ""

$BackendUrl = Normalize-Url $BackendUrl

Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "tools\run_phase41_controlled_admin_user_bootstrap.ps1" "Phase 41.8 admin bootstrap script" "YES"
Test-FileExists "tools\run_phase41_controlled_tenant_bootstrap_verification.ps1" "Phase 41.7B tenant verification script" "YES"

$LatestAdminApplyReport = Get-LatestReport "phase41_controlled_admin_user_bootstrap_apply_*.md"

if ($LatestAdminApplyReport -eq $null) {
    Add-Result "Latest admin bootstrap apply report" "FAIL" "No Phase 41.8 admin apply report found."
} else {
    $ApplyContent = Get-Content -Path $LatestAdminApplyReport.FullName -Raw -ErrorAction SilentlyContinue

    if ($ApplyContent -match "FINAL STATUS: PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_APPLIED" -or $ApplyContent -match "FINAL STATUS: PHASE41_CONTROLLED_ADMIN_USER_BOOTSTRAP_APPLIED_WITH_WARNINGS") {
        Add-Result "Latest admin bootstrap apply status" "PASS" "Latest admin apply report has acceptable final status."
    } else {
        Add-Result "Latest admin bootstrap apply status" "FAIL" "Latest admin apply report final status is not acceptable."
    }
}

if (Test-CommandExists "node") {
    Add-Result "Node available" "PASS" "node command is available."
} else {
    Add-Result "Node available" "FAIL" "node command is not available."
}

$DbUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    $DbUrl = $env:DATABASE_URL
}

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Add-Result "Production database URL environment variable" "FAIL" "Set RAFTOP_PRODUCTION_DATABASE_URL in the current PowerShell session."
} else {
    Add-Result "Production database URL environment variable" "PASS" "Database URL is present in environment. Secret value not printed."
}

$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Add-Result "Admin password environment variable" "FAIL" "Set RAFTOP_BOOTSTRAP_ADMIN_PASSWORD in the current PowerShell session."
} elseif ($AdminPassword.Length -lt 12) {
    Add-Result "Admin password strength" "FAIL" "Admin password must be at least 12 characters."
} else {
    Add-Result "Admin password environment variable" "PASS" "Admin password is present. Value not printed."
}

if (Test-Path (Join-Path $BackendDir "node_modules\pg")) {
    Add-Result "Node pg dependency" "PASS" "pg dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node pg dependency" "WARN" "pg dependency not found locally."
}

if (Test-Path (Join-Path $BackendDir "node_modules\bcryptjs")) {
    Add-Result "Node bcryptjs dependency" "PASS" "bcryptjs dependency found in enterprise-backend node_modules."
} else {
    Add-Result "Node bcryptjs dependency" "WARN" "bcryptjs dependency not found locally."
}

Set-Content -Path $JsPath -Value "// RAFTOP Phase 41.9 admin user bootstrap verification runner" -Encoding UTF8

Write-JsLine 'const fs = require("fs");'
Write-JsLine 'const path = require("path");'
Write-JsLine 'const reportPath = process.env.RAFTOP_ADMIN_VERIFY_REPORT;'
Write-JsLine 'const dbUrl = process.env.RAFTOP_PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;'
Write-JsLine 'const tenantId = process.env.RAFTOP_ADMIN_TENANT_ID || "raftopoulos-live";'
Write-JsLine 'const adminEmail = process.env.RAFTOP_ADMIN_EMAIL || "dimitrisgelly@gmail.com";'
Write-JsLine 'const adminRole = process.env.RAFTOP_ADMIN_ROLE || "admin";'
Write-JsLine 'const adminStatus = process.env.RAFTOP_ADMIN_STATUS || "active";'
Write-JsLine 'const adminPassword = process.env.RAFTOP_BOOTSTRAP_ADMIN_PASSWORD || "";'
Write-JsLine ''
Write-JsLine 'function w(line) {'
Write-JsLine '  fs.appendFileSync(reportPath, String(line) + "\n", "utf8");'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'function safeExit(status, code) {'
Write-JsLine '  w("");'
Write-JsLine '  w("NODE_RUNNER_STATUS: " + status);'
Write-JsLine '  console.log("NODE_RUNNER_STATUS: " + status);'
Write-JsLine '  process.exit(code);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!reportPath) {'
Write-JsLine '  console.error("Missing RAFTOP_ADMIN_VERIFY_REPORT");'
Write-JsLine '  process.exit(2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!dbUrl) {'
Write-JsLine '  w("DB_URL_PRESENT: false");'
Write-JsLine '  safeExit("MISSING_DATABASE_URL", 2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'if (!adminPassword || adminPassword.length < 12) {'
Write-JsLine '  w("ADMIN_PASSWORD_PRESENT: false_or_too_short");'
Write-JsLine '  safeExit("ADMIN_PASSWORD_MISSING_OR_WEAK", 2);'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'w("DB_URL_PRESENT: true");'
Write-JsLine 'w("DB_URL_VALUE: hidden");'
Write-JsLine 'w("ADMIN_EMAIL: " + adminEmail);'
Write-JsLine 'w("ADMIN_PASSWORD_VALUE: hidden");'
Write-JsLine ''
Write-JsLine 'let Client;'
Write-JsLine 'try {'
Write-JsLine '  Client = require(path.join(process.cwd(), "node_modules", "pg")).Client;'
Write-JsLine '} catch (e1) {'
Write-JsLine '  try {'
Write-JsLine '    Client = require("pg").Client;'
Write-JsLine '  } catch (e2) {'
Write-JsLine '    w("PG_REQUIRE_ERROR: pg module not available");'
Write-JsLine '    safeExit("PG_MODULE_MISSING", 2);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'let bcrypt;'
Write-JsLine 'try {'
Write-JsLine '  bcrypt = require(path.join(process.cwd(), "node_modules", "bcryptjs"));'
Write-JsLine '} catch (e1) {'
Write-JsLine '  try {'
Write-JsLine '    bcrypt = require("bcryptjs");'
Write-JsLine '  } catch (e2) {'
Write-JsLine '    w("BCRYPT_REQUIRE_ERROR: bcryptjs module not available");'
Write-JsLine '    safeExit("BCRYPT_MODULE_MISSING", 2);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'async function main() {'
Write-JsLine '  const client = new Client({'
Write-JsLine '    connectionString: dbUrl,'
Write-JsLine '    ssl: { rejectUnauthorized: false }'
Write-JsLine '  });'
Write-JsLine ''
Write-JsLine '  try {'
Write-JsLine '    await client.connect();'
Write-JsLine '    w("DB_CONNECTION: OK");'
Write-JsLine ''
Write-JsLine '    const usersTable = await client.query("select to_regclass($1) as reg", ["public.users"]);'
Write-JsLine '    const usersExists = usersTable.rows[0] && usersTable.rows[0].reg !== null;'
Write-JsLine '    w("USERS_TABLE_EXISTS: " + usersExists);'
Write-JsLine '    if (!usersExists) {'
Write-JsLine '      safeExit("USERS_TABLE_NOT_FOUND", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const result = await client.query("select id, tenant_id, email, role, status, password_hash from users where tenant_id=$1 and lower(email)=lower($2) limit 1", [tenantId, adminEmail]);'
Write-JsLine '    const exists = result.rows.length > 0;'
Write-JsLine '    w("ADMIN_EXISTS: " + exists);'
Write-JsLine ''
Write-JsLine '    if (!exists) {'
Write-JsLine '      safeExit("ADMIN_USER_NOT_FOUND", 1);'
Write-JsLine '    }'
Write-JsLine ''
Write-JsLine '    const admin = result.rows[0];'
Write-JsLine '    w("ADMIN_TENANT_ID_VALUE: " + admin.tenant_id);'
Write-JsLine '    w("ADMIN_EMAIL_VALUE: " + admin.email);'
Write-JsLine '    w("ADMIN_ROLE_VALUE: " + admin.role);'
Write-JsLine '    w("ADMIN_STATUS_VALUE: " + admin.status);'
Write-JsLine '    w("ADMIN_PASSWORD_HASH_PRESENT: " + (!!admin.password_hash && String(admin.password_hash).length > 20));'
Write-JsLine ''
Write-JsLine '    const passwordMatch = await bcrypt.compare(adminPassword, admin.password_hash || "");'
Write-JsLine '    w("ADMIN_PASSWORD_MATCH: " + passwordMatch);'
Write-JsLine ''
Write-JsLine '    await client.end();'
Write-JsLine '    safeExit("ADMIN_USER_BOOTSTRAP_VERIFICATION_COMPLETED", 0);'
Write-JsLine '  } catch (err) {'
Write-JsLine '    w("ADMIN_VERIFY_ERROR: " + err.message);'
Write-JsLine '    try { await client.end(); } catch (e) {}'
Write-JsLine '    safeExit("ADMIN_USER_BOOTSTRAP_VERIFICATION_FAILED", 1);'
Write-JsLine '  }'
Write-JsLine '}'
Write-JsLine ''
Write-JsLine 'main();'

if ($script:FailCount -eq 0) {
    Push-Location $BackendDir

    $env:RAFTOP_ADMIN_VERIFY_REPORT = $ReportPath
    $env:RAFTOP_ADMIN_TENANT_ID = $TenantId
    $env:RAFTOP_ADMIN_EMAIL = $AdminEmail
    $env:RAFTOP_ADMIN_ROLE = $AdminRole
    $env:RAFTOP_ADMIN_STATUS = $AdminStatus

    $NodeOutput = node $JsPath 2>&1
    $NodeCode = $LASTEXITCODE

    Pop-Location

    Write-ReportLine ""
    Write-ReportLine "NODE_OUTPUT:"
    Write-ReportLine ($NodeOutput | Out-String)
    Write-ReportLine ""

    if ($NodeCode -eq 0) {
        Add-Result "Admin verification node runner" "PASS" "Node runner completed."
    } else {
        Add-Result "Admin verification node runner" "FAIL" ("Node runner failed. Exit code: " + $NodeCode)
    }
}

$ReportContent = Get-Content -Path $ReportPath -Raw -ErrorAction SilentlyContinue

if ($ReportContent -match "DB_CONNECTION: OK") {
    Add-Result "Database connection" "PASS" "Connected to production database."
} else {
    Add-Result "Database connection" "FAIL" "Could not confirm production database connection."
}

if ($ReportContent -match "USERS_TABLE_EXISTS: true") {
    Add-Result "Users table exists" "PASS" "users table exists."
} else {
    Add-Result "Users table exists" "FAIL" "users table not confirmed."
}

if ($ReportContent -match "ADMIN_EXISTS: true") {
    Add-Result "Admin user exists" "PASS" "Admin user exists."
} else {
    Add-Result "Admin user exists" "FAIL" "Admin user was not found."
}

if ($ReportContent -match "ADMIN_TENANT_ID_VALUE: " + [regex]::Escape($TenantId)) {
    Add-Result "Admin tenant id" "PASS" "Admin tenant_id matches target."
} else {
    Add-Result "Admin tenant id" "FAIL" "Admin tenant_id does not match target."
}

if ($ReportContent -match "ADMIN_EMAIL_VALUE: " + [regex]::Escape($AdminEmail)) {
    Add-Result "Admin email" "PASS" "Admin email matches target."
} else {
    Add-Result "Admin email" "FAIL" "Admin email does not match target."
}

if ($ReportContent -match "ADMIN_ROLE_VALUE: " + [regex]::Escape($AdminRole)) {
    Add-Result "Admin role" "PASS" "Admin role matches target."
} else {
    Add-Result "Admin role" "WARN" "Admin role not confirmed."
}

if ($ReportContent -match "ADMIN_STATUS_VALUE: " + [regex]::Escape($AdminStatus)) {
    Add-Result "Admin status" "PASS" "Admin status matches target."
} else {
    Add-Result "Admin status" "WARN" "Admin status not confirmed."
}

if ($ReportContent -match "ADMIN_PASSWORD_HASH_PRESENT: true") {
    Add-Result "Admin password hash" "PASS" "Password hash exists."
} else {
    Add-Result "Admin password hash" "FAIL" "Password hash not confirmed."
}

if ($ReportContent -match "ADMIN_PASSWORD_MATCH: true") {
    Add-Result "Admin password verification" "PASS" "Provided password matches stored hash."
} else {
    Add-Result "Admin password verification" "FAIL" "Provided password did not match stored hash."
}

$HealthUrl = $BackendUrl + "/api/health"
$HealthResult = Invoke-Get $HealthUrl

if ($HealthResult.Code -eq 200) {
    Add-Result "Backend health" "PASS" "Backend /api/health returned HTTP 200."
} else {
    Add-Result "Backend health" "WARN" ("Backend /api/health did not return HTTP 200. Status: " + $HealthResult.Code)
}

$LoginUrl = $BackendUrl + "/api/auth/login"
$LoginHeaders = @{
    "x-tenant-id" = $TenantId
}

$LoginBody1 = @{
    email = $AdminEmail
    password = $AdminPassword
    tenantId = $TenantId
}

$LoginResult1 = Invoke-LoginAttempt $LoginUrl $LoginBody1 $LoginHeaders

if ($LoginResult1.Code -eq 200) {
    Add-Result "Backend login attempt" "PASS" "Login endpoint returned HTTP 200 with tenantId payload."
} else {
    $LoginBody2 = @{
        email = $AdminEmail
        password = $AdminPassword
        tenant_id = $TenantId
    }

    $LoginResult2 = Invoke-LoginAttempt $LoginUrl $LoginBody2 $LoginHeaders

    if ($LoginResult2.Code -eq 200) {
        Add-Result "Backend login attempt" "PASS" "Login endpoint returned HTTP 200 with tenant_id payload."
    } else {
        $LoginBody3 = @{
            email = $AdminEmail
            password = $AdminPassword
        }

        $LoginResult3 = Invoke-LoginAttempt $LoginUrl $LoginBody3 $LoginHeaders

        if ($LoginResult3.Code -eq 200) {
            Add-Result "Backend login attempt" "PASS" "Login endpoint returned HTTP 200 with x-tenant-id header."
        } else {
            Add-Result "Backend login attempt" "WARN" ("Login endpoint did not return HTTP 200 in automated attempts. Statuses: " + $LoginResult1.Code + ", " + $LoginResult2.Code + ", " + $LoginResult3.Code)
        }
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ADMIN VERIFICATION INTERPRETATION"
Write-ReportLine ""
Write-ReportLine "Admin DB verification must pass before manual login testing."
Write-ReportLine "Automated login warning may indicate the login endpoint expects a different payload or that deployed backend auth logic needs review."
Write-ReportLine ""
Write-ReportLine "Next phase:"
Write-ReportLine "Phase 41.10 - Manual Frontend Admin Login Test"
Write-ReportLine ""
Write-ReportLine "Then:"
Write-ReportLine "Phase 42 - Pilot Demo Data and Operational Readiness"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_ADMIN_USER_BOOTSTRAP_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_ADMIN_USER_BOOTSTRAP_VERIFIED_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_ADMIN_USER_BOOTSTRAP_VERIFIED"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.9 Admin User Verification"
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