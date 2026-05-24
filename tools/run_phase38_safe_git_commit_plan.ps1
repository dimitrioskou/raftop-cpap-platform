# RAFTOP CPAP CARE Pro
# Phase 38.6 - Safe Git Commit Plan
# Safe ASCII-only script
# Does not print secret values.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase38_safe_git_commit_plan_" + $Timestamp + ".md")

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

function Run-Git {
    param([string[]]$Args)

    Push-Location $Root

    try {
        $Output = & git @Args 2>&1
        $Code = $LASTEXITCODE
    } catch {
        $Output = $_.Exception.Message
        $Code = 1
    }

    Pop-Location

    return @{
        Code = $Code
        Output = $Output
    }
}

function Test-GitAvailable {
    try {
        $null = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
    }

    return $false
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.6 Safe Git Commit Plan" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report defines a safe Git commit plan before production deployment preparation is pushed."
Write-ReportLine "It does not print secret values and does not run git add or git commit automatically."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP safe Git commit plan..."
Write-Host ""

$GitAvailable = Test-GitAvailable
$GitDir = Join-Path $Root ".git"

if ($GitAvailable) {
    Add-Result "Git available" "PASS" "Git command is available."
} else {
    Add-Result "Git available" "FAIL" "Git command is not available."
}

if (Test-Path $GitDir) {
    Add-Result "Git repository detected" "PASS" ".git directory exists."
} else {
    Add-Result "Git repository detected" "FAIL" "No .git directory found."
}

if ($GitAvailable -and (Test-Path $GitDir)) {
    $BranchResult = Run-Git @("branch", "--show-current")
    $Branch = ($BranchResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($Branch)) {
        Add-Result "Current branch" "WARN" "Could not determine current branch."
    } else {
        Add-Result "Current branch" "PASS" ("Current branch: " + $Branch)
    }

    $RemoteResult = Run-Git @("remote", "-v")
    $RemoteText = ($RemoteResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($RemoteText)) {
        Add-Result "Git remote" "WARN" "No Git remote configured."
    } else {
        Add-Result "Git remote" "PASS" "Git remote is configured."
    }

    $StatusResult = Run-Git @("status", "--short")
    $StatusText = ($StatusResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($StatusText)) {
        Add-Result "Working tree status" "WARN" "Working tree is clean. Nothing to commit."
    } else {
        Add-Result "Working tree status" "PASS" "There are changes available for review and commit."
        Write-ReportLine "GIT_STATUS_SHORT:"
        Write-ReportLine $StatusText
        Write-ReportLine ""
    }

    $TrackedEnvResult = Run-Git @("ls-files")
    $TrackedFiles = @($TrackedEnvResult.Output)

    $TrackedRealEnvFiles = $TrackedFiles | Where-Object {
        $_ -eq ".env" -or
        $_ -like "*/.env" -or
        $_ -like "*.env.production" -or
        $_ -like "*/.env.production" -or
        $_ -like "*.env.prod" -or
        $_ -like "*/.env.prod" -or
        $_ -like "*.env.live" -or
        $_ -like "*/.env.live"
    }

    if ($TrackedRealEnvFiles.Count -gt 0) {
        Add-Result "Tracked real env files" "FAIL" ("Tracked env files found: " + ($TrackedRealEnvFiles -join "; "))
    } else {
        Add-Result "Tracked real env files" "PASS" "No tracked real env files found."
    }

    $ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\.git\\" -and
        ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")
    }

    if ($ProductionEnvFiles.Count -gt 0) {
        Add-Result "Production env files inside repo" "FAIL" "Production env files still exist inside repo."
    } else {
        Add-Result "Production env files inside repo" "PASS" "No real production env files found inside repo."
    }

    $LocalEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\.git\\" -and
        $_.Name -eq ".env"
    }

    if ($LocalEnvFiles.Count -gt 0) {
        Add-Result "Local env files" "WARN" "Local .env files exist. Do not stage them."
    } else {
        Add-Result "Local env files" "PASS" "No local .env files found."
    }

    $SubmoduleResult = Run-Git @("submodule", "status")
    $SubmoduleText = ($SubmoduleResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($SubmoduleText)) {
        Add-Result "Submodule status" "PASS" "No submodules reported."
    } else {
        Add-Result "Submodule status" "WARN" "Submodules exist. Do not assume submodule contents are committed by root repo."
        Write-ReportLine "SUBMODULE_STATUS:"
        Write-ReportLine $SubmoduleText
        Write-ReportLine ""
    }

    Write-ReportLine "------------------------------------------------------------"
    Write-ReportLine ""
    Write-ReportLine "SAFE COMMIT PLAN"
    Write-ReportLine ""
    Write-ReportLine "Recommended review commands:"
    Write-ReportLine ""
    Write-ReportLine "git status --short"
    Write-ReportLine "git diff -- .gitignore"
    Write-ReportLine "git diff -- tools"
    Write-ReportLine "git diff -- enterprise-backend/.env.production.example"
    Write-ReportLine "git diff -- enterprise-frontend/.env.production.example"
    Write-ReportLine ""
    Write-ReportLine "Recommended staging command:"
    Write-ReportLine ""
    Write-ReportLine "git add .gitignore tools enterprise-backend/.env.production.example enterprise-frontend/.env.production.example"
    Write-ReportLine ""
    Write-ReportLine "Do NOT stage:"
    Write-ReportLine ""
    Write-ReportLine ".env"
    Write-ReportLine ".env.production"
    Write-ReportLine ".env.prod"
    Write-ReportLine ".env.live"
    Write-ReportLine "node_modules"
    Write-ReportLine "RAFTOP_PRIVATE_ENV_BACKUP"
    Write-ReportLine "local private files"
    Write-ReportLine ""
    Write-ReportLine "Recommended commit command:"
    Write-ReportLine ""
    Write-ReportLine 'git commit -m "Add production deployment readiness and safety tooling"'
    Write-ReportLine ""
    Write-ReportLine "Recommended push command:"
    Write-ReportLine ""
    Write-ReportLine "git push"
    Write-ReportLine ""
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE38_SAFE_GIT_COMMIT_PLAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE38_SAFE_GIT_COMMIT_PLAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE38_SAFE_GIT_COMMIT_PLAN_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.6 Safe Git Commit Plan"
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