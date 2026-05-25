# RAFTOP CPAP CARE Pro
# Phase 39.5 - Render Backend Web Service Creation Checklist
# Safe ASCII-only script
# Does not deploy anything and does not store secrets.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase39_render_backend_web_service_checklist_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 39.5 Render Backend Web Service Creation Checklist" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This checklist defines the Render backend Web Service creation settings for RAFTOP CPAP CARE Pro."
Write-ReportLine "It does not deploy anything and does not store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 39.5 Render backend web service checklist..."
Write-Host ""

Test-DirectoryExists "enterprise-backend" "Backend directory"
Test-FileExists "enterprise-backend\package.json" "Backend package.json" "YES"
Test-FileExists "enterprise-backend\src\server.js" "Backend server entry" "YES"
Test-FileExists "enterprise-backend\.env.production.example" "Backend production env template" "YES"

Test-FileContains "enterprise-backend\package.json" '"start"' "Backend package has start script" "YES"
Test-FileContains "enterprise-backend\src\server.js" "process.env.PORT" "Backend uses process.env.PORT" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "DATABASE_URL" "Backend env template includes DATABASE_URL" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "JWT_SECRET" "Backend env template includes JWT_SECRET" "YES"
Test-FileContains "enterprise-backend\.env.production.example" "CORS_ORIGIN" "Backend env template includes CORS_ORIGIN" "YES"

Test-NoFileExists "enterprise-backend\.env.production" "No real backend production env file"
Test-NoFileExists "enterprise-backend\.env.prod" "No real backend prod env file"
Test-NoFileExists "enterprise-backend\.env.live" "No real backend live env file"

Test-FileExists "tools\run_phase39_render_backend_preparation.ps1" "Phase 39.1 backend preparation script" "YES"
Test-FileExists "tools\run_phase39_render_backend_env_pack.ps1" "Phase 39.2 backend env pack script" "YES"
Test-FileExists "tools\run_phase39_postgres_provider_decision.ps1" "Phase 39.3 provider decision script" "YES"
Test-FileExists "tools\run_phase39_render_postgres_creation_checklist.ps1" "Phase 39.4 PostgreSQL checklist script" "YES"
Test-FileExists "tools\run_phase37_production_smoke_test.ps1" "Production smoke test runner" "YES"

