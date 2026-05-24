$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendRoot = Join-Path $ProjectRoot "enterprise-backend"
$FrontendRoot = Join-Path $ProjectRoot "enterprise-frontend"
$BackendSrc = Join-Path $BackendRoot "src"
$FrontendSrc = Join-Path $FrontendRoot "src"

$BackendEnv = Join-Path $BackendRoot ".env"
$FrontendEnv = Join-Path $FrontendRoot ".env"

$Failures = 0
$Warnings = 0

function Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
}

function Check-Path {
    param(
        [string]$Label,
        [string]$Path,
        [bool]$Required = $true
    )

    if (Test-Path $Path) {
        Ok $Label
    }
    else {
        if ($Required) {
            Fail "$Label missing: $Path"
        }
        else {
            Warn "$Label missing: $Path"
        }
    }
}

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern,
        [bool]$Required = $true
    )

    if (!(Test-Path $Path)) {
        if ($Required) {
            Fail "Missing file for $Label`: $Path"
        }
        else {
            Warn "Missing file for $Label`: $Path"
        }
        return
    }

    $found = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($found) {
        Ok $Label
    }
    else {
        if ($Required) {
            Fail "$Label missing pattern: $Pattern"
        }
        else {
            Warn "$Label missing pattern: $Pattern"
        }
    }
}

