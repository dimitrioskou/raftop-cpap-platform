# RAFTOP CPAP CARE Pro
# Phase 39.2 - Render Backend Environment Variables Pack
# Safe ASCII-only script
# Does not create real production env files.
# Does not print real secrets.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendDir = Join-Path $Root "enterprise-backend"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase39_render_backend_env_pack_" + $Timestamp + ".md")

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

function Test-NoFileExists {
    param(
        [string]$RelativePath,
        [string]$Name
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "FAIL" ("Disallowed file exists: " + $RelativePath)
    } else {
        Add-Result $Name "PASS" ("Disallowed file not found: " + $RelativePath)
    }
}

function Test-FileContains {
    param(
        [string]$RelativePath,
        [string]$Pattern,
        [string]$Name,
        [string]$Required
    )

    $FullPath = Join-Path $Root $RelativePath

    if (!(Test-Path $FullPath)) {
        if ($Required -eq "YES") {
            Add-Result $Name "FAIL" ("File missing: " + $RelativePath)
        } else {
            Add-Result $Name "WARN" ("File missing: " + $RelativePath)
        }
        return
    }

    try {
        $Match = Select-String -Path $FullPath -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue

        if ($Match) {
            Add-Result $Name "PASS" ("Pattern found in: " + $RelativePath)
        } else {
            if ($Required -eq "YES") {
                Add-Result $Name "FAIL" ("Pattern not found in: " + $RelativePath)
            } else {
                Add-Result $Name "WARN" ("Pattern not found in: " + $RelativePath)
            }
        }
    } catch {
        Add-Result $Name "WARN" ("Could not scan file: " + $RelativePath)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.2 Render Backend Environment Variables Pack" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This pack defines the backend environment variables that must be configured inside Render."
Write-ReportLine "It does not create real production env files."
Write-ReportLine "It does not print real secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.2 Render backend env pack..."
Write-Host ""

Test-FileExists "enterprise-backend\.env.production.example" "Backend production env example" "YES"

Test-FileContains "enterprise-backend\.env.production.example" "NODE_ENV" "Template includes NODE_ENV" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "DATABASE_URL" "Template includes DATABASE_URL" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "JWT_SECRET" "Template includes JWT_SECRET" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "CORS_ORIGIN" "Template includes CORS_ORIGIN" "YES"

Test-NoFileExists "enterprise-backend\.env.production" "No real backend .env.production"
Test-NoFileExists "enterprise-backend\.env.prod" "No real backend .env.prod"
Test-NoFileExists "enterprise-backend\.env.live" "No real backend .env.live"

Write-ReportLine "RENDER BACKEND ENVIRONMENT VARIABLES"
Write-ReportLine ""
Write-ReportLine "Set these inside Render only:"
Write-ReportLine ""
Write-ReportLine "1. NODE_ENV"
Write-ReportLine "Value:"
Write-ReportLine "production"
Write-ReportLine ""
Write-ReportLine "2. DATABASE_URL"
Write-ReportLine "Value:"
Write-ReportLine "<production-postgresql-url-with-ssl>"
Write-ReportLine ""
Write-ReportLine "Rules:"
Write-ReportLine "- must point to production PostgreSQL"
Write-ReportLine "- must not point to localhost"
Write-ReportLine "- must not point to demo database"
Write-ReportLine "- must not point to expired database"
Write-ReportLine "- must use SSL"
Write-ReportLine "- expected suffix: sslmode=require"
Write-ReportLine ""
Write-ReportLine "3. JWT_SECRET"
Write-ReportLine "Value:"
Write-ReportLine "<strong-random-production-secret>"
Write-ReportLine ""
Write-ReportLine "Rules:"
Write-ReportLine "- must be strong"
Write-ReportLine "- must be private"
Write-ReportLine "- must be unique for production"
Write-ReportLine "- must not be committed to GitHub"
Write-ReportLine "- must not be reused from demo or development"
Write-ReportLine ""
Write-ReportLine "4. CORS_ORIGIN"
Write-ReportLine "Value:"
Write-ReportLine "<production-frontend-url>"
Write-ReportLine ""
Write-ReportLine "Temporary value before frontend deployment:"
Write-ReportLine "<temporary-render-preview-or-final-frontend-url>"
Write-ReportLine ""
Write-ReportLine "Rules:"
Write-ReportLine "- must not be wildcard"
Write-ReportLine "- must not be localhost in production"
Write-ReportLine "- must match the final production frontend URL after frontend deployment"
Write-ReportLine ""
Write-ReportLine "5. RESTORE_KEY"
Write-ReportLine "Value:"
Write-ReportLine "<strong-private-restore-key>"
Write-ReportLine ""
Write-ReportLine "Recommended:"
Write-ReportLine "YES"
Write-ReportLine ""
Write-ReportLine "6. SUPER_ADMIN_API_KEY"
Write-ReportLine "Value:"
Write-ReportLine "<strong-private-super-admin-key>"
Write-ReportLine ""
Write-ReportLine "Recommended:"
Write-ReportLine "YES"
Write-ReportLine ""
Write-ReportLine "7. DEMO_MODE"
Write-ReportLine "Value:"
Write-ReportLine "false"
Write-ReportLine ""
Write-ReportLine "8. LOG_LEVEL"
Write-ReportLine "Value:"
Write-ReportLine "info"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "SECRET GENERATION GUIDANCE"
Write-ReportLine ""
Write-ReportLine "Generate secrets locally, but do not paste them into ChatGPT and do not save them in the repository."
Write-ReportLine ""
Write-ReportLine "PowerShell example for generating a random secret:"
Write-ReportLine ""
Write-ReportLine "[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))"
Write-ReportLine ""
Write-ReportLine "Use a different generated value for:"
Write-ReportLine "- JWT_SECRET"
Write-ReportLine "- RESTORE_KEY"
Write-ReportLine "- SUPER_ADMIN_API_KEY"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RENDER UI ENTRY PLAN"
Write-ReportLine ""
Write-ReportLine "Render backend service:"
Write-ReportLine ""
Write-ReportLine "Environment > Add Environment Variable"
Write-ReportLine ""
Write-ReportLine "Add:"
Write-ReportLine ""
Write-ReportLine "NODE_ENV=production"
Write-ReportLine "DATABASE_URL=<set privately in Render>"
Write-ReportLine "JWT_SECRET=<set privately in Render>"
Write-ReportLine "CORS_ORIGIN=<set to frontend production URL>"
Write-ReportLine "RESTORE_KEY=<set privately in Render>"
Write-ReportLine "SUPER_ADMIN_API_KEY=<set privately in Render>"
Write-ReportLine "DEMO_MODE=false"
Write-ReportLine "LOG_LEVEL=info"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ACCEPTANCE CRITERIA"
Write-ReportLine ""
Write-ReportLine "- env template exists"
Write-ReportLine "- required keys are documented"
Write-ReportLine "- no real production env file exists in backend directory"
Write-ReportLine "- secrets are only entered in Render"
Write-ReportLine "- DATABASE_URL is production PostgreSQL with SSL"
Write-ReportLine "- CORS_ORIGIN is not wildcard"
Write-ReportLine "- JWT_SECRET is strong and private"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_ENV_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_ENV_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_RENDER_BACKEND_ENV_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.2 Render Backend Env Pack"
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