$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendTemplate = Join-Path $ProjectRoot "enterprise-backend\.env.production.example"
$FrontendTemplate = Join-Path $ProjectRoot "enterprise-frontend\.env.production.example"
$Guide = Join-Path $ProjectRoot "docs\RAFTOP_PRODUCTION_ENV_GUIDE.md"

$Failures = 0
$Warnings = 0

function Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
}

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
}

function Check-Path {
    param(
        [string]$Label,
        [string]$Path
    )

    if (Test-Path $Path) {
        Ok $Label
    }
    else {
        Fail "$Label missing: $Path"
    }
}

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern
    )

    if (!(Test-Path $Path)) {
        Fail "Missing file for $Label`: $Path"
        return
    }

    $found = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($found) {
        Ok $Label
    }
    else {
        Fail "$Label missing pattern: $Pattern"
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 36 Production Env Templates Verification" -ForegroundColor Cyan

Write-Host ""
Write-Host "============================================================"
Write-Host "1. Template Files"
Write-Host "============================================================"

Check-Path "Backend production env template exists" $BackendTemplate
Check-Path "Frontend production env template exists" $FrontendTemplate
Check-Path "Production env guide exists" $Guide

Write-Host ""
Write-Host "============================================================"
Write-Host "2. Backend Template Requirements"
Write-Host "============================================================"

Check-FileContains -Label "Backend template has NODE_ENV production" -Path $BackendTemplate -Pattern "NODE_ENV=production"
Check-FileContains -Label "Backend template has DATABASE_URL" -Path $BackendTemplate -Pattern "DATABASE_URL="
Check-FileContains -Label "Backend template requires SSL database" -Path $BackendTemplate -Pattern "sslmode=require"
Check-FileContains -Label "Backend template has JWT_SECRET" -Path $BackendTemplate -Pattern "JWT_SECRET="
Check-FileContains -Label "Backend template has CORS_ORIGIN" -Path $BackendTemplate -Pattern "CORS_ORIGIN="
Check-FileContains -Label "Backend template disables dev patient login" -Path $BackendTemplate -Pattern "ALLOW_DEV_PATIENT_LOGIN=false"
Check-FileContains -Label "Backend template enables subscription guard" -Path $BackendTemplate -Pattern "SUBSCRIPTION_GUARD_ENABLED=true"
Check-FileContains -Label "Backend template enables plan limit guard" -Path $BackendTemplate -Pattern "PLAN_LIMIT_GUARD_ENABLED=true"
Check-FileContains -Label "Backend template enables patient guard" -Path $BackendTemplate -Pattern "PATIENT_ACCESS_GUARD_ENABLED=true"
Check-FileContains -Label "Backend template enables user audit" -Path $BackendTemplate -Pattern "USER_ACTIVITY_AUDIT_ENABLED=true"
Check-FileContains -Label "Backend template has super admin key placeholder" -Path $BackendTemplate -Pattern "SUPER_ADMIN_API_KEY="
Check-FileContains -Label "Backend template has restore key placeholder" -Path $BackendTemplate -Pattern "RESTORE_BOOTSTRAP_KEY="

Write-Host ""
Write-Host "============================================================"
Write-Host "3. Frontend Template Requirements"
Write-Host "============================================================"

Check-FileContains -Label "Frontend template has API base URL" -Path $FrontendTemplate -Pattern "REACT_APP_API_BASE_URL="
Check-FileContains -Label "Frontend template has backend URL" -Path $FrontendTemplate -Pattern "REACT_APP_BACKEND_URL="
Check-FileContains -Label "Frontend template has API URL" -Path $FrontendTemplate -Pattern "REACT_APP_API_URL="
Check-FileContains -Label "Frontend template has default tenant" -Path $FrontendTemplate -Pattern "REACT_APP_DEFAULT_TENANT_ID="
Check-FileContains -Label "Frontend template has default patient" -Path $FrontendTemplate -Pattern "REACT_APP_DEFAULT_PATIENT_ID="
Check-FileContains -Label "Frontend template disables sourcemaps" -Path $FrontendTemplate -Pattern "GENERATE_SOURCEMAP=false"

Write-Host ""
Write-Host "============================================================"
Write-Host "4. Guide Requirements"
Write-Host "============================================================"

Check-FileContains -Label "Guide mentions Production Environment" -Path $Guide -Pattern "Production Environment"
Check-FileContains -Label "Guide mentions backend template" -Path $Guide -Pattern "enterprise-backend/.env.production.example"
Check-FileContains -Label "Guide mentions frontend template" -Path $Guide -Pattern "enterprise-frontend/.env.production.example"
Check-FileContains -Label "Guide mentions hosted PostgreSQL" -Path $Guide -Pattern "hosted PostgreSQL"
Check-FileContains -Label "Guide mentions JWT_SECRET" -Path $Guide -Pattern "JWT_SECRET"
Check-FileContains -Label "Guide disables dev patient login" -Path $Guide -Pattern "ALLOW_DEV_PATIENT_LOGIN=false"
Check-FileContains -Label "Guide marks demo ready" -Path $Guide -Pattern "DEMO_READY"
Check-FileContains -Label "Guide marks pilot env setup required" -Path $Guide -Pattern "PILOT_READY_WITH_PRODUCTION_ENV_SETUP_REQUIRED"

Write-Host ""
Write-Host "============================================================"
Write-Host "5. Final Result"
Write-Host "============================================================"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_ENV_TEMPLATES_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_ENV_TEMPLATES_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PRODUCTION_ENV_TEMPLATES_BLOCKED" -ForegroundColor Red
exit 1