function Read-EnvValue {
    param(
        [string]$Path,
        [string]$Key
    )

    if (!(Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object {
        $_ -match "^\s*$Key\s*="
    } | Select-Object -First 1

    if (!$line) {
        return $null
    }

    return ($line -replace "^\s*$Key\s*=", "").Trim().Trim('"').Trim("'")
}

function Check-EnvKey {
    param(
        [string]$Path,
        [string]$Key,
        [bool]$Required = $true
    )

    $value = Read-EnvValue -Path $Path -Key $Key

    if ($null -ne $value -and $value -ne "") {
        Ok "$Key is configured"
        return $value
    }

    if ($Required) {
        Fail "$Key is missing from $Path"
    }
    else {
        Warn "$Key is missing from $Path"
    }

    return $null
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 36 Production Baseline Audit" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray

Section "1. Project Structure"

Check-Path "Project root exists" $ProjectRoot
Check-Path "Backend root exists" $BackendRoot
Check-Path "Frontend root exists" $FrontendRoot
Check-Path "Backend src exists" $BackendSrc
Check-Path "Frontend src exists" $FrontendSrc
Check-Path "Backend package.json exists" (Join-Path $BackendRoot "package.json")
Check-Path "Frontend package.json exists" (Join-Path $FrontendRoot "package.json")

Section "2. Environment Files"

Check-Path "Backend .env exists" $BackendEnv $false
Check-Path "Frontend .env exists" $FrontendEnv $false

if (Test-Path $BackendEnv) {
    $DatabaseUrl = Check-EnvKey -Path $BackendEnv -Key "DATABASE_URL" -Required $true
    $JwtSecret = Check-EnvKey -Path $BackendEnv -Key "JWT_SECRET" -Required $true
    $NodeEnv = Check-EnvKey -Path $BackendEnv -Key "NODE_ENV" -Required $false
    $Port = Check-EnvKey -Path $BackendEnv -Key "PORT" -Required $false

    if ($JwtSecret -and $JwtSecret.Length -lt 24) {
        Warn "JWT_SECRET is short. Production should use a long random secret."
    }

    if ($JwtSecret -and $JwtSecret -match "raftop-dev-secret|secret|password|123") {
        Fail "JWT_SECRET looks unsafe for production."
    }

    if ($NodeEnv -and $NodeEnv -ne "production") {
        Warn "NODE_ENV is not production. Current value: $NodeEnv"
    }

    if ($DatabaseUrl -and $DatabaseUrl -match "localhost|127.0.0.1") {
        Warn "DATABASE_URL points to local database. Production needs hosted Postgres."
    }
}

if (Test-Path $FrontendEnv) {
    Check-EnvKey -Path $FrontendEnv -Key "REACT_APP_API_BASE_URL" -Required $false | Out-Null
    Check-EnvKey -Path $FrontendEnv -Key "REACT_APP_BACKEND_URL" -Required $false | Out-Null
}

Section "3. Backend Security Dependencies"

$BackendPackage = Join-Path $BackendRoot "package.json"

Check-FileContains `
    -Label "Backend has helmet dependency" `
    -Path $BackendPackage `
    -Pattern "helmet" `
    -Required $false

Check-FileContains `
    -Label "Backend has cors dependency" `
    -Path $BackendPackage `
    -Pattern "cors" `
    -Required $false

Check-FileContains `
    -Label "Backend has jsonwebtoken dependency" `
    -Path $BackendPackage `
    -Pattern "jsonwebtoken" `
    -Required $true

Check-FileContains `
    -Label "Backend has bcrypt dependency" `
    -Path $BackendPackage `
    -Pattern "bcrypt" `
    -Required $true

Section "4. Backend Security Middleware"

$ServerFile = Join-Path $BackendSrc "server.js"

Check-FileContains `
    -Label "server.js uses helmet" `
    -Path $ServerFile `
    -Pattern "helmet" `
    -Required $false

Check-FileContains `
    -Label "server.js uses cors" `
    -Path $ServerFile `
    -Pattern "cors" `
    -Required $false

Check-FileContains `
    -Label "server.js wires tenant context guard" `
    -Path $ServerFile `
    -Pattern "requireTenantContext" `
    -Required $true

Check-FileContains `
    -Label "server.js wires subscription guard" `
    -Path $ServerFile `
    -Pattern "tenantSubscriptionGuard" `
    -Required $true

Check-FileContains `
    -Label "server.js wires patient access guard" `
    -Path $ServerFile `
    -Pattern "patientAccessGuard" `
    -Required $true

Check-FileContains `
    -Label "server.js wires user activity audit middleware" `
    -Path $ServerFile `
    -Pattern "userActivityAuditMiddleware" `
    -Required $true

Section "5. Authentication Hardening Signals"

$AuthFile = Join-Path $BackendSrc "routes\auth.js"

Check-FileContains `
    -Label "auth.js signs JWT tokens" `
    -Path $AuthFile `
    -Pattern "jwt.sign" `
    -Required $true

Check-FileContains `
    -Label "auth.js verifies JWT tokens" `
    -Path $AuthFile `
    -Pattern "jwt.verify" `
    -Required $true

Check-FileContains `
    -Label "auth.js supports bcrypt password comparison" `
    -Path $AuthFile `
    -Pattern "bcrypt.compare" `
    -Required $true

Check-FileContains `
    -Label "auth.js captures failed login audit" `
    -Path $AuthFile `
    -Pattern "writeFailedLoginFromRequest" `
    -Required $true

if (Test-Path $AuthFile) {
    $hasOldDevSecret = Select-String -Path $AuthFile -Pattern "raftop-dev-secret" -Quiet

    if ($hasOldDevSecret) {
        Warn "auth.js contains old unsafe dev fallback JWT secret: raftop-dev-secret"
    }
    else {
        Ok "auth.js old unsafe dev fallback secret removed"
    }

    $hasProductionJwtRequirement = Select-String -Path $AuthFile -Pattern "JWT_SECRET is required and must be at least 24 characters in production" -Quiet

    if ($hasProductionJwtRequirement) {
        Ok "auth.js enforces JWT_SECRET in production"
    }
    else {
        Fail "auth.js does not enforce JWT_SECRET in production"
    }
}

Section "6. Audit & Compliance Tables / Routes"

Check-Path "User activity audit service exists" (Join-Path $BackendSrc "services\userActivityAuditService.js")
Check-Path "Failed login audit service exists" (Join-Path $BackendSrc "services\failedLoginAuditService.js")
Check-Path "User activity audit route exists" (Join-Path $BackendSrc "routes\tenant\userActivityAudit.js")
Check-Path "Failed login audit route exists" (Join-Path $BackendSrc "routes\tenant\failedLoginAudit.js")
Check-Path "Security overview route exists" (Join-Path $BackendSrc "routes\tenant\securityOverview.js")

Section "7. Patient Portal Production Signals"

Check-Path "Patient access guard exists" (Join-Path $BackendSrc "middleware\patientAccessGuard.js")
Check-Path "Patient therapy route exists" (Join-Path $BackendSrc "routes\patient\therapy.js")
Check-Path "Patient nightly analysis route exists" (Join-Path $BackendSrc "routes\patient\nightlyAnalysis.js")
Check-Path "Patient night compare route exists" (Join-Path $BackendSrc "routes\patient\nightCompare.js")

Check-Path "Patient dashboard frontend exists" (Join-Path $FrontendSrc "pages\patient\PatientDashboardPage.js")
Check-Path "Patient therapy frontend exists" (Join-Path $FrontendSrc "pages\patient\PatientTherapyPage.js")
Check-Path "Patient nightly analysis frontend exists" (Join-Path $FrontendSrc "pages\patient\PatientNightlyAnalysisPage.js")
Check-Path "Patient night compare frontend exists" (Join-Path $FrontendSrc "pages\patient\PatientNightComparePage.js")

Section "8. Demo / Pilot Operational Readiness"

Check-Path "Pre-demo check script exists" (Join-Path $ProjectRoot "tools\raftop_pre_demo_check.ps1")
Check-Path "Phase 35 master script exists" (Join-Path $ProjectRoot "tools\verify_phase35_master_readiness.ps1")
Check-Path "Evidence report generator exists" (Join-Path $ProjectRoot "tools\generate_pre_demo_evidence_report.ps1")
Check-Path "Demo launcher exists" (Join-Path $ProjectRoot "tools\launch_raftop_demo.ps1")
Check-Path "Demo operator guide exists" (Join-Path $ProjectRoot "docs\RAFTOP_DEMO_OPERATOR_GUIDE.md")

Section "9. Frontend Build"

Push-Location $FrontendRoot

try {
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Ok "Frontend build passed"
    }
    else {
        Fail "Frontend build failed"
    }
}
catch {
    Fail "Frontend build crashed | $($_.Exception.Message)"
}
finally {
    Pop-Location
}

Section "10. Production Baseline Decision"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_BASELINE_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: PRODUCTION_BASELINE_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: PRODUCTION_BASELINE_BLOCKED" -ForegroundColor Red
exit 1