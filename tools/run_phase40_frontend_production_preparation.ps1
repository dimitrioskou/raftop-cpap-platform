# RAFTOP CPAP CARE Pro
# Phase 40.1 - Frontend Production Deployment Preparation
# Safe ASCII-only script
# Does not deploy anything and does not store secrets.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendDir = Join-Path $Root "enterprise-frontend"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase40_frontend_production_preparation_" + $Timestamp + ".md")

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

function Normalize-Url {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }

    return $Url.Trim().TrimEnd("/")
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

function Get-FrontendToolchain {
    $PackagePath = Join-Path $Root "enterprise-frontend\package.json"

    if (!(Test-Path $PackagePath)) {
        return "unknown"
    }

    $Content = Get-Content -Path $PackagePath -Raw -ErrorAction SilentlyContinue

    if ($Content -match '"vite"') {
        return "vite"
    }

    if ($Content -match '"react-scripts"') {
        return "cra"
    }

    return "unknown"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 40.1 Frontend Production Deployment Preparation" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This check verifies that the frontend is ready for production deployment preparation."
Write-ReportLine "It does not deploy anything and does not store secrets."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 40.1 frontend production preparation..."
Write-Host ""

$BackendUrl = Normalize-Url $BackendUrl

if ([string]::IsNullOrWhiteSpace($BackendUrl)) {
    Add-Result "Backend URL provided" "FAIL" "BackendUrl is empty."
} elseif ($BackendUrl -match "localhost" -or $BackendUrl -match "127.0.0.1") {
    Add-Result "Backend URL production check" "FAIL" "BackendUrl points to localhost."
} elseif ($BackendUrl -notmatch "^https://") {
    Add-Result "Backend URL HTTPS check" "FAIL" "BackendUrl must use https."
} else {
    Add-Result "Backend URL provided" "PASS" ("BackendUrl: " + $BackendUrl)
}

Test-DirectoryExists "enterprise-frontend" "Frontend directory"
Test-FileExists "enterprise-frontend\package.json" "Frontend package.json" "YES"
Test-FileExists "enterprise-frontend\.env.production.example" "Frontend production env template" "YES"

Test-FileContains "enterprise-frontend\package.json" '"build"' "Frontend package has build script" "YES"

$Toolchain = Get-FrontendToolchain

if ($Toolchain -eq "vite") {
    Add-Result "Frontend toolchain" "PASS" "Detected Vite."
    $ExpectedEnvKey = "VITE_API_BASE_URL"
    $ExpectedPublishDir = "dist"
} elseif ($Toolchain -eq "cra") {
    Add-Result "Frontend toolchain" "PASS" "Detected Create React App."
    $ExpectedEnvKey = "REACT_APP_API_BASE_URL"
    $ExpectedPublishDir = "build"
} else {
    Add-Result "Frontend toolchain" "WARN" "Could not clearly detect Vite or Create React App. Review package.json."
    $ExpectedEnvKey = "REACT_APP_API_BASE_URL or VITE_API_BASE_URL"
    $ExpectedPublishDir = "build or dist"
}

Test-FileContains "enterprise-frontend\.env.production.example" "API_BASE_URL" "Frontend env template includes API base URL key" "YES"

Test-NoFileExists "enterprise-frontend\.env.production" "No real frontend .env.production"
Test-NoFileExists "enterprise-frontend\.env.prod" "No real frontend .env.prod"
Test-NoFileExists "enterprise-frontend\.env.live" "No real frontend .env.live"

Test-FileExists "tools\run_phase39_backend_first_deploy_verification.ps1" "Phase 39.6 backend first deploy verification script" "YES"
Test-FileExists "tools\run_phase38_repository_safety_scan.ps1" "Repository safety scan runner" "YES"

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FRONTEND DEPLOYMENT SETTINGS"
Write-ReportLine ""
Write-ReportLine "Recommended platform:"
Write-ReportLine "Render Static Site"
Write-ReportLine ""
Write-ReportLine "Repository:"
Write-ReportLine "https://github.com/dimitrioskou/raftop-cpap-platform.git"
Write-ReportLine ""
Write-ReportLine "Branch:"
Write-ReportLine "main"
Write-ReportLine ""
Write-ReportLine "Root Directory:"
Write-ReportLine "enterprise-frontend"
Write-ReportLine ""
Write-ReportLine "Build Command:"
Write-ReportLine "npm install && npm run build"
Write-ReportLine ""
Write-ReportLine "Publish Directory:"
Write-ReportLine $ExpectedPublishDir
Write-ReportLine ""
Write-ReportLine "Production API env key:"
Write-ReportLine $ExpectedEnvKey
Write-ReportLine ""
Write-ReportLine "Production API env value:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "CRITICAL CORS FOLLOW-UP"
Write-ReportLine ""
Write-ReportLine "After frontend deployment, update backend CORS_ORIGIN in Render backend service to the final frontend URL."
Write-ReportLine ""
Write-ReportLine "Example:"
Write-ReportLine "CORS_ORIGIN=https://your-frontend.onrender.com"
Write-ReportLine ""
Write-ReportLine "Do not use wildcard CORS in production."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FRONTEND DEPLOYMENT CHECKLIST"
Write-ReportLine ""
Write-ReportLine "- Create Render Static Site: PENDING"
Write-ReportLine "- Connect repository: PENDING"
Write-ReportLine "- Select branch main: PENDING"
Write-ReportLine "- Set root directory enterprise-frontend: PENDING"
Write-ReportLine "- Set build command: PENDING"
Write-ReportLine "- Set publish directory: PENDING"
Write-ReportLine "- Set API base URL env var: PENDING"
Write-ReportLine "- Deploy frontend: PENDING"
Write-ReportLine "- Open frontend URL: PENDING"
Write-ReportLine "- Update backend CORS_ORIGIN: PENDING"
Write-ReportLine "- Redeploy backend after CORS update: PENDING"
Write-ReportLine "- Verify login route from frontend: PENDING"
Write-ReportLine "- Verify patient portal routes: PENDING"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "NEXT PHASE"
Write-ReportLine ""
Write-ReportLine "Phase 40.2 - Frontend Render Static Site Creation Checklist"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_PREPARATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_PREPARATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE40_FRONTEND_PRODUCTION_PREPARATION_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 40.1 Frontend Production Preparation"
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