Write-ReportLine "RENDER BACKEND WEB SERVICE SETTINGS"
Write-ReportLine ""
Write-ReportLine "Use these settings when creating the backend service in Render:"
Write-ReportLine ""
Write-ReportLine "Service type:"
Write-ReportLine "Web Service"
Write-ReportLine ""
Write-ReportLine "Repository:"
Write-ReportLine "https://github.com/dimitrioskou/raftop-cpap-platform.git"
Write-ReportLine ""
Write-ReportLine "Branch:"
Write-ReportLine "main"
Write-ReportLine ""
Write-ReportLine "Root Directory:"
Write-ReportLine "enterprise-backend"
Write-ReportLine ""
Write-ReportLine "Runtime:"
Write-ReportLine "Node"
Write-ReportLine ""
Write-ReportLine "Build Command:"
Write-ReportLine "npm install"
Write-ReportLine ""
Write-ReportLine "Start Command:"
Write-ReportLine "npm start"
Write-ReportLine ""
Write-ReportLine "Health Endpoint:"
Write-ReportLine "/api/health"
Write-ReportLine ""
Write-ReportLine "Auto Deploy:"
Write-ReportLine "Recommended: off during first controlled production setup"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "REQUIRED ENVIRONMENT VARIABLES"
Write-ReportLine ""
Write-ReportLine "Add these in Render backend Environment Variables:"
Write-ReportLine ""
Write-ReportLine "NODE_ENV=production"
Write-ReportLine "DATABASE_URL=<production-postgresql-url-private>"
Write-ReportLine "JWT_SECRET=<strong-private-production-secret>"
Write-ReportLine "CORS_ORIGIN=<production-frontend-url-or-temporary-placeholder>"
Write-ReportLine ""
Write-ReportLine "Recommended:"
Write-ReportLine ""
Write-ReportLine "RESTORE_KEY=<strong-private-restore-key>"
Write-ReportLine "SUPER_ADMIN_API_KEY=<strong-private-super-admin-key>"
Write-ReportLine "DEMO_MODE=false"
Write-ReportLine "LOG_LEVEL=info"
Write-ReportLine ""
Write-ReportLine "Do not put real secret values in this report."
Write-ReportLine "Do not commit real secret values to GitHub."
Write-ReportLine "Do not put database credentials in frontend code."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "MANUAL CREATION STEPS"
Write-ReportLine ""
Write-ReportLine "1. Open Render Dashboard."
Write-ReportLine "2. Select New."
Write-ReportLine "3. Select Web Service."
Write-ReportLine "4. Connect GitHub repository."
Write-ReportLine "5. Select repository raftop-cpap-platform."
Write-ReportLine "6. Select branch main."
Write-ReportLine "7. Set Root Directory to enterprise-backend."
Write-ReportLine "8. Set Build Command to npm install."
Write-ReportLine "9. Set Start Command to npm start."
Write-ReportLine "10. Add required environment variables."
Write-ReportLine "11. Create service."
Write-ReportLine "12. Trigger manual deploy."
Write-ReportLine "13. Watch logs."
Write-ReportLine "14. Verify /api/health."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FIRST DEPLOY LOG CHECKS"
Write-ReportLine ""
Write-ReportLine "Acceptable:"
Write-ReportLine "- server starts"
Write-ReportLine "- NODE_ENV is production"
Write-ReportLine "- health endpoint is available"
Write-ReportLine "- database connection succeeds or gives clear migration/bootstrap warning"
Write-ReportLine ""
Write-ReportLine "Not acceptable:"
Write-ReportLine "- missing DATABASE_URL"
Write-ReportLine "- missing JWT_SECRET"
Write-ReportLine "- weak JWT secret blocked"
Write-ReportLine "- cannot find module"
Write-ReportLine "- npm start missing"
Write-ReportLine "- port binding error"
Write-ReportLine "- SSL/TLS required database error not addressed"
Write-ReportLine "- route not found for /api/health"
Write-ReportLine "- repeated 500 errors"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FIRST BACKEND URL CHECK"
Write-ReportLine ""
Write-ReportLine "After deployment, test:"
Write-ReportLine ""
Write-ReportLine "https://your-render-backend-url.onrender.com/api/health"
Write-ReportLine ""
Write-ReportLine "Expected:"
Write-ReportLine "- HTTP 200"
Write-ReportLine "- JSON response"
Write-ReportLine "- no 404"
Write-ReportLine "- no 500"
Write-ReportLine "- no proxy error"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "SMOKE TEST COMMAND AFTER BACKEND URL EXISTS"
Write-ReportLine ""
Write-ReportLine ".\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-render-backend-url.onrender.com -TenantId raftopoulos-live"
Write-ReportLine ""
Write-ReportLine "Important:"
Write-ReportLine "- 401 or 403 is acceptable for protected routes."
Write-ReportLine "- 404 is not acceptable for required routes."
Write-ReportLine "- 500 is not acceptable."
Write-ReportLine "- health must return 200."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "ACCEPTANCE CHECKLIST"
Write-ReportLine ""
Write-ReportLine "- Render Web Service created: PENDING"
Write-ReportLine "- Repository connected: PENDING"
Write-ReportLine "- Branch main selected: PENDING"
Write-ReportLine "- Root directory enterprise-backend set: PENDING"
Write-ReportLine "- Build command npm install set: PENDING"
Write-ReportLine "- Start command npm start set: PENDING"
Write-ReportLine "- Environment variables added: PENDING"
Write-ReportLine "- First deploy started: PENDING"
Write-ReportLine "- Logs reviewed: PENDING"
Write-ReportLine "- Health endpoint verified: PENDING"
Write-ReportLine "- Smoke test run: PENDING"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NEXT PHASE"
Write-ReportLine ""
Write-ReportLine "Phase 39.6 - Backend First Deploy Verification"
Write-ReportLine ""
Write-ReportLine "This will verify the deployed backend URL and run the smoke test against the live Render backend."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_WEB_SERVICE_CHECKLIST_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE39_RENDER_BACKEND_WEB_SERVICE_CHECKLIST_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE39_RENDER_BACKEND_WEB_SERVICE_CHECKLIST_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 39.5 Render Backend Web Service Checklist"
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