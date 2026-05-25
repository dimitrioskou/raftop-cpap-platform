# RAFTOP CPAP CARE Pro
# Phase 39.1 - Render Backend Deployment Preparation
# Safe ASCII-only script

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BackendDir = Join-Path $Root "enterprise-backend"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase39_render_backend_preparation_" + $Timestamp + ".md")

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

function Test-DirectoryExists {
    param(
        [string]$RelativePath,
        [string]$Name
    )

    $FullPath = Join-Path $Root $RelativePath

    if (Test-Path $FullPath) {
        Add-Result $Name "PASS" ("Found: " + $RelativePath)
    } else {
        Add-Result $Name "FAIL" ("Missing required directory: " + $RelativePath)
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.1 Render Backend Deployment Preparation" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This check verifies that the backend repository is ready for Render backend deployment preparation."
Write-ReportLine "It does not deploy anything."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.1 Render backend preparation check..."
Write-Host ""

Test-DirectoryExists "enterprise-backend" "Backend directory"
Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "enterprise-backend\src\server.js" "Backend server entry" "YES"
Test-FileExists "enterprise-backend\.env.production.example" "Backend production env example" "YES"

Test-FileContains "enterprise-backend\package.json" '"start"' "Backend npm start script" "YES"
Test-FileContains "enterprise-backend\src\server.js" "process.env.PORT" "Backend uses process.env.PORT" "YES"

Test-FileContains "enterprise-backend\.env.production.example" "NODE_ENV" "Env template includes NODE_ENV" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "DATABASE_URL" "Env template includes DATABASE_URL" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "JWT_SECRET" "Env template includes JWT_SECRET" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "CORS_ORIGIN" "Env template includes CORS_ORIGIN" "YES"

Test-NoFileExists "enterprise-backend\.env.production" "No real backend .env.production"
Test-NoFileExists "enterprise-backend\.env.prod" "No real backend .env.prod"
Test-NoFileExists "enterprise-backend\.env.live" "No real backend .env.live"

Test-FileExists "tools\generate_phase37_render_backend_deployment_guide.ps1" "Render backend deployment guide generator" "YES"
Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"
Test-FileExists "tools\run_phase38_repository_safety_scan.ps1" "Repository safety scan runner" "YES"
Test-FileExists "tools\run_phase38_git_commit_readiness_check.ps1" "Git readiness runner" "YES"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "RENDER BACKEND SETTINGS TO USE"
Write-ReportLine ""
Write-ReportLine "Service type: Web Service"
Write-ReportLine "Root directory: enterprise-backend"
Write-ReportLine "Build command: npm install"
Write-ReportLine "Start command: npm start"
Write-ReportLine "Health endpoint: /api/health"
Write-ReportLine ""
Write-ReportLine "Required production env vars:"
Write-ReportLine ""
Write-ReportLine "NODE_ENV=production"
Write-ReportLine "DATABASE_URL=<production-postgres-url-with-ssl>"
Write-ReportLine "JWT_SECRET=<strong-production-secret>"
Write-ReportLine "CORS_ORIGIN=<production-frontend-url>"
Write-ReportLine ""
Write-ReportLine "Recommended env vars:"
Write-ReportLine ""
Write-ReportLine "RESTORE_KEY=<strong-private-key>"
Write-ReportLine "SUPER_ADMIN_API_KEY=<strong-private-key>"
Write-ReportLine "DEMO_MODE=false"
Write-ReportLine "LOG_LEVEL=info"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_PREPARATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_PREPARATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_RENDER_BACKEND_PREPARATION_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.1 Render Backend Preparation"
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